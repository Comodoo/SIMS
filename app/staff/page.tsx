'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { query } from '@/lib/graphql';
import { Award, BookOpen, Calendar, ClipboardList, Fingerprint, Star } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const PAGE_SIZE = 5;

function Paginator({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) {
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20">
      <span className="text-xs text-muted-foreground">{total === 0 ? 'No records' : `${from}–${to} of ${total}`}</span>
      <div className="flex items-center gap-1">
        <button disabled={page <= 1} onClick={() => onChange(page - 1)}
          className="px-2 py-1 rounded border bg-background text-xs disabled:opacity-40 hover:bg-muted transition-colors">‹</button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
          <button key={p} onClick={() => onChange(p)}
            className={`w-7 h-7 rounded text-xs font-medium transition-colors ${p === page ? 'bg-primary text-primary-foreground' : 'border bg-background hover:bg-muted'}`}>
            {p}
          </button>
        ))}
        <button disabled={page >= totalPages} onClick={() => onChange(page + 1)}
          className="px-2 py-1 rounded border bg-background text-xs disabled:opacity-40 hover:bg-muted transition-colors">›</button>
      </div>
    </div>
  );
}

const STAFF_PROFILE_QUERY = `
  query StaffProfile($userId: ID!) {
    staffByUser(userId: $userId) {
      id
      staff_number
      position
      is_active
      user { id first_name last_name email }
    }
  }
`;

const STAFF_DATA_QUERY = `
  query StaffData($staffId: ID!) {
    subjectTeachers(teacherId: $staffId) {
      id
      subjectId
      subjectName
      isPrimary
      assignedAt
    }
    attendance(userId: $staffId, limit: 200) {
      id
      status
      timestamp
      is_late
    }
    enrollments(limit: 2000) {
      id
      status
      course { id }
    }
    resultCards {
      id
      subject { id }
    }
  }
`;

interface SubjectAssignment {
  id: string;
  subjectId: string;
  subjectName: string;
  isPrimary: boolean;
  assignedAt: string;
}

export default function StaffDashboard() {
  const { user, token } = useAuth();
  const [staffId, setStaffId] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<SubjectAssignment[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [allEnrollments, setAllEnrollments] = useState<any[]>([]);
  const [allResultCards, setAllResultCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !token) return;

    async function fetchData() {
      try {
        // Step 1: get staff profile to obtain staff_id
        const profileRes = await query<any>(STAFF_PROFILE_QUERY, { userId: user!.id }, token!);
        const staffProfile = profileRes.staffByUser;
        if (!staffProfile) { setLoading(false); return; }

        const sid = staffProfile.id;
        setStaffId(sid);

        // Step 2: fetch subjects and attendance using staff_id
        const dataRes = await query<any>(STAFF_DATA_QUERY, { staffId: sid }, token!);
        setSubjects(dataRes.subjectTeachers ?? []);
        setAttendanceRecords(dataRes.attendance ?? []);
        setAllEnrollments(dataRes.enrollments ?? []);
        setAllResultCards(dataRes.resultCards ?? []);
      } catch (err) {
        console.error('Staff dashboard error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user, token]);

  const today = new Date().toISOString().split('T')[0];
  const todayRecords = attendanceRecords.filter(a => a.timestamp?.startsWith(today));
  const checkedInToday = todayRecords.some(a => a.status === 'in');
  const lateToday = todayRecords.some(a => a.is_late);

  const mySubjectIds = new Set(subjects.map(s => s.subjectId));
  // Active enrollments across my subjects
  const myEnrollments = allEnrollments.filter(e => e.status === 'active' && mySubjectIds.has(e.course.id));
  const myStudentCount = myEnrollments.length;
  // Result cards already computed for my subjects
  const myGradedCount = allResultCards.filter(rc => mySubjectIds.has(rc.subject.id)).length;

  const primarySubjects = subjects.filter(s => s.isPrimary);
  const otherSubjects = subjects.filter(s => !s.isPrimary);
  const [subjectsPage, setSubjectsPage] = useState(1);
  const pagedSubjects = [...primarySubjects, ...otherSubjects].slice((subjectsPage - 1) * PAGE_SIZE, subjectsPage * PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Teacher Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.first_name}! Here&apos;s your teaching overview.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-0 shadow-sm">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-white/70 shadow-sm">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-800">{loading ? '…' : subjects.length}</div>
                <p className="text-xs text-blue-600 font-medium">{primarySubjects.length} primary</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-0 shadow-sm ${
          checkedInToday && !lateToday ? 'bg-gradient-to-br from-green-50 to-emerald-100'
          : lateToday ? 'bg-gradient-to-br from-amber-50 to-yellow-100'
          : 'bg-gradient-to-br from-red-50 to-rose-100'
        }`}>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-white/70 shadow-sm">
                <Fingerprint className={`h-5 w-5 ${checkedInToday && !lateToday ? 'text-green-600' : lateToday ? 'text-amber-600' : 'text-red-500'}`} />
              </div>
              <div>
                <div className={`text-2xl font-bold ${checkedInToday && !lateToday ? 'text-green-800' : lateToday ? 'text-amber-800' : 'text-red-700'}`}>
                  {loading ? '…' : checkedInToday ? (lateToday ? 'Late' : 'In') : 'Out'}
                </div>
                <p className={`text-xs font-medium ${checkedInToday && !lateToday ? 'text-green-600' : lateToday ? 'text-amber-600' : 'text-red-500'}`}>
                  Today · {attendanceRecords.length} records
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-yellow-100 border-0 shadow-sm">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-white/70 shadow-sm">
                <Award className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-800">{loading ? '…' : myGradedCount}</div>
                <p className="text-xs text-amber-600 font-medium">
                  <Link href="/staff/grading" className="hover:underline">Result cards saved</Link>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-violet-100 border-0 shadow-sm">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-white/70 shadow-sm">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-800">{loading ? '…' : myStudentCount}</div>
                <p className="text-xs text-purple-600 font-medium">
                  <Link href="/staff/timetable" className="hover:underline">Total students</Link>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: '/staff/subjects', icon: BookOpen, label: 'My Subjects' },
          { href: '/staff/timetable', icon: Calendar, label: 'Timetable' },
          { href: '/staff/grading', icon: Award, label: 'Grading' },
          { href: '/staff/attendance', icon: ClipboardList, label: 'Attendance' },
        ].map(({ href, icon: Icon, label }) => (
          <Button key={href} variant="outline" className="h-16 flex flex-col gap-1.5" asChild>
            <Link href={href}>
              <Icon className="h-5 w-5" />
              <span className="text-xs">{label}</span>
            </Link>
          </Button>
        ))}
      </div>

      {/* Assigned subjects */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            My Assigned Subjects
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="h-10 bg-muted rounded animate-pulse" />)}
            </div>
          ) : subjects.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No subjects assigned yet. Contact the admin to get assigned.
            </p>
          ) : (
            <>
              <div className="space-y-2">
                {pagedSubjects.map(s => (
                  <div key={s.id} className="flex items-center justify-between rounded-lg border px-4 py-3">
                    <div className="flex items-center gap-2">
                      {s.isPrimary && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                      <span className="font-medium text-sm">{s.subjectName}</span>
                    </div>
                    <Badge variant={s.isPrimary ? 'default' : 'secondary'}>
                      {s.isPrimary ? 'Primary' : 'Support'}
                    </Badge>
                  </div>
                ))}
              </div>
              <Paginator page={subjectsPage} total={subjects.length} onChange={setSubjectsPage} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

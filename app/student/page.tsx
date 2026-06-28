'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { query } from '@/lib/graphql';
import { Award, BookOpen, Calendar, ChevronLeft, ChevronRight, ClipboardList } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const STUDENT_PROFILE_QUERY = `
  query StudentProfile($userId: ID!) {
    studentByUser(userId: $userId) {
      id
      student_number
      grade_level
      section
      status
      user { id first_name last_name }
    }
  }
`;

const TIMETABLE_QUERY = `
  query DashboardTimetable {
    timetable {
      id classGroup dayOfWeek startTime endTime
      subject { name }
    }
  }
`;

const STUDENT_DATA_QUERY = `
  query StudentData($studentId: ID!) {
    enrollments(studentId: $studentId, limit: 100) {
      id
      status
      semester
      academic_year
      course {
        id
        name
        course_code
        semester
      }
    }
    studentAttendanceRecords(studentId: $studentId, limit: 200) {
      id
      date
      status
    }
    resultCards(studentId: $studentId) {
      id
      semesterName
      totalScore
      gradeLetter
      remarks
      subject { id name course_code }
    }
  }
`;

interface Enrollment {
  id: string;
  status: string;
  semester: string;
  academic_year: string;
  course: { id: string; name: string; course_code: string; semester: string };
}

export default function StudentDashboard() {
  const { user, token } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [resultCards, setResultCards] = useState<any[]>([]);
  const [todayClasses, setTodayClasses] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [subjectPage, setSubjectPage] = useState(1);

  useEffect(() => {
    if (!user || !token) return;

    async function fetchData() {
      try {
        // Step 1: get student profile to obtain student_id
        const profileRes = await query<any>(STUDENT_PROFILE_QUERY, { userId: user!.id }, token!);
        const studentProfile = profileRes.studentByUser;
        if (!studentProfile) { setLoading(false); return; }

        // Step 2: fetch enrollments, attendance, results + timetable in parallel
        const [dataRes, ttRes] = await Promise.all([
          query<any>(STUDENT_DATA_QUERY, { studentId: studentProfile.id }, token!),
          query<any>(TIMETABLE_QUERY, {}, token!),
        ]);
        setEnrollments(dataRes.enrollments ?? []);
        setAttendanceRecords(dataRes.studentAttendanceRecords ?? []);
        setResultCards(dataRes.resultCards ?? []);

        // Count today's timetable slots for this student's class group
        const todayName = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][new Date().getDay()];
        const classGroup = studentProfile.grade_level ?? '';
        const todaySlots = (ttRes.timetable ?? []).filter((s: any) =>
          s.dayOfWeek === todayName &&
          (classGroup ? s.classGroup.toLowerCase().includes(classGroup.toLowerCase()) : true)
        );
        setTodayClasses(todaySlots.length);
      } catch (err) {
        console.error('Student dashboard error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user, token]);

  const SUBJECTS_PER_PAGE = 5;

  const activeEnrollments = enrollments.filter(e => e.status === 'active');
  const subjectTotalPages = Math.max(1, Math.ceil(activeEnrollments.length / SUBJECTS_PER_PAGE));
  const pagedEnrollments = activeEnrollments.slice(
    (subjectPage - 1) * SUBJECTS_PER_PAGE,
    subjectPage * SUBJECTS_PER_PAGE,
  );
  const presentCount = attendanceRecords.filter(a => a.status === 'present').length;
  const attendancePct = attendanceRecords.length > 0
    ? Math.round((presentCount / attendanceRecords.length) * 100)
    : 0;
  const passedSubjects = resultCards.filter(r => r.gradeLetter && r.gradeLetter !== 'F').length;

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Student Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.first_name}! Here&apos;s your academic overview.
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
                <div className="text-2xl font-bold text-blue-800">{loading ? '…' : activeEnrollments.length}</div>
                <p className="text-xs text-blue-600 font-medium">Subjects enrolled</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-0 shadow-sm">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-white/70 shadow-sm">
                <ClipboardList className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-800">{loading ? '…' : `${attendancePct}%`}</div>
                <p className="text-xs text-green-600 font-medium">{presentCount}/{attendanceRecords.length} present</p>
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
                <div className="text-2xl font-bold text-amber-800">{loading ? '…' : resultCards.length}</div>
                <p className="text-xs text-amber-600 font-medium">{passedSubjects} passed</p>
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
                <div className="text-2xl font-bold text-purple-800">
                  {loading ? '…' : todayClasses === null ? '—' : todayClasses}
                </div>
                <p className="text-xs text-purple-600 font-medium">
                  <Link href="/student/timetable" className="hover:underline">Classes today</Link>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: '/student/timetable', icon: Calendar, label: 'Timetable' },
          { href: '/student/results', icon: Award, label: 'Results' },
          { href: '/student/attendance', icon: ClipboardList, label: 'Attendance' },
          { href: '/student/subjects', icon: BookOpen, label: 'Subjects' },
        ].map(({ href, icon: Icon, label }) => (
          <Button key={label} variant="outline" className="h-16 flex flex-col gap-1.5" asChild>
            <Link href={href}>
              <Icon className="h-5 w-5" />
              <span className="text-xs">{label}</span>
            </Link>
          </Button>
        ))}
      </div>

      {/* Enrolled subjects */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              My Enrolled Subjects
            </span>
            {!loading && activeEnrollments.length > 0 && (
              <span className="text-xs font-normal text-muted-foreground">
                {activeEnrollments.length} subject{activeEnrollments.length !== 1 ? 's' : ''}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="h-10 bg-muted rounded animate-pulse" />)}
            </div>
          ) : activeEnrollments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Not enrolled in any subjects yet. Contact your admin or teacher.
            </p>
          ) : (
            <>
              <div className="space-y-2">
                {pagedEnrollments.map(e => (
                  <div key={e.id} className="flex items-center justify-between rounded-lg border px-4 py-3">
                    <div>
                      <p className="font-medium text-sm">{e.course.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{e.course.course_code}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {e.course.semester && (
                        <span className="text-xs text-muted-foreground">{e.course.semester}</span>
                      )}
                      <Badge variant="default">Active</Badge>
                    </div>
                  </div>
                ))}
              </div>

              {subjectTotalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-3 border-t">
                  <span className="text-xs text-muted-foreground">
                    Page {subjectPage} of {subjectTotalPages}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      disabled={subjectPage === 1}
                      onClick={() => setSubjectPage(p => p - 1)}
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      disabled={subjectPage === subjectTotalPages}
                      onClick={() => setSubjectPage(p => p + 1)}
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Recent results */}
      {resultCards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2"><Award className="h-4 w-4" />Recent Results</span>
              <Link href="/student/results" className="text-sm font-normal text-primary hover:underline">
                View all
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {resultCards.slice(0, 5).map(r => (
                <div key={r.id} className="flex items-center justify-between rounded-lg border px-4 py-2.5">
                  <div>
                    <p className="font-medium text-sm">{r.subject?.name}</p>
                    <p className="text-xs text-muted-foreground">{r.semesterName}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm">{r.totalScore != null ? Number(r.totalScore).toFixed(1) : '—'}/100</span>
                    <Badge variant={r.gradeLetter === 'F' ? 'destructive' : 'default'}>
                      {r.gradeLetter ?? '—'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

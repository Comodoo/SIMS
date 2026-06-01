'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { query } from '@/lib/graphql';
import { Award, BookOpen, Calendar, ClipboardList } from 'lucide-react';
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

  const activeEnrollments = enrollments.filter(e => e.status === 'active');
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Subjects</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '…' : activeEnrollments.length}</div>
            <p className="text-xs text-muted-foreground">Enrolled this term</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Attendance</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '…' : `${attendancePct}%`}</div>
            <p className="text-xs text-muted-foreground">{presentCount} / {attendanceRecords.length} present</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Results</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '…' : resultCards.length}</div>
            <p className="text-xs text-muted-foreground">{passedSubjects} passed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Timetable</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '…' : todayClasses === null ? '—' : todayClasses}
            </div>
            <p className="text-xs text-muted-foreground">
              {todayClasses !== null
                ? <><Link href="/student/timetable" className="text-primary hover:underline">Classes today</Link></>
                : <Link href="/student/timetable" className="text-primary hover:underline">View schedule</Link>}
            </p>
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
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            My Enrolled Subjects
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
            <div className="space-y-2">
              {activeEnrollments.map(e => (
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

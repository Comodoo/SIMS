'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { query } from '@/lib/graphql';
import { BookOpen, Calendar, FileText, User } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const STUDENT_DASHBOARD_QUERY = `
  query StudentDashboard($studentId: ID!) {
    student(id: $studentId) {
      id
      student_number
      first_name
      last_name
    }
    enrollments(studentId: $studentId, limit: 50) {
      id
      status
      midterm_grade
      final_grade
      letter_grade
      course {
        id
        course_code
        name
      }
    }
    student_attendance_records(studentId: $studentId, limit: 100) {
      id
      status
      date
    }
    assignments(limit: 50) {
      id
      title
      due_date
      is_published
      course {
        id
        course_code
        name
      }
    }
  }
`;

export default function StudentDashboard() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState({
    enrolledCourses: 0,
    pendingAssignments: 0,
    attendancePercentage: 0,
    gpa: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !token) return;

    const fetchDashboardData = async () => {
      try {
        const response = await query<any>(STUDENT_DASHBOARD_QUERY, { studentId: user.id }, token);
        
        // Calculate stats from GraphQL response
        const enrollments = response.enrollments || [];
        const attendanceRecords = response.student_attendance_records || [];
        const assignments = response.assignments || [];
        
        // Count active enrollments
        const activeEnrollments = enrollments.filter((e: any) => e.status === 'active').length;
        
        // Count pending assignments
        const pendingAssignments = assignments.filter((a: any) => a.is_published).length;
        
        // Calculate attendance percentage
        const presentCount = attendanceRecords.filter((a: any) => a.status === 'present').length;
        const attendancePercentage = attendanceRecords.length > 0 
          ? Math.round((presentCount / attendanceRecords.length) * 100) 
          : 0;
        
        // Calculate GPA from enrollments (simplified)
        const gradedEnrollments = enrollments.filter((e: any) => e.letter_grade);
        const gpa = gradedEnrollments.length > 0
          ? (gradedEnrollments.reduce((sum: number, e: any) => {
              const gradeMap: Record<string, number> = { 'A': 4.0, 'B': 3.0, 'C': 2.0, 'D': 1.0, 'F': 0.0 };
              return sum + (gradeMap[e.letter_grade] || 0);
            }, 0) / gradedEnrollments.length).toFixed(1)
          : '0.0';
        
        setStats({
          enrolledCourses: activeEnrollments,
          pendingAssignments,
          attendancePercentage,
          gpa: parseFloat(gpa as string),
        });
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, token]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Student Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.first_name}! Here&apos;s your academic overview.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enrolled Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.enrolledCourses}</div>
            <p className="text-xs text-muted-foreground">Active this semester</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assignments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.pendingAssignments}</div>
            <p className="text-xs text-muted-foreground">Active assignments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : `${stats.attendancePercentage}%`}</div>
            <p className="text-xs text-muted-foreground">This semester</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">GPA</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.gpa}</div>
            <p className="text-xs text-muted-foreground">Current semester</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Button variant="outline" className="h-20 flex flex-col gap-2" asChild>
          <Link href="/student/grades">
            <BookOpen className="h-6 w-6" />
            <span>View Grades</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-20 flex flex-col gap-2" asChild>
          <Link href="/student/assignments">
            <FileText className="h-6 w-6" />
            <span>Assignments</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-20 flex flex-col gap-2" asChild>
          <Link href="/student/attendance">
            <Calendar className="h-6 w-6" />
            <span>Attendance</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-20 flex flex-col gap-2" asChild>
          <Link href="/student/grades">
            <User className="h-6 w-6" />
            <span>Grades</span>
          </Link>
        </Button>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-500" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Assignment submitted</p>
                <p className="text-sm text-muted-foreground">Data Science Project - Python for Data Science</p>
              </div>
              <div className="text-sm text-muted-foreground">2 hours ago</div>
            </div>

            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-green-500" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Course enrolled</p>
                <p className="text-sm text-muted-foreground">Advanced Machine Learning</p>
              </div>
              <div className="text-sm text-muted-foreground">Yesterday</div>
            </div>

            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-purple-500" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Attendance marked</p>
                <p className="text-sm text-muted-foreground">Python for Data Science - Present</p>
              </div>
              <div className="text-sm text-muted-foreground">2 days ago</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

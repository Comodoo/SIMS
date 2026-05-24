'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { query } from '@/lib/graphql';
import { BookOpen, Calendar, FileText, Shield, Users } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const STAFF_DASHBOARD_QUERY = `
  query StaffDashboard($staffId: ID!) {
    staff(id: $staffId) {
      id
      first_name
      last_name
      employee_number
    }
    courses(instructorId: $staffId, limit: 50) {
      id
      course_code
      name
      credits
      level
      department
    }
    submissions(limit: 100) {
      id
      grade
      submitted_at
      assignment {
        id
        title
        course {
          id
          course_code
          name
        }
      }
      student {
        id
        first_name
        last_name
        student_number
      }
    }
    enrollments(limit: 100) {
      id
      student {
        id
        first_name
        last_name
      }
      course {
        id
        course_code
        name
      }
    }
  }
`;

export default function StaffDashboard() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState({
    myCourses: 0,
    totalStudents: 0,
    pendingGrading: 0,
    leaveBalance: 18, // Default value until HR module is implemented
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !token) return;

    const fetchDashboardData = async () => {
      try {
        const response = await query('staffDashboard', STAFF_DASHBOARD_QUERY, { staffId: user.id }, token);
        
        const courses = response.courses || [];
        const submissions = response.submissions || [];
        const enrollments = response.enrollments || [];
        
        // Count courses taught by this staff
        const myCourses = courses.length;
        
        // Count unique students across all courses
        const uniqueStudents = new Set(enrollments.map((e: any) => e.student.id)).size;
        
        // Count submissions without grades
        const pendingGrading = submissions.filter((s: any) => !s.grade).length;
        
        setStats({
          myCourses,
          totalStudents: uniqueStudents,
          pendingGrading,
          leaveBalance: 18, // TODO: Fetch from HR module when implemented
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
        <h1 className="text-3xl font-bold mb-2">Staff Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.first_name}! Manage your courses, students, and attendance.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.myCourses}</div>
            <p className="text-xs text-muted-foreground">Active courses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">Across all courses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Grading</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.pendingGrading}</div>
            <p className="text-xs text-muted-foreground">Submissions to grade</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leave Balance</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.leaveBalance}</div>
            <p className="text-xs text-muted-foreground">Days remaining</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Button variant="outline" className="h-20 flex flex-col gap-2" asChild>
          <Link href="/staff/courses">
            <BookOpen className="h-6 w-6" />
            <span>My Courses</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-20 flex flex-col gap-2" asChild>
          <Link href="/staff/grading">
            <FileText className="h-6 w-6" />
            <span>Grade Submissions</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-20 flex flex-col gap-2" asChild>
          <Link href="/staff/attendance">
            <Calendar className="h-6 w-6" />
            <span>Mark Attendance</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-20 flex flex-col gap-2" asChild>
          <Link href="/staff/leave">
            <Shield className="h-6 w-6" />
            <span>Leave Requests</span>
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
                <p className="font-medium">Assignment graded</p>
                <p className="text-sm text-muted-foreground">Python Project - Student: John Doe (85/100)</p>
              </div>
              <div className="text-sm text-muted-foreground">1 hour ago</div>
            </div>

            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-green-500" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Attendance marked</p>
                <p className="text-sm text-muted-foreground">Python for Data Science - 45 students present</p>
              </div>
              <div className="text-sm text-muted-foreground">3 hours ago</div>
            </div>

            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-purple-500" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Leave request approved</p>
                <p className="text-sm text-muted-foreground">Annual leave - 5 days (Dec 20-25)</p>
              </div>
              <div className="text-sm text-muted-foreground">Yesterday</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

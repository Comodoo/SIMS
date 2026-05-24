'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { query } from '@/lib/graphql';
import { BookOpen, FileText, Fingerprint, GraduationCap, Shield, Users } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const ADMIN_DASHBOARD_QUERY = `
  query AdminDashboard {
    students(limit: 1000) {
      id
    }
    staff(limit: 100) {
      id
    }
    courses(limit: 100) {
      id
    }
    attendance(limit: 100) {
      id
      status
      timestamp
    }
  }
`;

export default function AdminDashboard() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalStaff: 0,
    totalCourses: 0,
    attendanceRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !token) return;

    const fetchDashboardData = async () => {
      try {
        const response = await query('adminDashboard', ADMIN_DASHBOARD_QUERY, {}, token);
        
        const students = response.students || [];
        const staff = response.staff || [];
        const courses = response.courses || [];
        const attendance = response.attendance || [];

        // Calculate attendance rate for today
        const today = new Date().toISOString().split('T')[0];
        const todayAttendance = attendance.filter((a: any) => 
          a.timestamp && a.timestamp.startsWith(today)
        );
        const clockedInCount = todayAttendance.filter((a: any) => a.status === 'in').length;
        const attendanceRate = staff.length > 0 ? Math.round((clockedInCount / staff.length) * 100) : 0;

        setStats({
          totalStudents: students.length,
          totalStaff: staff.length,
          totalCourses: courses.length,
          attendanceRate,
        });
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, token]);

  if (loading) {
    return <div>Loading dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold">SIMS</span>
          </Link>
        </nav>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Complete system management and oversight.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
              <p className="text-xs text-muted-foreground">Active enrollment</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStaff}</div>
              <p className="text-xs text-muted-foreground">Teaching & admin</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCourses}</div>
              <p className="text-xs text-muted-foreground">Active courses</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Attendance</CardTitle>
              <Fingerprint className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.attendanceRate}%</div>
              <p className="text-xs text-muted-foreground">Staff present</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Button variant="outline" className="h-20 flex flex-col gap-2" asChild>
            <Link href="/admin/users">
              <Users className="h-6 w-6" />
              <span>Manage Users</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-20 flex flex-col gap-2" asChild>
            <Link href="/admin/courses">
              <BookOpen className="h-6 w-6" />
              <span>Manage Courses</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-20 flex flex-col gap-2" asChild>
            <Link href="/admin/attendance">
              <Fingerprint className="h-6 w-6" />
              <span>Attendance</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-20 flex flex-col gap-2" asChild>
            <Link href="/admin/reports">
              <FileText className="h-6 w-6" />
              <span>Reports</span>
            </Link>
          </Button>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              Recent activity data will be available once the system is in use.
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

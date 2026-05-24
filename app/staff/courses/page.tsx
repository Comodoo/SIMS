'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { query } from '@/lib/graphql';
import { BookOpen, Calendar, Clock, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

const STAFF_COURSES_QUERY = `
  query StaffCourses($staffId: ID!) {
    courses(instructorId: $staffId, limit: 50) {
      id
      course_code
      name
      credits
      level
      department
      schedule
    }
    enrollments(limit: 100) {
      id
      course {
        id
        course_code
        name
      }
      student {
        id
        first_name
        last_name
      }
    }
  }
`;

export default function StaffCoursesPage() {
  const { user, token } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !token) return;

    const fetchCourses = async () => {
      try {
        const response = await query('staffCourses', STAFF_COURSES_QUERY, { staffId: user.id }, token);
        
        setCourses(response.courses || []);
        setEnrollments(response.enrollments || []);
      } catch (error) {
        console.error('Failed to fetch courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [user, token]);

  // Calculate stats
  const totalCourses = courses.length;
  const totalStudents = new Set(enrollments.map((e: any) => e.student.id)).size;
  const avgClassSize = totalCourses > 0 ? Math.round(totalStudents / totalCourses) : 0;
  const upcomingClasses = courses.filter((c: any) => c.schedule && c.schedule.includes('Mon') || c.schedule?.includes('Tue')).length;

  if (loading) {
    return <div>Loading courses...</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Courses</h1>
        <p className="text-muted-foreground">Manage your courses and view student enrollment</p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCourses}</div>
            <p className="text-xs text-muted-foreground">Active courses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground">Across all courses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Class Size</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgClassSize}</div>
            <p className="text-xs text-muted-foreground">Students per class</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingClasses}</div>
            <p className="text-xs text-muted-foreground">Classes scheduled</p>
          </CardContent>
        </Card>
      </div>

      {/* Courses List */}
      <div className="grid md:grid-cols-2 gap-6">
        {courses.map((course) => {
          const courseEnrollments = enrollments.filter((e: any) => e.course.id === course.id);
          const studentCount = courseEnrollments.length;
          
          return (
            <Card key={course.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{course.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{course.course_code}</p>
                  </div>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    Active
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{studentCount} students enrolled</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{course.schedule || 'TBD'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span>{course.department || 'General'}</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" className="flex-1">
                    View Students
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    Take Attendance
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

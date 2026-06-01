'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { query } from '@/lib/graphql';
import { BookOpen, Star, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

const STAFF_PROFILE_QUERY = `
  query StaffProfile($userId: ID!) {
    staffByUser(userId: $userId) {
      id
      staff_number
      position
    }
  }
`;

const STAFF_COURSES_QUERY = `
  query StaffCourses($staffId: ID!) {
    subjectTeachers(teacherId: $staffId) {
      id
      subjectId
      subjectName
      isPrimary
      assignedAt
    }
    enrollments(limit: 2000) {
      id
      course { id }
      student { id first_name last_name student_number }
    }
  }
`;

export default function StaffCoursesPage() {
  const { user, token } = useAuth();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !token) return;

    const fetchData = async () => {
      try {
        const profileRes = await query<any>(STAFF_PROFILE_QUERY, { userId: user.id }, token);
        const profile = profileRes.staffByUser;
        if (!profile) { setLoading(false); return; }

        const dataRes = await query<any>(STAFF_COURSES_QUERY, { staffId: profile.id }, token);
        setSubjects(dataRes.subjectTeachers ?? []);
        setEnrollments(dataRes.enrollments ?? []);
      } catch (error) {
        console.error('Failed to fetch courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, token]);

  const getStudentCount = (subjectId: string) =>
    enrollments.filter((e: any) => e.course?.id === subjectId).length;

  const getStudents = (subjectId: string) =>
    enrollments.filter((e: any) => e.course?.id === subjectId).map((e: any) => e.student);

  const primarySubjects = subjects.filter(s => s.isPrimary);
  const otherSubjects = subjects.filter(s => !s.isPrimary);
  const totalStudents = new Set(
    subjects.flatMap(s => getStudents(s.subjectId).map((st: any) => st.id))
  ).size;

  if (loading) return <div className="p-6">Loading courses...</div>;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Courses</h1>
        <p className="text-muted-foreground">Subjects you are assigned to teach</p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subjects</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subjects.length}</div>
            <p className="text-xs text-muted-foreground">{primarySubjects.length} primary</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground">Across all subjects</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Primary Subjects</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{primarySubjects.length}</div>
            <p className="text-xs text-muted-foreground">{otherSubjects.length} support</p>
          </CardContent>
        </Card>
      </div>

      {/* Subject cards */}
      {subjects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No subjects assigned</h3>
            <p className="text-muted-foreground text-center text-sm">
              Contact the admin to get assigned to subjects.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {[...primarySubjects, ...otherSubjects].map((subject) => {
            const studentCount = getStudentCount(subject.subjectId);
            return (
              <Card key={subject.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {subject.isPrimary && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />}
                      <CardTitle className="text-lg">{subject.subjectName}</CardTitle>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      subject.isPrimary
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {subject.isPrimary ? 'Primary' : 'Support'}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <Users className="h-4 w-4" />
                    <span>{studentCount} student{studentCount !== 1 ? 's' : ''} enrolled</span>
                  </div>
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <a href={`/staff/grading`}>Grade Students</a>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

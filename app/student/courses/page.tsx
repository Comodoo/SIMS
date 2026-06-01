'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { query } from '@/lib/graphql';
import { BookOpen, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';

const STUDENT_PROFILE_QUERY = `
  query StudentProfile($userId: ID!) {
    studentByUser(userId: $userId) {
      id
      student_number
    }
  }
`;

const STUDENT_COURSES_QUERY = `
  query StudentCourses($studentId: ID!) {
    enrollments(studentId: $studentId, limit: 50) {
      id
      status
      semester
      academic_year
      midterm_grade
      final_grade
      letter_grade
      course {
        id
        course_code
        name
        credits
        status
      }
    }
  }
`;

export default function StudentCoursesPage() {
  const { user, token } = useAuth();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || !token) return;

    const fetchCourses = async () => {
      try {
        const profileRes = await query<any>(STUDENT_PROFILE_QUERY, { userId: user.id }, token);
        const profile = profileRes.studentByUser;
        if (!profile) { setLoading(false); return; }

        const data = await query<any>(STUDENT_COURSES_QUERY, { studentId: profile.id }, token);
        setEnrollments(data.enrollments || []);
      } catch (err) {
        setError('Failed to load courses');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [user?.id, token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-lg">Loading courses...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Courses</h1>
        <p className="text-muted-foreground">View your enrolled courses and progress</p>
      </div>

      {enrollments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No courses enrolled</h3>
            <p className="text-muted-foreground text-center">
              You are not currently enrolled in any courses.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {enrollments.map((enrollment) => (
            <Card key={enrollment.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-start justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1 font-mono">
                      {enrollment.course.course_code}
                    </div>
                    <div className="text-lg">{enrollment.course.name}</div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs flex-shrink-0 ${
                    enrollment.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {enrollment.status}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center text-sm text-muted-foreground gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{enrollment.course.credits} Credit{enrollment.course.credits !== 1 ? 's' : ''}</span>
                  {enrollment.semester && (
                    <span className="ml-auto text-xs">{enrollment.semester}</span>
                  )}
                </div>

                {enrollment.letter_grade && (
                  <div className="border-t pt-4">
                    <div className="text-sm font-medium mb-2">Current Grade</div>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">{enrollment.letter_grade}</span>
                      {enrollment.final_grade != null && (
                        <span className="text-muted-foreground">
                          {Number(enrollment.final_grade).toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <Button className="w-full" variant="outline" size="sm">
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

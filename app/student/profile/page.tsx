'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { query } from '@/lib/graphql';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, MapPin, Calendar, BookOpen, GraduationCap } from 'lucide-react';
import { useEffect, useState } from 'react';

const STUDENT_PROFILE_QUERY = `
  query StudentProfile($userId: ID!) {
    studentByUser(userId: $userId) {
      id
      student_number
      first_name
      last_name
      date_of_birth
      address
      enrollment_date
      status
      grade_level
      section
      academic_year
      programme
      user { username email phone }
    }
  }
`;

export default function StudentProfilePage() {
  const { user, token } = useAuth();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !token) return;

    const fetchProfile = async () => {
      try {
        const response = await query<any>(STUDENT_PROFILE_QUERY, { userId: user.id }, token);
        setStudent(response.studentByUser);
      } catch (error) {
        console.error('Failed to fetch student profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, token]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">Loading profile...</div>;
  }

  if (!student) {
    return <div className="text-center py-20">Student profile not found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-6 mb-8">
        <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${student.first_name}`} />
          <AvatarFallback>{student.first_name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-3xl font-bold">{student.first_name} {student.last_name}</h1>
          <p className="text-muted-foreground">{student.programme || 'Undergraduate Student'}</p>
          <div className="flex gap-2 mt-2">
            <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>
              {student.status.toUpperCase()}
            </Badge>
            <Badge variant="outline">{student.student_number}</Badge>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Contact Info */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{student.user.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{student.user.phone || 'No phone provided'}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{student.address || 'No address provided'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Academic Details */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Academic Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase font-semibold">Grade Level</p>
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-primary" />
                  <p className="font-medium">{student.grade_level || 'N/A'}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase font-semibold">Section</p>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <p className="font-medium">{student.section || 'N/A'}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase font-semibold">Enrollment Date</p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <p className="font-medium">{new Date(student.enrollment_date).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase font-semibold">Academic Year</p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <p className="font-medium">{student.academic_year}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Profile Button */}
      <div className="flex justify-end">
        <Button variant="outline">Edit Profile</Button>
      </div>
    </div>
  );
}

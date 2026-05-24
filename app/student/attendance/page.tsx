'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { mutate, query } from '@/lib/graphql';
import { AlertTriangle, BookOpen, CheckCircle, Clock, Fingerprint, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

const STUDENT_ATTENDANCE_QUERY = `
  query StudentAttendance($studentId: ID!) {
    enrollments(studentId: $studentId, limit: 50) {
      id
      status
      course {
        id
        course_code
        name
        schedule
        department
      }
    }
    studentAttendanceRecords(studentId: $studentId, limit: 100) {
      id
      date
      status
      course {
        id
        course_code
        name
      }
      marked_at
      marked_by {
        username
        first_name
        last_name
      }
      notes
    }
  }
`;

const BIOMETRIC_ATTENDANCE_MUTATION = `
  mutation MarkStudentBiometricAttendance($studentId: ID!, $courseId: ID!, $biometricHash: String!) {
    markStudentBiometricAttendance(studentId: $studentId, courseId: $courseId, biometricHash: $biometricHash) {
      success
      message
    }
  }
`;

export default function StudentAttendancePage() {
  const { user, token } = useAuth();
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [markedCourses, setMarkedCourses] = useState<Set<string>>(new Set());
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!user || !token) return;

    const fetchAttendanceData = async () => {
      try {
        const response = await query('studentAttendance', STUDENT_ATTENDANCE_QUERY, { studentId: user.id }, token);
        
        setEnrollments(response.enrollments || []);
        setAttendanceHistory(response.studentAttendanceRecords || []);
        
        // Mark courses that already have attendance today
        const today = new Date().toISOString().split('T')[0];
        const todayMarked = new Set(
          (response.studentAttendanceRecords || [])
            .filter((r: any) => r.date === today)
            .map((r: any) => r.course.id)
        );
        setMarkedCourses(todayMarked);
      } catch (error) {
        console.error('Failed to fetch attendance data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceData();
  }, [user, token]);

  const simulateBiometricScan = async (): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return true;
  };

  const handleMarkAttendance = async (courseId: string, courseName: string) => {
    setProcessing(courseId);
    setMessage('');

    try {
      const biometricVerified = await simulateBiometricScan();

      if (biometricVerified) {
        // Use GraphQL mutation to mark attendance
        const response = await mutate('markStudentBiometricAttendance', BIOMETRIC_ATTENDANCE_MUTATION, {
          studentId: user?.id,
          courseId,
          biometricHash: 'mock_hash', // In production, get from actual biometric device
        }, token);

        if (response.markStudentBiometricAttendance.success) {
          setMarkedCourses(prev => new Set(prev).add(courseId));
          setMessage(`Attendance marked for ${courseName}`);
        } else {
          setMessage(response.markStudentBiometricAttendance.message || 'Failed to mark attendance');
        }
      } else {
        setMessage('Biometric verification failed. Please try again.');
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      setMessage('Error marking attendance. Please try again.');
    } finally {
      setProcessing(null);
    }
  };

  const formatTime = (date: Date | null) => {
    if (!date) return '--:--:--';
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isWithinClassTime = (schedule: string) => {
    if (!currentTime || !schedule) return false;
    const hour = currentTime.getHours();
    const minute = currentTime.getMinutes();
    const currentTimeMinutes = hour * 60 + minute;

    // Parse schedule like "08:00 AM - 10:00 AM"
    const startTime = schedule.split(' - ')[0];
    const [time, period] = startTime.split(' ');
    const [h, m] = time.split(':').map(Number);
    let classStartMinutes = h * 60 + m;
    if (period === 'PM' && h !== 12) classStartMinutes += 12 * 60;

    // Allow marking 15 minutes before class starts until 30 minutes after
    return currentTimeMinutes >= (classStartMinutes - 15) &&
           currentTimeMinutes <= (classStartMinutes + 30);
  };

  // Calculate stats from attendance history
  const stats = {
    total: attendanceHistory.length,
    present: attendanceHistory.filter((r: any) => r.status === 'present').length,
    absent: attendanceHistory.filter((r: any) => r.status === 'absent').length,
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Course Attendance</h1>
        <p className="text-muted-foreground">Mark attendance for your enrolled courses using biometric verification</p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">This semester</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.present}</div>
            <p className="text-xs text-muted-foreground">{((stats.present / stats.total) * 100).toFixed(0)}% attendance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
            <p className="text-xs text-muted-foreground">{((stats.absent / stats.total) * 100).toFixed(0)}% absence</p>
          </CardContent>
        </Card>
      </div>

      {/* Current Time Display */}
      <Card className="mb-8 bg-gradient-to-br from-primary/10 to-primary/5">
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">{formatDate(currentTime)}</p>
            <div className="text-5xl font-bold">{formatTime(currentTime)}</div>
          </div>
        </CardContent>
      </Card>

      {message && (
        <div className={`mb-6 p-4 rounded-lg text-center ${
          message.includes('marked')
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      {/* Course Attendance Cards */}
      <h2 className="text-xl font-bold mb-4">Today's Classes</h2>
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        {enrollments.map((enrollment) => {
          const course = enrollment.course;
          const isMarked = markedCourses.has(course.id);
          const canMark = isWithinClassTime(course.schedule);

          return (
            <Card key={enrollment.id} className={isMarked ? 'border-green-500 border-2' : ''}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-lg">{course.course_code}</h3>
                    <p className="text-sm text-muted-foreground">{course.name}</p>
                  </div>
                  {isMarked && (
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      Present
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{course.schedule || 'TBD'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    <span>Department: {course.department}</span>
                  </div>
                </div>

                {!isMarked && (
                  <Button
                    onClick={() => handleMarkAttendance(course.id, course.name)}
                    disabled={processing === course.id || !canMark}
                    className="w-full"
                  >
                    {processing === course.id ? (
                      <>
                        <Fingerprint className="h-4 w-4 mr-2 animate-pulse" />
                        Scanning...
                      </>
                    ) : (
                      <>
                        <Fingerprint className="h-4 w-4 mr-2" />
                        Mark Attendance
                      </>
                    )}
                  </Button>
                )}

                {!canMark && !isMarked && (
                  <p className="text-xs text-orange-600 mt-2 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Available 15 min before class
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Attendance History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Attendance History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {attendanceHistory.slice(0, 10).map((record) => (
              <div key={record.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    record.status === 'present' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {record.status === 'present' ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{record.course.course_code} - {record.course.name}</p>
                    <p className="text-sm text-muted-foreground">{record.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    record.status === 'present'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {record.status === 'present' ? 'Present' : 'Absent'}
                  </span>
                  {record.status === 'present' && record.marked_at && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Checked in: {new Date(record.marked_at).toLocaleTimeString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { mutate, query } from '@/lib/graphql';
import { AlertTriangle, CheckCircle, Clock, Fingerprint, LogIn, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';

const STAFF_ATTENDANCE_QUERY = `
  query StaffAttendance($staffId: ID!) {
    staff(id: $staffId) {
      id
      first_name
      last_name
      employee_number
    }
    attendance(staffId: $staffId, limit: 20) {
      id
      timestamp
      status
      is_late
    }
  }
`;

const CLOCK_IN_MUTATION = `
  mutation ClockIn($staffId: ID!, $biometricHash: String!) {
    clockIn(staffId: $staffId, biometricHash: $biometricHash) {
      success
      message
      attendance {
        id
        timestamp
        status
        is_late
      }
    }
  }
`;

const CLOCK_OUT_MUTATION = `
  mutation ClockOut($staffId: ID!, $biometricHash: String!) {
    clockOut(staffId: $staffId, biometricHash: $biometricHash) {
      success
      message
      attendance {
        id
        timestamp
        status
        is_late
      }
    }
  }
`;

export default function StaffAttendancePage() {
  const { user, token } = useAuth();
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [clockedIn, setClockedIn] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!user || !token) return;

    const fetchAttendance = async () => {
      try {
        const response = await query('staffAttendance', STAFF_ATTENDANCE_QUERY, { staffId: user.id }, token);
        
        const attendance = response.attendance || [];
        setAttendanceRecords(attendance);
        
        // Check if the most recent attendance is a clock-in
        if (attendance.length > 0) {
          const latest = attendance[0];
          setClockedIn(latest.status === 'in');
        }
      } catch (error) {
        console.error('Failed to fetch attendance:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [user, token]);

  const handleClockIn = async () => {
    setProcessing(true);
    setMessage('');
    
    try {
      // Simulate biometric verification
      const biometricVerified = await simulateBiometricScan();
      
      if (biometricVerified) {
        // Generate a mock biometric hash (in production, this would come from actual biometric scan)
        const biometricHash = generateMockBiometricHash();
        
        const response = await mutate('clockIn', CLOCK_IN_MUTATION, {
          staffId: user.id,
          biometricHash,
        }, token);

        if (response.clockIn.success) {
          setAttendanceRecords([response.clockIn.attendance, ...attendanceRecords]);
          setClockedIn(true);
          setMessage('Successfully clocked in!');
        } else {
          setMessage(response.clockIn.message || 'Failed to clock in');
        }
      } else {
        setMessage('Biometric verification failed. Please try again.');
      }
    } catch (error) {
      console.error('Error clocking in:', error);
      setMessage('Error clocking in. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleClockOut = async () => {
    setProcessing(true);
    setMessage('');
    
    try {
      const biometricVerified = await simulateBiometricScan();
      
      if (biometricVerified) {
        const biometricHash = generateMockBiometricHash();
        
        const response = await mutate('clockOut', CLOCK_OUT_MUTATION, {
          staffId: user.id,
          biometricHash,
        }, token);

        if (response.clockOut.success) {
          setAttendanceRecords([response.clockOut.attendance, ...attendanceRecords]);
          setClockedIn(false);
          setMessage('Successfully clocked out!');
        } else {
          setMessage(response.clockOut.message || 'Failed to clock out');
        }
      } else {
        setMessage('Biometric verification failed. Please try again.');
      }
    } catch (error) {
      console.error('Error clocking out:', error);
      setMessage('Error clocking out. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const simulateBiometricScan = async (): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return true;
  };

  const generateMockBiometricHash = (): string => {
    // In production, this would be the actual biometric hash from the fingerprint scanner
    return `mock_hash_${Date.now()}`;
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

  const isLate = () => {
    if (!currentTime) return false;
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    return (hours > 8 || (hours === 8 && minutes > 15));
  };

  if (loading) {
    return <div>Loading attendance data...</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Biometric Attendance</h1>
        <p className="text-muted-foreground">Clock in and out using your fingerprint</p>
      </div>

      {/* Clock Card */}
      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        {/* Time Display */}
        <Card className="border-2 bg-gradient-to-br from-primary/10 to-primary/5">
          <CardHeader>
            <CardTitle className="text-center">Current Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-6xl font-bold mb-4">{formatTime(currentTime)}</div>
              <div className="text-xl text-muted-foreground">{formatDate(currentTime)}</div>
              
              {isLate() && !clockedIn && (
                <div className="mt-4 flex items-center justify-center gap-2 text-orange-600">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="font-medium">You are late for your shift</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Biometric Clock In/Out */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-center">Biometric Scanner</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex flex-col items-center justify-center py-8">
                <div className={`h-32 w-32 rounded-full flex items-center justify-center mb-4 ${
                  processing ? 'bg-primary/20 animate-pulse' : 'bg-primary/10'
                }`}>
                  <Fingerprint className={`h-16 w-16 ${processing ? 'text-primary animate-pulse' : 'text-primary'}`} />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  {processing ? 'Scanning fingerprint...' : 'Place your finger on the scanner'}
                </p>
              </div>

              {message && (
                <div className={`p-4 rounded-lg text-center ${
                  message.includes('Successfully') 
                    ? 'bg-green-50 text-green-800 border border-green-200' 
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {message}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {!clockedIn ? (
                  <Button
                    onClick={handleClockIn}
                    disabled={processing || clockedIn}
                    className="w-full h-16 text-lg"
                    size="lg"
                  >
                    <LogIn className="h-6 w-6 mr-2" />
                    Clock In
                  </Button>
                ) : (
                  <Button
                    onClick={handleClockOut}
                    disabled={processing || !clockedIn}
                    variant="outline"
                    className="w-full h-16 text-lg"
                    size="lg"
                  >
                    <LogOut className="h-6 w-6 mr-2" />
                    Clock Out
                  </Button>
                )}

                <div className="flex items-center justify-center">
                  {clockedIn ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">Clocked In</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="h-5 w-5" />
                      <span>Not Clocked In</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Attendance */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle>Today's Attendance Record</CardTitle>
        </CardHeader>
        <CardContent>
          {attendanceRecords.length > 0 ? (
            <div className="space-y-4">
              {attendanceRecords.map((attendance: any) => (
                <div key={attendance.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      attendance.status === 'in' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {attendance.status === 'in' ? (
                        <LogIn className="h-5 w-5 text-green-600" />
                      ) : (
                        <LogOut className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium capitalize">
                        {attendance.status === 'in' ? 'Clocked In' : 'Clocked Out'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(attendance.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  {attendance.is_late && (
                    <span className="text-xs px-2 py-1 bg-orange-100 text-orange-800 rounded-full">
                      Late
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No attendance recorded today
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

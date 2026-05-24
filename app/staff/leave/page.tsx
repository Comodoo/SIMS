'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth-context';
import { mutate, query } from '@/lib/graphql';
import { Calendar, CheckCircle, Clock, Hourglass, Send, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

const STAFF_LEAVES_QUERY = `
  query StaffLeaves($staff_id: ID!) {
    leaves(staff_id: $staff_id) {
      id
      staff {
        id
        staff_number
        user {
          id
          first_name
          last_name
        }
      }
      leave_type
      start_date
      end_date
      total_days
      reason
      status
      approved_by {
        id
        first_name
        last_name
      }
      approved_at
      rejection_reason
      applied_at
      updated_at
    }
    leave_balances(staff_id: $staff_id) {
      id
      year
      annual_entitlement
      annual_used
      annual_remaining
      sick_entitlement
      sick_used
      sick_remaining
      emergency_used
      unpaidUsed
    }
  }
`;

const CREATE_LEAVE_MUTATION = `
  mutation CreateLeave($input: LeaveInput!) {
    createLeaveRequest(input: $input) {
      success
      message
      leave {
        id
        leaveType
        startDate
        endDate
        totalDays
        reason
        status
        appliedAt
      }
    }
  }
`;

interface Leave {
  id: string;
  staff: {
    id: string;
    staffNumber: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
    };
  };
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: string;
  approvedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  approvedAt?: string;
  rejectionReason?: string;
  appliedAt: string;
  updatedAt: string;
}

interface LeaveBalance {
  id: string;
  year: number;
  annualEntitlement: number;
  annualUsed: number;
  annualRemaining: number;
  sickEntitlement: number;
  sickUsed: number;
  sickRemaining: number;
  emergencyUsed: number;
  unpaidUsed: number;
}

export default function StaffLeavePage() {
  const { user, token } = useAuth();
  const [leaveType, setLeaveType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaves();
  }, [user, token]);

  const fetchLeaves = async () => {
    if (!user || !token) return;

    try {
      const data = await query(STAFF_LEAVES_QUERY, { staff_id: user.id }, token);
      if (data.leaves) {
        setLeaves(data.leaves);
      }
      if (data.leaveBalances && data.leaveBalances.length > 0) {
        setLeaveBalance(data.leaveBalances[0]);
      }
    } catch (error) {
      console.error('Error fetching leaves:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (!user || !token) {
      setSubmitting(false);
      return;
    }

    try {
      const data = await mutate(
        CREATE_LEAVE_MUTATION,
        {
          input: {
            staff_id: user.id,
            leave_type: leaveType,
            start_date: startDate,
            end_date: endDate,
            reason,
          },
        },
        token
      );

      if (data.createLeaveRequest?.success) {
        setLeaveType('');
        setStartDate('');
        setEndDate('');
        setReason('');
        await fetchLeaves();
      }
    } catch (error) {
      console.error('Error creating leave request:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'pending':
        return <Hourglass className="h-5 w-5 text-orange-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-50 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-50 text-red-800 border-red-200';
      case 'pending':
        return 'bg-orange-50 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-50 text-gray-800 border-gray-200';
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Leave Requests</h1>
        <p className="text-muted-foreground">Request and track your leave applications</p>
      </div>

        {/* Leave Balance Card */}
        <Card className="mb-8 border-2 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="text-lg">Leave Balance</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-muted-foreground">Loading balance...</p>
            ) : leaveBalance ? (
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{leaveBalance.annualRemaining}</p>
                  <p className="text-sm text-muted-foreground">Annual Days</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{leaveBalance.sickRemaining}</p>
                  <p className="text-sm text-muted-foreground">Sick Days</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{leaveBalance.emergencyUsed}</p>
                  <p className="text-sm text-muted-foreground">Emergency Used</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{leaveBalance.unpaidUsed}</p>
                  <p className="text-sm text-muted-foreground">Unpaid Used</p>
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground">No balance information available</p>
            )}
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Leave Request Form */}
          <div className="lg:col-span-1">
            <Card className="border-2 sticky top-4">
              <CardHeader>
                <CardTitle className="text-lg">Request Leave</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="leaveType">Leave Type</Label>
                    <select
                      id="leaveType"
                      value={leaveType}
                      onChange={(e) => setLeaveType(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border rounded-md"
                      required
                    >
                      <option value="">Select type</option>
                      <option value="annual">Annual Leave</option>
                      <option value="sick">Sick Leave</option>
                      <option value="emergency">Emergency Leave</option>
                      <option value="maternity">Maternity Leave</option>
                      <option value="paternity">Paternity Leave</option>
                      <option value="unpaid">Unpaid Leave</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="reason">Reason</Label>
                    <textarea
                      id="reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border rounded-md min-h-[100px]"
                      required
                      placeholder="Please provide a reason for your leave request"
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? (
                      'Submitting...'
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Submit Request
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Leave History */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Leave History</h2>

              {loading ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">Loading leave history...</p>
                  </CardContent>
                </Card>
              ) : leaves.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No leave requests found.</p>
                  </CardContent>
                </Card>
              ) : (
                leaves.map((leave) => (
                  <Card key={leave.id} className="border-2">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold capitalize">{leave.leaveType} Leave</h3>
                            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(leave.status)}`}>
                              {leave.status}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>{leave.totalDays} days</span>
                            </div>
                          </div>

                          <p className="text-sm text-muted-foreground">
                            {leave.reason}
                          </p>

                          {leave.rejectionReason && (
                            <p className="text-sm text-red-600 mt-2">
                              Rejection reason: {leave.rejectionReason}
                            </p>
                          )}

                          <p className="text-xs text-muted-foreground mt-2">
                            Requested on {new Date(leave.appliedAt).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="ml-4">
                          {getStatusIcon(leave.status)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
  );
}

'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, CheckCircle2, Edit, Save, Trash2, XCircle } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ResultDetailPage() {
  const params = useParams();
  const router = useRouter();
  
  const [result, setResult] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const [formData, setFormData] = useState({
    cat1Score: 0,
    cat2Score: 0,
    assignmentScore: 0,
    finalExamScore: 0,
    remarks: '',
  });

  useEffect(() => {
    // Mock loading result - in real app would fetch from API
    const mockResult = {
      id: params.id,
      studentProfileId: '1',
      registrationNumber: 'CS/001/2024',
      studentName: 'John Doe',
      academicYear: '2024/2025',
      semester: 'first',
      courseOfferingId: '1',
      courseCode: 'CS 101',
      courseName: 'Introduction to Programming',
      credits: 3,
      cat1Score: 15,
      cat2Score: 18,
      assignmentScore: 12,
      caScore: 45, // Continuous Assessment (CAT1 + CAT2 + Assignment)
      finalExamScore: 45,
      ueScore: 45, // University Examination
      totalScore: 90,
      grade: 'A',
      gradePoints: 4.0,
      instructorId: 'staff-1',
      instructorName: 'Dr. Sarah Ochieng',
      status: 'draft',
      submittedAt: new Date().toISOString(),
      approvedAt: null,
      remarks: '',
    };
    setResult(mockResult);
    setFormData({
      cat1Score: mockResult.cat1Score,
      cat2Score: mockResult.cat2Score,
      assignmentScore: mockResult.assignmentScore,
      finalExamScore: mockResult.finalExamScore,
      remarks: mockResult.remarks,
    });
  }, [params.id]);

  const calculateGrade = (totalScore: number) => {
    if (totalScore >= 90) return { grade: 'A', points: 4.0 };
    if (totalScore >= 85) return { grade: 'A-', points: 3.7 };
    if (totalScore >= 80) return { grade: 'B+', points: 3.3 };
    if (totalScore >= 75) return { grade: 'B', points: 3.0 };
    if (totalScore >= 70) return { grade: 'B-', points: 2.7 };
    if (totalScore >= 65) return { grade: 'C+', points: 2.3 };
    if (totalScore >= 60) return { grade: 'C', points: 2.0 };
    if (totalScore >= 55) return { grade: 'C-', points: 1.7 };
    if (totalScore >= 50) return { grade: 'D+', points: 1.3 };
    if (totalScore >= 45) return { grade: 'D', points: 1.0 };
    return { grade: 'F', points: 0.0 };
  };

  const onSubmit = async () => {
    const caScore = (formData.cat1Score || 0) + (formData.cat2Score || 0) + (formData.assignmentScore || 0);
    const ueScore = formData.finalExamScore;
    const totalScore = caScore + ueScore;
    const { grade, points } = calculateGrade(totalScore);
    
    setResult({
      ...result,
      ...formData,
      caScore,
      ueScore,
      totalScore,
      grade,
      gradePoints: points,
    });
    
    setIsEditing(false);
  };

  const handleSubmitResult = async () => {
    setResult({ ...result, status: 'submitted' });
  };

  const handleApprove = async () => {
    setResult({ ...result, status: 'approved', approvedAt: new Date().toISOString() });
  };

  const handleReject = async () => {
    setResult({ ...result, status: 'rejected' });
    setRejectDialogOpen(false);
    setRejectionReason('');
  };

  const handleDelete = async () => {
    router.push('/staff/grading');
  };

  const getGradeColor = (grade: string) => {
    const colors: Record<string, string> = {
      'A': 'bg-green-100 text-green-800',
      'A-': 'bg-green-100 text-green-800',
      'B+': 'bg-blue-100 text-blue-800',
      'B': 'bg-blue-100 text-blue-800',
      'B-': 'bg-blue-100 text-blue-800',
      'C+': 'bg-yellow-100 text-yellow-800',
      'C': 'bg-yellow-100 text-yellow-800',
      'C-': 'bg-yellow-100 text-yellow-800',
      'D+': 'bg-orange-100 text-orange-800',
      'D': 'bg-orange-100 text-orange-800',
      'F': 'bg-red-100 text-red-800',
    };
    return colors[grade] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      draft: 'secondary',
      submitted: 'default',
      approved: 'default',
      rejected: 'destructive',
    };
    return <Badge variant={variants[status]} className="capitalize">{status}</Badge>;
  };

  if (!result) {
    return (
      <div>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Result Not Found</h2>
          <Button onClick={() => router.push('/staff/grading')}>Back to Results</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={onSubmit}>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              {result.status === 'draft' && (
                <Button onClick={handleSubmitResult}>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Submit
                </Button>
              )}
              {result.status === 'submitted' && (
                <>
                  <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700">
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  <Button variant="destructive" onClick={() => setRejectDialogOpen(true)}>
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </>
              )}
              <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Student Information */}
          <Card>
            <CardHeader>
              <CardTitle>Student Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Student Name</p>
                  <p className="font-medium">{result.studentName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Registration Number</p>
                  <p className="font-medium">{result.registrationNumber}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Course Information */}
          <Card>
            <CardHeader>
              <CardTitle>Course Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Course Code</p>
                  <p className="font-medium">{result.courseCode}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Course Name</p>
                  <p className="font-medium">{result.courseName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Credits</p>
                  <p className="font-medium">{result.credits}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Instructor</p>
                  <p className="font-medium">{result.instructorName}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Scores */}
          <Card>
            <CardHeader>
              <CardTitle>Score Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-6">
                  <div>
                    <p className="text-sm font-medium text-blue-600 mb-3">Continuous Assessment (CA) - 40%</p>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>CAT 1</Label>
                        <Input type="number" min="0" max="100" value={formData.cat1Score} onChange={(e) => setFormData(prev => ({ ...prev, cat1Score: parseInt(e.target.value) || 0 }))} />
                      </div>
                      <div>
                        <Label>CAT 2</Label>
                        <Input type="number" min="0" max="100" value={formData.cat2Score} onChange={(e) => setFormData(prev => ({ ...prev, cat2Score: parseInt(e.target.value) || 0 }))} />
                      </div>
                      <div>
                        <Label>Assignment</Label>
                        <Input type="number" min="0" max="100" value={formData.assignmentScore} onChange={(e) => setFormData(prev => ({ ...prev, assignmentScore: parseInt(e.target.value) || 0 }))} />
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-purple-600 mb-3">University Examination (UE) - 60%</p>
                    <div>
                      <Label>Final Exam</Label>
                      <Input type="number" min="0" max="100" value={formData.finalExamScore} onChange={(e) => setFormData(prev => ({ ...prev, finalExamScore: parseInt(e.target.value) || 0 }))} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-sm font-medium text-blue-600 mb-3">Continuous Assessment (CA) - 40%</p>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">CAT 1</p>
                        <p className="font-medium text-xl">{result.cat1Score || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">CAT 2</p>
                        <p className="font-medium text-xl">{result.cat2Score || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Assignment</p>
                        <p className="font-medium text-xl">{result.assignmentScore || '-'}</p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">CA Total</p>
                        <p className="font-bold text-2xl text-blue-600">{result.caScore || '-'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                    <p className="text-sm font-medium text-purple-600 mb-3">University Examination (UE) - 60%</p>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">Final Exam</p>
                      <p className="font-bold text-2xl text-purple-600">{result.ueScore || '-'}</p>
                    </div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Total Score (CA + UE)</p>
                      <p className="font-bold text-3xl">{result.totalScore}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Remarks */}
          {isEditing ? (
            <Card>
              <CardHeader>
                <CardTitle>Remarks</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea 
                  placeholder="Add remarks about this result..." 
                  value={formData.remarks}
                  onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                />
              </CardContent>
            </Card>
          ) : (
            result.remarks && (
              <Card>
                <CardHeader>
                  <CardTitle>Remarks</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{result.remarks}</p>
                </CardContent>
              </Card>
            )
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>Result Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                {getStatusBadge(result.status)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Grade</span>
                <Badge className={getGradeColor(result.grade)}>{result.grade}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Grade Points</span>
                <span className="font-medium">{result.gradePoints.toFixed(1)}</span>
              </div>
              <div className="pt-4 border-t space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Submitted</span>
                  <span className="text-sm">{new Date(result.submittedAt).toLocaleDateString()}</span>
                </div>
                {result.approvedAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Approved</span>
                    <span className="text-sm">{new Date(result.approvedAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Academic Period */}
          <Card>
            <CardHeader>
              <CardTitle>Academic Period</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Academic Year</span>
                <span className="font-medium">{result.academicYear}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Semester</span>
                <span className="font-medium capitalize">{result.semester}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Result</DialogTitle>
            <DialogDescription>Please provide a reason for rejecting this result.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Rejection Reason</Label>
              <Textarea
                placeholder="Enter the reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectionReason}>Reject Result</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Result</DialogTitle>
            <DialogDescription>Are you sure you want to delete this result? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

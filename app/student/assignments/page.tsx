'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth-context';
import { mutate, query } from '@/lib/graphql';
import { Calendar, CheckCircle, Clock, FileText, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';

const ASSIGNMENTS_QUERY = `
  query StudentAssignments($studentId: ID!) {
    enrollments(studentId: $studentId, limit: 50) {
      id
      course {
        id
        course_code
        name
      }
    }
    assignments(limit: 100) {
      id
      title
      description
      due_date
      max_points
      is_published
      course {
        id
        course_code
        name
      }
    }
    submissions(studentId: $studentId, limit: 100) {
      id
      assignment {
        id
        title
      }
      submitted_at
      grade
      feedback
      file_url
    }
  }
`;

const SUBMIT_ASSIGNMENT_MUTATION = `
  mutation SubmitAssignment($assignmentId: ID!, $studentId: ID!, $fileUrl: String!) {
    submitAssignment(assignmentId: $assignmentId, studentId: $studentId, fileUrl: $fileUrl) {
      success
      message
      submission {
        id
        submitted_at
        grade
      }
    }
  }
`;

export default function StudentAssignmentsPage() {
  const { user, token } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !token) return;

    const fetchAssignments = async () => {
      try {
        const response = await query('studentAssignments', ASSIGNMENTS_QUERY, { studentId: user.id }, token);
        
        setAssignments(response.assignments || []);
        setSubmissions(response.submissions || []);
        setEnrollments(response.enrollments || []);
      } catch (error) {
        console.error('Failed to fetch assignments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [user, token]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (assignmentId: string) => {
    if (!selectedFile || !user) return;
    
    setUploading(true);
    
    try {
      // TODO: Upload file to cloud storage (S3/DigitalOcean)
      // For now, using a mock file URL
      const fileUrl = `https://storage.example.com/${selectedFile.name}`;
      
      const response = await mutate('submitAssignment', SUBMIT_ASSIGNMENT_MUTATION, {
        assignmentId,
        studentId: user.id,
        fileUrl,
      }, token);

      if (response.submitAssignment.success) {
        // Add new submission to state
        setSubmissions([...submissions, response.submitAssignment.submission]);
        setSelectedFile(null);
      }
    } catch (error) {
      console.error('Error submitting assignment:', error);
    } finally {
      setUploading(false);
    }
  };

  const isDueSoon = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays > 0;
  };

  const isOverdue = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    return due < now;
  };

  const getSubmissionForAssignment = (assignmentId: string) => {
    return submissions.find((s: any) => s.assignment.id === assignmentId);
  };

  const isEnrolledInCourse = (courseId: string) => {
    return enrollments.some((e: any) => e.course.id === courseId);
  };

  if (loading) {
    return <div>Loading assignments...</div>;
  }

  // Filter assignments to only show enrolled courses
  const enrolledAssignments = assignments.filter((a: any) => isEnrolledInCourse(a.course.id));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Assignments</h1>
        <p className="text-muted-foreground">View and submit your course assignments</p>
      </div>

        {/* Assignment List */}
        <div className="space-y-4">
          {enrolledAssignments.map((assignment: any) => {
            const submission = getSubmissionForAssignment(assignment.id);
            const overdue = isOverdue(assignment.due_date);
            const dueSoon = isDueSoon(assignment.due_date);
            
            return (
              <Card key={assignment.id} className="border-2">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{assignment.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mb-4">
                        {assignment.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className={overdue ? 'text-red-600 font-medium' : dueSoon ? 'text-orange-600 font-medium' : ''}>
                            Due: {new Date(assignment.due_date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>Max Points: {assignment.max_points}</span>
                        </div>
                      </div>
                    </div>
                    {submission && (
                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                    )}
                  </div>
                </CardHeader>
                {!submission && !overdue && (
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor={`file-${assignment.id}`}>
                          Upload Assignment File
                        </Label>
                        <div className="mt-2">
                          <Input
                            id={`file-${assignment.id}`}
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={handleFileSelect}
                            className="cursor-pointer"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Accepted formats: PDF, DOC, DOCX
                        </p>
                      </div>

                      {selectedFile && (
                        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <span className="text-sm flex-1">{selectedFile.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                      )}

                      <Button
                        onClick={() => handleSubmit(assignment.id)}
                        disabled={!selectedFile || uploading}
                        className="w-full"
                      >
                        {uploading ? (
                          'Uploading...'
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Submit Assignment
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                )}

                {submission && (
                  <CardContent>
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 text-green-800">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-medium">Submitted</span>
                      </div>
                      <p className="text-sm text-green-700 mt-1">
                        Submitted on {new Date(submission.submitted_at).toLocaleDateString()}
                      </p>
                      {submission.grade && (
                        <p className="text-sm text-green-700 mt-1">
                          Grade: {submission.grade}/{assignment.max_points}
                        </p>
                      )}
                    </div>
                  </CardContent>
                )}

                {overdue && !submission && (
                  <CardContent>
                    <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-center gap-2 text-red-800">
                        <Clock className="h-5 w-5" />
                        <span className="font-medium">Overdue</span>
                      </div>
                      <p className="text-sm text-red-700 mt-1">
                        This assignment was due on {new Date(assignment.due_date).toLocaleDateString()}
                      </p>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

      {enrolledAssignments.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No assignments available at this time.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

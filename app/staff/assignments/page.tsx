'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/lib/auth-context';
import { mutate, query } from '@/lib/graphql';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, CheckCircle2, Edit, Eye, Plus, Trash2, Upload, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

const STAFF_ASSIGNMENTS_QUERY = `
  query StaffAssignments($staffId: ID!) {
    courses(instructorId: $staffId, limit: 50) {
      id
      course_code
      name
      credits
      level
      department
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
  }
`;

const ASSIGNMENT_SUBMISSIONS_QUERY = `
  query AssignmentSubmissions($assignmentId: ID!) {
    submissions(assignmentId: $assignmentId, limit: 100) {
      id
      submitted_at
      grade
      feedback
      file_url
      assignment {
        id
        title
        max_points
      }
      student {
        id
        first_name
        last_name
        student_number
      }
    }
  }
`;

const CREATE_ASSIGNMENT_MUTATION = `
  mutation CreateAssignment($title: String!, $description: String!, $courseId: ID!, $dueDate: String!, $maxPoints: Int!) {
    createAssignment(title: $title, description: $description, courseId: $courseId, dueDate: $dueDate, maxPoints: $maxPoints) {
      success
      message
      assignment {
        id
        title
        description
        due_date
        max_points
        course {
          id
          course_code
          name
        }
      }
    }
  }
`;

const UPDATE_ASSIGNMENT_MUTATION = `
  mutation UpdateAssignment($assignmentId: ID!, $title: String!, $description: String!, $dueDate: String!, $maxPoints: Int!) {
    updateAssignment(assignmentId: $assignmentId, title: $title, description: $description, dueDate: $dueDate, maxPoints: $maxPoints) {
      success
      message
      assignment {
        id
        title
        description
        due_date
        max_points
      }
    }
  }
`;

const DELETE_ASSIGNMENT_MUTATION = `
  mutation DeleteAssignment($assignmentId: ID!) {
    deleteAssignment(assignmentId: $assignmentId) {
      success
      message
    }
  }
`;

const GRADE_SUBMISSION_MUTATION = `
  mutation GradeSubmission($submissionId: ID!, $grade: Float!, $feedback: String!) {
    gradeSubmission(submissionId: $submissionId, grade: $grade, feedback: $feedback) {
      success
      message
      submission {
        id
        grade
        feedback
      }
    }
  }
`;

export default function StaffAssignmentsPage() {
  const { user, token } = useAuth();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submissionsDialogOpen, setSubmissionsDialogOpen] = useState(false);
  const [gradingDialogOpen, setGradingDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    courseId: '',
    dueDate: undefined as Date | undefined,
    maxPoints: 100,
  });

  const [gradingForm, setGradingForm] = useState({
    score: 0,
    feedback: '',
  });

  useEffect(() => {
    if (!user || !token) return;

    const fetchAssignments = async () => {
      try {
        const response = await query('staffAssignments', STAFF_ASSIGNMENTS_QUERY, { staffId: user.id }, token);
        
        setCourses(response.courses || []);
        setAssignments(response.assignments || []);
      } catch (error) {
        console.error('Failed to fetch assignments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [user, token]);

  const handleCreateAssignment = async () => {
    try {
      const response = await mutate('createAssignment', CREATE_ASSIGNMENT_MUTATION, {
        title: formData.title,
        description: formData.description,
        courseId: formData.courseId,
        dueDate: formData.dueDate?.toISOString().split('T')[0] || '',
        maxPoints: formData.maxPoints,
      }, token);

      if (response.createAssignment.success) {
        setAssignments([response.createAssignment.assignment, ...assignments]);
        setDialogOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error('Failed to create assignment:', error);
    }
  };

  const handleEditAssignment = (assignment: any) => {
    setSelectedAssignment(assignment);
    setFormData({
      title: assignment.title,
      description: assignment.description,
      courseId: assignment.course.id,
      dueDate: assignment.due_date ? new Date(assignment.due_date) : undefined,
      maxPoints: assignment.max_points,
    });
    setDialogOpen(true);
  };

  const handleUpdateAssignment = async () => {
    try {
      const response = await mutate('updateAssignment', UPDATE_ASSIGNMENT_MUTATION, {
        assignmentId: selectedAssignment.id,
        title: formData.title,
        description: formData.description,
        dueDate: formData.dueDate?.toISOString().split('T')[0] || '',
        maxPoints: formData.maxPoints,
      }, token);

      if (response.updateAssignment.success) {
        setAssignments(assignments.map(a => 
          a.id === selectedAssignment.id 
            ? { ...a, ...response.updateAssignment.assignment }
            : a
        ));
        setDialogOpen(false);
        setSelectedAssignment(null);
        resetForm();
      }
    } catch (error) {
      console.error('Failed to update assignment:', error);
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    try {
      const response = await mutate('deleteAssignment', DELETE_ASSIGNMENT_MUTATION, { assignmentId: id }, token);
      
      if (response.deleteAssignment.success) {
        setAssignments(assignments.filter(a => a.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete assignment:', error);
    }
  };

  const handleViewSubmissions = async (assignment: any) => {
    setSelectedAssignment(assignment);
    setLoading(true);
    
    try {
      const response = await query('assignmentSubmissions', ASSIGNMENT_SUBMISSIONS_QUERY, { assignmentId: assignment.id }, token);
      setSubmissions(response.submissions || []);
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
    } finally {
      setLoading(false);
    }
    
    setSubmissionsDialogOpen(true);
  };

  const handleGradeSubmission = (submission: any) => {
    setSelectedSubmission(submission);
    setGradingForm({
      score: submission.grade || 0,
      feedback: submission.feedback || '',
    });
    setGradingDialogOpen(true);
  };

  const handleSaveGrade = async () => {
    try {
      const response = await mutate('gradeSubmission', GRADE_SUBMISSION_MUTATION, {
        submissionId: selectedSubmission.id,
        grade: gradingForm.score,
        feedback: gradingForm.feedback,
      }, token);

      if (response.gradeSubmission.success) {
        setSubmissions(submissions.map(s => 
          s.id === selectedSubmission.id 
            ? { ...s, ...response.gradeSubmission.submission }
            : s
        ));
        setGradingDialogOpen(false);
        setSelectedSubmission(null);
      }
    } catch (error) {
      console.error('Failed to save grade:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      courseId: '',
      dueDate: undefined,
      maxPoints: 100,
    });
    setAttachments([]);
    setSelectedAssignment(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(Array.from(e.target.files));
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const getSubmissionStatusBadge = (grade: number | null) => {
    if (grade !== null) {
      return <Badge className="bg-green-100 text-green-800">Graded</Badge>;
    }
    return <Badge className="bg-blue-100 text-blue-800">Submitted</Badge>;
  };

  if (loading) {
    return <div>Loading assignments...</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Assignments</h1>
        <p className="text-muted-foreground">Create and manage course assignments, view submissions, and grade student work</p>
      </div>

      <div className="flex gap-2 mb-8">
        <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Create Assignment
        </Button>
      </div>

      {/* Assignments List */}
      <div className="space-y-4">
        {assignments.map((assignment) => (
          <Card key={assignment.id} className="border-2">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2">{assignment.title}</CardTitle>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{assignment.course.course_code} - {assignment.course.name}</span>
                    <span>•</span>
                    <span>Due: {assignment.due_date ? format(new Date(assignment.due_date), 'MMM dd, yyyy') : 'No due date'}</span>
                    <span>•</span>
                    <span>Max Points: {assignment.max_points}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleViewSubmissions(assignment)}>
                    <Eye className="w-4 h-4 mr-2" />
                    Submissions
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleEditAssignment(assignment)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteAssignment(assignment.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4">{assignment.description}</p>
              <div className="flex items-center gap-2">
                {assignment.is_published ? (
                  <Badge className="bg-green-100 text-green-800">Published</Badge>
                ) : (
                  <Badge className="bg-yellow-100 text-yellow-800">Draft</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {assignments.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No assignments created yet.</p>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      {dialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {selectedAssignment ? 'Edit Assignment' : 'Create New Assignment'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <Label>Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Assignment title"
                />
              </div>

              <div>
                <Label>Description *</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Assignment description and instructions"
                  rows={4}
                />
              </div>

              <div>
                <Label>Course *</Label>
                <Select value={formData.courseId} onValueChange={(value) => setFormData({ ...formData, courseId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.course_code} - {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Due Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.dueDate ? format(formData.dueDate, 'PPP') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.dueDate}
                        onSelect={(date) => setFormData({ ...formData, dueDate: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>Max Points</Label>
                  <Input
                    type="number"
                    value={formData.maxPoints}
                    onChange={(e) => setFormData({ ...formData, maxPoints: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                </div>
              </div>

              <div>
                <Label>Attachments</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Drag and drop files or click to browse
                  </p>
                  <Input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <Button variant="outline" size="sm" onClick={() => document.getElementById('file-upload')?.click()}>
                    Select Files
                  </Button>
                </div>
                {attachments.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {attachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-sm">{file.name}</span>
                        <Button variant="ghost" size="sm" onClick={() => removeAttachment(index)}>
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={selectedAssignment ? handleUpdateAssignment : handleCreateAssignment}>
                {selectedAssignment ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Submissions Dialog */}
      {submissionsDialogOpen && selectedAssignment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                Submissions - {selectedAssignment.title}
              </h2>
              <Button variant="outline" onClick={() => setSubmissionsDialogOpen(false)}>
                Close
              </Button>
            </div>

            <div className="mb-4 p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-muted-foreground">Total Submissions:</span>
                <span className="font-medium">{submissions.length}</span>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">Graded:</span>
                <span className="font-medium">{submissions.filter(s => s.grade !== null).length}</span>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Reg. Number</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No submissions yet
                    </TableCell>
                  </TableRow>
                ) : (
                  submissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell className="font-medium">{submission.student.first_name} {submission.student.last_name}</TableCell>
                      <TableCell>{submission.student.student_number}</TableCell>
                      <TableCell>{format(new Date(submission.submitted_at), 'MMM dd, yyyy')}</TableCell>
                      <TableCell className="text-blue-600 underline cursor-pointer">
                        {submission.file_url ? 'View File' : '-'}
                      </TableCell>
                      <TableCell>
                        {submission.grade !== null ? (
                          <span className="font-semibold">{submission.grade}/{selectedAssignment.max_points}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{getSubmissionStatusBadge(submission.grade)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => handleGradeSubmission(submission)}>
                          {submission.grade !== null ? 'Edit Grade' : 'Grade'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Grading Dialog */}
      {gradingDialogOpen && selectedSubmission && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              Grade Submission - {selectedSubmission.student.first_name} {selectedSubmission.student.last_name}
            </h2>

            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Assignment:</span>
                    <p className="font-medium">{selectedAssignment?.title}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Submitted File:</span>
                    <p className="font-medium text-blue-600 underline cursor-pointer">
                      {selectedSubmission.file_url ? 'View File' : '-'}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Submitted:</span>
                    <p className="font-medium">{format(new Date(selectedSubmission.submitted_at), 'MMM dd, yyyy')}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Max Points:</span>
                    <p className="font-medium">{selectedAssignment?.max_points}</p>
                  </div>
                </div>
              </div>

              <div>
                <Label>Score *</Label>
                <Input
                  type="number"
                  min="0"
                  max={selectedAssignment?.max_points}
                  value={gradingForm.score}
                  onChange={(e) => setGradingForm({ ...gradingForm, score: parseInt(e.target.value) || 0 })}
                  placeholder={`Enter score (0-${selectedAssignment?.max_points})`}
                />
              </div>

              <div>
                <Label>Feedback</Label>
                <Textarea
                  value={gradingForm.feedback}
                  onChange={(e) => setGradingForm({ ...gradingForm, feedback: e.target.value })}
                  placeholder="Provide feedback to the student..."
                  rows={4}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setGradingDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveGrade}>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Save Grade
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

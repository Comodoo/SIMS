'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { query, mutate } from '@/lib/graphql';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Calendar as CalendarIcon, Upload, X } from 'lucide-react';
import { format } from 'date-fns';

const ADMIN_ASSIGNMENTS_QUERY = `
  query AdminAssignments {
    assignments(limit: 1000) {
      id
      title
      description
      course {
        id
        code
        name
      }
      due_date
      max_points
      created_at
      updated_at
    }
    courses(limit: 1000) {
      id
      code
      name
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
        course {
          id
          code
          name
        }
        due_date
        max_points
        created_at
      }
    }
  }
`;

const UPDATE_ASSIGNMENT_MUTATION = `
  mutation UpdateAssignment($assignmentId: ID!, $title: String, $description: String, $courseId: ID, $dueDate: String, $maxPoints: Int) {
    updateAssignment(assignmentId: $assignmentId, title: $title, description: $description, courseId: $courseId, dueDate: $dueDate, maxPoints: $maxPoints) {
      success
      message
      assignment {
        id
        title
        description
        course {
          id
          code
          name
        }
        due_date
        max_points
        updated_at
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

// Types
interface Course {
  id: string;
  code: string;
  name: string;
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  course: Course;
  due_date: string;
  max_points: number;
  created_at: string;
  updated_at: string;
}

export default function AdminAssignmentsPage() {
  const { user, token } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    courseId: '',
    dueDate: undefined as Date | undefined,
    maxPoints: 100,
  });

  useEffect(() => {
    if (!user || !token) return;

    const fetchData = async () => {
      try {
        const response = await query('adminAssignments', ADMIN_ASSIGNMENTS_QUERY, {}, token);
        
        if (response.assignments) {
          const mappedAssignments: Assignment[] = response.assignments.map((a: any) => ({
            id: a.id,
            title: a.title,
            description: a.description,
            course: {
              id: a.course?.id || '',
              code: a.course?.code || '',
              name: a.course?.name || '',
            },
            due_date: a.due_date,
            max_points: a.max_points,
            created_at: a.created_at,
            updated_at: a.updated_at,
          }));
          setAssignments(mappedAssignments);
        }
        
        if (response.courses) {
          const mappedCourses: Course[] = response.courses.map((c: any) => ({
            id: c.id,
            code: c.code,
            name: c.name,
          }));
          setCourses(mappedCourses);
        }
      } catch (error) {
        console.error('Failed to fetch assignments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, token]);

  const handleCreateAssignment = async () => {
    try {
      const response = await mutate('createAssignment', CREATE_ASSIGNMENT_MUTATION, {
        title: formData.title,
        description: formData.description,
        courseId: formData.courseId,
        dueDate: formData.dueDate?.toISOString() || '',
        maxPoints: formData.maxPoints,
      }, token);

      if (response.createAssignment.success) {
        const newAssignment: Assignment = {
          id: response.createAssignment.assignment.id,
          title: response.createAssignment.assignment.title,
          description: response.createAssignment.assignment.description,
          course: {
            id: response.createAssignment.assignment.course.id,
            code: response.createAssignment.assignment.course.code,
            name: response.createAssignment.assignment.course.name,
          },
          due_date: response.createAssignment.assignment.due_date,
          max_points: response.createAssignment.assignment.max_points,
          created_at: response.createAssignment.assignment.created_at,
          updated_at: response.createAssignment.assignment.created_at,
        };
        setAssignments([newAssignment, ...assignments]);
        setDialogOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error('Failed to create assignment:', error);
    }
  };

  const handleEditAssignment = (assignment: Assignment) => {
    setEditingAssignment(assignment);
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
    if (!editingAssignment) return;
    
    try {
      const response = await mutate('updateAssignment', UPDATE_ASSIGNMENT_MUTATION, {
        assignmentId: editingAssignment.id,
        title: formData.title,
        description: formData.description,
        courseId: formData.courseId,
        dueDate: formData.dueDate?.toISOString() || '',
        maxPoints: formData.maxPoints,
      }, token);

      if (response.updateAssignment.success) {
        setAssignments(assignments.map(a => 
          a.id === editingAssignment.id 
            ? { 
                ...a, 
                title: formData.title,
                description: formData.description,
                course: courses.find(c => c.id === formData.courseId) || a.course,
                due_date: formData.dueDate?.toISOString() || a.due_date,
                max_points: formData.maxPoints,
                updated_at: response.updateAssignment.assignment.updated_at,
              }
            : a
        ));
        setDialogOpen(false);
        setEditingAssignment(null);
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

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      courseId: '',
      dueDate: undefined,
      maxPoints: 100,
    });
    setAttachments([]);
    setEditingAssignment(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(Array.from(e.target.files));
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  if (loading) {
    return <div>Loading assignments...</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Assignments</h1>
        <p className="text-muted-foreground">Create and manage course assignments</p>
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
                    <span>{assignment.course.code} - {assignment.course.name}</span>
                    <span>•</span>
                    <span>Due: {assignment.due_date ? format(new Date(assignment.due_date), 'MMM dd, yyyy') : 'No due date'}</span>
                    <span>•</span>
                    <span>Max Points: {assignment.max_points}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEditAssignment(assignment)}>
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteAssignment(assignment.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4">{assignment.description}</p>
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
              {editingAssignment ? 'Edit Assignment' : 'Create New Assignment'}
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
                        {course.code} - {course.name}
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
                          <X className="w-4 h-4" />
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
              <Button onClick={editingAssignment ? handleUpdateAssignment : handleCreateAssignment}>
                {editingAssignment ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

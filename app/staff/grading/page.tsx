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
import { useAuth } from '@/lib/auth-context';
import { mutate, query } from '@/lib/graphql';
import { Edit, Filter, Plus, Search, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const STAFF_GRADING_QUERY = `
  query StaffGrading($staffId: ID!) {
    courses(instructorId: $staffId, limit: 50) {
      id
      course_code
      name
      credits
      level
      department
    }
    enrollments(limit: 100) {
      id
      status
      midterm_grade
      final_grade
      letter_grade
      semester
      academic_year
      student {
        id
        student_number
        first_name
        last_name
      }
      course {
        id
        course_code
        name
        credits
      }
    }
    students(limit: 100) {
      id
      student_number
      first_name
      last_name
    }
  }
`;

const UPDATE_ENROLLMENT_GRADE_MUTATION = `
  mutation UpdateEnrollmentGrade($enrollmentId: ID!, $midtermGrade: Float, $finalGrade: Float, $letterGrade: String) {
    updateEnrollmentGrade(enrollmentId: $enrollmentId, midtermGrade: $midtermGrade, finalGrade: $finalGrade, letterGrade: $letterGrade) {
      success
      message
      enrollment {
        id
        midterm_grade
        final_grade
        letter_grade
      }
    }
  }
`;

export default function StaffGradingPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [filteredEnrollments, setFilteredEnrollments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [selectedEnrollment, setSelectedEnrollment] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    enrollmentId: '',
    studentId: '',
    studentNumber: '',
    studentName: '',
    courseId: '',
    courseCode: '',
    courseName: '',
    semester: 'first',
    academicYear: '2024/2025',
    midtermGrade: 0,
    finalGrade: 0,
    letterGrade: '',
  });

  useEffect(() => {
    if (!user || !token) return;

    const fetchGradingData = async () => {
      try {
        const response = await query('staffGrading', STAFF_GRADING_QUERY, { staffId: user.id }, token);
        
        setCourses(response.courses || []);
        setEnrollments(response.enrollments || []);
        setStudents(response.students || []);
        setFilteredEnrollments(response.enrollments || []);
      } catch (error) {
        console.error('Failed to fetch grading data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGradingData();
  }, [user, token]);

  useEffect(() => {
    filterEnrollments();
  }, [enrollments, searchTerm, statusFilter, courseFilter]);

  const filterEnrollments = () => {
    let filtered = enrollments;

    if (searchTerm) {
      filtered = filtered.filter(
        (e) =>
          e.student.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.student.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.student.student_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.course.course_code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((e) => e.status === statusFilter);
    }

    if (courseFilter !== 'all') {
      filtered = filtered.filter((e) => e.course.id === courseFilter);
    }

    setFilteredEnrollments(filtered);
  };

  const calculateLetterGrade = (midterm: number, final: number) => {
    const total = midterm + final;
    if (total >= 90) return 'A';
    if (total >= 85) return 'A-';
    if (total >= 80) return 'B+';
    if (total >= 75) return 'B';
    if (total >= 70) return 'B-';
    if (total >= 65) return 'C+';
    if (total >= 60) return 'C';
    if (total >= 55) return 'C-';
    if (total >= 50) return 'D+';
    if (total >= 45) return 'D';
    return 'F';
  };

  const onSubmit = async () => {
    const midtermGrade = formData.midtermGrade || 0;
    const finalGrade = formData.finalGrade || 0;
    const letterGrade = calculateLetterGrade(midtermGrade, finalGrade);

    try {
      const response = await mutate('updateEnrollmentGrade', UPDATE_ENROLLMENT_GRADE_MUTATION, {
        enrollmentId: formData.enrollmentId,
        midtermGrade,
        finalGrade,
        letterGrade,
      }, token);

      if (response.updateEnrollmentGrade.success) {
        setEnrollments(enrollments.map(e => 
          e.id === formData.enrollmentId 
            ? { ...e, ...response.updateEnrollmentGrade.enrollment }
            : e
        ));
        setDialogOpen(false);
        setIsEditing(false);
        setSelectedEnrollment(null);
        resetForm();
      }
    } catch (error) {
      console.error('Failed to update grade:', error);
    }
  };

  const handleEdit = (enrollment: any) => {
    setSelectedEnrollment(enrollment);
    setIsEditing(true);
    setFormData({
      enrollmentId: enrollment.id,
      studentId: enrollment.student.id,
      studentNumber: enrollment.student.student_number,
      studentName: `${enrollment.student.first_name} ${enrollment.student.last_name}`,
      courseId: enrollment.course.id,
      courseCode: enrollment.course.course_code,
      courseName: enrollment.course.name,
      semester: enrollment.semester,
      academicYear: enrollment.academic_year,
      midtermGrade: enrollment.midterm_grade || 0,
      finalGrade: enrollment.final_grade || 0,
      letterGrade: enrollment.letter_grade || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (selectedEnrollment) {
      // Reset grades to null
      try {
        const response = await mutate('updateEnrollmentGrade', UPDATE_ENROLLMENT_GRADE_MUTATION, {
          enrollmentId: selectedEnrollment.id,
          midtermGrade: null,
          finalGrade: null,
          letterGrade: null,
        }, token);

        if (response.updateEnrollmentGrade.success) {
          setEnrollments(enrollments.map(e => 
            e.id === selectedEnrollment.id 
              ? { ...e, ...response.updateEnrollmentGrade.enrollment }
              : e
          ));
          setDeleteDialogOpen(false);
          setSelectedEnrollment(null);
        }
      } catch (error) {
        console.error('Failed to delete grade:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      enrollmentId: '',
      studentId: '',
      studentNumber: '',
      studentName: '',
      courseId: '',
      courseCode: '',
      courseName: '',
      semester: 'first',
      academicYear: '2024/2025',
      midtermGrade: 0,
      finalGrade: 0,
      letterGrade: '',
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      active: 'default',
      inactive: 'secondary',
      completed: 'default',
    };
    return <Badge variant={variants[status] || 'secondary'} className="capitalize">{status}</Badge>;
  };

  const getGradeColor = (grade: string) => {
    if (!grade) return 'bg-gray-100 text-gray-800';
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

  if (loading) {
    return <div>Loading grading data...</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Results Management</h1>
        <p className="text-muted-foreground">Manage student grades for your courses</p>
      </div>

      <div className="flex gap-2 mb-8">
        <Button onClick={() => { setIsEditing(false); resetForm(); setDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Grade
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Enrollments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enrollments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Graded</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{enrollments.filter(e => e.letter_grade).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{enrollments.filter(e => !e.letter_grade).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courses.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by student name, registration number, or course..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>{course.course_code}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Reg. Number</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Academic Year</TableHead>
                <TableHead>Semester</TableHead>
                <TableHead>Midterm</TableHead>
                <TableHead>Final</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEnrollments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">No enrollments found</TableCell>
                </TableRow>
              ) : (
                filteredEnrollments.map((enrollment) => {
                  const total = (enrollment.midterm_grade || 0) + (enrollment.final_grade || 0);
                  return (
                    <TableRow key={enrollment.id}>
                      <TableCell className="font-medium">{enrollment.student.first_name} {enrollment.student.last_name}</TableCell>
                      <TableCell>{enrollment.student.student_number}</TableCell>
                      <TableCell>{enrollment.course.course_code} - {enrollment.course.name}</TableCell>
                      <TableCell>{enrollment.academic_year}</TableCell>
                      <TableCell className="capitalize">{enrollment.semester}</TableCell>
                      <TableCell className="font-semibold text-blue-600">{enrollment.midterm_grade || '-'}</TableCell>
                      <TableCell className="font-semibold text-purple-600">{enrollment.final_grade || '-'}</TableCell>
                      <TableCell className="font-semibold">{total}</TableCell>
                      <TableCell>
                        <Badge className={getGradeColor(enrollment.letter_grade)}>{enrollment.letter_grade || '-'}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(enrollment.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(enrollment)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedEnrollment(enrollment); setDeleteDialogOpen(true); }} className="text-red-600 hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Grade' : 'Add New Grade'}</DialogTitle>
            <DialogDescription>
              {isEditing ? 'Update the grade details' : 'Enter grade details for a student enrollment'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Student</Label>
                <Select value={formData.studentId} onValueChange={(value) => {
                  const student = students.find(s => s.id === value);
                  if (student) {
                    setFormData(prev => ({ 
                      ...prev, 
                      studentId: value,
                      studentNumber: student.student_number,
                      studentName: `${student.first_name} ${student.last_name}`
                    }));
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>{student.student_number} - {student.first_name} {student.last_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Registration Number</Label>
                <Input value={formData.studentNumber} readOnly />
              </div>
            </div>

            <div>
              <Label>Course</Label>
              <Select value={formData.courseId} onValueChange={(value) => {
                const course = courses.find(c => c.id === value);
                if (course) {
                  setFormData(prev => ({ 
                    ...prev, 
                    courseId: value,
                    courseCode: course.course_code,
                    courseName: course.name
                  }));
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>{course.course_code} - {course.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Academic Year</Label>
                <Select value={formData.academicYear} onValueChange={(value) => setFormData(prev => ({ ...prev, academicYear: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2025/2026">2025/2026</SelectItem>
                    <SelectItem value="2024/2025">2024/2025</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Semester</Label>
                <Select value={formData.semester} onValueChange={(value) => setFormData(prev => ({ ...prev, semester: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="first">Semester One</SelectItem>
                    <SelectItem value="second">Semester Two</SelectItem>
                    <SelectItem value="summer">Summer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Midterm Grade (0-50)</Label>
                <Input type="number" min="0" max="50" value={formData.midtermGrade} onChange={(e) => setFormData(prev => ({ ...prev, midtermGrade: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div>
                <Label>Final Grade (0-50)</Label>
                <Input type="number" min="0" max="50" value={formData.finalGrade} onChange={(e) => setFormData(prev => ({ ...prev, finalGrade: parseFloat(e.target.value) || 0 }))} />
              </div>
            </div>

            <div>
              <Label>Letter Grade (Auto-calculated)</Label>
              <Input value={calculateLetterGrade(formData.midtermGrade, formData.finalGrade)} readOnly />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={onSubmit}>{isEditing ? 'Update Grade' : 'Add Grade'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Grade</DialogTitle>
            <DialogDescription>Are you sure you want to delete this grade? This action cannot be undone.</DialogDescription>
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

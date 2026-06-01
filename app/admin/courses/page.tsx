'use client';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
    Ban,
    BarChart3,
    BookOpen,
    CheckCircle,
    ChevronLeft, ChevronRight,
    Download,
    Eye,
    Flag, MessageSquare,
    MoreVertical,
    Search,
    Star,
    Trash2,
    Users,
    XCircle
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { query, mutate } from '@/lib/graphql';

const ADMIN_COURSES_QUERY = `
  query AdminCourses {
    courses(limit: 1000) {
      id
      name
      course_code
      description
      credits
      status
      max_students
      department
      semester
      academic_year
      staff {
        id
        user { first_name last_name }
      }
    }
  }
`;

const ADMIN_FORM_DATA_QUERY = `
  query AdminFormData {
    staffMembers(limit: 100) {
      id
      staff_number
      position
      user { id first_name last_name }
    }
    departments {
      id
      name
    }
    semesters {
      id
      name
    }
  }
`;

const CREATE_COURSE_MUTATION = `
  mutation CreateCourse($input: CourseInput!) {
    createCourse(input: $input) {
      success
      message
      course {
        id
        name
        course_code
      }
    }
  }
`;

const APPROVE_COURSE_MUTATION = `
  mutation ApproveCourse($courseId: ID!) {
    approveCourse(courseId: $courseId) {
      success
      message
      course {
        id
        is_published
        published_at
      }
    }
  }
`;

const REJECT_COURSE_MUTATION = `
  mutation RejectCourse($courseId: ID!, $reason: String!) {
    rejectCourse(courseId: $courseId, reason: $reason) {
      success
      message
      course {
        id
        is_published
      }
    }
  }
`;

const SUSPEND_COURSE_MUTATION = `
  mutation SuspendCourse($courseId: ID!) {
    suspendCourse(courseId: $courseId) {
      success
      message
      course {
        id
        is_published
      }
    }
  }
`;

const DELETE_COURSE_MUTATION = `
  mutation DeleteCourse($courseId: ID!) {
    deleteCourse(courseId: $courseId) {
      success
      message
    }
  }
`;

const TOGGLE_FEATURED_MUTATION = `
  mutation ToggleFeatured($courseId: ID!, $isFeatured: Boolean!) {
    toggleFeatured(courseId: $courseId, isFeatured: $isFeatured) {
      success
      message
      course {
        id
        is_featured
      }
    }
  }
`;

// Types
interface Course {
  id: string;
  name: string;
  course_code: string;
  description?: string;
  credits: number;
  status: string;
  max_students: number;
  department: string;
  semester: string;
  academic_year: string;
  staff?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

const categories = ['Development', 'Business', 'Finance', 'Marketing', 'Design', 'Photography', 'Personal Development', 'Health & Fitness'];

export default function AdminCoursesPage() {
  const { user, token } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isBulkActionOpen, setIsBulkActionOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  
  // Review form
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [rejectionReason, setRejectionReason] = useState('');

  const itemsPerPage = 10;

  // Form states for creation
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    staff: [] as any[],
    departments: [] as any[],
    semesters: [] as any[],
  });
  const [newCourse, setNewCourse] = useState({
    name: '',
    course_code: '',
    description: '',
    credits: 3,
    department: '',
    instructor_id: '',
    semester: '',
    max_students: 30,
  });

  useEffect(() => {
    if (!user || !token) return;

    const fetchData = async () => {
      try {
        const [coursesRes, formRes] = await Promise.all([
          query<any>('AdminCourses', ADMIN_COURSES_QUERY, {}, token),
          query<any>('AdminFormData', ADMIN_FORM_DATA_QUERY, {}, token)
        ]);
        
        if (coursesRes.courses) {
          setCourses(coursesRes.courses);
        }
        
        if (formRes) {
          setFormData({
            staff: formRes.staffMembers || [],
            departments: formRes.departments || [],
            semesters: formRes.semesters || [],
          });
        }
      } catch (error) {
        console.error('Failed to fetch admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, token]);

  // Filter courses based on tab and filters
  const getFilteredCourses = () => {
    return courses.filter(course => {
      const instructorName = `${course.instructor.first_name} ${course.instructor.last_name}`.toLowerCase();
      const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            instructorName.includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || 
                            (statusFilter === 'published' && course.is_published) ||
                            (statusFilter === 'draft' && !course.is_published);
      const matchesCategory = categoryFilter === 'all' || course.category === categoryFilter;
      
      let matchesTab = true;
      if (activeTab === 'published') matchesTab = course.is_published;
      else if (activeTab === 'draft') matchesTab = !course.is_published;
      else if (activeTab === 'featured') matchesTab = course.is_featured;
      
      return matchesSearch && matchesStatus && matchesCategory && matchesTab;
    });
  };

  const filteredCourses = getFilteredCourses();
  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);
  const paginatedCourses = filteredCourses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Create Course handler
  const handleCreateCourse = async () => {
    try {
      const response = await mutate<any>('CreateCourse', CREATE_COURSE_MUTATION, { 
        input: {
          ...newCourse,
          credits: parseInt(newCourse.credits as any),
          max_students: parseInt(newCourse.max_students as any),
        } 
      }, token);
      
      if (response.createCourse.success) {
        // Refresh courses
        const coursesRes = await query<any>('AdminCourses', ADMIN_COURSES_QUERY, {}, token);
        if (coursesRes.courses) setCourses(coursesRes.courses);
        
        setIsCreateOpen(false);
        setNewCourse({
          name: '',
          course_code: '',
          description: '',
          credits: 3,
          department: '',
          instructor_id: '',
          semester: '',
          max_students: 30,
        });
      } else {
        alert(response.createCourse.message);
      }
    } catch (error) {
      console.error('Failed to create course:', error);
      alert('Failed to create course');
    }
  };

  const openViewDialog = (course: Course) => {
    setSelectedCourse(course);
    setIsViewOpen(true);
  };

  const openDeleteDialog = (course: Course) => {
    setSelectedCourse(course);
    setIsDeleteOpen(true);
  };

  const toggleSelectAll = () => {
    if (selectedCourses.length === paginatedCourses.length) {
      setSelectedCourses([]);
    } else {
      setSelectedCourses(paginatedCourses.map(c => c.id));
    }
  };

  const toggleSelectCourse = (courseId: string) => {
    setSelectedCourses(prev => 
      prev.includes(courseId) 
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  // Stats
  const stats = {
    total: courses.length,
    active: courses.filter(c => c.status === 'active').length,
    inactive: courses.filter(c => c.status === 'inactive').length,
    totalCredits: courses.reduce((sum, c) => sum + (c.credits || 0), 0),
    totalCapacity: courses.reduce((sum, c) => sum + (c.max_students || 0), 0),
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">Loading courses...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Course Management</h1>
          <p className="text-muted-foreground">Review and manage academic courses</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setIsCreateOpen(true)}>
            <BookOpen className="h-4 w-4 mr-2" />
            Create New Course
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total Courses</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{stats.totalCredits}</div>
            <p className="text-xs text-muted-foreground">Total Credits</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">{stats.totalCapacity}</div>
            <p className="text-xs text-muted-foreground">Student Capacity</p>
          </CardContent>
        </Card>
      </div>

      {/* Courses Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox 
                      checked={selectedCourses.length === paginatedCourses.length && paginatedCourses.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Instructor</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Semester</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCourses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell>
                      <Checkbox 
                        checked={selectedCourses.includes(course.id)}
                        onCheckedChange={() => toggleSelectCourse(course.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-16 rounded bg-muted flex items-center justify-center">
                          <BookOpen className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate max-w-[200px]">{course.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {course.course_code} | {course.credits} Credits
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${course.staff?.first_name}`} />
                          <AvatarFallback>{course.staff?.first_name?.slice(0, 1)}{course.staff?.last_name?.slice(0, 1)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{course.staff ? `${course.staff.user?.first_name} ${course.staff.user?.last_name}` : 'No Instructor'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{course.department}</Badge>
                    </TableCell>
                    <TableCell>{course.semester}</TableCell>
                    <TableCell>{course.max_students} students</TableCell>
                    <TableCell>
                      <Badge className={course.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {course.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openViewDialog(course)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => openDeleteDialog(course)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Course
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create Course Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Course</DialogTitle>
            <DialogDescription>Add a new course to the system and assign an instructor.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Name</Label>
              <Input id="name" value={newCourse.name} onChange={(e) => setNewCourse({...newCourse, name: e.target.value})} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="code" className="text-right">Code</Label>
              <Input id="code" value={newCourse.course_code} onChange={(e) => setNewCourse({...newCourse, course_code: e.target.value})} className="col-span-3" placeholder="e.g. CS101" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dept" className="text-right">Department</Label>
              <Select onValueChange={(v) => setNewCourse({...newCourse, department: v})}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select Department" />
                </SelectTrigger>
                <SelectContent>
                  {formData.departments.map((d: any) => (
                    <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="instructor" className="text-right">Instructor</Label>
              <Select onValueChange={(v) => setNewCourse({...newCourse, instructor_id: v})}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Assign Instructor" />
                </SelectTrigger>
                <SelectContent>
                  {formData.staff.map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>{s.user?.first_name} {s.user?.last_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="semester" className="text-right">Semester</Label>
              <Select onValueChange={(v) => setNewCourse({...newCourse, semester: v})}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select Semester" />
                </SelectTrigger>
                <SelectContent>
                  {formData.semesters.map((s: any) => (
                    <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="credits" className="text-right">Credits</Label>
              <Input id="credits" type="number" value={newCourse.credits} onChange={(e) => setNewCourse({...newCourse, credits: parseInt(e.target.value)})} className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateCourse}>Create Course</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Course Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Course Details</DialogTitle>
          </DialogHeader>
          {selectedCourse && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Course Name</Label>
                  <p className="font-medium">{selectedCourse.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Course Code</Label>
                  <p className="font-medium">{selectedCourse.course_code}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Department</Label>
                  <p className="font-medium">{selectedCourse.department}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Instructor</Label>
                  <p className="font-medium">{selectedCourse.staff?.first_name} {selectedCourse.staff?.last_name || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Semester</Label>
                  <p className="font-medium">{selectedCourse.semester}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Credits</Label>
                  <p className="font-medium">{selectedCourse.credits}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Description</Label>
                <p className="text-sm">{selectedCourse.description || 'No description provided.'}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the course "{selectedCourse?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (selectedCourse) {
                mutate('DeleteCourse', DELETE_COURSE_MUTATION, { courseId: selectedCourse.id }, token)
                  .then(() => setCourses(courses.filter(c => c.id !== selectedCourse.id)));
              }
              setIsDeleteOpen(false);
            }} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

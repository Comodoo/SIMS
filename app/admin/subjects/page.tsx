'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/lib/auth-context';
import { mutate, query } from '@/lib/graphql';
import { BookOpen, GraduationCap, Pencil, Plus, Trash2, UserPlus, X } from 'lucide-react';
import { useEffect, useState } from 'react';

// ---------------------------------------------------------------------------
// GraphQL
// ---------------------------------------------------------------------------
const SUBJECTS_QUERY = `
  query AdminSubjects {
    courses {
      id
      name
      course_code
      status
      academic_year
      semester
      class_group
    }
    classGroups {
      id
      name
      parentId
    }
    subjectTeachers {
      id
      subjectId
      subjectName
      isPrimary
      assignedAt
      teacher {
        id
        staff_number
        user { first_name last_name }
      }
    }
    staffMembers(isActive: true, limit: 200) {
      id
      staff_number
      position
      user { first_name last_name }
    }
    students(limit: 500) {
      id
      student_number
      grade_level
      first_name
      last_name
    }
    enrollments(limit: 2000) {
      id
      status
      course { id }
      student { id first_name last_name student_number }
    }
  }
`;

const ENROLL_STUDENT_MUTATION = `
  mutation EnrollStudent($input: EnrollmentInput!) {
    enrollStudent(input: $input) {
      success
      message
    }
  }
`;

const CREATE_SUBJECT_MUTATION = `
  mutation CreateSubject($input: CourseInput!) {
    createCourse(input: $input) {
      success
      message
      course { id name course_code }
    }
  }
`;

const UPDATE_SUBJECT_MUTATION = `
  mutation UpdateSubject($courseId: ID!, $input: CourseInput!) {
    updateCourse(courseId: $courseId, input: $input) {
      success
      message
      course { id name course_code }
    }
  }
`;

const DELETE_SUBJECT_MUTATION = `
  mutation DeleteSubject($courseId: ID!) {
    deleteCourse(courseId: $courseId) {
      success
      message
    }
  }
`;

const ASSIGN_TEACHER_MUTATION = `
  mutation AssignTeacher($input: AssignTeacherInput!, $assignedById: ID!) {
    assignTeacherToSubject(input: $input, assignedById: $assignedById) {
      success
      message
    }
  }
`;

const REMOVE_TEACHER_MUTATION = `
  mutation RemoveTeacher($subjectId: ID!, $teacherId: ID!) {
    removeTeacherFromSubject(subjectId: $subjectId, teacherId: $teacherId) {
      success
      message
    }
  }
`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Subject {
  id: string;
  name: string;
  course_code: string;
  status: string;
  academic_year: string;
  semester: string;
  class_group: string | null;
}
interface ClassGroup { id: string; name: string; parentId: string | null; }
interface SubjectTeacher {
  id: string;
  subjectId: string;
  subjectName: string;
  isPrimary: boolean;
  assignedAt: string;
  teacher: { id: string; staff_number: string; user: { first_name: string; last_name: string } };
}
interface StaffMember {
  id: string;
  staff_number: string;
  position: string;
  user: { first_name: string; last_name: string };
}
interface StudentRow {
  id: string;
  student_number: string;
  grade_level: string;
  first_name: string;
  last_name: string;
}
interface EnrollmentRow {
  id: string;
  status: string;
  course: { id: string };
  student: { id: string; first_name: string; last_name: string; student_number: string };
}

const emptyForm = { name: '', courseCode: '', description: '', termNumber: '', termYear: '', classGroup: '' };

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------
const PAGE_SIZE = 10;

function Paginator({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) {
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20 text-sm">
      <span className="text-xs text-muted-foreground">{total === 0 ? 'No records' : `${from}–${to} of ${total}`}</span>
      <div className="flex items-center gap-1">
        <button disabled={page <= 1} onClick={() => onChange(page - 1)}
          className="px-2 py-1 rounded border bg-background text-xs disabled:opacity-40 hover:bg-muted transition-colors">‹</button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
          <button key={p} onClick={() => onChange(p)}
            className={`w-7 h-7 rounded text-xs font-medium transition-colors ${p === page ? 'bg-primary text-primary-foreground' : 'border bg-background hover:bg-muted'}`}>
            {p}
          </button>
        ))}
        <button disabled={page >= totalPages} onClick={() => onChange(page + 1)}
          className="px-2 py-1 rounded border bg-background text-xs disabled:opacity-40 hover:bg-muted transition-colors">›</button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function AdminSubjectsPage() {
  const { token, user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [assignments, setAssignments] = useState<SubjectTeacher[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentRow[]>([]);
  const [classGroups, setClassGroups] = useState<ClassGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editSubject, setEditSubject] = useState<Subject | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);

  // Assign teacher dialog
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignSubject, setAssignSubject] = useState<Subject | null>(null);
  const [assignForm, setAssignForm] = useState({ teacherId: '', isPrimary: false });

  // Enroll student dialog
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [enrollSubject, setEnrollSubject] = useState<Subject | null>(null);
  const [enrollStudentId, setEnrollStudentId] = useState('');
  const [page, setPage] = useState(1);

  async function load() {
    setLoading(true);
    try {
      const data = await query<{
        courses: Subject[];
        classGroups: ClassGroup[];
        subjectTeachers: SubjectTeacher[];
        staffMembers: StaffMember[];
        students: StudentRow[];
        enrollments: EnrollmentRow[];
      }>(SUBJECTS_QUERY, {}, token ?? undefined);
      setSubjects(data.courses ?? []);
      setClassGroups(data.classGroups ?? []);
      setAssignments(data.subjectTeachers ?? []);
      setStaff(data.staffMembers ?? []);
      setStudents(data.students ?? []);
      setEnrollments(data.enrollments ?? []);
    } catch {
      /* backend offline */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [token]);

  const pagedSubjects = subjects.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ------------------------------------------------------------------
  // Handlers
  // ------------------------------------------------------------------
  async function handleCreate() {
    setError('');
    if (!createForm.name || !createForm.courseCode) {
      setError('Subject name and code are required.');
      return;
    }
    setSaving(true);
    try {
      const semName = createForm.termNumber && createForm.termYear
        ? `Term ${createForm.termNumber} ${createForm.termYear}`
        : '';
      const res: any = await mutate(CREATE_SUBJECT_MUTATION, {
        input: {
          courseCode: createForm.courseCode,
          name: createForm.name,
          description: createForm.description || null,
          semester: semName || null,
          academicYear: createForm.termYear || null,
          credits: 1,
          status: 'active',
          classGroup: createForm.classGroup || null,
        },
      }, token ?? undefined);
      if (!res.createCourse.success) {
        setError(res.createCourse.message);
        return;
      }
      setCreateOpen(false);
      setCreateForm(emptyForm);
      await load();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to create subject.');
    } finally { setSaving(false); }
  }

  function openEdit(subject: Subject) {
    const parts = subject.semester?.match(/^Term\s+(\d+)\s+(.+)$/);
    setEditSubject(subject);
    setEditForm({
      name: subject.name,
      courseCode: subject.course_code,
      description: '',
      termNumber: parts ? parts[1] : '',
      termYear: parts ? parts[2] : subject.academic_year ?? '',
      classGroup: subject.class_group ?? '',
    });
    setEditOpen(true);
  }

  async function handleEdit() {
    if (!editSubject) return;
    setError('');
    setSaving(true);
    try {
      const semName = editForm.termNumber && editForm.termYear
        ? `Term ${editForm.termNumber} ${editForm.termYear}`
        : '';
      const res: any = await mutate(UPDATE_SUBJECT_MUTATION, {
        courseId: editSubject.id,
        input: {
          courseCode: editForm.courseCode,
          name: editForm.name,
          description: editForm.description || null,
          semester: semName || null,
          academicYear: editForm.termYear || null,
          credits: 1,
          status: editSubject.status,
          classGroup: editForm.classGroup || null,
        },
      }, token ?? undefined);
      if (!res.updateCourse.success) {
        setError(res.updateCourse.message);
        return;
      }
      setEditOpen(false);
      setEditSubject(null);
      await load();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to update subject.');
    } finally { setSaving(false); }
  }

  async function handleDelete(subject: Subject) {
    if (!confirm(`Delete subject "${subject.name}"? This cannot be undone.`)) return;
    try {
      await mutate(DELETE_SUBJECT_MUTATION, { courseId: subject.id }, token ?? undefined);
      await load();
    } catch {/* ignore */}
  }

  function openAssign(subject: Subject) {
    setAssignSubject(subject);
    setAssignForm({ teacherId: '', isPrimary: false });
    setAssignOpen(true);
  }

  async function handleAssignTeacher() {
    if (!assignSubject || !assignForm.teacherId) return;
    setSaving(true);
    try {
      await mutate(ASSIGN_TEACHER_MUTATION, {
        input: {
          subjectId: assignSubject.id,
          teacherId: assignForm.teacherId,
          isPrimary: assignForm.isPrimary,
        },
        assignedById: user?.id,
      }, token ?? undefined);
      setAssignOpen(false);
      setAssignForm({ teacherId: '', isPrimary: false });
      await load();
    } catch {/* ignore */} finally { setSaving(false); }
  }

  async function handleRemoveTeacher(subjectId: string, teacherId: string) {
    if (!confirm('Remove this teacher from the subject?')) return;
    try {
      await mutate(REMOVE_TEACHER_MUTATION, { subjectId, teacherId }, token ?? undefined);
      await load();
    } catch {/* ignore */}
  }

  function getTeachersForSubject(subjectId: string) {
    return assignments.filter(a => a.subjectId === subjectId);
  }

  function getEnrolledStudents(courseId: string) {
    return enrollments.filter(e => e.course.id === courseId);
  }

  function openEnroll(subject: Subject) {
    setEnrollSubject(subject);
    setEnrollStudentId('');
    setEnrollOpen(true);
  }

  async function handleEnrollStudent() {
    if (!enrollSubject || !enrollStudentId) return;
    setSaving(true);
    try {
      const res: any = await mutate(ENROLL_STUDENT_MUTATION, {
        input: {
          studentId: enrollStudentId,
          courseId: enrollSubject.id,
          semester: enrollSubject.semester || '',
          academicYear: enrollSubject.academic_year || '',
        },
      }, token ?? undefined);
      if (res.enrollStudent?.success === false) {
        setError(res.enrollStudent.message);
        return;
      }
      setEnrollOpen(false);
      await load();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to enroll student.');
    } finally { setSaving(false); }
  }

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Subjects</h1>
          <p className="text-muted-foreground">Manage subjects and assign teachers</p>
        </div>
        <Button onClick={() => { setError(''); setCreateForm(emptyForm); setCreateOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />New Subject
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold">{subjects.length}</p>
            <p className="text-sm text-muted-foreground">Total Subjects</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold">{subjects.filter(s => s.status === 'active').length}</p>
            <p className="text-sm text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold">{new Set(assignments.map(a => a.teacher.id)).size}</p>
            <p className="text-sm text-muted-foreground">Teachers Assigned</p>
          </CardContent>
        </Card>
      </div>

      {/* Subject list */}
      <Card>
        <CardHeader><CardTitle className="text-base">All Subjects</CardTitle></CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-12 bg-muted rounded animate-pulse" />)}
            </div>
          ) : subjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-1">No subjects yet</h3>
              <p className="text-muted-foreground text-sm">Create your first subject using the button above.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Class Group</TableHead>
                  <TableHead>Term</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Teachers</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedSubjects.map(subject => {
                  const teachers = getTeachersForSubject(subject.id);
                  const enrolled = getEnrolledStudents(subject.id);
                  return (
                    <TableRow key={subject.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{subject.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{subject.course_code}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {subject.class_group
                          ? <Badge variant="outline" className="text-xs">{subject.class_group}</Badge>
                          : <span className="text-xs text-muted-foreground italic">—</span>}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {subject.semester || <span className="italic">No term</span>}
                      </TableCell>
                      <TableCell>
                        <Badge variant={subject.status === 'active' ? 'default' : 'secondary'}>
                          {subject.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {teachers.length === 0 ? (
                            <span className="text-xs text-muted-foreground italic">None</span>
                          ) : teachers.map(a => (
                            <Badge key={a.id} variant="outline" className="text-xs gap-1 pr-1">
                              {a.teacher.user.first_name} {a.teacher.user.last_name}
                              {a.isPrimary && <span className="text-primary ml-0.5">★</span>}
                              <button
                                onClick={() => handleRemoveTeacher(subject.id, a.teacher.id)}
                                className="ml-1 hover:text-destructive transition-colors"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">{enrolled.length}</span>
                        <span className="text-xs text-muted-foreground ml-1">enrolled</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          {/* Enroll student */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEnroll(subject)}
                            title="Enroll student"
                          >
                            <GraduationCap className="h-3.5 w-3.5 mr-1" />
                            Enroll
                          </Button>
                          {/* Assign teacher */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openAssign(subject)}
                            title="Assign teacher"
                          >
                            <UserPlus className="h-3.5 w-3.5 mr-1" />
                            Assign
                          </Button>
                          {/* Edit */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(subject)}
                            title="Edit subject"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {/* Delete */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(subject)}
                            title="Delete subject"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
          {!loading && subjects.length > 0 && (
            <Paginator page={page} total={subjects.length} onChange={setPage} />
          )}
        </CardContent>
      </Card>

      {/* ----------------------------------------------------------------- */}
      {/* Create dialog                                                      */}
      {/* ----------------------------------------------------------------- */}
      <Dialog open={createOpen} onOpenChange={o => { setCreateOpen(o); if (!o) setError(''); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Subject</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Subject Name *</Label>
                <Input
                  placeholder="e.g. Mathematics"
                  value={createForm.name}
                  onChange={e => setCreateForm(p => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Code *</Label>
                <Input
                  placeholder="e.g. MATH101"
                  value={createForm.courseCode}
                  onChange={e => setCreateForm(p => ({ ...p, courseCode: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Class Group</Label>
              <Select
                value={createForm.classGroup || '__none__'}
                onValueChange={v => setCreateForm(p => ({ ...p, classGroup: v === '__none__' ? '' : v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select class group…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No class group</SelectItem>
                  {classGroups.filter(g => !g.parentId).map(g => (
                    <SelectItem key={g.id} value={g.name}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Assign this subject to a class level so "Mathematics Form 1" and "Mathematics Form 2" can coexist.
              </p>
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Input
                placeholder="Optional description"
                value={createForm.description}
                onChange={e => setCreateForm(p => ({ ...p, description: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Term (optional)</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Number</p>
                  <Input
                    type="number"
                    min={1}
                    placeholder="e.g. 1"
                    value={createForm.termNumber}
                    onChange={e => setCreateForm(p => ({ ...p, termNumber: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Year</p>
                  <Input
                    placeholder="e.g. 2025/2026"
                    value={createForm.termYear}
                    onChange={e => setCreateForm(p => ({ ...p, termYear: e.target.value }))}
                  />
                </div>
              </div>
              {createForm.termNumber && createForm.termYear && (
                <p className="text-xs text-muted-foreground mt-1">
                  Will be saved as: <span className="font-medium">Term {createForm.termNumber} {createForm.termYear}</span>
                </p>
              )}
            </div>
            <div className="flex gap-2 pt-1">
              <Button className="flex-1" onClick={handleCreate} disabled={saving || !createForm.name || !createForm.courseCode}>
                {saving ? 'Creating…' : 'Create Subject'}
              </Button>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ----------------------------------------------------------------- */}
      {/* Edit dialog                                                        */}
      {/* ----------------------------------------------------------------- */}
      <Dialog open={editOpen} onOpenChange={o => { setEditOpen(o); if (!o) { setError(''); setEditSubject(null); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Subject</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Subject Name *</Label>
                <Input
                  value={editForm.name}
                  onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Code *</Label>
                <Input
                  value={editForm.courseCode}
                  onChange={e => setEditForm(p => ({ ...p, courseCode: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Class Group</Label>
              <Select
                value={editForm.classGroup || '__none__'}
                onValueChange={v => setEditForm(p => ({ ...p, classGroup: v === '__none__' ? '' : v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select class group…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No class group</SelectItem>
                  {classGroups.filter(g => !g.parentId).map(g => (
                    <SelectItem key={g.id} value={g.name}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Input
                value={editForm.description}
                onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Term (optional)</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Number</p>
                  <Input
                    type="number"
                    min={1}
                    placeholder="e.g. 1"
                    value={editForm.termNumber}
                    onChange={e => setEditForm(p => ({ ...p, termNumber: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Year</p>
                  <Input
                    placeholder="e.g. 2025/2026"
                    value={editForm.termYear}
                    onChange={e => setEditForm(p => ({ ...p, termYear: e.target.value }))}
                  />
                </div>
              </div>
              {editForm.termNumber && editForm.termYear && (
                <p className="text-xs text-muted-foreground mt-1">
                  Will be saved as: <span className="font-medium">Term {editForm.termNumber} {editForm.termYear}</span>
                </p>
              )}
            </div>
            <div className="flex gap-2 pt-1">
              <Button className="flex-1" onClick={handleEdit} disabled={saving || !editForm.name || !editForm.courseCode}>
                {saving ? 'Saving…' : 'Save Changes'}
              </Button>
              <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ----------------------------------------------------------------- */}
      {/* Assign teacher dialog                                              */}
      {/* ----------------------------------------------------------------- */}
      <Dialog open={assignOpen} onOpenChange={o => { setAssignOpen(o); if (!o) setAssignSubject(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Teacher</DialogTitle>
            {assignSubject && (
              <p className="text-sm text-muted-foreground">
                Subject: <span className="font-medium">{assignSubject.name}</span>
              </p>
            )}
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label>Teacher *</Label>
              <Select value={assignForm.teacherId} onValueChange={v => setAssignForm(p => ({ ...p, teacherId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
                <SelectContent>
                  {staff.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.user.first_name} {s.user.last_name}
                      <span className="text-muted-foreground ml-2 text-xs">— {s.position}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPrimary"
                checked={assignForm.isPrimary}
                onChange={e => setAssignForm(p => ({ ...p, isPrimary: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="isPrimary" className="cursor-pointer">Set as primary teacher ★</Label>
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                className="flex-1"
                onClick={handleAssignTeacher}
                disabled={saving || !assignForm.teacherId}
              >
                {saving ? 'Assigning…' : 'Assign Teacher'}
              </Button>
              <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ----------------------------------------------------------------- */}
      {/* Enroll student dialog                                              */}
      {/* ----------------------------------------------------------------- */}
      <Dialog open={enrollOpen} onOpenChange={o => { setEnrollOpen(o); if (!o) { setEnrollSubject(null); setEnrollStudentId(''); setError(''); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Enroll Student</DialogTitle>
            {enrollSubject && (
              <p className="text-sm text-muted-foreground">
                Subject: <span className="font-medium">{enrollSubject.name}</span>
                {enrollSubject.semester && <span className="ml-2 text-xs">({enrollSubject.semester})</span>}
              </p>
            )}
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {error && <p className="text-sm text-destructive">{error}</p>}

            {/* Currently enrolled */}
            {enrollSubject && (() => {
              const enrolled = getEnrolledStudents(enrollSubject.id);
              return enrolled.length > 0 ? (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Currently Enrolled ({enrolled.length})
                  </p>
                  <div className="max-h-32 overflow-y-auto rounded-md border divide-y">
                    {enrolled.map(e => (
                      <div key={e.id} className="flex items-center justify-between px-3 py-2 text-sm">
                        <span>{e.student.first_name} {e.student.last_name}</span>
                        <span className="text-xs text-muted-foreground font-mono">{e.student.student_number}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null;
            })()}

            {/* Add student */}
            <div className="space-y-1">
              <Label>Add Student *</Label>
              <Select
                value={enrollStudentId}
                onValueChange={setEnrollStudentId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a student to enroll" />
                </SelectTrigger>
                <SelectContent>
                  {(() => {
                    const alreadyEnrolled = enrollSubject
                      ? new Set(getEnrolledStudents(enrollSubject.id).map(e => e.student.id))
                      : new Set<string>();
                    const available = students.filter(s => !alreadyEnrolled.has(s.id));
                    return available.length === 0 ? (
                      <SelectItem value="__none__" disabled>All students already enrolled</SelectItem>
                    ) : available.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.first_name} {s.last_name}
                        <span className="text-muted-foreground ml-2 text-xs">— {s.student_number}</span>
                      </SelectItem>
                    ));
                  })()}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                className="flex-1"
                onClick={handleEnrollStudent}
                disabled={saving || !enrollStudentId || enrollStudentId === '__none__'}
              >
                {saving ? 'Enrolling…' : 'Enroll Student'}
              </Button>
              <Button variant="outline" onClick={() => setEnrollOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

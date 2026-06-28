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
import {
  BookOpen, ChevronDown, ChevronRight, ClipboardList,
  Eye, EyeOff, Link2, Paperclip, Pencil, Plus, Star, Users
} from 'lucide-react';
import { useEffect, useState } from 'react';

// ---------------------------------------------------------------------------
// GraphQL
// ---------------------------------------------------------------------------
const STAFF_PROFILE_QUERY = `
  query StaffProfile($userId: ID!) {
    staffByUser(userId: $userId) {
      id
      staff_number
      position
      user { first_name last_name }
    }
  }
`;

const STAFF_SUBJECTS_DATA_QUERY = `
  query StaffSubjectsData($staffId: ID!) {
    subjectTeachers(teacherId: $staffId) {
      id
      subjectId
      subjectName
      isPrimary
      assignedAt
    }
    enrollments(limit: 2000) {
      id
      status
      course { id }
      student {
        id
        first_name
        last_name
        student_number
        grade_level
      }
    }
    assignments(limit: 500) {
      id
      title
      description
      assignmentType
      dueDate
      totalMarks
      isPublished
      isOverdue
      submissionCount
      attachmentUrl
      attachmentType
      course { id }
    }
  }
`;

const CREATE_ASSIGNMENT_MUTATION = `
  mutation CreateAssignment($input: AssignmentInput!) {
    createAssignment(input: $input) {
      success
      message
      assignment { id title }
    }
  }
`;

const UPDATE_ASSIGNMENT_MUTATION = `
  mutation UpdateAssignment($assignmentId: ID!, $input: AssignmentInput!) {
    updateAssignment(assignmentId: $assignmentId, input: $input) {
      success
      message
      assignment { id title }
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

const UPLOAD_URL = (() => {
  if (typeof window === 'undefined') return '/api/upload/';
  const base = process.env.NEXT_PUBLIC_GRAPHQL_URL ?? 'http://localhost:8000/graphql/';
  return base.replace('/graphql/', '/api/upload/');
})();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface SubjectAssignment {
  id: string;
  subjectId: string;
  subjectName: string;
  isPrimary: boolean;
  assignedAt: string;
}

interface EnrolledStudent {
  id: string;
  first_name: string;
  last_name: string;
  student_number: string;
  grade_level: string;
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  assignmentType: string;
  dueDate: string;
  totalMarks: number;
  isPublished: boolean;
  isOverdue: boolean;
  submissionCount: number;
  attachmentUrl: string | null;
  attachmentType: string | null;
  course: { id: string };
}

const emptyAssignmentForm = {
  title: '',
  description: '',
  assignmentType: 'homework',
  dueDate: '',
  totalMarks: '100',
  isPublished: false,
  attachmentUrl: '',
  attachmentType: 'pdf',
  attachmentMode: 'none' as 'none' | 'url' | 'file',
  attachmentFileName: '',
};

// ---------------------------------------------------------------------------
// Pager
// ---------------------------------------------------------------------------
const PAGE_SIZE = 5;

function Pager({ page, total, onChange }: {
  page: number; total: number; onChange: (p: number) => void;
}) {
  const totalPages = Math.ceil(total / PAGE_SIZE);
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between py-2 px-1 text-xs text-muted-foreground border-t mt-1">
      <span>{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}</span>
      <div className="flex items-center gap-1">
        <button
          className="h-6 w-6 rounded border flex items-center justify-center disabled:opacity-40 hover:bg-muted transition-colors"
          disabled={page === 1}
          onClick={() => onChange(page - 1)}
        >‹</button>
        <span className="px-2 font-medium text-foreground">{page} / {totalPages}</span>
        <button
          className="h-6 w-6 rounded border flex items-center justify-center disabled:opacity-40 hover:bg-muted transition-colors"
          disabled={page === totalPages}
          onClick={() => onChange(page + 1)}
        >›</button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function StaffSubjectsPage() {
  const { user, token } = useAuth();
  const [staffId, setStaffId] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<SubjectAssignment[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Record<string, 'students' | 'assignments'>>({});

  // Pagination
  const [subjectsPage, setSubjectsPage] = useState(1);
  const [studentPages, setStudentPages] = useState<Record<string, number>>({});
  const [assignmentPages, setAssignmentPages] = useState<Record<string, number>>({});

  function getStudentPage(id: string) { return studentPages[id] ?? 1; }
  function setStudentPage(id: string, p: number) { setStudentPages(prev => ({ ...prev, [id]: p })); }
  function getAssignmentPage(id: string) { return assignmentPages[id] ?? 1; }
  function setAssignmentPage(id: string, p: number) { setAssignmentPages(prev => ({ ...prev, [id]: p })); }

  // View dialog
  const [viewOpen, setViewOpen] = useState(false);
  const [viewingAssignment, setViewingAssignment] = useState<Assignment | null>(null);

  // Assignment dialog (create + edit)
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogSubject, setDialogSubject] = useState<SubjectAssignment | null>(null);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [form, setForm] = useState(emptyAssignmentForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function loadData(sid: string) {
    const data = await query<any>(STAFF_SUBJECTS_DATA_QUERY, { staffId: sid }, token ?? undefined);
    setSubjects(data.subjectTeachers ?? []);
    setEnrollments(data.enrollments ?? []);
    setAssignments(data.assignments ?? []);
  }

  useEffect(() => {
    if (!user || !token) return;
    (async () => {
      try {
        const profileRes = await query<any>(STAFF_PROFILE_QUERY, { userId: user.id }, token);
        const profile = profileRes.staffByUser;
        if (!profile) { setLoading(false); return; }
        setStaffId(profile.id);
        await loadData(profile.id);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, token]);

  // Helpers
  function getStudents(subjectId: string): EnrolledStudent[] {
    return enrollments
      .filter(e => e.course?.id === subjectId && e.status === 'active')
      .map(e => e.student);
  }

  function getAssignments(subjectId: string): Assignment[] {
    return assignments.filter(a => a.course?.id === subjectId);
  }

  function getTabFor(subjectId: string): 'students' | 'assignments' {
    return activeTab[subjectId] ?? 'students';
  }

  function setTabFor(subjectId: string, tab: 'students' | 'assignments') {
    setActiveTab(p => ({ ...p, [subjectId]: tab }));
  }

  function openViewDialog(assignment: Assignment) {
    setViewingAssignment(assignment);
    setViewOpen(true);
  }

  function openCreateDialog(subject: SubjectAssignment) {
    setEditingAssignment(null);
    setDialogSubject(subject);
    setForm(emptyAssignmentForm);
    setError('');
    setDialogOpen(true);
  }

  function openEditDialog(assignment: Assignment) {
    const subject = subjects.find(s => s.subjectId === assignment.course.id) ?? null;
    setEditingAssignment(assignment);
    setDialogSubject(subject);
    setForm({
      title: assignment.title,
      description: assignment.description ?? '',
      assignmentType: assignment.assignmentType,
      dueDate: new Date(assignment.dueDate).toISOString().slice(0, 16),
      totalMarks: String(assignment.totalMarks),
      isPublished: assignment.isPublished,
      attachmentUrl: assignment.attachmentUrl ?? '',
      attachmentType: assignment.attachmentType ?? 'pdf',
      attachmentMode: assignment.attachmentUrl ? 'url' : 'none',
      attachmentFileName: '',
    });
    setError('');
    setDialogOpen(true);
  }

  async function handleSaveAssignment() {
    if (!dialogSubject) return;
    setError('');
    if (!form.title || !form.dueDate) {
      setError('Title and due date are required.');
      return;
    }
    setSaving(true);

    const input = {
      courseId: dialogSubject.subjectId,
      title: form.title,
      description: form.description || '',
      assignmentType: form.assignmentType,
      dueDate: new Date(form.dueDate).toISOString(),
      totalMarks: parseFloat(form.totalMarks) || 100,
      isPublished: form.isPublished,
      allowLateSubmission: false,
      latePenaltyPercent: 0,
      attachmentUrl: form.attachmentMode !== 'none' && form.attachmentUrl ? form.attachmentUrl : null,
      attachmentType: form.attachmentMode !== 'none' && form.attachmentUrl ? form.attachmentType : null,
    };

    try {
      if (editingAssignment) {
        const res = await mutate<any>(UPDATE_ASSIGNMENT_MUTATION, {
          assignmentId: editingAssignment.id,
          input,
        }, token ?? undefined);
        if (!res.updateAssignment?.success) {
          setError(res.updateAssignment?.message || 'Failed to update assignment.');
          return;
        }
      } else {
        const res = await mutate<any>(CREATE_ASSIGNMENT_MUTATION, { input }, token ?? undefined);
        if (!res.createAssignment?.success) {
          setError(res.createAssignment?.message || 'Failed to create assignment.');
          return;
        }
      }
      setDialogOpen(false);
      if (staffId) await loadData(staffId);
      setTabFor(dialogSubject.subjectId, 'assignments');
    } catch (e: any) {
      setError(e?.message || 'Failed to save assignment.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAssignment(assignmentId: string) {
    if (!confirm('Delete this assignment?')) return;
    try {
      await mutate<any>(DELETE_ASSIGNMENT_MUTATION, { assignmentId }, token ?? undefined);
      if (staffId) await loadData(staffId);
    } catch { /* ignore */ }
  }

  async function handleTogglePublish(assignment: Assignment) {
    const input = {
      courseId: assignment.course.id,
      title: assignment.title,
      description: assignment.description || '',
      assignmentType: assignment.assignmentType,
      dueDate: new Date(assignment.dueDate).toISOString(),
      totalMarks: Number(assignment.totalMarks),
      isPublished: !assignment.isPublished,
      allowLateSubmission: false,
      latePenaltyPercent: 0,
      attachmentUrl: assignment.attachmentUrl || null,
      attachmentType: assignment.attachmentType || null,
    };
    try {
      await mutate<any>(UPDATE_ASSIGNMENT_MUTATION, { assignmentId: assignment.id, input }, token ?? undefined);
      if (staffId) await loadData(staffId);
    } catch { /* ignore */ }
  }

  async function handleAttachmentUpload(file: File): Promise<{ url: string; type: string; name: string } | null> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(UPLOAD_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) return null;
    const data = await res.json();
    return { url: data.url, type: data.type, name: data.filename };
  }

  const totalStudents = new Set(
    subjects.flatMap(s => getStudents(s.subjectId).map(st => st.id))
  ).size;

  const totalAssignments = assignments.length;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Subjects</h1>
        <p className="text-muted-foreground">View enrolled students and manage assignments for your subjects</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-0">
          <CardContent className="pt-4 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/70"><BookOpen className="h-6 w-6 text-blue-600 flex-shrink-0" /></div>
            <div>
              <p className="text-2xl font-bold text-blue-800">{subjects.length}</p>
              <p className="text-xs text-blue-600 font-medium">Subjects</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-0">
          <CardContent className="pt-4 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/70"><Users className="h-6 w-6 text-green-600 flex-shrink-0" /></div>
            <div>
              <p className="text-2xl font-bold text-green-800">{totalStudents}</p>
              <p className="text-xs text-green-600 font-medium">Students</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-yellow-100 border-0">
          <CardContent className="pt-4 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/70"><ClipboardList className="h-6 w-6 text-amber-600 flex-shrink-0" /></div>
            <div>
              <p className="text-2xl font-bold text-amber-800">{totalAssignments}</p>
              <p className="text-xs text-amber-600 font-medium">Assignments</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subject list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />)}
        </div>
      ) : subjects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">No subjects assigned</h3>
            <p className="text-muted-foreground text-sm">Ask the admin to assign subjects to you.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {subjects.slice((subjectsPage - 1) * PAGE_SIZE, subjectsPage * PAGE_SIZE).map(subject => {
            const isExpanded = expandedId === subject.subjectId;
            const students = getStudents(subject.subjectId);
            const subjectAssignments = getAssignments(subject.subjectId);
            const tab = getTabFor(subject.subjectId);

            return (
              <Card key={subject.id} className={isExpanded ? 'ring-1 ring-primary/30' : ''}>
                {/* Subject header — clickable to expand */}
                <button
                  className="w-full text-left"
                  onClick={() => setExpandedId(isExpanded ? null : subject.subjectId)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      {isExpanded
                        ? <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        : <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      }
                      {subject.isPrimary && (
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base">{subject.subjectName}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Assigned {new Date(subject.assignedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-muted-foreground">{students.length} students</span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">{subjectAssignments.length} assignments</span>
                        <Badge variant={subject.isPrimary ? 'default' : 'secondary'} className="text-xs">
                          {subject.isPrimary ? 'Primary' : 'Support'}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <CardContent className="pt-0 border-t">
                    {/* Inner tabs */}
                    <div className="flex items-center justify-between mb-4 mt-4">
                      <div className="flex rounded-lg border overflow-hidden">
                        <button
                          onClick={() => setTabFor(subject.subjectId, 'students')}
                          className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                            tab === 'students'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-card text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <Users className="h-3.5 w-3.5 inline mr-1.5" />
                          Students ({students.length})
                        </button>
                        <button
                          onClick={() => setTabFor(subject.subjectId, 'assignments')}
                          className={`px-4 py-1.5 text-sm font-medium transition-colors border-l ${
                            tab === 'assignments'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-card text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <ClipboardList className="h-3.5 w-3.5 inline mr-1.5" />
                          Assignments ({subjectAssignments.length})
                        </button>
                      </div>
                      {tab === 'assignments' && (
                        <Button size="sm" onClick={() => openCreateDialog(subject)}>
                          <Plus className="h-4 w-4 mr-1" />
                          New Assignment
                        </Button>
                      )}
                    </div>

                    {/* Students tab */}
                    {tab === 'students' && (() => {
                      const sPage = getStudentPage(subject.subjectId);
                      const pagedStudents = students.slice((sPage - 1) * PAGE_SIZE, sPage * PAGE_SIZE);
                      return students.length === 0 ? (
                        <div className="text-center py-8 text-sm text-muted-foreground">
                          No students enrolled in this subject yet.
                        </div>
                      ) : (
                        <>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>#</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Student No.</TableHead>
                                <TableHead>Grade</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {pagedStudents.map((student, idx) => (
                                <TableRow key={student.id}>
                                  <TableCell className="text-muted-foreground text-xs">
                                    {(sPage - 1) * PAGE_SIZE + idx + 1}
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    {student.first_name} {student.last_name}
                                  </TableCell>
                                  <TableCell className="font-mono text-sm">{student.student_number}</TableCell>
                                  <TableCell className="text-sm text-muted-foreground">{student.grade_level || '—'}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                          <Pager
                            page={sPage}
                            total={students.length}
                            onChange={p => setStudentPage(subject.subjectId, p)}
                          />
                        </>
                      );
                    })()}

                    {/* Assignments tab */}
                    {tab === 'assignments' && (() => {
                      const aPage = getAssignmentPage(subject.subjectId);
                      const pagedAssignments = subjectAssignments.slice((aPage - 1) * PAGE_SIZE, aPage * PAGE_SIZE);
                      return subjectAssignments.length === 0 ? (
                        <div className="text-center py-8 text-sm text-muted-foreground">
                          No assignments yet.{' '}
                          <button
                            className="text-primary hover:underline"
                            onClick={() => openCreateDialog(subject)}
                          >
                            Create one
                          </button>
                        </div>
                      ) : (
                        <>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Title</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Due Date</TableHead>
                              <TableHead>Marks</TableHead>
                              <TableHead>Submissions</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {pagedAssignments.map(a => (
                              <TableRow key={a.id}>
                                <TableCell>
                                  <p className="font-medium text-sm">{a.title}</p>
                                  {a.description && (
                                    <p className="text-xs text-muted-foreground line-clamp-1">{a.description}</p>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="text-xs capitalize">
                                    {a.assignmentType}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm">
                                  <span className={a.isOverdue && !a.isPublished ? 'text-destructive' : ''}>
                                    {new Date(a.dueDate).toLocaleDateString()}
                                  </span>
                                </TableCell>
                                <TableCell className="text-sm">{a.totalMarks}</TableCell>
                                <TableCell className="text-sm">
                                  <span className={a.submissionCount > 0 ? 'text-primary font-medium' : 'text-muted-foreground'}>
                                    {a.submissionCount}
                                  </span>
                                  <span className="text-xs text-muted-foreground ml-1">submitted</span>
                                </TableCell>
                                <TableCell>
                                  {a.isPublished ? (
                                    <span className="flex items-center gap-1 text-xs text-green-700">
                                      <Eye className="h-3.5 w-3.5" /> Published
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <EyeOff className="h-3.5 w-3.5" /> Draft
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-xs h-7 gap-1"
                                      onClick={() => openViewDialog(a)}
                                    >
                                      <Eye className="h-3 w-3" />
                                      View
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-xs h-7 gap-1"
                                      onClick={() => openEditDialog(a)}
                                    >
                                      <Pencil className="h-3 w-3" />
                                      Edit
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className={`text-xs h-7 gap-1 ${a.isPublished ? 'text-muted-foreground' : 'text-green-700 hover:text-green-800'}`}
                                      onClick={() => handleTogglePublish(a)}
                                    >
                                      {a.isPublished
                                        ? <><EyeOff className="h-3 w-3" /> Unpublish</>
                                        : <><Eye className="h-3 w-3" /> Publish</>
                                      }
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-destructive hover:text-destructive text-xs h-7"
                                      onClick={() => handleDeleteAssignment(a.id)}
                                    >
                                      Delete
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        <Pager
                          page={aPage}
                          total={subjectAssignments.length}
                          onChange={p => setAssignmentPage(subject.subjectId, p)}
                        />
                        </>
                      );
                    })()}
                  </CardContent>
                )}
              </Card>
            );
          })}
          <Pager
            page={subjectsPage}
            total={subjects.length}
            onChange={p => { setSubjectsPage(p); setExpandedId(null); }}
          />
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Create Assignment Dialog                                           */}
      {/* ----------------------------------------------------------------- */}
      <Dialog open={dialogOpen} onOpenChange={o => { setDialogOpen(o); if (!o) setError(''); }}>
        <DialogContent className="max-w-lg flex flex-col max-h-[90vh]">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>{editingAssignment ? 'Edit Assignment' : 'New Assignment'}</DialogTitle>
            {dialogSubject && (
              <p className="text-sm text-muted-foreground">
                For: <span className="font-medium">{dialogSubject.subjectName}</span>
              </p>
            )}
          </DialogHeader>

          <div className="overflow-y-auto flex-1 pr-1">
          <div className="space-y-4 pt-2">
            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="space-y-1">
              <Label>Title *</Label>
              <Input
                placeholder="e.g. Chapter 3 Homework"
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <Label>Description</Label>
              <textarea
                className="w-full min-h-[80px] rounded-md border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="Instructions for students…"
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Type</Label>
                <Select
                  value={form.assignmentType}
                  onValueChange={v => setForm(p => ({ ...p, assignmentType: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="homework">Homework</SelectItem>
                    <SelectItem value="quiz">Quiz</SelectItem>
                    <SelectItem value="exam">Exam</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                    <SelectItem value="lab">Lab</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Total Marks</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.totalMarks}
                  onChange={e => setForm(p => ({ ...p, totalMarks: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Due Date & Time *</Label>
              <Input
                type="datetime-local"
                value={form.dueDate}
                onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))}
              />
            </div>

            {/* Attachment */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Paperclip className="h-3.5 w-3.5" />
                Attachment (optional)
              </Label>
              <div className="flex rounded-lg border overflow-hidden text-sm">
                {(['none', 'url', 'file'] as const).map((mode, i) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setForm(p => ({ ...p, attachmentMode: mode, attachmentUrl: '', attachmentFileName: '' }))}
                    className={`flex-1 py-1.5 font-medium capitalize transition-colors ${i > 0 ? 'border-l' : ''} ${
                      form.attachmentMode === mode
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {mode === 'none' ? 'None' : mode === 'url' ? 'Link / URL' : 'Upload File'}
                  </button>
                ))}
              </div>

              {form.attachmentMode === 'url' && (
                <div className="space-y-2">
                  <div className="relative">
                    <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      placeholder="https://drive.google.com/…"
                      value={form.attachmentUrl}
                      onChange={e => setForm(p => ({ ...p, attachmentUrl: e.target.value }))}
                    />
                  </div>
                  <Select
                    value={form.attachmentType}
                    onValueChange={v => setForm(p => ({ ...p, attachmentType: v }))}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="File type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF Document</SelectItem>
                      <SelectItem value="doc">Word Document</SelectItem>
                      <SelectItem value="image">Image</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="spreadsheet">Spreadsheet</SelectItem>
                      <SelectItem value="link">Web Link</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {form.attachmentMode === 'file' && (
                <div className="space-y-2">
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex flex-col items-center gap-1 text-muted-foreground">
                      <Paperclip className="h-5 w-5" />
                      <span className="text-xs font-medium">
                        {form.attachmentFileName
                          ? (form.attachmentUrl ? '✓ Uploaded' : 'Uploading…')
                          : 'Click to select a file'}
                      </span>
                      {!form.attachmentFileName && (
                        <span className="text-xs">PDF, DOC, images up to 20 MB</span>
                      )}
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.gif,.mp4"
                      onChange={async e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setForm(p => ({ ...p, attachmentFileName: file.name, attachmentUrl: '' }));
                        const result = await handleAttachmentUpload(file);
                        if (result) {
                          setForm(p => ({
                            ...p,
                            attachmentUrl: result.url,
                            attachmentType: result.type,
                            attachmentFileName: result.name,
                          }));
                        } else {
                          setError('File upload failed. Try again or use a URL link.');
                          setForm(p => ({ ...p, attachmentFileName: '' }));
                        }
                      }}
                    />
                  </label>
                  {form.attachmentFileName && (
                    <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted rounded px-3 py-1.5">
                      <span className="truncate">{form.attachmentFileName}</span>
                      <button
                        type="button"
                        className="ml-2 hover:text-destructive flex-shrink-0"
                        onClick={() => setForm(p => ({ ...p, attachmentUrl: '', attachmentFileName: '' }))}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPublished"
                checked={form.isPublished}
                onChange={e => setForm(p => ({ ...p, isPublished: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="isPublished" className="cursor-pointer font-normal">
                Publish immediately (visible to students)
              </Label>
            </div>

          </div>
          </div>

          <div className="flex gap-2 pt-3 flex-shrink-0 border-t">
            <Button
              className="flex-1"
              onClick={handleSaveAssignment}
              disabled={saving || !form.title || !form.dueDate}
            >
              {saving
                ? (editingAssignment ? 'Saving…' : 'Creating…')
                : (editingAssignment ? 'Save Changes' : 'Create Assignment')}
            </Button>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ----------------------------------------------------------------- */}
      {/* View Assignment Dialog                                             */}
      {/* ----------------------------------------------------------------- */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              {viewingAssignment?.title}
            </DialogTitle>
          </DialogHeader>

          {viewingAssignment && (
            <div className="space-y-4 pt-1">
              {/* Status row */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="capitalize">{viewingAssignment.assignmentType}</Badge>
                {viewingAssignment.isPublished ? (
                  <Badge className="gap-1 bg-green-600 hover:bg-green-600">
                    <Eye className="h-3 w-3" /> Published
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <EyeOff className="h-3 w-3" /> Draft
                  </Badge>
                )}
                {viewingAssignment.isOverdue && !viewingAssignment.isPublished && (
                  <Badge variant="destructive">Overdue</Badge>
                )}
              </div>

              {/* Meta grid */}
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="rounded-lg bg-muted/50 px-3 py-2">
                  <p className="text-xs text-muted-foreground mb-0.5">Due Date</p>
                  <p className="font-medium">
                    {new Date(viewingAssignment.dueDate).toLocaleString(undefined, {
                      dateStyle: 'medium', timeStyle: 'short',
                    })}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/50 px-3 py-2">
                  <p className="text-xs text-muted-foreground mb-0.5">Total Marks</p>
                  <p className="font-medium">{viewingAssignment.totalMarks}</p>
                </div>
                <div className="rounded-lg bg-muted/50 px-3 py-2">
                  <p className="text-xs text-muted-foreground mb-0.5">Submissions</p>
                  <p className="font-medium">{viewingAssignment.submissionCount}</p>
                </div>
              </div>

              {/* Description */}
              {viewingAssignment.description && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Description</p>
                  <p className="text-sm whitespace-pre-wrap rounded-lg bg-muted/50 px-3 py-2">
                    {viewingAssignment.description}
                  </p>
                </div>
              )}

              {/* Attachment */}
              {viewingAssignment.attachmentUrl && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Attachment</p>
                  <a
                    href={viewingAssignment.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline rounded-lg border px-3 py-2 w-fit"
                  >
                    <Paperclip className="h-4 w-4 flex-shrink-0" />
                    <span>
                      {viewingAssignment.attachmentType
                        ? viewingAssignment.attachmentType.toUpperCase()
                        : 'Attachment'}
                    </span>
                    <Link2 className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  </a>
                </div>
              )}

              <div className="flex gap-2 pt-1 border-t">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => { setViewOpen(false); openEditDialog(viewingAssignment); }}
                >
                  <Pencil className="h-4 w-4 mr-1.5" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  className={`flex-1 ${viewingAssignment.isPublished ? '' : 'text-green-700 border-green-300 hover:bg-green-50'}`}
                  onClick={() => { handleTogglePublish(viewingAssignment); setViewOpen(false); }}
                >
                  {viewingAssignment.isPublished
                    ? <><EyeOff className="h-4 w-4 mr-1.5" />Unpublish</>
                    : <><Eye className="h-4 w-4 mr-1.5" />Publish</>
                  }
                </Button>
                <Button variant="ghost" onClick={() => setViewOpen(false)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

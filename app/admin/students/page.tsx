'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/lib/auth-context';
import { mutate, query } from '@/lib/graphql';
import {
  ChevronDown, ChevronLeft, ChevronRight,
  Edit2, Eye, EyeOff,
  GraduationCap, Layers, Pencil, Plus, Search, Trash2, Users,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

// ---------------------------------------------------------------------------
// GraphQL
// ---------------------------------------------------------------------------
const STUDENTS_QUERY = `
  query AdminStudents {
    students(limit: 500) {
      id student_number first_name last_name status grade_level section academic_year
      user { id email phone is_active created_at }
    }
  }
`;

const CLASS_GROUPS_QUERY = `
  query ClassGroups {
    classGroups {
      id name studentCount activeCount parentId
    }
  }
`;

const CREATE_CLASS_GROUP = `
  mutation CreateClassGroup($name: String!, $parentId: ID) {
    createClassGroup(name: $name, parentId: $parentId) {
      success message
      classGroup { id name studentCount activeCount parentId }
    }
  }
`;

const DELETE_CLASS_GROUP = `
  mutation DeleteClassGroup($id: ID!) {
    deleteClassGroup(id: $id) { success message }
  }
`;

const RENAME_CLASS_GROUP = `
  mutation RenameClassGroup($id: ID!, $name: String!) {
    renameClassGroup(id: $id, name: $name) {
      success message
      classGroup { id name studentCount activeCount }
    }
  }
`;

const REGISTER_STUDENT = `
  mutation RegisterStudent($input: RegisterStudentInput!) {
    registerStudent(input: $input) {
      success message
      student { id student_number first_name last_name status grade_level section
                user { id email is_active created_at } }
    }
  }
`;

const UPDATE_STUDENT = `
  mutation UpdateStudent($studentId: ID!, $input: UpdateStudentInput!) {
    updateStudent(studentId: $studentId, input: $input) {
      success message
      student { id student_number first_name last_name status grade_level section
                user { id email phone is_active } }
    }
  }
`;

const DEACTIVATE_USER = `
  mutation DeactivateUser($userId: ID!) {
    deactivateUser(userId: $userId) { success message }
  }
`;

const ACTIVATE_USER = `
  mutation ActivateUser($userId: ID!) {
    activateUser(userId: $userId) { success message }
  }
`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Student {
  id: string; student_number: string; first_name: string; last_name: string;
  status: string; grade_level: string | null; section: string | null; academic_year: string;
  user: { id: string; email: string; phone?: string; is_active: boolean; created_at: string };
}

interface ClassGroup {
  id: string; name: string; studentCount: number; activeCount: number;
  parentId: string | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const PAGE_SIZE    = 5;
const CG_PAGE_SIZE = 5;

const STATUSES = ['active', 'suspended', 'withdrawn', 'graduated'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function initials(s: Student) {
  return `${s.first_name[0] ?? ''}${s.last_name[0] ?? ''}`.toUpperCase();
}
function fmtDate(ts: string) {
  return new Date(ts).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
}

function Paginator({ page, total, onChange }: { page: number; total: number; onChange(p: number): void }) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from  = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to    = Math.min(page * PAGE_SIZE, total);
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/10">
      <span className="text-xs text-muted-foreground">{total === 0 ? 'No records' : `${from}–${to} of ${total}`}</span>
      <div className="flex items-center gap-1">
        <button disabled={page <= 1} onClick={() => onChange(page - 1)}
          className="p-1.5 rounded border bg-background disabled:opacity-30 hover:bg-muted">
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
          <button key={p} onClick={() => onChange(p)}
            className={`w-7 h-7 rounded text-xs font-medium ${p === page ? 'bg-primary text-primary-foreground' : 'border bg-background hover:bg-muted'}`}>
            {p}
          </button>
        ))}
        <button disabled={page >= pages} onClick={() => onChange(page + 1)}
          className="p-1.5 rounded border bg-background disabled:opacity-30 hover:bg-muted">
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Password field with eye toggle
// ---------------------------------------------------------------------------
function PasswordField({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange(v: string): void; placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      <div className="relative">
        <Input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder ?? '••••••••'}
          className="pr-10"
        />
        <button type="button" onClick={() => setShow(v => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty form state
// ---------------------------------------------------------------------------
const emptyForm = {
  firstName: '', lastName: '', email: '', username: '',
  password: '', confirmPassword: '',
  studentNumber: '', gradeLevel: '',
  academicYear: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function AdminStudentsPage() {
  const { token } = useAuth();
  const [tab, setTab]               = useState<'students' | 'classgroups'>('students');
  const [students, setStudents]     = useState<Student[]>([]);
  const [loading, setLoading]       = useState(true);

  // Student list filters & pagination
  const [search, setSearch]         = useState('');
  const [filterGroup, setFilterGroup] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage]             = useState(1);

  // Register dialog
  const [registerOpen, setRegisterOpen] = useState(false);
  const [form, setForm]             = useState(emptyForm);
  const [formError, setFormError]   = useState('');
  const [saving, setSaving]         = useState(false);

  // Edit dialog
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [editForm, setEditForm]     = useState<Partial<typeof emptyForm>>({});
  const [editError, setEditError]   = useState('');
  const [editSaving, setEditSaving] = useState(false);

  // Class groups (backend-persisted)
  const [classGroups, setClassGroups] = useState<ClassGroup[]>([]);
  const [cgLoading, setCgLoading]   = useState(true);
  const [addGroupOpen, setAddGroupOpen] = useState(false);
  const [newGroupInput, setNewGroupInput] = useState('');
  const [cgAddMsg, setCgAddMsg]     = useState('');
  const [cgAddSaving, setCgAddSaving] = useState(false);
  const [editGroup, setEditGroup]   = useState<ClassGroup | null>(null);
  const [editGroupInput, setEditGroupInput] = useState('');
  const [editGroupMsg, setEditGroupMsg] = useState('');
  const [editGroupSaving, setEditGroupSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<ClassGroup | null>(null);
  const [deleteSaving, setDeleteSaving] = useState(false);
  const [addGroupParentId, setAddGroupParentId] = useState<string | null>(null);
  const [cgPage, setCgPage]               = useState(1);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // Load students + class groups
  useEffect(() => {
    if (!token) return;
    query<any>(STUDENTS_QUERY, {}, token)
      .then(r => setStudents(r.students ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
    query<any>(CLASS_GROUPS_QUERY, {}, token)
      .then(r => setClassGroups(r.classGroups ?? []))
      .catch(() => {})
      .finally(() => setCgLoading(false));
  }, [token]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [search, filterGroup, filterStatus]);

  // Group names for filter dropdowns and registration form
  const allGroups      = useMemo(() => classGroups.map(g => g.name), [classGroups]);
  const topGroups      = useMemo(() => classGroups.filter(g => !g.parentId), [classGroups]);
  const pagedTopGroups = useMemo(
    () => topGroups.slice((cgPage - 1) * CG_PAGE_SIZE, cgPage * CG_PAGE_SIZE),
    [topGroups, cgPage],
  );

  // Filtered + paginated students
  const filtered = useMemo(() => students.filter(s => {
    const q = search.toLowerCase();
    const matchQ = !q || `${s.first_name} ${s.last_name} ${s.student_number} ${s.user.email}`.toLowerCase().includes(q);
    const matchG = filterGroup === 'all' || s.grade_level === filterGroup;
    const matchS = filterStatus === 'all' || s.status === filterStatus;
    return matchQ && matchG && matchS;
  }), [students, search, filterGroup, filterStatus]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ── Register ──
  async function handleRegister() {
    setFormError('');
    if (!form.firstName || !form.lastName || !form.email || !form.username || !form.password || !form.studentNumber) {
      setFormError('Please fill in all required fields.'); return;
    }
    if (form.password !== form.confirmPassword) {
      setFormError('Passwords do not match.'); return;
    }
    if (form.password.length < 6) {
      setFormError('Password must be at least 6 characters.'); return;
    }
    setSaving(true);
    try {
      const r = await mutate<any>(REGISTER_STUDENT, {
        input: {
          username: form.username, email: form.email, password: form.password,
          firstName: form.firstName, lastName: form.lastName,
          studentNumber: form.studentNumber,
          gradeLevel: form.gradeLevel || null,
          academicYear: form.academicYear,
        },
      }, token!);
      const res = r.registerStudent;
      if (!res?.success) { setFormError(res?.message ?? 'Registration failed'); return; }
      setStudents(prev => [res.student, ...prev]);
      setRegisterOpen(false);
      setForm(emptyForm);
    } catch { setFormError('Network error'); }
    finally { setSaving(false); }
  }

  // ── Edit ──
  function openEdit(s: Student) {
    setEditStudent(s);
    setEditForm({
      firstName: s.first_name, lastName: s.last_name,
      email: s.user.email,
      gradeLevel: s.grade_level ?? '',
    });
    setEditError('');
  }

  async function handleEdit() {
    if (!editStudent || !token) return;
    setEditError('');
    if (!editForm.firstName || !editForm.lastName || !editForm.email) {
      setEditError('First name, last name, and email are required.'); return;
    }
    setEditSaving(true);
    try {
      const r = await mutate<any>(UPDATE_STUDENT, {
        studentId: editStudent.id,
        input: {
          firstName: editForm.firstName, lastName: editForm.lastName,
          email: editForm.email,
          gradeLevel: editForm.gradeLevel || null,
        },
      }, token);
      const res = r.updateStudent;
      if (!res?.success) { setEditError(res?.message ?? 'Update failed'); return; }
      setStudents(prev => prev.map(s => s.id === editStudent.id ? { ...s, ...res.student } : s));
      setEditStudent(null);
    } catch { setEditError('Network error'); }
    finally { setEditSaving(false); }
  }

  // ── Toggle active ──
  async function toggleActive(s: Student) {
    if (!token) return;
    const mut = s.user.is_active ? DEACTIVATE_USER : ACTIVATE_USER;
    await mutate<any>(mut, { userId: s.user.id }, token).catch(() => null);
    setStudents(prev => prev.map(x => x.id === s.id
      ? { ...x, user: { ...x.user, is_active: !s.user.is_active } } : x));
  }

  // ── Class groups ──
  function toggleCollapse(parentId: string) {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      next.has(parentId) ? next.delete(parentId) : next.add(parentId);
      return next;
    });
  }

  async function addGroup() {
    const g = newGroupInput.trim();
    setCgAddMsg('');
    if (!g) { setCgAddMsg('Please enter a name.'); return; }
    setCgAddSaving(true);
    try {
      const r = await mutate<any>(CREATE_CLASS_GROUP, { name: g, parentId: addGroupParentId }, token!);
      const res = r.createClassGroup;
      if (!res?.success) { setCgAddMsg(res?.message ?? 'Failed to create'); return; }
      setClassGroups(prev => [...prev, res.classGroup]);
      // Auto-expand parent when a sub-class is added
      if (addGroupParentId) {
        setCollapsedGroups(prev => { const next = new Set(prev); next.delete(addGroupParentId); return next; });
      }
      setNewGroupInput('');
      setCgAddMsg('');
      setAddGroupOpen(false);
    } catch {
      setCgAddMsg('Network error. Please try again.');
    } finally {
      setCgAddSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteConfirm || !token) return;
    setDeleteSaving(true);
    try {
      const r = await mutate<any>(DELETE_CLASS_GROUP, { id: deleteConfirm.id }, token);
      if (r.deleteClassGroup?.success) {
        // Also remove sub-groups (CASCADE handled by DB, remove from local state too)
        setClassGroups(prev => prev.filter(g => g.id !== deleteConfirm.id && g.parentId !== deleteConfirm.id));
        setDeleteConfirm(null);
      }
    } catch {}
    finally { setDeleteSaving(false); }
  }

  async function renameGroup() {
    if (!editGroup || !token) return;
    const name = editGroupInput.trim();
    setEditGroupMsg('');
    if (!name) { setEditGroupMsg('Name cannot be empty.'); return; }
    setEditGroupSaving(true);
    try {
      const r = await mutate<any>(RENAME_CLASS_GROUP, { id: editGroup.id, name }, token);
      const res = r.renameClassGroup;
      if (!res?.success) { setEditGroupMsg(res?.message ?? 'Rename failed'); return; }
      setClassGroups(prev => prev.map(g => g.id === editGroup.id ? res.classGroup : g));
      setEditGroup(null);
    } catch {
      setEditGroupMsg('Network error. Please try again.');
    } finally {
      setEditGroupSaving(false);
    }
  }

  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Student Management</h1>
          <p className="text-muted-foreground text-sm">Register and manage student accounts</p>
        </div>
        <div className="flex gap-2">
          {tab === 'students' && (
            <Button onClick={() => { setRegisterOpen(true); setForm(emptyForm); setFormError(''); }} className="gap-2">
              <Plus className="h-4 w-4" />Register Student
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total',    value: students.length },
          { label: 'Active',   value: students.filter(s => s.status === 'active').length },
          { label: 'Class Groups', value: allGroups.length },
          { label: 'Inactive', value: students.filter(s => !s.user.is_active).length },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border bg-card p-4">
            <p className="text-2xl font-bold">{loading ? '—' : value}</p>
            <p className="text-xs text-muted-foreground mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border rounded-xl p-1 bg-muted/30 w-fit">
        <button onClick={() => setTab('students')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'students' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}>
          <Users className="h-4 w-4" />Students
        </button>
        <button onClick={() => setTab('classgroups')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'classgroups' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}>
          <Layers className="h-4 w-4" />Class Groups
        </button>
      </div>

      {/* ── Students Tab ── */}
      {tab === 'students' && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <CardTitle className="text-base flex-1">Students ({filtered.length})</CardTitle>
              {/* Filters */}
              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search name, number, email…"
                    className="pl-8 pr-3 py-1.5 border rounded-lg text-sm bg-background w-56 focus:outline-none focus:ring-1 focus:ring-ring" />
                </div>
                <Select value={filterGroup} onValueChange={setFilterGroup}>
                  <SelectTrigger className="w-36 h-9 text-sm"><SelectValue placeholder="All classes" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All classes</SelectItem>
                    {allGroups.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-32 h-9 text-sm"><SelectValue placeholder="All statuses" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 bg-muted rounded animate-pulse" />)}</div>
            ) : paged.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <GraduationCap className="h-10 w-10 mb-3 opacity-30" />
                <p className="text-sm font-medium">No students found</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Student</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Number</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Class Group</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Status</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Joined</th>
                        <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {paged.map(s => (
                        <tr key={s.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                                {initials(s)}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium truncate">{s.first_name} {s.last_name}</p>
                                <p className="text-xs text-muted-foreground truncate">{s.user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs">{s.student_number}</td>
                          <td className="px-4 py-3 text-sm">{s.grade_level || '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                              s.status === 'active' ? 'bg-green-100 text-green-700'
                              : s.status === 'suspended' ? 'bg-red-100 text-red-700'
                              : 'bg-muted text-muted-foreground'
                            }`}>{s.status}</span>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{fmtDate(s.user.created_at)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(s)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="sm" variant="ghost"
                                className={`h-8 text-xs ${s.user.is_active ? 'text-orange-600 hover:text-orange-700' : 'text-green-600 hover:text-green-700'}`}
                                onClick={() => toggleActive(s)}>
                                {s.user.is_active ? 'Deactivate' : 'Activate'}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Paginator page={page} total={filtered.length} onChange={setPage} />
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Class Groups Tab ── */}
      {tab === 'classgroups' && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Class Groups</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {topGroups.length} level{topGroups.length !== 1 ? 's' : ''} · {classGroups.length} total groups
                </p>
              </div>
              <Button size="sm" className="gap-1.5" onClick={() => { setAddGroupParentId(null); setAddGroupOpen(true); setNewGroupInput(''); setCgAddMsg(''); }}>
                <Plus className="h-4 w-4" />Add Level
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {cgLoading ? (
              <div className="p-4 space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-muted rounded animate-pulse" />)}</div>
            ) : topGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Layers className="h-6 w-6 opacity-40" />
                </div>
                <p className="text-sm font-medium">No class groups yet</p>
                <p className="text-xs mt-1">Click "Add Level" to create Form 1, Form 2, etc.</p>
              </div>
            ) : (
              <>
                <div className="divide-y">
                  {pagedTopGroups.map(parent => {
                    const subs      = classGroups.filter(g => g.parentId === parent.id);
                    const collapsed = collapsedGroups.has(parent.id);
                    return (
                      <div key={parent.id}>
                        {/* Parent / level row */}
                        <div className="flex items-center justify-between px-5 py-4 hover:bg-muted/20 transition-colors group">
                          <div className="flex items-center gap-3">
                            {/* Fold/unfold chevron — only shown when sub-classes exist */}
                            <button
                              onClick={() => subs.length > 0 && toggleCollapse(parent.id)}
                              className={`p-0.5 rounded text-muted-foreground transition-colors ${
                                subs.length > 0 ? 'hover:text-foreground hover:bg-muted cursor-pointer' : 'opacity-0 pointer-events-none'
                              }`}
                              aria-label={collapsed ? 'Expand' : 'Collapse'}
                            >
                              {collapsed
                                ? <ChevronRight className="h-4 w-4" />
                                : <ChevronDown className="h-4 w-4" />}
                            </button>
                            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                              <GraduationCap className="h-4.5 w-4.5 text-primary" />
                            </div>
                            <div>
                              <p className="font-semibold text-sm">{parent.name}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {subs.length > 0
                                  ? `${subs.length} sub-class${subs.length !== 1 ? 'es' : ''}${parent.studentCount > 0 ? ` · ${parent.studentCount} student${parent.studentCount !== 1 ? 's' : ''}` : ''}`
                                  : parent.studentCount === 0
                                    ? 'No students assigned'
                                    : `${parent.studentCount} student${parent.studentCount !== 1 ? 's' : ''} · ${parent.activeCount} active`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`text-center min-w-[44px] px-2.5 py-1 rounded-lg text-xs font-semibold ${
                              parent.studentCount > 0 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                            }`}>
                              {parent.studentCount}
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
                                onClick={() => { setAddGroupParentId(parent.id); setAddGroupOpen(true); setNewGroupInput(''); setCgAddMsg(''); }}>
                                <Plus className="h-3 w-3" />Sub-class
                              </Button>
                              <Button size="icon" variant="ghost"
                                className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                onClick={() => { setEditGroup(parent); setEditGroupInput(parent.name); setEditGroupMsg(''); }}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="icon" variant="ghost"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                onClick={() => setDeleteConfirm(parent)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        {/* Sub-class rows — hidden when collapsed */}
                        {!collapsed && subs.map(sub => (
                          <div key={sub.id} className="flex items-center justify-between pl-16 pr-5 py-3 border-t border-muted/40 bg-muted/5 hover:bg-muted/20 transition-colors group">
                            <div className="flex items-center gap-3">
                              <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
                              <div>
                                <p className="font-medium text-sm">{sub.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {sub.studentCount === 0
                                    ? 'No students'
                                    : `${sub.studentCount} student${sub.studentCount !== 1 ? 's' : ''} · ${sub.activeCount} active`}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className={`text-center min-w-[36px] px-2 py-0.5 rounded text-xs font-semibold ${
                                sub.studentCount > 0 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                              }`}>
                                {sub.studentCount}
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button size="icon" variant="ghost"
                                  className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                  onClick={() => { setEditGroup(sub); setEditGroupInput(sub.name); setEditGroupMsg(''); }}>
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button size="icon" variant="ghost"
                                  className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => setDeleteConfirm(sub)}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
                <Paginator page={cgPage} total={topGroups.length} onChange={p => { setCgPage(p); setCollapsedGroups(new Set()); }} />
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Register Dialog ── */}
      <Dialog open={registerOpen} onOpenChange={o => { setRegisterOpen(o); if (!o) setFormError(''); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />Register New Student
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Name */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">First Name <span className="text-destructive">*</span></Label>
                <Input placeholder="John" value={form.firstName}
                  onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Last Name <span className="text-destructive">*</span></Label>
                <Input placeholder="Doe" value={form.lastName}
                  onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Email Address <span className="text-destructive">*</span></Label>
              <Input type="email" placeholder="john.doe@school.edu" value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            </div>

            {/* Username + Student number */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Username <span className="text-destructive">*</span></Label>
                <Input placeholder="john.doe" value={form.username}
                  onChange={e => setForm(p => ({ ...p, username: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Student Number <span className="text-destructive">*</span></Label>
                <Input placeholder="STD-001" value={form.studentNumber}
                  onChange={e => setForm(p => ({ ...p, studentNumber: e.target.value }))} />
              </div>
            </div>

            {/* Password + Confirm */}
            <div className="grid grid-cols-2 gap-3">
              <PasswordField label="Password *" value={form.password}
                onChange={v => setForm(p => ({ ...p, password: v }))} />
              <PasswordField label="Confirm Password *" value={form.confirmPassword}
                onChange={v => setForm(p => ({ ...p, confirmPassword: v }))}
                placeholder="Re-enter password" />
            </div>

            {/* Class Group + Academic Year */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Class Group</Label>
                <Select value={form.gradeLevel || 'none'} onValueChange={v => setForm(p => ({ ...p, gradeLevel: v === 'none' ? '' : v }))}>
                  <SelectTrigger><SelectValue placeholder="Select class…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No class group</SelectItem>
                    {allGroups.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Academic Year</Label>
                <Input placeholder="2024/2025" value={form.academicYear}
                  onChange={e => setForm(p => ({ ...p, academicYear: e.target.value }))} />
              </div>
            </div>

            {formError && <p className="text-sm text-destructive">{formError}</p>}

            <div className="flex gap-2 pt-1">
              <Button className="flex-1" onClick={handleRegister} disabled={saving}>
                {saving ? 'Registering…' : 'Register Student'}
              </Button>
              <Button variant="outline" onClick={() => setRegisterOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Edit Dialog ── */}
      <Dialog open={!!editStudent} onOpenChange={o => { if (!o) setEditStudent(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="h-4 w-4 text-primary" />
              Edit — {editStudent?.first_name} {editStudent?.last_name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">First Name <span className="text-destructive">*</span></Label>
                <Input value={editForm.firstName ?? ''}
                  onChange={e => setEditForm(p => ({ ...p, firstName: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Last Name <span className="text-destructive">*</span></Label>
                <Input value={editForm.lastName ?? ''}
                  onChange={e => setEditForm(p => ({ ...p, lastName: e.target.value }))} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Email <span className="text-destructive">*</span></Label>
              <Input type="email" value={editForm.email ?? ''}
                onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Class Group</Label>
              <Select value={editForm.gradeLevel || 'none'} onValueChange={v => setEditForm(p => ({ ...p, gradeLevel: v === 'none' ? '' : v }))}>
                <SelectTrigger><SelectValue placeholder="Select class…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No class group</SelectItem>
                  {allGroups.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {editError && <p className="text-sm text-destructive">{editError}</p>}

            <div className="flex gap-2 pt-1">
              <Button className="flex-1" onClick={handleEdit} disabled={editSaving}>
                {editSaving ? 'Saving…' : 'Save Changes'}
              </Button>
              <Button variant="outline" onClick={() => setEditStudent(null)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Rename Class Group Dialog ── */}
      <Dialog open={!!editGroup} onOpenChange={o => { if (!o) setEditGroup(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Pencil className="h-4 w-4 text-primary" />
              </div>
              Rename Class Group
            </DialogTitle>
            <p className="text-sm text-muted-foreground pt-1">
              Update the name for <span className="font-medium text-foreground">{editGroup?.name}</span>.
            </p>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                New Name <span className="text-destructive">*</span>
              </Label>
              <Input
                value={editGroupInput}
                onChange={e => { setEditGroupInput(e.target.value); setEditGroupMsg(''); }}
                onKeyDown={e => e.key === 'Enter' && renameGroup()}
                autoFocus
              />
            </div>

            {editGroupMsg && (
              <div className="rounded-lg bg-destructive/10 px-3 py-2.5">
                <p className="text-xs text-destructive">{editGroupMsg}</p>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button className="flex-1" onClick={renameGroup}
                disabled={editGroupSaving || !editGroupInput.trim() || editGroupInput.trim() === editGroup?.name}>
                {editGroupSaving ? 'Saving…' : 'Save Name'}
              </Button>
              <Button variant="outline" onClick={() => setEditGroup(null)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm Dialog ── */}
      <Dialog open={!!deleteConfirm} onOpenChange={o => { if (!o) setDeleteConfirm(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                <Trash2 className="h-4 w-4 text-destructive" />
              </div>
              Delete Class Group
            </DialogTitle>
          </DialogHeader>

          {(() => {
            const subCount = deleteConfirm ? classGroups.filter(g => g.parentId === deleteConfirm.id).length : 0;
            return (
          <div className="space-y-4 pt-1">
            <div className="rounded-lg border bg-muted/30 px-4 py-3 space-y-1">
              <p className="font-semibold text-sm">{deleteConfirm?.name}</p>
              <p className="text-xs text-muted-foreground">
                {deleteConfirm?.studentCount === 0
                  ? 'No students are currently assigned to this group.'
                  : `${deleteConfirm?.studentCount} student${deleteConfirm?.studentCount !== 1 ? 's are' : ' is'} assigned to this group.`}
              </p>
              {subCount > 0 && (
                <p className="text-xs text-amber-600 font-medium mt-1">
                  This will also delete {subCount} sub-class{subCount !== 1 ? 'es' : ''}.
                </p>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Deleting this group will <span className="font-medium text-foreground">not</span> remove the students — they will simply have no class group assigned.
            </p>

            <div className="flex gap-2 pt-1">
              <Button variant="destructive" className="flex-1" onClick={confirmDelete} disabled={deleteSaving}>
                {deleteSaving ? 'Deleting…' : 'Yes, Delete'}
              </Button>
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            </div>
          </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ── Add Class Group / Sub-class Dialog ── */}
      <Dialog open={addGroupOpen} onOpenChange={o => { setAddGroupOpen(o); if (!o) { setNewGroupInput(''); setCgAddMsg(''); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Layers className="h-4 w-4 text-primary" />
              </div>
              {addGroupParentId ? 'Add Sub-class' : 'Add Class Level'}
            </DialogTitle>
            <p className="text-sm text-muted-foreground pt-1">
              {addGroupParentId
                ? `Add a sub-class under ${classGroups.find(g => g.id === addGroupParentId)?.name ?? '…'}.`
                : 'Create a new class level (e.g. Form 1, Form 2).'}
            </p>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                {addGroupParentId ? 'Sub-class Name' : 'Level Name'} <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder={addGroupParentId ? 'e.g. Form 1A, Form 1B…' : 'e.g. Form 1, Form 2…'}
                value={newGroupInput}
                onChange={e => { setNewGroupInput(e.target.value); setCgAddMsg(''); }}
                onKeyDown={e => e.key === 'Enter' && addGroup()}
                autoFocus
              />
            </div>

            {cgAddMsg && (
              <div className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2.5">
                <p className="text-xs text-destructive">{cgAddMsg}</p>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button className="flex-1" onClick={addGroup} disabled={cgAddSaving || !newGroupInput.trim()}>
                {cgAddSaving ? 'Creating…' : addGroupParentId ? 'Create Sub-class' : 'Create Level'}
              </Button>
              <Button variant="outline" onClick={() => setAddGroupOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

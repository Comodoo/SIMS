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
  ChevronLeft, ChevronRight, Edit2, Eye, EyeOff, GraduationCap,
  Plus, RefreshCw, Search, Trash2, UserCheck, UserX,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

// ---------------------------------------------------------------------------
// GraphQL
// ---------------------------------------------------------------------------
const QUERY = `
  query ITTechStudents {
    students(limit: 1000) {
      id student_number first_name last_name status grade_level section academic_year
      user { id email phone is_active created_at }
    }
    classGroups { id name parentId studentCount }
  }
`;

const REGISTER = `
  mutation RegisterStudent($input: RegisterStudentInput!) {
    registerStudent(input: $input) {
      success message
      student { id student_number first_name last_name status grade_level section academic_year
                user { id email phone is_active created_at } }
    }
  }
`;

const UPDATE = `
  mutation UpdateStudent($studentId: ID!, $input: UpdateStudentInput!) {
    updateStudent(studentId: $studentId, input: $input) {
      success message
      student { id student_number first_name last_name status grade_level section academic_year
                user { id email phone is_active created_at } }
    }
  }
`;

const DEACTIVATE = `mutation DeactivateUser($userId: ID!) { deactivateUser(userId: $userId) { success message } }`;
const ACTIVATE   = `mutation ActivateUser($userId: ID!) { activateUser(userId: $userId) { success message } }`;
const DELETE_MUT = `mutation DeleteUser($userId: ID!) { deleteUser(userId: $userId) { success message } }`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Student {
  id: string; student_number: string; first_name: string; last_name: string;
  status: string; grade_level: string | null; section: string | null; academic_year: string;
  user: { id: string; email: string; phone?: string; is_active: boolean; created_at: string };
}
interface ClassGroup { id: string; name: string; parentId: string | null; studentCount: number; }

const PAGE_SIZE = 10;
const STATUSES = ['active', 'suspended', 'withdrawn', 'graduated'];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
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
        {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
          const p = pages <= 7 ? i + 1 : (page <= 4 ? i + 1 : page - 3 + i);
          return p >= 1 && p <= pages ? (
            <button key={p} onClick={() => onChange(p)}
              className={`w-7 h-7 rounded text-xs font-medium ${p === page ? 'bg-primary text-primary-foreground' : 'border bg-background hover:bg-muted'}`}>
              {p}
            </button>
          ) : null;
        })}
        <button disabled={page >= pages} onClick={() => onChange(page + 1)}
          className="p-1.5 rounded border bg-background disabled:opacity-30 hover:bg-muted">
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function PasswordInput({ value, onChange, placeholder }: { value: string; onChange(v: string): void; placeholder?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input type={show ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder ?? '••••••••'} className="pr-10" />
      <button type="button" onClick={() => setShow(v => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
const emptyForm = {
  firstName: '', lastName: '', email: '', username: '', password: '', confirmPassword: '',
  studentNumber: '', gradeLevel: '',
  academicYear: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
};

export default function ITTechStudentsPage() {
  const { token } = useAuth();
  const [students, setStudents]   = useState<Student[]>([]);
  const [classGroups, setGroups]  = useState<ClassGroup[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [filterGroup, setFGroup]  = useState('all');
  const [filterStatus, setFStat]  = useState('all');
  const [page, setPage]           = useState(1);

  const [registerOpen, setRegisterOpen] = useState(false);
  const [form, setForm]           = useState(emptyForm);
  const [formErr, setFormErr]     = useState('');
  const [saving, setSaving]       = useState(false);

  const [viewStudent, setViewStudent] = useState<Student | null>(null);

  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [editForm, setEditForm]   = useState({ firstName: '', lastName: '', email: '', gradeLevel: '', status: 'active', phone: '' });
  const [editErr, setEditErr]     = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const [actionMsg, setActionMsg] = useState<{ text: string; ok: boolean } | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await query<any>(QUERY, {}, token ?? undefined);
      setStudents(data.students ?? []);
      setGroups(data.classGroups ?? []);
    } catch {} finally { setLoading(false); }
  }

  useEffect(() => { if (token) load(); }, [token]);
  useEffect(() => { setPage(1); }, [search, filterGroup, filterStatus]);

  const allGroups = useMemo(() => classGroups.map(g => g.name), [classGroups]);

  const filtered = useMemo(() => students.filter(s => {
    const q = search.toLowerCase();
    const matchQ = !q || `${s.first_name} ${s.last_name} ${s.student_number} ${s.user.email}`.toLowerCase().includes(q);
    const matchG = filterGroup === 'all' || s.grade_level === filterGroup;
    const matchS = filterStatus === 'all' || s.status === filterStatus;
    return matchQ && matchG && matchS;
  }), [students, search, filterGroup, filterStatus]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stats = useMemo(() => ({
    total:  students.length,
    active: students.filter(s => s.status === 'active').length,
    groups: classGroups.filter(g => !g.parentId).length,
  }), [students, classGroups]);

  // ---------------------------------------------------------------------------
  // Register
  // ---------------------------------------------------------------------------
  const f = (k: keyof typeof emptyForm, v: string) => setForm(p => ({ ...p, [k]: v }));

  async function handleRegister() {
    setFormErr('');
    if (!form.firstName || !form.lastName || !form.email || !form.username || !form.password || !form.studentNumber) {
      setFormErr('Please fill in all required fields.'); return;
    }
    if (form.password !== form.confirmPassword) { setFormErr('Passwords do not match.'); return; }
    if (form.password.length < 6) { setFormErr('Password must be at least 6 characters.'); return; }
    setSaving(true);
    try {
      const r = await mutate<any>(REGISTER, {
        input: {
          username: form.username, email: form.email, password: form.password,
          firstName: form.firstName, lastName: form.lastName, studentNumber: form.studentNumber,
          gradeLevel: form.gradeLevel || null, academicYear: form.academicYear,
        },
      }, token!);
      const res = r.registerStudent;
      if (!res?.success) { setFormErr(res?.message ?? 'Registration failed'); return; }
      setStudents(prev => [res.student, ...prev]);
      setRegisterOpen(false); setForm(emptyForm);
      setActionMsg({ text: 'Student registered successfully', ok: true });
      setTimeout(() => setActionMsg(null), 3000);
    } catch { setFormErr('Network error'); }
    finally { setSaving(false); }
  }

  // ---------------------------------------------------------------------------
  // Edit
  // ---------------------------------------------------------------------------
  function openEdit(s: Student) {
    setEditStudent(s);
    setEditForm({
      firstName: s.first_name, lastName: s.last_name,
      email: s.user.email, gradeLevel: s.grade_level ?? '',
      status: s.status, phone: s.user.phone ?? '',
    });
    setEditErr('');
  }

  async function handleEdit() {
    if (!editStudent || !token) return;
    if (!editForm.firstName || !editForm.lastName || !editForm.email) {
      setEditErr('Name and email are required.'); return;
    }
    setEditSaving(true);
    try {
      const r = await mutate<any>(UPDATE, {
        studentId: editStudent.id,
        input: {
          firstName: editForm.firstName, lastName: editForm.lastName,
          email: editForm.email, gradeLevel: editForm.gradeLevel || null,
          status: editForm.status, phone: editForm.phone || null,
        },
      }, token);
      const res = r.updateStudent;
      if (!res?.success) { setEditErr(res?.message ?? 'Update failed'); return; }
      setStudents(prev => prev.map(s => s.id === editStudent.id ? res.student : s));
      setEditStudent(null);
      setActionMsg({ text: 'Student updated successfully', ok: true });
      setTimeout(() => setActionMsg(null), 3000);
    } catch { setEditErr('Network error'); }
    finally { setEditSaving(false); }
  }

  // ---------------------------------------------------------------------------
  // Toggle active / delete
  // ---------------------------------------------------------------------------
  async function toggleActive(s: Student) {
    const mut = s.user.is_active ? DEACTIVATE : ACTIVATE;
    const key = s.user.is_active ? 'deactivateUser' : 'activateUser';
    try {
      const r = await mutate<any>(mut, { userId: s.user.id }, token ?? undefined);
      if (r[key]?.success) {
        setStudents(prev => prev.map(x => x.id === s.id
          ? { ...x, user: { ...x.user, is_active: !x.user.is_active } } : x));
      }
    } catch {}
  }

  async function deleteStudent(s: Student) {
    if (!confirm(`Delete ${s.first_name} ${s.last_name}? This cannot be undone.`)) return;
    try {
      const r = await mutate<any>(DELETE_MUT, { userId: s.user.id }, token ?? undefined);
      if (r.deleteUser?.success) setStudents(prev => prev.filter(x => x.id !== s.id));
    } catch {}
  }

  const statusColor: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    suspended: 'bg-amber-100 text-amber-800',
    withdrawn: 'bg-gray-100 text-gray-700',
    graduated: 'bg-blue-100 text-blue-800',
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Student Management</h1>
          <p className="text-muted-foreground">Register and manage student accounts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />Refresh
          </Button>
          <Button onClick={() => { setRegisterOpen(true); setForm(emptyForm); setFormErr(''); }}>
            <Plus className="h-4 w-4 mr-2" />Register Student
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Students',   value: stats.total,  color: 'text-blue-600',  bg: 'bg-gradient-to-br from-blue-50 to-indigo-100' },
          { label: 'Active Students',  value: stats.active, color: 'text-green-600', bg: 'bg-gradient-to-br from-green-50 to-emerald-100' },
          { label: 'Class Groups',     value: stats.groups, color: 'text-purple-600', bg: 'bg-gradient-to-br from-purple-50 to-violet-100' },
        ].map(s => (
          <Card key={s.label} className={`${s.bg} border-0`}>
            <CardContent className="pt-4 pb-3 flex items-center gap-3">
              <GraduationCap className={`h-6 w-6 ${s.color}`} />
              <div>
                <p className={`text-2xl font-bold ${s.color}`}>{loading ? '…' : s.value}</p>
                <p className="text-xs text-gray-600 font-medium">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {actionMsg && (
        <div className={`p-3 rounded-lg text-sm ${actionMsg.ok ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {actionMsg.text}
        </div>
      )}

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search name, number, email…" value={search}
                onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={filterGroup} onValueChange={setFGroup}>
              <SelectTrigger className="w-44"><SelectValue placeholder="All classes" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {allGroups.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFStat}>
              <SelectTrigger className="w-36"><SelectValue placeholder="All statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Student #</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
              ) : paged.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No students found</TableCell></TableRow>
              ) : paged.map(s => (
                <TableRow key={s.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-xs font-bold text-green-700">
                        {s.first_name[0]}{s.last_name[0]}
                      </div>
                      <span className="font-medium">{s.first_name} {s.last_name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{s.student_number}</TableCell>
                  <TableCell className="text-sm">{s.user.email}</TableCell>
                  <TableCell className="text-sm">{s.grade_level ?? '—'}</TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusColor[s.status] ?? 'bg-gray-100 text-gray-700'}`}>
                      {s.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 justify-end">
                      <Button size="icon" variant="ghost" className="h-8 w-8" title="View" onClick={() => setViewStudent(s)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" title="Edit" onClick={() => openEdit(s)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8"
                        title={s.user.is_active ? 'Deactivate' : 'Activate'}
                        onClick={() => toggleActive(s)}>
                        {s.user.is_active ? <UserX className="h-4 w-4 text-amber-500" /> : <UserCheck className="h-4 w-4 text-green-600" />}
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive"
                        title="Delete" onClick={() => deleteStudent(s)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Paginator page={page} total={filtered.length} onChange={setPage} />
        </CardContent>
      </Card>

      {/* VIEW DIALOG */}
      <Dialog open={!!viewStudent} onOpenChange={() => setViewStudent(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Student Details</DialogTitle></DialogHeader>
          {viewStudent && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-green-700 font-bold text-lg">
                    {viewStudent.first_name[0]}{viewStudent.last_name[0]}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-lg">{viewStudent.first_name} {viewStudent.last_name}</p>
                  <p className="text-sm text-muted-foreground font-mono">{viewStudent.student_number}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ['Email', viewStudent.user.email],
                  ['Phone', viewStudent.user.phone ?? '—'],
                  ['Class', viewStudent.grade_level ?? '—'],
                  ['Section', viewStudent.section ?? '—'],
                  ['Status', viewStudent.status],
                  ['Academic Year', viewStudent.academic_year],
                  ['Account', viewStudent.user.is_active ? 'Active' : 'Inactive'],
                  ['Joined', new Date(viewStudent.user.created_at).toLocaleDateString([], { dateStyle: 'medium' })],
                ].map(([k, v]) => (
                  <div key={k} className="bg-muted/40 rounded-lg px-3 py-2.5">
                    <p className="text-xs text-muted-foreground font-medium mb-0.5">{k}</p>
                    <p className="font-medium capitalize">{v}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-2">
                <Button className="flex-1" variant="outline" onClick={() => { setViewStudent(null); openEdit(viewStudent); }}>
                  <Edit2 className="h-4 w-4 mr-2" />Edit
                </Button>
                <Button className="flex-1" variant={viewStudent.user.is_active ? 'secondary' : 'default'}
                  onClick={() => { toggleActive(viewStudent); setViewStudent(null); }}>
                  {viewStudent.user.is_active ? <><UserX className="h-4 w-4 mr-2" />Deactivate</> : <><UserCheck className="h-4 w-4 mr-2" />Activate</>}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* EDIT DIALOG */}
      <Dialog open={!!editStudent} onOpenChange={() => setEditStudent(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Edit Student</DialogTitle></DialogHeader>
          {editStudent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">First Name</Label>
                  <Input value={editForm.firstName} onChange={e => setEditForm(p => ({ ...p, firstName: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Last Name</Label>
                  <Input value={editForm.lastName} onChange={e => setEditForm(p => ({ ...p, lastName: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Email</Label>
                <Input type="email" value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Phone</Label>
                <Input value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} placeholder="+255…" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Class / Grade Level</Label>
                <Select value={editForm.gradeLevel || '__none'} onValueChange={v => setEditForm(p => ({ ...p, gradeLevel: v === '__none' ? '' : v }))}>
                  <SelectTrigger><SelectValue placeholder="Not assigned" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">Not assigned</SelectItem>
                    {allGroups.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Status</Label>
                <Select value={editForm.status} onValueChange={v => setEditForm(p => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {editErr && <p className="text-sm text-destructive">{editErr}</p>}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setEditStudent(null)}>Cancel</Button>
                <Button className="flex-1" onClick={handleEdit} disabled={editSaving}>
                  {editSaving ? 'Saving…' : 'Save Changes'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* REGISTER DIALOG */}
      <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Register New Student</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">First Name *</Label>
                <Input value={form.firstName} onChange={e => f('firstName', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Last Name *</Label>
                <Input value={form.lastName} onChange={e => f('lastName', e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Username *</Label>
              <Input value={form.username} onChange={e => f('username', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Email *</Label>
              <Input type="email" value={form.email} onChange={e => f('email', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Student Number *</Label>
              <Input value={form.studentNumber} onChange={e => f('studentNumber', e.target.value)} placeholder="e.g. STD-2025-001" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Class / Grade Level</Label>
              <Select value={form.gradeLevel || '__none'} onValueChange={v => f('gradeLevel', v === '__none' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="Not assigned" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">Not assigned</SelectItem>
                  {allGroups.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Academic Year</Label>
              <Input value={form.academicYear} onChange={e => f('academicYear', e.target.value)} placeholder="2025/2026" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Password *</Label>
              <PasswordInput value={form.password} onChange={v => f('password', v)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Confirm Password *</Label>
              <PasswordInput value={form.confirmPassword} onChange={v => f('confirmPassword', v)} placeholder="Re-enter password" />
            </div>
            {formErr && <p className="text-sm text-destructive">{formErr}</p>}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setRegisterOpen(false)}>Cancel</Button>
              <Button className="flex-1" onClick={handleRegister} disabled={saving}>
                {saving ? 'Registering…' : 'Register Student'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

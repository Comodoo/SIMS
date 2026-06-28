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
  ChevronLeft, ChevronRight,
  Edit2, Eye, EyeOff, Plus, RefreshCw, Search, Trash2,
  UserCheck, UserX, Users,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

// ---------------------------------------------------------------------------
// GraphQL
// ---------------------------------------------------------------------------
const USERS_QUERY = `
  query ITTechUsers {
    users(limit: 1000) {
      id username email first_name last_name role is_active created_at
    }
  }
`;

const REGISTER_STUDENT_MUT = `
  mutation RegisterStudent($input: RegisterStudentInput!) {
    registerStudent(input: $input) {
      success message
      student { id user { id username email first_name last_name role is_active created_at } }
    }
  }
`;

const REGISTER_STAFF_MUT = `
  mutation RegisterStaff($input: RegisterStaffInput!) {
    registerStaff(input: $input) {
      success message
      staff { id user { id username email first_name last_name role is_active created_at } }
    }
  }
`;

const CREATE_USER_MUT = `
  mutation CreateAdmin($input: UserInput!) {
    createUser(input: $input) {
      success message
      user { id username email first_name last_name role is_active created_at }
    }
  }
`;

const UPDATE_USER_MUT = `
  mutation UpdateUser($userId: ID!, $input: UserInput!) {
    updateUser(userId: $userId, input: $input) {
      success message
      user { id username email first_name last_name role is_active created_at }
    }
  }
`;

const ACTIVATE_MUT   = `mutation ActivateUser($userId: ID!) { activateUser(userId: $userId) { success message } }`;
const DEACTIVATE_MUT = `mutation DeactivateUser($userId: ID!) { deactivateUser(userId: $userId) { success message } }`;
const DELETE_MUT     = `mutation DeleteUser($userId: ID!) { deleteUser(userId: $userId) { success message } }`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface UserRow {
  id: string; username: string; email: string;
  first_name: string; last_name: string; role: string;
  is_active: boolean; created_at: string;
}

const PAGE_SIZE = 10;

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin', it_technician: 'IT Technician', staff: 'Teacher', student: 'Student',
};
const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-800',
  it_technician: 'bg-blue-100 text-blue-800',
  staff: 'bg-cyan-100 text-cyan-800',
  student: 'bg-green-100 text-green-800',
};

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
  firstName: '', lastName: '', email: '', username: '', password: '',
  role: 'student' as string,
  studentNumber: '', gradeLevel: '',
};

export default function ITTechUsersPage() {
  const { token } = useAuth();
  const [users, setUsers]         = useState<UserRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage]           = useState(1);

  // Register dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm]           = useState(emptyForm);
  const [formErr, setFormErr]     = useState('');
  const [saving, setSaving]       = useState(false);

  // View dialog
  const [viewUser, setViewUser]   = useState<UserRow | null>(null);

  // Edit dialog
  const [editUser, setEditUser]   = useState<UserRow | null>(null);
  const [editForm, setEditForm]   = useState({ firstName: '', lastName: '', email: '', username: '', password: '' });
  const [editErr, setEditErr]     = useState('');
  const [editSaving, setEditSaving] = useState(false);

  // Action feedback
  const [actionMsg, setActionMsg] = useState<{ text: string; ok: boolean } | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await query<any>(USERS_QUERY, {}, token ?? undefined);
      setUsers(data.users ?? []);
    } catch {}
    finally { setLoading(false); }
  }

  useEffect(() => { if (token) load(); }, [token]);

  // ---------------------------------------------------------------------------
  // Filtered + paged
  // ---------------------------------------------------------------------------
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter(u => {
      const matchQ = !q || `${u.first_name} ${u.last_name} ${u.username} ${u.email}`.toLowerCase().includes(q);
      const matchR = roleFilter === 'all' || u.role === roleFilter;
      return matchQ && matchR;
    });
  }, [users, search, roleFilter]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ---------------------------------------------------------------------------
  // Register
  // ---------------------------------------------------------------------------
  const f = (k: keyof typeof emptyForm, v: string) => setForm(p => ({ ...p, [k]: v }));

  async function handleCreate() {
    setFormErr('');
    if (!form.firstName || !form.lastName || !form.email || !form.username || !form.password) {
      setFormErr('Please fill in all required fields.'); return;
    }
    setSaving(true);
    try {
      let newUser: UserRow | null = null;
      if (form.role === 'student') {
        if (!form.studentNumber) { setFormErr('Student number is required.'); return; }
        const r = await mutate<any>(REGISTER_STUDENT_MUT, {
          input: { username: form.username, email: form.email, password: form.password,
            firstName: form.firstName, lastName: form.lastName, studentNumber: form.studentNumber,
            gradeLevel: form.gradeLevel || null,
            academicYear: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}` },
        }, token ?? undefined);
        if (!r.registerStudent?.success) { setFormErr(r.registerStudent?.message ?? 'Failed'); return; }
        newUser = r.registerStudent.student.user;
      } else if (form.role === 'staff') {
        const r = await mutate<any>(REGISTER_STAFF_MUT, {
          input: { username: form.username, email: form.email, password: form.password,
            firstName: form.firstName, lastName: form.lastName,
            staffNumber: `TCH-${Date.now()}`, position: 'Teacher' },
        }, token ?? undefined);
        if (!r.registerStaff?.success) { setFormErr(r.registerStaff?.message ?? 'Failed'); return; }
        newUser = r.registerStaff.staff.user;
      } else {
        const r = await mutate<any>(CREATE_USER_MUT, {
          input: { username: form.username, email: form.email, password: form.password,
            firstName: form.firstName, lastName: form.lastName, role: form.role },
        }, token ?? undefined);
        if (!r.createUser?.success) { setFormErr(r.createUser?.message ?? 'Failed'); return; }
        newUser = r.createUser.user;
      }
      if (newUser) setUsers(prev => [newUser!, ...prev]);
      setCreateOpen(false); setForm(emptyForm);
    } catch { setFormErr('Network error'); }
    finally { setSaving(false); }
  }

  // ---------------------------------------------------------------------------
  // Edit
  // ---------------------------------------------------------------------------
  function openEdit(u: UserRow) {
    setEditUser(u);
    setEditForm({ firstName: u.first_name, lastName: u.last_name, email: u.email, username: u.username, password: '' });
    setEditErr('');
  }

  async function handleEdit() {
    if (!editUser || !token) return;
    if (!editForm.firstName || !editForm.lastName || !editForm.email) {
      setEditErr('Name and email are required.'); return;
    }
    setEditSaving(true);
    try {
      const r = await mutate<any>(UPDATE_USER_MUT, {
        userId: editUser.id,
        input: {
          firstName: editForm.firstName, lastName: editForm.lastName,
          email: editForm.email, username: editForm.username || editUser.username,
          role: editUser.role,
          ...(editForm.password ? { password: editForm.password } : {}),
        },
      }, token);
      if (!r.updateUser?.success) { setEditErr(r.updateUser?.message ?? 'Update failed'); return; }
      setUsers(prev => prev.map(u => u.id === editUser.id ? r.updateUser.user : u));
      setEditUser(null);
      setActionMsg({ text: 'User updated successfully', ok: true });
      setTimeout(() => setActionMsg(null), 3000);
    } catch { setEditErr('Network error'); }
    finally { setEditSaving(false); }
  }

  // ---------------------------------------------------------------------------
  // Activate / Deactivate / Delete
  // ---------------------------------------------------------------------------
  async function toggleActive(u: UserRow) {
    const mut = u.is_active ? DEACTIVATE_MUT : ACTIVATE_MUT;
    const key = u.is_active ? 'deactivateUser' : 'activateUser';
    try {
      const r = await mutate<any>(mut, { userId: u.id }, token ?? undefined);
      if (r[key]?.success) setUsers(prev => prev.map(x => x.id === u.id ? { ...x, is_active: !x.is_active } : x));
    } catch {}
  }

  async function deleteUser(u: UserRow) {
    if (!confirm(`Delete ${u.first_name} ${u.last_name}? This cannot be undone.`)) return;
    try {
      const r = await mutate<any>(DELETE_MUT, { userId: u.id }, token ?? undefined);
      if (r.deleteUser?.success) setUsers(prev => prev.filter(x => x.id !== u.id));
    } catch {}
  }

  const stats = useMemo(() => ({
    total:  users.length,
    active: users.filter(u => u.is_active).length,
    teachers: users.filter(u => u.role === 'staff').length,
    students: users.filter(u => u.role === 'student').length,
  }), [users]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">Register and manage all user accounts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />Refresh
          </Button>
          <Button onClick={() => { setCreateOpen(true); setForm(emptyForm); setFormErr(''); }}>
            <Plus className="h-4 w-4 mr-2" />Register User
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Users',   value: stats.total,    color: 'text-blue-600',   bg: 'bg-gradient-to-br from-blue-50 to-indigo-100' },
          { label: 'Active',        value: stats.active,   color: 'text-green-600',  bg: 'bg-gradient-to-br from-green-50 to-emerald-100' },
          { label: 'Teachers',      value: stats.teachers, color: 'text-cyan-600',   bg: 'bg-gradient-to-br from-cyan-50 to-sky-100' },
          { label: 'Students',      value: stats.students, color: 'text-amber-600',  bg: 'bg-gradient-to-br from-amber-50 to-yellow-100' },
        ].map(s => (
          <Card key={s.label} className={`${s.bg} border-0`}>
            <CardContent className="pt-4 pb-3">
              <p className={`text-2xl font-bold ${s.color}`}>{loading ? '…' : s.value}</p>
              <p className="text-xs text-gray-600 font-medium">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Action feedback */}
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
              <Input placeholder="Search name, username, email…" value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
            </div>
            <Select value={roleFilter} onValueChange={v => { setRoleFilter(v); setPage(1); }}>
              <SelectTrigger className="w-44"><SelectValue placeholder="All roles" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="it_technician">IT Technician</SelectItem>
                <SelectItem value="staff">Teacher</SelectItem>
                <SelectItem value="student">Student</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
              ) : paged.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No users found</TableCell></TableRow>
              ) : paged.map(u => (
                <TableRow key={u.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">{u.first_name} {u.last_name}</TableCell>
                  <TableCell className="text-muted-foreground font-mono text-sm">{u.username}</TableCell>
                  <TableCell className="text-sm">{u.email}</TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[u.role] ?? 'bg-gray-100 text-gray-700'}`}>
                      {ROLE_LABELS[u.role] ?? u.role}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.is_active ? 'default' : 'secondary'} className="text-xs">
                      {u.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 justify-end">
                      <Button size="icon" variant="ghost" className="h-8 w-8" title="View" onClick={() => setViewUser(u)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" title="Edit" onClick={() => openEdit(u)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8"
                        title={u.is_active ? 'Deactivate' : 'Activate'}
                        onClick={() => toggleActive(u)}>
                        {u.is_active ? <UserX className="h-4 w-4 text-amber-500" /> : <UserCheck className="h-4 w-4 text-green-600" />}
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive"
                        title="Delete" onClick={() => deleteUser(u)}>
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
      <Dialog open={!!viewUser} onOpenChange={() => setViewUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>User Details</DialogTitle></DialogHeader>
          {viewUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-700 font-bold text-lg">
                    {viewUser.first_name[0]}{viewUser.last_name[0]}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-lg">{viewUser.first_name} {viewUser.last_name}</p>
                  <p className="text-sm text-muted-foreground">@{viewUser.username}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ['Email', viewUser.email],
                  ['Role', ROLE_LABELS[viewUser.role] ?? viewUser.role],
                  ['Status', viewUser.is_active ? 'Active' : 'Inactive'],
                  ['Joined', new Date(viewUser.created_at).toLocaleDateString([], { dateStyle: 'medium' })],
                ].map(([k, v]) => (
                  <div key={k} className="bg-muted/40 rounded-lg px-3 py-2.5">
                    <p className="text-xs text-muted-foreground font-medium mb-0.5">{k}</p>
                    <p className="font-medium">{v}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-2">
                <Button className="flex-1" variant="outline" onClick={() => { setViewUser(null); openEdit(viewUser); }}>
                  <Edit2 className="h-4 w-4 mr-2" />Edit
                </Button>
                <Button className="flex-1" variant={viewUser.is_active ? 'secondary' : 'default'}
                  onClick={() => { toggleActive(viewUser); setViewUser(null); }}>
                  {viewUser.is_active ? <><UserX className="h-4 w-4 mr-2" />Deactivate</> : <><UserCheck className="h-4 w-4 mr-2" />Activate</>}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* EDIT DIALOG */}
      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Edit User</DialogTitle></DialogHeader>
          {editUser && (
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
                <Label className="text-xs">Username</Label>
                <Input value={editForm.username} onChange={e => setEditForm(p => ({ ...p, username: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">New Password <span className="text-muted-foreground">(leave blank to keep)</span></Label>
                <PasswordInput value={editForm.password} onChange={v => setEditForm(p => ({ ...p, password: v }))} placeholder="New password…" />
              </div>
              {editErr && <p className="text-sm text-destructive">{editErr}</p>}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setEditUser(null)}>Cancel</Button>
                <Button className="flex-1" onClick={handleEdit} disabled={editSaving}>
                  {editSaving ? 'Saving…' : 'Save Changes'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* REGISTER DIALOG */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Register New User</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Role</Label>
              <Select value={form.role} onValueChange={v => f('role', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="staff">Teacher</SelectItem>
                  <SelectItem value="it_technician">IT Technician</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
              <Label className="text-xs">Password *</Label>
              <PasswordInput value={form.password} onChange={v => f('password', v)} />
            </div>
            {form.role === 'student' && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs">Student Number *</Label>
                  <Input value={form.studentNumber} onChange={e => f('studentNumber', e.target.value)} placeholder="e.g. STD-2025-001" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Class / Grade Level</Label>
                  <Input value={form.gradeLevel} onChange={e => f('gradeLevel', e.target.value)} placeholder="e.g. Form 1" />
                </div>
              </>
            )}
            {formErr && <p className="text-sm text-destructive">{formErr}</p>}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button className="flex-1" onClick={handleCreate} disabled={saving}>
                {saving ? 'Registering…' : 'Register'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

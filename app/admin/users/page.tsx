'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/lib/auth-context';
import { mutate, query } from '@/lib/graphql';
import { GraduationCap, Plus, Shield, Trash2, UserCheck, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

// ---------------------------------------------------------------------------
// GraphQL
// ---------------------------------------------------------------------------
const USERS_QUERY = `
  query AdminUsers {
    users(limit: 500) {
      id
      username
      email
      first_name
      last_name
      role
      is_active
      created_at
    }
    departments {
      id
      name
      code
    }
  }
`;

const REGISTER_STUDENT_MUTATION = `
  mutation RegisterStudent($input: RegisterStudentInput!) {
    registerStudent(input: $input) {
      success
      message
      student {
        id
        student_number
        first_name
        last_name
        user { id username email role is_active created_at }
      }
    }
  }
`;

const REGISTER_STAFF_MUTATION = `
  mutation RegisterStaff($input: RegisterStaffInput!) {
    registerStaff(input: $input) {
      success
      message
      staff {
        id
        staff_number
        position
        user { id username email role is_active created_at }
      }
    }
  }
`;

const CREATE_ADMIN_MUTATION = `
  mutation CreateAdmin($input: UserInput!) {
    createUser(input: $input) {
      success
      message
      user { id username email first_name last_name role is_active created_at }
    }
  }
`;


const ACTIVATE_USER_MUTATION = `
  mutation ActivateUser($userId: ID!) {
    activateUser(userId: $userId) { success message }
  }
`;

const DEACTIVATE_USER_MUTATION = `
  mutation DeactivateUser($userId: ID!) {
    deactivateUser(userId: $userId) { success message }
  }
`;

const DELETE_USER_MUTATION = `
  mutation DeleteUser($userId: ID!) {
    deleteUser(userId: $userId) { success message }
  }
`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface UserRow {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'staff' | 'student';
  is_active: boolean;
  created_at: string;
}
interface Department { id: string; name: string; code: string; }

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-800',
  staff: 'bg-blue-100 text-blue-800',
  student: 'bg-green-100 text-green-800',
};

const emptyForm = {
  firstName: '', lastName: '', email: '', username: '', password: '',
  role: 'student' as 'admin' | 'staff' | 'student',
  studentNumber: '', gradeLevel: '',
  staffNumber: '', position: '', departmentId: '',
};

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
export default function AdminUsersPage() {
  const { token } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  async function load() {
    setLoading(true);
    try {
      const data = await query<{ users: UserRow[]; departments: Department[] }>(
        USERS_QUERY, {}, token ?? undefined
      );
      setUsers(data.users ?? []);
      setDepartments(data.departments ?? []);
    } catch {/* offline */} finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [token]);

  async function handleCreate() {
    setError('');
    if (!form.username || !form.email || !form.password || !form.firstName || !form.lastName) {
      setError('Please fill in all required fields.');
      return;
    }
    if (form.role === 'student' && !form.studentNumber) {
      setError('Student number is required for students.');
      return;
    }
    if (form.role === 'staff' && (!form.staffNumber || !form.position || !form.departmentId)) {
      setError('Staff number, position, and department are required for staff.');
      return;
    }
    setSaving(true);
    try {
      let result: any;
      if (form.role === 'student') {
        result = await mutate(REGISTER_STUDENT_MUTATION, {
          input: {
            username: form.username,
            email: form.email,
            password: form.password,
            firstName: form.firstName,
            lastName: form.lastName,
            studentNumber: form.studentNumber,
            gradeLevel: form.gradeLevel || null,
            academicYear: new Date().getFullYear() + '/' + (new Date().getFullYear() + 1),
            departmentId: form.departmentId || null,
          }
        }, token ?? undefined);
        if (!result.registerStudent.success) {
          setError(result.registerStudent.message);
          return;
        }
      } else if (form.role === 'staff') {
        result = await mutate(REGISTER_STAFF_MUTATION, {
          input: {
            username: form.username,
            email: form.email,
            password: form.password,
            firstName: form.firstName,
            lastName: form.lastName,
            staffNumber: form.staffNumber,
            position: form.position,
            departmentId: form.departmentId,
          }
        }, token ?? undefined);
        if (!result.registerStaff.success) {
          setError(result.registerStaff.message);
          return;
        }
      } else {
        result = await mutate(CREATE_ADMIN_MUTATION, {
          input: {
            username: form.username,
            email: form.email,
            password: form.password,
            firstName: form.firstName,
            lastName: form.lastName,
            role: form.role,
          },
        }, token ?? undefined);
        if (!result.createUser.success) {
          setError(result.createUser.message);
          return;
        }
      }
      setCreateOpen(false);
      setForm(emptyForm);
      await load();
    } catch (e: any) {
      setError(e?.message ?? 'An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(u: UserRow) {
    try {
      const mutation = u.is_active ? DEACTIVATE_USER_MUTATION : ACTIVATE_USER_MUTATION;
      await mutate(mutation, { userId: u.id }, token ?? undefined);
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, is_active: !u.is_active } : x));
    } catch {/* ignore */}
  }

  async function handleDelete(u: UserRow) {
    if (!confirm(`Delete user "${u.username}"? This cannot be undone.`)) return;
    try {
      await mutate(DELETE_USER_MUTATION, { userId: u.id }, token ?? undefined);
      setUsers(prev => prev.filter(x => x.id !== u.id));
    } catch {/* ignore */}
  }

  const filtered = users.filter(u => {
    const name = `${u.first_name} ${u.last_name} ${u.username} ${u.email}`.toLowerCase();
    return (roleFilter === 'all' || u.role === roleFilter) && name.includes(search.toLowerCase());
  });

  useEffect(() => { setPage(1); }, [search, roleFilter]);

  const pagedUsers = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const counts = {
    total: users.length,
    students: users.filter(u => u.role === 'student').length,
    staff: users.filter(u => u.role === 'staff').length,
    admins: users.filter(u => u.role === 'admin').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">Register and manage students, teachers, and admins</p>
        </div>
        <Dialog open={createOpen} onOpenChange={o => { setCreateOpen(o); if (!o) { setForm(emptyForm); setError(''); } }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Register User</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Register New User</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              {/* Role first — controls which extra fields appear */}
              <div className="space-y-1">
                <Label>Role</Label>
                <Select value={form.role} onValueChange={v => setForm(p => ({ ...emptyForm, role: v as typeof form.role }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="staff">Staff / Teacher</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>First Name *</Label>
                  <Input placeholder="Jane" value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Last Name *</Label>
                  <Input placeholder="Doe" value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} />
                </div>
              </div>

              <div className="space-y-1">
                <Label>Email *</Label>
                <Input type="email" placeholder="jane@school.edu" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Username *</Label>
                  <Input placeholder="jane.doe" value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Password *</Label>
                  <Input type="password" placeholder="••••••••" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
                </div>
              </div>

              {/* Student-specific fields */}
              {form.role === 'student' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Student Number *</Label>
                    <Input placeholder="STD-001" value={form.studentNumber} onChange={e => setForm(p => ({ ...p, studentNumber: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label>Class / Grade Level</Label>
                    <Input placeholder="Form 3A" value={form.gradeLevel} onChange={e => setForm(p => ({ ...p, gradeLevel: e.target.value }))} />
                  </div>
                </div>
              )}

              {/* Staff-specific fields */}
              {form.role === 'staff' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label>Staff Number *</Label>
                      <Input placeholder="STF-001" value={form.staffNumber} onChange={e => setForm(p => ({ ...p, staffNumber: e.target.value }))} />
                    </div>
                    <div className="space-y-1">
                      <Label>Position *</Label>
                      <Input placeholder="Teacher" value={form.position} onChange={e => setForm(p => ({ ...p, position: e.target.value }))} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>Department *</Label>
                    <Select value={form.departmentId} onValueChange={v => setForm(p => ({ ...p, departmentId: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                      <SelectContent>
                        {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button className="w-full" onClick={handleCreate} disabled={saving}>
                {saving ? 'Registering...' : `Register ${form.role === 'student' ? 'Student' : form.role === 'staff' ? 'Staff' : 'Admin'}`}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            <div><p className="text-2xl font-bold">{counts.total}</p><p className="text-xs text-muted-foreground">Total users</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <GraduationCap className="h-8 w-8 text-green-500" />
            <div><p className="text-2xl font-bold">{counts.students}</p><p className="text-xs text-muted-foreground">Students</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <UserCheck className="h-8 w-8 text-blue-500" />
            <div><p className="text-2xl font-bold">{counts.staff}</p><p className="text-xs text-muted-foreground">Staff / Teachers</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <Shield className="h-8 w-8 text-purple-500" />
            <div><p className="text-2xl font-bold">{counts.admins}</p><p className="text-xs text-muted-foreground">Admins</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Input placeholder="Search name, email or username..." className="max-w-xs"
          value={search} onChange={e => setSearch(e.target.value)} />
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="All roles" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="student">Students</SelectItem>
            <SelectItem value="staff">Staff</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-10 bg-muted rounded animate-pulse" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-1">No users found</h3>
              <p className="text-muted-foreground text-sm">Register users using the button above.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedUsers.map(u => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.first_name} {u.last_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.username}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      <Badge className={`capitalize ${ROLE_COLORS[u.role] ?? ''}`}>{u.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.is_active ? 'default' : 'secondary'}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleToggleActive(u)}
                          className={u.is_active ? 'text-orange-600 hover:text-orange-700' : 'text-green-600 hover:text-green-700'}>
                          {u.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(u)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {!loading && filtered.length > 0 && (
            <Paginator page={page} total={filtered.length} onChange={setPage} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

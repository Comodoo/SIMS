'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/lib/auth-context';
import { mutate, query } from '@/lib/graphql';
import {
  ChevronLeft, ChevronRight, Edit2, Eye, EyeOff,
  Plus, RefreshCw, Search, Settings, Trash2, UserCheck, UserX,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const QUERY = `
  query AdminITTechs {
    users(limit: 1000) {
      id username email first_name last_name role is_active created_at
    }
  }
`;

const CREATE_MUT = `
  mutation CreateITTech($input: UserInput!) {
    createUser(input: $input) {
      success message
      user { id username email first_name last_name role is_active created_at }
    }
  }
`;

const UPDATE_MUT = `
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

interface UserRow {
  id: string; username: string; email: string;
  first_name: string; last_name: string; role: string;
  is_active: boolean; created_at: string;
}

const PAGE_SIZE = 10;

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

const emptyForm = { firstName: '', lastName: '', email: '', username: '', password: '' };

export default function AdminITTechniciansPage() {
  const { token } = useAuth();
  const [users, setUsers]       = useState<UserRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [page, setPage]         = useState(1);

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm]         = useState(emptyForm);
  const [formErr, setFormErr]   = useState('');
  const [saving, setSaving]     = useState(false);

  const [viewUser, setViewUser] = useState<UserRow | null>(null);
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', email: '', username: '', password: '' });
  const [editErr, setEditErr]   = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await query<any>(QUERY, {}, token ?? undefined);
      const allUsers: UserRow[] = data.users ?? [];
      setUsers(allUsers.filter(u => u.role === 'it_technician'));
    } catch {} finally { setLoading(false); }
  }

  useEffect(() => { if (token) load(); }, [token]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter(u =>
      !q || `${u.first_name} ${u.last_name} ${u.username} ${u.email}`.toLowerCase().includes(q)
    );
  }, [users, search]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const f = (k: keyof typeof emptyForm, v: string) => setForm(p => ({ ...p, [k]: v }));

  async function handleCreate() {
    setFormErr('');
    if (!form.firstName || !form.lastName || !form.email || !form.username || !form.password) {
      setFormErr('All fields are required.'); return;
    }
    if (form.password.length < 6) { setFormErr('Password must be at least 6 characters.'); return; }
    setSaving(true);
    try {
      const r = await mutate<any>(CREATE_MUT, {
        input: { firstName: form.firstName, lastName: form.lastName, email: form.email,
          username: form.username, password: form.password, role: 'it_technician' },
      }, token ?? undefined);
      if (!r.createUser?.success) { setFormErr(r.createUser?.message ?? 'Failed'); return; }
      setUsers(prev => [r.createUser.user, ...prev]);
      setCreateOpen(false); setForm(emptyForm);
      setMsg({ text: 'IT Technician registered', ok: true });
      setTimeout(() => setMsg(null), 3000);
    } catch { setFormErr('Network error'); }
    finally { setSaving(false); }
  }

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
      const r = await mutate<any>(UPDATE_MUT, {
        userId: editUser.id,
        input: { firstName: editForm.firstName, lastName: editForm.lastName, email: editForm.email,
          username: editForm.username || editUser.username, role: 'it_technician',
          ...(editForm.password ? { password: editForm.password } : {}) },
      }, token);
      if (!r.updateUser?.success) { setEditErr(r.updateUser?.message ?? 'Update failed'); return; }
      setUsers(prev => prev.map(u => u.id === editUser.id ? r.updateUser.user : u));
      setEditUser(null);
      setMsg({ text: 'IT Technician updated', ok: true });
      setTimeout(() => setMsg(null), 3000);
    } catch { setEditErr('Network error'); }
    finally { setEditSaving(false); }
  }

  async function toggleActive(u: UserRow) {
    const mut = u.is_active ? DEACTIVATE_MUT : ACTIVATE_MUT;
    const key = u.is_active ? 'deactivateUser' : 'activateUser';
    try {
      const r = await mutate<any>(mut, { userId: u.id }, token ?? undefined);
      if (r[key]?.success) setUsers(prev => prev.map(x => x.id === u.id ? { ...x, is_active: !x.is_active } : x));
    } catch {}
  }

  async function deleteUser(u: UserRow) {
    if (!confirm(`Delete ${u.first_name} ${u.last_name}?`)) return;
    try {
      const r = await mutate<any>(DELETE_MUT, { userId: u.id }, token ?? undefined);
      if (r.deleteUser?.success) setUsers(prev => prev.filter(x => x.id !== u.id));
    } catch {}
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">IT Technicians</h1>
          <p className="text-muted-foreground">Manage IT Technician accounts — they handle full system administration</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />Refresh
          </Button>
          <Button onClick={() => { setCreateOpen(true); setForm(emptyForm); setFormErr(''); }}>
            <Plus className="h-4 w-4 mr-2" />Add IT Technician
          </Button>
        </div>
      </div>

      {/* Count card */}
      <Card className="bg-gradient-to-br from-purple-50 to-violet-100 border-0 w-fit">
        <CardContent className="pt-4 pb-3 flex items-center gap-4 px-6">
          <div className="p-2.5 rounded-xl bg-white/60">
            <Settings className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-purple-700">{loading ? '…' : users.length}</p>
            <p className="text-xs text-gray-600 font-medium">IT Technicians registered</p>
          </div>
        </CardContent>
      </Card>

      {msg && (
        <div className={`p-3 rounded-lg text-sm ${msg.ok ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {msg.text}
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search IT Technicians…" value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-9 max-w-xs" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
              ) : paged.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No IT Technicians found</TableCell></TableRow>
              ) : paged.map(u => (
                <TableRow key={u.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-700">
                        {u.first_name[0]}{u.last_name[0]}
                      </div>
                      <span className="font-medium">{u.first_name} {u.last_name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{u.username}</TableCell>
                  <TableCell className="text-sm">{u.email}</TableCell>
                  <TableCell>
                    <Badge variant={u.is_active ? 'default' : 'secondary'} className="text-xs">
                      {u.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(u.created_at).toLocaleDateString([], { dateStyle: 'medium' })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 justify-end">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setViewUser(u)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(u)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => toggleActive(u)}>
                        {u.is_active ? <UserX className="h-4 w-4 text-amber-500" /> : <UserCheck className="h-4 w-4 text-green-600" />}
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => deleteUser(u)}>
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
          <DialogHeader><DialogTitle>IT Technician Details</DialogTitle></DialogHeader>
          {viewUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-purple-100 flex items-center justify-center">
                  <span className="text-purple-700 font-bold text-lg">{viewUser.first_name[0]}{viewUser.last_name[0]}</span>
                </div>
                <div>
                  <p className="font-semibold text-lg">{viewUser.first_name} {viewUser.last_name}</p>
                  <p className="text-sm text-muted-foreground">@{viewUser.username}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ['Email', viewUser.email],
                  ['Status', viewUser.is_active ? 'Active' : 'Inactive'],
                  ['Role', 'IT Technician'],
                  ['Joined', new Date(viewUser.created_at).toLocaleDateString([], { dateStyle: 'medium' })],
                ].map(([k, v]) => (
                  <div key={k} className="bg-muted/40 rounded-lg px-3 py-2.5">
                    <p className="text-xs text-muted-foreground font-medium mb-0.5">{k}</p>
                    <p className="font-medium">{v}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => { setViewUser(null); openEdit(viewUser); }}>
                  <Edit2 className="h-4 w-4 mr-2" />Edit
                </Button>
                <Button variant={viewUser.is_active ? 'secondary' : 'default'} className="flex-1"
                  onClick={() => { toggleActive(viewUser); setViewUser(null); }}>
                  {viewUser.is_active ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* EDIT DIALOG */}
      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Edit IT Technician</DialogTitle></DialogHeader>
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
                <Label className="text-xs">New Password <span className="text-muted-foreground">(optional)</span></Label>
                <PasswordInput value={editForm.password} onChange={v => setEditForm(p => ({ ...p, password: v }))} placeholder="New password…" />
              </div>
              {editErr && <p className="text-sm text-destructive">{editErr}</p>}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setEditUser(null)}>Cancel</Button>
                <Button className="flex-1" onClick={handleEdit} disabled={editSaving}>
                  {editSaving ? 'Saving…' : 'Save Changes'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* CREATE DIALOG */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Add IT Technician</DialogTitle></DialogHeader>
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
              <Label className="text-xs">Password *</Label>
              <PasswordInput value={form.password} onChange={v => f('password', v)} />
            </div>
            {formErr && <p className="text-sm text-destructive">{formErr}</p>}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button className="flex-1" onClick={handleCreate} disabled={saving}>
                {saving ? 'Adding…' : 'Add IT Technician'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

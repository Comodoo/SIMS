'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/lib/auth-context';
import { mutate as mutation, query } from '@/lib/graphql';
import {
  Activity, ChevronLeft, ChevronRight,
  Database, Laptop, Loader2, Lock, Monitor,
  Search, Shield, Smartphone, Unlock, UserX,
} from 'lucide-react';
import { useEffect, useState } from 'react';

// ---------------------------------------------------------------------------
// GraphQL
// ---------------------------------------------------------------------------
const SECURITY_QUERY = `
  query SecurityCenter {
    securityOverview { activeSessions totalActiveUsers auditLogTotal }
    activeSessions(limit: 100) {
      id userId userName userEmail userRole deviceInfo ipAddress issuedAt expiresAt revoked
    }
    auditLogs(limit: 200) {
      id actorId actorName actorRole action targetTable ipAddress performedAt
    }
  }
`;

const REVOKE_ONE = `
  mutation RevokeSession($tokenId: ID!) {
    revokeRefreshToken(tokenId: $tokenId) { success message }
  }
`;

const REVOKE_ALL = `
  mutation RevokeAll($userId: ID) {
    revokeAllSessions(userId: $userId) { success message }
  }
`;

const BLOCK_USER = `
  mutation BlockUser($userId: ID!) {
    deactivateUser(userId: $userId) { success message }
  }
`;

const UNBLOCK_USER = `
  mutation UnblockUser($userId: ID!) {
    activateUser(userId: $userId) { success message }
  }
`;

const ALL_USERS_QUERY = `
  query SecurityUsers {
    users(limit: 5000) { id username email role first_name last_name is_active }
  }
`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Session {
  id: string; userId: string; userName: string; userEmail: string; userRole: string;
  deviceInfo: string | null; ipAddress: string | null; issuedAt: string; expiresAt: string; revoked: boolean;
}
interface AuditLog {
  id: string; actorId: string; actorName: string; actorRole: string;
  action: string; targetTable: string; ipAddress: string | null; performedAt: string;
}
interface Overview { activeSessions: number; totalActiveUsers: number; auditLogTotal: number; }
interface SysUser {
  id: string; username: string; email: string; role: string;
  first_name: string; last_name: string; is_active: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function fmtDT(ts: string) {
  return new Date(ts).toLocaleString([], { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function relativeTime(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
function deviceIcon(info: string | null) {
  if (!info) return <Monitor className="h-4 w-4" />;
  const s = info.toLowerCase();
  if (s.includes('mobile') || s.includes('android') || s.includes('iphone')) return <Smartphone className="h-4 w-4" />;
  return <Laptop className="h-4 w-4" />;
}
function actionColor(action: string) {
  const a = action.toLowerCase();
  if (a.includes('delete') || a.includes('ban') || a.includes('revoke')) return 'text-red-600 bg-red-50';
  if (a.includes('create') || a.includes('register')) return 'text-green-600 bg-green-50';
  if (a.includes('update') || a.includes('change')) return 'text-amber-600 bg-amber-50';
  return 'text-blue-600 bg-blue-50';
}

const PAGE = 10;

function Paginator({ page, total, onChange }: { page: number; total: number; onChange(p: number): void }) {
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const from  = total === 0 ? 0 : (page - 1) * PAGE + 1;
  const to    = Math.min(page * PAGE, total);
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
// Page
// ---------------------------------------------------------------------------
export default function AdminSecurityPage() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'users' | 'audit'>('overview');

  // Data
  const [overview, setOverview]   = useState<Overview>({ activeSessions: 0, totalActiveUsers: 0, auditLogTotal: 0 });
  const [sessions, setSessions]   = useState<Session[]>([]);
  const [logs, setLogs]           = useState<AuditLog[]>([]);
  const [sysUsers, setSysUsers]   = useState<SysUser[]>([]);
  const [loading, setLoading]     = useState(true);

  // Filters
  const [sessionSearch, setSessionSearch] = useState('');
  const [logSearch,     setLogSearch]     = useState('');
  const [logAction,     setLogAction]     = useState('all');
  const [userSearch,    setUserSearch]    = useState('');
  const [userRole,      setUserRole]      = useState('all');
  const [userStatus,    setUserStatus]    = useState('all');

  // Pagination
  const [sesPage,      setSesPage]      = useState(1);
  const [logPage,      setLogPage]      = useState(1);
  const [userPage,     setUserPage]     = useState(1);
  const [activityPage, setActivityPage] = useState(1);

  // Actions
  const [revoking,  setRevoking]  = useState<string | null>(null);
  const [blocking,  setBlocking]  = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      query<any>(SECURITY_QUERY, {}, token),
      query<any>(ALL_USERS_QUERY, {}, token),
    ]).then(([r, ur]) => {
      setOverview(r.securityOverview ?? { activeSessions: 0, totalActiveUsers: 0, auditLogTotal: 0 });
      setSessions(r.activeSessions ?? []);
      setLogs(r.auditLogs ?? []);
      setSysUsers(ur.users ?? []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [token]);

  // Filtered sessions
  const filteredSessions = sessions.filter(s => {
    const q = sessionSearch.toLowerCase();
    return !q || s.userName.toLowerCase().includes(q) || s.userEmail.toLowerCase().includes(q) || (s.ipAddress ?? '').includes(q);
  });
  const pagedSessions = filteredSessions.slice((sesPage - 1) * PAGE, sesPage * PAGE);

  // Filtered logs
  const filteredLogs = logs.filter(l => {
    const q = logSearch.toLowerCase();
    const matchQ = !q || l.actorName.toLowerCase().includes(q) || l.action.toLowerCase().includes(q) || l.targetTable.toLowerCase().includes(q);
    const matchA = logAction === 'all' || l.action.toLowerCase().includes(logAction.toLowerCase());
    return matchQ && matchA;
  });
  const pagedLogs = filteredLogs.slice((logPage - 1) * PAGE, logPage * PAGE);

  async function revokeSession(id: string) {
    if (!token || revoking) return;
    setRevoking(id);
    await mutation<any>(REVOKE_ONE, { tokenId: id }, token).catch(() => null);
    setSessions(prev => prev.filter(s => s.id !== id));
    setOverview(prev => ({ ...prev, activeSessions: Math.max(0, prev.activeSessions - 1) }));
    setRevoking(null);
  }

  async function revokeAll() {
    if (!token || !confirm('Revoke ALL active sessions? All users will be logged out.')) return;
    setRevoking('all');
    await mutation<any>(REVOKE_ALL, {}, token).catch(() => null);
    setSessions([]);
    setOverview(prev => ({ ...prev, activeSessions: 0 }));
    setRevoking(null);
  }

  async function toggleBlock(u: SysUser) {
    if (!token || blocking) return;
    setBlocking(u.id);
    const mut = u.is_active ? BLOCK_USER : UNBLOCK_USER;
    const key  = u.is_active ? 'deactivateUser' : 'activateUser';
    const res  = await mutation<any>(mut, { userId: u.id }, token).catch(() => null);
    if (res?.[key]?.success) {
      setSysUsers(prev => prev.map(x => x.id === u.id ? { ...x, is_active: !u.is_active } : x));
      setActionMsg({ ok: true, text: `${u.username} has been ${u.is_active ? 'blocked' : 'unblocked'}.` });
    } else {
      setActionMsg({ ok: false, text: res?.[key]?.message ?? 'Action failed.' });
    }
    setBlocking(null);
    setTimeout(() => setActionMsg(null), 3000);
  }

  // Filtered users
  const filteredUsers = sysUsers.filter(u => {
    const q = userSearch.toLowerCase();
    const matchQ = !q || u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) ||
      `${u.first_name} ${u.last_name}`.toLowerCase().includes(q);
    const matchR = userRole === 'all' || u.role === userRole;
    const matchS = userStatus === 'all' || (userStatus === 'active' ? u.is_active : !u.is_active);
    return matchQ && matchR && matchS;
  });
  const pagedUsers = filteredUsers.slice((userPage - 1) * PAGE, userPage * PAGE);

  const ROLE_LABELS: Record<string, string> = {
    admin: 'Admin', it_technician: 'IT Tech', staff: 'Teacher', student: 'Student',
  };
  const ROLE_COLORS: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-700',
    it_technician: 'bg-blue-100 text-blue-700',
    staff: 'bg-cyan-100 text-cyan-700',
    student: 'bg-green-100 text-green-700',
  };

  const TABS = [
    { key: 'overview', label: 'Overview',        icon: Shield },
    { key: 'sessions', label: 'Active Sessions', icon: Monitor },
    { key: 'users',    label: 'User Access',     icon: Lock },
    { key: 'audit',    label: 'Audit Log',       icon: Activity },
  ] as const;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />Security Center
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Monitor and manage platform security</p>
        </div>
        {!loading && (
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
              overview.activeSessions > 0 ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'
            }`}>
              <span className={`w-2 h-2 rounded-full ${overview.activeSessions > 0 ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground'}`} />
              {overview.activeSessions} active session{overview.activeSessions !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'Active Sessions',  value: overview.activeSessions,  icon: Monitor,   iconColor: 'text-blue-600',   cardBg: 'bg-gradient-to-br from-blue-50 to-indigo-100',   iconBg: 'bg-white/70', textColor: 'text-blue-800',   subColor: 'text-blue-600' },
          { label: 'Active Users',     value: overview.totalActiveUsers, icon: Shield,    iconColor: 'text-green-600',  cardBg: 'bg-gradient-to-br from-green-50 to-emerald-100', iconBg: 'bg-white/70', textColor: 'text-green-800',  subColor: 'text-green-600' },
          { label: 'Audit Log Entries',value: overview.auditLogTotal,    icon: Database,  iconColor: 'text-purple-600', cardBg: 'bg-gradient-to-br from-purple-50 to-violet-100', iconBg: 'bg-white/70', textColor: 'text-purple-800', subColor: 'text-purple-600' },
        ].map(({ label, value, icon: Icon, iconColor, cardBg, iconBg, textColor, subColor }) => (
          <Card key={label} className={`${cardBg} border-0 shadow-sm`}>
            <CardContent className="pt-5 pb-4 flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${iconBg} shadow-sm`}>
                <Icon className={`h-5 w-5 ${iconColor}`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${textColor}`}>{loading ? '…' : value}</p>
                <p className={`text-xs font-medium ${subColor}`}>{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border rounded-xl p-1 bg-muted/30 w-fit">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === key
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}>
            <Icon className="h-4 w-4" />{label}
          </button>
        ))}
      </div>

      {/* Action feedback */}
      {actionMsg && (
        <div className={`px-4 py-2.5 rounded-lg text-sm font-medium ${actionMsg.ok ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {actionMsg.text}
        </div>
      )}

      {/* ── Overview ── */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Quick-action cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Monitor,  bg: 'bg-blue-50',   color: 'text-blue-600',   title: 'Manage Sessions', sub: `${overview.activeSessions} active`,      tab: 'sessions' as const },
              { icon: Lock,     bg: 'bg-red-50',    color: 'text-red-600',    title: 'User Access',     sub: `Block / unblock accounts`,               tab: 'users'    as const },
              { icon: Activity, bg: 'bg-purple-50', color: 'text-purple-600', title: 'Audit Log',       sub: `${overview.auditLogTotal} entries`,       tab: 'audit'    as const },
            ].map(({ icon: Icon, bg, color, title, sub, tab }) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className="flex items-center gap-4 p-5 rounded-xl border bg-card hover:bg-muted/30 text-left transition-colors group">
                <div className={`p-3 rounded-xl ${bg} group-hover:scale-105 transition-transform`}>
                  <Icon className={`h-6 w-6 ${color}`} />
                </div>
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="text-sm text-muted-foreground">{sub}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Recent audit entries */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="h-4 w-4" />Recent Activity
                  </CardTitle>
                  <CardDescription>
                    {logs.length === 0
                      ? 'No audit log entries yet'
                      : `${Math.min((activityPage - 1) * 8 + 1, logs.length)}–${Math.min(activityPage * 8, logs.length)} of ${logs.length} entries`}
                  </CardDescription>
                </div>
                {logs.length > 8 && (
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-7 w-7"
                      disabled={activityPage === 1}
                      onClick={() => setActivityPage(p => p - 1)}>
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </Button>
                    <span className="text-xs text-muted-foreground px-1">
                      {activityPage}/{Math.ceil(logs.length / 8)}
                    </span>
                    <Button variant="outline" size="icon" className="h-7 w-7"
                      disabled={activityPage >= Math.ceil(logs.length / 8)}
                      onClick={() => setActivityPage(p => p + 1)}>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-4 space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 bg-muted rounded animate-pulse" />)}</div>
              ) : logs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No audit log entries yet.</p>
              ) : (
                <div className="divide-y">
                  {logs.slice((activityPage - 1) * 8, activityPage * 8).map(log => (
                    <div key={log.id} className="flex items-center gap-4 px-4 py-3">
                      <div className={`p-1.5 rounded-lg text-xs font-bold ${actionColor(log.action)}`}>
                        <Activity className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          <span className="text-primary">{log.actorName}</span>
                          {' '}·{' '}
                          <span className="capitalize">{log.action.replace(/_/g, ' ')}</span>
                          {' on '}
                          <span className="font-mono text-xs bg-muted px-1 rounded">{log.targetTable}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">{log.ipAddress ?? 'No IP'} · {relativeTime(log.performedAt)}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                        log.actorRole === 'admin' ? 'bg-purple-100 text-purple-700'
                        : log.actorRole === 'staff' ? 'bg-blue-100 text-blue-700'
                        : 'bg-green-100 text-green-700'
                      }`}>{log.actorRole}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Active Sessions ── */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1">
                  <CardTitle className="text-base">Active Sessions ({filteredSessions.length})</CardTitle>
                  <CardDescription>Currently logged-in users</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <input value={sessionSearch} onChange={e => { setSessionSearch(e.target.value); setSesPage(1); }}
                      placeholder="Search sessions…"
                      className="pl-8 pr-3 py-1.5 border rounded-lg text-sm bg-background w-52 focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <Button variant="destructive" size="sm" onClick={revokeAll} disabled={revoking === 'all' || sessions.length === 0}>
                    {revoking === 'all' ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <UserX className="h-3.5 w-3.5 mr-1" />}
                    Revoke All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-4 space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 bg-muted rounded animate-pulse" />)}</div>
              ) : sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Monitor className="h-10 w-10 mb-3 opacity-30" />
                  <p className="text-sm">No active sessions</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">User</th>
                          <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Device / IP</th>
                          <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Role</th>
                          <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Started</th>
                          <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Expires</th>
                          <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {pagedSessions.map(s => (
                          <tr key={s.id} className="hover:bg-muted/20 transition-colors">
                            <td className="px-4 py-3">
                              <p className="font-medium">{s.userName}</p>
                              <p className="text-xs text-muted-foreground">{s.userEmail}</p>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5">
                                {deviceIcon(s.deviceInfo)}
                                <div>
                                  <p className="text-xs">{s.deviceInfo || 'Unknown device'}</p>
                                  <p className="text-xs text-muted-foreground font-mono">{s.ipAddress || '—'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                                s.userRole === 'admin' ? 'bg-purple-100 text-purple-700'
                                : s.userRole === 'staff' ? 'bg-blue-100 text-blue-700'
                                : 'bg-green-100 text-green-700'
                              }`}>{s.userRole}</span>
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">{relativeTime(s.issuedAt)}</td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">{fmtDT(s.expiresAt)}</td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button size="sm" variant="ghost"
                                  className="text-destructive hover:text-destructive hover:bg-red-50 h-7 gap-1 text-xs"
                                  onClick={() => revokeSession(s.id)}
                                  disabled={revoking === s.id || blocking === s.userId}
                                  title="Revoke session">
                                  {revoking === s.id
                                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    : <><UserX className="h-3.5 w-3.5" />Revoke</>}
                                </Button>
                                <Button size="sm" variant="ghost"
                                  className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 h-7 gap-1 text-xs"
                                  onClick={() => {
                                    const u = sysUsers.find(x => x.id === s.userId);
                                    if (u) toggleBlock(u);
                                  }}
                                  disabled={blocking === s.userId || revoking === s.id}
                                  title="Block user account">
                                  {blocking === s.userId
                                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    : <><Lock className="h-3.5 w-3.5" />Block</>}
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Paginator page={sesPage} total={filteredSessions.length} onChange={setSesPage} />
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── User Access ── */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1">
                  <CardTitle className="text-base">User Access Control ({filteredUsers.length})</CardTitle>
                  <CardDescription>Block or unblock user accounts</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <input value={userSearch} onChange={e => { setUserSearch(e.target.value); setUserPage(1); }}
                      placeholder="Search users…"
                      className="pl-8 pr-3 py-1.5 border rounded-lg text-sm bg-background w-44 focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <Select value={userRole} onValueChange={v => { setUserRole(v); setUserPage(1); }}>
                    <SelectTrigger className="w-32 h-9 text-sm"><SelectValue placeholder="All roles" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All roles</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="it_technician">IT Tech</SelectItem>
                      <SelectItem value="staff">Teacher</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={userStatus} onValueChange={v => { setUserStatus(v); setUserPage(1); }}>
                    <SelectTrigger className="w-28 h-9 text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="blocked">Blocked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-4 space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-12 bg-muted rounded animate-pulse" />)}</div>
              ) : filteredUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Lock className="h-10 w-10 mb-3 opacity-30" />
                  <p className="text-sm">No users found</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">User</th>
                          <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Role</th>
                          <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Status</th>
                          <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {pagedUsers.map(u => (
                          <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                            <td className="px-4 py-3">
                              <p className="font-medium">{u.first_name} {u.last_name}</p>
                              <p className="text-xs text-muted-foreground">{u.email}</p>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[u.role] ?? 'bg-gray-100 text-gray-700'}`}>
                                {ROLE_LABELS[u.role] ?? u.role}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-medium ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                                {u.is_active ? 'Active' : 'Blocked'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Button
                                size="sm"
                                variant={u.is_active ? 'ghost' : 'outline'}
                                className={u.is_active ? 'text-red-600 hover:text-red-700 hover:bg-red-50 h-8 gap-1.5' : 'text-green-700 hover:text-green-800 hover:bg-green-50 h-8 gap-1.5'}
                                onClick={() => toggleBlock(u)}
                                disabled={blocking === u.id}
                              >
                                {blocking === u.id
                                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  : u.is_active
                                    ? <><Lock className="h-3.5 w-3.5" />Block</>
                                    : <><Unlock className="h-3.5 w-3.5" />Unblock</>
                                }
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Paginator page={userPage} total={filteredUsers.length} onChange={setUserPage} />
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Audit Log ── */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1">
                  <CardTitle className="text-base">Audit Log ({filteredLogs.length})</CardTitle>
                  <CardDescription>Immutable record of all sensitive actions</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <input value={logSearch} onChange={e => { setLogSearch(e.target.value); setLogPage(1); }}
                      placeholder="Search logs…"
                      className="pl-8 pr-3 py-1.5 border rounded-lg text-sm bg-background w-48 focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <Select value={logAction} onValueChange={v => { setLogAction(v); setLogPage(1); }}>
                    <SelectTrigger className="w-36 h-9 text-sm">
                      <SelectValue placeholder="All actions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All actions</SelectItem>
                      <SelectItem value="login">Login</SelectItem>
                      <SelectItem value="create">Create</SelectItem>
                      <SelectItem value="update">Update</SelectItem>
                      <SelectItem value="delete">Delete</SelectItem>
                      <SelectItem value="revoke">Revoke</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-4 space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-12 bg-muted rounded animate-pulse" />)}</div>
              ) : filteredLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Activity className="h-10 w-10 mb-3 opacity-30" />
                  <p className="text-sm">No audit log entries found</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Actor</th>
                          <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Action</th>
                          <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Target</th>
                          <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">IP</th>
                          <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">When</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {pagedLogs.map(log => (
                          <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                            <td className="px-4 py-3">
                              <p className="font-medium">{log.actorName}</p>
                              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium capitalize ${
                                log.actorRole === 'admin' ? 'bg-purple-100 text-purple-700'
                                : log.actorRole === 'staff' ? 'bg-blue-100 text-blue-700'
                                : 'bg-green-100 text-green-700'
                              }`}>{log.actorRole}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium capitalize ${actionColor(log.action)}`}>
                                {log.action.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{log.targetTable}</td>
                            <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{log.ipAddress || '—'}</td>
                            <td className="px-4 py-3">
                              <p className="text-xs">{relativeTime(log.performedAt)}</p>
                              <p className="text-xs text-muted-foreground">{fmtDT(log.performedAt)}</p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Paginator page={logPage} total={filteredLogs.length} onChange={setLogPage} />
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

    </div>
  );
}

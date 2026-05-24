'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Shield, Lock, Key, Eye, AlertTriangle, CheckCircle, XCircle,
  Globe, Monitor, Smartphone, Clock, Ban, RefreshCw, Download,
  Search, MoreVertical, UserX, Activity, Database, Server,
  Fingerprint, Mail, ShieldAlert, ShieldCheck, Laptop, MapPin
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Types
interface SecurityEvent {
  id: string;
  type: 'login' | 'login_failed' | 'password_change' | 'role_change' | 'ban' | 'suspicious' | 'api_access';
  user?: {
    name: string;
    email: string;
  };
  ip: string;
  location?: string;
  device?: string;
  timestamp: string;
  details: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface ActiveSession {
  id: string;
  user: {
    name: string;
    email: string;
    role: string;
  };
  ip: string;
  location: string;
  device: string;
  browser: string;
  lastActive: string;
  startedAt: string;
}

interface BlockedIP {
  id: string;
  ip: string;
  reason: string;
  blockedAt: string;
  expiresAt?: string;
  permanent: boolean;
}

// Mock data
const securityEvents: SecurityEvent[] = [
  { id: '1', type: 'login_failed', user: { name: 'Unknown', email: 'unknown@example.com' }, ip: '192.168.1.100', location: 'Lagos, Nigeria', device: 'Chrome on Windows', timestamp: '2024-03-20T14:30:00', details: '5 failed login attempts in 5 minutes', severity: 'high' },
  { id: '2', type: 'login', user: { name: 'John Mwangi', email: 'john@example.com' }, ip: '41.80.45.23', location: 'Nairobi, Kenya', device: 'Safari on macOS', timestamp: '2024-03-20T14:25:00', details: 'Successful login', severity: 'low' },
  { id: '3', type: 'password_change', user: { name: 'Sarah Ochieng', email: 'sarah@example.com' }, ip: '102.89.12.45', location: 'Nairobi, Kenya', device: 'Chrome on Android', timestamp: '2024-03-20T13:45:00', details: 'Password changed successfully', severity: 'medium' },
  { id: '4', type: 'suspicious', user: { name: 'David Kimani', email: 'david@example.com' }, ip: '185.220.101.1', location: 'Unknown (TOR)', device: 'Firefox on Linux', timestamp: '2024-03-20T12:30:00', details: 'Login attempt from TOR network', severity: 'critical' },
  { id: '5', type: 'role_change', user: { name: 'Grace Mensah', email: 'grace@example.com' }, ip: '41.80.45.23', location: 'Accra, Ghana', device: 'Chrome on Windows', timestamp: '2024-03-20T11:00:00', details: 'Role changed from student to instructor', severity: 'medium' },
  { id: '6', type: 'api_access', user: { name: 'API Service', email: 'api@system' }, ip: '10.0.0.1', location: 'Internal', device: 'API Client', timestamp: '2024-03-20T10:00:00', details: 'Bulk user export via API', severity: 'medium' },
  { id: '7', type: 'ban', user: { name: 'Spammer Account', email: 'spam@example.com' }, ip: '185.143.223.1', location: 'Unknown', device: 'Unknown', timestamp: '2024-03-20T09:30:00', details: 'Account banned for spam activity', severity: 'high' },
];

const activeSessions: ActiveSession[] = [
  { id: '1', user: { name: 'Admin User', email: 'admin@example.com', role: 'super_admin' }, ip: '41.80.45.23', location: 'Nairobi, Kenya', device: 'Desktop', browser: 'Chrome 122', lastActive: '2024-03-20T14:35:00', startedAt: '2024-03-20T08:00:00' },
  { id: '2', user: { name: 'John Mwangi', email: 'john@example.com', role: 'student' }, ip: '102.89.12.45', location: 'Nairobi, Kenya', device: 'Mobile', browser: 'Safari 17', lastActive: '2024-03-20T14:30:00', startedAt: '2024-03-20T12:15:00' },
  { id: '3', user: { name: 'Sarah Ochieng', email: 'sarah@example.com', role: 'instructor' }, ip: '41.90.67.89', location: 'Mombasa, Kenya', device: 'Desktop', browser: 'Firefox 123', lastActive: '2024-03-20T14:25:00', startedAt: '2024-03-20T09:30:00' },
  { id: '4', user: { name: 'Michael Adeyemi', email: 'michael@example.com', role: 'student' }, ip: '105.112.45.78', location: 'Lagos, Nigeria', device: 'Tablet', browser: 'Chrome 122', lastActive: '2024-03-20T14:20:00', startedAt: '2024-03-20T13:00:00' },
];

const blockedIPs: BlockedIP[] = [
  { id: '1', ip: '185.220.101.1', reason: 'TOR exit node - suspicious activity', blockedAt: '2024-03-20T12:30:00', permanent: true },
  { id: '2', ip: '192.168.1.100', reason: 'Multiple failed login attempts', blockedAt: '2024-03-20T14:30:00', expiresAt: '2024-03-21T14:30:00', permanent: false },
  { id: '3', ip: '185.143.223.1', reason: 'Spam activity', blockedAt: '2024-03-19T10:00:00', permanent: true },
  { id: '4', ip: '45.134.26.89', reason: 'API abuse', blockedAt: '2024-03-18T15:45:00', expiresAt: '2024-03-25T15:45:00', permanent: false },
];

export default function AdminSecurityPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [eventFilter, setEventFilter] = useState('all');
  const [isBlockIPOpen, setIsBlockIPOpen] = useState(false);
  const [isRevokeSessionOpen, setIsRevokeSessionOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<ActiveSession | null>(null);
  
  // Security settings
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorRequired: false,
    passwordMinLength: 8,
    passwordRequireSpecial: true,
    passwordRequireNumbers: true,
    sessionTimeout: 24,
    maxLoginAttempts: 5,
    lockoutDuration: 30,
    ipWhitelisting: false,
    apiRateLimit: 100,
    enableAuditLog: true,
  });

  // Block IP form
  const [blockIPForm, setBlockIPForm] = useState({
    ip: '',
    reason: '',
    permanent: false,
    duration: '24',
  });

  const getSeverityColor = (severity: SecurityEvent['severity']) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEventIcon = (type: SecurityEvent['type']) => {
    switch (type) {
      case 'login': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'login_failed': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'password_change': return <Key className="h-4 w-4 text-blue-600" />;
      case 'role_change': return <Shield className="h-4 w-4 text-purple-600" />;
      case 'ban': return <Ban className="h-4 w-4 text-red-600" />;
      case 'suspicious': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'api_access': return <Activity className="h-4 w-4 text-blue-600" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  const getDeviceIcon = (device: string) => {
    if (device.includes('Mobile')) return <Smartphone className="h-4 w-4" />;
    if (device.includes('Tablet')) return <Smartphone className="h-4 w-4" />;
    return <Laptop className="h-4 w-4" />;
  };

  const filteredEvents = securityEvents.filter(event => {
    const matchesSearch = event.user?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          event.user?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          event.ip.includes(searchQuery);
    const matchesFilter = eventFilter === 'all' || event.type === eventFilter || event.severity === eventFilter;
    return matchesSearch && matchesFilter;
  });

  const handleBlockIP = () => {
    console.log('Blocking IP:', blockIPForm);
    setIsBlockIPOpen(false);
    setBlockIPForm({ ip: '', reason: '', permanent: false, duration: '24' });
  };

  const handleUnblockIP = (ip: string) => {
    console.log('Unblocking IP:', ip);
  };

  const handleRevokeSession = () => {
    console.log('Revoking session:', selectedSession?.id);
    setIsRevokeSessionOpen(false);
    setSelectedSession(null);
  };

  const handleRevokeAllSessions = () => {
    console.log('Revoking all sessions');
  };

  // Security stats
  const stats = {
    activeUsers: activeSessions.length,
    failedLogins: securityEvents.filter(e => e.type === 'login_failed').length,
    blockedIPs: blockedIPs.length,
    criticalEvents: securityEvents.filter(e => e.severity === 'critical').length,
    securityScore: 85,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Security Center</h1>
          <p className="text-muted-foreground">Monitor and manage platform security</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Audit Log
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsBlockIPOpen(true)}>
            <Ban className="h-4 w-4 mr-2" />
            Block IP
          </Button>
        </div>
      </div>

      {/* Security Score Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="relative">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-muted"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${stats.securityScore * 2.51} 251`}
                    className="text-green-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold">{stats.securityScore}</span>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Security Score</h3>
                <p className="text-sm text-muted-foreground">Your platform security is good</p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    <ShieldCheck className="h-3 w-3 mr-1" />
                    Protected
                  </Badge>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{stats.activeUsers}</p>
                <p className="text-xs text-muted-foreground">Active Sessions</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-orange-600">{stats.failedLogins}</p>
                <p className="text-xs text-muted-foreground">Failed Logins</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-red-600">{stats.blockedIPs}</p>
                <p className="text-xs text-muted-foreground">Blocked IPs</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{stats.criticalEvents}</p>
                <p className="text-xs text-muted-foreground">Critical Events</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="events">Security Events</TabsTrigger>
          <TabsTrigger value="sessions">Active Sessions</TabsTrigger>
          <TabsTrigger value="blocked">Blocked IPs</TabsTrigger>
          <TabsTrigger value="settings">Security Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Recent Critical Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Recent Security Alerts
              </CardTitle>
              <CardDescription>Events requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {securityEvents
                  .filter(e => e.severity === 'critical' || e.severity === 'high')
                  .slice(0, 5)
                  .map(event => (
                    <div key={event.id} className={`flex items-start gap-4 p-4 rounded-lg border ${getSeverityColor(event.severity)}`}>
                      <div className="shrink-0 mt-0.5">
                        {getEventIcon(event.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{event.details}</p>
                          <Badge variant="outline" className={getSeverityColor(event.severity)}>
                            {event.severity}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span>{event.user?.email || 'Unknown'}</span>
                          <span>{event.ip}</span>
                          <span>{event.location}</span>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setActiveTab('sessions')}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Monitor className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Manage Sessions</p>
                    <p className="text-sm text-muted-foreground">{stats.activeUsers} active</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setActiveTab('blocked')}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Ban className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium">Blocked IPs</p>
                    <p className="text-sm text-muted-foreground">{stats.blockedIPs} blocked</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setActiveTab('events')}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Activity className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium">Audit Log</p>
                    <p className="text-sm text-muted-foreground">{securityEvents.length} events</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setActiveTab('settings')}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Shield className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Security Settings</p>
                    <p className="text-sm text-muted-foreground">Configure policies</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Security Events Tab */}
        <TabsContent value="events" className="space-y-6 mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={eventFilter} onValueChange={setEventFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Events</SelectItem>
                    <SelectItem value="login">Logins</SelectItem>
                    <SelectItem value="login_failed">Failed Logins</SelectItem>
                    <SelectItem value="password_change">Password Changes</SelectItem>
                    <SelectItem value="suspicious">Suspicious</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High Severity</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEvents.map(event => (
                      <TableRow key={event.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getEventIcon(event.type)}
                            <div>
                              <p className="font-medium capitalize">{event.type.replace('_', ' ')}</p>
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">{event.details}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">{event.user?.name || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground">{event.user?.email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{event.ip}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{event.location || 'Unknown'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getSeverityColor(event.severity)}>
                            {event.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">{new Date(event.timestamp).toLocaleDateString()}</p>
                            <p className="text-xs text-muted-foreground">{new Date(event.timestamp).toLocaleTimeString()}</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Active Sessions Tab */}
        <TabsContent value="sessions" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Active Sessions</CardTitle>
                  <CardDescription>Currently logged in users</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={handleRevokeAllSessions}>
                  <UserX className="h-4 w-4 mr-2" />
                  Revoke All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Device</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Last Active</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeSessions.map(session => (
                      <TableRow key={session.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.name}`} />
                              <AvatarFallback>{session.user.name.slice(0, 2)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{session.user.name}</p>
                              <p className="text-xs text-muted-foreground">{session.user.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getDeviceIcon(session.device)}
                            <div>
                              <p className="text-sm">{session.device}</p>
                              <p className="text-xs text-muted-foreground">{session.browser}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            {session.location}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{session.ip}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span className="h-2 w-2 rounded-full bg-green-500" />
                            <span className="text-sm">
                              {new Date(session.lastActive).toLocaleTimeString()}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => { setSelectedSession(session); setIsRevokeSessionOpen(true); }}
                          >
                            <UserX className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Blocked IPs Tab */}
        <TabsContent value="blocked" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Blocked IP Addresses</CardTitle>
                  <CardDescription>IP addresses blocked from accessing the platform</CardDescription>
                </div>
                <Button size="sm" onClick={() => setIsBlockIPOpen(true)}>
                  <Ban className="h-4 w-4 mr-2" />
                  Block IP
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Blocked At</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {blockedIPs.map(blocked => (
                      <TableRow key={blocked.id}>
                        <TableCell className="font-mono">{blocked.ip}</TableCell>
                        <TableCell>{blocked.reason}</TableCell>
                        <TableCell>{new Date(blocked.blockedAt).toLocaleString()}</TableCell>
                        <TableCell>
                          {blocked.permanent ? (
                            <Badge variant="destructive">Permanent</Badge>
                          ) : (
                            <span>{new Date(blocked.expiresAt!).toLocaleString()}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleUnblockIP(blocked.ip)}
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Unblock
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings Tab */}
        <TabsContent value="settings" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Authentication Settings</CardTitle>
              <CardDescription>Configure authentication policies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Require Two-Factor Authentication</p>
                  <p className="text-sm text-muted-foreground">Require 2FA for all admin users</p>
                </div>
                <Switch
                  checked={securitySettings.twoFactorRequired}
                  onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, twoFactorRequired: checked })}
                />
              </div>
              <Separator />
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Min Password Length</Label>
                  <Input
                    type="number"
                    value={securitySettings.passwordMinLength}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, passwordMinLength: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Login Attempts</Label>
                  <Input
                    type="number"
                    value={securitySettings.maxLoginAttempts}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, maxLoginAttempts: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Lockout Duration (min)</Label>
                  <Input
                    type="number"
                    value={securitySettings.lockoutDuration}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, lockoutDuration: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Require Special Characters</p>
                  <p className="text-sm text-muted-foreground">Passwords must contain special characters</p>
                </div>
                <Switch
                  checked={securitySettings.passwordRequireSpecial}
                  onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, passwordRequireSpecial: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Require Numbers</p>
                  <p className="text-sm text-muted-foreground">Passwords must contain numbers</p>
                </div>
                <Switch
                  checked={securitySettings.passwordRequireNumbers}
                  onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, passwordRequireNumbers: checked })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Session & API Settings</CardTitle>
              <CardDescription>Configure session and API security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Session Timeout (hours)</Label>
                  <Input
                    type="number"
                    value={securitySettings.sessionTimeout}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, sessionTimeout: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>API Rate Limit (req/min)</Label>
                  <Input
                    type="number"
                    value={securitySettings.apiRateLimit}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, apiRateLimit: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">IP Whitelisting</p>
                  <p className="text-sm text-muted-foreground">Only allow access from whitelisted IPs</p>
                </div>
                <Switch
                  checked={securitySettings.ipWhitelisting}
                  onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, ipWhitelisting: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Enable Audit Log</p>
                  <p className="text-sm text-muted-foreground">Log all security-related events</p>
                </div>
                <Switch
                  checked={securitySettings.enableAuditLog}
                  onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, enableAuditLog: checked })}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button>
              <CheckCircle className="h-4 w-4 mr-2" />
              Save Security Settings
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Block IP Dialog */}
      <Dialog open={isBlockIPOpen} onOpenChange={setIsBlockIPOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Block IP Address</DialogTitle>
            <DialogDescription>
              Block an IP address from accessing the platform
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>IP Address</Label>
              <Input
                value={blockIPForm.ip}
                onChange={(e) => setBlockIPForm({ ...blockIPForm, ip: e.target.value })}
                placeholder="192.168.1.100"
              />
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Input
                value={blockIPForm.reason}
                onChange={(e) => setBlockIPForm({ ...blockIPForm, reason: e.target.value })}
                placeholder="Suspicious activity"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Permanent Block</p>
                <p className="text-sm text-muted-foreground">Block this IP permanently</p>
              </div>
              <Switch
                checked={blockIPForm.permanent}
                onCheckedChange={(checked) => setBlockIPForm({ ...blockIPForm, permanent: checked })}
              />
            </div>
            {!blockIPForm.permanent && (
              <div className="space-y-2">
                <Label>Duration (hours)</Label>
                <Select
                  value={blockIPForm.duration}
                  onValueChange={(v) => setBlockIPForm({ ...blockIPForm, duration: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 hour</SelectItem>
                    <SelectItem value="6">6 hours</SelectItem>
                    <SelectItem value="24">24 hours</SelectItem>
                    <SelectItem value="72">3 days</SelectItem>
                    <SelectItem value="168">7 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBlockIPOpen(false)}>Cancel</Button>
            <Button onClick={handleBlockIP} disabled={!blockIPForm.ip || !blockIPForm.reason}>
              Block IP
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Session Dialog */}
      <AlertDialog open={isRevokeSessionOpen} onOpenChange={setIsRevokeSessionOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Session</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke the session for {selectedSession?.user.name}? 
              They will be logged out immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevokeSession}>
              Revoke Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

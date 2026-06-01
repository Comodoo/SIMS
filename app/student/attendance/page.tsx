'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/lib/auth-context';
import { query } from '@/lib/graphql';
import {
  AlertTriangle, BookOpen, Calendar, CheckCircle,
  ChevronLeft, ChevronRight, Clock, Search, XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

// ---------------------------------------------------------------------------
// GraphQL
// ---------------------------------------------------------------------------
const STUDENT_PROFILE_QUERY = `
  query StudentProfile($userId: ID!) {
    studentByUser(userId: $userId) { id }
  }
`;

const ATTENDANCE_RATES_QUERY = `
  query AttendanceRates($studentId: ID!, $semesterId: ID) {
    studentAttendanceRates(studentId: $studentId, semesterId: $semesterId) {
      courseId courseName totalSessions present late absent excused attendanceRate belowThreshold
    }
    semesters { id name academic_year status }
  }
`;

const ATTENDANCE_HISTORY_QUERY = `
  query AttendanceHistory($studentId: ID!) {
    studentAttendanceRecords(studentId: $studentId, limit: 200) {
      id date status courseId courseName
    }
  }
`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface AttendanceRate {
  courseId: string; courseName: string;
  totalSessions: number; present: number; late: number; absent: number; excused: number;
  attendanceRate: number; belowThreshold: boolean;
}
interface AttendanceRecord { id: string; date: string; status: string; courseId: string; courseName: string; }
interface Semester { id: string; name: string; academic_year: string; status: string; }

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const RATE_PAGE_SIZE = 5;
const HIST_PAGE_SIZE = 5;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

const STATUS_STYLE: Record<string, string> = {
  present: 'bg-green-100 text-green-800',
  late:    'bg-amber-100 text-amber-800',
  absent:  'bg-red-100 text-red-800',
  excused: 'bg-blue-100 text-blue-800',
};

function Paginator({ page, total, pageSize, onChange }: {
  page: number; total: number; pageSize: number; onChange: (p: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to   = Math.min(page * pageSize, total);
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20">
      <span className="text-xs text-muted-foreground">
        {total === 0 ? 'No records' : `${from}–${to} of ${total}`}
      </span>
      <div className="flex items-center gap-1">
        <button
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          className="p-1.5 rounded-md border bg-background disabled:opacity-40 hover:bg-muted transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`w-7 h-7 rounded-md text-xs font-medium transition-colors ${
              p === page ? 'bg-primary text-primary-foreground' : 'border bg-background hover:bg-muted'
            }`}
          >
            {p}
          </button>
        ))}
        <button
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          className="p-1.5 rounded-md border bg-background disabled:opacity-40 hover:bg-muted transition-colors"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline progress bar
// ---------------------------------------------------------------------------
function RateBar({ pct, below }: { pct: number; below: boolean }) {
  const color = below ? 'bg-red-500' : pct >= 90 ? 'bg-green-500' : 'bg-amber-500';
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="flex-1 h-1.5 bg-muted rounded-full min-w-[60px]">
        <div className={`h-1.5 rounded-full ${color} transition-all`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className={`text-sm font-bold tabular-nums w-10 text-right ${below ? 'text-red-600' : ''}`}>
        {pct.toFixed(0)}%
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function StudentAttendancePage() {
  const { token, user } = useAuth();
  const [studentId, setStudentId]         = useState<string | null>(null);
  const [semesters, setSemesters]         = useState<Semester[]>([]);
  const [selectedSemester, setSelectedSemester] = useState('');
  const [rates, setRates]                 = useState<AttendanceRate[]>([]);
  const [history, setHistory]             = useState<AttendanceRecord[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [loading, setLoading]             = useState(true);
  const [search, setSearch]               = useState('');
  const [ratePage, setRatePage]           = useState(1);
  const [histPage, setHistPage]           = useState(1);

  // Resolve student profile
  useEffect(() => {
    if (!user || !token) return;
    query<any>(STUDENT_PROFILE_QUERY, { userId: user.id }, token)
      .then(r => { if (r.studentByUser) setStudentId(r.studentByUser.id); })
      .catch(() => {});
  }, [user, token]);

  // Load attendance rates
  useEffect(() => {
    if (!studentId || !token) return;
    setLoading(true);
    query<any>(ATTENDANCE_RATES_QUERY, { studentId, semesterId: selectedSemester || undefined }, token)
      .then(r => {
        setRates(r.studentAttendanceRates ?? []);
        if (r.semesters) {
          setSemesters(r.semesters);
          if (!selectedSemester) {
            const active = (r.semesters as Semester[]).find(s => s.status === 'active');
            if (active) setSelectedSemester(active.id);
          }
        }
      }).catch(() => {}).finally(() => setLoading(false));
  }, [studentId, selectedSemester, token]);

  // Load history
  useEffect(() => {
    if (!studentId || !token) return;
    query<any>(ATTENDANCE_HISTORY_QUERY, { studentId }, token)
      .then(r => setHistory(r.studentAttendanceRecords ?? []))
      .catch(() => {});
  }, [studentId, token]);

  // Derived: filtered + paginated subject rates
  const filteredRates = useMemo(() =>
    rates.filter(r => r.courseName.toLowerCase().includes(search.toLowerCase())),
    [rates, search]
  );
  const pagedRates = filteredRates.slice((ratePage - 1) * RATE_PAGE_SIZE, ratePage * RATE_PAGE_SIZE);

  // Derived: filtered + paginated history
  const filteredHistory = useMemo(() =>
    selectedCourse ? history.filter(r => r.courseId === selectedCourse) : history,
    [history, selectedCourse]
  );
  const pagedHistory = filteredHistory.slice((histPage - 1) * HIST_PAGE_SIZE, histPage * HIST_PAGE_SIZE);

  // Reset pages when filters change
  useEffect(() => { setRatePage(1); }, [search, selectedSemester]);
  useEffect(() => { setHistPage(1); }, [selectedCourse]);

  const belowThresholdCount = rates.filter(r => r.belowThreshold).length;
  const selectedCourseName  = rates.find(r => r.courseId === selectedCourse)?.courseName ?? '';

  // Overall summary stats
  const totalPresent = rates.reduce((s, r) => s + r.present, 0);
  const totalSessions = rates.reduce((s, r) => s + r.totalSessions, 0);
  const overallRate   = totalSessions > 0 ? (totalPresent / totalSessions) * 100 : 0;

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Attendance</h1>
          <p className="text-muted-foreground text-sm">Per-subject attendance rates and history</p>
        </div>
        <Select value={selectedSemester || 'all'} onValueChange={v => { setSelectedSemester(v === 'all' ? '' : v); setSelectedCourse(''); }}>
          <SelectTrigger className="w-52"><SelectValue placeholder="Select semester" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All semesters</SelectItem>
            {semesters.map(s => <SelectItem key={s.id} value={s.id}>{s.name} — {s.academic_year}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Warning banner */}
      {!loading && belowThresholdCount > 0 && (
        <div className="flex items-start gap-3 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-800">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <p className="text-sm">
            <span className="font-semibold">Attendance warning — </span>
            You are below the required threshold in {belowThresholdCount} subject{belowThresholdCount !== 1 ? 's' : ''}.
          </p>
        </div>
      )}

      {/* Summary stats row */}
      {!loading && rates.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {[
            { label: 'Subjects',  value: rates.length,                        color: 'text-foreground' },
            { label: 'Overall',   value: `${overallRate.toFixed(0)}%`,        color: overallRate >= 75 ? 'text-green-600' : 'text-red-600' },
            { label: 'Warnings',  value: belowThresholdCount,                 color: belowThresholdCount > 0 ? 'text-red-600' : 'text-green-600' },
            { label: 'Sessions',  value: totalSessions,                       color: 'text-foreground' },
            { label: 'Present',   value: totalPresent,                        color: 'text-green-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-lg border bg-card p-3 text-center">
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Subject rates list */}
      {loading ? (
        <Card>
          <CardContent className="p-4 space-y-3">
            {[1,2,3,4].map(i => <div key={i} className="h-12 bg-muted rounded animate-pulse" />)}
          </CardContent>
        </Card>
      ) : rates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
              <Calendar className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold mb-1">No attendance records yet</h3>
            <p className="text-muted-foreground text-sm max-w-xs">Your attendance will appear here once your teacher marks it.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-0 pt-4 px-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <CardTitle className="text-base flex-1">Subjects ({filteredRates.length})</CardTitle>
              {/* Search */}
              <div className="relative w-full sm:w-56">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search subjects…"
                  className="w-full pl-8 pr-3 py-1.5 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>
          </CardHeader>

          {/* Column headings */}
          <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto_auto_160px_auto] gap-x-4 px-4 pt-3 pb-1 text-xs font-medium text-muted-foreground border-b">
            <span>Subject</span>
            <span className="w-14 text-center">Sessions</span>
            <span className="w-12 text-center text-green-700">Present</span>
            <span className="w-10 text-center text-amber-700">Late</span>
            <span className="w-12 text-center text-red-700">Absent</span>
            <span className="w-40">Rate</span>
            <span className="w-6" />
          </div>

          <CardContent className="p-0">
            {pagedRates.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">No subjects match your search.</p>
            ) : (
              <div className="divide-y">
                {pagedRates.map(r => {
                  const isSelected = selectedCourse === r.courseId;
                  return (
                    <button
                      key={r.courseId}
                      onClick={() => setSelectedCourse(prev => prev === r.courseId ? '' : r.courseId)}
                      className={`w-full text-left px-4 py-3 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
                        isSelected ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                      } ${r.belowThreshold && !isSelected ? 'bg-red-50/40' : ''}`}
                    >
                      {/* Desktop layout */}
                      <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto_auto_160px_auto] gap-x-4 items-center">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{r.courseName}</p>
                        </div>
                        <span className="w-14 text-center text-xs tabular-nums">{r.totalSessions}</span>
                        <span className="w-12 text-center text-xs tabular-nums text-green-700 font-medium">{r.present}</span>
                        <span className="w-10 text-center text-xs tabular-nums text-amber-700 font-medium">{r.late}</span>
                        <span className="w-12 text-center text-xs tabular-nums text-red-700 font-medium">{r.absent}</span>
                        <div className="w-40">
                          <RateBar pct={r.attendanceRate} below={r.belowThreshold} />
                        </div>
                        <div className="w-6 flex justify-end">
                          {r.belowThreshold
                            ? <AlertTriangle className="h-4 w-4 text-red-500" />
                            : <CheckCircle className="h-4 w-4 text-green-500" />}
                        </div>
                      </div>

                      {/* Mobile layout */}
                      <div className="sm:hidden space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium leading-tight">{r.courseName}</p>
                          {r.belowThreshold
                            ? <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                            : <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />}
                        </div>
                        <RateBar pct={r.attendanceRate} below={r.belowThreshold} />
                        <div className="flex gap-3 text-xs text-muted-foreground">
                          <span>{r.totalSessions} sessions</span>
                          <span className="text-green-700">✓ {r.present}</span>
                          {r.late > 0 && <span className="text-amber-700">⏱ {r.late}</span>}
                          <span className="text-red-700">✗ {r.absent}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            <Paginator page={ratePage} total={filteredRates.length} pageSize={RATE_PAGE_SIZE} onChange={setRatePage} />
          </CardContent>
        </Card>
      )}

      {/* History section */}
      {(history.length > 0 || selectedCourse) && (
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              {selectedCourse ? `${selectedCourseName}` : 'All Attendance History'}
            </CardTitle>
            <div className="flex items-center gap-2">
              {selectedCourse && (
                <button
                  onClick={() => setSelectedCourse('')}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  <XCircle className="h-3.5 w-3.5" />Show all
                </button>
              )}
              <span className="text-xs text-muted-foreground">{filteredHistory.length} records</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {pagedHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No records for this subject.</p>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Date</th>
                        {!selectedCourse && <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Subject</th>}
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {pagedHistory.map(rec => (
                        <tr key={rec.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-2.5 text-sm font-medium">{fmtDate(rec.date)}</td>
                          {!selectedCourse && <td className="px-4 py-2.5 text-sm text-muted-foreground">{rec.courseName}</td>}
                          <td className="px-4 py-2.5">
                            <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_STYLE[rec.status] ?? 'bg-muted text-muted-foreground'}`}>
                              {rec.status === 'present' && <CheckCircle className="h-3 w-3" />}
                              {rec.status === 'late'    && <Clock className="h-3 w-3" />}
                              {rec.status === 'absent'  && <XCircle className="h-3 w-3" />}
                              {rec.status === 'excused' && <BookOpen className="h-3 w-3" />}
                              {rec.status.charAt(0).toUpperCase() + rec.status.slice(1)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile list */}
                <div className="sm:hidden divide-y">
                  {pagedHistory.map(rec => (
                    <div key={rec.id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="text-sm font-medium">{fmtDate(rec.date)}</p>
                        {!selectedCourse && <p className="text-xs text-muted-foreground">{rec.courseName}</p>}
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_STYLE[rec.status] ?? 'bg-muted text-muted-foreground'}`}>
                        {rec.status.charAt(0).toUpperCase() + rec.status.slice(1)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
            <Paginator page={histPage} total={filteredHistory.length} pageSize={HIST_PAGE_SIZE} onChange={setHistPage} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

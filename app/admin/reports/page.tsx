'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/lib/auth-context';
import { mutate as mutation, query } from '@/lib/graphql';
import {
  BarChart3, BookOpen, CheckCircle2, ChevronLeft, ChevronRight,
  Clock, ExternalLink, FileText, Loader2, RefreshCw, Trash2, Users,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// ---------------------------------------------------------------------------
// GraphQL
// ---------------------------------------------------------------------------
const SETUP_QUERY = `
  query ReportSetup {
    semesters { id name academic_year status }
    courses(limit: 200) { id name course_code }
    reports(limit: 50) {
      id title reportType status generatedAt
      generatedBy { first_name last_name }
    }
  }
`;
const GENERATE_MUTATION = `
  mutation GenerateSystemReport(
    $reportType: String! $generatedById: ID!
    $dateFrom: String $dateTo: String $semesterId: ID $courseId: ID
  ) {
    generateSystemReport(
      reportType: $reportType generatedById: $generatedById
      dateFrom: $dateFrom dateTo: $dateTo semesterId: $semesterId courseId: $courseId
    ) {
      success message
      report { id title reportType status generatedAt data generatedBy { first_name last_name } }
    }
  }
`;
const DELETE_MUTATION = `
  mutation DeleteReport($reportId: ID!) {
    deleteReport(reportId: $reportId) { success message }
  }
`;

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const TYPES = [
  {
    value:  'attendance',
    label:  'Student Attendance',
    desc:   'Per-course attendance records — status, date, marking method',
    icon:   Clock,
    color:  '#3b82f6',
    badge:  'bg-blue-100 text-blue-700',
  },
  {
    value:  'staff_attendance',
    label:  'Staff Attendance',
    desc:   'Staff clock-in / out records with late-arrival info',
    icon:   Users,
    color:  '#8b5cf6',
    badge:  'bg-purple-100 text-purple-700',
  },
  {
    value:  'grades',
    label:  'Results & Grades',
    desc:   'CAT scores, exam scores, totals and letter grades',
    icon:   BarChart3,
    color:  '#22c55e',
    badge:  'bg-green-100 text-green-700',
  },
  {
    value:  'enrollment',
    label:  'Enrollment',
    desc:   'Student enrolment per course, semester and status',
    icon:   BookOpen,
    color:  '#f59e0b',
    badge:  'bg-amber-100 text-amber-700',
  },
] as const;

type ReportTypeValue = typeof TYPES[number]['value'];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Semester  { id: string; name: string; academic_year: string; status: string; }
interface Course    { id: string; name: string; course_code: string; }
interface ReportMeta {
  id: string; title: string; reportType: string; status: string;
  generatedAt: string | null; data?: string | null;
  generatedBy: { first_name: string; last_name: string };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function fmtDT(ts: string) {
  return new Date(ts).toLocaleString([], { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const HPAGE = 5;

function Paginator({ page, total, size, onChange }: { page: number; total: number; size: number; onChange(p: number): void }) {
  const pages = Math.max(1, Math.ceil(total / size));
  const from  = total === 0 ? 0 : (page - 1) * size + 1;
  const to    = Math.min(page * size, total);
  return (
    <div className="flex items-center justify-between px-5 py-3 border-t bg-muted/20">
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
// Report-type option card (horizontal)
// ---------------------------------------------------------------------------
function TypeCard({ t, selected, onClick }: { t: typeof TYPES[number]; selected: boolean; onClick(): void }) {
  const Icon = t.icon;
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-150 ${
        selected
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-border bg-background hover:border-muted-foreground/30 hover:bg-muted/30'
      }`}
    >
      {/* Colour icon block */}
      <span
        className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm"
        style={{ backgroundColor: t.color }}
      >
        <Icon className="h-6 w-6" />
      </span>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-sm ${selected ? 'text-primary' : 'text-foreground'}`}>{t.label}</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{t.desc}</p>
      </div>

      {/* Radio dot */}
      <span className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
        selected ? 'border-primary bg-primary' : 'border-muted-foreground/30 bg-background'
      }`}>
        {selected && <span className="w-2 h-2 rounded-full bg-white" />}
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function AdminReportsPage() {
  const { token, user } = useAuth();
  const router = useRouter();

  const [semesters,    setSemesters]    = useState<Semester[]>([]);
  const [courses,      setCourses]      = useState<Course[]>([]);
  const [history,      setHistory]      = useState<ReportMeta[]>([]);
  const [setupLoading, setSetupLoading] = useState(true);

  const [selType,   setSelType]   = useState<ReportTypeValue>('attendance');
  const [dateFrom,  setDateFrom]  = useState('');
  const [dateTo,    setDateTo]    = useState('');
  const [semId,     setSemId]     = useState('');
  const [courseId,  setCourseId]  = useState('');
  const [generating, setGenerating] = useState(false);
  const [genMsg,    setGenMsg]    = useState<{ text: string; ok: boolean } | null>(null);

  const [histPage, setHistPage] = useState(1);

  // Load
  useEffect(() => {
    if (!token) return;
    query<any>(SETUP_QUERY, {}, token)
      .then(r => {
        setSemesters(r.semesters ?? []);
        setCourses(r.courses ?? []);
        setHistory(r.reports ?? []);
        const act = (r.semesters ?? []).find((s: Semester) => s.status === 'active');
        if (act) setSemId(act.id);
      })
      .catch(() => {})
      .finally(() => setSetupLoading(false));
  }, [token]);

  async function generate() {
    if (!user || !token || generating) return;
    setGenerating(true); setGenMsg(null);
    try {
      const r   = await mutation<any>(GENERATE_MUTATION, {
        reportType: selType, generatedById: user.id,
        dateFrom: dateFrom || undefined, dateTo: dateTo || undefined,
        semesterId: semId || undefined, courseId: courseId || undefined,
      }, token);
      const res = r.generateSystemReport;
      setGenMsg({ text: res?.message ?? '', ok: !!res?.success });
      if (res?.success && res.report) {
        setHistory(p => [res.report, ...p]);
        setHistPage(1);
        router.push(`/admin/reports/${res.report.id}`);
      }
    } catch { setGenMsg({ text: 'Network error', ok: false }); }
    finally { setGenerating(false); }
  }

  async function deleteReport(id: string) {
    if (!confirm('Delete this report?')) return;
    await mutation<any>(DELETE_MUTATION, { reportId: id }, token!).catch(() => null);
    setHistory(p => p.filter(r => r.id !== id));
  }

  const pagedHistory = history.slice((histPage - 1) * HPAGE, histPage * HPAGE);

  const selMeta = TYPES.find(t => t.value === selType)!;

  return (
    <div className="space-y-6 max-w-5xl">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Generate and download system reports as CSV</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total reports',  value: history.length,                                                                               bg: 'bg-gradient-to-br from-blue-50 to-indigo-100',   color: 'text-blue-800'  },
          { label: 'Completed',      value: history.filter(r => r.status === 'completed').length,                                         bg: 'bg-gradient-to-br from-green-50 to-emerald-100', color: 'text-green-800' },
          { label: 'This month',     value: history.filter(r => r.generatedAt?.startsWith(new Date().toISOString().slice(0, 7))).length,  bg: 'bg-gradient-to-br from-amber-50 to-yellow-100',  color: 'text-amber-800' },
          { label: 'Report types',   value: TYPES.length,                                                                                 bg: 'bg-gradient-to-br from-purple-50 to-violet-100', color: 'text-purple-800' },
        ].map(({ label, value, bg, color }) => (
          <div key={label} className={`rounded-xl ${bg} border-0 p-4 shadow-sm`}>
            <p className={`text-2xl font-bold ${color}`}>{setupLoading ? '—' : value}</p>
            <p className="text-xs text-gray-600 font-medium mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Generator ─────────────────────────────────────────────────── */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="px-6 py-4 border-b bg-muted/30">
          <h2 className="font-semibold text-base">Generate a New Report</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Choose a type, set optional filters, then click Generate</p>
        </div>

        <div className="p-6 space-y-6">

          {/* Step 1 — type */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">1 · Select report type</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {TYPES.map(t => (
                <TypeCard key={t.value} t={t} selected={selType === t.value} onClick={() => setSelType(t.value)} />
              ))}
            </div>
          </div>

          {/* Step 2 — filters */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">2 · Filters <span className="normal-case font-normal opacity-60">(all optional)</span></p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Date from</label>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Date to</label>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Semester</label>
                <Select value={semId || 'all'} onValueChange={v => setSemId(v === 'all' ? '' : v)}>
                  <SelectTrigger className="h-9 text-sm rounded-lg"><SelectValue placeholder="All semesters" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All semesters</SelectItem>
                    {semesters.map(s => <SelectItem key={s.id} value={s.id}>{s.name} — {s.academic_year}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Course</label>
                <Select value={courseId || 'all'} onValueChange={v => setCourseId(v === 'all' ? '' : v)}>
                  <SelectTrigger className="h-9 text-sm rounded-lg"><SelectValue placeholder="All courses" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All courses</SelectItem>
                    {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.name} ({c.course_code})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Step 3 — generate */}
          <div className="pt-2 border-t flex flex-wrap items-center gap-3">
            <Button size="lg" onClick={generate} disabled={generating || !user} className="gap-2 px-6">
              {generating
                ? <><Loader2 className="h-4 w-4 animate-spin" />Generating…</>
                : <><RefreshCw className="h-4 w-4" />Generate {selMeta.label} Report</>}
            </Button>
            {genMsg && (
              <span className={`text-sm font-medium flex items-center gap-1.5 ${genMsg.ok ? 'text-green-700' : 'text-red-600'}`}>
                {genMsg.ok && <CheckCircle2 className="h-4 w-4" />}
                {genMsg.text}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── History ───────────────────────────────────────────────────── */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="px-6 py-4 border-b bg-muted/30 flex items-center justify-between">
          <h2 className="font-semibold text-base">Report History</h2>
          <span className="text-xs text-muted-foreground">{history.length} reports</span>
        </div>

        {setupLoading ? (
          <div className="p-6 space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />)}</div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-muted-foreground opacity-50" />
            </div>
            <p className="font-medium text-sm">No reports generated yet</p>
            <p className="text-xs text-muted-foreground mt-1">Use the form above to generate your first report</p>
          </div>
        ) : (
          <>
            <div className="divide-y">
              {pagedHistory.map(r => {
                const meta = TYPES.find(t => t.value === r.reportType);
                const Icon = meta?.icon ?? FileText;
                return (
                  <div key={r.id} className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/20">

                    {/* Icon */}
                    <div className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-sm"
                      style={{ backgroundColor: meta?.color ?? '#6b7280' }}>
                      <Icon className="h-5 w-5" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{r.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {r.generatedAt ? fmtDT(r.generatedAt) : '—'} &middot; {r.generatedBy.first_name} {r.generatedBy.last_name}
                      </p>
                    </div>

                    {/* Status pill */}
                    <span className={`hidden sm:inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium capitalize ${
                      r.status === 'completed' ? 'bg-green-100 text-green-700'
                      : r.status === 'failed'  ? 'bg-red-100 text-red-700'
                      : 'bg-amber-100 text-amber-700'
                    }`}>
                      {r.status === 'completed' && <span className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                      {r.status}
                    </span>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {r.status === 'completed' && (
                        <Link href={`/admin/reports/${r.id}`}>
                          <Button size="sm" variant="outline" className="gap-1.5">
                            <ExternalLink className="h-3.5 w-3.5" />View
                          </Button>
                        </Link>
                      )}
                      <Button size="icon" variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-red-50"
                        onClick={() => deleteReport(r.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
            <Paginator page={histPage} total={history.length} size={HPAGE} onChange={setHistPage} />
          </>
        )}
      </div>
    </div>
  );
}

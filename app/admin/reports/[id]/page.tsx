'use client';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { query } from '@/lib/graphql';
import {
  ArrowLeft, BarChart3, BookOpen, ChevronLeft, ChevronRight,
  Clock, Download, FileText, Loader2, Printer, Users,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

// ---------------------------------------------------------------------------
// GraphQL
// ---------------------------------------------------------------------------
const REPORT_QUERY = `
  query ReportDetail($id: ID!) {
    report(id: $id) {
      id title reportType status generatedAt data
      generatedBy { first_name last_name }
    }
  }
`;

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const TYPE_META: Record<string, { label: string; icon: React.ElementType; color: string; light: string }> = {
  attendance:       { label: 'Student Attendance', icon: Clock,     color: '#3b82f6', light: '#eff6ff' },
  staff_attendance: { label: 'Staff Attendance',   icon: Users,     color: '#8b5cf6', light: '#f5f3ff' },
  grades:           { label: 'Results & Grades',   icon: BarChart3, color: '#22c55e', light: '#f0fdf4' },
  enrollment:       { label: 'Enrollment',         icon: BookOpen,  color: '#f59e0b', light: '#fffbeb' },
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ReportDetail {
  id: string; title: string; reportType: string; status: string;
  generatedAt: string | null; data: string | null;
  generatedBy: { first_name: string; last_name: string };
}
interface ReportData {
  columns: string[];
  records: Record<string, unknown>[];
  total: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function parseData(raw?: string | null): ReportData | null {
  if (!raw) return null;
  try {
    const d = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return { columns: d.columns ?? [], records: d.records ?? [], total: d.total ?? 0 };
  } catch { return null; }
}

function colLabel(c: string) {
  return c.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function fmtDT(ts: string) {
  return new Date(ts).toLocaleString([], {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// CSV download
function downloadCSV(data: ReportData, title: string) {
  const rows = [
    data.columns.join(','),
    ...data.records.map(r =>
      data.columns.map(c => {
        const v = String(r[c] ?? '');
        return v.includes(',') || v.includes('"') || v.includes('\n')
          ? `"${v.replace(/"/g, '""')}"` : v;
      }).join(',')
    ),
  ].join('\n');
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob(['﻿' + rows], { type: 'text/csv;charset=utf-8;' })),
    download: `${title.replace(/[^a-z0-9]/gi, '_')}.csv`,
  });
  a.click(); URL.revokeObjectURL(a.href);
}

// PDF via browser print
function printPDF(report: ReportDetail, data: ReportData) {
  const meta = TYPE_META[report.reportType] ?? TYPE_META.attendance;
  const colsHtml = data.columns
    .map(c => `<th>${colLabel(c)}</th>`)
    .join('');
  const rowsHtml = data.records
    .map((row, i) => {
      const cells = data.columns
        .map(c => `<td>${row[c] ?? '—'}</td>`)
        .join('');
      return `<tr class="${i % 2 === 0 ? 'even' : ''}">${cells}</tr>`;
    })
    .join('');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${report.title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #111; padding: 20px; }
    .header { border-bottom: 3px solid ${meta.color}; padding-bottom: 12px; margin-bottom: 16px; }
    .header h1 { font-size: 18px; font-weight: bold; color: ${meta.color}; }
    .header p  { color: #555; margin-top: 4px; font-size: 10px; }
    .meta { display: flex; gap: 24px; margin-bottom: 16px; font-size: 10px; color: #555; }
    .meta strong { color: #111; }
    table { width: 100%; border-collapse: collapse; font-size: 10px; }
    th { background: ${meta.color}; color: #fff; text-align: left; padding: 6px 8px; font-weight: 600; white-space: nowrap; }
    td { padding: 5px 8px; border-bottom: 1px solid #e5e7eb; }
    tr.even td { background: ${meta.light}; }
    .footer { margin-top: 16px; font-size: 9px; color: #aaa; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 8px; }
    @media print {
      body { padding: 10px; }
      @page { margin: 1cm; size: A4 landscape; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${report.title}</h1>
    <p>${meta.label} Report</p>
  </div>
  <div class="meta">
    <span>Generated by: <strong>${report.generatedBy.first_name} ${report.generatedBy.last_name}</strong></span>
    ${report.generatedAt ? `<span>Date: <strong>${fmtDT(report.generatedAt)}</strong></span>` : ''}
    <span>Total records: <strong>${data.total}</strong></span>
  </div>
  <table>
    <thead><tr>${colsHtml}</tr></thead>
    <tbody>${rowsHtml}</tbody>
  </table>
  <div class="footer">Generated by SIMS — School Information Management System</div>
  <script>window.onload = function(){ window.print(); window.onafterprint = function(){ window.close(); }; }<\/script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=1100,height=700');
  if (!win) { alert('Please allow pop-ups to download PDF'); return; }
  win.document.write(html);
  win.document.close();
}

// ---------------------------------------------------------------------------
// Paginator
// ---------------------------------------------------------------------------
const PAGE_SIZE = 15;

function Paginator({ page, total, onChange }: { page: number; total: number; onChange(p: number): void }) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from  = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to    = Math.min(page * PAGE_SIZE, total);
  return (
    <div className="flex items-center justify-between px-6 py-4 border-t">
      <span className="text-sm text-muted-foreground">{total === 0 ? 'No records' : `Showing ${from}–${to} of ${total}`}</span>
      <div className="flex items-center gap-1.5">
        <button disabled={page <= 1} onClick={() => onChange(page - 1)}
          className="p-2 rounded-lg border bg-background disabled:opacity-30 hover:bg-muted transition-colors">
          <ChevronLeft className="h-4 w-4" />
        </button>
        {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
          <button key={p} onClick={() => onChange(p)}
            className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
              p === page ? 'bg-primary text-primary-foreground shadow-sm' : 'border bg-background hover:bg-muted'
            }`}>
            {p}
          </button>
        ))}
        <button disabled={page >= pages} onClick={() => onChange(page + 1)}
          className="p-2 rounded-lg border bg-background disabled:opacity-30 hover:bg-muted transition-colors">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Status badge cell
// ---------------------------------------------------------------------------
function StatusBadge({ value }: { value: string }) {
  const s = value.toLowerCase();
  const cls =
    s === 'present' || s === 'active'     ? 'bg-green-100 text-green-800'
    : s === 'absent' || s === 'inactive'  ? 'bg-red-100 text-red-800'
    : s === 'late'                        ? 'bg-amber-100 text-amber-800'
    : s === 'excused'                     ? 'bg-blue-100 text-blue-800'
    : 'bg-muted text-muted-foreground';
  return <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${cls}`}>{value}</span>;
}

function GradeBadge({ value }: { value: string }) {
  const cls =
    value === 'A' ? 'bg-green-100 text-green-800'
    : value === 'B' ? 'bg-blue-100 text-blue-800'
    : value === 'C' ? 'bg-yellow-100 text-yellow-800'
    : value === 'D' ? 'bg-orange-100 text-orange-800'
    : value === 'E' ? 'bg-red-100 text-red-800'
    : value === 'F' ? 'bg-red-200 text-red-900 font-bold'
    : 'bg-muted text-muted-foreground';
  return <span className={`inline-flex px-2.5 py-0.5 rounded text-xs font-bold ${cls}`}>{value}</span>;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function ReportDetailPage() {
  const { token }  = useAuth();
  const { id }     = useParams<{ id: string }>();
  const [report, setReport]   = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);

  useEffect(() => {
    if (!token || !id) return;
    query<any>(REPORT_QUERY, { id }, token)
      .then(r => setReport(r.report ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, id]);

  const data      = useMemo(() => parseData(report?.data), [report]);
  const pagedRows = useMemo(() =>
    data?.records.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) ?? [],
  [data, page]);

  const handleCSV = useCallback(() => {
    if (data && report) downloadCSV(data, report.title);
  }, [data, report]);

  const handlePDF = useCallback(() => {
    if (data && report) printPDF(report, data);
  }, [data, report]);

  // ── Loading ──
  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );

  // ── Not found ──
  if (!report) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
        <FileText className="h-10 w-10 text-muted-foreground opacity-40" />
      </div>
      <p className="text-lg font-semibold">Report not found</p>
      <Link href="/admin/reports">
        <Button variant="outline"><ArrowLeft className="h-4 w-4 mr-2" />Back to Reports</Button>
      </Link>
    </div>
  );

  const meta = TYPE_META[report.reportType] ?? { label: 'Report', icon: FileText, color: '#6b7280', light: '#f9fafb' };
  const Icon = meta.icon;
  const hasData = data && data.total > 0;

  return (
    <div className="space-y-6 max-w-7xl">

      {/* ── Top bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Link href="/admin/reports">
          <Button variant="outline" size="sm" className="gap-2 w-fit">
            <ArrowLeft className="h-4 w-4" />Back
          </Button>
        </Link>

        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md shrink-0"
            style={{ backgroundColor: meta.color }}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold truncate">{report.title}</h1>
            <p className="text-sm text-muted-foreground">
              {meta.label} · by {report.generatedBy.first_name} {report.generatedBy.last_name}
              {report.generatedAt && ` · ${fmtDT(report.generatedAt)}`}
            </p>
          </div>
        </div>

        {/* Download buttons */}
        {hasData && (
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" className="gap-2" onClick={handleCSV}>
              <Download className="h-4 w-4" />CSV
            </Button>
            <Button className="gap-2" onClick={handlePDF}>
              <Printer className="h-4 w-4" />PDF
            </Button>
          </div>
        )}
      </div>

      {/* ── Summary tiles ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Records', value: data?.total ?? 0,                                          highlight: true },
          { label: 'Columns',       value: data?.columns.length ?? 0,                                 highlight: false },
          { label: 'Pages',         value: data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1, highlight: false },
          { label: 'Status',        value: report.status.charAt(0).toUpperCase() + report.status.slice(1), highlight: false },
        ].map(({ label, value, highlight }) => (
          <div key={label}
            className={`rounded-xl border p-4 ${highlight ? 'border-2' : ''}`}
            style={highlight ? { borderColor: meta.color, backgroundColor: meta.light } : {}}>
            <p className="text-2xl font-bold" style={highlight ? { color: meta.color } : {}}>{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Download banner ── */}
      {hasData && (
        <div className="rounded-xl border-2 p-5 flex flex-col sm:flex-row sm:items-center gap-4"
          style={{ borderColor: meta.color, backgroundColor: meta.light }}>
          <div className="flex-1">
            <p className="font-semibold" style={{ color: meta.color }}>Report ready to download</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {data.total} records · {data.columns.length} columns
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2 bg-white" onClick={handleCSV}>
              <Download className="h-4 w-4" />Download CSV
            </Button>
            <Button className="gap-2" style={{ backgroundColor: meta.color, borderColor: meta.color }} onClick={handlePDF}>
              <Printer className="h-4 w-4" />Download PDF
            </Button>
          </div>
        </div>
      )}

      {/* ── Data table ── */}
      <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ backgroundColor: meta.light }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
              style={{ backgroundColor: meta.color }}>
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <p className="font-semibold text-sm">{meta.label} Data</p>
              {data && <p className="text-xs text-muted-foreground">{data.total} records total</p>}
            </div>
          </div>
          {hasData && (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="gap-1.5 bg-white" onClick={handleCSV}>
                <Download className="h-3.5 w-3.5" />CSV
              </Button>
              <Button size="sm" className="gap-1.5" onClick={handlePDF}
                style={{ backgroundColor: meta.color }}>
                <Printer className="h-3.5 w-3.5" />PDF
              </Button>
            </div>
          )}
        </div>

        {!data || data.total === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-muted-foreground opacity-40" />
            </div>
            <p className="font-medium">No records in this report</p>
            <p className="text-sm text-muted-foreground mt-1">Try regenerating with different filters</p>
            <Link href="/admin/reports" className="mt-4">
              <Button variant="outline" size="sm">Go back and regenerate</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ backgroundColor: meta.color }}>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-white w-12 opacity-80">#</th>
                    {data.columns.map(c => (
                      <th key={c} className="text-left px-4 py-3 text-xs font-semibold text-white whitespace-nowrap">
                        {colLabel(c)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {pagedRows.map((row, i) => (
                    <tr key={i} className={`transition-colors hover:bg-muted/20 ${i % 2 === 0 ? '' : 'bg-muted/10'}`}>
                      <td className="px-4 py-3 text-xs text-muted-foreground font-mono">
                        {(page - 1) * PAGE_SIZE + i + 1}
                      </td>
                      {data.columns.map(col => {
                        const val = row[col];
                        const s   = String(val ?? '—');
                        if (col === 'status') return (
                          <td key={col} className="px-4 py-3"><StatusBadge value={s} /></td>
                        );
                        if (col === 'grade') return (
                          <td key={col} className="px-4 py-3"><GradeBadge value={s} /></td>
                        );
                        if (col === 'late') return (
                          <td key={col} className="px-4 py-3">
                            <span className={`text-xs font-semibold ${s === 'Yes' ? 'text-red-600' : 'text-green-600'}`}>{s}</span>
                          </td>
                        );
                        if (typeof val === 'number' && (col.includes('score') || col === 'cat1' || col === 'cat2' || col === 'exam' || col === 'total')) return (
                          <td key={col} className="px-4 py-3 font-mono text-sm font-medium">{val.toFixed(1)}</td>
                        );
                        return <td key={col} className="px-4 py-3 text-sm whitespace-nowrap">{s}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Paginator page={page} total={data.total} onChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}

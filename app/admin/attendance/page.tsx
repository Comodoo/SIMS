'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/lib/auth-context';
import { mutate as mutation, query } from '@/lib/graphql';
import { BookOpen, Camera, Clock, Fingerprint, Settings, Users } from 'lucide-react';

import { useEffect, useState } from 'react';

// ---------------------------------------------------------------------------
// GraphQL
// ---------------------------------------------------------------------------
const STAFF_TODAY_QUERY = `
  query StaffToday($date: String) {
    staffTodayStatus(date: $date) {
      id timestamp is_late late_minutes method
      user { first_name last_name role }
      staff { id staff_number position department }
    }
    staffMembers(isActive: true, limit: 200) {
      id staff_number position department
      user { first_name last_name role }
    }
  }
`;

const STAFF_ALL_RECORDS_QUERY = `
  query StaffDayRecords($dateFrom: String, $dateTo: String) {
    attendance(dateFrom: $dateFrom, dateTo: $dateTo, limit: 500) {
      id status timestamp is_late late_minutes method
      user { first_name last_name role }
      staff { id staff_number position department }
    }
  }
`;

const STUDENT_ATTENDANCE_QUERY = `
  query StudentAttendanceByCourse($courseId: ID!, $date: String!) {
    studentAttendanceByCourse(courseId: $courseId, date: $date) {
      id studentId studentName status method markedAt markedByName
    }
  }
`;

const COURSES_QUERY = `
  query AllCourses {
    courses(limit: 200) { id name course_code }
    semesters { id name academic_year status }
  }
`;

const SESSIONS_QUERY = `
  query AttendanceSessions($courseId: ID!, $semesterId: ID) {
    attendanceSessions(courseId: $courseId, semesterId: $semesterId, limit: 60) {
      id date wasHeld courseName conductedByName
    }
  }
`;

const SYSTEM_SETTINGS_QUERY = `
  query SystemSettings { systemSettings { id key value description updatedAt } }
`;

const UPDATE_SETTING_MUTATION = `
  mutation UpdateSetting($key: String!, $value: String!) {
    updateSystemSetting(key: $key, value: $value) { success message }
  }
`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface StaffRecord {
  id: string; status: string; timestamp: string; is_late: boolean; late_minutes: number | null; method: string;
  user: { first_name: string; last_name: string; role: string };
  staff: { id: string; staff_number: string; position: string; department: string } | null;
}
interface StaffMember {
  id: string; staff_number: string; position: string; department: string;
  user: { first_name: string; last_name: string; role: string };
}
interface CourseAttendance { id: string; studentId: string; studentName: string; status: string; method: string; markedAt: string | null; markedByName: string | null; }
interface Course { id: string; name: string; course_code: string; }
interface Semester { id: string; name: string; academic_year: string; status: string; }
interface Session { id: string; date: string; wasHeld: boolean; courseName: string; conductedByName: string | null; }
interface SystemSetting { id: string; key: string; value: string; description: string | null; updatedAt: string; }

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
// Helpers
// ---------------------------------------------------------------------------
function today() { return new Date().toISOString().slice(0, 10); }
function fmtDate(d: string) { return new Date(d + 'T00:00:00').toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }); }
function fmtTime(ts: string) { return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
function fmtDateTime(ts: string) { return new Date(ts).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }
function fmtLate(min: number) {
  if (min < 60) return `${min}m late`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}m late` : `${h}h late`;
}

const STATUS_COLORS: Record<string, string> = {
  present: 'bg-green-100 text-green-800',
  absent: 'bg-red-100 text-red-800',
  late: 'bg-amber-100 text-amber-800',
  excused: 'bg-blue-100 text-blue-800',
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function AdminAttendancePage() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'staff' | 'students' | 'settings'>('staff');
  const [staffPage, setStaffPage] = useState(1);
  const [stuPage, setStuPage] = useState(1);

  // Staff attendance
  const [staffDate, setStaffDate] = useState(today());
  const [allDayRecords, setAllDayRecords] = useState<StaffRecord[]>([]);
  const [allStaff, setAllStaff] = useState<StaffMember[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);

  // Student attendance
  const [courses, setCourses] = useState<Course[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedDate, setSelectedDate] = useState(today());
  const [sessions, setSessions] = useState<Session[]>([]);
  const [courseAttendance, setCourseAttendance] = useState<CourseAttendance[]>([]);
  const [stuLoading, setStuLoading] = useState(false);

  // System settings
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [settingEdits, setSettingEdits] = useState<Record<string, string>>({});
  const [settingMsg, setSettingMsg] = useState('');

  // Load staff attendance for selected date (all in+out records)
  useEffect(() => {
    if (!token) return;
    setStaffLoading(true);
    Promise.all([
      query<any>(STAFF_ALL_RECORDS_QUERY, { dateFrom: staffDate, dateTo: staffDate }, token),
      query<any>(STAFF_TODAY_QUERY, { date: staffDate }, token),
    ]).then(([allData, todayData]) => {
      setAllDayRecords(allData.attendance ?? []);
      setAllStaff(todayData.staffMembers ?? []);
    }).catch(() => {}).finally(() => setStaffLoading(false));
  }, [token, staffDate]);

  // Load courses + semesters
  useEffect(() => {
    if (!token) return;
    query<any>(COURSES_QUERY, {}, token).then(r => {
      setCourses(r.courses ?? []);
      if (r.semesters) {
        setSemesters(r.semesters);
        const active = (r.semesters as Semester[]).find(s => s.status === 'active');
        if (active && !selectedSemester) setSelectedSemester(active.id);
      }
    }).catch(() => {});
  }, [token]);

  // Load sessions when course changes
  useEffect(() => {
    if (!selectedCourse || !token) return;
    query<any>(SESSIONS_QUERY, { courseId: selectedCourse, semesterId: selectedSemester || undefined }, token)
      .then(r => setSessions(r.attendanceSessions ?? []))
      .catch(() => {});
  }, [selectedCourse, selectedSemester, token]);

  // Load course attendance
  useEffect(() => {
    if (!selectedCourse || !selectedDate || !token) return;
    setStuLoading(true);
    query<any>(STUDENT_ATTENDANCE_QUERY, { courseId: selectedCourse, date: selectedDate }, token)
      .then(r => setCourseAttendance(r.studentAttendanceByCourse ?? []))
      .catch(() => {})
      .finally(() => setStuLoading(false));
  }, [selectedCourse, selectedDate, token]);

  // Load system settings
  useEffect(() => {
    if (!token || activeTab !== 'settings') return;
    query<any>(SYSTEM_SETTINGS_QUERY, {}, token).then(r => {
      const s: SystemSetting[] = r.systemSettings ?? [];
      setSettings(s);
      const edits: Record<string, string> = {};
      s.forEach(x => { edits[x.key] = x.value; });
      setSettingEdits(edits);
    }).catch(() => {});
  }, [token, activeTab]);

  async function handleSaveSetting(key: string) {
    if (!token) return;
    setSettingMsg('');
    const r = await mutation<any>(UPDATE_SETTING_MUTATION, { key, value: settingEdits[key] }, token).catch(() => null);
    setSettingMsg(r?.updateSystemSetting?.message ?? 'Error');
  }

  // Group all day records by staff: pair clock-in and clock-out per staff member
  const staffRows = (() => {
    const map: Record<string, { member: StaffMember; inRec?: StaffRecord; outRec?: StaffRecord }> = {};
    // Seed with all staff (so absent ones appear too)
    allStaff.forEach(s => { map[s.id] = { member: s }; });
    // Fill in records
    allDayRecords.forEach(rec => {
      const sid = rec.staff?.id;
      if (!sid) return;
      if (!map[sid]) map[sid] = { member: { id: sid, staff_number: '', position: rec.staff?.position ?? '', department: rec.staff?.department ?? '', user: rec.user } };
      if (rec.status === 'in' && !map[sid].inRec) map[sid].inRec = rec;
      if (rec.status === 'out' && !map[sid].outRec) map[sid].outRec = rec;
    });
    return Object.values(map);
  })();

  useEffect(() => { setStaffPage(1); }, [staffDate]);
  useEffect(() => { setStuPage(1); }, [selectedCourse, selectedDate]);

  const pagedStaffRows = staffRows.slice((staffPage - 1) * PAGE_SIZE, staffPage * PAGE_SIZE);
  const pagedCourseAttendance = courseAttendance.slice((stuPage - 1) * PAGE_SIZE, stuPage * PAGE_SIZE);

  const presentCount = staffRows.filter(r => r.inRec && !r.inRec.is_late).length;
  const lateCount = staffRows.filter(r => r.inRec?.is_late).length;
  const absentCount = staffRows.filter(r => !r.inRec).length;

  // Student summary counts
  const stuPresentCount = courseAttendance.filter(r => r.status === 'present').length;
  const stuAbsentCount = courseAttendance.filter(r => r.status === 'absent').length;
  const stuLateCount = courseAttendance.filter(r => r.status === 'late').length;

  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Attendance Management</h1>
          <p className="text-muted-foreground">View student attendance records and configure settings</p>
        </div>
        <div className="flex gap-2">
          {([
            { key: 'staff', label: 'Teacher', icon: Users },
            { key: 'students', label: 'Students', icon: BookOpen },
            { key: 'settings', label: 'Settings', icon: Settings },
          ] as const).map(({ key, label, icon: Icon }) => (
            <Button key={key} variant={activeTab === key ? 'default' : 'outline'} size="sm" onClick={() => setActiveTab(key)}>
              <Icon className="h-4 w-4 mr-1.5" />{label}
            </Button>
          ))}
        </div>
      </div>

      {/* ── Staff Attendance Tab ── */}
      {activeTab === 'staff' && (
        <div className="space-y-4">
          {/* Date picker + summary counts */}
          <div className="flex flex-wrap items-center gap-4">
            <input type="date" value={staffDate} onChange={e => setStaffDate(e.target.value)}
              className="border rounded-md px-3 py-1.5 text-sm bg-background" />
            <div className="flex gap-4 text-sm">
              <span><span className="font-bold text-green-600">{presentCount}</span> <span className="text-muted-foreground">on time</span></span>
              <span><span className="font-bold text-amber-600">{lateCount}</span> <span className="text-muted-foreground">late</span></span>
              <span><span className="font-bold text-red-600">{absentCount}</span> <span className="text-muted-foreground">absent</span></span>
            </div>
          </div>

          {staffLoading ? (
            <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-12 bg-muted rounded animate-pulse" />)}</div>
          ) : (
            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Name</th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Role</th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Position</th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Clock In</th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Clock Out</th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Status</th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Method</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {pagedStaffRows.map(row => {
                      const name = `${row.member.user.first_name} ${row.member.user.last_name}`;
                      const role = row.member.user.role;
                      const isLate = row.inRec?.is_late ?? false;
                      const lateMin = row.inRec?.late_minutes ?? 0;
                      const method = row.inRec?.method ?? row.outRec?.method;
                      return (
                        <tr key={row.member.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3 font-medium">{name}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                              role === 'admin' ? 'bg-purple-100 text-purple-700'
                              : 'bg-blue-100 text-blue-700'
                            }`}>{role}</span>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{row.member.position}</td>
                          <td className="px-4 py-3">
                            {row.inRec
                              ? <span className="text-green-700 font-semibold tabular-nums">{fmtTime(row.inRec.timestamp)}</span>
                              : <span className="text-muted-foreground">—</span>}
                          </td>
                          <td className="px-4 py-3">
                            {row.outRec
                              ? <span className="text-red-600 font-semibold tabular-nums">{fmtTime(row.outRec.timestamp)}</span>
                              : <span className="text-muted-foreground">—</span>}
                          </td>
                          <td className="px-4 py-3">
                            {!row.inRec ? (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">Absent</span>
                            ) : isLate ? (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">{fmtLate(lateMin)}</span>
                            ) : (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">On time</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground capitalize">{method ?? '—'}</td>
                        </tr>
                      );
                    })}
                    {staffRows.length === 0 && (
                      <tr><td colSpan={7} className="text-center text-sm text-muted-foreground py-10">No teacher records found.</td></tr>
                    )}
                  </tbody>
                </table>
                <Paginator page={staffPage} total={staffRows.length} onChange={setStaffPage} />
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ── Student Attendance Tab ── */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-5 flex flex-wrap gap-3">
              <Select value={selectedSemester || 'all'} onValueChange={v => setSelectedSemester(v === 'all' ? '' : v)}>
                <SelectTrigger className="w-48"><SelectValue placeholder="Semester" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All semesters</SelectItem>
                  {semesters.map(s => <SelectItem key={s.id} value={s.id}>{s.name} — {s.academic_year}</SelectItem>)}
                </SelectContent>
              </Select>

              <Select value={selectedCourse || 'none'} onValueChange={v => setSelectedCourse(v === 'none' ? '' : v)}>
                <SelectTrigger className="w-64"><SelectValue placeholder="Select course" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select course</SelectItem>
                  {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.name} ({c.course_code})</SelectItem>)}
                </SelectContent>
              </Select>

              <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                className="border rounded-md px-3 py-1.5 text-sm bg-background" />
            </CardContent>
          </Card>

          {/* Session chips */}
          {sessions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {sessions.slice(0, 8).map(s => (
                <button key={s.id} onClick={() => setSelectedDate(s.date)}
                  className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                    selectedDate === s.date
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-muted-foreground hover:bg-muted'
                  }`}>
                  {fmtDate(s.date)}{!s.wasHeld ? ' (cancelled)' : ''}
                  {s.conductedByName && <span className="opacity-60 ml-1">· {s.conductedByName.split(' ')[0]}</span>}
                </button>
              ))}
            </div>
          )}

          {/* Biometric log — only when a course + date are selected */}
          {selectedCourse && courseAttendance.some(r => r.method === 'face' || r.method === 'fingerprint') && (
            <Card className="border-purple-200 bg-purple-50/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-purple-800">
                  <Fingerprint className="h-4 w-4" />Biometric Marks Log
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-purple-100">
                  {courseAttendance
                    .filter(r => r.method === 'face' || r.method === 'fingerprint')
                    .sort((a, b) => (b.markedAt ?? '').localeCompare(a.markedAt ?? ''))
                    .map(rec => (
                      <div key={rec.id} className="flex items-center gap-3 px-4 py-2.5">
                        {rec.method === 'face'
                          ? <Camera className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                          : <Fingerprint className="h-3.5 w-3.5 text-purple-500 shrink-0" />}
                        <span className="text-sm font-medium flex-1">{rec.studentName}</span>
                        {rec.markedByName && <span className="text-xs text-muted-foreground">by {rec.markedByName}</span>}
                        {rec.markedAt && <span className="text-xs text-purple-700 font-mono tabular-nums">{fmtDateTime(rec.markedAt)}</span>}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[rec.status] ?? ''}`}>
                          {rec.status}
                        </span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {!selectedCourse ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Users className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm font-medium">Select a course to view attendance</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <CardTitle className="text-base">
                    {courses.find(c => c.id === selectedCourse)?.name} · {fmtDate(selectedDate)}
                  </CardTitle>
                  {courseAttendance.length > 0 && (
                    <div className="flex gap-3 text-sm">
                      <span className="text-green-600 font-medium">{stuPresentCount} present</span>
                      <span className="text-amber-600 font-medium">{stuLateCount} late</span>
                      <span className="text-red-600 font-medium">{stuAbsentCount} absent</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {stuLoading ? (
                  <div className="p-4 space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-10 bg-muted rounded animate-pulse" />)}</div>
                ) : courseAttendance.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No attendance records for this date.</p>
                ) : (
                  <>
                  <div className="divide-y">
                    {pagedCourseAttendance.map((rec, idx) => (
                      <div key={rec.id} className="flex items-center gap-4 px-4 py-3">
                        <span className="text-xs text-muted-foreground w-6 text-right">{(stuPage - 1) * PAGE_SIZE + idx + 1}</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{rec.studentName}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {rec.markedByName && <p className="text-xs text-muted-foreground">By {rec.markedByName}</p>}
                            {rec.markedAt && <p className="text-xs text-muted-foreground">· {fmtDateTime(rec.markedAt)}</p>}
                          </div>
                        </div>
                        {(rec.method === 'face' || rec.method === 'fingerprint') && (
                          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">
                            {rec.method === 'face'
                              ? <><Camera className="h-3 w-3" />Face</>
                              : <><Fingerprint className="h-3 w-3" />Fingerprint</>}
                          </span>
                        )}
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[rec.status] ?? 'bg-muted text-muted-foreground'}`}>
                          {rec.status.charAt(0).toUpperCase() + rec.status.slice(1)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <Paginator page={stuPage} total={courseAttendance.length} onChange={setStuPage} />
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ── Settings Tab ── */}
      {activeTab === 'settings' && (
        <Card className="max-w-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />Attendance Time Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Clock In Time</label>
              <input
                type="time"
                value={settingEdits['SHIFT_START_TIME'] ?? ''}
                onChange={e => setSettingEdits(prev => ({ ...prev, SHIFT_START_TIME: e.target.value }))}
                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Clock Out Time</label>
              <input
                type="time"
                value={settingEdits['SHIFT_END_TIME'] ?? ''}
                onChange={e => setSettingEdits(prev => ({ ...prev, SHIFT_END_TIME: e.target.value }))}
                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Grace Period (minutes)</label>
              <input
                type="number"
                min={0}
                value={settingEdits['LATE_GRACE_MINUTES'] ?? ''}
                onChange={e => setSettingEdits(prev => ({ ...prev, LATE_GRACE_MINUTES: e.target.value }))}
                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
              />
            </div>
            <Button className="w-full" onClick={async () => {
              setSettingMsg('');
              for (const key of ['SHIFT_START_TIME', 'SHIFT_END_TIME', 'LATE_GRACE_MINUTES']) {
                if (settingEdits[key] !== undefined) {
                  await mutation<any>(UPDATE_SETTING_MUTATION, { key, value: settingEdits[key] }, token).catch(() => null);
                }
              }
              setSettingMsg('Saved successfully');
            }}>
              Save
            </Button>
            {settingMsg && <p className="text-sm text-center text-green-700">{settingMsg}</p>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/lib/auth-context';
import { query } from '@/lib/graphql';
import { BookOpen, Calendar, Clock, MapPin, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

const PAGE_SIZE = 5;

function Paginator({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) {
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20">
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
// GraphQL
// ---------------------------------------------------------------------------
const STAFF_PROFILE_QUERY = `
  query StaffProfile($userId: ID!) {
    staffByUser(userId: $userId) { id }
  }
`;

const STAFF_TIMETABLE_QUERY = `
  query StaffTimetable($teacherId: ID, $semesterId: ID) {
    timetable(teacherId: $teacherId, semesterId: $semesterId) {
      id classGroup dayOfWeek startTime endTime room semesterName
      subject { id name course_code }
    }
    semesters { id name academic_year status }
  }
`;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
const DAY_LABELS: Record<string, string> = {
  monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
  thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday',
};

const SUBJECT_COLORS = [
  { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200', dot: 'bg-blue-500' },
  { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200', dot: 'bg-green-500' },
  { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200', dot: 'bg-purple-500' },
  { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200', dot: 'bg-orange-500' },
  { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-200', dot: 'bg-pink-500' },
  { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-200', dot: 'bg-teal-500' },
  { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200', dot: 'bg-amber-500' },
  { bg: 'bg-cyan-100', text: 'text-cyan-800', border: 'border-cyan-200', dot: 'bg-cyan-500' },
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface TimetableSlot {
  id: string; classGroup: string; dayOfWeek: string;
  startTime: string; endTime: string; room: string | null; semesterName: string;
  subject: { id: string; name: string; course_code: string };
}
interface Semester { id: string; name: string; academic_year: string; status: string; }

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function StaffTimetablePage() {
  const { token, user } = useAuth();
  const [staffId, setStaffId] = useState<string | null>(null);
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedSemester, setSelectedSemester] = useState('');
  const [activeDay, setActiveDay] = useState<string>('monday');
  const [loading, setLoading] = useState(true);
  const [slotsPage, setSlotsPage] = useState(1);

  // Step 1: resolve staff record ID
  useEffect(() => {
    if (!user || !token) return;
    query<any>(STAFF_PROFILE_QUERY, { userId: user.id }, token)
      .then(res => { if (res.staffByUser) setStaffId(res.staffByUser.id); })
      .catch(() => {});
  }, [user, token]);

  // Step 2: fetch timetable
  useEffect(() => {
    if (!staffId || !token) return;
    setLoading(true);
    query<{ timetable: TimetableSlot[]; semesters: Semester[] }>(
      STAFF_TIMETABLE_QUERY,
      { teacherId: staffId, semesterId: selectedSemester || undefined },
      token
    ).then(data => {
      setSlots(data.timetable ?? []);
      if (data.semesters) {
        setSemesters(data.semesters);
        if (!selectedSemester) {
          const active = data.semesters.find(s => s.status === 'active');
          if (active) setSelectedSemester(active.id);
        }
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [staffId, selectedSemester, token]);

  // Reset slots page when active day changes
  useEffect(() => { setSlotsPage(1); }, [activeDay]);

  // ---------------------------------------------------------------------------
  // Derived
  // ---------------------------------------------------------------------------
  // Consistent color per subject
  const subjectColorMap: Record<string, typeof SUBJECT_COLORS[number]> = {};
  let colorIdx = 0;
  slots.forEach(s => {
    if (!subjectColorMap[s.subject.id]) {
      subjectColorMap[s.subject.id] = SUBJECT_COLORS[colorIdx % SUBJECT_COLORS.length];
      colorIdx++;
    }
  });

  const slotsByDay = DAYS.reduce<Record<string, TimetableSlot[]>>((acc, day) => {
    acc[day] = slots
      .filter(s => s.dayOfWeek === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
    return acc;
  }, {});

  const daySlots = slotsByDay[activeDay] ?? [];
  const pagedSlots = daySlots.slice((slotsPage - 1) * PAGE_SIZE, slotsPage * PAGE_SIZE);

  const uniqueSubjects = [...new Map(slots.map(s => [s.subject.id, s.subject])).values()];
  const uniqueGroups = [...new Set(slots.map(s => s.classGroup))];

  // Which days have slots (to show indicator)
  const busyDays = new Set(slots.map(s => s.dayOfWeek));

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Teaching Schedule</h1>
          <p className="text-muted-foreground">Your weekly timetable for the selected semester</p>
        </div>
        <Select value={selectedSemester} onValueChange={setSelectedSemester}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Select semester" />
          </SelectTrigger>
          <SelectContent>
            {semesters.map(s => (
              <SelectItem key={s.id} value={s.id}>{s.name} — {s.academic_year}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ── Stats ── */}
      {!loading && slots.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-5 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{uniqueSubjects.length}</p>
                <p className="text-xs text-muted-foreground">Subjects</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{uniqueGroups.length}</p>
                <p className="text-xs text-muted-foreground">Class groups</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                <Clock className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{slots.length}</p>
                <p className="text-xs text-muted-foreground">Periods / week</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Subject legend ── */}
      {!loading && uniqueSubjects.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {uniqueSubjects.map(sub => {
            const c = subjectColorMap[sub.id];
            return (
              <span
                key={sub.id}
                className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${c.bg} ${c.text} ${c.border}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
                {sub.name}
                <span className="opacity-60 font-mono">{sub.course_code}</span>
              </span>
            );
          })}
        </div>
      )}

      {/* ── Day tabs + content ── */}
      {loading ? (
        <div className="border rounded-lg overflow-hidden">
          <div className="flex bg-muted/40 border-b">
            {DAYS.map(d => <div key={d} className="flex-1 h-11 bg-muted/30 animate-pulse m-1 rounded" />)}
          </div>
          <div className="p-6 space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-14 bg-muted rounded animate-pulse" />)}
          </div>
        </div>
      ) : slots.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No schedule assigned</h3>
            <p className="text-muted-foreground text-sm max-w-xs">
              Your teaching timetable will appear here once the admin has set it up for this semester.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          {/* Tab strip */}
          <div className="flex overflow-x-auto bg-muted/40 border-b">
            {DAYS.map(day => {
              const count = slotsByDay[day].length;
              const isBusy = busyDays.has(day);
              return (
                <button
                  key={day}
                  onClick={() => setActiveDay(day)}
                  className={`flex-shrink-0 flex flex-col items-center px-5 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeDay === day
                      ? 'border-primary text-primary bg-background'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/60'
                  }`}
                >
                  <span>{DAY_LABELS[day]}</span>
                  {isBusy ? (
                    <span className={`mt-0.5 text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                      activeDay === day
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {count} period{count !== 1 ? 's' : ''}
                    </span>
                  ) : (
                    <span className="mt-0.5 text-xs text-muted-foreground/50">free</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Day content */}
          {daySlots.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-background">
              <div className="h-12 w-12 rounded-full bg-muted/60 flex items-center justify-center mb-3">
                <Clock className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No classes on {DAY_LABELS[activeDay]}</p>
              <p className="text-xs text-muted-foreground mt-1">Enjoy your free day!</p>
            </div>
          ) : (
            <>
              <div className="bg-background divide-y">
                {pagedSlots.map((slot, idx) => {
                  const c = subjectColorMap[slot.subject.id];
                  const periodNum = (slotsPage - 1) * PAGE_SIZE + idx + 1;
                  return (
                    <div key={slot.id} className="flex items-stretch">
                      {/* Time column */}
                      <div className="w-24 flex-shrink-0 flex flex-col items-center justify-center px-3 py-4 bg-muted/20 border-r">
                        <span className="text-sm font-semibold tabular-nums">{slot.startTime}</span>
                        <div className="my-1 w-px h-3 bg-muted-foreground/30" />
                        <span className="text-sm text-muted-foreground tabular-nums">{slot.endTime}</span>
                      </div>

                      {/* Color accent bar */}
                      <div className={`w-1 flex-shrink-0 ${c?.dot ?? 'bg-muted'}`} />

                      {/* Slot info */}
                      <div className="flex-1 flex items-center gap-4 px-4 py-3 flex-wrap">
                        <div className="min-w-0">
                          <p className="font-semibold text-sm">{slot.subject.name}</p>
                          <p className="text-xs font-mono text-muted-foreground">{slot.subject.course_code}</p>
                        </div>

                        <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${c?.bg} ${c?.text} ${c?.border}`}>
                          <Users className="h-3 w-3" />
                          {slot.classGroup}
                        </div>

                        {slot.room && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5" />
                            {slot.room}
                          </div>
                        )}
                      </div>

                      {/* Period number */}
                      <div className="flex-shrink-0 flex items-center px-4">
                        <span className="text-xs text-muted-foreground/50 font-medium">P{periodNum}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <Paginator page={slotsPage} total={daySlots.length} onChange={setSlotsPage} />
            </>
          )}
        </div>
      )}
    </div>
  );
}

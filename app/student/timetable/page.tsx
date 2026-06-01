'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/lib/auth-context';
import { query } from '@/lib/graphql';
import { BookOpen, Calendar, Clock, MapPin, User, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

// ---------------------------------------------------------------------------
// GraphQL
// ---------------------------------------------------------------------------
const STUDENT_PROFILE_QUERY = `
  query StudentProfile($userId: ID!) {
    studentByUser(userId: $userId) { id grade_level section }
  }
`;

const TIMETABLE_QUERY = `
  query StudentTimetable($semesterId: ID) {
    timetable(semesterId: $semesterId) {
      id classGroup dayOfWeek startTime endTime room semesterName
      subject { id name course_code }
      teacher { id user { first_name last_name } }
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
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface TimetableSlot {
  id: string; classGroup: string; dayOfWeek: string;
  startTime: string; endTime: string; room: string | null; semesterName: string;
  subject: { id: string; name: string; course_code: string };
  teacher: { id: string; user: { first_name: string; last_name: string } } | null;
}
interface Semester { id: string; name: string; academic_year: string; status: string; }

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function StudentTimetablePage() {
  const { token, user } = useAuth();
  const [gradeLevel, setGradeLevel] = useState('');
  const [section, setSection] = useState('');
  const [allSlots, setAllSlots] = useState<TimetableSlot[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [activeDay, setActiveDay] = useState<string>('monday');
  const [loading, setLoading] = useState(true);

  // Step 1: get student grade_level
  useEffect(() => {
    if (!user || !token) return;
    query<any>(STUDENT_PROFILE_QUERY, { userId: user.id }, token)
      .then(res => {
        const p = res.studentByUser;
        if (p?.grade_level) setGradeLevel(p.grade_level);
        if (p?.section) setSection(p.section);
      })
      .catch(() => {});
  }, [user, token]);

  // Step 2: fetch all timetable slots
  useEffect(() => {
    if (!token) return;
    setLoading(true);
    query<{ timetable: TimetableSlot[]; semesters: Semester[] }>(
      TIMETABLE_QUERY,
      { semesterId: selectedSemester || undefined },
      token
    ).then(data => {
      setAllSlots(data.timetable ?? []);
      if (data.semesters) {
        setSemesters(data.semesters);
        if (!selectedSemester) {
          const active = data.semesters.find(s => s.status === 'active');
          if (active) setSelectedSemester(active.id);
        }
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [selectedSemester, token]);

  // Available class groups
  const classGroups = [...new Set(allSlots.map(s => s.classGroup))].sort();

  // Auto-match grade_level + section → class group
  // e.g. grade_level="Form 3" section="A" → tries "Form 3A", "Form 3 A", then grade_level prefix
  useEffect(() => {
    if (!selectedGroup && gradeLevel && classGroups.length > 0) {
      const combined = section ? `${gradeLevel}${section}` : '';
      const combinedSpace = section ? `${gradeLevel} ${section}` : '';
      const match =
        classGroups.find(g => combined && g.toLowerCase() === combined.toLowerCase()) ??
        classGroups.find(g => combinedSpace && g.toLowerCase() === combinedSpace.toLowerCase()) ??
        classGroups.find(g => g.toLowerCase().startsWith(gradeLevel.toLowerCase()));
      if (match) setSelectedGroup(match);
    }
  }, [classGroups.join(','), gradeLevel, section]);

  const slots = selectedGroup
    ? allSlots.filter(s => s.classGroup === selectedGroup)
    : allSlots;

  // Color per subject
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
  const busyDays = new Set(slots.map(s => s.dayOfWeek));
  const uniqueSubjects = [...new Map(slots.map(s => [s.subject.id, s.subject])).values()];

  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Timetable</h1>
          <p className="text-muted-foreground">Your weekly class schedule</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select value={selectedSemester} onValueChange={setSelectedSemester}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Select semester" /></SelectTrigger>
            <SelectContent>
              {semesters.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.name} — {s.academic_year}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {classGroups.length > 0 && (
            <Select value={selectedGroup || 'all'} onValueChange={v => setSelectedGroup(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-44"><SelectValue placeholder="My class group" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All groups</SelectItem>
                {classGroups.map(g => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
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
              <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                <Clock className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{slots.length}</p>
                <p className="text-xs text-muted-foreground">Periods / week</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{busyDays.size}</p>
                <p className="text-xs text-muted-foreground">School days</p>
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
            {DAYS.map(d => <div key={d} className="flex-1 h-14 bg-muted/30 animate-pulse m-1 rounded" />)}
          </div>
          <div className="p-6 space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-16 bg-muted rounded animate-pulse" />)}
          </div>
        </div>
      ) : slots.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No timetable yet</h3>
            <p className="text-muted-foreground text-sm max-w-xs">
              {classGroups.length > 0
                ? 'Select your class group above to view your schedule.'
                : 'Your schedule will appear here once the admin publishes it for this semester.'}
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
                      {count} class{count !== 1 ? 'es' : ''}
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
            <div className="bg-background divide-y">
              {daySlots.map((slot, idx) => {
                const c = subjectColorMap[slot.subject.id];
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
                    <div className="flex-1 flex items-center gap-4 px-4 py-4 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm">{slot.subject.name}</p>
                        <p className="text-xs font-mono text-muted-foreground">{slot.subject.course_code}</p>
                      </div>

                      {!selectedGroup && (
                        <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${c?.bg} ${c?.text} ${c?.border}`}>
                          <Users className="h-3 w-3" />
                          {slot.classGroup}
                        </div>
                      )}

                      {slot.teacher && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <User className="h-3.5 w-3.5" />
                          {slot.teacher.user.first_name} {slot.teacher.user.last_name}
                        </div>
                      )}

                      {slot.room && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />
                          {slot.room}
                        </div>
                      )}
                    </div>

                    {/* Period badge */}
                    <div className="flex-shrink-0 flex items-center px-4">
                      <span className="text-xs text-muted-foreground/50 font-medium">P{idx + 1}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

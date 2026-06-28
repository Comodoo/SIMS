'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/lib/auth-context';
import { mutate, query } from '@/lib/graphql';
import { Calendar, Clock, LayoutGrid, List, MapPin, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';

// ---------------------------------------------------------------------------
// GraphQL
// ---------------------------------------------------------------------------
const TIMETABLE_ADMIN_QUERY = `
  query AdminTimetable($semesterId: ID) {
    timetable(semesterId: $semesterId) {
      id classGroup dayOfWeek startTime endTime room semesterName
      subject { id name course_code }
      teacher { id user { first_name last_name } }
    }
    courses { id name course_code status }
    semesters { id name academic_year status }
    staffMembers(isActive: true, limit: 200) {
      id staff_number user { first_name last_name }
    }
    classGroups { id name parentId }
  }
`;

const CREATE_SLOT_MUTATION = `
  mutation CreateTimetableSlot($input: TimetableInput!) {
    createTimetableSlot(input: $input) {
      success message
      slot { id }
    }
  }
`;

const UPDATE_SLOT_MUTATION = `
  mutation UpdateTimetableSlot($slotId: ID!, $input: TimetableInput!) {
    updateTimetableSlot(slotId: $slotId, input: $input) {
      success message
    }
  }
`;

const DELETE_SLOT_MUTATION = `
  mutation DeleteTimetableSlot($slotId: ID!) {
    deleteTimetableSlot(slotId: $slotId) {
      success message
    }
  }
`;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const;
const DAY_LABELS: Record<string, string> = {
  monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
  thursday: 'Thursday', friday: 'Friday',
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Slot {
  id: string; classGroup: string; dayOfWeek: string;
  startTime: string; endTime: string; room: string | null; semesterName: string;
  subject: { id: string; name: string; course_code: string };
  teacher: { id: string; user: { first_name: string; last_name: string } } | null;
}
interface Subject { id: string; name: string; course_code: string; status: string; }
interface Semester { id: string; name: string; academic_year: string; status: string; }
interface StaffMember { id: string; staff_number: string; user: { first_name: string; last_name: string }; }
interface ClassGroup { id: string; name: string; parentId: string | null; }

// A single row in the batch-create form
// classGroupLevel = selected parent level; classGroup = final value (sub-class or level)
interface SlotRow { classGroupLevel: string; classGroup: string; startTime: string; endTime: string; room: string; }

const emptyRow = (): SlotRow => ({ classGroupLevel: '', classGroup: '', startTime: '', endTime: '', room: '' });

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
export default function AdminTimetablePage() {
  const { token } = useAuth();

  // Data
  const [slots, setSlots] = useState<Slot[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [classGroupsData, setClassGroupsData] = useState<ClassGroup[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & view
  const [selectedSemester, setSelectedSemester] = useState('');
  const [filterGroup, setFilterGroup] = useState('all');
  const [activeDay, setActiveDay] = useState<string>('monday');
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [weekGroup, setWeekGroup] = useState('all');
  const [page, setPage] = useState(1);

  // Edit dialog (single slot)
  const [editOpen, setEditOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<Slot | null>(null);
  const [editForm, setEditForm] = useState({ subjectId: '', teacherId: '', classGroup: '', dayOfWeek: '', startTime: '', endTime: '', room: '' });
  const [editClassGroupLevel, setEditClassGroupLevel] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  // Batch-create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [batchSubjectId, setBatchSubjectId] = useState('');
  const [batchTeacherId, setBatchTeacherId] = useState('');
  const [batchDay, setBatchDay] = useState('');
  const [batchRows, setBatchRows] = useState<SlotRow[]>([emptyRow()]);
  const [batchSaving, setBatchSaving] = useState(false);
  const [batchError, setBatchError] = useState('');

  // ---------------------------------------------------------------------------
  async function load() {
    setLoading(true);
    try {
      const data = await query<{
        timetable: Slot[]; courses: Subject[]; semesters: Semester[];
        staffMembers: StaffMember[]; classGroups: ClassGroup[];
      }>(TIMETABLE_ADMIN_QUERY, { semesterId: selectedSemester || undefined }, token ?? undefined);
      setSlots(data.timetable ?? []);
      setSubjects((data.courses ?? []).filter(c => c.status === 'active'));
      setStaff(data.staffMembers ?? []);
      setClassGroupsData(data.classGroups ?? []);
      if (data.semesters) {
        setSemesters(data.semesters);
        if (!selectedSemester) {
          const active = data.semesters.find(s => s.status === 'active');
          if (active) setSelectedSemester(active.id);
        }
      }
    } catch { /* offline */ } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [selectedSemester, token]);

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------
  // Use backend class groups for filters; fall back to slot-derived list if empty
  const classGroups = classGroupsData.length > 0
    ? classGroupsData.map(g => g.name).sort()
    : [...new Set(slots.map(s => s.classGroup))].sort();

  const topLevelGroups = classGroupsData.filter(g => !g.parentId);
  const subsOf = (levelName: string): ClassGroup[] => {
    const parent = classGroupsData.find(g => g.name === levelName && !g.parentId);
    return parent ? classGroupsData.filter(g => g.parentId === parent.id) : [];
  };

  const visibleSlots = slots
    .filter(s => s.dayOfWeek === activeDay)
    .filter(s => filterGroup === 'all' || s.classGroup === filterGroup)
    .sort((a, b) => a.startTime.localeCompare(b.startTime) || a.classGroup.localeCompare(b.classGroup));

  useEffect(() => { setPage(1); }, [activeDay, filterGroup]);

  const pagedSlots = visibleSlots.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const dayCount = (day: string) =>
    slots.filter(s => s.dayOfWeek === day && (filterGroup === 'all' || s.classGroup === filterGroup)).length;

  // ---------------------------------------------------------------------------
  // Edit slot
  // ---------------------------------------------------------------------------
  function openEdit(slot: Slot) {
    setEditingSlot(slot);
    // Derive which level this classGroup belongs to
    const group = classGroupsData.find(g => g.name === slot.classGroup);
    const level = group?.parentId
      ? (classGroupsData.find(g => g.id === group.parentId)?.name ?? slot.classGroup)
      : slot.classGroup;
    setEditClassGroupLevel(level);
    setEditForm({
      subjectId: slot.subject.id,
      teacherId: slot.teacher?.id ?? '',
      classGroup: slot.classGroup,
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      room: slot.room ?? '',
    });
    setEditError('');
    setEditOpen(true);
  }

  async function handleEdit() {
    if (!editingSlot) return;
    setEditSaving(true); setEditError('');
    try {
      const res = await mutate<any>(UPDATE_SLOT_MUTATION, {
        slotId: editingSlot.id,
        input: {
          subjectId: editForm.subjectId,
          teacherId: editForm.teacherId,
          semesterId: selectedSemester,
          classGroup: editForm.classGroup,
          dayOfWeek: editForm.dayOfWeek,
          startTime: editForm.startTime,
          endTime: editForm.endTime,
          room: editForm.room || null,
        },
      }, token ?? undefined);
      if (!res.updateTimetableSlot?.success) { setEditError(res.updateTimetableSlot?.message || 'Update failed.'); return; }
      setEditOpen(false);
      await load();
    } catch (e: any) { setEditError(e?.message || 'Error.'); }
    finally { setEditSaving(false); }
  }

  // ---------------------------------------------------------------------------
  // Delete
  // ---------------------------------------------------------------------------
  async function handleDelete(slotId: string) {
    if (!confirm('Delete this timetable slot?')) return;
    await mutate(DELETE_SLOT_MUTATION, { slotId }, token ?? undefined).catch(() => {});
    await load();
  }

  // ---------------------------------------------------------------------------
  // Batch create
  // ---------------------------------------------------------------------------
  function openCreate() {
    setBatchSubjectId(''); setBatchTeacherId(''); setBatchDay(activeDay);
    setBatchRows([emptyRow()]); setBatchError('');
    setCreateOpen(true);
  }

  function addRow() { setBatchRows(r => [...r, emptyRow()]); }
  function removeRow(i: number) { setBatchRows(r => r.filter((_, idx) => idx !== i)); }
  function updateRow(i: number, field: keyof SlotRow, val: string) {
    setBatchRows(r => r.map((row, idx) => {
      if (idx !== i) return row;
      if (field === 'classGroupLevel') {
        // Auto-select the level itself when it has no sub-classes
        const subs = subsOf(val);
        return { ...row, classGroupLevel: val, classGroup: subs.length === 0 ? val : '' };
      }
      return { ...row, [field]: val };
    }));
  }

  async function handleBatchCreate() {
    const validRows = batchRows.filter(r => r.classGroup && r.startTime && r.endTime);
    if (!batchSubjectId || !batchTeacherId || !batchDay || validRows.length === 0) {
      setBatchError('Fill in subject, teacher, day, and at least one complete row.'); return;
    }
    setBatchSaving(true); setBatchError('');
    try {
      for (const row of validRows) {
        const res = await mutate<any>(CREATE_SLOT_MUTATION, {
          input: {
            subjectId: batchSubjectId,
            teacherId: batchTeacherId,
            semesterId: selectedSemester,
            classGroup: row.classGroup,
            dayOfWeek: batchDay,
            startTime: row.startTime,
            endTime: row.endTime,
            room: row.room || null,
          },
        }, token ?? undefined);
        if (!res.createTimetableSlot?.success) {
          setBatchError(`Row "${row.classGroup}": ${res.createTimetableSlot?.message || 'Failed.'}`);
          return;
        }
      }
      setCreateOpen(false);
      setActiveDay(batchDay);
      await load();
    } catch (e: any) { setBatchError(e?.message || 'Error.'); }
    finally { setBatchSaving(false); }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Timetable Builder</h1>
          <p className="text-muted-foreground">Create and manage class schedules by subject and group</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Slots
        </Button>
      </div>

      {/* ── Filters ── */}
      <div className="flex gap-3 flex-wrap items-center">
        <Select value={selectedSemester} onValueChange={setSelectedSemester}>
          <SelectTrigger className="w-52"><SelectValue placeholder="Semester" /></SelectTrigger>
          <SelectContent>
            {semesters.map(s => (
              <SelectItem key={s.id} value={s.id}>{s.name} — {s.academic_year}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {viewMode === 'day' && (
          <Select value={filterGroup} onValueChange={setFilterGroup}>
            <SelectTrigger className="w-44"><SelectValue placeholder="All class groups" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All groups</SelectItem>
              {topLevelGroups.map(parent => {
                const subs = subsOf(parent.name);
                return subs.length === 0 ? (
                  <SelectItem key={parent.id} value={parent.name}>{parent.name}</SelectItem>
                ) : (
                  <span key={parent.id}>
                    <SelectItem value={parent.name} className="font-semibold">{parent.name}</SelectItem>
                    {subs.map(s => (
                      <SelectItem key={s.id} value={s.name} className="pl-6">↳ {s.name}</SelectItem>
                    ))}
                  </span>
                );
              })}
            </SelectContent>
          </Select>
        )}

        {viewMode === 'week' && (
          <Select value={weekGroup} onValueChange={setWeekGroup}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Select class group" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All groups</SelectItem>
              {topLevelGroups.map(parent => {
                const subs = subsOf(parent.name);
                return subs.length === 0 ? (
                  <SelectItem key={parent.id} value={parent.name}>{parent.name}</SelectItem>
                ) : (
                  <span key={parent.id}>
                    <SelectItem value={parent.name} className="font-semibold">{parent.name}</SelectItem>
                    {subs.map(s => (
                      <SelectItem key={s.id} value={s.name} className="pl-6">↳ {s.name}</SelectItem>
                    ))}
                  </span>
                );
              })}
            </SelectContent>
          </Select>
        )}

        {/* View mode toggle */}
        <div className="ml-auto flex items-center gap-1 border rounded-lg p-1">
          <button
            onClick={() => setViewMode('day')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              viewMode === 'day' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <List className="h-3.5 w-3.5" />
            Day View
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              viewMode === 'week' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Week View
          </button>
        </div>
      </div>

      {/* ── Week view ── */}
      {viewMode === 'week' && (() => {
        const wSlots = weekGroup === 'all' ? slots : slots.filter(s => s.classGroup === weekGroup);
        // Derive unique time-bands sorted
        const timeBands = [...new Set(wSlots.map(s => `${s.startTime}|${s.endTime}`))]
          .sort()
          .map(t => { const [start, end] = t.split('|'); return { start, end }; });

        if (loading) return (
          <div className="border rounded-lg p-6 space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-12 bg-muted rounded animate-pulse" />)}
          </div>
        );

        if (wSlots.length === 0) return (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Calendar className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                {weekGroup === 'all' ? 'No slots yet — add slots using the button above.' : `No slots for ${weekGroup} yet.`}
              </p>
            </CardContent>
          </Card>
        );

        return (
          <div className="border rounded-lg overflow-auto">
            <table className="w-full text-sm border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="text-left px-4 py-3 font-semibold text-xs text-muted-foreground w-28 border-r">Time</th>
                  {DAYS.map(day => (
                    <th key={day} className="text-center px-3 py-3 font-semibold text-xs border-r last:border-r-0">
                      {DAY_LABELS[day]}
                      <span className="ml-1 text-muted-foreground font-normal">
                        ({wSlots.filter(s => s.dayOfWeek === day).length})
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeBands.map(({ start, end }) => (
                  <tr key={`${start}-${end}`} className="border-b last:border-b-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 border-r align-top">
                      <p className="font-semibold tabular-nums text-xs">{start}</p>
                      <p className="text-xs text-muted-foreground tabular-nums">– {end}</p>
                    </td>
                    {DAYS.map(day => {
                      const cell = wSlots.filter(s => s.dayOfWeek === day && s.startTime === start && s.endTime === end);
                      return (
                        <td key={day} className="px-2 py-2 border-r last:border-r-0 align-top min-w-[120px]">
                          {cell.length === 0 ? (
                            <span className="text-xs text-muted-foreground/30">—</span>
                          ) : (
                            <div className="space-y-1">
                              {cell.map(slot => (
                                <div key={slot.id} className="rounded-md border bg-card p-2 text-xs group relative">
                                  <p className="font-semibold truncate">{slot.subject.name}</p>
                                  <p className="font-mono text-muted-foreground text-[11px]">{slot.subject.course_code}</p>
                                  {weekGroup === 'all' && (
                                    <p className="text-primary font-medium text-[11px] mt-0.5">{slot.classGroup}</p>
                                  )}
                                  {slot.teacher && (
                                    <p className="text-muted-foreground text-[11px] truncate">
                                      {slot.teacher.user.first_name} {slot.teacher.user.last_name}
                                    </p>
                                  )}
                                  {slot.room && (
                                    <p className="text-muted-foreground text-[11px] flex items-center gap-0.5 mt-0.5">
                                      <MapPin className="h-2.5 w-2.5" />{slot.room}
                                    </p>
                                  )}
                                  {/* Hover actions */}
                                  <div className="absolute top-1 right-1 hidden group-hover:flex gap-0.5">
                                    <button
                                      onClick={() => openEdit(slot)}
                                      className="h-5 w-5 flex items-center justify-center rounded bg-background border hover:bg-muted"
                                    >
                                      <Pencil className="h-2.5 w-2.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDelete(slot.id)}
                                      className="h-5 w-5 flex items-center justify-center rounded bg-background border hover:text-destructive"
                                    >
                                      <Trash2 className="h-2.5 w-2.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })()}

      {/* ── Day tabs + table ── */}
      {viewMode === 'day' && (loading ? (
        <Card><CardContent className="p-6 space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="h-10 bg-muted rounded animate-pulse" />)}
        </CardContent></Card>
      ) : (
        <div className="space-y-0 border rounded-lg overflow-hidden">
          {/* Tab strip */}
          <div className="flex overflow-x-auto bg-muted/40 border-b">
            {DAYS.map(day => {
              const count = dayCount(day);
              return (
                <button
                  key={day}
                  onClick={() => setActiveDay(day)}
                  className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeDay === day
                      ? 'border-primary text-primary bg-background'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/60'
                  }`}
                >
                  {DAY_LABELS[day]}
                  {count > 0 && (
                    <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                      activeDay === day ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Table for active day */}
          {visibleSlots.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-background">
              <Calendar className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No slots for {DAY_LABELS[activeDay]}</p>
              <button
                className="mt-3 text-xs text-primary hover:underline"
                onClick={openCreate}
              >
                + Add slots for this day
              </button>
            </div>
          ) : (
            <div className="bg-background overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-14">Time</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Class Group</TableHead>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead className="w-20 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedSlots.map(slot => (
                    <TableRow key={slot.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {slot.startTime}<br />{slot.endTime}
                        </span>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-sm">{slot.subject.name}</p>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs text-muted-foreground">{slot.subject.course_code}</span>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          {slot.classGroup}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {slot.teacher
                          ? `${slot.teacher.user.first_name} ${slot.teacher.user.last_name}`
                          : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {slot.room
                          ? <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{slot.room}</span>
                          : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost" size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            onClick={() => openEdit(slot)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost" size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDelete(slot.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Paginator page={page} total={visibleSlots.length} onChange={setPage} />
            </div>
          )}
        </div>
      ))}

      {/* ── Batch Create Dialog ── */}
      <Dialog open={createOpen} onOpenChange={o => { setCreateOpen(o); if (!o) setBatchError(''); }}>
        <DialogContent className="!max-w-[95vw] w-[95vw] max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-xl">Add Timetable Slots</DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Pick a subject, teacher, and day — then add a row for each class group and time slot.
            </p>
          </DialogHeader>

          <div className="overflow-y-auto flex-1 pr-1 space-y-6 pt-3">
            {batchError && <p className="text-sm text-destructive bg-red-50 border border-red-200 rounded-lg px-4 py-2">{batchError}</p>}

            {/* Subject + Teacher + Day */}
            <div className="bg-muted/30 rounded-xl p-4 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Step 1 — Select Subject, Teacher &amp; Day</p>
              <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Subject *</Label>
                <Select value={batchSubjectId} onValueChange={setBatchSubjectId}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Select subject" /></SelectTrigger>
                  <SelectContent>
                    {subjects.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} — {s.course_code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Teacher *</Label>
                <Select value={batchTeacherId} onValueChange={setBatchTeacherId}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Select teacher" /></SelectTrigger>
                  <SelectContent>
                    {staff.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.user.first_name} {s.user.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Day *</Label>
                <Select value={batchDay} onValueChange={setBatchDay}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Select day" /></SelectTrigger>
                  <SelectContent>
                    {DAYS.map(d => <SelectItem key={d} value={d}>{DAY_LABELS[d]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            </div>

            {/* Class group + time rows */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Step 2 — Class Groups &amp; Time Slots</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Add one row per class group and time slot</p>
                </div>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">{batchRows.length} row{batchRows.length !== 1 ? 's' : ''}</span>
              </div>

              {/* Header row */}
              <div className="grid grid-cols-[minmax(140px,1fr)_minmax(140px,1fr)_120px_120px_120px_36px] gap-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">
                <span>Level *</span>
                <span>Class Group *</span>
                <span>Start Time *</span>
                <span>End Time *</span>
                <span>Room</span>
                <span />
              </div>

              {/* Data rows */}
              <div className="space-y-2">
                {batchRows.map((row, i) => {
                  const subs = subsOf(row.classGroupLevel);
                  return (
                    <div key={i} className="grid grid-cols-[minmax(140px,1fr)_minmax(140px,1fr)_120px_120px_120px_36px] gap-3 items-center bg-background rounded-lg border px-3 py-2">
                      {/* Step 1 — level */}
                      <Select value={row.classGroupLevel} onValueChange={v => updateRow(i, 'classGroupLevel', v)}>
                        <SelectTrigger className="h-10"><SelectValue placeholder="Level…" /></SelectTrigger>
                        <SelectContent>
                          {topLevelGroups.map(g => (
                            <SelectItem key={g.id} value={g.name}>{g.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {/* Step 2 — sub-class (or level itself when no subs) */}
                      <Select
                        value={row.classGroup}
                        onValueChange={v => updateRow(i, 'classGroup', v)}
                        disabled={!row.classGroupLevel}
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder={!row.classGroupLevel ? '—' : subs.length === 0 ? row.classGroupLevel : 'Class…'} />
                        </SelectTrigger>
                        <SelectContent>
                          {row.classGroupLevel && (
                            subs.length === 0 ? (
                              <SelectItem value={row.classGroupLevel}>{row.classGroupLevel}</SelectItem>
                            ) : (
                              <>
                                <SelectItem value={row.classGroupLevel}>All — {row.classGroupLevel}</SelectItem>
                                {subs.map(g => (
                                  <SelectItem key={g.id} value={g.name}>{g.name}</SelectItem>
                                ))}
                              </>
                            )
                          )}
                        </SelectContent>
                      </Select>
                      <Input
                        type="time"
                        value={row.startTime}
                        onChange={e => updateRow(i, 'startTime', e.target.value)}
                        className="h-10"
                      />
                      <Input
                        type="time"
                        value={row.endTime}
                        onChange={e => updateRow(i, 'endTime', e.target.value)}
                        className="h-10"
                      />
                      <Input
                        placeholder="Room 12"
                        value={row.room}
                        onChange={e => updateRow(i, 'room', e.target.value)}
                        className="h-10"
                      />
                      <button
                        type="button"
                        onClick={() => removeRow(i)}
                        disabled={batchRows.length === 1}
                        className="h-8 w-8 flex items-center justify-center rounded hover:bg-muted disabled:opacity-30 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={addRow}
                className="flex items-center gap-1.5 text-sm text-primary hover:underline mt-1"
              >
                <Plus className="h-3.5 w-3.5" />
                Add another row
              </button>
            </div>
          </div>

          <div className="flex gap-2 pt-3 border-t flex-shrink-0">
            <Button
              className="flex-1"
              onClick={handleBatchCreate}
              disabled={batchSaving || !batchSubjectId || !batchTeacherId || !batchDay}
            >
              {batchSaving
                ? 'Creating…'
                : `Create ${batchRows.filter(r => r.classGroup && r.startTime && r.endTime).length || ''} Slot${batchRows.filter(r => r.classGroup && r.startTime && r.endTime).length !== 1 ? 's' : ''}`}
            </Button>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Edit Dialog (single slot) ── */}
      <Dialog open={editOpen} onOpenChange={o => { setEditOpen(o); if (!o) setEditError(''); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Timetable Slot</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {editError && <p className="text-sm text-destructive">{editError}</p>}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Subject</Label>
                <Select value={editForm.subjectId} onValueChange={v => setEditForm(p => ({ ...p, subjectId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Subject" /></SelectTrigger>
                  <SelectContent>
                    {subjects.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name} — {s.course_code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Teacher</Label>
                <Select value={editForm.teacherId} onValueChange={v => setEditForm(p => ({ ...p, teacherId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Teacher" /></SelectTrigger>
                  <SelectContent>
                    {staff.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.user.first_name} {s.user.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Two-step class group picker */}
            <div className="space-y-1">
              <Label>Class Group</Label>
              <div className="grid grid-cols-2 gap-2">
                {/* Step 1 — level */}
                <Select
                  value={editClassGroupLevel}
                  onValueChange={level => {
                    setEditClassGroupLevel(level);
                    const subs = subsOf(level);
                    setEditForm(p => ({ ...p, classGroup: subs.length === 0 ? level : '' }));
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Level…" /></SelectTrigger>
                  <SelectContent>
                    {topLevelGroups.map(g => (
                      <SelectItem key={g.id} value={g.name}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* Step 2 — sub-class */}
                <Select
                  value={editForm.classGroup}
                  onValueChange={v => setEditForm(p => ({ ...p, classGroup: v }))}
                  disabled={!editClassGroupLevel}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={!editClassGroupLevel ? '—' : subsOf(editClassGroupLevel).length === 0 ? editClassGroupLevel : 'Class…'} />
                  </SelectTrigger>
                  <SelectContent>
                    {editClassGroupLevel && (
                      subsOf(editClassGroupLevel).length === 0 ? (
                        <SelectItem value={editClassGroupLevel}>{editClassGroupLevel}</SelectItem>
                      ) : (
                        <>
                          <SelectItem value={editClassGroupLevel}>All — {editClassGroupLevel}</SelectItem>
                          {subsOf(editClassGroupLevel).map(g => (
                            <SelectItem key={g.id} value={g.name}>{g.name}</SelectItem>
                          ))}
                        </>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label>Day</Label>
              <Select value={editForm.dayOfWeek} onValueChange={v => setEditForm(p => ({ ...p, dayOfWeek: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DAYS.map(d => <SelectItem key={d} value={d}>{DAY_LABELS[d]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Start</Label>
                <Input type="time" value={editForm.startTime} onChange={e => setEditForm(p => ({ ...p, startTime: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>End</Label>
                <Input type="time" value={editForm.endTime} onChange={e => setEditForm(p => ({ ...p, endTime: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Room</Label>
                <Input
                  placeholder="optional"
                  value={editForm.room}
                  onChange={e => setEditForm(p => ({ ...p, room: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                className="flex-1"
                onClick={handleEdit}
                disabled={editSaving || !editForm.subjectId || !editForm.classGroup || !editForm.startTime || !editForm.endTime}
              >
                {editSaving ? 'Saving…' : 'Save Changes'}
              </Button>
              <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

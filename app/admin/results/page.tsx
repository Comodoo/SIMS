'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/lib/auth-context';
import { query } from '@/lib/graphql';
import { Award, BookOpen, TrendingUp, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const ADMIN_RESULTS_QUERY = `
  query AdminResults($semesterId: ID, $subjectId: ID, $gradeLevel: String, $academicYear: String) {
    resultCards(semesterId: $semesterId, subjectId: $subjectId, gradeLevel: $gradeLevel, academicYear: $academicYear) {
      id
      semesterName
      cat1Score
      cat2Score
      examScore
      totalScore
      gradeLetter
      remarks
      computedAt
      student { id student_number first_name last_name grade_level }
      subject { id name course_code }
    }
    courses { id name course_code status }
    semesters { id name academic_year status }
    classGroups { id name parentId }
  }
`;

const GRADE_COLORS: Record<string, string> = {
  A: 'bg-green-100 text-green-800 border-green-200',
  B: 'bg-blue-100 text-blue-800 border-blue-200',
  C: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  D: 'bg-orange-100 text-orange-800 border-orange-200',
  E: 'bg-red-100 text-red-800 border-red-200',
  F: 'bg-red-200 text-red-900 border-red-300',
};

interface ResultCard {
  id: string; semesterName: string;
  cat1Score: number | null; cat2Score: number | null; examScore: number | null;
  totalScore: number | null; gradeLetter: string | null; remarks: string | null; computedAt: string;
  student: { id: string; student_number: string; first_name: string; last_name: string; grade_level: string | null };
  subject: { id: string; name: string; course_code: string };
}
interface Course { id: string; name: string; course_code: string; status: string; }
interface Semester { id: string; name: string; academic_year: string; status: string; }
interface ClassGroup { id: string; name: string; parentId: string | null; }

function fmt(v: number | null) { return v !== null ? Number(v).toFixed(1) : '—'; }

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------
const PAGE_SIZE = 15;

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

export default function AdminResultsPage() {
  const { token } = useAuth();

  const [results, setResults] = useState<ResultCard[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [classGroups, setClassGroups] = useState<ClassGroup[]>([]);

  // Filters
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedSubClass, setSelectedSubClass] = useState('');

  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Derived class group lists
  const topLevelGroups = useMemo(() => classGroups.filter(g => !g.parentId), [classGroups]);
  const subClassesOfLevel = useMemo(
    () => selectedLevel ? classGroups.filter(g => g.parentId != null && classGroups.find(p => p.name === selectedLevel && p.id === g.parentId)) : [],
    [classGroups, selectedLevel]
  );

  // Unique academic years from semesters
  const academicYears = useMemo(
    () => [...new Set(semesters.map(s => s.academic_year))].sort().reverse(),
    [semesters]
  );

  // Semesters filtered by selected year
  const filteredSemesters = useMemo(
    () => selectedYear ? semesters.filter(s => s.academic_year === selectedYear) : semesters,
    [semesters, selectedYear]
  );

  // The grade level name to send to backend — prefer sub-class if selected, else level
  const gradeLevelFilter = selectedSubClass || selectedLevel || '';

  async function load() {
    setLoading(true);
    try {
      const data = await query<{
        resultCards: ResultCard[];
        courses: Course[];
        semesters: Semester[];
        classGroups: ClassGroup[];
      }>(
        ADMIN_RESULTS_QUERY,
        {
          semesterId: selectedSemester || undefined,
          subjectId: selectedSubject || undefined,
          gradeLevel: gradeLevelFilter || undefined,
          academicYear: (!selectedSemester && selectedYear) ? selectedYear : undefined,
        },
        token ?? undefined
      );

      setResults(data.resultCards ?? []);
      setCourses((data.courses ?? []).filter(c => c.status === 'active'));
      setClassGroups(data.classGroups ?? []);

      if (data.semesters) {
        setSemesters(data.semesters);
        if (!selectedSemester && !selectedYear) {
          const active = data.semesters.find(s => s.status === 'active');
          if (active) {
            setSelectedYear(active.academic_year);
            setSelectedSemester(active.id);
          }
        }
      }
    } catch {/* offline */} finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [selectedSemester, selectedSubject, selectedLevel, selectedSubClass, selectedYear, token]);
  useEffect(() => { setPage(1); }, [selectedSemester, selectedSubject, selectedLevel, selectedSubClass, selectedYear]);

  // When year changes, clear semester if it's no longer in the filtered list
  useEffect(() => {
    if (selectedSemester && selectedYear) {
      const sem = semesters.find(s => s.id === selectedSemester);
      if (sem && sem.academic_year !== selectedYear) {
        setSelectedSemester('');
      }
    }
  }, [selectedYear]);

  // When level changes, clear sub-class
  useEffect(() => {
    setSelectedSubClass('');
  }, [selectedLevel]);

  const pagedResults = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const avg = results.length
    ? results.reduce((s, r) => s + (r.totalScore ?? 0), 0) / results.length
    : null;
  const passed = results.filter(r => r.gradeLetter && !['F', 'E'].includes(r.gradeLetter)).length;
  const uniqueStudents = new Set(results.map(r => r.student.id)).size;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Results Overview</h1>
        <p className="text-muted-foreground">View all student result cards — filter by year, class, and subject</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-primary" />
            <div><p className="text-2xl font-bold">{loading ? '—' : results.length}</p><p className="text-xs text-muted-foreground">Result cards</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-500" />
            <div><p className="text-2xl font-bold">{loading ? '—' : uniqueStudents}</p><p className="text-xs text-muted-foreground">Students</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-green-500" />
            <div><p className="text-2xl font-bold">{loading ? '—' : avg !== null ? avg.toFixed(1) : '—'}</p><p className="text-xs text-muted-foreground">Average score</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <Award className="h-8 w-8 text-amber-500" />
            <div><p className="text-2xl font-bold">{loading ? '—' : results.length ? `${passed}/${results.length}` : '—'}</p><p className="text-xs text-muted-foreground">Passed</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Academic Year */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Year</p>
            <Select
              value={selectedYear || 'all'}
              onValueChange={v => { setSelectedYear(v === 'all' ? '' : v); setSelectedSemester(''); }}
            >
              <SelectTrigger><SelectValue placeholder="All years" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All years</SelectItem>
                {academicYears.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Semester */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Semester</p>
            <Select
              value={selectedSemester || 'all'}
              onValueChange={v => setSelectedSemester(v === 'all' ? '' : v)}
            >
              <SelectTrigger><SelectValue placeholder="All semesters" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All semesters</SelectItem>
                {filteredSemesters.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Class Level */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Class Level</p>
            <Select
              value={selectedLevel || 'all'}
              onValueChange={v => setSelectedLevel(v === 'all' ? '' : v)}
            >
              <SelectTrigger><SelectValue placeholder="All levels" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All levels</SelectItem>
                {topLevelGroups.map(g => <SelectItem key={g.id} value={g.name}>{g.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Sub-class */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Sub-class</p>
            <Select
              value={selectedSubClass || 'all'}
              onValueChange={v => setSelectedSubClass(v === 'all' ? '' : v)}
              disabled={!selectedLevel || subClassesOfLevel.length === 0}
            >
              <SelectTrigger><SelectValue placeholder={!selectedLevel ? 'Pick level first' : subClassesOfLevel.length === 0 ? 'No sub-classes' : 'All sub-classes'} /></SelectTrigger>
              {selectedLevel && subClassesOfLevel.length > 0 && (
                <SelectContent>
                  <SelectItem value="all">All sub-classes</SelectItem>
                  {subClassesOfLevel.map(g => <SelectItem key={g.id} value={g.name}>{g.name}</SelectItem>)}
                </SelectContent>
              )}
            </Select>
          </div>

          {/* Subject */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Subject</p>
            <Select
              value={selectedSubject || 'all'}
              onValueChange={v => setSelectedSubject(v === 'all' ? '' : v)}
            >
              <SelectTrigger><SelectValue placeholder="All subjects" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All subjects</SelectItem>
                {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Active filter chips */}
        {(selectedYear || selectedLevel || selectedSubClass || selectedSubject || selectedSemester) && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
            {selectedYear && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                Year: {selectedYear}
                <button onClick={() => { setSelectedYear(''); setSelectedSemester(''); }} className="ml-1 hover:text-destructive">×</button>
              </span>
            )}
            {selectedSemester && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                Semester: {semesters.find(s => s.id === selectedSemester)?.name}
                <button onClick={() => setSelectedSemester('')} className="ml-1 hover:text-destructive">×</button>
              </span>
            )}
            {selectedLevel && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                Level: {selectedLevel}
                <button onClick={() => setSelectedLevel('')} className="ml-1 hover:text-destructive">×</button>
              </span>
            )}
            {selectedSubClass && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                Class: {selectedSubClass}
                <button onClick={() => setSelectedSubClass('')} className="ml-1 hover:text-destructive">×</button>
              </span>
            )}
            {selectedSubject && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                Subject: {courses.find(c => c.id === selectedSubject)?.name}
                <button onClick={() => setSelectedSubject('')} className="ml-1 hover:text-destructive">×</button>
              </span>
            )}
          </div>
        )}
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span>All Result Cards</span>
            {!loading && results.length > 0 && (
              <span className="text-xs font-normal text-muted-foreground">{results.length} record{results.length !== 1 ? 's' : ''}</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-10 bg-muted rounded animate-pulse" />)}</div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Award className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-1">No results found</h3>
              <p className="text-muted-foreground text-sm max-w-xs">
                {selectedLevel || selectedSubClass || selectedYear
                  ? 'No result cards match the selected filters. Try adjusting or clearing them.'
                  : 'Teachers submit results through the Staff Portal grade submissions page.'}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead className="text-center">CAT 1</TableHead>
                    <TableHead className="text-center">CAT 2</TableHead>
                    <TableHead className="text-center">Exam</TableHead>
                    <TableHead className="text-center">Total</TableHead>
                    <TableHead className="text-center">Grade</TableHead>
                    <TableHead>Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedResults.map(r => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <p className="font-medium">{r.student.first_name} {r.student.last_name}</p>
                        <p className="text-xs text-muted-foreground">{r.student.student_number}</p>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">{r.student.grade_level ?? '—'}</span>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-sm">{r.subject.name}</p>
                        <p className="text-xs text-muted-foreground">{r.subject.course_code}</p>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.semesterName}</TableCell>
                      <TableCell className="text-center">{fmt(r.cat1Score)}</TableCell>
                      <TableCell className="text-center">{fmt(r.cat2Score)}</TableCell>
                      <TableCell className="text-center">{fmt(r.examScore)}</TableCell>
                      <TableCell className="text-center font-semibold">{fmt(r.totalScore)}</TableCell>
                      <TableCell className="text-center">
                        {r.gradeLetter ? (
                          <Badge className={`font-bold ${GRADE_COLORS[r.gradeLetter] ?? ''}`}>{r.gradeLetter}</Badge>
                        ) : '—'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.remarks ?? '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Paginator page={page} total={results.length} onChange={setPage} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

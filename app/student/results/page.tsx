'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/lib/auth-context';
import { query } from '@/lib/graphql';
import {
  Award, BookOpen, CheckCircle2, ChevronDown, ChevronRight,
  ClipboardList, FileText, TrendingUp,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

// ---------------------------------------------------------------------------
// GraphQL
// ---------------------------------------------------------------------------
const STUDENT_PROFILE_Q = `
  query StudentProfile($userId: ID!) {
    studentByUser(userId: $userId) { id student_number grade_level }
  }
`;

const RESULTS_Q = `
  query StudentResults($studentId: ID!, $semesterId: ID) {
    resultCards(studentId: $studentId, semesterId: $semesterId) {
      id semesterId semesterName
      cat1Score cat2Score examScore totalScore gradeLetter remarks computedAt
      subject { id name course_code }
    }
    submissions(studentId: $studentId, limit: 500) {
      id status grade feedback submittedAt
      assignment { id title assignmentType totalMarks course { id } }
    }
    semesters {
      id name academic_year status
    }
  }
`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ResultCard {
  id: string; semesterId: string; semesterName: string;
  cat1Score: number | null; cat2Score: number | null;
  examScore: number | null; totalScore: number | null;
  gradeLetter: string | null; remarks: string | null; computedAt: string;
  subject: { id: string; name: string; course_code: string };
}

interface Submission {
  id: string; status: string; grade: string | null; feedback: string | null;
  submittedAt: string;
  assignment: { id: string; title: string; assignmentType: string; totalMarks: number; course: { id: string } };
}

interface Semester { id: string; name: string; academic_year: string; status: string; }

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const GRADE_COLORS: Record<string, { bg: string; text: string }> = {
  A: { bg: 'bg-green-100', text: 'text-green-800' },
  B: { bg: 'bg-blue-100', text: 'text-blue-800' },
  C: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  D: { bg: 'bg-orange-100', text: 'text-orange-800' },
  E: { bg: 'bg-red-100', text: 'text-red-700' },
  F: { bg: 'bg-red-200', text: 'text-red-900' },
};

function fmt(v: number | null | undefined) {
  return v != null ? Number(v).toFixed(1) : '—';
}

function ScoreBar({ value, max = 100 }: { value: number | null; max?: number }) {
  if (value == null) return <div className="h-1.5 rounded-full bg-muted w-full" />;
  const pct = Math.min(100, (Number(value) / max) * 100);
  const color = pct >= 70 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="h-1.5 rounded-full bg-muted w-full overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function TypeBadge({ type }: { type: string }) {
  const cls =
    type === 'exam' ? 'bg-red-100 text-red-700' :
    type === 'quiz' ? 'bg-yellow-100 text-yellow-700' :
    type === 'project' ? 'bg-purple-100 text-purple-700' :
    'bg-blue-100 text-blue-700';
  return <span className={`text-[11px] capitalize px-1.5 py-0.5 rounded-sm font-medium ${cls}`}>{type}</span>;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function StudentResultsPage() {
  const { token, user } = useAuth();
  const [studentId, setStudentId] = useState<string | null>(null);
  const [results, setResults] = useState<ResultCard[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [expandedSubjectId, setExpandedSubjectId] = useState<string | null>(null);

  // Step 1: get student profile → student ID
  useEffect(() => {
    if (!user || !token) return;
    query<any>(STUDENT_PROFILE_Q, { userId: user.id }, token)
      .then(res => {
        const profile = res.studentByUser;
        if (profile) setStudentId(profile.id);
        else setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user, token]);

  // Step 2: once we have studentId, fetch results
  useEffect(() => {
    if (!studentId || !token) return;
    setLoading(true);
    query<any>(RESULTS_Q, {
      studentId,
      semesterId: selectedSemester || undefined,
    }, token)
      .then(data => {
        setResults(data.resultCards ?? []);
        setSubmissions(data.submissions ?? []);
        setSemesters(data.semesters ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [studentId, selectedSemester, token]);

  // Map: course.id → submissions[]
  const submissionsByCourse = useMemo(() => {
    const map: Record<string, Submission[]> = {};
    submissions.forEach(s => {
      const cid = s.assignment.course.id;
      if (!map[cid]) map[cid] = [];
      map[cid].push(s);
    });
    return map;
  }, [submissions]);

  const avg = results.length
    ? results.reduce((sum, r) => sum + Number(r.totalScore ?? 0), 0) / results.length
    : null;
  const passed = results.filter(r => r.gradeLetter && !['F', 'E'].includes(r.gradeLetter)).length;
  const graded = submissions.filter(s => s.status === 'graded').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Results</h1>
          <p className="text-muted-foreground">Academic performance overview per subject and semester</p>
        </div>
        <Select
          value={selectedSemester || 'all'}
          onValueChange={v => setSelectedSemester(v === 'all' ? '' : v)}
        >
          <SelectTrigger className="w-56">
            <SelectValue placeholder="All semesters" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Semesters</SelectItem>
            {semesters.map(s => (
              <SelectItem key={s.id} value={s.id}>
                {s.name} — {s.academic_year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary stats */}
      {!loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <BookOpen className="h-8 w-8 text-primary flex-shrink-0" />
                <div>
                  <p className="text-2xl font-bold">{results.length}</p>
                  <p className="text-xs text-muted-foreground">Subjects</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-blue-500 flex-shrink-0" />
                <div>
                  <p className="text-2xl font-bold">{avg !== null ? avg.toFixed(1) : '—'}</p>
                  <p className="text-xs text-muted-foreground">Avg Score</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <Award className="h-8 w-8 text-green-500 flex-shrink-0" />
                <div>
                  <p className="text-2xl font-bold">{passed}/{results.length}</p>
                  <p className="text-xs text-muted-foreground">Passed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <ClipboardList className="h-8 w-8 text-purple-500 flex-shrink-0" />
                <div>
                  <p className="text-2xl font-bold">{graded}</p>
                  <p className="text-xs text-muted-foreground">Graded Tasks</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Subject result cards */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />)}
        </div>
      ) : results.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Award className="h-14 w-14 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-1">No results yet</h3>
          <p className="text-sm text-muted-foreground">
            Your results will appear here after your teacher enters your scores.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {results.map(r => {
            const isExpanded = expandedSubjectId === r.subject.id;
            const courseSubs = submissionsByCourse[r.subject.id] ?? [];
            const gc = GRADE_COLORS[r.gradeLetter ?? ''];

            return (
              <Card key={r.id} className={isExpanded ? 'ring-1 ring-primary/20' : ''}>
                {/* Clickable header */}
                <button
                  className="w-full text-left"
                  onClick={() => setExpandedSubjectId(isExpanded ? null : r.subject.id)}
                >
                  <CardHeader className="pb-0">
                    <div className="flex items-start gap-3">
                      {isExpanded
                        ? <ChevronDown className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                        : <ChevronRight className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                      }
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-base">{r.subject.name}</CardTitle>
                          <span className="text-xs text-muted-foreground font-mono">{r.subject.course_code}</span>
                          <span className="text-xs text-muted-foreground">· {r.semesterName}</span>
                        </div>

                        {/* Score row */}
                        <div className="flex items-center gap-4 mt-3 flex-wrap">
                          {[
                            { label: 'CAT 1', value: r.cat1Score },
                            { label: 'CAT 2', value: r.cat2Score },
                            { label: 'Exam', value: r.examScore },
                          ].map(({ label, value }) => (
                            <div key={label} className="flex flex-col items-center min-w-[56px]">
                              <p className="text-xs text-muted-foreground">{label}</p>
                              <p className="text-sm font-semibold">{fmt(value)}</p>
                              <ScoreBar value={value} />
                            </div>
                          ))}

                          <div className="flex flex-col items-center min-w-[64px]">
                            <p className="text-xs text-muted-foreground">Total</p>
                            <p className="text-base font-bold">{fmt(r.totalScore)}</p>
                            <ScoreBar value={r.totalScore} />
                          </div>

                          {r.gradeLetter && (
                            <div className={`flex items-center justify-center h-10 w-10 rounded-full ${gc?.bg ?? 'bg-muted'} ${gc?.text ?? ''} font-black text-lg ml-auto flex-shrink-0`}>
                              {r.gradeLetter}
                            </div>
                          )}
                        </div>

                        {r.remarks && (
                          <p className="text-xs text-muted-foreground mt-2 pb-3 italic">{r.remarks}</p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </button>

                {/* Expanded: CA breakdown from submissions */}
                {isExpanded && (
                  <CardContent className="border-t pt-4 mt-2 space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                      <ClipboardList className="h-3.5 w-3.5" />
                      Assignments &amp; Quizzes
                    </p>

                    {courseSubs.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No graded submissions for this subject.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {courseSubs.map(sub => (
                          <div key={sub.id} className="rounded-lg border px-3 py-2.5 flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                              {sub.status === 'graded'
                                ? <CheckCircle2 className="h-4 w-4 text-green-600" />
                                : <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/40" />
                              }
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">{sub.assignment.title}</p>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                <TypeBadge type={sub.assignment.assignmentType} />
                                <span className="text-xs text-muted-foreground">
                                  {sub.assignment.totalMarks} marks
                                </span>
                                {sub.status === 'graded' && sub.grade && (
                                  <span className="text-xs font-bold text-primary">
                                    {sub.grade} / {sub.assignment.totalMarks}
                                  </span>
                                )}
                              </div>
                              {sub.feedback && (
                                <div className="mt-1.5 flex items-start gap-1.5 text-xs text-muted-foreground">
                                  <FileText className="h-3 w-3 flex-shrink-0 mt-0.5" />
                                  <span className="italic">{sub.feedback}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex-shrink-0 text-right">
                              {sub.status === 'graded' ? (
                                <Badge className="text-xs bg-green-100 text-green-700 border-green-200">Graded</Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">
                                  {sub.status === 'submitted' ? 'Pending' : sub.status}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

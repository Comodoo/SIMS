'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/lib/auth-context';
import { mutate, query } from '@/lib/graphql';
import {
  AlertCircle, Award, BookOpen, CheckCircle, ChevronDown, ChevronRight,
  ClipboardList, Edit, ExternalLink, FileText, Loader2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

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
const STAFF_PROFILE_Q = `
  query StaffProfile($userId: ID!) {
    staffByUser(userId: $userId) { id staff_number position }
  }
`;

const GRADING_INIT_Q = `
  query GradingInit($staffId: ID!) {
    subjectTeachers(teacherId: $staffId) {
      id subjectId subjectName isPrimary
    }
    semesters {
      id name academic_year status
    }
  }
`;

const SUBJECT_DATA_Q = `
  query SubjectData($courseId: ID!, $subjectId: ID!) {
    enrollments(courseId: $courseId, limit: 500) {
      id status
      student {
        id student_number grade_level
        user { id first_name last_name }
      }
    }
    resultCards(subjectId: $subjectId) {
      id semesterId semesterName
      cat1Score cat2Score examScore totalScore gradeLetter remarks computedAt
      student { id }
    }
    assignments(courseId: $courseId, limit: 200) {
      id title assignmentType dueDate totalMarks isPublished
    }
  }
`;

const SUBMISSIONS_Q = `
  query SubjectSubmissions($assignmentId: ID!) {
    submissions(assignmentId: $assignmentId, limit: 500) {
      id status grade feedback submittedAt fileUrl fileType contentText
      student { id }
      assignment { id title totalMarks }
    }
  }
`;

const COMPUTE_RESULT_MUTATION = `
  mutation ComputeResult($input: ResultCardInput!, $computedById: ID!) {
    computeResultCard(input: $input, computedById: $computedById) {
      success message
      result {
        id semesterId semesterName cat1Score cat2Score examScore totalScore gradeLetter remarks computedAt
        student { id }
      }
    }
  }
`;

const GRADE_SUBMISSION_MUTATION = `
  mutation GradeSubmission($input: GradeSubmissionInput!) {
    gradeSubmission(input: $input) {
      success message
      submission { id status grade feedback }
    }
  }
`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface SubjectTeacher { id: string; subjectId: string; subjectName: string; isPrimary: boolean; }
interface Semester { id: string; name: string; academic_year: string; status: string; }
interface StudentInfo { id: string; student_number: string; grade_level: string; user: { id: string; first_name: string; last_name: string }; }
interface Enrollment { id: string; status: string; student: StudentInfo; }
interface ResultCard {
  id: string; semesterId: string; semesterName: string;
  cat1Score: number | null; cat2Score: number | null; examScore: number | null;
  totalScore: number | null; gradeLetter: string | null; remarks: string | null;
  computedAt: string; student: { id: string };
}
interface Assignment { id: string; title: string; assignmentType: string; dueDate: string; totalMarks: number; isPublished: boolean; }
interface Submission {
  id: string; status: string; grade: string | null; feedback: string | null;
  submittedAt: string; fileUrl: string | null; fileType: string | null; contentText: string | null;
  student: { id: string };
  assignment: { id: string; title: string; totalMarks: number };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const GRADE_COLORS: Record<string, string> = {
  A: 'bg-green-100 text-green-700 border-green-200',
  B: 'bg-blue-100 text-blue-700 border-blue-200',
  C: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  D: 'bg-orange-100 text-orange-700 border-orange-200',
  E: 'bg-red-100 text-red-700 border-red-200',
  F: 'bg-red-200 text-red-900 border-red-300',
};

function fmt(v: number | null | undefined) {
  return v != null ? Number(v).toFixed(1) : '—';
}

function TypeBadge({ type }: { type: string }) {
  const cls =
    type === 'exam' ? 'bg-red-100 text-red-700' :
    type === 'quiz' ? 'bg-yellow-100 text-yellow-700' :
    type === 'project' ? 'bg-purple-100 text-purple-700' :
    'bg-blue-100 text-blue-700';
  return <span className={`text-xs capitalize px-2 py-0.5 rounded-sm font-medium ${cls}`}>{type}</span>;
}

// ---------------------------------------------------------------------------
// Score Entry Dialog (CAT1 / CAT2 / Exam)
// ---------------------------------------------------------------------------
function ScoreDialog({
  open, onClose, student, subjectId, staffId, semesters, existing, token, onSaved,
}: {
  open: boolean; onClose: () => void;
  student: StudentInfo | null; subjectId: string; staffId: string;
  semesters: Semester[]; existing: ResultCard | null;
  token: string; onSaved: (rc: ResultCard) => void;
}) {
  const [cat1, setCat1] = useState('');
  const [cat2, setCat2] = useState('');
  const [exam, setExam] = useState('');
  const [cat1Max, setCat1Max] = useState('20');
  const [cat2Max, setCat2Max] = useState('20');
  const [examMax, setExamMax] = useState('60');
  const [remarks, setRemarks] = useState('');
  const [semesterId, setSemesterId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setCat1(existing?.cat1Score != null ? String(existing.cat1Score) : '');
      setCat2(existing?.cat2Score != null ? String(existing.cat2Score) : '');
      setExam(existing?.examScore != null ? String(existing.examScore) : '');
      setCat1Max('20');
      setCat2Max('20');
      setExamMax('60');
      setRemarks(existing?.remarks ?? '');
      setSemesterId(
        existing?.semesterId ??
        semesters.find(s => s.status === 'active')?.id ??
        semesters[0]?.id ?? ''
      );
      setError('');
    }
  }, [open, existing, semesters]);

  if (!student) return null;

  async function save() {
    if (!semesterId) { setError('Select a semester.'); return; }
    setSaving(true); setError('');
    try {
      const res = await mutate<any>(COMPUTE_RESULT_MUTATION, {
        input: {
          studentId: student!.id,
          subjectId,
          semesterId,
          cat1Score: cat1 !== '' ? parseFloat(cat1) : null,
          cat2Score: cat2 !== '' ? parseFloat(cat2) : null,
          examScore: exam !== '' ? parseFloat(exam) : null,
          remarks: remarks || null,
        },
        computedById: staffId,
      }, token);
      if (res.computeResultCard?.success) {
        onSaved(res.computeResultCard.result);
        onClose();
      } else {
        setError(res.computeResultCard?.message ?? 'Failed to save.');
      }
    } catch (e: any) {
      setError(e?.message ?? 'Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  const totalMax = (parseFloat(cat1Max) || 0) + (parseFloat(cat2Max) || 0) + (parseFloat(examMax) || 0);
  const totalScore = (parseFloat(cat1) || 0) + (parseFloat(cat2) || 0) + (parseFloat(exam) || 0);
  const hasAnyScore = cat1 !== '' || cat2 !== '' || exam !== '';

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Enter Scores</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {student.user.first_name} {student.user.last_name} · {student.student_number}
          </p>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Semester</Label>
            <Select value={semesterId} onValueChange={setSemesterId}>
              <SelectTrigger><SelectValue placeholder="Select semester" /></SelectTrigger>
              <SelectContent>
                {semesters.map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} — {s.academic_year}
                    {s.status === 'active' && ' (Active)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Weight configuration */}
          <div className="rounded-lg bg-muted/30 border p-3 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Mark allocation (max marks per component)
            </p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'CAT 1 max', value: cat1Max, set: setCat1Max },
                { label: 'CAT 2 max', value: cat2Max, set: setCat2Max },
                { label: 'Exam max', value: examMax, set: setExamMax },
              ].map(({ label, value, set }) => (
                <div key={label} className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">{label}</Label>
                  <Input
                    type="number" min="0" max="100" step="1"
                    value={value}
                    onChange={e => set(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground">
              Total = CAT 1 + CAT 2 + Exam. Must add up to 100 (currently {totalMax}).
            </p>
          </div>

          {/* Actual scores */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'CAT 1', sub: `/ ${cat1Max}`, value: cat1, set: setCat1, max: cat1Max },
              { label: 'CAT 2', sub: `/ ${cat2Max}`, value: cat2, set: setCat2, max: cat2Max },
              { label: 'Exam',  sub: `/ ${examMax}`, value: exam,  set: setExam,  max: examMax },
            ].map(({ label, sub, value, set, max }) => (
              <div key={label} className="space-y-1.5">
                <Label className="text-xs">
                  {label} <span className="text-muted-foreground font-normal">{sub}</span>
                </Label>
                <Input
                  type="number" min="0" max={parseFloat(max) || 100} step="0.5"
                  placeholder="—"
                  value={value}
                  onChange={e => set(e.target.value)}
                />
              </div>
            ))}
          </div>

          {/* Total preview */}
          {hasAnyScore && (
            <div className="rounded-lg border p-3 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Total score <span className="text-[11px]">(CAT1 + CAT2 + Exam)</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-xl">{totalScore.toFixed(1)}</span>
                <span className="text-muted-foreground text-sm"> / {totalMax}</span>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Remarks (optional)</Label>
            <Textarea
              placeholder="e.g. Good performance, needs improvement in exam…"
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4" /> {error}
            </p>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button className="flex-1" onClick={save} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {saving ? 'Saving…' : 'Save Scores'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Grade Submission Dialog
// ---------------------------------------------------------------------------
function GradeSubmissionDialog({
  submission, token, onClose, onSaved,
}: {
  submission: Submission | null; token: string;
  onClose: () => void; onSaved: (s: Submission) => void;
}) {
  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (submission) {
      setGrade(submission.grade ?? '');
      setFeedback(submission.feedback ?? '');
      setError('');
    }
  }, [submission]);

  if (!submission) return null;

  async function save() {
    if (!grade.trim()) { setError('Enter a grade.'); return; }
    setSaving(true); setError('');
    try {
      const res = await mutate<any>(GRADE_SUBMISSION_MUTATION, {
        input: { submissionId: submission!.id, grade: grade.trim(), feedback: feedback.trim() || null },
      }, token);
      if (res.gradeSubmission?.success) {
        onSaved({ ...submission!, grade: grade.trim(), feedback: feedback.trim() || null, status: 'graded' });
        onClose();
      } else {
        setError(res.gradeSubmission?.message ?? 'Failed to grade.');
      }
    } catch (e: any) {
      setError(e?.message ?? 'Failed to grade.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={!!submission} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Grade Submission</DialogTitle>
          <p className="text-sm text-muted-foreground">{submission.assignment.title}</p>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 space-y-4 pr-1">
          {submission.contentText && (
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1">
                <FileText className="h-3 w-3" /> Student's Written Response
              </p>
              <div className="rounded-lg border bg-muted/20 p-3 text-sm whitespace-pre-wrap max-h-40 overflow-y-auto">
                {submission.contentText}
              </div>
            </div>
          )}

          {submission.fileUrl && (
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5">Submitted File</p>
              <a
                href={submission.fileUrl}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <ExternalLink className="h-4 w-4" />
                {submission.fileType?.toUpperCase() ?? 'File'} — Open / Download
              </a>
            </div>
          )}

          {!submission.contentText && !submission.fileUrl && (
            <p className="text-sm text-muted-foreground italic">No submission content to review.</p>
          )}

          <div className="border-t pt-3 space-y-3">
            <div className="space-y-1.5">
              <Label>
                Grade
                <span className="ml-1 text-muted-foreground font-normal text-xs">
                  (out of {submission.assignment.totalMarks} marks)
                </span>
              </Label>
              <Input
                type="number" min="0" max={submission.assignment.totalMarks} step="0.5"
                placeholder={`0 – ${submission.assignment.totalMarks}`}
                value={grade}
                onChange={e => setGrade(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Feedback to student (optional)</Label>
              <Textarea
                placeholder="Comments visible to the student…"
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4" /> {error}
            </p>
          )}
        </div>

        <div className="flex gap-2 pt-4 border-t flex-shrink-0">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button className="flex-1" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save Grade'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function StaffGradingPage() {
  const { user, token } = useAuth();
  const [staffProfile, setStaffProfile] = useState<{ id: string; staff_number: string; position: string } | null>(null);
  const [subjects, setSubjects] = useState<SubjectTeacher[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [resultCards, setResultCards] = useState<ResultCard[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissionsMap, setSubmissionsMap] = useState<Record<string, Submission[]>>({});

  const [loading, setLoading] = useState(true);
  const [subjectLoading, setSubjectLoading] = useState(false);
  const [tab, setTab] = useState<'gradebook' | 'submissions'>('gradebook');
  const [expandedAssignmentId, setExpandedAssignmentId] = useState<string | null>(null);
  const [gradePage, setGradePage] = useState(1);
  const [assignPage, setAssignPage] = useState(1);
  const [subPages, setSubPages] = useState<Record<string, number>>({});

  const [scoreDialogStudent, setScoreDialogStudent] = useState<StudentInfo | null>(null);
  const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(null);

  // ----- init -----
  useEffect(() => {
    if (!user || !token) return;
    (async () => {
      try {
        const profileRes = await query<any>(STAFF_PROFILE_Q, { userId: user.id }, token);
        const profile = profileRes.staffByUser;
        if (!profile) { setLoading(false); return; }
        setStaffProfile(profile);

        const initRes = await query<any>(GRADING_INIT_Q, { staffId: profile.id }, token);
        const subs: SubjectTeacher[] = initRes.subjectTeachers ?? [];
        setSubjects(subs);
        setSemesters(initRes.semesters ?? []);
        if (subs.length > 0) setSelectedSubjectId(subs[0].subjectId);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [user, token]);

  // Reset pagination when subject changes
  useEffect(() => { setGradePage(1); setAssignPage(1); }, [selectedSubjectId]);

  // ----- load subject data -----
  useEffect(() => {
    if (!selectedSubjectId || !token) return;
    setSubjectLoading(true);
    setEnrollments([]); setResultCards([]); setAssignments([]);
    setSubmissionsMap({}); setExpandedAssignmentId(null);

    query<any>(SUBJECT_DATA_Q, { courseId: selectedSubjectId, subjectId: selectedSubjectId }, token)
      .then(data => {
        setEnrollments(data.enrollments ?? []);
        setResultCards(data.resultCards ?? []);
        setAssignments(data.assignments ?? []);
      })
      .catch(console.error)
      .finally(() => setSubjectLoading(false));
  }, [selectedSubjectId, token]);

  // ----- load submissions for an assignment on expand -----
  async function loadSubmissions(assignmentId: string) {
    if (submissionsMap[assignmentId] !== undefined) return;
    try {
      const res = await query<any>(SUBMISSIONS_Q, { assignmentId }, token ?? undefined);
      setSubmissionsMap(prev => ({ ...prev, [assignmentId]: res.submissions ?? [] }));
    } catch { /* ignore */ }
  }

  function toggleAssignment(id: string) {
    const next = expandedAssignmentId === id ? null : id;
    setExpandedAssignmentId(next);
    if (next) loadSubmissions(next);
  }

  const resultCardMap = useMemo(
    () => new Map(resultCards.map(rc => [rc.student.id, rc])),
    [resultCards]
  );

  const selectedSubject = subjects.find(s => s.subjectId === selectedSubjectId);
  const activeStudents = enrollments.filter(e => e.status === 'active');

  const pendingCount = Object.values(submissionsMap)
    .flat()
    .filter(s => s.status === 'submitted').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex gap-6 min-h-0">
      {/* ---- Subject sidebar ---- */}
      <aside className="w-52 flex-shrink-0 space-y-1">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-2 pb-2">
          My Subjects
        </p>
        {subjects.length === 0 ? (
          <p className="text-sm text-muted-foreground px-2">No subjects assigned.</p>
        ) : subjects.map(s => (
          <button
            key={s.subjectId}
            onClick={() => setSelectedSubjectId(s.subjectId)}
            className={`w-full text-left rounded-lg px-3 py-2.5 text-sm transition-colors ${
              selectedSubjectId === s.subjectId
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted text-foreground'
            }`}
          >
            <p className="font-medium leading-snug">{s.subjectName}</p>
            {s.isPrimary && (
              <span className={`text-[10px] ${selectedSubjectId === s.subjectId ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                Primary teacher
              </span>
            )}
          </button>
        ))}
      </aside>

      {/* ---- Main ---- */}
      <div className="flex-1 min-w-0 space-y-4">
        {!selectedSubject ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Select a subject from the left to start grading.</p>
          </div>
        ) : (
          <>
            <div>
              <h1 className="text-xl font-bold">{selectedSubject.subjectName}</h1>
              <p className="text-sm text-muted-foreground">
                {activeStudents.length} student{activeStudents.length !== 1 ? 's' : ''} ·
                {' '}{assignments.length} assignment{assignments.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Tabs */}
            <div className="flex rounded-lg border overflow-hidden w-fit">
              {([
                { key: 'gradebook', label: 'Grade Book', icon: Award },
                { key: 'submissions', label: 'Submissions', icon: ClipboardList },
              ] as const).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-r last:border-r-0 ${
                    tab === key ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                  {key === 'submissions' && pendingCount > 0 && (
                    <span className="ml-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full px-1.5 py-0.5">
                      {pendingCount}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {subjectLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : tab === 'gradebook' ? (
              /* ======================================================= */
              /* GRADE BOOK                                               */
              /* ======================================================= */
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Award className="h-4 w-4" /> Student Score Sheet
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Enter CAT 1, CAT 2, and Exam scores. Total is computed as the average of entered scores.
                  </p>
                </CardHeader>
                <CardContent className="p-0">
                  {activeStudents.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-10">
                      No students enrolled in this subject.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="pl-6 w-10">#</TableHead>
                          <TableHead>Student</TableHead>
                          <TableHead className="text-center">CAT 1</TableHead>
                          <TableHead className="text-center">CAT 2</TableHead>
                          <TableHead className="text-center">Exam</TableHead>
                          <TableHead className="text-center">Total</TableHead>
                          <TableHead className="text-center">Grade</TableHead>
                          <TableHead className="text-center">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activeStudents.slice((gradePage - 1) * PAGE_SIZE, gradePage * PAGE_SIZE).map((e, idx) => {
                          const rc = resultCardMap.get(e.student.id);
                          const globalIdx = (gradePage - 1) * PAGE_SIZE + idx + 1;
                          return (
                            <TableRow key={e.id}>
                              <TableCell className="pl-6 text-muted-foreground text-xs">{globalIdx}</TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium text-sm">
                                    {e.student.user.first_name} {e.student.user.last_name}
                                  </p>
                                  <p className="text-xs text-muted-foreground font-mono">{e.student.student_number}</p>
                                </div>
                              </TableCell>
                              <TableCell className="text-center text-sm">{fmt(rc?.cat1Score)}</TableCell>
                              <TableCell className="text-center text-sm">{fmt(rc?.cat2Score)}</TableCell>
                              <TableCell className="text-center text-sm">{fmt(rc?.examScore)}</TableCell>
                              <TableCell className="text-center font-bold">{fmt(rc?.totalScore)}</TableCell>
                              <TableCell className="text-center">
                                {rc?.gradeLetter ? (
                                  <Badge className={`font-bold text-xs border ${GRADE_COLORS[rc.gradeLetter] ?? ''}`}>
                                    {rc.gradeLetter}
                                  </Badge>
                                ) : '—'}
                              </TableCell>
                              <TableCell className="text-center">
                                <Button
                                  size="sm" variant="outline"
                                  className="h-7 px-2.5 text-xs"
                                  onClick={() => setScoreDialogStudent(e.student)}
                                >
                                  <Edit className="h-3 w-3 mr-1" />
                                  {rc ? 'Edit' : 'Add'}
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                  {activeStudents.length > 0 && (
                    <Paginator page={gradePage} total={activeStudents.length} onChange={setGradePage} />
                  )}
                </CardContent>
              </Card>
            ) : (
              /* ======================================================= */
              /* SUBMISSIONS                                              */
              /* ======================================================= */
              <>
              <div className="space-y-2">
                {assignments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <ClipboardList className="h-12 w-12 text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No assignments for this subject yet.</p>
                  </div>
                ) : assignments.slice((assignPage - 1) * PAGE_SIZE, assignPage * PAGE_SIZE).map(a => {
                  const isExpanded = expandedAssignmentId === a.id;
                  const subs = submissionsMap[a.id];
                  const subPage = subPages[a.id] ?? 1;
                  const pagedSubs = subs ? subs.slice((subPage - 1) * PAGE_SIZE, subPage * PAGE_SIZE) : [];
                  const pending = subs?.filter(s => s.status === 'submitted').length ?? 0;
                  const graded = subs?.filter(s => s.status === 'graded').length ?? 0;

                  return (
                    <Card key={a.id} className={isExpanded ? 'ring-1 ring-primary/30' : ''}>
                      <button className="w-full text-left" onClick={() => toggleAssignment(a.id)}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center gap-3">
                            {isExpanded
                              ? <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              : <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            }
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm">{a.title}</p>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                <TypeBadge type={a.assignmentType} />
                                <span className="text-xs text-muted-foreground">
                                  Due {new Date(a.dueDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                                </span>
                                <span className="text-xs text-muted-foreground">{a.totalMarks} marks</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {subs !== undefined && (
                                <>
                                  {pending > 0 && (
                                    <Badge variant="destructive" className="text-xs">{pending} pending</Badge>
                                  )}
                                  <span className="text-xs text-muted-foreground">{graded} graded</span>
                                </>
                              )}
                              {!a.isPublished && (
                                <Badge variant="outline" className="text-xs">Draft</Badge>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                      </button>

                      {isExpanded && (
                        <CardContent className="pt-0 border-t">
                          {subs === undefined ? (
                            <div className="flex items-center justify-center py-8">
                              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            </div>
                          ) : subs.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-8">
                              No submissions yet for this assignment.
                            </p>
                          ) : (
                            <Table className="mt-2">
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Student</TableHead>
                                  <TableHead>Submitted At</TableHead>
                                  <TableHead>Content</TableHead>
                                  <TableHead className="text-center">Status</TableHead>
                                  <TableHead className="text-center">Grade</TableHead>
                                  <TableHead className="text-center">Action</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {pagedSubs.map(sub => {
                                  const enrollment = enrollments.find(e => e.student.id === sub.student.id);
                                  const name = enrollment
                                    ? `${enrollment.student.user.first_name} ${enrollment.student.user.last_name}`
                                    : sub.student.id;
                                  const no = enrollment?.student.student_number ?? '';

                                  return (
                                    <TableRow key={sub.id}>
                                      <TableCell>
                                        <p className="font-medium text-sm">{name}</p>
                                        <p className="text-xs text-muted-foreground font-mono">{no}</p>
                                      </TableCell>
                                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                        {new Date(sub.submittedAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                                      </TableCell>
                                      <TableCell className="text-xs text-muted-foreground">
                                        {sub.contentText ? '✏️ Text' : ''}
                                        {sub.fileUrl ? ` 📎 ${sub.fileType?.toUpperCase() ?? 'File'}` : ''}
                                        {!sub.contentText && !sub.fileUrl ? '—' : ''}
                                      </TableCell>
                                      <TableCell className="text-center">
                                        {sub.status === 'graded' ? (
                                          <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-sm font-medium">
                                            <CheckCircle className="h-3 w-3" /> Graded
                                          </span>
                                        ) : (
                                          <span className="text-xs text-orange-700 bg-orange-100 px-2 py-0.5 rounded-sm font-medium">
                                            Pending
                                          </span>
                                        )}
                                      </TableCell>
                                      <TableCell className="text-center font-semibold text-sm">
                                        {sub.grade != null ? `${sub.grade} / ${a.totalMarks}` : '—'}
                                      </TableCell>
                                      <TableCell className="text-center">
                                        <Button
                                          size="sm" variant="outline"
                                          className="h-7 px-2.5 text-xs"
                                          onClick={() => setGradingSubmission(sub)}
                                        >
                                          <Edit className="h-3 w-3 mr-1" />
                                          {sub.grade ? 'Edit' : 'Grade'}
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          )}
                          {subs && subs.length > PAGE_SIZE && (
                            <Paginator
                              page={subPage}
                              total={subs.length}
                              onChange={p => setSubPages(prev => ({ ...prev, [a.id]: p }))}
                            />
                          )}
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>
              {assignments.length > 0 && (
                <Paginator page={assignPage} total={assignments.length} onChange={setAssignPage} />
              )}
              </>
            )}
          </>
        )}
      </div>

      {/* ---- Dialogs ---- */}
      {staffProfile && selectedSubjectId && token && (
        <ScoreDialog
          open={!!scoreDialogStudent}
          onClose={() => setScoreDialogStudent(null)}
          student={scoreDialogStudent}
          subjectId={selectedSubjectId}
          staffId={staffProfile.id}
          semesters={semesters}
          existing={scoreDialogStudent ? (resultCardMap.get(scoreDialogStudent.id) ?? null) : null}
          token={token}
          onSaved={rc => {
            setResultCards(prev => {
              const idx = prev.findIndex(r => r.student.id === rc.student.id);
              if (idx === -1) return [...prev, rc];
              const next = [...prev];
              next[idx] = { ...prev[idx], ...rc };
              return next;
            });
          }}
        />
      )}

      <GradeSubmissionDialog
        submission={gradingSubmission}
        token={token ?? ''}
        onClose={() => setGradingSubmission(null)}
        onSaved={updated => {
          setSubmissionsMap(prev => {
            const aid = updated.assignment.id;
            const list = prev[aid] ?? [];
            return { ...prev, [aid]: list.map(s => s.id === updated.id ? updated : s) };
          });
        }}
      />
    </div>
  );
}

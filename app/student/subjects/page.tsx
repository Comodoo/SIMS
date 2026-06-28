'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/lib/auth-context';
import { mutate, query } from '@/lib/graphql';
import {
  AlertCircle, BookOpen, Calendar, CheckCircle, CheckCircle2,
  ChevronDown, ChevronRight, ClipboardList, Download,
  ExternalLink, FileText, GraduationCap, Paperclip, Search,
  Send, Star, UploadCloud, X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

// ---------------------------------------------------------------------------
// GraphQL
// ---------------------------------------------------------------------------
const STUDENT_PROFILE_QUERY = `
  query StudentProfile($userId: ID!) {
    studentByUser(userId: $userId) {
      id
      student_number
      grade_level
      academic_year
    }
  }
`;

const SUBJECTS_DATA_QUERY = `
  query SubjectsData($studentId: ID!) {
    classGroups { id name parentId }
    courses(limit: 200) {
      id name course_code status semester academic_year credits department class_group
    }
    enrollments(studentId: $studentId, limit: 200) {
      id status semester academic_year course { id }
    }
    assignments(isPublished: true, limit: 500) {
      id title description assignmentType dueDate totalMarks
      isPublished isOverdue attachmentUrl attachmentType course { id }
    }
    submissions(studentId: $studentId, limit: 500) {
      id
      status
      contentText
      fileUrl
      fileType
      grade
      feedback
      submittedAt
      gradedAt
      assignment { id }
    }
  }
`;

const SUBMIT_MUTATION = `
  mutation SubmitAssignment($input: SubmissionInput!) {
    submitAssignment(input: $input) {
      success
      message
      submission {
        id
        status
        contentText
        fileUrl
        fileType
        submittedAt
        assignment { id }
      }
    }
  }
`;

const ENROLL_MUTATION = `
  mutation EnrollStudent($input: EnrollmentInput!) {
    enrollStudent(input: $input) {
      success
      message
    }
  }
`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Course {
  id: string; name: string; course_code: string; status: string;
  semester: string; academic_year: string; credits: number; department: string;
  class_group?: string | null;
}

interface Enrollment {
  id: string; status: string; semester: string; academic_year: string;
  course: { id: string };
}

interface Assignment {
  id: string; title: string; description: string | null;
  assignmentType: string; dueDate: string; totalMarks: number;
  isPublished: boolean; isOverdue: boolean;
  attachmentUrl: string | null; attachmentType: string | null;
  course: { id: string };
}

interface Submission {
  id: string; status: string; contentText: string | null;
  fileUrl: string | null; fileType: string | null;
  grade: string | null; feedback: string | null;
  submittedAt: string; gradedAt: string | null;
  assignment: { id: string };
}

// ---------------------------------------------------------------------------
// Pager — always visible when items exist
// ---------------------------------------------------------------------------
const PAGE_SIZE = 5;

function Pager({ page, total, onChange }: {
  page: number; total: number; onChange: (p: number) => void;
}) {
  if (total === 0) return null;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const from = (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);
  return (
    <div className="flex items-center justify-between py-2 px-1 text-xs text-muted-foreground border-t mt-2">
      <span>Showing {from}–{to} of {total}</span>
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            className="h-6 w-6 rounded border flex items-center justify-center disabled:opacity-40 hover:bg-muted transition-colors"
            disabled={page === 1}
            onClick={() => onChange(page - 1)}
          >‹</button>
          <span className="px-2 font-medium text-foreground">{page} / {totalPages}</span>
          <button
            className="h-6 w-6 rounded border flex items-center justify-center disabled:opacity-40 hover:bg-muted transition-colors"
            disabled={page === totalPages}
            onClick={() => onChange(page + 1)}
          >›</button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Assignment type badge
// ---------------------------------------------------------------------------
function TypeBadge({ type }: { type: string }) {
  const cls =
    type === 'exam' ? 'bg-red-100 text-red-700' :
    type === 'quiz' ? 'bg-yellow-100 text-yellow-700' :
    type === 'project' ? 'bg-purple-100 text-purple-700' :
    'bg-blue-100 text-blue-700';
  return <span className={`text-xs capitalize px-2 py-0.5 rounded-sm font-medium ${cls}`}>{type}</span>;
}

// ---------------------------------------------------------------------------
// Submission status badge
// ---------------------------------------------------------------------------
function SubStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    submitted:    { label: 'Submitted', cls: 'bg-green-100 text-green-700' },
    graded:       { label: 'Graded',    cls: 'bg-primary/10 text-primary' },
    late:         { label: 'Late',      cls: 'bg-orange-100 text-orange-700' },
    resubmitted:  { label: 'Resubmitted', cls: 'bg-yellow-100 text-yellow-700' },
  };
  const s = map[status] ?? { label: status, cls: 'bg-muted text-muted-foreground' };
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-sm ${s.cls}`}>{s.label}</span>;
}

// ---------------------------------------------------------------------------
// Assignment Detail Dialog
// ---------------------------------------------------------------------------
function AssignmentDetailDialog({
  assignment, courseName, submission, onClose,
}: {
  assignment: Assignment | null; courseName: string;
  submission: Submission | null; onClose: () => void;
}) {
  if (!assignment) return null;
  const dueDate = new Date(assignment.dueDate);
  const isValidDate = !isNaN(dueDate.getTime());

  return (
    <Dialog open={!!assignment} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="leading-snug pr-6">{assignment.title}</DialogTitle>
          <p className="text-xs text-muted-foreground font-mono">{courseName}</p>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 space-y-5 pr-1">
          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Type</p>
              <TypeBadge type={assignment.assignmentType} />
            </div>
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Total Marks</p>
              <p className="text-sm font-bold">{assignment.totalMarks}</p>
            </div>
            <div className={`rounded-lg border p-3 col-span-2 ${assignment.isOverdue ? 'bg-red-50 border-red-200' : 'bg-muted/30'}`}>
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1 flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Due Date & Time
              </p>
              <div className="flex items-center gap-2">
                <p className={`text-sm font-semibold ${assignment.isOverdue ? 'text-red-700' : ''}`}>
                  {isValidDate ? dueDate.toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' }) : '—'}
                </p>
                {assignment.isOverdue && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                    <AlertCircle className="h-3 w-3" /> Overdue
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div>
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-2 flex items-center gap-1">
              <FileText className="h-3 w-3" /> Instructions
            </p>
            {assignment.description ? (
              <div className="rounded-lg border bg-muted/20 p-4 text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {assignment.description}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">No instructions provided.</p>
            )}
          </div>

          {/* Attachment */}
          <div>
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-2 flex items-center gap-1">
              <Paperclip className="h-3 w-3" /> Attachment / Resources
            </p>
            {assignment.attachmentUrl ? (
              <a
                href={assignment.attachmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg border bg-primary/5 hover:bg-primary/10 transition-colors p-3 group"
              >
                <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Download className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-primary truncate">
                    {assignment.attachmentType ? `${assignment.attachmentType.toUpperCase()} File` : 'Download File'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{assignment.attachmentUrl}</p>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary flex-shrink-0" />
              </a>
            ) : (
              <p className="text-sm text-muted-foreground italic">No attachment provided.</p>
            )}
          </div>

          {/* Submission result if graded */}
          {submission && submission.status === 'graded' && (
            <div className="rounded-lg border bg-primary/5 border-primary/20 p-4 space-y-2">
              <p className="text-[10px] uppercase font-bold text-primary tracking-wider flex items-center gap-1">
                <Star className="h-3 w-3" /> Your Result
              </p>
              <div className="flex items-center gap-3">
                <p className="text-2xl font-black text-primary">{submission.grade ?? '—'}</p>
                <p className="text-xs text-muted-foreground">/ {assignment.totalMarks} marks</p>
              </div>
              {submission.feedback && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Teacher Feedback</p>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{submission.feedback}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex-shrink-0 border-t pt-4 mt-2">
          <Button variant="outline" className="w-full" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Submit Assignment Dialog
// ---------------------------------------------------------------------------
const UPLOAD_URL = (process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:8000/graphql/')
  .replace('/graphql/', '/api/upload/');

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function SubmitDialog({
  assignment, studentId, token, existingSubmission, onClose, onSuccess,
}: {
  assignment: Assignment | null; studentId: string; token: string;
  existingSubmission: Submission | null; onClose: () => void; onSuccess: () => void;
}) {
  const [contentText, setContentText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [uploadedType, setUploadedType] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (existingSubmission) {
      setContentText(existingSubmission.contentText ?? '');
      setUploadedUrl(existingSubmission.fileUrl ?? '');
      setUploadedType(existingSubmission.fileType ?? '');
    } else {
      setContentText('');
      setUploadedUrl('');
      setUploadedType('');
    }
    setSelectedFile(null);
    setError('');
  }, [assignment, existingSubmission]);

  if (!assignment) return null;
  const isResubmit = !!existingSubmission;

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setSelectedFile(file);

    // Upload immediately
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(UPLOAD_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Upload failed.');
        setSelectedFile(null);
      } else {
        setUploadedUrl(json.url);
        setUploadedType(json.type);
      }
    } catch {
      setError('Upload failed. Check your connection.');
      setSelectedFile(null);
    } finally {
      setUploading(false);
    }
  }

  function clearFile() {
    setSelectedFile(null);
    setUploadedUrl('');
    setUploadedType('');
  }

  async function handleSubmit() {
    if (!contentText.trim() && !uploadedUrl) {
      setError('Please provide a written response or upload a file.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await mutate<any>(SUBMIT_MUTATION, {
        input: {
          studentId,
          assignmentId: assignment.id,
          contentText: contentText.trim() || null,
          fileUrl: uploadedUrl || null,
          fileType: uploadedType || null,
        },
      }, token);
      if (res.submitAssignment?.success) {
        onSuccess();
        onClose();
      } else {
        setError(res.submitAssignment?.message || 'Submission failed.');
      }
    } catch (e: any) {
      setError(e?.message || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={!!assignment} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="pr-6">
            {isResubmit ? 'Update Submission' : 'Submit Assignment'}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{assignment.title}</p>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 space-y-4 pr-1">
          {/* Due date */}
          <div className={`rounded-lg p-3 text-xs flex items-center gap-2 ${
            assignment.isOverdue
              ? 'bg-red-50 border border-red-200 text-red-700'
              : 'bg-muted/40 text-muted-foreground'
          }`}>
            <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
            <span>
              Due: {new Date(assignment.dueDate).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
              {assignment.isOverdue && ' — This assignment is overdue'}
            </span>
          </div>

          {/* Written response */}
          <div className="space-y-1.5">
            <Label htmlFor="content-text">Written Response</Label>
            <Textarea
              id="content-text"
              placeholder="Type your answer, notes, or comments here…"
              value={contentText}
              onChange={e => setContentText(e.target.value)}
              rows={5}
              className="resize-none"
            />
          </div>

          {/* File upload */}
          <div className="space-y-2">
            <Label>File Attachment</Label>

            {/* Uploaded file preview */}
            {(selectedFile || uploadedUrl) ? (
              <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
                <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                  {uploading
                    ? <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    : <FileText className="h-5 w-5 text-primary" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {selectedFile?.name ?? uploadedUrl.split('/').pop()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {uploading
                      ? 'Uploading…'
                      : selectedFile
                        ? `${formatBytes(selectedFile.size)} · ${uploadedType.toUpperCase()} · Uploaded`
                        : `${uploadedType.toUpperCase()} file`
                    }
                  </p>
                </div>
                {!uploading && (
                  <button
                    onClick={clearFile}
                    className="flex-shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer p-6 text-center">
                <UploadCloud className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Click to upload a file</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    PDF, Word, PowerPoint, images, ZIP and more · Max 20 MB
                  </p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.txt,.csv,.zip,.rar,.mp4,.mp3,.py,.js,.ts,.java,.c,.cpp,.html,.css"
                  onChange={handleFileSelect}
                />
              </label>
            )}
          </div>

          {error && (
            <p className="text-sm text-destructive flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
            </p>
          )}

          <div className="rounded-lg bg-muted/30 border p-3 text-xs text-muted-foreground">
            Total marks: <span className="font-semibold text-foreground">{assignment.totalMarks}</span>
          </div>
        </div>

        <div className="flex-shrink-0 border-t pt-4 mt-2 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={submitting || uploading}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleSubmit}
            disabled={submitting || uploading}
          >
            <Send className="h-4 w-4 mr-2" />
            {submitting ? 'Submitting…' : isResubmit ? 'Update' : 'Submit'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function StudentSubjectsPage() {
  const { user, token } = useAuth();
  const [studentProfile, setStudentProfile] = useState<{
    id: string; student_number: string; grade_level: string; academic_year: string;
  } | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [classGroups, setClassGroups] = useState<{ id: string; name: string; parentId: string | null }[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'enrolled' | 'available'>('enrolled');

  // Pagination
  const [enrolledPage, setEnrolledPage] = useState(1);
  const [availablePage, setAvailablePage] = useState(1);
  const [assignmentPages, setAssignmentPages] = useState<Record<string, number>>({});

  // Expand per enrolled subject
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Dialogs
  const [viewingAssignment, setViewingAssignment] = useState<Assignment | null>(null);
  const [viewingCourseName, setViewingCourseName] = useState('');
  const [submittingAssignment, setSubmittingAssignment] = useState<Assignment | null>(null);

  async function load(studentId: string) {
    const data = await query<any>(SUBJECTS_DATA_QUERY, { studentId }, token ?? undefined);
    setCourses(data.courses ?? []);
    setClassGroups(data.classGroups ?? []);
    setEnrollments(data.enrollments ?? []);
    setAssignments(data.assignments ?? []);
    setSubmissions(data.submissions ?? []);
  }

  useEffect(() => {
    if (!user || !token) return;
    (async () => {
      try {
        const profileRes = await query<any>(STUDENT_PROFILE_QUERY, { userId: user.id }, token);
        const profile = profileRes.studentByUser;
        if (!profile) { setLoading(false); return; }
        setStudentProfile(profile);
        await load(profile.id);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, token]);

  const enrolledIds = useMemo(() => new Set(enrollments.map(e => e.course.id)), [enrollments]);
  const enrolledCourses = useMemo(() => courses.filter(c => enrolledIds.has(c.id)), [courses, enrolledIds]);

  // Determine student's top-level form name for filtering available subjects
  const studentTopForm = useMemo(() => {
    if (!studentProfile?.grade_level) return null;
    const gl = studentProfile.grade_level;
    // Check if grade_level is a sub-class (has a parentId in classGroups)
    const match = classGroups.find(g => g.name === gl);
    if (match && match.parentId) {
      // It's a sub-class — find its parent name
      const parent = classGroups.find(g => g.id === match.parentId);
      return parent?.name ?? gl;
    }
    return gl; // Already a top-level group
  }, [studentProfile, classGroups]);

  // IDs of sub-groups under the student's top form
  const studentFormGroupNames = useMemo(() => {
    if (!studentTopForm) return null;
    const topGroup = classGroups.find(g => g.name === studentTopForm);
    if (!topGroup) return null;
    const subGroups = classGroups.filter(g => g.parentId === topGroup.id).map(g => g.name);
    return new Set([studentTopForm, ...subGroups]);
  }, [studentTopForm, classGroups]);

  const availableCourses = useMemo(() => courses.filter(c => {
    if (enrolledIds.has(c.id) || c.status !== 'active') return false;
    // If course has no class_group, it's available to all
    if (!c.class_group) return true;
    // If we can't determine student's form, show all
    if (!studentFormGroupNames) return true;
    // Only show courses whose class_group matches student's form family
    return studentFormGroupNames.has(c.class_group);
  }), [courses, enrolledIds, studentFormGroupNames]);

  // Map: assignmentId → Submission
  const submissionMap = useMemo(() =>
    new Map(submissions.map(s => [s.assignment.id, s])),
    [submissions]
  );

  const getAssignmentsForCourse = (courseId: string) =>
    assignments.filter(a => a.course.id === courseId);

  const getAssignmentPage = (courseId: string) => assignmentPages[courseId] ?? 1;
  const setAssignmentPage = (courseId: string, p: number) =>
    setAssignmentPages(prev => ({ ...prev, [courseId]: p }));

  const q = search.toLowerCase();
  const filteredEnrolled = enrolledCourses.filter(c =>
    !q || c.name.toLowerCase().includes(q) || c.course_code.toLowerCase().includes(q)
  );
  const filteredAvailable = availableCourses.filter(c =>
    !q || c.name.toLowerCase().includes(q) || c.course_code.toLowerCase().includes(q)
  );

  const pagedEnrolled = filteredEnrolled.slice((enrolledPage - 1) * PAGE_SIZE, enrolledPage * PAGE_SIZE);
  const pagedAvailable = filteredAvailable.slice((availablePage - 1) * PAGE_SIZE, availablePage * PAGE_SIZE);

  const handleSearch = (v: string) => { setSearch(v); setEnrolledPage(1); setAvailablePage(1); };
  const handleTab = (t: 'enrolled' | 'available') => { setTab(t); setSearch(''); setEnrolledPage(1); setAvailablePage(1); };

  async function handleEnroll(course: Course) {
    if (!studentProfile) return;
    setEnrolling(course.id);
    setMessage(null);
    try {
      const res = await mutate<any>(ENROLL_MUTATION, {
        input: {
          studentId: studentProfile.id,
          courseId: course.id,
          semester: course.semester || studentProfile.academic_year || '',
          academicYear: course.academic_year || studentProfile.academic_year || '',
        },
      }, token ?? undefined);
      if (res.enrollStudent?.success) {
        setMessage({ text: `Successfully enrolled in ${course.name}`, type: 'success' });
        await load(studentProfile.id);
      } else {
        setMessage({ text: res.enrollStudent?.message || 'Enrollment failed', type: 'error' });
      }
    } catch (e: any) {
      setMessage({ text: e?.message || 'Enrollment failed', type: 'error' });
    } finally {
      setEnrolling(null);
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Dialogs */}
      <AssignmentDetailDialog
        assignment={viewingAssignment}
        courseName={viewingCourseName}
        submission={viewingAssignment ? (submissionMap.get(viewingAssignment.id) ?? null) : null}
        onClose={() => setViewingAssignment(null)}
      />
      {studentProfile && token && (
        <SubmitDialog
          assignment={submittingAssignment}
          studentId={studentProfile.id}
          token={token}
          existingSubmission={submittingAssignment ? (submissionMap.get(submittingAssignment.id) ?? null) : null}
          onClose={() => setSubmittingAssignment(null)}
          onSuccess={() => load(studentProfile.id)}
        />
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Subjects</h1>
        <p className="text-muted-foreground">Browse subjects, view assignments, and submit your work</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-0">
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-blue-800">{enrolledCourses.length}</p>
            <p className="text-sm text-blue-600 font-medium">Enrolled</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-0">
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-green-800">{availableCourses.length}</p>
            <p className="text-sm text-green-600 font-medium">Available</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-yellow-100 border-0">
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-amber-800">{submissions.length}</p>
            <p className="text-sm text-amber-600 font-medium">Submitted</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-violet-100 border-0">
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-purple-800">
              {enrolledCourses.reduce((s, c) => s + (c.credits || 0), 0)}
            </p>
            <p className="text-sm text-purple-600 font-medium">Total Credits</p>
          </CardContent>
        </Card>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg text-sm ${
          message.type === 'success'
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex rounded-lg border overflow-hidden">
          <button
            onClick={() => handleTab('enrolled')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tab === 'enrolled' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:text-foreground'
            }`}
          >
            My Subjects ({enrolledCourses.length})
          </button>
          <button
            onClick={() => handleTab('available')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-l ${
              tab === 'available' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:text-foreground'
            }`}
          >
            Available ({availableCourses.length})
          </button>
        </div>
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search subjects…"
            value={search}
            onChange={e => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* MY SUBJECTS tab                                                     */}
      {/* ------------------------------------------------------------------ */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />)}
        </div>
      ) : tab === 'enrolled' && (
        filteredEnrolled.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">No enrolled subjects</h3>
            <p className="text-sm text-muted-foreground">Switch to &quot;Available&quot; to enroll in subjects.</p>
            <Button variant="outline" className="mt-4" onClick={() => handleTab('available')}>
              Browse Available Subjects
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {pagedEnrolled.map(course => {
              const isExpanded = expandedId === course.id;
              const courseAssignments = getAssignmentsForCourse(course.id);
              const aPage = getAssignmentPage(course.id);
              const pagedAssignments = courseAssignments.slice(
                (aPage - 1) * PAGE_SIZE, aPage * PAGE_SIZE
              );
              const submittedCount = courseAssignments.filter(a => submissionMap.has(a.id)).length;

              return (
                <Card key={course.id} className={isExpanded ? 'ring-1 ring-primary/30' : ''}>
                  <button className="w-full text-left" onClick={() => setExpandedId(isExpanded ? null : course.id)}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        {isExpanded
                          ? <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          : <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        }
                        <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base">{course.name}</CardTitle>
                          <p className="text-xs text-muted-foreground font-mono mt-0.5">{course.course_code}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 text-xs text-muted-foreground">
                          {course.credits > 0 && (
                            <span className="flex items-center gap-1">
                              <GraduationCap className="h-3 w-3" />
                              {course.credits} cr
                            </span>
                          )}
                          {courseAssignments.length > 0 && (
                            <>
                              <span>·</span>
                              <span className="flex items-center gap-1">
                                <ClipboardList className="h-3 w-3" />
                                {submittedCount}/{courseAssignments.length} submitted
                              </span>
                            </>
                          )}
                          <Badge variant="default" className="text-xs">Enrolled</Badge>
                        </div>
                      </div>
                    </CardHeader>
                  </button>

                  {/* Expanded: assignments */}
                  {isExpanded && (
                    <CardContent className="pt-0 border-t">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-4 mb-3 flex items-center gap-1.5">
                        <ClipboardList className="h-3.5 w-3.5" /> Assignments
                      </p>
                      {courseAssignments.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6">
                          No assignments posted yet.
                        </p>
                      ) : (
                        <>
                          <div className="space-y-2">
                            {pagedAssignments.map(a => {
                              const due = new Date(a.dueDate);
                              const sub = submissionMap.get(a.id) ?? null;
                              return (
                                <div key={a.id} className="rounded-lg border px-3 py-3 hover:bg-muted/20 transition-colors">
                                  <div className="flex items-start gap-2">
                                    {/* Submitted indicator */}
                                    <div className="flex-shrink-0 mt-0.5">
                                      {sub
                                        ? <CheckCircle2 className="h-4 w-4 text-green-600" />
                                        : <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/40" />
                                      }
                                    </div>

                                    <div className="flex-1 min-w-0">
                                      <p className="font-semibold text-sm leading-snug">{a.title}</p>
                                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                        <TypeBadge type={a.assignmentType} />
                                        <span className={`text-xs flex items-center gap-1 ${a.isOverdue && !sub ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
                                          <Calendar className="h-3 w-3" />
                                          {isNaN(due.getTime()) ? '—' : due.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                                          {a.isOverdue && !sub && ' · Overdue'}
                                        </span>
                                        <span className="text-xs text-muted-foreground">{a.totalMarks} marks</span>
                                        {a.attachmentUrl && (
                                          <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                                            <Paperclip className="h-3 w-3" />
                                            {a.attachmentType?.toUpperCase() || 'File'}
                                          </span>
                                        )}
                                        {sub && <SubStatusBadge status={sub.status} />}
                                        {sub?.grade && (
                                          <span className="text-xs font-bold text-primary">
                                            {sub.grade}/{a.totalMarks}
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-xs h-7 px-2.5"
                                        onClick={e => {
                                          e.stopPropagation();
                                          setViewingCourseName(course.name);
                                          setViewingAssignment(a);
                                        }}
                                      >
                                        View
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant={sub ? 'outline' : 'default'}
                                        className="text-xs h-7 px-2.5"
                                        onClick={e => {
                                          e.stopPropagation();
                                          setSubmittingAssignment(a);
                                        }}
                                      >
                                        <Send className="h-3 w-3 mr-1" />
                                        {sub ? 'Update' : 'Submit'}
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          <Pager
                            page={aPage}
                            total={courseAssignments.length}
                            onChange={p => setAssignmentPage(course.id, p)}
                          />
                        </>
                      )}
                    </CardContent>
                  )}
                </Card>
              );
            })}

            <Pager
              page={enrolledPage}
              total={filteredEnrolled.length}
              onChange={p => { setEnrolledPage(p); setExpandedId(null); }}
            />
          </div>
        )
      )}

      {/* ------------------------------------------------------------------ */}
      {/* AVAILABLE tab                                                       */}
      {/* ------------------------------------------------------------------ */}
      {!loading && tab === 'available' && (
        filteredAvailable.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">No subjects available</h3>
            <p className="text-sm text-muted-foreground">All active subjects are already enrolled or none match your search.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {pagedAvailable.map(course => (
                <Card key={course.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-mono text-xs text-muted-foreground mb-1">{course.course_code}</p>
                        <CardTitle className="text-base leading-snug">{course.name}</CardTitle>
                      </div>
                      <Badge variant="outline" className="text-xs flex-shrink-0">Active</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {course.credits > 0 && (
                        <span className="flex items-center gap-1">
                          <GraduationCap className="h-3 w-3" />
                          {course.credits} credit{course.credits !== 1 ? 's' : ''}
                        </span>
                      )}
                      {course.department && course.department !== 'N/A' && <span>{course.department}</span>}
                      {course.semester && course.semester !== 'N/A' && <span>{course.semester}</span>}
                    </div>
                    <Button
                      size="sm" className="w-full"
                      disabled={enrolling === course.id}
                      onClick={() => handleEnroll(course)}
                    >
                      {enrolling === course.id ? 'Enrolling…' : 'Enroll'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Pager
              page={availablePage}
              total={filteredAvailable.length}
              onChange={setAvailablePage}
            />
          </div>
        )
      )}
    </div>
  );
}

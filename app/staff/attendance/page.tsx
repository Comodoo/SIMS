'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/lib/auth-context';
import { mutate as mutation, query } from '@/lib/graphql';
import { captureFrame, isWebAuthnAvailable, runWebAuthnAuthentication, startCamera, stopCamera } from '@/lib/webauthn';
import { AlertCircle, Calendar, Camera, CheckCircle, Clock, Fingerprint, LogIn, LogOut, Users, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

// ---------------------------------------------------------------------------
// GraphQL
// ---------------------------------------------------------------------------
const STAFF_PROFILE_QUERY = `
  query StaffProfile($userId: ID!) {
    staffByUser(userId: $userId) { id }
    biometricStatus(userId: $userId) { hasWebauthn hasFace }
  }
`;

const MY_ATTENDANCE_QUERY = `
  query MyAttendance($userId: ID!, $dateFrom: String) {
    attendance(userId: $userId, dateFrom: $dateFrom, limit: 60) {
      id status timestamp is_late late_minutes method
      user { first_name last_name role }
      staff { position }
    }
  }
`;

const MY_COURSES_QUERY = `
  query StaffCourses($teacherId: ID) {
    timetable(teacherId: $teacherId) {
      id classGroup subject { id name course_code }
    }
    semesters { id name academic_year status }
  }
`;

const SESSIONS_QUERY = `
  query AttendanceSessions($courseId: ID!, $semesterId: ID) {
    attendanceSessions(courseId: $courseId, semesterId: $semesterId, limit: 60) {
      id date wasHeld cancellationReason
    }
  }
`;

const ENROLLED_STUDENTS_QUERY = `
  query CourseStudents($courseId: ID!) {
    enrollments(courseId: $courseId, status: "active") {
      id student { id user { id first_name last_name } student_number }
    }
  }
`;

const COURSE_ATTENDANCE_QUERY = `
  query CourseAttendance($courseId: ID!, $date: String!) {
    studentAttendanceByCourse(courseId: $courseId, date: $date) {
      id studentId status
    }
  }
`;

const CREATE_SESSION_MUTATION = `
  mutation CreateSession($courseId: ID!, $date: String!, $teacherId: ID!, $semesterId: ID) {
    createAttendanceSession(courseId: $courseId, date: $date, teacherId: $teacherId, semesterId: $semesterId) {
      success message
    }
  }
`;

const WEBAUTHN_BEGIN = `mutation BeginAuth($userId: ID!) { webauthnBeginAuth(userId: $userId) }`;

const WEBAUTHN_CLOCK = `
  mutation WebAuthnClock($userId: ID!, $credentialJson: String!, $action: String!) {
    webauthnCompleteClockIn(userId: $userId, credentialJson: $credentialJson, action: $action) {
      success message attendance { id is_late late_minutes timestamp }
    }
  }
`;

const FACE_CLOCK = `
  mutation FaceClock($userId: ID!, $imageBase64: String!, $action: String!) {
    clockInWithFace(userId: $userId, imageBase64: $imageBase64, action: $action) {
      success message attendance { id is_late late_minutes timestamp }
    }
  }
`;

const CLOCK_IN_MANUAL = `
  mutation ClockIn($userId: ID!) {
    clockIn(input: { userId: $userId, status: "in", method: "manual" }) {
      success message attendance { id is_late late_minutes timestamp }
    }
  }
`;
const CLOCK_OUT_MANUAL = `
  mutation ClockOut($userId: ID!) {
    clockOut(input: { userId: $userId, status: "out", method: "manual" }) {
      success message
    }
  }
`;


const IDENTIFY_FACE = `
  mutation IdentifyFace($imageBase64: String!, $courseId: ID!, $date: String!, $teacherId: ID!, $semesterId: ID) {
    identifyStudentFace(imageBase64: $imageBase64, courseId: $courseId, date: $date, teacherId: $teacherId, semesterId: $semesterId) {
      success message studentId studentName confidence
    }
  }
`;

const STUDENT_WEBAUTHN_BEGIN = `mutation StudentBeginAuth($userId: ID!) { webauthnBeginAuth(userId: $userId) }`;

const STUDENT_WEBAUTHN_COMPLETE = `
  mutation WebAuthnMarkStudent($studentUserId: ID!, $courseId: ID!, $date: String!, $credentialJson: String!, $teacherId: ID!, $semesterId: ID) {
    webauthnMarkStudentAttendance(studentUserId: $studentUserId, courseId: $courseId, date: $date, credentialJson: $credentialJson, teacherId: $teacherId, semesterId: $semesterId) {
      success message studentId studentName
    }
  }
`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface AttendanceRecord {
  id: string; status: string; timestamp: string; is_late: boolean; late_minutes: number | null; method: string;
  user?: { first_name: string; last_name: string; role: string };
  staff?: { position: string } | null;
}
interface Subject { id: string; name: string; course_code: string; }
interface TimetableSlot { id: string; classGroup: string; subject: Subject; }
interface Semester { id: string; name: string; academic_year: string; status: string; }
interface Session { id: string; date: string; wasHeld: boolean; }
interface EnrolledStudent { id: string; student: { id: string; user: { id: string; first_name: string; last_name: string }; student_number: string }; }
interface BioAlert { success: boolean; studentName: string; method: 'face' | 'fingerprint'; message: string; }

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function today() { return new Date().toISOString().slice(0, 10); }
function fmtTime(ts: string) { return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
function fmtDate(d: string) { return new Date(d + 'T00:00:00').toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }); }

const STATUS_COLORS: Record<string, string> = {
  present: 'bg-green-100 text-green-800',
  absent: 'bg-red-100 text-red-800',
  late: 'bg-amber-100 text-amber-800',
  excused: 'bg-blue-100 text-blue-800',
};

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------
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
// Page
// ---------------------------------------------------------------------------
export default function StaffAttendancePage() {
  const { token, user } = useAuth();
  const [staffId, setStaffId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'clock' | 'mark'>('clock');
  const [histPage, setHistPage] = useState(1);
  const [stuPage, setStuPage] = useState(1);

  // Biometric registration status
  const [hasWebAuthn, setHasWebAuthn] = useState(false);
  const [hasFace, setHasFace] = useState(false);
  const [webAuthnAvailable, setWebAuthnAvailable] = useState(false);

  // Clock-in method toggle
  const [clockMethod, setClockMethod] = useState<'fingerprint' | 'face'>('fingerprint');

  // Clock state
  const [myRecords, setMyRecords] = useState<AttendanceRecord[]>([]);
  const [clockLoading, setClockLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [clockWorking, setClockWorking] = useState(false);
  const [clockMsg, setClockMsg] = useState('');
  const [clockMsgType, setClockMsgType] = useState<'ok' | 'err' | ''>('');

  // Face clock camera
  const [faceClockOpen, setFaceClockOpen] = useState(false);
  const [faceClockStream, setFaceClockStream] = useState<MediaStream | null>(null);
  const faceClockRef = useRef<HTMLVideoElement>(null);

  // Mark students state
  const [mySubjects, setMySubjects] = useState<Subject[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedDate, setSelectedDate] = useState(today());
  const [sessions, setSessions] = useState<Session[]>([]);
  const [enrolled, setEnrolled] = useState<EnrolledStudent[]>([]);
  const [studentStatuses, setStudentStatuses] = useState<Record<string, string>>({});
  const [markLoading, setMarkLoading] = useState(false);

  // Student face scan camera
  const [stuCameraOpen, setStuCameraOpen] = useState(false);
  const [stuCameraStream, setStuCameraStream] = useState<MediaStream | null>(null);
  const [stuFaceMsg, setStuFaceMsg] = useState('');
  const [stuFaceMsgType, setStuFaceMsgType] = useState<'ok' | 'err' | ''>('');
  const [stuFaceWorking, setStuFaceWorking] = useState(false);
  const [lastIdentified, setLastIdentified] = useState<string | null>(null);
  const stuVideoRef = useRef<HTMLVideoElement>(null);

  // Student fingerprint scan
  const [stuFpOpen, setStuFpOpen] = useState(false);
  const [fingerprintStudentUserId, setFingerprintStudentUserId] = useState('');
  const [stuFpScanning, setStuFpScanning] = useState(false);
  const [stuFpWorking, setStuFpWorking] = useState(false);
  const [stuFpMsg, setStuFpMsg] = useState('');
  const [stuFpMsgType, setStuFpMsgType] = useState<'ok' | 'err' | ''>('');

  // Biometric alert popup
  const [bioAlert, setBioAlert] = useState<BioAlert | null>(null);
  useEffect(() => {
    if (!bioAlert) return;
    const t = setTimeout(() => setBioAlert(null), 2800);
    return () => clearTimeout(t);
  }, [bioAlert]);

  // ── Init ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user || !token) return;
    Promise.all([
      query<any>(STAFF_PROFILE_QUERY, { userId: user.id }, token),
      isWebAuthnAvailable(),
    ]).then(([data, avail]) => {
      if (data.staffByUser) setStaffId(data.staffByUser.id);
      setHasWebAuthn(data.biometricStatus?.hasWebauthn ?? false);
      setHasFace(data.biometricStatus?.hasFace ?? false);
      setWebAuthnAvailable(avail);
    }).catch(() => {});
  }, [user, token]);

  // Auto-select available method
  useEffect(() => {
    if (hasWebAuthn && webAuthnAvailable) setClockMethod('fingerprint');
    else if (hasFace) setClockMethod('face');
  }, [hasWebAuthn, webAuthnAvailable, hasFace]);

  // Load clock records
  useEffect(() => {
    if (!user || !token) return;
    setClockLoading(true);
    const from = new Date(); from.setDate(from.getDate() - 14);
    query<any>(MY_ATTENDANCE_QUERY, { userId: user.id, dateFrom: from.toISOString().slice(0, 10) }, token)
      .then(r => setMyRecords(r.attendance ?? []))
      .catch(() => {}).finally(() => setClockLoading(false));
  }, [user, token]);

  // Load subjects
  useEffect(() => {
    if (!staffId || !token) return;
    query<any>(MY_COURSES_QUERY, { teacherId: staffId }, token).then(r => {
      const slots: TimetableSlot[] = r.timetable ?? [];
      const seen = new Set<string>();
      const subjects: Subject[] = [];
      slots.forEach(s => { if (!seen.has(s.subject.id)) { seen.add(s.subject.id); subjects.push(s.subject); } });
      setMySubjects(subjects);
      if (r.semesters) {
        setSemesters(r.semesters);
        const active = (r.semesters as Semester[]).find(s => s.status === 'active');
        if (active && !selectedSemester) setSelectedSemester(active.id);
      }
    }).catch(() => {});
  }, [staffId, token]);

  // Load sessions when subject changes
  useEffect(() => {
    if (!selectedSubject || !token) return;
    query<any>(SESSIONS_QUERY, { courseId: selectedSubject.id, semesterId: selectedSemester || undefined }, token)
      .then(r => setSessions(r.attendanceSessions ?? [])).catch(() => {});
  }, [selectedSubject, selectedSemester, token]);

  // Load enrolled students
  useEffect(() => {
    if (!selectedSubject || !token) return;
    query<any>(ENROLLED_STUDENTS_QUERY, { courseId: selectedSubject.id }, token)
      .then(r => setEnrolled(r.enrollments ?? [])).catch(() => {});
  }, [selectedSubject, token]);

  // Load existing attendance
  useEffect(() => {
    if (!selectedSubject || !selectedDate || !token) return;
    query<any>(COURSE_ATTENDANCE_QUERY, { courseId: selectedSubject.id, date: selectedDate }, token)
      .then(r => {
        const map: Record<string, string> = {};
        (r.studentAttendanceByCourse ?? []).forEach((rec: any) => { map[rec.studentId] = rec.status; });
        setStudentStatuses(prev => ({ ...prev, ...map }));
      }).catch(() => {});
  }, [selectedSubject, selectedDate, token]);


  // Face clock camera
  useEffect(() => {
    if (!faceClockOpen) { stopCamera(faceClockStream); setFaceClockStream(null); return; }
    if (!faceClockRef.current) return;
    startCamera(faceClockRef.current, 'user').then(s => setFaceClockStream(s))
      .catch(() => setFaceClockOpen(false));
  }, [faceClockOpen]);

  // Student face camera
  useEffect(() => {
    if (!stuCameraOpen) { stopCamera(stuCameraStream); setStuCameraStream(null); return; }
    if (!stuVideoRef.current) return;
    startCamera(stuVideoRef.current, 'user').then(s => setStuCameraStream(s))
      .catch(() => { setStuFaceMsg('Cannot access camera'); setStuFaceMsgType('err'); setStuCameraOpen(false); });
  }, [stuCameraOpen]);

  // ── Derived ───────────────────────────────────────────────────────────
  const todayRecords = myRecords.filter(r => r.timestamp.startsWith(today()));
  const lastClockIn = todayRecords.find(r => r.status === 'in');
  const lastClockOut = todayRecords.find(r => r.status === 'out');
  const sessionForDate = sessions.find(s => s.date === selectedDate);

  async function refreshClock() {
    if (!user || !token) return;
    const from = new Date(); from.setDate(from.getDate() - 14);
    const d = await query<any>(MY_ATTENDANCE_QUERY, { userId: user.id, dateFrom: from.toISOString().slice(0, 10) }, token);
    setMyRecords(d.attendance ?? []);
  }

  function applyClockResult(res: any, verb: string) {
    setClockMsg(res?.message ?? '');
    setClockMsgType(res?.success ? 'ok' : 'err');
    if (res?.success) refreshClock();
  }

  // ── Fingerprint clock ─────────────────────────────────────────────────
  async function handleFingerprintClock(action: 'in' | 'out') {
    if (!user || !token || scanning || clockWorking) return;
    setScanning(true); setClockMsg(''); setClockMsgType('');
    try {
      const r1 = await mutation<any>(WEBAUTHN_BEGIN, { userId: user.id }, token);
      const credentialJson = await runWebAuthnAuthentication(r1.webauthnBeginAuth);
      setScanning(false); setClockWorking(true);
      const r2 = await mutation<any>(WEBAUTHN_CLOCK, { userId: user.id, credentialJson, action }, token);
      applyClockResult(r2.webauthnCompleteClockIn, action);
    } catch (e: any) {
      setScanning(false);
      setClockMsg(e?.name === 'NotAllowedError' ? 'Scan cancelled' : (e?.message ?? 'Failed'));
      setClockMsgType('err');
    } finally { setClockWorking(false); }
  }

  // ── Face clock ────────────────────────────────────────────────────────
  async function handleFaceClock(action: 'in' | 'out') {
    if (!faceClockRef.current || !user || !token || clockWorking) return;
    setClockWorking(true); setClockMsg(''); setClockMsgType('');
    try {
      const imageBase64 = captureFrame(faceClockRef.current);
      const r = await mutation<any>(FACE_CLOCK, { userId: user.id, imageBase64, action }, token);
      applyClockResult(r.clockInWithFace, action);
      if (r.clockInWithFace?.success) setFaceClockOpen(false);
    } catch { setClockMsg('Network error'); setClockMsgType('err'); }
    finally { setClockWorking(false); }
  }

  // ── Manual fallback ───────────────────────────────────────────────────
  async function handleManualClock(action: 'in' | 'out') {
    if (!user || !token) return;
    setClockWorking(true); setClockMsg(''); setClockMsgType('');
    try {
      const mut = action === 'in' ? CLOCK_IN_MANUAL : CLOCK_OUT_MANUAL;
      const r = await mutation<any>(mut, { userId: user.id }, token);
      const res = action === 'in' ? r.clockIn : r.clockOut;
      applyClockResult(res, action);
    } catch { setClockMsg('Network error'); setClockMsgType('err'); }
    finally { setClockWorking(false); }
  }

  // ── Student face scan ─────────────────────────────────────────────────
  const handleStudentFaceScan = useCallback(async () => {
    if (!stuVideoRef.current || !staffId || !selectedSubject || !token || stuFaceWorking) return;
    setStuFaceWorking(true); setStuFaceMsg(''); setStuFaceMsgType('');
    try {
      const imageBase64 = captureFrame(stuVideoRef.current);
      const r = await mutation<any>(IDENTIFY_FACE, {
        imageBase64, courseId: selectedSubject.id, date: selectedDate,
        teacherId: staffId, semesterId: selectedSemester || undefined,
      }, token);
      const res = r.identifyStudentFace;
      setStuFaceMsg(res?.message ?? ''); setStuFaceMsgType(res?.success ? 'ok' : 'err');
      setBioAlert({ success: res?.success ?? false, studentName: res?.studentName ?? '', method: 'face', message: res?.message ?? '' });
      if (res?.success && res.studentId) {
        setLastIdentified(res.studentName);
        setStudentStatuses(prev => ({ ...prev, [res.studentId]: 'present' }));
      }
    } catch { setStuFaceMsg('Network error'); setStuFaceMsgType('err'); }
    finally { setStuFaceWorking(false); }
  }, [stuVideoRef, staffId, selectedSubject, selectedDate, selectedSemester, token, stuFaceWorking]);

  // ── Student fingerprint scan ──────────────────────────────────────────
  const handleStudentFingerprint = useCallback(async () => {
    if (!fingerprintStudentUserId || !staffId || !selectedSubject || !token || stuFpScanning || stuFpWorking) return;
    setStuFpScanning(true); setStuFpMsg(''); setStuFpMsgType('');
    try {
      const r1 = await mutation<any>(STUDENT_WEBAUTHN_BEGIN, { userId: fingerprintStudentUserId }, token);
      const credentialJson = await runWebAuthnAuthentication(r1.webauthnBeginAuth);
      setStuFpScanning(false); setStuFpWorking(true);
      const r2 = await mutation<any>(STUDENT_WEBAUTHN_COMPLETE, {
        studentUserId: fingerprintStudentUserId,
        courseId: selectedSubject.id,
        date: selectedDate,
        credentialJson,
        teacherId: staffId,
        semesterId: selectedSemester || undefined,
      }, token);
      const res = r2.webauthnMarkStudentAttendance;
      setStuFpMsg(res?.message ?? ''); setStuFpMsgType(res?.success ? 'ok' : 'err');
      setBioAlert({ success: res?.success ?? false, studentName: res?.studentName ?? '', method: 'fingerprint', message: res?.message ?? '' });
      if (res?.success && res.studentId) {
        setStudentStatuses(prev => ({ ...prev, [res.studentId]: 'present' }));
        setFingerprintStudentUserId('');
      }
    } catch (e: any) {
      setStuFpScanning(false);
      setStuFpMsg(e?.name === 'NotAllowedError' ? 'Scan cancelled' : (e?.message ?? 'Fingerprint failed'));
      setStuFpMsgType('err');
    } finally { setStuFpWorking(false); }
  }, [fingerprintStudentUserId, staffId, selectedSubject, selectedDate, selectedSemester, token, stuFpScanning, stuFpWorking]);

  // ── Session ───────────────────────────────────────────────────────────
  async function handleCreateSession() {
    if (!selectedSubject || !staffId || !token) return;
    setMarkLoading(true);
    try {
      await mutation<any>(CREATE_SESSION_MUTATION, {
        courseId: selectedSubject.id, date: selectedDate, teacherId: staffId,
        semesterId: selectedSemester || undefined,
      }, token);
      const sr = await query<any>(SESSIONS_QUERY, { courseId: selectedSubject.id, semesterId: selectedSemester || undefined }, token);
      setSessions(sr.attendanceSessions ?? []);
    } catch {} finally { setMarkLoading(false); }
  }


  const noBiometric = !hasWebAuthn && !hasFace;

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Biometric Alert Popup ── */}
      {bioAlert && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setBioAlert(null)}
        >
          <div
            className="bg-card rounded-2xl shadow-2xl p-8 mx-4 max-w-xs w-full text-center space-y-4 animate-in zoom-in-90 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center ${bioAlert.success ? 'bg-green-100' : 'bg-red-100'}`}>
              {bioAlert.success
                ? <CheckCircle className="h-12 w-12 text-green-600" />
                : <AlertCircle className="h-12 w-12 text-red-600" />}
            </div>

            <div>
              <p className={`text-lg font-bold ${bioAlert.success ? 'text-green-700' : 'text-red-700'}`}>
                {bioAlert.success ? 'Marked Present!' : 'Not Identified'}
              </p>
              {bioAlert.studentName && (
                <p className="text-xl font-semibold mt-1">{bioAlert.studentName}</p>
              )}
              <p className="text-sm text-muted-foreground mt-2">{bioAlert.message}</p>
            </div>

            <div className="flex items-center justify-center gap-1.5">
              {bioAlert.method === 'face'
                ? <><Camera className="h-4 w-4 text-purple-600" /><span className="text-sm text-purple-600 font-medium">Face Recognition</span></>
                : <><Fingerprint className="h-4 w-4 text-purple-600" /><span className="text-sm text-purple-600 font-medium">Fingerprint</span></>}
            </div>

            <button
              onClick={() => setBioAlert(null)}
              className="w-full py-2 rounded-lg text-sm font-medium bg-muted hover:bg-muted/80 transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Header tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Attendance</h1>
          <p className="text-muted-foreground">Clock in/out and mark student attendance</p>
        </div>
        <div className="flex gap-2">
          {(['clock', 'mark'] as const).map(tab => (
            <Button key={tab} variant={activeTab === tab ? 'default' : 'outline'} size="sm" onClick={() => setActiveTab(tab)}>
              {tab === 'clock' ? <><Clock className="h-4 w-4 mr-1.5" />My Attendance</> : <><Users className="h-4 w-4 mr-1.5" />Mark Students</>}
            </Button>
          ))}
        </div>
      </div>

      {/* ─────────────── MY ATTENDANCE ─────────────── */}
      {activeTab === 'clock' && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Today — {new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">

              {/* Today summary */}
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-40 p-4 rounded-lg bg-muted/40 border">
                  <p className="text-xs text-muted-foreground mb-1">Clock In</p>
                  <p className="text-xl font-bold">{lastClockIn ? fmtTime(lastClockIn.timestamp) : '—'}</p>
                  {lastClockIn?.is_late && <span className="text-xs text-amber-600 font-medium">{lastClockIn.late_minutes} min late</span>}
                  {lastClockIn && !lastClockIn.is_late && <span className="text-xs text-green-600 font-medium">On time</span>}
                </div>
                <div className="flex-1 min-w-40 p-4 rounded-lg bg-muted/40 border">
                  <p className="text-xs text-muted-foreground mb-1">Clock Out</p>
                  <p className="text-xl font-bold">{lastClockOut ? fmtTime(lastClockOut.timestamp) : '—'}</p>
                </div>
              </div>

              {/* Method toggle — only show if both are registered */}
              {hasWebAuthn && hasFace && (
                <div className="flex gap-2 justify-center">
                  <Button size="sm" variant={clockMethod === 'fingerprint' ? 'default' : 'outline'}
                    onClick={() => { setClockMethod('fingerprint'); setFaceClockOpen(false); setClockMsg(''); }}>
                    <Fingerprint className="h-3.5 w-3.5 mr-1.5" />Fingerprint
                  </Button>
                  <Button size="sm" variant={clockMethod === 'face' ? 'default' : 'outline'}
                    onClick={() => { setClockMethod('face'); setClockMsg(''); }}>
                    <Camera className="h-3.5 w-3.5 mr-1.5" />Face Camera
                  </Button>
                </div>
              )}

              {/* ── Fingerprint method ── */}
              {(clockMethod === 'fingerprint' || !hasFace) && !noBiometric && (
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <div className={`w-36 h-36 rounded-full border-4 flex items-center justify-center transition-all duration-300 ${
                      scanning ? 'border-primary bg-primary/10' : clockWorking ? 'border-amber-400 bg-amber-50' : 'border-muted bg-muted/30'
                    }`}>
                      <Fingerprint className={`h-16 w-16 ${scanning ? 'text-primary animate-pulse' : clockWorking ? 'text-amber-500' : 'text-muted-foreground'}`} />
                    </div>
                    {scanning && <div className="absolute inset-0 rounded-full border-4 border-primary opacity-30 animate-ping" />}
                  </div>

                  <div className="text-center min-h-8">
                    {scanning ? <p className="text-sm font-medium text-primary">Scanning fingerprint…</p>
                     : clockWorking ? <p className="text-sm font-medium text-amber-600">Processing…</p>
                     : clockMsg ? (
                       <p className={`text-sm font-medium flex items-center gap-1 justify-center ${clockMsgType === 'ok' ? 'text-green-700' : 'text-red-600'}`}>
                         {clockMsgType === 'ok' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}{clockMsg}
                       </p>
                     ) : !hasWebAuthn ? (
                       <div className="space-y-1 text-center">
                         <p className="text-sm text-amber-600">Fingerprint not registered</p>
                         <a href="/staff/profile" className="text-xs text-primary underline">Register on your Profile →</a>
                       </div>
                     ) : !webAuthnAvailable ? (
                       <p className="text-sm text-amber-600">Open on your phone to use fingerprint</p>
                     ) : (
                       <p className="text-sm text-muted-foreground">Place your finger on the scanner</p>
                     )}
                  </div>

                  {hasWebAuthn && webAuthnAvailable && (
                    <div className="flex gap-3 w-full max-w-xs">
                      <Button onClick={() => handleFingerprintClock('in')} disabled={scanning || clockWorking || !!lastClockIn} className="flex-1">
                        <LogIn className="h-4 w-4 mr-2" />{lastClockIn ? 'Clocked In' : 'Clock In'}
                      </Button>
                      <Button variant="outline" onClick={() => handleFingerprintClock('out')} disabled={scanning || clockWorking || !lastClockIn || !!lastClockOut} className="flex-1">
                        <LogOut className="h-4 w-4 mr-2" />{lastClockOut ? 'Clocked Out' : 'Clock Out'}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* ── Face camera method ── */}
              {clockMethod === 'face' && hasFace && (
                <div className="space-y-3">
                  {!faceClockOpen ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-36 h-36 rounded-full border-4 border-muted bg-muted/30 flex items-center justify-center">
                        <Camera className="h-16 w-16 text-muted-foreground" />
                      </div>
                      {clockMsg && (
                        <p className={`text-sm font-medium flex items-center gap-1 ${clockMsgType === 'ok' ? 'text-green-700' : 'text-red-600'}`}>
                          {clockMsgType === 'ok' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}{clockMsg}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">Click Open Camera to clock in with your face</p>
                      <Button onClick={() => setFaceClockOpen(true)} variant="outline">
                        <Camera className="h-4 w-4 mr-2" />Open Camera
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="relative rounded-lg overflow-hidden bg-black aspect-video max-h-64">
                        <video ref={faceClockRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                        {clockWorking && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="text-white text-sm animate-pulse">Verifying face…</span>
                          </div>
                        )}
                      </div>
                      {clockMsg && (
                        <p className={`text-sm font-medium flex items-center gap-1 ${clockMsgType === 'ok' ? 'text-green-700' : 'text-red-600'}`}>
                          {clockMsgType === 'ok' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}{clockMsg}
                        </p>
                      )}
                      <div className="flex gap-3">
                        <Button onClick={() => handleFaceClock('in')} disabled={clockWorking || !!lastClockIn} className="flex-1">
                          <LogIn className="h-4 w-4 mr-2" />{lastClockIn ? 'Clocked In' : 'Clock In'}
                        </Button>
                        <Button variant="outline" onClick={() => handleFaceClock('out')} disabled={clockWorking || !lastClockIn || !!lastClockOut} className="flex-1">
                          <LogOut className="h-4 w-4 mr-2" />{lastClockOut ? 'Clocked Out' : 'Clock Out'}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setFaceClockOpen(false)}><X className="h-4 w-4" /></Button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ── No biometric — manual fallback ── */}
              {noBiometric && (
                <div className="flex flex-col items-center gap-3">
                  <p className="text-sm text-amber-600 text-center">No biometric registered — using manual clock-in</p>
                  <a href="/staff/profile" className="text-xs text-primary underline">Register fingerprint or face on your Profile →</a>
                  {clockMsg && (
                    <p className={`text-sm font-medium ${clockMsgType === 'ok' ? 'text-green-700' : 'text-red-600'}`}>{clockMsg}</p>
                  )}
                  <div className="flex gap-3 w-full max-w-xs">
                    <Button onClick={() => handleManualClock('in')} disabled={clockWorking || !!lastClockIn} className="flex-1">
                      <LogIn className="h-4 w-4 mr-2" />{lastClockIn ? 'Clocked In' : 'Clock In'}
                    </Button>
                    <Button variant="outline" onClick={() => handleManualClock('out')} disabled={clockWorking || !lastClockIn || !!lastClockOut} className="flex-1">
                      <LogOut className="h-4 w-4 mr-2" />{lastClockOut ? 'Clocked Out' : 'Clock Out'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* History table — grouped by date */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Attendance History</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {clockLoading ? (
                <div className="p-4 space-y-2">{[1,2,3].map(i => <div key={i} className="h-10 bg-muted rounded animate-pulse" />)}</div>
              ) : myRecords.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No records yet.</p>
              ) : (() => {
                // Group records by date, pair clock-in and clock-out
                const byDate: Record<string, { date: string; inRec?: AttendanceRecord; outRec?: AttendanceRecord }> = {};
                myRecords.forEach(rec => {
                  const date = rec.timestamp.slice(0, 10);
                  if (!byDate[date]) byDate[date] = { date };
                  if (rec.status === 'in' && !byDate[date].inRec) byDate[date].inRec = rec;
                  if (rec.status === 'out' && !byDate[date].outRec) byDate[date].outRec = rec;
                });
                const allRows = Object.values(byDate).sort((a, b) => b.date.localeCompare(a.date));
                const rows = allRows.slice((histPage - 1) * PAGE_SIZE, histPage * PAGE_SIZE);
                return (
                  <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/40">
                          <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Name</th>
                          <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Role</th>
                          <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Date</th>
                          <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Clock In</th>
                          <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Clock Out</th>
                          <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Status</th>
                          <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Method</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {rows.map(row => {
                          const rec = row.inRec ?? row.outRec;
                          const fullName = rec?.user ? `${rec.user.first_name} ${rec.user.last_name}` : '—';
                          const role = rec?.user?.role ?? '—';
                          const position = rec?.staff?.position ?? '';
                          const isLate = row.inRec?.is_late ?? false;
                          const lateMin = row.inRec?.late_minutes ?? 0;
                          const method = row.inRec?.method ?? row.outRec?.method ?? '—';
                          return (
                            <tr key={row.date} className="hover:bg-muted/20 transition-colors">
                              <td className="px-4 py-3">
                                <p className="font-medium text-sm">{fullName}</p>
                                {position && <p className="text-xs text-muted-foreground">{position}</p>}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                                  role === 'admin' ? 'bg-purple-100 text-purple-700'
                                  : role === 'staff' ? 'bg-blue-100 text-blue-700'
                                  : 'bg-green-100 text-green-700'
                                }`}>{role}</span>
                              </td>
                              <td className="px-4 py-3 font-medium text-sm">{fmtDate(row.date)}</td>
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
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">{lateMin}m late</span>
                                ) : (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">On time</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-xs text-muted-foreground capitalize">{method}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <Paginator page={histPage} total={allRows.length} onChange={setHistPage} />
                  </>
                );
              })()}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─────────────── MARK STUDENTS ─────────────── */}
      {activeTab === 'mark' && (
        <div className="space-y-4">

          {/* My subjects as clickable cards */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">My Subjects</p>
            {mySubjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">No subjects assigned to you.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {mySubjects.map(sub => (
                  <button key={sub.id} onClick={() => { setSelectedSubject(sub); setStudentStatuses({}); setSessions([]); setStuPage(1); }}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      selectedSubject?.id === sub.id
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-muted border-border'
                    }`}>
                    {sub.name}
                    <span className="ml-1.5 text-xs opacity-70">({sub.course_code})</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filters: semester + date */}
          {selectedSubject && (
            <Card>
              <CardContent className="pt-4 flex flex-wrap gap-3 items-center">
                <Select value={selectedSemester || 'all'} onValueChange={v => setSelectedSemester(v === 'all' ? '' : v)}>
                  <SelectTrigger className="w-48"><SelectValue placeholder="Semester" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All semesters</SelectItem>
                    {semesters.map(s => <SelectItem key={s.id} value={s.id}>{s.name} — {s.academic_year}</SelectItem>)}
                  </SelectContent>
                </Select>

                <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                  className="border rounded-md px-3 py-1.5 text-sm bg-background" />

                <Button variant="outline" size="sm" onClick={handleCreateSession} disabled={markLoading}>
                  <Calendar className="h-4 w-4 mr-1.5" />
                  {sessionForDate ? 'Session recorded' : 'Start session'}
                </Button>

                <Button variant={stuCameraOpen ? 'default' : 'outline'} size="sm"
                  onClick={() => { setStuCameraOpen(v => !v); setStuFpOpen(false); setStuFpMsg(''); }}>
                  <Camera className="h-4 w-4 mr-1.5" />{stuCameraOpen ? 'Close Camera' : 'Scan Faces'}
                </Button>
                <Button variant={stuFpOpen ? 'default' : 'outline'} size="sm"
                  onClick={() => { setStuFpOpen(v => !v); setStuCameraOpen(false); setStuFpMsg(''); }}>
                  <Fingerprint className="h-4 w-4 mr-1.5" />{stuFpOpen ? 'Close' : 'Fingerprint'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Session chips */}
          {sessions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {sessions.slice(0, 8).map(s => (
                <button key={s.id} onClick={() => setSelectedDate(s.date)}
                  className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                    selectedDate === s.date ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground hover:bg-muted'
                  }`}>
                  {fmtDate(s.date)}{!s.wasHeld ? ' (cancelled)' : ''}
                </button>
              ))}
            </div>
          )}

          {/* Face scanner for students */}
          {stuCameraOpen && selectedSubject && (
            <Card className="border-primary">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Camera className="h-4 w-4 text-primary" />Scan Student Face
                </CardTitle>
                <Button size="icon" variant="ghost" onClick={() => { setStuCameraOpen(false); setStuFaceMsg(''); setLastIdentified(null); }}>
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="relative rounded-lg overflow-hidden bg-black aspect-video max-h-64">
                  <video ref={stuVideoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                  {stuFaceWorking && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <span className="text-white text-sm animate-pulse">Identifying…</span>
                    </div>
                  )}
                </div>
                {stuFaceMsg && (
                  <p className={`text-sm font-medium flex items-center gap-1.5 ${stuFaceMsgType === 'ok' ? 'text-green-700' : 'text-red-600'}`}>
                    {stuFaceMsgType === 'ok' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}{stuFaceMsg}
                  </p>
                )}
                {lastIdentified && <p className="text-xs text-muted-foreground">Last: {lastIdentified} marked present</p>}
                <Button onClick={handleStudentFaceScan} disabled={stuFaceWorking} className="w-full">
                  <Camera className="h-4 w-4 mr-2" />{stuFaceWorking ? 'Identifying…' : 'Scan Face'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Fingerprint scanner for students */}
          {stuFpOpen && selectedSubject && (
            <Card className="border-primary">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Fingerprint className="h-4 w-4 text-primary" />Student Fingerprint
                </CardTitle>
                <Button size="icon" variant="ghost" onClick={() => { setStuFpOpen(false); setStuFpMsg(''); setFingerprintStudentUserId(''); }}>
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Select the student, then ask them to place their finger on the sensor.
                  The student must have their fingerprint registered by an admin first.
                </p>

                <Select value={fingerprintStudentUserId} onValueChange={setFingerprintStudentUserId}>
                  <SelectTrigger><SelectValue placeholder="Select student…" /></SelectTrigger>
                  <SelectContent>
                    {enrolled.map(e => (
                      <SelectItem key={e.student.user.id} value={e.student.user.id}>
                        {e.student.user.first_name} {e.student.user.last_name}
                        <span className="ml-1.5 text-xs text-muted-foreground">({e.student.student_number})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex flex-col items-center gap-4">
                  <div className={`relative w-32 h-32 rounded-full border-4 flex items-center justify-center transition-all duration-300 ${
                    stuFpScanning ? 'border-primary bg-primary/10' : stuFpWorking ? 'border-amber-400 bg-amber-50' : 'border-muted bg-muted/30'
                  }`}>
                    <Fingerprint className={`h-14 w-14 ${stuFpScanning ? 'text-primary animate-pulse' : stuFpWorking ? 'text-amber-500' : 'text-muted-foreground'}`} />
                    {stuFpScanning && <div className="absolute inset-0 rounded-full border-4 border-primary opacity-30 animate-ping" />}
                  </div>

                  {stuFpMsg && (
                    <p className={`text-sm font-medium flex items-center gap-1.5 ${stuFpMsgType === 'ok' ? 'text-green-700' : 'text-red-600'}`}>
                      {stuFpMsgType === 'ok' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}{stuFpMsg}
                    </p>
                  )}

                  <div className="text-center min-h-6">
                    {stuFpScanning && <p className="text-sm font-medium text-primary">Waiting for fingerprint…</p>}
                    {stuFpWorking && !stuFpScanning && <p className="text-sm font-medium text-amber-600">Verifying…</p>}
                    {!stuFpScanning && !stuFpWorking && !stuFpMsg && fingerprintStudentUserId && (
                      <p className="text-sm text-muted-foreground">Ready — ask student to place finger on sensor</p>
                    )}
                  </div>

                  <Button
                    onClick={handleStudentFingerprint}
                    disabled={!fingerprintStudentUserId || stuFpScanning || stuFpWorking}
                    className="w-full max-w-xs"
                  >
                    <Fingerprint className="h-4 w-4 mr-2" />
                    {stuFpScanning ? 'Scanning…' : stuFpWorking ? 'Verifying…' : 'Scan Fingerprint'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Student list */}
          {!selectedSubject ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Users className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm font-medium">Select one of your subjects above</p>
              </CardContent>
            </Card>
          ) : enrolled.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Users className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm font-medium">No enrolled students in {selectedSubject.name}</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-base">{selectedSubject.name} · {fmtDate(selectedDate)}</CardTitle>
                  <div className="flex gap-3 text-sm">
                    <span className="text-green-600 font-medium">{Object.values(studentStatuses).filter(s => s === 'present').length} present</span>
                    <span className="text-amber-600 font-medium">{Object.values(studentStatuses).filter(s => s === 'late').length} late</span>
                    <span className="text-red-600 font-medium">{enrolled.filter(e => !studentStatuses[e.student.id]).length} awaiting</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {enrolled.slice((stuPage - 1) * PAGE_SIZE, stuPage * PAGE_SIZE).map((e, idx) => {
                    const st = studentStatuses[e.student.id];
                    const globalIdx = (stuPage - 1) * PAGE_SIZE + idx + 1;
                    return (
                      <div key={e.id} className={`flex items-center gap-4 px-4 py-3 transition-colors ${st === 'present' ? 'bg-green-50/50' : ''}`}>
                        <span className="text-xs text-muted-foreground w-6 text-right">{globalIdx}</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{e.student.user.first_name} {e.student.user.last_name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{e.student.student_number}</p>
                        </div>
                        {st ? (
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[st] ?? 'bg-muted text-muted-foreground'}`}>
                            {st.charAt(0).toUpperCase() + st.slice(1)}
                          </span>
                        ) : (
                          <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-muted/60 text-muted-foreground">Awaiting</span>
                        )}
                      </div>
                    );
                  })}
                </div>
                <Paginator page={stuPage} total={enrolled.length} onChange={setStuPage} />
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

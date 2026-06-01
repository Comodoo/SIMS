'use client';

/**
 * Admin — Biometric Enrollment
 * Register fingerprint (WebAuthn) for staff and face photos for students.
 * This is a one-time setup per person. Students visit the PC; staff use their phone.
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { mutate as mutation, query } from '@/lib/graphql';
import { captureFrame, isWebAuthnAvailable, runWebAuthnRegistration, startCamera, stopCamera } from '@/lib/webauthn';
import { AlertCircle, Camera, CheckCircle, Copy, Fingerprint, Link, Users, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

// ---------------------------------------------------------------------------
// GraphQL
// ---------------------------------------------------------------------------
const STAFF_QUERY = `
  query EnrollStaff {
    staffMembers(limit: 200) {
      id staff_number position
      user { id first_name last_name email }
    }
  }
`;

const STUDENTS_QUERY = `
  query EnrollStudents {
    students(limit: 500) {
      id student_number
      user { id first_name last_name }
    }
  }
`;

const BIOMETRIC_STATUS_QUERY = `
  query BioStatus($userId: ID!) {
    biometricStatus(userId: $userId) { hasWebauthn hasFace }
  }
`;

const WEBAUTHN_BEGIN = `
  mutation BeginRegister($userId: ID!) {
    webauthnBeginRegister(userId: $userId)
  }
`;

const WEBAUTHN_COMPLETE = `
  mutation CompleteRegister($userId: ID!, $credentialJson: String!) {
    webauthnCompleteRegister(userId: $userId, credentialJson: $credentialJson)
  }
`;

const REGISTER_FACE = `
  mutation RegisterFace($userId: ID!, $imageBase64: String!) {
    registerFace(userId: $userId, imageBase64: $imageBase64)
  }
`;

const GENERATE_TOKEN = `
  mutation GenToken($userId: ID!, $enrollmentType: String!, $createdById: ID) {
    generateEnrollmentToken(userId: $userId, enrollmentType: $enrollmentType, createdById: $createdById) {
      success message token enrollmentUrl
    }
  }
`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface StaffMember {
  id: string;
  staff_number: string;
  position: string;
  user: { id: string; first_name: string; last_name: string; email: string };
}
interface StudentMember {
  id: string;
  student_number: string;
  user: { id: string; first_name: string; last_name: string };
}
interface BioStatus { hasWebauthn: boolean; hasFace: boolean; }
interface GeneratedLink { userId: string; url: string; copied: boolean; }

// ---------------------------------------------------------------------------
// Small component: status badges
// ---------------------------------------------------------------------------
function BioBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
      ok ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'
    }`}>
      {ok ? <CheckCircle className="h-3 w-3" /> : <span className="h-3 w-3 rounded-full border border-current inline-block" />}
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Camera modal (reusable)
// ---------------------------------------------------------------------------
function CameraModal({
  title,
  onCapture,
  onClose,
  working,
  msg,
  msgType,
}: {
  title: string;
  onCapture: (base64: string) => void;
  onClose: () => void;
  working: boolean;
  msg: string;
  msgType: 'ok' | 'err' | '';
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (!videoRef.current) return;
    startCamera(videoRef.current, 'user')
      .then(s => setStream(s))
      .catch(() => onClose());
    return () => { stopCamera(stream); };
  }, []);

  function handleCapture() {
    if (!videoRef.current) return;
    onCapture(captureFrame(videoRef.current));
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-background rounded-xl shadow-xl w-full max-w-md space-y-4 p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{title}</h3>
          <Button size="icon" variant="ghost" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>

        <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
          <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
          {working && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white text-sm animate-pulse">Processing…</span>
            </div>
          )}
        </div>

        {msg && (
          <p className={`text-sm flex items-center gap-1.5 ${msgType === 'ok' ? 'text-green-700' : 'text-red-600'}`}>
            {msgType === 'ok' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            {msg}
          </p>
        )}

        <div className="flex gap-3">
          <Button onClick={handleCapture} disabled={working} className="flex-1">
            <Camera className="h-4 w-4 mr-2" />
            {working ? 'Processing…' : 'Capture Photo'}
          </Button>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}

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
export default function BiometricEnrollmentPage() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'staff' | 'students'>('staff');
  const [staffPage, setStaffPage] = useState(1);
  const [stuPage, setStuPage] = useState(1);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [studentList, setStudentList] = useState<StudentMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMap, setStatusMap] = useState<Record<string, BioStatus>>({});
  const [webAuthnAvailable, setWebAuthnAvailable] = useState(false);

  // Per-person action state
  const [working, setWorking] = useState<string | null>(null); // userId being processed
  const [msg, setMsg] = useState<{ userId: string; text: string; type: 'ok' | 'err' } | null>(null);
  const [cameraTarget, setCameraTarget] = useState<{ userId: string; name: string } | null>(null);
  const [cameraMsg, setCameraMsg] = useState('');
  const [cameraMsgType, setCameraMsgType] = useState<'ok' | 'err' | ''>('');
  const [cameraWorking, setCameraWorking] = useState(false);

  // Enrollment link state
  const [generatedLinks, setGeneratedLinks] = useState<Record<string, GeneratedLink>>({});
  const [linkWorking, setLinkWorking] = useState<string | null>(null); // userId

  useEffect(() => { setStaffPage(1); setStuPage(1); }, [activeTab]);

  // Load data
  useEffect(() => {
    if (!token) return;
    Promise.all([
      query<any>(STAFF_QUERY, {}, token),
      query<any>(STUDENTS_QUERY, {}, token),
      isWebAuthnAvailable(),
    ]).then(([staffData, studentData, avail]) => {
      const staff: StaffMember[] = staffData.staffMembers ?? [];
      const students: StudentMember[] = studentData.students ?? [];
      setStaffList(staff);
      setStudentList(students);
      setWebAuthnAvailable(avail);

      // Load biometric status for all users
      const allUserIds = [
        ...staff.map(s => s.user.id),
        ...students.map(s => s.user.id),
      ];
      Promise.all(
        allUserIds.map(uid =>
          query<any>(BIOMETRIC_STATUS_QUERY, { userId: uid }, token)
            .then(r => ({ uid, status: r.biometricStatus as BioStatus }))
            .catch(() => ({ uid, status: { hasWebauthn: false, hasFace: false } }))
        )
      ).then(results => {
        const map: Record<string, BioStatus> = {};
        results.forEach(({ uid, status }) => { map[uid] = status; });
        setStatusMap(map);
      });
    }).catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  async function refreshStatus(userId: string) {
    if (!token) return;
    const r = await query<any>(BIOMETRIC_STATUS_QUERY, { userId }, token);
    setStatusMap(prev => ({ ...prev, [userId]: r.biometricStatus }));
  }

  // ── WebAuthn registration ──────────────────────────────────────────────
  async function handleWebAuthnRegister(userId: string) {
    if (!token) return;
    setWorking(userId); setMsg(null);
    try {
      const r1 = await mutation<any>(WEBAUTHN_BEGIN, { userId }, token);
      const optionsJson: string = r1.webauthnBeginRegister;
      const credentialJson = await runWebAuthnRegistration(optionsJson);
      const r2 = await mutation<any>(WEBAUTHN_COMPLETE, { userId, credentialJson }, token);
      const result = JSON.parse(r2.webauthnCompleteRegister as string);
      setMsg({ userId, text: result.message, type: result.success ? 'ok' : 'err' });
      if (result.success) await refreshStatus(userId);
    } catch (e: any) {
      const text = e?.name === 'NotAllowedError' ? 'Fingerprint cancelled' : (e?.message ?? 'Registration failed');
      setMsg({ userId, text, type: 'err' });
    } finally {
      setWorking(null);
    }
  }

  // ── Face registration ──────────────────────────────────────────────────
  async function handleFaceCapture(imageBase64: string) {
    if (!cameraTarget || !token) return;
    setCameraWorking(true); setCameraMsg(''); setCameraMsgType('');
    try {
      const r = await mutation<any>(REGISTER_FACE, { userId: cameraTarget.userId, imageBase64 }, token);
      const result = JSON.parse(r.registerFace as string);
      setCameraMsg(result.message);
      setCameraMsgType(result.success ? 'ok' : 'err');
      if (result.success) await refreshStatus(cameraTarget.userId);
    } catch {
      setCameraMsg('Network error'); setCameraMsgType('err');
    } finally {
      setCameraWorking(false);
    }
  }

  // ── Enrollment link ────────────────────────────────────────────────────
  async function handleGenerateLink(userId: string, enrollmentType: string) {
    if (!token) return;
    setLinkWorking(userId);
    try {
      const r = await mutation<any>(GENERATE_TOKEN, { userId, enrollmentType }, token);
      const res = r.generateEnrollmentToken;
      if (res?.success && res.enrollmentUrl) {
        setGeneratedLinks(prev => ({ ...prev, [userId]: { userId, url: res.enrollmentUrl, copied: false } }));
      } else {
        setMsg({ userId, text: res?.message ?? 'Failed to generate link', type: 'err' });
      }
    } catch { setMsg({ userId, text: 'Network error', type: 'err' }); }
    finally { setLinkWorking(null); }
  }

  async function copyLink(userId: string, url: string) {
    await navigator.clipboard.writeText(url);
    setGeneratedLinks(prev => ({ ...prev, [userId]: { ...prev[userId], copied: true } }));
    setTimeout(() => setGeneratedLinks(prev => ({ ...prev, [userId]: { ...prev[userId], copied: false } })), 2000);
  }

  const pagedStaffList = staffList.slice((staffPage - 1) * PAGE_SIZE, staffPage * PAGE_SIZE);
  const pagedStudentList = studentList.slice((stuPage - 1) * PAGE_SIZE, stuPage * PAGE_SIZE);

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Camera modal */}
      {cameraTarget && (
        <CameraModal
          title={`Register face — ${cameraTarget.name}`}
          onCapture={handleFaceCapture}
          onClose={() => { setCameraTarget(null); setCameraMsg(''); setCameraMsgType(''); }}
          working={cameraWorking}
          msg={cameraMsg}
          msgType={cameraMsgType}
        />
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Biometric Enrollment</h1>
        <p className="text-muted-foreground">Register fingerprints and face photos for attendance</p>
      </div>

      {/* Info banner */}
      <div className="rounded-lg border bg-blue-50 border-blue-200 p-4 text-sm text-blue-800 space-y-1">
        <p className="font-semibold">How enrollment works</p>
        <ul className="list-disc list-inside space-y-0.5 text-blue-700">
          <li><strong>Staff fingerprint:</strong> Staff opens this page on their phone → admin clicks Register Fingerprint → phone prompts fingerprint sensor.</li>
          <li><strong>Student face:</strong> Student sits in front of the classroom PC webcam → admin clicks Register Face → camera captures photo.</li>
          <li>Each person only needs to be enrolled once.</li>
        </ul>
        {!webAuthnAvailable && (
          <p className="text-amber-700 font-medium mt-2">⚠ WebAuthn not detected on this device. Use a phone or device with a fingerprint sensor for staff enrollment.</p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['staff', 'students'] as const).map(tab => (
          <Button key={tab} variant={activeTab === tab ? 'default' : 'outline'} size="sm" onClick={() => setActiveTab(tab)}>
            {tab === 'staff'
              ? <><Fingerprint className="h-4 w-4 mr-1.5" />Staff</>
              : <><Users className="h-4 w-4 mr-1.5" />Students</>
            }
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-14 bg-muted rounded-lg animate-pulse" />)}</div>
      ) : activeTab === 'staff' ? (

        /* ── Staff list ──────────────────────────────────────────────── */
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Staff Members ({staffList.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {pagedStaffList.map(s => {
                const bio = statusMap[s.user.id] ?? { hasWebauthn: false, hasFace: false };
                const isWorking = working === s.user.id;
                const userMsg = msg?.userId === s.user.id ? msg : null;
                return (
                  <div key={s.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <div className="flex-1 min-w-48">
                      <p className="text-sm font-medium">{s.user.first_name} {s.user.last_name}</p>
                      <p className="text-xs text-muted-foreground">{s.staff_number} · {s.position}</p>
                    </div>
                    <div className="flex gap-2 items-center flex-wrap">
                      <BioBadge ok={bio.hasWebauthn} label="Fingerprint" />
                      <BioBadge ok={bio.hasFace} label="Face" />
                    </div>
                    {userMsg && (
                      <p className={`text-xs w-full ${userMsg.type === 'ok' ? 'text-green-700' : 'text-red-600'}`}>
                        {userMsg.text}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={bio.hasWebauthn ? 'outline' : 'default'}
                        disabled={isWorking}
                        onClick={() => handleWebAuthnRegister(s.user.id)}
                      >
                        <Fingerprint className="h-3.5 w-3.5 mr-1.5" />
                        {isWorking ? 'Waiting…' : bio.hasWebauthn ? 'Re-register Fingerprint' : 'Register Fingerprint'}
                      </Button>
                      <Button
                        size="sm"
                        variant={bio.hasFace ? 'outline' : 'secondary'}
                        onClick={() => { setCameraTarget({ userId: s.user.id, name: `${s.user.first_name} ${s.user.last_name}` }); setCameraMsg(''); setCameraMsgType(''); }}
                      >
                        <Camera className="h-3.5 w-3.5 mr-1.5" />
                        {bio.hasFace ? 'Update Face' : 'Register Face'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={linkWorking === s.user.id}
                        onClick={() => handleGenerateLink(s.user.id, 'both')}
                      >
                        <Link className="h-3.5 w-3.5 mr-1.5" />
                        Send Link
                      </Button>
                    </div>

                    {/* Generated link display */}
                    {generatedLinks[s.user.id] && (
                      <div className="w-full flex items-center gap-2 mt-1 p-2 rounded-md bg-muted/50 border text-xs">
                        <span className="flex-1 truncate font-mono text-muted-foreground">{generatedLinks[s.user.id].url}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 text-xs"
                          onClick={() => copyLink(s.user.id, generatedLinks[s.user.id].url)}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          {generatedLinks[s.user.id].copied ? 'Copied!' : 'Copy'}
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <Paginator page={staffPage} total={staffList.length} onChange={setStaffPage} />
          </CardContent>
        </Card>

      ) : (

        /* ── Student list ────────────────────────────────────────────── */
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Students ({studentList.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {pagedStudentList.map(s => {
                const bio = statusMap[s.user.id] ?? { hasWebauthn: false, hasFace: false };
                return (
                  <div key={s.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <div className="flex-1 min-w-48">
                      <p className="text-sm font-medium">{s.user.first_name} {s.user.last_name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{s.student_number}</p>
                    </div>
                    <BioBadge ok={bio.hasFace} label="Face" />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={bio.hasFace ? 'outline' : 'default'}
                        onClick={() => { setCameraTarget({ userId: s.user.id, name: `${s.user.first_name} ${s.user.last_name}` }); setCameraMsg(''); setCameraMsgType(''); }}
                      >
                        <Camera className="h-3.5 w-3.5 mr-1.5" />
                        {bio.hasFace ? 'Update Face' : 'Register Face'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={linkWorking === s.user.id}
                        onClick={() => handleGenerateLink(s.user.id, 'face')}
                      >
                        <Link className="h-3.5 w-3.5 mr-1.5" />
                        Send Link
                      </Button>
                    </div>

                    {generatedLinks[s.user.id] && (
                      <div className="w-full flex items-center gap-2 mt-1 p-2 rounded-md bg-muted/50 border text-xs">
                        <span className="flex-1 truncate font-mono text-muted-foreground">{generatedLinks[s.user.id].url}</span>
                        <Button
                          size="sm" variant="ghost" className="h-6 px-2 text-xs"
                          onClick={() => copyLink(s.user.id, generatedLinks[s.user.id].url)}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          {generatedLinks[s.user.id].copied ? 'Copied!' : 'Copy'}
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <Paginator page={stuPage} total={studentList.length} onChange={setStuPage} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

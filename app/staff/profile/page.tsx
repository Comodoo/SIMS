'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { mutate as mutation, query } from '@/lib/graphql';
import {
  captureFrame, isWebAuthnAvailable,
  runWebAuthnRegistration, startCamera, stopCamera,
} from '@/lib/webauthn';
import { AlertCircle, Camera, CheckCircle, Fingerprint, Loader2, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

// ---------------------------------------------------------------------------
// GraphQL
// ---------------------------------------------------------------------------
const PROFILE_QUERY = `
  query StaffProfile($userId: ID!) {
    staffByUser(userId: $userId) {
      id staff_number position
      user { id first_name last_name email }
    }
    biometricStatus(userId: $userId) { hasWebauthn hasFace }
  }
`;

const WEBAUTHN_BEGIN = `
  mutation BeginReg($userId: ID!) { webauthnBeginRegister(userId: $userId) }
`;
const WEBAUTHN_COMPLETE = `
  mutation CompleteReg($userId: ID!, $credentialJson: String!) {
    webauthnCompleteRegister(userId: $userId, credentialJson: $credentialJson)
  }
`;
const REGISTER_FACE = `
  mutation RegFace($userId: ID!, $imageBase64: String!) {
    registerFace(userId: $userId, imageBase64: $imageBase64)
  }
`;
const BIOMETRIC_STATUS = `
  query BioStatus($userId: ID!) {
    biometricStatus(userId: $userId) { hasWebauthn hasFace }
  }
`;

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function StaffProfilePage() {
  const { token, user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [staffInfo, setStaffInfo] = useState<any>(null);
  const [hasWebAuthn, setHasWebAuthn] = useState(false);
  const [hasFace, setHasFace] = useState(false);
  const [webAuthnAvailable, setWebAuthnAvailable] = useState(false);

  // Fingerprint state
  const [fpWorking, setFpWorking] = useState(false);
  const [fpMsg, setFpMsg] = useState('');
  const [fpMsgType, setFpMsgType] = useState<'ok' | 'err' | ''>('');

  // Face state
  const [faceWorking, setFaceWorking] = useState(false);
  const [faceMsg, setFaceMsg] = useState('');
  const [faceMsgType, setFaceMsgType] = useState<'ok' | 'err' | ''>('');
  const [cameraOpen, setCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Load profile
  useEffect(() => {
    if (!user || !token) return;
    Promise.all([
      query<any>(PROFILE_QUERY, { userId: user.id }, token),
      isWebAuthnAvailable(),
    ]).then(([data, avail]) => {
      setStaffInfo(data.staffByUser);
      setHasWebAuthn(data.biometricStatus?.hasWebauthn ?? false);
      setHasFace(data.biometricStatus?.hasFace ?? false);
      setWebAuthnAvailable(avail);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user, token]);

  // Camera lifecycle
  useEffect(() => {
    if (!cameraOpen) { stopCamera(stream); setStream(null); return; }
    if (!videoRef.current) return;
    startCamera(videoRef.current, 'user')
      .then(s => setStream(s))
      .catch(() => { setFaceMsg('Cannot access camera'); setFaceMsgType('err'); setCameraOpen(false); });
  }, [cameraOpen]);

  async function refreshBioStatus() {
    if (!user || !token) return;
    const r = await query<any>(BIOMETRIC_STATUS, { userId: user.id }, token);
    setHasWebAuthn(r.biometricStatus?.hasWebauthn ?? false);
    setHasFace(r.biometricStatus?.hasFace ?? false);
  }

  // ── Fingerprint ──────────────────────────────────────────────────────
  async function handleFingerprint() {
    if (!user || !token || fpWorking) return;
    setFpWorking(true); setFpMsg(''); setFpMsgType('');
    try {
      const r1 = await mutation<any>(WEBAUTHN_BEGIN, { userId: user.id }, token);
      const optionsJson: string = r1.webauthnBeginRegister;
      setFpMsg('Follow the prompt on your device…');
      const credentialJson = await runWebAuthnRegistration(optionsJson);
      const r2 = await mutation<any>(WEBAUTHN_COMPLETE, { userId: user.id, credentialJson }, token);
      const result = JSON.parse(r2.webauthnCompleteRegister as string);
      setFpMsg(result.message);
      setFpMsgType(result.success ? 'ok' : 'err');
      if (result.success) await refreshBioStatus();
    } catch (e: any) {
      setFpMsg(e?.name === 'NotAllowedError' ? 'Scan cancelled — try again' : (e?.message ?? 'Failed'));
      setFpMsgType('err');
    } finally {
      setFpWorking(false);
    }
  }

  // ── Face ─────────────────────────────────────────────────────────────
  async function handleFaceCapture() {
    if (!videoRef.current || !user || !token || faceWorking) return;
    setFaceWorking(true); setFaceMsg(''); setFaceMsgType('');
    try {
      const imageBase64 = captureFrame(videoRef.current);
      const r = await mutation<any>(REGISTER_FACE, { userId: user.id, imageBase64 }, token);
      const result = JSON.parse(r.registerFace as string);
      setFaceMsg(result.message);
      setFaceMsgType(result.success ? 'ok' : 'err');
      if (result.success) { setCameraOpen(false); await refreshBioStatus(); }
    } catch { setFaceMsg('Network error'); setFaceMsgType('err'); }
    finally { setFaceWorking(false); }
  }

  // ── Render ──────────────────────────────────────────────────────────
  if (loading) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground">Manage your account and biometric registration</p>
      </div>

      {/* Profile info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4" />Account Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">{staffInfo?.user.first_name} {staffInfo?.user.last_name}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Staff Number</span><span className="font-mono">{staffInfo?.staff_number}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Position</span><span>{staffInfo?.position}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{staffInfo?.user.email}</span></div>
        </CardContent>
      </Card>

      {/* Fingerprint */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Fingerprint className="h-4 w-4" />
            Fingerprint (Clock-In)
            <Badge variant="outline" className={`ml-auto text-xs ${hasWebAuthn ? 'text-green-700 border-green-300 bg-green-50' : 'text-muted-foreground'}`}>
              {hasWebAuthn ? 'Registered' : 'Not registered'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!webAuthnAvailable ? (
            <p className="text-sm text-amber-600">
              Fingerprint sensor not detected on this device. Open this page on your phone to register.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {hasWebAuthn
                ? 'Your fingerprint is registered. You can re-register to update it.'
                : 'Register your fingerprint to clock in using your phone sensor instead of entering your password.'}
            </p>
          )}
          {fpMsg && (
            <p className={`text-sm flex items-center gap-1.5 ${fpMsgType === 'ok' ? 'text-green-700' : 'text-red-600'}`}>
              {fpMsgType === 'ok' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              {fpMsg}
            </p>
          )}
          <Button
            disabled={fpWorking || !webAuthnAvailable}
            onClick={handleFingerprint}
            variant={hasWebAuthn ? 'outline' : 'default'}
            className="w-full"
          >
            {fpWorking
              ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Waiting for fingerprint…</>
              : <><Fingerprint className="h-4 w-4 mr-2" />{hasWebAuthn ? 'Re-register Fingerprint' : 'Register Fingerprint'}</>
            }
          </Button>
        </CardContent>
      </Card>

      {/* Face */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Face Photo
            <Badge variant="outline" className={`ml-auto text-xs ${hasFace ? 'text-green-700 border-green-300 bg-green-50' : 'text-muted-foreground'}`}>
              {hasFace ? 'Registered' : 'Not registered'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {hasFace ? 'Your face photo is registered.' : 'Register your face so the system can identify you via camera.'}
          </p>

          {cameraOpen && (
            <>
              <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
                <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                {faceWorking && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white text-sm animate-pulse">Processing…</span>
                  </div>
                )}
              </div>
              {faceMsg && (
                <p className={`text-sm flex items-center gap-1.5 ${faceMsgType === 'ok' ? 'text-green-700' : 'text-red-600'}`}>
                  {faceMsgType === 'ok' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  {faceMsg}
                </p>
              )}
              <div className="flex gap-2">
                <Button className="flex-1" disabled={faceWorking} onClick={handleFaceCapture}>
                  <Camera className="h-4 w-4 mr-2" />
                  {faceWorking ? 'Processing…' : 'Capture Photo'}
                </Button>
                <Button variant="outline" onClick={() => setCameraOpen(false)}>Cancel</Button>
              </div>
            </>
          )}

          {!cameraOpen && (
            <Button variant={hasFace ? 'outline' : 'secondary'} className="w-full" onClick={() => setCameraOpen(true)}>
              <Camera className="h-4 w-4 mr-2" />{hasFace ? 'Update Face Photo' : 'Register Face Photo'}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

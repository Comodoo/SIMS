/**
 * WebAuthn (FIDO2) browser utilities.
 * Handles ArrayBuffer ↔ base64url conversion required by the WebAuthn API.
 * Works with phone fingerprint sensors, Touch ID, Windows Hello, and USB scanners.
 */

// ---------------------------------------------------------------------------
// Base64URL encoding / decoding (WebAuthn uses base64url, NOT standard base64)
// ---------------------------------------------------------------------------

export function base64URLToBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
  const binary = atob(padded);
  const buffer = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) buffer[i] = binary.charCodeAt(i);
  return buffer.buffer;
}

export function bufferToBase64URL(buffer: ArrayBuffer | ArrayBufferLike): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach(b => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// ---------------------------------------------------------------------------
// WebAuthn support detection
// ---------------------------------------------------------------------------

export async function isWebAuthnAvailable(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!window.PublicKeyCredential) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Registration ceremony  (admin runs once per instructor)
// optionsJson  ← from webauthnBeginRegister mutation
// returns credentialJson ← pass to webauthnCompleteRegister mutation
// ---------------------------------------------------------------------------

export async function runWebAuthnRegistration(optionsJson: string): Promise<string> {
  const options = JSON.parse(optionsJson) as any;

  // Convert base64url strings → ArrayBuffers (required by browser API)
  options.challenge = base64URLToBuffer(options.challenge);
  options.user.id = base64URLToBuffer(options.user.id);
  if (options.excludeCredentials) {
    options.excludeCredentials = options.excludeCredentials.map((c: any) => ({
      ...c,
      id: base64URLToBuffer(c.id),
    }));
  }

  const credential = (await navigator.credentials.create({
    publicKey: options,
  })) as PublicKeyCredential;

  const response = credential.response as AuthenticatorAttestationResponse;

  return JSON.stringify({
    id: credential.id,
    rawId: bufferToBase64URL(credential.rawId),
    type: credential.type,
    response: {
      clientDataJSON: bufferToBase64URL(response.clientDataJSON),
      attestationObject: bufferToBase64URL(response.attestationObject),
    },
  });
}

// ---------------------------------------------------------------------------
// Authentication ceremony  (instructor clock-in / clock-out)
// optionsJson  ← from webauthnBeginAuth mutation
// returns credentialJson ← pass to webauthnCompleteClockIn mutation
// ---------------------------------------------------------------------------

export async function runWebAuthnAuthentication(optionsJson: string): Promise<string> {
  const options = JSON.parse(optionsJson) as any;

  options.challenge = base64URLToBuffer(options.challenge);
  if (options.allowCredentials) {
    options.allowCredentials = options.allowCredentials.map((c: any) => ({
      ...c,
      id: base64URLToBuffer(c.id),
    }));
  }

  const credential = (await navigator.credentials.get({
    publicKey: options,
  })) as PublicKeyCredential;

  const response = credential.response as AuthenticatorAssertionResponse;

  return JSON.stringify({
    id: credential.id,
    rawId: bufferToBase64URL(credential.rawId),
    type: credential.type,
    response: {
      clientDataJSON: bufferToBase64URL(response.clientDataJSON),
      authenticatorData: bufferToBase64URL(response.authenticatorData),
      signature: bufferToBase64URL(response.signature),
      userHandle: response.userHandle ? bufferToBase64URL(response.userHandle) : null,
    },
  });
}

// ---------------------------------------------------------------------------
// Camera helpers  (face recognition for student attendance)
// ---------------------------------------------------------------------------

export async function startCamera(
  videoEl: HTMLVideoElement,
  facingMode: 'user' | 'environment' = 'user',
): Promise<MediaStream> {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode, width: { ideal: 640 }, height: { ideal: 480 } },
  });
  videoEl.srcObject = stream;
  await videoEl.play();
  return stream;
}

export function stopCamera(stream: MediaStream | null) {
  stream?.getTracks().forEach(t => t.stop());
}

export function captureFrame(video: HTMLVideoElement, quality = 0.85): string {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  canvas.getContext('2d')!.drawImage(video, 0, 0);
  return canvas.toDataURL('image/jpeg', quality);
}

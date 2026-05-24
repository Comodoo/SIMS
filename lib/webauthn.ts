/**
 * WebAuthn Biometric Authentication Integration
 * 
 * This module handles biometric fingerprint authentication using the WebAuthn API.
 * It enables:
 * - Fingerprint registration during onboarding
 * - Fingerprint-based clock-in/out for staff
 * - Prevention of "buddy punching" and time theft
 * 
 * Requirements from schema.txt:
 * "Registration: During onboarding, a staff member's fingerprint is scanned.
 * The scanner converts the fingerprint into a unique mathematical string (not an image).
 * This is stored as the biometric_hash in the Users table.
 * 
 * Clock-in/Out Flow:
 * Staff arrives and scans their finger.
 * The system identifies the user and checks the current_time against the Shift_Start_Time.
 * Late Detection: If they are 15 minutes past the start time, Django logic sets is_late = True.
 * A new entry is created in the Attendance table with the user_id, timestamp, and status.
 * 
 * Data Integrity: Because the biometric_hash is unique and tied to the hardware/WebAuthn API,
 * no other person can clock in for them."
 * 
 * IMPLEMENTATION NEEDED:
 * 1. Implement WebAuthn registration on the backend (Django)
 * 2. Use django-fido or similar library for WebAuthn support
 * 3. Store credential ID and public key in the database
 * 4. Implement WebAuthn authentication for clock-in/out
 * 5. Handle device compatibility (Windows Hello, Touch ID, etc.)
 */

interface WebAuthnCredential {
  id: string;
  publicKey: string;
  userId: string;
}

interface RegistrationResult {
  success: boolean;
  credentialId?: string;
  error?: string;
}

interface AuthenticationResult {
  success: boolean;
  userId?: string;
  error?: string;
}

class WebAuthnService {
  private isSupported: boolean = false;

  constructor() {
    this.isSupported = this.checkSupport();
  }

  private checkSupport(): boolean {
    return (
      typeof window !== 'undefined' &&
      window.PublicKeyCredential !== undefined &&
      typeof window.PublicKeyCredential === 'function' &&
      typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function'
    );
  }

  async isAvailable(): Promise<boolean> {
    if (!this.isSupported) {
      return false;
    }
    try {
      const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      return available;
    } catch (error) {
      console.error('Error checking WebAuthn availability:', error);
      return false;
    }
  }

  async register(userId: string, username: string): Promise<RegistrationResult> {
    // TODO: Implement WebAuthn registration
    // This requires:
    // 1. Generate registration challenge from backend
    // 2. Call navigator.credentials.create() with WebAuthn options
    // 3. Send credential response to backend for verification
    // 4. Store credential ID and public key in database
    
    console.log('Registering biometric for user:', userId, username);
    
    if (!this.isSupported) {
      return {
        success: false,
        error: 'WebAuthn is not supported on this device',
      };
    }

    // Placeholder implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate successful registration
        resolve({
          success: true,
          credentialId: `credential-${userId}-${Date.now()}`,
        });
      }, 1000);
    });
  }

  async authenticate(challenge: string): Promise<AuthenticationResult> {
    // TODO: Implement WebAuthn authentication
    // This requires:
    // 1. Generate authentication challenge from backend
    // 2. Call navigator.credentials.get() with WebAuthn options
    // 3. Send assertion response to backend for verification
    // 4. Return user ID if authentication successful
    
    console.log('Authenticating with biometric');
    
    if (!this.isSupported) {
      return {
        success: false,
        error: 'WebAuthn is not supported on this device',
      };
    }

    // Placeholder implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate successful authentication
        resolve({
          success: true,
          userId: 'user-123',
        });
      }, 1000);
    });
  }

  async verifyClockIn(userId: string, shiftStartTime: string): Promise<{ success: boolean; isLate?: boolean; error?: string }> {
    // TODO: Implement clock-in verification with late detection
    const currentTime = new Date();
    const shiftStart = new Date(shiftStartTime);
    const lateThresholdMinutes = 15;
    
    const isLate = (currentTime.getTime() - shiftStart.getTime()) > (lateThresholdMinutes * 60 * 1000);
    
    return {
      success: true,
      isLate,
    };
  }
}

// Export singleton instance
export const webauthnService = new WebAuthnService();

// Usage example (to be implemented when backend is ready):
// import { webauthnService } from '@/lib/webauthn';
// 
// const handleBiometricRegistration = async (userId: string, username: string) => {
//   const available = await webauthnService.isAvailable();
//   if (!available) {
//     alert('Biometric authentication is not available on this device.');
//     return;
//   }
//   
//   const result = await webauthnService.register(userId, username);
//   if (result.success) {
//     console.log('Biometric registered successfully:', result.credentialId);
//     // Save credential ID to backend
//   } else {
//     alert('Registration failed: ' + result.error);
//   }
// };
// 
// const handleClockIn = async (userId: string, shiftStartTime: string) => {
//   const result = await webauthnService.authenticate('challenge-from-backend');
//   if (result.success) {
//     const verification = await webauthnService.verifyClockIn(userId, shiftStartTime);
//     if (verification.success) {
//       console.log('Clock-in successful, isLate:', verification.isLate);
//       // Create attendance record in backend
//     }
//   }
// };

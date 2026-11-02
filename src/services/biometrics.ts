/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BiometricProfile } from '../types/sgx';

const STORAGE_KEY = 'lionyield_biometric_profile';

const DEFAULT_PROFILE: BiometricProfile = {
  isConfigured: true,
  isLocked: false,
  pinFallback: '1234',
  useBiometrics: true,
  requireForExport: true,
  autoLockMinutes: 10,
  lastActiveTimestamp: Date.now(),
};

export const getBiometricProfile = (): BiometricProfile => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PROFILE));
      return DEFAULT_PROFILE;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed reading biometric profile', e);
    return DEFAULT_PROFILE;
  }
};

export const saveBiometricProfile = (profile: BiometricProfile): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed saving biometric profile', e);
  }
};

export const isWebAuthnAvailable = async (): Promise<boolean> => {
  try {
    if (window.PublicKeyCredential) {
      if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
        return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      }
      return true;
    }
    return false;
  } catch {
    return false;
  }
};

/**
 * Triggers authentic WebAuthn biometric prompt (Touch ID / Face ID / Windows Hello / Passkey)
 * with robust graceful fallback to PIN verification.
 */
export const authenticateBiometric = async (
  profile: BiometricProfile
): Promise<{ success: boolean; method: 'webauthn' | 'pin'; error?: string }> => {
  if (profile.useBiometrics && window.PublicKeyCredential) {
    try {
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      const credentialRequestOptions: CredentialRequestOptions = {
        publicKey: {
          challenge: challenge,
          timeout: 60000,
          userVerification: 'preferred',
          rpId: window.location.hostname || 'localhost',
        },
      };

      // Real WebAuthn call
      const credential = await navigator.credentials.get(credentialRequestOptions);
      if (credential) {
        return { success: true, method: 'webauthn' };
      }
    } catch (err: unknown) {
      const errorMsg = (err as Error)?.message || 'WebAuthn cancelled or unavailable';
      console.warn('WebAuthn prompt returned or cancelled; fallback available:', errorMsg);
      // Return so caller can show PIN prompt fallback
      return { success: false, method: 'webauthn', error: errorMsg };
    }
  }

  return { success: false, method: 'pin', error: 'Biometrics unavailable' };
};

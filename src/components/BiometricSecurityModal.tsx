/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BiometricProfile } from '../types/sgx';
import { authenticateBiometric, saveBiometricProfile } from '../services/biometrics';
import { Fingerprint, Lock, Unlock, ShieldCheck, KeyRound, AlertCircle, X } from 'lucide-react';

interface BiometricSecurityModalProps {
  profile: BiometricProfile;
  onUpdateProfile: (profile: BiometricProfile) => void;
  isOpen: boolean;
  onClose: () => void;
  reason?: string;
  onSuccess?: () => void;
}

export const BiometricSecurityModal: React.FC<BiometricSecurityModalProps> = ({
  profile,
  onUpdateProfile,
  isOpen,
  onClose,
  reason = 'Authenticate to access secure reports and portfolio holdings',
  onSuccess,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [activeTab, setActiveTab] = useState<'auth' | 'settings'>('auth');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  if (!isOpen) return null;

  const handleBiometricAuth = async () => {
    setIsVerifying(true);
    setErrorMsg(null);
    try {
      const res = await authenticateBiometric(profile);
      if (res.success) {
        const updated = { ...profile, isLocked: false, lastActiveTimestamp: Date.now() };
        onUpdateProfile(updated);
        saveBiometricProfile(updated);
        onSuccess?.();
        onClose();
      } else {
        setErrorMsg('Biometric authentication cancelled. Enter master PIN (Default: 1234).');
      }
    } catch {
      setErrorMsg('Biometrics sensor prompt returned an error. Use PIN fallback.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handlePinAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === profile.pinFallback) {
      const updated = { ...profile, isLocked: false, lastActiveTimestamp: Date.now() };
      onUpdateProfile(updated);
      saveBiometricProfile(updated);
      setPinInput('');
      setErrorMsg(null);
      onSuccess?.();
      onClose();
    } else {
      setErrorMsg('Incorrect PIN. (Default test PIN is 1234)');
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin) {
      if (newPin.length < 4) {
        setErrorMsg('PIN must be at least 4 digits');
        return;
      }
      if (newPin !== confirmPin) {
        setErrorMsg('New PIN and confirmation do not match');
        return;
      }
    }

    const updated: BiometricProfile = {
      ...profile,
      pinFallback: newPin || profile.pinFallback,
    };
    onUpdateProfile(updated);
    saveBiometricProfile(updated);
    setNewPin('');
    setConfirmPin('');
    setErrorMsg(null);
    setActiveTab('auth');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#111827] border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        {/* Close Button */}
        {!profile.isLocked && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Modal Top Lock Indicator */}
        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3 shadow-inner">
            {profile.isLocked ? <Lock className="w-7 h-7" /> : <ShieldCheck className="w-7 h-7" />}
          </div>
          <h2 className="text-lg font-bold text-slate-100">
            {profile.isLocked ? 'LionYield Security Vault Locked' : 'Biometric Security Access'}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">{reason}</p>
        </div>

        {/* Tab selection */}
        {!profile.isLocked && (
          <div className="flex items-center justify-center gap-2 mb-5">
            <button
              onClick={() => {
                setActiveTab('auth');
                setErrorMsg(null);
              }}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                activeTab === 'auth'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Authenticate
            </button>
            <button
              onClick={() => {
                setActiveTab('settings');
                setErrorMsg(null);
              }}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                activeTab === 'settings'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Vault Preferences
            </button>
          </div>
        )}

        {/* Error Notification */}
        {errorMsg && (
          <div className="mb-4 p-2.5 rounded-lg bg-rose-950/70 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {activeTab === 'auth' ? (
          <div className="space-y-4">
            {/* Primary Action: Touch ID / Face ID / WebAuthn */}
            <button
              onClick={handleBiometricAuth}
              disabled={isVerifying}
              className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-bold text-sm shadow-lg transition-all"
            >
              <Fingerprint className="w-5 h-5 text-slate-950" />
              <span>
                {isVerifying ? 'Scanning Fingerprint / Face...' : 'Authenticate with Biometrics'}
              </span>
            </button>

            <div className="flex items-center gap-3 my-3">
              <div className="flex-1 h-px bg-slate-800"></div>
              <span className="text-[11px] text-slate-500 uppercase tracking-wider">
                Or Use Master PIN
              </span>
              <div className="flex-1 h-px bg-slate-800"></div>
            </div>

            {/* PIN Form Fallback */}
            <form onSubmit={handlePinAuth} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1 text-center">
                  Enter 4-Digit Security PIN
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    maxLength={8}
                    placeholder="••••"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-center text-sm tracking-widest font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <span className="text-[10px] text-slate-500 text-center block mt-1">
                  Default developer test PIN: <code className="text-slate-400">1234</code>
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition-colors"
              >
                Unlock Vault with PIN
              </button>
            </form>
          </div>
        ) : (
          /* Vault Settings Tab */
          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div className="space-y-2">
              <label className="flex items-center justify-between text-slate-300">
                <span>Require Biometrics for Exporting Reports</span>
                <input
                  type="checkbox"
                  checked={profile.requireForExport}
                  onChange={(e) =>
                    onUpdateProfile({ ...profile, requireForExport: e.target.checked })
                  }
                  className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                />
              </label>

              <label className="flex items-center justify-between text-slate-300">
                <span>Hardware Biometrics Enabled</span>
                <input
                  type="checkbox"
                  checked={profile.useBiometrics}
                  onChange={(e) =>
                    onUpdateProfile({ ...profile, useBiometrics: e.target.checked })
                  }
                  className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                />
              </label>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <span className="block font-semibold text-slate-300 mb-2">Change Master PIN</span>
              <div className="space-y-2">
                <input
                  type="password"
                  placeholder="New PIN (min 4 digits)"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100"
                />
                <input
                  type="password"
                  placeholder="Confirm New PIN"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-colors"
            >
              Save Vault Preferences
            </button>
          </form>
        )}

        {/* Security Disclaimers */}
        <div className="mt-5 pt-3 border-t border-slate-800/80 text-[10px] text-slate-400 text-center">
          WebAuthn Level 3 FIDO2 Specification · Local Encrypted Key Storage
        </div>
      </div>
    </div>
  );
};

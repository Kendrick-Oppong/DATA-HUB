import React, { useState } from 'react';
import {
  ShieldAlert,
  Lock,
  KeyRound,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Server
} from 'lucide-react';
import { SignalRail } from '../common/SignalRail';

interface AdminPinGateProps {
  onUnlock: () => void;
  onCancel: () => void;
  onOpenSecurityPins?: () => void;
}

export const ADMIN_MASTER_PIN = '0000';
export const ADMIN_SECONDARY_PIN = '7788';

export const AdminPinGate: React.FC<AdminPinGateProps> = ({
  onUnlock,
  onCancel,
  onOpenSecurityPins,
}) => {
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleDigitChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    setError('');
    const newPin = [...pin];
    newPin[index] = val.slice(-1);
    setPin(newPin);

    if (val && index < 3) {
      const nextInput = document.getElementById(`admin-pin-${index + 1}`);
      if (nextInput) nextInput.focus();
    }

    // If 4th digit entered, auto submit
    if (val && index === 3) {
      const completePin = newPin.join('');
      validatePin(completePin);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      const prevInput = document.getElementById(`admin-pin-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const validatePin = (inputPin: string) => {
    if (inputPin === ADMIN_MASTER_PIN || inputPin === ADMIN_SECONDARY_PIN) {
      setIsSuccess(true);
      setError('');
      setTimeout(() => {
        onUnlock();
      }, 700);
    } else {
      setIsShaking(true);
      setError('Access Denied: Incorrect Security Clearance PIN.');
      setTimeout(() => {
        setIsShaking(false);
        setPin(['', '', '', '']);
        const firstInput = document.getElementById('admin-pin-0');
        if (firstInput) firstInput.focus();
      }, 600);
    }
  };

  const handleAutofillDemoPin = () => {
    setPin(['0', '0', '0', '0']);
    validatePin('0000');
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-card border border-border shadow-xl space-y-6 text-center">
        {/* Clearance Shield Visual */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-center shadow-xs">
          {isSuccess ? (
            <CheckCircle2 className="w-8 h-8 text-emerald-500 animate-in zoom-in-50 duration-300" />
          ) : (
            <ShieldAlert className="w-8 h-8" />
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-destructive/15 text-destructive font-bold">
              Restricted Area • Level 3
            </span>
            <SignalRail status="online" size="sm" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
            NOC Operations Clearance
          </h2>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
            Carrier switches, manual float reversals, and wholesale audit require administrative clearance.
          </p>
        </div>

        {/* PIN Inputs */}
        <div className="space-y-3">
          <div className="flex justify-center gap-3">
            {pin.map((digit, idx) => (
              <input
                key={idx}
                id={`admin-pin-${idx}`}
                type="password"
                maxLength={1}
                inputMode="numeric"
                autoFocus={idx === 0}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                disabled={isSuccess}
                className={`w-12 h-14 text-center text-2xl font-black font-mono rounded-2xl border bg-background text-foreground transition-all focus:outline-hidden ${
                  error
                    ? 'border-destructive ring-2 ring-destructive/20'
                    : isSuccess
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                    : 'border-input focus:border-primary focus:ring-2 focus:ring-primary/20'
                } ${isShaking ? 'translate-x-1 animate-pulse' : ''}`}
              />
            ))}
          </div>

          {error && (
            <p className="text-xs font-semibold text-destructive flex items-center justify-center gap-1.5 animate-in fade-in">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{error}</span>
            </p>
          )}

          {isSuccess && (
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1.5 animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Clearance Authorized. Unlocking NOC Console...</span>
            </p>
          )}
        </div>

        {/* Quick Helper Button */}
        <div className="p-3.5 rounded-2xl bg-muted/40 border border-border flex items-center justify-between text-xs">
          <div className="text-left">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block">
              Hardcoded Demo PIN
            </span>
            <span className="font-mono font-bold text-foreground">0000</span>
          </div>
          <button
            type="button"
            onClick={handleAutofillDemoPin}
            className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Use Demo PIN (0000)</span>
          </button>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-border text-xs">
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground font-semibold cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Dashboard</span>
          </button>

          {onOpenSecurityPins && (
            <button
              type="button"
              onClick={onOpenSecurityPins}
              className="text-primary hover:underline font-bold flex items-center gap-1 cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Security PIN Reference</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  KeyRound,
  ShieldCheck,
  Smartphone,
  Lock,
  Copy,
  Check,
  X,
  Sparkles,
  Info
} from 'lucide-react';

interface SecurityPinsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAccount?: (role: 'customer' | 'agent' | 'admin') => void;
}

export const SecurityPinsModal: React.FC<SecurityPinsModalProps> = ({
  isOpen,
  onClose,
  onSelectAccount,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const securityCodes = [
    {
      id: 'admin-pin',
      title: 'Admin NOC Clearance PIN',
      code: '0000',
      description: 'Used for Level-3 NOC Operations, carrier failover simulation, and financial float audit.',
      target: 'Admin Console Gatekeeper',
      badgeColor: 'bg-destructive/15 text-destructive border-destructive/25'
    },
    {
      id: 'agent-pin',
      title: 'Agent Reseller Security PIN',
      code: '1122',
      description: 'Protects Agent commission payouts to Mobile Money and wholesale pricing adjustments.',
      target: 'Agent Hub & Payouts',
      badgeColor: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/25'
    },
    {
      id: 'wallet-pin',
      title: 'Wallet & Debit Transaction PIN',
      code: '2026',
      description: 'Required when debiting wallet for high-value orders or confirming custom bank transfers.',
      target: 'Checkout & Wallet Funding',
      badgeColor: 'bg-primary/15 text-primary border-primary/25'
    },
    {
      id: 'sms-otp',
      title: 'Ghana SMS OTP Simulation Code',
      code: '123456',
      description: 'Universal bypass for SMS 2FA, phone verification, and password reset flows.',
      target: 'Sign Up & Phone Verify',
      badgeColor: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25'
    }
  ];

  const demoAccounts = [
    {
      role: 'customer' as const,
      name: 'Kojo Mensah',
      phone: '024 419 2834',
      badge: 'Customer Portal',
      desc: 'Active buyer with orders history & wallet balance GH₵ 179.00'
    },
    {
      role: 'agent' as const,
      name: 'Kofi Owusu',
      phone: '024 419 2834',
      badge: 'Agent Reseller',
      desc: 'Store owner (Kofi Telecom Express), commission balance GH₵ 185.50'
    },
    {
      role: 'admin' as const,
      name: 'SDH NOC Lead',
      phone: '020 000 0001',
      badge: 'Superadmin NOC',
      desc: 'Carrier switches, float balances, AFA verification, and audit'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-foreground">
                Security PINs & Auth Reference
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Hardcoded demo credentials and access guards for test evaluation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Section: Hardcoded PINs */}
          <div className="space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-primary" />
              <span>Hardcoded Route Guard & Transaction PINs</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {securityCodes.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-muted/40 border border-border space-y-2 hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-foreground text-xs">{item.title}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.badgeColor}`}>
                      {item.code}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                  <div className="pt-2 border-t border-border flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground font-mono">{item.target}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(item.code, item.id)}
                      className="text-primary hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === item.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span className="text-emerald-500">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy PIN</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Preloaded Demo Profiles */}
          <div className="space-y-3 pt-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Preloaded Demo Accounts</span>
            </h3>

            <div className="space-y-2">
              {demoAccounts.map((acc) => (
                <div
                  key={acc.role}
                  className="p-3.5 rounded-2xl bg-card border border-border flex items-center justify-between gap-3 hover:border-primary/40 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground text-xs">{acc.name}</span>
                      <span className="text-[10px] font-mono text-muted-foreground">({acc.phone})</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-primary/10 text-primary">
                        {acc.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{acc.desc}</p>
                  </div>

                  {onSelectAccount && (
                    <button
                      type="button"
                      onClick={() => {
                        onSelectAccount(acc.role);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-xl border border-border text-foreground hover:bg-muted font-bold text-xs shrink-0 cursor-pointer"
                    >
                      Switch to This
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Notice info banner */}
          <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-start gap-2.5 text-[11px] leading-relaxed">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              All security PINs and route guards are strictly enforced in this build. You can lock and unlock Admin operations anytime, test failed PIN shake animations, and inspect real-time SMS OTP auto-completions.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/20 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

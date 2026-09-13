import React, { useState } from "react";
import {
  KeyRound,
  ShieldCheck,
  Smartphone,
  Lock,
  Copy,
  Check,
  Sparkles,
  Info,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";

interface SecurityPinsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAccount?: (role: "customer" | "agent" | "admin") => void;
}

export const SecurityPinsModal: React.FC<SecurityPinsModalProps> = ({
  isOpen,
  onClose,
  onSelectAccount,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const securityCodes = [
    {
      id: "admin-pin",
      title: "Admin NOC Clearance PIN",
      code: "0000",
      description:
        "Used for Level-3 NOC Operations, carrier failover simulation, and financial float audit.",
      target: "Admin Console Gatekeeper",
      badgeColor: "bg-destructive/15 text-destructive border-destructive/25",
    },
    {
      id: "agent-pin",
      title: "Agent Reseller Security PIN",
      code: "1122",
      description:
        "Protects Agent commission payouts to Mobile Money and wholesale pricing adjustments.",
      target: "Agent Hub & Payouts",
      badgeColor: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/25",
    },
    {
      id: "wallet-pin",
      title: "Wallet & Transaction PIN",
      code: "2026",
      description:
        "Required when debiting wallet for high-value orders or confirming custom bank transfers.",
      target: "Checkout & Wallet Funding",
      badgeColor: "bg-primary/15 text-primary border-primary/25",
    },
    {
      id: "sms-otp",
      title: "Ghana SMS OTP Bypass Code",
      code: "4190",
      description:
        "Universal simulation token for SMS 2FA, phone verification, and password reset flows.",
      target: "Sign Up & Phone Verify",
      badgeColor: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
    },
  ];

  const demoAccounts = [
    {
      role: "customer" as const,
      name: "Kojo Mensah",
      phone: "024 419 2834",
      badge: "Customer Portal",
      desc: "Active buyer with orders history & wallet balance GH₵ 179.00",
    },
    {
      role: "agent" as const,
      name: "Kofi Owusu",
      phone: "024 419 2834",
      badge: "Agent Reseller",
      desc: "Store owner (Kofi Telecom Express), commission balance GH₵ 185.50",
    },
    {
      role: "admin" as const,
      name: "SDH NOC Lead",
      phone: "020 000 0001",
      badge: "Superadmin NOC",
      desc: "Carrier switches, float balances, AFA verification, and audit",
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden rounded-3xl border-border">
        {/* Header with gradient */}
        <DialogHeader className="p-6 border-b border-border bg-gradient-to-br from-primary/10 via-card to-card text-left">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary font-bold">
              <KeyRound className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-black text-foreground">
                Security PINs & Auth Reference
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Pre-configured demo credentials and security clearance PINs for test evaluation
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Scroll Area Content */}
        <ScrollArea className="max-h-[70vh] p-6">
          <div className="space-y-6 text-xs pr-1">
            {/* Section 1: Hardcoded PINs */}
            <div className="space-y-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Lock className="size-3.5 text-primary" />
                <span>Security Clearance & Transaction PINs</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {securityCodes.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-muted/30 border border-border space-y-2 hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground text-xs">{item.title}</span>
                      <Badge variant="outline" className={`font-mono text-[11px] font-black px-2 py-0.5 ${item.badgeColor}`}>
                        {item.code}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                    <div className="pt-2 border-t border-border/70 flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground font-mono text-[10px]">{item.target}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(item.code, item.id)}
                        className="text-primary hover:text-primary hover:bg-primary/10 font-bold h-6 px-2 text-xs gap-1"
                      >
                        {copiedKey === item.id ? (
                          <>
                            <Check className="size-3 text-emerald-500" />
                            <span className="text-emerald-500">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="size-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 2: Demo Profiles */}
            <div className="space-y-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-primary" />
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
                        <Badge variant="outline" className="text-[10px] font-bold px-1.5 py-0 bg-primary/10 text-primary border-primary/20">
                          {acc.badge}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{acc.desc}</p>
                    </div>

                    {onSelectAccount && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          onSelectAccount(acc.role);
                          onClose();
                        }}
                        className="text-xs font-bold shrink-0 h-8 rounded-xl hover:bg-primary hover:text-primary-foreground transition-all"
                      >
                        Switch Role
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Info Reassurance */}
            <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-start gap-2.5 text-[11px] leading-relaxed">
              <Info className="size-4 shrink-0 mt-0.5" />
              <span>
                All security PINs and route guards are strictly enforced in this build. You can test failed PIN validation, inspect real-time SMS OTP auto-completions, and switch roles instantly.
              </span>
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <DialogFooter className="p-4 border-t border-border bg-muted/20 flex sm:justify-end">
          <Button
            type="button"
            onClick={onClose}
            className="font-bold text-xs h-9 px-5 rounded-xl cursor-pointer"
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SecurityPinsModal;

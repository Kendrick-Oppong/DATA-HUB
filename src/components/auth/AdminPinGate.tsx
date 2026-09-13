import React, { useState } from "react";
import {
  ShieldAlert,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  KeyRound,
  Lock,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import { Badge } from "../ui/badge";
import { SignalRail } from "../common/SignalRail";

interface AdminPinGateProps {
  onSubmitPin: (pin: string) => void;
  error?: string;
  isSuccess?: boolean;
  onCancel: () => void;
  onOpenSecurityPins?: () => void;
}

export const AdminPinGate: React.FC<AdminPinGateProps> = ({
  onSubmitPin,
  error = "",
  isSuccess = false,
  onCancel,
  onOpenSecurityPins,
}) => {
  const [pin, setPin] = useState(["", "", "", ""]);

  const updateDigit = (index: number, value: string) => {
    if (!/^\d?$/.test(value) || isSuccess) return;
    const next = [...pin];
    next[index] = value;
    setPin(next);
    if (value && index < 3) {
      document.getElementById(`admin-pin-${index + 1}`)?.focus();
    }
    if (value && index === 3) {
      onSubmitPin(next.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      document.getElementById(`admin-pin-${index - 1}`)?.focus();
    }
  };

  const useDemoPin = () => {
    setPin(["0", "0", "0", "0"]);
    onSubmitPin("0000");
  };

  return (
    <div className="flex min-h-[75vh] items-center justify-center p-4">
      <Card className="w-full max-w-md rounded-3xl border border-border bg-card p-2 text-center shadow-xl sm:p-4 overflow-hidden">
        <CardHeader className="space-y-4 pt-6 pb-2">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/10 text-destructive">
            {isSuccess ? (
              <CheckCircle2 className="size-8 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <ShieldAlert className="size-8" />
            )}
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center justify-center gap-2">
              <Badge variant="destructive" className="font-mono text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5">
                Restricted · Level 3
              </Badge>
              <SignalRail status="online" size="sm" />
            </div>
            <h2 className="text-xl font-black tracking-tight sm:text-2xl text-foreground">
              NOC Operations Clearance
            </h2>
            <p className="text-xs leading-relaxed text-muted-foreground max-w-xs">
              Enter the 4-digit NOC security clearance PIN to access carrier operations and financial clearing.
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-2 pb-4">
          <div className="space-y-3">
            <div className="flex justify-center gap-3">
              {pin.map((digit, index) => (
                <Input
                  key={index}
                  id={`admin-pin-${index}`}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  autoFocus={index === 0}
                  value={digit}
                  onChange={(event) => updateDigit(index, event.target.value)}
                  onKeyDown={(event) => handleKeyDown(index, event)}
                  disabled={isSuccess}
                  aria-label={`PIN digit ${index + 1}`}
                  className={`size-12 rounded-2xl p-0 text-center font-mono text-2xl font-black sm:size-14 ${
                    error ? "border-destructive ring-2 ring-destructive/20" : ""
                  }`}
                />
              ))}
            </div>

            {error && (
              <p className="flex items-center justify-center gap-1.5 text-xs font-semibold text-destructive animate-in fade-in-50">
                <AlertTriangle className="size-3.5" />
                <span>{error}</span>
              </p>
            )}

            {isSuccess && (
              <p className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 animate-in fade-in-50">
                <CheckCircle2 className="size-3.5" />
                <span>Clearance authorized. Connecting to carrier rails...</span>
              </p>
            )}
          </div>

          {/* Quick Demo Access Bar */}
          <div className="flex items-center justify-between rounded-2xl border border-border bg-muted/40 p-3.5 text-left">
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Demo clearance PIN
              </span>
              <span className="font-mono font-bold text-sm text-foreground">0000</span>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={useDemoPin}
              className="gap-1.5 font-bold text-xs"
            >
              <Sparkles className="size-3.5 text-primary" />
              <span>Use demo PIN</span>
            </Button>
          </div>
        </CardContent>

        <CardFooter className="flex items-center justify-between border-t border-border pt-4 text-xs">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="gap-1.5 font-semibold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            <span>Return to dashboard</span>
          </Button>

          {onOpenSecurityPins && (
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={onOpenSecurityPins}
              className="gap-1.5 font-semibold text-primary p-0 h-auto"
            >
              <KeyRound className="size-3.5" />
              <span>PIN Reference</span>
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default AdminPinGate;

import React, { useState } from "react";
import {
  User,
  ShieldCheck,
  CheckCircle2,
  Palette,
  Check,
  Lock,
  Laptop,
} from "lucide-react";
import { AppTheme } from "../../../types";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";

interface CustomerProfileViewProps {
  theme: AppTheme;
  onSetTheme?: (theme: AppTheme) => void;
  onOpenSecurityPins?: () => void;
}

export const CustomerProfileView: React.FC<CustomerProfileViewProps> = ({
  theme,
  onSetTheme,
  onOpenSecurityPins,
}) => {
  const [profileSaved, setProfileSaved] = useState(false);
  const [currentPinInput, setCurrentPinInput] = useState("2026");
  const [newPinInput, setNewPinInput] = useState("");
  const [pinChangeSuccess, setPinChangeSuccess] = useState(false);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="border-b border-border pb-4">
        <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-foreground">
          <User className="size-6 text-primary" />
          <span>Profile, Security & Preferences</span>
        </h1>

        <p className="mt-0.5 text-xs text-muted-foreground">
          Manage personal identity, Ghana Card KYC, transaction security PINs,
          and theme styles.
        </p>
      </div>

      {profileSaved && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/15 p-4 text-xs font-bold text-emerald-700 animate-in fade-in dark:text-emerald-400">
          <CheckCircle2 className="size-4" />

          <span>
            Profile information successfully saved and synced with SDH identity
            services.
          </span>
        </div>
      )}

      {/* Personal Information */}
      <div className="space-y-5 rounded-3xl border border-border bg-card p-6 text-xs shadow-xs">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-extrabold text-foreground">
            <User className="size-4 text-primary" />
            <span>Personal & Ghana Card Verification</span>
          </h3>

          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
            <ShieldCheck className="size-3.5" />
            <span>Verified Subscriber</span>
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="profile-name">Full Legal Name</Label>

            <Input
              id="profile-name"
              type="text"
              defaultValue="Kendrick Oppong"
              className="font-medium"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-mobile">Primary Mobile Number</Label>

            <Input
              id="profile-mobile"
              type="tel"
              defaultValue="0244192834"
              className="font-medium tabular-nums"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-email">Email Address</Label>

            <Input
              id="profile-email"
              type="email"
              defaultValue="ken@sdhnetwork.gh"
              className="font-medium"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-ghana-card">Ghana Card Number (NIA)</Label>

            <Input
              id="profile-ghana-card"
              type="text"
              defaultValue="GHA-721948192-3"
              disabled
              className="cursor-not-allowed font-medium"
            />
          </div>
        </div>

        <div className="flex justify-end border-t border-border pt-2">
          <Button
            type="button"
            onClick={() => {
              setProfileSaved(true);
              setTimeout(() => setProfileSaved(false), 3000);
            }}
            className="text-xs font-bold shadow-2xs cursor-pointer"
          >
            Save Account Changes
          </Button>
        </div>
      </div>

      {/* Security PIN */}
      <div className="space-y-4 rounded-3xl border border-border bg-card p-6 text-xs shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-extrabold text-foreground">
              <Lock className="size-4 text-primary" />
              <span>Wallet & Transaction Security PIN</span>
            </h3>

            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Protects your wallet debits and large airtime / data top-ups.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="current-pin">Current PIN</Label>

            <Input
              id="current-pin"
              type="password"
              value={currentPinInput}
              onChange={(e) => setCurrentPinInput(e.target.value)}
              className="text-center text-sm font-bold tabular-nums"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-pin">New 4-Digit PIN</Label>

            <Input
              id="new-pin"
              type="password"
              placeholder="Enter new 4 digits"
              value={newPinInput}
              onChange={(e) => setNewPinInput(e.target.value)}
              className="text-center text-sm font-bold tabular-nums"
            />
          </div>
        </div>

        {pinChangeSuccess && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/15 p-3 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
            <Check className="size-4" />

            <span>
              Security PIN updated successfully to {newPinInput || "2026"}.
            </span>
          </div>
        )}

        <div className="flex justify-end border-t border-border pt-2">
          <Button
            type="button"
            onClick={() => {
              setPinChangeSuccess(true);
              setTimeout(() => setPinChangeSuccess(false), 3000);
            }}
            className="text-xs font-bold cursor-pointer"
          >
            Update Security PIN
          </Button>
        </div>
      </div>

      {/* Active Sessions */}
      <div className="space-y-3 rounded-3xl border border-border bg-card p-6 text-xs shadow-xs">
        <h3 className="flex items-center gap-2 text-sm font-extrabold text-foreground">
          <Laptop className="size-4 text-primary" />
          <span>Active Verified Sessions</span>
        </h3>

        <div className="divide-y divide-border/60">
          <div className="flex items-center justify-between py-3">
            <div>
              <div className="font-bold text-foreground">
                Accra, Ghana • Chrome on macOS (Current Device)
              </div>

              <div className="text-[11px] text-muted-foreground">
                IP: 102.176.64.12 • Active Now
              </div>
            </div>

            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
              Online
            </span>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <div className="font-bold text-foreground">
                Kumasi, Ghana • Mobile Safari on iPhone 15
              </div>

              <div className="text-[11px] text-muted-foreground">
                IP: 154.160.2.89 • 2 hours ago
              </div>
            </div>

            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs font-semibold text-destructive hover:no-underline cursor-pointer"
            >
              Revoke
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

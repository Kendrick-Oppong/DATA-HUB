import React, { useState } from "react";
import {
  User,
  ShieldCheck,
  CheckCircle2,
  Palette,
  Check,
  Lock,
  Laptop,
  Smartphone,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  Bell,
  Sliders,
  Download,
  AlertTriangle,
  Copy,
  ChevronRight,
  Sparkles,
  MapPin,
  Calendar,
  Layers,
  ArrowUpRight,
  Trash2,
  RefreshCw,
  Clock,
  Radio,
  BadgeCheck,
} from "lucide-react";
import { AppTheme, UserAccount, TelecomNetwork } from "../../../types";
import { themeOptions } from "../../../lib/themes";
import { SignalRail } from "../../common/SignalRail";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Badge } from "../../ui/badge";
import { Switch } from "../../ui/switch";

export interface CustomerProfileViewProps {
  theme: AppTheme;
  onToggleTheme?: () => void;
  onSetTheme?: (theme: AppTheme) => void;
  onOpenSecurityPins?: () => void;
  user?: UserAccount | null;
  onUpdateUser?: (user: UserAccount) => void;
  walletBalance?: number;
  onOpenFundWallet?: () => void;
  totalOrdersCount?: number;
}

type TabKey = "personal" | "security" | "telecom" | "notifications";

interface SessionItem {
  id: string;
  device: string;
  browser: string;
  location: string;
  ip: string;
  lastActive: string;
  isCurrent: boolean;
}

export const CustomerProfileView: React.FC<CustomerProfileViewProps> = ({
  theme,
  onToggleTheme,
  onSetTheme,
  onOpenSecurityPins,
  user,
  onUpdateUser,
  walletBalance = 179.0,
  onOpenFundWallet,
  totalOrdersCount = 48,
}) => {
  // Active sub-navigation tab
  const [activeSubTab, setActiveSubTab] = useState<TabKey>("personal");

  // Profile fields state (initialized with current user or sensible defaults)
  const [fullName, setFullName] = useState(user?.name || "Kojo Mensah");
  const [displayName, setDisplayName] = useState(
    user?.name ? user.name.split(" ")[0] : "Kojo",
  );
  const [email, setEmail] = useState(user?.email || "kojomensah94@gmail.com");
  const [phone, setPhone] = useState(user?.phone || "0244192834");
  const [ghanaCard] = useState(user?.ghanaCardNumber || "GHA-721948192-3");
  const [region, setRegion] = useState("Greater Accra");
  const [digitalAddress, setDigitalAddress] = useState("GA-183-9021");

  // Security Password states
  const [currentPinInput, setCurrentPinInput] = useState("");
  const [newPinInput, setNewPinInput] = useState("");
  const [confirmPinInput, setConfirmPinInput] = useState("");
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinSuccessMessage, setPinSuccessMessage] = useState<string | null>(
    null,
  );

  // Two-Factor Auth State
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);

  // Telecom and checkout preferences
  const [defaultNetwork, setDefaultNetwork] = useState<TelecomNetwork>("MTN");
  const [defaultRecipient, setDefaultRecipient] = useState(
    user?.phone || "0244192834",
  );
  const [autoRetryGateways, setAutoRetryGateways] = useState(true);
  const [lowBalanceAlert, setLowBalanceAlert] = useState(true);
  const [lowBalanceThreshold, setLowBalanceThreshold] = useState("20.00");

  // Notification toggles
  const [notifySmsReceipts, setNotifySmsReceipts] = useState(true);
  const [notifyWhatsApp, setNotifyWhatsApp] = useState(true);
  const [notifyGatewayAlerts, setNotifyGatewayAlerts] = useState(true);
  const [notifyPromoDeals, setNotifyPromoDeals] = useState(false);

  // UI state banners
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(
    null,
  );
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Active Sessions
  const [sessions, setSessions] = useState<SessionItem[]>([
    {
      id: "sess-1",
      device: "MacBook Pro (macOS Sequoia)",
      browser: "Google Chrome 134.0",
      location: "Accra, Ghana (Airport Residential)",
      ip: "102.176.64.12",
      lastActive: "Active Now",
      isCurrent: true,
    },
    {
      id: "sess-2",
      device: "Apple iPhone 15 Pro",
      browser: "Mobile Safari 18.2",
      location: "Kumasi, Ghana (Adum)",
      ip: "154.160.2.89",
      lastActive: "3 hours ago",
      isCurrent: false,
    },
    {
      id: "sess-3",
      device: "Lenovo ThinkPad (Windows 11)",
      browser: "Microsoft Edge 133",
      location: "Takoradi, Ghana (Market Circle)",
      ip: "154.160.18.44",
      lastActive: "2 days ago",
      isCurrent: false,
    },
  ]);

  // Compute initials
  const initials =
    fullName
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .substring(0, 2)
      .toUpperCase() || "KM";

  // Handle Save Profile
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (user && onUpdateUser) {
      onUpdateUser({
        ...user,
        name: fullName,
        email: email,
        phone: phone,
      });
    }
    setSaveSuccessMessage(
      "Profile information and Ghana Card credentials synced with SDH.",
    );
    setTimeout(() => setSaveSuccessMessage(null), 3500);
  };

  // Handle Update PIN
  const handleUpdatePin = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    setPinSuccessMessage(null);

    const actualCurrentPin = user?.securityPin || "2026";
    if (currentPinInput !== actualCurrentPin) {
      setPinError(
        `Incorrect current PIN. Default demo PIN is ${actualCurrentPin}.`,
      );
      return;
    }
    if (newPinInput.length !== 4 || !/^\d{4}$/.test(newPinInput)) {
      setPinError("New PIN must be exactly 4 numeric digits (0-9).");
      return;
    }
    if (newPinInput !== confirmPinInput) {
      setPinError("New PIN and confirmation PIN do not match.");
      return;
    }

    if (user && onUpdateUser) {
      onUpdateUser({
        ...user,
        securityPin: newPinInput,
      });
    }
    setPinSuccessMessage(
      `Transaction Security PIN successfully updated to ${newPinInput}.`,
    );
    setCurrentPinInput("");
    setNewPinInput("");
    setConfirmPinInput("");
    setTimeout(() => setPinSuccessMessage(null), 4000);
  };

  // Copy helper
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Revoke session
  const handleRevokeSession = (sessionId: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
  };

  const handleRevokeAllOtherSessions = () => {
    setSessions((prev) => prev.filter((s) => s.isCurrent));
    setSaveSuccessMessage(
      "All other remote sessions were immediately revoked.",
    );
    setTimeout(() => setSaveSuccessMessage(null), 3000);
  };

  // Download statement simulation
  const handleDownloadStatement = () => {
    const csvContent = `Date,Type,Amount (GHS),Balance (GHS),Reference,Status\n2026-09-13,MTN 10GB Data,52.00,179.00,ORD-MTN-9412,Delivered\n2026-09-12,Wallet Top-up MoMo,100.00,231.00,TX-FW-8841,Completed\n2026-09-11,WAEC WASSCE Checker,28.00,131.00,ORD-WASS-7102,Delivered`;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `SDH_Account_Statement_${fullName.replace(/\s+/g, "_")}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      {/* ============================================================ */}
      {/* 1. TOP IDENTITY & HERO PROFILE HEADER CARD (Storefront Vibe) */}
      {/* ============================================================ */}
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card p-6 shadow-md transition-all sm:p-8 space-y-6">
        {/* Ambient Gradient Background matching Storefront/StoreBuilder */}
        <div className="absolute top-0 inset-x-0 h-32 pointer-events-none bg-gradient-to-br from-primary/20 via-primary/10 to-transparent" />
        <div className="absolute -top-12 -right-12 size-40 rounded-full bg-primary/15 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 size-36 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          {/* User info left */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {/* Avatar with initials & glowing badge */}
            <div className="relative flex size-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 font-black text-2xl text-primary-foreground shadow-md ring-4 ring-card">
              <span>{initials}</span>
              <span
                className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-card shadow-xs"
                title="Ghana Card Verified Subscriber"
              >
                <ShieldCheck className="size-3.5 text-white" />
              </span>
            </div>

            {/* Title & Metadata */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
                  {fullName}
                </h1>
                <Badge
                  variant="outline"
                  className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 gap-1.5 text-xs font-extrabold py-0.5 px-2.5"
                >
                  <ShieldCheck className="size-3.5" />
                  <span>Tier 2 • NIA Verified</span>
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground font-medium">
                <span className="flex items-center gap-1.5">
                  <Mail className="size-3.5 text-primary" />
                  <span>{email}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Smartphone className="size-3.5 text-primary" />
                  <span>{phone}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-primary" />
                  <span>{region}, Ghana</span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center">
            <div className="rounded-2xl border border-border/80 bg-background/80 backdrop-blur-xs p-3.5 shadow-2xs min-w-[130px]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Wallet Balance
              </p>
              <div className="flex items-baseline justify-between gap-2 mt-0.5">
                <p className="text-lg font-black text-foreground tabular-nums">
                  GH₵ {walletBalance.toFixed(2)}
                </p>
              </div>
              {onOpenFundWallet && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={onOpenFundWallet}
                  className="h-auto p-0 mt-1 text-[11px] font-extrabold text-primary hover:underline justify-start gap-1"
                >
                  <span>+ Fund Wallet</span>
                </Button>
              )}
            </div>

            <div className="rounded-2xl border border-border/80 bg-background/80 backdrop-blur-xs p-3.5 shadow-2xs min-w-[120px]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Delivered Orders
              </p>
              <p className="text-lg font-black text-foreground tabular-nums mt-0.5">
                {totalOrdersCount}
              </p>
              <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                <BadgeCheck className="size-3" />
                <span>100% Fulfilled</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save / Feedback Notification */}
      {saveSuccessMessage && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-bold text-emerald-700 dark:text-emerald-400 animate-in fade-in">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{saveSuccessMessage}</span>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. TABBED SUB-NAVIGATION (Store Builder Pill Group Style)     */}
      {/* ============================================================ */}
      <div className="flex items-center gap-2 overflow-x-auto rounded-2xl border border-border/80 bg-card/60 p-1.5 backdrop-blur-md shadow-2xs">
        <Button
          variant={activeSubTab === "personal" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveSubTab("personal")}
          className={`rounded-xl font-extrabold text-xs transition-all gap-2 px-3.5 py-2 ${
            activeSubTab === "personal"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
          }`}
        >
          <User className="size-3.5" />
          <span>Personal & KYC</span>
        </Button>

        <Button
          variant={activeSubTab === "security" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveSubTab("security")}
          className={`rounded-xl font-extrabold text-xs transition-all gap-2 px-3.5 py-2 ${
            activeSubTab === "security"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
          }`}
        >
          <Lock className="size-3.5" />
          <span>Security & Password</span>
        </Button>

        <Button
          variant={activeSubTab === "telecom" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveSubTab("telecom")}
          className={`rounded-xl font-extrabold text-xs transition-all gap-2 px-3.5 py-2 ${
            activeSubTab === "telecom"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
          }`}
        >
          <Sliders className="size-3.5" />
          <span>Telecom & Preferences</span>
        </Button>

        <Button
          variant={activeSubTab === "notifications" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveSubTab("notifications")}
          className={`rounded-xl font-extrabold text-xs transition-all gap-2 px-3.5 py-2 ${
            activeSubTab === "notifications"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
          }`}
        >
          <Bell className="size-3.5" />
          <span>Notifications & Statement</span>
        </Button>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: PERSONAL & KYC                                        */}
      {/* ============================================================ */}
      {activeSubTab === "personal" && (
        <div className="space-y-6">
          {/* Tier 2 Verified Subscriber (NIA Ghana Card) Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs">
            <div className="flex items-center gap-3">
              <SignalRail status="delivered" size="sm" />

              <div>
                <span className="font-semibold text-foreground">
                  Tier 2 Verified Subscriber (NIA Ghana Card):{" "}
                </span>
                <span className="text-muted-foreground">
                  Authenticated with National Identification Authority. Daily
                  limits up to GH₵ 5,000.00.
                </span>
              </div>
            </div>

            <Badge
              variant="secondary"
              className="shrink-0 self-start sm:self-center text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
            >
              Active Tier
            </Badge>
          </div>

          <form
            onSubmit={handleSaveProfile}
            className="rounded-3xl border border-border/80 bg-card p-6 shadow-xs space-y-6"
          >
            <div className="flex items-center justify-between border-b border-border/80 pb-4">
              <div>
                <h3 className="text-sm font-extrabold text-foreground">
                  Legal Subscriber Identity
                </h3>
                <p className="text-xs text-muted-foreground">
                  Official details associated with your mobile SIM registration
                  and order receipts.
                </p>
              </div>
              <Button type="submit" size="sm" className="font-bold text-xs">
                Save Changes
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="input-full-name" className="text-xs font-bold">
                  Full Legal Name (as on Ghana Card)
                </Label>
                <Input
                  id="input-full-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="font-medium"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="input-display-name"
                  className="text-xs font-bold"
                >
                  Display / Nickname
                </Label>
                <Input
                  id="input-display-name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="font-medium"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="input-email" className="text-xs font-bold">
                  Primary Email Address
                </Label>
                <Input
                  id="input-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="font-medium"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="input-phone" className="text-xs font-bold">
                  Primary Mobile Number (MoMo Enabled)
                </Label>
                <Input
                  id="input-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="font-medium"
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="input-ghana-card"
                    className="text-xs font-bold"
                  >
                    Ghana Card PIN (NIA)
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => copyToClipboard(ghanaCard, "ghanaCard")}
                    className="h-6 px-2 text-[11px] text-primary hover:text-primary font-semibold gap-1"
                  >
                    <Copy className="size-3" />
                    {copiedField === "ghanaCard" ? "Copied!" : "Copy"}
                  </Button>
                </div>
                <div className="relative">
                  <Input
                    id="input-ghana-card"
                    value={ghanaCard}
                    disabled
                    className="bg-muted/40 font-bold cursor-not-allowed pr-24"
                  />
                  <span className="absolute right-3 top-2.5 flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                    <Check className="size-3" />
                    Verified
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Ghana Card numbers cannot be altered directly after
                  verification. Contact support to update NIA records.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="input-region" className="text-xs font-bold">
                  Administrative Region
                </Label>
                <Input
                  id="input-region"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="font-medium"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label
                  htmlFor="input-digital-address"
                  className="text-xs font-bold"
                >
                  GPS Digital Address
                </Label>
                <Input
                  id="input-digital-address"
                  value={digitalAddress}
                  onChange={(e) => setDigitalAddress(e.target.value)}
                  placeholder="Enter your GPS Digital Address"
                  className="uppercase"
                />
                <p className="text-[11px] text-muted-foreground">
                  Used for utility prepaid meter verification and hardware
                  dispatch.
                </p>
              </div>
            </div>

            <div className="flex justify-end border-t border-border/80 pt-4">
              <Button type="submit" className="font-bold text-xs">
                Save Personal Information
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: SECURITY & PIN                                        */}
      {/* ============================================================ */}
      {activeSubTab === "security" && (
        <div className="space-y-6">
          {/* Security Password Management Card */}
          <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-4">
              <div>
                <h3 className="flex items-center gap-2 text-sm font-extrabold text-foreground">
                  <KeyRound className="size-4 text-primary" />
                  <span>Wallet & Transaction Security Password</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your secret security password is required to authorize all
                  wallet withdrawals, bulk purchases, and airtime top-ups.
                </p>
              </div>
              {onOpenSecurityPins && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onOpenSecurityPins}
                  className="text-xs font-semibold gap-1.5 shrink-0 self-start sm:self-center"
                >
                  <KeyRound className="size-3.5 text-primary" />
                  <span>View Security Sheet</span>
                </Button>
              )}
            </div>

            {pinError && (
              <div className="flex items-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-xs font-bold text-destructive animate-in fade-in">
                <AlertTriangle className="size-4 shrink-0" />
                <span>{pinError}</span>
              </div>
            )}

            {pinSuccessMessage && (
              <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-bold text-emerald-700 dark:text-emerald-400 animate-in fade-in">
                <CheckCircle2 className="size-4 shrink-0" />
                <span>{pinSuccessMessage}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePin} className="space-y-5 max-w-2xl">
              {/* Row 1: Current Password */}
              <div className="space-y-2">
                <Label
                  htmlFor="current-password"
                  className="text-xs font-bold text-foreground"
                >
                  Current Password
                </Label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showCurrentPin ? "text" : "password"}
                    placeholder="Enter current password"
                    value={currentPinInput}
                    onChange={(e) => setCurrentPinInput(e.target.value)}
                    className="pr-10 font-medium text-sm"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setShowCurrentPin(!showCurrentPin)}
                    aria-label={
                      showCurrentPin ? "Hide password" : "Show password"
                    }
                    className="absolute right-2 top-2 size-6 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {showCurrentPin ? (
                      <EyeOff className="size-3.5" />
                    ) : (
                      <Eye className="size-3.5" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Row 2: New Password & Confirm Password */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label
                    htmlFor="new-password"
                    className="text-xs font-bold text-foreground"
                  >
                    New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showNewPin ? "text" : "password"}
                      placeholder="Enter new password"
                      value={newPinInput}
                      onChange={(e) => setNewPinInput(e.target.value)}
                      className="pr-10 font-medium text-sm"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => setShowNewPin(!showNewPin)}
                      aria-label={
                        showNewPin ? "Hide password" : "Show password"
                      }
                      className="absolute right-2 top-2 size-6 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {showNewPin ? (
                        <EyeOff className="size-3.5" />
                      ) : (
                        <Eye className="size-3.5" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="confirm-password"
                    className="text-xs font-bold text-foreground"
                  >
                    Confirm New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Re-enter new password"
                      value={confirmPinInput}
                      onChange={(e) => setConfirmPinInput(e.target.value)}
                      className="pr-10 font-medium text-sm"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      aria-label={
                        showConfirmPassword ? "Hide password" : "Show password"
                      }
                      className="absolute right-2 top-2 size-6 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="size-3.5" />
                      ) : (
                        <Eye className="size-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end border-t border-border/80 pt-4">
                <Button
                  type="submit"
                  size="sm"
                  className="font-bold text-xs gap-1.5 cursor-pointer"
                >
                  <Lock className="size-3.5" />
                  <span>Update Security Password</span>
                </Button>
              </div>
            </form>
          </div>

          {/* Two-Factor Authentication Card */}
          <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="flex items-center gap-2 text-sm font-extrabold text-foreground">
                  <ShieldCheck className="size-4 text-primary" />
                  <span>Two-Factor Authentication (2FA via SMS OTP)</span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Sends an instant one-time verification code to {phone} for
                  logins from unrecognized devices or transfers over GH₵ 100.
                </p>
              </div>

              <Switch
                checked={twoFactorEnabled}
                onCheckedChange={(checked) => {
                  setTwoFactorEnabled(checked);
                  setSaveSuccessMessage(
                    checked
                      ? "Two-factor authentication enabled via SMS OTP."
                      : "Two-factor authentication disabled.",
                  );
                  setTimeout(() => setSaveSuccessMessage(null), 3000);
                }}
                aria-label="Two-factor authentication"
              />
            </div>
          </div>

          {/* Active Sessions Card */}
          <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/80 pb-4">
              <div>
                <h3 className="flex items-center gap-2 text-sm font-extrabold text-foreground">
                  <Laptop className="size-4 text-primary" />
                  <span>Active Verified Sessions</span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Devices currently authorized to access your Smart Data Hub
                  customer account.
                </p>
              </div>

              {sessions.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRevokeAllOtherSessions}
                  className="text-xs font-semibold text-destructive hover:bg-destructive/10 border-destructive/30"
                >
                  Sign Out Other Devices
                </Button>
              )}
            </div>

            <div className="divide-y divide-border/60">
              {sessions.map((sess) => (
                <div
                  key={sess.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3.5"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-foreground">
                        {sess.device}
                      </span>
                      {sess.isCurrent ? (
                        <Badge
                          variant="default"
                          className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px] py-0"
                        >
                          Current Device
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] py-0">
                          Authorized
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {sess.browser} • {sess.location} • IP: {sess.ip}
                    </p>
                    <p className="text-[10px] text-muted-foreground/80">
                      Last seen: {sess.lastActive}
                    </p>
                  </div>

                  {!sess.isCurrent && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRevokeSession(sess.id)}
                      className="text-xs font-semibold text-destructive hover:bg-destructive/10 h-8 self-start sm:self-center"
                    >
                      <Trash2 className="size-3.5 mr-1" />
                      Revoke
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: TELECOM & PREFERENCES                                 */}
      {/* ============================================================ */}
      {activeSubTab === "telecom" && (
        <div className="space-y-6">
          {/* Visual Theme Picker */}
          <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border/80 pb-4">
              <div>
                <h3 className="flex items-center gap-2 text-sm font-extrabold text-foreground">
                  <Palette className="size-4 text-primary" />
                  <span>Color Theme & Display Styling</span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Select your preferred color profile. Updates dynamically
                  across your entire portal.
                </p>
              </div>
              {onToggleTheme && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onToggleTheme}
                  className="text-xs font-semibold"
                >
                  Quick Toggle ({theme})
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {themeOptions.map((opt) => {
                const isSelected = theme === opt.id;
                return (
                  <Button
                    key={opt.id}
                    type="button"
                    variant="outline"
                    onClick={() => onSetTheme?.(opt.id)}
                    className={`group relative flex flex-col h-auto items-start rounded-2xl p-3.5 text-left transition-all justify-start whitespace-normal ${
                      isSelected
                        ? "border-primary bg-primary/10 shadow-xs ring-2 ring-primary/20 hover:bg-primary/15"
                        : "border-border/80 hover:border-border hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex w-full items-center justify-between mb-2">
                      <span
                        className={`size-4 rounded-full ${opt.dot} ring-1 ring-border shadow-xs`}
                      />
                      {isSelected && (
                        <Check className="size-3.5 text-primary" />
                      )}
                    </div>
                    <span className="text-xs font-bold text-foreground line-clamp-1">
                      {opt.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground capitalize">
                      {opt.id}
                    </span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Telecom Network Default */}
          <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-xs space-y-5">
            <div className="border-b border-border/80 pb-4">
              <h3 className="text-sm font-extrabold text-foreground">
                Default Carrier & One-Click Checkout
              </h3>
              <p className="text-xs text-muted-foreground">
                Pre-selected options when purchasing airtime and data bundles
                for faster dispatch.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-xs font-bold mb-2 block">
                  Preferred Telecom Carrier
                </Label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {(["MTN", "Telecel", "AirtelTigo"] as TelecomNetwork[]).map(
                    (net) => {
                      const isSelected = defaultNetwork === net;
                      return (
                        <Button
                          key={net}
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setDefaultNetwork(net);
                            setSaveSuccessMessage(
                              `Default carrier set to ${net}.`,
                            );
                            setTimeout(() => setSaveSuccessMessage(null), 2500);
                          }}
                          className={`flex items-center justify-start h-auto gap-3 rounded-2xl p-3 text-left transition-all whitespace-normal ${
                            isSelected
                              ? "border-primary bg-primary/10 ring-2 ring-primary/20 hover:bg-primary/15"
                              : "border-border/80 hover:bg-muted/50"
                          }`}
                        >
                          <div
                            className={`size-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                              net === "MTN"
                                ? "bg-amber-400 text-amber-950"
                                : net === "Telecel"
                                  ? "bg-red-500 text-white"
                                  : "bg-blue-600 text-white"
                            }`}
                          >
                            {net[0]}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-foreground">
                              {net}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {net === "MTN"
                                ? "MoMo & Turbonet"
                                : net === "Telecel"
                                  ? "Telecel Cash"
                                  : "AT Money"}
                            </p>
                          </div>
                          {isSelected && (
                            <Check className="size-4 text-primary shrink-0" />
                          )}
                        </Button>
                      );
                    },
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2">
                <div className="space-y-2">
                  <Label
                    htmlFor="default-recipient"
                    className="text-xs font-bold"
                  >
                    Default Top-up Recipient Number
                  </Label>
                  <Input
                    id="default-recipient"
                    type="tel"
                    value={defaultRecipient}
                    onChange={(e) => setDefaultRecipient(e.target.value)}
                    placeholder="0244000000"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Automatically fills recipient field during fast checkout.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="low-balance-thresh"
                    className="text-xs font-bold"
                  >
                    Low Wallet Balance Alert (GH₵)
                  </Label>
                  <Input
                    id="low-balance-thresh"
                    type="number"
                    value={lowBalanceThreshold}
                    onChange={(e) => setLowBalanceThreshold(e.target.value)}
                    placeholder="20.00"
                    className="tabular-nums"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Warns when balance dips below this amount.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Upstream Gateways & Auto-Retry */}
          <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-foreground">
                  Carrier Gateway Auto-Failover
                </h3>
                <p className="text-xs text-muted-foreground">
                  If primary upstream carrier gateway experiences latency &gt;
                  350ms, automatically re-route via secondary backup trunk.
                </p>
              </div>

              <Switch
                checked={autoRetryGateways}
                onCheckedChange={(checked) => setAutoRetryGateways(checked)}
                aria-label="Carrier Gateway Auto-Failover"
              />
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 4: NOTIFICATIONS & STATEMENT                             */}
      {/* ============================================================ */}
      {activeSubTab === "notifications" && (
        <div className="space-y-6">
          {/* Notification Preferences */}
          <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-xs space-y-5">
            <div className="border-b border-border/80 pb-4">
              <h3 className="flex items-center gap-2 text-sm font-extrabold text-foreground">
                <Bell className="size-4 text-primary" />
                <span>Alerts & Receipt Channels</span>
              </h3>
              <p className="text-xs text-muted-foreground">
                Control how and where order fulfillment receipts and security
                alerts are dispatched.
              </p>
            </div>

            <div className="divide-y divide-border/60">
              <div className="flex items-center justify-between py-3.5">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-foreground">
                    SMS Transaction Receipts
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    Instant SMS message with reference code upon successful data
                    or airtime top-up.
                  </p>
                </div>
                <Switch
                  checked={notifySmsReceipts}
                  onCheckedChange={(checked) => setNotifySmsReceipts(checked)}
                  aria-label="SMS Transaction Receipts"
                />
              </div>

              <div className="flex items-center justify-between py-3.5">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-foreground">
                    WhatsApp Order & PIN Delivery
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    Delivers WAEC scratch card PINs and receipt links directly
                    to your WhatsApp.
                  </p>
                </div>
                <Switch
                  checked={notifyWhatsApp}
                  onCheckedChange={(checked) => setNotifyWhatsApp(checked)}
                  aria-label="WhatsApp Order & PIN Delivery"
                />
              </div>

              <div className="flex items-center justify-between py-3.5">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-foreground">
                    Carrier Maintenance & Downtime Alerts
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    Notifies you when MTN, Telecel, or ECG upstream gateways
                    report planned maintenance.
                  </p>
                </div>
                <Switch
                  checked={notifyGatewayAlerts}
                  onCheckedChange={(checked) => setNotifyGatewayAlerts(checked)}
                  aria-label="Carrier Maintenance & Downtime Alerts"
                />
              </div>

              <div className="flex items-center justify-between py-3.5">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-foreground">
                    Wholesale Rate Drops & Promo Credits
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    Receive announcements when wholesale data bundle rates
                    decrease or bonus credits are awarded.
                  </p>
                </div>
                <Switch
                  checked={notifyPromoDeals}
                  onCheckedChange={(checked) => setNotifyPromoDeals(checked)}
                  aria-label="Wholesale Rate Drops & Promo Credits"
                />
              </div>
            </div>
          </div>

          {/* Account Statement Export */}
          <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="flex items-center gap-2 text-sm font-extrabold text-foreground">
                  <Download className="size-4 text-primary" />
                  <span>Download Ledger & Account Statement</span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Export complete transaction history, wallet top-ups, and
                  fulfilled carrier receipts in CSV format.
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadStatement}
                className="font-bold text-xs gap-1.5 shrink-0"
              >
                <Download className="size-3.5" />
                Download Statement (.CSV)
              </Button>
            </div>
          </div>

          {/* Account Safeguard / Danger Zone */}
          <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-6 space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="size-5 text-destructive shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-destructive">
                  Account Freeze & Security Safeguard
                </h3>
                <p className="text-xs text-muted-foreground">
                  If your phone is lost or stolen, you can temporarily freeze
                  your wallet and SIM access to prevent unauthorized
                  withdrawals.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSaveSuccessMessage(
                    "Emergency lock simulated: Wallet debits restricted.",
                  );
                  setTimeout(() => setSaveSuccessMessage(null), 3500);
                }}
                className="text-xs font-bold text-destructive hover:bg-destructive/10 border-destructive/30"
              >
                Temporary Wallet Freeze
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerProfileView;

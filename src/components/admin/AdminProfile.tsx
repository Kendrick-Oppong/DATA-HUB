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
  MapPin,
  BadgeCheck,
  Store,
  Coins,
  Code,
  ExternalLink,
  Trash2,
  Settings,
  ShieldAlert,
  Database,
  Globe,
  Users,
  BarChart3,
  Zap,
  FileText,
} from "lucide-react";
import { AppTheme, UserAccount, TelecomNetwork } from "../../../types";
import { themeOptions } from "../../lib/themes";
import { SignalRail } from "../common/SignalRail";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Switch } from "../ui/switch";

export interface AdminProfileProps {
  theme: AppTheme;
  onToggleTheme?: () => void;
  onSetTheme?: (theme: AppTheme) => void;
  onNavigateTab?: (tab: string) => void;
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

export const AdminProfile: React.FC<AdminProfileProps> = ({
  theme,
  onToggleTheme,
  onSetTheme,
  onNavigateTab,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<TabKey>("personal");

  // Profile fields state
  const [fullName, setFullName] = useState("Admin User");
  const [displayName, setDisplayName] = useState("Admin");
  const [email, setEmail] = useState("admin@smartdatahub.com");
  const [phone, setPhone] = useState("0244192834");
  const [adminId] = useState("ADM-ADMIN-001");
  const [role, setRole] = useState("Super Administrator");
  const [department, setDepartment] = useState("Platform Operations");

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

  // Admin API Key
  const [apiKey] = useState("sdh_admin_live_9f82d10a4e7c3b19820f4a_master");
  const [showApiKey, setShowApiKey] = useState(false);

  // Two-Factor Auth State
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);

  // Telecom and checkout preferences
  const [defaultNetwork, setDefaultNetwork] = useState<TelecomNetwork>("MTN");
  const [defaultRecipient, setDefaultRecipient] = useState(phone);
  const [autoRetryGateways, setAutoRetryGateways] = useState(true);
  const [lowBalanceAlert, setLowBalanceAlert] = useState(true);
  const [lowBalanceThreshold, setLowBalanceThreshold] = useState("50.00");

  // Notification toggles
  const [notifySmsReceipts, setNotifySmsReceipts] = useState(true);
  const [notifyWhatsApp, setNotifyWhatsApp] = useState(true);
  const [notifyGatewayAlerts, setNotifyGatewayAlerts] = useState(true);
  const [notifyCommissionAlerts, setNotifyCommissionAlerts] = useState(true);

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
      device: "Dell XPS (Windows 11)",
      browser: "Microsoft Edge 133",
      location: "Kumasi, Ghana (Adum)",
      ip: "154.160.2.89",
      lastActive: "2 hours ago",
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
      .toUpperCase() || "AU";

  // Handle Save Profile
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccessMessage("Admin profile information updated successfully.");
    setTimeout(() => setSaveSuccessMessage(null), 3500);
  };

  // Handle Update PIN / Password
  const handleUpdatePin = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    setPinSuccessMessage(null);

    const actualCurrentPin = "2026";
    if (currentPinInput !== actualCurrentPin) {
      setPinError(
        `Incorrect current password. Default demo password is ${actualCurrentPin}.`,
      );
      return;
    }
    if (newPinInput.length < 4) {
      setPinError("New password must be at least 4 characters long.");
      return;
    }
    if (newPinInput !== confirmPinInput) {
      setPinError("New password and confirmation password do not match.");
      return;
    }

    setPinSuccessMessage(`Admin Security Password successfully updated.`);
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

  // Download audit log simulation
  const handleDownloadAuditLog = () => {
    const csvContent = `Timestamp,Admin,Action,Target,IP,Status\n2026-09-13 08:30,Admin User,Agent Approval,AGENT-001,102.176.64.12,Success\n2026-09-13 09:15,Admin User,Price Update,Product-1024,102.176.64.12,Success\n2026-09-13 10:45,Admin User,Complaint Resolution,TICK-8942,102.176.64.12,Success`;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `SDH_Admin_Audit_Log_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      {/* ============================================================ */}
      {/* 1. TOP IDENTITY & HERO PROFILE HEADER CARD */}
      {/* ============================================================ */}
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card p-6 shadow-md transition-all sm:p-8 space-y-6">
        {/* Ambient Gradient Background */}
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
                title="Super Administrator"
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
                  <span>{role}</span>
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
                  <BadgeCheck className="size-3.5 text-primary" />
                  <span>{department}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center">
            <div className="rounded-2xl border border-border/80 bg-background/80 backdrop-blur-xs p-3.5 shadow-2xs min-w-[130px]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Admin ID
              </p>
              <div className="flex items-baseline justify-between gap-2 mt-0.5">
                <p className="text-lg font-black text-foreground tabular-nums">
                  {adminId}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-border/80 bg-background/80 backdrop-blur-xs p-3.5 shadow-2xs min-w-[130px]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Platform Status
              </p>
              <div className="mt-0.5 flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-3" />
                <span>Operational</span>
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
      {/* 2. TABBED SUB-NAVIGATION */}
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
          <span>Personal &amp; Role</span>
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
          <span>Security &amp; Access</span>
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
          <span>Telecom &amp; Preferences</span>
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
          <span>Notifications &amp; Audit</span>
        </Button>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: PERSONAL & ROLE */}
      {/* ============================================================ */}
      {activeSubTab === "personal" && (
        <div className="space-y-6">
          {/* Super Administrator Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs">
            <div className="flex items-center gap-3">
              <SignalRail status="delivered" size="sm" />

              <div>
                <span className="font-semibold text-foreground">
                  Super Administrator Access:{" "}
                </span>
                <span className="text-muted-foreground">
                  Full platform control including agent approvals, pricing
                  management, complaint resolution, and system configuration.
                </span>
              </div>
            </div>

            <Badge
              variant="secondary"
              className="shrink-0 self-start sm:self-center text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
            >
              Full Access
            </Badge>
          </div>

          {/* Form Card: Admin Identity */}
          <form
            onSubmit={handleSaveProfile}
            className="rounded-3xl border border-border/80 bg-card p-6 shadow-xs space-y-6"
          >
            <div className="flex items-center justify-between border-b border-border/80 pb-4">
              <div>
                <h3 className="text-sm font-extrabold text-foreground">
                  Administrator Identity
                </h3>
                <p className="text-xs text-muted-foreground">
                  Official details associated with your platform administrator
                  account.
                </p>
              </div>
              <Button type="submit" size="sm" className="font-bold text-xs">
                Save Changes
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="input-full-name" className="text-xs font-bold">
                  Full Legal Name
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
                  Display Name
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
                  Admin Email Address
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
                  Contact Mobile Number
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
                  <Label htmlFor="input-admin-id" className="text-xs font-bold">
                    Administrator ID
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => copyToClipboard(adminId, "admin_id")}
                    className="h-6 px-2 text-[11px] text-primary hover:text-primary font-semibold gap-1"
                  >
                    <Copy className="size-3" />
                    {copiedField === "admin_id" ? "Copied!" : "Copy"}
                  </Button>
                </div>
                <div className="relative">
                  <Input
                    id="input-admin-id"
                    value={adminId}
                    disabled
                    className="bg-muted/40 font-bold cursor-not-allowed pr-24"
                  />
                  <span className="absolute right-3 top-2.5 flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                    <Check className="size-3" />
                    System
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="input-role" className="text-xs font-bold">
                  Administrative Role
                </Label>
                <Input
                  id="input-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="font-medium"
                  disabled
                />
                <p className="text-[11px] text-muted-foreground">
                  Role changes require super admin approval.
                </p>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="input-department" className="text-xs font-bold">
                  Department / Division
                </Label>
                <Input
                  id="input-department"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="font-medium"
                />
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
      {/* TAB 2: SECURITY & ACCESS */}
      {/* ============================================================ */}
      {activeSubTab === "security" && (
        <div className="space-y-6">
          {/* Security Password Management Card */}
          <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-4">
              <div>
                <h3 className="flex items-center gap-2 text-sm font-extrabold text-foreground">
                  <KeyRound className="size-4 text-primary" />
                  <span>Admin Security Password</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your secret security password is required to authorize all
                  administrative actions including agent approvals and system
                  changes.
                </p>
              </div>
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
                  size="lg"
                  className="font-semibold text-xs gap-1.5 cursor-pointer"
                >
                  <Lock className="size-3.5 stroke-2" />
                  <span>Update Password</span>
                </Button>
              </div>
            </form>
          </div>

          {/* Admin API Key Card */}
          <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-xs space-y-5">
            <div className="border-b border-border/80 pb-4">
              <h3 className="flex items-center gap-2 text-sm font-extrabold text-foreground">
                <Code className="size-4 text-primary" />
                <span>Admin API Master Key</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Master API key with full platform access for system integrations
                and administrative automation.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold">
                  Master API Secret Key
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => copyToClipboard(apiKey, "api_key")}
                  className="h-6 px-2 text-[11px] text-primary font-semibold gap-1"
                >
                  <Copy className="size-3" />
                  {copiedField === "api_key" ? "Copied!" : "Copy Key"}
                </Button>
              </div>
              <div className="relative">
                <Input
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  readOnly
                  className="text-xs font-bold pr-10 bg-muted/40"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2 top-2 size-6 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {showApiKey ? (
                    <EyeOff className="size-3.5" />
                  ) : (
                    <Eye className="size-3.5" />
                  )}
                </Button>
              </div>
            </div>
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
                  admin logins from unrecognized devices or sensitive system
                  changes.
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
                  <span>Active Admin Sessions</span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Devices currently authorized to access the admin dashboard.
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
                  <span>Color Theme &amp; Display Styling</span>
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
                <span>Alerts &amp; Receipt Channels</span>
              </h3>
              <p className="text-xs text-muted-foreground">
                Control how and where reseller fulfillment receipts, profit
                payout credits, and security alerts are dispatched.
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
                    WhatsApp Order &amp; PIN Delivery
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
                    Carrier Maintenance &amp; Downtime Alerts
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
                    Reseller Commission &amp; Wholesale Rate Alerts
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    Receive announcements when wholesale data bundle rates
                    decrease or bonus commission payouts are awarded.
                  </p>
                </div>
                <Switch
                  checked={notifyCommissionAlerts}
                  onCheckedChange={(checked) =>
                    setNotifyCommissionAlerts(checked)
                  }
                  aria-label="Reseller Commission & Wholesale Rate Alerts"
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
                  <span>Download Ledger &amp; Account Statement</span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Export complete transaction history, reseller commissions, and
                  fulfilled carrier receipts in CSV format.
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadAuditLog}
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
                  Account Freeze &amp; Security Safeguard
                </h3>
                <p className="text-xs text-muted-foreground">
                  If your phone is lost or stolen, you can temporarily freeze
                  your wallet and SIM reseller access to prevent unauthorized
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
                    "Emergency lock simulated: Wallet debits & reseller dispatches restricted.",
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

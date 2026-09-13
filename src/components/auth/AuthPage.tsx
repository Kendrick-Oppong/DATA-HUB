import React, { useState, useEffect, useRef } from "react";
import {
  Shield,
  Smartphone,
  KeyRound,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Lock,
  User,
  Store,
  Sparkles,
  ArrowLeft,
  RefreshCw,
  Eye,
  EyeOff,
  Palette,
  Check,
  Zap,
  Info,
  Building2,
  Radio,
  Send,
  HelpCircle,
  Fingerprint,
  MessageSquare,
  ShieldCheck,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import { UserRole, AppTheme } from "../../types";
import { Button } from "../ui/button";
import { themeOptions } from "../../lib/themes";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { Separator } from "../ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

export interface AuthSuccessPayload {
  name: string;
  phone: string;
  role: UserRole;
  ghanaCard?: string;
  email?: string;
}

export type AuthFlowMode =
  | "login"
  | "register"
  | "otp"
  | "reset-pin"
  | "two-factor"
  | "kyc-verify";

interface AuthPageProps {
  initialMode?: AuthFlowMode;
  redirectReason?: string | null;
  onAuthSuccess: (user: AuthSuccessPayload) => void;
  onBackToPublic: () => void;
  theme: AppTheme;
  onSetTheme: (theme: AppTheme) => void;
  onOpenSecurityPins?: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  initialMode = "login",
  redirectReason,
  onAuthSuccess,
  onBackToPublic,
  theme,
  onSetTheme,
  onOpenSecurityPins,
}) => {
  const [mode, setMode] = useState<AuthFlowMode>(initialMode);
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  // Sign In state
  const [loginPhone, setLoginPhone] = useState("");
  const [loginPin, setLoginPin] = useState("");
  const [showLoginPin, setShowLoginPin] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Register state
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regGhanaCard, setRegGhanaCard] = useState("");
  const [regRole, setRegRole] = useState<"customer" | "agent">("customer");
  const [regPin, setRegPin] = useState("");
  const [regConfirmPin, setRegConfirmPin] = useState("");
  const [regReferralCode, setRegReferralCode] = useState("");
  const [showReferralInput, setShowReferralInput] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(true);
  const [regError, setRegError] = useState("");

  // OTP state
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [otpTimer, setOtpTimer] = useState(59);
  const [otpPhone, setOtpPhone] = useState("");
  const [otpChannel, setOtpChannel] = useState<"sms" | "whatsapp">("sms");
  const [otpPendingUser, setOtpPendingUser] = useState<AuthSuccessPayload | null>(null);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Reset PIN state
  const [resetStep, setResetStep] = useState<"request" | "verify" | "new-pin" | "success">("request");
  const [resetPhone, setResetPhone] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmNewPin, setConfirmNewPin] = useState("");
  const [resetError, setResetError] = useState("");

  // 2FA state
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorUser, setTwoFactorUser] = useState<AuthSuccessPayload | null>(null);

  // KYC state
  const [kycCardNumber, setKycCardNumber] = useState("GHA-721948192-3");
  const [isVerifyingKyc, setIsVerifyingKyc] = useState(false);
  const [kycSuccess, setKycSuccess] = useState(false);

  // Sync mode on initialMode change
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  // Countdown timer for OTP
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (mode === "otp" && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [mode, otpTimer]);

  // Ghana Mobile Network detector
  const detectNetwork = (
    phone: string
  ): { name: string; color: string; bg: string; dot: string } | null => {
    const clean = phone.replace(/[\s\-\(\)]/g, "");
    if (
      clean.startsWith("024") ||
      clean.startsWith("054") ||
      clean.startsWith("055") ||
      clean.startsWith("059") ||
      clean.startsWith("053") ||
      clean.startsWith("+23324") ||
      clean.startsWith("+23354") ||
      clean.startsWith("+23355") ||
      clean.startsWith("+23359") ||
      clean.startsWith("+23353")
    ) {
      return {
        name: "MTN Ghana",
        color: "text-amber-950 dark:text-amber-300",
        bg: "bg-amber-400/20 border-amber-500/40",
        dot: "bg-amber-500",
      };
    }
    if (
      clean.startsWith("020") ||
      clean.startsWith("050") ||
      clean.startsWith("+23320") ||
      clean.startsWith("+23350")
    ) {
      return {
        name: "Telecel Ghana",
        color: "text-red-700 dark:text-red-300",
        bg: "bg-red-500/15 border-red-500/30",
        dot: "bg-red-600",
      };
    }
    if (
      clean.startsWith("027") ||
      clean.startsWith("057") ||
      clean.startsWith("026") ||
      clean.startsWith("+23327") ||
      clean.startsWith("+23357") ||
      clean.startsWith("+23326")
    ) {
      return {
        name: "AT (AirtelTigo)",
        color: "text-blue-700 dark:text-blue-300",
        bg: "bg-blue-500/15 border-blue-500/30",
        dot: "bg-blue-600",
      };
    }
    return null;
  };

  const currentDetectedNetwork = detectNetwork(
    mode === "login" ? loginPhone : mode === "reset-pin" ? resetPhone : regPhone
  );

  // Quick Demo Login Handler
  const handleQuickLogin = (role: UserRole) => {
    setIsLoading(true);
    setLoginError("");

    setTimeout(() => {
      setIsLoading(false);
      if (role === "admin") {
        onAuthSuccess({
          name: "NOC Superadmin",
          phone: "0200000001",
          role: "admin",
          email: "noc.admin@smartdatahub.gh",
          ghanaCard: "GHA-000000001-0",
        });
      } else if (role === "agent") {
        onAuthSuccess({
          name: "Kofi Owusu (Reseller Agent)",
          phone: "0244192834",
          role: "agent",
          email: "kofitelecom@gmail.com",
          ghanaCard: "GHA-948102941-8",
        });
      } else {
        onAuthSuccess({
          name: "Kojo Mensah (Customer)",
          phone: "0244192834",
          role: "customer",
          email: "kojomensah94@gmail.com",
          ghanaCard: "GHA-721948192-3",
        });
      }
    }, 450);
  };

  // Sign In Form Submission
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    const cleanInput = loginPhone.trim();
    if (!cleanInput) {
      setLoginError("Please enter your registered Ghana phone number or email.");
      return;
    }
    if (!loginPin.trim()) {
      setLoginError("Please enter your 4-digit security PIN or clearance password.");
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);

      // Check for admin PIN or admin identifier
      if (loginPin === "0000" || cleanInput.toLowerCase().includes("admin") || loginPin === "7788") {
        // If 2FA is needed for admin security, route through 2FA challenge
        const adminPayload: AuthSuccessPayload = {
          name: "NOC Superadmin",
          phone: cleanInput || "0200000001",
          role: "admin",
          email: "noc.admin@smartdatahub.gh",
          ghanaCard: "GHA-000000001-0",
        };
        onAuthSuccess(adminPayload);
      } else if (loginPin === "1122" || cleanInput.toLowerCase().includes("agent")) {
        const agentPayload: AuthSuccessPayload = {
          name: "Kofi Owusu (Reseller Agent)",
          phone: cleanInput || "0244192834",
          role: "agent",
          email: "kofitelecom@gmail.com",
          ghanaCard: "GHA-948102941-8",
        };
        onAuthSuccess(agentPayload);
      } else {
        // Standard Customer Account
        const customerPayload: AuthSuccessPayload = {
          name: cleanInput.startsWith("024") ? "Kojo Mensah" : "Customer Account",
          phone: cleanInput,
          role: "customer",
          email: `${cleanInput.replace(/\D/g, "") || "user"}@smartdatahub.gh`,
          ghanaCard: "GHA-721948192-3",
        };
        onAuthSuccess(customerPayload);
      }
    }, 550);
  };

  // Registration Form Submission
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");

    if (!regName.trim()) {
      setRegError("Please enter your full legal name as shown on Ghana Card.");
      return;
    }
    const cleanPhone = regPhone.replace(/[\s\-]/g, "");
    if (!cleanPhone || cleanPhone.length < 10) {
      setRegError("Please enter a valid 10-digit Ghana mobile number (e.g. 024 419 2834).");
      return;
    }
    if (regGhanaCard && !regGhanaCard.toUpperCase().startsWith("GHA-")) {
      setRegError("Ghana Card number must begin with GHA- (e.g. GHA-721948192-3).");
      return;
    }
    if (!regPin || regPin.length < 4) {
      setRegError("Please choose a 4-digit security PIN.");
      return;
    }
    if (regConfirmPin && regPin !== regConfirmPin) {
      setRegError("Your PIN and confirmation PIN do not match. Please re-enter.");
      return;
    }
    if (!agreeToTerms) {
      setRegError("Please agree to the SDH Terms of Service & Privacy Policy to proceed.");
      return;
    }

    const pending: AuthSuccessPayload = {
      name: regName,
      phone: cleanPhone,
      role: regRole,
      ghanaCard: regGhanaCard.toUpperCase() || "GHA-721948192-3",
      email: regEmail || `${cleanPhone}@smartdatahub.gh`,
    };

    setOtpPendingUser(pending);
    setOtpPhone(cleanPhone);
    setOtpTimer(59);
    setOtpDigits(["", "", "", "", "", ""]);
    setMode("otp");
  };

  // OTP Digit Input Handlers
  const handleOtpDigitChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const updated = [...otpDigits];
    updated[index] = digit;
    setOtpDigits(updated);

    // Auto-advance focus to next digit
    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const updated = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      updated[i] = pasted[i] || "";
    }
    setOtpDigits(updated);
    if (pasted.length >= 6) {
      otpInputRefs.current[5]?.focus();
    } else {
      otpInputRefs.current[pasted.length]?.focus();
    }
  };

  const handleAutoFillOtp = () => {
    setOtpDigits(["4", "1", "9", "0", "8", "8"]);
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = otpDigits.join("");
    if (fullCode.length < 4) {
      return;
    }
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      if (otpPendingUser) {
        onAuthSuccess(otpPendingUser);
      } else {
        onAuthSuccess({
          name: "Verified Account",
          phone: otpPhone || "0244192834",
          role: "customer",
          ghanaCard: "GHA-721948192-3",
        });
      }
    }, 600);
  };

  // Reset PIN flow step handlers
  const handleResetRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setResetError("");
    const clean = resetPhone.trim();
    if (!clean || clean.length < 10) {
      setResetError("Please enter a valid 10-digit Ghana mobile number.");
      return;
    }
    setResetStep("verify");
  };

  const handleResetVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setResetError("");
    if (resetOtp.length < 4) {
      setResetError("Please enter the 4 or 6-digit recovery code sent to your phone.");
      return;
    }
    setResetStep("new-pin");
  };

  const handleResetNewPin = (e: React.FormEvent) => {
    e.preventDefault();
    setResetError("");
    if (newPin.length !== 4) {
      setResetError("New PIN must be exactly 4 numeric digits.");
      return;
    }
    if (newPin !== confirmNewPin) {
      setResetError("New PIN and confirmation PIN do not match.");
      return;
    }
    setResetStep("success");
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-border/80 bg-card/85 px-4 py-3 backdrop-blur-md sm:px-8">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackToPublic}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-semibold"
            >
              <ArrowLeft className="size-3.5" />
              <span>Back to Storefront</span>
            </Button>

            <div className="h-4 w-px bg-border hidden sm:block" />

            <div
              className="flex items-center gap-2.5 cursor-pointer"
              onClick={onBackToPublic}
            >
              <div className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground font-black text-xs shadow-xs">
                SDH
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm tracking-tight text-foreground">
                  Smart Data Hub
                </span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-bold border-primary/30 text-primary">
                  Ghana
                </Badge>
              </div>
            </div>
          </div>

          {/* Right Tools: Credentials Cheat Sheet + Theme */}
          <div className="flex items-center gap-2">
            {onOpenSecurityPins && (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenSecurityPins}
                className="text-xs font-semibold gap-1.5 h-8 rounded-lg"
              >
                <KeyRound className="size-3.5 text-primary" />
                <span className="hidden sm:inline">Credentials Cheat Sheet</span>
                <span className="sm:hidden">PINs</span>
              </Button>
            )}

            {/* Theme Selector */}
            <div className="relative">
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => setShowThemeMenu(!showThemeMenu)}
                title="Change Theme"
                className="size-8 rounded-lg"
              >
                <Palette className="size-3.5" />
              </Button>

              {showThemeMenu && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-card border border-border shadow-lg p-1.5 z-50 animate-in fade-in-50 zoom-in-95">
                  <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Select Theme
                  </div>
                  {themeOptions.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        onSetTheme(t.id);
                        setShowThemeMenu(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        theme === t.id
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`size-2.5 rounded-full ${t.dot}`} />
                        <span>{t.name}</span>
                      </div>
                      {theme === t.id && <Check className="size-3 text-primary" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Container: Split-Screen Layout on Desktop */}
      <main className="relative flex flex-1 items-center justify-center p-4 sm:p-6 lg:p-10 overflow-hidden bg-gradient-to-br from-primary/[0.03] via-background to-amber-500/[0.03]">
        <div className="mx-auto w-full max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* ============================================================ */}
            {/* LEFT COLUMN: HERO SHOWCASE & TRUST PANEL (Desktop lg:col-span-5) */}
            {/* ============================================================ */}
            <div className="hidden lg:flex lg:col-span-5 flex-col justify-between rounded-3xl border border-border/80 bg-card/60 backdrop-blur-md p-8 shadow-sm space-y-6">
              {/* Header Badge */}
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                  <Sparkles className="size-3.5" />
                  <span>Subsidized Telecom Rails</span>
                </div>

                <h1 className="text-2xl xl:text-3xl font-black tracking-tight text-foreground leading-tight">
                  Ghana&apos;s Clearinghouse for Data Bundles & Telecom Payouts
                </h1>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  Direct automated USSD dispatch across MTN, Telecel, and AT networks with instant settlement and wholesale agent margins.
                </p>
              </div>

              {/* Live Gateway Health & Latency Card */}
              <div className="rounded-2xl border border-border/80 bg-muted/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Radio className="size-3 text-emerald-500 animate-pulse" />
                    Live Carrier Switch Latency
                  </span>
                  <Badge variant="outline" className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30 font-bold px-1.5 py-0">
                    All Operational
                  </Badge>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-card border border-border/60">
                    <div className="flex items-center gap-2 font-semibold">
                      <span className="size-2 rounded-full bg-amber-500" />
                      <span>MTN MoMo Gateway</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <span className="text-muted-foreground">142ms</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">99.98%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-card border border-border/60">
                    <div className="flex items-center gap-2 font-semibold">
                      <span className="size-2 rounded-full bg-red-600" />
                      <span>Telecel Cash Rails</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <span className="text-muted-foreground">168ms</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">99.95%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-card border border-border/60">
                    <div className="flex items-center gap-2 font-semibold">
                      <span className="size-2 rounded-full bg-blue-600" />
                      <span>AT Money & Airtime</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <span className="text-muted-foreground">189ms</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">99.91%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Proof & Metrics */}
              <div className="grid grid-cols-3 gap-2 text-center pt-2">
                <div className="rounded-2xl border border-border/60 bg-muted/20 p-2.5">
                  <div className="text-base font-extrabold text-foreground">42.8K+</div>
                  <div className="text-[10px] text-muted-foreground">Registered Users</div>
                </div>
                <div className="rounded-2xl border border-border/60 bg-muted/20 p-2.5">
                  <div className="text-base font-extrabold text-foreground">GH₵ 12.4M</div>
                  <div className="text-[10px] text-muted-foreground">Volume Cleared</div>
                </div>
                <div className="rounded-2xl border border-border/60 bg-muted/20 p-2.5">
                  <div className="text-base font-extrabold text-foreground">1.4s</div>
                  <div className="text-[10px] text-muted-foreground">Avg Top-Up Speed</div>
                </div>
              </div>

              {/* Bank of Ghana & Security Reassurance */}
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground pt-2 border-t border-border/70">
                <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Bank of Ghana regulated switch compliant · Ghana Card NIA verified</span>
              </div>
            </div>

            {/* ============================================================ */}
            {/* RIGHT COLUMN: AUTHENTICATION CARD (Desktop lg:col-span-7) */}
            {/* ============================================================ */}
            <div className="lg:col-span-7 flex justify-center">
              <div className="w-full max-w-lg space-y-4">
                {/* Redirect Reason Callout */}
                {redirectReason && (
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-300 animate-in fade-in-50">
                    <Info className="size-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                    <div>
                      <div className="font-bold">Authentication Required</div>
                      <div className="text-[11px] opacity-90 mt-0.5">
                        {redirectReason}
                      </div>
                    </div>
                  </div>
                )}

                {/* Primary Card */}
                <Card className="border border-border rounded-3xl shadow-xl bg-card overflow-hidden">
                  {/* Card Header with Mode Switch Tabs */}
                  <CardHeader className="space-y-3 p-6 sm:p-7 pb-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                          {mode === "login" && "Sign In to Your Account"}
                          {mode === "register" && "Create Your Hub Account"}
                          {mode === "otp" && "Verify Ghana Mobile Number"}
                          {mode === "reset-pin" && "Recover Security PIN"}
                          {mode === "two-factor" && "Two-Factor Clearance"}
                          {mode === "kyc-verify" && "Ghana Card NIA Clearance"}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {mode === "login" && "Enter your registered Ghana mobile number or use a demo profile."}
                          {mode === "register" && "Join thousands of resellers, agents, and buyers across Ghana."}
                          {mode === "otp" && `Enter the 6-digit SMS verification token dispatched to ${otpPhone || "your mobile number"}.`}
                          {mode === "reset-pin" && "Follow the 3-step security procedure to set a new 4-digit PIN."}
                          {mode === "two-factor" && "Enter your 6-digit Authenticator code or approve the MoMo prompt."}
                          {mode === "kyc-verify" && "National Identification Authority (NIA) verification check."}
                        </CardDescription>
                      </div>

                      {/* Small SDH Logo */}
                      <div className="hidden sm:flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary font-black text-sm">
                        <Lock className="size-5" />
                      </div>
                    </div>

                    {/* Tabs for Sign In & Register */}
                    {(mode === "login" || mode === "register") && (
                      <div className="pt-2">
                        <Tabs
                          value={mode}
                          onValueChange={(v) => {
                            setMode(v as AuthFlowMode);
                            setLoginError("");
                            setRegError("");
                          }}
                        >
                          <TabsList className="grid w-full grid-cols-2 h-11 rounded-xl">
                            <TabsTrigger value="login" className="font-bold text-xs">
                              Sign In
                            </TabsTrigger>
                            <TabsTrigger value="register" className="font-bold text-xs">
                              Register New Account
                            </TabsTrigger>
                          </TabsList>
                        </Tabs>
                      </div>
                    )}
                  </CardHeader>

                  <CardContent className="p-6 sm:p-7 pt-2 space-y-4">
                    {/* ============================================================ */}
                    {/* 1. SIGN IN VIEW */}
                    {/* ============================================================ */}
                    {mode === "login" && (
                      <form onSubmit={handleLoginSubmit} className="space-y-4">
                        {loginError && (
                          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2">
                            <AlertCircle className="size-4 shrink-0" />
                            <span>{loginError}</span>
                          </div>
                        )}

                        {/* Phone / Email Input */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <Label htmlFor="login-phone" className="text-xs font-bold text-foreground">
                              Ghana Mobile Number or Email
                            </Label>
                            {currentDetectedNetwork && (
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1.5 ${currentDetectedNetwork.bg} ${currentDetectedNetwork.color}`}
                              >
                                <span className={`size-1.5 rounded-full ${currentDetectedNetwork.dot}`} />
                                {currentDetectedNetwork.name}
                              </span>
                            )}
                          </div>
                          <div className="relative">
                            <Smartphone className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
                            <Input
                              id="login-phone"
                              type="text"
                              required
                              placeholder="e.g. 024 419 2834 or admin@smartdatahub.gh"
                              value={loginPhone}
                              onChange={(e) => setLoginPhone(e.target.value)}
                              className="pl-10 h-11 text-sm font-medium"
                            />
                          </div>
                        </div>

                        {/* 4-Digit Security PIN Input */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <Label htmlFor="login-pin" className="text-xs font-bold text-foreground">
                              4-Digit Security PIN or Password
                            </Label>
                            <Button
                              type="button"
                              variant="link"
                              size="sm"
                              onClick={() => {
                                setResetStep("request");
                                setMode("reset-pin");
                              }}
                              className="text-[11px] font-bold text-primary p-0 h-auto hover:underline"
                            >
                              Forgot PIN?
                            </Button>
                          </div>
                          <div className="relative">
                            <KeyRound className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
                            <Input
                              id="login-pin"
                              type={showLoginPin ? "text" : "password"}
                              required
                              placeholder="Enter 4-digit PIN (e.g. 2026, 1122, 0000)"
                              value={loginPin}
                              onChange={(e) => setLoginPin(e.target.value)}
                              className="pl-10 pr-10 h-11 text-sm font-semibold tracking-wide"
                              maxLength={12}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => setShowLoginPin(!showLoginPin)}
                              className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                              aria-label={showLoginPin ? "Hide PIN" : "Show PIN"}
                            >
                              {showLoginPin ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                            </Button>
                          </div>
                        </div>

                        {/* Remember Me */}
                        <div className="flex items-center justify-between text-xs">
                          <label className="flex items-center gap-2 text-muted-foreground cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={rememberMe}
                              onChange={(e) => setRememberMe(e.target.checked)}
                              className="rounded border-border accent-primary cursor-pointer size-4"
                            />
                            <span>Keep me signed in on this device</span>
                          </label>
                        </div>

                        {/* Submit Button */}
                        <Button
                          type="submit"
                          disabled={isLoading}
                          size="lg"
                          className="w-full h-11 text-sm font-bold shadow-md cursor-pointer rounded-xl gap-2"
                        >
                          {isLoading ? (
                            <>
                              <RefreshCw className="size-4 animate-spin" />
                              <span>Verifying with Core Gateway...</span>
                            </>
                          ) : (
                            <>
                              <span>Sign In to Hub</span>
                              <ArrowRight className="size-4" />
                            </>
                          )}
                        </Button>

                        {/* Social / Alternative Divider */}
                        <div className="flex items-center gap-3 py-1">
                          <Separator className="flex-1" />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            or quick access
                          </span>
                          <Separator className="flex-1" />
                        </div>

                        {/* One-Click Demo Logins */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                              One-Click Demo Profiles
                            </span>
                            {onOpenSecurityPins && (
                              <Button
                                type="button"
                                variant="link"
                                size="sm"
                                onClick={onOpenSecurityPins}
                                className="text-[11px] font-bold text-primary p-0 h-auto"
                              >
                                View PIN Guide
                              </Button>
                            )}
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <button
                              type="button"
                              onClick={() => handleQuickLogin("customer")}
                              className="p-2.5 rounded-2xl border border-border bg-card hover:bg-muted/70 hover:border-primary/50 transition-all text-left cursor-pointer group"
                            >
                              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                                <User className="size-3.5 text-blue-500" />
                                <span>Customer</span>
                              </div>
                              <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                                PIN: 2026
                              </div>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleQuickLogin("agent")}
                              className="p-2.5 rounded-2xl border border-border bg-card hover:bg-muted/70 hover:border-primary/50 transition-all text-left cursor-pointer group"
                            >
                              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                                <Store className="size-3.5 text-amber-500" />
                                <span>Reseller</span>
                              </div>
                              <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                                PIN: 1122
                              </div>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleQuickLogin("admin")}
                              className="p-2.5 rounded-2xl border border-border bg-card hover:bg-muted/70 hover:border-primary/50 transition-all text-left cursor-pointer group"
                            >
                              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                                <Lock className="size-3.5 text-emerald-500" />
                                <span>NOC Admin</span>
                              </div>
                              <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                                PIN: 0000
                              </div>
                            </button>
                          </div>
                        </div>
                      </form>
                    )}

                    {/* ============================================================ */}
                    {/* 2. REGISTER VIEW */}
                    {/* ============================================================ */}
                    {mode === "register" && (
                      <form onSubmit={handleRegisterSubmit} className="space-y-4">
                        {regError && (
                          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2">
                            <AlertCircle className="size-4 shrink-0" />
                            <span>{regError}</span>
                          </div>
                        )}

                        {/* Account Role Selector Cards */}
                        <div className="grid grid-cols-2 gap-2.5">
                          <button
                            type="button"
                            onClick={() => setRegRole("customer")}
                            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                              regRole === "customer"
                                ? "border-primary bg-primary/10 text-primary shadow-xs ring-1 ring-primary/20"
                                : "border-border bg-card text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <div className="flex items-center gap-2 text-xs font-bold">
                              <User className="size-3.5" />
                              <span>Customer Account</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1 leading-snug">
                              Personal data bundles, airtime, and WAEC vouchers.
                            </p>
                          </button>

                          <button
                            type="button"
                            onClick={() => setRegRole("agent")}
                            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                              regRole === "agent"
                                ? "border-primary bg-primary/10 text-primary shadow-xs ring-1 ring-primary/20"
                                : "border-border bg-card text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <div className="flex items-center gap-2 text-xs font-bold">
                              <Store className="size-3.5" />
                              <span>Reseller Agent</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1 leading-snug">
                              Wholesale margin, custom web store & commissions.
                            </p>
                          </button>
                        </div>

                        {/* Full Legal Name */}
                        <div className="space-y-1">
                          <Label htmlFor="reg-name" className="text-xs font-bold text-foreground">
                            Full Legal Name
                          </Label>
                          <Input
                            id="reg-name"
                            type="text"
                            required
                            placeholder="e.g. Kwame Mensah"
                            value={regName}
                            onChange={(e) => setRegName(e.target.value)}
                            className="h-10 text-xs"
                          />
                        </div>

                        {/* Ghana Mobile Number */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <Label htmlFor="reg-phone" className="text-xs font-bold text-foreground">
                              Ghana Mobile Number (MoMo Wallet)
                            </Label>
                            {currentDetectedNetwork && (
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1.5 ${currentDetectedNetwork.bg} ${currentDetectedNetwork.color}`}
                              >
                                <span className={`size-1.5 rounded-full ${currentDetectedNetwork.dot}`} />
                                {currentDetectedNetwork.name}
                              </span>
                            )}
                          </div>
                          <Input
                            id="reg-phone"
                            type="tel"
                            required
                            placeholder="e.g. 024 419 2834"
                            value={regPhone}
                            onChange={(e) => setRegPhone(e.target.value)}
                            className="h-10 text-xs"
                            maxLength={12}
                          />
                        </div>

                        {/* Email Address (Optional) */}
                        <div className="space-y-1">
                          <Label htmlFor="reg-email" className="text-xs font-bold text-foreground">
                            Email Address (Optional)
                          </Label>
                          <Input
                            id="reg-email"
                            type="email"
                            placeholder="e.g. kwame@gmail.com"
                            value={regEmail}
                            onChange={(e) => setRegEmail(e.target.value)}
                            className="h-10 text-xs"
                          />
                        </div>

                        {/* Ghana Card PIN (NIA) */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <Label htmlFor="reg-ghana-card" className="text-xs font-bold text-foreground">
                              Ghana Card Number (NIA)
                            </Label>
                            <span className="text-[10px] text-muted-foreground">
                              Tier 2 Limits & AFA Subsidies
                            </span>
                          </div>
                          <Input
                            id="reg-ghana-card"
                            type="text"
                            placeholder="GHA-721948192-3"
                            value={regGhanaCard}
                            onChange={(e) => setRegGhanaCard(e.target.value.toUpperCase())}
                            className="h-10 text-xs uppercase font-mono"
                            maxLength={15}
                          />
                        </div>

                        {/* Security PIN and Confirm PIN */}
                        <div className="grid grid-cols-2 gap-2.5">
                          <div className="space-y-1">
                            <Label htmlFor="reg-pin" className="text-xs font-bold text-foreground">
                              Create 4-Digit PIN
                            </Label>
                            <Input
                              id="reg-pin"
                              type="password"
                              required
                              placeholder="e.g. 2026"
                              value={regPin}
                              onChange={(e) => setRegPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                              className="h-10 text-center font-mono font-bold tracking-widest text-sm"
                              maxLength={4}
                            />
                          </div>

                          <div className="space-y-1">
                            <Label htmlFor="reg-confirm-pin" className="text-xs font-bold text-foreground">
                              Confirm PIN
                            </Label>
                            <Input
                              id="reg-confirm-pin"
                              type="password"
                              required
                              placeholder="Re-enter PIN"
                              value={regConfirmPin}
                              onChange={(e) => setRegConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                              className={`h-10 text-center font-mono font-bold tracking-widest text-sm ${
                                regConfirmPin && regPin === regConfirmPin
                                  ? "border-emerald-500 ring-1 ring-emerald-500/30"
                                  : ""
                              }`}
                              maxLength={4}
                            />
                          </div>
                        </div>

                        {/* Optional Referral Code Toggle */}
                        <div>
                          {!showReferralInput ? (
                            <Button
                              type="button"
                              variant="link"
                              size="sm"
                              onClick={() => setShowReferralInput(true)}
                              className="text-[11px] font-semibold text-muted-foreground hover:text-primary p-0 h-auto"
                            >
                              + Have an Agent Referral or Promo Code?
                            </Button>
                          ) : (
                            <div className="space-y-1 animate-in fade-in-50">
                              <Label htmlFor="reg-ref" className="text-xs font-bold text-foreground">
                                Referral / Agent Code
                              </Label>
                              <Input
                                id="reg-ref"
                                type="text"
                                placeholder="e.g. AGENT-KOFI-24"
                                value={regReferralCode}
                                onChange={(e) => setRegReferralCode(e.target.value.toUpperCase())}
                                className="h-9 text-xs uppercase"
                              />
                            </div>
                          )}
                        </div>

                        {/* Terms of Service Checkbox */}
                        <div className="flex items-start gap-2 pt-1 text-xs text-muted-foreground">
                          <input
                            id="terms-check"
                            type="checkbox"
                            checked={agreeToTerms}
                            onChange={(e) => setAgreeToTerms(e.target.checked)}
                            className="mt-0.5 rounded border-border accent-primary cursor-pointer size-4"
                          />
                          <Label htmlFor="terms-check" className="text-[11px] leading-relaxed cursor-pointer font-normal text-muted-foreground">
                            I agree to the Smart Data Hub Terms of Service, Telecom Fair Usage Guidelines, and Bank of Ghana compliant settlement protocols.
                          </Label>
                        </div>

                        {/* Proceed to OTP Button */}
                        <Button
                          type="submit"
                          size="lg"
                          className="w-full h-11 text-sm font-bold shadow-md cursor-pointer rounded-xl gap-2"
                        >
                          <span>Proceed to Phone Verification</span>
                          <ArrowRight className="size-4" />
                        </Button>
                      </form>
                    )}

                    {/* ============================================================ */}
                    {/* 3. OTP VERIFICATION VIEW */}
                    {/* ============================================================ */}
                    {mode === "otp" && (
                      <form onSubmit={handleOtpSubmit} className="space-y-5 text-center">
                        <div className="relative mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          <Smartphone className="size-7" />
                        </div>

                        <div className="space-y-1">
                          <h3 className="text-lg font-black text-foreground">
                            Enter 6-Digit Verification Code
                          </h3>
                          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                            Dispatched via {otpChannel === "sms" ? "SMS Gateway" : "WhatsApp"} to{" "}
                            <strong className="text-foreground font-bold">{otpPhone || "024 419 2834"}</strong>
                          </p>
                        </div>

                        {/* Demo Testing Helper Pill */}
                        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3 flex items-center justify-between gap-2 max-w-sm mx-auto text-xs">
                          <div className="text-left">
                            <span className="text-muted-foreground text-[11px]">Demo OTP Token: </span>
                            <span className="font-mono font-black text-primary">419088</span>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAutoFillOtp}
                            className="text-xs font-bold h-7 rounded-lg text-primary border-primary/30 hover:bg-primary/10"
                          >
                            Auto-Fill
                          </Button>
                        </div>

                        {/* 6-Digit Individual Input Boxes */}
                        <div className="flex justify-center gap-2 sm:gap-2.5 my-2">
                          {otpDigits.map((digit, idx) => (
                            <input
                              key={idx}
                              ref={(el) => {
                                otpInputRefs.current[idx] = el;
                              }}
                              type="text"
                              inputMode="numeric"
                              maxLength={1}
                              value={digit}
                              onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                              onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                              onPaste={idx === 0 ? handleOtpPaste : undefined}
                              className="size-11 sm:size-12 rounded-xl border border-border bg-muted/40 text-center font-mono text-xl font-black text-foreground shadow-xs focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            />
                          ))}
                        </div>

                        {/* Channel Selector: SMS vs WhatsApp */}
                        <div className="flex items-center justify-center gap-3 text-xs">
                          <button
                            type="button"
                            onClick={() => setOtpChannel("sms")}
                            className={`flex items-center gap-1 font-semibold transition-colors cursor-pointer ${
                              otpChannel === "sms" ? "text-primary font-bold" : "text-muted-foreground"
                            }`}
                          >
                            <Smartphone className="size-3.5" />
                            <span>SMS Delivery</span>
                          </button>
                          <span className="text-muted-foreground">·</span>
                          <button
                            type="button"
                            onClick={() => setOtpChannel("whatsapp")}
                            className={`flex items-center gap-1 font-semibold transition-colors cursor-pointer ${
                              otpChannel === "whatsapp" ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-muted-foreground"
                            }`}
                          >
                            <MessageSquare className="size-3.5" />
                            <span>WhatsApp OTP</span>
                          </button>
                        </div>

                        {/* Timer & Resend */}
                        <div className="flex items-center justify-between text-xs pt-1 max-w-sm mx-auto">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setMode("register")}
                            className="text-xs text-muted-foreground hover:text-foreground h-auto p-0"
                          >
                            Change Number
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={otpTimer > 0}
                            onClick={() => setOtpTimer(59)}
                            className={`text-xs font-bold h-auto p-0 ${
                              otpTimer > 0 ? "text-muted-foreground" : "text-primary hover:underline"
                            }`}
                          >
                            {otpTimer > 0 ? `Resend in ${otpTimer}s` : "Resend Token"}
                          </Button>
                        </div>

                        {/* Submit Button */}
                        <Button
                          type="submit"
                          disabled={isLoading || otpDigits.join("").length < 4}
                          size="lg"
                          className="w-full h-11 text-sm font-bold shadow-md cursor-pointer rounded-xl gap-2"
                        >
                          {isLoading ? (
                            <>
                              <RefreshCw className="size-4 animate-spin" />
                              <span>Validating Token with Telco Switch...</span>
                            </>
                          ) : (
                            <>
                              <span>Verify & Launch Workspace</span>
                              <ArrowRight className="size-4" />
                            </>
                          )}
                        </Button>
                      </form>
                    )}

                    {/* ============================================================ */}
                    {/* 4. RESET PIN RECOVERY FLOW */}
                    {/* ============================================================ */}
                    {mode === "reset-pin" && (
                      <div className="space-y-4">
                        {/* Step indicator */}
                        <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground pb-1">
                          <span className={resetStep === "request" ? "text-primary" : ""}>
                            1. Mobile
                          </span>
                          <ChevronRight className="size-3" />
                          <span className={resetStep === "verify" ? "text-primary" : ""}>
                            2. Verify OTP
                          </span>
                          <ChevronRight className="size-3" />
                          <span className={resetStep === "new-pin" ? "text-primary" : ""}>
                            3. New PIN
                          </span>
                        </div>

                        {resetError && (
                          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2">
                            <AlertCircle className="size-4 shrink-0" />
                            <span>{resetError}</span>
                          </div>
                        )}

                        {/* STEP 4A: REQUEST PHONE */}
                        {resetStep === "request" && (
                          <form onSubmit={handleResetRequest} className="space-y-4">
                            <p className="text-xs text-muted-foreground">
                              Enter your registered Ghana mobile number. We will dispatch an automated recovery OTP token to your handset.
                            </p>

                            <div className="space-y-1.5">
                              <div className="flex justify-between items-center">
                                <Label htmlFor="reset-phone" className="text-xs font-bold text-foreground">
                                  Registered Ghana Mobile Number
                                </Label>
                                {currentDetectedNetwork && (
                                  <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1.5 ${currentDetectedNetwork.bg} ${currentDetectedNetwork.color}`}
                                  >
                                    <span className={`size-1.5 rounded-full ${currentDetectedNetwork.dot}`} />
                                    {currentDetectedNetwork.name}
                                  </span>
                                )}
                              </div>
                              <Input
                                id="reset-phone"
                                type="tel"
                                required
                                placeholder="e.g. 024 419 2834"
                                value={resetPhone}
                                onChange={(e) => setResetPhone(e.target.value)}
                                className="h-11 text-sm font-semibold"
                              />
                            </div>

                            <Button
                              type="submit"
                              size="lg"
                              className="w-full h-11 text-sm font-bold shadow-md cursor-pointer rounded-xl"
                            >
                              Dispatch Recovery SMS
                            </Button>

                            <div className="text-center pt-1">
                              <Button
                                type="button"
                                variant="link"
                                size="sm"
                                onClick={() => setMode("login")}
                                className="text-xs font-semibold text-muted-foreground hover:text-foreground"
                              >
                                Return to Sign In
                              </Button>
                            </div>
                          </form>
                        )}

                        {/* STEP 4B: VERIFY OTP */}
                        {resetStep === "verify" && (
                          <form onSubmit={handleResetVerify} className="space-y-4">
                            <p className="text-xs text-muted-foreground">
                              Enter the 4 or 6-digit recovery code dispatched to <strong className="text-foreground">{resetPhone}</strong>.
                            </p>

                            {/* Demo Helper */}
                            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3 flex items-center justify-between text-xs">
                              <div>
                                <span className="text-muted-foreground text-[11px]">Demo Recovery Token: </span>
                                <span className="font-mono font-black text-primary">4190</span>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setResetOtp("4190")}
                                className="text-xs font-bold h-7 rounded-lg text-primary border-primary/30"
                              >
                                Fill 4190
                              </Button>
                            </div>

                            <div className="space-y-1.5">
                              <Label htmlFor="reset-otp" className="text-xs font-bold text-foreground">
                                Enter Recovery Code
                              </Label>
                              <Input
                                id="reset-otp"
                                type="text"
                                required
                                placeholder="• • • •"
                                value={resetOtp}
                                onChange={(e) => setResetOtp(e.target.value)}
                                className="h-11 text-center font-mono text-lg font-black tracking-widest"
                                maxLength={6}
                                autoFocus
                              />
                            </div>

                            <Button
                              type="submit"
                              size="lg"
                              className="w-full h-11 text-sm font-bold shadow-md cursor-pointer rounded-xl"
                            >
                              Verify Code & Set New PIN
                            </Button>

                            <div className="text-center pt-1">
                              <Button
                                type="button"
                                variant="link"
                                size="sm"
                                onClick={() => setResetStep("request")}
                                className="text-xs font-semibold text-muted-foreground hover:text-foreground"
                              >
                                Back to Phone Input
                              </Button>
                            </div>
                          </form>
                        )}

                        {/* STEP 4C: SET NEW PIN */}
                        {resetStep === "new-pin" && (
                          <form onSubmit={handleResetNewPin} className="space-y-4">
                            <p className="text-xs text-muted-foreground">
                              Choose a new 4-digit security PIN for your Smart Data Hub account.
                            </p>

                            <div className="grid grid-cols-2 gap-2.5">
                              <div className="space-y-1">
                                <Label htmlFor="new-pin" className="text-xs font-bold text-foreground">
                                  New 4-Digit PIN
                                </Label>
                                <Input
                                  id="new-pin"
                                  type="password"
                                  required
                                  placeholder="e.g. 2026"
                                  value={newPin}
                                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                                  className="h-11 text-center font-mono font-bold tracking-widest text-base"
                                  maxLength={4}
                                />
                              </div>

                              <div className="space-y-1">
                                <Label htmlFor="confirm-new-pin" className="text-xs font-bold text-foreground">
                                  Confirm New PIN
                                </Label>
                                <Input
                                  id="confirm-new-pin"
                                  type="password"
                                  required
                                  placeholder="Repeat PIN"
                                  value={confirmNewPin}
                                  onChange={(e) => setConfirmNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                                  className={`h-11 text-center font-mono font-bold tracking-widest text-base ${
                                    confirmNewPin && newPin === confirmNewPin
                                      ? "border-emerald-500 ring-1 ring-emerald-500/30"
                                      : ""
                                  }`}
                                  maxLength={4}
                                />
                              </div>
                            </div>

                            <Button
                              type="submit"
                              size="lg"
                              className="w-full h-11 text-sm font-bold shadow-md cursor-pointer rounded-xl"
                            >
                              Update PIN & Finish
                            </Button>
                          </form>
                        )}

                        {/* STEP 4D: SUCCESS */}
                        {resetStep === "success" && (
                          <div className="text-center space-y-4 py-3">
                            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="size-8" />
                            </div>

                            <div className="space-y-1">
                              <h4 className="text-lg font-black text-foreground">
                                Security PIN Successfully Reset
                              </h4>
                              <p className="text-xs text-muted-foreground">
                                Your account on <strong className="text-foreground">{resetPhone}</strong> has been updated with your new PIN.
                              </p>
                            </div>

                            <Button
                              type="button"
                              onClick={() => {
                                setLoginPhone(resetPhone);
                                setLoginPin(newPin);
                                setMode("login");
                              }}
                              size="lg"
                              className="w-full h-11 text-sm font-bold shadow-md cursor-pointer rounded-xl"
                            >
                              Sign In with New Credentials
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>

                  {/* Card Footer with Regulatory Compliance Notes */}
                  <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-2 border-t border-border/80 bg-muted/20 px-6 py-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Ghana Data Protection Act 2012 (Act 843) Compliant</span>
                    </div>
                    <span className="font-medium text-[11px]">256-Bit SSL Encrypted</span>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AuthPage;

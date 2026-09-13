import React, { useState, useEffect, useRef } from "react";
import {
  Lock,
  KeyRound,
  ShieldCheck,
  Smartphone,
  Mail,
  User,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  Building2,
  Store,
  ChevronRight,
  Radio,
  MessageSquare,
} from "lucide-react";
import { UserRole, UserAccount } from "../../types";
import { detectGhanaNetwork } from "../../mockData";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";

export type AuthMode = "sign-in" | "sign-up" | "otp-verify" | "forgot-password";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: AuthMode;
  onLoginSuccess: (user: UserAccount) => void;
  onOpenSecurityPins?: () => void;
}

export const DEMO_ACCOUNTS: Record<string, UserAccount> = {
  customer: {
    id: "usr-kojo-01",
    name: "Kojo Mensah",
    phone: "0244192834",
    email: "kojomensah94@gmail.com",
    role: "customer",
    isKycVerified: true,
    ghanaCardNumber: "GHA-721948192-3",
    securityPin: "2026",
  },
  agent: {
    id: "usr-kofi-02",
    name: "Kofi Owusu",
    phone: "0244192834",
    email: "kofitelecom@gmail.com",
    role: "agent",
    isKycVerified: true,
    ghanaCardNumber: "GHA-948102941-8",
    securityPin: "1122",
  },
  admin: {
    id: "usr-admin-03",
    name: "SDH NOC Superadmin",
    phone: "0200000001",
    email: "noc.admin@smartdatahub.gh",
    role: "admin",
    isKycVerified: true,
    ghanaCardNumber: "GHA-000000001-0",
    securityPin: "0000",
  },
};

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = "sign-in",
  onLoginSuccess,
  onOpenSecurityPins,
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);

  // Form State
  const [phoneOrEmail, setPhoneOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Registration State
  const [fullName, setFullName] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupRole, setSignupRole] = useState<"customer" | "agent">("customer");
  const [signupPin, setSignupPin] = useState("2026");
  const [confirmSignupPin, setConfirmSignupPin] = useState("2026");
  const [signupGhanaCard, setSignupGhanaCard] = useState("");

  // OTP State
  const [otpCode, setOtpCode] = useState<string[]>(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(59);
  const [otpTargetPhone, setOtpTargetPhone] = useState("0244192834");
  const [otpChannel, setOtpChannel] = useState<"sms" | "whatsapp">("sms");
  const [otpSuccessMessage, setOtpSuccessMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Forgot Password / Reset State
  const [resetStep, setResetStep] = useState<"phone" | "otp" | "new-pin" | "done">("phone");
  const [resetNewPin, setResetNewPin] = useState("");
  const [confirmResetNewPin, setConfirmResetNewPin] = useState("");

  // Sync mode when prop changes
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setErrorMessage("");
      setOtpSuccessMessage(false);
      setResetStep("phone");
    }
  }, [isOpen, initialMode]);

  // Countdown timer for OTP
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if ((mode === "otp-verify" || (mode === "forgot-password" && resetStep === "otp")) && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [mode, resetStep, timer]);

  const rawNetwork = (mode === "sign-up" ? signupPhone : phoneOrEmail).trim().length >= 3
    ? detectGhanaNetwork(mode === "sign-up" ? signupPhone : phoneOrEmail)
    : null;

  const getNetworkBadge = (net: string | null) => {
    if (!net) return null;
    if (net === "MTN") {
      return {
        name: "MTN Ghana",
        badgeColor: "text-amber-950 dark:text-amber-300 bg-amber-400/20 border-amber-500/40",
      };
    }
    if (net === "Telecel") {
      return {
        name: "Telecel Ghana",
        badgeColor: "text-red-700 dark:text-red-300 bg-red-500/15 border-red-500/30",
      };
    }
    return {
      name: "AT (AirtelTigo)",
      badgeColor: "text-blue-700 dark:text-blue-300 bg-blue-500/15 border-blue-500/30",
    };
  };

  const detectedNetwork = getNetworkBadge(rawNetwork);

  const handleQuickDemoLogin = (accountKey: "customer" | "agent" | "admin") => {
    const user = DEMO_ACCOUNTS[accountKey];
    onLoginSuccess(user);
    onClose();
  };

  const handleSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!phoneOrEmail.trim() || !password.trim()) {
      setErrorMessage("Please enter your mobile number or email and your security PIN.");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      let foundUser = Object.values(DEMO_ACCOUNTS).find(
        (u) =>
          u.phone === phoneOrEmail.trim() ||
          u.email.toLowerCase() === phoneOrEmail.trim().toLowerCase()
      );

      if (!foundUser) {
        foundUser = {
          id: `usr-${Date.now()}`,
          name: phoneOrEmail.includes("@")
            ? phoneOrEmail.split("@")[0]
            : "Ghana Subscriber",
          phone: phoneOrEmail.replace(/\D/g, "") || "0244192834",
          email: phoneOrEmail.includes("@")
            ? phoneOrEmail
            : `${phoneOrEmail}@smartdatahub.gh`,
          role: "customer",
          isKycVerified: true,
          ghanaCardNumber: "GHA-782194120-1",
          securityPin: "2026",
        };
      }

      onLoginSuccess(foundUser);
      onClose();
    }, 450);
  };

  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!fullName || !signupPhone || !signupPin) {
      setErrorMessage("Please fill in all mandatory legal name, mobile number, and PIN fields.");
      return;
    }
    if (signupPin !== confirmSignupPin) {
      setErrorMessage("Your security PIN and confirmation PIN do not match.");
      return;
    }

    setOtpTargetPhone(signupPhone);
    setTimer(59);
    setOtpCode(["", "", "", "", "", ""]);
    setMode("otp-verify");
  };

  const handleOtpInput = (index: number, val: string) => {
    const clean = val.replace(/\D/g, "").slice(-1);
    const updated = [...otpCode];
    updated[index] = clean;
    setOtpCode(updated);

    if (clean && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpCode[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleFillDemoOtp = () => {
    setOtpCode(["4", "1", "9", "0", "8", "8"]);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otpCode.join("");

    if (fullOtp.length < 4) {
      setErrorMessage("Please enter the complete SMS verification code.");
      return;
    }

    setIsLoading(true);
    setOtpSuccessMessage(true);
    setTimeout(() => {
      setIsLoading(false);
      const newUser: UserAccount = {
        id: `usr-${Date.now()}`,
        name: fullName || "Kojo Mensah",
        phone: signupPhone || otpTargetPhone,
        email: signupEmail || `${signupPhone}@smartdatahub.gh`,
        role: signupRole,
        isKycVerified: true,
        ghanaCardNumber: signupGhanaCard || "GHA-721948192-3",
        securityPin: signupPin || "2026",
      };
      onLoginSuccess(newUser);
      onClose();
    }, 700);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden rounded-3xl border-border">
        {/* Header with gradient styling */}
        <DialogHeader className="p-6 pb-4 border-b border-border bg-gradient-to-br from-primary/10 via-card to-card text-left">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary font-bold">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-black text-foreground">
                {mode === "sign-in" && "Sign In to Smart Data Hub"}
                {mode === "sign-up" && "Create Your Hub Account"}
                {mode === "otp-verify" && "Ghana Mobile OTP Verification"}
                {mode === "forgot-password" && "Recover Security Credentials"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {mode === "sign-in" && "Enter your Ghana phone number or select a demo role below."}
                {mode === "sign-up" && "Wholesale bundles, automated top-ups & commission earnings."}
                {mode === "otp-verify" && `Enter the SMS code sent to ${otpTargetPhone}.`}
                {mode === "forgot-password" && "Reset your 4-digit security PIN via phone verification."}
              </DialogDescription>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          {(mode === "sign-in" || mode === "sign-up") && (
            <div className="pt-3">
              <Tabs
                value={mode}
                onValueChange={(val) => {
                  setMode(val as AuthMode);
                  setErrorMessage("");
                }}
              >
                <TabsList className="grid w-full grid-cols-2 h-10 rounded-xl">
                  <TabsTrigger value="sign-in" className="text-xs font-bold">
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger value="sign-up" className="text-xs font-bold">
                    Register Account
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          )}
        </DialogHeader>

        {/* Scrollable Content */}
        <ScrollArea className="max-h-[72vh] p-6">
          <div className="space-y-4 text-xs pr-1">
            {errorMessage && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* ============================================================ */}
            {/* SIGN IN FORM */}
            {/* ============================================================ */}
            {mode === "sign-in" && (
              <form onSubmit={handleSignInSubmit} className="space-y-4">
                {/* Phone or Email */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="modal-login-phone" className="text-xs font-bold text-foreground">
                      Ghana Mobile Number or Email
                    </Label>
                    {detectedNetwork && (
                      <Badge variant="outline" className={`text-[10px] font-bold px-1.5 py-0 ${detectedNetwork.badgeColor}`}>
                        {detectedNetwork.name}
                      </Badge>
                    )}
                  </div>
                  <div className="relative">
                    <Smartphone className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
                    <Input
                      id="modal-login-phone"
                      type="text"
                      required
                      placeholder="e.g. 024 419 2834 or admin@smartdatahub.gh"
                      value={phoneOrEmail}
                      onChange={(e) => setPhoneOrEmail(e.target.value)}
                      className="pl-10 h-10 text-xs"
                    />
                  </div>
                </div>

                {/* Password / PIN */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="modal-login-pin" className="text-xs font-bold text-foreground">
                      4-Digit Security PIN or Password
                    </Label>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      onClick={() => setMode("forgot-password")}
                      className="text-[11px] font-bold text-primary p-0 h-auto"
                    >
                      Forgot PIN?
                    </Button>
                  </div>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
                    <Input
                      id="modal-login-pin"
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="4-digit PIN (e.g. 2026, 1122, 0000)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-10 text-xs font-semibold"
                      maxLength={12}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </Button>
                  </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    id="modal-remember"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-border accent-primary cursor-pointer size-4"
                  />
                  <Label htmlFor="modal-remember" className="cursor-pointer font-normal text-xs text-muted-foreground">
                    Keep me signed in on this device
                  </Label>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  size="lg"
                  className="w-full font-bold text-xs h-10 gap-2 rounded-xl"
                >
                  {isLoading ? (
                    <>
                      <RotateCcw className="size-3.5 animate-spin" />
                      <span>Verifying with Telco Switch...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Hub</span>
                      <ArrowRight className="size-3.5" />
                    </>
                  )}
                </Button>

                {/* Demo Quick Logins */}
                <div className="pt-2 border-t border-border space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      One-Click Demo Profiles
                    </span>
                    {onOpenSecurityPins && (
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        onClick={onOpenSecurityPins}
                        className="text-[10px] font-bold text-primary p-0 h-auto"
                      >
                        Cheat Sheet
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuickDemoLogin("customer")}
                      className="p-2 rounded-xl border border-border bg-card hover:bg-muted/70 hover:border-primary/50 text-left transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-1 font-bold text-[11px] text-foreground">
                        <User className="size-3 text-blue-500" />
                        <span>Customer</span>
                      </div>
                      <div className="text-[9px] text-muted-foreground font-mono">PIN: 2026</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickDemoLogin("agent")}
                      className="p-2 rounded-xl border border-border bg-card hover:bg-muted/70 hover:border-primary/50 text-left transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-1 font-bold text-[11px] text-foreground">
                        <Store className="size-3 text-amber-500" />
                        <span>Agent</span>
                      </div>
                      <div className="text-[9px] text-muted-foreground font-mono">PIN: 1122</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickDemoLogin("admin")}
                      className="p-2 rounded-xl border border-border bg-card hover:bg-muted/70 hover:border-primary/50 text-left transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-1 font-bold text-[11px] text-foreground">
                        <Lock className="size-3 text-emerald-500" />
                        <span>Admin</span>
                      </div>
                      <div className="text-[9px] text-muted-foreground font-mono">PIN: 0000</div>
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* ============================================================ */}
            {/* REGISTER FORM */}
            {/* ============================================================ */}
            {mode === "sign-up" && (
              <form onSubmit={handleSignUpSubmit} className="space-y-3.5">
                {/* Role Picker */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSignupRole("customer")}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      signupRole === "customer"
                        ? "border-primary bg-primary/10 text-primary shadow-xs"
                        : "border-border bg-card text-muted-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold">
                      <User className="size-3.5" />
                      <span>Customer</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Top-ups, bundles & WAEC
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSignupRole("agent")}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      signupRole === "agent"
                        ? "border-primary bg-primary/10 text-primary shadow-xs"
                        : "border-border bg-card text-muted-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold">
                      <Store className="size-3.5" />
                      <span>Reseller Agent</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Wholesale store & margin
                    </p>
                  </button>
                </div>

                {/* Name */}
                <div className="space-y-1">
                  <Label htmlFor="m-reg-name" className="text-xs font-bold text-foreground">
                    Full Legal Name
                  </Label>
                  <Input
                    id="m-reg-name"
                    type="text"
                    required
                    placeholder="e.g. Kwame Mensah"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                {/* Mobile */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="m-reg-phone" className="text-xs font-bold text-foreground">
                      Ghana Mobile Number
                    </Label>
                    {detectedNetwork && (
                      <Badge variant="outline" className={`text-[10px] font-bold px-1.5 py-0 ${detectedNetwork.badgeColor}`}>
                        {detectedNetwork.name}
                      </Badge>
                    )}
                  </div>
                  <Input
                    id="m-reg-phone"
                    type="tel"
                    required
                    placeholder="e.g. 024 419 2834"
                    value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value)}
                    className="h-9 text-xs"
                    maxLength={12}
                  />
                </div>

                {/* Ghana Card NIA */}
                <div className="space-y-1">
                  <Label htmlFor="m-reg-card" className="text-xs font-bold text-foreground">
                    Ghana Card Number (NIA)
                  </Label>
                  <Input
                    id="m-reg-card"
                    type="text"
                    placeholder="GHA-721948192-3"
                    value={signupGhanaCard}
                    onChange={(e) => setSignupGhanaCard(e.target.value.toUpperCase())}
                    className="h-9 text-xs font-mono uppercase"
                    maxLength={15}
                  />
                </div>

                {/* PIN and Confirm */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="m-reg-pin" className="text-xs font-bold text-foreground">
                      Create 4-Digit PIN
                    </Label>
                    <Input
                      id="m-reg-pin"
                      type="password"
                      required
                      placeholder="e.g. 2026"
                      value={signupPin}
                      onChange={(e) => setSignupPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      className="h-9 text-center font-mono font-bold text-xs"
                      maxLength={4}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="m-reg-cpin" className="text-xs font-bold text-foreground">
                      Confirm PIN
                    </Label>
                    <Input
                      id="m-reg-cpin"
                      type="password"
                      required
                      placeholder="Repeat PIN"
                      value={confirmSignupPin}
                      onChange={(e) => setConfirmSignupPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      className="h-9 text-center font-mono font-bold text-xs"
                      maxLength={4}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full font-bold text-xs h-10 gap-2 rounded-xl mt-2"
                >
                  <span>Continue to Phone Verification</span>
                  <ArrowRight className="size-3.5" />
                </Button>
              </form>
            )}

            {/* ============================================================ */}
            {/* OTP VERIFY */}
            {/* ============================================================ */}
            {mode === "otp-verify" && (
              <form onSubmit={handleVerifyOtp} className="space-y-4 text-center">
                <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Smartphone className="size-6" />
                </div>

                <div className="space-y-1">
                  <h4 className="text-base font-black text-foreground">
                    Enter 6-Digit SMS Code
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Dispatched to <strong className="text-foreground">{otpTargetPhone}</strong>
                  </p>
                </div>

                {/* Demo autofill pill */}
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-muted-foreground text-[10px]">Demo Code: </span>
                    <span className="font-mono font-bold text-primary">419088</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleFillDemoOtp}
                    className="text-xs font-bold h-6 rounded-lg text-primary border-primary/30"
                  >
                    Auto-Fill
                  </Button>
                </div>

                {/* 6 Digit Inputs */}
                <div className="flex justify-center gap-2">
                  {otpCode.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        otpRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpInput(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className="size-10 rounded-xl border border-border bg-muted/40 text-center font-mono text-lg font-black text-foreground focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  ))}
                </div>

                {/* Timer & Resend */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setMode("sign-up")}
                    className="text-xs text-muted-foreground hover:text-foreground h-auto p-0"
                  >
                    Change Number
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={timer > 0}
                    onClick={() => setTimer(59)}
                    className={`text-xs font-bold h-auto p-0 ${
                      timer > 0 ? "text-muted-foreground" : "text-primary hover:underline"
                    }`}
                  >
                    {timer > 0 ? `Resend in ${timer}s` : "Resend Token"}
                  </Button>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || otpCode.join("").length < 4}
                  size="lg"
                  className="w-full font-bold text-xs h-10 gap-2 rounded-xl"
                >
                  {isLoading ? (
                    <>
                      <RotateCcw className="size-3.5 animate-spin" />
                      <span>Verifying Code...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify & Enter Dashboard</span>
                      <ArrowRight className="size-3.5" />
                    </>
                  )}
                </Button>
              </form>
            )}

            {/* ============================================================ */}
            {/* FORGOT PASSWORD / PIN RECOVERY */}
            {/* ============================================================ */}
            {mode === "forgot-password" && (
              <div className="space-y-4">
                {resetStep === "phone" && (
                  <div className="space-y-4">
                    <p className="text-xs text-muted-foreground">
                      Enter your registered Ghana mobile number to receive an immediate security PIN reset token.
                    </p>

                    <div className="space-y-1.5">
                      <Label htmlFor="m-reset-phone" className="text-xs font-bold text-foreground">
                        Registered Ghana Mobile Number
                      </Label>
                      <Input
                        id="m-reset-phone"
                        type="tel"
                        required
                        placeholder="e.g. 024 419 2834"
                        value={phoneOrEmail}
                        onChange={(e) => setPhoneOrEmail(e.target.value)}
                        className="h-10 text-xs"
                      />
                    </div>

                    <Button
                      type="button"
                      onClick={() => {
                        if (phoneOrEmail.length >= 10) {
                          setResetStep("otp");
                          setTimer(59);
                        } else {
                          setErrorMessage("Please enter a valid 10-digit mobile number.");
                        }
                      }}
                      className="w-full font-bold text-xs h-10 rounded-xl"
                    >
                      Send Recovery Code
                    </Button>

                    <div className="text-center">
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        onClick={() => setMode("sign-in")}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        Return to Sign In
                      </Button>
                    </div>
                  </div>
                )}

                {resetStep === "otp" && (
                  <div className="space-y-4">
                    <p className="text-xs text-muted-foreground">
                      Enter the recovery code sent to <strong className="text-foreground">{phoneOrEmail}</strong>.
                    </p>

                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-muted-foreground text-[10px]">Demo Token: </span>
                        <span className="font-mono font-bold text-primary">4190</span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setResetStep("new-pin")}
                        className="text-xs font-bold h-6 rounded-lg text-primary border-primary/30"
                      >
                        Use 4190
                      </Button>
                    </div>

                    <Input
                      type="text"
                      placeholder="• • • •"
                      className="h-10 text-center font-mono text-base font-black tracking-widest"
                      maxLength={6}
                    />

                    <Button
                      type="button"
                      onClick={() => setResetStep("new-pin")}
                      className="w-full font-bold text-xs h-10 rounded-xl"
                    >
                      Verify Token
                    </Button>
                  </div>
                )}

                {resetStep === "new-pin" && (
                  <div className="space-y-4">
                    <p className="text-xs text-muted-foreground">
                      Set a new 4-digit security PIN for your account.
                    </p>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs font-bold text-foreground">New PIN</Label>
                        <Input
                          type="password"
                          placeholder="2026"
                          value={resetNewPin}
                          onChange={(e) => setResetNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                          className="h-10 text-center font-mono font-bold text-xs"
                          maxLength={4}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-bold text-foreground">Confirm</Label>
                        <Input
                          type="password"
                          placeholder="2026"
                          value={confirmResetNewPin}
                          onChange={(e) => setConfirmResetNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                          className="h-10 text-center font-mono font-bold text-xs"
                          maxLength={4}
                        />
                      </div>
                    </div>

                    <Button
                      type="button"
                      onClick={() => {
                        setPassword(resetNewPin || "2026");
                        setMode("sign-in");
                      }}
                      className="w-full font-bold text-xs h-10 rounded-xl"
                    >
                      Save New PIN & Sign In
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer with compliance badge */}
        <DialogFooter className="p-3 border-t border-border bg-muted/20 flex justify-center text-[10px] text-muted-foreground">
          <span>Bank of Ghana Payment Switch Compliant · 256-Bit SSL</span>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;

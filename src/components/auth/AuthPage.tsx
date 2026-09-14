import React, { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Info,
  KeyRound,
  Lock,
  MessageSquare,
  Palette,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Store,
  User,
} from "lucide-react";

import { UserRole, AppTheme } from "../../types";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { Separator } from "../ui/separator";
import { themeOptions } from "../../lib/themes";

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

type ResetStep = "request" | "verify" | "new-password" | "success";

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
  const [isLoading, setIsLoading] = useState(false);

  // Login state
  const [loginPhone, setLoginPhone] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState("");

  // Registration state
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regGhanaCard, setRegGhanaCard] = useState("");
  const [regRole, setRegRole] = useState<"customer" | "agent">("customer");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regReferralCode, setRegReferralCode] = useState("");
  const [showReferralInput, setShowReferralInput] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(true);
  const [regError, setRegError] = useState("");

  // OTP state
  const [otpDigits, setOtpDigits] = useState<string[]>([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const [otpTimer, setOtpTimer] = useState(59);
  const [otpPhone, setOtpPhone] = useState("");
  const [otpChannel, setOtpChannel] = useState<"sms" | "whatsapp">("sms");
  const [otpPendingUser, setOtpPendingUser] =
    useState<AuthSuccessPayload | null>(null);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Password recovery state
  const [resetStep, setResetStep] = useState<ResetStep>("request");
  const [resetIdentifier, setResetIdentifier] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [resetError, setResetError] = useState("");

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    if (mode !== "otp" || otpTimer <= 0) return;

    const interval = setInterval(() => {
      setOtpTimer((previous) => previous - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [mode, otpTimer]);

  const detectNetwork = (
    phone: string,
  ): { name: string; color: string; bg: string; dot: string } | null => {
    const clean = phone.replace(/[\s\-()]/g, "");

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
        name: "AT Ghana",
        color: "text-blue-700 dark:text-blue-300",
        bg: "bg-blue-500/15 border-blue-500/30",
        dot: "bg-blue-600",
      };
    }

    return null;
  };

  const currentDetectedNetwork = detectNetwork(
    mode === "login"
      ? loginPhone
      : mode === "reset-pin"
        ? resetIdentifier
        : regPhone,
  );

  const changeMode = (nextMode: AuthFlowMode) => {
    setMode(nextMode);
    setLoginError("");
    setRegError("");
    setResetError("");
  };

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

  const handleLoginSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginError("");

    const identifier = loginPhone.trim();

    if (!identifier) {
      setLoginError("Please enter your registered phone number or email.");
      return;
    }

    if (!loginPassword.trim()) {
      setLoginError("Please enter your password.");
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);

      if (
        loginPassword === "0000" ||
        identifier.toLowerCase().includes("admin") ||
        loginPassword === "7788"
      ) {
        onAuthSuccess({
          name: "NOC Superadmin",
          phone: identifier || "0200000001",
          role: "admin",
          email: "noc.admin@smartdatahub.gh",
          ghanaCard: "GHA-000000001-0",
        });
      } else if (
        loginPassword === "1122" ||
        identifier.toLowerCase().includes("agent")
      ) {
        onAuthSuccess({
          name: "Kofi Owusu (Reseller Agent)",
          phone: identifier || "0244192834",
          role: "agent",
          email: "kofitelecom@gmail.com",
          ghanaCard: "GHA-948102941-8",
        });
      } else {
        onAuthSuccess({
          name: identifier.startsWith("024")
            ? "Kojo Mensah"
            : "Customer Account",
          phone: identifier,
          role: "customer",
          email: `${identifier.replace(/\D/g, "") || "user"}@smartdatahub.gh`,
          ghanaCard: "GHA-721948192-3",
        });
      }
    }, 550);
  };

  const handleRegisterSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRegError("");

    if (!regName.trim()) {
      setRegError(
        "Please enter your full legal name as shown on your Ghana Card.",
      );
      return;
    }

    const cleanPhone = regPhone.replace(/[\s\-()]/g, "");

    if (!cleanPhone || cleanPhone.length < 10) {
      setRegError("Please enter a valid Ghana mobile number.");
      return;
    }

    if (regGhanaCard && !regGhanaCard.toUpperCase().startsWith("GHA-")) {
      setRegError("Ghana Card number must begin with GHA-.");
      return;
    }

    if (!regPassword || regPassword.length < 4) {
      setRegError("Please choose a password with at least 4 characters.");
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError("Your passwords do not match.");
      return;
    }

    if (!agreeToTerms) {
      setRegError(
        "Please agree to the Smart Data Hub Terms of Service and Privacy Policy.",
      );
      return;
    }

    const pendingUser: AuthSuccessPayload = {
      name: regName.trim(),
      phone: cleanPhone,
      role: regRole,
      ghanaCard: regGhanaCard.toUpperCase() || "GHA-721948192-3",
      email: regEmail.trim() || `${cleanPhone}@smartdatahub.gh`,
    };

    setOtpPendingUser(pendingUser);
    setOtpPhone(cleanPhone);
    setOtpTimer(59);
    setOtpDigits(["", "", "", "", "", ""]);
    setMode("otp");
  };

  const handleOtpDigitChange = (index: number, value: string) => {
    const digits = value.replace(/\D/g, "");

    if (!digits) {
      const updated = [...otpDigits];
      updated[index] = "";
      setOtpDigits(updated);
      return;
    }

    const updated = [...otpDigits];

    digits
      .slice(0, 6 - index)
      .split("")
      .forEach((digit, offset) => {
        updated[index + offset] = digit;
      });

    setOtpDigits(updated);

    const nextIndex = Math.min(index + digits.length, 5);
    otpInputRefs.current[nextIndex]?.focus();
  };

  const handleOtpKeyDown = (
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Backspace") {
      if (otpDigits[index]) {
        const updated = [...otpDigits];
        updated[index] = "";
        setOtpDigits(updated);
      } else if (index > 0) {
        otpInputRefs.current[index - 1]?.focus();

        const updated = [...otpDigits];
        updated[index - 1] = "";
        setOtpDigits(updated);
      }
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      otpInputRefs.current[index - 1]?.focus();
    }

    if (event.key === "ArrowRight" && index < 5) {
      event.preventDefault();
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();

    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);

    if (!pasted) return;

    const updated = ["", "", "", "", "", ""];

    pasted.split("").forEach((digit, index) => {
      updated[index] = digit;
    });

    setOtpDigits(updated);

    const focusIndex = Math.min(pasted.length, 5);
    otpInputRefs.current[focusIndex]?.focus();
  };

  const handleAutoFillOtp = () => {
    setOtpDigits(["4", "1", "9", "0", "8", "8"]);
    otpInputRefs.current[5]?.focus();
  };

  const handleOtpSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const fullCode = otpDigits.join("");

    if (fullCode.length !== 6) return;

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

  const handleResetRequest = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResetError("");

    const cleanIdentifier = resetIdentifier.trim();

    if (!cleanIdentifier) {
      setResetError(
        "Please enter your registered email address or phone number.",
      );
      return;
    }

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanIdentifier);
    const isPhone = /^[+\d\s\-()]{10,}$/.test(cleanIdentifier);

    if (!isEmail && !isPhone) {
      setResetError("Enter a valid email address or phone number.");
      return;
    }

    setResetStep("verify");
  };

  const handleResetVerify = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResetError("");

    if (resetOtp.length !== 4) {
      setResetError("Please enter the 4-digit recovery code.");
      return;
    }

    setResetStep("new-password");
  };

  const handleResetNewPassword = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResetError("");

    if (newPassword.length < 4) {
      setResetError("Your new password must contain at least 4 characters.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setResetError("Your passwords do not match.");
      return;
    }

    setResetStep("success");
  };

  const renderError = (message: string) => {
    if (!message) return null;

    return (
      <div className="flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs font-semibold text-destructive">
        <AlertCircle className="mt-0.5 size-4 shrink-0" />
        <span>{message}</span>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-card/85 px-4 py-3 backdrop-blur-md sm:px-8">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackToPublic}
              className="gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" />
              <span>Back to Storefront</span>
            </Button>

            <div className="hidden h-4 w-px bg-border sm:block" />

            <button
              type="button"
              onClick={onBackToPublic}
              className="flex items-center gap-2.5"
            >
              <div className="flex size-8 items-center justify-center rounded-xl bg-primary text-xs font-black text-primary-foreground">
                SDH
              </div>

              <div className="hidden items-center gap-1.5 sm:flex">
                <span className="text-sm font-extrabold tracking-tight">
                  Smart Data Hub
                </span>

                <Badge
                  variant="outline"
                  className="border-primary/30 px-1.5 py-0 text-[10px] font-bold text-primary"
                >
                  Ghana
                </Badge>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onOpenSecurityPins && (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenSecurityPins}
                className="h-8 gap-1.5 rounded-lg text-xs font-semibold"
              >
                <KeyRound className="size-3.5 text-primary" />
                <span className="hidden sm:inline">
                  Credentials Cheat Sheet
                </span>
                <span className="sm:hidden">Credentials</span>
              </Button>
            )}

            <div className="relative">
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => setShowThemeMenu((value) => !value)}
                title="Change Theme"
                className="size-8 rounded-lg"
              >
                <Palette className="size-3.5" />
              </Button>

              {showThemeMenu && (
                <div className="absolute right-0 z-50 mt-2 w-48 rounded-xl border border-border bg-card p-1.5 shadow-lg">
                  <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Select Theme
                  </div>

                  {themeOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => {
                        onSetTheme(option.id);
                        setShowThemeMenu(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-semibold transition-colors ${
                        theme === option.id
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-muted"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className={`size-2.5 rounded-full ${option.dot}`}
                        />
                        {option.name}
                      </span>

                      {theme === option.id && <Check className="size-3.5" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center bg-gradient-to-br from-primary/[0.03] via-background to-amber-500/[0.03] p-4 sm:p-6 lg:p-10">
        <div className="mx-auto w-full max-w-3xl">
          {redirectReason && (
            <div className="mb-4 flex items-start gap-2.5 rounded-2xl border border-amber-500/25 bg-amber-500/10 p-3.5 text-xs text-amber-900 dark:text-amber-300">
              <Info className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />

              <div>
                <div className="font-bold">Authentication Required</div>
                <div className="mt-0.5 text-[11px] opacity-90">
                  {redirectReason}
                </div>
              </div>
            </div>
          )}

          <Card className="overflow-hidden rounded-3xl border border-border bg-card shadow-xl">
            <CardHeader className="space-y-5 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <CardTitle className="text-xl font-black tracking-tight sm:text-2xl">
                    {mode === "login" && "Sign In to Your Account"}
                    {mode === "register" && "Create Your Hub Account"}
                    {mode === "otp" && "Verify Mobile Number"}
                    {mode === "reset-pin" && "Recover Your Password"}
                    {mode === "two-factor" && "Two-Factor Clearance"}
                    {mode === "kyc-verify" && "Card NIA Clearance"}
                  </CardTitle>

                  <CardDescription className="max-w-xl text-xs leading-relaxed">
                    {mode === "login" &&
                      "Enter your registered phone number or email to continue."}
                    {mode === "register" &&
                      "Create your account and start using Smart Data Hub."}
                    {mode === "otp" &&
                      `Enter the 6-digit verification code sent to ${
                        otpPhone || "your mobile number"
                      }.`}
                    {mode === "reset-pin" &&
                      "Recover access using your registered email address or phone number."}
                    {mode === "two-factor" &&
                      "Enter your two-factor authentication code."}
                    {mode === "kyc-verify" &&
                      "Complete your National Identification Authority verification."}
                  </CardDescription>
                </div>

                <div className="hidden size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary sm:flex">
                  <Lock className="size-5" />
                </div>
              </div>

              {(mode === "login" || mode === "register") && (
                <Tabs
                  value={mode}
                  onValueChange={(value) => changeMode(value as AuthFlowMode)}
                  className="w-full"
                >
                  <TabsList className="grid !h-10 w-full grid-cols-2 rounded-full border border-border/70 bg-muted/60 p-1.5">
                    <TabsTrigger
                      value="login"
                      className="rounded-full h-7 text-sm font-bold transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md"
                    >
                      <Lock className="size-4" />
                      Sign In
                    </TabsTrigger>

                    <TabsTrigger
                      value="register"
                      className="rounded-full h-7 text-sm font-bold transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md"
                    >
                      <User className="size-4" />
                      Register
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              )}
            </CardHeader>

            <CardContent className="space-y-5 px-5 pb-6 sm:px-7">
              {mode === "login" && (
                <form onSubmit={handleLoginSubmit} className="space-y-5">
                  {renderError(loginError)}

                  <div className="space-y-1.5">
                    <Label htmlFor="login-identifier">
                      Mobile Number or Email
                    </Label>

                    <Input
                      id="login-identifier"
                      type="text"
                      required
                      placeholder="Enter mobile number or email"
                      value={loginPhone}
                      onChange={(event) => setLoginPhone(event.target.value)}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-3">
                      <Label htmlFor="login-password">Password</Label>

                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        onClick={() => {
                          setResetStep("request");
                          setResetIdentifier("");
                          setResetOtp("");
                          setResetError("");
                          setMode("reset-pin");
                        }}
                        className="h-auto p-0 text-xs font-bold text-primary"
                      >
                        Forgot Password?
                      </Button>
                    </div>

                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showLoginPassword ? "text" : "password"}
                        required
                        placeholder="Enter password"
                        value={loginPassword}
                        onChange={(event) =>
                          setLoginPassword(event.target.value)
                        }
                        className="h-11 pr-11"
                      />

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => setShowLoginPassword((value) => !value)}
                        className="absolute right-3 top-2.5 text-muted-foreground"
                        aria-label={
                          showLoginPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showLoginPassword ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="remember-me"
                      checked={rememberMe}
                      onCheckedChange={(checked) =>
                        setRememberMe(checked === true)
                      }
                    />

                    <Label
                      htmlFor="remember-me"
                      className="cursor-pointer text-xs font-normal text-muted-foreground"
                    >
                      Keep me signed in on this device
                    </Label>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    size="lg"
                    className="h-11 w-full gap-2 rounded-xl font-bold"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="size-4 animate-spin" />
                        Verifying Account...
                      </>
                    ) : (
                      <>
                        Sign In to Hub
                        <ArrowRight className="size-4" />
                      </>
                    )}
                  </Button>

                  <div className="flex items-center gap-3">
                    <Separator className="flex-1" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Demo Access
                    </span>
                    <Separator className="flex-1" />
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <button
                      type="button"
                      onClick={() => handleQuickLogin("customer")}
                      className="rounded-xl border border-border p-3 text-left transition-colors hover:border-primary/50 hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-2 text-xs font-bold">
                        <User className="size-4 text-blue-500" />
                        Customer
                      </div>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        Password: 2026
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickLogin("agent")}
                      className="rounded-xl border border-border p-3 text-left transition-colors hover:border-primary/50 hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-2 text-xs font-bold">
                        <Store className="size-4 text-amber-500" />
                        Reseller
                      </div>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        Password: 1122
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickLogin("admin")}
                      className="rounded-xl border border-border p-3 text-left transition-colors hover:border-primary/50 hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-2 text-xs font-bold">
                        <Lock className="size-4 text-emerald-500" />
                        NOC Admin
                      </div>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        Password: 0000
                      </p>
                    </button>
                  </div>

                  {onOpenSecurityPins && (
                    <Button
                      type="button"
                      variant="link"
                      onClick={onOpenSecurityPins}
                      className="h-auto w-full p-0 text-xs font-semibold text-primary"
                    >
                      View Password Guide
                    </Button>
                  )}
                </form>
              )}

              {mode === "register" && (
                <form onSubmit={handleRegisterSubmit} className="space-y-5">
                  {renderError(regError)}

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setRegRole("customer")}
                      className={`rounded-2xl border p-3 text-left transition-all ${
                        regRole === "customer"
                          ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/20"
                          : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center gap-2 text-xs font-bold">
                        <User className="size-4" />
                        Customer Account
                      </div>

                      <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                        Personal data bundles, airtime, and vouchers.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRegRole("agent")}
                      className={`rounded-2xl border p-3 text-left transition-all ${
                        regRole === "agent"
                          ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/20"
                          : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center gap-2 text-xs font-bold">
                        <Store className="size-4" />
                        Reseller Agent
                      </div>

                      <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                        Wholesale margins, commissions, and web stores.
                      </p>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="reg-name">Full Name</Label>

                      <Input
                        id="reg-name"
                        type="text"
                        required
                        placeholder="Enter your full name"
                        value={regName}
                        onChange={(event) => setRegName(event.target.value)}
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="reg-phone">Mobile Number</Label>

                      <Input
                        id="reg-phone"
                        type="tel"
                        required
                        placeholder="024 000 0000"
                        value={regPhone}
                        onChange={(event) => setRegPhone(event.target.value)}
                        className="h-11"
                        maxLength={13}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="reg-email">
                        Email Address
                        <span className="ml-1 font-normal text-muted-foreground">
                          (Optional)
                        </span>
                      </Label>

                      <Input
                        id="reg-email"
                        type="email"
                        placeholder="you@example.com"
                        value={regEmail}
                        onChange={(event) => setRegEmail(event.target.value)}
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="reg-ghana-card">
                        Ghana Card Number
                        <span className="ml-1 font-normal text-muted-foreground">
                          (Optional)
                        </span>
                      </Label>

                      <Input
                        id="reg-ghana-card"
                        type="text"
                        placeholder="GHA-000000000-0"
                        value={regGhanaCard}
                        onChange={(event) =>
                          setRegGhanaCard(event.target.value.toUpperCase())
                        }
                        className="h-11 uppercase"
                        maxLength={15}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="reg-password">Password</Label>

                      <Input
                        id="reg-password"
                        type="password"
                        required
                        placeholder="Enter password"
                        value={regPassword}
                        onChange={(event) => setRegPassword(event.target.value)}
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="reg-confirm-password">
                        Confirm Password
                      </Label>

                      <Input
                        id="reg-confirm-password"
                        type="password"
                        required
                        placeholder="Confirm password"
                        value={regConfirmPassword}
                        onChange={(event) =>
                          setRegConfirmPassword(event.target.value)
                        }
                        className={`h-11 ${
                          regConfirmPassword &&
                          regPassword === regConfirmPassword
                            ? "border-emerald-500 ring-1 ring-emerald-500/30"
                            : ""
                        }`}
                      />
                    </div>
                  </div>

                  {!showReferralInput ? (
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      onClick={() => setShowReferralInput(true)}
                      className="h-auto p-0 text-xs font-semibold text-muted-foreground hover:text-primary"
                    >
                      + Have an Agent Referral or Promo Code?
                    </Button>
                  ) : (
                    <div className="space-y-1.5">
                      <Label htmlFor="reg-referral">
                        Referral / Agent Code
                      </Label>

                      <Input
                        id="reg-referral"
                        type="text"
                        placeholder="AGENT-KOFI-24"
                        value={regReferralCode}
                        onChange={(event) =>
                          setRegReferralCode(event.target.value.toUpperCase())
                        }
                        className="h-11 uppercase"
                      />
                    </div>
                  )}

                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="terms-check"
                      checked={agreeToTerms}
                      onCheckedChange={(checked) =>
                        setAgreeToTerms(checked === true)
                      }
                      className="mt-0.5"
                    />

                    <Label
                      htmlFor="terms-check"
                      className="cursor-pointer text-xs font-normal leading-relaxed text-muted-foreground"
                    >
                      I agree to the Smart Data Hub Terms of Service, Telecom
                      Fair Usage Guidelines, and settlement protocols.
                    </Label>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="h-11 w-full gap-2 rounded-xl font-bold"
                  >
                    Proceed to Phone Verification
                    <ArrowRight className="size-4" />
                  </Button>
                </form>
              )}

              {mode === "otp" && (
                <form
                  onSubmit={handleOtpSubmit}
                  className="space-y-5 text-center"
                >
                  <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Smartphone className="size-7" />
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-lg font-black">
                      Enter Verification Code
                    </h3>

                    <p className="text-xs leading-relaxed text-muted-foreground">
                      Enter the code sent via{" "}
                      {otpChannel === "sms" ? "SMS" : "WhatsApp"} to{" "}
                      <strong className="text-foreground">
                        {otpPhone || "your mobile number"}
                      </strong>
                    </p>
                  </div>

                  <div className="mx-auto flex w-full max-w-sm items-center justify-between rounded-2xl border border-primary/20 bg-primary/5 p-4">
                    <div className="text-left">
                      <p className="text-[11px] text-muted-foreground">
                        Demo verification code
                      </p>

                      <p className="mt-1 text-lg font-black tracking-[0.25em] text-primary">
                        419088
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAutoFillOtp}
                      className="rounded-xl border-primary/30 text-xs font-bold text-primary"
                    >
                      Auto-Fill
                    </Button>
                  </div>

                  <div className="flex justify-center gap-2 sm:gap-3">
                    {otpDigits.map((digit, index) => (
                      <Input
                        key={index}
                        ref={(element) => {
                          otpInputRefs.current[index] = element;
                        }}
                        id={`otp-${index}`}
                        type="text"
                        inputMode="numeric"
                        autoComplete={index === 0 ? "one-time-code" : "off"}
                        maxLength={1}
                        value={digit}
                        onChange={(event) =>
                          handleOtpDigitChange(index, event.target.value)
                        }
                        onKeyDown={(event) => handleOtpKeyDown(index, event)}
                        onPaste={handleOtpPaste}
                        onFocus={(event) => event.currentTarget.select()}
                        aria-label={`Verification code digit ${index + 1}`}
                        className={`size-11 rounded-xl border-2 p-0 text-center text-xl font-black sm:size-14 ${
                          digit
                            ? "border-primary/50 bg-primary/5 text-primary"
                            : "border-border bg-muted/30"
                        }`}
                      />
                    ))}
                  </div>

                  <div className="flex items-center justify-center gap-3 text-xs">
                    <button
                      type="button"
                      onClick={() => setOtpChannel("sms")}
                      className={`flex items-center gap-1.5 font-semibold ${
                        otpChannel === "sms"
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}
                    >
                      <Smartphone className="size-3.5" />
                      SMS
                    </button>

                    <span className="text-muted-foreground">·</span>

                    <button
                      type="button"
                      onClick={() => setOtpChannel("whatsapp")}
                      className={`flex items-center gap-1.5 font-semibold ${
                        otpChannel === "whatsapp"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-muted-foreground"
                      }`}
                    >
                      <MessageSquare className="size-3.5" />
                      WhatsApp
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setMode("register")}
                      className="h-auto p-0 text-xs text-muted-foreground"
                    >
                      Change Number
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={otpTimer > 0}
                      onClick={() => {
                        setOtpTimer(59);
                        setOtpDigits(["", "", "", "", "", ""]);
                        otpInputRefs.current[0]?.focus();
                      }}
                      className="h-auto p-0 text-xs font-bold text-primary"
                    >
                      {otpTimer > 0 ? `Resend in ${otpTimer}s` : "Resend Code"}
                    </Button>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading || otpDigits.join("").length !== 6}
                    size="lg"
                    className="h-11 w-full gap-2 rounded-xl font-bold"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="size-4 animate-spin" />
                        Validating Code...
                      </>
                    ) : (
                      <>
                        Verify & Continue
                        <ArrowRight className="size-4" />
                      </>
                    )}
                  </Button>
                </form>
              )}

              {mode === "reset-pin" && (
                <div className="space-y-5">
                  {renderError(resetError)}

                  <div className="flex items-center gap-2">
                    {["request", "verify", "new-password"].map(
                      (step, index) => {
                        const activeStep =
                          resetStep === "success"
                            ? 3
                            : ["request", "verify", "new-password"].indexOf(
                                resetStep,
                              );

                        return (
                          <React.Fragment key={step}>
                            <div
                              className={`flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                                index <= activeStep
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {index + 1}
                            </div>

                            {index < 2 && (
                              <div
                                className={`h-px flex-1 ${
                                  index < activeStep
                                    ? "bg-primary"
                                    : "bg-border"
                                }`}
                              />
                            )}
                          </React.Fragment>
                        );
                      },
                    )}
                  </div>

                  {resetStep === "request" && (
                    <form onSubmit={handleResetRequest} className="space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="reset-identifier">
                          Email Address or Phone Number
                        </Label>

                        <Input
                          id="reset-identifier"
                          type="text"
                          required
                          placeholder="Enter your email or phone number"
                          value={resetIdentifier}
                          onChange={(event) =>
                            setResetIdentifier(event.target.value)
                          }
                          className="h-11"
                        />

                        <p className="text-xs leading-relaxed text-muted-foreground">
                          We will send a recovery code to the contact linked to
                          your account.
                        </p>
                      </div>

                      <Button
                        type="submit"
                        size="lg"
                        className="h-11 w-full rounded-xl font-bold"
                      >
                        Send Recovery Code
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setMode("login")}
                        className="h-9 w-full text-xs font-semibold text-muted-foreground"
                      >
                        Return to Sign In
                      </Button>
                    </form>
                  )}

                  {resetStep === "verify" && (
                    <form onSubmit={handleResetVerify} className="space-y-4">
                      <div className="space-y-1">
                        <h3 className="text-sm font-bold">
                          Verify Recovery Code
                        </h3>

                        <p className="text-xs leading-relaxed text-muted-foreground">
                          Enter the recovery code sent to{" "}
                          <strong className="text-foreground">
                            {resetIdentifier}
                          </strong>
                          .
                        </p>
                      </div>

                      <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs">
                        <span className="text-muted-foreground">
                          Demo recovery code:
                        </span>{" "}
                        <span className="font-black text-primary">4190</span>
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          onClick={() => setResetOtp("4190")}
                          className="ml-2 h-auto p-0 text-xs font-bold text-primary"
                        >
                          Fill Code
                        </Button>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="reset-otp">Recovery Code</Label>

                        <Input
                          id="reset-otp"
                          type="text"
                          inputMode="numeric"
                          required
                          placeholder="Enter 4-digit code"
                          value={resetOtp}
                          onChange={(event) =>
                            setResetOtp(
                              event.target.value.replace(/\D/g, "").slice(0, 4),
                            )
                          }
                          className="h-12 text-center text-xl font-black tracking-[0.35em]"
                          maxLength={4}
                        />
                      </div>

                      <Button
                        type="submit"
                        size="lg"
                        className="h-11 w-full rounded-xl font-bold"
                      >
                        Verify Code
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setResetStep("request")}
                        className="h-9 w-full text-xs font-semibold text-muted-foreground"
                      >
                        Change Email or Phone
                      </Button>
                    </form>
                  )}

                  {resetStep === "new-password" && (
                    <form
                      onSubmit={handleResetNewPassword}
                      className="space-y-4"
                    >
                      <div className="space-y-1">
                        <h3 className="text-sm font-bold">
                          Create a New Password
                        </h3>

                        <p className="text-xs leading-relaxed text-muted-foreground">
                          Choose a new password for your Smart Data Hub account.
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="new-password">New Password</Label>

                        <div className="relative">
                          <Input
                            id="new-password"
                            type={showNewPassword ? "text" : "password"}
                            required
                            placeholder="Enter new password"
                            value={newPassword}
                            onChange={(event) =>
                              setNewPassword(event.target.value)
                            }
                            className="h-11 pr-11"
                          />

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            onClick={() =>
                              setShowNewPassword((value) => !value)
                            }
                            className="absolute right-3 top-2.5 text-muted-foreground"
                          >
                            {showNewPassword ? (
                              <EyeOff className="size-4" />
                            ) : (
                              <Eye className="size-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="confirm-new-password">
                          Confirm New Password
                        </Label>

                        <div className="relative">
                          <Input
                            id="confirm-new-password"
                            type={showConfirmNewPassword ? "text" : "password"}
                            required
                            placeholder="Confirm new password"
                            value={confirmNewPassword}
                            onChange={(event) =>
                              setConfirmNewPassword(event.target.value)
                            }
                            className={`h-11 pr-11 ${
                              confirmNewPassword &&
                              newPassword === confirmNewPassword
                                ? "border-emerald-500 ring-1 ring-emerald-500/30"
                                : ""
                            }`}
                          />

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            onClick={() =>
                              setShowConfirmNewPassword((value) => !value)
                            }
                            className="absolute right-3 top-2.5 text-muted-foreground"
                          >
                            {showConfirmNewPassword ? (
                              <EyeOff className="size-4" />
                            ) : (
                              <Eye className="size-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        size="lg"
                        className="h-11 w-full rounded-xl font-bold"
                      >
                        Update Password
                      </Button>
                    </form>
                  )}

                  {resetStep === "success" && (
                    <div className="space-y-4 py-4 text-center">
                      <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="size-8" />
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-lg font-black">
                          Password Successfully Reset
                        </h4>

                        <p className="text-xs leading-relaxed text-muted-foreground">
                          Your password has been updated successfully. You can
                          now sign in with your new password.
                        </p>
                      </div>

                      <Button
                        type="button"
                        onClick={() => {
                          setLoginPhone(resetIdentifier);
                          setLoginPassword(newPassword);
                          setMode("login");
                        }}
                        size="lg"
                        className="h-11 w-full rounded-xl font-bold"
                      >
                        Sign In with New Password
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>

            <CardFooter className="flex flex-col items-center justify-between gap-2 border-t border-border/80 bg-muted/20 px-5 py-3 text-xs text-muted-foreground sm:flex-row sm:px-7">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Ghana Data Protection Act 2012 Compliant</span>
              </div>

              <span className="text-[11px] font-medium">
                256-Bit SSL Encrypted
              </span>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AuthPage;

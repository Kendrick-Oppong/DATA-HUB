"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  Info,
  KeyRound,
  Lock,
  Palette,
  ShieldCheck,
  User,
} from "lucide-react";

import type { AppTheme, UserRole } from "../../types";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { themeOptions } from "../../lib/themes";

import { SignInView } from "./SignInView";
import { SignUpView } from "./SignUpView";
import { OtpView } from "./OtpView";
import { ForgotPasswordView } from "./ForgotPasswordView";
import { NewPasswordView } from "./NewPasswordView";

export interface AuthSuccessPayload {
  name: string;
  phone: string;
  role: UserRole;
  ghanaCard?: string;
  email?: string;
}

export type AuthFlowMode =
  | "sign-in"
  | "sign-up"
  | "otp"
  | "forgot-password"
  | "new-password"
  | "two-factor"
  | "kyc-verify";

type DemoRole = "customer" | "agent" | "admin";
type OtpChannel = "sms" | "whatsapp";
type OtpPurpose = "registration" | "forgot-password";

interface AuthPageProps {
  mode: AuthFlowMode;
  redirectReason?: string | null;
  onAuthSuccess: (user: AuthSuccessPayload) => void;
  onBackToPublic: () => void;
  onNavigateToAuth: (mode: AuthFlowMode) => void;
  onNavigateToLegal?: (page: "terms" | "privacy") => void;
  theme: AppTheme;
  onSetTheme: (theme: AppTheme) => void;
  onOpenSecurityPins?: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  mode,
  redirectReason,
  onAuthSuccess,
  onBackToPublic,
  onNavigateToAuth,
  onNavigateToLegal,
  theme,
  onSetTheme,
  onOpenSecurityPins,
}) => {
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [identifier, setIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+233");
  const [email, setEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [role, setRole] = useState<"customer" | "agent">("customer");
  const [registerPassword, setRegisterPassword] = useState("");
  const [confirmRegisterPassword, setConfirmRegisterPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const [otp, setOtp] = useState("");
  const [otpPhone, setOtpPhone] = useState("");
  const [otpChannel, setOtpChannel] = useState<OtpChannel>("sms");
  const [otpPurpose, setOtpPurpose] = useState<OtpPurpose>("registration");

  const [forgotPasswordIdentifier, setForgotPasswordIdentifier] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  function clearError() {
    setError(null);
  }

  function resetOtpState() {
    setOtp("");
    setOtpPhone("");
    setOtpChannel("sms");
    setOtpPurpose("registration");
  }

  function resetForgotPasswordState() {
    setForgotPasswordIdentifier("");
    setNewPassword("");
    setConfirmNewPassword("");
  }

  function goToLogin() {
    onNavigateToAuth("sign-in");
    resetOtpState();
    resetForgotPasswordState();
  }

  function goToRegister() {
    onNavigateToAuth("sign-up");
    resetOtpState();
  }

  function goToForgotPassword() {
    onNavigateToAuth("forgot-password");
    resetForgotPasswordState();
    resetOtpState();
  }

  function handleQuickLogin(role: DemoRole) {
    setIsLoading(true);
    clearError();

    window.setTimeout(() => {
      setIsLoading(false);

      if (role === "admin") {
        onAuthSuccess({
          name: "NOC Superadmin",
          phone: "0200000001",
          role: "admin",
          email: "noc.admin@smartdatahub.gh",
          ghanaCard: "GHA-000000001-0",
        });
        return;
      }

      if (role === "agent") {
        onAuthSuccess({
          name: "Kofi Owusu (Reseller Agent)",
          phone: "0244192834",
          role: "agent",
          email: "kofitelecom@gmail.com",
          ghanaCard: "GHA-948102941-8",
        });
        return;
      }

      onAuthSuccess({
        name: "Kojo Mensah (Customer)",
        phone: "0244192834",
        role: "customer",
        email: "kojomensah94@gmail.com",
        ghanaCard: "GHA-721948192-3",
      });
    }, 450);
  }

  function handleLoginSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearError();

    const trimmedIdentifier = identifier.trim();
    const trimmedPassword = loginPassword.trim();

    if (!trimmedIdentifier) {
      setError("Please enter your registered phone number or email.");
      return;
    }

    if (!trimmedPassword) {
      setError("Please enter your password.");
      return;
    }

    setIsLoading(true);

    window.setTimeout(() => {
      setIsLoading(false);

      if (
        trimmedPassword === "0000" ||
        trimmedPassword === "7788" ||
        trimmedIdentifier.toLowerCase().includes("admin")
      ) {
        onAuthSuccess({
          name: "NOC Superadmin",
          phone: trimmedIdentifier,
          role: "admin",
          email: "noc.admin@smartdatahub.gh",
          ghanaCard: "GHA-000000001-0",
        });
        return;
      }

      if (
        trimmedPassword === "1122" ||
        trimmedIdentifier.toLowerCase().includes("agent")
      ) {
        onAuthSuccess({
          name: "Kofi Owusu (Reseller Agent)",
          phone: trimmedIdentifier,
          role: "agent",
          email: "kofitelecom@gmail.com",
          ghanaCard: "GHA-948102941-8",
        });
        return;
      }

      onAuthSuccess({
        name: trimmedIdentifier.startsWith("024")
          ? "Kojo Mensah"
          : "Customer Account",
        phone: trimmedIdentifier,
        role: "customer",
        email: `${
          trimmedIdentifier.replace(/\D/g, "") || "user"
        }@smartdatahub.gh`,
        ghanaCard: "GHA-721948192-3",
      });
    }, 550);
  }

  function handleRegisterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearError();

    if (
      !name.trim() ||
      !phone.trim() ||
      !registerPassword.trim() ||
      !confirmRegisterPassword.trim()
    ) {
      setError("Please complete all required fields.");
      return;
    }

    if (registerPassword.length < 4) {
      setError("Please choose a password with at least 4 characters.");
      return;
    }

    if (registerPassword !== confirmRegisterPassword) {
      setError("Your passwords do not match.");
      return;
    }

    setIsLoading(true);

    window.setTimeout(() => {
      setOtpPurpose("registration");
      setOtpPhone(phone.trim());
      setOtp("");
      onNavigateToAuth("otp");
      setIsLoading(false);
    }, 700);
  }

  function handleRegistrationOtpSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearError();

    if (otp.length !== 6) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    setIsLoading(true);

    window.setTimeout(() => {
      setIsLoading(false);

      onAuthSuccess({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        role: role,
      });
    }, 600);
  }

  function handleForgotPasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearError();

    const trimmedIdentifier = forgotPasswordIdentifier.trim();

    if (!trimmedIdentifier) {
      setError("Please enter your email or phone number.");
      return;
    }

    setIsLoading(true);

    window.setTimeout(() => {
      setOtpPurpose("forgot-password");
      setOtpPhone(trimmedIdentifier);
      setOtp("");
      onNavigateToAuth("otp");
      setIsLoading(false);
    }, 700);
  }

  function handleForgotPasswordOtpSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearError();

    if (otp.length !== 6) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    setIsLoading(true);

    window.setTimeout(() => {
      onNavigateToAuth("new-password");
      setIsLoading(false);
    }, 700);
  }

  function handleResendOtp() {
    clearError();
    setOtp("");
  }

  function handleNewPasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearError();

    if (!newPassword.trim() || !confirmNewPassword.trim()) {
      setError("Please enter and confirm your new password.");
      return;
    }

    if (newPassword.length < 4) {
      setError("Your new password must contain at least 4 characters.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError("Your passwords do not match.");
      return;
    }

    setIsLoading(true);

    window.setTimeout(() => {
      setIdentifier(forgotPasswordIdentifier);
      setLoginPassword(newPassword);
      setIsLoading(false);
      goToLogin();
    }, 700);
  }

  function renderAuthView() {
    switch (mode) {
      case "sign-in":
        return (
          <SignInView
            identifier={identifier}
            password={loginPassword}
            error={error}
            isLoading={isLoading}
            onIdentifierChange={setIdentifier}
            onPasswordChange={setLoginPassword}
            onSubmit={handleLoginSubmit}
            onForgotPassword={goToForgotPassword}
            onRegister={goToRegister}
          />
        );

      case "sign-up":
        return (
          <SignUpView
            name={name}
            phone={phone}
            countryCode={countryCode}
            email={email}
            businessName={businessName}
            role={role}
            password={registerPassword}
            confirmPassword={confirmRegisterPassword}
            showPassword={showPassword}
            showConfirmPassword={showConfirmPassword}
            referralCode={referralCode}
            agreeToTerms={agreeToTerms}
            error={error || ""}
            onNameChange={setName}
            onPhoneChange={setPhone}
            onCountryCodeChange={setCountryCode}
            onEmailChange={setEmail}
            onBusinessNameChange={setBusinessName}
            onRoleChange={setRole}
            onPasswordChange={setRegisterPassword}
            onConfirmPasswordChange={setConfirmRegisterPassword}
            onTogglePassword={() => setShowPassword(!showPassword)}
            onToggleConfirmPassword={() =>
              setShowConfirmPassword(!showConfirmPassword)
            }
            onReferralCodeChange={setReferralCode}
            onAgreeToTermsChange={setAgreeToTerms}
            onNavigateToLegal={onNavigateToLegal}
            onSubmit={handleRegisterSubmit}
          />
        );

      case "forgot-password":
        return (
          <ForgotPasswordView
            identifier={forgotPasswordIdentifier}
            error={error}
            isLoading={isLoading}
            onIdentifierChange={setForgotPasswordIdentifier}
            onSubmit={handleForgotPasswordSubmit}
            onBackToLogin={goToLogin}
          />
        );

      case "otp":
        return (
          <OtpView
            otp={otp}
            otpChannel={otpChannel}
            otpPhone={otpPhone}
            otpPurpose={otpPurpose}
            error={error}
            isLoading={isLoading}
            onOtpChange={setOtp}
            onOtpChannelChange={setOtpChannel}
            onSubmit={
              otpPurpose === "forgot-password"
                ? handleForgotPasswordOtpSubmit
                : handleRegistrationOtpSubmit
            }
            onResend={handleResendOtp}
            onBack={
              otpPurpose === "forgot-password"
                ? goToForgotPassword
                : goToRegister
            }
          />
        );

      case "new-password":
        return (
          <NewPasswordView
            password={newPassword}
            confirmPassword={confirmNewPassword}
            error={error}
            isLoading={isLoading}
            onPasswordChange={setNewPassword}
            onConfirmPasswordChange={setConfirmNewPassword}
            onSubmit={handleNewPasswordSubmit}
          />
        );

      case "two-factor":
      case "kyc-verify":
        return (
          <div className="rounded-lg border p-4 text-sm text-muted-foreground">
            This authentication flow is not available yet.
          </div>
        );

      default:
        return null;
    }
  }

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
                    {mode === "sign-in" && "Sign In to Your Account"}
                    {mode === "sign-up" && "Create Your Hub Account"}
                    {mode === "otp" && "Verify Mobile Number"}
                    {mode === "forgot-password" && "Recover Your Password"}
                    {mode === "new-password" && "Create a New Password"}
                    {mode === "two-factor" && "Two-Factor Clearance"}
                    {mode === "kyc-verify" && "Card NIA Clearance"}
                  </CardTitle>

                  <CardDescription className="max-w-xl text-xs leading-relaxed">
                    {mode === "sign-in" &&
                      "Enter your registered phone number or email to continue."}

                    {mode === "sign-up" &&
                      "Create your account and start using Smart Data Hub."}

                    {mode === "otp" &&
                      `Enter the 6-digit verification code sent to ${
                        otpPhone || "your mobile number"
                      }.`}

                    {mode === "forgot-password" &&
                      "Recover access using your registered email address or phone number."}

                    {mode === "new-password" &&
                      "Choose a new password for your account."}

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

              {(mode === "sign-in" || mode === "sign-up") && (
                <Tabs
                  value={mode}
                  onValueChange={(value) =>
                    onNavigateToAuth(value as AuthFlowMode)
                  }
                  className="w-full"
                >
                  <TabsList className="grid !h-10 w-full grid-cols-2 rounded-full border border-border/70 bg-muted/60 p-1.5">
                    <TabsTrigger
                      value="sign-in"
                      className="h-7 rounded-full text-sm font-bold transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md"
                    >
                      <Lock className="size-4" />
                      Sign In
                    </TabsTrigger>

                    <TabsTrigger
                      value="sign-up"
                      className="h-7 rounded-full text-sm font-bold transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md"
                    >
                      <User className="size-4" />
                      Register
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              )}
            </CardHeader>

            <CardContent className="space-y-5 px-5 pb-6 sm:px-7">
              {renderAuthView()}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AuthPage;

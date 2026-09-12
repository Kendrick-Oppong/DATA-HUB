import React, { useState, useEffect } from "react";
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
  X,
  Eye,
  EyeOff,
  Sparkles,
  Check,
  Building2,
  HelpCircle,
} from "lucide-react";
import { UserRole, UserAccount } from "../../types";
import { detectGhanaNetwork } from "../../mockData";

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
  const [fullName, setFullName] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupRole, setSignupRole] = useState<"customer" | "agent">(
    "customer",
  );
  const [signupPin, setSignupPin] = useState("2026");
  const [referralCode, setReferralCode] = useState("");

  // OTP State
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(59);
  const [otpTargetPhone, setOtpTargetPhone] = useState("0244192834");
  const [otpSuccessMessage, setOtpSuccessMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Sync mode when prop changes
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setErrorMessage("");
      setOtpSuccessMessage(false);
    }
  }, [isOpen, initialMode]);

  // Countdown timer for OTP
  useEffect(() => {
    let interval: any = null;
    if (mode === "otp-verify" && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [mode, timer]);

  if (!isOpen) return null;

  const detectedNetwork = detectGhanaNetwork(signupPhone || phoneOrEmail);

  const handleQuickDemoLogin = (accountKey: "customer" | "agent" | "admin") => {
    const user = DEMO_ACCOUNTS[accountKey];
    onLoginSuccess(user);
    onClose();
  };

  const handleSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!phoneOrEmail.trim() || !password.trim()) {
      setErrorMessage("Please provide your phone number / email and password.");
      return;
    }

    // Check if matching any demo account or login as customer
    let foundUser = Object.values(DEMO_ACCOUNTS).find(
      (u) =>
        u.phone === phoneOrEmail.trim() ||
        u.email.toLowerCase() === phoneOrEmail.trim().toLowerCase(),
    );

    if (!foundUser) {
      // Dynamic fallback user creation
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
  };

  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!fullName || !signupPhone || !password) {
      setErrorMessage("Please fill in all mandatory fields.");
      return;
    }

    // Transition to Ghana SMS OTP Verification screen
    setOtpTargetPhone(signupPhone);
    setTimer(59);
    setMode("otp-verify");
  };

  const handleOtpInput = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const newOtp = [...otpCode];
    newOtp[index] = val.slice(-1);
    setOtpCode(newOtp);

    // Auto-focus next input
    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-box-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleFillDemoOtp = () => {
    setOtpCode(["1", "2", "3", "4", "5", "6"]);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otpCode.join("");

    if (fullOtp.length !== 6) {
      setErrorMessage("Please enter the full 6-digit SMS verification code.");
      return;
    }

    // Default demo OTP is 123456 (or any 6 digits for smooth review)
    setOtpSuccessMessage(true);
    setTimeout(() => {
      const newUser: UserAccount = {
        id: `usr-${Date.now()}`,
        name: fullName || "Kojo Mensah",
        phone: signupPhone || otpTargetPhone,
        email: signupEmail || `${signupPhone}@smartdatahub.gh`,
        role: signupRole,
        isKycVerified: true,
        ghanaCardNumber: "GHA-721948192-3",
        securityPin: signupPin || "2026",
      };
      onLoginSuccess(newUser);
      onClose();
    }, 1000);
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneOrEmail) {
      setErrorMessage("Enter your registered Ghana mobile number.");
      return;
    }
    setOtpTargetPhone(phoneOrEmail);
    setTimer(59);
    setMode("otp-verify");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/55 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md overflow-hidden rounded-[1.75rem] border border-primary/20 bg-card shadow-2xl shadow-primary/15 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="border-b border-border bg-muted/25 px-6 pb-4 pt-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-foreground">
                {mode === "sign-in" && "Sign in to Smart Data Hub"}
                {mode === "sign-up" && "Create Your SDH Account"}
                {mode === "otp-verify" && "Ghana SMS OTP Verification"}
                {mode === "forgot-password" && "Reset Security Credentials"}
              </h2>
              <span className="text-[11px] text-muted-foreground block">
                {mode === "sign-in" &&
                  "Access customer wallet, agent store, or NOC console"}
                {mode === "sign-up" &&
                  "Wholesale tariffs, personal data wallet & instant top-ups"}
                {mode === "otp-verify" &&
                  `Verification code sent to +233 ${otpTargetPhone.replace(/\D/g, "")}`}
                {mode === "forgot-password" &&
                  "Recover access to your wallet and account"}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Quick Demo Access Bar */}
          {(mode === "sign-in" || mode === "sign-up") && (
            <div className="p-3.5 rounded-2xl bg-muted/40 border border-border space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span>One-Click Demo Roles</span>
                </span>
                {onOpenSecurityPins && (
                  <button
                    onClick={onOpenSecurityPins}
                    className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <KeyRound className="w-3 h-3" />
                    <span>View All PINs</span>
                  </button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin("customer")}
                  className="px-2.5 py-1.5 rounded-xl border border-border bg-card hover:border-primary/50 text-[11px] font-bold text-foreground text-center transition-all cursor-pointer"
                >
                  👤 Customer
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin("agent")}
                  className="px-2.5 py-1.5 rounded-xl border border-border bg-card hover:border-primary/50 text-[11px] font-bold text-amber-700 dark:text-amber-400 text-center transition-all cursor-pointer"
                >
                  💼 Reseller Agent
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin("admin")}
                  className="px-2.5 py-1.5 rounded-xl border border-border bg-card hover:border-primary/50 text-[11px] font-bold text-primary text-center transition-all cursor-pointer"
                >
                  🛡️ NOC Admin
                </button>
              </div>
            </div>
          )}

          {/* MODE: SIGN IN */}
          {mode === "sign-in" && (
            <form onSubmit={handleSignInSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-muted-foreground mb-1">
                  Ghana Phone Number or Email
                </label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. 0244192834 or you@domain.gh"
                    value={phoneOrEmail}
                    onChange={(e) => setPhoneOrEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-input bg-background text-foreground text-xs focus:outline-hidden focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-semibold text-muted-foreground">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setMode("forgot-password")}
                    className="text-[11px] text-primary hover:underline font-medium cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-input bg-background text-foreground text-xs focus:outline-hidden focus:border-primary font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <span>Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="text-center pt-2 border-t border-border">
                <span className="text-muted-foreground">
                  Don't have an account?{" "}
                </span>
                <button
                  type="button"
                  onClick={() => setMode("sign-up")}
                  className="font-bold text-primary hover:underline cursor-pointer"
                >
                  Create free account
                </button>
              </div>
            </form>
          )}

          {/* MODE: SIGN UP */}
          {mode === "sign-up" && (
            <form onSubmit={handleSignUpSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-muted-foreground mb-1">
                  Full Legal Name (as on Ghana Card)
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Yaw Boateng"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-input bg-background text-foreground text-xs focus:outline-hidden focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-semibold text-muted-foreground">
                    Ghana Mobile Number
                  </label>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-muted text-foreground">
                    {detectedNetwork}
                  </span>
                </div>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                  <input
                    type="tel"
                    required
                    placeholder="024 XXX XXXX"
                    value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-input bg-background text-foreground text-xs font-mono tabular-nums focus:outline-hidden focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    placeholder="you@email.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-input bg-background text-foreground text-xs focus:outline-hidden focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground mb-1">
                  Account Category
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSignupRole("customer")}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      signupRole === "customer"
                        ? "border-primary bg-primary/10 text-primary font-bold shadow-2xs"
                        : "border-border bg-card text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <div className="font-bold text-xs text-foreground">
                      Personal Customer
                    </div>
                    <div className="text-[10px] opacity-80">
                      Buy for self & family
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSignupRole("agent")}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      signupRole === "agent"
                        ? "border-primary bg-primary/10 text-primary font-bold shadow-2xs"
                        : "border-border bg-card text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <div className="font-bold text-xs text-foreground">
                      Reseller Agent
                    </div>
                    <div className="text-[10px] opacity-80">
                      Wholesale margins & store
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Minimum 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-input bg-background text-foreground text-xs focus:outline-hidden focus:border-primary font-mono"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <span>Continue to SMS Verification</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="text-center pt-2 border-t border-border">
                <span className="text-muted-foreground">
                  Already registered?{" "}
                </span>
                <button
                  type="button"
                  onClick={() => setMode("sign-in")}
                  className="font-bold text-primary hover:underline cursor-pointer"
                >
                  Sign in here
                </button>
              </div>
            </form>
          )}

          {/* MODE: GHANA SMS OTP VERIFICATION */}
          {mode === "otp-verify" && (
            <form onSubmit={handleVerifyOtp} className="space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/20 text-primary space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <Smartphone className="w-4 h-4" />
                  <span>SMS Gateway Dispatch Active</span>
                </div>
                <p className="text-[11px] opacity-90 leading-relaxed">
                  We dispatched a 6-digit one-time PIN via MTN/Telecel SMS
                  Aggregator to{" "}
                  <strong className="font-mono text-foreground">
                    {otpTargetPhone}
                  </strong>
                  .
                </p>
              </div>

              {otpSuccessMessage ? (
                <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-center space-y-1">
                  <CheckCircle2 className="w-6 h-6 mx-auto" />
                  <div className="font-bold text-sm">
                    Phone Number Verified!
                  </div>
                  <p className="text-[11px]">
                    Redirecting to your dashboard...
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-1 text-center">
                    <label className="block font-bold text-muted-foreground">
                      Enter 6-Digit SMS Code
                    </label>
                    <div className="flex justify-center gap-2 pt-1">
                      {otpCode.map((digit, idx) => (
                        <input
                          key={idx}
                          id={`otp-box-${idx}`}
                          type="text"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpInput(idx, e.target.value)}
                          className="w-10 h-12 text-center text-lg font-black font-mono rounded-xl border border-input bg-card text-foreground focus:outline-hidden focus:border-primary"
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-muted-foreground">
                      Resend code in:{" "}
                      <strong className="tabular-nums font-mono">
                        {timer}s
                      </strong>
                    </span>
                    <button
                      type="button"
                      onClick={handleFillDemoOtp}
                      className="font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Autofill Demo (123456)</span>
                    </button>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <span>Verify Code & Login</span>
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}

              <div className="text-center pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setMode("sign-in")}
                  className="text-xs text-muted-foreground hover:text-foreground font-medium cursor-pointer"
                >
                  ← Back to Sign In
                </button>
              </div>
            </form>
          )}

          {/* MODE: FORGOT PASSWORD */}
          {mode === "forgot-password" && (
            <form
              onSubmit={handleForgotPasswordSubmit}
              className="space-y-3.5 text-xs"
            >
              <p className="text-muted-foreground">
                Enter the Ghana mobile number or email associated with your
                Smart Data Hub account. We will send an SMS OTP to reset your
                password and security PIN.
              </p>
              <div>
                <label className="block font-semibold text-muted-foreground mb-1">
                  Registered Mobile Number
                </label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. 0244192834"
                    value={phoneOrEmail}
                    onChange={(e) => setPhoneOrEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-input bg-background text-foreground text-xs focus:outline-hidden focus:border-primary"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Send Reset SMS OTP</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="text-center pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setMode("sign-in")}
                  className="text-xs font-bold text-primary hover:underline cursor-pointer"
                >
                  Return to Sign In
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

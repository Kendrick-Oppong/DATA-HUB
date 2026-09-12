import React, { useState, useEffect } from 'react';
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
  Info
} from 'lucide-react';
import { UserRole, AppTheme } from '../../types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { SignalRail } from '../common/SignalRail';

export interface AuthSuccessPayload {
  name: string;
  phone: string;
  role: UserRole;
  ghanaCard?: string;
  email?: string;
}

interface AuthPageProps {
  initialMode?: 'login' | 'register' | 'otp' | 'reset-pin';
  redirectReason?: string | null;
  onAuthSuccess: (user: AuthSuccessPayload) => void;
  onBackToPublic: () => void;
  theme: AppTheme;
  onSetTheme: (theme: AppTheme) => void;
  onOpenSecurityPins?: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  initialMode = 'login',
  redirectReason,
  onAuthSuccess,
  onBackToPublic,
  theme,
  onSetTheme,
  onOpenSecurityPins,
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'otp' | 'reset-pin'>(initialMode);
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  // Sign In state
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [showLoginPin, setShowLoginPin] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Register state
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regGhanaCard, setRegGhanaCard] = useState('');
  const [regRole, setRegRole] = useState<'customer' | 'agent'>('customer');
  const [regPin, setRegPin] = useState('');
  const [regError, setRegError] = useState('');

  // OTP state
  const [otpCode, setOtpCode] = useState('');
  const [otpTimer, setOtpTimer] = useState(59);
  const [otpPhone, setOtpPhone] = useState('');
  const [otpPendingUser, setOtpPendingUser] = useState<AuthSuccessPayload | null>(null);

  // Reset PIN state
  const [resetPhone, setResetPhone] = useState('');
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (mode === 'otp' && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [mode, otpTimer]);

  // Network detector helper
  const detectNetwork = (phone: string): { name: string; color: string } | null => {
    const clean = phone.replace(/\s+/g, '');
    if (clean.startsWith('024') || clean.startsWith('054') || clean.startsWith('055') || clean.startsWith('059') || clean.startsWith('053')) {
      return { name: 'MTN Ghana', color: 'bg-amber-400 text-amber-950 border-amber-500' };
    }
    if (clean.startsWith('020') || clean.startsWith('050')) {
      return { name: 'Telecel Ghana', color: 'bg-red-600 text-white border-red-700' };
    }
    if (clean.startsWith('027') || clean.startsWith('057') || clean.startsWith('026')) {
      return { name: 'AT (AirtelTigo)', color: 'bg-blue-600 text-white border-blue-700' };
    }
    return null;
  };

  const detectedNetwork = detectNetwork(mode === 'login' ? loginPhone : regPhone);

  // Quick Demo Logins
  const handleQuickLogin = (role: UserRole) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      if (role === 'admin') {
        onAuthSuccess({
          name: 'NOC Operations Officer',
          phone: '0559008001',
          role: 'admin',
          email: 'admin@smartdatahub.gh',
          ghanaCard: 'GHA-789012345-6'
        });
      } else if (role === 'agent') {
        onAuthSuccess({
          name: 'Kofi Mensah (Wholesale Agent)',
          phone: '0205006001',
          role: 'agent',
          email: 'kofi@smartdatahub.gh',
          ghanaCard: 'GHA-456789012-3'
        });
      } else {
        onAuthSuccess({
          name: 'Akua Osei (Customer)',
          phone: '0241002001',
          role: 'customer',
          email: 'akua@smartdatahub.gh',
          ghanaCard: 'GHA-123456789-0'
        });
      }
    }, 400);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginPhone.trim()) {
      setLoginError('Please enter your registered Ghana phone number or email.');
      return;
    }
    if (!loginPin.trim()) {
      setLoginError('Please enter your 4-digit security PIN or password.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      // Check for admin
      if (loginPin === '0000' || loginPhone.includes('admin') || loginPin === '7788') {
        onAuthSuccess({
          name: 'NOC Operations Admin',
          phone: loginPhone || '0559008001',
          role: 'admin',
          email: 'admin@smartdatahub.gh',
          ghanaCard: 'GHA-789012345-6'
        });
      } else if (loginPin === '1122' || loginPhone.includes('agent')) {
        onAuthSuccess({
          name: 'Kofi Mensah (Reseller Agent)',
          phone: loginPhone || '0205006001',
          role: 'agent',
          email: 'agent@smartdatahub.gh',
          ghanaCard: 'GHA-456789012-3'
        });
      } else {
        // Standard Customer
        onAuthSuccess({
          name: loginPhone.startsWith('024') ? 'Akua Osei' : 'Customer Account',
          phone: loginPhone,
          role: 'customer',
          email: 'customer@smartdatahub.gh',
          ghanaCard: 'GHA-123456789-0'
        });
      }
    }, 500);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!regName.trim()) {
      setRegError('Please enter your full legal name.');
      return;
    }
    if (!regPhone.trim() || regPhone.length < 10) {
      setRegError('Please enter a valid 10-digit Ghana mobile number.');
      return;
    }
    if (regGhanaCard && !regGhanaCard.toUpperCase().startsWith('GHA-')) {
      setRegError('Ghana Card must begin with GHA- (e.g. GHA-123456789-0).');
      return;
    }
    if (!regPin || regPin.length < 4) {
      setRegError('Please choose a 4-digit security PIN.');
      return;
    }

    const pending: AuthSuccessPayload = {
      name: regName,
      phone: regPhone,
      role: regRole,
      ghanaCard: regGhanaCard.toUpperCase() || 'GHA-998877665-4',
      email: regEmail || `${regPhone}@smartdatahub.gh`
    };

    setOtpPendingUser(pending);
    setOtpPhone(regPhone);
    setOtpTimer(59);
    setMode('otp');
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length < 4) {
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      if (otpPendingUser) {
        onAuthSuccess(otpPendingUser);
      } else {
        onAuthSuccess({
          name: 'Verified Customer',
          phone: otpPhone || '0241002001',
          role: 'customer',
          ghanaCard: 'GHA-123456789-0'
        });
      }
    }, 400);
  };

  const themes: { id: AppTheme; label: string; dot: string }[] = [
    { id: 'light', label: 'Modern Light', dot: 'bg-blue-600' },
    { id: 'dark', label: 'Dark Slate', dot: 'bg-slate-700' },
    { id: 'ghana-gold', label: 'Ghana Gold', dot: 'bg-amber-500' },
    { id: 'emerald-matrix', label: 'Emerald Matrix', dot: 'bg-emerald-500' },
    { id: 'royal-indigo', label: 'Royal Indigo', dot: 'bg-indigo-600' },
    { id: 'crimson-telecel', label: 'Crimson Telecel', dot: 'bg-red-600' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20">
      {/* Top Standalone Header for Auth View */}
      <header className="border-b border-border/80 bg-card/70 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBackToPublic}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Public Site</span>
          </Button>

          <div className="h-4 w-px bg-border hidden sm:block" />

          <div className="flex items-center gap-2 cursor-pointer" onClick={onBackToPublic}>
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-black text-sm shadow-xs">
              SDH
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight text-foreground flex items-center gap-1.5">
                Smart Data Hub
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">
                  Ghana
                </Badge>
              </span>
            </div>
          </div>
        </div>

        {/* Right tools */}
        <div className="flex items-center gap-2">
          {onOpenSecurityPins && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenSecurityPins}
              className="text-xs font-semibold gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5 text-primary" />
              <span className="hidden sm:inline">Credentials Cheat Sheet</span>
            </Button>
          )}

          {/* Theme Selector */}
          <div className="relative">
            <Button
              variant="outline"
              size="iconSm"
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              title="Change Theme"
            >
              <Palette className="w-3.5 h-3.5" />
            </Button>

            {showThemeMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl bg-card border border-border shadow-lg p-1.5 z-50 animate-in fade-in-50 zoom-in-95">
                <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Select Theme
                </div>
                {themes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      onSetTheme(t.id);
                      setShowThemeMenu(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      theme === t.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${t.dot}`} />
                      <span>{t.label}</span>
                    </div>
                    {theme === t.id && <Check className="w-3 h-3 text-primary" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Auth Viewport */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-12">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Compact trust panel */}
          <div className="hidden lg:flex lg:col-span-5 flex-col gap-6">
            <Badge variant="secondary" className="w-fit gap-1.5 px-3 py-1 font-bold text-xs uppercase tracking-wider"><Shield className="size-3.5 text-primary" />Secure telecom gateway</Badge>
            <div className="flex flex-col gap-4">
              <h1 className="text-3xl font-black leading-tight tracking-tight text-foreground xl:text-4xl">One secure hub for Ghana&apos;s everyday digital services.</h1>
              <p className="max-w-md text-sm leading-relaxed text-muted-foreground">Sign in once to manage bundles, airtime, vouchers, and reseller operations.</p>
            </div>
            <Card className="border-border bg-card/70 shadow-sm"><CardContent className="flex flex-col gap-4 p-5"><div className="flex items-center justify-between"><span className="text-xs font-bold text-foreground">Network status</span><SignalRail status="delivered" size="sm" label="All systems live" /></div><div className="grid grid-cols-3 gap-2 text-center"><div className="rounded-xl bg-muted/50 p-3"><p className="text-sm font-black">3</p><p className="text-[10px] text-muted-foreground">networks</p></div><div className="rounded-xl bg-muted/50 p-3"><p className="text-sm font-black">42s</p><p className="text-[10px] text-muted-foreground">delivery</p></div><div className="rounded-xl bg-muted/50 p-3"><p className="text-sm font-black">99.8%</p><p className="text-[10px] text-muted-foreground">uptime</p></div></div><div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground"><CheckCircle2 className="size-4 text-emerald-500" />Protected by PIN and verified account access</div></CardContent></Card>
          </div>

          {/* Right Form Card */}
          <div className="lg:col-span-7 w-full max-w-md mx-auto">
            {/* Redirect Reason Banner if protected route was intercepted */}
            {redirectReason && (
              <div className="mb-4 p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-300 animate-in fade-in-50">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Authentication Required</div>
                  <div className="text-amber-800/90 dark:text-amber-300/90">{redirectReason}</div>
                </div>
              </div>
            )}

            <Card className="border-border shadow-md">
              {/* Card Header */}
              <CardHeader className="space-y-2 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-extrabold text-foreground">
                    {mode === 'login' && 'Sign in to Smart Data Hub'}
                    {mode === 'register' && 'Create your Hub Account'}
                    {mode === 'otp' && 'Verify Ghana Mobile Number'}
                    {mode === 'reset-pin' && 'Reset Security PIN'}
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px] font-mono uppercase">
                    v2.6 Secure
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  {mode === 'login' && 'Enter your Ghana phone number or select a demo role below.'}
                  {mode === 'register' && 'Join thousands of resellers and customers across Ghana.'}
                  {mode === 'otp' && `Enter the 6-digit SMS code sent to ${otpPhone || 'your mobile number'}.`}
                  {mode === 'reset-pin' && 'We will send a temporary security OTP to your registered phone.'}
                </CardDescription>

                {/* Tabs for switching between Sign In & Register */}
                {(mode === 'login' || mode === 'register') && (
                  <div className="pt-2">
                    <Tabs value={mode} onValueChange={(v) => {
                      setMode(v as any);
                      setLoginError('');
                      setRegError('');
                    }}>
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="login">Sign In</TabsTrigger>
                        <TabsTrigger value="register">Register</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                )}
              </CardHeader>

              <CardContent className="space-y-4">
                {/* 1. SIGN IN VIEW */}
                {mode === 'login' && (
                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                    {loginError && (
                      <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{loginError}</span>
                      </div>
                    )}

                    {/* Phone input */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-foreground">Ghana Mobile Number or Email</label>
                        {detectedNetwork && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${detectedNetwork.color}`}>
                            {detectedNetwork.name}
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <Smartphone className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="e.g. 024 100 2001 or admin@sdh.gh"
                          value={loginPhone}
                          onChange={(e) => setLoginPhone(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    {/* PIN input */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-foreground">4-Digit Security PIN or Password</label>
                        <button
                          type="button"
                          onClick={() => setMode('reset-pin')}
                          className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                        >
                          Forgot PIN?
                        </button>
                      </div>
                      <div className="relative">
                        <KeyRound className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground" />
                        <Input
                          type={showLoginPin ? 'text' : 'password'}
                          placeholder="Enter PIN (e.g. 2026, 1122, or 0000)"
                          value={loginPin}
                          onChange={(e) => setLoginPin(e.target.value)}
                          className="pl-10 pr-10 font-mono tracking-widest"
                          maxLength={8}
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPin(!showLoginPin)}
                          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          {showLoginPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Remember me */}
                    <div className="flex items-center justify-between text-xs">
                      <label className="flex items-center gap-2 text-muted-foreground cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="rounded border-border accent-primary cursor-pointer"
                        />
                        <span>Remember credentials on this browser</span>
                      </label>
                    </div>

                    <div className="flex flex-col gap-3 pt-1">
                      <div className="flex items-center gap-3"><span className="h-px flex-1 bg-border" /><span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">or continue with</span><span className="h-px flex-1 bg-border" /></div>
                      <Button type="button" variant="outline" className="w-full font-bold" onClick={() => setLoginError('Google sign-in is ready to connect when OAuth is enabled.')}><span className="font-black text-primary">G</span> Continue with Google</Button>
                    </div>

                    {/* Submit Button */}
                    <Button type="submit" variant="default" size="lg" className="w-full font-bold text-sm" disabled={isLoading}>
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Verifying with Core Gateway...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span>Sign In to Hub</span>
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      )}
                    </Button>

                    {/* Quick Demo Logins Section */}
                    <div className="pt-3 border-t border-border space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                          One-Click Demo Access
                        </span>
                        {onOpenSecurityPins && (
                          <button
                            type="button"
                            onClick={onOpenSecurityPins}
                            className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                          >
                            View PINs
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => handleQuickLogin('customer')}
                          className="p-2 rounded-xl border border-border/80 bg-card hover:bg-muted/60 hover:border-primary/40 transition-all text-left cursor-pointer space-y-1"
                        >
                          <div className="flex items-center gap-1 text-[11px] font-bold text-foreground">
                            <User className="w-3.5 h-3.5 text-blue-500" />
                            <span>Customer</span>
                          </div>
                          <div className="text-[10px] text-muted-foreground font-mono">PIN: 2026</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleQuickLogin('agent')}
                          className="p-2 rounded-xl border border-border/80 bg-card hover:bg-muted/60 hover:border-primary/40 transition-all text-left cursor-pointer space-y-1"
                        >
                          <div className="flex items-center gap-1 text-[11px] font-bold text-foreground">
                            <Store className="w-3.5 h-3.5 text-amber-500" />
                            <span>Agent</span>
                          </div>
                          <div className="text-[10px] text-muted-foreground font-mono">PIN: 1122</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleQuickLogin('admin')}
                          className="p-2 rounded-xl border border-border/80 bg-card hover:bg-muted/60 hover:border-primary/40 transition-all text-left cursor-pointer space-y-1"
                        >
                          <div className="flex items-center gap-1 text-[11px] font-bold text-foreground">
                            <Lock className="w-3.5 h-3.5 text-emerald-500" />
                            <span>NOC Admin</span>
                          </div>
                          <div className="text-[10px] text-muted-foreground font-mono">PIN: 0000</div>
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {/* 2. REGISTER VIEW */}
                {mode === 'register' && (
                  <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                    {regError && (
                      <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{regError}</span>
                      </div>
                    )}

                    {/* Role selector */}
                    <div className="grid grid-cols-2 gap-2">
                      <div
                        onClick={() => setRegRole('customer')}
                        className={`p-3 rounded-xl border transition-all cursor-pointer ${
                          regRole === 'customer'
                            ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                            : 'border-border bg-card text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <div className="flex items-center gap-2 text-xs font-bold">
                          <User className="w-3.5 h-3.5" />
                          <span>Customer Portal</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5 font-normal">
                          Personal top-ups, airtime, and WAEC vouchers
                        </p>
                      </div>

                      <div
                        onClick={() => setRegRole('agent')}
                        className={`p-3 rounded-xl border transition-all cursor-pointer ${
                          regRole === 'agent'
                            ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                            : 'border-border bg-card text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <div className="flex items-center gap-2 text-xs font-bold">
                          <Store className="w-3.5 h-3.5" />
                          <span>Reseller Agent</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5 font-normal">
                          Earn wholesale margin & launch public store
                        </p>
                      </div>
                    </div>

                    {/* Full Name */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-foreground">Full Legal Name</label>
                      <Input
                        type="text"
                        placeholder="e.g. Kwame Mensah"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                      />
                    </div>

                    {/* Phone */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-foreground">Ghana Mobile Number</label>
                        {detectedNetwork && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${detectedNetwork.color}`}>
                            {detectedNetwork.name}
                          </span>
                        )}
                      </div>
                      <Input
                        type="tel"
                        placeholder="e.g. 024 412 3456"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        maxLength={10}
                      />
                    </div>

                    {/* Ghana Card */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-foreground">Ghana Card PIN (NIA)</label>
                        <span className="text-[10px] text-muted-foreground">Required for AFA & Limits</span>
                      </div>
                      <Input
                        type="text"
                        placeholder="GHA-XXXXXXXXX-X"
                        value={regGhanaCard}
                        onChange={(e) => setRegGhanaCard(e.target.value.toUpperCase())}
                        className="font-mono text-xs uppercase"
                        maxLength={15}
                      />
                    </div>

                    {/* PIN */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-foreground">Create 4-Digit Security PIN</label>
                      <Input
                        type="password"
                        placeholder="4 numeric digits (e.g. 2026)"
                        value={regPin}
                        onChange={(e) => setRegPin(e.target.value)}
                        className="font-mono tracking-widest text-center"
                        maxLength={4}
                      />
                    </div>

                    <Button type="submit" variant="default" size="lg" className="w-full font-bold text-sm">
                      <span>Continue to Phone Verification</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </form>
                )}

                {/* 3. OTP VERIFICATION VIEW */}
                {mode === 'otp' && (
                  <form onSubmit={handleOtpSubmit} className="space-y-4 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary mx-auto flex items-center justify-center">
                      <Smartphone className="w-6 h-6" />
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-extrabold text-base text-foreground">Enter 6-Digit SMS Code</h3>
                      <p className="text-xs text-muted-foreground">
                        Simulated SMS delivered to <span className="font-mono font-bold text-foreground">{otpPhone || '024 100 2001'}</span>
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-muted/40 border border-border text-xs text-muted-foreground">
                      <span className="font-bold text-foreground">Demo Testing Code: </span>
                      <span className="font-mono font-extrabold text-primary">4190</span>
                    </div>

                    <div className="space-y-2">
                      <Input
                        type="text"
                        placeholder="• • • • • •"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        className="text-center font-mono text-xl tracking-[0.5em] font-black h-12"
                        maxLength={6}
                        autoFocus
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={() => setMode('register')}
                        className="text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        Change Number
                      </button>

                      <button
                        type="button"
                        disabled={otpTimer > 0}
                        onClick={() => setOtpTimer(59)}
                        className={`font-bold cursor-pointer ${
                          otpTimer > 0 ? 'text-muted-foreground' : 'text-primary hover:underline'
                        }`}
                      >
                        {otpTimer > 0 ? `Resend in ${otpTimer}s` : 'Resend Code'}
                      </button>
                    </div>

                    <Button
                      type="submit"
                      variant="default"
                      size="lg"
                      className="w-full font-bold text-sm"
                      disabled={isLoading || otpCode.length < 4}
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Verifying Token...</span>
                        </div>
                      ) : (
                        <span>Verify & Launch Workspace</span>
                      )}
                    </Button>
                  </form>
                )}

                {/* 4. RESET PIN VIEW */}
                {mode === 'reset-pin' && (
                  <div className="space-y-4">
                    {resetSent ? (
                      <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                        <h4 className="font-extrabold text-sm text-foreground">Temporary PIN Dispatched</h4>
                        <p className="text-xs text-muted-foreground">
                          A 4-digit temporary PIN has been dispatched to {resetPhone}. Use the demo PIN <span className="font-mono font-bold text-foreground">2026</span> to sign in.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setResetSent(false);
                            setMode('login');
                          }}
                          className="mt-2 text-xs font-bold"
                        >
                          Back to Sign In
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-xs text-muted-foreground">
                          Enter your Ghana mobile number to receive an immediate SMS reset PIN.
                        </p>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-foreground">Ghana Mobile Number</label>
                          <Input
                            type="tel"
                            placeholder="e.g. 024 100 2001"
                            value={resetPhone}
                            onChange={(e) => setResetPhone(e.target.value)}
                          />
                        </div>
                        <Button
                          variant="default"
                          size="lg"
                          className="w-full font-bold text-sm"
                          onClick={() => {
                            if (resetPhone.length >= 10) {
                              setResetSent(true);
                            }
                          }}
                        >
                          Send Recovery Instructions
                        </Button>
                        <div className="text-center pt-2">
                          <button
                            type="button"
                            onClick={() => setMode('login')}
                            className="text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer"
                          >
                            Return to Sign In
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>

              <CardFooter className="flex justify-between items-center border-t border-border pt-4 text-xs text-muted-foreground">
                <span>Ghana Data Protection Act Compliant</span>
                <span className="font-mono">SSL 256-bit</span>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

import React, { useState } from 'react';
import {
  Sparkles,
  LogIn,
  KeyRound,
  Palette,
  Check,
  Shield,
  ArrowRight,
  User,
  LogOut,
  Store,
  LayoutDashboard
} from 'lucide-react';
import { AppTheme, UserAccount, UserRole } from '../../types';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface PublicNavbarProps {
  user: UserAccount | null;
  onNavigateToAuth: (mode?: 'login' | 'register') => void;
  onNavigateToDashboard: (role: UserRole) => void;
  onSignOut: () => void;
  theme: AppTheme;
  onSetTheme: (theme: AppTheme) => void;
  onOpenSecurityPins?: () => void;
}

export const PublicNavbar: React.FC<PublicNavbarProps> = ({
  user,
  onNavigateToAuth,
  onNavigateToDashboard,
  onSignOut,
  theme,
  onSetTheme,
  onOpenSecurityPins,
}) => {
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const themes: { id: AppTheme; label: string; dot: string }[] = [
    { id: 'light', label: 'Modern Light', dot: 'bg-blue-600' },
    { id: 'dark', label: 'Dark Slate', dot: 'bg-slate-700' },
    { id: 'ghana-gold', label: 'Ghana Gold', dot: 'bg-amber-500' },
    { id: 'emerald-matrix', label: 'Emerald Matrix', dot: 'bg-emerald-500' },
    { id: 'royal-indigo', label: 'Royal Indigo', dot: 'bg-indigo-600' },
    { id: 'crimson-telecel', label: 'Crimson Telecel', dot: 'bg-red-600' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-card/85 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-black text-sm shadow-xs">
            SDH
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-base tracking-tight text-foreground">
                Smart Data Hub
              </span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">
                Ghana EVD
              </Badge>
            </div>
            <p className="text-[10px] text-muted-foreground hidden sm:block">
              MTN • Telecel • AT Direct Carrier Bridge
            </p>
          </div>
        </div>

        {/* Live Operational Beacon */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-emerald-700 dark:text-emerald-400 font-bold text-[11px]">
            EVD Core Switch 99.8% Uptime
          </span>
        </div>

        {/* Right CTA / Auth Controls */}
        <div className="flex items-center gap-2.5">
          {/* Credentials Cheat Sheet */}
          {onOpenSecurityPins && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenSecurityPins}
              className="text-xs font-semibold gap-1.5 hidden sm:flex"
              title="Click to view hardcoded demo PINs"
            >
              <KeyRound className="w-3.5 h-3.5 text-primary" />
              <span>PINs (0000)</span>
            </Button>
          )}

          {/* Theme Dropdown */}
          <div className="relative">
            <Button
              variant="outline"
              size="iconSm"
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              title="Theme Switcher"
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

          {/* User Auth Buttons */}
          {user ? (
            <div className="flex items-center gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => onNavigateToDashboard(user.role)}
                className="font-bold text-xs gap-1.5 shadow-2xs"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Go to {user.role === 'admin' ? 'Admin NOC' : user.role === 'agent' ? 'Agent Hub' : 'Dashboard'}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={onSignOut}
                className="text-xs text-muted-foreground hover:text-foreground hidden sm:flex"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigateToAuth('login')}
                className="text-xs font-bold gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Button>

              <Button
                variant="default"
                size="sm"
                onClick={() => onNavigateToAuth('register')}
                className="text-xs font-bold gap-1.5 shadow-2xs"
              >
                <span>Get Started</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

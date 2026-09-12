import React, { useState, useRef, useEffect } from "react";
import {
  Wallet,
  Bell,
  Search,
  Moon,
  Sun,
  Smartphone,
  ChevronDown,
  User,
  LogOut,
  Sparkles,
  ExternalLink,
  Store,
  ShieldAlert,
  Layers,
  Menu,
  X,
  Palette,
  KeyRound,
  Lock,
  Check,
  ShieldCheck,
  LogIn,
} from "lucide-react";
import { UserRole, AppTheme, UserAccount } from "../../types";
import { SignalRail } from "./SignalRail";
import { themeOptions, getThemeOption } from "../../lib/themes";

interface NavbarProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  walletBalance: number;
  onOpenFundWallet: () => void;
  onOpenCommand?: () => void;
  onOpenCommandMenu?: () => void;
  onOpenNotifications?: () => void;
  unreadCount?: number;
  theme: AppTheme;
  onToggleTheme: () => void;
  onSetTheme: (theme: AppTheme) => void;
  isMobileShell?: boolean;
  onToggleMobileShell?: () => void;
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
  user?: UserAccount | null;
  onOpenAuth?: (mode?: "signin" | "signup" | "demo") => void;
  onLogout?: () => void;
  onOpenSecurityPins?: () => void;
  isAdminUnlocked?: boolean;
  onLockAdmin?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onRoleChange,
  walletBalance,
  onOpenFundWallet,
  onOpenCommand,
  onOpenCommandMenu,
  onOpenNotifications,
  unreadCount = 0,
  theme,
  onToggleTheme,
  onSetTheme,
  isMobileShell = false,
  onToggleMobileShell,
  onToggleMobileMenu,
  isMobileMenuOpen,
  user,
  onOpenAuth,
  onLogout,
  onOpenSecurityPins,
  isAdminUnlocked = false,
  onLockAdmin,
}) => {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);

  const currentThemeObj = getThemeOption(theme);

  const handleOpenCommand = () => {
    if (onOpenCommand) onOpenCommand();
    else if (onOpenCommandMenu) onOpenCommandMenu();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-card/90 backdrop-blur-md transition-colors">
      <div className="flex h-16 items-center justify-between px-3 sm:px-6 gap-2 sm:gap-3">
        {/* Left: Brand Logo & Wordmark */}
        <div className="flex items-center gap-3">
          {/* Mobile menu toggle button */}
          {onToggleMobileMenu &&
            currentRole !== "public" &&
            currentRole !== "storefront" && (
              <button
                onClick={onToggleMobileMenu}
                className="md:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted"
                aria-label="Toggle Navigation"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            )}

          <div
            onClick={() => onRoleChange("public")}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-extrabold text-sm shadow-sm group-hover:scale-105 transition-transform">
              SDH
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm tracking-tight text-foreground">
                  Smart Data Hub
                </span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-900 dark:text-amber-300">
                  GH₵
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground -mt-0.5">
                Telecom & Digital Services
              </p>
            </div>
          </div>

          {/* Operational Signal Rail Badge */}
          <div className="hidden lg:flex items-center pl-3 border-l border-border/80">
            <SignalRail status="online" size="sm" label="Gateway 99.8%" />
          </div>
        </div>

        {/* Right: Quick actions, Wallet balance, notifications, theme, profile */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Power Search Cmd+K */}
          <button
            onClick={handleOpenCommand}
            className="hidden xl:flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-border bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground text-xs transition-colors cursor-pointer"
            title="Search or jump to service (Cmd + K)"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search...</span>
            <kbd className="px-1.5 py-0.5 rounded bg-card border border-border text-[10px] font-mono">
              ⌘K
            </kbd>
          </button>

          {/* Security PINs Quick Ref Trigger */}
          {onOpenSecurityPins && (
            <button
              onClick={onOpenSecurityPins}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-bold text-foreground transition-colors cursor-pointer"
              title="View Hardcoded Access PINs & Credentials"
            >
              <KeyRound className="w-3.5 h-3.5 text-primary" />
              <span>PINs (0000)</span>
            </button>
          )}

          {/* Wallet Balance Pill */}
          <div className="flex items-center rounded-xl border border-border bg-card shadow-2xs overflow-hidden">
            <div className="px-2.5 py-1 text-xs">
              <span className="text-[10px] uppercase text-muted-foreground block leading-tight font-medium">
                Wallet
              </span>
              <span className="font-bold text-foreground tabular-nums text-xs sm:text-sm">
                GH₵ {walletBalance.toFixed(2)}
              </span>
            </div>
            <button
              onClick={onOpenFundWallet}
              className="h-full px-2 sm:px-2.5 py-2 bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors flex items-center gap-1 cursor-pointer"
              title="Top up your wallet balance"
            >
              <span>+ Fund</span>
            </button>
          </div>

          {/* Mobile Shell Showcase Toggle */}
          {onToggleMobileShell && (
            <button
              onClick={onToggleMobileShell}
              className={`p-2 rounded-xl border text-xs font-medium transition-colors hidden sm:flex items-center gap-1.5 cursor-pointer ${
                isMobileShell
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              title="Toggle Phone Frame Mobile Shell Mode"
            >
              <Smartphone className="w-4 h-4" />
              <span className="hidden 2xl:inline text-[11px]">Phone Shell</span>
            </button>
          )}

          {/* Notification Bell with Badge */}
          <button
            onClick={() => onOpenNotifications?.()}
            className="relative p-2 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* 6-Theme Dropdown Selector */}
          <div className="relative">
            <button
              onClick={() => {
                setThemeDropdownOpen(!themeDropdownOpen);
                setProfileDropdownOpen(false);
              }}
              className="flex items-center gap-1.5 p-2 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title={`Active Theme: ${currentThemeObj.name}. Click to change theme.`}
              aria-label="Theme Selector"
            >
              <span
                className={`w-3.5 h-3.5 rounded-full ${currentThemeObj.dot}`}
              />
              <Palette className="w-3.5 h-3.5 hidden sm:inline" />
              <ChevronDown className="w-3 h-3 text-muted-foreground hidden sm:inline" />
            </button>

            {themeDropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-56 rounded-2xl bg-card border border-border shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                onClick={() => setThemeDropdownOpen(false)}
              >
                <div className="px-3.5 py-1.5 border-b border-border/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Select Theme Archetype
                  </span>
                </div>
                <div className="px-1.5 py-1 text-xs space-y-0.5">
                  {themeOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => onSetTheme(opt.id)}
                      className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between transition-colors cursor-pointer ${
                        theme === opt.id
                          ? "bg-primary/10 text-primary font-bold"
                          : "text-foreground hover:bg-muted"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${opt.dot}`} />
                        <span className="text-xs">{opt.name}</span>
                      </div>
                      {theme === opt.id && (
                        <Check className="w-3.5 h-3.5 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Profile / Demo Avatar Menu */}
          <div className="relative">
            <button
              onClick={() => {
                setProfileDropdownOpen(!profileDropdownOpen);
                setThemeDropdownOpen(false);
              }}
              className="flex items-center gap-1.5 p-1 sm:p-1.5 rounded-xl border border-border bg-card hover:bg-muted transition-colors cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                {currentRole === "admin"
                  ? "AD"
                  : currentRole === "agent"
                    ? "KO"
                    : "KM"}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground hidden sm:block" />
            </button>

            {profileDropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-64 rounded-2xl bg-card border border-border shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                onClick={() => setProfileDropdownOpen(false)}
              >
                <div className="px-3.5 py-2 border-b border-border/80 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-foreground">
                      {user?.name ||
                        (currentRole === "admin"
                          ? "NOC Super Admin"
                          : currentRole === "agent"
                            ? "Kofi Owusu (Agent)"
                            : "Kojo Mensah")}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {user?.phone || "024 419 2834"} • Verified
                    </p>
                  </div>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-primary/15 text-primary">
                    {user?.role || currentRole}
                  </span>
                </div>

                <div className="px-1.5 py-1 text-xs">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                    Switch Workspace Mode
                  </div>
                  <button
                    onClick={() => onRoleChange("customer")}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between ${
                      currentRole === "customer"
                        ? "bg-primary/10 text-primary font-bold"
                        : "hover:bg-muted text-foreground"
                    }`}
                  >
                    <span>Customer Dashboard</span>
                    {currentRole === "customer" && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    )}
                  </button>
                  <button
                    onClick={() => onRoleChange("agent")}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between ${
                      currentRole === "agent"
                        ? "bg-primary/10 text-primary font-bold"
                        : "hover:bg-muted text-foreground"
                    }`}
                  >
                    <span>Agent Workspace</span>
                    {currentRole === "agent" && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    )}
                  </button>
                  <button
                    onClick={() => onRoleChange("admin")}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between ${
                      currentRole === "admin"
                        ? "bg-primary/10 text-primary font-bold"
                        : "hover:bg-muted text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Admin NOC Console</span>
                      {!isAdminUnlocked && (
                        <Lock className="w-3 h-3 text-muted-foreground" />
                      )}
                    </div>
                    {currentRole === "admin" && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    )}
                  </button>
                  <button
                    onClick={() => onRoleChange("storefront")}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between ${
                      currentRole === "storefront"
                        ? "bg-primary/10 text-primary font-bold"
                        : "hover:bg-muted text-foreground"
                    }`}
                  >
                    <span>Kofi Telecom Storefront</span>
                    {currentRole === "storefront" && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    )}
                  </button>
                  <button
                    onClick={() => onRoleChange("public")}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between ${
                      currentRole === "public"
                        ? "bg-primary/10 text-primary font-bold"
                        : "hover:bg-muted text-foreground"
                    }`}
                  >
                    <span>Public Marketing Site</span>
                    {currentRole === "public" && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    )}
                  </button>
                </div>

                {/* Auth actions & PIN reference */}
                <div className="border-t border-border/80 pt-1.5 mt-1 px-1.5 space-y-1">
                  {onOpenSecurityPins && (
                    <button
                      onClick={onOpenSecurityPins}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold text-foreground hover:bg-muted flex items-center gap-2 cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-primary" />
                      <span>Security PINs Reference Sheet</span>
                    </button>
                  )}

                  {currentRole === "admin" &&
                    isAdminUnlocked &&
                    onLockAdmin && (
                      <button
                        onClick={onLockAdmin}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 flex items-center gap-2 cursor-pointer"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Lock Admin Console</span>
                      </button>
                    )}

                  {onOpenAuth && (
                    <button
                      onClick={() => onOpenAuth("signin")}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold text-primary hover:bg-primary/10 flex items-center gap-2 cursor-pointer"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Switch Account / Sign In</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      if (onLogout) onLogout();
                      onRoleChange("public");
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-destructive hover:bg-destructive/10 flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out & Return Home</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

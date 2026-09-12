import React, { useState } from "react";
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
  LayoutDashboard,
  Home,
  Layers3,
  Search,
  HelpCircle,
  Info,
  PhoneCall,
  Menu,
  X,
  ExternalLink,
} from "lucide-react";
import { AppTheme, UserAccount, UserRole } from "../../types";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";

interface PublicNavbarProps {
  user: UserAccount | null;
  activeTab:
    | "home"
    | "services"
    | "agent"
    | "track"
    | "faq"
    | "about"
    | "contact";
  onNavigateToPublic: (tab: string) => void;
  onNavigateToAuth: (mode?: "login" | "register") => void;
  onNavigateToDashboard: (role: UserRole) => void;
  onSignOut: () => void;
  theme: AppTheme;
  onSetTheme: (theme: AppTheme) => void;
  onOpenSecurityPins?: () => void;
}

export const PublicNavbar: React.FC<PublicNavbarProps> = ({
  user,
  activeTab,
  onNavigateToPublic,
  onNavigateToAuth,
  onNavigateToDashboard,
  onSignOut,
  theme,
  onSetTheme,
  onOpenSecurityPins,
}) => {
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const themes: { id: AppTheme; label: string; dot: string }[] = [
    { id: "light", label: "Modern Light", dot: "bg-blue-600" },
    { id: "dark", label: "Dark Slate", dot: "bg-slate-700" },
    { id: "ghana-gold", label: "Ghana Gold", dot: "bg-amber-500" },
    { id: "emerald-matrix", label: "Emerald Matrix", dot: "bg-emerald-500" },
    { id: "royal-indigo", label: "Royal Indigo", dot: "bg-indigo-600" },
    { id: "crimson-telecel", label: "Crimson Telecel", dot: "bg-red-600" },
  ];

  const publicNavItems: {
    id: PublicNavbarProps["activeTab"];
    label: string;
    badge?: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: "home", label: "Home", icon: Home },
    { id: "services", label: "Services", icon: Layers3 },
    { id: "agent", label: "Agent Program", badge: "Earn MoMo", icon: Store },
    { id: "track", label: "Track Order", icon: Search },
    { id: "faq", label: "FAQ", icon: HelpCircle },
    { id: "about", label: "About NOC", icon: Info },
    { id: "contact", label: "Contact", icon: PhoneCall },
  ] as const;

  const handleNavClick = (id: PublicNavbarProps["activeTab"]) => {
    onNavigateToPublic(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-card/90 backdrop-blur-md transition-colors">
      <div className="mx-auto w-full max-w-[95%] px-4 sm:px-6 h-16 flex items-center justify-between gap-3 overflow-visible">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleNavClick("home")}
            className="flex items-center gap-2.5 text-left cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-black text-sm shadow-xs group-hover:scale-105 transition-transform">
              SDH
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-base tracking-tight text-foreground group-hover:text-primary transition-colors">
                  Smart Data Hub
                </span>
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 font-mono hidden sm:inline-flex"
                >
                  Ghana EVD
                </Badge>
              </div>
              <p className="text-[10px] text-muted-foreground hidden md:block">
                MTN • Telecel • AT Direct Carrier Bridge
              </p>
            </div>
          </button>
        </div>

        {/* Desktop Nav Items */}
        <nav
          aria-label="Public site navigation"
          className="hidden xl:flex items-center"
        >
          <div className="flex items-center gap-1 rounded-xl border border-border/70 bg-muted/40 p-1">
            {publicNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === item.id
                    ? "bg-primary text-primary-foreground font-bold shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <span className="inline-flex items-center gap-1">
                  <item.icon className="size-3.5" />
                  {item.label}
                  {item.badge && (
                    <span className="hidden 2xl:inline text-[9px] px-1 py-0.5 rounded-full bg-amber-500/20 text-amber-900 dark:text-amber-300 font-bold">
                      {item.badge}
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>
        </nav>

        {/* Right CTA / Auth Controls */}
        <div className="flex items-center gap-1 rounded-xl border border-border/70 bg-muted/40 p-1">
          {/* Credentials Cheat Sheet */}
          {onOpenSecurityPins && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenSecurityPins}
              className="text-xs font-semibold gap-1.5 hidden sm:flex border-transparent bg-transparent hover:bg-muted"
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
              size="icon-sm"
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              className="text-xs text-muted-foreground hover:text-foreground hidden sm:flex border-transparent bg-transparent hover:bg-muted"
              title="Change color theme"
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
                      theme === t.id
                        ? "bg-primary/10 text-primary font-bold"
                        : "hover:bg-muted text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${t.dot}`} />
                      <span>{t.label}</span>
                    </div>
                    {theme === t.id && (
                      <Check className="w-3 h-3 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User Auth Buttons */}
          {user ? (
            <div className="flex items-center gap-1">
              <Button
                variant="default"
                size="sm"
                onClick={() => onNavigateToDashboard(user.role)}
                className="font-bold text-xs gap-1.5 shadow-2xs"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>
                  Go to{" "}
                  {user.role === "admin"
                    ? "Admin NOC"
                    : user.role === "agent"
                      ? "Agent Hub"
                      : "Dashboard"}
                </span>
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
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigateToAuth("login")}
                className="text-xs font-bold gap-1.5 border-transparent bg-transparent hover:bg-muted"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Button>

              <Button
                variant="default"
                size="sm"
                onClick={() => onNavigateToAuth("register")}
                className="text-xs font-bold gap-1.5 shadow-2xs"
              >
                <span>Get Started</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted xl:hidden cursor-pointer"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-border bg-card/95 backdrop-blur-md px-4 py-4 space-y-3 shadow-xl animate-in slide-in-from-top-2">
          <div className="grid grid-cols-2 gap-1.5">
            {publicNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === item.id
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-border flex flex-col gap-2">
            <button
              onClick={() => {
                onNavigateToDashboard("storefront");
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-primary/40 bg-primary/10 text-primary font-bold text-xs"
            >
              <Store className="w-4 h-4" />
              <span>Preview Agent Storefront</span>
            </button>

            {onOpenSecurityPins && (
              <button
                onClick={() => {
                  onOpenSecurityPins();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-muted text-foreground font-semibold text-xs"
              >
                <KeyRound className="w-4 h-4 text-primary" />
                <span>View Demo PINs (0000)</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

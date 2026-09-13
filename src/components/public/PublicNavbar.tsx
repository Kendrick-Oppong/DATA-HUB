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
import { themeOptions } from "../../lib/themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const publicNavItems: {
    id: PublicNavbarProps["activeTab"];
    label: string;
    badge?: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: "home", label: "Home", icon: Home },
    { id: "services", label: "Services", icon: Layers3 },
    {
      id: "agent",
      label: "Agent Program",
      badge: "Earn MoMo",
      icon: Store,
    },
    { id: "track", label: "Track Order", icon: Search },
    { id: "faq", label: "FAQ", icon: HelpCircle },
    { id: "about", label: "About NOC", icon: Info },
    { id: "contact", label: "Contact", icon: PhoneCall },
  ];

  const handleNavClick = (id: PublicNavbarProps["activeTab"]) => {
    onNavigateToPublic(id);
    setMobileMenuOpen(false);
  };

  const dashboardLabel =
    user?.role === "admin"
      ? "Admin NOC"
      : user?.role === "agent"
        ? "Agent Hub"
        : "Dashboard";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-card/90 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-16 w-full max-w-[95%] items-center justify-between gap-3 overflow-visible px-4 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => handleNavClick("home")}
            className="group h-auto cursor-pointer gap-2.5 rounded-lg p-0 text-left hover:bg-transparent"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-black text-primary-foreground shadow-xs transition-transform group-hover:scale-105">
              SDH
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black tracking-tight text-foreground transition-colors group-hover:text-primary">
                  Smart Data Hub
                </span>

                <Badge
                  variant="outline"
                  className="hidden px-1.5 py-0 font-mono text-[10px] sm:inline-flex"
                >
                  Ghana EVD
                </Badge>
              </div>

              <p className="hidden text-[10px] text-muted-foreground md:block">
                MTN • Telecel • AT Direct Carrier Bridge
              </p>
            </div>
          </Button>
        </div>

        {/* Desktop Navigation */}
        <nav
          aria-label="Public site navigation"
          className="hidden xl:flex items-center"
        >
          <div className="flex items-center gap-1 rounded-xl border border-border/70 bg-muted/40 p-1">
            {publicNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <Button
                  key={item.id}
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleNavClick(item.id)}
                  className={`h-auto rounded-full px-2.5 py-1.5 text-[11px] font-semibold ${
                    isActive
                      ? "font-bold shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="size-3.5" />

                  <span>{item.label}</span>

                  {item.badge && (
                    <span className="hidden rounded-full bg-amber-500/20 px-1 py-0.5 text-[9px] font-bold text-amber-900 2xl:inline dark:text-amber-300">
                      {item.badge}
                    </span>
                  )}
                </Button>
              );
            })}
          </div>
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-1 rounded-full border border-border/70 bg-muted/40 p-1">
          {/* Security PINs */}
          {onOpenSecurityPins && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenSecurityPins}
              className="hidden rounded-full border-transparent bg-transparent text-xs font-semibold hover:bg-muted sm:flex"
              title="Click to view hardcoded demo PINs"
            >
              <KeyRound className="size-3.5 text-primary" />
              <span>PINs (0000)</span>
            </Button>
          )}

          {/* Theme */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="hidden rounded-full border-transparent bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground sm:flex"
                  title="Change color theme"
                  aria-label="Change color theme"
                />
              }
            >
              <Palette className="size-3.5" />
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Select Theme
                </DropdownMenuLabel>

                <DropdownMenuRadioGroup
                  value={theme}
                  onValueChange={(value) => onSetTheme(value as AppTheme)}
                >
                  {themeOptions.map((t) => (
                    <DropdownMenuRadioItem
                      key={t.id}
                      value={t.id}
                      className="rounded-full text-xs font-semibold"
                    >
                      <span className={`size-2.5 rounded-full ${t.dot}`} />

                      <span>{t.name}</span>
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Authenticated User */}
          {user ? (
            <div className="flex items-center gap-1">
              <Button
                variant="default"
                size="sm"
                onClick={() => onNavigateToDashboard(user.role)}
                className="rounded-full text-xs font-bold shadow-2xs"
              >
                <LayoutDashboard className="size-3.5" />
                <span>Go to {dashboardLabel}</span>
              </Button>

              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onSignOut}
                className="hidden rounded-full text-muted-foreground hover:text-foreground sm:flex"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="size-3.5" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigateToAuth("login")}
                className="rounded-full border-transparent bg-transparent text-xs font-bold hover:bg-muted"
              >
                <LogIn className="size-3.5" />
                <span>Sign In</span>
              </Button>

              <Button
                variant="default"
                size="sm"
                onClick={() => onNavigateToAuth("register")}
                className="rounded-full text-xs font-bold shadow-2xs"
              >
                <span>Get Started</span>
                <ArrowRight className="size-3.5" />
              </Button>
            </div>
          )}

          {/* Mobile Toggle */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="rounded-full text-muted-foreground hover:bg-muted hover:text-foreground xl:hidden"
            aria-label="Toggle mobile menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X className="size-5" />
            ) : (
              <Menu className="size-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="animate-in slide-in-from-top-2 border-t border-border bg-card/95 px-4 py-4 shadow-xl backdrop-blur-md xl:hidden">
          <div className="grid grid-cols-2 gap-1.5">
            {publicNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <Button
                  key={item.id}
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleNavClick(item.id)}
                  className={`h-auto justify-start rounded-xl p-2.5 text-xs font-bold ${
                    isActive
                      ? "shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="size-4" />
                  <span>{item.label}</span>

                  {item.badge && (
                    <span className="ml-auto rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-900 dark:text-amber-300">
                      {item.badge}
                    </span>
                  )}
                </Button>
              );
            })}
          </div>

          <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
            <Button
              variant="outline"
              onClick={() => {
                onNavigateToDashboard("storefront");
                setMobileMenuOpen(false);
              }}
              className="w-full rounded-xl border-primary/40 bg-primary/10 text-xs font-bold text-primary hover:bg-primary/15 hover:text-primary"
            >
              <Store className="size-4" />
              <span>Preview Agent Storefront</span>
            </Button>

            {onOpenSecurityPins && (
              <Button
                variant="secondary"
                onClick={() => {
                  onOpenSecurityPins();
                  setMobileMenuOpen(false);
                }}
                className="w-full rounded-xl text-xs font-semibold"
              >
                <KeyRound className="size-4 text-primary" />
                <span>View Demo PINs (0000)</span>
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

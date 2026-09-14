import React, { useState, useEffect, useRef } from "react";
import {
  LogIn,
  KeyRound,
  Palette,
  ArrowRight,
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
} from "lucide-react";

import { AppTheme, UserAccount, UserRole } from "../../types";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { themeOptions } from "../../lib/themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
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
  onNavigateToAuth: (mode?: "sign-in" | "sign-up") => void;
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
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const button = document.querySelector(
        '[aria-label="Toggle mobile menu"]',
      );

      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(target) &&
        !button?.contains(target)
      ) {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const toggleMobileMenu = () => {
    setMobileMenuOpen((open) => !open);
  };

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
      <div className="mx-auto flex h-16 w-full sm:max-w-[95%] items-center justify-between gap-3 overflow-visible px-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => handleNavClick("home")}
            className="group h-auto cursor-pointer gap-2.5 rounded-lg p-0 text-left hover:!bg-transparent"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-black text-primary-foreground shadow-xs transition-transform group-hover:scale-105">
              SDH
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black tracking-tight text-foreground transition-colors">
                  Smart Data Hub
                </span>
              </div>

              <p className="hidden text-[10px] text-muted-foreground md:block">
                Carrier Bridge
              </p>
            </div>
          </Button>
        </div>

        {/* Desktop Navigation */}
        <nav
          aria-label="Public site navigation"
          className="hidden xl:flex items-center"
        >
          <div className="flex items-center gap-1 rounded-full border border-border/70 bg-muted/40 p-1">
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
          {/* {onOpenSecurityPins && (
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
          )} */}

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

          {/* Authenticated User Profile Dropdown */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    className="relative flex size-7 items-center justify-center rounded-full border border-primary/30 bg-primary/10 p-0 text-primary font-black text-xs shadow-2xs transition-all hover:border-primary/60 hover:bg-primary/20 hover:scale-105 active:scale-95"
                    title={user.name || user.phone}
                    aria-label="User profile menu"
                  />
                }
              >
                <span className="font-black text-xs tracking-tight uppercase">
                  {user.name
                    ? user.name
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")
                    : "U"}
                </span>
                <span className="absolute -bottom-0.5 -right-0.5 flex size-2.5">
                  <span className="size-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />
                </span>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="w-56 rounded-xl border-border p-2 shadow-xl"
              >
                {/* User Info Header */}
                <div className="flex items-center gap-2.5 p-2">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 font-black text-sm uppercase text-primary">
                    {user.name
                      ? user.name
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")
                      : "U"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold leading-tight text-foreground">
                      {user.name || "User"}
                    </p>
                    <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                      {user.email}
                    </p>
                    <Badge
                      variant="outline"
                      className="mt-1 border-primary/30 text-[9px] font-bold uppercase tracking-wider text-primary"
                    >
                      {user.role} account
                    </Badge>
                  </div>
                </div>

                <DropdownMenuSeparator className="my-1" />

                {/* Actions */}
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={() => onNavigateToDashboard(user.role)}
                    className="cursor-pointer gap-2 rounded-xl py-2 text-xs font-semibold"
                  >
                    <LayoutDashboard className="size-4 text-primary" />
                    <span>Go to {dashboardLabel}</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator className="my-1" />

                {/* Sign Out */}
                <DropdownMenuItem
                  onClick={onSignOut}
                  variant="destructive"
                  className="cursor-pointer gap-2 rounded-xl py-2 text-xs font-semibold text-destructive focus:bg-destructive/10"
                >
                  <LogOut className="size-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-1">
              <Button
                variant="default"
                size="sm"
                onClick={() => onNavigateToAuth("sign-in")}
                className="rounded-full text-xs font-bold shadow-2xs"
              >
                <span>Sign In</span>
                <LogIn className="size-3.5 stroke-3" />
              </Button>
            </div>
          )}

          {/* Mobile Toggle */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggleMobileMenu}
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
      <div
        className={`absolute left-0 right-0 top-full z-50 overflow-hidden transition-all duration-300 ease-in-out xl:hidden ${
          mobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div
          ref={mobileMenuRef}
          className="border-t border-border bg-card px-4 py-4 shadow-xl backdrop-blur-lg"
        >
          <div className="flex flex-col gap-1.5">
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
        </div>
      </div>
    </header>
  );
};

import React from "react";
import {
  Bell,
  Check,
  ChevronDown,
  KeyRound,
  Lock,
  LogIn,
  LogOut,
  Menu,
  Palette,
  Search,
  Smartphone,
  X,
} from "lucide-react";

import { UserRole, AppTheme, UserAccount } from "../../types";
import { SignalRail } from "./SignalRail";
import { themeOptions, getThemeOption } from "../../lib/themes";

import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
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
import { Kbd } from "../ui/kbd";
import { Separator } from "../ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

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
  const currentThemeObj = getThemeOption(theme);

  const handleOpenCommand = () => {
    if (onOpenCommand) {
      onOpenCommand();
    } else {
      onOpenCommandMenu?.();
    }
  };

  const handleLogout = () => {
    onLogout?.();
    onRoleChange("public");
  };

  const profileInitials =
    currentRole === "admin" ? "AD" : currentRole === "agent" ? "KO" : "KM";

  const profileName =
    user?.name ||
    (currentRole === "admin"
      ? "NOC Super Admin"
      : currentRole === "agent"
        ? "Kofi Owusu (Agent)"
        : "Kojo Mensah");

  return (
    <TooltipProvider>
      <header className="sticky top-0 z-40 w-full border-b bg-card/90 backdrop-blur-md">
        <div className="flex h-16 items-center justify-between gap-2 px-3 sm:gap-3 sm:px-6">
          {/* Brand */}
          <div className="flex items-center gap-3">
            {onToggleMobileMenu &&
              currentRole !== "public" &&
              currentRole !== "storefront" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full md:hidden"
                  onClick={onToggleMobileMenu}
                  aria-label="Toggle navigation"
                >
                  {isMobileMenuOpen ? (
                    <X className="size-5" />
                  ) : (
                    <Menu className="size-5" />
                  )}
                </Button>
              )}

            <button
              type="button"
              onClick={() => onRoleChange("public")}
              className="group flex cursor-pointer items-center gap-2.5"
            >
              <div className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-extrabold text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
                SDH
              </div>

              <div className="hidden sm:block">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-extrabold tracking-tight text-foreground">
                    Smart Data Hub
                  </span>
                </div>

                <p className="-mt-0.5 text-[10px] text-muted-foreground">
                  Telecom & Digital Services
                </p>
              </div>
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Command Search */}
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenCommand}
                    className="hidden h-9 gap-2 rounded-full bg-muted/40 px-2.5 text-xs text-muted-foreground hover:text-foreground xl:flex"
                  />
                }
              >
                <Search className="size-3.5" />

                <span>Search...</span>

                <Kbd className="h-5 px-1.5 text-[10px]">⌘K</Kbd>
              </TooltipTrigger>

              <TooltipContent>Search or jump to service</TooltipContent>
            </Tooltip>

            {/* Security PINs */}
            {onOpenSecurityPins && (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenSecurityPins}
                className="hidden h-9 rounded-full text-xs font-bold lg:flex"
              >
                <KeyRound className="size-3.5 text-primary" />
                <span>PINs (0000)</span>
              </Button>
            )}

            {/* Wallet */}
            <div className="flex h-9 items-center overflow-hidden rounded-full border bg-card shadow-2xs">
              <div className="px-2.5">
                <p className="block text-[8px] font-bold uppercase leading-tight text-muted-foreground">
                  Wallet
                </p>

                <p className="text-xs font-bold tabular-nums text-foreground">
                  GH₵ {walletBalance.toFixed(2)}
                </p>
              </div>

              <Button
                size="sm"
                onClick={onOpenFundWallet}
                className="mr-0.5 h-7 rounded-full px-2 text-xs"
              >
                + Fund
              </Button>
            </div>

            {/* Mobile Shell */}
            {onToggleMobileShell && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant={isMobileShell ? "default" : "outline"}
                      size="sm"
                      onClick={onToggleMobileShell}
                      className="hidden rounded-full sm:flex"
                    />
                  }
                >
                  <Smartphone className="size-4" />

                  <span className="hidden text-[11px] 2xl:inline">
                    Phone Shell
                  </span>
                </TooltipTrigger>

                <TooltipContent>
                  Toggle Phone Frame Mobile Shell Mode
                </TooltipContent>
              </Tooltip>
            )}

            {/* Notifications */}
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onOpenNotifications?.()}
                    className="relative rounded-full"
                    aria-label="Notifications"
                  />
                }
              >
                <Bell className="size-4" />

                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full p-0 text-[9px]"
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Badge>
                )}
              </TooltipTrigger>

              <TooltipContent>Notifications</TooltipContent>
            </Tooltip>

            {/* Theme */}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="outline"
                    size="icon"
                    className="flex items-center rounded-full sm:w-auto sm:px-2.5"
                    aria-label="Theme selector"
                  />
                }
              >
                <span
                  className={`size-3.5 rounded-full mr-2 ${currentThemeObj.dot}`}
                />

                <Palette className="hidden size-3.5 sm:block" />

                <ChevronDown className="hidden size-3 sm:block" />
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Select Theme Archetype
                  </DropdownMenuLabel>

                  <DropdownMenuRadioGroup
                    value={theme}
                    onValueChange={(value) => onSetTheme(value as AppTheme)}
                  >
                    {themeOptions.map((option) => (
                      <DropdownMenuRadioItem
                        key={option.id}
                        value={option.id}
                        className="text-xs"
                      >
                        <span
                          className={`mr-2 size-3 rounded-full ${option.dot}`}
                        />

                        <span>{option.name}</span>
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="outline"
                    className="h-9 gap-1.5 rounded-full px-1.5"
                  />
                }
              >
                <div className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {profileInitials}
                </div>

                <ChevronDown className="hidden size-3.5 text-muted-foreground sm:block" />
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-64">
                {/* Profile Header */}
                <div className="flex items-center justify-between gap-3 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold">{profileName}</p>

                    <p className="truncate text-[11px] text-muted-foreground">
                      {user?.phone || "024 419 2834"} • Verified
                    </p>
                  </div>

                  <Badge
                    variant="secondary"
                    className="shrink-0 text-[10px] font-bold uppercase"
                  >
                    {user?.role || currentRole}
                  </Badge>
                </div>

                <DropdownMenuSeparator />

                {/* Workspace */}
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Switch Workspace Mode
                  </DropdownMenuLabel>

                  <DropdownMenuItem
                    onClick={() => onRoleChange("customer")}
                    className={
                      currentRole === "customer"
                        ? "bg-primary/10 font-bold text-primary"
                        : ""
                    }
                  >
                    Customer Dashboard
                    {currentRole === "customer" && (
                      <Check className="ml-auto size-3.5" />
                    )}
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => onRoleChange("agent")}
                    className={
                      currentRole === "agent"
                        ? "bg-primary/10 font-bold text-primary"
                        : ""
                    }
                  >
                    Agent Workspace
                    {currentRole === "agent" && (
                      <Check className="ml-auto size-3.5" />
                    )}
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => onRoleChange("admin")}
                    className={
                      currentRole === "admin"
                        ? "bg-primary/10 font-bold text-primary"
                        : ""
                    }
                  >
                    <span className="flex items-center gap-1.5">
                      Admin NOC Console
                      {!isAdminUnlocked && (
                        <Lock className="size-3 text-muted-foreground" />
                      )}
                    </span>

                    {currentRole === "admin" && (
                      <Check className="ml-auto size-3.5" />
                    )}
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => onRoleChange("storefront")}
                    className={
                      currentRole === "storefront"
                        ? "bg-primary/10 font-bold text-primary"
                        : ""
                    }
                  >
                    Kofi Telecom Storefront
                    {currentRole === "storefront" && (
                      <Check className="ml-auto size-3.5" />
                    )}
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => onRoleChange("public")}
                    className={
                      currentRole === "public"
                        ? "bg-primary/10 font-bold text-primary"
                        : ""
                    }
                  >
                    Public Marketing Site
                    {currentRole === "public" && (
                      <Check className="ml-auto size-3.5" />
                    )}
                  </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                {/* Account Actions */}
                <DropdownMenuGroup>
                  {onOpenSecurityPins && (
                    <DropdownMenuItem onClick={onOpenSecurityPins}>
                      <KeyRound className="size-3.5 text-primary" />
                      Security PINs Reference Sheet
                    </DropdownMenuItem>
                  )}

                  {currentRole === "admin" &&
                    isAdminUnlocked &&
                    onLockAdmin && (
                      <DropdownMenuItem
                        onClick={onLockAdmin}
                        className="text-amber-600 focus:text-amber-600 dark:text-amber-400 dark:focus:text-amber-400"
                      >
                        <Lock className="size-3.5" />
                        Lock Admin Console
                      </DropdownMenuItem>
                    )}

                  {onOpenAuth && (
                    <DropdownMenuItem onClick={() => onOpenAuth("signin")}>
                      <LogIn className="size-3.5" />
                      Switch Account / Sign In
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem
                    onClick={handleLogout}
                    variant="destructive"
                  >
                    <LogOut className="size-3.5" />
                    Sign Out & Return Home
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
    </TooltipProvider>
  );
};

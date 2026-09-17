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
import { getLogoForTheme } from "../../lib/themes";

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
          <div className="flex items-center gap-3 shrink-0">
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
              <div className="flex h-10 items-center justify-center  p-1 transition-transform group-hover:scale-105">
                <img src={getLogoForTheme(theme)} alt="Smart Data Hub Logo" className="h-8 w-auto object-contain" />
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

          {/* Center Search (Organized layout inspired by PublicNavbar) */}
          <div className="hidden flex-1 items-center justify-center max-w-sm mx-4 md:flex">
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenCommand}
                    className="flex h-9 w-full items-center justify-between gap-2 rounded-full bg-muted/40 px-3 text-xs text-muted-foreground hover:text-foreground"
                  />
                }
              >
                <div className="flex items-center gap-2">
                  <Search className="size-3.5 text-primary" />
                  <span>Search commands & services...</span>
                </div>

                <Kbd className="h-5 px-1.5 text-[10px]">⌘K</Kbd>
              </TooltipTrigger>

              <TooltipContent>Search or jump to service</TooltipContent>
            </Tooltip>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
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
                    className="flex h-9 items-center gap-1.5 rounded-full border-border/80 px-2 shadow-2xs transition-all hover:bg-muted/60 cursor-pointer"
                    title={profileName}
                    aria-label="User profile menu"
                  />
                }
              >
                <div className="relative flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-black text-primary">
                  <span>{profileInitials}</span>
                  <span className="absolute -bottom-0.5 -right-0.5 flex size-2">
                    <span className="size-2 rounded-full bg-emerald-500 ring-2 ring-card" />
                  </span>
                </div>

                <ChevronDown className="size-3.5 text-muted-foreground" />
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="w-64 rounded-xl border-border p-2 shadow-xl"
              >
                {/* Profile Header */}
                <div className="flex items-center gap-3 p-2">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-black uppercase text-primary">
                    {profileInitials}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-foreground">
                      {profileName}
                    </p>
                    <p className="truncate font-mono text-[11px] text-muted-foreground">
                      {user?.phone || "024 419 2834"}
                    </p>
                    <Badge
                      variant="outline"
                      className="mt-1 border-emerald-500/30 bg-emerald-500/10 py-0 text-[9px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400"
                    >
                      ● Verified {user?.role || currentRole}
                    </Badge>
                  </div>
                </div>

                <DropdownMenuSeparator className="my-1.5" />

                {/* Workspace */}
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Switch Workspace Mode
                  </DropdownMenuLabel>

                  <DropdownMenuItem
                    onClick={() => onRoleChange("customer")}
                    className={`cursor-pointer gap-2.5 rounded-lg text-xs font-semibold ${currentRole === "customer"
                      ? "bg-primary/10 font-bold text-primary"
                      : ""
                      }`}
                  >
                    Customer Dashboard
                    {currentRole === "customer" && (
                      <Check className="ml-auto size-3.5" />
                    )}
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => onRoleChange("agent")}
                    className={`cursor-pointer gap-2.5 rounded-lg text-xs font-semibold ${currentRole === "agent"
                      ? "bg-primary/10 font-bold text-primary"
                      : ""
                      }`}
                  >
                    Agent Workspace
                    {currentRole === "agent" && (
                      <Check className="ml-auto size-3.5" />
                    )}
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => onRoleChange("admin")}
                    className={`cursor-pointer gap-2.5 rounded-lg text-xs font-semibold ${currentRole === "admin"
                      ? "bg-primary/10 font-bold text-primary"
                      : ""
                      }`}
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
                    className={`cursor-pointer gap-2.5 rounded-lg text-xs font-semibold ${currentRole === "storefront"
                      ? "bg-primary/10 font-bold text-primary"
                      : ""
                      }`}
                  >
                    Kofi Telecom Storefront
                    {currentRole === "storefront" && (
                      <Check className="ml-auto size-3.5" />
                    )}
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => onRoleChange("public")}
                    className={`cursor-pointer gap-2.5 rounded-lg text-xs font-semibold ${currentRole === "public"
                      ? "bg-primary/10 font-bold text-primary"
                      : ""
                      }`}
                  >
                    Public Marketing Site
                    {currentRole === "public" && (
                      <Check className="ml-auto size-3.5" />
                    )}
                  </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator className="my-1.5" />

                {/* Account Actions */}
                <DropdownMenuGroup>
                  {onOpenSecurityPins && (
                    <DropdownMenuItem
                      onClick={onOpenSecurityPins}
                      className="cursor-pointer gap-2.5 rounded-lg text-xs font-medium"
                    >
                      <KeyRound className="size-3.5 text-primary" />
                      Security PINs Reference Sheet
                    </DropdownMenuItem>
                  )}

                  {currentRole === "admin" &&
                    isAdminUnlocked &&
                    onLockAdmin && (
                      <DropdownMenuItem
                        onClick={onLockAdmin}
                        className="cursor-pointer gap-2.5 rounded-lg text-xs font-medium text-amber-600 focus:text-amber-600 dark:text-amber-400 dark:focus:text-amber-400"
                      >
                        <Lock className="size-3.5" />
                        Lock Admin Console
                      </DropdownMenuItem>
                    )}

                  {onOpenAuth && (
                    <DropdownMenuItem
                      onClick={() => onOpenAuth("signin")}
                      className="cursor-pointer gap-2.5 rounded-lg text-xs font-medium"
                    >
                      <LogIn className="size-3.5 text-primary" />
                      Switch Account / Sign In
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem
                    onClick={handleLogout}
                    variant="destructive"
                    className="cursor-pointer gap-2.5 rounded-lg text-xs font-semibold text-destructive focus:bg-destructive/10"
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

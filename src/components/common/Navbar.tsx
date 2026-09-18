import React, { useState } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  Circle,
  Info,
  KeyRound,
  Lock,
  LogIn,
  LogOut,
  Menu,
  Palette,
  Radio,
  Search,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Trash2,
  Wallet,
  X,
  Zap,
} from "lucide-react";

import { cn } from "cn";
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
import { ScrollArea } from "../ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "../ui/popover";
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

export interface NavbarNotificationItem {
  id: string;
  title: string;
  description: string;
  type: "orders" | "wallet" | "gateway" | "promo" | "system";
  timestamp: string;
  read: boolean;
}

const INITIAL_NOTIFICATIONS: NavbarNotificationItem[] = [
  {
    id: "ntf-1",
    title: "5GB Non-Expiry Bundle Delivered",
    description: "Order SDH-GH-2026-94812 was processed successfully to 0244192834.",
    type: "orders",
    timestamp: "10m ago",
    read: false,
  },
  {
    id: "ntf-2",
    title: "MTN Gateway Maintenance Scheduled",
    description: "MTN core node upgrade will take place between 02:00 GMT and 04:00 GMT.",
    type: "gateway",
    timestamp: "45m ago",
    read: false,
  },
  {
    id: "ntf-3",
    title: "Wallet Top-up Confirmed",
    description: "GH₵ 100.00 credited via MTN Mobile Money. New wallet balance: GH₵ 179.00.",
    type: "wallet",
    timestamp: "2h ago",
    read: true,
  },
  {
    id: "ntf-4",
    title: "Telecel Extra Data Promotion",
    description: "Get up to 10% bonus data volume on all Telecel packages purchased this weekend.",
    type: "promo",
    timestamp: "1d ago",
    read: true,
  },
  {
    id: "ntf-5",
    title: "Tier Margin Bonus Credited",
    description: "Gold Tier performance bonus of GH₵ 45.00 added to your account.",
    type: "system",
    timestamp: "2d ago",
    read: true,
  },
];

const typeIcons: Record<string, React.ElementType> = {
  orders: ShoppingBag,
  wallet: Wallet,
  gateway: Radio,
  promo: Zap,
  system: Info,
};

const typeStyles: Record<string, string> = {
  orders: "border-primary/25 bg-primary/10 text-primary",
  wallet: "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  gateway: "border-blue-500/25 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  promo: "border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  system: "border-border bg-muted/60 text-muted-foreground",
};

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
  const [notifications, setNotifications] = useState<NavbarNotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const localUnreadCount = notifications.filter((n) => !n.read).length;
  const activeUnreadBadge = unreadCount > 0 ? unreadCount : localUnreadCount;

  const markRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

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

            {/* Notifications Popover */}
            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
              <PopoverTrigger
                render={
                  <Button
                    variant="outline"
                    size="icon"
                    className="relative rounded-full cursor-pointer"
                    aria-label="Open notifications"
                  />
                }
              >
                <Bell className="size-4" />

                {activeUnreadBadge > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full p-0 text-[9px]"
                  >
                    {activeUnreadBadge > 99 ? "99+" : activeUnreadBadge}
                  </Badge>
                )}
              </PopoverTrigger>

              <PopoverContent
                align="end"
                className="w-[380px] overflow-hidden rounded-2xl border-border/80 bg-popover p-0 shadow-2xl"
              >
                <PopoverHeader className="gap-3 border-b border-border/70 bg-muted/20 p-3.5 shadow-2xs">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary">
                        <Bell className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <PopoverTitle className="text-sm font-extrabold text-foreground">
                          Notifications
                        </PopoverTitle>
                        <div className="truncate text-[11px] text-muted-foreground">
                          Orders, wallet, gateway &amp; system activity
                        </div>
                      </div>
                    </div>
                    {notifications.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={markAllRead}
                          disabled={localUnreadCount === 0}
                          aria-label="Mark all read"
                          title="Mark all read"
                          className="size-7 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          <CheckCheck className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={clearAll}
                          disabled={notifications.length === 0}
                          aria-label="Clear notifications"
                          title="Clear all notifications"
                          className="size-7 rounded-lg text-muted-foreground hover:text-destructive cursor-pointer"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    <span className="rounded-full border border-border/70 bg-background/60 px-2 py-0.5">
                      {notifications.length} total
                    </span>
                    <span className="rounded-full border border-border/70 bg-background/60 px-2 py-0.5">
                      {localUnreadCount > 0 ? `${localUnreadCount} unread` : "All read"}
                    </span>
                  </div>
                </PopoverHeader>

                {notifications.length > 0 ? (
                  <ScrollArea className="h-[340px]">
                    <div className="space-y-1.5 p-2">
                      {notifications.map((notification) => {
                        const IconComponent = typeIcons[notification.type] || Info;
                        const iconStyle = typeStyles[notification.type] || typeStyles.system;

                        return (
                          <button
                            key={notification.id}
                            type="button"
                            onClick={() => markRead(notification.id)}
                            className={cn(
                              "group flex w-full gap-3 rounded-xl border p-2.5 text-left transition-all cursor-pointer",
                              notification.read
                                ? "border-transparent bg-transparent hover:bg-muted/40 shadow-none"
                                : "border-border bg-muted/30 hover:border-primary/40 hover:bg-muted/60"
                            )}
                          >
                            <div
                              className={cn(
                                "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border",
                                iconStyle
                              )}
                            >
                              <IconComponent className="size-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <div className="truncate text-xs font-bold text-foreground">
                                  {notification.title}
                                </div>
                                {!notification.read && (
                                  <Circle className="mt-1 size-2 shrink-0 fill-primary text-primary" />
                                )}
                              </div>
                              <div className="line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                                {notification.description}
                              </div>
                              <div className="mt-1 flex items-center gap-2 text-[9px] font-bold uppercase tracking-wider text-muted-foreground/70">
                                <span className="capitalize">{notification.type}</span>
                                <span className="size-1 rounded-full bg-muted-foreground/30" />
                                <span>{notification.timestamp}</span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                    <div className="flex size-10 items-center justify-center rounded-xl border border-border bg-muted/40 text-muted-foreground">
                      <Sparkles className="size-5 text-primary" />
                    </div>
                    <div className="text-xs font-bold text-foreground">No notifications</div>
                    <div className="text-[11px] text-muted-foreground max-w-[220px]">
                      Orders, security alerts, and system broadcast events will appear here.
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-border bg-muted/30 p-2.5 px-3">
                  <span className="text-[10px] text-muted-foreground">
                    Click item to mark read
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsPopoverOpen(false);
                      onOpenNotifications?.();
                    }}
                    className="h-7 gap-1 px-3 text-xs font-extrabold text-primary hover:text-primary hover:bg-primary/10 rounded-full cursor-pointer"
                  >
                    <span>See all notifications</span>
                    <ChevronRight className="size-3.5" />
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

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

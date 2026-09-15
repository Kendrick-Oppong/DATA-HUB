import React, { useEffect } from "react";
import {
  Sparkles,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { UserRole, UserAccount } from "../../types";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { ScrollArea } from "../ui/scroll-area";
import {
  CUSTOMER_NAV,
  AGENT_NAV,
  ADMIN_NAV,
  type NavItem,
  type NavGroup,
} from "./sidebar-nav";

export interface SidebarProps {
  currentRole: UserRole;
  activeTab: string;
  onSelectTab?: (tab: string) => void;
  onTabChange?: (tab: string) => void;
  unreadNotifications?: number;
  openComplaintsCount?: number;
  pendingPayoutsCount?: number;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  user?: UserAccount | null;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  onSignOut?: () => void;
  storeStatus?: "published" | "paused" | "draft";
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRole,
  activeTab,
  onSelectTab,
  onTabChange,
  unreadNotifications = 0,
  openComplaintsCount = 0,
  pendingPayoutsCount = 2,
  isCollapsed = false,
  onToggleCollapse,
  user,
  isMobileOpen = false,
  onCloseMobile,
  onSignOut,
  storeStatus = "published",
}) => {
  // Hide on public and storefront
  if (currentRole === "public" || currentRole === "storefront") return null;

  const select = (id: string) => {
    onSelectTab?.(id);
    onTabChange?.(id);
    if (isMobileOpen && onCloseMobile) {
      onCloseMobile();
    }
  };

  // Close mobile drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMobileOpen && onCloseMobile) {
        onCloseMobile();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileOpen, onCloseMobile]);

  // Compute initials
  const getInitials = (name?: string, role?: UserRole) => {
    if (name) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2)
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      if (parts.length === 1 && parts[0].length > 0)
        return parts[0].substring(0, 2).toUpperCase();
    }
    if (role === "admin") return "AD";
    if (role === "agent") return "KO";
    return "KM";
  };

  const profileInitials = getInitials(user?.name, currentRole);
  const profileName =
    user?.name ||
    (currentRole === "admin"
      ? "NOC Super Admin"
      : currentRole === "agent"
        ? "Kofi Owusu"
        : "Kojo Mensah");
  const profileEmail =
    user?.email ||
    (currentRole === "admin"
      ? "noc.admin@smartdatahub.gh"
      : currentRole === "agent"
        ? "kofitelecom@gmail.com"
        : "kojomensah94@gmail.com");

  // Get navigation groups based on role
  const groups: NavGroup[] =
    currentRole === "customer"
      ? CUSTOMER_NAV
      : currentRole === "agent"
        ? AGENT_NAV
        : ADMIN_NAV;

  // Update counts dynamically
  const groupsWithCounts = groups.map((group) => ({
    ...group,
    items: group.items.map((item) => {
      if (item.id === "notifications") {
        return { ...item, count: unreadNotifications };
      }
      if (item.id === "complaints") {
        return { ...item, count: openComplaintsCount };
      }
      if (item.id === "settlement") {
        return { ...item, count: pendingPayoutsCount };
      }
      return item;
    }),
  }));

  const roleLabel =
    currentRole === "admin"
      ? "NOC Admin"
      : currentRole === "agent"
        ? "Agent Portal"
        : "Customer Account";

  // Shared Navigation list renderer
  const renderNavItems = (collapsed = false) => (
    <div className="flex flex-col gap-4">
      {groupsWithCounts.map((group) => (
        <section key={group.group} className="flex flex-col gap-1">
          <h2
            className={`${
              collapsed ? "sr-only" : ""
            } px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground`}
          >
            {group.group}
          </h2>
          {group.items.map((item) => {
            const Icon = item.icon;
            const active =
              activeTab === item.id || item.altIds?.includes(activeTab);

            if (collapsed) {
              return (
                <Tooltip key={item.id}>
                  <TooltipTrigger
                    render={
                      <Button
                        variant={active ? "default" : "ghost"}
                        size="sm"
                        onClick={() => select(item.id)}
                        aria-label={item.label}
                        className="w-full justify-center px-0 h-10"
                      >
                        <Icon className="size-4 text-white" />
                      </Button>
                    }
                  />
                  <TooltipContent side="right">
                    <div className="flex items-center gap-1.5 font-medium">
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="rounded-sm bg-primary/20 px-1 py-0.2 text-[9px] text-primary">
                          {item.id === "my-store" && storeStatus !== "published"
                            ? "Offline"
                            : item.badge}
                        </span>
                      )}
                      {item.count ? (
                        <span className="rounded-full bg-destructive px-1.5 py-0.2 text-[9px] text-destructive-foreground">
                          {item.count}
                        </span>
                      ) : null}
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            }

            return (
              <Button
                key={item.id}
                variant={active ? "default" : "ghost"}
                size="sm"
                onClick={() => select(item.id)}
                aria-label={item.label}
                className="w-full justify-start h-9 font-medium"
              >
                <Icon
                  data-icon="inline-start"
                  className={`size-4 shrink-0 ${active ? "text-white" : ""}`}
                />
                <span className={`truncate ${active ? "text-white" : ""}`}>
                  {item.label}
                </span>
                {item.badge && (
                  <Badge
                    variant="secondary"
                    className="ml-auto text-[10px] px-1.5 py-0"
                  >
                    {item.id === "my-store" && storeStatus !== "published"
                      ? "Offline"
                      : item.badge}
                  </Badge>
                )}
                {item.count ? (
                  <Badge
                    variant="destructive"
                    className="ml-auto text-[10px] px-1.5 py-0"
                  >
                    {item.count}
                  </Badge>
                ) : null}
              </Button>
            );
          })}
        </section>
      ))}
    </div>
  );

  // Profile Footer Button Component
  const renderProfileFooter = (collapsed = false) => {
    const isProfileActive = activeTab === "profile";

    if (collapsed) {
      return (
        <div className="border-t border-border/70 p-2 flex flex-col gap-2 shrink-0">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => select("profile")}
                  aria-label="Profile, Security & Preferences"
                  className={`relative flex size-10 items-center justify-center rounded-full transition-all cursor-pointer ${
                    isProfileActive
                      ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background font-bold shadow-sm"
                      : "bg-primary/10 text-primary hover:bg-primary/20 font-bold border border-primary/20"
                  }`}
                >
                  <span className="text-xs font-black">{profileInitials}</span>
                  <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-emerald-500 ring-2 ring-card" />
                </Button>
              }
            />
            <TooltipContent side="right">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-foreground">
                  {profileName}
                </p>
                <p className="text-[10px] text-foreground">{profileEmail}</p>
              </div>
            </TooltipContent>
          </Tooltip>
          {onSignOut && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onSignOut}
                    aria-label="Sign Out"
                    className="flex size-10 items-center justify-center rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer"
                  >
                    <LogOut className="size-4" />
                  </Button>
                }
              />
              <TooltipContent side="right">
                <p className="text-xs font-bold text-foreground">Sign Out</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      );
    }

    return (
      <div className="border-t border-border/70 p-2.5 bg-muted/20 shrink-0">
        <Button
          variant="ghost"
          onClick={() => select("profile")}
          className={`group flex w-full h-auto items-center justify-start gap-3  border p-2 text-left transition-all duration-150 cursor-pointer mb-2 ${
            isProfileActive
              ? "border-primary/40 bg-primary/10 text-primary shadow-xs ring-1 ring-primary/20"
              : "border-transparent hover:border-border/80 hover:bg-card/90 text-foreground"
          }`}
        >
          {/* Avatar with initials & online status badge */}
          <div className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-black ring-1 ring-primary/30 transition-transform group-hover:scale-105">
            <span className="text-xs tracking-tight">{profileInitials}</span>
            <span
              className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-emerald-500 ring-2 ring-card shadow-xs"
              title="Verified & Active"
            />
          </div>

          {/* User details */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <span className="truncate text-xs font-bold text-foreground tracking-tight group-hover:text-primary transition-colors">
                {profileName}
              </span>
              {user?.isKycVerified !== false && (
                <span title="Ghana Card Verified">
                  <ShieldCheck className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                </span>
              )}
            </div>
            <p className="truncate text-[11px] text-foreground leading-tight">
              {profileEmail}
            </p>
          </div>

          {/* Action indicator */}
          <ChevronRight
            className={`size-4 shrink-0 transition-transform duration-200 ${
              isProfileActive
                ? "text-primary translate-x-0.5"
                : "text-muted-foreground/60 group-hover:text-foreground group-hover:translate-x-0.5"
            }`}
          />
        </Button>
        {onSignOut && (
          <Button
            variant="ghost"
            onClick={onSignOut}
            className="group flex w-full h-auto items-center justify-start gap-3  border border-transparent p-2 text-left transition-all duration-150 cursor-pointer hover:border-destructive/30 hover:bg-destructive/5 text-muted-foreground hover:text-destructive"
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted/50 group-hover:bg-destructive/10 transition-colors">
              <LogOut className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-semibold group-hover:text-destructive transition-colors">
                Sign Out
              </span>
            </div>
          </Button>
        )}
      </div>
    );
  };

  return (
    <TooltipProvider>
      {/* ============================================================ */}
      {/* 1. DESKTOP PERSISTENT SIDEBAR (Hidden on mobile < md)          */}
      {/* ============================================================ */}
      <aside
        className={`hidden md:flex fixed top-16 bottom-0 left-0 z-30 flex-col border-r border-border bg-card/95 backdrop-blur-xs transition-[width] duration-300 ease-in-out ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        {/* Top Role Header */}
        <div
          className={`flex h-14 items-center border-b border-border/70 px-4 shrink-0 ${
            isCollapsed ? "justify-center" : "justify-between"
          }`}
        >
          <div className="flex items-center gap-2">
            <span
              className={`${
                isCollapsed ? "sr-only" : ""
              } text-xs font-extrabold uppercase tracking-wider text-muted-foreground`}
            >
              {roleLabel}
            </span>
          </div>

          {onToggleCollapse && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onToggleCollapse}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="text-muted-foreground hover:text-foreground"
            >
              {isCollapsed ? (
                <PanelLeftOpen className="size-4" />
              ) : (
                <PanelLeftClose className="size-4" />
              )}
            </Button>
          )}
        </div>

        {/* Middle Scrollable Nav with ScrollArea */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-3 space-y-4">
            {renderNavItems(isCollapsed)}

            {/* Reseller Callout for Customers */}
            {!isCollapsed && currentRole === "customer" && (
              <div className="mt-2 flex flex-col gap-2 rounded-2xl border border-primary/20 bg-primary/5 p-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <Sparkles className="size-3.5 text-primary shrink-0" />
                  <span>Sell data in Ghana</span>
                </div>
                <p className="text-[11px] leading-snug text-muted-foreground">
                  Launch a branded store & earn commissions on every delivery.
                </p>
                <Button
                  variant="link"
                  size="sm"
                  className="justify-start px-0 text-xs font-semibold text-primary h-auto hover:no-underline"
                  onClick={() => select("guides")}
                >
                  Learn more
                  <ChevronRight className="size-3 ml-0.5" />
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* BOTTOM PROFILE & SECURITY SECTION */}
        {renderProfileFooter(isCollapsed)}
      </aside>

      {/* ============================================================ */}
      {/* 2. MOBILE RESPONSIVE SHEET DRAWER (shadcn-like slide-in)     */}
      {/* ============================================================ */}
      <AnimatePresence>
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onCloseMobile}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              aria-hidden="true"
            />

            {/* Slide-over sheet panel */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 27, stiffness: 300 }}
              className="relative z-50 flex h-full w-72 max-w-[85vw] flex-col border-r border-border bg-card shadow-2xl"
            >
              {/* Sheet Header */}
              <div className="flex h-16 items-center justify-between border-b border-border px-4 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-9 items-center justify-center rounded-full bg-primary text-xs font-black text-primary-foreground shadow-xs">
                    SDH
                  </div>
                  <div>
                    <h2 className="text-sm font-extrabold tracking-tight text-foreground">
                      Smart Data Hub
                    </h2>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                      {roleLabel}
                    </span>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={onCloseMobile}
                  aria-label="Close navigation sheet"
                  className="rounded-full text-muted-foreground hover:text-foreground"
                >
                  <X className="size-5" />
                </Button>
              </div>

              {/* Sheet Scrollable Navigation with ScrollArea */}
              <ScrollArea className="flex-1 min-h-0">
                <div className="p-3.5 space-y-4">
                  {renderNavItems(false)}

                  {/* Reseller Callout for Customers */}
                  {currentRole === "customer" && (
                    <div className="mt-2 flex flex-col gap-2 rounded-2xl border border-primary/20 bg-primary/5 p-3">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                        <Sparkles className="size-3.5 text-primary shrink-0" />
                        <span>Sell data in Ghana</span>
                      </div>
                      <p className="text-[11px] leading-snug text-muted-foreground">
                        Launch a branded store & earn commissions on every
                        delivery.
                      </p>
                      <Button
                        variant="link"
                        size="sm"
                        className="justify-start px-0 text-xs font-semibold text-primary h-auto hover:no-underline"
                        onClick={() => select("guides")}
                      >
                        Learn more
                        <ChevronRight className="size-3 ml-0.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Sheet Bottom Profile Footer */}
              {renderProfileFooter(false)}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </TooltipProvider>
  );
};

export default Sidebar;

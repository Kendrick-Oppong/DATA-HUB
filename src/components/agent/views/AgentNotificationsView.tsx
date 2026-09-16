import React, { useMemo, useState } from "react";
import {
  Bell,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  Megaphone,
  Radio,
  ShoppingBag,
  Trash2,
  Wallet,
  Zap,
  TrendingUp,
  ShieldCheck,
  Store,
} from "lucide-react";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";

type NotificationCategory =
  | "gateway"
  | "orders"
  | "wallet"
  | "promo"
  | "tier"
  | "store";

interface Notification {
  id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  date: string;
  ref?: string;
  read: boolean;
}

const CATEGORY_CONFIG: Record<
  NotificationCategory,
  {
    label: string;
    icon: React.ElementType;
    iconClass: string;
    iconBg: string;
    badgeClass: string;
  }
> = {
  gateway: {
    label: "Gateway",
    icon: Radio,
    iconClass: "text-blue-600 dark:text-blue-400",
    iconBg: "bg-blue-500/10",
    badgeClass:
      "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-400",
  },
  orders: {
    label: "Orders",
    icon: ShoppingBag,
    iconClass: "text-primary",
    iconBg: "bg-primary/10",
    badgeClass:
      "border-primary/20 bg-primary/10 text-primary",
  },
  wallet: {
    label: "Wallet",
    icon: Wallet,
    iconClass: "text-emerald-600 dark:text-emerald-400",
    iconBg: "bg-emerald-500/10",
    badgeClass:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
  promo: {
    label: "Promotion",
    icon: Zap,
    iconClass: "text-amber-600 dark:text-amber-400",
    iconBg: "bg-amber-500/10",
    badgeClass:
      "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  tier: {
    label: "Tier",
    icon: TrendingUp,
    iconClass: "text-purple-600 dark:text-purple-400",
    iconBg: "bg-purple-500/10",
    badgeClass:
      "border-purple-500/20 bg-purple-500/10 text-purple-700 dark:text-purple-400",
  },
  store: {
    label: "Store",
    icon: Store,
    iconClass: "text-teal-600 dark:text-teal-400",
    iconBg: "bg-teal-500/10",
    badgeClass:
      "border-teal-500/20 bg-teal-500/10 text-teal-700 dark:text-teal-400",
  },
};

export const AgentNotificationsView: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "ntf-1",
      title: "Commission Payout Processed",
      message:
        "GH₵ 420.00 has been credited to your MTN Mobile Money wallet. Reference: SDH-WITH-2026-94812.",
      category: "wallet",
      date: "2026-09-11 08:30",
      ref: "SDH-WITH-2026-94812",
      read: false,
    },
    {
      id: "ntf-2",
      title: "Tier Upgrade: Tier 3 Platinum",
      message:
        "Congratulations! You've reached 2000 points and are now eligible for 50% margin on all orders.",
      category: "tier",
      date: "2026-09-11 15:42",
      read: false,
    },
    {
      id: "ntf-3",
      title: "New Storefront Order",
      message:
        "Order SDH-GH-2026-94813 for MTN 10GB Non-Expiry placed via your public store link. Margin: +GH₵ 4.50.",
      category: "orders",
      date: "2026-09-11 14:20",
      ref: "SDH-GH-2026-94813",
      read: false,
    },
    {
      id: "ntf-4",
      title: "MTN Gateway Maintenance Scheduled",
      message:
        "MTN core node upgrade will take place between 02:00 GMT and 04:00 GMT. Delays may occur during this window.",
      category: "gateway",
      date: "2026-09-10 12:00",
      read: true,
    },
    {
      id: "ntf-5",
      title: "Store Performance Bonus",
      message:
        "Your store achieved 96/100 health score this month. You've earned a GH₵ 50 bonus for excellent performance.",
      category: "store",
      date: "2026-09-09 09:15",
      read: true,
    },
    {
      id: "ntf-6",
      title: "Special Tariff: Telecel Extra Data",
      message:
        "Get up to 10% bonus data volume on all Telecel packages purchased this weekend. Pass savings to customers!",
      category: "promo",
      date: "2026-09-08 16:30",
      read: true,
    },
  ]);

  const [notificationCategory, setNotificationCategory] =
    useState<string>("all");

  const filteredNotifications = useMemo(() => {
    return notifications.filter(
      (notification) =>
        notificationCategory === "all" ||
        notification.category === notificationCategory,
    );
  }, [notifications, notificationCategory]);

  const unreadCount = notifications.filter(
    (notification) => !notification.read,
  ).length;

  const markAsRead = (id: string) => {
    setNotifications((previous) =>
      previous.map((notification) =>
        notification.id === id
          ? { ...notification, read: true }
          : notification,
      ),
    );
  };

  const markAllAsRead = () => {
    setNotifications((previous) =>
      previous.map((notification) => ({
        ...notification,
        read: true,
      })),
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <div className="space-y-6">
      {/* ============================================================
          HEADER
          ============================================================ */}

      <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Bell className="size-5" />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
                Notifications
              </h1>

              {unreadCount > 0 && (
                <Badge
                  variant="outline"
                  className="border-primary/20 bg-primary/10 text-[10px] font-bold text-primary"
                >
                  {unreadCount} unread
                </Badge>
              )}
            </div>

            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
              Commission payouts, tier progress, store orders, gateway updates,
              and promotional offers for your reseller business.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              className="h-8 text-xs font-semibold"
            >
              <Check className="size-3.5 text-emerald-500" />
              Mark all read
            </Button>
          )}

          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={clearNotifications}
              className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              title="Clear notifications"
              aria-label="Clear notifications"
            >
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>
      </div>

      {/* ============================================================
          SUMMARY STRIP
          ============================================================ */}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-3.5">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-muted">
              <Bell className="size-3.5 text-muted-foreground" />
            </div>

            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Total
            </span>
          </div>

          <p className="mt-2 text-lg font-black tabular-nums text-foreground">
            {notifications.length}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-3.5">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
              <Bell className="size-3.5 text-primary" />
            </div>

            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Unread
            </span>
          </div>

          <p className="mt-2 text-lg font-black tabular-nums text-foreground">
            {unreadCount}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-3.5">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10">
              <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>

            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Read
            </span>
          </div>

          <p className="mt-2 text-lg font-black tabular-nums text-foreground">
            {notifications.length - unreadCount}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-3.5">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-purple-500/10">
              <TrendingUp className="size-3.5 text-purple-600 dark:text-purple-400" />
            </div>

            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Tier Updates
            </span>
          </div>

          <p className="mt-2 text-lg font-black tabular-nums text-foreground">
            {
              notifications.filter(
                (notification) => notification.category === "tier",
              ).length
            }
          </p>
        </div>
      </div>

      {/* ============================================================
          FILTERS
          ============================================================ */}

      <div className="rounded-xl border border-border bg-muted/20 p-3">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Filter notifications
          </span>

          <span className="text-[11px] text-muted-foreground">
            <span className="font-semibold text-foreground">
              {filteredNotifications.length}
            </span>{" "}
            {filteredNotifications.length === 1
              ? "notification"
              : "notifications"}
          </span>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-0.5">
          {[
            {
              value: "all",
              label: "All",
              count: notifications.length,
              icon: Bell,
            },
            {
              value: "orders",
              label: "Orders",
              count: notifications.filter(
                (notification) => notification.category === "orders",
              ).length,
              icon: ShoppingBag,
            },
            {
              value: "wallet",
              label: "Wallet",
              count: notifications.filter(
                (notification) => notification.category === "wallet",
              ).length,
              icon: Wallet,
            },
            {
              value: "tier",
              label: "Tier",
              count: notifications.filter(
                (notification) => notification.category === "tier",
              ).length,
              icon: TrendingUp,
            },
            {
              value: "gateway",
              label: "Gateway",
              count: notifications.filter(
                (notification) => notification.category === "gateway",
              ).length,
              icon: Radio,
            },
            {
              value: "store",
              label: "Store",
              count: notifications.filter(
                (notification) => notification.category === "store",
              ).length,
              icon: Store,
            },
            {
              value: "promo",
              label: "Promotions",
              count: notifications.filter(
                (notification) => notification.category === "promo",
              ).length,
              icon: Zap,
            },
          ].map((category) => {
            const Icon = category.icon;
            const active = notificationCategory === category.value;

            return (
              <Button
                key={category.value}
                type="button"
                variant={active ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  setNotificationCategory(category.value)
                }
                className="h-8 shrink-0 gap-1.5 text-[11px] font-semibold"
              >
                <Icon className="size-3.5" />

                {category.label}

                <span
                  className={`ml-0.5 tabular-nums ${
                    active
                      ? "text-primary-foreground/70"
                      : "text-muted-foreground"
                  }`}
                >
                  {category.count}
                </span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* ============================================================
          NOTIFICATION FEED
          ============================================================ */}

      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card px-6 py-14 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <Bell className="size-5" />
            </div>

            <h3 className="mt-4 text-sm font-bold text-foreground">
              No notifications here
            </h3>

            <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
              {notifications.length === 0
                ? "You're completely up to date. New activity will appear here."
                : "There are no notifications in the selected category."}
            </p>

            {notificationCategory !== "all" &&
              notifications.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNotificationCategory("all")}
                  className="mt-4 h-8 text-xs"
                >
                  View all notifications
                </Button>
              )}
          </div>
        ) : (
          filteredNotifications.map((item) => {
            const config = CATEGORY_CONFIG[item.category];
            const Icon = config.icon;

            return (
              <article
                key={item.id}
                className={`
                  group relative overflow-hidden rounded-2xl border bg-card
                  transition-all duration-200
                  ${
                    item.read
                      ? "border-border"
                      : "border-primary/30 bg-primary/[0.025] shadow-xs ring-1 ring-primary/10"
                  }
                `}
              >
                {/* Unread indicator */}
                {!item.read && (
                  <div className="absolute inset-y-0 left-0 w-0.5 bg-primary" />
                )}

                <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:p-5">
                  {/* Category icon */}
                  <div
                    className={`
                      flex size-10 shrink-0 items-center justify-center
                      rounded-xl ${config.iconBg} ${config.iconClass}
                    `}
                  >
                    <Icon className="size-5" />
                  </div>

                  {/* Main content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          {!item.read && (
                            <span
                              className="size-1.5 shrink-0 rounded-full bg-primary"
                              aria-label="Unread"
                            />
                          )}

                          <h2
                            className={`text-sm leading-snug ${
                              item.read
                                ? "font-bold text-foreground"
                                : "font-extrabold text-foreground"
                            }`}
                          >
                            {item.title}
                          </h2>

                          <Badge
                            variant="outline"
                            className={`text-[9px] font-bold uppercase tracking-wide ${config.badgeClass}`}
                          >
                            {config.label}
                          </Badge>
                        </div>
                      </div>

                      {!item.read && (
                        <span className="hidden shrink-0 text-[9px] font-bold uppercase tracking-wider text-primary sm:block">
                          New
                        </span>
                      )}
                    </div>

                    <p className="mt-2 max-w-3xl text-xs leading-relaxed text-muted-foreground">
                      {item.message}
                    </p>

                    {/* Metadata */}
                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[10px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="size-3" />
                        <span className="tabular-nums">{item.date}</span>
                      </span>

                      {item.ref && (
                        <>
                          <span className="text-border">•</span>

                          <span className="inline-flex items-center gap-1.5">
                            <CreditCard className="size-3" />

                            <span className="font-mono font-medium">
                              {item.ref}
                            </span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Action */}
                  {!item.read && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => markAsRead(item.id)}
                      className="h-8 shrink-0 self-start text-[11px] font-semibold sm:self-center"
                    >
                      <Check className="size-3.5 text-emerald-500" />
                      Mark as read
                    </Button>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
};

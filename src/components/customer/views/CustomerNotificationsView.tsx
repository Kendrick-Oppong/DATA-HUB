import React, { useState } from "react";
import { Bell, Check, Trash2, Clock } from "lucide-react";
import { Button } from "../../ui/button";

export const CustomerNotificationsView: React.FC = () => {
  const [notifications, setNotifications] = useState([
    {
      id: "ntf-1",
      title: "MTN Gateway Maintenance Scheduled",
      message:
        "MTN core node upgrade will take place between 02:00 GMT and 04:00 GMT. Delays may occur during this window.",
      category: "gateway",
      date: "2026-09-11 08:30",
      read: false,
    },
    {
      id: "ntf-2",
      title: "5GB Non-Expiry Bundle Delivered",
      message:
        "Order SDH-GH-2026-94812 was processed successfully to 0244192834.",
      category: "orders",
      date: "2026-09-11 15:42",
      ref: "SDH-GH-2026-94812",
      read: false,
    },
    {
      id: "ntf-3",
      title: "Wallet Top-up Confirmed",
      message:
        "GH₵ 100.00 credited via MTN Mobile Money. New wallet balance: GH₵ 179.00.",
      category: "wallet",
      date: "2026-09-10 12:00",
      read: true,
    },
    {
      id: "ntf-4",
      title: "Special Tariff: Telecel Extra Data",
      message:
        "Get up to 10% bonus data volume on all Telecel packages purchased this weekend.",
      category: "promo",
      date: "2026-09-09 09:15",
      read: true,
    },
  ]);

  const [notificationCategory, setNotificationCategory] =
    useState<string>("all");

  const filteredNotifications = notifications.filter(
    (notification) =>
      notificationCategory === "all" ||
      notification.category === notificationCategory,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-3 border-b border-border pb-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-foreground">
            <Bell className="size-6 text-primary" />
            <span>Notifications & System Dispatches</span>
          </h1>

          <p className="mt-0.5 text-xs text-muted-foreground">
            Real-time carrier delivery confirmations, gateway updates, and promotional tariffs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setNotifications((previous) =>
                previous.map((notification) => ({
                  ...notification,
                  read: true,
                })),
              )
            }
            className="text-xs font-semibold cursor-pointer"
          >
            <Check className="mr-1 size-3.5 text-emerald-500" />
            Mark All Read
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setNotifications([])}
            className="text-muted-foreground hover:text-destructive cursor-pointer"
            title="Clear notifications"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {["all", "orders", "gateway", "wallet", "promo"].map((category) => (
          <Button
            key={category}
            variant={
              notificationCategory === category ? "default" : "outline"
            }
            size="sm"
            onClick={() => setNotificationCategory(category)}
            className="text-[11px] font-bold uppercase tracking-wide cursor-pointer"
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Notifications Feed */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="space-y-2 rounded-3xl border border-border bg-card p-12 text-center">
            <Bell className="mx-auto size-8 text-muted-foreground opacity-40" />

            <p className="text-sm font-bold text-foreground">
              No notifications in this category
            </p>

            <p className="text-xs text-muted-foreground">
              You are completely up to date.
            </p>
          </div>
        ) : (
          filteredNotifications.map((item) => (
            <div
              key={item.id}
              className={`flex flex-col items-start justify-between gap-3 rounded-2xl border bg-card p-5 shadow-2xs transition-all sm:flex-row sm:items-center ${
                item.read
                  ? "border-border opacity-85"
                  : "border-primary/40 ring-1 ring-primary/20"
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {!item.read && (
                    <span className="size-2 rounded-full bg-primary" />
                  )}

                  <span className="text-sm font-extrabold text-foreground">
                    {item.title}
                  </span>

                  <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
                    {item.category}
                  </span>
                </div>

                <p className="text-xs leading-relaxed text-muted-foreground">
                  {item.message}
                </p>

                <div className="flex items-center gap-2 pt-1 text-[11px] text-muted-foreground">
                  <Clock className="size-3" />
                  <span>{item.date}</span>

                  {item.ref && (
                    <>
                      <span>•</span>
                      <span className="font-mono">{item.ref}</span>
                    </>
                  )}
                </div>
              </div>

              {!item.read && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setNotifications((previous) =>
                      previous.map((notification) =>
                        notification.id === item.id
                          ? { ...notification, read: true }
                          : notification,
                      ),
                    )
                  }
                  className="shrink-0 text-xs font-semibold cursor-pointer"
                >
                  Acknowledge
                </Button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

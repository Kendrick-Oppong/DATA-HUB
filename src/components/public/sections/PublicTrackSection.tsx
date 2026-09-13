import React from "react";
import { Search, ArrowRight, AlertCircle, Check } from "lucide-react";
import { Order, TelecomNetwork } from "../../../types";
import { SignalRail } from "../../common/SignalRail";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Separator } from "../../ui/separator";
import { NETWORK_ACCENT } from "../constants";

interface PublicTrackSectionProps {
  searchTrackInput: string;
  setSearchTrackInput: (val: string) => void;
  trackedOrder: Order | null;
  setTrackedOrder: (order: Order | null) => void;
  trackSearched: boolean;
  setTrackSearched: (searched: boolean) => void;
  orders: Order[];
  handleTrackSubmit: (e: React.FormEvent) => void;
}

export const PublicTrackSection: React.FC<PublicTrackSectionProps> = ({
  searchTrackInput,
  setSearchTrackInput,
  trackedOrder,
  setTrackedOrder,
  trackSearched,
  setTrackSearched,
  orders,
  handleTrackSubmit,
}) => {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative isolate overflow-hidden border-b border-border bg-background">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,hsl(var(--primary)/0.10),transparent)]" />
        <div className="max-w-[95%] mx-auto px-4 sm:px-6 py-14 sm:py-20 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-bold text-primary uppercase tracking-wider mb-6">
            <Search className="size-3.5" />
            Live delivery control
          </div>
          <h1 className="text-5xl font-black leading-[0.95] tracking-tight text-foreground sm:text-6xl">
            Know where your
            <br />
            <span className="text-primary">order is.</span>
          </h1>
          <p className="mt-4 text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Use your order reference or mobile number to inspect the live
            dispatch trail — from MoMo authorization all the way to carrier
            delivery.
          </p>
        </div>
      </section>

      {/* Search + Results */}
      <section className="max-w-[95%] mx-auto px-4 sm:px-6 py-12 w-full">
        <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr]">
          {/* Search card */}
          <div className="rounded-2xl border border-border bg-card shadow-lg overflow-hidden">
            <div className="border-b border-border px-6 py-4 bg-muted/30">
              <p className="text-xs font-bold uppercase text-primary tracking-wider">
                Find an order
              </p>
              <h2 className="mt-0.5 text-xl font-black text-foreground">
                Enter your details
              </h2>
            </div>
            <div className="p-6 space-y-5">
              <form onSubmit={handleTrackSubmit} className="space-y-3">
                <Label
                  htmlFor="track-input"
                  className="text-xs font-bold text-muted-foreground"
                >
                  Reference or phone number
                </Label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="track-input"
                    required
                    placeholder="SDH-GH-2026-94812"
                    value={searchTrackInput}
                    onChange={(e) => setSearchTrackInput(e.target.value)}
                    className="pl-10 h-11"
                  />
                </div>
                <Button type="submit" className="w-full font-bold h-11">
                  Inspect delivery status <ArrowRight className="size-4" />
                </Button>
              </form>
              <Separator />
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-bold text-foreground">
                    Where to find your reference
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    Shown on your receipt and sent after a successful Mobile
                    Money payment.
                  </p>
                </div>
                {orders && orders.length > 0 && (
                  <div>
                    <span className="text-[11px] font-bold text-foreground block mb-2">
                      Or test with sample orders:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {orders.slice(0, 3).map((o) => (
                        <Button
                          key={o.id}
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 font-mono text-[10px] font-bold"
                          onClick={() => {
                            setSearchTrackInput(o.reference);
                            setTrackSearched(true);
                            setTrackedOrder(o);
                          }}
                        >
                          {o.reference}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Results panel */}
          <div className="rounded-2xl border border-border bg-card min-h-[22rem] overflow-hidden">
            {!trackSearched ? (
              <div className="flex h-full min-h-[22rem] flex-col items-center justify-center text-center p-8">
                <div className="relative mb-6">
                  <div className="flex size-20 items-center justify-center rounded-3xl bg-primary/10 text-primary ring-8 ring-primary/5">
                    <SignalRail status="online" size="md" />
                  </div>
                  <span className="absolute -top-1 -right-1 flex size-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex size-4 rounded-full bg-emerald-500" />
                  </span>
                </div>
                <h3 className="text-xl font-black text-foreground">
                  Your live dispatch trail appears here.
                </h3>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                  Search an order to see its full route through the SDH core
                  and carrier gateway in real time.
                </p>
                <div className="mt-6 flex items-center gap-6 text-center">
                  {[
                    { label: "Order Placed" },
                    { label: "Dispatched" },
                    { label: "Delivered" },
                  ].map((s, i) => (
                    <div
                      key={s.label}
                      className="flex flex-col items-center gap-1.5"
                    >
                      <div className="size-8 rounded-full border-2 border-dashed border-border flex items-center justify-center text-[10px] font-black text-muted-foreground/40">
                        {i + 1}
                      </div>
                      <span className="text-[10px] text-muted-foreground/50 font-semibold">
                        {s.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : trackedOrder ? (
              (() => {
                const a =
                  NETWORK_ACCENT[trackedOrder.network as TelecomNetwork] ??
                  NETWORK_ACCENT.MTN;
                const timeline = trackedOrder.deliveryTimeline;
                const completedCount = timeline.filter(
                  (s) => s.status === "completed",
                ).length;
                const progress = Math.round(
                  (completedCount / timeline.length) * 100,
                );
                return (
                  <div className="animate-in fade-in duration-300">
                    {/* Order header */}
                    <div className="border-b border-border bg-muted/20 p-5 sm:p-6">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex size-11 shrink-0 items-center justify-center rounded-2xl text-[11px] font-black text-white ${a.solid}`}
                          >
                            {a.short}
                          </div>
                          <div>
                            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                              {trackedOrder.reference}
                            </p>
                            <h3 className="mt-0.5 text-lg font-black text-foreground leading-tight">
                              {trackedOrder.productName}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {trackedOrder.recipientPhone} ·{" "}
                              {trackedOrder.network}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-2xl font-black tabular-nums text-foreground">
                            GH₵ {trackedOrder.amount.toFixed(2)}
                          </p>
                          <Badge
                            className={`mt-1.5 uppercase text-[10px] font-bold ${
                              trackedOrder.status === "delivered"
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                                : trackedOrder.status === "processing"
                                  ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                                  : "bg-red-500/15 text-red-600"
                            }`}
                          >
                            {trackedOrder.status === "delivered"
                              ? "✓ Delivered"
                              : trackedOrder.status === "processing"
                                ? "⟳ In Transit"
                                : trackedOrder.status}
                          </Badge>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                            Delivery progress
                          </span>
                          <span className="text-[10px] font-bold text-primary tabular-nums">
                            {progress}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-700"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-5 sm:p-6 space-y-6">
                      {/* Routing path */}
                      <div className="rounded-xl border border-border bg-muted/20 p-4">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mb-3">
                          Delivery route
                        </p>
                        <div className="flex items-center gap-2">
                          <div
                            className={`flex size-9 shrink-0 items-center justify-center rounded-xl text-[10px] font-black text-white ${a.solid}`}
                          >
                            {a.short}
                          </div>
                          <div className="relative flex-1 h-px bg-primary/25">
                            <div
                              className="absolute inset-y-0 left-0 bg-primary transition-all duration-700 rounded-full"
                              style={{ width: `${progress}%` }}
                            />
                            {trackedOrder.status === "processing" && (
                              <span
                                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex size-2.5 rounded-full bg-primary"
                                style={{ left: `${progress}%` }}
                              >
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                              </span>
                            )}
                          </div>
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-[10px] font-black text-primary-foreground">
                            SDH
                          </div>
                          <div className="relative flex-1 h-px bg-primary/25">
                            <div
                              className="absolute inset-y-0 left-0 bg-primary transition-all duration-700 rounded-full"
                              style={{
                                width: progress === 100 ? "100%" : "0%",
                              }}
                            />
                          </div>
                          <div
                            className={`flex size-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
                              trackedOrder.status === "delivered"
                                ? "bg-emerald-500 text-white"
                                : "bg-muted border border-border text-muted-foreground"
                            }`}
                          >
                            {trackedOrder.status === "delivered" ? (
                              <Check className="size-4" />
                            ) : (
                              <SignalRail
                                status="online"
                                size="xs"
                                bars={4}
                              />
                            )}
                          </div>
                        </div>
                        <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
                          <span>{trackedOrder.network} EVD</span>
                          <span>SDH Core</span>
                          <span>Recipient</span>
                        </div>
                      </div>

                      {/* Step tracker */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                            Signal dispatch timeline
                          </p>
                          <SignalRail
                            status="online"
                            size="sm"
                            label="Live"
                          />
                        </div>
                        <div className="space-y-0">
                          {timeline.map((step, idx) => {
                            const isCompleted = step.status === "completed";
                            const isCurrent = step.status === "current";
                            const isPending = step.status === "pending";
                            const isFailed = step.status === "failed";
                            const isLast = idx === timeline.length - 1;
                            return (
                              <div key={idx} className="flex gap-4">
                                {/* Left: connector + dot */}
                                <div className="flex flex-col items-center shrink-0 w-8">
                                  <div
                                    className={`relative flex size-8 items-center justify-center rounded-full border-2 shrink-0 transition-all ${
                                      isCompleted
                                        ? "bg-primary border-primary text-primary-foreground"
                                        : isCurrent
                                          ? "bg-background border-primary text-primary"
                                          : isFailed
                                            ? "bg-red-500/10 border-red-500 text-red-500"
                                            : "bg-muted border-border text-muted-foreground"
                                    }`}
                                  >
                                    {isCurrent && (
                                      <span className="absolute inset-0 rounded-full animate-ping bg-primary/20" />
                                    )}
                                    {isCompleted ? (
                                      <Check className="size-3.5" />
                                    ) : isCurrent ? (
                                      <span className="size-2 rounded-full bg-primary" />
                                    ) : isFailed ? (
                                      <span className="text-[10px] font-black">
                                        ✕
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-black">
                                        {idx + 1}
                                      </span>
                                    )}
                                  </div>
                                  {!isLast && (
                                    <div
                                      className={`w-0.5 flex-1 my-1 min-h-[1.5rem] ${isCompleted ? "bg-primary" : "bg-border"}`}
                                    />
                                  )}
                                </div>
                                {/* Right: content */}
                                <div
                                  className={`pb-5 flex-1 ${isLast ? "pb-0" : ""}`}
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <p
                                      className={`text-sm font-bold ${
                                        isCompleted
                                          ? "text-foreground"
                                          : isCurrent
                                            ? "text-primary"
                                            : isFailed
                                              ? "text-red-600"
                                              : "text-muted-foreground"
                                      }`}
                                    >
                                      {step.step}
                                      {isCurrent && (
                                        <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold uppercase text-amber-600 dark:text-amber-400">
                                          <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                                          In progress
                                        </span>
                                      )}
                                    </p>
                                    <span
                                      className={`text-[10px] font-mono tabular-nums ${isPending ? "text-muted-foreground/40 italic" : "text-muted-foreground"}`}
                                    >
                                      {step.timestamp}
                                    </span>
                                  </div>
                                  {step.note && (
                                    <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                                      {step.note}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="flex h-full min-h-[22rem] flex-col items-center justify-center text-center p-8">
                <div className="flex size-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 mb-4">
                  <AlertCircle className="size-8" />
                </div>
                <h3 className="text-xl font-black text-foreground">
                  No matching order found.
                </h3>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                  Check the reference spelling or try the phone number used
                  at checkout.
                </p>
                <Button
                  variant="outline"
                  className="mt-5 font-semibold"
                  onClick={() => {
                    setTrackSearched(false);
                    setSearchTrackInput("");
                  }}
                >
                  Try again
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

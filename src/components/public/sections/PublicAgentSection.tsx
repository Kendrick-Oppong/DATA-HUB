import React from "react";
import {
  Sparkles,
  ArrowRight,
  TrendingUp,
  Store,
  Zap,
  ShieldCheck,
  Wifi,
  MessageCircle,
} from "lucide-react";
import { SignalRail } from "../../common/SignalRail";
import { Button } from "../../ui/button";
import { Label } from "../../ui/label";
import { Slider } from "../../ui/slider";
import { PublicTabType } from "./PublicHomeSection";

interface PublicAgentSectionProps {
  calcDailyBundles: number;
  setCalcDailyBundles: (val: number) => void;
  calcAvgMargin: number;
  setCalcAvgMargin: (val: number) => void;
  onApplyAgent: () => void;
  onNavigatePublicTab: (tab: PublicTabType) => void;
}

export const PublicAgentSection: React.FC<PublicAgentSectionProps> = ({
  calcDailyBundles,
  setCalcDailyBundles,
  calcAvgMargin,
  setCalcAvgMargin,
  onApplyAgent,
  onNavigatePublicTab,
}) => {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-background border-b border-border">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_70%_50%,hsl(43_94%_56%/0.12),transparent)]" />
        <div className="pointer-events-none absolute -right-32 -top-32 size-[500px] rounded-full border-[40px] border-amber-500/8" />
        <div className="max-w-[95%] mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-bold text-primary uppercase tracking-wider">
                <Sparkles className="size-3.5" />
                Merchant program · Zero setup fee
              </div>
              <h1 className="text-5xl font-black leading-[0.95] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
                Turn everyday
                <br />
                <span className="text-primary">connections</span>
                <br />
                into daily income.
              </h1>
              <p className="max-w-lg text-base leading-relaxed text-muted-foreground">
                Sell data bundles, exam vouchers, airtime, and utilities
                from your own branded storefront with wholesale rates and
                instant Mobile Money payouts — starting today, for free.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  size="lg"
                  className="font-semibold"
                  onClick={onApplyAgent}
                >
                  Open my data store <ArrowRight className="size-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="font-semibold"
                  onClick={() => onNavigatePublicTab("services")}
                >
                  Browse wholesale rates
                </Button>
              </div>
              <div className="flex flex-wrap gap-x-8 gap-y-3 border-t border-border/70 pt-6">
                {[
                  { value: "GH₵ 0", label: "Setup fee" },
                  { value: "Instant", label: "MoMo payout speed" },
                  { value: "Your URL", label: "Public storefront" },
                ].map((s) => (
                  <div key={s.label}>
                    <p className="text-2xl font-black text-foreground tabular-nums">
                      {s.value}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Profit calculator */}
            <div className="rounded-3xl border border-border bg-card shadow-2xl shadow-primary/8 overflow-hidden">
              <div className="border-b border-border px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase text-primary tracking-wider">
                    Plan your margin
                  </p>
                  <h2 className="mt-0.5 text-lg font-black text-foreground">
                    Profit calculator
                  </h2>
                </div>
                <SignalRail status="online" size="sm" label="MoMo live" />
              </div>
              <div className="p-6 space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-xs font-semibold">
                    <Label className="text-muted-foreground">
                      Bundles sold per day
                    </Label>
                    <span className="font-black tabular-nums text-foreground">
                      {calcDailyBundles}
                    </span>
                  </div>
                  <Slider
                    min={5}
                    max={200}
                    step={5}
                    value={[calcDailyBundles]}
                    onValueChange={(val) => {
                      const v = Array.isArray(val) ? val[0] : val;
                      if (typeof v === "number") setCalcDailyBundles(v);
                    }}
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>5 bundles</span>
                    <span>200 bundles</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs font-semibold">
                    <Label className="text-muted-foreground">
                      Average margin per bundle
                    </Label>
                    <span className="font-black tabular-nums text-foreground">
                      GH₵ {calcAvgMargin.toFixed(2)}
                    </span>
                  </div>
                  <Slider
                    min={1}
                    max={10}
                    step={0.5}
                    value={[calcAvgMargin]}
                    onValueChange={(val) => {
                      const v = Array.isArray(val) ? val[0] : val;
                      if (typeof v === "number") setCalcAvgMargin(v);
                    }}
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>GH₵ 1.00</span>
                    <span>GH₵ 10.00</span>
                  </div>
                </div>
                <div className="rounded-2xl bg-gradient-to-br bg-gradient-to-r from-primary/8 border border-border via-card to-amber-500/8 p-5 ">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase">
                    <TrendingUp className="size-3.5" />
                    Projected monthly commission
                  </div>
                  <p className="mt-3 text-4xl font-black tabular-nums">
                    GH₵{" "}
                    {(calcDailyBundles * calcAvgMargin * 30).toLocaleString(
                      "en-US",
                      { minimumFractionDigits: 2 },
                    )}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed">
                    At {calcDailyBundles * 30} orders/month — a reliable
                    local customer base turning into predictable income.
                  </p>
                </div>
                <Button
                  className="w-full font-semibold h-11"
                  onClick={onApplyAgent}
                >
                  Apply to become an agent <ArrowRight className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits grid */}
      <section className="max-w-[95%] mx-auto px-4 sm:px-6 py-14 w-full">
        <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            Everything you need to run a data business
          </h2>
          <p className="text-sm text-muted-foreground">
            SDH provides the infrastructure. You bring the customers.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            {
              icon: Store,
              color: "text-amber-600",
              bg: "bg-amber-500/10",
              title: "Branded Storefront URL",
              desc: "Get your own public URL like smartdatahub.com/store/your-name. Share it on WhatsApp, print it on receipts — it's your brand.",
            },
            {
              icon: TrendingUp,
              color: "text-primary",
              bg: "bg-primary/10",
              title: "Set Your Own Margins",
              desc: "You decide how much profit to make per bundle. Our live wholesale rates let you be competitive and profitable at the same time.",
            },
            {
              icon: Zap,
              color: "text-emerald-600",
              bg: "bg-emerald-500/10",
              title: "Instant MoMo Payouts",
              desc: "Request a commission withdrawal anytime. Funds hit your Mobile Money in seconds, no minimum balance required.",
            },
            {
              icon: ShieldCheck,
              color: "text-purple-600",
              bg: "bg-purple-500/10",
              title: "Zero Setup Cost",
              desc: "No registration fee, no minimum order. Start selling data, airtime, and vouchers from your first day as an agent.",
            },
            {
              icon: Wifi,
              color: "text-cyan-600",
              bg: "bg-cyan-500/10",
              title: "All 3 Networks Covered",
              desc: "MTN, Telecel, and AirtelTigo — all at wholesale carrier rates. Your customers never need to go elsewhere.",
            },
            {
              icon: MessageCircle,
              color: "text-rose-500",
              bg: "bg-rose-500/10",
              title: "Dedicated Agent Support",
              desc: "A dedicated WhatsApp desk for agents. Delivery issues, top-up questions, or store help — always a real person responds.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="group rounded-2xl border border-border bg-card p-6 hover:border-primary/30 hover:shadow-xl transition-all duration-300"
            >
              <div
                className={`flex size-12 items-center justify-center rounded-2xl ${item.bg} mb-4 group-hover:scale-110 transition-transform`}
              >
                <item.icon className={`size-5 ${item.color}`} />
              </div>
              <h3 className="font-bold text-base text-foreground">
                {item.title}
              </h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Button
            size="lg"
            className="font-semibold px-4"
            onClick={onApplyAgent}
          >
            Start your free data store now <ArrowRight className="size-4" />
          </Button>
        </div>
      </section>
    </div>
  );
};

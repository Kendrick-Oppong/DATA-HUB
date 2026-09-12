import React, { useEffect, useMemo, useState } from "react";
import {
  Wifi,
  ShieldCheck,
  Zap,
  ArrowRight,
  CheckCircle2,
  PhoneCall,
  GraduationCap,
  Store,
  MessageCircle,
  Clock,
  Search,
  Sparkles,
  AlertCircle,
  TrendingUp,
  Building2,
  Radio,
  Users,
  MapPin,
} from "lucide-react";
import { TelecomNetwork, DataBundle, Order, UserRole } from "../../types";
import { SignalRail } from "../common/SignalRail";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Slider } from "../ui/slider";
import { Separator } from "../ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

interface PublicMarketingSiteProps {
  bundles: DataBundle[];
  activeTab?:
    | "home"
    | "services"
    | "agent"
    | "track"
    | "faq"
    | "about"
    | "contact";
  onStartPurchase?: (bundleId: string, network: TelecomNetwork) => void;
  onOpenOrderTracker?: (refOrPhone: string) => void;
  onApplyAgent?: () => void;
  orders: Order[];
  onNavigate?: (role: UserRole, tab: string) => void;
  onOpenReceipt?: (order: Order) => void;
  onOpenAuth?: (mode?: "signin" | "signup" | "demo") => void;
  onOpenSecurityPins?: () => void;
}

// Real carrier brand accents — grounds the selector in the actual networks
// rather than a single generic primary color for all three.
const NETWORK_ACCENT: Record<
  TelecomNetwork,
  { text: string; bg: string; border: string; solid: string; short: string }
> = {
  MTN: {
    text: "text-[#8a6d00] dark:text-[#ffd84d]",
    bg: "bg-[#FFCC08]/15",
    border: "border-[#FFCC08]/50",
    solid: "bg-[#FFCC08]",
    short: "MTN",
  },
  Telecel: {
    text: "text-[#c8102e] dark:text-[#ff6b7f]",
    bg: "bg-[#E4002B]/10",
    border: "border-[#E4002B]/40",
    solid: "bg-[#E4002B]",
    short: "TC",
  },
  AirtelTigo: {
    text: "text-[#0033a0] dark:text-[#7da8ff]",
    bg: "bg-[#0033A0]/10",
    border: "border-[#0033A0]/40",
    solid: "bg-[#0033A0]",
    short: "AT",
  },
};

export const PublicMarketingSite: React.FC<PublicMarketingSiteProps> = ({
  bundles,
  activeTab: routeTab = "home",
  onStartPurchase,
  onOpenOrderTracker,
  onApplyAgent,
  orders,
  onNavigate,
  onOpenReceipt,
  onOpenAuth,
  onOpenSecurityPins,
}) => {
  const [selectedNetwork, setSelectedNetwork] = useState<TelecomNetwork>("MTN");
  const [selectedBundleId, setSelectedBundleId] = useState<string>("mtn-5gb");
  const [quickPhone, setQuickPhone] = useState<string>("");
  const [activeTab, setActiveTab] = useState<
    "home" | "services" | "agent" | "track" | "faq" | "about" | "contact"
  >("home");
  const [searchTrackInput, setSearchTrackInput] = useState<string>("");
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [trackSearched, setTrackSearched] = useState(false);

  // Agent Calculator State
  const [calcDailyBundles, setCalcDailyBundles] = useState<number>(25);
  const [calcAvgMargin, setCalcAvgMargin] = useState<number>(3.5);

  // FAQ filter
  const [faqQuery, setFaqQuery] = useState("");

  // Contact Form State
  const [contactCategory, setContactCategory] = useState<string>(
    "order-delivery-issue",
  );
  const [contactMessage, setContactMessage] = useState<string>("");
  const [contactPhone, setContactPhone] = useState<string>("");
  const [contactSubmitted, setContactSubmitted] = useState<boolean>(false);
  const [ticketRef] = useState<string>(
    () => `TKT-SDH-${Math.floor(1000 + Math.random() * 9000)}`,
  );

  useEffect(() => {
    setActiveTab(routeTab);
  }, [routeTab]);

  const filteredBundles = bundles.filter((b) => b.network === selectedNetwork);
  const currentBundle =
    bundles.find((b) => b.id === selectedBundleId) || filteredBundles[0];
  const accent = NETWORK_ACCENT[selectedNetwork];

  const navigatePublicTab = (tab: typeof activeTab) => {
    if (onNavigate) {
      onNavigate("public", tab);
    } else {
      setActiveTab(tab);
    }
  };

  const handleStartPurchase = (bundleId: string, network: TelecomNetwork) => {
    if (onStartPurchase) {
      onStartPurchase(bundleId, network);
    } else if (onNavigate) {
      onNavigate("customer", "buy-data");
    }
  };

  const handleApplyAgent = () => {
    if (onApplyAgent) {
      onApplyAgent();
    } else if (onNavigate) {
      onNavigate("agent", "my-store");
    }
  };

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTrackSearched(true);
    const cleaned = searchTrackInput.trim();
    const found = orders.find(
      (o) =>
        o.reference.toLowerCase() === cleaned.toLowerCase() ||
        o.recipientPhone.includes(cleaned),
    );
    setTrackedOrder(found || null);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitted(true);
  };

  const faqs = [
    {
      q: "How fast will my data bundle or airtime be delivered?",
      a: "Over 98% of orders are delivered within 15 to 45 seconds of successful Mobile Money authorization. Our automated core switch directly connects to MTN EVD, Telecel Wholesale, and AT Direct Gateways.",
      tag: "Delivery",
    },
    {
      q: "Does Smart Data Hub support all Ghanaian networks?",
      a: "Yes. We support MTN Ghana (including Turbonet & Non-Expiry), Telecel Ghana (Extra & Bossu), and AirtelTigo (Big Time & Sika Data) with instant automated delivery.",
      tag: "Networks",
    },
    {
      q: "What happens if my Mobile Money is deducted but data is delayed?",
      a: "Our smart reconciliation engine verifies every transaction. If upstream network delays exceed 5 minutes, our system either retries via an alternate priority route or automatically refunds the full amount to your wallet.",
      tag: "Payments",
    },
    {
      q: "How can I become an Agent and start my own data business?",
      a: "Open the Agent Program page. You get wholesale pricing, your own customizable public storefront (e.g. smartdatahub.com/store/your-name), real-time commission tracking, and instant MoMo withdrawals.",
      tag: "Agents",
    },
    {
      q: "How do Result Checkers work?",
      a: "You can purchase authentic WAEC WASSCE, BECE Placement, and Nov/Dec vouchers. The serial and PIN are revealed immediately on screen and sent to your phone via SMS, ready to check on waecdirect.org.",
      tag: "Vouchers",
    },
    {
      q: "What is AFA Registration?",
      a: "AFA (Agricultural Workers Association) registration qualifies individuals for subsidized telecom data tariffs (e.g. 10GB for ~GH₵35). We process national ID verification and tariff enrollment.",
      tag: "AFA",
    },
  ];

  const filteredFaqs = useMemo(() => {
    if (!faqQuery.trim()) return faqs;
    const q = faqQuery.toLowerCase();
    return faqs.filter(
      (f) =>
        f.q.toLowerCase().includes(q) ||
        f.a.toLowerCase().includes(q) ||
        f.tag.toLowerCase().includes(q),
    );
  }, [faqQuery]);

  const contactCategories = [
    { value: "order-delivery-issue", label: "Order Delivery Delay" },
    { value: "momo-debited", label: "Mobile Money Debited but No Data" },
    { value: "voucher-failed", label: "Failed Result Checker Voucher" },
    { value: "agent-payout", label: "Agent Onboarding / Payout Question" },
    { value: "general", label: "General Feedback" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* ============ HOME (unchanged, exactly as provided) ============ */}
      {activeTab === "home" && (
        <div>
          <section className="relative isolate overflow-hidden border-b border-border bg-background">
            <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[38%] border-l border-primary/10 bg-primary/[0.025] lg:block" />
            <div className="max-w-[95%] mx-auto px-4 py-10 sm:px-6 md:py-16 lg:py-20">
              <div className="grid items-center gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16">
                <div className="relative z-10 space-y-7">
                  <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-bold text-primary uppercase tracking-wider">
                    <Wifi className="size-3.5" />
                    Ghana's live service rail
                  </div>
                  <div className="max-w-3xl space-y-5">
                    <h1 className="text-4xl font-black leading-[0.98] text-foreground sm:text-6xl lg:text-7xl">
                      Everything you need, delivered instantly
                    </h1>
                    <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                      Buy data, airtime, exam vouchers, and digital services
                      across Ghana's networks. One trusted rail, live tracking,
                      and delivery in seconds.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      size="lg"
                      className="font-semibold"
                      onClick={() =>
                        handleStartPurchase(selectedBundleId, selectedNetwork)
                      }
                    >
                      Buy data now
                      <ArrowRight className="size-4" />
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="font-semibold"
                      onClick={() => navigatePublicTab("agent")}
                    >
                      <Store className="size-4 text-amber-500" />
                      Open a data store
                    </Button>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-border/70 pt-5">
                    <div>
                      <div className="text-2xl font-black tabular-nums text-foreground">
                        42s
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        average delivery
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-black tabular-nums text-foreground">
                        99.8%
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        gateway uptime
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                      <SignalRail status="online" size="sm" />
                      <span>All major networks live</span>
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <div className="overflow-hidden rounded-[1.75rem] border border-primary/20 bg-card shadow-2xl shadow-primary/10">
                    <div className="flex items-start justify-between border-b border-border/70 px-5 py-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                          <Zap className="size-5" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-foreground">
                            Live routing console
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            Direct carrier dispatch across Ghana
                          </p>
                        </div>
                      </div>
                      <Badge className="gap-1.5">Operational</Badge>
                    </div>
                    <div className="space-y-5 p-5 sm:p-6">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-border bg-background p-4">
                          <p className="text-[10px] font-bold uppercase text-muted-foreground">
                            Dispatch time
                          </p>
                          <p className="mt-2 text-3xl font-black tabular-nums text-foreground">
                            42s
                          </p>
                          <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                            faster than the usual wait
                          </p>
                        </div>
                        <div className="rounded-2xl border border-border bg-background p-4">
                          <p className="text-[10px] font-bold uppercase text-muted-foreground">
                            Core uptime
                          </p>
                          <p className="mt-2 text-3xl font-black tabular-nums text-foreground">
                            99.8%
                          </p>
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            gateway health today
                          </p>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-border/80 bg-muted/30 p-4">
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase text-muted-foreground">
                          <span>Delivery path</span>
                          <span className="text-emerald-600">Clear route</span>
                        </div>
                        <div className="mt-4 flex items-center gap-2">
                          <div className="flex size-9 items-center justify-center rounded-xl bg-background text-xs font-black text-foreground">
                            {selectedNetwork === "AirtelTigo"
                              ? "AT"
                              : selectedNetwork === "Telecel"
                                ? "TC"
                                : "MTN"}
                          </div>
                          <div className="h-px flex-1 bg-primary/40" />
                          <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-[10px] font-black text-primary-foreground">
                            SDH
                          </div>
                          <div className="h-px flex-1 bg-primary/40" />
                          <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                            <SignalRail status="online" size="xs" />
                          </div>
                        </div>
                        <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
                          <span>{selectedNetwork} EVD</span>
                          <span>SDH Core</span>
                          <span>Recipient</span>
                        </div>
                      </div>
                      <div>
                        {/* <div className="mb-2 flex items-center justify-between">
                          <p className="text-xs font-bold text-foreground">
                            Choose a network
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            Popular: {currentBundle?.sizeLabel || "5 GB"}
                          </p>
                        </div> */}
                        <div className="grid grid-cols-3 gap-2">
                          {(
                            ["MTN", "Telecel", "AirtelTigo"] as TelecomNetwork[]
                          ).map((network) => (
                            <Button
                              key={network}
                              variant={
                                selectedNetwork === network
                                  ? "default"
                                  : "outline"
                              }
                              className="font-semibold h-10"
                              onClick={() => {
                                setSelectedNetwork(network);
                                const nextBundle = bundles.find(
                                  (bundle) => bundle.network === network,
                                );
                                if (nextBundle)
                                  setSelectedBundleId(nextBundle.id);
                              }}
                            >
                              {network === "AirtelTigo" ? "AT" : network}
                            </Button>
                          ))}
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="py-16 border-b border-border bg-card/40">
            <div className="max-w-[95%] mx-auto px-4 sm:px-6">
              <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                  How Smart Data Hub Delivers
                </h2>
                <p className="text-sm text-muted-foreground">
                  A seamless 60-second delivery workflow engineered for Ghanaian
                  telecom networks.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="p-6 space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary font-black text-sm flex items-center justify-center">
                      01
                    </div>
                    <h3 className="font-bold text-base text-foreground">
                      Select Package & Phone
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Pick your preferred telecom network and bundle size. Enter
                      any active Ghana SIM number.
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 font-black text-sm flex items-center justify-center">
                      02
                    </div>
                    <h3 className="font-bold text-base text-foreground">
                      Approve MoMo Prompt
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Pay securely using MTN MoMo, Telecel Cash, AT Money, or
                      your preloaded SDH Wallet balance.
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-black text-sm flex items-center justify-center">
                      03
                    </div>
                    <h3 className="font-bold text-base text-foreground">
                      Instant Data Credited
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Our direct carrier gateway credits the beneficiary handset
                      in seconds with official receipt and SMS.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          <section className="py-16 border-b border-border">
            <div className="max-w-[95%] mx-auto px-4 sm:px-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                <div>
                  <h2 className="text-2xl font-extrabold text-foreground tracking-tight">
                    Explore Digital Services
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Everything you need on one platform with unified tracking
                    and payment.
                  </p>
                </div>
                <Button
                  variant="link"
                  className="font-bold text-primary px-0"
                  onClick={() => navigatePublicTab("services")}
                >
                  View All Services
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card
                  onClick={() => onStartPurchase?.("mtn-5gb", "MTN")}
                  className="hover:border-primary/50 transition-all cursor-pointer group"
                >
                  <CardContent className="p-5">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Wifi className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-sm text-foreground">
                      Data Bundles
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      MTN, Telecel, AT bundles up to 100GB with non-expiry
                      options.
                    </p>
                    <span className="inline-block mt-3 text-xs font-bold text-primary">
                      Buy from GH₵4.80 →
                    </span>
                  </CardContent>
                </Card>
                <Card
                  onClick={() => onStartPurchase?.("airtime", "MTN")}
                  className="hover:border-primary/50 transition-all cursor-pointer group"
                >
                  <CardContent className="p-5">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <PhoneCall className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-sm text-foreground">
                      Airtime Top-up
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Instant electronic top-up for all networks from GH₵1 to
                      GH₵500.
                    </p>
                    <span className="inline-block mt-3 text-xs font-bold text-amber-600">
                      Recharge SIM →
                    </span>
                  </CardContent>
                </Card>
                <Card
                  onClick={() => onStartPurchase?.("waec-wassce", "MTN")}
                  className="hover:border-primary/50 transition-all cursor-pointer group"
                >
                  <CardContent className="p-5">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-sm text-foreground">
                      Results Checkers
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      WAEC WASSCE, BECE Placement, and University admission
                      vouchers.
                    </p>
                    <span className="inline-block mt-3 text-xs font-bold text-purple-600">
                      Get Serial & PIN →
                    </span>
                  </CardContent>
                </Card>
                <Card
                  onClick={() => onStartPurchase?.("afa", "MTN")}
                  className="hover:border-primary/50 transition-all cursor-pointer group"
                >
                  <CardContent className="p-5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-sm text-foreground">
                      AFA Registration
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Farmer & Worker subsidized tariff enrollment with national
                      ID.
                    </p>
                    <span className="inline-block mt-3 text-xs font-bold text-emerald-600">
                      Register SIM →
                    </span>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          <section className="py-16 bg-gradient-to-r from-primary/10 via-card to-amber-500/10 border-b border-border">
            <div className="max-w-[95%] mx-auto px-4 sm:px-6">
              <Card className="p-8 sm:p-12 shadow-lg">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                  <div className="space-y-4 max-w-xl">
                    <Badge
                      variant="secondary"
                      className="bg-amber-500/15 text-amber-900 dark:text-amber-300 gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      Turn Telecom Data into Daily Income
                    </Badge>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                      Start your own branded data shop in 5 minutes
                    </h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Get wholesale data rates, your personal store URL (
                      <span className="font-mono text-primary">
                        smartdatahub.com/store/your-name
                      </span>
                      ), set your own selling margins, and withdraw profits
                      directly to your Mobile Money wallet anytime.
                    </p>
                    <div className="flex flex-wrap gap-4 text-xs font-semibold text-foreground pt-2">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>Zero setup fee</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>Instant MoMo payouts</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>Automated delivery</span>
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 flex flex-col sm:flex-row gap-3">
                    <Button
                      size="lg"
                      className="font-semibold"
                      onClick={() => navigatePublicTab("agent")}
                    >
                      View Agent Benefits
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="font-semibold"
                      onClick={handleApplyAgent}
                    >
                      Apply as Agent
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </section>
        </div>
      )}

      {/* ============ SERVICES — Premium redesign ============ */}
      {activeTab === "services" && (
        <div className="flex flex-col">
          {/* Hero */}
          <section className="relative isolate overflow-hidden bg-background border-b border-border">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_70%_50%,hsl(var(--primary)/0.10),transparent)]" />
            <div className="max-w-[95%] mx-auto px-4 sm:px-6 py-16 sm:py-24">
              <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                <div className="space-y-7">
                  <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-bold text-primary uppercase tracking-wider">
                    <Wifi className="size-3.5" />
                    Ghana's live service rail
                  </div>
                  <h1 className="text-5xl font-black leading-[0.95] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
                    Every service.
                    <br />
                    <span className="text-primary">One platform.</span>
                  </h1>
                  <p className="max-w-lg text-base leading-relaxed text-muted-foreground">
                    Browse live packages from all three Ghana carriers. Pick a
                    bundle, approve your MoMo prompt, and data lands on the
                    recipient's SIM in under 60 seconds.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      size="lg"
                      className="font-semibold"
                      onClick={() =>
                        handleStartPurchase(selectedBundleId, selectedNetwork)
                      }
                    >
                      Buy data now <ArrowRight className="size-4" />
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="font-semibold"
                      onClick={() => navigatePublicTab("agent")}
                    >
                      <Store className="size-4 text-amber-500" /> Become an
                      agent
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-x-8 gap-y-3 border-t border-border/70 pt-6">
                    {[
                      { value: "03", label: "Networks live" },
                      { value: "42s", label: "Avg dispatch" },
                      { value: "99.8%", label: "SLA uptime" },
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

                {/* Live network card */}
                <div className="rounded-3xl border border-border bg-card shadow-2xl shadow-primary/8 overflow-hidden">
                  <div className="border-b border-border px-6 py-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase text-primary tracking-wider">
                        Carrier status
                      </p>
                      <h2 className="mt-0.5 text-lg font-black text-foreground">
                        Live network feed
                      </h2>
                    </div>
                    <SignalRail status="online" size="sm" label="All live" />
                  </div>
                  <div className="p-6 space-y-4">
                    {(
                      [
                        {
                          network: "MTN",
                          color:
                            "bg-yellow-400/15 text-yellow-700 dark:text-yellow-400",
                          dot: "bg-yellow-400",
                          ping: "42s",
                          status: "Operational",
                        },
                        {
                          network: "Telecel",
                          color: "bg-red-500/10 text-red-600 dark:text-red-400",
                          dot: "bg-red-500",
                          ping: "38s",
                          status: "Operational",
                        },
                        {
                          network: "AirtelTigo",
                          color:
                            "bg-blue-500/10 text-blue-600 dark:text-blue-400",
                          dot: "bg-blue-500",
                          ping: "51s",
                          status: "Operational",
                        },
                      ] as const
                    ).map((n) => (
                      <div
                        key={n.network}
                        className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`inline-flex size-8 items-center justify-center rounded-lg text-[10px] font-black ${n.color}`}
                          >
                            {n.network === "AirtelTigo"
                              ? "AT"
                              : n.network.slice(0, 3)}
                          </span>
                          <div>
                            <p className="text-xs font-bold text-foreground">
                              {n.network}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {n.status}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`size-1.5 rounded-full ${n.dot} animate-pulse`}
                          />
                          <span className="text-[10px] font-bold tabular-nums text-muted-foreground">
                            {n.ping}
                          </span>
                        </div>
                      </div>
                    ))}
                    <Button
                      className="w-full font-semibold h-11 mt-2"
                      onClick={() =>
                        handleStartPurchase(selectedBundleId, selectedNetwork)
                      }
                    >
                      Buy a bundle <ArrowRight className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Network selector + bundle grid */}
          <section className="max-w-[95%] mx-auto px-4 sm:px-6 py-12 w-full space-y-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                  Choose a network
                </p>
                <h2 className="mt-1 text-2xl font-black text-foreground">
                  {selectedNetwork} Ghana packages
                </h2>
              </div>
              <div className="flex items-center gap-1 rounded-2xl border border-border bg-muted/40 p-1.5">
                {(["MTN", "Telecel", "AirtelTigo"] as TelecomNetwork[]).map(
                  (net) => {
                    const a = NETWORK_ACCENT[net];
                    const isActive = selectedNetwork === net;
                    return (
                      <button
                        key={net}
                        type="button"
                        className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                          isActive
                            ? `${a.bg} ${a.text} shadow-sm`
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                        onClick={() => setSelectedNetwork(net)}
                      >
                        <span className={`size-2.5 rounded-full ${a.solid}`} />
                        {net === "AirtelTigo" ? "AT Ghana" : `${net} Ghana`}
                      </button>
                    );
                  },
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredBundles.map((b, index) => (
                <div
                  key={b.id}
                  className={`group relative overflow-hidden rounded-2xl border bg-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl ${
                    index === 0
                      ? `${accent.border} shadow-lg shadow-primary/10`
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <div className={`h-1 w-full ${accent.solid}`} />
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">
                          {b.network} · data bundle
                        </p>
                        <h3 className="mt-2 text-4xl font-black tracking-tight text-foreground">
                          {b.sizeLabel}
                        </h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {b.validity}
                        </p>
                      </div>
                    </div>
                    <div className="mt-5 flex items-center gap-1.5 rounded-xl bg-muted/40 px-3 py-2.5">
                      <div
                        className={`flex size-7 items-center justify-center rounded-lg text-[9px] font-black text-white ${accent.solid}`}
                      >
                        {accent.short}
                      </div>
                      <div className="h-px flex-1 bg-border" />
                      <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-[8px] font-black text-primary-foreground">
                        SDH
                      </div>
                      <div className="h-px flex-1 bg-border" />
                      <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                        <SignalRail status="online" size="xs" bars={4} />
                      </div>
                    </div>
                    <div className="mt-5 flex items-center justify-between gap-4">
                      <p className="text-2xl font-black tabular-nums text-foreground">
                        GH₵ {b.retailPrice.toFixed(2)}
                      </p>
                      <Button
                        className="font-bold rounded-xl"
                        onClick={() => handleStartPurchase(b.id, b.network)}
                      >
                        Buy now <ArrowRight className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Other services */}
            <div className="pt-8 border-t border-border">
              <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider mb-5">
                Other services on Smart Data Hub
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  {
                    icon: PhoneCall,
                    color: "text-amber-600",
                    bg: "bg-amber-500/10",
                    label: "Airtime Top-up",
                    desc: "Instant electronic recharge GH₵1–500 on all networks",
                    cta: "Recharge SIM",
                  },
                  {
                    icon: GraduationCap,
                    color: "text-purple-600",
                    bg: "bg-purple-500/10",
                    label: "Results Checkers",
                    desc: "WAEC WASSCE, BECE Placement, and University vouchers",
                    cta: "Buy voucher",
                  },
                  {
                    icon: ShieldCheck,
                    color: "text-emerald-600",
                    bg: "bg-emerald-500/10",
                    label: "AFA Registration",
                    desc: "Farmer & Worker subsidized tariff enrollment",
                    cta: "Register SIM",
                  },
                ].map((svc) => (
                  <div
                    key={svc.label}
                    className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 hover:border-primary/30 hover:shadow-lg transition-all cursor-pointer"
                    onClick={() => handleStartPurchase("mtn-5gb", "MTN")}
                  >
                    <div
                      className={`flex size-12 items-center justify-center rounded-2xl ${svc.bg} shrink-0 group-hover:scale-110 transition-transform`}
                    >
                      <svc.icon className={`size-5 ${svc.color}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-foreground">
                        {svc.label}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        {svc.desc}
                      </p>
                      <span
                        className={`inline-block mt-2 text-xs font-bold ${svc.color}`}
                      >
                        {svc.cta} →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ============ AGENT — Premium redesign ============ */}
      {activeTab === "agent" && (
        <div className="flex flex-col">
          {/* Hero */}
          <section className="relative isolate overflow-hidden bg-background border-b border-border">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_70%_50%,hsl(43_94%_56%/0.12),transparent)]" />
            <div className="pointer-events-none absolute -right-32 -top-32 size-[500px] rounded-full border-[40px] border-amber-500/8" />
            <div className="max-w-[95%] mx-auto px-4 sm:px-6 py-16 sm:py-24">
              <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                <div className="space-y-7">
                  {" "}
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
                      onClick={handleApplyAgent}
                    >
                      Open my data store <ArrowRight className="size-4" />
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="font-semibold"
                      onClick={() => navigatePublicTab("services")}
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
                      onClick={handleApplyAgent}
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
                onClick={handleApplyAgent}
              >
                Start your free data store now <ArrowRight className="size-4" />
              </Button>
            </div>
          </section>
        </div>
      )}

      {/* ============ TRACK — Premium redesign ============ */}
      {activeTab === "track" && (
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
                        { label: "Order Placed", icon: "①" },
                        { label: "Dispatched", icon: "②" },
                        { label: "Delivered", icon: "③" },
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
                                  <svg
                                    viewBox="0 0 16 16"
                                    className="size-4 fill-current"
                                  >
                                    <path d="M13.5 2.5l-7 7-3-3-1.5 1.5 4.5 4.5 8.5-8.5z" />
                                  </svg>
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
                                          <svg
                                            viewBox="0 0 16 16"
                                            className="size-3.5 fill-current"
                                          >
                                            <path d="M13.5 2.5l-7 7-3-3-1.5 1.5 4.5 4.5 8.5-8.5z" />
                                          </svg>
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
      )}

      {/* ============ FAQ — Premium redesign ============ */}
      {activeTab === "faq" && (
        <div className="flex flex-col">
          {/* Hero */}
          <section className="relative isolate overflow-hidden border-b border-border bg-background">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,hsl(var(--primary)/0.10),transparent)]" />
            <div className="max-w-[95%] mx-auto px-4 sm:px-6 py-14 sm:py-20 text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-bold text-primary uppercase tracking-wider mb-6">
                <MessageCircle className="size-3.5" />
                Help & support
              </div>
              <h1 className="text-5xl font-black leading-[0.95] tracking-tight text-foreground sm:text-6xl">
                Frequently Asked
                <br />
                <span className="text-primary">Questions</span>
              </h1>
              <p className="mt-4 text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
                Everything about purchasing, delivery, vouchers, and reselling
                on Smart Data Hub. Can't find what you need? Chat us on
                WhatsApp.
              </p>
              <div className="relative max-w-md mx-auto mt-8">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  value={faqQuery}
                  onChange={(e) => setFaqQuery(e.target.value)}
                  placeholder="Search FAQs — e.g. refund, agent, voucher"
                  className="pl-11 h-12 rounded-2xl border-border/80 bg-card shadow-sm text-sm"
                />
              </div>
            </div>
          </section>

          {/* FAQ content */}
          <section className="max-w-3xl mx-auto px-4 sm:px-6 py-12 w-full space-y-4">
            {/* Category pills */}
            <div className="flex flex-wrap gap-2 pb-2">
              {[
                "All",
                "Delivery",
                "Networks",
                "Payments",
                "Agents",
                "Vouchers",
                "AFA",
              ].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() =>
                    setFaqQuery(tag === "All" ? "" : tag.toLowerCase())
                  }
                  className={`rounded-full px-4 py-1.5 text-xs font-bold border transition-all ${
                    (tag === "All" && !faqQuery) ||
                    faqQuery.toLowerCase() === tag.toLowerCase()
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-primary/40 bg-card"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>

            {filteredFaqs.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="size-12 text-muted-foreground/40 mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  No results for "{faqQuery}" —{" "}
                  <button
                    type="button"
                    className="text-primary font-bold hover:underline"
                    onClick={() => navigatePublicTab("contact")}
                  >
                    chat us on WhatsApp instead
                  </button>
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredFaqs.map((faq, idx) => (
                  <div
                    key={idx}
                    className="group rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/30 transition-all"
                  >
                    <Accordion defaultValue={idx === 0 ? [`faq-${idx}`] : []}>
                      <AccordionItem value={`faq-${idx}`} className="border-0">
                        <AccordionTrigger className="px-5 py-4 text-left text-sm font-bold text-foreground gap-3 hover:no-underline">
                          <span className="flex items-center gap-3">
                            <Badge
                              variant="secondary"
                              className={`text-[10px] font-semibold shrink-0 rounded-full ${
                                faq.tag === "Delivery"
                                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                  : faq.tag === "Networks"
                                    ? "bg-primary/10 text-primary"
                                    : faq.tag === "Payments"
                                      ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                                      : faq.tag === "Agents"
                                        ? "bg-purple-500/10 text-purple-600"
                                        : faq.tag === "Vouchers"
                                          ? "bg-rose-500/10 text-rose-600"
                                          : "bg-cyan-500/10 text-cyan-600"
                              }`}
                            >
                              {faq.tag}
                            </Badge>
                            {faq.q}
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="px-5 pb-5">
                          <div className="pl-0 text-sm text-muted-foreground leading-relaxed border-t border-border/60 pt-4 mt-1">
                            {faq.a}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                ))}
              </div>
            )}

            {/* CTA */}
            <div className="mt-8 rounded-2xl border border-border bg-gradient-to-r from-primary/8 via-card to-amber-500/8 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="font-bold text-foreground">
                  Still have questions?
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Our support engineers respond in real time via WhatsApp.
                </p>
              </div>
              <Button
                className="font-bold shrink-0"
                onClick={() => navigatePublicTab("contact")}
              >
                <MessageCircle className="size-4" /> Chat support
              </Button>
            </div>
          </section>
        </div>
      )}

      {/* ============ ABOUT — Premium redesign ============ */}
      {activeTab === "about" && (
        <div className="flex flex-col">
          {/* Hero */}
          <section className="relative isolate overflow-hidden border-b border-border bg-background">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,hsl(var(--primary)/0.10),transparent)]" />
            <div className="max-w-[95%] mx-auto px-4 sm:px-6 py-14 sm:py-20 text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-bold text-primary uppercase tracking-wider mb-6">
                <Building2 className="size-3.5" />
                About Smart Data Hub
              </div>
              <h1 className="text-5xl font-black leading-[0.95] tracking-tight text-foreground sm:text-6xl">
                Ghana's
                <br />
                <span className="text-primary">digital service</span>
                <br />
                backbone.
              </h1>
              <p className="mt-4 text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
                Smart Data Hub (SDH) is Ghana's mission-driven digital commerce
                and telecom distribution network — powering connectivity for
                thousands of students, professionals, and merchants across all
                16 regions with direct carrier-level access.
              </p>
            </div>
          </section>

          {/* Stats banner */}
          <section className="border-b border-border bg-gradient-to-r from-primary/8 via-card to-amber-500/8">
            <div className="max-w-[95%] mx-auto px-4 sm:px-6 py-10">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
                {[
                  { value: "16", label: "Regions covered", icon: MapPin },
                  { value: "3", label: "Carrier gateways", icon: Radio },
                  { value: "99.8%", label: "SLA uptime", icon: Zap },
                  { value: "24/7", label: "NOC support desk", icon: Users },
                ].map((s) => (
                  <div key={s.label}>
                    <s.icon className="size-5 mx-auto mb-2" />
                    <p className="text-3xl font-black tabular-nums">
                      {s.value}
                    </p>
                    <p className="text-xs  mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Mission + pillars */}
          <section className="max-w-[95%] mx-auto px-4 sm:px-6 py-14 w-full space-y-12">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-12 items-center">
              <div className="space-y-5">
                <p className="text-xs font-bold uppercase text-primary tracking-widest">
                  Our mission
                </p>
                <h2 className="text-3xl sm:text-4xl font-black text-foreground leading-tight tracking-tight">
                  Fast, fair, and frictionless access to digital services — for
                  every Ghanaian.
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We built SDH because buying data in Ghana felt unnecessarily
                  hard. Long waits, failed transactions, and no transparency. We
                  connected directly to carrier EVD and MoMo gateways to fix
                  that — 42 seconds from payment to delivery, with automated
                  refund protection on every order.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  For agents and resellers, we built a full merchant platform:
                  branded storefronts, live commission dashboards, and instant
                  MoMo payouts — turning everyday connections into a real income
                  stream.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    icon: Radio,
                    color: "text-primary",
                    bg: "bg-primary/10",
                    title: "Carrier Level Direct",
                    desc: "Automated core gateway integration with MTN Ghana, Telecel, and AT Ghana for sub-minute delivery.",
                  },
                  {
                    icon: ShieldCheck,
                    color: "text-emerald-600",
                    bg: "bg-emerald-500/10",
                    title: "BoG Regulated Rails",
                    desc: "All Mobile Money flows settled via authorized financial institutions with instant dispute resolution.",
                  },
                  {
                    icon: MessageCircle,
                    color: "text-amber-600",
                    bg: "bg-amber-500/10",
                    title: "Local NOC Support",
                    desc: "Accra-based network operations desk reachable 24/7 via WhatsApp and phone — a real person, always.",
                  },
                  {
                    icon: Store,
                    color: "text-purple-600",
                    bg: "bg-purple-500/10",
                    title: "Agent Merchant Program",
                    desc: "Free branded storefronts, wholesale pricing, and instant MoMo payouts for Ghana's data resellers.",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-border bg-card p-5 hover:border-primary/30 hover:shadow-lg transition-all"
                  >
                    <div
                      className={`flex size-10 items-center justify-center rounded-xl ${item.bg} mb-3`}
                    >
                      <item.icon className={`size-5 ${item.color}`} />
                    </div>
                    <h3 className="font-bold text-sm text-foreground">
                      {item.title}
                    </h3>
                    <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="rounded-3xl bg-gradient-to-r from-primary/10 via-card to-amber-500/10 border border-border p-8 sm:p-12 flex flex-col sm:flex-row items-center justify-between gap-8">
              <div className="space-y-2 max-w-xl">
                <h3 className="text-2xl font-black text-foreground tracking-tight">
                  Ready to get started?
                </h3>
                <p className="text-sm text-muted-foreground">
                  Buy data in seconds, or open your own branded data store —
                  both are one click away.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                <Button
                  size="lg"
                  className="font-semibold"
                  onClick={() =>
                    handleStartPurchase(selectedBundleId, selectedNetwork)
                  }
                >
                  Buy data now <ArrowRight className="size-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="font-semibold"
                  onClick={handleApplyAgent}
                >
                  Become an agent
                </Button>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ============ CONTACT — Premium redesign ============ */}
      {activeTab === "contact" && (
        <div className="flex flex-col">
          {/* Hero */}
          <section className="relative isolate overflow-hidden border-b border-border bg-background">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_-10%,hsl(152_60%_40%/0.08),transparent)]" />
            <div className="max-w-[95%] mx-auto px-4 sm:px-6 py-14 sm:py-20 text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/8 px-4 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-6">
                <MessageCircle className="size-3.5" />
                NOC Support desk · 24/7
              </div>
              <h1 className="text-5xl font-black leading-[0.95] tracking-tight text-foreground sm:text-6xl">
                Contact &<br />
                <span className="text-primary">NOC Support</span>
              </h1>
              <p className="mt-4 text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
                Issue with an order or payment? Our support engineers resolve
                tickets in real-time — most queries answered within 5 minutes.
              </p>
            </div>
          </section>

          {/* Contact channels + form */}
          <section className="max-w-[95%] mx-auto px-4 sm:px-6 py-12 w-full">
            <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
              {/* Left: contact channels */}
              <div className="space-y-4">
                {/* WhatsApp CTA */}
                <a
                  href="https://wa.me/233244192834?text=Hello%20Smart%20Data%20Hub%20Support"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <div className="group rounded-2xl overflow-hidden bg-card border border-border p-6 transition-all hover:-translate-y-0.5">
                    <div className="flex items-center gap-4">
                      <div className="flex size-14 items-center justify-center rounded-2xl bg-foreground/15">
                        <MessageCircle className="size-7" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-md leading-tight">
                          WhatsApp Priority Desk
                        </p>
                        <p className="text-sm text-foreground/85 mt-0.5">
                          +233 24 419 2834 · Live now
                        </p>
                        <p className="text-xs text-foreground/60 mt-1">
                          Fastest response channel — real agent, always
                        </p>
                      </div>
                      <ArrowRight className="size-5 shrink-0 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </a>

                {/* Operating hours */}
                <div className="rounded-2xl border border-border bg-card p-5 flex items-start gap-4">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                    <Clock className="size-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground">
                      Operating Hours
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      24 Hours / 7 Days a week — same desk handles calls and
                      WhatsApp
                    </p>
                  </div>
                </div>

                {/* Office details */}
                <div className="rounded-2xl border border-border bg-card p-5 flex items-start gap-4">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 shrink-0">
                    <MapPin className="size-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground">
                      Accra NOC Desk
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      Airport Residential Area, Accra, Ghana.
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                      Email:{" "}
                      <span className="text-foreground font-medium">
                        support@smartdatahub.com
                      </span>
                    </p>
                  </div>
                </div>

                {/* Quick links */}
                <div className="rounded-2xl border border-border bg-card p-5">
                  <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider mb-3">
                    Before you reach out
                  </p>
                  <div className="space-y-2">
                    {[
                      {
                        label: "Track your order status",
                        tab: "track" as const,
                      },
                      {
                        label: "Browse FAQs for quick answers",
                        tab: "faq" as const,
                      },
                    ].map((link) => (
                      <button
                        key={link.tab}
                        type="button"
                        className="w-full flex items-center justify-between text-sm text-muted-foreground hover:text-primary p-2 rounded-lg hover:bg-muted/50 transition-colors"
                        onClick={() => navigatePublicTab(link.tab)}
                      >
                        <span>{link.label}</span>
                        <ArrowRight className="size-3.5" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: support form */}
              <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-lg">
                <div className="border-b border-border px-6 py-5 bg-muted/20">
                  <p className="text-xs font-bold uppercase text-primary tracking-wider">
                    Support ticket
                  </p>
                  <h2 className="mt-0.5 text-xl font-black text-foreground">
                    File a Support Request
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    NOC engineers respond within 5 minutes during operating
                    hours.
                  </p>
                </div>
                <div className="p-6">
                  {contactSubmitted ? (
                    <div className="py-10 flex flex-col items-center gap-4 text-center">
                      <div className="flex size-16 items-center justify-center rounded-full bg-emerald-500/15 ring-8 ring-emerald-500/5">
                        <CheckCircle2 className="size-9 text-emerald-500" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-foreground">
                          Support Ticket Submitted!
                        </h3>
                        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                          Ticket{" "}
                          <strong className="text-foreground font-mono">
                            {ticketRef}
                          </strong>{" "}
                          has been opened. An NOC engineer will contact your
                          phone shortly.
                        </p>
                      </div>
                      <Button
                        className="font-bold mt-2"
                        onClick={() => setContactSubmitted(false)}
                      >
                        Send another message
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleContactSubmit} className="space-y-5">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                          Issue Category
                        </Label>
                        <Select
                          value={contactCategory}
                          onValueChange={setContactCategory}
                        >
                          <SelectTrigger className="!h-11 w-full rounded-xl">
                            <SelectValue placeholder="Select an issue category" />
                          </SelectTrigger>
                          <SelectContent>
                            {[
                              {
                                value: "order-delivery-issue",
                                label: "Order Delivery Delay",
                              },
                              {
                                value: "momo-debited",
                                label: "Mobile Money Debited but No Data",
                              },
                              {
                                value: "voucher-failed",
                                label: "Failed Result Checker Voucher",
                              },
                              {
                                value: "agent-payout",
                                label: "Agent Onboarding / Payout Question",
                              },
                              { value: "general", label: "General Feedback" },
                            ].map((c) => (
                              <SelectItem key={c.value} value={c.value}>
                                {c.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label
                          htmlFor="contact-phone"
                          className="text-xs font-bold uppercase text-muted-foreground tracking-wider"
                        >
                          Your Mobile Phone Number
                        </Label>
                        <Input
                          id="contact-phone"
                          type="tel"
                          required
                          placeholder="e.g. 0244192834"
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value)}
                          className="h-11 rounded-xl"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label
                          htmlFor="contact-message"
                          className="text-xs font-bold uppercase text-muted-foreground tracking-wider"
                        >
                          Message Details
                        </Label>
                        <Textarea
                          id="contact-message"
                          rows={4}
                          required
                          placeholder="Describe your issue with order reference number..."
                          value={contactMessage}
                          onChange={(e) => setContactMessage(e.target.value)}
                          className="rounded-xl resize-none"
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full font-bold h-11 rounded-xl"
                      >
                        Submit Support Ticket <ArrowRight className="size-4" />
                      </Button>
                      <p className="text-[10px] text-center text-muted-foreground">
                        We'll call or WhatsApp the number you provided above.
                      </p>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-border bg-card/60 py-10">
        <div className="max-w-[95%] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary text-primary-foreground font-extrabold text-xs flex items-center justify-center">
                  SDH
                </div>
                <span className="font-extrabold text-sm text-foreground">
                  Smart Data Hub
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Ghana's trusted consumer fintech and telecom resale
                infrastructure. Instant automated delivery on all networks.
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3">
                Quick Services
              </h4>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li>
                  <button
                    onClick={() => handleStartPurchase("mtn-5gb", "MTN")}
                    className="hover:text-primary cursor-pointer"
                  >
                    Buy MTN Data
                  </button>
                </li>
                <li>
                  <button
                    onClick={() =>
                      handleStartPurchase("telecel-10gb", "Telecel")
                    }
                    className="hover:text-primary cursor-pointer"
                  >
                    Buy Telecel Data
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleStartPurchase("at-5gb", "AirtelTigo")}
                    className="hover:text-primary cursor-pointer"
                  >
                    Buy AT Big Time Data
                  </button>
                </li>
                <li>
                  <button
                    onClick={() =>
                      onNavigate
                        ? onNavigate("customer", "results-checker")
                        : handleStartPurchase("waec-wassce", "MTN")
                    }
                    className="hover:text-primary cursor-pointer"
                  >
                    WASSCE / BECE Checkers
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3">
                Company & Legal
              </h4>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li>
                  <button
                    onClick={() => navigatePublicTab("about")}
                    className="hover:text-primary"
                  >
                    About Smart Data Hub
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigatePublicTab("faq")}
                    className="hover:text-primary"
                  >
                    Frequently Asked Questions
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigatePublicTab("track")}
                    className="hover:text-primary"
                  >
                    Order Status Tracker
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigatePublicTab("contact")}
                    className="hover:text-primary"
                  >
                    Terms of Service & SLA
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3">
                Accra NOC Desk
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Airport Residential Area, Accra, Ghana.
                <br />
                Support:{" "}
                <span className="font-mono text-foreground font-semibold">
                  +233 24 419 2834
                </span>
                <br />
                Email:{" "}
                <span className="text-foreground">
                  support@smartdatahub.com
                </span>
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-border/60 flex flex-col sm:flex-row justify-between items-center text-xs text-muted-foreground gap-2">
            <div>
              © 2026 Smart Data Hub Ghana. All rights reserved. Primary
              currency: GH₵.
            </div>
            <div className="flex items-center gap-4">
              <span>MTN MoMo</span>
              <span>Telecel Cash</span>
              <span>AT Money</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

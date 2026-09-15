import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Store,
  CheckCircle2,
  Copy,
  Check,
  QrCode,
  ExternalLink,
  MessageCircle,
  Eye,
  Sliders,
  Sparkles,
  Save,
  AlertCircle,
  TrendingUp,
  BarChart3,
  Users,
  DollarSign,
  Tag,
  Share2,
  Power,
  Layers,
  Search,
  ArrowUpRight,
  RefreshCw,
  Globe,
  Radio,
  Clock,
  Send,
  Zap,
  SlidersHorizontal,
  BadgeCheck,
} from "lucide-react";
import {
  AgentStoreConfig,
  DataBundle,
  TelecomNetwork,
  Order,
  PromoCode,
} from "../../types";
import { INITIAL_ORDERS } from "../../mockData";
import { SignalRail } from "../common/SignalRail";
import { PaginationHelper } from "../customer/views/PaginationHelper";

// Store Builder Subcomponents
import { SaveStatus } from "./store-builder/SaveStatus";
import { Delta } from "./store-builder/Delta";
import { LogoUpload } from "./store-builder/LogoUpload";
import { PromoCodeList } from "./store-builder/PromoCodeList";
import { PseudoQR } from "./store-builder/PseudoQR";
import { ShareKitModal } from "./store-builder/ShareKitModal";
import { StoreInsights } from "./store-builder/StoreInsights";
import { StorePreviewChip } from "./store-builder/StorePreviewChip";
import { StorePrice } from "./store-builder/StorePrice";

// shadcn UI Components
import { Button } from "../ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Slider } from "../ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "../ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface MyStoreBuilderProps {
  storeConfig: AgentStoreConfig;
  onUpdateStoreConfig: (newConfig: AgentStoreConfig) => void;
  onOpenStorefront: () => void;
  bundles: DataBundle[];
  orders?: Order[];
}

const COLOR_PRESETS = [
  { name: "Royal Blue", hex: "#2563eb" },
  { name: "Emerald Mint", hex: "#059669" },
  { name: "Electric Violet", hex: "#7c3aed" },
  { name: "Ghana Gold", hex: "#d97706" },
  { name: "Ruby Rose", hex: "#e11d48" },
  { name: "Midnight Slate", hex: "#0f172a" },
  { name: "Deep Cyan", hex: "#0891b2" },
  { name: "Sunset Orange", hex: "#ea580c" },
];

export const MyStoreBuilder: React.FC<MyStoreBuilderProps> = ({
  storeConfig,
  onUpdateStoreConfig,
  onOpenStorefront,
  bundles,
  orders = INITIAL_ORDERS,
}) => {
  const [config, setConfig] = useState<AgentStoreConfig>({
    ...storeConfig,
    marginMarkupPercent:
      typeof storeConfig?.marginMarkupPercent === "number" &&
      !isNaN(storeConfig.marginMarkupPercent)
        ? storeConfig.marginMarkupPercent
        : 8,
    enabledNetworks: storeConfig.enabledNetworks || [
      "MTN",
      "Telecel",
      "AirtelTigo",
    ],
    enabledServices: storeConfig.enabledServices || {
      airtime: true,
      checker: true,
      afa: true,
    },
    whatsappChannelUrl:
      storeConfig.whatsappChannelUrl ||
      `https://whatsapp.com/channel/0029Va9${storeConfig.handle || "Store"}`,
  });

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedChannel, setCopiedChannel] = useState(false);
  const [saveState, setSaveState] = useState<"saving" | "saved" | null>(null);
  const [shareKitOpen, setShareKitOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("branding");

  // Pricing Table State
  const [pricingFilter, setPricingFilter] = useState<string>("ALL");
  const [pricingCategoryFilter, setPricingCategoryFilter] =
    useState<string>("all");
  const [pricingSearch, setPricingSearch] = useState<string>("");
  const [pricingPage, setPricingPage] = useState(1);
  const PRICING_PER_PAGE = 7;

  // Orders Table State
  const [ordersSearch, setOrdersSearch] = useState<string>("");
  const [ordersStatusFilter, setOrdersStatusFilter] = useState<string>("all");
  const [ordersNetworkFilter, setOrdersNetworkFilter] = useState<string>("all");
  const [ordersPage, setOrdersPage] = useState(1);
  const ORDERS_PER_PAGE = 6;

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://smartdatahub.com";
  const storeUrl = `${origin}/store/${config.handle}`;
  const fullStoreUrl = storeUrl;
  const displayStoreUrl = `${origin.replace(/^https?:\/\//, "")}/store/${config.handle}`;

  // Reset pagination on filter changes
  useEffect(() => {
    setPricingPage(1);
  }, [pricingSearch, pricingFilter, pricingCategoryFilter]);

  useEffect(() => {
    setOrdersPage(1);
  }, [ordersSearch, ordersStatusFilter, ordersNetworkFilter]);

  // Helper to trigger temporary toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Synchronize state changes with parent auto-save
  const updateConfig = (updates: Partial<AgentStoreConfig>) => {
    setConfig((prev) => {
      const next = { ...prev, ...updates };
      setSaveState("saving");
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        onUpdateStoreConfig(next);
        setSaveState("saved");
        setTimeout(() => setSaveState(null), 2500);
      }, 600);
      return next;
    });
  };

  const handleManualSave = () => {
    setSaveState("saving");
    onUpdateStoreConfig(config);
    setTimeout(() => {
      setSaveState("saved");
      showToast("Store settings saved successfully!");
      setTimeout(() => setSaveState(null), 2500);
    }, 400);
  };

  const handleCopyStoreLink = () => {
    navigator.clipboard.writeText(fullStoreUrl);
    setCopiedLink(true);
    showToast("Store link copied to clipboard");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyChannelLink = () => {
    if (!config.whatsappChannelUrl) return;
    navigator.clipboard.writeText(config.whatsappChannelUrl);
    setCopiedChannel(true);
    showToast("WhatsApp channel link copied");
    setTimeout(() => setCopiedChannel(false), 2000);
  };

  // Toggle Network on/off
  const toggleNetwork = (
    network: TelecomNetwork | "MTN_XPRESS" | "AT_BIGTIME" | "AT_ISHARE",
  ) => {
    const current = config.enabledNetworks || ["MTN", "Telecel", "AirtelTigo"];
    const exists = current.includes(network);
    const updated = exists
      ? current.filter((n) => n !== network)
      : [...current, network];
    updateConfig({ enabledNetworks: updated });
  };

  // Toggle Service on/off
  const toggleService = (service: "airtime" | "checker" | "afa") => {
    const current = config.enabledServices || {
      airtime: true,
      checker: true,
      afa: true,
    };
    const updated = { ...current, [service]: !current[service] };
    updateConfig({ enabledServices: updated });
  };

  // Quick Markup presets application
  const applyMarkupPercent = (percent: number) => {
    updateConfig({ marginMarkupPercent: percent });
    showToast(`Markup set to +${percent}% on all wholesale bundles`);
  };

  // Reset custom prices
  const handleResetCustomPrices = () => {
    updateConfig({ customPrices: {} });
    showToast("Reset all bundles to default markup prices");
  };

  // Filtered orders for store
  const storeOrders = useMemo(() => {
    return orders.filter(
      (o) => o.agentMargin !== undefined || o.serviceType === "data",
    );
  }, [orders]);

  // Store Analytics metrics
  const storeMetrics = useMemo(() => {
    const totalOrders = storeOrders.length;
    const uniqueCustomers = new Set(
      storeOrders.map((o) => String(o.recipientPhone).replace(/\D/g, "")),
    ).size;
    const totalRevenue = storeOrders.reduce((sum, o) => sum + o.amount, 0);
    const totalCommission = storeOrders
      .filter((o) => o.status === "delivered")
      .reduce((sum, o) => sum + (o.agentMargin || o.amount * 0.08), 0);
    const deliveredCount = storeOrders.filter(
      (o) => o.status === "delivered",
    ).length;
    const successRate =
      totalOrders > 0 ? (deliveredCount / totalOrders) * 100 : 99.4;

    return {
      totalOrders: totalOrders || 42,
      uniqueCustomers: uniqueCustomers || 28,
      totalRevenue: totalRevenue || 1840.5,
      totalCommission: totalCommission || 184.2,
      successRate: Number(successRate.toFixed(1)),
    };
  }, [storeOrders]);

  // Filtered bundles for pricing table
  const filteredBundles = useMemo(() => {
    return bundles.filter((b) => {
      const matchNetwork =
        pricingFilter === "ALL" || b.network === pricingFilter;
      const query = pricingSearch.toLowerCase().trim();
      const matchSearch =
        !query ||
        b.name.toLowerCase().includes(query) ||
        b.sizeLabel.toLowerCase().includes(query) ||
        b.validity.toLowerCase().includes(query);

      const matchCategory =
        pricingCategoryFilter === "all" ||
        (pricingCategoryFilter === "high_volume" && b.sizeGb >= 10) ||
        (pricingCategoryFilter === "starter" && b.sizeGb < 5) ||
        (pricingCategoryFilter === "standard" &&
          b.sizeGb >= 5 &&
          b.sizeGb < 10);

      return matchNetwork && matchSearch && matchCategory;
    });
  }, [bundles, pricingFilter, pricingSearch, pricingCategoryFilter]);

  const totalPricingPages = Math.max(
    1,
    Math.ceil(filteredBundles.length / PRICING_PER_PAGE),
  );
  const paginatedBundles = filteredBundles.slice(
    (pricingPage - 1) * PRICING_PER_PAGE,
    pricingPage * PRICING_PER_PAGE,
  );

  const resetPricingFilters = () => {
    setPricingSearch("");
    setPricingFilter("ALL");
    setPricingCategoryFilter("all");
  };

  const hasPricingFilters =
    pricingSearch.trim() !== "" ||
    pricingFilter !== "ALL" ||
    pricingCategoryFilter !== "all";

  // Orders filtered for Recent Orders section
  const displayedOrders = useMemo(() => {
    return storeOrders.filter((o) => {
      const matchStatus =
        ordersStatusFilter === "all" || o.status === ordersStatusFilter;
      const matchNetwork =
        ordersNetworkFilter === "all" || o.network === ordersNetworkFilter;
      const query = ordersSearch.toLowerCase().trim();
      const matchSearch =
        !query ||
        o.recipientPhone.includes(query) ||
        o.reference.toLowerCase().includes(query) ||
        o.productName.toLowerCase().includes(query);
      return matchStatus && matchNetwork && matchSearch;
    });
  }, [storeOrders, ordersStatusFilter, ordersNetworkFilter, ordersSearch]);

  const totalOrdersPages = Math.max(
    1,
    Math.ceil(displayedOrders.length / ORDERS_PER_PAGE),
  );
  const paginatedOrders = displayedOrders.slice(
    (ordersPage - 1) * ORDERS_PER_PAGE,
    ordersPage * ORDERS_PER_PAGE,
  );

  const resetOrderFilters = () => {
    setOrdersSearch("");
    setOrdersStatusFilter("all");
    setOrdersNetworkFilter("all");
  };

  const hasOrderFilters =
    ordersSearch.trim() !== "" ||
    ordersStatusFilter !== "all" ||
    ordersNetworkFilter !== "all";

  const isLive = config.status === "published";

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Toast alert popup if triggered */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-foreground text-background text-xs font-bold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. STORE STATUS HEADER BANNER (Identical to AgentDashboard Header Style) */}
      {/* ========================================================================= */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-500/15 via-card to-primary/10 border border-border shadow-xs flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase font-bold text-amber-900 dark:text-amber-300 tracking-wider">
              Agent Storefront Builder
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1.5 ${
                isLive
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                  : "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30"
              }`}
            >
              <span
                className={`size-1.5 rounded-full ${
                  isLive ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                }`}
              />
              <span>
                {isLive
                  ? "Tier 2 Gold Merchant · Live & Selling"
                  : "Tier 2 Gold Merchant · Store Paused"}
              </span>
            </span>
            <SignalRail status={isLive ? "online" : "offline"} size="sm" />
            <SaveStatus state={saveState} />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            {config.storeName || "My Storefront"}
          </h1>

          <p className="text-[12px] text-muted-foreground">
            Your storefront is{" "}
            <strong
              className={
                isLive
                  ? "text-emerald-600 dark:text-emerald-400 font-bold"
                  : "text-amber-600 dark:text-amber-400 font-bold"
              }
            >
              {isLive ? "Live & Selling" : "Paused & In Maintenance"}
            </strong>
            . Direct customer orders auto-deliver through our core gateway.
          </p>

          {/* Store URL & Share Bar */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background border border-border text-xs">
              <span className="text-muted-foreground font-semibold">URL:</span>
              <span className="font-semibold text-foreground">
                {displayStoreUrl}
              </span>
            </div>
            <button
              onClick={handleCopyStoreLink}
              className="px-3 py-1.5 rounded-xl border border-border bg-card text-xs font-bold hover:bg-muted transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              {copiedLink ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copiedLink ? "Copied" : "Copy"}</span>
            </button>
            <a
              href={fullStoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs inline-flex"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Preview Storefront</span>
            </a>
            <button
              onClick={() => setShareKitOpen(true)}
              className="px-3 py-1.5 rounded-xl border border-border bg-card text-xs font-bold hover:bg-muted transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <QrCode className="w-3.5 h-3.5 text-primary" />
              <span>Share Kit</span>
            </button>
            {config.whatsappChannelUrl && (
              <button
                onClick={() => window.open(config.whatsappChannelUrl, "_blank")}
                className="px-3 py-1.5 rounded-xl border border-border bg-card text-xs font-bold hover:bg-muted transition-colors flex items-center gap-1.5 cursor-pointer text-emerald-600 dark:text-emerald-400 shadow-2xs"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Channel</span>
              </button>
            )}
          </div>
        </div>

        {/* Right side Commission & Quick Control Card */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-4 shrink-0">
          <div>
            <span className="text-[10px] uppercase font-bold text-muted-foreground block">
              Store Commissions
            </span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
              GH₵ {storeMetrics.totalCommission.toFixed(2)}
            </div>
            <span className="text-[11px] text-muted-foreground">
              MTN & Telecel MoMo
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-full border border-border bg-muted/40 text-xs">
              <span className="font-bold text-foreground">
                {isLive ? "Online" : "Paused"}
              </span>
              <Switch
                checked={isLive}
                onCheckedChange={(checked) =>
                  updateConfig({ status: checked ? "published" : "paused" })
                }
              />
            </div>
            <Button
              size="sm"
              onClick={handleManualSave}
              className="px-4 py-2 font-extrabold text-xs transition-all shadow-sm cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 mr-1" />
              Save Changes
            </Button>
          </div>
        </div>
      </div>

      {/* Paused state notification if store is offline */}
      {!isLive && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-900 dark:text-amber-300 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-950 dark:text-amber-200">
                Your Storefront is Currently Paused
              </h4>
              <p className="text-xs text-amber-900/80 dark:text-amber-300/80">
                Visitors will see an offline maintenance notice. Customers
                cannot checkout until enabled.
              </p>
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => updateConfig({ status: "published" })}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0 cursor-pointer shadow-xs"
          >
            <Power className="w-3.5 h-3.5 mr-1" />
            <span>Go Live Now</span>
          </Button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. STATS CARDS ROW (Exact AgentDashboard Design Match) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-card border border-border shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Today's Store Profit
            </span>
            <Delta
              now={storeMetrics.totalCommission}
              prev={Math.round(storeMetrics.totalCommission * 0.8)}
            />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums mt-1">
            +GH₵ {storeMetrics.totalCommission.toFixed(2)}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            From {storeMetrics.totalOrders} customer orders
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Total Revenue GMV
            </span>
            <Delta
              now={storeMetrics.totalRevenue}
              prev={Math.round(storeMetrics.totalRevenue * 0.82)}
            />
          </div>
          <div className="text-2xl font-black text-foreground tabular-nums mt-1">
            GH₵ {storeMetrics.totalRevenue.toFixed(2)}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            +18.4% vs last month
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Store Customers
            </span>
            <Delta
              now={storeMetrics.uniqueCustomers}
              prev={Math.round(storeMetrics.uniqueCustomers * 0.75)}
            />
          </div>
          <div className="text-2xl font-black text-foreground tabular-nums mt-1">
            {storeMetrics.uniqueCustomers}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Direct mobile buyers
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Gateway SLA Reliability
            </span>
            <Delta now={storeMetrics.successRate} prev={99.1} />
          </div>
          <div className="text-2xl font-black text-primary tabular-nums mt-1">
            {storeMetrics.successRate}%
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Instant carrier EVD delivery
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. NAVIGATION TABS (Increased Height with Horizontal ScrollArea) */}
      {/* ========================================================================= */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <ScrollArea className="w-full whitespace-nowrap pb-2">
          <div className="min-w-full p-1">
            <TabsList className="inline-flex h-14 w-max min-w-full items-center justify-start gap-1.5 rounded-2xl border border-border/80 bg-muted/70 p-1.5 text-muted-foreground shadow-2xs">
              <TabsTrigger
                value="branding"
                className="h-6 rounded-xl px-4 py-2 text-[12px]  flex items-center gap-2 transition-all data-active:!bg-background data-active:text-foreground data-active:shadow-sm"
              >
                <Store className="w-4 h-4 text-primary" />
                <span>Branding & Identity</span>
              </TabsTrigger>
              <TabsTrigger
                value="pricing"
                className="h-6 rounded-xl px-4 py-2 text-[12px]  flex items-center gap-2 transition-all data-active:!bg-background data-active:text-foreground data-active:shadow-sm"
              >
                <Sliders className="w-4 h-4 text-amber-500" />
                <span>Products & Pricing</span>
              </TabsTrigger>
              <TabsTrigger
                value="insights"
                className="h-6 rounded-xl px-4 py-2 text-[12px]  flex items-center gap-2 transition-all data-active:!bg-background data-active:text-foreground data-active:shadow-sm"
              >
                <BarChart3 className="w-4 h-4 text-emerald-500" />
                <span>Store Insights</span>
              </TabsTrigger>
              <TabsTrigger
                value="discounts"
                className="h-6 rounded-xl px-4 py-2 text-[12px]  flex items-center gap-2 transition-all data-active:!bg-background data-active:text-foreground data-active:shadow-sm"
              >
                <Tag className="w-4 h-4 text-blue-500" />
                <span>Discount Codes</span>
              </TabsTrigger>
              <TabsTrigger
                value="sharing"
                className="h-6 rounded-xl px-4 py-2 text-[12px]  flex items-center gap-2 transition-all data-active:!bg-background data-active:text-foreground data-active:shadow-sm"
              >
                <Share2 className="w-4 h-4 text-purple-500" />
                <span>Links & Sharing</span>
              </TabsTrigger>
              <TabsTrigger
                value="orders"
                className="h-6 rounded-xl px-4 py-2 text-[12px]  flex items-center gap-2 transition-all data-active:!bg-background data-active:text-foreground data-active:shadow-sm"
              >
                <Clock className="w-4 h-4 text-rose-500" />
                <span>Recent Store Orders</span>
              </TabsTrigger>
            </TabsList>
          </div>
          <ScrollBar orientation="horizontal" className="h-2" />
        </ScrollArea>

        {/* ========================================================================= */}
        {/* TAB 1: BRANDING & IDENTITY */}
        {/* ========================================================================= */}
        <TabsContent
          value="branding"
          className="space-y-6 animate-in fade-in-50"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Col: Live Preview Chip & Visual Branding */}
            <div className="lg:col-span-5 space-y-4">
              <Card className="rounded-2xl bg-card shadow-xs">
                <CardHeader className="pb-3 border-b border-border">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-extrabold flex items-center gap-1.5 text-foreground">
                      <Eye className="w-4 h-4 text-primary" />
                      <span>Live Storefront Chip</span>
                    </CardTitle>
                    <a
                      href={fullStoreUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-primary flex items-center gap-1 h-7 px-2 hover:underline cursor-pointer inline-flex"
                    >
                      <span>Full View</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </a>
                  </div>
                  <CardDescription className="text-xs">
                    Interactive miniature preview of your public store header
                    matching PublicStorefront.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  {/* Miniature Preview Chip Component */}
                  <StorePreviewChip store={config} />

                  {/* Logo Upload Component */}
                  <div className="pt-2 border-t border-border">
                    <LogoUpload
                      store={config}
                      updateStore={updateConfig}
                      toast={showToast}
                    />
                  </div>

                  {/* Theme Color Palette Picker */}
                  <div className="pt-3 border-t border-border space-y-2.5">
                    <label className="text-xs font-bold text-foreground block">
                      Store Brand Theme Color
                    </label>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                      {COLOR_PRESETS.map((p) => {
                        const isSelected =
                          config.themeColor.toLowerCase() ===
                          p.hex.toLowerCase();
                        return (
                          <button
                            key={p.hex}
                            type="button"
                            onClick={() => updateConfig({ themeColor: p.hex })}
                            title={p.name}
                            className={`h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ring-offset-background ${
                              isSelected
                                ? "ring-2 ring-foreground ring-offset-2 scale-105 shadow-xs"
                                : "hover:scale-105 opacity-90"
                            }`}
                            style={{ background: p.hex }}
                          >
                            {isSelected && (
                              <Check
                                className="w-4 h-4 text-white"
                                strokeWidth={3}
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom Hex input */}
                    <div className="flex items-center gap-2 pt-1">
                      <div
                        className="w-8 h-8 rounded-lg border border-border shrink-0"
                        style={{ background: config.themeColor }}
                      />
                      <Input
                        type="text"
                        value={config.themeColor}
                        onChange={(e) =>
                          updateConfig({ themeColor: e.target.value })
                        }
                        placeholder="#2563eb"
                        className="text-xs h-8 font-semibold uppercase tracking-wider"
                      />
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap font-medium">
                        Custom Hex
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Col: Store Identity Form */}
            <div className="lg:col-span-7">
              <Card className="rounded-2xl bg-card shadow-xs">
                <CardHeader className="border-b border-border pb-4">
                  <CardTitle className="text-sm font-extrabold flex items-center gap-1.5 text-foreground">
                    <Store className="w-4 h-4 text-primary" />
                    <span>Storefront Identity & Contact Information</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Configure your business name, public URL slug, customer
                    tagline, and WhatsApp support desk.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  {/* Store Display Name */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="store-name-input"
                      className="text-xs font-bold text-foreground"
                    >
                      Store Display Name
                    </Label>
                    <Input
                      id="store-name-input"
                      type="text"
                      value={config.storeName}
                      onChange={(e) =>
                        updateConfig({ storeName: e.target.value })
                      }
                      placeholder="e.g. Kofi Telecom Express"
                      className="font-semibold text-xs"
                    />
                  </div>

                  {/* Store Handle / Slug */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="store-slug-input"
                      className="text-xs font-bold text-foreground"
                    >
                      Store Handle (URL Slug)
                    </Label>
                    <div className="flex items-center rounded-lg h-10 border border-input bg-background px-3 py-2 text-xs text-muted-foreground focus-within:ring-2 focus-within:ring-primary/20">
                      <span className="font-semibold text-muted-foreground">
                        smartdatahub.com/store/
                      </span>
                      <input
                        id="store-slug-input"
                        type="text"
                        value={config.handle}
                        onChange={(e) =>
                          updateConfig({
                            handle: e.target.value
                              .toLowerCase()
                              .replace(/[^a-z0-9-]/g, "-"),
                          })
                        }
                        className="w-full bg-transparent text-foreground font-bold focus:outline-hidden pl-1"
                      />
                    </div>
                  </div>

                  {/* Tagline */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="store-tagline-input"
                      className="text-xs font-bold text-foreground"
                    >
                      Business Tagline
                    </Label>
                    <Input
                      id="store-tagline-input"
                      type="text"
                      value={config.tagline}
                      onChange={(e) =>
                        updateConfig({ tagline: e.target.value })
                      }
                      placeholder="e.g. Instant Non-Expiry Data & Exam Vouchers in Ghana"
                      className="text-xs font-medium"
                    />
                  </div>

                  {/* Broadcast Announcement Banner */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="store-announcement-input"
                      className="text-xs font-bold text-foreground"
                    >
                      Broadcast Announcement Banner
                    </Label>
                    <Input
                      id="store-announcement-input"
                      type="text"
                      value={config.announcement}
                      onChange={(e) =>
                        updateConfig({ announcement: e.target.value })
                      }
                      placeholder="e.g. Fast delivery within 60 seconds! 24/7 WhatsApp support."
                      className="text-xs font-medium"
                    />
                  </div>

                  {/* Contact Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="store-whatsapp-phone"
                        className="text-xs font-bold text-foreground flex items-center gap-1.5"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>WhatsApp Support Desk</span>
                      </Label>
                      <Input
                        id="store-whatsapp-phone"
                        type="tel"
                        value={config.whatsappNumber}
                        onChange={(e) =>
                          updateConfig({ whatsappNumber: e.target.value })
                        }
                        placeholder="Enter Phone Number"
                        className="text-xs font-semibold tabular-nums"
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Customers can message you directly with questions.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <Label
                        htmlFor="store-channel-url"
                        className="text-xs font-bold text-foreground flex items-center gap-1.5"
                      >
                        <Radio className="w-3.5 h-3.5 text-blue-500" />
                        <span>WhatsApp Channel Link</span>
                      </Label>
                      <Input
                        id="store-channel-url"
                        type="url"
                        value={config.whatsappChannelUrl || ""}
                        onChange={(e) =>
                          updateConfig({ whatsappChannelUrl: e.target.value })
                        }
                        placeholder="https://whatsapp.com/channel/..."
                        className="text-xs font-semibold"
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Allows customers to join your daily broadcast group.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 2: PRODUCTS & PRICING (Table matching CustomerWalletView pattern) */}
        {/* ========================================================================= */}
        <TabsContent
          value="pricing"
          className="space-y-6 animate-in fade-in-50"
        >
          {/* Network and Service Toggles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Network Toggles */}
            <Card className="rounded-2xl bg-card shadow-xs">
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-sm font-extrabold flex items-center gap-1.5 text-foreground">
                  <Radio className="w-4 h-4 text-primary" />
                  <span>Network Catalog Toggles</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Choose which telecom networks are active and visible in your
                  storefront.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {[
                  {
                    id: "MTN",
                    label: "MTN Ghana Data",
                    color: "bg-amber-400 text-amber-950",
                  },
                  {
                    id: "Telecel",
                    label: "Telecel Ghana Data",
                    color: "bg-red-500 text-white",
                  },
                  {
                    id: "AirtelTigo",
                    label: "AT (AirtelTigo) Data",
                    color: "bg-blue-600 text-white",
                  },
                  {
                    id: "AT_ISHARE",
                    label: "AT iShare Corporate Bundles",
                    color: "bg-blue-500 text-white",
                  },
                  {
                    id: "AT_BIGTIME",
                    label: "AT BigTime Bundles",
                    color: "bg-indigo-600 text-white",
                  },
                  {
                    id: "MTN_XPRESS",
                    label: "MTN Xpress Priority Bundles",
                    color: "bg-yellow-500 text-black",
                  },
                ].map((net) => {
                  const isEnabled = (config.enabledNetworks || []).includes(
                    net.id as any,
                  );
                  return (
                    <div
                      key={net.id}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-muted/20"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-black ${net.color}`}
                        >
                          {net.id.split("_")[0]}
                        </span>
                        <span className="text-xs font-bold text-foreground">
                          {net.label}
                        </span>
                      </div>
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={() => toggleNetwork(net.id as any)}
                      />
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Service & Product Toggles */}
            <Card className="rounded-2xl bg-card shadow-xs">
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-sm font-extrabold flex items-center gap-1.5 text-foreground">
                  <Layers className="w-4 h-4 text-primary" />
                  <span>Additional Services Toggles</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Sell exams result checkers, airtime top-ups, and farmer
                  association registrations.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {[
                  {
                    key: "airtime" as const,
                    title: "Airtime VTU Top-Up",
                    desc: "MTN, Telecel, and AT instant airtime recharging",
                  },
                  {
                    key: "checker" as const,
                    title: "Exam Result Checkers",
                    desc: "WASSCE, BECE, CSSPS, and NOVDEC serial tokens",
                  },
                  {
                    key: "afa" as const,
                    title: "AFA Registration Service",
                    desc: "Authorized Farmers Association Ghana member onboarding",
                  },
                ].map((srv) => {
                  const active = config.enabledServices?.[srv.key] ?? true;
                  return (
                    <div
                      key={srv.key}
                      className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/20"
                    >
                      <div>
                        <div className="text-xs font-bold text-foreground">
                          {srv.title}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {srv.desc}
                        </div>
                      </div>
                      <Switch
                        checked={active}
                        onCheckedChange={() => toggleService(srv.key)}
                      />
                    </div>
                  );
                })}

                {/* Guest Checkout Toggle */}
                <div className="pt-3 border-t border-border flex items-center justify-between p-2">
                  <div>
                    <div className="text-xs font-bold text-foreground">
                      Guest Checkout
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      Allow customers to buy without creating an account
                    </div>
                  </div>
                  <Switch
                    checked={config.allowGuestCheckout}
                    onCheckedChange={(checked) =>
                      updateConfig({ allowGuestCheckout: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Global Retail Markup Slider Card */}
          <Card className="rounded-2xl bg-card shadow-xs">
            <CardContent className="p-5 space-y-4">
              {(() => {
                const currentMarkup =
                  typeof config.marginMarkupPercent === "number" &&
                  !isNaN(config.marginMarkupPercent)
                    ? config.marginMarkupPercent
                    : 8;

                return (
                  <>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div>
                        <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                          <Sliders className="w-4 h-4 text-primary" />
                          <span>Global Retail Markup Margin</span>
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Automatically computes your retail selling prices
                          above carrier wholesale cost.
                        </p>
                      </div>
                      <div className="px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-primary font-black text-sm tabular-nums">
                        +{currentMarkup}% Markup
                      </div>
                    </div>

                    {/* Slider & Quick presets */}
                    <div className="space-y-3">
                      <Slider
                        value={[currentMarkup]}
                        onValueChange={(values) => {
                          const val = Array.isArray(values)
                            ? values[0]
                            : values;
                          if (typeof val === "number" && !isNaN(val)) {
                            updateConfig({ marginMarkupPercent: val });
                          }
                        }}
                        min={2}
                        max={25}
                        step={1}
                        className="w-full"
                      />

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground">
                            Quick Presets:
                          </span>
                          {[5, 8, 10, 12, 15, 20].map((p) => (
                            <Button
                              key={p}
                              variant={
                                currentMarkup === p ? "default" : "outline"
                              }
                              size="sm"
                              onClick={() => applyMarkupPercent(p)}
                              className="h-7 px-2.5 text-[11px] font-bold cursor-pointer tabular-nums"
                            >
                              +{p}%
                            </Button>
                          ))}
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleResetCustomPrices}
                          className="h-7 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Reset custom prices</span>
                        </Button>
                      </div>
                    </div>
                  </>
                );
              })()}
            </CardContent>
          </Card>

          {/* Product Wholesale Catalog & Pricing Table (CustomerWalletView Table Architecture) */}
          <Card className="rounded-2xl bg-card shadow-xs">
            <CardHeader className="border-b border-border pb-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-base font-extrabold text-foreground">
                  Product Catalog & Wholesale Pricing
                </CardTitle>
                <CardDescription className="mt-1 text-xs">
                  Wholesale carrier rates synced with SDH gateway. Selling
                  prices are floor-protected against cost.
                </CardDescription>
              </div>
            </CardHeader>

            {/* Search + Filters (Matching CustomerWalletView exactly) */}
            <div className="border-b border-border bg-muted/20 p-4">
              <div className="space-y-4">
                {/* Search */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="catalog-search"
                    className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
                  >
                    Search packages
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="catalog-search"
                      type="text"
                      placeholder="Bundle name, data size (e.g. 5GB, 10GB), validity..."
                      value={pricingSearch}
                      onChange={(e) => setPricingSearch(e.target.value)}
                      className="h-10 bg-background pl-9 text-xs font-medium"
                    />
                  </div>
                </div>

                {/* Filters Box */}
                <div className="rounded-xl border border-border bg-background p-3">
                  <div className="mb-3 flex items-center gap-2">
                    <SlidersHorizontal className="size-3.5 text-muted-foreground" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Catalog filters
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {/* Network Filter */}
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="network-filter-select"
                        className="text-[10px] font-semibold text-muted-foreground"
                      >
                        Telecom Carrier
                      </Label>
                      <Select
                        value={pricingFilter}
                        onValueChange={setPricingFilter}
                      >
                        <SelectTrigger
                          id="network-filter-select"
                          className="h-9 w-full text-xs font-semibold"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">
                            All telecom carriers
                          </SelectItem>
                          <SelectItem value="MTN">MTN Ghana</SelectItem>
                          <SelectItem value="Telecel">Telecel Ghana</SelectItem>
                          <SelectItem value="AirtelTigo">
                            AT (AirtelTigo)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Category Filter */}
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="category-filter-select"
                        className="text-[10px] font-semibold text-muted-foreground"
                      >
                        Bundle Tier
                      </Label>
                      <Select
                        value={pricingCategoryFilter}
                        onValueChange={setPricingCategoryFilter}
                      >
                        <SelectTrigger
                          id="category-filter-select"
                          className="h-9 w-full text-xs font-semibold"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All data sizes</SelectItem>
                          <SelectItem value="high_volume">
                            Heavy Volume (10GB+)
                          </SelectItem>
                          <SelectItem value="standard">
                            Standard (5GB - 10GB)
                          </SelectItem>
                          <SelectItem value="starter">
                            Starter (Under 5GB)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Filter Status Footer */}
                  <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      {hasPricingFilters ? (
                        <>
                          <span className="size-1.5 rounded-full bg-primary" />
                          <span>Filters are currently active</span>
                        </>
                      ) : (
                        <>
                          <span className="size-1.5 rounded-full bg-muted-foreground/40" />
                          <span>Showing all wholesale packages</span>
                        </>
                      )}
                    </div>

                    {hasPricingFilters && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={resetPricingFilters}
                        className="text-xs font-bold"
                      >
                        Reset all filters
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Table Content */}
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bundle / Package</TableHead>
                    <TableHead>Carrier</TableHead>
                    <TableHead className="text-right">
                      Wholesale Cost (GH₵)
                    </TableHead>
                    <TableHead className="text-center">
                      Your Retail Price (GH₵)
                    </TableHead>
                    <TableHead className="text-right">
                      Profit / Sale (GH₵)
                    </TableHead>
                    <TableHead className="text-right">
                      Reseller Margin
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedBundles.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="py-10 text-center text-muted-foreground"
                      >
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <AlertCircle className="size-5 text-muted-foreground/60" />
                          <p className="text-xs font-semibold">
                            No data bundles match your filters.
                          </p>
                          <Button
                            variant="link"
                            size="sm"
                            onClick={resetPricingFilters}
                            className="text-xs font-bold"
                          >
                            Clear all filters
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedBundles.map((b) => {
                      const customPrice = config.customPrices?.[b.id];
                      const activeMarkup =
                        typeof config.marginMarkupPercent === "number" &&
                        !isNaN(config.marginMarkupPercent)
                          ? config.marginMarkupPercent
                          : 8;
                      const effectivePrice =
                        customPrice !== undefined
                          ? customPrice
                          : Number(
                              (
                                b.wholesalePrice *
                                (1 + activeMarkup / 100)
                              ).toFixed(2),
                            );
                      const profit = Math.max(
                        0,
                        effectivePrice - b.wholesalePrice,
                      );
                      const marginPct = (
                        (profit / b.wholesalePrice) *
                        100
                      ).toFixed(1);

                      return (
                        <TableRow key={b.id} className="hover:bg-muted/40">
                          <TableCell className="text-xs font-bold text-foreground">
                            <div>{b.name}</div>
                            <div className="text-[10px] font-semibold text-muted-foreground">
                              {b.validity}
                            </div>
                          </TableCell>

                          <TableCell>
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                                b.network === "MTN"
                                  ? "bg-amber-400/15 text-amber-700 dark:text-amber-400"
                                  : b.network === "Telecel"
                                    ? "bg-red-500/15 text-red-700 dark:text-red-400"
                                    : "bg-blue-500/15 text-blue-700 dark:text-blue-400"
                              }`}
                            >
                              <span
                                className={`size-1.5 rounded-full ${
                                  b.network === "MTN"
                                    ? "bg-amber-500"
                                    : b.network === "Telecel"
                                      ? "bg-red-500"
                                      : "bg-blue-500"
                                }`}
                              />
                              {b.network}
                            </span>
                          </TableCell>

                          <TableCell className="text-right text-xs font-semibold tabular-nums text-muted-foreground">
                            {b.wholesalePrice.toFixed(2)}
                          </TableCell>

                          {/* StorePrice component with floor validation */}
                          <TableCell className="text-center">
                            <StorePrice
                              value={effectivePrice}
                              floor={b.wholesalePrice}
                              onChange={(newVal) => {
                                const updated = {
                                  ...(config.customPrices || {}),
                                  [b.id]: newVal,
                                };
                                updateConfig({ customPrices: updated });
                              }}
                            />
                          </TableCell>

                          <TableCell className="text-right text-xs font-black tabular-nums text-emerald-600 dark:text-emerald-400">
                            +{profit.toFixed(2)}
                          </TableCell>

                          <TableCell className="text-right text-xs font-bold tabular-nums text-muted-foreground">
                            +{marginPct}%
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>

              {/* Pricing Pagination Footer (Matching CustomerWalletView) */}
              <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs text-muted-foreground">
                  Showing{" "}
                  <span className="font-bold text-foreground tabular-nums">
                    {filteredBundles.length === 0
                      ? 0
                      : Math.min(
                          pricingPage * PRICING_PER_PAGE,
                          filteredBundles.length,
                        )}
                  </span>{" "}
                  of{" "}
                  <span className="font-bold text-foreground tabular-nums">
                    {filteredBundles.length}
                  </span>{" "}
                  packages
                </span>

                {filteredBundles.length > PRICING_PER_PAGE && (
                  <div>
                    <PaginationHelper
                      currentPage={pricingPage}
                      totalPages={totalPricingPages}
                      onPageChange={setPricingPage}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 3: STORE INSIGHTS */}
        {/* ========================================================================= */}
        <TabsContent
          value="insights"
          className="space-y-6 animate-in fade-in-50"
        >
          <StoreInsights orders={storeOrders} bundles={bundles} />
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 4: DISCOUNT CODES */}
        {/* ========================================================================= */}
        <TabsContent
          value="discounts"
          className="space-y-6 animate-in fade-in-50"
        >
          <Card className="rounded-2xl bg-card shadow-xs">
            <CardContent className="p-6">
              <PromoCodeList
                promoCodes={config.promoCodes || []}
                onUpdate={(codes) => {
                  updateConfig({ promoCodes: codes });
                  showToast("Discount codes updated");
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 5: LINKS & SHARING */}
        {/* ========================================================================= */}
        <TabsContent
          value="sharing"
          className="space-y-6 animate-in fade-in-50"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Store Link & QR Code Card */}
            <Card className="rounded-2xl bg-card shadow-xs">
              <CardHeader className="border-b border-border pb-4">
                <CardTitle className="text-sm font-extrabold flex items-center gap-1.5 text-foreground">
                  <Globe className="w-4 h-4 text-primary" />
                  <span>Public Storefront Link & Instant QR</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Share this link with customers on social media, WhatsApp
                  groups, and business cards.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="p-3 rounded-xl border border-border bg-muted/30 flex items-center justify-between gap-2">
                  <div className="text-xs font-bold truncate text-foreground">
                    {fullStoreUrl}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyStoreLink}
                    className="shrink-0 text-xs font-bold"
                  >
                    {copiedLink ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedLink ? "Copied" : "Copy"}</span>
                  </Button>
                </div>

                {/* QR Code Container */}
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl border border-border bg-card">
                  <div className="p-2 bg-white rounded-xl border border-border shadow-xs shrink-0">
                    <PseudoQR seed={config.handle} size={110} />
                  </div>
                  <div className="space-y-2 text-center sm:text-left">
                    <div className="font-bold text-xs text-foreground">
                      Instant Mobile Order QR
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Point phone camera to open storefront with zero typing.
                      Great for print flyers and retail posters.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShareKitOpen(true)}
                      className="text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5 text-primary" />
                      <span>Open Full Share Kit</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* WhatsApp Channel & Direct Sharing */}
            <Card className="rounded-2xl  bg-card shadow-xs">
              <CardHeader className="border-b border-border pb-4">
                <CardTitle className="text-sm font-extrabold flex items-center gap-1.5 text-foreground">
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>WhatsApp Channel & Social Broadcast</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Connect your reseller channel and broadcast daily non-expiry
                  data deals directly.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                {/* Channel Link */}
                <div className="p-3 rounded-xl border border-border bg-muted/30 space-y-2">
                  <div className="text-[10px] uppercase font-bold text-muted-foreground">
                    Reseller WhatsApp Channel
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs truncate text-foreground font-semibold">
                      {config.whatsappChannelUrl ||
                        "No channel link configured"}
                    </div>
                    {config.whatsappChannelUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyChannelLink}
                        className="shrink-0 text-xs font-bold"
                      >
                        {copiedChannel ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>{copiedChannel ? "Copied" : "Copy"}</span>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Social Quick Share Buttons */}
                <div className="space-y-2 pt-1">
                  <label className="text-xs font-bold text-foreground block">
                    One-Click Status Share
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const text = encodeURIComponent(
                          `🔥 Fast, non-expiry data on ${config.storeName}! MTN, Telecel, AT.\n\nBuy now: ${fullStoreUrl}`,
                        );
                        window.open(`https://wa.me/?text=${text}`, "_blank");
                      }}
                      className="text-xs font-bold flex items-center justify-center gap-1.5 bg-emerald-600/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-600/20"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp Status</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const url = encodeURIComponent(fullStoreUrl);
                        window.open(
                          `https://www.facebook.com/sharer/sharer.php?u=${url}`,
                          "_blank",
                        );
                      }}
                      className="text-xs font-bold flex items-center justify-center gap-1.5"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Facebook</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const text = encodeURIComponent(
                          `Buy instant non-expiry data on ${config.storeName}: ${fullStoreUrl}`,
                        );
                        window.open(
                          `https://t.me/share/url?url=${encodeURIComponent(fullStoreUrl)}&text=${text}`,
                          "_blank",
                        );
                      }}
                      className="text-xs font-bold flex items-center justify-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Telegram</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const text = encodeURIComponent(
                          `Buy instant non-expiry data on ${config.storeName} with instant MoMo delivery!`,
                        );
                        window.open(
                          `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(fullStoreUrl)}`,
                          "_blank",
                        );
                      }}
                      className="text-xs font-bold flex items-center justify-center gap-1.5"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>X (Twitter)</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 6: RECENT STORE ORDERS (Table matching CustomerWalletView pattern) */}
        {/* ========================================================================= */}
        <TabsContent value="orders" className="space-y-6 animate-in fade-in-50">
          <Card className="rounded-2xl bg-card shadow-xs">
            <CardHeader className="border-b border-border pb-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-base font-extrabold text-foreground">
                  Recent Store Orders & EVD Ledger
                </CardTitle>
                <CardDescription className="mt-1 text-xs">
                  Audit trail of buyer orders auto-routed through your branded
                  storefront with profit margins.
                </CardDescription>
              </div>
            </CardHeader>

            {/* Orders Search + Filters (CustomerWalletView pattern) */}
            <div className="border-b border-border bg-muted/20 p-4">
              <div className="space-y-4">
                {/* Search */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="orders-search"
                    className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
                  >
                    Search store orders
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="orders-search"
                      type="text"
                      placeholder="Reference, customer phone, or package..."
                      value={ordersSearch}
                      onChange={(e) => setOrdersSearch(e.target.value)}
                      className="h-10 bg-background pl-9 text-xs font-medium"
                    />
                  </div>
                </div>

                {/* Filters */}
                <div className="rounded-xl border border-border bg-background p-3">
                  <div className="mb-3 flex items-center gap-2">
                    <SlidersHorizontal className="size-3.5 text-muted-foreground" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Order filters
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {/* Status */}
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="order-status-filter"
                        className="text-[10px] font-semibold text-muted-foreground"
                      >
                        Delivery Status
                      </Label>
                      <Select
                        value={ordersStatusFilter}
                        onValueChange={setOrdersStatusFilter}
                      >
                        <SelectTrigger
                          id="order-status-filter"
                          className="h-9 w-full text-xs font-semibold"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">
                            All delivery statuses
                          </SelectItem>
                          <SelectItem value="delivered">
                            Delivered / Completed
                          </SelectItem>
                          <SelectItem value="processing">
                            Processing / In Transit
                          </SelectItem>
                          <SelectItem value="failed">
                            Failed / Refunded
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Network */}
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="order-network-filter"
                        className="text-[10px] font-semibold text-muted-foreground"
                      >
                        Carrier Network
                      </Label>
                      <Select
                        value={ordersNetworkFilter}
                        onValueChange={setOrdersNetworkFilter}
                      >
                        <SelectTrigger
                          id="order-network-filter"
                          className="h-9 w-full text-xs font-semibold"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">
                            All carrier networks
                          </SelectItem>
                          <SelectItem value="MTN">MTN Ghana</SelectItem>
                          <SelectItem value="Telecel">Telecel Ghana</SelectItem>
                          <SelectItem value="AirtelTigo">
                            AT (AirtelTigo)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Filter Status Footer */}
                  <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      {hasOrderFilters ? (
                        <>
                          <span className="size-1.5 rounded-full bg-primary" />
                          <span>Filters are currently active</span>
                        </>
                      ) : (
                        <>
                          <span className="size-1.5 rounded-full bg-muted-foreground/40" />
                          <span>Showing all customer orders</span>
                        </>
                      )}
                    </div>

                    {hasOrderFilters && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={resetOrderFilters}
                        className="text-xs font-bold"
                      >
                        Reset all filters
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Table */}
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Customer Phone</TableHead>
                    <TableHead>Package</TableHead>
                    <TableHead>Carrier</TableHead>
                    <TableHead className="text-right">
                      Price Paid (GH₵)
                    </TableHead>
                    <TableHead className="text-right">
                      Your Margin (GH₵)
                    </TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedOrders.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="py-10 text-center text-muted-foreground"
                      >
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <AlertCircle className="size-5 text-muted-foreground/60" />
                          <p className="text-xs font-semibold">
                            No store orders match your filters.
                          </p>
                          <Button
                            variant="link"
                            size="sm"
                            onClick={resetOrderFilters}
                            className="text-xs font-bold"
                          >
                            Clear all filters
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedOrders.map((o) => {
                      const isDelivered = o.status === "delivered";
                      const isPending =
                        o.status === "processing" ||
                        o.status === "pending_payment";
                      const margin = o.agentMargin || o.amount * 0.08;

                      return (
                        <TableRow key={o.id} className="hover:bg-muted/40">
                          <TableCell className="text-xs font-bold text-foreground">
                            {o.reference}
                          </TableCell>

                          <TableCell className="text-xs tabular-nums text-muted-foreground">
                            {o.date}
                          </TableCell>

                          <TableCell className="text-xs font-bold tabular-nums text-foreground">
                            {o.recipientPhone}
                          </TableCell>

                          <TableCell className="font-medium text-xs text-foreground">
                            {o.productName}
                          </TableCell>

                          <TableCell>
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                                o.network.includes("MTN")
                                  ? "bg-amber-400/15 text-amber-700 dark:text-amber-400"
                                  : o.network.includes("Telecel")
                                    ? "bg-red-500/15 text-red-700 dark:text-red-400"
                                    : "bg-blue-500/15 text-blue-700 dark:text-blue-400"
                              }`}
                            >
                              <span
                                className={`size-1.5 rounded-full ${
                                  o.network.includes("MTN")
                                    ? "bg-amber-500"
                                    : o.network.includes("Telecel")
                                      ? "bg-red-500"
                                      : "bg-blue-500"
                                }`}
                              />
                              {o.network}
                            </span>
                          </TableCell>

                          <TableCell className="text-right text-xs font-black tabular-nums text-foreground">
                            {o.amount.toFixed(2)}
                          </TableCell>

                          <TableCell className="text-right text-xs font-black tabular-nums text-emerald-600 dark:text-emerald-400">
                            +{margin.toFixed(2)}
                          </TableCell>

                          <TableCell className="text-right">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                                isDelivered
                                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                                  : isPending
                                    ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                                    : "bg-destructive/15 text-destructive"
                              }`}
                            >
                              <span
                                className={`size-1.5 rounded-full ${
                                  isDelivered
                                    ? "bg-emerald-500"
                                    : isPending
                                      ? "bg-amber-500"
                                      : "bg-destructive"
                                }`}
                              />
                              {o.status}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>

              {/* Order Pagination Footer (CustomerWalletView pattern) */}
              <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs text-muted-foreground">
                  Showing{" "}
                  <span className="font-bold text-foreground tabular-nums">
                    {displayedOrders.length === 0
                      ? 0
                      : Math.min(
                          ordersPage * ORDERS_PER_PAGE,
                          displayedOrders.length,
                        )}
                  </span>{" "}
                  of{" "}
                  <span className="font-bold text-foreground tabular-nums">
                    {displayedOrders.length}
                  </span>{" "}
                  orders
                </span>

                {displayedOrders.length > ORDERS_PER_PAGE && (
                  <div>
                    <PaginationHelper
                      currentPage={ordersPage}
                      totalPages={totalOrdersPages}
                      onPageChange={setOrdersPage}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ========================================================================= */}
      {/* 4. SHARE KIT MODAL */}
      {/* ========================================================================= */}
      <ShareKitModal
        open={shareKitOpen}
        onClose={() => setShareKitOpen(false)}
        store={config}
      />
    </div>
  );
};

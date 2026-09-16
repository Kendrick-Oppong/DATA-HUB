import React, { useState, useMemo, useEffect } from "react";
import {
  SlidersHorizontal,
  Tag,
  ShieldCheck,
  Ticket,
  Zap,
  MessageSquare,
  RotateCcw,
  Check,
  Info,
  Search,
  Percent,
  CheckCircle2,
  PhoneCall,
  Sparkles,
  ArrowUpRight,
  ExternalLink,
  DollarSign,
  AlertTriangle,
  Sliders,
  RefreshCw,
} from "lucide-react";
import { Slider } from "../ui/slider";
import {
  DataBundle,
  Order,
  AgentStoreConfig,
  ResultCheckerProduct,
} from "../../types";
import { INITIAL_CHECKERS } from "../../mockData";
import { StorePrice } from "./store-builder/StorePrice";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Label } from "../ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../ui/card";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../ui/pagination";

interface AgentPricingProps {
  bundles: DataBundle[];
  orders?: Order[];
  storeConfig?: AgentStoreConfig;
  onUpdateBundlePrice?: (bundleId: string, customPrice: number) => void;
  onNavigateTab?: (tab: string) => void;
}

const ITEMS_PER_PAGE = 8;
const AFA_PLATFORM_FEE = 18.0;
const SMS_RATE_PER_PAGE = 0.045; // GH₵ 0.025 supplier + GH₵ 0.020 SDH platform fee

type ProductLineKey =
  | "all"
  | "mtn_standard"
  | "mtn_xpress"
  | "telecel"
  | "at_ishare"
  | "at_bigtime";

export const AgentPricing: React.FC<AgentPricingProps> = ({
  bundles,
  storeConfig,
  onUpdateBundlePrice,
  onNavigateTab,
}) => {
  // Tab navigation: data, afa, checker, utilities, sms
  const [activeTab, setActiveTab] = useState<string>("data");

  // Global retail markup state (matches MyStoreBuilder)
  const [currentMarkup, setCurrentMarkup] = useState<number>(
    storeConfig?.marginMarkupPercent ?? 12,
  );

  // Data Bundles Filters
  const [lineFilter, setLineFilter] = useState<ProductLineKey>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [marginFilter, setMarginFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Custom Prices state for data bundles
  const [bundlePrices, setBundlePrices] = useState<Record<string, number>>(
    () => {
      try {
        const saved = localStorage.getItem("sdh_custom_bundle_prices");
        if (saved) {
          return JSON.parse(saved);
        }
      } catch {
        // ignore
      }
      const initial: Record<string, number> = {};
      const defaultMarkup = storeConfig?.marginMarkupPercent ?? 12;
      bundles.forEach((b) => {
        initial[b.id] = Number(
          (b.wholesalePrice * (1 + defaultMarkup / 100)).toFixed(2),
        );
      });
      return initial;
    },
  );

  // Custom Prices for Results Checkers
  const [checkerPrices, setCheckerPrices] = useState<Record<string, number>>(
    () => {
      try {
        const saved = localStorage.getItem("sdh_custom_checker_prices");
        if (saved) {
          return JSON.parse(saved);
        }
      } catch {
        // ignore
      }
      const initial: Record<string, number> = {};
      INITIAL_CHECKERS.forEach((c) => {
        initial[c.id] = c.price;
      });
      return initial;
    },
  );

  // Custom Selling Price for AFA
  const [afaSellingPrice, setAfaSellingPrice] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("sdh_custom_afa_price");
      if (saved) {
        const val = parseFloat(saved);
        if (!isNaN(val) && val >= AFA_PLATFORM_FEE) return val;
      }
    } catch {
      // ignore
    }
    return 25.0; // Default agent storefront price (floor: 18.00)
  });

  // Batch Markup Modal State
  const [isMarkupModalOpen, setIsMarkupModalOpen] = useState(false);
  const [customMarkupPct, setCustomMarkupPct] = useState("15");

  // Reset Confirmation Modal
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // Banner / Toast Feedback State
  const [feedbackNotice, setFeedbackNotice] = useState<{
    message: string;
    type: "success" | "info";
  } | null>(null);

  useEffect(() => {
    if (!feedbackNotice) return;
    const timer = setTimeout(() => {
      setFeedbackNotice(null);
    }, 3500);
    return () => clearTimeout(timer);
  }, [feedbackNotice]);

  useEffect(() => {
    setCurrentPage(1);
  }, [lineFilter, searchQuery, categoryFilter, marginFilter]);

  // Helper to get bundle line tag
  const getBundleLineKey = (b: DataBundle): ProductLineKey => {
    if (b.network === "MTN") {
      return b.tier === "xpress" ? "mtn_xpress" : "mtn_standard";
    }
    if (b.network === "Telecel") {
      return "telecel";
    }
    if (b.network === "AirtelTigo") {
      return b.tier === "bigtime" || b.category === "special"
        ? "at_bigtime"
        : "at_ishare";
    }
    return "all";
  };

  // Pricing lines definition
  const productLines = [
    { key: "all" as const, label: "All Product Lines", count: bundles.length },
    {
      key: "mtn_standard" as const,
      label: "MTN Standard",
      badge: "MTN",
      badgeClass:
        "bg-amber-400/20 text-amber-900 dark:text-amber-300 border-amber-400/40",
      count: bundles.filter((b) => b.network === "MTN" && b.tier !== "xpress")
        .length,
    },
    {
      key: "mtn_xpress" as const,
      label: "MTN Xpress",
      badge: "MTN",
      badgeClass:
        "bg-amber-500/20 text-amber-900 dark:text-amber-300 border-amber-500/40",
      count: bundles.filter((b) => b.network === "MTN" && b.tier === "xpress")
        .length,
    },
    {
      key: "telecel" as const,
      label: "Telecel Bossu",
      badge: "Telecel",
      badgeClass:
        "bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/40",
      count: bundles.filter((b) => b.network === "Telecel").length,
    },
    {
      key: "at_ishare" as const,
      label: "AT iShare",
      badge: "AT",
      badgeClass:
        "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/40",
      count: bundles.filter(
        (b) =>
          b.network === "AirtelTigo" &&
          b.tier !== "bigtime" &&
          b.category !== "special",
      ).length,
    },
    {
      key: "at_bigtime" as const,
      label: "AT BigTime (No Expiry)",
      badge: "AT",
      badgeClass:
        "bg-blue-600/20 text-blue-800 dark:text-blue-300 border-blue-600/40",
      count: bundles.filter(
        (b) =>
          b.network === "AirtelTigo" &&
          (b.tier === "bigtime" || b.category === "special"),
      ).length,
    },
  ];

  // Tier bonus calculation helper (SDH pays on top of agent margin)
  const getTierBonus = (b: DataBundle) => {
    if (b.sizeGb >= 50) return 2.5;
    if (b.sizeGb >= 20) return 1.5;
    if (b.sizeGb >= 10) return 0.8;
    if (b.sizeGb >= 5) return 0.4;
    return 0.15;
  };

  // Filtered Bundles
  const filteredBundles = useMemo(() => {
    return bundles.filter((b) => {
      // Line filter
      if (lineFilter !== "all") {
        const line = getBundleLineKey(b);
        if (line !== lineFilter) return false;
      }

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = b.name.toLowerCase().includes(q);
        const matchesNet = b.network.toLowerCase().includes(q);
        const matchesSize =
          `${b.sizeGb}gb`.includes(q) || b.sizeLabel.toLowerCase().includes(q);
        const matchesVal = b.validity.toLowerCase().includes(q);
        if (!matchesName && !matchesNet && !matchesSize && !matchesVal)
          return false;
      }

      // Category filter
      if (categoryFilter === "starter" && b.sizeGb >= 5) return false;
      if (categoryFilter === "popular" && (b.sizeGb < 5 || b.sizeGb > 15))
        return false;
      if (categoryFilter === "high_volume" && b.sizeGb < 20) return false;

      // Margin filter
      const price = bundlePrices[b.id] ?? b.retailPrice;
      const profit = Math.max(0, price - b.wholesalePrice);
      const marginPct =
        b.wholesalePrice > 0 ? (profit / b.wholesalePrice) * 100 : 0;
      if (marginFilter === "high" && marginPct < 15) return false;
      if (marginFilter === "medium" && (marginPct < 8 || marginPct >= 15))
        return false;
      if (marginFilter === "low" && marginPct >= 8) return false;

      return true;
    });
  }, [
    bundles,
    lineFilter,
    searchQuery,
    categoryFilter,
    marginFilter,
    bundlePrices,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredBundles.length / ITEMS_PER_PAGE),
  );
  const paginatedBundles = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredBundles.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredBundles, currentPage]);

  // Overall Statistics across all products
  const stats = useMemo(() => {
    let totalMarginGhs = 0;
    let totalWholesale = 0;
    let maxProfit = 0;

    bundles.forEach((b) => {
      const price = bundlePrices[b.id] ?? b.retailPrice;
      const profit = Math.max(0, price - b.wholesalePrice);
      totalMarginGhs += profit;
      totalWholesale += b.wholesalePrice;
      if (profit > maxProfit) maxProfit = profit;
    });

    const avgMarginGhs =
      bundles.length > 0 ? totalMarginGhs / bundles.length : 0;
    const avgMarginPct =
      totalWholesale > 0 ? (totalMarginGhs / totalWholesale) * 100 : 0;

    return {
      totalBundles: bundles.length,
      avgMarginGhs,
      avgMarginPct,
      maxProfit,
      totalLines: 5,
    };
  }, [bundles, bundlePrices]);

  // Handlers for price changes
  const handlePriceUpdate = (bundleId: string, val: number) => {
    const target = bundles.find((b) => b.id === bundleId);
    const floor = target?.wholesalePrice ?? 0;
    const validVal = Math.max(floor, Number(val.toFixed(2)));

    setBundlePrices((prev) => {
      const updated = { ...prev, [bundleId]: validVal };
      try {
        localStorage.setItem(
          "sdh_custom_bundle_prices",
          JSON.stringify(updated),
        );
      } catch {
        // ignore
      }
      return updated;
    });

    if (onUpdateBundlePrice) {
      onUpdateBundlePrice(bundleId, validVal);
    }
  };

  const handleCheckerPriceUpdate = (checkerId: string, val: number) => {
    const target = INITIAL_CHECKERS.find((c) => c.id === checkerId);
    const floor = target?.wholesalePrice ?? 18.0;
    const validVal = Math.max(floor, Number(val.toFixed(2)));

    setCheckerPrices((prev) => {
      const updated = { ...prev, [checkerId]: validVal };
      try {
        localStorage.setItem(
          "sdh_custom_checker_prices",
          JSON.stringify(updated),
        );
      } catch {
        // ignore
      }
      return updated;
    });

    setFeedbackNotice({
      message: `Updated ${target?.title ?? "checker"} price to GH₵ ${validVal.toFixed(2)}`,
      type: "success",
    });
  };

  const handleAfaPriceUpdate = (val: number) => {
    const validVal = Math.max(AFA_PLATFORM_FEE, Number(val.toFixed(2)));
    setAfaSellingPrice(validVal);
    try {
      localStorage.setItem("sdh_custom_afa_price", validVal.toString());
    } catch {
      // ignore
    }
    setFeedbackNotice({
      message: `MTN AFA storefront price saved: GH₵ ${validVal.toFixed(2)} (Your profit: GH₵ ${(validVal - AFA_PLATFORM_FEE).toFixed(2)})`,
      type: "success",
    });
  };

  // Apply batch markup to currently filtered bundles or active line
  const handleApplyBatchMarkup = (pct: number) => {
    setCurrentMarkup(pct);
    const targetBundles =
      lineFilter === "all"
        ? bundles
        : bundles.filter((b) => getBundleLineKey(b) === lineFilter);

    setBundlePrices((prev) => {
      const updated = { ...prev };
      targetBundles.forEach((b) => {
        const markedPrice = Number(
          (b.wholesalePrice * (1 + pct / 100)).toFixed(2),
        );
        updated[b.id] = Math.max(b.wholesalePrice, markedPrice);
        if (onUpdateBundlePrice) {
          onUpdateBundlePrice(b.id, updated[b.id]);
        }
      });
      try {
        localStorage.setItem(
          "sdh_custom_bundle_prices",
          JSON.stringify(updated),
        );
      } catch {
        // ignore
      }
      return updated;
    });

    setIsMarkupModalOpen(false);
    const lineLabel =
      productLines.find((l) => l.key === lineFilter)?.label ?? "bundles";
    setFeedbackNotice({
      message: `Applied +${pct}% wholesale markup across ${targetBundles.length} ${lineLabel}!`,
      type: "success",
    });
  };

  // Reset all prices to recommended retail cap
  const handleResetToDefaults = () => {
    setCurrentMarkup(storeConfig?.marginMarkupPercent ?? 12);
    const initial: Record<string, number> = {};
    bundles.forEach((b) => {
      initial[b.id] = b.retailPrice;
      if (onUpdateBundlePrice) {
        onUpdateBundlePrice(b.id, b.retailPrice);
      }
    });
    setBundlePrices(initial);

    const initialCheckers: Record<string, number> = {};
    INITIAL_CHECKERS.forEach((c) => {
      initialCheckers[c.id] = c.price;
    });
    setCheckerPrices(initialCheckers);

    setAfaSellingPrice(25.0);

    try {
      localStorage.removeItem("sdh_custom_bundle_prices");
      localStorage.removeItem("sdh_custom_checker_prices");
      localStorage.removeItem("sdh_custom_afa_price");
    } catch {
      // ignore
    }

    setIsResetModalOpen(false);
    setFeedbackNotice({
      message:
        "Reset all product prices to SDH platform recommended retail caps.",
      type: "info",
    });
  };

  return (
    <div className="space-y-6">
      {/* PAGE HEADER (Exact Parity with AgentBulkSms / AgentOrdersView) */}
      <div className="flex flex-col items-start justify-between gap-4 border-b border-border pb-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-foreground">
            <SlidersHorizontal className="size-6 text-primary" />
            <span>Wholesale vs. Retail Pricing Editor</span>
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Configure custom retail prices across all product lines
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onNavigateTab && (
            <Button
              size="sm"
              onClick={() => onNavigateTab("store-builder")}
              className="text-xs font-bold shadow-xs cursor-pointer gap-1.5 h-9 bg-primary"
            >
              <ExternalLink className="size-4" />
              <span>Store Builder</span>
            </Button>
          )}
        </div>
      </div>

      {/* FEEDBACK BANNER */}
      {feedbackNotice && (
        <div
          className={`flex items-center justify-between p-3.5 rounded-2xl text-xs font-semibold border transition-all ${
            feedbackNotice.type === "success"
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
              : "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>{feedbackNotice.message}</span>
          </div>
          <button
            onClick={() => setFeedbackNotice(null)}
            className="text-[11px] underline font-bold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* SERVICE / MARGIN RULES CALLOUT BANNER */}
      <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs">
        <Info className="size-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="text-blue-800 dark:text-blue-300 space-y-0.5">
          <span className="font-bold block">
            Wholesale vs. Retail Margin Rules:
          </span>
          <span>
            Your <span className="font-semibold">Profit</span> is your store
            price minus wholesale cost, credited after dispatch.{" "}
            <span className="font-semibold">Tier Bonuses</span> are paid on top,
            with a price floor protecting wholesale margins.
          </span>
        </div>
      </div>

      {/* 4 STATS CARDS TILES (AfaFlow / Bulk SMS style) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Priced Products */}
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
              <Tag className="size-3.5 text-primary" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Price Catalogs
            </span>
          </div>
          <p className="mt-2 text-xl font-black tabular-nums text-foreground">
            {stats.totalBundles + INITIAL_CHECKERS.length + 1}
          </p>
          <p className="text-[10px] text-muted-foreground font-medium">
            Across {stats.totalLines} lines &amp; vouchers
          </p>
        </div>

        {/* Avg Profit Margin */}
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10">
              <DollarSign className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Average Margin
            </span>
          </div>
          <p className="mt-2 text-xl font-black tabular-nums text-foreground">
            GH₵ {stats.avgMarginGhs.toFixed(2)}
          </p>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
            +{stats.avgMarginPct.toFixed(1)}% above wholesale
          </p>
        </div>

        {/* Max Single Margin */}
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10">
              <Sparkles className="size-3.5 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Top Single Profit
            </span>
          </div>
          <p className="mt-2 text-xl font-black tabular-nums text-foreground">
            +GH₵ {stats.maxProfit.toFixed(2)}
          </p>
          <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
            On high-volume packages
          </p>
        </div>

        {/* Platform Tier Bonus */}
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-blue-500/10">
              <ShieldCheck className="size-3.5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Tier Bonus
            </span>
          </div>
          <p className="mt-2 text-xl font-black tabular-nums text-foreground">
            Active Tier
          </p>
          <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
            +GH₵ 0.15 to +GH₵ 2.50 per order
          </p>
        </div>
      </div>

      {/* TABS NAVIGATION (Exact Match of AgentAnalyticsEarnings Tab Style) */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <ScrollArea className="w-full whitespace-nowrap pb-2">
          <div className="min-w-full p-1">
            <TabsList className="inline-flex h-14 w-max min-w-full items-center justify-start gap-1.5 rounded-2xl border border-border/80 bg-muted/70 p-1.5 text-muted-foreground shadow-2xs">
              <TabsTrigger
                value="data"
                className="h-6 rounded-xl px-4 py-2 text-[12px] flex items-center gap-2 transition-all data-active:!bg-background data-active:text-foreground data-active:shadow-sm"
              >
                <Tag className="w-4 h-4 text-emerald-500" />
                <span>Data Bundles ({bundles.length})</span>
              </TabsTrigger>
              <TabsTrigger
                value="afa"
                className="h-6 rounded-xl px-4 py-2 text-[12px] flex items-center gap-2 transition-all data-active:!bg-background data-active:text-foreground data-active:shadow-sm"
              >
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span>MTN AFA Registration</span>
              </TabsTrigger>
              <TabsTrigger
                value="checker"
                className="h-6 rounded-xl px-4 py-2 text-[12px] flex items-center gap-2 transition-all data-active:!bg-background data-active:text-foreground data-active:shadow-sm"
              >
                <Ticket className="w-4 h-4 text-amber-500" />
                <span>Results Checkers ({INITIAL_CHECKERS.length})</span>
              </TabsTrigger>
              <TabsTrigger
                value="utilities"
                className="h-6 rounded-xl px-4 py-2 text-[12px] flex items-center gap-2 transition-all data-active:!bg-background data-active:text-foreground data-active:shadow-sm"
              >
                <Zap className="w-4 h-4 text-blue-500" />
                <span>Utilities &amp; Bills</span>
              </TabsTrigger>
              <TabsTrigger
                value="sms"
                className="h-6 rounded-xl px-4 py-2 text-[12px] flex items-center gap-2 transition-all data-active:!bg-background data-active:text-foreground data-active:shadow-sm"
              >
                <MessageSquare className="w-4 h-4 text-purple-500" />
                <span>Bulk SMS Rate</span>
              </TabsTrigger>
            </TabsList>
          </div>
          <ScrollBar orientation="horizontal" className="h-2" />
        </ScrollArea>

        {/* TAB 1: DATA BUNDLE PRICING (Exact match of Bulk SMS Card & Table Structure) */}
        <TabsContent value="data" className="space-y-4 m-0">
          <Card className="border-border shadow-xs">
            <CardHeader className="border-b border-border pb-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-base font-extrabold text-foreground">
                  Data Bundle Catalog &amp; Custom Pricing
                </CardTitle>
                <CardDescription className="mt-1 text-xs">
                  Configure your storefront retail prices for all Ghana telco
                  data packages
                </CardDescription>
              </div>
            </CardHeader>

            {/* Search + Filters (Exact match of Bulk SMS & AgentOrdersView) */}
            <div className="border-b border-border bg-muted/20 p-4 space-y-4">
              {/* Search input */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="pricing-search"
                  className="text-[10px] font-bold uppercase text-muted-foreground"
                >
                  Search bundle catalog
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="pricing-search"
                    type="text"
                    placeholder="Search by bundle size, network, validity (e.g. 5GB, xpress, MTN)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-10 bg-background pl-9 text-xs"
                  />
                </div>
              </div>

              {/* Filters Box */}
              <div className="rounded-xl border border-border bg-background p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="size-3.5 text-muted-foreground" />
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">
                      Pricing filters
                    </span>
                  </div>
                  {(searchQuery ||
                    categoryFilter !== "all" ||
                    marginFilter !== "all" ||
                    lineFilter !== "all" ||
                    currentMarkup !==
                      (storeConfig?.marginMarkupPercent ?? 12)) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSearchQuery("");
                        setCategoryFilter("all");
                        setMarginFilter("all");
                        setLineFilter("all");
                        handleResetToDefaults();
                      }}
                      className="h-6 px-2 text-[10px] font-bold text-primary cursor-pointer bg-transparent hover:!bg-transparent hover:text-primary"
                    >
                      Reset filters
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {/* Line Filter Select */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="filter-line"
                      className="text-[10px] font-semibold text-muted-foreground"
                    >
                      Carrier Product Line
                    </Label>
                    <Select
                      value={lineFilter}
                      onValueChange={(val) => {
                        setLineFilter(val as ProductLineKey);
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger
                        id="filter-line"
                        className="h-9 w-full text-xs"
                      >
                        <SelectValue placeholder="All Product Lines" />
                      </SelectTrigger>
                      <SelectContent>
                        {productLines.map((pl) => (
                          <SelectItem key={pl.key} value={pl.key}>
                            {pl.label} ({pl.count})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Volume Category Select */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="filter-category"
                      className="text-[10px] font-semibold text-muted-foreground"
                    >
                      Bundle Volume Size
                    </Label>
                    <Select
                      value={categoryFilter}
                      onValueChange={setCategoryFilter}
                    >
                      <SelectTrigger
                        id="filter-category"
                        className="h-9 w-full text-xs"
                      >
                        <SelectValue placeholder="All Sizes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sizes</SelectItem>
                        <SelectItem value="starter">
                          Starter (&lt; 5GB)
                        </SelectItem>
                        <SelectItem value="popular">
                          Popular (5 - 15GB)
                        </SelectItem>
                        <SelectItem value="high_volume">
                          High Volume (20GB+)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Margin Filter Select */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="filter-margin"
                      className="text-[10px] font-semibold text-muted-foreground"
                    >
                      Profit Margin Tier
                    </Label>
                    <Select
                      value={marginFilter}
                      onValueChange={setMarginFilter}
                    >
                      <SelectTrigger
                        id="filter-margin"
                        className="h-9 w-full text-xs"
                      >
                        <SelectValue placeholder="All Margins" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Margins</SelectItem>
                        <SelectItem value="high">High (&gt; 15%)</SelectItem>
                        <SelectItem value="medium">
                          Standard (8 - 15%)
                        </SelectItem>
                        <SelectItem value="low">Tight (&lt; 8%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Global Retail Markup Slider & Quick Presets (Matches MyStoreBuilder) */}
                <div className="pt-1 border-t border-border">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1">
                    <h3 className="text-[10px] font-bold uppercase text-muted-foreground">
                      <span>Quick Presets</span>
                    </h3>

                    <span className="px-2 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-medium text-[10px] tabular-nums">
                      +{currentMarkup}% Markup
                    </span>
                  </div>

                  {/* Slider & Quick presets */}
                  <div>
                    <Slider
                      value={[currentMarkup]}
                      onValueChange={(values) => {
                        const val = Array.isArray(values) ? values[0] : values;
                        if (typeof val === "number" && !isNaN(val)) {
                          handleApplyBatchMarkup(val);
                        }
                      }}
                      min={2}
                      max={25}
                      step={1}
                      className="w-full py-0"
                    />

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {[5, 8, 10, 12, 15, 20].map((p) => (
                          <Button
                            key={p}
                            variant={
                              currentMarkup === p ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() => handleApplyBatchMarkup(p)}
                            className="h-7 px-2.5 text-[11px] font-bold cursor-pointer tabular-nums"
                          >
                            +{p}%
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* DATA BUNDLES TABLE */}
            <div className="rounded-xl border border-border overflow-hidden bg-card">
              <div className="overflow-x-auto">
                <Table className="w-full text-xs">
                  <TableHeader>
                    <TableRow className="border-b border-border bg-muted/40 hover:bg-muted/40">
                      <TableHead className="h-10 px-4 text-left font-bold text-muted-foreground uppercase text-[10px]">
                        Bundle &amp; Line
                      </TableHead>
                      <TableHead className="h-10 px-3 text-left font-bold text-muted-foreground uppercase text-[10px]">
                        Validity
                      </TableHead>
                      <TableHead className="h-10 px-3 text-right font-bold text-muted-foreground uppercase text-[10px]">
                        Wholesale (SDH)
                      </TableHead>
                      <TableHead className="h-10 px-3 text-right font-bold text-muted-foreground uppercase text-[10px]">
                        Retail Cap
                      </TableHead>
                      <TableHead className="h-10 px-4 text-right font-bold text-muted-foreground uppercase text-[10px]">
                        Your Store Price
                      </TableHead>
                      <TableHead className="h-10 px-4 text-right font-bold text-muted-foreground uppercase text-[10px]">
                        Your Net Profit
                      </TableHead>
                      <TableHead className="h-10 px-4 text-right font-bold text-muted-foreground uppercase text-[10px]">
                        Tier Bonus
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-border/60">
                    {paginatedBundles.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="h-32 text-center text-muted-foreground"
                        >
                          <p className="text-sm font-semibold">
                            No data bundles match your filter criteria.
                          </p>
                          <p className="text-xs mt-1">
                            Try changing or clearing your search keywords.
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedBundles.map((b) => {
                        const price = bundlePrices[b.id] ?? b.retailPrice;
                        const profit = Math.max(0, price - b.wholesalePrice);
                        const marginPercent =
                          b.wholesalePrice > 0
                            ? ((profit / b.wholesalePrice) * 100).toFixed(1)
                            : "0.0";
                        const bonus = getTierBonus(b);

                        return (
                          <TableRow
                            key={b.id}
                            className="hover:bg-muted/30 transition-colors"
                          >
                            {/* Bundle Name & Network */}
                            <TableCell className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 ${
                                    b.network === "MTN"
                                      ? "bg-amber-400/20 text-amber-900 dark:text-amber-300 border-amber-400/40"
                                      : b.network === "Telecel"
                                        ? "bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/40"
                                        : "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/40"
                                  }`}
                                >
                                  {b.network}
                                </Badge>
                                <div>
                                  <p className="font-bold text-foreground text-xs leading-none">
                                    {b.name}
                                  </p>
                                  {b.tier && (
                                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                                      {b.tier === "xpress"
                                        ? "Express Delivery"
                                        : b.tier}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </TableCell>

                            {/* Validity */}
                            <TableCell className="py-3 px-3 text-muted-foreground font-medium text-xs">
                              {b.validity}
                            </TableCell>

                            {/* Wholesale Cost */}
                            <TableCell className="py-3 px-3 text-right text-muted-foreground font-semibold tabular-nums text-xs">
                              GH₵ {b.wholesalePrice.toFixed(2)}
                            </TableCell>

                            {/* Recommended Retail */}
                            <TableCell className="py-3 px-3 text-right text-muted-foreground font-medium tabular-nums text-xs">
                              GH₵ {b.retailPrice.toFixed(2)}
                            </TableCell>

                            {/* Interactive Price Input */}
                            <TableCell className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end">
                                <StorePrice
                                  value={price}
                                  floor={b.wholesalePrice}
                                  onChange={(newVal) =>
                                    handlePriceUpdate(b.id, newVal)
                                  }
                                />
                              </div>
                            </TableCell>

                            {/* Profit / Margin */}
                            <TableCell className="py-3 px-4 text-right tabular-nums">
                              <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-xs">
                                +GH₵ {profit.toFixed(2)}
                              </span>
                              <span className="block text-[10px] font-semibold text-muted-foreground">
                                ({marginPercent}%)
                              </span>
                            </TableCell>

                            {/* Tier Bonus */}
                            <TableCell className="py-3 px-4 text-right tabular-nums text-xs font-semibold text-blue-600 dark:text-blue-400">
                              +GH₵ {bonus.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* PAGINATION */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                  {Math.min(
                    currentPage * ITEMS_PER_PAGE,
                    filteredBundles.length,
                  )}{" "}
                  of {filteredBundles.length} bundles
                </p>

                <Pagination className="w-auto mx-0">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                        className={`cursor-pointer h-8 text-xs ${
                          currentPage === 1
                            ? "pointer-events-none opacity-50"
                            : ""
                        }`}
                      />
                    </PaginationItem>

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(
                        (p) =>
                          p === 1 ||
                          p === totalPages ||
                          Math.abs(p - currentPage) <= 1,
                      )
                      .map((p, idx, arr) => {
                        const showEllipsis = idx > 0 && p - arr[idx - 1] > 1;
                        return (
                          <React.Fragment key={p}>
                            {showEllipsis && (
                              <PaginationItem>
                                <span className="px-2 text-xs text-muted-foreground">
                                  ...
                                </span>
                              </PaginationItem>
                            )}
                            <PaginationItem>
                              <PaginationLink
                                isActive={currentPage === p}
                                onClick={() => setCurrentPage(p)}
                                className="cursor-pointer h-8 w-8 text-xs"
                              >
                                {p}
                              </PaginationLink>
                            </PaginationItem>
                          </React.Fragment>
                        );
                      })}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() =>
                          setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }
                        className={`cursor-pointer h-8 text-xs ${
                          currentPage === totalPages
                            ? "pointer-events-none opacity-50"
                            : ""
                        }`}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* TAB 2: AFA REGISTRATION PRICING */}
        <TabsContent value="afa" className="space-y-4 m-0">
          <Card className="border-border shadow-xs">
            <CardHeader className="border-b border-border pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base font-extrabold text-foreground">
                    <ShieldCheck className="size-4 text-primary" />
                    <span>MTN AFA Registration Pricing</span>
                  </CardTitle>
                  <CardDescription className="mt-1 text-xs">
                    MTN AFA is a one-time registration. Smart Data Hub sets the
                    platform fee; you set what you charge on your storefront and
                    keep the difference.
                  </CardDescription>
                </div>
                <Badge
                  variant="outline"
                  className="bg-amber-400/20 text-amber-900 dark:text-amber-300 border-amber-400/40 text-[10px] font-bold"
                >
                  MTN Ghana
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-5">
              {/* AFA Pricing Table */}
              <div className="rounded-xl border border-border overflow-hidden bg-card">
                <Table className="w-full text-xs">
                  <TableHeader>
                    <TableRow className="border-b border-border bg-muted/40 hover:bg-muted/40 font-bold text-[10px] uppercase text-muted-foreground">
                      <TableHead className="h-10 px-4 text-left font-bold text-muted-foreground uppercase text-[10px]">
                        Service Description
                      </TableHead>
                      <TableHead className="h-10 px-3 text-right font-bold text-muted-foreground uppercase text-[10px]">
                        Platform Fee (Wholesale)
                      </TableHead>
                      <TableHead className="h-10 px-4 text-right font-bold text-muted-foreground uppercase text-[10px]">
                        Your Storefront Price
                      </TableHead>
                      <TableHead className="h-10 px-4 text-right font-bold text-muted-foreground uppercase text-[10px]">
                        Your Net Profit
                      </TableHead>
                      <TableHead className="h-10 px-4 text-right font-bold text-muted-foreground uppercase text-[10px]">
                        Tier Bonus
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="hover:bg-muted/30 transition-colors">
                      <TableCell className="py-3.5 px-4">
                        <div>
                          <p className="font-bold text-foreground text-xs">
                            MTN AFA Group Whitelisting
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            Agricultural &amp; Rural Workers subsidized tariff
                            registration
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="py-3.5 px-3 text-right font-semibold tabular-nums text-muted-foreground text-xs">
                        GH₵ {AFA_PLATFORM_FEE.toFixed(2)}
                      </TableCell>
                      <TableCell className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end">
                          <StorePrice
                            value={afaSellingPrice}
                            floor={AFA_PLATFORM_FEE}
                            onChange={handleAfaPriceUpdate}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="py-3.5 px-4 text-right tabular-nums">
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-xs">
                          +GH₵ {(afaSellingPrice - AFA_PLATFORM_FEE).toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell className="py-3.5 px-4 text-right text-muted-foreground text-xs font-semibold">
                        —
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* AFA Unlocked Packages Info Grid */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Discounted Tariff Packages (Unlocked Post-Approval)
                  </span>
                  <span className="text-xs font-bold text-primary">
                    Dial *1848# on registered line
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                  {[
                    { price: "GH₵ 10.00", what: "220 mins voice + 50 SMS" },
                    { price: "GH₵ 10.00", what: "160 mins + 50 SMS + 150MB" },
                    {
                      price: "GH₵ 10.00",
                      what: "Renew existing tariff bundle",
                    },
                    {
                      price: "Free",
                      what: "Unlimited calls between AFA members",
                    },
                  ].map((pkg, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl border border-border/80 bg-muted flex flex-col justify-between gap-1"
                    >
                      <span className="text-sm font-extrabold text-foreground tabular-nums">
                        {pkg.price}
                      </span>
                      <span className="text-xs text-muted-foreground font-medium">
                        {pkg.what}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Note */}
              {/* <div className="rounded-xl p-3.5 bg-muted/30 border border-border/60 text-xs text-muted-foreground flex items-start gap-2.5">
                <Info className="size-4 shrink-0 text-muted-foreground mt-0.5" />
                <span>
                  Your store price cannot go below the platform fee (GH₵{" "}
                  {AFA_PLATFORM_FEE.toFixed(2)}). Your profit is automatically
                  credited once the applicant is verified and whitelisted on the
                  MTN national registry (typically 1 to 3 working days).
                </span>
              </div> */}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: RESULTS CHECKER PRICING */}
        <TabsContent value="checker" className="space-y-4 m-0">
          <Card className="border-border shadow-xs">
            <CardHeader className="border-b border-border pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base font-extrabold text-foreground">
                    <Ticket className="size-4 text-amber-500" />
                    <span>Results Checker &amp; Admission Voucher Prices</span>
                  </CardTitle>
                  <CardDescription className="mt-1 text-xs">
                    Set what you charge for WAEC and CSSPS vouchers
                  </CardDescription>
                </div>
                {onNavigateTab && (
                  <Button
                    size="sm"
                    onClick={() => onNavigateTab("results-checker")}
                    className="h-8 text-xs font-bold gap-1 cursor-pointer"
                  >
                    <span>Buy Vouchers</span>
                    <ArrowUpRight className="size-3" />
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-5">
              <div className="rounded-xl border border-border overflow-hidden bg-card">
                <Table className="w-full text-xs">
                  <TableHeader>
                    <TableRow className="border-b border-border bg-muted/40 hover:bg-muted/40 font-bold text-[10px] uppercase text-muted-foreground">
                      <TableHead className="h-10 px-4 text-left font-bold text-muted-foreground uppercase text-[10px]">
                        Product &amp; Examination Body
                      </TableHead>
                      <TableHead className="h-10 px-3 text-right font-bold text-muted-foreground uppercase text-[10px]">
                        Wholesale Cost (SDH)
                      </TableHead>
                      <TableHead className="h-10 px-3 text-right font-bold text-muted-foreground uppercase text-[10px]">
                        Recommended Retail
                      </TableHead>
                      <TableHead className="h-10 px-4 text-right font-bold text-muted-foreground uppercase text-[10px]">
                        Your Store Price
                      </TableHead>
                      <TableHead className="h-10 px-4 text-right font-bold text-muted-foreground uppercase text-[10px]">
                        Your Net Profit
                      </TableHead>
                      <TableHead className="h-10 px-4 text-center font-bold text-muted-foreground uppercase text-[10px]">
                        Inventory Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-border/60">
                    {INITIAL_CHECKERS.map((c) => {
                      const wholesale = c.wholesalePrice ?? 18.0;
                      const price = checkerPrices[c.id] ?? c.price;
                      const profit = Math.max(0, price - wholesale);
                      const marginPct = ((profit / wholesale) * 100).toFixed(1);

                      return (
                        <TableRow
                          key={c.id}
                          className="hover:bg-muted/30 transition-colors"
                        >
                          <TableCell className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className="text-[9px] font-extrabold uppercase bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                              >
                                {c.examBody}
                              </Badge>
                              <div>
                                <p className="font-bold text-foreground text-xs">
                                  {c.title}
                                </p>
                                <p className="text-[10px] text-muted-foreground line-clamp-1">
                                  {c.description}
                                </p>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="py-3 px-3 text-right font-semibold tabular-nums text-muted-foreground text-xs">
                            GH₵ {wholesale.toFixed(2)}
                          </TableCell>

                          <TableCell className="py-3 px-3 text-right font-medium tabular-nums text-muted-foreground text-xs">
                            GH₵ {c.price.toFixed(2)}
                          </TableCell>

                          <TableCell className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end">
                              <StorePrice
                                value={price}
                                floor={wholesale}
                                onChange={(newVal) =>
                                  handleCheckerPriceUpdate(c.id, newVal)
                                }
                              />
                            </div>
                          </TableCell>

                          <TableCell className="py-3 px-4 text-right tabular-nums">
                            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-xs">
                              +GH₵ {profit.toFixed(2)}
                            </span>
                            <span className="block text-[10px] font-semibold text-muted-foreground">
                              ({marginPct}%)
                            </span>
                          </TableCell>

                          <TableCell className="py-3 px-4 text-center">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                              <span className="size-1.5 rounded-full bg-emerald-500" />
                              In Stock ({c.stockCount})
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: UTILITIES & BILLS PRICING */}
        <TabsContent value="utilities" className="space-y-4 m-0">
          <Card className="border-border shadow-xs">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="flex items-center gap-2 text-base font-extrabold text-foreground">
                <Zap className="size-4 text-blue-500" />
                <span>Utilities &amp; Bills Pricing Model</span>
              </CardTitle>
              <CardDescription className="mt-1 text-xs">
                Bills and subscriptions earn through platform commissions, not
                upfront markups.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  {
                    title: "ECG Prepaid Electricity",
                    category: "Power Utility",
                    model: "Wholesale Pass-through",
                    commission: "1.50% Cashback",
                    desc: "Customers pay exact meter face value. Agent receives 1.5% cashback instantly.",
                  },
                  {
                    title: "Ghana Water (GWCL)",
                    category: "Water Utility",
                    model: "Wholesale Pass-through",
                    commission: "1.25% Cashback",
                    desc: "Bill payment at zero surcharge. Commission credited on invoice settlement.",
                  },
                  {
                    title: "DStv & GOtv Subscriptions",
                    category: "Pay TV",
                    model: "MultiChoice Catalog",
                    commission: "2.00% Commission",
                    desc: "Official package subscription prices with instant smartcard clearing.",
                  },
                  {
                    title: "StarTimes Digital TV",
                    category: "Pay TV",
                    model: "Standard Tariff",
                    commission: "2.50% Commission",
                    desc: "Bouquet renewals and daily passes with instant reactivation.",
                  },
                  {
                    title: "Netflix & Showmax",
                    category: "Streaming",
                    model: "Digital Voucher",
                    commission: "3.00% Cashback",
                    desc: "Streaming voucher codes delivered by instant SMS and email.",
                  },
                  {
                    title: "School Fees & Dues",
                    category: "Education",
                    model: "Direct Debit",
                    commission: "GH₵ 2.00 / Receipt",
                    desc: "Institutional fees and PTA levies collection with printed audit receipt.",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="rounded-xl p-4 bg-card flex flex-col justify-between gap-3 shadow-2xs border border-border/80 bg-muted"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <Badge
                          variant="default"
                          className="text-[9px] font-bold"
                        >
                          {item.category}
                        </Badge>
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          {item.commission}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-foreground text-xs mt-2">
                        {item.title}
                      </h4>
                      <p className="text-[11px] mt-1 font-semibold text-muted-foreground leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                    <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[10px] font-semibold text-muted-foreground">
                      <span className="font-semibold">Pricing Type</span>
                      <span className="text-foreground">{item.model}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-xl p-3.5 bg-blue-500/10 border border-blue-500/20 text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2.5">
                <Info className="size-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
                <span>
                  Utility and bill tariffs are regulated. Agents earn commission
                  cashback on every transaction—no custom pricing needed.
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 5: BULK SMS RATE */}
        <TabsContent value="sms" className="space-y-4 m-0">
          <Card className="border-border shadow-xs">
            <CardHeader className="border-b border-border pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base font-extrabold text-foreground">
                    <MessageSquare className="size-4 text-purple-500" />
                    <span>Bulk SMS Rate &amp; Capacity Pricing</span>
                  </CardTitle>
                  <CardDescription className="mt-1 text-xs">
                    SMS is billed per page (160 characters) per recipient,
                    debited directly from your wallet balance.
                  </CardDescription>
                </div>
                {onNavigateTab && (
                  <Button
                    size="sm"
                    onClick={() => onNavigateTab("bulk-sms")}
                    className="h-8 text-xs font-bold rounded-xl gap-1 shadow-2xs cursor-pointer bg-primary"
                  >
                    <span>Go to SMS Campaigns</span>
                    <ArrowUpRight className="size-3" />
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-5">
              {/* Rate Tiles */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl border border-border bg-card p-4 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Rate Per 160-Char Page
                  </span>
                  <p className="mt-1.5 text-2xl font-black text-foreground tabular-nums">
                    GH₵ {SMS_RATE_PER_PAGE.toFixed(3)}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-medium mt-1">
                    Arkesel wholesale GH₵ 0.025 + SDH GH₵ 0.020
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card p-4 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    1,000 Contacts Estimate
                  </span>
                  <p className="mt-1.5 text-2xl font-black text-primary tabular-nums">
                    GH₵ {(SMS_RATE_PER_PAGE * 1000).toFixed(2)}
                  </p>
                  <p className="text-[10px] text-primary font-medium mt-1">
                    Single page blast across all networks
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card p-4 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Custom Sender ID
                  </span>
                  <p className="mt-1.5 text-2xl font-black text-foreground">
                    Free Approval
                  </p>
                  <p className="text-[10px] text-muted-foreground font-medium mt-1">
                    Max 11 alphanumeric characters
                  </p>
                </div>
              </div>

              {/* Arkesel Guarantee Note */}
              <div className="rounded-xl p-3.5 bg-muted/30 border border-border/60 text-xs text-muted-foreground space-y-1">
                <p className="font-bold text-foreground">
                  Delivery &amp; Refund Guarantee:
                </p>
                <p>
                  Messages rejected by telcos or sent to dead numbers are
                  automatically refunded to your wallet in real time. Bulk SMS
                  does not carry agent retail markup because it is a direct
                  dispatch utility from your dashboard.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* BATCH MARKUP MODAL */}
      <Dialog open={isMarkupModalOpen} onOpenChange={setIsMarkupModalOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-foreground flex items-center gap-2">
              <Percent className="size-4 text-primary" />
              <span>Apply Percentage Markup</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Automatically calculate selling prices across{" "}
              {lineFilter === "all"
                ? "all data bundles"
                : productLines.find((l) => l.key === lineFilter)?.label}{" "}
              based on SDH wholesale cost.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div>
              <label className="text-xs font-bold text-foreground mb-1 block">
                Markup Percentage (%)
              </label>
              <div className="relative">
                <Input
                  type="number"
                  min="1"
                  max="100"
                  step="1"
                  value={customMarkupPct}
                  onChange={(e) => setCustomMarkupPct(e.target.value)}
                  className="h-9 text-xs rounded-xl font-bold pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                  %
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {[8, 10, 12, 15, 18, 20, 25].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setCustomMarkupPct(pct.toString())}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                    customMarkupPct === pct.toString()
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/40 hover:bg-muted text-foreground border-border"
                  }`}
                >
                  +{pct}%
                </button>
              ))}
            </div>

            <p className="text-[11px] text-muted-foreground">
              Target Scope:{" "}
              <strong className="text-foreground">
                {lineFilter === "all"
                  ? `All ${bundles.length} bundles`
                  : `${bundles.filter((b) => getBundleLineKey(b) === lineFilter).length} bundles in ${
                      productLines.find((l) => l.key === lineFilter)?.label
                    }`}
              </strong>
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMarkupModalOpen(false)}
              className="rounded-xl text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                const val = parseFloat(customMarkupPct);
                if (!isNaN(val) && val > 0) {
                  handleApplyBatchMarkup(val);
                }
              }}
              className="rounded-xl text-xs font-bold gap-1.5"
            >
              <Check className="size-3.5" />
              <span>Apply Markup</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


    </div>
  );
};

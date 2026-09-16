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
} from "lucide-react";
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
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../ui/tabs";
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

  // Data Bundles Filters
  const [lineFilter, setLineFilter] = useState<ProductLineKey>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [marginFilter, setMarginFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Custom Prices state for data bundles
  const [bundlePrices, setBundlePrices] = useState<Record<string, number>>(() => {
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
        (b.wholesalePrice * (1 + defaultMarkup / 100)).toFixed(2)
      );
    });
    return initial;
  });

  // Custom Prices for Results Checkers
  const [checkerPrices, setCheckerPrices] = useState<Record<string, number>>(() => {
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
  });

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
      badgeClass: "bg-amber-400/20 text-amber-900 dark:text-amber-300 border-amber-400/40",
      count: bundles.filter((b) => b.network === "MTN" && b.tier !== "xpress").length,
    },
    {
      key: "mtn_xpress" as const,
      label: "MTN Xpress",
      badge: "MTN",
      badgeClass: "bg-amber-500/20 text-amber-900 dark:text-amber-300 border-amber-500/40",
      count: bundles.filter((b) => b.network === "MTN" && b.tier === "xpress").length,
    },
    {
      key: "telecel" as const,
      label: "Telecel Bossu",
      badge: "Telecel",
      badgeClass: "bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/40",
      count: bundles.filter((b) => b.network === "Telecel").length,
    },
    {
      key: "at_ishare" as const,
      label: "AT iShare",
      badge: "AT",
      badgeClass: "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/40",
      count: bundles.filter(
        (b) => b.network === "AirtelTigo" && b.tier !== "bigtime" && b.category !== "special"
      ).length,
    },
    {
      key: "at_bigtime" as const,
      label: "AT BigTime (No Expiry)",
      badge: "AT",
      badgeClass: "bg-blue-600/20 text-blue-800 dark:text-blue-300 border-blue-600/40",
      count: bundles.filter(
        (b) => b.network === "AirtelTigo" && (b.tier === "bigtime" || b.category === "special")
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
        const matchesSize = `${b.sizeGb}gb`.includes(q) || b.sizeLabel.toLowerCase().includes(q);
        const matchesVal = b.validity.toLowerCase().includes(q);
        if (!matchesName && !matchesNet && !matchesSize && !matchesVal) return false;
      }

      // Category filter
      if (categoryFilter === "starter" && b.sizeGb >= 5) return false;
      if (categoryFilter === "popular" && (b.sizeGb < 5 || b.sizeGb > 15)) return false;
      if (categoryFilter === "high_volume" && b.sizeGb < 20) return false;

      // Margin filter
      const price = bundlePrices[b.id] ?? b.retailPrice;
      const profit = Math.max(0, price - b.wholesalePrice);
      const marginPct = b.wholesalePrice > 0 ? (profit / b.wholesalePrice) * 100 : 0;
      if (marginFilter === "high" && marginPct < 15) return false;
      if (marginFilter === "medium" && (marginPct < 8 || marginPct >= 15)) return false;
      if (marginFilter === "low" && marginPct >= 8) return false;

      return true;
    });
  }, [bundles, lineFilter, searchQuery, categoryFilter, marginFilter, bundlePrices]);

  const totalPages = Math.max(1, Math.ceil(filteredBundles.length / ITEMS_PER_PAGE));
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

    const avgMarginGhs = bundles.length > 0 ? totalMarginGhs / bundles.length : 0;
    const avgMarginPct = totalWholesale > 0 ? (totalMarginGhs / totalWholesale) * 100 : 0;

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
        localStorage.setItem("sdh_custom_bundle_prices", JSON.stringify(updated));
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
        localStorage.setItem("sdh_custom_checker_prices", JSON.stringify(updated));
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
    const targetBundles =
      lineFilter === "all"
        ? bundles
        : bundles.filter((b) => getBundleLineKey(b) === lineFilter);

    setBundlePrices((prev) => {
      const updated = { ...prev };
      targetBundles.forEach((b) => {
        const markedPrice = Number((b.wholesalePrice * (1 + pct / 100)).toFixed(2));
        updated[b.id] = Math.max(b.wholesalePrice, markedPrice);
        if (onUpdateBundlePrice) {
          onUpdateBundlePrice(b.id, updated[b.id]);
        }
      });
      try {
        localStorage.setItem("sdh_custom_bundle_prices", JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });

    setIsMarkupModalOpen(false);
    const lineLabel = productLines.find((l) => l.key === lineFilter)?.label ?? "bundles";
    setFeedbackNotice({
      message: `Applied +${pct}% wholesale markup across ${targetBundles.length} ${lineLabel}!`,
      type: "success",
    });
  };

  // Reset all prices to recommended retail cap
  const handleResetToDefaults = () => {
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
      message: "Reset all product prices to SDH platform recommended retail caps.",
      type: "info",
    });
  };

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col items-start justify-between gap-4 border-b border-border pb-5 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <SlidersHorizontal className="size-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Agent Commerce &amp; Margins
              </p>
              <h1 className="text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
                Wholesale vs. Retail Pricing Editor
              </h1>
            </div>
          </div>
          <p className="mt-2 max-w-2xl text-xs leading-relaxed text-muted-foreground">
            Configure custom retail prices across all product lines. Every sale automatically credits the net margin difference to your earnings.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsResetModalOpen(true)}
            className="h-9 gap-1.5 rounded-xl text-xs font-bold shadow-2xs"
          >
            <RotateCcw className="size-3.5 text-muted-foreground" />
            <span>Reset to Recommended</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsMarkupModalOpen(true)}
            className="h-9 gap-1.5 rounded-xl text-xs font-bold shadow-2xs"
          >
            <Percent className="size-3.5 text-primary" />
            <span>Apply Batch Markup</span>
          </Button>

          {onNavigateTab && (
            <Button
              size="sm"
              onClick={() => onNavigateTab("store-builder")}
              className="h-9 gap-1.5 rounded-xl text-xs font-bold shadow-xs"
            >
              <ExternalLink className="size-3.5" />
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
          <span className="font-bold block">Wholesale vs. Retail Margin Rules:</span>
          <span>
            Your <strong className="text-foreground">Profit</strong> on each customer order is your configured store price minus the SDH platform wholesale cost — credited automatically to your commission wallet upon instant carrier dispatch. Store prices are strictly protected by an automated floor so you can never sell below wholesale cost. Platform <strong className="text-foreground">Tier Bonuses</strong> are paid additionally on top.
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

      {/* STORE BUILDER STYLE TABS SWITCH */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <ScrollArea className="w-full whitespace-nowrap pb-2">
          <div className="min-w-full p-1">
            <TabsList className="inline-flex h-14 w-max min-w-full items-center justify-start gap-1.5 rounded-2xl border border-border/80 bg-muted/70 p-1.5 text-muted-foreground shadow-2xs">
              <TabsTrigger
                value="data"
                className="h-11 rounded-xl px-4 py-2 text-[12px] font-semibold flex items-center gap-2 transition-all data-active:!bg-background data-active:text-foreground data-active:shadow-sm cursor-pointer"
              >
                <Tag className="size-4 text-emerald-500" />
                <span>Data Bundles ({bundles.length})</span>
              </TabsTrigger>
              <TabsTrigger
                value="afa"
                className="h-11 rounded-xl px-4 py-2 text-[12px] font-semibold flex items-center gap-2 transition-all data-active:!bg-background data-active:text-foreground data-active:shadow-sm cursor-pointer"
              >
                <ShieldCheck className="size-4 text-primary" />
                <span>MTN AFA Registration</span>
              </TabsTrigger>
              <TabsTrigger
                value="checker"
                className="h-11 rounded-xl px-4 py-2 text-[12px] font-semibold flex items-center gap-2 transition-all data-active:!bg-background data-active:text-foreground data-active:shadow-sm cursor-pointer"
              >
                <Ticket className="size-4 text-amber-500" />
                <span>Results Checkers ({INITIAL_CHECKERS.length})</span>
              </TabsTrigger>
              <TabsTrigger
                value="utilities"
                className="h-11 rounded-xl px-4 py-2 text-[12px] font-semibold flex items-center gap-2 transition-all data-active:!bg-background data-active:text-foreground data-active:shadow-sm cursor-pointer"
              >
                <Zap className="size-4 text-blue-500" />
                <span>Utilities &amp; Bills</span>
              </TabsTrigger>
              <TabsTrigger
                value="sms"
                className="h-11 rounded-xl px-4 py-2 text-[12px] font-semibold flex items-center gap-2 transition-all data-active:!bg-background data-active:text-foreground data-active:shadow-sm cursor-pointer"
              >
                <MessageSquare className="size-4 text-purple-500" />
                <span>Bulk SMS Rate</span>
              </TabsTrigger>
            </TabsList>
          </div>
          <ScrollBar orientation="horizontal" className="h-2" />
        </ScrollArea>

        {/* TAB 1: DATA BUNDLE PRICING */}
        <TabsContent value="data" className="space-y-4 m-0">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4">
            {/* LINE SELECTOR & QUICK MARKUP BUTTONS */}
            <div className="flex flex-col gap-3 pb-3 border-b border-border sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-foreground">
                  Data Bundle Product Lines
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Select a carrier network line to filter or batch-apply percentage markups.
                </p>
              </div>

              {/* Quick markup pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-muted-foreground mr-1">
                  Quick Markup:
                </span>
                {[8, 12, 18, 25].map((pct) => (
                  <Button
                    key={pct}
                    variant="outline"
                    size="sm"
                    onClick={() => handleApplyBatchMarkup(pct)}
                    className="h-7 px-2.5 rounded-lg text-[11px] font-bold border-border/80 hover:bg-primary/10 hover:text-primary transition-all"
                  >
                    +{pct}%
                  </Button>
                ))}
              </div>
            </div>

            {/* PRODUCT LINES CHIPS */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {productLines.map((pl) => {
                const isSelected = lineFilter === pl.key;
                return (
                  <button
                    key={pl.key}
                    type="button"
                    onClick={() => setLineFilter(pl.key)}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                        : "bg-muted/50 hover:bg-muted text-foreground border-border"
                    }`}
                  >
                    {pl.badge && (
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-extrabold uppercase ${
                          isSelected ? "bg-white/20 text-white" : pl.badgeClass
                        }`}
                      >
                        {pl.badge}
                      </span>
                    )}
                    <span>{pl.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isSelected ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {pl.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* SEARCH AND FILTERS BAR */}
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by bundle size, name, validity (e.g. 5GB, xpress)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-xs rounded-xl"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-9 text-xs rounded-xl w-[140px]">
                    <SelectValue placeholder="All Sizes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sizes</SelectItem>
                    <SelectItem value="starter">Starter (&lt; 5GB)</SelectItem>
                    <SelectItem value="popular">Popular (5 - 15GB)</SelectItem>
                    <SelectItem value="high_volume">High Volume (20GB+)</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={marginFilter} onValueChange={setMarginFilter}>
                  <SelectTrigger className="h-9 text-xs rounded-xl w-[140px]">
                    <SelectValue placeholder="All Margins" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Margins</SelectItem>
                    <SelectItem value="high">High (&gt; 15%)</SelectItem>
                    <SelectItem value="medium">Standard (8 - 15%)</SelectItem>
                    <SelectItem value="low">Tight (&lt; 8%)</SelectItem>
                  </SelectContent>
                </Select>

                {(searchQuery || categoryFilter !== "all" || marginFilter !== "all" || lineFilter !== "all") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("");
                      setCategoryFilter("all");
                      setMarginFilter("all");
                      setLineFilter("all");
                    }}
                    className="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear Filters
                  </Button>
                )}
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
                        <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                          <p className="text-sm font-semibold">No data bundles match your filter criteria.</p>
                          <p className="text-xs mt-1">Try changing or clearing your search keywords.</p>
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
                                      {b.tier === "xpress" ? "Express Delivery" : b.tier}
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
                                  onChange={(newVal) => handlePriceUpdate(b.id, newVal)}
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
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-muted-foreground">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredBundles.length)} of{" "}
                  {filteredBundles.length} bundles
                </p>

                <Pagination className="w-auto mx-0">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        className={`cursor-pointer h-8 text-xs ${
                          currentPage === 1 ? "pointer-events-none opacity-50" : ""
                        }`}
                      />
                    </PaginationItem>

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                      .map((p, idx, arr) => {
                        const showEllipsis = idx > 0 && p - arr[idx - 1] > 1;
                        return (
                          <React.Fragment key={p}>
                            {showEllipsis && (
                              <PaginationItem>
                                <span className="px-2 text-xs text-muted-foreground">...</span>
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
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        className={`cursor-pointer h-8 text-xs ${
                          currentPage === totalPages ? "pointer-events-none opacity-50" : ""
                        }`}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        </TabsContent>

        {/* TAB 2: AFA REGISTRATION PRICING */}
        <TabsContent value="afa" className="space-y-4 m-0">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                  <ShieldCheck className="size-4 text-primary" />
                  <span>MTN AFA Registration Pricing</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  MTN AFA is a one-time registration. Smart Data Hub sets the platform fee; you set what you charge on your storefront and keep the difference.
                </p>
              </div>
              <Badge
                variant="outline"
                className="bg-amber-400/20 text-amber-900 dark:text-amber-300 border-amber-400/40 text-[10px] font-bold"
              >
                MTN Ghana
              </Badge>
            </div>

            {/* AFA Pricing Table */}
            <div className="rounded-xl border border-border overflow-hidden bg-card">
              <Table className="w-full text-xs">
                <TableHeader>
                  <TableRow className="border-b border-border bg-muted/40 hover:bg-muted/40">
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
                          Agricultural &amp; Rural Workers subsidized tariff registration
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
                  { price: "GH₵ 10.00", what: "Renew existing tariff bundle" },
                  { price: "Free", what: "Unlimited calls between AFA members" },
                ].map((pkg, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl border border-border/80 bg-muted/20 flex flex-col justify-between gap-1"
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
            <div className="rounded-xl p-3.5 bg-muted/30 border border-border/60 text-xs text-muted-foreground flex items-start gap-2.5">
              <Info className="size-4 shrink-0 text-muted-foreground mt-0.5" />
              <span>
                Your store price cannot go below the platform fee (GH₵ {AFA_PLATFORM_FEE.toFixed(2)}). Your profit is automatically credited once the applicant is verified and whitelisted on the MTN national registry (typically 1 to 3 working days).
              </span>
            </div>
          </div>
        </TabsContent>

        {/* TAB 3: RESULTS CHECKER PRICING */}
        <TabsContent value="checker" className="space-y-4 m-0">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                  <Ticket className="size-4 text-amber-500" />
                  <span>Results Checker &amp; Admission Voucher Prices</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Set what you charge for WAEC and CSSPS vouchers. You pay the platform wholesale; the difference is your profit on every checker sold.
                </p>
              </div>
              {onNavigateTab && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigateTab("checkers")}
                  className="h-8 text-xs font-bold rounded-xl gap-1"
                >
                  <span>Buy Vouchers</span>
                  <ArrowUpRight className="size-3" />
                </Button>
              )}
            </div>

            <div className="rounded-xl border border-border overflow-hidden bg-card">
              <Table className="w-full text-xs">
                <TableHeader>
                  <TableRow className="border-b border-border bg-muted/40 hover:bg-muted/40">
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
                      <TableRow key={c.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className="text-[9px] font-extrabold uppercase bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                            >
                              {c.examBody}
                            </Badge>
                            <div>
                              <p className="font-bold text-foreground text-xs">{c.title}</p>
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
                              onChange={(newVal) => handleCheckerPriceUpdate(c.id, newVal)}
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
          </div>
        </TabsContent>

        {/* TAB 4: UTILITIES & BILLS PRICING */}
        <TabsContent value="utilities" className="space-y-4 m-0">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4">
            <div className="border-b border-border pb-4">
              <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                <Zap className="size-4 text-blue-500" />
                <span>Utilities &amp; Bills Pricing Model</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Bills and streaming subscriptions operate on automatic platform commission cashbacks rather than upfront markups.
              </p>
            </div>

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
                  className="rounded-xl border border-border p-4 bg-card/60 flex flex-col justify-between gap-3 shadow-2xs"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="outline" className="text-[9px] font-bold">
                        {item.category}
                      </Badge>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        {item.commission}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-foreground text-xs mt-2">{item.title}</h4>
                    <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[10px] font-semibold text-muted-foreground">
                    <span>Pricing Type</span>
                    <span className="text-foreground">{item.model}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl p-3.5 bg-blue-500/10 border border-blue-500/20 text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2.5">
              <Info className="size-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
              <span>
                Utility and bill tariffs are mandated by regulatory authorities (PURC and service providers). Agents earn guaranteed commission cashbacks on every transaction without needing to set custom prices.
              </span>
            </div>
          </div>
        </TabsContent>

        {/* TAB 5: BULK SMS RATE */}
        <TabsContent value="sms" className="space-y-4 m-0">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                  <MessageSquare className="size-4 text-purple-500" />
                  <span>Bulk SMS Rate &amp; Capacity Pricing</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  SMS is billed per page (160 characters) per recipient, debited directly from your wallet balance.
                </p>
              </div>
              {onNavigateTab && (
                <Button
                  size="sm"
                  onClick={() => onNavigateTab("bulk-sms")}
                  className="h-8 text-xs font-bold rounded-xl gap-1 shadow-2xs"
                >
                  <span>Go to SMS Campaigns</span>
                  <ArrowUpRight className="size-3" />
                </Button>
              )}
            </div>

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
              <p className="font-bold text-foreground">Delivery &amp; Refund Guarantee:</p>
              <p>
                Messages rejected by telcos or sent to dead numbers are automatically refunded to your wallet in real time. Bulk SMS does not carry agent retail markup because it is a direct dispatch utility from your dashboard.
              </p>
            </div>
          </div>
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
              {lineFilter === "all" ? "all data bundles" : productLines.find((l) => l.key === lineFilter)?.label} based on SDH wholesale cost.
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

      {/* RESET TO DEFAULTS CONFIRMATION MODAL */}
      <Dialog open={isResetModalOpen} onOpenChange={setIsResetModalOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-foreground flex items-center gap-2">
              <RotateCcw className="size-4 text-amber-500" />
              <span>Reset Prices to Recommended?</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              This will restore all custom data bundle, checker, and AFA prices to the platform standard recommended retail caps.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsResetModalOpen(false)}
              className="rounded-xl text-xs font-bold"
            >
              Keep My Custom Prices
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleResetToDefaults}
              className="rounded-xl text-xs font-bold"
            >
              Yes, Reset Everything
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

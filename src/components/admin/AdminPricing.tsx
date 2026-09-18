import React, { useState, useMemo } from "react";
import {
  Sliders,
  Layers,
  Zap,
  GraduationCap,
  Store,
  Search,
  SlidersHorizontal,
  Download,
  Plus,
  RefreshCw,
  Check,
  X,
  AlertCircle,
  Coins,
  DollarSign,
  TrendingUp,
  Tag,
  ShieldCheck,
  Edit2,
  Save,
} from "lucide-react";
import { DataBundle, ResultCheckerProduct, TelecomNetwork } from "../../types";
import { INITIAL_BUNDLES, INITIAL_CHECKERS } from "../../mockData";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "../ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { PaginationHelper } from "../customer/views/PaginationHelper";

export interface AdminPricingProps {
  bundles?: DataBundle[];
  checkers?: ResultCheckerProduct[];
  onUpdateBundlePrice?: (
    bundleId: string,
    wholesalePrice: number,
    retailPrice: number,
  ) => void;
  onUpdateCheckerPrice?: (
    checkerId: string,
    wholesalePrice: number,
    retailPrice: number,
  ) => void;
  onNavigateTab?: (tab: string) => void;
}

export interface AirtimeRateRecord {
  id: string;
  network: TelecomNetwork;
  name: string;
  vtuDiscountPercent: number; // e.g. 3.5 = 3.5%
  agentMarginPercent: number; // e.g. 2.5 = 2.5%
  minTopup: number;
  maxTopup: number;
  status: "active" | "maintenance";
}

export interface ServiceFeeRecord {
  id: string;
  serviceName: string;
  category: "afa" | "utility" | "sms";
  retailPrice: number;
  wholesaleCost: number;
  agentCommission: number;
  description: string;
}

const DEFAULT_AIRTIME_RATES: AirtimeRateRecord[] = [
  {
    id: "air-mtn",
    network: "MTN",
    name: "MTN Ghana VTU Airtime",
    vtuDiscountPercent: 3.5,
    agentMarginPercent: 2.5,
    minTopup: 1.0,
    maxTopup: 500.0,
    status: "active",
  },
  {
    id: "air-telecel",
    network: "Telecel",
    name: "Telecel Cash VTU Airtime",
    vtuDiscountPercent: 4.0,
    agentMarginPercent: 3.0,
    minTopup: 1.0,
    maxTopup: 500.0,
    status: "active",
  },
  {
    id: "air-at",
    network: "AirtelTigo",
    name: "AT (AirtelTigo) Airtime Direct",
    vtuDiscountPercent: 5.0,
    agentMarginPercent: 3.5,
    minTopup: 1.0,
    maxTopup: 500.0,
    status: "active",
  },
];

const DEFAULT_SERVICE_FEES: ServiceFeeRecord[] = [
  {
    id: "srv-afa-1",
    serviceName: "AFA Member Registration",
    category: "afa",
    retailPrice: 35.0,
    wholesaleCost: 20.0,
    agentCommission: 10.0,
    description:
      "Official Farmers Association Ghana biometric registration & SIM clearance",
  },
  {
    id: "srv-util-ecg",
    serviceName: "ECG Electricity Token Processing",
    category: "utility",
    retailPrice: 2.0,
    wholesaleCost: 0.5,
    agentCommission: 1.0,
    description: "Prepaid meter token processing fee",
  },
  {
    id: "srv-util-gwcl",
    serviceName: "GWCL Water Bill Payment",
    category: "utility",
    retailPrice: 2.0,
    wholesaleCost: 0.5,
    agentCommission: 1.0,
    description: "Ghana Water Company bill collection fee",
  },
  {
    id: "srv-sms-bulk",
    serviceName: "Bulk SMS Per Unit Credit",
    category: "sms",
    retailPrice: 0.05,
    wholesaleCost: 0.03,
    agentCommission: 0.01,
    description: "Base gateway price per SMS page delivered",
  },
];

const ITEMS_PER_PAGE = 8;

export const AdminPricing: React.FC<AdminPricingProps> = ({
  bundles: propBundles,
  checkers: propCheckers,
  onUpdateBundlePrice,
  onUpdateCheckerPrice,
  onNavigateTab,
}) => {
  // Use prop data if provided, fallback to initial seed
  const [bundlesList, setBundlesList] = useState<DataBundle[]>(
    propBundles && propBundles.length > 0 ? propBundles : INITIAL_BUNDLES,
  );

  const [checkersList, setCheckersList] = useState<ResultCheckerProduct[]>(
    propCheckers && propCheckers.length > 0 ? propCheckers : INITIAL_CHECKERS,
  );

  const [airtimeRates] = useState<AirtimeRateRecord[]>(DEFAULT_AIRTIME_RATES);
  const [serviceFees] = useState<ServiceFeeRecord[]>(DEFAULT_SERVICE_FEES);

  // Active Tab: "data" | "airtime" | "checkers" | "services"
  const [activeTab, setActiveTab] = useState<string>("data");

  // Filter States for Data Bundles
  const [searchQuery, setSearchQuery] = useState("");
  const [networkFilter, setNetworkFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Toast & Modal States
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "info" | "error";
  } | null>(null);

  const [editingBundle, setEditingBundle] = useState<DataBundle | null>(null);
  const [editWholesale, setEditWholesale] = useState("");
  const [editRetail, setEditRetail] = useState("");

  const showToast = (
    text: string,
    type: "success" | "info" | "error" = "info",
  ) => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Stats calculation
  const stats = useMemo(() => {
    const totalPackages = bundlesList.length;
    const avgWholesale =
      totalPackages > 0
        ? bundlesList.reduce((sum, b) => sum + b.wholesalePrice, 0) /
          totalPackages
        : 0;
    const totalCheckers = checkersList.length;
    const activeAirtime = airtimeRates.filter(
      (r) => r.status === "active",
    ).length;

    return {
      totalPackages,
      avgWholesale,
      totalCheckers,
      activeAirtime,
    };
  }, [bundlesList, checkersList, airtimeRates]);

  // Filtered Bundles for Data Tab
  const filteredBundles = useMemo(() => {
    return bundlesList.filter((b) => {
      const matchNetwork =
        networkFilter === "ALL" || b.network === networkFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        b.name.toLowerCase().includes(q) ||
        b.sizeLabel.toLowerCase().includes(q) ||
        b.validity.toLowerCase().includes(q);

      const matchCategory =
        categoryFilter === "all" ||
        (categoryFilter === "high_volume" && b.sizeGb >= 10) ||
        (categoryFilter === "standard" && b.sizeGb >= 5 && b.sizeGb < 10) ||
        (categoryFilter === "starter" && b.sizeGb < 5);

      return matchNetwork && matchSearch && matchCategory;
    });
  }, [bundlesList, networkFilter, searchQuery, categoryFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredBundles.length / ITEMS_PER_PAGE),
  );

  const paginatedBundles = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredBundles.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredBundles, currentPage]);

  const isFiltered =
    searchQuery.trim() !== "" ||
    networkFilter !== "ALL" ||
    categoryFilter !== "all";

  const handleResetFilters = () => {
    setSearchQuery("");
    setNetworkFilter("ALL");
    setCategoryFilter("all");
    setCurrentPage(1);
  };

  const handleOpenEditModal = (bundle: DataBundle) => {
    setEditingBundle(bundle);
    setEditWholesale(bundle.wholesalePrice.toFixed(2));
    setEditRetail(bundle.retailPrice.toFixed(2));
  };

  const handleSaveBundlePrice = () => {
    if (!editingBundle) return;
    const wholesale = Number(editWholesale);
    const retail = Number(editRetail);

    if (isNaN(wholesale) || wholesale <= 0 || isNaN(retail) || retail <= 0) {
      showToast("Please enter valid positive numbers for pricing.", "error");
      return;
    }

    if (wholesale >= retail) {
      showToast("Retail price must be greater than wholesale cost.", "error");
      return;
    }

    const updated = bundlesList.map((b) =>
      b.id === editingBundle.id
        ? { ...b, wholesalePrice: wholesale, retailPrice: retail }
        : b,
    );

    setBundlesList(updated);
    onUpdateBundlePrice?.(editingBundle.id, wholesale, retail);
    showToast(
      `Updated pricing for ${editingBundle.name}: Wholesale GH₵ ${wholesale.toFixed(2)} · Retail GH₵ ${retail.toFixed(2)}`,
      "success",
    );
    setEditingBundle(null);
  };

  const handleExportCsv = () => {
    const head = [
      "Package Name",
      "Network",
      "Data Size",
      "Validity",
      "Wholesale Cost (GHS)",
      "Retail Price (GHS)",
      "Margin (GHS)",
      "Margin %",
    ];

    const esc = (c: unknown) =>
      `"${String(c == null ? "" : c).replace(/"/g, '""')}"`;

    const rows = filteredBundles.map((b) => {
      const margin = b.retailPrice - b.wholesalePrice;
      const marginPct = (margin / b.wholesalePrice) * 100;
      return [
        esc(b.name),
        esc(b.network),
        esc(b.sizeLabel),
        esc(b.validity),
        esc(b.wholesalePrice.toFixed(2)),
        esc(b.retailPrice.toFixed(2)),
        esc(margin.toFixed(2)),
        esc(marginPct.toFixed(1) + "%"),
      ];
    });

    const csv = [head.map(esc).join(","), ...rows.map((r) => r.join(","))].join(
      "\r\n",
    );
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `admin-pricing-catalog-${activeTab}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);

    showToast(`Exported ${rows.length} pricing records to CSV.`, "success");
  };

  const getNetworkBadge = (network: TelecomNetwork) => {
    switch (network) {
      case "MTN":
        return (
          <Badge className="bg-amber-400 text-amber-950 hover:bg-amber-400 font-extrabold text-[10px]">
            MTN Ghana
          </Badge>
        );
      case "Telecel":
        return (
          <Badge className="bg-red-600 text-white hover:bg-red-600 font-extrabold text-[10px]">
            Telecel
          </Badge>
        );
      case "AirtelTigo":
        return (
          <Badge className="bg-blue-600 text-white hover:bg-blue-600 font-extrabold text-[10px]">
            AT (AirtelTigo)
          </Badge>
        );
      default:
        return <Badge variant="outline">{network}</Badge>;
    }
  };

  // Keep onNavigateTab in scope
  void onNavigateTab;

  return (
    <div className="space-y-6">
      {/* ── 1. PAGE HEADER ── */}
      <div className="flex flex-col items-start justify-between gap-4 border-b border-border pb-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-foreground">
            <Sliders className="size-6 text-primary" />
            <span>Pricing &amp; Tariff Administration</span>
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Manage platform wholesale rates, retail price caps, carrier VTU
            discounts, result checker pricing, and service fees.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {toastMessage && (
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-lg animate-in fade-in duration-200 border ${
                toastMessage.type === "success"
                  ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                  : toastMessage.type === "error"
                    ? "text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20"
                    : "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20"
              }`}
            >
              {toastMessage.text}
            </span>
          )}

          <Button
            size="sm"
            onClick={handleExportCsv}
            className="text-xs font-bold shadow-xs cursor-pointer gap-1.5 h-9"
          >
            <Download className="size-4" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* ── 2. STATS TILES ── (Matching AdminUsers & Referrals Tiers layout) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Active Packages */}
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-blue-500/10">
              <Layers className="size-3.5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Active data packages
            </span>
          </div>
          <p className="mt-2 text-xl font-black tabular-nums text-foreground">
            {stats.totalPackages} Packages
          </p>
          <p className="text-[10px] text-muted-foreground font-medium">
            Across MTN, Telecel &amp; AT
          </p>
        </div>

        {/* Avg Wholesale Cost */}
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10">
              <Coins className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Avg wholesale cost
            </span>
          </div>
          <p className="mt-2 text-xl font-black tabular-nums text-emerald-600 dark:text-emerald-400">
            GH₵ {stats.avgWholesale.toFixed(2)}
          </p>
          <p className="text-[10px] text-muted-foreground font-medium">
            Synced with Arkesel &amp; Telco APIs
          </p>
        </div>

        {/* Airtime VTU Discount */}
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10">
              <Zap className="size-3.5 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Airtime VTU discount
            </span>
          </div>
          <p className="mt-2 text-xl font-black tabular-nums text-amber-600 dark:text-amber-400">
            3.5% - 5.0%
          </p>
          <p className="text-[10px] text-muted-foreground font-medium">
            Carrier commission margin
          </p>
        </div>

        {/* Result Checkers */}
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-purple-500/10">
              <GraduationCap className="size-3.5 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Result checker products
            </span>
          </div>
          <p className="mt-2 text-xl font-black tabular-nums text-purple-600 dark:text-purple-400">
            {stats.totalCheckers} Products
          </p>
          <p className="text-[10px] text-muted-foreground font-medium">
            WASSCE, BECE &amp; NOVDEC tokens
          </p>
        </div>
      </div>

      {/* ── 3. NAVIGATION TABS ── (Store Builder Tabs Approach) */}
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
                <Layers className="w-4 h-4 text-primary" />
                <span>Data Packages &amp; Wholesale</span>
              </TabsTrigger>
              <TabsTrigger
                value="airtime"
                className="h-6 rounded-xl px-4 py-2 text-[12px] flex items-center gap-2 transition-all data-active:!bg-background data-active:text-foreground data-active:shadow-sm"
              >
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Airtime Rates</span>
              </TabsTrigger>
              <TabsTrigger
                value="checkers"
                className="h-6 rounded-xl px-4 py-2 text-[12px] flex items-center gap-2 transition-all data-active:!bg-background data-active:text-foreground data-active:shadow-sm"
              >
                <GraduationCap className="w-4 h-4 text-purple-500" />
                <span>Result Checkers</span>
              </TabsTrigger>
              <TabsTrigger
                value="services"
                className="h-6 rounded-xl px-4 py-2 text-[12px] flex items-center gap-2 transition-all data-active:!bg-background data-active:text-foreground data-active:shadow-sm"
              >
                <Store className="w-4 h-4 text-emerald-500" />
                <span>AFA &amp; Service Fees</span>
              </TabsTrigger>
            </TabsList>
          </div>
          <ScrollBar orientation="horizontal" className="h-2" />
        </ScrollArea>

        {/* ── TAB 1: DATA PACKAGES & WHOLESALE ── (Product Catalog & Wholesale Pricing from Store Builder) */}
        <TabsContent value="data" className="m-0 space-y-6">
          <Card className="rounded-2xl border border-border bg-card shadow-xs">
            <CardHeader className="border-b border-border pb-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-base font-extrabold text-foreground">
                  <Layers className="size-5 text-primary" />
                  <span>Product Catalog &amp; Wholesale Pricing</span>
                </CardTitle>
                <CardDescription className="mt-1 text-xs">
                  Wholesale carrier rates synced with SDH gateway. Selling
                  prices are floor-protected against cost.
                </CardDescription>
              </div>
            </CardHeader>

            {/* Search + Filters (Matching Product Catalog & Wholesale Pricing) */}
            <div className="border-b border-border bg-muted/20 p-4 space-y-4">
              {/* Search */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="catalog-search"
                  className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
                >
                  Search data packages
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="catalog-search"
                    type="text"
                    placeholder="Bundle name, data size (e.g. 5GB, 10GB), validity..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="h-10 bg-background pl-9 pr-9 text-xs font-medium"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setCurrentPage(1);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Filters Box */}
              <div className="rounded-xl border border-border bg-background p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="size-3.5 text-muted-foreground" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Catalog filters
                    </span>
                    {isFiltered && (
                      <Badge
                        variant="secondary"
                        className="text-[9px] px-1.5 py-0 font-semibold"
                      >
                        Active
                      </Badge>
                    )}
                  </div>
                  {isFiltered && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleResetFilters}
                      className="h-6 px-2 text-[10px] font-bold text-primary cursor-pointer bg-transparent hover:!bg-transparent hover:text-primary"
                    >
                      Reset all filters
                    </Button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  {/* Network Filter */}
                  <div className="space-y-1.5 w-full sm:w-1/2">
                    <Label
                      htmlFor="network-filter-select"
                      className="text-[10px] font-semibold text-muted-foreground"
                    >
                      Telecom Carrier
                    </Label>
                    <Select
                      value={networkFilter}
                      onValueChange={(v) => {
                        setNetworkFilter(v);
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger
                        id="network-filter-select"
                        className="h-9 w-full text-xs bg-background"
                      >
                        <SelectValue placeholder="All telecom carriers" />
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
                  <div className="space-y-1.5 w-full sm:w-1/2">
                    <Label
                      htmlFor="category-filter-select"
                      className="text-[10px] font-semibold text-muted-foreground"
                    >
                      Bundle Tier
                    </Label>
                    <Select
                      value={categoryFilter}
                      onValueChange={(v) => {
                        setCategoryFilter(v);
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger
                        id="category-filter-select"
                        className="h-9 w-full text-xs bg-background"
                      >
                        <SelectValue placeholder="All data sizes" />
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
              </div>
            </div>

            {/* Table Content */}
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Bundle / Package
                      </TableHead>
                      <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Carrier
                      </TableHead>
                      <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-right">
                        Wholesale Cost (GH₵)
                      </TableHead>
                      <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-right">
                        Retail Selling Price (GH₵)
                      </TableHead>
                      <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-right">
                        Profit / Sale (GH₵)
                      </TableHead>
                      <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-center">
                        Reseller Margin
                      </TableHead>
                      <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-right">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedBundles.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="py-10 text-center text-muted-foreground"
                        >
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <AlertCircle className="size-5 text-muted-foreground/60" />
                            <p className="text-xs font-semibold">
                              No data bundles match your search or filter.
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedBundles.map((b) => {
                        const profit = b.retailPrice - b.wholesalePrice;
                        const marginPct =
                          b.wholesalePrice > 0
                            ? (profit / b.wholesalePrice) * 100
                            : 0;

                        return (
                          <TableRow
                            key={b.id}
                            className="hover:bg-muted/20 transition-colors"
                          >
                            <TableCell className="py-3 font-extrabold text-xs text-foreground">
                              <div className="space-y-0.5">
                                <div className="text-xs font-extrabold text-foreground">
                                  {b.name}
                                </div>
                                <div className="text-[11px] text-muted-foreground">
                                  {b.sizeLabel} · {b.validity}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-3">
                              {getNetworkBadge(b.network)}
                            </TableCell>
                            <TableCell className="py-3 text-right text-xs font-bold tabular-nums text-foreground">
                              GH₵ {b.wholesalePrice.toFixed(2)}
                            </TableCell>
                            <TableCell className="py-3 text-right text-xs font-black tabular-nums text-primary">
                              GH₵ {b.retailPrice.toFixed(2)}
                            </TableCell>
                            <TableCell className="py-3 text-right text-xs font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                              +GH₵ {profit.toFixed(2)}
                            </TableCell>
                            <TableCell className="py-3 text-center">
                              <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold tabular-nums">
                                +{marginPct.toFixed(1)}%
                              </Badge>
                            </TableCell>
                            <TableCell className="py-3 text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenEditModal(b)}
                                className="h-7 text-xs font-bold gap-1 cursor-pointer"
                              >
                                <Edit2 className="size-3" />
                                <span>Edit</span>
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Footer */}
              <div className="p-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
                <div>
                  Showing{" "}
                  <span className="font-bold text-foreground">
                    {Math.min(1, filteredBundles.length)}
                  </span>{" "}
                  to{" "}
                  <span className="font-bold text-foreground">
                    {Math.min(
                      currentPage * ITEMS_PER_PAGE,
                      filteredBundles.length,
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-bold text-foreground">
                    {filteredBundles.length}
                  </span>{" "}
                  packages
                </div>
                {totalPages > 1 && (
                  <PaginationHelper
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={(page) => setCurrentPage(page)}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB 2: AIRTIME RATES ── */}
        <TabsContent value="airtime" className="m-0 space-y-6">
          <Card className="rounded-2xl border border-border bg-card shadow-xs">
            <CardHeader className="border-b border-border pb-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-base font-extrabold text-foreground">
                  <Zap className="size-5 text-amber-500" />
                  <span>Carrier VTU Airtime Discount &amp; Margin Rules</span>
                </CardTitle>
                <CardDescription className="mt-1 text-xs">
                  Configure telco carrier commission rates and agent reselling
                  margins for instant VTU top-ups.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Network Carrier
                    </TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      VTU Carrier Discount
                    </TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Agent Reseller Margin
                    </TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Top-Up Limit Range
                    </TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-center">
                      Gateway Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {airtimeRates.map((r) => (
                    <TableRow key={r.id} className="hover:bg-muted/20">
                      <TableCell className="py-3 font-extrabold text-xs text-foreground">
                        <div className="flex items-center gap-2">
                          {getNetworkBadge(r.network)}
                          <span className="font-extrabold text-xs">
                            {r.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-[10px] font-bold tabular-nums">
                          {r.vtuDiscountPercent.toFixed(1)}% Discount
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold tabular-nums">
                          +{r.agentMarginPercent.toFixed(1)}% Commission
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 text-xs text-muted-foreground font-semibold tabular-nums">
                        GH₵ {r.minTopup.toFixed(2)} – GH₵{" "}
                        {r.maxTopup.toFixed(2)}
                      </TableCell>
                      <TableCell className="py-3 text-center">
                        <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase">
                          Active Gateway
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB 3: RESULT CHECKERS ── */}
        <TabsContent value="checkers" className="m-0 space-y-6">
          <Card className="rounded-2xl border border-border bg-card shadow-xs">
            <CardHeader className="border-b border-border pb-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-base font-extrabold text-foreground">
                  <GraduationCap className="size-5 text-purple-500" />
                  <span>Exam Result Checkers Pricing &amp; Stock</span>
                </CardTitle>
                <CardDescription className="mt-1 text-xs">
                  Set retail prices and wholesale costs for WAEC WASSCE, BECE,
                  CSSPS, and NOVDEC tokens.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Product Title
                    </TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Exam Body
                    </TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-right">
                      Wholesale Cost (GH₵)
                    </TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-right">
                      Retail Selling Price (GH₵)
                    </TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-right">
                      Agent Margin (GH₵)
                    </TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-right">
                      Available Stock
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {checkersList.map((c) => {
                    const wholesale = c.wholesalePrice ?? c.price - 5;
                    const margin = c.price - wholesale;
                    return (
                      <TableRow key={c.id} className="hover:bg-muted/20">
                        <TableCell className="py-3 font-extrabold text-xs text-foreground">
                          {c.title}
                        </TableCell>
                        <TableCell className="py-3">
                          <Badge
                            variant="outline"
                            className="text-[10px] font-extrabold"
                          >
                            {c.examBody}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 text-right text-xs font-bold tabular-nums text-foreground">
                          GH₵ {wholesale.toFixed(2)}
                        </TableCell>
                        <TableCell className="py-3 text-right text-xs font-black tabular-nums text-primary">
                          GH₵ {c.price.toFixed(2)}
                        </TableCell>
                        <TableCell className="py-3 text-right text-xs font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                          +GH₵ {margin.toFixed(2)}
                        </TableCell>
                        <TableCell className="py-3 text-right text-xs font-bold tabular-nums text-foreground">
                          {c.stockCount} serials
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB 4: AFA & SERVICE FEES ── */}
        <TabsContent value="services" className="m-0 space-y-6">
          <Card className="rounded-2xl border border-border bg-card shadow-xs">
            <CardHeader className="border-b border-border pb-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-base font-extrabold text-foreground">
                  <Store className="size-5 text-emerald-500" />
                  <span>AFA &amp; System Service Fees</span>
                </CardTitle>
                <CardDescription className="mt-1 text-xs">
                  Fee structures for farmer association onboarding, ECG/GWCL
                  processing, and bulk messaging.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Service Name
                    </TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Category
                    </TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-right">
                      Wholesale Cost (GH₵)
                    </TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-right">
                      Retail Fee (GH₵)
                    </TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-right">
                      Agent Payout (GH₵)
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {serviceFees.map((s) => (
                    <TableRow key={s.id} className="hover:bg-muted/20">
                      <TableCell className="py-3 font-extrabold text-xs text-foreground">
                        <div className="space-y-0.5">
                          <div className="text-xs font-extrabold text-foreground">
                            {s.serviceName}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {s.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30 text-[10px] font-bold uppercase">
                          {s.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 text-right text-xs font-bold tabular-nums text-foreground">
                        GH₵ {s.wholesaleCost.toFixed(2)}
                      </TableCell>
                      <TableCell className="py-3 text-right text-xs font-black tabular-nums text-primary">
                        GH₵ {s.retailPrice.toFixed(2)}
                      </TableCell>
                      <TableCell className="py-3 text-right text-xs font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                        +GH₵ {s.agentCommission.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── EDIT BUNDLE PRICING MODAL ── */}
      {editingBundle && (
        <Dialog open={true} onOpenChange={() => setEditingBundle(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-extrabold">
                <Edit2 className="size-4 text-primary" />
                <span>Edit Package Pricing</span>
              </DialogTitle>
              <DialogDescription className="text-xs">
                Update wholesale cost and retail selling price for{" "}
                <strong>{editingBundle.name}</strong>.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="wholesale-price" className="text-xs font-bold">
                  Carrier Wholesale Cost (GH₵)
                </Label>
                <Input
                  id="wholesale-price"
                  type="number"
                  step="0.10"
                  value={editWholesale}
                  onChange={(e) => setEditWholesale(e.target.value)}
                  className="h-10 text-xs font-semibold tabular-nums"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="retail-price" className="text-xs font-bold">
                  Default Retail Selling Price (GH₵)
                </Label>
                <Input
                  id="retail-price"
                  type="number"
                  step="0.50"
                  value={editRetail}
                  onChange={(e) => setEditRetail(e.target.value)}
                  className="h-10 text-xs font-semibold tabular-nums"
                />
              </div>

              {Number(editRetail) > Number(editWholesale) && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  Computed Profit Margin: GH₵{" "}
                  {(Number(editRetail) - Number(editWholesale)).toFixed(2)} (+
                  {(
                    ((Number(editRetail) - Number(editWholesale)) /
                      Number(editWholesale)) *
                    100
                  ).toFixed(1)}
                  %)
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingBundle(null)}
                className="text-xs font-bold cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveBundlePrice}
                className="text-xs font-bold shadow-xs cursor-pointer gap-1.5"
              >
                <Save className="size-3.5" />
                <span>Save Changes</span>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

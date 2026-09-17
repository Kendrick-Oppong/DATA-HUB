import React, { useState, useMemo } from "react";
import {
  Server,
  Activity,
  Layers,
  ShieldAlert,
  RotateCcw,
  AlertTriangle,
  FileCheck,
  GraduationCap,
  DollarSign,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Check,
  X,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  ArrowUpDown,
  Clock,
  Receipt,
  TrendingUp,
  SlidersHorizontal,
  Download,
  Eye,
  CheckCircle2,
} from "lucide-react";
import {
  TelecomGateway,
  Order,
  AfaApplication,
  ResultCheckerProduct,
  TelecomNetwork,
  Transaction,
  Complaint,
} from "../../types";
import { AdminTransactions } from "./AdminTransactions";
import { AdminCommissions } from "./AdminCommissions";
import { AdminPayouts } from "./AdminPayouts";
import { AdminComplaints } from "./AdminComplaints";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../ui/card";
import { Label } from "../ui/label";
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
import { PaginationHelper } from "../customer/views/PaginationHelper";
import { SignalRail } from "../common/SignalRail";

interface AdminOperationsProps {
  view:
    | "gateways"
    | "orders-audit"
    | "transactions"
    | "commissions"
    | "settlement"
    | "payouts"
    | "afa-verification"
    | "vouchers-stock"
    | "complaints";
  gateways: TelecomGateway[];
  onToggleGatewayStatus: (gatewayId: string) => void;
  orders: Order[];
  onRetryOrder: (orderId: string) => void;
  onRefundOrder: (orderId: string) => void;
  afaApplications: AfaApplication[];
  onUpdateAfaStatus: (
    appId: string,
    status: "approved" | "rejected" | "needs_correction",
  ) => void;
  checkers: ResultCheckerProduct[];
  onAddVoucherStock: (checkerId: string, count: number) => void;
  transactions?: Transaction[];
  onNavigateTab?: (tab: string) => void;
  complaints?: Complaint[];
  onReplyComplaint?: (ticketId: string, replyText: string) => void;
  onAddComplaint?: (ticket: Complaint) => void;
  onUpdateComplaintStatus?: (
    ticketId: string,
    status: Complaint["status"],
    priority?: Complaint["priority"]
  ) => void;
}

export const AdminOperations: React.FC<AdminOperationsProps> = ({
  view,
  gateways,
  onToggleGatewayStatus,
  orders,
  onRetryOrder,
  onRefundOrder,
  afaApplications,
  onUpdateAfaStatus,
  checkers,
  onAddVoucherStock,
  transactions = [],
  onNavigateTab,
  complaints = [],
  onReplyComplaint = () => {},
  onAddComplaint = () => {},
  onUpdateComplaintStatus,
}) => {
  // Orders audit state
  const [orderQuery, setOrderQuery] = useState("");
  const [orderNetworkFilter, setOrderNetworkFilter] = useState("all");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [orderSortBy, setOrderSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const ORDERS_PER_PAGE = 8;

  // Gateways Search & Filters
  const [gatewaySearch, setGatewaySearch] = useState("");
  const [gatewayStatusFilter, setGatewayStatusFilter] = useState<string>("all");

  // AFA Search & Filters
  const [afaSearch, setAfaSearch] = useState("");
  const [afaStatusFilter, setAfaStatusFilter] = useState<string>("all");

  // Vouchers Search & Filters
  const [voucherSearch, setVoucherSearch] = useState("");

  // Settlement search
  const [settlementSearch, setSettlementSearch] = useState("");

  // Filtered Orders Audit
  const filteredOrders = orders
    .filter((o) => {
      const q = orderQuery.toLowerCase().trim();
      const matchQ =
        !q ||
        o.reference.toLowerCase().includes(q) ||
        o.recipientPhone.includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.productName.toLowerCase().includes(q);
      const matchNet =
        orderNetworkFilter === "all" || o.network === orderNetworkFilter;
      const matchStatus =
        orderStatusFilter === "all" || o.status === orderStatusFilter;
      return matchQ && matchNet && matchStatus;
    })
    .sort((a, b) => {
      if (orderSortBy === "amount-high") return b.amount - a.amount;
      if (orderSortBy === "amount-low") return a.amount - b.amount;
      if (orderSortBy === "oldest")
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

  // Filtered Gateways
  const filteredGateways = gateways.filter((gw) => {
    const q = gatewaySearch.toLowerCase().trim();
    const matchQ =
      !q ||
      gw.name.toLowerCase().includes(q) ||
      gw.id.toLowerCase().includes(q);
    const matchSt =
      gatewayStatusFilter === "all" || gw.status === gatewayStatusFilter;
    return matchQ && matchSt;
  });

  // Filtered AFA Applications
  const filteredAfa = afaApplications.filter((app) => {
    const q = afaSearch.toLowerCase().trim();
    const matchQ =
      !q ||
      app.fullName.toLowerCase().includes(q) ||
      app.phoneNumber.includes(q) ||
      app.ghanaCardNumber.toLowerCase().includes(q) ||
      app.region.toLowerCase().includes(q);
    const matchSt = afaStatusFilter === "all" || app.status === afaStatusFilter;
    return matchQ && matchSt;
  });

  // Filtered Vouchers
  const filteredVouchers = checkers.filter((chk) => {
    const q = voucherSearch.toLowerCase().trim();
    return (
      !q ||
      chk.title.toLowerCase().includes(q) ||
      chk.examBody.toLowerCase().includes(q)
    );
  });

  // Date formatter for table (YYYY-MM-DD HH:mm)
  function formatOrderDate(dateStr: string): string {
    if (!dateStr) return "—";
    try {
      const trimmed = dateStr.trim();
      const parseable = trimmed.includes("T")
        ? trimmed
        : trimmed.replace(" ", "T");
      const d = new Date(parseable);
      if (!isNaN(d.getTime())) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        const hours = String(d.getHours()).padStart(2, "0");
        const minutes = String(d.getMinutes()).padStart(2, "0");
        return `${year}-${month}-${day} ${hours}:${minutes}`;
      }
      if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}/.test(trimmed)) {
        return trimmed.replace("T", " ").slice(0, 16);
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  }

  // Derived counts for metric tiles
  const totalCount = orders.length;
  const deliveredCount = orders.filter((o) => o.status === "delivered").length;
  const waitingCount = orders.filter((o) => o.status === "waiting").length;
  const processingCount = orders.filter(
    (o) => o.status === "processing",
  ).length;
  const pendingCount = orders.filter(
    (o) => o.status === "pending" || o.status === "pending_payment",
  ).length;
  const failedCount = orders.filter((o) => o.status === "failed").length;
  const refundedCount = orders.filter((o) => o.status === "refunded").length;
  const needsAttentionCount = failedCount + refundedCount;

  // Delivered revenue
  const deliveredRevenue = orders
    .filter((o) => o.status === "delivered")
    .reduce((sum, o) => sum + o.amount, 0);

  // Pagination calculation
  const totalPages = Math.ceil(filteredOrders.length / ORDERS_PER_PAGE) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * ORDERS_PER_PAGE;
    return filteredOrders.slice(start, start + ORDERS_PER_PAGE);
  }, [filteredOrders, currentPage]);

  const hasActiveFilters =
    orderQuery.trim() !== "" ||
    orderNetworkFilter !== "all" ||
    orderStatusFilter !== "all" ||
    orderSortBy !== "newest";

  const handleResetFilters = () => {
    setOrderQuery("");
    setOrderNetworkFilter("all");
    setOrderStatusFilter("all");
    setOrderSortBy("newest");
    setCurrentPage(1);
  };

  // CSV Export
  const handleExportCsv = () => {
    const headers = [
      "Reference",
      "Date",
      "Customer",
      "Phone",
      "Network",
      "Product",
      "Amount",
      "Status",
    ];
    const rows = filteredOrders.map((o) => [
      o.reference,
      o.date,
      `"${o.customerName}"`,
      o.recipientPhone,
      o.network,
      `"${o.productName}"`,
      o.amount.toFixed(2),
      o.status,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `sdh_admin_orders_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* VIEW: GATEWAYS & CARRIER SWITCHES */}
      {view === "gateways" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border">
            <div>
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
                <Server className="w-6 h-6 text-primary" />
                <span>Telecom Carrier Switches & Core Gateways</span>
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Monitor real-time EVD dispatch latency, uptime, and configure
                upstream carrier failover.
              </p>
            </div>
            <SignalRail
              status="online"
              size="md"
              label="SDH Core Switch Active"
            />
          </div>

          {/* Gateway Search Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Filter carrier gateway by name or ID..."
                  value={gatewaySearch}
                  onChange={(e) => setGatewaySearch(e.target.value)}
                  className="pl-8 h-9 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={gatewayStatusFilter}
                onChange={(e) => setGatewayStatusFilter(e.target.value)}
                className="h-9 text-xs w-36 rounded-lg border border-input bg-background text-foreground px-2"
              >
                <option value="all">All Switch States</option>
                <option value="online">Online / Active</option>
                <option value="degraded">Degraded</option>
                <option value="offline">Offline / Standby</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGateways.map((gw) => (
              <Card
                key={gw.id}
                className="border-border shadow-xs space-y-4 hover:border-primary/40 transition-colors"
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-sm font-bold text-foreground">
                        {gw.name}
                      </CardTitle>
                      <CardDescription className="text-[10px] uppercase font-semibold text-muted-foreground">
                        Gateway ID: {gw.id}
                      </CardDescription>
                    </div>
                    <SignalRail status={gw.status} size="sm" />
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-muted/40 border border-border/80">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                        Latency
                      </span>
                      <span className="font-bold text-foreground tabular-nums">
                        {gw.latencyMs} ms
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-muted/40 border border-border/80">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                        Success Rate
                      </span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {gw.successRate}%
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-border text-xs">
                    <span className="text-muted-foreground">
                      Carrier Switch Status:
                    </span>
                    <Button
                      variant={
                        gw.status === "online" ? "destructive" : "default"
                      }
                      size="sm"
                      onClick={() => onToggleGatewayStatus(gw.id)}
                      className="h-7 text-xs font-bold"
                    >
                      {gw.status === "online"
                        ? "Force Standby"
                        : "Enable Active"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: ORDERS AUDIT WITH COMPLETE SEARCH & MULTI-FILTERS */}
      {view === "orders-audit" && (
        <div className="space-y-6 animate-in fade-in-50">
          {/* 1. TOP HEADER */}
          <div className="flex flex-col items-start justify-between gap-4 border-b border-border pb-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-foreground">
                <Activity className="size-6 text-primary" />
                <span>Orders & Sales Ledger</span>
              </h1>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Platform-wide audit log of all customer purchases, agent
                storefront sales, and direct dispatches.
              </p>
            </div>

            <div>
              <Button
                size="sm"
                onClick={handleExportCsv}
                className="text-xs font-bold shadow-xs cursor-pointer gap-1.5 h-9"
              >
                <Download className="size-4 stroke-3" />
                <span>Export CSV</span>
              </Button>
            </div>
          </div>

          {/* 2. STATS CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Tile 1: All Orders */}
            <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
                  <Receipt className="size-3.5 text-primary" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  All Orders
                </span>
              </div>
              <p className="mt-2 text-xl font-black tabular-nums text-foreground">
                {totalCount}
              </p>
              <p className="text-[10px] text-muted-foreground font-medium">
                Platform-wide total
              </p>
            </div>

            {/* Tile 2: Revenue Delivered */}
            <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10">
                  <TrendingUp className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Revenue
                </span>
              </div>
              <p className="mt-2 text-xl font-black tabular-nums text-foreground">
                GH₵ {deliveredRevenue.toFixed(2)}
              </p>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                {deliveredCount} fulfilled
              </p>
            </div>

            {/* Tile 3: Processing */}
            <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10">
                  <Clock className="size-3.5 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  In Flight
                </span>
              </div>
              <p className="mt-2 text-xl font-black tabular-nums text-foreground">
                {processingCount + waitingCount + pendingCount}
              </p>
              <p className="text-[10px] text-muted-foreground font-medium">
                Processing & waiting
              </p>
            </div>

            {/* Tile 4: Needs Attention */}
            <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-red-500/10">
                  <AlertCircle className="size-3.5 text-red-600 dark:text-red-400" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Attention
                </span>
              </div>
              <p className="mt-2 text-xl font-black tabular-nums text-foreground">
                {needsAttentionCount}
              </p>
              <p className="text-[10px] text-destructive font-medium">
                {needsAttentionCount > 0
                  ? `${needsAttentionCount} failed or refunded`
                  : "All orders healthy"}
              </p>
            </div>
          </div>

          {/* 3. MASTER ORDERS TABLE CARD */}
          <Card className="border-border shadow-xs">
            <CardHeader className="border-b border-border pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base font-extrabold text-foreground">
                    Platform Orders Audit
                  </CardTitle>
                  <CardDescription className="mt-1 text-xs">
                    Comprehensive log of all platform orders with full NOC
                    resolution controls.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            {/* Search + Filters */}
            <div className="border-b border-border bg-muted/20 p-4">
              <div className="space-y-4">
                {/* Search */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="orders-search"
                    className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
                  >
                    Search orders
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="orders-search"
                      type="text"
                      placeholder="Search phone number, customer name, reference, or package..."
                      value={orderQuery}
                      onChange={(e) => {
                        setOrderQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="h-10 bg-background pl-9 text-xs"
                    />
                  </div>
                </div>

                {/* Filters Box */}
                <div className="rounded-xl border border-border bg-background p-3">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="size-3.5 text-muted-foreground" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Order filters
                      </span>
                    </div>
                    {hasActiveFilters && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleResetFilters}
                        className="h-6 px-2 text-[10px] font-bold text-primary hover:bg-primary/10 cursor-pointer"
                      >
                        Reset filters
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {/* Network Filter */}
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="filter-network"
                        className="text-[10px] font-semibold text-muted-foreground"
                      >
                        Telecom carrier
                      </Label>
                      <Select
                        value={orderNetworkFilter}
                        onValueChange={(val) => {
                          if (val) {
                            setOrderNetworkFilter(val);
                            setCurrentPage(1);
                          }
                        }}
                      >
                        <SelectTrigger
                          id="filter-network"
                          className="h-9 w-full text-xs"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All carriers</SelectItem>
                          <SelectItem value="MTN">MTN</SelectItem>
                          <SelectItem value="Telecel">Telecel</SelectItem>
                          <SelectItem value="AirtelTigo">AirtelTigo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Status Filter */}
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="filter-status"
                        className="text-[10px] font-semibold text-muted-foreground"
                      >
                        Delivery status
                      </Label>
                      <Select
                        value={orderStatusFilter}
                        onValueChange={(val) => {
                          if (val) {
                            setOrderStatusFilter(val);
                            setCurrentPage(1);
                          }
                        }}
                      >
                        <SelectTrigger
                          id="filter-status"
                          className="h-9 w-full text-xs"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">
                            All statuses ({totalCount})
                          </SelectItem>
                          <SelectItem value="waiting">
                            Waiting ({waitingCount})
                          </SelectItem>
                          <SelectItem value="processing">
                            Processing ({processingCount})
                          </SelectItem>
                          <SelectItem value="pending">
                            Pending ({pendingCount})
                          </SelectItem>
                          <SelectItem value="delivered">
                            Delivered ({deliveredCount})
                          </SelectItem>
                          <SelectItem value="failed">
                            Failed ({failedCount})
                          </SelectItem>
                          <SelectItem value="refunded">
                            Refunded ({refundedCount})
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Sort Filter */}
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="filter-sort"
                        className="text-[10px] font-semibold text-muted-foreground"
                      >
                        Sort by
                      </Label>
                      <Select
                        value={orderSortBy}
                        onValueChange={(val) => {
                          if (val) {
                            setOrderSortBy(val);
                            setCurrentPage(1);
                          }
                        }}
                      >
                        <SelectTrigger
                          id="filter-sort"
                          className="h-9 w-full text-xs"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="newest">Newest first</SelectItem>
                          <SelectItem value="oldest">Oldest first</SelectItem>
                          <SelectItem value="amount-high">
                            Amount: High-Low
                          </SelectItem>
                          <SelectItem value="amount-low">
                            Amount: Low-High
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Data Table */}
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order Reference</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Customer & Recipient</TableHead>
                    <TableHead>Product Package</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-center">
                      Carrier Status
                    </TableHead>
                    <TableHead className="text-right">NOC Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center py-10 text-muted-foreground"
                      >
                        <div className="flex flex-col items-center justify-center space-y-1">
                          <Search className="w-6 h-6 text-muted-foreground/50" />
                          <p className="text-xs font-bold text-foreground">
                            No audit records match your query.
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            Check search terms or reset filters.
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedOrders.map((ord) => (
                      <TableRow key={ord.id} className="hover:bg-muted/40">
                        <TableCell className="font-bold text-xs text-foreground tabular-nums">
                          {ord.reference}
                        </TableCell>
                        <TableCell className="text-muted-foreground tabular-nums text-xs">
                          {ord.date}
                        </TableCell>
                        <TableCell className="text-xs text-foreground">
                          <div className="font-semibold">
                            {ord.customerName}
                          </div>
                          <div className="text-[10px] text-muted-foreground tabular-nums">
                            {ord.recipientPhone}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-medium text-foreground">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${
                                ord.network === "MTN"
                                  ? "bg-amber-400 text-amber-950"
                                  : ord.network === "Telecel"
                                    ? "bg-red-600 text-white"
                                    : "bg-blue-600 text-white"
                              }`}
                            >
                              {ord.network.slice(0, 3)}
                            </span>
                            <span>{ord.productName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-black text-foreground tabular-nums text-xs">
                          GH₵ {ord.amount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          {(() => {
                            const isDelivered = ord.status === "delivered";
                            const isProcessing = ord.status === "processing";
                            const isWaiting = ord.status === "waiting";
                            const isPending =
                              ord.status === "pending" ||
                              ord.status === "pending_payment";
                            const isFailed = ord.status === "failed";
                            const isRefunded = ord.status === "refunded";

                            return (
                              <>
                                {isDelivered && (
                                  <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold inline-flex items-center gap-1">
                                    <span className="size-1.5 rounded-full bg-emerald-500" />
                                    <span>Delivered</span>
                                  </Badge>
                                )}
                                {isProcessing && (
                                  <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-[10px] font-bold inline-flex items-center gap-1">
                                    <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                                    <span>Processing</span>
                                  </Badge>
                                )}
                                {isWaiting && (
                                  <Badge className="bg-sky-500/15 text-sky-700 dark:text-sky-400 border border-sky-500/30 text-[10px] font-bold inline-flex items-center gap-1">
                                    <span className="size-1.5 rounded-full bg-sky-500" />
                                    <span>Waiting</span>
                                  </Badge>
                                )}
                                {isPending && (
                                  <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/30 text-[10px] font-bold inline-flex items-center gap-1">
                                    <span className="size-1.5 rounded-full bg-purple-500 animate-pulse" />
                                    <span>Pending</span>
                                  </Badge>
                                )}
                                {isFailed && (
                                  <Badge className="bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/30 text-[10px] font-bold inline-flex items-center gap-1">
                                    <span className="size-1.5 rounded-full bg-red-500" />
                                    <span>Failed</span>
                                  </Badge>
                                )}
                                {isRefunded && (
                                  <Badge
                                    variant="secondary"
                                    className="text-[10px] font-semibold text-muted-foreground"
                                  >
                                    Refunded
                                  </Badge>
                                )}
                              </>
                            );
                          })()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {ord.status === "failed" && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => onRetryOrder(ord.id)}
                                  className="h-7 px-2 text-xs"
                                  title="Retry EVD Dispatch"
                                >
                                  <RefreshCw className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => onRefundOrder(ord.id)}
                                  className="h-7 px-2.5 text-xs font-semibold"
                                  title="Refund to Customer Wallet"
                                >
                                  Refund
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination Footer */}
              <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs text-muted-foreground">
                  Showing{" "}
                  <span className="font-bold text-foreground">
                    {filteredOrders.length === 0
                      ? 0
                      : Math.min(
                          currentPage * ORDERS_PER_PAGE,
                          filteredOrders.length,
                        )}
                  </span>{" "}
                  of{" "}
                  <span className="font-bold text-foreground">
                    {filteredOrders.length}
                  </span>{" "}
                  orders
                </span>

                {filteredOrders.length > ORDERS_PER_PAGE && (
                  <div>
                    <PaginationHelper
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* VIEW: AFA VERIFICATION PORTAL WITH SEARCH & STATUS FILTER */}
      {view === "afa-verification" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border">
            <div>
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
                <FileCheck className="w-6 h-6 text-emerald-600" />
                <span>AFA National Identity & Tariff Verification Desk</span>
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Review Ghana Card numbers and whitelist eligible agricultural
                subscribers for subsidized telecom data.
              </p>
            </div>
            <Badge
              variant="outline"
              className="text-xs font-semibold tabular-nums"
            >
              Pending Verification:{" "}
              {
                afaApplications.filter((a) => a.status === "under_review")
                  .length
              }
            </Badge>
          </div>

          {/* Search and Filters Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search applicant name, phone, Ghana Card, or region..."
                value={afaSearch}
                onChange={(e) => setAfaSearch(e.target.value)}
                className="pl-8 h-9 text-xs"
              />
            </div>

            <select
              value={afaStatusFilter}
              onChange={(e) => setAfaStatusFilter(e.target.value)}
              className="h-9 text-xs w-40 rounded-lg border border-input bg-background text-foreground px-2"
            >
              <option value="all">All Verification States</option>
              <option value="under_review">Pending Review</option>
              <option value="approved">Approved & Whitelisted</option>
              <option value="needs_correction">Flagged for Correction</option>
            </select>
          </div>

          {/* AFA Applicants List */}
          <div className="space-y-3">
            {filteredAfa.length === 0 ? (
              <Card className="p-8 text-center border-border">
                <p className="text-xs text-muted-foreground">
                  No AFA applications found matching criteria.
                </p>
              </Card>
            ) : (
              filteredAfa.map((app) => (
                <Card
                  key={app.id}
                  className="p-5 border-border shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs hover:border-primary/40 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-foreground">
                        {app.fullName}
                      </span>
                      <span className="text-muted-foreground font-semibold tabular-nums">
                        ({app.phoneNumber})
                      </span>
                      <Badge
                        variant={
                          app.status === "approved" ? "default" : "secondary"
                        }
                        className="text-[10px] font-bold uppercase"
                      >
                        {app.status}
                      </Badge>
                    </div>
                    <div className="text-muted-foreground flex flex-wrap gap-3 pt-0.5">
                      <span>
                        Ghana Card:{" "}
                        <strong className="text-foreground tabular-nums">
                          {app.ghanaCardNumber}
                        </strong>
                      </span>
                      <span>
                        Region:{" "}
                        <strong className="text-foreground">
                          {app.region}
                        </strong>
                      </span>
                      <span>
                        Trade:{" "}
                        <strong className="text-foreground">
                          {app.occupation}
                        </strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => onUpdateAfaStatus(app.id, "approved")}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve & Whitelist</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        onUpdateAfaStatus(app.id, "needs_correction")
                      }
                      className="text-xs font-semibold"
                    >
                      Flag Correction
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* VIEW: VOUCHERS INVENTORY WITH SEARCH & INSTANT RESTOCK */}
      {view === "vouchers-stock" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border">
            <div>
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
                <GraduationCap className="w-6 h-6 text-purple-600" />
                <span>Results Checker Stock & Inventory Allocation</span>
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Manage live batch numbers from WAEC, Ministry of Education, and
                University admissions.
              </p>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search examination body..."
                value={voucherSearch}
                onChange={(e) => setVoucherSearch(e.target.value)}
                className="pl-8 h-9 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredVouchers.map((chk) => (
              <Card key={chk.id} className="border-border shadow-xs space-y-4">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-sm font-bold text-foreground">
                        {chk.title}
                      </CardTitle>
                      <CardDescription className="text-[10px] uppercase font-semibold text-muted-foreground">
                        {chk.examBody} Portal
                      </CardDescription>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-emerald-600 dark:text-emerald-400 font-bold text-xs tabular-nums"
                    >
                      {chk.stockCount} Cards In Stock
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center text-xs pt-2 border-t border-border">
                    <span className="text-muted-foreground font-medium">
                      Unit Retail: GH₵ {chk.price.toFixed(2)}
                    </span>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => onAddVoucherStock(chk.id, 50)}
                      className="font-bold text-xs gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add 50 Cards to Batch</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: SETTLEMENT / AGENT PAYOUTS */}
      {(view === "settlement" || view === "payouts") && (
        <AdminPayouts onNavigateTab={onNavigateTab} />
      )}

      {/* VIEW: PLATFORM TRANSACTIONS */}
      {view === "transactions" && (
        <AdminTransactions
          transactions={transactions}
          orders={orders}
          onNavigateTab={onNavigateTab}
        />
      )}

      {/* VIEW: STOREFRONT COMMISSIONS */}
      {view === "commissions" && (
        <AdminCommissions
          orders={orders}
          onNavigateTab={onNavigateTab}
        />
      )}

      {/* VIEW: COMPLAINTS & SUPPORT DESK */}
      {view === "complaints" && (
        <AdminComplaints
          complaints={complaints}
          onReplyComplaint={onReplyComplaint}
          onAddComplaint={onAddComplaint}
          onUpdateComplaintStatus={onUpdateComplaintStatus}
          onNavigateTab={onNavigateTab}
          orders={orders}
        />
      )}
    </div>
  );
};

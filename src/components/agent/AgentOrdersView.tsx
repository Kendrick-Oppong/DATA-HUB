import React, { useState, useMemo } from "react";
import {
  Clock,
  Search,
  SlidersHorizontal,
  Receipt,
  TrendingUp,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  RotateCcw,
  MessageCircle,
  ExternalLink,
  Phone,
  Copy,
  Check,
  Flag,
  ArrowRight,
  Download,
  Plus,
  Eye,
  Filter,
  Sparkles,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { Order, AgentStoreConfig, TelecomNetwork } from "../../types";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../ui/card";
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
import { ScrollArea } from "../ui/scroll-area";
import { PaginationHelper } from "../customer/views/PaginationHelper";
import { SignalRail } from "../common/SignalRail";

const NETWORK_ACCENT: Record<TelecomNetwork, { solid: string; short: string }> =
  {
    MTN: { solid: "bg-amber-400", short: "MTN" },
    Telecel: { solid: "bg-red-600", short: "TGL" },
    AirtelTigo: { solid: "bg-blue-600", short: "ATG" },
  };

export interface UnifiedAgentOrder extends Order {
  source: "storefront" | "direct";
  wholesaleCost: number;
  commission: number;
}

interface AgentOrdersViewProps {
  orders: Order[];
  storeConfig: AgentStoreConfig;
  onUpdateOrders?: (orders: Order[]) => void;
  onNavigateTab?: (tab: string) => void;
}

// Date formatter for table (YYYY-MM-DD HH:mm)
function formatOrderDate(dateStr: string): string {
  if (!dateStr) return "—";
  try {
    const trimmed = dateStr.trim();
    // Try native date parse (handles ISO strings and local formats)
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
    // Direct slice fallback for strings already starting with YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}/.test(trimmed)) {
      return trimmed.replace("T", " ").slice(0, 16);
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

export const AgentOrdersView: React.FC<AgentOrdersViewProps> = ({
  orders,
  storeConfig,
  onUpdateOrders,
  onNavigateTab,
}) => {
  const ORDERS_PER_PAGE = 8;

  // Normalization: merge storefront orders and direct agent sales into a unified shape
  const unifiedOrders: UnifiedAgentOrder[] = useMemo(() => {
    return orders.map((o) => {
      const isStorefront =
        o.agentMargin !== undefined ||
        o.customerName !== "Self / Direct" ||
        (o.paymentMethod !== "wallet" && !!o.agentMargin);

      // Estimate wholesale cost from amount minus margin (or default 85% of retail)
      const commission = o.agentMargin ?? 0;
      const wholesaleCost = Math.max(0, o.amount - commission);

      return {
        ...o,
        source: isStorefront ? "storefront" : "direct",
        wholesaleCost,
        commission,
      };
    });
  }, [orders]);

  // Filters and search states
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [networkFilter, setNetworkFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Modal and Action states
  const [selectedOrder, setSelectedOrder] = useState<UnifiedAgentOrder | null>(
    null,
  );
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);
  const [reportingBeneficiary, setReportingBeneficiary] = useState(false);
  const [reportedBeneficiary, setReportedBeneficiary] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Derived counts for metric tiles and filter chips
  const totalCount = unifiedOrders.length;
  const storefrontCount = unifiedOrders.filter(
    (o) => o.source === "storefront",
  ).length;
  const directCount = unifiedOrders.filter((o) => o.source === "direct").length;

  const deliveredCount = unifiedOrders.filter(
    (o) => o.status === "delivered",
  ).length;
  const processingCount = unifiedOrders.filter(
    (o) => o.status === "processing" || o.status === "pending_payment",
  ).length;
  const failedCount = unifiedOrders.filter((o) => o.status === "failed").length;
  const refundedCount = unifiedOrders.filter(
    (o) => o.status === "refunded",
  ).length;
  const needsAttentionCount = failedCount + refundedCount;

  // Delivered revenue & earned commissions
  const deliveredRevenue = unifiedOrders
    .filter((o) => o.status === "delivered")
    .reduce((sum, o) => sum + o.amount, 0);

  const earnedCommission = unifiedOrders
    .filter((o) => o.status === "delivered")
    .reduce((sum, o) => sum + o.commission, 0);

  // Filter application
  const filteredOrders = useMemo(() => {
    return unifiedOrders.filter((o) => {
      // Source filter
      if (sourceFilter === "storefront" && o.source !== "storefront")
        return false;
      if (sourceFilter === "direct" && o.source !== "direct") return false;

      // Status filter
      if (statusFilter === "delivered" && o.status !== "delivered")
        return false;
      if (
        statusFilter === "processing" &&
        o.status !== "processing" &&
        o.status !== "pending_payment"
      )
        return false;
      if (statusFilter === "failed" && o.status !== "failed") return false;
      if (statusFilter === "refunded" && o.status !== "refunded") return false;
      if (
        statusFilter === "issues" &&
        o.status !== "failed" &&
        o.status !== "refunded"
      )
        return false;

      // Network filter
      if (networkFilter !== "all" && o.network !== networkFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesRef = o.reference.toLowerCase().includes(query);
        const matchesPhone = o.recipientPhone.includes(query);
        const matchesCustomer = o.customerName.toLowerCase().includes(query);
        const matchesProduct = o.productName.toLowerCase().includes(query);
        const matchesNetwork = o.network.toLowerCase().includes(query);
        return (
          matchesRef ||
          matchesPhone ||
          matchesCustomer ||
          matchesProduct ||
          matchesNetwork
        );
      }

      return true;
    });
  }, [unifiedOrders, sourceFilter, statusFilter, networkFilter, searchQuery]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredOrders.length / ORDERS_PER_PAGE) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * ORDERS_PER_PAGE;
    return filteredOrders.slice(start, start + ORDERS_PER_PAGE);
  }, [filteredOrders, currentPage]);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    sourceFilter !== "all" ||
    statusFilter !== "all" ||
    networkFilter !== "all";

  const handleResetFilters = () => {
    setSearchQuery("");
    setSourceFilter("all");
    setStatusFilter("all");
    setNetworkFilter("all");
    setCurrentPage(1);
  };

  // Order actions: Re-push order
  const handleRepushOrder = (orderId: string) => {
    if (!onUpdateOrders) return;
    const updated = orders.map((o) => {
      if (o.id === orderId) {
        return {
          ...o,
          status: "processing" as const,
          deliveryTimeline: [
            ...(o.deliveryTimeline || []),
            {
              step: "Order Re-dispatched",
              timestamp: new Date().toLocaleTimeString("en-GB"),
              status: "completed" as const,
              note: "Re-pushed to core telecom gateway by agent",
            },
          ],
        };
      }
      return o;
    });
    onUpdateOrders(updated);
    setActionNotice("Order re-queued for telecom dispatch.");
    setTimeout(() => {
      // Simulate automatic success delivery after 2 seconds
      const delivered = updated.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: "delivered" as const,
              deliveryTimeline: [
                ...(o.deliveryTimeline || []),
                {
                  step: "Delivered to Beneficiary",
                  timestamp: new Date().toLocaleTimeString("en-GB"),
                  status: "completed" as const,
                  note: "Telecom confirmation acknowledged",
                },
              ],
            }
          : o,
      );
      onUpdateOrders(delivered);
      setActionNotice("Order successfully delivered to customer!");
      setTimeout(() => setActionNotice(null), 3000);
    }, 2000);
  };

  // Order actions: Refund customer
  const handleRefundOrder = (orderId: string) => {
    if (!onUpdateOrders) return;
    const updated = orders.map((o) => {
      if (o.id === orderId) {
        return {
          ...o,
          status: "refunded" as const,
          agentMargin: 0,
          deliveryTimeline: [
            ...(o.deliveryTimeline || []),
            {
              step: "Order Refunded",
              timestamp: new Date().toLocaleTimeString("en-GB"),
              status: "completed" as const,
              note: "Funds reversed to customer MoMo account",
            },
          ],
        };
      }
      return o;
    });
    onUpdateOrders(updated);
    setActionNotice("Order marked as refunded. Margin reversed.");
    setTimeout(() => setActionNotice(null), 3500);
  };

  // Order actions: Force deliver
  const handleForceDeliver = (orderId: string) => {
    if (!onUpdateOrders) return;
    const updated = orders.map((o) => {
      if (o.id === orderId) {
        return {
          ...o,
          status: "delivered" as const,
          deliveryTimeline: [
            ...(o.deliveryTimeline || []),
            {
              step: "Force Delivered by Merchant",
              timestamp: new Date().toLocaleTimeString("en-GB"),
              status: "completed" as const,
              note: "Carrier delivery confirmed manually",
            },
          ],
        };
      }
      return o;
    });
    onUpdateOrders(updated);
    setActionNotice("Order marked as delivered successfully.");
    setTimeout(() => setActionNotice(null), 3500);
  };

  // Order actions: Report Beneficiary Problem (flagging number to Admin upstream)
  const handleReportBeneficiary = () => {
    if (!selectedOrder) return;
    setReportingBeneficiary(true);
    setTimeout(() => {
      setReportingBeneficiary(false);
      setReportedBeneficiary(true);
      setActionNotice(
        `Recipient ${selectedOrder.recipientPhone} forwarded to SDH Admin for MTN beneficiary list addition.`,
      );
      setTimeout(() => setActionNotice(null), 4000);
    }, 1000);
  };

  // WhatsApp Message Customer
  const handleWhatsAppCustomer = (order: UnifiedAgentOrder) => {
    const cleanPhone = order.recipientPhone
      .replace(/\D/g, "")
      .replace(/^0/, "");
    const message = encodeURIComponent(
      `Hello ${order.customerName}, this is regarding your ${order.network} ${order.productName} order (${order.reference}) from ${storeConfig.storeName}. Status: ${order.status.toUpperCase()}.`,
    );
    window.open(`https://wa.me/233${cleanPhone}?text=${message}`, "_blank");
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
      "Source",
      "Paid",
      "Cost",
      "Commission",
      "Status",
    ];
    const rows = filteredOrders.map((o) => [
      o.reference,
      o.date,
      `"${o.customerName}"`,
      o.recipientPhone,
      o.network,
      `"${o.productName}"`,
      o.source,
      o.amount.toFixed(2),
      o.wholesaleCost.toFixed(2),
      o.commission.toFixed(2),
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
      `sdh_agent_orders_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in-50">
      {/* 1. TOP HEADER (exact structure of Wallet & Financial Ledger) */}
      <div className="flex flex-col items-start justify-between gap-4 border-b border-border pb-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-foreground">
            <Clock className="size-6 text-primary" />
            <span>Orders & Sales Ledger</span>
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Real-time unified audit log of customer storefront purchases, direct
            dispatches, and fulfillment.
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

      {/* Action Notification Banner */}
      {actionNotice && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in-50">
          <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* 2. STATS CARDS (normal static cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Tile 1: All Orders */}
        <div className="p-4 rounded-2xl bg-card border border-border text-left shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2">
            <Receipt className="w-5 h-5" />
          </div>
          <div className="text-xl font-black tabular-nums text-foreground">
            {totalCount}
          </div>
          <div className="font-bold text-xs text-foreground">All Orders</div>
          <div className="text-[10px] text-muted-foreground">
            Storefront & direct sales
          </div>
        </div>

        {/* Tile 2: Revenue Delivered */}
        <div className="p-4 rounded-2xl bg-card border border-border text-left shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="text-xl font-black tabular-nums text-foreground">
            GH₵ {deliveredRevenue.toFixed(2)}
          </div>
          <div className="font-bold text-xs text-foreground">
            Delivered Revenue
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
            {deliveredCount} fulfilled
          </div>
        </div>

        {/* Tile 3: Commission Earned */}
        <div className="p-4 rounded-2xl bg-card border border-border text-left shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2">
            <DollarSign className="w-5 h-5" />
          </div>
          <div className="text-xl font-black tabular-nums text-emerald-600 dark:text-emerald-400">
            +GH₵ {earnedCommission.toFixed(2)}
          </div>
          <div className="font-bold text-xs text-foreground">
            Commission Earned
          </div>
          <div className="text-[10px] text-muted-foreground">
            Instant wallet credits
          </div>
        </div>

        {/* Tile 4: Needs Attention */}
        <div className="p-4 rounded-2xl bg-card border border-border text-left shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center mb-2">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="text-xl font-black tabular-nums text-foreground">
            {needsAttentionCount}
          </div>
          <div className="font-bold text-xs text-foreground">
            Needs Attention
          </div>
          <div className="text-[10px] text-destructive font-medium">
            {needsAttentionCount > 0
              ? `${needsAttentionCount} failed or refunded`
              : "All orders healthy"}
          </div>
        </div>
      </div>

      {/* 3. MASTER ORDERS TABLE CARD (exact structure of CustomerWalletView) */}
      <Card className="border-border shadow-xs">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base font-extrabold text-foreground">
                All Orders & Audit Ledger
              </CardTitle>
              <CardDescription className="mt-1 text-xs">
                Comprehensive log of customer storefront purchases and direct
                agent dispatches.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        {/* Search + Filters (styled exactly like CustomerWalletView) */}
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
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
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
                {/* Source Filter */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="filter-source"
                    className="text-[10px] font-semibold text-muted-foreground"
                  >
                    Order source
                  </Label>
                  <Select
                    value={sourceFilter}
                    onValueChange={(val) => {
                      if (val) {
                        setSourceFilter(val);
                        setCurrentPage(1);
                      }
                    }}
                  >
                    <SelectTrigger
                      id="filter-source"
                      className="h-9 w-full text-xs"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        All sources ({totalCount})
                      </SelectItem>
                      <SelectItem value="storefront">
                        Storefront ({storefrontCount})
                      </SelectItem>
                      <SelectItem value="direct">
                        Direct sales ({directCount})
                      </SelectItem>
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
                    value={statusFilter}
                    onValueChange={(val) => {
                      if (val) {
                        setStatusFilter(val);
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
                      <SelectItem value="delivered">
                        Delivered ({deliveredCount})
                      </SelectItem>
                      <SelectItem value="processing">
                        Pending / In Progress ({processingCount})
                      </SelectItem>
                      <SelectItem value="failed">
                        Failed / Issues ({failedCount})
                      </SelectItem>
                      <SelectItem value="refunded">
                        Refunded ({refundedCount})
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Network Filter */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="filter-network"
                    className="text-[10px] font-semibold text-muted-foreground"
                  >
                    Telecom carrier
                  </Label>
                  <Select
                    value={networkFilter}
                    onValueChange={(val) => {
                      if (val) {
                        setNetworkFilter(val);
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
              </div>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Order & Package
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Customer
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Source
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-right">
                  Paid
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-right">
                  Commission
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-center">
                  Status
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  When
                </TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-48 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-10 h-10 rounded-2xl bg-muted/60 flex items-center justify-center">
                        <Receipt className="size-5 text-muted-foreground" />
                      </div>
                      <p className="text-xs font-bold text-foreground">
                        No matching orders found
                      </p>
                      <p className="text-[11px] text-muted-foreground max-w-xs">
                        {hasActiveFilters
                          ? "Try modifying your search or clearing active filters to see more results."
                          : "Orders placed by your customers or initiated via direct sale will appear here."}
                      </p>
                      {hasActiveFilters && (
                        <Button
                          variant="link"
                          size="sm"
                          onClick={handleResetFilters}
                          className="text-xs font-bold text-primary cursor-pointer"
                        >
                          Clear all filters
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedOrders.map((order) => {
                  const isDelivered = order.status === "delivered";
                  const isFailed = order.status === "failed";
                  const isRefunded = order.status === "refunded";
                  const isPending =
                    order.status === "processing" ||
                    order.status === "pending_payment";

                  return (
                    <TableRow
                      key={order.id}
                      onClick={() => {
                        setSelectedOrder(order);
                        setReportedBeneficiary(false);
                      }}
                      className="hover:bg-muted/40 cursor-pointer transition-colors"
                    >
                      {/* Order & Package */}
                      <TableCell className="text-xs">
                        <div className="flex items-center gap-2.5">
                          {/* Carrier Badge */}
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0 ${
                              order.network === "MTN"
                                ? "bg-amber-400 text-amber-950"
                                : order.network === "Telecel"
                                  ? "bg-red-600 text-white"
                                  : "bg-blue-600 text-white"
                            }`}
                          >
                            {order.network}
                          </span>
                          <div className="min-w-0">
                            <div className="font-bold text-foreground truncate max-w-[180px] sm:max-w-xs">
                              {order.productName}
                            </div>
                            <div className=" text-[10px] text-muted-foreground">
                              {order.reference}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Customer */}
                      <TableCell className="text-xs">
                        <div className="font-semibold text-foreground">
                          {order.customerName || "Customer"}
                        </div>
                        <div className=" text-[11px] text-muted-foreground">
                          {order.recipientPhone}
                        </div>
                      </TableCell>

                      {/* Source */}
                      <TableCell>
                        {order.source === "storefront" ? (
                          <Badge
                            variant="secondary"
                            className="text-[10px] font-semibold bg-primary/10 text-primary border-primary/20"
                          >
                            Storefront
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-[10px] font-semibold text-muted-foreground border-border"
                          >
                            Direct sale
                          </Badge>
                        )}
                      </TableCell>

                      {/* Paid */}
                      <TableCell className="text-right text-xs font-bold tabular-nums text-foreground">
                        GH₵ {order.amount.toFixed(2)}
                      </TableCell>

                      {/* Commission */}
                      <TableCell className="text-right text-xs font-black tabular-nums">
                        {order.commission > 0 && !isRefunded ? (
                          <span className="text-emerald-600 dark:text-emerald-400">
                            +GH₵ {order.commission.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground font-normal">
                            —
                          </span>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell className="text-center">
                        {isDelivered && (
                          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold inline-flex items-center gap-1">
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            <span>Delivered</span>
                          </Badge>
                        )}
                        {isPending && (
                          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-[10px] font-bold inline-flex items-center gap-1">
                            <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
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
                      </TableCell>

                      {/* When */}
                      <TableCell className="text-xs text-foreground whitespace-nowrap ">
                        {formatOrderDate(order.date)}
                      </TableCell>

                      {/* Action */}
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrder(order);
                            setReportedBeneficiary(false);
                          }}
                        >
                          <ChevronRight className="size-4" />
                          <span className="sr-only">View Details</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
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

      {/* 4. ORDER DETAIL DIALOG (modeled after standard app modals: WithdrawModal, ReferralModal, ReceiptModal) */}
      <Dialog
        open={!!selectedOrder}
        onOpenChange={(open) => !open && setSelectedOrder(null)}
      >
        <DialogContent className="flex h-[90vh] max-h-[90vh] sm:max-w-lg flex-col gap-0 overflow-hidden rounded-3xl border border-border bg-card p-0 shadow-2xl">
          {selectedOrder && (
            <>
              {/* Header */}
              <DialogHeader className="relative shrink-0 overflow-hidden border-b border-border bg-gradient-to-br from-primary/10 via-card to-amber-500/10 p-5 sm:p-6 pr-10 sm:pr-12">
                <div className="absolute -right-12 -top-12 size-32 rounded-full bg-primary/5" />
                <div className="absolute -bottom-16 left-1/3 size-40 rounded-full bg-amber-500/5" />

                <div className="relative flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex size-11 shrink-0 items-center justify-center rounded-2xl font-black text-xs shadow-sm ${
                        selectedOrder.network === "MTN"
                          ? "bg-amber-400 text-amber-950"
                          : selectedOrder.network === "Telecel"
                            ? "bg-red-600 text-white"
                            : "bg-blue-600 text-white"
                      }`}
                    >
                      {selectedOrder.network.slice(0, 3).toUpperCase()}
                    </span>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <DialogTitle className="text-left text-base font-extrabold tracking-tight truncate">
                          {selectedOrder.productName}
                        </DialogTitle>

                        <Badge
                          variant="secondary"
                          className={
                            selectedOrder.status === "delivered"
                              ? "border-emerald-500/30 bg-emerald-500/15 px-2 py-0 text-[10px] font-bold text-emerald-700 dark:text-emerald-400"
                              : selectedOrder.status === "failed"
                                ? "border-red-500/30 bg-red-500/15 px-2 py-0 text-[10px] font-bold text-red-700 dark:text-red-400"
                                : selectedOrder.status === "refunded"
                                  ? "bg-muted px-2 py-0 text-[10px] font-semibold text-muted-foreground"
                                  : "border-amber-500/30 bg-amber-500/15 px-2 py-0 text-[10px] font-bold text-amber-700 dark:text-amber-400"
                          }
                        >
                          {selectedOrder.status.toUpperCase()}
                        </Badge>
                      </div>

                      <DialogDescription className="mt-0.5 text-left text-xs">
                        Ref:{" "}
                        <span className=" font-bold text-foreground">
                          {selectedOrder.reference}
                        </span>{" "}
                        · {selectedOrder.network}{" "}
                        {selectedOrder.serviceType.toUpperCase()}
                      </DialogDescription>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              {/* Scrollable Modal Body */}
              <ScrollArea className="min-h-0 flex-1 overflow-hidden">
                <div className="p-5 sm:p-6 space-y-5">
                  {/* Status Banner */}
                  {selectedOrder.status === "delivered" ? (
                    <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3.5">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="size-4" />
                      </div>
                      <div className="min-w-0 text-xs">
                        <div className="font-bold text-foreground">
                          Delivered Successfully
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          Package dispatched and credited to beneficiary SIM{" "}
                          {selectedOrder.recipientPhone}.
                        </div>
                      </div>
                    </div>
                  ) : selectedOrder.status === "failed" ? (
                    <div className="flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-3.5">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-600 dark:text-red-400">
                        <XCircle className="size-4" />
                      </div>
                      <div className="min-w-0 text-xs">
                        <div className="font-bold text-foreground">
                          Delivery Encountered An Issue
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          Upstream telecom rejected or timed out. You can
                          re-push or issue a customer refund below.
                        </div>
                      </div>
                    </div>
                  ) : selectedOrder.status === "refunded" ? (
                    <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted/30 p-3.5">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                        <RotateCcw className="size-4" />
                      </div>
                      <div className="min-w-0 text-xs">
                        <div className="font-bold text-foreground">
                          Payment Refunded
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          The transaction was reversed and customer payment
                          refunded.
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* Order Delivery Timeline */}
                  <div className="space-y-4">
                    {/* Progress Bar */}
                    {(() => {
                      const timeline = selectedOrder.deliveryTimeline || [];
                      const completedCount = timeline.filter(
                        (s) => s.status === "completed",
                      ).length;
                      const progress = Math.round(
                        (completedCount / timeline.length) * 100,
                      );
                      return (
                        <div>
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
                      );
                    })()}

                    {/* Routing Path */}
                    <div className="rounded-xl border border-border bg-muted/20 p-3">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mb-2.5">
                        Delivery route
                      </p>
                      {(() => {
                        const a =
                          NETWORK_ACCENT[
                            selectedOrder.network as TelecomNetwork
                          ] ?? NETWORK_ACCENT.MTN;
                        const timeline = selectedOrder.deliveryTimeline || [];
                        const completedCount = timeline.filter(
                          (s) => s.status === "completed",
                        ).length;
                        const progress = Math.round(
                          (completedCount / timeline.length) * 100,
                        );
                        return (
                          <div className="flex items-center gap-1.5">
                            <div
                              className={`flex size-7 shrink-0 items-center justify-center rounded-lg text-[9px] font-black text-white ${a.solid}`}
                            >
                              {a.short}
                            </div>
                            <div className="relative flex-1 h-px bg-primary/25">
                              <div
                                className="absolute inset-y-0 left-0 bg-primary transition-all duration-700 rounded-full"
                                style={{ width: `${progress}%` }}
                              />
                              {selectedOrder.status === "processing" && (
                                <span
                                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex size-2 rounded-full bg-primary"
                                  style={{ left: `${progress}%` }}
                                >
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                                </span>
                              )}
                            </div>
                            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-[9px] font-black text-primary-foreground">
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
                              className={`flex size-7 shrink-0 items-center justify-center rounded-lg transition-colors ${
                                selectedOrder.status === "delivered"
                                  ? "bg-emerald-500 text-white"
                                  : "bg-muted border border-border text-muted-foreground"
                              }`}
                            >
                              {selectedOrder.status === "delivered" ? (
                                <Check className="size-3" />
                              ) : (
                                <SignalRail
                                  status="online"
                                  size="xs"
                                  bars={4}
                                />
                              )}
                            </div>
                          </div>
                        );
                      })()}
                      <div className="mt-1.5 flex justify-between text-[9px] text-muted-foreground">
                        <span>{selectedOrder.network} EVD</span>
                        <span>SDH Core</span>
                        <span>Recipient</span>
                      </div>
                    </div>

                    {/* Step Tracker */}
                    <div>
                      <p className="text-[10px]  mb-3 font-bold uppercase text-muted-foreground tracking-wider">
                        Signal dispatch timeline
                      </p>

                      <div className="space-y-0">
                        {(
                          selectedOrder.deliveryTimeline || [
                            {
                              step: "Order Placed",
                              timestamp: formatOrderDate(selectedOrder.date),
                              status: "completed",
                              note:
                                selectedOrder.source === "storefront"
                                  ? "Customer paid online"
                                  : "Agent wallet debit",
                            },
                            {
                              step: "Gateway Dispatch",
                              timestamp: "In progress",
                              status:
                                selectedOrder.status === "delivered"
                                  ? "completed"
                                  : selectedOrder.status === "failed"
                                    ? "failed"
                                    : "current",
                              note: `${selectedOrder.network} Core API Route`,
                            },
                            {
                              step: "Delivered to Beneficiary",
                              timestamp:
                                selectedOrder.status === "delivered"
                                  ? "Confirmed"
                                  : "Pending",
                              status:
                                selectedOrder.status === "delivered"
                                  ? "completed"
                                  : "pending",
                              note: `Sim ${selectedOrder.recipientPhone}`,
                            },
                          ]
                        ).map((item, idx) => {
                          const isCompleted = item.status === "completed";
                          const isCurrent = item.status === "current";
                          const isPending = item.status === "pending";
                          const isFailed = item.status === "failed";
                          const isLast =
                            idx ===
                            (selectedOrder.deliveryTimeline || []).length - 1;
                          return (
                            <div key={idx} className="flex gap-3">
                              {/* Left: connector + dot */}
                              <div className="flex flex-col items-center shrink-0 w-6">
                                <div
                                  className={`relative flex size-6 items-center justify-center rounded-full border-2 shrink-0 transition-all ${
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
                                    <Check className="size-3" />
                                  ) : isCurrent ? (
                                    <span className="size-1.5 rounded-full bg-primary" />
                                  ) : isFailed ? (
                                    <span className="text-[9px] font-black">
                                      ✕
                                    </span>
                                  ) : (
                                    <span className="text-[9px] font-black">
                                      {idx + 1}
                                    </span>
                                  )}
                                </div>
                                {!isLast && (
                                  <div
                                    className={`w-0.5 flex-1 my-1 min-h-[1.25rem] ${
                                      isCompleted ? "bg-primary" : "bg-border"
                                    }`}
                                  />
                                )}
                              </div>
                              {/* Right: content */}
                              <div
                                className={`pb-4 flex-1 ${isLast ? "pb-0" : ""}`}
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <p
                                    className={`text-xs font-bold ${
                                      isCompleted
                                        ? "text-foreground"
                                        : isCurrent
                                          ? "text-primary"
                                          : isFailed
                                            ? "text-red-600"
                                            : "text-muted-foreground"
                                    }`}
                                  >
                                    {item.step}
                                    {isCurrent && (
                                      <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[8px] font-bold uppercase text-amber-600 dark:text-amber-400">
                                        <span className="size-1 rounded-full bg-amber-500 animate-pulse" />
                                        In progress
                                      </span>
                                    )}
                                  </p>
                                  <span
                                    className={`text-[9px] font-semibold text-muted-foreground tabular-nums ${
                                      isPending ? "italic" : ""
                                    }`}
                                  >
                                    {item.timestamp}
                                  </span>
                                </div>
                                {item.note && (
                                  <p className="mt-0.5 text-[11px] text-muted-foreground leading-relaxed">
                                    {item.note}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Order Details Ledger Rows */}
                  <div className="space-y-2.5 rounded-2xl bg-muted/30 border border-border p-4 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground font-semibold">
                        Recipient Phone:
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className=" font-bold text-foreground">
                          {selectedOrder.recipientPhone}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              selectedOrder.recipientPhone,
                            );
                            setCopiedPhone(true);
                            setTimeout(() => setCopiedPhone(false), 2000);
                          }}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          {copiedPhone ? (
                            <Check className="size-3 text-emerald-600" />
                          ) : (
                            <Copy className="size-3" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground font-semibold">
                        Order Reference:
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className=" font-bold text-foreground">
                          {selectedOrder.reference}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              selectedOrder.reference,
                            );
                            setCopiedRef(true);
                            setTimeout(() => setCopiedRef(false), 2000);
                          }}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          {copiedRef ? (
                            <Check className="size-3 text-emerald-600" />
                          ) : (
                            <Copy className="size-3" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground font-semibold">
                        Order Source:
                      </span>
                      <span className="font-bold text-foreground">
                        {selectedOrder.source === "storefront"
                          ? `Storefront (${storeConfig.storeName})`
                          : "Direct Sale (Agent Portal)"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground font-semibold">
                        Payment Method:
                      </span>
                      <span className="font-medium text-foreground capitalize">
                        {selectedOrder.paymentMethod.replace(/_/g, " ")}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground font-semibold">
                        Wholesale Cost:
                      </span>
                      <span className="tabular-nums font-bold text-foreground">
                        GH₵ {selectedOrder.wholesaleCost.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground font-semibold">
                        Paid by Customer:
                      </span>
                      <span className="tabular-nums font-black text-foreground">
                        GH₵ {selectedOrder.amount.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-border">
                      <span className="text-muted-foreground font-semibold">
                        Your Commission:
                      </span>
                      <span
                        className={`tabular-nums font-black ${
                          selectedOrder.status === "refunded"
                            ? "text-muted-foreground"
                            : "text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        {selectedOrder.status === "refunded"
                          ? "— (Reversed)"
                          : `+GH₵ ${selectedOrder.commission.toFixed(2)}`}
                      </span>
                    </div>
                  </div>

                  {/* Order Actions (Re-push, Refund, Force Deliver, Verify Payment) */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Resolution Controls
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Re-push order if failed */}
                      {selectedOrder.status === "failed" &&
                        selectedOrder.source === "storefront" && (
                          <Button
                            type="button"
                            onClick={() => handleRepushOrder(selectedOrder.id)}
                            className="flex-1 text-xs font-bold gap-1.5 h-9 bg-primary cursor-pointer shadow-xs"
                          >
                            <RefreshCw className="size-3.5" />
                            <span>Re-push Order</span>
                          </Button>
                        )}

                      {/* Refund customer if failed */}
                      {selectedOrder.status === "failed" &&
                        selectedOrder.source === "storefront" && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleRefundOrder(selectedOrder.id)}
                            className="flex-1 text-xs font-bold gap-1.5 h-9 text-destructive hover:bg-destructive/10 cursor-pointer"
                          >
                            <RotateCcw className="size-3.5" />
                            <span>Refund Customer</span>
                          </Button>
                        )}

                      {/* Force deliver if in-flight/pending */}
                      {(selectedOrder.status === "processing" ||
                        selectedOrder.status === "pending_payment") && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleForceDeliver(selectedOrder.id)}
                          className="flex-1 text-xs font-bold gap-1.5 h-9 text-primary hover:bg-primary/10 cursor-pointer"
                        >
                          <CheckCircle2 className="size-3.5" />
                          <span>Force Deliver</span>
                        </Button>
                      )}

                      {/* Verify Payment */}
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 text-xs font-bold gap-1.5 h-9 text-primary hover:bg-primary/10 cursor-pointer"
                      >
                        <ShieldCheck className="size-3.5" />
                        <span>Verify Payment</span>
                      </Button>
                    </div>
                  </div>

                  {/* Report Beneficiary Problem */}
                  {selectedOrder.network === "MTN" &&
                    (selectedOrder.status === "failed" ||
                      selectedOrder.status === "processing") && (
                      <div className="space-y-2 pt-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Beneficiary Issue
                        </span>
                        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3.5 space-y-2">
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            If MTN refused this order because{" "}
                            {selectedOrder.recipientPhone} isn't on the
                            beneficiary list, send it to us and we'll add it
                            upstream.
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={
                              reportingBeneficiary || reportedBeneficiary
                            }
                            onClick={handleReportBeneficiary}
                            className="w-full text-xs font-bold gap-1.5 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 cursor-pointer h-8"
                          >
                            {reportedBeneficiary ? (
                              <>
                                <Check className="size-3.5 text-amber-700" />
                                <span>Submitted to Admin</span>
                              </>
                            ) : (
                              <>
                                <Flag className="size-3.5" />
                                <span>
                                  {reportingBeneficiary
                                    ? "Submitting..."
                                    : "Report Beneficiary Problem"}
                                </span>
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                </div>
              </ScrollArea>

              {/* Fixed Footer */}
              <DialogFooter className="shrink-0 border-t border-border bg-muted/40 p-0">
                <div className="flex items-center gap-2 px-6 py-4 pb-6 w-full">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleWhatsAppCustomer(selectedOrder)}
                    className="text-xs font-bold gap-1.5 h-9 bg-emerald-600 hover:bg-emerald-700 cursor-pointer shadow-xs w-full"
                  >
                    <MessageCircle className="size-3.5" />
                    <span>WhatsApp Customer</span>
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

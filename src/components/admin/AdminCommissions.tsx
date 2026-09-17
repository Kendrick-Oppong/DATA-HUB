import React, { useState, useMemo, useEffect } from "react";
import {
  Coins,
  TrendingUp,
  Clock,
  ShoppingBag,
  Download,
  Search,
  SlidersHorizontal,
  CheckCircle2,
  AlertCircle,
  Check,
  Copy,
  Receipt,
  Layers,
  Sparkles,
} from "lucide-react";
import { Order, TelecomNetwork } from "../../types";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Card, CardHeader, CardTitle, CardDescription } from "../ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../ui/pagination";

export interface AdminCommissionsProps {
  orders?: Order[];
  onNavigateTab?: (tab: string) => void;
}

const ITEMS_PER_PAGE = 8;

const AGENTS_LIST = [
  {
    name: "Kofi Owusu",
    handle: "kofi-telecom",
    business: "Kofi Telecom Express",
  },
  {
    name: "Kendrick Oppong",
    handle: "oppong_data",
    business: "Oppong Data Hub",
  },
  {
    name: "Kwame Asante",
    handle: "asante_cellular",
    business: "Asante Telecom",
  },
  {
    name: "Abena Mansa",
    handle: "abena_bundles",
    business: "Mansa Digital Hub",
  },
  {
    name: "Emmanuel Darko",
    handle: "darko_connect",
    business: "Darko Connect",
  },
  {
    name: "Gifty Mensah",
    handle: "giftys_store",
    business: "Gifty Telecom",
  },
];

function resolveCommissionAgent(order: Order, index: number) {
  const hash = (order.id || String(index))
    .split("")
    .reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AGENTS_LIST[hash % AGENTS_LIST.length];
}

export const AdminCommissions: React.FC<AdminCommissionsProps> = ({
  orders = [],
  onNavigateTab,
}) => {
  const [filter, setFilter] = useState<string>("all"); // all | delivered | processing | failed
  const [networkFilter, setNetworkFilter] = useState<string>("all");
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCommission, setSelectedCommission] = useState<any | null>(
    null,
  );
  const [copiedRef, setCopiedRef] = useState<string | null>(null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, networkFilter, agentFilter, searchQuery]);

  // Enriched commission records
  const enrichedOrders = useMemo(() => {
    return orders.map((order, idx) => {
      const agent = resolveCommissionAgent(order, idx);
      const commission =
        order.agentMargin ??
        Math.max(1.5, Math.round(order.amount * 0.12 * 10) / 10);
      return {
        ...order,
        agentName: agent.name,
        agentHandle: agent.handle,
        agentBusiness: agent.business,
        commission,
      };
    });
  }, [orders]);

  // Statistics parity with sdh-next
  const earnedOrders = useMemo(
    () =>
      enrichedOrders.filter(
        (o) => o.status === "delivered" || o.status === ("completed" as any),
      ),
    [enrichedOrders],
  );

  const totalEarned = useMemo(
    () => earnedOrders.reduce((sum, o) => sum + o.commission, 0),
    [earnedOrders],
  );

  const thisMonth = useMemo(() => {
    // Current month filter (e.g. 2026-09)
    const currentMonthPrefix = new Date().toISOString().slice(0, 7);
    return earnedOrders
      .filter((o) => (o.date || "").startsWith(currentMonthPrefix))
      .reduce((sum, o) => sum + o.commission, 0);
  }, [earnedOrders]);

  const totalPending = useMemo(
    () =>
      enrichedOrders
        .filter(
          (o) =>
            o.status === "processing" ||
            o.status === "waiting" ||
            o.status === "pending" ||
            o.status === "pending_payment",
        )
        .reduce((sum, o) => sum + o.commission, 0),
    [enrichedOrders],
  );

  // Filtered rows
  const filteredRows = useMemo(() => {
    return enrichedOrders.filter((o) => {
      // Status filter
      if (filter !== "all") {
        if (filter === "delivered") {
          if (o.status !== "delivered" && o.status !== ("completed" as any))
            return false;
        } else if (filter === "processing") {
          if (
            o.status !== "processing" &&
            o.status !== "waiting" &&
            o.status !== "pending" &&
            o.status !== "pending_payment"
          ) {
            return false;
          }
        } else if (filter === "failed") {
          if (o.status !== "failed" && o.status !== "refunded") return false;
        }
      }

      // Network filter
      if (networkFilter !== "all" && o.network !== networkFilter) return false;

      // Agent filter
      if (agentFilter !== "all" && o.agentName !== agentFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchAgent = o.agentName.toLowerCase().includes(q);
        const matchHandle = o.agentHandle.toLowerCase().includes(q);
        const matchCust = (o.customerName || "").toLowerCase().includes(q);
        const matchPhone = (o.recipientPhone || "").toLowerCase().includes(q);
        const matchProd = (o.productName || "").toLowerCase().includes(q);
        const matchRef = (o.reference || "").toLowerCase().includes(q);
        if (
          !matchAgent &&
          !matchHandle &&
          !matchCust &&
          !matchPhone &&
          !matchProd &&
          !matchRef
        ) {
          return false;
        }
      }

      return true;
    });
  }, [enrichedOrders, filter, networkFilter, agentFilter, searchQuery]);

  // Pagination calculation
  const totalPages = Math.max(
    1,
    Math.ceil(filteredRows.length / ITEMS_PER_PAGE),
  );

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRows.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRows, currentPage]);

  const handleCopyReference = (ref: string) => {
    navigator.clipboard.writeText(ref);
    setCopiedRef(ref);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  // CSV Export utility
  const handleExportCsv = () => {
    const head = [
      "Date",
      "Reference",
      "Agent",
      "Store Handle",
      "Customer",
      "Phone",
      "Network",
      "Product",
      "Sale Price (GHS)",
      "Commission (GHS)",
      "Status",
    ];

    const esc = (c: any) =>
      `"${String(c == null ? "" : c).replace(/"/g, '""')}"`;

    const body = filteredRows.map((e) => [
      esc(e.date),
      esc(e.reference),
      esc(e.agentName),
      esc(e.agentHandle),
      esc(e.customerName),
      esc(e.recipientPhone),
      esc(e.network),
      esc(e.productName),
      esc(e.amount.toFixed(2)),
      esc(e.commission.toFixed(2)),
      esc(e.status),
    ]);

    const csv = [head.map(esc).join(","), ...body.map((r) => r.join(","))].join(
      "\r\n",
    );
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `storefront-commissions-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);

    setExportNotice(
      `Exported ${filteredRows.length} commission record${
        filteredRows.length === 1 ? "" : "s"
      } successfully.`,
    );
    setTimeout(() => setExportNotice(null), 3500);
  };

  const isFiltered =
    searchQuery !== "" ||
    filter !== "all" ||
    networkFilter !== "all" ||
    agentFilter !== "all";

  // Helper initials for agent avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      {/* TOP HEADER */}
      <div className="flex flex-col items-start justify-between gap-4 border-b border-border pb-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-foreground">
            <Coins className="size-6 text-primary" />
            <span>Storefront Commissions</span>
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Every storefront sale and the commission the agent earned on it.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {exportNotice && (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg animate-in fade-in duration-200">
              {exportNotice}
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

      {/* 4 STATS CARDS TILES (Parity with sdh-next: Commission earned, This month, Pending, Sales) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Commission Earned */}
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10">
              <Coins className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Commission earned
            </span>
          </div>
          <p className="mt-2 text-xl font-black tabular-nums text-emerald-600 dark:text-emerald-400">
            +GH₵ {totalEarned.toFixed(2)}
          </p>
          <p className="text-[10px] text-muted-foreground font-medium">
            Total agent margin paid out
          </p>
        </div>

        {/* This Month */}
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-blue-500/10">
              <TrendingUp className="size-3.5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              This month
            </span>
          </div>
          <p className="mt-2 text-xl font-black tabular-nums text-foreground">
            +GH₵ {thisMonth.toFixed(2)}
          </p>
          <p className="text-[10px] text-muted-foreground font-medium">
            Earned since 1st of month
          </p>
        </div>

        {/* Pending */}
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10">
              <Clock className="size-3.5 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Pending
            </span>
          </div>
          <p className="mt-2 text-xl font-black tabular-nums text-amber-600 dark:text-amber-400">
            GH₵ {totalPending.toFixed(2)}
          </p>
          <p className="text-[10px] text-muted-foreground font-medium">
            In flight EVD deliveries
          </p>
        </div>

        {/* Sales */}
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-purple-500/10">
              <ShoppingBag className="size-3.5 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Sales
            </span>
          </div>
          <p className="mt-2 text-xl font-black tabular-nums text-foreground">
            {earnedOrders.length}
          </p>
          <p className="text-[10px] text-muted-foreground font-medium">
            Delivered storefront sales
          </p>
        </div>
      </div>

      {/* MASTER COMMISSIONS CARD */}
      <Card className="border-border shadow-xs">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base font-extrabold text-foreground">
                <span>Commissions</span>
              </CardTitle>
              <CardDescription className="mt-1 text-xs">
                Every storefront sale and the commission the agent earned on it.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        {/* Search + Filters Container */}
        <div className="border-b border-border bg-muted/20 p-4 space-y-4">
          {/* Search input */}
          <div className="space-y-1.5">
            <Label
              htmlFor="admin-comm-search"
              className="text-[10px] font-bold uppercase text-muted-foreground"
            >
              Search commission records
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="admin-comm-search"
                type="text"
                placeholder="Search by agent name, handle, customer, phone, bundle, or reference"
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
                  Commission filters
                </span>
              </div>
              {isFiltered && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setFilter("all");
                    setNetworkFilter("all");
                    setAgentFilter("all");
                  }}
                  className="h-6 px-2 text-[10px] font-bold text-primary cursor-pointer bg-transparent hover:!bg-transparent hover:text-primary"
                >
                  Reset filters
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {/* Delivery Status (All | Earned | Pending | Failed) */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="filter-status"
                  className="text-[10px] font-semibold text-muted-foreground"
                >
                  Commission Status
                </Label>
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger
                    id="filter-status"
                    className="h-9 w-full text-xs"
                  >
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="delivered">Earned (Delivered)</SelectItem>
                    <SelectItem value="processing">
                      Pending (In Flight)
                    </SelectItem>
                    <SelectItem value="failed">Failed / Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Telecom Network */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="filter-network"
                  className="text-[10px] font-semibold text-muted-foreground"
                >
                  Telecom Network
                </Label>
                <Select value={networkFilter} onValueChange={setNetworkFilter}>
                  <SelectTrigger
                    id="filter-network"
                    className="h-9 w-full text-xs"
                  >
                    <SelectValue placeholder="All Networks" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Networks</SelectItem>
                    <SelectItem value="MTN">MTN Ghana</SelectItem>
                    <SelectItem value="Telecel">Telecel Ghana</SelectItem>
                    <SelectItem value="AT">AT Ghana</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Agent Filter */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="filter-agent"
                  className="text-[10px] font-semibold text-muted-foreground"
                >
                  Storefront Agent
                </Label>
                <Select value={agentFilter} onValueChange={setAgentFilter}>
                  <SelectTrigger
                    id="filter-agent"
                    className="h-9 w-full text-xs"
                  >
                    <SelectValue placeholder="All Agents" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Agents</SelectItem>
                    {AGENTS_LIST.map((ag) => (
                      <SelectItem key={ag.name} value={ag.name}>
                        {ag.name} (@{ag.handle})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* COMMISSIONS TABLE */}
        <div className="rounded-xl border border-border overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <Table className="w-full text-xs">
              <TableHeader>
                <TableRow className="border-b border-border bg-muted/40 hover:bg-muted/40">
                  <TableHead className="h-12 px-4 text-left font-bold text-muted-foreground uppercase text-[10px]">
                    Agent
                  </TableHead>
                  <TableHead className="h-12 px-4 text-left font-bold text-muted-foreground uppercase text-[10px]">
                    Bundle &amp; Network
                  </TableHead>
                  <TableHead className="h-12 px-4 text-left font-bold text-muted-foreground uppercase text-[10px]">
                    Customer
                  </TableHead>
                  <TableHead className="h-12 px-4 text-right font-bold text-muted-foreground uppercase text-[10px]">
                    Sale
                  </TableHead>
                  <TableHead className="h-12 px-4 text-right font-bold text-muted-foreground uppercase text-[10px]">
                    Commission
                  </TableHead>
                  <TableHead className="h-12 px-4 text-center font-bold text-muted-foreground uppercase text-[10px]">
                    Status
                  </TableHead>
                  <TableHead className="h-12 px-4 text-right font-bold text-muted-foreground uppercase text-[10px]">
                    When
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/60">
                {paginatedRows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-36 text-center text-muted-foreground"
                    >
                      <div className="flex flex-col items-center justify-center py-6">
                        <div className="size-10 rounded-full bg-muted flex items-center justify-center mb-2">
                          <Coins className="size-5 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-semibold">
                          {enrichedOrders.length === 0
                            ? "No storefront sales yet. Commissions appear here as agents make sales."
                            : "No sales match this filter."}
                        </p>
                        {isFiltered && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSearchQuery("");
                              setFilter("all");
                              setNetworkFilter("all");
                              setAgentFilter("all");
                            }}
                            className="mt-2 text-xs text-primary font-bold cursor-pointer"
                          >
                            Clear all filters
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedRows.map((ord) => {
                    const isDelivered =
                      ord.status === "delivered" ||
                      ord.status === ("completed" as any);
                    const isProcessing = ord.status === "processing";
                    const isWaiting = ord.status === "waiting";
                    const isPending =
                      ord.status === "pending" ||
                      ord.status === "pending_payment";
                    const isFailed = ord.status === "failed";
                    const isRefunded = ord.status === "refunded";

                    return (
                      <TableRow
                        key={ord.id}
                        onClick={() => setSelectedCommission(ord)}
                        className="hover:bg-muted/30 transition-colors cursor-pointer"
                      >
                        {/* Agent */}
                        <TableCell className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                              {getInitials(ord.agentName)}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-foreground truncate">
                                {ord.agentName}
                              </div>
                              <div className="text-[11px] text-muted-foreground font-medium truncate">
                                @{ord.agentHandle}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        {/* Bundle & Network */}
                        <TableCell className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`size-6 rounded-md flex items-center justify-center text-[10px] font-black shrink-0 ${
                                ord.network === "MTN"
                                  ? "bg-amber-400 text-black font-extrabold"
                                  : ord.network === "Telecel"
                                    ? "bg-red-600 text-white"
                                    : "bg-blue-600 text-white"
                              }`}
                            >
                              {ord.network.slice(0, 3)}
                            </span>
                            <span className="font-semibold text-foreground text-xs">
                              {ord.productName}
                            </span>
                          </div>
                        </TableCell>

                        {/* Customer */}
                        <TableCell className="py-4 px-4">
                          <div className="font-medium text-foreground text-xs">
                            {ord.customerName}
                          </div>
                          <div className="text-[11px] text-muted-foreground tabular-nums">
                            {ord.recipientPhone}
                          </div>
                        </TableCell>

                        {/* Sale Price */}
                        <TableCell className="py-4 px-4 text-right font-black text-foreground tabular-nums text-xs">
                          GH₵ {ord.amount.toFixed(2)}
                        </TableCell>

                        {/* Commission */}
                        <TableCell className="py-4 px-4 text-right font-black tabular-nums text-xs">
                          <span
                            className={
                              isDelivered
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-muted-foreground"
                            }
                          >
                            {isDelivered ? "+" : ""}GH₵{" "}
                            {ord.commission.toFixed(2)}
                          </span>
                        </TableCell>

                        {/* Status (Exact Admin Orders Badge Styles) */}
                        <TableCell className="py-4 px-4 text-center">
                          {(() => {
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

                        {/* When */}
                        <TableCell className="py-4 px-4 text-right text-xs text-muted-foreground whitespace-nowrap">
                          {ord.date}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* PAGINATION FOOTER */}
          <div className="flex items-center justify-between p-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredRows.length)} of{" "}
              {filteredRows.length} commission sales
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
                            onClick={() => setCurrentPage(p)}
                            isActive={currentPage === p}
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
        </div>
      </Card>

      {/* COMMISSION AUDIT DIALOG */}
      <Dialog
        open={!!selectedCommission}
        onOpenChange={(open) => !open && setSelectedCommission(null)}
      >
        <DialogContent className="flex max-h-[90vh] sm:max-w-md flex-col gap-0 overflow-hidden rounded-3xl border border-border bg-card p-0 shadow-2xl">
          {selectedCommission && (
            <>
              <DialogHeader className="relative shrink-0 overflow-hidden border-b border-border bg-gradient-to-br from-primary/10 via-card to-amber-500/10 p-5 pr-10 sm:pr-12">
                <div className="flex items-center gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl font-black text-xs shadow-sm bg-primary text-primary-foreground">
                    <Coins className="size-5" />
                  </span>

                  <div className="min-w-0">
                    <DialogTitle className="text-base font-extrabold text-foreground truncate">
                      {selectedCommission.reference}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                      Storefront Commission Audit Ledger
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="p-6 space-y-4 text-xs">
                {/* Status Callout */}
                <div
                  className={`p-3 rounded-2xl border flex items-center justify-between ${
                    selectedCommission.status === "delivered" ||
                    selectedCommission.status === "completed"
                      ? "bg-emerald-500/10 border-emerald-500/20"
                      : selectedCommission.status === "processing" ||
                          selectedCommission.status === "waiting" ||
                          selectedCommission.status === "pending"
                        ? "bg-amber-500/10 border-amber-500/20"
                        : "bg-red-500/10 border-red-500/20"
                  }`}
                >
                  <span
                    className={`font-bold flex items-center gap-1.5 ${
                      selectedCommission.status === "delivered" ||
                      selectedCommission.status === "completed"
                        ? "text-emerald-800 dark:text-emerald-300"
                        : selectedCommission.status === "processing" ||
                            selectedCommission.status === "waiting" ||
                            selectedCommission.status === "pending"
                          ? "text-amber-800 dark:text-amber-300"
                          : "text-red-800 dark:text-red-300"
                    }`}
                  >
                    {selectedCommission.status === "delivered" ||
                    selectedCommission.status === "completed" ? (
                      <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                    ) : selectedCommission.status === "processing" ||
                      selectedCommission.status === "waiting" ||
                      selectedCommission.status === "pending" ? (
                      <AlertCircle className="size-4 text-amber-600 dark:text-amber-400 animate-pulse" />
                    ) : (
                      <AlertCircle className="size-4 text-red-600 dark:text-red-400" />
                    )}
                    {selectedCommission.status === "delivered" ||
                    selectedCommission.status === "completed"
                      ? "Delivered & Commission Earned"
                      : selectedCommission.status === "processing" ||
                          selectedCommission.status === "waiting" ||
                          selectedCommission.status === "pending"
                        ? "Delivery Processing (Commission Pending)"
                        : "Order Failed (Commission Not Earned)"}
                  </span>
                  <span
                    className={`font-black text-sm tabular-nums ${
                      selectedCommission.status === "delivered" ||
                      selectedCommission.status === "completed"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-muted-foreground"
                    }`}
                  >
                    +GH₵ {selectedCommission.commission.toFixed(2)}
                  </span>
                </div>

                {/* Details Breakdown */}
                <div className="space-y-2.5 rounded-2xl border border-border bg-muted/20 p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Store Agent</span>
                    <span className="font-bold text-foreground">
                      {selectedCommission.agentName}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Store Handle</span>
                    <span className="font-semibold text-foreground">
                      @{selectedCommission.agentHandle}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Customer</span>
                    <span className="font-bold text-foreground">
                      {selectedCommission.customerName}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">
                      Recipient Phone
                    </span>
                    <span className="font-bold text-foreground tabular-nums">
                      {selectedCommission.recipientPhone}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Product</span>
                    <span className="font-bold text-foreground">
                      {selectedCommission.network} —{" "}
                      {selectedCommission.productName}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">
                      Transaction Date
                    </span>
                    <span className="font-semibold text-foreground">
                      {selectedCommission.date}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-border flex justify-between items-center">
                    <span className="text-muted-foreground">
                      Retail Sale Price
                    </span>
                    <span className="font-semibold tabular-nums text-foreground">
                      GH₵ {selectedCommission.amount.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">
                      Agent Commission Profit
                    </span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                      +GH₵ {selectedCommission.commission.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">
                      Payment Channel
                    </span>
                    <span className="font-semibold text-foreground capitalize">
                      {selectedCommission.paymentMethod.replace("_", " ")}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-border flex flex-col gap-1">
                    <span className="text-muted-foreground">
                      Order Reference
                    </span>
                    <span className="font-medium text-foreground bg-muted p-2 px-3 rounded-lg border border-border">
                      {selectedCommission.reference}
                    </span>
                  </div>
                </div>

                {/* Actions inside modal */}
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1 text-xs font-bold gap-1.5 cursor-pointer h-9"
                    onClick={() => setSelectedCommission(null)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

import React, { useState, useMemo, useEffect } from "react";
import {
  Download,
  Coins,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
  ArrowRight,
  ShieldCheck,
  Check,
  Copy,
  ExternalLink,
  Smartphone,
  Send,
  Ban,
  Calendar,
} from "lucide-react";
import { PayoutRequest, TelecomNetwork } from "../../types";
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
import { INITIAL_PAYOUT_REQUESTS, loadFromStorage, saveToStorage } from "../../mockData";

export interface AdminPayoutsProps {
  onNavigateTab?: (tab: string) => void;
}

const ITEMS_PER_PAGE = 8;

export const AdminPayouts: React.FC<AdminPayoutsProps> = ({ onNavigateTab }) => {
  const [payouts, setPayouts] = useState<PayoutRequest[]>(() =>
    loadFromStorage("admin_payouts_list", INITIAL_PAYOUT_REQUESTS)
  );

  const [statusFilter, setStatusFilter] = useState<string>("requested"); // requested | paid | failed | all
  const [networkFilter, setNetworkFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedPayout, setSelectedPayout] = useState<PayoutRequest | null>(null);
  const [busyActionId, setBusyActionId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "info" | "error";
  } | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [isPayAllOpen, setIsPayAllOpen] = useState(false);

  // Sync to local storage
  const updatePayouts = (newPayouts: PayoutRequest[]) => {
    setPayouts(newPayouts);
    saveToStorage("admin_payouts_list", newPayouts);
  };

  const showToast = (text: string, type: "success" | "info" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, networkFilter, searchQuery, fromDate, toDate]);

  // Statistics calculation
  const requestedList = useMemo(
    () => payouts.filter((w) => w.status === "requested" || w.status === "processing"),
    [payouts]
  );
  const paidList = useMemo(() => payouts.filter((w) => w.status === "paid"), [payouts]);
  const failedOrRejectedList = useMemo(
    () => payouts.filter((w) => w.status === "failed" || w.status === "rejected"),
    [payouts]
  );

  const totalRequested = useMemo(
    () => requestedList.reduce((sum, w) => sum + w.amount, 0),
    [requestedList]
  );
  const totalPaid = useMemo(
    () => paidList.reduce((sum, w) => sum + w.amount, 0),
    [paidList]
  );

  // Date parsing helper
  const fromMs = fromDate ? new Date(`${fromDate}T00:00:00Z`).getTime() : null;
  const toMs = toDate ? new Date(`${toDate}T23:59:59.999Z`).getTime() : null;

  // Filtered rows
  const filteredRows = useMemo(() => {
    return payouts.filter((w) => {
      // Status filter
      if (statusFilter !== "all") {
        if (statusFilter === "requested") {
          if (w.status !== "requested" && w.status !== "processing") return false;
        } else if (statusFilter === "paid") {
          if (w.status !== "paid") return false;
        } else if (statusFilter === "failed") {
          if (w.status !== "failed" && w.status !== "rejected") return false;
        }
      }

      // Network filter
      if (networkFilter !== "all") {
        const net = w.network || w.momoNetwork;
        if (networkFilter === "AirtelTigo" || networkFilter === "AT") {
          if (net !== "AirtelTigo" && (net as any) !== "AT") return false;
        } else if (net !== networkFilter) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchRef = (w.reference || "").toLowerCase().includes(q);
        const matchAgent = (w.agentName || "").toLowerCase().includes(q);
        const matchHandle = (w.agentHandle || "").toLowerCase().includes(q);
        const matchPhone = (w.phoneNumber || w.momoNumber || "").includes(q);
        const matchRecipient = (w.recipientName || w.accountName || "").toLowerCase().includes(q);
        if (!matchRef && !matchAgent && !matchHandle && !matchPhone && !matchRecipient) {
          return false;
        }
      }

      // Date range filter
      if (fromMs != null || toMs != null) {
        const dateStr = w.createdAt || w.requestDate || "";
        const itemDate = dateStr ? new Date(dateStr).getTime() : 0;
        if (fromMs != null && itemDate < fromMs) return false;
        if (toMs != null && itemDate > toMs) return false;
      }

      return true;
    });
  }, [payouts, statusFilter, networkFilter, searchQuery, fromMs, toMs]);

  // Target for "Pay all in view" vs "Pay all pending"
  const rangeActive = Boolean(fromDate || toDate || searchQuery);
  const rowsRequestedInView = useMemo(
    () => filteredRows.filter((w) => w.status === "requested" || w.status === "processing"),
    [filteredRows]
  );
  const payTargets = rangeActive ? rowsRequestedInView : requestedList;

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / ITEMS_PER_PAGE));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRows.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRows, currentPage]);

  // Actions
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handlePaySingle = async (payoutId: string) => {
    setBusyActionId(payoutId);
    try {
      // Simulate gateway call to Paystack/Telco EVD MoMo
      await new Promise((resolve) => setTimeout(resolve, 600));

      const updated = payouts.map((p) => {
        if (p.id === payoutId) {
          return {
            ...p,
            status: "paid" as const,
            paidAt: new Date().toISOString().replace("T", " ").slice(0, 16),
            paystackTransferCode: p.paystackTransferCode || `TRF_${Math.random().toString(36).slice(2, 10)}`,
            momoTransactionId: `MM-${p.network}-${Math.floor(100000000 + Math.random() * 900000000)}`,
          };
        }
        return p;
      });

      updatePayouts(updated);
      if (selectedPayout?.id === payoutId) {
        setSelectedPayout(updated.find((p) => p.id === payoutId) || null);
      }
      showToast("Payout successfully disbursed to mobile money wallet.", "success");
    } finally {
      setBusyActionId(null);
    }
  };

  const handleMarkPaid = (payoutId: string) => {
    const updated = payouts.map((p) => {
      if (p.id === payoutId) {
        return {
          ...p,
          status: "paid" as const,
          paidAt: new Date().toISOString().replace("T", " ").slice(0, 16),
          reason: "Manually marked as paid by administrator",
          momoTransactionId: `MANUAL-${Date.now().toString().slice(-8)}`,
        };
      }
      return p;
    });

    updatePayouts(updated);
    if (selectedPayout?.id === payoutId) {
      setSelectedPayout(updated.find((p) => p.id === payoutId) || null);
    }
    showToast("Payout marked as paid manually.", "info");
  };

  const handleReject = (payoutId: string) => {
    const updated = payouts.map((p) => {
      if (p.id === payoutId) {
        return {
          ...p,
          status: "rejected" as const,
          updatedAt: new Date().toISOString().replace("T", " ").slice(0, 16),
          reason: "Payout rejected by administrator — agent wallet balance refunded",
        };
      }
      return p;
    });

    updatePayouts(updated);
    if (selectedPayout?.id === payoutId) {
      setSelectedPayout(updated.find((p) => p.id === payoutId) || null);
    }
    showToast("Payout rejected. Agent wallet has been refunded.", "info");
  };

  const handlePayAllPending = async () => {
    if (payTargets.length === 0) return;
    setBusyActionId("payAll");
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      const targetIds = new Set(payTargets.map((t) => t.id));
      const updated = payouts.map((p) => {
        if (targetIds.has(p.id)) {
          return {
            ...p,
            status: "paid" as const,
            paidAt: new Date().toISOString().replace("T", " ").slice(0, 16),
            paystackTransferCode: p.paystackTransferCode || `TRF_${Math.random().toString(36).slice(2, 10)}`,
            momoTransactionId: `MM-${p.network}-${Math.floor(100000000 + Math.random() * 900000000)}`,
          };
        }
        return p;
      });

      updatePayouts(updated);
      setIsPayAllOpen(false);
      showToast(
        `Successfully sent ${payTargets.length} mobile money payout${
          payTargets.length === 1 ? "" : "s"
        }.`,
        "success"
      );
    } finally {
      setBusyActionId(null);
    }
  };

  // CSV Export utility
  const handleExportCsv = () => {
    const head = [
      "Reference",
      "Agent",
      "Handle",
      "Network",
      "MoMo Number",
      "Recipient Name",
      "Amount (GHS)",
      "Status",
      "Requested At",
      "Paid At",
      "Reason / Note",
    ];

    const esc = (c: any) => `"${String(c == null ? "" : c).replace(/"/g, '""')}"`;

    const body = filteredRows.map((w) => [
      esc(w.reference),
      esc(w.agentName),
      esc(w.agentHandle),
      esc(w.network),
      esc(w.phoneNumber),
      esc(w.recipientName),
      esc(w.amount.toFixed(2)),
      esc(w.status),
      esc(w.createdAt),
      esc(w.paidAt || ""),
      esc(w.reason || ""),
    ]);

    const csv = [head.map(esc).join(","), ...body.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `payouts-${statusFilter}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);

    showToast(`Exported ${filteredRows.length} payout records to CSV.`, "success");
  };

  const isFiltered =
    searchQuery !== "" ||
    statusFilter !== "requested" ||
    networkFilter !== "all" ||
    fromDate !== "" ||
    toDate !== "";

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
            <Download className="size-6 text-primary" />
            <span>Agent Payouts</span>
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Agents request payouts; the amount is held from their wallet. Send them manually or via Mobile Money.
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

          {payTargets.length > 0 && (
            <Button
              size="sm"
              onClick={() => setIsPayAllOpen(true)}
              className="text-xs font-bold shadow-xs cursor-pointer gap-1.5 h-9 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Coins className="size-4" />
              <span>
                {rangeActive ? `Pay ${payTargets.length} in View` : `Pay All Pending (${payTargets.length})`}
              </span>
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={handleExportCsv}
            disabled={filteredRows.length === 0}
            className="text-xs font-bold shadow-xs cursor-pointer gap-1.5 h-9"
          >
            <Download className="size-4" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* 4 STATS CARDS TILES (Parity with sdh-next: Pending requests, Paid out, Payouts, Failed/rejected) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Pending Requests */}
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10">
              <Clock className="size-3.5 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Pending requests
            </span>
          </div>
          <p className="mt-2 text-xl font-black tabular-nums text-amber-600 dark:text-amber-400">
            GH₵ {totalRequested.toFixed(2)}
          </p>
          <p className="text-[10px] text-muted-foreground font-medium">
            {requestedList.length} request{requestedList.length === 1 ? "" : "s"} awaiting dispatch
          </p>
        </div>

        {/* Paid Out */}
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10">
              <Coins className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Paid out
            </span>
          </div>
          <p className="mt-2 text-xl font-black tabular-nums text-emerald-600 dark:text-emerald-400">
            GH₵ {totalPaid.toFixed(2)}
          </p>
          <p className="text-[10px] text-muted-foreground font-medium">
            Disbursed to agent wallets
          </p>
        </div>

        {/* Total Payouts Count */}
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-blue-500/10">
              <Download className="size-3.5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Payouts
            </span>
          </div>
          <p className="mt-2 text-xl font-black tabular-nums text-foreground">
            {payouts.length}
          </p>
          <p className="text-[10px] text-muted-foreground font-medium">
            Total lifetime requests
          </p>
        </div>

        {/* Failed / Rejected */}
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-red-500/10">
              <RefreshCw className="size-3.5 text-red-600 dark:text-red-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Failed / rejected
            </span>
          </div>
          <p className="mt-2 text-xl font-black tabular-nums text-red-600 dark:text-red-400">
            {failedOrRejectedList.length}
          </p>
          <p className="text-[10px] text-muted-foreground font-medium">
            Refunded to agent wallet
          </p>
        </div>
      </div>

      {/* MASTER PAYOUTS CARD */}
      <Card className="border-border shadow-xs">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base font-extrabold text-foreground">
                <span>Payout Requests</span>
                {requestedList.length > 0 && (
                  <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                    {requestedList.length} pending
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="mt-1 text-xs">
                Agents request payouts; the amount is held from their wallet. Send them manually and mark paid, or pay via Paystack.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        {/* Search + Filters Container */}
        <div className="border-b border-border bg-muted/20 p-4 space-y-4">
          {/* Search input */}
          <div className="space-y-1.5">
            <Label
              htmlFor="admin-payout-search"
              className="text-[10px] font-bold uppercase text-muted-foreground"
            >
              Search payout records
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="admin-payout-search"
                type="text"
                placeholder="Search agent, MoMo number, recipient name, or reference"
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
                  Payout filters &amp; date range
                </span>
              </div>
              {isFiltered && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("requested");
                    setNetworkFilter("all");
                    setFromDate("");
                    setToDate("");
                  }}
                  className="h-6 px-2 text-[10px] font-bold text-primary cursor-pointer bg-transparent hover:!bg-transparent hover:text-primary"
                >
                  Reset filters
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              {/* Status Tabs / Select */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="filter-status"
                  className="text-[10px] font-semibold text-muted-foreground"
                >
                  Status
                </Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="filter-status" className="h-9 w-full text-xs">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="requested">
                      Pending ({requestedList.length})
                    </SelectItem>
                    <SelectItem value="paid">
                      Paid ({paidList.length})
                    </SelectItem>
                    <SelectItem value="failed">
                      Failed / Rejected ({failedOrRejectedList.length})
                    </SelectItem>
                    <SelectItem value="all">
                      All ({payouts.length})
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Telecom Network */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="filter-network"
                  className="text-[10px] font-semibold text-muted-foreground"
                >
                  Payout Network
                </Label>
                <Select value={networkFilter} onValueChange={setNetworkFilter}>
                  <SelectTrigger id="filter-network" className="h-9 w-full text-xs">
                    <SelectValue placeholder="All Networks" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Networks</SelectItem>
                    <SelectItem value="MTN">MTN Mobile Money</SelectItem>
                    <SelectItem value="Telecel">Telecel Cash</SelectItem>
                    <SelectItem value="AT">AT Money</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date From */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="filter-from-date"
                  className="text-[10px] font-semibold text-muted-foreground"
                >
                  From Date
                </Label>
                <Input
                  id="filter-from-date"
                  type="date"
                  value={fromDate}
                  max={toDate || undefined}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              {/* Date To */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="filter-to-date"
                  className="text-[10px] font-semibold text-muted-foreground"
                >
                  To Date
                </Label>
                <div className="flex items-center gap-1.5">
                  <Input
                    id="filter-to-date"
                    type="date"
                    value={toDate}
                    min={fromDate || undefined}
                    onChange={(e) => setToDate(e.target.value)}
                    className="h-9 text-xs"
                  />
                  {(fromDate || toDate) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setFromDate("");
                        setToDate("");
                      }}
                      className="size-9 shrink-0 text-muted-foreground hover:text-foreground"
                      title="Clear date range"
                    >
                      <X className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PAYOUTS TABLE */}
        <div className="rounded-xl border border-border overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <Table className="w-full text-xs">
              <TableHeader>
                <TableRow className="border-b border-border bg-muted/40 hover:bg-muted/40">
                  <TableHead className="h-12 px-4 text-left font-bold text-muted-foreground uppercase text-[10px]">
                    Reference
                  </TableHead>
                  <TableHead className="h-12 px-4 text-left font-bold text-muted-foreground uppercase text-[10px]">
                    Agent
                  </TableHead>
                  <TableHead className="h-12 px-4 text-right font-bold text-muted-foreground uppercase text-[10px]">
                    Amount
                  </TableHead>
                  <TableHead className="h-12 px-4 text-left font-bold text-muted-foreground uppercase text-[10px]">
                    Payout to
                  </TableHead>
                  <TableHead className="h-12 px-4 text-center font-bold text-muted-foreground uppercase text-[10px]">
                    Status
                  </TableHead>
                  <TableHead className="h-12 px-4 text-right font-bold text-muted-foreground uppercase text-[10px]">
                    When
                  </TableHead>
                  <TableHead className="h-12 px-4 text-right font-bold text-muted-foreground uppercase text-[10px]">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/60">
                {paginatedRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-36 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center py-6">
                        <div className="size-10 rounded-full bg-muted flex items-center justify-center mb-2">
                          <Download className="size-5 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-semibold">
                          {payouts.length === 0
                            ? "No payout requests yet. Agent withdrawal requests appear here for you to process."
                            : "No payouts match this view."}
                        </p>
                        {isFiltered && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSearchQuery("");
                              setStatusFilter("all");
                              setNetworkFilter("all");
                              setFromDate("");
                              setToDate("");
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
                  paginatedRows.map((w) => {
                    const isRequested = w.status === "requested" || w.status === "pending";
                    const isProcessing = w.status === "processing";
                    const isPaid = w.status === "paid" || w.status === "processed" || w.status === "approved";
                    const isFailed = w.status === "failed";
                    const isRejected = w.status === "rejected";
                    const isBusy = busyActionId === w.id;

                    const itemNetwork = w.network || w.momoNetwork || "MTN";
                    const isMtn = itemNetwork === "MTN";
                    const isTelecel = itemNetwork === "Telecel";
                    const itemPhone = w.phoneNumber || w.momoNumber || "—";
                    const itemRecipient = w.recipientName || w.accountName || "Agent";
                    const itemWhen = w.createdAt || w.requestDate || "—";

                    return (
                      <TableRow
                        key={w.id}
                        onClick={() => setSelectedPayout(w)}
                        className="hover:bg-muted/30 transition-colors cursor-pointer"
                      >
                        {/* Reference */}
                        <TableCell className="py-4 px-4 font-mono font-bold text-foreground text-xs whitespace-nowrap">
                          {w.reference}
                        </TableCell>

                        {/* Agent */}
                        <TableCell className="py-4 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                              {getInitials(w.agentName)}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-foreground truncate">
                                {w.agentName}
                              </div>
                              {w.agentHandle && (
                                <div className="text-[11px] text-muted-foreground font-medium truncate">
                                  @{w.agentHandle}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* Amount */}
                        <TableCell className="py-4 px-4 text-right font-black text-foreground tabular-nums text-xs">
                          GH₵ {w.amount.toFixed(2)}
                        </TableCell>

                        {/* Payout to (MoMo Number + Network) */}
                        <TableCell className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`size-6 rounded-md flex items-center justify-center text-[9px] font-black shrink-0 ${
                                isMtn
                                  ? "bg-amber-400 text-black font-extrabold"
                                  : isTelecel
                                  ? "bg-red-600 text-white"
                                  : "bg-blue-600 text-white"
                              }`}
                            >
                              {itemNetwork === "AirtelTigo" ? "AT" : itemNetwork.slice(0, 3)}
                            </span>
                            <div>
                              <div className="font-semibold text-foreground text-xs tabular-nums">
                                {itemPhone}
                              </div>
                              <div className="text-[11px] text-muted-foreground">
                                {itemRecipient}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        {/* Status (Exact Admin Orders Status Badge Styles with dot indicators) */}
                        <TableCell className="py-4 px-4 text-center">
                          {isPaid && (
                            <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold inline-flex items-center gap-1">
                              <span className="size-1.5 rounded-full bg-emerald-500" />
                              <span>Paid</span>
                            </Badge>
                          )}
                          {isRequested && (
                            <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-[10px] font-bold inline-flex items-center gap-1">
                              <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                              <span>Requested</span>
                            </Badge>
                          )}
                          {isProcessing && (
                            <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/30 text-[10px] font-bold inline-flex items-center gap-1">
                              <span className="size-1.5 rounded-full bg-purple-500 animate-pulse" />
                              <span>Processing</span>
                            </Badge>
                          )}
                          {isFailed && (
                            <Badge className="bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/30 text-[10px] font-bold inline-flex items-center gap-1">
                              <span className="size-1.5 rounded-full bg-red-500" />
                              <span>Failed</span>
                            </Badge>
                          )}
                          {isRejected && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] font-semibold text-muted-foreground border border-border"
                            >
                              Rejected
                            </Badge>
                          )}
                        </TableCell>

                        {/* When */}
                        <TableCell className="py-4 px-4 text-right text-xs text-muted-foreground whitespace-nowrap">
                          {itemWhen}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          {isRequested || isProcessing ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={isBusy}
                                onClick={() => handleReject(w.id)}
                                className="h-7 px-2 text-[11px] font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/10 border-red-500/20 cursor-pointer"
                              >
                                Reject
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={isBusy}
                                onClick={() => handleMarkPaid(w.id)}
                                className="h-7 px-2 text-[11px] font-semibold cursor-pointer"
                              >
                                Mark Paid
                              </Button>
                              <Button
                                size="sm"
                                disabled={isBusy}
                                onClick={() => handlePaySingle(w.id)}
                                className="h-7 px-2.5 text-[11px] font-bold gap-1 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-2xs"
                              >
                                <Coins className="size-3" />
                                <span>{isBusy ? "Paying..." : "Pay"}</span>
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
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
              {filteredRows.length} payout requests
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
                      Math.abs(p - currentPage) <= 1
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

      {/* PAYOUT DETAIL & AUDIT DIALOG */}
      <Dialog
        open={Boolean(selectedPayout)}
        onOpenChange={(open) => !open && setSelectedPayout(null)}
      >
        <DialogContent className="flex max-h-[90vh] sm:max-w-md flex-col gap-0 overflow-hidden rounded-3xl border border-border bg-card p-0 shadow-2xl">
          {selectedPayout && (
            <>
              <DialogHeader className="relative shrink-0 overflow-hidden border-b border-border bg-gradient-to-br from-primary/10 via-card to-emerald-500/10 p-5 pr-10 sm:pr-12">
                <div className="flex items-center gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl font-black text-xs shadow-sm bg-primary text-primary-foreground">
                    <Download className="size-5" />
                  </span>

                  <div className="min-w-0">
                    <DialogTitle className="text-base font-extrabold text-foreground truncate">
                      {selectedPayout.reference}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                      Agent Withdrawal Audit &amp; Settlement Ledger
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="p-6 space-y-4 text-xs">
                {/* Status Callout */}
                <div
                  className={`p-3 rounded-2xl border flex items-center justify-between ${
                    selectedPayout.status === "paid"
                      ? "bg-emerald-500/10 border-emerald-500/20"
                      : selectedPayout.status === "requested" || selectedPayout.status === "processing"
                      ? "bg-amber-500/10 border-amber-500/20"
                      : "bg-red-500/10 border-red-500/20"
                  }`}
                >
                  <span
                    className={`font-bold flex items-center gap-1.5 ${
                      selectedPayout.status === "paid"
                        ? "text-emerald-800 dark:text-emerald-300"
                        : selectedPayout.status === "requested" || selectedPayout.status === "processing"
                        ? "text-amber-800 dark:text-amber-300"
                        : "text-red-800 dark:text-red-300"
                    }`}
                  >
                    {selectedPayout.status === "paid" ? (
                      <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                    ) : selectedPayout.status === "requested" || selectedPayout.status === "processing" ? (
                      <Clock className="size-4 text-amber-600 dark:text-amber-400 animate-pulse" />
                    ) : (
                      <AlertCircle className="size-4 text-red-600 dark:text-red-400" />
                    )}
                    {selectedPayout.status === "paid"
                      ? "Paid & Settled"
                      : selectedPayout.status === "requested" || selectedPayout.status === "processing"
                      ? "Awaiting MoMo Settlement"
                      : selectedPayout.status === "failed"
                      ? "Payment Failed"
                      : "Rejected (Agent Refunded)"}
                  </span>
                  <span
                    className={`font-black text-sm tabular-nums ${
                      selectedPayout.status === "paid"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-foreground"
                    }`}
                  >
                    GH₵ {selectedPayout.amount.toFixed(2)}
                  </span>
                </div>

                {/* Details Breakdown */}
                <div className="space-y-2.5 rounded-2xl border border-border bg-muted/20 p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Requesting Agent</span>
                    <span className="font-bold text-foreground">
                      {selectedPayout.agentName}
                    </span>
                  </div>

                  {selectedPayout.agentHandle && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Agent Handle</span>
                      <span className="font-semibold text-foreground">
                        @{selectedPayout.agentHandle}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">MoMo Network</span>
                    <span className="font-bold text-foreground">
                      {(selectedPayout.network || selectedPayout.momoNetwork) === "MTN"
                        ? "MTN Mobile Money"
                        : (selectedPayout.network || selectedPayout.momoNetwork) === "Telecel"
                        ? "Telecel Cash"
                        : "AT Money"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">MoMo Phone Number</span>
                    <span className="font-bold text-foreground tabular-nums">
                      {selectedPayout.phoneNumber || selectedPayout.momoNumber || "—"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Account Holder</span>
                    <span className="font-semibold text-foreground">
                      {selectedPayout.recipientName || selectedPayout.accountName || "Agent"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Requested Timestamp</span>
                    <span className="font-semibold text-foreground">
                      {selectedPayout.createdAt || selectedPayout.requestDate || "—"}
                    </span>
                  </div>

                  {selectedPayout.paidAt && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Settled Timestamp</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {selectedPayout.paidAt}
                      </span>
                    </div>
                  )}

                  {selectedPayout.reason && (
                    <div className="pt-2 border-t border-border">
                      <span className="text-muted-foreground block text-[11px] mb-1">
                        System / Auditor Notes
                      </span>
                      <p className="text-foreground bg-muted/50 p-2 rounded-lg text-[11px]">
                        {selectedPayout.reason}
                      </p>
                    </div>
                  )}

                  {selectedPayout.momoTransactionId && (
                    <div className="pt-2 border-t border-border flex justify-between items-center">
                      <span className="text-muted-foreground">Telco EVD TxID</span>
                      <span className="font-mono text-foreground font-semibold">
                        {selectedPayout.momoTransactionId}
                      </span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-border flex flex-col gap-1">
                    <span className="text-muted-foreground">Transaction Reference</span>
                    <div className="flex items-center justify-between bg-muted p-2 px-3 rounded-lg border border-border">
                      <span className="font-mono font-semibold text-foreground">
                        {selectedPayout.reference}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6 text-muted-foreground hover:text-foreground cursor-pointer"
                        onClick={() => handleCopy(selectedPayout.reference)}
                      >
                        {copiedText === selectedPayout.reference ? (
                          <Check className="size-3 text-emerald-600" />
                        ) : (
                          <Copy className="size-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Actions inside dialog */}
                <div className="flex flex-col gap-2 pt-2">
                  {selectedPayout.status === "requested" || selectedPayout.status === "processing" ? (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReject(selectedPayout.id)}
                        className="text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/10 border-red-500/20 flex-1 cursor-pointer h-9"
                      >
                        Reject &amp; Refund
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMarkPaid(selectedPayout.id)}
                        className="text-xs font-semibold flex-1 cursor-pointer h-9"
                      >
                        Mark Paid
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handlePaySingle(selectedPayout.id)}
                        className="text-xs font-bold gap-1.5 flex-1 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer h-9 shadow-2xs"
                      >
                        <Coins className="size-4" />
                        <span>Pay</span>
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full text-xs font-bold cursor-pointer h-9"
                      onClick={() => setSelectedPayout(null)}
                    >
                      Close
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* CONFIRM PAY ALL DIALOG */}
      <Dialog open={isPayAllOpen} onOpenChange={setIsPayAllOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Coins className="size-5 text-primary" />
              <span>Confirm Bulk Mobile Money Payout</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              You are about to dispatch mobile money payouts to {payTargets.length} agents via automated clearing.
            </DialogDescription>
          </DialogHeader>

          <div className="py-3 space-y-3">
            <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Total Payouts:</span>
                <span className="font-bold text-foreground">{payTargets.length} requests</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Scope:</span>
                <span className="font-semibold text-foreground">
                  {rangeActive ? "Filtered view" : "All pending requests"}
                </span>
              </div>
              <div className="pt-2 border-t border-border flex justify-between items-center">
                <span className="text-xs font-semibold text-muted-foreground">Total Disbursement:</span>
                <span className="text-base font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                  GH₵ {payTargets.reduce((s, w) => s + w.amount, 0).toFixed(2)}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Funds will be transferred directly to the agents&apos; registered MTN, Telecel, or AT Mobile Money numbers.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPayAllOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={busyActionId === "payAll"}
              onClick={handlePayAllPending}
              className="text-xs font-bold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
            >
              <Send className="size-3.5" />
              <span>{busyActionId === "payAll" ? "Processing..." : "Confirm & Disburse"}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

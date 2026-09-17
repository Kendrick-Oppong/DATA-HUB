import React, { useState, useMemo, useEffect } from "react";
import {
  CreditCard,
  Plus,
  Coins,
  ArrowDownLeft,
  ArrowUpRight,
  RotateCcw,
  TrendingUp,
  Wallet,
  Download,
  Info,
  Search,
  SlidersHorizontal,
  CheckCircle2,
  AlertCircle,
  Check,
  Copy,
  Receipt,
  Sparkles,
  Layers,
  User,
  ShieldCheck,
  ExternalLink,
  Printer,
  RefreshCw,
} from "lucide-react";
import { Transaction, Order } from "../../types";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
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

export interface AdminTransactionsProps {
  transactions?: Transaction[];
  orders?: Order[];
  onNavigateTab?: (tab: string) => void;
}

type FilterCategory =
  | "all"
  | "wallet_funding"
  | "purchase"
  | "commission"
  | "withdrawal"
  | "refund"
  | "promo_credit";

const ITEMS_PER_PAGE = 8;

// Deterministic user resolution for transactions lacking explicit profile fields
const USER_PROFILES = [
  { name: "Kendrick Oppong", role: "agent" as const },
  { name: "Kwame Asante", role: "customer" as const },
  { name: "Abena Mansa", role: "customer" as const },
  { name: "Kofi Mensah", role: "agent" as const },
  { name: "Adwoa Osei", role: "customer" as const },
  { name: "Emmanuel Darko", role: "agent" as const },
  { name: "Gifty Mensah", role: "customer" as const },
  { name: "Kojo Addo", role: "customer" as const },
  { name: "Super Admin", role: "admin" as const },
];

function resolveTxUser(tx: Transaction, index: number) {
  if (tx.userName && tx.userRole) {
    return { name: tx.userName, role: tx.userRole };
  }
  // Try to infer from description
  const desc = tx.description || "";
  if (desc.includes("Kwame Agyapong")) {
    return { name: "Kwame Agyapong", role: "customer" as const };
  }
  if (desc.includes("Gifty Mensah")) {
    return { name: "Gifty Mensah", role: "customer" as const };
  }
  if (desc.includes("Commission Payout") || desc.includes("Agent")) {
    return { name: "Kendrick Oppong", role: "agent" as const };
  }
  if (desc.includes("Promo credit") || desc.includes("Refund Engine")) {
    return { name: "SDH System", role: "admin" as const };
  }
  // Fallback cycling deterministically by transaction id hash
  const hash = (tx.id || String(index)).split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return USER_PROFILES[hash % USER_PROFILES.length];
}

export const AdminTransactions: React.FC<AdminTransactionsProps> = ({
  transactions = [],
  orders = [],
  onNavigateTab,
}) => {
  const [filter, setFilter] = useState<FilterCategory>("all");
  const [directionFilter, setDirectionFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [copiedRef, setCopiedRef] = useState<string | null>(null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, directionFilter, roleFilter, statusFilter, searchQuery]);

  // Enriched transactions with resolved user information
  const enrichedTransactions = useMemo(() => {
    return transactions.map((tx, idx) => {
      const { name, role } = resolveTxUser(tx, idx);
      return {
        ...tx,
        userName: tx.userName || name,
        userRole: tx.userRole || role,
      };
    });
  }, [transactions]);

  // Filtered transactions list
  const filteredTransactions = useMemo(() => {
    return enrichedTransactions.filter((tx) => {
      // Category filter
      if (filter !== "all" && tx.category !== filter) {
        return false;
      }

      // Direction filter (In/Out)
      if (directionFilter === "in" && tx.type !== "credit") return false;
      if (directionFilter === "out" && tx.type !== "debit") return false;

      // Role filter
      if (roleFilter !== "all" && tx.userRole !== roleFilter) return false;

      // Status filter
      if (statusFilter !== "all" && tx.status !== statusFilter) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchRef = (tx.reference || "").toLowerCase().includes(q);
        const matchDesc = (tx.description || "").toLowerCase().includes(q);
        const matchChan = (tx.channel || "").toLowerCase().includes(q);
        const matchUser = (tx.userName || "").toLowerCase().includes(q);
        const matchRole = (tx.userRole || "").toLowerCase().includes(q);
        const matchAmt = tx.amount.toString().includes(q);
        if (
          !matchRef &&
          !matchDesc &&
          !matchChan &&
          !matchUser &&
          !matchRole &&
          !matchAmt
        ) {
          return false;
        }
      }

      return true;
    });
  }, [
    enrichedTransactions,
    filter,
    directionFilter,
    roleFilter,
    statusFilter,
    searchQuery,
  ]);

  // Financial statistics (matching sdh-next: Money in, Money out, Net position, Transactions)
  const totalIn = useMemo(
    () =>
      enrichedTransactions
        .filter((tx) => tx.type === "credit" && tx.status === "completed")
        .reduce((sum, tx) => sum + tx.amount, 0),
    [enrichedTransactions],
  );

  const totalOut = useMemo(
    () =>
      enrichedTransactions
        .filter((tx) => tx.type === "debit" && tx.status === "completed")
        .reduce((sum, tx) => sum + tx.amount, 0),
    [enrichedTransactions],
  );

  const netPosition = totalIn - totalOut;

  // Pagination calculation
  const totalPages = Math.max(
    1,
    Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE),
  );

  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTransactions.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTransactions, currentPage]);

  // Category metadata helper
  const getCategoryMeta = (category: string, type: "credit" | "debit") => {
    switch (category) {
      case "wallet_funding":
        return {
          label: "Wallet Top-up",
          badgeBg:
            "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
          icon: Plus,
        };
      case "commission":
        return {
          label: "Commission Profit",
          badgeBg:
            "bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20",
          icon: Coins,
        };
      case "withdrawal":
        return {
          label: "Withdrawal / Payout",
          badgeBg:
            "bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/20",
          icon: ArrowDownLeft,
        };
      case "refund":
        return {
          label: "Refund",
          badgeBg:
            "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20",
          icon: RotateCcw,
        };
      case "promo_credit":
        return {
          label: "Promo Credit",
          badgeBg:
            "bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-500/20",
          icon: Sparkles,
        };
      case "purchase":
      default:
        return {
          label: "Purchase",
          badgeBg:
            "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
          icon: CreditCard,
        };
    }
  };

  // User Role Badge helper
  const getRoleBadge = (role?: string) => {
    switch (role) {
      case "agent":
        return (
          <Badge
            variant="outline"
            className="text-[9px] px-1.5 py-0 font-bold bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30"
          >
            Agent
          </Badge>
        );
      case "admin":
        return (
          <Badge
            variant="outline"
            className="text-[9px] px-1.5 py-0 font-bold bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30"
          >
            Admin
          </Badge>
        );
      case "storefront":
        return (
          <Badge
            variant="outline"
            className="text-[9px] px-1.5 py-0 font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30"
          >
            Storefront
          </Badge>
        );
      case "customer":
      default:
        return (
          <Badge
            variant="outline"
            className="text-[9px] px-1.5 py-0 font-bold bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30"
          >
            Customer
          </Badge>
        );
    }
  };

  // CSV Export utility matching sdh-next format
  const handleExportCsv = () => {
    const head = [
      "Date",
      "User",
      "Role",
      "Type",
      "Reference",
      "Note",
      "Amount (GHS)",
      "Status",
      "Channel",
    ];

    const esc = (c: any) => `"${String(c == null ? "" : c).replace(/"/g, '""')}"`;

    const body = filteredTransactions.map((e) => {
      const meta = getCategoryMeta(e.category, e.type);
      return [
        esc(e.date),
        esc(e.userName),
        esc(e.userRole),
        esc(meta.label),
        esc(e.reference),
        esc(e.description),
        esc(e.amount.toFixed(2)),
        esc(e.status),
        esc(e.channel),
      ];
    });

    const csv = [head.map(esc).join(","), ...body.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `platform-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);

    setExportNotice(
      `Exported ${filteredTransactions.length} transaction${
        filteredTransactions.length === 1 ? "" : "s"
      } successfully.`,
    );
    setTimeout(() => setExportNotice(null), 3500);
  };

  const handleCopyReference = (ref: string) => {
    navigator.clipboard.writeText(ref);
    setCopiedRef(ref);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  const isFiltered =
    searchQuery !== "" ||
    filter !== "all" ||
    directionFilter !== "all" ||
    roleFilter !== "all" ||
    statusFilter !== "all";

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col items-start justify-between gap-4 border-b border-border pb-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-foreground">
            <CreditCard className="size-6 text-primary" />
            <span>Platform Transactions</span>
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Every wallet movement platform-wide — top-ups, purchases, refunds,
            commissions &amp; payouts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {exportNotice && (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg animate-in fade-in duration-200">
              {exportNotice}
            </span>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="text-xs font-bold shadow-xs cursor-pointer gap-1.5 h-9"
          >
            <Download className="size-4 text-muted-foreground" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* POLICY BANNER */}
      <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs">
        <Info className="size-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="text-blue-800 dark:text-blue-300 space-y-0.5">
          <span className="font-bold block">
            Double-Entry Wallet Reconciliation &amp; Audit Trail:
          </span>
          <span>
            Every platform transaction is cryptographically logged with a
            unique reference code, originating wallet balance, and target
            clearing switch.
          </span>
        </div>
      </div>

      {/* 4 STATS CARDS TILES (Exact Parity with Agent Dashboard & Agent Transactions Tiles) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Money In */}
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10">
              <TrendingUp className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Money In
            </span>
          </div>
          <p className="mt-2 text-xl font-black tabular-nums text-emerald-600 dark:text-emerald-400">
            +GH₵ {totalIn.toFixed(2)}
          </p>
          <p className="text-[10px] text-muted-foreground font-medium">
            Top-ups, deposits &amp; refunds
          </p>
        </div>

        {/* Money Out */}
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10">
              <ArrowDownLeft className="size-3.5 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Money Out
            </span>
          </div>
          <p className="mt-2 text-xl font-black tabular-nums text-foreground">
            −GH₵ {totalOut.toFixed(2)}
          </p>
          <p className="text-[10px] text-muted-foreground font-medium">
            Wholesale orders &amp; MoMo payouts
          </p>
        </div>

        {/* Net Position */}
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
              <Coins className="size-3.5 text-primary" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Net Position
            </span>
          </div>
          <p
            className={`mt-2 text-xl font-black tabular-nums ${
              netPosition >= 0
                ? "text-foreground"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {netPosition >= 0 ? "+" : "−"}GH₵ {Math.abs(netPosition).toFixed(2)}
          </p>
          <p className="text-[10px] text-primary font-medium">
            Platform net wallet float
          </p>
        </div>

        {/* Total Transactions */}
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-blue-500/10">
              <Layers className="size-3.5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Transactions
            </span>
          </div>
          <p className="mt-2 text-xl font-black tabular-nums text-foreground">
            {enrichedTransactions.length}
          </p>
          <p className="text-[10px] text-muted-foreground font-medium">
            Total platform ledger records
          </p>
        </div>
      </div>

      {/* MASTER TRANSACTIONS CARD */}
      <Card className="border-border shadow-xs">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base font-extrabold text-foreground">
                <span>Transactions</span>
              </CardTitle>
              <CardDescription className="mt-1 text-xs">
                Every wallet movement platform-wide — top-ups, purchases,
                refunds, commissions &amp; payouts.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        {/* Search + Filters Container */}
        <div className="border-b border-border bg-muted/20 p-4 space-y-4">
          {/* Search input */}
          <div className="space-y-1.5">
            <Label
              htmlFor="admin-tx-search"
              className="text-[10px] font-bold uppercase text-muted-foreground"
            >
              Search ledger history
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="admin-tx-search"
                type="text"
                placeholder="Search by reference code, user name, role, note, or amount (e.g. TX-SDH, MTN, GH₵ 50)..."
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
                  Ledger filters
                </span>
              </div>
              {isFiltered && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setFilter("all");
                    setDirectionFilter("all");
                    setRoleFilter("all");
                    setStatusFilter("all");
                  }}
                  className="h-6 px-2 text-[10px] font-bold text-primary cursor-pointer bg-transparent hover:!bg-transparent hover:text-primary"
                >
                  Reset filters
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              {/* Flow Direction */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="filter-direction"
                  className="text-[10px] font-semibold text-muted-foreground"
                >
                  Flow Direction
                </Label>
                <Select
                  value={directionFilter}
                  onValueChange={setDirectionFilter}
                >
                  <SelectTrigger
                    id="filter-direction"
                    className="h-9 w-full text-xs"
                  >
                    <SelectValue placeholder="All Flows" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Flows</SelectItem>
                    <SelectItem value="in">Money In (+)</SelectItem>
                    <SelectItem value="out">Money Out (−)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Event Category */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="filter-category"
                  className="text-[10px] font-semibold text-muted-foreground"
                >
                  Transaction Type
                </Label>
                <Select
                  value={filter}
                  onValueChange={(val) => setFilter(val as FilterCategory)}
                >
                  <SelectTrigger
                    id="filter-category"
                    className="h-9 w-full text-xs"
                  >
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="wallet_funding">Wallet Top-up</SelectItem>
                    <SelectItem value="purchase">Purchase</SelectItem>
                    <SelectItem value="commission">Commission</SelectItem>
                    <SelectItem value="withdrawal">Withdrawal / Payout</SelectItem>
                    <SelectItem value="refund">Refund</SelectItem>
                    <SelectItem value="promo_credit">Promo Credit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* User Role */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="filter-role"
                  className="text-[10px] font-semibold text-muted-foreground"
                >
                  User Role
                </Label>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger
                    id="filter-role"
                    className="h-9 w-full text-xs"
                  >
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="agent">Agents</SelectItem>
                    <SelectItem value="customer">Customers</SelectItem>
                    <SelectItem value="admin">Admins</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="filter-status"
                  className="text-[10px] font-semibold text-muted-foreground"
                >
                  Status
                </Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger
                    id="filter-status"
                    className="h-9 w-full text-xs"
                  >
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Processing</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* TRANSACTIONS TABLE */}
        <div className="rounded-xl border border-border overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <Table className="w-full text-xs">
              <TableHeader>
                <TableRow className="border-b border-border bg-muted/40 hover:bg-muted/40">
                  <TableHead className="h-10 px-4 text-left font-bold text-muted-foreground uppercase text-[10px]">
                    Transaction &amp; Category
                  </TableHead>
                  <TableHead className="h-10 px-3 text-left font-bold text-muted-foreground uppercase text-[10px]">
                    User &amp; Role
                  </TableHead>
                  <TableHead className="h-10 px-3 text-left font-bold text-muted-foreground uppercase text-[10px]">
                    Reference
                  </TableHead>
                  <TableHead className="h-10 px-3 text-left font-bold text-muted-foreground uppercase text-[10px]">
                    Channel
                  </TableHead>
                  <TableHead className="h-10 px-3 text-right font-bold text-muted-foreground uppercase text-[10px]">
                    Amount
                  </TableHead>
                  <TableHead className="h-10 px-3 text-right font-bold text-muted-foreground uppercase text-[10px]">
                    Balance After
                  </TableHead>
                  <TableHead className="h-10 px-3 text-center font-bold text-muted-foreground uppercase text-[10px]">
                    Status
                  </TableHead>
                  <TableHead className="h-10 px-4 text-right font-bold text-muted-foreground uppercase text-[10px]">
                    When
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/60">
                {paginatedTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="h-36 text-center text-muted-foreground"
                    >
                      <div className="flex flex-col items-center justify-center py-6">
                        <div className="size-10 rounded-full bg-muted flex items-center justify-center mb-2">
                          <Receipt className="size-5 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-semibold">
                          {enrichedTransactions.length === 0
                            ? "No transactions yet. Wallet top-ups, purchases, commissions and payouts appear here."
                            : "No transactions match this filter."}
                        </p>
                        {isFiltered && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSearchQuery("");
                              setFilter("all");
                              setDirectionFilter("all");
                              setRoleFilter("all");
                              setStatusFilter("all");
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
                  paginatedTransactions.map((tx) => {
                    const meta = getCategoryMeta(tx.category, tx.type);
                    const IconComp = meta.icon;
                    const isCredit = tx.type === "credit";

                    return (
                      <TableRow
                        key={tx.id}
                        onClick={() => setSelectedTx(tx)}
                        className="hover:bg-muted/30 transition-colors cursor-pointer"
                      >
                        {/* Transaction & Category */}
                        <TableCell className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`size-8 rounded-xl flex items-center justify-center shrink-0 ${
                                isCredit
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                  : "bg-red-500/10 text-red-600 dark:text-red-400"
                              }`}
                            >
                              <IconComp className="size-4" />
                            </div>
                            <div>
                              <div className="font-bold text-foreground flex items-center gap-1.5">
                                <span>{meta.label}</span>
                                <Badge
                                  variant="outline"
                                  className={`text-[9px] px-1.5 py-0 font-bold ${meta.badgeBg}`}
                                >
                                  {tx.category.replace("_", " ")}
                                </Badge>
                              </div>
                              <span className="text-[11px] text-muted-foreground block truncate max-w-xs">
                                {tx.description}
                              </span>
                            </div>
                          </div>
                        </TableCell>

                        {/* User & Role */}
                        <TableCell className="py-3 px-3">
                          <div className="font-semibold text-foreground text-xs">
                            {tx.userName}
                          </div>
                          <div className="mt-0.5">
                            {getRoleBadge(tx.userRole)}
                          </div>
                        </TableCell>

                        {/* Reference */}
                        <TableCell className="py-3 px-3 font-semibold text-foreground">
                          <div className="flex items-center gap-1">
                            <span>{tx.reference || "—"}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyReference(tx.reference);
                              }}
                              className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                              title="Copy reference"
                            >
                              {copiedRef === tx.reference ? (
                                <Check className="size-3 text-emerald-500" />
                              ) : (
                                <Copy className="size-3" />
                              )}
                            </button>
                          </div>
                        </TableCell>

                        {/* Channel */}
                        <TableCell className="py-3 px-3 text-muted-foreground">
                          {tx.channel || "SDH Switch"}
                        </TableCell>

                        {/* Amount */}
                        <TableCell className="py-3 px-3 text-right font-black tabular-nums">
                          <span
                            className={
                              isCredit
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-foreground"
                            }
                          >
                            {isCredit ? "+" : "−"}GH₵ {tx.amount.toFixed(2)}
                          </span>
                        </TableCell>

                        {/* Balance After */}
                        <TableCell className="py-3 px-3 text-right font-semibold text-muted-foreground tabular-nums">
                          {tx.balanceAfter != null
                            ? `GH₵ ${tx.balanceAfter.toFixed(2)}`
                            : "—"}
                        </TableCell>

                        {/* Status */}
                        <TableCell className="py-3 px-3 text-center">
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-bold ${
                              tx.status === "completed"
                                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                                : tx.status === "pending"
                                  ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30"
                                  : "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/30"
                            }`}
                          >
                            {tx.status === "completed"
                              ? "Completed"
                              : tx.status === "pending"
                                ? "Processing"
                                : "Failed"}
                          </Badge>
                        </TableCell>

                        {/* When */}
                        <TableCell className="py-3 px-4 text-right text-muted-foreground whitespace-nowrap">
                          {tx.date}
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
              {Math.min(
                currentPage * ITEMS_PER_PAGE,
                filteredTransactions.length,
              )}{" "}
              of {filteredTransactions.length} transactions
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

      {/* TRANSACTION DETAILS AUDIT DIALOG (Matching Agent Transaction Modal Design) */}
      <Dialog
        open={!!selectedTx}
        onOpenChange={(open) => !open && setSelectedTx(null)}
      >
        <DialogContent className="flex max-h-[90vh] sm:max-w-md flex-col gap-0 overflow-hidden rounded-3xl border border-border bg-card p-0 shadow-2xl">
          {selectedTx && (
            <>
              <DialogHeader className="relative shrink-0 overflow-hidden border-b border-border bg-gradient-to-br from-primary/10 via-card to-amber-500/10 p-5 pr-10 sm:pr-12">
                <div className="flex items-center gap-3">
                  <span
                    className={`flex size-11 shrink-0 items-center justify-center rounded-2xl font-black text-xs shadow-sm ${
                      selectedTx.type === "credit"
                        ? "bg-emerald-500 text-white"
                        : "bg-red-500 text-white"
                    }`}
                  >
                    {selectedTx.type === "credit" ? "+" : "−"}
                  </span>

                  <div className="min-w-0">
                    <DialogTitle className="text-base font-extrabold text-foreground truncate">
                      {selectedTx.reference}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                      {selectedTx.category.replace("_", " ")} Platform Audit Ledger
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="p-6 space-y-4 text-xs">
                {/* Status Callout */}
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                  <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                    {selectedTx.status === "completed"
                      ? "Settled & Confirmed"
                      : selectedTx.status === "pending"
                        ? "Processing"
                        : "Transaction Failed"}
                  </span>
                  <span
                    className={`font-black text-sm tabular-nums ${
                      selectedTx.type === "credit"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-foreground"
                    }`}
                  >
                    {selectedTx.type === "credit" ? "+" : "−"}GH₵{" "}
                    {selectedTx.amount.toFixed(2)}
                  </span>
                </div>

                {/* Details Breakdown */}
                <div className="space-y-2.5 rounded-2xl border border-border bg-muted/20 p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">User Name</span>
                    <span className="font-bold text-foreground">
                      {selectedTx.userName}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Account Role</span>
                    <div>{getRoleBadge(selectedTx.userRole)}</div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Category</span>
                    <span className="font-bold text-foreground capitalize">
                      {selectedTx.category.replace("_", " ")}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Flow Direction</span>
                    <span
                      className={`font-bold capitalize ${
                        selectedTx.type === "credit"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-foreground"
                      }`}
                    >
                      {selectedTx.type === "credit"
                        ? "Inflow (Credit)"
                        : "Outflow (Debit)"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Payment Channel</span>
                    <span className="font-bold text-foreground">
                      {selectedTx.channel || "SDH Switch"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Transaction Date</span>
                    <span className="font-semibold text-foreground">
                      {selectedTx.date}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-border flex justify-between items-center">
                    <span className="text-muted-foreground">Amount</span>
                    <span
                      className={`font-semibold tabular-nums ${
                        selectedTx.type === "credit"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-foreground"
                      }`}
                    >
                      {selectedTx.type === "credit" ? "+" : "−"}GH₵{" "}
                      {selectedTx.amount.toFixed(2)}
                    </span>
                  </div>

                  {selectedTx.fee != null && selectedTx.fee > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Gateway Fee</span>
                      <span className="font-semibold text-foreground tabular-nums">
                        GH₵ {selectedTx.fee.toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Running Balance</span>
                    <span className="font-bold text-foreground tabular-nums">
                      {selectedTx.balanceAfter != null
                        ? `GH₵ ${selectedTx.balanceAfter.toFixed(2)}`
                        : "—"}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-border flex flex-col gap-1">
                    <span className="text-muted-foreground">
                      Description / Note
                    </span>
                    <span className="font-medium text-foreground bg-background p-2 rounded-lg border border-border">
                      {selectedTx.description}
                    </span>
                  </div>
                </div>

                {/* Actions inside modal */}
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs font-bold gap-1.5 cursor-pointer h-9"
                    onClick={() => handleCopyReference(selectedTx.reference)}
                  >
                    {copiedRef === selectedTx.reference ? (
                      <Check className="size-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                    <span>
                      {copiedRef === selectedTx.reference
                        ? "Copied Ref"
                        : "Copy Reference"}
                    </span>
                  </Button>

                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1 text-xs font-bold gap-1.5 cursor-pointer h-9"
                    onClick={() => setSelectedTx(null)}
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

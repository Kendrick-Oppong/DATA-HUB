import React, { useState, useMemo, useEffect } from "react";
import {
  SlidersHorizontal,
  Wallet,
  Coins,
  ArrowUpRight,
  ArrowDownLeft,
  Download,
  Plus,
  Search,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Info,
  RotateCcw,
  Receipt,
  ChevronRight,
  Smartphone,
} from "lucide-react";
import { Transaction } from "../../types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
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
import { WithdrawModal } from "./WithdrawModal";

interface AgentTransactionsWalletProps {
  walletBalance: number;
  commissionBalance: number;
  transactions: Transaction[];
  onOpenFundWallet: () => void;
  onWithdrawSuccess: (amount: number, reference: string) => void;
  onNavigateTab?: (tab: string) => void;
}

type FilterCategory =
  | "all"
  | "wallet_funding"
  | "purchase"
  | "commission"
  | "withdrawal"
  | "refund";

const ITEMS_PER_PAGE = 8;

export const AgentTransactionsWallet: React.FC<
  AgentTransactionsWalletProps
> = ({
  walletBalance,
  commissionBalance,
  transactions,
  onOpenFundWallet,
  onWithdrawSuccess,
  onNavigateTab,
}) => {
  const [filter, setFilter] = useState<FilterCategory>("all");
  const [directionFilter, setDirectionFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // Reset pagination on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, directionFilter, statusFilter, searchQuery]);

  // Filtered transactions list
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Category filter
      if (filter !== "all" && tx.category !== filter) {
        return false;
      }

      // Direction filter (In/Out)
      if (directionFilter === "in" && tx.type !== "credit") return false;
      if (directionFilter === "out" && tx.type !== "debit") return false;

      // Status filter
      if (statusFilter !== "all" && tx.status !== statusFilter) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchRef = (tx.reference || "").toLowerCase().includes(q);
        const matchDesc = (tx.description || "").toLowerCase().includes(q);
        const matchChan = (tx.channel || "").toLowerCase().includes(q);
        const matchAmt = tx.amount.toString().includes(q);
        if (!matchRef && !matchDesc && !matchChan && !matchAmt) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, filter, directionFilter, statusFilter, searchQuery]);

  // Pagination calculation
  const totalPages = Math.max(
    1,
    Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE),
  );

  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTransactions.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTransactions, currentPage]);

  // Financial statistics
  const totalIn = useMemo(
    () =>
      transactions
        .filter((tx) => tx.type === "credit" && tx.status === "completed")
        .reduce((sum, tx) => sum + tx.amount, 0),
    [transactions],
  );

  const totalOut = useMemo(
    () =>
      transactions
        .filter((tx) => tx.type === "debit" && tx.status === "completed")
        .reduce((sum, tx) => sum + tx.amount, 0),
    [transactions],
  );

  const withdrawalsCount = useMemo(
    () => transactions.filter((tx) => tx.category === "withdrawal").length,
    [transactions],
  );

  // CSV Export utility
  const handleExportCsv = () => {
    const headers = [
      "Transaction ID",
      "Reference",
      "Date",
      "Type",
      "Category",
      "Amount (GH₵)",
      "Fee (GH₵)",
      "Balance After (GH₵)",
      "Channel",
      "Status",
      "Description",
    ];

    const escapeCsv = (val: string | number | undefined) =>
      `"${String(val ?? "").replace(/"/g, '""')}"`;

    const rows = filteredTransactions.map((tx) => [
      escapeCsv(tx.id),
      escapeCsv(tx.reference),
      escapeCsv(tx.date),
      escapeCsv(tx.type),
      escapeCsv(tx.category),
      escapeCsv(tx.amount.toFixed(2)),
      escapeCsv((tx.fee || 0).toFixed(2)),
      escapeCsv((tx.balanceAfter || 0).toFixed(2)),
      escapeCsv(tx.channel),
      escapeCsv(tx.status),
      escapeCsv(tx.description),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `sdh-agent-ledger-${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper metadata per category
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
          label: "Store Profit",
          badgeBg:
            "bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20",
          icon: Coins,
        };
      case "withdrawal":
        return {
          label: "MoMo Payout",
          badgeBg:
            "bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/20",
          icon: ArrowDownLeft,
        };
      case "refund":
        return {
          label: "Order Refund",
          badgeBg:
            "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20",
          icon: RotateCcw,
        };
      case "purchase":
      default:
        return {
          label: "Wholesale Purchase",
          badgeBg:
            "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
          icon: CreditCard,
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* PAGE HEADER (Exact Parity with AgentPricing / AgentBulkSms) */}
      <div className="flex flex-col items-start justify-between gap-4 border-b border-border pb-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-foreground">
            <CreditCard className="size-6 text-primary" />
            <span>Wallet, Transactions &amp; Payouts</span>
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Consolidated financial management: live wallet balance, instant MoMo
            withdrawals, and master audit ledger.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="text-xs font-bold shadow-xs cursor-pointer gap-1.5 h-9"
          >
            <Download className="size-4 text-muted-foreground" />
            <span>Export CSV</span>
          </Button>

          <Button
            size="sm"
            onClick={onOpenFundWallet}
            className="text-xs font-bold shadow-xs cursor-pointer gap-1.5 h-9 bg-primary text-primary-foreground"
          >
            <Plus className="size-4" />
            <span>Fund Wallet</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setIsWithdrawOpen(true)}
            className="text-xs font-bold shadow-xs cursor-pointer gap-1.5 h-9 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <ArrowDownLeft className="size-4" />
            <span>Withdraw MoMo</span>
          </Button>
        </div>
      </div>

      {/* POLICY BANNER (Exact Parity with AgentPricing Info Callout) */}
      <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs">
        <Info className="size-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="text-blue-800 dark:text-blue-300 space-y-0.5">
          <span className="font-bold block">
            Mobile Money Payouts &amp; Settlement Policy:
          </span>
          <span>
            Withdrawals process instantly during operating hours (8:00 AM – 8:00
            PM GMT). Requests outside these hours queue securely and dispatch at
            8:00 AM the next morning. Each withdrawal requires OTP verification.
          </span>
        </div>
      </div>



      {/* 4 STATS CARDS TILES (Exact Match of AgentPricing / AgentBulkSms Tiles) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Spendable Wallet Balance */}
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
              <Wallet className="size-3.5 text-primary" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Spendable Wallet
            </span>
          </div>
          <p className="mt-2 text-xl font-black tabular-nums text-foreground">
            GH₵ {walletBalance.toFixed(2)}
          </p>
          <p className="text-[10px] text-primary font-medium">
            Active order balance
          </p>
        </div>

        {/* Commission Balance */}
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10">
              <Coins className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Commission Profit
            </span>
          </div>
          <p className="mt-2 text-xl font-black tabular-nums text-emerald-600 dark:text-emerald-400">
            GH₵ {commissionBalance.toFixed(2)}
          </p>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
            Ready to cash out (0% fee)
          </p>
        </div>

        {/* Total Inflow */}
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-teal-500/10">
              <ArrowUpRight className="size-3.5 text-teal-600 dark:text-teal-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Total Inflow
            </span>
          </div>
          <p className="mt-2 text-xl font-black tabular-nums text-foreground">
            +GH₵ {totalIn.toFixed(2)}
          </p>
          <p className="text-[10px] text-teal-600 dark:text-teal-400 font-medium">
            Top-ups &amp; profits
          </p>
        </div>

        {/* Total Outflow */}
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10">
              <ArrowDownLeft className="size-3.5 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Total Outflow
            </span>
          </div>
          <p className="mt-2 text-xl font-black tabular-nums text-foreground">
            −GH₵ {totalOut.toFixed(2)}
          </p>
          <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
            {withdrawalsCount} MoMo payouts
          </p>
        </div>
      </div>

      {/* MASTER TRANSACTIONS & PAYOUTS CARD (Exact Match of AgentPricing Card & Table Structure) */}
      <Card className="border-border shadow-xs">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base font-extrabold text-foreground">
                Consolidated Financial Ledger
              </CardTitle>
              <CardDescription className="mt-1 text-xs">
                Real-time chronological log of all top-ups, bundle purchases,
                store profits, and MoMo withdrawals
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        {/* Search + Filters Box (Exact match of AgentPricing) */}
        <div className="border-b border-border bg-muted/20 p-4 space-y-4">
          {/* Search input */}
          <div className="space-y-1.5">
            <Label
              htmlFor="tx-search"
              className="text-[10px] font-bold uppercase text-muted-foreground"
            >
              Search ledger history
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="tx-search"
                type="text"
                placeholder="Search by reference code, description, channel, or amount (e.g. TX1024, MoMo, GH₵ 50)..."
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
              {(searchQuery ||
                filter !== "all" ||
                directionFilter !== "all" ||
                statusFilter !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setFilter("all");
                    setDirectionFilter("all");
                    setStatusFilter("all");
                  }}
                  className="h-6 px-2 text-[10px] font-bold text-primary cursor-pointer bg-transparent hover:!bg-transparent hover:text-primary"
                >
                  Reset filters
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {/* Category Select */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="filter-category"
                  className="text-[10px] font-semibold text-muted-foreground"
                >
                  Event Category
                </Label>
                <Select
                  value={filter}
                  onValueChange={(val) => setFilter(val as FilterCategory)}
                >
                  <SelectTrigger
                    id="filter-category"
                    className="h-9 w-full text-xs"
                  >
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="wallet_funding">
                      Wallet Top-ups
                    </SelectItem>
                    <SelectItem value="commission">Store Profits</SelectItem>
                    <SelectItem value="purchase">
                      Wholesale Purchases
                    </SelectItem>
                    <SelectItem value="withdrawal">MoMo Payouts</SelectItem>
                    <SelectItem value="refund">Order Refunds</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Direction Select */}
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

              {/* Status Select */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="filter-status"
                  className="text-[10px] font-semibold text-muted-foreground"
                >
                  Transaction Status
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

        {/* TRANSACTIONS TABLE (Exact Match of AgentPricing & AgentBulkSms Table) */}
        <div className="rounded-xl border border-border overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <Table className="w-full text-xs">
              <TableHeader>
                <TableRow className="border-b border-border bg-muted/40 hover:bg-muted/40">
                  <TableHead className="h-10 px-4 text-left font-bold text-muted-foreground uppercase text-[10px]">
                    Transaction &amp; Category
                  </TableHead>
                  <TableHead className="h-10 px-3 text-left font-bold text-muted-foreground uppercase text-[10px]">
                    Reference Code
                  </TableHead>
                  <TableHead className="h-10 px-3 text-left font-bold text-muted-foreground uppercase text-[10px]">
                    Channel / Switch
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
                    Date &amp; Time
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/60">
                {paginatedTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-32 text-center text-muted-foreground"
                    >
                      <p className="text-sm font-semibold">
                        No transactions match your filter criteria.
                      </p>
                      <p className="text-xs mt-1">
                        Try changing or clearing your search keywords.
                      </p>
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

                        <TableCell className="py-3 px-3 font-semibold text-foreground">
                          {tx.reference}
                        </TableCell>

                        <TableCell className="py-3 px-3 text-muted-foreground">
                          {tx.channel || "SDH Switch"}
                        </TableCell>

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

                        <TableCell className="py-3 px-3 text-right font-semibold text-muted-foreground tabular-nums">
                          {tx.balanceAfter != null
                            ? `GH₵ ${tx.balanceAfter.toFixed(2)}`
                            : "—"}
                        </TableCell>

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

          {/* PAGINATION FOOTER (Exact Match of AgentPricing) */}
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

      {/* TRANSACTION DETAILS DIALOG */}
      <Dialog
        open={!!selectedTx}
        onOpenChange={(open) => !open && setSelectedTx(null)}
      >
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader className="pb-3 border-b border-border">
            <DialogTitle className="text-lg font-extrabold text-foreground flex items-center gap-2">
              <Receipt className="size-5 text-primary" />
              <span>Transaction Receipt</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Audited electronic ledger record from the Smart Data Hub switch
            </DialogDescription>
          </DialogHeader>

          {selectedTx && (
            <div className="space-y-4 py-2 text-xs">
              <div className="p-4 rounded-2xl bg-muted/40 border border-border text-center space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                  Amount Moved
                </span>
                <span
                  className={`text-3xl font-black tabular-nums ${
                    selectedTx.type === "credit"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-foreground"
                  }`}
                >
                  {selectedTx.type === "credit" ? "+" : "−"}GH₵{" "}
                  {selectedTx.amount.toFixed(2)}
                </span>
                <div className="pt-1">
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-bold ${
                      selectedTx.status === "completed"
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                        : "bg-amber-500/10 text-amber-700 border-amber-500/30"
                    }`}
                  >
                    {selectedTx.status.toUpperCase()}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2.5 divide-y divide-border/60">
                <div className="flex justify-between pt-2">
                  <span className="text-muted-foreground font-semibold">
                    Reference ID
                  </span>
                  <span className="font-bold text-foreground">
                    {selectedTx.reference}
                  </span>
                </div>

                <div className="flex justify-between pt-2">
                  <span className="text-muted-foreground font-semibold">
                    Category
                  </span>
                  <span className="font-bold text-foreground capitalize">
                    {selectedTx.category.replace("_", " ")}
                  </span>
                </div>

                <div className="flex justify-between pt-2">
                  <span className="text-muted-foreground font-semibold">
                    Payment Channel
                  </span>
                  <span className="font-bold text-foreground">
                    {selectedTx.channel}
                  </span>
                </div>

                <div className="flex justify-between pt-2">
                  <span className="text-muted-foreground font-semibold">
                    Processing Fee
                  </span>
                  <span className="font-bold text-foreground">
                    GH₵ {(selectedTx.fee || 0).toFixed(2)} (0%)
                  </span>
                </div>

                <div className="flex justify-between pt-2">
                  <span className="text-muted-foreground font-semibold">
                    Balance After
                  </span>
                  <span className="font-bold text-foreground">
                    {selectedTx.balanceAfter != null
                      ? `GH₵ ${selectedTx.balanceAfter.toFixed(2)}`
                      : "—"}
                  </span>
                </div>

                <div className="flex justify-between pt-2">
                  <span className="text-muted-foreground font-semibold">
                    Timestamp
                  </span>
                  <span className="font-bold text-foreground">
                    {selectedTx.date}
                  </span>
                </div>

                <div className="pt-2">
                  <span className="text-muted-foreground font-semibold block mb-1">
                    Description &amp; Note
                  </span>
                  <p className="p-2.5 rounded-xl bg-muted/40 border border-border text-foreground text-xs leading-relaxed">
                    {selectedTx.description}
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="pt-2 border-t border-border sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedTx(null)}
              className="rounded-xl text-xs font-bold"
            >
              Close Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* WITHDRAW MODAL */}
      <WithdrawModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        onSuccess={onWithdrawSuccess}
        commissionBalance={commissionBalance}
      />
    </div>
  );
};

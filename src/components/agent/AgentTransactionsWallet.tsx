import React, { useState, useMemo } from "react";
import {
  Wallet,
  ArrowDownLeft,
  Plus,
  CreditCard,
  Download,
  Search,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Coins,
  Receipt,
  FileSpreadsheet,
  Filter,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Smartphone,
  RotateCcw,
} from "lucide-react";
import { Transaction } from "../../types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
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
  | "in"
  | "out"
  | "wallet_funding"
  | "purchase"
  | "commission"
  | "withdrawal"
  | "refund";

export const AgentTransactionsWallet: React.FC<AgentTransactionsWalletProps> = ({
  walletBalance,
  commissionBalance,
  transactions,
  onOpenFundWallet,
  onWithdrawSuccess,
  onNavigateTab,
}) => {
  const [filter, setFilter] = useState<FilterCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Category / Type filter
      if (filter === "in" && tx.type !== "credit") return false;
      if (filter === "out" && tx.type !== "debit") return false;
      if (
        filter !== "all" &&
        filter !== "in" &&
        filter !== "out" &&
        tx.category !== filter
      ) {
        return false;
      }

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
  }, [transactions, filter, searchQuery]);

  // Financial statistics
  const totalIn = useMemo(
    () =>
      transactions
        .filter((tx) => tx.type === "credit" && tx.status === "completed")
        .reduce((sum, tx) => sum + tx.amount, 0),
    [transactions]
  );

  const totalOut = useMemo(
    () =>
      transactions
        .filter((tx) => tx.type === "debit" && tx.status === "completed")
        .reduce((sum, tx) => sum + tx.amount, 0),
    [transactions]
  );

  const withdrawalsCount = useMemo(
    () => transactions.filter((tx) => tx.category === "withdrawal").length,
    [transactions]
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
      `sdh-agent-ledger-${new Date().toISOString().slice(0, 10)}.csv`
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
          badgeBg: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
          icon: Plus,
        };
      case "commission":
        return {
          label: "Store Profit",
          badgeBg: "bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20",
          icon: Coins,
        };
      case "withdrawal":
        return {
          label: "MoMo Payout",
          badgeBg: "bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/20",
          icon: ArrowDownLeft,
        };
      case "refund":
        return {
          label: "Order Refund",
          badgeBg: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20",
          icon: RotateCcw,
        };
      case "purchase":
      default:
        return {
          label: "Wholesale Purchase",
          badgeBg: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
          icon: CreditCard,
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER WITH TITLE & ACTION BUTTONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
            <CreditCard className="size-6 text-primary" />
            <span>Wallet, Transactions &amp; Payouts</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Consolidated financial management: live wallet balance, instant MoMo withdrawals, and master audit ledger.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="h-9 gap-1.5 rounded-xl text-xs font-bold shadow-xs"
          >
            <Download className="size-3.5" />
            <span>Export CSV</span>
          </Button>

          <Button
            size="sm"
            onClick={onOpenFundWallet}
            className="h-9 gap-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs"
          >
            <Plus className="size-3.5" />
            <span>Fund Wallet</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setIsWithdrawOpen(true)}
            className="h-9 gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs"
          >
            <ArrowDownLeft className="size-3.5" />
            <span>Withdraw MoMo</span>
          </Button>
        </div>
      </div>

      {/* DUAL BALANCE HERO CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Spendable Wallet Balance */}
        <Card className="rounded-3xl border border-border shadow-xs overflow-hidden relative">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Wallet className="size-4 text-primary" />
                <span>Spendable Wallet Balance</span>
              </span>
              <Badge variant="outline" className="text-[10px] font-bold bg-primary/10 text-primary border-primary/20">
                Active Balance
              </Badge>
            </div>
            <div className="mt-2">
              <span className="text-3xl sm:text-4xl font-black text-foreground tracking-tight tabular-nums">
                GH₵ {walletBalance.toFixed(2)}
              </span>
            </div>
            <CardDescription className="text-xs mt-1">
              Used automatically when placing data bundles, airtime, WAEC vouchers, and utility orders.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="flex items-center gap-3">
              <Button
                onClick={onOpenFundWallet}
                className="h-10 px-4 rounded-xl gap-1.5 text-xs font-bold bg-primary text-primary-foreground shadow-xs"
              >
                <Plus className="size-4" />
                <span>Fund via Mobile Money</span>
              </Button>
              {onNavigateTab && (
                <Button
                  variant="ghost"
                  onClick={() => onNavigateTab("buy-data")}
                  className="h-10 px-3 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  <span>Buy Data</span>
                  <ChevronRight className="size-3.5 ml-1" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Commission Profit Available */}
        <Card className="rounded-3xl border border-border shadow-xs overflow-hidden relative bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Coins className="size-4 text-emerald-600 dark:text-emerald-400" />
                <span>Withdrawable Commission Profit</span>
              </span>
              <Badge variant="outline" className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                Ready to Cash Out
              </Badge>
            </div>
            <div className="mt-2">
              <span className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight tabular-nums">
                GH₵ {commissionBalance.toFixed(2)}
              </span>
            </div>
            <CardDescription className="text-xs mt-1">
              Storefront sales margins earned automatically. Transferred directly to MTN MoMo or Telecel Cash.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setIsWithdrawOpen(true)}
                disabled={commissionBalance < 5}
                className="h-10 px-4 rounded-xl gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs disabled:opacity-50"
              >
                <ArrowDownLeft className="size-4" />
                <span>Cash Out to Mobile Money</span>
              </Button>
              <span className="text-[11px] text-muted-foreground">
                Min: GH₵ 5.00 · 0% fee
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3 SUMMARY TILES: MONEY IN, MONEY OUT, AUDITED TOTAL */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
              Total Inflow (Money In)
            </span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
              +GH₵ {totalIn.toFixed(2)}
            </span>
            <span className="text-[10px] text-muted-foreground block">
              Top-ups, store profits, and refunds
            </span>
          </div>
          <div className="size-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <ArrowUpRight className="size-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
              Total Outflow (Money Out)
            </span>
            <span className="text-xl font-black text-foreground tabular-nums">
              −GH₵ {totalOut.toFixed(2)}
            </span>
            <span className="text-[10px] text-muted-foreground block">
              Wholesale purchases and MoMo payouts
            </span>
          </div>
          <div className="size-10 rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center">
            <ArrowDownLeft className="size-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
              Ledger Events
            </span>
            <span className="text-xl font-black text-foreground tabular-nums">
              {transactions.length} Total
            </span>
            <span className="text-[10px] text-muted-foreground block">
              {withdrawalsCount} withdrawals recorded
            </span>
          </div>
          <div className="size-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <Receipt className="size-5" />
          </div>
        </div>
      </div>

      {/* HOW PAYOUTS WORK / POLICY DISCLOSURE */}
      <Card className="rounded-3xl border border-border/80 bg-muted/20 shadow-xs">
        <CardContent className="p-5">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="size-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <span>How Mobile Money Payouts Work</span>
                  <Badge variant="outline" className="text-[10px] font-semibold">
                    Instant Bank Switch
                  </Badge>
                </h4>
                <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
                  Withdrawals process instantly during operating hours (8:00 AM – 8:00 PM GMT). Requests outside these hours queue securely and dispatch at 8:00 AM the next morning. Each withdrawal requires OTP verification sent to your registered account.
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsWithdrawOpen(true)}
              className="h-9 px-4 rounded-xl text-xs font-bold shrink-0"
            >
              <Smartphone className="size-3.5 mr-1.5 text-primary" />
              <span>Request Payout</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* MASTER TRANSACTIONS & PAYOUTS LEDGER */}
      <Card className="rounded-3xl border border-border shadow-xs">
        <CardHeader className="pb-4 border-b border-border">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                Consolidated Financial Ledger
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time chronological log of all top-ups, bundle purchases, store profits, and MoMo withdrawals
              </CardDescription>
            </div>

            {/* Live Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search reference, channel, note..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 rounded-xl text-xs bg-background"
              />
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-3">
            {[
              { id: "all", label: "All Events" },
              { id: "in", label: "Money In (+)" },
              { id: "out", label: "Money Out (−)" },
              { id: "withdrawal", label: "Withdrawals / Payouts" },
              { id: "wallet_funding", label: "Wallet Top-ups" },
              { id: "commission", label: "Store Profits" },
              { id: "purchase", label: "Purchases" },
              { id: "refund", label: "Refunds" },
            ].map((tab) => (
              <Button
                key={tab.id}
                variant={filter === tab.id ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(tab.id as FilterCategory)}
                className={`h-7 px-3 text-[11px] font-bold rounded-lg transition-all ${
                  filter === tab.id
                    ? "shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-muted-foreground font-bold text-[10px] uppercase">
                  <th className="py-3 px-4">Transaction / Type</th>
                  <th className="py-3 px-3">Reference</th>
                  <th className="py-3 px-3">Channel / MoMo</th>
                  <th className="py-3 px-3 text-right">Amount</th>
                  <th className="py-3 px-3 text-right">Balance After</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Date &amp; Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((tx) => {
                    const meta = getCategoryMeta(tx.category, tx.type);
                    const IconComp = meta.icon;
                    const isCredit = tx.type === "credit";

                    return (
                      <tr
                        key={tx.id}
                        onClick={() => setSelectedTx(tx)}
                        className="hover:bg-muted/30 transition-colors cursor-pointer group"
                      >
                        <td className="py-3 px-4">
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
                        </td>

                        <td className="py-3 px-3 font-semibold text-foreground">
                          {tx.reference}
                        </td>

                        <td className="py-3 px-3 text-muted-foreground">
                          {tx.channel || "SDH Switch"}
                        </td>

                        <td className="py-3 px-3 text-right font-black tabular-nums">
                          <span
                            className={
                              isCredit
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-foreground"
                            }
                          >
                            {isCredit ? "+" : "−"}GH₵ {tx.amount.toFixed(2)}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-right font-semibold text-muted-foreground tabular-nums">
                          {tx.balanceAfter != null
                            ? `GH₵ ${tx.balanceAfter.toFixed(2)}`
                            : "—"}
                        </td>

                        <td className="py-3 px-3 text-center">
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
                        </td>

                        <td className="py-3 px-4 text-right text-muted-foreground whitespace-nowrap">
                          {tx.date}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      <div className="max-w-sm mx-auto space-y-2">
                        <Receipt className="size-8 text-muted-foreground/50 mx-auto" />
                        <p className="font-semibold text-foreground text-sm">No transactions match your filters</p>
                        <p className="text-xs text-muted-foreground">
                          Try searching for a different reference code, or reset your filters to view all ledger history.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setFilter("all");
                            setSearchQuery("");
                          }}
                          className="mt-2 text-xs font-bold rounded-xl"
                        >
                          Reset Filters
                        </Button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* TRANSACTION DETAILS DIALOG */}
      <Dialog open={!!selectedTx} onOpenChange={(open) => !open && setSelectedTx(null)}>
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
                  <span className="text-muted-foreground font-semibold">Reference ID</span>
                  <span className="font-bold text-foreground">{selectedTx.reference}</span>
                </div>

                <div className="flex justify-between pt-2">
                  <span className="text-muted-foreground font-semibold">Category</span>
                  <span className="font-bold text-foreground capitalize">
                    {selectedTx.category.replace("_", " ")}
                  </span>
                </div>

                <div className="flex justify-between pt-2">
                  <span className="text-muted-foreground font-semibold">Payment Channel</span>
                  <span className="font-bold text-foreground">{selectedTx.channel}</span>
                </div>

                <div className="flex justify-between pt-2">
                  <span className="text-muted-foreground font-semibold">Processing Fee</span>
                  <span className="font-bold text-foreground">
                    GH₵ {(selectedTx.fee || 0).toFixed(2)} (0%)
                  </span>
                </div>

                <div className="flex justify-between pt-2">
                  <span className="text-muted-foreground font-semibold">Balance After</span>
                  <span className="font-bold text-foreground">
                    {selectedTx.balanceAfter != null
                      ? `GH₵ ${selectedTx.balanceAfter.toFixed(2)}`
                      : "—"}
                  </span>
                </div>

                <div className="flex justify-between pt-2">
                  <span className="text-muted-foreground font-semibold">Timestamp</span>
                  <span className="font-bold text-foreground">{selectedTx.date}</span>
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

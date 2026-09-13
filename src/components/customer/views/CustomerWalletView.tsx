import React, { useState, useEffect } from "react";
import {
  Wallet,
  Plus,
  CheckCircle2,
  Search,
  SlidersHorizontal,
  AlertCircle,
} from "lucide-react";
import { Transaction } from "../../../types";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../../ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "../../ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { PaginationHelper } from "./PaginationHelper";

interface CustomerWalletViewProps {
  walletBalance: number;
  onOpenFundWallet: () => void;
  transactions: Transaction[];
}

export const CustomerWalletView: React.FC<CustomerWalletViewProps> = ({
  walletBalance,
  onOpenFundWallet,
  transactions,
}) => {
  const TX_PER_PAGE = 5;

  const [txSearch, setTxSearch] = useState("");
  const [txTypeFilter, setTxTypeFilter] = useState<string>("all");
  const [txChannelFilter, setTxChannelFilter] = useState<string>("all");
  const [txPage, setTxPage] = useState(1);

  // Reset pagination on filter change
  useEffect(() => {
    setTxPage(1);
  }, [txSearch, txTypeFilter, txChannelFilter]);

  // Transaction Filtering
  const filteredTransactions = transactions.filter((tx) => {
    const query = txSearch.toLowerCase().trim();

    const matchesQuery =
      !query ||
      tx.reference.toLowerCase().includes(query) ||
      tx.description.toLowerCase().includes(query) ||
      tx.channel.toLowerCase().includes(query);

    const matchesType = txTypeFilter === "all" || tx.type === txTypeFilter;

    const matchesChannel =
      txChannelFilter === "all" ||
      tx.channel.toLowerCase().includes(txChannelFilter.toLowerCase());

    return matchesQuery && matchesType && matchesChannel;
  });

  const totalTxPages = Math.max(
    1,
    Math.ceil(filteredTransactions.length / TX_PER_PAGE),
  );

  const paginatedTransactions = filteredTransactions.slice(
    (txPage - 1) * TX_PER_PAGE,
    txPage * TX_PER_PAGE,
  );

  const resetTransactionFilters = () => {
    setTxSearch("");
    setTxTypeFilter("all");
    setTxChannelFilter("all");
  };

  const hasTransactionFilters =
    txSearch.trim() !== "" ||
    txTypeFilter !== "all" ||
    txChannelFilter !== "all";

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col items-start justify-between gap-4 border-b border-border pb-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-foreground">
            <Wallet className="size-6 text-primary" />
            <span>Wallet & Financial Ledger</span>
          </h1>

          <p className="mt-0.5 text-xs text-muted-foreground">
            Real-time ledger of top-ups, purchases, refunds, and available balance.
          </p>
        </div>

        <Button
          onClick={onOpenFundWallet}
          className="text-xs font-bold shadow-sm cursor-pointer"
        >
          <Plus className="size-4 stroke-3" />
          Fund Wallet
        </Button>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Available Cash
          </span>

          <div className="mt-1 text-3xl font-black tabular-nums text-foreground">
            GH₵ {walletBalance.toFixed(2)}
          </div>

          <p className="mt-1 flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-3.5" />
            <span>Ready for instant checkout</span>
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Promo Credits
          </span>

          <div className="mt-1 text-3xl font-black tabular-nums text-foreground">
            GH₵ 5.00
          </div>

          <p className="mt-1 text-[11px] text-muted-foreground">
            Applies automatically to purchases
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Recharge Channels
          </span>

          <div className="mt-2 flex items-center gap-2 text-sm font-bold text-foreground">
            <span className="rounded bg-amber-400 px-2 py-0.5 text-xs text-amber-950">
              MTN
            </span>

            <span className="rounded bg-red-600 px-2 py-0.5 text-xs text-white">
              Telecel
            </span>

            <span className="rounded bg-blue-600 px-2 py-0.5 text-xs text-white">
              AT
            </span>
          </div>

          <p className="mt-1 text-[11px] text-muted-foreground">
            Instant USSD & Bank card
          </p>
        </div>
      </div>

      {/* Transactions Table Card */}
      <Card className="border-border shadow-xs">
        <CardHeader className="border-b border-border pb-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-base font-extrabold text-foreground">
              Transaction History & Ledger
            </CardTitle>

            <CardDescription className="mt-1 text-xs">
              Filtered audit log of credits, debits, and balance updates.
            </CardDescription>
          </div>
        </CardHeader>

        {/* Transaction Search + Filters */}
        <div className="border-b border-border bg-muted/20 p-4">
          <div className="space-y-4">
            {/* Search */}
            <div className="space-y-1.5">
              <Label
                htmlFor="transaction-search"
                className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
              >
                Search transactions
              </Label>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  id="transaction-search"
                  type="text"
                  placeholder="Reference, description, or payment channel..."
                  value={txSearch}
                  onChange={(e) => setTxSearch(e.target.value)}
                  className="h-10 bg-background pl-9 text-xs"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="rounded-xl border border-border bg-background p-3">
              <div className="mb-3 flex items-center gap-2">
                <SlidersHorizontal className="size-3.5 text-muted-foreground" />

                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Transaction filters
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Type */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="transaction-type"
                    className="text-[10px] font-semibold text-muted-foreground"
                  >
                    Transaction type
                  </Label>

                  <Select
                    value={txTypeFilter}
                    onValueChange={setTxTypeFilter}
                  >
                    <SelectTrigger
                      id="transaction-type"
                      className="h-9 w-full text-xs"
                    >
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="all">
                        All transaction types
                      </SelectItem>

                      <SelectItem value="credit">Credits</SelectItem>

                      <SelectItem value="debit">Debits</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Channel */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="transaction-channel"
                    className="text-[10px] font-semibold text-muted-foreground"
                  >
                    Payment channel
                  </Label>

                  <Select
                    value={txChannelFilter}
                    onValueChange={setTxChannelFilter}
                  >
                    <SelectTrigger
                      id="transaction-channel"
                      className="h-9 w-full text-xs"
                    >
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="all">
                        All payment channels
                      </SelectItem>

                      <SelectItem value="MTN">MTN MoMo</SelectItem>

                      <SelectItem value="Telecel">Telecel Cash</SelectItem>

                      <SelectItem value="AT">AT Money</SelectItem>

                      <SelectItem value="Wallet">Wallet Auto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  {hasTransactionFilters ? (
                    <>
                      <span className="size-1.5 rounded-full bg-primary" />
                      <span>Filters are currently active</span>
                    </>
                  ) : (
                    <>
                      <span className="size-1.5 rounded-full bg-muted-foreground/40" />
                      <span>Showing all transactions</span>
                    </>
                  )}
                </div>

                {hasTransactionFilters && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={resetTransactionFilters}
                  >
                    Reset all filters
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead className="text-right">Amount (GH₵)</TableHead>
                <TableHead className="text-right">
                  Balance After (GH₵)
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginatedTransactions.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-10 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <AlertCircle className="size-5 text-muted-foreground/60" />

                      <p className="text-xs font-semibold">
                        No transactions match your filters.
                      </p>

                      <Button
                        variant="link"
                        size="sm"
                        onClick={resetTransactionFilters}
                        className="text-xs"
                      >
                        Clear all filters
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedTransactions.map((tx) => (
                  <TableRow key={tx.id} className="hover:bg-muted/40">
                    <TableCell className="text-xs font-bold text-foreground">
                      {tx.reference}
                    </TableCell>

                    <TableCell className="text-xs tabular-nums ">
                      {tx.date}
                    </TableCell>

                    <TableCell className="font-medium text-xs text-foreground">
                      {tx.description}
                    </TableCell>

                    <TableCell>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                          tx.channel.includes("MTN")
                            ? "bg-amber-400/15 text-amber-700 dark:text-amber-400"
                            : tx.channel.includes("Telecel")
                              ? "bg-red-500/15 text-red-700 dark:text-red-400"
                              : tx.channel.includes("AT")
                                ? "bg-blue-500/15 text-blue-700 dark:text-blue-400"
                                : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                        }`}
                      >
                        <span
                          className={`size-1.5 rounded-full ${
                            tx.channel.includes("MTN")
                              ? "bg-amber-500"
                              : tx.channel.includes("Telecel")
                                ? "bg-red-500"
                                : tx.channel.includes("AT")
                                  ? "bg-blue-500"
                                  : "bg-emerald-500"
                          }`}
                        />
                        {tx.channel}
                      </span>
                    </TableCell>

                    <TableCell
                      className={`text-right text-xs font-black tabular-nums ${
                        tx.type === "credit"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-foreground"
                      }`}
                    >
                      {tx.type === "credit" ? "+" : "-"}
                      {tx.amount.toFixed(2)}
                    </TableCell>

                    <TableCell className="text-right text-xs tabular-nums ">
                      {tx.balanceAfter.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Transaction Pagination Footer */}
          <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs text-muted-foreground">
              Showing{" "}
              <span className="font-bold text-foreground">
                {filteredTransactions.length === 0
                  ? 0
                  : Math.min(txPage * TX_PER_PAGE, filteredTransactions.length)}
              </span>{" "}
              of{" "}
              <span className="font-bold text-foreground">
                {filteredTransactions.length}
              </span>{" "}
              transactions
            </span>

            {filteredTransactions.length > TX_PER_PAGE && (
              <div>
                <PaginationHelper
                  currentPage={txPage}
                  totalPages={totalTxPages}
                  onPageChange={setTxPage}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

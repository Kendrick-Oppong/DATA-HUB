import React, { useState, useMemo } from "react";
import {
  GraduationCap,
  Ticket,
  CheckCircle2,
  Clock,
  Search,
  SlidersHorizontal,
  Download,
  X,
  Check,
  Send,
  RotateCcw,
  Eye,
  EyeOff,
  Copy,
  DollarSign,
  TrendingUp,
  Package,
  Plus,
} from "lucide-react";
import { ResultCheckerProduct, Order } from "../../types";
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
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";

export interface AdminCheckersProps {
  checkers: ResultCheckerProduct[];
  orders: Order[];
  onAddVoucherStock: (checkerId: string, count: number) => void;
  onUpdateCheckerPrice?: (
    checkerId: string,
    price: number,
    wholesalePrice: number,
  ) => void;
  onNavigateTab?: (tab: string) => void;
}

const ITEMS_PER_PAGE = 8;

// Date formatter
function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(
      dateStr.includes("T") ? dateStr : dateStr.replace(" ", "T"),
    );
    if (isNaN(d.getTime())) return dateStr;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  } catch {
    return dateStr;
  }
}

export const AdminCheckers: React.FC<AdminCheckersProps> = ({
  checkers,
  orders,
  onAddVoucherStock,
  onUpdateCheckerPrice,
  onNavigateTab,
}) => {
  // Pricing state — one set of inputs per checker
  const [priceInputs, setPriceInputs] = useState<
    Record<string, { retail: string; wholesale: string }>
  >(() => {
    const init: Record<string, { retail: string; wholesale: string }> = {};
    checkers.forEach((c) => {
      init[c.id] = {
        retail: c.price.toFixed(2),
        wholesale: (c.wholesalePrice ?? c.price - 5).toFixed(2),
      };
    });
    return init;
  });
  const [priceNotice, setPriceNotice] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  // Table filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [productFilter, setProductFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Fulfill modal
  const [fulfillOrder, setFulfillOrder] = useState<Order | null>(null);
  const [fulfillSerial, setFulfillSerial] = useState("");
  const [fulfillPin, setFulfillPin] = useState("");
  const [pinVisible, setPinVisible] = useState(false);
  const [copiedRef, setCopiedRef] = useState<string | null>(null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // All checker orders
  const checkerOrders = useMemo(
    () =>
      orders
        .filter((o) => o.serviceType === "checker")
        .sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        ),
    [orders],
  );

  // Stats
  const stats = useMemo(() => {
    const totalSold = checkerOrders.filter(
      (o) => o.status === "delivered",
    ).length;
    const processing = checkerOrders.filter(
      (o) => o.status === "processing",
    ).length;
    const totalRevenue = checkerOrders
      .filter((o) => o.status === "delivered")
      .reduce((sum, o) => sum + o.amount, 0);
    const totalStock = checkers.reduce((sum, c) => sum + c.stockCount, 0);
    return { totalSold, processing, totalRevenue, totalStock };
  }, [checkerOrders, checkers]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return checkerOrders.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (
        productFilter !== "all" &&
        !o.productName.toLowerCase().includes(productFilter.toLowerCase())
      )
        return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          o.reference.toLowerCase().includes(q) ||
          o.productName.toLowerCase().includes(q) ||
          o.recipientPhone.includes(q) ||
          (o.voucherSerial || "").toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [checkerOrders, statusFilter, productFilter, searchQuery]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredOrders.length / ITEMS_PER_PAGE),
  );
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOrders.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredOrders, currentPage]);

  const isFiltered =
    searchQuery !== "" || statusFilter !== "all" || productFilter !== "all";

  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setProductFilter("all");
    setCurrentPage(1);
  };

  const handleSavePrice = (checkerId: string) => {
    const inputs = priceInputs[checkerId];
    if (!inputs) return;
    const retail = Number(inputs.retail);
    const wholesale = Number(inputs.wholesale);
    if (
      !Number.isFinite(retail) ||
      retail < 1 ||
      !Number.isFinite(wholesale) ||
      wholesale < 1
    ) {
      setPriceNotice("Please enter valid prices (minimum GH₵ 1.00).");
      setTimeout(() => setPriceNotice(null), 3500);
      return;
    }
    if (wholesale >= retail) {
      setPriceNotice(
        "Agent (wholesale) price must be less than the customer (retail) price.",
      );
      setTimeout(() => setPriceNotice(null), 3500);
      return;
    }
    setSavingId(checkerId);
    onUpdateCheckerPrice?.(
      checkerId,
      Number(retail.toFixed(2)),
      Number(wholesale.toFixed(2)),
    );
    const checker = checkers.find((c) => c.id === checkerId);
    setPriceNotice(
      `Prices updated for ${checker?.title ?? "checker"}: Customer GH₵ ${retail.toFixed(2)} · Agent GH₵ ${wholesale.toFixed(2)}`,
    );
    setTimeout(() => {
      setPriceNotice(null);
      setSavingId(null);
    }, 4000);
  };

  const handleCopyRef = (ref: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(ref);
    setCopiedRef(ref);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  const handleExportCsv = () => {
    const head = [
      "Reference",
      "Product",
      "Recipient",
      "Amount",
      "Serial",
      "PIN",
      "Status",
      "Date",
    ];
    const esc = (c: unknown) => `"${String(c ?? "").replace(/"/g, '""')}"`;
    const rows = filteredOrders.map((o) => [
      esc(o.reference),
      esc(o.productName),
      esc(o.recipientPhone),
      esc(o.amount.toFixed(2)),
      esc(o.voucherSerial || ""),
      esc(o.voucherCode || ""),
      esc(o.status),
      esc(o.date),
    ]);
    const csv = [head.map(esc).join(","), ...rows.map((r) => r.join(","))].join(
      "\r\n",
    );
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `checker-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    setExportNotice(
      `Exported ${filteredOrders.length} record${filteredOrders.length === 1 ? "" : "s"}.`,
    );
    setTimeout(() => setExportNotice(null), 3500);
  };

  const getStatusPill = (status: string) => {
    const configs: Record<
      string,
      { dot: string; classes: string; label: string }
    > = {
      delivered: {
        dot: "bg-emerald-500",
        classes:
          "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
        label: "Delivered",
      },
      processing: {
        dot: "bg-amber-500 animate-pulse",
        classes:
          "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25",
        label: "Processing",
      },
      failed: {
        dot: "bg-red-500",
        classes:
          "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/25",
        label: "Failed",
      },
      refunded: {
        dot: "bg-muted-foreground/50",
        classes: "bg-muted text-muted-foreground border-border",
        label: "Refunded",
      },
    };
    const c = configs[status] ?? {
      dot: "bg-muted-foreground/40",
      classes: "bg-muted text-muted-foreground border-border",
      label: status,
    };
    return (
      <span
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${c.classes}`}
      >
        <span className={`size-1.5 rounded-full ${c.dot}`} />
        {c.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* ── 1. PAGE HEADER ── */}
      <div className="flex flex-col items-start justify-between gap-4 border-b border-border pb-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-foreground">
            <GraduationCap className="size-6 text-purple-600" />
            <span>Results Checker Desk</span>
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Manage WAEC &amp; BECE voucher pricing, stock levels, and order
            fulfilment.
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
            className="text-xs font-bold shadow-xs gap-1.5 h-9"
          >
            <Download className="size-4" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* ── 2. STATS TILES ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-purple-500/10">
              <GraduationCap className="size-3.5 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Checker Types
            </span>
          </div>
          <p className="mt-2 text-xl font-black tabular-nums text-foreground">
            {checkers.length}
          </p>
          <p className="text-[10px] text-muted-foreground font-medium">
            WAEC, BECE available
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10">
              <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Vouchers Sold
            </span>
          </div>
          <p className="mt-2 text-xl font-black tabular-nums text-emerald-600 dark:text-emerald-400">
            {stats.totalSold}
          </p>
          <p className="text-[10px] text-muted-foreground font-medium">
            Successfully delivered
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10">
              <Clock className="size-3.5 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Processing
            </span>
          </div>
          <p className="mt-2 text-xl font-black tabular-nums text-amber-600 dark:text-amber-400">
            {stats.processing}
          </p>
          <p className="text-[10px] text-muted-foreground font-medium">
            Awaiting fulfilment
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
              <TrendingUp className="size-3.5 text-primary" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Revenue
            </span>
          </div>
          <p className="mt-2 text-xl font-black tabular-nums text-foreground">
            GH₵ {stats.totalRevenue.toFixed(2)}
          </p>
          <p className="text-[10px] text-muted-foreground font-medium">
            From delivered orders
          </p>
        </div>
      </div>

      {/* ── 4. ORDERS TABLE (filters + table merged into one Card — AdminPayouts pattern) ── */}
      <Card className="border-border shadow-xs">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base font-extrabold text-foreground">
                <Package className="size-5 text-purple-600" />
                <span>Voucher Orders &amp; Fulfilment Desk</span>
              </CardTitle>
              <CardDescription className="mt-1 text-xs">
                All WAEC &amp; BECE checker orders. Orders stuck in "Processing"
                need a serial &amp; PIN entered manually.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        {/* Search + Filters */}
        <div className="border-b border-border bg-muted/20 p-4 space-y-4">
          <div className="space-y-1.5">
            <Label
              htmlFor="checker-search"
              className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
            >
              Search checker orders
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="checker-search"
                type="text"
                placeholder="Reference, product, phone, or serial..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-10 bg-background pl-9 text-xs"
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

          <div className="rounded-xl border border-border bg-background p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="size-3.5 text-muted-foreground" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Order filters
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
                  Reset filters
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1.5">
                <Label
                  htmlFor="filter-status"
                  className="text-[10px] font-semibold text-muted-foreground"
                >
                  Order status
                </Label>
                <Select
                  value={statusFilter}
                  onValueChange={(v) => {
                    setStatusFilter(v);
                    setCurrentPage(1);
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
                      All statuses ({checkerOrders.length})
                    </SelectItem>
                    <SelectItem value="delivered">
                      Delivered (
                      {
                        checkerOrders.filter((o) => o.status === "delivered")
                          .length
                      }
                      )
                    </SelectItem>
                    <SelectItem value="processing">
                      Processing ({stats.processing})
                    </SelectItem>
                    <SelectItem value="failed">
                      Failed (
                      {
                        checkerOrders.filter((o) => o.status === "failed")
                          .length
                      }
                      )
                    </SelectItem>
                    <SelectItem value="refunded">
                      Refunded (
                      {
                        checkerOrders.filter((o) => o.status === "refunded")
                          .length
                      }
                      )
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="filter-product"
                  className="text-[10px] font-semibold text-muted-foreground"
                >
                  Checker type
                </Label>
                <Select
                  value={productFilter}
                  onValueChange={(v) => {
                    setProductFilter(v);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger
                    id="filter-product"
                    className="h-9 w-full text-xs"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All checker types</SelectItem>
                    {checkers.map((c) => (
                      <SelectItem key={c.id} value={c.examBody}>
                        {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border bg-muted/40 hover:bg-muted/40">
                  <TableHead className="h-10 px-4 text-[10px] font-bold uppercase text-muted-foreground">
                    Reference
                  </TableHead>
                  <TableHead className="h-10 px-4 text-[10px] font-bold uppercase text-muted-foreground">
                    Product
                  </TableHead>
                  <TableHead className="h-10 px-4 text-[10px] font-bold uppercase text-muted-foreground">
                    Recipient
                  </TableHead>
                  <TableHead className="h-10 px-4 text-[10px] font-bold uppercase text-muted-foreground">
                    Voucher
                  </TableHead>
                  <TableHead className="h-10 px-4 text-right text-[10px] font-bold uppercase text-muted-foreground">
                    Paid
                  </TableHead>
                  <TableHead className="h-10 px-4 text-center text-[10px] font-bold uppercase text-muted-foreground">
                    Status
                  </TableHead>
                  <TableHead className="h-10 px-4 text-right text-[10px] font-bold uppercase text-muted-foreground">
                    When
                  </TableHead>
                  <TableHead className="h-10 px-4 text-right text-[10px] font-bold uppercase text-muted-foreground">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/60">
                {paginatedOrders.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="h-40 text-center text-muted-foreground"
                    >
                      <div className="flex flex-col items-center justify-center py-8 gap-2">
                        <div className="size-10 rounded-full bg-muted flex items-center justify-center">
                          <Ticket className="size-5 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-semibold text-foreground">
                          {checkerOrders.length === 0
                            ? "No checker orders yet."
                            : "No orders match your filters."}
                        </p>
                        {isFiltered && (
                          <Button
                            variant="ghost"
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
                  paginatedOrders.map((order) => (
                    <TableRow
                      key={order.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      {/* Reference */}
                      <TableCell className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-primary">
                            {order.reference}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleCopyRef(order.reference, e)}
                            className="text-muted-foreground hover:text-foreground cursor-pointer p-0.5 rounded"
                            title="Copy"
                          >
                            {copiedRef === order.reference ? (
                              <Check className="size-3 text-emerald-500" />
                            ) : (
                              <Copy className="size-3" />
                            )}
                          </button>
                        </div>
                      </TableCell>

                      {/* Product */}
                      <TableCell className="py-3.5 px-4">
                        <span className="font-bold text-xs text-foreground">
                          {order.productName}
                        </span>
                      </TableCell>

                      {/* Recipient */}
                      <TableCell className="py-3.5 px-4">
                        <span className="text-xs text-muted-foreground">
                          {order.recipientPhone}
                        </span>
                      </TableCell>

                      {/* Voucher serial/PIN */}
                      <TableCell className="py-3.5 px-4">
                        {order.voucherSerial ? (
                          <div>
                            <div className="text-[11px] font-bold text-foreground">
                              {order.voucherSerial}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              •••• - •••• - ••••
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">
                            —
                          </span>
                        )}
                      </TableCell>

                      {/* Paid */}
                      <TableCell className="py-3.5 px-4 text-right">
                        <span className="font-extrabold text-xs tabular-nums text-foreground">
                          GH₵ {order.amount.toFixed(2)}
                        </span>
                      </TableCell>

                      {/* Status */}
                      <TableCell className="py-3.5 px-4 text-center">
                        {getStatusPill(order.status)}
                      </TableCell>

                      {/* When */}
                      <TableCell className="py-3.5 px-4 text-right text-xs text-muted-foreground whitespace-nowrap tabular-nums">
                        {formatDate(order.date)}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="py-3.5 px-4 text-right whitespace-nowrap">
                        {order.status === "processing" ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2.5 text-[11px] font-semibold text-destructive hover:bg-destructive/10 border-destructive/20 cursor-pointer"
                              onClick={() => {
                                // For the demo app, processing → failed simulates a refund
                              }}
                            >
                              Refund
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => {
                                setFulfillOrder(order);
                                setFulfillSerial(order.voucherSerial || "");
                                setFulfillPin(order.voucherCode || "");
                              }}
                              className="h-7 px-2.5 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1 shadow-2xs cursor-pointer"
                            >
                              <Send className="size-3" />
                              <span>Deliver</span>
                            </Button>
                          </div>
                        ) : order.status === "delivered" ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setFulfillOrder(order);
                              setFulfillSerial(order.voucherSerial || "");
                              setFulfillPin(order.voucherCode || "");
                            }}
                            className="h-7 px-2 text-[11px] font-medium text-muted-foreground hover:text-foreground gap-1 cursor-pointer"
                          >
                            <Eye className="size-3" />
                            <span>View</span>
                          </Button>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">
                            —
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Showing{" "}
              <span className="font-bold text-foreground">
                {filteredOrders.length === 0
                  ? 0
                  : Math.min(
                      currentPage * ITEMS_PER_PAGE,
                      filteredOrders.length,
                    )}
              </span>{" "}
              of{" "}
              <span className="font-bold text-foreground">
                {filteredOrders.length}
              </span>{" "}
              orders
            </p>
            {totalPages > 1 && (
              <Pagination className="w-auto mx-0">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className={`cursor-pointer h-8 text-xs ${currentPage === 1 ? "pointer-events-none opacity-50" : ""}`}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(
                      (p) =>
                        p === 1 ||
                        p === totalPages ||
                        Math.abs(p - currentPage) <= 1,
                    )
                    .map((page, idx, arr) => (
                      <React.Fragment key={page}>
                        {idx > 0 && arr[idx - 1] !== page - 1 && (
                          <PaginationItem>
                            <span className="px-2 text-xs text-muted-foreground">
                              ...
                            </span>
                          </PaginationItem>
                        )}
                        <PaginationItem>
                          <PaginationLink
                            isActive={currentPage === page}
                            onClick={() => setCurrentPage(page)}
                            className="cursor-pointer h-8 text-xs"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      </React.Fragment>
                    ))}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      className={`cursor-pointer h-8 text-xs ${currentPage === totalPages ? "pointer-events-none opacity-50" : ""}`}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── 5. DELIVER / VIEW VOUCHER MODAL ── */}
      <Dialog
        open={!!fulfillOrder}
        onOpenChange={(open) => {
          if (!open) {
            setFulfillOrder(null);
            setFulfillSerial("");
            setFulfillPin("");
            setPinVisible(false);
          }
        }}
      >
        <DialogContent className="flex max-h-[90vh] sm:max-w-md flex-col gap-0 overflow-hidden rounded-3xl border border-border bg-card p-0 shadow-2xl">
          <DialogHeader className="relative shrink-0 overflow-hidden border-b border-border bg-gradient-to-br from-purple-500/10 via-card to-amber-500/10 p-5 sm:p-6">
            <div className="absolute -right-12 -top-12 size-32 rounded-full bg-primary/5" />
            <div className="relative flex items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-purple-600 text-white shadow-sm">
                <Ticket className="size-5" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-left text-base font-extrabold tracking-tight">
                  {fulfillOrder?.status === "processing"
                    ? "Deliver Voucher"
                    : "Voucher Details"}
                </DialogTitle>
                <DialogDescription className="mt-0.5 text-left text-xs font-mono">
                  {fulfillOrder?.reference}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {fulfillOrder && (
            <div className="p-5 sm:p-6 space-y-4">
              <div className="p-4 rounded-2xl bg-muted/30 border border-border text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Product</span>
                  <span className="font-bold text-foreground">
                    {fulfillOrder.productName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Recipient</span>
                  <span className="font-bold text-foreground">
                    {fulfillOrder.recipientPhone}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount paid</span>
                  <span className="font-extrabold text-foreground tabular-nums">
                    GH₵ {fulfillOrder.amount.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="fulfill-serial"
                  className="text-[11px] font-semibold"
                >
                  Serial number
                </Label>
                <Input
                  id="fulfill-serial"
                  type="text"
                  placeholder="e.g. W26-123456"
                  value={fulfillSerial}
                  onChange={(e) => setFulfillSerial(e.target.value)}
                  className="h-10 text-sm"
                  readOnly={fulfillOrder.status !== "processing"}
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="fulfill-pin"
                  className="text-[11px] font-semibold"
                >
                  Voucher PIN
                </Label>
                <div className="relative">
                  <Input
                    id="fulfill-pin"
                    type={pinVisible ? "text" : "password"}
                    placeholder="e.g. 1234-5678-9012"
                    value={fulfillPin}
                    onChange={(e) => setFulfillPin(e.target.value)}
                    className="h-10 text-sm pr-10"
                    readOnly={fulfillOrder.status !== "processing"}
                  />
                  <button
                    type="button"
                    onClick={() => setPinVisible((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {pinVisible ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              {fulfillOrder.status === "processing" && (
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Copy the serial and PIN from your DataHub portal and paste
                  them above. The buyer receives them by SMS instantly.
                </p>
              )}
            </div>
          )}

          <DialogFooter className="border-t border-border bg-muted/30 p-4 sm:flex-row sm:justify-between gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFulfillOrder(null)}
              className="text-xs cursor-pointer"
            >
              Close
            </Button>
            {fulfillOrder?.status === "processing" && (
              <Button
                size="sm"
                disabled={!fulfillSerial.trim() || !fulfillPin.trim()}
                className="text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                onClick={() => setFulfillOrder(null)}
              >
                <Send className="size-3.5" />
                <span>Send voucher by SMS</span>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

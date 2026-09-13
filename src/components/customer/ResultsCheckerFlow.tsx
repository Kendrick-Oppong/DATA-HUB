import React, { useState, useEffect } from "react";
import {
  GraduationCap,
  CheckCircle2,
  Copy,
  Check,
  Eye,
  EyeOff,
  ExternalLink,
  ArrowRight,
  Search,
  Ticket,
} from "lucide-react";
import { ResultCheckerProduct, Order } from "../../types";
import { SignalRail } from "../common/SignalRail";
import { Button, buttonVariants } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
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
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../ui/pagination";

interface ResultsCheckerFlowProps {
  checkers: ResultCheckerProduct[];
  walletBalance: number;
  orders?: Order[];
  onOrderCreated: (order: Order) => void;
  onOpenReceipt: (order: Order) => void;
}

// Date-time formatter for the "When" column (e.g. "2026-09-12 19:44")
const formatDateTime = (dateStr: string): string => {
  if (!dateStr) return "";
  const d = new Date(
    dateStr.includes("T") ? dateStr : dateStr.replace(" ", "T"),
  );
  if (isNaN(d.getTime())) return dateStr;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const mins = String(d.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${mins}`;
};

export const ResultsCheckerFlow: React.FC<ResultsCheckerFlowProps> = ({
  checkers,
  walletBalance,
  orders = [],
  onOrderCreated,
  onOpenReceipt,
}) => {
  const checkerStatusConfig = {
    delivered: {
      label: "Delivered",
      dot: "bg-emerald-500",
      className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    },
    processing: {
      label: "Processing",
      dot: "bg-amber-500",
      className: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
    },
    failed: {
      label: "Failed",
      dot: "bg-red-500",
      className: "bg-red-500/15 text-red-600 dark:text-red-400",
    },
  } as const;
  const CHECKERS_PER_PAGE = 5;

  const [selectedCheckerId, setSelectedCheckerId] = useState<string>(
    checkers[0]?.id || "waec-wassce",
  );
  const [quantityInput, setQuantityInput] = useState<string>("1");
  const [recipientPhone, setRecipientPhone] = useState<string>("0244192834");
  const [purchasedOrder, setPurchasedOrder] = useState<Order | null>(null);
  const [revealed, setRevealed] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const [checkerStatus, setCheckerStatus] = useState("all");

  // Checker Orders Table State
  const [checkerSearch, setCheckerSearch] = useState("");
  const [checkerPage, setCheckerPage] = useState(1);

  // Voucher View Dialog State
  const [voucherViewOrder, setVoucherViewOrder] = useState<Order | null>(null);
  const [dialogRevealed, setDialogRevealed] = useState(false);
  const [voucherCopied, setVoucherCopied] = useState(false);

  const currentChecker =
    checkers.find((c) => c.id === selectedCheckerId) || checkers[0];

  // Manual quantity with safe clamping (1 - 99)
  const parsedQty = parseInt(quantityInput, 10);
  const quantity =
    isNaN(parsedQty) || parsedQty < 1 ? 1 : Math.min(parsedQty, 99);
  const totalPrice = Number((currentChecker.price * quantity).toFixed(2));

  // Reset pagination when search changes
  useEffect(() => {
    setCheckerPage(1);
  }, [checkerSearch, checkerStatus]);

  // All checker orders (search-filtered, newest first)
  const allCheckerOrders = orders.filter((o) => o.serviceType === "checker");
  const checkerOrders = allCheckerOrders
    .filter((o) => {
      const q = checkerSearch.toLowerCase().trim();

      const matchesSearch =
        !q ||
        o.reference.toLowerCase().includes(q) ||
        o.productName.toLowerCase().includes(q) ||
        o.recipientPhone.includes(q) ||
        (o.voucherSerial || "").toLowerCase().includes(q);

      const matchesStatus =
        checkerStatus === "all" || o.status === checkerStatus;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalCheckerPages = Math.max(
    1,
    Math.ceil(checkerOrders.length / CHECKERS_PER_PAGE),
  );
  const paginatedCheckerOrders = checkerOrders.slice(
    (checkerPage - 1) * CHECKERS_PER_PAGE,
    checkerPage * CHECKERS_PER_PAGE,
  );

  const handlePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (walletBalance < totalPrice) {
      alert("Insufficient wallet balance. Please fund your wallet.");
      return;
    }
    if (quantity > currentChecker.stockCount) {
      alert(
        `Only ${currentChecker.stockCount} vouchers left in stock for ${currentChecker.title}.`,
      );
      return;
    }

    const ref = `CHK-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const randomSerial = `W26-${Math.floor(100000 + Math.random() * 900000)}`;
    const randomPin = `${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder: Order = {
      id: `ord-chk-${Date.now()}`,
      reference: ref,
      date: new Date().toISOString().replace("T", " ").slice(0, 16),
      customerName: "Kojo Mensah",
      recipientPhone,
      network: "MTN",
      serviceType: "checker",
      productName:
        quantity > 1
          ? `${currentChecker.title} (${quantity}x)`
          : currentChecker.title,
      amount: totalPrice,
      paymentMethod: "wallet",
      status: "delivered",
      voucherSerial: randomSerial,
      voucherCode: randomPin,
      deliveryTimeline: [
        { step: "Order Placed", timestamp: "10:00:01", status: "completed" },
        {
          step: "Voucher Allocated",
          timestamp: "10:00:03",
          status: "completed",
          note: "Authentic WAEC stock",
        },
        {
          step: "SMS Dispatched",
          timestamp: "10:00:06",
          status: "completed",
          note: `Sent to ${recipientPhone}`,
        },
      ],
    };

    onOrderCreated(newOrder);
    setPurchasedOrder(newOrder);
  };

  const buildVoucherText = (order: Order) =>
    `Smart Data Hub Voucher\n${order.productName}\nSerial: ${order.voucherSerial}\nPIN: ${order.voucherCode}\nCheck on: https://ghana.waecdirect.org`;

  const handleCopyVoucher = () => {
    if (!purchasedOrder) return;
    navigator.clipboard.writeText(buildVoucherText(purchasedOrder));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyDialogVoucher = () => {
    if (!voucherViewOrder) return;
    navigator.clipboard.writeText(buildVoucherText(voucherViewOrder));
    setVoucherCopied(true);
    setTimeout(() => setVoucherCopied(false), 2000);
  };

  const openVoucherDialog = (order: Order) => {
    setVoucherViewOrder(order);
    setDialogRevealed(false);
    setVoucherCopied(false);
  };

  // Pagination renderer — identical to CustomerWalletOrders
  const renderPagination = (
    currentPage: number,
    totalPages: number,
    setPage: (page: number) => void,
  ) => {
    if (totalPages <= 1) return null;

    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      for (
        let i = Math.max(2, currentPage - 1);
        i <= Math.min(totalPages - 1, currentPage + 1);
        i++
      ) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }

    return (
      <Pagination className="pt-4">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => setPage(Math.max(1, currentPage - 1))}
              className={
                currentPage === 1
                  ? "pointer-events-none opacity-50"
                  : "cursor-pointer"
              }
            />
          </PaginationItem>
          {pages.map((p, idx) =>
            p === "..." ? (
              <PaginationItem key={`dots-${idx}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={p}>
                <PaginationLink
                  onClick={() => setPage(p as number)}
                  isActive={currentPage === p}
                  className="cursor-pointer"
                >
                  {p}
                </PaginationLink>
              </PaginationItem>
            ),
          )}
          <PaginationItem>
            <PaginationNext
              onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
              className={
                currentPage === totalPages
                  ? "pointer-events-none opacity-50"
                  : "cursor-pointer"
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-purple-600" />
            <span>Results Checkers & Admission Vouchers</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Instant delivery of authentic WAEC, BECE Placement, and University
            application scratch codes.
          </p>
        </div>
        <SignalRail status="online" size="sm" label="WAEC Server Sync" />
      </div>

      {!purchasedOrder ? (
        <form onSubmit={handlePurchase} className="space-y-6">
          {/* Voucher Catalog Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {checkers.map((item) => {
              const isSelected = selectedCheckerId === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedCheckerId(item.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? "border-primary bg-primary/10 ring-2 ring-primary/30 shadow-xs"
                      : "border-border bg-card hover:bg-muted/50"
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-muted text-foreground">
                        {item.examBody}
                      </span>
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        {item.stockCount} in stock
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-foreground">
                      {item.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {item.description}
                    </p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-border flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">
                      Unit Price:
                    </span>
                    <span className="text-base font-black text-foreground tabular-nums">
                      GH₵ {item.price.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Purchase Details */}
          <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-border bg-muted/30">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Voucher details
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Choose how many vouchers you need and where to send them.
                  </p>
                </div>

                <div className="text-xs font-semibold text-muted-foreground tabular-nums">
                  GH₵ {currentChecker.price.toFixed(2)} each
                </div>
              </div>
            </div>

            <div className="p-5 space-y-6">
              {/* Quantity */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Number of vouchers
                  </Label>

                  <span className="text-xs font-semibold text-primary tabular-nums">
                    {quantity} voucher{quantity !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Quick quantity presets */}
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 5, 10].map((qty) => (
                    <Button
                      key={qty}
                      type="button"
                      variant={quantity === qty ? "default" : "outline"}
                      onClick={() => setQuantityInput(String(qty))}
                      className="h-10 rounded-xl font-bold text-xs"
                    >
                      {qty}
                    </Button>
                  ))}
                </div>

                {/* Custom quantity */}
                <div className="space-y-2">
                  <Label
                    htmlFor="custom-quantity"
                    className="text-[11px] font-semibold text-muted-foreground"
                  >
                    Or enter a custom quantity
                  </Label>

                  <Input
                    id="custom-quantity"
                    type="number"
                    min={1}
                    max={99}
                    value={quantityInput}
                    onChange={(e) => setQuantityInput(e.target.value)}
                    placeholder="Enter quantity"
                    className="h-10 rounded-xl text-sm font-medium tabular-nums"
                  />
                </div>

                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Choose a preset above or enter any quantity from 1 to 99.
                </p>
              </div>

              {/* Phone */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <Label
                    htmlFor="checker-phone"
                    className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                  >
                    Delivery phone number
                  </Label>

                  <span className="text-[10px] font-medium text-muted-foreground">
                    SMS delivery
                  </span>
                </div>

                <Input
                  id="checker-phone"
                  type="tel"
                  required
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  placeholder="024 419 2834"
                  className="h-11 rounded-xl text-sm font-medium tabular-nums"
                />

                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Your voucher details will be sent to this number after
                  payment.
                </p>
              </div>
            </div>

            {/* Summary */}
            <div className="border-t border-border bg-muted/20 px-5 py-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Total amount
                  </p>

                  <div className="mt-0.5 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-foreground tabular-nums">
                      GH₵ {totalPrice.toFixed(2)}
                    </span>

                    <span className="text-xs font-medium text-muted-foreground">
                      for {quantity} voucher{quantity !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="h-9 w-full sm:w-auto px-4 font-bold shadow-sm"
                >
                  Pay & Reveal Voucher
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        /* Masked Voucher Card Result */
        <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              <div>
                <h3 className="font-bold text-base text-foreground">
                  Voucher Purchased & Verified
                </h3>
                <p className="text-xs text-muted-foreground">
                  Order Ref: {purchasedOrder.reference}
                </p>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold">
              Ready for WAEC
            </span>
          </div>

          {/* Sealed Security Scratch Card UI */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/15 via-muted/60 to-purple-500/15 border border-border space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Authentic E-Voucher Card
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRevealed(!revealed)}
                className="text-xs font-semibold"
              >
                {revealed ? (
                  <EyeOff className="w-3.5 h-3.5 mr-1.5" />
                ) : (
                  <Eye className="w-3.5 h-3.5 mr-1.5" />
                )}
                <span>{revealed ? "Mask Code" : "Reveal PIN"}</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 bg-card rounded-xl border border-border">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                  Serial Number:
                </span>
                <span className="font-mono text-base font-extrabold text-foreground tabular-nums">
                  {purchasedOrder.voucherSerial}
                </span>
              </div>

              <div className="p-3 bg-card rounded-xl border border-border">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                  Voucher PIN:
                </span>
                <span className="font-mono text-base font-extrabold text-primary tracking-wider tabular-nums">
                  {revealed ? purchasedOrder.voucherCode : "•••• - •••• - ••••"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyVoucher}
              className="flex-1"
            >
              {copied ? (
                <Check className="w-4 h-4 mr-2 text-emerald-500" />
              ) : (
                <Copy className="w-4 h-4 mr-2" />
              )}
              <span>
                {copied ? "Copied to Clipboard" : "Copy Serial & PIN"}
              </span>
            </Button>

            <a
              href="https://ghana.waecdirect.org"
              target="_blank"
              rel="noreferrer"
              className={`${buttonVariants({ variant: "default" })} flex-1 bg-primary`}
            >
              <span>Check on WAEC Portal</span>
              <ExternalLink className="w-3.5 h-3.5 ml-2" />
            </a>

            <Button
              onClick={() => {
                setPurchasedOrder(null);
                setRevealed(false);
              }}
            >
              Buy Another
            </Button>
          </div>
        </div>
      )}

      {/* ============ MY CHECKER ORDERS TABLE ============ */}
      <Card className="border-border shadow-xs">
        <CardHeader className="pb-3 border-b border-border">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-base font-extrabold text-foreground flex items-center gap-2">
                <span>My Checker Orders</span>
              </CardTitle>

              <CardDescription className="text-xs">
                Authentic WAEC / BECE voucher purchases with serial & PIN
                retrieval.
              </CardDescription>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
              {/* Search */}
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />

                <Input
                  type="text"
                  placeholder="Search ref, product, phone..."
                  value={checkerSearch}
                  onChange={(e) => setCheckerSearch(e.target.value)}
                  className="h-9 pl-8 text-xs"
                />
              </div>

              {/* Status filter */}
              <Select value={checkerStatus} onValueChange={setCheckerStatus}>
                <SelectTrigger className="!h-9 w-full sm:w-36 text-xs">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Send To</TableHead>
                <TableHead>Voucher</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCheckerOrders.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-10 text-muted-foreground"
                  >
                    <div className="flex flex-col items-center justify-center space-y-2">
                      {checkerSearch ? (
                        <Search className="w-8 h-8 text-muted-foreground/40" />
                      ) : (
                        <Ticket className="w-8 h-8 text-muted-foreground/40" />
                      )}
                      <p className="text-sm font-bold text-foreground">
                        {checkerSearch
                          ? "No matching checker orders"
                          : "No checker orders yet"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {checkerSearch
                          ? "Try a different reference, product, or phone number."
                          : "Purchase a result checker above to see it here."}
                      </p>
                      {checkerSearch && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCheckerSearch("")}
                          className="mt-2 text-xs"
                        >
                          Clear Search
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCheckerOrders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-muted/40">
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {order.reference}
                    </TableCell>
                    <TableCell className="font-bold text-xs text-foreground">
                      {order.productName}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {order.recipientPhone}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openVoucherDialog(order)}
                        className="rounded-full h-8 px-3 text-xs font-semibold"
                      >
                        <Ticket className="w-3.5 h-3.5 mr-1.5" />
                        View & copy
                      </Button>
                    </TableCell>
                    <TableCell className="text-right font-black text-foreground tabular-nums text-xs">
                      GH₵ {order.amount.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center">
                      {(() => {
                        const cfg =
                          checkerStatusConfig[
                            order.status as keyof typeof checkerStatusConfig
                          ] ?? checkerStatusConfig.delivered;
                        return (
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${cfg.className}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}
                            />
                            {cfg.label}
                          </span>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground tabular-nums">
                      {formatDateTime(order.date)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination footer — count left, controls right (same as CustomerWalletOrders) */}
          <div className="flex items-center justify-between gap-4 border-t border-border px-4 py-3">
            <span className="text-xs text-muted-foreground shrink-0">
              Showing{" "}
              <span className="font-bold text-foreground">
                {Math.min(
                  checkerPage * CHECKERS_PER_PAGE,
                  checkerOrders.length,
                )}
              </span>{" "}
              of{" "}
              <span className="font-bold text-foreground">
                {checkerOrders.length}
              </span>{" "}
              checker orders
            </span>
            {checkerOrders.length > CHECKERS_PER_PAGE && (
              <div className="flex justify-end">
                {renderPagination(
                  checkerPage,
                  totalCheckerPages,
                  setCheckerPage,
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ============ VOUCHER VIEW & COPY DIALOG ============ */}
      <Dialog
        open={!!voucherViewOrder}
        onOpenChange={(open) => {
          if (!open) setVoucherViewOrder(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ticket className="w-4 h-4 text-primary" />
              <span>Voucher Serial & PIN</span>
            </DialogTitle>
            <DialogDescription>
              Order{" "}
              <span className="font-mono font-bold text-foreground">
                {voucherViewOrder?.reference}
              </span>{" "}
            </DialogDescription>
          </DialogHeader>

          {voucherViewOrder && (
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-muted/40 border border-border flex justify-between items-center">
                <span className="text-muted-foreground">Product:</span>
                <span className="font-bold text-foreground">
                  {voucherViewOrder.productName}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-muted/40 border border-border flex justify-between items-center">
                <span className="text-muted-foreground">Serial Number:</span>
                <span className="font-mono font-extrabold text-foreground tabular-nums">
                  {voucherViewOrder.voucherSerial}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex justify-between items-center gap-2">
                <span className="text-primary font-semibold">Voucher PIN:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-extrabold text-primary tracking-wider tabular-nums">
                    {dialogRevealed
                      ? voucherViewOrder.voucherCode
                      : "•••• - •••• - ••••"}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDialogRevealed(!dialogRevealed)}
                    className="h-7 w-7 p-0 text-primary"
                    title={dialogRevealed ? "Mask PIN" : "Reveal PIN"}
                  >
                    {dialogRevealed ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyDialogVoucher}
            >
              {voucherCopied ? (
                <Check className="w-4 h-4 mr-1.5 text-emerald-500" />
              ) : (
                <Copy className="w-4 h-4 mr-1.5" />
              )}
              {voucherCopied ? "Copied" : "Copy Serial & PIN"}
            </Button>
            <Button size="sm" onClick={() => setVoucherViewOrder(null)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

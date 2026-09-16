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
  Plus,
  SlidersHorizontal,
  ShieldCheck,
  RotateCcw,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import { ResultCheckerProduct, Order } from "../../types";
import { Button, buttonVariants } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
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

interface AgentResultsCheckerFlowProps {
  checkers: ResultCheckerProduct[];
  walletBalance: number;
  orders?: Order[];
  onOrderCreated: (order: Order) => void;
  onOpenReceipt: (order: Order) => void;
}

const AGENT_COMMISSION = 5.0; // GH₵5 per voucher sold

const formatDateTime = (dateStr: string): string => {
  if (!dateStr) return "";
  const d = new Date(dateStr.includes("T") ? dateStr : dateStr.replace(" ", "T"));
  if (isNaN(d.getTime())) return dateStr;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const mins = String(d.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${mins}`;
};

export const AgentResultsCheckerFlow: React.FC<AgentResultsCheckerFlowProps> = ({
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
  const [recipientPhone, setRecipientPhone] = useState<string>("");
  const [purchasedOrder, setPurchasedOrder] = useState<Order | null>(null);
  const [revealed, setRevealed] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [checkerStatus, setCheckerStatus] = useState("all");
  const [checkerSearch, setCheckerSearch] = useState("");
  const [checkerPage, setCheckerPage] = useState(1);
  const [voucherViewOrder, setVoucherViewOrder] = useState<Order | null>(null);
  const [dialogRevealed, setDialogRevealed] = useState(false);
  const [voucherCopied, setVoucherCopied] = useState(false);
  const [isBuyCheckerOpen, setIsBuyCheckerOpen] = useState(false);

  const currentChecker = checkers.find((c) => c.id === selectedCheckerId) || checkers[0];

  const parsedQty = parseInt(quantityInput, 10);
  const quantity = isNaN(parsedQty) || parsedQty < 1 ? 1 : Math.min(parsedQty, 99);

  // Agent pays wholesale (or retail if no wholesale set), earns commission
  const agentUnitCost = currentChecker?.wholesalePrice ?? currentChecker?.price ?? 0;
  const retailUnitPrice = currentChecker?.price ?? 0;
  const commissionPerUnit = retailUnitPrice - agentUnitCost;
  const totalAgentCost = Number((agentUnitCost * quantity).toFixed(2));
  const totalCommission = Number((commissionPerUnit * quantity).toFixed(2));

  useEffect(() => {
    setCheckerPage(1);
  }, [checkerSearch, checkerStatus]);

  const allCheckerOrders = orders.filter((o) => o.serviceType === "checker");

  // Stats derived from orders
  const deliveredOrders = allCheckerOrders.filter((o) => o.status === "delivered");
  const vouchersSold = deliveredOrders.length;
  const commissionEarned = deliveredOrders.reduce(
    (sum, o) => sum + (o.agentMargin ?? AGENT_COMMISSION),
    0,
  );

  const checkerOrders = allCheckerOrders
    .filter((o) => {
      const q = checkerSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        o.reference.toLowerCase().includes(q) ||
        o.productName.toLowerCase().includes(q) ||
        o.recipientPhone.includes(q) ||
        (o.voucherSerial || "").toLowerCase().includes(q);
      const matchesStatus = checkerStatus === "all" || o.status === checkerStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalCheckerPages = Math.max(1, Math.ceil(checkerOrders.length / CHECKERS_PER_PAGE));
  const paginatedCheckerOrders = checkerOrders.slice(
    (checkerPage - 1) * CHECKERS_PER_PAGE,
    checkerPage * CHECKERS_PER_PAGE,
  );

  const handlePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (walletBalance < totalAgentCost) {
      alert("Insufficient wallet balance. Please fund your wallet.");
      return;
    }
    if (quantity > currentChecker.stockCount) {
      alert(`Only ${currentChecker.stockCount} vouchers left in stock for ${currentChecker.title}.`);
      return;
    }

    const ref = `CHK-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const randomSerial = `W26-${Math.floor(100000 + Math.random() * 900000)}`;
    const randomPin = `${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder: Order = {
      id: `ord-chk-${Date.now()}`,
      reference: ref,
      date: new Date().toISOString().replace("T", " ").slice(0, 16),
      customerName: "Agent Purchase",
      recipientPhone,
      network: "MTN",
      serviceType: "checker",
      productName: quantity > 1 ? `${currentChecker.title} (${quantity}x)` : currentChecker.title,
      amount: totalAgentCost,
      paymentMethod: "wallet",
      status: "delivered",
      agentMargin: totalCommission,
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
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
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
              className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
          {pages.map((p, idx) =>
            p === "..." ? (
              <PaginationItem key={`dots-${idx}`}><PaginationEllipsis /></PaginationItem>
            ) : (
              <PaginationItem key={p}>
                <PaginationLink onClick={() => setPage(p as number)} isActive={currentPage === p} className="cursor-pointer">
                  {p}
                </PaginationLink>
              </PaginationItem>
            ),
          )}
          <PaginationItem>
            <PaginationNext
              onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
              className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col items-start justify-between gap-4 border-b border-border pb-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-foreground">
            <GraduationCap className="size-6 text-purple-600" />
            <span>Results Checkers & Admission Vouchers</span>
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Sell authentic WAEC and BECE vouchers. You pay wholesale and earn GH₵{AGENT_COMMISSION.toFixed(2)} commission per voucher delivered.
          </p>
        </div>
        <Button onClick={() => setIsBuyCheckerOpen(true)} className="text-xs font-bold shadow-sm cursor-pointer">
          <Plus className="size-4 stroke-3" />
          Sell a Voucher
        </Button>
      </div>

      {/* Agent pricing banner */}
      <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
        <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <span className="text-emerald-800 dark:text-emerald-300">
          <span className="font-bold">Agent pricing active.</span> You pay GH₵{(checkers[0]?.wholesalePrice ?? 18).toFixed(2)} wholesale per voucher (retail GH₵{(checkers[0]?.price ?? 23).toFixed(2)}) and earn{" "}
          <span className="font-bold">+GH₵{AGENT_COMMISSION.toFixed(2)} commission</span> on every voucher delivered.
        </span>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
              <Ticket className="size-3.5 text-primary" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Vouchers Sold
            </span>
          </div>
          <p className="mt-2 text-xl font-black tabular-nums text-foreground">{vouchersSold}</p>
          <p className="text-[10px] text-muted-foreground font-medium">Delivered to customers</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10">
              <DollarSign className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Commission
            </span>
          </div>
          <p className="mt-2 text-xl font-black tabular-nums text-emerald-600 dark:text-emerald-400">
            +GH₵ {commissionEarned.toFixed(2)}
          </p>
          <p className="text-[10px] text-muted-foreground font-medium">GH₵{AGENT_COMMISSION.toFixed(2)} per voucher</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-purple-500/10">
              <GraduationCap className="size-3.5 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Products
            </span>
          </div>
          <p className="mt-2 text-xl font-black tabular-nums text-foreground">{checkers.length}</p>
          <p className="text-[10px] text-muted-foreground font-medium">WAEC, BECE available</p>
        </div>
      </div>

      {/* ============ SELL VOUCHER MODAL ============ */}
      <Dialog open={isBuyCheckerOpen} onOpenChange={setIsBuyCheckerOpen}>
        <DialogContent className="flex h-[90vh] max-h-[90vh] sm:max-w-xl flex-col gap-0 overflow-hidden rounded-3xl border border-border bg-card p-0 shadow-2xl">
          {/* Header */}
          <DialogHeader className="relative shrink-0 overflow-hidden border-b border-border bg-gradient-to-br from-primary/10 via-card to-amber-500/10 p-5 sm:p-6">
            <div className="absolute -right-12 -top-12 size-32 rounded-full bg-primary/5" />
            <div className="absolute -bottom-16 left-1/3 size-40 rounded-full bg-amber-500/5" />
            <div className="relative flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                  <Ticket className="size-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <DialogTitle className="text-left text-base font-extrabold tracking-tight">
                      Sell Result Checker Voucher
                    </DialogTitle>
                    <Badge variant="secondary" className="border-emerald-500/20 bg-emerald-500/15 px-2 py-0 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                      Agent Pricing
                    </Badge>
                  </div>
                  <DialogDescription className="mt-0.5 text-left text-xs">
                    Select a checker type, quantity, and customer delivery number
                  </DialogDescription>
                </div>
              </div>
            </div>
          </DialogHeader>

          {/* Scrollable Modal Body */}
          <ScrollArea className="min-h-0 flex-1 overflow-hidden">
            <div className="p-5 sm:p-6">
              {!purchasedOrder ? (
                <form id="sell-checker-form" onSubmit={handlePurchase} className="space-y-6">
                  {/* Voucher Catalog Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {checkers.map((item) => {
                      const isSelected = selectedCheckerId === item.id;
                      const wholesale = item.wholesalePrice ?? item.price;
                      const commission = item.price - wholesale;
                      return (
                        <div
                          key={item.id}
                          onClick={() => setSelectedCheckerId(item.id)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${isSelected
                              ? "border-primary bg-primary/10 ring-2 ring-primary/30 shadow-xs"
                              : "border-border bg-card hover:bg-muted/50"
                            }`}
                        >
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-muted text-foreground">
                                {item.examBody}
                              </span>
                            </div>
                            <h3 className="font-bold text-sm text-foreground">{item.title}</h3>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                          </div>

                          <div className="pt-3 mt-3 border-t border-border space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-semibold text-muted-foreground">Your cost:</span>
                              <span className="text-base font-black text-foreground tabular-nums">
                                GH₵ {wholesale.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-muted-foreground">Retail:</span>
                              <span className="text-xs text-muted-foreground tabular-nums line-through">
                                GH₵ {item.price.toFixed(2)}
                              </span>
                            </div>
                            {commission > 0 && (
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Earn:</span>
                                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                                  +GH₵ {commission.toFixed(2)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Purchase Details */}
                  <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
                    <div className="px-5 py-4 border-b border-border bg-muted/30">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-bold text-foreground">Voucher details</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Choose quantity and customer delivery number.
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-semibold text-muted-foreground tabular-nums line-through">
                            GH₵ {retailUnitPrice.toFixed(2)} retail
                          </div>
                          <div className="text-xs font-black text-primary tabular-nums">
                            GH₵ {agentUnitCost.toFixed(2)} your cost
                          </div>
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
                        <div className="space-y-2">
                          <Label htmlFor="custom-quantity" className="text-[11px] font-semibold text-muted-foreground">
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
                          Choose a preset or enter any quantity from 1 to 99.
                        </p>
                      </div>

                      {/* Customer phone */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <Label htmlFor="checker-phone" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Customer delivery number
                          </Label>
                          <span className="text-[10px] font-medium text-muted-foreground">SMS delivery</span>
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
                          Voucher PIN & serial will be sent to this number after purchase.
                        </p>
                      </div>
                    </div>

                    {/* Agent pricing summary */}
                    <div className="border-t border-border bg-muted/20 px-5 py-4 space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Retail price ({quantity}x):</span>
                        <span className="tabular-nums line-through">GH₵ {(retailUnitPrice * quantity).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-extrabold text-foreground">
                        <span>Your cost (wholesale):</span>
                        <span className="text-primary tabular-nums">GH₵ {totalAgentCost.toFixed(2)}</span>
                      </div>
                      {totalCommission > 0 && (
                        <div className="flex justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            Commission earned on delivery:
                          </span>
                          <span className="tabular-nums">+GH₵ {totalCommission.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </form>
              ) : (
                /* Voucher success card */
                <div className="p-6 rounded-3xl bg-card border border-border shadow-xl space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-border">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                      <div>
                        <h3 className="font-bold text-base text-foreground">Voucher Purchased & Verified</h3>
                        <p className="text-xs text-muted-foreground">Order Ref: {purchasedOrder.reference}</p>
                      </div>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold">
                      Ready for WAEC
                    </span>
                  </div>

                  {/* Commission earned callout */}
                  {(purchasedOrder.agentMargin ?? 0) > 0 && (
                    <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
                      <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="text-emerald-800 dark:text-emerald-300">
                        <span className="font-bold">+GH₵ {purchasedOrder.agentMargin!.toFixed(2)} commission</span> earned on this order and credited to your account.
                      </span>
                    </div>
                  )}

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
                        {revealed ? <EyeOff className="w-3.5 h-3.5 mr-1.5" /> : <Eye className="w-3.5 h-3.5 mr-1.5" />}
                        <span>{revealed ? "Mask Code" : "Reveal PIN"}</span>
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-3 bg-card rounded-xl border border-border">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Serial Number:</span>
                        <span className=" text-base font-extrabold text-primary tabular-nums">
                          {purchasedOrder.voucherSerial}
                        </span>
                      </div>
                      <div className="p-3 bg-card rounded-xl border border-border">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Voucher PIN:</span>
                        <span className=" text-base font-extrabold text-primary tabular-nums">
                          {revealed ? purchasedOrder.voucherCode : "•••• - •••• - ••••"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button variant="outline" onClick={handleCopyVoucher} className="flex-1">
                      {copied ? <Check className="w-4 h-4 mr-2 text-emerald-500" /> : <Copy className="w-4 h-4 mr-2" />}
                      <span>{copied ? "Copied to Clipboard" : "Copy Serial & PIN"}</span>
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
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Fixed action button */}
          <div className="shrink-0 border-t border-border bg-card p-4 sm:px-6">
            {!purchasedOrder ? (
              <div className="flex">
                <Button
                  type="submit"
                  form="sell-checker-form"
                  size="lg"
                  className="h-12 flex-1 gap-2 rounded-xl text-sm font-bold shadow-md"
                >
                  <span>Pay GH₵ {totalAgentCost.toFixed(2)} & Get Voucher</span>
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            ) : (
              <Button
                size="lg"
                onClick={() => {
                  setPurchasedOrder(null);
                  setRevealed(false);
                  setIsBuyCheckerOpen(false);
                }}
                className="h-12 w-full gap-2 rounded-xl text-sm font-bold shadow-md"
              >
                Close
              </Button>
            )}
          </div>

          {/* Trust footer */}
          <DialogFooter className="m-0 shrink-0 rounded-none border-t border-border bg-muted/30 px-5 py-3 sm:justify-center">
            <div className="flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground">
              <ShieldCheck className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span className="text-[11px]">
                Secured by Smart Data Hub · Authentic WAEC &amp; BECE Stock
              </span>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============ VOUCHER SALES TABLE ============ */}
      <Card className="border-border shadow-xs">
        <CardHeader className="border-b border-border pb-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-base font-extrabold text-foreground">
              <span>Voucher Sales Ledger</span>
            </CardTitle>
            <CardDescription className="mt-1 text-xs">
              All checker voucher sales with serial, PIN retrieval, and commission earned.
            </CardDescription>
          </div>
        </CardHeader>

        {/* Search + Filters */}
        <div className="border-b border-border bg-muted/20 p-4">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="checker-search" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Search voucher sales
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="checker-search"
                  type="text"
                  placeholder="Reference, product, phone, or serial..."
                  value={checkerSearch}
                  onChange={(e) => setCheckerSearch(e.target.value)}
                  className="h-10 bg-background pl-9 text-xs"
                />
              </div>
            </div>

            <div className="rounded-xl border border-border bg-background p-3">
              <div className="mb-3 flex items-center gap-2">
                <SlidersHorizontal className="size-3.5 text-muted-foreground" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Order filters</span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="checker-status" className="text-[10px] font-semibold text-muted-foreground">
                    Order status
                  </Label>
                  <Select value={checkerStatus} onValueChange={setCheckerStatus}>
                    <SelectTrigger id="checker-status" className="h-9 w-full text-xs">
                      <SelectValue />
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
            </div>
          </div>
        </div>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Send To</TableHead>
                <TableHead>Voucher</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Commission</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCheckerOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      {checkerSearch ? (
                        <Search className="w-8 h-8 text-muted-foreground/40" />
                      ) : (
                        <Ticket className="w-8 h-8 text-muted-foreground/40" />
                      )}
                      <p className="text-sm font-bold text-foreground">
                        {checkerSearch ? "No matching voucher sales" : "No voucher sales yet"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {checkerSearch
                          ? "Try a different reference, product, or phone number."
                          : "Sell a result checker above to see it here."}
                      </p>
                      {checkerSearch && (
                        <Button variant="outline" size="sm" onClick={() => setCheckerSearch("")} className="mt-2 text-xs">
                          Clear Search
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCheckerOrders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-muted/40">
                    <TableCell className=" text-xs text-muted-foreground">{order.reference}</TableCell>
                    <TableCell className="font-bold text-xs text-foreground">{order.productName}</TableCell>
                    <TableCell className=" text-xs text-muted-foreground">{order.recipientPhone}</TableCell>
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
                    <TableCell className="text-right tabular-nums text-xs">
                      {order.status === "delivered" ? (
                        <span className="font-black text-emerald-600 dark:text-emerald-400">
                          +GH₵ {(order.agentMargin ?? AGENT_COMMISSION).toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground font-medium">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {(() => {
                        const cfg =
                          checkerStatusConfig[order.status as keyof typeof checkerStatusConfig] ??
                          checkerStatusConfig.delivered;
                        return (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${cfg.className}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
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

          <div className="flex items-center justify-between gap-4 border-t border-border px-4 py-3">
            <span className="text-xs text-muted-foreground shrink-0">
              Showing{" "}
              <span className="font-bold text-foreground">
                {Math.min(checkerPage * CHECKERS_PER_PAGE, checkerOrders.length)}
              </span>{" "}
              of{" "}
              <span className="font-bold text-foreground">{checkerOrders.length}</span>{" "}
              sales
            </span>
            {checkerOrders.length > CHECKERS_PER_PAGE && (
              <div className="flex justify-end">
                {renderPagination(checkerPage, totalCheckerPages, setCheckerPage)}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ============ VOUCHER VIEW & COPY DIALOG ============ */}
      <Dialog open={!!voucherViewOrder} onOpenChange={(open) => { if (!open) setVoucherViewOrder(null); }}>
        <DialogContent className="flex max-h-[90vh] sm:max-w-xl flex-col gap-0 overflow-hidden rounded-3xl border border-border bg-card p-0 shadow-2xl">
          {/* Header */}
          <DialogHeader className="relative shrink-0 overflow-hidden border-b border-border bg-gradient-to-br from-primary/10 via-card to-amber-500/10 p-5 sm:p-6">
            <div className="absolute -right-12 -top-12 size-32 rounded-full bg-primary/5" />
            <div className="absolute -bottom-16 left-1/3 size-40 rounded-full bg-amber-500/5" />
            <div className="relative flex items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                <Ticket className="size-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-left text-base font-extrabold tracking-tight">
                    Voucher Serial &amp; PIN
                  </DialogTitle>
                  <Badge variant="secondary" className="border-emerald-500/20 bg-emerald-500/15 px-2 py-0 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                    Agent Pricing
                  </Badge>
                </div>
                <DialogDescription className="mt-0.5 text-left text-xs font-mono">
                  {voucherViewOrder?.reference}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Body */}
          {voucherViewOrder && (
            <div className="p-5 sm:p-6 space-y-6">
              {/* Product row */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-semibold">Product</span>
                <span className="font-bold text-foreground">{voucherViewOrder.productName}</span>
              </div>

              {/* Voucher header */}
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <div>
                    <h3 className="font-bold text-sm text-foreground">Voucher Purchased &amp; Verified</h3>
                    <p className="text-xs text-muted-foreground">Order Ref: {voucherViewOrder.reference}</p>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold">
                  Ready for WAEC
                </span>
              </div>

              {/* Commission callout for agent */}
              {voucherViewOrder.status === "delivered" && (voucherViewOrder.agentMargin ?? 0) > 0 && (
                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
                  <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="text-emerald-800 dark:text-emerald-300">
                    <span className="font-bold">+GH₵ {voucherViewOrder.agentMargin!.toFixed(2)} commission</span> earned on this order.
                  </span>
                </div>
              )}

              {/* Scratch card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/15 via-muted/60 to-purple-500/15 border border-border space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Authentic E-Voucher Card
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setDialogRevealed(!dialogRevealed)}
                    className="text-xs font-semibold gap-1.5"
                  >
                    {dialogRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {dialogRevealed ? "Mask Code" : "Reveal PIN"}
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 bg-card rounded-xl border border-border">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                      Serial Number:
                    </span>
                    <span className="font-mono text-base font-extrabold text-primary tabular-nums">
                      {voucherViewOrder.voucherSerial}
                    </span>
                  </div>
                  <div className="p-3 bg-card rounded-xl border border-border">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                      Voucher PIN:
                    </span>
                    <span className="font-mono text-base font-extrabold text-primary tabular-nums">
                      {dialogRevealed ? voucherViewOrder.voucherCode : "•••• - •••• - ••••"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={handleCopyDialogVoucher} className="flex-1">
                  {voucherCopied ? (
                    <Check className="w-4 h-4 mr-2 text-emerald-500" />
                  ) : (
                    <Copy className="w-4 h-4 mr-2" />
                  )}
                  <span>{voucherCopied ? "Copied to Clipboard" : "Copy Serial & PIN"}</span>
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
              </div>
            </div>
          )}

          {/* Trust footer */}
          <DialogFooter className="m-0 shrink-0 rounded-none border-t border-border bg-muted/30 px-5 py-3 sm:justify-center">
            <div className="flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground">
              <ShieldCheck className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span className="text-[11px]">Secured by Smart Data Hub · Authentic WAEC &amp; BECE Stock</span>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

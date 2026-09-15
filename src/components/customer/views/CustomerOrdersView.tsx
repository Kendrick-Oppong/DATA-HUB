import React, { useState, useEffect } from "react";
import {
  Clock,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  FlagTriangleRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { Order, OrderStatus } from "../../../types";
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
import { ReportOrderModal } from "../ReportOrderModal";
import { VerifyPaymentModal } from "../VerifyPaymentModal";

// Date formatter for table (YYYY-MM-DD HH:mm)
function formatOrderDate(dateStr: string): string {
  if (!dateStr) return "—";
  try {
    const trimmed = dateStr.trim();
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
    if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}/.test(trimmed)) {
      return trimmed.replace("T", " ").slice(0, 16);
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

interface CustomerOrdersViewProps {
  orders: Order[];
  onOpenReceipt: (order: Order) => void;
  onUpdateOrders?: (orders: Order[]) => void;
}

export const CustomerOrdersView: React.FC<CustomerOrdersViewProps> = ({
  orders,
  onOpenReceipt,
  onUpdateOrders,
}) => {
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedOrderForReport, setSelectedOrderForReport] =
    useState<Order | null>(null);

  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [selectedOrderForVerify, setSelectedOrderForVerify] =
    useState<Order | null>(null);
  const [verifyNotice, setVerifyNotice] = useState<string | null>(null);

  const ORDERS_PER_PAGE = 5;

  const [orderSearch, setOrderSearch] = useState("");
  const [orderFilterStatus, setOrderFilterStatus] = useState<string>("all");
  const [orderNetworkFilter, setOrderNetworkFilter] = useState<string>("all");
  const [orderServiceFilter, setOrderServiceFilter] = useState<string>("all");
  const [orderSortBy, setOrderSortBy] = useState<string>("newest");
  const [ordersPage, setOrdersPage] = useState(1);

  const handleOpenReport = (order: Order) => {
    setSelectedOrderForReport(order);
    setReportModalOpen(true);
  };

  const handleCloseReportModal = () => {
    setReportModalOpen(false);
    setSelectedOrderForReport(null);
  };

  const handleReportSubmitted = (report: any) => {
    console.log("Report submitted:", report);
    handleCloseReportModal();
  };

  const handleOpenVerifyModal = (order: Order) => {
    setSelectedOrderForVerify(order);
    setVerifyModalOpen(true);
  };

  const handleCloseVerifyModal = () => {
    setVerifyModalOpen(false);
    setSelectedOrderForVerify(null);
  };

  const handlePaymentVerified = (orderId: string, paystackRef: string) => {
    const timeNow = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    const updatedOrders = orders.map((o) => {
      if (o.id === orderId) {
        return {
          ...o,
          status: "processing" as OrderStatus,
          isPaymentVerified: true,
          paystackReference: paystackRef,
          deliveryTimeline: [
            ...(o.deliveryTimeline || []),
            {
              step: "Payment Verified via Paystack",
              timestamp: timeNow,
              status: "completed" as const,
              note: `Verified (${paystackRef}). Dispatched to network core.`,
            },
          ],
        };
      }
      return o;
    });

    if (onUpdateOrders) {
      onUpdateOrders(updatedOrders);
    }

    setVerifyNotice(
      `Paystack payment verified for Order #${selectedOrderForVerify?.reference || orderId}! Status updated to Processing.`,
    );
    setTimeout(() => {
      setVerifyNotice(null);
    }, 6000);
  };

  // Reset pagination on filter change
  useEffect(() => {
    setOrdersPage(1);
  }, [
    orderSearch,
    orderFilterStatus,
    orderNetworkFilter,
    orderServiceFilter,
    orderSortBy,
  ]);

  // Filtering & Sorting
  const filteredOrders = orders
    .filter((order) => {
      const query = orderSearch.toLowerCase().trim();

      const matchesQuery =
        !query ||
        order.reference.toLowerCase().includes(query) ||
        order.recipientPhone.includes(query) ||
        order.productName.toLowerCase().includes(query) ||
        order.customerName.toLowerCase().includes(query);

      const matchesStatus =
        orderFilterStatus === "all" ||
        order.status === orderFilterStatus ||
        (orderFilterStatus === "pending" && order.status === "pending_payment");

      const matchesNetwork =
        orderNetworkFilter === "all" || order.network === orderNetworkFilter;

      const matchesService =
        orderServiceFilter === "all" ||
        (order.serviceType &&
          order.serviceType
            .toLowerCase()
            .includes(orderServiceFilter.toLowerCase()));

      return matchesQuery && matchesStatus && matchesNetwork && matchesService;
    })
    .sort((a, b) => {
      if (orderSortBy === "amount-high") {
        return b.amount - a.amount;
      }

      if (orderSortBy === "amount-low") {
        return a.amount - b.amount;
      }

      if (orderSortBy === "oldest") {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }

      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

  const totalOrderPages = Math.max(
    1,
    Math.ceil(filteredOrders.length / ORDERS_PER_PAGE),
  );

  const paginatedOrders = filteredOrders.slice(
    (ordersPage - 1) * ORDERS_PER_PAGE,
    ordersPage * ORDERS_PER_PAGE,
  );

  const resetOrderFilters = () => {
    setOrderSearch("");
    setOrderFilterStatus("all");
    setOrderNetworkFilter("all");
    setOrderServiceFilter("all");
    setOrderSortBy("newest");
  };

  const hasOrderFilters =
    orderSearch.trim() !== "" ||
    orderFilterStatus !== "all" ||
    orderNetworkFilter !== "all" ||
    orderServiceFilter !== "all" ||
    orderSortBy !== "newest";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 border-b border-border pb-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-foreground">
            <Clock className="size-6 text-primary" />
            <span>My Orders & Dispatch Deliveries</span>
          </h1>

          <p className="mt-0.5 text-xs text-muted-foreground">
            Inspect dispatch status, download receipts, or repeat purchases.
          </p>
        </div>
      </div>

      {/* Verify Notification Banner */}
      {verifyNotice && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 animate-in fade-in-50">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
          <span>{verifyNotice}</span>
        </div>
      )}

      {/* SEARCH & FILTERS */}
      <Card className="overflow-hidden border-border shadow-xs">
        <CardHeader className="border-b border-border bg-card pb-4">
          <div className="flex items-center gap-2">
            <div>
              <CardTitle className="text-sm font-extrabold">
                Order history
              </CardTitle>

              <CardDescription className="mt-0.5 text-xs">
                Manage your orders and dispatch deliveries
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-4">
          {/* Search */}
          <div className="space-y-1.5">
            <Label
              htmlFor="order-search"
              className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
            >
              Search orders
            </Label>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                id="order-search"
                type="text"
                placeholder="Reference, phone number, customer, or product..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="h-10 pl-9 text-xs"
              />
            </div>
          </div>

          {/* Filters Panel */}
          <div className="rounded-xl border border-border bg-background p-4">
            {/* Filter Header */}
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="size-3.5 text-muted-foreground" />

                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Filters & sorting
                </span>
              </div>
            </div>

            {/* Filter Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Status */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="order-status"
                  className="text-[10px] font-semibold text-muted-foreground"
                >
                  Order status
                </Label>

                <Select
                  value={orderFilterStatus}
                  onValueChange={setOrderFilterStatus}
                >
                  <SelectTrigger
                    id="order-status"
                    className="h-9 w-full bg-background text-xs"
                  >
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="waiting">Waiting</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Network */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="order-network"
                  className="text-[10px] font-semibold text-muted-foreground"
                >
                  Network
                </Label>

                <Select
                  value={orderNetworkFilter}
                  onValueChange={setOrderNetworkFilter}
                >
                  <SelectTrigger
                    id="order-network"
                    className="h-9 w-full bg-background text-xs"
                  >
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="all">All networks</SelectItem>

                    <SelectItem value="MTN">MTN Ghana</SelectItem>

                    <SelectItem value="Telecel">Telecel Ghana</SelectItem>

                    <SelectItem value="AirtelTigo">AirtelTigo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Service */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="order-service"
                  className="text-[10px] font-semibold text-muted-foreground"
                >
                  Service type
                </Label>

                <Select
                  value={orderServiceFilter}
                  onValueChange={setOrderServiceFilter}
                >
                  <SelectTrigger
                    id="order-service"
                    className="h-9 w-full bg-background text-xs"
                  >
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="all">All services</SelectItem>

                    <SelectItem value="airtime">Airtime</SelectItem>

                    <SelectItem value="data">Data bundle</SelectItem>

                    <SelectItem value="sms">SMS package</SelectItem>

                    <SelectItem value="voucher">Voucher</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="order-sort"
                  className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground"
                >
                  <ArrowUpDown className="size-3" />
                  Sort orders by
                </Label>

                <Select value={orderSortBy} onValueChange={setOrderSortBy}>
                  <SelectTrigger
                    id="order-sort"
                    className="h-9 w-full bg-background text-xs"
                  >
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="newest">Newest first</SelectItem>

                    <SelectItem value="oldest">Oldest first</SelectItem>

                    <SelectItem value="amount-high">Highest amount</SelectItem>

                    <SelectItem value="amount-low">Lowest amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filter Footer */}
            <div className="mt-4 flex flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                {hasOrderFilters ? (
                  <>
                    <span className="size-1.5 rounded-full bg-primary" />

                    <span>Filters are currently active</span>
                  </>
                ) : (
                  <>
                    <span className="size-1.5 rounded-full bg-muted-foreground/40" />

                    <span>Showing all orders</span>
                  </>
                )}
              </div>

              {hasOrderFilters && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={resetOrderFilters}
                >
                  Reset all filters
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card className="border-border !pt-0 shadow-xs">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Network</TableHead>
                <TableHead>Order Reference</TableHead>
                <TableHead>Product Package</TableHead>
                <TableHead>Recipient Phone</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginatedOrders.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="py-10 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Search className="size-8 text-muted-foreground/40" />

                      <p className="text-sm font-bold text-foreground">
                        No matching orders found
                      </p>

                      <p className="text-xs text-muted-foreground">
                        Try adjusting your search or filters.
                      </p>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={resetOrderFilters}
                        className="mt-2 text-xs"
                      >
                        Reset Filters
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedOrders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-muted/40">
                    <TableCell>
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-black uppercase ${
                          order.network === "MTN"
                            ? "bg-amber-400 text-amber-950"
                            : order.network === "Telecel"
                              ? "bg-red-600 text-white"
                              : "bg-blue-600 text-white"
                        }`}
                      >
                        {order.network.slice(0, 3)}
                      </span>
                    </TableCell>

                    <TableCell className=" text-xs font-bold text-foreground">
                      {order.reference}
                    </TableCell>

                    <TableCell className="text-xs font-bold text-foreground">
                      {order.productName}
                    </TableCell>

                    <TableCell className=" text-xs">
                      {order.recipientPhone}
                    </TableCell>

                    <TableCell className="text-xs tabular-nums text-muted-foreground whitespace-nowrap">
                      {formatOrderDate(order.date)}
                    </TableCell>

                    <TableCell className="text-right text-xs font-black tabular-nums text-foreground">
                      GH₵ {order.amount.toFixed(2)}
                    </TableCell>

                    <TableCell className="text-center">
                      {order.status === "delivered" && (
                        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                          <span className="size-1.5 rounded-full bg-emerald-500" />
                          Delivered
                        </span>
                      )}
                      {order.status === "processing" && (
                        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                          <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                          Processing
                        </span>
                      )}
                      {order.status === "waiting" && (
                        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase bg-sky-500/15 text-sky-700 dark:text-sky-400 border border-sky-500/30">
                          <span className="size-1.5 rounded-full bg-sky-500" />
                          Waiting
                        </span>
                      )}
                      {(order.status === "pending" ||
                        order.status === "pending_payment") && (
                        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/30">
                          <span className="size-1.5 rounded-full bg-purple-500 animate-pulse" />
                          Pending
                        </span>
                      )}
                      {order.status === "failed" && (
                        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30">
                          <span className="size-1.5 rounded-full bg-red-500" />
                          Failed
                        </span>
                      )}
                      {order.status === "refunded" && (
                        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase bg-muted text-muted-foreground border border-border">
                          <span className="size-1.5 rounded-full bg-muted-foreground/50" />
                          Refunded
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {(order.status === "pending" ||
                          order.status === "pending_payment") && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleOpenVerifyModal(order)}
                            className="h-7 rounded-full px-2.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs inline-flex items-center gap-1 cursor-pointer"
                          >
                            <ShieldCheck className="size-3.5" />
                            <span>Verify Payment</span>
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onOpenReceipt(order)}
                          className="h-7 rounded-full px-2.5 text-xs font-semibold"
                        >
                          Receipt
                        </Button>

                        {order.status !== "processing" && (
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => handleOpenReport(order)}
                            title="File a report"
                            aria-label="File a report"
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <FlagTriangleRight className="size-3.5 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Orders Pagination Footer */}
          <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs text-muted-foreground">
              Showing{" "}
              <span className="font-bold text-foreground">
                {filteredOrders.length === 0
                  ? 0
                  : Math.min(
                      ordersPage * ORDERS_PER_PAGE,
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
                  currentPage={ordersPage}
                  totalPages={totalOrderPages}
                  onPageChange={setOrdersPage}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Report Order Modal */}
      <ReportOrderModal
        isOpen={reportModalOpen}
        onClose={handleCloseReportModal}
        order={selectedOrderForReport}
        onReportSubmitted={handleReportSubmitted}
      />

      {/* Verify Paystack Payment Modal */}
      <VerifyPaymentModal
        isOpen={verifyModalOpen}
        onClose={handleCloseVerifyModal}
        order={selectedOrderForVerify}
        onPaymentVerified={handlePaymentVerified}
      />
    </div>
  );
};

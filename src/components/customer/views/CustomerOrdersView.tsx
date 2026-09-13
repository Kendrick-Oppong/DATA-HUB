import React, { useState, useEffect } from "react";
import { Clock, Search, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { Order } from "../../../types";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Badge } from "../../ui/badge";
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

interface CustomerOrdersViewProps {
  orders: Order[];
  onOpenReceipt: (order: Order) => void;
}

export const CustomerOrdersView: React.FC<CustomerOrdersViewProps> = ({
  orders,
  onOpenReceipt,
}) => {
  const ORDERS_PER_PAGE = 5;

  const [orderSearch, setOrderSearch] = useState("");
  const [orderFilterStatus, setOrderFilterStatus] = useState<string>("all");
  const [orderNetworkFilter, setOrderNetworkFilter] = useState<string>("all");
  const [orderServiceFilter, setOrderServiceFilter] = useState<string>("all");
  const [orderSortBy, setOrderSortBy] = useState<string>("newest");
  const [ordersPage, setOrdersPage] = useState(1);

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
        orderFilterStatus === "all" || order.status === orderFilterStatus;

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

                    <SelectItem value="delivered">Delivered</SelectItem>

                    <SelectItem value="processing">Processing</SelectItem>

                    <SelectItem value="pending">Pending</SelectItem>

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

                    <SelectItem value="amount-high">
                      Highest amount
                    </SelectItem>

                    <SelectItem value="amount-low">
                      Lowest amount
                    </SelectItem>
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
                <TableHead className="text-right">Receipt</TableHead>
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

                    <TableCell className="font-mono text-xs font-bold text-foreground">
                      {order.reference}
                    </TableCell>

                    <TableCell className="text-xs font-bold text-foreground">
                      {order.productName}
                    </TableCell>

                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {order.recipientPhone}
                    </TableCell>

                    <TableCell className="text-xs tabular-nums text-muted-foreground">
                      {order.date}
                    </TableCell>

                    <TableCell className="text-right text-xs font-black tabular-nums text-foreground">
                      GH₵ {order.amount.toFixed(2)}
                    </TableCell>

                    <TableCell className="text-center">
                      <Badge
                        variant={
                          order.status === "delivered"
                            ? "default"
                            : "secondary"
                        }
                        className="text-[10px] font-bold uppercase"
                      >
                        {order.status}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenReceipt(order)}
                        className="h-7 px-2.5 text-xs font-bold"
                      >
                        Receipt
                      </Button>
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
    </div>
  );
};

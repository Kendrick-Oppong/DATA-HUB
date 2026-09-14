import React, { useState } from "react";
import {
  Wifi,
  PhoneCall,
  GraduationCap,
  ShieldCheck,
  Zap,
  FlagTriangleRight,
  ArrowRight,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Order, Transaction } from "../../types";
import { SignalRail } from "../common/SignalRail";
import { Button } from "../ui/button";
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
import { ReportOrderModal } from "./ReportOrderModal";

interface CustomerDashboardProps {
  walletBalance: number;
  onOpenFundWallet: () => void;
  onNavigateTab: (tab: string) => void;
  orders: Order[];
  transactions: Transaction[];
  onOpenReceipt: (order: Order) => void;
  onRepeatOrder: (order: Order) => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({
  walletBalance,
  onOpenFundWallet,
  onNavigateTab,
  orders,
  onOpenReceipt,
  onRepeatOrder,
}) => {
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedOrderForReport, setSelectedOrderForReport] =
    useState<Order | null>(null);

  const pendingOrders = orders.filter((o) => o.status === "processing");
  const recentOrders = orders.slice(0, 5);

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

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col items-start justify-between gap-4 rounded-3xl border border-border bg-gradient-to-r from-primary/10 via-card to-amber-500/10 p-6 shadow-xs sm:flex-row sm:items-center sm:p-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Customer Portal
            </span>

            <SignalRail
              status="online"
              size="sm"
              label="Carrier Gateways 99.8%"
            />
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            Akwaaba, Kojo!
          </h1>

          <p className="text-xs text-muted-foreground sm:text-sm">
            Buy data, airtime, and WAEC vouchers with confidence and instant
            delivery.
          </p>
        </div>

        {/* Wallet Balance Hero Card */}
        <div className="flex shrink-0 items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div>
            <p className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Available Balance
            </p>

            <p className="text-2xl font-black tabular-nums text-foreground">
              GH₵ {walletBalance.toFixed(2)}
            </p>
          </div>

          <Button onClick={onOpenFundWallet} size="lg">
            + Top-up
          </Button>
        </div>
      </div>

      {/* Pending Dispatch Warning */}
      {pendingOrders.length > 0 && (
        <div className="flex items-center justify-between rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs">
          <div className="flex items-center gap-3">
            <SignalRail status="processing" size="sm" />

            <div>
              <span className="font-semibold">Active Delivery: </span>

              <span>
                Order {pendingOrders[0].reference} (
                {pendingOrders[0].productName}) is in active upstream queue.
              </span>
            </div>
          </div>

          <Button
            variant="link"
            onClick={() => onNavigateTab("orders")}
            className="h-auto shrink-0 px-0 text-xs"
          >
            Track
            <ArrowRight className="size-3.5" />
          </Button>
        </div>
      )}

      {/* Latest MTN Successful Order */}
      <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="size-4" />
        </div>

        <div className="flex-1 space-y-1.5">
          <div className="font-semibold text-emerald-700 dark:text-emerald-400">
            Latest MTN Successful Order
          </div>

          <div className="text-muted-foreground">
            Placed at Sep 14, 12:17 PM. Delivered at Sep 14, 01:27 PM
          </div>

          <div className="text-muted-foreground">Took about 1 hr 11 mins.</div>

          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="size-4" />
            <span>
              Est. delivery: 1-2 hours. A validation process is currently
              ongoing on the MTN system.
            </span>
          </div>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        <Button
          variant="ghost"
          onClick={() => onNavigateTab("buy-data")}
          className="group h-auto w-full flex-col items-start justify-start rounded-2xl border border-border bg-card p-4 text-left shadow-2xs transition-all hover:border-primary/50 hover:bg-card"
        >
          <div className="mb-2 flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-105">
            <Wifi className="size-5" />
          </div>

          <div className="font-bold text-xs text-foreground">Buy Data</div>

          <div className="text-[10px] text-muted-foreground">
            MTN, Telecel, AT
          </div>
        </Button>

        <Button
          variant="ghost"
          onClick={() => onNavigateTab("buy-airtime")}
          className="group h-auto w-full flex-col items-start justify-start rounded-2xl border border-border bg-card p-4 text-left shadow-2xs transition-all hover:border-primary/50 hover:bg-card"
        >
          <div className="mb-2 flex size-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 transition-transform group-hover:scale-105">
            <PhoneCall className="size-5" />
          </div>

          <div className="font-bold text-xs text-foreground">Buy Airtime</div>

          <div className="text-[10px] text-muted-foreground">
            Instant E-Load
          </div>
        </Button>

        <Button
          variant="ghost"
          onClick={() => onNavigateTab("results-checker")}
          className="group h-auto w-full flex-col items-start justify-start rounded-2xl border border-border bg-card p-4 text-left shadow-2xs transition-all hover:border-primary/50 hover:bg-card"
        >
          <div className="mb-2 flex size-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 transition-transform group-hover:scale-105">
            <GraduationCap className="size-5" />
          </div>

          <div className="font-bold text-xs text-foreground">
            Result Checkers
          </div>

          <div className="text-[10px] text-muted-foreground">
            WAEC & BECE PIN
          </div>
        </Button>

        <Button
          variant="ghost"
          onClick={() => onNavigateTab("afa")}
          className="group h-auto w-full flex-col items-start justify-start rounded-2xl border border-border bg-card p-4 text-left shadow-2xs transition-all hover:border-primary/50 hover:bg-card"
        >
          <div className="mb-2 flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 transition-transform group-hover:scale-105">
            <ShieldCheck className="size-5" />
          </div>

          <div className="font-bold text-xs text-foreground">
            AFA Registration
          </div>

          <div className="text-[10px] text-muted-foreground">
            Discount Tariffs
          </div>
        </Button>

        <Button
          variant="ghost"
          onClick={() => onNavigateTab("utilities")}
          className="group h-auto w-full flex-col items-start justify-start rounded-2xl border border-border bg-card p-4 text-left shadow-2xs transition-all hover:border-primary/50 hover:bg-card"
        >
          <div className="mb-2 flex size-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 transition-transform group-hover:scale-105">
            <Zap className="size-5" />
          </div>

          <div className="font-bold text-xs text-foreground">Pay Bills</div>

          <div className="text-[10px] text-muted-foreground">
            ECG, Water, TV
          </div>
        </Button>
      </div>

      {/* Recent Orders Table */}
      <Card className="border-border shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border pb-3">
          <div>
            <CardTitle className="text-base font-extrabold text-foreground">
              Recent Orders (Top 6)
            </CardTitle>

            <CardDescription className="text-xs">
              Click any record to inspect the delivery signal or print receipt.
            </CardDescription>
          </div>

          <Button
            variant="link"
            onClick={() => onNavigateTab("orders")}
            className="h-auto gap-1 px-0 text-xs font-bold text-primary"
          >
            <span>View All</span>
            <ArrowRight className="size-3.5" />
          </Button>
        </CardHeader>

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
              {recentOrders.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="py-8 text-center text-xs text-muted-foreground"
                  >
                    No recent orders found.
                  </TableCell>
                </TableRow>
              ) : (
                recentOrders.map((order) => (
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

                    <TableCell className="text-xs font-bold text-foreground">
                      {order.reference}
                    </TableCell>

                    <TableCell className="text-xs font-bold text-foreground">
                      {order.productName}
                    </TableCell>

                    <TableCell className="text-xs">
                      {order.recipientPhone}
                    </TableCell>

                    <TableCell className="text-xs tabular-nums">
                      {order.date}
                    </TableCell>

                    <TableCell className="text-right text-xs font-black tabular-nums text-foreground">
                      GH₵ {order.amount.toFixed(2)}
                    </TableCell>

                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                            order.status === "delivered"
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                              : order.status === "processing"
                                ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                                : "bg-red-500/15 text-red-600 dark:text-red-400"
                          }`}
                        >
                          <span
                            className={`size-1.5 rounded-full ${
                              order.status === "delivered"
                                ? "bg-emerald-500"
                                : order.status === "processing"
                                  ? "bg-amber-500"
                                  : "bg-red-500"
                            }`}
                          />

                          {order.status}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
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
        </CardContent>
      </Card>

      {/* Report Order Modal */}
      <ReportOrderModal
        isOpen={reportModalOpen}
        onClose={handleCloseReportModal}
        order={selectedOrderForReport}
        onReportSubmitted={handleReportSubmitted}
      />
    </div>
  );
};

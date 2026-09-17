import React, { useState, useMemo, useEffect } from "react";
import {
  Users,
  Search,
  SlidersHorizontal,
  RefreshCw,
  Coins,
  Receipt,
  Send,
  Copy,
  Clock,
  Download,
  Info,
  ShieldCheck,
  CheckCircle2,
  Wallet,
  CreditCard,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
  Phone,
} from "lucide-react";
import { Order, TelecomNetwork } from "../../../types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../../ui/pagination";

export interface AgentCustomerRecord {
  id: string;
  name: string;
  phone: string;
  net: TelecomNetwork;
  ordersCount: number;
  totalSpent: number;
  lastOrderDate: string;
  lastOrderTimestamp: number;
  status: "active" | "inactive";
}

export interface AgentCustomersViewProps {
  orders?: Order[];
  onNavigateTab?: (tab: string, extraState?: any) => void;
}

const ITEMS_PER_PAGE = 8;

// Seed customers matching SDH agent storefront mock dataset
const SEED_CUSTOMERS: AgentCustomerRecord[] = [
  {
    id: "cust-1",
    name: "Kojo Mensah",
    phone: "0244192834",
    net: "MTN",
    ordersCount: 14,
    totalSpent: 482.5,
    lastOrderDate: "2026-09-15 14:22",
    lastOrderTimestamp: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
    status: "active",
  },
  {
    id: "cust-2",
    name: "Abena Osei",
    phone: "0208119203",
    net: "Telecel",
    ordersCount: 8,
    totalSpent: 264.0,
    lastOrderDate: "2026-09-14 09:15",
    lastOrderTimestamp: Date.now() - 1000 * 60 * 60 * 50, // 2 days ago
    status: "active",
  },
  {
    id: "cust-3",
    name: "Kwame Asante",
    phone: "0559102948",
    net: "MTN",
    ordersCount: 22,
    totalSpent: 890.0,
    lastOrderDate: "2026-09-16 11:04",
    lastOrderTimestamp: Date.now() - 1000 * 60 * 60 * 4, // 4 hours ago
    status: "active",
  },
  {
    id: "cust-4",
    name: "Esi Ansah",
    phone: "0267104928",
    net: "AirtelTigo",
    ordersCount: 3,
    totalSpent: 75.0,
    lastOrderDate: "2026-09-10 18:40",
    lastOrderTimestamp: Date.now() - 1000 * 60 * 60 * 24 * 6, // 6 days ago
    status: "active",
  },
  {
    id: "cust-5",
    name: "Emmanuel Quarshie",
    phone: "0543910284",
    net: "MTN",
    ordersCount: 1,
    totalSpent: 25.0,
    lastOrderDate: "2026-08-04 12:10",
    lastOrderTimestamp: Date.now() - 1000 * 60 * 60 * 24 * 43, // 43 days ago
    status: "inactive",
  },
  {
    id: "cust-6",
    name: "Grace Addo",
    phone: "0243881920",
    net: "MTN",
    ordersCount: 6,
    totalSpent: 198.0,
    lastOrderDate: "2026-09-12 16:30",
    lastOrderTimestamp: Date.now() - 1000 * 60 * 60 * 24 * 4, // 4 days ago
    status: "active",
  },
  {
    id: "cust-7",
    name: "Yaw Baah",
    phone: "0501293847",
    net: "Telecel",
    ordersCount: 2,
    totalSpent: 48.0,
    lastOrderDate: "2026-07-28 10:00",
    lastOrderTimestamp: Date.now() - 1000 * 60 * 60 * 24 * 50, // 50 days ago
    status: "inactive",
  },
  {
    id: "cust-8",
    name: "Prince Kwarteng",
    phone: "0249012384",
    net: "MTN",
    ordersCount: 11,
    totalSpent: 395.0,
    lastOrderDate: "2026-09-13 19:20",
    lastOrderTimestamp: Date.now() - 1000 * 60 * 60 * 24 * 3, // 3 days ago
    status: "active",
  },
  {
    id: "cust-9",
    name: "Rita Turkson",
    phone: "0278912034",
    net: "AirtelTigo",
    ordersCount: 5,
    totalSpent: 140.0,
    lastOrderDate: "2026-09-08 14:00",
    lastOrderTimestamp: Date.now() - 1000 * 60 * 60 * 24 * 8, // 8 days ago
    status: "active",
  },
];

export const AgentCustomersView: React.FC<AgentCustomersViewProps> = ({
  orders = [],
  onNavigateTab,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [networkFilter, setNetworkFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [buyerTypeFilter, setBuyerTypeFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCust, setSelectedCust] = useState<AgentCustomerRecord | null>(
    null,
  );
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  // Reset pagination on filter changes (Exact match of AgentTransactionsWallet)
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, networkFilter, statusFilter, buyerTypeFilter]);

  // Derive unique customer list dynamically from orders prop merged with seed data
  const customerList = useMemo(() => {
    const map = new Map<string, AgentCustomerRecord>();

    // Seed defaults first
    SEED_CUSTOMERS.forEach((c) => map.set(c.phone, c));

    // Process live orders if any
    orders.forEach((o) => {
      const phone = o.recipientPhone || o.customerName;
      if (!phone) return;

      const existing = map.get(phone);
      const orderTs = new Date(o.date).getTime() || Date.now();
      const isActive = Date.now() - orderTs < 1000 * 60 * 60 * 24 * 30;

      if (existing) {
        existing.ordersCount += 1;
        existing.totalSpent += o.amount || 0;
        if (orderTs > existing.lastOrderTimestamp) {
          existing.lastOrderTimestamp = orderTs;
          existing.lastOrderDate = o.date;
          existing.net = o.network || existing.net;
          existing.status = isActive ? "active" : "inactive";
        }
      } else {
        const name =
          o.customerName && o.customerName !== phone
            ? o.customerName
            : `Customer (${phone.slice(-4)})`;
        map.set(phone, {
          id: `cust-${phone}`,
          name,
          phone,
          net: o.network || "MTN",
          ordersCount: 1,
          totalSpent: o.amount || 0,
          lastOrderDate: o.date,
          lastOrderTimestamp: orderTs,
          status: isActive ? "active" : "inactive",
        });
      }
    });

    return Array.from(map.values()).sort(
      (a, b) => b.lastOrderTimestamp - a.lastOrderTimestamp,
    );
  }, [orders]);

  // Filtered customers list
  const filteredCustomers = useMemo(() => {
    return customerList.filter((c) => {
      // Network filter
      if (
        networkFilter !== "all" &&
        c.net.toLowerCase() !== networkFilter.toLowerCase()
      ) {
        return false;
      }

      // Activity status filter
      if (statusFilter !== "all" && c.status !== statusFilter) {
        return false;
      }

      // Buyer type filter
      if (buyerTypeFilter === "repeat" && c.ordersCount <= 1) return false;
      if (buyerTypeFilter === "high_value" && c.totalSpent < 100) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = c.name.toLowerCase().includes(q);
        const matchPhone = c.phone.includes(q);
        const matchNet = c.net.toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchNet) {
          return false;
        }
      }

      return true;
    });
  }, [customerList, searchQuery, networkFilter, statusFilter, buyerTypeFilter]);

  // Pagination calculation (Exact match of AgentTransactionsWallet)
  const totalPages = Math.max(
    1,
    Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE),
  );

  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCustomers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCustomers, currentPage]);

  // Aggregate Metrics
  const totalCount = customerList.length;
  const repeatCount = customerList.filter((c) => c.ordersCount > 1).length;
  const repeatRatePct = totalCount
    ? Math.round((repeatCount / totalCount) * 100)
    : 0;
  const totalOrdersCount = customerList.reduce(
    (sum, c) => sum + c.ordersCount,
    0,
  );
  const totalSpentSum = customerList.reduce((sum, c) => sum + c.totalSpent, 0);
  const avgOrderSpend = totalOrdersCount ? totalSpentSum / totalOrdersCount : 0;

  // CSV Export utility (Exact match of AgentTransactionsWallet)
  const handleExportCsv = () => {
    const headers = [
      "Customer ID",
      "Full Name",
      "Phone Number",
      "Carrier Network",
      "Total Orders",
      "Total Spent (GH₵)",
      "Last Order Date",
      "Status",
    ];

    const escapeCsv = (val: string | number | undefined) =>
      `"${String(val ?? "").replace(/"/g, '""')}"`;

    const rows = filteredCustomers.map((c) => [
      escapeCsv(c.id),
      escapeCsv(c.name),
      escapeCsv(c.phone),
      escapeCsv(c.net),
      escapeCsv(c.ordersCount),
      escapeCsv(c.totalSpent.toFixed(2)),
      escapeCsv(c.lastOrderDate),
      escapeCsv(c.status),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `sdh-agent-customers-${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy phone handler
  const handleCopyPhone = (e: React.MouseEvent, phone: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  // Send Bulk SMS shortcut
  const handleSendSmsToCustomer = (e: React.MouseEvent, phone: string) => {
    e.stopPropagation();
    if (onNavigateTab) {
      onNavigateTab("bulk-sms");
    }
  };

  return (
    <div className="space-y-6">
      {/* PAGE HEADER (Exact Parity with AgentTransactionsWallet / AgentPricing) */}
      <div className="flex flex-col items-start justify-between gap-4 border-b border-border pb-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-foreground">
            <Users className="size-6 text-primary" />
            <span>Customer Directory &amp; Client Ledger</span>
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Buyer management: purchase history, carrier distribution, and SMS
            dispatch.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            onClick={() => onNavigateTab?.("bulk-sms")}
            className="text-xs font-bold cursor-pointer gap-1.5 h-9 bg-primary text-primary-foreground"
          >
            <Send className="size-4" />
            <span>Bulk SMS Outreach</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="text-xs font-bold cursor-pointer gap-1.5 h-9"
          >
            <Download className="size-4 text-muted-foreground" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* 4 STATS CARDS TILES (Exact Match of AgentTransactionsWallet Tiles) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Customers */}
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
              <Users className="size-3.5 text-primary" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Total Customers
            </span>
          </div>
          <p className="mt-2 text-xl font-black tabular-nums text-foreground">
            {totalCount}
          </p>
          <p className="text-[10px] text-primary font-medium">
            Active buyer profiles
          </p>
        </div>

        {/* Repeat Rate */}
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10">
              <RefreshCw className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Repeat Rate
            </span>
          </div>
          <p className="mt-2 text-xl font-black tabular-nums text-emerald-600 dark:text-emerald-400">
            {repeatRatePct}%
          </p>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
            {repeatCount} buyers with 2+ orders
          </p>
        </div>

        {/* Avg. Order Value */}
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10">
              <Coins className="size-3.5 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Avg Order Value
            </span>
          </div>
          <p className="mt-2 text-xl font-black tabular-nums text-foreground">
            GH₵ {avgOrderSpend.toFixed(2)}
          </p>
          <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
            Per transaction average
          </p>
        </div>

        {/* Total Volume */}
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-teal-500/10">
              <Receipt className="size-3.5 text-teal-600 dark:text-teal-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Total Spent
            </span>
          </div>
          <p className="mt-2 text-xl font-black tabular-nums text-foreground">
            GH₵ {totalSpentSum.toFixed(2)}
          </p>
          <p className="text-[10px] text-teal-600 dark:text-teal-400 font-medium">
            Cumulative sales volume
          </p>
        </div>
      </div>

      {/* MASTER CUSTOMERS CARD (Exact Match of AgentTransactionsWallet Card & Table Structure) */}
      <Card className="border-border shadow-xs">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base font-extrabold text-foreground">
                Consolidated Customer Directory
              </CardTitle>
              <CardDescription className="mt-1 text-xs">
                Real-time record of all customers who purchased through your
                storefront link or reseller EVD portal
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        {/* Search + Filters Box (Exact match of AgentTransactionsWallet) */}
        <div className="border-b border-border bg-muted/20 p-4 space-y-4">
          {/* Search input */}
          <div className="space-y-1.5">
            <Label
              htmlFor="cust-search"
              className="text-[10px] font-bold uppercase text-muted-foreground"
            >
              Search customer directory
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="cust-search"
                type="text"
                placeholder="Search by customer name, mobile phone number, or carrier network (e.g. Kojo, 0244192834, MTN)..."
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
                  Customer filters
                </span>
              </div>
              {(searchQuery ||
                networkFilter !== "all" ||
                statusFilter !== "all" ||
                buyerTypeFilter !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setNetworkFilter("all");
                    setStatusFilter("all");
                    setBuyerTypeFilter("all");
                  }}
                  className="h-6 px-2 text-[10px] font-bold text-primary cursor-pointer bg-transparent hover:!bg-transparent hover:text-primary"
                >
                  Reset filters
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {/* Network Select */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="filter-network"
                  className="text-[10px] font-semibold text-muted-foreground"
                >
                  Carrier Network
                </Label>
                <Select value={networkFilter} onValueChange={setNetworkFilter}>
                  <SelectTrigger
                    id="filter-network"
                    className="h-9 w-full text-xs"
                  >
                    <SelectValue placeholder="All Carriers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Carriers</SelectItem>
                    <SelectItem value="mtn">MTN Ghana</SelectItem>
                    <SelectItem value="telecel">Telecel</SelectItem>
                    <SelectItem value="airteltigo">AirtelTigo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status Select */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="filter-status"
                  className="text-[10px] font-semibold text-muted-foreground"
                >
                  Activity Recency
                </Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger
                    id="filter-status"
                    className="h-9 w-full text-xs"
                  >
                    <SelectValue placeholder="All Activity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Activity</SelectItem>
                    <SelectItem value="active">Active (30 Days)</SelectItem>
                    <SelectItem value="inactive">
                      Inactive (&gt;30 Days)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Buyer Type Select */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="filter-buyer"
                  className="text-[10px] font-semibold text-muted-foreground"
                >
                  Customer Segment
                </Label>
                <Select
                  value={buyerTypeFilter}
                  onValueChange={setBuyerTypeFilter}
                >
                  <SelectTrigger
                    id="filter-buyer"
                    className="h-9 w-full text-xs"
                  >
                    <SelectValue placeholder="All Buyers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Buyers</SelectItem>
                    <SelectItem value="repeat">
                      Repeat Buyers (&gt;1 Order)
                    </SelectItem>
                    <SelectItem value="high_value">
                      High Value (&gt;GH₵ 100)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* CUSTOMERS TABLE (Exact Match of AgentTransactionsWallet & AgentPricing Table) */}
        <div className="rounded-xl border border-border overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <Table className="w-full text-xs">
              <TableHeader>
                <TableRow className="border-b border-border bg-muted/40 hover:bg-muted/40">
                  <TableHead className="h-10 px-4 text-left font-bold text-muted-foreground uppercase text-[10px]">
                    Customer &amp; Phone
                  </TableHead>
                  <TableHead className="h-10 px-3 text-left font-bold text-muted-foreground uppercase text-[10px]">
                    Carrier Network
                  </TableHead>
                  <TableHead className="h-10 px-3 text-center font-bold text-muted-foreground uppercase text-[10px]">
                    Orders
                  </TableHead>
                  <TableHead className="h-10 px-3 text-right font-bold text-muted-foreground uppercase text-[10px]">
                    Total Spent
                  </TableHead>
                  <TableHead className="h-10 px-3 text-center font-bold text-muted-foreground uppercase text-[10px]">
                    Status
                  </TableHead>
                  <TableHead className="h-10 px-4 text-right font-bold text-muted-foreground uppercase text-[10px]">
                    Last Order Date
                  </TableHead>
                  <TableHead className="h-10 px-4 text-right font-bold text-muted-foreground uppercase text-[10px]">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/60">
                {paginatedCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-32 text-center text-muted-foreground"
                    >
                      <p className="text-sm font-semibold">
                        No customer records match your filter criteria.
                      </p>
                      <p className="text-xs mt-1">
                        Try changing or clearing your search keywords.
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedCustomers.map((cust) => {
                    const initials = cust.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .substring(0, 2)
                      .toUpperCase();

                    return (
                      <TableRow
                        key={cust.id}
                        onClick={() => setSelectedCust(cust)}
                        className="hover:bg-muted/30 transition-colors cursor-pointer"
                      >
                        {/* Customer Info */}
                        <TableCell className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-xs shrink-0">
                              {initials}
                            </div>
                            <div>
                              <div className="font-bold text-foreground">
                                {cust.name}
                              </div>
                              <span className="font-mono text-[11px] text-muted-foreground block">
                                {cust.phone}
                              </span>
                            </div>
                          </div>
                        </TableCell>

                        {/* Network Badge */}
                        <TableCell className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <div
                              className={`size-2 rounded-full ${
                                cust.net === "MTN"
                                  ? "bg-amber-400"
                                  : cust.net === "Telecel"
                                    ? "bg-red-500"
                                    : "bg-blue-600"
                              }`}
                            />
                            <span className="font-bold text-xs text-foreground">
                              {cust.net}
                            </span>
                          </div>
                        </TableCell>

                        {/* Orders Count */}
                        <TableCell className="py-3 px-3 text-center">
                          <Badge
                            variant="secondary"
                            className="font-bold text-xs px-2.5 py-0.5"
                          >
                            {cust.ordersCount}{" "}
                            {cust.ordersCount === 1 ? "order" : "orders"}
                          </Badge>
                        </TableCell>

                        {/* Total Spent */}
                        <TableCell className="py-3 px-3 text-right font-black text-xs text-foreground tabular-nums">
                          GH₵ {cust.totalSpent.toFixed(2)}
                        </TableCell>

                        {/* Status */}
                        <TableCell className="py-3 px-3 text-center">
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-bold ${
                              cust.status === "active"
                                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                                : "bg-muted text-muted-foreground border-border/80"
                            }`}
                          >
                            {cust.status === "active"
                              ? "Active (30d)"
                              : "Inactive"}
                          </Badge>
                        </TableCell>

                        {/* Last Order Date */}
                        <TableCell className="py-3 px-4 text-right text-muted-foreground whitespace-nowrap">
                          {cust.lastOrderDate}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={(e) => handleCopyPhone(e, cust.phone)}
                              className="h-7 text-[11px] font-semibold gap-1 rounded-lg cursor-pointer"
                              title="Copy Phone Number"
                            >
                              <Copy className="size-3" />
                              <span>
                                {copiedPhone === cust.phone ? "Copied" : "Copy"}
                              </span>
                            </Button>

                            <Button
                              size="xs"
                              onClick={(e) =>
                                handleSendSmsToCustomer(e, cust.phone)
                              }
                              className="h-7 text-[11px] font-bold gap-1 rounded-lg bg-primary text-primary-foreground cursor-pointer shadow-2xs"
                              title="Send SMS Broadcast"
                            >
                              <Send className="size-3" />
                              <span>SMS</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* PAGINATION FOOTER (Exact Match of AgentTransactionsWallet) */}
          <div className="flex items-center justify-between p-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredCustomers.length)}{" "}
              of {filteredCustomers.length} customers
            </p>

            {totalPages > 1 && (
              <Pagination className="mx-0 w-auto">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className={
                        currentPage === 1
                          ? "pointer-events-none opacity-50 text-xs"
                          : "cursor-pointer text-xs"
                      }
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (pageNum) => (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          onClick={() => setCurrentPage(pageNum)}
                          isActive={currentPage === pageNum}
                          className="cursor-pointer text-xs size-8"
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    ),
                  )}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      className={
                        currentPage === totalPages
                          ? "pointer-events-none opacity-50 text-xs"
                          : "cursor-pointer text-xs"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        </div>
      </Card>

      {/* CUSTOMER DETAIL MODAL DIALOG (Exact Match of AgentTransactionsWallet Detail Modal) */}
      <Dialog
        open={!!selectedCust}
        onOpenChange={(open) => !open && setSelectedCust(null)}
      >
        {selectedCust && (
          <DialogContent className="sm:max-w-md border-border bg-card">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-extrabold text-foreground">
                <Users className="size-5 text-primary" />
                <span>Customer Profile Details</span>
              </DialogTitle>
              <DialogDescription className="text-xs">
                Detailed purchase history and carrier breakdown for{" "}
                <span className="font-bold text-foreground">
                  {selectedCust.name}
                </span>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Customer Name</span>
                  <span className="font-bold text-foreground">
                    {selectedCust.name}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Mobile Number</span>
                  <span className="font-mono font-bold text-foreground">
                    {selectedCust.phone}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Primary Carrier</span>
                  <Badge variant="outline" className="font-bold text-xs">
                    {selectedCust.net}
                  </Badge>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">
                    Total Orders Placed
                  </span>
                  <span className="font-bold text-foreground">
                    {selectedCust.ordersCount} orders
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">
                    Total Cumulative Spent
                  </span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                    GH₵ {selectedCust.totalSpent.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Last Order Date</span>
                  <span className="font-semibold text-foreground">
                    {selectedCust.lastOrderDate}
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedCust(null)}
                className="text-xs font-bold"
              >
                Close
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  const phone = selectedCust.phone;
                  setSelectedCust(null);
                  if (onNavigateTab) onNavigateTab("bulk-sms");
                }}
                className="text-xs font-bold gap-1.5 bg-primary text-primary-foreground"
              >
                <Send className="size-3.5" />
                <span>Send SMS Outreach</span>
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};

export default AgentCustomersView;

import React, { useState, useEffect } from "react";
import {
  Wallet,
  Clock,
  MessageSquareWarning,
  BookOpen,
  User,
  Search,
  CheckCircle2,
  AlertCircle,
  Plus,
  Send,
  ShieldCheck,
  Bell,
  Check,
  Trash2,
  KeyRound,
  Palette,
  Laptop,
  Lock,
} from "lucide-react";
import { Order, Transaction, Complaint, AppTheme } from "../../types";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
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
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../ui/pagination";


interface CustomerWalletOrdersProps {
  view:
    | "wallet"
    | "orders"
    | "complaints"
    | "guides"
    | "profile"
    | "notifications";
  walletBalance: number;
  onOpenFundWallet: () => void;
  orders: Order[];
  transactions: Transaction[];
  complaints: Complaint[];
  onOpenReceipt: (order: Order) => void;
  onAddComplaint: (ticket: Complaint) => void;
  onReplyComplaint: (ticketId: string, message: string) => void;
  theme: AppTheme;
  onToggleTheme: () => void;
  onSetTheme?: (theme: AppTheme) => void;
  onOpenSecurityPins?: () => void;
}

export const CustomerWalletOrders: React.FC<CustomerWalletOrdersProps> = ({
  view,
  walletBalance,
  onOpenFundWallet,
  orders,
  transactions,
  complaints,
  onOpenReceipt,
  onAddComplaint,
  onReplyComplaint,
  theme,
  onToggleTheme,
  onSetTheme,
  onOpenSecurityPins,
}) => {
  // Pagination constants
  const ORDERS_PER_PAGE = 5;
  const TX_PER_PAGE = 5;

  // Orders State & Deep Filters
  const [orderSearch, setOrderSearch] = useState("");
  const [orderFilterStatus, setOrderFilterStatus] = useState<string>("all");
  const [orderNetworkFilter, setOrderNetworkFilter] = useState<string>("all");
  const [orderServiceFilter, setOrderServiceFilter] = useState<string>("all");
  const [orderSortBy, setOrderSortBy] = useState<string>("newest");
  const [ordersPage, setOrdersPage] = useState(1);

  // Transactions State & Filters
  const [txSearch, setTxSearch] = useState("");
  const [txTypeFilter, setTxTypeFilter] = useState<string>("all");
  const [txChannelFilter, setTxChannelFilter] = useState<string>("all");
  const [txPage, setTxPage] = useState(1);

  // Notifications State
  const [notifications, setNotifications] = useState([
    {
      id: "ntf-1",
      title: "MTN 5GB Bundle Delivered",
      message:
        "Order SDH-GH-2026-94814 for 0244192834 has been successfully credited via MTN EVD.",
      category: "orders",
      date: "10 mins ago",
      read: false,
      ref: "SDH-GH-2026-94814",
    },
    {
      id: "ntf-2",
      title: "Carrier Gateway Speed Alert",
      message:
        "Telecel Ghana EVD latency reduced to 45ms. Core switches operating at 99.8% delivery uptime.",
      category: "gateway",
      date: "1 hour ago",
      read: false,
    },
    {
      id: "ntf-3",
      title: "Wallet Funded Successfully",
      message:
        "Your wallet has been credited with GH₵ 100.00 via MTN Mobile Money. Reference: SDH-TOP-9412.",
      category: "wallet",
      date: "3 hours ago",
      read: true,
    },
    {
      id: "ntf-4",
      title: "Weekend Promo: 10GB Data at Wholesale",
      message:
        "Enjoy special discount on Turbonet and non-expiry bundles this Saturday across all networks.",
      category: "promo",
      date: "Yesterday",
      read: true,
    },
  ]);
  const [notificationCategory, setNotificationCategory] =
    useState<string>("all");

  // Profile Form & Security State
  const [currentPinInput, setCurrentPinInput] = useState("2026");
  const [newPinInput, setNewPinInput] = useState("");
  const [pinChangeSuccess, setPinChangeSuccess] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // Complaints State
  const [selectedTicketId, setSelectedTicketId] = useState<string>(
    complaints[0]?.id || "",
  );
  const [newReplyText, setNewReplyText] = useState("");
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [ticketCategory, setTicketCategory] =
    useState<Complaint["category"]>("delivery_delay");
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketOrderRef, setTicketOrderRef] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");

  // Guides Search
  const [guideSearch, setGuideSearch] = useState("");

  const selectedTicket =
    complaints.find((c) => c.id === selectedTicketId) || complaints[0];

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

  useEffect(() => {
    setTxPage(1);
  }, [txSearch, txTypeFilter, txChannelFilter]);

  // Robust Orders Filtering & Sorting
  const filteredOrders = orders
    .filter((o) => {
      const q = orderSearch.toLowerCase().trim();
      const matchesQuery =
        !q ||
        o.reference.toLowerCase().includes(q) ||
        o.recipientPhone.includes(q) ||
        o.productName.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q);
      const matchesStatus =
        orderFilterStatus === "all" || o.status === orderFilterStatus;
      const matchesNetwork =
        orderNetworkFilter === "all" || o.network === orderNetworkFilter;
      const matchesService =
        orderServiceFilter === "all" ||
        (o.serviceType &&
          o.serviceType.toLowerCase().includes(orderServiceFilter.toLowerCase()));
      return matchesQuery && matchesStatus && matchesNetwork && matchesService;
    })
    .sort((a, b) => {
      if (orderSortBy === "amount-high") return b.amount - a.amount;
      if (orderSortBy === "amount-low") return a.amount - b.amount;
      if (orderSortBy === "oldest")
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

  // Robust Transactions Filtering
  const filteredTransactions = transactions.filter((tx) => {
    const q = txSearch.toLowerCase().trim();
    const matchesQuery =
      !q ||
      tx.reference.toLowerCase().includes(q) ||
      tx.description.toLowerCase().includes(q) ||
      tx.channel.toLowerCase().includes(q);
    const matchesType = txTypeFilter === "all" || tx.type === txTypeFilter;
    const matchesChannel =
      txChannelFilter === "all" ||
      tx.channel.toLowerCase().includes(txChannelFilter.toLowerCase());
    return matchesQuery && matchesType && matchesChannel;
  });

  // Pagination calculations
  const totalOrderPages = Math.max(1, Math.ceil(filteredOrders.length / ORDERS_PER_PAGE));
  const totalTxPages = Math.max(1, Math.ceil(filteredTransactions.length / TX_PER_PAGE));
  const paginatedOrders = filteredOrders.slice(
    (ordersPage - 1) * ORDERS_PER_PAGE,
    ordersPage * ORDERS_PER_PAGE,
  );
  const paginatedTransactions = filteredTransactions.slice(
    (txPage - 1) * TX_PER_PAGE,
    txPage * TX_PER_PAGE,
  );

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReplyText.trim() || !selectedTicket) return;
    onReplyComplaint(selectedTicket.id, newReplyText.trim());
    setNewReplyText("");
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject || !ticketMessage) return;

    const newTicket: Complaint = {
      id: `cmp-${Date.now()}`,
      ticketNumber: `TKT-SDH-${Math.floor(1000 + Math.random() * 9000)}`,
      orderReference: ticketOrderRef || undefined,
      category: ticketCategory,
      subject: ticketSubject,
      status: "open",
      priority: "high",
      createdAt: new Date().toISOString().replace("T", " ").slice(0, 16),
      lastUpdated: new Date().toISOString().replace("T", " ").slice(0, 16),
      messages: [
        {
          id: `m-${Date.now()}`,
          sender: "customer",
          senderName: "Kojo Mensah",
          text: ticketMessage,
          timestamp: "Just now",
        },
      ],
    };

    onAddComplaint(newTicket);
    setSelectedTicketId(newTicket.id);
    setShowNewTicketModal(false);
    setTicketSubject("");
    setTicketMessage("");
    setTicketOrderRef("");
    setTicketCategory("delivery_delay");
  };

  const guides = [
    {
      title: "How to Authorize MTN Mobile Money USSD Prompts",
      category: "Payments",
      readTime: "2 min",
      content:
        "When funding your SDH wallet or buying directly with MoMo, a prompt appears on your handset requesting your 4-digit PIN. If it does not appear within 30 seconds, dial *170# -> My Wallet -> Approvals.",
    },
    {
      title: "Checking WASSCE & BECE Results on WAEC Portal",
      category: "Result Checkers",
      readTime: "3 min",
      content:
        "1. Copy your Serial Number and PIN from the SDH Voucher card. 2. Visit ghana.waecdirect.org. 3. Enter your Index Number, Examination Year, and Card Details. 4. Click Submit to reveal grades.",
    },
    {
      title: "AFA Registration Requirements & Timeline",
      category: "AFA Registration",
      readTime: "4 min",
      content:
        "AFA tariff whitelisting requires an active Ghana Card registered to your SIM card. After submitting your application on SDH, approval takes 24 to 48 business hours via the Ministry of Agriculture portal.",
    },
    {
      title: "Starting Your Own Branded Reseller Store",
      category: "Agent Program",
      readTime: "5 min",
      content:
        "Agents receive wholesale pricing on all networks. In the Agent Workspace, set your custom retail prices and copy your unique link (smartdatahub.com/store/your-name) to share with your customer base.",
    },
  ];

  // Pagination renderer helper
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
      {/* VIEW: WALLET & LEDGER */}
      {view === "wallet" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border">
            <div>
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
                <Wallet className="w-6 h-6 text-primary" />
                <span>Wallet & Financial Ledger</span>
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Real-time ledger of top-ups, purchases, refunds, and available
                balance.
              </p>
            </div>
            <Button
              onClick={onOpenFundWallet}
              className="px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-1" />
              Fund Wallet
            </Button>
          </div>

          {/* Balances Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-card border border-border shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Available Cash
              </span>
              <div className="text-3xl font-black text-foreground tabular-nums mt-1">
                GH₵ {walletBalance.toFixed(2)}
              </div>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Ready for instant checkout</span>
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-card border border-border shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Promo Credits
              </span>
              <div className="text-3xl font-black text-foreground tabular-nums mt-1">
                GH₵ 5.00
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Applies automatically to purchases
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-card border border-border shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Recharge Channels
              </span>
              <div className="text-sm font-bold text-foreground mt-2 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-amber-400 text-amber-950 text-xs">
                  MTN
                </span>
                <span className="px-2 py-0.5 rounded bg-red-600 text-white text-xs">
                  Telecel
                </span>
                <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-xs">
                  AT
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Instant USSD & Bank card
              </p>
            </div>
          </div>

          {/* Transactions Ledger Table with Search & Filters */}
          <Card className="border-border shadow-xs">
            <CardHeader className="pb-3 border-b border-border">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <CardTitle className="text-base font-extrabold text-foreground flex items-center gap-2">
                    <span>Transaction History & Ledger</span>
                    <Badge variant="outline" className="text-xs font-mono">
                      {filteredTransactions.length} of {transactions.length}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Filtered audit log of credits, debits, and balance updates.
                  </CardDescription>
                </div>

                {/* Filters Row */}
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-48">
                    <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search ref or note..."
                      value={txSearch}
                      onChange={(e) => setTxSearch(e.target.value)}
                      className="h-8 pl-8 text-xs"
                    />
                  </div>

                  <Select value={txTypeFilter} onValueChange={setTxTypeFilter}>
                    <SelectTrigger className="h-8 w-32 text-xs">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="credit">Credits (+)</SelectItem>
                      <SelectItem value="debit">Debits (-)</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={txChannelFilter}
                    onValueChange={setTxChannelFilter}
                  >
                    <SelectTrigger className="h-8 w-36 text-xs">
                      <SelectValue placeholder="All Channels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Channels</SelectItem>
                      <SelectItem value="MTN">MTN MoMo</SelectItem>
                      <SelectItem value="Telecel">Telecel Cash</SelectItem>
                      <SelectItem value="AT">AT Money</SelectItem>
                      <SelectItem value="Wallet">Wallet Auto</SelectItem>
                    </SelectContent>
                  </Select>

                  {(txSearch ||
                    txTypeFilter !== "all" ||
                    txChannelFilter !== "all") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setTxSearch("");
                        setTxTypeFilter("all");
                        setTxChannelFilter("all");
                      }}
                      className="h-8 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Reset
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Balance After</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-8 text-muted-foreground"
                      >
                        <div className="flex flex-col items-center justify-center space-y-1">
                          <AlertCircle className="w-5 h-5 text-muted-foreground/60" />
                          <p className="text-xs font-semibold">
                            No transactions match your search filters.
                          </p>
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => {
                              setTxSearch("");
                              setTxTypeFilter("all");
                              setTxChannelFilter("all");
                            }}
                            className="text-xs"
                          >
                            Clear all filters
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedTransactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="font-mono font-bold text-foreground">
                          {tx.reference}
                        </TableCell>
                        <TableCell className="text-muted-foreground tabular-nums text-xs">
                          {tx.date}
                        </TableCell>
                        <TableCell className="font-medium text-foreground">
                          {tx.description}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="text-[10px] font-semibold"
                          >
                            {tx.channel}
                          </Badge>
                        </TableCell>
                        <TableCell
                          className={`text-right font-black tabular-nums ${
                            tx.type === "credit"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-foreground"
                          }`}
                        >
                          {tx.type === "credit" ? "+" : "-"}GH₵{" "}
                          {tx.amount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground tabular-nums font-mono text-xs">
                          GH₵ {tx.balanceAfter.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {filteredTransactions.length > TX_PER_PAGE && (
                <div className="px-4 pb-4">
                  {renderPagination(txPage, totalTxPages, setTxPage)}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* VIEW: ORDERS WITH FULL SEARCH & MULTI-FILTERS */}
      {view === "orders" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border">
            <div>
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
                <Clock className="w-6 h-6 text-primary" />
                <span>My Orders & Dispatch Deliveries</span>
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Inspect upstream dispatch status, download authentic receipts,
                or repeat purchases.
              </p>
            </div>
          </div>

          {/* Deep Search & Multi-Filters Toolbar */}
          <Card className="border-border !pt-0 shadow-xs">
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
                {/* Search query */}
                <div className="relative lg:col-span-2">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search reference, recipient phone, or package..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="pl-9 h-9 text-xs"
                  />
                </div>

                {/* Status Filter */}
                <Select
                  value={orderFilterStatus}
                  onValueChange={setOrderFilterStatus}
                >
                  <SelectTrigger className="h-9 text-xs w-full">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="delivered">Delivered (Success)</SelectItem>
                    <SelectItem value="processing">Processing (In Flight)</SelectItem>
                    <SelectItem value="pending">Pending Gateway</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>

                {/* Network Filter */}
                <Select
                  value={orderNetworkFilter}
                  onValueChange={setOrderNetworkFilter}
                >
                  <SelectTrigger className="h-9 text-xs w-full">
                    <SelectValue placeholder="All Networks" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Networks</SelectItem>
                    <SelectItem value="MTN">MTN Ghana</SelectItem>
                    <SelectItem value="Telecel">Telecel Ghana</SelectItem>
                    <SelectItem value="AirtelTigo">AT (AirtelTigo)</SelectItem>
                  </SelectContent>
                </Select>

                {/* Type Filter - Airtime/Data */}
                <Select
                  value={orderServiceFilter}
                  onValueChange={setOrderServiceFilter}
                >
                  <SelectTrigger className="h-9 text-xs w-full">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="airtime">Airtime</SelectItem>
                    <SelectItem value="data">Data Bundle</SelectItem>
                    <SelectItem value="sms">SMS Package</SelectItem>
                    <SelectItem value="voucher">Voucher</SelectItem>
                  </SelectContent>
                </Select>

                {/* Sort Order */}
                <Select value={orderSortBy} onValueChange={setOrderSortBy}>
                  <SelectTrigger className="h-9 text-xs w-full">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Sort: Newest First</SelectItem>
                    <SelectItem value="oldest">Sort: Oldest First</SelectItem>
                    <SelectItem value="amount-high">Amount: High to Low</SelectItem>
                    <SelectItem value="amount-low">Amount: Low to High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Active Filters Indicator — clear button only, count moves to pagination footer */}
              {(orderSearch ||
                orderFilterStatus !== "all" ||
                orderNetworkFilter !== "all" ||
                orderServiceFilter !== "all" ||
                orderSortBy !== "newest") && (
                <div className="flex justify-end pt-2 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setOrderSearch("");
                      setOrderFilterStatus("all");
                      setOrderNetworkFilter("all");
                      setOrderServiceFilter("all");
                      setOrderSortBy("newest");
                    }}
                    className="h-7 px-2 text-xs text-primary font-bold"
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

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
                          className="text-center py-10 text-muted-foreground"
                        >
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <Search className="w-8 h-8 text-muted-foreground/40" />
                            <p className="text-sm font-bold text-foreground">
                              No matching orders found
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Try adjusting your keyword or status filters.
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setOrderSearch("");
                                setOrderFilterStatus("all");
                                setOrderNetworkFilter("all");
                                setOrderServiceFilter("all");
                              }}
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
                              className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
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
                          <TableCell className="font-mono font-bold text-xs text-foreground">
                            {order.reference}
                          </TableCell>
                          <TableCell className="font-bold text-xs text-foreground">
                            {order.productName}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {order.recipientPhone}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground tabular-nums">
                            {order.date}
                          </TableCell>
                          <TableCell className="text-right font-black text-foreground tabular-nums text-xs">
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

                {/* Pagination footer — count left, controls right */}
                <div className="flex items-center justify-between gap-4 border-t border-border px-4 py-3">
                  <span className="text-xs text-muted-foreground shrink-0">
                    Showing{" "}
                    <span className="font-bold text-foreground">
                      {Math.min(ordersPage * ORDERS_PER_PAGE, filteredOrders.length)}
                    </span>{" "}
                    of{" "}
                    <span className="font-bold text-foreground">
                      {filteredOrders.length}
                    </span>{" "}
                    orders
                  </span>
                  {filteredOrders.length > ORDERS_PER_PAGE && (
                    <div className="flex justify-end">
                      {renderPagination(ordersPage, totalOrderPages, setOrdersPage)}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
        </div>
      )}

      {/* VIEW: COMPLAINTS & SUPPORT */}
      {view === "complaints" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-border">
            <div>
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
                <MessageSquareWarning className="w-6 h-6 text-amber-600" />
                <span>Complaints & Support Tickets</span>
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Direct communication with SDH Network Operations Center (NOC)
                engineers.
              </p>
            </div>
            <Button
              onClick={() => setShowNewTicketModal(true)}
              className="px-4 py-2 rounded-xl font-bold text-xs shadow-xs"
            >
              <Plus className="w-4 h-4 mr-1" />
              New Ticket
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Tickets Sidebar */}
            <div className="lg:col-span-4 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Your Tickets
              </span>
              {complaints.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setSelectedTicketId(c.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    selectedTicket?.id === c.id
                      ? "border-primary bg-primary/10 ring-2 ring-primary/30 shadow-xs"
                      : "border-border bg-card hover:bg-muted/40"
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-mono text-[11px] font-bold text-foreground">
                      {c.ticketNumber}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500/15 text-amber-900 dark:text-amber-300">
                      {c.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-foreground line-clamp-1">
                    {c.subject}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1">
                    Updated {c.lastUpdated}
                  </div>
                </div>
              ))}
            </div>

            {/* Selected Ticket Conversation Thread */}
            <div className="lg:col-span-8">
              {selectedTicket ? (
                <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-4 flex flex-col h-[520px]">
                  <div className="pb-3 border-b border-border flex justify-between items-start">
                    <div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {selectedTicket.ticketNumber}
                      </div>
                      <h3 className="font-bold text-sm text-foreground">
                        {selectedTicket.subject}
                      </h3>
                      {selectedTicket.orderReference && (
                        <div className="text-[11px] text-primary font-mono mt-0.5">
                          Order Ref: {selectedTicket.orderReference}
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-primary/10 text-primary">
                      {selectedTicket.category.replace("_", " ").toUpperCase()}
                    </span>
                  </div>

                  {/* Messages Feed */}
                  <div className="flex-1 overflow-y-auto space-y-3 p-2">
                    {selectedTicket.messages.map((m) => {
                      const isCustomer = m.sender === "customer";
                      return (
                        <div
                          key={m.id}
                          className={`flex flex-col ${isCustomer ? "items-end" : "items-start"}`}
                        >
                          <div className="text-[10px] text-muted-foreground mb-1">
                            {m.senderName} • {m.timestamp}
                          </div>
                          <div
                            className={`p-3 rounded-2xl text-xs max-w-md ${
                              isCustomer
                                ? "bg-primary text-primary-foreground rounded-tr-xs"
                                : "bg-muted text-foreground border border-border rounded-tl-xs"
                            }`}
                          >
                            {m.text}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Reply Composer */}
                  <form
                    onSubmit={handleSendReply}
                    className="pt-3 border-t border-border flex gap-2"
                  >
                    <Input
                      type="text"
                      placeholder="Type your reply to SDH NOC support..."
                      value={newReplyText}
                      onChange={(e) => setNewReplyText(e.target.value)}
                      className="flex-1"
                    />
                    <Button type="submit" size="sm" className="text-xs">
                      <Send className="w-3.5 h-3.5 mr-1" />
                      Send
                    </Button>
                  </form>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  Select a ticket to view message thread.
                </div>
              )}
            </div>
          </div>

          {/* New Ticket Dialog (shadcn) */}
          <Dialog open={showNewTicketModal} onOpenChange={setShowNewTicketModal}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Open Support Complaint</DialogTitle>
                <DialogDescription>
                  Submit a new ticket to SDH NOC support. We'll respond within 24
                  hours.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
                <div className="space-y-2">
                  <Label htmlFor="ticket-category">Category</Label>
                  <Select
                    value={ticketCategory}
                    onValueChange={(val) =>
                      setTicketCategory(val as Complaint["category"])
                    }
                  >
                    <SelectTrigger id="ticket-category" className="w-full">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="delivery_delay">Delivery Delay</SelectItem>
                      <SelectItem value="failed_recharge">
                        Failed Recharge / No SMS
                      </SelectItem>
                      <SelectItem value="momo_debit_no_credit">
                        MoMo Debited with No Credit
                      </SelectItem>
                      <SelectItem value="wrong_number">
                        Wrong Recipient Number
                      </SelectItem>
                      <SelectItem value="general">General Help</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ticket-order-ref">
                    Related Order Reference (Optional)
                  </Label>
                  <Input
                    id="ticket-order-ref"
                    type="text"
                    placeholder="e.g. SDH-GH-2026-94814"
                    value={ticketOrderRef}
                    onChange={(e) => setTicketOrderRef(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ticket-subject">Subject</Label>
                  <Input
                    id="ticket-subject"
                    type="text"
                    required
                    placeholder="Brief summary of issue..."
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ticket-message">Detailed Description</Label>
                  <Textarea
                    id="ticket-message"
                    rows={4}
                    required
                    placeholder="Describe what happened..."
                    value={ticketMessage}
                    onChange={(e) => setTicketMessage(e.target.value)}
                  />
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowNewTicketModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Submit Ticket</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* VIEW: HOW-TO GUIDES */}
      {view === "guides" && (
        <div className="space-y-6">
          <div className="pb-4 border-b border-border">
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-primary" />
              <span>How-to Guides & Ghana Telecom Tutorials</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Knowledge base on network codes, MoMo approvals, result checkers,
              and SIM settings.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {guides.map((g, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-card border border-border shadow-2xs space-y-2"
              >
                <div className="flex justify-between items-center text-[10px] uppercase font-bold text-primary">
                  <span>{g.category}</span>
                  <span className="text-muted-foreground">
                    {g.readTime} read
                  </span>
                </div>
                <h3 className="font-bold text-sm text-foreground">{g.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {g.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: NOTIFICATIONS */}
      {view === "notifications" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-border">
            <div>
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
                <Bell className="w-6 h-6 text-primary" />
                <span>Notifications & System Dispatches</span>
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Real-time carrier delivery confirmations, gateway updates, and
                promotional tariffs.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setNotifications((prev) =>
                    prev.map((n) => ({ ...n, read: true })),
                  )
                }
                className="text-xs font-semibold"
              >
                <Check className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                Mark All Read
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setNotifications([])}
                className="text-muted-foreground hover:text-destructive"
                title="Clear notifications"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {["all", "orders", "gateway", "wallet", "promo"].map((cat) => (
              <Button
                key={cat}
                variant={notificationCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setNotificationCategory(cat)}
                className="uppercase font-bold text-[11px] tracking-wide"
              >
                {cat}
              </Button>
            ))}
          </div>

          {/* Notifications List */}
          <div className="space-y-3">
            {notifications.filter(
              (n) =>
                notificationCategory === "all" ||
                n.category === notificationCategory,
            ).length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-card border border-border space-y-2">
                <Bell className="w-8 h-8 text-muted-foreground mx-auto opacity-40" />
                <p className="text-sm font-bold text-foreground">
                  No notifications in this category
                </p>
                <p className="text-xs text-muted-foreground">
                  You are completely up to date.
                </p>
              </div>
            ) : (
              notifications
                .filter(
                  (n) =>
                    notificationCategory === "all" ||
                    n.category === notificationCategory,
                )
                .map((item) => (
                  <div
                    key={item.id}
                    className={`p-5 rounded-2xl bg-card border shadow-2xs transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${
                      item.read
                        ? "border-border opacity-85"
                        : "border-primary/40 ring-1 ring-primary/20"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {!item.read && (
                          <span className="w-2 h-2 rounded-full bg-primary" />
                        )}
                        <span className="font-extrabold text-sm text-foreground">
                          {item.title}
                        </span>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded-md bg-muted text-muted-foreground">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {item.message}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground pt-1">
                        <Clock className="w-3 h-3" />
                        <span>{item.date}</span>
                        {item.ref && (
                          <>
                            <span>•</span>
                            <span className="font-mono">{item.ref}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {!item.read && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setNotifications((prev) =>
                            prev.map((n) =>
                              n.id === item.id ? { ...n, read: true } : n,
                            ),
                          )
                        }
                        className="text-xs font-semibold shrink-0"
                      >
                        Acknowledge
                      </Button>
                    )}
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* VIEW: PROFILE & SETTINGS */}
      {view === "profile" && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="pb-4 border-b border-border">
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
              <User className="w-6 h-6 text-primary" />
              <span>Profile, Security & Preferences</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage personal identity, Ghana Card KYC, transaction security
              PINs, and theme styles.
            </p>
          </div>

          {profileSaved && (
            <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" />
              <span>
                Profile information successfully saved and synced with SDH
                identity services.
              </span>
            </div>
          )}

          {/* Personal & Ghana Card Info Card */}
          <div className="p-6 rounded-3xl bg-card border border-border shadow-xs space-y-5 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                <span>Personal & Ghana Card Verification</span>
              </h3>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-bold text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified Subscriber</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="profile-name">Full Legal Name</Label>
                <Input
                  id="profile-name"
                  type="text"
                  defaultValue="Kojo Mensah"
                  className="font-medium"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-mobile">Primary Mobile Number</Label>
                <Input
                  id="profile-mobile"
                  type="tel"
                  defaultValue="0244192834"
                  className="tabular-nums font-mono font-medium"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-email">Email Address</Label>
                <Input
                  id="profile-email"
                  type="email"
                  defaultValue="kojomensah94@gmail.com"
                  className="font-medium"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-ghana-card">
                  Ghana Card Number (NIA)
                </Label>
                <Input
                  id="profile-ghana-card"
                  type="text"
                  disabled
                  defaultValue="GHA-721948192-3"
                  className="font-mono font-bold cursor-not-allowed"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-border">
              <Button
                type="button"
                onClick={() => {
                  setProfileSaved(true);
                  setTimeout(() => setProfileSaved(false), 3000);
                }}
                className="font-bold text-xs shadow-2xs"
              >
                Save Account Changes
              </Button>
            </div>
          </div>

          {/* Theme Selector Section (Dropdown & Cards) */}
          <div className="p-6 rounded-3xl bg-card border border-border shadow-xs space-y-4 text-xs">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                  <Palette className="w-4 h-4 text-primary" />
                  <span>Application Theme & Color Archetype</span>
                </h3>
                <p className="text-muted-foreground text-[11px] mt-0.5">
                  Select from 6 bespoke color archetypes crafted for high
                  contrast, day & night readability.
                </p>
              </div>
              {onSetTheme && (
                <Select
                  value={theme}
                  onValueChange={(v) => onSetTheme(v as AppTheme)}
                >
                  <SelectTrigger className="w-56">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">☀️ Daylight Clean</SelectItem>
                    <SelectItem value="dark">🌙 Midnight Obsidian</SelectItem>
                    <SelectItem value="sunset-amber">
                      🌅 Sunset Amber
                    </SelectItem>
                    <SelectItem value="emerald-matrix">
                      🌲 Emerald Matrix
                    </SelectItem>
                    <SelectItem value="royal-indigo">
                      ⚡ Royal Indigo
                    </SelectItem>
                    <SelectItem value="ruby-red">💎 Ruby Red</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              {[
                { id: "light", name: "Daylight Clean", dot: "bg-blue-600" },
                {
                  id: "dark",
                  name: "Midnight Obsidian",
                  dot: "bg-slate-900 border border-slate-700",
                },
                {
                  id: "ghana-gold",
                  name: "Ghana Black Star Gold",
                  dot: "bg-amber-400",
                },
                {
                  id: "emerald-matrix",
                  name: "Emerald Matrix",
                  dot: "bg-emerald-500",
                },
                {
                  id: "royal-indigo",
                  name: "Royal Indigo",
                  dot: "bg-indigo-600",
                },
                {
                  id: "crimson-telecel",
                  name: "Crimson Telecel",
                  dot: "bg-red-600",
                },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => onSetTheme?.(t.id as AppTheme)}
                  className={`p-3 rounded-2xl border text-left flex items-center justify-between cursor-pointer transition-all ${
                    theme === t.id
                      ? "border-primary bg-primary/10 shadow-2xs font-bold text-foreground"
                      : "border-border bg-muted/30 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-3.5 h-3.5 rounded-full ${t.dot}`} />
                    <span className="text-xs">{t.name}</span>
                  </div>
                  {theme === t.id && (
                    <Check className="w-3.5 h-3.5 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Security & Transaction PIN Settings */}
          <div className="p-6 rounded-3xl bg-card border border-border shadow-xs space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                  <Lock className="w-4 h-4 text-primary" />
                  <span>Wallet & Transaction Security PIN</span>
                </h3>
                <p className="text-muted-foreground text-[11px] mt-0.5">
                  Protects your wallet debits and large airtime / data top-ups.
                </p>
              </div>
              {onOpenSecurityPins && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={onOpenSecurityPins}
                  className="text-xs font-bold flex items-center gap-1 h-auto p-0"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>View All Hardcoded PINs</span>
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="current-pin">
                  Current PIN (Hardcoded: 2026)
                </Label>
                <Input
                  id="current-pin"
                  type="password"
                  maxLength={4}
                  value={currentPinInput}
                  onChange={(e) => setCurrentPinInput(e.target.value)}
                  className="font-mono tabular-nums text-center text-sm font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-pin">New 4-Digit PIN</Label>
                <Input
                  id="new-pin"
                  type="password"
                  maxLength={4}
                  placeholder="Enter new 4 digits"
                  value={newPinInput}
                  onChange={(e) => setNewPinInput(e.target.value)}
                  className="font-mono tabular-nums text-center text-sm font-bold"
                />
              </div>
            </div>

            {pinChangeSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-bold text-[11px] flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>
                  Security PIN updated successfully to {newPinInput || "2026"}.
                </span>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                type="button"
                onClick={() => {
                  setPinChangeSuccess(true);
                  setTimeout(() => setPinChangeSuccess(false), 3000);
                }}
                className="font-bold text-xs"
              >
                Update Security PIN
              </Button>
            </div>
          </div>

          {/* Active Sessions */}
          <div className="p-6 rounded-3xl bg-card border border-border shadow-xs space-y-3 text-xs">
            <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2">
              <Laptop className="w-4 h-4 text-primary" />
              <span>Active Verified Sessions</span>
            </h3>

            <div className="divide-y divide-border/60">
              <div className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-bold text-foreground">
                    Accra, Ghana • Chrome on macOS (Current Device)
                  </div>
                  <div className="text-muted-foreground text-[11px]">
                    IP: 102.176.64.12 • Active Now
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-bold text-[10px]">
                  Online
                </span>
              </div>

              <div className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-bold text-foreground">
                    Kumasi, Ghana • Mobile Safari on iPhone 15
                  </div>
                  <div className="text-muted-foreground text-[11px]">
                    IP: 154.160.2.89 • 2 hours ago
                  </div>
                </div>
                <Button
                  variant="link"
                  size="sm"
                  className="text-xs text-destructive hover:no-underline p-0 h-auto font-semibold"
                >
                  Revoke
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

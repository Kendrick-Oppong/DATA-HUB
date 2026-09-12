import React, { useState } from 'react';
import {
  Wallet,
  Clock,
  MessageSquareWarning,
  BookOpen,
  User,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  AlertCircle,
  Plus,
  Send,
  RotateCcw,
  ExternalLink,
  ShieldCheck,
  Smartphone,
  Bell,
  Check,
  Trash2,
  KeyRound,
  Palette,
  Laptop,
  CreditCard,
  Lock
} from 'lucide-react';
import { Order, Transaction, Complaint, AppTheme } from '../../types';
import { SignalRail } from '../common/SignalRail';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Select } from '../ui/select';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '../ui/table';

interface CustomerWalletOrdersProps {
  view: 'wallet' | 'orders' | 'complaints' | 'guides' | 'profile' | 'notifications';
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
  // Orders State & Deep Filters
  const [orderSearch, setOrderSearch] = useState('');
  const [orderFilterStatus, setOrderFilterStatus] = useState<string>('all');
  const [orderNetworkFilter, setOrderNetworkFilter] = useState<string>('all');
  const [orderServiceFilter, setOrderServiceFilter] = useState<string>('all');
  const [orderSortBy, setOrderSortBy] = useState<string>('newest');
  const [orderViewMode, setOrderViewMode] = useState<'table' | 'cards'>('table');

  // Transactions State & Filters
  const [txSearch, setTxSearch] = useState('');
  const [txTypeFilter, setTxTypeFilter] = useState<string>('all');
  const [txChannelFilter, setTxChannelFilter] = useState<string>('all');

  // Notifications State
  const [notifications, setNotifications] = useState([
    {
      id: 'ntf-1',
      title: 'MTN 5GB Bundle Delivered',
      message: 'Order SDH-GH-2026-94814 for 0244192834 has been successfully credited via MTN EVD.',
      category: 'orders',
      date: '10 mins ago',
      read: false,
      ref: 'SDH-GH-2026-94814'
    },
    {
      id: 'ntf-2',
      title: 'Carrier Gateway Speed Alert',
      message: 'Telecel Ghana EVD latency reduced to 45ms. Core switches operating at 99.8% delivery uptime.',
      category: 'gateway',
      date: '1 hour ago',
      read: false
    },
    {
      id: 'ntf-3',
      title: 'Wallet Funded Successfully',
      message: 'Your wallet has been credited with GH₵ 100.00 via MTN Mobile Money. Reference: SDH-TOP-9412.',
      category: 'wallet',
      date: '3 hours ago',
      read: true
    },
    {
      id: 'ntf-4',
      title: 'Weekend Promo: 10GB Data at Wholesale',
      message: 'Enjoy special discount on Turbonet and non-expiry bundles this Saturday across all networks.',
      category: 'promo',
      date: 'Yesterday',
      read: true
    }
  ]);
  const [notificationCategory, setNotificationCategory] = useState<string>('all');

  // Profile Form & Security State
  const [currentPinInput, setCurrentPinInput] = useState('2026');
  const [newPinInput, setNewPinInput] = useState('');
  const [pinChangeSuccess, setPinChangeSuccess] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // Complaints State
  const [selectedTicketId, setSelectedTicketId] = useState<string>(complaints[0]?.id || '');
  const [newReplyText, setNewReplyText] = useState('');
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [ticketCategory, setTicketCategory] = useState<any>('delivery_delay');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketOrderRef, setTicketOrderRef] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');

  // Guides Search
  const [guideSearch, setGuideSearch] = useState('');

  const selectedTicket = complaints.find((c) => c.id === selectedTicketId) || complaints[0];

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
      const matchesStatus = orderFilterStatus === 'all' || o.status === orderFilterStatus;
      const matchesNetwork = orderNetworkFilter === 'all' || o.network === orderNetworkFilter;
      const matchesService = orderServiceFilter === 'all' || o.serviceType === orderServiceFilter;
      return matchesQuery && matchesStatus && matchesNetwork && matchesService;
    })
    .sort((a, b) => {
      if (orderSortBy === 'amount-high') return b.amount - a.amount;
      if (orderSortBy === 'amount-low') return a.amount - b.amount;
      if (orderSortBy === 'oldest') return new Date(a.date).getTime() - new Date(b.date).getTime();
      return new Date(b.date).getTime() - new Date(a.date).getTime(); // newest
    });

  // Robust Transactions Filtering
  const filteredTransactions = transactions.filter((tx) => {
    const q = txSearch.toLowerCase().trim();
    const matchesQuery =
      !q ||
      tx.reference.toLowerCase().includes(q) ||
      tx.description.toLowerCase().includes(q) ||
      tx.channel.toLowerCase().includes(q);
    const matchesType = txTypeFilter === 'all' || tx.type === txTypeFilter;
    const matchesChannel = txChannelFilter === 'all' || tx.channel.toLowerCase().includes(txChannelFilter.toLowerCase());
    return matchesQuery && matchesType && matchesChannel;
  });

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReplyText.trim() || !selectedTicket) return;
    onReplyComplaint(selectedTicket.id, newReplyText.trim());
    setNewReplyText('');
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
      status: 'open',
      priority: 'high',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      lastUpdated: new Date().toISOString().replace('T', ' ').slice(0, 16),
      messages: [
        {
          id: `m-${Date.now()}`,
          sender: 'customer',
          senderName: 'Kojo Mensah',
          text: ticketMessage,
          timestamp: 'Just now'
        }
      ]
    };

    onAddComplaint(newTicket);
    setSelectedTicketId(newTicket.id);
    setShowNewTicketModal(false);
    setTicketSubject('');
    setTicketMessage('');
  };

  const guides = [
    {
      title: 'How to Authorize MTN Mobile Money USSD Prompts',
      category: 'Payments',
      readTime: '2 min',
      content: 'When funding your SDH wallet or buying directly with MoMo, a prompt appears on your handset requesting your 4-digit PIN. If it does not appear within 30 seconds, dial *170# -> My Wallet -> Approvals.'
    },
    {
      title: 'Checking WASSCE & BECE Results on WAEC Portal',
      category: 'Result Checkers',
      readTime: '3 min',
      content: '1. Copy your Serial Number and PIN from the SDH Voucher card. 2. Visit ghana.waecdirect.org. 3. Enter your Index Number, Examination Year, and Card Details. 4. Click Submit to reveal grades.'
    },
    {
      title: 'AFA Registration Requirements & Timeline',
      category: 'AFA Registration',
      readTime: '4 min',
      content: 'AFA tariff whitelisting requires an active Ghana Card registered to your SIM card. After submitting your application on SDH, approval takes 24 to 48 business hours via the Ministry of Agriculture portal.'
    },
    {
      title: 'Starting Your Own Branded Reseller Store',
      category: 'Agent Program',
      readTime: '5 min',
      content: 'Agents receive wholesale pricing on all networks. In the Agent Workspace, set your custom retail prices and copy your unique link (smartdatahub.com/store/your-name) to share with your customer base.'
    }
  ];

  return (
    <div className="space-y-6">
      {/* VIEW: WALLET & LEDGER */}
      {view === 'wallet' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border">
            <div>
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
                <Wallet className="w-6 h-6 text-primary" />
                <span>Wallet & Financial Ledger</span>
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Real-time ledger of top-ups, purchases, refunds, and available balance.
              </p>
            </div>
            <button
              onClick={onOpenFundWallet}
              className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <span>+ Fund Wallet</span>
            </button>
          </div>

          {/* Balances Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-card border border-border shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Available Cash</span>
              <div className="text-3xl font-black text-foreground tabular-nums mt-1">
                GH₵ {walletBalance.toFixed(2)}
              </div>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Ready for instant checkout</span>
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-card border border-border shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Promo Credits</span>
              <div className="text-3xl font-black text-foreground tabular-nums mt-1">
                GH₵ 5.00
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Applies automatically to purchases
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-card border border-border shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Recharge Channels</span>
              <div className="text-sm font-bold text-foreground mt-2 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-amber-400 text-amber-950 text-xs">MTN</span>
                <span className="px-2 py-0.5 rounded bg-red-600 text-white text-xs">Telecel</span>
                <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-xs">AT</span>
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

                  <Select
                    value={txTypeFilter}
                    onChange={(e) => setTxTypeFilter(e.target.value)}
                    className="h-8 text-xs w-28"
                  >
                    <option value="all">All Types</option>
                    <option value="credit">Credits (+)</option>
                    <option value="debit">Debits (-)</option>
                  </Select>

                  <Select
                    value={txChannelFilter}
                    onChange={(e) => setTxChannelFilter(e.target.value)}
                    className="h-8 text-xs w-32"
                  >
                    <option value="all">All Channels</option>
                    <option value="MTN">MTN MoMo</option>
                    <option value="Telecel">Telecel Cash</option>
                    <option value="AT">AT Money</option>
                    <option value="Wallet">Wallet Auto</option>
                  </Select>

                  {(txSearch || txTypeFilter !== 'all' || txChannelFilter !== 'all') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setTxSearch('');
                        setTxTypeFilter('all');
                        setTxChannelFilter('all');
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
                  {filteredTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        <div className="flex flex-col items-center justify-center space-y-1">
                          <AlertCircle className="w-5 h-5 text-muted-foreground/60" />
                          <p className="text-xs font-semibold">No transactions match your search filters.</p>
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => {
                              setTxSearch('');
                              setTxTypeFilter('all');
                              setTxChannelFilter('all');
                            }}
                            className="text-xs"
                          >
                            Clear all filters
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransactions.map((tx) => (
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
                          <Badge variant="outline" className="text-[10px] font-semibold">
                            {tx.channel}
                          </Badge>
                        </TableCell>
                        <TableCell className={`text-right font-black tabular-nums ${
                          tx.type === 'credit' ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'
                        }`}>
                          {tx.type === 'credit' ? '+' : '-'}GH₵ {tx.amount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground tabular-nums font-mono text-xs">
                          GH₵ {tx.balanceAfter.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* VIEW: ORDERS WITH FULL SEARCH & MULTI-FILTERS */}
      {view === 'orders' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border">
            <div>
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
                <Clock className="w-6 h-6 text-primary" />
                <span>My Orders & Dispatch Deliveries</span>
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Inspect upstream dispatch status, download authentic receipts, or repeat purchases.
              </p>
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center gap-2">
              <Button
                variant={orderViewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setOrderViewMode('table')}
                className="text-xs font-semibold"
              >
                Table View
              </Button>
              <Button
                variant={orderViewMode === 'cards' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setOrderViewMode('cards')}
                className="text-xs font-semibold"
              >
                Detailed Cards
              </Button>
            </div>
          </div>

          {/* Deep Search & Multi-Filters Toolbar */}
          <Card className="border-border shadow-xs">
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
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
                  onChange={(e) => setOrderFilterStatus(e.target.value)}
                  className="h-9 text-xs"
                >
                  <option value="all">All Statuses</option>
                  <option value="delivered">Delivered (Success)</option>
                  <option value="processing">Processing (In Flight)</option>
                  <option value="pending">Pending Gateway</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </Select>

                {/* Network Filter */}
                <Select
                  value={orderNetworkFilter}
                  onChange={(e) => setOrderNetworkFilter(e.target.value)}
                  className="h-9 text-xs"
                >
                  <option value="all">All Networks</option>
                  <option value="MTN">MTN Ghana</option>
                  <option value="Telecel">Telecel Ghana</option>
                  <option value="AirtelTigo">AT (AirtelTigo)</option>
                </Select>

                {/* Sort Order */}
                <Select
                  value={orderSortBy}
                  onChange={(e) => setOrderSortBy(e.target.value)}
                  className="h-9 text-xs"
                >
                  <option value="newest">Sort: Newest First</option>
                  <option value="oldest">Sort: Oldest First</option>
                  <option value="amount-high">Amount: High to Low</option>
                  <option value="amount-low">Amount: Low to High</option>
                </Select>
              </div>

              {/* Status Pills Quick Strip & Active Filters Indicator */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border text-xs">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mr-1">
                    Quick Status:
                  </span>
                  {['all', 'delivered', 'processing'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setOrderFilterStatus(st)}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold capitalize transition-all cursor-pointer ${
                        orderFilterStatus === st
                          ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                          : 'bg-muted/70 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    Showing <span className="font-bold text-foreground">{filteredOrders.length}</span> of {orders.length} orders
                  </span>
                  {(orderSearch || orderFilterStatus !== 'all' || orderNetworkFilter !== 'all' || orderSortBy !== 'newest') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setOrderSearch('');
                        setOrderFilterStatus('all');
                        setOrderNetworkFilter('all');
                        setOrderSortBy('newest');
                      }}
                      className="h-7 px-2 text-xs text-primary font-bold"
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* TABLE VIEW (Standard Senior Engineer Pattern) */}
          {orderViewMode === 'table' ? (
            <Card className="border-border shadow-xs">
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
                    {filteredOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <Search className="w-8 h-8 text-muted-foreground/40" />
                            <p className="text-sm font-bold text-foreground">No matching orders found</p>
                            <p className="text-xs text-muted-foreground">Try adjusting your keyword or status filters.</p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setOrderSearch('');
                                setOrderFilterStatus('all');
                                setOrderNetworkFilter('all');
                              }}
                              className="mt-2 text-xs"
                            >
                              Reset Filters
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredOrders.map((order) => (
                        <TableRow key={order.id} className="hover:bg-muted/40">
                          <TableCell>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                              order.network === 'MTN'
                                ? 'bg-amber-400 text-amber-950'
                                : order.network === 'Telecel'
                                ? 'bg-red-600 text-white'
                                : 'bg-blue-600 text-white'
                            }`}>
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
                              variant={order.status === 'delivered' ? 'success' : 'warning'}
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
              </CardContent>
            </Card>
          ) : (
            /* DETAILED CARDS VIEW */
            <div className="space-y-3">
              {filteredOrders.length === 0 ? (
                <Card className="p-8 text-center border-border">
                  <p className="text-sm text-muted-foreground">No orders match the selected filters.</p>
                </Card>
              ) : (
                filteredOrders.map((order) => (
                  <Card
                    key={order.id}
                    className="p-5 border-border shadow-xs hover:border-primary/50 transition-colors space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                          order.network === 'MTN'
                            ? 'bg-amber-400 text-amber-950'
                            : order.network === 'Telecel'
                            ? 'bg-red-600 text-white'
                            : 'bg-blue-600 text-white'
                        }`}>
                          {order.network.slice(0, 3)}
                        </div>
                        <div>
                          <div className="font-extrabold text-sm text-foreground">{order.productName}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <span className="font-mono font-bold">{order.reference}</span>
                            <span>•</span>
                            <span>Recipient: <span className="font-mono text-foreground font-semibold">{order.recipientPhone}</span></span>
                            <span>•</span>
                            <span className="tabular-nums">{order.date}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                        <div className="text-right">
                          <div className="text-base font-black text-foreground tabular-nums">
                            GH₵ {order.amount.toFixed(2)}
                          </div>
                          <div className="flex items-center gap-1.5 justify-end">
                            <Badge
                              variant={order.status === 'delivered' ? 'success' : 'warning'}
                              className="text-[10px] font-bold uppercase"
                            >
                              {order.status}
                            </Badge>
                            <SignalRail status={order.status === 'delivered' ? 'delivered' : 'processing'} size="sm" />
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onOpenReceipt(order)}
                          className="text-xs font-bold"
                        >
                          Receipt
                        </Button>
                      </div>
                    </div>

                    {/* Delivery Timeline Step Strip */}
                    <div className="pt-3 border-t border-border/70 flex flex-wrap gap-4 text-[11px] text-muted-foreground">
                      {order.deliveryTimeline.map((tl, idx) => (
                        <div key={idx} className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="font-medium text-foreground">{tl.step}</span>
                          <span className="tabular-nums opacity-75">({tl.timestamp})</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* VIEW: COMPLAINTS & SUPPORT */}
      {view === 'complaints' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-border">
            <div>
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
                <MessageSquareWarning className="w-6 h-6 text-amber-600" />
                <span>Complaints & Support Tickets</span>
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Direct communication with SDH Network Operations Center (NOC) engineers.
              </p>
            </div>
            <button
              onClick={() => setShowNewTicketModal(true)}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>New Ticket</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Tickets Sidebar */}
            <div className="lg:col-span-4 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Your Tickets</span>
              {complaints.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setSelectedTicketId(c.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    selectedTicket?.id === c.id
                      ? 'border-primary bg-primary/10 ring-2 ring-primary/30 shadow-xs'
                      : 'border-border bg-card hover:bg-muted/40'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-mono text-[11px] font-bold text-foreground">{c.ticketNumber}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500/15 text-amber-900 dark:text-amber-300">
                      {c.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-foreground line-clamp-1">{c.subject}</div>
                  <div className="text-[10px] text-muted-foreground mt-1">Updated {c.lastUpdated}</div>
                </div>
              ))}
            </div>

            {/* Selected Ticket Conversation Thread */}
            <div className="lg:col-span-8">
              {selectedTicket ? (
                <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-4 flex flex-col h-[520px]">
                  <div className="pb-3 border-b border-border flex justify-between items-start">
                    <div>
                      <div className="text-xs text-muted-foreground font-mono">{selectedTicket.ticketNumber}</div>
                      <h3 className="font-bold text-sm text-foreground">{selectedTicket.subject}</h3>
                      {selectedTicket.orderReference && (
                        <div className="text-[11px] text-primary font-mono mt-0.5">
                          Order Ref: {selectedTicket.orderReference}
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-primary/10 text-primary">
                      {selectedTicket.category.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  {/* Messages Feed */}
                  <div className="flex-1 overflow-y-auto space-y-3 p-2">
                    {selectedTicket.messages.map((m) => {
                      const isCustomer = m.sender === 'customer';
                      return (
                        <div
                          key={m.id}
                          className={`flex flex-col ${isCustomer ? 'items-end' : 'items-start'}`}
                        >
                          <div className="text-[10px] text-muted-foreground mb-1">
                            {m.senderName} • {m.timestamp}
                          </div>
                          <div className={`p-3 rounded-2xl text-xs max-w-md ${
                            isCustomer
                              ? 'bg-primary text-primary-foreground rounded-tr-xs'
                              : 'bg-muted text-foreground border border-border rounded-tl-xs'
                          }`}>
                            {m.text}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Reply Composer */}
                  <form onSubmit={handleSendReply} className="pt-3 border-t border-border flex gap-2">
                    <input
                      type="text"
                      placeholder="Type your reply to SDH NOC support..."
                      value={newReplyText}
                      onChange={(e) => setNewReplyText(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-input bg-background text-foreground text-xs focus:outline-hidden"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send</span>
                    </button>
                  </form>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  Select a ticket to view message thread.
                </div>
              )}
            </div>
          </div>

          {/* New Ticket Modal */}
          {showNewTicketModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
              <div className="w-full max-w-md bg-card rounded-2xl border border-border shadow-2xl p-6 space-y-4">
                <h3 className="font-bold text-base text-foreground">Open Support Complaint</h3>
                <form onSubmit={handleCreateTicket} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-muted-foreground mb-1">Category</label>
                    <select
                      value={ticketCategory}
                      onChange={(e) => setTicketCategory(e.target.value)}
                      className="w-full p-2 rounded-xl border border-input bg-background text-foreground"
                    >
                      <option value="delivery_delay">Delivery Delay</option>
                      <option value="failed_recharge">Failed Recharge / No SMS</option>
                      <option value="momo_debit_no_credit">MoMo Debited with No Credit</option>
                      <option value="wrong_number">Wrong Recipient Number</option>
                      <option value="general">General Help</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-muted-foreground mb-1">Related Order Reference (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. SDH-GH-2026-94814"
                      value={ticketOrderRef}
                      onChange={(e) => setTicketOrderRef(e.target.value)}
                      className="w-full p-2 rounded-xl border border-input bg-background text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-muted-foreground mb-1">Subject</label>
                    <input
                      type="text"
                      required
                      placeholder="Brief summary of issue..."
                      value={ticketSubject}
                      onChange={(e) => setTicketSubject(e.target.value)}
                      className="w-full p-2 rounded-xl border border-input bg-background text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-muted-foreground mb-1">Detailed Description</label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Describe what happened..."
                      value={ticketMessage}
                      onChange={(e) => setTicketMessage(e.target.value)}
                      className="w-full p-2 rounded-xl border border-input bg-background text-foreground"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowNewTicketModal(false)}
                      className="flex-1 py-2 rounded-xl border border-border text-foreground hover:bg-muted font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90"
                    >
                      Submit Ticket
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW: HOW-TO GUIDES */}
      {view === 'guides' && (
        <div className="space-y-6">
          <div className="pb-4 border-b border-border">
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-primary" />
              <span>How-to Guides & Ghana Telecom Tutorials</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Knowledge base on network codes, MoMo approvals, result checkers, and SIM settings.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {guides.map((g, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-card border border-border shadow-2xs space-y-2">
                <div className="flex justify-between items-center text-[10px] uppercase font-bold text-primary">
                  <span>{g.category}</span>
                  <span className="text-muted-foreground">{g.readTime} read</span>
                </div>
                <h3 className="font-bold text-sm text-foreground">{g.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{g.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: NOTIFICATIONS */}
      {view === 'notifications' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-border">
            <div>
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
                <Bell className="w-6 h-6 text-primary" />
                <span>Notifications & System Dispatches</span>
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Real-time carrier delivery confirmations, gateway updates, and promotional tariffs.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))}
                className="px-3 py-1.5 rounded-xl border border-border bg-card text-xs font-semibold hover:bg-muted text-foreground flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Mark All Read</span>
              </button>
              <button
                onClick={() => setNotifications([])}
                className="p-1.5 rounded-xl border border-border bg-card text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-xs transition-colors cursor-pointer"
                title="Clear notifications"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {['all', 'orders', 'gateway', 'wallet', 'promo'].map((cat) => (
              <button
                key={cat}
                onClick={() => setNotificationCategory(cat)}
                className={`px-3 py-1.5 rounded-xl uppercase font-bold text-[11px] tracking-wide transition-all cursor-pointer ${
                  notificationCategory === cat
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-card border border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Notifications List */}
          <div className="space-y-3">
            {notifications.filter((n) => notificationCategory === 'all' || n.category === notificationCategory).length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-card border border-border space-y-2">
                <Bell className="w-8 h-8 text-muted-foreground mx-auto opacity-40" />
                <p className="text-sm font-bold text-foreground">No notifications in this category</p>
                <p className="text-xs text-muted-foreground">You are completely up to date.</p>
              </div>
            ) : (
              notifications
                .filter((n) => notificationCategory === 'all' || n.category === notificationCategory)
                .map((item) => (
                  <div
                    key={item.id}
                    className={`p-5 rounded-2xl bg-card border shadow-2xs transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${
                      item.read ? 'border-border opacity-85' : 'border-primary/40 ring-1 ring-primary/20'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {!item.read && <span className="w-2 h-2 rounded-full bg-primary" />}
                        <span className="font-extrabold text-sm text-foreground">{item.title}</span>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded-md bg-muted text-muted-foreground">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{item.message}</p>
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
                      <button
                        onClick={() =>
                          setNotifications((prev) =>
                            prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
                          )
                        }
                        className="px-3 py-1.5 rounded-xl border border-border bg-card text-xs font-semibold hover:bg-muted text-foreground cursor-pointer shrink-0"
                      >
                        Acknowledge
                      </button>
                    )}
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* VIEW: PROFILE & SETTINGS */}
      {view === 'profile' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="pb-4 border-b border-border">
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
              <User className="w-6 h-6 text-primary" />
              <span>Profile, Security & Preferences</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage personal identity, Ghana Card KYC, transaction security PINs, and theme styles.
            </p>
          </div>

          {profileSaved && (
            <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" />
              <span>Profile information successfully saved and synced with SDH identity services.</span>
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
              <div>
                <label className="text-muted-foreground block mb-1 font-semibold">Full Legal Name</label>
                <input
                  type="text"
                  defaultValue="Kojo Mensah"
                  className="w-full p-2.5 rounded-xl border border-input bg-background text-foreground font-medium"
                />
              </div>
              <div>
                <label className="text-muted-foreground block mb-1 font-semibold">Primary Mobile Number</label>
                <input
                  type="tel"
                  defaultValue="0244192834"
                  className="w-full p-2.5 rounded-xl border border-input bg-background text-foreground tabular-nums font-mono font-medium"
                />
              </div>
              <div>
                <label className="text-muted-foreground block mb-1 font-semibold">Email Address</label>
                <input
                  type="email"
                  defaultValue="kojomensah94@gmail.com"
                  className="w-full p-2.5 rounded-xl border border-input bg-background text-foreground font-medium"
                />
              </div>
              <div>
                <label className="text-muted-foreground block mb-1 font-semibold">Ghana Card Number (NIA)</label>
                <input
                  type="text"
                  disabled
                  defaultValue="GHA-721948192-3"
                  className="w-full p-2.5 rounded-xl border border-input bg-muted/60 text-foreground font-mono font-bold cursor-not-allowed"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => {
                  setProfileSaved(true);
                  setTimeout(() => setProfileSaved(false), 3000);
                }}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 cursor-pointer shadow-2xs"
              >
                Save Account Changes
              </button>
            </div>
          </div>

          {/* Theme Selector Section (Dropdown & Cards) */}
          <div className="p-6 rounded-3xl bg-card border border-border shadow-xs space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                  <Palette className="w-4 h-4 text-primary" />
                  <span>Application Theme & Color Archetype</span>
                </h3>
                <p className="text-muted-foreground text-[11px] mt-0.5">
                  Select from 6 bespoke color archetypes crafted for high contrast, day & night readability.
                </p>
              </div>
              {onSetTheme && (
                <select
                  value={theme}
                  onChange={(e) => onSetTheme(e.target.value as AppTheme)}
                  className="px-3 py-1.5 rounded-xl border border-input bg-background text-foreground text-xs font-bold"
                >
                  <option value="light">☀️ Daylight Clean</option>
                  <option value="dark">🌙 Midnight Obsidian</option>
                  <option value="ghana-gold">🇬🇭 Ghana Black Star Gold</option>
                  <option value="emerald-matrix">🌲 Emerald Matrix</option>
                  <option value="royal-indigo">⚡ Royal Indigo</option>
                  <option value="crimson-telecel">🔴 Crimson Telecel</option>
                </select>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              {[
                { id: 'light', name: 'Daylight Clean', dot: 'bg-blue-600' },
                { id: 'dark', name: 'Midnight Obsidian', dot: 'bg-slate-900 border border-slate-700' },
                { id: 'ghana-gold', name: 'Ghana Black Star Gold', dot: 'bg-amber-400' },
                { id: 'emerald-matrix', name: 'Emerald Matrix', dot: 'bg-emerald-500' },
                { id: 'royal-indigo', name: 'Royal Indigo', dot: 'bg-indigo-600' },
                { id: 'crimson-telecel', name: 'Crimson Telecel', dot: 'bg-red-600' }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => onSetTheme?.(t.id as AppTheme)}
                  className={`p-3 rounded-2xl border text-left flex items-center justify-between cursor-pointer transition-all ${
                    theme === t.id
                      ? 'border-primary bg-primary/10 shadow-2xs font-bold text-foreground'
                      : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-3.5 h-3.5 rounded-full ${t.dot}`} />
                    <span className="text-xs">{t.name}</span>
                  </div>
                  {theme === t.id && <Check className="w-3.5 h-3.5 text-primary" />}
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
                <button
                  onClick={onOpenSecurityPins}
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>View All Hardcoded PINs</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-muted-foreground block mb-1 font-semibold">Current PIN (Hardcoded: 2026)</label>
                <input
                  type="password"
                  maxLength={4}
                  value={currentPinInput}
                  onChange={(e) => setCurrentPinInput(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-input bg-background text-foreground font-mono tabular-nums text-center text-sm font-bold"
                />
              </div>
              <div>
                <label className="text-muted-foreground block mb-1 font-semibold">New 4-Digit PIN</label>
                <input
                  type="password"
                  maxLength={4}
                  placeholder="Enter new 4 digits"
                  value={newPinInput}
                  onChange={(e) => setNewPinInput(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-input bg-background text-foreground font-mono tabular-nums text-center text-sm font-bold"
                />
              </div>
            </div>

            {pinChangeSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-bold text-[11px] flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>Security PIN updated successfully to {newPinInput || '2026'}.</span>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setPinChangeSuccess(true);
                  setTimeout(() => setPinChangeSuccess(false), 3000);
                }}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 cursor-pointer"
              >
                Update Security PIN
              </button>
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
                  <div className="font-bold text-foreground">Accra, Ghana • Chrome on macOS (Current Device)</div>
                  <div className="text-muted-foreground text-[11px]">IP: 102.176.64.12 • Active Now</div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-bold text-[10px]">
                  Online
                </span>
              </div>

              <div className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-bold text-foreground">Kumasi, Ghana • Mobile Safari on iPhone 15</div>
                  <div className="text-muted-foreground text-[11px]">IP: 154.160.2.89 • 2 hours ago</div>
                </div>
                <button
                  type="button"
                  className="text-xs text-destructive hover:underline font-semibold cursor-pointer"
                >
                  Revoke
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


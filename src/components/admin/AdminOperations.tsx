import React, { useState } from 'react';
import {
  Server,
  Activity,
  Layers,
  ShieldAlert,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  GraduationCap,
  DollarSign,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Check,
  X,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  ArrowUpDown
} from 'lucide-react';
import { TelecomGateway, Order, AfaApplication, ResultCheckerProduct } from '../../types';
import { SignalRail } from '../common/SignalRail';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '../ui/table';

interface AdminOperationsProps {
  view: 'gateways' | 'orders-audit' | 'settlement' | 'afa-verification' | 'vouchers-stock';
  gateways: TelecomGateway[];
  onToggleGatewayStatus: (gatewayId: string) => void;
  orders: Order[];
  onRetryOrder: (orderId: string) => void;
  onRefundOrder: (orderId: string) => void;
  afaApplications: AfaApplication[];
  onUpdateAfaStatus: (appId: string, status: 'approved' | 'rejected' | 'needs_correction') => void;
  checkers: ResultCheckerProduct[];
  onAddVoucherStock: (checkerId: string, count: number) => void;
}

export const AdminOperations: React.FC<AdminOperationsProps> = ({
  view,
  gateways,
  onToggleGatewayStatus,
  orders,
  onRetryOrder,
  onRefundOrder,
  afaApplications,
  onUpdateAfaStatus,
  checkers,
  onAddVoucherStock,
}) => {
  // Orders Audit State & Filters
  const [orderQuery, setOrderQuery] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [orderSortBy, setOrderSortBy] = useState<string>('newest');

  // Gateways Search & Filters
  const [gatewaySearch, setGatewaySearch] = useState('');
  const [gatewayStatusFilter, setGatewayStatusFilter] = useState<string>('all');

  // AFA Search & Filters
  const [afaSearch, setAfaSearch] = useState('');
  const [afaStatusFilter, setAfaStatusFilter] = useState<string>('all');

  // Vouchers Search & Filters
  const [voucherSearch, setVoucherSearch] = useState('');

  // Settlement search
  const [settlementSearch, setSettlementSearch] = useState('');

  // Filtered Orders Audit
  const filteredOrders = orders
    .filter((o) => {
      const q = orderQuery.toLowerCase().trim();
      const matchQ =
        !q ||
        o.reference.toLowerCase().includes(q) ||
        o.recipientPhone.includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.productName.toLowerCase().includes(q);
      const matchNet = selectedNetwork === 'all' || o.network === selectedNetwork;
      const matchStatus = selectedStatus === 'all' || o.status === selectedStatus;
      return matchQ && matchNet && matchStatus;
    })
    .sort((a, b) => {
      if (orderSortBy === 'amount-high') return b.amount - a.amount;
      if (orderSortBy === 'amount-low') return a.amount - b.amount;
      if (orderSortBy === 'oldest') return new Date(a.date).getTime() - new Date(b.date).getTime();
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

  // Filtered Gateways
  const filteredGateways = gateways.filter((gw) => {
    const q = gatewaySearch.toLowerCase().trim();
    const matchQ = !q || gw.name.toLowerCase().includes(q) || gw.id.toLowerCase().includes(q);
    const matchSt = gatewayStatusFilter === 'all' || gw.status === gatewayStatusFilter;
    return matchQ && matchSt;
  });

  // Filtered AFA Applications
  const filteredAfa = afaApplications.filter((app) => {
    const q = afaSearch.toLowerCase().trim();
    const matchQ =
      !q ||
      app.fullName.toLowerCase().includes(q) ||
      app.phoneNumber.includes(q) ||
      app.ghanaCardNumber.toLowerCase().includes(q) ||
      app.region.toLowerCase().includes(q);
    const matchSt = afaStatusFilter === 'all' || app.status === afaStatusFilter;
    return matchQ && matchSt;
  });

  // Filtered Vouchers
  const filteredVouchers = checkers.filter((chk) => {
    const q = voucherSearch.toLowerCase().trim();
    return !q || chk.title.toLowerCase().includes(q) || chk.examBody.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* VIEW: GATEWAYS & CARRIER SWITCHES */}
      {view === 'gateways' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border">
            <div>
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
                <Server className="w-6 h-6 text-primary" />
                <span>Telecom Carrier Switches & Core Gateways</span>
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Monitor real-time EVD dispatch latency, uptime, and configure upstream carrier failover.
              </p>
            </div>
            <SignalRail status="online" size="md" label="SDH Core Switch Active" />
          </div>

          {/* Gateway Search Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Filter carrier gateway by name or ID..."
                  value={gatewaySearch}
                  onChange={(e) => setGatewaySearch(e.target.value)}
                  className="pl-8 h-9 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={gatewayStatusFilter}
                onChange={(e) => setGatewayStatusFilter(e.target.value)}
                className="h-9 text-xs w-36 rounded-lg border border-input bg-background text-foreground px-2"
              >
                <option value="all">All Switch States</option>
                <option value="online">Online / Active</option>
                <option value="degraded">Degraded</option>
                <option value="offline">Offline / Standby</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGateways.map((gw) => (
              <Card
                key={gw.id}
                className="border-border shadow-xs space-y-4 hover:border-primary/40 transition-colors"
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-sm font-bold text-foreground">{gw.name}</CardTitle>
                      <CardDescription className="text-[10px] font-mono">Gateway ID: {gw.id}</CardDescription>
                    </div>
                    <SignalRail status={gw.status} size="sm" />
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-muted/40 border border-border/80">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Latency</span>
                      <span className="font-mono font-bold text-foreground tabular-nums">{gw.latencyMs} ms</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-muted/40 border border-border/80">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Success Rate</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {gw.successRate}%
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-border text-xs">
                    <span className="text-muted-foreground">Carrier Switch Status:</span>
                    <Button
                      variant={gw.status === 'online' ? 'destructive' : 'default'}
                      size="sm"
                      onClick={() => onToggleGatewayStatus(gw.id)}
                      className="h-7 text-xs font-bold"
                    >
                      {gw.status === 'online' ? 'Force Standby' : 'Enable Active'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: ORDERS AUDIT WITH COMPLETE SEARCH & MULTI-FILTERS */}
      {view === 'orders-audit' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border">
            <div>
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
                <Activity className="w-6 h-6 text-primary" />
                <span>Orders Audit Trail & EVD Dispatch Console</span>
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Audit upstream telecom dispatches, trigger manual EVD retries, and issue customer wallet refunds.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs">
                Total Audited: {orders.length}
              </Badge>
            </div>
          </div>

          {/* Audit Search & Filter Toolbar */}
          <Card className="border-border shadow-xs">
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                {/* Search input */}
                <div className="relative lg:col-span-2">
                  <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search reference, customer name, phone..."
                    value={orderQuery}
                    onChange={(e) => setOrderQuery(e.target.value)}
                    className="pl-8 h-9 text-xs font-mono"
                  />
                </div>

                {/* Network filter */}
                <select
                  value={selectedNetwork}
                  onChange={(e) => setSelectedNetwork(e.target.value)}
                  className="h-9 text-xs rounded-lg border border-input bg-background text-foreground px-2"
                >
                  <option value="all">All Networks</option>
                  <option value="MTN">MTN Ghana</option>
                  <option value="Telecel">Telecel Ghana</option>
                  <option value="AirtelTigo">AT (AirtelTigo)</option>
                </select>

                {/* Status filter */}
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="h-9 text-xs rounded-lg border border-input bg-background text-foreground px-2"
                >
                  <option value="all">All Statuses</option>
                  <option value="delivered">Delivered</option>
                  <option value="processing">Processing</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>

                {/* Sort dropdown */}
                <select
                  value={orderSortBy}
                  onChange={(e) => setOrderSortBy(e.target.value)}
                  className="h-9 text-xs rounded-lg border border-input bg-background text-foreground px-2"
                >
                  <option value="newest">Sort: Newest</option>
                  <option value="oldest">Sort: Oldest</option>
                  <option value="amount-high">Amount: High-Low</option>
                  <option value="amount-low">Amount: Low-High</option>
                </select>
              </div>

              {/* Active filters summary */}
              <div className="flex flex-wrap items-center justify-between pt-2 border-t border-border text-xs">
                <span className="text-muted-foreground">
                  Showing <span className="font-bold text-foreground">{filteredOrders.length}</span> matching order records
                </span>
                {(orderQuery || selectedNetwork !== 'all' || selectedStatus !== 'all' || orderSortBy !== 'newest') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setOrderQuery('');
                      setSelectedNetwork('all');
                      setSelectedStatus('all');
                      setOrderSortBy('newest');
                    }}
                    className="h-7 text-xs text-primary font-bold"
                  >
                    Clear Filter Rules
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Audit Data Table */}
          <Card className="border-border shadow-xs">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order Reference</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Customer & Recipient</TableHead>
                    <TableHead>Product Package</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-center">Carrier Status</TableHead>
                    <TableHead className="text-right">NOC Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                        <div className="flex flex-col items-center justify-center space-y-1">
                          <Search className="w-6 h-6 text-muted-foreground/50" />
                          <p className="text-xs font-bold text-foreground">No audit records match your query.</p>
                          <p className="text-[11px] text-muted-foreground">Check search terms or reset filters.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map((ord) => (
                      <TableRow key={ord.id} className="hover:bg-muted/40">
                        <TableCell className="font-mono font-bold text-xs text-foreground">
                          {ord.reference}
                        </TableCell>
                        <TableCell className="text-muted-foreground tabular-nums text-xs">
                          {ord.date}
                        </TableCell>
                        <TableCell className="text-xs text-foreground">
                          <div className="font-semibold">{ord.customerName}</div>
                          <div className="font-mono text-[10px] text-muted-foreground">{ord.recipientPhone}</div>
                        </TableCell>
                        <TableCell className="text-xs font-medium text-foreground">
                          <div className="flex items-center gap-1.5">
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${
                              ord.network === 'MTN'
                                ? 'bg-amber-400 text-amber-950'
                                : ord.network === 'Telecel'
                                ? 'bg-red-600 text-white'
                                : 'bg-blue-600 text-white'
                            }`}>
                              {ord.network.slice(0, 3)}
                            </span>
                            <span>{ord.productName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-black text-foreground tabular-nums text-xs">
                          GH₵ {ord.amount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={ord.status === 'delivered' ? 'default' : 'secondary'}
                            className="text-[10px] font-bold uppercase"
                          >
                            {ord.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onRetryOrder(ord.id)}
                              className="h-7 px-2 text-xs"
                              title="Retry EVD Dispatch"
                            >
                              <RefreshCw className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => onRefundOrder(ord.id)}
                              className="h-7 px-2.5 text-xs font-semibold"
                              title="Refund to Customer Wallet"
                            >
                              Refund
                            </Button>
                          </div>
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

      {/* VIEW: AFA VERIFICATION PORTAL WITH SEARCH & STATUS FILTER */}
      {view === 'afa-verification' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border">
            <div>
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
                <FileCheck className="w-6 h-6 text-emerald-600" />
                <span>AFA National Identity & Tariff Verification Desk</span>
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Review Ghana Card numbers and whitelist eligible agricultural subscribers for subsidized telecom data.
              </p>
            </div>
            <Badge variant="outline" className="font-mono text-xs">
              Pending Verification: {afaApplications.filter(a => a.status === 'under_review').length}
            </Badge>
          </div>

          {/* Search and Filters Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search applicant name, phone, Ghana Card, or region..."
                value={afaSearch}
                onChange={(e) => setAfaSearch(e.target.value)}
                className="pl-8 h-9 text-xs"
              />
            </div>

            <select
              value={afaStatusFilter}
              onChange={(e) => setAfaStatusFilter(e.target.value)}
              className="h-9 text-xs w-40 rounded-lg border border-input bg-background text-foreground px-2"
            >
              <option value="all">All Verification States</option>
              <option value="under_review">Pending Review</option>
              <option value="approved">Approved & Whitelisted</option>
              <option value="needs_correction">Flagged for Correction</option>
            </select>
          </div>

          {/* AFA Applicants List */}
          <div className="space-y-3">
            {filteredAfa.length === 0 ? (
              <Card className="p-8 text-center border-border">
                <p className="text-xs text-muted-foreground">No AFA applications found matching criteria.</p>
              </Card>
            ) : (
              filteredAfa.map((app) => (
                <Card
                  key={app.id}
                  className="p-5 border-border shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs hover:border-primary/40 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-foreground">{app.fullName}</span>
                      <span className="font-mono text-muted-foreground font-semibold">({app.phoneNumber})</span>
                      <Badge
                        variant={app.status === 'approved' ? 'default' : 'secondary'}
                        className="text-[10px] font-bold uppercase"
                      >
                        {app.status}
                      </Badge>
                    </div>
                    <div className="text-muted-foreground flex flex-wrap gap-3 pt-0.5">
                      <span>Ghana Card: <strong className="font-mono text-foreground">{app.ghanaCardNumber}</strong></span>
                      <span>Region: <strong className="text-foreground">{app.region}</strong></span>
                      <span>Trade: <strong className="text-foreground">{app.occupation}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => onUpdateAfaStatus(app.id, 'approved')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve & Whitelist</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onUpdateAfaStatus(app.id, 'needs_correction')}
                      className="text-xs font-semibold"
                    >
                      Flag Correction
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* VIEW: VOUCHERS INVENTORY WITH SEARCH & INSTANT RESTOCK */}
      {view === 'vouchers-stock' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border">
            <div>
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
                <GraduationCap className="w-6 h-6 text-purple-600" />
                <span>Results Checker Stock & Inventory Allocation</span>
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Manage live batch numbers from WAEC, Ministry of Education, and University admissions.
              </p>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search examination body..."
                value={voucherSearch}
                onChange={(e) => setVoucherSearch(e.target.value)}
                className="pl-8 h-9 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredVouchers.map((chk) => (
              <Card key={chk.id} className="border-border shadow-xs space-y-4">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-sm font-bold text-foreground">{chk.title}</CardTitle>
                      <CardDescription className="text-[10px] uppercase font-mono">{chk.examBody} Portal</CardDescription>
                    </div>
                    <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400 font-mono font-black text-xs">
                      {chk.stockCount} Cards In Stock
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center text-xs pt-2 border-t border-border">
                    <span className="text-muted-foreground font-medium">Unit Retail: GH₵ {chk.price.toFixed(2)}</span>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => onAddVoucherStock(chk.id, 50)}
                      className="font-bold text-xs gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add 50 Cards to Batch</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: SETTLEMENT & FLOAT RECONCILIATION */}
      {view === 'settlement' && (
        <div className="space-y-6">
          <div className="pb-4 border-b border-border">
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-amber-500" />
              <span>Carrier Float Balances & Daily Settlement</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Liquidity reserve accounts with MTN Mobile Money, Telecel Cash, and Ecobank Ghana Settlement.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-border shadow-xs p-5">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                MTN Core Float Reserve
              </span>
              <div className="text-3xl font-black text-foreground tabular-nums mt-1">
                GH₵ 42,850.00
              </div>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Healthy liquidity (USSD EVD auto-replenish)</span>
              </p>
            </Card>

            <Card className="border-border shadow-xs p-5">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Telecel Cash Float
              </span>
              <div className="text-3xl font-black text-foreground tabular-nums mt-1">
                GH₵ 18,400.00
              </div>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Healthy liquidity</span>
              </p>
            </Card>

            <Card className="border-border shadow-xs p-5">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Ecobank Ghana Settlement
              </span>
              <div className="text-3xl font-black text-foreground tabular-nums mt-1">
                GH₵ 94,120.00
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Automated 11:59 PM daily clearing sweep
              </p>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

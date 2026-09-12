import React from 'react';
import {
  Home,
  Wifi,
  PhoneCall,
  GraduationCap,
  ShieldCheck,
  Zap,
  Wallet,
  Clock,
  Bell,
  MessageSquareWarning,
  BookOpen,
  User,
  ShoppingBag,
  BarChart2,
  Send,
  Users,
  Sliders,
  DollarSign,
  AlertTriangle,
  Server,
  Layers,
  Sparkles,
  ArrowUpRight,
  ChevronRight
} from 'lucide-react';
import { UserRole } from '../../types';

interface SidebarProps {
  currentRole: UserRole;
  activeTab: string;
  onSelectTab?: (tab: string) => void;
  onTabChange?: (tab: string) => void;
  unreadNotifications?: number;
  openComplaintsCount?: number;
  pendingPayoutsCount?: number;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRole,
  activeTab,
  onSelectTab,
  onTabChange,
  unreadNotifications = 0,
  openComplaintsCount = 0,
  pendingPayoutsCount = 2,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  if (currentRole === 'public' || currentRole === 'storefront') {
    return null;
  }

  const handleTabClick = (tabId: string) => {
    if (onSelectTab) onSelectTab(tabId);
    if (onTabChange) onTabChange(tabId);
  };

  // Customer Navigation Items
  const customerNav = [
    { id: 'overview', altIds: ['dashboard'], label: 'Dashboard', icon: Home },
    { id: 'buy-data', altIds: [], label: 'Buy Data', icon: Wifi, badge: 'Popular' },
    { id: 'buy-airtime', altIds: [], label: 'Buy Airtime', icon: PhoneCall },
    { id: 'results-checker', altIds: [], label: 'Results Checker', icon: GraduationCap },
    { id: 'afa', altIds: [], label: 'AFA Registration', icon: ShieldCheck, badge: 'Subsidized' },
    { id: 'utilities', altIds: [], label: 'Utilities & Bills', icon: Zap },
    { id: 'wallet', altIds: [], label: 'Wallet & Ledger', icon: Wallet },
    { id: 'orders', altIds: [], label: 'My Orders', icon: Clock },
    { id: 'notifications', altIds: [], label: 'Notifications', icon: Bell, count: unreadNotifications },
    { id: 'complaints', altIds: [], label: 'Complaints & Help', icon: MessageSquareWarning, count: openComplaintsCount },
    { id: 'guides', altIds: [], label: 'How-to Guides', icon: BookOpen },
    { id: 'profile', altIds: [], label: 'Profile & Security', icon: User },
  ];

  // Agent Navigation Groups
  const agentNav = [
    {
      group: 'Overview',
      items: [
        { id: 'overview', altIds: ['dashboard'], label: 'Agent Dashboard', icon: Home },
        { id: 'my-store', altIds: [], label: 'My Store Builder', icon: ShoppingBag, badge: 'Live' },
      ]
    },
    {
      group: 'Commerce & Sales',
      items: [
        { id: 'store-orders', altIds: [], label: 'Store Orders', icon: Clock },
        { id: 'pricing', altIds: [], label: 'Pricing & Margins', icon: Sliders },
        { id: 'analytics', altIds: [], label: 'Sales Analytics', icon: BarChart2 },
        { id: 'bulk-sms', altIds: [], label: 'Bulk SMS Campaign', icon: Send },
        { id: 'withdraw', altIds: [], label: 'Withdraw Commissions', icon: DollarSign, badge: 'MoMo' },
      ]
    }
  ];

  // Admin Navigation Groups
  const adminNav = [
    {
      group: 'Operations & Gateways',
      items: [
        { id: 'gateways', altIds: ['dashboard'], label: 'Carrier Gateways & Latency', icon: Server, badge: 'Live' },
        { id: 'orders-audit', altIds: ['order-monitor'], label: 'Orders Audit & Dispatch', icon: Clock },
        { id: 'settlement', altIds: ['payouts'], label: 'Settlement & Balances', icon: DollarSign, count: pendingPayoutsCount },
      ]
    },
    {
      group: 'Services Administration',
      items: [
        { id: 'afa-verification', altIds: ['afa-admin'], label: 'AFA Approvals', icon: ShieldCheck },
        { id: 'vouchers-stock', altIds: ['checkers-admin'], label: 'Voucher Stock (WAEC/BECE)', icon: GraduationCap },
      ]
    }
  ];

  return (
    <aside className="w-64 border-r border-border bg-card flex flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      {/* Role Badge Indicator */}
      <div className="p-4 border-b border-border/70">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${
              currentRole === 'admin' ? 'bg-purple-500' : currentRole === 'agent' ? 'bg-amber-500' : 'bg-primary'
            }`} />
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {currentRole === 'admin' ? 'NOC Admin Workspace' : currentRole === 'agent' ? 'Agent Merchant Portal' : 'Customer Account'}
            </span>
          </div>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
        {currentRole === 'customer' && (
          <div className="space-y-1">
            {customerNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id || (item.altIds && item.altIds.includes(activeTab));
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-foreground hover:bg-muted/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                  {item.count !== undefined && item.count > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive ? 'bg-white text-primary' : 'bg-destructive text-destructive-foreground'
                    }`}>
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {currentRole === 'agent' && (
          <div className="space-y-4">
            {agentNav.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1">
                <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {group.group}
                </div>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id || (item.altIds && item.altIds.includes(activeTab));
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabClick(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-xs'
                          : 'text-foreground hover:bg-muted/80'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                          isActive ? 'bg-white/20 text-white' : 'bg-amber-500/15 text-amber-900 dark:text-amber-300'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {currentRole === 'admin' && (
          <div className="space-y-4">
            {adminNav.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1">
                <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {group.group}
                </div>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id || (item.altIds && item.altIds.includes(activeTab));
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabClick(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-xs'
                          : 'text-foreground hover:bg-muted/80'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                          isActive ? 'bg-white/20 text-white' : 'bg-purple-500/15 text-purple-700 dark:text-purple-300'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                      {item.count !== undefined && item.count > 0 && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                          isActive ? 'bg-white text-primary' : 'bg-destructive text-destructive-foreground'
                        }`}>
                          {item.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </nav>

      {/* Quick Agent Callout if Customer */}
      {currentRole === 'customer' && (
        <div className="p-3 m-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-950 dark:text-amber-200">
          <div className="flex items-center gap-1.5 text-xs font-bold mb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Sell Data in Ghana</span>
          </div>
          <p className="text-[11px] text-amber-900/80 dark:text-amber-300/80 leading-snug">
            Create your own branded store and earn up to GH₵1,800/mo in MoMo commissions.
          </p>
          <button
            onClick={() => handleTabClick('guides')}
            className="mt-2 text-[11px] font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1 hover:underline cursor-pointer"
          >
            <span>Learn More</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      )}
    </aside>
  );
};

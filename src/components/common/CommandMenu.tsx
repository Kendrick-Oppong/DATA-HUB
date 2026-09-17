import React, { useState, useEffect } from 'react';
import { Search, X, Zap, ArrowRight, Smartphone, FileText, ShoppingBag, Shield, Wallet, BarChart3, HelpCircle, MessageSquare, Flag } from 'lucide-react';
import { UserRole } from '../../types';

interface CommandMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (role: UserRole, tab: string) => void;
  onSelectRole?: (role: UserRole) => void;
  onSelectTab?: (tab: string) => void;
  currentRole?: UserRole;
  onOpenFundWallet?: () => void;
  onToggleTheme?: () => void;
}

export const CommandMenu: React.FC<CommandMenuProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onSelectRole,
  onSelectTab,
  currentRole,
  onOpenFundWallet,
  onToggleTheme,
}) => {
  const [query, setQuery] = useState('');

  const navigateTo = (role: UserRole, tab: string) => {
    if (onNavigate) {
      onNavigate(role, tab);
    } else {
      if (onSelectRole) onSelectRole(role);
      if (onSelectTab) onSelectTab(tab);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const commands = [
    { id: 'c-buy-data', label: 'Buy Data Bundle (MTN / Telecel / AT)', category: 'Customer Actions', icon: Smartphone, action: () => navigateTo('customer', 'buy-data') },
    { id: 'c-buy-airtime', label: 'Buy Airtime Top-up', category: 'Customer Actions', icon: Zap, action: () => navigateTo('customer', 'buy-airtime') },
    { id: 'c-checker', label: 'Results Checker (WAEC WASSCE & BECE Placement)', category: 'Customer Actions', icon: FileText, action: () => navigateTo('customer', 'results-checker') },
    { id: 'c-afa', label: 'AFA Registration (Farmers Subsidized Tariff)', category: 'Customer Actions', icon: Shield, action: () => navigateTo('customer', 'afa') },
    { id: 'c-bills', label: 'Pay Utilities & Bills (ECG, GWCL, DSTV, GOtv)', category: 'Customer Actions', icon: Zap, action: () => navigateTo('customer', 'utilities') },
    { id: 'c-fund', label: 'Fund SDH Wallet (MTN MoMo / Telecel Cash / Card)', category: 'Wallet & Money', icon: Wallet, action: () => onOpenFundWallet?.() },
    { id: 'c-orders', label: 'View Order History & Delivery Status', category: 'Customer Actions', icon: FileText, action: () => navigateTo('customer', 'orders') },
    
    // Agent Tools
    { id: 'a-store', label: 'Agent Store Builder (Customize Brand & Margins)', category: 'Agent Workspace', icon: ShoppingBag, action: () => navigateTo('agent', 'my-store') },
    { id: 'a-sms', label: 'Bulk SMS Campaign Builder', category: 'Agent Workspace', icon: MessageSquare, action: () => navigateTo('agent', 'bulk-sms') },
    { id: 'a-pricing', label: 'Agent Pricing & Wholesale Margins', category: 'Agent Workspace', icon: BarChart3, action: () => navigateTo('agent', 'pricing') },
    { id: 'a-withdraw', label: 'Withdraw Commissions to MoMo', category: 'Agent Workspace', icon: Wallet, action: () => navigateTo('agent', 'withdraw') },

    // Admin & Ops
    { id: 'adm-gateways', label: 'Carrier Switches & Core Gateway Status', category: 'Admin Operations', icon: Shield, action: () => navigateTo('admin', 'gateways') },
    { id: 'adm-monitor', label: 'Order Monitor & Upstream Gateway Status', category: 'Admin Operations', icon: Shield, action: () => navigateTo('admin', 'orders-audit') },
    { id: 'adm-payouts', label: 'Payout Review Queue & Balances', category: 'Admin Operations', icon: Wallet, action: () => navigateTo('admin', 'settlement') },
    { id: 'adm-complaints', label: 'Complaints & Support Tickets Desk', category: 'Admin Operations', icon: Flag, action: () => navigateTo('admin', 'complaints') },
    { id: 'adm-afa', label: 'AFA National ID Verification Desk', category: 'Admin Operations', icon: Shield, action: () => navigateTo('admin', 'afa-verification') },
    { id: 'adm-stock', label: 'Voucher Stock Inventory Management', category: 'Admin Operations', icon: FileText, action: () => navigateTo('admin', 'vouchers-stock') },

    // Public & Support
    { id: 'p-track', label: 'Track Order with Reference or Phone', category: 'General', icon: Search, action: () => navigateTo('public', 'track') },
    { id: 'p-support', label: 'File a Complaint or Contact Support', category: 'General', icon: HelpCircle, action: () => navigateTo('customer', 'complaints') },
    { id: 'g-theme', label: 'Toggle Light / Dark Mode Theme', category: 'Preferences', icon: Zap, action: () => onToggleTheme?.() },
  ];

  const filtered = commands.filter((cmd) =>
    cmd.label.toLowerCase().includes(query.toLowerCase()) ||
    cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div 
        className="w-full max-w-xl bg-card text-card-foreground rounded-2xl border border-border shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center px-4 border-b border-border bg-muted/20">
          <Search className="w-5 h-5 text-muted-foreground mr-3 shrink-0" />
          <input
            autoFocus
            type="text"
            placeholder="Type a command, service, or search action... (ESC to close)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full py-3.5 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-hidden text-sm"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Command List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-border/40">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No matching actions found for "{query}". Try "data", "momo", or "store".
            </div>
          ) : (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-muted text-left transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-semibold text-foreground truncate">{item.label}</div>
                      <div className="text-[10px] text-muted-foreground">{item.category}</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </button>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-muted/40 border-t border-border flex justify-between items-center text-[11px] text-muted-foreground">
          <span>Smart Data Hub Global Navigator</span>
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded bg-muted border border-border font-mono">ESC</span>
            <span>to close</span>
          </div>
        </div>
      </div>
    </div>
  );
};

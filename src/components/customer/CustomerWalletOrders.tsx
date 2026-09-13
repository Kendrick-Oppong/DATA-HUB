import React from "react";
import { Order, Transaction, Complaint, AppTheme } from "../../types";
import { CustomerWalletView } from "./views/CustomerWalletView";
import { CustomerOrdersView } from "./views/CustomerOrdersView";
import { CustomerComplaintsView } from "./views/CustomerComplaintsView";
import { CustomerGuidesView } from "./views/CustomerGuidesView";
import { CustomerNotificationsView } from "./views/CustomerNotificationsView";
import { CustomerProfileView } from "./views/CustomerProfileView";

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
  onSetTheme,
  onOpenSecurityPins,
}) => {
  return (
    <div className="space-y-6">
      {view === "wallet" && (
        <CustomerWalletView
          walletBalance={walletBalance}
          onOpenFundWallet={onOpenFundWallet}
          transactions={transactions}
        />
      )}

      {view === "orders" && (
        <CustomerOrdersView
          orders={orders}
          onOpenReceipt={onOpenReceipt}
        />
      )}

      {view === "complaints" && (
        <CustomerComplaintsView
          complaints={complaints}
          onReplyComplaint={onReplyComplaint}
          onAddComplaint={onAddComplaint}
        />
      )}

      {view === "guides" && <CustomerGuidesView />}

      {view === "notifications" && <CustomerNotificationsView />}

      {view === "profile" && (
        <CustomerProfileView
          theme={theme}
          onSetTheme={onSetTheme}
          onOpenSecurityPins={onOpenSecurityPins}
        />
      )}
    </div>
  );
};

import React from "react";
import {
  AgentStoreConfig,
  DataBundle,
  Order,
  Transaction,
} from "../../types";
import { VerificationScreen } from "./VerificationScreen";
import { AgentOrdersView } from "./AgentOrdersView";
import { AgentBulkSms } from "./AgentBulkSms";
import { AgentAnalyticsEarnings } from "./AgentAnalyticsEarnings";
import { AgentTransactionsWallet } from "./AgentTransactionsWallet";
import { AgentPricing } from "./AgentPricing";

interface AgentCommerceProps {
  view:
    | "store-orders"
    | "pricing"
    | "analytics"
    | "earnings"
    | "bulk-sms"
    | "withdraw"
    | "wallet"
    | "transactions"
    | "verify";
  storeConfig: AgentStoreConfig;
  bundles: DataBundle[];
  orders: Order[];
  commissionBalance: number;
  walletBalance?: number;
  transactions?: Transaction[];
  onOpenFundWallet?: () => void;
  onWithdrawSuccess: (amount: number, reference: string) => void;
  onUpdateBundlePrice?: (bundleId: string, customPrice: number) => void;
  onUpdateOrders?: (orders: Order[]) => void;
  onNavigateTab?: (tab: string) => void;
}

export const AgentCommerce: React.FC<AgentCommerceProps> = ({
  view,
  storeConfig,
  bundles,
  orders,
  commissionBalance,
  walletBalance = 395.5,
  transactions = [],
  onOpenFundWallet = () => {},
  onWithdrawSuccess,
  onUpdateBundlePrice,
  onUpdateOrders,
  onNavigateTab,
}) => {
  return (
    <div>
      {/* VERIFICATION SCREEN */}
      {view === "verify" && <VerificationScreen />}

      {/* STORE ORDERS VIEW */}
      {view === "store-orders" && (
        <AgentOrdersView
          orders={orders}
          storeConfig={storeConfig}
          onUpdateOrders={onUpdateOrders}
          onNavigateTab={onNavigateTab}
        />
      )}

      {/* VIEW: WHOLESALE VS RETAIL PRICING & MARGINS */}
      {view === "pricing" && (
        <AgentPricing
          bundles={bundles}
          orders={orders}
          storeConfig={storeConfig}
          onUpdateBundlePrice={onUpdateBundlePrice}
          onNavigateTab={onNavigateTab}
        />
      )}

      {/* CONSOLIDATED VIEW: ANALYTICS & EARNINGS */}
      {(view === "analytics" || view === "earnings") && (
        <AgentAnalyticsEarnings
          orders={orders}
          bundles={bundles}
          commissionBalance={commissionBalance}
          onWithdrawSuccess={onWithdrawSuccess}
          onNavigateTab={onNavigateTab}
        />
      )}

      {/* CONSOLIDATED VIEW: TRANSACTIONS, WALLET & WITHDRAWALS */}
      {(view === "transactions" || view === "wallet" || view === "withdraw") && (
        <AgentTransactionsWallet
          walletBalance={walletBalance}
          commissionBalance={commissionBalance}
          transactions={transactions}
          onOpenFundWallet={onOpenFundWallet}
          onWithdrawSuccess={onWithdrawSuccess}
          onNavigateTab={onNavigateTab}
        />
      )}

      {/* VIEW: BULK SMS CAMPAIGNS */}
      {view === "bulk-sms" && <AgentBulkSms />}
    </div>
  );
};

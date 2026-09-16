import React from "react";
import { Info } from "lucide-react";
import { Order } from "../../types";
import { UtilitiesFlow } from "../customer/UtilitiesFlow";

interface AgentUtilitiesFlowProps {
  walletBalance: number;
  onOrderCreated: (order: Order) => void;
  onOpenReceipt: (order: Order) => void;
}

export const AgentUtilitiesFlow: React.FC<AgentUtilitiesFlowProps> = ({
  walletBalance,
  onOrderCreated,
  onOpenReceipt,
}) => {
  return (
    <div className="space-y-4">
      {/* Identical to the customer flow */}
      <UtilitiesFlow
        walletBalance={walletBalance}
        onOrderCreated={onOrderCreated}
        onOpenReceipt={onOpenReceipt}
      />
    </div>
  );
};

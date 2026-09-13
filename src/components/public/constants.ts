import { TelecomNetwork } from "../../types";

export const NETWORK_ACCENT: Record<
  TelecomNetwork,
  { text: string; bg: string; border: string; solid: string; short: string }
> = {
  MTN: {
    text: "text-[#8a6d00] dark:text-[#ffd84d]",
    bg: "bg-[#FFCC08]/15",
    border: "border-[#FFCC08]/50",
    solid: "bg-[#FFCC08]",
    short: "MTN",
  },
  Telecel: {
    text: "text-[#c8102e] dark:text-[#ff6b7f]",
    bg: "bg-[#E4002B]/10",
    border: "border-[#E4002B]/40",
    solid: "bg-[#E4002B]",
    short: "TC",
  },
  AirtelTigo: {
    text: "text-[#0033a0] dark:text-[#7da8ff]",
    bg: "bg-[#0033A0]/10",
    border: "border-[#0033A0]/40",
    solid: "bg-[#0033A0]",
    short: "AT",
  },
};

export const FAQS = [
  {
    q: "How fast will my data bundle or airtime be delivered?",
    a: "Over 98% of orders are delivered within 15 to 45 seconds of successful Mobile Money authorization. Our automated core switch directly connects to MTN EVD, Telecel Wholesale, and AT Direct Gateways.",
    tag: "Delivery",
  },
  {
    q: "Does Smart Data Hub support all Ghanaian networks?",
    a: "Yes. We support MTN Ghana (including Turbonet & Non-Expiry), Telecel Ghana (Extra & Bossu), and AirtelTigo (Big Time & Sika Data) with instant automated delivery.",
    tag: "Networks",
  },
  {
    q: "What happens if my Mobile Money is deducted but data is delayed?",
    a: "Our smart reconciliation engine verifies every transaction. If upstream network delays exceed 5 minutes, our system either retries via an alternate priority route or automatically refunds the full amount to your wallet.",
    tag: "Payments",
  },
  {
    q: "How can I become an Agent and start my own data business?",
    a: "Open the Agent Program page. You get wholesale pricing, your own customizable public storefront (e.g. smartdatahub.com/store/your-name), real-time commission tracking, and instant MoMo withdrawals.",
    tag: "Agents",
  },
  {
    q: "How do Result Checkers work?",
    a: "You can purchase authentic WAEC WASSCE, BECE Placement, and Nov/Dec vouchers. The serial and PIN are revealed immediately on screen and sent to your phone via SMS, ready to check on waecdirect.org.",
    tag: "Vouchers",
  },
  {
    q: "What is AFA Registration?",
    a: "AFA (Agricultural Workers Association) registration qualifies individuals for subsidized telecom data tariffs (e.g. 10GB for ~GH₵35). We process national ID verification and tariff enrollment.",
    tag: "AFA",
  },
];

export const CONTACT_CATEGORIES = [
  { value: "order-delivery-issue", label: "Order Delivery Delay" },
  { value: "momo-debited", label: "Mobile Money Debited but No Data" },
  { value: "voucher-failed", label: "Failed Result Checker Voucher" },
  { value: "agent-payout", label: "Agent Onboarding / Payout Question" },
  { value: "general", label: "General Feedback" },
];

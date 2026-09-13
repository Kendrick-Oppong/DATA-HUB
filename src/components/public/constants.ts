import type { LucideIcon } from "lucide-react";
import { Wifi, Store, ShieldCheck } from "lucide-react";
import { TelecomNetwork, UserRole } from "../../types";
import { PublicTabType } from "./sections/PublicHomeSection";

/* =====================================================================
 * CARRIER ACCENTS
 * ===================================================================== */
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

/* =====================================================================
 * FAQS
 * ===================================================================== */
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

/* =====================================================================
 * CONTACT FORM CATEGORIES
 * ===================================================================== */
export const CONTACT_CATEGORIES = [
  { value: "order-delivery-issue", label: "Order Delivery Delay" },
  { value: "momo-debited", label: "Mobile Money Debited but No Data" },
  { value: "voucher-failed", label: "Failed Result Checker Voucher" },
  { value: "agent-payout", label: "Agent Onboarding / Payout Question" },
  { value: "general", label: "General Feedback" },
];

/* =====================================================================
 * FOOTER
 * ===================================================================== */

/** Declarative action descriptor — resolved to an onClick handler inside PublicFooter */
export type FooterAction =
  | { type: "purchase"; bundleId: string; network: TelecomNetwork }
  | { type: "public"; tab: PublicTabType }
  | {
      type: "role";
      role: UserRole;
      tab: string;
      fallbackPublic?: PublicTabType;
      fallbackPurchase?: { bundleId: string; network: TelecomNetwork };
    };

export interface FooterItem {
  label: string;
  action: FooterAction;
}

export interface FooterColumn {
  key: string;
  icon: LucideIcon;
  iconColor: string;
  title: string;
  items: FooterItem[];
}

/** Brand block (column 1) */
export const FOOTER_BRAND = {
  short: "SDH",
  name: "Smart Data Hub",
  tagline:
    "Ghana's trusted consumer fintech and telecom resale infrastructure. Sub-minute automated delivery across all networks.",
  uptimeBadge: "Core Switch 99.8% Live",
};

/** Looping link columns (columns 2–4) */
export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    key: "services",
    icon: Wifi,
    iconColor: "text-primary",
    title: "Digital Services",
    items: [
      {
        label: "MTN Data Bundles",
        action: { type: "purchase", bundleId: "mtn-5gb", network: "MTN" },
      },
      {
        label: "Telecel Extra Bundles",
        action: {
          type: "purchase",
          bundleId: "telecel-10gb",
          network: "Telecel",
        },
      },
      {
        label: "AT Big Time Data",
        action: { type: "purchase", bundleId: "at-5gb", network: "AirtelTigo" },
      },
      {
        label: "Instant Airtime Top-up",
        action: { type: "purchase", bundleId: "airtime", network: "MTN" },
      },
      {
        label: "WASSCE & BECE Checkers",
        action: {
          type: "role",
          role: "customer",
          tab: "results-checker",
          fallbackPurchase: { bundleId: "waec-wassce", network: "MTN" },
        },
      },
      {
        label: "AFA Tariff Registration",
        action: {
          type: "role",
          role: "customer",
          tab: "afa-registration",
          fallbackPurchase: { bundleId: "afa", network: "MTN" },
        },
      },
      {
        label: "ECG & Utility Bill Pay",
        action: {
          type: "role",
          role: "customer",
          tab: "utilities",
          fallbackPublic: "services",
        },
      },
    ],
  },
  {
    key: "agent",
    icon: Store,
    iconColor: "text-primary",
    title: "Agent & Reseller",
    items: [
      {
        label: "Become an SDH Agent",
        action: { type: "public", tab: "agent" },
      },
      {
        label: "Profit Margin Calculator",
        action: { type: "public", tab: "agent" },
      },
      {
        label: "Wholesale Carrier Rates",
        action: { type: "public", tab: "services" },
      },
      {
        label: "Merchant Dashboard",
        action: {
          type: "role",
          role: "agent",
          tab: "my-store",
          fallbackPublic: "agent",
        },
      },
    ],
  },
  {
    key: "company",
    icon: ShieldCheck,
    iconColor: "text-emerald-500",
    title: "Company & Legal",
    items: [
      {
        label: "About Smart Data Hub",
        action: { type: "public", tab: "about" },
      },
      { label: "Live Order Tracker", action: { type: "public", tab: "track" } },
      { label: "Help Center & FAQs", action: { type: "public", tab: "faq" } },
      {
        label: "Terms of Service & SLA",
        action: { type: "public", tab: "contact" },
      },
      {
        label: "Privacy & Cookie Policy",
        action: { type: "public", tab: "contact" },
      },
    ],
  },
];

/** NOC contact block (column 5) */
export const FOOTER_NOC = {
  title: "Accra NOC Desk",
  address: "Airport Residential Area, Accra, Ghana.",
  phone: "+233 24 419 2834",
  email: "support@smartdatahub.com",
  whatsapp: {
    href: "https://wa.me/233244192834?text=Hello%20Smart%20Data%20Hub%20Support",
    label: "WhatsApp Priority Line",
  },
};

/** Bottom bar content */
export const FOOTER_COPYRIGHT =
  "© 2026 Smart Data Hub Ghana. All rights reserved.";
export const FOOTER_COMPLIANCE = "BoG Regulated Partner Settlement Rails";
export const FOOTER_PAYMENT_BADGES = [
  { label: "MTN MoMo", dotColor: "text-primary" },
  { label: "Telecel Cash", dotColor: "text-red-500" },
  { label: "AT Money", dotColor: "text-blue-500" },
];

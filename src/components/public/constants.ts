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
 * FAQS - Comprehensive Coverage of All Platform Features
 * ===================================================================== */
export const FAQS = [
  {
    q: "How fast will my data bundle or airtime be delivered?",
    a: "Over 98% of orders are delivered within 15 to 45 seconds of successful Mobile Money authorization. Our automated core switch directly connects to MTN EVD, Telecel Wholesale, and AT Direct Gateways.",
    tag: "Delivery",
  },
  {
    q: "Does Smart Data Hub support all Ghanaian telecom networks?",
    a: "Yes. We support MTN Ghana (including Turbonet & Non-Expiry), Telecel Ghana (Extra & Bossu), and AirtelTigo / AT Ghana (Big Time & Sika Data) with instant automated delivery.",
    tag: "Networks",
  },
  {
    q: "Do data bundles purchased on Smart Data Hub expire?",
    a: "We offer both non-expiry options (such as MTN Non-Expiry and AT Big Time) and standard 30-day validity packages. Specific validity details are clearly listed next to each bundle rate.",
    tag: "Networks",
  },
  {
    q: "What happens if my Mobile Money is debited but data is delayed?",
    a: "Our smart reconciliation engine automatically checks every order. If network delays exceed 5 minutes, our system either retries through a backup priority route or immediately issues a full automated refund to your SDH wallet.",
    tag: "Payments",
  },
  {
    q: "Which Mobile Money networks and payment methods can I use?",
    a: "You can pay using MTN Mobile Money, Telecel Cash, AT Money, or your preloaded Smart Data Hub wallet balance for seamless zero-prompt checkout.",
    tag: "Payments",
  },
  {
    q: "How do I become an Agent and start selling data for daily income?",
    a: "Simply click 'Become an Agent' to register. You get instant access to wholesale rates, your own customizable public storefront (e.g. smartdatahub.com/store/your-name), real-time margin tracking, and instant MoMo payouts.",
    tag: "Agents",
  },
  {
    q: "Are there any setup or monthly fees to join the Agent Program?",
    a: "No! Joining the Agent Program is completely free. There are zero registration fees, zero monthly maintenance fees, and no minimum order quotas.",
    tag: "Agents",
  },
  {
    q: "How and when can agents withdraw their earned profit commissions?",
    a: "Agents can request commission payouts anytime directly from their merchant dashboard. Funds are transferred instantly to your registered Mobile Money number with no minimum threshold.",
    tag: "Agents",
  },
  {
    q: "How do WAEC WASSCE and BECE Result Checkers work?",
    a: "After payment, your authentic voucher Serial Number and PIN are instantly displayed on your screen, saved to your digital receipt, and sent via SMS to your phone — ready to use on waecdirect.org.",
    tag: "Vouchers",
  },
  {
    q: "What is AFA Registration and how do I qualify for subsidized tariffs?",
    a: "AFA (Agricultural Workers & Farmers Association) registration grants access to discounted data rates (e.g., 10GB for ~GH₵35). You provide your Ghana Card details and mobile number for official tariff enrollment.",
    tag: "AFA",
  },
  {
    q: "Can I recharge airtime directly to any phone number?",
    a: "Yes. Our Airtime Top-up service supports instant electronic recharge for MTN, Telecel, and AirtelTigo from GH₵1.00 to GH₵500.00 directly to any active Ghana SIM.",
    tag: "Airtime",
  },
  {
    q: "Can I pay ECG electricity and Ghana Water utility bills here?",
    a: "Yes. Smart Data Hub provides unified bill payment for ECG Prepaid meters, Postpaid electricity, and Ghana Water Company bills with instant digital receipts.",
    tag: "Utilities",
  },
  {
    q: "How can I track my order if I forgot or misplaced my reference code?",
    a: "Visit the 'Track Order' page. You can search by entering either your order reference code (e.g., SDH-GH-2026-94812) or the beneficiary mobile phone number used during checkout.",
    tag: "Tracking",
  },
  {
    q: "Is Smart Data Hub secure and regulated?",
    a: "Yes. All financial transactions flow through Bank of Ghana (BoG) regulated Mobile Money settlement rails protected by 256-bit SSL encryption.",
    tag: "Payments",
  },
  {
    q: "How do I contact customer support if I need urgent help?",
    a: "Our NOC Support Desk is live 24/7. You can click the 'WhatsApp Priority Line' button to speak with a support engineer in real time, or submit a support ticket with your phone number.",
    tag: "Delivery",
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
export const FOOTER_COPYRIGHT = `© ${new Date().getFullYear()} Smart Data Hub Ghana. All rights reserved.`;
export const FOOTER_PAYMENT_BADGES = [
  { label: "MTN MoMo", dotColor: "text-primary" },
  { label: "Telecel Cash", dotColor: "text-red-500" },
  { label: "AT Money", dotColor: "text-blue-500" },
];

export type UserRole = "public" | "customer" | "agent" | "admin" | "storefront";

export type AppTheme =
  | "light"
  | "dark"
  | "sunset-amber"
  | "emerald-matrix"
  | "royal-indigo"
  | "ruby-red";

export interface UserAccount {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: UserRole;
  isKycVerified: boolean;
  ghanaCardNumber?: string;
  securityPin: string; // default 2026
}

export type TelecomNetwork = "MTN" | "Telecel" | "AirtelTigo";

export type OrderStatus =
  | "processing"
  | "delivered"
  | "failed"
  | "refunded"
  | "pending_payment";

export type ServiceType =
  | "data"
  | "airtime"
  | "checker"
  | "afa"
  | "utility"
  | "sms";

export interface DataBundle {
  id: string;
  network: TelecomNetwork;
  name: string;
  sizeGb: number;
  sizeLabel: string;
  validity: string;
  wholesalePrice: number; // in GH₵
  retailPrice: number; // default retail
  agentPrice?: number; // agent customized price
  category: "non_expiry" | "turbonet" | "special" | "sika";
  isPopular?: boolean;
}

export interface Order {
  id: string;
  reference: string;
  date: string;
  customerName: string;
  recipientPhone: string;
  network: TelecomNetwork;
  serviceType: ServiceType;
  productName: string;
  amount: number;
  paymentMethod: "wallet" | "momo_mtn" | "momo_telecel" | "momo_at" | "card";
  status: OrderStatus;
  agentId?: string;
  agentMargin?: number;
  deliveryTimeline?: {
    step: string;
    timestamp: string;
    status: "completed" | "current" | "pending" | "failed";
    note?: string;
  }[];
  failureReason?: string;
  voucherCode?: string;
  voucherSerial?: string;
  meterNumber?: string;
  meterToken?: string;
}

export interface Transaction {
  id: string;
  reference: string;
  date: string;
  type: "credit" | "debit";
  category:
    | "wallet_funding"
    | "purchase"
    | "commission"
    | "withdrawal"
    | "refund"
    | "promo_credit";
  amount: number;
  fee: number;
  balanceAfter: number;
  description: string;
  status: "completed" | "pending" | "failed";
  channel: string;
}

export interface ResultCheckerProduct {
  id: string;
  title: string;
  examBody: "WAEC" | "CSSPS" | "UNIVERSITY" | "NOVDEC";
  price: number;
  stockCount: number;
  description: string;
}

export interface AfaApplication {
  id: string;
  reference: string;
  fullName: string;
  phoneNumber: string;
  ghanaCardNumber: string;
  location: string;
  dateOfBirth: string;
  occupation: string;
  dateSubmitted: string;
  status: "under_review" | "approved" | "rejected" | "needs_correction";
  fee: number;
  notes?: string;
}

export interface Complaint {
  id: string;
  ticketNumber: string;
  orderReference?: string;
  category:
    | "delivery_delay"
    | "failed_recharge"
    | "wrong_number"
    | "momo_debit_no_credit"
    | "general";
  subject: string;
  status: "open" | "investigating" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  createdAt: string;
  lastUpdated: string;
  messages: {
    id: string;
    sender: "customer" | "agent" | "support_admin";
    senderName: string;
    text: string;
    timestamp: string;
  }[];
}

export interface AgentStoreConfig {
  agentName: string;
  storeName: string;
  handle: string; // e.g. kofi-telecom
  tagline: string;
  announcement: string;
  whatsappNumber: string;
  phone: string;
  email: string;
  status: "published" | "paused" | "draft";
  themeColor: string;
  bannerGradient: string;
  defaultNetwork: TelecomNetwork;
  marginMarkupPercent: number; // e.g. 8%
  customPrices: Record<string, number>; // bundleId -> custom retail price
  allowGuestCheckout: boolean;
  promoCodes: { code: string; discountPercent: number; active: boolean }[];
}

export interface PayoutRequest {
  id: string;
  reference: string;
  agentId: string;
  agentName: string;
  amount: number;
  fee: number;
  netAmount: number;
  momoNetwork: TelecomNetwork;
  momoNumber: string;
  accountName: string;
  requestDate: string;
  status: "pending" | "approved" | "rejected" | "processed";
  riskScore: "low" | "medium" | "high";
  notes?: string;
}

export interface BulkSmsCampaign {
  id: string;
  title: string;
  senderId: string;
  message: string;
  recipientCount: number;
  costPerSms: number;
  totalCost: number;
  pagesPerSms: number;
  dateCreated: string;
  status: "draft" | "scheduled" | "sent" | "delivering" | "failed";
  deliveryRatePercent: number;
}

export interface TelecomGateway {
  id: string;
  name: string;
  network: TelecomNetwork | "WAEC" | "MOFA" | "ECG";
  status: "online" | "degraded" | "offline";
  latencyMs: number;
  successRate: number;
  lastPing: string;
}

export type UserRole = "public" | "customer" | "agent" | "admin" | "storefront";

export type AppTheme = "light" | "dark" | "sunset-amber" | "ruby-red";

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
  | "waiting"
  | "processing"
  | "pending"
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

export type VerificationStatus = "verified" | "unverified";

export interface VerificationResult {
  phoneNumber: string;
  status: VerificationStatus;
  isEligible: boolean;
  explanation?: string;
}

export interface VerificationSummary {
  totalNumbers: number;
  verified: number;
  unverified: number;
}

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
  tier?: "standard" | "xpress" | "ishare" | "bigtime";
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
  paystackReference?: string;
  isPaymentVerified?: boolean;
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
  userName?: string;
  userRole?: "customer" | "agent" | "admin" | "storefront";
  userId?: string;
  recipientPhone?: string;
}

export interface ResultCheckerProduct {
  id: string;
  title: string;
  examBody: "WAEC" | "CSSPS" | "UNIVERSITY" | "NOVDEC";
  price: number;
  wholesalePrice?: number; // agent cost — retail is price, commission = price - wholesalePrice
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
  region?: string;
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
    | "general"
    | "commission_payout"
    | "store_issue"
    | "tier_dispute"
    | "order_problem"
    | "pricing_error"
    | string;
  subject: string;
  status: "open" | "investigating" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  createdAt: string;
  lastUpdated: string;
  userType?: "agent" | "customer";
  userName?: string;
  userContact?: string;
  assignedTo?: string;
  messages: {
    id: string;
    sender: "customer" | "agent" | "support_admin" | "admin" | "support" | string;
    senderName: string;
    text: string;
    timestamp: string;
  }[];
}

export interface PromoCode {
  code: string;
  type: "percent" | "fixed";
  value: number;
  scope: string;
  uses?: number;
  max?: number;
  active: boolean;
  discountPercent?: number;
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
  promoCodes: PromoCode[];
  storeLogo?: string | null;
  whatsappChannelUrl?: string;
  enabledNetworks?: (
    | TelecomNetwork
    | "MTN_XPRESS"
    | "AT_BIGTIME"
    | "AT_ISHARE"
  )[];
  enabledServices?: {
    airtime?: boolean;
    checker?: boolean;
    afa?: boolean;
  };
}

export interface PayoutRequest {
  id: string;
  reference: string;
  agentId?: string;
  agentName: string;
  agentHandle?: string;
  userId?: string;
  amount: number;
  fee?: number;
  netAmount?: number;
  network?: TelecomNetwork;
  momoNetwork?: TelecomNetwork;
  phoneNumber?: string;
  momoNumber?: string;
  accountName?: string;
  recipientName?: string;
  createdAt?: string;
  requestDate?: string;
  paidAt?: string;
  updatedAt?: string;
  status:
    | "pending"
    | "approved"
    | "rejected"
    | "processed"
    | "requested"
    | "paid"
    | "failed"
    | "processing";
  riskScore?: "low" | "medium" | "high";
  notes?: string;
  reason?: string;
  paystackTransferCode?: string;
  momoTransactionId?: string;
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
  status: "draft" | "scheduled" | "sent" | "delivering" | "failed" | "partial";
  deliveryRatePercent: number;
  audienceType?: "all" | "repeat" | "inactive" | "custom";
  sentCount?: number;
  failedCount?: number;
  refundedAmount?: number;
  recipients?: string[];
  deliveryTimeline?: {
    step: string;
    timestamp: string;
    status: "completed" | "current" | "pending" | "failed";
    note?: string;
  }[];
}

export interface SenderIdRecord {
  id: string;
  status: "approved" | "pending" | "rejected";
  isPlatformDefault?: boolean;
  requestedAt?: string;
  note?: string;
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

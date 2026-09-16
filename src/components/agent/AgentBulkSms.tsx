import React, { useState, useMemo, useEffect } from "react";
import {
  MessageSquare,
  Send,
  Clock,
  Search,
  SlidersHorizontal,
  Receipt,
  TrendingUp,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  RotateCcw,
  Copy,
  Check,
  Download,
  Plus,
  Eye,
  Filter,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Users,
  UserCheck,
  UserX,
  FileText,
  Radio,
  Info,
  Loader2,
  Smartphone,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import {
  BulkSmsCampaign,
  AgentStoreConfig,
  Order,
  SenderIdRecord,
} from "../../types";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "../ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { ScrollArea } from "../ui/scroll-area";
import { PaginationHelper } from "../customer/views/PaginationHelper";
import { SignalRail } from "../common/SignalRail";

// GSM-7 character set definition
const GSM7_BASIC =
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?" +
  "¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";
const GSM7_EXTENDED = "^{}\\[~]|€";

export function isGsm7String(text: string): boolean {
  for (const ch of text) {
    if (!GSM7_BASIC.includes(ch) && !GSM7_EXTENDED.includes(ch)) return false;
  }
  return true;
}

export function calculateSmsPages(message: string): {
  pages: number;
  isGsm: boolean;
  charLimit: number;
  septets: number;
} {
  const text = String(message || "");
  if (!text.length)
    return { pages: 0, isGsm: true, charLimit: 160, septets: 0 };

  const isGsm = isGsm7String(text);
  if (isGsm) {
    let septets = 0;
    for (const ch of text) septets += GSM7_EXTENDED.includes(ch) ? 2 : 1;
    if (septets <= 160)
      return { pages: 1, isGsm: true, charLimit: 160, septets };
    return {
      pages: Math.ceil(septets / 153),
      isGsm: true,
      charLimit: 153,
      septets,
    };
  } else {
    // UCS-2 (emojis or special unicode characters)
    const units = text.length;
    if (units <= 70)
      return { pages: 1, isGsm: false, charLimit: 70, septets: units };
    return {
      pages: Math.ceil(units / 67),
      isGsm: false,
      charLimit: 67,
      septets: units,
    };
  }
}

// Parses and normalizes Ghanaian phone numbers from free-form text input
export function parsePhoneNumbers(input: string): {
  valid: string[];
  invalidCount: number;
  duplicatesCount: number;
} {
  const seen = new Set<string>();
  let duplicates = 0;
  let invalid = 0;

  const rawTokens = input
    .split(/[\s,;]+/)
    .map((t) => t.trim())
    .filter(Boolean);

  for (const token of rawTokens) {
    const digits = token.replace(/\D/g, "");
    let standard = "";
    if (digits.length === 12 && digits.startsWith("233")) {
      standard = digits;
    } else if (digits.length === 10 && digits.startsWith("0")) {
      standard = "233" + digits.slice(1);
    } else if (digits.length === 9) {
      standard = "233" + digits;
    }

    if (standard && /^233\d{9}$/.test(standard)) {
      if (seen.has(standard)) {
        duplicates++;
      } else {
        seen.add(standard);
      }
    } else {
      invalid++;
    }
  }

  return {
    valid: Array.from(seen),
    invalidCount: invalid,
    duplicatesCount: duplicates,
  };
}

// Date formatter matching AgentOrdersView.tsx (YYYY-MM-DD HH:mm)
function formatCampaignDate(dateStr: string): string {
  if (!dateStr) return "—";
  try {
    const trimmed = dateStr.trim();
    const parseable = trimmed.includes("T")
      ? trimmed
      : trimmed.replace(" ", "T");
    const d = new Date(parseable);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const hours = String(d.getHours()).padStart(2, "0");
      const minutes = String(d.getMinutes()).padStart(2, "0");
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    }
    if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}/.test(trimmed)) {
      return trimmed.replace("T", " ").slice(0, 16);
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

// Pre-seeded campaigns for audit ledger
const DEFAULT_CAMPAIGNS: BulkSmsCampaign[] = [
  {
    id: "SMS-2026-9481",
    title: "Weekend Flash Sale Promo",
    senderId: "KOFI-DATA",
    message:
      "Weekend Special: Enjoy non-expiry MTN 5GB for GH₵ 29.50 today on Kofi Telecom! Visit smartdatahub.com/store/kofi-telecom to order now.",
    recipientCount: 145,
    costPerSms: 0.04,
    totalCost: 5.8,
    pagesPerSms: 1,
    dateCreated: "2026-09-14 10:30",
    status: "sent",
    deliveryRatePercent: 98.6,
    audienceType: "all",
    sentCount: 143,
    failedCount: 2,
    refundedAmount: 0.08,
    recipients: ["233244123456", "233559876543", "233201112233"],
    deliveryTimeline: [
      {
        step: "Campaign Composed & Validated",
        timestamp: "2026-09-14 10:30",
        status: "completed",
        note: "145 valid Ghanaian handsets queued",
      },
      {
        step: "Wallet Debited (GH₵ 5.80)",
        timestamp: "2026-09-14 10:30",
        status: "completed",
        note: "Billed at GH₵ 0.040 per SMS unit",
      },
      {
        step: "Telecom Gateway Handshake",
        timestamp: "2026-09-14 10:31",
        status: "completed",
        note: "Delivered through Arkesel SMS Core Switch",
      },
      {
        step: "Handset Acknowledgement (143/145)",
        timestamp: "2026-09-14 10:32",
        status: "completed",
        note: "143 delivered, 2 rejected (GH₵ 0.08 auto-refunded to wallet)",
      },
    ],
  },
  {
    id: "SMS-2026-9320",
    title: "Midweek 10GB Data Restock",
    senderId: "KOFI-DATA",
    message:
      "PROMO: MTN 10GB Data at GH₵ 57.00. Fast delivery, non-expiry. Order now: smartdatahub.com/store/kofi-telecom",
    recipientCount: 58,
    costPerSms: 0.04,
    totalCost: 2.32,
    pagesPerSms: 1,
    dateCreated: "2026-09-12 14:15",
    status: "sent",
    deliveryRatePercent: 100.0,
    audienceType: "repeat",
    sentCount: 58,
    failedCount: 0,
    refundedAmount: 0,
    recipients: ["233244222333", "233554445555"],
    deliveryTimeline: [
      {
        step: "Campaign Composed & Validated",
        timestamp: "2026-09-12 14:15",
        status: "completed",
        note: "58 repeat store buyers targeted",
      },
      {
        step: "Wallet Debited (GH₵ 2.32)",
        timestamp: "2026-09-12 14:15",
        status: "completed",
        note: "Full batch accepted",
      },
      {
        step: "Telecom Gateway Handshake",
        timestamp: "2026-09-12 14:16",
        status: "completed",
        note: "Fast path telecom queue acknowledged",
      },
      {
        step: "Handset Acknowledgement (58/58)",
        timestamp: "2026-09-12 14:17",
        status: "completed",
        note: "100% verified delivery to handset SIMs",
      },
    ],
  },
  {
    id: "SMS-2026-9154",
    title: "Customer Win-Back Broadcast",
    senderId: "OrderRef",
    message:
      "WE MISS YOU: It has been a while! Come back and enjoy great data packages with instant delivery. Order now at smartdatahub.com/store/kofi-telecom",
    recipientCount: 42,
    costPerSms: 0.04,
    totalCost: 1.68,
    pagesPerSms: 1,
    dateCreated: "2026-09-08 16:45",
    status: "partial",
    deliveryRatePercent: 95.2,
    audienceType: "inactive",
    sentCount: 40,
    failedCount: 2,
    refundedAmount: 0.08,
    recipients: ["233244998877", "233501234567"],
    deliveryTimeline: [
      {
        step: "Campaign Composed & Validated",
        timestamp: "2026-09-08 16:45",
        status: "completed",
        note: "42 inactive customers loaded",
      },
      {
        step: "Wallet Debited (GH₵ 1.68)",
        timestamp: "2026-09-08 16:45",
        status: "completed",
        note: "Initial broadcast debit",
      },
      {
        step: "Telecom Gateway Handshake",
        timestamp: "2026-09-08 16:46",
        status: "completed",
        note: "OrderRef platform sender routed",
      },
      {
        step: "Handset Acknowledgement (40/42)",
        timestamp: "2026-09-08 16:48",
        status: "completed",
        note: "2 barred numbers rejected · GH₵ 0.08 refunded",
      },
    ],
  },
  {
    id: "SMS-2026-8942",
    title: "Telecel Super Bonus Dispatch",
    senderId: "SDH Ghana",
    message:
      "Flash Sale: Telecel & MTN non-expiry bundles are in stock. Shop online at smartdatahub.com/store/kofi-telecom for instant delivery.",
    recipientCount: 30,
    costPerSms: 0.04,
    totalCost: 1.2,
    pagesPerSms: 1,
    dateCreated: "2026-09-16 09:10",
    status: "delivering",
    deliveryRatePercent: 80.0,
    audienceType: "custom",
    sentCount: 24,
    failedCount: 0,
    refundedAmount: 0,
    recipients: ["233243112233", "233558889999"],
    deliveryTimeline: [
      {
        step: "Campaign Composed & Validated",
        timestamp: "2026-09-16 09:10",
        status: "completed",
        note: "30 custom contacts dispatched",
      },
      {
        step: "Wallet Debited (GH₵ 1.20)",
        timestamp: "2026-09-16 09:10",
        status: "completed",
        note: "Wallet debit confirmed",
      },
      {
        step: "Telecom Gateway Handshake",
        timestamp: "2026-09-16 09:11",
        status: "current",
        note: "Carrier transmission in progress",
      },
      {
        step: "Handset Acknowledgement (24/30)",
        timestamp: "Pending",
        status: "pending",
        note: "Awaiting final carrier delivery receipt",
      },
    ],
  },
  {
    id: "SMS-2026-8710",
    title: "Monthly Price Drop Announcement",
    senderId: "KOFI-DATA",
    message:
      "Good news! Our MTN and Telecel data prices have dropped. Order now while stocks last at smartdatahub.com/store/kofi-telecom",
    recipientCount: 145,
    costPerSms: 0.04,
    totalCost: 5.8,
    pagesPerSms: 1,
    dateCreated: "2026-09-02 11:20",
    status: "sent",
    deliveryRatePercent: 97.9,
    audienceType: "all",
    sentCount: 142,
    failedCount: 3,
    refundedAmount: 0.12,
    recipients: ["233244123456", "233559876543"],
    deliveryTimeline: [
      {
        step: "Campaign Composed & Validated",
        timestamp: "2026-09-02 11:20",
        status: "completed",
        note: "145 store contacts queued",
      },
      {
        step: "Wallet Debited (GH₵ 5.80)",
        timestamp: "2026-09-02 11:20",
        status: "completed",
        note: "Wallet charge acknowledged",
      },
      {
        step: "Telecom Gateway Handshake",
        timestamp: "2026-09-02 11:21",
        status: "completed",
        note: "Gateway routing finished",
      },
      {
        step: "Handset Acknowledgement (142/145)",
        timestamp: "2026-09-02 11:23",
        status: "completed",
        note: "3 network timeouts reversed (GH₵ 0.12 refunded)",
      },
    ],
  },
];

// Pre-configured SMS Templates with [Agent Store Link] placeholders
const SMS_TEMPLATES = [
  {
    id: "promo",
    name: "Promo Special",
    body: "PROMO\n\nGet great data packages at competitive prices with fast delivery. Order now from your trusted agent.\n\nShop now: [Agent Store Link]",
  },
  {
    id: "missyou",
    name: "We Miss You",
    body: "WE MISS YOU\n\nIt's been a while since your last order. Come back and enjoy great data packages with instant delivery.\n\nOrder now: [Agent Store Link]",
  },
  {
    id: "were-back",
    name: "We're Back",
    body: "WE'RE BACK\n\nWe are ready to serve you with fast and reliable deliveries. Thank you for staying with us.\n\nPlace your order now: [Agent Store Link]",
  },
  {
    id: "need-data",
    name: "Need Data?",
    body: "NEED DATA?\n\nGet your data bundles quickly and at great prices. Place your order today and enjoy fast delivery.\n\nShop now: [Agent Store Link]",
  },
  {
    id: "restock",
    name: "Bundles Restocked",
    body: "Data bundles are available again in stock. Place your order today and we'll deliver straight to your SIM:\n\n[Agent Store Link]",
  },
  {
    id: "pricedrop",
    name: "Price Drop",
    body: "Good news! Our data bundle prices have dropped. Order today while stocks last at:\n\n[Agent Store Link]",
  },
];

interface AgentBulkSmsProps {
  orders?: Order[];
  storeConfig?: AgentStoreConfig;
  commissionBalance?: number;
  walletBalance?: number;
  onNavigateTab?: (tab: string) => void;
  onDebitWallet?: (amount: number) => boolean;
}

export const AgentBulkSms: React.FC<AgentBulkSmsProps> = ({
  orders = [],
  storeConfig = {
    agentName: "Kofi Mensah",
    storeName: "Kofi Telecom",
    handle: "kofi-telecom",
    tagline: "Instant Data Bundles & Telecom Value",
    announcement: "Best non-expiry data rates in Ghana",
    whatsappNumber: "0244123456",
    phone: "0244123456",
    email: "kofi@example.com",
    status: "published",
    themeColor: "#6366f1",
    bannerGradient: "from-blue-600 to-indigo-700",
    defaultNetwork: "MTN",
    marginMarkupPercent: 8,
    customPrices: {},
    allowGuestCheckout: true,
    promoCodes: [],
  },
  commissionBalance = 142.5,
  walletBalance = 85.0,
  onNavigateTab,
  onDebitWallet,
}) => {
  const CAMPAIGNS_PER_PAGE = 8;
  const SMS_UNIT_RATE = 0.04; // GH₵ 0.040 per SMS page

  // Local storage persisted campaigns list
  const [campaigns, setCampaigns] = useState<BulkSmsCampaign[]>(() => {
    try {
      const saved = localStorage.getItem("sdh_sms_campaigns_v2");
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_CAMPAIGNS;
  });

  const saveCampaigns = (newCampaigns: BulkSmsCampaign[]) => {
    setCampaigns(newCampaigns);
    try {
      localStorage.setItem(
        "sdh_sms_campaigns_v2",
        JSON.stringify(newCampaigns),
      );
    } catch {}
  };

  // Sender IDs list state
  const [senderIds, setSenderIds] = useState<SenderIdRecord[]>([
    {
      id: "KOFI-DATA",
      status: "approved",
      isPlatformDefault: false,
      requestedAt: "2026-08-10",
      note: "Registered & approved by NCA upstream",
    },
    {
      id: "OrderRef",
      status: "approved",
      isPlatformDefault: true,
      requestedAt: "2026-08-01",
      note: "Smart Data Hub shared transactional sender",
    },
    {
      id: "SDH Ghana",
      status: "approved",
      isPlatformDefault: true,
      requestedAt: "2026-08-01",
      note: "Platform announcement sender ID",
    },
  ]);

  // Modals state
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [showSenderModal, setShowSenderModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] =
    useState<BulkSmsCampaign | null>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [senderFilter, setSenderFilter] = useState<string>("all");
  const [audienceFilter, setAudienceFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Notice & clipboard states
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);

  // Compose Form Modal State
  const [composeSender, setComposeSender] = useState("KOFI-DATA");
  const [composeAudience, setComposeAudience] = useState<
    "all" | "repeat" | "inactive" | "custom"
  >("all");
  const [composeRecipientsText, setComposeRecipientsText] = useState("");
  const [composeMessage, setComposeMessage] = useState(
    "Weekend Special: Enjoy non-expiry MTN 5GB for GH₵ 29.50 today on Kofi Telecom! Visit smartdatahub.com/store/kofi-telecom to order now.",
  );
  const [composeTitle, setComposeTitle] = useState("");
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [newSenderInput, setNewSenderInput] = useState("");
  const [requestingSender, setRequestingSender] = useState(false);

  // Store Link substitution
  const storeUrl = useMemo(() => {
    if (typeof window !== "undefined" && window.location.origin) {
      return `${window.location.origin}/store/${storeConfig.handle || "my-store"}`;
    }
    return `https://smartdatahub.com/store/${storeConfig.handle || "my-store"}`;
  }, [storeConfig.handle]);

  // Derive real customer lists from agent orders
  const customerDirectory = useMemo(() => {
    const map: Record<
      string,
      { phone: string; name: string; count: number; lastDate: string }
    > = {};

    // First scan real orders if present
    orders.forEach((o) => {
      if (!o.recipientPhone) return;
      const phone = o.recipientPhone.trim();
      if (!map[phone]) {
        map[phone] = {
          phone,
          name: o.customerName || "Customer",
          count: 0,
          lastDate: o.date,
        };
      }
      map[phone].count += 1;
      if (
        new Date(o.date).getTime() > new Date(map[phone].lastDate).getTime()
      ) {
        map[phone].lastDate = o.date;
      }
    });

    const realList = Object.values(map);
    // If order history is fresh or small, supplement with realistic sample customer contacts
    const countAll = Math.max(145, realList.length);
    const countRepeat = Math.max(
      58,
      realList.filter((c) => c.count > 1).length,
    );
    const countInactive = Math.max(
      42,
      realList.filter((c) => c.count === 1).length,
    );

    return {
      allCount: countAll,
      repeatCount: countRepeat,
      inactiveCount: countInactive,
      realList,
    };
  }, [orders]);

  // Pre-fill numbers when audience changes
  const handleSelectAudience = (
    audience: "all" | "repeat" | "inactive" | "custom",
  ) => {
    setComposeAudience(audience);
    if (audience === "all") {
      const generated = [
        "0244123456",
        "0559876543",
        "0201112233",
        "0277889900",
        "0543216789",
        "0241998877",
        "0504443322",
        "0266554433",
        "0598877665",
        "0245667788",
        ...customerDirectory.realList.map((c) => c.phone),
      ];
      setComposeRecipientsText(
        Array.from(new Set(generated)).slice(0, 145).join("\n"),
      );
    } else if (audience === "repeat") {
      const repeatList = [
        "0244123456",
        "0559876543",
        "0201112233",
        "0277889900",
        "0543216789",
      ];
      setComposeRecipientsText(repeatList.join("\n"));
    } else if (audience === "inactive") {
      const inactiveList = ["0241998877", "0504443322", "0266554433"];
      setComposeRecipientsText(inactiveList.join("\n"));
    } else {
      setComposeRecipientsText("");
    }
  };

  // Initialize compose recipients if empty when opening modal
  useEffect(() => {
    if (showComposeModal && !composeRecipientsText.trim()) {
      handleSelectAudience("all");
    }
  }, [showComposeModal]);

  // Parse current compose recipient numbers
  const parsedRecipients = useMemo(() => {
    return parsePhoneNumbers(composeRecipientsText);
  }, [composeRecipientsText]);

  // Page calculations for compose message
  const messagePageStats = useMemo(() => {
    return calculateSmsPages(composeMessage);
  }, [composeMessage]);

  // Financial calculations for compose campaign
  const recipientCount = parsedRecipients.valid.length;
  const pagesPerSms = Math.max(1, messagePageStats.pages);
  const estimatedCampaignCost = Number(
    (recipientCount * pagesPerSms * SMS_UNIT_RATE).toFixed(2),
  );
  const walletRemaining = Math.max(0, walletBalance - estimatedCampaignCost);

  // Apply template with automatic store link injection
  const handleApplyTemplate = (tpl: (typeof SMS_TEMPLATES)[0]) => {
    setActiveTemplateId(tpl.id);
    const injected = tpl.body.split("[Agent Store Link]").join(storeUrl);
    setComposeMessage(injected);
    if (!composeTitle) {
      setComposeTitle(tpl.name);
    }
    setActionNotice(`Inserted "${tpl.name}" template with your store link.`);
    setTimeout(() => setActionNotice(null), 3000);
  };

  // Submit Bulk SMS Campaign
  const handleSendCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (recipientCount === 0) return;
    if (!composeMessage.trim()) return;

    setIsSending(true);

    setTimeout(() => {
      const campaignRef = `SMS-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const titleToUse =
        composeTitle.trim() ||
        `${composeSender} Broadcast (${formatCampaignDate(new Date().toISOString())})`;

      const newCampaign: BulkSmsCampaign = {
        id: campaignRef,
        title: titleToUse,
        senderId: composeSender,
        message: composeMessage,
        recipientCount: recipientCount,
        costPerSms: SMS_UNIT_RATE,
        totalCost: estimatedCampaignCost,
        pagesPerSms: pagesPerSms,
        dateCreated: new Date().toISOString().slice(0, 16).replace("T", " "),
        status: "sent",
        deliveryRatePercent: 99.1,
        audienceType: composeAudience,
        sentCount: recipientCount,
        failedCount: 0,
        refundedAmount: 0,
        recipients: parsedRecipients.valid,
        deliveryTimeline: [
          {
            step: "Campaign Composed & Validated",
            timestamp: new Date().toLocaleTimeString("en-GB"),
            status: "completed",
            note: `${recipientCount} valid Ghanaian numbers verified`,
          },
          {
            step: `Wallet Debited (GH₵ ${estimatedCampaignCost.toFixed(2)})`,
            timestamp: new Date().toLocaleTimeString("en-GB"),
            status: "completed",
            note: `${recipientCount} recipients × ${pagesPerSms} page(s) @ GH₵ 0.040`,
          },
          {
            step: "Telecom Gateway Transmission",
            timestamp: new Date().toLocaleTimeString("en-GB"),
            status: "completed",
            note: `Dispatched as ${composeSender} via Arkesel SMS Core Switch`,
          },
          {
            step: `Delivered to Beneficiary Handsets (${recipientCount}/${recipientCount})`,
            timestamp: new Date().toLocaleTimeString("en-GB"),
            status: "completed",
            note: "Telecommunication carrier delivery confirmed",
          },
        ],
      };

      const updated = [newCampaign, ...campaigns];
      saveCampaigns(updated);

      if (onDebitWallet) {
        onDebitWallet(estimatedCampaignCost);
      }

      setIsSending(false);
      setShowComposeModal(false);
      setActionNotice(
        `Campaign ${campaignRef} dispatched successfully to ${recipientCount} handsets!`,
      );
      setTimeout(() => setActionNotice(null), 4000);
    }, 1400);
  };

  // Re-dispatch failed recipients action
  const handleRedispatchCampaign = (campaignId: string) => {
    const updated = campaigns.map((c) => {
      if (c.id === campaignId) {
        return {
          ...c,
          status: "sent" as const,
          sentCount: c.recipientCount,
          failedCount: 0,
          deliveryRatePercent: 100.0,
          deliveryTimeline: [
            ...(c.deliveryTimeline || []),
            {
              step: "Failed Handsets Re-dispatched",
              timestamp: new Date().toLocaleTimeString("en-GB"),
              status: "completed" as const,
              note: "Re-routed through alternate telecom SMS trunk",
            },
          ],
        };
      }
      return c;
    });
    saveCampaigns(updated);
    if (selectedCampaign && selectedCampaign.id === campaignId) {
      setSelectedCampaign(
        updated.find((c) => c.id === campaignId) || selectedCampaign,
      );
    }
    setActionNotice("Failed numbers re-queued and delivered successfully.");
    setTimeout(() => setActionNotice(null), 3500);
  };

  // Request new Sender ID
  const handleRequestSenderId = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newSenderInput
      .toUpperCase()
      .trim()
      .replace(/[^A-Z0-9]/g, "");
    if (clean.length < 3 || clean.length > 11) {
      return;
    }
    setRequestingSender(true);
    setTimeout(() => {
      const newRecord: SenderIdRecord = {
        id: clean,
        status: "approved",
        isPlatformDefault: false,
        requestedAt: new Date().toISOString().split("T")[0],
        note: "Auto-approved for verified Ghana agent account",
      };
      setSenderIds((prev) => [...prev, newRecord]);
      setComposeSender(clean);
      setNewSenderInput("");
      setRequestingSender(false);
      setActionNotice(
        `Sender ID "${clean}" approved and ready for your campaigns!`,
      );
      setTimeout(() => setActionNotice(null), 3500);
    }, 1000);
  };

  // Export Campaigns CSV
  const handleExportCsv = () => {
    const headers = [
      "Campaign Ref",
      "Title",
      "Sender ID",
      "Audience",
      "Recipients",
      "Pages",
      "Cost (GHS)",
      "Status",
      "Delivery Rate",
      "Date",
    ];
    const rows = filteredCampaigns.map((c) => [
      c.id,
      `"${c.title}"`,
      c.senderId,
      c.audienceType || "all",
      c.recipientCount,
      c.pagesPerSms,
      c.totalCost.toFixed(2),
      c.status,
      `${c.deliveryRatePercent}%`,
      c.dateCreated,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `sdh_bulk_sms_campaigns_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter application matching AgentOrdersView
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      // Status filter
      if (statusFilter !== "all") {
        if (statusFilter === "sent" && c.status !== "sent") return false;
        if (statusFilter === "delivering" && c.status !== "delivering")
          return false;
        if (statusFilter === "partial" && c.status !== "partial") return false;
        if (statusFilter === "failed" && c.status !== "failed") return false;
      }

      // Sender ID filter
      if (senderFilter !== "all" && c.senderId !== senderFilter) {
        return false;
      }

      // Audience filter
      if (audienceFilter !== "all") {
        if ((c.audienceType || "all") !== audienceFilter) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesRef = c.id.toLowerCase().includes(query);
        const matchesTitle = c.title.toLowerCase().includes(query);
        const matchesSender = c.senderId.toLowerCase().includes(query);
        const matchesMsg = c.message.toLowerCase().includes(query);
        return matchesRef || matchesTitle || matchesSender || matchesMsg;
      }

      return true;
    });
  }, [campaigns, statusFilter, senderFilter, audienceFilter, searchQuery]);

  // Derived counts for metric tiles
  const totalCampaignCount = campaigns.length;
  const totalDeliveredCampaigns = campaigns.filter(
    (c) => c.status === "sent",
  ).length;
  const totalRecipientsReached = campaigns.reduce(
    (sum, c) => sum + (c.sentCount ?? c.recipientCount),
    0,
  );
  const totalSpend = campaigns.reduce((sum, c) => sum + c.totalCost, 0);
  const approvedSenderCount = senderIds.filter(
    (s) => s.status === "approved",
  ).length;

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    statusFilter !== "all" ||
    senderFilter !== "all" ||
    audienceFilter !== "all";

  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setSenderFilter("all");
    setAudienceFilter("all");
    setCurrentPage(1);
  };

  // Pagination calculation
  const totalPages =
    Math.ceil(filteredCampaigns.length / CAMPAIGNS_PER_PAGE) || 1;
  const paginatedCampaigns = useMemo(() => {
    const start = (currentPage - 1) * CAMPAIGNS_PER_PAGE;
    return filteredCampaigns.slice(start, start + CAMPAIGNS_PER_PAGE);
  }, [filteredCampaigns, currentPage]);

  return (
    <div className="space-y-6 animate-in fade-in-50">
      {/* 1. TOP HEADER (Exact parity with AgentOrdersView) */}
      <div className="flex flex-col items-start justify-between gap-4 border-b border-border pb-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-foreground">
            <MessageSquare className="size-6 text-primary" />
            <span>Bulk SMS Campaigns & Dispatches</span>
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Promotional broadcast and real-time delivery audits.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            onClick={() => setShowComposeModal(true)}
            className="text-xs font-bold shadow-xs cursor-pointer gap-1.5 h-9 bg-primary"
          >
            <Send className="size-4 stroke-3" />
            <span>Send New SMS</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSenderModal(true)}
            className="text-xs font-bold shadow-xs cursor-pointer gap-1.5 h-9"
          >
            <Sparkles className="size-4 text-primary" />
            <span>Sender IDs</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="text-xs font-bold shadow-xs cursor-pointer gap-1.5 h-9"
          >
            <Download className="size-4 stroke-3" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionNotice && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in-50">
          <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* 2. STATS CARDS (Exact match of AgentOrdersView 4-card grid) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Tile 1: All Campaigns */}
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
              <Receipt className="size-3.5 text-primary" />
            </div>
            <span className="text-[10px] font-bold uppercase  text-muted-foreground">
              All Campaigns
            </span>
          </div>
          <p className="mt-2 text-xl font-black tabular-nums text-foreground">
            {totalCampaignCount}
          </p>
          <p className="text-[10px] text-muted-foreground font-medium">
            Broadcast promotional batches
          </p>
        </div>

        {/* Tile 2: Recipients Reached */}
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10">
              <TrendingUp className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-[10px] font-bold uppercase  text-muted-foreground">
              Recipients
            </span>
          </div>
          <p className="mt-2 text-xl font-black tabular-nums text-foreground">
            {totalRecipientsReached.toLocaleString()}
          </p>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
            98.8% verified delivery rate
          </p>
        </div>

        {/* Tile 3: Total Spent */}
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10">
              <DollarSign className="size-3.5 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-[10px] font-bold uppercase  text-muted-foreground">
              Campaign Spend
            </span>
          </div>
          <p className="mt-2 text-xl font-black tabular-nums text-foreground">
            GH₵ {totalSpend.toFixed(2)}
          </p>
          <p className="text-[10px] text-muted-foreground font-medium">
            Billed from wallet @ GH₵ 0.04/pg
          </p>
        </div>

        {/* Tile 4: Sender IDs */}
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
              <ShieldCheck className="size-3.5 text-primary" />
            </div>
            <span className="text-[10px] font-bold uppercase  text-muted-foreground">
              Sender IDs
            </span>
          </div>
          <p className="mt-2 text-xl font-black tabular-nums text-foreground">
            {approvedSenderCount} Active
          </p>
          <p className="text-[10px] text-muted-foreground font-medium">
            1 Shared · 2 Custom approved
          </p>
        </div>
      </div>

      {/* 3. MASTER CAMPAIGNS TABLE CARD (Exact structure of AgentOrdersView) */}
      <Card className="border-border shadow-xs">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base font-extrabold text-foreground">
                All Bulk SMS Campaigns & Audit Ledger
              </CardTitle>
              <CardDescription className="mt-1 text-xs">
                Comprehensive log of customer promotional dispatches, message
                text, handset deliveries, and wallet debits.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        {/* Search + Filters (Styled exactly like AgentOrdersView) */}
        <div className="border-b border-border bg-muted/20 p-4">
          <div className="space-y-4">
            {/* Search */}
            <div className="space-y-1.5">
              <Label
                htmlFor="sms-search"
                className="text-[10px] font-bold uppercase  text-muted-foreground"
              >
                Search campaigns
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="sms-search"
                  type="text"
                  placeholder="Search campaigns by reference, sender ID, recipient number, or message text..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-10 bg-background pl-9 text-xs"
                />
              </div>
            </div>

            {/* Filters Box */}
            <div className="rounded-xl border border-border bg-background p-3">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="size-3.5 text-muted-foreground" />
                  <span className="text-[10px] font-bold uppercase  text-muted-foreground">
                    Campaign filters
                  </span>
                </div>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResetFilters}
                    className="h-6 px-2 text-[10px] font-bold text-primary hover:bg-primary/10 cursor-pointer"
                  >
                    Reset filters
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {/* Status Filter */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="filter-status"
                    className="text-[10px] font-semibold text-muted-foreground"
                  >
                    Delivery status
                  </Label>
                  <Select
                    value={statusFilter}
                    onValueChange={(val) => {
                      if (val) {
                        setStatusFilter(val);
                        setCurrentPage(1);
                      }
                    }}
                  >
                    <SelectTrigger
                      id="filter-status"
                      className="h-9 w-full text-xs"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        All statuses ({totalCampaignCount})
                      </SelectItem>
                      <SelectItem value="sent">
                        Delivered ({totalDeliveredCampaigns})
                      </SelectItem>
                      <SelectItem value="delivering">In Progress</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sender ID Filter */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="filter-sender"
                    className="text-[10px] font-semibold text-muted-foreground"
                  >
                    Sender ID
                  </Label>
                  <Select
                    value={senderFilter}
                    onValueChange={(val) => {
                      if (val) {
                        setSenderFilter(val);
                        setCurrentPage(1);
                      }
                    }}
                  >
                    <SelectTrigger
                      id="filter-sender"
                      className="h-9 w-full text-xs"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All sender IDs</SelectItem>
                      {senderIds.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.id} {s.isPlatformDefault ? "(Shared)" : "(Custom)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Audience Filter */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="filter-audience"
                    className="text-[10px] font-semibold text-muted-foreground"
                  >
                    Target audience
                  </Label>
                  <Select
                    value={audienceFilter}
                    onValueChange={(val) => {
                      if (val) {
                        setAudienceFilter(val);
                        setCurrentPage(1);
                      }
                    }}
                  >
                    <SelectTrigger
                      id="filter-audience"
                      className="h-9 w-full text-xs"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All target groups</SelectItem>
                      <SelectItem value="all">All Customers</SelectItem>
                      <SelectItem value="repeat">Repeat Buyers</SelectItem>
                      <SelectItem value="inactive">
                        Inactive Customers
                      </SelectItem>
                      <SelectItem value="custom">Custom Phone List</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[10px] font-bold uppercase  text-muted-foreground">
                  Campaign & Sender ID
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase  text-muted-foreground">
                  Audience & Target
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase  text-muted-foreground">
                  Message Preview
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase  text-muted-foreground">
                  Pages & Units
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase  text-muted-foreground text-right">
                  Cost
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase  text-muted-foreground text-center">
                  Status
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase  text-muted-foreground">
                  When
                </TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCampaigns.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-48 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-10 h-10 rounded-2xl bg-muted/60 flex items-center justify-center">
                        <MessageSquare className="size-5 text-muted-foreground" />
                      </div>
                      <p className="text-xs font-bold text-foreground">
                        No matching campaigns found
                      </p>
                      <p className="text-[11px] text-muted-foreground max-w-xs">
                        {hasActiveFilters
                          ? "Try modifying your search or clearing active filters to see more results."
                          : "Bulk SMS broadcasts dispatched to your customer base will appear here in the audit log."}
                      </p>
                      {hasActiveFilters && (
                        <Button
                          variant="link"
                          size="sm"
                          onClick={handleResetFilters}
                          className="text-xs font-bold text-primary cursor-pointer"
                        >
                          Clear all filters
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCampaigns.map((camp) => {
                  const isDelivered = camp.status === "sent";
                  const isDelivering = camp.status === "delivering";
                  const isPartial = camp.status === "partial";
                  const isFailed = camp.status === "failed";

                  return (
                    <TableRow
                      key={camp.id}
                      onClick={() => setSelectedCampaign(camp)}
                      className="hover:bg-muted/40 cursor-pointer transition-colors"
                    >
                      {/* Campaign & Sender ID */}
                      <TableCell className="text-xs">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-black shrink-0 ${
                              camp.senderId === "KOFI-DATA"
                                ? "bg-muted text-foreground border border-border"
                                : camp.senderId === "OrderRef"
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-amber-400 text-amber-950"
                            }`}
                          >
                            {camp.senderId}
                          </span>
                          <div className="min-w-0">
                            <div className="font-bold text-foreground truncate max-w-[160px] sm:max-w-xs">
                              {camp.title}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              {camp.id}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Audience */}
                      <TableCell className="text-xs">
                        <div className="font-semibold text-foreground">
                          {camp.audienceType === "all"
                            ? "All Customers"
                            : camp.audienceType === "repeat"
                              ? "Repeat Buyers"
                              : camp.audienceType === "inactive"
                                ? "Inactive (>30d)"
                                : "Custom List"}
                        </div>
                        <div className="text-[11px] text-muted-foreground font-medium">
                          {camp.recipientCount} contacts
                        </div>
                      </TableCell>

                      {/* Message Preview */}
                      <TableCell className="text-xs max-w-[200px]">
                        <p
                          className="truncate text-muted-foreground text-xs"
                          title={camp.message}
                        >
                          {camp.message}
                        </p>
                      </TableCell>

                      {/* Pages & Units */}
                      <TableCell className="text-xs">
                        <div className="font-bold text-foreground tabular-nums">
                          {camp.pagesPerSms} page
                          {camp.pagesPerSms !== 1 ? "s" : ""}
                        </div>
                        <div className="text-[10px] text-muted-foreground tabular-nums">
                          {camp.recipientCount * camp.pagesPerSms} billable
                          units
                        </div>
                      </TableCell>

                      {/* Cost */}
                      <TableCell className="text-right text-xs font-bold tabular-nums text-foreground">
                        GH₵ {camp.totalCost.toFixed(2)}
                      </TableCell>

                      {/* Status */}
                      <TableCell className="text-center">
                        {isDelivered && (
                          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold inline-flex items-center gap-1">
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            <span>Delivered</span>
                          </Badge>
                        )}
                        {isDelivering && (
                          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-[10px] font-bold inline-flex items-center gap-1">
                            <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                            <span>In Progress</span>
                          </Badge>
                        )}
                        {isPartial && (
                          <Badge className="bg-sky-500/15 text-sky-700 dark:text-sky-400 border border-sky-500/30 text-[10px] font-bold inline-flex items-center gap-1">
                            <span className="size-1.5 rounded-full bg-sky-500" />
                            <span>Partial</span>
                          </Badge>
                        )}
                        {isFailed && (
                          <Badge className="bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/30 text-[10px] font-bold inline-flex items-center gap-1">
                            <span className="size-1.5 rounded-full bg-red-500" />
                            <span>Failed</span>
                          </Badge>
                        )}
                      </TableCell>

                      {/* When */}
                      <TableCell className="text-xs text-foreground whitespace-nowrap">
                        {formatCampaignDate(camp.dateCreated)}
                      </TableCell>

                      {/* Action */}
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCampaign(camp);
                          }}
                        >
                          <ChevronRight className="size-4" />
                          <span className="sr-only">View Details</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {/* Pagination Footer */}
          <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs text-muted-foreground">
              Showing{" "}
              <span className="font-bold text-foreground">
                {filteredCampaigns.length === 0
                  ? 0
                  : Math.min(
                      currentPage * CAMPAIGNS_PER_PAGE,
                      filteredCampaigns.length,
                    )}
              </span>{" "}
              of{" "}
              <span className="font-bold text-foreground">
                {filteredCampaigns.length}
              </span>{" "}
              campaigns
            </span>

            {filteredCampaigns.length > CAMPAIGNS_PER_PAGE && (
              <div>
                <PaginationHelper
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 4. COMPOSE BULK SMS MODAL (Strictly modeled after AgentOrdersView Dialog structure) */}
      <Dialog open={showComposeModal} onOpenChange={setShowComposeModal}>
        <DialogContent className="flex h-[90vh] max-h-[90vh] sm:max-w-2xl flex-col gap-0 overflow-hidden rounded-3xl border border-border bg-card p-0 shadow-2xl">
          {/* Header */}
          <DialogHeader className="relative shrink-0 overflow-hidden border-b border-border bg-gradient-to-br from-primary/10 via-card to-amber-500/10 p-5 sm:p-6 pr-10 sm:pr-12">
            <div className="absolute -right-12 -top-12 size-32 rounded-full bg-primary/5" />
            <div className="absolute -bottom-16 left-1/3 size-40 rounded-full bg-amber-500/5" />

            <div className="relative flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl font-black text-xs shadow-sm bg-primary text-primary-foreground">
                  <Send className="size-5" />
                </span>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <DialogTitle className="text-left text-base font-extrabold tracking-tight truncate">
                      Compose SMS Campaign
                    </DialogTitle>
                  </div>
                  <DialogDescription className="mt-0.5 text-left text-xs">
                    Dispatch promotional messages directly to customer handsets
                    across all networks.
                  </DialogDescription>
                </div>
              </div>
            </div>
          </DialogHeader>

          {/* Scrollable Form Body */}
          <ScrollArea className="min-h-0 flex-1 overflow-hidden">
            <form
              id="bulk-sms-form"
              onSubmit={handleSendCampaign}
              className="p-5 sm:p-6 space-y-6"
            >
              {/* 1. Campaign Details & Sender ID Card */}
              <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
                <div className="px-5 py-3.5 border-b border-border bg-muted/30 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      Campaign Details
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Assign a reference title and choose your registered Sender
                      ID.
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-bold">
                    NCA Verified
                  </Badge>
                </div>

                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Title */}
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="campaign-title"
                        className="text-xs font-medium uppercase  text-muted-foreground"
                      >
                        Campaign Reference Title
                      </Label>
                      <Input
                        id="campaign-title"
                        type="text"
                        placeholder="e.g. Weekend Flash Sale Promo"
                        value={composeTitle}
                        onChange={(e) => setComposeTitle(e.target.value)}
                        className="h-10 text-xs bg-background"
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Internal label for your campaign ledger and records.
                      </p>
                    </div>

                    {/* Sender ID */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor="campaign-sender"
                          className="text-xs font-medium uppercase  text-muted-foreground"
                        >
                          Sender ID
                        </Label>
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          className="h-3 text-xs"
                          onClick={() => {
                            setShowComposeModal(false);
                            setShowSenderModal(true);
                          }}
                        >
                          + Register New
                        </Button>
                      </div>
                      <Select
                        value={composeSender}
                        onValueChange={(val) => val && setComposeSender(val)}
                      >
                        <SelectTrigger
                          id="campaign-sender"
                          className="!h-10 text-xs w-full"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {senderIds.map((s) => (
                            <SelectItem
                              key={s.id}
                              value={s.id}
                              className="text-xs"
                            >
                              {s.id}{" "}
                              <span className="text-[10px] text-muted-foreground font-normal">
                                {s.isPlatformDefault
                                  ? "(Shared Gateway)"
                                  : "(Your Registered ID)"}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-[11px] text-muted-foreground">
                        Header name displayed on recipient handsets.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Target Audience & Recipient Phone Numbers Card */}
              <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
                <div className="px-5 py-3.5 border-b border-border bg-muted/30 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      Target Recipients
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Select customer groups or paste custom phone numbers.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-primary tabular-nums">
                    {recipientCount} recipient{recipientCount !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="p-5 space-y-5">
                  {/* Target Audience Segment Selection */}
                  <div className="space-y-2.5">
                    <Label className="text-xs font-medium uppercase  text-muted-foreground">
                      Select Customer Segment
                    </Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        {
                          id: "all",
                          label: "All Customers",
                          sub: "Full directory",
                          count: customerDirectory.allCount,
                          icon: Users,
                        },
                        {
                          id: "repeat",
                          label: "Repeat Buyers",
                          sub: "2+ orders",
                          count: customerDirectory.repeatCount,
                          icon: UserCheck,
                        },
                        {
                          id: "inactive",
                          label: "Inactive (>30d)",
                          sub: "Win-back",
                          count: customerDirectory.inactiveCount,
                          icon: UserX,
                        },
                        {
                          id: "custom",
                          label: "Custom Numbers",
                          sub: "Manual paste",
                          count: parsedRecipients.valid.length,
                          icon: Smartphone,
                        },
                      ].map((aud) => {
                        const Icon = aud.icon;
                        const isSelected = composeAudience === aud.id;
                        return (
                          <Button
                            key={aud.id}
                            type="button"
                            variant={isSelected ? "default" : "outline"}
                            onClick={() => handleSelectAudience(aud.id as any)}
                            className={`h-auto py-3 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                              isSelected
                                ? "shadow-xs"
                                : "bg-card hover:bg-muted"
                            }`}
                          >
                            <div className="flex items-center justify-between w-full px-1">
                              <Icon
                                className={`size-4 ${
                                  isSelected
                                    ? "text-primary-foreground"
                                    : "text-muted-foreground"
                                }`}
                              />
                              <span
                                className={`text-xs font-black tabular-nums ${
                                  isSelected
                                    ? "text-primary-foreground"
                                    : "text-foreground"
                                }`}
                              >
                                {aud.count}
                              </span>
                            </div>
                            <div className="text-center">
                              <p
                                className={`text-xs font-bold ${
                                  isSelected
                                    ? "text-primary-foreground"
                                    : "text-foreground"
                                }`}
                              >
                                {aud.label}
                              </p>
                              <p
                                className={`text-[10px] ${isSelected ? "text-primary-foreground" : " text-foreground "}`}
                              >
                                {aud.sub}
                              </p>
                            </div>
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Capped Scrollable Recipient Textarea (Modeled on VerificationScreen.tsx) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="recipients-box"
                        className="text-xs font-medium uppercase  text-muted-foreground"
                      >
                        Recipient Phone Numbers
                      </Label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-emerald-600 tabular-nums">
                          {parsedRecipients.valid.length} valid number
                          {parsedRecipients.valid.length !== 1 ? "s" : ""}
                        </span>
                        {composeRecipientsText.trim() && (
                          <button
                            type="button"
                            onClick={() => {
                              setComposeRecipientsText("");
                              setComposeAudience("custom");
                            }}
                            className="text-xs font-semibold text-destructive hover:underline cursor-pointer"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>

                    <ScrollArea className="h-[150px] w-full rounded-xl border border-border bg-background">
                      <Textarea
                        id="recipients-box"
                        placeholder={
                          "0244123456\n0559876543\n0201122334\nOr paste comma-separated numbers"
                        }
                        value={composeRecipientsText}
                        onChange={(e) => {
                          setComposeRecipientsText(e.target.value);
                          if (composeAudience !== "custom")
                            setComposeAudience("custom");
                        }}
                        className="min-h-[150px] text-xs leading-relaxed border-0 focus-visible:ring-0 resize-none p-3.5 bg-transparent"
                      />
                    </ScrollArea>

                    <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-muted-foreground">
                      <span>
                        Ghanaian format: 024, 055, 020, 027 or 233...
                        (auto-normalized)
                      </span>
                      {parsedRecipients.duplicatesCount > 0 && (
                        <span className="text-amber-600 dark:text-amber-400 font-semibold">
                          {parsedRecipients.duplicatesCount} duplicate
                          {parsedRecipients.duplicatesCount !== 1
                            ? "s"
                            : ""}{" "}
                          deduplicated
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Message Content & Quick Templates Card */}
              <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
                <div className="px-5 py-3.5 border-b border-border bg-muted/30 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      Message Composition
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Pick a quick template or compose your promotional message.
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground font-semibold truncate max-w-[180px]">
                    {storeConfig.handle}.smartdatahub.com
                  </span>
                </div>

                <div className="p-5 space-y-5">
                  {/* Quick Templates Pill Grid (Structured like Sell Result Checker quantity pills) */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium uppercase  text-muted-foreground">
                        Quick Templates (Auto-inserts your store link)
                      </Label>
                      <span className="text-xs font-semibold text-primary">
                        1-Tap Selection
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {SMS_TEMPLATES.map((tpl) => {
                        const isSelected = activeTemplateId === tpl.id;
                        return (
                          <Button
                            key={tpl.id}
                            type="button"
                            variant={isSelected ? "default" : "outline"}
                            onClick={() => handleApplyTemplate(tpl)}
                            className={`h-10 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                              isSelected
                                ? "shadow-xs"
                                : "bg-card hover:bg-muted"
                            }`}
                          >
                            <Sparkles className="size-3.5 shrink-0 text-primary" />
                            <span className="truncate">{tpl.name}</span>
                          </Button>
                        );
                      })}
                    </div>
                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                      Select a preset template or compose your custom message in
                      the box below.
                    </p>
                  </div>

                  {/* Message Body Textarea */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="sms-message"
                        className="text-xs font-medium uppercase  text-muted-foreground"
                      >
                        SMS Message Body
                      </Label>
                      <div className="flex items-center gap-2 text-xs font-semibold">
                        <span className="text-foreground tabular-nums">
                          {composeMessage.length} chars
                        </span>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-primary font-bold tabular-nums">
                          {pagesPerSms} page{pagesPerSms !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                    <Textarea
                      id="sms-message"
                      rows={4}
                      required
                      placeholder="Type promotional announcement or paste copy here..."
                      value={composeMessage}
                      onChange={(e) => {
                        setComposeMessage(e.target.value);
                        if (activeTemplateId) setActiveTemplateId(null);
                      }}
                      className="text-xs leading-relaxed bg-background p-3.5 rounded-xl border border-border"
                    />

                    {/* Live GSM-7 vs UCS-2 status */}
                    <div className="flex items-center justify-between text-[11px]">
                      {messagePageStats.isGsm ? (
                        <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                          <Check className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>
                            Standard GSM-7 encoding (160 chars/page capacity)
                          </span>
                        </span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1.5">
                          <AlertCircle className="size-3.5 text-amber-500 shrink-0" />
                          <span>
                            Contains emojis or special symbols (UCS-2: 70
                            chars/page)
                          </span>
                        </span>
                      )}
                      <span className="text-muted-foreground font-semibold tabular-nums">
                        GH₵ {SMS_UNIT_RATE.toFixed(3)}/unit
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Campaign Financial & Debit Ledger Card */}
              <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
                <div className="px-5 py-3.5 border-b border-border bg-muted/30">
                  <h3 className="text-sm font-bold text-foreground">
                    Billing Summary
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Calculated at official wholesale rates and debited from your
                    agent wallet.
                  </p>
                </div>
                <div className="p-5 space-y-3 text-xs">
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Verified Handset Recipients:</span>
                    <span className="font-bold text-foreground tabular-nums">
                      {recipientCount} contacts
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Pages per Recipient:</span>
                    <span className="font-bold text-foreground tabular-nums">
                      {pagesPerSms} page{pagesPerSms !== 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Total Billable SMS Units:</span>
                    <span className="font-bold text-foreground tabular-nums">
                      {recipientCount * pagesPerSms} units
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Unit Rate:</span>
                    <span className="text-foreground font-semibold tabular-nums">
                      GH₵ {SMS_UNIT_RATE.toFixed(2)} per page
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-2.5 border-t border-border">
                    <span className="text-foreground font-bold">
                      Total Campaign Cost:
                    </span>
                    <span className="tabular-nums font-black text-primary text-base">
                      GH₵ {estimatedCampaignCost.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-1 text-muted-foreground">
                    <span>Current Wallet Balance:</span>
                    <span className="font-bold tabular-nums text-foreground">
                      GH₵ {walletBalance.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">
                      Balance After Dispatch:
                    </span>
                    <span
                      className={`font-bold tabular-nums ${
                        walletRemaining >= 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-destructive"
                      }`}
                    >
                      GH₵ {walletRemaining.toFixed(2)}
                    </span>
                  </div>

                  {/* Refund Assurance Strip */}
                  <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 text-[11px] text-muted-foreground flex items-center gap-2 mt-2">
                    <Info className="size-4 text-primary shrink-0" />
                    <span>
                      Charged directly from your agent wallet. Any undelivered
                      or rejected handset is auto-refunded to your wallet
                      instantaneously.
                    </span>
                  </div>
                </div>
              </div>
            </form>
          </ScrollArea>

          {/* Fixed Footer (Matching Attached Image and Sell Result Checker Voucher modal) */}
          <div className="shrink-0 border-t border-border bg-card p-4 sm:p-5">
            <Button
              type="submit"
              form="bulk-sms-form"
              disabled={
                isSending ||
                recipientCount === 0 ||
                !composeMessage.trim() ||
                walletRemaining < 0
              }
              size="lg"
              className="h-10 w-full font-semibold"
            >
              {isSending ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  <span>Authorizing Telecom Gateway Dispatch...</span>
                </>
              ) : (
                <>
                  <span>Authorize GH₵ {estimatedCampaignCost.toFixed(2)}</span>
                  <ArrowRight className="size-4 stroke-3" />
                </>
              )}
            </Button>

            <div className="mt-3 flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground">
              <ShieldCheck className="size-4 shrink-0 text-emerald-500" />
              <span className="text-[11px] sm:text-xs">
                Secured by Bank of Ghana Regulated Telecom Payment Switch
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 5. CAMPAIGN DETAIL MODAL (Matching AgentOrdersView Dialog exactly) */}
      <Dialog
        open={!!selectedCampaign}
        onOpenChange={(open) => !open && setSelectedCampaign(null)}
      >
        <DialogContent className="flex h-[90vh] max-h-[90vh] sm:max-w-lg flex-col gap-0 overflow-hidden rounded-3xl border border-border bg-card p-0 shadow-2xl">
          {selectedCampaign && (
            <>
              {/* Header */}
              <DialogHeader className="relative shrink-0 overflow-hidden border-b border-border bg-gradient-to-br from-primary/10 via-card to-amber-500/10 p-5 sm:p-6 pr-10 sm:pr-12">
                <div className="absolute -right-12 -top-12 size-32 rounded-full bg-primary/5" />
                <div className="absolute -bottom-16 left-1/3 size-40 rounded-full bg-amber-500/5" />

                <div className="relative flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex size-11 shrink-0 items-center justify-center rounded-2xl font-black text-xs shadow-sm ${
                        selectedCampaign.senderId === "KOFI-DATA"
                          ? "bg-muted border border-border text-foreground"
                          : selectedCampaign.senderId === "OrderRef"
                            ? "bg-primary text-primary-foreground"
                            : "bg-amber-400 text-amber-950"
                      }`}
                    >
                      {selectedCampaign.senderId.slice(0, 3).toUpperCase()}
                    </span>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <DialogTitle className="text-left text-base font-extrabold tracking-tight truncate">
                          {selectedCampaign.title}
                        </DialogTitle>

                        <Badge
                          variant="secondary"
                          className={
                            selectedCampaign.status === "sent"
                              ? "border-emerald-500/30 bg-emerald-500/15 px-2 py-0 text-[10px] font-bold text-emerald-700 dark:text-emerald-400"
                              : selectedCampaign.status === "failed"
                                ? "border-red-500/30 bg-red-500/15 px-2 py-0 text-[10px] font-bold text-red-700 dark:text-red-400"
                                : "border-amber-500/30 bg-amber-500/15 px-2 py-0 text-[10px] font-bold text-amber-700 dark:text-amber-400"
                          }
                        >
                          {selectedCampaign.status.toUpperCase()}
                        </Badge>
                      </div>

                      <DialogDescription className="mt-0.5 text-left text-xs">
                        Ref:{" "}
                        <span className="font-bold text-foreground">
                          {selectedCampaign.id}
                        </span>{" "}
                        · Sender: {selectedCampaign.senderId} ·{" "}
                        {selectedCampaign.pagesPerSms} Page(s)
                      </DialogDescription>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              {/* Scrollable Modal Body */}
              <ScrollArea className="min-h-0 flex-1 overflow-hidden">
                <div className="p-5 sm:p-6 space-y-5">
                  {/* Status Banner */}
                  {selectedCampaign.status === "sent" ? (
                    <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3.5">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="size-4" />
                      </div>
                      <div className="min-w-0 text-xs">
                        <div className="font-bold text-foreground">
                          Dispatched & Delivered Successfully
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {selectedCampaign.sentCount ??
                            selectedCampaign.recipientCount}{" "}
                          of {selectedCampaign.recipientCount} handsets
                          acknowledged carrier delivery.
                        </div>
                      </div>
                    </div>
                  ) : selectedCampaign.status === "delivering" ? (
                    <div className="flex items-center gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3.5">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        <Clock className="size-4 animate-spin" />
                      </div>
                      <div className="min-w-0 text-xs">
                        <div className="font-bold text-foreground">
                          Transmission in Progress
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          Carrier trunk queue is active. Remaining delivery
                          receipts updating live.
                        </div>
                      </div>
                    </div>
                  ) : selectedCampaign.status === "partial" ? (
                    <div className="flex items-center gap-3 rounded-2xl border border-sky-500/20 bg-sky-500/5 p-3.5">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
                        <Info className="size-4" />
                      </div>
                      <div className="min-w-0 text-xs">
                        <div className="font-bold text-foreground">
                          Partial Delivery with Instant Refund
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {selectedCampaign.failedCount} recipient(s) rejected
                          by telecom. GH₵{" "}
                          {(selectedCampaign.refundedAmount ?? 0).toFixed(2)}{" "}
                          was refunded to your wallet.
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-3.5">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-600 dark:text-red-400">
                        <XCircle className="size-4" />
                      </div>
                      <div className="min-w-0 text-xs">
                        <div className="font-bold text-foreground">
                          Broadcast Failed
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          Telecom gateway refused the batch. Full amount
                          credited back to wallet.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Delivery Route Path */}
                  <div className="rounded-xl border border-border bg-muted/20 p-3">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground  mb-2.5">
                      SMS Transmission Route
                    </p>
                    <div className="flex items-center gap-1.5">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-[9px] font-black text-primary-foreground">
                        YOU
                      </div>
                      <div className="relative flex-1 h-px bg-primary/25">
                        <div
                          className="absolute inset-y-0 left-0 bg-primary transition-all duration-700 rounded-full"
                          style={{ width: "100%" }}
                        />
                      </div>
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-[9px] font-black text-primary border border-primary/30">
                        SDH
                      </div>
                      <div className="relative flex-1 h-px bg-primary/25">
                        <div
                          className="absolute inset-y-0 left-0 bg-primary transition-all duration-700 rounded-full"
                          style={{ width: "100%" }}
                        />
                      </div>
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-[9px] font-black text-amber-950">
                        CORE
                      </div>
                      <div className="relative flex-1 h-px bg-primary/25">
                        <div
                          className="absolute inset-y-0 left-0 bg-primary transition-all duration-700 rounded-full"
                          style={{
                            width:
                              selectedCampaign.status === "sent"
                                ? "100%"
                                : "60%",
                          }}
                        />
                      </div>
                      <div
                        className={`flex size-7 shrink-0 items-center justify-center rounded-lg transition-colors ${
                          selectedCampaign.status === "sent"
                            ? "bg-emerald-500 text-white"
                            : "bg-muted border border-border text-muted-foreground"
                        }`}
                      >
                        {selectedCampaign.status === "sent" ? (
                          <Check className="size-3" />
                        ) : (
                          <Radio className="size-3 animate-pulse" />
                        )}
                      </div>
                    </div>
                    <div className="mt-1.5 flex justify-between text-[9px] text-muted-foreground">
                      <span>Agent Portal</span>
                      <span>SDH Switch</span>
                      <span>Carrier Gateway</span>
                      <span>Handsets</span>
                    </div>
                  </div>

                  {/* Signal Dispatch Timeline */}
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] mb-3 font-bold uppercase text-muted-foreground ">
                        Signal Dispatch Timeline
                      </p>

                      <div className="space-y-0">
                        {(
                          selectedCampaign.deliveryTimeline || [
                            {
                              step: "Campaign Composed & Validated",
                              timestamp: formatCampaignDate(
                                selectedCampaign.dateCreated,
                              ),
                              status: "completed",
                              note: `${selectedCampaign.recipientCount} valid recipient numbers`,
                            },
                            {
                              step: "Wallet Debit",
                              timestamp: formatCampaignDate(
                                selectedCampaign.dateCreated,
                              ),
                              status: "completed",
                              note: `GH₵ ${selectedCampaign.totalCost.toFixed(2)} billed at GH₵ 0.04/unit`,
                            },
                            {
                              step: "Arkesel Telecom Switch",
                              timestamp: "Completed",
                              status: "completed",
                              note: `Dispatched as ${selectedCampaign.senderId}`,
                            },
                            {
                              step: "Beneficiary SIM Handshake",
                              timestamp:
                                selectedCampaign.status === "sent"
                                  ? "Confirmed"
                                  : "Processing",
                              status:
                                selectedCampaign.status === "sent"
                                  ? "completed"
                                  : "current",
                              note: `${selectedCampaign.deliveryRatePercent}% acknowledgement`,
                            },
                          ]
                        ).map((item, idx) => {
                          const isCompleted = item.status === "completed";
                          const isCurrent = item.status === "current";
                          const isFailed = item.status === "failed";
                          const isLast =
                            idx ===
                            (selectedCampaign.deliveryTimeline || []).length -
                              1;
                          return (
                            <div key={idx} className="flex gap-3">
                              <div className="flex flex-col items-center shrink-0 w-6">
                                <div
                                  className={`relative flex size-6 items-center justify-center rounded-full border-2 shrink-0 transition-all ${
                                    isCompleted
                                      ? "bg-primary border-primary text-primary-foreground"
                                      : isCurrent
                                        ? "bg-background border-primary text-primary"
                                        : isFailed
                                          ? "bg-red-500/10 border-red-500 text-red-500"
                                          : "bg-muted border-border text-muted-foreground"
                                  }`}
                                >
                                  {isCurrent && (
                                    <span className="absolute inset-0 rounded-full animate-ping bg-primary/20" />
                                  )}
                                  {isCompleted ? (
                                    <Check className="size-3" />
                                  ) : isCurrent ? (
                                    <span className="size-1.5 rounded-full bg-primary" />
                                  ) : isFailed ? (
                                    <span className="text-[9px] font-black">
                                      ✕
                                    </span>
                                  ) : (
                                    <span className="text-[9px] font-black">
                                      {idx + 1}
                                    </span>
                                  )}
                                </div>
                                {!isLast && (
                                  <div
                                    className={`w-0.5 flex-1 my-1 min-h-[1.25rem] ${
                                      isCompleted ? "bg-primary" : "bg-border"
                                    }`}
                                  />
                                )}
                              </div>
                              <div
                                className={`pb-4 flex-1 ${isLast ? "pb-0" : ""}`}
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <p
                                    className={`text-xs font-bold ${
                                      isCompleted
                                        ? "text-foreground"
                                        : isCurrent
                                          ? "text-primary"
                                          : isFailed
                                            ? "text-red-600"
                                            : "text-muted-foreground"
                                    }`}
                                  >
                                    {item.step}
                                  </p>
                                  <span className="text-[9px] font-semibold text-muted-foreground tabular-nums">
                                    {item.timestamp}
                                  </span>
                                </div>
                                {item.note && (
                                  <p className="mt-0.5 text-[11px] text-muted-foreground leading-relaxed">
                                    {item.note}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Message Content Box */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase  text-muted-foreground">
                        Message Content Dispatched
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            selectedCampaign.message,
                          );
                          setCopiedMessage(true);
                          setTimeout(() => setCopiedMessage(false), 2000);
                        }}
                        className="h-6 text-[10px] gap-1 text-primary cursor-pointer hover:bg-primary/10"
                      >
                        {copiedMessage ? (
                          <>
                            <Check className="size-3 text-emerald-600" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="size-3" />
                            <span>Copy Text</span>
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-muted/40 border border-border text-xs leading-relaxed text-foreground whitespace-pre-wrap select-all">
                      {selectedCampaign.message}
                    </div>
                  </div>

                  {/* Ledger Details Rows (Exact style of AgentOrdersView) */}
                  <div className="space-y-2.5 rounded-2xl bg-muted/30 border border-border p-4 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground font-semibold">
                        Campaign Reference:
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-foreground">
                          {selectedCampaign.id}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(selectedCampaign.id);
                            setCopiedRef(true);
                            setTimeout(() => setCopiedRef(false), 2000);
                          }}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          {copiedRef ? (
                            <Check className="size-3 text-emerald-600" />
                          ) : (
                            <Copy className="size-3" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground font-semibold">
                        Sender ID:
                      </span>
                      <span className="font-bold text-foreground">
                        {selectedCampaign.senderId}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground font-semibold">
                        Total Contacts:
                      </span>
                      <span className="font-bold text-foreground tabular-nums">
                        {selectedCampaign.recipientCount} handsets
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground font-semibold">
                        Delivered Successfully:
                      </span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {selectedCampaign.sentCount ??
                          selectedCampaign.recipientCount}{" "}
                        handsets ({selectedCampaign.deliveryRatePercent}%)
                      </span>
                    </div>

                    {selectedCampaign.failedCount ? (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground font-semibold">
                          Failed Handsets:
                        </span>
                        <span className="font-bold text-destructive tabular-nums">
                          {selectedCampaign.failedCount} rejected
                        </span>
                      </div>
                    ) : null}

                    {selectedCampaign.refundedAmount ? (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground font-semibold">
                          Auto-Refunded to Wallet:
                        </span>
                        <span className="font-bold text-emerald-600 tabular-nums">
                          +GH₵ {selectedCampaign.refundedAmount.toFixed(2)}
                        </span>
                      </div>
                    ) : null}

                    <div className="flex justify-between items-center pt-2 border-t border-border">
                      <span className="text-muted-foreground font-semibold">
                        Net Debited Cost:
                      </span>
                      <span className="tabular-nums font-black text-foreground text-sm">
                        GH₵ {selectedCampaign.totalCost.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Resolution Controls */}
                  {selectedCampaign.failedCount &&
                  selectedCampaign.failedCount > 0 ? (
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold uppercase  text-muted-foreground">
                        Resolution Controls
                      </span>
                      <Button
                        type="button"
                        onClick={() =>
                          handleRedispatchCampaign(selectedCampaign.id)
                        }
                        className="w-full text-xs font-bold gap-1.5 h-9 bg-primary cursor-pointer shadow-xs"
                      >
                        <RefreshCw className="size-3.5" />
                        <span>
                          Re-dispatch to {selectedCampaign.failedCount} Failed
                          Recipients
                        </span>
                      </Button>
                    </div>
                  ) : null}
                </div>
              </ScrollArea>

              {/* Fixed Footer */}
              <DialogFooter className="shrink-0 border-t border-border bg-muted/40 p-0">
                <div className="flex gap-2 px-6 py-4 pb-6 w-full">
                  <Button
                    type="button"
                    onClick={() => setSelectedCampaign(null)}
                    className="text-xs  w-full font-bold h-9 px-5 cursor-pointer"
                  >
                    Close
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* 6. SENDER IDS REGISTRY MODAL */}
      <Dialog open={showSenderModal} onOpenChange={setShowSenderModal}>
        <DialogContent className="flex h-[85vh] max-h-[85vh] sm:max-w-md flex-col gap-0 overflow-hidden rounded-3xl border border-border bg-card p-0 shadow-2xl">
          <DialogHeader className="shrink-0 border-b border-border bg-gradient-to-br from-primary/10 via-card to-amber-500/10 p-5 sm:p-6 pr-10">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-black text-xs shadow-sm">
                <ShieldCheck className="size-5" />
              </span>
              <div>
                <DialogTitle className="text-base font-extrabold tracking-tight">
                  Alphanumeric Sender IDs
                </DialogTitle>
                <DialogDescription className="text-xs mt-0.5">
                  Register up to 11 uppercase characters. Messages will appear
                  on customer phones under your brand name.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Fixed Registration Form at Top */}
          <div className="shrink-0 border-b border-border bg-muted/20 p-4">
            <form
              id="sender-id-form"
              onSubmit={handleRequestSenderId}
              className="space-y-2"
            >
              <div className="flex items-center gap-2">
                <Label className="text-xs font-medium uppercase  text-muted-foreground">
                  Register New Sender ID
                </Label>
              </div>
              <div className="space-y-1.5">
                <Input
                  type="text"
                  maxLength={11}
                  required
                  placeholder="e.g. KWESIDATA"
                  value={newSenderInput}
                  onChange={(e) =>
                    setNewSenderInput(
                      e.target.value
                        .toUpperCase()
                        .replace(/[^A-Z0-9]/g, "")
                        .slice(0, 11),
                    )
                  }
                  className="uppercase text-xs h-10 bg-background"
                />
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>3–11 alphanumeric characters, no spaces</span>
                  <span className="font-semibold tabular-nums">
                    {newSenderInput.length}/11
                  </span>
                </div>
              </div>
            </form>
          </div>

          {/* Scrollable List of Sender IDs */}
          <ScrollArea className="min-h-0 flex-1 overflow-hidden">
            <div className="p-5 sm:p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase  text-muted-foreground">
                  Approved Sender Names
                </span>
                <Badge variant="outline" className="text-[10px] font-bold">
                  NCA Verified
                </Badge>
              </div>
              <div className="space-y-2">
                {senderIds.map((s) => (
                  <div
                    key={s.id}
                    className="p-3.5 rounded-xl border border-border bg-card flex items-center justify-between shadow-2xs"
                  >
                    <div>
                      <div className="font-extrabold text-sm text-foreground">
                        {s.id}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {s.note || "Approved for broadcast dispatch"}
                      </div>
                    </div>
                    <Badge
                      variant="secondary"
                      className="border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold"
                    >
                      Active
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>

          {/* Footer */}
          <DialogFooter className="shrink-0 border-t border-border bg-muted/40 p-0">
            <div className="flex items-center gap-2 px-6 py-4 pb-6 w-full">
              <Button
                type="submit"
                form="sender-id-form"
                disabled={requestingSender || newSenderInput.length < 3}
                className="w-full text-xs font-bold gap-1.5 h-9 bg-primary cursor-pointer disabled:opacity-50"
              >
                {requestingSender ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Registering...</span>
                  </>
                ) : (
                  <>
                    <Plus className="size-4" />
                    <span>Submit for Approval</span>
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

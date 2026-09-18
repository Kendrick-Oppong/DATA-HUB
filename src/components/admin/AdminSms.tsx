import React, { useState, useMemo } from "react";
import {
  Send,
  MessageSquare,
  ShieldCheck,
  Clock,
  Search,
  SlidersHorizontal,
  Download,
  X,
  Check,
  Radio,
  Users,
} from "lucide-react";
import { BulkSmsCampaign, SenderIdRecord } from "../../types";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../ui/pagination";

export interface AdminSmsProps {
  campaigns?: BulkSmsCampaign[];
  senderIds?: SenderIdRecord[];
  onApproveSenderId?: (id: string) => void;
  onRejectSenderId?: (id: string) => void;
  onNavigateTab?: (tab: string) => void;
}

const ITEMS_PER_PAGE = 8;

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(
      dateStr.includes("T") ? dateStr : dateStr.replace(" ", "T"),
    );
    if (isNaN(d.getTime())) return dateStr;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  } catch {
    return dateStr;
  }
}

// ── Default seed data ──────────────────────────────────────────────────────

const DEFAULT_SENDER_IDS: SenderIdRecord[] = [
  {
    id: "SDH Ghana",
    status: "approved",
    isPlatformDefault: true,
    requestedAt: "2026-08-01",
    note: "Platform announcement sender — approved by NCA",
  },
  {
    id: "OrderRef",
    status: "approved",
    isPlatformDefault: true,
    requestedAt: "2026-08-01",
    note: "Shared transactional sender — approved by NCA",
  },
  {
    id: "KOFI-DATA",
    status: "approved",
    isPlatformDefault: false,
    requestedAt: "2026-08-10",
    note: "Agent Kofi Owusu — registered and cleared by telcos",
  },
  {
    id: "AMASTORE",
    status: "pending",
    isPlatformDefault: false,
    requestedAt: "2026-09-12",
    note: "Agent Ama Serwaa — pending NCA upstream registration",
  },
  {
    id: "DATAQUICK",
    status: "pending",
    isPlatformDefault: false,
    requestedAt: "2026-09-14",
    note: "Agent Yaw Mensah — submitted for NCA approval",
  },
  {
    id: "KOFITELECOM",
    status: "rejected",
    isPlatformDefault: false,
    requestedAt: "2026-09-05",
    note: "Rejected: exceeds 11-character NCA alphanumeric limit",
  },
];

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
  },
  {
    id: "SMS-2026-8710",
    title: "Monthly Price Drop Announcement",
    senderId: "KOFI-DATA",
    message:
      "Good news! Our MTN and Telecel data prices have dropped. Order today while stocks last at smartdatahub.com/store/kofi-telecom",
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
  },
  {
    id: "SMS-2026-8504",
    title: "AirtelTigo iShare Promo",
    senderId: "OrderRef",
    message:
      "Limited offer: AT iShare 5GB at GH₵ 18.00. Non-expiry. Order now via your trusted data agent — fast & instant delivery!",
    recipientCount: 67,
    costPerSms: 0.04,
    totalCost: 2.68,
    pagesPerSms: 1,
    dateCreated: "2026-08-28 08:00",
    status: "sent",
    deliveryRatePercent: 100.0,
    audienceType: "repeat",
    sentCount: 67,
    failedCount: 0,
    refundedAmount: 0,
  },
  {
    id: "SMS-2026-8103",
    title: "Back to School Data Bundle",
    senderId: "KOFI-DATA",
    message:
      "Back to school? Get MTN 2.5GB non-expiry for GH₵ 12.00. Perfect for students. Shop: smartdatahub.com/store/kofi-telecom",
    recipientCount: 112,
    costPerSms: 0.04,
    totalCost: 4.48,
    pagesPerSms: 1,
    dateCreated: "2026-08-19 13:30",
    status: "sent",
    deliveryRatePercent: 99.1,
    audienceType: "all",
    sentCount: 111,
    failedCount: 1,
    refundedAmount: 0.04,
  },
  {
    id: "SMS-2026-7891",
    title: "Ramadan Promo — Exclusive Rates",
    senderId: "SDH Ghana",
    message:
      "Exclusive Ramadan deal: MTN 10GB for GH₵ 43.00. Instant delivery guaranteed. Visit smartdatahub.com/store/kofi-telecom now.",
    recipientCount: 88,
    costPerSms: 0.04,
    totalCost: 3.52,
    pagesPerSms: 1,
    dateCreated: "2026-08-10 07:00",
    status: "failed",
    deliveryRatePercent: 0,
    audienceType: "all",
    sentCount: 0,
    failedCount: 88,
    refundedAmount: 3.52,
  },
];

// ──────────────────────────────────────────────────────────────────────────

export const AdminSms: React.FC<AdminSmsProps> = ({
  campaigns: propCampaigns,
  senderIds: propSenderIds,
  onApproveSenderId,
  onRejectSenderId,
  onNavigateTab,
}) => {
  // Use prop data if provided, otherwise fall back to seed data
  const campaigns =
    propCampaigns && propCampaigns.length > 0
      ? propCampaigns
      : DEFAULT_CAMPAIGNS;
  const [senderIds, setSenderIds] = useState<SenderIdRecord[]>(
    propSenderIds && propSenderIds.length > 0
      ? propSenderIds
      : DEFAULT_SENDER_IDS,
  );

  // Active tab: "sender-ids" | "campaigns"
  const [activeTab, setActiveTab] = useState<"sender-ids" | "campaigns">(
    "sender-ids",
  );

  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Campaign table filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [senderFilter, setSenderFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Sender ID filters
  const [senderSearchQuery, setSenderSearchQuery] = useState("");
  const [senderStatusFilter, setSenderStatusFilter] = useState("all");
  const [senderTypeFilter, setSenderTypeFilter] = useState("all");

  // Sender ID action state
  const [actioningId, setActioningId] = useState<string | null>(null);

  // Stats — always computed from full data regardless of active tab
  const stats = useMemo(() => {
    const allSenders = senderIds.length;
    const pending = senderIds.filter((s) => s.status === "pending").length;
    const approved = senderIds.filter((s) => s.status === "approved").length;
    const totalSent = campaigns.reduce(
      (sum, c) => sum + (c.sentCount ?? c.recipientCount),
      0,
    );
    const totalSpend = campaigns.reduce((sum, c) => sum + c.totalCost, 0);
    return { allSenders, pending, approved, totalSent, totalSpend };
  }, [senderIds, campaigns]);

  // Filtered campaigns
  const filteredCampaigns = useMemo(() => {
    return campaigns
      .filter((c) => {
        if (statusFilter !== "all" && c.status !== statusFilter) return false;
        if (senderFilter !== "all" && c.senderId !== senderFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const match =
            c.id.toLowerCase().includes(q) ||
            c.title.toLowerCase().includes(q) ||
            c.senderId.toLowerCase().includes(q) ||
            c.message.toLowerCase().includes(q);
          if (!match) return false;
        }
        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime(),
      );
  }, [campaigns, statusFilter, senderFilter, searchQuery]);

  // Filtered sender IDs
  const filteredSenderIds = useMemo(() => {
    return senderIds.filter((s) => {
      if (senderStatusFilter !== "all" && s.status !== senderStatusFilter)
        return false;
      if (senderTypeFilter !== "all") {
        if (senderTypeFilter === "platform" && !s.isPlatformDefault)
          return false;
        if (senderTypeFilter === "agent" && s.isPlatformDefault) return false;
      }
      if (senderSearchQuery.trim()) {
        const q = senderSearchQuery.toLowerCase();
        const match =
          s.id.toLowerCase().includes(q) ||
          (s.note || "").toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [senderIds, senderStatusFilter, senderTypeFilter, senderSearchQuery]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCampaigns.length / ITEMS_PER_PAGE),
  );
  const paginatedCampaigns = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCampaigns.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCampaigns, currentPage]);

  const isFiltered =
    searchQuery !== "" || statusFilter !== "all" || senderFilter !== "all";

  const isSenderFiltered =
    senderSearchQuery !== "" ||
    senderStatusFilter !== "all" ||
    senderTypeFilter !== "all";

  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setSenderFilter("all");
    setCurrentPage(1);
  };

  const handleResetSenderFilters = () => {
    setSenderSearchQuery("");
    setSenderStatusFilter("all");
    setSenderTypeFilter("all");
  };

  const handleApprove = (senderId: string) => {
    setActioningId(senderId);
    setSenderIds((prev) =>
      prev.map((s) =>
        s.id === senderId ? { ...s, status: "approved" as const } : s,
      ),
    );
    onApproveSenderId?.(senderId);
    setTimeout(() => setActioningId(null), 400);
  };

  const handleReject = (senderId: string) => {
    setActioningId(senderId);
    setSenderIds((prev) =>
      prev.map((s) =>
        s.id === senderId ? { ...s, status: "rejected" as const } : s,
      ),
    );
    onRejectSenderId?.(senderId);
    setTimeout(() => setActioningId(null), 400);
  };

  const handleRevoke = (senderId: string) => {
    setSenderIds((prev) =>
      prev.map((s) =>
        s.id === senderId ? { ...s, status: "rejected" as const } : s,
      ),
    );
  };

  const handleExportCsv = () => {
    const head = [
      "Campaign Ref",
      "Title",
      "Sender ID",
      "Recipients",
      "Pages",
      "Cost (GHS)",
      "Status",
      "Delivery Rate",
      "Date",
    ];
    const esc = (c: unknown) => `"${String(c ?? "").replace(/"/g, '""')}"`;
    const rows = filteredCampaigns.map((c) => [
      esc(c.id),
      esc(c.title),
      esc(c.senderId),
      esc(c.recipientCount),
      esc(c.pagesPerSms),
      esc(c.totalCost.toFixed(2)),
      esc(c.status),
      esc(c.deliveryRatePercent + "%"),
      esc(c.dateCreated),
    ]);
    const csv = [head.map(esc).join(","), ...rows.map((r) => r.join(","))].join(
      "\r\n",
    );
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `admin-sms-campaigns-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    setExportNotice(
      `Exported ${filteredCampaigns.length} campaign${filteredCampaigns.length === 1 ? "" : "s"}.`,
    );
    setTimeout(() => setExportNotice(null), 3500);
  };

  const getStatusPill = (status: string) => {
    const cfg: Record<string, { dot: string; cls: string; label: string }> = {
      sent: {
        dot: "bg-emerald-500",
        cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
        label: "Delivered",
      },
      delivering: {
        dot: "bg-amber-500 animate-pulse",
        cls: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25",
        label: "In Progress",
      },
      partial: {
        dot: "bg-sky-500",
        cls: "bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/25",
        label: "Partial",
      },
      failed: {
        dot: "bg-red-500",
        cls: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/25",
        label: "Failed",
      },
    };
    const c = cfg[status] ?? {
      dot: "bg-muted-foreground/40",
      cls: "bg-muted text-muted-foreground border-border",
      label: status,
    };
    return (
      <span
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${c.cls}`}
      >
        <span className={`size-1.5 rounded-full ${c.dot}`} />
        {c.label}
      </span>
    );
  };

  const uniqueSenderIds = [...new Set(campaigns.map((c) => c.senderId))];

  // suppress unused-variable warning for onNavigateTab (kept in props for API compatibility)
  void onNavigateTab;

  return (
    <div className="space-y-6">
      {/* ── 1. PAGE HEADER ── */}
      <div className="flex flex-col items-start justify-between gap-4 border-b border-border pb-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-foreground">
            <Send className="size-6 text-primary" />
            <span>SMS &amp; Sender ID Administration</span>
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Approve alphanumeric sender IDs, monitor platform-wide campaigns,
            and audit Arkesel gateway traffic.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {exportNotice && (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg animate-in fade-in duration-200">
              {exportNotice}
            </span>
          )}
          {activeTab === "campaigns" && (
            <Button
              size="sm"
              onClick={handleExportCsv}
              className="text-xs font-bold shadow-xs gap-1.5 h-9"
            >
              <Download className="size-4" />
              <span>Export CSV</span>
            </Button>
          )}
        </div>
      </div>

      {/* ── 2. STATS TILES ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
              <ShieldCheck className="size-3.5 text-primary" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Sender IDs
            </span>
          </div>
          <p className="mt-2 text-xl font-black tabular-nums text-foreground">
            {stats.allSenders}
          </p>
          <p className="text-[10px] text-muted-foreground font-medium">
            {stats.approved} approved · {stats.pending} pending
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10">
              <Clock className="size-3.5 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Pending Approval
            </span>
          </div>
          <p className="mt-2 text-xl font-black tabular-nums text-amber-600 dark:text-amber-400">
            {stats.pending}
          </p>
          <p className="text-[10px] text-muted-foreground font-medium">
            Awaiting NCA registration
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10">
              <Users className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Recipients
            </span>
          </div>
          <p className="mt-2 text-xl font-black tabular-nums text-foreground">
            {stats.totalSent.toLocaleString()}
          </p>
          <p className="text-[10px] text-muted-foreground font-medium">
            Across all agent campaigns
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-purple-500/10">
              <MessageSquare className="size-3.5 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Platform Spend
            </span>
          </div>
          <p className="mt-2 text-xl font-black tabular-nums text-foreground">
            GH₵ {stats.totalSpend.toFixed(2)}
          </p>
          <p className="text-[10px] text-muted-foreground font-medium">
            Total billed across campaigns
          </p>
        </div>
      </div>

      {/* ── 3. ARKESEL BANNER ── */}
      <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs">
        <Radio className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold text-blue-800 dark:text-blue-300 block">
            Arkesel Gateway Note
          </span>
          <span className="text-blue-700 dark:text-blue-300">
            Approving a sender ID here does <strong>not</strong> register it
            with Arkesel. First submit and get it cleared on the Arkesel
            dashboard — only then approve here to make it selectable in agent
            campaigns.
          </span>
        </div>
      </div>

      {/* ── 4. SENDER IDS TAB ── */}
      {activeTab === "sender-ids" && (
        <Card className="border-border shadow-xs">
          <CardHeader className="border-b border-border pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base font-extrabold text-foreground">
                  <ShieldCheck className="size-5 text-primary" />
                  <span>Sender ID Approvals</span>
                  {stats.pending > 0 && (
                    <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                      {stats.pending} pending
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="mt-1 text-xs">
                  Register the name on the Arkesel dashboard first and wait for
                  the networks to clear it before approving here.
                </CardDescription>
              </div>
              {/* Tab switcher in header (far right) */}
              <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-full border border-border shrink-0">
                {(
                  [
                    {
                      id: "sender-ids" as const,
                      label: "Sender IDs",
                      badge:
                        stats.pending > 0 ? String(stats.pending) : undefined,
                    },
                    {
                      id: "campaigns" as const,
                      label: "Campaigns",
                      badge: String(campaigns.length),
                    },
                  ] as const
                ).map((tab) => {
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-1.5 rounded-full py-1.5 px-3 text-xs font-bold transition-all cursor-pointer ${
                        active
                          ? "bg-card text-foreground shadow-xs border border-border"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {tab.label}
                      {tab.badge && (
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[9px] font-black tabular-nums ${
                            active
                              ? tab.id === "sender-ids" && stats.pending > 0
                                ? "bg-amber-500/20 text-amber-700 dark:text-amber-400"
                                : "bg-primary/15 text-primary"
                              : "bg-muted-foreground/20 text-muted-foreground"
                          }`}
                        >
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </CardHeader>

          {/* Search + Filters for Sender IDs */}
          <div className="border-b border-border bg-muted/20 p-4 space-y-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="admin-sender-search"
                className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
              >
                Search sender IDs
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="admin-sender-search"
                  type="text"
                  placeholder="Search by sender ID or note..."
                  value={senderSearchQuery}
                  onChange={(e) => setSenderSearchQuery(e.target.value)}
                  className="h-10 bg-background pl-9 text-xs"
                />
                {senderSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setSenderSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-background p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="size-3.5 text-muted-foreground" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Sender ID filters
                  </span>
                  {isSenderFiltered && (
                    <Badge
                      variant="secondary"
                      className="text-[9px] px-1.5 py-0 font-semibold"
                    >
                      Active
                    </Badge>
                  )}
                </div>
                {isSenderFiltered && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResetSenderFilters}
                    className="h-6 px-2 text-[10px] font-bold text-primary cursor-pointer bg-transparent hover:!bg-transparent hover:text-primary"
                  >
                    Reset filters
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="sender-filter-status"
                    className="text-[10px] font-semibold text-muted-foreground"
                  >
                    Status
                  </Label>
                  <Select
                    value={senderStatusFilter}
                    onValueChange={setSenderStatusFilter}
                  >
                    <SelectTrigger
                      id="sender-filter-status"
                      className="h-9 w-full text-xs"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        All statuses ({senderIds.length})
                      </SelectItem>
                      <SelectItem value="approved">
                        Approved (
                        {
                          senderIds.filter((s) => s.status === "approved")
                            .length
                        }
                        )
                      </SelectItem>
                      <SelectItem value="pending">
                        Pending (
                        {senderIds.filter((s) => s.status === "pending").length}
                        )
                      </SelectItem>
                      <SelectItem value="rejected">
                        Rejected (
                        {
                          senderIds.filter((s) => s.status === "rejected")
                            .length
                        }
                        )
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="sender-filter-type"
                    className="text-[10px] font-semibold text-muted-foreground"
                  >
                    Type
                  </Label>
                  <Select
                    value={senderTypeFilter}
                    onValueChange={setSenderTypeFilter}
                  >
                    <SelectTrigger
                      id="sender-filter-type"
                      className="h-9 w-full text-xs"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      <SelectItem value="platform">
                        Shared Platform (
                        {senderIds.filter((s) => s.isPlatformDefault).length})
                      </SelectItem>
                      <SelectItem value="agent">
                        Agent Custom (
                        {senderIds.filter((s) => !s.isPlatformDefault).length})
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border bg-muted/40 hover:bg-muted/40">
                    <TableHead className="h-10 px-4 text-[10px] font-bold uppercase text-muted-foreground">
                      Sender ID
                    </TableHead>
                    <TableHead className="h-10 px-4 text-[10px] font-bold uppercase text-muted-foreground">
                      Type
                    </TableHead>
                    <TableHead className="h-10 px-4 text-[10px] font-bold uppercase text-muted-foreground">
                      Note
                    </TableHead>
                    <TableHead className="h-10 px-4 text-[10px] font-bold uppercase text-muted-foreground">
                      Requested
                    </TableHead>
                    <TableHead className="h-10 px-4 text-center text-[10px] font-bold uppercase text-muted-foreground">
                      Status
                    </TableHead>
                    <TableHead className="h-10 px-4 text-right text-[10px] font-bold uppercase text-muted-foreground">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border/60">
                  {filteredSenderIds.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="h-24 text-center text-muted-foreground text-xs"
                      >
                        No sender ID requests match your filters.
                        {isSenderFiltered && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleResetSenderFilters}
                            className="mt-2 text-xs font-bold text-primary cursor-pointer"
                          >
                            Clear filters
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSenderIds.map((s) => (
                      <TableRow
                        key={s.id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <TableCell className="py-3.5 px-4">
                          <span className="font-mono font-extrabold text-sm text-foreground">
                            {s.id}
                          </span>
                        </TableCell>
                        <TableCell className="py-3.5 px-4">
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-bold ${s.isPlatformDefault ? "bg-primary/10 text-primary border-primary/20" : "bg-muted text-muted-foreground"}`}
                          >
                            {s.isPlatformDefault
                              ? "Shared Platform"
                              : "Agent Custom"}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3.5 px-4 text-xs text-muted-foreground max-w-[260px]">
                          <span className="line-clamp-2">{s.note || "—"}</span>
                        </TableCell>
                        <TableCell className="py-3.5 px-4 text-xs text-muted-foreground whitespace-nowrap tabular-nums">
                          {s.requestedAt || "—"}
                        </TableCell>
                        <TableCell className="py-3.5 px-4 text-center whitespace-nowrap">
                          {s.status === "approved" && (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400">
                              <span className="size-1.5 rounded-full bg-emerald-500" />
                              Approved
                            </span>
                          )}
                          {s.status === "pending" && (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase text-amber-700 dark:text-amber-400">
                              <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                              Pending
                            </span>
                          )}
                          {s.status === "rejected" && (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/25 bg-red-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase text-red-700 dark:text-red-400">
                              <span className="size-1.5 rounded-full bg-red-500" />
                              Rejected
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="py-3.5 px-4 text-right whitespace-nowrap">
                          {s.isPlatformDefault ? (
                            <span className="text-[11px] text-muted-foreground">
                              Platform default
                            </span>
                          ) : s.status === "pending" ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={actioningId === s.id}
                                onClick={() => handleReject(s.id)}
                                className="h-7 px-2.5 text-[11px] font-semibold text-destructive hover:bg-destructive/10 border-destructive/20 cursor-pointer"
                              >
                                Reject
                              </Button>
                              <Button
                                variant="default"
                                size="sm"
                                disabled={actioningId === s.id}
                                onClick={() => handleApprove(s.id)}
                                className="h-7 px-2.5 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1 shadow-2xs cursor-pointer"
                              >
                                <Check className="size-3" />
                                <span>Approve</span>
                              </Button>
                            </div>
                          ) : s.status === "approved" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRevoke(s.id)}
                              className="h-7 px-2.5 text-[11px] font-medium text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                              Revoke
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleApprove(s.id)}
                              className="h-7 px-2.5 text-[11px] font-medium text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                              Re-approve
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── 6. CAMPAIGNS TAB ── */}
      {activeTab === "campaigns" && (
        <Card className="border-border shadow-xs">
          <CardHeader className="border-b border-border pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base font-extrabold text-foreground">
                  <MessageSquare className="size-5 text-primary" />
                  <span>All Agent SMS Campaigns</span>
                </CardTitle>
                <CardDescription className="mt-1 text-xs">
                  Platform-wide audit of all promotional broadcasts dispatched
                  by agents via Arkesel.
                </CardDescription>
              </div>
              {/* Tab switcher in header (far right) */}
              <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-full border border-border shrink-0">
                {(
                  [
                    {
                      id: "sender-ids" as const,
                      label: "Sender IDs",
                      badge:
                        stats.pending > 0 ? String(stats.pending) : undefined,
                    },
                    {
                      id: "campaigns" as const,
                      label: "Campaigns",
                      badge: String(campaigns.length),
                    },
                  ] as const
                ).map((tab) => {
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-1.5 rounded-full py-1.5 px-3 text-xs font-bold transition-all cursor-pointer ${
                        active
                          ? "bg-card text-foreground shadow-xs border border-border"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {tab.label}
                      {tab.badge && (
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[9px] font-black tabular-nums ${
                            active
                              ? (tab.id as string) === "sender-ids" && stats.pending > 0
                                ? "bg-amber-500/20 text-amber-700 dark:text-amber-400"
                                : "bg-primary/15 text-primary"
                              : "bg-muted-foreground/20 text-muted-foreground"
                          }`}
                        >
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </CardHeader>

          {/* Search + Filters */}
          <div className="border-b border-border bg-muted/20 p-4 space-y-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="admin-sms-search"
                className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
              >
                Search SMS campaigns
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="admin-sms-search"
                  type="text"
                  placeholder="Search by campaign reference, sender ID, or message content..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-10 bg-background pl-9 text-xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setCurrentPage(1);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-background p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="size-3.5 text-muted-foreground" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Campaign filters
                  </span>
                  {isFiltered && (
                    <Badge
                      variant="secondary"
                      className="text-[9px] px-1.5 py-0 font-semibold"
                    >
                      Active
                    </Badge>
                  )}
                </div>
                {isFiltered && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResetFilters}
                    className="h-6 px-2 text-[10px] font-bold text-primary cursor-pointer bg-transparent hover:!bg-transparent hover:text-primary"
                  >
                    Reset filters
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="sms-filter-status"
                    className="text-[10px] font-semibold text-muted-foreground"
                  >
                    Delivery status
                  </Label>
                  <Select
                    value={statusFilter}
                    onValueChange={(v) => {
                      setStatusFilter(v);
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger
                      id="sms-filter-status"
                      className="h-9 w-full text-xs"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        All statuses ({campaigns.length})
                      </SelectItem>
                      <SelectItem value="sent">
                        Delivered (
                        {campaigns.filter((c) => c.status === "sent").length})
                      </SelectItem>
                      <SelectItem value="delivering">
                        In Progress (
                        {
                          campaigns.filter((c) => c.status === "delivering")
                            .length
                        }
                        )
                      </SelectItem>
                      <SelectItem value="partial">
                        Partial (
                        {campaigns.filter((c) => c.status === "partial").length}
                        )
                      </SelectItem>
                      <SelectItem value="failed">
                        Failed (
                        {campaigns.filter((c) => c.status === "failed").length})
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="sms-filter-sender"
                    className="text-[10px] font-semibold text-muted-foreground"
                  >
                    Sender ID
                  </Label>
                  <Select
                    value={senderFilter}
                    onValueChange={(v) => {
                      setSenderFilter(v);
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger
                      id="sms-filter-sender"
                      className="h-9 w-full text-xs"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All sender IDs</SelectItem>
                      {uniqueSenderIds.map((id) => (
                        <SelectItem key={id} value={id}>
                          {id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border bg-muted/40 hover:bg-muted/40">
                    <TableHead className="h-10 px-4 text-[10px] font-bold uppercase text-muted-foreground">
                      Campaign &amp; Sender
                    </TableHead>
                    <TableHead className="h-10 px-4 text-[10px] font-bold uppercase text-muted-foreground">
                      Audience
                    </TableHead>
                    <TableHead className="h-10 px-4 text-[10px] font-bold uppercase text-muted-foreground">
                      Message Preview
                    </TableHead>
                    <TableHead className="h-10 px-4 text-[10px] font-bold uppercase text-muted-foreground">
                      Units
                    </TableHead>
                    <TableHead className="h-10 px-4 text-right text-[10px] font-bold uppercase text-muted-foreground">
                      Cost
                    </TableHead>
                    <TableHead className="h-10 px-4 text-center text-[10px] font-bold uppercase text-muted-foreground">
                      Status
                    </TableHead>
                    <TableHead className="h-10 px-4 text-right text-[10px] font-bold uppercase text-muted-foreground">
                      When
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border/60">
                  {paginatedCampaigns.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="h-40 text-center text-muted-foreground"
                      >
                        <div className="flex flex-col items-center justify-center py-8 gap-2">
                          <div className="size-10 rounded-full bg-muted flex items-center justify-center">
                            <MessageSquare className="size-5 text-muted-foreground" />
                          </div>
                          <p className="text-sm font-semibold text-foreground">
                            No campaigns match your filters.
                          </p>
                          {isFiltered && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleResetFilters}
                              className="text-xs font-bold text-primary cursor-pointer"
                            >
                              Clear filters
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedCampaigns.map((camp) => (
                      <TableRow
                        key={camp.id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <TableCell className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <span className="rounded-full px-2 py-0.5 text-[10px] font-black shrink-0 bg-primary text-primary-foreground">
                              {camp.senderId.slice(0, 6)}
                            </span>
                            <div className="min-w-0">
                              <div className="font-bold text-xs text-foreground truncate max-w-[180px]">
                                {camp.title}
                              </div>
                              <div className="text-[10px] text-muted-foreground font-mono">
                                {camp.id}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3.5 px-4 text-xs">
                          <div className="font-semibold text-foreground">
                            {camp.audienceType === "all"
                              ? "All Customers"
                              : camp.audienceType === "repeat"
                                ? "Repeat Buyers"
                                : camp.audienceType === "inactive"
                                  ? "Inactive (>30d)"
                                  : "Custom List"}
                          </div>
                          <div className="text-[10px] text-muted-foreground tabular-nums">
                            {camp.recipientCount} contacts
                          </div>
                        </TableCell>
                        <TableCell className="py-3.5 px-4 max-w-[200px]">
                          <p
                            className="truncate text-xs text-muted-foreground"
                            title={camp.message}
                          >
                            {camp.message}
                          </p>
                        </TableCell>
                        <TableCell className="py-3.5 px-4 text-xs">
                          <div className="font-bold text-foreground tabular-nums">
                            {camp.recipientCount * camp.pagesPerSms}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {camp.pagesPerSms} pg/SMS
                          </div>
                        </TableCell>
                        <TableCell className="py-3.5 px-4 text-right">
                          <span className="font-extrabold text-xs tabular-nums text-foreground">
                            GH₵ {camp.totalCost.toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell className="py-3.5 px-4 text-center">
                          {getStatusPill(camp.status)}
                        </TableCell>
                        <TableCell className="py-3.5 px-4 text-right text-xs text-muted-foreground whitespace-nowrap tabular-nums">
                          {formatDate(camp.dateCreated)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Showing{" "}
                <span className="font-bold text-foreground">
                  {filteredCampaigns.length === 0
                    ? 0
                    : Math.min(
                        currentPage * ITEMS_PER_PAGE,
                        filteredCampaigns.length,
                      )}
                </span>{" "}
                of{" "}
                <span className="font-bold text-foreground">
                  {filteredCampaigns.length}
                </span>{" "}
                campaigns
              </p>
              {totalPages > 1 && (
                <Pagination className="w-auto mx-0">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                        className={`cursor-pointer h-8 text-xs ${currentPage === 1 ? "pointer-events-none opacity-50" : ""}`}
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(
                        (p) =>
                          p === 1 ||
                          p === totalPages ||
                          Math.abs(p - currentPage) <= 1,
                      )
                      .map((page, idx, arr) => (
                        <React.Fragment key={page}>
                          {idx > 0 && arr[idx - 1] !== page - 1 && (
                            <PaginationItem>
                              <span className="px-2 text-xs text-muted-foreground">
                                ...
                              </span>
                            </PaginationItem>
                          )}
                          <PaginationItem>
                            <PaginationLink
                              isActive={currentPage === page}
                              onClick={() => setCurrentPage(page)}
                              className="cursor-pointer h-8 text-xs"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        </React.Fragment>
                      ))}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() =>
                          setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }
                        className={`cursor-pointer h-8 text-xs ${currentPage === totalPages ? "pointer-events-none opacity-50" : ""}`}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

import React, { useState, useMemo } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Headphones,
  Inbox,
  MessageCircle,
  MessageSquareWarning,
  Plus,
  Send,
  Tag,
  User,
  Search,
  Check,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ChevronDown,
  Filter,
  SlidersHorizontal,
  Download,
  X,
  Clock3,
  Phone,
  Store,
  HelpCircle,
  Flame,
  ArrowUpRight,
  UserCheck,
} from "lucide-react";
import { Complaint, Order } from "../../types";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface AdminComplaintsProps {
  complaints: Complaint[];
  onReplyComplaint: (ticketId: string, replyText: string) => void;
  onAddComplaint: (ticket: Complaint) => void;
  onUpdateComplaintStatus?: (
    ticketId: string,
    status: Complaint["status"],
    priority?: Complaint["priority"],
  ) => void;
  onNavigateTab?: (tab: string) => void;
  orders?: Order[];
}

const CATEGORY_LABELS: Record<string, string> = {
  commission_payout: "Commission Payout",
  store_issue: "Store Issue",
  tier_dispute: "Tier Dispute",
  order_problem: "Order Problem",
  pricing_error: "Pricing Error",
  delivery_delay: "Delivery Delay",
  failed_recharge: "Failed Recharge",
  wrong_number: "Wrong Number",
  momo_debit_no_credit: "MoMo Debit Issue",
  general: "General Help",
};

const CANNED_RESPONSES = [
  "Hello, we have confirmed the gateway delay with the telecom provider. Your order has been re-queued for delivery.",
  "We have verified your account details and approved your commission withdrawal request. Funds will reflect shortly.",
  "The order was retried through our secondary float gateway and completed successfully. Please check your balance SMS.",
  "Our audit log confirmed the duplicate MoMo transaction. We have reversed the funds back to your wallet balance.",
  "Our NOC engineers have refilled the telecom gateway float and cleared the batch queue. Please monitor your dashboard.",
  "This issue has been resolved. Please don't hesitate to reach out if you need further assistance!",
];

export const AdminComplaints: React.FC<AdminComplaintsProps> = ({
  complaints,
  onReplyComplaint,
  onAddComplaint,
  onUpdateComplaintStatus,
  onNavigateTab,
  orders = [],
}) => {
  const [selectedTicketId, setSelectedTicketId] = useState<string>(
    complaints[0]?.id || "",
  );
  const [newReplyText, setNewReplyText] = useState("");
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Structured Filters (Matching Commissions screen pattern)
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [userTypeFilter, setUserTypeFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  // New ticket dialog form state
  const [ticketCategory, setTicketCategory] =
    useState<Complaint["category"]>("commission_payout");
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketOrderRef, setTicketOrderRef] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [ticketUserName, setTicketUserName] = useState("");
  const [ticketUserContact, setTicketUserContact] = useState("");
  const [ticketUserType, setTicketUserType] = useState<"agent" | "customer">(
    "agent",
  );
  const [ticketPriority, setTicketPriority] =
    useState<Complaint["priority"]>("medium");

  // Filter complaints
  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      // Status filter
      if (statusFilter !== "all") {
        if (statusFilter === "open" && c.status !== "open") return false;
        if (
          statusFilter === "in_progress" &&
          c.status !== "in_progress" &&
          c.status !== "investigating"
        )
          return false;
        if (statusFilter === "resolved" && c.status !== "resolved")
          return false;
        if (statusFilter === "closed" && c.status !== "closed") return false;
      }

      // Category filter
      if (categoryFilter !== "all" && c.category !== categoryFilter) {
        return false;
      }

      // User Type filter
      if (userTypeFilter !== "all") {
        const type = c.userType || "customer";
        if (type !== userTypeFilter) return false;
      }

      // Priority filter
      if (priorityFilter !== "all") {
        const prio = c.priority || "medium";
        if (prio !== priorityFilter) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNumber = (c.ticketNumber || "").toLowerCase().includes(q);
        const matchSubject = (c.subject || "").toLowerCase().includes(q);
        const matchOrder = (c.orderReference || "").toLowerCase().includes(q);
        const matchUser = (c.userName || "").toLowerCase().includes(q);
        const matchContact = (c.userContact || "").toLowerCase().includes(q);
        if (
          !matchNumber &&
          !matchSubject &&
          !matchOrder &&
          !matchUser &&
          !matchContact
        ) {
          return false;
        }
      }

      return true;
    });
  }, [
    complaints,
    statusFilter,
    categoryFilter,
    userTypeFilter,
    priorityFilter,
    searchQuery,
  ]);

  // Selected ticket
  const selectedTicket = useMemo(() => {
    const found = complaints.find((c) => c.id === selectedTicketId);
    if (found && filteredComplaints.some((c) => c.id === found.id)) {
      return found;
    }
    return filteredComplaints[0] || complaints[0] || null;
  }, [complaints, selectedTicketId, filteredComplaints]);

  // KPI Metrics (Calculated for Admin oversight)
  const stats = useMemo(() => {
    const total = complaints.length;
    const open = complaints.filter((c) => c.status === "open").length;
    const inProgress = complaints.filter(
      (c) => c.status === "in_progress" || c.status === "investigating",
    ).length;
    const resolved = complaints.filter(
      (c) => c.status === "resolved" || c.status === "closed",
    ).length;
    const urgent = complaints.filter(
      (c) =>
        c.priority === "urgent" &&
        c.status !== "resolved" &&
        c.status !== "closed",
    ).length;
    const agentTickets = complaints.filter(
      (c) => c.userType === "agent",
    ).length;

    return { total, open, inProgress, resolved, urgent, agentTickets };
  }, [complaints]);

  const isFiltered =
    searchQuery.trim() !== "" ||
    statusFilter !== "all" ||
    categoryFilter !== "all" ||
    userTypeFilter !== "all" ||
    priorityFilter !== "all";

  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setCategoryFilter("all");
    setUserTypeFilter("all");
    setPriorityFilter("all");
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReplyText.trim() || !selectedTicket) return;

    onReplyComplaint(selectedTicket.id, newReplyText.trim());
    setNewReplyText("");
  };

  const handleSendAndResolve = () => {
    if (!selectedTicket) return;
    if (newReplyText.trim()) {
      onReplyComplaint(selectedTicket.id, newReplyText.trim());
      setNewReplyText("");
    }
    if (onUpdateComplaintStatus) {
      onUpdateComplaintStatus(selectedTicket.id, "resolved");
    }
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketMessage.trim()) return;

    const newTicket: Complaint = {
      id: `cmp-${Date.now()}`,
      ticketNumber: `TKT-SDH-${Math.floor(1000 + Math.random() * 9000)}`,
      category: ticketCategory,
      subject: ticketSubject.trim(),
      orderReference: ticketOrderRef.trim() || undefined,
      userType: ticketUserType,
      userName:
        ticketUserName.trim() ||
        (ticketUserType === "agent" ? "Agent Store" : "Direct Customer"),
      userContact: ticketUserContact.trim() || undefined,
      status: "open",
      priority: ticketPriority,
      createdAt: new Date().toISOString().replace("T", " ").slice(0, 16),
      lastUpdated: "Just now",
      assignedTo: "SDH Admin Desk",
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: "support_admin",
          senderName: "SDH Support (Admin)",
          text: ticketMessage.trim(),
          timestamp: new Date().toISOString().replace("T", " ").slice(0, 16),
        },
      ],
    };

    onAddComplaint(newTicket);
    setSelectedTicketId(newTicket.id);
    setShowNewTicketModal(false);

    // Reset Form
    setTicketSubject("");
    setTicketOrderRef("");
    setTicketMessage("");
    setTicketUserName("");
    setTicketUserContact("");
    setTicketCategory("commission_payout");
    setTicketPriority("medium");
  };

  // CSV Export utility (Matching Commissions Screen pattern)
  const handleExportCsv = () => {
    const head = [
      "Ticket Number",
      "Status",
      "Priority",
      "Category",
      "Subject",
      "Requester Type",
      "Requester Name",
      "Contact",
      "Order Reference",
      "Created At",
      "Last Updated",
      "Messages Count",
    ];

    const esc = (c: any) =>
      `"${String(c == null ? "" : c).replace(/"/g, '""')}"`;

    const body = filteredComplaints.map((c) => [
      esc(c.ticketNumber),
      esc(c.status),
      esc(c.priority || "medium"),
      esc(CATEGORY_LABELS[c.category] || c.category),
      esc(c.subject),
      esc(c.userType || "customer"),
      esc(c.userName || ""),
      esc(c.userContact || ""),
      esc(c.orderReference || ""),
      esc(c.createdAt),
      esc(c.lastUpdated),
      esc(c.messages.length),
    ]);

    const csv = [head.map(esc).join(","), ...body.map((r) => r.join(","))].join(
      "\r\n",
    );
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `sdh-support-tickets-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);

    setExportNotice(
      `Exported ${filteredComplaints.length} ticket${filteredComplaints.length === 1 ? "" : "s"
      } successfully.`,
    );
    setTimeout(() => setExportNotice(null), 3500);
  };

  // Status Pill
  const getStatusPill = (status: string) => {
    type StatusConfig = { dot: string; classes: string; label: string };

    const config: Record<string, StatusConfig> = {
      open: {
        dot: "bg-amber-500",
        classes:
          "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20",
        label: "Open",
      },
      investigating: {
        dot: "bg-blue-500",
        classes:
          "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/20",
        label: "In Progress",
      },
      in_progress: {
        dot: "bg-blue-500",
        classes:
          "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/20",
        label: "In Progress",
      },
      resolved: {
        dot: "bg-emerald-500",
        classes:
          "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
        label: "Resolved",
      },
      closed: {
        dot: "bg-muted-foreground/50",
        classes: "bg-muted text-muted-foreground border-border",
        label: "Closed",
      },
    };

    const c = config[status] ?? {
      dot: "bg-muted-foreground/40",
      classes: "bg-muted text-muted-foreground border-border",
      label: status,
    };

    return (
      <span
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${c.classes}`}
      >
        <span className={`size-1.5 rounded-full ${c.dot}`} />
        {c.label}
      </span>
    );
  };

  // Priority badge
  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case "urgent":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30">
            <span className="size-1.5 rounded-full bg-red-500 animate-ping" />
            Urgent
          </span>
        );
      case "high":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25">
            High
          </span>
        );
      case "medium":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-medium uppercase bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            Medium
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-medium uppercase bg-muted text-muted-foreground border border-border">
            Low
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* ========================================================
          1. TOP HEADER (Matching Commissions & Admin Operations)
          ======================================================== */}
      <div className="flex flex-col items-start justify-between gap-4 border-b border-border pb-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-foreground">
            <MessageSquareWarning className="size-6 text-primary" />
            <span>Complaints & Support Desk</span>
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Centralized dispute resolution desk for SDH agents and direct
            customers
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {exportNotice && (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg animate-in fade-in duration-200">
              {exportNotice}
            </span>
          )}

          <Button
            size="sm"
            onClick={handleExportCsv}
            className="text-xs font-bold shadow-xs gap-1.5 h-9"
          >
            <Download className="size-4" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* ========================================================
          2. 4 KPI METRIC CARDS TILES (Matching Commissions Layout)
          ======================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Open Tickets */}
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10">
              <Clock className="size-3.5 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Open Tickets
            </span>
          </div>
          <p className="mt-2 text-xl font-black tabular-nums text-amber-600 dark:text-amber-400">
            {stats.open}
          </p>
          <p className="text-[10px] text-muted-foreground font-medium">
            Requires initial review
          </p>
        </div>

        {/* In Progress */}
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-blue-500/10">
              <Headphones className="size-3.5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              In Progress
            </span>
          </div>
          <p className="mt-2 text-xl font-black tabular-nums text-blue-600 dark:text-blue-400">
            {stats.inProgress}
          </p>
          <p className="text-[10px] text-muted-foreground font-medium">
            Active NOC & Support review
          </p>
        </div>

        {/* Resolved & Closed */}
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10">
              <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Resolved
            </span>
          </div>
          <p className="mt-2 text-xl font-black tabular-nums text-emerald-600 dark:text-emerald-400">
            {stats.resolved}
          </p>
          <p className="text-[10px] text-muted-foreground font-medium">
            Successfully closed disputes
          </p>
        </div>

        {/* Total Inbound / Priority */}
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-purple-500/10">
              <Flame className="size-3.5 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Total Inbound
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-xl font-black tabular-nums text-foreground">
              {stats.total}
            </p>
            {stats.urgent > 0 && (
              <span className="text-[10px] font-bold text-red-600 dark:text-red-400">
                ({stats.urgent} urgent)
              </span>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground font-medium">
            {stats.agentTickets} agent stores &middot;{" "}
            {stats.total - stats.agentTickets} direct
          </p>
        </div>
      </div>

      {/* ========================================================
          3. STRUCTURED SEARCH & FILTERS CONTAINER (Matching Commissions)
          ======================================================== */}
      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        <div className="border-b border-border bg-muted/20 p-4 space-y-4">
          {/* Search input with proper Label & styling */}
          <div className="space-y-1.5">
            <Label
              htmlFor="admin-complaints-search"
              className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
            >
              Search complaints & support tickets
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="admin-complaints-search"
                type="text"
                placeholder="Search by ticket, name, phone number, or order reference..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 bg-background pl-9 text-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Filters Box (Matching Commissions screen) */}
          <div className="rounded-xl border border-border bg-background p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="size-3.5 text-muted-foreground" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Ticket filters
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

            {/* Responsive grid of 4 filter dropdowns */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {/* 1. Status Filter */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="filter-status"
                  className="text-[10px] font-semibold text-muted-foreground"
                >
                  Ticket Status
                </Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger
                    id="filter-status"
                    className="h-9 w-full text-xs"
                  >
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      All Statuses ({stats.total})
                    </SelectItem>
                    <SelectItem value="open">Open ({stats.open})</SelectItem>
                    <SelectItem value="in_progress">
                      In Progress ({stats.inProgress})
                    </SelectItem>
                    <SelectItem value="resolved">
                      Resolved ({stats.resolved})
                    </SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 2. Category Filter */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="filter-category"
                  className="text-[10px] font-semibold text-muted-foreground"
                >
                  Dispute Category
                </Label>
                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger
                    id="filter-category"
                    className="h-9 w-full text-xs"
                  >
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="commission_payout">
                      Commission Payout
                    </SelectItem>
                    <SelectItem value="delivery_delay">
                      Delivery Delay
                    </SelectItem>
                    <SelectItem value="failed_recharge">
                      Failed Recharge
                    </SelectItem>
                    <SelectItem value="momo_debit_no_credit">
                      MoMo Debit Issue
                    </SelectItem>
                    <SelectItem value="store_issue">
                      Store Configuration
                    </SelectItem>
                    <SelectItem value="tier_dispute">Tier Dispute</SelectItem>
                    <SelectItem value="general">General Help</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 3. Requester User Type */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="filter-user-type"
                  className="text-[10px] font-semibold text-muted-foreground"
                >
                  Requester Type
                </Label>
                <Select
                  value={userTypeFilter}
                  onValueChange={setUserTypeFilter}
                >
                  <SelectTrigger
                    id="filter-user-type"
                    className="h-9 w-full text-xs"
                  >
                    <SelectValue placeholder="All Users" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Requesters</SelectItem>
                    <SelectItem value="agent">
                      Agents Only (Storefronts)
                    </SelectItem>
                    <SelectItem value="customer">Direct Customers</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 4. Priority Filter */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="filter-priority"
                  className="text-[10px] font-semibold text-muted-foreground"
                >
                  Priority Level
                </Label>
                <Select
                  value={priorityFilter}
                  onValueChange={setPriorityFilter}
                >
                  <SelectTrigger
                    id="filter-priority"
                    className="h-9 w-full text-xs"
                  >
                    <SelectValue placeholder="All Priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          4. CHAT-SPECIFIC DUAL WORKSPACE LAYOUT
          Structured specifically for dispute resolution & thread messaging
          ======================================================== */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* ======================================================
            LEFT COLUMN: TICKET INBOX QUEUE (4 Cols)
            ====================================================== */}
        <div className="space-y-3 lg:col-span-4 flex flex-col">
          {/* Header row: queue label + result count + active filter indicator */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Inbound Queue
              </span>
              {isFiltered && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold text-primary">
                  Filtered
                </span>
              )}
            </div>
            <span className="text-[11px] font-semibold text-muted-foreground tabular-nums">
              {filteredComplaints.length} of {complaints.length}
            </span>
          </div>

          {/* Ticket list scrollable container */}
          {filteredComplaints.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center space-y-3 rounded-2xl border border-dashed border-border bg-card p-10 text-center min-h-[380px]">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <Inbox className="size-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">
                  No tickets match filters
                </p>
                <p className="mt-1 text-xs text-muted-foreground max-w-[220px] mx-auto">
                  {isFiltered
                    ? "Try adjusting your search criteria or resetting filters."
                    : "No inbound disputes currently in the queue."}
                </p>
              </div>
              {isFiltered && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleResetFilters}
                  className="h-8 text-xs font-semibold"
                >
                  Reset filters
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2.5 overflow-y-auto pr-1" style={{ maxHeight: "calc(700px - 2.5rem)" }}>
              {filteredComplaints.map((complaint) => {
                const isSelected = selectedTicket?.id === complaint.id;

                return (
                  <button
                    key={complaint.id}
                    type="button"
                    onClick={() => setSelectedTicketId(complaint.id)}
                    className={`w-full rounded-2xl border p-3.5 text-left transition-all relative ${isSelected
                      ? "border-primary bg-primary/5 shadow-xs ring-2 ring-primary/20"
                      : "border-border bg-card hover:bg-muted/40"
                      }`}
                  >
                    {/* Top Row: Ticket Number, User Type, and Status */}
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-extrabold text-foreground">
                          {complaint.ticketNumber}
                        </span>

                        <span
                          className={`inline-flex items-center gap-1 rounded px-1.5 py-0.2 text-[9px] font-extrabold uppercase ${complaint.userType === "agent"
                            ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                            : "bg-blue-500/15 text-blue-700 dark:text-blue-400"
                            }`}
                        >
                          {complaint.userType === "agent" ? (
                            <Store className="size-2.5" />
                          ) : (
                            <User className="size-2.5" />
                          )}
                          <span>{complaint.userType || "customer"}</span>
                        </span>

                        {complaint.priority &&
                          getPriorityBadge(complaint.priority)}
                      </div>

                      <div className="shrink-0">
                        {getStatusPill(complaint.status)}
                      </div>
                    </div>

                    {/* Subject */}
                    <h4 className="line-clamp-2 text-xs font-bold leading-snug text-foreground">
                      {complaint.subject}
                    </h4>

                    {/* User & Contact */}
                    {complaint.userName && (
                      <div className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <User className="size-3 text-muted-foreground/70 shrink-0" />
                        <span className="font-semibold text-foreground/80 truncate">
                          {complaint.userName}
                        </span>
                        {complaint.userContact && (
                          <span className="tabular-nums shrink-0 text-muted-foreground">
                            &middot; {complaint.userContact}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Order Reference tag if exists */}
                    {complaint.orderReference && (
                      <div className="mt-1.5 flex items-center gap-1 text-[10px] text-primary font-medium">
                        <FileText className="size-3 shrink-0" />
                        <span className="truncate">
                          Ref: {complaint.orderReference}
                        </span>
                      </div>
                    )}

                    {/* Footer Row: Category & Relative time */}
                    <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-border/50 pt-2 text-[10px]">
                      <span className="rounded bg-muted px-1.5 py-0.5 font-medium text-muted-foreground truncate max-w-[150px]">
                        {CATEGORY_LABELS[complaint.category] ??
                          complaint.category.replace("_", " ")}
                      </span>

                      <span className="shrink-0 text-muted-foreground font-medium flex items-center gap-1">
                        <Clock3 className="size-3 text-muted-foreground/60" />
                        {complaint.lastUpdated}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ======================================================
            RIGHT COLUMN: ACTIVE THREAD & RESOLUTION WORKSPACE (8 Cols)
            ====================================================== */}
        <div className="lg:col-span-8 flex flex-col">
          {selectedTicket ? (
            <div className="flex h-[700px] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
              {/* THREAD TOP BAR */}
              <div className="shrink-0 border-b border-border bg-muted/20 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  {/* Left info */}
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-black tracking-tight text-foreground font-mono">
                        {selectedTicket.ticketNumber}
                      </span>

                      {getStatusPill(selectedTicket.status)}

                      {getPriorityBadge(selectedTicket.priority)}

                      <Badge
                        variant="secondary"
                        className="text-[9px] font-extrabold uppercase tracking-wider"
                      >
                        {selectedTicket.userType === "agent"
                          ? "Storefront Agent"
                          : "Direct Consumer"}
                      </Badge>

                      <Badge
                        variant="outline"
                        className="text-[9px] font-semibold text-muted-foreground hidden sm:inline-flex"
                      >
                        {CATEGORY_LABELS[selectedTicket.category] ??
                          selectedTicket.category.replace("_", " ")}
                      </Badge>
                    </div>

                    <h2 className="text-sm sm:text-base font-bold text-foreground line-clamp-1">
                      {selectedTicket.subject}
                    </h2>
                  </div>

                  {/* Right: Ticket action controls — change THIS ticket's status/priority */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                      Update ticket
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Status Changer */}
                      <Select
                        value={selectedTicket.status}
                        onValueChange={(val) =>
                          onUpdateComplaintStatus?.(
                            selectedTicket.id,
                            val as Complaint["status"],
                          )
                        }
                      >
                        <SelectTrigger className="!h-8 w-32 text-xs font-semibold bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">
                            <span className="inline-flex items-center gap-1.5">
                              <span className="size-2 rounded-full bg-amber-500" />
                              <span>Open</span>
                            </span>
                          </SelectItem>
                          <SelectItem value="in_progress">
                            <span className="inline-flex items-center gap-1.5">
                              <span className="size-2 rounded-full bg-blue-500" />
                              <span>In Progress</span>
                            </span>
                          </SelectItem>
                          <SelectItem value="resolved">
                            <span className="inline-flex items-center gap-1.5">
                              <span className="size-2 rounded-full bg-emerald-500" />
                              <span>Resolved</span>
                            </span>
                          </SelectItem>
                          <SelectItem value="closed">
                            <span className="inline-flex items-center gap-1.5">
                              <span className="size-2 rounded-full bg-muted-foreground" />
                              <span>Closed</span>
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>

                      {/* Priority Changer */}
                      <Select
                        value={selectedTicket.priority || "medium"}
                        onValueChange={(val) =>
                          onUpdateComplaintStatus?.(
                            selectedTicket.id,
                            selectedTicket.status,
                            val as Complaint["priority"],
                          )
                        }
                      >
                        <SelectTrigger className="!h-8 w-26 text-xs font-semibold bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>

                      {/* Mark Resolved shortcut */}
                      {selectedTicket.status !== "resolved" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            onUpdateComplaintStatus?.(selectedTicket.id, "resolved")
                          }
                          className="!h-8 text-xs font-bold text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10 gap-1 hidden md:inline-flex"
                        >
                          <CheckCircle2 className="size-3.5" />
                          <span>Resolve</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* CONTEXT STRIP: Requester & Linked Order */}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/80 bg-background/80 px-3 py-2 text-xs">
                  <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <User className="size-3.5 text-primary" />
                      <span>Requester:</span>
                      <strong className="text-foreground font-semibold">
                        {selectedTicket.userName || "Customer"}
                      </strong>
                    </div>

                    {selectedTicket.userContact && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="size-3.5 text-muted-foreground" />
                        <span className="tabular-nums font-medium text-foreground">
                          {selectedTicket.userContact}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 text-[11px]">
                      <Clock3 className="size-3.5 text-muted-foreground" />
                      <span>Created: {selectedTicket.createdAt}</span>
                    </div>
                  </div>

                  {/* Linked Order Reference */}
                  {selectedTicket.orderReference && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-[11px]">
                        Linked Order:
                      </span>
                      <button
                        type="button"
                        onClick={() => onNavigateTab?.("orders-audit")}
                        className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary hover:bg-primary/20 transition-colors"
                      >
                        <span>{selectedTicket.orderReference}</span>
                        <ExternalLink className="size-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* MESSAGES CONVERSATION FEED */}
              <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5 bg-card/60">
                {/* Audit Start Marker */}
                <div className="flex items-center justify-center gap-2 py-1">
                  <div className="h-px flex-1 bg-border/80" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 bg-muted/60 px-2.5 py-0.5 rounded-full">
                    Ticket opened &middot; {selectedTicket.createdAt}
                  </span>
                  <div className="h-px flex-1 bg-border/80" />
                </div>

                {/* Messages mapping */}
                {selectedTicket.messages.map((message) => {
                  const isStaff =
                    message.sender === "support_admin" ||
                    message.sender === "admin" ||
                    message.sender === "support";

                  return (
                    <div
                      key={message.id}
                      className={`flex items-end gap-2.5 ${isStaff ? "flex-row-reverse" : "flex-row"
                        }`}
                    >
                      {/* Avatar */}
                      <div
                        className={`flex size-8 shrink-0 items-center justify-center rounded-xl font-bold text-xs shadow-2xs ${isStaff
                          ? "bg-primary text-primary-foreground ring-2 ring-primary/20"
                          : "bg-amber-500/15 text-amber-700 dark:text-amber-400 ring-2 ring-amber-500/20"
                          }`}
                      >
                        {isStaff ? (
                          <Headphones className="size-4" />
                        ) : (
                          <User className="size-4" />
                        )}
                      </div>

                      {/* Bubble & Metadata */}
                      <div
                        className={`flex max-w-[82%] sm:max-w-md flex-col ${isStaff ? "items-end" : "items-start"
                          }`}
                      >
                        <div className="mb-1 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                          <span className="font-semibold text-foreground">
                            {message.senderName}
                          </span>
                          <span>&middot;</span>
                          <span className="tabular-nums">
                            {message.timestamp}
                          </span>
                          {isStaff && (
                            <Badge
                              variant="outline"
                              className="text-[8px] font-bold uppercase border-primary/30 text-primary py-0 px-1 ml-1"
                            >
                              Support Desk
                            </Badge>
                          )}
                        </div>

                        <div
                          className={`rounded-2xl px-4 py-3 text-xs sm:text-[13px] leading-relaxed shadow-2xs ${isStaff
                            ? "rounded-tr-xs bg-primary text-primary-foreground"
                            : "rounded-tl-xs border border-border bg-muted/60 text-foreground"
                            }`}
                        >
                          <p className="whitespace-pre-wrap">{message.text}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* CANNED NOC REPLIES CHIPS BAR */}
              <div className="border-t border-border bg-muted/20 px-3.5 py-2">
                <div className="flex items-center gap-2 overflow-x-auto text-[11px] pb-0.5 no-scrollbar">
                  <span className="text-muted-foreground shrink-0 font-bold flex items-center gap-1 text-[10px] uppercase tracking-wider">
                    <Sparkles className="size-3 text-primary" />
                    Quick Responses:
                  </span>
                  {CANNED_RESPONSES.map((snippet, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setNewReplyText(snippet)}
                      className="shrink-0 rounded-lg border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted hover:border-primary/40 transition-all truncate max-w-[240px] cursor-pointer"
                      title={snippet}
                    >
                      {snippet}
                    </button>
                  ))}
                </div>
              </div>

              {/* REPLY COMPOSER */}
              <form
                onSubmit={handleSendReply}
                className="flex shrink-0 items-center gap-2 border-t border-border bg-card p-3 sm:p-4"
              >
                <div className="relative flex-1">
                  <Input
                    type="text"
                    placeholder="Type an official reply or NOC resolution note..."
                    value={newReplyText}
                    onChange={(e) => setNewReplyText(e.target.value)}
                    className="h-11 bg-background text-xs sm:text-sm pl-3 pr-2"
                  />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSendAndResolve}
                  className="h-11 px-3 text-xs font-bold text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10 hidden sm:inline-flex gap-1"
                >
                  <CheckCircle2 className="size-4" />
                  <span>Reply & Resolve</span>
                </Button>

                <Button
                  type="submit"
                  disabled={!newReplyText.trim()}
                  className="h-11 px-4 gap-1.5 text-xs font-bold shadow-xs"
                >
                  <Send className="size-4" />
                  <span>Send</span>
                </Button>
              </form>
            </div>
          ) : (
            <div className="flex h-[700px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card p-8 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground/60">
                <MessageCircle className="size-7" />
              </div>

              <div>
                <h3 className="text-base font-bold text-foreground">
                  No ticket selected
                </h3>
                <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                  Select a dispute ticket from the inbound queue on the left to
                  view the conversation history and respond.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useMemo, useEffect } from "react";
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Copy,
  Plus,
  Search,
  SlidersHorizontal,
  X,
  Download,
  Trash2,
  RefreshCw,
  ExternalLink,
  Phone,
  Layers,
  ShieldAlert,
  Check,
  FileText,
  User,
  Filter,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../ui/card";
import { Label } from "../ui/label";
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
import { PaginationHelper } from "../customer/views/PaginationHelper";
import { loadFromStorage, saveToStorage } from "../../mockData";

export interface FailedBeneficiaryRecord {
  id: string;
  phoneNumber: string;
  repeatCount: number;
  note?: string;
  addedByName: string;
  addedByRole: "agent" | "admin" | "system" | "customer";
  status: "pending" | "resolved"; // "resolved" is rendered as "Verified"
  createdAt: string;
  orderId?: string;
  network?: "MTN" | "Telecel" | "AirtelTigo";
}

export const INITIAL_BENEFICIARY_REPORTS: FailedBeneficiaryRecord[] = [
  {
    id: "fb-101",
    phoneNumber: "0509379146",
    repeatCount: 3,
    note: "MTN order SDH-GH-94812 failed: recipient is not in the beneficiary list",
    addedByName: "System Auto-Capture",
    addedByRole: "system",
    status: "pending",
    createdAt: "2026-09-17T14:30:00Z",
    orderId: "SDH-GH-94812",
    network: "MTN",
  },
  {
    id: "fb-102",
    phoneNumber: "0240021899",
    repeatCount: 1,
    note: "Customer reported: can't add beneficiary on 5GB non-expiry bundle",
    addedByName: "Ama Boateng",
    addedByRole: "agent",
    status: "pending",
    createdAt: "2026-09-17T11:15:00Z",
    orderId: "SDH-GH-94770",
    network: "MTN",
  },
  {
    id: "fb-103",
    phoneNumber: "0205064022",
    repeatCount: 2,
    note: "MTN error: beneficiary not registered upstream",
    addedByName: "Kofi Mensah",
    addedByRole: "agent",
    status: "pending",
    createdAt: "2026-09-16T18:40:00Z",
    orderId: "SDH-GH-94610",
    network: "MTN",
  },
  {
    id: "fb-104",
    phoneNumber: "0554128901",
    repeatCount: 1,
    note: "Manual admin whitelisting request from WhatsApp agent desk",
    addedByName: "Kendrick Admin",
    addedByRole: "admin",
    status: "resolved",
    createdAt: "2026-09-15T09:20:00Z",
    network: "MTN",
  },
  {
    id: "fb-105",
    phoneNumber: "0279876543",
    repeatCount: 1,
    note: "MTN order SDH-GH-94210 failed: unable to add beneficiary",
    addedByName: "System Auto-Capture",
    addedByRole: "system",
    status: "resolved",
    createdAt: "2026-09-14T16:05:00Z",
    orderId: "SDH-GH-94210",
    network: "MTN",
  },
  {
    id: "fb-106",
    phoneNumber: "0501122334",
    repeatCount: 4,
    note: "Repeated rejection by MTN gateway: beneficiary list full or unlinked",
    addedByName: "Emmanuel Osei",
    addedByRole: "agent",
    status: "pending",
    createdAt: "2026-09-17T08:10:00Z",
    orderId: "SDH-GH-94890",
    network: "MTN",
  },
  {
    id: "fb-107",
    phoneNumber: "0243322110",
    repeatCount: 1,
    note: "Agent store order failed beneficiary validation",
    addedByName: "Grace Adjei",
    addedByRole: "agent",
    status: "pending",
    createdAt: "2026-09-16T22:15:00Z",
    orderId: "SDH-GH-94715",
    network: "MTN",
  },
];

const ITEMS_PER_PAGE = 8;

// Local-format phone validator: 0 + 9 digits
const phoneOk = (v: string) =>
  /^0\d{9}$/.test(String(v || "").replace(/\D/g, ""));

export interface AdminBeneficiaryTrackerProps {
  onNavigateTab?: (tab: string) => void;
}

export const AdminBeneficiaryTracker: React.FC<
  AdminBeneficiaryTrackerProps
> = ({ onNavigateTab }) => {
  const [reports, setReports] = useState<FailedBeneficiaryRecord[]>(() =>
    loadFromStorage(
      "admin_failed_beneficiaries_list",
      INITIAL_BENEFICIARY_REPORTS,
    ),
  );

  const [statusFilter, setStatusFilter] = useState<string>("pending"); // pending | resolved | all
  const [roleFilter, setRoleFilter] = useState<string>("all"); // all | system | agent | admin
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [rawPhoneInput, setRawPhoneInput] = useState("");
  const [manualNote, setManualNote] = useState("");

  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "info" | "error";
  } | null>(null);

  const updateReports = (newReports: FailedBeneficiaryRecord[]) => {
    setReports(newReports);
    saveToStorage("admin_failed_beneficiaries_list", newReports);
  };

  const showToast = (
    text: string,
    type: "success" | "info" | "error" = "success",
  ) => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, roleFilter, searchQuery, fromDate, toDate]);

  // Statistics calculation
  const pendingReports = useMemo(
    () => reports.filter((r) => r.status === "pending"),
    [reports],
  );
  const verifiedReports = useMemo(
    () => reports.filter((r) => r.status === "resolved"),
    [reports],
  );
  const repeatReports = useMemo(
    () => reports.filter((r) => r.repeatCount > 1),
    [reports],
  );

  // Date parsing helper
  const fromMs = fromDate ? new Date(`${fromDate}T00:00:00Z`).getTime() : null;
  const toMs = toDate ? new Date(`${toDate}T23:59:59.999Z`).getTime() : null;

  // Filtered rows
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      // Status filter
      if (statusFilter !== "all" && r.status !== statusFilter) return false;

      // Role filter
      if (roleFilter !== "all" && r.addedByRole !== roleFilter) return false;

      // Search query (strictly without font mono!)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchPhone = r.phoneNumber.includes(q);
        const matchNote = (r.note || "").toLowerCase().includes(q);
        const matchName = (r.addedByName || "").toLowerCase().includes(q);
        const matchOrder = (r.orderId || "").toLowerCase().includes(q);
        if (!matchPhone && !matchNote && !matchName && !matchOrder) {
          return false;
        }
      }

      // Date range filter
      if (fromMs != null || toMs != null) {
        const itemDate = r.createdAt ? new Date(r.createdAt).getTime() : 0;
        if (fromMs != null && itemDate < fromMs) return false;
        if (toMs != null && itemDate > toMs) return false;
      }

      return true;
    });
  }, [reports, statusFilter, roleFilter, searchQuery, fromMs, toMs]);

  const isFiltered =
    searchQuery !== "" ||
    statusFilter !== "pending" ||
    roleFilter !== "all" ||
    fromDate !== "" ||
    toDate !== "";

  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter("pending");
    setRoleFilter("all");
    setFromDate("");
    setToDate("");
    setCurrentPage(1);
  };

  const totalPages = Math.max(
    1,
    Math.ceil(filteredReports.length / ITEMS_PER_PAGE),
  );
  const paginatedReports = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredReports.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredReports, currentPage]);

  // Actions
  const handleCopyAllNumbers = async () => {
    const numbers = Array.from(
      new Set(filteredReports.map((r) => r.phoneNumber)),
    );
    if (!numbers.length) {
      showToast("No phone numbers to copy", "info");
      return;
    }
    const text = numbers.join(", ");
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      } catch {
        showToast(
          "Could not copy automatically — please select manually",
          "error",
        );
        return;
      }
    }
    showToast(
      `${numbers.length} unique phone number${numbers.length === 1 ? "" : "s"} copied to clipboard`,
      "success",
    );
  };

  const handleToggleStatus = (
    id: string,
    currentStatus: "pending" | "resolved",
  ) => {
    const nextStatus: "pending" | "resolved" =
      currentStatus === "pending" ? "resolved" : "pending";
    const updated = reports.map((r) => {
      if (r.id === id) {
        return {
          ...r,
          status: nextStatus,
        };
      }
      return r;
    });
    updateReports(updated);
    showToast(
      nextStatus === "resolved"
        ? "Marked as Verified upstream on MTN"
        : "Report reopened for review",
      nextStatus === "resolved" ? "success" : "info",
    );
  };

  const handleDeleteReport = (id: string, phoneNumber: string) => {
    const updated = reports.filter((r) => r.id !== id);
    updateReports(updated);
    showToast(`Report for ${phoneNumber} deleted`, "info");
  };

  // Bulk add modal parsing
  const parsedEntries = useMemo(() => {
    return rawPhoneInput
      .split(/[^0-9+]+/)
      .map((v) => v.trim())
      .filter(Boolean);
  }, [rawPhoneInput]);

  const validNumbers = useMemo(() => {
    return Array.from(
      new Set(parsedEntries.filter(phoneOk).map((v) => v.replace(/\D/g, ""))),
    );
  }, [parsedEntries]);

  const invalidNumbers = useMemo(() => {
    return parsedEntries.filter((v) => !phoneOk(v));
  }, [parsedEntries]);

  const handleBulkAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validNumbers.length === 0) {
      showToast(
        "Please enter at least one valid 10-digit Ghana phone number starting with 0",
        "error",
      );
      return;
    }

    const newRecords: FailedBeneficiaryRecord[] = validNumbers.map(
      (num, idx) => ({
        id: `fb-manual-${Date.now()}-${idx}`,
        phoneNumber: num,
        repeatCount: 1,
        note:
          manualNote.trim() ||
          "Manually reported for MTN beneficiary whitelisting",
        addedByName: "Kendrick Admin",
        addedByRole: "admin",
        status: "pending",
        createdAt: new Date().toISOString(),
        network: "MTN",
      }),
    );

    updateReports([...newRecords, ...reports]);
    setIsAddOpen(false);
    setRawPhoneInput("");
    setManualNote("");
    showToast(
      `${validNumbers.length} number${validNumbers.length === 1 ? "" : "s"} added to beneficiary tracker`,
      "success",
    );
  };

  const handleExportCsv = () => {
    const head = [
      "Report Date",
      "Phone Number",
      "Repeat Count",
      "Note / Error Description",
      "Order Reference",
      "Reported By",
      "Source Role",
      "Status",
    ];

    const esc = (c: any) =>
      `"${String(c == null ? "" : c).replace(/"/g, '""')}"`;

    const body = filteredReports.map((r) => [
      esc(r.createdAt ? r.createdAt.replace("T", " ").slice(0, 16) : ""),
      esc(r.phoneNumber),
      esc(r.repeatCount),
      esc(r.note || ""),
      esc(r.orderId || ""),
      esc(r.addedByName),
      esc(r.addedByRole),
      esc(r.status === "resolved" ? "Verified" : "Pending"),
    ]);

    const csv = [
      head.map(esc).join(","),
      ...body.map((row) => row.join(",")),
    ].join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `failed-beneficiaries-${statusFilter}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);

    showToast(
      `Exported ${filteredReports.length} beneficiary records to CSV`,
      "success",
    );
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      return d.toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* TOP HEADER (Matching AdminPayouts & AdminAfa header layout) */}
      <div className="flex flex-col items-start justify-between gap-4 border-b border-border pb-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-foreground">
            <AlertTriangle className="size-6 text-amber-500" />
            <span>MTN Beneficiary Tracker</span>
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Add numbers upstream to MTN, then mark as Verified.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {toastMessage && (
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-lg animate-in fade-in duration-200 border ${
                toastMessage.type === "success"
                  ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                  : toastMessage.type === "error"
                    ? "text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20"
                    : "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20"
              }`}
            >
              {toastMessage.text}
            </span>
          )}

          <Button
            size="sm"
            onClick={() => setIsAddOpen(true)}
            className="text-xs font-bold shadow-xs cursor-pointer gap-1.5 h-9"
          >
            <Plus className="size-4" />
            <span>Add Manually</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleExportCsv}
            disabled={filteredReports.length === 0}
            className="text-xs font-bold shadow-xs cursor-pointer gap-1.5 h-9"
          >
            <Download className="size-4" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* 4 STATS CARDS TILES (Matching AdminPayouts & AdminAfa layout with icon + label next to icon) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Pending Verification */}
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10">
              <Clock className="size-3.5 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Pending verification
            </span>
          </div>
          <p className="mt-2 text-xl font-black tabular-nums text-amber-600 dark:text-amber-400">
            {pendingReports.length}
          </p>
          <p className="text-[10px] text-muted-foreground font-medium">
            {pendingReports.length > 0
              ? "Awaiting MTN upstream addition"
              : "All beneficiary reports resolved"}
          </p>
        </div>

        {/* Verified Upstream */}
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10">
              <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Verified numbers
            </span>
          </div>
          <p className="mt-2 text-xl font-black tabular-nums text-emerald-600 dark:text-emerald-400">
            {verifiedReports.length}
          </p>
          <p className="text-[10px] text-muted-foreground font-medium">
            Whitelisted for MTN data transfers
          </p>
        </div>

        {/* Total Tracked */}
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-blue-500/10">
              <Layers className="size-3.5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Total reports
            </span>
          </div>
          <p className="mt-2 text-xl font-black tabular-nums text-foreground">
            {reports.length}
          </p>
          <p className="text-[10px] text-muted-foreground font-medium">
            Lifetime beneficiary failures captured
          </p>
        </div>

        {/* Repeat Failures */}
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-red-500/10">
              <RefreshCw className="size-3.5 text-red-600 dark:text-red-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Repeat rejections
            </span>
          </div>
          <p className="mt-2 text-xl font-black tabular-nums text-red-600 dark:text-red-400">
            {repeatReports.length}
          </p>
          <p className="text-[10px] text-muted-foreground font-medium">
            Numbers failed more than once
          </p>
        </div>
      </div>

      {/* MASTER BENEFICIARY TRACKER CARD (Identical to Payout Requests & AdminAfa pattern) */}
      <Card className="border-border shadow-xs">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base font-extrabold text-foreground">
                <AlertTriangle className="size-5 text-amber-500" />
                <span>Beneficiary Tracker Records</span>
                {pendingReports.length > 0 && (
                  <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                    {pendingReports.length} pending
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="mt-1 text-xs">
                Review failed MTN recipient numbers, copy them in bulk for
                upstream whitelisting, and update their status.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        {/* Search + Filters Container (Exact match to Payout Requests & vouchers-stock) */}
        <div className="border-b border-border bg-muted/20 p-4 space-y-4">
          {/* Top Full-width Search Input */}
          <div className="space-y-1.5">
            <Label
              htmlFor="tracker-search"
              className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
            >
              Search beneficiary records
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="tracker-search"
                type="text"
                placeholder="Search phone number, note, order reference, or reporter name..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-10 bg-background pl-9 pr-9 text-xs"
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

          {/* Filters Box (Nested Card Box matching Payout Requests & vouchers-stock) */}
          <div className="rounded-xl border border-border bg-background p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="size-3.5 text-muted-foreground" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Tracker filters &amp; date range
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

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {/* Status Filter */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="filter-status"
                  className="text-[10px] font-semibold text-muted-foreground"
                >
                  Verification Status
                </Label>
                <Select
                  value={statusFilter}
                  onValueChange={(v) => {
                    setStatusFilter(v);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger
                    id="filter-status"
                    className="h-9 w-full text-xs"
                  >
                    <SelectValue placeholder="Pending" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">
                      Pending ({pendingReports.length})
                    </SelectItem>
                    <SelectItem value="resolved">
                      Verified ({verifiedReports.length})
                    </SelectItem>
                    <SelectItem value="all">
                      All Reports ({reports.length})
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Source / Role Filter */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="filter-role"
                  className="text-[10px] font-semibold text-muted-foreground"
                >
                  Report Source
                </Label>
                <Select
                  value={roleFilter}
                  onValueChange={(v) => {
                    setRoleFilter(v);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger
                    id="filter-role"
                    className="h-9 w-full text-xs"
                  >
                    <SelectValue placeholder="All Sources" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="system">System Auto-Capture</SelectItem>
                    <SelectItem value="agent">Agent Report</SelectItem>
                    <SelectItem value="admin">Admin Direct</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date From */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="filter-from-date"
                  className="text-[10px] font-semibold text-muted-foreground"
                >
                  Reported From
                </Label>
                <Input
                  id="filter-from-date"
                  type="date"
                  value={fromDate}
                  max={toDate || undefined}
                  onChange={(e) => {
                    setFromDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-9 text-xs"
                />
              </div>

              {/* Date To */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="filter-to-date"
                  className="text-[10px] font-semibold text-muted-foreground"
                >
                  Reported To
                </Label>
                <Input
                  id="filter-to-date"
                  type="date"
                  value={toDate}
                  min={fromDate || undefined}
                  onChange={(e) => {
                    setToDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-9 text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* TABLE SECTION (Matching AdminPayouts & vouchers-stock Table styling, strictly NO font-mono) */}
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="text-xs font-bold">
                    Date &amp; Time
                  </TableHead>
                  <TableHead className="text-xs font-bold">
                    Phone Number
                  </TableHead>
                  <TableHead className="text-xs font-bold">
                    Error Note &amp; Order Ref
                  </TableHead>
                  <TableHead className="text-xs font-bold">
                    Reported By
                  </TableHead>
                  <TableHead className="text-xs font-bold text-center">
                    Status
                  </TableHead>
                  <TableHead className="text-xs font-bold text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedReports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <AlertTriangle className="size-10 stroke-1 mb-2 text-muted-foreground/60" />
                        <p className="text-sm font-semibold text-foreground">
                          No beneficiary reports found
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {isFiltered
                            ? "Try broadening your search query or reset your filters."
                            : statusFilter === "pending"
                              ? "No pending beneficiary failures — all numbers verified."
                              : "No records found in this view."}
                        </p>
                        {isFiltered && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleResetFilters}
                            className="mt-3 text-xs font-bold"
                          >
                            Reset filters
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedReports.map((r) => {
                    const isVerified = r.status === "resolved";

                    return (
                      <TableRow key={r.id} className="hover:bg-muted/20">
                        {/* Date & Time */}
                        <TableCell className="py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {formatDateTime(r.createdAt)}
                        </TableCell>

                        {/* Phone Number (strictly without font-mono!) */}
                        <TableCell className="py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-foreground tabular-nums">
                              {r.phoneNumber}
                            </span>
                            {r.repeatCount > 1 && (
                              <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-[9px] font-black px-1.5 py-0">
                                ×{r.repeatCount}
                              </Badge>
                            )}
                          </div>
                        </TableCell>

                        {/* Note & Order Ref */}
                        <TableCell className="py-3">
                          <div className="space-y-0.5 max-w-xs">
                            <div className="text-xs font-medium text-foreground line-clamp-2">
                              {r.note || "—"}
                            </div>
                            {r.orderId && (
                              <div className="text-[11px] font-semibold text-primary">
                                Order: {r.orderId}
                              </div>
                            )}
                          </div>
                        </TableCell>

                        {/* Reported By */}
                        <TableCell className="py-3">
                          <div className="space-y-0.5">
                            <div className="text-xs font-semibold text-foreground">
                              {r.addedByName}
                            </div>
                            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                              {r.addedByRole}
                            </div>
                          </div>
                        </TableCell>

                        {/* Status */}
                        <TableCell className="py-3 text-center">
                          {isVerified ? (
                            <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                              Verified
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                              Pending
                            </Badge>
                          )}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isVerified ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleToggleStatus(r.id, r.status)
                                }
                                className="h-7 px-2 text-[11px] font-bold cursor-pointer"
                              >
                                Reopen
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleToggleStatus(r.id, r.status)
                                }
                                className="h-7 px-2.5 text-[11px] font-bold bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer gap-1"
                              >
                                <Check className="size-3" />
                                <span>Verify</span>
                              </Button>
                            )}

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                handleDeleteReport(r.id, r.phoneNumber)
                              }
                              className="size-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                              title="Delete report"
                            >
                              <X className="size-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-border">
              <PaginationHelper
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* BULK ADD / MANUAL ADD MODAL */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md border-border bg-card">
          <form onSubmit={handleBulkAddSubmit}>
            <DialogHeader>
              <DialogTitle className="text-base font-extrabold text-foreground flex items-center gap-2">
                <Plus className="size-4 text-primary" />
                <span>Add Refused Beneficiary Numbers</span>
              </DialogTitle>
              <DialogDescription className="text-xs">
                Paste one or multiple numbers that MTN refused for data
                transfer.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 py-4 text-xs">
              <div className="space-y-1">
                <Label htmlFor="bulk-phone-input" className="text-xs font-bold">
                  Phone Number(s) <span className="text-red-500">*</span>
                </Label>
                <textarea
                  id="bulk-phone-input"
                  rows={4}
                  placeholder={"0509379146\n0240021899\n0205064022"}
                  value={rawPhoneInput}
                  onChange={(e) => setRawPhoneInput(e.target.value)}
                  className="w-full rounded-md border border-input bg-background p-2.5 text-xs font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
                <p className="text-[11px] text-muted-foreground">
                  Paste multiple numbers separated by commas, spaces, or
                  newlines.
                </p>
              </div>

              {(validNumbers.length > 0 || invalidNumbers.length > 0) && (
                <div className="rounded-lg border border-border bg-muted/20 p-2.5 space-y-1 text-[11px]">
                  {validNumbers.length > 0 && (
                    <p className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="size-3.5" />
                      <span>
                        {validNumbers.length} valid 10-digit number
                        {validNumbers.length === 1 ? "" : "s"} ready
                      </span>
                    </p>
                  )}
                  {invalidNumbers.length > 0 && (
                    <p className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <AlertTriangle className="size-3.5" />
                      <span>
                        {invalidNumbers.length} entry format warning (must be 10
                        digits starting with 0)
                      </span>
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-1">
                <Label htmlFor="manual-note" className="text-xs font-bold">
                  Note / Error Detail
                </Label>
                <Input
                  id="manual-note"
                  type="text"
                  placeholder="e.g. Reported via WhatsApp support desk"
                  value={manualNote}
                  onChange={(e) => setManualNote(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <DialogFooter className="border-t border-border pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddOpen(false)}
                className="text-xs font-bold cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={validNumbers.length === 0}
                className="text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer disabled:opacity-50"
              >
                Add{" "}
                {validNumbers.length > 0
                  ? `${validNumbers.length} Number${validNumbers.length === 1 ? "" : "s"}`
                  : "Numbers"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

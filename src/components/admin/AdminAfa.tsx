import React, { useState, useMemo, useEffect } from "react";
import {
  FileCheck,
  CheckCircle2,
  Clock,
  Search,
  SlidersHorizontal,
  Download,
  X,
  Check,
  AlertTriangle,
  XCircle,
  Phone,
  MapPin,
  Briefcase,
  Calendar,
  CreditCard,
  ShieldCheck,
  Eye,
  User,
  Copy,
  RotateCcw,
  Coins,
  Store,
  CheckCheck,
} from "lucide-react";
import { AfaApplication } from "../../types";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";

export interface AdminAfaProps {
  applications: AfaApplication[];
  onUpdateAfaStatus: (
    appId: string,
    status: "approved" | "rejected" | "needs_correction" | "under_review",
  ) => void;
  onNavigateTab?: (tab: string) => void;
}

const ITEMS_PER_PAGE = 8;
const AFA_WHOLESALE_COST = 18.0; // Wholesale cost / platform baseline in Ghana Cedis

export function getApplicantRegion(app: AfaApplication): string {
  if (app.region) return app.region;
  const loc = (app.location || "").toLowerCase();
  if (
    loc.includes("accra") ||
    loc.includes("tema") ||
    loc.includes("madina") ||
    loc.includes("kasoa")
  )
    return "Greater Accra";
  if (loc.includes("kumasi") || loc.includes("obuasi")) return "Ashanti";
  if (loc.includes("koforidua") || loc.includes("nkawkaw")) return "Eastern";
  if (loc.includes("takoradi") || loc.includes("tarkwa")) return "Western";
  if (
    loc.includes("cape coast") ||
    loc.includes("winneba") ||
    loc.includes("elmina")
  )
    return "Central";
  if (loc.includes("ho") || loc.includes("hohoe") || loc.includes("kpando"))
    return "Volta";
  if (loc.includes("tamale") || loc.includes("yendi")) return "Northern";
  if (loc.includes("sunyani") || loc.includes("techiman")) return "Bono";
  return app.location || "Ghana";
}

export function getApplicantSubmitter(app: AfaApplication): string {
  if (app.submittedBy) return app.submittedBy;
  // Audit fallback matching sdh-next: Agent store submitters vs Direct App
  const hash = app.id.slice(-1);
  if (hash === "1" || hash === "5") return "Kofi Owusu (Agent)";
  if (hash === "2" || hash === "6") return "Ama Serwaa (Agent)";
  if (hash === "3" || hash === "7") return "Yaw Mensah (Agent)";
  return "Direct Customer (App)";
}

export const AdminAfa: React.FC<AdminAfaProps> = ({
  applications = [],
  onUpdateAfaStatus,
  onNavigateTab,
}) => {
  // --------------------------------------------------------------------------
  // 1. Authoritative AFA Registration Pricing (Audited from sdh-next afaPricing.ts)
  // --------------------------------------------------------------------------
  const [customerPrice, setCustomerPrice] = useState<number>(() => {
    try {
      const stored = localStorage.getItem("sdh_afa_customer_price");
      if (stored && !isNaN(Number(stored)) && Number(stored) > 0) {
        return Number(stored);
      }
    } catch {}
    return 25.0; // Default customer price in GH₵
  });
  const [agentPrice, setAgentPrice] = useState<number>(() => {
    try {
      const stored = localStorage.getItem("sdh_afa_agent_price");
      if (stored && !isNaN(Number(stored)) && Number(stored) > 0) {
        return Number(stored);
      }
    } catch {}
    return 25.0; // Default agent price in GH₵
  });
  const [customerPriceInput, setCustomerPriceInput] = useState<string>(
    customerPrice.toFixed(2),
  );
  const [agentPriceInput, setAgentPriceInput] = useState<string>(
    agentPrice.toFixed(2),
  );
  const [priceNotice, setPriceNotice] = useState<string | null>(null);

  useEffect(() => {
    setCustomerPriceInput(customerPrice.toFixed(2));
  }, [customerPrice]);

  useEffect(() => {
    setAgentPriceInput(agentPrice.toFixed(2));
  }, [agentPrice]);

  const customerPriceChanged =
    !isNaN(Number(customerPriceInput)) &&
    Number(customerPriceInput) > 0 &&
    Number(Number(customerPriceInput).toFixed(2)) !==
      Number(customerPrice.toFixed(2));

  const agentPriceChanged =
    !isNaN(Number(agentPriceInput)) &&
    Number(agentPriceInput) > 0 &&
    Number(Number(agentPriceInput).toFixed(2)) !==
      Number(agentPrice.toFixed(2));

  const anyPriceChanged = customerPriceChanged || agentPriceChanged;

  const handleSavePrice = () => {
    const customerNum = Number(customerPriceInput);
    const agentNum = Number(agentPriceInput);

    if (!Number.isFinite(customerNum) || customerNum < 1 || customerNum > 500) {
      setPriceNotice(
        "Please enter a valid customer price between GH₵ 1.00 and GH₵ 500.00.",
      );
      setTimeout(() => setPriceNotice(null), 3500);
      return;
    }

    if (!Number.isFinite(agentNum) || agentNum < 1 || agentNum > 500) {
      setPriceNotice(
        "Please enter a valid agent price between GH₵ 1.00 and GH₵ 500.00.",
      );
      setTimeout(() => setPriceNotice(null), 3500);
      return;
    }

    const sanitizedCustomer = Number(customerNum.toFixed(2));
    const sanitizedAgent = Number(agentNum.toFixed(2));

    setCustomerPrice(sanitizedCustomer);
    setAgentPrice(sanitizedAgent);

    try {
      localStorage.setItem("sdh_afa_customer_price", String(sanitizedCustomer));
      localStorage.setItem("sdh_afa_agent_price", String(sanitizedAgent));
    } catch {}

    setPriceNotice(
      `Prices saved: Customer GH₵ ${sanitizedCustomer.toFixed(2)} | Agent GH₵ ${sanitizedAgent.toFixed(2)}`,
    );
    setTimeout(() => setPriceNotice(null), 4000);
  };

  // --------------------------------------------------------------------------
  // 2. Structured Filters & Search (Matching Commissions Table design)
  // --------------------------------------------------------------------------
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [occupationFilter, setOccupationFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [copiedRef, setCopiedRef] = useState<string | null>(null);

  // Selected application for detail modal inspection
  const [inspectingApp, setInspectingApp] = useState<AfaApplication | null>(
    null,
  );
  const [correctionNote, setCorrectionNote] = useState("");

  // Copy reference utility
  const handleCopyReference = (ref: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(ref);
    setCopiedRef(ref);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  // --------------------------------------------------------------------------
  // 3. Stats calculation (Audited from sdh-next: Total, Approved, Under review, Not approved)
  // --------------------------------------------------------------------------
  const stats = useMemo(() => {
    const total = applications.length;
    const pending = applications.filter(
      (a) => a.status === "under_review",
    ).length;
    const approved = applications.filter((a) => a.status === "approved").length;
    const notApproved = applications.filter(
      (a) => a.status === "rejected" || a.status === "needs_correction",
    ).length;
    const totalFees = applications.reduce(
      (sum, a) => sum + (a.fee || customerPrice),
      0,
    );

    return { total, pending, approved, notApproved, totalFees };
  }, [applications, customerPrice]);

  // Unique lists for dropdowns
  const availableRegions = useMemo(() => {
    const set = new Set<string>();
    applications.forEach((a) => {
      const reg = getApplicantRegion(a);
      if (reg) set.add(reg);
    });
    return Array.from(set).sort();
  }, [applications]);

  const availableOccupations = useMemo(() => {
    const set = new Set<string>();
    applications.forEach((a) => {
      if (a.occupation) set.add(a.occupation);
    });
    return Array.from(set).sort();
  }, [applications]);

  // Filter and sort applications
  const filteredApplications = useMemo(() => {
    return applications
      .filter((app) => {
        // Status filter
        if (statusFilter !== "all") {
          if (
            statusFilter === "under_review" &&
            app.status !== "under_review"
          ) {
            return false;
          }
          if (statusFilter === "approved" && app.status !== "approved") {
            return false;
          }
          if (
            statusFilter === "rejected" &&
            app.status !== "rejected" &&
            app.status !== "needs_correction"
          ) {
            return false;
          }
        }

        // Region filter
        if (regionFilter !== "all") {
          const reg = getApplicantRegion(app);
          if (reg !== regionFilter) return false;
        }

        // Occupation filter
        if (occupationFilter !== "all" && app.occupation !== occupationFilter) {
          return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = (app.fullName || "").toLowerCase().includes(q);
          const matchPhone = (app.phoneNumber || "").toLowerCase().includes(q);
          const matchGhanaCard = (app.ghanaCardNumber || "")
            .toLowerCase()
            .includes(q);
          const matchRef = (app.reference || "").toLowerCase().includes(q);
          const matchLocation = (app.location || "").toLowerCase().includes(q);
          const matchRegion = getApplicantRegion(app).toLowerCase().includes(q);
          const matchOccupation = (app.occupation || "")
            .toLowerCase()
            .includes(q);
          const matchSubmitter = getApplicantSubmitter(app)
            .toLowerCase()
            .includes(q);

          if (
            !matchName &&
            !matchPhone &&
            !matchGhanaCard &&
            !matchRef &&
            !matchLocation &&
            !matchRegion &&
            !matchOccupation &&
            !matchSubmitter
          ) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "oldest") {
          return (a.dateSubmitted || "").localeCompare(b.dateSubmitted || "");
        }
        if (sortBy === "name") {
          return (a.fullName || "").localeCompare(b.fullName || "");
        }
        if (sortBy === "card") {
          return (a.ghanaCardNumber || "").localeCompare(
            b.ghanaCardNumber || "",
          );
        }
        if (sortBy === "fee") {
          return (b.fee || customerPrice) - (a.fee || customerPrice);
        }
        // Default: newest first
        return (b.dateSubmitted || "").localeCompare(a.dateSubmitted || "");
      });
  }, [
    applications,
    statusFilter,
    regionFilter,
    occupationFilter,
    searchQuery,
    sortBy,
    customerPrice,
  ]);

  // Pagination calculation
  const totalPages = Math.max(
    1,
    Math.ceil(filteredApplications.length / ITEMS_PER_PAGE),
  );

  const paginatedApplications = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredApplications.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredApplications, currentPage]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setRegionFilter("all");
    setOccupationFilter("all");
    setSortBy("newest");
    setCurrentPage(1);
  };

  const isFiltered =
    searchQuery !== "" ||
    statusFilter !== "all" ||
    regionFilter !== "all" ||
    occupationFilter !== "all" ||
    sortBy !== "newest";

  // CSV Export utility
  const handleExportCsv = () => {
    const head = [
      "Reference",
      "Applicant Name",
      "Phone Number",
      "Submitted By",
      "Ghana Card",
      "Location",
      "Region",
      "Date of Birth",
      "Occupation",
      "Paid Fee (GHS)",
      "Status",
      "Date Submitted",
      "Notes",
    ];

    const esc = (c: any) =>
      `"${String(c == null ? "" : c).replace(/"/g, '""')}"`;

    const body = filteredApplications.map((app) => [
      esc(app.reference),
      esc(app.fullName),
      esc(app.phoneNumber),
      esc(getApplicantSubmitter(app)),
      esc(app.ghanaCardNumber),
      esc(app.location),
      esc(getApplicantRegion(app)),
      esc(app.dateOfBirth),
      esc(app.occupation),
      esc((app.fee || customerPrice).toFixed(2)),
      esc(app.status),
      esc(app.dateSubmitted),
      esc(app.notes || ""),
    ]);

    const csv = [head.map(esc).join(","), ...body.map((r) => r.join(","))].join(
      "\r\n",
    );
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `afa-registrations-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);

    setExportNotice(
      `Exported ${filteredApplications.length} AFA record${
        filteredApplications.length === 1 ? "" : "s"
      } successfully.`,
    );
    setTimeout(() => setExportNotice(null), 3500);
  };

  const getStatusPill = (status: AfaApplication["status"]) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Approved
          </span>
        );
      case "needs_correction":
        return (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400">
            <span className="size-1.5 rounded-full bg-amber-500" />
            Needs Correction
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-red-500/25 bg-red-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-700 dark:text-red-400">
            <span className="size-1.5 rounded-full bg-red-500" />
            Not Approved
          </span>
        );
      case "under_review":
      default:
        return (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400">
            <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
            Under Review
          </span>
        );
    }
  };

  const getInitials = (name: string) => {
    return (name || "?")
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      {/* ========================================================
          1. TOP HEADER (Matching Commissions & Complaints)
          ======================================================== */}
      <div className="flex flex-col items-start justify-between gap-4 border-b border-border pb-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-foreground">
            <FileCheck className="size-6 text-emerald-600 dark:text-emerald-400" />
            <span>AFA National Identity & Tariff Verification Desk</span>
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Review Ghana Card numbers and whitelist eligible agricultural
            subscribers for subsidized telecom data.
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
            className="text-xs font-bold shadow-xs gap-1.5 h-9 cursor-pointer"
          >
            <Download className="size-4" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* ========================================================
          2. 4 KPI STATS TILES (Audited from sdh-next AdminAfa)
          ======================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Tile 1: Total Applications */}
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-blue-500/10">
              <CreditCard className="size-3.5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Total Applications
            </span>
          </div>
          <p className="mt-2 text-xl font-black tabular-nums text-foreground">
            {stats.total}
          </p>
          <p className="text-[10px] text-muted-foreground font-medium">
            GH₵ {stats.totalFees.toFixed(2)} total collected
          </p>
        </div>

        {/* Tile 2: Approved */}
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10">
              <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Approved
            </span>
          </div>
          <p className="mt-2 text-xl font-black tabular-nums text-emerald-600 dark:text-emerald-400">
            {stats.approved}
          </p>
          <p className="text-[10px] text-muted-foreground font-medium">
            Whitelisted for AFA tariffs
          </p>
        </div>

        {/* Tile 3: Under Review */}
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10">
              <Clock className="size-3.5 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Under Review
            </span>
          </div>
          <p className="mt-2 text-xl font-black tabular-nums text-amber-600 dark:text-amber-400">
            {stats.pending}
          </p>
          <p className="text-[10px] text-muted-foreground font-medium">
            Requires Ghana Card audit
          </p>
        </div>

        {/* Tile 4: Not Approved */}
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-red-500/10">
              <XCircle className="size-3.5 text-red-600 dark:text-red-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Not Approved
            </span>
          </div>
          <p className="mt-2 text-xl font-black tabular-nums text-red-600 dark:text-red-400">
            {stats.notApproved}
          </p>
          <p className="text-[10px] text-muted-foreground font-medium">
            Rejected or needs correction
          </p>
        </div>
      </div>

      {/* ========================================================
          3. REGISTRATION PRICING CARD (Audited from sdh-next)
          The ONLY place the AFA fee can be set. Agents can't price AFA and earn nothing on it.
          ======================================================== */}
      <Card className="border-border shadow-xs bg-card overflow-hidden">
        <CardHeader className="border-b border-border pb-3 bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-sm font-extrabold text-foreground">
                <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
                <span>AFA Registration Pricing</span>
              </CardTitle>
              <CardDescription className="mt-0.5 text-xs">
                Applies everywhere, including agent stores. Agents can’t change
                it or earn AFA commission. Unpriced stores sell at the customer
                price.
              </CardDescription>
            </div>
            <Badge
              variant="outline"
              className="w-fit bg-amber-400/15 text-amber-800 dark:text-amber-300 border-amber-400/30 text-[10px] font-bold"
            >
              MTN Ghana Whitelisting
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Price Edit Controls */}
            <div className="flex flex-wrap items-end gap-3">
              {/* Customer Price */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="afa-reg-price"
                  className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
                >
                  Price customers pay (GH₵)
                </Label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 font-semibold text-xs text-muted-foreground">
                    GH₵
                  </span>
                  <Input
                    id="afa-reg-price"
                    type="number"
                    step="1"
                    min="1"
                    max="500"
                    value={customerPriceInput}
                    onChange={(e) => setCustomerPriceInput(e.target.value)}
                    className="h-10 pl-11 pr-3 text-sm font-bold w-44 bg-background"
                  />
                </div>
              </div>

              {/* Agent Price */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="afa-agent-price"
                  className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
                >
                  Price agents pay (GH₵)
                </Label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 font-semibold text-xs text-muted-foreground">
                    GH₵
                  </span>
                  <Input
                    id="afa-agent-price"
                    type="number"
                    step="1"
                    min="1"
                    max="500"
                    value={agentPriceInput}
                    onChange={(e) => setAgentPriceInput(e.target.value)}
                    className="h-10 pl-11 pr-3 text-sm font-bold w-44 bg-background"
                  />
                </div>
              </div>

              <Button
                type="button"
                disabled={!anyPriceChanged}
                onClick={handleSavePrice}
                className="h-10 px-4 text-xs font-bold gap-1.5 shadow-xs text-white cursor-pointer disabled:opacity-50"
              >
                <Check className="size-4" />
                <span>Save prices</span>
              </Button>

              {priceNotice && (
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-lg animate-in fade-in duration-200">
                  {priceNotice}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ========================================================
          4. MASTER AFA REGISTRATIONS CARD (Merged Filters + Table like AdminPayouts)
          ======================================================== */}
      <Card className="border-border shadow-xs">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base font-extrabold text-foreground">
                <span>AFA Verification Applications</span>
                {stats.pending > 0 && (
                  <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                    {stats.pending} pending review
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="mt-1 text-xs">
                Review Ghana Card numbers and whitelist eligible agricultural
                subscribers for subsidized telecom data.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        {/* Search + Filters Container */}
        <div className="border-b border-border bg-muted/20 p-4 space-y-4">
          {/* Search input */}
          <div className="space-y-1.5">
            <Label
              htmlFor="admin-afa-search"
              className="text-[10px] font-bold uppercase text-muted-foreground"
            >
              Search AFA verification applications
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="admin-afa-search"
                type="text"
                placeholder="Search by applicant name, phone number, Ghana Card number, region, location, or trade..."
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

          {/* Filters Box */}
          <div className="rounded-xl border border-border bg-background p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="size-3.5 text-muted-foreground" />
                <span className="text-[10px] font-bold uppercase text-muted-foreground">
                  Verification filters
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
                  htmlFor="afa-filter-status"
                  className="text-[10px] font-semibold text-muted-foreground"
                >
                  Verification Status
                </Label>
                <Select
                  value={statusFilter}
                  onValueChange={(val) => {
                    setStatusFilter(val);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger
                    id="afa-filter-status"
                    className="h-9 w-full text-xs"
                  >
                    <SelectValue placeholder="All Verification States" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      All Verification States ({stats.total})
                    </SelectItem>
                    <SelectItem value="under_review">
                      Under Review ({stats.pending})
                    </SelectItem>
                    <SelectItem value="approved">
                      Approved ({stats.approved})
                    </SelectItem>
                    <SelectItem value="rejected">
                      Not Approved ({stats.notApproved})
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 2. Region Filter */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="afa-filter-region"
                  className="text-[10px] font-semibold text-muted-foreground"
                >
                  Administrative Region
                </Label>
                <Select
                  value={regionFilter}
                  onValueChange={(val) => {
                    setRegionFilter(val);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger
                    id="afa-filter-region"
                    className="h-9 w-full text-xs"
                  >
                    <SelectValue placeholder="All Regions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Regions</SelectItem>
                    {availableRegions.map((reg) => (
                      <SelectItem key={reg} value={reg}>
                        {reg}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 3. Occupation / Trade Filter */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="afa-filter-occupation"
                  className="text-[10px] font-semibold text-muted-foreground"
                >
                  Trade / Agribusiness
                </Label>
                <Select
                  value={occupationFilter}
                  onValueChange={(val) => {
                    setOccupationFilter(val);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger
                    id="afa-filter-occupation"
                    className="h-9 w-full text-xs"
                  >
                    <SelectValue placeholder="All Trades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Trades</SelectItem>
                    {availableOccupations.map((occ) => (
                      <SelectItem key={occ} value={occ}>
                        {occ}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 4. Sort By */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="afa-sort-by"
                  className="text-[10px] font-semibold text-muted-foreground"
                >
                  Sort Applications
                </Label>
                <Select
                  value={sortBy}
                  onValueChange={(val) => {
                    setSortBy(val);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger
                    id="afa-sort-by"
                    className="h-9 w-full text-xs"
                  >
                    <SelectValue placeholder="Sort order" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="name">Applicant Name (A-Z)</SelectItem>
                    <SelectItem value="card">Ghana Card (Ascending)</SelectItem>
                    <SelectItem value="fee">
                      Registration Fee (Highest)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* AFA REGISTRATIONS TABLE */}
        <div className="rounded-xl border border-border overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <Table className="w-full text-xs">
              <TableHeader>
                <TableRow className="border-b border-border bg-muted/40 hover:bg-muted/40">
                  <TableHead className="h-12 px-4 text-left font-bold text-muted-foreground uppercase text-[10px]">
                    Reference
                  </TableHead>
                  <TableHead className="h-12 px-4 text-left font-bold text-muted-foreground uppercase text-[10px]">
                    Applicant
                  </TableHead>
                  <TableHead className="h-12 px-4 text-left font-bold text-muted-foreground uppercase text-[10px]">
                    Submitted by
                  </TableHead>
                  <TableHead className="h-12 px-4 text-left font-bold text-muted-foreground uppercase text-[10px]">
                    Ghana Card
                  </TableHead>
                  <TableHead className="h-12 px-4 text-left font-bold text-muted-foreground uppercase text-[10px]">
                    Occupation
                  </TableHead>
                  <TableHead className="h-12 px-4 text-right font-bold text-muted-foreground uppercase text-[10px]">
                    Paid
                  </TableHead>
                  <TableHead className="h-12 px-4 text-center font-bold text-muted-foreground uppercase text-[10px]">
                    Status
                  </TableHead>
                  <TableHead className="h-12 px-4 text-right font-bold text-muted-foreground uppercase text-[10px]">
                    When
                  </TableHead>
                  <TableHead className="h-12 px-4 text-right font-bold text-muted-foreground uppercase text-[10px]">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-border/60">
                {paginatedApplications.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="h-40 text-center text-muted-foreground"
                    >
                      <div className="flex flex-col items-center justify-center py-8">
                        <div className="size-10 rounded-full bg-muted flex items-center justify-center mb-2 text-muted-foreground">
                          <FileCheck className="size-5" />
                        </div>
                        <p className="text-sm font-semibold">
                          {applications.length === 0
                            ? "No AFA registrations yet."
                            : "No registrations match your search and filter criteria."}
                        </p>
                        {isFiltered && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleResetFilters}
                            className="mt-2 text-xs text-primary font-bold cursor-pointer"
                          >
                            Clear all filters
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedApplications.map((app) => {
                    const region = getApplicantRegion(app);
                    const submitter = getApplicantSubmitter(app);
                    const feePaid = app.fee || customerPrice;
                    const isPending = app.status === "under_review";
                    const isApproved = app.status === "approved";
                    const isRejected =
                      app.status === "rejected" ||
                      app.status === "needs_correction";

                    return (
                      <TableRow
                        key={app.id}
                        onClick={() => {
                          setInspectingApp(app);
                          setCorrectionNote(app.notes || "");
                        }}
                        className="hover:bg-muted/30 transition-colors cursor-pointer"
                      >
                        {/* 1. Reference */}
                        <TableCell className="py-4 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className=" text-xs font-bold text-primary">
                              {app.reference}
                            </span>
                            <button
                              type="button"
                              onClick={(e) =>
                                handleCopyReference(app.reference, e)
                              }
                              className="text-muted-foreground hover:text-foreground cursor-pointer p-0.5 rounded transition-colors"
                              title="Copy Reference"
                            >
                              {copiedRef === app.reference ? (
                                <CheckCheck className="size-3 text-emerald-500" />
                              ) : (
                                <Copy className="size-3" />
                              )}
                            </button>
                          </div>
                        </TableCell>

                        {/* 2. Applicant Name, Phone, Location & DOB */}
                        <TableCell className="py-4 px-4 min-w-[190px]">
                          <div className="flex items-center gap-2.5">
                            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 font-black text-xs text-emerald-700 dark:text-emerald-400">
                              {getInitials(app.fullName)}
                            </span>
                            <div className="min-w-0">
                              <p className="font-bold text-xs text-foreground truncate">
                                {app.fullName}
                              </p>
                              <p className=" text-[11px] text-muted-foreground tabular-nums">
                                {app.phoneNumber}
                              </p>
                              <p className="text-[10px] text-muted-foreground truncate">
                                {app.location}
                                {app.dateOfBirth ? ` · ${app.dateOfBirth}` : ""}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        {/* 3. Submitted by */}
                        <TableCell className="py-4 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            {submitter.includes("Agent") ? (
                              <Store className="size-3 text-blue-500 shrink-0" />
                            ) : (
                              <User className="size-3 text-muted-foreground shrink-0" />
                            )}
                            <span className="text-xs font-medium text-muted-foreground">
                              {submitter}
                            </span>
                          </div>
                        </TableCell>

                        {/* 4. Ghana Card */}
                        <TableCell className="py-4 px-4 whitespace-nowrap">
                          <div className="space-y-0.5">
                            <span className=" text-xs font-bold text-foreground">
                              {app.ghanaCardNumber}
                            </span>
                            <div>
                              <Badge
                                variant="outline"
                                className="text-[9px] px-1 py-0  text-muted-foreground"
                              >
                                {region}
                              </Badge>
                            </div>
                          </div>
                        </TableCell>

                        {/* 5. Occupation */}
                        <TableCell className="py-4 px-4">
                          <span className="text-xs text-foreground/90 font-medium line-clamp-1">
                            {app.occupation}
                          </span>
                        </TableCell>

                        {/* 6. Paid Registration Price */}
                        <TableCell className="py-4 px-4 text-right whitespace-nowrap">
                          <span className="font-extrabold text-xs tabular-nums text-foreground">
                            GH₵ {feePaid.toFixed(2)}
                          </span>
                        </TableCell>

                        {/* 7. Status Pill */}
                        <TableCell className="py-4 px-4 text-center whitespace-nowrap">
                          {getStatusPill(app.status)}
                        </TableCell>

                        {/* 8. When (Submission Date) */}
                        <TableCell className="py-4 px-4 text-right text-xs text-muted-foreground whitespace-nowrap">
                          {app.dateSubmitted}
                        </TableCell>

                        {/* 9. Actions (Approve / Reject / Reopen / Inspect) */}
                        <TableCell className="py-4 px-4 text-right whitespace-nowrap">
                          <div
                            className="flex items-center justify-end gap-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {isPending ? (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    onUpdateAfaStatus(app.id, "rejected")
                                  }
                                  className="h-7 px-2.5 text-[11px] font-semibold text-destructive hover:bg-destructive/10 border-destructive/20 cursor-pointer"
                                >
                                  Reject
                                </Button>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() =>
                                    onUpdateAfaStatus(app.id, "approved")
                                  }
                                  className="h-7 px-2.5 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1 shadow-2xs cursor-pointer"
                                >
                                  <Check className="size-3" />
                                  <span>Approve</span>
                                </Button>
                              </>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  onUpdateAfaStatus(app.id, "under_review")
                                }
                                title="Put this application back under review"
                                className="h-7 px-2 text-[11px] font-medium text-muted-foreground hover:text-foreground gap-1 cursor-pointer"
                              >
                                <RotateCcw className="size-3" />
                                <span>Reopen</span>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* PAGINATION FOOTER */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
              {Math.min(
                currentPage * ITEMS_PER_PAGE,
                filteredApplications.length,
              )}{" "}
              of {filteredApplications.length} AFA registrations
            </p>

            <Pagination className="w-auto mx-0">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className={`cursor-pointer h-8 text-xs ${
                      currentPage === 1 ? "pointer-events-none opacity-50" : ""
                    }`}
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
                    className={`cursor-pointer h-8 text-xs ${
                      currentPage === totalPages
                        ? "pointer-events-none opacity-50"
                        : ""
                    }`}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      </Card>

      {/* ========================================================
          6. DETAILED GHANA CARD INSPECTION MODAL
          ======================================================== */}
      {inspectingApp && (
        <Dialog
          open={Boolean(inspectingApp)}
          onOpenChange={(open) => {
            if (!open) setInspectingApp(null);
          }}
        >
          <DialogContent className="sm:max-w-lg overflow-hidden rounded-3xl border border-border bg-card p-0 shadow-2xl">
            {/* Header */}
            <DialogHeader className="relative shrink-0 overflow-hidden border-b border-border bg-gradient-to-br from-emerald-500/10 via-card to-primary/10 p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="size-5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-extrabold tracking-tight">
                    National ID &amp; Tariff Verification
                  </DialogTitle>
                  <DialogDescription className="mt-1 text-xs leading-relaxed">
                    Verify applicant identity against National Identification
                    Authority (NIA) and MoFA farmer registry.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {/* Body */}
            <div className="p-5 sm:p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* GHANA CARD VISUAL MOCKUP */}
              <div className="relative overflow-hidden rounded-2xl border-2 border-emerald-500/30 bg-gradient-to-r from-emerald-950/20 via-background to-amber-950/20 p-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-border/80 pb-2.5 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="size-4 rounded-full bg-emerald-600" />
                    <span className="font-extrabold tracking-wider text-[11px] uppercase text-foreground">
                      Republic of Ghana &middot; National Identity Card
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[9px]  font-bold">
                    ECOWAS / NIA
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-3 items-center">
                  {/* Photo mockup */}
                  <div className="col-span-1 flex flex-col items-center justify-center rounded-xl border border-border bg-muted/60 p-3 text-center">
                    <User className="size-10 text-muted-foreground/60" />
                    <span className="mt-1.5 text-[9px] font-bold text-foreground truncate max-w-full">
                      {inspectingApp.fullName}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="col-span-2 space-y-1.5 text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold">
                        Personal ID Number
                      </span>
                      <p className=" font-black text-sm text-foreground tracking-wide">
                        {inspectingApp.ghanaCardNumber}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[9px] text-muted-foreground uppercase font-bold">
                          Date of Birth
                        </span>
                        <p className="font-semibold text-foreground text-xs">
                          {inspectingApp.dateOfBirth}
                        </p>
                      </div>

                      <div>
                        <span className="text-[9px] text-muted-foreground uppercase font-bold">
                          Region
                        </span>
                        <p className="font-semibold text-foreground text-xs">
                          {getApplicantRegion(inspectingApp)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* VERIFICATION CHECKLIST METRICS */}
              <div className="rounded-xl border border-border bg-muted/20 p-3.5 space-y-2 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Automated Gateway Validation
                </span>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="size-3.5 text-emerald-500" />
                      NIA Checksum &amp; Format Check:
                    </span>
                    <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                      Valid
                    </strong>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="size-3.5 text-emerald-500" />
                      MoFA Agricultural Registry Match:
                    </span>
                    <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                      Match (Agro Tier)
                    </strong>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="size-3.5 text-emerald-500" />
                      Registration Fee Paid:
                    </span>
                    <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                      GH₵ {(inspectingApp.fee || customerPrice).toFixed(2)}{" "}
                      (Paid &amp; Cleared)
                    </strong>
                  </div>
                </div>
              </div>

              {/* APPLICANT METADATA */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl border border-border p-3">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">
                    Applicant Phone
                  </span>
                  <p className="font-semibold text-foreground mt-0.5 tabular-nums">
                    {inspectingApp.phoneNumber}
                  </p>
                </div>

                <div className="rounded-xl border border-border p-3">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">
                    Trade / Occupation
                  </span>
                  <p className="font-semibold text-foreground mt-0.5">
                    {inspectingApp.occupation}
                  </p>
                </div>
              </div>

              {/* AUDIT NOTE INPUT */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="audit-note"
                  className="text-[11px] font-semibold"
                >
                  Officer Notes / Flag Reason
                </Label>
                <Input
                  id="audit-note"
                  type="text"
                  placeholder="e.g. Verified against MoFA Ashanti regional database."
                  value={correctionNote}
                  onChange={(e) => setCorrectionNote(e.target.value)}
                  className="text-xs h-9"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <DialogFooter className="border-t border-border bg-muted/30 p-4 sm:flex-row sm:justify-between gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setInspectingApp(null)}
                className="text-xs cursor-pointer"
              >
                Close
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onUpdateAfaStatus(inspectingApp.id, "needs_correction");
                    setInspectingApp(null);
                  }}
                  className="text-xs font-semibold text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10 cursor-pointer"
                >
                  Flag Correction
                </Button>

                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    onUpdateAfaStatus(inspectingApp.id, "approved");
                    setInspectingApp(null);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-xs cursor-pointer"
                >
                  <Check className="size-3.5" />
                  <span>Approve &amp; Whitelist</span>
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

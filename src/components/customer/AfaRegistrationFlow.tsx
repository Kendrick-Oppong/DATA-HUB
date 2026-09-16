import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  Briefcase,
  CheckCircle2,
  CheckCircle,
  CreditCard,
  FileText,
  MapPin,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  User,
  Wallet,
  ArrowRight,
} from "lucide-react";
import { AfaApplication } from "../../types";
import { SignalRail } from "../common/SignalRail";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Checkbox } from "../ui/checkbox";
import { ScrollArea } from "../ui/scroll-area";
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../ui/pagination";

interface AfaRegistrationFlowProps {
  walletBalance: number;
  onApplicationSubmitted: (app: AfaApplication) => void;
  applications: AfaApplication[];
}

const REGIONS = [
  "Greater Accra",
  "Ashanti",
  "Western",
  "Central",
  "Eastern",
  "Volta",
  "Northern",
  "Upper East",
  "Upper West",
  "Bono",
  "Bono East",
  "Ahafo",
  "Oti",
  "Savannah",
  "North East",
  "Western North",
];

const APPS_PER_PAGE = 5;
const AFA_FEE = 18.0;

// Date-time formatter (YYYY-MM-DD HH:mm)
const formatDateTime = (dateStr: string): string => {
  if (!dateStr) return "";

  const d = new Date(
    dateStr.includes("T") ? dateStr : dateStr.replace(" ", "T"),
  );

  if (isNaN(d.getTime())) return dateStr;

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const mins = String(d.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${mins}`;
};

export const AfaRegistrationFlow: React.FC<AfaRegistrationFlowProps> = ({
  walletBalance,
  onApplicationSubmitted,
  applications = [],
}) => {
  // ============================================================
  // SEARCH & FILTER STATE
  // ============================================================

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // ============================================================
  // MODAL FORM STATE
  // ============================================================

  const [showModal, setShowModal] = useState(false);

  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("0244192834");
  const [ghanaCard, setGhanaCard] = useState("GHA-728192834-1");
  const [location, setLocation] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [occupation, setOccupation] = useState("Agribusiness / Produce Retail");

  const [consent, setConsent] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<AfaApplication | null>(
    null,
  );

  const fee = AFA_FEE;
  const hasSufficientBalance = walletBalance >= fee;

  // ============================================================
  // RESET PAGINATION WHEN FILTERS CHANGE
  // ============================================================

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  // ============================================================
  // FILTER & SORT APPLICATIONS
  // ============================================================

  const filteredApps = applications
    .filter((app) => {
      const q = searchQuery.toLowerCase().trim();

      const matchesSearch =
        !q ||
        app.reference.toLowerCase().includes(q) ||
        app.phoneNumber.includes(q) ||
        app.fullName.toLowerCase().includes(q) ||
        app.occupation.toLowerCase().includes(q) ||
        app.ghanaCardNumber.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "all" || app.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort(
      (a, b) =>
        new Date(b.dateSubmitted).getTime() -
        new Date(a.dateSubmitted).getTime(),
    );

  const totalPages = Math.max(
    1,
    Math.ceil(filteredApps.length / APPS_PER_PAGE),
  );

  const paginatedApps = filteredApps.slice(
    (currentPage - 1) * APPS_PER_PAGE,
    currentPage * APPS_PER_PAGE,
  );

  const hasActiveFilters = searchQuery.trim() !== "" || statusFilter !== "all";

  // ============================================================
  // MODAL
  // ============================================================

  const handleOpenModal = () => {
    setSubmitError(null);
    setSubmitSuccess(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  // ============================================================
  // SUBMIT
  // ============================================================

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!consent) {
      setSubmitError(
        "Please accept the authorization and consent before submitting your application.",
      );
      return;
    }

    if (walletBalance < fee) {
      setSubmitError(
        `Insufficient wallet balance (GH₵ ${walletBalance.toFixed(
          2,
        )}). GH₵ ${fee.toFixed(2)} is required.`,
      );
      return;
    }

    if (!fullName.trim()) {
      setSubmitError("Please enter your full legal name.");
      return;
    }

    if (!phoneNumber.trim()) {
      setSubmitError("Please enter the Ghana phone number to register.");
      return;
    }

    if (!ghanaCard.trim()) {
      setSubmitError("Please enter your Ghana Card number.");
      return;
    }

    if (!location.trim()) {
      setSubmitError("Please enter your location.");
      return;
    }

    if (!dateOfBirth.trim()) {
      setSubmitError("Please enter your date of birth.");
      return;
    }

    if (!occupation.trim()) {
      setSubmitError("Please enter your primary trade or farming activity.");
      return;
    }

    const ref = `AFA-GH-${Math.floor(1000 + Math.random() * 9000)}`;

    const newApp: AfaApplication = {
      id: `afa-${Date.now()}`,
      reference: ref,
      fullName: fullName.trim(),
      phoneNumber: phoneNumber.trim(),
      ghanaCardNumber: ghanaCard.trim(),
      location: location.trim(),
      dateOfBirth: dateOfBirth.trim(),
      occupation: occupation.trim(),
      dateSubmitted: new Date().toISOString().replace("T", " ").slice(0, 16),
      status: "under_review",
      fee,
      notes:
        "Submitted to Ministry of Food and Agriculture database for telecom tariff whitelisting.",
    };

    onApplicationSubmitted(newApp);
    setSubmitSuccess(newApp);
  };

  // ============================================================
  // STATUS PILL (styled to match CustomerOrdersView's status pill)
  // ============================================================

  const getStatusPill = (status: AfaApplication["status"]) => {
    const config: Record<
      string,
      { dot: string; classes: string; label: string }
    > = {
      approved: {
        dot: "bg-emerald-500",
        classes: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
        label: "Approved",
      },
      under_review: {
        dot: "bg-amber-500",
        classes: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
        label: "Under Review",
      },
      needs_correction: {
        dot: "bg-blue-500",
        classes: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
        label: "Needs Correction",
      },
      rejected: {
        dot: "bg-red-500",
        classes: "bg-red-500/15 text-red-600 dark:text-red-400",
        label: "Rejected",
      },
    };

    const c = config[status] ?? {
      dot: "bg-muted-foreground/40",
      classes: "bg-muted text-muted-foreground",
      label: status,
    };

    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${c.classes}`}
      >
        <span className={`size-1.5 rounded-full ${c.dot}`} />
        {c.label}
      </span>
    );
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="space-y-6">
      {/* ========================================================
          PAGE HEADER
          ======================================================== */}

      <div className="flex flex-col items-start justify-between gap-4 border-b border-border pb-5 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10  dark:text-emerald-400">
              <ShieldCheck className="size-5" />
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider  dark:text-emerald-400">
                AFA Services
              </p>

              <h1 className="text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
                AFA Registration
              </h1>
            </div>
          </div>

          <p className="mt-2 max-w-2xl text-xs leading-relaxed text-muted-foreground">
            Agricultural & Rural Workers subsidized mobile tariff enrollment for
            MTN, Telecel, and AT.
          </p>
        </div>

        <Button onClick={handleOpenModal} className="h-9 shrink-0">
          <Plus className="size-4" />
          New AFA Registration
        </Button>
      </div>

      {/* ========================================================
          ELIGIBILITY BANNER
          ======================================================== */}

      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-emerald-500/8 p-5">
        <div className="absolute -right-10 -top-10 size-32 rounded-full bg-emerald-500/5" />

        <div className="relative">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10  dark:text-emerald-400">
              <ShieldCheck className="size-4" />
            </div>

            <div className="min-w-0">
              <h3 className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                Who is eligible for the AFA subsidized tariff?
              </h3>

              <p className="mt-1.5 max-w-4xl text-xs leading-relaxed text-emerald-950 dark:text-emerald-200">
                MTN AFA bundle offers heavily discounted voice & SMS for
                farmers, traders, drivers & professionals. Register → Verify
                (3-7 days) → Buy discounted packages. Dial *1848# to purchase.
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className="border-emerald-500/20 bg-background text-[10px] font-semibold text-emerald-700 dark:text-emerald-300"
                >
                  GH¢10 — 220min + 50SMS
                </Badge>

                <Badge
                  variant="outline"
                  className="border-emerald-500/20 bg-background text-[10px] font-semibold text-emerald-700 dark:text-emerald-300"
                >
                  GH¢10 — 160min + 50SMS + 150MB
                </Badge>

                <Badge
                  variant="outline"
                  className="border-emerald-500/20 bg-background text-[10px] font-semibold text-emerald-700 dark:text-emerald-300"
                >
                  Free — Unlimited AFA calls
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          SUBMISSIONS
          ======================================================== */}

      <Card className="border-border shadow-xs">
        <CardHeader className="border-b border-border pb-4">
          <div>
            <CardTitle className="text-base font-extrabold text-foreground">
              AFA Submissions & Enrollment Status
            </CardTitle>

            <CardDescription className="mt-1 text-xs">
              Track National ID verification and carrier whitelisting progress.
            </CardDescription>
          </div>
        </CardHeader>

        {/* ======================================================
            SEARCH & FILTER
            ====================================================== */}

        <div className="border-b border-border bg-muted/20 p-4">
          <div className="space-y-4">
            {/* Search */}
            <div className="space-y-1.5">
              <Label
                htmlFor="afa-search"
                className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
              >
                Search applications
              </Label>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  id="afa-search"
                  type="text"
                  placeholder="Reference, name, phone, occupation, or Ghana Card..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 bg-background pl-9 text-xs"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="rounded-xl border border-border bg-background p-3">
              <div className="mb-3 flex items-center gap-2">
                <SlidersHorizontal className="size-3.5 text-muted-foreground" />

                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Application filters
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Status */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="afa-status-filter"
                    className="text-[10px] font-semibold text-muted-foreground"
                  >
                    Status
                  </Label>

                  <Select
                    value={statusFilter}
                    onValueChange={(value) => setStatusFilter(value || "all")}
                  >
                    <SelectTrigger
                      id="afa-status-filter"
                      className="h-9 w-full text-xs"
                    >
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="under_review">Under review</SelectItem>
                      <SelectItem value="needs_correction">
                        Needs correction
                      </SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  {hasActiveFilters ? (
                    <>
                      <span className="size-1.5 rounded-full bg-primary" />
                      <span>Filters are currently active</span>
                    </>
                  ) : (
                    <>
                      <span className="size-1.5 rounded-full bg-muted-foreground/40" />
                      <span>Showing all applications</span>
                    </>
                  )}
                </div>

                {hasActiveFilters && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("");
                      setStatusFilter("all");
                    }}
                  >
                    Reset all filters
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================
            TABLE
            ====================================================== */}

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Number</TableHead>
                  <TableHead>Occupation</TableHead>
                  <TableHead>Ghana Card</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">When</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {paginatedApps.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-10 text-center text-muted-foreground"
                    >
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Search className="size-8 text-muted-foreground/40" />

                        <p className="text-sm font-bold text-foreground">
                          No AFA submissions found
                        </p>

                        <p className="text-xs text-muted-foreground">
                          {hasActiveFilters
                            ? "Try adjusting your search or status filter."
                            : "Click New AFA Registration to submit your first application."}
                        </p>

                        {hasActiveFilters && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSearchQuery("");
                              setStatusFilter("all");
                            }}
                            className="mt-2 text-xs"
                          >
                            Reset Filters
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedApps.map((app) => (
                    <TableRow key={app.id} className="hover:bg-muted/40">
                      <TableCell className="text-xs font-bold text-foreground">
                        {app.reference}
                      </TableCell>

                      <TableCell className="text-xs text-foreground">
                        {app.phoneNumber}
                      </TableCell>

                      <TableCell className="text-xs font-bold text-foreground">
                        {app.occupation}
                      </TableCell>

                      <TableCell className="text-xs text-foreground">
                        {app.ghanaCardNumber}
                      </TableCell>

                      <TableCell className="text-right text-xs font-black tabular-nums text-foreground">
                        GH₵ {app.fee.toFixed(2)}
                      </TableCell>

                      <TableCell className="text-center">
                        {getStatusPill(app.status)}
                      </TableCell>

                      <TableCell className="text-right text-xs tabular-nums text-foreground">
                        {formatDateTime(app.dateSubmitted)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* ====================================================
              PAGINATION
              ==================================================== */}

          <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs text-muted-foreground">
              Showing{" "}
              <span className="font-bold text-foreground">
                {filteredApps.length === 0
                  ? 0
                  : (currentPage - 1) * APPS_PER_PAGE + 1}
              </span>{" "}
              to{" "}
              <span className="font-bold text-foreground">
                {Math.min(currentPage * APPS_PER_PAGE, filteredApps.length)}
              </span>{" "}
              of{" "}
              <span className="font-bold text-foreground">
                {filteredApps.length}
              </span>{" "}
              submissions
            </span>

            {totalPages > 1 && (
              <Pagination className="m-0 w-auto justify-end">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className={
                        currentPage === 1
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ),
                  )}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      className={
                        currentPage === totalPages
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ========================================================
          AFA REGISTRATION DIALOG
          ======================================================== */}

      <Dialog
        open={showModal}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseModal();
          } else {
            setShowModal(true);
          }
        }}
      >
        <DialogContent className="flex h-[90vh] max-h-[90vh] sm:max-w-lg flex-col gap-0 overflow-hidden rounded-3xl border border-border bg-card p-0 shadow-2xl">
          {/* ====================================================
              DIALOG HEADER (fixed)
              ==================================================== */}

          <DialogHeader className="relative shrink-0 overflow-hidden border-b border-border bg-gradient-to-br from-primary/10 via-card to-amber-500/10 p-5 sm:p-6">
            <div className="absolute -right-12 -top-12 size-32 rounded-full bg-primary/5" />
            <div className="absolute -bottom-16 left-1/3 size-40 rounded-full bg-amber-500/5" />
            <div className="relative flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                  <ShieldCheck className="size-5" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <DialogTitle className="text-left text-base font-extrabold tracking-tight">
                      New AFA Subscriber Registration
                    </DialogTitle>

                    <Badge
                      variant="secondary"
                      className="border-emerald-500/20 bg-emerald-500/15 px-2 py-0 text-[10px] font-bold text-emerald-700 dark:text-emerald-400"
                    >
                      Subsidized Tariff
                    </Badge>
                  </div>

                  <DialogDescription className="mt-0.5 text-left text-xs">
                    Register a Ghana SIM card for the subsidized telecom scheme.
                  </DialogDescription>
                </div>
              </div>
            </div>
          </DialogHeader>

          {/* ====================================================
              SUCCESS STATE
              ==================================================== */}

          {submitSuccess ? (
            <>
              <ScrollArea className="min-h-0 flex-1 overflow-hidden">
                <div className="space-y-5 p-5 sm:p-6">
                  {/* Success Hero */}
                  <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-center">
                    <div className="absolute -right-12 -top-12 size-32 rounded-full bg-emerald-500/5" />

                    <div className="relative">
                      <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-500/10  dark:text-emerald-400">
                        <CheckCircle2 className="size-8" />
                      </div>

                      <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.16em]  dark:text-emerald-400">
                        Application received
                      </p>

                      <h3 className="mt-1 text-lg font-extrabold tracking-tight text-foreground">
                        AFA Application Submitted
                      </h3>

                      <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-muted-foreground">
                        Your application has been queued for NIA and MoFA
                        review. Keep your reference number for future enquiries.
                      </p>
                    </div>
                  </div>

                  {/* Reference */}
                  <div className="rounded-2xl border border-border bg-muted/20 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Application reference
                        </p>

                        <p className="mt-1 text-sm font-bold tracking-wide text-foreground">
                          {submitSuccess.reference}
                        </p>
                      </div>

                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary">
                        <FileText className="size-4" />
                      </div>
                    </div>
                  </div>

                  {/* Application details */}
                  <section>
                    <div className="mb-3">
                      <h3 className="text-xs font-bold text-foreground">
                        Application details
                      </h3>

                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        Information submitted with your application.
                      </p>
                    </div>

                    <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border">
                      {/* Applicant */}
                      <div className="flex min-h-12 items-center justify-between gap-4 px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <User className="size-3.5 text-muted-foreground" />

                          <span className="text-[12px] font-medium text-muted-foreground">
                            Applicant
                          </span>
                        </div>

                        <span className="max-w-[60%] text-right text-xs font-bold text-foreground">
                          {submitSuccess.fullName}
                        </span>
                      </div>

                      {/* Phone */}
                      <div className="flex min-h-12 items-center justify-between gap-4 px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Phone className="size-3.5 text-muted-foreground" />

                          <span className="text-[12px] font-medium text-muted-foreground">
                            Phone number
                          </span>
                        </div>

                        <span className="text-xs font-bold text-foreground">
                          {submitSuccess.phoneNumber}
                        </span>
                      </div>

                      {/* Ghana Card */}
                      <div className="flex min-h-12 items-center justify-between gap-4 px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <CreditCard className="size-3.5 text-muted-foreground" />

                          <span className="text-[12px] font-medium text-muted-foreground">
                            Ghana Card
                          </span>
                        </div>

                        <span className="text-xs text-foreground font-bold">
                          {submitSuccess.ghanaCardNumber}
                        </span>
                      </div>

                      {/* Location */}
                      <div className="flex min-h-12 items-center justify-between gap-4 px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <MapPin className="size-3.5 text-muted-foreground" />

                          <span className="text-[12px] font-medium text-muted-foreground">
                            Location
                          </span>
                        </div>

                        <span className="text-xs font-semibold text-foreground">
                          {submitSuccess.location}
                        </span>
                      </div>

                      {/* Date of Birth */}
                      <div className="flex min-h-12 items-center justify-between gap-4 px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Briefcase className="size-3.5 text-muted-foreground" />

                          <span className="text-[12px] font-medium text-muted-foreground">
                            Date of birth
                          </span>
                        </div>

                        <span className="text-xs font-semibold text-foreground">
                          {submitSuccess.dateOfBirth}
                        </span>
                      </div>

                      {/* Status */}
                      <div className="flex min-h-12 items-center justify-between gap-4 px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <ShieldCheck className="size-3.5 text-muted-foreground" />

                          <span className="text-[12px] font-medium text-muted-foreground">
                            Status
                          </span>
                        </div>

                        <Badge
                          variant="outline"
                          className="border-amber-500/20 bg-amber-500/10 text-[10px] font-bold uppercase text-amber-700 dark:text-amber-400"
                        >
                          <span className="mr-1.5 size-1.5 rounded-full bg-amber-500" />
                          Under review
                        </Badge>
                      </div>
                    </div>
                  </section>

                  {/* Review information */}
                  <div className="rounded-xl border border-border bg-muted/30 p-3.5">
                    <div className="flex items-start gap-2.5">
                      <SignalRail status="processing" size="sm" />

                      <div>
                        <p className="text-[11px] font-semibold text-foreground">
                          What happens next?
                        </p>

                        <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">
                          Your details will undergo identity and eligibility
                          verification before the SIM is submitted for telecom
                          tariff whitelisting.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Expected time */}
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5">
                    <div className="flex items-start gap-2.5">
                      <CheckCircle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />

                      <div>
                        <p className="text-[11px] font-semibold text-foreground">
                          Expected review time
                        </p>

                        <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">
                          Applications are typically reviewed within 24 to 48
                          hours. Approval is subject to NIA, MoFA, and carrier
                          verification.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>

              <div className="shrink-0 border-t border-border bg-card p-4 sm:px-6">
                <Button
                  onClick={() => setShowModal(false)}
                  size="lg"
                  className="h-12 w-full gap-2 rounded-xl text-sm font-bold shadow-md"
                >
                  Done & Return to Dashboard
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </>
          ) : (
            /* ==================================================
               REGISTRATION FORM
               ================================================== */

            <form
              onSubmit={handleSubmit}
              className="flex min-h-0 flex-1 flex-col"
            >
              <ScrollArea className="min-h-0 flex-1 overflow-hidden">
                <div className="space-y-6 p-5 sm:p-6">
                  {/* Error */}
                  {submitError && (
                    <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-rose-700 dark:text-rose-400">
                      <AlertCircle className="mt-0.5 size-4 shrink-0" />

                      <div className="min-w-0">
                        <p className="text-[11px] font-bold">
                          Unable to submit application
                        </p>

                        <p className="mt-0.5 text-[10px] leading-relaxed">
                          {submitError}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ==================================================
                      APPLICANT INFORMATION
                      ================================================== */}

                  <section>
                    <div className="mb-4 flex items-start gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <User className="size-4" />
                      </div>

                      <div>
                        <h3 className="text-xs font-bold text-foreground">
                          Applicant information
                        </h3>

                        <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">
                          Enter your legal identification and contact details.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {/* Full name */}
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="afa-fullname"
                          className="text-[11px] font-semibold"
                        >
                          Full legal name
                        </Label>

                        <Input
                          id="afa-fullname"
                          type="text"
                          required
                          placeholder="Enter your full name"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="h-10 text-xs"
                        />
                      </div>

                      {/* Phone */}
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="afa-phone"
                          className="text-[11px] font-semibold"
                        >
                          Phone number
                        </Label>

                        <Input
                          id="afa-phone"
                          type="tel"
                          required
                          placeholder="Enter your phone number"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="h-10 text-xs"
                        />
                      </div>

                      {/* Ghana Card */}
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="afa-card"
                          className="text-[11px] font-semibold"
                        >
                          Ghana Card number
                        </Label>

                        <Input
                          id="afa-card"
                          type="text"
                          required
                          placeholder="Enter Ghana Card number"
                          value={ghanaCard}
                          onChange={(e) => setGhanaCard(e.target.value)}
                          className="h-10 text-xs uppercase"
                        />
                      </div>

                      {/* Location */}
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="afa-location"
                          className="text-[11px] font-semibold"
                        >
                          Location
                        </Label>

                        <Input
                          id="afa-location"
                          type="text"
                          required
                          placeholder="Enter your location"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          className="h-10 text-xs"
                        />
                      </div>

                      {/* Date of Birth */}
                    </div>
                    <div className="space-y-1.5 w-full mt-4">
                      <Label
                        htmlFor="afa-dob"
                        className="text-[11px] font-semibold"
                      >
                        Date of birth
                      </Label>

                      <Input
                        id="afa-dob"
                        type="date"
                        required
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        className="h-10 W-full text-xs"
                      />
                    </div>
                  </section>

                  {/* ==================================================
                      AFA ELIGIBILITY
                      ================================================== */}

                  <section>
                    <div className="mb-4 flex items-start gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10  dark:text-emerald-400">
                        <Briefcase className="size-4" />
                      </div>

                      <div>
                        <h3 className="text-xs font-bold text-foreground">
                          AFA eligibility
                        </h3>

                        <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">
                          Tell us about your primary agricultural or related
                          activity.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label
                        htmlFor="afa-occupation"
                        className="text-[11px] font-semibold"
                      >
                        Occupation
                      </Label>

                      <Input
                        id="afa-occupation"
                        type="text"
                        required
                        placeholder="Enter your occupation"
                        value={occupation}
                        onChange={(e) => setOccupation(e.target.value)}
                        className="h-10 text-xs"
                      />

                      <p className="text-[10px] leading-relaxed text-muted-foreground">
                        Describe the main agricultural or related activity you
                        currently engage in.
                      </p>
                    </div>
                  </section>

                  {/* ==================================================
                      APPLICATION FEE
                      ================================================== */}

                  <section className="rounded-2xl border border-border bg-muted/20 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                          <Wallet className="size-4" />
                        </div>

                        <div>
                          <p className="text-xs font-bold text-foreground">
                            Registration fee
                          </p>

                          <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">
                            The application fee will be deducted from your Smart
                            Data Hub wallet.
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-base font-black tabular-nums text-foreground">
                          GH₵ {fee.toFixed(2)}
                        </p>

                        <p
                          className={`mt-0.5 text-[9px] font-semibold ${hasSufficientBalance
                              ? " dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
                            }`}
                        >
                          Wallet: GH₵ {walletBalance.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {!hasSufficientBalance && (
                      <div className="mt-3 flex items-center gap-2 border-t border-border pt-3 text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                        <AlertCircle className="size-3.5 shrink-0" />
                        Your wallet balance is insufficient for this
                        application.
                      </div>
                    )}
                  </section>

                  {/* ==================================================
                      CONSENT
                      ================================================== */}

                  <section className="rounded-2xl border border-border bg-muted/20 p-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="consentCheck"
                        checked={consent}
                        onCheckedChange={(checked) =>
                          setConsent(checked === true)
                        }
                        className="mt-0.5"
                      />

                      <div className="min-w-0">
                        <Label
                          htmlFor="consentCheck"
                          className="cursor-pointer text-[11px] font-semibold leading-relaxed text-foreground"
                        >
                          Authorization and consent
                        </Label>

                        <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
                          I authorize Smart Data Hub to submit this application
                          to the National Identification Authority (NIA),
                          Ministry of Food and Agriculture (MoFA), and relevant
                          telecom carrier databases for tariff eligibility and
                          whitelisting.
                        </p>
                      </div>
                    </div>
                  </section>
                </div>
              </ScrollArea>

              {/* ====================================================
                  FORM FOOTER (fixed)
                  ==================================================== */}

              <div className="shrink-0 border-t border-border bg-card p-4 sm:px-6">
                <Button
                  type="submit"
                  disabled={!consent || !hasSufficientBalance}
                  size="lg"
                  className="h-12 w-full gap-2 rounded-xl text-sm font-bold shadow-md"
                >
                  <span>Submit Application (GH₵ {fee.toFixed(2)})</span>
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </form>
          )}

          {/* ====================================================
              MODAL FOOTER
              ==================================================== */}

          <DialogFooter className="m-0 shrink-0 rounded-none border-t border-border bg-muted/30 px-5 py-3 sm:justify-center">
            <div className="flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground">
              <ShieldCheck className="size-4 shrink-0  dark:text-emerald-400" />

              <span className="text-[11px]">
                Secured by NIA & MoFA Verified Identity System
              </span>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

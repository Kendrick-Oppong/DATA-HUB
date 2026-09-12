import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Search,
  Plus,
  User,
  Phone,
  CreditCard,
  MapPin,
  Briefcase,
  FileText,
} from "lucide-react";
import { AfaApplication } from "../../types";
import { SignalRail } from "../common/SignalRail";
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
  const APPS_PER_PAGE = 5;

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Modal Form State
  const [showModal, setShowModal] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("0244192834");
  const [ghanaCard, setGhanaCard] = useState("GHA-728192834-1");
  const [region, setRegion] = useState("Greater Accra");
  const [occupation, setOccupation] = useState("Agribusiness / Produce Retail");
  const [consent, setConsent] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<AfaApplication | null>(
    null,
  );

  const fee = 50.0;

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  // Filter & Sort Applications (newest first)
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

  const handleOpenModal = () => {
    setSubmitError(null);
    setSubmitSuccess(null);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!consent) {
      setSubmitError(
        "Please check the authorization box to verify your Ghana Card.",
      );
      return;
    }
    if (walletBalance < fee) {
      setSubmitError(
        `Insufficient wallet balance (GH₵ ${walletBalance.toFixed(2)}). GH₵ 50.00 required.`,
      );
      return;
    }

    const ref = `AFA-GH-${Math.floor(1000 + Math.random() * 9000)}`;
    const newApp: AfaApplication = {
      id: `afa-${Date.now()}`,
      reference: ref,
      fullName: fullName.trim() || "Applicant",
      phoneNumber: phoneNumber.trim(),
      ghanaCardNumber: ghanaCard.trim(),
      region,
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

  const getStatusBadge = (status: AfaApplication["status"]) => {
    switch (status) {
      case "approved":
        return (
          <Badge
            variant="outline"
            className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-bold text-[10px] uppercase"
          >
            Approved
          </Badge>
        );
      case "under_review":
        return (
          <Badge
            variant="outline"
            className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20 font-bold text-[10px] uppercase"
          >
            Under Review
          </Badge>
        );
      case "needs_correction":
        return (
          <Badge
            variant="outline"
            className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/20 font-bold text-[10px] uppercase"
          >
            Needs Correction
          </Badge>
        );
      case "rejected":
        return (
          <Badge
            variant="outline"
            className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/20 font-bold text-[10px] uppercase"
          >
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="font-bold text-[10px] uppercase">
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
            <span>AFA Registration (Subsidized Telecom Tariff)</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Agricultural & Rural Workers subsidized mobile tariff enrollment for
            MTN, Telecel, and AT.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {" "}
          <Button
            onClick={handleOpenModal}
            size="sm"
            className="font-bold text-xs"
          >
            <Plus className="w-4 h-4 mr-1" />
            New AFA Registration
          </Button>
        </div>
      </div>

      {/* Eligibility Explainer Banner */}
      <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-950 dark:text-emerald-200 text-xs space-y-2">
        <h3 className="font-bold text-sm text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" />
          <span>Who is eligible for the AFA Subsidized Tariff?</span>
        </h3>
        <p className="leading-relaxed">
          Ghanaian citizens engaged in farming, agricultural commerce, food
          trading, farm logistics, or rural trades can register their Ghana SIM
          card. Once approved, you unlock special discounted monthly tariffs
          (e.g. 10GB for ~GH₵35).
        </p>
      </div>

      {/* ============ AFA SUBMISSIONS TABLE ============ */}
      <Card className="border-border shadow-xs">
        <CardHeader className="pb-3 border-b border-border">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <CardTitle className="text-base font-extrabold text-foreground flex items-center gap-2">
                <span>AFA Submissions & Enrollment Status</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Track National ID verification and carrier whitelisting
                progress.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search ref, number, occupation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 text-xs"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 w-36 text-xs">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="needs_correction">
                    Needs Correction
                  </SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
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
                    className="text-center py-10 text-muted-foreground"
                  >
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Search className="w-8 h-8 text-muted-foreground/40" />
                      <p className="text-sm font-bold text-foreground">
                        No AFA submissions found
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {searchQuery || statusFilter !== "all"
                          ? "Try adjusting your search query or status filter."
                          : "Click 'New AFA Registration' above to submit your first application."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedApps.map((app) => (
                  <TableRow key={app.id} className="hover:bg-muted/40">
                    <TableCell className="font-mono font-bold text-xs text-foreground">
                      {app.reference}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {app.phoneNumber}
                    </TableCell>
                    <TableCell className="font-bold text-xs text-foreground">
                      {app.occupation}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {app.ghanaCardNumber}
                    </TableCell>
                    <TableCell className="text-right font-black text-foreground tabular-nums text-xs">
                      GH₵ {app.fee.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(app.status)}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground tabular-nums">
                      {formatDateTime(app.dateSubmitted)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination Footer */}
          <div className="flex items-center justify-between gap-4 border-t border-border px-4 py-3">
            <span className="text-xs text-muted-foreground shrink-0">
              Showing{" "}
              <span className="font-bold text-foreground">
                {Math.min(currentPage * APPS_PER_PAGE, filteredApps.length) ===
                0
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
              <Pagination className="justify-end w-auto m-0">
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
                    (p) => (
                      <PaginationItem key={p}>
                        <PaginationLink
                          onClick={() => setCurrentPage(p)}
                          isActive={currentPage === p}
                          className="cursor-pointer"
                        >
                          {p}
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

      {/* ============ MODAL REGISTRATION FORM (SHADCN DIALOG) ============ */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-extrabold">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>New AFA Subscriber Registration</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Enroll a Ghana SIM card into the Ministry of Agriculture
              subsidized telecom scheme.
            </DialogDescription>
          </DialogHeader>

          {submitSuccess ? (
            <div className="py-4 space-y-4 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  AFA Application Submitted!
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Reference{" "}
                  <strong className=" font-bold text-foreground">
                    {submitSuccess.reference}
                  </strong>{" "}
                  has been queued for NIA / MoFA whitelisting.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-muted/40 border border-border text-xs text-left space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Applicant:</span>
                  <span className="font-bold text-foreground">
                    {submitSuccess.fullName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone Number:</span>
                  <span className=" font-bold text-foreground">
                    {submitSuccess.phoneNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ghana Card:</span>
                  <span className=" text-muted-foreground">
                    {submitSuccess.ghanaCardNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge
                    variant="outline"
                    className="bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold text-[10px] uppercase"
                  >
                    Under Review (24-48 hrs)
                  </Badge>
                </div>
              </div>

              <DialogFooter>
                <Button size="sm" onClick={() => setShowModal(false)}>
                  Done
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {submitError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-400 font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="afa-fullname">Full Legal Name</Label>
                  <Input
                    id="afa-fullname"
                    type="text"
                    required
                    placeholder="e.g. Kwame Mensah Addo"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="afa-phone">Ghana Phone Number</Label>
                  <Input
                    id="afa-phone"
                    type="tel"
                    required
                    placeholder="e.g. 0244192834"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className=""
                  />
                </div>

                <div className="space-y-2 mt-1">
                  <Label htmlFor="afa-card">Ghana Card Number</Label>
                  <Input
                    id="afa-card"
                    type="text"
                    required
                    placeholder="GHA-728192834-1"
                    value={ghanaCard}
                    onChange={(e) => setGhanaCard(e.target.value)}
                    className=""
                  />
                </div>

                <div className="space-y-2 mt-1">
                  <Label htmlFor="afa-region">Region of Residence</Label>
                  <Select value={region} onValueChange={setRegion}>
                    <SelectTrigger id="afa-region" className="w-full !h-10">
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      {REGIONS.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r} Region
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="afa-occupation">
                    Primary Trade / Farming Activity
                  </Label>
                  <Input
                    id="afa-occupation"
                    type="text"
                    required
                    placeholder="e.g. Cocoa / Maize Farming, Yam Wholesale Trader, Farm Logistics"
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                  />
                </div>
              </div>

              {/* Consent Checkbox */}
              <div className="pt-2 border-t border-border flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="consentCheck"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 rounded border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                />
                <label
                  htmlFor="consentCheck"
                  className="text-[11px] text-muted-foreground cursor-pointer select-none leading-tight"
                >
                  I authorize Smart Data Hub to submit this application to the
                  National Identification Authority (NIA) and Telecom Carrier
                  database for tariff whitelisting.
                </label>
              </div>

              <DialogFooter className="pt-2 flex flex-col sm:flex-row !justify-between items-center gap-3">
                <div className="text-left w-full sm:w-auto">
                  <span className="text-[10px] text-muted-foreground block">
                    Processing Fee:
                  </span>
                  <span className="text-sm font-black text-foreground tabular-nums">
                    GH₵ {fee.toFixed(2)}
                  </span>
                </div>
                <div className="flex gap-2 w-full sm:w-auto justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={!consent}>
                    Submit
                  </Button>
                </div>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

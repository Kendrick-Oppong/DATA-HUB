import React, { useState, useRef } from "react";
import {
  ShieldCheck,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  RotateCcw,
  Info,
  Search,
  SlidersHorizontal,
  Upload,
} from "lucide-react";
import { Button } from "../ui/button";
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
import { Badge } from "../ui/badge";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { ScrollArea } from "../ui/scroll-area";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { VerificationResult, VerificationSummary } from "../../types";
import {
  normalizePhoneNumber,
  validatePhoneNumber,
  verifyPhoneNumbers,
} from "../../mockVerificationData";

export const VerificationScreen: React.FC = () => {
  const [phoneNumbers, setPhoneNumbers] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [results, setResults] = useState<VerificationResult[]>([]);
  const [summary, setSummary] = useState<VerificationSummary | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [duplicateNumbers, setDuplicateNumbers] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "verified" | "unverified"
  >("all");

  const handlePhoneNumbersChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setPhoneNumbers(e.target.value);
    // Clear previous results when input changes
    if (results.length > 0) {
      setResults([]);
      setSummary(null);
      setValidationErrors([]);
      setDuplicateNumbers([]);
    }
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
        setValidationErrors(["Please upload a valid CSV file"]);
        return;
      }
      setCsvFile(file);
      parseCsvFile(file);
    }
  };

  const parseCsvFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line);
      setPhoneNumbers(lines.join("\n"));
      setCsvFile(file);
    };
    reader.readAsText(file);
  };

  const validateInput = (): boolean => {
    const errors: string[] = [];
    const duplicates: string[] = [];
    const numbers = phoneNumbers
      .split("\n")
      .map((n) => normalizePhoneNumber(n))
      .filter((n) => n);

    if (numbers.length === 0) {
      errors.push("Please enter at least one phone number");
      setValidationErrors(errors);
      return false;
    }

    if (numbers.length > 500) {
      errors.push("Maximum 500 numbers allowed per verification");
      setValidationErrors(errors);
      return false;
    }

    // Check for duplicates
    const seen = new Set<string>();
    numbers.forEach((num) => {
      if (seen.has(num)) {
        if (!duplicates.includes(num)) {
          duplicates.push(num);
        }
      } else {
        seen.add(num);
      }
    });

    if (duplicates.length > 0) {
      setDuplicateNumbers(duplicates);
    }

    // Check for invalid formats
    const invalidNumbers = numbers.filter((n) => !validatePhoneNumber(n));
    if (invalidNumbers.length > 0) {
      errors.push(
        `${invalidNumbers.length} invalid phone number format(s) detected. Ghana numbers should start with 0 followed by network prefix (24, 20, 54, 55, 59) and 7 more digits.`,
      );
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleVerify = () => {
    if (!validateInput()) {
      return;
    }

    const numbers = phoneNumbers
      .split("\n")
      .map((n) => normalizePhoneNumber(n))
      .filter((n) => n);

    setIsVerifying(true);
    setValidationErrors([]);

    // Simulate verification delay
    setTimeout(() => {
      const { results: verificationResults, summary: verificationSummary } =
        verifyPhoneNumbers(numbers);
      setResults(verificationResults);
      setSummary(verificationSummary);
      setIsVerifying(false);
    }, 1500);
  };

  const handleReset = () => {
    setPhoneNumbers("");
    setCsvFile(null);
    setResults([]);
    setSummary(null);
    setValidationErrors([]);
    setDuplicateNumbers([]);
    setSearchQuery("");
    setStatusFilter("all");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Filter results based on search and status
  const filteredResults = results.filter((result) => {
    const matchesSearch =
      searchQuery === "" ||
      result.phoneNumber.includes(searchQuery) ||
      (result.explanation &&
        result.explanation.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "verified" && result.status === "verified") ||
      (statusFilter === "unverified" && result.status === "unverified");

    return matchesSearch && matchesStatus;
  });

  const handleRemoveCsv = () => {
    setCsvFile(null);
    setPhoneNumbers("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "verified") {
      return (
        <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Verified
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/20">
          <XCircle className="w-3 h-3 mr-1" />
          Unverified
        </Badge>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col items-start gap-4 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-foreground">
            <ShieldCheck className="size-6 text-primary" />
            <span>MTN Recipient Verification</span>
          </h1>

          <p className="mt-0.5 text-xs text-muted-foreground">
            Verify multiple MTN recipient numbers for bundle eligibility
          </p>
        </div>
      </div>

      {/* Instructions */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-start gap-3">
          <Info className="size-4 text-primary shrink-0 mt-0.5" />
          <div className="text-xs">
            <strong className="text-foreground">How it works:</strong> Enter
            phone numbers (one per line) or upload a CSV file. Each number will
            be checked against the approved recipient list.
          </div>
        </div>
      </div>

      {/* Input Section */}
      <Card className="border-border shadow-xs">
        <CardHeader className="border-b border-border !pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base font-extrabold text-foreground">
                Enter Phone Numbers
              </CardTitle>

              <CardDescription className="mt-1 text-xs">
                One phone number per line, or upload a CSV file
              </CardDescription>
            </div>

            {phoneNumbers.trim() && (
              <Button
                size="lg"
                onClick={handleReset}
                disabled={isVerifying}
                className="text-xs font-bold shadow-sm cursor-pointer"
              >
                <RotateCcw className="size-4 stroke-3" />
                Reset
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-4 pt-0">
          {/* Text Area */}
          <div className="space-y-1.5">
            <Label
              htmlFor="phone-numbers"
              className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
            >
              Phone Numbers
            </Label>

            <ScrollArea className="h-[200px] w-full rounded-md border border-border">
              <Textarea
                id="phone-numbers"
                placeholder="0241234567&#10;0202345678&#10;0543456789"
                value={phoneNumbers}
                onChange={handlePhoneNumbersChange}
                disabled={isVerifying || results.length > 0}
                className="min-h-[200px] text-xs border-0 focus-visible:ring-0 resize-none"
              />
            </ScrollArea>
            <p className="text-[10px] text-muted-foreground">
              {phoneNumbers.split("\n").filter((n) => n.trim()).length} numbers
              entered
            </p>
          </div>

          {/* CSV Upload */}
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Or Upload CSV
            </Label>
            <div
              className={`relative rounded-xl border-2 border-dashed transition-all ${
                csvFile
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : "border-border bg-muted/20 hover:border-primary/30 hover:bg-muted/30"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleCsvUpload}
                disabled={isVerifying || results.length > 0}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center p-6 space-y-2">
                {csvFile ? (
                  <>
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                        {csvFile.name}
                      </span>
                    </div>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
                      File loaded successfully
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-semibold text-foreground">
                        Click to upload CSV
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        One phone number per line
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="size-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <ul className="list-disc list-inside space-y-1">
                    {validationErrors.map((error, idx) => (
                      <li key={idx}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Duplicate Warning */}
          {duplicateNumbers.length > 0 && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  {duplicateNumbers.length} duplicate number(s) detected:{" "}
                  {duplicateNumbers.slice(0, 5).join(", ")}
                  {duplicateNumbers.length > 5 && "..."}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Button
              size="lg"
              onClick={handleVerify}
              disabled={
                isVerifying ||
                !phoneNumbers.trim() ||
                results.length > 0 ||
                validationErrors.length > 0
              }
              className="text-xs font-bold shadow-sm"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 " />
                  Start Verification
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {results.length > 0 && summary && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Total Numbers
              </span>

              <div className="mt-1 text-3xl font-black tabular-nums text-foreground">
                {summary.totalNumbers}
              </div>

              <p className="mt-1 text-[11px] text-muted-foreground">
                Numbers submitted for verification
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Verified
              </span>

              <div className="mt-1 text-3xl font-black tabular-nums text-emerald-600 dark:text-emerald-400">
                {summary.verified}
              </div>

              <p className="mt-1 flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-3.5" />
                <span>Eligible for MTN bundles</span>
              </p>
            </div>

            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                Unverified
              </span>

              <div className="mt-1 text-3xl font-black tabular-nums text-rose-600 dark:text-rose-400">
                {summary.unverified}
              </div>

              <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400">
                Not eligible for MTN bundles
              </p>
            </div>
          </div>

          {/* Results Table */}
          <Card className="border-border shadow-xs">
            <CardHeader className="border-b border-border pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base font-extrabold text-foreground">
                    Verification Results
                  </CardTitle>

                  <CardDescription className="mt-1 text-xs">
                    Results for {results.length} phone numbers
                  </CardDescription>
                </div>

                {summary && summary.unverified > 0 && (
                  <Button size="lg">
                    <Upload className="w-3 h-3 mr-1" />
                    Submit Unverified
                  </Button>
                )}
              </div>
            </CardHeader>

            {/* Search + Filters */}
            <div className="border-b border-border bg-muted/20 p-4">
              <div className="space-y-4">
                {/* Search */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="verification-search"
                    className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
                  >
                    Search results
                  </Label>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                    <Input
                      id="verification-search"
                      type="text"
                      placeholder="Phone number or explanation..."
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
                      Verification filters
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-1">
                    {/* Status */}
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="verification-status"
                        className="text-[10px] font-semibold text-muted-foreground"
                      >
                        Verification status
                      </Label>

                      <Select
                        value={statusFilter}
                        onValueChange={(value) =>
                          setStatusFilter(value || "all")
                        }
                      >
                        <SelectTrigger
                          id="verification-status"
                          className="h-9 w-1/2 text-xs"
                        >
                          <SelectValue />
                        </SelectTrigger>

                        <SelectContent>
                          <SelectItem value="all">All statuses</SelectItem>

                          <SelectItem value="verified">Verified</SelectItem>

                          <SelectItem value="unverified">Unverified</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <CardContent className="p-0">
              <ScrollArea
                className={
                  filteredResults.length === 0 ? "h-auto" : "h-[400px]"
                }
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Phone Number</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Eligibility</TableHead>
                      <TableHead>Explanation</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {filteredResults.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="py-10 text-center text-muted-foreground"
                        >
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <Search className="size-8 text-muted-foreground/40" />

                            <p className="text-sm font-bold text-foreground">
                              No matching results found
                            </p>

                            <p className="text-xs text-muted-foreground">
                              Try adjusting your search or filters.
                            </p>

                            <Button
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
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredResults.map((result, idx) => (
                        <TableRow key={idx} className="hover:bg-muted/40">
                          <TableCell className="text-xs font-bold text-foreground">
                            {result.phoneNumber}
                          </TableCell>

                          <TableCell>{getStatusBadge(result.status)}</TableCell>

                          <TableCell>
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                                result.isEligible
                                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                                  : "bg-rose-500/15 text-rose-700 dark:text-rose-400"
                              }`}
                            >
                              <span
                                className={`size-1.5 rounded-full ${
                                  result.isEligible
                                    ? "bg-emerald-500"
                                    : "bg-rose-500"
                                }`}
                              />
                              {result.isEligible ? "Eligible" : "Not Eligible"}
                            </span>
                          </TableCell>

                          <TableCell className="text-xs text-muted-foreground">
                            {result.explanation}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>

              {/* Table Footer */}
              <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs text-muted-foreground">
                  Showing{" "}
                  <span className="font-bold text-foreground">
                    {filteredResults.length}
                  </span>{" "}
                  of {results.length} verification results
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="text-xs"
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Clear Results
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Empty State */}
      {results.length === 0 && !isVerifying && (
        <Card className="border-border shadow-xs">
          <CardContent className="p-10 text-center">
            <div className="flex flex-col items-center justify-center space-y-3">
              <ShieldCheck className="size-12 text-muted-foreground/40" />
              <p className="text-sm font-semibold text-foreground">
                No verification results yet
              </p>
              <p className="text-xs text-muted-foreground">
                Enter phone numbers or upload a CSV file to start verification
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

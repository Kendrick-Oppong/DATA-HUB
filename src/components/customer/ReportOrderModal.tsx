import React, { useState } from "react";
import {
  FlagTriangleRight,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  X,
  Loader2,
  Upload,
  Info,
  Calendar,
  Phone,
  Wifi,
  CreditCard,
  FileText,
} from "lucide-react";
import { Order } from "../../types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { ScrollArea } from "../ui/scroll-area";
import { Switch } from "../ui/switch";
import { Input } from "../ui/input";

interface ReportOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onReportSubmitted: (report: {
    orderId: string;
    orderReference: string;
    complaintType: string;
    attachScreenshots: boolean;
    mainPageScreenshot?: File;
    balancePageScreenshot?: File;
  }) => void;
}

const COMPLAINT_TYPES = [
  { value: "data_not_received", label: "Data not received" },
  { value: "wrong_amount_delivered", label: "Wrong amount delivered" },
  { value: "recipient_not_found", label: "Recipient not found" },
  { value: "duplicate_charge", label: "Duplicate charge" },
];

export const ReportOrderModal: React.FC<ReportOrderModalProps> = ({
  isOpen,
  onClose,
  order,
  onReportSubmitted,
}) => {
  const [complaintType, setComplaintType] = useState("");
  const [attachScreenshots, setAttachScreenshots] = useState(false);
  const [mainPageScreenshot, setMainPageScreenshot] = useState<File | null>(
    null,
  );
  const [balancePageScreenshot, setBalancePageScreenshot] =
    useState<File | null>(null);
  const [mainPagePreview, setMainPagePreview] = useState<string | null>(null);
  const [balancePagePreview, setBalancePagePreview] = useState<string | null>(
    null,
  );
  const [showMainPageSample, setShowMainPageSample] = useState(false);
  const [showDetailsPageSample, setShowDetailsPageSample] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || !complaintType) return;

    if (attachScreenshots && (!mainPageScreenshot || !balancePageScreenshot)) {
      return;
    }

    setIsSubmitting(true);

    // Simulate submission
    setTimeout(() => {
      onReportSubmitted({
        orderId: order.id,
        orderReference: order.reference,
        complaintType,
        attachScreenshots,
        mainPageScreenshot: mainPageScreenshot || undefined,
        balancePageScreenshot: balancePageScreenshot || undefined,
      });
      setIsSubmitting(false);
      setSubmitSuccess(true);
    }, 1500);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      // Reset form after close animation
      setTimeout(() => {
        setComplaintType("");
        setAttachScreenshots(false);
        setMainPageScreenshot(null);
        setBalancePageScreenshot(null);
        if (mainPagePreview) URL.revokeObjectURL(mainPagePreview);
        if (balancePagePreview) URL.revokeObjectURL(balancePagePreview);
        setMainPagePreview(null);
        setBalancePagePreview(null);
        setSubmitSuccess(false);
      }, 300);
    }
  };

  const handleMainPageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMainPageScreenshot(file);
      const previewUrl = URL.createObjectURL(file);
      setMainPagePreview(previewUrl);
    }
  };

  const handleBalancePageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBalancePageScreenshot(file);
      const previewUrl = URL.createObjectURL(file);
      setBalancePagePreview(previewUrl);
    }
  };

  const handleRemoveMainPage = () => {
    setMainPageScreenshot(null);
    if (mainPagePreview) {
      URL.revokeObjectURL(mainPagePreview);
      setMainPagePreview(null);
    }
  };

  const handleRemoveBalancePage = () => {
    setBalancePageScreenshot(null);
    if (balancePagePreview) {
      URL.revokeObjectURL(balancePagePreview);
      setBalancePagePreview(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="flex h-[90vh] max-h-[90vh] sm:max-w-2xl flex-col gap-0 overflow-hidden rounded-3xl border border-border bg-card p-0 shadow-2xl">
        {/* Header */}
        <DialogHeader className="relative shrink-0 border-b border-border bg-gradient-to-br from-rose-500/10 via-card to-amber-500/10 p-5 sm:p-6">
          <div className="absolute -right-12 -top-12 size-32 rounded-full bg-rose-500/5" />
          <div className="absolute -bottom-16 left-1/3 size-40 rounded-full bg-amber-500/5" />

          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-rose-500 text-white shadow-sm">
                <FlagTriangleRight className="size-5" />
              </div>

              <div className="min-w-0">
                <DialogTitle className="text-left text-base font-extrabold tracking-tight">
                  Report Order Issue
                </DialogTitle>

                {order && (
                  <p className="mt-0.5 text-left text-xs font-semibold text-muted-foreground">
                    Order #{order.reference}
                  </p>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Modal Body */}
        <ScrollArea className="min-h-0 flex-1 overflow-hidden">
          <div className="p-5 sm:p-6">
            {/* Success State */}
            {submitSuccess ? (
              <div className="space-y-5 px-2 py-8 text-center">
                <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="size-10 text-emerald-500" />
                </div>

                <div className="space-y-1">
                  <h4 className="text-xl font-extrabold text-foreground">
                    Complaint Submitted Successfully
                  </h4>

                  <p className="text-xs text-muted-foreground">
                    Your complaint has been logged and our support team will
                    review it within 24 hours. You'll receive updates via SMS
                    and email.
                  </p>
                </div>

                <Button
                  type="button"
                  onClick={handleClose}
                  size="lg"
                  className="h-12 w-full gap-2 rounded-xl text-sm font-bold shadow-md"
                >
                  Done & Return to Dashboard
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            ) : (
              /* Report Form */
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Order Details */}
                {order && (
                  <section className="rounded-2xl border border-border bg-muted/30 p-4">
                    <h3 className="mb-3 text-xs font-bold text-foreground">
                      Order Details
                    </h3>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <Calendar className="size-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">Date:</span>
                        <span className="font-semibold text-foreground">
                          {order.date}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Phone className="size-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">Phone:</span>
                        <span className="font-semibold text-foreground">
                          {order.recipientPhone}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Wifi className="size-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">Bundle:</span>
                        <span className="font-semibold text-foreground">
                          {order.productName}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge
                          className={`text-[10px] font-black ${
                            order.network === "MTN"
                              ? "bg-amber-400 text-amber-950"
                              : order.network === "Telecel"
                                ? "bg-red-600 text-white"
                                : "bg-blue-600 text-white"
                          }`}
                        >
                          {order.network}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2">
                        <CreditCard className="size-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">Payment:</span>
                        <span className="font-semibold text-foreground">
                          {order.paymentMethod}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <FileText className="size-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">Ref:</span>
                        <span className="font-semibold text-foreground">
                          {order.reference}
                        </span>
                      </div>
                    </div>
                  </section>
                )}

                {/* Current Network Balance */}
                <section className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
                  <h3 className="mb-3 text-xs font-bold text-foreground">
                    Current Network Balance
                  </h3>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Current data balance:
                      </span>
                      <span className="font-semibold text-foreground">
                        0.00 GB
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Main account balance:
                      </span>
                      <span className="font-semibold text-foreground">
                        GH₵ 0.00
                      </span>
                    </div>

                    <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3">
                      <div className="flex items-start gap-2">
                        <Info className="mt-0.5 size-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                        <p className="text-[11px] leading-relaxed text-amber-900 dark:text-amber-300">
                          Delivery could not be confirmed from the current
                          balance. You can continue if you still believe there
                          is an issue.
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Complaint Type */}
                <section className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Complaint Type <span className="text-destructive">*</span>
                  </Label>

                  <Select
                    value={complaintType}
                    onValueChange={setComplaintType}
                  >
                    <SelectTrigger className="!h-11 w-full text-sm">
                      <SelectValue placeholder="Select complaint type..." />
                    </SelectTrigger>

                    <SelectContent>
                      {COMPLAINT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </section>

                {/* Attach Evidence Screenshots */}
                <section className="rounded-2xl border border-border bg-muted/20 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-foreground">
                        Attach Evidence Screenshots
                      </h3>

                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        Optional
                      </p>
                    </div>

                    <Switch
                      checked={attachScreenshots}
                      onCheckedChange={setAttachScreenshots}
                    />
                  </div>

                  <div className="mt-3 flex items-start gap-2 rounded-lg bg-muted/30 p-3">
                    <Info className="mt-0.5 size-3.5 shrink-0 text-primary" />
                    <p className="text-[10px] leading-relaxed text-muted-foreground">
                      Screenshots of the network app homepage and balance page
                      help speed up complaint processing.
                    </p>
                  </div>
                </section>

                {/* Screenshot Uploads */}
                {attachScreenshots && (
                  <>
                    {/* Requirement Notice */}
                    <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-rose-600 dark:text-rose-400" />
                        <div className="space-y-1">
                          <p className="text-[11px] font-semibold text-foreground">
                            Screenshot Requirements
                          </p>

                          <ul className="text-[10px] leading-relaxed text-rose-900 dark:text-rose-300">
                            <li>• Both screenshots are required</li>
                            <li>
                              • Screenshots must be uploaded from the network
                              provider's app, not the Datahub app
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Upload Fields */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {/* Network App Main Page */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-[11px] font-semibold text-foreground">
                            Network app main page
                          </Label>

                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-[10px] text-primary"
                            onClick={() => setShowMainPageSample(true)}
                          >
                            View Sample
                          </Button>
                        </div>

                        <div className="relative">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handleMainPageUpload}
                            className="hidden"
                            id="main-page-upload"
                          />

                          <label
                            htmlFor="main-page-upload"
                            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/20 p-1 h-full w-full transition-colors hover:border-primary/50 hover:bg-muted/30"
                          >
                            {mainPagePreview ? (
                              <div className="relative w-full">
                                <img
                                  src={mainPagePreview}
                                  alt="Main page screenshot"
                                  className="h-32 w-full rounded-lg object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleRemoveMainPage();
                                  }}
                                  className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-destructive text-white shadow-md hover:bg-destructive/90"
                                >
                                  <X className="size-3" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-2">
                                <Upload className="size-6 text-muted-foreground" />
                                <span className="text-[10px] text-muted-foreground">
                                  Main balance page
                                </span>
                              </div>
                            )}
                          </label>
                        </div>
                      </div>

                      {/* Balance Details Page */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-[11px] font-semibold text-foreground">
                            Balance details page
                          </Label>

                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-[10px] text-primary"
                            onClick={() => setShowDetailsPageSample(true)}
                          >
                            View Sample
                          </Button>
                        </div>

                        <div className="relative">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handleBalancePageUpload}
                            className="hidden"
                            id="balance-page-upload"
                          />

                          <label
                            htmlFor="balance-page-upload"
                            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/20 p-1 h-full w-full transition-colors hover:border-primary/50 hover:bg-muted/30"
                          >
                            {balancePagePreview ? (
                              <div className="relative w-full">
                                <img
                                  src={balancePagePreview}
                                  alt="Balance page screenshot"
                                  className="h-32 w-full rounded-lg object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleRemoveBalancePage();
                                  }}
                                  className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-destructive text-white shadow-md hover:bg-destructive/90"
                                >
                                  <X className="size-3" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-2">
                                <Upload className="size-6 text-muted-foreground" />
                                <span className="text-[10px] text-muted-foreground">
                                  Balance details page
                                </span>
                              </div>
                            )}
                          </label>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* What Happens Next */}
                <section className="rounded-2xl border border-border bg-muted/20 p-4">
                  <h3 className="mb-3 text-xs font-bold text-foreground">
                    What happens next?
                  </h3>

                  <ul className="space-y-2 text-xs text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
                      <span>
                        Your complaint will be reviewed within 24 hours
                      </span>
                    </li>

                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
                      <span>You'll receive updates via SMS and email</span>
                    </li>

                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
                      <span>
                        Our support team will work to resolve your issue
                      </span>
                    </li>
                  </ul>
                </section>
              </form>
            )}
          </div>
        </ScrollArea>

        {/* Fixed Action Button */}
        {!submitSuccess && (
          <div className="shrink-0 border-t border-border bg-card p-4 sm:px-6">
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={
                  !complaintType ||
                  (attachScreenshots &&
                    (!mainPageScreenshot || !balancePageScreenshot)) ||
                  isSubmitting
                }
                onClick={handleSubmit}
                className="flex-1 gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <span>Submit Complaint</span>
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>

      {/* Sample Image Modals */}
      <Dialog open={showMainPageSample} onOpenChange={setShowMainPageSample}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-center text-sm">Sample: Network App Main Page</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center">
            <img
              src="/src/assets/main-page.png"
              alt="Main page sample"
              className="max-h-[70vh] w-auto rounded-lg border border-border"
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showDetailsPageSample}
        onOpenChange={setShowDetailsPageSample}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-center text-sm">Sample: Balance Details Page</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center">
            <img
              src="/src/assets/details-page.png"
              alt="Details page sample"
              className="max-h-[70vh] w-auto rounded-lg border border-border"
            />
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

export default ReportOrderModal;

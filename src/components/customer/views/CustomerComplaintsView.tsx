import React, { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  FileText,
  Headphones,
  Inbox,
  MessageCircle,
  MessageSquareWarning,
  Plus,
  Send,
  Tag,
  User,
} from "lucide-react";
import { Complaint } from "../../../types";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import { Badge } from "../../ui/badge";
import { ScrollArea } from "../../ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";

interface CustomerComplaintsViewProps {
  complaints: Complaint[];
  onReplyComplaint: (ticketId: string, replyText: string) => void;
  onAddComplaint: (ticket: Complaint) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  delivery_delay: "Delivery Delay",
  failed_recharge: "Failed Recharge",
  momo_debit_no_credit: "MoMo Debit, No Credit",
  wrong_number: "Wrong Number",
  general: "General Help",
};

export const CustomerComplaintsView: React.FC<CustomerComplaintsViewProps> = ({
  complaints,
  onReplyComplaint,
  onAddComplaint,
}) => {
  const [selectedTicketId, setSelectedTicketId] = useState<string>(
    complaints[0]?.id || "",
  );
  const [newReplyText, setNewReplyText] = useState("");
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [ticketCategory, setTicketCategory] =
    useState<Complaint["category"]>("delivery_delay");
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketOrderRef, setTicketOrderRef] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");

  const selectedTicket =
    complaints.find((c) => c.id === selectedTicketId) || complaints[0];

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newReplyText.trim() || !selectedTicket) {
      return;
    }

    onReplyComplaint(selectedTicket.id, newReplyText.trim());
    setNewReplyText("");
  };

  const handleOpenNewTicket = () => {
    setShowNewTicketModal(true);
  };

  const handleCloseNewTicket = () => {
    setShowNewTicketModal(false);
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();

    if (!ticketSubject || !ticketMessage) {
      return;
    }

    const newTicket: Complaint = {
      id: `cmp-${Date.now()}`,
      ticketNumber: `TK-${Math.floor(10000 + Math.random() * 90000)}`,
      category: ticketCategory,
      subject: ticketSubject,
      orderReference: ticketOrderRef || undefined,
      status: "open",
      priority: "medium",
      createdAt: new Date().toISOString().replace("T", " ").slice(0, 16),
      lastUpdated: "Just now",
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: "customer",
          senderName: "You (Subscriber)",
          text: ticketMessage,
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
    setTicketCategory("delivery_delay");
  };

  // ============================================================
  // STATUS PILL
  // ============================================================

  const getStatusPill = (status: string) => {
    type StatusConfig = { dot: string; classes: string; label: string };

    const config: Record<string, StatusConfig> = {
      open: {
        dot: "bg-amber-500",
        classes: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
        label: "Open",
      },
      in_progress: {
        dot: "bg-blue-500",
        classes: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
        label: "In Progress",
      },
      resolved: {
        dot: "bg-emerald-500",
        classes: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
        label: "Resolved",
      },
      closed: {
        dot: "bg-muted-foreground/50",
        classes: "bg-muted text-muted-foreground",
        label: "Closed",
      },
    };

    const c = config[status] ?? {
      dot: "bg-muted-foreground/40",
      classes: "bg-muted text-muted-foreground",
      label: status,
    };

    return (
      <span
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${c.classes}`}
      >
        <span className={`size-1.5 rounded-full ${c.dot}`} />
        {c.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* ========================================================
          PAGE HEADER
          ======================================================== */}

      <div className="flex flex-col items-start justify-between gap-4 border-b border-border pb-5 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <MessageSquareWarning className="size-5" />
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Support Desk
              </p>

              <h1 className="text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
                Complaints & Support Tickets
              </h1>
            </div>
          </div>

          <p className="mt-2 max-w-2xl text-xs leading-relaxed text-muted-foreground">
            Direct communication with SDH Network Operations Center (NOC)
            engineers. We aim to respond within 24 hours.
          </p>
        </div>

        <Button onClick={handleOpenNewTicket} className="h-9 shrink-0">
          <Plus className="size-4" />
          New Ticket
        </Button>
      </div>

      {/* ========================================================
          MAIN GRID
          ======================================================== */}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* ======================================================
            SIDEBAR — TICKETS LIST
            ====================================================== */}

        <div className="space-y-3 lg:col-span-4">
          <div className="flex items-center justify-between px-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Your Tickets
            </span>

            {complaints.length > 0 && (
              <span className="text-[10px] font-semibold text-muted-foreground">
                {complaints.length} total
              </span>
            )}
          </div>

          {complaints.length === 0 ? (
            <div className="flex flex-col items-center justify-center space-y-2 rounded-2xl border border-dashed border-border bg-card p-8 text-center">
              <Inbox className="size-8 text-muted-foreground/40" />

              <p className="text-sm font-bold text-foreground">
                No tickets yet
              </p>

              <p className="text-xs text-muted-foreground">
                Open a new ticket if something needs our attention.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {complaints.map((complaint) => {
                const isSelected = selectedTicket?.id === complaint.id;

                return (
                  <button
                    key={complaint.id}
                    type="button"
                    onClick={() => setSelectedTicketId(complaint.id)}
                    className={`w-full rounded-2xl border p-3.5 text-left transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-xs ring-2 ring-primary/20"
                        : "border-border bg-card hover:bg-muted/40"
                    }`}
                  >
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-foreground">
                        {complaint.ticketNumber}
                      </span>

                      {getStatusPill(complaint.status)}
                    </div>

                    <div className="line-clamp-1 text-xs font-bold text-foreground">
                      {complaint.subject}
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-2">
                      <Badge
                        variant="outline"
                        className="border-border bg-muted/50 text-[9px] font-semibold text-muted-foreground"
                      >
                        {CATEGORY_LABELS[complaint.category] ??
                          complaint.category.replace("_", " ")}
                      </Badge>

                      <span className="shrink-0 text-[10px] text-muted-foreground">
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
            CONVERSATION THREAD
            ====================================================== */}

        <div className="lg:col-span-8">
          {selectedTicket ? (
            <div className="flex h-[560px] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
              {/* Thread header */}
              <div className="shrink-0 border-b border-border bg-muted/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-foreground">
                        {selectedTicket.ticketNumber}
                      </span>

                      {getStatusPill(selectedTicket.status)}
                    </div>

                    <h3 className="mt-1 truncate text-sm font-bold text-foreground">
                      {selectedTicket.subject}
                    </h3>

                    {selectedTicket.orderReference && (
                      <div className="mt-0.5 text-[11px] text-primary">
                        Order Ref: {selectedTicket.orderReference}
                      </div>
                    )}
                  </div>

                  <Badge
                    variant="outline"
                    className="shrink-0 border-primary/20 bg-primary/10 text-[10px] font-bold uppercase text-primary"
                  >
                    <Tag className="mr-1 size-3" />
                    {CATEGORY_LABELS[selectedTicket.category] ??
                      selectedTicket.category.replace("_", " ")}
                  </Badge>
                </div>
              </div>

              {/* Messages Feed */}
              <div className="flex-1 space-y-4 overflow-y-auto p-4">
                {selectedTicket.messages.map((message) => {
                  const isCustomer = message.sender === "customer";

                  return (
                    <div
                      key={message.id}
                      className={`flex items-end gap-2 ${
                        isCustomer ? "flex-row-reverse" : "flex-row"
                      }`}
                    >
                      <div
                        className={`flex size-7 shrink-0 items-center justify-center rounded-full ${
                          isCustomer
                            ? "bg-primary/10 text-primary"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {isCustomer ? (
                          <User className="size-3.5" />
                        ) : (
                          <Headphones className="size-3.5" />
                        )}
                      </div>

                      <div
                        className={`flex max-w-md flex-col ${
                          isCustomer ? "items-end" : "items-start"
                        }`}
                      >
                        <div className="mb-1 text-[10px] text-muted-foreground">
                          {message.senderName} &middot; {message.timestamp}
                        </div>

                        <div
                          className={`rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                            isCustomer
                              ? "rounded-tr-sm bg-primary text-primary-foreground"
                              : "rounded-tl-sm border border-border bg-muted text-foreground"
                          }`}
                        >
                          {message.text}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply Composer */}
              <form
                onSubmit={handleSendReply}
                className="flex shrink-0 gap-2 border-t border-border bg-muted/20 p-3"
              >
                <Input
                  type="text"
                  placeholder="Type a message to support..."
                  value={newReplyText}
                  onChange={(e) => setNewReplyText(e.target.value)}
                  className="h-10 flex-1 bg-background text-xs"
                />

                <Button
                  type="submit"
                  disabled={!newReplyText.trim()}
                  className="h-10 gap-1.5 text-xs"
                >
                  <Send className="size-3.5" />
                  Send
                </Button>
              </form>
            </div>
          ) : (
            <div className="flex h-[560px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card text-center">
              <MessageCircle className="size-8 text-muted-foreground/40" />

              <p className="text-sm font-bold text-foreground">
                No ticket selected
              </p>

              <p className="max-w-xs text-xs text-muted-foreground">
                Select a support ticket from the list to view the conversation.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================
          NEW TICKET DIALOG
          ======================================================== */}

      <Dialog
        open={showNewTicketModal}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseNewTicket();
          } else {
            setShowNewTicketModal(true);
          }
        }}
      >
        <DialogContent
          className="
            flex
            h-[90vh]
            max-h-[90vh]
            flex-col
            gap-0
            overflow-hidden
            p-0
            sm:max-w-lg
          "
        >
          {/* ====================================================
              DIALOG HEADER (fixed)
              ==================================================== */}

          <DialogHeader className="shrink-0 border-b border-border bg-gradient-to-br from-amber-500/10 via-card to-primary/5 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <MessageSquareWarning className="size-5" />
              </div>

              <div className="min-w-0">
                <DialogTitle className="text-base font-extrabold tracking-tight">
                  Open Support Complaint
                </DialogTitle>

                <DialogDescription className="mt-1 max-w-sm text-xs leading-relaxed">
                  Submit a new ticket to SDH NOC support. We'll respond within
                  24 hours.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* ====================================================
              FORM (scrollable)
              ==================================================== */}

          <form
            onSubmit={handleCreateTicket}
            className="flex min-h-0 flex-1 flex-col"
          >
            <ScrollArea className="min-h-0 flex-1 overflow-hidden">
              <div className="space-y-6 p-5 sm:p-6">
                {/* ================================================
                    ISSUE DETAILS
                    ================================================ */}

                <section>
                  <div className="mb-4 flex items-start gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Tag className="size-4" />
                    </div>

                    <div>
                      <h3 className="text-xs font-bold text-foreground">
                        Issue details
                      </h3>

                      <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">
                        Tell us what kind of problem you're reporting.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="ticket-category"
                        className="text-[11px] font-semibold"
                      >
                        Category
                      </Label>

                      <Select
                        value={ticketCategory}
                        onValueChange={(value) =>
                          setTicketCategory(value as Complaint["category"])
                        }
                      >
                        <SelectTrigger
                          id="ticket-category"
                          className="!h-10 w-full text-xs"
                        >
                          <SelectValue />
                        </SelectTrigger>

                        <SelectContent>
                          <SelectItem value="delivery_delay">
                            Delivery Delay
                          </SelectItem>

                          <SelectItem value="failed_recharge">
                            Failed Recharge / No SMS
                          </SelectItem>

                          <SelectItem value="momo_debit_no_credit">
                            MoMo Debited with No Credit
                          </SelectItem>

                          <SelectItem value="wrong_number">
                            Wrong Recipient Number
                          </SelectItem>

                          <SelectItem value="general">General Help</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label
                        htmlFor="ticket-order-ref"
                        className="text-[11px] font-semibold"
                      >
                        Related order reference{" "}
                        <span className="font-normal text-muted-foreground">
                          (optional)
                        </span>
                      </Label>

                      <Input
                        id="ticket-order-ref"
                        type="text"
                        placeholder="e.g. SDH-GH-2026-94812"
                        value={ticketOrderRef}
                        onChange={(e) => setTicketOrderRef(e.target.value)}
                        className="h-10 text-xs"
                      />

                      <p className="text-[10px] leading-relaxed text-muted-foreground">
                        Helps us pull up the transaction faster.
                      </p>
                    </div>
                  </div>
                </section>

                {/* ================================================
                    DESCRIPTION
                    ================================================ */}

                <section>
                  <div className="mb-4 flex items-start gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <FileText className="size-4" />
                    </div>

                    <div>
                      <h3 className="text-xs font-bold text-foreground">
                        Describe the issue
                      </h3>

                      <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">
                        The more detail you give, the faster we can help.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="ticket-subject"
                        className="text-[11px] font-semibold"
                      >
                        Subject
                      </Label>

                      <Input
                        id="ticket-subject"
                        type="text"
                        required
                        placeholder="Brief summary of your complaint"
                        value={ticketSubject}
                        onChange={(e) => setTicketSubject(e.target.value)}
                        className="h-10 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label
                        htmlFor="ticket-message"
                        className="text-[11px] font-semibold"
                      >
                        Detailed description
                      </Label>

                      <Textarea
                        id="ticket-message"
                        rows={5}
                        required
                        placeholder="Provide details of what happened, recipient phone, date..."
                        value={ticketMessage}
                        onChange={(e) => setTicketMessage(e.target.value)}
                        className="text-xs"
                      />

                      <p className="text-[10px] leading-relaxed text-muted-foreground">
                        Include the recipient number and approximate time, if
                        relevant.
                      </p>
                    </div>
                  </div>
                </section>

                {/* ================================================
                    RESPONSE TIME NOTE
                    ================================================ */}

                <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5">
                  <Clock3 className="mt-0.5 size-4 shrink-0 text-muted-foreground" />

                  <div>
                    <p className="text-[11px] font-semibold text-foreground">
                      Expected response time
                    </p>

                    <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">
                      NOC engineers typically respond within 24 hours. You'll be
                      notified as soon as there's an update.
                    </p>
                  </div>
                </div>
              </div>
            </ScrollArea>

            {/* ==================================================
                FORM FOOTER (fixed)
                ================================================== */}

            <DialogFooter className="shrink-0 border-t border-border bg-muted p-4 sm:p-5">
              <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseNewTicket}
                  className="flex-1 sm:flex-none"
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={!ticketSubject.trim() || !ticketMessage.trim()}
                  className="flex-1 gap-1.5 sm:flex-none"
                >
                  <CheckCircle2 className="size-4" />
                  Submit Ticket
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

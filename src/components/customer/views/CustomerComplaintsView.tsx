import React, { useState } from "react";
import { MessageSquareWarning, Plus, Send } from "lucide-react";
import { Complaint } from "../../../types";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-foreground">
            <MessageSquareWarning className="size-6 text-amber-600" />
            <span>Complaints & Support Tickets</span>
          </h1>

          <p className="mt-0.5 text-xs text-muted-foreground">
            Direct communication with SDH Network Operations Center (NOC)
            engineers.
          </p>
        </div>

        <Button
          onClick={() => setShowNewTicketModal(true)}
          className="rounded-xl px-4 py-2 text-xs font-bold shadow-xs cursor-pointer"
        >
          <Plus className="mr-1 size-4" />
          New Ticket
        </Button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Sidebar Tickets List */}
        <div className="space-y-2 lg:col-span-4">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Your Tickets
          </span>

          {complaints.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-6 text-center text-xs text-muted-foreground">
              No tickets submitted yet.
            </div>
          ) : (
            complaints.map((complaint) => (
              <div
                key={complaint.id}
                onClick={() => setSelectedTicketId(complaint.id)}
                className={`cursor-pointer rounded-2xl border p-3.5 transition-all ${
                  selectedTicket?.id === complaint.id
                    ? "border-primary bg-primary/10 shadow-xs ring-2 ring-primary/30"
                    : "border-border bg-card hover:bg-muted/40"
                }`}
              >
                <div className="mb-1 flex items-start justify-between">
                  <span className="font-mono text-[11px] font-bold text-foreground">
                    {complaint.ticketNumber}
                  </span>

                  <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-900 dark:text-amber-300">
                    {complaint.status.toUpperCase()}
                  </span>
                </div>

                <div className="line-clamp-1 text-xs font-bold text-foreground">
                  {complaint.subject}
                </div>

                <div className="mt-1 text-[10px] text-muted-foreground">
                  Updated {complaint.lastUpdated}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Selected Ticket Conversation Thread */}
        <div className="lg:col-span-8">
          {selectedTicket ? (
            <div className="flex h-[520px] flex-col space-y-4 rounded-2xl border border-border bg-card p-5 shadow-xs">
              <div className="flex items-start justify-between border-b border-border pb-3">
                <div>
                  <div className="font-mono text-xs text-muted-foreground">
                    {selectedTicket.ticketNumber}
                  </div>

                  <h3 className="text-sm font-bold text-foreground">
                    {selectedTicket.subject}
                  </h3>

                  {selectedTicket.orderReference && (
                    <div className="mt-0.5 font-mono text-[11px] text-primary">
                      Order Ref: {selectedTicket.orderReference}
                    </div>
                  )}
                </div>

                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                  {selectedTicket.category.replace("_", " ").toUpperCase()}
                </span>
              </div>

              {/* Messages Feed */}
              <div className="flex-1 space-y-3 overflow-y-auto p-2">
                {selectedTicket.messages.map((message) => {
                  const isCustomer = message.sender === "customer";

                  return (
                    <div
                      key={message.id}
                      className={`flex flex-col ${
                        isCustomer ? "items-end" : "items-start"
                      }`}
                    >
                      <div className="mb-1 text-[10px] text-muted-foreground">
                        {message.senderName} • {message.timestamp}
                      </div>

                      <div
                        className={`max-w-md rounded-2xl p-3 text-xs ${
                          isCustomer
                            ? "rounded-tr-xs bg-primary text-primary-foreground"
                            : "rounded-tl-xs border border-border bg-muted text-foreground"
                        }`}
                      >
                        {message.text}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply Composer */}
              <form
                onSubmit={handleSendReply}
                className="flex gap-2 border-t border-border pt-3"
              >
                <Input
                  type="text"
                  placeholder="Type a message to support..."
                  value={newReplyText}
                  onChange={(e) => setNewReplyText(e.target.value)}
                  className="flex-1 text-xs"
                />

                <Button type="submit" size="sm" className="text-xs">
                  <Send className="mr-1 size-3.5" />
                  Send
                </Button>
              </form>
            </div>
          ) : (
            <div className="flex h-[520px] items-center justify-center rounded-2xl border border-border bg-card text-xs text-muted-foreground">
              Select a support ticket to view conversation details.
            </div>
          )}
        </div>
      </div>

      {/* New Ticket Dialog Modal */}
      <Dialog
        open={showNewTicketModal}
        onOpenChange={setShowNewTicketModal}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Open Support Complaint</DialogTitle>

            <DialogDescription>
              Submit a new ticket to SDH NOC support. We'll respond within 24 hours.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
            <div className="space-y-2">
              <Label htmlFor="ticket-category">Category</Label>

              <Select
                value={ticketCategory}
                onValueChange={(value) =>
                  setTicketCategory(value as Complaint["category"])
                }
              >
                <SelectTrigger id="ticket-category" className="w-full">
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

            <div className="space-y-2">
              <Label htmlFor="ticket-order-ref">
                Related Order Reference (Optional)
              </Label>

              <Input
                id="ticket-order-ref"
                type="text"
                placeholder="e.g. SDH-GH-2026-94812"
                value={ticketOrderRef}
                onChange={(e) => setTicketOrderRef(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ticket-subject">Subject</Label>

              <Input
                id="ticket-subject"
                type="text"
                placeholder="Brief summary of your complaint"
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ticket-message">Detailed Description</Label>

              <Textarea
                id="ticket-message"
                rows={4}
                placeholder="Provide details of what happened, recipient phone, date..."
                value={ticketMessage}
                onChange={(e) => setTicketMessage(e.target.value)}
                required
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNewTicketModal(false)}
              >
                Cancel
              </Button>

              <Button type="submit">Submit Ticket</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

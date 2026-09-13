import React from "react";
import {
  MessageCircle,
  ArrowRight,
  Clock,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Textarea } from "../../ui/textarea";
import { Label } from "../../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { CONTACT_CATEGORIES } from "../constants";
import { PublicTabType } from "./PublicHomeSection";

interface PublicContactSectionProps {
  contactCategory: string;
  setContactCategory: (val: string) => void;
  contactMessage: string;
  setContactMessage: (val: string) => void;
  contactPhone: string;
  setContactPhone: (val: string) => void;
  contactSubmitted: boolean;
  setContactSubmitted: (val: boolean) => void;
  ticketRef: string;
  handleContactSubmit: (e: React.FormEvent) => void;
  onNavigatePublicTab: (tab: PublicTabType) => void;
}

export const PublicContactSection: React.FC<PublicContactSectionProps> = ({
  contactCategory,
  setContactCategory,
  contactMessage,
  setContactMessage,
  contactPhone,
  setContactPhone,
  contactSubmitted,
  setContactSubmitted,
  ticketRef,
  handleContactSubmit,
  onNavigatePublicTab,
}) => {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative isolate overflow-hidden border-b border-border bg-background">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_-10%,hsl(152_60%_40%/0.08),transparent)]" />
        <div className="max-w-[95%] mx-auto px-4 sm:px-6 py-14 sm:py-20 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/8 px-4 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-6">
            <MessageCircle className="size-3.5" />
            NOC Support desk · 24/7
          </div>
          <h1 className="text-5xl font-black leading-[0.95] tracking-tight text-foreground sm:text-6xl">
            Contact &<br />
            <span className="text-primary">NOC Support</span>
          </h1>
          <p className="mt-4 text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Issue with an order or payment? Our support engineers resolve
            tickets in real-time — most queries answered within 5 minutes.
          </p>
        </div>
      </section>

      {/* Contact channels + form */}
      <section className="max-w-[95%] mx-auto px-4 sm:px-6 py-12 w-full">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          {/* Left: contact channels */}
          <div className="space-y-4">
            {/* WhatsApp CTA */}
            <Button
              render={
                <a
                  href="https://wa.me/233244192834?text=Hello%20Smart%20Data%20Hub%20Support"
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
              variant="outline"
              className="h-auto w-full cursor-pointer group rounded-2xl p-0 text-left bg-card hover:bg-card hover:-translate-y-0.5 hover:shadow-lg transition-all"
            >
              <div className="flex w-full items-center gap-4 p-6">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-foreground/15">
                  <MessageCircle className="size-7" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="font-black text-md leading-tight text-foreground">
                    WhatsApp Priority Desk
                  </p>
                  <p className="text-sm text-foreground/85 mt-0.5">
                    +233 24 419 2834 · Live now
                  </p>
                  <p className="text-xs text-foreground/60 mt-1">
                    Fastest response channel — real agent, always
                  </p>
                </div>
                <ArrowRight className="size-5 shrink-0 group-hover:translate-x-1 transition-transform" />
              </div>
            </Button>

            {/* Operating hours */}
            <div className="rounded-2xl border border-border bg-card p-5 flex items-start gap-4">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                <Clock className="size-5 text-primary" />
              </div>
              <div>
                <p className="font-bold text-sm text-foreground">
                  Operating Hours
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  24 Hours / 7 Days a week — same desk handles calls and
                  WhatsApp
                </p>
              </div>
            </div>

            {/* Office details */}
            <div className="rounded-2xl border border-border bg-card p-5 flex items-start gap-4">
              <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 shrink-0">
                <MapPin className="size-5 text-amber-600" />
              </div>
              <div>
                <p className="font-bold text-sm text-foreground">
                  Accra NOC Desk
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Airport Residential Area, Accra, Ghana.
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                  Email:{" "}
                  <span className="text-foreground font-medium">
                    support@smartdatahub.com
                  </span>
                </p>
              </div>
            </div>

            {/* Quick links */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider mb-3">
                Before you reach out
              </p>
              <div className="space-y-2">
                {[
                  {
                    label: "Track your order status",
                    tab: "track" as const,
                  },
                  {
                    label: "Browse FAQs for quick answers",
                    tab: "faq" as const,
                  },
                ].map((link) => (
                  <Button
                    key={link.tab}
                    type="button"
                    variant="ghost"
                    onClick={() => onNavigatePublicTab(link.tab)}
                    className="h-auto w-full justify-between rounded-lg p-2 text-sm font-normal text-muted-foreground hover:bg-muted/50 hover:text-primary"
                  >
                    <span>{link.label}</span>
                    <ArrowRight className="size-3.5" />
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: support form */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-lg">
            <div className="border-b border-border px-6 py-5 bg-muted/20">
              <p className="text-xs font-bold uppercase text-primary tracking-wider">
                Support ticket
              </p>
              <h2 className="mt-0.5 text-xl font-black text-foreground">
                File a Support Request
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                NOC engineers respond within 5 minutes during operating
                hours.
              </p>
            </div>
            <div className="p-6">
              {contactSubmitted ? (
                <div className="py-10 flex flex-col items-center gap-4 text-center">
                  <div className="flex size-16 items-center justify-center rounded-full bg-emerald-500/15 ring-8 ring-emerald-500/5">
                    <CheckCircle2 className="size-9 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-foreground">
                      Support Ticket Submitted!
                    </h3>
                    <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                      Ticket{" "}
                      <strong className="text-foreground font-mono">
                        {ticketRef}
                      </strong>{" "}
                      has been opened. An NOC engineer will contact your
                      phone shortly.
                    </p>
                  </div>
                  <Button
                    className="font-bold mt-2"
                    onClick={() => setContactSubmitted(false)}
                  >
                    Send another message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-5">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                      Issue Category
                    </Label>
                    <Select
                      value={contactCategory}
                      onValueChange={setContactCategory}
                    >
                      <SelectTrigger className="!h-11 w-full rounded-xl">
                        <SelectValue placeholder="Select an issue category" />
                      </SelectTrigger>
                      <SelectContent>
                        {CONTACT_CATEGORIES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="contact-phone"
                      className="text-xs font-bold uppercase text-muted-foreground tracking-wider"
                    >
                      Your Mobile Phone Number
                    </Label>
                    <Input
                      id="contact-phone"
                      type="tel"
                      required
                      placeholder="e.g. 0244192834"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="h-11 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="contact-message"
                      className="text-xs font-bold uppercase text-muted-foreground tracking-wider"
                    >
                      Message Details
                    </Label>
                    <Textarea
                      id="contact-message"
                      rows={4}
                      required
                      placeholder="Describe your issue with order reference number..."
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      className="rounded-xl resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full font-bold h-11 rounded-xl"
                  >
                    Submit Support Ticket <ArrowRight className="size-4" />
                  </Button>
                  <p className="text-[10px] text-center text-muted-foreground">
                    We'll call or WhatsApp the number you provided above.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

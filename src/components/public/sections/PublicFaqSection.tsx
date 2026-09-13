import React, { useMemo } from "react";
import { MessageCircle, Search } from "lucide-react";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Input } from "../../ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../ui/accordion";
import { FAQS } from "../constants";
import { PublicTabType } from "./PublicHomeSection";

interface PublicFaqSectionProps {
  faqQuery: string;
  setFaqQuery: (query: string) => void;
  onNavigatePublicTab: (tab: PublicTabType) => void;
}

export const PublicFaqSection: React.FC<PublicFaqSectionProps> = ({
  faqQuery,
  setFaqQuery,
  onNavigatePublicTab,
}) => {
  const filteredFaqs = useMemo(() => {
    if (!faqQuery.trim()) return FAQS;
    const q = faqQuery.toLowerCase();
    return FAQS.filter(
      (f) =>
        f.q.toLowerCase().includes(q) ||
        f.a.toLowerCase().includes(q) ||
        f.tag.toLowerCase().includes(q),
    );
  }, [faqQuery]);

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative isolate overflow-hidden border-b border-border bg-background">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,hsl(var(--primary)/0.10),transparent)]" />
        <div className="max-w-[95%] mx-auto px-4 sm:px-6 py-14 sm:py-20 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-bold text-primary uppercase tracking-wider mb-6">
            <MessageCircle className="size-3.5" />
            Help & support
          </div>
          <h1 className="text-5xl font-black leading-[0.95] tracking-tight text-foreground sm:text-6xl">
            Frequently Asked
            <br />
            <span className="text-primary">Questions</span>
          </h1>
          <p className="mt-4 text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Everything about purchasing, delivery, vouchers, and reselling
            on Smart Data Hub. Can't find what you need? Chat us on
            WhatsApp.
          </p>
          <div className="relative max-w-md mx-auto mt-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={faqQuery}
              onChange={(e) => setFaqQuery(e.target.value)}
              placeholder="Search FAQs — e.g. refund, agent, voucher"
              className="pl-11 h-12 rounded-2xl border-border/80 bg-card shadow-sm text-sm"
            />
          </div>
        </div>
      </section>

      {/* FAQ content */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-12 w-full space-y-4">
        {/* Category pills */}
        <div className="flex flex-wrap gap-2 pb-2">
          {[
            "All",
            "Delivery",
            "Networks",
            "Payments",
            "Agents",
            "Vouchers",
            "AFA",
          ].map((tag) => {
            const isActive =
              (tag === "All" && !faqQuery) ||
              faqQuery.toLowerCase() === tag.toLowerCase();
            return (
              <Button
                key={tag}
                type="button"
                variant={isActive ? "default" : "outline"}
                onClick={() =>
                  setFaqQuery(tag === "All" ? "" : tag.toLowerCase())
                }
                className="rounded-full px-4 text-xs font-bold"
              >
                {tag}
              </Button>
            );
          })}
        </div>

        {filteredFaqs.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="size-12 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              No results for "{faqQuery}" —{" "}
              <Button
                type="button"
                variant="link"
                className="h-auto p-0 text-primary font-bold"
                onClick={() => onNavigatePublicTab("contact")}
              >
                chat us on WhatsApp instead
              </Button>
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFaqs.map((faq, idx) => (
              <div
                key={idx}
                className="group rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/30 transition-all"
              >
                <Accordion defaultValue={idx === 0 ? [`faq-${idx}`] : []}>
                  <AccordionItem value={`faq-${idx}`} className="border-0">
                    <AccordionTrigger className="px-5 py-4 text-left text-sm font-bold text-foreground gap-3 hover:no-underline">
                      <span className="flex items-center gap-3">
                        <Badge
                          variant="secondary"
                          className={`text-[10px] font-semibold shrink-0 rounded-full ${
                            faq.tag === "Delivery"
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                              : faq.tag === "Networks"
                                ? "bg-primary/10 text-primary"
                                : faq.tag === "Payments"
                                  ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                                  : faq.tag === "Agents"
                                    ? "bg-purple-500/10 text-purple-600"
                                    : faq.tag === "Vouchers"
                                      ? "bg-rose-500/10 text-rose-600"
                                      : "bg-cyan-500/10 text-cyan-600"
                          }`}
                        >
                          {faq.tag}
                        </Badge>
                        {faq.q}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="px-5 pb-5">
                      <div className="pl-0 text-sm text-muted-foreground leading-relaxed border-t border-border/60 pt-4 mt-1">
                        {faq.a}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-8 rounded-2xl border border-border bg-gradient-to-r from-primary/8 via-card to-amber-500/8 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-bold text-foreground">Still have questions?</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Our support engineers respond in real time via WhatsApp.
            </p>
          </div>
          <Button
            className="font-bold shrink-0"
            onClick={() => onNavigatePublicTab("contact")}
          >
            <MessageCircle className="size-4" /> Chat support
          </Button>
        </div>
      </section>
    </div>
  );
};

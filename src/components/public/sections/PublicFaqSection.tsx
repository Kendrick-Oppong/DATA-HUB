import React, { useMemo } from "react";
import { MessageCircle, Search, X } from "lucide-react";

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

const faqCategories = [
  "All",
  "Delivery",
  "Networks",
  "Payments",
  "Agents",
  "Vouchers",
  "AFA",
  "Airtime",
  "Utilities",
  "Tracking",
];

const faqTagStyles: Record<string, string> = {
  Delivery: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  Networks: "bg-primary/10 text-primary",
  Payments: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  Agents: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  Vouchers: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  AFA: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  Airtime: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  Utilities: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  Tracking: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
};

const defaultFaqTagStyle = "bg-muted text-muted-foreground";

export const PublicFaqSection: React.FC<PublicFaqSectionProps> = ({
  faqQuery,
  setFaqQuery,
  onNavigatePublicTab,
}) => {
  const filteredFaqs = useMemo(() => {
    const query = faqQuery.trim().toLowerCase();

    if (!query) {
      return FAQS;
    }

    return FAQS.filter(
      (faq) =>
        faq.q.toLowerCase().includes(query) ||
        faq.a.toLowerCase().includes(query) ||
        faq.tag.toLowerCase().includes(query),
    );
  }, [faqQuery]);

  const handleCategoryChange = (category: string) => {
    setFaqQuery(category === "All" ? "" : category.toLowerCase());
  };

  const isCategoryActive = (category: string) => {
    if (category === "All") {
      return !faqQuery;
    }

    return faqQuery.toLowerCase() === category.toLowerCase();
  };

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative isolate overflow-hidden border-b border-border bg-background">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,hsl(var(--primary)/0.10),transparent)]" />

        <div className="mx-auto max-w-[95%] px-4 py-14 text-center sm:px-6 sm:py-20">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary">
            <MessageCircle className="size-3.5" />
            Help & support
          </div>

          <h1 className="text-5xl font-black leading-[0.95] tracking-tight text-foreground sm:text-6xl">
            Frequently Asked
            <br />
            <span className="text-primary">Questions</span>
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
            Everything about purchasing, delivery, vouchers, and reselling on
            Smart Data Hub. Can't find what you need? Chat us on WhatsApp.
          </p>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-12">
        {/* Search & Categories */}
        <div className="mb-8 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={faqQuery}
              type="text"
              onChange={(event) => setFaqQuery(event.target.value)}
              placeholder="Search FAQs, e.g. refund, agent, voucher"
              className="h-12 rounded-2xl border-border/80 bg-card pl-11 pr-4 text-sm shadow-sm transition-shadow focus-visible:shadow-md"
            />

            {faqQuery && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => setFaqQuery("")}
                className="absolute right-2 top-1/2 h-auto -translate-y-1/2 rounded-full px-2 text-xs !bg-transparent hover:!bg-transparent"
              >
                <X className="text-destructive" strokeWidth={3} />
              </Button>
            )}
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap gap-2">
            {faqCategories.map((category) => {
              const isActive = isCategoryActive(category);

              return (
                <Button
                  key={category}
                  type="button"
                  variant={isActive ? "default" : "outline"}
                  onClick={() => handleCategoryChange(category)}
                  className="rounded-full px-4 text-xs font-bold"
                >
                  {category}
                </Button>
              );
            })}
          </div>

          {/* Result Count */}
          <div className="flex items-center justify-between px-1">
            <p className="text-xs text-muted-foreground">
              {filteredFaqs.length}{" "}
              {filteredFaqs.length === 1 ? "question" : "questions"}
            </p>
          </div>
        </div>

        {/* FAQ List */}
        {filteredFaqs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-14 text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10">
              <MessageCircle className="size-6 text-primary" />
            </div>

            <p className="text-sm font-semibold text-foreground">
              No matching questions
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              We couldn't find anything for "{faqQuery}".
            </p>

            <Button
              type="button"
              variant="link"
              className="mt-2 h-auto p-0 text-xs font-bold text-primary"
              onClick={() => onNavigatePublicTab("contact")}
            >
              Chat us on WhatsApp instead
            </Button>
          </div>
        ) : (
          <Accordion defaultValue={["faq-0"]} className="space-y-3">
            {filteredFaqs.map((faq, index) => {
              const tagStyle = faqTagStyles[faq.tag] ?? defaultFaqTagStyle;

              return (
                <AccordionItem
                  key={`${faq.tag}-${index}`}
                  value={`faq-${index}`}
                  className="group overflow-hidden rounded-2xl border border-border bg-card px-0 shadow-xs transition-all duration-200 hover:border-primary/30 hover:shadow-sm data-[state=open]:border-primary/30 data-[state=open]:shadow-sm"
                >
                  <AccordionTrigger className="gap-4 px-5 py-5 text-left hover:no-underline [&>svg]:size-4 [&>svg]:text-muted-foreground">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      {/* Question Number */}
                      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-[10px] font-bold tabular-nums text-muted-foreground transition-colors group-data-[state=open]:bg-primary/10 group-data-[state=open]:text-primary">
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="mb-2">
                          <Badge
                            variant="secondary"
                            className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${tagStyle}`}
                          >
                            {faq.tag}
                          </Badge>
                        </div>

                        <span className="block text-sm font-bold leading-relaxed text-foreground">
                          {faq.q}
                        </span>
                      </div>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="px-5 pb-5">
                    <div className="ml-10 border-l-2 border-primary/15 pl-4">
                      <p className="text-sm leading-7 text-muted-foreground">
                        {faq.a}
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}

        {/* CTA */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 rounded-2xl border border-border bg-gradient-to-r from-primary/8 via-card to-amber-500/8 p-6 sm:flex-row">
          <div>
            <p className="font-bold text-foreground">Still have questions?</p>

            <p className="mt-0.5 text-xs text-muted-foreground">
              Our support engineers respond in real time via WhatsApp.
            </p>
          </div>

          <Button
            className="shrink-0 font-bold"
            onClick={() => onNavigatePublicTab("contact")}
          >
            <MessageCircle className="size-4" />
            Chat support
          </Button>
        </div>
      </section>
    </div>
  );
};

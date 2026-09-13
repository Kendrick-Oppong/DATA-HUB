import React, { useMemo, useState } from "react";
import {
  BookOpen,
  Clock3,
  CreditCard,
  FileText,
  Search,
  Signal,
  Sparkles,
} from "lucide-react";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Badge } from "../../ui/badge";

interface Guide {
  title: string;
  category: string;
  readTime: string;
  content: string;
}

const GUIDES: Guide[] = [
  {
    title: "How to Authorize MTN Mobile Money USSD Prompts",
    category: "Mobile Money",
    readTime: "2 min",
    content:
      "If you do not receive the automatic pop-up on your phone after initiating checkout, dial *170#, select Option 6 (My Wallet), then Option 3 (My Approvals). Enter your MoMo PIN to complete payment.",
  },
  {
    title: "Retrieving WASSCE & BECE Result Checkers",
    category: "Vouchers & Placement",
    readTime: "1 min",
    content:
      "Once payment completes, your serial number and 12-digit PIN will appear immediately on your screen. You can also view past purchased PINs at any time under My Checker Orders.",
  },
  {
    title: "Configuring Non-Expiry SIM Data APN Settings",
    category: "Network & Data",
    readTime: "3 min",
    content:
      "For Telecel & MTN data bundles, ensure your Access Point Name (APN) is set to 'internet'. Restart your cellular data connection if data balances do not reflect immediately after delivery confirmation.",
  },
  {
    title: "Approving Telecel Cash Transactions",
    category: "Mobile Money",
    readTime: "2 min",
    content:
      "Dial *110# on Telecel SIM cards, choose Option 4 (My Account), then Option 4 (Pending Approvals). Confirm the transaction reference and enter your Telecel Cash PIN.",
  },
];

// ============================================================
// CATEGORY STYLING
// ============================================================

type CategoryConfig = {
  icon: React.ComponentType<{ className?: string }>;
  badgeClasses: string;
  iconWrapClasses: string;
};

const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  "Mobile Money": {
    icon: CreditCard,
    badgeClasses: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    iconWrapClasses: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  "Vouchers & Placement": {
    icon: FileText,
    badgeClasses: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    iconWrapClasses: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  "Network & Data": {
    icon: Signal,
    badgeClasses: "bg-primary/10 text-primary",
    iconWrapClasses: "bg-primary/10 text-primary",
  },
};

const DEFAULT_CATEGORY_CONFIG: CategoryConfig = {
  icon: Sparkles,
  badgeClasses: "bg-muted text-muted-foreground",
  iconWrapClasses: "bg-muted text-muted-foreground",
};

export const CustomerGuidesView: React.FC = () => {
  const [guideSearch, setGuideSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const categories = useMemo(
    () => Array.from(new Set(GUIDES.map((g) => g.category))),
    [],
  );

  const filteredGuides = GUIDES.filter((guide) => {
    const query = guideSearch.toLowerCase().trim();

    const matchesQuery =
      !query ||
      guide.title.toLowerCase().includes(query) ||
      guide.category.toLowerCase().includes(query) ||
      guide.content.toLowerCase().includes(query);

    const matchesCategory =
      activeCategory === "all" || guide.category === activeCategory;

    return matchesQuery && matchesCategory;
  });

  const hasActiveFilters =
    guideSearch.trim() !== "" || activeCategory !== "all";

  return (
    <div className="space-y-6">
      {/* ========================================================
          PAGE HEADER
          ======================================================== */}

      <div className="border-b border-border pb-5">
        <div className="flex items-center gap-2">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <BookOpen className="size-5" />
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
              Knowledge Base
            </p>

            <h1 className="text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
              How-to Guides & Tutorials
            </h1>
          </div>
        </div>

        <p className="mt-2 max-w-2xl text-xs leading-relaxed text-muted-foreground">
          Network codes, MoMo approvals, result checkers, and SIM settings —
          everything you need to self-serve, in one place.
        </p>
      </div>

      {/* ========================================================
          SEARCH & CATEGORY FILTERS
          ======================================================== */}

      <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label
              htmlFor="guide-search"
              className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
            >
              Search guides
            </Label>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                id="guide-search"
                type="text"
                placeholder="Search guides, topics, or instructions..."
                value={guideSearch}
                onChange={(e) => setGuideSearch(e.target.value)}
                className="h-10 bg-background pl-9 text-xs"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveCategory("all")}
              className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition-all ${
                activeCategory === "all"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "border border-border bg-background text-muted-foreground hover:bg-muted/50"
              }`}
            >
              All topics
            </button>

            {categories.map((category) => {
              const config =
                CATEGORY_CONFIG[category] ?? DEFAULT_CATEGORY_CONFIG;
              const Icon = config.icon;
              const isActive = activeCategory === category;

              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "border border-border bg-background text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  <Icon className="size-3.5" />
                  {category}
                </button>
              );
            })}

            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  setGuideSearch("");
                  setActiveCategory("all");
                }}
                className="ml-auto text-[11px] font-semibold text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================
          GUIDES GRID
          ======================================================== */}

      <div>
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {filteredGuides.length} guide
            {filteredGuides.length === 1 ? "" : "s"}
          </span>
        </div>

        {filteredGuides.length === 0 ? (
          <div className="flex flex-col items-center justify-center space-y-2 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <Search className="size-8 text-muted-foreground/40" />

            <p className="text-sm font-bold text-foreground">No guides found</p>

            <p className="text-xs text-muted-foreground">
              Try a different search term or clear your filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {filteredGuides.map((guide, index) => {
              const config =
                CATEGORY_CONFIG[guide.category] ?? DEFAULT_CATEGORY_CONFIG;
              const Icon = config.icon;

              return (
                <div
                  key={index}
                  className="group flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-xs transition-shadow hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${config.iconWrapClasses}`}
                    >
                      <Icon className="size-4" />
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground">
                      <Clock3 className="size-3" />
                      {guide.readTime} read
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Badge
                      variant="outline"
                      className={`border-transparent text-[9px] font-bold uppercase tracking-wider ${config.badgeClasses}`}
                    >
                      {guide.category}
                    </Badge>

                    <h3 className="text-sm font-bold leading-snug text-foreground">
                      {guide.title}
                    </h3>
                  </div>

                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {guide.content}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

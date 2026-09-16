import React, { useMemo, useState } from "react";
import {
  BookOpen,
  Clock3,
  CreditCard,
  FileText,
  Search,
  Signal,
  Sparkles,
  Store,
  TrendingUp,
  Wallet,
  Users,
  ShieldCheck,
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
    title: "Setting Up Your Storefront Branding",
    category: "Store Configuration",
    readTime: "3 min",
    content:
      "Customize your store name, logo, and color scheme to match your brand. Your storefront URL will be automatically generated based on your store handle.",
  },
  {
    title: "Understanding Tier Progress & Margins",
    category: "Commission & Earnings",
    readTime: "2 min",
    content:
      "Your tier determines the percentage of margin you earn on each order. Higher tiers unlock better rates. Track your progress in the analytics dashboard.",
  },
  {
    title: "Configuring Retail Prices vs Wholesale",
    category: "Pricing Strategy",
    readTime: "4 min",
    content:
      "Set custom retail prices for data bundles, checkers, and AFA registration. The difference between wholesale and retail is your profit margin.",
  },
  {
    title: "Withdrawing Commissions to Mobile Money",
    category: "Commission & Earnings",
    readTime: "2 min",
    content:
      "Commission payouts are processed to your registered MTN or Telecel Mobile Money number. Minimum withdrawal is GH₵ 50.00. Processing takes 24-48 hours.",
  },
  {
    title: "Sending Bulk SMS Campaigns",
    category: "Marketing",
    readTime: "3 min",
    content:
      "Create targeted SMS campaigns to your registered customers. Use the bulk SMS feature to announce promotions, new products, or seasonal offers.",
  },
  {
    title: "Tracking Store Orders & Delivery Status",
    category: "Store Operations",
    readTime: "2 min",
    content:
      "Monitor orders placed through your storefront in real-time. View delivery status, customer details, and track successful vs failed transactions.",
  },
  {
    title: "Managing Sender IDs for Bulk SMS",
    category: "Marketing",
    readTime: "3 min",
    content:
      "Register custom sender IDs to brand your SMS messages. Sender IDs must be approved by telecom operators before use in campaigns.",
  },
  {
    title: "Referral Program & Rewards",
    category: "Commission & Earnings",
    readTime: "2 min",
    content:
      "Share your unique referral code to earn bonuses when new agents sign up. Both you and the referred agent receive rewards after qualification.",
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
  "Store Configuration": {
    icon: Store,
    badgeClasses: "bg-teal-500/10 text-teal-700 dark:text-teal-400",
    iconWrapClasses: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  },
  "Commission & Earnings": {
    icon: Wallet,
    badgeClasses: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    iconWrapClasses: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  "Pricing Strategy": {
    icon: TrendingUp,
    badgeClasses: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
    iconWrapClasses: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  },
  "Marketing": {
    icon: Users,
    badgeClasses: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    iconWrapClasses: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  "Store Operations": {
    icon: ShieldCheck,
    badgeClasses: "bg-primary/10 text-primary",
    iconWrapClasses: "bg-primary/10 text-primary",
  },
};

const DEFAULT_CATEGORY_CONFIG: CategoryConfig = {
  icon: Sparkles,
  badgeClasses: "bg-muted text-muted-foreground",
  iconWrapClasses: "bg-muted text-muted-foreground",
};

export const AgentGuidesView: React.FC = () => {
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
              Agent Knowledge Base
            </p>

            <h1 className="text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
              How-to Guides & Tutorials
            </h1>
          </div>
        </div>

        <p className="mt-2 max-w-2xl text-xs leading-relaxed text-muted-foreground">
          Store setup, pricing strategy, commission withdrawals, bulk SMS,
          and referral program — everything you need to grow your reseller
          business.
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

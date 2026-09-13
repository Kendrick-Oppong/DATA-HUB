import React, { useState } from "react";
import { BookOpen, Search } from "lucide-react";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";

export const CustomerGuidesView: React.FC = () => {
  const [guideSearch, setGuideSearch] = useState("");

  const guides = [
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

  const filteredGuides = guides.filter((guide) => {
    const query = guideSearch.toLowerCase().trim();

    if (!query) {
      return true;
    }

    return (
      guide.title.toLowerCase().includes(query) ||
      guide.category.toLowerCase().includes(query) ||
      guide.content.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-border pb-4">
        <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-foreground">
          <BookOpen className="size-6 text-primary" />
          <span>How-to Guides & Ghana Telecom Tutorials</span>
        </h1>

        <p className="mt-0.5 text-xs text-muted-foreground">
          Knowledge base on network codes, MoMo approvals, result checkers, and SIM settings.
        </p>
      </div>

      <div className="space-y-4">
        {/* Search */}
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
              className="h-10 pl-9 text-xs"
            />
          </div>
        </div>

        {/* Guides Grid */}
        {filteredGuides.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center text-xs text-muted-foreground">
            No guides match your search criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {filteredGuides.map((guide, index) => (
              <div
                key={index}
                className="space-y-2 rounded-2xl border border-border bg-card p-5 shadow-2xs"
              >
                <div className="flex items-center justify-between text-[10px] font-bold uppercase text-primary">
                  <span>{guide.category}</span>

                  <span className="text-muted-foreground">
                    {guide.readTime} read
                  </span>
                </div>

                <h3 className="text-sm font-bold text-foreground">
                  {guide.title}
                </h3>

                <p className="text-xs leading-relaxed text-muted-foreground">
                  {guide.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

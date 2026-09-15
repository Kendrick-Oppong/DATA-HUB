import React, { useState } from "react";
import {
  Tag,
  Copy,
  Trash2,
  Plus,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  Percent,
  Check,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { PromoCode } from "../../../types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { ScrollArea } from "../../ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";

interface PromoCodeListProps {
  promoCodes: PromoCode[];
  onUpdate: (promoCodes: PromoCode[]) => void;
}

export const PromoCodeList: React.FC<PromoCodeListProps> = ({
  promoCodes,
  onUpdate,
}) => {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleToggle = (code: string) => {
    onUpdate(
      promoCodes.map((p) =>
        p.code === code ? { ...p, active: !p.active } : p,
      ),
    );
  };

  const handleDelete = (code: string) => {
    onUpdate(promoCodes.filter((p) => p.code !== code));
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-extrabold text-foreground">
            Discount Codes
          </h3>
          <p className="text-xs text-muted-foreground">
            Incentivize buyers with promotional coupons at checkout
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={() => setCreateModalOpen(true)}
          className="h-8 gap-1.5 rounded-xl font-bold text-xs cursor-pointer shadow-xs"
        >
          <Plus className="size-3.5 stroke-3" />
          <span>New Discount Code</span>
        </Button>
      </div>

      {promoCodes.length === 0 ? (
        <div className="p-8 rounded-2xl bg-muted/30 border border-border text-center space-y-3">
          <div className="size-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
            <Tag className="size-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground">
              No Discount Codes Created
            </h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-0.5">
              Offer limited-time discounts or seasonal campaigns like 10% off
              MTN or Telecel bundles.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            className="rounded-xl text-xs font-bold gap-1.5 cursor-pointer"
          >
            <Plus className="size-3.5" />
            <span>Create First Promo Code</span>
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {[...promoCodes].reverse().map((promo) => (
            <div
              key={promo.code}
              className="p-3.5 rounded-2xl border border-border bg-card flex items-center justify-between gap-3 shadow-2xs hover:border-primary/40 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => handleToggle(promo.code)}
                  className="shrink-0 cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
                  title={promo.active ? "Deactivate code" : "Activate code"}
                >
                  {promo.active ? (
                    <ToggleRight className="size-6 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <ToggleLeft className="size-6 text-muted-foreground" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-foreground text-xs tracking-wider">
                      {promo.code}
                    </span>
                    <Badge
                      variant="secondary"
                      className={`text-[10px] font-bold px-2 py-0 border ${
                        promo.type === "percent"
                          ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
                          : "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30"
                      }`}
                    >
                      {promo.type === "percent"
                        ? `${promo.value || 0}% Off`
                        : `GH₵${promo.value || 0} Off`}
                    </Badge>
                    {!promo.active && (
                      <span className="text-[10px] font-bold text-muted-foreground">
                        (Paused)
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                    Applies to:{" "}
                    {promo.scope === "all"
                      ? "All Bundles"
                      : (promo.scope || "all").toUpperCase()}
                    {promo.max && ` · Max ${promo.max} uses`}
                    {promo.uses !== undefined && ` · Used ${promo.uses} times`}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(promo.code)}
                  className="size-8 p-0 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                  title="Copy code"
                >
                  {copiedCode === promo.code ? (
                    <Check className="size-4 text-emerald-600" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(promo.code)}
                  className="size-8 p-0 rounded-lg text-muted-foreground hover:text-destructive cursor-pointer"
                  title="Delete code"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Promo Modal - WithdrawModal Fidelity Match */}
      {createModalOpen && (
        <CreatePromoModal
          onClose={() => setCreateModalOpen(false)}
          onCreate={(newPromo) => {
            onUpdate([...promoCodes, newPromo]);
            setCreateModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

interface CreatePromoModalProps {
  onClose: () => void;
  onCreate: (promo: PromoCode) => void;
}

const CreatePromoModal: React.FC<CreatePromoModalProps> = ({
  onClose,
  onCreate,
}) => {
  const [code, setCode] = useState("");
  const [type, setType] = useState<"percent" | "fixed">("percent");
  const [value, setValue] = useState("10");
  const [scope, setScope] = useState("all");
  const [max, setMax] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !value) return;

    onCreate({
      code: code.toUpperCase().trim(),
      type,
      value: Number.parseFloat(value) || 0,
      scope,
      uses: 0,
      max: max ? Number(max) : undefined,
      active: true,
    });
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex h-[90vh] max-h-[90vh] sm:max-w-lg flex-col gap-0 overflow-hidden rounded-3xl border border-border bg-card p-0 shadow-2xl">
        {/* Header - Identical to WithdrawModal */}
        <DialogHeader className="relative shrink-0 overflow-hidden border-b border-border bg-gradient-to-br from-primary/10 via-card to-amber-500/10 p-5 sm:p-6">
          <div className="absolute -right-12 -top-12 size-32 rounded-full bg-primary/5" />
          <div className="absolute -bottom-16 left-1/3 size-40 rounded-full bg-amber-500/5" />

          <div className="relative flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-amber-950 shadow-sm">
                <Tag className="size-5" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-left text-base font-extrabold tracking-tight">
                    Create Discount Code
                  </DialogTitle>

                  <Badge
                    variant="secondary"
                    className="border-amber-500/20 bg-amber-500/15 px-2 py-0 text-[10px] font-bold text-amber-700 dark:text-amber-400"
                  >
                    Merchant Promo
                  </Badge>
                </div>

                <DialogDescription className="mt-0.5 text-left text-xs">
                  Generate customer discount coupons with usage caps and carrier
                  filters
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Modal Body */}
        <ScrollArea className="min-h-0 flex-1 overflow-hidden">
          <form
            id="promo-form"
            onSubmit={handleSubmit}
            className="p-5 sm:p-6 space-y-5"
          >
            {/* Promo Code Input */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Coupon Code
              </Label>
              <Input
                type="text"
                value={code}
                onChange={(e) =>
                  setCode(
                    e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""),
                  )
                }
                placeholder="e.g. FLASH10 or MTNPROMO"
                className="h-11 rounded-xl text-xs font-extrabold uppercase tracking-wider"
                maxLength={14}
                required
              />
              <p className="text-[11px] text-muted-foreground">
                Letters and numbers only. Case insensitive at storefront
                checkout.
              </p>
            </div>

            {/* Discount Type Selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Discount Type
              </Label>
              <div className="flex gap-1.5 p-1 rounded-2xl bg-muted/60 border border-border/70">
                <button
                  type="button"
                  onClick={() => setType("percent")}
                  className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    type === "percent"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Percent className="size-3.5" />
                  <span>Percentage (%)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setType("fixed")}
                  className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    type === "fixed"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span>Fixed Cash (GH₵)</span>
                </button>
              </div>
            </div>

            {/* Value Input */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {type === "percent"
                  ? "Discount Percentage (%)"
                  : "Discount Amount (GH₵)"}
              </Label>
              <Input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                min="0.5"
                max={type === "percent" ? "100" : undefined}
                step={type === "percent" ? "1" : "0.5"}
                className="h-11 rounded-xl text-xs font-extrabold tabular-nums"
                required
              />
            </div>

            {/* Applicable Scope */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Eligible Products
              </Label>
              <Select
                value={scope}
                onValueChange={(value) => setScope(value || "all")}
              >
                <SelectTrigger className="!h-11 w-full rounded-xl">
                  <SelectValue placeholder="Select product scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All products</SelectItem>
                  <SelectItem value="mtn">MTN data</SelectItem>
                  <SelectItem value="telecel">Telecel data</SelectItem>
                  <SelectItem value="at">AT data</SelectItem>
                  <SelectItem value="airtime">Airtime</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Usage Limit Cap */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Total Redemptions Cap (Optional)
              </Label>
              <Input
                type="number"
                value={max}
                onChange={(e) => setMax(e.target.value)}
                min="1"
                placeholder="Leave blank for unlimited customer uses"
                className="h-11 rounded-xl text-xs font-medium tabular-nums"
              />
            </div>
          </form>
        </ScrollArea>

        {/* Fixed Action Button - Matches WithdrawModal */}
        <div className="shrink-0 border-t border-border bg-card p-4 sm:px-6">
          <div className="flex gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={onClose}
              className="flex-1 rounded-full text-xs font-bold cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="promo-form"
              size="lg"
              disabled={!code.trim() || !value}
              className="flex-1 gap-2 rounded-full text-xs font-bold shadow-md cursor-pointer"
            >
              <span>Save & Activate Code</span>
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>

        {/* Modal Footer - Identical to WithdrawModal */}
        <DialogFooter className="m-0 shrink-0 rounded-none border-t border-border bg-muted/30 px-5 py-3 sm:justify-center">
          <div className="flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground">
            <ShieldCheck className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span className="text-[11px]">
              Discounts are deducted directly from your retail margin at
              storefront checkout
            </span>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PromoCodeList;

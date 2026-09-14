import React, { useState } from "react";
import { Tag, Copy, Trash2, Plus, ToggleLeft, ToggleRight } from "lucide-react";
import { PromoCode } from "../../../types";

interface PromoCodeListProps {
  promoCodes: PromoCode[];
  onUpdate: (promoCodes: PromoCode[]) => void;
}

export const PromoCodeList: React.FC<PromoCodeListProps> = ({ promoCodes, onUpdate }) => {
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const handleToggle = (code: string) => {
    onUpdate(
      promoCodes.map((p) =>
        p.code === code ? { ...p, active: !p.active } : p
      )
    );
  };

  const handleDelete = (code: string) => {
    onUpdate(promoCodes.filter((p) => p.code !== code));
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-extrabold text-foreground">Discount codes</h3>
        <button
          type="button"
          onClick={() => setCreateModalOpen(true)}
          className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-[10px] font-bold flex items-center gap-1 cursor-pointer"
        >
          <Plus className="w-3 h-3" />
          <span>New code</span>
        </button>
      </div>

      {promoCodes.length === 0 ? (
        <div className="p-8 rounded-2xl bg-muted/30 border border-border text-center">
          <Tag className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-xs text-muted-foreground">No discount codes yet</p>
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="mt-3 text-xs font-bold text-primary hover:underline cursor-pointer"
          >
            Create your first code
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {promoCodes.map((promo) => (
            <div
              key={promo.code}
              className="p-3 rounded-xl border border-border bg-card flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => handleToggle(promo.code)}
                  className="shrink-0 cursor-pointer"
                >
                  {promo.active ? (
                    <ToggleRight className="w-5 h-5 text-primary" />
                  ) : (
                    <ToggleLeft className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground font-mono text-xs">
                      {promo.code}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                      promo.type === 'percent' ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300' : 'bg-blue-500/15 text-blue-700 dark:text-blue-300'
                    }`}>
                      {promo.type === 'percent' ? `${promo.value}%` : `GH₵${promo.value}`}
                    </span>
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    {promo.scope === 'all' ? 'All products' : promo.scope}
                    {promo.max && ` • Max ${promo.max} uses`}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleCopy(promo.code)}
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground cursor-pointer"
                  title="Copy code"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(promo.code)}
                  className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive cursor-pointer"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

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

const CreatePromoModal: React.FC<CreatePromoModalProps> = ({ onClose, onCreate }) => {
  const [code, setCode] = useState("");
  const [type, setType] = useState<"percent" | "fixed">("percent");
  const [value, setValue] = useState("10");
  const [scope, setScope] = useState("all");
  const [max, setMax] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !value) return;

    onCreate({
      code: code.toUpperCase(),
      type,
      value: Number.parseFloat(value),
      scope,
      uses: 0,
      max: max ? Number(max) : undefined,
      active: true,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-card border border-border shadow-xl p-6">
        <h3 className="text-sm font-extrabold text-foreground mb-4">Create discount code</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1.5 block">Code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
              placeholder="e.g. WELCOME10"
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-xs font-mono uppercase"
              maxLength={12}
            />
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1.5 block">Discount type</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType("percent")}
                className={`flex-1 px-3 py-2 rounded-lg border text-xs font-bold ${
                  type === "percent"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground"
                }`}
              >
                Percentage
              </button>
              <button
                type="button"
                onClick={() => setType("fixed")}
                className={`flex-1 px-3 py-2 rounded-lg border text-xs font-bold ${
                  type === "fixed"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground"
                }`}
              >
                Fixed amount
              </button>
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1.5 block">
              {type === "percent" ? "Discount percentage" : "Discount amount (GH₵)"}
            </label>
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              min="0"
              max={type === "percent" ? "100" : undefined}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-xs font-mono"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1.5 block">Applies to</label>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-xs"
            >
              <option value="all">All products</option>
              <option value="mtn">MTN only</option>
              <option value="telecel">Telecel only</option>
              <option value="atigo">AirtelTigo only</option>
              <option value="airtime">Airtime only</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1.5 block">Usage limit (optional)</label>
            <input
              type="number"
              value={max}
              onChange={(e) => setMax(e.target.value)}
              min="1"
              placeholder="Leave blank for unlimited"
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-xs font-mono"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-border bg-card text-foreground text-xs font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold cursor-pointer"
            >
              Create code
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

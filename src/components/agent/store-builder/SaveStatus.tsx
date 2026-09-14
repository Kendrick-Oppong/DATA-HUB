import React from "react";
import { Check, Loader2 } from "lucide-react";

interface SaveStatusProps {
  state: "saving" | "saved" | null;
}

export const SaveStatus: React.FC<SaveStatusProps> = ({ state }) => {
  if (state !== "saving" && state !== "saved") return null;

  const saving = state === "saving";

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all"
      style={{
        color: saving ? "hsl(var(--muted-foreground))" : "hsl(var(--emerald-600))",
        background: saving ? "hsl(var(--muted))" : "hsl(var(--emerald-500/10))",
        border: `1px solid ${saving ? "hsl(var(--border))" : "hsl(var(--emerald-500/30))"}`,
      }}
    >
      {saving ? (
        <>
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>Saving…</span>
        </>
      ) : (
        <>
          <Check className="w-3.5 h-3.5 text-emerald-600" strokeWidth={3} />
          <span>Saved</span>
        </>
      )}
    </span>
  );
};

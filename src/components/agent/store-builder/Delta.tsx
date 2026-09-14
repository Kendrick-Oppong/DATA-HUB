import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface DeltaProps {
  now: number;
  prev: number;
}

export const Delta: React.FC<DeltaProps> = ({ now, prev }) => {
  const up = now >= prev;
  const pct = prev ? Math.round(Math.abs(now - prev) / prev * 100) : 0;

  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-bold"
      style={{ color: up ? "hsl(var(--emerald-600))" : "hsl(var(--destructive))" }}
    >
      {up ? (
        <TrendingUp className="w-3 h-3" />
      ) : (
        <TrendingDown className="w-3 h-3" />
      )}
      {pct}%
    </span>
  );
};

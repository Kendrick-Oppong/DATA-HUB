import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface SalesDataPoint {
  day: string;
  value: number;
}

interface SalesChartProps {
  data: SalesDataPoint[];
  title?: string;
  subtitle?: string;
}

export const SalesChart: React.FC<SalesChartProps> = ({
  data,
  title = "Sales this week",
  subtitle = "GH₵ value moved",
}) => {
  const maxValue = Math.max(...data.map((d) => d.value));
  const totalValue = data.reduce((acc, d) => acc + d.value, 0);

  return (
    <Card className="border-border shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-bold text-foreground">{title}</CardTitle>
        <span className="text-xs font-semibold text-muted-foreground">{subtitle}</span>
      </CardHeader>
      <CardContent>
        <div className="h-44 w-full flex items-end justify-between gap-2 pt-4 px-2">
          {data.map((point, i) => {
            const heightPercent = maxValue > 0 ? (point.value / maxValue) * 100 : 0;
            const isPeak = point.value === maxValue;

            return (
              <div
                key={i}
                className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end"
              >
                <span className="text-[10px] font-mono text-muted-foreground tabular-nums">
                  GH₵{point.value}
                </span>
                <div
                  style={{ height: `${heightPercent}%` }}
                  className={`w-full max-w-[36px] rounded-t-lg transition-all hover:opacity-80 relative group ${
                    isPeak ? "bg-primary" : "bg-primary/60"
                  }`}
                >
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-[9px] px-1.5 py-0.5 rounded font-bold whitespace-nowrap transition-opacity pointer-events-none">
                    GH₵{point.value}
                  </div>
                </div>
                <span className="text-[10px] font-bold text-muted-foreground">
                  {point.day}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

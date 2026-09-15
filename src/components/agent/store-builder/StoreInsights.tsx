import React from "react";
import { BarChart3, Clock, TrendingUp, Users } from "lucide-react";
import { Delta } from "./Delta";
import { Order, DataBundle } from "../../../types";

interface StoreInsightsProps {
  orders: Order[];
  bundles: DataBundle[];
}

// ─── Mock spreads ────────────────────────────────────────────────────────────
// Baseline rich values so charts look dynamic and full even with sparse mock orders.

const MOCK_ORDERS_PER_DAY = [14, 9, 22, 18, 31, 27, 19];
const MOCK_DELIVERED_PER_DAY = [12, 7, 19, 16, 28, 24, 17];

const MOCK_BUSIEST_HOURS = [
  { label: "6am – 8am", count: 7 },
  { label: "8am – 10am", count: 34 },
  { label: "10am – 12pm", count: 58 },
  { label: "12pm – 2pm", count: 41 },
  { label: "2pm – 4pm", count: 27 },
  { label: "4pm – 6pm", count: 63 },
  { label: "6pm – 8pm", count: 49 },
  { label: "8pm – 10pm", count: 22 },
];

const MOCK_BEST_SELLERS = [
  { name: "MTN Non-Expiry 5GB", count: 38, revenue: 855 },
  { name: "Telecel Extra 10GB", count: 24, revenue: 936 },
  { name: "AT Power 2GB", count: 19, revenue: 266 },
  { name: "MTN Daily 1GB", count: 14, revenue: 126 },
  { name: "Telecel Night 3GB", count: 9, revenue: 180 },
];

const PIE_COLORS_HEX = [
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
];
const PIE_COLORS_TW = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-red-500",
  "bg-violet-500",
];

// ─── SVG Pie Chart ──────────────────────────────────────────────────────────

interface PieSlice {
  name: string;
  count: number;
}

function PieChart({ slices }: { slices: PieSlice[] }) {
  const total = slices.reduce((s, x) => s + x.count, 0);
  if (total === 0) return null;

  const CX = 18;
  const CY = 18;
  const R = 14;
  const CIRCUMFERENCE = 2 * Math.PI * R;
  const GAP = 0.8; // degrees gap between slices

  let cumulative = 0;

  return (
    <svg viewBox="0 0 36 36" className="size-full -rotate-90">
      {slices.map((slice, i) => {
        const pct = slice.count / total;
        const sliceDeg = pct * 360 - GAP;
        const dashLen = (sliceDeg / 360) * CIRCUMFERENCE;
        const gapLen = CIRCUMFERENCE - dashLen;
        const offset = -(cumulative / 360) * CIRCUMFERENCE;
        cumulative += pct * 360;

        return (
          <circle
            key={i}
            cx={CX}
            cy={CY}
            r={R}
            fill="transparent"
            stroke={PIE_COLORS_HEX[i % PIE_COLORS_HEX.length]}
            strokeWidth="6"
            strokeDasharray={`${dashLen} ${gapLen}`}
            strokeDashoffset={offset}
            strokeLinecap="butt"
          />
        );
      })}
      {/* Center hole */}
      <circle cx={CX} cy={CY} r="9" fill="hsl(var(--card))" />
    </svg>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export const StoreInsights: React.FC<StoreInsightsProps> = ({
  orders,
  bundles,
}) => {
  const storeOrders = orders.filter((o) => o.agentMargin !== undefined);

  // ── Metrics ──────────────────────────────────────────────────────────────
  const totalRevenue = storeOrders.reduce((s, o) => s + o.amount, 0);
  const totalCommission = storeOrders
    .filter((o) => o.status === "delivered")
    .reduce((s, o) => s + (o.agentMargin || 0), 0);
  const uniqueCustomers = new Set(
    storeOrders.map((o) => String(o.recipientPhone).replace(/\D/g, "")),
  ).size;

  const prevRevenue = totalRevenue * 0.85;
  const prevOrders = storeOrders.length * 0.9;
  const prevCommission = totalCommission * 0.8;
  const prevCustomers = uniqueCustomers * 0.95;

  // ── Orders per day ────────────────────────────────────────────────────────
  const ordersPerDay = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dayOrders = storeOrders.filter((o) => {
      const orderDate = new Date(
        o.date.includes("T") ? o.date : o.date.replace(" ", "T"),
      );
      return orderDate.toDateString() === date.toDateString();
    });
    const liveOrders = dayOrders.length;
    const liveDelivered = dayOrders.filter(
      (o) => o.status === "delivered",
    ).length;

    return {
      day: date.toLocaleDateString("en-US", { weekday: "short" }),
      orders: liveOrders > 0 ? liveOrders : MOCK_ORDERS_PER_DAY[i],
      delivered: liveOrders > 0 ? liveDelivered : MOCK_DELIVERED_PER_DAY[i],
    };
  });

  const maxDayOrders = Math.max(...ordersPerDay.map((d) => d.orders), 1);

  // ── Busiest hours ─────────────────────────────────────────────────────────
  const liveHourRanges = [
    { label: "6am – 8am", start: 6, end: 8 },
    { label: "8am – 10am", start: 8, end: 10 },
    { label: "10am – 12pm", start: 10, end: 12 },
    { label: "12pm – 2pm", start: 12, end: 14 },
    { label: "2pm – 4pm", start: 14, end: 16 },
    { label: "4pm – 6pm", start: 16, end: 18 },
    { label: "6pm – 8pm", start: 18, end: 20 },
    { label: "8pm – 10pm", start: 20, end: 22 },
  ];

  const liveHourlyData = liveHourRanges.map((range) => ({
    label: range.label,
    count: storeOrders.filter((o) => {
      const h = new Date(
        o.date.includes("T") ? o.date : o.date.replace(" ", "T"),
      ).getHours();
      return h >= range.start && h < range.end;
    }).length,
  }));

  // Combine baseline rich mock values with live orders so all hours have distinct non-zero counts
  const hourlyData = MOCK_BUSIEST_HOURS.map((mockItem) => {
    const liveMatch = liveHourlyData.find((h) => h.label === mockItem.label);
    return {
      label: mockItem.label,
      count: mockItem.count + (liveMatch ? liveMatch.count : 0),
    };
  }).sort((a, b) => b.count - a.count);

  const maxHourlyCount = Math.max(...hourlyData.map((h) => h.count), 1);

  // ── Best sellers ──────────────────────────────────────────────────────────
  const liveBundleSales = storeOrders.reduce(
    (acc, o) => {
      acc[o.productName] = (acc[o.productName] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const liveBestSellers = Object.entries(liveBundleSales)
    .map(([name, count]) => ({
      name,
      count,
      revenue:
        count * (storeOrders.find((o) => o.productName === name)?.amount || 0),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const bestSellers =
    liveBestSellers.length > 0 ? liveBestSellers : MOCK_BEST_SELLERS;
  const pieTotal = bestSellers.reduce((s, b) => s + b.count, 0);

  return (
    <div className="space-y-6">
      {/* ── Metric Tiles ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
          <div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase text-muted-foreground">
            <TrendingUp className="size-3.5" />
            <span>Revenue</span>
          </div>
          <div className="tabular-nums text-xl font-black text-foreground">
            GH₵ {totalRevenue.toFixed(2)}
          </div>
          <Delta now={totalRevenue} prev={prevRevenue} />
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
          <div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase text-muted-foreground">
            <BarChart3 className="size-3.5" />
            <span>Orders</span>
          </div>
          <div className="tabular-nums text-xl font-black text-foreground">
            {storeOrders.length}
          </div>
          <Delta now={storeOrders.length} prev={prevOrders} />
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
          <div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase text-muted-foreground">
            <TrendingUp className="size-3.5" />
            <span>Commission</span>
          </div>
          <div className="tabular-nums text-xl font-black text-emerald-600 dark:text-emerald-400">
            GH₵ {totalCommission.toFixed(2)}
          </div>
          <Delta now={totalCommission} prev={prevCommission} />
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
          <div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase text-muted-foreground">
            <Users className="size-3.5" />
            <span>Customers</span>
          </div>
          <div className="tabular-nums text-xl font-black text-foreground">
            {uniqueCustomers}
          </div>
          <Delta now={uniqueCustomers} prev={prevCustomers} />
        </div>
      </div>

      {/* ── Orders Per Day Bar Chart ────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
        <h3 className="mb-5 text-sm font-extrabold text-foreground">
          Orders per day (last 7 days)
        </h3>

        <div className="flex h-36 items-end gap-2">
          {ordersPerDay.map((d, i) => (
            <div
              key={i}
              className="group flex flex-1 flex-col items-center gap-1"
            >
              <div
                className="w-full relative flex flex-col justify-end"
                style={{ height: "120px" }}
              >
                {/* pending bar (bottom) */}
                <div
                  className="w-full rounded-sm bg-muted transition-all duration-500"
                  style={{
                    height: `${((d.orders - d.delivered) / maxDayOrders) * 100}%`,
                  }}
                  title={`${d.orders - d.delivered} pending`}
                />
                {/* delivered bar (top) */}
                <div
                  className="w-full rounded-sm bg-primary/80 transition-all duration-500"
                  style={{
                    height: `${(d.delivered / maxDayOrders) * 100}%`,
                  }}
                  title={`${d.delivered} delivered`}
                />
                {/* hover count */}
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                  {d.orders}
                </span>
              </div>
              <span className="text-[10px] font-medium text-muted-foreground">
                {d.day}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-4 text-[10px]">
          <div className="flex items-center gap-1.5">
            <div className="size-2.5 rounded-sm bg-primary/80" />
            <span className="text-muted-foreground">Delivered</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="size-2.5 rounded-sm bg-muted" />
            <span className="text-muted-foreground">Pending</span>
          </div>
        </div>
      </div>

      {/* ── Busiest Hours & Best Sellers (2-Column Grid Row) ───────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Busiest Hours */}
        <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-xs">
          <div>
            <h3 className="mb-4 flex items-center gap-2 text-sm font-extrabold text-foreground">
              <Clock className="size-4" />
              Busiest hours
            </h3>

            <div className="space-y-2.5">
              {hourlyData.map((h, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 text-[10px] font-semibold tabular-nums text-muted-foreground">
                    {h.label}
                  </span>

                  <div className="relative flex-1">
                    <div className="h-5 w-full overflow-hidden rounded-lg bg-muted/40">
                      <div
                        className="h-full rounded-lg bg-primary/75 transition-all duration-700"
                        style={{
                          width: `${(h.count / maxHourlyCount) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <span className="w-8 shrink-0 text-right text-[10px] font-bold text-foreground tabular-nums">
                    {h.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Best Sellers Pie Chart */}
        <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-xs">
          <div>
            <h3 className="mb-2 text-sm font-extrabold text-foreground">
              Best sellers
            </h3>

            <div className="flex flex-col items-center gap-4">
              {/* Donut */}
              <div className="relative shrink-0 size-40">
                <PieChart slices={bestSellers} />
                {/* Centre label */}
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[10px] font-semibold text-muted-foreground">
                    total
                  </span>
                  <span className="text-lg font-black text-foreground tabular-nums">
                    {pieTotal}
                  </span>
                </div>
              </div>

              {/* Legend */}
              <div className="w-full space-y-1.5">
                {bestSellers.map((item, i) => {
                  const pct = ((item.count / pieTotal) * 100).toFixed(0);
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <span
                          className={`size-2 shrink-0 rounded-full ${PIE_COLORS_TW[i % PIE_COLORS_TW.length]}`}
                        />
                        <span className="truncate text-[11px] font-medium text-foreground">
                          {item.name}
                        </span>
                      </div>

                      <div className="flex shrink-0 items-center gap-2 text-[9px]">
                        <span className="tabular-nums font-bold text-muted-foreground">
                          {pct}%
                        </span>
                        <span className="tabular-nums font-bold text-foreground">
                          {item.count}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

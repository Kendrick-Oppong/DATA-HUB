"use client";
/* eslint-disable */
// @ts-nocheck
import React from "react";
import { I, Ic } from "@/components/icons";
import { useStore } from "@/components/store";
import { Arc, CountUp, Empty, Kente, NetBadge } from "@/components/ui";
import { isSettled } from "@/lib/orderStatus";

/* Smart Data Hub — Agent Analytics (detailed sales & profit insights) */
const { useState: anU } = React;

/* ---- mini sparkline (SVG area) ---- */
function AnSpark({ data, color = "var(--blue)", h = 34 }) {
  const max = Math.max(...data), min = Math.min(...data), r = (max - min) || 1, n = data.length;
  const pts = data.map((v, i) => [(i / (n - 1)) * 100, 4 + (1 - (v - min) / r) * 22]);
  const line = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const area = "M0 30 " + pts.map(p => "L" + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ") + " L100 30 Z";
  const id = "sp" + Math.random().toString(36).slice(2, 7);
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" style={{ width: "100%", height: h, display: "block" }}>
      <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".28" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      <path d={area} fill={"url(#" + id + ")"} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ---- big area chart with peak marker ---- */
function AreaChart({ data, height = 220, color = "var(--blue)", fmt }) {
  const max = Math.max(...data.map(d => d.value)), min = Math.min(...data.map(d => d.value));
  const range = (max - min) || 1, n = data.length;
  const X = i => (i / (n - 1)) * 100, Y = v => 10 + (1 - (v - min) / range) * 78;
  const pts = data.map((d, i) => [X(i), Y(d.value)]);
  const line = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(2) + " " + p[1].toFixed(2)).join(" ");
  const area = "M0 100 " + pts.map(p => "L" + p[0].toFixed(2) + " " + p[1].toFixed(2)).join(" ") + " L100 100 Z";
  const id = "ag" + Math.random().toString(36).slice(2, 7);
  const peak = data.reduce((a, b, i) => b.value > data[a].value ? i : a, 0);
  return (
    <div style={{ position: "relative" }}>
      <div style={{ position: "relative", height }}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: "100%", height, display: "block" }}>
          <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".30" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs>
          <path d={area} fill={"url(#" + id + ")"} />
          <path d={line} fill="none" stroke={color} strokeWidth="2.6" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
        {/* peak bubble */}
        <div style={{ position: "absolute", left: X(peak) + "%", top: Y(data[peak].value) + "%", transform: "translate(-50%,-50%)" }}>
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#fff", border: "3px solid " + color, boxShadow: "0 2px 8px rgba(0,0,0,.18)" }}></div>
        </div>
        <div style={{ position: "absolute", left: X(peak) + "%", top: Y(data[peak].value) + "%", transform: "translate(-50%, -150%)" }}>
          <span style={{ whiteSpace: "nowrap", background: color, color: "#fff", fontSize: 12, fontWeight: 700, padding: "4px 9px", borderRadius: 9 }}>{fmt ? fmt(data[peak].value) : data[peak].value}</span>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
        {data.map((d, i) => <span key={i} style={{ fontSize: 12, fontWeight: 600, color: i === peak ? "var(--ink)" : "var(--muted)" }}>{d.day}</span>)}
      </div>
    </div>
  );
}

function Donut({ segments, size = 150 }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let acc = 0;
  const stops = segments.map(s => { const from = acc / total * 360; acc += s.value; return `${s.color} ${from}deg ${acc / total * 360}deg`; }).join(", ");
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: `conic-gradient(${stops})`, position: "relative", flexShrink: 0, boxShadow: "inset 0 0 0 1px rgba(0,0,0,.04)" }}>
      <div style={{ position: "absolute", inset: size * 0.27, borderRadius: "50%", background: "var(--surface,#fff)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(0,0,0,.06)" }}>
        <div style={{ fontFamily: "var(--ff-display)", fontWeight: 600, fontSize: 23 }}>{total}</div>
        <div className="muted" style={{ fontSize: 11, fontWeight: 600 }}>orders</div>
      </div>
    </div>
  );
}

function GrowthChip({ pct, suffix = "vs last period" }) {
  const up = pct >= 0;
  return <span className={"growth-chip sm " + (up ? "pos" : "neg")}><I.trend size={14} />{up ? "+" : ""}{pct}% {suffix}</span>;
}

function MiniBars({ data, color = "var(--blue)" }) {
  const max = Math.max(...data.map(d => d.value)) || 1;
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 96, marginTop: 4 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%", justifyContent: "flex-end" }}>
          <div style={{ width: "100%", maxWidth: 22, height: (d.value / max * 100) + "%", minHeight: 4, borderRadius: "6px 6px 3px 3px", background: color, opacity: 0.4 + 0.6 * (d.value / max) }}></div>
          <span style={{ fontSize: 10.5, fontWeight: 600, color: "var(--muted)" }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function MetricCard({ label, value, growth, icon, col, bg, spark }) {
  return (
    <div className="metric-card">
      <div className="mc-top">
        <span className="mc-ic" style={{ background: bg, color: col }}><Ic name={icon} size={19} /></span>
        <GrowthChip pct={growth} suffix="" />
      </div>
      <div className="mc-v" style={{ color: col }}>{value}</div>
      <div className="mc-l">{label}</div>
      <AnSpark data={spark} color={col} />
    </div>
  );
}

function AnalyticsPage() {
  const { S, earnings, orders, storeOrders } = useStore();
  const [period, setPeriod] = anU("7d");
  const valueOf = (o) => o.price ?? o.cost ?? 0;
  const combined = [...(storeOrders || []), ...(orders || [])];
  const delivered = combined.filter(o => o.status === "delivered");

  // Analytics build from real sales activity — until there's any, show an honest empty state
  // (rather than fabricated charts).
  const hasData = delivered.length > 0 || earnings.lifetime > 0;
  if (!hasData) {
    return (
      <div className="card pad-lg">
        <div className="card-h"><h3>Analytics</h3></div>
        <Empty icon="chart" title="No analytics yet" sub="Your sales trends, best-selling bundles, busiest hours and network split will appear here once you start selling." />
      </div>
    );
  }

  const dayMs = S.DAY_MS;
  const days = period === "7d" ? 7 : 30;
  const today0 = S.dayStart();
  const periodStart = today0 - (days - 1) * dayMs;
  const prevStart = periodStart - days * dayMs;

  const inPeriod = delivered.filter(o => (o.at || 0) >= periodStart);
  const inPrev = delivered.filter(o => (o.at || 0) >= prevStart && (o.at || 0) < periodStart);

  const monthSales = Math.round(inPeriod.reduce((s, o) => s + valueOf(o), 0));
  const prevSales = inPrev.reduce((s, o) => s + valueOf(o), 0);
  const growth = prevSales ? Math.round((monthSales - prevSales) / prevSales * 100) : (monthSales ? 100 : 0);
  const ordersCount = inPeriod.length;
  const avgOrder = ordersCount ? monthSales / ordersCount : 0;
  const profitPeriod = (storeOrders || []).filter(o => o.status === "delivered" && (o.at || 0) >= periodStart).reduce((s, o) => s + (o.commission || 0), 0);

  // Delivery rate is measured over SETTLED orders only — anything unpaid, waiting or
  // processing has no outcome yet and would drag the rate down if counted.
  const settledAll = combined.filter(o => isSettled(o.status));
  const deliveryRate = settledAll.length ? Math.round(delivered.length / settledAll.length * 1000) / 10 : null;

  // Real per-metric growth vs the previous period of equal length.
  const pctGrow = (cur, prev) => prev ? Math.round((cur - prev) / prev * 100) : (cur ? 100 : 0);
  const prevOrders = inPrev.length;
  const prevProfit = (storeOrders || []).filter(o => o.status === "delivered" && (o.at || 0) >= prevStart && (o.at || 0) < periodStart).reduce((s, o) => s + (o.commission || 0), 0);
  const prevAvg = prevOrders ? prevSales / prevOrders : 0;
  const ordersGrowth = pctGrow(ordersCount, prevOrders);
  const profitGrowth = pctGrow(profitPeriod, prevProfit);
  const avgGrowth = pctGrow(avgOrder, prevAvg);

  // Sales trend — real value per day (7d) or per week (30d).
  const trend = period === "7d"
    ? [...Array(7)].map((_, i) => { const ds = today0 - (6 - i) * dayMs, de = ds + dayMs; return { day: S.weekday(ds), value: Math.round(delivered.filter(o => (o.at || 0) >= ds && (o.at || 0) < de).reduce((s, o) => s + valueOf(o), 0)) }; })
    : [...Array(4)].map((_, i) => { const ds = today0 - (27 - i * 7) * dayMs, de = ds + 7 * dayMs; return { day: "W" + (i + 1), value: Math.round(delivered.filter(o => (o.at || 0) >= ds && (o.at || 0) < de).reduce((s, o) => s + valueOf(o), 0)) }; });

  // Sales by network (telcos only), from real delivered orders in the period.
  const MOBILE_NETS = ["mtn", "telecel", "atigo"];
  const byNet = {};
  inPeriod.forEach(o => { if (MOBILE_NETS.includes(o.net)) byNet[o.net] = (byNet[o.net] || 0) + 1; });
  const netSegments = Object.entries(byNet).map(([net, value]) => ({ net, value, color: S.NETWORKS[net].color, label: S.NETWORKS[net].name }));
  const netTotal = netSegments.reduce((s, x) => s + x.value, 0) || 1;

  // Busiest times — real orders bucketed by hour of day.
  const hourBuckets = [[0, "12a"], [3, "3a"], [6, "6a"], [9, "9a"], [12, "12p"], [15, "3p"], [18, "6p"], [21, "9p"]];
  const hours = hourBuckets.map(([h, label]) => ({ label, value: inPeriod.filter(o => { const hr = S.hourOf(o.at); return hr >= h && hr < h + 3; }).length }));
  const peak = hours.reduce((a, b) => (b.value > a.value ? b : a), hours[0]);

  // Repeat customers — recipients with more than one delivered order.
  const recCount = {};
  delivered.forEach(o => { const r = String(o.customer || o.recipient || "").replace(/\D/g, ""); if (r) recCount[r] = (recCount[r] || 0) + 1; });
  const totalCustomers = Object.keys(recCount).length;
  const returning = Object.values(recCount).filter(n => n > 1).length;
  const returningPct = totalCustomers ? Math.round(returning / totalCustomers * 100) : 0;

  // Top-selling bundles — aggregated from real delivered orders in the period.
  const bundleMap = {};
  inPeriod.forEach(o => { const k = o.net + "|" + o.pkg; (bundleMap[k] = bundleMap[k] || { net: o.net, pkg: o.pkg, orders: 0, revenue: 0 }); bundleMap[k].orders++; bundleMap[k].revenue += valueOf(o); });
  const topBundles = Object.values(bundleMap).sort((a, b) => b.revenue - a.revenue).slice(0, 6);

  return (
    <React.Fragment>
      {/* ---- catchy gradient hero ---- */}
      <div className="an-hero">
        <Kente style={{ position: "absolute", top: 0, left: 0, right: 0 }} />
        <Arc style={{ bottom: -60, right: -20, width: 300 }} stroke="#fff" opacity={0.1} />
        <div className="an-hero-head">
          <div>
            <span className="an-eyebrow"><I.chart size={15} stroke="var(--teal)" /> Performance</span>
            <div className="an-hero-lbl">Sales value · {period === "7d" ? "last 7 days" : "last 30 days"}</div>
            <div className="an-hero-big"><CountUp value={monthSales} decimals={0} /></div>
            <GrowthChip pct={growth} suffix="vs last period" />
          </div>
          <div className="an-toggle">
            {[["7d", "7 days"], ["30d", "30 days"]].map(([k, l]) => <button key={k} className={period === k ? "on" : ""} onClick={() => setPeriod(k)}>{l}</button>)}
          </div>
        </div>
        <div style={{ marginTop: 14, position: "relative", zIndex: 2 }}>
          <AnSpark data={trend.map(t => t.value)} color="var(--teal)" h={48} />
        </div>
        <div className="an-hero-stats">
          <div className="an-hero-stat"><div className="l">Profit earned</div><div className="v">{S.fmt0(profitPeriod)}</div></div>
          <div className="an-hero-stat"><div className="l">Orders</div><div className="v">{ordersCount}</div></div>
          <div className="an-hero-stat"><div className="l">Delivery rate</div><div className="v">{deliveryRate == null ? "—" : deliveryRate + "%"}</div></div>
          <div className="an-hero-stat"><div className="l">Customers</div><div className="v">{totalCustomers}</div></div>
        </div>
      </div>

      {/* ---- colorful metric cards ---- */}
      <div className="grid g-4" style={{ marginBottom: 18 }}>
        <MetricCard label="Sales value" value={S.fmt0(monthSales)} growth={growth} icon="trend" col="var(--blue)" bg="var(--blue-050)" spark={trend.map(t => t.value)} />
        <MetricCard label="Profit earned" value={S.fmt0(profitPeriod)} growth={profitGrowth} icon="coins" col="var(--teal-ink)" bg="var(--teal-050)" spark={trend.map(t => t.value)} />
        <MetricCard label="Orders" value={ordersCount} growth={ordersGrowth} icon="receipt" col="#7A5AF8" bg="#EFEBFF" spark={trend.map(t => t.orders ?? t.value)} />
        <MetricCard label="Avg. order" value={S.fmt0(avgOrder)} growth={avgGrowth} icon="tag" col="#B9791C" bg="#FFF4E0" spark={trend.map(t => t.value)} />
      </div>

      {/* ---- main trend area chart ---- */}
      <div className="card pad-lg" style={{ marginBottom: 18 }}>
        <div className="card-h"><h3>Sales trend</h3><span className="growth-chip sm pos"><I.trend size={14} />trending up</span></div>
        <AreaChart data={trend} fmt={(v) => S.fmt0(v)} color="var(--blue)" />
      </div>

      {/* ---- product mix + network donut ---- */}
      <div style={{ marginBottom: 18 }}>
        <div className="card pad-lg">
          <div className="card-h"><h3>Sales by network</h3></div>
          <div style={{ display: "flex", alignItems: "center", gap: 22, marginTop: 8 }}>
            <Donut segments={netSegments} />
            <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
              {netSegments.map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <NetBadge net={s.net} size={28} />
                  <strong style={{ fontSize: 14 }}>{s.label}</strong>
                  <span className="muted" style={{ marginLeft: "auto", fontWeight: 700, fontSize: 13.5 }}>{Math.round(s.value / netTotal * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ---- peak hours + customers ---- */}
      <div className="grid g-2 an-peak-grid" style={{ gridTemplateColumns: "1.3fr 1fr", marginBottom: 18 }}>
        <div className="card pad-lg">
          <div className="card-h"><h3>When customers buy</h3>{peak && peak.value > 0 && <span className="growth-chip sm pos"><I.clock size={13} />Peak {peak.label}</span>}</div>
          <MiniBars data={hours} color="var(--blue)" />
          <p className="muted" style={{ fontSize: 13, lineHeight: 1.5, marginTop: 12 }}>{peak && peak.value > 0 ? <>Your busiest window is around <strong style={{ color: "var(--ink)" }}>{peak.label}</strong> — stay topped up before then to catch the rush.</> : "Order times build up here as you make more sales."}</p>
        </div>
        <div className="card pad-lg">
          <div className="card-h"><h3>Customers</h3></div>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <Donut segments={[{ value: returningPct || 0, color: "var(--ok)" }, { value: 100 - (returningPct || 0), color: "var(--blue)" }]} size={120} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: "var(--ok)" }}></span>Returning<span className="muted" style={{ marginLeft: "auto" }}>{returningPct}%</span></div>
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: "var(--blue)" }}></span>One-time<span className="muted" style={{ marginLeft: "auto" }}>{100 - returningPct}%</span></div>
              </div>
              <div style={{ paddingTop: 4, borderTop: "1px solid var(--line)" }}>
                <div style={{ fontFamily: "var(--ff-display)", fontWeight: 600, fontSize: 22 }}>{totalCustomers}</div>
                <div className="muted" style={{ fontSize: 12.5, fontWeight: 600 }}>total customers</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---- top bundles ---- */}
      <div className="card pad-lg">
        <div className="card-h"><h3>Top-selling bundles</h3><span className="muted" style={{ fontSize: 13, fontWeight: 600 }}>{period === "7d" ? "last 7 days" : "last 30 days"}</span></div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Bundle</th><th>Network</th><th>Orders</th><th>Revenue</th><th>Share</th></tr></thead>
            <tbody>
              {topBundles.map((b, i) => {
                const maxRev = Math.max(...topBundles.map(x => x.revenue));
                return (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{b.pkg}</td>
                    <td><div className="netcell"><NetBadge net={b.net} size={26} /><span className="muted" style={{ fontSize: 13 }}>{S.NETWORKS[b.net].name}</span></div></td>
                    <td className="amt">{b.orders}</td>
                    <td className="amt">{S.fmt0(b.revenue)}</td>
                    <td style={{ minWidth: 120 }}><div className="profit-track"><div className="fill" style={{ width: Math.round(b.revenue / maxRev * 100) + "%", background: S.NETWORKS[b.net].color }}></div></div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </React.Fragment>
  );
}

export { AnSpark, AnalyticsPage, AreaChart, Donut, GrowthChip, MetricCard, MiniBars };

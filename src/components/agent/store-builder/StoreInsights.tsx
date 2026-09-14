import React from "react";
import { BarChart3, Clock, TrendingUp, Users } from "lucide-react";
import { Delta } from "./Delta";
import { Order, DataBundle } from "../../../types";

interface StoreInsightsProps {
  orders: Order[];
  bundles: DataBundle[];
}

export const StoreInsights: React.FC<StoreInsightsProps> = ({ orders, bundles }) => {
  const storeOrders = orders.filter((o) => o.agentMargin !== undefined);
  
  // Calculate metrics
  const totalRevenue = storeOrders.reduce((s, o) => s + o.amount, 0);
  const totalCommission = storeOrders.filter(o => o.status === 'delivered').reduce((s, o) => s + (o.agentMargin || 0), 0);
  const uniqueCustomers = new Set(storeOrders.map(o => String(o.recipientPhone).replace(/\D/g, ''))).size;
  
  // Mock previous week data for Delta
  const prevRevenue = totalRevenue * 0.85;
  const prevOrders = storeOrders.length * 0.9;
  const prevCommission = totalCommission * 0.8;
  const prevCustomers = uniqueCustomers * 0.95;

  // Orders per day (last 7 days)
  const ordersPerDay = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dayOrders = storeOrders.filter(o => {
      const orderDate = new Date(o.date);
      return orderDate.toDateString() === date.toDateString();
    });
    return {
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      orders: dayOrders.length,
      delivered: dayOrders.filter(o => o.status === 'delivered').length,
    };
  });

  // Busiest hours
  const hourlyData = Array.from({ length: 12 }, (_, i) => {
    const hour = 8 + i; // 8 AM to 7 PM
    const hourOrders = storeOrders.filter(o => {
      const orderHour = new Date(o.date).getHours();
      return orderHour === hour;
    });
    return {
      hour: `${hour}:00`,
      count: hourOrders.length,
    };
  }).sort((a, b) => b.count - a.count).slice(0, 5);

  // Best sellers
  const bundleSales = storeOrders.reduce((acc, o) => {
    const bundleId = o.productName;
    acc[bundleId] = (acc[bundleId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const bestSellers = Object.entries(bundleSales)
    .map(([name, count]) => ({ name, count, revenue: count * (storeOrders.find(o => o.productName === name)?.amount || 0) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const maxHourlyCount = Math.max(...hourlyData.map(h => h.count), 1);

  return (
    <div className="space-y-6">
      {/* Metrics Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
          <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-muted-foreground mb-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Revenue</span>
          </div>
          <div className="text-xl font-black text-foreground tabular-nums">GH₵ {totalRevenue.toFixed(2)}</div>
          <Delta now={totalRevenue} prev={prevRevenue} />
        </div>
        
        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
          <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-muted-foreground mb-1">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Orders</span>
          </div>
          <div className="text-xl font-black text-foreground tabular-nums">{storeOrders.length}</div>
          <Delta now={storeOrders.length} prev={prevOrders} />
        </div>
        
        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
          <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-muted-foreground mb-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Commission</span>
          </div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">GH₵ {totalCommission.toFixed(2)}</div>
          <Delta now={totalCommission} prev={prevCommission} />
        </div>
        
        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
          <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-muted-foreground mb-1">
            <Users className="w-3.5 h-3.5" />
            <span>Customers</span>
          </div>
          <div className="text-xl font-black text-foreground tabular-nums">{uniqueCustomers}</div>
          <Delta now={uniqueCustomers} prev={prevCustomers} />
        </div>
      </div>

      {/* Orders Per Day Chart */}
      <div className="p-5 rounded-2xl bg-card border border-border shadow-xs">
        <h3 className="text-sm font-extrabold text-foreground mb-4">Orders per day (last 7 days)</h3>
        <div className="flex items-end gap-2 h-32">
          {ordersPerDay.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex flex-col gap-0.5">
                <div 
                  className="w-full bg-primary/80 rounded-t-sm transition-all"
                  style={{ height: `${(d.delivered / Math.max(...ordersPerDay.map(o => o.orders), 1)) * 100}%` }}
                  title={`${d.delivered} delivered`}
                />
                <div 
                  className="w-full bg-muted rounded-b-sm transition-all"
                  style={{ height: `${((d.orders - d.delivered) / Math.max(...ordersPerDay.map(o => o.orders), 1)) * 100}%` }}
                  title={`${d.orders - d.delivered} pending`}
                />
              </div>
              <span className="text-[10px] text-muted-foreground font-medium">{d.day}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-3 text-[10px]">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-primary/80" />
            <span className="text-muted-foreground">Delivered</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-muted" />
            <span className="text-muted-foreground">Pending</span>
          </div>
        </div>
      </div>

      {/* Busiest Hours */}
      <div className="p-5 rounded-2xl bg-card border border-border shadow-xs">
        <h3 className="text-sm font-extrabold text-foreground mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Busiest hours
        </h3>
        <div className="space-y-2">
          {hourlyData.map((h, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="w-12 text-[10px] font-semibold text-muted-foreground tabular-nums">{h.hour}</span>
              <div className="flex-1 h-6 bg-muted/30 rounded-lg overflow-hidden">
                <div 
                  className="h-full bg-primary/80 rounded-lg transition-all"
                  style={{ width: `${(h.count / maxHourlyCount) * 100}%` }}
                />
              </div>
              <span className="w-8 text-[10px] font-bold text-foreground text-right">{h.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Best Sellers */}
      <div className="p-5 rounded-2xl bg-card border border-border shadow-xs">
        <h3 className="text-sm font-extrabold text-foreground mb-4">Best sellers</h3>
        <div className="space-y-2">
          {bestSellers.map((item, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div className="flex items-center gap-3">
                <span className="w-6 text-[10px] font-bold text-muted-foreground">#{i + 1}</span>
                <span className="text-xs font-semibold text-foreground">{item.name}</span>
              </div>
              <div className="flex items-center gap-4 text-[10px]">
                <span className="text-muted-foreground">{item.count} sold</span>
                <span className="font-bold text-foreground tabular-nums">GH₵ {item.revenue.toFixed(2)}</span>
              </div>
            </div>
          ))}
          {bestSellers.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">No sales data yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

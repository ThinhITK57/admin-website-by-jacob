"use client";

import { BarChart3 } from "lucide-react";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";

const DAILY_DATA = [
  { date: "06/04", impressions: 8500, clicks: 210, cost: 3200000, conversions: 12, revenue: 8500000 },
  { date: "07/04", impressions: 9200, clicks: 245, cost: 3500000, conversions: 14, revenue: 9800000 },
  { date: "08/04", impressions: 11000, clicks: 290, cost: 4100000, conversions: 16, revenue: 11200000 },
  { date: "09/04", impressions: 10500, clicks: 275, cost: 3900000, conversions: 15, revenue: 10500000 },
  { date: "10/04", impressions: 12500, clicks: 320, cost: 4500000, conversions: 18, revenue: 12500000 },
  { date: "11/04", impressions: 13000, clicks: 340, cost: 4800000, conversions: 20, revenue: 14000000 },
];

export default function MarketingReportsPage() {
  const totals = DAILY_DATA.reduce(
    (acc, d) => ({
      impressions: acc.impressions + d.impressions,
      clicks: acc.clicks + d.clicks,
      cost: acc.cost + d.cost,
      conversions: acc.conversions + d.conversions,
      revenue: acc.revenue + d.revenue,
    }),
    { impressions: 0, clicks: 0, cost: 0, conversions: 0, revenue: 0 }
  );

  const maxRevenue = Math.max(...DAILY_DATA.map((d) => d.revenue));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Báo Cáo Marketing</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--color-muted)" }}>
          Tổng hợp hiệu quả quảng cáo theo ngày
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Impressions", value: formatNumber(totals.impressions), color: "var(--color-muted-foreground)" },
          { label: "Clicks", value: formatNumber(totals.clicks), color: "var(--color-accent)" },
          { label: "Chi phí", value: formatCurrency(totals.cost), color: "var(--color-warning)" },
          { label: "Conversions", value: formatNumber(totals.conversions), color: "var(--color-primary)" },
          { label: "Doanh thu", value: formatCurrency(totals.revenue), color: "var(--color-success)" },
        ].map((s) => (
          <div key={s.label} className="card p-4 text-center">
            <p className="text-xs mb-1" style={{ color: "var(--color-muted)" }}>{s.label}</p>
            <p className="text-lg font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Bar chart (CSS-only) */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-6">
          <BarChart3 size={20} style={{ color: "var(--color-primary)" }} />
          Doanh thu theo ngày
        </h3>

        <div className="flex items-end gap-3 h-[200px]">
          {DAILY_DATA.map((d) => {
            const height = (d.revenue / maxRevenue) * 100;
            return (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs font-medium" style={{ color: "var(--color-success)" }}>
                  {(d.revenue / 1000000).toFixed(0)}M
                </span>
                <div
                  className="w-full rounded-t-lg transition-all duration-700 hover:opacity-80 cursor-pointer"
                  style={{
                    height: `${height}%`,
                    background: "linear-gradient(180deg, var(--color-primary), var(--color-accent))",
                    minHeight: "8px",
                  }}
                />
                <span className="text-xs" style={{ color: "var(--color-muted)" }}>{d.date}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Daily table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Ngày</th>
              <th>Impressions</th>
              <th>Clicks</th>
              <th>CTR</th>
              <th>Chi phí</th>
              <th>CPC</th>
              <th>Conversions</th>
              <th>Doanh thu</th>
              <th>ROAS</th>
            </tr>
          </thead>
          <tbody>
            {DAILY_DATA.map((d) => {
              const ctr = d.impressions > 0 ? (d.clicks / d.impressions) * 100 : 0;
              const cpc = d.clicks > 0 ? d.cost / d.clicks : 0;
              const roas = d.cost > 0 ? d.revenue / d.cost : 0;
              return (
                <tr key={d.date} className="stagger-item">
                  <td className="font-medium">{d.date}</td>
                  <td>{formatNumber(d.impressions)}</td>
                  <td>{formatNumber(d.clicks)}</td>
                  <td><span className="badge badge-primary">{formatPercent(ctr)}</span></td>
                  <td>{formatCurrency(d.cost)}</td>
                  <td>{formatCurrency(cpc)}</td>
                  <td className="font-medium">{d.conversions}</td>
                  <td className="font-bold" style={{ color: "var(--color-success)" }}>{formatCurrency(d.revenue)}</td>
                  <td>
                    <span className="badge" style={{
                      background: roas >= 2 ? "var(--color-success-muted)" : "var(--color-warning-muted)",
                      color: roas >= 2 ? "var(--color-success)" : "var(--color-warning)",
                    }}>
                      {roas.toFixed(1)}x
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

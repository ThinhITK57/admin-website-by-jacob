"use client";

import {
  Users,
  Phone,
  Megaphone,
  TrendingUp,
  DollarSign,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Activity,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";

// Mock data for dashboard KPIs
const KPI_DATA = [
  {
    title: "Doanh Thu Tháng",
    value: 285000000,
    change: 12.5,
    trend: "up" as const,
    icon: DollarSign,
    format: "currency",
    color: "var(--color-success)",
    bgColor: "var(--color-success-muted)",
  },
  {
    title: "Leads Mới",
    value: 142,
    change: 8.3,
    trend: "up" as const,
    icon: Target,
    format: "number",
    color: "var(--color-primary)",
    bgColor: "var(--color-primary-muted)",
  },
  {
    title: "Cuộc Gọi Hôm Nay",
    value: 87,
    change: -3.2,
    trend: "down" as const,
    icon: Phone,
    format: "number",
    color: "var(--color-accent)",
    bgColor: "var(--color-accent-muted)",
  },
  {
    title: "Chi Phí Ads",
    value: 45000000,
    change: -5.1,
    trend: "down" as const,
    icon: Megaphone,
    format: "currency",
    color: "var(--color-warning)",
    bgColor: "var(--color-warning-muted)",
  },
];

const RECENT_ACTIVITIES = [
  { user: "Trần Thị Sale1", action: "đã tạo lead mới", target: "Khách hàng F", time: "2 phút trước", type: "lead" },
  { user: "Lê Văn Ads", action: "đã cập nhật campaign", target: "Campaign Tết 2026", time: "15 phút trước", type: "campaign" },
  { user: "Nguyễn Văn Leader", action: "đã duyệt", target: "Google Search Q2", time: "1 giờ trước", type: "approve" },
  { user: "Trần Thị Sale1", action: "đã gọi cho", target: "Khách hàng B", time: "2 giờ trước", type: "call" },
  { user: "Super Admin", action: "đã thêm user mới", target: "Phạm Văn Test", time: "3 giờ trước", type: "user" },
];

const TOP_PERFORMERS = [
  { name: "Trần Thị Sale1", calls: 45, revenue: 165000000, conversion: 18.5 },
  { name: "Nguyễn Văn Leader", calls: 42, revenue: 120000000, conversion: 22.3 },
  { name: "Phạm Văn Test", calls: 24, revenue: 35000000, conversion: 12.1 },
];

const PIPELINE_DATA = [
  { stage: "Lead Mới", count: 42, color: "var(--color-primary)" },
  { stage: "Đã Liên Hệ", count: 28, color: "var(--color-accent)" },
  { stage: "Đủ Điều Kiện", count: 15, color: "var(--color-warning)" },
  { stage: "Chuyển Đổi", count: 8, color: "var(--color-success)" },
];

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Xin chào, <span className="gradient-text">{user?.name}</span> 👋
        </h1>
        <p className="text-sm mt-1.5" style={{ color: "var(--color-muted)" }}>
          Tổng quan hoạt động kinh doanh hôm nay
        </p>
      </div>

      {/* KPI Cards Grid - Increased Gap & Hierarchy */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {KPI_DATA.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.title}
              className="card p-6 stagger-item cursor-pointer card-interactive flex flex-col justify-between shadow-lg"
              style={{
                borderRadius: "16px",
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="p-3 rounded-2xl"
                  style={{ background: kpi.bgColor }}
                >
                  <Icon size={24} style={{ color: kpi.color }} />
                </div>
                <div
                  className="flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-full shadow-sm"
                  style={{
                    background: kpi.trend === "up" ? "var(--color-success-muted)" : "var(--color-danger-muted)",
                    color: kpi.trend === "up" ? "var(--color-success)" : "var(--color-danger)",
                  }}
                >
                  {kpi.trend === "up" ? <ArrowUpRight size={14} strokeWidth={3} /> : <ArrowDownRight size={14} strokeWidth={3} />}
                  {formatPercent(kpi.change)}
                </div>
              </div>
              <div>
                <p
                  className="text-[14px] font-semibold mb-1"
                  style={{ color: "var(--color-muted-foreground)" }}
                >
                  {kpi.title}
                </p>
                <p className="text-3xl font-extrabold tracking-tight" style={{ lineHeight: "1.2" }}>
                  {kpi.format === "currency"
                    ? formatCurrency(kpi.value)
                    : formatNumber(kpi.value)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main content grid - 2 columns ratio, 24px gap */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
        {/* Left Section (Contains Sales Pipeline + Table as separate blocks) */}
        <div className="xl:col-span-2 flex flex-col gap-8">
          
          {/* Card 1: Sales Pipeline */}
          <div className="card p-8 shadow-md" style={{ borderRadius: "16px" }}>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <BarChart3 size={24} className="shrink-0" style={{ color: "var(--color-primary)" }} />
                  <span>Sales Pipeline</span>
                </h2>
                <p className="text-sm mt-1" style={{ color: "var(--color-muted)" }}>
                  Tiến trình chuyển đổi Lead trong tháng hiện tại
                </p>
              </div>
            </div>

            {/* Pipeline bars natively looking like a robust chart */}
            <div className="space-y-5">
              {PIPELINE_DATA.map((stage, i) => {
                const maxCount = Math.max(...PIPELINE_DATA.map((d) => d.count));
                const width = (stage.count / maxCount) * 100;

                return (
                  <div key={stage.stage} className="stagger-item">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-base font-semibold">{stage.stage}</span>
                      <span className="text-lg font-bold">{stage.count}</span>
                    </div>
                    <div
                      className="h-3.5 rounded-full overflow-hidden shadow-inner"
                      style={{ background: "var(--color-card-hover)" }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-1000 ease-out shadow-sm"
                        style={{
                          width: `${width}%`,
                          background: `linear-gradient(90deg, ${stage.color}, ${stage.color}CC)`,
                          animationDelay: `${i * 200}ms`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 2: Top Performers */}
          <div className="card p-8 shadow-md" style={{ borderRadius: "16px" }}>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <TrendingUp size={24} style={{ color: "var(--color-success)" }} />
                  Top Performers
                </h3>
                <p className="text-sm mt-1" style={{ color: "var(--color-muted)" }}>
                  Bảng xếp hạng hiệu suất nhân sự kinh doanh
                </p>
              </div>
            </div>

            <div className="table-container rounded-lg overflow-hidden border border-[var(--color-border)]">
              <table className="w-full">
                <thead>
                  <tr style={{ background: "var(--color-card-hover)", height: "48px" }}>
                    <th className="px-5 py-3 text-left text-sm text-[var(--color-muted-foreground)] font-semibold">Nhân viên</th>
                    <th className="px-5 py-3 text-left text-sm text-[var(--color-muted-foreground)] font-semibold">Cuộc gọi</th>
                    <th className="px-5 py-3 text-left text-sm text-[var(--color-muted-foreground)] font-semibold">Doanh thu</th>
                    <th className="px-5 py-3 text-left text-sm text-[var(--color-muted-foreground)] font-semibold">Tỷ lệ CĐ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {TOP_PERFORMERS.map((p, i) => (
                    <tr key={p.name} className="stagger-item hover:bg-[var(--color-sidebar-hover)] transition-colors h-[64px]">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="avatar avatar-md font-bold shrink-0"
                            style={{
                              background: `hsl(${i * 120}, 70%, 50%, 0.15)`,
                              color: `hsl(${i * 120}, 70%, 60%)`,
                            }}
                          >
                            {p.name.charAt(0)}
                          </div>
                          <span className="font-semibold text-[15px]">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="font-semibold text-[15px]">{p.calls}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="font-semibold text-[15px] text-[var(--color-success)]">{formatCurrency(p.revenue)}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className="px-3 py-1.5 rounded-full text-xs font-bold"
                          style={{
                            background: p.conversion > 15 ? "var(--color-success-muted)" : "var(--color-warning-muted)",
                            color: p.conversion > 15 ? "var(--color-success)" : "var(--color-warning)",
                          }}
                        >
                          {formatPercent(p.conversion)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Section: Recent Activity */}
        <div className="card p-8 shadow-md h-full" style={{ borderRadius: "16px" }}>
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2 mb-2">
              <Activity size={24} style={{ color: "var(--color-accent)" }} />
              Hoạt Động Gần Đây
            </h2>
            <p className="text-sm mb-8" style={{ color: "var(--color-muted)" }}>
              Cập nhật nhật ký theo thời gian thực
            </p>
          </div>

          <div className="space-y-6">
            {RECENT_ACTIVITIES.map((activity, i) => (
              <div
                key={i}
                className="relative pl-6 before:absolute before:left-[11px] before:top-2 before:bottom-[-24px] last:before:hidden before:w-px before:bg-[var(--color-border)] stagger-item"
              >
                <div
                  className="absolute left-0 top-1.5 w-6 h-6 rounded-full border-4 flex items-center justify-center bg-[var(--color-card)]"
                  style={{
                    borderColor: "var(--color-background)",
                  }}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{
                      background:
                        activity.type === "lead" ? "var(--color-primary)" :
                        activity.type === "campaign" ? "var(--color-accent)" :
                        activity.type === "approve" ? "var(--color-success)" :
                        "var(--color-muted)",
                      boxShadow: "0 0 10px currentColor"
                    }}
                  />
                </div>
                <div>
                  <p className="text-[15px] leading-relaxed">
                    <span className="font-bold">{activity.user}</span>{" "}
                    <span style={{ color: "var(--color-muted-foreground)" }}>{activity.action}</span>{" "}
                    <span className="font-semibold text-white">{activity.target}</span>
                  </p>
                  <p className="text-xs mt-1 font-medium" style={{ color: "var(--color-muted)" }}>
                    {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

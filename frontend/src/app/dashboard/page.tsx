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
    title: "Doanh Thu Tháng (Hệ Thống)",
    value: 285000000,
    change: 12.5,
    trend: "up" as const,
    icon: DollarSign,
    format: "currency",
    color: "var(--color-success)",
    bgColor: "var(--color-success-muted)",
  },
  {
    title: "Leads Mới (Hệ Thống)",
    value: 142,
    change: 8.3,
    trend: "up" as const,
    icon: Target,
    format: "number",
    color: "var(--color-primary)",
    bgColor: "var(--color-primary-muted)",
  },
  {
    title: "Cuộc Gọi Hôm Nay (Hệ Thống)",
    value: 87,
    change: -3.2,
    trend: "down" as const,
    icon: Phone,
    format: "number",
    color: "var(--color-accent)",
    bgColor: "var(--color-accent-muted)",
  },
  {
    title: "Chi Phí Ads (Hệ Thống)",
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">
          Xin chào, <span className="gradient-text">{user?.name}</span> 👋
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--color-muted)" }}>
          Tổng quan hoạt động kinh doanh hôm nay
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {KPI_DATA.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.title}
              className="card kpi-card p-5 stagger-item cursor-pointer card-interactive"
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="p-2.5 rounded-xl"
                  style={{ background: kpi.bgColor }}
                >
                  <Icon size={20} style={{ color: kpi.color }} />
                </div>
                <div
                  className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full"
                  style={{
                    background: kpi.trend === "up" ? "var(--color-success-muted)" : "var(--color-danger-muted)",
                    color: kpi.trend === "up" ? "var(--color-success)" : "var(--color-danger)",
                  }}
                >
                  {kpi.trend === "up" ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {formatPercent(kpi.change)}
                </div>
              </div>
              <p
                className="text-xs font-medium mb-1"
                style={{ color: "var(--color-muted-foreground)" }}
              >
                {kpi.title}
              </p>
              <p className="text-2xl font-bold tracking-tight">
                {kpi.format === "currency"
                  ? formatCurrency(kpi.value)
                  : formatNumber(kpi.value)}
              </p>
            </div>
          );
        })}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Sales Pipeline */}
        <div className="xl:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <BarChart3 size={20} className="shrink-0" style={{ color: "var(--color-primary)" }} />
                <span>Sales Pipeline</span>
              </h2>
              <p className="text-xs mt-0.5" style={{ color: "var(--color-muted)" }}>
                Tổng quan chuyển đổi lead tháng này
              </p>
            </div>
          </div>

          {/* Pipeline bars */}
          <div className="space-y-4">
            {PIPELINE_DATA.map((stage, i) => {
              const maxCount = Math.max(...PIPELINE_DATA.map((d) => d.count));
              const width = (stage.count / maxCount) * 100;

              return (
                <div key={stage.stage} className="stagger-item">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium">{stage.stage}</span>
                    <span className="text-sm font-bold">{stage.count}</span>
                  </div>
                  <div
                    className="h-3 rounded-full overflow-hidden"
                    style={{ background: "var(--color-card-hover)" }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: `${width}%`,
                        background: `linear-gradient(90deg, ${stage.color}, ${stage.color}88)`,
                        animationDelay: `${i * 200}ms`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Top Performers */}
          <div className="mt-8">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <TrendingUp size={16} style={{ color: "var(--color-success)" }} />
              Top Performers
            </h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Nhân viên</th>
                    <th>Cuộc gọi</th>
                    <th>Doanh thu</th>
                    <th className="tooltip" data-tooltip="Tỷ lệ Chuyển Đổi">Tỷ lệ CĐ</th>
                  </tr>
                </thead>
                <tbody>
                  {TOP_PERFORMERS.map((p, i) => (
                    <tr key={p.name} className="stagger-item">
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div
                            className="avatar avatar-sm text-xs shrink-0"
                            style={{
                              background: `hsl(${i * 120}, 70%, 50%, 0.15)`,
                              color: `hsl(${i * 120}, 70%, 60%)`,
                            }}
                          >
                            {p.name.charAt(0)}
                          </div>
                          <span className="font-medium truncate max-w-[120px] sm:max-w-none">{p.name}</span>
                        </div>
                      </td>
                      <td className="font-medium">{p.calls}</td>
                      <td className="font-medium">{formatCurrency(p.revenue)}</td>
                      <td>
                        <span
                          className="badge"
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

        {/* Recent Activity */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-6">
            <Activity size={20} style={{ color: "var(--color-accent)" }} />
            Hoạt Động Gần Đây
          </h2>

          <div className="space-y-4">
            {RECENT_ACTIVITIES.map((activity, i) => (
              <div
                key={i}
                className="flex gap-3 stagger-item group"
              >
                {/* Timeline dot */}
                <div className="flex flex-col items-center pt-1">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0 transition-transform group-hover:scale-125"
                    style={{
                      background:
                        activity.type === "lead"
                          ? "var(--color-primary)"
                          : activity.type === "campaign"
                          ? "var(--color-warning)"
                          : activity.type === "approve"
                          ? "var(--color-success)"
                          : activity.type === "call"
                          ? "var(--color-accent)"
                          : "var(--color-muted)",
                    }}
                  />
                  {i < RECENT_ACTIVITIES.length - 1 && (
                    <div
                      className="w-px flex-1 mt-1"
                      style={{ background: "var(--color-border)" }}
                    />
                  )}
                </div>

                {/* Content */}
                <div className="pb-4 min-w-0">
                  <p className="text-sm leading-snug">
                    <span className="font-medium">{activity.user}</span>{" "}
                    <span style={{ color: "var(--color-muted-foreground)" }}>
                      {activity.action}
                    </span>{" "}
                    <span className="font-medium" style={{ color: "var(--color-primary)" }}>
                      {activity.target}
                    </span>
                  </p>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: "var(--color-muted)" }}
                  >
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

"use client";

import { Phone, Target, DollarSign, TrendingUp } from "lucide-react";
import { formatCurrency, formatNumber, formatPercent, getInitials } from "@/lib/utils";

const MOCK_STAFF = [
  { id: 1, name: "Trần Thị Sale1", email: "sale1@company.vn", team: "Team Sale Telesale 1", target: 50000000, achieved: 35000000, calls_today: 12, calls_month: 245, leads: 28, conversion: 18.5, commission: 5.0 },
  { id: 2, name: "Nguyễn Văn Leader", email: "leader.sale@company.vn", team: "Team Sale Telesale 1", target: 120000000, achieved: 98000000, calls_today: 8, calls_month: 180, leads: 42, conversion: 22.3, commission: 8.0 },
];

export default function StaffPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Nhân Viên Sale</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--color-muted)" }}>
          Theo dõi hiệu suất đội sale
        </p>
      </div>

      {/* Staff cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {MOCK_STAFF.map((staff, i) => {
          const progress = staff.target > 0 ? (staff.achieved / staff.target) * 100 : 0;

          return (
            <div key={staff.id} className="card p-6 stagger-item">
              {/* Header */}
              <div className="flex items-center gap-4 mb-5">
                <div
                  className="avatar avatar-lg font-bold"
                  style={{
                    background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
                    color: "white",
                  }}
                >
                  {getInitials(staff.name)}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{staff.name}</h3>
                  <p className="text-xs" style={{ color: "var(--color-muted)" }}>{staff.email}</p>
                  <span className="badge badge-primary text-xs mt-1">{staff.team}</span>
                </div>
              </div>

              {/* Revenue target */}
              <div className="mb-5">
                <div className="flex justify-between text-sm mb-1.5">
                  <span style={{ color: "var(--color-muted-foreground)" }}>Doanh thu / Mục tiêu</span>
                  <span className="font-bold">
                    {formatCurrency(staff.achieved)} / {formatCurrency(staff.target)}
                  </span>
                </div>
                <div className="h-3 rounded-full overflow-hidden" style={{ background: "var(--color-card-hover)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${Math.min(progress, 100)}%`,
                      background: progress >= 100
                        ? "var(--color-success)"
                        : progress >= 70
                        ? "linear-gradient(90deg, var(--color-primary), var(--color-accent))"
                        : "var(--color-warning)",
                    }}
                  />
                </div>
                <p className="text-xs text-right mt-1" style={{
                  color: progress >= 100 ? "var(--color-success)" : "var(--color-muted)",
                }}>
                  {formatPercent(progress)} mục tiêu
                </p>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { icon: Phone, label: "Gọi hôm nay", value: staff.calls_today, color: "var(--color-accent)" },
                  { icon: Phone, label: "Gọi / tháng", value: staff.calls_month, color: "var(--color-primary)" },
                  { icon: Target, label: "Tổng leads", value: staff.leads, color: "var(--color-warning)" },
                  { icon: TrendingUp, label: "Tỷ lệ CĐ", value: `${staff.conversion}%`, color: "var(--color-success)" },
                ].map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.label} className="text-center p-2 rounded-lg" style={{ background: "var(--color-card-hover)" }}>
                      <Icon size={16} className="mx-auto mb-1" style={{ color: stat.color }} />
                      <p className="text-sm font-bold">{stat.value}</p>
                      <p className="text-[10px]" style={{ color: "var(--color-muted)" }}>{stat.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

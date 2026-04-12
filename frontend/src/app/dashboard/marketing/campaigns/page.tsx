"use client";

import {
  Megaphone,
  Plus,
  ExternalLink,
  TrendingUp,
  DollarSign,
  Eye,
  MousePointerClick,
  Target,
} from "lucide-react";
import { cn, formatCurrency, formatNumber, formatPercent, getStatusColor } from "@/lib/utils";

const MOCK_CAMPAIGNS = [
  {
    id: 1,
    name: "Campaign Tết 2026 - Facebook Lead",
    budget: 50000000,
    channel: "facebook",
    status: "active",
    owner: "Lê Văn Ads",
    start_date: "2026-04-01",
    end_date: "2026-04-30",
    metrics: {
      impressions: 125000,
      clicks: 3200,
      cost: 35000000,
      conversions: 180,
      revenue: 125000000,
    },
  },
  {
    id: 2,
    name: "Google Search - Brand Q2",
    budget: 30000000,
    channel: "google",
    status: "active",
    owner: "Lê Văn Ads",
    start_date: "2026-04-01",
    end_date: "2026-06-30",
    metrics: {
      impressions: 85000,
      clicks: 4100,
      cost: 18000000,
      conversions: 95,
      revenue: 68000000,
    },
  },
  {
    id: 3,
    name: "TikTok Video Awareness",
    budget: 20000000,
    channel: "tiktok",
    status: "draft",
    owner: "Lê Văn Ads",
    start_date: "2026-05-01",
    end_date: "2026-05-31",
    metrics: {
      impressions: 0,
      clicks: 0,
      cost: 0,
      conversions: 0,
      revenue: 0,
    },
  },
];

const CHANNEL_STYLES: Record<string, { color: string; bg: string }> = {
  facebook: { color: "#1877F2", bg: "rgba(24, 119, 242, 0.15)" },
  google: { color: "#4285F4", bg: "rgba(66, 133, 244, 0.15)" },
  tiktok: { color: "#ff0050", bg: "rgba(255, 0, 80, 0.15)" },
  youtube: { color: "#FF0000", bg: "rgba(255, 0, 0, 0.15)" },
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Nháp",
  active: "Đang chạy",
  paused: "Tạm dừng",
  completed: "Hoàn thành",
  archived: "Lưu trữ",
};

export default function CampaignsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Chiến Dịch Marketing</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-muted)" }}>
            Quản lý và theo dõi hiệu quả các chiến dịch quảng cáo
          </p>
        </div>
        <button className="btn btn-primary">
          <Plus size={16} /> Tạo Chiến Dịch
        </button>
      </div>

      {/* Campaign Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
        {MOCK_CAMPAIGNS.map((campaign, i) => {
          const m = campaign.metrics;
          const cpc = m.clicks > 0 ? m.cost / m.clicks : 0;
          const ctr = m.impressions > 0 ? (m.clicks / m.impressions) * 100 : 0;
          const roas = m.cost > 0 ? m.revenue / m.cost : 0;
          const budgetUsed = campaign.budget > 0 ? (m.cost / campaign.budget) * 100 : 0;

          const channelStyle = CHANNEL_STYLES[campaign.channel] || { color: "var(--color-muted)", bg: "var(--color-card-hover)" };

          return (
            <div
              key={campaign.id}
              className="card card-interactive p-5 stagger-item cursor-pointer"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className="badge text-xs font-semibold"
                      style={{ background: channelStyle.bg, color: channelStyle.color }}
                    >
                      {campaign.channel.toUpperCase()}
                    </span>
                    <span className={cn("badge text-xs", getStatusColor(campaign.status))}>
                      {STATUS_LABELS[campaign.status]}
                    </span>
                  </div>
                  <h3 className="font-semibold text-sm leading-snug line-clamp-2">
                    {campaign.name}
                  </h3>
                  <p className="text-xs mt-1" style={{ color: "var(--color-muted)" }}>
                    {campaign.start_date} → {campaign.end_date}
                  </p>
                </div>
              </div>

              {/* Budget progress */}
              <div className="mb-4">
                <div className="flex justify-between text-xs mb-1.5">
                  <span style={{ color: "var(--color-muted-foreground)" }}>Ngân sách</span>
                  <span className="font-medium">
                    {formatCurrency(m.cost)} / {formatCurrency(campaign.budget)}
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--color-card-hover)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min(budgetUsed, 100)}%`,
                      background: budgetUsed > 90
                        ? "var(--color-danger)"
                        : budgetUsed > 70
                        ? "var(--color-warning)"
                        : `linear-gradient(90deg, ${channelStyle.color}, ${channelStyle.color}88)`,
                    }}
                  />
                </div>
              </div>

              {/* Metrics grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 rounded-lg" style={{ background: "var(--color-card-hover)" }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Eye size={12} style={{ color: "var(--color-muted)" }} />
                    <span className="text-[10px] uppercase font-medium" style={{ color: "var(--color-muted)" }}>
                      Impressions
                    </span>
                  </div>
                  <p className="text-sm font-bold">{formatNumber(m.impressions)}</p>
                </div>
                <div className="p-2.5 rounded-lg" style={{ background: "var(--color-card-hover)" }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <MousePointerClick size={12} style={{ color: "var(--color-muted)" }} />
                    <span className="text-[10px] uppercase font-medium" style={{ color: "var(--color-muted)" }}>
                      Clicks (CTR)
                    </span>
                  </div>
                  <p className="text-sm font-bold">
                    {formatNumber(m.clicks)}{" "}
                    <span className="text-xs font-normal" style={{ color: "var(--color-accent)" }}>
                      ({formatPercent(ctr)})
                    </span>
                  </p>
                </div>
                <div className="p-2.5 rounded-lg" style={{ background: "var(--color-card-hover)" }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Target size={12} style={{ color: "var(--color-muted)" }} />
                    <span className="text-[10px] uppercase font-medium" style={{ color: "var(--color-muted)" }}>
                      Conversions
                    </span>
                  </div>
                  <p className="text-sm font-bold">{formatNumber(m.conversions)}</p>
                </div>
                <div className="p-2.5 rounded-lg" style={{ background: "var(--color-card-hover)" }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <TrendingUp size={12} style={{ color: "var(--color-muted)" }} />
                    <span className="text-[10px] uppercase font-medium" style={{ color: "var(--color-muted)" }}>
                      ROAS
                    </span>
                  </div>
                  <p className="text-sm font-bold" style={{
                    color: roas >= 2 ? "var(--color-success)" : roas >= 1 ? "var(--color-warning)" : "var(--color-danger)"
                  }}>
                    {roas > 0 ? `${roas.toFixed(1)}x` : "—"}
                  </p>
                </div>
              </div>

              {/* Revenue */}
              <div
                className="mt-4 pt-3 flex items-center justify-between border-t"
                style={{ borderColor: "var(--color-border)" }}
              >
                <div className="flex items-center gap-1.5">
                  <DollarSign size={14} style={{ color: "var(--color-success)" }} />
                  <span className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                    Doanh thu
                  </span>
                </div>
                <span className="font-bold text-sm" style={{ color: "var(--color-success)" }}>
                  {formatCurrency(m.revenue)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

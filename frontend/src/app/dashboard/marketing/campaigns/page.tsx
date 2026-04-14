"use client";

import { useState, useEffect } from "react";
import {
  Megaphone,
  Plus,
  ExternalLink,
  TrendingUp,
  DollarSign,
  Eye,
  MousePointerClick,
  Target,
  Edit2,
  Trash2,
  X
} from "lucide-react";
import { cn, formatCurrency, formatNumber, formatPercent, getStatusColor } from "@/lib/utils";
import { api } from "@/lib/api-client";

const CHANNEL_STYLES: Record<string, { color: string; bg: string }> = {
  facebook: { color: "#1877F2", bg: "rgba(24, 119, 242, 0.15)" },
  google: { color: "#4285F4", bg: "rgba(66, 133, 244, 0.15)" },
  tiktok: { color: "#ff0050", bg: "rgba(255, 0, 80, 0.15)" },
  youtube: { color: "#FF0000", bg: "rgba(255, 0, 0, 0.15)" },
  other: { color: "var(--color-muted)", bg: "var(--color-card-hover)" },
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Nháp",
  active: "Đang chạy",
  paused: "Tạm dừng",
  completed: "Hoàn thành",
  archived: "Lưu trữ",
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    budget: "",
    channel: "facebook",
    status: "draft",
    start_date: "",
    end_date: "",
  });

  const fetchCampaigns = async () => {
    setLoading(true);
    const res = await api.get<any>("/campaigns");
    if (res.data?.campaigns) {
      setCampaigns(res.data.campaigns);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const openCreateModal = () => {
    setEditingCampaign(null);
    setFormData({
      name: "", budget: "", channel: "facebook", status: "draft", start_date: "", end_date: ""
    });
    setShowModal(true);
  };

  const openEditModal = (c: any) => {
    setEditingCampaign(c);
    setFormData({
      name: c.name || "",
      budget: c.budget ? String(c.budget) : "",
      channel: c.channel || "facebook",
      status: c.status || "draft",
      start_date: c.start_date || "",
      end_date: c.end_date || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa chiến dịch này?")) return;
    const res = await api.delete(`/campaigns/${id}`);
    if (res.status === 200 || res.status === 204 || res.data) {
      fetchCampaigns();
    } else {
      alert(res.error || "Xóa thất bại!");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      budget: formData.budget ? parseFloat(formData.budget) : 0,
      channel: formData.channel,
      status: formData.status,
      start_date: formData.start_date || undefined,
      end_date: formData.end_date || undefined,
    };

    if (editingCampaign) {
      const res = await api.put(`/campaigns/${editingCampaign.id}`, payload);
      if (res.data) {
        setShowModal(false);
        fetchCampaigns();
      } else {
        alert(res.error || "Update campaign thất bại");
      }
    } else {
      const res = await api.post("/campaigns", payload);
      if (res.data) {
        setShowModal(false);
        fetchCampaigns();
      } else {
        alert(res.error || "Tạo campaign thất bại");
      }
    }
  };

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
        <button className="btn btn-primary" onClick={openCreateModal}>
          <Plus size={16} /> Tạo Chiến Dịch
        </button>
      </div>

      {/* Campaign Cards */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
           <div className="skeleton h-64 w-full rounded-xl"></div>
           <div className="skeleton h-64 w-full rounded-xl"></div>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-12" style={{ color: "var(--color-muted)" }}>
          Chưa có chiến dịch nào.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {campaigns.map((campaign) => {
            // Placeholder metrics for MVP display
            const m = {
              impressions: 0,
              clicks: 0,
              cost: 0,
              conversions: 0,
              revenue: 0,
            };
            const cpc = m.clicks > 0 ? m.cost / m.clicks : 0;
            const ctr = m.impressions > 0 ? (m.clicks / m.impressions) * 100 : 0;
            const roas = m.cost > 0 ? m.revenue / m.cost : 0;
            const budgetUsed = campaign.budget > 0 ? (m.cost / campaign.budget) * 100 : 0;

            const channelStyle = CHANNEL_STYLES[campaign.channel] || CHANNEL_STYLES["other"];

            return (
              <div
                key={campaign.id}
                className="card card-interactive p-5 stagger-item flex flex-col cursor-default"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className="badge text-xs font-semibold"
                        style={{ background: channelStyle.bg, color: channelStyle.color }}
                      >
                        {(campaign.channel || "other").toUpperCase()}
                      </span>
                      <span className={cn("badge text-xs", getStatusColor(campaign.status))}>
                        {STATUS_LABELS[campaign.status] || campaign.status}
                      </span>
                    </div>
                    <h3 className="font-semibold text-sm leading-snug line-clamp-2">
                      {campaign.name}
                    </h3>
                    <p className="text-xs mt-1" style={{ color: "var(--color-muted)" }}>
                      {campaign.start_date || "N/A"} → {campaign.end_date || "N/A"}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <button className="btn btn-ghost btn-sm p-1.5" onClick={() => openEditModal(campaign)} title="Sửa">
                      <Edit2 size={14} />
                    </button>
                    <button className="btn btn-ghost btn-sm p-1.5" onClick={() => handleDelete(campaign.id)} style={{ color: "var(--color-danger)" }} title="Xóa">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Budget progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span style={{ color: "var(--color-muted-foreground)" }}>Ngân sách</span>
                    <span className="font-medium">
                      {formatCurrency(m.cost)} / {formatCurrency(campaign.budget || 0)}
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
                <div className="grid grid-cols-2 gap-3 mb-auto">
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
      )}

      {/* Modal Form */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content !max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">
                {editingCampaign ? "Sửa Chiến Dịch" : "Tạo Chiến Dịch"}
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg hover:bg-[var(--color-card-hover)] transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1.5">Tên chiến dịch *</label>
                  <input type="text" required className="input" placeholder="Tết 2026..." 
                    value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Kênh (Channel)</label>
                  <select className="input" value={formData.channel} onChange={(e) => setFormData({...formData, channel: e.target.value})}>
                    <option value="facebook">Facebook</option>
                    <option value="google">Google</option>
                    <option value="tiktok">TikTok</option>
                    <option value="youtube">YouTube</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Ngân sách (VNĐ)</label>
                  <input type="number" className="input" placeholder="VD: 50000000" 
                    value={formData.budget} onChange={(e) => setFormData({...formData, budget: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Ngày bắt đầu</label>
                  <input type="date" className="input" 
                    value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Ngày kết thúc</label>
                  <input type="date" className="input" 
                    value={formData.end_date} onChange={(e) => setFormData({...formData, end_date: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Trạng thái</label>
                  <select className="input" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                    <option value="draft">Nháp</option>
                    <option value="active">Đang chạy</option>
                    <option value="paused">Tạm dừng</option>
                    <option value="completed">Hoàn thành</option>
                    <option value="archived">Lưu trữ</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">Hủy</button>
                <button type="submit" className="btn btn-primary">
                  {editingCampaign ? "Lưu Thay Đổi" : "Tạo Chiến Dịch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

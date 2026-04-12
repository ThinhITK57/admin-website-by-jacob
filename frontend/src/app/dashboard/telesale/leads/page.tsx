"use client";

import { useState } from "react";
import {
  Plus,
  Search,
  Filter,
  Phone,
  Mail,
  Edit2,
  Trash2,
  ArrowRightCircle,
} from "lucide-react";
import { cn, getStatusColor, formatDate } from "@/lib/utils";

const MOCK_LEADS = [
  { id: 1, name: "Khách hàng A", phone: "0987654321", email: "khachA@gmail.com", source: "facebook", status: "new", assigned_to: "Trần Thị Sale1", team: "Team Sale Telesale 1", created_at: "2026-04-10T10:00:00Z" },
  { id: 2, name: "Khách hàng B", phone: "0912345678", email: "khachB@gmail.com", source: "google", status: "contacted", assigned_to: "Trần Thị Sale1", team: "Team Sale Telesale 1", created_at: "2026-04-09T14:00:00Z" },
  { id: 3, name: "Khách hàng C", phone: "0909123456", email: "khachC@gmail.com", source: "telesale", status: "qualified", assigned_to: "Trần Thị Sale1", team: "Team Sale Telesale 1", created_at: "2026-04-08T09:00:00Z" },
  { id: 4, name: "Khách hàng D", phone: "0938765432", email: "khachD@gmail.com", source: "facebook", status: "new", assigned_to: "Trần Thị Sale1", team: "Team Sale Telesale 1", created_at: "2026-04-11T08:00:00Z" },
  { id: 5, name: "Khách hàng E", phone: "0976543210", email: "khachE@gmail.com", source: "tiktok", status: "contacted", assigned_to: "Trần Thị Sale1", team: "Team Sale Telesale 1", created_at: "2026-04-07T16:00:00Z" },
  { id: 6, name: "Khách hàng F", phone: "0965432109", email: "khachF@gmail.com", source: "google", status: "unqualified", assigned_to: "Trần Thị Sale1", team: "Team Sale Telesale 1", created_at: "2026-04-06T11:00:00Z" },
];

const STATUS_LABELS: Record<string, string> = {
  new: "Mới",
  contacted: "Đã liên hệ",
  qualified: "Đủ điều kiện",
  unqualified: "Không đạt",
  converted: "Đã chuyển đổi",
};

const SOURCE_COLORS: Record<string, string> = {
  facebook: "#1877F2",
  google: "#4285F4",
  tiktok: "#000000",
  telesale: "var(--color-accent)",
};

export default function LeadsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = MOCK_LEADS.filter((l) => {
    const matchSearch =
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.phone.includes(search) ||
      l.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Status counts for filter badges
  const statusCounts = MOCK_LEADS.reduce((acc, l) => {
    acc[l.status] = (acc[l.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Quản Lý Leads</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-muted)" }}>
            {MOCK_LEADS.length} leads trong hệ thống
          </p>
        </div>
        <button className="btn btn-primary">
          <Plus size={16} /> Thêm Lead
        </button>
      </div>

      {/* Status quick filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: "all", label: "Tất cả", count: MOCK_LEADS.length },
          { key: "new", label: "Mới", count: statusCounts["new"] || 0 },
          { key: "contacted", label: "Đã liên hệ", count: statusCounts["contacted"] || 0 },
          { key: "qualified", label: "Đủ điều kiện", count: statusCounts["qualified"] || 0 },
          { key: "unqualified", label: "Không đạt", count: statusCounts["unqualified"] || 0 },
          { key: "converted", label: "Đã chuyển đổi", count: statusCounts["converted"] || 0 },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className={cn(
              "btn btn-sm gap-1.5 transition-all",
              statusFilter === f.key ? "btn-primary" : "btn-outline"
            )}
          >
            {f.label}
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
              style={{
                background: statusFilter === f.key ? "rgba(255,255,255,0.2)" : "var(--color-primary-muted)",
                color: statusFilter === f.key ? "white" : "var(--color-primary)",
              }}
            >
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: "var(--color-muted)" }}
        />
        <input
          className="input pl-9"
          placeholder="Tìm theo tên, SĐT, email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Leads Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Lead</th>
              <th>Liên hệ</th>
              <th>Nguồn</th>
              <th>Trạng thái</th>
              <th>Phân công</th>
              <th>Ngày tạo</th>
              <th style={{ width: "100px" }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((lead) => (
              <tr key={lead.id} className="stagger-item">
                <td>
                  <p className="font-medium">{lead.name}</p>
                </td>
                <td>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-sm">
                      <Phone size={12} style={{ color: "var(--color-muted)" }} />
                      {lead.phone}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--color-muted)" }}>
                      <Mail size={12} />
                      {lead.email}
                    </div>
                  </div>
                </td>
                <td>
                  <span
                    className="badge"
                    style={{
                      background: `${SOURCE_COLORS[lead.source] || "var(--color-muted)"}20`,
                      color: SOURCE_COLORS[lead.source] || "var(--color-muted)",
                    }}
                  >
                    {lead.source}
                  </span>
                </td>
                <td>
                  <span className={cn("badge", getStatusColor(lead.status))}>
                    {STATUS_LABELS[lead.status]}
                  </span>
                </td>
                <td>
                  <span className="text-sm">{lead.assigned_to}</span>
                </td>
                <td className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
                  {formatDate(lead.created_at)}
                </td>
                <td>
                  <div className="flex items-center gap-1">
                    <button className="btn btn-ghost btn-sm p-1.5" title="Chuyển đổi">
                      <ArrowRightCircle size={14} style={{ color: "var(--color-success)" }} />
                    </button>
                    <button className="btn btn-ghost btn-sm p-1.5" title="Sửa">
                      <Edit2 size={14} />
                    </button>
                    <button className="btn btn-ghost btn-sm p-1.5" title="Xóa" style={{ color: "var(--color-danger)" }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

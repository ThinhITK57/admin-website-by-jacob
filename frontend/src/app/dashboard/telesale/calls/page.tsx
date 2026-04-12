"use client";

import { Phone, Clock, User, CheckCircle, XCircle, Search } from "lucide-react";
import { cn, formatDateTime } from "@/lib/utils";
import { useState } from "react";

const MOCK_CALLS = [
  { id: 1, sale: "Trần Thị Sale1", lead: "Khách hàng A", call_time: "2026-04-11T09:30:00Z", duration: 180, result: "answered", note: "Khách quan tâm sản phẩm, hẹn gọi lại" },
  { id: 2, sale: "Trần Thị Sale1", lead: "Khách hàng B", call_time: "2026-04-11T10:15:00Z", duration: 45, result: "no-answer", note: "" },
  { id: 3, sale: "Trần Thị Sale1", lead: "Khách hàng D", call_time: "2026-04-11T11:00:00Z", duration: 320, result: "answered", note: "Đã gửi báo giá qua Zalo" },
  { id: 4, sale: "Nguyễn Văn Leader", lead: "Khách hàng C", call_time: "2026-04-11T14:00:00Z", duration: 0, result: "busy", note: "" },
  { id: 5, sale: "Trần Thị Sale1", lead: "Khách hàng E", call_time: "2026-04-11T15:30:00Z", duration: 95, result: "voicemail", note: "Đã để lại tin nhắn" },
  { id: 6, sale: "Nguyễn Văn Leader", lead: "Khách hàng A", call_time: "2026-04-10T16:00:00Z", duration: 240, result: "answered", note: "Follow up lần 2, khách muốn demo" },
];

const RESULT_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  answered: { label: "Nghe máy", color: "var(--color-success)", bg: "var(--color-success-muted)", icon: CheckCircle },
  "no-answer": { label: "Không nghe", color: "var(--color-danger)", bg: "var(--color-danger-muted)", icon: XCircle },
  busy: { label: "Máy bận", color: "var(--color-warning)", bg: "var(--color-warning-muted)", icon: Phone },
  voicemail: { label: "Hộp thư", color: "var(--color-accent)", bg: "var(--color-accent-muted)", icon: Phone },
};

function formatDuration(seconds: number): string {
  if (seconds === 0) return "—";
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return min > 0 ? `${min}p ${sec}s` : `${sec}s`;
}

export default function CallsPage() {
  const [search, setSearch] = useState("");
  const [filterResult, setFilterResult] = useState("all");

  const filtered = MOCK_CALLS.filter((c) => {
    const matchSearch = c.lead.toLowerCase().includes(search.toLowerCase()) || c.sale.toLowerCase().includes(search.toLowerCase());
    const matchResult = filterResult === "all" || c.result === filterResult;
    return matchSearch && matchResult;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Lịch Sử Cuộc Gọi</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--color-muted)" }}>
          Theo dõi hoạt động telesale
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-muted)" }} />
          <input className="input pl-9" placeholder="Tìm theo lead hoặc sale..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {[
            { key: "all", label: "Tất cả" },
            { key: "answered", label: "Nghe máy" },
            { key: "no-answer", label: "Không nghe" },
            { key: "busy", label: "Máy bận" },
          ].map((f) => (
            <button key={f.key} onClick={() => setFilterResult(f.key)} className={cn("btn btn-sm", filterResult === f.key ? "btn-primary" : "btn-outline")}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Calls table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Nhân viên</th>
              <th>Lead</th>
              <th>Thời gian</th>
              <th>Thời lượng</th>
              <th>Kết quả</th>
              <th>Ghi chú</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((call) => {
              const config = RESULT_CONFIG[call.result];
              const ResultIcon = config?.icon || Phone;
              return (
                <tr key={call.id} className="stagger-item">
                  <td>
                    <div className="flex items-center gap-2">
                      <User size={14} style={{ color: "var(--color-muted)" }} />
                      <span className="font-medium text-sm">{call.sale}</span>
                    </div>
                  </td>
                  <td className="font-medium text-sm">{call.lead}</td>
                  <td>
                    <div className="flex items-center gap-1.5 text-sm" style={{ color: "var(--color-muted-foreground)" }}>
                      <Clock size={12} />
                      {formatDateTime(call.call_time)}
                    </div>
                  </td>
                  <td className="text-sm font-medium">{formatDuration(call.duration)}</td>
                  <td>
                    <span className="badge" style={{ background: config?.bg, color: config?.color }}>
                      <ResultIcon size={12} className="mr-1" />
                      {config?.label}
                    </span>
                  </td>
                  <td>
                    <span className="text-sm" style={{ color: call.note ? "var(--color-foreground)" : "var(--color-muted)" }}>
                      {call.note || "—"}
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

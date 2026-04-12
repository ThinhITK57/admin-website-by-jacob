"use client";

import { useState } from "react";
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit2,
  Trash2,
  Shield,
  X,
} from "lucide-react";
import { cn, getInitials, getStatusColor, formatDate } from "@/lib/utils";

// Mock users data
const MOCK_USERS = [
  { id: 1, name: "Super Admin", email: "admin@company.vn", phone: "0900000001", status: "active", team_name: "", roles: ["super_admin"], created_at: "2026-04-01T08:00:00Z" },
  { id: 2, name: "Nguyễn Văn Leader", email: "leader.sale@company.vn", phone: "0900000002", status: "active", team_name: "Team Sale Telesale 1", roles: ["leader"], created_at: "2026-04-01T08:00:00Z" },
  { id: 3, name: "Trần Thị Sale1", email: "sale1@company.vn", phone: "0900000003", status: "active", team_name: "Team Sale Telesale 1", roles: ["nhan_vien"], created_at: "2026-04-02T08:00:00Z" },
  { id: 4, name: "Lê Văn Ads", email: "ads@company.vn", phone: "0900000004", status: "active", team_name: "Team Marketing Ads", roles: ["nhan_vien"], created_at: "2026-04-02T08:00:00Z" },
  { id: 5, name: "Phạm Thị HR", email: "hr@company.vn", phone: "0900000005", status: "inactive", team_name: "", roles: ["nhan_vien"], created_at: "2026-04-05T08:00:00Z" },
];

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  truong_phong: "Trưởng Phòng",
  leader: "Leader",
  nhan_vien: "Nhân Viên",
};

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredUsers = MOCK_USERS.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || u.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Quản Lý Người Dùng</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-muted)" }}>
            {MOCK_USERS.length} người dùng trong hệ thống
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary"
        >
          <Plus size={16} /> Thêm Người Dùng
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--color-muted)" }}
          />
          <input
            type="text"
            className="input pl-9"
            placeholder="Tìm theo tên, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          {["all", "active", "inactive", "suspended"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "btn btn-sm",
                statusFilter === s ? "btn-primary" : "btn-outline"
              )}
            >
              {s === "all" ? "Tất cả" : s === "active" ? "Hoạt động" : s === "inactive" ? "Tạm dừng" : "Bị khóa"}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Người dùng</th>
              <th>Email</th>
              <th>Vai trò</th>
              <th>Team</th>
              <th>Trạng thái</th>
              <th>Ngày tạo</th>
              <th style={{ width: "60px" }}></th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} className="stagger-item">
                <td>
                  <div className="flex items-center gap-3">
                    <div
                      className="avatar avatar-md text-xs font-semibold"
                      style={{
                        background: "linear-gradient(135deg, var(--color-primary-muted), var(--color-accent-muted))",
                        color: "var(--color-primary)",
                      }}
                    >
                      {getInitials(user.name)}
                    </div>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs" style={{ color: "var(--color-muted)" }}>
                        {user.phone}
                      </p>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="text-sm">{user.email}</span>
                </td>
                <td>
                  {user.roles.map((role) => (
                    <span
                      key={role}
                      className="badge badge-primary mr-1"
                    >
                      <Shield size={10} className="mr-1" />
                      {ROLE_LABELS[role] || role}
                    </span>
                  ))}
                </td>
                <td>
                  <span className="text-sm">
                    {user.team_name || <span style={{ color: "var(--color-muted)" }}>—</span>}
                  </span>
                </td>
                <td>
                  <span className={cn("badge", getStatusColor(user.status))}>
                    {user.status === "active" ? "Hoạt động" : user.status === "inactive" ? "Tạm dừng" : "Bị khóa"}
                  </span>
                </td>
                <td className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
                  {formatDate(user.created_at)}
                </td>
                <td>
                  <div className="flex items-center gap-1">
                    <button className="btn btn-ghost btn-sm p-1.5" title="Chỉnh sửa">
                      <Edit2 size={14} />
                    </button>
                    <button
                      className="btn btn-ghost btn-sm p-1.5"
                      title="Xóa"
                      style={{ color: "var(--color-danger)" }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div
        className="flex items-center justify-between text-sm"
        style={{ color: "var(--color-muted-foreground)" }}
      >
        <span>Hiển thị {filteredUsers.length} / {MOCK_USERS.length} người dùng</span>
        <div className="flex gap-2">
          <button className="btn btn-outline btn-sm" disabled>← Trước</button>
          <button className="btn btn-primary btn-sm">1</button>
          <button className="btn btn-outline btn-sm">Sau →</button>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Thêm Người Dùng Mới</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="btn btn-ghost btn-sm p-1.5"
              >
                <X size={18} />
              </button>
            </div>

            <form className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Họ tên *</label>
                <input className="input" placeholder="Nguyễn Văn A" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email *</label>
                <input className="input" type="email" placeholder="email@company.vn" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mật khẩu *</label>
                  <input className="input" type="password" placeholder="••••••••" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Số điện thoại</label>
                  <input className="input" placeholder="09xxxxxxxx" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Vai trò</label>
                  <select className="input">
                    <option value="nhan_vien">Nhân Viên</option>
                    <option value="leader">Leader</option>
                    <option value="truong_phong">Trưởng Phòng</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Team</label>
                  <select className="input">
                    <option value="">-- Chọn team --</option>
                    <option value="1">Team Sale Telesale 1</option>
                    <option value="2">Team Marketing Ads</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: "var(--color-border)" }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-outline"
                >
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  <Plus size={16} /> Tạo Người Dùng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

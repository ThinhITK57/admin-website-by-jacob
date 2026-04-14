"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit2,
  Trash2,
  Shield,
  X,
  RefreshCw
} from "lucide-react";
import { cn, getInitials, getStatusColor, formatDate } from "@/lib/utils";
import { api } from "@/lib/api-client";

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  truong_phong: "Trưởng Phòng",
  leader: "Leader",
  nhan_vien: "Nhân Viên",
};

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState("all");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    status: "active",
    roles: ["nhan_vien"],
    team_id: ""
  });

  const fetchUsers = async () => {
    setLoading(true);
    const res = await api.get<any>("/users");
    if (res.data?.users) {
      setUsers(res.data.users);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa user này?")) return;
    const res = await api.delete(`/users/${id}`);
    if (res.status === 200 || res.status === 204 || res.data) {
      fetchUsers();
    } else {
      alert("Xóa thất bại!");
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      team_id: formData.team_id ? parseInt(formData.team_id) : undefined,
      role_ids: formData.roles.map((r: string) => {
        if (r === "super_admin" || r === "Admin") return 1;
        if (r === "truong_phong" || r === "Manager") return 2;
        if (r === "leader" || r === "Leader") return 3;
        return 4; // nhan_vien or Sale
      }),
    };
    
    const res = await api.post("/users", payload);
    if (res.data) {
      setShowCreateModal(false);
      fetchUsers();
    } else {
      alert(res.error || "Có lỗi xảy ra khi thêm user");
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    const payload = {
      ...formData,
      team_id: formData.team_id ? parseInt(formData.team_id) : undefined,
      role_ids: formData.roles.map((r: string) => {
        if (r === "super_admin" || r === "Admin") return 1;
        if (r === "truong_phong" || r === "Manager") return 2;
        if (r === "leader" || r === "Leader") return 3;
        return 4; // nhan_vien or Sale
      }),
    };
    
    const res = await api.put(`/users/${editingUser.id}`, payload);
    if (res.data) {
      setShowEditModal(false);
      fetchUsers();
    } else {
      alert(res.error || "Có lỗi xảy ra khi cập nhật user");
    }
  };

  const openCreateModal = () => {
    setFormData({ name: "", email: "", password: "", phone: "", status: "active", roles: ["nhan_vien"], team_id: "" });
    setShowCreateModal(true);
  };

  const openEditModal = (user: any) => {
    setEditingUser(user);
    setFormData({
      name: user.name || "",
      email: user.email || "",
      password: "", // leave blank for no change usually, but requires logic
      phone: user.phone || "",
      status: user.status || "active",
      roles: user.roles?.map((r: any) => r.name || r) || ["nhan_vien"],
      team_id: user.team_id ? String(user.team_id) : ""
    });
    setShowEditModal(true);
  };

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      (u.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(search.toLowerCase());
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
            {users.length} người dùng trong hệ thống
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchUsers} className="btn btn-outline" title="Tải lại">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={openCreateModal}
            className="btn btn-primary"
          >
            <Plus size={16} /> Thêm Người Dùng
          </button>
        </div>
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
            {loading ? (
              <tr><td colSpan={7} className="text-center py-4">Đang tải...</td></tr>
            ) : filteredUsers.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-4">Không có dữ liệu</td></tr>
            ) : filteredUsers.map((user) => (
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
                      {getInitials(user.name || "")}
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
                  {((user.roles || []) as any[]).map((roleObj: any) => {
                     const role = typeof roleObj === "string" ? roleObj : roleObj.name;
                     return (
                      <span
                        key={role}
                        className="badge badge-primary mr-1"
                      >
                        <Shield size={10} className="mr-1" />
                        {ROLE_LABELS[role] || role}
                      </span>
                     )
                  })}
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
                  {user.created_at ? formatDate(user.created_at) : "N/A"}
                </td>
                <td>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEditModal(user)} className="btn btn-ghost btn-sm p-1.5" title="Chỉnh sửa">
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
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

      {/* Modals */}
      {(showCreateModal || showEditModal) && (
        <div className="modal-overlay" onClick={() => { setShowCreateModal(false); setShowEditModal(false); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">{showCreateModal ? "Thêm Người Dùng" : "Sửa Người Dùng"}</h2>
              <button
                onClick={() => { setShowCreateModal(false); setShowEditModal(false); }}
                className="btn btn-ghost btn-sm p-1.5"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={showCreateModal ? handleCreateSubmit : handleEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Họ tên *</label>
                <input required className="input" placeholder="Nguyễn Văn A" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email *</label>
                <input required className="input" type="email" placeholder="email@company.vn" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} disabled={showEditModal} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mật khẩu {showCreateModal ? "*" : ""}</label>
                  <input required={showCreateModal} className="input" type="password" placeholder={showEditModal ? "Để trống nếu không đổi" : "••••••••"} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Số điện thoại</label>
                  <input className="input" placeholder="09xxxxxxxx" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Vai trò</label>
                  <select className="input" value={formData.roles[0]} onChange={(e) => setFormData({...formData, roles: [e.target.value]})}>
                    <option value="nhan_vien">Nhân Viên</option>
                    <option value="leader">Leader</option>
                    <option value="truong_phong">Trưởng Phòng</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Trạng thái</label>
                  <select className="input" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                    <option value="active">Hoạt động</option>
                    <option value="inactive">Tạm dừng</option>
                    <option value="suspended">Bị khóa</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: "var(--color-border)" }}>
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setShowEditModal(false); }}
                  className="btn btn-outline"
                >
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  {showCreateModal ? <><Plus size={16} /> Tạo Mới</> : "Cập Nhật"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

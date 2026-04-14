"use client";

import { useState, useEffect } from "react";
import { Users, Plus, Edit2, Trash2, X } from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { api } from "@/lib/api-client";

export default function TeamsPage() {
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    leader_id: ""
  });

  const fetchTeams = async () => {
    setLoading(true);
    const res = await api.get<any>("/teams");
    if (res.data?.teams) {
      setTeams(res.data.teams);
    }
    setLoading(false);
  };

  const fetchUsers = async () => {
    // Tạm thời lấy tối đa 100 người dùng để chọn leader
    const res = await api.get<any>("/users?pageSize=100");
    if (res.data?.users) {
      setUsers(res.data.users);
    }
  };

  useEffect(() => {
    fetchTeams();
    fetchUsers();
  }, []);

  const openCreateModal = () => {
    setEditingTeam(null);
    setFormData({ name: "", description: "", leader_id: "" });
    setShowModal(true);
  };

  const openEditModal = (team: any) => {
    setEditingTeam(team);
    setFormData({
      name: team.name || "",
      description: team.description || "",
      leader_id: team.leader_id ? String(team.leader_id) : ""
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa team này?")) return;
    const res = await api.delete(`/teams/${id}`);
    if (res.status === 200 || res.status === 204 || res.data) {
      fetchTeams();
    } else {
      alert(res.error || "Xóa thất bại!");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      description: formData.description,
      leader_id: formData.leader_id ? parseInt(formData.leader_id) : undefined
    };

    if (editingTeam) {
      const res = await api.put(`/teams/${editingTeam.id}`, payload);
      if (res.data) {
        setShowModal(false);
        fetchTeams();
      } else {
        alert(res.error || "Có lỗi xảy ra khi cập nhật team");
      }
    } else {
      const res = await api.post("/teams", payload);
      if (res.data) {
        setShowModal(false);
        fetchTeams();
      } else {
        alert(res.error || "Có lỗi xảy ra khi tạo team");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản Lý Team</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-muted)" }}>
            {teams.length} nhóm trong hệ thống
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <Plus size={16} /> Tạo Team
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="skeleton h-48 w-full rounded-xl"></div>
          <div className="skeleton h-48 w-full rounded-xl"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {teams.map((team) => (
             <div key={team.id} className="card card-interactive p-6 stagger-item">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl" style={{ background: "var(--color-primary-muted)" }}>
                    <Users size={20} style={{ color: "var(--color-primary)" }} />
                  </div>
                  <div>
                    <h3 className="font-semibold">{team.name}</h3>
                    <p className="text-xs" style={{ color: "var(--color-muted)" }}>
                      {team.description || "Chưa có mô tả"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openEditModal(team)} className="btn btn-ghost btn-sm p-1.5" title="Sửa">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete(team.id)} className="btn btn-ghost btn-sm p-1.5" style={{ color: "var(--color-danger)" }} title="Xoá">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Leader */}
              <div className="mb-4">
                <p className="text-xs font-medium mb-2" style={{ color: "var(--color-muted)" }}>LEADER</p>
                {team.leader_name ? (
                  <div className="flex items-center gap-2">
                    <div className="avatar avatar-sm shrink-0" style={{ background: "var(--color-success-muted)", color: "var(--color-success)" }}>
                      {getInitials(team.leader_name)}
                    </div>
                    <span className="text-sm font-medium">{team.leader_name}</span>
                  </div>
                ) : (
                  <span className="text-sm" style={{ color: "var(--color-muted)" }}>Chưa gán leader</span>
                )}
              </div>

              {/* Members Data  */}
              <div>
                <p className="text-xs font-medium mb-2" style={{ color: "var(--color-muted)" }}>
                  THÀNH VIÊN ({team.member_count || 0})
                </p>
                {/* Note: In a real app we'd fetch team members. For MVP we display count. */}
              </div>
            </div>
          ))}

          {teams.length === 0 && (
            <div className="col-span-full py-12 text-center" style={{ color: "var(--color-muted)" }}>
              Chưa có nhóm nào. Vui lòng tạo nhóm mới.
            </div>
          )}
        </div>
      )}

      {/* Modal Create/Edit */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">
                {editingTeam ? "Sửa Team" : "Tạo Team Mới"}
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg hover:bg-[var(--color-card-hover)] transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Tên nhóm *</label>
                <input 
                  type="text" 
                  required
                  className="input" 
                  placeholder="Nhập tên nhóm..." 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Mô tả chi tiết</label>
                <textarea 
                  className="input min-h-[100px] resize-y" 
                  placeholder="Mô tả nhóm..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Leader (Trưởng nhóm)</label>
                <select 
                  className="input" 
                  value={formData.leader_id}
                  onChange={(e) => setFormData({...formData, leader_id: e.target.value})}
                >
                  <option value="">-- Chọn Leader --</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} (ID: {u.id})</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingTeam ? "Lưu Thay Đổi" : "Tạo Team"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

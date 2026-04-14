"use client";

import { useState, useEffect, useMemo } from "react";
import { Shield, Check, X as XIcon, Edit2, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api-client";

export default function RolesPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [allPermissions, setAllPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    permission_ids: [] as number[],
  });

  const fetchRoles = async () => {
    setLoading(true);
    const res = await api.get<any>("/roles");
    if (res.data?.roles) {
      setRoles(res.data.roles);
      if (!selectedRoleId && res.data.roles.length > 0) {
        setSelectedRoleId(res.data.roles[0].id);
      }
    }
    setLoading(false);
  };

  const fetchPermissions = async () => {
    const res = await api.get<any>("/permissions");
    if (res.data?.permissions) {
      setAllPermissions(res.data.permissions);
    }
  };

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  const openCreateModal = () => {
    setEditingRole(null);
    setFormData({ name: "", description: "", permission_ids: [] });
    setShowModal(true);
  };

  const openEditModal = (role: any) => {
    setEditingRole(role);
    setFormData({
      name: role.name || "",
      description: role.description || "",
      permission_ids: role.permissions?.map((p: any) => p.id) || [],
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      description: formData.description,
      permission_ids: formData.permission_ids,
    };

    if (editingRole) {
      const res = await api.put(`/roles/${editingRole.id}`, payload);
      if (res.data) {
        setShowModal(false);
        fetchRoles();
      } else {
        alert(res.error || "Có lỗi cập nhật role");
      }
    } else {
      const res = await api.post("/roles", payload);
      if (res.data) {
        setShowModal(false);
        fetchRoles();
      } else {
        alert(res.error || "Có lỗi tạo role");
      }
    }
  };

  const togglePermission = (permId: number) => {
    if (formData.permission_ids.includes(permId)) {
      setFormData({
        ...formData,
        permission_ids: formData.permission_ids.filter((id) => id !== permId),
      });
    } else {
      setFormData({
        ...formData,
        permission_ids: [...formData.permission_ids, permId],
      });
    }
  };

  // Group permissions logically by prefix (e.g., user.view -> user)
  const groupedPermissions = useMemo(() => {
    const groups: { [key: string]: any[] } = {};
    allPermissions.forEach((p) => {
      const parts = p.name.split(".");
      const groupName = parts[0];
      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(p);
    });
    return groups;
  }, [allPermissions]);

  const selectedRoleData = roles.find((r) => r.id === selectedRoleId);
  const selectedRolePermIds = useMemo(() => {
    return selectedRoleData?.permissions?.map((p: any) => p.id) || [];
  }, [selectedRoleData]);

  // Labels for translation (UI aesthetic)
  const groupLabels: Record<string, string> = {
    user: "Người Dùng",
    role: "Vai Trò",
    permission: "Bảo Mật",
    sale: "Telesale",
    campaign: "Chiến Dịch",
    dashboard: "Hệ Thống",
    report: "Báo Cáo",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Phân Quyền (RBAC)</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-muted)" }}>
            Quản lý vai trò và phân quyền chi tiết
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <Plus size={16} /> Tạo Vai Trò
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Role list */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold mb-4 uppercase tracking-wider" style={{ color: "var(--color-muted-foreground)" }}>
            Danh sách vai trò
          </h3>
          {loading ? (
            <div className="skeleton h-20 w-full rounded-lg"></div>
          ) : (
            roles.map((role) => (
              <button
                key={role.id}
                onClick={() => setSelectedRoleId(role.id)}
                className={cn(
                  "w-full text-left p-4 rounded-lg border transition-all duration-200",
                  selectedRoleId === role.id
                    ? "border-[var(--color-primary)] bg-[var(--color-primary-muted)] shadow-sm"
                    : "border-[var(--color-border)] hover:border-[var(--color-border-hover)] bg-[var(--color-card)]"
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="p-2.5 rounded-lg shrink-0"
                    style={{
                      background: selectedRoleId === role.id
                        ? "var(--color-primary)"
                        : "var(--color-primary-muted)",
                    }}
                  >
                    <Shield
                      size={18}
                      style={{
                        color: selectedRoleId === role.id
                          ? "white"
                          : "var(--color-primary)",
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{role.name}</p>
                    <p className="text-xs truncate" style={{ color: "var(--color-muted)" }}>
                      {role.description || "Chưa có mô tả"}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Permission matrix display */}
        <div className="lg:col-span-3">
          {selectedRoleData && (
            <div className="card p-6 min-h-[500px]">
              <div className="flex items-center justify-between mb-8 border-b pb-4" style={{ borderColor: 'var(--color-border)' }}>
                <div>
                  <h3 className="text-xl font-bold">
                    Quyền của <span className="gradient-text">{selectedRoleData.name}</span>
                  </h3>
                  <p className="text-sm mt-1" style={{ color: "var(--color-muted)" }}>
                    Các chức năng mà vai trò này được phép truy cập
                  </p>
                </div>
                <button className="btn btn-outline btn-sm shrink-0" onClick={() => openEditModal(selectedRoleData)}>
                  <Edit2 size={14} /> Chỉnh sửa
                </button>
              </div>

              {/* Grouped permissions styling matched from fe-error-analysis.md */}
              <div className="space-y-8">
                {Object.keys(groupedPermissions).map((groupName) => (
                  <div key={groupName} className="mb-6">
                    <h4
                      className="text-xs font-bold uppercase tracking-wider mb-4 border-l-2 pl-3"
                      style={{ color: "var(--color-muted-foreground)", borderColor: "var(--color-primary)" }}
                    >
                      {groupLabels[groupName] || groupName.toUpperCase()}
                    </h4>
                    <div className="flex flex-wrap gap-3">
                      {groupedPermissions[groupName].map((perm) => {
                        const hasPerm = selectedRolePermIds.includes(perm.id);
                        if (!hasPerm) return null; // Only show active permissions in display mode
                        
                        return (
                          <div
                            key={perm.id}
                            className="px-3.5 py-1.5 rounded-full text-sm flex items-center gap-2 border shadow-sm transition-transform hover:scale-105"
                            style={{
                              background: "var(--color-success-muted)",
                              borderColor: "var(--color-success)",
                              color: "var(--color-success)",
                            }}
                          >
                            <Check size={14} className="shrink-0" />
                            <span className="font-medium whitespace-nowrap">{perm.name}</span>
                          </div>
                        );
                      })}
                      {groupedPermissions[groupName].every((p: any) => !selectedRolePermIds.includes(p.id)) && (
                        <p className="text-sm" style={{ color: "var(--color-muted)" }}>Không có quyền hạn</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Create/Edit */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content !max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">
                {editingRole ? "Sửa Vai Trò" : "Tạo Vai Trò Mới"}
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg hover:bg-[var(--color-card-hover)] transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Tên vai trò *</label>
                  <input 
                    type="text" 
                    required
                    className="input" 
                    placeholder="VD: Director, Manager..." 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Mô tả (Không bắt buộc)</label>
                  <input 
                    type="text" 
                    className="input" 
                    placeholder="Quản lý toàn bộ quyền..." 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-lg font-bold mb-4">Cấp Quyền Hạn (Permissions)</label>
                <div className="space-y-6 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                  {Object.keys(groupedPermissions).map((groupName) => (
                    <div key={groupName} className="p-4 rounded-xl border bg-[var(--color-card-hover)]" style={{ borderColor: "var(--color-border)" }}>
                      <h4 className="text-sm font-semibold uppercase tracking-wider mb-3">
                        {groupLabels[groupName] || groupName.toUpperCase()}
                      </h4>
                      <div className="flex flex-wrap gap-3">
                        {groupedPermissions[groupName].map((perm) => {
                          const isSelected = formData.permission_ids.includes(perm.id);
                          return (
                            <button
                              type="button"
                              key={perm.id}
                              onClick={() => togglePermission(perm.id)}
                              className={cn(
                                "px-3.5 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 border transition-all duration-200",
                                isSelected
                                  ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white shadow-md shadow-indigo-500/20"
                                  : "border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-muted-foreground)] hover:border-[var(--color-primary-muted)] hover:text-white"
                              )}
                            >
                              {isSelected ? <Check size={14} /> : <div className="w-3.5 h-3.5 rounded-full border border-current opacity-50" />}
                              <span>{perm.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingRole ? "Lưu Thay Đổi" : "Tạo Mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

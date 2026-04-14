"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Phone,
  Mail,
  Edit2,
  Trash2,
  ArrowRightCircle,
  X
} from "lucide-react";
import { cn, getStatusColor, formatDate } from "@/lib/utils";
import { api } from "@/lib/api-client";

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
  const [leads, setLeads] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showModal, setShowModal] = useState(false);
  const [editingLead, setEditingLead] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    source: "facebook",
    status: "new",
    assigned_to: "",
    team_id: "",
  });

  const fetchLeads = async () => {
    setLoading(true);
    const res = await api.get<any>("/leads");
    if (res.data?.leads) {
      setLeads(res.data.leads);
    }
    setLoading(false);
  };

  const fetchDependencies = async () => {
    const [usersRes, teamsRes] = await Promise.all([
      api.get<any>("/users?pageSize=100"),
      api.get<any>("/teams?pageSize=100")
    ]);
    if (usersRes.data?.users) setUsers(usersRes.data.users);
    if (teamsRes.data?.teams) setTeams(teamsRes.data.teams);
  };

  useEffect(() => {
    fetchLeads();
    fetchDependencies();
  }, []);

  const openCreateModal = () => {
    setEditingLead(null);
    setFormData({
      name: "", phone: "", email: "", source: "facebook", status: "new", assigned_to: "", team_id: ""
    });
    setShowModal(true);
  };

  const openEditModal = (lead: any) => {
    setEditingLead(lead);
    setFormData({
      name: lead.name || "",
      phone: lead.phone || "",
      email: lead.email || "",
      source: lead.source || "facebook",
      status: lead.status || "new",
      assigned_to: lead.assigned_to ? String(lead.assigned_to) : "",
      team_id: lead.team_id ? String(lead.team_id) : "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa lead này?")) return;
    const res = await api.delete(`/leads/${id}`);
    if (res.status === 200 || res.status === 204 || res.data) {
      fetchLeads();
    } else {
      alert(res.error || "Xóa thất bại!");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      source: formData.source,
      status: formData.status,
      assigned_to: formData.assigned_to ? parseInt(formData.assigned_to) : undefined,
      team_id: formData.team_id ? parseInt(formData.team_id) : undefined,
    };

    if (editingLead) {
      const res = await api.put(`/leads/${editingLead.id}`, payload);
      if (res.data) {
        setShowModal(false);
        fetchLeads();
      } else {
        alert(res.error || "Update lead thất bại");
      }
    } else {
      const res = await api.post("/leads", payload);
      if (res.data) {
        setShowModal(false);
        fetchLeads();
      } else {
        alert(res.error || "Tạo lead thất bại");
      }
    }
  };

  const filtered = leads.filter((l) => {
    const matchSearch =
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.phone.includes(search) ||
      (l.email && l.email.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === "all" || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusCounts = leads.reduce((acc, l) => {
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
            {leads.length} leads trong hệ thống
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <Plus size={16} /> Thêm Lead
        </button>
      </div>

      {/* Status quick filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: "all", label: "Tất cả", count: leads.length },
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
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-8" style={{ color: "var(--color-muted)" }}>
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8" style={{ color: "var(--color-muted)" }}>
                  Không tìm thấy lead nào.
                </td>
              </tr>
            ) : (
              filtered.map((lead) => (
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
                      {lead.email && (
                        <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--color-muted)" }}>
                          <Mail size={12} />
                          {lead.email}
                        </div>
                      )}
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
                      {STATUS_LABELS[lead.status] || lead.status}
                    </span>
                  </td>
                  <td>
                    {lead.assigned_to_name ? (
                      <div>
                        <p className="text-sm">{lead.assigned_to_name}</p>
                        {lead.team_name && (
                          <p className="text-xs" style={{ color: "var(--color-muted)" }}>{lead.team_name}</p>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm" style={{ color: "var(--color-muted)" }}>Chưa có</span>
                    )}
                  </td>
                  <td className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
                    {formatDate(lead.created_at)}
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button className="btn btn-ghost btn-sm p-1.5" title="Sửa" onClick={() => openEditModal(lead)}>
                        <Edit2 size={14} />
                      </button>
                      <button className="btn btn-ghost btn-sm p-1.5" title="Xóa" style={{ color: "var(--color-danger)" }} onClick={() => handleDelete(lead.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Form */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content !max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">
                {editingLead ? "Chỉnh Sửa Lead" : "Thêm Lead Mới"}
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
                <div>
                  <label className="block text-sm font-medium mb-1.5">Tên Lead *</label>
                  <input type="text" required className="input" placeholder="Nguyễn Văn A" 
                    value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Số điện thoại *</label>
                  <input type="text" required className="input" placeholder="098..." 
                    value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Email</label>
                <input type="email" className="input" placeholder="Email (Không bắt buộc)" 
                  value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Nguồn Khách Hàng</label>
                  <select className="input" value={formData.source} onChange={(e) => setFormData({...formData, source: e.target.value})}>
                    <option value="facebook">Facebook Ads</option>
                    <option value="google">Google Ads</option>
                    <option value="tiktok">TikTok</option>
                    <option value="telesale">Tự Tìm Kiếm (Telesale)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Trạng thái</label>
                  <select className="input" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                    <option value="new">Mới</option>
                    <option value="contacted">Đã liên hệ</option>
                    <option value="qualified">Đủ điều kiện</option>
                    <option value="unqualified">Không đạt</option>
                    <option value="converted">Đã chuyển đổi</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Gán cho Nhân Viên</label>
                  <select className="input" value={formData.assigned_to} onChange={(e) => setFormData({...formData, assigned_to: e.target.value})}>
                    <option value="">-- Chưa gán --</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} (ID: {u.id})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Trực thuộc Team</label>
                  <select className="input" value={formData.team_id} onChange={(e) => setFormData({...formData, team_id: e.target.value})}>
                    <option value="">-- Thuộc Team tự do --</option>
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">Hủy</button>
                <button type="submit" className="btn btn-primary">
                  {editingLead ? "Lưu Thay Đổi" : "Tạo Lead"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

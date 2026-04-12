"use client";

import { Users, Plus, Edit2, Trash2 } from "lucide-react";
import { getInitials } from "@/lib/utils";

const MOCK_TEAMS = [
  {
    id: 1,
    name: "Team Sale Telesale 1",
    description: "Đội telesale chuyên lead Facebook",
    leader: "Nguyễn Văn Leader",
    members: ["Nguyễn Văn Leader", "Trần Thị Sale1"],
  },
  {
    id: 2,
    name: "Team Marketing Ads",
    description: "Đội chạy ads Facebook & Google",
    leader: null,
    members: ["Lê Văn Ads"],
  },
];

export default function TeamsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản Lý Team</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-muted)" }}>
            {MOCK_TEAMS.length} nhóm trong hệ thống
          </p>
        </div>
        <button className="btn btn-primary">
          <Plus size={16} /> Tạo Team
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {MOCK_TEAMS.map((team) => (
          <div key={team.id} className="card card-interactive p-6 stagger-item">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl" style={{ background: "var(--color-primary-muted)" }}>
                  <Users size={20} style={{ color: "var(--color-primary)" }} />
                </div>
                <div>
                  <h3 className="font-semibold">{team.name}</h3>
                  <p className="text-xs" style={{ color: "var(--color-muted)" }}>
                    {team.description}
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <button className="btn btn-ghost btn-sm p-1.5"><Edit2 size={14} /></button>
                <button className="btn btn-ghost btn-sm p-1.5" style={{ color: "var(--color-danger)" }}><Trash2 size={14} /></button>
              </div>
            </div>

            {/* Leader */}
            <div className="mb-4">
              <p className="text-xs font-medium mb-2" style={{ color: "var(--color-muted)" }}>LEADER</p>
              {team.leader ? (
                <div className="flex items-center gap-2">
                  <div className="avatar avatar-sm" style={{ background: "var(--color-success-muted)", color: "var(--color-success)" }}>
                    {getInitials(team.leader)}
                  </div>
                  <span className="text-sm font-medium">{team.leader}</span>
                </div>
              ) : (
                <span className="text-sm" style={{ color: "var(--color-muted)" }}>Chưa gán leader</span>
              )}
            </div>

            {/* Members */}
            <div>
              <p className="text-xs font-medium mb-2" style={{ color: "var(--color-muted)" }}>
                THÀNH VIÊN ({team.members.length})
              </p>
              <div className="flex -space-x-2">
                {team.members.map((m, i) => (
                  <div
                    key={m}
                    className="avatar avatar-sm border-2 tooltip"
                    data-tooltip={m}
                    style={{
                      borderColor: "var(--color-card)",
                      background: `hsl(${i * 90 + 200}, 70%, 50%, 0.2)`,
                      color: `hsl(${i * 90 + 200}, 70%, 60%)`,
                      zIndex: team.members.length - i,
                    }}
                  >
                    {getInitials(m)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

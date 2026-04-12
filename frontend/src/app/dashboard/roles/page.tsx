"use client";

import { useState } from "react";
import { Shield, Check, X as XIcon, Edit2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const ROLES = [
  { id: 1, name: "super_admin", label: "Super Admin", description: "Toàn quyền hệ thống", userCount: 1 },
  { id: 2, name: "truong_phong", label: "Trưởng Phòng", description: "Quản lý toàn bộ team", userCount: 0 },
  { id: 3, name: "leader", label: "Leader", description: "Quản lý team mình", userCount: 1 },
  { id: 4, name: "nhan_vien", label: "Nhân Viên", description: "Quyền cơ bản", userCount: 2 },
];

const PERMISSIONS = [
  { group: "Người dùng", items: ["user.view", "user.create", "user.edit", "user.delete"] },
  { group: "Vai trò", items: ["role.view", "role.create", "role.edit", "role.delete", "permission.assign"] },
  { group: "Telesale", items: ["sale.view", "sale.create", "sale.edit", "sale.delete", "sale.report"] },
  { group: "Campaign", items: ["campaign.view", "campaign.create", "campaign.edit", "campaign.delete", "campaign.approve", "campaign.report"] },
  { group: "Hệ thống", items: ["dashboard.view", "report.export", "audit.view"] },
];

const ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: PERMISSIONS.flatMap((g) => g.items),
  truong_phong: PERMISSIONS.flatMap((g) => g.items).filter(
    (p) => !["user.create", "user.delete", "role.create", "role.delete", "permission.assign"].includes(p)
  ),
  leader: ["sale.view", "sale.create", "sale.edit", "sale.report", "campaign.view", "campaign.report", "dashboard.view", "report.export"],
  nhan_vien: ["sale.view", "sale.create", "campaign.view", "dashboard.view"],
};

export default function RolesPage() {
  const [selectedRole, setSelectedRole] = useState<string>("super_admin");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Phân Quyền (RBAC)</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-muted)" }}>
            Quản lý vai trò và phân quyền chi tiết
          </p>
        </div>
        <button className="btn btn-primary">
          <Plus size={16} /> Tạo Vai Trò
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Role list */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold" style={{ color: "var(--color-muted-foreground)" }}>
            Danh sách vai trò
          </h3>
          {ROLES.map((role) => (
            <button
              key={role.id}
              onClick={() => setSelectedRole(role.name)}
              className={cn(
                "w-full text-left p-4 rounded-lg border transition-all duration-200",
                selectedRole === role.name
                  ? "border-[var(--color-primary)] bg-[var(--color-primary-muted)]"
                  : "border-[var(--color-border)] hover:border-[var(--color-border-hover)] bg-[var(--color-card)]"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className="p-2 rounded-lg"
                  style={{
                    background: selectedRole === role.name
                      ? "var(--color-primary)"
                      : "var(--color-primary-muted)",
                  }}
                >
                  <Shield
                    size={16}
                    style={{
                      color: selectedRole === role.name
                        ? "white"
                        : "var(--color-primary)",
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{role.label}</p>
                  <p className="text-xs truncate" style={{ color: "var(--color-muted)" }}>
                    {role.description}
                  </p>
                </div>
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{
                    background: "var(--color-accent-muted)",
                    color: "var(--color-accent)",
                  }}
                >
                  {role.userCount}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Permission matrix */}
        <div className="lg:col-span-3 card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">
              Quyền của{" "}
              <span className="gradient-text">
                {ROLES.find((r) => r.name === selectedRole)?.label}
              </span>
            </h3>
            <button className="btn btn-outline btn-sm">
              <Edit2 size={14} /> Chỉnh sửa
            </button>
          </div>

          <div className="space-y-6">
            {PERMISSIONS.map((group) => (
              <div key={group.group}>
                <h4
                  className="text-xs font-semibold uppercase tracking-wider mb-3"
                  style={{ color: "var(--color-muted)" }}
                >
                  {group.group}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                  {group.items.map((perm) => {
                    const hasPermission = ROLE_PERMISSIONS[selectedRole]?.includes(perm);
                    return (
                      <div
                        key={perm}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all",
                          hasPermission
                            ? "border-[var(--color-success)] bg-[var(--color-success-muted)]"
                            : "border-[var(--color-border)] bg-[var(--color-card)]"
                        )}
                      >
                        <div
                          className="w-5 h-5 rounded flex items-center justify-center shrink-0"
                          style={{
                            background: hasPermission ? "var(--color-success)" : "var(--color-border)",
                          }}
                        >
                          {hasPermission ? (
                            <Check size={12} color="white" />
                          ) : (
                            <XIcon size={10} style={{ color: "var(--color-muted)" }} />
                          )}
                        </div>
                        <span className="text-sm font-mono">{perm}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

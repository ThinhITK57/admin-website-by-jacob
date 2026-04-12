"use client";

import { Settings, User, Lock, Bell, Palette, Database } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useAuthStore } from "@/stores/auth-store";

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const user = useAuthStore((s) => s.user);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Cài Đặt</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--color-muted)" }}>
          Quản lý tài khoản và tùy chỉnh hệ thống
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile */}
        <div className="lg:col-span-2 card p-6">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-6">
            <User size={20} style={{ color: "var(--color-primary)" }} />
            Thông Tin Cá Nhân
          </h2>
          <form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Họ tên</label>
                <input className="input" defaultValue={user?.name} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <input className="input" type="email" defaultValue={user?.email} disabled style={{ opacity: 0.6 }} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Số điện thoại</label>
                <input className="input" placeholder="09xxxxxxxx" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Vai trò</label>
                <input className="input" value={user?.roles?.[0]?.name || ""} disabled style={{ opacity: 0.6 }} />
              </div>
            </div>
            <div className="pt-2">
              <button type="submit" className="btn btn-primary">Lưu thay đổi</button>
            </div>
          </form>
        </div>

        {/* Quick settings */}
        <div className="space-y-4">
          {/* Theme */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
              <Palette size={16} style={{ color: "var(--color-accent)" }} />
              Giao diện
            </h3>
            <div className="flex items-center justify-between">
              <span className="text-sm">Chế độ tối</span>
              <button
                onClick={toggleTheme}
                className="w-12 h-6 rounded-full relative transition-colors duration-200"
                style={{ background: theme === "dark" ? "var(--color-primary)" : "var(--color-border)" }}
              >
                <div
                  className="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all duration-200"
                  style={{ left: theme === "dark" ? "calc(100% - 22px)" : "2px" }}
                />
              </button>
            </div>
          </div>

          {/* Change password */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
              <Lock size={16} style={{ color: "var(--color-warning)" }} />
              Đổi Mật Khẩu
            </h3>
            <div className="space-y-3">
              <input className="input" type="password" placeholder="Mật khẩu hiện tại" />
              <input className="input" type="password" placeholder="Mật khẩu mới" />
              <input className="input" type="password" placeholder="Xác nhận mật khẩu" />
              <button className="btn btn-outline w-full btn-sm">Đổi mật khẩu</button>
            </div>
          </div>

          {/* System info */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <Database size={16} style={{ color: "var(--color-muted)" }} />
              Hệ Thống
            </h3>
            <div className="space-y-2 text-xs" style={{ color: "var(--color-muted-foreground)" }}>
              <div className="flex justify-between">
                <span>Phiên bản</span><span className="font-mono">v1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span>Backend</span><span className="font-mono">gRPC</span>
              </div>
              <div className="flex justify-between">
                <span>Database</span><span className="font-mono">PostgreSQL 16</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

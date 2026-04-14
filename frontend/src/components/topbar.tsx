"use client";

import { Bell, Menu, Moon, Search, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useAuthStore } from "@/stores/auth-store";
import { useUIStore } from "@/stores/ui-store";
import { getInitials } from "@/lib/utils";
import { useState } from "react";

export function Topbar() {
  const { theme, toggleTheme } = useTheme();
  const user = useAuthStore((s) => s.user);
  const setSidebarMobile = useUIStore((s) => s.setSidebarMobile);
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <header
      className="h-16 border-b flex items-center justify-between px-4 lg:px-6 shrink-0 sticky top-0 z-30"
      style={{
        borderColor: "var(--color-border)",
        background: "var(--color-background)",
      }}
    >
      {/* Left: Mobile menu + Search */}
      <div className="flex items-center gap-3 flex-1">
        <button
          onClick={() => setSidebarMobile(true)}
          className="lg:hidden p-2 rounded-lg hover:bg-[var(--color-card)] transition-colors"
        >
          <Menu size={20} style={{ color: "var(--color-muted-foreground)" }} />
        </button>

        {/* Search bar */}
        <div
          className="relative max-w-md w-full hidden sm:block"
          style={{ maxWidth: "400px" }}
        >
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 transition-colors"
            style={{
              color: searchFocused ? "var(--color-primary)" : "var(--color-muted)",
            }}
          />
          <input
            type="text"
            placeholder="Tìm kiếm nhanh... (Ctrl+K)"
            className="input pl-10 pr-4 py-2 text-sm"
            style={{
              background: "var(--color-card)",
              ...(searchFocused
                ? {
                    borderColor: "var(--color-primary)",
                    boxShadow: "0 0 0 2px var(--color-primary-muted)",
                  }
                : {}),
            }}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          <kbd
            className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono rounded"
            style={{
              background: "var(--color-border)",
              color: "var(--color-muted)",
            }}
          >
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right: Theme + Notification + User */}
      <div className="flex items-center gap-3.5">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-lg hover:bg-[var(--color-card)] transition-all duration-200"
          title={theme === "dark" ? "Chế độ sáng" : "Chế độ tối"}
        >
          {theme === "dark" ? (
            <Sun size={18} style={{ color: "var(--color-warning)" }} />
          ) : (
            <Moon size={18} style={{ color: "var(--color-primary)" }} />
          )}
        </button>

        {/* Notifications */}
        <button className="relative p-2.5 rounded-lg hover:bg-[var(--color-card)] transition-all duration-200">
          <Bell size={18} style={{ color: "var(--color-muted-foreground)" }} />
          {/* Unread indicator */}
          <span
            className="absolute top-2 right-2 w-2 h-2 rounded-full animate-pulse"
            style={{ background: "var(--color-danger)" }}
          />
        </button>

        {/* Divider */}
        <div
          className="w-px h-8 mx-1 hidden sm:block"
          style={{ background: "var(--color-border)" }}
        />

        {/* User avatar + info */}
        {user && (
          <div className="flex items-center gap-3 pl-1">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium leading-tight">{user.name}</p>
              <p
                className="text-xs leading-tight"
                style={{ color: "var(--color-muted)" }}
              >
                {user.roles?.[0]?.name === "super_admin"
                  ? "Super Admin"
                  : user.roles?.[0]?.name === "truong_phong"
                  ? "Trưởng Phòng"
                  : user.roles?.[0]?.name === "leader"
                  ? "Leader"
                  : "Nhân Viên"}
              </p>
            </div>
            <div
              className="avatar avatar-md cursor-pointer transition-transform hover:scale-105"
              style={{
                background:
                  "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
                color: "white",
              }}
            >
              {getInitials(user.name)}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

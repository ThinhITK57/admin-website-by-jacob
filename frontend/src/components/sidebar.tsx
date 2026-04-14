"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Shield,
  Phone,
  UserCheck,
  ClipboardList,
  Megaphone,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import { useAuthStore } from "@/stores/auth-store";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  permission?: string;
  children?: { label: string; href: string }[];
}

const NAV_SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: "Tổng Quan",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "Quản Trị",
    items: [
      { label: "Người Dùng", href: "/dashboard/users", icon: Users, permission: "user.view" },
      { label: "Phân Quyền", href: "/dashboard/roles", icon: Shield, permission: "role.view" },
      { label: "Nhóm / Team", href: "/dashboard/teams", icon: UserCheck },
    ],
  },
  {
    title: "Telesale",
    items: [
      { label: "Nhân Viên Sale", href: "/dashboard/telesale/staff", icon: Phone, permission: "sale.view" },
      { label: "Leads", href: "/dashboard/telesale/leads", icon: ClipboardList, permission: "sale.view" },
      { label: "Cuộc Gọi", href: "/dashboard/telesale/calls", icon: Phone, permission: "sale.view" },
    ],
  },
  {
    title: "Marketing",
    items: [
      { label: "Chiến Dịch", href: "/dashboard/marketing/campaigns", icon: Megaphone, permission: "campaign.view" },
      { label: "Báo Cáo Ads", href: "/dashboard/marketing/reports", icon: BarChart3, permission: "campaign.report" },
    ],
  },
  {
    title: "Hệ Thống",
    items: [
      { label: "Cài Đặt", href: "/dashboard/settings", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar, sidebarMobileOpen, setSidebarMobile } = useUIStore();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  return (
    <>
      {/* Mobile overlay */}
      {sidebarMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarMobile(false)}
        />
      )}

      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 z-50 h-screen shrink-0 flex flex-col transition-all duration-300 ease-in-out",
          "border-r border-[var(--color-border)]",
          sidebarCollapsed ? "w-[68px]" : "w-[260px]",
          "-translate-x-full lg:translate-x-0",
          sidebarMobileOpen && "translate-x-0",
        )}
        style={{ background: "var(--color-sidebar)" }}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-[var(--color-border)] shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))" }}
            >
              <Zap size={20} color="white" />
            </div>
            {!sidebarCollapsed && (
              <div className="animate-fadeIn">
                <h1 className="text-sm font-bold gradient-text whitespace-nowrap">
                  Admin CRM
                </h1>
                <p className="text-[10px]" style={{ color: "var(--color-muted)" }}>
                  Mini CRM Platform
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-6">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title}>
              {!sidebarCollapsed && (
                <p
                  className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest"
                  style={{ color: "var(--color-muted)" }}
                >
                  {section.title}
                </p>
              )}
              <div className="space-y-1.5">
                {section.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" && pathname.startsWith(item.href));
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarMobile(false)}
                      className={cn(
                        "flex items-center gap-3.5 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                        "hover:bg-[var(--color-sidebar-hover)]",
                        isActive &&
                          "bg-[var(--color-sidebar-active)] text-[var(--color-primary-hover)]",
                        !isActive && "text-[var(--color-muted-foreground)]",
                        sidebarCollapsed && "justify-center px-0",
                      )}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <Icon
                        size={20}
                        className={cn(
                          "shrink-0 transition-colors",
                          isActive
                            ? "text-[var(--color-primary)]"
                            : "text-[var(--color-muted)]"
                        )}
                      />
                      {!sidebarCollapsed && (
                        <span className="truncate">{item.label}</span>
                      )}
                      {isActive && !sidebarCollapsed && (
                        <div
                          className="ml-auto w-1.5 h-1.5 rounded-full animate-pulse-glow"
                          style={{ background: "var(--color-primary)" }}
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom: User + Collapse */}
        <div className="border-t border-[var(--color-border)] p-3 space-y-2 shrink-0">
          {/* User mini card */}
          {!sidebarCollapsed && user && (
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg animate-fadeIn"
                 style={{ background: "var(--color-sidebar-hover)" }}>
              <div
                className="avatar avatar-sm"
                style={{ background: "var(--color-primary-muted)", color: "var(--color-primary)" }}
              >
                {user.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{user.name}</p>
                <p className="text-[10px] truncate" style={{ color: "var(--color-muted)" }}>
                  {user.roles?.[0]?.name || "User"}
                </p>
              </div>
              <button
                onClick={() => {
                  logout();
                  window.location.href = "/login";
                }}
                className="p-1.5 rounded-md hover:bg-[var(--color-danger-muted)] transition-colors"
                title="Đăng xuất"
              >
                <LogOut size={14} style={{ color: "var(--color-danger)" }} />
              </button>
            </div>
          )}

          {/* Collapse toggle */}
          <button
            onClick={toggleSidebar}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs transition-all",
              "hover:bg-[var(--color-sidebar-hover)]",
              "text-[var(--color-muted-foreground)]",
              "max-lg:hidden",
            )}
          >
            {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            {!sidebarCollapsed && <span>Thu gọn</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

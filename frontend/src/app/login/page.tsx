"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Zap, ArrowRight } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Email hoặc mật khẩu không chính xác");
        setLoading(false);
        return;
      }

      login(
        data.user,
        data.access_token,
        data.refresh_token
      );

      router.push("/dashboard");
    } catch {
      setError("Đã xảy ra lỗi. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "var(--color-background)" }}
    >
      {/* Animated background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-[40%] -left-[20%] w-[600px] h-[600px] rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, var(--color-primary) 0%, transparent 70%)",
            filter: "blur(80px)",
            animation: "pulse-glow 8s ease-in-out infinite",
          }}
        />
        <div
          className="absolute -bottom-[30%] -right-[20%] w-[500px] h-[500px] rounded-full opacity-15"
          style={{
            background: "radial-gradient(circle, var(--color-accent) 0%, transparent 70%)",
            filter: "blur(80px)",
            animation: "pulse-glow 10s ease-in-out infinite 2s",
          }}
        />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(var(--color-foreground) 1px, transparent 1px),
              linear-gradient(90deg, var(--color-foreground) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Login card */}
      <div className="w-full max-w-[420px] animate-scaleIn relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{
              background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
              boxShadow: "var(--shadow-glow)",
            }}
          >
            <Zap size={32} color="white" />
          </div>
          <h1 className="text-2xl font-bold gradient-text">Admin CRM Platform</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--color-muted)" }}>
            Đăng nhập để quản lý hệ thống
          </p>
        </div>

        {/* Form */}
        <div className="card p-6">
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div
                className="px-4 py-3 rounded-lg text-sm animate-fadeIn"
                style={{
                  background: "var(--color-danger-muted)",
                  color: "var(--color-danger)",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                }}
              >
                {error}
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="login-email">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                className="input"
                placeholder="admin@company.vn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="login-password">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  className="input pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-[var(--color-card-hover)] transition-colors"
                >
                  {showPassword ? (
                    <EyeOff size={16} style={{ color: "var(--color-muted)" }} />
                  ) : (
                    <Eye size={16} style={{ color: "var(--color-muted)" }} />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-3 text-sm font-semibold relative overflow-hidden group"
              style={loading ? {} : { boxShadow: "var(--shadow-glow)" }}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                    style={{ animation: "spin 0.6s linear infinite" }}
                  />
                  Đang đăng nhập...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  Đăng nhập
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </div>
              )}
            </button>
          </form>

          {/* Demo accounts hint */}
          <div
            className="mt-6 pt-4 border-t text-center"
            style={{ borderColor: "var(--color-border)" }}
          >
            <p className="text-xs mb-3" style={{ color: "var(--color-muted)" }}>
              Tài khoản demo (mật khẩu: <code className="text-[var(--color-primary)]">password</code>)
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                { label: "Admin", email: "admin@company.vn" },
                { label: "Leader", email: "leader.sale@company.vn" },
                { label: "Sale", email: "sale1@company.vn" },
                { label: "Ads", email: "ads@company.vn" },
              ].map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => {
                    setEmail(acc.email);
                    setPassword("password");
                  }}
                  className="btn btn-ghost btn-sm text-xs"
                >
                  {acc.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

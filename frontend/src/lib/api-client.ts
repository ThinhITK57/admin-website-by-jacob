/**
 * API client for communicating with the backend.
 *
 * Since the browser can't talk gRPC directly, we use Next.js API routes
 * as a REST proxy layer. This client talks to those REST endpoints.
 */

import { useAuthStore } from "@/stores/auth-store";

const API_BASE = "/api";

interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  status: number;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = useAuthStore.getState().accessToken;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      // Handle token expiry
      if (res.status === 401) {
        const refreshed = await tryRefreshToken();
        if (refreshed) {
          // Retry the original request
          return request<T>(endpoint, options);
        }
        useAuthStore.getState().logout();
        window.location.href = "/login";
      }

      return {
        error: data?.message || data?.error || `Error ${res.status}`,
        status: res.status,
      };
    }

    return { data, status: res.status };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Network error",
      status: 0,
    };
  }
}

async function tryRefreshToken(): Promise<boolean> {
  const { refreshToken, setTokens } = useAuthStore.getState();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) return false;

    const data = await res.json();
    setTokens(data.access_token, data.refresh_token);
    return true;
  } catch {
    return false;
  }
}

// Convenience methods
export const api = {
  get: <T>(url: string) => request<T>(url, { method: "GET" }),

  post: <T>(url: string, body?: unknown) =>
    request<T>(url, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(url: string, body?: unknown) =>
    request<T>(url, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(url: string, body?: unknown) =>
    request<T>(url, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(url: string) => request<T>(url, { method: "DELETE" }),
};

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number as Vietnamese currency (VND) */
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return "0 ₫";
  
  // Intl format can sometimes show 00.000 depending on node version and locale if input is tricky.
  // Converting it explicitly to Float fallback and checking helps.
  const numValue = Number(value);
  if (isNaN(numValue) || numValue === 0) return "0 ₫";

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(numValue);
}

/** Format a number with thousands separator */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("vi-VN").format(value);
}

/** Format a percentage */
export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

/** Format a date string to locale */
export function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

/** Format a datetime string */
export function formatDateTime(dateStr: string): string {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/** Get initials from a name */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/** Status badge styling */
export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    active: "badge-success",
    inactive: "badge-warning",
    suspended: "badge-danger",
    new: "badge-primary",
    contacted: "badge-warning",
    qualified: "badge-success",
    unqualified: "badge-danger",
    converted: "badge-primary",
    draft: "badge-warning",
    paused: "badge-warning",
    completed: "badge-success",
    archived: "badge-danger",
    won: "badge-success",
    lost: "badge-danger",
    pending: "badge-warning",
  };
  return map[status] || "badge-primary";
}

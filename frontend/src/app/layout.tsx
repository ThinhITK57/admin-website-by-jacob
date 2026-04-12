import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Admin CRM Platform | Mini CRM cho Sale & Marketing",
  description:
    "Hệ thống Admin trung tâm quản lý đội Sale (Telesale) và Marketing (Ads/Content). Phân quyền RBAC, quản lý Lead, Campaign, và Dashboard tổng quan.",
  keywords: ["CRM", "Admin", "Sale", "Marketing", "Telesale", "Ads"],
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

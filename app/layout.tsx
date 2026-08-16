import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI解决方案进展＋需求收集",
  description: "八月第二周AI产品解决方案、临床测试、落地路径与新需求进展。",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}

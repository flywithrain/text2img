import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PixSpring · AI 文生图",
  description: "AI 图像生成与编辑工具",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}

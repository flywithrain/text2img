import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StepPix · AI 文生图",
  description: "基于 StepFun Step Plan 的 AI 图像生成与编辑工具，一键部署于 Vercel。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className="dark">
      <body>{children}</body>
    </html>
  );
}

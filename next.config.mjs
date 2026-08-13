/** @type {import('next').NextConfig} */
const nextConfig = {
  // 开发和生产使用不同缓存目录，避免 dev 运行时执行 build 导致静态资源 404
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "pg"],
  },
};

export default nextConfig;

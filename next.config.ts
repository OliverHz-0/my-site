import type { NextConfig } from "next";

// 前端是 public/ 下的纯静态原型（index.html + styles/ + scripts/ + fonts/），不经过构建。
// 首页改写到 public/index.html；页面内用 #/overview 这类 hash 路由，不需要服务端路由。
const nextConfig: NextConfig = {
  async rewrites() {
    return {
      beforeFiles: [{ source: "/", destination: "/index.html" }],
    };
  },
};

export default nextConfig;

import type { NextConfig } from "next";

// 前端是 public/ 下的纯静态页面，不经过构建：
// - /     → public/start.html，启动页，点「start working！」进入工作台
// - /desk → public/index.html，工作台，页面内用 #/overview 这类 hash 路由
const nextConfig: NextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/", destination: "/start.html" },
        { source: "/desk", destination: "/index.html" },
      ],
    };
  },
};

export default nextConfig;

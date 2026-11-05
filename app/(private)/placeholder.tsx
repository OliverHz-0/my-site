"use client";

import { useApi } from "@/lib/use-api";

// 骨架占位：显示板块说明，并请求一次接口确认前后端已连通。
export function Placeholder({ title, description, endpoint }: { title: string; description: string; endpoint: string }) {
  const { data, error } = useApi<{ items: unknown[] }>(endpoint);
  return (
    <>
      <h1>{title}</h1>
      <p className="muted">{description}</p>
      {error ? (
        <p className="error">{error}</p>
      ) : (
        <p className="muted">
          <code>GET {endpoint}</code>：{data ? `返回 ${data.items.length} 条样例数据` : "加载中…"}
        </p>
      )}
    </>
  );
}

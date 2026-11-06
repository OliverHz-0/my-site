"use client";

import Link from "next/link";
import { useApi } from "@/lib/use-api";

type Publication = { id: string; title: string; journal: string; publishedAt: string; doi: string };

export default function HomePage() {
  const { data, error } = useApi<{ items: Publication[] }>("/api/public/publications");

  return (
    <main>
      <h1>个人主页</h1>
      <p className="muted">研究方向：AI 与生物医药结合，大模型与实体医疗具身智能产品研发。</p>
      <h2>已发表文章</h2>
      {error && <p className="error">{error}</p>}
      <ul className="list">
        {data?.items.map((p) => (
          <li key={p.id}>
            {p.title}
            <p className="muted">
              {p.journal} · {p.publishedAt} · DOI {p.doi}
            </p>
          </li>
        ))}
      </ul>
      <p>
        <Link href="/dashboard">进入工作区</Link>
      </p>
    </main>
  );
}

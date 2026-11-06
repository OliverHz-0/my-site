"use client";

import Link from "next/link";
import { useApi } from "@/lib/use-api";
import { Icon } from "./(private)/icons";

type Publication = { id: string; title: string; journal: string; publishedAt: string; doi: string };

export default function HomePage() {
  const { data, error } = useApi<{ items: Publication[] }>("/api/public/publications");

  return (
    <div className="ground public">
      <header className="public-bar pill-bar">
        <p className="public-brand">
          <span className="shell-mark" aria-hidden="true" />
          <span>个人主页</span>
        </p>
        <Link className="btn btn--primary" href="/dashboard">
          进入工作区
          <Icon name="arrow" />
        </Link>
      </header>
      <main className="panel public-main">
        <h1>个人主页</h1>
        <p className="muted lead">研究方向：AI 与生物医药结合，大模型与实体医疗具身智能产品研发。</p>
        <h2>已发表文章</h2>
        {error && <p className="error">{error}</p>}
        <ul className="card-list">
          {data?.items.map((p) => (
            <li key={p.id} className="tile">
              <span className="card-list-title">{p.title}</span>
              <span className="tile-meta">
                {p.journal} · {p.publishedAt} · DOI {p.doi}
              </span>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}

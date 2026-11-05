"use client";

import { useApi } from "@/lib/use-api";

type DigestItem = {
  id: string;
  title: string;
  authors: string[];
  journal: string;
  publishedAt: string;
  url: string;
  summaryZh: string;
  whyRelevant: string;
};

export default function DigestPage() {
  const { data, error } = useApi<{ date: string; items: DigestItem[] }>("/api/research/digests");

  return (
    <>
      <h1>每日科研资讯</h1>
      <p className="muted">每天从顶刊精选 5 篇 AI 与生物医药、医疗具身智能相关的文章{data && ` · ${data.date}`}</p>
      {error && <p className="error">{error}</p>}
      {data?.items.length === 0 && <p className="muted">今天还没有推送。</p>}
      <ul className="list">
        {data?.items.map((item) => (
          <li key={item.id}>
            <a href={item.url} target="_blank" rel="noreferrer">{item.title}</a>
            <p className="muted">
              {item.journal} · {item.publishedAt} · {item.authors.join("、")}
            </p>
            <p>{item.summaryZh}</p>
            <p className="muted">{item.whyRelevant}</p>
          </li>
        ))}
      </ul>
    </>
  );
}

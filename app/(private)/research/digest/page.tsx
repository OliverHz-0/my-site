import type { Metadata } from "next";
import { Suspense } from "react";
import { DigestSkeleton } from "./digest-skeleton";
import { DigestView } from "./digest-view";

export const metadata: Metadata = { title: "每日科研资讯" };

export default function DigestPage() {
  return (
    <>
      <h1>每日科研资讯</h1>
      <p className="muted digest-intro">每天从顶刊精选 5 篇 AI 与生物医药、医疗具身智能相关的文章</p>
      {/* DigestView 读取 URL 里的 date，需要 Suspense 边界才能通过生产构建。 */}
      <Suspense
        fallback={
          <>
            <div className="digest-datenav-placeholder" />
            <DigestSkeleton />
          </>
        }
      >
        <DigestView />
      </Suspense>
    </>
  );
}

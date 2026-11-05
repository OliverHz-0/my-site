import Link from "next/link";
import type { ReactNode } from "react";

export default function ResearchLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <nav className="subnav" aria-label="科研区">
        <Link href="/research/digest">每日资讯</Link>
        <Link href="/research/writing">选题与写作</Link>
        <Link href="/research/publications">发表跟踪</Link>
      </nav>
      {children}
    </>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/research/digest", label: "每日资讯" },
  { href: "/research/writing", label: "选题与写作" },
  { href: "/research/publications", label: "发表跟踪" },
];

export function ResearchTabs() {
  const pathname = usePathname();
  return (
    <nav className="subnav pill-tabs" aria-label="科研区">
      {TABS.map((tab) => (
        <Link key={tab.href} href={tab.href} aria-current={pathname === tab.href ? "page" : undefined}>
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}

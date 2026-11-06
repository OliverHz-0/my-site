"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "./icons";
import { LogoutButton } from "./logout-button";

const SECTIONS: { href: string; label: string; icon: IconName; match: (path: string) => boolean }[] = [
  { href: "/dashboard", label: "工作台", icon: "dashboard", match: (p) => p === "/dashboard" },
  { href: "/research/digest", label: "科研区", icon: "research", match: (p) => p.startsWith("/research") },
  { href: "/learning", label: "学习区", icon: "learning", match: (p) => p.startsWith("/learning") },
  { href: "/work", label: "工作区", icon: "work", match: (p) => p.startsWith("/work") },
];

export function ShellNav() {
  const pathname = usePathname();

  return (
    <nav className="shell-nav" aria-label="主导航">
      <p className="shell-brand">
        <span className="shell-mark" aria-hidden="true" />
        <span className="shell-brand-name">个人工作台</span>
      </p>
      <ul className="shell-links">
        {SECTIONS.map((section) => {
          const current = section.match(pathname);
          return (
            <li key={section.href}>
              <Link
                className="shell-link"
                href={section.href}
                aria-current={current ? "page" : undefined}
                title={section.label}
              >
                <Icon name={section.icon} />
                <span className="shell-link-label">{section.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <ul className="shell-links shell-links--end">
        <li>
          <Link className="shell-link" href="/" title="公开主页">
            <Icon name="home" />
            <span className="shell-link-label">公开主页</span>
          </Link>
        </li>
        <li>
          <LogoutButton className="shell-link">
            <Icon name="logout" />
            <span className="shell-link-label">退出登录</span>
          </LogoutButton>
        </li>
      </ul>
    </nav>
  );
}

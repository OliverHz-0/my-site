import Link from "next/link";
import type { ReactNode } from "react";
import { LogoutButton } from "./logout-button";

export default function PrivateLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <nav className="topnav" aria-label="主导航">
        <Link href="/">主页</Link>
        <Link href="/research/digest">科研区</Link>
        <Link href="/learning">学习区</Link>
        <Link href="/work">工作区</Link>
        <span className="spacer" />
        <LogoutButton />
      </nav>
      <main>{children}</main>
    </>
  );
}

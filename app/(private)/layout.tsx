import type { ReactNode } from "react";
import { ShellNav } from "./shell-nav";

// 私人页面共用的外壳：玻璃侧栏导航 + 内容区。工作台自己排版，其余页面放进一块玻璃面板。
export default function PrivateLayout({ children }: { children: ReactNode }) {
  return (
    <div className="shell">
      <a className="skip-link" href="#main">
        跳到正文
      </a>
      <ShellNav />
      <main id="main" className="shell-main">
        <div className="shell-page">{children}</div>
      </main>
    </div>
  );
}

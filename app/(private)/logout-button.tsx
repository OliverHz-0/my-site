"use client";

import type { ReactNode } from "react";

export function LogoutButton({ className, children }: { className?: string; children?: ReactNode }) {
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.assign("/");
  }
  return (
    <button type="button" className={className} onClick={logout} title="退出登录">
      {children ?? "退出登录"}
    </button>
  );
}

"use client";

import { useState, type FormEvent } from "react";

// 只跳转到站内路径，防止 ?next= 被用来跳到外部网站。
function safeNext(): string {
  const next = new URLSearchParams(window.location.search).get("next");
  return next && /^\/(?![/\\])/.test(next) ? next : "/dashboard";
}

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        window.location.assign(safeNext());
        return;
      }
      const body = await res.json().catch(() => null);
      setError(body?.error?.message ?? "登录失败");
    } catch {
      setError("网络错误，请重试");
    }
    setPending(false);
  }

  return (
    <main>
      <h1>登录工作区</h1>
      <form className="login" onSubmit={submit}>
        <label htmlFor="password">密码</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="error" role="alert">{error}</p>}
        <button type="submit" disabled={pending}>{pending ? "登录中…" : "登录"}</button>
      </form>
    </main>
  );
}

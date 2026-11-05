import { NextResponse, type NextRequest } from "next/server";
import { apiError } from "@/lib/api";
import { createSession, passwordMatches, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/auth";

export async function POST(request: NextRequest) {
  if (!process.env.ADMIN_PASSWORD || !process.env.SESSION_SECRET) {
    return apiError(500, "NOT_CONFIGURED", "服务端未配置 ADMIN_PASSWORD 或 SESSION_SECRET");
  }
  const body = await request.json().catch(() => null);
  if (typeof body?.password !== "string") {
    return apiError(400, "INVALID_REQUEST", "缺少 password");
  }
  if (!(await passwordMatches(body.password))) {
    return apiError(401, "INVALID_PASSWORD", "密码错误");
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, await createSession(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return response;
}

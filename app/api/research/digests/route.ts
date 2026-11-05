import type { NextRequest } from "next/server";
import { apiError } from "@/lib/api";
import { listDigests, resolveDigestDate, withDigestDatabase } from "@/lib/research-digests-db";

export const runtime = "nodejs";

export function GET(request: NextRequest) {
  const date = resolveDigestDate(request.nextUrl.searchParams.get("date"));
  if (date === null) return apiError(400, "INVALID_REQUEST", "date 必须是有效的 YYYY-MM-DD 日期");
  try {
    const items = withDigestDatabase((db) => listDigests(db, date));
    return Response.json({ date, items });
  } catch {
    return apiError(500, "INTERNAL_ERROR", "读取每日精选失败");
  }
}

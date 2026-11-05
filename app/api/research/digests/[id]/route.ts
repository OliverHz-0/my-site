import { apiError } from "@/lib/api";
import { setDigestSaved, withDigestDatabase } from "@/lib/research-digests-db";

export const runtime = "nodejs";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const body = await request.json().catch(() => null);
  if (typeof body?.saved !== "boolean") {
    return apiError(400, "INVALID_REQUEST", "saved 必须是布尔值");
  }
  const { id } = await params;
  try {
    const item = withDigestDatabase((db) => setDigestSaved(db, id, body.saved));
    if (!item) return apiError(404, "NOT_FOUND", "每日精选条目不存在");
    return Response.json(item);
  } catch {
    return apiError(500, "INTERNAL_ERROR", "更新收藏失败");
  }
}

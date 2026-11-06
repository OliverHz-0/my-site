import { NextResponse, type NextRequest } from "next/server";
import { apiError } from "@/lib/api";
import { handleMock } from "@/lib/mock-api";

// 未实现的接口都落到这里，返回约定好的样例或进程内存模拟，并带 X-Mock: true 响应头。
async function handle(request: NextRequest) {
  let body: unknown = null;
  if (request.method !== "GET" && request.method !== "DELETE") {
    const raw = await request.text();
    if (raw) {
      try { body = JSON.parse(raw); } catch { return apiError(400, "INVALID_REQUEST", "请求体不是合法的 JSON"); }
    }
  }
  const mock = handleMock(request.method, request.nextUrl.pathname, request.nextUrl.searchParams, body);
  if (!mock) return apiError(404, "NOT_FOUND", "接口不存在");
  return NextResponse.json(mock.body, {
    status: mock.status ?? 200,
    headers: { "X-Mock": "true" },
  });
}

export { handle as GET, handle as POST, handle as PATCH, handle as PUT, handle as DELETE };

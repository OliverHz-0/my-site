import { NextResponse, type NextRequest } from "next/server";
import { apiError } from "@/lib/api";
import { findMock } from "@/lib/mock-api";

// 未实现的接口都落到这里，返回约定好的样例数据，并带 X-Mock: true 响应头。
async function handle(request: NextRequest) {
  // 精选收藏的样例要读请求体；请求体不是合法 JSON 时按缺失处理，由样例接口返回 400。
  const body = request.method === "PATCH" ? await request.json().catch(() => undefined) : undefined;
  const mock = findMock(request.method, request.nextUrl.pathname, {
    query: request.nextUrl.searchParams,
    body,
  });
  if (!mock) return apiError(404, "NOT_FOUND", "接口不存在");
  return NextResponse.json(mock.body, {
    status: mock.status ?? 200,
    headers: { "X-Mock": "true" },
  });
}

export { handle as GET, handle as POST, handle as PATCH, handle as DELETE };

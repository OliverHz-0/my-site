import { NextResponse, type NextRequest } from "next/server";
import { apiError } from "@/lib/api";
import { findMock } from "@/lib/mock-api";

// 未实现的接口都落到这里，返回约定好的样例数据，并带 X-Mock: true 响应头。
function handle(request: NextRequest) {
  const mock = findMock(request.method, request.nextUrl.pathname);
  if (!mock) return apiError(404, "NOT_FOUND", "接口不存在");
  return NextResponse.json(mock.body, {
    status: mock.status ?? 200,
    headers: { "X-Mock": "true" },
  });
}

export { handle as GET, handle as POST, handle as PATCH, handle as DELETE };

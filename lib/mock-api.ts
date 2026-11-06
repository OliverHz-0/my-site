// 占位数据，内容和 docs/API.md 的返回示例一致，全部是虚构样例。
// 某个接口实现后，新建对应的 app/api/.../route.ts 即可：
// Next.js 优先匹配具体路由，这里的条目就不再生效，随后删掉。
type MockResponse = { status?: number; body: unknown };

const draft = {
  id: "dr_1",
  title: "【示例】具身智能在康复医疗中的选题思考",
  stage: "idea",
  content: "这里是 Markdown 正文。",
  updatedAt: "2026-11-05T08:00:00Z",
};

const submission = {
  id: "sb_1",
  title: "【示例】稿件标题",
  journal: "示例期刊",
  status: "under_review",
  submittedAt: "2026-10-01",
  nextAction: "等待审稿意见",
  doi: null,
  isPublic: false,
  updatedAt: "2026-11-05T08:00:00Z",
};

const resource = {
  id: "rs_1",
  type: "tutorial",
  title: "【示例】教程标题",
  url: "https://example.org/tutorial",
  tags: ["大模型"],
  note: "",
  createdAt: "2026-11-05T08:00:00Z",
};




const ok = { body: { ok: true } };
const crud = (path: string, listKey: string, item: unknown): Record<string, MockResponse> => ({
  [`GET ${path}`]: { body: { [listKey]: [item] } },
  [`POST ${path}`]: { status: 201, body: item },
  [`GET ${path}/:id`]: { body: item },
  [`PATCH ${path}/:id`]: { body: item },
  [`DELETE ${path}/:id`]: ok,
});

const routes: Record<string, MockResponse> = {
  "GET /api/public/publications": {
    body: {
      items: [
        { id: "sb_1", title: "【示例】已发表文章", journal: "示例期刊", publishedAt: "2026-06-01", doi: "10.0000/example.2" },
      ],
    },
  },
  ...crud("/api/research/drafts", "items", draft),
  "POST /api/research/drafts/:id/polish": {
    body: { polished: "这是占位的润色结果。", notes: ["这是占位的修改说明。"] },
  },
  ...crud("/api/research/submissions", "items", submission),
  ...crud("/api/learning/resources", "items", resource),
};

export function findMock(method: string, path: string): MockResponse | undefined {
  const segments = path.split("/");
  for (const [key, response] of Object.entries(routes)) {
    const [routeMethod, routePath] = key.split(" ");
    const routeSegments = routePath.split("/");
    if (
      routeMethod === method &&
      routeSegments.length === segments.length &&
      routeSegments.every((s, i) => s === ":id" || s === segments[i])
    ) {
      return response;
    }
  }
  return undefined;
}

// 占位数据，内容和 docs/API.md 的返回示例一致，全部是虚构样例。
// 某个接口实现后，新建对应的 app/api/.../route.ts 即可：
// Next.js 优先匹配具体路由，这里的条目就不再生效，随后删掉。
type MockResponse = { status?: number; body: unknown };
type MockContext = { id: string; query: URLSearchParams; body: unknown };
type MockRoute = MockResponse | ((context: MockContext) => MockResponse);

const mockError = (status: number, code: string, message: string): MockResponse => ({
  status,
  body: { error: { code, message } },
});

// 每日精选样例：11-05 和 11-04 各 5 条，11-03 没有数据，用来覆盖列表和空状态。
// saved 存在进程内存里，PATCH 后真正切换，重启开发服务器后恢复。
const digestsByDate: Record<string, Array<Record<string, unknown> & { id: string; saved: boolean }>> = {
  "2026-11-05": [
    {
      id: "dg_1",
      title: "【示例】面向手术机器人的多模态大模型",
      authors: ["示例作者 A", "示例作者 B"],
      journal: "示例期刊 甲",
      publishedAt: "2026-11-04",
      doi: "10.0000/example.1",
      url: "https://example.org/paper-1",
      summaryZh: "示例摘要：把内镜影像、器械力反馈和手术记录放进同一个模型，用模拟数据比较它对手术步骤的识别效果。",
      whyRelevant: "示例说明：和医疗具身智能方向直接相关，可参考其中多模态数据的对齐方式。",
      saved: false,
    },
    {
      id: "dg_2",
      title: "【示例】蛋白质结构预测模型在小样本靶点上的可靠性评估，以及置信度校准方法在跨家族迁移场景下的比较",
      authors: ["示例作者 C", "示例作者 D", "示例作者 E", "示例作者 F", "示例作者 G", "示例作者 H", "示例作者 I", "示例作者 J"],
      journal: "示例期刊 乙",
      publishedAt: "2026-11-03",
      doi: "10.0000/example.2",
      url: "https://example.org/paper-2",
      summaryZh: "示例摘要：在样本很少的靶点上比较几种置信度校准方法，讨论模型给出高置信度却预测错误的情形，并给出一套筛选流程。文中还列出了每一步需要人工复核的情形，以及不同家族之间迁移时效果下降的幅度。",
      whyRelevant: "示例说明：AI 制药选题常遇到小样本问题，这里的校准思路可以直接借鉴。",
      saved: true,
    },
    {
      id: "dg_3",
      title: "【示例】康复外骨骼的强化学习步态控制",
      authors: ["示例作者 K"],
      journal: "示例期刊 丙",
      publishedAt: "2026-11-02",
      doi: null,
      url: "https://example.org/paper-3",
      summaryZh: "示例摘要：在仿真环境训练步态策略，再迁移到外骨骼样机，记录迁移后需要人工调整的参数。",
      whyRelevant: "示例说明：涉及康复场景下从仿真到实物的迁移，和具身智能选题有关。",
      saved: false,
    },
    {
      id: "dg_4",
      title: "【示例】用于临床试验入组筛选的大模型评测",
      authors: ["示例作者 L", "示例作者 M", "示例作者 N"],
      journal: "示例期刊 甲",
      publishedAt: "2026-11-01",
      doi: "10.0000/example.4",
      url: "https://example.org/paper-4",
      summaryZh: "示例摘要：用虚构病历检验大模型判断入组条件的准确性，并记录它最容易出错的几类条件。",
      whyRelevant: "示例说明：提供了医疗场景大模型评测的指标设计，可用于写作时对照。",
      saved: false,
    },
    {
      id: "dg_5",
      title: "【示例】单细胞数据上的生成模型与药物响应预测",
      authors: ["示例作者 O", "示例作者 P"],
      journal: "示例期刊 丁",
      publishedAt: "2026-10-30",
      doi: "10.0000/example.5",
      url: "https://example.org/paper-5",
      summaryZh: "示例摘要：用生成模型模拟细胞在不同药物作用下的表达变化，并讨论没有见过的药物上的预测效果。",
      whyRelevant: "示例说明：AI 与生物医药交叉方向，可作为药物响应预测的方法参考。",
      saved: false,
    },
  ],
  "2026-11-04": [
    {
      id: "dg_6",
      title: "【示例】腹腔镜视频的自监督表征学习",
      authors: ["示例作者 Q", "示例作者 R"],
      journal: "示例期刊 乙",
      publishedAt: "2026-11-03",
      doi: "10.0000/example.6",
      url: "https://example.org/paper-6",
      summaryZh: "示例摘要：不依赖逐帧标注，从手术视频中学习表征，再用少量标注完成器械分割。",
      whyRelevant: "示例说明：标注成本是手术智能的主要瓶颈，这是可行的替代思路。",
      saved: false,
    },
    {
      id: "dg_7",
      title: "【示例】分子生成模型的可合成性约束",
      authors: ["示例作者 S", "示例作者 T", "示例作者 U"],
      journal: "示例期刊 丁",
      publishedAt: "2026-11-02",
      doi: "10.0000/example.7",
      url: "https://example.org/paper-7",
      summaryZh: "示例摘要：把合成路线的可行性加入生成过程，比较加入前后候选分子的质量和多样性。",
      whyRelevant: "示例说明：关系到 AI 生成分子能否走向实验验证。",
      saved: true,
    },
    {
      id: "dg_8",
      title: "【示例】护理机器人在病房环境中的任务规划",
      authors: ["示例作者 V"],
      journal: "示例期刊 丙",
      publishedAt: "2026-11-01",
      doi: "10.0000/example.8",
      url: "https://example.org/paper-8",
      summaryZh: "示例摘要：在模拟病房里让大模型把口头请求拆成机器人动作，并统计需要人工纠正的次数。",
      whyRelevant: "示例说明：医疗具身智能的落地场景之一，可用于选题对比。",
      saved: false,
    },
    {
      id: "dg_9",
      title: "【示例】医学影像报告生成的事实一致性检查",
      authors: ["示例作者 W", "示例作者 X"],
      journal: "示例期刊 甲",
      publishedAt: "2026-10-31",
      doi: null,
      url: "https://example.org/paper-9",
      summaryZh: "示例摘要：提出一种核对生成报告与影像发现是否一致的流程，用虚构报告测试漏报和错报。",
      whyRelevant: "示例说明：可借鉴其一致性检查方法，用于评估医疗大模型的输出。",
      saved: false,
    },
    {
      id: "dg_10",
      title: "【示例】多组学数据整合的图神经网络方法",
      authors: ["示例作者 Y", "示例作者 Z"],
      journal: "示例期刊 乙",
      publishedAt: "2026-10-29",
      doi: "10.0000/example.10",
      url: "https://example.org/paper-10",
      summaryZh: "示例摘要：用图结构连接不同组学层面的数据，比较它和直接拼接特征的差别。",
      whyRelevant: "示例说明：多组学整合是生物医药 AI 的基础问题，可作为背景阅读。",
      saved: false,
    },
  ],
  "2026-11-03": [],
};

function shanghaiToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai" }).format(new Date());
}

// 既检查格式，也排除 2026-02-30 这样不存在的日期。
function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function getDigests({ query }: MockContext): MockResponse {
  const date = query.get("date") ?? shanghaiToday();
  if (!isValidDate(date)) return mockError(400, "INVALID_REQUEST", "date 必须是有效的 YYYY-MM-DD 日期");
  return { body: { date, items: digestsByDate[date] ?? [] } };
}

function patchDigest({ id, body }: MockContext): MockResponse {
  const saved = (body as { saved?: unknown } | null | undefined)?.saved;
  if (typeof saved !== "boolean") return mockError(400, "INVALID_REQUEST", "saved 必须是布尔值");
  const item = Object.values(digestsByDate).flat().find((candidate) => candidate.id === id);
  if (!item) return mockError(404, "NOT_FOUND", "这条精选不存在");
  item.saved = saved;
  return { body: item };
}

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

const project = {
  id: "pj_1",
  name: "【示例】接单项目",
  client: "示例客户",
  status: "in_progress",
  progress: 40,
  dueDate: "2026-12-01",
  amountCents: 500000,
  updatedAt: "2026-11-05T08:00:00Z",
};

const transaction = {
  id: "tx_1",
  projectId: "pj_1",
  kind: "income",
  amountCents: 200000,
  occurredOn: "2026-11-03",
  note: "【示例】首付款",
};

const reminder = {
  id: "rm_1",
  title: "【示例】回复客户需求确认",
  urgency: "high",
  dueDate: "2026-11-06",
  done: false,
};

const ok = { body: { ok: true } };
const crud = (path: string, listKey: string, item: unknown): Record<string, MockResponse> => ({
  [`GET ${path}`]: { body: { [listKey]: [item] } },
  [`POST ${path}`]: { status: 201, body: item },
  [`GET ${path}/:id`]: { body: item },
  [`PATCH ${path}/:id`]: { body: item },
  [`DELETE ${path}/:id`]: ok,
});

const routes: Record<string, MockRoute> = {
  "GET /api/public/publications": {
    body: {
      items: [
        { id: "sb_1", title: "【示例】已发表文章", journal: "示例期刊", publishedAt: "2026-06-01", doi: "10.0000/example.2" },
      ],
    },
  },
  "GET /api/research/digests": getDigests,
  "PATCH /api/research/digests/:id": patchDigest,
  ...crud("/api/research/drafts", "items", draft),
  "POST /api/research/drafts/:id/polish": {
    body: { polished: "这是占位的润色结果。", notes: ["这是占位的修改说明。"] },
  },
  ...crud("/api/research/submissions", "items", submission),
  ...crud("/api/learning/resources", "items", resource),
  ...crud("/api/work/projects", "items", project),
  ...crud("/api/work/transactions", "items", transaction),
  "GET /api/work/report": {
    body: { month: "2026-11", incomeCents: 200000, expenseCents: 0, netCents: 200000 },
  },
  ...crud("/api/work/reminders", "items", reminder),
};

export function findMock(
  method: string,
  path: string,
  request: { query: URLSearchParams; body?: unknown },
): MockResponse | undefined {
  const segments = path.split("/");
  for (const [key, route] of Object.entries(routes)) {
    const [routeMethod, routePath] = key.split(" ");
    const routeSegments = routePath.split("/");
    if (
      routeMethod === method &&
      routeSegments.length === segments.length &&
      routeSegments.every((s, i) => s === ":id" || s === segments[i])
    ) {
      if (typeof route !== "function") return route;
      const id = decodeURIComponent(segments[routeSegments.indexOf(":id")] ?? "");
      return route({ id, query: request.query, body: request.body });
    }
  }
  return undefined;
}

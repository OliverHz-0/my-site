// 占位数据，内容和 docs/API.md 的返回示例一致，全部是虚构样例。
// 某个接口实现后，新建对应的 app/api/.../route.ts 即可：
// Next.js 优先匹配具体路由，这里的条目就不再生效，随后删掉。
//
// 「任务与项目」「生活区」「个人公司区」三节是进程内存模拟：数据从空白开始，读写行为和 docs/API.md 一致，
// 服务重启后清空。只为前端联调，校验没有全部覆盖。后端真实路由上线后整段删除。
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
  ...crud("/api/work/projects", "items", project),
  ...crud("/api/work/transactions", "items", transaction),
  "GET /api/work/report": {
    body: { month: "2026-11", incomeCents: 200000, expenseCents: 0, netCents: 200000 },
  },
  ...crud("/api/work/reminders", "items", reminder),
};

function matchStatic(method: string, path: string): MockResponse | undefined {
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

// 保留给旧调用方：只查固定样例。
export function findMock(method: string, path: string): MockResponse | undefined {
  return matchStatic(method, path);
}

// ======================= 进程内存模拟：任务、项目、生活区、公司区 =======================

type Json = Record<string, unknown>;
type Task = {
  id: string; title: string; state: string; area: string; projectId: string | null; due: string | null;
  remind: boolean; assignee: string; source: { type: string; id: string } | null;
  createdAt: string; updatedAt: string; completedAt: string | null;
};
type Project = { id: string; name: string; area: string; status: string; due: string | null; createdAt: string; updatedAt: string };
type Weight = { date: string; kg: number; note: string; updatedAt: string };
type Sleep = { date: string; minutes: number; note: string; updatedAt: string };
type Session = { id: string; date: string; kind: string; part: string | null; note: string; createdAt: string };
type Tx = {
  id: string; date: string; type: string; category: string; amountCents: number; note: string; projectId: string | null;
  createdAt: string; updatedAt: string;
};
type Level = { level: string; note: string };
type Lead = {
  id: string; product: string; sourceUrl: string; sourceName: string; observedOn: string;
  signals: { views: Level; searches: Level; sales: Level }; questions: string; nextStep: string; status: string;
  createdAt: string; updatedAt: string;
};
type Store = {
  seq: number; tasks: Task[]; projects: Project[]; weights: Map<string, Weight>; sleep: Map<string, Sleep>;
  cycle: { parts: string[]; updatedAt: string | null }; sessions: Session[]; manualNext: string | null;
  transactions: Tx[]; leads: Lead[];
};

// 开发服务器热更新会重新执行本模块，数据挂在 globalThis 上才不会丢。
const g = globalThis as unknown as { __labDeskMock?: Store };
const db: Store = (g.__labDeskMock ??= {
  seq: 0, tasks: [], projects: [], weights: new Map(), sleep: new Map(),
  cycle: { parts: [], updatedAt: null }, sessions: [], manualNext: null, transactions: [], leads: [],
});

class HttpError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}
const bad = (field: string) => new HttpError(400, "INVALID_REQUEST", `字段不合法：${field}`);
const missing = () => new HttpError(404, "NOT_FOUND", "数据不存在");

const now = () => new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
const nextId = (prefix: string) => `${prefix}_${String(++db.seq).padStart(2, "0")}`;
const shanghai = (d = new Date()) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai" }).format(d);
const today = () => shanghai();
const thisMonth = () => today().slice(0, 7);
const addDays = (d: string, n: number) => new Date(Date.parse(`${d}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
const isDate = (v: unknown): v is string => {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  return new Date(`${v}T00:00:00Z`).toISOString().slice(0, 10) === v;
};
const isMonth = (v: unknown): v is string => typeof v === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(v);
const str = (v: unknown, field: string, { min = 0, max = 2000 } = {}) => {
  if (typeof v !== "string") throw bad(field);
  const s = v.trim();
  if (s.length < min || s.length > max) throw bad(field);
  return s;
};
const optStr = (v: unknown, field: string, fallback = "") => (v === undefined || v === null ? fallback : str(v, field));
const pastDate = (v: unknown, field: string) => {
  if (!isDate(v) || v > today()) throw bad(field);
  return v;
};
const has = (o: Json, k: string) => Object.prototype.hasOwnProperty.call(o, k);

// ---------- 任务与项目 ----------
const TASK_STATES = ["in_progress", "todo", "done", "archived"];
const AREAS = ["research", "life", "company", "personal"];

function checkProject(projectId: unknown, area: string) {
  if (projectId === null || projectId === undefined) return null;
  const p = db.projects.find((x) => x.id === projectId);
  if (!p || p.area !== area) throw bad("projectId");
  return p.id;
}
function writeTask(t: Task, b: Json, creating: boolean) {
  if (creating || has(b, "title")) t.title = str(b.title, "title", { min: 1, max: 200 });
  if (creating || has(b, "area")) { if (!AREAS.includes(b.area as string)) throw bad("area"); t.area = b.area as string; }
  if (has(b, "state")) { if (!TASK_STATES.includes(b.state as string)) throw bad("state"); t.state = b.state as string; }
  if (has(b, "due")) { if (b.due !== null && !isDate(b.due)) throw bad("due"); t.due = b.due as string | null; }
  if (has(b, "remind")) { if (typeof b.remind !== "boolean") throw bad("remind"); t.remind = b.remind; }
  if (has(b, "assignee")) t.assignee = str(b.assignee, "assignee", { min: 1, max: 40 });
  if (has(b, "projectId") || has(b, "area")) t.projectId = checkProject(has(b, "projectId") ? b.projectId : t.projectId, t.area);
  if (has(b, "source")) {
    const s = b.source as Json | null;
    if (s === null) t.source = null;
    else if (creating) {
      if (!s || s.type !== "lead" || !db.leads.some((l) => l.id === s.id)) throw bad("source");
      t.source = { type: "lead", id: s.id as string };
    }
  }
}
function setState(t: Task, before: string) {
  if (t.state === "done" && before !== "done") t.completedAt = now();
  if (t.state !== "done") t.completedAt = null;
}
function listTasks(q: URLSearchParams) {
  let items = db.tasks;
  const area = q.get("area"), projectId = q.get("projectId"), state = q.get("state"), sType = q.get("sourceType"), sId = q.get("sourceId");
  if (area) items = items.filter((t) => t.area === area);
  if (projectId) items = items.filter((t) => t.projectId === projectId);
  if (state) { const set = state.split(","); items = items.filter((t) => set.includes(t.state)); }
  if (sType && sId) items = items.filter((t) => t.source?.type === sType && t.source.id === sId);
  return [...items].sort((a, b) => (a.due === b.due ? b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id) : a.due === null ? 1 : b.due === null ? -1 : a.due.localeCompare(b.due)));
}

// ---------- 生活区 ----------
const range = (q: URLSearchParams) => {
  const to = q.get("to") || today(), from = q.get("from") || addDays(to, -89);
  if (!isDate(from) || !isDate(to)) throw bad(isDate(from) ? "to" : "from");
  return { from, to };
};
const weekStartOf = (d: string) => { const w = new Date(`${d}T00:00:00Z`).getUTCDay(); return addDays(d, -((w + 6) % 7)); };
function weeks(q: URLSearchParams) {
  const n = q.has("weeks") ? Number(q.get("weeks")) : 8;
  if (!Number.isInteger(n) || n < 1 || n > 52) throw bad("weeks");
  const start = weekStartOf(today());
  return [...Array(n)].map((_, i) => addDays(start, (i - n + 1) * 7));
}
const round1 = (v: number) => Math.round(v * 10) / 10;

function trainingPlan() {
  const cycle = db.cycle.parts;
  const workouts = db.sessions.filter((s) => s.kind === "workout").sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));
  const last = workouts[0];
  let next: { part: string; reason: string } | null = null;
  if (db.manualNext) next = { part: db.manualNext, reason: "manual" };
  else if (cycle.length) {
    const inCycle = workouts.find((s) => s.part !== null && cycle.includes(s.part));
    next = inCycle ? { part: cycle[(cycle.indexOf(inCycle.part as string) + 1) % cycle.length], reason: "cycle" } : { part: cycle[0], reason: "start" };
  }
  return { cycle, lastWorkout: last ? { id: last.id, date: last.date, part: last.part } : null, next };
}
function writeSession(s: Session, b: Json, creating: boolean) {
  if (creating || has(b, "date")) s.date = pastDate(b.date, "date");
  if (creating || has(b, "kind")) { if (b.kind !== "workout" && b.kind !== "rest") throw bad("kind"); s.kind = b.kind; }
  if (s.kind === "rest") s.part = null;
  else if (creating || has(b, "part") || has(b, "kind")) s.part = str(has(b, "part") ? b.part : s.part, "part", { min: 1, max: 30 });
  if (has(b, "note")) s.note = optStr(b.note, "note");
}

// ---------- 公司区 ----------
const LEVELS = ["unknown", "low", "medium", "high"];
const LEAD_STATES = ["watching", "validating", "adopted", "dropped"];
function writeTx(t: Tx, b: Json, creating: boolean) {
  if (creating || has(b, "date")) t.date = pastDate(b.date, "date");
  if (creating || has(b, "type")) { if (b.type !== "income" && b.type !== "expense") throw bad("type"); t.type = b.type; }
  if (creating || has(b, "category")) t.category = str(b.category, "category", { min: 1, max: 30 });
  if (creating || has(b, "amountCents")) { if (!Number.isInteger(b.amountCents) || (b.amountCents as number) <= 0) throw bad("amountCents"); t.amountCents = b.amountCents as number; }
  if (has(b, "note")) t.note = optStr(b.note, "note");
  if (has(b, "projectId")) t.projectId = checkProject(b.projectId, "company");
}
function summary(month: string) {
  const rows = db.transactions.filter((t) => t.date.startsWith(month));
  const sum = (type: string) => rows.filter((t) => t.type === type).reduce((s, t) => s + t.amountCents, 0);
  const cats = new Map<string, { type: string; category: string; amountCents: number; count: number }>();
  for (const t of rows) {
    const k = `${t.type} ${t.category}`;
    const c = cats.get(k) ?? { type: t.type, category: t.category, amountCents: 0, count: 0 };
    c.amountCents += t.amountCents; c.count += 1; cats.set(k, c);
  }
  const incomeCents = sum("income"), expenseCents = sum("expense");
  return {
    month, incomeCents, expenseCents, balanceCents: incomeCents - expenseCents, count: rows.length,
    byCategory: [...cats.values()].sort((a, b) => (a.type === b.type ? b.amountCents - a.amountCents : a.type === "income" ? -1 : 1)),
  };
}
const levelOf = (v: unknown, field: string): Level => {
  if (v === undefined || v === null) return { level: "unknown", note: "" };
  const o = v as Json;
  if (typeof o !== "object") throw bad(field);
  const level = o.level === undefined ? "unknown" : o.level;
  if (!LEVELS.includes(level as string)) throw bad(`${field}.level`);
  return { level: level as string, note: optStr(o.note, `${field}.note`) };
};
function writeLead(l: Lead, b: Json, creating: boolean) {
  if (creating || has(b, "product")) l.product = str(b.product, "product", { min: 1, max: 100 });
  if (creating || has(b, "sourceUrl")) {
    const u = optStr(b.sourceUrl, "sourceUrl");
    if (u && !/^https?:\/\/[^\s]+$/i.test(u)) throw bad("sourceUrl");
    l.sourceUrl = u;
  }
  if (creating || has(b, "sourceName")) l.sourceName = optStr(b.sourceName, "sourceName");
  if (creating || has(b, "observedOn")) l.observedOn = pastDate(b.observedOn ?? today(), "observedOn");
  if (creating || has(b, "signals")) {
    const s = (b.signals ?? {}) as Json, prev = l.signals;
    l.signals = {
      views: has(s, "views") || !prev ? levelOf(s.views, "signals.views") : prev.views,
      searches: has(s, "searches") || !prev ? levelOf(s.searches, "signals.searches") : prev.searches,
      sales: has(s, "sales") || !prev ? levelOf(s.sales, "signals.sales") : prev.sales,
    };
  }
  if (creating || has(b, "questions")) l.questions = optStr(b.questions, "questions");
  if (creating || has(b, "nextStep")) l.nextStep = optStr(b.nextStep, "nextStep");
  if (has(b, "status")) { if (!LEAD_STATES.includes(b.status as string)) throw bad("status"); l.status = b.status as string; }
}
const withCount = (l: Lead) => ({
  ...l,
  openTaskCount: db.tasks.filter((t) => t.source?.type === "lead" && t.source.id === l.id && (t.state === "todo" || t.state === "in_progress")).length,
});

// ---------- 路由表 ----------
type Ctx = { params: string[]; query: URLSearchParams; body: Json };
type Handler = (c: Ctx) => MockResponse;
const items = (list: unknown[]) => ({ body: { items: list } });
const created = (v: unknown) => ({ status: 201, body: v });
const find = <T extends { id: string }>(list: T[], id: string) => { const v = list.find((x) => x.id === id); if (!v) throw missing(); return v; };
const remove = <T extends { id: string }>(list: T[], id: string) => { const i = list.findIndex((x) => x.id === id); if (i < 0) throw missing(); list.splice(i, 1); return ok; };

const dynamic: [string, Handler][] = [
  ["GET /api/tasks", ({ query }) => items(listTasks(query))],
  ["POST /api/tasks", ({ body }) => {
    const t = { id: nextId("tk"), title: "", state: "todo", area: "", projectId: null, due: null, remind: false, assignee: "me", source: null, createdAt: now(), updatedAt: now(), completedAt: null } as Task;
    writeTask(t, body, true); setState(t, "todo"); db.tasks.push(t); return created(t);
  }],
  ["GET /api/tasks/:id", ({ params }) => ({ body: find(db.tasks, params[0]) })],
  ["PATCH /api/tasks/:id", ({ params, body }) => {
    const t = find(db.tasks, params[0]), copy = { ...t }, before = t.state;
    writeTask(copy, body, false);
    Object.assign(t, copy, { updatedAt: now() }); setState(t, before); return { body: t };
  }],
  ["DELETE /api/tasks/:id", ({ params }) => remove(db.tasks, params[0])],

  ["GET /api/projects", ({ query }) => items(db.projects.filter((p) => !query.get("area") || p.area === query.get("area")).sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id)))],
  ["POST /api/projects", ({ body }) => {
    if (!AREAS.includes(body.area as string)) throw bad("area");
    const status = body.status ?? "active";
    if (!["active", "paused", "done"].includes(status as string)) throw bad("status");
    if (body.due != null && !isDate(body.due)) throw bad("due");
    const p: Project = { id: nextId("pj"), name: str(body.name, "name", { min: 1, max: 60 }), area: body.area as string, status: status as string, due: (body.due as string) ?? null, createdAt: now(), updatedAt: now() };
    db.projects.push(p); return created(p);
  }],
  ["GET /api/projects/:id", ({ params }) => ({ body: find(db.projects, params[0]) })],
  ["PATCH /api/projects/:id", ({ params, body }) => {
    const p = find(db.projects, params[0]);
    if (has(body, "name")) p.name = str(body.name, "name", { min: 1, max: 60 });
    if (has(body, "status")) { if (!["active", "paused", "done"].includes(body.status as string)) throw bad("status"); p.status = body.status as string; }
    if (has(body, "due")) { if (body.due !== null && !isDate(body.due)) throw bad("due"); p.due = body.due as string | null; }
    p.updatedAt = now(); return { body: p };
  }],
  ["DELETE /api/projects/:id", ({ params }) => {
    const r = remove(db.projects, params[0]);
    for (const t of db.tasks) if (t.projectId === params[0]) t.projectId = null;
    for (const t of db.transactions) if (t.projectId === params[0]) t.projectId = null;
    return r;
  }],

  ["GET /api/life/weights/weekly", ({ query }) => items(weeks(query).map((weekStart) => {
    const end = addDays(weekStart, 6), rows = [...db.weights.values()].filter((w) => w.date >= weekStart && w.date <= end).map((w) => w.kg);
    return rows.length ? { weekStart, avgKg: round1(rows.reduce((a, b) => a + b, 0) / rows.length), minKg: Math.min(...rows), maxKg: Math.max(...rows), count: rows.length } : { weekStart, avgKg: null, minKg: null, maxKg: null, count: 0 };
  }))],
  ["GET /api/life/weights", ({ query }) => { const { from, to } = range(query); return items([...db.weights.values()].filter((w) => w.date >= from && w.date <= to).sort((a, b) => b.date.localeCompare(a.date))); }],
  ["PUT /api/life/weights/:id", ({ params, body }) => {
    const date = pastDate(params[0], "date");
    if (typeof body.kg !== "number" || !(body.kg >= 20 && body.kg <= 300)) throw bad("kg");
    const isNew = !db.weights.has(date), row = { date, kg: round1(body.kg), note: optStr(body.note, "note"), updatedAt: now() };
    db.weights.set(date, row); return { status: isNew ? 201 : 200, body: row };
  }],
  ["DELETE /api/life/weights/:id", ({ params }) => { if (!db.weights.delete(params[0])) throw missing(); return ok; }],
  ["GET /api/life/sleep/weekly", ({ query }) => items(weeks(query).map((weekStart) => {
    const end = addDays(weekStart, 6), rows = [...db.sleep.values()].filter((w) => w.date >= weekStart && w.date <= end).map((w) => w.minutes);
    return { weekStart, avgMinutes: rows.length ? Math.round(rows.reduce((a, b) => a + b, 0) / rows.length) : null, count: rows.length };
  }))],
  ["GET /api/life/sleep", ({ query }) => { const { from, to } = range(query); return items([...db.sleep.values()].filter((w) => w.date >= from && w.date <= to).sort((a, b) => b.date.localeCompare(a.date))); }],
  ["PUT /api/life/sleep/:id", ({ params, body }) => {
    const date = pastDate(params[0], "date");
    if (!Number.isInteger(body.minutes) || (body.minutes as number) < 0 || (body.minutes as number) > 1440) throw bad("minutes");
    const isNew = !db.sleep.has(date), row = { date, minutes: body.minutes as number, note: optStr(body.note, "note"), updatedAt: now() };
    db.sleep.set(date, row); return { status: isNew ? 201 : 200, body: row };
  }],
  ["DELETE /api/life/sleep/:id", ({ params }) => { if (!db.sleep.delete(params[0])) throw missing(); return ok; }],

  ["GET /api/life/training/cycle", () => ({ body: db.cycle })],
  ["PUT /api/life/training/cycle", ({ body }) => {
    const parts = body.parts;
    if (!Array.isArray(parts) || parts.length < 1 || parts.length > 12) throw bad("parts");
    const clean = parts.map((p) => str(p, "parts", { min: 1, max: 30 }));
    if (new Set(clean).size !== clean.length) throw bad("parts");
    db.cycle = { parts: clean, updatedAt: now() }; return { body: db.cycle };
  }],
  ["GET /api/life/training/sessions", ({ query }) => { const { from, to } = range(query); return items(db.sessions.filter((s) => s.date >= from && s.date <= to).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id))); }],
  ["POST /api/life/training/sessions", ({ body }) => {
    const s = { id: nextId("ts"), date: "", kind: "", part: null, note: "", createdAt: now() } as Session;
    writeSession(s, body, true); db.sessions.push(s);
    if (s.kind === "workout") db.manualNext = null;
    return created(s);
  }],
  ["PATCH /api/life/training/sessions/:id", ({ params, body }) => { const s = find(db.sessions, params[0]), copy = { ...s }; writeSession(copy, body, false); Object.assign(s, copy); return { body: s }; }],
  ["DELETE /api/life/training/sessions/:id", ({ params }) => remove(db.sessions, params[0])],
  ["GET /api/life/training/plan", () => ({ body: trainingPlan() })],
  ["PUT /api/life/training/next", ({ body }) => { db.manualNext = str(body.part, "part", { min: 1, max: 30 }); return { body: trainingPlan() }; }],
  ["DELETE /api/life/training/next", () => { db.manualNext = null; return ok; }],

  ["GET /api/company/transactions", ({ query }) => {
    const month = query.get("month") || thisMonth();
    if (!isMonth(month)) throw bad("month");
    const type = query.get("type"), category = query.get("category");
    return items(db.transactions.filter((t) => t.date.startsWith(month) && (!type || t.type === type) && (!category || t.category === category)).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id)));
  }],
  ["POST /api/company/transactions", ({ body }) => {
    const t = { id: nextId("tx"), note: "", projectId: null, createdAt: now(), updatedAt: now() } as Tx;
    writeTx(t, body, true); db.transactions.push(t); return created(t);
  }],
  ["GET /api/company/transactions/:id", ({ params }) => ({ body: find(db.transactions, params[0]) })],
  ["PATCH /api/company/transactions/:id", ({ params, body }) => { const t = find(db.transactions, params[0]), copy = { ...t }; writeTx(copy, body, false); Object.assign(t, copy, { updatedAt: now() }); return { body: t }; }],
  ["DELETE /api/company/transactions/:id", ({ params }) => remove(db.transactions, params[0])],
  ["GET /api/company/finance/summary", ({ query }) => { const m = query.get("month") || thisMonth(); if (!isMonth(m)) throw bad("month"); return { body: summary(m) }; }],
  ["GET /api/company/finance/monthly", ({ query }) => {
    const to = query.get("to") || thisMonth();
    if (!isMonth(to)) throw bad("to");
    const [ty, tm] = to.split("-").map(Number), back = ty * 12 + tm - 1 - 5;
    const from = query.get("from") || `${Math.floor(back / 12)}-${String((back % 12) + 1).padStart(2, "0")}`;
    if (!isMonth(from) || from > to) throw bad("from");
    const out = [];
    let [y, m] = from.split("-").map(Number);
    for (let key = from; key <= to; key = `${y}-${String(m).padStart(2, "0")}`) {
      const { month, incomeCents, expenseCents, balanceCents, count } = summary(key);
      out.push({ month, incomeCents, expenseCents, balanceCents, count });
      if (out.length > 24) throw bad("to");
      if (m === 12) { y += 1; m = 1; } else m += 1;
    }
    return items(out);
  }],

  ["GET /api/company/leads", ({ query }) => {
    const set = query.get("status")?.split(",");
    return items(db.leads.filter((l) => !set || set.includes(l.status)).sort((a, b) => b.observedOn.localeCompare(a.observedOn) || b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id)).map(withCount));
  }],
  ["POST /api/company/leads", ({ body }) => {
    const l = { id: nextId("ld"), status: "watching", createdAt: now(), updatedAt: now() } as Lead;
    writeLead(l, body, true); db.leads.push(l); return created(withCount(l));
  }],
  ["GET /api/company/leads/:id", ({ params }) => ({ body: withCount(find(db.leads, params[0])) })],
  ["PATCH /api/company/leads/:id", ({ params, body }) => { const l = find(db.leads, params[0]), copy = { ...l }; writeLead(copy, body, false); Object.assign(l, copy, { updatedAt: now() }); return { body: withCount(l) }; }],
  ["DELETE /api/company/leads/:id", ({ params }) => remove(db.leads, params[0])],
];

function matchDynamic(method: string, path: string): [Handler, string[]] | undefined {
  const segments = path.replace(/\/+$/, "").split("/");
  for (const [key, handler] of dynamic) {
    const [m, p] = key.split(" ");
    const parts = p.split("/");
    if (m !== method || parts.length !== segments.length) continue;
    const params: string[] = [];
    if (parts.every((s, i) => (s === ":id" ? (params.push(decodeURIComponent(segments[i])), true) : s === segments[i]))) return [handler, params];
  }
  return undefined;
}

// catch-all 路由的入口：先查内存模拟，再查固定样例。
export function handleMock(method: string, path: string, query: URLSearchParams, body: unknown): MockResponse | undefined {
  const hit = matchDynamic(method, path);
  if (hit) {
    try {
      if ((method === "POST" || method === "PATCH" || method === "PUT") && (body === null || typeof body !== "object" || Array.isArray(body))) throw bad("body");
      return hit[0]({ params: hit[1], query, body: (body ?? {}) as Json });
    } catch (e) {
      if (e instanceof HttpError) return { status: e.status, body: { error: { code: e.code, message: e.message } } };
      throw e;
    }
  }
  return matchStatic(method, path);
}

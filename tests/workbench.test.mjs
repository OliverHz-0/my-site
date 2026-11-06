import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, test } from "node:test";
import { DATABASE_VERSION, openDatabase } from "../lib/database.ts";
import { shiftDays, todayShanghai, weekStart, workbenchResponse } from "../lib/workbench-db.ts";

const definitions = [
  ["tasks", "tasks"], ["tasks/[id]", "tasks/:id"],
  ["projects", "projects"], ["projects/[id]", "projects/:id"],
  ["life/weights", "life/weights"], ["life/weights/weekly", "life/weights/weekly"], ["life/weights/[date]", "life/weights/:date"],
  ["life/sleep", "life/sleep"], ["life/sleep/weekly", "life/sleep/weekly"], ["life/sleep/[date]", "life/sleep/:date"],
  ["life/training/cycle", "life/training/cycle"], ["life/training/plan", "life/training/plan"], ["life/training/next", "life/training/next"],
  ["life/training/sessions", "life/training/sessions"], ["life/training/sessions/[id]", "life/training/sessions/:id"],
  ["company/transactions", "company/transactions"], ["company/transactions/[id]", "company/transactions/:id"],
  ["company/finance/summary", "company/finance/summary"], ["company/finance/monthly", "company/finance/monthly"],
  ["company/leads", "company/leads"], ["company/leads/[id]", "company/leads/:id"],
];
const routes = await Promise.all(definitions.map(async ([file, pattern]) => ({
  pattern: pattern.split("/"), handlers: await import(`../app/api/${file}/route.ts`),
})));
const fixedNow = new Date("2026-11-06T04:00:00Z");
let directory;
let previousPath;

beforeEach((t) => {
  directory = mkdtempSync(join(tmpdir(), "workbench-"));
  previousPath = process.env.DATABASE_PATH;
  process.env.DATABASE_PATH = join(directory, "app.db");
  t.mock.timers.enable({ apis: ["Date"], now: fixedNow });
});

afterEach(() => {
  if (previousPath === undefined) delete process.env.DATABASE_PATH;
  else process.env.DATABASE_PATH = previousPath;
  rmSync(directory, { recursive: true, force: true });
});

async function response(method, path, body, raw = false) {
  const url = new URL(`http://localhost/api/${path}`);
  const parts = url.pathname.slice(5).split("/");
  const route = routes.find(({ pattern }) => pattern.length === parts.length && pattern.every((part, i) => part.startsWith(":") || part === parts[i]));
  assert.ok(route, path);
  const params = Object.fromEntries(route.pattern.flatMap((part, i) => part.startsWith(":") ? [[part.slice(1), decodeURIComponent(parts[i])]] : []));
  const request = new Request(url, {
    method, headers: { "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: raw ? body : JSON.stringify(body) }),
  });
  assert.equal(typeof route.handlers[method], "function", `${method} ${path}`);
  return route.handlers[method](request, { params: Promise.resolve(params) });
}

async function call(method, path, body, status = method === "POST" ? 201 : 200) {
  const result = await response(method, path, body);
  const json = await result.json();
  assert.equal(result.status, status, `${method} ${path}: ${JSON.stringify(json)}`);
  assert.equal(result.headers.get("X-Mock"), null);
  return json;
}

async function error(method, path, body, status = 400, field) {
  const result = await response(method, path, body);
  assert.equal(result.status, status, `${method} ${path}: ${await result.clone().text()}`);
  const json = await result.json();
  assert.deepEqual(Object.keys(json), ["error"]);
  assert.deepEqual(Object.keys(json.error).sort(), ["code", "message"]);
  assert.equal(json.error.code, status === 400 ? "INVALID_REQUEST" : status === 404 ? "NOT_FOUND" : "INTERNAL_ERROR");
  if (field) assert.ok(json.error.message.includes(field), json.error.message);
}

const project = (body = {}) => call("POST", "projects", { name: "保温杯", area: "company", ...body });
const task = (body = {}) => call("POST", "tasks", { title: "询价", area: "company", ...body });
const lead = (body = {}) => call("POST", "company/leads", { product: "折叠杯", ...body });
const transaction = (body = {}) => call("POST", "company/transactions", { date: "2026-11-05", type: "expense", category: "样品", amountCents: 12900, ...body });
const session = (body = {}) => call("POST", "life/training/sessions", { date: "2026-11-05", kind: "workout", part: "胸", ...body });
const getPlan = () => call("GET", "life/training/plan");

test("backfilled weight appears in history and weekly trend; PUT rounds and overwrites", async () => {
  const saved = await call("PUT", "life/weights/2026-11-03", { kg: 68.46, note: "补记", unknown: true }, 201);
  assert.deepEqual(saved, { date: "2026-11-03", kg: 68.5, note: "补记", updatedAt: fixedNow.toISOString() });
  assert.deepEqual((await call("GET", "life/weights")).items, [saved]);
  assert.deepEqual((await call("GET", "life/weights/weekly?weeks=1")).items, [{ weekStart: "2026-11-02", avgKg: 68.5, minKg: 68.5, maxKg: 68.5, count: 1 }]);
  await call("PUT", "life/weights/2026-11-03", { kg: 68.1 });
  await call("PUT", "life/weights/2026-11-04", { kg: 68.4 }, 201);
  assert.deepEqual((await call("GET", "life/weights/weekly?weeks=1")).items[0], { weekStart: "2026-11-02", avgKg: 68.3, minKg: 68.1, maxKg: 68.4, count: 2 });
  await call("DELETE", "life/weights/2026-11-03");
  assert.equal((await call("GET", "life/weights/weekly?weeks=1")).items[0].count, 1);
});

test("correcting old sleep updates the dated record and weekly statistics", async () => {
  await call("PUT", "life/sleep/2026-10-28", { minutes: 300 }, 201);
  await call("PUT", "life/sleep/2026-10-29", { minutes: 445 }, 201);
  const corrected = await call("PUT", "life/sleep/2026-10-28", { minutes: 480, note: "更正" });
  assert.deepEqual((await call("GET", "life/sleep?from=2026-10-28&to=2026-10-28")).items, [corrected]);
  assert.deepEqual((await call("GET", "life/sleep/weekly?weeks=2")).items, [{ weekStart: "2026-10-26", avgMinutes: 463, count: 2 }, { weekStart: "2026-11-02", avgMinutes: null, count: 0 }]);
  await call("DELETE", "life/sleep/2026-10-29");
  assert.equal((await call("GET", "life/sleep/weekly?weeks=2")).items[0].avgMinutes, 480);
});

test("Monday weeks include empty weeks with null values and cross calendar years", async (t) => {
  t.mock.timers.setTime(new Date("2027-01-03T12:00:00Z").getTime());
  await call("PUT", "life/weights/2026-12-27", { kg: 70 }, 201);
  await call("PUT", "life/weights/2027-01-01", { kg: 71 }, 201);
  const weights = (await call("GET", "life/weights/weekly?weeks=3")).items;
  assert.deepEqual(weights.map((row) => [row.weekStart, row.avgKg, row.count]), [["2026-12-14", null, 0], ["2026-12-21", 70, 1], ["2026-12-28", 71, 1]]);
  assert.deepEqual(weights[0], { weekStart: "2026-12-14", avgKg: null, minKg: null, maxKg: null, count: 0 });
  assert.deepEqual((await call("GET", "life/sleep/weekly?weeks=1")).items, [{ weekStart: "2026-12-28", avgMinutes: null, count: 0 }]);
  t.mock.timers.setTime(new Date("2027-01-03T16:00:00Z").getTime());
  assert.equal((await call("GET", "life/sleep/weekly?weeks=1")).items[0].weekStart, "2027-01-04");
  assert.equal((await call("GET", "life/weights/weekly")).items.length, 8);
  assert.equal((await call("GET", "life/sleep/weekly?weeks=52")).items.length, 52);
});

test("all dated life histories default to an inclusive 90-day range and sort descending", async () => {
  for (const [date, expected] of [["2026-08-08", false], ["2026-08-09", true], ["2026-11-06", true]]) {
    await call("PUT", `life/weights/${date}`, { kg: 70 }, 201);
    await call("PUT", `life/sleep/${date}`, { minutes: 400 }, 201);
    await session({ date });
    if (expected) assert.ok(date >= shiftDays("2026-11-06", -89));
  }
  for (const path of ["life/weights", "life/sleep", "life/training/sessions"]) {
    assert.deepEqual((await call("GET", path)).items.map((row) => row.date), ["2026-11-06", "2026-08-09"]);
    assert.equal((await call("GET", `${path}?from=2026-08-08&to=2026-11-06`)).items.length, 3);
  }
});

test("training completion advances actual parts, rest preserves plan, and off-cycle workouts permit manual next", async () => {
  assert.deepEqual(await call("GET", "life/training/cycle"), { parts: [], updatedAt: null });
  assert.deepEqual(await getPlan(), { cycle: [], lastWorkout: null, next: null });
  const cycle = ["胸", "背", "腿"];
  assert.deepEqual(await call("PUT", "life/training/cycle", { parts: cycle }), { parts: cycle, updatedAt: fixedNow.toISOString() });
  assert.deepEqual((await getPlan()).next, { part: "胸", reason: "start" });
  const workout = await session({ part: "背" });
  assert.deepEqual(await getPlan(), { cycle, lastWorkout: { id: workout.id, date: workout.date, part: "背" }, next: { part: "腿", reason: "cycle" } });
  const rest = await session({ kind: "rest", part: null });
  assert.equal(rest.part, null);
  assert.deepEqual((await getPlan()).next, { part: "腿", reason: "cycle" });
  const outside = await session({ part: "游泳", date: "2026-11-06" });
  assert.equal((await getPlan()).lastWorkout.id, outside.id);
  assert.deepEqual((await getPlan()).next, { part: "腿", reason: "cycle" });
  assert.deepEqual((await call("PUT", "life/training/next", { part: "肩" })).next, { part: "肩", reason: "manual" });
  await session({ kind: "rest", part: null, date: "2026-11-06" });
  assert.equal((await getPlan()).next.reason, "manual");
  await session({ part: "腿", date: "2026-11-06" });
  assert.deepEqual((await getPlan()).next, { part: "胸", reason: "cycle" });
  await call("PUT", "life/training/next", { part: "背" });
  assert.deepEqual(await call("DELETE", "life/training/next"), { ok: true });
  assert.deepEqual(await call("DELETE", "life/training/next"), { ok: true });
});

test("manual next works before a cycle is configured and the next workout consumes it", async () => {
  assert.deepEqual((await call("PUT", "life/training/next", { part: "散步" })).next, { part: "散步", reason: "manual" });
  await session({ part: "散步" });
  assert.equal((await getPlan()).next, null);
});

test("training correction, deletion, date ordering and cycle changes recompute from stored workouts", async (t) => {
  await call("PUT", "life/training/cycle", { parts: ["胸", "背", "腿"] });
  const recent = await session({ date: "2026-11-05", part: "背" });
  t.mock.timers.tick(1);
  const backfill = await session({ date: "2026-11-01", part: "腿" });
  assert.equal((await getPlan()).lastWorkout.id, recent.id);
  await call("PATCH", `life/training/sessions/${recent.id}`, { part: "腿" });
  assert.equal((await getPlan()).next.part, "胸");
  await call("PATCH", `life/training/sessions/${recent.id}`, { kind: "rest" });
  assert.equal((await getPlan()).lastWorkout.id, backfill.id);
  await call("DELETE", `life/training/sessions/${backfill.id}`);
  assert.deepEqual((await getPlan()).next, { part: "胸", reason: "start" });
  const first = await session({ part: "胸" });
  t.mock.timers.tick(1);
  const second = await session({ part: "背" });
  assert.equal((await getPlan()).lastWorkout.id, second.id);
  assert.deepEqual((await call("GET", "life/training/sessions")).items.slice(0, 2).map((row) => row.id), [second.id, first.id]);
  await call("PUT", "life/training/cycle", { parts: ["背", "胸"] });
  assert.equal((await getPlan()).next.part, "胸");
  await call("DELETE", `life/training/sessions/${second.id}`);
  assert.equal((await getPlan()).next.part, "背");
});

test("new and corrected transactions recompute month, categories and details", async () => {
  const expense = await transaction();
  await transaction({ type: "income", amountCents: 300000, category: "咨询" });
  await transaction({ amountCents: 500, category: "运费" });
  assert.deepEqual(await call("GET", "company/finance/summary"), { month: "2026-11", incomeCents: 300000, expenseCents: 13400, balanceCents: 286600, count: 3, byCategory: [{ type: "income", category: "咨询", amountCents: 300000, count: 1 }, { type: "expense", category: "样品", amountCents: 12900, count: 1 }, { type: "expense", category: "运费", amountCents: 500, count: 1 }] });
  const corrected = await call("PATCH", `company/transactions/${expense.id}`, { amountCents: 9900, category: "运费" });
  assert.deepEqual(await call("GET", `company/transactions/${expense.id}`), corrected);
  assert.equal((await call("GET", "company/finance/summary")).expenseCents, 10400);
  assert.equal((await call("GET", "company/transactions?type=expense&category=运费")).items.length, 2);
  await call("PATCH", `company/transactions/${expense.id}`, { date: "2026-10-31" });
  assert.equal((await call("GET", "company/finance/summary")).expenseCents, 500);
  assert.equal((await call("GET", "company/finance/summary?month=2026-10")).expenseCents, 9900);
  await call("DELETE", `company/transactions/${expense.id}`);
  assert.equal((await call("GET", "company/finance/summary?month=2026-10")).count, 0);
});

test("monthly finance returns zero months, six defaults, explicit bounds and at most 24 months", async () => {
  assert.deepEqual(await call("GET", "company/finance/summary?month=2026-01"), { month: "2026-01", incomeCents: 0, expenseCents: 0, balanceCents: 0, count: 0, byCategory: [] });
  const defaultMonths = (await call("GET", "company/finance/monthly")).items;
  assert.deepEqual(defaultMonths.map((row) => row.month), ["2026-06", "2026-07", "2026-08", "2026-09", "2026-10", "2026-11"]);
  assert.deepEqual(defaultMonths[0], { month: "2026-06", incomeCents: 0, expenseCents: 0, balanceCents: 0, count: 0 });
  assert.equal((await call("GET", "company/finance/monthly?to=2026-02")).items[0].month, "2025-09");
  assert.equal((await call("GET", "company/finance/monthly?from=2026-10")).items.length, 2);
  assert.equal((await call("GET", "company/finance/monthly?from=2024-12&to=2026-11")).items.length, 24);
  await error("GET", "company/finance/monthly?from=2024-11&to=2026-11");
  await error("GET", "company/finance/monthly?from=2026-12&to=2026-11");
});

test("lead keeps the source URL and becomes a shared task, with a single completion reflected in both filters", async () => {
  const companyProject = await project();
  const source = await lead({ sourceUrl: "https://example.com/item/123?from=list", sourceName: "平台", nextStep: "联系供应商", signals: { views: { level: "high", note: "前20" } } });
  assert.equal((await call("GET", `company/leads/${source.id}`)).sourceUrl, "https://example.com/item/123?from=list");
  assert.deepEqual(source.signals, { views: { level: "high", note: "前20" }, searches: { level: "unknown", note: "" }, sales: { level: "unknown", note: "" } });
  const created = await task({ title: source.nextStep, projectId: companyProject.id, source: { type: "lead", id: source.id } });
  const filter = `tasks?area=company&projectId=${companyProject.id}&state=todo,in_progress&sourceType=lead&sourceId=${source.id}`;
  assert.deepEqual((await call("GET", filter)).items, [created]);
  assert.deepEqual((await call("GET", "tasks")).items, [created]);
  assert.equal((await call("GET", `company/leads/${source.id}`)).openTaskCount, 1);
  const completed = await call("PATCH", `tasks/${created.id}`, { state: "done" });
  assert.equal(completed.completedAt, fixedNow.toISOString());
  assert.deepEqual((await call("GET", `tasks?area=company&sourceType=lead&sourceId=${source.id}`)).items, [completed]);
  assert.deepEqual((await call("GET", "tasks")).items, [completed]);
  assert.equal((await call("GET", `company/leads/${source.id}`)).openTaskCount, 0);
  assert.equal((await call("GET", filter)).items.length, 0);
});

test("task completion is idempotent, clears on reopening and ignores server/unknown fields", async (t) => {
  const created = await task({ state: "done", due: "2027-01-01", completedAt: "fake", unknown: 1, id: "client" });
  assert.notEqual(created.id, "client");
  assert.equal(created.completedAt, fixedNow.toISOString());
  assert.equal(created.assignee, "me");
  t.mock.timers.tick(1000);
  const repeated = await call("PATCH", `tasks/${created.id}`, { state: "done" });
  assert.equal(repeated.completedAt, created.completedAt);
  const reopened = await call("PATCH", `tasks/${created.id}`, { state: "in_progress", createdAt: "fake" });
  assert.equal(reopened.completedAt, null);
  assert.equal(reopened.createdAt, created.createdAt);
  assert.equal(reopened.updatedAt, "2026-11-06T04:00:01.000Z");
  assert.deepEqual(await call("GET", `tasks/${created.id}`), reopened);
  await call("DELETE", `tasks/${created.id}`);
  assert.deepEqual((await call("GET", "tasks")).items, []);
});

test("tasks sort by due then creation, projects by creation, and filters combine", async (t) => {
  const firstProject = await project();
  t.mock.timers.tick(1);
  const secondProject = await project({ name: "其他" });
  const noDue = await task({ projectId: firstProject.id });
  const later = await task({ due: "2026-12-01", state: "in_progress", projectId: firstProject.id });
  t.mock.timers.tick(1);
  const earliest = await task({ due: "2026-11-01", area: "life" });
  const tied = await task({ due: "2026-12-01" });
  assert.deepEqual((await call("GET", "tasks")).items.map((row) => row.id), [earliest.id, tied.id, later.id, noDue.id]);
  assert.deepEqual((await call("GET", `tasks?area=company&projectId=${firstProject.id}&state=todo,in_progress`)).items.map((row) => row.id), [later.id, noDue.id]);
  assert.deepEqual((await call("GET", "projects?area=company")).items.map((row) => row.id), [secondProject.id, firstProject.id]);
  const changed = await call("PATCH", `projects/${firstProject.id}`, { status: "paused", due: "2027-02-01" });
  assert.deepEqual(await call("GET", `projects/${firstProject.id}`), changed);
});

test("project deletion nulls references in tasks and transactions; lead deletion preserves task source", async () => {
  const p = await project();
  const l = await lead();
  const t = await task({ projectId: p.id, source: { type: "lead", id: l.id } });
  const tx = await transaction({ projectId: p.id });
  await error("PATCH", `projects/${p.id}`, { area: "life" }, 400, "area");
  await call("DELETE", `projects/${p.id}`);
  assert.equal((await call("GET", `tasks/${t.id}`)).projectId, null);
  assert.equal((await call("GET", `company/transactions/${tx.id}`)).projectId, null);
  await call("DELETE", `company/leads/${l.id}`);
  assert.deepEqual((await call("GET", `tasks/${t.id}`)).source, { type: "lead", id: l.id });
  assert.equal((await call("PATCH", `tasks/${t.id}`, { state: "done" })).state, "done");
  assert.equal((await call("GET", `tasks?sourceType=lead&sourceId=${l.id}`)).items.length, 1);
});

test("lead updates preserve other signals, counts only open states and filters multiple statuses", async () => {
  const l = await lead({ signals: { views: { level: "high", note: "榜单" } } });
  const changed = await call("PATCH", `company/leads/${l.id}`, { status: "validating", signals: { sales: { level: "medium" } } });
  assert.equal(changed.signals.views.note, "榜单");
  assert.equal(changed.signals.sales.level, "medium");
  for (const state of ["todo", "in_progress", "done", "archived"]) await task({ state, source: { type: "lead", id: l.id } });
  assert.equal((await call("GET", `company/leads/${l.id}`)).openTaskCount, 2);
  await lead({ product: "其他", status: "dropped", observedOn: "2026-11-01" });
  assert.equal((await call("GET", "company/leads?status=watching,validating")).items.length, 1);
  assert.deepEqual((await call("GET", "company/leads")).items.map((row) => row.observedOn), ["2026-11-06", "2026-11-01"]);
});

test("Shanghai today/month boundaries and injected clocks drive defaults", async (t) => {
  assert.equal(todayShanghai(new Date("2026-12-31T15:59:59Z")), "2026-12-31");
  assert.equal(todayShanghai(new Date("2026-12-31T16:00:00Z")), "2027-01-01");
  assert.equal(weekStart("2027-01-01"), "2026-12-28");
  const injected = await workbenchResponse("summary", new Request("http://localhost/api/company/finance/summary"), undefined, () => new Date("2026-12-31T16:00:00Z"));
  assert.equal((await injected.json()).month, "2027-01");
  t.mock.timers.setTime(new Date("2026-11-05T15:59:59Z").getTime());
  await error("PUT", "life/weights/2026-11-06", { kg: 70 });
  t.mock.timers.tick(1000);
  await call("PUT", "life/weights/2026-11-06", { kg: 70 }, 201);
  assert.equal((await lead()).observedOn, "2026-11-06");
});

test("migration keeps an unversioned legacy digest table and data, then reopens at v2", () => {
  const path = process.env.DATABASE_PATH;
  let db = new DatabaseSync(path);
  db.exec(`CREATE TABLE research_digests (
    id TEXT PRIMARY KEY, date TEXT NOT NULL, position INTEGER NOT NULL, title TEXT NOT NULL,
    authors TEXT NOT NULL, journal TEXT NOT NULL, publishedAt TEXT NOT NULL, doi TEXT,
    url TEXT NOT NULL, summaryZh TEXT NOT NULL, whyRelevant TEXT NOT NULL, saved INTEGER NOT NULL
  )`);
  db.prepare("INSERT INTO research_digests VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run("legacy", "2026-11-01", 1, "保留", "[]", "期刊", "2026-11-01", null, "https://example.org", "摘要", "理由", 1);
  const original = db.prepare("SELECT * FROM research_digests").all();
  db.close();
  for (let i = 0; i < 2; i++) {
    db = openDatabase();
    assert.deepEqual(db.prepare("SELECT * FROM research_digests").all(), original);
    assert.equal(db.prepare("PRAGMA user_version").get().user_version, DATABASE_VERSION);
    assert.equal(db.prepare("PRAGMA foreign_keys").get().foreign_keys, 1);
    assert.equal(db.prepare("PRAGMA busy_timeout").get().timeout, 5000);
    assert.equal(db.prepare("SELECT COUNT(*) AS count FROM tasks").get().count, 0);
    db.close();
  }
});

test("seeding only resets digests and leaves all user tables unchanged", async () => {
  const p = await project();
  const l = await lead();
  await task({ projectId: p.id, source: { type: "lead", id: l.id } });
  await transaction({ projectId: p.id });
  await call("PUT", "life/weights/2026-11-01", { kg: 70 }, 201);
  await call("PUT", "life/sleep/2026-11-01", { minutes: 400 }, 201);
  await call("PUT", "life/training/cycle", { parts: ["胸", "背"] });
  await session();
  await call("PUT", "life/training/next", { part: "肩" });
  function snapshot() {
    const db = openDatabase();
    try { return Object.fromEntries(["tasks", "projects", "life_weights", "life_sleep", "training_config", "training_sessions", "company_transactions", "company_leads"].map((table) => [table, db.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all()])); }
    finally { db.close(); }
  }
  const before = snapshot();
  execFileSync(process.execPath, ["scripts/seed.mjs"], { env: process.env });
  assert.deepEqual(snapshot(), before);
});

test("SQL-like IDs and text remain bound data", async () => {
  const name = "x' OR 1=1 --";
  const p = await project({ name });
  const t = await task({ title: name, projectId: p.id });
  assert.equal((await call("GET", `tasks/${t.id}`)).title, name);
  assert.equal((await call("GET", `tasks?projectId=${encodeURIComponent("' OR 1=1 --")}`)).items.length, 0);
  await error("GET", "tasks/%27%20OR%201=1%20--", undefined, 404);
});

test("database failures use standard JSON errors for reads and writes", async () => {
  process.env.DATABASE_PATH = directory;
  await error("GET", "tasks", undefined, 500);
  await error("POST", "projects", { name: "项目", area: "company" }, 500);
  await error("GET", "life/training/plan", undefined, 500);
  await error("GET", "company/finance/summary", undefined, 500);
});

for (const [path, base, changes] of [
  ["tasks", { title: "任务", area: "company" }, [{ title: " " }, { area: "other" }, { state: "open" }, { projectId: "missing" }, { due: "2026-02-30" }, { remind: 1 }, { assignee: "other" }, { source: { type: "lead", id: "missing" } }, { source: { type: "other", id: "x" } }, { source: [] }]],
  ["projects", { name: "项目", area: "company" }, [{ name: "" }, { area: "other" }, { status: "other" }, { due: "2026-02-30" }]],
  ["company/transactions", { date: "2026-11-05", type: "expense", category: "样品", amountCents: 100 }, [{ date: "2026-11-07" }, { date: "2026-02-30" }, { type: "other" }, { category: " " }, { category: "中".repeat(31) }, { amountCents: 0 }, { amountCents: -1 }, { amountCents: 1.1 }, { amountCents: Number.MAX_SAFE_INTEGER + 1 }, { projectId: "missing" }, { note: null }]],
  ["company/leads", { product: "产品" }, [{ product: " " }, { observedOn: "2026-11-07" }, { observedOn: "2026-02-30" }, { sourceUrl: "javascript:alert(1)" }, { sourceUrl: "file:///tmp/a" }, { sourceUrl: "ftp://example.com/a" }, { sourceUrl: "not a url" }, { sourceUrl: null }, { sourceName: 1 }, { questions: null }, { nextStep: [] }, { status: "other" }, { signals: null }, { signals: { views: { level: "hot" } } }, { signals: { searches: { note: null } } }, { signals: { sales: [] } }]],
  ["life/training/sessions", { date: "2026-11-05", kind: "workout", part: "胸" }, [{ date: "2026-11-07" }, { date: "2026-02-30" }, { kind: "other" }, { part: null }, { part: " " }, { kind: "rest", part: "胸" }, { note: 1 }]],
]) {
  test(`${path}: invalid fields fail POST and PATCH without changing saved data`, async () => {
    const saved = await call("POST", path, base);
    for (const change of changes) {
      await error("POST", path, { ...base, ...change });
      await error("PATCH", `${path}/${saved.id}`, change);
    }
    if (path !== "life/training/sessions") assert.deepEqual(await call("GET", `${path}/${saved.id}`), saved);
    else assert.deepEqual((await call("GET", path)).items, [saved]);
  });
}

test("required fields, JSON object bodies and unknown field handling are consistent", async () => {
  for (const path of ["tasks", "projects", "company/transactions", "company/leads", "life/training/sessions"]) await error("POST", path, {});
  const savedTask = await task();
  const savedProject = await project();
  const savedLead = await lead();
  const savedTransaction = await transaction();
  const savedSession = await session();
  const writes = [["POST", "tasks"], ["POST", "projects"], ["POST", "company/leads"], ["POST", "company/transactions"], ["POST", "life/training/sessions"], ["PATCH", `tasks/${savedTask.id}`], ["PATCH", `projects/${savedProject.id}`], ["PATCH", `company/leads/${savedLead.id}`], ["PATCH", `company/transactions/${savedTransaction.id}`], ["PATCH", `life/training/sessions/${savedSession.id}`], ["PUT", "life/weights/2026-11-05"], ["PUT", "life/sleep/2026-11-05"], ["PUT", "life/training/cycle"], ["PUT", "life/training/next"]];
  for (const [method, path] of writes) {
    for (const raw of ["{", "", "null", "[]", '"text"', "false"]) {
      const result = await response(method, path, raw, true);
      assert.equal(result.status, 400, `${method} ${path}: ${raw}`);
    }
  }
  assert.deepEqual(await call("PATCH", `tasks/${savedTask.id}`, { unknown: "ignored" }), savedTask);
});

test("project references must exist and match area on both new and changed resources", async () => {
  const life = await project({ area: "life" });
  const company = await project();
  await error("POST", "tasks", { title: "任务", area: "company", projectId: life.id });
  const t = await task({ projectId: company.id });
  await error("PATCH", `tasks/${t.id}`, { projectId: life.id });
  await error("PATCH", `tasks/${t.id}`, { area: "life" });
  assert.equal((await call("PATCH", `tasks/${t.id}`, { area: "life", projectId: life.id })).area, "life");
  await error("POST", "company/transactions", { date: "2026-11-05", type: "income", category: "咨询", amountCents: 100, projectId: life.id });
  const tx = await transaction({ projectId: company.id });
  await error("PATCH", `company/transactions/${tx.id}`, { projectId: life.id });
  await error("PATCH", `projects/${company.id}`, { area: "life" });
});

for (const resource of ["weights", "sleep"]) {
  test(`${resource}: validates date, range, weeks and measured fields`, async () => {
    const body = resource === "weights" ? { kg: 70 } : { minutes: 400 };
    const invalidValues = resource === "weights" ? [null, "70", 19.9, 300.1] : [null, "400", -1, 1441, 1.5];
    for (const date of ["2026-11-07", "2026-02-30", "bad", "2026-1-01"]) {
      await error("PUT", `life/${resource}/${date}`, body);
      await error("DELETE", `life/${resource}/${date}`);
    }
    for (const value of invalidValues) await error("PUT", `life/${resource}/2026-11-05`, { [resource === "weights" ? "kg" : "minutes"]: value });
    await error("PUT", `life/${resource}/2026-11-05`, {});
    await error("PUT", `life/${resource}/2026-11-05`, { ...body, note: null });
    for (const query of ["from=bad", "to=2026-02-30", "from=2026-11-05&to=2026-11-01"]) await error("GET", `life/${resource}?${query}`);
    for (const weeks of ["0", "53", "1.5", "bad", "", "-1"]) await error("GET", `life/${resource}/weekly?weeks=${weeks}`);
    await error("DELETE", `life/${resource}/2026-11-01`, undefined, 404);
  });
}

test("cycle, manual next and session query validation reject invalid fields", async () => {
  for (const parts of [[], Array.from({ length: 13 }, (_, i) => String(i)), ["胸", "胸"], [" "], [1], "胸", null]) await error("PUT", "life/training/cycle", { parts });
  for (const part of [null, "", " ", "中".repeat(31), 1]) await error("PUT", "life/training/next", { part });
  for (const query of ["from=bad", "to=bad", "from=2026-11-05&to=2026-11-01"]) await error("GET", `life/training/sessions?${query}`);
});

test("collection query filters validate their fields", async () => {
  for (const query of ["area=other", "state=todo,other", "state=", "projectId=", "sourceType=lead", "sourceId=x", "sourceType=other&sourceId=x", "sourceType=lead&sourceId="]) await error("GET", `tasks?${query}`);
  await error("GET", "projects?area=other");
  for (const query of ["month=2026-13", "month=bad", "type=other", "category=", `category=${"中".repeat(31)}`]) await error("GET", `company/transactions?${query}`);
  for (const query of ["month=bad", "month=2026-1", "month="]) await error("GET", `company/finance/summary?${query}`);
  for (const query of ["from=bad", "to=2026-13"]) await error("GET", `company/finance/monthly?${query}`);
  for (const status of ["other", "watching,other", ""]) await error("GET", `company/leads?status=${status}`);
});

for (const path of ["tasks", "projects", "company/transactions", "company/leads", "life/training/sessions"]) {
  test(`${path}: missing and SQL-like IDs return 404 for every supported item method`, async () => {
    const methods = path === "life/training/sessions" ? ["PATCH", "DELETE"] : ["GET", "PATCH", "DELETE"];
    for (const id of ["missing", encodeURIComponent("' OR 1=1 --")]) {
      for (const method of methods) await error(method, `${path}/${id}`, method === "PATCH" ? {} : undefined, 404);
    }
  });
}

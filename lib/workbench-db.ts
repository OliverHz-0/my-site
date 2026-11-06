import { randomUUID } from "node:crypto";
import type { DatabaseSync, SQLInputValue } from "node:sqlite";
import { apiError } from "@/lib/api";
import { withDatabase } from "@/lib/database";

type ObjectValue = Record<string, unknown>;
type Row = Record<string, SQLInputValue>;
type Table = "tasks" | "projects" | "life_weights" | "life_sleep" | "training_sessions" | "company_transactions" | "company_leads";
type Resource = "tasks" | "projects" | "weights" | "sleep" | "weightsWeekly" | "sleepWeekly" | "cycle" | "sessions" | "plan" | "next" | "transactions" | "summary" | "monthly" | "leads";
type Context = { params: Promise<{ id?: string; date?: string }> };
const areas = ["research", "life", "company", "personal"];
const states = ["in_progress", "todo", "done", "archived"];
const leadStates = ["watching", "validating", "adopted", "dropped"];
const transactionTypes = ["income", "expense"];

class RequestError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function invalid(field: string): never {
  throw new RequestError(`${field} 字段非法`);
}

function object(value: unknown, field: string): ObjectValue {
  if (value === null || typeof value !== "object" || Array.isArray(value)) invalid(field);
  return value as ObjectValue;
}

function text(value: unknown, field: string, required = false, max?: number): string {
  if (typeof value !== "string" || (required && !value.trim()) || (max !== undefined && [...value].length > max)) invalid(field);
  return value;
}

function choice(value: unknown, options: string[], field: string): string {
  if (typeof value !== "string" || !options.includes(value)) invalid(field);
  return value;
}

function integer(value: unknown, field: string, min: number, max = Number.MAX_SAFE_INTEGER): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < min || value > max) invalid(field);
  return value;
}

export function todayShanghai(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(now);
}

function validDate(value: unknown, field: string): string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) invalid(field);
  const parsed = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) invalid(field);
  return value;
}

function pastDate(value: unknown, field: string, now: Date): string {
  const date = validDate(value, field);
  if (date > todayShanghai(now)) invalid(field);
  return date;
}

function nullableDate(value: unknown, field: string): string | null {
  return value === null ? null : validDate(value, field);
}

export function shiftDays(date: string, days: number): string {
  const parsed = new Date(`${date}T00:00:00Z`);
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return parsed.toISOString().slice(0, 10);
}

export function weekStart(date: string): string {
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
  return shiftDays(date, -((weekday + 6) % 7));
}

function month(value: unknown, field: string): string {
  if (typeof value !== "string" || !/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) invalid(field);
  return value;
}

export function shiftMonths(value: string, offset: number): string {
  const [year, number] = value.split("-").map(Number);
  const index = year * 12 + number - 1 + offset;
  return `${String(Math.floor(index / 12)).padStart(4, "0")}-${String(((index % 12) + 12) % 12 + 1).padStart(2, "0")}`;
}

function dateRange(query: URLSearchParams, now: Date) {
  const from = validDate(query.get("from") ?? shiftDays(todayShanghai(now), -89), "from");
  const to = validDate(query.get("to") ?? todayShanghai(now), "to");
  if (from > to) invalid("from/to");
  return [from, to];
}

function numberParam(query: URLSearchParams, field: string, fallback: number, max: number) {
  const raw = query.get(field);
  if (raw === null) return fallback;
  if (!/^\d+$/.test(raw)) invalid(field);
  return integer(Number(raw), field, 1, max);
}

function multi(value: string, options: string[], field: string): string[] {
  return value.split(",").map((item) => choice(item, options, field));
}

function all(db: DatabaseSync, sql: string, values: SQLInputValue[] = []): Row[] {
  return db.prepare(sql).all(...values) as Row[];
}

function find(db: DatabaseSync, table: Table, id: string, key = "id"): Row {
  const row = db.prepare(`SELECT * FROM ${table} WHERE ${key} = ?`).get(id) as Row | undefined;
  if (!row) throw new RequestError(`${key} 对应的记录不存在`, 404);
  return row;
}

function insert(db: DatabaseSync, table: Table, data: Row) {
  const keys = Object.keys(data);
  db.prepare(`INSERT INTO ${table} (${keys.join(",")}) VALUES (${keys.map(() => "?").join(",")})`).run(...Object.values(data));
}

function update(db: DatabaseSync, table: Table, id: string, data: Row) {
  db.prepare(`UPDATE ${table} SET ${Object.keys(data).map((key) => `${key} = ?`).join(",")} WHERE id = ?`).run(...Object.values(data), id);
}

function remove(db: DatabaseSync, table: Table, id: string, key = "id") {
  find(db, table, id, key);
  db.prepare(`DELETE FROM ${table} WHERE ${key} = ?`).run(id);
  return { ok: true };
}

function fields(body: ObjectValue, names: string[]): ObjectValue {
  return Object.fromEntries(names.filter((name) => Object.hasOwn(body, name)).map((name) => [name, body[name]]));
}

function projectReference(db: DatabaseSync, value: unknown, area: string): string | null {
  if (value === null) return null;
  const id = text(value, "projectId", true);
  const project = db.prepare("SELECT area FROM projects WHERE id = ?").get(id);
  if (!project || project.area !== area) invalid("projectId");
  return id;
}

function toTask(row: Row): ObjectValue {
  const { sourceType, sourceId, remind, ...rest } = row;
  return { ...rest, remind: Number(remind) === 1, source: sourceType === null ? null : { type: sourceType, id: sourceId } };
}

function tasks(db: DatabaseSync, method: string, id: string | undefined, body: ObjectValue, query: URLSearchParams, now: Date) {
  if (id !== undefined) {
    const previous = toTask(find(db, "tasks", id));
    if (method === "GET") return previous;
    if (method === "DELETE") return remove(db, "tasks", id);
  }
  if (method === "GET") {
    const clauses: string[] = [];
    const values: SQLInputValue[] = [];
    for (const [field, options] of [["area", areas], ["state", states]] as const) {
      if (query.has(field)) {
        const selected = field === "state" ? multi(query.get(field)!, [...options], field) : [choice(query.get(field), [...options], field)];
        clauses.push(`${field} IN (${selected.map(() => "?").join(",")})`);
        values.push(...selected);
      }
    }
    if (query.has("projectId")) {
      clauses.push("projectId = ?");
      values.push(text(query.get("projectId"), "projectId", true));
    }
    if (query.has("sourceType") !== query.has("sourceId")) invalid("sourceType/sourceId");
    if (query.has("sourceType")) {
      clauses.push("sourceType = ? AND sourceId = ?");
      values.push(choice(query.get("sourceType"), ["lead"], "sourceType"), text(query.get("sourceId"), "sourceId", true));
    }
    return { items: all(db, `SELECT * FROM tasks ${clauses.length ? `WHERE ${clauses.join(" AND ")}` : ""} ORDER BY due IS NULL, due ASC, createdAt DESC, id DESC`, values).map(toTask) };
  }
  const old = id === undefined ? null : toTask(find(db, "tasks", id));
  const value: ObjectValue = { state: "todo", projectId: null, due: null, remind: false, assignee: "me", source: null, ...old, ...fields(body, ["title", "state", "area", "projectId", "due", "remind", "assignee", "source"]) };
  const area = choice(value.area, areas, "area");
  const state = choice(value.state, states, "state");
  if (typeof value.remind !== "boolean") invalid("remind");
  let sourceType: string | null = null;
  let sourceId: string | null = null;
  if (value.source !== null) {
    const source = object(value.source, "source");
    sourceType = choice(source.type, ["lead"], "source.type");
    sourceId = text(source.id, "source.id", true);
    if ((id === undefined || Object.hasOwn(body, "source")) && !db.prepare("SELECT id FROM company_leads WHERE id = ?").get(sourceId)) invalid("source.id");
  }
  const timestamp = now.toISOString();
  const data: Row = {
    title: text(value.title, "title", true), state, area,
    projectId: projectReference(db, value.projectId, area), due: nullableDate(value.due, "due"),
    remind: Number(value.remind), assignee: choice(value.assignee, ["me"], "assignee"), sourceType, sourceId,
    updatedAt: timestamp, completedAt: state === "done" ? String(old?.completedAt ?? timestamp) : null,
  };
  if (id === undefined) {
    id = `tk_${randomUUID()}`;
    insert(db, "tasks", { id, ...data, createdAt: timestamp });
  } else update(db, "tasks", id, data);
  return toTask(find(db, "tasks", id));
}

function projects(db: DatabaseSync, method: string, id: string | undefined, body: ObjectValue, query: URLSearchParams, now: Date) {
  const old = id === undefined ? null : find(db, "projects", id);
  if (method === "DELETE") return remove(db, "projects", id!);
  if (method === "GET") {
    if (old) return old;
    const area = query.has("area") ? choice(query.get("area"), areas, "area") : null;
    return { items: all(db, `SELECT * FROM projects ${area === null ? "" : "WHERE area = ?"} ORDER BY createdAt DESC, id DESC`, area === null ? [] : [area]) };
  }
  const value: ObjectValue = { status: "active", due: null, ...old, ...fields(body, ["name", "area", "status", "due"]) };
  const area = choice(value.area, areas, "area");
  if (id !== undefined && (db.prepare("SELECT id FROM tasks WHERE projectId = ? AND area != ? LIMIT 1").get(id, area) || (area !== "company" && db.prepare("SELECT id FROM company_transactions WHERE projectId = ? LIMIT 1").get(id)))) invalid("area/projectId");
  const timestamp = now.toISOString();
  const data = { name: text(value.name, "name", true), area, status: choice(value.status, ["active", "paused", "done"], "status"), due: nullableDate(value.due, "due"), updatedAt: timestamp };
  if (id === undefined) {
    id = `pj_${randomUUID()}`;
    insert(db, "projects", { id, ...data, createdAt: timestamp });
  } else update(db, "projects", id, data);
  return find(db, "projects", id);
}

function daily(db: DatabaseSync, resource: "weights" | "sleep", method: string, key: string | undefined, body: ObjectValue, query: URLSearchParams, now: Date) {
  const table = resource === "weights" ? "life_weights" : "life_sleep";
  if (key === undefined) {
    const [from, to] = dateRange(query, now);
    return { items: all(db, `SELECT * FROM ${table} WHERE date BETWEEN ? AND ? ORDER BY date DESC`, [from, to]) };
  }
  const date = pastDate(key, "date", now);
  if (method === "DELETE") return remove(db, table, date, "date");
  let data: Row;
  if (resource === "weights") {
    if (typeof body.kg !== "number" || !Number.isFinite(body.kg) || body.kg < 20 || body.kg > 300) invalid("kg");
    data = { kg: Math.round((body.kg + Number.EPSILON) * 10) / 10 };
  } else data = { minutes: integer(body.minutes, "minutes", 0, 1440) };
  data.note = text(Object.hasOwn(body, "note") ? body.note : "", "note");
  data.updatedAt = now.toISOString();
  const existing = db.prepare(`SELECT date FROM ${table} WHERE date = ?`).get(date);
  const columns = Object.keys(data);
  db.prepare(`INSERT INTO ${table} (date, ${columns.join(",")}) VALUES (?, ${columns.map(() => "?").join(",")}) ON CONFLICT(date) DO UPDATE SET ${columns.map((column) => `${column} = excluded.${column}`).join(",")}`).run(date, ...Object.values(data));
  return { status: existing ? 200 : 201, body: find(db, table, date, "date") };
}

function weekly(db: DatabaseSync, weights: boolean, query: URLSearchParams, now: Date) {
  const weeks = numberParam(query, "weeks", 8, 52);
  const last = weekStart(todayShanghai(now));
  const first = shiftDays(last, -7 * (weeks - 1));
  const table = weights ? "life_weights" : "life_sleep";
  const rows = all(db, `SELECT * FROM ${table} WHERE date BETWEEN ? AND ?`, [first, todayShanghai(now)]);
  const grouped = new Map<string, number[]>();
  for (const row of rows) {
    const start = weekStart(String(row.date));
    const values = grouped.get(start) ?? [];
    values.push(Number(weights ? row.kg : row.minutes));
    grouped.set(start, values);
  }
  return { items: Array.from({ length: weeks }, (_, index) => {
    const start = shiftDays(first, index * 7);
    const values = grouped.get(start) ?? [];
    const average = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
    return weights
      ? { weekStart: start, avgKg: average === null ? null : Math.round(average * 10) / 10, minKg: values.length ? Math.min(...values) : null, maxKg: values.length ? Math.max(...values) : null, count: values.length }
      : { weekStart: start, avgMinutes: average === null ? null : Math.round(average), count: values.length };
  }) };
}

function config(db: DatabaseSync) {
  const row = db.prepare("SELECT * FROM training_config WHERE id = 1").get()!;
  return { parts: JSON.parse(String(row.parts)) as string[], updatedAt: row.updatedAt, manualPart: row.manualPart };
}

export function trainingPlan(db: DatabaseSync) {
  const { parts: cycle, manualPart } = config(db);
  const workouts = all(db, "SELECT id, date, part FROM training_sessions WHERE kind = ? ORDER BY date DESC, createdAt DESC, rowid DESC", ["workout"]);
  const lastWorkout = workouts[0] ?? null;
  if (manualPart !== null) return { cycle, lastWorkout, next: { part: manualPart, reason: "manual" } };
  if (!cycle.length) return { cycle, lastWorkout, next: null };
  const lastInCycle = workouts.find((row) => cycle.includes(String(row.part)));
  return { cycle, lastWorkout, next: { part: lastInCycle ? cycle[(cycle.indexOf(String(lastInCycle.part)) + 1) % cycle.length] : cycle[0], reason: lastInCycle ? "cycle" : "start" } };
}

function training(db: DatabaseSync, resource: "cycle" | "sessions" | "plan" | "next", method: string, id: string | undefined, body: ObjectValue, query: URLSearchParams, now: Date) {
  if (resource === "plan") return trainingPlan(db);
  if (resource === "cycle") {
    if (method === "PUT") {
      if (!Array.isArray(body.parts) || body.parts.length < 1 || body.parts.length > 12) invalid("parts");
      const parts = body.parts.map((part) => text(part, "parts", true));
      if (new Set(parts).size !== parts.length) invalid("parts");
      db.prepare("UPDATE training_config SET parts = ?, updatedAt = ? WHERE id = 1").run(JSON.stringify(parts), now.toISOString());
    }
    const { parts, updatedAt } = config(db);
    return { parts, updatedAt };
  }
  if (resource === "next") {
    const part = method === "DELETE" ? null : text(body.part, "part", true, 30);
    db.prepare("UPDATE training_config SET manualPart = ? WHERE id = 1").run(part);
    return method === "DELETE" ? { ok: true } : trainingPlan(db);
  }
  if (method === "DELETE") return remove(db, "training_sessions", id!);
  if (method === "GET") {
    const [from, to] = dateRange(query, now);
    return { items: all(db, "SELECT * FROM training_sessions WHERE date BETWEEN ? AND ? ORDER BY date DESC, createdAt DESC, rowid DESC", [from, to]) };
  }
  const old = id === undefined ? null : find(db, "training_sessions", id);
  const value: ObjectValue = { note: "", part: null, ...old, ...fields(body, ["date", "kind", "part", "note"]) };
  const kind = choice(value.kind, ["workout", "rest"], "kind");
  if (kind === "rest" && Object.hasOwn(body, "part") && body.part !== null) invalid("part");
  const data = { date: pastDate(value.date, "date", now), kind, part: kind === "rest" ? null : text(value.part, "part", true), note: text(value.note, "note") };
  if (id === undefined) {
    id = `ts_${randomUUID()}`;
    insert(db, "training_sessions", { id, ...data, createdAt: now.toISOString() });
    if (kind === "workout") db.prepare("UPDATE training_config SET manualPart = NULL WHERE id = 1").run();
  } else update(db, "training_sessions", id, data);
  return find(db, "training_sessions", id);
}

function transactions(db: DatabaseSync, method: string, id: string | undefined, body: ObjectValue, query: URLSearchParams, now: Date) {
  const old = id === undefined ? null : find(db, "company_transactions", id);
  if (method === "DELETE") return remove(db, "company_transactions", id!);
  if (method === "GET") {
    if (old) return old;
    const selected = month(query.get("month") ?? todayShanghai(now).slice(0, 7), "month");
    const clauses = ["substr(date, 1, 7) = ?"];
    const values: SQLInputValue[] = [selected];
    if (query.has("type")) {
      clauses.push("type = ?");
      values.push(choice(query.get("type"), transactionTypes, "type"));
    }
    if (query.has("category")) {
      clauses.push("category = ?");
      values.push(text(query.get("category"), "category", true, 30));
    }
    return { items: all(db, `SELECT * FROM company_transactions WHERE ${clauses.join(" AND ")} ORDER BY date DESC, createdAt DESC, id DESC`, values) };
  }
  const value: ObjectValue = { note: "", projectId: null, ...old, ...fields(body, ["date", "type", "category", "amountCents", "note", "projectId"]) };
  const timestamp = now.toISOString();
  const data = {
    date: pastDate(value.date, "date", now), type: choice(value.type, transactionTypes, "type"),
    category: text(value.category, "category", true, 30), amountCents: integer(value.amountCents, "amountCents", 1),
    note: text(value.note, "note"), projectId: projectReference(db, value.projectId, "company"), updatedAt: timestamp,
  };
  if (id === undefined) {
    id = `tx_${randomUUID()}`;
    insert(db, "company_transactions", { id, ...data, createdAt: timestamp });
  } else update(db, "company_transactions", id, data);
  return find(db, "company_transactions", id);
}

function financeSummary(db: DatabaseSync, selected: string) {
  const byCategory = all(db, `SELECT type, category, SUM(amountCents) AS amountCents, COUNT(*) AS count
    FROM company_transactions WHERE substr(date, 1, 7) = ? GROUP BY type, category
    ORDER BY CASE type WHEN 'income' THEN 0 ELSE 1 END, amountCents DESC, category ASC`, [selected]);
  const incomeCents = byCategory.filter((row) => row.type === "income").reduce((sum, row) => sum + Number(row.amountCents), 0);
  const expenseCents = byCategory.filter((row) => row.type === "expense").reduce((sum, row) => sum + Number(row.amountCents), 0);
  return { month: selected, incomeCents, expenseCents, balanceCents: incomeCents - expenseCents, count: byCategory.reduce((sum, row) => sum + Number(row.count), 0), byCategory };
}

function finance(db: DatabaseSync, resource: "summary" | "monthly", query: URLSearchParams, now: Date) {
  const currentMonth = todayShanghai(now).slice(0, 7);
  if (resource === "summary") return financeSummary(db, month(query.get("month") ?? currentMonth, "month"));
  const to = month(query.get("to") ?? currentMonth, "to");
  const from = month(query.get("from") ?? shiftMonths(to, -5), "from");
  const [fromYear, fromMonth] = from.split("-").map(Number);
  const [toYear, toMonth] = to.split("-").map(Number);
  const count = (toYear - fromYear) * 12 + toMonth - fromMonth + 1;
  if (count < 1 || count > 24) invalid("from/to");
  return { items: Array.from({ length: count }, (_, index) => {
    const { byCategory: _byCategory, ...result } = financeSummary(db, shiftMonths(from, index));
    return result;
  }) };
}

function toLead(db: DatabaseSync, row: Row) {
  const count = db.prepare("SELECT COUNT(*) AS count FROM tasks WHERE sourceType = ? AND sourceId = ? AND state IN (?, ?)").get("lead", row.id, "todo", "in_progress")!;
  return { ...row, signals: JSON.parse(String(row.signals)), openTaskCount: Number(count.count) };
}

function leads(db: DatabaseSync, method: string, id: string | undefined, body: ObjectValue, query: URLSearchParams, now: Date) {
  const old = id === undefined ? null : toLead(db, find(db, "company_leads", id));
  if (method === "DELETE") return remove(db, "company_leads", id!);
  if (method === "GET") {
    if (old) return old;
    const status = query.has("status") ? multi(query.get("status")!, leadStates, "status") : [];
    return { items: all(db, `SELECT * FROM company_leads ${status.length ? `WHERE status IN (${status.map(() => "?").join(",")})` : ""} ORDER BY observedOn DESC, createdAt DESC, id DESC`, status).map((row) => toLead(db, row)) };
  }
  const value: ObjectValue = { sourceUrl: "", sourceName: "", observedOn: todayShanghai(now), questions: "", nextStep: "", status: "watching", ...old, ...fields(body, ["product", "sourceUrl", "sourceName", "observedOn", "questions", "nextStep", "status"]) };
  const sourceUrl = text(value.sourceUrl, "sourceUrl");
  if (sourceUrl !== "") {
    let url: URL;
    try { url = new URL(sourceUrl); } catch { invalid("sourceUrl"); }
    if (!["http:", "https:"].includes(url.protocol)) invalid("sourceUrl");
  }
  const signalInput = Object.hasOwn(body, "signals") ? object(body.signals, "signals") : {};
  const oldSignals: ObjectValue = old?.signals ?? {};
  const signals = Object.fromEntries(["views", "searches", "sales"].map((key) => {
    const incoming = Object.hasOwn(signalInput, key) ? object(signalInput[key], `signals.${key}`) : {};
    const previous = oldSignals[key] ? object(oldSignals[key], `signals.${key}`) : {};
    const signal = { level: "unknown", note: "", ...previous, ...fields(incoming, ["level", "note"]) };
    return [key, { level: choice(signal.level, ["unknown", "low", "medium", "high"], `signals.${key}.level`), note: text(signal.note, `signals.${key}.note`) }];
  }));
  const timestamp = now.toISOString();
  const data = {
    product: text(value.product, "product", true), sourceUrl, sourceName: text(value.sourceName, "sourceName"),
    observedOn: pastDate(value.observedOn, "observedOn", now), signals: JSON.stringify(signals),
    questions: text(value.questions, "questions"), nextStep: text(value.nextStep, "nextStep"),
    status: choice(value.status, leadStates, "status"), updatedAt: timestamp,
  };
  if (id === undefined) {
    id = `ld_${randomUUID()}`;
    insert(db, "company_leads", { id, ...data, createdAt: timestamp });
  } else update(db, "company_leads", id, data);
  return toLead(db, find(db, "company_leads", id));
}

/** The clock is injected once per request so date defaults and timestamps agree. */
export async function workbenchResponse(resource: Resource, request: Request, context?: Context, clock: () => Date = () => new Date()) {
  try {
    const now = clock();
    const query = new URL(request.url).searchParams;
    const params = context ? await context.params : {};
    const method = request.method;
    const body = ["POST", "PUT", "PATCH"].includes(method) ? object(await request.json().catch(() => null), "body") : {};
    const result = withDatabase((db) => {
      db.exec(method === "GET" ? "BEGIN" : "BEGIN IMMEDIATE");
      try {
        let value: unknown;
        if (resource === "tasks") value = tasks(db, method, params.id, body, query, now);
        else if (resource === "projects") value = projects(db, method, params.id, body, query, now);
        else if (resource === "weights" || resource === "sleep") value = daily(db, resource, method, params.date, body, query, now);
        else if (resource === "weightsWeekly" || resource === "sleepWeekly") value = weekly(db, resource === "weightsWeekly", query, now);
        else if (["cycle", "sessions", "plan", "next"].includes(resource)) value = training(db, resource as "cycle" | "sessions" | "plan" | "next", method, params.id, body, query, now);
        else if (resource === "transactions") value = transactions(db, method, params.id, body, query, now);
        else if (resource === "summary" || resource === "monthly") value = finance(db, resource, query, now);
        else value = leads(db, method, params.id, body, query, now);
        db.exec("COMMIT");
        return value;
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    });
    if ((resource === "weights" || resource === "sleep") && method === "PUT") {
      const saved = result as { status: number; body: Row };
      return Response.json(saved.body, { status: saved.status });
    }
    return Response.json(result, { status: method === "POST" ? 201 : 200 });
  } catch (error) {
    if (error instanceof RequestError) return apiError(error.status, error.status === 404 ? "NOT_FOUND" : "INVALID_REQUEST", error.message);
    return apiError(500, "INTERNAL_ERROR", "数据库操作失败");
  }
}

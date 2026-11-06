import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtempSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

// Run after npm run build. All HTTP requests use curl and all writes use a temporary DB.
const directory = mkdtempSync(join(tmpdir(), "my-site-production-smoke-"));
const databasePath = join(directory, "app.db");
const base = "http://127.0.0.1:3103/api/";
const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
let server;
let serverLog = "";
let requests = 0;

function curl(method, path, body, expected = method === "POST" ? 201 : 200, show = false) {
  const args = ["--silent", "--show-error", "--max-time", "5", "--dump-header", "-", "--request", method, base + path];
  if (body !== undefined) args.push("--header", "Content-Type: application/json", "--data-binary", JSON.stringify(body));
  const output = execFileSync("curl", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  const separator = output.indexOf("\r\n\r\n");
  const headers = output.slice(0, separator);
  const result = JSON.parse(output.slice(separator + 4));
  assert.match(headers, new RegExp(`^HTTP/\\S+ ${expected}\\b`));
  assert.doesNotMatch(headers, /^x-mock:/im);
  requests++;
  if (show) console.log(`${method} /api/${path} => ${expected}; X-Mock absent\n${JSON.stringify(result)}`);
  return result;
}

async function assertFreePort() {
  const probe = createServer();
  await new Promise((resolve, reject) => {
    probe.once("error", reject);
    probe.listen(3103, "127.0.0.1", resolve);
  });
  await new Promise((resolve, reject) => probe.close((error) => error ? reject(error) : resolve()));
}

async function start() {
  await assertFreePort();
  serverLog = "";
  server = spawn(process.execPath, [resolve("node_modules/next/dist/bin/next"), "start", "-H", "127.0.0.1", "-p", "3103"], {
    env: { ...process.env, DATABASE_PATH: databasePath }, stdio: ["ignore", "pipe", "pipe"],
  });
  server.stdout.on("data", (data) => { serverLog += data; });
  server.stderr.on("data", (data) => { serverLog += data; });
  for (let attempt = 0; attempt < 100; attempt++) {
    if (server.exitCode !== null) throw new Error(`next start exited: ${serverLog}`);
    try { curl("GET", "health"); return; } catch { await delay(100); }
  }
  throw new Error(`next start did not become ready: ${serverLog}`);
}

async function stop() {
  if (!server || server.exitCode !== null) return;
  const current = server;
  const exited = once(current, "exit");
  const timeout = setTimeout(() => current.kill("SIGKILL"), 5000);
  current.kill("SIGTERM");
  try { await exited; } finally { clearTimeout(timeout); }
  server = undefined;
}

try {
  console.log(`Production smoke: 127.0.0.1:3103; DATABASE_PATH=${databasePath}; today=${today}`);
  await start();

  const project = curl("POST", "projects", { name: "curl 临时验证项目", area: "company" }, 201, true);
  const lead = curl("POST", "company/leads", { product: "curl 临时验证产品", sourceUrl: "https://example.com/item/123", nextStep: "核对成交量" }, 201, true);
  const task = curl("POST", "tasks", { title: lead.nextStep, area: "company", projectId: project.id, source: { type: "lead", id: lead.id } }, 201, true);
  const companyTasks = `tasks?area=company&sourceType=lead&sourceId=${lead.id}`;
  assert.deepEqual(curl("GET", companyTasks).items, [task]);
  assert.deepEqual(curl("GET", "tasks").items, [task]);
  const completed = curl("PATCH", `tasks/${task.id}`, { state: "done" }, 200, true);
  assert.deepEqual(curl("GET", companyTasks, undefined, 200, true).items, [completed]);
  assert.deepEqual(curl("GET", "tasks", undefined, 200, true).items, [completed]);
  assert.equal(curl("GET", `company/leads/${lead.id}`).openTaskCount, 0);

  curl("PUT", `life/weights/${today}`, { kg: 68.46, note: "补记" }, 201, true);
  assert.equal(curl("GET", "life/weights").items[0].kg, 68.5);
  assert.equal(curl("GET", "life/weights/weekly?weeks=1", undefined, 200, true).items[0].avgKg, 68.5);
  curl("PUT", `life/sleep/${today}`, { minutes: 300 }, 201);
  curl("PUT", `life/sleep/${today}`, { minutes: 450, note: "更正" }, 200, true);
  assert.equal(curl("GET", "life/sleep").items[0].minutes, 450);
  assert.equal(curl("GET", "life/sleep/weekly?weeks=1", undefined, 200, true).items[0].avgMinutes, 450);

  curl("PUT", "life/training/cycle", { parts: ["胸", "背", "腿"] });
  const workout = curl("POST", "life/training/sessions", { date: today, kind: "workout", part: "背" });
  assert.deepEqual(curl("GET", "life/training/plan", undefined, 200, true).next, { part: "腿", reason: "cycle" });
  curl("POST", "life/training/sessions", { date: today, kind: "rest" });
  assert.deepEqual(curl("GET", "life/training/plan").next, { part: "腿", reason: "cycle" });
  curl("POST", "life/training/sessions", { date: today, kind: "workout", part: "游泳" });
  assert.deepEqual(curl("GET", "life/training/plan").next, { part: "腿", reason: "cycle" });
  assert.deepEqual(curl("PUT", "life/training/next", { part: "肩" }, 200, true).next, { part: "肩", reason: "manual" });
  curl("DELETE", "life/training/next");
  curl("PATCH", `life/training/sessions/${workout.id}`, { part: "胸" });
  assert.equal(curl("GET", "life/training/plan").next.part, "背");

  const expense = curl("POST", "company/transactions", { date: today, type: "expense", category: "样品采购", amountCents: 12900, projectId: project.id });
  curl("POST", "company/transactions", { date: today, type: "income", category: "咨询", amountCents: 300000 });
  assert.equal(curl("GET", "company/finance/summary", undefined, 200, true).balanceCents, 287100);
  curl("PATCH", `company/transactions/${expense.id}`, { amountCents: 9900 });
  const summary = curl("GET", "company/finance/summary", undefined, 200, true);
  assert.equal(summary.balanceCents, 290100);
  assert.equal(curl("GET", "company/transactions?type=expense").items[0].amountCents, 9900);
  assert.equal(curl("GET", "company/finance/monthly").items.at(-1).balanceCents, 290100);

  await stop();
  await start();
  assert.deepEqual(curl("GET", "tasks", undefined, 200, true).items, [completed]);
  assert.equal(curl("GET", "life/weights").items[0].kg, 68.5);
  assert.equal(curl("GET", "life/sleep").items[0].minutes, 450);
  assert.equal(curl("GET", "life/training/plan", undefined, 200, true).next.part, "背");
  assert.deepEqual(curl("GET", "company/finance/summary", undefined, 200, true), summary);
  assert.equal(curl("GET", `company/leads/${lead.id}`).sourceUrl, lead.sourceUrl);
  console.log("PASS: restart preserved tasks, weights, sleep, cycle/sessions, finance and leads.");

  curl("DELETE", `projects/${project.id}`);
  assert.equal(curl("GET", `tasks/${task.id}`).projectId, null);
  assert.equal(curl("GET", `company/transactions/${expense.id}`).projectId, null);
  curl("DELETE", `company/leads/${lead.id}`);
  assert.deepEqual(curl("GET", `tasks/${task.id}`).source, { type: "lead", id: lead.id });
  console.log(`PASS: project/lead deletion preserved dependent records; all ${requests} curl responses had no X-Mock.`);
} finally {
  await stop();
  rmSync(directory, { recursive: true, force: true });
  console.log("Stopped owned next start processes and removed temporary database.");
}

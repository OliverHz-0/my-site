import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, test } from "node:test";
import { NextRequest } from "next/server";
import { GET } from "../app/api/research/digests/route.ts";
import { PATCH } from "../app/api/research/digests/[id]/route.ts";
import { listDigests, openDigestDatabase, resolveDigestDate, setDigestSaved } from "../lib/research-digests-db.ts";
import { proxy } from "../proxy.ts";
import { createSession } from "../lib/auth.ts";

const fields = ["id", "title", "authors", "journal", "publishedAt", "doi", "url", "summaryZh", "whyRelevant", "saved"].sort();
let directory;
let previousPath;
let previousSecret;

function seed() {
  return execFileSync(process.execPath, ["scripts/seed.mjs"], { encoding: "utf8", env: process.env });
}

function get(date) {
  return GET(new NextRequest(`http://localhost/api/research/digests${date === undefined ? "" : `?date=${encodeURIComponent(date)}`}`));
}

function patch(id, body) {
  return PATCH(new Request(`http://localhost/api/research/digests/${id}`, {
    method: "PATCH", headers: { "Content-Type": "application/json" }, body,
  }), { params: Promise.resolve({ id }) });
}

function snapshot() {
  const db = openDigestDatabase();
  try {
    return db.prepare("SELECT * FROM research_digests ORDER BY date, position, id").all();
  } finally {
    db.close();
  }
}

async function assertError(response, status, code) {
  assert.equal(response.status, status);
  const body = await response.json();
  assert.deepEqual(Object.keys(body), ["error"]);
  assert.deepEqual(Object.keys(body.error).sort(), ["code", "message"]);
  assert.equal(body.error.code, code);
  assert.equal(typeof body.error.message, "string");
  assert.ok(body.error.message.length > 0);
}

beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), "research-digests-"));
  previousPath = process.env.DATABASE_PATH;
  previousSecret = process.env.SESSION_SECRET;
  process.env.DATABASE_PATH = join(directory, "nested", "test.db");
  process.env.SESSION_SECRET = "test-only-secret-for-digests";
  seed();
});

afterEach(() => {
  if (previousPath === undefined) delete process.env.DATABASE_PATH;
  else process.env.DATABASE_PATH = previousPath;
  if (previousSecret === undefined) delete process.env.SESSION_SECRET;
  else process.env.SESSION_SECRET = previousSecret;
  rmSync(directory, { recursive: true, force: true });
});

test("specified dates return five stable example items with exactly the agreed fields", async () => {
  for (const date of ["2026-11-05", "2026-11-04"]) {
    const response = get(date);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("X-Mock"), null);
    const result = await response.json();
    assert.deepEqual(Object.keys(result).sort(), ["date", "items"]);
    assert.equal(result.date, date);
    assert.equal(result.items.length, 5);
    assert.deepEqual(result, await get(date).json());
    result.items.forEach((item, index) => {
      assert.deepEqual(Object.keys(item).sort(), fields);
      assert.equal(item.id, `dg_${date.replaceAll("-", "")}_${index + 1}`);
      assert.ok(item.title.startsWith("【示例】"));
      assert.ok(Array.isArray(item.authors) && item.authors.every((author) => typeof author === "string"));
      for (const field of ["title", "journal", "publishedAt", "url", "summaryZh", "whyRelevant"]) {
        assert.equal(typeof item[field], "string");
      }
      assert.equal(new URL(item.url).hostname, "example.org");
      assert.ok(item.doi === null || item.doi.startsWith("10.0000/"));
      assert.equal(item.saved, index === 0);
    });
    assert.ok(result.items.some((item) => item.doi === null));
  }
});

test("list enforces the five-item limit even when storage contains more", async () => {
  const db = openDigestDatabase();
  try {
    db.prepare(`
      INSERT INTO research_digests
      SELECT ?, date, ?, title, authors, journal, publishedAt, doi, url, summaryZh, whyRelevant, saved
      FROM research_digests WHERE id = ?
    `).run("dg_20261105_6", 6, "dg_20261105_1");
  } finally {
    db.close();
  }
  const { items } = await get("2026-11-05").json();
  assert.equal(items.length, 5);
  assert.equal(items.at(-1).id, "dg_20261105_5");
});

test("empty dates return 200 and an empty list", async () => {
  const response = get("2026-11-03");
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { date: "2026-11-03", items: [] });
});

test("omitted date follows Asia/Shanghai across the UTC day boundary", async (t) => {
  assert.equal(resolveDigestDate(null, new Date("2026-11-04T15:59:59Z")), "2026-11-04");
  assert.equal(resolveDigestDate(null, new Date("2026-11-04T16:00:00Z")), "2026-11-05");
  t.mock.timers.enable({ apis: ["Date"], now: new Date("2026-11-04T16:00:00Z") });
  const result = await get().json();
  assert.equal(result.date, "2026-11-05");
  assert.equal(result.items[0].id, "dg_20261105_1");
});

test("invalid dates including impossible calendar days return INVALID_REQUEST", async () => {
  for (const date of ["", "2026-02-30", "2026-02-29", "2026-04-31", "2026-13-01", "2026-00-01", "2026-11-00", "2026-1-05", "26-11-05", "2026-11-05T00:00:00Z", " 2026-11-05", "2026-11-05' OR 1=1 --"]) {
    await assertError(get(date), 400, "INVALID_REQUEST");
  }
  assert.equal(get("2024-02-29").status, 200);
});

test("save, repeated save, and unsave return full updated items", async () => {
  const original = (await get("2026-11-05").json()).items[1];
  for (const saved of [true, true, false, false]) {
    const response = await patch(original.id, JSON.stringify({ saved }));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("X-Mock"), null);
    assert.deepEqual(await response.json(), { ...original, saved });
    assert.equal((await get("2026-11-05").json()).items[1].saved, saved);
  }
});

test("saved state persists after closing and reopening the database", () => {
  let db = openDigestDatabase();
  try {
    assert.equal(setDigestSaved(db, "dg_20261104_2", true).saved, true);
  } finally {
    db.close();
  }
  db = openDigestDatabase();
  try {
    assert.equal(listDigests(db, "2026-11-04")[1].saved, true);
  } finally {
    db.close();
  }
});

test("malformed JSON and non-boolean saved values return INVALID_REQUEST without changing data", async () => {
  const before = snapshot();
  for (const body of ["{", "", "null", "[]", "true", '"text"', "{}", '{"saved":null}', '{"saved":1}', '{"saved":"true"}', '{"saved":[]}']) {
    await assertError(await patch("dg_20261105_1", body), 400, "INVALID_REQUEST");
  }
  assert.deepEqual(snapshot(), before);
});

test("missing and SQL-like IDs return NOT_FOUND", async () => {
  for (const id of ["missing", "' OR 1=1 --"]) {
    await assertError(await patch(id, '{"saved":true}'), 404, "NOT_FOUND");
  }
});

test("seed is reproducible and resets saved states and extra items", async () => {
  const before = snapshot();
  await patch("dg_20261105_1", '{"saved":false}');
  await patch("dg_20261104_2", '{"saved":true}');
  const db = openDigestDatabase();
  try {
    db.prepare(`
      INSERT INTO research_digests
      SELECT ?, date, ?, title, authors, journal, publishedAt, doi, url, summaryZh, whyRelevant, saved
      FROM research_digests WHERE id = ?
    `).run("extra", 6, "dg_20261105_1");
  } finally {
    db.close();
  }
  seed();
  assert.deepEqual(snapshot(), before);
  seed();
  assert.deepEqual(snapshot(), before);
  assert.equal(before.length, 10);
});

test("existing proxy protects both APIs and permits a signed session", async () => {
  for (const [method, path] of [["GET", "/api/research/digests?date=2026-11-05"], ["PATCH", "/api/research/digests/dg_20261105_1"]]) {
    await assertError(await proxy(new NextRequest(`http://localhost${path}`, { method })), 401, "UNAUTHORIZED");
    const response = await proxy(new NextRequest(`http://localhost${path}`, {
      method, headers: { Cookie: `session=${await createSession()}` },
    }));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("x-middleware-next"), "1");
  }
});

test("database failures keep the standard JSON error format", async () => {
  process.env.DATABASE_PATH = directory;
  await assertError(get("2026-11-05"), 500, "INTERNAL_ERROR");
  await assertError(await patch("dg_20261105_1", '{"saved":true}'), 500, "INTERNAL_ERROR");
});

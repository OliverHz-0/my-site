import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";

export type Digest = {
  id: string;
  title: string;
  authors: string[];
  journal: string;
  publishedAt: string;
  doi: string | null;
  url: string;
  summaryZh: string;
  whyRelevant: string;
  saved: boolean;
};

type DigestRow = Omit<Digest, "authors" | "saved"> & { authors: string; saved: number };

const digestColumns = "id, title, authors, journal, publishedAt, doi, url, summaryZh, whyRelevant, saved";

export function resolveDigestDate(value: string | null, now = new Date()): string | null {
  if (value === null) {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Shanghai",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value ? value : null;
}

export function openDigestDatabase(path = process.env.DATABASE_PATH ?? "data/app.db") {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS research_digests (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        position INTEGER NOT NULL,
        title TEXT NOT NULL,
        authors TEXT NOT NULL,
        journal TEXT NOT NULL,
        publishedAt TEXT NOT NULL,
        doi TEXT,
        url TEXT NOT NULL,
        summaryZh TEXT NOT NULL,
        whyRelevant TEXT NOT NULL,
        saved INTEGER NOT NULL CHECK (saved IN (0, 1))
      );
      CREATE INDEX IF NOT EXISTS research_digests_date_position
        ON research_digests (date, position, id);
    `);
    return db;
  } catch (error) {
    db.close();
    throw error;
  }
}

export function withDigestDatabase<T>(use: (db: DatabaseSync) => T): T {
  const db = openDigestDatabase();
  try {
    return use(db);
  } finally {
    db.close();
  }
}

function toDigest(row: DigestRow): Digest {
  return { ...row, authors: JSON.parse(row.authors), saved: row.saved === 1 };
}

export function listDigests(db: DatabaseSync, date: string): Digest[] {
  const rows = db.prepare(`
    SELECT ${digestColumns} FROM research_digests
    WHERE date = ? ORDER BY position ASC, id ASC LIMIT 5
  `).all(date) as DigestRow[];
  return rows.map(toDigest);
}

export function setDigestSaved(db: DatabaseSync, id: string, saved: boolean): Digest | null {
  const row = db.prepare(`
    UPDATE research_digests SET saved = ? WHERE id = ? RETURNING ${digestColumns}
  `).get(Number(saved), id) as DigestRow | undefined;
  return row ? toDigest(row) : null;
}

import type { DatabaseSync } from "node:sqlite";
import { openDatabase, withDatabase } from "@/lib/database";

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

export const openDigestDatabase = openDatabase;
export const withDigestDatabase = withDatabase;

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

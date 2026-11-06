import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";

export const DATABASE_VERSION = 2;

const migrations = [
  `CREATE TABLE IF NOT EXISTS research_digests (
    id TEXT PRIMARY KEY, date TEXT NOT NULL, position INTEGER NOT NULL,
    title TEXT NOT NULL, authors TEXT NOT NULL, journal TEXT NOT NULL,
    publishedAt TEXT NOT NULL, doi TEXT, url TEXT NOT NULL,
    summaryZh TEXT NOT NULL, whyRelevant TEXT NOT NULL,
    saved INTEGER NOT NULL CHECK (saved IN (0, 1))
  );
  CREATE INDEX IF NOT EXISTS research_digests_date_position
    ON research_digests (date, position, id);`,
  `CREATE TABLE projects (
    id TEXT PRIMARY KEY, name TEXT NOT NULL,
    area TEXT NOT NULL CHECK (area IN ('research', 'life', 'company', 'personal')),
    status TEXT NOT NULL CHECK (status IN ('active', 'paused', 'done')),
    due TEXT, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL
  );
  CREATE TABLE tasks (
    id TEXT PRIMARY KEY, title TEXT NOT NULL,
    state TEXT NOT NULL CHECK (state IN ('in_progress', 'todo', 'done', 'archived')),
    area TEXT NOT NULL CHECK (area IN ('research', 'life', 'company', 'personal')),
    projectId TEXT REFERENCES projects(id) ON DELETE SET NULL,
    due TEXT, remind INTEGER NOT NULL CHECK (remind IN (0, 1)),
    assignee TEXT NOT NULL, sourceType TEXT, sourceId TEXT,
    createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL, completedAt TEXT
  );
  CREATE INDEX tasks_filters ON tasks (area, projectId, state);
  CREATE INDEX tasks_source ON tasks (sourceType, sourceId, state);
  CREATE TABLE life_weights (
    date TEXT PRIMARY KEY, kg REAL NOT NULL CHECK (kg BETWEEN 20 AND 300),
    note TEXT NOT NULL, updatedAt TEXT NOT NULL
  );
  CREATE TABLE life_sleep (
    date TEXT PRIMARY KEY, minutes INTEGER NOT NULL CHECK (minutes BETWEEN 0 AND 1440),
    note TEXT NOT NULL, updatedAt TEXT NOT NULL
  );
  CREATE TABLE training_config (
    id INTEGER PRIMARY KEY CHECK (id = 1), parts TEXT NOT NULL,
    updatedAt TEXT, manualPart TEXT
  );
  INSERT INTO training_config (id, parts) VALUES (1, '[]');
  CREATE TABLE training_sessions (
    id TEXT PRIMARY KEY, date TEXT NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('workout', 'rest')),
    part TEXT, note TEXT NOT NULL, createdAt TEXT NOT NULL,
    CHECK ((kind = 'rest' AND part IS NULL) OR (kind = 'workout' AND part IS NOT NULL))
  );
  CREATE INDEX training_sessions_date ON training_sessions (date, createdAt);
  CREATE TABLE company_transactions (
    id TEXT PRIMARY KEY, date TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    category TEXT NOT NULL, amountCents INTEGER NOT NULL CHECK (amountCents > 0),
    note TEXT NOT NULL, projectId TEXT REFERENCES projects(id) ON DELETE SET NULL,
    createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL
  );
  CREATE INDEX company_transactions_date ON company_transactions (date, type, category);
  CREATE TABLE company_leads (
    id TEXT PRIMARY KEY, product TEXT NOT NULL, sourceUrl TEXT NOT NULL,
    sourceName TEXT NOT NULL, observedOn TEXT NOT NULL, signals TEXT NOT NULL,
    questions TEXT NOT NULL, nextStep TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('watching', 'validating', 'adopted', 'dropped')),
    createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL
  );
  CREATE INDEX company_leads_observed ON company_leads (observedOn, status);`,
];

export function openDatabase(path = process.env.DATABASE_PATH ?? "data/app.db") {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  try {
    db.exec("PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;");
    const version = () => Number(db.prepare("PRAGMA user_version").get()!.user_version);
    if (version() > DATABASE_VERSION) throw new Error("Unsupported database version");
    if (version() < DATABASE_VERSION) {
      db.exec("BEGIN IMMEDIATE");
      try {
        for (let current = version(); current < DATABASE_VERSION; current++) {
          db.exec(migrations[current]);
          // PRAGMA does not accept bound parameters; versions are internal constants.
          db.exec(current === 0 ? "PRAGMA user_version = 1" : "PRAGMA user_version = 2");
        }
        db.exec("COMMIT");
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    }
    return db;
  } catch (error) {
    db.close();
    throw error;
  }
}

export function withDatabase<T>(use: (db: DatabaseSync) => T): T {
  const db = openDatabase();
  try {
    return use(db);
  } finally {
    db.close();
  }
}

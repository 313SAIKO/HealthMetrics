import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";

/** The caller owns the connection. A separate in-memory connection is useful in tests. */
export function createDatabase(path: string): DatabaseSync {
  if (path !== ":memory:")
    mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  const database = new DatabaseSync(path);
  database.exec(
    "PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000; PRAGMA journal_mode = WAL;",
  );
  return database;
}

/** Auth migrations must run first because assessments belong to Better Auth users. */
export function migrateAssessmentDatabase(database: DatabaseSync): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS healthmetrics_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);
  database.exec("BEGIN IMMEDIATE");
  try {
    const migration = database
      .prepare("SELECT version FROM healthmetrics_migrations WHERE version = ?")
      .get(1);
    if (!migration) {
      database.exec(`
        CREATE TABLE assessments (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
          title TEXT NOT NULL CHECK(length(title) BETWEEN 1 AND 120),
          measured_at TEXT NOT NULL,
          profile_json TEXT NOT NULL,
          result_json TEXT NOT NULL,
          formula_version TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
        CREATE INDEX assessments_owner_date
          ON assessments(user_id, measured_at DESC, created_at DESC, id DESC);
      `);
      database
        .prepare(
          "INSERT INTO healthmetrics_migrations(version, applied_at) VALUES (?, ?)",
        )
        .run(1, new Date().toISOString());
    }
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

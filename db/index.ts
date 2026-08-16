import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

function getDatabase() {
  const database = (globalThis as typeof globalThis & { __PRODUCT_RESEARCH_DB__?: D1Database }).__PRODUCT_RESEARCH_DB__;
  if (!database) {
    throw new Error(
      "Cloudflare D1 binding `DB` is unavailable. Set the `d1` field in .openai/hosting.json to `DB` or let your control plane inject the real binding values before using the database."
    );
  }
  return database;
}

export function getDb() {
  return drizzle(getDatabase(), { schema });
}

let requirementsReady: Promise<unknown> | undefined;

export async function ensureRequirementsTable() {
  if (!requirementsReady) {
    requirementsReady = getDatabase().prepare(`
      CREATE TABLE IF NOT EXISTS requirements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        priority TEXT NOT NULL DEFAULT 'P1',
        status TEXT NOT NULL DEFAULT '待评估',
        progress INTEGER NOT NULL DEFAULT 0,
        progress_note TEXT NOT NULL DEFAULT '',
        owner TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `).run().catch((error: unknown) => {
      requirementsReady = undefined;
      throw error;
    });
  }
  await requirementsReady;
}

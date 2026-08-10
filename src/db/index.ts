import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import path from "node:path";
import * as schema from "./schema";

const DB_PATH = process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "skillstack.db");

declare global {
  var __sqlite: Database.Database | undefined;
}

function createClient() {
  const sqlite = new Database(DB_PATH);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  return sqlite;
}

// Reuse the connection across Next.js hot reloads in dev.
export const sqlite = globalThis.__sqlite ?? createClient();
if (process.env.NODE_ENV !== "production") globalThis.__sqlite = sqlite;

export const db = drizzle(sqlite, { schema });
export { schema };

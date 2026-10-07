import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { config } from "../config.js";
import { INIT_SCHEMA_SQL } from "./schema.js";

let dbInstance: Database.Database | null = null;
let currentDbPath: string | null = null;

export function getDb(overridePath?: string): Database.Database {
  const targetPath = overridePath || process.env.DATABASE_PATH || config.dbPath;
  const resolvedPath = path.resolve(process.cwd(), targetPath);

  if (dbInstance && currentDbPath === resolvedPath) {
    return dbInstance;
  }

  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }

  const dbDir = path.dirname(resolvedPath);

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const db = new Database(resolvedPath);
  db.pragma("foreign_keys = ON");
  db.exec(INIT_SCHEMA_SQL);

  dbInstance = db;
  currentDbPath = resolvedPath;

  return db;
}

export function closeDb(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
    currentDbPath = null;
  }
}

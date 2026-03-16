import Database from 'better-sqlite3';
import { mkdirSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { config } from '../config/index.js';

function ensureDbDir(dbPath: string): void {
  const absolutePath = dbPath.startsWith('/') ? dbPath : resolveRelativeToCwd(dbPath);
  const dir = dirname(absolutePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function resolveRelativeToCwd(relative: string): string {
  const root = process.cwd();
  return `${root}/${relative.replace(/^\.\//, '')}`;
}

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    ensureDbDir(config.DATABASE_PATH);
    const path = config.DATABASE_PATH.startsWith('/')
      ? config.DATABASE_PATH
      : resolveRelativeToCwd(config.DATABASE_PATH);
    db = new Database(path);
  }
  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}

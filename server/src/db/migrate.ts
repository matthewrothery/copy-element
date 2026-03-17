import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import '../config/index.js';
import { getDb } from './connection.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, 'migrations');

const SCHEMA_MIGRATIONS_TABLE = `
CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at INTEGER NOT NULL
);
`;

function getAppliedVersions(db: ReturnType<typeof getDb>): Set<string> {
  db.exec(SCHEMA_MIGRATIONS_TABLE);
  const rows = db.prepare('SELECT version FROM schema_migrations').all() as { version: string }[];
  return new Set(rows.map((r) => r.version));
}

function getMigrationFiles(): string[] {
  const files = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql'));
  return files.sort();
}

function run(): void {
  const db = getDb();
  const applied = getAppliedVersions(db);

  for (const file of getMigrationFiles()) {
    const version = file;
    if (applied.has(version)) continue;

    const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf-8').trim();
    if (!sql) {
      db.prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)').run(
        version,
        Date.now()
      );
      console.log('Applied (no-op):', version);
      continue;
    }

    const transaction = db.transaction(() => {
      db.exec(sql);
      db.prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)').run(
        version,
        Date.now()
      );
    });
    transaction();
    console.log('Applied:', version);
  }

  console.log('Migrations complete.');
}

run();

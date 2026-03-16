import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, 'migrations');

const name = process.argv[2] ?? 'new_migration';
const safeName = name.replace(/\s+/g, '_').replace(/[^a-z0-9_]/gi, '');
const filename = `${Date.now()}_${safeName}.sql`;
const path = join(MIGRATIONS_DIR, filename);
const content = `-- ${filename}\n`;

writeFileSync(path, content);
console.log('Created:', path);

/**
 * Env key names and app constants. Single source of truth for env var names.
 */

export const ENV_KEYS = {
  NODE_ENV: 'NODE_ENV',
  PORT: 'PORT',
  DATABASE_PATH: 'DATABASE_PATH',
} as const;

export const DEFAULTS = {
  PORT: 3000,
  DATABASE_PATH: './data/element-armory.db',
} as const;

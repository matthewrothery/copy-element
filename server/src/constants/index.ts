/**
 * Env key names and app constants. Single source of truth for env var names.
 */

export const ENV_KEYS = {
  NODE_ENV: 'NODE_ENV',
  PORT: 'PORT',
  DATABASE_PATH: 'DATABASE_PATH',
  BETTER_AUTH_SECRET: 'BETTER_AUTH_SECRET',
  BETTER_AUTH_URL: 'BETTER_AUTH_URL',
  GOOGLE_CLIENT_ID: 'GOOGLE_CLIENT_ID',
  GOOGLE_CLIENT_SECRET: 'GOOGLE_CLIENT_SECRET',
  AWS_SES_REGION: 'AWS_SES_REGION',
  AWS_ACCESS_KEY_ID: 'AWS_ACCESS_KEY_ID',
  AWS_SECRET_ACCESS_KEY: 'AWS_SECRET_ACCESS_KEY',
  FROM_EMAIL: 'FROM_EMAIL',
} as const;

export const DEFAULTS = {
  PORT: 3000,
  DATABASE_PATH: './data/element-armory.db',
} as const;

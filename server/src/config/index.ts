import 'dotenv/config';
import { ENV_KEYS, DEFAULTS } from '../constants/index.js';
import type { AppConfig } from '../types/index.js';

function getConfig(): AppConfig {
  const portRaw = process.env[ENV_KEYS.PORT];
  const port = portRaw ? parseInt(portRaw, 10) : DEFAULTS.PORT;
  const nodeEnv = process.env[ENV_KEYS.NODE_ENV] ?? 'development';
  return {
    NODE_ENV: nodeEnv,
    PORT: Number.isNaN(port) ? DEFAULTS.PORT : port,
    DATABASE_PATH: process.env[ENV_KEYS.DATABASE_PATH] ?? DEFAULTS.DATABASE_PATH,
    BETTER_AUTH_SECRET: process.env[ENV_KEYS.BETTER_AUTH_SECRET] ?? '',
    BETTER_AUTH_URL: process.env[ENV_KEYS.BETTER_AUTH_URL] ?? `http://localhost:${Number.isNaN(port) ? DEFAULTS.PORT : port}`,
    GOOGLE_CLIENT_ID: process.env[ENV_KEYS.GOOGLE_CLIENT_ID] ?? '',
    GOOGLE_CLIENT_SECRET: process.env[ENV_KEYS.GOOGLE_CLIENT_SECRET] ?? '',
    AWS_SES_REGION:
      process.env[ENV_KEYS.AWS_SES_REGION] || process.env[ENV_KEYS.AWS_REGION] || '',
    AWS_ACCESS_KEY_ID: process.env[ENV_KEYS.AWS_ACCESS_KEY_ID] ?? '',
    AWS_SECRET_ACCESS_KEY: process.env[ENV_KEYS.AWS_SECRET_ACCESS_KEY] ?? '',
    FROM_EMAIL: process.env[ENV_KEYS.FROM_EMAIL] ?? '',
    FRONTEND_URL: process.env[ENV_KEYS.FRONTEND_URL] ?? '',
    STRIPE_SECRET_KEY: process.env[ENV_KEYS.STRIPE_SECRET_KEY] ?? '',
    STRIPE_WEBHOOK_SECRET: process.env[ENV_KEYS.STRIPE_WEBHOOK_SECRET] ?? '',
    STRIPE_PRICE_PRO_MONTHLY: process.env[ENV_KEYS.STRIPE_PRICE_PRO_MONTHLY] ?? '',
    STRIPE_SUCCESS_URL: process.env[ENV_KEYS.STRIPE_SUCCESS_URL] ?? '',
    STRIPE_CANCEL_URL: process.env[ENV_KEYS.STRIPE_CANCEL_URL] ?? '',
    STRIPE_PORTAL_RETURN_URL: process.env[ENV_KEYS.STRIPE_PORTAL_RETURN_URL] ?? '',
    S3_REGION: process.env[ENV_KEYS.S3_REGION] ?? '',
    S3_BUCKET_CAPTURES: process.env[ENV_KEYS.S3_BUCKET_CAPTURES] ?? '',
    S3_ENDPOINT: process.env[ENV_KEYS.S3_ENDPOINT] ?? '',
    S3_FORCE_PATH_STYLE: process.env[ENV_KEYS.S3_FORCE_PATH_STYLE] === 'true' || process.env[ENV_KEYS.S3_FORCE_PATH_STYLE] === '1',
    INTERNAL_API_KEY: process.env[ENV_KEYS.INTERNAL_API_KEY] ?? '',
    ANTHROPIC_API_KEY: process.env[ENV_KEYS.ANTHROPIC_API_KEY] ?? '',
    SUPPORT_EMAIL: process.env[ENV_KEYS.SUPPORT_EMAIL] ?? 'support@elementarmory.com',
    ADMIN_ORIGIN:
      process.env[ENV_KEYS.ADMIN_ORIGIN] ??
      (nodeEnv === 'development' ? DEFAULTS.ADMIN_ORIGIN_LOCAL : 'https://admin.elementarmory.com'),
    INTERNAL_TOOLS_PATH: process.env[ENV_KEYS.INTERNAL_TOOLS_PATH] ?? '',
  };
}

export const config = getConfig();

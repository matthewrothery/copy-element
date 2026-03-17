/**
 * Shared types: config, env shape, and API response shapes.
 */

export interface AppConfig {
  NODE_ENV: string;
  PORT: number;
  DATABASE_PATH: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  AWS_SES_REGION: string;
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  FROM_EMAIL: string;
  FRONTEND_URL: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  STRIPE_PRICE_PRO_MONTHLY: string;
  STRIPE_SUCCESS_URL: string;
  STRIPE_CANCEL_URL: string;
  STRIPE_PORTAL_RETURN_URL: string;
  S3_REGION: string;
  S3_BUCKET_CAPTURES: string;
  S3_ENDPOINT: string;
  S3_FORCE_PATH_STYLE: boolean;
}

export interface HealthResponse {
  status: 'ok';
  timestamp: string;
}

export interface ReadyResponse {
  ready: boolean;
}

export interface InstallIdentity {
  install_id: string;
  install_secret: string;
}

export interface RegisterInstallBody {
  install_id: string;
  install_secret?: string;
  extension_version?: string;
  chrome_version?: string;
  os_family?: string;
  screen_width?: number;
  screen_height?: number;
  locale?: string;
  timezone?: string;
}

export interface RegisterInstallResponse {
  install_id: string;
  install_secret: string;
}

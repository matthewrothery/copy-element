/**
 * Shared types: config, env shape, and API response shapes.
 */

export interface AppConfig {
  NODE_ENV: string;
  PORT: number;
  DATABASE_PATH: string;
}

export interface HealthResponse {
  status: 'ok';
  timestamp: string;
}

export interface ReadyResponse {
  ready: boolean;
}

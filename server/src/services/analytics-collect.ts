import { nanoid } from 'nanoid';
import { getDb } from '../db/connection.js';

const ALLOWED_EVENT_TYPES = new Set([
  'page_view',
  'page_duration',
  'signup_started',
  'signup_completed',
  'pricing_viewed',
  'checkout_started',
  'checkout_completed',
  'chrome_store_link_clicked',
  'feature_section_viewed',
  'extension_installed',
  'extension_opened',
  'element_captured',
  'element_capture_failed',
  'element_exported',
  'mcp_connected',
  'mcp_request_sent',
  'account_created',
  'library_viewed',
  'limit_reached',
  'upgrade_modal_shown',
  'signin_modal_shown',
]);

const ALLOWED_PROPERTY_KEYS = new Set([
  'url',
  'element_type',
  'framework_detected',
  'capture_size',
  'format',
  'editor',
  'method',
  'browser',
  'os',
  'screen_width',
  'screen_height',
  'chrome_version',
  'install_id',
  'link',
  'plan',
  'price',
  'error',
  'source',
  'limit_type',
  'duration_ms',
  'section',
]);

const MAX_PROPERTY_JSON_LENGTH = 2048;
const MAX_URL_LENGTH = 2048;
const MAX_REFERRER_LENGTH = 512;
const MAX_TEXT_LENGTH = 256;

export interface AnalyticsEventInsert {
  event_type: string;
  visitor_id?: string;
  user_id?: string | null;
  install_id?: string;
  session_id?: string;
  properties?: Record<string, unknown>;
  url?: string;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  device?: string;
  browser?: string;
  country?: string;
}

export function isAllowedEventType(eventType: string): boolean {
  return ALLOWED_EVENT_TYPES.has(eventType);
}

function truncate(value: string | undefined, max: number): string {
  if (!value) return '';
  return value.length > max ? value.slice(0, max) : value;
}

function sanitizeProperties(props: Record<string, unknown> | undefined): string {
  if (!props) return '';
  const filtered: Record<string, unknown> = {};
  for (const key of ALLOWED_PROPERTY_KEYS) {
    if (key in props) {
      filtered[key] = props[key];
    }
  }
  const serialized = JSON.stringify(filtered);
  return serialized.length > MAX_PROPERTY_JSON_LENGTH
    ? serialized.slice(0, MAX_PROPERTY_JSON_LENGTH)
    : serialized;
}

export function insertAnalyticsEvent(event: AnalyticsEventInsert): void {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO analytics_events
      (id, event_type, visitor_id, user_id, install_id, session_id, properties_json,
       url, referrer, utm_source, utm_medium, utm_campaign, device, browser, country, created_at)
    VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    nanoid(),
    event.event_type,
    truncate(event.visitor_id, MAX_TEXT_LENGTH) || null,
    event.user_id ?? null,
    truncate(event.install_id, MAX_TEXT_LENGTH) || null,
    truncate(event.session_id, MAX_TEXT_LENGTH) || null,
    sanitizeProperties(event.properties) || null,
    truncate(event.url, MAX_URL_LENGTH) || null,
    truncate(event.referrer, MAX_REFERRER_LENGTH) || null,
    truncate(event.utm_source, MAX_TEXT_LENGTH) || null,
    truncate(event.utm_medium, MAX_TEXT_LENGTH) || null,
    truncate(event.utm_campaign, MAX_TEXT_LENGTH) || null,
    truncate(event.device, MAX_TEXT_LENGTH) || null,
    truncate(event.browser, MAX_TEXT_LENGTH) || null,
    truncate(event.country, MAX_TEXT_LENGTH) || null,
    Date.now(),
  );
}

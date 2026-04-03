'use client';

const VISITOR_COOKIE = 'ea_vid';
const SESSION_KEY = 'ea_sid';
const UTM_SESSION_KEY = 'ea_utms';
const COLLECT_URL = '/api/collect/event';

// ---------------------------------------------------------------------------
// ID helpers
// ---------------------------------------------------------------------------

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ---------------------------------------------------------------------------
// Cookie helpers
// ---------------------------------------------------------------------------

function getCookie(name: string): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : '';
}

function setCookie(name: string, value: string, days: number): void {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 86_400_000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

// ---------------------------------------------------------------------------
// Visitor + session IDs
// ---------------------------------------------------------------------------

export function getVisitorId(): string {
  let id = getCookie(VISITOR_COOKIE);
  if (!id) {
    id = generateId();
    setCookie(VISITOR_COOKIE, id, 365);
  }
  return id;
}

export function getSessionId(): string {
  if (typeof sessionStorage === 'undefined') return generateId();
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = generateId();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

// ---------------------------------------------------------------------------
// UTM params
// ---------------------------------------------------------------------------

interface UtmParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

function readUtmParams(): UtmParams {
  if (typeof sessionStorage === 'undefined') return {};
  const stored = sessionStorage.getItem(UTM_SESSION_KEY);
  if (stored) {
    try { return JSON.parse(stored) as UtmParams; } catch { /* ignore */ }
  }
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  const utms: UtmParams = {};
  const src = params.get('utm_source');
  const med = params.get('utm_medium');
  const cam = params.get('utm_campaign');
  if (src) utms.utm_source = src;
  if (med) utms.utm_medium = med;
  if (cam) utms.utm_campaign = cam;
  if (src || med || cam) {
    sessionStorage.setItem(UTM_SESSION_KEY, JSON.stringify(utms));
  }
  return utms;
}

// ---------------------------------------------------------------------------
// Device + browser detection
// ---------------------------------------------------------------------------

function detectDevice(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent;
  if (/Mobi|Android|iPhone|iPod/i.test(ua)) return 'mobile';
  if (/iPad|Tablet/i.test(ua)) return 'tablet';
  return 'desktop';
}

function detectBrowser(): string {
  if (typeof navigator === 'undefined') return 'unknown';
  const ua = navigator.userAgent;
  if (/Edg\//i.test(ua)) return 'edge';
  if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) return 'chrome';
  if (/Firefox\//i.test(ua)) return 'firefox';
  if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) return 'safari';
  return 'other';
}

// ---------------------------------------------------------------------------
// Core tracking function
// ---------------------------------------------------------------------------

export function track(eventType: string, properties?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;

  const utms = readUtmParams();
  const payload = {
    event_type: eventType,
    visitor_id: getVisitorId(),
    session_id: getSessionId(),
    url: window.location.pathname + window.location.search,
    referrer: document.referrer || undefined,
    ...utms,
    device: detectDevice(),
    browser: detectBrowser(),
    properties,
  };

  const data = JSON.stringify(payload);

  // Prefer sendBeacon for page_view (fire-and-forget on navigation)
  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    navigator.sendBeacon(COLLECT_URL, new Blob([data], { type: 'application/json' }));
    return;
  }

  fetch(COLLECT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: data,
    keepalive: true,
  }).catch(() => { /* analytics should never break the page */ });
}

export function trackPageView(): void {
  track('page_view');
}

// ---------------------------------------------------------------------------
// Goal tracking exports
// ---------------------------------------------------------------------------

export const trackPricingViewed = () => track('pricing_viewed');
export const trackSignupStarted = () => track('signup_started');
export const trackSignupCompleted = () => track('signup_completed');
export const trackCheckoutStarted = () => track('checkout_started');
export const trackCheckoutCompleted = () => track('checkout_completed');

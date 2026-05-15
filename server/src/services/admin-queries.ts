import { getDb } from '../db/connection.js';

function dayStart(daysAgo: number): number {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.getTime();
}

function isoDate(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------

export interface OverviewResult {
  dau: number;
  installs_today: number;
  captures_today: number;
  mcp_requests_today: number;
  signups_last_n_days: number;
  mrr_cents: number;
  dau_sparkline: Array<{ date: string; value: number }>;
}

export function getOverview(days: number): OverviewResult {
  const db = getDb();
  const todayStart = dayStart(0);
  const windowStart = dayStart(days);

  const dau = (db.prepare(
    `SELECT COUNT(DISTINCT visitor_id) AS n FROM analytics_events WHERE created_at >= ? AND visitor_id IS NOT NULL`,
  ).get(todayStart) as { n: number }).n;

  const captures_today = (db.prepare(
    `SELECT COUNT(*) AS n FROM analytics_events WHERE event_type = 'element_captured' AND created_at >= ?`,
  ).get(todayStart) as { n: number }).n;

  const installs_today = (db.prepare(
    `SELECT COUNT(*) AS n FROM installs WHERE created_at >= ?`,
  ).get(todayStart) as { n: number }).n;

  const mcp_requests_today = (db.prepare(
    `SELECT COALESCE(SUM(call_count), 0) AS n FROM mcp_usage WHERE period = ?`,
  ).get(new Date().toISOString().slice(0, 7)) as { n: number }).n;

  const signups_last_n_days = (db.prepare(
    `SELECT COUNT(*) AS n FROM events WHERE type = 'user.created' AND created_at >= ?`,
  ).get(windowStart) as { n: number }).n;

  // MRR: count active subscriptions. No stored price → count as $19 per active paid sub.
  const active_subs = (db.prepare(
    `SELECT COUNT(*) AS n FROM subscriptions WHERE status = 'active' AND plan_code != 'free'`,
  ).get() as { n: number }).n;
  const mrr_cents = active_subs * 1900;

  // DAU sparkline: last 14 days
  const dau_sparkline: Array<{ date: string; value: number }> = [];
  for (let i = 13; i >= 0; i--) {
    const start = dayStart(i);
    const end = dayStart(i - 1);
    const count = (db.prepare(
      `SELECT COUNT(DISTINCT visitor_id) AS n FROM analytics_events WHERE created_at >= ? AND created_at < ? AND visitor_id IS NOT NULL`,
    ).get(start, end) as { n: number }).n;
    dau_sparkline.push({ date: isoDate(start), value: count });
  }

  return { dau, installs_today, captures_today, mcp_requests_today, signups_last_n_days, mrr_cents, dau_sparkline };
}

// ---------------------------------------------------------------------------
// Extension Activity
// ---------------------------------------------------------------------------

export interface ExtensionActivityInstall {
  install_id: string;
  created_at: number;
  last_seen_at: number;
  extension_version: string | null;
  chrome_version: string | null;
  os_family: string | null;
  locale: string | null;
  timezone: string | null;
  user_email: string | null;
}

export interface ExtensionActivityCapture {
  id: string;
  install_id: string | null;
  created_at: number;
  source_url: string | null;
  user_email: string | null;
}

export interface ExtensionActivityResult {
  period_start: number;
  period_end: number;
  installs: number;
  captures: number;
  unique_capturing_installs: number;
  linked_installs: number;
  recent_installs: ExtensionActivityInstall[];
  recent_captures: ExtensionActivityCapture[];
}

export function getExtensionActivity(
  periodStart: number,
  periodEnd: number,
  limit = 20,
): ExtensionActivityResult {
  const db = getDb();
  const boundedLimit = Math.min(50, Math.max(1, limit));

  const installs = (db.prepare(
    `SELECT COUNT(*) AS n FROM installs WHERE created_at >= ? AND created_at < ?`,
  ).get(periodStart, periodEnd) as { n: number }).n;

  const captures = (db.prepare(
    `SELECT COUNT(*) AS n FROM analytics_events WHERE event_type = 'element_captured' AND created_at >= ? AND created_at < ?`,
  ).get(periodStart, periodEnd) as { n: number }).n;

  const unique_capturing_installs = (db.prepare(`
    SELECT COUNT(DISTINCT install_id) AS n
    FROM analytics_events
    WHERE event_type = 'element_captured'
      AND created_at >= ?
      AND created_at < ?
      AND install_id IS NOT NULL
  `).get(periodStart, periodEnd) as { n: number }).n;

  const linked_installs = (db.prepare(
    `SELECT COUNT(*) AS n FROM installs WHERE user_id IS NOT NULL AND created_at >= ? AND created_at < ?`,
  ).get(periodStart, periodEnd) as { n: number }).n;

  const recent_installs = db.prepare(`
    SELECT
      i.install_id,
      i.created_at,
      i.last_seen_at,
      i.extension_version,
      i.chrome_version,
      i.os_family,
      i.locale,
      i.timezone,
      u.email AS user_email
    FROM installs i
    LEFT JOIN "user" u ON u.id = i.user_id
    WHERE i.created_at >= ?
      AND i.created_at < ?
    ORDER BY i.created_at DESC
    LIMIT ?
  `).all(periodStart, periodEnd, boundedLimit) as ExtensionActivityInstall[];

  const recent_captures = db.prepare(`
    SELECT
      ae.id,
      ae.install_id,
      ae.created_at,
      json_extract(ae.properties_json, '$.url') AS source_url,
      u.email AS user_email
    FROM analytics_events ae
    LEFT JOIN installs i ON i.install_id = ae.install_id
    LEFT JOIN "user" u ON u.id = COALESCE(ae.user_id, i.user_id)
    WHERE ae.event_type = 'element_captured'
      AND ae.created_at >= ?
      AND ae.created_at < ?
    ORDER BY ae.created_at DESC
    LIMIT ?
  `).all(periodStart, periodEnd, boundedLimit) as ExtensionActivityCapture[];

  return {
    period_start: periodStart,
    period_end: periodEnd,
    installs,
    captures,
    unique_capturing_installs,
    linked_installs,
    recent_installs,
    recent_captures,
  };
}

// ---------------------------------------------------------------------------
// Funnel
// ---------------------------------------------------------------------------

export interface FunnelStep {
  name: string;
  count: number;
  pct_of_first: number;
  pct_of_prev: number;
}

export function getFunnelMetrics(days = 90): FunnelStep[] {
  const db = getDb();
  const since = dayStart(days);

  // Step 1: installs within the window — this is the cohort base
  const installs = (db.prepare(
    `SELECT COUNT(*) AS n FROM installs WHERE created_at >= ?`,
  ).get(since) as { n: number }).n;

  // Step 2: installs that opened the popup (extension_opened) within the window
  const popup_opened = (db.prepare(`
    SELECT COUNT(DISTINCT ae.install_id) AS n
    FROM analytics_events ae
    INNER JOIN installs i ON i.install_id = ae.install_id
    WHERE ae.event_type = 'extension_opened'
      AND ae.install_id IS NOT NULL
      AND i.created_at >= ?
  `).get(since) as { n: number }).n;

  // Step 3: installs that made at least one capture, from the cohort
  const first_capture = (db.prepare(`
    SELECT COUNT(DISTINCT ae.install_id) AS n
    FROM analytics_events ae
    INNER JOIN installs i ON i.install_id = ae.install_id
    WHERE ae.event_type = 'element_captured'
      AND ae.install_id IS NOT NULL
      AND i.created_at >= ?
  `).get(since) as { n: number }).n;

  // Step 4: installs that are linked to a user (account linked), from the cohort
  const account_linked = (db.prepare(`
    SELECT COUNT(*) AS n
    FROM installs
    WHERE user_id IS NOT NULL
      AND created_at >= ?
  `).get(since) as { n: number }).n;

  // Step 5: installs that connected MCP, from the cohort
  const mcp_connected = (db.prepare(`
    SELECT COUNT(DISTINCT ae.install_id) AS n
    FROM analytics_events ae
    INNER JOIN installs i ON i.install_id = ae.install_id
    WHERE ae.event_type = 'mcp_connected'
      AND ae.install_id IS NOT NULL
      AND i.created_at >= ?
  `).get(since) as { n: number }).n;

  // Step 6: users who upgraded (active paid subscription), linked from installs in the cohort
  const upgraded = (db.prepare(`
    SELECT COUNT(DISTINCT i.user_id) AS n
    FROM installs i
    INNER JOIN subscriptions s ON s.user_id = i.user_id
    WHERE s.status = 'active'
      AND s.plan_code != 'free'
      AND s.source = 'stripe'
      AND i.created_at >= ?
      AND i.user_id IS NOT NULL
  `).get(since) as { n: number }).n;

  const raw = [
    { name: 'Installs', count: installs },
    { name: 'Popup Opened', count: popup_opened },
    { name: 'First Capture', count: first_capture },
    { name: 'Account Linked', count: account_linked },
    { name: 'MCP Connected', count: mcp_connected },
    { name: 'Upgraded', count: upgraded },
  ];

  return raw.map((s, i) => ({
    ...s,
    pct_of_first: installs > 0 ? Math.round((s.count / installs) * 100) : 0,
    pct_of_prev: i === 0 || raw[i - 1].count === 0
      ? 100
      : Math.round((s.count / raw[i - 1].count) * 100),
  }));
}

// ---------------------------------------------------------------------------
// Website Analytics
// ---------------------------------------------------------------------------

export interface WebsiteAnalyticsResult {
  page_views: number;
  unique_visitors: number;
  top_pages: Array<{ url: string; views: number }>;
  top_referrers: Array<{ referrer: string; visits: number }>;
  top_utm_sources: Array<{ source: string; sessions: number }>;
  conversions: {
    pricing_viewed: number;
    signup_started: number;
    signup_completed: number;
    checkout_started: number;
    checkout_completed: number;
    chrome_store_link_clicked: number;
  };
  daily_visitors: Array<{ date: string; visitors: number }>;
}

export function getWebsiteAnalytics(days: number): WebsiteAnalyticsResult {
  const db = getDb();
  const since = dayStart(days);

  const page_views = (db.prepare(
    `SELECT COUNT(*) AS n FROM analytics_events WHERE event_type = 'page_view' AND created_at >= ?`,
  ).get(since) as { n: number }).n;

  const unique_visitors = (db.prepare(
    `SELECT COUNT(DISTINCT visitor_id) AS n FROM analytics_events WHERE event_type = 'page_view' AND created_at >= ? AND visitor_id IS NOT NULL`,
  ).get(since) as { n: number }).n;

  const top_pages = db.prepare(
    `SELECT url, COUNT(*) AS views FROM analytics_events WHERE event_type = 'page_view' AND created_at >= ? AND url IS NOT NULL GROUP BY url ORDER BY views DESC LIMIT 10`,
  ).all(since) as Array<{ url: string; views: number }>;

  const top_referrers = db.prepare(
    `SELECT referrer, COUNT(*) AS visits FROM analytics_events WHERE event_type = 'page_view' AND created_at >= ? AND referrer IS NOT NULL AND referrer != '' GROUP BY referrer ORDER BY visits DESC LIMIT 10`,
  ).all(since) as Array<{ referrer: string; visits: number }>;

  const top_utm_sources = db.prepare(
    `SELECT utm_source AS source, COUNT(DISTINCT session_id) AS sessions FROM analytics_events WHERE created_at >= ? AND utm_source IS NOT NULL AND utm_source != '' GROUP BY utm_source ORDER BY sessions DESC LIMIT 10`,
  ).all(since) as Array<{ source: string; sessions: number }>;

  function countGoal(eventType: string): number {
    return (db.prepare(
      `SELECT COUNT(*) AS n FROM analytics_events WHERE event_type = ? AND created_at >= ?`,
    ).get(eventType, since) as { n: number }).n;
  }

  const conversions = {
    pricing_viewed: countGoal('pricing_viewed'),
    signup_started: countGoal('signup_started'),
    signup_completed: countGoal('signup_completed'),
    checkout_started: countGoal('checkout_started'),
    checkout_completed: countGoal('checkout_completed'),
    chrome_store_link_clicked: countGoal('chrome_store_link_clicked'),
  };

  const daily_visitors: Array<{ date: string; visitors: number }> = [];
  for (let i = days - 1; i >= 0; i--) {
    const start = dayStart(i);
    const end = dayStart(i - 1);
    const visitors = (db.prepare(
      `SELECT COUNT(DISTINCT visitor_id) AS n FROM analytics_events WHERE event_type = 'page_view' AND created_at >= ? AND created_at < ? AND visitor_id IS NOT NULL`,
    ).get(start, end) as { n: number }).n;
    daily_visitors.push({ date: isoDate(start), visitors });
  }

  return { page_views, unique_visitors, top_pages, top_referrers, top_utm_sources, conversions, daily_visitors };
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  created_at: number;
  install_count: number;
  capture_count: number;
  plan_code: string;
  has_complimentary: boolean;
}

export interface UserListResult {
  users: AdminUser[];
  total: number;
  page: number;
}

export function getUserList(page: number, limit: number, search: string): UserListResult {
  const db = getDb();
  const offset = (page - 1) * limit;
  const searchParam = search ? `%${search}%` : '%';

  const total = (db.prepare(
    `SELECT COUNT(*) AS n FROM "user" WHERE email LIKE ? OR name LIKE ?`,
  ).get(searchParam, searchParam) as { n: number }).n;

  const rows = db.prepare(`
    SELECT
      u.id,
      u.email,
      u.name,
      u.createdAt AS created_at,
      (SELECT COUNT(*) FROM installs i WHERE i.user_id = u.id) AS install_count,
      (SELECT COUNT(*) FROM captures c WHERE c.user_id = u.id) AS capture_count,
      COALESCE((SELECT plan_code FROM subscriptions s WHERE s.user_id = u.id AND s.status = 'active' ORDER BY s.created_at DESC LIMIT 1), 'free') AS plan_code,
      CASE WHEN EXISTS (SELECT 1 FROM subscriptions s WHERE s.user_id = u.id AND s.status = 'active' AND s.source = 'complimentary') THEN 1 ELSE 0 END AS has_complimentary
    FROM "user" u
    WHERE u.email LIKE ? OR u.name LIKE ?
    ORDER BY u.createdAt DESC
    LIMIT ? OFFSET ?
  `).all(searchParam, searchParam, limit, offset) as Array<{
    id: string;
    email: string;
    name: string;
    created_at: number;
    install_count: number;
    capture_count: number;
    plan_code: string;
    has_complimentary: number;
  }>;

  const users: AdminUser[] = rows.map((r) => ({
    ...r,
    has_complimentary: r.has_complimentary === 1,
  }));

  return { users, total, page };
}

// ---------------------------------------------------------------------------
// Revenue
// ---------------------------------------------------------------------------

export interface RevenueResult {
  mrr_cents: number;
  arr_cents: number;
  active_subscribers: number;
  monthly_trend: Array<{ month: string; mrr_cents: number; new_subs: number; churned_subs: number }>;
  recent_events: Array<{ type: string; plan_code: string; created_at: number }>;
}

export function getRevenueMetrics(months: number): RevenueResult {
  const db = getDb();

  const active_subscribers = (db.prepare(
    `SELECT COUNT(*) AS n FROM subscriptions WHERE status = 'active' AND plan_code != 'free' AND source = 'stripe'`,
  ).get() as { n: number }).n;

  const mrr_cents = active_subscribers * 1900;
  const arr_cents = mrr_cents * 12;

  // Monthly trend using subscription_events
  const monthly_trend: RevenueResult['monthly_trend'] = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = d.toISOString().slice(0, 7);
    const monthStart = d.getTime();
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();

    const new_subs = (db.prepare(
      `SELECT COUNT(*) AS n FROM subscription_events WHERE stripe_event_type LIKE '%created%' AND created_at >= ? AND created_at < ?`,
    ).get(monthStart, monthEnd) as { n: number }).n;

    const churned_subs = (db.prepare(
      `SELECT COUNT(*) AS n FROM subscription_events WHERE stripe_event_type LIKE '%deleted%' AND created_at >= ? AND created_at < ?`,
    ).get(monthStart, monthEnd) as { n: number }).n;

    monthly_trend.push({ month, mrr_cents: new_subs * 1900, new_subs, churned_subs });
  }

  const recent_events = db.prepare(`
    SELECT stripe_event_type AS type, plan_code, created_at
    FROM subscription_events
    ORDER BY created_at DESC
    LIMIT 20
  `).all() as Array<{ type: string; plan_code: string; created_at: number }>;

  return { mrr_cents, arr_cents, active_subscribers, monthly_trend, recent_events };
}

// ---------------------------------------------------------------------------
// Error Monitoring
// ---------------------------------------------------------------------------

export interface ErrorMetricsResult {
  capture_failures: number;
  mcp_failures: number;
  error_trend: Array<{ date: string; capture_failures: number; mcp_failures: number }>;
  recent_errors: Array<{ event_type: string; install_id: string | null; created_at: number; properties: Record<string, unknown> }>;
}

export function getErrorMetrics(days: number): ErrorMetricsResult {
  const db = getDb();
  const since = dayStart(days);

  const capture_failures = (db.prepare(
    `SELECT COUNT(*) AS n FROM analytics_events WHERE event_type = 'element_capture_failed' AND created_at >= ?`,
  ).get(since) as { n: number }).n;

  const mcp_failures = (db.prepare(
    `SELECT COUNT(*) AS n FROM analytics_events WHERE event_type = 'mcp_response_failed' AND created_at >= ?`,
  ).get(since) as { n: number }).n;

  const error_trend: ErrorMetricsResult['error_trend'] = [];
  for (let i = days - 1; i >= 0; i--) {
    const start = dayStart(i);
    const end = dayStart(i - 1);

    const cf = (db.prepare(
      `SELECT COUNT(*) AS n FROM analytics_events WHERE event_type = 'element_capture_failed' AND created_at >= ? AND created_at < ?`,
    ).get(start, end) as { n: number }).n;

    const mf = (db.prepare(
      `SELECT COUNT(*) AS n FROM analytics_events WHERE event_type = 'mcp_response_failed' AND created_at >= ? AND created_at < ?`,
    ).get(start, end) as { n: number }).n;

    error_trend.push({ date: isoDate(start), capture_failures: cf, mcp_failures: mf });
  }

  const recent_errors_raw = db.prepare(`
    SELECT event_type, install_id, created_at, properties_json
    FROM analytics_events
    WHERE event_type IN ('element_capture_failed', 'mcp_response_failed')
    ORDER BY created_at DESC
    LIMIT 50
  `).all() as Array<{ event_type: string; install_id: string | null; created_at: number; properties_json: string | null }>;

  const recent_errors = recent_errors_raw.map((r) => ({
    event_type: r.event_type,
    install_id: r.install_id,
    created_at: r.created_at,
    properties: r.properties_json ? JSON.parse(r.properties_json) as Record<string, unknown> : {},
  }));

  return { capture_failures, mcp_failures, error_trend, recent_errors };
}

// ---------------------------------------------------------------------------
// Retention
// ---------------------------------------------------------------------------

export interface RetentionResult {
  day1_pct: number;
  day7_pct: number;
  day30_pct: number;
  cohorts: Array<{
    cohort_date: string;
    installs: number;
    day1_retained: number;
    day7_retained: number;
    day30_retained: number;
  }>;
}

export function getRetentionMetrics(): RetentionResult {
  const db = getDb();

  // Use last 90 days of installs as the cohort base
  const cohortStart = dayStart(90);
  const installRows = db.prepare(
    `SELECT install_id, created_at FROM installs WHERE created_at >= ? ORDER BY created_at ASC`,
  ).all(cohortStart) as Array<{ install_id: string; created_at: number }>;

  let total = 0;
  let retained_d1 = 0;
  let retained_d7 = 0;
  let retained_d30 = 0;

  // Aggregate by day for cohort table
  const byDay = new Map<string, { installs: number; d1: number; d7: number; d30: number }>();

  for (const row of installRows) {
    const cohortDate = isoDate(row.created_at);
    if (!byDay.has(cohortDate)) byDay.set(cohortDate, { installs: 0, d1: 0, d7: 0, d30: 0 });
    const entry = byDay.get(cohortDate)!;
    entry.installs++;
    total++;

    // Check D1 retention (activity between day 1 and day 2)
    const d1Start = row.created_at + 86_400_000;
    const d1End = row.created_at + 2 * 86_400_000;
    const d1Active = db.prepare(
      `SELECT 1 FROM analytics_events WHERE install_id = ? AND created_at >= ? AND created_at < ? LIMIT 1`,
    ).get(row.install_id, d1Start, d1End);
    if (d1Active) { retained_d1++; entry.d1++; }

    // D7 retention
    const d7Start = row.created_at + 7 * 86_400_000;
    const d7End = row.created_at + 8 * 86_400_000;
    const now = Date.now();
    if (now >= d7Start) {
      const d7Active = db.prepare(
        `SELECT 1 FROM analytics_events WHERE install_id = ? AND created_at >= ? AND created_at < ? LIMIT 1`,
      ).get(row.install_id, d7Start, d7End);
      if (d7Active) { retained_d7++; entry.d7++; }
    }

    // D30 retention
    const d30Start = row.created_at + 30 * 86_400_000;
    const d30End = row.created_at + 31 * 86_400_000;
    if (now >= d30Start) {
      const d30Active = db.prepare(
        `SELECT 1 FROM analytics_events WHERE install_id = ? AND created_at >= ? AND created_at < ? LIMIT 1`,
      ).get(row.install_id, d30Start, d30End);
      if (d30Active) { retained_d30++; entry.d30++; }
    }
  }

  const pct = (n: number, d: number) => d > 0 ? Math.round((n / d) * 100) : 0;

  const cohorts = Array.from(byDay.entries())
    .slice(-30) // last 30 days of cohorts
    .map(([date, v]) => ({
      cohort_date: date,
      installs: v.installs,
      day1_retained: v.d1,
      day7_retained: v.d7,
      day30_retained: v.d30,
    }));

  return {
    day1_pct: pct(retained_d1, total),
    day7_pct: pct(retained_d7, total),
    day30_pct: pct(retained_d30, total),
    cohorts,
  };
}

// ---------------------------------------------------------------------------
// Modal Metrics
// ---------------------------------------------------------------------------

export interface ModalMetricsResult {
  signin_modal_shown: number;
  signin_modal_converted: number;
  signin_modal_conversion_pct: number;
  upgrade_modal_shown: number;
  upgrade_modal_converted: number;
  upgrade_modal_conversion_pct: number;
}

export function getModalMetrics(days: number): ModalMetricsResult {
  const db = getDb();
  const since = dayStart(days);

  const signin_modal_shown = (db.prepare(
    `SELECT COUNT(*) AS n FROM analytics_events WHERE event_type = 'signin_modal_shown' AND created_at >= ?`,
  ).get(since) as { n: number }).n;

  // Conversion: session that had signin_modal_shown also produced account_created
  const signin_modal_converted = (db.prepare(`
    SELECT COUNT(DISTINCT s.session_id) AS n
    FROM analytics_events s
    INNER JOIN analytics_events a
      ON a.session_id = s.session_id
      AND a.event_type = 'account_created'
      AND a.created_at >= s.created_at
    WHERE s.event_type = 'signin_modal_shown'
      AND s.created_at >= ?
      AND s.session_id IS NOT NULL
  `).get(since) as { n: number }).n;

  const upgrade_modal_shown = (db.prepare(
    `SELECT COUNT(*) AS n FROM analytics_events WHERE event_type = 'upgrade_modal_shown' AND created_at >= ?`,
  ).get(since) as { n: number }).n;

  // Conversion: session that had upgrade_modal_shown also produced checkout_started
  const upgrade_modal_converted = (db.prepare(`
    SELECT COUNT(DISTINCT s.session_id) AS n
    FROM analytics_events s
    INNER JOIN analytics_events a
      ON a.session_id = s.session_id
      AND a.event_type = 'checkout_started'
      AND a.created_at >= s.created_at
    WHERE s.event_type = 'upgrade_modal_shown'
      AND s.created_at >= ?
      AND s.session_id IS NOT NULL
  `).get(since) as { n: number }).n;

  const pct = (n: number, d: number) => d > 0 ? Math.round((n / d) * 100) : 0;

  return {
    signin_modal_shown,
    signin_modal_converted,
    signin_modal_conversion_pct: pct(signin_modal_converted, signin_modal_shown),
    upgrade_modal_shown,
    upgrade_modal_converted,
    upgrade_modal_conversion_pct: pct(upgrade_modal_converted, upgrade_modal_shown),
  };
}

// ---------------------------------------------------------------------------
// Page Durations (time on page)
// ---------------------------------------------------------------------------

export interface PageDurationRow {
  url: string;
  avg_duration_ms: number;
  sample_count: number;
}

export function getPageDurations(days: number): PageDurationRow[] {
  const db = getDb();
  const since = dayStart(days);

  // duration_ms is stored in properties_json as {"duration_ms": <number>}
  const rows = db.prepare(`
    SELECT
      url,
      COUNT(*) AS sample_count,
      AVG(CAST(json_extract(properties_json, '$.duration_ms') AS REAL)) AS avg_duration_ms
    FROM analytics_events
    WHERE event_type = 'page_duration'
      AND created_at >= ?
      AND url IS NOT NULL
      AND json_extract(properties_json, '$.duration_ms') IS NOT NULL
    GROUP BY url
    ORDER BY avg_duration_ms DESC
    LIMIT 15
  `).all(since) as Array<{ url: string; avg_duration_ms: number; sample_count: number }>;

  return rows.map((r) => ({
    url: r.url,
    avg_duration_ms: Math.round(r.avg_duration_ms ?? 0),
    sample_count: r.sample_count,
  }));
}

// ---------------------------------------------------------------------------
// Pre-install Journey (website pages visited before installing)
// ---------------------------------------------------------------------------

export interface PreInstallPage {
  url: string;
  visitor_count: number;
}

export function getPreInstallJourney(days: number): PreInstallPage[] {
  const db = getDb();
  const since = dayStart(days);

  // Find visitors who installed (have a matching visitor_id in installs via analytics_events extension_installed)
  // then count which website pages they visited before install
  const rows = db.prepare(`
    SELECT pv.url, COUNT(DISTINCT pv.visitor_id) AS visitor_count
    FROM analytics_events pv
    INNER JOIN analytics_events ei
      ON ei.visitor_id = pv.visitor_id
      AND ei.event_type = 'extension_installed'
      AND ei.created_at >= pv.created_at
    WHERE pv.event_type = 'page_view'
      AND pv.created_at >= ?
      AND pv.visitor_id IS NOT NULL
      AND pv.url IS NOT NULL
    GROUP BY pv.url
    ORDER BY visitor_count DESC
    LIMIT 15
  `).all(since) as Array<{ url: string; visitor_count: number }>;

  return rows;
}

// ---------------------------------------------------------------------------
// Usage Metrics
// ---------------------------------------------------------------------------

export interface UsageMetricsResult {
  avg_time_to_first_capture_min: number | null;
  avg_captures_per_user: number | null;
  mcp_connections: number;
  avg_days_to_first_mcp_use: number | null;
  upgrade_rate_pct: number | null;
}

export function getUsageMetrics(): UsageMetricsResult {
  const db = getDb();

  // Average time (minutes) from install creation to first capture, per install
  const timeToFirstCapture = db.prepare(`
    SELECT AVG((fc.first_captured_at - i.created_at) / 60000.0) AS avg_min
    FROM installs i
    JOIN (
      SELECT install_id, MIN(created_at) AS first_captured_at
      FROM analytics_events
      WHERE event_type = 'element_captured' AND install_id IS NOT NULL
      GROUP BY install_id
    ) fc ON fc.install_id = i.install_id
    WHERE fc.first_captured_at >= i.created_at
  `).get() as { avg_min: number | null };

  // Average captures per user (users who have at least one capture)
  const capturesPerUser = db.prepare(`
    SELECT AVG(cnt) AS avg_captures
    FROM (
      SELECT COUNT(*) AS cnt
      FROM captures
      WHERE user_id IS NOT NULL
      GROUP BY user_id
    )
  `).get() as { avg_captures: number | null };

  // Count of distinct users who have an active MCP OAuth refresh token (connected MCP)
  const mcpConnections = (db.prepare(
    `SELECT COUNT(DISTINCT user_id) AS n FROM oauth_refresh_tokens WHERE revoked_at IS NULL`,
  ).get() as { n: number }).n;

  // Average days from account creation to first MCP call
  const firstMcpUse = db.prepare(`
    SELECT AVG((mu.first_call_at - u.createdAt) / 86400000.0) AS avg_days
    FROM (
      SELECT user_id, MIN(first_call_at) AS first_call_at
      FROM mcp_usage
      WHERE first_call_at IS NOT NULL
      GROUP BY user_id
    ) mu
    JOIN "user" u ON u.id = mu.user_id
    WHERE mu.first_call_at >= u.createdAt
  `).get() as { avg_days: number | null };

  // Upgrade rate: active paid subscribers / users with at least one linked install
  const linkedUsers = (db.prepare(
    `SELECT COUNT(DISTINCT user_id) AS n FROM installs WHERE user_id IS NOT NULL`,
  ).get() as { n: number }).n;

  const paidSubscribers = (db.prepare(
    `SELECT COUNT(DISTINCT user_id) AS n FROM subscriptions WHERE status = 'active' AND plan_code != 'free' AND source = 'stripe'`,
  ).get() as { n: number }).n;

  const upgradeRatePct = linkedUsers > 0
    ? Math.round((paidSubscribers / linkedUsers) * 100 * 10) / 10
    : null;

  return {
    avg_time_to_first_capture_min: timeToFirstCapture.avg_min != null
      ? Math.round(timeToFirstCapture.avg_min * 10) / 10
      : null,
    avg_captures_per_user: capturesPerUser.avg_captures != null
      ? Math.round(capturesPerUser.avg_captures * 10) / 10
      : null,
    mcp_connections: mcpConnections,
    avg_days_to_first_mcp_use: firstMcpUse.avg_days != null
      ? Math.round(firstMcpUse.avg_days * 10) / 10
      : null,
    upgrade_rate_pct: upgradeRatePct,
  };
}

// ---------------------------------------------------------------------------
// Installs List (paginated, searchable)
// ---------------------------------------------------------------------------

export interface AdminInstall {
  install_id: string;
  created_at: number;
  last_seen_at: number;
  extension_version: string | null;
  chrome_version: string | null;
  os_family: string | null;
  screen_width: number | null;
  screen_height: number | null;
  locale: string | null;
  timezone: string | null;
  user_id: string | null;
  user_email: string | null;
  capture_count: number;
  last_capture_at: number | null;
}

export interface InstallListResult {
  installs: AdminInstall[];
  total: number;
  page: number;
}

export function getInstallList(page: number, limit: number, search: string): InstallListResult {
  const db = getDb();
  const offset = (page - 1) * limit;
  const searchLike = search ? `%${search}%` : '%';

  const total = (db.prepare(`
    SELECT COUNT(*) AS n
    FROM installs i
    LEFT JOIN "user" u ON u.id = i.user_id
    WHERE (
      i.install_id LIKE ?
      OR COALESCE(u.email, '') LIKE ?
      OR COALESCE(i.os_family, '') LIKE ?
      OR COALESCE(i.extension_version, '') LIKE ?
    )
  `).get(searchLike, searchLike, searchLike, searchLike) as { n: number }).n;

  const installs = db.prepare(`
    SELECT
      i.install_id,
      i.created_at,
      i.last_seen_at,
      i.extension_version,
      i.chrome_version,
      i.os_family,
      i.screen_width,
      i.screen_height,
      i.locale,
      i.timezone,
      i.user_id,
      u.email AS user_email,
      (
        SELECT COUNT(*)
        FROM analytics_events ae
        WHERE ae.install_id = i.install_id
          AND ae.event_type = 'element_captured'
      ) AS capture_count,
      (
        SELECT MAX(ae.created_at)
        FROM analytics_events ae
        WHERE ae.install_id = i.install_id
          AND ae.event_type = 'element_captured'
      ) AS last_capture_at
    FROM installs i
    LEFT JOIN "user" u ON u.id = i.user_id
    WHERE (
      i.install_id LIKE ?
      OR COALESCE(u.email, '') LIKE ?
      OR COALESCE(i.os_family, '') LIKE ?
      OR COALESCE(i.extension_version, '') LIKE ?
    )
    ORDER BY i.created_at DESC
    LIMIT ? OFFSET ?
  `).all(searchLike, searchLike, searchLike, searchLike, limit, offset) as AdminInstall[];

  return { installs, total, page };
}

// ---------------------------------------------------------------------------
// Limit Reached Breakdown
// ---------------------------------------------------------------------------

export interface LimitReachedRow {
  limit_type: string;
  count: number;
}

export function getLimitReachedBreakdown(days: number): LimitReachedRow[] {
  const db = getDb();
  const since = dayStart(days);

  const rows = db.prepare(`
    SELECT
      COALESCE(json_extract(properties_json, '$.limit_type'), 'unknown') AS limit_type,
      COUNT(*) AS count
    FROM analytics_events
    WHERE event_type = 'limit_reached'
      AND created_at >= ?
    GROUP BY limit_type
    ORDER BY count DESC
  `).all(since) as Array<{ limit_type: string; count: number }>;

  return rows;
}

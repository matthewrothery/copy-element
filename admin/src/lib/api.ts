const BASE = import.meta.env.VITE_API_BASE_URL ?? '';

async function get<T>(path: string, params?: Record<string, string | number>): Promise<T> {
  const url = new URL(`${BASE}${path}`, window.location.origin);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, String(value));
    }
  }
  const res = await fetch(url.toString(), { credentials: 'include' });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

async function del<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OverviewData {
  dau: number;
  installs_today: number;
  captures_today: number;
  mcp_requests_today: number;
  signups_last_n_days: number;
  mrr_cents: number;
  dau_sparkline: Array<{ date: string; value: number }>;
}

export interface FunnelStep {
  name: string;
  count: number;
  pct_of_first: number;
  pct_of_prev: number;
}

export interface WebsiteAnalyticsData {
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

export interface UserListData {
  users: AdminUser[];
  total: number;
  page: number;
}

export interface RevenueData {
  mrr_cents: number;
  arr_cents: number;
  active_subscribers: number;
  monthly_trend: Array<{ month: string; mrr_cents: number; new_subs: number; churned_subs: number }>;
  recent_events: Array<{ type: string; plan_code: string; created_at: number }>;
}

export interface ErrorMetricsData {
  capture_failures: number;
  mcp_failures: number;
  error_trend: Array<{ date: string; capture_failures: number; mcp_failures: number }>;
  recent_errors: Array<{ event_type: string; install_id: string | null; created_at: number; properties: Record<string, unknown> }>;
}

export interface RetentionData {
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

export interface ModalMetricsData {
  signin_modal_shown: number;
  signin_modal_converted: number;
  signin_modal_conversion_pct: number;
  upgrade_modal_shown: number;
  upgrade_modal_converted: number;
  upgrade_modal_conversion_pct: number;
}

export interface PageDurationRow {
  url: string;
  avg_duration_ms: number;
  sample_count: number;
}

export interface PreInstallPage {
  url: string;
  visitor_count: number;
}

export interface LimitReachedRow {
  limit_type: string;
  count: number;
}

export interface UsageMetricsData {
  avg_time_to_first_capture_min: number | null;
  avg_captures_per_user: number | null;
  mcp_connections: number;
  avg_days_to_first_mcp_use: number | null;
  upgrade_rate_pct: number | null;
}

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

export interface ExtensionActivityData {
  period_start: number;
  period_end: number;
  installs: number;
  captures: number;
  unique_capturing_installs: number;
  linked_installs: number;
  recent_installs: ExtensionActivityInstall[];
  recent_captures: ExtensionActivityCapture[];
}

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

export interface InstallListData {
  installs: AdminInstall[];
  total: number;
  page: number;
}

export interface ComplimentaryData {
  grant: { id: string; plan_code: string; created_at: number } | null;
  entitlement: { plan_code: string; active: boolean };
}

export interface BlogGenerateData {
  success: boolean;
  output: string;
  filePath?: string;
}

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

export const api = {
  overview: (days = 30) => get<OverviewData>('/api/admin/overview', { days }),
  funnel: (days = 90) => get<{ steps: FunnelStep[] }>('/api/admin/funnel', { days }),
  analytics: (days = 30) => get<WebsiteAnalyticsData>('/api/admin/analytics', { days }),
  users: (page = 1, limit = 50, search = '') =>
    get<UserListData>('/api/admin/users', { page, limit, search }),
  revenue: (months = 12) => get<RevenueData>('/api/admin/revenue', { months }),
  errors: (days = 7) => get<ErrorMetricsData>('/api/admin/errors', { days }),
  retention: () => get<RetentionData>('/api/admin/retention'),

  modals: (days = 30) => get<ModalMetricsData>('/api/admin/modals', { days }),
  pageDurations: (days = 30) => get<{ pages: PageDurationRow[] }>('/api/admin/page-durations', { days }),
  preInstallJourney: (days = 30) => get<{ pages: PreInstallPage[] }>('/api/admin/pre-install-journey', { days }),
  limitReached: (days = 30) => get<{ breakdown: LimitReachedRow[] }>('/api/admin/limit-reached', { days }),
  usageMetrics: () => get<UsageMetricsData>('/api/admin/usage-metrics'),
  extensionActivity: (hours = 24) => get<ExtensionActivityData>('/api/admin/extension-activity', { hours }),
  installs: (page = 1, limit = 50, search = '') =>
    get<InstallListData>('/api/admin/installs', { page, limit, search }),

  grantComplimentary: (userId: string, planCode = 'pro') =>
    post<ComplimentaryData>(`/api/admin/users/${userId}/complimentary`, { plan_code: planCode }),
  revokeComplimentary: (userId: string) =>
    del<ComplimentaryData>(`/api/admin/users/${userId}/complimentary`),

  generateBlog: (topic: string, author?: string, dryRun = false) =>
    post<BlogGenerateData>('/api/admin/blog/generate', { topic, author, dry_run: dryRun }),
};

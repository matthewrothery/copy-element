import { closeDb } from '../db/connection.js';
import { config } from '../config/index.js';
import { getExtensionActivity } from '../services/admin-queries.js';
import { sendAdminDailySummaryEmail } from '../services/email.js';
import type { AdminDailySummaryItem } from '../emails/admin-daily-summary.js';

const SUMMARY_WINDOW_MS = 24 * 60 * 60 * 1000;
const SUMMARY_TIME_ZONE = 'Australia/Sydney';
const RECENT_ITEM_LIMIT = 10;

function formatDateTime(ts: number): string {
  return new Intl.DateTimeFormat('en-AU', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: SUMMARY_TIME_ZONE,
  }).format(new Date(ts));
}

function shortInstallId(id: string | null): string {
  if (!id) return 'unknown install';
  return id.length > 10 ? `${id.slice(0, 6)}...${id.slice(-4)}` : id;
}

function hostFromUrl(url: string | null): string {
  if (!url) return 'unknown source';
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function buildInstallItems(activity: ReturnType<typeof getExtensionActivity>): AdminDailySummaryItem[] {
  return activity.recent_installs.slice(0, RECENT_ITEM_LIMIT).map((install) => ({
    label: `${formatDateTime(install.created_at)} - ${shortInstallId(install.install_id)}`,
    detail: [
      install.user_email ?? 'Guest',
      install.extension_version ? `v${install.extension_version}` : null,
      install.os_family,
      install.chrome_version ? `Chrome ${install.chrome_version}` : null,
      install.timezone,
    ].filter(Boolean).join(' - '),
  }));
}

function buildCaptureItems(activity: ReturnType<typeof getExtensionActivity>): AdminDailySummaryItem[] {
  return activity.recent_captures.slice(0, RECENT_ITEM_LIMIT).map((capture) => ({
    label: `${formatDateTime(capture.created_at)} - ${hostFromUrl(capture.source_url)}`,
    detail: [
      capture.user_email ?? 'Guest',
      shortInstallId(capture.install_id),
    ].filter(Boolean).join(' - '),
  }));
}

async function main(): Promise<void> {
  const periodEnd = Date.now();
  const periodStart = periodEnd - SUMMARY_WINDOW_MS;
  const activity = getExtensionActivity(periodStart, periodEnd, RECENT_ITEM_LIMIT);

  await sendAdminDailySummaryEmail(config.ADMIN_SUMMARY_EMAIL, {
    periodLabel: `${formatDateTime(periodStart)} to ${formatDateTime(periodEnd)} (${SUMMARY_TIME_ZONE})`,
    installs: activity.installs,
    captures: activity.captures,
    uniqueCapturingInstalls: activity.unique_capturing_installs,
    linkedInstalls: activity.linked_installs,
    recentInstalls: buildInstallItems(activity),
    recentCaptures: buildCaptureItems(activity),
  });
}

main()
  .catch((err: unknown) => {
    console.error('[admin-summary] Failed to send daily summary:', err);
    process.exitCode = 1;
  })
  .finally(() => {
    closeDb();
  });

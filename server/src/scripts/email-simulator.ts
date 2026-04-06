import 'dotenv/config';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Load .env from server root (two directories up from src/scripts/)
const __dirname = dirname(fileURLToPath(import.meta.url));
process.env['DOTENV_CONFIG_PATH'] = resolve(__dirname, '../../.env');

import { getDb } from '../db/connection.js';
import {
  sendWelcomeEmail,
  sendFirstCaptureEmail,
  sendOnboardingReminderEmail,
  sendAccountNudgeEmail,
  sendCaptureMilestoneEmail,
  sendValueEmail,
  sendSaveYourWorkEmail,
  sendLimitReachedEmail,
  sendPostLimitFollowupEmail,
} from '../services/email.js';

interface Step {
  day: number;
  label: string;
  send: () => Promise<void>;
}

function parseArgs(): { email: string; name: string; scale: number; dryRun: boolean } {
  const args = process.argv.slice(2);
  let email = '';
  let name = 'there';
  let scale = 1;
  let dryRun = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--email' && args[i + 1]) {
      email = args[++i];
    } else if (args[i] === '--name' && args[i + 1]) {
      name = args[++i];
    } else if (args[i] === '--scale' && args[i + 1]) {
      scale = parseFloat(args[++i]);
    } else if (args[i] === '--dry-run') {
      dryRun = true;
    }
  }

  return { email, name, scale, dryRun };
}

function formatTime(ms: number): string {
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const m = Math.floor(ms / 60_000);
  const s = Math.round((ms % 60_000) / 1000);
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  const { email, name, scale, dryRun } = parseArgs();

  if (!email) {
    console.error('[simulator] Error: --email is required');
    console.error('  Usage: npm run email:simulate -- --email you@example.com [--name "Matt"] [--scale 2] [--dry-run]');
    process.exit(1);
  }

  if (isNaN(scale) || scale <= 0) {
    console.error('[simulator] Error: --scale must be a positive number');
    process.exit(1);
  }

  // Minutes per simulated day → milliseconds per simulated day
  const msPerDay = scale * 60 * 1000;

  const QUOTA_USED = 20;
  const QUOTA_LIMIT = 25;

  const steps: Step[] = [
    {
      day: 0,
      label: 'Welcome',
      send: () => sendWelcomeEmail(email, name),
    },
    {
      day: 0.5,
      label: 'First capture',
      send: () => sendFirstCaptureEmail(email, name),
    },
    {
      day: 1,
      label: 'Onboarding reminder (24h job)',
      send: () => sendOnboardingReminderEmail(email, name),
    },
    {
      day: 1.5,
      label: 'Account nudge (3rd capture)',
      send: () => sendAccountNudgeEmail(email, name),
    },
    {
      day: 2,
      label: 'Capture milestone (10th capture)',
      send: () => sendCaptureMilestoneEmail(email, name),
    },
    {
      day: 3,
      label: 'Value email (Day 3 job)',
      send: () => sendValueEmail(email, name),
    },
    {
      day: 3.5,
      label: `Save your work (${QUOTA_USED}/${QUOTA_LIMIT} quota)`,
      send: () => sendSaveYourWorkEmail(email, QUOTA_USED, QUOTA_LIMIT, name),
    },
    {
      day: 4,
      label: `Limit reached (${QUOTA_LIMIT}/${QUOTA_LIMIT} quota)`,
      send: () => sendLimitReachedEmail(email, QUOTA_LIMIT, name),
    },
    {
      day: 6,
      label: 'Post-limit followup (48h job)',
      send: () => sendPostLimitFollowupEmail(email, QUOTA_LIMIT, name),
    },
  ];

  const startTime = Date.now();

  console.log('[simulator] Email Sequence Simulator');
  console.log(`[simulator] Target:  ${email}`);
  console.log(`[simulator] Name:    ${name}`);
  console.log(`[simulator] Scale:   ${scale} min/day  (1 simulated day = ${formatTime(msPerDay)})`);
  console.log(`[simulator] Mode:    ${dryRun ? 'DRY RUN (no emails sent)' : 'LIVE'}`);
  console.log('');
  console.log('[simulator] Sequence plan:');

  const absoluteTimes = steps.map((step) => ({
    ...step,
    offsetMs: Math.round(step.day * msPerDay),
    absoluteMs: startTime + Math.round(step.day * msPerDay),
  }));

  for (const step of absoluteTimes) {
    const sendAt = new Date(step.absoluteMs).toLocaleTimeString();
    console.log(`  T+${formatTime(step.offsetMs).padEnd(8)}  Day ${String(step.day).padEnd(4)}  [${sendAt}]  ${step.label}`);
  }

  const totalDuration = absoluteTimes[absoluteTimes.length - 1].offsetMs;
  console.log('');
  console.log(`[simulator] Total runtime: ~${formatTime(totalDuration)}`);
  console.log('');

  if (dryRun) {
    console.log('[simulator] Dry run complete. No emails sent.');
    return;
  }

  // Initialize DB and clear dedup records for this email
  getDb();
  const db = getDb();
  const deleted = db.prepare('DELETE FROM email_sends WHERE email = ?').run(email);
  console.log(`[simulator] Cleared ${deleted.changes} email_sends record(s) for ${email}`);
  console.log('[simulator] Starting sequence...');
  console.log('');

  for (const step of absoluteTimes) {
    const now = Date.now();
    const delay = step.absoluteMs - now;

    if (delay > 0) {
      console.log(`[simulator] Waiting ${formatTime(delay)} until: ${step.label}`);
      await sleep(delay);
    }

    console.log(`[simulator] Sending: ${step.label}`);
    try {
      await step.send();
      console.log(`[simulator] Sent:    ${step.label}`);
    } catch (err) {
      console.error(`[simulator] Error sending "${step.label}":`, err);
    }
  }

  console.log('');
  console.log('[simulator] Sequence complete. All 9 emails sent.');
}

main().catch((err) => {
  console.error('[simulator] Fatal error:', err);
  process.exit(1);
});

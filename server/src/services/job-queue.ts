import { nanoid } from 'nanoid';
import { getDb } from '../db/connection.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type JobType = 'onboarding_24h' | 'onboarding_day3' | 'post_limit_followup';

export interface JobPayloads {
  onboarding_24h: { userId: string; email: string; name?: string };
  onboarding_day3: { userId: string; email: string; name?: string };
  post_limit_followup: { userId: string; email: string; name?: string; quotaLimit: number };
}

interface JobRow {
  id: string;
  type: string;
  payload_json: string;
  status: string;
  run_at: number;
  created_at: number;
  started_at: number | null;
  completed_at: number | null;
  attempts: number;
  max_attempts: number;
  last_error: string | null;
}

// ---------------------------------------------------------------------------
// Queue operations
// ---------------------------------------------------------------------------

export function enqueueJob<T extends JobType>(
  type: T,
  payload: JobPayloads[T],
  runAt: number,
): void {
  const db = getDb();
  db.prepare(
    `INSERT INTO job_queue (id, type, payload_json, status, run_at, created_at)
     VALUES (?, ?, ?, 'pending', ?, ?)`,
  ).run(nanoid(), type, JSON.stringify(payload), runAt, Date.now());
}

function claimNextJob(): JobRow | undefined {
  const db = getDb();
  const now = Date.now();

  return db.transaction((): JobRow | undefined => {
    const job = db
      .prepare(
        `SELECT * FROM job_queue
         WHERE status = 'pending' AND run_at <= ?
         ORDER BY run_at ASC
         LIMIT 1`,
      )
      .get(now) as JobRow | undefined;

    if (!job) return undefined;

    db.prepare(
      `UPDATE job_queue
       SET status = 'processing', started_at = ?, attempts = attempts + 1
       WHERE id = ? AND status = 'pending'`,
    ).run(now, job.id);

    return job;
  })();
}

function completeJob(id: string): void {
  getDb()
    .prepare(`UPDATE job_queue SET status = 'done', completed_at = ? WHERE id = ?`)
    .run(Date.now(), id);
}

function failJob(id: string, error: string, attempts: number, maxAttempts: number): void {
  const db = getDb();

  if (attempts >= maxAttempts) {
    db.prepare(
      `UPDATE job_queue SET status = 'failed', last_error = ?, completed_at = ? WHERE id = ?`,
    ).run(error, Date.now(), id);
  } else {
    // Exponential backoff: 5m, 15m, 45m, ...
    const backoffMs = Math.pow(3, attempts - 1) * 5 * 60 * 1000;
    db.prepare(
      `UPDATE job_queue SET status = 'pending', last_error = ?, run_at = ? WHERE id = ?`,
    ).run(error, Date.now() + backoffMs, id);
  }
}

// ---------------------------------------------------------------------------
// Handlers — wired to email functions in Phase 3
// ---------------------------------------------------------------------------

type JobHandler = (payload: unknown) => Promise<void>;

const handlers: Record<JobType, JobHandler> = {
  onboarding_24h: async (payload) => {
    const { sendOnboardingReminderEmail } = await import('./email.js');
    const { email, name } = payload as JobPayloads['onboarding_24h'];
    await sendOnboardingReminderEmail(email, name);
  },
  onboarding_day3: async (payload) => {
    const { sendValueEmail } = await import('./email.js');
    const { email, name } = payload as JobPayloads['onboarding_day3'];
    await sendValueEmail(email, name);
  },
  post_limit_followup: async (payload) => {
    const { sendPostLimitFollowupEmail } = await import('./email.js');
    const { email, name, quotaLimit } = payload as JobPayloads['post_limit_followup'];
    await sendPostLimitFollowupEmail(email, quotaLimit, name);
  },
};

// ---------------------------------------------------------------------------
// Worker
// ---------------------------------------------------------------------------

let isProcessing = false;
let workerInterval: ReturnType<typeof setInterval> | null = null;

async function processNextJob(): Promise<void> {
  if (isProcessing) return;
  isProcessing = true;

  try {
    const job = claimNextJob();
    if (!job) return;

    const handler = handlers[job.type as JobType];
    if (!handler) {
      failJob(job.id, `Unknown job type: ${job.type}`, job.attempts, job.max_attempts);
      return;
    }

    const payload = JSON.parse(job.payload_json) as unknown;
    await handler(payload);
    completeJob(job.id);
  } catch (err) {
    console.warn('[job-queue] processNextJob error:', err);
  } finally {
    isProcessing = false;
  }
}

export function startJobWorker(intervalMs = 60_000): void {
  if (workerInterval) return;

  void processNextJob();

  workerInterval = setInterval(() => {
    processNextJob().catch((err) => console.warn('[job-queue] worker tick error:', err));
  }, intervalMs);

  console.log('[job-queue] Worker started');
}

export function stopJobWorker(): void {
  if (workerInterval) {
    clearInterval(workerInterval);
    workerInterval = null;
  }
}

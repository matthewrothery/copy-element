/**
 * AWS Lambda entry points for the auto-blogger.
 *
 * Two handlers shipped in the same zip:
 *   - topicsHandler  — runs daily topic article cycle (N articles in parallel)
 *   - newsHandler    — runs daily news commentary cycle
 *
 * Both are triggered by EventBridge Scheduler (see terraform/lambda.tf).
 * Local CLI invocation uses src/index.ts instead.
 */
import { buildCycleDeps, runParallelTopics, runNewsOnce } from "./index.js";

type ScheduledEvent = {
  source?: string;
  "detail-type"?: string;
};

export async function topicsHandler(_event: ScheduledEvent): Promise<void> {
  const deps = await buildCycleDeps();
  const summary = await runParallelTopics(deps.config.dailyArticles, deps);
  const failed = summary.failures.length;
  if (failed > 0) {
    throw new Error(
      `topics cycle completed with ${failed} failure(s): ${summary.failures.map((f) => f.label).join(", ")}`
    );
  }
}

export async function newsHandler(_event: ScheduledEvent): Promise<void> {
  const deps = await buildCycleDeps();
  const summary = await runNewsOnce(deps);
  const failed = summary.failures.length;
  if (failed > 0) {
    throw new Error(
      `news cycle completed with ${failed} failure(s): ${summary.failures.map((f) => f.label).join(", ")}`
    );
  }
}

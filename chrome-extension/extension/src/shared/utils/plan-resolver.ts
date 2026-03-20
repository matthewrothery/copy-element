import type { AuthStatePayload } from "../types/messages";
import type { PlanCode } from "../types/plan";

/**
 * Resolves the effective plan from auth state.
 * Returns "guest" when not signed in, "pro" for pro accounts, "free" otherwise.
 */
export function resolvePlan(authState: AuthStatePayload): PlanCode {
  if (!authState.signed_in) return "guest";
  const raw = authState.user_plan?.toLowerCase() ?? "free";
  if (raw === "pro") return "pro";
  return "free";
}

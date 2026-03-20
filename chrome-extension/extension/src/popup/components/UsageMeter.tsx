import type { JSX } from "react";
import type { PlanCode } from "../../shared/types/plan";
import { getUsageTier } from "../../shared/usage";

interface UsageMeterProps {
  plan: PlanCode;
  used: number;
  limit: number | "unlimited";
  mcpUsed?: number;
  mcpLimit?: number | "unlimited";
}

function getHintText(tier: "quiet" | "default" | "noticeable" | "urgent", used: number, limit: number): string | null {
  if (tier === "quiet" || tier === "default") return null;
  if (tier === "noticeable") return "Getting close to your monthly limit.";
  const remaining = Math.max(0, limit - used);
  if (remaining === 0) return "You've reached your limit. Upgrade for unlimited access.";
  const noun = remaining === 1 ? "capture" : "captures";
  return `${remaining} ${noun} left this month. Upgrade for unlimited access.`;
}

export function UsageMeter({ plan, used, limit, mcpUsed, mcpLimit }: UsageMeterProps): JSX.Element | null {
  // Pro has unlimited captures — hide capture meter. Only show MCP meter if applicable.
  if (limit === "unlimited" && (mcpLimit === "unlimited" || mcpLimit === undefined)) {
    return null;
  }

  const showCaptureMeter = limit !== "unlimited";
  const showMcpMeter =
    plan === "free" &&
    typeof mcpUsed === "number" &&
    typeof mcpLimit === "number";

  if (!showCaptureMeter && !showMcpMeter) {
    return null;
  }

  const captureRatio = showCaptureMeter ? Math.min(used / (limit as number), 1) : 0;
  const tier = showCaptureMeter ? getUsageTier(captureRatio) : "quiet";
  const hintText = showCaptureMeter ? getHintText(tier, used, limit as number) : null;

  return (
    <div
      className={`usage-meter usage-meter--${tier}`}
      role="region"
      aria-label="Monthly usage"
    >
      {showCaptureMeter && (
        <>
          <p className="usage-meter-label">Usage this month: {used}/{limit as number}</p>
          <div className="usage-meter-row">
            <div
              className="usage-meter-bar"
              role="progressbar"
              aria-valuenow={used}
              aria-valuemin={0}
              aria-valuemax={limit as number}
              aria-label={`Captures this month: ${used} of ${limit as number} used`}
            >
              <div
                className="usage-meter-bar-fill"
                style={{ width: `${captureRatio * 100}%` }}
              />
            </div>
            <span className="usage-meter-count">{used}/{limit as number}</span>
          </div>
          {hintText && <p className="usage-meter-hint">{hintText}</p>}
        </>
      )}
      {showMcpMeter && (
        <p className="usage-meter-label usage-meter-mcp">
          MCP requests: {mcpUsed}/{mcpLimit}
        </p>
      )}
    </div>
  );
}

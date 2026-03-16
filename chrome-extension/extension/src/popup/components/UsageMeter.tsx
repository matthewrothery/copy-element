import type { JSX } from "react";
import { getUsageTier } from "../../shared/usage";

interface UsageMeterProps {
  used: number;
  limit: number;
}

function getHintText(tier: "quiet" | "default" | "noticeable" | "urgent", used: number, limit: number): string | null {
  if (tier === "quiet" || tier === "default") return null;
  if (tier === "noticeable") return "Getting close to your monthly limit.";
  const remaining = Math.max(0, limit - used);
  if (remaining === 0) return "You've reached your limit. Upgrade for unlimited access.";
  return `${remaining} captures left this month. Upgrade for unlimited access.`;
}

export function UsageMeter({ used, limit }: UsageMeterProps): JSX.Element {
  const ratio = limit > 0 ? Math.min(used / limit, 1) : 0;
  const tier = getUsageTier(ratio);
  const hintText = getHintText(tier, used, limit);

  return (
    <div
      className={`usage-meter usage-meter--${tier}`}
      role="region"
      aria-label="Monthly capture usage"
    >
      <p className="usage-meter-label">Usage this month: {used}/{limit}</p>
      <div className="usage-meter-row">
        <div
          className="usage-meter-bar"
          role="progressbar"
          aria-valuenow={used}
          aria-valuemin={0}
          aria-valuemax={limit}
          aria-label={`Usage this month: ${used} of ${limit} used`}
        >
          <div
            className="usage-meter-bar-fill"
            style={{ width: `${ratio * 100}%` }}
          />
        </div>
        <span className="usage-meter-count">{used}/{limit}</span>
      </div>
      {hintText && (
        <p className="usage-meter-hint">
          {hintText}
        </p>
      )}
    </div>
  );
}

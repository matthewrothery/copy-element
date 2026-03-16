import type { JSX } from "react";
import { USAGE_HINT_THRESHOLD } from "../../shared/usage";

interface UsageMeterProps {
  used: number;
  limit: number;
}

export function UsageMeter({ used, limit }: UsageMeterProps): JSX.Element {
  const ratio = limit > 0 ? Math.min(used / limit, 1) : 0;
  const showHint = ratio >= USAGE_HINT_THRESHOLD;

  return (
    <div className="usage-meter" role="region" aria-label="Monthly capture usage">
      <p className="usage-meter-label">Captures this month</p>
      <div className="usage-meter-row">
        <div
          className="usage-meter-bar"
          role="progressbar"
          aria-valuenow={used}
          aria-valuemin={0}
          aria-valuemax={limit}
          aria-label={`Captures this month: ${used} of ${limit} used`}
        >
          <div
            className="usage-meter-bar-fill"
            style={{ width: `${ratio * 100}%` }}
          />
        </div>
        <span className="usage-meter-count">
          {used} / {limit} used
        </span>
      </div>
      {showHint && (
        <p className="usage-meter-hint">
          You&apos;re getting close to your monthly capture limit. Upgrade for
          unlimited captures.
        </p>
      )}
    </div>
  );
}

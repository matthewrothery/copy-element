import './FunnelChart.css';
import type { FunnelStep } from '@/lib/api';
import { formatNumber } from '@/lib/format';

interface FunnelChartProps {
  steps: FunnelStep[];
}

export function FunnelChart({ steps }: FunnelChartProps): React.ReactElement {
  if (steps.length === 0) {
    return <div className="funnel-chart funnel-chart--empty"><span>No data</span></div>;
  }

  const max = steps[0].count || 1;

  return (
    <div className="funnel-chart">
      {steps.map((step, i) => (
        <div key={i} className="funnel-step">
          <div className="funnel-step__meta">
            <span className="funnel-step__name">{step.name}</span>
            <span className="funnel-step__count">{formatNumber(step.count)}</span>
            <span className="funnel-step__pct funnel-step__pct--total" title="% of total installs">
              {step.pct_of_first}%
            </span>
            {i > 0 && (
              <span
                className={`funnel-step__pct funnel-step__pct--prev ${step.pct_of_prev < 50 ? 'funnel-step__pct--warn' : ''}`}
                title="% of previous step"
              >
                ↓{step.pct_of_prev}%
              </span>
            )}
          </div>
          <div className="funnel-step__track">
            <div
              className="funnel-step__bar"
              style={{ width: `${(step.count / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

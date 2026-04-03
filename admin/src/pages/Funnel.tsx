import './Funnel.css';
import { useEffect, useState } from 'react';
import { api, type FunnelStep } from '@/lib/api';
import { FunnelChart } from '@/components/Chart/FunnelChart';
import { Spinner } from '@/components/Spinner/Spinner';

const DAY_OPTIONS = [30, 60, 90, 180, 365] as const;
type DayOption = (typeof DAY_OPTIONS)[number];

export function Funnel(): React.ReactElement {
  const [steps, setSteps] = useState<FunnelStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState<DayOption>(90);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.funnel(days)
      .then((d) => setSteps(d.steps))
      .catch((e: unknown) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [days]);

  if (loading) return <div className="funnel__loading"><Spinner /></div>;
  if (error) return <div className="funnel__error">Failed to load funnel data.</div>;

  return (
    <div className="funnel">
      <div className="funnel__header">
        <p className="funnel__description">
          Cohort-based: installs within the selected window, tracked through each stage.
          Step-to-step drop-off shown in red when below 50%.
        </p>
        <select
          className="funnel__days-select"
          value={days}
          onChange={(e) => setDays(Number(e.target.value) as DayOption)}
          aria-label="Date range"
        >
          {DAY_OPTIONS.map((d) => (
            <option key={d} value={d}>Last {d} days</option>
          ))}
        </select>
      </div>
      <div className="funnel__card">
        <FunnelChart steps={steps} />
      </div>
    </div>
  );
}

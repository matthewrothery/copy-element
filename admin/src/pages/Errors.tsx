import './Errors.css';
import { useEffect, useState } from 'react';
import { api, type ErrorMetricsData } from '@/lib/api';
import { StatCard } from '@/components/StatCard/StatCard';
import { LineChart } from '@/components/Chart/LineChart';
import { Spinner } from '@/components/Spinner/Spinner';
import { formatRelativeDate } from '@/lib/format';

export function Errors(): React.ReactElement {
  const [data, setData] = useState<ErrorMetricsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.errors(7)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="errors__loading"><Spinner /></div>;
  if (!data) return <div className="errors__error">Failed to load error data.</div>;

  return (
    <div className="errors">
      <div className="errors__grid">
        <StatCard label="Capture Failures (7d)" value={data.capture_failures} />
        <StatCard label="MCP Failures (7d)" value={data.mcp_failures} />
      </div>

      <div className="errors__card">
        <LineChart
          data={data.error_trend.map((d) => ({ date: d.date, value: d.capture_failures + d.mcp_failures }))}
          label="Total Errors"
          height={120}
          color="var(--danger)"
        />
      </div>

      <div className="errors__card">
        <h3 className="errors__section-title">Recent Errors</h3>
        <div className="errors__list">
          {data.recent_errors.length === 0 ? (
            <p className="errors__empty">No errors — great!</p>
          ) : (
            data.recent_errors.map((e, i) => (
              <div key={i} className="errors__item">
                <span className="errors__type">{e.event_type}</span>
                <span className="errors__install">{e.install_id ?? '—'}</span>
                <span className="errors__date">{formatRelativeDate(e.created_at)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

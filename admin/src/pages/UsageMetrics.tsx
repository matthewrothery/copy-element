import './UsageMetrics.css';
import { useEffect, useState } from 'react';
import { api, type UsageMetricsData } from '@/lib/api';
import { StatCard } from '@/components/StatCard/StatCard';
import { Spinner } from '@/components/Spinner/Spinner';

function formatMinutes(min: number | null): string {
  if (min === null) return '—';
  if (min < 1) return `${Math.round(min * 60)}s`;
  if (min < 60) return `${min.toFixed(1)}m`;
  return `${(min / 60).toFixed(1)}h`;
}

function formatDays(days: number | null): string {
  if (days === null) return '—';
  if (days < 1) return `${Math.round(days * 24)}h`;
  return `${days.toFixed(1)}d`;
}

export function UsageMetrics(): React.ReactElement {
  const [data, setData] = useState<UsageMetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.usageMetrics()
      .then(setData)
      .catch((e: unknown) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="usage__loading"><Spinner /></div>;
  if (error || !data) return <div className="usage__error">Failed to load usage metrics.</div>;

  return (
    <div className="usage">
      <div className="usage__grid">
        <StatCard
          label="Avg Time to First Capture"
          value={formatMinutes(data.avg_time_to_first_capture_min)}
          sub="Install to first captured element"
        />
        <StatCard
          label="Avg Captures per User"
          value={data.avg_captures_per_user !== null ? String(data.avg_captures_per_user) : '—'}
          sub="Across users with at least one capture"
        />
        <StatCard
          label="MCP Connections"
          value={String(data.mcp_connections)}
          sub="Users who have created an MCP token"
        />
        <StatCard
          label="Avg Days to First MCP Use"
          value={formatDays(data.avg_days_to_first_mcp_use)}
          sub="Account creation to first MCP call"
        />
        <StatCard
          label="Upgrade Rate"
          value={data.upgrade_rate_pct !== null ? `${data.upgrade_rate_pct}%` : '—'}
          sub="Paid subscribers / users with linked installs"
        />
      </div>
    </div>
  );
}

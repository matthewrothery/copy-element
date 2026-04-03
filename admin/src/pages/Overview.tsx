import './Overview.css';
import { useEffect, useState } from 'react';
import { api, type OverviewData } from '@/lib/api';
import { StatCard } from '@/components/StatCard/StatCard';
import { LineChart } from '@/components/Chart/LineChart';
import { Spinner } from '@/components/Spinner/Spinner';
import { formatNumber, formatCents } from '@/lib/format';

export function Overview(): React.ReactElement {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.overview(30)
      .then(setData)
      .catch((e: unknown) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="overview__loading"><Spinner /></div>;
  }

  if (error || !data) {
    return <div className="overview__error">Failed to load overview data.</div>;
  }

  return (
    <div className="overview">
      <div className="overview__grid">
        <StatCard label="Daily Active Users" value={formatNumber(data.dau)} />
        <StatCard label="Captures Today" value={formatNumber(data.captures_today)} />
        <StatCard label="MCP Requests Today" value={formatNumber(data.mcp_requests_today)} />
        <StatCard label="Signups (30d)" value={formatNumber(data.signups_last_n_days)} />
        <StatCard label="MRR" value={formatCents(data.mrr_cents)} />
      </div>

      <div className="overview__chart-section">
        <h2 className="overview__section-title">Daily Active Users (14 days)</h2>
        <div className="overview__chart-card">
          <LineChart
            data={data.dau_sparkline.map((d) => ({ date: d.date, value: d.value }))}
            height={140}
          />
        </div>
      </div>
    </div>
  );
}

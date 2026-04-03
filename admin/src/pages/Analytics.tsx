import './Analytics.css';
import { useEffect, useState } from 'react';
import { api, type WebsiteAnalyticsData, type PageDurationRow } from '@/lib/api';
import { StatCard } from '@/components/StatCard/StatCard';
import { LineChart } from '@/components/Chart/LineChart';
import { Table, type Column } from '@/components/Table/Table';
import { Spinner } from '@/components/Spinner/Spinner';
import { formatNumber } from '@/lib/format';

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60_000)}m ${Math.round((ms % 60_000) / 1000)}s`;
}

export function Analytics(): React.ReactElement {
  const [data, setData] = useState<WebsiteAnalyticsData | null>(null);
  const [pageDurations, setPageDurations] = useState<PageDurationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.analytics(30),
      api.pageDurations(30),
    ])
      .then(([analyticsData, durationsData]) => {
        setData(analyticsData);
        setPageDurations(durationsData.pages);
      })
      .catch((e: unknown) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="analytics__loading"><Spinner /></div>;
  if (error || !data) return <div className="analytics__error">Failed to load analytics data.</div>;

  const pageColumns: Column<{ url: string; views: number }>[] = [
    { key: 'url', header: 'Page', render: (r) => r.url },
    { key: 'views', header: 'Views', render: (r) => formatNumber(r.views), width: '100px' },
  ];

  const refColumns: Column<{ referrer: string; visits: number }>[] = [
    { key: 'referrer', header: 'Referrer', render: (r) => r.referrer },
    { key: 'visits', header: 'Visits', render: (r) => formatNumber(r.visits), width: '100px' },
  ];

  const durationColumns: Column<PageDurationRow>[] = [
    { key: 'url', header: 'Page', render: (r) => r.url },
    { key: 'avg_duration_ms', header: 'Avg. Time', render: (r) => formatDuration(r.avg_duration_ms), width: '100px' },
    { key: 'sample_count', header: 'Samples', render: (r) => formatNumber(r.sample_count), width: '80px' },
  ];

  return (
    <div className="analytics">
      <div className="analytics__grid">
        <StatCard label="Page Views (30d)" value={formatNumber(data.page_views)} />
        <StatCard label="Unique Visitors (30d)" value={formatNumber(data.unique_visitors)} />
        <StatCard label="Pricing Views" value={formatNumber(data.conversions.pricing_viewed)} />
        <StatCard label="Signups" value={formatNumber(data.conversions.signup_completed)} />
        <StatCard label="Checkouts" value={formatNumber(data.conversions.checkout_completed)} />
        <StatCard label="Chrome CTA Clicks" value={formatNumber(data.conversions.chrome_store_link_clicked)} />
      </div>

      <div className="analytics__chart-card">
        <LineChart
          data={data.daily_visitors.map((d) => ({ date: d.date, value: d.visitors }))}
          label="Daily Unique Visitors"
          height={140}
        />
      </div>

      <div className="analytics__tables">
        <div>
          <h3 className="analytics__table-title">Top Pages</h3>
          <Table columns={pageColumns} rows={data.top_pages} keyFn={(r) => r.url} />
        </div>
        <div>
          <h3 className="analytics__table-title">Top Referrers</h3>
          <Table columns={refColumns} rows={data.top_referrers} keyFn={(r) => r.referrer} />
        </div>
      </div>

      {pageDurations.length > 0 && (
        <div>
          <h3 className="analytics__table-title">Avg. Time on Page (30d)</h3>
          <Table columns={durationColumns} rows={pageDurations} keyFn={(r) => r.url} />
        </div>
      )}
    </div>
  );
}

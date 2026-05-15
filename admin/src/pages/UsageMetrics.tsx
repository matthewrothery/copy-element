import './UsageMetrics.css';
import { useEffect, useState } from 'react';
import {
  api,
  type ExtensionActivityCapture,
  type ExtensionActivityData,
  type ExtensionActivityInstall,
  type UsageMetricsData,
} from '@/lib/api';
import { StatCard } from '@/components/StatCard/StatCard';
import { Spinner } from '@/components/Spinner/Spinner';
import { Table, type Column } from '@/components/Table/Table';
import { formatNumber } from '@/lib/format';

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

function formatDateTime(ts: number): string {
  return new Date(ts).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function shortId(id: string | null): string {
  if (!id) return '—';
  return id.length > 10 ? `${id.slice(0, 6)}…${id.slice(-4)}` : id;
}

function hostFromUrl(url: string | null): string {
  if (!url) return '—';
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export function UsageMetrics(): React.ReactElement {
  const [data, setData] = useState<UsageMetricsData | null>(null);
  const [activity, setActivity] = useState<ExtensionActivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.usageMetrics(),
      api.extensionActivity(24),
    ])
      .then(([usageData, activityData]) => {
        setData(usageData);
        setActivity(activityData);
      })
      .catch((e: unknown) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="usage__loading"><Spinner /></div>;
  if (error || !data || !activity) return <div className="usage__error">Failed to load usage metrics.</div>;

  const installColumns: Column<ExtensionActivityInstall>[] = [
    { key: 'created_at', header: 'Installed', render: (r) => formatDateTime(r.created_at), width: '140px' },
    { key: 'install_id', header: 'Install', render: (r) => shortId(r.install_id), width: '120px' },
    { key: 'user_email', header: 'Account', render: (r) => r.user_email ?? 'Guest' },
    { key: 'version', header: 'Version', render: (r) => r.extension_version ?? '—', width: '90px' },
    { key: 'environment', header: 'Environment', render: (r) => [r.os_family, r.chrome_version ? `Chrome ${r.chrome_version}` : null].filter(Boolean).join(' · ') || '—' },
    { key: 'timezone', header: 'Timezone', render: (r) => r.timezone ?? '—' },
  ];

  const captureColumns: Column<ExtensionActivityCapture>[] = [
    { key: 'created_at', header: 'Captured', render: (r) => formatDateTime(r.created_at), width: '140px' },
    { key: 'install_id', header: 'Install', render: (r) => shortId(r.install_id), width: '120px' },
    { key: 'user_email', header: 'Account', render: (r) => r.user_email ?? 'Guest' },
    { key: 'source_url', header: 'Source', render: (r) => hostFromUrl(r.source_url) },
  ];

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

      <section className="usage__activity" aria-labelledby="extension-activity-title">
        <div className="usage__activity-header">
          <h2 id="extension-activity-title" className="usage__section-title">Extension Activity</h2>
          <span className="usage__period">Last 24 hours</span>
        </div>

        <div className="usage__grid">
          <StatCard label="New Installs" value={formatNumber(activity.installs)} />
          <StatCard label="Captures" value={formatNumber(activity.captures)} />
          <StatCard label="Capturing Installs" value={formatNumber(activity.unique_capturing_installs)} />
          <StatCard label="Linked Installs" value={formatNumber(activity.linked_installs)} />
        </div>

        <div className="usage__tables">
          <div>
            <h3 className="usage__table-title">Recent Installs</h3>
            <Table
              columns={installColumns}
              rows={activity.recent_installs}
              keyFn={(r) => r.install_id}
              emptyMessage="No installs in the last 24 hours"
            />
          </div>
          <div>
            <h3 className="usage__table-title">Recent Captures</h3>
            <Table
              columns={captureColumns}
              rows={activity.recent_captures}
              keyFn={(r) => r.id}
              emptyMessage="No captures in the last 24 hours"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

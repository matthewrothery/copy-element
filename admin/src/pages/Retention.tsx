import './Retention.css';
import { useEffect, useState } from 'react';
import { api, type RetentionData } from '@/lib/api';
import { StatCard } from '@/components/StatCard/StatCard';
import { Table, type Column } from '@/components/Table/Table';
import { Spinner } from '@/components/Spinner/Spinner';
import { formatPercent } from '@/lib/format';

type CohortRow = RetentionData['cohorts'][number];

export function Retention(): React.ReactElement {
  const [data, setData] = useState<RetentionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.retention()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="retention__loading"><Spinner /></div>;
  if (!data) return <div className="retention__error">Failed to load retention data.</div>;

  const columns: Column<CohortRow>[] = [
    { key: 'date', header: 'Cohort', render: (r) => r.cohort_date },
    { key: 'installs', header: 'Installs', render: (r) => r.installs, width: '80px' },
    { key: 'd1', header: 'D1', render: (r) => r.installs > 0 ? formatPercent(Math.round((r.day1_retained / r.installs) * 100)) : '—', width: '60px' },
    { key: 'd7', header: 'D7', render: (r) => r.installs > 0 ? formatPercent(Math.round((r.day7_retained / r.installs) * 100)) : '—', width: '60px' },
    { key: 'd30', header: 'D30', render: (r) => r.installs > 0 ? formatPercent(Math.round((r.day30_retained / r.installs) * 100)) : '—', width: '60px' },
  ];

  return (
    <div className="retention">
      <div className="retention__grid">
        <StatCard label="Day 1 Retention" value={formatPercent(data.day1_pct)} />
        <StatCard label="Day 7 Retention" value={formatPercent(data.day7_pct)} />
        <StatCard label="Day 30 Retention" value={formatPercent(data.day30_pct)} />
      </div>

      <div className="retention__table-section">
        <h3 className="retention__section-title">Cohort Breakdown</h3>
        <Table
          columns={columns}
          rows={data.cohorts}
          keyFn={(r) => r.cohort_date}
          emptyMessage="No cohort data yet"
        />
      </div>
    </div>
  );
}

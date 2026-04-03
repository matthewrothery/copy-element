import './UsageMetrics.css';
import { useEffect, useState } from 'react';
import { api, type AdminUser, type UserListData } from '@/lib/api';
import { Table, type Column } from '@/components/Table/Table';
import { Spinner } from '@/components/Spinner/Spinner';

export function UsageMetrics(): React.ReactElement {
  const [data, setData] = useState<UserListData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.users(1, 100, '')
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="usage__loading"><Spinner /></div>;
  if (!data) return <div className="usage__error">Failed to load usage data.</div>;

  const columns: Column<AdminUser>[] = [
    { key: 'email', header: 'User', render: (r) => r.email },
    { key: 'installs', header: 'Installs', render: (r) => r.install_count, width: '80px' },
    { key: 'captures', header: 'Captures', render: (r) => r.capture_count, width: '80px' },
    { key: 'plan', header: 'Plan', render: (r) => r.plan_code, width: '80px' },
  ];

  // Sort by capture count desc
  const sorted = [...data.users].sort((a, b) => b.capture_count - a.capture_count);

  return (
    <div className="usage">
      <p className="usage__description">
        Top users by capture volume. Sorted by captures descending.
      </p>
      <Table
        columns={columns}
        rows={sorted}
        keyFn={(r) => r.id}
        emptyMessage="No usage data yet"
      />
    </div>
  );
}

import './Users.css';
import { useEffect, useState } from 'react';
import { api, type AdminUser, type UserListData } from '@/lib/api';
import { Table, type Column } from '@/components/Table/Table';
import { Badge } from '@/components/Badge/Badge';
import { Input } from '@/components/Input/Input';
import { Button } from '@/components/Button/Button';
import { formatRelativeDate } from '@/lib/format';

function planVariant(planCode: string): 'success' | 'info' | 'neutral' {
  if (planCode === 'pro' || planCode === 'team') return 'success';
  if (planCode === 'free') return 'info';
  return 'neutral';
}

export function Users(): React.ReactElement {
  const [data, setData] = useState<UserListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 50;

  function load(p: number, q: string): void {
    setLoading(true);
    api.users(p, limit, q)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(1, ''); }, []);

  function handleSearch(e: React.FormEvent): void {
    e.preventDefault();
    setPage(1);
    load(1, search);
  }

  const columns: Column<AdminUser>[] = [
    { key: 'email', header: 'Email', render: (r) => <span className="users__email">{r.email}</span> },
    { key: 'name', header: 'Name', render: (r) => r.name },
    { key: 'plan', header: 'Plan', render: (r) => (
      <Badge variant={planVariant(r.plan_code)}>{r.plan_code}</Badge>
    )},
    { key: 'installs', header: 'Installs', render: (r) => r.install_count, width: '80px' },
    { key: 'captures', header: 'Captures', render: (r) => r.capture_count, width: '80px' },
    { key: 'joined', header: 'Joined', render: (r) => formatRelativeDate(r.created_at), width: '120px' },
  ];

  const totalPages = data ? Math.ceil(data.total / limit) : 1;

  return (
    <div className="users">
      <form className="users__search" onSubmit={handleSearch}>
        <Input
          placeholder="Search by email or name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button type="submit" variant="secondary" size="sm">Search</Button>
      </form>

      {data && (
        <p className="users__count">{data.total} users</p>
      )}

      <Table
        columns={columns}
        rows={data?.users ?? []}
        keyFn={(r) => r.id}
        loading={loading}
        emptyMessage="No users found"
      />

      {data && totalPages > 1 && (
        <div className="users__pagination">
          <Button
            variant="secondary"
            size="sm"
            disabled={page === 1}
            onClick={() => { setPage(page - 1); load(page - 1, search); }}
          >
            Previous
          </Button>
          <span className="users__page-info">Page {page} of {totalPages}</span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => { setPage(page + 1); load(page + 1, search); }}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

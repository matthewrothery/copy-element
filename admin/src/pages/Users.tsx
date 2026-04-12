import './Users.css';
import { useEffect, useState, useCallback } from 'react';
import { api, type AdminUser, type UserListData } from '@/lib/api';
import { Table, type Column } from '@/components/Table/Table';
import { Badge } from '@/components/Badge/Badge';
import { Input } from '@/components/Input/Input';
import { Button } from '@/components/Button/Button';
import { formatRelativeDate } from '@/lib/format';

function CopyIdButton({ id }: { id: string }): React.ReactElement {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }).catch(() => undefined);
  }, [id]);

  return (
    <button
      className={`users__copy-btn${copied ? ' users__copy-btn--copied' : ''}`}
      onClick={handleCopy}
      title={copied ? 'Copied!' : `Copy ID: ${id}`}
      aria-label="Copy user ID"
      type="button"
    >
      {copied ? (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M3 8l3.5 3.5L13 4.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <rect x="5" y="5" width="8" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M11 5V4a1.5 1.5 0 0 0-1.5-1.5h-6A1.5 1.5 0 0 0 2 4v7A1.5 1.5 0 0 0 3.5 12.5H5" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      )}
    </button>
  );
}

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
    { key: 'copy', header: '', render: (r) => <CopyIdButton id={r.id} />, width: '40px' },
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

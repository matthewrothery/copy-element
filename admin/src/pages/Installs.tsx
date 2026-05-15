import './Installs.css';
import { useEffect, useState, useCallback } from 'react';
import { api, type AdminInstall, type InstallListData } from '@/lib/api';
import { Table, type Column } from '@/components/Table/Table';
import { Badge } from '@/components/Badge/Badge';
import { Input } from '@/components/Input/Input';
import { Button } from '@/components/Button/Button';
import { formatRelativeDate } from '@/lib/format';

function shortId(id: string): string {
  return id.length > 12 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id;
}

function formatDateTime(ts: number): string {
  return new Date(ts).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

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
      className={`installs__copy-btn${copied ? ' installs__copy-btn--copied' : ''}`}
      onClick={handleCopy}
      title={copied ? 'Copied!' : `Copy install ID: ${id}`}
      aria-label="Copy install ID"
      type="button"
    >
      {copied ? '✓' : '⧉'}
    </button>
  );
}

export function Installs(): React.ReactElement {
  const [data, setData] = useState<InstallListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 50;

  function load(p: number, q: string): void {
    setLoading(true);
    api.installs(p, limit, q)
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

  const columns: Column<AdminInstall>[] = [
    { key: 'copy', header: '', render: (r) => <CopyIdButton id={r.install_id} />, width: '40px' },
    {
      key: 'install_id',
      header: 'Install',
      render: (r) => <span className="installs__id">{shortId(r.install_id)}</span>,
      width: '140px',
    },
    {
      key: 'account',
      header: 'Account',
      render: (r) => r.user_email
        ? <span className="installs__email">{r.user_email}</span>
        : <Badge variant="neutral">Guest</Badge>,
    },
    {
      key: 'version',
      header: 'Version',
      render: (r) => r.extension_version ?? '—',
      width: '90px',
    },
    {
      key: 'environment',
      header: 'Environment',
      render: (r) => [
        r.os_family,
        r.chrome_version ? `Chrome ${r.chrome_version}` : null,
      ].filter(Boolean).join(' · ') || '—',
    },
    {
      key: 'locale',
      header: 'Locale',
      render: (r) => r.locale ?? '—',
      width: '90px',
    },
    {
      key: 'timezone',
      header: 'Timezone',
      render: (r) => r.timezone ?? '—',
      width: '160px',
    },
    {
      key: 'captures',
      header: 'Captures',
      render: (r) => r.capture_count,
      width: '90px',
    },
    {
      key: 'last_capture',
      header: 'Last capture',
      render: (r) => r.last_capture_at ? formatRelativeDate(r.last_capture_at) : '—',
      width: '120px',
    },
    {
      key: 'installed',
      header: 'Installed',
      render: (r) => (
        <span title={formatDateTime(r.created_at)}>{formatRelativeDate(r.created_at)}</span>
      ),
      width: '120px',
    },
  ];

  const totalPages = data ? Math.ceil(data.total / limit) : 1;

  return (
    <div className="installs">
      <form className="installs__search" onSubmit={handleSearch}>
        <Input
          placeholder="Search by install ID, email, OS, or version…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button type="submit" variant="secondary" size="sm">Search</Button>
      </form>

      {data && (
        <p className="installs__count">{data.total} installs</p>
      )}

      <Table
        columns={columns}
        rows={data?.installs ?? []}
        keyFn={(r) => r.install_id}
        loading={loading}
        emptyMessage="No installs found"
      />

      {data && totalPages > 1 && (
        <div className="installs__pagination">
          <Button
            variant="secondary"
            size="sm"
            disabled={page === 1}
            onClick={() => { setPage(page - 1); load(page - 1, search); }}
          >
            Previous
          </Button>
          <span className="installs__page-info">Page {page} of {totalPages}</span>
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

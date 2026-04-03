import './Conversion.css';
import { useEffect, useState } from 'react';
import { api, type ModalMetricsData, type LimitReachedRow, type PreInstallPage } from '@/lib/api';
import { StatCard } from '@/components/StatCard/StatCard';
import { Table, type Column } from '@/components/Table/Table';
import { Spinner } from '@/components/Spinner/Spinner';
import { formatNumber } from '@/lib/format';

function pctLabel(pct: number): string {
  return `${pct}%`;
}

export function Conversion(): React.ReactElement {
  const [modals, setModals] = useState<ModalMetricsData | null>(null);
  const [limits, setLimits] = useState<LimitReachedRow[]>([]);
  const [journey, setJourney] = useState<PreInstallPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.modals(30),
      api.limitReached(30),
      api.preInstallJourney(30),
    ])
      .then(([modalsData, limitsData, journeyData]) => {
        setModals(modalsData);
        setLimits(limitsData.breakdown);
        setJourney(journeyData.pages);
      })
      .catch((e: unknown) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="conversion__loading"><Spinner /></div>;
  if (error) return <div className="conversion__error">Failed to load conversion data.</div>;

  const limitColumns: Column<LimitReachedRow>[] = [
    { key: 'limit_type', header: 'Limit Type', render: (r) => r.limit_type },
    { key: 'count', header: 'Events', render: (r) => formatNumber(r.count), width: '100px' },
  ];

  const journeyColumns: Column<PreInstallPage>[] = [
    { key: 'url', header: 'Page', render: (r) => r.url },
    { key: 'visitor_count', header: 'Visitors (pre-install)', render: (r) => formatNumber(r.visitor_count), width: '160px' },
  ];

  return (
    <div className="conversion">

      <section className="conversion__section">
        <h2 className="conversion__section-title">Modal Performance (last 30 days)</h2>
        <div className="conversion__grid">
          <StatCard label="Sign-In Modal Shown" value={formatNumber(modals?.signin_modal_shown ?? 0)} />
          <StatCard label="Sign-In → Account Created" value={formatNumber(modals?.signin_modal_converted ?? 0)} />
          <StatCard label="Sign-In Conversion Rate" value={pctLabel(modals?.signin_modal_conversion_pct ?? 0)} />
          <StatCard label="Upgrade Modal Shown" value={formatNumber(modals?.upgrade_modal_shown ?? 0)} />
          <StatCard label="Upgrade → Checkout Started" value={formatNumber(modals?.upgrade_modal_converted ?? 0)} />
          <StatCard label="Upgrade Conversion Rate" value={pctLabel(modals?.upgrade_modal_conversion_pct ?? 0)} />
        </div>
      </section>

      <div className="conversion__tables">
        <section className="conversion__section">
          <h2 className="conversion__section-title">Limit Reached Breakdown (last 30 days)</h2>
          {limits.length > 0 ? (
            <Table columns={limitColumns} rows={limits} keyFn={(r) => r.limit_type} />
          ) : (
            <p className="conversion__empty">No limit events recorded yet.</p>
          )}
        </section>

        <section className="conversion__section">
          <h2 className="conversion__section-title">Pre-Install Page Journey (last 30 days)</h2>
          <p className="conversion__description">
            Pages visited by users who went on to install the extension.
          </p>
          {journey.length > 0 ? (
            <Table columns={journeyColumns} rows={journey} keyFn={(r) => r.url} />
          ) : (
            <p className="conversion__empty">No pre-install journey data yet.</p>
          )}
        </section>
      </div>
    </div>
  );
}

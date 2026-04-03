import './Revenue.css';
import { useEffect, useState } from 'react';
import { api, type RevenueData } from '@/lib/api';
import { StatCard } from '@/components/StatCard/StatCard';
import { BarChart } from '@/components/Chart/BarChart';
import { Spinner } from '@/components/Spinner/Spinner';
import { formatCents, formatRelativeDate } from '@/lib/format';

export function Revenue(): React.ReactElement {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.revenue(12)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="revenue__loading"><Spinner /></div>;
  if (!data) return <div className="revenue__error">Failed to load revenue data.</div>;

  return (
    <div className="revenue">
      <div className="revenue__grid">
        <StatCard label="MRR" value={formatCents(data.mrr_cents)} />
        <StatCard label="ARR" value={formatCents(data.arr_cents)} />
        <StatCard label="Active Subscribers" value={data.active_subscribers} />
      </div>

      <div className="revenue__card">
        <h3 className="revenue__section-title">Monthly New Subscriptions</h3>
        <BarChart
          data={data.monthly_trend.map((m) => ({ label: m.month, value: m.new_subs }))}
          height={120}
        />
      </div>

      <div className="revenue__card">
        <h3 className="revenue__section-title">Recent Events</h3>
        <div className="revenue__events">
          {data.recent_events.length === 0 ? (
            <p className="revenue__empty">No events yet.</p>
          ) : (
            data.recent_events.map((e, i) => (
              <div key={i} className="revenue__event">
                <span className="revenue__event-type">{e.type}</span>
                <span className="revenue__event-plan">{e.plan_code}</span>
                <span className="revenue__event-date">{formatRelativeDate(e.created_at)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

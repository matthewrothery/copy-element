import './StatCard.css';

interface StatCardProps {
  label: string;
  value: string | number;
  delta?: string;
  deltaPositive?: boolean;
  sub?: string;
}

export function StatCard({ label, value, delta, deltaPositive, sub }: StatCardProps): React.ReactElement {
  return (
    <div className="stat-card">
      <p className="stat-card__label">{label}</p>
      <p className="stat-card__value">{value}</p>
      {(delta || sub) && (
        <div className="stat-card__footer">
          {delta && (
            <span className={`stat-card__delta ${deltaPositive ? 'stat-card__delta--up' : 'stat-card__delta--down'}`}>
              {deltaPositive ? '↑' : '↓'} {delta}
            </span>
          )}
          {sub && <span className="stat-card__sub">{sub}</span>}
        </div>
      )}
    </div>
  );
}

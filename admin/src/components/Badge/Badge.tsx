import './Badge.css';

interface BadgeProps {
  variant?: 'success' | 'danger' | 'warning' | 'info' | 'neutral';
  children: React.ReactNode;
}

export function Badge({ variant = 'neutral', children }: BadgeProps): React.ReactElement {
  return <span className={`badge badge--${variant}`}>{children}</span>;
}

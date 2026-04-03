import './LineChart.css';

interface DataPoint {
  date: string;
  value: number;
}

interface LineChartProps {
  data: DataPoint[];
  height?: number;
  label?: string;
  color?: string;
}

export function LineChart({ data, height = 120, label, color = 'var(--accent)' }: LineChartProps): React.ReactElement {
  if (data.length === 0) {
    return <div className="line-chart line-chart--empty" style={{ height }}><span>No data</span></div>;
  }

  const width = 600;
  const padX = 4;
  const padY = 8;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;

  const values = data.map((d) => d.value);
  const maxV = Math.max(...values, 1);
  const minV = Math.min(...values, 0);
  const range = maxV - minV || 1;

  const points = data.map((d, i) => {
    const x = padX + (i / (data.length - 1)) * chartW;
    const y = padY + chartH - ((d.value - minV) / range) * chartH;
    return { x, y, ...d };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height} L ${padX} ${height} Z`;

  return (
    <div className="line-chart">
      {label && <p className="line-chart__label">{label}</p>}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="line-chart__svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`lg-${label ?? 'default'}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill={`url(#lg-${label ?? 'default'})`} />
        <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" />
      </svg>
      <div className="line-chart__axis">
        <span>{data[0].date}</span>
        <span>{data[data.length - 1].date}</span>
      </div>
    </div>
  );
}

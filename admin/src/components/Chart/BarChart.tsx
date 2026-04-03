import './BarChart.css';

interface BarDataPoint {
  label: string;
  value: number;
}

interface BarChartProps {
  data: BarDataPoint[];
  height?: number;
  color?: string;
}

export function BarChart({ data, height = 120, color = 'var(--accent)' }: BarChartProps): React.ReactElement {
  if (data.length === 0) {
    return <div className="bar-chart bar-chart--empty" style={{ height }}><span>No data</span></div>;
  }

  const maxV = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="bar-chart" style={{ height }}>
      <div className="bar-chart__bars">
        {data.map((d, i) => (
          <div key={i} className="bar-chart__bar-wrapper" title={`${d.label}: ${d.value}`}>
            <div
              className="bar-chart__bar"
              style={{
                height: `${(d.value / maxV) * 100}%`,
                backgroundColor: color,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

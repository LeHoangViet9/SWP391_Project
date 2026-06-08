import { formatCurrency } from '../../utils/format';

export default function LineChart({ data = [], valueFormatter = formatCurrency }) {
  if (!data.length) {
    return (
      <div className="h-56 flex items-center justify-center text-slate-400 text-sm">
        Chưa có dữ liệu xu hướng
      </div>
    );
  }

  const width = 600;
  const height = 220;
  const padX = 40;
  const padY = 30;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;

  const values = data.map((d) => Number(d.value) || 0);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;

  const points = data.map((d, i) => {
    const x = padX + (i / Math.max(data.length - 1, 1)) * chartW;
    const y = padY + chartH - ((Number(d.value) || 0) - min) / range * chartH;
    return { x, y, ...d };
  });

  const polyline = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-56">
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = padY + chartH * (1 - ratio);
          return (
            <line
              key={ratio}
              x1={padX}
              y1={y}
              x2={width - padX}
              y2={y}
              stroke="#e7e5e4"
              strokeWidth="1"
            />
          );
        })}
        <polyline
          fill="none"
          stroke="#bfa15f"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={polyline}
        />
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill="#bfa15f" />
            <title>{`${p.label}: ${valueFormatter(p.value)}`}</title>
          </g>
        ))}
        {points.map((p, i) => (
          <text
            key={`label-${i}`}
            x={p.x}
            y={height - 6}
            textAnchor="middle"
            fontSize="9"
            fill="#78716c"
          >
            {p.label}
          </text>
        ))}
      </svg>
    </div>
  );
}

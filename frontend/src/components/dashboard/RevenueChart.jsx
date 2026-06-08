import { formatCurrency } from '../../utils/format';

export default function RevenueChart({ data = [] }) {
  if (!data.length) {
    return (
      <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
        Chưa có dữ liệu xu hướng
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => Number(d.value) || 0), 1);

  return (
    <div className="h-48 flex items-end gap-2 px-2">
      {data.map((point, idx) => {
        const height = ((Number(point.value) || 0) / maxValue) * 100;
        return (
          <div key={idx} className="flex-1 flex flex-col items-center gap-1 min-w-0">
            <span className="text-[10px] text-slate-400 truncate w-full text-center" title={formatCurrency(point.value)}>
              {formatCurrency(point.value)}
            </span>
            <div
              className="w-full bg-[#bfa15f] rounded-t transition-all hover:bg-[#cda152]"
              style={{ height: `${Math.max(height, 4)}%` }}
              title={`${point.label}: ${formatCurrency(point.value)}`}
            />
            <span className="text-[10px] text-slate-500 truncate w-full text-center">
              {point.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

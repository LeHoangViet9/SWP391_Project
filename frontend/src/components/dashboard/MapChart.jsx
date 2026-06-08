export default function MapChart({ data = {}, title }) {
  const entries = Object.entries(data || {});
  if (!entries.length) {
    return (
      <div className="text-sm text-slate-400 py-6 text-center">Chưa có dữ liệu</div>
    );
  }

  const max = Math.max(...entries.map(([, v]) => Number(v) || 0), 1);

  return (
    <div className="space-y-3">
      {title && <h3 className="text-sm font-semibold text-slate-700">{title}</h3>}
      {entries.map(([key, value]) => (
        <div key={key}>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-600">{key.replace(/_/g, ' ')}</span>
            <span className="font-semibold text-slate-800">{value}</span>
          </div>
          <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#bfa15f] rounded-full transition-all"
              style={{ width: `${((Number(value) || 0) / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

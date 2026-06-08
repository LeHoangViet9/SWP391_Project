export default function FilterSelect({ label, value, onChange, options, allLabel = 'Tất cả' }) {
  return (
    <div className="flex flex-col gap-1 min-w-[140px]">
      {label && (
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border border-stone-300 rounded-lg px-3 py-2.5 text-sm bg-white outline-none focus:border-[#bfa15f] transition-colors"
      >
        <option value="">{allLabel}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

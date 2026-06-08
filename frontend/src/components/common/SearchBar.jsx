import { Search, X } from 'lucide-react';

export default function SearchBar({ value, onChange, onSubmit, placeholder = 'Tìm kiếm...' }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.(value);
  };

  return (
    <form onSubmit={handleSubmit} className="relative flex-1 min-w-[200px] max-w-md">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-9 py-2.5 border border-stone-300 rounded-lg text-sm outline-none focus:border-[#bfa15f] transition-colors"
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            onChange('');
            onSubmit?.('');
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          aria-label="Xóa tìm kiếm"
        >
          <X size={16} />
        </button>
      )}
    </form>
  );
}

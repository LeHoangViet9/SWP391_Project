export default function Alert({ type = 'error', message, onClose }) {
  if (!message) return null;
  const styles = {
    error: 'bg-red-50 border-red-200 text-red-700',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    info: 'bg-blue-50 border-blue-200 text-blue-700',
  };
  return (
    <div className={`border rounded-lg px-4 py-3 text-sm mb-4 flex items-start justify-between gap-2 ${styles[type]}`}>
      <span>{message}</span>
      {onClose && (
        <button type="button" onClick={onClose} className="opacity-60 hover:opacity-100 shrink-0">
          ✕
        </button>
      )}
    </div>
  );
}

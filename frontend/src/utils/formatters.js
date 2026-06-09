export function formatCurrency(amount, locale = 'vi') {
  if (amount == null) return '—';
  return new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr, locale = 'vi') {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function formatDateTime(dateStr, locale = 'vi') {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function toISODateTimeStart(dateStr) {
  return `${dateStr}T00:00:00`;
}

export function toISODateTimeEnd(dateStr) {
  return `${dateStr}T23:59:59`;
}

export function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

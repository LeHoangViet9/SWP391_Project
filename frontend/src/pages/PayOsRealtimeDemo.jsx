import React, { useEffect, useRef, useState } from 'react';
import {
  Bell,
  Building2,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Copy,
  CreditCard,
  Home,
  Hotel,
  Loader2,
  ReceiptText,
  Search,
  ShieldCheck,
  Smartphone,
  UserRound,
  WalletCards,
  X,
} from 'lucide-react';

const bankInfo = {
  name: 'Ngân hàng TMCP Quân đội (MB Bank)',
  accountNo: '9704228888888888',
  accountName: 'CONG TY HMS LUXURY HOTEL',
  transferContent: 'PAYOS BK-9264 INV-240624-001',
};

const initialInvoice = {
  id: 'INV-240624-001',
  bookingId: 'BK-9264',
  customer: {
    name: 'Nguyễn Minh Anh',
    phone: '0912345678',
    email: 'minhanh@example.com',
    idCard: '079204009999',
  },
  room: {
    type: 'Deluxe City View',
    quantity: 1,
    nights: 3,
    checkIn: '2026-07-02',
    checkOut: '2026-07-05',
  },
  subtotal: 3600000,
  vatRate: 0.08,
  status: 'PENDING',
  bank: bankInfo,
  createdAt: Date.now() - 120000,
};

const extraInvoices = [
  {
    id: 'INV-240624-002',
    bookingId: 'BK-9265',
    customer: { name: 'Trần Quốc Huy', phone: '0987654321', email: 'huy.tran@example.com', idCard: '031204008888' },
    room: { type: 'Suite Executive', quantity: 1, nights: 2, checkIn: '2026-07-04', checkOut: '2026-07-06' },
    subtotal: 5200000,
    vatRate: 0.08,
    status: 'PAID',
    bank: bankInfo,
    createdAt: Date.now() - 30 * 60000,
  },
  {
    id: 'INV-240624-003',
    bookingId: 'BK-9266',
    customer: { name: 'Lê Hoàng Yến', phone: '0909000111', email: 'yen.le@example.com', idCard: '024204007777' },
    room: { type: 'Premium Twin', quantity: 2, nights: 1, checkIn: '2026-07-08', checkOut: '2026-07-09' },
    subtotal: 2800000,
    vatRate: 0.08,
    status: 'PENDING',
    bank: bankInfo,
    createdAt: Date.now() - 8 * 60000,
  },
];

const money = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

function getTotal(invoice) {
  return Math.round(invoice.subtotal * (1 + invoice.vatRate));
}

function relativeTime(timestamp) {
  const seconds = Math.max(1, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 60) return 'Vừa xong';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} phút trước`;
  return `${Math.floor(minutes / 60)} giờ trước`;
}

function formatDate(date) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('vi-VN');
}

function formatCountdown(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const remainSeconds = (seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainSeconds}`;
}

function createPaymentNotification(invoice, source = 'payos') {
  return {
    id: `noti-${invoice.id}-${Date.now()}`,
    invoiceId: invoice.id,
    bookingId: invoice.bookingId,
    customerName: invoice.customer.name,
    amount: getTotal(invoice),
    source,
    read: false,
    createdAt: Date.now(),
    title: source === 'cash' ? 'Thanh toán thủ công đã xác nhận!' : 'Thanh toán PayOS thành công!',
  };
}

function StatusBadge({ status }) {
  const paid = status === 'PAID';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
      paid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
    }`}>
      {paid ? <CheckCircle2 size={13} /> : <Clock3 size={13} />}
      {paid ? 'PAID' : 'PENDING'}
    </span>
  );
}

function FakeQrCode() {
  return (
    <div className="relative mx-auto grid h-56 w-56 grid-cols-7 grid-rows-7 gap-1 rounded-lg border border-slate-200 bg-white p-4 shadow-inner">
      {Array.from({ length: 49 }).map((_, index) => {
        const fixed =
          index < 14 ||
          index % 7 === 0 ||
          index % 7 === 6 ||
          [16, 18, 22, 24, 30, 31, 33, 37, 40, 43, 45, 46].includes(index);
        return (
          <span
            key={index}
            className={`rounded-sm ${fixed ? 'bg-slate-900' : index % 3 === 0 ? 'bg-slate-700' : 'bg-slate-100'}`}
          />
        );
      })}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white shadow-lg ring-1 ring-slate-200">
          <WalletCards size={24} className="text-[#bfa15f]" />
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-slate-400">
        <Icon size={15} className="text-[#bfa15f]" />
        {label}
      </div>
      <p className="break-words text-sm font-bold text-slate-900">{value}</p>
    </div>
  );
}

function InlineDetail({ label, value, actionIcon: ActionIcon }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-md bg-white/70 px-3 py-2">
      <span className="text-xs font-semibold uppercase text-slate-400">{label}</span>
      <span className="inline-flex items-center gap-1.5 text-right text-sm font-bold text-slate-800">
        {value}
        {ActionIcon && <ActionIcon size={13} className="text-slate-400" />}
      </span>
    </div>
  );
}

function PriceRow({ label, value }) {
  return (
    <div className="grid grid-cols-[1fr_auto] border-t border-slate-100 px-4 py-3 text-sm">
      <span className="text-slate-600">{label}</span>
      <span className="font-bold text-slate-900">{value}</span>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, tone = 'gold' }) {
  const toneClass = {
    gold: 'bg-amber-50 text-[#bfa15f]',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
  }[tone];

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${toneClass}`}>
        <Icon size={19} />
      </div>
      <p className="text-xs font-bold uppercase text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-extrabold text-slate-900">{value}</p>
    </div>
  );
}

function CustomerPaymentFlow({ invoice, onPaymentDetected, paymentHandled }) {
  const [secondsLeft, setSecondsLeft] = useState(600);
  const [pollCount, setPollCount] = useState(0);
  const paid = invoice.status === 'PAID';
  const vat = invoice.subtotal * invoice.vatRate;
  const total = getTotal(invoice);
  const pollTriggeredRef = useRef(false);

  useEffect(() => {
    if (paid) return undefined;
    const timer = window.setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [paid]);

  useEffect(() => {
    if (paid) return undefined;
    const poller = window.setInterval(() => {
      setPollCount((current) => current + 1);
    }, 4000);
    return () => window.clearInterval(poller);
  }, [paid]);

  useEffect(() => {
    if (paid || paymentHandled || pollTriggeredRef.current || pollCount < 3) return;
    pollTriggeredRef.current = true;
    onPaymentDetected(invoice.id);
  }, [invoice.id, paid, paymentHandled, pollCount, onPaymentDetected]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#bfa15f]">Invoice Summary</p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">Hóa đơn đặt phòng</h2>
            </div>
            <StatusBadge status={invoice.status} />
          </div>
        </div>

        <div className="space-y-6 p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InfoCard icon={ReceiptText} label="Mã đặt phòng" value={`#${invoice.bookingId}`} />
            <InfoCard icon={Hotel} label="Hạng phòng" value={invoice.room.type} />
          </div>

          <div className="rounded-lg border border-slate-200 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
              <UserRound size={17} className="text-[#bfa15f]" />
              Thông tin khách hàng
            </div>
            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <InlineDetail label="Họ tên" value={invoice.customer.name} />
              <InlineDetail label="SĐT" value={invoice.customer.phone} />
              <InlineDetail label="Email" value={invoice.customer.email} />
              <InlineDetail label="CCCD" value={invoice.customer.idCard} />
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
              <Building2 size={17} className="text-[#bfa15f]" />
              Chi tiết lưu trú
            </div>
            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <InlineDetail label="Check-in" value={formatDate(invoice.room.checkIn)} />
              <InlineDetail label="Check-out" value={formatDate(invoice.room.checkOut)} />
              <InlineDetail label="Số đêm" value={`${invoice.room.nights} đêm`} />
              <InlineDetail label="Số phòng" value={`${invoice.room.quantity} phòng`} />
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200">
            <div className="grid grid-cols-[1fr_auto] bg-slate-50 px-4 py-3 text-xs font-bold uppercase text-slate-500">
              <span>Khoản mục</span>
              <span>Thành tiền</span>
            </div>
            <PriceRow label="Tiền phòng" value={money.format(invoice.subtotal)} />
            <PriceRow label="VAT 8%" value={money.format(vat)} />
            <div className="grid grid-cols-[1fr_auto] border-t border-slate-200 bg-slate-900 px-4 py-4 text-white">
              <span className="font-bold">Tổng thanh toán</span>
              <span className="text-lg font-extrabold text-[#f2d28b]">{money.format(total)}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        {!paid ? (
          <div className="space-y-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#bfa15f]">PayOS Payment</p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">Thanh toán bắt buộc 100%</h2>
              <p className="mt-1 text-sm text-slate-500">Quét mã QR bằng ứng dụng ngân hàng để xác nhận giữ phòng.</p>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
              Còn lại {formatCountdown(secondsLeft)} để hoàn tất thanh toán.
            </div>

            <FakeQrCode />

            <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
              <InlineDetail label="Ngân hàng" value={invoice.bank.name} />
              <InlineDetail label="Số tài khoản" value={invoice.bank.accountNo} actionIcon={Copy} />
              <InlineDetail label="Chủ tài khoản" value={invoice.bank.accountName} />
              <InlineDetail label="Nội dung CK" value={invoice.bank.transferContent} actionIcon={Copy} />
            </div>

            <div className="flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
              <Loader2 size={16} className="animate-spin text-[#f2d28b]" />
              Đang chờ bạn quét mã... Polling lần {pollCount}
            </div>

            <button
              type="button"
              onClick={() => onPaymentDetected(invoice.id)}
              className="w-full rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 transition-colors hover:bg-emerald-100"
            >
              Giả lập khách đã quét mã thành công
            </button>
          </div>
        ) : (
          <div className="flex min-h-[560px] flex-col items-center justify-center text-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 size={56} />
            </div>
            <h2 className="mt-6 text-2xl font-extrabold text-slate-900">Thanh toán thành công!</h2>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
              Booking #{invoice.bookingId} đã được xác nhận. Thông báo đã được gửi tới bộ phận lễ tân.
            </p>
            <button
              type="button"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#bfa15f] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#a98b4c]"
            >
              <Home size={16} />
              Về trang chủ
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function StaffDashboard({ invoices, notifications, toast, onCloseToast, onOpenInvoice, onMarkRead, onMarkAllRead }) {
  const [bellOpen, setBellOpen] = useState(false);
  const unreadCount = notifications.filter((item) => !item.read).length;

  return (
    <div className="min-h-[720px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <header className="flex h-16 items-center justify-between border-b border-slate-200 px-4 sm:px-6">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-[#bfa15f]">Back-office</p>
          <h2 className="truncate text-lg font-bold text-slate-900">Quản lý hóa đơn & thông báo</h2>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setBellOpen((current) => !current)}
            className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:border-[#bfa15f] hover:text-[#bfa15f]"
          >
            <Bell size={19} />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {bellOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setBellOpen(false)} />
              <div className="absolute right-0 z-50 mt-2 w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <div>
                    <p className="text-sm font-bold text-slate-900">Thông báo thanh toán</p>
                    <p className="text-xs text-slate-400">{unreadCount} thông báo chưa đọc</p>
                  </div>
                  <button type="button" onClick={onMarkAllRead} className="text-xs font-bold text-[#bfa15f] hover:underline">
                    Đã đọc tất cả
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="px-4 py-8 text-center text-sm text-slate-400">Chưa có thông báo</p>
                  ) : (
                    notifications.map((notification) => (
                      <button
                        key={notification.id}
                        type="button"
                        onClick={() => {
                          onMarkRead(notification.id);
                          onOpenInvoice(notification.invoiceId);
                          setBellOpen(false);
                        }}
                        className={`w-full border-b border-slate-100 px-4 py-3 text-left transition-colors last:border-b-0 ${
                          notification.read ? 'bg-white hover:bg-slate-50' : 'bg-emerald-50 hover:bg-emerald-100/70'
                        }`}
                      >
                        <div className="flex gap-3">
                          <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-600" />
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900">{notification.title}</p>
                            <p className="mt-1 text-xs leading-relaxed text-slate-600">
                              Khách hàng {notification.customerName} vừa thanh toán thành công {money.format(notification.amount)} cho Booking #{notification.bookingId}.
                            </p>
                            <p className="mt-1 text-[11px] font-medium text-slate-400">{relativeTime(notification.createdAt)}</p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </header>

      <main className="p-4 sm:p-6">
        <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3">
          <MetricCard icon={ReceiptText} label="Tổng hóa đơn" value={invoices.length} />
          <MetricCard icon={CheckCircle2} label="Đã thanh toán" value={invoices.filter((item) => item.status === 'PAID').length} tone="green" />
          <MetricCard icon={Clock3} label="Đang chờ" value={invoices.filter((item) => item.status === 'PENDING').length} tone="amber" />
        </div>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Invoice Table</h3>
            <p className="text-sm text-slate-500">Trạng thái hóa đơn tự cập nhật khi PayOS xác nhận thành công.</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm mã hóa đơn, khách hàng..."
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none transition-colors focus:border-[#bfa15f]"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200">
          <div className="hidden grid-cols-[1fr_1.2fr_1fr_1fr_auto] bg-slate-50 px-4 py-3 text-xs font-bold uppercase text-slate-500 md:grid">
            <span>Mã hóa đơn</span>
            <span>Khách hàng</span>
            <span>Tổng tiền</span>
            <span>Trạng thái</span>
            <span>Thao tác</span>
          </div>
          {invoices.map((invoice) => (
            <button
              key={invoice.id}
              type="button"
              onClick={() => onOpenInvoice(invoice.id)}
              className={`grid w-full grid-cols-1 gap-2 border-t border-slate-100 px-4 py-4 text-left transition-colors hover:bg-slate-50 md:grid-cols-[1fr_1.2fr_1fr_1fr_auto] md:items-center ${
                invoice.status === 'PAID' ? 'bg-emerald-50/30' : 'bg-white'
              }`}
            >
              <div>
                <p className="font-mono text-sm font-bold text-slate-900">{invoice.id}</p>
                <p className="text-xs text-slate-400">#{invoice.bookingId}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{invoice.customer.name}</p>
                <p className="text-xs text-slate-400">{invoice.customer.email}</p>
              </div>
              <p className="text-sm font-bold text-[#bfa15f]">{money.format(getTotal(invoice))}</p>
              <StatusBadge status={invoice.status} />
              <span className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600">
                Chi tiết
                <ChevronDown size={13} />
              </span>
            </button>
          ))}
        </div>
      </main>

      {toast && (
        <div className="fixed right-4 top-20 z-[80] w-[calc(100vw-2rem)] max-w-sm animate-slide-in rounded-lg border border-emerald-200 bg-white shadow-2xl">
          <div className="flex gap-3 p-4">
            <CheckCircle2 size={24} className="mt-0.5 shrink-0 text-emerald-600" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-900">Thanh toán thành công</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                Khách hàng {toast.customerName} vừa thanh toán thành công {money.format(toast.amount)} cho Booking #{toast.bookingId}.
              </p>
            </div>
            <button type="button" onClick={onCloseToast} className="h-7 w-7 rounded text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700">
              <X size={16} className="mx-auto" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function InvoiceModal({ invoice, onClose, onForceSuccess }) {
  if (!invoice) return null;
  const pending = invoice.status === 'PENDING';

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#bfa15f]">Invoice Detail</p>
            <h3 className="text-lg font-bold text-slate-900">{invoice.id}</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-slate-900">{invoice.customer.name}</p>
                <p className="text-xs text-slate-400">{invoice.customer.phone} · {invoice.customer.email}</p>
              </div>
              <StatusBadge status={invoice.status} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <InfoCard icon={Hotel} label="Hạng phòng" value={invoice.room.type} />
            <InfoCard icon={CreditCard} label="Tổng tiền" value={money.format(getTotal(invoice))} />
          </div>

          {pending && (
            <button
              type="button"
              onClick={() => onForceSuccess(invoice.id)}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-slate-800"
            >
              <ShieldCheck size={17} className="text-[#f2d28b]" />
              Xác nhận thanh toán thủ công (Thu tiền mặt)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PayOsRealtimeDemo() {
  const [activeView, setActiveView] = useState('customer');
  const [invoices, setInvoices] = useState([initialInvoice, ...extraInvoices]);
  const [notifications, setNotifications] = useState([]);
  const [toast, setToast] = useState(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [paymentHandled, setPaymentHandled] = useState(false);
  const toastTimerRef = useRef(null);

  const mainInvoice = invoices[0];
  const selectedInvoice = invoices.find((invoice) => invoice.id === selectedInvoiceId);

  const registerPaymentSuccess = (invoiceId, source = 'payos') => {
    let notificationPayload = null;

    setInvoices((current) =>
      current.map((invoice) => {
        if (invoice.id !== invoiceId || invoice.status === 'PAID') return invoice;
        const updated = { ...invoice, status: 'PAID', paidAt: Date.now() };
        notificationPayload = createPaymentNotification(updated, source);
        return updated;
      })
    );

    window.setTimeout(() => {
      if (!notificationPayload) return;
      setPaymentHandled(true);
      setNotifications((current) => [notificationPayload, ...current]);
      setToast(notificationPayload);
      window.clearTimeout(toastTimerRef.current);
      toastTimerRef.current = window.setTimeout(() => setToast(null), 7000);
    }, 0);
  };

  const markNotificationRead = (id) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllRead = () => {
    setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
  };

  useEffect(() => () => window.clearTimeout(toastTimerRef.current), []);

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#bfa15f]">HMS Luxury Hotel</p>
            <h1 className="mt-1 text-2xl font-extrabold text-slate-950">PayOS Booking & Real-time Notification</h1>
            <p className="mt-1 text-sm text-slate-500">
              Demo bắt buộc thanh toán 100% qua PayOS, đồng bộ tức thời sang dashboard nhân viên.
            </p>
          </div>

          <div className="grid grid-cols-2 rounded-lg border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => setActiveView('customer')}
              className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-bold transition-colors ${
                activeView === 'customer' ? 'bg-white text-[#bfa15f] shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Smartphone size={16} />
              Khách hàng
            </button>
            <button
              type="button"
              onClick={() => setActiveView('staff')}
              className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-bold transition-colors ${
                activeView === 'staff' ? 'bg-white text-[#bfa15f] shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Bell size={16} />
              Nhân viên
            </button>
          </div>
        </div>

        {activeView === 'customer' ? (
          <CustomerPaymentFlow
            invoice={mainInvoice}
            paymentHandled={paymentHandled}
            onPaymentDetected={(invoiceId) => registerPaymentSuccess(invoiceId, 'payos')}
          />
        ) : (
          <StaffDashboard
            invoices={invoices}
            notifications={notifications}
            toast={toast}
            onCloseToast={() => setToast(null)}
            onOpenInvoice={setSelectedInvoiceId}
            onMarkRead={markNotificationRead}
            onMarkAllRead={markAllRead}
          />
        )}

        <InvoiceModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoiceId(null)}
          onForceSuccess={(invoiceId) => {
            registerPaymentSuccess(invoiceId, 'cash');
            setSelectedInvoiceId(null);
          }}
        />
      </div>
    </div>
  );
}

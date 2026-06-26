import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell,
  CheckCircle,
  Clock,
  CreditCard,
  Eye,
  ReceiptText,
  X,
} from 'lucide-react';
import Modal from './Modal';

const moneyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

const MOCK_NOTIFICATIONS = [
  {
    id: 'payos-1007',
    title: 'Thanh toán trực tuyến mới!',
    customerName: 'Nguyễn Minh Anh',
    bookingCode: 'BK-1007',
    amount: 2450000,
    roomType: 'Deluxe City View',
    paymentMethod: 'PayOS',
    createdAt: Date.now() - 90 * 1000,
    read: false,
  },
  {
    id: 'payos-1006',
    title: 'Thanh toán trực tuyến mới!',
    customerName: 'Trần Quốc Huy',
    bookingCode: 'BK-1006',
    amount: 3800000,
    roomType: 'Suite Executive',
    paymentMethod: 'PayOS',
    createdAt: Date.now() - 6 * 60 * 1000,
    read: false,
  },
  {
    id: 'payos-1005',
    title: 'Thanh toán trực tuyến mới!',
    customerName: 'Lê Hoàng Yến',
    bookingCode: 'BK-1005',
    amount: 1650000,
    roomType: 'Superior King',
    paymentMethod: 'PayOS',
    createdAt: Date.now() - 24 * 60 * 1000,
    read: true,
  },
];

const SIMULATED_EVENTS = [
  {
    customerName: 'Phạm Gia Bảo',
    bookingCode: 'BK-2011',
    amount: 2950000,
    roomType: 'Premium Twin',
  },
  {
    customerName: 'Đặng Thu Hà',
    bookingCode: 'BK-2012',
    amount: 4200000,
    roomType: 'Family Suite',
  },
  {
    customerName: 'Hoàng Nhật Nam',
    bookingCode: 'BK-2013',
    amount: 2100000,
    roomType: 'Deluxe Garden',
  },
];

function formatRelativeTime(timestamp) {
  const diffSeconds = Math.max(1, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSeconds < 60) return 'Vừa xong';
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} ngày trước`;
}

function buildMessage(notification) {
  return `Khách hàng ${notification.customerName} đã thanh toán thành công ${moneyFormatter.format(notification.amount)} cho Booking #${notification.bookingCode}.`;
}

function playSoftNotificationSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(720, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(980, context.currentTime + 0.12);
    gain.gain.setValueAtTime(0.001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.22);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.24);
    window.setTimeout(() => context.close(), 320);
  } catch {
    console.info('[Notification] Soft sound simulated');
  }
}

function NotificationItem({ notification, onOpen }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(notification)}
      className={`w-full border-b border-stone-100 px-4 py-3 text-left transition-colors last:border-b-0 ${
        notification.read ? 'bg-white hover:bg-stone-50' : 'bg-emerald-50/70 hover:bg-emerald-50'
      }`}
    >
      <div className="flex gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle size={18} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-bold text-slate-800">{notification.title}</p>
            {!notification.read && (
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-red-500" />
            )}
          </div>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-600">
            {buildMessage(notification)}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
            <Clock size={12} />
            <span>{formatRelativeTime(notification.createdAt)}</span>
          </div>
        </div>
      </div>
    </button>
  );
}

function RealtimeToast({ notification, onView, onClose }) {
  if (!notification) return null;

  return (
    <div className="fixed right-4 top-20 z-[9500] w-[calc(100vw-2rem)] max-w-sm animate-[slideIn_.22s_ease-out]">
      <div className="overflow-hidden rounded-lg border border-emerald-200 bg-white shadow-2xl shadow-slate-900/15">
        <div className="flex gap-3 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-900">{notification.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              {buildMessage(notification)}
            </p>
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => onView(notification)}
                className="inline-flex items-center gap-1.5 rounded bg-[#bfa15f] px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#a98b4c]"
              >
                <Eye size={13} />
                Xem ngay
              </button>
              <span className="text-[11px] font-medium text-slate-400">Âm thanh đã phát</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-7 w-7 shrink-0 rounded text-slate-400 transition-colors hover:bg-stone-100 hover:text-slate-700"
            aria-label="Đóng thông báo"
          >
            <X size={16} className="mx-auto" />
          </button>
        </div>
        <div className="h-1 bg-emerald-500" />
      </div>
    </div>
  );
}

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [toastNotification, setToastNotification] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const eventIndexRef = useRef(0);
  const toastTimerRef = useRef(null);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications]
  );

  const latestNotifications = useMemo(
    () => [...notifications].sort((a, b) => b.createdAt - a.createdAt).slice(0, 6),
    [notifications]
  );

  const markAsRead = (id) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const openInvoiceDetail = (notification) => {
    markAsRead(notification.id);
    setSelectedInvoice(notification);
    setOpen(false);
    setToastNotification(null);
  };

  const markAllAsRead = () => {
    setNotifications((current) =>
      current.map((notification) => ({ ...notification, read: true }))
    );
  };

  const simulatePayOsSuccessEvent = () => {
    const event = SIMULATED_EVENTS[eventIndexRef.current % SIMULATED_EVENTS.length];
    eventIndexRef.current += 1;

    const notification = {
      id: `payos-${Date.now()}`,
      title: 'Thanh toán trực tuyến mới!',
      customerName: event.customerName,
      bookingCode: event.bookingCode,
      amount: event.amount,
      roomType: event.roomType,
      paymentMethod: 'PayOS',
      createdAt: Date.now(),
      read: false,
    };

    setNotifications((current) => [notification, ...current]);
    setToastNotification(notification);
    playSoftNotificationSound();

    window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setToastNotification(null);
    }, 7000);
  };

  useEffect(() => {
    const interval = window.setInterval(simulatePayOsSuccessEvent, 10000);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  return (
    <>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 bg-white text-slate-600 transition-colors hover:border-[#bfa15f] hover:text-[#bfa15f]"
          aria-label="Mở thông báo"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-[50]" onClick={() => setOpen(false)} />
            <div className="absolute right-0 z-[60] mt-2 w-[calc(100vw-2rem)] max-w-[380px] overflow-hidden rounded-lg border border-stone-200 bg-white shadow-2xl shadow-slate-900/15">
              <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
                <div>
                  <p className="text-sm font-bold text-slate-900">Thông báo</p>
                  <p className="text-[11px] text-slate-400">
                    {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Không có thông báo chưa đọc'}
                  </p>
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="rounded px-2 py-1 text-[11px] font-bold text-[#bfa15f] transition-colors hover:bg-amber-50"
                  >
                    Đánh dấu đã đọc
                  </button>
                )}
              </div>

              <div className="max-h-[360px] overflow-y-auto">
                {latestNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
                    <Bell size={28} className="text-stone-300" />
                    <p className="mt-2 text-sm font-semibold text-slate-600">Chưa có thông báo</p>
                  </div>
                ) : (
                  latestNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onOpen={openInvoiceDetail}
                    />
                  ))
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  markAllAsRead();
                  setOpen(false);
                }}
                className="flex w-full items-center justify-center gap-2 border-t border-stone-100 bg-stone-50 px-4 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-stone-100"
              >
                <ReceiptText size={15} className="text-[#bfa15f]" />
                Xem tất cả thông báo
              </button>
            </div>
          </>
        )}
      </div>

      <RealtimeToast
        notification={toastNotification}
        onView={openInvoiceDetail}
        onClose={() => setToastNotification(null)}
      />

      <Modal
        open={Boolean(selectedInvoice)}
        title="Chi tiết hóa đơn đã thanh toán"
        onClose={() => setSelectedInvoice(null)}
        size="md"
      >
        {selectedInvoice && (
          <div className="space-y-5">
            <div className="flex items-start gap-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle size={22} />
              </div>
              <div>
                <p className="text-sm font-bold text-emerald-800">PayOS xác nhận thanh toán thành công</p>
                <p className="mt-1 text-sm leading-relaxed text-emerald-700">
                  {buildMessage(selectedInvoice)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-stone-200 p-4">
                <p className="text-xs font-bold uppercase text-slate-400">Mã đặt phòng</p>
                <p className="mt-1 font-mono text-base font-bold text-slate-900">#{selectedInvoice.bookingCode}</p>
              </div>
              <div className="rounded-lg border border-stone-200 p-4">
                <p className="text-xs font-bold uppercase text-slate-400">Số tiền</p>
                <p className="mt-1 text-base font-bold text-[#bfa15f]">
                  {moneyFormatter.format(selectedInvoice.amount)}
                </p>
              </div>
              <div className="rounded-lg border border-stone-200 p-4">
                <p className="text-xs font-bold uppercase text-slate-400">Khách hàng</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">{selectedInvoice.customerName}</p>
              </div>
              <div className="rounded-lg border border-stone-200 p-4">
                <p className="text-xs font-bold uppercase text-slate-400">Hạng phòng</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">{selectedInvoice.roomType}</p>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-stone-50 px-4 py-3 text-sm">
              <span className="inline-flex items-center gap-2 font-semibold text-slate-600">
                <CreditCard size={16} className="text-[#bfa15f]" />
                Phương thức thanh toán
              </span>
              <span className="font-bold text-slate-900">{selectedInvoice.paymentMethod}</span>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

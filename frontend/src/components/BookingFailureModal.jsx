import React from 'react';
import { AlertTriangle, RotateCcw, Search, Headphones, X, WifiOff, CreditCard, CalendarX } from 'lucide-react';

/**
 * Error type detection from API error messages
 */
function detectErrorType(errorMessage) {
    const msg = (errorMessage || '').toLowerCase();

    if (msg.includes('unavailable') || msg.includes('hết phòng') || msg.includes('sold out') || msg.includes('không còn') || msg.includes('no room')) {
        return 'room_unavailable';
    }
    if (msg.includes('payment') || msg.includes('thanh toán') || msg.includes('timeout') || msg.includes('expired')) {
        return 'payment_timeout';
    }
    if (msg.includes('network') || msg.includes('connection') || msg.includes('mạng')) {
        return 'network_error';
    }
    return 'system_error';
}

const ERROR_CONFIG = {
    room_unavailable: {
        Icon: CalendarX,
        iconBg: 'bg-amber-100',
        iconColor: 'text-amber-500',
        titleVi: 'Phòng không còn trống',
        titleEn: 'Room No Longer Available',
        descVi: 'Rất tiếc, phòng bạn chọn đã được đặt bởi khách khác trong khoảng thời gian này. Vui lòng chọn ngày khác hoặc xem phòng thay thế.',
        descEn: 'Sorry, this room has been booked by another guest for the selected dates. Please try different dates or view alternative rooms.',
    },
    payment_timeout: {
        Icon: CreditCard,
        iconBg: 'bg-red-100',
        iconColor: 'text-red-500',
        titleVi: 'Phiên thanh toán đã hết hạn',
        titleEn: 'Payment Session Expired',
        descVi: 'Phiên thanh toán của bạn đã hết hạn do không hoạt động. Vui lòng thử lại để hoàn tất đặt phòng.',
        descEn: 'Your payment session has timed out due to inactivity. Please try again to complete your booking.',
    },
    network_error: {
        Icon: WifiOff,
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-500',
        titleVi: 'Lỗi kết nối',
        titleEn: 'Connection Error',
        descVi: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.',
        descEn: 'Unable to connect to the server. Please check your internet connection and try again.',
    },
    system_error: {
        Icon: AlertTriangle,
        iconBg: 'bg-orange-100',
        iconColor: 'text-orange-500',
        titleVi: 'Đã xảy ra lỗi',
        titleEn: 'Something Went Wrong',
        descVi: 'Hệ thống gặp sự cố khi xử lý đặt phòng. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.',
        descEn: 'Our system encountered an issue processing your booking. Please try again or contact support.',
    },
};

export default function BookingFailureModal({
                                                open,
                                                errorMessage,
                                                locale = 'vi',
                                                onClose,
                                                onRetry,
                                                checkIn,
                                                checkOut,
                                            }) {
    if (!open) return null;

    const isVi = locale === 'vi';
    const errorType = detectErrorType(errorMessage);
    const config = ERROR_CONFIG[errorType];
    const ErrorIcon = config.Icon;

    const homeUrl = checkIn && checkOut
        ? `/?checkIn=${checkIn}&checkOut=${checkOut}#rooms`
        : '/#rooms';

    return (
        <div className="fixed inset-0 z-[9000] flex items-center justify-center p-4 animate-fade-in">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal panel */}
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 text-slate-400 hover:text-slate-700 hover:bg-stone-200 transition-colors"
                    aria-label="Close"
                >
                    <X size={16} />
                </button>

                {/* Decorative top bar */}
                <div className="h-1.5 bg-gradient-to-r from-[#bfa15f] via-[#cda152] to-[#bfa15f]" />

                {/* Content */}
                <div className="px-8 pt-8 pb-6 text-center">
                    {/* Icon */}
                    <div className={`w-20 h-20 ${config.iconBg} rounded-full flex items-center justify-center mx-auto mb-5`}>
                        <ErrorIcon size={36} className={config.iconColor} />
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-slate-800 mb-3">
                        {isVi ? config.titleVi : config.titleEn}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-slate-500 leading-relaxed mb-2">
                        {isVi ? config.descVi : config.descEn}
                    </p>

                    {/* Technical error detail (collapsible) */}
                    {errorMessage && (
                        <details className="text-left mb-6">
                            <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600 transition-colors">
                                {isVi ? 'Chi tiết lỗi' : 'Error details'}
                            </summary>
                            <p className="mt-2 text-xs text-slate-500 bg-stone-50 rounded-lg p-3 border border-stone-200 font-mono break-all">
                                {errorMessage}
                            </p>
                        </details>
                    )}
                </div>

                {/* Action buttons */}
                <div className="px-8 pb-8 space-y-3">
                    {/* Primary: Try Again */}
                    <button
                        onClick={onRetry}
                        className="w-full btn-gold py-3.5 rounded-xl flex items-center justify-center gap-2 font-semibold text-sm transition-all hover:shadow-lg hover:shadow-[#bfa15f]/20"
                    >
                        <RotateCcw size={16} />
                        {isVi ? 'Thử lại' : 'Try Again'}
                    </button>

                    {/* Secondary: View Alternative Rooms */}
                    <a
                        href={homeUrl}
                        className="w-full py-3.5 rounded-xl flex items-center justify-center gap-2 font-semibold text-sm border-2 border-stone-200 text-slate-700 hover:border-[#bfa15f] hover:text-[#bfa15f] transition-all"
                    >
                        <Search size={16} />
                        {isVi ? 'Xem phòng thay thế' : 'View Alternative Rooms'}
                    </a>

                    {/* Tertiary: Contact Support */}
                    <div className="text-center pt-1">
                        <a
                            href="mailto:support@hmshotel.com"
                            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-[#bfa15f] transition-colors"
                        >
                            <Headphones size={13} />
                            {isVi ? 'Liên hệ hỗ trợ' : 'Contact Support'}
                        </a>
                        <span className="text-stone-300 mx-2">|</span>
                        <a
                            href="tel:+84123456789"
                            className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-[#bfa15f] transition-colors"
                        >
                            📞 +84 123 456 789
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

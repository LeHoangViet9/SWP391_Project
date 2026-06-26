import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    Printer, Download, ArrowLeft, FileText,
    CreditCard, QrCode, CheckCircle2, Crown,
    ExternalLink, Copy, Check
} from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { useLocale } from '../context/LocaleContext';
import { getInvoiceByBookingId, createPayOsPaymentLink } from '../services/invoiceService';

function formatPrice(price, locale) {
    return new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(price);
}

function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function InvoicePage() {
    const { bookingId } = useParams();
    const { locale } = useLocale();
    const isVi = locale === 'vi';

    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [paymentMode, setPaymentMode] = useState('vietqr'); // 'vietqr' or 'payos'
    const [generatingPayOs, setGeneratingPayOs] = useState(false);
    const [copied, setCopied] = useState(false);

    const fetchInvoice = () => {
        if (!bookingId) return;
        getInvoiceByBookingId(bookingId, locale)
            .then((res) => {
                if (res?.data) {
                    setInvoice(res.data);
                } else {
                    setError(isVi ? 'Không tìm thấy hóa đơn.' : 'Invoice not found.');
                }
            })
            .catch((err) => {
                setError(err.message || (isVi ? 'Lỗi tải hóa đơn.' : 'Failed to load invoice.'));
            })
            .finally(() => setLoading(false));
    };

    // Initial load
    useEffect(() => {
        setLoading(true);
        fetchInvoice();
    }, [bookingId, locale]);

    // Status Polling for Pending Invoices
    useEffect(() => {
        if (!invoice || invoice.paymentStatus === 'PAID') return;

        const interval = setInterval(() => {
            getInvoiceByBookingId(bookingId, locale)
                .then((res) => {
                    if (res?.data) {
                        setInvoice(res.data);
                    }
                })
                .catch((err) => {
                    console.error('Failed to poll invoice status:', err);
                });
        }, 4000);

        return () => clearInterval(interval);
    }, [bookingId, locale, invoice?.paymentStatus]);

    const handlePrint = () => window.print();

    const handleCopyContent = (text) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleGeneratePayOs = async () => {
        if (!invoice) return;
        setGeneratingPayOs(true);
        try {
            const res = await createPayOsPaymentLink(invoice.invoiceId, locale);
            if (res?.data) {
                setInvoice(res.data);
                // Automatically redirect or open PayOS checkout link in a new tab
                if (res.data.checkoutUrl) {
                    window.open(res.data.checkoutUrl, '_blank');
                }
            }
        } catch (err) {
            console.error('Failed to generate PayOS payment link:', err);
            setError(isVi ? 'Không thể khởi tạo liên kết PayOS. Vui lòng thử lại.' : 'Could not generate PayOS link. Please try again.');
        } finally {
            setGeneratingPayOs(false);
        }
    };

    // Calculate invoice data (respecting backend outputs first)
    const subtotal = invoice?.roomPriceSubTotal || invoice?.totalPrice || 0;
    const vatAmount = invoice?.vatAmount || 0;
    const serviceAmount = invoice?.serviceSubTotal || 0;
    const additionalAmount = invoice?.additionalCharges || 0;
    const grandTotal = invoice?.totalAmount || (subtotal + vatAmount + serviceAmount + additionalAmount);

    const invoiceNumber = invoice?.invoiceId ? `INV-${String(invoice.invoiceId).padStart(6, '0')}` : `INV-${String(bookingId).padStart(6, '0')}`;
    const invoiceDate = invoice?.createdAt ? formatDate(invoice.createdAt) : formatDate(new Date().toISOString());

    // Build line items from invoice data
    const lineItems = [];
    if (invoice) {
        lineItems.push({
            description: invoice.roomTypeName || `Booking #${bookingId}`,
            date: `${formatDate(invoice.checkInDate)} - ${formatDate(invoice.checkOutDate)}`,
            quantity: invoice.quantity || 1,
            unitPrice: invoice.pricePerNight || subtotal,
            total: subtotal,
        });
    }

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col bg-stone-50">
                <Header />
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex items-center gap-3 text-[#bfa15f]">
                        <div className="w-6 h-6 border-2 border-[#bfa15f] border-t-transparent rounded-full animate-spin" />
                        <span>{isVi ? 'Đang tải hóa đơn...' : 'Loading invoice...'}</span>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col bg-stone-50">
                <Header />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center bg-white p-8 border border-stone-200 shadow-xl max-w-md w-full mx-4 rounded-xl">
                        <FileText size={48} className="text-stone-300 mx-auto mb-4" />
                        <p className="text-slate-600 mb-6 font-medium">{error}</p>
                        <Link to="/" className="inline-block btn-gold px-6 py-2.5 rounded-lg text-sm font-semibold">
                            ← {isVi ? 'Về trang chủ' : 'Back to home'}
                        </Link>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    const isPaid = invoice?.paymentStatus === 'PAID';

    return (
        <div className="min-h-screen flex flex-col bg-stone-100">
            {/* Header - hidden in print */}
            <div className="no-print">
                <Header />
            </div>

            {/* Dynamic Success Payment Banner */}
            {isPaid && (
                <div className="bg-emerald-50 border-b border-emerald-200 py-4 px-8 text-center flex items-center justify-center gap-3 no-print">
                    <CheckCircle2 size={24} className="text-emerald-600 animate-bounce" />
                    <span className="text-emerald-800 font-bold text-sm">
                        {isVi 
                          ? 'Thanh toán thành công! Phòng của bạn đã được xác nhận giữ chỗ.' 
                          : 'Payment successful! Your room has been successfully reserved.'}
                    </span>
                </div>
            )}

            <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 md:py-12">
                {/* Action buttons - hidden in print */}
                <div className="no-print flex items-center justify-between mb-6">
                    <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-[#bfa15f] transition-colors">
                        <ArrowLeft size={16} />
                        {isVi ? 'Quay lại' : 'Go back'}
                    </Link>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handlePrint}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-stone-200 rounded-lg text-sm font-semibold text-slate-700 hover:border-[#bfa15f] hover:text-[#bfa15f] transition-all shadow-sm"
                        >
                            <Printer size={16} />
                            {isVi ? 'In hóa đơn' : 'Print'}
                        </button>
                        <button
                            onClick={handleDownloadPDF}
                            className="inline-flex items-center gap-2 px-4 py-2.5 btn-gold rounded-lg text-sm font-semibold"
                        >
                            <Download size={16} />
                            {isVi ? 'Tải PDF' : 'Download PDF'}
                        </button>
                    </div>
                </div>

                {/* Invoice Card */}
                <div className="bg-white rounded-xl shadow-lg border border-stone-200 overflow-hidden print-container">
                    {/* ─── Invoice Header ─── */}
                    <div className="bg-gradient-to-r from-[#0c192c] to-[#1a2332] px-8 py-8">
                        <div className="flex items-start justify-between">
                            {/* Hotel branding */}
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-[#bfa15f] rounded-lg flex items-center justify-center shadow-lg">
                                    <Crown size={24} className="text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-white print:text-black tracking-wide">
                                        HMS <span className="text-[#bfa15f]">Luxury</span>
                                    </h1>
                                    <p className="text-[10px] uppercase tracking-[0.25em] text-[#bfa15f]">Hotel & Resort</p>
                                </div>
                            </div>
                            {/* Invoice badge */}
                            <div className="text-right">
                                <span className={`inline-block text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider ${
                                    isPaid ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                                }`}>
                                  {isPaid ? (isVi ? 'Hóa đơn đã trả' : 'Paid Receipt') : (isVi ? 'Hóa đơn tạm tính' : 'Invoice Due')}
                                </span>
                            </div>
                        </div>

                        {/* Hotel details */}
                        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-white/60 print:text-black/50 text-xs uppercase tracking-wider mb-1">{isVi ? 'Địa chỉ' : 'Address'}</p>
                                <p className="text-white/90 print:text-black/80">98 Colin P Kelly Jr Street</p>
                                <p className="text-white/90 print:text-black/80">San Francisco, CA 94107</p>
                            </div>
                            <div className="sm:text-right">
                                <p className="text-white/60 print:text-black/50 text-xs uppercase tracking-wider mb-1">{isVi ? 'Mã số thuế' : 'Tax ID'}</p>
                                <p className="text-white/90 print:text-black/80 font-mono">0123456789-001</p>
                                <p className="text-white/60 print:text-black/50 text-xs mt-1">Tel: +84 123 456 789</p>
                            </div>
                        </div>
                    </div>

                    {/* ─── Invoice Info Bar ─── */}
                    <div className="bg-stone-50 border-b border-stone-200 px-8 py-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                            <div>
                                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">{isVi ? 'Số hóa đơn' : 'Invoice No.'}</p>
                                <p className="font-bold text-slate-800 font-mono">{invoiceNumber}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">{isVi ? 'Ngày lập' : 'Date'}</p>
                                <p className="font-bold text-slate-800">{invoiceDate}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">{isVi ? 'Mã đặt phòng' : 'Booking ID'}</p>
                                <p className="font-bold text-slate-800 font-mono">#{bookingId}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">{isVi ? 'Trạng thái' : 'Status'}</p>
                                <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full ${
                                    isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                }`}>
                                  {isPaid ? (
                                      <><CheckCircle2 size={12} /> {isVi ? 'Đã thanh toán' : 'Paid'}</>
                                  ) : (
                                      isVi ? 'Chờ thanh toán' : 'Pending'
                                  )}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* ─── Customer Info ─── */}
                    {invoice?.customerName && (
                        <div className="px-8 py-4 border-b border-stone-200">
                            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-2">{isVi ? 'Khách hàng' : 'Bill To'}</p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                                <p className="font-semibold text-slate-800">{invoice.customerName}</p>
                                {invoice.customerEmail && <p className="text-slate-500">{invoice.customerEmail}</p>}
                                {invoice.customerPhone && <p className="text-slate-500">{invoice.customerPhone}</p>}
                            </div>
                        </div>
                    )}

                    {/* ─── Line Items Table ─── */}
                    <div className="px-8 py-6">
                        <table className="w-full text-sm">
                            <thead>
                            <tr className="border-b-2 border-stone-200">
                                <th className="text-left py-3 text-xs uppercase tracking-wider text-slate-400 font-semibold">
                                    {isVi ? 'Mô tả' : 'Description'}
                                </th>
                                <th className="text-center py-3 text-xs uppercase tracking-wider text-slate-400 font-semibold hidden sm:table-cell">
                                    {isVi ? 'Ngày' : 'Date'}
                                </th>
                                <th className="text-center py-3 text-xs uppercase tracking-wider text-slate-400 font-semibold">
                                    {isVi ? 'SL' : 'Qty'}
                                </th>
                                <th className="text-right py-3 text-xs uppercase tracking-wider text-slate-400 font-semibold hidden sm:table-cell">
                                    {isVi ? 'Đơn giá' : 'Unit Price'}
                                </th>
                                <th className="text-right py-3 text-xs uppercase tracking-wider text-slate-400 font-semibold">
                                    {isVi ? 'Thành tiền' : 'Total'}
                                </th>
                            </tr>
                            </thead>
                            <tbody>
                            {lineItems.map((item, idx) => (
                                <tr key={idx} className="border-b border-stone-100">
                                    <td className="py-4">
                                        <p className="font-semibold text-slate-800">{item.description}</p>
                                        <p className="text-xs text-slate-400 mt-0.5 sm:hidden">{item.date}</p>
                                    </td>
                                    <td className="py-4 text-center text-slate-600 hidden sm:table-cell">{item.date}</td>
                                    <td className="py-4 text-center text-slate-600">{item.quantity}</td>
                                    <td className="py-4 text-right text-slate-600 hidden sm:table-cell">{formatPrice(item.unitPrice, locale)}</td>
                                    <td className="py-4 text-right font-semibold text-slate-800">{formatPrice(item.total, locale)}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    {/* ─── Payment Summary + QR ─── */}
                    <div className="px-8 pb-8">
                        <div className="bg-stone-50 rounded-xl border border-stone-200 p-6">
                            <div className="flex flex-col sm:flex-row justify-between gap-6">
                                {/* Payment breakdown */}
                                <div className="flex-1 space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">{isVi ? 'Tạm tính' : 'Subtotal'}</span>
                                        <span className="text-slate-700">{formatPrice(subtotal, locale)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">{isVi ? 'Thuế VAT' : 'VAT'} (8%)</span>
                                        <span className="text-slate-700">{formatPrice(vatAmount, locale)}</span>
                                    </div>
                                    {additionalAmount > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">{isVi ? 'Phụ phí' : 'Additional charges'}</span>
                                            <span className="text-slate-700">{formatPrice(additionalAmount, locale)}</span>
                                        </div>
                                    )}
                                    <div className="h-px bg-stone-200 my-2" />
                                    <div className="flex justify-between items-baseline">
                                        <span className="text-base font-bold text-slate-800">{isVi ? 'Tổng cộng' : 'Total Amount Due'}</span>
                                        <span className="text-2xl font-bold text-[#bfa15f]">{formatPrice(grandTotal, locale)}</span>
                                    </div>

                                    {/* Payment method selection / status (Only show selector when pending and not printing) */}
                                    {!isPaid ? (
                                        <div className="pt-4 no-print space-y-3">
                                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                                {isVi ? 'Chọn cổng thanh toán:' : 'Choose payment gateway:'}
                                            </p>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    onClick={() => setPaymentMode('vietqr')}
                                                    className={`py-2 px-3 text-xs font-bold rounded-lg border text-center transition-all ${
                                                        paymentMode === 'vietqr'
                                                          ? 'bg-[#bfa15f]/10 border-[#bfa15f] text-[#bfa15f]'
                                                          : 'bg-white border-stone-200 text-slate-600 hover:bg-stone-50'
                                                    }`}
                                                >
                                                    {isVi ? 'Chuyển khoản (VietQR)' : 'VietQR Bank Transfer'}
                                                </button>
                                                <button
                                                    onClick={() => setPaymentMode('payos')}
                                                    className={`py-2 px-3 text-xs font-bold rounded-lg border text-center transition-all ${
                                                        paymentMode === 'payos'
                                                          ? 'bg-[#bfa15f]/10 border-[#bfa15f] text-[#bfa15f]'
                                                          : 'bg-white border-stone-200 text-slate-600 hover:bg-stone-50'
                                                    }`}
                                                >
                                                    PayOS (Online Card)
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="pt-3 flex items-center gap-2 text-xs text-slate-400">
                                            <CreditCard size={14} />
                                            <span>{isVi ? 'Phương thức thanh toán:' : 'Payment method:'} </span>
                                            <span className="font-semibold text-slate-600">
                                              {invoice?.paymentMethod || (isVi ? 'Chuyển khoản VietQR' : 'VietQR Transfer')}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* QR Code Payment Section */}
                                <div className="flex flex-col items-center justify-center sm:border-l sm:border-stone-200 sm:pl-6 min-w-[220px]">
                                    {isPaid ? (
                                        <div className="flex flex-col items-center justify-center p-4 text-center space-y-2">
                                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                                                <CheckCircle2 size={36} />
                                            </div>
                                            <span className="text-emerald-700 font-bold text-sm">{isVi ? 'ĐÃ THANH TOÁN' : 'PAID'}</span>
                                            <span className="text-xs text-slate-400 font-mono">
                                                {invoice.paidAt ? formatDate(invoice.paidAt) : formatDate(new Date().toISOString())}
                                            </span>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-3">
                                                {isVi ? 'Quét để thanh toán' : 'Scan to Pay'}
                                            </p>
                                            {paymentMode === 'vietqr' ? (
                                                <div className="flex flex-col items-center gap-2">
                                                    {invoice?.qrCodeUrl ? (
                                                        <div className="w-40 h-40 bg-white border border-stone-200 rounded-xl p-1.5 flex items-center justify-center shadow-inner">
                                                            <img src={invoice.qrCodeUrl} alt="VietQR Code" className="w-full h-full object-contain" />
                                                        </div>
                                                    ) : (
                                                        <div className="w-40 h-40 bg-white border border-stone-200 rounded-xl flex items-center justify-center">
                                                            <div className="w-6 h-6 border-2 border-[#bfa15f] border-t-transparent rounded-full animate-spin" />
                                                        </div>
                                                    )}
                                                    
                                                    {/* Copy details */}
                                                    <div className="w-full max-w-[200px] mt-2 space-y-1.5 text-[10px] text-slate-500 bg-stone-100 p-2 rounded-lg font-mono">
                                                        <div className="flex justify-between items-center">
                                                            <span>STK: 123456789</span>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span>Nội dung:</span>
                                                            <button 
                                                                onClick={() => handleCopyContent(invoice?.paymentContent || `HMS${bookingId}`)}
                                                                className="text-[#bfa15f] hover:underline flex items-center gap-0.5"
                                                            >
                                                                {invoice?.paymentContent || `HMS${bookingId}`}
                                                                {copied ? <Check size={10} className="text-green-600" /> : <Copy size={10} />}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center gap-3 py-4">
                                                    {invoice?.checkoutUrl ? (
                                                        <div className="text-center space-y-4">
                                                            <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center text-[#bfa15f] mx-auto animate-pulse">
                                                                <QrCode size={40} />
                                                            </div>
                                                            <a
                                                                href={invoice.checkoutUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#bfa15f] text-white rounded-lg text-xs font-bold hover:bg-[#a3854a] transition-all shadow-md hover:shadow-lg no-print"
                                                            >
                                                                <span>{isVi ? 'Thanh toán PayOS' : 'Pay via PayOS'}</span>
                                                                <ExternalLink size={12} />
                                                            </a>
                                                            <p className="text-[10px] text-slate-400 max-w-[180px] leading-relaxed">
                                                                {isVi 
                                                                  ? 'Bấm nút để mở trang cổng thanh toán PayOS trên tab mới' 
                                                                  : 'Click button to open PayOS gateway on a new tab'}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <div className="text-center space-y-3">
                                                            <button
                                                                onClick={handleGeneratePayOs}
                                                                disabled={generatingPayOs}
                                                                className="px-5 py-2.5 btn-gold rounded-lg text-xs font-bold shadow-md hover:shadow-lg disabled:opacity-60 flex items-center justify-center gap-2"
                                                            >
                                                                {generatingPayOs ? (
                                                                    <>
                                                                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                                        <span>{isVi ? 'Đang tạo...' : 'Generating...'}</span>
                                                                    </>
                                                                ) : (
                                                                    <span>{isVi ? 'Khởi tạo link PayOS' : 'Generate PayOS Link'}</span>
                                                                )}
                                                            </button>
                                                            <p className="text-[10px] text-slate-400 max-w-[180px]">
                                                                {isVi 
                                                                  ? 'Khởi tạo liên kết PayOS trực tiếp để quét mã và thẻ ngân hàng' 
                                                                  : 'Generate a PayOS link to pay via QR or bank card'}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <div className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-400 animate-pulse font-semibold">
                                                <div className="w-2.5 h-2.5 border border-slate-400 border-t-transparent rounded-full animate-spin" />
                                                <span>{isVi ? 'Đang đợi bạn quét mã...' : 'Waiting for payment...'}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ─── Footer ─── */}
                    <div className="bg-stone-50 border-t border-stone-200 px-8 py-5 text-center">
                        <p className="text-xs text-slate-400">
                            {isVi
                                ? 'Cảm ơn quý khách đã sử dụng dịch vụ HMS Luxury Hotel. Hẹn gặp lại!'
                                : 'Thank you for choosing HMS Luxury Hotel. We look forward to seeing you again!'}
                        </p>
                        <p className="text-[10px] text-stone-300 mt-1">
                            {isVi ? 'Hóa đơn được tạo tự động bởi hệ thống HMS' : 'This invoice was generated automatically by HMS System'}
                        </p>
                    </div>
                </div>
            </main>

            <div className="no-print">
                <Footer />
            </div>
        </div>
    );
}

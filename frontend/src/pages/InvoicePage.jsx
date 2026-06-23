import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    Printer, Download, ArrowLeft, Building2, FileText,
    CreditCard, QrCode, CheckCircle2, Crown,
} from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { useLocale } from '../context/LocaleContext';
import { getInvoiceByBookingId } from '../services/invoiceService';

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

// Generate a simple QR-like pattern placeholder using SVG
function QrPlaceholder({ value }) {
    return (
        <div className="inline-flex flex-col items-center gap-2">
            <div className="w-28 h-28 bg-white border-2 border-stone-200 rounded-lg flex items-center justify-center relative overflow-hidden">
                {/* SVG QR Pattern placeholder */}
                <svg viewBox="0 0 100 100" className="w-24 h-24">
                    {/* Corner squares */}
                    <rect x="5" y="5" width="25" height="25" fill="#1a2332" rx="3" />
                    <rect x="8" y="8" width="19" height="19" fill="white" rx="2" />
                    <rect x="11" y="11" width="13" height="13" fill="#1a2332" rx="1" />

                    <rect x="70" y="5" width="25" height="25" fill="#1a2332" rx="3" />
                    <rect x="73" y="8" width="19" height="19" fill="white" rx="2" />
                    <rect x="76" y="11" width="13" height="13" fill="#1a2332" rx="1" />

                    <rect x="5" y="70" width="25" height="25" fill="#1a2332" rx="3" />
                    <rect x="8" y="73" width="19" height="19" fill="white" rx="2" />
                    <rect x="11" y="76" width="13" height="13" fill="#1a2332" rx="1" />

                    {/* Random data cells */}
                    {[
                        [35,5],[40,5],[50,5],[55,5],[60,5],
                        [35,10],[45,10],[55,10],[65,10],
                        [5,35],[10,35],[15,35],[25,35],[35,35],[40,35],[55,35],[60,35],[70,35],[80,35],[90,35],
                        [5,40],[20,40],[35,40],[50,40],[65,40],[75,40],[85,40],
                        [10,45],[25,45],[40,45],[45,45],[55,45],[70,45],[80,45],[90,45],
                        [5,50],[15,50],[30,50],[45,50],[60,50],[75,50],[85,50],
                        [5,55],[20,55],[35,55],[50,55],[65,55],[80,55],[90,55],
                        [10,60],[25,60],[40,60],[55,60],[70,60],[85,60],
                        [5,65],[15,65],[30,65],[45,65],[60,65],[75,65],
                        [35,70],[45,70],[55,70],[65,70],[80,70],[90,70],
                        [35,75],[50,75],[60,75],[75,75],[85,75],
                        [35,80],[40,80],[55,80],[70,80],[90,80],
                        [35,85],[45,85],[60,85],[75,85],[80,85],[90,85],
                        [35,90],[50,90],[65,90],[85,90],[90,90],
                    ].map(([x, y], i) => (
                        <rect key={i} x={x} y={y} width="4" height="4" fill="#1a2332" rx="0.5" />
                    ))}
                </svg>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">{value}</span>
        </div>
    );
}

export default function InvoicePage() {
    const { bookingId } = useParams();
    const { locale } = useLocale();
    const isVi = locale === 'vi';

    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!bookingId) return;
        setLoading(true);
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
    }, [bookingId, locale]);

    const handlePrint = () => window.print();

    const handleDownloadPDF = () => {
        // Uses browser print dialog with "Save as PDF" option
        window.print();
    };

    // Calculate invoice data
    const subtotal = invoice?.totalAmount || invoice?.totalPrice || 0;
    const vatRate = 0.10;
    const serviceRate = 0.05;
    const vatAmount = subtotal * vatRate;
    const serviceAmount = subtotal * serviceRate;
    const grandTotal = subtotal + vatAmount + serviceAmount;

    const invoiceNumber = `INV-${String(bookingId).padStart(6, '0')}`;
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
            <div className="min-h-screen flex flex-col">
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
            <div className="min-h-screen flex flex-col">
                <Header />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <FileText size={48} className="text-stone-300 mx-auto mb-4" />
                        <p className="text-slate-600 mb-4">{error}</p>
                        <Link to="/" className="text-[#bfa15f] font-semibold hover:underline">
                            ← {isVi ? 'Về trang chủ' : 'Back to home'}
                        </Link>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-stone-100">
            {/* Header - hidden in print */}
            <div className="no-print">
                <Header />
            </div>

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
                            className="inline-flex items-center gap-2 px-4 py-2.5 btn-gold rounded-lg text-sm"
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
                            <span className="inline-block bg-[#bfa15f]/20 text-[#bfa15f] text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
                              {isVi ? 'Hóa đơn' : 'Invoice'}
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
                                <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                                    invoice?.paymentStatus === 'PAID'
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : 'bg-amber-100 text-amber-700'
                                }`}>
                  {invoice?.paymentStatus === 'PAID' ? (
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
                                        <span className="text-slate-500">{isVi ? 'Thuế VAT' : 'VAT'} (10%)</span>
                                        <span className="text-slate-700">{formatPrice(vatAmount, locale)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">{isVi ? 'Phí dịch vụ' : 'Service Fee'} (5%)</span>
                                        <span className="text-slate-700">{formatPrice(serviceAmount, locale)}</span>
                                    </div>
                                    <div className="h-px bg-stone-200 my-2" />
                                    <div className="flex justify-between items-baseline">
                                        <span className="text-base font-bold text-slate-800">{isVi ? 'Tổng cộng' : 'Total Amount Due'}</span>
                                        <span className="text-2xl font-bold text-[#bfa15f]">{formatPrice(grandTotal, locale)}</span>
                                    </div>

                                    {/* Payment method */}
                                    <div className="pt-3 flex items-center gap-2 text-xs text-slate-400">
                                        <CreditCard size={14} />
                                        <span>{isVi ? 'Phương thức:' : 'Payment:'} </span>
                                        <span className="font-semibold text-slate-600">
                      {invoice?.paymentMethod || (isVi ? 'Tiền mặt / Chuyển khoản' : 'Cash / Bank Transfer')}
                    </span>
                                    </div>
                                </div>

                                {/* QR Code */}
                                <div className="flex flex-col items-center justify-center sm:border-l sm:border-stone-200 sm:pl-6">
                                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-2">
                                        {isVi ? 'Quét để thanh toán' : 'Scan to Pay'}
                                    </p>
                                    <QrPlaceholder value={invoiceNumber} />
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

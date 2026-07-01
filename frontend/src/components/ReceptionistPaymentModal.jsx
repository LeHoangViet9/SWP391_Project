import React, { useState, useEffect } from 'react';
import { CreditCard, Banknote, Smartphone, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';
import Modal from './shared/Modal';
import { getInvoiceByBookingId } from '../services/invoiceService';
import { processReceptionistPayment } from '../services/invoiceService';
import { useLocale } from '../context/LocaleContext';

/**
 * ReceptionistPaymentModal
 * Props:
 *  - open: boolean
 *  - booking: { id, customerName, totalAmount, ... }
 *  - onClose: () => void
 *  - onSuccess: () => void  — called after payment is confirmed
 */
export default function ReceptionistPaymentModal({ open, booking, onClose, onSuccess }) {
  const { locale } = useLocale();
  const isVi = locale === 'vi';

  const [step, setStep] = useState('method'); // 'method' | 'cash' | 'card' | 'transfer'
  const [invoice, setInvoice] = useState(null);
  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  // Cash-specific state
  const [cashReceived, setCashReceived] = useState('');
  const cashChange = invoice && cashReceived
    ? Math.max(0, Number(cashReceived) - invoice.totalAmount)
    : null;
  const cashShortfall = invoice && cashReceived
    ? Math.max(0, invoice.totalAmount - Number(cashReceived))
    : null;

  // Card / Transfer confirmation
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  // Reset when modal opens/closes
  useEffect(() => {
    if (open && booking?.id) {
      setStep('method');
      setCashReceived('');
      setPaymentConfirmed(false);
      setError('');
      setInvoice(null);
      loadInvoice(booking.id);
    }
  }, [open, booking?.id]);

  async function loadInvoice(bookingId) {
    setLoadingInvoice(true);
    try {
      const res = await getInvoiceByBookingId(bookingId, locale);
      setInvoice(res?.data ?? null);
    } catch (e) {
      setError(isVi ? 'Không thể tải hóa đơn. Vui lòng thử lại.' : 'Could not load invoice. Please try again.');
    } finally {
      setLoadingInvoice(false);
    }
  }

  async function handlePay(method) {
    setError('');
    setProcessing(true);
    try {
      const bookingIds = [booking.id];

      if (method === 'CASH') {
        const received = Number(cashReceived);
        if (!received || received <= 0) {
          setError(isVi ? 'Vui lòng nhập số tiền nhận từ khách.' : 'Please enter the amount received from the guest.');
          return;
        }
        if (cashShortfall > 0) {
          setError(isVi ? `Số tiền chưa đủ. Còn thiếu ${formatCurrency(cashShortfall)}.` : `Insufficient amount. Still short ${formatCurrency(cashShortfall)}.`);
          return;
        }
        await processReceptionistPayment(bookingIds, 'CASH', received, true, locale);
      } else if (method === 'CARD') {
        if (!paymentConfirmed) {
          setError(isVi ? 'Vui lòng xác nhận đã nhận tiền từ khách.' : 'Please confirm payment received from guest.');
          return;
        }
        await processReceptionistPayment(bookingIds, 'CARD', null, true, locale);
      } else if (method === 'TRANSFER') {
        if (!paymentConfirmed) {
          setError(isVi ? 'Vui lòng xác nhận đã nhận chuyển khoản từ khách.' : 'Please confirm transfer received from guest.');
          return;
        }
        await processReceptionistPayment(bookingIds, 'TRANSFER', null, true, locale);
      }

      onSuccess?.();
      onClose?.();
    } catch (e) {
      setError(e.message || (isVi ? 'Đã xảy ra lỗi khi xử lý thanh toán.' : 'An error occurred while processing payment.'));
    } finally {
      setProcessing(false);
    }
  }

  function formatCurrency(amount) {
    if (amount == null) return '—';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  }

  const totalAmount = invoice?.totalAmount ?? booking?.totalAmount ?? 0;

  return (
    <Modal
      open={open}
      title={isVi ? `Thanh toán - Đơn #${booking?.id}` : `Payment - Booking #${booking?.id}`}
      onClose={onClose}
      size="md"
    >
      {loadingInvoice ? (
        <div className="flex items-center justify-center py-12 text-slate-500">
          <span className="animate-spin mr-2">⏳</span>
          {isVi ? 'Đang tải hóa đơn...' : 'Loading invoice...'}
        </div>
      ) : (
        <div className="space-y-5">
          {/* Invoice summary */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-slate-600 mb-1">
              {isVi ? 'Khách hàng' : 'Guest'}:{' '}
              <span className="font-semibold text-slate-800">
                {booking?.customerName || `#${booking?.id}`}
              </span>
            </p>
            <p className="text-xl font-bold text-amber-700">
              {isVi ? 'Tổng tiền: ' : 'Total: '}
              {formatCurrency(totalAmount)}
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
              <XCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Step: Choose method */}
          {step === 'method' && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-700">
                {isVi ? 'Chọn hình thức thanh toán:' : 'Select payment method:'}
              </p>
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => setStep('cash')}
                  className="flex items-center gap-4 p-4 border-2 border-stone-200 rounded-xl hover:border-amber-400 hover:bg-amber-50 transition-all group"
                >
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors">
                    <Banknote size={20} className="text-green-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-slate-800">{isVi ? 'Tiền mặt' : 'Cash'}</p>
                    <p className="text-xs text-slate-500">{isVi ? 'Nhập số tiền và tính tiền thừa' : 'Enter amount and calculate change'}</p>
                  </div>
                </button>

                <button
                  onClick={() => { setStep('transfer'); setPaymentConfirmed(false); setError(''); }}
                  className="flex items-center gap-4 p-4 border-2 border-stone-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all group"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <Smartphone size={20} className="text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-slate-800">{isVi ? 'Chuyển khoản' : 'Bank Transfer'}</p>
                    <p className="text-xs text-slate-500">{isVi ? 'Xác nhận đã nhận chuyển khoản' : 'Confirm transfer received'}</p>
                  </div>
                </button>

                <button
                  onClick={() => { setStep('card'); setPaymentConfirmed(false); setError(''); }}
                  className="flex items-center gap-4 p-4 border-2 border-stone-200 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-all group"
                >
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                    <CreditCard size={20} className="text-purple-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-slate-800">{isVi ? 'Thẻ ngân hàng' : 'Card'}</p>
                    <p className="text-xs text-slate-500">{isVi ? 'Xác nhận đã quẹt thẻ thành công' : 'Confirm card payment received'}</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Step: Cash */}
          {step === 'cash' && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => { setStep('method'); setError(''); setCashReceived(''); }}
                className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors"
              >
                <ArrowLeft size={14} /> {isVi ? 'Quay lại' : 'Back'}
              </button>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">
                  {isVi ? 'Số tiền nhận từ khách (VNĐ) *' : 'Amount Received from Guest (VND) *'}
                </label>
                <input
                  type="number"
                  min={0}
                  value={cashReceived}
                  onChange={e => { setCashReceived(e.target.value); setError(''); }}
                  placeholder={isVi ? 'Nhập số tiền nhận...' : 'Enter amount received...'}
                  className="w-full border border-stone-300 rounded-lg px-3 py-2.5 text-sm focus:border-[#bfa15f] outline-none"
                />
              </div>

              {/* Change calculation */}
              <div className={`rounded-lg p-4 space-y-2 border ${cashShortfall > 0 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">{isVi ? 'Tổng hóa đơn:' : 'Invoice total:'}</span>
                  <span className="font-bold text-slate-800">{formatCurrency(totalAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">{isVi ? 'Nhận từ khách:' : 'Received:'}</span>
                  <span className="font-bold text-slate-800">{cashReceived ? formatCurrency(Number(cashReceived)) : '—'}</span>
                </div>
                <div className="border-t border-stone-200 pt-2 flex justify-between text-sm">
                  {cashShortfall > 0 ? (
                    <>
                      <span className="text-red-600 font-semibold">{isVi ? 'Còn thiếu:' : 'Shortfall:'}</span>
                      <span className="font-bold text-red-600">{formatCurrency(cashShortfall)}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-emerald-700 font-semibold">{isVi ? 'Tiền thừa trả lại:' : 'Change to return:'}</span>
                      <span className="font-bold text-emerald-700">{cashChange != null ? formatCurrency(cashChange) : '—'}</span>
                    </>
                  )}
                </div>
              </div>

              <button
                type="button"
                disabled={processing || !cashReceived || cashShortfall > 0}
                onClick={() => handlePay('CASH')}
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold shadow transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? (isVi ? 'Đang xử lý...' : 'Processing...') : (isVi ? '✓ Xác nhận thu tiền mặt' : '✓ Confirm Cash Payment')}
              </button>
            </div>
          )}

          {/* Step: Card */}
          {step === 'card' && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => { setStep('method'); setError(''); setPaymentConfirmed(false); }}
                className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors"
              >
                <ArrowLeft size={14} /> {isVi ? 'Quay lại' : 'Back'}
              </button>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-sm text-purple-800 font-semibold mb-1">
                  {isVi ? 'Thanh toán thẻ ngân hàng' : 'Card Payment'}
                </p>
                <p className="text-xs text-purple-600">
                  {isVi
                    ? 'Vui lòng xử lý giao dịch thẻ tại thiết bị POS và xác nhận bên dưới.'
                    : 'Please process the card transaction on the POS terminal and confirm below.'}
                </p>
              </div>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={paymentConfirmed}
                  onChange={e => { setPaymentConfirmed(e.target.checked); setError(''); }}
                  className="mt-0.5 w-4 h-4 accent-purple-600 cursor-pointer"
                />
                <span className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors">
                  {isVi
                    ? `Tôi xác nhận đã nhận thanh toán thẻ thành công — ${formatCurrency(totalAmount)}`
                    : `I confirm card payment of ${formatCurrency(totalAmount)} has been received successfully`}
                </span>
              </label>

              <button
                type="button"
                disabled={processing || !paymentConfirmed}
                onClick={() => handlePay('CARD')}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold shadow transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? (isVi ? 'Đang xử lý...' : 'Processing...') : (isVi ? '✓ Xác nhận thanh toán thẻ' : '✓ Confirm Card Payment')}
              </button>
            </div>
          )}

          {/* Step: Bank Transfer */}
          {step === 'transfer' && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => { setStep('method'); setError(''); setPaymentConfirmed(false); }}
                className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors"
              >
                <ArrowLeft size={14} /> {isVi ? 'Quay lại' : 'Back'}
              </button>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                <p className="text-sm text-blue-800 font-semibold">
                  {isVi ? 'Thông tin chuyển khoản' : 'Bank Transfer Details'}
                </p>
                <div className="text-xs text-blue-700 space-y-1">
                  <p><span className="font-medium">{isVi ? 'Số tiền:' : 'Amount:'}</span> {formatCurrency(totalAmount)}</p>
                  <p><span className="font-medium">{isVi ? 'Nội dung:' : 'Reference:'}</span> BOOKING#{booking?.id}</p>
                </div>
              </div>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={paymentConfirmed}
                  onChange={e => { setPaymentConfirmed(e.target.checked); setError(''); }}
                  className="mt-0.5 w-4 h-4 accent-blue-600 cursor-pointer"
                />
                <span className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors">
                  {isVi
                    ? `Tôi xác nhận đã nhận chuyển khoản thành công — ${formatCurrency(totalAmount)}`
                    : `I confirm bank transfer of ${formatCurrency(totalAmount)} has been received`}
                </span>
              </label>

              <button
                type="button"
                disabled={processing || !paymentConfirmed}
                onClick={() => handlePay('TRANSFER')}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? (isVi ? 'Đang xử lý...' : 'Processing...') : (isVi ? '✓ Xác nhận chuyển khoản' : '✓ Confirm Transfer')}
              </button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

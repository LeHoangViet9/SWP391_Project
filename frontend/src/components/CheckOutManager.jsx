import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Banknote, LogOut, RefreshCw, Search } from 'lucide-react';
import { usePermission } from '../hooks/usePermission';
import { searchBookings } from '../services/bookingService';
import { confirmCheckoutPayment, getCheckoutBill, releaseCheckoutRoom } from '../services/checkoutService';
import DataTable from './shared/DataTable';
import Modal from './shared/Modal';
import Toast from './shared/Toast';

const money = value => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value || 0));
const dateTime = value => value ? new Date(value).toLocaleString('vi-VN') : '-';
const emptyForm = { additionalCharges: 0, chargeNote: '', paymentMethod: 'CASH', cashReceived: '', paymentConfirmed: false };

export default function CheckOutManager() {
  const { hasPermission } = usePermission();
  const canProcess = hasPermission('CHECKOUT_PROCESS');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [selected, setSelected] = useState(null);
  const [bill, setBill] = useState(null);
  const [stage, setStage] = useState('CHARGES');
  const [form, setForm] = useState(emptyForm);
  const [toast, setToast] = useState({ type: 'success', message: '' });

  const notify = (message, type = 'success') => setToast({ message, type });
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await searchBookings({ status: 'CHECKED_IN', page: 0, size: 100 });
      setBookings(res?.data?.content || []);
    } catch (e) { notify(e.message || 'Không thể tải danh sách khách đang lưu trú.', 'error'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const rows = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return bookings;
    return bookings.filter(item => [item.id, item.customerName, item.guestFullName, item.roomNumber, item.roomTypeName]
      .some(value => String(value || '').toLowerCase().includes(q)));
  }, [bookings, keyword]);

  async function openCheckout(booking) {
    setSelected(booking); setBill(null); setStage('CHARGES'); setForm(emptyForm);
    try {
      const res = await getCheckoutBill(booking.id);
      setBill(res?.data);
      if (res?.data?.roomStatus === 'CHECKOUT_PENDING') setStage('RESUME');
    } catch (e) { notify(e.message || 'Không thể tạo hóa đơn check-out.', 'error'); setSelected(null); }
  }

  function moveToPayment(event) {
    event.preventDefault();
    if (Number(form.additionalCharges || 0) > 0 && !form.chargeNote.trim()) {
      notify('Vui lòng nhập ghi chú khi có phụ phí phát sinh.', 'error');
      return;
    }
    setStage('PAYMENT');
  }

  async function finishCheckout(event) {
    event.preventDefault(); setSaving(true);
    try {
      const charges = Number(form.additionalCharges || 0);
      await confirmCheckoutPayment({
        bookingId: selected.id,
        additionalCharges: charges,
        chargeNote: form.chargeNote,
        paymentMethod: charges > 0 ? form.paymentMethod : null,
        cashReceived: charges > 0 && form.paymentMethod === 'CASH' ? Number(form.cashReceived || 0) : null,
        paymentConfirmed: charges === 0 || form.paymentMethod === 'CASH' || form.paymentConfirmed,
      });
      const releaseRes = await releaseCheckoutRoom(selected.id);
      setBill(releaseRes?.data); setStage('DONE');
      notify('Trả phòng thành công. Housekeeping đã được tự động phân công.');
      await load();
    } catch (e) { notify(e.message || 'Không thể hoàn tất trả phòng.', 'error'); }
    finally { setSaving(false); }
  }

  async function resumeRelease() {
    setSaving(true);
    try {
      const res = await releaseCheckoutRoom(selected.id);
      setBill(res?.data); setStage('DONE');
      notify('Trả phòng thành công. Housekeeping đã được tự động phân công.');
      await load();
    } catch (e) { notify(e.message || 'Không thể hoàn tất trả phòng.', 'error'); }
    finally { setSaving(false); }
  }

  const columns = ['Mã đơn', 'Khách hàng', 'Phòng', 'Ngày trả dự kiến', 'Tiền phòng', ''];
  const tableRows = rows.map(row => <tr key={row.id}>
    <td className="px-4 py-3 font-bold">#{row.id}</td>
    <td className="px-4 py-3">{row.guestFullName || row.customerName || '-'}</td>
    <td className="px-4 py-3">{row.roomNumber || '-'}</td>
    <td className="px-4 py-3">{dateTime(row.checkOutDate)}</td>
    <td className="px-4 py-3">{money(row.totalPrice)}</td>
    <td className="px-4 py-3 text-right"><button disabled={!canProcess} onClick={() => openCheckout(row)} className="rounded bg-[#bfa15f] px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Xử lý check-out</button></td>
  </tr>);

  const charges = Number(form.additionalCharges || 0);
  const paymentInvalid = charges > 0 && (
    (form.paymentMethod === 'CASH' && Number(form.cashReceived || 0) < charges)
    || (form.paymentMethod !== 'CASH' && !form.paymentConfirmed)
  );

  return <div className="space-y-4">
    <Toast type={toast.type} message={toast.message} onClose={() => setToast(t => ({ ...t, message: '' }))} />
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div><h2 className="text-xl font-bold text-slate-800">Khách chờ check-out</h2><p className="text-sm text-slate-500">Tính phụ phí, thanh toán và tự động bàn giao phòng cho housekeeping.</p></div>
      <button onClick={load} className="inline-flex items-center gap-2 rounded border px-3 py-2 text-sm"><RefreshCw size={16} /> Làm mới</button>
    </div>
    <div className="relative max-w-md"><Search className="absolute left-3 top-2.5 text-slate-400" size={17} /><input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="Tìm mã đơn, khách hoặc phòng..." className="w-full rounded border py-2 pl-10 pr-3 text-sm" /></div>
    <DataTable columns={columns} rows={tableRows} loading={loading} emptyText="Không có khách đang lưu trú chờ check-out." />

    <Modal open={Boolean(selected)} title={selected ? `Check-out đơn #${selected.id}` : 'Check-out'} onClose={() => !saving && setSelected(null)} size="lg">
      <form onSubmit={stage === 'CHARGES' ? moveToPayment : finishCheckout} className="space-y-4">
        <div className="grid grid-cols-2 gap-3 rounded bg-stone-50 p-4 text-sm">
          <p><b>Khách:</b> {bill?.customerName || '-'}</p><p><b>Phòng:</b> {bill?.roomNumbers?.join(', ') || '-'}</p>
          <p><b>Hóa đơn đã thanh toán:</b> {money(bill?.originalAmount)}</p><p><b>Trạng thái phòng:</b> {bill?.roomStatus || '-'}</p>
        </div>

        {stage === 'CHARGES' && <>
          <label className="block text-sm font-semibold">Phụ phí phát sinh<input type="number" min="0" value={form.additionalCharges} onChange={e => setForm({ ...form, additionalCharges: e.target.value })} className="mt-1 w-full rounded border px-3 py-2" /></label>
          <label className="block text-sm font-semibold">Ghi chú phụ phí {charges > 0 && <span className="text-red-600">*</span>}<textarea required={charges > 0} value={form.chargeNote} onChange={e => setForm({ ...form, chargeNote: e.target.value })} className="mt-1 w-full rounded border px-3 py-2" rows="2" /></label>
        </>}

        {stage === 'PAYMENT' && <div className="space-y-4 rounded-lg border border-stone-200 p-4">
          <div className="flex items-center justify-between"><div><p className="font-bold text-slate-800">Chọn hình thức thanh toán</p><p className="text-xs text-slate-500">Phụ phí cần thanh toán: {money(charges)}</p></div><button type="button" onClick={() => setStage('CHARGES')} className="text-sm font-semibold text-[#9a7b3f]">Quay lại</button></div>
          {charges > 0 ? <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold">Phương thức<select value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value, paymentConfirmed: false })} className="mt-1 w-full rounded border bg-white px-3 py-2"><option value="CASH">Tiền mặt</option><option value="CARD">Thẻ</option><option value="TRANSFER">Chuyển khoản</option></select></label>
            {form.paymentMethod === 'CASH' ? <label className="text-sm font-semibold">Tiền khách đưa<input type="number" min={charges} value={form.cashReceived} onChange={e => setForm({ ...form, cashReceived: e.target.value })} className="mt-1 w-full rounded border px-3 py-2" /></label> : <label className="mt-7 flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={form.paymentConfirmed} onChange={e => setForm({ ...form, paymentConfirmed: e.target.checked })} /> Đã nhận thanh toán</label>}
          </div> : <p className="rounded bg-emerald-50 p-3 text-sm text-emerald-800">Không có phụ phí. Bạn có thể hoàn tất trả phòng ngay.</p>}
        </div>}

        {(stage === 'DONE' || stage === 'RESUME') && <div className={`rounded border p-4 text-sm ${stage === 'DONE' ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}><b>{stage === 'DONE' ? 'Trả phòng thành công' : 'Thanh toán đã xác nhận'}</b><p className="mt-1">Phụ phí: {money(bill?.additionalCharges)} · Trạng thái phòng: {bill?.roomStatus}</p>{stage === 'DONE' && <p className="mt-1 text-emerald-700">Housekeeping đã được tự động phân công dọn phòng.</p>}</div>}

        <div className="flex justify-end gap-3 border-t pt-4"><button type="button" onClick={() => setSelected(null)} className="rounded border px-4 py-2 text-sm">Đóng</button>
          {stage === 'CHARGES' && <button disabled={saving || !canProcess} className="inline-flex items-center gap-2 rounded bg-[#bfa15f] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"><Banknote size={16} />Thanh toán</button>}
          {stage === 'PAYMENT' && <button disabled={saving || !canProcess || paymentInvalid} className="inline-flex items-center gap-2 rounded bg-emerald-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"><LogOut size={16} />{saving ? 'Đang trả phòng...' : 'Hoàn tất trả phòng'}</button>}
          {stage === 'RESUME' && <button type="button" disabled={saving} onClick={resumeRelease} className="inline-flex items-center gap-2 rounded bg-emerald-700 px-4 py-2 text-sm font-bold text-white"><LogOut size={16} />{saving ? 'Đang trả phòng...' : 'Hoàn tất trả phòng'}</button>}
        </div>
      </form>
    </Modal>
  </div>;
}

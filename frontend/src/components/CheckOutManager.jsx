import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { LogOut, RefreshCw, Search, Plus, Minus, CheckCircle, FileText, DollarSign } from 'lucide-react';
import { usePermission } from '../hooks/usePermission';
import { searchBookings } from '../services/bookingService';
import { confirmCheckoutPayment, getCheckoutBill, releaseCheckoutRoom } from '../services/checkoutService';
import DataTable from './shared/DataTable';
import Modal from './shared/Modal';
import Toast from './shared/Toast';

const money = value => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value || 0));
const dateTime = value => value ? new Date(value).toLocaleString('vi-VN') : '-';

const MINIBAR_ITEMS = [
  { id: 'water', name: 'Nước suối Aquafina', price: 10000 },
  { id: 'cola', name: 'Coca-Cola / Pepsi', price: 20000 },
  { id: 'beer', name: 'Bia Heineken', price: 35000 },
  { id: 'snack', name: 'Snack khoai tây', price: 15000 }
];

export default function CheckOutManager({ preferredRoom = null }) {
  const { hasPermission } = usePermission();
  const canProcess = hasPermission('CHECKOUT_VIEW');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [selected, setSelected] = useState(null);
  const [bill, setBill] = useState(null);
  
  // stage: 'MINIBAR' | 'PAYMENT' | 'RELEASE_READY' | 'DONE'
  const [stage, setStage] = useState('MINIBAR');
  const [toast, setToast] = useState({ type: 'success', message: '' });

  // Minibar states
  const [minibarQuantities, setMinibarQuantities] = useState({ water: 0, cola: 0, beer: 0, snack: 0 });

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [cashReceived, setCashReceived] = useState('');
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

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
    return bookings.filter(item => {
      const matchesRoom = !preferredRoom || item.roomId === preferredRoom.id || item.roomIds?.includes(preferredRoom.id)
        || item.roomNumber === preferredRoom.roomNumber || item.roomNumbers?.includes(preferredRoom.roomNumber);
      return matchesRoom && (!q || [item.id, item.customerName, item.guestFullName, item.roomNumber, item.roomTypeName]
        .some(value => String(value || '').toLowerCase().includes(q)));
    });
  }, [bookings, keyword, preferredRoom]);

  const totalMinibarCost = useMemo(() => {
    return MINIBAR_ITEMS.reduce((sum, item) => sum + (minibarQuantities[item.id] || 0) * item.price, 0);
  }, [minibarQuantities]);

  const chargeNote = useMemo(() => {
    return MINIBAR_ITEMS
      .filter(item => (minibarQuantities[item.id] || 0) > 0)
      .map(item => `${minibarQuantities[item.id]} ${item.name}`)
      .join(', ');
  }, [minibarQuantities]);

  async function openCheckout(booking) {
    setSelected(booking); setBill(null); setStage('INITIATE');
    setPaymentMethod('CASH');
    setCashReceived('');
    setPaymentConfirmed(false);
    try {
      const res = await getCheckoutBill(booking.id);
      const data = res?.data;
      setBill(data);
      if (data?.roomStatus === 'CHECKOUT_PENDING') {
        if (!data?.minibarChecked) {
          setStage('WAITING_FOR_INSPECTION');
        } else {
          if (data?.additionalCharges > 0) {
            setStage('PAYMENT');
          } else {
            setStage('RELEASE_READY');
          }
        }
      } else {
        setStage('INITIATE');
      }
    } catch (e) { notify(e.message || 'Không thể tạo hóa đơn check-out.', 'error'); setSelected(null); }
  }

  async function initiateInspection(event) {
    if (event) event.preventDefault();
    setSaving(true);
    try {
      const res = await confirmCheckoutPayment({
        bookingId: selected.id,
        additionalCharges: 0,
        chargeNote: '',
        paymentMethod: null,
        cashReceived: null,
        paymentConfirmed: false,
      });
      setBill(res?.data);
      setStage('WAITING_FOR_INSPECTION');
      notify('Yêu cầu kiểm phòng thành công! Đã tự động phân công nhân viên dọn dẹp.');
      await load();
    } catch (e) { notify(e.message || 'Không thể khởi tạo kiểm phòng.', 'error'); }
    finally { setSaving(false); }
  }

  async function refreshCheckoutStatus() {
    setLoading(true);
    try {
      const res = await getCheckoutBill(selected.id);
      const data = res?.data;
      setBill(data);
      if (data?.roomStatus === 'CHECKOUT_PENDING') {
        if (!data?.minibarChecked) {
          notify('Nhân viên buồng phòng vẫn đang kiểm tra...');
        } else {
          if (data?.additionalCharges > 0) {
            setStage('PAYMENT');
            notify('Báo cáo minibar đã được gửi về! Vui lòng tiến hành thanh toán.');
          } else {
            setStage('RELEASE_READY');
            notify('Báo cáo minibar đã được gửi về: Không tiêu dùng dịch vụ. Sẵn sàng giải phóng phòng!');
          }
        }
      }
    } catch (e) { notify(e.message || 'Không thể cập nhật trạng thái.', 'error'); }
    finally { setLoading(false); }
  }

  async function finishCheckoutPayment(event) {
    if (event) event.preventDefault();
    setSaving(true);
    const charges = bill?.additionalCharges || 0;
    try {
      const res = await confirmCheckoutPayment({
        bookingId: selected.id,
        additionalCharges: charges,
        chargeNote: bill?.chargeNote || '',
        paymentMethod: paymentMethod,
        cashReceived: paymentMethod === 'CASH' ? Number(cashReceived || 0) : null,
        paymentConfirmed: true,
      });
      setBill(res?.data);
      setStage('RELEASE_READY');
      notify('Hóa đơn Minibar đã được thanh toán thành công!');
    } catch (e) { notify(e.message || 'Không thể xác nhận thanh toán.', 'error'); }
    finally { setSaving(false); }
  }

  async function releaseRoom(event) {
    if (event) event.preventDefault();
    setSaving(true);
    try {
      const res = await releaseCheckoutRoom(selected.id);
      setBill(res?.data); setStage('DONE');
      notify('Giải phóng phòng thành công. Housekeeping đã được tự động phân công.');
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

  const paymentInvalid = (bill?.additionalCharges || 0) > 0 && (
    (paymentMethod === 'CASH' && Number(cashReceived || 0) < (bill?.additionalCharges || 0))
    || (paymentMethod !== 'CASH' && !paymentConfirmed)
  );

  const handleSubmit = (event) => {
    event.preventDefault();
    if (stage === 'INITIATE') {
      initiateInspection(event);
    } else if (stage === 'WAITING_FOR_INSPECTION') {
      refreshCheckoutStatus();
    } else if (stage === 'PAYMENT') {
      finishCheckoutPayment(event);
    } else if (stage === 'RELEASE_READY') {
      releaseRoom(event);
    }
  };

  return <div className="space-y-4">
    <Toast type={toast.type} message={toast.message} onClose={() => setToast(t => ({ ...t, message: '' }))} />
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div><h2 className="text-xl font-bold text-slate-800">Khách chờ check-out</h2><p className="text-sm text-slate-500">Bắt đầu quy trình trả phòng để phân công kiểm phòng tự động, thanh toán phụ phí minibar và giải phóng phòng.</p></div>
      <button onClick={load} className="inline-flex items-center gap-2 rounded border px-3 py-2 text-sm"><RefreshCw size={16} /> Làm mới</button>
    </div>
    <div className="relative max-w-md"><Search className="absolute left-3 top-2.5 text-slate-400" size={17} /><input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="Tìm mã đơn, khách hoặc phòng..." className="w-full rounded border py-2 pl-10 pr-3 text-sm" /></div>
    <DataTable columns={columns} rows={tableRows} loading={loading} emptyText="Không có khách đang lưu trú chờ check-out." />

    <Modal open={Boolean(selected)} title={selected ? `Check-out đơn #${selected.id}` : 'Check-out'} onClose={() => !saving && setSelected(null)} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Step Indicator */}
        <div className="flex justify-between items-center rounded-xl bg-stone-50 border p-3.5 mb-2 text-xs">
          <div className="flex items-center gap-2">
            <span className={`h-6 w-6 flex items-center justify-center rounded-full font-bold ${stage === 'INITIATE' || stage === 'WAITING_FOR_INSPECTION' ? 'bg-[#bfa15f] text-white' : 'bg-emerald-100 text-emerald-800'}`}>1</span>
            <span className="font-semibold text-slate-700">Khởi tạo & Kiểm phòng</span>
          </div>
          <div className="h-px bg-stone-200 flex-1 mx-4"></div>
          <div className="flex items-center gap-2">
            <span className={`h-6 w-6 flex items-center justify-center rounded-full font-bold ${stage === 'PAYMENT' ? 'bg-[#bfa15f] text-white' : (stage === 'RELEASE_READY' || stage === 'DONE' ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600')}`}>2</span>
            <span className="font-semibold text-slate-700">Thanh toán phụ thu</span>
          </div>
          <div className="h-px bg-stone-200 flex-1 mx-4"></div>
          <div className="flex items-center gap-2">
            <span className={`h-6 w-6 flex items-center justify-center rounded-full font-bold ${stage === 'RELEASE_READY' ? 'bg-[#bfa15f] text-white' : (stage === 'DONE' ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600')}`}>3</span>
            <span className="font-semibold text-slate-700">Trả phòng & Bàn giao</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 rounded bg-stone-50 p-4 text-sm">
          <p><b>Khách:</b> {bill?.customerName || '-'}</p><p><b>Phòng:</b> {bill?.roomNumbers?.join(', ') || '-'}</p>
          <p><b>Hóa đơn đã thanh toán:</b> {money(bill?.originalAmount)}</p><p><b>Trạng thái phòng:</b> {bill?.roomStatus || '-'}</p>
        </div>

        {stage === 'INITIATE' && (
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-800 border-b pb-2">1. Khởi tạo yêu cầu kiểm tra dịch vụ buồng phòng</h4>
            <div className="rounded-xl border border-stone-200 bg-white p-6 text-center space-y-3">
              <LogOut size={48} className="mx-auto text-amber-500 animate-pulse" />
              <p className="font-semibold text-slate-800 text-base">Khởi tạo quy trình trả phòng</p>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Khi ấn khởi tạo, hệ thống sẽ tự động chuyển trạng thái phòng sang <b>CHECKOUT_PENDING</b> và phân công nhiệm vụ cho nhân viên buồng phòng đến kiểm tra phòng & minibar.
              </p>
            </div>
          </div>
        )}

        {stage === 'WAITING_FOR_INSPECTION' && (
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-800 border-b pb-2">1. Chờ nhân viên buồng phòng báo cáo</h4>
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-6 text-center space-y-4">
              <RefreshCw size={48} className="mx-auto text-amber-500 animate-spin" />
              <p className="font-semibold text-amber-800 text-base">Đang chờ nhân viên dọn phòng kê khai minibar...</p>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Nhân viên buồng phòng đã được phân công đang kiểm tra thực tế tại phòng. Sau khi nhân viên buồng phòng gửi báo cáo minibar, hệ thống sẽ tự động cập nhật hóa đơn.
              </p>
              <button
                type="button"
                onClick={refreshCheckoutStatus}
                className="inline-flex items-center gap-2 rounded bg-[#bfa15f] px-4 py-2 text-sm font-bold text-white shadow-sm"
              >
                <RefreshCw size={16} /> Cập nhật trạng thái
              </button>
            </div>
          </div>
        )}

        {stage === 'PAYMENT' && (
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-800 border-b pb-2 flex items-center gap-2 text-amber-600"><FileText size={18}/> 2. Hóa đơn Minibar được tạo (Chờ thanh toán)</h4>
            
            <div className="rounded-xl border p-4 bg-amber-50/50 border-amber-200 text-sm space-y-2">
              <div className="flex justify-between">
                <span>Chi tiết sử dụng:</span>
                <span className="font-medium text-slate-800">{bill?.chargeNote || ''}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-bold">Tổng tiền cần thu:</span>
                <span className="font-bold text-[#bfa15f] text-lg">{money(bill?.additionalCharges || 0)}</span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 p-4 border rounded-xl bg-white">
              <label className="text-sm font-semibold text-slate-700">
                Chọn phương thức thanh toán
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                  className="mt-1 w-full rounded border bg-white px-3 py-2 outline-none text-sm"
                >
                  <option value="CASH">Tiền mặt</option>
                  <option value="CARD">Thẻ ngân hàng</option>
                  <option value="TRANSFER">Chuyển khoản</option>
                </select>
              </label>

              {paymentMethod === 'CASH' ? (
                <label className="text-sm font-semibold text-slate-700">
                  Tiền khách đưa (VND)
                  <input
                    type="number"
                    min={bill?.additionalCharges || 0}
                    value={cashReceived}
                    onChange={e => setCashReceived(e.target.value)}
                    className="mt-1 w-full rounded border px-3 py-2 outline-none text-sm"
                    placeholder="Nhập số tiền..."
                  />
                </label>
              ) : (
                <label className="mt-7 flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={paymentConfirmed}
                    onChange={e => setPaymentConfirmed(e.target.checked)}
                    className="rounded border-stone-300 text-[#bfa15f]"
                  />
                  Xác nhận khách đã chuyển khoản/quẹt thẻ thành công
                </label>
              )}
            </div>

            {paymentMethod === 'CASH' && Number(cashReceived || 0) >= (bill?.additionalCharges || 0) && (
              <div className="p-3 bg-emerald-50 rounded-lg text-emerald-800 text-sm flex justify-between">
                <span>Tiền thừa trả khách:</span>
                <span className="font-bold">{money(Number(cashReceived) - (bill?.additionalCharges || 0))}</span>
              </div>
            )}
          </div>
        )}

        {stage === 'RELEASE_READY' && (
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-800 border-b pb-2 flex items-center gap-2 text-emerald-600"><CheckCircle size={18}/> 3. Thanh toán hoàn tất - Giải phóng phòng</h4>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 text-emerald-800 text-sm space-y-2">
              <p>Khách hàng đã thanh toán thành công hóa đơn dịch vụ Minibar <b>{money(bill?.additionalCharges)}</b> (hoặc phòng không tiêu dùng dịch vụ).</p>
              <p>Vui lòng tiến hành giải phóng phòng để bàn giao cho tổ buồng phòng dọn dẹp.</p>
            </div>
          </div>
        )}

        {stage === 'DONE' && (
          <div className="rounded border p-4 text-sm border-emerald-200 bg-emerald-50 text-emerald-800 space-y-1">
            <p className="font-bold text-base">✓ Trả phòng thành công</p>
            {bill?.additionalCharges > 0 && <p className="text-sm">Hóa đơn dịch vụ Minibar: <b>{money(bill?.additionalCharges)}</b> (Đã thanh toán)</p>}
            <p className="text-sm">Trạng thái phòng: <b>{bill?.roomStatus}</b></p>
            <p className="text-xs text-emerald-700 font-medium mt-2">Phòng đã được chuyển giao, housekeeping sẽ tự động được phân công.</p>
          </div>
        )}

        <div className="flex justify-end gap-3 border-t pt-4">
          <button type="button" onClick={() => setSelected(null)} className="rounded border px-4 py-2 text-sm">Đóng</button>
          {stage === 'INITIATE' && <button disabled={saving || !canProcess} className="inline-flex items-center gap-2 rounded bg-[#bfa15f] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">Yêu cầu kiểm phòng</button>}
          {stage === 'WAITING_FOR_INSPECTION' && <button type="button" onClick={refreshCheckoutStatus} className="inline-flex items-center gap-2 rounded bg-amber-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"><RefreshCw size={16}/>Kiểm tra kết quả</button>}
          {stage === 'PAYMENT' && <button disabled={saving || !canProcess || paymentInvalid} className="inline-flex items-center gap-2 rounded bg-emerald-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"><DollarSign size={16}/>Xác nhận đã thanh toán</button>}
          {stage === 'RELEASE_READY' && <button disabled={saving || !canProcess} className="inline-flex items-center gap-2 rounded bg-emerald-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"><LogOut size={16}/>Giải phóng phòng</button>}
        </div>
      </form>
    </Modal>
  </div>;
}

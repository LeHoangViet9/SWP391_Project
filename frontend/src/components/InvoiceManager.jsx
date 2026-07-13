import React, { useState, useEffect, useCallback } from 'react';
import { Search, Printer, RefreshCw, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { searchInvoices } from '../services/invoiceService';
import DataTable from './shared/DataTable';
import Toast from './shared/Toast';


export default function InvoiceManager() {
  const { hasAnyPermission } = useAuth();
  const { locale, t } = useLocale();
  const isVi = locale === 'vi';

  const canUpdate = hasAnyPermission(['INVOICE_VIEW']);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [toast, setToast] = useState({ type: 'success', message: '' });

  const notify = (message, type = 'success') => setToast({ type, message });
  const closeToast = () => setToast(t => ({ ...t, message: '' }));

  const fetchData = useCallback(async (p = page) => {
    setLoading(true);
    try {
      const params = {
        page: p,
        size: 10,
        sortBy: 'id',
        direction: 'DESC'
      };
      if (search.trim()) params.keyword = search.trim();
      if (statusFilter) params.status = statusFilter;

      const res = await searchInvoices(params, locale);
      setItems(res?.data?.content ?? []);
      setTotalPages(res?.data?.totalPages ?? 1);
    } catch (e) {
      notify(e.message || (isVi ? 'Lỗi tải danh sách hóa đơn' : 'Failed to load invoices'), 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, locale, isVi]);

  useEffect(() => {
    fetchData(page);
  }, [page, statusFilter, fetchData]);

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      setPage(0);
      fetchData(0);
    }
  };


  const getStatusBadge = (status) => {
    const isPaid = status === 'PAID';
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
        isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
      }`}>
        {isPaid ? <CheckCircle size={12} /> : <Clock size={12} />}
        {isPaid ? (isVi ? 'Đã thanh toán' : 'Paid') : (isVi ? 'Chờ thanh toán' : 'Pending')}
      </span>
    );
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat(isVi ? 'vi-VN' : 'en-US', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const cols = [
    'ID',
    isVi ? 'Mã đặt phòng' : 'Booking ID',
    isVi ? 'Khách hàng' : 'Customer',
    isVi ? 'Phân loại' : 'Type',
    isVi ? 'Tổng tiền' : 'Total Amount',
    isVi ? 'Trạng thái' : 'Status',
    isVi ? 'Ngày tạo' : 'Created Date',
    isVi ? 'Hành động' : 'Actions'
  ];

  const rows = items.map(item => (
    <tr key={item.invoiceId || item.id} className="hover:bg-stone-50 border-b border-stone-100">
      <td className="px-4 py-3 font-mono text-xs text-slate-500">{item.invoiceId || item.id}</td>
      <td className="px-4 py-3 font-mono text-xs text-slate-700">#{item.bookingId}</td>
      <td className="px-4 py-3 text-slate-800 font-medium">{item.customerName || '-'}</td>
      <td className="px-4 py-3">
        {item.invoiceType === 'SURCHARGE' ? (
          <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-semibold bg-amber-50 text-amber-700">
            {isVi ? 'Phụ thu Check-out' : 'Surcharge'}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-semibold bg-stone-100 text-stone-700">
            {isVi ? 'Tiền phòng' : 'Room Charge'}
          </span>
        )}
      </td>
      <td className="px-4 py-3 font-semibold text-[#bfa15f]">{formatPrice(item.totalAmount || item.totalPrice || 0)}</td>
      <td className="px-4 py-3">{getStatusBadge(item.paymentStatus)}</td>
      <td className="px-4 py-3 text-xs text-slate-500">
        {item.createdAt ? new Date(item.createdAt).toLocaleString(isVi ? 'vi-VN' : 'en-US') : '—'}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Link to view details / Print */}
          <a
            href={`/invoice/${item.bookingId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg bg-stone-100 hover:bg-[#bfa15f]/20 text-slate-500 hover:text-[#bfa15f] transition-all"
            title={isVi ? 'In hóa đơn' : 'Print Invoice'}
          >
            <Printer size={15} />
          </a>
        </div>
      </td>
    </tr>
  ));

  return (
    <div className="space-y-6">
      <Toast type={toast.type} message={toast.message} onClose={closeToast} />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            {isVi ? 'Quản lý Hóa đơn & Doanh thu' : 'Invoice & Payment Management'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isVi ? 'Tra cứu hóa đơn đặt phòng, theo dõi trạng thái thanh toán và in chứng từ.' : 'Lookup booking invoices, track payment status and print receipts.'}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-3 bg-[#112240] p-4 rounded-2xl border border-white/[0.08]">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
              onKeyDown={handleSearchKeyPress}
              placeholder={isVi ? 'Nhập tên khách hoặc mã đặt phòng...' : 'Enter customer or booking ID...'}
              className="w-full pl-8 pr-3 py-2 text-sm bg-white/5 border border-white/10 rounded-xl focus:border-[#bfa15f] outline-none text-white placeholder-white/30 transition-all"
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(0); }}
            className="border border-white/10 rounded-xl px-3 py-2 text-sm focus:border-[#bfa15f] outline-none bg-[#0c192c] text-white font-medium min-w-[150px]"
          >
            <option value="">{isVi ? 'Tất cả trạng thái' : 'All Statuses'}</option>
            <option value="PAID">{isVi ? 'Đã thanh toán' : 'Paid'}</option>
            <option value="PENDING">{isVi ? 'Chờ thanh toán' : 'Pending'}</option>
          </select>

          <button onClick={() => fetchData(page)} className="p-2 border border-white/10 rounded-xl hover:bg-white/5 text-white/70">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      <DataTable columns={cols} rows={rows} loading={loading} page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}

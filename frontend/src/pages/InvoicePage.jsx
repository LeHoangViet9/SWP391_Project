import { useState, useEffect } from 'react';
import { Search, Filter, Plus, FileText, CheckCircle, Clock, MoreVertical, Printer, Download, CreditCard, Landmark, Banknote } from 'lucide-react';
import { invoiceService } from '../services/invoiceService';
import Toast from '../components/shared/Toast';

export default function InvoicePage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [toast, setToast] = useState({ type: 'success', message: '' });
  
  // Modal states
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const notify = (message, type = 'success') => setToast({ type, message });

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const params = statusFilter !== 'ALL' ? { status: statusFilter } : {};
      const res = await invoiceService.getAll(params);
      setInvoices(res.data || []);
    } catch (err) {
      notify('Không thể tải danh sách hóa đơn', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm) {
      fetchInvoices();
      return;
    }
    setLoading(true);
    try {
      const res = await invoiceService.search(searchTerm);
      setInvoices(res.data || []);
    } catch (err) {
      notify('Tìm kiếm thất bại', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await invoiceService.update(id, { paymentStatus: newStatus });
      notify('Cập nhật trạng thái thành công');
      fetchInvoices();
      if (selectedInvoice?.id === id) {
        setSelectedInvoice({...selectedInvoice, paymentStatus: newStatus});
      }
    } catch (err) {
      notify('Cập nhật thất bại', 'error');
    }
  };

  const handleProcessPayment = async (method) => {
    if (!selectedInvoice) return;
    setPaymentLoading(true);
    try {
      await invoiceService.processPayment(selectedInvoice.id, method);
      notify('Thanh toán thành công!');
      handleUpdateStatus(selectedInvoice.id, 'PAID');
      // Update local state to show success UI
      setSelectedInvoice(prev => ({...prev, paymentStatus: 'PAID'}));
    } catch (err) {
      notify('Thanh toán thất bại', 'error');
    } finally {
      setPaymentLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PAID':
        return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center gap-1 w-fit"><CheckCircle size={12}/> ĐÃ THANH TOÁN</span>;
      case 'PENDING':
        return <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full flex items-center gap-1 w-fit"><Clock size={12}/> CHỜ THANH TOÁN</span>;
      default:
        return <span className="px-2 py-1 bg-stone-100 text-stone-700 text-xs font-bold rounded-full w-fit">{status}</span>;
    }
  };

  return (
    <div className="p-6 bg-stone-50 min-h-screen">
      <Toast type={toast.type} message={toast.message} onClose={() => setToast({ ...toast, message: '' })} />
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Quản lý Hóa đơn</h1>
          <p className="text-slate-500 text-sm">Xem và quản lý các giao dịch thanh toán</p>
        </div>
        <button className="btn-gold flex items-center gap-2 px-4 py-2 rounded shadow-md w-fit">
          <Plus size={18} /> Tạo Hóa đơn mới
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-stone-200 mb-6 flex flex-wrap items-center gap-4">
        <form onSubmit={handleSearch} className="flex-1 min-w-[300px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Tìm theo mã hóa đơn, khách hàng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-stone-200 rounded-lg outline-none focus:border-[#bfa15f]"
          />
        </form>
        
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-slate-400" />
          <select 
            className="border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#bfa15f]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PENDING">Chờ thanh toán</option>
            <option value="PAID">Đã thanh toán</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-stone-50 border-b border-stone-200">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Mã HĐ</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Khách hàng / Booking</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Ngày tạo</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Số tiền</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Trạng thái</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {loading ? (
              <tr><td colSpan="6" className="text-center py-10 text-slate-400 italic">Đang tải dữ liệu...</td></tr>
            ) : invoices.length === 0 ? (
              <tr><td colSpan="6" className="text-center py-10 text-slate-400">Không tìm thấy hóa đơn nào</td></tr>
            ) : invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-stone-50 transition-colors">
                <td className="px-6 py-4 font-mono text-sm font-semibold text-[#bfa15f]">#{inv.id}</td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-slate-800">{inv.customerName || 'Khách lẻ'}</div>
                  <div className="text-xs text-slate-400">Booking: {inv.bookingId}</div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{new Date(inv.createdAt).toLocaleDateString('vi-VN')}</td>
                <td className="px-6 py-4 text-sm font-bold text-slate-800">{inv.amount?.toLocaleString()} VNĐ</td>
                <td className="px-6 py-4">{getStatusBadge(inv.paymentStatus)}</td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => {setSelectedInvoice(inv); setShowDetailModal(true);}}
                    className="p-2 hover:bg-stone-200 rounded-full transition-colors text-slate-400 hover:text-[#bfa15f]"
                  >
                    <FileText size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Invoice Detail Modal */}
      {showDetailModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-stone-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                Chi tiết Hóa đơn {getStatusBadge(selectedInvoice.paymentStatus)}
              </h2>
              <button onClick={() => setShowDetailModal(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            
            <div className="p-8" id="printable-invoice">
              {/* Invoice Template */}
              <div className="flex justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-black text-[#bfa15f] tracking-tighter italic">LUXURY HOTEL</h3>
                  <p className="text-xs text-slate-400">123 Street Name, City, Country</p>
                </div>
                <div className="text-right">
                  <h4 className="text-lg font-bold">HÓA ĐƠN #INV-{selectedInvoice.id}</h4>
                  <p className="text-sm text-slate-500">Ngày: {new Date(selectedInvoice.createdAt).toLocaleString('vi-VN')}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase mb-2">Khách hàng</p>
                  <p className="font-semibold">{selectedInvoice.customerName || 'N/A'}</p>
                  <p className="text-sm text-slate-500">Mã đặt phòng: {selectedInvoice.bookingId}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-2">Thông tin thanh toán</p>
                  <p className="text-sm">Phương thức: {selectedInvoice.paymentMethod || 'Chưa chọn'}</p>
                  <p className="text-sm">Trạng thái: {selectedInvoice.paymentStatus}</p>
                </div>
              </div>

              <div className="border-y border-stone-100 py-4 mb-4">
                <div className="flex justify-between py-2 text-sm text-slate-600">
                  <span>Tiền phòng</span>
                  <span>{(selectedInvoice.amount * 0.9).toLocaleString()} VNĐ</span>
                </div>
                <div className="flex justify-between py-2 text-sm text-slate-600">
                  <span>Dịch vụ khác</span>
                  <span>{(selectedInvoice.amount * 0.1).toLocaleString()} VNĐ</span>
                </div>
                <div className="flex justify-between py-2 mt-4 border-t border-stone-100 font-bold text-lg text-slate-800">
                  <span>Tổng thanh toán</span>
                  <span className="text-[#bfa15f]">{selectedInvoice.amount?.toLocaleString()} VNĐ</span>
                </div>
              </div>

              {/* Payment Section (Dynamic UI) */}
              {selectedInvoice.paymentStatus === 'PENDING' && (
                <div className="mt-8 p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <h4 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
                    <CreditCard size={18} /> Chọn phương thức thanh toán
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <button 
                      onClick={() => handleProcessPayment('CARD')}
                      className="flex flex-col items-center gap-2 p-3 bg-white border border-amber-200 rounded-lg hover:border-[#bfa15f] hover:text-[#bfa15f] transition-all"
                    >
                      <Landmark size={20} /> <span className="text-xs font-bold">Thẻ tín dụng</span>
                    </button>
                    <button 
                      onClick={() => handleProcessPayment('TRANSFER')}
                      className="flex flex-col items-center gap-2 p-3 bg-white border border-amber-200 rounded-lg hover:border-[#bfa15f] hover:text-[#bfa15f] transition-all"
                    >
                      <CreditCard size={20} /> <span className="text-xs font-bold">Chuyển khoản</span>
                    </button>
                    <button 
                      onClick={() => handleProcessPayment('CASH')}
                      className="flex flex-col items-center gap-2 p-3 bg-white border border-amber-200 rounded-lg hover:border-[#bfa15f] hover:text-[#bfa15f] transition-all"
                    >
                      <Banknote size={20} /> <span className="text-xs font-bold">Tiền mặt</span>
                    </button>
                  </div>
                </div>
              )}

              {selectedInvoice.paymentStatus === 'PAID' && (
                <div className="mt-8 text-center p-6 bg-green-50 rounded-2xl border-2 border-dashed border-green-200 flex flex-col items-center animate-in fade-in zoom-in duration-500">
                   <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3">
                      <CheckCircle size={40} />
                   </div>
                   <h4 className="text-xl font-bold text-green-800">Thanh toán hoàn tất</h4>
                   <p className="text-sm text-green-600">Giao dịch đã được ghi nhận vào hệ thống</p>
                </div>
              )}
            </div>

            <div className="p-6 bg-stone-50 border-t border-stone-100 flex justify-end gap-3">
              <button className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-800 font-medium">
                <Download size={18} /> Xuất PDF
              </button>
              <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 font-medium">
                <Printer size={18} /> In Hóa đơn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

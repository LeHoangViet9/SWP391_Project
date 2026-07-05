import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, Search, Plus, Minus, Save } from 'lucide-react';
import { equipmentService } from '../services/equipmentService';
import { getAllRooms } from '../services/roomService';
import { useLocale } from '../context/LocaleContext';
import Toast from './shared/Toast';

export default function AssignEquipmentToRoom() {
    const { locale } = useLocale();

    const [rooms, setRooms] = useState([]);
    const [equipments, setEquipments] = useState([]);
    
    // THAY ĐỔI: Lưu trữ số lượng thiết bị đang chỉnh sửa của phòng dưới dạng map { [equipmentId]: quantity }
    const [quantities, setQuantities] = useState({});
    
    // THAY ĐỔI: Lưu trữ số lượng thiết bị ban đầu của phòng để đối chiếu sự thay đổi
    const [initialQuantities, setInitialQuantities] = useState({});

    const [roomId, setRoomId] = useState('');
    const [searchKeyword, setSearchKeyword] = useState('');

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState({ type: 'success', message: '' });

    const notify = (message, type = 'success') => {
        setToast({ type, message });
    };

    const closeToast = () => {
        setToast((current) => ({ ...current, message: '' }));
    };

    // Lấy danh sách phòng
    const fetchRooms = useCallback(async () => {
        try {
            const response = await getAllRooms({ page: 0, size: 200 }, locale);
            setRooms(response?.data?.content ?? []);
        } catch {
            setRooms([]);
            notify('Không tải được danh sách phòng', 'error');
        }
    }, [locale]);

    // Lấy danh sách thiết bị ACTIVE
    const fetchEquipments = useCallback(async () => {
        try {
            const response = await equipmentService.getAll(
                { page: 0, size: 500, status: 'ACTIVE' },
                locale
            );
            setEquipments(response?.data?.content ?? []);
        } catch {
            setEquipments([]);
            notify('Không tải được danh sách thiết bị', 'error');
        }
    }, [locale]);

    // Lấy danh sách thiết bị đã gán trong phòng đang chọn để khởi tạo map số lượng ban đầu
    const fetchRoomEquipments = useCallback(async () => {
        if (!roomId) {
            setQuantities({});
            setInitialQuantities({});
            return;
        }

        setLoading(true);

        try {
            const response = await equipmentService.getByRoom(roomId, locale);
            const assigned = response?.data ?? [];
            
            const newQuantities = {};
            
            // Đặt số lượng tất cả thiết bị mặc định = 0
            equipments.forEach((eq) => {
                newQuantities[eq.id] = 0;
            });
            
            // Ghi đè số lượng thực tế đã gán trong phòng
            assigned.forEach((item) => {
                newQuantities[item.equipmentId] = item.quantity;
            });

            setQuantities(newQuantities);
            setInitialQuantities({ ...newQuantities });
        } catch {
            notify('Không tải được thiết bị trong phòng', 'error');
        } finally {
            setLoading(false);
        }
    }, [roomId, equipments, locale]);

    useEffect(() => {
        fetchRooms();
        fetchEquipments();
    }, [fetchRooms, fetchEquipments]);

    useEffect(() => {
        if (equipments.length > 0) {
            fetchRoomEquipments();
        }
    }, [roomId, equipments.length]);

    const selectedRoom = useMemo(
        () => rooms.find((room) => String(room.id) === String(roomId)),
        [rooms, roomId]
    );

    // Lọc danh sách thiết bị theo từ khóa tìm kiếm
    const filteredEquipments = useMemo(() => {
        if (!searchKeyword.trim()) return equipments;
        const kw = searchKeyword.toLowerCase();
        return equipments.filter(
            (eq) =>
                eq.equipmentName.toLowerCase().includes(kw) ||
                eq.equipmentCode.toLowerCase().includes(kw)
        );
    }, [equipments, searchKeyword]);

    // Thay đổi số lượng trực tiếp qua input
    const handleQuantityChange = (equipmentId, value) => {
        const val = Math.max(0, parseInt(value, 10) || 0);
        setQuantities((prev) => ({
            ...prev,
            [equipmentId]: val,
        }));
    };

    // Nút tăng số lượng (+)
    const increment = (equipmentId) => {
        setQuantities((prev) => ({
            ...prev,
            [equipmentId]: (prev[equipmentId] || 0) + 1,
        }));
    };

    // Nút giảm số lượng (-)
    const decrement = (equipmentId) => {
        setQuantities((prev) => ({
            ...prev,
            [equipmentId]: Math.max(0, (prev[equipmentId] || 0) - 1),
        }));
    };

    // Kiểm tra xem giao diện có thay đổi số lượng nào so với ban đầu hay không
    const hasChanges = useMemo(() => {
        return Object.keys(quantities).some(
            (id) => quantities[id] !== initialQuantities[id]
        );
    }, [quantities, initialQuantities]);

    // Gửi yêu cầu lưu thay đổi hàng loạt lên Backend
    const handleSaveChanges = async () => {
        if (!roomId) {
            notify('Vui lòng chọn phòng trước khi lưu', 'error');
            return;
        }

        setSaving(true);

        try {
            // Lọc ra danh sách thiết bị có số lượng bị chỉnh sửa so với ban đầu
            const payload = [];
            Object.keys(quantities).forEach((id) => {
                if (quantities[id] !== initialQuantities[id]) {
                    payload.push({
                        equipmentId: Number(id),
                        quantity: quantities[id],
                    });
                }
            });

            if (payload.length === 0) {
                notify('Không có thay đổi nào để lưu', 'info');
                setSaving(false);
                return;
            }

            await equipmentService.assignBulkToRoom(roomId, payload, locale);
            notify('Cập nhật thiết bị trong phòng thành công!');
            
            // Load lại dữ liệu mới nhất
            await fetchRoomEquipments();
        } catch (error) {
            notify(error?.message || 'Cập nhật thất bại', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-5">
            <Toast type={toast.type} message={toast.message} onClose={closeToast} />

            {/* Hộp cấu hình phòng và lọc */}
            <div className="rounded border border-stone-200 bg-white p-4 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-slate-700">
                    Gán thiết bị vào phòng hàng loạt
                </h2>

                <div className="flex flex-col gap-4 md:flex-row md:items-end justify-between">
                    <div className="w-full md:w-1/3">
                        <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                            Chọn phòng cần gán
                        </label>
                        <select
                            required
                            value={roomId}
                            onChange={(e) => setRoomId(e.target.value)}
                            className="w-full rounded border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#bfa15f]"
                        >
                            <option value="">-- Chọn phòng --</option>
                            {rooms.map((room) => (
                                <option key={room.id} value={room.id}>
                                    Phòng {room.roomNumber} {room.roomTypeName ? `(${room.roomTypeName})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    {roomId && (
                        <div className="w-full md:w-1/3">
                            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                                Tìm nhanh thiết bị
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Tìm theo tên hoặc mã..."
                                    value={searchKeyword}
                                    onChange={(e) => setSearchKeyword(e.target.value)}
                                    className="w-full rounded border border-stone-300 pl-8 pr-3 py-2 text-sm outline-none focus:border-[#bfa15f]"
                                />
                                <Search size={14} className="absolute left-2.5 top-3.5 text-stone-400" />
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                fetchRooms();
                                fetchEquipments();
                                fetchRoomEquipments();
                            }}
                            className="flex items-center gap-2 rounded border border-stone-300 px-3 py-2 text-sm text-slate-600 hover:bg-stone-50"
                            title="Tải lại dữ liệu"
                        >
                            <RefreshCw size={16} />
                            Tải lại
                        </button>
                    </div>
                </div>
            </div>

            {/* Bảng gán thiết bị */}
            {roomId && (
                <div className="rounded border border-stone-200 bg-white p-4 shadow-sm">
                    <div className="mb-4 flex items-center justify-between border-b pb-3">
                        <h3 className="font-semibold text-slate-700">
                            Danh sách thiết bị trong phòng {selectedRoom ? selectedRoom.roomNumber : ''}
                        </h3>
                        <button
                            type="button"
                            disabled={!hasChanges || saving}
                            onClick={handleSaveChanges}
                            className={`flex items-center gap-2 rounded px-4 py-2 text-sm font-semibold text-white transition-all ${
                                hasChanges
                                    ? 'bg-[#bfa15f] hover:bg-[#a3854a] cursor-pointer shadow-md'
                                    : 'bg-stone-300 cursor-not-allowed'
                            }`}
                        >
                            <Save size={16} />
                            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </button>
                    </div>

                    {loading ? (
                        <p className="py-8 text-center text-sm text-slate-500">Đang tải danh sách thiết bị...</p>
                    ) : filteredEquipments.length === 0 ? (
                        <p className="py-8 text-center text-sm text-slate-500">Không tìm thấy thiết bị nào.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left text-sm">
                                <thead className="border-b bg-stone-50 text-xs uppercase text-slate-500">
                                    <tr>
                                        <th className="px-4 py-3">Tên thiết bị</th>
                                        <th className="px-4 py-3">Mã thiết bị</th>
                                        <th className="px-4 py-3 text-center">Trạng thái gán</th>
                                        <th className="px-4 py-3 text-center w-36">Số lượng</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredEquipments.map((item) => {
                                        const currentVal = quantities[item.id] || 0;
                                        const initialVal = initialQuantities[item.id] || 0;
                                        const isModified = currentVal !== initialVal;
                                        const isAssigned = currentVal > 0;

                                        return (
                                            <tr key={item.id} className={`border-b hover:bg-stone-50/50 transition-colors ${isModified ? 'bg-amber-50/30' : ''}`}>
                                                <td className="px-4 py-3">
                                                    <div className="font-semibold text-slate-700">{item.equipmentName}</div>
                                                    {item.description && (
                                                        <div className="text-xs text-slate-400 mt-0.5">{item.description}</div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 font-mono text-xs text-[#bfa15f] font-semibold">
                                                    {item.equipmentCode}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {isAssigned ? (
                                                        <span className="inline-block rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                                            Đã gán ({currentVal})
                                                        </span>
                                                    ) : (
                                                        <span className="inline-block rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-500">
                                                            Chưa gán
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-center border border-stone-300 rounded overflow-hidden max-w-[120px] mx-auto bg-white shadow-sm">
                                                        <button
                                                            type="button"
                                                            disabled={currentVal === 0}
                                                            onClick={() => decrement(item.id)}
                                                            className={`p-1.5 hover:bg-stone-100 text-stone-600 transition-colors ${currentVal === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
                                                        >
                                                            <Minus size={14} />
                                                        </button>
                                                        <input
                                                            type="text"
                                                            pattern="[0-9]*"
                                                            value={currentVal}
                                                            onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                                            className="w-10 text-center text-sm font-semibold border-x border-stone-300 py-1 outline-none"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => increment(item.id)}
                                                            className="p-1.5 hover:bg-stone-100 text-stone-600 transition-colors"
                                                        >
                                                            <Plus size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {!roomId && (
                <div className="rounded border border-stone-200 bg-white p-8 text-center shadow-sm">
                    <p className="text-slate-500 text-sm">Vui lòng chọn phòng để bắt đầu quản lý và gán nhanh thiết bị.</p>
                </div>
            )}
        </div>
    );
}
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link2, RefreshCw, Trash2 } from 'lucide-react';
import { equipmentService } from '../services/equipmentService';
import { getAllRooms } from '../services/roomService';
import { useLocale } from '../context/LocaleContext';
import Toast from './shared/Toast';

export default function AssignEquipmentToRoom() {
    const { locale } = useLocale();

    const [rooms, setRooms] = useState([]);
    const [equipments, setEquipments] = useState([]);
    const [roomEquipments, setRoomEquipments] = useState([]);

    const [roomId, setRoomId] = useState('');
    const [equipmentId, setEquipmentId] = useState('');
    const [quantity, setQuantity] = useState(1);

    const [loading, setLoading] = useState(false);
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

    // Lấy thiết bị đã gán trong phòng đang chọn
    const fetchRoomEquipments = useCallback(async () => {
        if (!roomId) {
            setRoomEquipments([]);
            return;
        }

        setLoading(true);

        try {
            const response = await equipmentService.getByRoom(roomId, locale);
            setRoomEquipments(response?.data ?? []);
        } catch {
            setRoomEquipments([]);
            notify('Không tải được thiết bị trong phòng', 'error');
        } finally {
            setLoading(false);
        }
    }, [roomId, locale]);

    useEffect(() => {
        fetchRooms();
        fetchEquipments();
    }, [fetchRooms, fetchEquipments]);

    useEffect(() => {
        fetchRoomEquipments();
    }, [fetchRoomEquipments]);

    const selectedRoom = useMemo(
        () => rooms.find((room) => String(room.id) === String(roomId)),
        [rooms, roomId]
    );

    const handleAssign = async (event) => {
        event.preventDefault();

        if (!roomId) {
            notify('Vui lòng chọn phòng', 'error');
            return;
        }

        if (!equipmentId) {
            notify('Vui lòng chọn thiết bị', 'error');
            return;
        }

        if (!quantity || Number(quantity) < 1) {
            notify('Số lượng phải lớn hơn hoặc bằng 1', 'error');
            return;
        }

        try {
            await equipmentService.assignToRoom(
                equipmentId,
                {
                    roomId: Number(roomId),
                    quantity: Number(quantity),
                },
                locale
            );

            notify('Gán thiết bị vào phòng thành công');
            setEquipmentId('');
            setQuantity(1);
            fetchRoomEquipments();
        } catch (error) {
            notify(error?.message || 'Gán thiết bị thất bại', 'error');
        }
    };

    const handleRemove = async (item) => {
        if (!window.confirm(`Gỡ ${item.equipmentName} khỏi phòng này?`)) return;

        try {
            await equipmentService.removeFromRoom(item.equipmentId, item.roomId, locale);
            notify('Gỡ thiết bị khỏi phòng thành công');
            fetchRoomEquipments();
        } catch (error) {
            notify(error?.message || 'Gỡ thiết bị thất bại', 'error');
        }
    };

    return (
        <div className="space-y-5">
            <Toast type={toast.type} message={toast.message} onClose={closeToast} />

            <div className="rounded border border-stone-200 bg-white p-4 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-slate-700">
                    Gán thiết bị vào phòng
                </h2>

                <form onSubmit={handleAssign} className="grid gap-4 md:grid-cols-4">
                    <div>
                        <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                            Phòng
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
                                    {room.roomNumber}
                                    {room.roomTypeName ? ` - ${room.roomTypeName}` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                            Thiết bị
                        </label>
                        <select
                            required
                            value={equipmentId}
                            onChange={(e) => setEquipmentId(e.target.value)}
                            className="w-full rounded border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#bfa15f]"
                        >
                            <option value="">-- Chọn thiết bị --</option>
                            {equipments.map((equipment) => (
                                <option key={equipment.id} value={equipment.id}>
                                    {equipment.equipmentName} ({equipment.equipmentCode})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                            Số lượng
                        </label>
                        <input
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            className="w-full rounded border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#bfa15f]"
                        />
                    </div>

                    <div className="flex items-end gap-2">
                        <button
                            type="submit"
                            className="flex items-center gap-2 rounded bg-[#bfa15f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#a3854a]"
                        >
                            <Link2 size={16} />
                            Gán
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                fetchRooms();
                                fetchEquipments();
                                fetchRoomEquipments();
                            }}
                            className="rounded border border-stone-300 p-2 hover:bg-stone-50"
                            title="Tải lại"
                        >
                            <RefreshCw size={16} />
                        </button>
                    </div>
                </form>
            </div>

            <div className="rounded border border-stone-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-semibold text-slate-700">
                        Thiết bị trong phòng{' '}
                        {selectedRoom ? selectedRoom.roomNumber : ''}
                    </h3>
                </div>

                {!roomId ? (
                    <p className="text-sm text-slate-500">
                        Chọn phòng để xem danh sách thiết bị.
                    </p>
                ) : loading ? (
                    <p className="text-sm text-slate-500">Đang tải...</p>
                ) : roomEquipments.length === 0 ? (
                    <p className="text-sm text-slate-500">
                        Phòng này chưa được gán thiết bị.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="border-b bg-stone-50 text-xs uppercase text-slate-500">
                            <tr>
                                <th className="px-4 py-3">ID</th>
                                <th className="px-4 py-3">Thiết bị</th>
                                <th className="px-4 py-3">Mã</th>
                                <th className="px-4 py-3">Số lượng</th>
                                <th className="px-4 py-3">Ngày gán</th>
                                <th className="px-4 py-3">Thao tác</th>
                            </tr>
                            </thead>

                            <tbody>
                            {roomEquipments.map((item) => (
                                <tr key={item.id} className="border-b hover:bg-stone-50">
                                    <td className="px-4 py-3 font-mono text-xs">
                                        {item.id}
                                    </td>
                                    <td className="px-4 py-3 font-semibold">
                                        {item.equipmentName}
                                    </td>
                                    <td className="px-4 py-3 font-mono text-xs text-[#bfa15f]">
                                        {item.equipmentCode}
                                    </td>
                                    <td className="px-4 py-3">
                                        {item.quantity}
                                    </td>
                                    <td className="px-4 py-3 text-slate-500">
                                        {item.assignedAt
                                            ? new Date(item.assignedAt).toLocaleString('vi-VN')
                                            : '-'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <button
                                            type="button"
                                            onClick={() => handleRemove(item)}
                                            className="text-red-500 hover:text-red-700"
                                            title="Gỡ thiết bị khỏi phòng"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
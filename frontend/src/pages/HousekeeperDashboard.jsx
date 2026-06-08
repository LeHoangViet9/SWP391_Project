import { useState, useEffect, useCallback, useMemo } from 'react';
import { BedDouble, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import DashboardShell from '../components/layout/DashboardShell';
import SearchBar from '../components/common/SearchBar';
import FilterSelect from '../components/common/FilterSelect';
import Pagination from '../components/common/Pagination';
import StatusBadge from '../components/common/StatusBadge';
import Alert from '../components/common/Alert';
import { useLocale } from '../context/LocaleContext';
import { getAllRooms, updateRoomStatus } from '../services/roomService';
import { HOUSEKEEPING_FILTERS } from '../constants/enums';

function getHousekeepingCategory(room, cleaningIds) {
  if (cleaningIds.has(room.id)) return 'CLEANING';
  if (room.roomStatus === 'DIRTY') return 'DIRTY';
  if (room.roomStatus === 'AVAILABLE') return 'CLEAN';
  return room.roomStatus;
}

const CATEGORY_STYLES = {
  DIRTY: 'border-amber-300 bg-amber-50',
  CLEANING: 'border-blue-300 bg-blue-50',
  CLEAN: 'border-emerald-300 bg-emerald-50',
};

export default function HousekeeperDashboard() {
  const { locale } = useLocale();
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [size] = useState(12);
  const [rooms, setRooms] = useState([]);
  const [pageInfo, setPageInfo] = useState({ totalPages: 0, totalElements: 0 });
  const [loading, setLoading] = useState(true);
  const [cleaningIds, setCleaningIds] = useState(new Set());
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadRooms = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getAllRooms({
        keywords: keyword || undefined,
        page,
        size,
        sortBy: 'ID',
        direction: 'ASC',
      }, locale);
      setRooms(res?.data?.content || []);
      setPageInfo({
        totalPages: res?.data?.totalPages ?? 0,
        totalElements: res?.data?.totalElements ?? 0,
      });
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách phòng');
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }, [locale, keyword, page, size]);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  const displayedRooms = useMemo(() => {
    if (!statusFilter) return rooms;
    return rooms.filter((room) => getHousekeepingCategory(room, cleaningIds) === statusFilter);
  }, [rooms, statusFilter, cleaningIds]);

  const startCleaning = (roomId) => {
    setCleaningIds((prev) => new Set(prev).add(roomId));
    setSuccess(`Đã bắt đầu dọn phòng #${roomId}`);
  };

  const finishCleaning = async (roomId) => {
    setUpdatingId(roomId);
    setError('');
    try {
      await updateRoomStatus(roomId, 'AVAILABLE', locale);
      setCleaningIds((prev) => {
        const next = new Set(prev);
        next.delete(roomId);
        return next;
      });
      setSuccess(`Phòng #${roomId} đã sạch (AVAILABLE)`);
      loadRooms();
    } catch (err) {
      setError(err.message || 'Không thể cập nhật trạng thái');
    } finally {
      setUpdatingId(null);
    }
  };

  const markDirty = async (roomId) => {
    setUpdatingId(roomId);
    setError('');
    try {
      await updateRoomStatus(roomId, 'DIRTY', locale);
      setSuccess(`Phòng #${roomId} đánh dấu cần dọn`);
      loadRooms();
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <DashboardShell title="Bảng điều khiển Buồng phòng">
      <Alert type="error" message={error} onClose={() => setError('')} />
      <Alert type="success" message={success} onClose={() => setSuccess('')} />

      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden mb-6">
        <div className="flex flex-wrap gap-3 p-4 border-b border-stone-100">
          <SearchBar
            value={keyword}
            onChange={setKeyword}
            onSubmit={() => { setPage(1); loadRooms(); }}
            placeholder="Tìm theo số phòng..."
          />
          <FilterSelect
            label="Trạng thái vệ sinh"
            value={statusFilter}
            onChange={setStatusFilter}
            options={HOUSEKEEPING_FILTERS}
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400 gap-2">
            <Loader2 size={24} className="animate-spin" />
            Đang tải phòng...
          </div>
        ) : displayedRooms.length === 0 ? (
          <div className="text-center py-20 text-slate-400">Không có phòng phù hợp</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
            {displayedRooms.map((room) => {
              const category = getHousekeepingCategory(room, cleaningIds);
              const isUpdating = updatingId === room.id;
              return (
                <div
                  key={room.id}
                  className={`rounded-xl border-2 p-4 transition-shadow hover:shadow-md ${CATEGORY_STYLES[category] || 'border-stone-200 bg-white'}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <p className="font-display text-xl font-bold text-slate-800 flex items-center gap-2">
                        <BedDouble size={18} className="text-[#bfa15f]" />
                        {room.roomNumber}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Tầng {room.floorNumber} · {room.roomType?.typeName || '—'}
                      </p>
                    </div>
                    <StatusBadge status={category === 'CLEAN' ? 'AVAILABLE' : category === 'CLEANING' ? 'IN_PROGRESS' : room.roomStatus} />
                  </div>

                  {room.imageRoom && (
                    <img src={room.imageRoom} alt="" className="w-full h-24 object-cover rounded-lg mb-3" />
                  )}

                  <div className="flex flex-col gap-2">
                    {category === 'DIRTY' && (
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => startCleaning(room.id)}
                        className="w-full flex items-center justify-center gap-2 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60"
                      >
                        <Sparkles size={15} />
                        Bắt đầu dọn
                      </button>
                    )}
                    {category === 'CLEANING' && (
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => finishCleaning(room.id)}
                        className="w-full flex items-center justify-center gap-2 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-60"
                      >
                        {isUpdating ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                        Hoàn thành dọn
                      </button>
                    )}
                    {category === 'CLEAN' && (
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => markDirty(room.id)}
                        className="w-full py-2 border border-amber-400 text-amber-700 text-sm font-medium rounded-lg hover:bg-amber-50 disabled:opacity-60"
                      >
                        Đánh dấu cần dọn
                      </button>
                    )}
                    {room.roomStatus === 'OCCUPIED' && (
                      <p className="text-xs text-center text-slate-400">Phòng đang có khách</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Pagination
          page={page}
          totalPages={pageInfo.totalPages}
          totalElements={pageInfo.totalElements}
          onPageChange={setPage}
        />
      </div>
    </DashboardShell>
  );
}

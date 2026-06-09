import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Pencil, Star, Wrench, Calendar, MapPin, Tag, Image as ImageIcon } from 'lucide-react';
import { useLocale } from '../../context/LocaleContext';
import { useAuth } from '../../context/AuthContext';
import { getEquipmentById } from '../../services/equipmentService';
import { canEditEquipment } from '../../utils/roleAccess';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { formatDateTime } from '../../utils/formatters';

export default function EquipmentDetailPage() {
  const { id } = useParams();
  const { t } = useLocale();
  const { user } = useAuth();
  const role = user?.roleName;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['equipment', id],
    queryFn: () => getEquipmentById(id),
  });

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <p className="text-red-500 p-6">{error.message}</p>;

  const eq = data?.data;
  if (!eq) return <p className="text-slate-400 p-6">{t('staff.common.noData')}</p>;

  const images = eq.images || [];
  const primaryImage = images.find((img) => img.isPrimary) || images[0];

  return (
    <div className="animate-fadeInUp">
      {/* Back link */}
      <Link
        to="/staff/equipments"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-[#bfa15f] mb-4"
      >
        <ArrowLeft size={16} />
        {t('bookingPage.back')}
      </Link>

      <div className="page-header">
        <div>
          <h1 className="page-title">{t('staff.equipmentDetail.title')}</h1>
          <p className="page-subtitle">{eq.equipmentName}</p>
        </div>
        {canEditEquipment(role) && (
          <Link
            to={`/staff/equipments/${id}/edit`}
            className="btn-gold px-4 py-2.5 rounded-lg flex items-center gap-2 text-sm self-start"
          >
            <Pencil size={16} />
            {t('staff.equipment.edit')}
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ─── Image Gallery ────────────────────────────────── */}
        <div className="lg:col-span-1">
          <div className="hms-card p-5">
            <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <ImageIcon size={16} className="text-[#bfa15f]" />
              {t('staff.equipmentDetail.gallery')}
            </h3>

            {images.length === 0 ? (
              <div className="aspect-square bg-stone-100 rounded-lg flex items-center justify-center">
                <div className="text-center text-slate-400">
                  <ImageIcon size={32} className="mx-auto mb-2 opacity-40" />
                  <p className="text-xs">{t('staff.equipmentDetail.noImages')}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Primary image */}
                {primaryImage && (
                  <div className="relative">
                    <img
                      src={primaryImage.imageUrl}
                      alt={eq.equipmentName}
                      className="w-full aspect-square object-cover rounded-lg"
                    />
                    {primaryImage.isPrimary && (
                      <span className="absolute top-2 left-2 bg-[#bfa15f] text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Star size={10} />
                        {t('staff.equipmentDetail.primaryImage')}
                      </span>
                    )}
                  </div>
                )}
                {/* Other images grid */}
                {images.length > 1 && (
                  <div className="grid grid-cols-3 gap-2">
                    {images.filter((img) => img !== primaryImage).map((img, idx) => (
                      <img
                        key={idx}
                        src={img.imageUrl}
                        alt={`${eq.equipmentName} ${idx + 2}`}
                        className="w-full aspect-square object-cover rounded-lg border border-stone-200"
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ─── Equipment Info ───────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          <div className="hms-card p-5">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Wrench size={16} className="text-[#bfa15f]" />
              {t('staff.equipmentDetail.info')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Tag size={14} className="text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-slate-400">{t('staff.equipment.code')}</p>
                  <p className="text-sm font-mono font-medium">{eq.equipmentCode}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin size={14} className="text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-slate-400">{t('staff.equipment.location')}</p>
                  <p className="text-sm font-medium">{eq.location}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400">{t('staff.equipment.room')}</p>
                <p className="text-sm font-medium">{eq.roomNumber || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">{t('bookingPage.status')}</p>
                <div className="mt-1"><StatusBadge status={eq.status} /></div>
              </div>
              <div>
                <p className="text-xs text-slate-400">{t('staff.common.createdAt')}</p>
                <p className="text-sm">{formatDateTime(eq.createdAt)}</p>
              </div>
            </div>
            {eq.description && (
              <div className="mt-4 pt-4 border-t border-stone-100">
                <p className="text-xs text-slate-400 mb-1">{t('staff.common.description')}</p>
                <p className="text-sm text-slate-600">{eq.description}</p>
              </div>
            )}
          </div>

          {/* ─── Maintenance History ────────────────────────── */}
          <div className="hms-card p-5">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Calendar size={16} className="text-[#bfa15f]" />
              {t('staff.equipmentDetail.maintenanceHistory')}
            </h3>
            {eq.checks && eq.checks.length > 0 ? (
              <div className="space-y-3">
                {eq.checks.map((check, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-stone-50 rounded-lg">
                    <div className="w-2 h-2 rounded-full bg-[#bfa15f] mt-1.5 shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-800">{check.checkType || 'Kiểm tra'}</p>
                        <p className="text-xs text-slate-400">{formatDateTime(check.checkDate)}</p>
                      </div>
                      {check.diagnosis && (
                        <p className="text-sm text-slate-500 mt-1">{check.diagnosis}</p>
                      )}
                      {check.result && (
                        <p className="text-xs text-slate-400 mt-1">Kết quả: {check.result}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 py-4 text-center">
                {t('staff.equipmentDetail.noHistory')}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useBookingStore } from '@/src/stores/bookingStore';
import { toast } from '@/src/utils/toast';
import StatsGrid from '@/src/components/ui/StatsGrid';
import type { Booking, BookingStatus, BookingQueryParams } from '@/src/types/booking.types';
import PageHeader from '@/src/components/ui/PageHeader';
import { useLanguage } from '@/src/components/providers/LanguageProvider';
import { usePageTitle } from '@/src/hooks/usePageTitle';
import Alert from '@/src/components/ui/Alert';
import { getApiMessage } from '@/src/lib/errors';
import Modal, { ModalFooter } from '@/src/components/ui/Modal';
import FormField, { Textarea, inputClass } from '@/src/components/ui/FormField';
import { Calendar, CheckCircle, ClipboardCheck, Search, X } from 'lucide-react';
import Spinner from '@/src/components/ui/Spinner';
import Badge from '@/src/components/ui/Badge';
import { BOOKING_STATUS_TONE } from '@/src/lib/statusTones';
import SegmentedControl from '@/src/components/ui/SegmentedControl';
import { TableSkeleton } from '@/src/components/ui/Skeleton';
import EmptyState from '@/src/components/ui/EmptyState';
import { useFormat } from '@/src/hooks/useFormat';
import { useAuth } from '@/src/hooks/useAuth';
import { hasRole } from '@/src/lib/auth';
import { ROLES } from '@/src/lib/roles';

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_OPTION_KEYS: { value: BookingStatus | 'all'; key: string }[] = [
  { value: 'all',       key: 'common:actions.viewAll' },
  { value: 'pending',   key: 'status.pending' },
  { value: 'confirmed', key: 'status.confirmed' },
  { value: 'completed', key: 'status.completed' },
  { value: 'cancelled', key: 'status.cancelled' },
];

// ─── Cancel Modal ─────────────────────────────────────────────────────────────
function CancelModal({
  open,
  booking,
  onClose,
  onConfirm,
  isLoading,
}: {
  open: boolean;
  booking: Booking | null;
  onClose: () => void;
  onConfirm: (id: string, reason: string) => Promise<void>;
  isLoading: boolean;
}) {
  const [reason, setReason] = useState('');
  const { t } = useLanguage();
  const tb = t('bookings');
  const fmt = useFormat();

  useEffect(() => { if (open) setReason(''); }, [open]);

  if (!open || !booking) return null;

  return (
    <Modal onClose={onClose} title={tb('cancelModal.title')}>
      <div className="p-6 flex flex-col gap-4">
        <div className="p-3 rounded-xl bg-surface-raised border border-surface-border text-sm">
          <p className="font-semibold text-text-primary">{booking.memberName}</p>
          <p className="text-text-muted">{fmt.date(booking.sessionDate)} · {booking.timeRangeLabel}</p>
          <p className="text-text-muted">{tb('cancelModal.trainer')} {booking.trainerName}</p>
        </div>
        <FormField label={<>{tb('cancelModal.reason')} <span className="text-text-muted font-normal">{tb('cancelModal.optional')}</span></>}>
          <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder={tb('cancelModal.reasonPlaceholder')} />
        </FormField>
        <ModalFooter onCancel={onClose} cancelLabel={tb('cancelModal.back')} submitLabel={tb('cancelModal.submit')} loading={isLoading} variant="danger" onSubmit={() => onConfirm(booking.id, reason)} />
      </div>
    </Modal>
  );
}

// ─── Booking Row ──────────────────────────────────────────────────────────────
function BookingRow({
  booking,
  onConfirm,
  onCancel,
  onComplete,
  actingId,
  canCancel,
}: {
  booking: Booking;
  onConfirm: (b: Booking) => void;
  onCancel: (b: Booking) => void;
  onComplete: (b: Booking) => void;
  actingId: string | null;
  canCancel: boolean;
}) {
  const isActing = actingId === booking.id;
  const { t } = useLanguage();
  const tb = t('bookings');
  const fmt = useFormat();

  return (
    <tr className="border-b border-surface-border hover:bg-surface-raised transition-colors">
      {/* Member */}
      <td className="px-4 py-3">
        <p className="text-sm font-semibold text-text-primary">{booking.memberName}</p>
        <p className="text-xs text-text-muted">{booking.memberEmail}</p>
      </td>
      {/* Trainer */}
      <td className="px-4 py-3">
        <p className="text-sm text-text-primary">{booking.trainerName}</p>
        <p className="text-xs text-text-muted">{booking.trainerEmail}</p>
      </td>
      {/* Date + Time */}
      <td className="px-4 py-3">
        <p className="text-sm text-text-primary">{fmt.date(booking.sessionDate)}</p>
        <p className="text-xs text-text-muted">{booking.timeRangeLabel}</p>
      </td>
      {/* Status */}
      <td className="px-4 py-3">
        <Badge tone={BOOKING_STATUS_TONE[booking.status]} dot>{tb(`status.${booking.status}`)}</Badge>
        {booking.cancellationReason && (
          <p className="text-xs text-text-muted mt-1 italic">"{booking.cancellationReason}"</p>
        )}
      </td>
      {/* Notes */}
      <td className="px-4 py-3 max-w-[180px]">
        <p className="text-xs text-text-muted truncate">{booking.notes ?? '—'}</p>
      </td>
      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          {isActing ? (
            <Spinner className="text-primary-500" />
          ) : (
            <>
              {booking.status === 'pending' && (
                <button onClick={() => onConfirm(booking)} title={tb('actions.confirm')}
                  className="p-1.5 rounded-lg text-primary-500 hover:bg-primary-500/10 transition-all cursor-pointer">
                  <CheckCircle size={16} />
                </button>
              )}
              {booking.status === 'confirmed' && (
                <button onClick={() => onComplete(booking)} title={tb('actions.complete')}
                  className="p-1.5 rounded-lg text-success-500 hover:bg-success-500/10 transition-all cursor-pointer">
                  <ClipboardCheck size={16} />
                </button>
              )}
              {canCancel && (booking.status === 'pending' || booking.status === 'confirmed') && (
                <button onClick={() => onCancel(booking)} title={tb('actions.cancel')}
                  className="p-1.5 rounded-lg text-danger-500 hover:bg-danger-500/10 transition-all cursor-pointer">
                  <X size={16} />
                </button>
              )}
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function BookingsPage() {
  const { t } = useLanguage();
  const tb = t('bookings');
  const tCommon = t('common');
  usePageTitle('bookings');
  const { user } = useAuth();
  // Trainers confirm / complete their own sessions but cannot cancel (backend enforces the same)
  const canCancel = !hasRole(user, ROLES.TRAINER);

  const STATUS_OPTIONS = STATUS_OPTION_KEYS.map(({ value, key }) => ({
    value,
    label: key.startsWith('common:') ? tCommon(key.replace('common:', '')) : tb(key),
  }));
  const { bookings, isLoading, error, fetchBookings, confirmBooking, cancelBooking, completeBooking, clearError } = useBookingStore();

  const [filterStatus, setFilterStatus] = useState<BookingStatus | 'all'>('all');
  const [filterDate, setFilterDate] = useState('');
  const [search, setSearch] = useState('');
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const loadBookings = useCallback((params: BookingQueryParams = {}) => {
    fetchBookings(params).catch(() => {});
  }, [fetchBookings]);

  useEffect(() => { loadBookings(); }, [loadBookings]);
  useEffect(() => () => clearError(), [clearError]);

  // Apply filter changes
  useEffect(() => {
    const params: BookingQueryParams = {};
    if (filterStatus !== 'all') params.status = filterStatus;
    if (filterDate) params.date = filterDate;
    loadBookings(params);
  }, [filterStatus, filterDate]); // eslint-disable-line

  // Local search
  const filtered = bookings.filter((b) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return b.memberName.toLowerCase().includes(q) || b.trainerName.toLowerCase().includes(q);
  });

  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === 'pending').length,
    confirmed: bookings.filter((b) => b.status === 'confirmed').length,
    completed: bookings.filter((b) => b.status === 'completed').length,
    cancelled: bookings.filter((b) => b.status === 'cancelled').length,
  };

  const handleConfirm = useCallback(async (b: Booking) => {
    setActingId(b.id);
    try {
      await confirmBooking(b.id);
      toast.success(tb('toast.confirmSuccess'));
    } catch (err) {
      toast.error(getApiMessage(err) || tb('toast.actionError'));
    } finally { setActingId(null); }
  }, [confirmBooking, tb]);

  const handleCancel = useCallback(async (id: string, reason: string) => {
    setCancelling(true);
    try {
      await cancelBooking(id, reason ? { cancellationReason: reason } : undefined);
      toast.success(tb('toast.cancelSuccess'));
      setCancelTarget(null);
    } catch (err) {
      toast.error(getApiMessage(err) || tb('toast.cancelError'));
    } finally { setCancelling(false); }
  }, [cancelBooking, tb]);

  const handleComplete = useCallback(async (b: Booking) => {
    setActingId(b.id);
    try {
      await completeBooking(b.id);
      toast.success(tb('toast.completeSuccess'));
    } catch (err) {
      toast.error(getApiMessage(err) || tb('toast.actionError'));
    } finally { setActingId(null); }
  }, [completeBooking, tb]);

  return (
    <>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto">
        {/* Page header */}
        <div className="flex items-center justify-between gap-4">
          <PageHeader title={tb('title')} subtitle={tb('subtitle')} />
        </div>


        {/* Error banner */}
        {error && <Alert onDismiss={clearError}>{error}</Alert>}

        {/* Stats */}
        <StatsGrid
          isLoading={isLoading}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4"
          items={[
            { label: tCommon('status.pending'),   value: stats.pending,   color: 'warning'   },
            { label: tCommon('status.confirmed'),  value: stats.confirmed, color: 'primary'   },
            { label: tCommon('status.completed'),  value: stats.completed, color: 'success'   },
            { label: tCommon('status.cancelled'),  value: stats.cancelled, color: 'secondary' },
            { label: tCommon('actions.viewAll'),   value: stats.total,     color: 'primary'   },
          ]}
        />

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative w-52">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder={tb('filters.searchPlaceholder')}
              className={`${inputClass()} pl-9`}
            />
          </div>

          {/* Date filter */}
          <div className="relative">
            <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)}
              className={`${inputClass()} pl-9`}
            />
          </div>

          {/* Status filter */}
          <SegmentedControl value={filterStatus} onChange={setFilterStatus}
            options={STATUS_OPTIONS.map((opt) => ({ value: opt.value as BookingStatus | 'all', label: opt.label }))} />

          {filterDate && (
            <button onClick={() => setFilterDate('')} className="text-xs text-text-muted hover:text-danger-500 transition-colors cursor-pointer">
              {tb('filters.clearDate')}
            </button>
          )}

          <span className="ml-auto text-xs text-text-muted">{tb('filters.count').replace('{{count}}', String(filtered.length))}</span>
        </div>

        {/* Table */}
        <div className="bg-surface-base border border-surface-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-border bg-surface-raised">
                  {[tb('table.member'), tb('table.trainer'), tb('table.date'), tb('table.status'), tb('table.notes'), tb('table.actions')].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading && bookings.length === 0 ? (
                  <TableSkeleton rows={5} cols={6} />
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6}><EmptyState icon={<Calendar size={40} />} title={tb('empty.title')} description={tb('empty.description')} /></td></tr>
                ) : (
                  filtered.map((booking) => (
                    <BookingRow key={booking.id} booking={booking}
                      onConfirm={handleConfirm}
                      onCancel={setCancelTarget}
                      onComplete={handleComplete}
                      actingId={actingId}
                      canCancel={canCancel}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <CancelModal
        open={!!cancelTarget}
        booking={cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancel}
        isLoading={cancelling}
      />
    </>
  );
}

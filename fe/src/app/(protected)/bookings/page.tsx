'use client';

import { useEffect, useState, useCallback } from 'react';
import { useBookingStore } from '@/src/stores/bookingStore';
import { toast } from '@/src/utils/toast';
import StatsGrid from '@/src/components/ui/StatsGrid';
import type { Booking, BookingStatus, BookingQueryParams } from '@/src/types/booking.types';
import PageHeader from '@/src/components/ui/PageHeader';
import { useLanguage } from '@/src/components/providers/LanguageProvider';
import { usePageTitle } from '@/src/hooks/usePageTitle';

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<BookingStatus, { badge: string; dot: string }> = {
  pending:   { badge: 'bg-warning-500/15 text-warning-500',  dot: 'bg-warning-500' },
  confirmed: { badge: 'bg-primary-500/15 text-primary-500',  dot: 'bg-primary-500' },
  completed: { badge: 'bg-success-500/15 text-success-500',  dot: 'bg-success-500' },
  cancelled: { badge: 'bg-surface-overlay text-text-muted',  dot: 'bg-text-muted' },
};

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

  useEffect(() => { if (open) setReason(''); }, [open]);

  if (!open || !booking) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-surface-base rounded-2xl shadow-2xl border border-surface-border overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
          <h2 className="text-base font-bold text-text-primary">Huỷ lịch đặt</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-overlay transition-all cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <div className="p-3 rounded-xl bg-surface-raised border border-surface-border text-sm">
            <p className="font-semibold text-text-primary">{booking.memberName}</p>
            <p className="text-text-muted">{booking.sessionDateLabel} · {booking.timeRangeLabel}</p>
            <p className="text-text-muted">HLV: {booking.trainerName}</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary">Lý do huỷ <span className="text-text-muted font-normal">(tuỳ chọn)</span></label>
            <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)}
              placeholder="Nhập lý do huỷ lịch..."
              className="w-full px-3 py-2.5 rounded-xl border border-surface-border text-sm text-text-primary bg-surface-raised placeholder-text-muted outline-none resize-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
            />
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-text-secondary border border-surface-border hover:bg-surface-overlay transition-all cursor-pointer">Huỷ bỏ</button>
            <button onClick={() => onConfirm(booking.id, reason)} disabled={isLoading}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-danger-500 hover:bg-danger-600 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2">
              {isLoading && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
              Xác nhận huỷ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Booking Row ──────────────────────────────────────────────────────────────
function BookingRow({
  booking,
  onConfirm,
  onCancel,
  onComplete,
  actingId,
}: {
  booking: Booking;
  onConfirm: (b: Booking) => void;
  onCancel: (b: Booking) => void;
  onComplete: (b: Booking) => void;
  actingId: string | null;
}) {
  const style = STATUS_STYLES[booking.status];
  const isActing = actingId === booking.id;

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
        <p className="text-sm text-text-primary">{booking.sessionDateLabel}</p>
        <p className="text-xs text-text-muted">{booking.timeRangeLabel}</p>
      </td>
      {/* Status */}
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${style.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
          {booking.statusLabel}
        </span>
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
            <svg className="w-4 h-4 animate-spin text-primary-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          ) : (
            <>
              {booking.status === 'pending' && (
                <button onClick={() => onConfirm(booking)} title="Xác nhận"
                  className="p-1.5 rounded-lg text-primary-500 hover:bg-primary-500/10 transition-all cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                </button>
              )}
              {booking.status === 'confirmed' && (
                <button onClick={() => onComplete(booking)} title="Hoàn thành"
                  className="p-1.5 rounded-lg text-success-500 hover:bg-success-500/10 transition-all cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0 1 18 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3 1.5 1.5 3-3.75" /></svg>
                </button>
              )}
              {(booking.status === 'pending' || booking.status === 'confirmed') && (
                <button onClick={() => onCancel(booking)} title="Huỷ"
                  className="p-1.5 rounded-lg text-danger-500 hover:bg-danger-500/10 transition-all cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
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
      toast.success(tb('toast.bookSuccess'));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || tb('toast.bookError'));
    } finally { setActingId(null); }
  }, [confirmBooking, tb]);

  const handleCancel = useCallback(async (id: string, reason: string) => {
    setCancelling(true);
    try {
      await cancelBooking(id, reason ? { cancellationReason: reason } : undefined);
      toast.success(tb('toast.cancelSuccess'));
      setCancelTarget(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || tb('toast.cancelError'));
    } finally { setCancelling(false); }
  }, [cancelBooking, tb]);

  const handleComplete = useCallback(async (b: Booking) => {
    setActingId(b.id);
    try {
      await completeBooking(b.id);
      toast.success(tb('toast.bookSuccess'));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || tb('toast.bookError'));
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
        {error && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-danger-500/10 border border-danger-500/20 text-danger-500 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
            <span className="flex-1">{error}</span>
            <button onClick={clearError} className="hover:opacity-70 cursor-pointer"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg></button>
          </div>
        )}

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
          <div className="relative">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm hội viên, HLV..."
              className="pl-9 pr-4 py-2 rounded-xl border border-surface-border bg-surface-raised text-sm text-text-primary placeholder-text-muted outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all w-52"
            />
          </div>

          {/* Date filter */}
          <div className="relative">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>
            <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)}
              className="pl-9 pr-3 py-2 rounded-xl border border-surface-border bg-surface-raised text-sm text-text-primary outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
            />
          </div>

          {/* Status filter */}
          <div className="flex gap-1 p-1 bg-surface-raised rounded-xl border border-surface-border flex-wrap">
            {STATUS_OPTIONS.map((opt) => (
              <button key={opt.value} onClick={() => setFilterStatus(opt.value as BookingStatus | 'all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer
                  ${filterStatus === opt.value ? 'bg-primary-500 text-white shadow' : 'text-text-secondary hover:text-text-primary hover:bg-surface-overlay'}`}>
                {opt.label}
              </button>
            ))}
          </div>

          {filterDate && (
            <button onClick={() => setFilterDate('')} className="text-xs text-text-muted hover:text-danger-500 transition-colors cursor-pointer">
              Xoá ngày
            </button>
          )}

          <span className="ml-auto text-xs text-text-muted">{filtered.length} lịch đặt</span>
        </div>

        {/* Table */}
        <div className="bg-surface-base border border-surface-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-border bg-surface-raised">
                  {[tb('table.member'), tb('table.trainer'), tb('table.date'), tCommon('status.active'), tb('table.notes'), tCommon('actions.details')].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading && bookings.length === 0 ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b border-surface-border animate-pulse">
                      {[...Array(6)].map((_, j) => (
                        <td key={j} className="px-4 py-4"><div className="h-4 bg-surface-overlay rounded w-3/4" /></td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center">
                      <p className="text-4xl mb-3">📅</p>
                      <p className="text-sm font-semibold text-text-primary">Không có lịch đặt nào</p>
                      <p className="text-xs text-text-muted mt-1">Thử thay đổi bộ lọc hoặc tìm kiếm khác.</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((booking) => (
                    <BookingRow key={booking.id} booking={booking}
                      onConfirm={handleConfirm}
                      onCancel={setCancelTarget}
                      onComplete={handleComplete}
                      actingId={actingId}
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

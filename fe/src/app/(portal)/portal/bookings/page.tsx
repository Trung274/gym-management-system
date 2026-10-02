'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getMyBookings, createBooking, cancelBooking } from '@/src/lib/bookingService';
import { getTrainers } from '@/src/lib/trainerService';
import { toast } from '@/src/utils/toast';
import { CalendarDays, Clock } from 'lucide-react';
import type { Booking, CreateBookingPayload } from '@/src/types/booking.types';
import type { Trainer } from '@/src/types/trainer.types';
import PageHeader from '@/src/components/ui/PageHeader';
import AddButton from '@/src/components/ui/AddButton';
import { useLanguage } from '@/src/components/providers/LanguageProvider';
import { usePageTitle } from '@/src/hooks/usePageTitle';
import Alert from '@/src/components/ui/Alert';
import { getApiMessage } from '@/src/lib/errors';
import Modal, { ModalFooter } from '@/src/components/ui/Modal';
import FormField, { inputClass } from '@/src/components/ui/FormField';
import Badge from '@/src/components/ui/Badge';
import { BOOKING_STATUS_TONE } from '@/src/lib/statusTones';
import SegmentedControl from '@/src/components/ui/SegmentedControl';
import { SkeletonList } from '@/src/components/ui/Skeleton';
import EmptyState from '@/src/components/ui/EmptyState';
import { useFormat } from '@/src/hooks/useFormat';

function BookingCard({ b, onCancel, cancelling }: { b: Booking; onCancel: () => void; cancelling: boolean }) {
  const { t } = useLanguage();
  const tp = t('portal');
  const fmt = useFormat();

  return (
    <div className="bg-surface-base border border-surface-border rounded-xl p-4 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-text-primary">{b.trainerName}</p>
          <p className="text-xs text-text-muted">{b.trainerEmail}</p>
        </div>
        <Badge tone={BOOKING_STATUS_TONE[b.status]}>{tp(`bookings.status.${b.status}`)}</Badge>
      </div>
      <div className="flex items-center gap-3 text-xs text-text-secondary">
        <span className="flex items-center gap-1"><CalendarDays size={11} /> {fmt.date(b.sessionDate)}</span>
        <span className="flex items-center gap-1"><Clock size={11} /> {b.timeRangeLabel}</span>
      </div>
      {b.notes && <p className="text-xs text-text-muted italic">"{b.notes}"</p>}
      {b.status === 'pending' && (
        <button onClick={onCancel} disabled={cancelling}
          className="mt-1 text-xs text-danger-500 hover:underline cursor-pointer disabled:opacity-50 self-start">
          {cancelling ? tp('bookings.card.cancelling') : tp('bookings.card.cancel')}
        </button>
      )}
    </div>
  );
}

// Inner component that uses useSearchParams (must be wrapped in Suspense)
function PortalBookingsContent() {
  const router = useRouter();
  const presetTrainerId = useSearchParams().get('trainerId');
  const { t } = useLanguage();
  const tp = t('portal');
  usePageTitle('portal', 'bookings.title');

  const [bookings,  setBookings]  = useState<Booking[]>([]);
  const [trainers,  setTrainers]  = useState<Trainer[]>([]);
  const [tab,       setTab]       = useState<'upcoming' | 'history'>('upcoming');
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [cancelId,  setCancelId]  = useState<string | null>(null);

  const [form, setForm] = useState<CreateBookingPayload>({
    trainerId: '', sessionDate: '', startTime: '07:00', endTime: '08:00', notes: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [b, t] = await Promise.all([getMyBookings(), getTrainers()]);
      setBookings(b);
      setTrainers(t.filter(tr => tr.status === 'active'));
    } catch (e) { setError(getApiMessage(e) ?? ''); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Opened from "Book with this trainer" (/portal/bookings?trainerId=...) → open modal with trainer preselected
  useEffect(() => {
    if (!presetTrainerId || loading) return;
    if (trainers.some(tr => tr.id === presetTrainerId)) {
      setForm(f => ({ ...f, trainerId: presetTrainerId }));
    }
    setModalOpen(true);
    router.replace('/portal/bookings', { scroll: false });
  }, [presetTrainerId, loading, trainers, router]);

  const upcoming = bookings.filter(b => b.status === 'pending' || b.status === 'confirmed');
  const history  = bookings.filter(b => b.status === 'completed' || b.status === 'cancelled');
  const displayed = tab === 'upcoming' ? upcoming : history;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const nb = await createBooking({ ...form, notes: form.notes || undefined });
      setBookings(prev => [nb, ...prev]);
      setModalOpen(false);
      setForm({ trainerId: '', sessionDate: '', startTime: '07:00', endTime: '08:00', notes: '' });
      toast.success(tp('bookings.toast.bookSuccess'));
    } catch (e) { toast.error(getApiMessage(e) || tp('bookings.toast.bookError')); }
    finally { setSaving(false); }
  };

  const handleCancel = async (id: string) => {
    setCancelId(id);
    try {
      await cancelBooking(id);
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled', statusLabel: tp('bookings.status.cancelled') } : b));
      toast.success(tp('bookings.toast.cancelSuccess'));
    } catch (e) { toast.error(getApiMessage(e) || tp('bookings.toast.cancelError')); }
    finally { setCancelId(null); }
  };

  const inp = inputClass();

  return (
    <>
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between gap-4">
          <PageHeader title={tp('bookings.title')} subtitle={tp('bookings.subtitle')} />
          <AddButton onClick={() => setModalOpen(true)} label={tp('bookings.addButton')} />
        </div>

        {error !== null && <Alert>{error || tp('bookings.loadError')}</Alert>}

        {/* Tabs */}
        <SegmentedControl size="md" value={tab} onChange={setTab} className="w-fit" options={(['upcoming', 'history'] as const).map(key => ({
          value: key,
          label: <>{tp(`bookings.tabs.${key}`)} {tab === key && <span className="ml-1 text-xs opacity-70">({(key === 'upcoming' ? upcoming : history).length})</span>}</>,
        }))} />

        {/* List */}
        {loading
          ? <SkeletonList count={4} className="grid sm:grid-cols-2 gap-3" itemClassName="h-28 rounded-xl" />
          : displayed.length === 0
          ? <EmptyState icon={<CalendarDays size={40} />} title={tp('bookings.empty')} />
          : <div className="grid sm:grid-cols-2 gap-3">
              {displayed.map(b => <BookingCard key={b.id} b={b} onCancel={() => handleCancel(b.id)} cancelling={cancelId === b.id} />)}
            </div>
        }
      </div>

      {/* Create modal */}
      {modalOpen && (
        <Modal onClose={() => setModalOpen(false)} title={tp('bookings.modal.title')}>
          <form onSubmit={handleCreate} className="p-5 flex flex-col gap-3">
            <FormField label={tp('bookings.modal.trainer')} required>
              <select value={form.trainerId} onChange={e => setForm(f => ({ ...f, trainerId: e.target.value }))} required className={inp}>
                <option value="">{tp('bookings.modal.trainerPlaceholder')}</option>
                {trainers.map(t => <option key={t.id} value={t.id}>{t.name} {t.specializations.length ? `(${t.specializations.slice(0,2).join(', ')})` : ''}</option>)}
              </select>
            </FormField>
            <FormField label={tp('bookings.modal.date')} required>
              <input type="date" value={form.sessionDate} onChange={e => setForm(f => ({ ...f, sessionDate: e.target.value }))} required min={new Date().toISOString().slice(0,10)} className={inp} />
            </FormField>
            <div className="grid grid-cols-2 gap-2">
              <FormField label={tp('bookings.modal.startTime')} required>
                <input type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} required className={inp} />
              </FormField>
              <FormField label={tp('bookings.modal.endTime')} required>
                <input type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} required className={inp} />
              </FormField>
            </div>
            <FormField label={tp('bookings.modal.notes')}>
              <input type="text" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder={tp('bookings.modal.notesPlaceholder')} className={inp} />
            </FormField>
            <ModalFooter onCancel={() => setModalOpen(false)} cancelLabel={tp('bookings.modal.cancel')} submitLabel={saving ? tp('bookings.modal.submitting') : tp('bookings.modal.submit')} loading={saving} />
          </form>
        </Modal>
      )}
    </>
  );
}

// Default export wraps content in Suspense (required for useSearchParams in Next.js App Router)
export default function PortalBookingsPage() {
  return (
    <Suspense fallback={null}>
      <PortalBookingsContent />
    </Suspense>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import { getMyBookings, createBooking, cancelBooking } from '@/src/lib/bookingService';
import { getTrainers } from '@/src/lib/trainerService';
import { toast } from '@/src/utils/toast';
import { X, AlertCircle, CalendarDays, Clock } from 'lucide-react';
import type { Booking, CreateBookingPayload, BookingStatus } from '@/src/types/booking.types';
import type { Trainer } from '@/src/types/trainer.types';
import PageHeader from '@/src/components/ui/PageHeader';
import AddButton from '@/src/components/ui/AddButton';

const STATUS_STYLES: Record<BookingStatus, string> = {
  pending:   'bg-warning-500/10 text-warning-500',
  confirmed: 'bg-success-500/10 text-success-500',
  completed: 'bg-surface-overlay text-text-muted',
  cancelled: 'bg-danger-500/10 text-danger-500',
};
const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận',
  completed: 'Hoàn thành',  cancelled: 'Đã hủy',
};

function BookingCard({ b, onCancel, cancelling }: { b: Booking; onCancel: () => void; cancelling: boolean }) {
  return (
    <div className="bg-surface-base border border-surface-border rounded-xl p-4 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-text-primary">{b.trainerName}</p>
          <p className="text-xs text-text-muted">{b.trainerEmail}</p>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${STATUS_STYLES[b.status]}`}>
          {STATUS_LABELS[b.status]}
        </span>
      </div>
      <div className="flex items-center gap-3 text-xs text-text-secondary">
        <span className="flex items-center gap-1"><CalendarDays size={11} /> {b.sessionDateLabel}</span>
        <span className="flex items-center gap-1"><Clock size={11} /> {b.timeRangeLabel}</span>
      </div>
      {b.notes && <p className="text-xs text-text-muted italic">"{b.notes}"</p>}
      {b.status === 'pending' && (
        <button onClick={onCancel} disabled={cancelling}
          className="mt-1 text-xs text-danger-500 hover:underline cursor-pointer disabled:opacity-50 self-start">
          {cancelling ? 'Đang hủy...' : 'Hủy lịch'}
        </button>
      )}
    </div>
  );
}

export default function PortalBookingsPage() {
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
    } catch (e: any) { setError(e?.response?.data?.message || 'Tải dữ liệu thất bại'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

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
      toast.success('Đặt lịch PT thành công!');
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Đặt lịch thất bại'); }
    finally { setSaving(false); }
  };

  const handleCancel = async (id: string) => {
    setCancelId(id);
    try {
      await cancelBooking(id);
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled', statusLabel: 'Đã hủy' } : b));
      toast.success('Hủy lịch thành công!');
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Hủy thất bại'); }
    finally { setCancelId(null); }
  };

  const inp = `w-full px-3 py-2 rounded-xl border border-surface-border bg-surface-raised text-sm text-text-primary outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all`;

  return (
    <>
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between gap-4">
          <PageHeader title="Đặt lịch PT" subtitle="Quản lý lịch tập cá nhân của bạn" />
          <AddButton onClick={() => setModalOpen(true)} label="Đặt lịch mới" />
        </div>

        {error && <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-danger-500/10 border border-danger-500/20 text-danger-500 text-sm"><AlertCircle size={15} /> {error}</div>}

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-surface-raised rounded-xl border border-surface-border w-fit">
          {([['upcoming','Sắp tới'],['history','Lịch sử']] as const).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer transition-all ${tab === key ? 'bg-primary-500 text-white shadow' : 'text-text-secondary hover:bg-surface-overlay'}`}>
              {label} {tab === key && <span className="ml-1 text-xs opacity-70">({(key === 'upcoming' ? upcoming : history).length})</span>}
            </button>
          ))}
        </div>

        {/* List */}
        {loading
          ? <div className="grid sm:grid-cols-2 gap-3">{[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-surface-overlay rounded-xl animate-pulse" />)}</div>
          : displayed.length === 0
          ? <div className="text-center py-12 text-text-muted text-sm">Không có lịch nào.</div>
          : <div className="grid sm:grid-cols-2 gap-3">
              {displayed.map(b => <BookingCard key={b.id} b={b} onCancel={() => handleCancel(b.id)} cancelling={cancelId === b.id} />)}
            </div>
        }
      </div>

      {/* Create modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-md bg-surface-base border border-surface-border rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
              <h2 className="font-bold text-text-primary">Đặt lịch PT mới</h2>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg text-text-muted hover:bg-surface-overlay cursor-pointer"><X size={15} /></button>
            </div>
            <form onSubmit={handleCreate} className="p-5 flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary">Huấn luyện viên *</label>
                <select value={form.trainerId} onChange={e => setForm(f => ({ ...f, trainerId: e.target.value }))} required className={inp}>
                  <option value="">— Chọn HLV —</option>
                  {trainers.map(t => <option key={t.id} value={t.id}>{t.name} {t.specializations.length ? `(${t.specializations.slice(0,2).join(', ')})` : ''}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary">Ngày *</label>
                <input type="date" value={form.sessionDate} onChange={e => setForm(f => ({ ...f, sessionDate: e.target.value }))} required min={new Date().toISOString().slice(0,10)} className={inp} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-secondary">Giờ bắt đầu *</label>
                  <input type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} required className={inp} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-secondary">Giờ kết thúc *</label>
                  <input type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} required className={inp} />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary">Ghi chú</label>
                <input type="text" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Mục tiêu tập luyện..." className={inp} />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-surface-border text-text-secondary hover:bg-surface-overlay cursor-pointer transition-all">Hủy</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary-500 hover:bg-primary-600 text-white disabled:opacity-50 cursor-pointer transition-all">
                  {saving ? 'Đang đặt...' : 'Xác nhận'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

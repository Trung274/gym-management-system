'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getTrainers, getTrainerById } from '@/src/lib/trainerService';
import { AlertCircle, X } from 'lucide-react';
import type { Trainer } from '@/src/types/trainer.types';

function TrainerCard({ t, onClick }: { t: Trainer; onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-left bg-surface-base border border-surface-border rounded-xl p-4 hover:border-primary-500/50 hover:shadow-md transition-all cursor-pointer w-full flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-primary-500/20 flex items-center justify-center shrink-0">
          <span className="text-lg font-bold text-primary-500">{t.initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-text-primary truncate">{t.name}</p>
          <p className="text-xs text-text-muted">{t.experienceLabel}</p>
        </div>
      </div>
      {t.specializations.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {t.specializations.slice(0, 3).map(s => (
            <span key={s} className="px-2 py-0.5 rounded-full text-xs bg-primary-500/10 text-primary-500 font-medium">{s}</span>
          ))}
        </div>
      )}
      {t.bio && <p className="text-xs text-text-muted line-clamp-2">{t.bio}</p>}
    </button>
  );
}

function TrainerModal({ trainer, onClose, onBook }: { trainer: Trainer; onClose: () => void; onBook: (id: string) => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-surface-base border border-surface-border rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
          <h2 className="font-bold text-text-primary">Thông tin HLV</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-text-muted hover:bg-surface-overlay cursor-pointer"><X size={15} /></button>
        </div>
        <div className="p-5 flex flex-col gap-4">
          {/* Avatar + name */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary-500/20 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary-500">{trainer.initials}</span>
            </div>
            <div>
              <p className="text-lg font-bold text-text-primary">{trainer.name}</p>
              <p className="text-sm text-text-muted">{trainer.experienceLabel}</p>
            </div>
          </div>
          {/* Specializations */}
          {trainer.specializations.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Chuyên môn</p>
              <div className="flex flex-wrap gap-1.5">
                {trainer.specializations.map(s => <span key={s} className="px-2.5 py-1 rounded-full text-xs bg-primary-500/10 text-primary-500 font-medium">{s}</span>)}
              </div>
            </div>
          )}
          {/* Bio */}
          {trainer.bio && (
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Giới thiệu</p>
              <p className="text-sm text-text-secondary leading-relaxed">{trainer.bio}</p>
            </div>
          )}
          {/* Certifications */}
          {trainer.certifications.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Chứng chỉ</p>
              <ul className="flex flex-col gap-1">
                {trainer.certifications.map(c => <li key={c} className="text-sm text-text-secondary flex items-center gap-1.5">🏅 {c}</li>)}
              </ul>
            </div>
          )}
          <button onClick={() => onBook(trainer.id)}
            className="w-full py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold cursor-pointer transition-all mt-2">
            Đặt lịch với HLV này
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PortalTrainersPage() {
  const router = useRouter();
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [selected, setSelected] = useState<Trainer | null>(null);

  useEffect(() => {
    getTrainers()
      .then(setTrainers)
      .catch((e: any) => setError(e?.response?.data?.message || 'Tải dữ liệu thất bại'))
      .finally(() => setLoading(false));
  }, []);

  const handleBook = (trainerId: string) => {
    router.push(`/portal/bookings?trainerId=${trainerId}`);
  };

  return (
    <>
      <div className="flex flex-col gap-5">
        <h1 className="text-xl font-bold text-text-primary">Huấn luyện viên</h1>

        {error && <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-danger-500/10 border border-danger-500/20 text-danger-500 text-sm"><AlertCircle size={15} /> {error}</div>}

        {loading
          ? <div className="grid sm:grid-cols-2 gap-3">{[...Array(6)].map((_, i) => <div key={i} className="h-32 bg-surface-overlay rounded-xl animate-pulse" />)}</div>
          : trainers.length === 0
          ? <p className="text-center py-12 text-text-muted text-sm">Không có HLV nào.</p>
          : <div className="grid sm:grid-cols-2 gap-3">
              {trainers.map(t => <TrainerCard key={t.id} t={t} onClick={() => setSelected(t)} />)}
            </div>
        }
      </div>

      {selected && <TrainerModal trainer={selected} onClose={() => setSelected(null)} onBook={handleBook} />}
    </>
  );
}

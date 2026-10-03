'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getTrainers } from '@/src/lib/trainerService';
import { Award, UserCheck } from 'lucide-react';
import type { Trainer } from '@/src/types/trainer.types';
import PageHeader from '@/src/components/ui/PageHeader';
import { useLanguage } from '@/src/components/providers/LanguageProvider';
import { usePageTitle } from '@/src/hooks/usePageTitle';
import Alert from '@/src/components/ui/Alert';
import { getApiMessage } from '@/src/lib/errors';
import Modal from '@/src/components/ui/Modal';
import { SkeletonList } from '@/src/components/ui/Skeleton';
import EmptyState from '@/src/components/ui/EmptyState';

function useExperienceLabel() {
  const { t } = useLanguage();
  const tp = t('portal');
  return (years: number) =>
    years > 0 ? tp('shared.experienceYears').replace('{{years}}', String(years)) : tp('shared.noExperience');
}

function TrainerCard({ t, onClick }: { t: Trainer; onClick: () => void }) {
  const experienceLabel = useExperienceLabel();
  return (
    <button onClick={onClick} className="text-left bg-surface-base border border-surface-border rounded-xl p-4 hover:border-primary-500/50 hover:shadow-md transition-all cursor-pointer w-full flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-primary-500/20 flex items-center justify-center shrink-0">
          <span className="text-lg font-bold text-primary-500">{t.initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-text-primary truncate">{t.name}</p>
          <p className="text-xs text-text-muted">{experienceLabel(t.experienceYears)}</p>
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
  const { t } = useLanguage();
  const tp = t('portal');
  const experienceLabel = useExperienceLabel();
  return (
    <Modal onClose={onClose} title={tp('trainers.modal.title')} scrollable>
      <div className="p-5 flex flex-col gap-4">
        {/* Avatar + name */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary-500/20 flex items-center justify-center">
            <span className="text-2xl font-bold text-primary-500">{trainer.initials}</span>
          </div>
          <div>
            <p className="text-lg font-bold text-text-primary">{trainer.name}</p>
            <p className="text-sm text-text-muted">{experienceLabel(trainer.experienceYears)}</p>
          </div>
        </div>
        {/* Specializations */}
        {trainer.specializations.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">{tp('trainers.modal.specializations')}</p>
            <div className="flex flex-wrap gap-1.5">
              {trainer.specializations.map(s => <span key={s} className="px-2.5 py-1 rounded-full text-xs bg-primary-500/10 text-primary-500 font-medium">{s}</span>)}
            </div>
          </div>
        )}
        {/* Bio */}
        {trainer.bio && (
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">{tp('trainers.modal.bio')}</p>
            <p className="text-sm text-text-secondary leading-relaxed">{trainer.bio}</p>
          </div>
        )}
        {/* Certifications */}
        {trainer.certifications.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">{tp('trainers.modal.certifications')}</p>
            <ul className="flex flex-col gap-1">
              {trainer.certifications.map(c => <li key={c} className="text-sm text-text-secondary flex items-center gap-1.5"><Award size={14} className="text-primary-500 shrink-0" /> {c}</li>)}
            </ul>
          </div>
        )}
        <button onClick={() => onBook(trainer.id)}
          className="w-full py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold cursor-pointer transition-all mt-2">
          {tp('trainers.modal.bookButton')}
        </button>
      </div>
    </Modal>
  );
}

export default function PortalTrainersPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const tp = t('portal');
  usePageTitle('portal', 'trainers.title');

  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [selected, setSelected] = useState<Trainer | null>(null);

  useEffect(() => {
    getTrainers()
      .then(setTrainers)
      .catch((e) => setError(getApiMessage(e) ?? ''))
      .finally(() => setLoading(false));
  }, []);

  const handleBook = (trainerId: string) => {
    router.push(`/portal/bookings?trainerId=${trainerId}`);
  };

  return (
    <>
      <div className="flex flex-col gap-5">
        <PageHeader title={tp('trainers.title')} subtitle={tp('trainers.subtitle')} />

        {error !== null && <Alert>{error || tp('trainers.loadError')}</Alert>}

        {loading
          ? <SkeletonList count={6} className="grid sm:grid-cols-2 gap-3" itemClassName="h-32 rounded-xl" />
          : trainers.length === 0
          ? <EmptyState icon={<UserCheck size={40} />} title={tp('trainers.empty')} />
          : <div className="grid sm:grid-cols-2 gap-3">
              {trainers.map(t => <TrainerCard key={t.id} t={t} onClick={() => setSelected(t)} />)}
            </div>
        }
      </div>

      {selected && <TrainerModal trainer={selected} onClose={() => setSelected(null)} onBook={handleBook} />}
    </>
  );
}

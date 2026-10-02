'use client';

import { useEffect, useState } from 'react';
import { getClasses } from '@/src/lib/classService';
import { Users2 } from 'lucide-react';
import type { GymClass, ClassCategory } from '@/src/types/class.types';
import PageHeader from '@/src/components/ui/PageHeader';
import { useLanguage } from '@/src/components/providers/LanguageProvider';
import { usePageTitle } from '@/src/hooks/usePageTitle';
import Alert from '@/src/components/ui/Alert';
import { getApiMessage } from '@/src/lib/errors';
import SegmentedControl from '@/src/components/ui/SegmentedControl';
import { SkeletonList } from '@/src/components/ui/Skeleton';
import EmptyState from '@/src/components/ui/EmptyState';

const CATEGORY_ICONS: Record<ClassCategory, string> = {
  yoga: '🧘', zumba: '💃', cycling: '🚴', hiit: '⚡',
  pilates: '🤸', boxing: '🥊', other: '🏋️',
};

const CATEGORIES = Object.keys(CATEGORY_ICONS) as ClassCategory[];
const DAYS = [0, 1, 2, 3, 4, 5, 6];

const TODAY_DOW = new Date().getDay(); // 0=Sun

export default function PortalClassesPage() {
  const { t } = useLanguage();
  const tp = t('portal');
  usePageTitle('portal', 'classes.title');

  const [classes,  setClasses]  = useState<GymClass[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [category, setCategory] = useState<ClassCategory | 'all'>('all');
  const [dow,      setDow]      = useState<number | 'all'>('all');

  useEffect(() => {
    getClasses({ all: false })
      .then(setClasses)
      .catch((e) => setError(getApiMessage(e) ?? ''))
      .finally(() => setLoading(false));
  }, []);

  const filtered = classes.filter(c => {
    const catOk = category === 'all' || c.category === category;
    const dowOk = dow === 'all' || c.schedule.some(s => s.dayOfWeek === dow);
    return catOk && dowOk;
  });

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title={tp('classes.title')} subtitle={tp('classes.subtitle')} />

      {error !== null && <Alert>{error || tp('classes.loadError')}</Alert>}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {/* Day filter */}
        <SegmentedControl<number | 'all'> value={dow} onChange={setDow} options={[
          { value: 'all', label: tp('classes.filters.allDays') },
          ...DAYS.map(i => ({ value: i, label: tp(`shared.daysShort.${i}`), highlight: i === TODAY_DOW })),
        ]} />
        {/* Category filter */}
        <SegmentedControl<ClassCategory | 'all'> value={category} onChange={setCategory} options={[
          { value: 'all', label: tp('classes.filters.allCategories') },
          ...CATEGORIES.map(v => ({ value: v, label: <>{CATEGORY_ICONS[v]} {tp(`shared.categories.${v}`)}</> })),
        ]} />
      </div>

      {/* Class list */}
      {loading
        ? <SkeletonList count={6} className="grid sm:grid-cols-2 gap-3" itemClassName="h-28 rounded-xl" />
        : filtered.length === 0
        ? <EmptyState icon={<Users2 size={40} />} title={tp('classes.empty')} />
        : <div className="grid sm:grid-cols-2 gap-3">
            {filtered.map(c => (
              <div key={c.id} className="bg-surface-base border border-surface-border rounded-xl p-4 flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{CATEGORY_ICONS[c.category]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-text-primary truncate">{c.name}</p>
                    <p className="text-xs text-text-muted">{tp(`shared.categories.${c.category}`)}</p>
                  </div>
                  {c.capacity && <span className="text-xs text-text-muted shrink-0">👤 {c.capacity}</span>}
                </div>
                {c.schedule.length > 0 && (
                  <p className="text-xs text-primary-500 font-medium">
                    {c.schedule.map(s => tp(`shared.daysShort.${s.dayOfWeek}`)).join(', ')} · {c.schedule[0].startTime} – {c.schedule[0].endTime}
                  </p>
                )}
                <div className="flex items-center justify-between text-xs text-text-muted">
                  <span>{c.trainerName !== '—' ? `${tp('classes.trainerPrefix')} ${c.trainerName}` : ''}</span>
                  <span>{c.location ?? ''}</span>
                </div>
              </div>
            ))}
          </div>
      }
    </div>
  );
}

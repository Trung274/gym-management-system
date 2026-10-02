'use client';

import { useEffect, useState, useCallback } from 'react';
import { getClasses } from '@/src/lib/classService';
import { Users2 } from 'lucide-react';
import type { GymClass, ClassCategory } from '@/src/types/class.types';
import PageHeader from '@/src/components/ui/PageHeader';
import { useLanguage } from '@/src/components/providers/LanguageProvider';
import { usePageTitle } from '@/src/hooks/usePageTitle';
import Alert from '@/src/components/ui/Alert';
import { getApiMessage } from '@/src/lib/errors';

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
        <div className="flex gap-1 p-1 bg-surface-raised rounded-xl border border-surface-border overflow-x-auto flex-wrap">
          <button onClick={() => setDow('all')} className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${dow === 'all' ? 'bg-primary-500 text-white shadow' : 'text-text-secondary hover:bg-surface-overlay'}`}>
            {tp('classes.filters.allDays')}
          </button>
          {DAYS.map(i => (
            <button key={i} onClick={() => setDow(i)} className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${dow === i ? 'bg-primary-500 text-white shadow' : 'text-text-secondary hover:bg-surface-overlay'} ${i === TODAY_DOW ? 'ring-1 ring-primary-500/40' : ''}`}>
              {tp(`shared.daysShort.${i}`)}
            </button>
          ))}
        </div>
        {/* Category filter */}
        <div className="flex gap-1 p-1 bg-surface-raised rounded-xl border border-surface-border flex-wrap">
          <button onClick={() => setCategory('all')} className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${category === 'all' ? 'bg-primary-500 text-white shadow' : 'text-text-secondary hover:bg-surface-overlay'}`}>{tp('classes.filters.allCategories')}</button>
          {CATEGORIES.map(v => (
            <button key={v} onClick={() => setCategory(v)} className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${category === v ? 'bg-primary-500 text-white shadow' : 'text-text-secondary hover:bg-surface-overlay'}`}>
              {CATEGORY_ICONS[v]} {tp(`shared.categories.${v}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Class list */}
      {loading
        ? <div className="grid sm:grid-cols-2 gap-3">{[...Array(6)].map((_, i) => <div key={i} className="h-28 bg-surface-overlay rounded-xl animate-pulse" />)}</div>
        : filtered.length === 0
        ? <div className="text-center py-12 text-text-muted text-sm flex flex-col items-center gap-2"><Users2 size={36} className="opacity-30" /> {tp('classes.empty')}</div>
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

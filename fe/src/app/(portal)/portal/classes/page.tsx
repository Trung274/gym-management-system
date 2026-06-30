'use client';

import { useEffect, useState, useCallback } from 'react';
import { getClasses } from '@/src/lib/classService';
import { CATEGORY_LABELS, DAY_LABELS } from '@/src/lib/classHelpers';
import { AlertCircle, Users2 } from 'lucide-react';
import type { GymClass, ClassCategory } from '@/src/types/class.types';

const CATEGORY_ICONS: Record<ClassCategory, string> = {
  yoga: '🧘', zumba: '💃', cycling: '🚴', hiit: '⚡',
  pilates: '🤸', boxing: '🥊', other: '🏋️',
};

const TODAY_DOW = new Date().getDay(); // 0=Sun

export default function PortalClassesPage() {
  const [classes,  setClasses]  = useState<GymClass[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [category, setCategory] = useState<ClassCategory | 'all'>('all');
  const [dow,      setDow]      = useState<number | 'all'>('all');

  useEffect(() => {
    getClasses({ all: false })
      .then(setClasses)
      .catch((e: any) => setError(e?.response?.data?.message || 'Tải dữ liệu thất bại'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = classes.filter(c => {
    const catOk = category === 'all' || c.category === category;
    const dowOk = dow === 'all' || c.schedule.some(s => s.dayOfWeek === dow);
    return catOk && dowOk;
  });

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-bold text-text-primary">Lịch lớp học nhóm</h1>

      {error && <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-danger-500/10 border border-danger-500/20 text-danger-500 text-sm"><AlertCircle size={15} /> {error}</div>}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {/* Day filter */}
        <div className="flex gap-1 p-1 bg-surface-raised rounded-xl border border-surface-border overflow-x-auto flex-wrap">
          <button onClick={() => setDow('all')} className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${dow === 'all' ? 'bg-primary-500 text-white shadow' : 'text-text-secondary hover:bg-surface-overlay'}`}>
            Tất cả
          </button>
          {DAY_LABELS.map((d, i) => (
            <button key={i} onClick={() => setDow(i)} className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${dow === i ? 'bg-primary-500 text-white shadow' : 'text-text-secondary hover:bg-surface-overlay'} ${i === TODAY_DOW ? 'ring-1 ring-primary-500/40' : ''}`}>
              {d}
            </button>
          ))}
        </div>
        {/* Category filter */}
        <div className="flex gap-1 p-1 bg-surface-raised rounded-xl border border-surface-border flex-wrap">
          <button onClick={() => setCategory('all')} className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${category === 'all' ? 'bg-primary-500 text-white shadow' : 'text-text-secondary hover:bg-surface-overlay'}`}>Tất cả</button>
          {(Object.entries(CATEGORY_LABELS) as [ClassCategory, string][]).map(([v, l]) => (
            <button key={v} onClick={() => setCategory(v)} className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${category === v ? 'bg-primary-500 text-white shadow' : 'text-text-secondary hover:bg-surface-overlay'}`}>
              {CATEGORY_ICONS[v]} {l}
            </button>
          ))}
        </div>
      </div>

      {/* Class list */}
      {loading
        ? <div className="grid sm:grid-cols-2 gap-3">{[...Array(6)].map((_, i) => <div key={i} className="h-28 bg-surface-overlay rounded-xl animate-pulse" />)}</div>
        : filtered.length === 0
        ? <div className="text-center py-12 text-text-muted text-sm flex flex-col items-center gap-2"><Users2 size={36} className="opacity-30" /> Không có lớp học nào phù hợp.</div>
        : <div className="grid sm:grid-cols-2 gap-3">
            {filtered.map(c => (
              <div key={c.id} className="bg-surface-base border border-surface-border rounded-xl p-4 flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{CATEGORY_ICONS[c.category]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-text-primary truncate">{c.name}</p>
                    <p className="text-xs text-text-muted">{c.categoryLabel}</p>
                  </div>
                  {c.capacity && <span className="text-xs text-text-muted shrink-0">👤 {c.capacity}</span>}
                </div>
                <p className="text-xs text-primary-500 font-medium">{c.scheduleLabel}</p>
                <div className="flex items-center justify-between text-xs text-text-muted">
                  <span>{c.trainerName !== '—' ? `HLV: ${c.trainerName}` : ''}</span>
                  <span>{c.location ?? ''}</span>
                </div>
              </div>
            ))}
          </div>
      }
    </div>
  );
}

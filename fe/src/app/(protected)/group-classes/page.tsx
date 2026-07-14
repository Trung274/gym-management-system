'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, X, ChevronDown, AlertCircle, Search, Loader2 } from 'lucide-react';
import { useClassStore } from '@/src/stores/classStore';
import StatsGrid from '@/src/components/ui/StatsGrid';
import AddButton from '@/src/components/ui/AddButton';
import { toast } from '@/src/utils/toast';
import { getTrainers } from '@/src/lib/trainerService';
import PageHeader from '@/src/components/ui/PageHeader';
import type { Trainer } from '@/src/types/trainer.types';
import type {
  GymClass, ClassStatus, ClassCategory,
  CreateClassPayload, UpdateClassPayload, ScheduleItem,
} from '@/src/types/class.types';
import { useLanguage } from '@/src/components/providers/LanguageProvider';
import { usePageTitle } from '@/src/hooks/usePageTitle';

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<ClassStatus, string> = {
  active:    'bg-success-500/15 text-success-500',
  cancelled: 'bg-danger-500/15 text-danger-500',
  completed: 'bg-surface-overlay text-text-muted',
};

const CATEGORY_ICONS: Record<ClassCategory, string> = {
  yoga: '🧘', zumba: '💃', cycling: '🚴', hiit: '⚡',
  pilates: '🤸', boxing: '🥊', other: '🏋️',
};

const EMPTY_FORM: CreateClassPayload = {
  name: '', category: 'yoga', description: '', trainer: '',
  location: '', capacity: undefined, schedule: [{ dayOfWeek: 1, startTime: '06:00', endTime: '07:00' }],
  startDate: '', endDate: '', notes: '',
};

// ─── Format Helpers ───────────────────────────────────────────────────────────
const formatScheduleLabel = (schedule: ScheduleItem[], tc: any) => {
  if (!schedule?.length) return '—';
  const days = schedule
    .map((s) => tc(`daysShort.${s.dayOfWeek}`))
    .join(', ');
  const { startTime, endTime } = schedule[0];
  return `${days} · ${startTime} – ${endTime}`;
};

const formatDateLang = (dateStr: string | undefined, lang: string) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
};

// ─── Status Badge + Dropdown ──────────────────────────────────────────────────
function StatusBadge({ gymClass, onChange, disabled }: {
  gymClass: GymClass; onChange: (s: ClassStatus) => void; disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();
  const tCommon = t('common');

  const statusLabels: Record<ClassStatus, string> = {
    active: tCommon('status.active'),
    cancelled: tCommon('status.cancelled'),
    completed: tCommon('status.completed'),
  };

  return (
    <div className="relative">
      <button onClick={() => !disabled && setOpen(o => !o)} disabled={disabled}
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all ${STATUS_STYLES[gymClass.status]} ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-75'}`}>
        {statusLabels[gymClass.status]}
        {!disabled && <ChevronDown size={10} />}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-20 bg-surface-base border border-surface-border rounded-xl shadow-xl py-1 w-40">
            {(['active', 'cancelled', 'completed'] as ClassStatus[]).map((s) => (
              <button key={s} onClick={() => { onChange(s); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-xs font-semibold hover:bg-surface-raised transition-all cursor-pointer ${gymClass.status === s ? 'text-primary-500' : 'text-text-secondary'}`}>
                {statusLabels[s]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Schedule Editor ──────────────────────────────────────────────────────────
function ScheduleEditor({ value, onChange }: {
  value: ScheduleItem[]; onChange: (v: ScheduleItem[]) => void;
}) {
  const { t } = useLanguage();
  const tc = t('group-classes');

  const DAYS_LIST = [
    tc('days.sunday'),
    tc('days.monday'),
    tc('days.tuesday'),
    tc('days.wednesday'),
    tc('days.thursday'),
    tc('days.friday'),
    tc('days.saturday'),
  ];

  const add = () => onChange([...value, { dayOfWeek: 1, startTime: '06:00', endTime: '07:00' }]);
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  const update = (i: number, patch: Partial<ScheduleItem>) =>
    onChange(value.map((item, idx) => idx === i ? { ...item, ...patch } : item));

  return (
    <div className="flex flex-col gap-2">
      {value.map((item, i) => (
        <div key={i} className="flex items-center gap-2 p-2 bg-surface-raised rounded-xl border border-surface-border">
          <select value={item.dayOfWeek} onChange={(e) => update(i, { dayOfWeek: +e.target.value })}
            className="px-2 py-1.5 rounded-lg border border-surface-border bg-surface-base text-xs text-text-primary outline-none focus:border-primary-500">
            {DAYS_LIST.map((d, idx) => <option key={idx} value={idx}>{d}</option>)}
          </select>
          <input type="time" value={item.startTime} onChange={(e) => update(i, { startTime: e.target.value })}
            className="px-2 py-1.5 rounded-lg border border-surface-border bg-surface-base text-xs text-text-primary outline-none focus:border-primary-500" />
          <span className="text-text-muted text-xs">–</span>
          <input type="time" value={item.endTime} onChange={(e) => update(i, { endTime: e.target.value })}
            className="px-2 py-1.5 rounded-lg border border-surface-border bg-surface-base text-xs text-text-primary outline-none focus:border-primary-500" />
          {value.length > 1 && (
            <button onClick={() => remove(i)} className="p-1 rounded-lg text-text-muted hover:text-danger-500 hover:bg-danger-500/10 cursor-pointer transition-all">
              <X size={14} />
            </button>
          )}
        </div>
      ))}
      <button onClick={add} className="flex items-center gap-1.5 text-xs text-primary-500 hover:opacity-75 cursor-pointer transition-all">
        <Plus size={13} /> {tc('modal.addScheduleItem')}
      </button>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function ClassModal({ open, editing, onClose, onSave, isLoading }: {
  open: boolean; editing: GymClass | null; onClose: () => void;
  onSave: (p: CreateClassPayload | UpdateClassPayload, id?: string) => Promise<void>;
  isLoading: boolean;
}) {
  const [form, setForm] = useState<any>({ ...EMPTY_FORM });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [allTrainers, setAllTrainers] = useState<Trainer[]>([]);
  const [loadingTrainers, setLoadingTrainers] = useState(false);

  const { t } = useLanguage();
  const tc = t('group-classes');
  const tCommon = t('common');

  useEffect(() => {
    if (open) {
      setLoadingTrainers(true);
      getTrainers({ status: 'active' })
        .then(res => {
          setAllTrainers(res);
        })
        .catch(err => {
          console.error('Error loading trainers:', err);
        })
        .finally(() => {
          setLoadingTrainers(false);
        });
    } else {
      setSearchTerm('');
      setShowDropdown(false);
      setSelectedTrainer(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({
        name: editing.name, category: editing.category,
        description: editing.description ?? '',
        trainer: editing.trainer?._id ?? '',
        location: editing.location ?? '', capacity: editing.capacity ?? '',
        schedule: editing.schedule.length ? editing.schedule : EMPTY_FORM.schedule,
        startDate: editing.startDate ? editing.startDate.substring(0, 10) : '',
        endDate: editing.endDate ? editing.endDate.substring(0, 10) : '',
        notes: editing.notes ?? '',
      });
      if (editing.trainer) {
        setSelectedTrainer({
          id: editing.trainer._id,
          name: editing.trainer.user?.name ?? 'Huấn luyện viên',
          loginEmail: editing.trainer.user?.email ?? '',
          specializations: editing.trainer.specializations ?? [],
          experienceYears: editing.trainer.experienceYears ?? 0,
        } as any);
      } else {
        setSelectedTrainer(null);
      }
    } else {
      setForm({ ...EMPTY_FORM });
      setSelectedTrainer(null);
    }
    setErrors({});
  }, [open, editing]);

  const filteredTrainers = allTrainers.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.loginEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name?.trim()) e.name = tc('validation.nameRequired');
    if (!form.schedule?.length) e.schedule = tc('validation.scheduleRequired');
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const payload: any = {
      name: form.name.trim(), category: form.category,
      description: form.description || undefined,
      trainer: form.trainer || undefined,
      location: form.location || undefined,
      capacity: form.capacity ? +form.capacity : undefined,
      schedule: form.schedule,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      notes: form.notes || undefined,
    };
    await onSave(payload, editing?.id);
  };

  if (!open) return null;

  const inp = (field: string) =>
    `w-full px-3 py-2 rounded-xl border text-sm text-text-primary bg-surface-raised placeholder-text-muted outline-none transition-all
    ${errors[field] ? 'border-danger-500 focus:ring-2 focus:ring-danger-500/30' : 'border-surface-border focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-surface-base rounded-2xl shadow-2xl border border-surface-border max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border shrink-0">
          <h2 className="text-base font-bold text-text-primary">
            {editing ? tc('modal.editTitle') : tc('modal.createTitle')}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-overlay cursor-pointer transition-all">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-secondary">{tc('modal.name')} <span className="text-danger-500">*</span></label>
              <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="VD: Yoga Buổi Sáng" className={inp('name')} />
              {errors.name && <p className="text-xs text-danger-500">{errors.name}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-secondary">{tc('modal.category')} <span className="text-danger-500">*</span></label>
              <select value={form.category} onChange={(e) => set('category', e.target.value)} className={inp('category')}>
                {(Object.keys(CATEGORY_ICONS) as ClassCategory[]).map((v) => (
                  <option key={v} value={v}>{CATEGORY_ICONS[v]} {tc(`categories.${v}`)}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-secondary">{tc('modal.location')}</label>
              <input type="text" value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="Phòng Yoga, Tầng 2..." className={inp('location')} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-secondary">{tc('modal.capacity')}</label>
              <input type="number" min="1" value={form.capacity} onChange={(e) => set('capacity', e.target.value)} placeholder="20" className={inp('capacity')} />
            </div>
            <div className="flex flex-col gap-1.5 relative">
              <label className="text-xs font-semibold text-text-secondary">{tc('modal.trainer')}</label>
              {selectedTrainer ? (
                <div className="flex items-center justify-between p-2 px-3 rounded-xl border border-primary-500/30 bg-primary-500/5">
                  <div className="flex flex-col">
                    <p className="text-sm font-semibold text-text-primary">{selectedTrainer.name}</p>
                    <p className="text-xs text-text-muted">{selectedTrainer.loginEmail}</p>
                  </div>
                  <button type="button" onClick={() => { setSelectedTrainer(null); set('trainer', ''); }}
                    className="text-xs text-danger-500 hover:underline hover:text-danger-600 font-semibold cursor-pointer">
                    {tc('modal.trainerChange')}
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                  <input type="text" value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setShowDropdown(true); }}
                    onFocus={() => setShowDropdown(true)}
                    placeholder={tc('modal.trainerSearchPlaceholder')} className={`${inp('trainer')} pl-9`} />
                  {loadingTrainers && (
                    <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted animate-spin" />
                  )}

                  {showDropdown && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
                      <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto z-20 bg-surface-base border border-surface-border rounded-xl shadow-xl py-1">
                        {loadingTrainers ? (
                          <div className="px-4 py-3 text-xs text-text-muted flex items-center gap-2">
                            <Loader2 size={12} className="animate-spin text-primary-500" />
                            {tc('modal.trainerLoading')}
                          </div>
                        ) : filteredTrainers.length === 0 ? (
                          <div className="px-4 py-3 text-xs text-text-muted">
                            {tc('modal.trainerNotFound')}
                          </div>
                        ) : (
                          filteredTrainers.map((t) => (
                            <div key={t.id} onClick={() => {
                              setSelectedTrainer(t);
                              set('trainer', t.id);
                              setSearchTerm('');
                              setShowDropdown(false);
                            }}
                              className="px-4 py-2 hover:bg-surface-raised cursor-pointer transition-colors flex flex-col">
                              <span className="text-sm font-semibold text-text-primary">{t.name}</span>
                              <span className="text-xs text-text-muted">{t.loginEmail}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-secondary">{tc('modal.startDate')}</label>
              <input type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} className={inp('startDate')} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-secondary">{tc('modal.endDate')}</label>
              <input type="date" value={form.endDate} onChange={(e) => set('endDate', e.target.value)} className={inp('endDate')} />
            </div>
            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-secondary">{tc('modal.description')}</label>
              <textarea rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Mô tả ngắn về lớp học..." className={`${inp('description')} resize-none`} />
            </div>
            <div className="sm:col-span-2 flex flex-col gap-2">
              <label className="text-xs font-semibold text-text-secondary">{tc('modal.schedule')} <span className="text-danger-500">*</span></label>
              <ScheduleEditor value={form.schedule} onChange={(v) => set('schedule', v)} />
              {errors.schedule && <p className="text-xs text-danger-500">{errors.schedule}</p>}
            </div>
          </div>
          <div className="flex gap-3 pt-2 sticky bottom-0 bg-surface-base border-t border-surface-border -mx-6 px-6 py-4 -mb-6">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-text-secondary border border-surface-border hover:bg-surface-overlay cursor-pointer transition-all">
              {tCommon('actions.cancel')}
            </button>
            <button type="submit" disabled={isLoading}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-primary-500 hover:bg-primary-600 disabled:opacity-50 cursor-pointer transition-all flex items-center justify-center gap-2">
              {isLoading && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
              {editing ? tc('modal.save') : tc('modal.add')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function GroupClassesPage() {
  const { classes, isLoading, error, fetchClasses, createClass, updateClass, changeStatus, clearError } = useClassStore();

  const [filterCategory, setFilterCategory] = useState<ClassCategory | 'all'>('all');
  const [filterStatus, setFilterStatus]     = useState<ClassStatus | 'all'>('all');
  const [searchQ, setSearchQ]               = useState('');
  const [modalOpen, setModalOpen]           = useState(false);
  const [editing, setEditing]               = useState<GymClass | null>(null);
  const [actingId, setActingId]             = useState<string | null>(null);
  const [saving, setSaving]                 = useState(false);

  const { t, lang } = useLanguage();
  const tc = t('group-classes');
  const tCommon = t('common');

  usePageTitle('group-classes');

  useEffect(() => { fetchClasses({ all: true }).catch(() => {}); }, [fetchClasses]);
  useEffect(() => () => clearError(), [clearError]);

  const filtered = classes.filter((c) => {
    const catOk    = filterCategory === 'all' || c.category === filterCategory;
    const statusOk = filterStatus   === 'all' || c.status   === filterStatus;
    const searchOk = !searchQ ||
      c.name.toLowerCase().includes(searchQ.toLowerCase()) ||
      (c.trainer?.user?.name ?? '').toLowerCase().includes(searchQ.toLowerCase()) ||
      (c.location ?? '').toLowerCase().includes(searchQ.toLowerCase());
    return catOk && statusOk && searchOk;
  });

  const stats = {
    total:     classes.length,
    active:    classes.filter(c => c.status === 'active').length,
    cancelled: classes.filter(c => c.status === 'cancelled').length,
    completed: classes.filter(c => c.status === 'completed').length,
  };

  const handleSave = useCallback(async (payload: any, id?: string) => {
    setSaving(true);
    try {
      if (id) {
        await updateClass(id, payload);
        toast.success(tc('toast.editSuccess'));
      } else {
        await createClass(payload);
        toast.success(tc('toast.addSuccess'));
      }
      setModalOpen(false); setEditing(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || tc('toast.error'));
    } finally { setSaving(false); }
  }, [createClass, updateClass, tc]);

  const handleStatusChange = useCallback(async (id: string, status: ClassStatus) => {
    setActingId(id);
    try {
      await changeStatus(id, { status });
      toast.success(tc('toast.statusSuccess'));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || tc('toast.statusError'));
    } finally { setActingId(null); }
  }, [changeStatus, tc]);

  return (
    <>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <PageHeader
            title={tc('title')}
            subtitle={tc('subtitle')}
          />
          <AddButton onClick={() => { setEditing(null); setModalOpen(true); }} label={tc('addClass')} />
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-danger-500/10 border border-danger-500/20 text-danger-500 text-sm">
            <AlertCircle size={16} className="shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={clearError} className="hover:opacity-70 cursor-pointer"><X size={14} /></button>
          </div>
        )}

        {/* Stats */}
        <StatsGrid
          isLoading={isLoading}
          items={[
            { label: tc('stats.total'), value: stats.total, color: 'primary' },
            { label: tc('stats.active'), value: stats.active, color: 'success' },
            { label: tc('stats.cancelled'), value: stats.cancelled, color: 'danger' },
            { label: tc('stats.completed'), value: stats.completed, color: 'secondary' },
          ]}
        />

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
            <input type="text" value={searchQ} onChange={(e) => setSearchQ(e.target.value)} placeholder={tc('filters.searchPlaceholder')}
              className="pl-9 pr-4 py-2 rounded-xl border border-surface-border bg-surface-raised text-sm text-text-primary placeholder-text-muted outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all w-52" />
          </div>
          {/* Category pills */}
          <div className="flex gap-1 p-1 bg-surface-raised rounded-xl border border-surface-border flex-wrap">
            <button onClick={() => setFilterCategory('all')} className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${filterCategory === 'all' ? 'bg-primary-500 text-white shadow' : 'text-text-secondary hover:bg-surface-overlay'}`}>
              {tCommon('filters.all')}
            </button>
            {(Object.keys(CATEGORY_ICONS) as ClassCategory[]).map((v) => (
              <button key={v} onClick={() => setFilterCategory(v)} className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${filterCategory === v ? 'bg-primary-500 text-white shadow' : 'text-text-secondary hover:bg-surface-overlay'}`}>
                {CATEGORY_ICONS[v]} {tc(`categories.${v}`)}
              </button>
            ))}
          </div>
          {/* Status pills */}
          <div className="flex gap-1 p-1 bg-surface-raised rounded-xl border border-surface-border">
            <button onClick={() => setFilterStatus('all')} className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${filterStatus === 'all' ? 'bg-primary-500 text-white shadow' : 'text-text-secondary hover:bg-surface-overlay'}`}>
              {tCommon('filters.all')}
            </button>
            <button onClick={() => setFilterStatus('active')} className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${filterStatus === 'active' ? 'bg-primary-500 text-white shadow' : 'text-text-secondary hover:bg-surface-overlay'}`}>
              {tCommon('status.active')}
            </button>
            <button onClick={() => setFilterStatus('cancelled')} className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${filterStatus === 'cancelled' ? 'bg-primary-500 text-white shadow' : 'text-text-secondary hover:bg-surface-overlay'}`}>
              {tCommon('status.cancelled')}
            </button>
            <button onClick={() => setFilterStatus('completed')} className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${filterStatus === 'completed' ? 'bg-primary-500 text-white shadow' : 'text-text-secondary hover:bg-surface-overlay'}`}>
              {tCommon('status.completed')}
            </button>
          </div>
          <span className="ml-auto text-xs text-text-muted">
            {tc('filters.count').replace('{{count}}', String(filtered.length))}
          </span>
        </div>

        {/* Table */}
        <div className="bg-surface-base border border-surface-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-border bg-surface-raised">
                  {[
                    tc('table.class'),
                    tc('table.schedule'),
                    tc('table.trainerLocation'),
                    tc('table.capacity'),
                    tc('table.status'),
                    tc('table.actions'),
                  ].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading && !classes.length
                  ? [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b border-surface-border animate-pulse">
                      <td className="px-4 py-3"><div className="flex gap-3 items-center"><div className="w-8 h-8 rounded bg-surface-overlay"/><div className="h-4 w-32 bg-surface-overlay rounded"/></div></td>
                      {[...Array(5)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-surface-overlay rounded w-3/4"/></td>)}
                    </tr>
                  ))
                  : filtered.length === 0
                  ? <tr><td colSpan={6} className="px-4 py-16 text-center"><p className="text-4xl mb-3">📅</p><p className="text-sm font-semibold text-text-primary">{tc('empty.title')}</p><p className="text-xs text-text-muted mt-1">{tc('empty.description')}</p></td></tr>
                  : filtered.map((c) => (
                    <tr key={c.id} className="border-b border-surface-border hover:bg-surface-raised transition-colors group">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{CATEGORY_ICONS[c.category]}</span>
                          <div>
                            <p className="text-sm font-semibold text-text-primary">{c.name}</p>
                            <p className="text-xs text-text-muted">{tc(`categories.${c.category}`)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-text-primary font-medium">{formatScheduleLabel(c.schedule, tc)}</p>
                        <p className="text-xs text-text-muted mt-0.5">{formatDateLang(c.startDate, lang)} → {formatDateLang(c.endDate, lang)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-text-primary">{c.trainer?.user?.name ?? tc('categories.emptyTrainer')}</p>
                        <p className="text-xs text-text-muted">{c.location ?? '—'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold text-text-primary">{c.capacity ?? '—'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge gymClass={c} onChange={(s) => handleStatusChange(c.id, s)} disabled={actingId === c.id} />
                      </td>
                      <td className="px-4 py-3">
                        {actingId === c.id
                          ? <svg className="w-4 h-4 animate-spin text-primary-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                          : <button onClick={() => { setEditing(c); setModalOpen(true); }} title={tCommon('actions.edit')}
                              className="p-1.5 rounded-lg text-text-muted hover:text-primary-500 hover:bg-primary-500/10 cursor-pointer transition-all">
                              <Pencil size={15} />
                            </button>
                        }
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ClassModal open={modalOpen} editing={editing}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSave={handleSave} isLoading={saving}
      />
    </>
  );
}

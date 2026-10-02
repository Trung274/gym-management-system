'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, X, Search, Loader2 } from 'lucide-react';
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
import Alert from '@/src/components/ui/Alert';
import { getApiMessage } from '@/src/lib/errors';
import Modal, { ModalFooter } from '@/src/components/ui/Modal';
import FormField, { inputClass } from '@/src/components/ui/FormField';
import Spinner from '@/src/components/ui/Spinner';
import StatusSelect from '@/src/components/ui/StatusSelect';
import { CLASS_STATUS_TONE } from '@/src/lib/statusTones';
import SegmentedControl from '@/src/components/ui/SegmentedControl';
import { TableSkeleton } from '@/src/components/ui/Skeleton';
import EmptyState from '@/src/components/ui/EmptyState';

// ─── Constants ────────────────────────────────────────────────────────────────
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
  const { t } = useLanguage();
  const tCommon = t('common');
  const options = (Object.keys(CLASS_STATUS_TONE) as ClassStatus[]).map((s) => ({ value: s, label: tCommon(`status.${s}`) }));

  return (
    <StatusSelect value={gymClass.status} tone={CLASS_STATUS_TONE[gymClass.status]}
      options={options} onChange={onChange} disabled={disabled} />
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

  const inp = (field: string) => inputClass(!!errors[field]);

  return (
    <Modal onClose={onClose} title={editing ? tc('modal.editTitle') : tc('modal.createTitle')} size="lg" scrollable>
      <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 flex flex-col gap-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2 flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary">{tc('modal.name')} <span className="text-danger-500">*</span></label>
            <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="VD: Yoga Buổi Sáng" className={inp('name')} />
            {errors.name && <p className="text-xs text-danger-500">{errors.name}</p>}
          </div>
          <FormField label={tc('modal.category')} required>
            <select value={form.category} onChange={(e) => set('category', e.target.value)} className={inp('category')}>
              {(Object.keys(CATEGORY_ICONS) as ClassCategory[]).map((v) => (
                <option key={v} value={v}>{CATEGORY_ICONS[v]} {tc(`categories.${v}`)}</option>
              ))}
            </select>
          </FormField>
          <FormField label={tc('modal.location')}>
            <input type="text" value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="Phòng Yoga, Tầng 2..." className={inp('location')} />
          </FormField>
          <FormField label={tc('modal.capacity')}>
            <input type="number" min="1" value={form.capacity} onChange={(e) => set('capacity', e.target.value)} placeholder="20" className={inp('capacity')} />
          </FormField>
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
          <FormField label={tc('modal.startDate')}>
            <input type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} className={inp('startDate')} />
          </FormField>
          <FormField label={tc('modal.endDate')}>
            <input type="date" value={form.endDate} onChange={(e) => set('endDate', e.target.value)} className={inp('endDate')} />
          </FormField>
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
        <ModalFooter onCancel={onClose} cancelLabel={tCommon('actions.cancel')} submitLabel={editing ? tc('modal.save') : tc('modal.add')} loading={isLoading} sticky />
      </form>
    </Modal>
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
    } catch (err) {
      toast.error(getApiMessage(err) || tc('toast.error'));
    } finally { setSaving(false); }
  }, [createClass, updateClass, tc]);

  const handleStatusChange = useCallback(async (id: string, status: ClassStatus) => {
    setActingId(id);
    try {
      await changeStatus(id, { status });
      toast.success(tc('toast.statusSuccess'));
    } catch (err) {
      toast.error(getApiMessage(err) || tc('toast.statusError'));
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
        {error && <Alert onDismiss={clearError}>{error}</Alert>}

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
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            <input type="text" value={searchQ} onChange={(e) => setSearchQ(e.target.value)} placeholder={tc('filters.searchPlaceholder')}
              className="pl-9 pr-4 py-2 rounded-xl border border-surface-border bg-surface-raised text-sm text-text-primary placeholder-text-muted outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all w-52" />
          </div>
          {/* Category pills */}
          <SegmentedControl<ClassCategory | 'all'> value={filterCategory} onChange={setFilterCategory} options={[
            { value: 'all', label: tCommon('filters.all') },
            ...(Object.keys(CATEGORY_ICONS) as ClassCategory[]).map((v) => ({ value: v, label: <>{CATEGORY_ICONS[v]} {tc(`categories.${v}`)}</> })),
          ]} />
          {/* Status pills */}
          <SegmentedControl<ClassStatus | 'all'> value={filterStatus} onChange={setFilterStatus} options={[
            { value: 'all', label: tCommon('filters.all') },
            { value: 'active', label: tCommon('status.active') },
            { value: 'cancelled', label: tCommon('status.cancelled') },
            { value: 'completed', label: tCommon('status.completed') },
          ]} />
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
                  ? <TableSkeleton rows={5} cols={6} />
                  : filtered.length === 0
                  ? <tr><td colSpan={6}><EmptyState icon="📅" title={tc('empty.title')} description={tc('empty.description')} /></td></tr>
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
                          ? <Spinner className="text-primary-500" />
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

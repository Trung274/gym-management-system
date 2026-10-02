'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTrainerStore } from '@/src/stores/trainerStore';
import { toast } from '@/src/utils/toast';
import StatsGrid from '@/src/components/ui/StatsGrid';
import AddButton from '@/src/components/ui/AddButton';
import PageHeader from '@/src/components/ui/PageHeader';
import type { Trainer, TrainerStatus, CreateTrainerPayload, UpdateTrainerPayload } from '@/src/types/trainer.types';
import type { Gender } from '@/src/types/member.types';
import { useLanguage } from '@/src/components/providers/LanguageProvider';
import { usePageTitle } from '@/src/hooks/usePageTitle';
import Alert from '@/src/components/ui/Alert';
import { getApiMessage } from '@/src/lib/errors';
import Spinner from '@/src/components/ui/Spinner';
import Modal, { ModalFooter } from '@/src/components/ui/Modal';
import FormField, { inputClass } from '@/src/components/ui/FormField';
import { Ban, CheckCircle, Eye, EyeOff, Pencil, Search } from 'lucide-react';
import SegmentedControl from '@/src/components/ui/SegmentedControl';

// ─── Constants ────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  'from-primary-400 to-primary-600',
  'from-violet-400 to-violet-600',
  'from-sky-400 to-sky-600',
  'from-emerald-400 to-emerald-600',
  'from-rose-400 to-rose-600',
];
const avatarColor = (id: string) => AVATAR_COLORS[id.charCodeAt(id.length - 1) % AVATAR_COLORS.length];

const GENDER_OPTIONS: { value: Gender | ''; labelKey: string }[] = [
  { value: '', labelKey: 'genderNone' },
  { value: 'male', labelKey: 'genderMale' },
  { value: 'female', labelKey: 'genderFemale' },
  { value: 'other', labelKey: 'genderOther' },
];

const EMPTY_CREATE: CreateTrainerPayload = {
  name: '', email: '', password: '',
  phone: '', trainerEmail: '', idCard: '', address: '',
  dateOfBirth: '', gender: undefined,
  specializations: [], experienceYears: 0,
  bio: '', certifications: [], hireDate: '',
};

// ─── Tag Input helper ─────────────────────────────────────────────────────────
function TagInput({ value, onChange, placeholder }: {
  value: string[]; onChange: (v: string[]) => void; placeholder?: string;
}) {
  const { t } = useLanguage();
  const te = t('trainers');
  const [input, setInput] = useState('');
  const add = () => {
    const v = input.trim();
    if (v && !value.includes(v)) { onChange([...value, v]); setInput(''); }
  };
  const remove = (tag: string) => onChange(value.filter((t) => t !== tag));
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap gap-1.5 p-2 rounded-xl border border-surface-border bg-surface-raised min-h-[42px]">
        {value.map((tag) => (
          <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-primary-500/10 text-primary-500 text-xs font-semibold">
            {tag}
            <button type="button" onClick={() => remove(tag)} className="hover:text-danger-500 cursor-pointer">×</button>
          </span>
        ))}
        <input value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] text-sm text-text-primary bg-transparent outline-none placeholder-text-muted"
        />
      </div>
      <p className="text-xs text-text-muted">{te('tagInputHelp')}</p>
    </div>
  );
}

// ─── Trainer Card ─────────────────────────────────────────────────────────────
function TrainerCard({ trainer, onEdit, onToggleStatus, actingId }: {
  trainer: Trainer;
  onEdit: (t: Trainer) => void;
  onToggleStatus: (t: Trainer) => void;
  actingId: string | null;
}) {
  const { t } = useLanguage();
  const te = t('trainers');
  const tCommon = t('common');

  const isActing = actingId === trainer.id;
  return (
    <div className={`bg-surface-base border border-surface-border rounded-2xl p-5 flex flex-col gap-4 transition-all duration-200 hover:shadow-md ${trainer.status === 'inactive' ? 'opacity-60' : ''}`}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${avatarColor(trainer.id)} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
          {trainer.initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-text-primary text-sm truncate">{trainer.name}</p>
          <p className="text-xs text-text-muted truncate">{trainer.loginEmail}</p>
          <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-semibold ${trainer.status === 'active' ? 'bg-success-500/15 text-success-500' : 'bg-surface-overlay text-text-muted'}`}>
            {te(`status.${trainer.status}`)}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="bg-surface-raised rounded-xl py-2">
          <p className="text-base font-bold text-primary-500">{trainer.experienceYears} {te('stats.years')}</p>
          <p className="text-xs text-text-muted">{te('card.experience')}</p>
        </div>
        <div className="bg-surface-raised rounded-xl py-2">
          <p className="text-base font-bold text-text-primary">{trainer.certifications.length}</p>
          <p className="text-xs text-text-muted">{te('card.certifications')}</p>
        </div>
      </div>

      {/* Specializations */}
      {trainer.specializations.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {trainer.specializations.map((s) => (
            <span key={s} className="px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-500 text-xs font-semibold">{s}</span>
          ))}
        </div>
      )}

      {/* Bio */}
      {trainer.bio && (
        <p className="text-xs text-text-muted leading-relaxed line-clamp-2 border-t border-surface-border pt-3">{trainer.bio}</p>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1 border-t border-surface-border">
        <button onClick={() => onEdit(trainer)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-text-secondary bg-surface-overlay hover:bg-surface-border hover:text-text-primary transition-all cursor-pointer">
          <Pencil size={14} />
          {tCommon('actions.edit')}
        </button>
        <button onClick={() => onToggleStatus(trainer)} disabled={isActing}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 ${trainer.status === 'active' ? 'bg-danger-500/10 text-danger-500 hover:bg-danger-500/20' : 'bg-success-500/10 text-success-500 hover:bg-success-500/20'}`}>
          {isActing ? (
            <Spinner />
          ) : (
            (trainer.status === 'active' ? <Ban size={14} /> : <CheckCircle size={14} />)
          )}
          {trainer.status === 'active' ? te('card.deactivate') : te('card.activate')}
        </button>
      </div>
    </div>
  );
}

// ─── Create / Edit Modal ──────────────────────────────────────────────────────
function TrainerModal({ open, editing, onClose, onSave, isLoading }: {
  open: boolean; editing: Trainer | null; onClose: () => void;
  onSave: (payload: CreateTrainerPayload | UpdateTrainerPayload, id?: string) => Promise<void>;
  isLoading: boolean;
}) {
  const { t } = useLanguage();
  const te = t('trainers');
  const tCommon = t('common');

  const [form, setForm] = useState<any>(EMPTY_CREATE);
  const [showPwd, setShowPwd] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      if (editing) {
        setForm({
          phone: editing.phone ?? '', trainerEmail: editing.trainerEmail ?? '',
          idCard: editing.idCard ?? '', address: editing.address ?? '',
          dateOfBirth: editing.dateOfBirth ? editing.dateOfBirth.substring(0, 10) : '',
          gender: editing.gender ?? '',
          specializations: editing.specializations,
          experienceYears: editing.experienceYears,
          bio: editing.bio ?? '',
          certifications: editing.certifications,
        });
      } else {
        setForm({ ...EMPTY_CREATE });
      }
      setErrors({});
    }
  }, [open, editing]);

  const setF = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!editing && !form.name?.trim()) e.name = te('validation.nameRequired');
    if (!editing && !form.email?.trim()) e.email = te('validation.emailRequired');
    if (!editing && (!form.password || form.password.length < 6)) e.password = te('validation.passwordMin');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const payload: any = {
      phone: form.phone || undefined, email: form.trainerEmail || undefined,
      idCard: form.idCard || undefined, address: form.address || undefined,
      dateOfBirth: form.dateOfBirth || undefined, gender: form.gender || undefined,
      specializations: form.specializations, experienceYears: Number(form.experienceYears) || 0,
      bio: form.bio || undefined, certifications: form.certifications,
    };
    if (!editing) {
      payload.name = form.name.trim();
      payload.email = form.email.trim();
      payload.password = form.password;
      if (form.hireDate) payload.hireDate = form.hireDate;
    }
    await onSave(payload, editing?.id);
  };

  if (!open) return null;

  const inputCls = (f: string) => inputClass(!!errors[f]);

  return (
    <Modal onClose={onClose} title={editing ? te('modal.editTitle') : te('modal.createTitle')} size="lg" scrollable>
      <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 flex flex-col gap-5">
        {/* Tài khoản — chỉ khi tạo mới */}
        {!editing && (
          <div>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">{te('modal.accountInfo')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label={te('modal.name')} required error={errors.name}>
                <input type="text" value={form.name ?? ''} onChange={(e) => setF('name', e.target.value)} placeholder={te('modal.namePlaceholder')} className={inputCls('name')} />
              </FormField>
              <FormField label={te('modal.loginEmail')} required error={errors.email}>
                <input type="email" value={form.email ?? ''} onChange={(e) => setF('email', e.target.value)} placeholder={te('modal.loginEmailPlaceholder')} className={inputCls('email')} />
              </FormField>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary">{te('modal.password')} <span className="text-danger-500">*</span></label>
                <div className="relative">
                  <input type={showPwd ? 'text' : 'password'} value={form.password ?? ''} onChange={(e) => setF('password', e.target.value)} placeholder={te('modal.passwordPlaceholder')} className={`${inputCls('password')} pr-10`} />
                  <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary cursor-pointer">
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-danger-500">{errors.password}</p>}
              </div>
              <FormField label={te('modal.hireDate')}>
                <input type="date" value={form.hireDate ?? ''} onChange={(e) => setF('hireDate', e.target.value)} className={inputCls('hireDate')} />
              </FormField>
            </div>
          </div>
        )}

        {/* Thông tin cá nhân */}
        <div>
          <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">{te('modal.personalInfo')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label={te('modal.phone')}>
              <input type="tel" value={form.phone ?? ''} onChange={(e) => setF('phone', e.target.value)} placeholder={te('modal.phonePlaceholder')} className={inputCls('phone')} />
            </FormField>
            <FormField label={te('modal.personalEmail')}>
              <input type="email" value={form.trainerEmail ?? ''} onChange={(e) => setF('trainerEmail', e.target.value)} placeholder={te('modal.personalEmailPlaceholder')} className={inputCls('trainerEmail')} />
            </FormField>
            <FormField label={te('modal.dateOfBirth')}>
              <input type="date" value={form.dateOfBirth ?? ''} onChange={(e) => setF('dateOfBirth', e.target.value)} className={inputCls('dateOfBirth')} />
            </FormField>
            <FormField label={te('modal.gender')}>
              <select value={form.gender ?? ''} onChange={(e) => setF('gender', e.target.value || undefined)} className={inputCls('gender')}>
                {GENDER_OPTIONS.map((g) => <option key={g.value} value={g.value}>{te(`modal.${g.labelKey}`)}</option>)}
              </select>
            </FormField>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-text-secondary">{te('modal.address')}</label>
              <input type="text" value={form.address ?? ''} onChange={(e) => setF('address', e.target.value)} placeholder={te('modal.addressPlaceholder')} className={inputCls('address')} />
            </div>
          </div>
        </div>

        {/* Chuyên môn */}
        <div>
          <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">{te('modal.specializationSection')}</p>
          <div className="flex flex-col gap-3">
            <FormField label={te('modal.experienceYears')}>
              <input type="number" min="0" max="50" value={form.experienceYears ?? 0} onChange={(e) => setF('experienceYears', e.target.value)} className={`${inputCls('experienceYears')} max-w-[180px]`} />
            </FormField>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-secondary">{te('modal.specializations')}</label>
              <TagInput value={form.specializations ?? []} onChange={(v) => setF('specializations', v)} placeholder="VD: Yoga, Strength, Cardio..." />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-secondary">{te('modal.certifications')}</label>
              <TagInput value={form.certifications ?? []} onChange={(v) => setF('certifications', v)} placeholder="VD: ACE CPT, CrossFit L1..." />
            </div>
            <FormField label={te('modal.bio')}>
              <textarea rows={3} value={form.bio ?? ''} onChange={(e) => setF('bio', e.target.value)} placeholder={te('modal.bioPlaceholder')} className={`${inputCls('bio')} resize-none`} />
            </FormField>
          </div>
        </div>

        <ModalFooter onCancel={onClose} cancelLabel={tCommon('actions.cancel')} submitLabel={editing ? tCommon('actions.save') : te('addTrainer')} loading={isLoading} sticky />
      </form>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TrainersPage() {
  const { t } = useLanguage();
  const te = t('trainers');
  const tCommon = t('common');
  usePageTitle('trainers');

  const { trainers, isLoading, error, fetchTrainers, createTrainer, updateTrainer, changeStatus, clearError } = useTrainerStore();

  const [filterStatus, setFilterStatus] = useState<TrainerStatus | 'all'>('all');
  const [filterSpec, setFilterSpec] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState<Trainer | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchTrainers({ status: 'all' }).catch(() => {}); }, [fetchTrainers]);
  useEffect(() => () => clearError(), [clearError]);

  // Lọc local (vì BE chỉ filter specialization, status lọc local)
  const filtered = trainers.filter((t) => {
    const statusOk = filterStatus === 'all' || t.status === filterStatus;
    const specOk = !filterSpec || t.specializations.some((s) => s.toLowerCase().includes(filterSpec.toLowerCase()));
    const searchOk = !searchQ || t.name.toLowerCase().includes(searchQ.toLowerCase()) || t.loginEmail.toLowerCase().includes(searchQ.toLowerCase());
    return statusOk && specOk && searchOk;
  });

  const stats = {
    total: trainers.length,
    active: trainers.filter((t) => t.status === 'active').length,
    inactive: trainers.filter((t) => t.status === 'inactive').length,
    avgExp: trainers.length ? Math.round(trainers.reduce((s, t) => s + t.experienceYears, 0) / trainers.length) : 0,
  };

  // Collect all unique specializations for filter suggestions
  const allSpecs = [...new Set(trainers.flatMap((t) => t.specializations))].sort();

  const handleSave = useCallback(async (payload: CreateTrainerPayload | UpdateTrainerPayload, id?: string) => {
    setSaving(true);
    try {
      if (id) {
        await updateTrainer(id, payload as UpdateTrainerPayload);
        toast.success(te('toast.editSuccess'));
      } else {
        await createTrainer(payload as CreateTrainerPayload);
        toast.success(te('toast.addSuccess'));
      }
      setModalOpen(false);
      setEditingTrainer(null);
    } catch (err) {
      toast.error(getApiMessage(err) || te('toast.error'));
    } finally { setSaving(false); }
  }, [createTrainer, updateTrainer, te]);

  const handleToggleStatus = useCallback(async (t: Trainer) => {
    setActingId(t.id);
    const newStatus: TrainerStatus = t.status === 'active' ? 'inactive' : 'active';
    try {
      await changeStatus(t.id, { status: newStatus });
      toast.success(
        newStatus === 'inactive'
          ? te('toast.deactivateSuccess').replace('{{name}}', t.name)
          : te('toast.activateSuccess').replace('{{name}}', t.name)
      );
    } catch (err) {
      toast.error(getApiMessage(err) || te('toast.statusError'));
    } finally { setActingId(null); }
  }, [changeStatus, te]);

  const openEdit = useCallback((t: Trainer) => { setEditingTrainer(t); setModalOpen(true); }, []);
  const openCreate = useCallback(() => { setEditingTrainer(null); setModalOpen(true); }, []);

  return (
    <>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <PageHeader
            title={te('title')}
            subtitle={te('subtitle')}
          />
          <AddButton onClick={openCreate} label={te('addTrainer')} />
        </div>

        {/* Error */}
        {error && <Alert onDismiss={clearError}>{error}</Alert>}

        {/* Stats */}
        <StatsGrid
          isLoading={isLoading}
          items={[
            { label: te('stats.total'), value: stats.total, color: 'primary' },
            { label: te('stats.active'), value: stats.active, color: 'success' },
            { label: te('stats.inactive'), value: stats.inactive, color: 'secondary' },
            { label: te('stats.avgExp'), value: `${stats.avgExp} ${te('stats.years')}`, color: 'info' },
          ]}
        />

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            <input type="text" value={searchQ} onChange={(e) => setSearchQ(e.target.value)} placeholder={te('searchPlaceholder')}
              className="pl-9 pr-4 py-2 rounded-xl border border-surface-border bg-surface-raised text-sm text-text-primary placeholder-text-muted outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all w-48"
            />
          </div>

          {/* Status filter */}
          <SegmentedControl<TrainerStatus | 'all'> value={filterStatus} onChange={setFilterStatus} options={[
            { value: 'all',      label: tCommon('filters.all') },
            { value: 'active',   label: te('filters.active') },
            { value: 'inactive', label: te('filters.inactive') },
          ]} />

          {/* Specialization filter */}
          {allSpecs.length > 0 && (
            <SegmentedControl accent="violet" value={filterSpec} onChange={(s) => setFilterSpec(s === filterSpec ? '' : s)} options={[
              { value: '', label: te('filters.allSpecializations') },
              ...allSpecs.slice(0, 5).map((s) => ({ value: s, label: s })),
            ]} />
          )}

          <span className="ml-auto text-xs text-text-muted">{filtered.length} {te('count')}</span>
        </div>

        {/* Skeleton */}
        {isLoading && trainers.length === 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-surface-base border border-surface-border rounded-2xl p-5 flex flex-col gap-4 animate-pulse">
                <div className="flex gap-3"><div className="w-12 h-12 rounded-xl bg-surface-overlay shrink-0"/><div className="flex-1 flex flex-col gap-2"><div className="h-4 w-3/4 bg-surface-overlay rounded"/><div className="h-3 w-full bg-surface-overlay rounded"/></div></div>
                <div className="grid grid-cols-2 gap-2"><div className="h-12 bg-surface-overlay rounded-xl"/><div className="h-12 bg-surface-overlay rounded-xl"/></div>
                <div className="flex gap-2"><div className="h-4 w-14 bg-surface-overlay rounded-full"/><div className="h-4 w-16 bg-surface-overlay rounded-full"/></div>
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!isLoading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <span className="text-5xl">🏋️</span>
            <p className="text-base font-semibold text-text-primary">{te('empty.title')}</p>
            <p className="text-sm text-text-muted">{searchQ || filterStatus !== 'all' || filterSpec ? te('empty.noResult') : te('empty.description')}</p>
          </div>
        )}

        {/* Grid */}
        {!isLoading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((t) => (
              <TrainerCard key={t.id} trainer={t} onEdit={openEdit} onToggleStatus={handleToggleStatus} actingId={actingId} />
            ))}
          </div>
        )}
      </div>

      <TrainerModal open={modalOpen} editing={editingTrainer} onClose={() => { setModalOpen(false); setEditingTrainer(null); }} onSave={handleSave} isLoading={saving} />
    </>
  );
}

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
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" /></svg>
          {tCommon('actions.edit')}
        </button>
        <button onClick={() => onToggleStatus(trainer)} disabled={isActing}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 ${trainer.status === 'active' ? 'bg-danger-500/10 text-danger-500 hover:bg-danger-500/20' : 'bg-success-500/10 text-success-500 hover:bg-success-500/20'}`}>
          {isActing ? (
            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d={trainer.status === 'active' ? "M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" : "M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"} /></svg>
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

  const inputCls = (f: string) => `w-full px-3 py-2 rounded-xl border text-sm text-text-primary bg-surface-raised placeholder-text-muted outline-none transition-all ${errors[f] ? 'border-danger-500 focus:ring-2 focus:ring-danger-500/30' : 'border-surface-border focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-surface-base rounded-2xl shadow-2xl border border-surface-border overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border shrink-0">
          <h2 className="text-base font-bold text-text-primary">{editing ? te('modal.editTitle') : te('modal.createTitle')}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-overlay transition-all cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 flex flex-col gap-5">
          {/* Tài khoản — chỉ khi tạo mới */}
          {!editing && (
            <div>
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">{te('modal.accountInfo')}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-secondary">{te('modal.name')} <span className="text-danger-500">*</span></label>
                  <input type="text" value={form.name ?? ''} onChange={(e) => setF('name', e.target.value)} placeholder={te('modal.namePlaceholder')} className={inputCls('name')} />
                  {errors.name && <p className="text-xs text-danger-500">{errors.name}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-secondary">{te('modal.loginEmail')} <span className="text-danger-500">*</span></label>
                  <input type="email" value={form.email ?? ''} onChange={(e) => setF('email', e.target.value)} placeholder={te('modal.loginEmailPlaceholder')} className={inputCls('email')} />
                  {errors.email && <p className="text-xs text-danger-500">{errors.email}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-secondary">{te('modal.password')} <span className="text-danger-500">*</span></label>
                  <div className="relative">
                    <input type={showPwd ? 'text' : 'password'} value={form.password ?? ''} onChange={(e) => setF('password', e.target.value)} placeholder={te('modal.passwordPlaceholder')} className={`${inputCls('password')} pr-10`} />
                    <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary cursor-pointer">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d={showPwd ? "M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" : "M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"} /></svg>
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-danger-500">{errors.password}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-secondary">{te('modal.hireDate')}</label>
                  <input type="date" value={form.hireDate ?? ''} onChange={(e) => setF('hireDate', e.target.value)} className={inputCls('hireDate')} />
                </div>
              </div>
            </div>
          )}

          {/* Thông tin cá nhân */}
          <div>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">{te('modal.personalInfo')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary">{te('modal.phone')}</label>
                <input type="tel" value={form.phone ?? ''} onChange={(e) => setF('phone', e.target.value)} placeholder={te('modal.phonePlaceholder')} className={inputCls('phone')} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary">{te('modal.personalEmail')}</label>
                <input type="email" value={form.trainerEmail ?? ''} onChange={(e) => setF('trainerEmail', e.target.value)} placeholder={te('modal.personalEmailPlaceholder')} className={inputCls('trainerEmail')} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary">{te('modal.dateOfBirth')}</label>
                <input type="date" value={form.dateOfBirth ?? ''} onChange={(e) => setF('dateOfBirth', e.target.value)} className={inputCls('dateOfBirth')} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary">{te('modal.gender')}</label>
                <select value={form.gender ?? ''} onChange={(e) => setF('gender', e.target.value || undefined)} className={inputCls('gender')}>
                  {GENDER_OPTIONS.map((g) => <option key={g.value} value={g.value}>{te(`modal.${g.labelKey}`)}</option>)}
                </select>
              </div>
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
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary">{te('modal.experienceYears')}</label>
                <input type="number" min="0" max="50" value={form.experienceYears ?? 0} onChange={(e) => setF('experienceYears', e.target.value)} className={`${inputCls('experienceYears')} max-w-[180px]`} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary">{te('modal.specializations')}</label>
                <TagInput value={form.specializations ?? []} onChange={(v) => setF('specializations', v)} placeholder="VD: Yoga, Strength, Cardio..." />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary">{te('modal.certifications')}</label>
                <TagInput value={form.certifications ?? []} onChange={(v) => setF('certifications', v)} placeholder="VD: ACE CPT, CrossFit L1..." />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary">{te('modal.bio')}</label>
                <textarea rows={3} value={form.bio ?? ''} onChange={(e) => setF('bio', e.target.value)} placeholder={te('modal.bioPlaceholder')} className={`${inputCls('bio')} resize-none`} />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2 sticky bottom-0 bg-surface-base border-t border-surface-border -mx-6 px-6 py-4 -mb-6">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-text-secondary border border-surface-border hover:bg-surface-overlay transition-all cursor-pointer">{tCommon('actions.cancel')}</button>
            <button type="submit" disabled={isLoading} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-primary-500 hover:bg-primary-600 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2">
              {isLoading && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
              {editing ? tCommon('actions.save') : te('addTrainer')}
            </button>
          </div>
        </form>
      </div>
    </div>
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
    } catch (err: any) {
      toast.error(err?.response?.data?.message || te('toast.error'));
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
    } catch (err: any) {
      toast.error(err?.response?.data?.message || te('toast.statusError'));
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
        {error && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-danger-500/10 border border-danger-500/20 text-danger-500 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
            <span className="flex-1">{error}</span>
            <button onClick={clearError} className="hover:opacity-70 cursor-pointer"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg></button>
          </div>
        )}

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
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
            <input type="text" value={searchQ} onChange={(e) => setSearchQ(e.target.value)} placeholder={te('searchPlaceholder')}
              className="pl-9 pr-4 py-2 rounded-xl border border-surface-border bg-surface-raised text-sm text-text-primary placeholder-text-muted outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all w-48"
            />
          </div>

          {/* Status filter */}
          <div className="flex gap-1 p-1 bg-surface-raised rounded-xl border border-surface-border">
            {([
              { v: 'all', l: tCommon('filters.all') },
              { v: 'active', l: te('filters.active') },
              { v: 'inactive', l: te('filters.inactive') }
            ]).map((f) => (
              <button key={f.v} onClick={() => setFilterStatus(f.v as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${filterStatus === f.v ? 'bg-primary-500 text-white shadow' : 'text-text-secondary hover:text-text-primary hover:bg-surface-overlay'}`}>{f.l}</button>
            ))}
          </div>

          {/* Specialization filter */}
          {allSpecs.length > 0 && (
            <div className="flex gap-1 p-1 bg-surface-raised rounded-xl border border-surface-border flex-wrap">
              <button onClick={() => setFilterSpec('')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${!filterSpec ? 'bg-violet-500 text-white shadow' : 'text-text-secondary hover:text-text-primary hover:bg-surface-overlay'}`}>
                {te('filters.allSpecializations')}
              </button>
              {allSpecs.slice(0, 5).map((s) => (
                <button key={s} onClick={() => setFilterSpec(s === filterSpec ? '' : s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${filterSpec === s ? 'bg-violet-500 text-white shadow' : 'text-text-secondary hover:text-text-primary hover:bg-surface-overlay'}`}>{s}</button>
              ))}
            </div>
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

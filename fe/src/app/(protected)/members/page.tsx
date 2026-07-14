'use client';

import { useEffect, useState, useCallback } from 'react';
import { useMemberStore } from '@/src/stores/memberStore';
import { usePlanStore } from '@/src/stores/planStore';
import { toast } from '@/src/utils/toast';
import StatsGrid from '@/src/components/ui/StatsGrid';
import AddButton from '@/src/components/ui/AddButton';
import PageHeader from '@/src/components/ui/PageHeader';
import type {
  Member, MemberStatus, Gender,
  CreateMemberPayload, UpdateMemberPayload, RenewMembershipPayload,
} from '@/src/types/member.types';
import type { PlanType } from '@/src/types/plan.types';
import { useLanguage } from '@/src/components/providers/LanguageProvider';
import { usePageTitle } from '@/src/hooks/usePageTitle';

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<MemberStatus, string> = {
  active:    'bg-success-500/15 text-success-500',
  expired:   'bg-danger-500/15 text-danger-500',
  suspended: 'bg-warning-500/15 text-warning-500',
};

const GENDER_OPTIONS: { value: Gender | ''; label: string }[] = [
  { value: '', label: 'Không chọn' },
  { value: 'male', label: 'Nam' },
  { value: 'female', label: 'Nữ' },
  { value: 'other', label: 'Khác' },
];

const AVATAR_COLORS = [
  'from-primary-400 to-primary-600',
  'from-violet-400 to-violet-600',
  'from-sky-400 to-sky-600',
  'from-emerald-400 to-emerald-600',
  'from-rose-400 to-rose-600',
];
const avatarColor = (id: string) => AVATAR_COLORS[id.charCodeAt(id.length - 1) % AVATAR_COLORS.length];

// ─── Create Member Modal ──────────────────────────────────────────────────────
const EMPTY_CREATE: CreateMemberPayload = {
  name: '', email: '', password: '',
  phone: '', memberEmail: '', idCard: '', address: '',
  dateOfBirth: '', gender: undefined,
  planId: '', startDate: '', endDate: '', notes: '',
};

function CreateMemberModal({ open, onClose, onSave, isLoading, plans }: {
  open: boolean; onClose: () => void;
  onSave: (p: CreateMemberPayload) => Promise<void>; isLoading: boolean;
  plans: Array<{ id: string; name: string; durationLabel: string; priceLabel: string }>;
}) {
  const { t } = useLanguage();
  const tm = t('members');
  const tCommon = t('common');

  const genderOptions = [
    { value: '', label: tm('createModal.genderNone') },
    { value: 'male', label: tm('createModal.genderMale') },
    { value: 'female', label: tm('createModal.genderFemale') },
    { value: 'other', label: tm('createModal.genderOther') },
  ];
  const [form, setForm] = useState(EMPTY_CREATE);
  const [showPwd, setShowPwd] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [usePlan, setUsePlan] = useState(true);

  useEffect(() => { if (open) { setForm(EMPTY_CREATE); setErrors({}); setUsePlan(true); } }, [open]);

  const set = (k: keyof CreateMemberPayload, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = tm('validation.nameRequired');
    if (!form.email.trim()) e.email = tm('validation.emailRequired');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = tm('validation.emailInvalid');
    if (!form.password || form.password.length < 6) e.password = tm('validation.passwordLength');
    if (usePlan && !form.planId) e.planId = tm('validation.planRequired');
    if (!usePlan && !form.endDate) e.endDate = tm('validation.endDateRequired');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const payload: CreateMemberPayload = {
      name: form.name.trim(), email: form.email.trim(), password: form.password,
      phone: form.phone || undefined,
      memberEmail: form.memberEmail || undefined,
      idCard: form.idCard || undefined,
      address: form.address || undefined,
      dateOfBirth: form.dateOfBirth || undefined,
      gender: form.gender || undefined,
      notes: form.notes || undefined,
      ...(usePlan ? { planId: form.planId, startDate: form.startDate || undefined } : { endDate: form.endDate }),
    };
    await onSave(payload);
  };

  if (!open) return null;

  const inputCls = (field: string) => `w-full px-3 py-2 rounded-xl border text-sm text-text-primary bg-surface-raised placeholder-text-muted outline-none transition-all ${errors[field] ? 'border-danger-500 focus:ring-2 focus:ring-danger-500/30' : 'border-surface-border focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-surface-base rounded-2xl shadow-2xl border border-surface-border overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border shrink-0">
          <h2 className="text-base font-bold text-text-primary">{tm('createModal.title')}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-overlay transition-all cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
          </button>
        </div>
        {/* Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 flex flex-col gap-5">
          {/* Section: Tài khoản */}
          <div>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">{tm('createModal.sectionAccount')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary">{tm('createModal.name')} <span className="text-danger-500">*</span></label>
                <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Nguyễn Văn B" className={inputCls('name')} />
                {errors.name && <p className="text-xs text-danger-500">{errors.name}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary">{tm('createModal.loginEmail')} <span className="text-danger-500">*</span></label>
                <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="member@gym.com" className={inputCls('email')} />
                {errors.email && <p className="text-xs text-danger-500">{errors.email}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary">{tm('createModal.password')} <span className="text-danger-500">*</span></label>
                <div className="relative">
                  <input type={showPwd ? 'text' : 'password'} value={form.password} onChange={(e) => set('password', e.target.value)} placeholder={tm('createModal.passwordHint')} className={`${inputCls('password')} pr-10`} />
                  <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d={showPwd ? "M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" : "M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"} /></svg>
                  </button>
                </div>
                {errors.password && <p className="text-xs text-danger-500">{errors.password}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary">{tm('createModal.contactEmail')}</label>
                <input type="email" value={form.memberEmail} onChange={(e) => set('memberEmail', e.target.value)} placeholder={tm('createModal.contactEmailHint')} className={inputCls('memberEmail')} />
              </div>
            </div>
          </div>

          {/* Section: Thông tin cá nhân */}
          <div>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">{tm('createModal.sectionPersonal')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary">{tm('createModal.phone')}</label>
                <input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="0912345678" className={inputCls('phone')} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary">{tm('createModal.idCard')}</label>
                <input type="text" value={form.idCard} onChange={(e) => set('idCard', e.target.value)} placeholder="012345678901" className={inputCls('idCard')} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary">{tm('createModal.dateOfBirth')}</label>
                <input type="date" value={form.dateOfBirth} onChange={(e) => set('dateOfBirth', e.target.value)} className={inputCls('dateOfBirth')} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary">{tm('createModal.gender')}</label>
                <select value={form.gender ?? ''} onChange={(e) => set('gender', e.target.value || undefined)} className={inputCls('gender')}>
                  {genderOptions.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-text-secondary">{tm('createModal.address')}</label>
                <input type="text" value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="123 Nguyễn Trãi, Hà Nội" className={inputCls('address')} />
              </div>
            </div>
          </div>

          {/* Section: Gói tập */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider">{tm('createModal.sectionPlan')}</p>
              <button type="button" onClick={() => setUsePlan(v => !v)}
                className="text-xs text-primary-500 hover:underline cursor-pointer">
                {usePlan ? tm('createModal.useManualDate') : tm('createModal.useByPlan')}
              </button>
            </div>
            {usePlan ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-text-secondary">{tm('createModal.planSelect')} <span className="text-danger-500">*</span></label>
                  <select value={form.planId} onChange={(e) => set('planId', e.target.value)} className={inputCls('planId')}>
                    <option value="">-- {tm('createModal.planSelect')} --</option>
                    {plans.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.durationLabel} — {p.priceLabel}</option>)}
                  </select>
                  {errors.planId && <p className="text-xs text-danger-500">{errors.planId}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-secondary">{tm('createModal.startDate')}</label>
                  <input type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} className={inputCls('startDate')} />
                  <p className="text-xs text-text-muted">{tm('createModal.startDateHint')}</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5 max-w-xs">
                <label className="text-xs font-semibold text-text-secondary">{tm('createModal.endDate')} <span className="text-danger-500">*</span></label>
                <input type="date" value={form.endDate} onChange={(e) => set('endDate', e.target.value)} className={inputCls('endDate')} />
                {errors.endDate && <p className="text-xs text-danger-500">{errors.endDate}</p>}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary">{tm('createModal.notes')}</label>
            <textarea rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder={tm('createModal.notesPlaceholder')} className={`${inputCls('notes')} resize-none`} />
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-2 sticky bottom-0 bg-surface-base border-t border-surface-border -mx-6 px-6 py-4 -mb-6">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-text-secondary border border-surface-border hover:bg-surface-overlay transition-all cursor-pointer">{tCommon('actions.cancel')}</button>
            <button type="submit" disabled={isLoading} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-primary-500 hover:bg-primary-600 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2">
              {isLoading && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
              {tm('createModal.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Renew Modal ──────────────────────────────────────────────────────────────
function RenewModal({ open, member, onClose, onSave, isLoading, plans }: {
  open: boolean; member: Member | null; onClose: () => void;
  onSave: (id: string, p: RenewMembershipPayload) => Promise<void>; isLoading: boolean;
  plans: Array<{ id: string; name: string; durationLabel: string; priceLabel: string }>;
}) {
  const { t } = useLanguage();
  const tm = t('members');
  const tCommon = t('common');

  const [usePlan, setUsePlan] = useState(true);
  const [planId, setPlanId] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => { if (open) { setUsePlan(true); setPlanId(''); setEndDate(''); } }, [open]);
  if (!open || !member) return null;

  const handleConfirm = async () => {
    if (usePlan && !planId) { toast.error(tm('toast.statusError')); return; }
    if (!usePlan && !endDate) { toast.error(tm('toast.statusError')); return; }
    await onSave(member.id, usePlan ? { planId } : { endDate });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-surface-base rounded-2xl shadow-2xl border border-surface-border overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
          <h2 className="text-base font-bold text-text-primary">{tm('renewModal.title')}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-overlay transition-all cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <div className="p-3 rounded-xl bg-surface-raised border border-surface-border">
            <p className="font-semibold text-sm text-text-primary">{member.name}</p>
            <p className="text-xs text-text-muted">{tm('renewModal.currentExpiry')}: {member.endDateLabel}</p>
            <p className="text-xs text-text-muted">{tm('renewModal.currentPlan')}: {member.planName}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setUsePlan(true)} className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${usePlan ? 'border-primary-500 bg-primary-500/10 text-primary-500' : 'border-surface-border text-text-secondary hover:border-primary-500/50'}`}>{tm('renewModal.byPlan')}</button>
            <button onClick={() => setUsePlan(false)} className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${!usePlan ? 'border-primary-500 bg-primary-500/10 text-primary-500' : 'border-surface-border text-text-secondary hover:border-primary-500/50'}`}>{tm('renewModal.manual')}</button>
          </div>
          {usePlan ? (
            <select value={planId} onChange={(e) => setPlanId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-surface-border text-sm text-text-primary bg-surface-raised outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all">
              <option value="">-- {tm('createModal.planSelect')} --</option>
              {plans.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.durationLabel} — {p.priceLabel}</option>)}
            </select>
          ) : (
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-surface-border text-sm text-text-primary bg-surface-raised outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
            />
          )}
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-text-secondary border border-surface-border hover:bg-surface-overlay transition-all cursor-pointer">{tCommon('actions.cancel')}</button>
            <button onClick={handleConfirm} disabled={isLoading} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-primary-500 hover:bg-primary-600 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2">
              {isLoading && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
              {tm('renewModal.submit')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Member Row ───────────────────────────────────────────────────────────────
function MemberRow({ member, onCheckIn, onRenew, onToggleStatus, actingId }: {
  member: Member;
  onCheckIn: (m: Member) => void;
  onRenew: (m: Member) => void;
  onToggleStatus: (m: Member) => void;
  actingId: string | null;
}) {
  const { t } = useLanguage();
  const tm = t('members');

  const isActing = actingId === member.id;
  const daysClass = member.daysRemaining <= 0 ? 'text-danger-500' : member.daysRemaining <= 7 ? 'text-warning-500' : 'text-text-muted';

  return (
    <tr className="border-b border-surface-border hover:bg-surface-raised transition-colors group">
      {/* Member info */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${avatarColor(member.id)} flex items-center justify-center text-white font-bold text-xs shrink-0`}>
            {member.initials}
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">{member.name}</p>
            <p className="text-xs text-text-muted">{member.email}</p>
          </div>
        </div>
      </td>
      {/* Contact */}
      <td className="px-4 py-3">
        <p className="text-sm text-text-primary">{member.phone ?? '—'}</p>
        <p className="text-xs text-text-muted">{member.genderLabel}</p>
      </td>
      {/* Plan */}
      <td className="px-4 py-3">
        <p className="text-sm text-text-primary">{member.planName}</p>
        <p className={`text-xs ${daysClass}`}>
          {member.daysRemaining > 0 ? tm('daysRemaining').replace('{{days}}', String(member.daysRemaining)) : tm('expired')} · {tm('expiry')}: {member.endDateLabel}
        </p>
      </td>
      {/* Status */}
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[member.status]}`}>
          {member.statusLabel}
        </span>
      </td>
      {/* Last check-in */}
      <td className="px-4 py-3">
        <p className="text-xs text-text-muted">{member.lastCheckInLabel}</p>
      </td>
      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          {isActing ? (
            <svg className="w-4 h-4 animate-spin text-primary-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
          ) : (
            <>
              {/* Check-in */}
              {member.status === 'active' && (
                <button onClick={() => onCheckIn(member)} title={tm('actions.checkin')}
                  className="p-1.5 rounded-lg text-success-500 hover:bg-success-500/10 transition-all cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" /></svg>
                </button>
              )}
              {/* Renew */}
              <button onClick={() => onRenew(member)} title={tm('actions.renew')}
                className="p-1.5 rounded-lg text-primary-500 hover:bg-primary-500/10 transition-all cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
              </button>
              {/* Toggle suspend */}
              {member.status !== 'expired' && (
                <button onClick={() => onToggleStatus(member)} title={member.status === 'active' ? tm('actions.suspend') : tm('actions.activate')}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${member.status === 'active' ? 'text-warning-500 hover:bg-warning-500/10' : 'text-success-500 hover:bg-success-500/10'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d={member.status === 'active' ? "M15.75 5.25v13.5m-7.5-13.5v13.5" : "M5.636 5.636a9 9 0 1 0 12.728 12.728M5.636 5.636a9 9 0 0 1 12.728 12.728M5.636 5.636 12 12m6.364-6.364L12 12"} />
                  </svg>
                </button>
              )}
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MembersPage() {
  const { t } = useLanguage();
  const tm = t('members');
  const tCommon = t('common');
  usePageTitle('members');

  const {
    members, pagination, isLoading, error, queryParams,
    fetchMembers, createMember, changeStatus, renewMembership, checkIn, clearError,
  } = useMemberStore();
  const { plans, fetchPlans } = usePlanStore();

  const [filterStatus, setFilterStatus] = useState<MemberStatus | 'all'>('all');
  const [filterPlanType, setFilterPlanType] = useState<PlanType | 'all'>('all');
  const [searchQ, setSearchQ] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [renewMember, setRenewMember] = useState<Member | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Fetch active plans for dropdowns
  useEffect(() => { fetchPlans({ all: false }).catch(() => {}); }, [fetchPlans]);

  // Fetch members on filter change (debounce search)
  useEffect(() => {
    const t = setTimeout(() => {
      const params: any = { page: 1 };
      if (filterStatus !== 'all') params.status = filterStatus;
      if (filterPlanType !== 'all') params.planType = filterPlanType;
      if (searchQ) params.search = searchQ;
      fetchMembers(params).catch(() => {});
    }, searchQ ? 350 : 0);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, filterPlanType, searchQ]);

  useEffect(() => () => clearError(), [clearError]);

  // Active plan list for dropdowns (only active)
  const activePlans = plans
    .filter((p) => p.isActive)
    .map((p) => ({ id: p.id, name: p.name, durationLabel: p.durationLabel, priceLabel: p.priceLabel }));

  const stats = {
    total: pagination?.total ?? 0,
    active: members.filter((m) => m.status === 'active').length,
    expired: members.filter((m) => m.status === 'expired').length,
    suspended: members.filter((m) => m.status === 'suspended').length,
  };

  const handleCreate = useCallback(async (payload: CreateMemberPayload) => {
    setSaving(true);
    try {
      await createMember(payload);
      toast.success(tm('toast.addSuccess'));
      setCreateOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || tm('toast.addError'));
    } finally { setSaving(false); }
  }, [createMember, tm]);

  const handleCheckIn = useCallback(async (m: Member) => {
    setActingId(m.id);
    try {
      await checkIn(m.id);
      toast.success(tm('toast.checkinSuccess').replace('{{name}}', m.name));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || tm('toast.checkinError'));
    } finally { setActingId(null); }
  }, [checkIn, tm]);

  const handleRenew = useCallback(async (id: string, payload: RenewMembershipPayload) => {
    setSaving(true);
    try {
      await renewMembership(id, payload);
      toast.success(tm('toast.renewSuccess'));
      setRenewMember(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || tm('toast.renewError'));
    } finally { setSaving(false); }
  }, [renewMembership, tm]);

  const handleToggleStatus = useCallback(async (m: Member) => {
    setActingId(m.id);
    const newStatus = m.status === 'active' ? 'suspended' : 'active';
    try {
      await changeStatus(m.id, { status: newStatus });
      toast.success(newStatus === 'suspended'
        ? tm('toast.suspendSuccess').replace('{{name}}', m.name)
        : tm('toast.activateSuccess').replace('{{name}}', m.name));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || tm('toast.statusError'));
    } finally { setActingId(null); }
  }, [changeStatus, tm]);

  const handlePageChange = (page: number) => {
    const params: any = { page };
    if (filterStatus !== 'all') params.status = filterStatus;
    if (filterPlanType !== 'all') params.planType = filterPlanType;
    if (searchQ) params.search = searchQ;
    fetchMembers(params).catch(() => {});
  };

  return (
    <>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <PageHeader title={tm('title')} subtitle={tm('subtitle')} />
          <AddButton onClick={() => setCreateOpen(true)} label={tm('addMember')} />
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
            { label: tm('stats.total'),     value: stats.total,     color: 'primary' },
            { label: tm('stats.active'),    value: stats.active,    color: 'success' },
            { label: tm('stats.expired'),   value: stats.expired,   color: 'danger'  },
            { label: tm('stats.suspended'), value: stats.suspended, color: 'warning' },
          ]}
        />

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
            <input type="text" value={searchQ} onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Tìm tên, email..."
              className="pl-9 pr-4 py-2 rounded-xl border border-surface-border bg-surface-raised text-sm text-text-primary placeholder-text-muted outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all w-52"
            />
          </div>
          {/* Status filter */}
          <div className="flex gap-1 p-1 bg-surface-raised rounded-xl border border-surface-border">
            {([
              { v: 'all',       l: tCommon('actions.viewAll') },
              { v: 'active',    l: tCommon('status.active')   },
              { v: 'expired',   l: tCommon('status.expired')  },
              { v: 'suspended', l: tCommon('status.suspended')},
            ]).map((f) => (
              <button key={f.v} onClick={() => setFilterStatus(f.v as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${filterStatus === f.v ? 'bg-primary-500 text-white shadow' : 'text-text-secondary hover:text-text-primary hover:bg-surface-overlay'}`}>{f.l}</button>
            ))}
          </div>
          {/* Plan type filter */}
          <div className="flex gap-1 p-1 bg-surface-raised rounded-xl border border-surface-border">
            {([
              { v: 'all',     l: tm('filters.allPlans') },
              { v: 'basic',   l: tm('filters.basic')    },
              { v: 'premium', l: tm('filters.premium')  },
              { v: 'vip',     l: tm('filters.vip')      },
            ]).map((f) => (
              <button key={f.v} onClick={() => setFilterPlanType(f.v as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${filterPlanType === f.v ? 'bg-primary-500 text-white shadow' : 'text-text-secondary hover:text-text-primary hover:bg-surface-overlay'}`}>{f.l}</button>
            ))}
          </div>
          <span className="ml-auto text-xs text-text-muted">{pagination?.total ?? 0} {tm('count')}</span>
        </div>

        {/* Table */}
        <div className="bg-surface-base border border-surface-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-border bg-surface-raised">
                  {[tm('table.member'), tm('table.contact'), tm('table.plan'), tm('table.status'), tm('table.lastCheckin'), tm('table.actions')].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading && members.length === 0
                  ? [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b border-surface-border animate-pulse">
                      <td className="px-4 py-3"><div className="flex gap-3 items-center"><div className="w-9 h-9 rounded-xl bg-surface-overlay shrink-0"/><div className="flex flex-col gap-1.5"><div className="h-3.5 w-28 bg-surface-overlay rounded"/><div className="h-3 w-36 bg-surface-overlay rounded"/></div></div></td>
                      {[...Array(5)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-surface-overlay rounded w-3/4"/></td>)}
                    </tr>
                  ))
                  : members.length === 0
                  ? (
                    <tr><td colSpan={6} className="px-4 py-16 text-center">
                      <p className="text-4xl mb-3">👥</p>
                      <p className="text-sm font-semibold text-text-primary">{tm('empty.title')}</p>
                      <p className="text-xs text-text-muted mt-1">{tm('empty.description')}</p>
                    </td></tr>
                  )
                  : members.map((m) => (
                    <MemberRow key={m.id} member={m}
                      onCheckIn={handleCheckIn} onRenew={setRenewMember}
                      onToggleStatus={handleToggleStatus} actingId={actingId}
                    />
                  ))
                }
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-surface-border">
              <p className="text-xs text-text-muted">{tCommon('pagination.page')} {pagination.currentPage}{tCommon('pagination.of')}{pagination.totalPages} · {pagination.total} {tm('count')}</p>
              <div className="flex gap-1">
                <button onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={pagination.currentPage <= 1}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-text-secondary border border-surface-border hover:bg-surface-overlay disabled:opacity-40 transition-all cursor-pointer">{tCommon('pagination.previous')}</button>
                <button onClick={() => handlePageChange(pagination.currentPage + 1)} disabled={pagination.currentPage >= pagination.totalPages}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-text-secondary border border-surface-border hover:bg-surface-overlay disabled:opacity-40 transition-all cursor-pointer">{tCommon('pagination.next')}</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <CreateMemberModal open={createOpen} onClose={() => setCreateOpen(false)} onSave={handleCreate} isLoading={saving} plans={activePlans} />
      <RenewModal open={!!renewMember} member={renewMember} onClose={() => setRenewMember(null)} onSave={handleRenew} isLoading={saving} plans={activePlans} />
    </>
  );
}

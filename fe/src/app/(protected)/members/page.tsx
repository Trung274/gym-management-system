'use client';

import { useEffect, useState, useCallback } from 'react';
import { useMemberStore } from '@/src/stores/memberStore';
import { usePlanStore } from '@/src/stores/planStore';
import { toast } from '@/src/utils/toast';
import StatsGrid from '@/src/components/ui/StatsGrid';
import AddButton from '@/src/components/ui/AddButton';
import PageHeader from '@/src/components/ui/PageHeader';
import type {
  Member, MemberStatus,
  CreateMemberPayload, RenewMembershipPayload, MemberQueryParams,
} from '@/src/types/member.types';
import type { PlanType } from '@/src/types/plan.types';
import { useLanguage } from '@/src/components/providers/LanguageProvider';
import { usePageTitle } from '@/src/hooks/usePageTitle';
import Alert from '@/src/components/ui/Alert';
import { getApiMessage } from '@/src/lib/errors';
import Modal, { ModalFooter } from '@/src/components/ui/Modal';
import FormField, { inputClass } from '@/src/components/ui/FormField';
import { CheckCircle, Eye, EyeOff, LogIn, Pause, RefreshCw, Search, Users } from 'lucide-react';
import Spinner from '@/src/components/ui/Spinner';
import Badge from '@/src/components/ui/Badge';
import { MEMBER_STATUS_TONE } from '@/src/lib/statusTones';
import SegmentedControl from '@/src/components/ui/SegmentedControl';
import { TableSkeleton } from '@/src/components/ui/Skeleton';
import EmptyState from '@/src/components/ui/EmptyState';
import { useFormat } from '@/src/hooks/useFormat';

// ─── Constants ────────────────────────────────────────────────────────────────
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

  const inputCls = (field: string) => inputClass(!!errors[field]);

  return (
    <Modal onClose={onClose} title={tm('createModal.title')} size="lg" scrollable>
      {/* Body */}
      <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 flex flex-col gap-5">
        {/* Section: Tài khoản */}
        <div>
          <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">{tm('createModal.sectionAccount')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label={tm('createModal.name')} required error={errors.name}>
              <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder={tm('createModal.namePlaceholder')} className={inputCls('name')} />
            </FormField>
            <FormField label={tm('createModal.loginEmail')} required error={errors.email}>
              <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="member@gym.com" className={inputCls('email')} />
            </FormField>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-secondary">{tm('createModal.password')} <span className="text-danger-500">*</span></label>
              <div className="relative">
                <input type={showPwd ? 'text' : 'password'} value={form.password} onChange={(e) => set('password', e.target.value)} placeholder={tm('createModal.passwordHint')} className={`${inputCls('password')} pr-10`} />
                <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary cursor-pointer">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-danger-500">{errors.password}</p>}
            </div>
            <FormField label={tm('createModal.contactEmail')}>
              <input type="email" value={form.memberEmail} onChange={(e) => set('memberEmail', e.target.value)} placeholder={tm('createModal.contactEmailHint')} className={inputCls('memberEmail')} />
            </FormField>
          </div>
        </div>

        {/* Section: Thông tin cá nhân */}
        <div>
          <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">{tm('createModal.sectionPersonal')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label={tm('createModal.phone')}>
              <input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="0912345678" className={inputCls('phone')} />
            </FormField>
            <FormField label={tm('createModal.idCard')}>
              <input type="text" value={form.idCard} onChange={(e) => set('idCard', e.target.value)} placeholder="012345678901" className={inputCls('idCard')} />
            </FormField>
            <FormField label={tm('createModal.dateOfBirth')}>
              <input type="date" value={form.dateOfBirth} onChange={(e) => set('dateOfBirth', e.target.value)} className={inputCls('dateOfBirth')} />
            </FormField>
            <FormField label={tm('createModal.gender')}>
              <select value={form.gender ?? ''} onChange={(e) => set('gender', e.target.value || undefined)} className={inputCls('gender')}>
                {genderOptions.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
            </FormField>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-text-secondary">{tm('createModal.address')}</label>
              <input type="text" value={form.address} onChange={(e) => set('address', e.target.value)} placeholder={tm('createModal.addressPlaceholder')} className={inputCls('address')} />
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
        <FormField label={tm('createModal.notes')}>
          <textarea rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder={tm('createModal.notesPlaceholder')} className={`${inputCls('notes')} resize-none`} />
        </FormField>

        <ModalFooter onCancel={onClose} cancelLabel={tCommon('actions.cancel')} submitLabel={tm('createModal.submit')} loading={isLoading} sticky />
      </form>
    </Modal>
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
  const fmt = useFormat();

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
    <Modal onClose={onClose} title={tm('renewModal.title')}>
      <div className="p-6 flex flex-col gap-4">
        <div className="p-3 rounded-xl bg-surface-raised border border-surface-border">
          <p className="font-semibold text-sm text-text-primary">{member.name}</p>
          <p className="text-xs text-text-muted">{tm('renewModal.currentExpiry')}: {fmt.date(member.endDate)}</p>
          <p className="text-xs text-text-muted">{tm('renewModal.currentPlan')}: {member.planName}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setUsePlan(true)} className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${usePlan ? 'border-primary-500 bg-primary-500/10 text-primary-500' : 'border-surface-border text-text-secondary hover:border-primary-500/50'}`}>{tm('renewModal.byPlan')}</button>
          <button onClick={() => setUsePlan(false)} className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${!usePlan ? 'border-primary-500 bg-primary-500/10 text-primary-500' : 'border-surface-border text-text-secondary hover:border-primary-500/50'}`}>{tm('renewModal.manual')}</button>
        </div>
        {usePlan ? (
          <select value={planId} onChange={(e) => setPlanId(e.target.value)}
            className={inputClass()}>
            <option value="">-- {tm('createModal.planSelect')} --</option>
            {plans.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.durationLabel} — {p.priceLabel}</option>)}
          </select>
        ) : (
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
            className={inputClass()}
          />
        )}
        <ModalFooter onCancel={onClose} cancelLabel={tCommon('actions.cancel')} submitLabel={tm('renewModal.submit')} loading={isLoading} onSubmit={handleConfirm} />
      </div>
    </Modal>
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
  const tCommon = t('common');
  const fmt = useFormat();

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
        <p className="text-xs text-text-muted">{member.gender ? tCommon(`gender.${member.gender}`) : '—'}</p>
      </td>
      {/* Plan */}
      <td className="px-4 py-3">
        <p className="text-sm text-text-primary">{member.planName}</p>
        <p className={`text-xs ${daysClass}`}>
          {member.daysRemaining > 0 ? tm('daysRemaining').replace('{{days}}', String(member.daysRemaining)) : tm('expired')} · {tm('expiry')}: {fmt.date(member.endDate)}
        </p>
      </td>
      {/* Status */}
      <td className="px-4 py-3">
        <Badge tone={MEMBER_STATUS_TONE[member.status]}>{tCommon(`status.${member.status}`)}</Badge>
      </td>
      {/* Last check-in */}
      <td className="px-4 py-3">
        <p className="text-xs text-text-muted">{fmt.date(member.lastCheckIn)}</p>
      </td>
      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          {isActing ? (
            <Spinner className="text-primary-500" />
          ) : (
            <>
              {/* Check-in */}
              {member.status === 'active' && (
                <button onClick={() => onCheckIn(member)} title={tm('actions.checkin')}
                  className="p-1.5 rounded-lg text-success-500 hover:bg-success-500/10 transition-all cursor-pointer">
                  <LogIn size={16} />
                </button>
              )}
              {/* Renew */}
              <button onClick={() => onRenew(member)} title={tm('actions.renew')}
                className="p-1.5 rounded-lg text-primary-500 hover:bg-primary-500/10 transition-all cursor-pointer">
                <RefreshCw size={16} />
              </button>
              {/* Toggle suspend */}
              {member.status !== 'expired' && (
                <button onClick={() => onToggleStatus(member)} title={member.status === 'active' ? tm('actions.suspend') : tm('actions.activate')}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${member.status === 'active' ? 'text-warning-500 hover:bg-warning-500/10' : 'text-success-500 hover:bg-success-500/10'}`}>
                  {member.status === 'active' ? <Pause size={16} /> : <CheckCircle size={16} />}
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
  const fmt = useFormat();
  usePageTitle('members');

  const {
    members, pagination, isLoading, error,
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

  // The store merges params into the previous query, so cleared filters must be sent as undefined
  const buildParams = (page: number): MemberQueryParams => ({
    page,
    status: filterStatus !== 'all' ? filterStatus : undefined,
    planType: filterPlanType !== 'all' ? filterPlanType : undefined,
    search: searchQ || undefined,
  });

  // Fetch members on filter change (debounce search)
  useEffect(() => {
    const t = setTimeout(() => {
      fetchMembers(buildParams(1)).catch(() => {});
    }, searchQ ? 350 : 0);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, filterPlanType, searchQ]);

  useEffect(() => () => clearError(), [clearError]);

  // Active plan list for dropdowns (only active)
  const activePlans = plans
    .filter((p) => p.isActive)
    .map((p) => ({ id: p.id, name: p.name, durationLabel: fmt.duration(p.durationDays), priceLabel: fmt.currency(p.price) }));

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
    } catch (err) {
      toast.error(getApiMessage(err) || tm('toast.addError'));
    } finally { setSaving(false); }
  }, [createMember, tm]);

  const handleCheckIn = useCallback(async (m: Member) => {
    setActingId(m.id);
    try {
      await checkIn(m.id);
      toast.success(tm('toast.checkinSuccess').replace('{{name}}', m.name));
    } catch (err) {
      toast.error(getApiMessage(err) || tm('toast.checkinError'));
    } finally { setActingId(null); }
  }, [checkIn, tm]);

  const handleRenew = useCallback(async (id: string, payload: RenewMembershipPayload) => {
    setSaving(true);
    try {
      await renewMembership(id, payload);
      toast.success(tm('toast.renewSuccess'));
      setRenewMember(null);
    } catch (err) {
      toast.error(getApiMessage(err) || tm('toast.renewError'));
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
    } catch (err) {
      toast.error(getApiMessage(err) || tm('toast.statusError'));
    } finally { setActingId(null); }
  }, [changeStatus, tm]);

  const handlePageChange = (page: number) => {
    fetchMembers(buildParams(page)).catch(() => {});
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
        {error && <Alert onDismiss={clearError}>{error}</Alert>}

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
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            <input type="text" value={searchQ} onChange={(e) => setSearchQ(e.target.value)}
              placeholder={tm('searchPlaceholder')}
              className="pl-9 pr-4 py-2 rounded-xl border border-surface-border bg-surface-raised text-sm text-text-primary placeholder-text-muted outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all w-52"
            />
          </div>
          {/* Status filter */}
          <SegmentedControl<MemberStatus | 'all'> value={filterStatus} onChange={setFilterStatus} options={[
            { value: 'all',       label: tCommon('actions.viewAll') },
            { value: 'active',    label: tCommon('status.active') },
            { value: 'expired',   label: tCommon('status.expired') },
            { value: 'suspended', label: tCommon('status.suspended') },
          ]} />
          {/* Plan type filter */}
          <SegmentedControl<PlanType | 'all'> value={filterPlanType} onChange={setFilterPlanType} options={[
            { value: 'all',     label: tm('filters.allPlans') },
            { value: 'basic',   label: tm('filters.basic') },
            { value: 'premium', label: tm('filters.premium') },
            { value: 'vip',     label: tm('filters.vip') },
          ]} />
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
                  ? <TableSkeleton rows={5} cols={6} />
                  : members.length === 0
                  ? (
                    <tr><td colSpan={6}><EmptyState icon={<Users size={40} />} title={tm('empty.title')} description={tm('empty.description')} /></td></tr>
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

'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePlanStore } from '@/src/stores/planStore';
import { toast } from '@/src/utils/toast';
import StatsGrid from '@/src/components/ui/StatsGrid';
import AddButton from '@/src/components/ui/AddButton';
import PageHeader from '@/src/components/ui/PageHeader';
import type { SubscriptionPlan, PlanType, CreatePlanPayload, UpdatePlanPayload } from '@/src/types/plan.types';
import { useLanguage } from '@/src/components/providers/LanguageProvider';
import { usePageTitle } from '@/src/hooks/usePageTitle';
import Alert from '@/src/components/ui/Alert';
import Spinner from '@/src/components/ui/Spinner';
import FormField, { inputClass } from '@/src/components/ui/FormField';
import Modal, { ModalFooter } from '@/src/components/ui/Modal';
import { Ban, CheckCircle, CheckCircle2, Eye, Pencil, PieChart, XCircle } from 'lucide-react';
import SegmentedControl from '@/src/components/ui/SegmentedControl';
import { useFormat } from '@/src/hooks/useFormat';

// ─── Constants ────────────────────────────────────────────────────────────────
const PLAN_TYPES: PlanType[] = ['basic', 'premium', 'vip'];

const TYPE_STYLES: Record<PlanType, { badge: string; card: string; icon: string }> = {
  basic:   { badge: 'bg-sky-500/15 text-sky-500',      card: 'from-sky-500/10 to-transparent',    icon: '☁️' },
  premium: { badge: 'bg-primary-500/15 text-primary-500', card: 'from-primary-500/10 to-transparent', icon: '🔥' },
  vip:     { badge: 'bg-violet-500/15 text-violet-500', card: 'from-violet-500/10 to-transparent',  icon: '👑' },
};

// ─── Empty form state ─────────────────────────────────────────────────────────
const EMPTY_FORM = { name: '', type: 'basic' as PlanType, durationDays: 30, price: 0, description: '' };

// Helper to get plan features based on type
const getPlanFeatures = (type: PlanType, te: any) => {
  switch (type) {
    case 'basic':
      return [
        { label: te('features.basic_0'), active: true },
        { label: te('features.basic_1'), active: true },
        { label: te('features.basic_2'), active: false },
        { label: te('features.basic_3'), active: false },
      ];
    case 'premium':
      return [
        { label: te('features.premium_0'), active: true },
        { label: te('features.premium_1'), active: true },
        { label: te('features.premium_2'), active: true },
        { label: te('features.premium_3'), active: false },
      ];
    case 'vip':
      return [
        { label: te('features.vip_0'), active: true },
        { label: te('features.vip_1'), active: true },
        { label: te('features.vip_2'), active: true },
        { label: te('features.vip_3'), active: true },
      ];
    default:
      return [];
  }
};

// Helper for deterministic mock members
const getMockActiveMembers = (plan: SubscriptionPlan) => {
  const charSum = plan.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const count = 50 + (charSum % 400); // 50 to 450
  
  const avatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80',
  ];
  // Select slice based on seed
  const selectedAvatars = avatars.slice(0, 2 + (charSum % 2));
  return { count, avatars: selectedAvatars };
};

// ─── PlanCard ─────────────────────────────────────────────────────────────────
function PlanCard({
  plan,
  onEdit,
  onToggle,
  toggling,
}: {
  plan: SubscriptionPlan;
  onEdit: (p: SubscriptionPlan) => void;
  onToggle: (id: string) => void;
  toggling: string | null;
}) {
  const { t } = useLanguage();
  const te = t('plans');
  const tCommon = t('common');
  const fmt = useFormat();

  const isToggling = toggling === plan.id;
  const features = getPlanFeatures(plan.type, te);
  const { count: activeCount, avatars } = getMockActiveMembers(plan);

  // Styling maps based on plan type
  let containerClasses = 'relative rounded-2xl border border-surface-border bg-surface-raised flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg';
  let stripClasses = 'h-2 bg-text-muted/30 w-full opacity-30';
  const innerClasses = 'p-6 flex flex-col h-full flex-grow';

  if (plan.type === 'premium') {
    containerClasses = 'relative rounded-2xl border border-primary-500/30 bg-gradient-to-b from-primary-500/5 via-surface-raised to-surface-raised flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ring-1 ring-primary-500/20';
    stripClasses = 'h-2 bg-primary-500 w-full shadow-[0_0_15px_rgba(41,98,255,0.4)]';
  } else if (plan.type === 'vip') {
    containerClasses = 'relative rounded-2xl border border-warning-500/30 bg-gradient-to-b from-warning-500/5 via-surface-raised to-surface-raised flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg';
    stripClasses = 'h-2 bg-warning-500 w-full shadow-[0_0_15px_rgba(245,158,11,0.4)]';
  }

  if (!plan.isActive) {
    containerClasses += ' opacity-50';
  }

  return (
    <div className={containerClasses}>
      {/* Dynamic top highlight strip */}
      <div className={stripClasses} />

      <div className={innerClasses}>
        {/* Tier Header */}
        <div className="flex justify-between items-start mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <h3 className="text-xl font-black text-text-primary font-headline tracking-tight">{plan.name}</h3>
              {plan.type === 'premium' && (
                <span className="bg-primary-500/10 text-primary-500 text-[10px] px-2 py-0.5 rounded-full font-headline font-black uppercase tracking-wider">
                  {te('card.popular')}
                </span>
              )}
            </div>
            <p className="text-text-secondary text-xs font-medium">
              {plan.type === 'basic' ? te('card.basicDesc') : plan.type === 'premium' ? te('card.premiumDesc') : te('card.vipDesc')}
            </p>
          </div>
          <div className={`px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider ${
            plan.type === 'basic' ? 'bg-surface-overlay text-text-muted' :
            plan.type === 'premium' ? 'bg-primary-500/10 text-primary-500' :
            'bg-warning-500/10 text-warning-500'
          }`}>
            #{plan.type.toUpperCase()}
          </div>
        </div>

        {/* Pricing */}
        <div className="mb-6">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-text-primary font-headline tracking-tight">{fmt.currency(plan.price)}</span>
            <span className="text-text-muted text-xs font-medium">/{fmt.duration(plan.durationDays)}</span>
          </div>
        </div>

        {/* Feature List */}
        <div className="space-y-3.5 mb-8 flex-grow">
          {features.map((f, i) => (
            <div key={i} className={`flex items-center gap-3 text-xs font-medium ${f.active ? 'text-text-secondary' : 'text-text-muted/40'}`}>
              {f.active ? (
                <CheckCircle2 size={16} className={`shrink-0 ${plan.type === 'vip' ? 'text-warning-500' : 'text-primary-500'}`} />
              ) : (
                <XCircle size={16} className="shrink-0 opacity-40" />
              )}
              <span className={!f.active ? 'line-through' : ''}>{f.label}</span>
            </div>
          ))}
        </div>

        {/* Footer Area: Active Members + Actions */}
        <div className="pt-5 border-t border-surface-border mt-auto flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{te('card.activeMembers')}</span>
              <span className="text-base font-black text-text-primary font-headline">{activeCount}</span>
            </div>
            <div className="flex -space-x-2 overflow-hidden">
              {avatars.map((av, index) => (
                <img
                  key={index}
                  className="inline-block h-7 w-7 rounded-full ring-2 ring-surface-raised object-cover"
                  src={av}
                  alt="Active Member"
                />
              ))}
              <div className={`h-7 w-7 rounded-full ring-2 ring-surface-raised flex items-center justify-center text-[9px] font-bold ${
                plan.type === 'premium' ? 'bg-primary-500 text-white' :
                plan.type === 'vip' ? 'bg-warning-500 text-text-inverse' :
                'bg-surface-overlay text-text-secondary'
              }`}>
                +{activeCount - avatars.length}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => onEdit(plan)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-surface-overlay hover:bg-surface-border text-text-primary font-semibold text-xs rounded-xl transition-all cursor-pointer"
            >
              <Pencil size={14} />
              {tCommon('actions.edit')}
            </button>
            <button
              onClick={() => onToggle(plan.id)}
              disabled={isToggling}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 font-semibold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50
                ${plan.isActive
                  ? 'bg-danger-500/10 text-danger-500 hover:bg-danger-500/20'
                  : 'bg-success-500/10 text-success-500 hover:bg-success-500/20'
                }`}
            >
              {isToggling ? (
                <Spinner />
              ) : (
                (plan.isActive ? <Ban size={14} /> : <CheckCircle size={14} />)
              )}
              {plan.isActive ? te('card.deactivate') : te('card.activate')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Plan Modal (Create / Edit) ───────────────────────────────────────────────
function PlanModal({
  open,
  editing,
  onClose,
  onSave,
  isLoading,
}: {
  open: boolean;
  editing: SubscriptionPlan | null;
  onClose: () => void;
  onSave: (payload: CreatePlanPayload | UpdatePlanPayload, id?: string) => Promise<void>;
  isLoading: boolean;
}) {
  const { t } = useLanguage();
  const te = t('plans');
  const tCommon = t('common');

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.name,
        type: editing.type,
        durationDays: editing.durationDays,
        price: editing.price,
        description: editing.description ?? '',
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setErrors({});
  }, [editing, open]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = te('validation.nameRequired');
    if (!form.type) e.type = te('validation.typeRequired');
    if (!form.durationDays || form.durationDays < 1) e.durationDays = te('validation.durationMin');
    if (form.price == null || form.price < 0) e.price = te('validation.priceMin');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const payload = {
      name: form.name.trim(),
      type: form.type,
      durationDays: Number(form.durationDays),
      price: Number(form.price),
      description: form.description.trim() || undefined,
    };
    await onSave(payload, editing?.id);
  };

  if (!open) return null;

  return (
    <Modal onClose={onClose} title={editing ? te('modal.editTitle') : te('modal.createTitle')} size="lg">
      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
        {/* Name */}
        <FormField label={te('modal.name')} required error={errors.name}>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder={te('modal.namePlaceholder')}
            className={inputClass(!!errors.name)}
          />
        </FormField>

        {/* Type */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text-secondary">{te('modal.type')} <span className="text-danger-500">*</span></label>
          <div className="grid grid-cols-3 gap-2">
            {PLAN_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setForm((f) => ({ ...f, type: t }))}
                className={`py-2.5 rounded-xl text-sm font-semibold border transition-all cursor-pointer
                  ${form.type === t
                    ? 'border-primary-500 bg-primary-500/10 text-primary-500'
                    : 'border-surface-border bg-surface-raised text-text-secondary hover:border-primary-500/50'
                  }`}
              >
                {TYPE_STYLES[t].icon} {te(`types.${t}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Duration + Price */}
        <div className="grid grid-cols-2 gap-3">
          <FormField label={te('modal.duration')} required error={errors.durationDays}>
            <input
              type="number"
              min="1"
              value={form.durationDays}
              onChange={(e) => setForm((f) => ({ ...f, durationDays: Number(e.target.value) }))}
              className={inputClass(!!errors.durationDays)}
            />
          </FormField>
          <FormField label={te('modal.price')} required error={errors.price}>
            <input
              type="number"
              min="0"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
              className={inputClass(!!errors.price)}
            />
          </FormField>
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text-secondary">{te('modal.description')} <span className="text-text-muted font-normal">{te('modal.optional')}</span></label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder={te('modal.descriptionPlaceholder')}
            className={`${inputClass()} resize-none`}
          />
        </div>

        {/* Footer */}
        <ModalFooter onCancel={onClose} cancelLabel={tCommon('actions.cancel')}
          submitLabel={editing ? tCommon('actions.save') : te('addPlan')} loading={isLoading} />
      </form>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PlansPage() {
  const { plans, isLoading, error, fetchPlans, createPlan, updatePlan, togglePlan, clearError } = usePlanStore();
  const { t } = useLanguage();
  const te = t('plans');
  const tCommon = t('common');
  usePageTitle('plans');

  const [filterType, setFilterType] = useState<PlanType | 'all'>('all');
  const [showInactive, setShowInactive] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Initial fetch — include inactive for admins (all=true)
  useEffect(() => {
    fetchPlans({ all: true }).catch(() => {});
  }, [fetchPlans]);

  // Clear store error on unmount
  useEffect(() => () => clearError(), [clearError]);

  // Filtered plans
  const filtered = plans.filter((p) => {
    const typeOk = filterType === 'all' || p.type === filterType;
    const statusOk = showInactive ? true : p.isActive;
    return typeOk && statusOk;
  });

  // Stats
  const stats = {
    total: plans.length,
    active: plans.filter((p) => p.isActive).length,
    basic: plans.filter((p) => p.type === 'basic').length,
    premium: plans.filter((p) => p.type === 'premium').length,
    vip: plans.filter((p) => p.type === 'vip').length,
  };

  // Scroll handler for analytics section
  const scrollToAnalytics = () => {
    document.getElementById('plan-analytics')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Calculate active membership stats for bottom comparison
  let basicMembers = 0;
  let premiumMembers = 0;
  let vipMembers = 0;

  plans.forEach((p) => {
    if (p.isActive) {
      const { count } = getMockActiveMembers(p);
      if (p.type === 'basic') basicMembers += count;
      if (p.type === 'premium') premiumMembers += count;
      if (p.type === 'vip') vipMembers += count;
    }
  });

  const totalMembers = basicMembers + premiumMembers + vipMembers || 1;
  const basicPct = Math.round((basicMembers / totalMembers) * 100);
  const premiumPct = Math.round((premiumMembers / totalMembers) * 100);
  const vipPct = Math.round((vipMembers / totalMembers) * 100);

  const openCreate = useCallback(() => {
    setEditingPlan(null);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditingPlan(null);
  }, []);

  const handleSave = useCallback(
    async (payload: CreatePlanPayload | UpdatePlanPayload, id?: string) => {
      setSaving(true);
      try {
        if (id) {
          await updatePlan(id, payload as UpdatePlanPayload);
          toast.success(te('toast.editSuccess'));
        } else {
          await createPlan(payload as CreatePlanPayload);
          toast.success(te('toast.addSuccess'));
        }
        closeModal();
      } catch {
        toast.error(te('toast.error'));
      } finally {
        setSaving(false);
      }
    },
    [createPlan, updatePlan, closeModal, te]
  );

  const handleToggle = useCallback(
    async (id: string) => {
      setTogglingId(id);
      try {
        await togglePlan(id);
        const plan = plans.find((p) => p.id === id);
        toast.success(plan?.isActive ? te('toast.deactivateSuccess') : te('toast.activateSuccess'));
      } catch {
        toast.error(te('toast.toggleError'));
      } finally {
        setTogglingId(null);
      }
    },
    [togglePlan, plans, te]
  );

  const filterOptions = ['all', ...PLAN_TYPES] as const;

  return (
    <>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto">
        {/* Page header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <PageHeader
            title={te('title')}
            subtitle={te('subtitle')}
          />
          <div className="flex items-center gap-3">
            <button
              onClick={scrollToAnalytics}
              className="px-4 py-2.5 bg-surface-overlay hover:bg-surface-border text-text-primary font-bold text-xs rounded-xl transition-all flex items-center gap-2 active:scale-95 cursor-pointer border border-surface-border"
            >
              <PieChart size={16} className="text-primary-500" />
              {te('revenueReport')}
            </button>
            <AddButton onClick={openCreate} label={te('addPlan')} />
          </div>
        </div>

        {/* Error banner */}
        {error && <Alert onDismiss={clearError}>{error}</Alert>}

        {/* Stats row */}
        <StatsGrid
          isLoading={isLoading}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4"
          items={[
            { label: te('stats.total'), value: stats.total, color: 'primary' },
            { label: te('stats.active'), value: stats.active, color: 'success' },
            { label: `☁️ ${te('types.basic')}`, value: stats.basic, color: 'secondary' },
            { label: `🔥 ${te('types.premium')}`, value: stats.premium, color: 'primary' },
            { label: `👑 ${te('types.vip')}`, value: stats.vip, color: 'warning' },
          ]}
        />

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2">
          <SegmentedControl<PlanType | 'all'> value={filterType} onChange={setFilterType}
            options={filterOptions.map((opt) => ({ value: opt, label: opt === 'all' ? tCommon('filters.all') : te(`types.${opt}`) }))} />

          {/* Show inactive toggle */}
          <button
            onClick={() => setShowInactive((v) => !v)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer
              ${showInactive
                ? 'border-primary-500 bg-primary-500/10 text-primary-500'
                : 'border-surface-border text-text-secondary hover:border-primary-500/50'
              }`}
          >
            <Eye size={14} />
            {te('filters.showInactive')}
          </button>

          <span className="ml-auto text-xs text-text-muted">{filtered.length} {te('count')}</span>
        </div>

        {/* Loading skeleton */}
        {isLoading && plans.length === 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-2xl border border-surface-border bg-surface-base p-5 flex flex-col gap-3 animate-pulse">
                <div className="h-1.5 w-full bg-surface-overlay rounded-full" />
                <div className="flex gap-2">
                  <div className="h-6 w-20 bg-surface-overlay rounded-full" />
                  <div className="h-6 w-16 bg-surface-overlay rounded-full ml-auto" />
                </div>
                <div className="h-5 w-3/4 bg-surface-overlay rounded" />
                <div className="h-4 w-1/2 bg-surface-overlay rounded" />
                <div className="h-8 w-full bg-surface-overlay rounded-xl mt-2" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <span className="text-5xl">📋</span>
            <div>
              <p className="text-base font-semibold text-text-primary">{te('empty.title')}</p>
              <p className="text-sm text-text-muted mt-1">
                {filterType !== 'all' ? te('empty.noResult') : te('empty.description')}
              </p>
            </div>
            {filterType === 'all' && (
              <button
                onClick={openCreate}
                className="px-4 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-sm font-semibold text-white transition-all cursor-pointer"
              >
                + {te('addPlan')}
              </button>
            )}
          </div>
        )}

        {/* Plans grid */}
        {!isLoading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onEdit={openEdit}
                onToggle={handleToggle}
                toggling={togglingId}
              />
            ))}
          </div>
        )}

        {/* Tier Analytics & Performance Comparison */}
        {!isLoading && plans.length > 0 && (
          <div id="plan-analytics" className="mt-12 grid grid-cols-1 lg:grid-cols-4 gap-6 pt-10 border-t border-surface-border">
            <div className="lg:col-span-1 bg-surface-raised p-6 rounded-2xl flex flex-col justify-between border border-surface-border">
              <div>
                <span className="text-primary-500 text-2xl mb-4 block">📈</span>
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5 font-headline">{te('analytics.churnRate')}</h4>
                <p className="text-3xl font-black text-text-primary font-headline">2.4%</p>
              </div>
              <p className="text-[11px] text-text-secondary mt-4">
                {te('analytics.churnDesc')}
              </p>
            </div>

            <div className="lg:col-span-3 bg-surface-raised p-6 rounded-2xl border border-surface-border flex flex-col justify-between">
              <div className="flex items-center justify-between mb-8">
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary font-headline">
                  {te('analytics.allocationTitle')}
                </h4>
                <div className="flex gap-4 text-xs font-medium">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
                    <span className="text-text-secondary">{te('types.basic')}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary-500"></div>
                    <span className="text-text-secondary">{te('types.premium')}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-warning-500"></div>
                    <span className="text-text-secondary">{te('types.vip')}</span>
                  </div>
                </div>
              </div>

              {/* Dynamic bar representation */}
              <div className="flex items-end gap-6 h-36">
                <div
                  style={{ height: `${basicPct}%` }}
                  className="flex-1 bg-slate-700 rounded-t-lg group relative min-h-[10%]"
                >
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-text-primary bg-surface-overlay px-1.5 py-0.5 rounded border border-surface-border z-10 whitespace-nowrap">
                    {te('analytics.basicHover').replace('{{pct}}', String(basicPct)).replace('{{count}}', String(basicMembers))}
                  </div>
                </div>
                <div
                  style={{ height: `${premiumPct}%` }}
                  className="flex-1 bg-primary-500 rounded-t-lg group relative min-h-[10%] shadow-lg shadow-primary-500/20"
                >
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-text-primary bg-surface-overlay px-1.5 py-0.5 rounded border border-surface-border z-10 whitespace-nowrap">
                    {te('analytics.premiumHover').replace('{{pct}}', String(premiumPct)).replace('{{count}}', String(premiumMembers))}
                  </div>
                </div>
                <div
                  style={{ height: `${vipPct}%` }}
                  className="flex-1 bg-warning-500 rounded-t-lg group relative min-h-[10%] shadow-lg shadow-warning-500/20"
                >
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-text-primary bg-surface-overlay px-1.5 py-0.5 rounded border border-surface-border z-10 whitespace-nowrap">
                    {te('analytics.vipHover').replace('{{pct}}', String(vipPct)).replace('{{count}}', String(vipMembers))}
                  </div>
                </div>
                <div className="flex-1 h-full border-t border-dashed border-surface-border flex items-center justify-center">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider text-center">
                    {te('analytics.growthOpportunity')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <PlanModal
        open={modalOpen}
        editing={editingPlan}
        onClose={closeModal}
        onSave={handleSave}
        isLoading={saving}
      />
    </>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePlanStore } from '@/src/stores/planStore';
import { toast } from '@/src/utils/toast';
import type { SubscriptionPlan, PlanType, CreatePlanPayload, UpdatePlanPayload } from '@/src/types/plan.types';

// ─── Constants ────────────────────────────────────────────────────────────────
const PLAN_TYPES: { value: PlanType; label: string }[] = [
  { value: 'basic', label: 'Cơ bản' },
  { value: 'premium', label: 'Premium' },
  { value: 'vip', label: 'VIP' },
];

const TYPE_STYLES: Record<PlanType, { badge: string; card: string; icon: string }> = {
  basic:   { badge: 'bg-sky-500/15 text-sky-500',      card: 'from-sky-500/10 to-transparent',    icon: '☁️' },
  premium: { badge: 'bg-primary-500/15 text-primary-500', card: 'from-primary-500/10 to-transparent', icon: '🔥' },
  vip:     { badge: 'bg-violet-500/15 text-violet-500', card: 'from-violet-500/10 to-transparent',  icon: '👑' },
};

// ─── Empty form state ─────────────────────────────────────────────────────────
const EMPTY_FORM = { name: '', type: 'basic' as PlanType, durationDays: 30, price: 0, description: '' };

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
  const styles = TYPE_STYLES[plan.type];
  const isToggling = toggling === plan.id;

  return (
    <div
      className={`
        relative rounded-2xl border border-surface-border bg-surface-base
        flex flex-col overflow-hidden
        transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5
        ${!plan.isActive ? 'opacity-60' : ''}
      `}
    >
      {/* Gradient header strip */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${styles.card}`} />

      <div className="p-5 flex flex-col gap-3 flex-1">
        {/* Top row: type badge + status */}
        <div className="flex items-center justify-between gap-2">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${styles.badge}`}>
            <span>{styles.icon}</span>
            {plan.typeLabel}
          </span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
            ${plan.isActive
              ? 'bg-success-500/15 text-success-500'
              : 'bg-surface-overlay text-text-muted'
            }`}>
            {plan.isActive ? 'Hoạt động' : 'Tạm dừng'}
          </span>
        </div>

        {/* Name */}
        <h3 className="text-base font-bold text-text-primary leading-snug">{plan.name}</h3>

        {/* Duration + Price */}
        <div className="flex items-end justify-between">
          <div className="flex items-center gap-1.5 text-sm text-text-muted">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
            {plan.durationLabel}
          </div>
          <p className="text-lg font-extrabold text-primary-500">{plan.priceLabel}</p>
        </div>

        {/* Description */}
        {plan.description && (
          <p className="text-xs text-text-muted leading-relaxed line-clamp-2 border-t border-surface-border pt-3">
            {plan.description}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-auto pt-3 border-t border-surface-border">
          <button
            onClick={() => onEdit(plan)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl
              text-xs font-semibold text-text-secondary
              bg-surface-overlay hover:bg-surface-border hover:text-text-primary
              transition-all duration-150 cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
            </svg>
            Chỉnh sửa
          </button>
          <button
            onClick={() => onToggle(plan.id)}
            disabled={isToggling}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl
              text-xs font-semibold transition-all duration-150 cursor-pointer disabled:opacity-50
              ${plan.isActive
                ? 'bg-danger-500/10 text-danger-500 hover:bg-danger-500/20'
                : 'bg-success-500/10 text-success-500 hover:bg-success-500/20'
              }`}
          >
            {isToggling ? (
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d={plan.isActive
                  ? "M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
                  : "M5.636 5.636a9 9 0 1 0 12.728 12.728M5.636 5.636a9 9 0 0 1 12.728 12.728M5.636 5.636 12 12m6.364-6.364L12 12"
                } />
              </svg>
            )}
            {plan.isActive ? 'Tạm dừng' : 'Kích hoạt'}
          </button>
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
    if (!form.name.trim()) e.name = 'Tên gói là bắt buộc';
    if (!form.type) e.type = 'Loại gói là bắt buộc';
    if (!form.durationDays || form.durationDays < 1) e.durationDays = 'Thời hạn phải ≥ 1 ngày';
    if (form.price == null || form.price < 0) e.price = 'Giá phải ≥ 0';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div className="relative w-full max-w-lg bg-surface-base rounded-2xl shadow-2xl border border-surface-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
          <h2 className="text-base font-bold text-text-primary">
            {editing ? 'Chỉnh sửa gói tập' : 'Thêm gói tập mới'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-overlay transition-all cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary">Tên gói <span className="text-danger-500">*</span></label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="VD: Gói Premium 3 tháng"
              className={`w-full px-3 py-2.5 rounded-xl border text-sm text-text-primary bg-surface-raised placeholder-text-muted outline-none
                transition-all duration-150
                ${errors.name ? 'border-danger-500 focus:ring-2 focus:ring-danger-500/30' : 'border-surface-border focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'}`}
            />
            {errors.name && <p className="text-xs text-danger-500">{errors.name}</p>}
          </div>

          {/* Type */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary">Loại gói <span className="text-danger-500">*</span></label>
            <div className="grid grid-cols-3 gap-2">
              {PLAN_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, type: t.value }))}
                  className={`py-2.5 rounded-xl text-sm font-semibold border transition-all cursor-pointer
                    ${form.type === t.value
                      ? 'border-primary-500 bg-primary-500/10 text-primary-500'
                      : 'border-surface-border bg-surface-raised text-text-secondary hover:border-primary-500/50'
                    }`}
                >
                  {TYPE_STYLES[t.value].icon} {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Duration + Price */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-secondary">Thời hạn (ngày) <span className="text-danger-500">*</span></label>
              <input
                type="number"
                min="1"
                value={form.durationDays}
                onChange={(e) => setForm((f) => ({ ...f, durationDays: Number(e.target.value) }))}
                className={`w-full px-3 py-2.5 rounded-xl border text-sm text-text-primary bg-surface-raised outline-none
                  transition-all duration-150
                  ${errors.durationDays ? 'border-danger-500 focus:ring-2 focus:ring-danger-500/30' : 'border-surface-border focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'}`}
              />
              {errors.durationDays && <p className="text-xs text-danger-500">{errors.durationDays}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-secondary">Giá (VNĐ) <span className="text-danger-500">*</span></label>
              <input
                type="number"
                min="0"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
                className={`w-full px-3 py-2.5 rounded-xl border text-sm text-text-primary bg-surface-raised outline-none
                  transition-all duration-150
                  ${errors.price ? 'border-danger-500 focus:ring-2 focus:ring-danger-500/30' : 'border-surface-border focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'}`}
              />
              {errors.price && <p className="text-xs text-danger-500">{errors.price}</p>}
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary">Mô tả <span className="text-text-muted font-normal">(tuỳ chọn)</span></label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Quyền lợi, ưu đãi của gói..."
              className="w-full px-3 py-2.5 rounded-xl border border-surface-border text-sm text-text-primary bg-surface-raised placeholder-text-muted outline-none resize-none
                focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-150"
            />
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-text-secondary border border-surface-border
                hover:bg-surface-overlay transition-all cursor-pointer"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white
                bg-primary-500 hover:bg-primary-600 disabled:opacity-50
                transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading && (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              )}
              {editing ? 'Lưu thay đổi' : 'Thêm gói tập'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PlansPage() {
  const { plans, isLoading, error, fetchPlans, createPlan, updatePlan, togglePlan, clearError } = usePlanStore();

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
          toast.success('Cập nhật gói tập thành công!');
        } else {
          await createPlan(payload as CreatePlanPayload);
          toast.success('Thêm gói tập thành công!');
        }
        closeModal();
      } catch {
        toast.error('Có lỗi xảy ra, vui lòng thử lại.');
      } finally {
        setSaving(false);
      }
    },
    [createPlan, updatePlan, closeModal]
  );

  const handleToggle = useCallback(
    async (id: string) => {
      setTogglingId(id);
      try {
        await togglePlan(id);
        const plan = plans.find((p) => p.id === id);
        toast.success(plan?.isActive ? 'Đã tạm dừng gói tập.' : 'Đã kích hoạt gói tập!');
      } catch {
        toast.error('Không thể thay đổi trạng thái, vui lòng thử lại.');
      } finally {
        setTogglingId(null);
      }
    },
    [togglePlan, plans]
  );

  return (
    <>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto">
        {/* Page header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Gói tập</h1>
            <p className="text-sm text-text-muted mt-0.5">Quản lý các gói đăng ký dịch vụ phòng gym</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600
              text-sm font-semibold text-white shadow transition-all duration-150 cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Thêm gói tập
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-danger-500/10 border border-danger-500/20 text-danger-500 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
            <span className="flex-1">{error}</span>
            <button onClick={clearError} className="hover:opacity-70 transition-opacity cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Tổng gói', value: stats.total, color: 'text-text-primary' },
            { label: 'Hoạt động', value: stats.active, color: 'text-success-500' },
            { label: '☁️ Cơ bản', value: stats.basic, color: 'text-sky-500' },
            { label: '🔥 Premium', value: stats.premium, color: 'text-primary-500' },
            { label: '👑 VIP', value: stats.vip, color: 'text-violet-500' },
          ].map((s) => (
            <div key={s.label} className="bg-surface-base border border-surface-border rounded-xl px-4 py-3 flex flex-col gap-1">
              <p className="text-xs text-text-muted">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>
                {isLoading ? <span className="inline-block h-7 w-8 bg-surface-overlay rounded animate-pulse" /> : s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 p-1 bg-surface-raised rounded-xl border border-surface-border">
            {([{ value: 'all', label: 'Tất cả' }, ...PLAN_TYPES.map((t) => ({ value: t.value, label: t.label }))] as { value: PlanType | 'all'; label: string }[]).map((f) => (
              <button
                key={f.value}
                onClick={() => setFilterType(f.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer
                  ${filterType === f.value
                    ? 'bg-primary-500 text-white shadow'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-overlay'
                  }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Show inactive toggle */}
          <button
            onClick={() => setShowInactive((v) => !v)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer
              ${showInactive
                ? 'border-primary-500 bg-primary-500/10 text-primary-500'
                : 'border-surface-border text-text-secondary hover:border-primary-500/50'
              }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
            Hiện gói tạm dừng
          </button>

          <span className="ml-auto text-xs text-text-muted">{filtered.length} gói</span>
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
              <p className="text-base font-semibold text-text-primary">Chưa có gói tập nào</p>
              <p className="text-sm text-text-muted mt-1">
                {filterType !== 'all' ? 'Không có gói nào trong bộ lọc hiện tại.' : 'Tạo gói tập đầu tiên để bắt đầu.'}
              </p>
            </div>
            {filterType === 'all' && (
              <button
                onClick={openCreate}
                className="px-4 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-sm font-semibold text-white transition-all cursor-pointer"
              >
                + Thêm gói tập
              </button>
            )}
          </div>
        )}

        {/* Plans grid */}
        {!isLoading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

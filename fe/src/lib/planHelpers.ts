import type { SubscriptionPlanApiData, SubscriptionPlan, PlanType } from '@/src/types/plan.types';

// ─── Type labels ──────────────────────────────────────────────────────────────
const PLAN_TYPE_LABELS: Record<PlanType, string> = {
  basic: 'Cơ bản',
  premium: 'Premium',
  vip: 'VIP',
};

// ─── Duration formatter ───────────────────────────────────────────────────────
export const formatDuration = (days: number): string => {
  if (days >= 365 && days % 365 === 0) return `${days / 365} năm`;
  if (days >= 30 && days % 30 === 0) return `${days / 30} tháng`;
  return `${days} ngày`;
};

// ─── Price formatter (VND) ────────────────────────────────────────────────────
export const formatPrice = (price: number): string =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

// ─── Transform API data → Frontend model ─────────────────────────────────────
export const transformPlan = (api: SubscriptionPlanApiData): SubscriptionPlan => ({
  id: api._id,
  name: api.name,
  type: api.type,
  durationDays: api.durationDays,
  price: api.price,
  description: api.description,
  isActive: api.isActive,
  createdAt: api.createdAt,
  updatedAt: api.updatedAt,
  // Computed fields
  durationLabel: formatDuration(api.durationDays),
  priceLabel: formatPrice(api.price),
  typeLabel: PLAN_TYPE_LABELS[api.type] ?? api.type,
});

// ─── Error message extractor ──────────────────────────────────────────────────
export const extractErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object') {
    const e = error as any;
    return (
      e?.response?.data?.message ||
      e?.response?.data?.error ||
      e?.message ||
      'Đã xảy ra lỗi không xác định'
    );
  }
  return 'Đã xảy ra lỗi không xác định';
};

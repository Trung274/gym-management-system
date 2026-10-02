import type { SubscriptionPlanApiData, SubscriptionPlan } from '@/src/types/plan.types';

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
});

export { extractErrorMessage } from './errors';

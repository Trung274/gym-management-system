import apiClient from './axios';
import { transformPlan } from './planHelpers';
import type {
  SubscriptionPlan,
  PlanListApiResponse,
  PlanApiResponse,
  CreatePlanPayload,
  UpdatePlanPayload,
  PlanQueryParams,
} from '@/src/types/plan.types';

const BASE = '/subscription-plans';

/**
 * GET /api/v1/subscription-plans
 * Public — chỉ active; ?all=true để lấy cả inactive (cần đăng nhập)
 * ?type=basic|premium|vip để lọc theo loại
 */
export const getPlans = async (params?: PlanQueryParams): Promise<SubscriptionPlan[]> => {
  const response = await apiClient.get<PlanListApiResponse>(BASE, { params });
  return response.data.data.map(transformPlan);
};

/**
 * GET /api/v1/subscription-plans/:id
 */
export const getPlanById = async (id: string): Promise<SubscriptionPlan> => {
  const response = await apiClient.get<PlanApiResponse>(`${BASE}/${id}`);
  return transformPlan(response.data.data);
};

/**
 * POST /api/v1/subscription-plans
 * Requires: protect + checkPermission('plans', 'create')
 */
export const createPlan = async (payload: CreatePlanPayload): Promise<SubscriptionPlan> => {
  const response = await apiClient.post<PlanApiResponse>(BASE, payload);
  return transformPlan(response.data.data);
};

/**
 * PUT /api/v1/subscription-plans/:id
 * Requires: protect + checkPermission('plans', 'update')
 */
export const updatePlan = async (id: string, payload: UpdatePlanPayload): Promise<SubscriptionPlan> => {
  const response = await apiClient.put<PlanApiResponse>(`${BASE}/${id}`, payload);
  return transformPlan(response.data.data);
};

/**
 * PATCH /api/v1/subscription-plans/:id/toggle
 * Requires: protect + checkPermission('plans', 'toggle')
 */
export const togglePlan = async (id: string): Promise<SubscriptionPlan> => {
  const response = await apiClient.patch<PlanApiResponse>(`${BASE}/${id}/toggle`);
  return transformPlan(response.data.data);
};

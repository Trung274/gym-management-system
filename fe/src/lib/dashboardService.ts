import apiClient from './axios';
import type { DashboardSnapshot, DashboardApiResponse } from '@/src/types/dashboard.types';

/** GET /api/v1/dashboard — Requires dashboard:view (Admin, Manager) */
export const getDashboard = async (): Promise<{ snapshot: DashboardSnapshot; generatedAt: string }> => {
  const response = await apiClient.get<DashboardApiResponse>('/dashboard');
  return {
    snapshot:    response.data.data,
    generatedAt: response.data.generatedAt,
  };
};

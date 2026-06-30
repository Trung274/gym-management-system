import apiClient from './axios';
import type { GymInfo, GymInfoApiResponse } from '@/src/types/member-portal.types';

/** GET /api/v1/gym-info — public endpoint, no auth required */
export const getGymInfo = async (): Promise<GymInfo> => {
  const res = await apiClient.get<GymInfoApiResponse>('/gym-info');
  return res.data.data;
};

/** PUT /api/v1/gym-info — Private (Admin) */
export const updateGymInfo = async (payload: Partial<GymInfo>): Promise<GymInfo> => {
  const res = await apiClient.put<GymInfoApiResponse>('/gym-info', payload);
  return res.data.data;
};

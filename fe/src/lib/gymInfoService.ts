import apiClient from './axios';
import type { GymInfo, GymInfoApiResponse } from '@/src/types/member-portal.types';

/** GET /api/v1/gym-info — public endpoint, no auth required */
export const getGymInfo = async (): Promise<GymInfo> => {
  const res = await apiClient.get<GymInfoApiResponse>('/gym-info');
  return res.data.data;
};

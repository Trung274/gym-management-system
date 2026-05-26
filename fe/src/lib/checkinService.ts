import apiClient from './axios';
import { transformCheckin } from './checkinHelpers';
import type {
  CheckinLog, CheckinStats,
  CheckinListApiResponse, CheckinApiResponse, CheckinStatsApiResponse,
  RecordCheckinPayload, CheckinQueryParams,
} from '@/src/types/checkin.types';

const BASE = '/checkins';

/** POST /api/v1/checkins — Requires checkins:record */
export const recordCheckin = async (payload: RecordCheckinPayload): Promise<CheckinLog> => {
  const response = await apiClient.post<CheckinApiResponse>(BASE, payload);
  return transformCheckin(response.data.data);
};

/** GET /api/v1/checkins — Requires checkins:list
 *  Supports: memberId, date (YYYY-MM-DD), dateFrom, dateTo
 */
export const getCheckins = async (params?: CheckinQueryParams): Promise<CheckinLog[]> => {
  const response = await apiClient.get<CheckinListApiResponse>(BASE, { params });
  return response.data.data.map(transformCheckin);
};

/** GET /api/v1/checkins/stats — Requires checkins:list */
export const getCheckinStats = async (): Promise<CheckinStats> => {
  const response = await apiClient.get<CheckinStatsApiResponse>(`${BASE}/stats`);
  return response.data.data;
};

/** GET /api/v1/checkins/my — Protected (any logged-in user) */
export const getMyCheckins = async (): Promise<CheckinLog[]> => {
  const response = await apiClient.get<CheckinListApiResponse>(`${BASE}/my`);
  return response.data.data.map(transformCheckin);
};

/** GET /api/v1/checkins/member/:memberId — Requires checkins:read */
export const getMemberCheckins = async (memberId: string): Promise<CheckinLog[]> => {
  const response = await apiClient.get<CheckinListApiResponse>(`${BASE}/member/${memberId}`);
  return response.data.data.map(transformCheckin);
};

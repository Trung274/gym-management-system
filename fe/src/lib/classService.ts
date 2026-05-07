import apiClient from './axios';
import { transformClass } from './classHelpers';
import type {
  GymClass, ClassListApiResponse, ClassApiResponse,
  CreateClassPayload, UpdateClassPayload,
  ChangeClassStatusPayload, ClassQueryParams,
} from '@/src/types/class.types';

const BASE = '/classes';

/** GET /api/v1/classes
 *  Mặc định chỉ trả active. Truyền { all: true } để lấy cả cancelled/completed (cần auth).
 */
export const getClasses = async (params?: ClassQueryParams): Promise<GymClass[]> => {
  const response = await apiClient.get<ClassListApiResponse>(BASE, { params });
  return response.data.data.map(transformClass);
};

/** GET /api/v1/classes/:id */
export const getClassById = async (id: string): Promise<GymClass> => {
  const response = await apiClient.get<ClassApiResponse>(`${BASE}/${id}`);
  return transformClass(response.data.data);
};

/** POST /api/v1/classes — Requires classes:create */
export const createClass = async (payload: CreateClassPayload): Promise<GymClass> => {
  const response = await apiClient.post<ClassApiResponse>(BASE, payload);
  return transformClass(response.data.data);
};

/** PUT /api/v1/classes/:id — Requires classes:update */
export const updateClass = async (id: string, payload: UpdateClassPayload): Promise<GymClass> => {
  const response = await apiClient.put<ClassApiResponse>(`${BASE}/${id}`, payload);
  return transformClass(response.data.data);
};

/** PATCH /api/v1/classes/:id/status — Requires classes:status
 *  status: 'active' | 'cancelled' | 'completed'
 */
export const changeClassStatus = async (id: string, payload: ChangeClassStatusPayload): Promise<GymClass> => {
  const response = await apiClient.patch<ClassApiResponse>(`${BASE}/${id}/status`, payload);
  return transformClass(response.data.data);
};

import apiClient from './axios';
import { transformEquipment } from './equipmentHelpers';
import type {
  Equipment, EquipmentListApiResponse, EquipmentApiResponse,
  CreateEquipmentPayload, UpdateEquipmentPayload,
  ChangeEquipmentStatusPayload, EquipmentQueryParams,
} from '@/src/types/equipment.types';

const BASE = '/equipment';

/** GET /api/v1/equipment — Public. ?category= ?status= */
export const getEquipment = async (params?: EquipmentQueryParams): Promise<Equipment[]> => {
  const response = await apiClient.get<EquipmentListApiResponse>(BASE, { params });
  return response.data.data.map(transformEquipment);
};

/** GET /api/v1/equipment/:id — Public */
export const getEquipmentById = async (id: string): Promise<Equipment> => {
  const response = await apiClient.get<EquipmentApiResponse>(`${BASE}/${id}`);
  return transformEquipment(response.data.data);
};

/** POST /api/v1/equipment — Requires equipment:create */
export const createEquipment = async (payload: CreateEquipmentPayload): Promise<Equipment> => {
  const response = await apiClient.post<EquipmentApiResponse>(BASE, payload);
  return transformEquipment(response.data.data);
};

/** PUT /api/v1/equipment/:id — Requires equipment:update */
export const updateEquipment = async (id: string, payload: UpdateEquipmentPayload): Promise<Equipment> => {
  const response = await apiClient.put<EquipmentApiResponse>(`${BASE}/${id}`, payload);
  return transformEquipment(response.data.data);
};

/** PATCH /api/v1/equipment/:id/status — Requires equipment:status (auto-sets lastMaintenanceDate when → maintenance) */
export const changeEquipmentStatus = async (id: string, payload: ChangeEquipmentStatusPayload): Promise<Equipment> => {
  const response = await apiClient.patch<EquipmentApiResponse>(`${BASE}/${id}/status`, payload);
  return transformEquipment(response.data.data);
};

/** DELETE /api/v1/equipment/:id — Requires equipment:delete (Admin only) */
export const deleteEquipment = async (id: string): Promise<void> => {
  await apiClient.delete(`${BASE}/${id}`);
};

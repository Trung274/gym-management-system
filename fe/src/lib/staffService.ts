import apiClient from './axios';
import { transformStaff } from './staffHelpers';
import type {
  StaffMember,
  StaffListApiResponse,
  StaffApiResponse,
  CreateStaffPayload,
  UpdateStaffPayload,
  AssignRolePayload,
  StaffQueryParams,
  PaginationInfo,
} from '@/src/types/staff.types';

const BASE = '/staff';

/**
 * GET /api/v1/staff
 * Requires: staff:list
 */
export const getStaff = async (
  params?: StaffQueryParams
): Promise<{ staff: StaffMember[]; pagination: PaginationInfo }> => {
  const response = await apiClient.get<StaffListApiResponse>(BASE, { params });
  const { data, count, total, currentPage, totalPages } = response.data;
  return {
    staff: data.map(transformStaff),
    pagination: { count, total, currentPage, totalPages },
  };
};

/**
 * GET /api/v1/staff/:id
 * Requires: staff:read
 */
export const getStaffById = async (id: string): Promise<StaffMember> => {
  const response = await apiClient.get<StaffApiResponse>(`${BASE}/${id}`);
  return transformStaff(response.data.data);
};

/**
 * POST /api/v1/staff
 * Requires: staff:create
 */
export const createStaff = async (payload: CreateStaffPayload): Promise<StaffMember> => {
  const response = await apiClient.post<StaffApiResponse>(BASE, payload);
  return transformStaff(response.data.data);
};

/**
 * PUT /api/v1/staff/:id
 * Requires: staff:update — chỉ update name, email
 */
export const updateStaff = async (
  id: string,
  payload: UpdateStaffPayload
): Promise<StaffMember> => {
  const response = await apiClient.put<StaffApiResponse>(`${BASE}/${id}`, payload);
  return transformStaff(response.data.data);
};

/**
 * PUT /api/v1/staff/:id/role
 * Requires: staff:update
 */
export const assignRole = async (
  id: string,
  payload: AssignRolePayload
): Promise<StaffMember> => {
  const response = await apiClient.put<StaffApiResponse>(`${BASE}/${id}/role`, payload);
  return transformStaff(response.data.data);
};

/**
 * PATCH /api/v1/staff/:id/deactivate
 * Requires: staff:deactivate
 */
export const deactivateStaff = async (id: string): Promise<StaffMember> => {
  const response = await apiClient.patch<StaffApiResponse>(`${BASE}/${id}/deactivate`);
  return transformStaff(response.data.data);
};

/**
 * PATCH /api/v1/staff/:id/activate
 * Requires: staff:deactivate
 */
export const activateStaff = async (id: string): Promise<StaffMember> => {
  const response = await apiClient.patch<StaffApiResponse>(`${BASE}/${id}/activate`);
  return transformStaff(response.data.data);
};

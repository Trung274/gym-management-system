import apiClient from './axios';
import { transformStaff } from './staffHelpers';
import type { StaffListApiResponse, StaffApiResponse } from '@/src/types/staff.types';
import type { UserAccount, UserQueryParams, PaginationInfo } from '@/src/types/user.types';
import type { RoleName } from '@/src/lib/roles';

const BASE = '/users';

/**
 * GET /api/v1/users
 * Admin only — accounts of every role
 */
export const getUsers = async (
  params?: UserQueryParams
): Promise<{ users: UserAccount[]; pagination: PaginationInfo }> => {
  const response = await apiClient.get<StaffListApiResponse>(BASE, { params });
  const { data, count, total, currentPage, totalPages } = response.data;
  return {
    users: data.map(transformStaff),
    pagination: { count, total, currentPage, totalPages },
  };
};

/**
 * PATCH /api/v1/users/:id/status
 * Admin only — deactivating signs the account out everywhere
 */
export const setUserStatus = async (id: string, isActive: boolean): Promise<UserAccount> => {
  const response = await apiClient.patch<StaffApiResponse>(`${BASE}/${id}/status`, { isActive });
  return transformStaff(response.data.data);
};

/**
 * PATCH /api/v1/users/:id/role
 * Admin only — admin / manager / staff accounts
 */
export const changeUserRole = async (id: string, roleName: RoleName): Promise<UserAccount> => {
  const response = await apiClient.patch<StaffApiResponse>(`${BASE}/${id}/role`, { roleName });
  return transformStaff(response.data.data);
};

/**
 * PATCH /api/v1/users/:id/password
 * Admin only — signs the account out everywhere
 */
export const resetUserPassword = async (id: string, password: string): Promise<void> => {
  await apiClient.patch(`${BASE}/${id}/password`, { password });
};

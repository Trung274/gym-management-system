import apiClient from './axios';
import type {
  RoleApiData,
  PermissionApiData,
  RoleWithPermissions,
  PermissionItem,
  RoleListApiResponse,
  RoleApiResponse,
  PermissionListApiResponse,
} from '@/src/types/role.types';

// ─── Transform ────────────────────────────────────────────────────────────────
const transformPermission = (api: PermissionApiData): PermissionItem => ({
  id: api._id,
  resource: api.resource,
  action: api.action,
  description: api.description ?? '',
});

const transformRole = (api: RoleApiData): RoleWithPermissions => ({
  id: api._id,
  name: api.name,
  description: api.description ?? '',
  permissionIds: (api.permissions ?? []).map((p) => p._id),
});

/**
 * GET /api/v1/roles
 * Admin only — permissions are populated
 */
export const getRoles = async (): Promise<RoleWithPermissions[]> => {
  const response = await apiClient.get<RoleListApiResponse>('/roles');
  return response.data.data.map(transformRole);
};

/**
 * GET /api/v1/permissions
 * Admin only
 */
export const getPermissions = async (): Promise<PermissionItem[]> => {
  const response = await apiClient.get<PermissionListApiResponse>('/permissions');
  return response.data.data.map(transformPermission);
};

/**
 * PUT /api/v1/roles/:id
 * Admin only — replaces the role's permission list
 */
export const updateRolePermissions = async (roleId: string, permissionIds: string[]): Promise<RoleWithPermissions> => {
  const response = await apiClient.put<RoleApiResponse>(`/roles/${roleId}`, { permissions: permissionIds });
  return transformRole(response.data.data);
};

// ─── Roles & permissions — Permissions page (admin only) ──────────────────────
import type { RoleName } from '@/src/lib/roles';

// ─── Frontend Model (sau khi transform) ───────────────────────────────────────
export interface PermissionItem {
  id: string;
  resource: string;   // VD: "members"
  action: string;     // VD: "list"
  description: string;
}

export interface RoleWithPermissions {
  id: string;
  name: RoleName;
  description: string;
  permissionIds: string[];
}

// ─── API Raw Response ─────────────────────────────────────────────────────────
export interface PermissionApiData {
  _id: string;
  resource: string;
  action: string;
  description?: string;
}

export interface RoleApiData {
  _id: string;
  name: RoleName;
  description?: string;
  permissions: PermissionApiData[];
}

export interface RoleListApiResponse {
  success: boolean;
  count: number;
  data: RoleApiData[];
}

export interface RoleApiResponse {
  success: boolean;
  data: RoleApiData;
}

export interface PermissionListApiResponse {
  success: boolean;
  count: number;
  data: PermissionApiData[];
}

// ─── Zustand Store State ──────────────────────────────────────────────────────
export interface RoleState {
  roles: RoleWithPermissions[];
  permissions: PermissionItem[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchAll: () => Promise<void>;
  saveRolePermissions: (roleId: string, permissionIds: string[]) => Promise<RoleWithPermissions>;
  clearError: () => void;
}

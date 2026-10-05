// ─── Accounts of every role — Users page (admin only) ─────────────────────────
// The API returns User documents here exactly like /staff, so the staff model is reused.

import type { RoleName } from '@/src/lib/roles';
import type { StaffMember, PaginationInfo } from './staff.types';

export type UserAccount = StaffMember;
export type { PaginationInfo };

// ─── Query Params ─────────────────────────────────────────────────────────────
export interface UserQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: RoleName;
  isActive?: boolean;
}

// ─── Zustand Store State ──────────────────────────────────────────────────────
export interface UserState {
  users: UserAccount[];
  pagination: PaginationInfo | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchUsers: (params?: UserQueryParams) => Promise<void>;
  setStatus: (id: string, isActive: boolean) => Promise<UserAccount>;
  changeRole: (id: string, roleName: RoleName) => Promise<UserAccount>;
  resetPassword: (id: string, password: string) => Promise<void>;
  clearError: () => void;
}

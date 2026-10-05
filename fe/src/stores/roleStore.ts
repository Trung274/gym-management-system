import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { extractErrorMessage } from '@/src/lib/errors';
import * as roleService from '@/src/lib/roleService';
import type { RoleState } from '@/src/types/role.types';

// Only loading writes `error` (page banner); save failures are shown by the page as toasts.
export const useRoleStore = create<RoleState>()(
  devtools(
    (set) => ({
      roles: [],
      permissions: [],
      isLoading: false,
      error: null,

      fetchAll: async () => {
        set({ isLoading: true, error: null });
        try {
          const [roles, permissions] = await Promise.all([roleService.getRoles(), roleService.getPermissions()]);
          set({ roles, permissions, isLoading: false });
        } catch (error) {
          set({ error: extractErrorMessage(error), isLoading: false });
          throw error;
        }
      },

      saveRolePermissions: async (roleId: string, permissionIds: string[]) => {
        const updated = await roleService.updateRolePermissions(roleId, permissionIds);
        set((state) => ({ roles: state.roles.map((r) => (r.id === roleId ? updated : r)) }));
        return updated;
      },

      clearError: () => set({ error: null }),
    }),
    { name: 'role-store' }
  )
);

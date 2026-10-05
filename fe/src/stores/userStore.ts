import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { extractErrorMessage } from '@/src/lib/errors';
import * as userService from '@/src/lib/userService';
import type { UserState, UserAccount, UserQueryParams } from '@/src/types/user.types';
import type { RoleName } from '@/src/lib/roles';

// Only list loading writes `error` (page banner); action failures are shown by the page as toasts.
export const useUserStore = create<UserState>()(
  devtools(
    (set) => {
      const replace = (updated: UserAccount) =>
        set((state) => ({ users: state.users.map((u) => (u.id === updated.id ? updated : u)) }));

      return {
        users: [],
        pagination: null,
        isLoading: false,
        error: null,

        fetchUsers: async (params?: UserQueryParams) => {
          set({ isLoading: true, error: null });
          try {
            const { users, pagination } = await userService.getUsers(params);
            set({ users, pagination, isLoading: false });
          } catch (error) {
            set({ error: extractErrorMessage(error), isLoading: false });
            throw error;
          }
        },

        setStatus: async (id: string, isActive: boolean) => {
          const updated = await userService.setUserStatus(id, isActive);
          replace(updated);
          return updated;
        },

        changeRole: async (id: string, roleName: RoleName) => {
          const updated = await userService.changeUserRole(id, roleName);
          replace(updated);
          return updated;
        },

        resetPassword: async (id: string, password: string) => {
          await userService.resetUserPassword(id, password);
        },

        clearError: () => set({ error: null }),
      };
    },
    { name: 'user-store' }
  )
);

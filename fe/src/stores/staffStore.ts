import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { extractErrorMessage } from '@/src/lib/staffHelpers';
import * as staffService from '@/src/lib/staffService';
import type {
  StaffState,
  StaffMember,
  CreateStaffPayload,
  UpdateStaffPayload,
  AssignRolePayload,
  StaffQueryParams,
} from '@/src/types/staff.types';

export const useStaffStore = create<StaffState>()(
  devtools(
    (set, get) => ({
      staff: [],
      pagination: null,
      isLoading: false,
      error: null,

      fetchStaff: async (params?: StaffQueryParams) => {
        set({ isLoading: true, error: null });
        try {
          const { staff, pagination } = await staffService.getStaff(params);
          set({ staff, pagination, isLoading: false });
        } catch (error) {
          set({ error: extractErrorMessage(error), isLoading: false });
          throw error;
        }
      },

      createStaff: async (payload: CreateStaffPayload): Promise<StaffMember> => {
        set({ isLoading: true, error: null });
        try {
          const newStaff = await staffService.createStaff(payload);
          set((state) => ({ staff: [newStaff, ...state.staff], isLoading: false }));
          return newStaff;
        } catch (error) {
          set({ error: extractErrorMessage(error), isLoading: false });
          throw error;
        }
      },

      updateStaff: async (id: string, payload: UpdateStaffPayload): Promise<StaffMember> => {
        set({ isLoading: true, error: null });
        try {
          const updated = await staffService.updateStaff(id, payload);
          set((state) => ({
            staff: state.staff.map((s) => (s.id === id ? updated : s)),
            isLoading: false,
          }));
          return updated;
        } catch (error) {
          set({ error: extractErrorMessage(error), isLoading: false });
          throw error;
        }
      },

      assignRole: async (id: string, payload: AssignRolePayload): Promise<StaffMember> => {
        set({ error: null });
        try {
          const updated = await staffService.assignRole(id, payload);
          set((state) => ({
            staff: state.staff.map((s) => (s.id === id ? updated : s)),
          }));
          return updated;
        } catch (error) {
          set({ error: extractErrorMessage(error) });
          throw error;
        }
      },

      deactivateStaff: async (id: string) => {
        set({ error: null });
        try {
          const updated = await staffService.deactivateStaff(id);
          set((state) => ({
            staff: state.staff.map((s) => (s.id === id ? updated : s)),
          }));
        } catch (error) {
          set({ error: extractErrorMessage(error) });
          throw error;
        }
      },

      activateStaff: async (id: string) => {
        set({ error: null });
        try {
          const updated = await staffService.activateStaff(id);
          set((state) => ({
            staff: state.staff.map((s) => (s.id === id ? updated : s)),
          }));
        } catch (error) {
          set({ error: extractErrorMessage(error) });
          throw error;
        }
      },

      clearError: () => set({ error: null }),
    }),
    { name: 'staff-store' }
  )
);

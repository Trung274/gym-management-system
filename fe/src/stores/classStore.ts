import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { extractErrorMessage } from '@/src/lib/classHelpers';
import * as classService from '@/src/lib/classService';
import type {
  ClassState, GymClass,
  CreateClassPayload, UpdateClassPayload,
  ChangeClassStatusPayload, ClassQueryParams,
} from '@/src/types/class.types';

export const useClassStore = create<ClassState>()(
  devtools(
    (set) => ({
      classes:   [],
      isLoading: false,
      error:     null,

      fetchClasses: async (params?: ClassQueryParams) => {
        set({ isLoading: true, error: null });
        try {
          const classes = await classService.getClasses(params);
          set({ classes, isLoading: false });
        } catch (error) {
          set({ error: extractErrorMessage(error), isLoading: false });
          throw error;
        }
      },

      createClass: async (payload: CreateClassPayload): Promise<GymClass> => {
        set({ isLoading: true, error: null });
        try {
          const created = await classService.createClass(payload);
          set((state) => ({ classes: [created, ...state.classes], isLoading: false }));
          return created;
        } catch (error) {
          set({ error: extractErrorMessage(error), isLoading: false });
          throw error;
        }
      },

      updateClass: async (id: string, payload: UpdateClassPayload): Promise<GymClass> => {
        set({ isLoading: true, error: null });
        try {
          const updated = await classService.updateClass(id, payload);
          set((state) => ({
            classes:   state.classes.map((c) => (c.id === id ? updated : c)),
            isLoading: false,
          }));
          return updated;
        } catch (error) {
          set({ error: extractErrorMessage(error), isLoading: false });
          throw error;
        }
      },

      changeStatus: async (id: string, payload: ChangeClassStatusPayload) => {
        set({ error: null });
        try {
          const updated = await classService.changeClassStatus(id, payload);
          set((state) => ({
            classes: state.classes.map((c) => (c.id === id ? updated : c)),
          }));
        } catch (error) {
          set({ error: extractErrorMessage(error) });
          throw error;
        }
      },

      clearError: () => set({ error: null }),
    }),
    { name: 'class-store' }
  )
);

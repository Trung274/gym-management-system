import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { extractErrorMessage } from '@/src/lib/planHelpers';
import * as planService from '@/src/lib/planService';
import type { PlanState, SubscriptionPlan, CreatePlanPayload, UpdatePlanPayload, PlanQueryParams } from '@/src/types/plan.types';

export const usePlanStore = create<PlanState>()(
  devtools(
    (set, get) => ({
      plans: [],
      isLoading: false,
      error: null,

      fetchPlans: async (params?: PlanQueryParams) => {
        set({ isLoading: true, error: null });
        try {
          const plans = await planService.getPlans(params);
          set({ plans, isLoading: false });
        } catch (error) {
          set({ error: extractErrorMessage(error), isLoading: false });
          throw error;
        }
      },

      createPlan: async (payload: CreatePlanPayload): Promise<SubscriptionPlan> => {
        set({ isLoading: true, error: null });
        try {
          const newPlan = await planService.createPlan(payload);
          set((state) => ({ plans: [...state.plans, newPlan], isLoading: false }));
          return newPlan;
        } catch (error) {
          set({ error: extractErrorMessage(error), isLoading: false });
          throw error;
        }
      },

      updatePlan: async (id: string, payload: UpdatePlanPayload): Promise<SubscriptionPlan> => {
        set({ isLoading: true, error: null });
        try {
          const updated = await planService.updatePlan(id, payload);
          set((state) => ({
            plans: state.plans.map((p) => (p.id === id ? updated : p)),
            isLoading: false,
          }));
          return updated;
        } catch (error) {
          set({ error: extractErrorMessage(error), isLoading: false });
          throw error;
        }
      },

      togglePlan: async (id: string) => {
        set({ error: null });
        try {
          const updated = await planService.togglePlan(id);
          set((state) => ({
            plans: state.plans.map((p) => (p.id === id ? updated : p)),
          }));
        } catch (error) {
          set({ error: extractErrorMessage(error) });
          throw error;
        }
      },

      clearError: () => set({ error: null }),
    }),
    { name: 'plan-store' }
  )
);

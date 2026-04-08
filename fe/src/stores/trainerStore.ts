import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { extractErrorMessage } from '@/src/lib/trainerHelpers';
import * as trainerService from '@/src/lib/trainerService';
import type {
  TrainerState, Trainer,
  CreateTrainerPayload, UpdateTrainerPayload, ChangeTrainerStatusPayload, TrainerQueryParams,
} from '@/src/types/trainer.types';

export const useTrainerStore = create<TrainerState>()(
  devtools(
    (set) => ({
      trainers: [],
      isLoading: false,
      error: null,

      fetchTrainers: async (params?: TrainerQueryParams) => {
        set({ isLoading: true, error: null });
        try {
          const trainers = await trainerService.getTrainers(params);
          set({ trainers, isLoading: false });
        } catch (error) {
          set({ error: extractErrorMessage(error), isLoading: false });
          throw error;
        }
      },

      createTrainer: async (payload: CreateTrainerPayload): Promise<Trainer> => {
        set({ isLoading: true, error: null });
        try {
          const created = await trainerService.createTrainer(payload);
          set((state) => ({ trainers: [created, ...state.trainers], isLoading: false }));
          return created;
        } catch (error) {
          set({ error: extractErrorMessage(error), isLoading: false });
          throw error;
        }
      },

      updateTrainer: async (id: string, payload: UpdateTrainerPayload): Promise<Trainer> => {
        set({ isLoading: true, error: null });
        try {
          const updated = await trainerService.updateTrainer(id, payload);
          set((state) => ({
            trainers: state.trainers.map((t) => (t.id === id ? updated : t)),
            isLoading: false,
          }));
          return updated;
        } catch (error) {
          set({ error: extractErrorMessage(error), isLoading: false });
          throw error;
        }
      },

      changeStatus: async (id: string, payload: ChangeTrainerStatusPayload) => {
        set({ error: null });
        try {
          const updated = await trainerService.changeTrainerStatus(id, payload);
          set((state) => ({
            trainers: state.trainers.map((t) => (t.id === id ? updated : t)),
          }));
        } catch (error) {
          set({ error: extractErrorMessage(error) });
          throw error;
        }
      },

      clearError: () => set({ error: null }),
    }),
    { name: 'trainer-store' }
  )
);

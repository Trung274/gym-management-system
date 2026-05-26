import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { extractErrorMessage } from '@/src/lib/checkinHelpers';
import * as checkinService from '@/src/lib/checkinService';
import type {
  CheckinState, CheckinLog,
  RecordCheckinPayload, CheckinQueryParams,
} from '@/src/types/checkin.types';

export const useCheckinStore = create<CheckinState>()(
  devtools(
    (set) => ({
      logs:      [],
      stats:     null,
      isLoading: false,
      error:     null,

      fetchLogs: async (params?: CheckinQueryParams) => {
        set({ isLoading: true, error: null });
        try {
          const logs = await checkinService.getCheckins(params);
          set({ logs, isLoading: false });
        } catch (error) {
          set({ error: extractErrorMessage(error), isLoading: false });
          throw error;
        }
      },

      fetchStats: async () => {
        try {
          const stats = await checkinService.getCheckinStats();
          set({ stats });
        } catch (error) {
          set({ error: extractErrorMessage(error) });
        }
      },

      recordCheckin: async (payload: RecordCheckinPayload): Promise<CheckinLog> => {
        set({ isLoading: true, error: null });
        try {
          const log = await checkinService.recordCheckin(payload);
          set((state) => ({ logs: [log, ...state.logs], isLoading: false }));
          return log;
        } catch (error) {
          set({ error: extractErrorMessage(error), isLoading: false });
          throw error;
        }
      },

      clearError: () => set({ error: null }),
    }),
    { name: 'checkin-store' }
  )
);

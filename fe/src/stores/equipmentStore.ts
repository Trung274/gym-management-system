import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { extractErrorMessage } from '@/src/lib/equipmentHelpers';
import * as equipmentService from '@/src/lib/equipmentService';
import type {
  EquipmentState, Equipment,
  CreateEquipmentPayload, UpdateEquipmentPayload,
  ChangeEquipmentStatusPayload, EquipmentQueryParams,
} from '@/src/types/equipment.types';

export const useEquipmentStore = create<EquipmentState>()(
  devtools(
    (set) => ({
      equipment: [],
      isLoading: false,
      error: null,

      fetchEquipment: async (params?: EquipmentQueryParams) => {
        set({ isLoading: true, error: null });
        try {
          const equipment = await equipmentService.getEquipment(params);
          set({ equipment, isLoading: false });
        } catch (error) {
          set({ error: extractErrorMessage(error), isLoading: false });
          throw error;
        }
      },

      createEquipment: async (payload: CreateEquipmentPayload): Promise<Equipment> => {
        set({ isLoading: true, error: null });
        try {
          const created = await equipmentService.createEquipment(payload);
          set((state) => ({ equipment: [created, ...state.equipment], isLoading: false }));
          return created;
        } catch (error) {
          set({ error: extractErrorMessage(error), isLoading: false });
          throw error;
        }
      },

      updateEquipment: async (id: string, payload: UpdateEquipmentPayload): Promise<Equipment> => {
        set({ isLoading: true, error: null });
        try {
          const updated = await equipmentService.updateEquipment(id, payload);
          set((state) => ({
            equipment: state.equipment.map((e) => (e.id === id ? updated : e)),
            isLoading: false,
          }));
          return updated;
        } catch (error) {
          set({ error: extractErrorMessage(error), isLoading: false });
          throw error;
        }
      },

      changeStatus: async (id: string, payload: ChangeEquipmentStatusPayload) => {
        set({ error: null });
        try {
          const updated = await equipmentService.changeEquipmentStatus(id, payload);
          set((state) => ({
            equipment: state.equipment.map((e) => (e.id === id ? updated : e)),
          }));
        } catch (error) {
          set({ error: extractErrorMessage(error) });
          throw error;
        }
      },

      deleteEquipment: async (id: string) => {
        set({ error: null });
        try {
          await equipmentService.deleteEquipment(id);
          set((state) => ({
            equipment: state.equipment.filter((e) => e.id !== id),
          }));
        } catch (error) {
          set({ error: extractErrorMessage(error) });
          throw error;
        }
      },

      clearError: () => set({ error: null }),
    }),
    { name: 'equipment-store' }
  )
);

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { extractErrorMessage } from '@/src/lib/memberHelpers';
import * as memberService from '@/src/lib/memberService';
import type {
  MemberState, Member,
  CreateMemberPayload, UpdateMemberPayload,
  ChangeStatusPayload, RenewMembershipPayload, MemberQueryParams,
} from '@/src/types/member.types';

export const useMemberStore = create<MemberState>()(
  devtools(
    (set, get) => ({
      members: [],
      pagination: null,
      isLoading: false,
      error: null,
      queryParams: { page: 1, limit: 10 },

      fetchMembers: async (params?: MemberQueryParams) => {
        const merged = { ...get().queryParams, ...params };
        set({ isLoading: true, error: null, queryParams: merged });
        try {
          const { members, pagination } = await memberService.getMembers(merged);
          set({ members, pagination, isLoading: false });
        } catch (error) {
          set({ error: extractErrorMessage(error), isLoading: false });
          throw error;
        }
      },

      createMember: async (payload: CreateMemberPayload): Promise<Member> => {
        set({ isLoading: true, error: null });
        try {
          const created = await memberService.createMember(payload);
          // Re-fetch page 1 để cập nhật list + pagination
          const { members, pagination } = await memberService.getMembers({ page: 1, limit: get().queryParams.limit });
          set({ members, pagination, isLoading: false });
          return created;
        } catch (error) {
          set({ error: extractErrorMessage(error), isLoading: false });
          throw error;
        }
      },

      updateMember: async (id: string, payload: UpdateMemberPayload): Promise<Member> => {
        set({ isLoading: true, error: null });
        try {
          const updated = await memberService.updateMember(id, payload);
          set((state) => ({
            members: state.members.map((m) => (m.id === id ? updated : m)),
            isLoading: false,
          }));
          return updated;
        } catch (error) {
          set({ error: extractErrorMessage(error), isLoading: false });
          throw error;
        }
      },

      changeStatus: async (id: string, payload: ChangeStatusPayload) => {
        set({ error: null });
        try {
          const updated = await memberService.changeStatus(id, payload);
          set((state) => ({
            members: state.members.map((m) => (m.id === id ? updated : m)),
          }));
        } catch (error) {
          set({ error: extractErrorMessage(error) });
          throw error;
        }
      },

      renewMembership: async (id: string, payload: RenewMembershipPayload) => {
        set({ error: null });
        try {
          const updated = await memberService.renewMembership(id, payload);
          set((state) => ({
            members: state.members.map((m) => (m.id === id ? updated : m)),
          }));
        } catch (error) {
          set({ error: extractErrorMessage(error) });
          throw error;
        }
      },

      checkIn: async (id: string) => {
        set({ error: null });
        try {
          const updated = await memberService.checkIn(id);
          set((state) => ({
            members: state.members.map((m) => (m.id === id ? updated : m)),
          }));
        } catch (error) {
          set({ error: extractErrorMessage(error) });
          throw error;
        }
      },

      setQueryParams: (params: MemberQueryParams) => {
        set((state) => ({ queryParams: { ...state.queryParams, ...params } }));
      },

      clearError: () => set({ error: null }),
    }),
    { name: 'member-store' }
  )
);

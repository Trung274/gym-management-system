import apiClient from './axios';
import { transformMember } from './memberHelpers';
import type {
  Member,
  MemberListApiResponse,
  MemberApiResponse,
  CreateMemberPayload,
  UpdateMemberPayload,
  ChangeStatusPayload,
  RenewMembershipPayload,
  MemberQueryParams,
  PaginationInfo,
} from '@/src/types/member.types';

const BASE = '/members';

/** GET /api/v1/members — Requires members:list */
export const getMembers = async (
  params?: MemberQueryParams
): Promise<{ members: Member[]; pagination: PaginationInfo }> => {
  const response = await apiClient.get<MemberListApiResponse>(BASE, { params });
  const { data, count, total, currentPage, totalPages } = response.data;
  return {
    members: data.map(transformMember),
    pagination: { count, total, currentPage, totalPages },
  };
};

/** GET /api/v1/members/:id — Requires members:read */
export const getMemberById = async (id: string): Promise<Member> => {
  const response = await apiClient.get<MemberApiResponse>(`${BASE}/${id}`);
  return transformMember(response.data.data);
};

/** POST /api/v1/members — Requires members:create (tạo User + Member cùng lúc) */
export const createMember = async (payload: CreateMemberPayload): Promise<Member> => {
  const response = await apiClient.post<MemberApiResponse>(BASE, payload);
  return transformMember(response.data.data);
};

/** PUT /api/v1/members/:id — Requires members:update (chỉ Member fields, không đụng User) */
export const updateMember = async (id: string, payload: UpdateMemberPayload): Promise<Member> => {
  const response = await apiClient.put<MemberApiResponse>(`${BASE}/${id}`, payload);
  return transformMember(response.data.data);
};

/** PATCH /api/v1/members/:id/status — Requires members:status (active ↔ suspended) */
export const changeStatus = async (id: string, payload: ChangeStatusPayload): Promise<Member> => {
  const response = await apiClient.patch<MemberApiResponse>(`${BASE}/${id}/status`, payload);
  return transformMember(response.data.data);
};

/** PATCH /api/v1/members/:id/renew — Requires members:update (gia hạn qua planId hoặc endDate) */
export const renewMembership = async (id: string, payload: RenewMembershipPayload): Promise<Member> => {
  const response = await apiClient.patch<MemberApiResponse>(`${BASE}/${id}/renew`, payload);
  return transformMember(response.data.data);
};

/** PATCH /api/v1/members/:id/check-in — Requires members:checkin */
export const checkIn = async (id: string): Promise<Member> => {
  const response = await apiClient.patch<MemberApiResponse>(`${BASE}/${id}/check-in`);
  return transformMember(response.data.data);
};

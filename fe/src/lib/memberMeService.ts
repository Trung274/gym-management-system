import apiClient from './axios';
import type {
  MemberProfile, MemberProfileApiResponse,
  UpdateMemberProfilePayload,
} from '@/src/types/member-portal.types';

/** GET /api/v1/members/me — returns own Member profile */
export const getMemberProfile = async (): Promise<MemberProfile> => {
  const res = await apiClient.get<MemberProfileApiResponse>('/members/me');
  return res.data.data;
};

/** PUT /api/v1/members/me — only phone, emergencyContact, notes */
export const updateMemberProfile = async (
  payload: UpdateMemberProfilePayload
): Promise<MemberProfile> => {
  const res = await apiClient.put<MemberProfileApiResponse>('/members/me', payload);
  return res.data.data;
};

import type { PlanType } from './plan.types';

// ─── Enums ────────────────────────────────────────────────────────────────────
export type MemberStatus = 'active' | 'expired' | 'suspended';
export type Gender = 'male' | 'female' | 'other';

// ─── Nested populated types ───────────────────────────────────────────────────
export interface MemberUserPopulated {
  _id: string;
  name: string;
  email: string;
  isActive: boolean;
}

export interface MemberPlanPopulated {
  _id: string;
  name: string;
  type: PlanType;
  durationDays: number;
  price: number;
  isActive: boolean;
}

// ─── Frontend Model ───────────────────────────────────────────────────────────
export interface Member {
  id: string;           // Member document _id
  userId: string;
  // User info (từ populate)
  name: string;
  email: string;        // login email
  userIsActive: boolean;
  // Member profile fields
  phone?: string;
  memberEmail?: string; // personal contact email
  idCard?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: Gender;
  // Membership
  startDate: string;
  endDate: string;
  status: MemberStatus;
  lastCheckIn?: string;
  subscriptionPlan?: MemberPlanPopulated;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Computed fields
  statusLabel: string;
  genderLabel: string;
  endDateLabel: string;
  lastCheckInLabel: string;
  daysRemaining: number;      // số ngày còn lại
  initials: string;
  planName: string;
}

// ─── API Raw Response (từ aggregate pipeline / populate) ──────────────────────
export interface MemberApiData {
  _id: string;
  id?: string;
  user: MemberUserPopulated;
  phone?: string;
  email?: string;
  idCard?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: Gender;
  startDate: string;
  endDate: string;
  status: MemberStatus;
  lastCheckIn?: string;
  subscriptionPlan?: MemberPlanPopulated;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── API Response Wrappers ────────────────────────────────────────────────────
export interface MemberListApiResponse {
  success: boolean;
  count: number;
  total: number;
  currentPage: number;
  totalPages: number;
  data: MemberApiData[];
}

export interface MemberApiResponse {
  success: boolean;
  data: MemberApiData;
}

// ─── Request Payloads ─────────────────────────────────────────────────────────
export interface CreateMemberPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
  memberEmail?: string;
  idCard?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: Gender;
  planId?: string;       // nếu có → tự tính endDate
  startDate?: string;
  endDate?: string;      // bắt buộc nếu không có planId
  notes?: string;
}

export interface UpdateMemberPayload {
  phone?: string;
  email?: string;        // personal email (memberEmail)
  idCard?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: Gender;
  subscriptionPlan?: string; // plan ObjectId
  notes?: string;
}

export interface ChangeStatusPayload {
  status: 'active' | 'suspended';
}

export interface RenewMembershipPayload {
  planId?: string;
  endDate?: string;
}

// ─── Query Params ─────────────────────────────────────────────────────────────
export interface MemberQueryParams {
  page?: number;
  limit?: number;
  status?: MemberStatus;
  planType?: PlanType;
  search?: string;
}

// ─── Pagination ───────────────────────────────────────────────────────────────
export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  total: number;
  count: number;
}

// ─── Store State ──────────────────────────────────────────────────────────────
export interface MemberState {
  members: Member[];
  pagination: PaginationInfo | null;
  isLoading: boolean;
  error: string | null;
  queryParams: MemberQueryParams;

  fetchMembers: (params?: MemberQueryParams) => Promise<void>;
  createMember: (payload: CreateMemberPayload) => Promise<Member>;
  updateMember: (id: string, payload: UpdateMemberPayload) => Promise<Member>;
  changeStatus: (id: string, payload: ChangeStatusPayload) => Promise<void>;
  renewMembership: (id: string, payload: RenewMembershipPayload) => Promise<void>;
  checkIn: (id: string) => Promise<void>;
  setQueryParams: (params: MemberQueryParams) => void;
  clearError: () => void;
}

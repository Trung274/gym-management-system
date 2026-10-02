import type { MemberApiData, Member } from '@/src/types/member.types';
import { getInitials } from './format';

// ─── Days remaining ────────────────────────────────────────────────────────────
export const calcDaysRemaining = (endDate: string): number => {
  const diff = new Date(endDate).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

// ─── Transform API → Frontend model ───────────────────────────────────────────
export const transformMember = (api: MemberApiData): Member => {
  const days = calcDaysRemaining(api.endDate);
  return {
    id: api._id,
    userId: api.user?._id ?? '',
    name: api.user?.name ?? '—',
    email: api.user?.email ?? '',
    userIsActive: api.user?.isActive ?? false,
    phone: api.phone,
    memberEmail: api.email,
    idCard: api.idCard,
    address: api.address,
    dateOfBirth: api.dateOfBirth,
    gender: api.gender,
    startDate: api.startDate,
    endDate: api.endDate,
    status: api.status,
    lastCheckIn: api.lastCheckIn,
    subscriptionPlan: api.subscriptionPlan,
    notes: api.notes,
    createdAt: api.createdAt,
    updatedAt: api.updatedAt,
    // Computed
    daysRemaining: days,
    initials: getInitials(api.user?.name ?? 'U'),
    planName: api.subscriptionPlan?.name ?? '—',
  };
};

export { extractErrorMessage } from './errors';

import type { MemberApiData, Member, MemberStatus, Gender } from '@/src/types/member.types';

// ─── Status labels ─────────────────────────────────────────────────────────────
const STATUS_LABELS: Record<MemberStatus, string> = {
  active:    'Hoạt động',
  expired:   'Hết hạn',
  suspended: 'Tạm dừng',
};

// ─── Gender labels ─────────────────────────────────────────────────────────────
const GENDER_LABELS: Record<Gender, string> = {
  male:   'Nam',
  female: 'Nữ',
  other:  'Khác',
};

// ─── Date formatter ─────────────────────────────────────────────────────────────
export const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
};

// ─── Days remaining ────────────────────────────────────────────────────────────
export const calcDaysRemaining = (endDate: string): number => {
  const diff = new Date(endDate).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

// ─── Initials from name ────────────────────────────────────────────────────────
export const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

// ─── Transform API → Frontend model ───────────────────────────────────────────
export const transformMember = (api: MemberApiData): Member => {
  const days = calcDaysRemaining(api.endDate);
  return {
    id: api._id,
    userId: api.user?._id ?? '',
    name: api.user?.name ?? 'Không rõ',
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
    statusLabel: STATUS_LABELS[api.status] ?? api.status,
    genderLabel: api.gender ? (GENDER_LABELS[api.gender] ?? api.gender) : '—',
    endDateLabel: formatDate(api.endDate),
    lastCheckInLabel: formatDate(api.lastCheckIn),
    daysRemaining: days,
    initials: getInitials(api.user?.name ?? 'U'),
    planName: api.subscriptionPlan?.name ?? 'Chưa có gói',
  };
};

// ─── Error extractor ───────────────────────────────────────────────────────────
export const extractErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object') {
    const e = error as any;
    return e?.response?.data?.message || e?.response?.data?.error || e?.message || 'Đã xảy ra lỗi không xác định';
  }
  return 'Đã xảy ra lỗi không xác định';
};

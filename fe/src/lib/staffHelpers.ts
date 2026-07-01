import type { StaffApiData, StaffMember, RoleName } from '@/src/types/staff.types';

// ─── Role labels ──────────────────────────────────────────────────────────────
const ROLE_LABELS: Record<RoleName, string> = {
  admin:   'Quản trị viên',
  manager: 'Quản lý',
  trainer: 'Huấn luyện viên',
  staff:   'Nhân viên',
  user:    'Người dùng',
  member:  'Hội viên',
};


// ─── Initials from full name ───────────────────────────────────────────────────
export const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  // Lấy chữ đầu của từ đầu và từ cuối
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

// ─── Transform API data → Frontend model ─────────────────────────────────────
export const transformStaff = (api: StaffApiData): StaffMember => ({
  id: api._id,
  name: api.name,
  email: api.email,
  role: {
    id: api.role._id,
    name: api.role.name,
    permissions: api.role.permissions ?? [],
  },
  isActive: api.isActive,
  createdAt: api.createdAt,
  updatedAt: api.updatedAt,
  // Computed fields
  roleLabel: ROLE_LABELS[api.role.name] ?? api.role.name,
  initials: getInitials(api.name),
});

// ─── Error message extractor ──────────────────────────────────────────────────
export const extractErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object') {
    const e = error as any;
    return (
      e?.response?.data?.message ||
      e?.response?.data?.error ||
      e?.message ||
      'Đã xảy ra lỗi không xác định'
    );
  }
  return 'Đã xảy ra lỗi không xác định';
};

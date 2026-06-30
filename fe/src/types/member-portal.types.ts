// ─── Subscription plan embed ──────────────────────────────────────────────────
export interface MemberPlanEmbed {
  _id:         string;
  name:        string;
  type:        string;  // basic | premium | vip
  durationDays: number;
  price:       number;
}

// ─── User embed ───────────────────────────────────────────────────────────────
export interface MemberUserEmbed {
  _id:      string;
  name:     string;
  email:    string;
  isActive: boolean;
}

// ─── Full member profile (from GET /members/me) ───────────────────────────────
export interface MemberProfile {
  _id:               string;
  user:              MemberUserEmbed;
  memberId:          string;
  phone?:            string;
  dateOfBirth?:      string;
  gender?:           'male' | 'female' | 'other';
  address?:          string;
  emergencyContact?: string;
  notes?:            string;
  status:            'active' | 'expired' | 'suspended';
  subscriptionPlan?: MemberPlanEmbed;
  subscriptionStart?: string;
  subscriptionEnd?:  string;
  lastCheckIn?:      string;
  createdAt:         string;
}

// ─── API response ─────────────────────────────────────────────────────────────
export interface MemberProfileApiResponse {
  success: boolean;
  data:    MemberProfile;
}

// ─── Update payload (whitelist: phone, emergencyContact, notes) ───────────────
export interface UpdateMemberProfilePayload {
  phone?:            string;
  emergencyContact?: string;
  notes?:            string;
}

// ─── Gym Info ─────────────────────────────────────────────────────────────────
export interface OpeningHour {
  dayOfWeek: string;   // "Monday" | "Tuesday" | ...
  openTime:  string;   // "06:00"
  closeTime: string;   // "22:00"
  isClosed:  boolean;
}

export interface SocialLinks {
  facebook?:  string;
  instagram?: string;
  youtube?:   string;
  tiktok?:    string;
}

export interface GymInfo {
  _id:           string;
  name:          string;
  tagline?:      string;
  description?:  string;
  address?:      string;
  phone?:        string;
  email?:        string;
  website?:      string;
  logoUrl?:      string;
  coverImageUrl?: string;
  openingHours?: string | OpeningHour[];
  socialLinks?:  string | SocialLinks;
  established?:  number;
}

export interface GymInfoApiResponse {
  success: boolean;
  data:    GymInfo;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
export const GENDER_LABELS: Record<string, string> = {
  male:   'Nam',
  female: 'Nữ',
  other:  'Khác',
};

export const MEMBER_STATUS_LABELS: Record<string, string> = {
  active:    'Đang hoạt động',
  expired:   'Đã hết hạn',
  suspended: 'Bị tạm dừng',
};

export const MEMBER_STATUS_COLORS: Record<string, string> = {
  active:    'text-success-500 bg-success-500/10',
  expired:   'text-warning-500 bg-warning-500/10',
  suspended: 'text-danger-500  bg-danger-500/10',
};

export const DAY_OF_WEEK_VI: Record<string, string> = {
  Monday:    'Thứ Hai',
  Tuesday:   'Thứ Ba',
  Wednesday: 'Thứ Tư',
  Thursday:  'Thứ Năm',
  Friday:    'Thứ Sáu',
  Saturday:  'Thứ Bảy',
  Sunday:    'Chủ Nhật',
};

export const PORTAL_ROLES = ['member', 'user'];
export const ADMIN_ROLES  = ['admin', 'manager', 'staff', 'trainer'];

/** Returns home path based on role name */
export const getHomePath = (roleName: string): string =>
  ADMIN_ROLES.includes(roleName) ? '/dashboard' : '/portal';

import { ADMIN_ROLES, PORTAL_ROLES } from '@/src/lib/roles';

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
export { PORTAL_ROLES, ADMIN_ROLES };

/** Returns home path based on role name */
export const getHomePath = (roleName: string): string =>
  ADMIN_ROLES.includes(roleName) ? '/dashboard' : '/portal';

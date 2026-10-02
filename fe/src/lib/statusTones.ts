// ─── Status → badge tone ──────────────────────────────────────────────────────
// Single source for status colors, shared by the admin area and the member portal.

import type { BadgeTone } from '@/src/components/ui/Badge';
import type { BookingStatus } from '@/src/types/booking.types';
import type { MemberStatus } from '@/src/types/member.types';
import type { ClassStatus } from '@/src/types/class.types';
import type { EquipmentStatus } from '@/src/types/equipment.types';
import type { RoleName } from '@/src/lib/roles';

export const BOOKING_STATUS_TONE: Record<BookingStatus, BadgeTone> = {
  pending:   'warning',
  confirmed: 'primary',
  completed: 'success',
  cancelled: 'neutral',
};

export const MEMBER_STATUS_TONE: Record<MemberStatus, BadgeTone> = {
  active:    'success',
  expired:   'danger',
  suspended: 'warning',
};

export const CLASS_STATUS_TONE: Record<ClassStatus, BadgeTone> = {
  active:    'success',
  cancelled: 'danger',
  completed: 'neutral',
};

export const EQUIPMENT_STATUS_TONE: Record<EquipmentStatus, BadgeTone> = {
  operational:  'success',
  maintenance:  'warning',
  out_of_order: 'danger',
};

export const ROLE_TONE: Record<RoleName, BadgeTone> = {
  admin:   'danger',
  manager: 'primary',
  trainer: 'violet',
  staff:   'info',
  user:    'neutral',
  member:  'neutral',
};

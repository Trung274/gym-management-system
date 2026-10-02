import type { StaffApiData, StaffMember } from '@/src/types/staff.types';
import { getInitials } from './format';

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
  initials: getInitials(api.name),
});

export { extractErrorMessage } from './errors';

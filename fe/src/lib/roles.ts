// ─── Role names ───────────────────────────────────────────────────────────────
// Must match the enum in be/src/models/Role.model.js (be/src/config/roles.js).

export const ROLES = {
  ADMIN:   'admin',
  MANAGER: 'manager',
  STAFF:   'staff',
  TRAINER: 'trainer',
  MEMBER:  'member',
  USER:    'user',
} as const;

export type RoleName = (typeof ROLES)[keyof typeof ROLES];

/** Roles that use the admin area (/dashboard, ...) */
export const ADMIN_ROLES: readonly string[] = [ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF, ROLES.TRAINER];

/** Roles that use the member portal (/portal) */
export const PORTAL_ROLES: readonly string[] = [ROLES.MEMBER, ROLES.USER];

export const isAdmin = (roleName?: string | null): boolean => roleName === ROLES.ADMIN;

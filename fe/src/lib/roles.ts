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

/** Only admins may grant these roles or modify accounts that hold them */
export const PRIVILEGED_ROLES: readonly string[] = [ROLES.ADMIN, ROLES.MANAGER];

/** Accounts tied to a Member / Trainer profile — their role is managed from those pages */
export const PROFILE_ROLES: readonly string[] = [ROLES.MEMBER, ROLES.TRAINER];

/** Roles an admin can switch an account between on the Users page */
export const ACCOUNT_ROLES: readonly RoleName[] = [ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF];

/** Display order for role lists and columns */
export const ROLE_ORDER: readonly RoleName[] = [ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF, ROLES.TRAINER, ROLES.MEMBER, ROLES.USER];

export const isAdmin = (roleName?: string | null): boolean => roleName === ROLES.ADMIN;

/** Whether an actor with `actorRole` may grant `roleName` or act on an account holding it (mirrors the API rule) */
export const canManageRole = (actorRole: string | null | undefined, roleName: string): boolean =>
  isAdmin(actorRole) || !PRIVILEGED_ROLES.includes(roleName);

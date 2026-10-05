/**
 * Role names — single source of truth.
 * Used by Role model enum, auth middleware, controllers, routes and seed scripts.
 * Frontend mirror: fe/src/lib/roles.ts
 */
const ROLES = Object.freeze({
  ADMIN:   'admin',
  MANAGER: 'manager',
  STAFF:   'staff',
  TRAINER: 'trainer',
  MEMBER:  'member',
  USER:    'user'
});

const ROLE_NAMES = Object.values(ROLES);

/** Only admins may grant these roles or modify accounts that hold them. */
const PRIVILEGED_ROLES = Object.freeze([ROLES.ADMIN, ROLES.MANAGER]);

/** Accounts tied to a Member / Trainer profile — their role is managed from those pages. */
const PROFILE_ROLES = Object.freeze([ROLES.MEMBER, ROLES.TRAINER]);

/** Roles an admin can switch an account between on the Users page (accounts without a profile). */
const ACCOUNT_ROLES = Object.freeze([ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF]);

const isAdmin = (user) => user?.role?.name === ROLES.ADMIN;

/** Whether `actor` may grant `roleName`, or act on an account that holds it. */
const canManageRole = (actor, roleName) => isAdmin(actor) || !PRIVILEGED_ROLES.includes(roleName);

module.exports = {
  ROLES, ROLE_NAMES, PRIVILEGED_ROLES, PROFILE_ROLES, ACCOUNT_ROLES, isAdmin, canManageRole,
};

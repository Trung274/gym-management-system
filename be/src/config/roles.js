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

module.exports = { ROLES, ROLE_NAMES };

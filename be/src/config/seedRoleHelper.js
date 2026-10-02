/**
 * Shared logic for role seeds that combine permissions from several domains
 * (seedStaffRole, seedTrainerRole). These scripts must run AFTER all domain seeds.
 */
const Permission = require('../models/Permission.model');
const Role = require('../models/Role.model');

/**
 * Sets a role's permissions to exactly `required` (creating the role if missing).
 * Permissions that don't exist yet are reported and skipped.
 *
 * @param {string} roleName
 * @param {string} description
 * @param {{ resource: string, action: string }[]} required
 */
const upsertRolePermissions = async (roleName, description, required) => {
  const permIds = [];
  const missing = [];

  for (const { resource, action } of required) {
    const doc = await Permission.findOne({ resource, action });
    if (doc) {
      permIds.push(doc._id);
      console.log(`  ✓ ${resource}:${action}`);
    } else {
      missing.push(`${resource}:${action}`);
      console.log(`  ✗ ${resource}:${action} — not found (domain chưa seed?)`);
    }
  }

  if (missing.length > 0) {
    console.log(`\n  ⚠ ${missing.length}/${required.length} permissions chưa tồn tại.`);
    console.log('    Chạy npm run seed:all để đảm bảo đầy đủ.\n');
  }

  let role = await Role.findOne({ name: roleName });
  if (!role) {
    role = await Role.create({ name: roleName, description, permissions: permIds });
    console.log(`\n  ✓ Created role: ${roleName}`);
  } else {
    role.permissions = permIds;
    role.description = description;
    await role.save();
    console.log(`\n  ✓ Updated role: ${roleName}`);
  }

  console.log(`\n🎉 Done! Role ${roleName}: ${permIds.length}/${required.length} permissions assigned.`);
};

module.exports = { upsertRolePermissions };

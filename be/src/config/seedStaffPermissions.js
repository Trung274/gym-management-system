require('dotenv').config();
const mongoose = require('mongoose');
const Permission = require('../models/Permission.model');
const Role = require('../models/Role.model');

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✓ MongoDB Connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

const seedStaffPermissions = async () => {
  try {
    console.log('🌱 Seeding staff permissions...');

    // 1. Upsert staff permissions
    const staffPermsData = [
      { resource: 'staff', action: 'list',       description: 'List all staff accounts' },
      { resource: 'staff', action: 'read',       description: 'View staff account details' },
      { resource: 'staff', action: 'create',     description: 'Create new staff accounts' },
      { resource: 'staff', action: 'update',     description: 'Update staff info and assign roles' },
      { resource: 'staff', action: 'deactivate', description: 'Deactivate or activate staff accounts' },
    ];

    const staffPermIds = [];
    for (const perm of staffPermsData) {
      let doc = await Permission.findOne({ resource: perm.resource, action: perm.action });
      if (!doc) {
        doc = await Permission.create(perm);
        console.log(`  ✓ Created permission: staff:${perm.action}`);
      } else {
        console.log(`  – Already exists: staff:${perm.action}`);
      }
      staffPermIds.push(doc._id);
    }

    // 2. Assign ALL staff permissions to admin role
    const adminRole = await Role.findOne({ name: 'admin' });
    if (adminRole) {
      const existing = adminRole.permissions.map(id => id.toString());
      const toAdd = staffPermIds.filter(id => !existing.includes(id.toString()));
      if (toAdd.length > 0) {
        adminRole.permissions.push(...toAdd);
        await adminRole.save();
        console.log(`\n  ✓ Assigned ${toAdd.length} staff permission(s) to role: admin`);
      } else {
        console.log('\n  – admin already has all staff permissions');
      }
    } else {
      console.log('\n  ⚠ Role "admin" not found — run npm run seed:roles first');
    }

    // 3. Upsert manager role with staff CRUD permissions (list, read, create, update, deactivate)
    let managerRole = await Role.findOne({ name: 'manager' });
    if (!managerRole) {
      managerRole = await Role.create({
        name: 'manager',
        description: 'Gym manager — can manage staff accounts',
        permissions: staffPermIds
      });
      console.log('  ✓ Created role: manager (with all staff permissions)');
    } else {
      const existing = managerRole.permissions.map(id => id.toString());
      const toAdd = staffPermIds.filter(id => !existing.includes(id.toString()));
      if (toAdd.length > 0) {
        managerRole.permissions.push(...toAdd);
        await managerRole.save();
        console.log(`  ✓ Updated role: manager (+${toAdd.length} staff permission(s))`);

      } else {
        console.log('  – manager already has all staff permissions');
      }
    }

    console.log('\n🎉 Done!');
    console.log('   Roles with staff:* permissions (quản lý): admin, manager');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedStaffPermissions();

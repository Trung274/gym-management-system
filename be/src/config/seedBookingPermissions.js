require('dotenv').config();
const mongoose = require('mongoose');
const Permission = require('../models/Permission.model');
const Role = require('../models/Role.model');

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✓ MongoDB Connected'))
  .catch(err => { console.error('MongoDB connection error:', err); process.exit(1); });

const seedBookingPermissions = async () => {
  try {
    console.log('🌱 Seeding booking permissions...');

    const permsData = [
      { resource: 'bookings', action: 'list',   description: 'List all bookings' },
      { resource: 'bookings', action: 'read',   description: 'View booking details' },
      { resource: 'bookings', action: 'create', description: 'Create bookings' },
      { resource: 'bookings', action: 'manage', description: 'Confirm, complete, or cancel any booking' },
    ];

    const permMap = {};
    for (const perm of permsData) {
      let doc = await Permission.findOne({ resource: perm.resource, action: perm.action });
      if (!doc) {
        doc = await Permission.create(perm);
        console.log(`  ✓ Created permission: bookings:${perm.action}`);
      } else {
        console.log(`  – Already exists: bookings:${perm.action}`);
      }
      permMap[perm.action] = doc._id;
    }

    // Admin & Manager: all 4 permissions
    for (const roleName of ['admin', 'manager']) {
      const role = await Role.findOne({ name: roleName });
      if (role) {
        const existing = role.permissions.map(id => id.toString());
        const toAdd = Object.values(permMap).filter(id => !existing.includes(id.toString()));
        if (toAdd.length > 0) {
          role.permissions.push(...toAdd);
          await role.save();
          console.log(`\n  ✓ Assigned ${toAdd.length} booking permission(s) to role: ${roleName}`);
        } else {
          console.log(`\n  – ${roleName} already has all booking permissions`);
        }
      }
    }

    // Member role: only create + read
    const memberRole = await Role.findOne({ name: 'member' });
    if (memberRole) {
      const existing = memberRole.permissions.map(id => id.toString());
      const toAdd = [permMap['create'], permMap['read']].filter(id => !existing.includes(id.toString()));
      if (toAdd.length > 0) {
        memberRole.permissions.push(...toAdd);
        await memberRole.save();
        console.log(`\n  ✓ Assigned bookings:create + bookings:read to role: member`);
      } else {
        console.log('\n  – member already has booking create+read');
      }
    }

    console.log('\n🎉 Done!');
    console.log('   admin, manager: all 4 booking permissions');
    console.log('   member: bookings:create + bookings:read');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedBookingPermissions();

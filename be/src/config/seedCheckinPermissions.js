require('dotenv').config();
const mongoose = require('mongoose');
const Permission = require('../models/Permission.model');
const Role = require('../models/Role.model');

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✓ MongoDB Connected'))
  .catch(err => { console.error('MongoDB connection error:', err); process.exit(1); });

const seedCheckinPermissions = async () => {
  try {
    console.log('🌱 Seeding check-in permissions...');

    const permsData = [
      { resource: 'checkins', action: 'record', description: 'Record a member check-in' },
      { resource: 'checkins', action: 'list',   description: 'List and filter all check-ins' },
      { resource: 'checkins', action: 'read',   description: 'View check-in history of a specific member' },
    ];

    const permIds = [];
    for (const perm of permsData) {
      let doc = await Permission.findOne({ resource: perm.resource, action: perm.action });
      if (!doc) {
        doc = await Permission.create(perm);
        console.log(`  ✓ Created permission: checkins:${perm.action}`);
      } else {
        console.log(`  – Already exists: checkins:${perm.action}`);
      }
      permIds.push(doc._id);
    }

    for (const roleName of ['admin', 'manager']) {
      const role = await Role.findOne({ name: roleName });
      if (role) {
        const existing = role.permissions.map(id => id.toString());
        const toAdd = permIds.filter(id => !existing.includes(id.toString()));
        if (toAdd.length > 0) {
          role.permissions.push(...toAdd);
          await role.save();
          console.log(`\n  ✓ Assigned ${toAdd.length} checkin permission(s) to: ${roleName}`);
        } else {
          console.log(`\n  – ${roleName} already has all checkin permissions`);
        }
      }
    }

    console.log('\n🎉 Done!');
    console.log('   Permissions assigned to: admin, manager');
    console.log('   (No sample data — check-in is transactional)');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedCheckinPermissions();

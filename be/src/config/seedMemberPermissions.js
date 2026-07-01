require('dotenv').config();
const mongoose = require('mongoose');
const Permission = require('../models/Permission.model');
const Role = require('../models/Role.model');
const Member = require('../models/Member.model');
require('../models/User.model');           // needed by Member populate
require('../models/SubscriptionPlan.model'); // needed by Member populate

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✓ MongoDB Connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

const seedMemberPermissions = async () => {
  try {
    console.log('🗑  Clearing member domain data...');
    await Member.deleteMany({});
    console.log('  ✓ Cleared Members');

    console.log('🌱 Seeding member permissions...');

    // 1. Upsert member permissions
    const memberPermsData = [
      { resource: 'members', action: 'list',    description: 'List all members' },
      { resource: 'members', action: 'read',    description: 'View member details' },
      { resource: 'members', action: 'create',  description: 'Register new members' },
      { resource: 'members', action: 'update',  description: 'Update member info and renew membership' },
      { resource: 'members', action: 'status',  description: 'Change member status (active/suspended)' },
      { resource: 'members', action: 'checkin', description: 'Check-in members' },
    ];

    const memberPermIds = [];
    for (const perm of memberPermsData) {
      let doc = await Permission.findOne({ resource: perm.resource, action: perm.action });
      if (!doc) {
        doc = await Permission.create(perm);
        console.log(`  ✓ Created permission: members:${perm.action}`);
      } else {
        console.log(`  – Already exists: members:${perm.action}`);
      }
      memberPermIds.push(doc._id);
    }

    // 2. Assign ALL member permissions to admin role
    const adminRole = await Role.findOne({ name: 'admin' });
    if (adminRole) {
      const existing = adminRole.permissions.map(id => id.toString());
      const toAdd = memberPermIds.filter(id => !existing.includes(id.toString()));
      if (toAdd.length > 0) {
        adminRole.permissions.push(...toAdd);
        await adminRole.save();
        console.log(`\n  ✓ Assigned ${toAdd.length} member permission(s) to role: admin`);
      } else {
        console.log('\n  – admin already has all member permissions');
      }
    } else {
      console.log('\n  ⚠ Role "admin" not found — run npm run seed:roles first');
    }

    // 3. Assign ALL member permissions to manager role
    const managerRole = await Role.findOne({ name: 'manager' });
    if (managerRole) {
      const existing = managerRole.permissions.map(id => id.toString());
      const toAdd = memberPermIds.filter(id => !existing.includes(id.toString()));
      if (toAdd.length > 0) {
        managerRole.permissions.push(...toAdd);
        await managerRole.save();
        console.log(`  ✓ Assigned ${toAdd.length} member permission(s) to role: manager`);
      } else {
        console.log('  – manager already has all member permissions');
      }
    }

    // 4. Upsert member role with profile read/update permissions
    const profilePerms = await Permission.find({ resource: 'profile' });
    const profilePermIds = profilePerms.map(p => p._id);

    let memberRole = await Role.findOne({ name: 'member' });
    if (!memberRole) {
      memberRole = await Role.create({
        name: 'member',
        description: 'Gym member — can view and update own profile',
        permissions: profilePermIds
      });
      console.log('  ✓ Created role: member (with profile:read, profile:update)');
    } else {
      const existing = memberRole.permissions.map(id => id.toString());
      const toAdd = profilePermIds.filter(id => !existing.includes(id.toString()));
      if (toAdd.length > 0) {
        memberRole.permissions.push(...toAdd);
        await memberRole.save();
        console.log(`  ✓ Updated role: member (+${toAdd.length} profile permission(s))`);
      } else {
        console.log('  – member role already has profile permissions');
      }
    }

    console.log('\n🎉 Done!');
    console.log('   Roles with member permissions: admin, manager');
    console.log('   Member role: profile:read, profile:update');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedMemberPermissions();

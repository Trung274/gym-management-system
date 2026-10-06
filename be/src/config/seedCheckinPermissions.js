require('dotenv').config();
const mongoose = require('mongoose');
const Permission = require('../models/Permission.model');
const Role = require('../models/Role.model');
const CheckinLog = require('../models/CheckinLog.model');
const Member = require('../models/Member.model');
require('../models/SubscriptionPlan.model'); // needed by Member populate
const User = require('../models/User.model');
const { ROLES } = require('./roles');

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✓ MongoDB Connected'))
  .catch(err => { console.error('MongoDB connection error:', err); process.exit(1); });

const seedCheckinPermissions = async () => {
  try {
    console.log('🗑  Clearing checkin domain data...');
    await CheckinLog.deleteMany({});
    console.log('  ✓ Cleared CheckinLogs');

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

    for (const roleName of [ROLES.ADMIN, ROLES.MANAGER]) {
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

    // Sample check-ins over the last 14 days for the sample members (deterministic pattern;
    // none for suspended members or after a membership ended), recorded by the sample manager
    const recorder = await User.findOne({ email: 'manager@example.com' });
    const DAY = 24 * 60 * 60 * 1000;
    let created = 0;
    for (let i = 1; i <= 8; i++) {
      const user = await User.findOne({ email: `member${i}@example.com` });
      const member = user && await Member.findOne({ user: user._id });
      if (!member || member.status === 'suspended') continue;
      let last = null;
      for (let d = 14; d >= 1; d--) {
        if ((i * 7 + d * 3) % 5 >= 3) continue;
        const at = new Date(Date.now() - d * DAY);
        at.setHours(6 + ((i + d) % 14), (i * 13 + d * 7) % 60, 0, 0);
        if (at > member.endDate) continue;
        await CheckinLog.create({ member: member._id, checkinAt: at, recordedBy: recorder?._id });
        last = at;
        created++;
      }
      if (last) await Member.updateOne({ _id: member._id }, { lastCheckIn: last });
    }
    console.log(created
      ? `\n  ✓ Created ${created} sample check-ins (last 14 days)`
      : '\n  ⚠ Sample members not found — run seed:members first. Skipping sample check-ins.');

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

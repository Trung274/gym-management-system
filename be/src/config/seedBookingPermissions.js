require('dotenv').config();
const mongoose = require('mongoose');
const Permission = require('../models/Permission.model');
const Role = require('../models/Role.model');
const Booking = require('../models/Booking.model');
const Member = require('../models/Member.model');
require('../models/SubscriptionPlan.model'); // needed by Member populate
const Trainer = require('../models/Trainer.model');
const User = require('../models/User.model');
const { ROLES } = require('./roles');

/** Local date `offset` days from today as new Date('YYYY-MM-DD') — how the API stores sessionDate */
const dateOnly = (offset) => {
  const d = new Date(Date.now() + offset * 24 * 60 * 60 * 1000);
  const pad = (x) => String(x).padStart(2, '0');
  return new Date(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
};

// Sample bookings between the sample members / trainers: [member, trainer, dayOffset, start, end, status, notes, reason]
const SAMPLE_BOOKINGS = [
  ['member1@example.com', 'trainer1@example.com', 1, '07:00', '08:00', 'confirmed', 'Yoga phục hồi lưng'],
  ['member1@example.com', 'trainer1@example.com', 3, '18:00', '19:00', 'pending'],
  ['member1@example.com', 'trainer1@example.com', -2, '07:00', '08:00', 'completed'],
  ['member1@example.com', 'trainer1@example.com', -5, '18:00', '19:00', 'cancelled', null, 'Bận việc đột xuất'],
  ['member2@example.com', 'trainer2@example.com', 2, '17:00', '18:00', 'confirmed', 'Tăng sức mạnh chân'],
  ['member2@example.com', 'trainer2@example.com', -7, '17:00', '18:00', 'completed'],
  ['member6@example.com', 'trainer2@example.com', 4, '06:00', '07:00', 'pending'],
  ['member8@example.com', 'trainer3@example.com', 1, '19:00', '20:00', 'confirmed'],
  ['member8@example.com', 'trainer3@example.com', -3, '19:00', '20:00', 'completed'],
];

const findProfileByEmail = async (Model, email) => {
  const user = await User.findOne({ email });
  return user ? { user, profile: await Model.findOne({ user: user._id }) } : null;
};

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✓ MongoDB Connected'))
  .catch(err => { console.error('MongoDB connection error:', err); process.exit(1); });

const seedBookingPermissions = async () => {
  try {
    console.log('🗑  Clearing booking domain data...');
    await Booking.deleteMany({});
    console.log('  ✓ Cleared Bookings');

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
    for (const roleName of [ROLES.ADMIN, ROLES.MANAGER]) {
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
    const memberRole = await Role.findOne({ name: ROLES.MEMBER });
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

    // Sample bookings (needs the sample members and trainers)
    let created = 0;
    for (const [memberEmail, trainerEmail, offset, startTime, endTime, status, notes, reason] of SAMPLE_BOOKINGS) {
      const member = await findProfileByEmail(Member, memberEmail);
      const trainer = await findProfileByEmail(Trainer, trainerEmail);
      if (!member?.profile || !trainer?.profile) continue;
      await Booking.create({
        member: member.profile._id, trainer: trainer.profile._id, sessionDate: dateOnly(offset), startTime, endTime, status,
        notes: notes || undefined, cancellationReason: reason || undefined, createdBy: member.user._id,
      });
      created++;
    }
    console.log(created
      ? `\n  ✓ Created ${created} sample bookings (pending, confirmed, completed, cancelled)`
      : '\n  ⚠ Sample members / trainers not found — run seed:members and seed:trainers first. Skipping sample bookings.');

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

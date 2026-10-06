require('dotenv').config();
const mongoose = require('mongoose');
const Permission = require('../models/Permission.model');
const Role = require('../models/Role.model');
const Member = require('../models/Member.model');
const User = require('../models/User.model');
const SubscriptionPlan = require('../models/SubscriptionPlan.model');
const { ROLES } = require('./roles');

const DAY = 24 * 60 * 60 * 1000;
const daysFromNow = (n) => new Date(Date.now() + n * DAY);

// Sample members (password Gym@123). endInDays < 0 → membership already over;
// status matches what the hourly expiry job would set.
const SAMPLE_MEMBERS = [
  { name: 'Nguyễn Minh Anh', email: 'member1@example.com', plan: 'vip',     endInDays: 300, status: 'active',    gender: 'female', phone: '0912000001' },
  { name: 'Trần Văn Bình',   email: 'member2@example.com', plan: 'premium', endInDays: 60,  status: 'active',    gender: 'male',   phone: '0912000002' },
  { name: 'Lê Thu Cúc',      email: 'member3@example.com', plan: 'basic',   endInDays: 5,   status: 'active',    gender: 'female', phone: '0912000003', notes: 'Sắp hết hạn — nhắc gia hạn' },
  { name: 'Phạm Quốc Dũng',  email: 'member4@example.com', plan: 'basic',   endInDays: -10, status: 'expired',   gender: 'male',   phone: '0912000004' },
  { name: 'Hoàng Thị Em',    email: 'member5@example.com', plan: 'premium', endInDays: 40,  status: 'suspended', gender: 'female', phone: '0912000005', notes: 'Tạm dừng do chấn thương' },
  { name: 'Vũ Đức Phúc',     email: 'member6@example.com', plan: 'vip',     endInDays: 200, status: 'active',    gender: 'male',   phone: '0912000006' },
  { name: 'Đặng Thảo Giang', email: 'member7@example.com', plan: 'basic',   endInDays: 20,  status: 'active',    gender: 'female', phone: '0912000007', accountActive: false },
  { name: 'Bùi Hải Hà',      email: 'member8@example.com', plan: 'premium', endInDays: 80,  status: 'active',    gender: 'female', phone: '0912000008' },
];

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✓ MongoDB Connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

const seedMemberPermissions = async () => {
  try {
    console.log('🗑  Clearing member domain data...');
    // Remove members together with their login accounts (no orphan users left behind)
    const memberUserIds = await Member.distinct('user');
    await Member.deleteMany({});
    await User.deleteMany({ _id: { $in: memberUserIds } });
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
    const adminRole = await Role.findOne({ name: ROLES.ADMIN });
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
    const managerRole = await Role.findOne({ name: ROLES.MANAGER });
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

    let memberRole = await Role.findOne({ name: ROLES.MEMBER });
    if (!memberRole) {
      memberRole = await Role.create({
        name: ROLES.MEMBER,
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

    // 5. Sample members with a plan (needs seed:plans first)
    const plans = {};
    for (const type of ['basic', 'premium', 'vip']) {
      plans[type] = await SubscriptionPlan.findOne({ type });
    }
    if (!plans.basic || !plans.premium || !plans.vip) {
      console.log('\n  ⚠ Plans not found — run npm run seed:plans first. Skipping sample members.');
    } else {
      await User.deleteMany({ email: { $in: SAMPLE_MEMBERS.map((m) => m.email) } }); // leftovers without a profile
      for (const m of SAMPLE_MEMBERS) {
        const plan = plans[m.plan];
        const user = await User.create({
          name: m.name, email: m.email, password: 'Gym@123', role: memberRole._id, isActive: m.accountActive !== false,
        });
        await Member.create({
          user: user._id, phone: m.phone, gender: m.gender, notes: m.notes, subscriptionPlan: plan._id, status: m.status,
          endDate: daysFromNow(m.endInDays), startDate: daysFromNow(m.endInDays - plan.durationDays),
        });
      }
      console.log(`\n  ✓ Created ${SAMPLE_MEMBERS.length} sample members (active, expiring, expired, suspended, deactivated account)`);
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

require('dotenv').config();
const mongoose = require('mongoose');
const Permission = require('../models/Permission.model');
const Role = require('../models/Role.model');
const Trainer = require('../models/Trainer.model');
const User = require('../models/User.model');
const { ROLES } = require('./roles');

// Sample trainers (password Gym@123) — seed:classes links them to the sample classes
const SAMPLE_TRAINERS = [
  { name: 'Đỗ Thu Hương', email: 'trainer1@example.com', phone: '0901000001', gender: 'female', experienceYears: 6,
    specializations: ['Yoga', 'Pilates'], certifications: ['RYT 200'], bio: 'Chuyên yoga trị liệu và pilates cho người mới bắt đầu.' },
  { name: 'Ngô Minh Khoa', email: 'trainer2@example.com', phone: '0901000002', gender: 'male', experienceYears: 8,
    specializations: ['Strength', 'HIIT'], certifications: ['ACE CPT', 'CrossFit L1'], bio: 'Tăng cơ, giảm mỡ và các chương trình HIIT cường độ cao.' },
  { name: 'Lý Gia Tuấn', email: 'trainer3@example.com', phone: '0901000003', gender: 'male', experienceYears: 4,
    specializations: ['Cycling', 'Boxing'], certifications: ['Spinning Instructor'], bio: 'Cardio, sức bền và boxing cơ bản.' },
];

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✓ MongoDB Connected'))
  .catch(err => { console.error('MongoDB connection error:', err); process.exit(1); });

const seedTrainerPermissions = async () => {
  try {
    console.log('🗑  Clearing trainer domain data...');
    // Remove trainers together with their login accounts (no orphan users left behind)
    const trainerUserIds = await Trainer.distinct('user');
    await Trainer.deleteMany({});
    await User.deleteMany({ _id: { $in: trainerUserIds } });
    console.log('  ✓ Cleared Trainers');

    console.log('🌱 Seeding trainer permissions...');

    const permsData = [
      { resource: 'trainers', action: 'list',   description: 'List all trainers' },
      { resource: 'trainers', action: 'read',   description: 'View trainer details' },
      { resource: 'trainers', action: 'create', description: 'Create trainer accounts' },
      { resource: 'trainers', action: 'update', description: 'Update trainer info' },
      { resource: 'trainers', action: 'status', description: 'Change trainer status (active/inactive)' },
    ];

    const permIds = [];
    for (const perm of permsData) {
      let doc = await Permission.findOne({ resource: perm.resource, action: perm.action });
      if (!doc) {
        doc = await Permission.create(perm);
        console.log(`  ✓ Created permission: trainers:${perm.action}`);
      } else {
        console.log(`  – Already exists: trainers:${perm.action}`);
      }
      permIds.push(doc._id);
    }

    // Assign to admin and manager roles
    for (const roleName of [ROLES.ADMIN, ROLES.MANAGER]) {
      const role = await Role.findOne({ name: roleName });
      if (role) {
        const existing = role.permissions.map(id => id.toString());
        const toAdd = permIds.filter(id => !existing.includes(id.toString()));
        if (toAdd.length > 0) {
          role.permissions.push(...toAdd);
          await role.save();
          console.log(`\n  ✓ Assigned ${toAdd.length} trainer permission(s) to role: ${roleName}`);
        } else {
          console.log(`\n  – ${roleName} already has all trainer permissions`);
        }
      }
    }

    // Create trainer role with profile permissions
    const profilePerms = await Permission.find({ resource: 'profile' });
    const profilePermIds = profilePerms.map(p => p._id);

    let trainerRole = await Role.findOne({ name: ROLES.TRAINER });
    if (!trainerRole) {
      trainerRole = await Role.create({
        name: ROLES.TRAINER,
        description: 'Gym trainer — can view and update own profile',
        permissions: profilePermIds
      });
      console.log('  ✓ Created role: trainer');
    } else {
      console.log('  – Role trainer already exists');
    }

    // Sample trainers with a profile
    await User.deleteMany({ email: { $in: SAMPLE_TRAINERS.map((t) => t.email) } }); // leftovers without a profile
    for (const { name, email, ...profile } of SAMPLE_TRAINERS) {
      const user = await User.create({ name, email, password: 'Gym@123', role: trainerRole._id });
      await Trainer.create({ user: user._id, ...profile });
    }
    console.log(`\n  ✓ Created ${SAMPLE_TRAINERS.length} sample trainers`);

    console.log('\n🎉 Done!');
    console.log('   Permissions assigned to: admin, manager');
    console.log('   Role created: trainer');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedTrainerPermissions();

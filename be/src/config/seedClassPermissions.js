require('dotenv').config();
const mongoose = require('mongoose');
const Permission = require('../models/Permission.model');
const Role = require('../models/Role.model');
require('../models/Trainer.model'); // required by Class pre-hook populate
const Class = require('../models/Class.model');

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✓ MongoDB Connected'))
  .catch(err => { console.error('MongoDB connection error:', err); process.exit(1); });

const seedClassPermissions = async () => {
  try {
    console.log('🌱 Seeding class permissions...');

    const permsData = [
      { resource: 'classes', action: 'list',   description: 'List all classes' },
      { resource: 'classes', action: 'read',   description: 'View class details' },
      { resource: 'classes', action: 'create', description: 'Create classes' },
      { resource: 'classes', action: 'update', description: 'Update class info' },
      { resource: 'classes', action: 'status', description: 'Change class status' },
    ];

    const permIds = [];
    for (const perm of permsData) {
      let doc = await Permission.findOne({ resource: perm.resource, action: perm.action });
      if (!doc) {
        doc = await Permission.create(perm);
        console.log(`  ✓ Created permission: classes:${perm.action}`);
      } else {
        console.log(`  – Already exists: classes:${perm.action}`);
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
          console.log(`\n  ✓ Assigned ${toAdd.length} class permission(s) to: ${roleName}`);
        } else {
          console.log(`\n  – ${roleName} already has all class permissions`);
        }
      }
    }

    // Seed 3 sample classes (idempotent — no trainer linked since we don't know IDs)
    console.log('\n🌱 Seeding sample classes...');
    const samples = [
      {
        name: 'Yoga Buổi Sáng',
        category: 'yoga',
        description: 'Lớp yoga nhẹ nhàng dành cho người mới bắt đầu',
        location: 'Phòng Yoga',
        capacity: 20,
        schedule: [
          { dayOfWeek: 1, startTime: '06:30', endTime: '07:30' },
          { dayOfWeek: 3, startTime: '06:30', endTime: '07:30' },
          { dayOfWeek: 5, startTime: '06:30', endTime: '07:30' }
        ]
      },
      {
        name: 'Zumba Chiều',
        category: 'zumba',
        description: 'Lớp vũ đạo năng động, đốt cháy calo hiệu quả',
        location: 'Phòng Đa Năng',
        capacity: 30,
        schedule: [
          { dayOfWeek: 2, startTime: '17:00', endTime: '18:00' },
          { dayOfWeek: 4, startTime: '17:00', endTime: '18:00' }
        ]
      },
      {
        name: 'Cycling Cuối Tuần',
        category: 'cycling',
        description: 'Đạp xe cường độ cao — cardio và sức bền',
        location: 'Phòng Cycling',
        capacity: 15,
        schedule: [
          { dayOfWeek: 6, startTime: '08:00', endTime: '09:00' },
          { dayOfWeek: 0, startTime: '08:00', endTime: '09:00' }
        ]
      }
    ];

    for (const cls of samples) {
      const exists = await Class.findOne({ name: cls.name });
      if (!exists) {
        await Class.create(cls);
        console.log(`  ✓ Created class: ${cls.name}`);
      } else {
        console.log(`  – Already exists: ${cls.name}`);
      }
    }

    console.log('\n🎉 Done!');
    console.log('   Permissions assigned to: admin, manager');
    console.log('   Sample classes: 3');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedClassPermissions();

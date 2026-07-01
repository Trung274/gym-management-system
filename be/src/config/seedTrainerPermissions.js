require('dotenv').config();
const mongoose = require('mongoose');
const Permission = require('../models/Permission.model');
const Role = require('../models/Role.model');
const Trainer = require('../models/Trainer.model');
require('../models/User.model'); // needed by Trainer populate

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✓ MongoDB Connected'))
  .catch(err => { console.error('MongoDB connection error:', err); process.exit(1); });

const seedTrainerPermissions = async () => {
  try {
    console.log('🗑  Clearing trainer domain data...');
    await Trainer.deleteMany({});
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
    for (const roleName of ['admin', 'manager']) {
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

    let trainerRole = await Role.findOne({ name: 'trainer' });
    if (!trainerRole) {
      trainerRole = await Role.create({
        name: 'trainer',
        description: 'Gym trainer — can view and update own profile',
        permissions: profilePermIds
      });
      console.log('  ✓ Created role: trainer');
    } else {
      console.log('  – Role trainer already exists');
    }

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

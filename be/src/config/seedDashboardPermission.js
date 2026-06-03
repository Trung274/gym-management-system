require('dotenv').config();
const mongoose = require('mongoose');
const Permission = require('../models/Permission.model');
const Role = require('../models/Role.model');

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✓ MongoDB Connected'))
  .catch(err => { console.error('MongoDB connection error:', err); process.exit(1); });

const seedDashboardPermission = async () => {
  try {
    console.log('🌱 Seeding dashboard permission...');

    let perm = await Permission.findOne({ resource: 'dashboard', action: 'view' });
    if (!perm) {
      perm = await Permission.create({ resource: 'dashboard', action: 'view', description: 'View dashboard snapshot' });
      console.log('  ✓ Created permission: dashboard:view');
    } else {
      console.log('  – Already exists: dashboard:view');
    }

    for (const roleName of ['admin', 'manager']) {
      const role = await Role.findOne({ name: roleName });
      if (role) {
        const already = role.permissions.map(id => id.toString()).includes(perm._id.toString());
        if (!already) {
          role.permissions.push(perm._id);
          await role.save();
          console.log(`\n  ✓ Assigned dashboard:view to: ${roleName}`);
        } else {
          console.log(`\n  – ${roleName} already has dashboard:view`);
        }
      }
    }

    console.log('\n🎉 Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedDashboardPermission();

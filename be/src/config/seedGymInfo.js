require('dotenv').config();
const mongoose = require('mongoose');
const Permission = require('../models/Permission.model');
const Role = require('../models/Role.model');
const GymInfo = require('../models/GymInfo.model');

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✓ MongoDB Connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

const seedGymInfo = async () => {
  try {
    console.log('🌱 Seeding gym information...');

    // 1. Upsert gym permissions
    const gymPermsData = [
      { resource: 'gym', action: 'read',   description: 'View gym information' },
      { resource: 'gym', action: 'update', description: 'Update gym information' }
    ];

    const gymPermIds = [];
    for (const perm of gymPermsData) {
      let doc = await Permission.findOne({ resource: perm.resource, action: perm.action });
      if (!doc) {
        doc = await Permission.create(perm);
        console.log(`  ✓ Created permission: gym:${perm.action}`);
      } else {
        console.log(`  – Already exists: gym:${perm.action}`);
      }
      gymPermIds.push(doc._id);
    }

    // 2. Assign ALL gym permissions to admin role
    const adminRole = await Role.findOne({ name: 'admin' });
    if (adminRole) {
      const existing = adminRole.permissions.map(id => id.toString());
      const toAdd = gymPermIds.filter(id => !existing.includes(id.toString()));
      if (toAdd.length > 0) {
        adminRole.permissions.push(...toAdd);
        await adminRole.save();
        console.log(`\n  ✓ Assigned ${toAdd.length} gym permission(s) to role: admin`);
      } else {
        console.log('\n  – admin already has all gym permissions');
      }
    } else {
      console.log('\n  ⚠ Role "admin" not found — run npm run seed:roles first');
    }

    // 3. Assign only gym:read to manager role
    const managerRole = await Role.findOne({ name: 'manager' });
    if (managerRole) {
      const readPerm = await Permission.findOne({ resource: 'gym', action: 'read' });
      const existing = managerRole.permissions.map(id => id.toString());
      if (readPerm && !existing.includes(readPerm._id.toString())) {
        managerRole.permissions.push(readPerm._id);
        await managerRole.save();
        console.log('  ✓ Assigned gym:read to role: manager');
      } else {
        console.log('  – manager already has gym:read');
      }
    }

    // 4. Upsert default GymInfo document
    const defaultGymInfo = {
      name: 'Fitness Center',
      tagline: 'Your Health, Our Priority',
      description: 'A modern fitness center with state-of-the-art equipment',
      address: '123 Main Street, City, Country',
      phone: '+1234567890',
      email: 'info@fitnesscenter.com',
      website: 'https://fitnesscenter.com',
      openingHours: 'Monday - Friday: 06:00 - 22:00, Saturday: 08:00 - 20:00, Sunday: 08:00 - 18:00',
      socialLinks: 'Facebook: https://facebook.com/fitnesscenter, Instagram: https://instagram.com/fitnesscenter',
      established: 2020
    };

    // Since schema changed, delete existing gym info if any to apply new structure
    await GymInfo.deleteMany({});
    
    await GymInfo.create(defaultGymInfo);
    console.log('\n  ✓ Created default GymInfo document');

    console.log('\n🎉 Done!');
    console.log('   Roles with gym permissions: admin (read+update), manager (read)');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedGymInfo();

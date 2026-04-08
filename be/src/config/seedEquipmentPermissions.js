require('dotenv').config();
const mongoose = require('mongoose');
const Permission = require('../models/Permission.model');
const Role = require('../models/Role.model');
const Equipment = require('../models/Equipment.model');

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✓ MongoDB Connected'))
  .catch(err => { console.error('MongoDB connection error:', err); process.exit(1); });

const seedEquipmentPermissions = async () => {
  try {
    console.log('🌱 Seeding equipment permissions...');

    const permsData = [
      { resource: 'equipment', action: 'list',   description: 'List all equipment' },
      { resource: 'equipment', action: 'read',   description: 'View equipment details' },
      { resource: 'equipment', action: 'create', description: 'Add new equipment' },
      { resource: 'equipment', action: 'update', description: 'Update equipment info' },
      { resource: 'equipment', action: 'status', description: 'Change equipment status' },
      { resource: 'equipment', action: 'delete', description: 'Delete equipment (Admin only)' },
    ];

    const permMap = {};
    for (const perm of permsData) {
      let doc = await Permission.findOne({ resource: perm.resource, action: perm.action });
      if (!doc) {
        doc = await Permission.create(perm);
        console.log(`  ✓ Created permission: equipment:${perm.action}`);
      } else {
        console.log(`  – Already exists: equipment:${perm.action}`);
      }
      permMap[perm.action] = doc._id;
    }

    // Admin: all 6 permissions
    const adminRole = await Role.findOne({ name: 'admin' });
    if (adminRole) {
      const existing = adminRole.permissions.map(id => id.toString());
      const toAdd = Object.values(permMap).filter(id => !existing.includes(id.toString()));
      if (toAdd.length > 0) {
        adminRole.permissions.push(...toAdd);
        await adminRole.save();
        console.log(`\n  ✓ Assigned ${toAdd.length} equipment permission(s) to role: admin`);
      } else {
        console.log('\n  – admin already has all equipment permissions');
      }
    }

    // Manager: all except delete
    const managerRole = await Role.findOne({ name: 'manager' });
    if (managerRole) {
      const managerPerms = ['list', 'read', 'create', 'update', 'status'].map(a => permMap[a]);
      const existing = managerRole.permissions.map(id => id.toString());
      const toAdd = managerPerms.filter(id => !existing.includes(id.toString()));
      if (toAdd.length > 0) {
        managerRole.permissions.push(...toAdd);
        await managerRole.save();
        console.log(`  ✓ Assigned ${toAdd.length} equipment permission(s) to role: manager`);
      } else {
        console.log('  – manager already has equipment permissions');
      }
    }

    // Seed 5 sample equipment items (idempotent)
    console.log('\n🌱 Seeding sample equipment...');
    const samples = [
      { name: 'Máy chạy bộ Life Fitness', category: 'cardio', brand: 'Life Fitness', quantity: 5, status: 'operational', location: 'Zone Cardio' },
      { name: 'Squat Rack', category: 'strength', brand: 'Hammer Strength', quantity: 3, status: 'operational', location: 'Zone Tạ' },
      { name: 'Bộ tạ đơn (1-50kg)', category: 'free_weights', brand: 'Eleiko', quantity: 1, status: 'operational', location: 'Zone Tạ' },
      { name: 'Thảm tập yoga', category: 'flexibility', brand: 'Manduka', quantity: 20, status: 'operational', location: 'Phòng Yoga' },
      { name: 'Cáp đa năng (Cable Machine)', category: 'strength', brand: 'Technogym', quantity: 2, status: 'operational', location: 'Zone Tạ' },
    ];

    for (const item of samples) {
      const exists = await Equipment.findOne({ name: item.name });
      if (!exists) {
        await Equipment.create(item);
        console.log(`  ✓ Created: ${item.name}`);
      } else {
        console.log(`  – Already exists: ${item.name}`);
      }
    }

    console.log('\n🎉 Done!');
    console.log('   admin: all 6 equipment permissions');
    console.log('   manager: list/read/create/update/status (no delete)');
    console.log('   Sample equipment: 5 items');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedEquipmentPermissions();

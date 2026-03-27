require('dotenv').config();
const mongoose = require('mongoose');
const Permission = require('../models/Permission.model');
const Role = require('../models/Role.model');
const SubscriptionPlan = require('../models/SubscriptionPlan.model');

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✓ MongoDB Connected'))
  .catch(err => { console.error('MongoDB connection error:', err); process.exit(1); });

const seedSubscriptionPlans = async () => {
  try {
    console.log('🌱 Seeding subscription plan permissions...');

    // 1. Upsert permissions
    const permsData = [
      { resource: 'plans', action: 'list',   description: 'List subscription plans' },
      { resource: 'plans', action: 'read',   description: 'View subscription plan details' },
      { resource: 'plans', action: 'create', description: 'Create subscription plans' },
      { resource: 'plans', action: 'update', description: 'Update subscription plans' },
      { resource: 'plans', action: 'toggle', description: 'Toggle subscription plan active status' },
    ];

    const permIds = [];
    for (const perm of permsData) {
      let doc = await Permission.findOne({ resource: perm.resource, action: perm.action });
      if (!doc) {
        doc = await Permission.create(perm);
        console.log(`  ✓ Created permission: plans:${perm.action}`);
      } else {
        console.log(`  – Already exists: plans:${perm.action}`);
      }
      permIds.push(doc._id);
    }

    // 2. Assign to admin and manager roles
    for (const roleName of ['admin', 'manager']) {
      const role = await Role.findOne({ name: roleName });
      if (role) {
        const existing = role.permissions.map(id => id.toString());
        const toAdd = permIds.filter(id => !existing.includes(id.toString()));
        if (toAdd.length > 0) {
          role.permissions.push(...toAdd);
          await role.save();
          console.log(`\n  ✓ Assigned ${toAdd.length} plans permission(s) to role: ${roleName}`);
        } else {
          console.log(`\n  – ${roleName} already has all plans permissions`);
        }
      }
    }

    // 3. Seed sample plans (idempotent)
    console.log('\n🌱 Seeding sample subscription plans...');
    const samplePlans = [
      { name: 'Gói Cơ Bản 1 Tháng',  type: 'basic',   durationDays: 30,  price: 300000,  description: 'Gói tập cơ bản 1 tháng — tập tại phòng gym giờ hành chính' },
      { name: 'Gói Premium 3 Tháng',  type: 'premium', durationDays: 90,  price: 800000,  description: 'Gói tập 3 tháng — bao gồm lớp nhóm và PT 2 buổi' },
      { name: 'Gói VIP 1 Năm',        type: 'vip',     durationDays: 365, price: 2800000, description: 'Gói VIP trọn năm — không giới hạn giờ, PT không giới hạn, phòng xông hơi' },
    ];

    for (const plan of samplePlans) {
      const exists = await SubscriptionPlan.findOne({ name: plan.name });
      if (!exists) {
        await SubscriptionPlan.create(plan);
        console.log(`  ✓ Created plan: ${plan.name}`);
      } else {
        console.log(`  – Already exists: ${plan.name}`);
      }
    }

    console.log('\n🎉 Done!');
    console.log('   Permissions assigned to: admin, manager');
    console.log('   Sample plans seeded: 3');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedSubscriptionPlans();

/**
 * seedStaffRole.js — Tạo / cập nhật role 'staff' (Nhân viên vận hành / lễ tân)
 *
 * Script này PHẢI chạy SAU khi tất cả domain seeds đã hoàn thành,
 * vì nó lookup permissions từ nhiều domain khác nhau (members, checkins,
 * bookings, trainers, classes, equipment, plans, gym, dashboard).
 *
 * Trong seed:all, đây là bước CUỐI CÙNG.
 * Có thể chạy độc lập bất kỳ lúc nào để reset lại role staff.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Permission = require('../models/Permission.model');
const Role = require('../models/Role.model');

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✓ MongoDB Connected'))
  .catch(err => { console.error('MongoDB connection error:', err); process.exit(1); });

const seedStaffRole = async () => {
  try {
    console.log('🌱 Seeding staff role (lễ tân / vận hành)...');
    console.log('   [Nhân viên có thể check-in, quản lý hội viên, xem lịch tập, xem thiết bị,');
    console.log('    xem/tạo booking — nhưng KHÔNG quản lý nhân sự hay cấu hình hệ thống]\n');

    const required = [
      { resource: 'members',   action: 'list'    },
      { resource: 'members',   action: 'read'    },
      { resource: 'members',   action: 'create'  },
      { resource: 'members',   action: 'update'  },
      { resource: 'members',   action: 'status'  },
      { resource: 'members',   action: 'checkin' },
      { resource: 'checkins',  action: 'record'  },
      { resource: 'checkins',  action: 'list'    },
      { resource: 'checkins',  action: 'read'    },
      { resource: 'bookings',  action: 'list'    },
      { resource: 'bookings',  action: 'read'    },
      { resource: 'bookings',  action: 'create'  },
      { resource: 'bookings',  action: 'manage'  },
      { resource: 'trainers',  action: 'list'    },
      { resource: 'trainers',  action: 'read'    },
      { resource: 'classes',   action: 'list'    },
      { resource: 'classes',   action: 'read'    },
      { resource: 'equipment', action: 'list'    },
      { resource: 'equipment', action: 'read'    },
      { resource: 'plans',     action: 'list'    },
      { resource: 'plans',     action: 'read'    },
      { resource: 'gym',       action: 'read'    },
      { resource: 'profile',   action: 'read'    },
      { resource: 'profile',   action: 'update'  },
      { resource: 'dashboard', action: 'view'    },
    ];

    const permIds = [];
    const missing = [];

    for (const { resource, action } of required) {
      const doc = await Permission.findOne({ resource, action });
      if (doc) {
        permIds.push(doc._id);
        console.log(`  ✓ ${resource}:${action}`);
      } else {
        missing.push(`${resource}:${action}`);
        console.log(`  ✗ ${resource}:${action} — not found (domain chưa seed?)`);
      }
    }

    if (missing.length > 0) {
      console.log(`\n  ⚠ ${missing.length}/${required.length} permissions chưa tồn tại.`);
      console.log('    Chạy npm run seed:all để đảm bảo đầy đủ.\n');
    }

    // Upsert role staff
    let staffRole = await Role.findOne({ name: 'staff' });
    if (!staffRole) {
      staffRole = await Role.create({
        name: 'staff',
        description: 'Nhân viên vận hành / lễ tân — check-in, quản lý hội viên, xem lịch tập',
        permissions: permIds,
      });
      console.log('\n  ✓ Created role: staff');
    } else {
      staffRole.permissions = permIds;
      staffRole.description = 'Nhân viên vận hành / lễ tân — check-in, quản lý hội viên, xem lịch tập';
      await staffRole.save();
      console.log('\n  ✓ Updated role: staff');
    }

    console.log(`\n🎉 Done! Role staff: ${permIds.length}/${required.length} permissions assigned.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedStaffRole();

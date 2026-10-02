/**
 * seedTrainerRole.js — Tạo / cập nhật quyền cho role 'trainer' (huấn luyện viên)
 *
 * HLV được: xem dashboard, xem lịch PT của mình và xác nhận / hoàn thành lịch,
 * xem lớp học, xem danh sách hội viên. KHÔNG tạo / sửa / xóa gì khác.
 * Giới hạn "lịch của mình" được áp ở booking.controller (getBookingAccess).
 *
 * Script này PHẢI chạy SAU khi tất cả domain seeds đã hoàn thành
 * (lookup permissions của dashboard, bookings, classes, members).
 * Có thể chạy độc lập bất kỳ lúc nào để reset lại quyền của role trainer.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { ROLES } = require('./roles');
const { upsertRolePermissions } = require('./seedRoleHelper');

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✓ MongoDB Connected'))
  .catch(err => { console.error('MongoDB connection error:', err); process.exit(1); });

const seedTrainerRole = async () => {
  try {
    console.log('🌱 Seeding trainer role (huấn luyện viên)...\n');

    const required = [
      { resource: 'dashboard', action: 'view'   },
      { resource: 'bookings',  action: 'list'   },
      { resource: 'bookings',  action: 'read'   },
      { resource: 'bookings',  action: 'manage' }, // confirm / complete — own sessions only
      { resource: 'classes',   action: 'list'   },
      { resource: 'classes',   action: 'read'   },
      { resource: 'members',   action: 'list'   },
      { resource: 'members',   action: 'read'   },
      { resource: 'profile',   action: 'read'   },
      { resource: 'profile',   action: 'update' },
    ];

    await upsertRolePermissions(
      ROLES.TRAINER,
      'Huấn luyện viên — xem dashboard, lớp học, hội viên; xác nhận / hoàn thành lịch PT của mình',
      required
    );
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedTrainerRole();

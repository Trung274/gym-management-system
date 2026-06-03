## Why

Admin và Manager cần cái nhìn tổng quan nhanh khi vào hệ thống — số member đang active, check-in hôm nay, booking đang chờ xử lý, thiết bị đang hỏng, lớp học hôm nay... Hiện không có endpoint nào tổng hợp thông tin này.

Module này cung cấp **1 endpoint duy nhất** trả về snapshot toàn bộ hệ thống, dùng parallel aggregation để response nhanh.

## What Changes

**Domain: Dashboard (Read-only)**

- **Không có model mới** — chỉ query từ các collections đã có
- **Không có seed mới** — tái dùng permission `dashboard:view` hoặc kiểm tra role trực tiếp

- API `/api/v1/dashboard`:
  - `GET /`  — Snapshot tổng hợp (Admin, Manager)

### Response Shape

```json
{
  "members": {
    "total": 120,
    "active": 98,
    "suspended": 5,
    "newThisMonth": 12
  },
  "trainers": {
    "total": 8,
    "active": 7
  },
  "bookings": {
    "total": 45,
    "pending": 10,
    "confirmed": 20,
    "completedThisMonth": 15
  },
  "checkins": {
    "today": 34,
    "thisWeek": 180
  },
  "classes": {
    "total": 6,
    "active": 5,
    "todaySchedule": [{ "name": "Yoga", "startTime": "06:30", "dayOfWeek": 1 }]
  },
  "equipment": {
    "total": 12,
    "operational": 10,
    "maintenance": 1,
    "outOfOrder": 1
  },
  "plans": {
    "total": 3,
    "active": 3
  }
}
```

## Capabilities

### New Capabilities
- `dashboard-overview`: Xem snapshot tổng hợp toàn hệ thống

## Impact

- **Files mới**: `src/controllers/dashboard.controller.js`, `src/routes/dashboard.routes.js`
- **Files sửa**: `src/server.js` (đăng ký route), `src/config/seedRolesPermissions.js` (thêm `dashboard:view`)
- **Breaking changes**: Không

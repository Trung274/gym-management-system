## Why

Phòng gym có các lớp học nhóm (yoga, zumba, cycling, HIIT...) nhưng chưa có hệ thống lên lịch. FE cần hiển thị lịch lớp học để member biết và đến đúng giờ.

**Scope lần này: chỉ lên lịch — không bao gồm đăng ký chỗ (enrollment).**

## What Changes

**Domain: Classes (Group Fitness Schedule)**

- `Class.model.js`:
  - `name` — tên lớp (e.g. "Yoga Buổi Sáng")
  - `category` (enum: `yoga`, `zumba`, `cycling`, `hiit`, `pilates`, `boxing`, `other`)
  - `description`
  - `trainer` (ref Trainer) — huấn luyện viên phụ trách
  - `location` — phòng tập / khu vực
  - `capacity` — sĩ số tối đa
  - `schedule` — array object lịch tái diễn: `{ dayOfWeek (0-6), startTime (HH:MM), endTime (HH:MM) }`
  - `startDate`, `endDate` — thời gian khoá học có hiệu lực
  - `status` (enum: `active`, `cancelled`, `completed`) — trạng thái
  - `notes`

- API `/api/v1/classes`:
  - `GET    /`             — Danh sách lớp học active (Public), filter: category, trainer
  - `GET    /:id`          — Chi tiết lớp học (Public)
  - `POST   /`             — Tạo lớp học mới (Admin, Manager)
  - `PUT    /:id`          — Cập nhật thông tin (Admin, Manager)
  - `PATCH  /:id/status`   — Đổi trạng thái (Admin, Manager)

## Capabilities

### New Capabilities
- `class-management`: Quản lý lịch lớp học nhóm

## Impact

- **Files mới**: `src/models/Class.model.js`, `src/controllers/class.controller.js`, `src/routes/class.routes.js`, `src/config/seedClassPermissions.js`
- **Files sửa**: `src/server.js`, `package.json`
- **Permissions mới**: `classes:list`, `classes:read`, `classes:create`, `classes:update`, `classes:status`
- **Out of scope**: Member enrollment, attendance tracking, waiting list

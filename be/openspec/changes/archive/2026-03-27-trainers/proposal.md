## Why

Phòng gym có huấn luyện viên cá nhân (PT) nhưng hiện chưa có hệ thống để:
- Quản lý thông tin PT: chuyên môn, kinh nghiệm, lịch làm việc
- Giai đoạn sau: cho phép member đặt lịch tập với PT

Cần tạo domain **Trainer** — quản lý danh sách huấn luyện viên, thông tin chuyên môn, trạng thái làm việc.

## What Changes

**Domain: Trainers**

- Tạo `Trainer.model.js` — liên kết 1-1 với User, chứa thông tin PT:
  - `user` (ref User) — tài khoản đăng nhập
  - `phone`, `email`, `idCard`, `address`, `dateOfBirth`, `gender` — thông tin cá nhân
  - `specializations` (array of string) — chuyên môn (e.g. ["yoga", "strength", "cardio"])
  - `experienceYears` — số năm kinh nghiệm
  - `bio` — giới thiệu ngắn
  - `certifications` (array of string) — chứng chỉ
  - `status` (active, inactive) — trạng thái làm việc
  - `hireDate` — ngày bắt đầu làm việc

- Tạo API `/api/v1/trainers`:
  - `GET    /`                — Danh sách PT (Public — khách xem được)
  - `GET    /:id`             — Chi tiết PT (Public)
  - `POST   /`                — Tạo PT mới (tạo User + Trainer cùng lúc) (Admin, Manager)
  - `PUT    /:id`             — Cập nhật thông tin (Admin, Manager)
  - `PATCH  /:id/status`      — Đổi trạng thái active/inactive (Admin, Manager)

- Thêm role `trainer` vào Role enum

## Capabilities

### New Capabilities
- `trainer-management`: CRUD huấn luyện viên — xem, tạo, sửa, đổi trạng thái

## Impact

- **Files mới**: `src/models/Trainer.model.js`, `src/controllers/trainer.controller.js`, `src/routes/trainer.routes.js`, `src/config/seedTrainerPermissions.js`
- **Files sửa**: `src/server.js` (đăng ký route), `src/models/Role.model.js` (thêm `trainer`), `package.json` (thêm `seed:trainers`)
- **Permissions mới**: `trainers:list`, `trainers:read`, `trainers:create`, `trainers:update`, `trainers:status`
- **Breaking changes**: Không có
- **Rollback**: Xoá 4 files mới, bỏ route và enum entry

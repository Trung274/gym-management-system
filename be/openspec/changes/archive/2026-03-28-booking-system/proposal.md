## Why

Hệ thống đã có Member, Trainer. Chưa có cơ chế để member đặt lịch tập cá nhân (PT session) với huấn luyện viên. Cần:
- Member chủ động đặt lịch với PT
- Admin/Manager quản lý và xác nhận lịch
- Theo dõi trạng thái từng buổi tập (pending → confirmed → completed / cancelled)

## What Changes

**Domain: Bookings (PT Session)**

- Tạo `Booking.model.js`:
  - `member` (ref Member) — hội viên đặt lịch
  - `trainer` (ref Trainer) — huấn luyện viên
  - `sessionDate` — ngày buổi tập
  - `startTime`, `endTime` — giờ bắt đầu/kết thúc (string HH:MM)
  - `status` (pending, confirmed, completed, cancelled) — trạng thái
  - `notes` — ghi chú từ member
  - `cancellationReason` — lý do huỷ (nếu có)
  - `createdBy` (ref User) — ai tạo booking

- Tạo API `/api/v1/bookings`:
  - `GET    /`                — Danh sách bookings (Admin, Manager)
  - `GET    /my`              — Bookings của member đang đăng nhập (Protected)
  - `GET    /:id`             — Chi tiết booking (Admin, Manager, hoặc member sở hữu)
  - `POST   /`                — Tạo booking mới (Protected — member tự tạo)
  - `PATCH  /:id/confirm`     — Xác nhận lịch (Admin, Manager)
  - `PATCH  /:id/cancel`      — Huỷ lịch (Admin, Manager, hoặc member sở hữu)
  - `PATCH  /:id/complete`    — Đánh dấu hoàn thành (Admin, Manager)

## Capabilities

### New Capabilities
- `booking-management`: Quản lý lịch đặt PT session

## Impact

- **Files mới**: `src/models/Booking.model.js`, `src/controllers/booking.controller.js`, `src/routes/booking.routes.js`, `src/config/seedBookingPermissions.js`
- **Files sửa**: `src/server.js`, `package.json`
- **Permissions mới**: `bookings:list`, `bookings:read`, `bookings:create`, `bookings:manage` (confirm/complete/cancel bởi admin)
- **Breaking changes**: Không
- **Rollback**: Xoá 4 files mới, bỏ route và permissions

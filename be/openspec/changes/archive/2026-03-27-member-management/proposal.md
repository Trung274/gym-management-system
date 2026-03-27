## Why

Hệ thống hiện chỉ quản lý user (nhân viên/admin). Chưa có cách nào để:
- Đăng ký hội viên (member) với thông tin gói tập, ngày bắt đầu/kết thúc
- Theo dõi trạng thái thành viên (active, expired, suspended)
- Ghi nhận lần check-in cuối cùng

Cần tạo domain **Member** riêng biệt để quản lý vòng đời hội viên từ đăng ký đến hết hạn.

## What Changes

**Domain: Members**

- Tạo `Member.model.js` — model riêng liên kết 1-1 với User, chứa thông tin đặc thù hội viên:
  - `user` (ref User) — tài khoản đăng nhập
  - `phone`, `address`, `dateOfBirth`, `gender`, `idCard`, `email` — thông tin cá nhân
  - `membershipType` (basic, premium, vip) — loại gói
  - `startDate`, `endDate` — thời hạn gói tập
  - `status` (active, expired, suspended) — trạng thái
  - `lastCheckIn` — lần check-in cuối
  - `notes` — ghi chú admin

- Tạo API `/api/v1/members`:
  - `GET    /`               — Xem danh sách hội viên (phân trang, filter theo status/type)
  - `GET    /:id`            — Xem chi tiết hội viên
  - `POST   /`               — Đăng ký hội viên mới (tạo User + Member cùng lúc)
  - `PUT    /:id`            — Cập nhật thông tin hội viên
  - `PATCH  /:id/status`     — Đổi trạng thái (active/suspended)
  - `PATCH  /:id/renew`      — Gia hạn gói tập (cập nhật endDate)
  - `PATCH  /:id/check-in`   — Ghi nhận check-in (cập nhật lastCheckIn)

- Tạo role `member` trong Role enum, seed permissions tương ứng
- Rollback: xoá `Member.model.js`, `member.controller.js`, `member.routes.js`, bỏ đăng ký trong `server.js`, drop collection `members`

## Capabilities

### New Capabilities
- `member-registration`: Đăng ký hội viên mới — tạo User + Member profile cùng lúc
- `member-management`: CRUD hội viên — xem, sửa, đổi trạng thái, gia hạn, check-in

### Modified Capabilities
_(Không thay đổi spec hiện tại)_

## Impact

- **Files mới**: `src/models/Member.model.js`, `src/controllers/member.controller.js`, `src/routes/member.routes.js`, `src/config/seedMemberPermissions.js`
- **Files sửa**: `src/server.js` (đăng ký route), `src/models/Role.model.js` (thêm `member` vào enum), `package.json` (thêm `seed:members`)
- **Collections mới**: `members` (MongoDB)
- **Permissions mới**: `members:list`, `members:read`, `members:create`, `members:update`, `members:status`, `members:checkin`
- **Breaking changes**: Không có

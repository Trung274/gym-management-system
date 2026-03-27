## Why

Hệ thống hiện tại có model `User` và các API CRUD cơ bản (`user.controller.js`, `user.routes.js`), nhưng chưa phân biệt giữa **nhân viên hệ thống** và **hội viên phòng gym**. Mọi người dùng đều được xử lý như nhau qua `/api/v1/users`, thiếu các trường thông tin đặc thù cho từng loại đối tượng (ví dụ: ngày đăng ký gói tập, loại gói, CCCD nhân viên, chức vụ...).

Cần tách biệt hai domain này để:
- Quản lý nhân viên có chức năng riêng: xem danh sách, tạo/sửa/vô hiệu hoá tài khoản, gán vai trò
- Mở đường cho tính năng quản lý hội viên trong tương lai

## What Changes

**Domain: Staff (Nhân viên)**

- Thêm các API quản lý nhân viên dưới `/api/v1/staff`:
  - `GET /api/v1/staff` — Xem danh sách nhân viên (có phân trang, filter theo role/trạng thái)
  - `GET /api/v1/staff/:id` — Xem chi tiết nhân viên
  - `POST /api/v1/staff` — Tạo tài khoản nhân viên (dùng lại logic từ `auth.createUser`)
  - `PUT /api/v1/staff/:id` — Sửa thông tin nhân viên
  - `PATCH /api/v1/staff/:id/deactivate` — Vô hiệu hoá tài khoản (set `isActive: false`)
  - `PATCH /api/v1/staff/:id/activate` — Kích hoạt lại tài khoản
  - `PUT /api/v1/staff/:id/role` — Gán vai trò cho tài khoản nhân viên

- Không tạo model mới — tái sử dụng `User.model.js` với filter theo role (các role không phải `member`)
- Không xoá cứng (`DELETE`) — chỉ vô hiệu hoá (`isActive: false`)
- Rollback: Không có schema change, chỉ thêm routes/controller mới → rollback bằng cách xoá file và bỏ đăng ký trong `server.js`

**Domain: Member (Hội viên)** — _Nằm ngoài scope của change này_

## Capabilities

### New Capabilities
- `staff-management`: Quản lý tài khoản nhân viên — xem danh sách, tạo, sửa, vô hiệu hoá/kích hoạt, gán vai trò

### Modified Capabilities
_(Không có thay đổi requirement ở spec hiện tại)_

## Impact

- **Files mới**: `src/controllers/staff.controller.js`, `src/routes/staff.routes.js`
- **Files sửa**: `src/server.js` (đăng ký route mới)
- **Permissions mới**: `staff:list`, `staff:read`, `staff:create`, `staff:update`, `staff:deactivate`
- **Breaking changes**: Không có
- **Dependencies**: `User.model.js`, `Role.model.js`, `auth.js` (middleware), `asyncHandler`, `ErrorResponse`

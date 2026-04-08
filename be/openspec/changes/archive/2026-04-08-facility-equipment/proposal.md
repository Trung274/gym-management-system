## Why

Phòng gym có nhiều thiết bị cần quản lý: máy chạy, máy kéo cáp, tạ, thảm yoga, v.v. Hiện không có hệ thống theo dõi:
- Thiết bị nào đang hoạt động / hỏng / đang bảo trì
- Lịch bảo trì định kỳ
- Thông tin mua sắm (ngày mua, nhà cung cấp)

Module này cho phép Admin/Manager quản lý kho thiết bị, theo dõi trạng thái và lịch bảo trì. FE có thể hiển thị danh sách thiết bị cho khách/member.

## What Changes

**Domain: Equipment**

- `Equipment.model.js`:
  - `name` — tên thiết bị
  - `category` (enum: `cardio`, `strength`, `flexibility`, `free_weights`, `other`)
  - `brand` — nhà sản xuất
  - `model` — model thiết bị
  - `serialNumber` — số serial (optional, unique if provided)
  - `quantity` — số lượng
  - `status` (enum: `operational`, `maintenance`, `out_of_order`) — trạng thái
  - `location` — vị trí trong phòng gym (e.g. "Khu tạ", "Zone A")
  - `purchaseDate` — ngày mua
  - `purchasePrice` — giá mua
  - `supplier` — nhà cung cấp
  - `lastMaintenanceDate` — ngày bảo trì gần nhất
  - `nextMaintenanceDate` — ngày bảo trì tiếp theo
  - `notes`

- API `/api/v1/equipment`:
  - `GET    /`             — Danh sách thiết bị (Public — filter by category, status)
  - `GET    /:id`          — Chi tiết thiết bị (Public)
  - `POST   /`             — Thêm thiết bị mới (Admin, Manager)
  - `PUT    /:id`          — Cập nhật thông tin (Admin, Manager)
  - `PATCH  /:id/status`   — Đổi trạng thái (Admin, Manager)
  - `DELETE /:id`          — Xoá thiết bị (Admin only)

## Capabilities

### New Capabilities
- `equipment-management`: CRUD thiết bị, theo dõi trạng thái và bảo trì

## Impact

- **Files mới**: `src/models/Equipment.model.js`, `src/controllers/equipment.controller.js`, `src/routes/equipment.routes.js`, `src/config/seedEquipmentPermissions.js`
- **Files sửa**: `src/server.js`, `package.json`
- **Permissions mới**: `equipment:list`, `equipment:read`, `equipment:create`, `equipment:update`, `equipment:status`, `equipment:delete`
- **Breaking changes**: Không

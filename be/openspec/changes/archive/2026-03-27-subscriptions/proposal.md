## Why

Hiện tại `Member.model.js` lưu `membershipType` dưới dạng enum string cứng (`basic`, `premium`, `vip`) mà không có thông tin về:
- Giá tiền của từng gói
- Thời hạn (1 tháng, 3 tháng, 6 tháng, 1 năm...)
- Mô tả và tính linh hoạt khi thêm gói mới

Cần tạo domain **Subscription Plans** — danh mục gói tập — để admin quản lý và để member đăng ký theo gói cụ thể có giá và thời hạn rõ ràng.

## What Changes

**Domain: Subscription Plans**

- Tạo `SubscriptionPlan.model.js` — catalog các gói tập:
  - `name` — tên gói (e.g. "Gói Cơ Bản 1 Tháng")
  - `type` (basic, premium, vip) — loại gói
  - `durationDays` — số ngày (e.g. 30, 90, 180, 365)
  - `price` — giá tiền (số nguyên, VND)
  - `description` — mô tả gói
  - `isActive` — ẩn/hiện gói (không hard delete)

- Tạo API `/api/v1/subscription-plans`:
  - `GET    /`         — Xem danh sách gói tập (Public — hội viên có thể xem)
  - `GET    /:id`      — Xem chi tiết gói (Public)
  - `POST   /`         — Tạo gói mới (Admin, Manager)
  - `PUT    /:id`      — Cập nhật thông tin gói (Admin, Manager)
  - `PATCH  /:id/toggle` — Kích hoạt / vô hiệu hoá gói (Admin, Manager)

- Cập nhật `Member.model.js`: thêm tham chiếu `subscriptionPlan` (ref SubscriptionPlan) bên cạnh `membershipType` hiện tại; khi tạo/gia hạn member có thể chọn plan và tự động tính `endDate = startDate + durationDays`

## Capabilities

### New Capabilities
- `subscription-plans`: Quản lý danh mục gói tập — CRUD + toggle

### Modified Capabilities
- `member-management`: Bổ sung liên kết gói tập khi đăng ký / gia hạn

## Impact

- **Files mới**: `src/models/SubscriptionPlan.model.js`, `src/controllers/subscriptionPlan.controller.js`, `src/routes/subscriptionPlan.routes.js`, `src/config/seedSubscriptionPlans.js`
- **Files sửa**: `src/models/Member.model.js` (thêm `subscriptionPlan` ref), `src/server.js` (đăng ký route), `package.json` (thêm `seed:plans`)
- **Permissions mới**: `plans:list`, `plans:read`, `plans:create`, `plans:update`, `plans:toggle`
- **Breaking changes**: Không — `membershipType` vẫn giữ nguyên, `subscriptionPlan` là trường optional
- **Rollback**: Xoá `SubscriptionPlan.model.js`, `subscriptionPlan.controller.js`, `subscriptionPlan.routes.js`, bỏ đăng ký route, bỏ field `subscriptionPlan` trong Member (migration optional)

## Context

`Member.model.js` hiện có `membershipType: enum['basic','premium','vip']` nhưng không có giá, thời hạn. Cần `SubscriptionPlan` làm catalog riêng mà admin tạo/quản lý, member đăng ký theo plan cụ thể.

## Goals / Non-Goals

**Goals:**
- `SubscriptionPlan.model.js` — catalog gói tập có giá và thời hạn
- 5 API endpoints CRUD + toggle
- `Member.model.js` thêm field `subscriptionPlan` (ref, optional) — không phá vỡ backward compat
- Permissions riêng: `plans:list/read/create/update/toggle`
- GET list + GET detail là **Public** (không cần login — khách hàng xem gói trước khi đăng ký)
- Seed dữ liệu mẫu (3 gói: basic 1th, premium 3th, vip 12th)

**Non-Goals:**
- Không tạo hệ thống payment/billing
- Không tự động tính endDate khi assign (chỉ expose durationDays, controller createMember tự tính)
- Không tạo subscription history

## Decisions

### Decision: GET / và GET /:id là Public
**Lý do**: Khách hàng tiềm năng muốn xem gói trước khi đăng ký — không cần token. Dùng `isActive` để ẩn gói không còn bán mà không cần xoá.

### Decision: Giữ membershipType trong Member, thêm subscriptionPlan ref optional
**Lý do**: Backward compat — các member cũ đã có `membershipType` string. `subscriptionPlan` là optional ref — khi tạo/gia hạn mới có thể truyền `planId`, controller tự suy ra `membershipType` và tính `endDate`.

### Decision: Seed dữ liệu mẫu thay vì chỉ seed permissions
**Lý do**: Plans không có nghĩa gì nếu không có dữ liệu. Seed 3 gói cơ bản để có thể test ngay.

## Affected Files

| File | Thay đổi |
|------|---------|
| `src/models/SubscriptionPlan.model.js` | **[NEW]** Schema: name, type, durationDays, price, description, isActive |
| `src/controllers/subscriptionPlan.controller.js` | **[NEW]** 5 handlers |
| `src/routes/subscriptionPlan.routes.js` | **[NEW]** 5 routes + Swagger JSDoc |
| `src/config/seedSubscriptionPlans.js` | **[NEW]** Seed permissions + 3 sample plans |
| `src/models/Member.model.js` | **[MODIFY]** Thêm `subscriptionPlan` (ref, optional) |
| `src/server.js` | **[MODIFY]** Đăng ký `/api/v1/subscription-plans` |
| `package.json` | **[MODIFY]** Thêm `seed:plans` script |

## Context

Codebase đã có `User.model.js` với đầy đủ fields (`isActive`, `role`, `refreshTokens`, `passwordChangedAt`...) và RBAC middleware (`protect`, `authorize`, `checkPermission`). Hiện có `user.controller.js` + `user.routes.js` cung cấp CRUD chung cho tất cả user.

Cần thêm một domain riêng `staff` phục vụ quản lý nhân viên mà không thay đổi model hiện tại.

## Goals / Non-Goals

**Goals:**
- Tạo `staff.controller.js` và `staff.routes.js` mới
- Tái sử dụng `User.model.js` — không tạo model mới
- Hỗ trợ: list (filter + phân trang), xem chi tiết, tạo, sửa, vô hiệu hoá/kích hoạt, gán role
- Swagger JSDoc đầy đủ theo convention (auth label + security + response codes)
- Thêm 5 permissions mới: `staff:list`, `staff:read`, `staff:create`, `staff:update`, `staff:deactivate`

**Non-Goals:**
- Không tạo `Member` model hay `/api/v1/members` (scope tương lai)
- Không xoá cứng bất kỳ user nào
- Không thay đổi `user.routes.js` hay `user.controller.js` hiện có

## Decisions

### Decision: Tái sử dụng User.model thay vì tạo model riêng
**Lý do**: Nhân viên cũng là user trong hệ thống (đăng nhập, JWT, RBAC đều dùng chung). Tạo model riêng sẽ gây duplicate logic auth.
**Phân biệt staff vs member**: Dựa vào role — staff là những user có role khác `member`. Filter ở query layer, không phải schema.
**Thay thế đã cân nhắc**: Thêm field `userType` vào schema → bị bác vì làm thay đổi model hiện tại và gây migration.

### Decision: Soft delete thay vì hard delete
**Lý do**: Giữ lịch sử, không phá vỡ foreign key references (createdBy). Nhất quán với field `isActive` đã có sẵn trong model.

### Decision: Tạo permissions riêng cho staff domain
**Lý do**: Admin cần gán quyền quản lý nhân viên cho các role trung gian (manager) mà không cần gán toàn bộ quyền users.
**Permissions**: `staff:list`, `staff:read`, `staff:create`, `staff:update`, `staff:deactivate`
**Cách thêm**: Seed qua `src/config/seedStaffPermissions.js` (tuân thủ quy tắc seed riêng per domain) + thêm script `seed:staff` vào `package.json`

### Decision: Sử dụng checkPermission thay vì authorize
**Lý do**: Quản lý nhân viên cần kiểm soát fine-grained (không chỉ dựa vào role name). `checkPermission('staff', 'create')` cho phép gán quyền này cho bất kỳ role nào.

## Risks / Trade-offs

- **Risk**: `GET /api/v1/staff` và `GET /api/v1/users` có thể trả về dữ liệu chồng chéo nếu không filter đúng.
  → **Mitigation**: Staff endpoint filter rõ ràng `role.name !== 'member'` (hoặc theo business rule cụ thể). Document rõ trong Swagger.

- **Risk**: Thêm permissions mới không được seed vào DB → `checkPermission` sẽ từ chối tất cả.
  → **Mitigation**: Tạo `seedStaffPermissions.js` và chạy sau khi deploy. Hướng dẫn trong README.

- **Trade-off**: Không có `Member` model riêng lúc này → sau này khi cần thêm fields đặc thù cho hội viên (ngày hết hạn gói tập, loại gói...) sẽ cần refactor.

## Migration Plan

1. Tạo `src/config/seedStaffPermissions.js` và chạy `npm run seed:staff`
2. Deploy `staff.controller.js` + `staff.routes.js`
3. Đăng ký route trong `server.js`
4. Qua API, assign permissions `staff:*` vào role `admin` (nếu chưa có)
5. **Rollback**: Xoá 2 file mới, bỏ đăng ký trong `server.js`, xoá permissions qua API

## Affected Files

| File | Thay đổi |
|------|---------|
| `src/controllers/staff.controller.js` | **[NEW]** 7 handlers |
| `src/routes/staff.routes.js` | **[NEW]** 7 routes + Swagger JSDoc |
| `src/config/seedStaffPermissions.js` | **[NEW]** Seed 5 permissions |
| `src/server.js` | **[MODIFY]** Đăng ký `/api/v1/staff` route |
| `package.json` | **[MODIFY]** Thêm script `seed:staff` |

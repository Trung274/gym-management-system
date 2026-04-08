## Context

Pattern tương tự SubscriptionPlan — public GET, admin/manager CRUD, không liên kết với User. Không cần populate phức tạp.

`serialNumber` là unique nếu được cung cấp — dùng sparse index (cho phép `null` nhiều lần, nhưng nếu có giá trị thì phải unique).

DELETE chỉ dành cho Admin (không gán cho Manager) — tránh xoá nhầm.

## Goals / Non-Goals

**Goals:**
- `Equipment.model.js` với đầy đủ fields kỹ thuật và bảo trì
- 6 endpoints: GET public, POST/PUT/PATCH/DELETE protected
- Permissions phân quyền: Admin có `equipment:delete`, Manager không có
- Seed permissions + 5 thiết bị mẫu

**Non-Goals:**
- Lịch bảo trì chi tiết (maintenance schedule log) — scope riêng nếu cần
- Booking thiết bị riêng lẻ
- QR code / asset tracking

## Decisions

### Decision: GET / là Public
**Lý do**: Member và khách muốn xem thiết bị phòng gym trước khi đăng ký. Admin/Manager có thể dùng `?status=maintenance` để xem thiết bị đang hỏng.

### Decision: `serialNumber` dùng sparse unique index
**Lý do**: Không phải thiết bị nào cũng có số serial (tạ đơn, thảm...). Sparse index cho phép nhiều document có `serialNumber: null` nhưng enforce unique khi có giá trị.

### Decision: DELETE chỉ Admin, không có Manager
**Lý do**: Xoá thiết bị là thao tác không thể hoàn tác, nên giới hạn quyền cao nhất.

## Affected Files

| File | Thay đổi |
|------|---------|
| `src/models/Equipment.model.js` | **[NEW]** Schema |
| `src/controllers/equipment.controller.js` | **[NEW]** 6 handlers |
| `src/routes/equipment.routes.js` | **[NEW]** 6 routes + Swagger |
| `src/config/seedEquipmentPermissions.js` | **[NEW]** Permissions + 5 thiết bị mẫu |
| `src/server.js` | **[MODIFY]** Đăng ký route |
| `package.json` | **[MODIFY]** Thêm `seed:equipment` |

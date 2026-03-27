## 1. Seed Permissions

- [x] 1.1 Tạo `src/config/seedStaffPermissions.js` với 5 permissions: `staff:list`, `staff:read`, `staff:create`, `staff:update`, `staff:deactivate`
- [x] 1.2 Thêm script `"seed:staff": "node src/config/seedStaffPermissions.js"` vào `package.json`

## 2. Controller

- [x] 2.1 Tạo `src/controllers/staff.controller.js`
- [x] 2.2 Implement `getStaff` — GET danh sách, hỗ trợ phân trang (page, limit) và filter (role name, isActive)
- [x] 2.3 Implement `getStaffById` — GET chi tiết theo ID, trả 404 nếu không tìm thấy
- [x] 2.4 Implement `createStaff` — POST tạo tài khoản, nhận `{ name, email, password, roleName }`, lookup role theo tên, hash password qua model pre-hook
- [x] 2.5 Implement `updateStaff` — PUT cập nhật `name`, `email`
- [x] 2.6 Implement `deactivateStaff` — PATCH set `isActive: false`, chặn tự vô hiệu hóa chính mình, chặn nếu đã deactivated
- [x] 2.7 Implement `activateStaff` — PATCH set `isActive: true`, chặn nếu đã active
- [x] 2.8 Implement `assignRole` — PUT cập nhật role theo `roleName`, lookup role từ DB

## 3. Routes + Swagger JSDoc

- [x] 3.1 Tạo `src/routes/staff.routes.js` với tag Swagger `Staff`
- [x] 3.2 `GET /` — `getStaff` với middleware `protect, checkPermission('staff', 'list')` — summary: `"Get all staff (Requires: staff:list)"`
- [x] 3.3 `GET /:id` — `getStaffById` với `protect, checkPermission('staff', 'read')` — summary: `"Get staff by ID (Requires: staff:read)"`
- [x] 3.4 `POST /` — `createStaff` với `protect, checkPermission('staff', 'create')` — summary: `"Create staff account (Requires: staff:create)"`
- [x] 3.5 `PUT /:id` — `updateStaff` với `protect, checkPermission('staff', 'update')` — summary: `"Update staff info (Requires: staff:update)"`
- [x] 3.6 `PATCH /:id/deactivate` — `deactivateStaff` với `protect, checkPermission('staff', 'deactivate')` — summary: `"Deactivate staff account (Requires: staff:deactivate)"`
- [x] 3.7 `PATCH /:id/activate` — `activateStaff` với `protect, checkPermission('staff', 'deactivate')` — summary: `"Activate staff account (Requires: staff:deactivate)"`
- [x] 3.8 `PUT /:id/role` — `assignRole` với `protect, checkPermission('staff', 'update')` — summary: `"Assign role to staff (Requires: staff:update)"`
- [x] 3.9 Thêm Swagger JSDoc đầy đủ cho từng route (security, parameters, requestBody, responses 200/201/400/401/403/404)

## 4. Đăng Ký Route

- [x] 4.1 Trong `src/server.js`, thêm: `app.use('/api/v1/staff', require('./routes/staff.routes'))`

## 5. Kiểm Tra

- [x] 5.1 Chạy `npm run seed:staff` để seed permissions vào DB
- [x] 5.2 Khởi động server (`npm run dev`), kiểm tra route `/api/v1/staff` xuất hiện trên Swagger UI (`/api-docs`)
- [ ] 5.3 Test `POST /api/v1/staff` tạo nhân viên mới qua Swagger hoặc Postman
- [ ] 5.4 Test `GET /api/v1/staff` với filter `?isActive=false` và `?role=manager`
- [ ] 5.5 Test `PATCH /api/v1/staff/:id/deactivate` và xác nhận chặn tự deactivate chính mình
- [ ] 5.6 Test `PUT /api/v1/staff/:id/role` gán role mới


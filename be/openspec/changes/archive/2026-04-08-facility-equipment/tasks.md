## 1. Model

- [x] 1.1 Tạo `src/models/Equipment.model.js`: name (required), category (enum: cardio/strength/flexibility/free_weights/other), brand, model, serialNumber (sparse unique), quantity (default 1), status (operational/maintenance/out_of_order, default operational), location, purchaseDate, purchasePrice, supplier, lastMaintenanceDate, nextMaintenanceDate, notes. timestamps. Index: category+status, serialNumber (sparse).

## 2. Seed

- [x] 2.1 Tạo `src/config/seedEquipmentPermissions.js`: upsert 6 permissions (`equipment:list/read/create/update/status/delete`). Gán tất cả cho admin. Gán `list/read/create/update/status` (không có `delete`) cho manager. Upsert 5 thiết bị mẫu (treadmill, squat rack, dumbbell set, yoga mat, cable machine).
- [x] 2.2 Thêm `"seed:equipment": "node src/config/seedEquipmentPermissions.js"` vào `package.json`

## 3. Controller

- [x] 3.1 Tạo `src/controllers/equipment.controller.js`
- [x] 3.2 `getEquipment` — filter by `?category=` và `?status=`, sort by category
- [x] 3.3 `getEquipmentById` — 404 nếu không tìm thấy
- [x] 3.4 `createEquipment` — tạo mới, xử lý DuplicateKey error cho serialNumber
- [x] 3.5 `updateEquipment` — PUT với allowedFields (tất cả trừ _id)
- [x] 3.6 `changeEquipmentStatus` — PATCH, validate enum, 404 nếu không tìm thấy
- [x] 3.7 `deleteEquipment` — DELETE, 404 nếu không tìm thấy

## 4. Routes + Swagger JSDoc

- [x] 4.1 Tạo `src/routes/equipment.routes.js` với tag `Equipment`
- [x] 4.2 `GET /` — không middleware — summary: `"Get all equipment (Public)"`
- [x] 4.3 `GET /:id` — không middleware — summary: `"Get equipment by ID (Public)"`
- [x] 4.4 `POST /` — `protect, checkPermission('equipment', 'create')` — summary: `"Add equipment (Admin, Manager)"`
- [x] 4.5 `PUT /:id` — `protect, checkPermission('equipment', 'update')` — summary: `"Update equipment (Admin, Manager)"`
- [x] 4.6 `PATCH /:id/status` — `protect, checkPermission('equipment', 'status')` — summary: `"Change equipment status (Admin, Manager)"`
- [x] 4.7 `DELETE /:id` — `protect, checkPermission('equipment', 'delete')` — summary: `"Delete equipment (Admin)"`
- [x] 4.8 Swagger JSDoc đầy đủ: category enum, status enum, query params

## 5. Đăng Ký Route

- [x] 5.1 `src/server.js`: thêm `app.use('/api/v1/equipment', require('./routes/equipment.routes'))`

## 6. Kiểm Tra

- [x] 6.1 Chạy `npm run seed:equipment`
- [ ] 6.2 `GET /api/v1/equipment` — không cần token, xem 5 thiết bị mẫu
- [ ] 6.3 `GET /api/v1/equipment?category=cardio` — filter
- [ ] 6.4 `POST /api/v1/equipment` — admin thêm thiết bị mới
- [ ] 6.5 `PATCH /api/v1/equipment/:id/status` — đổi sang maintenance
- [ ] 6.6 `DELETE /api/v1/equipment/:id` — admin xoá; manager thử xoá → expect 403

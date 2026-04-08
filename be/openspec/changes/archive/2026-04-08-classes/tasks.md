## 1. Model

- [x] 1.1 Tạo `src/models/Class.model.js`: name (required), category (enum: yoga/zumba/cycling/hiit/pilates/boxing/other, required), description, trainer (ref Trainer), location, capacity (Number), schedule ([{ dayOfWeek (0-6), startTime (HH:MM), endTime (HH:MM) }]), startDate (Date), endDate (Date), status (active/cancelled/completed, default active), notes. timestamps. Pre-hook populate trainer (+ trainer.user). Index: category+status, trainer.

## 2. Seed

- [x] 2.1 Tạo `src/config/seedClassPermissions.js`: upsert 5 permissions (`classes:list/read/create/update/status`), gán tất cả cho admin và manager. Upsert 3 lớp mẫu (yoga sáng T2-T4-T6, zumba chiều T3-T5, cycling T7-CN).
- [x] 2.2 Thêm `"seed:classes": "node src/config/seedClassPermissions.js"` vào `package.json`

## 3. Controller

- [x] 3.1 Tạo `src/controllers/class.controller.js`
- [x] 3.2 `getClasses` — filter `status: active` by default; `?all=true` (cần `req.user`) xem tất cả. Filter `?category=`, `?trainerId=`, `?dayOfWeek=` (match trong `schedule` array)
- [x] 3.3 `getClassById` — populate trainer + trainer.user, 404 nếu không tìm thấy
- [x] 3.4 `createClass` — validate trainer active nếu `trainer` được truyền vào
- [x] 3.5 `updateClass` — PUT, allowedFields bao gồm schedule array
- [x] 3.6 `changeClassStatus` — PATCH, validate enum (active/cancelled/completed)

## 4. Routes + Swagger JSDoc

- [x] 4.1 Tạo `src/routes/class.routes.js` với tag `Classes`
- [x] 4.2 `GET /` — không middleware — summary: `"Get all classes (Public)"`
- [x] 4.3 `GET /:id` — không middleware — summary: `"Get class by ID (Public)"`
- [x] 4.4 `POST /` — `protect, checkPermission('classes', 'create')` — summary: `"Create class (Admin, Manager)"`
- [x] 4.5 `PUT /:id` — `protect, checkPermission('classes', 'update')` — summary: `"Update class (Admin, Manager)"`
- [x] 4.6 `PATCH /:id/status` — `protect, checkPermission('classes', 'status')` — summary: `"Change class status (Admin, Manager)"`
- [x] 4.7 Swagger JSDoc đầy đủ: schedule array schema, category enum, dayOfWeek query param

## 5. Đăng Ký Route

- [x] 5.1 `src/server.js`: thêm `app.use('/api/v1/classes', require('./routes/class.routes'))`

## 6. Kiểm Tra

- [x] 6.1 Chạy `npm run seed:classes`
- [ ] 6.2 `GET /api/v1/classes` — xem 3 lớp mẫu (không cần token)
- [ ] 6.3 `GET /api/v1/classes?dayOfWeek=1` — lọc lớp Thứ 2
- [ ] 6.4 `POST /api/v1/classes` — tạo lớp mới
- [ ] 6.5 `PATCH /api/v1/classes/:id/status` — huỷ lớp, xác nhận không còn trong public list

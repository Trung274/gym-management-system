## 1. Model

- [x] 1.1 Thêm `trainer` vào enum trong `src/models/Role.model.js`
- [x] 1.2 Tạo `src/models/Trainer.model.js`: user (ref User, unique), phone, email, idCard, address, dateOfBirth, gender, specializations ([String]), experienceYears (Number), bio, certifications ([String]), status (active/inactive, default active), hireDate. Dùng timestamps, index trên user + status. Pre-hook populate user.

## 2. Seed

- [x] 2.1 Tạo `src/config/seedTrainerPermissions.js`: seed 5 permissions (`trainers:list/read/create/update/status`), gán cho admin và manager, tạo role `trainer` (permission: profile:read + profile:update)
- [x] 2.2 Thêm `"seed:trainers": "node src/config/seedTrainerPermissions.js"` vào `package.json`

## 3. Controller

- [x] 3.1 Tạo `src/controllers/trainer.controller.js`
- [x] 3.2 Implement `getTrainers` — GET danh sách active (public), filter `?specialization=`
- [x] 3.3 Implement `getTrainerById` — GET chi tiết (public)
- [x] 3.4 Implement `createTrainer` — POST tạo User (role=trainer) + Trainer, rollback User nếu Trainer fail
- [x] 3.5 Implement `updateTrainer` — PUT cập nhật phone, email, specializations, experienceYears, bio, certifications
- [x] 3.6 Implement `changeTrainerStatus` — PATCH đổi status (active/inactive)

## 4. Routes + Swagger JSDoc

- [x] 4.1 Tạo `src/routes/trainer.routes.js` với tag `Trainers`
- [x] 4.2 `GET /` — không middleware — summary: `"Get all trainers (Public)"`
- [x] 4.3 `GET /:id` — không middleware — summary: `"Get trainer by ID (Public)"`
- [x] 4.4 `POST /` — `protect, checkPermission('trainers', 'create')` — summary: `"Create trainer (Admin, Manager)"`
- [x] 4.5 `PUT /:id` — `protect, checkPermission('trainers', 'update')` — summary: `"Update trainer info (Admin, Manager)"`
- [x] 4.6 `PATCH /:id/status` — `protect, checkPermission('trainers', 'status')` — summary: `"Change trainer status (Admin, Manager)"`
- [x] 4.7 Swagger JSDoc đầy đủ cho mỗi route

## 5. Đăng Ký Route

- [x] 5.1 `src/server.js`: thêm `app.use('/api/v1/trainers', require('./routes/trainer.routes'))`

## 6. Kiểm Tra

- [x] 6.1 Chạy `npm run seed:trainers`
- [ ] 6.2 `GET /api/v1/trainers` — không cần token
- [ ] 6.3 `POST /api/v1/trainers` — tạo PT mới
- [ ] 6.4 `PATCH /api/v1/trainers/:id/status` — deactivate, xác nhận không còn hiện trong list public

## 1. Model

- [x] 1.1 Tạo `src/models/GymInfo.model.js`: name, tagline, description, address, phone, email, website, logoUrl, coverImageUrl, openingHours ([{ dayOfWeek, openTime, closeTime, isClosed }]), socialLinks ({ facebook, instagram, youtube, tiktok }), established (Number). timestamps.

## 2. Seed

- [x] 2.1 Tạo `src/config/seedGymInfo.js`: upsert permissions `gym:read` và `gym:update`, gán cả 2 cho admin, chỉ `gym:read` cho manager. Upsert 1 document GymInfo mặc định (tên, địa chỉ placeholder, giờ mở cửa 7 ngày).
- [x] 2.2 Thêm `"seed:gym": "node src/config/seedGymInfo.js"` vào `package.json`

## 3. Controller

- [x] 3.1 Tạo `src/controllers/gymInfo.controller.js`
- [x] 3.2 `getGymInfo` — `GymInfo.findOne()`, trả 404 nếu không có
- [x] 3.3 `updateGymInfo` — `GymInfo.findOneAndUpdate({}, body, { upsert: true, new: true, runValidators: true })`

## 4. Routes + Swagger JSDoc

- [x] 4.1 Tạo `src/routes/gymInfo.routes.js` với tag `GymInfo`
- [x] 4.2 `GET /` — không middleware — summary: `"Get gym information (Public)"`
- [x] 4.3 `PUT /` — `protect, checkPermission('gym', 'update')` — summary: `"Update gym information (Admin)"`
- [x] 4.4 Swagger JSDoc đầy đủ, requestBody với openingHours array example

## 5. Đăng Ký Route

- [x] 5.1 `src/server.js`: thêm `app.use('/api/v1/gym-info', require('./routes/gymInfo.routes'))`

## 6. Kiểm Tra

- [x] 6.1 Chạy `npm run seed:gym`
- [x] 6.2 `GET /api/v1/gym-info` — không cần token, nhận thông tin mặc định
- [x] 6.3 `PUT /api/v1/gym-info` — admin đổi tên gym, verify qua GET

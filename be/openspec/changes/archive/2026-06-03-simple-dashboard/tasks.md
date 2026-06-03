## 1. Seed Permission

- [x] 1.1 Tạo `src/config/seedDashboardPermission.js`: upsert permission `dashboard:view`. Gán cho admin và manager.
- [x] 1.2 Thêm `"seed:dashboard": "node src/config/seedDashboardPermission.js"` vào `package.json`
- [x] 1.3 Thêm `seed:dashboard` vào `seedAll.js` (sau `seed:checkins`)

## 2. Controller

- [x] 2.1 Tạo `src/controllers/dashboard.controller.js`
- [x] 2.2 `getDashboard` — dùng `Promise.all` để query song song (18 queries): members ×4, trainers ×2, bookings ×4, checkins ×2, classes ×3, equipment aggregate, plans ×2

## 3. Routes + Swagger JSDoc

- [x] 3.1 Tạo `src/routes/dashboard.routes.js` với tag `Dashboard`
- [x] 3.2 `GET /` — `protect, checkPermission('dashboard', 'view')` — summary: `"Get dashboard snapshot (Admin, Manager)"`
- [x] 3.3 Swagger JSDoc đầy đủ với response schema thể hiện 7 sections

## 4. Đăng Ký Route

- [x] 4.1 `src/server.js`: thêm `app.use('/api/v1/dashboard', require('./routes/dashboard.routes'))`

## 5. Kiểm Tra

- [x] 5.1 Chạy `npm run seed:dashboard`
- [ ] 5.2 `GET /api/v1/dashboard` — admin token → xem đủ 7 sections
- [ ] 5.3 Verify `todaySchedule` đúng theo ngày trong tuần hiện tại
- [ ] 5.4 Member token → expect 403

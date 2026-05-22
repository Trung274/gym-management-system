## 1. Model

- [x] 1.1 Tạo `src/models/CheckinLog.model.js`: member (ref Member, required), checkinAt (Date, default now), note (String), recordedBy (ref User). timestamps. Index: `{ member: 1, checkinAt: -1 }`, `{ checkinAt: -1 }`.

## 2. Seed

- [x] 2.1 Tạo `src/config/seedCheckinPermissions.js`: upsert 3 permissions (`checkins:record`, `checkins:list`, `checkins:read`). Gán cả 3 cho admin và manager.
- [x] 2.2 Thêm `"seed:checkins": "node src/config/seedCheckinPermissions.js"` vào `package.json`

## 3. Controller

- [x] 3.1 Tạo `src/controllers/checkin.controller.js`
- [x] 3.2 `recordCheckin` — POST: tìm Member theo `memberId`, validate `status !== 'suspended'`, tạo CheckinLog, cập nhật `Member.lastCheckIn`
- [x] 3.3 `getCheckins` — GET all: filter `?memberId=`, `?date=` (exact day), `?dateFrom=` + `?dateTo=` (range). Sort `-checkinAt`. Populate `member` (+ `member.user.name`)
- [x] 3.4 `getMyCheckins` — GET /my: tìm Member theo `req.user._id`, trả logs của member đó
- [x] 3.5 `getMemberCheckins` — GET /member/:memberId: 404 nếu member không tồn tại, trả logs
- [x] 3.6 `getCheckinStats` — GET /stats: dùng `$facet` aggregate để tính `todayCount`, `weekCount`, `monthCount`, `peakHour` (group by hour), `dailyTrend` (7 ngày gần nhất group by day)

## 4. Routes + Swagger JSDoc

- [x] 4.1 Tạo `src/routes/checkin.routes.js` với tag `Checkins`
- [x] 4.2 `POST /` — `protect, checkPermission('checkins', 'record')` — summary: `"Record check-in (Admin, Manager)"`
- [x] 4.3 `GET /stats` — `protect, checkPermission('checkins', 'list')` — summary: `"Get check-in stats (Admin, Manager)"` — đăng ký trước `GET /`
- [x] 4.4 `GET /my` — `protect` — summary: `"Get my check-in history (Protected)"`
- [x] 4.5 `GET /member/:memberId` — `protect, checkPermission('checkins', 'read')` — summary: `"Get member check-in history (Admin, Manager)"`
- [x] 4.6 `GET /` — `protect, checkPermission('checkins', 'list')` — summary: `"Get all check-ins (Admin, Manager)"`
- [x] 4.7 Swagger JSDoc đầy đủ: query params (memberId, date, dateFrom, dateTo), stats response schema

## 5. Đăng Ký Route

- [x] 5.1 `src/server.js`: thêm `app.use('/api/v1/checkins', require('./routes/checkin.routes'))`

## 6. Kiểm Tra

- [x] 6.1 Chạy `npm run seed:checkins`
- [ ] 6.2 `POST /api/v1/checkins` — ghi nhận check-in cho member
- [ ] 6.3 Verify `Member.lastCheckIn` đã được cập nhật
- [ ] 6.4 `GET /api/v1/checkins/my` — member xem lịch sử của mình
- [ ] 6.5 `GET /api/v1/checkins/stats` — xem thống kê
- [ ] 6.6 `POST /api/v1/checkins` với member `suspended` → expect 400

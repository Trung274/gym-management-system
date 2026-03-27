## 1. Model

- [x] 1.1 Tạo `src/models/Booking.model.js`: member (ref Member), trainer (ref Trainer), sessionDate (Date), startTime (String HH:MM), endTime (String HH:MM), status (pending/confirmed/completed/cancelled, default pending), notes, cancellationReason, createdBy (ref User). timestamps, index trên trainer+sessionDate+status và member+status.

## 2. Seed

- [x] 2.1 Tạo `src/config/seedBookingPermissions.js`: permissions `bookings:list`, `bookings:read`, `bookings:create`, `bookings:manage`
- [x] 2.2 Gán cho: admin + manager (tất cả 4), member role (chỉ `bookings:create` + `bookings:read`)
- [x] 2.3 Thêm `"seed:bookings": "node src/config/seedBookingPermissions.js"` vào `package.json`

## 3. Controller

- [x] 3.1 Tạo `src/controllers/booking.controller.js`
- [x] 3.2 `getBookings` — GET danh sách (Admin/Manager), filter: status, trainerId, date. Populate member + trainer
- [x] 3.3 `getMyBookings` — GET bookings của req.user (Protected). Tìm Member theo user, lấy bookings theo member._id
- [x] 3.4 `getBookingById` — Admin/Manager xem tất cả; member chỉ xem của mình
- [x] 3.5 `createBooking` — Tìm Member theo req.user, validate trainer active, validate không trùng lịch (check confirmed bookings cùng trainer cùng ngày overlap giờ), tạo booking
- [x] 3.6 `confirmBooking` — Chỉ khi `status: pending` → `confirmed`
- [x] 3.7 `cancelBooking` — Admin/Manager huỷ bất kỳ; member chỉ huỷ `pending` của mình
- [x] 3.8 `completeBooking` — Chỉ khi `status: confirmed` → `completed`

## 4. Routes + Swagger JSDoc

- [x] 4.1 Tạo `src/routes/booking.routes.js` với tag `Bookings`
- [x] 4.2 `GET /` — `protect, checkPermission('bookings', 'list')` — summary: `"Get all bookings (Admin, Manager)"`
- [x] 4.3 `GET /my` — `protect` — summary: `"Get my bookings (Protected)"`
- [x] 4.4 `GET /:id` — `protect, checkPermission('bookings', 'read')` — summary: `"Get booking by ID (Admin, Manager, Member-owner)"`
- [x] 4.5 `POST /` — `protect, checkPermission('bookings', 'create')` — summary: `"Create booking (Protected)"`
- [x] 4.6 `PATCH /:id/confirm` — `protect, checkPermission('bookings', 'manage')` — summary: `"Confirm booking (Admin, Manager)"`
- [x] 4.7 `PATCH /:id/cancel` — `protect` — summary: `"Cancel booking (Admin, Manager, Member-owner)"`
- [x] 4.8 `PATCH /:id/complete` — `protect, checkPermission('bookings', 'manage')` — summary: `"Complete booking (Admin, Manager)"`
- [x] 4.9 Swagger JSDoc đầy đủ: parameters (query filters), requestBody, responses

## 5. Đăng Ký Route

- [x] 5.1 `src/server.js`: thêm `app.use('/api/v1/bookings', require('./routes/booking.routes'))`

## 6. Kiểm Tra

- [x] 6.1 Chạy `npm run seed:bookings`
- [ ] 6.2 `POST /api/v1/bookings` — tạo booking với member token
- [ ] 6.3 `GET /api/v1/bookings/my` — member xem bookings của mình
- [ ] 6.4 `PATCH /api/v1/bookings/:id/confirm` — admin confirm
- [ ] 6.5 `POST /api/v1/bookings` — tạo booking trùng lịch → expect 400
- [ ] 6.6 `PATCH /api/v1/bookings/:id/cancel` — member huỷ booking confirmed → expect 400

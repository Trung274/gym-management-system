## 1. Model

- [x] 1.1 Thêm `member` vào enum trong `src/models/Role.model.js`
- [x] 1.2 Tạo `src/models/Member.model.js` với schema: user (ref User, unique), phone, address, dateOfBirth, gender (male/female/other), membershipType (basic/premium/vip), startDate, endDate, status (active/expired/suspended), lastCheckIn, notes. Dùng timestamps, virtuals, index trên user + status

## 2. Seed Permissions

- [x] 2.1 Tạo `src/config/seedMemberPermissions.js` với 6 permissions: `members:list`, `members:read`, `members:create`, `members:update`, `members:status`, `members:checkin`
- [x] 2.2 Seed tự động gán 6 permissions cho role `admin` và `manager`, tạo role `member` với permission `profile:read` + `profile:update`
- [x] 2.3 Thêm script `"seed:members": "node src/config/seedMemberPermissions.js"` vào `package.json`

## 3. Controller

- [x] 3.1 Tạo `src/controllers/member.controller.js`
- [x] 3.2 Implement `getMembers` — GET danh sách, phân trang (page, limit), filter (status, membershipType), search (name/email)
- [x] 3.3 Implement `getMemberById` — GET chi tiết, populate user (name, email)
- [x] 3.4 Implement `createMember` — POST tạo User (role=member) + Member cùng lúc, manual rollback nếu Member fail
- [x] 3.5 Implement `updateMember` — PUT cập nhật phone, address, membershipType, notes
- [x] 3.6 Implement `changeStatus` — PATCH đổi status (chỉ active ↔ suspended), block giá trị `expired`
- [x] 3.7 Implement `renewMembership` — PATCH cập nhật endDate (phải > now), set status=active, cập nhật membershipType nếu có
- [x] 3.8 Implement `checkIn` — PATCH set lastCheckIn = now, block nếu member không active

## 4. Routes + Swagger JSDoc

- [x] 4.1 Tạo `src/routes/member.routes.js` với tag `Members`
- [x] 4.2 `GET /` — `getMembers` với `protect, checkPermission('members', 'list')` — summary: `"Get all members (Admin, Manager)"`
- [x] 4.3 `GET /:id` — `getMemberById` với `protect, checkPermission('members', 'read')` — summary: `"Get member by ID (Admin, Manager)"`
- [x] 4.4 `POST /` — `createMember` với `protect, checkPermission('members', 'create')` — summary: `"Register new member (Admin, Manager)"`
- [x] 4.5 `PUT /:id` — `updateMember` với `protect, checkPermission('members', 'update')` — summary: `"Update member info (Admin, Manager)"`
- [x] 4.6 `PATCH /:id/status` — `changeStatus` với `protect, checkPermission('members', 'status')` — summary: `"Change member status (Admin, Manager)"`
- [x] 4.7 `PATCH /:id/renew` — `renewMembership` với `protect, checkPermission('members', 'update')` — summary: `"Renew membership (Admin, Manager)"`
- [x] 4.8 `PATCH /:id/check-in` — `checkIn` với `protect, checkPermission('members', 'checkin')` — summary: `"Check-in member (Admin, Manager)"`
- [x] 4.9 Swagger JSDoc đầy đủ cho mỗi route (security, parameters, requestBody, responses)

## 5. Đăng Ký Route

- [x] 5.1 Trong `src/server.js`, thêm: `app.use('/api/v1/members', require('./routes/member.routes'))`

## 6. Kiểm Tra

- [x] 6.1 Chạy `npm run seed:members` để seed permissions
- [ ] 6.2 Khởi động server, xác nhận `/api/v1/members` hiện trên Swagger UI
- [ ] 6.3 Test `POST /api/v1/members` đăng ký hội viên mới
- [ ] 6.4 Test `GET /api/v1/members?status=active&membershipType=vip`
- [ ] 6.5 Test `PATCH /api/v1/members/:id/check-in` — block nếu expired/suspended
- [ ] 6.6 Test `PATCH /api/v1/members/:id/renew` — block nếu endDate trong quá khứ


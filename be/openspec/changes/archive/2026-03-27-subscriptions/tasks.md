## 1. Model

- [x] 1.1 Tạo `src/models/SubscriptionPlan.model.js` với schema: name (unique), type (basic/premium/vip), durationDays (number), price (number), description, isActive (default true). Dùng timestamps, index trên type + isActive
- [x] 1.2 Sửa `src/models/Member.model.js`: thêm field `subscriptionPlan` (ref SubscriptionPlan, optional)

## 2. Seed

- [x] 2.1 Tạo `src/config/seedSubscriptionPlans.js`: seed 5 permissions (`plans:list/read/create/update/toggle`) + gán cho admin và manager + tạo 3 gói mẫu (basic 30 ngày, premium 90 ngày, vip 365 ngày)
- [x] 2.2 Thêm script `"seed:plans": "node src/config/seedSubscriptionPlans.js"` vào `package.json`

## 3. Controller

- [x] 3.1 Tạo `src/controllers/subscriptionPlan.controller.js`
- [x] 3.2 Implement `getPlans` — GET danh sách (chỉ `isActive: true` cho public; admin xem tất cả nếu truyền `?all=true`)
- [x] 3.3 Implement `getPlanById` — GET chi tiết theo ID
- [x] 3.4 Implement `createPlan` — POST tạo gói mới
- [x] 3.5 Implement `updatePlan` — PUT cập nhật thông tin gói
- [x] 3.6 Implement `togglePlan` — PATCH đảo `isActive`

## 4. Routes + Swagger JSDoc

- [x] 4.1 Tạo `src/routes/subscriptionPlan.routes.js` với tag `SubscriptionPlans`
- [x] 4.2 `GET /` — `getPlans` không có middleware — summary: `"Get all subscription plans (Public)"`
- [x] 4.3 `GET /:id` — `getPlanById` không có middleware — summary: `"Get subscription plan by ID (Public)"`
- [x] 4.4 `POST /` — `createPlan` với `protect, checkPermission('plans', 'create')` — summary: `"Create subscription plan (Admin, Manager)"`
- [x] 4.5 `PUT /:id` — `updatePlan` với `protect, checkPermission('plans', 'update')` — summary: `"Update subscription plan (Admin, Manager)"`
- [x] 4.6 `PATCH /:id/toggle` — `togglePlan` với `protect, checkPermission('plans', 'toggle')` — summary: `"Toggle subscription plan status (Admin, Manager)"`
- [x] 4.7 Swagger JSDoc đầy đủ (security chỉ cho route cần protect, responses)

## 5. Đăng Ký Route

- [x] 5.1 Trong `src/server.js`, thêm: `app.use('/api/v1/subscription-plans', require('./routes/subscriptionPlan.routes'))`

## 6. Kiểm Tra

- [x] 6.1 Chạy `npm run seed:plans`
- [ ] 6.2 `GET /api/v1/subscription-plans` — không cần token, chỉ trả active plans
- [ ] 6.3 `POST /api/v1/subscription-plans` — tạo gói mới (cần token admin)
- [ ] 6.4 `PATCH /api/v1/subscription-plans/:id/toggle` — vô hiệu hoá và xác nhận không còn hiện trong public list

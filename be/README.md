# Gym Management System — Backend API

REST API cho hệ thống quản lý phòng gym: Node.js, Express 4, MongoDB (Mongoose 8), JWT (access + refresh token), phân quyền RBAC theo `resource:action`, tài liệu Swagger.

## Cài đặt & chạy

```bash
npm install
# tạo file .env (xem bên dưới)
npm run seed:all   # ⚠️ xóa sạch dữ liệu rồi tạo lại — xem mục Seed
npm run dev        # nodemon, http://localhost:5000
npm start          # production
```

- Swagger UI: `http://localhost:5000/api-docs`
- Health check: `GET /health`
- Base path: `/api/v1`

## Biến môi trường (`.env`)

| Biến | Bắt buộc | Mặc định | Ghi chú |
|---|---|---|---|
| `MONGODB_URI` | ✅ | — | `mongodb://localhost:27017/gym` hoặc chuỗi Atlas |
| `JWT_SECRET` | ✅ | — | Chuỗi ngẫu nhiên ≥ 32 ký tự |
| `JWT_EXPIRE` | ✅ | — | vd. `7d` |
| `JWT_REFRESH_SECRET` | ✅ | — | Khác `JWT_SECRET` |
| `JWT_REFRESH_EXPIRE` | ✅ | — | vd. `30d` |
| `PORT` | | `5000` | |
| `NODE_ENV` | | — | `development` / `production` |
| `API_VERSION` | | `v1` | Đổi base path `/api/<version>` |
| `CORS_ORIGIN` | | — | Danh sách origin, cách nhau bằng dấu phẩy. `http://localhost:3000` luôn được cho phép |
| `RATE_LIMIT_WINDOW_MS` | | `900000` (15 phút) | |
| `RATE_LIMIT_MAX_REQUESTS` | | `10000` | Số request mỗi IP trong một cửa sổ, áp dụng cho `/api/*` |

Khi deploy trên Render, `RENDER_EXTERNAL_HOSTNAME` (Render tự set) cũng được thêm vào danh sách CORS.

## Seed dữ liệu

> ⚠️ **Các script seed XÓA dữ liệu.** `seed:roles` xóa **toàn bộ** Permission, Role và **User** (kể cả admin) rồi tạo lại. Các script domain xóa collection tương ứng (Member, Trainer, Booking, Class, Equipment, CheckinLog…). Không chạy trên database production.

`npm run seed:all` chạy lần lượt:

| # | Script | Làm gì |
|---|---|---|
| 1 | `seed:roles` | Xóa Permission/Role/User → tạo permission cơ bản, role `admin` + `user`, tài khoản admin |
| 2 | `seed:staff` | Permission `staff:*`, role `manager` |
| 3 | `seed:members` | Xóa Member → permission hội viên, role `member` |
| 4 | `seed:plans` | Xóa SubscriptionPlan → permission gói tập + 3 gói mẫu |
| 5 | `seed:trainers` | Xóa Trainer → permission HLV, role `trainer` |
| 6 | `seed:bookings` | Xóa Booking → permission booking (member được `create`/`read`) |
| 7 | `seed:gym` | Xóa GymInfo → permission + thông tin phòng gym mặc định |
| 8 | `seed:equipment` | Xóa Equipment → permission + 5 thiết bị mẫu |
| 9 | `seed:classes` | Xóa Booking + Class → permission + 3 lớp mẫu |
| 10 | `seed:checkins` | Xóa CheckinLog → permission check-in |
| 11 | `seed:dashboard` | Permission `dashboard:view` |
| 12 | `seed:staff-role` | Role `staff` (lễ tân) — chạy cuối vì cần permission của mọi domain |

Mỗi script cũng chạy riêng được (`npm run seed:<tên>`). `seed:staff-role` an toàn để chạy lại bất kỳ lúc nào.

Tài khoản mặc định: **`admin@example.com` / `Admin@123`** — đổi mật khẩu khi dùng thật. Các tài khoản khác (hội viên, HLV, nhân viên) được tạo qua API / trang quản trị kèm mật khẩu.

## Phân quyền

- **Role**: `admin`, `manager`, `staff`, `trainer`, `member`, `user` — định nghĩa trong [src/config/roles.js](src/config/roles.js) (`ROLES`), là nguồn của enum trong `Role.model.js`. Trong code luôn dùng `ROLES.ADMIN`... thay vì viết chuỗi. Thêm role mới: sửa file này và `fe/src/lib/roles.ts`.
- **Permission** là cặp `resource:action`, gán vào role qua các script seed hoặc API `/roles`.
- `admin` bỏ qua mọi kiểm tra permission.

| Role | Quyền chính |
|---|---|
| `admin` | Tất cả |
| `manager` | Toàn bộ nghiệp vụ: hội viên, gói tập, HLV, nhân viên, booking, lớp, thiết bị, check-in, dashboard |
| `staff` | Lễ tân: hội viên, check-in, booking, xem lịch/thiết bị — không quản lý nhân sự hay cấu hình |
| `trainer` | Hồ sơ cá nhân |
| `member` | Hồ sơ cá nhân, tự đặt/hủy lịch PT, xem check-in của mình (endpoint `/me`, `/my`) |

Middleware trong [src/middleware/auth.js](src/middleware/auth.js):

```js
router.get('/', protect, checkPermission('members', 'list'), controller.getMembers); // theo permission
router.get('/', protect, authorize('admin'), controller.getAllUsers);                // theo tên role
router.put('/:id', protect, checkAnyPermission([{ resource, action }, ...]), ...);   // một trong nhiều quyền
```

`protect` kiểm tra JWT, tài khoản còn hoạt động và token được cấp sau lần đổi mật khẩu gần nhất.

## API

Chi tiết request/response xem Swagger. Cột quyền: 🌐 công khai · 🔑 cần đăng nhập · còn lại là permission cần có.

| Module | Endpoint | Quyền |
|---|---|---|
| **Auth** `/auth` | `POST /login`, `POST /refresh-token` | 🌐 |
| | `POST /logout`, `GET /me` | 🔑 |
| | `POST /create-user` | admin + `users:create` |
| **Users** `/users` | `GET /`, `DELETE /:id` | admin |
| | `GET /:id`, `PUT /:id` | 🔑 |
| **Roles** `/roles`, **Permissions** `/permissions` | CRUD | admin |
| **Staff** `/staff` | `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `PUT /:id/role` | `staff:list/read/create/update` |
| | `PATCH /:id/deactivate`, `PATCH /:id/activate` | `staff:deactivate` |
| **Members** `/members` | `GET /me`, `PUT /me` | 🔑 |
| | `GET /`, `GET /:id`, `POST /`, `PUT /:id` | `members:list/read/create/update` |
| | `PATCH /:id/status`, `PATCH /:id/renew`, `PATCH /:id/check-in` | `members:status/update/checkin` |
| **Subscription plans** `/subscription-plans` | `GET /`, `GET /:id` | 🌐 |
| | `POST /`, `PUT /:id`, `PATCH /:id/toggle` | `plans:create/update/toggle` |
| **Trainers** `/trainers` | `GET /`, `GET /:id` | 🌐 |
| | `POST /`, `PUT /:id`, `PATCH /:id/status` | `trainers:create/update/status` |
| **Bookings** `/bookings` | `GET /my`, `PATCH /:id/cancel` | 🔑 |
| | `GET /`, `GET /:id`, `POST /` | `bookings:list/read/create` |
| | `PATCH /:id/confirm`, `PATCH /:id/complete` | `bookings:manage` |
| **Classes** `/classes` | `GET /`, `GET /:id` | 🌐 |
| | `POST /`, `PUT /:id`, `PATCH /:id/status` | `classes:create/update/status` |
| **Equipment** `/equipment` | `GET /`, `GET /:id` | 🌐 |
| | `POST /`, `PUT /:id`, `PATCH /:id/status`, `DELETE /:id` | `equipment:create/update/status/delete` |
| **Gym info** `/gym-info` | `GET /` | 🌐 |
| | `PUT /` | `gym:update` |
| **Check-ins** `/checkins` | `GET /my` | 🔑 |
| | `POST /` | `checkins:record` |
| | `GET /`, `GET /stats`, `GET /member/:memberId` | `checkins:list/read` |
| **Dashboard** `/dashboard` | `GET /` | `dashboard:view` |

Response theo chuẩn `{ success, data, count?, pagination? }`; lỗi trả `{ success: false, message }`.

## Cấu trúc

```
src/
├── server.js            # Entry: middleware bảo mật, CORS, rate limit, đăng ký routes
├── config/              # Kết nối DB, Swagger, các script seed*
├── models/              # Mongoose schemas (User, Role, Permission, Member, Trainer, ...)
├── controllers/         # Logic nghiệp vụ, mỗi domain một file
├── routes/              # Router + Swagger JSDoc, mỗi domain một file
├── middleware/          # auth.js (protect/authorize/checkPermission), errorHandler.js
└── utils/               # asyncHandler, ErrorResponse
openspec/                # Proposal/design/spec/tasks của từng tính năng (archive theo ngày)
```

## Thêm một domain mới

1. Model trong `src/models/`, controller trong `src/controllers/`, router trong `src/routes/` (kèm Swagger JSDoc).
2. Đăng ký router trong `src/server.js`.
3. Tạo script `src/config/seed<Domain>Permissions.js` thêm permission và gán cho `admin`/`manager`; thêm vào `package.json` và vào danh sách trong `seedAll.js` (trước `seed:staff-role`).
4. Nếu lễ tân cần quyền mới, thêm vào danh sách `required` trong `seedStaffRole.js`.

## Test

`npm test` đã cấu hình Jest nhưng hiện chưa có test nào.

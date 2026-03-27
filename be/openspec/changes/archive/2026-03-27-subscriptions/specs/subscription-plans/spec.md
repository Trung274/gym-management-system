## ADDED Requirements

### Requirement: Xem danh sách gói tập
`GET /api/v1/subscription-plans`
Access: **Public**

#### Scenario: Lấy danh sách thành công
- **GIVEN** bất kỳ ai (không cần login)
- **WHEN** `GET /api/v1/subscription-plans`
- **THEN** trả về `200` với danh sách các plan đang `isActive: true`

#### Scenario: Lọc theo type
- **WHEN** `GET /api/v1/subscription-plans?type=premium`
- **THEN** chỉ trả về các gói premium đang active

---

### Requirement: Xem chi tiết gói tập
`GET /api/v1/subscription-plans/:id`
Access: **Public**

#### Scenario: Tìm thấy
- **WHEN** `GET /api/v1/subscription-plans/:id`
- **THEN** trả về `200` với đầy đủ thông tin plan

#### Scenario: Không tìm thấy
- **WHEN** ID không tồn tại
- **THEN** trả về `404`

---

### Requirement: Tạo gói tập mới
`POST /api/v1/subscription-plans`
Roles: Admin, Manager

#### Scenario: Tạo thành công
- **GIVEN** admin/manager đã đăng nhập
- **WHEN** `POST /api/v1/subscription-plans` với `{ name, type, durationDays, price, description? }`
- **THEN** trả về `201` với plan mới, `isActive: true` mặc định

#### Scenario: Thiếu trường bắt buộc
- **WHEN** thiếu `name`, `type`, `durationDays`, hoặc `price`
- **THEN** Mongoose ValidationError → `400`

#### Scenario: Tên gói đã tồn tại
- **WHEN** `name` trùng với plan đã có
- **THEN** MongoDB DuplicateKey → `400`

#### Scenario: Chưa đăng nhập
- **WHEN** không có Bearer token
- **THEN** trả về `401`

#### Scenario: Không có quyền
- **WHEN** user không có `plans:create`
- **THEN** trả về `403`

---

### Requirement: Cập nhật gói tập
`PUT /api/v1/subscription-plans/:id`
Roles: Admin, Manager

#### Scenario: Cập nhật thành công
- **WHEN** `PUT /api/v1/subscription-plans/:id` với các field muốn thay đổi
- **THEN** trả về `200` với plan đã cập nhật

#### Scenario: Không tìm thấy
- **WHEN** ID không tồn tại
- **THEN** trả về `404`

---

### Requirement: Kích hoạt / Vô hiệu hoá gói
`PATCH /api/v1/subscription-plans/:id/toggle`
Roles: Admin, Manager

#### Scenario: Toggle thành công
- **WHEN** `PATCH /api/v1/subscription-plans/:id/toggle`
- **THEN** trả về `200` với `isActive` đảo chiều (true → false hoặc false → true)

#### Scenario: Không tìm thấy
- **WHEN** ID không tồn tại
- **THEN** trả về `404`

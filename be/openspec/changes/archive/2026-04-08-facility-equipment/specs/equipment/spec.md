## ADDED Requirements

### Requirement: Xem danh sách thiết bị
`GET /api/v1/equipment`
Access: **Public**

#### Scenario: Lấy danh sách
- **GIVEN** bất kỳ ai
- **WHEN** `GET /api/v1/equipment`
- **THEN** `200` với toàn bộ thiết bị, sort theo category

#### Scenario: Filter theo category
- **WHEN** `GET /api/v1/equipment?category=cardio`
- **THEN** chỉ trả thiết bị category `cardio`

#### Scenario: Filter theo status
- **WHEN** `GET /api/v1/equipment?status=maintenance`
- **THEN** chỉ trả thiết bị đang bảo trì

---

### Requirement: Xem chi tiết thiết bị
`GET /api/v1/equipment/:id`
Access: **Public**

#### Scenario: Tìm thấy
- **WHEN** `GET /api/v1/equipment/:id`
- **THEN** `200` với đầy đủ thông tin

#### Scenario: Không tìm thấy
- **WHEN** ID không tồn tại
- **THEN** `404`

---

### Requirement: Thêm thiết bị mới
`POST /api/v1/equipment`
Roles: Admin, Manager

#### Scenario: Tạo thành công
- **GIVEN** admin/manager đã đăng nhập
- **WHEN** `POST /api/v1/equipment` với `{ name, category, quantity, status?, location?, ... }`
- **THEN** `201` với document mới

#### Scenario: Trùng serialNumber
- **WHEN** `serialNumber` đã tồn tại trong DB
- **THEN** DuplicateKey → `400`

#### Scenario: Thiếu trường bắt buộc
- **WHEN** thiếu `name` hoặc `category`
- **THEN** ValidationError → `400`

---

### Requirement: Cập nhật thông tin thiết bị
`PUT /api/v1/equipment/:id`
Roles: Admin, Manager

#### Scenario: Cập nhật thành công
- **WHEN** `PUT /api/v1/equipment/:id` với fields cần sửa
- **THEN** `200` với document đã cập nhật

#### Scenario: Không tìm thấy
- **WHEN** ID không tồn tại
- **THEN** `404`

---

### Requirement: Đổi trạng thái thiết bị
`PATCH /api/v1/equipment/:id/status`
Roles: Admin, Manager

#### Scenario: Đổi sang maintenance
- **WHEN** `{ status: "maintenance" }`
- **THEN** `200`

#### Scenario: Status không hợp lệ
- **WHEN** `{ status: "broken" }` (ngoài enum)
- **THEN** `400` — "Invalid status"

---

### Requirement: Xoá thiết bị
`DELETE /api/v1/equipment/:id`
Roles: **Admin only**

#### Scenario: Xoá thành công
- **GIVEN** admin đã đăng nhập
- **WHEN** `DELETE /api/v1/equipment/:id`
- **THEN** `200` — "Equipment deleted"

#### Scenario: Manager cố xoá
- **WHEN** manager gọi DELETE
- **THEN** `403`

#### Scenario: Không tìm thấy
- **WHEN** ID không tồn tại
- **THEN** `404`

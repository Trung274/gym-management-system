## ADDED Requirements

### Requirement: Xem danh sách huấn luyện viên
`GET /api/v1/trainers`
Access: **Public** — chỉ trả `status: active`

#### Scenario: Lấy danh sách thành công
- **GIVEN** bất kỳ ai (không cần login)
- **WHEN** `GET /api/v1/trainers`
- **THEN** `200` với danh sách PT đang active, bao gồm tên, chuyên môn, kinh nghiệm, bio

#### Scenario: Filter theo specialization
- **WHEN** `GET /api/v1/trainers?specialization=yoga`
- **THEN** chỉ trả PT có `"yoga"` trong `specializations`

---

### Requirement: Xem chi tiết huấn luyện viên
`GET /api/v1/trainers/:id`
Access: **Public**

#### Scenario: Tìm thấy
- **WHEN** `GET /api/v1/trainers/:id`
- **THEN** `200` với đầy đủ thông tin PT (populate user: name, email)

#### Scenario: Không tìm thấy
- **WHEN** ID không tồn tại
- **THEN** `404`

---

### Requirement: Tạo huấn luyện viên mới
`POST /api/v1/trainers`
Roles: Admin, Manager

#### Scenario: Tạo thành công
- **GIVEN** admin/manager đã đăng nhập
- **WHEN** `POST /api/v1/trainers` với `{ name, email, password, phone?, specializations?, experienceYears?, bio?, certifications?, hireDate? }`
- **THEN** `201` — tạo User (role=trainer) + Trainer profile

#### Scenario: Email đã tồn tại
- **WHEN** email trùng
- **THEN** DuplicateKey → `400`

#### Scenario: Thiếu trường bắt buộc (User)
- **WHEN** thiếu `name`, `email`, hoặc `password`
- **THEN** ValidationError → `400`, User được rollback

#### Scenario: Không có quyền
- **WHEN** user không có `trainers:create`
- **THEN** `403`

#### Scenario: Chưa đăng nhập
- **WHEN** không có Bearer token
- **THEN** `401`

---

### Requirement: Cập nhật thông tin huấn luyện viên
`PUT /api/v1/trainers/:id`
Roles: Admin, Manager

#### Scenario: Cập nhật thành công
- **WHEN** `PUT /api/v1/trainers/:id` với fields muốn thay đổi
- **THEN** `200` với trainer đã cập nhật

#### Scenario: Không tìm thấy
- **WHEN** ID không tồn tại
- **THEN** `404`

---

### Requirement: Đổi trạng thái huấn luyện viên
`PATCH /api/v1/trainers/:id/status`
Roles: Admin, Manager

#### Scenario: Deactivate
- **WHEN** `PATCH /api/v1/trainers/:id/status` với `{ status: "inactive" }`
- **THEN** `200`, trainer không còn hiện trong public list

#### Scenario: Kích hoạt lại
- **WHEN** `{ status: "active" }`
- **THEN** `200`, trainer hiện lại trong public list

#### Scenario: Status không hợp lệ
- **WHEN** `{ status: "fired" }` hoặc giá trị lạ
- **THEN** `400` — "Status must be active or inactive"

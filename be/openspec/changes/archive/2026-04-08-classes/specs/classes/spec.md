## ADDED Requirements

### Requirement: Xem danh sách lớp học
`GET /api/v1/classes`
Access: **Public**

#### Scenario: Lấy danh sách active
- **GIVEN** bất kỳ ai
- **WHEN** `GET /api/v1/classes`
- **THEN** `200` với tất cả lớp `status: active`, populate trainer.user.name

#### Scenario: Filter theo category
- **WHEN** `GET /api/v1/classes?category=yoga`
- **THEN** chỉ trả lớp yoga

#### Scenario: Filter theo dayOfWeek
- **WHEN** `GET /api/v1/classes?dayOfWeek=1` (1 = Thứ 2)
- **THEN** chỉ trả lớp có buổi vào Thứ 2 trong `schedule`

#### Scenario: Admin xem tất cả kể cả cancelled/completed
- **WHEN** `GET /api/v1/classes?all=true` (cần token)
- **THEN** trả tất cả status

---

### Requirement: Xem chi tiết lớp học
`GET /api/v1/classes/:id`
Access: **Public**

#### Scenario: Tìm thấy
- **WHEN** `GET /api/v1/classes/:id`
- **THEN** `200` với đầy đủ thông tin, populate trainer (user.name, user.email, specializations)

#### Scenario: Không tìm thấy
- **WHEN** ID không tồn tại
- **THEN** `404`

---

### Requirement: Tạo lớp học mới
`POST /api/v1/classes`
Roles: Admin, Manager

#### Scenario: Tạo thành công
- **GIVEN** admin/manager đã đăng nhập
- **WHEN** `POST /api/v1/classes` với `{ name, category, trainer, schedule, startDate, endDate, capacity? }`
- **THEN** `201`

#### Scenario: Trainer không active
- **WHEN** `trainer` là ID của trainer `status: inactive`
- **THEN** `400` — "Trainer is not active"

#### Scenario: Thiếu trường bắt buộc
- **WHEN** thiếu `name`, `category`, hoặc `schedule`
- **THEN** `400`

---

### Requirement: Cập nhật lớp học
`PUT /api/v1/classes/:id`
Roles: Admin, Manager

#### Scenario: Cập nhật thành công
- **WHEN** `PUT /api/v1/classes/:id`
- **THEN** `200`

#### Scenario: Không tìm thấy
- **WHEN** ID không tồn tại
- **THEN** `404`

---

### Requirement: Đổi trạng thái lớp học
`PATCH /api/v1/classes/:id/status`
Roles: Admin, Manager

#### Scenario: Huỷ lớp
- **WHEN** `{ status: "cancelled" }`
- **THEN** `200`, lớp không còn hiện trong public list

#### Scenario: Status không hợp lệ
- **WHEN** `{ status: "paused" }` (ngoài enum)
- **THEN** `400` — "Status must be active, cancelled, or completed"

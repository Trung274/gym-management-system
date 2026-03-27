## ADDED Requirements

### Requirement: Đăng ký hội viên mới
Hệ thống PHẢI cho phép nhân viên đăng ký hội viên mới — tạo User (role=member) + Member profile cùng lúc.

`POST /api/v1/members`
Roles: Admin, Manager

#### Scenario: Đăng ký thành công
- **GIVEN** admin/manager đã đăng nhập
- **WHEN** `POST /api/v1/members` với `{ name, email, password, phone, address, dateOfBirth, gender, membershipType, startDate, endDate }`
- **THEN** trả về `201` với `{ success: true, data: { member } }` bao gồm cả thông tin user
- **AND** tạo User với role `member` + tạo Member profile liên kết

#### Scenario: Email đã tồn tại
- **WHEN** `POST /api/v1/members` với email đã có trong DB
- **THEN** trả về `400` với `{ success: false, error: "Email already exists" }`

#### Scenario: Thiếu trường bắt buộc
- **WHEN** thiếu `name`, `email`, hoặc `password`
- **THEN** Mongoose ValidationError → `400`

#### Scenario: Không có quyền
- **GIVEN** user không có quyền `members:create`
- **WHEN** `POST /api/v1/members`
- **THEN** trả về `403`

#### Scenario: Chưa đăng nhập
- **WHEN** không có Bearer token
- **THEN** trả về `401`

---

### Requirement: Xem danh sách hội viên
Hệ thống PHẢI cho phép xem danh sách hội viên với phân trang và filter.

`GET /api/v1/members`
Roles: Admin, Manager

#### Scenario: Lấy danh sách thành công
- **GIVEN** admin/manager đã đăng nhập
- **WHEN** `GET /api/v1/members`
- **THEN** trả về `200` với `{ success: true, count, total, currentPage, totalPages, data: [...] }`

#### Scenario: Filter theo status
- **WHEN** `GET /api/v1/members?status=expired`
- **THEN** chỉ trả về hội viên có status `expired`

#### Scenario: Filter theo membershipType
- **WHEN** `GET /api/v1/members?membershipType=vip`
- **THEN** chỉ trả về hội viên VIP

#### Scenario: Tìm kiếm theo tên hoặc email
- **WHEN** `GET /api/v1/members?search=nguyen`
- **THEN** trả về hội viên có tên hoặc email chứa "nguyen"

---

### Requirement: Xem chi tiết hội viên
`GET /api/v1/members/:id`
Roles: Admin, Manager

#### Scenario: Tìm thấy
- **GIVEN** admin/manager đã đăng nhập
- **WHEN** `GET /api/v1/members/:id` với ID hợp lệ
- **THEN** trả về `200` với member đầy đủ thông tin (populate user)

#### Scenario: Không tìm thấy
- **WHEN** ID không tồn tại
- **THEN** trả về `404`

---

### Requirement: Cập nhật thông tin hội viên
Hệ thống cho phép cập nhật thông tin cá nhân và gói tập.

`PUT /api/v1/members/:id`
Roles: Admin, Manager

#### Scenario: Cập nhật thành công
- **GIVEN** admin/manager đã đăng nhập
- **WHEN** `PUT /api/v1/members/:id` với `{ phone?, address?, membershipType?, notes? }`
- **THEN** trả về `200` với member đã được cập nhật

#### Scenario: Không tìm thấy
- **WHEN** ID không tồn tại
- **THEN** trả về `404`

---

### Requirement: Đổi trạng thái hội viên
Hệ thống cho phép admin đổi trạng thái hội viên (active ↔ suspended). Không cho phép chuyển sang `expired` thủ công — đó là logic tự động.

`PATCH /api/v1/members/:id/status`
Roles: Admin, Manager

#### Scenario: Suspend hội viên
- **WHEN** `PATCH /api/v1/members/:id/status` với `{ status: "suspended" }`
- **THEN** trả về `200`, member status = `suspended`

#### Scenario: Kích hoạt lại
- **WHEN** `PATCH /api/v1/members/:id/status` với `{ status: "active" }`
- **THEN** trả về `200`, member status = `active`

#### Scenario: Status không hợp lệ
- **WHEN** `{ status: "expired" }` hoặc giá trị không hợp lệ
- **THEN** trả về `400` với `{ success: false, error: "Status must be active or suspended" }`

---

### Requirement: Gia hạn gói tập
`PATCH /api/v1/members/:id/renew`
Roles: Admin, Manager

#### Scenario: Gia hạn thành công
- **WHEN** `PATCH /api/v1/members/:id/renew` với `{ endDate, membershipType? }`
- **THEN** trả về `200`, cập nhật `endDate` (và `membershipType` nếu có), set `status: "active"`

#### Scenario: endDate trong quá khứ
- **WHEN** `endDate` nhỏ hơn ngày hiện tại
- **THEN** trả về `400` với `{ success: false, error: "End date must be in the future" }`

---

### Requirement: Check-in hội viên
`PATCH /api/v1/members/:id/check-in`
Roles: Admin, Manager

#### Scenario: Check-in thành công
- **WHEN** `PATCH /api/v1/members/:id/check-in`
- **THEN** trả về `200`, `lastCheckIn` = thời điểm hiện tại

#### Scenario: Hội viên đã hết hạn hoặc bị suspend
- **GIVEN** member có status `expired` hoặc `suspended`
- **WHEN** `PATCH /api/v1/members/:id/check-in`
- **THEN** trả về `400` với `{ success: false, error: "Member is not active" }`

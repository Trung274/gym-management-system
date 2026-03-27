## ADDED Requirements

### Requirement: Xem danh sách nhân viên
Hệ thống PHẢI cho phép admin xem danh sách tất cả user không thuộc role `member`, có phân trang và filter theo role và trạng thái hoạt động.

`GET /api/v1/staff`
Yêu cầu quyền: `staff:list`

#### Scenario: Lấy danh sách thành công
- **GIVEN** admin đã đăng nhập với quyền `staff:list`
- **WHEN** `GET /api/v1/staff`
- **THEN** trả về `200` với `{ success: true, count, total, currentPage, totalPages, data: [...] }`

#### Scenario: Filter theo role
- **GIVEN** admin đã đăng nhập
- **WHEN** `GET /api/v1/staff?role=manager`
- **THEN** chỉ trả về các nhân viên có role tên `manager`

#### Scenario: Filter theo trạng thái
- **GIVEN** admin đã đăng nhập
- **WHEN** `GET /api/v1/staff?isActive=false`
- **THEN** chỉ trả về các nhân viên đã bị vô hiệu hoá

#### Scenario: Không có quyền
- **GIVEN** user đã đăng nhập nhưng không có quyền `staff:list`
- **WHEN** `GET /api/v1/staff`
- **THEN** trả về `403 Forbidden`

#### Scenario: Chưa đăng nhập
- **WHEN** `GET /api/v1/staff` không có Bearer token
- **THEN** trả về `401 Unauthorized`

---

### Requirement: Xem chi tiết nhân viên
Hệ thống PHẢI cho phép xem thông tin chi tiết của một nhân viên theo ID.

`GET /api/v1/staff/:id`
Yêu cầu quyền: `staff:read`

#### Scenario: Tìm thấy nhân viên
- **GIVEN** admin có quyền `staff:read`
- **WHEN** `GET /api/v1/staff/:id` với ID hợp lệ
- **THEN** trả về `200` với `{ success: true, data: { user } }`

#### Scenario: Không tìm thấy
- **WHEN** `GET /api/v1/staff/:id` với ID không tồn tại
- **THEN** trả về `404` với `{ success: false, error: "Staff not found" }`

#### Scenario: ID không hợp lệ (CastError)
- **WHEN** `GET /api/v1/staff/invalid-id`
- **THEN** `errorHandler` tự xử lý CastError → trả về `404`

---

### Requirement: Tạo tài khoản nhân viên
Hệ thống PHẢI cho phép admin tạo tài khoản nhân viên mới với name, email, password, và roleName.

`POST /api/v1/staff`
Yêu cầu quyền: `staff:create`

#### Scenario: Tạo thành công
- **GIVEN** admin có quyền `staff:create`
- **WHEN** `POST /api/v1/staff` với `{ name, email, password, roleName }`
- **THEN** trả về `201` với `{ success: true, data: { user } }`
- **AND** password được hash trước khi lưu

#### Scenario: Email đã tồn tại
- **WHEN** `POST /api/v1/staff` với email đã có trong DB
- **THEN** trả về `400` với `{ success: false, error: "Email already exists" }`

#### Scenario: Role không tồn tại
- **WHEN** `POST /api/v1/staff` với `roleName` không có trong DB
- **THEN** trả về `400` với `{ success: false, error: "Role not found" }`

#### Scenario: Thiếu trường bắt buộc
- **WHEN** `POST /api/v1/staff` thiếu `email` hoặc `password`
- **THEN** Mongoose ValidationError → `errorHandler` trả về `400`

---

### Requirement: Cập nhật thông tin nhân viên
Hệ thống PHẢI cho phép admin cập nhật `name` và `email` của nhân viên.

`PUT /api/v1/staff/:id`
Yêu cầu quyền: `staff:update`

#### Scenario: Cập nhật thành công
- **GIVEN** admin có quyền `staff:update`
- **WHEN** `PUT /api/v1/staff/:id` với `{ name?, email? }`
- **THEN** trả về `200` với user đã được cập nhật

#### Scenario: Nhân viên không tồn tại
- **WHEN** `PUT /api/v1/staff/:id` với ID không tồn tại
- **THEN** trả về `404`

---

### Requirement: Vô hiệu hoá tài khoản nhân viên
Hệ thống PHẢI cho phép admin vô hiệu hoá tài khoản nhân viên (soft delete, set `isActive: false`). Không được xoá cứng.

`PATCH /api/v1/staff/:id/deactivate`
Yêu cầu quyền: `staff:deactivate`

#### Scenario: Vô hiệu hoá thành công
- **GIVEN** admin có quyền `staff:deactivate`
- **WHEN** `PATCH /api/v1/staff/:id/deactivate`
- **THEN** trả về `200` với `{ success: true, data: { ...user, isActive: false } }`

#### Scenario: Nhân viên đã bị vô hiệu hoá
- **WHEN** `PATCH /api/v1/staff/:id/deactivate` trên tài khoản đã `isActive: false`
- **THEN** trả về `400` với `{ success: false, error: "Account is already deactivated" }`

#### Scenario: Tự vô hiệu hoá chính mình
- **WHEN** admin gọi deactivate với ID của chính họ
- **THEN** trả về `400` với `{ success: false, error: "Cannot deactivate your own account" }`

---

### Requirement: Kích hoạt lại tài khoản nhân viên
Hệ thống PHẢI cho phép admin kích hoạt lại tài khoản đã bị vô hiệu hoá.

`PATCH /api/v1/staff/:id/activate`
Yêu cầu quyền: `staff:deactivate`

#### Scenario: Kích hoạt thành công
- **GIVEN** admin có quyền `staff:deactivate`
- **WHEN** `PATCH /api/v1/staff/:id/activate` trên tài khoản `isActive: false`
- **THEN** trả về `200` với `{ success: true, data: { ...user, isActive: true } }`

#### Scenario: Tài khoản đã active
- **WHEN** `PATCH /api/v1/staff/:id/activate` trên tài khoản đang active
- **THEN** trả về `400` với `{ success: false, error: "Account is already active" }`

---

### Requirement: Gán vai trò cho tài khoản nhân viên
Hệ thống PHẢI cho phép admin thay đổi role của nhân viên bằng cách truyền `roleId` hoặc `roleName`.

`PUT /api/v1/staff/:id/role`
Yêu cầu quyền: `staff:update`

#### Scenario: Gán role thành công
- **GIVEN** admin có quyền `staff:update`
- **WHEN** `PUT /api/v1/staff/:id/role` với `{ roleName: "manager" }`
- **THEN** trả về `200` với user đã được cập nhật role

#### Scenario: Role không tồn tại
- **WHEN** `PUT /api/v1/staff/:id/role` với `roleName` không có trong DB
- **THEN** trả về `400` với `{ success: false, error: "Role not found" }`

## ADDED Requirements

### Requirement: Tạo booking mới
`POST /api/v1/bookings`
Access: **Protected** (any logged-in user)

#### Scenario: Tạo thành công
- **GIVEN** member đã đăng nhập
- **WHEN** `POST /api/v1/bookings` với `{ trainerId, sessionDate, startTime, endTime, notes? }`
- **THEN** `201`, booking tạo với `status: pending`, `member` = member tương ứng với req.user, `createdBy` = req.user

#### Scenario: Trainer không tìm thấy hoặc inactive
- **WHEN** `trainerId` không tồn tại hoặc trainer `status: inactive`
- **THEN** `400` — "Trainer not found or inactive"

#### Scenario: Trùng lịch trainer
- **WHEN** trainer đã có booking `confirmed` trùng ngày và giờ
- **THEN** `400` — "Trainer already has a booking in this time slot"

#### Scenario: Chưa đăng nhập
- **WHEN** không có Bearer token
- **THEN** `401`

---

### Requirement: Xem tất cả bookings
`GET /api/v1/bookings`
Roles: Admin, Manager

#### Scenario: Lấy danh sách
- **GIVEN** admin/manager đã đăng nhập
- **WHEN** `GET /api/v1/bookings`
- **THEN** `200` với danh sách bookings (populate member.user.name, trainer.user.name)

#### Scenario: Filter theo status
- **WHEN** `GET /api/v1/bookings?status=pending`
- **THEN** chỉ trả bookings pending

#### Scenario: Filter theo trainer
- **WHEN** `GET /api/v1/bookings?trainerId=xxx`
- **THEN** chỉ trả bookings của trainer đó

#### Scenario: Filter theo ngày
- **WHEN** `GET /api/v1/bookings?date=2026-03-27`
- **THEN** chỉ trả bookings của ngày đó

---

### Requirement: Xem bookings của mình
`GET /api/v1/bookings/my`
Access: **Protected**

#### Scenario: Member xem bookings của mình
- **GIVEN** member đã đăng nhập
- **WHEN** `GET /api/v1/bookings/my`
- **THEN** `200` với bookings có `member.user = req.user._id`

---

### Requirement: Xem chi tiết booking
`GET /api/v1/bookings/:id`
Access: Admin, Manager, hoặc member sở hữu booking

#### Scenario: Admin xem
- **WHEN** admin gọi `GET /api/v1/bookings/:id`
- **THEN** `200` với đầy đủ thông tin

#### Scenario: Member xem của mình
- **WHEN** member gọi `GET /api/v1/bookings/:id` với booking thuộc về mình
- **THEN** `200`

#### Scenario: Member xem của người khác
- **WHEN** member gọi với booking không thuộc về mình và không có `bookings:list`
- **THEN** `403`

#### Scenario: Không tìm thấy
- **WHEN** ID không tồn tại
- **THEN** `404`

---

### Requirement: Xác nhận booking
`PATCH /api/v1/bookings/:id/confirm`
Roles: Admin, Manager

#### Scenario: Xác nhận thành công
- **WHEN** `PATCH /api/v1/bookings/:id/confirm` với booking `pending`
- **THEN** `200`, status = `confirmed`

#### Scenario: Booking không ở trạng thái pending
- **WHEN** booking đã `confirmed`, `completed`, hoặc `cancelled`
- **THEN** `400` — "Only pending bookings can be confirmed"

---

### Requirement: Huỷ booking
`PATCH /api/v1/bookings/:id/cancel`
Access: Admin, Manager, hoặc member sở hữu (nếu chưa confirmed)

#### Scenario: Admin huỷ bất kỳ
- **WHEN** admin gọi với `{ cancellationReason? }`
- **THEN** `200`, status = `cancelled`

#### Scenario: Member huỷ booking của mình (chưa confirmed)
- **WHEN** member gọi với booking `pending` thuộc về mình
- **THEN** `200`, status = `cancelled`

#### Scenario: Member huỷ booking đã confirmed
- **WHEN** member gọi với booking `confirmed` thuộc về mình
- **THEN** `400` — "Cannot cancel a confirmed booking. Contact admin"

---

### Requirement: Đánh dấu hoàn thành
`PATCH /api/v1/bookings/:id/complete`
Roles: Admin, Manager

#### Scenario: Hoàn thành thành công
- **WHEN** `PATCH /api/v1/bookings/:id/complete` với booking `confirmed`
- **THEN** `200`, status = `completed`

#### Scenario: Booking chưa confirmed
- **WHEN** booking vẫn ở `pending`
- **THEN** `400` — "Only confirmed bookings can be completed"

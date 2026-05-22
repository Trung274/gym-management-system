## ADDED Requirements

### Requirement: Ghi nhận check-in
`POST /api/v1/checkins`
Roles: Admin, Manager

#### Scenario: Ghi nhận thành công
- **GIVEN** admin/manager đã đăng nhập
- **WHEN** `POST /api/v1/checkins` với `{ memberId, note? }`
- **THEN** `201` — tạo `CheckinLog`, cập nhật `Member.lastCheckIn`

#### Scenario: Member không tìm thấy
- **WHEN** `memberId` không tồn tại
- **THEN** `404` — "Member not found"

#### Scenario: Member bị suspended
- **WHEN** `Member.status === 'suspended'`
- **THEN** `400` — "Cannot check in a suspended member"

#### Scenario: Thiếu memberId
- **WHEN** không có `memberId` trong body
- **THEN** `400` — validation error

---

### Requirement: Xem tất cả check-in
`GET /api/v1/checkins`
Roles: Admin, Manager

#### Scenario: Lấy danh sách
- **WHEN** `GET /api/v1/checkins`
- **THEN** `200` với danh sách, sort `-checkinAt`, populate member.user.name

#### Scenario: Filter theo memberId
- **WHEN** `GET /api/v1/checkins?memberId=xxx`
- **THEN** chỉ trả logs của member đó

#### Scenario: Filter theo ngày cụ thể
- **WHEN** `GET /api/v1/checkins?date=2026-05-21`
- **THEN** chỉ trả logs trong ngày đó

#### Scenario: Filter theo khoảng ngày
- **WHEN** `GET /api/v1/checkins?dateFrom=2026-05-01&dateTo=2026-05-31`
- **THEN** trả logs trong khoảng đó

---

### Requirement: Xem lịch sử check-in của mình
`GET /api/v1/checkins/my`
Access: **Protected**

#### Scenario: Member xem lịch sử của mình
- **GIVEN** member đã đăng nhập
- **WHEN** `GET /api/v1/checkins/my`
- **THEN** `200` với logs của member tương ứng với req.user, sort `-checkinAt`

#### Scenario: Không có Member profile
- **WHEN** user không có member profile
- **THEN** `404` — "No member profile found"

---

### Requirement: Xem lịch sử check-in của member cụ thể
`GET /api/v1/checkins/member/:memberId`
Roles: Admin, Manager

#### Scenario: Lấy lịch sử
- **WHEN** `GET /api/v1/checkins/member/:memberId`
- **THEN** `200` với logs của member đó, sort `-checkinAt`

#### Scenario: Member không tồn tại
- **WHEN** memberId không hợp lệ
- **THEN** `404`

---

### Requirement: Thống kê check-in
`GET /api/v1/checkins/stats`
Roles: Admin, Manager

#### Scenario: Lấy thống kê
- **WHEN** `GET /api/v1/checkins/stats`
- **THEN** `200` với:
  - `todayCount` — số check-in hôm nay
  - `weekCount` — số check-in 7 ngày gần nhất
  - `monthCount` — số check-in 30 ngày gần nhất
  - `peakHour` — giờ trong ngày có nhiều check-in nhất (0-23)
  - `dailyTrend` — mảng 7 ngày gần nhất: `[{ date, count }]`

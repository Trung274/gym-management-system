## ADDED Requirements

### Requirement: Lấy thông tin phòng gym
`GET /api/v1/gym-info`
Access: **Public**

#### Scenario: Có dữ liệu
- **GIVEN** bất kỳ ai (không cần token)
- **WHEN** `GET /api/v1/gym-info`
- **THEN** `200` với đầy đủ thông tin phòng gym (name, address, phone, openingHours, socialLinks...)

#### Scenario: Chưa có dữ liệu (chưa seed)
- **WHEN** `GET /api/v1/gym-info` khi DB trống
- **THEN** `404` — "Gym information not found. Run npm run seed:gym"

---

### Requirement: Cập nhật thông tin phòng gym
`PUT /api/v1/gym-info`
Roles: **Admin only**

#### Scenario: Cập nhật thành công
- **GIVEN** admin đã đăng nhập
- **WHEN** `PUT /api/v1/gym-info` với các fields cần thay đổi (partial update)
- **THEN** `200` với document đã được cập nhật (upsert — tạo mới nếu chưa tồn tại)

#### Scenario: Cập nhật openingHours
- **WHEN** truyền `openingHours: [{ dayOfWeek: "Monday", openTime: "06:00", closeTime: "22:00", isClosed: false }]`
- **THEN** `200`, array openingHours được replace hoàn toàn

#### Scenario: Chưa đăng nhập
- **WHEN** không có Bearer token
- **THEN** `401`

#### Scenario: Không phải Admin
- **WHEN** manager hoặc member gọi PUT
- **THEN** `403` — insufficient permission

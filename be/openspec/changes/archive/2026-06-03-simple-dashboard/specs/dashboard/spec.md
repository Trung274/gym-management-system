## ADDED Requirements

### Requirement: Lấy dashboard snapshot
`GET /api/v1/dashboard`
Roles: Admin, Manager

#### Scenario: Lấy thành công
- **GIVEN** admin/manager đã đăng nhập
- **WHEN** `GET /api/v1/dashboard`
- **THEN** `200` với full snapshot gồm 7 sections: members, trainers, bookings, checkins, classes, equipment, plans

#### Scenario: Members section
- `total` — tất cả Member
- `active` — Member `status: active`
- `suspended` — Member `status: suspended`
- `newThisMonth` — Member `createdAt >= đầu tháng hiện tại`

#### Scenario: Trainers section
- `total` — tất cả Trainer
- `active` — Trainer `status: active`

#### Scenario: Bookings section
- `total` — tất cả Booking
- `pending` — Booking `status: pending`
- `confirmed` — Booking `status: confirmed`
- `completedThisMonth` — Booking `status: completed` + `updatedAt >= đầu tháng`

#### Scenario: Checkins section
- `today` — CheckinLog `checkinAt >= đầu ngày hôm nay`
- `thisWeek` — CheckinLog `checkinAt >= 7 ngày trước`

#### Scenario: Classes section
- `total` — tất cả Class
- `active` — Class `status: active`
- `todaySchedule` — Class `status: active` có buổi học vào `dayOfWeek` của hôm nay (server auto-calculate). Trả về `name`, `location`, các schedule item của ngày đó, `startTime` sort tăng dần

#### Scenario: Equipment section
- `total` — tất cả Equipment
- `operational` — `status: operational`
- `maintenance` — `status: maintenance`
- `outOfOrder` — `status: out_of_order`

#### Scenario: Plans section
- `total` — tất cả SubscriptionPlan
- `active` — SubscriptionPlan `isActive: true`

#### Scenario: Chưa đăng nhập
- **WHEN** không có Bearer token
- **THEN** `401`

#### Scenario: Không phải Admin/Manager
- **WHEN** member hoặc trainer gọi endpoint
- **THEN** `403`

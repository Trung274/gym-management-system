## Why

`Member` model hiện chỉ lưu `lastCheckIn` — một trường duy nhất, không có lịch sử. Không thể biết:
- Member đã check-in bao nhiêu lần trong tháng
- Giờ cao điểm của phòng gym
- Member nào đang inactive (check-in ít)

Module này tạo log từng lần quẹt thẻ/check-in, đồng thời cập nhật `lastCheckIn` trên Member để backward compatible.

## What Changes

**Domain: Check-in Log**

- `CheckinLog.model.js`:
  - `member` (ref Member) — hội viên check-in
  - `checkinAt` (Date, default now) — thời điểm check-in
  - `note` — ghi chú tuỳ chọn (VD: "guest check-in", "PT session")
  - `recordedBy` (ref User) — nhân viên ghi nhận (nếu có)

- API `/api/v1/checkins`:
  - `POST   /`             — Ghi nhận check-in (Admin, Manager, Staff)
  - `GET    /`             — Danh sách tất cả check-in (Admin, Manager) — filter: memberId, date, dateFrom/dateTo
  - `GET    /my`           — Lịch sử check-in của member đang đăng nhập (Protected)
  - `GET    /member/:memberId` — Lịch sử check-in của 1 member cụ thể (Admin, Manager)
  - `GET    /stats`        — Thống kê tổng quan: hôm nay, tuần này, tháng này (Admin, Manager)

## Capabilities

### New Capabilities
- `checkin-management`: Ghi nhận và xem lịch sử điểm danh

## Impact

- **Files mới**: `src/models/CheckinLog.model.js`, `src/controllers/checkin.controller.js`, `src/routes/checkin.routes.js`, `src/config/seedCheckinPermissions.js`
- **Files sửa**: `src/server.js` (đăng ký route), `package.json` (thêm seed script), `src/models/Member.model.js` (cập nhật `lastCheckIn` đồng thời khi POST)
- **Permissions mới**: `checkins:record`, `checkins:list`, `checkins:read`
- **Breaking changes**: Không — `lastCheckIn` trên Member vẫn được cập nhật như cũ

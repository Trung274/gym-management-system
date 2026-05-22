## Context

Pattern tương tự Booking — Member ref + timestamp. Không có update/delete (immutable log).

Khi `POST /checkins`, controller phải:
1. Tạo `CheckinLog` document
2. Cập nhật `Member.lastCheckIn = checkinAt` (side effect, backward compat)

`GET /stats` dùng MongoDB aggregation (`$group` theo ngày/tuần/tháng) — không phải tính toán ở app layer.

## Goals / Non-Goals

**Goals:**
- `CheckinLog.model.js` — immutable per-checkin record, index trên `member + checkinAt`
- `POST /` — tạo log + cập nhật `Member.lastCheckIn`; lookup member qua `memberId` body
- `GET /` — Admin/Manager xem tất cả, filter `memberId`, `date`, `dateFrom`, `dateTo`
- `GET /my` — member xem lịch sử của mình (tìm Member qua `req.user`)
- `GET /member/:memberId` — Admin/Manager xem lịch sử member cụ thể
- `GET /stats` — aggregate: `todayCount`, `weekCount`, `monthCount`, `peakHour` (giờ check-in nhiều nhất)
- Seed permissions + không cần seed dữ liệu mẫu (check-in là transactional data)

**Non-Goals:**
- Check-out tracking
- QR code / hardware integration
- Edit/delete log (immutable)
- Per-class attendance (scope của Class Enrollment)

## Decisions

### Decision: `POST /` nhận `memberId` thay vì derive từ token
**Lý do**: Check-in được ghi bởi Staff/Admin tại quầy — không phải member tự check-in. Member không có quyền `checkins:record`. `GET /my` mới là route self-service cho member.

### Decision: `GET /stats` trả về số liệu tổng hợp bằng aggregation
**Lý do**: Tránh lấy toàn bộ log về app để đếm. Dùng `$group + $sum` để tính trực tiếp ở DB.

### Decision: Route order — `/my` và `/stats` trước `/:memberId`
**Lý do**: Express matching — `/my` và `/stats` phải đăng ký trước `/member/:memberId` để không bị capture nhầm.

## Affected Files

| File | Thay đổi |
|------|---------|
| `src/models/CheckinLog.model.js` | **[NEW]** Schema |
| `src/controllers/checkin.controller.js` | **[NEW]** 5 handlers |
| `src/routes/checkin.routes.js` | **[NEW]** 5 routes + Swagger |
| `src/config/seedCheckinPermissions.js` | **[NEW]** Seed permissions |
| `src/models/Member.model.js` | **[MODIFY]** Không cần sửa — cập nhật `lastCheckIn` từ controller |
| `src/server.js` | **[MODIFY]** Đăng ký route |
| `package.json` | **[MODIFY]** Thêm `seed:checkins` |

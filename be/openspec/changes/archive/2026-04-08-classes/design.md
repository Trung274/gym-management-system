## Context

Pattern tương tự Trainer — public GET, admin/manager CRUD. Không cần populate phức tạp ngoài `trainer.user`.

`schedule` là recurring weekly schedule — không phải individual sessions. FE tự render từ `dayOfWeek + startTime/endTime + startDate/endDate`.

Không có enrollment trong scope này → không có `enrolledCount`, `enrolledMembers`, hay validation sĩ số.

## Goals / Non-Goals

**Goals:**
- `Class.model.js` — schedule tái diễn theo tuần, gắn Trainer, status lifecycle
- `GET /` (Public) — filter `?category=`, `?trainerId=`, `?dayOfWeek=`
- `GET /:id` (Public) — chi tiết + populate trainer
- `POST /` / `PUT /:id` / `PATCH /:id/status` — Admin, Manager
- Seed permissions + 3 lớp mẫu

**Non-Goals:**
- Member enrollment / đăng ký chỗ
- Danh sách học viên / attendance
- Waiting list
- Thông báo / reminder

## Decisions

### Decision: `schedule` là array of `{ dayOfWeek, startTime, endTime }`
**Lý do**: Một lớp có thể diễn ra nhiều buổi trong tuần (e.g. T2, T4, T6). FE filter theo `dayOfWeek` để hiển thị lịch theo ngày.

### Decision: `startDate` / `endDate` cho toàn khoá
**Lý do**: Phân biệt lớp đang chạy vs lớp sắp khai giảng vs đã kết thúc — giúp FE filter mà không cần thay status thủ công.

### Decision: Public GET chỉ trả `status: active`
**Lý do**: Lớp `cancelled` hoặc `completed` không cần hiển thị với member/khách. Admin dùng `?all=true` để xem tất cả.

## Affected Files

| File | Thay đổi |
|------|---------|
| `src/models/Class.model.js` | **[NEW]** Schema |
| `src/controllers/class.controller.js` | **[NEW]** 5 handlers |
| `src/routes/class.routes.js` | **[NEW]** 5 routes + Swagger |
| `src/config/seedClassPermissions.js` | **[NEW]** Permissions + 3 lớp mẫu |
| `src/server.js` | **[MODIFY]** Đăng ký route |
| `package.json` | **[MODIFY]** Thêm `seed:classes` |

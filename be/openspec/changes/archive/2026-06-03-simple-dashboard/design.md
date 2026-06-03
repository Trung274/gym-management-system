## Context

Không có model mới. Controller query song song từ 7 collections: `Member`, `Trainer`, `Booking`, `CheckinLog`, `Class`, `Equipment`, `SubscriptionPlan`.

Dùng `Promise.all()` để chạy tất cả queries song song — tổng thời gian = query chậm nhất, không phải tổng cộng.

## Goals / Non-Goals

**Goals:**
- `GET /api/v1/dashboard` — 1 endpoint, Admin + Manager
- Parallel queries với `Promise.all`
- `members`: total, active, suspended, newThisMonth
- `trainers`: total, active
- `bookings`: total, pending, confirmed, completedThisMonth
- `checkins`: today, thisWeek
- `classes`: total, active, todaySchedule (lọc theo dayOfWeek của hôm nay)
- `equipment`: total, by status (operational/maintenance/out_of_order)
- `plans`: total, active (isActive: true)
- Permission `dashboard:view` — seed vào admin + manager

**Non-Goals:**
- Real-time data (không WebSocket)
- Revenue / billing (chưa có Billing module)
- Pagination / filter (đây là snapshot, không phải list)
- Caching (để đơn giản)

## Decisions

### Decision: 1 route duy nhất, không tách thành `/dashboard/members`, `/dashboard/bookings`...
**Lý do**: FE chỉ cần 1 request khi load dashboard page. Tách nhỏ sẽ gây N request song song từ FE — lãng phí.

### Decision: `todaySchedule` filter theo `dayOfWeek` của server, không nhận query param
**Lý do**: Dashboard snapshot — FE không cần truyền ngày. Server tự tính `new Date().getDay()`.

### Decision: Dùng `countDocuments()` thay vì aggregate cho counts đơn giản
**Lý do**: Đơn giản, dễ đọc. Aggregate chỉ dùng khi cần group (checkins) hoặc multiple conditions trong 1 query.

## Affected Files

| File | Thay đổi |
|------|---------|
| `src/controllers/dashboard.controller.js` | **[NEW]** 1 handler với Promise.all |
| `src/routes/dashboard.routes.js` | **[NEW]** 1 route + Swagger |
| `src/config/seedRolesPermissions.js` | không sửa — seed permission riêng |
| `src/config/seedDashboardPermission.js` | **[NEW]** upsert `dashboard:view`, gán cho admin+manager |
| `src/server.js` | **[MODIFY]** Đăng ký route |
| `package.json` | **[MODIFY]** Thêm `seed:dashboard` |

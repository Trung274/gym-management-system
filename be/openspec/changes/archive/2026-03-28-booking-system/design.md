## Context

Member và Trainer đã tồn tại dưới dạng MongoDB documents với ObjectId. Booking là bản ghi trung gian nối 2 domain đó lại với nhau theo thời gian cụ thể.

## Goals / Non-Goals

**Goals:**
- `Booking.model.js` — ref Member + Trainer + session time + status lifecycle
- 7 endpoints: list (Admin/Manager), GET /my (Protected self), GET /:id, POST /, PATCH confirm/cancel/complete
- Member có thể tự tạo booking và xem / huỷ booking của mình
- Admin/Manager có thể xem tất cả, confirm, complete, cancel bất kỳ
- Không trùng lịch: validate trainer không có booking confirmed cùng giờ cùng ngày

**Non-Goals:**
- Không có working schedule cho trainer (chưa có slot hệ thống)
- Không có notification / email
- Không tính tiền / billing

## Decisions

### Decision: `GET /my` endpoint riêng thay vì filter trong `GET /`
**Lý do**: Member chỉ có quyền `bookings:create` + `bookings:read` (xem của mình), không có `bookings:list` (xem tất cả). Dùng route riêng giúp phân quyền rõ ràng — `GET /my` dùng `protect` + lọc theo `req.user`, không cần permission riêng.

### Decision: Permission `bookings:manage` cho confirm/complete/cancel bởi admin
**Lý do**: Gộp 3 hành động quản lý vào 1 permission thay vì tạo 3 permission riêng (confirm/complete/cancel) — phù hợp với quy mô nhỏ. Member huỷ booking của mình không cần permission `bookings:manage`, chỉ cần sở hữu booking đó.

### Decision: Validate trùng lịch trainer khi tạo booking
**Lý do**: Ngăn 2 member đặt cùng 1 trainer cùng ngày cùng giờ (overlap). Kiểm tra `sessionDate` + `startTime` + `endTime` trùng với booking `confirmed` của trainer.

## Affected Files

| File | Thay đổi |
|------|---------|
| `src/models/Booking.model.js` | **[NEW]** Schema + index |
| `src/controllers/booking.controller.js` | **[NEW]** 7 handlers |
| `src/routes/booking.routes.js` | **[NEW]** 7 routes + Swagger |
| `src/config/seedBookingPermissions.js` | **[NEW]** Seed + gán cho admin/manager/member |
| `src/server.js` | **[MODIFY]** Đăng ký route |
| `package.json` | **[MODIFY]** Thêm `seed:bookings` |

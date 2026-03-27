## Context

Codebase đã có pattern thành thục: User → Staff, User → Member đều theo cùng một pattern 1-1 ref, tạo User + domain doc cùng lúc với manual rollback. Trainer theo đúng pattern này.

GET list và GET detail là **Public** (tương tự subscriptionPlan) — khách hàng xem PT trước khi đăng ký dịch vụ.

## Goals / Non-Goals

**Goals:**
- `Trainer.model.js` 1-1 với User (ref)
- 5 endpoints: GET / (Public), GET /:id (Public), POST /, PUT /:id, PATCH /:id/status
- Permissions: `trainers:list/read/create/update/status`
- Seed + gán cho admin/manager + tạo role `trainer`
- Thêm `trainer` vào Role enum

**Non-Goals:**
- Không tạo lịch đặt PT (booking system — scope riêng)
- Không tạo lịch làm việc chi tiết theo ngày/giờ
- Không tính lương / hoa hồng PT

## Decisions

### Decision: GET list/detail là Public (không cần token)
**Lý do**: Khách hàng muốn xem profile PT trước khi đặt lịch. Chỉ hiển thị PT `status: active`.

### Decision: Không tách workingSchedule vào model này
**Lý do**: Lịch làm việc phức tạp (theo ngày, ca, slot) — nên là domain riêng khi cần.

## Affected Files

| File | Thay đổi |
|------|---------|
| `src/models/Trainer.model.js` | **[NEW]** Schema |
| `src/controllers/trainer.controller.js` | **[NEW]** 5 handlers |
| `src/routes/trainer.routes.js` | **[NEW]** 5 routes + Swagger |
| `src/config/seedTrainerPermissions.js` | **[NEW]** Seed permissions + role |
| `src/models/Role.model.js` | **[MODIFY]** Thêm `trainer` vào enum |
| `src/server.js` | **[MODIFY]** Đăng ký route |
| `package.json` | **[MODIFY]** Thêm `seed:trainers` |

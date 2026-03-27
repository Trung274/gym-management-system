## Context

Codebase đã có User model, RBAC (protect/authorize/checkPermission), staff domain hoàn chỉnh. Hệ thống chưa có concept "hội viên" — mọi người đều là User.

Cần thêm `Member` model liên kết 1-1 với User để lưu thông tin đặc thù phòng gym (gói tập, ngày tập, check-in...).

## Goals / Non-Goals

**Goals:**
- Tạo `Member.model.js` liên kết 1-1 với `User` (ref)
- 7 API endpoints cho CRUD + status + renew + check-in
- Permissions riêng: `members:list/read/create/update/status/checkin`
- Seed permissions + gán cho admin/manager
- Thêm `member` vào Role enum
- Swagger JSDoc đầy đủ theo convention (role-based label)

**Non-Goals:**
- Không tạo hệ thống thanh toán/billing
- Không tạo lịch sử check-in (chỉ lưu lastCheckIn)
- Không tạo hệ thống tự động hết hạn (cron job) — chỉ manual status change
- Không tách UI quản lý (frontend scope)

## Decisions

### Decision: Tạo model Member riêng thay vì mở rộng User
**Lý do**: User model phục vụ auth (email, password, role, JWT). Thông tin hội viên (gói tập, ngày tập, check-in) là domain khác, không nên trộn lẫn. Tách ra cho phép:
- User model nhẹ, không bị phình
- Một User có thể vừa là nhân viên vừa từng là hội viên (nếu chuyển role)
- Dễ extend sau này (thêm lịch sử check-in, billing...)

**Thay thế đã cân nhắc**: Thêm fields trực tiếp vào User.model.js → bị bác vì phá vỡ Single Responsibility, mọi query user đều phải load fields không cần thiết.

### Decision: POST /members tạo cả User + Member cùng lúc
**Lý do**: Tránh buộc frontend gọi 2 API (tạo user trước rồi tạo member). Transaction lý tưởng nhưng MongoDB standalone không hỗ trợ — dùng manual rollback (nếu tạo Member fail thì xoá User vừa tạo).

### Decision: Status chỉ cho phép manual toggle active ↔ suspended
**Lý do**: `expired` nên được xác định bởi logic (endDate < now), không nên set thủ công. Tuy nhiên chưa triển khai cron — controller sẽ check và tự update status khi query nếu cần.

### Decision: Role `member` cần thêm vào enum
**Lý do**: `Role.model.js` có enum constraint `['admin', 'user', 'manager']`. Cần thêm `member` để tạo role cho hội viên.

## Risks / Trade-offs

- **Risk**: Tạo User + Member không có transaction → nếu tạo Member fail, có thể có orphan User.
  → **Mitigation**: Xoá User nếu Member creation fails (manual rollback trong controller).

- **Risk**: `lastCheckIn` chỉ lưu lần cuối, không có lịch sử → sau này nếu cần thống kê phải refactor.
  → **Mitigation**: Accept — scope hiện tại chỉ cần last check-in. Tạo CheckInHistory model khi cần.

- **Trade-off**: Không tự động chuyển status sang `expired` → admin phải tự theo dõi ngày hết hạn.
  → **Mitigation**: API renew và list có thể hiển thị cảnh báo nếu `endDate < now`.

## Affected Files

| File | Thay đổi |
|------|---------|
| `src/models/Member.model.js` | **[NEW]** Mongoose schema cho hội viên |
| `src/controllers/member.controller.js` | **[NEW]** 7 handlers |
| `src/routes/member.routes.js` | **[NEW]** 7 routes + Swagger JSDoc |
| `src/config/seedMemberPermissions.js` | **[NEW]** Seed 6 permissions + gán cho admin/manager |
| `src/models/Role.model.js` | **[MODIFY]** Thêm `member` vào enum |
| `src/server.js` | **[MODIFY]** Đăng ký `/api/v1/members` route |
| `package.json` | **[MODIFY]** Thêm script `seed:members` |

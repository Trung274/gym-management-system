## Context

Module này là **singleton** — chỉ có đúng 1 document GymInfo trong DB. Không có list/create/delete — chỉ GET (public) và PUT (admin).

Pattern sử dụng: `findOneAndUpdate` với `upsert: true` để đảm bảo document luôn tồn tại sau lần PUT đầu tiên. Seed file khởi tạo document mặc định nếu chưa có.

## Goals / Non-Goals

**Goals:**
- `GymInfo.model.js` — singleton, mô tả đầy đủ profile phòng gym
- `GET /api/v1/gym-info` — Public, không cần token
- `PUT /api/v1/gym-info` — Admin only (permission `gym:update`)
- Seed tạo document mặc định + permission `gym:read` / `gym:update` gán cho admin

**Non-Goals:**
- Không upload ảnh (logoUrl/coverImageUrl là URL thuần — upload file là scope riêng)
- Không multi-gym (1 instance = 1 gym)
- Không lịch sử thay đổi / audit log

## Decisions

### Decision: Singleton via `upsert` thay vì enforce 1 document ở schema level
**Lý do**: Mongoose không có built-in singleton enforcement. Dùng `findOneAndUpdate({}, data, { upsert: true, new: true })` — đơn giản, không cần custom validator.

### Decision: `openingHours` là array of object thay vì object keyed by day
**Lý do**: Array dễ render hơn ở FE (map qua từng ngày), dễ validate từng ngày riêng, và linh hoạt hơn nếu sau này có lịch đặc biệt (nghỉ lễ).

## Affected Files

| File | Thay đổi |
|------|---------|
| `src/models/GymInfo.model.js` | **[NEW]** Singleton schema |
| `src/controllers/gymInfo.controller.js` | **[NEW]** 2 handlers: getGymInfo, updateGymInfo |
| `src/routes/gymInfo.routes.js` | **[NEW]** 2 routes + Swagger |
| `src/config/seedGymInfo.js` | **[NEW]** Seed document mặc định + permissions |
| `src/server.js` | **[MODIFY]** Đăng ký route |
| `package.json` | **[MODIFY]** Thêm `seed:gym` |

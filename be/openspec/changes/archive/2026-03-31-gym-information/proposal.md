## Why

Frontend cần hiển thị thông tin cơ bản của phòng gym (tên, địa chỉ, giờ mở cửa, liên hệ, mạng xã hội). Hiện chưa có API nào phục vụ điều này — những thông tin này đang bị hardcode ở FE hoặc chưa có.

Cần một module singleton để Admin quản lý hồ sơ phòng gym và FE/public có thể lấy qua API.

## What Changes

**Domain: Gym Information (Singleton)**

- Tạo `GymInfo.model.js` — **singleton document** (chỉ tồn tại 1 document trong DB):
  - `name` — tên phòng gym
  - `tagline` — slogan
  - `description` — mô tả ngắn
  - `address` — địa chỉ
  - `phone` — số điện thoại
  - `email` — email liên hệ
  - `website` — website
  - `logoUrl` — URL logo
  - `coverImageUrl` — URL ảnh bìa
  - `openingHours` — string mô tả giờ mở cửa
  - `socialLinks` — string mô tả các liên kết mạng xã hội
  - `established` — năm thành lập

- API `/api/v1/gym-info`:
  - `GET  /`   — Lấy thông tin phòng gym (Public)
  - `PUT  /`   — Cập nhật thông tin (Admin only)

## Capabilities

### New Capabilities
- `gym-management`: Xem và cập nhật hồ sơ phòng gym

## Impact

- **Files mới**: `src/models/GymInfo.model.js`, `src/controllers/gymInfo.controller.js`, `src/routes/gymInfo.routes.js`, `src/config/seedGymInfo.js`
- **Files sửa**: `src/server.js`, `package.json`
- **Permissions mới**: `gym:read`, `gym:update`
- **Breaking changes**: Không
- **Rollback**: Xoá 4 files mới, bỏ route

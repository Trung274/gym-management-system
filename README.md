# Gym Management System

Hệ thống quản lý phòng gym gồm hai phần:

- **Trang quản trị** cho admin / quản lý / lễ tân / HLV: hội viên, gói tập, HLV, nhân viên, lịch PT, lớp học nhóm, thiết bị, check-in, dashboard.
- **Portal hội viên**: hội viên tự xem hồ sơ, gói tập, lịch sử check-in, đặt lịch PT, xem lớp học, HLV và thông tin phòng gym.

Giao diện hỗ trợ tiếng Việt / tiếng Anh và light / dark mode.

## Cấu trúc repo

```
gym-management-system/
├── be/    # REST API — Node.js, Express 4, MongoDB (Mongoose 8), JWT, Swagger
└── fe/    # Web app — Next.js 16 (App Router), React 19, TypeScript, Tailwind v4, Zustand
```

| | Tài liệu |
|---|---|
| Backend | [be/README.md](be/README.md) — cài đặt, biến môi trường, seed, danh sách API |
| Frontend | [fe/README.md](fe/README.md) — cài đặt, cấu trúc route |
| Kiến trúc & quy tắc code FE | [fe/AGENTS.md](fe/AGENTS.md) — pattern store/service, theming, i18n |
| Spec từng tính năng BE | [be/openspec/changes/archive/](be/openspec/changes/archive/) |

## Chạy local

Yêu cầu: **Node.js 20+** và **MongoDB** (local hoặc Atlas).

```bash
# 1. Backend — http://localhost:5000 (Swagger: /api-docs)
cd be
npm install
# tạo be/.env — xem be/README.md
npm run seed:all      # ⚠️ XÓA toàn bộ dữ liệu cũ rồi tạo dữ liệu mẫu
npm run dev

# 2. Frontend — http://localhost:3000
cd fe
npm install
# tạo fe/.env với NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
npm run dev
```

Đăng nhập bằng tài khoản admin do seed tạo: `admin@example.com` / `Admin@123`. Seed cũng tạo tài khoản mẫu cho mọi vai trò (quản lý, lễ tân, HLV, hội viên — mật khẩu `Gym@123`), xem [be/README.md](be/README.md#seed-dữ-liệu).

## Vai trò

| Role | Sau khi đăng nhập | Ghi chú |
|---|---|---|
| `admin` | `/dashboard` | Có mọi quyền |
| `manager` | `/dashboard` | Quản lý vận hành |
| `staff` | `/dashboard` | Lễ tân |
| `trainer` | `/dashboard` | Huấn luyện viên |
| `member` | `/portal` | Hội viên |

Quyền chi tiết theo cặp `resource:action` (vd. `members:create`), được gán cho role qua các script seed.

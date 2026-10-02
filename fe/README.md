# Gym Management System — Frontend

Web app cho trang quản trị phòng gym và portal hội viên. Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Zustand, Axios.

## Cài đặt & chạy

Cần backend đang chạy (xem [../be/README.md](../be/README.md)).

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # build production
npm start       # chạy bản build
npm run lint
```

File `.env`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

Không set thì mặc định dùng `http://localhost:5000/api/v1`.

## Hai khu vực

Sau khi đăng nhập ở `/login`, người dùng được chuyển theo role (`getHomePath` trong `src/types/member-portal.types.ts`):

| Khu vực | Route group | Role | Trang |
|---|---|---|---|
| Quản trị | `src/app/(protected)/` | admin, manager, staff, trainer | `/dashboard`, `/members`, `/plans`, `/trainers`, `/staff`, `/bookings`, `/group-classes`, `/equipment`, `/checkins`, `/gym-info` |
| Portal hội viên | `src/app/(portal)/portal/` | member | `/portal`, `/portal/profile`, `/portal/checkins`, `/portal/bookings`, `/portal/classes`, `/portal/trainers`, `/portal/gym-info` |

`src/middleware.ts` chặn các route trên khi chưa có cookie `access_token`. Mỗi layout tự đẩy người dùng sai role sang khu vực còn lại.

## Cấu trúc

```
src/
├── app/            # Route groups: (auth), (protected), (portal)
├── components/     # layout/ (Sidebar, Header), ui/ (PageHeader, AddButton, StatsGrid...), providers/
├── hooks/          # useAuth, usePageTitle
├── i18n/           # Engine dịch
├── messages/       # File dịch vi/ và en/, mỗi trang một namespace
├── lib/            # axios.ts, *Service.ts (gọi API), *Helpers.ts (transform dữ liệu)
├── stores/         # Zustand store theo domain
├── types/          # Kiểu dữ liệu theo domain
└── middleware.ts   # Bảo vệ route
```

## Đa ngôn ngữ

Tiếng Việt (mặc định) và tiếng Anh, đổi ở Header; lựa chọn lưu trong `localStorage`. Mọi text giao diện lấy từ `src/messages/{vi,en}/<namespace>.json` qua `useLanguage().t('<namespace>')`. Hai file vi/en phải có cùng bộ key.

## Quy tắc code

Pattern store/service, theming (semantic token `surface-*`, `text-text-*`), component dùng chung, icon (`lucide-react`) và các quy tắc i18n — kể cả lỗi vòng lặp khi đưa translator vào deps của hook — được mô tả trong [AGENTS.md](AGENTS.md). Đọc trước khi thêm trang mới.

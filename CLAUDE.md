# CLAUDE.md

Monorepo quản lý phòng gym: `be/` (Express + MongoDB, JavaScript CommonJS) và `fe/` (Next.js 16 + TypeScript). Tổng quan: [README.md](README.md).

## Lệnh

```bash
# be/
npm run dev            # API ở :5000, Swagger ở /api-docs
npm run seed:all       # ⚠️ xóa sạch DB (kể cả User) rồi seed lại — không chạy khi chưa được yêu cầu

# fe/
npm run dev            # :3000
npx tsc --noEmit -p .  # type-check
npm run lint           # đã có sẵn lỗi cũ (no-explicit-any...) — chỉ cần không phát sinh lỗi mới
npm run build
```

Chưa có test tự động ở cả hai phía.

## Quy ước

- Commit thẳng lên `master`, message dạng `fe: ...` / `be: ...` (chữ thường).
- Frontend: tuân theo [fe/AGENTS.md](fe/AGENTS.md) (được nạp qua `fe/CLAUDE.md`). Những điểm hay sai:
  - Mọi text UI qua i18n; thêm key vào **cả** `fe/src/messages/vi/` và `en/` với cùng cấu trúc.
  - Không đưa translator (`tp`, `ts`, `tCommon`...) vào deps của `useEffect`/`useCallback` → vòng lặp fetch vô hạn.
  - Ngày giờ format theo `lang === 'vi' ? 'vi-VN' : 'en-US'`, không hardcode.
  - Dùng semantic color token (`bg-surface-*`, `text-text-*`), icon từ `lucide-react`, `PageHeader`/`AddButton`/`StatsGrid` cho UI chung.
- Tên role luôn dùng constant `ROLES` — BE: `be/src/config/roles.js`, FE: `fe/src/lib/roles.ts` (hai file phải khớp nhau). Không viết chuỗi `'admin'`, `'member'`... trực tiếp.
- Backend: route mới dùng `protect` + `checkPermission(resource, action)`; permission mới cần script seed và đưa vào `seedAll.js` (xem [be/README.md](be/README.md#thêm-một-domain-mới)). Thêm role mới: sửa `be/src/config/roles.js` (enum của `Role.model.js` lấy từ đây) và `fe/src/lib/roles.ts`.
- Spec tính năng backend nằm trong `be/openspec/changes/archive/`.

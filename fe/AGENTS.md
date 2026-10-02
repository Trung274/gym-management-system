# AGENTS.md — Frontend Architecture Reference

Tài liệu này mô tả kiến trúc, cách ghép API, và các pattern code của dự án frontend này.  
Mục đích: làm tài liệu tham khảo cho **dự án tương tự** về sau, **không phải clone** của dự án này.

---

## Tech Stack

| Thành phần | Công nghệ |
|---|---|
| Framework | **Next.js 16** (App Router) + **React 19** |
| Language | **TypeScript** |
| State Management | **Zustand v5** (devtools + persist middleware) |
| HTTP Client | **Axios v1** (custom instance + interceptors) |
| Token Storage | **js-cookie** (lưu cookie, không localStorage) |
| Notification | **react-hot-toast** |
| Styling | **Tailwind CSS v4** |
| Icons | **lucide-react** (xem mục "Icons") |
| i18n | Tự xây — `src/i18n` + `src/messages` (xem mục "Internationalization") |

---

## Cấu trúc thư mục

```
src/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Root layout (AuthProvider + Toaster)
│   ├── page.tsx                # Landing/redirect page
│   ├── globals.css
│   ├── (auth)/                 # Route group: không cần auth
│   │   └── login/page.tsx
│   ├── (protected)/            # Route group: trang quản trị (admin/manager/staff/trainer)
│   │   ├── layout.tsx          # Layout có Sidebar + Header; member → /portal
│   │   ├── dashboard/
│   │   ├── [entity]/           # Mỗi domain có folder riêng
│   │   └── ...
│   └── (portal)/               # Route group: portal hội viên (role member)
│       ├── layout.tsx          # Navbar riêng; admin roles → /dashboard
│       └── portal/             # /portal, /portal/profile, /portal/bookings, ...
├── components/
│   ├── ProtectedComponent.tsx  # Wrapper kiểm tra permission/role
│   ├── providers/
│   │   ├── LanguageProvider.tsx # Context i18n (lang, setLang, t)
│   │   └── ThemeProvider.tsx    # Light/dark mode
│   ├── layout/                 # Sidebar, Header
│   └── ui/                     # PageHeader, AddButton, StatsGrid, LoadingSpinner
├── hooks/
│   ├── useAuth.ts              # Thin wrapper over authStore
│   └── usePageTitle.ts         # document.title theo ngôn ngữ
├── i18n/index.ts               # Engine dịch
├── messages/{vi,en}/           # File dịch theo namespace
├── lib/
│   ├── axios.ts                # Axios instance + interceptors
│   ├── auth.ts                 # Permission/role helpers (pure functions)
│   ├── storage.ts              # Cookie-based token storage
│   └── [entity]Service.ts      # API call functions theo domain
├── stores/
│   └── [entity]Store.ts        # Zustand stores theo domain
├── types/
│   └── [entity].types.ts       # TypeScript interfaces
└── utils/
    └── toast.ts                # Toast notification wrapper
```

---

## Kiến trúc tổng thể

```
Browser
  │
  ├─► middleware.ts          ─── Kiểm tra cookie → redirect nếu cần
  │
  ├─► AuthProvider           ─── Khởi tạo global state khi app load
  │
  ├─► Zustand Store          ─── Single source of truth cho state
  │       │
  │       └─► Service (lib/) ─── Gọi API qua apiClient (Axios)
  │               │
  │               └─► axios.ts ─── Auto attach token + auto refresh
```

**Luồng xác thực:**
1. `middleware.ts` chạy ở Edge Runtime, đọc cookie để kiểm tra auth.
2. Nếu cần auth mà không có token → redirect `/login?from=<returnUrl>`.
3. `AuthProvider` (client component) sync state từ `zustand persist` + gọi data toàn cục.
4. Các store gọi service functions → service gọi `apiClient`.
5. `apiClient` tự động gắn `Authorization: Bearer <token>` vào mọi request.
6. Khi nhận 401, interceptor tự động gọi `/auth/refresh-token` và retry.

---

## Cách ghép API

### 1. Tạo Axios Instance (`src/lib/axios.ts`)

```typescript
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { tokenStorage } from './storage';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});
```

**Quy tắc:**
- `baseURL` luôn lấy từ env (`NEXT_PUBLIC_API_URL`), có fallback localhost.
- `timeout: 10000` ms — nên cân nhắc tăng nếu API có endpoint chậm.

---

### 2. Request Interceptor — Gắn token tự động

```typescript
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStorage.getToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

Token được đọc từ cookie mỗi lần request → không cần update interceptor khi token thay đổi.

---

### 3. Response Interceptor — Auto Refresh Token

Pattern **"queue + retry"** khi token hết hạn:

```typescript
let isRefreshing = false;
let failedQueue: Array<{ resolve: (v?: any) => void; reject: (r?: any) => void }> = [];

const processQueue = (error: any = null, token: string | null = null) => {
  failedQueue.forEach(p => error ? p.reject(error) : p.resolve(token));
  failedQueue = [];
};

apiClient.interceptors.response.use(
  response => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Nếu đang refresh → queue request lại
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(token => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) {
      isRefreshing = false;
      tokenStorage.clearAll();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    try {
      const response = await axios.post('/auth/refresh-token', { refreshToken });
      const { token: newToken } = response.data.data;
      tokenStorage.setToken(newToken, true);
      processQueue(null, newToken);
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return apiClient(originalRequest);
    } catch (err) {
      processQueue(err, null);
      tokenStorage.clearAll();
      window.location.href = '/login';
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  }
);
```

> **⚠️ Lưu ý cho dự án sau:**  
> Hiện `window.location.href = '/login'` được gọi trực tiếp trong Axios interceptor.  
> Đây là anti-pattern vì interceptor không biết về router context của Next.js.  
> Tốt hơn nên dùng một **event emitter** (hoặc một callback được inject vào interceptor) để
> thông báo cho tầng UI xử lý redirect, tránh hard-code URL.

---

### 4. Token Storage (`src/lib/storage.ts`)

Token lưu vào **cookie** thay vì `localStorage` để middleware server-side có thể đọc được.

```typescript
import Cookies from 'js-cookie';

const COOKIE_OPTIONS = {
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
};

export const tokenStorage = {
  setToken: (token: string, rememberMe = false) =>
    Cookies.set('access_token', token, {
      ...COOKIE_OPTIONS,
      expires: rememberMe ? 7 : undefined, // 7 ngày hoặc session
    }),

  getToken: () => Cookies.get('access_token'),
  removeToken: () => Cookies.remove('access_token', { path: '/' }),

  setRefreshToken: (token: string, rememberMe = false) =>
    Cookies.set('refresh_token', token, {
      ...COOKIE_OPTIONS,
      expires: rememberMe ? 30 : undefined, // 30 ngày nếu remember me
    }),

  getRefreshToken: () => Cookies.get('refresh_token'),
  removeRefreshToken: () => Cookies.remove('refresh_token', { path: '/' }),

  setUser: (user: any, rememberMe = false) =>
    Cookies.set('user_data', JSON.stringify(user), {
      ...COOKIE_OPTIONS,
      expires: rememberMe ? 7 : undefined,
    }),

  getUser: (): any | null => {
    try { return JSON.parse(Cookies.get('user_data') || ''); }
    catch { return null; }
  },

  clearAll: () => {
    tokenStorage.removeToken();
    tokenStorage.removeRefreshToken();
    Cookies.remove('user_data', { path: '/' });
  },
};
```

> **⚠️ Lưu ý cho dự án sau:**  
> Lưu user data (`user_data`) vào cookie là dư thừa và có thể gây lỗi nếu object lớn
> (cookie có giới hạn ~4KB). Chỉ nên lưu `access_token` và `refresh_token` vào cookie
> (để middleware đọc được). User data nên lưu trong Zustand store với `persist` middleware
> dùng `sessionStorage` hoặc `localStorage` tuỳ yêu cầu.

---

## Protected Routes — Middleware

File `src/middleware.ts` xử lý bảo vệ route ở **Edge Runtime** (chạy trước khi render):

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicRoutes = ['/', '/login', '/forgot-password'];
const authRoutes = ['/login', '/forgot-password'];
const protectedPrefixes = ['/dashboard', '/settings', '/admin', /* ... */];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get('access_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;
  const isAuthenticated = !!(accessToken && refreshToken);

  // Đã login → không cho vào trang auth
  if (isAuthenticated && authRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Chưa login → redirect về login với returnUrl
  if (!isAuthenticated && protectedPrefixes.some(p => pathname.startsWith(p))) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*'],
};
```

**Lưu ý quan trọng:**
- Middleware **chỉ kiểm tra sự tồn tại** của cookie, không verify JWT signature (không thể gọi DB ở Edge Runtime).
- Việc verify token thực sự xảy ra khi API backend nhận request.
- Khi token hết hạn, Axios interceptor sẽ tự refresh và retry.

> **⚠️ Lưu ý cho dự án sau:**  
> Thay vì liệt kê `protectedPrefixes` thủ công (dễ quên khi thêm route mới), hãy đảo ngược
> logic: **chỉ khai báo `publicRoutes`**, mọi route còn lại mặc định là protected.
> Điều này an toàn hơn và không cần update middleware mỗi khi thêm trang mới.

---

## State Management — Zustand

### Pattern chuẩn cho mỗi domain store

```typescript
// src/stores/[entity]Store.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { getAll, getStats, create as createEntity, update, remove } from '@/lib/[entity]Service';

interface EntityState {
  items: Entity[];
  stats: EntityStats | null;
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;

  // Actions
  fetchItems: (params?: QueryParams) => Promise<void>;
  fetchStats: () => Promise<void>;
  addItem: (payload: Payload) => Promise<Entity>;
  editItem: (id: string, payload: Partial<Payload>) => Promise<Entity>;
  removeItem: (id: string) => Promise<void>;
  clearError: () => void;
  refreshData: () => Promise<void>;
}

export const useEntityStore = create<EntityState>()(
  devtools(
    (set, get) => ({
      items: [],
      stats: null,
      isLoading: false,
      error: null,
      lastFetched: null,

      fetchItems: async (params) => {
        set({ isLoading: true, error: null });
        try {
          const { items } = await getAll(params);
          set({ items, isLoading: false, lastFetched: Date.now() });
        } catch (error) {
          set({ error: extractErrorMessage(error), isLoading: false });
          throw error; // Re-throw để component có thể catch
        }
      },

      addItem: async (payload) => {
        set({ isLoading: true, error: null });
        try {
          const newItem = await createEntity(payload);
          set(state => ({ items: [...state.items, newItem], isLoading: false }));
          await get().fetchStats(); // Refresh stats sau mutation
          return newItem;
        } catch (error) {
          set({ error: extractErrorMessage(error), isLoading: false });
          throw error;
        }
      },

      editItem: async (id, payload) => {
        set({ isLoading: true, error: null });
        try {
          const updated = await update(id, payload);
          set(state => ({
            items: state.items.map(i => i.id === id ? updated : i),
            isLoading: false,
          }));
          await get().fetchStats();
          return updated;
        } catch (error) {
          set({ error: extractErrorMessage(error), isLoading: false });
          throw error;
        }
      },

      removeItem: async (id) => {
        set({ isLoading: true, error: null });
        try {
          await remove(id);
          set(state => ({ items: state.items.filter(i => i.id !== id), isLoading: false }));
          await get().fetchStats();
        } catch (error) {
          set({ error: extractErrorMessage(error), isLoading: false });
          throw error;
        }
      },

      clearError: () => set({ error: null }),
      refreshData: async () => Promise.all([get().fetchItems(), get().fetchStats()]),

      fetchStats: async () => {
        try {
          const stats = await getStats();
          set({ stats });
        } catch (error) {
          console.error('Stats fetch failed:', error); // Không set error state cho stats
        }
      },
    }),
    { name: '[entity]-store' }
  )
);
```

**Quy tắc:**
- `devtools` bao ngoài để debug với Redux DevTools.
- `persist` chỉ dùng cho `authStore` (token + user). Các store khác không persist.
- `lastFetched` dùng để có thể implement cache-invalidation nếu cần.
- Stats luôn được refresh sau mỗi mutation, nhưng lỗi stats không block UI.
- Store luôn `throw error` sau khi set error state để component UI có thể xử lý thêm (toast, log, v.v.).

> **⚠️ Lưu ý cho dự án sau:**  
> Pattern `await get().fetchStats()` sau mỗi mutation gây ra **N+1 API calls** (mỗi action
> gọi thêm 1 request stats). Với domain ít thay đổi, điều này ổn. Nhưng với domain cần
> real-time cao, hãy cân nhắc chỉ refresh stats khi user vào trang stats, không phải sau
> mỗi mutation.

---

## Auth Store — Pattern đặc biệt

`authStore` dùng thêm `persist` middleware để khôi phục state sau khi reload trang:

```typescript
export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        ...getInitialState(), // Đọc từ cookie khi khởi tạo lần đầu

        login: async (credentials) => {
          set({ isLoading: true, error: null });
          try {
            const response = await apiClient.post<LoginResponse>('/auth/login', {
              email: credentials.email,
              password: credentials.password,
            });
            const { user, token, refreshToken } = response.data.data;
            const rememberMe = credentials.rememberMe || false;

            tokenStorage.setToken(token, rememberMe);
            tokenStorage.setRefreshToken(refreshToken, rememberMe);
            tokenStorage.setUser(user, rememberMe);

            set({ user, token, refreshToken, isAuthenticated: true, isLoading: false, error: null });
          } catch (error: any) {
            set({
              user: null, token: null, refreshToken: null,
              isAuthenticated: false, isLoading: false,
              error: error.response?.data?.message || 'Login failed',
            });
            throw error;
          }
        },

        logout: async () => {
          set({ isLoading: true });
          try {
            await apiClient.post('/auth/logout');
          } catch { /* Tiếp tục logout dù API fail */ } 
          finally {
            tokenStorage.clearAll();
            set({ user: null, token: null, refreshToken: null, isAuthenticated: false, isLoading: false, error: null });
          }
        },

        checkAuth: async () => {
          // Verify token bằng cách gọi /auth/me
          // Nếu fail, thử refresh token
          // Nếu refresh fail → clear state
        },
      }),
      {
        name: 'auth-storage',
        partialize: state => ({    // Chỉ persist những gì cần thiết
          user: state.user,
          token: state.token,
          refreshToken: state.refreshToken,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    { name: 'auth-store' }
  )
);
```

> **⚠️ Lưu ý cho dự án sau:**  
> Zustand `persist` mặc định lưu vào `localStorage`. Nhưng token cũng đang được lưu
> vào cookie (bởi `tokenStorage`). Dẫn đến **trùng lặp**: token tồn tại ở cả 2 nơi.  
> Nên chọn **một nguồn sự thật duy nhất**:
> - `cookie` (để middleware Next.js đọc được) → dùng `tokenStorage`, không persist store.
> - Hoặc chỉ persist `user` profile (không nhạy cảm) vào localStorage, còn token chỉ lưu cookie.

---

## Service Layer — Pattern chuẩn

```typescript
// src/lib/[entity]Service.ts
import apiClient from './axios';
import type { Entity, EntityPayload, EntityApiResponse } from '@/types/entity.types';

/**
 * Get all entities with optional query params
 */
export const getAll = async (params?: QueryParams): Promise<{ items: Entity[] }> => {
  const response = await apiClient.get<EntityListApiResponse>('/entities', { params });
  const items = response.data.data.map(transformEntity); // Nếu cần transform
  return { items, pagination: response.data.pagination };
};

/**
 * Get single entity by ID
 */
export const getById = async (id: string): Promise<Entity> => {
  const response = await apiClient.get<EntityApiResponse>(`/entities/${id}`);
  return transformEntity(response.data.data);
};

/**
 * Create new entity
 */
export const create = async (payload: EntityPayload): Promise<Entity> => {
  const response = await apiClient.post<EntityApiResponse>('/entities', payload);
  return transformEntity(response.data.data);
};

/**
 * Update entity
 */
export const update = async (id: string, payload: Partial<EntityPayload>): Promise<Entity> => {
  const response = await apiClient.put<EntityApiResponse>(`/entities/${id}`, payload);
  return transformEntity(response.data.data);
};

/**
 * Delete entity
 */
export const remove = async (id: string): Promise<void> => {
  await apiClient.delete(`/entities/${id}`);
};
```

**Quy tắc:**
- Service function không catch error — để Zustand store hoặc component xử lý.
- Mỗi function trả về **đã-transformed data** (frontend model), không trả raw API response.
- Dùng `Partial<Payload>` cho update để cho phép patch từng field.

---

## Transform Pattern (API ↔ Frontend Model)

Khi API response có structure khác frontend model, dùng helper function riêng:

```typescript
// src/lib/[entity]Helpers.ts
import type { EntityApiData, Entity } from '@/types/entity.types';

export const transformEntity = (api: EntityApiData): Entity => ({
  id: api._id,           // MongoDB _id → id
  name: api.name,
  // ... map các field khác
  // Computed fields:
  displayLabel: `${api.code} - ${api.name}`,
  // Nested transform nếu cần:
  subItems: api.subItems?.map(transformSubItem) ?? [],
});

export const extractErrorMessage = (error: any): string => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    'Unknown error occurred'
  );
};
```

**Tại sao cần transform:**
- Backend dùng `_id` (MongoDB), frontend dùng `id` → tránh `?.` khắp nơi.
- Computed fields (duration, display labels) tính ở một chỗ.
- Type safety: TypeScript biết exact shape của frontend model.

---

## TypeScript Types — Cấu trúc chuẩn

```typescript
// src/types/entity.types.ts

// === Frontend Model ===
export interface Entity {
  id: string;         // Đã transform từ _id
  name: string;
  status: EntityStatus;
  // ...
}

// === API Raw Response (từ backend) ===
export interface EntityApiData {
  _id: string;        // MongoDB raw
  name: string;
  status: string;
  __v: number;
  // ...
}

// === API Response Wrappers ===
export interface EntityApiResponse {
  success: boolean;
  data: EntityApiData;
}

export interface EntityListApiResponse {
  success: boolean;
  count: number;
  data: EntityApiData[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
  };
}

// === Request Payloads ===
export interface EntityPayload {
  name: string;
  status?: EntityStatus;
}

// === Query Params ===
export interface EntityQueryParams {
  status?: EntityStatus;
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

// === Enums / Union Types ===
export type EntityStatus = 'active' | 'inactive' | 'draft';
```

**Quy tắc:**
- Tách rõ `EntityApiData` (raw) với `Entity` (frontend model).
- API response wrapper (`ApiResponse<T>`) nên generic nếu pattern backend nhất quán.
- Mỗi domain có file `*.types.ts` riêng, không gộp vào `global.types.ts`.

---

## Permission & RBAC

### Role constants (`src/lib/roles.ts`)

Tên role **không bao giờ** viết dạng chuỗi tay (`'admin'`, `'member'`...). Luôn dùng constant:

```typescript
import { ROLES, ADMIN_ROLES, isAdmin, type RoleName } from '@/src/lib/roles';

ROLES.ADMIN                          // 'admin'
isAdmin(user.role?.name)             // admin bypass
ADMIN_ROLES.includes(user.role.name) // admin / manager / staff / trainer → khu quản trị
```

Danh sách role phải khớp với `be/src/config/roles.js` (nguồn của enum trong `Role.model.js`).

### Permission Helpers (`src/lib/auth.ts`)

```typescript
// Kiểm tra một permission cụ thể
export const hasPermission = (user: User | null, resource: string, action: string): boolean => {
  if (!user?.role) return false;
  if (isAdmin(user.role.name)) return true; // Admin bypass
  return user.role.permissions.some(p => p.resource === resource && p.action === action);
};

// Kiểm tra có ít nhất một trong các permissions
export const hasAnyPermission = (user: User | null, permissions: { resource: string; action: string }[]): boolean => {
  if (!user?.role) return false;
  if (isAdmin(user.role.name)) return true;
  return permissions.some(p => hasPermission(user, p.resource, p.action));
};

// Kiểm tra role
export const hasRole = (user: User | null, roleName: string): boolean =>
  user?.role?.name === roleName;

export const hasAnyRole = (user: User | null, roleNames: string[]): boolean =>
  roleNames.includes(user?.role?.name ?? '');
```

### ProtectedComponent — Ẩn/hiện UI theo permission

```tsx
// Dùng trong JSX để ẩn/hiện nút/section theo permission
<ProtectedComponent
  requiredPermission={{ resource: 'users', action: 'delete' }}
  fallback={<span>Không có quyền</span>}
>
  <DeleteButton />
</ProtectedComponent>

// Ẩn hoàn toàn (fallback = null mặc định)
<ProtectedComponent requiredRole="admin">
  <AdminPanel />
</ProtectedComponent>
```

```typescript
// Props của ProtectedComponent
interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  requiredPermission?: { resource: string; action: string };
  requiredAnyPermissions?: { resource: string; action: string }[];
  requiredRole?: string;
  requiredAnyRoles?: string[];
}
```

---

## Auth Provider & Session Management

### AuthProvider

```tsx
// src/components/providers/AuthProvider.tsx — 'use client'
// Chạy ở client, wrap toàn bộ app trong root layout
export default function AuthProvider({ children }) {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const { globalData, fetchGlobalData } = useGlobalStore();

  // Fetch global/shared data khi user đã đăng nhập
  useEffect(() => {
    if (isAuthenticated && !globalData) {
      fetchGlobalData();
    }
  }, [isAuthenticated, globalData, fetchGlobalData]);

  return <>{children}</>;
}
```

### Session Timeout Hook

```typescript
// src/hooks/useSessionTimeout.ts
export const useSessionTimeout = (timeoutMs = 30 * 60 * 1000) => {
  const { logout, isAuthenticated } = useAuth();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimeout = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      toast.custom('Session expired!', '⏰');
      setTimeout(() => logout(), 2000); // Delay để user thấy toast
    }, timeoutMs);
  }, [logout, timeoutMs]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetTimeout));
    resetTimeout(); // Khởi tạo lần đầu

    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimeout));
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isAuthenticated, resetTimeout]);
};
```

Dùng hook này trong protected layout hoặc root layout:
```tsx
// Trong (protected)/layout.tsx
useSessionTimeout(30 * 60 * 1000); // 30 phút
```

---

## Notification System

```typescript
// src/utils/toast.ts — Wrapper over react-hot-toast
export const toast = {
  success: (message: string, duration?: number) => hotToast.success(message, { ... }),
  error: (message: string, duration?: number) => hotToast.error(message, { ... }),
  info: (message: string, duration?: number) => hotToast(message, { icon: 'ℹ️', ... }),
  warning: (message: string, duration?: number) => hotToast(message, { icon: '⚠️', ... }),
  custom: (message: string, icon: string, duration?: number) => hotToast(message, { icon, ... }),
};
```

**Dùng trong component:**
```typescript
import { toast } from '@/utils/toast';

// Trong async handler
try {
  await store.addItem(payload);
  toast.success('Thêm thành công!');
} catch (error) {
  toast.error('Thêm thất bại, vui lòng thử lại.');
}
```

---

## Env Variables

```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

- Prefix `NEXT_PUBLIC_` để expose biến ra client-side bundle.
- Tất cả biến khác (không có prefix) chỉ có ở server-side.

---

## API Response Contract (Backend phải tuân theo)

Để các pattern trên hoạt động, backend cần trả response theo chuẩn:

```json
// Get list
{
  "success": true,
  "count": 25,
  "data": [ { "_id": "...", ... } ],
  "pagination": { "page": 1, "limit": 10, "total": 25 }
}

// Get single / Create / Update
{
  "success": true,
  "data": { "_id": "...", ... }
}

// Error
{
  "success": false,
  "message": "Human-readable error message",
  "error": "TechnicalErrorCode" // optional
}
```

HTTP status codes:
- `200` GET/PUT thành công
- `201` POST (create) thành công
- `400` Validation error
- `401` Unauthenticated
- `403` Unauthorized (thiếu permission)
- `404` Not found
- `500` Server error

---

## Theming & Màu sắc — Quy tắc bắt buộc

### Vấn đề cốt lõi

Dự án dùng **Tailwind CSS v4** với hai lớp token màu:

| Loại token | Ví dụ | Hành vi theo theme |
|---|---|---|
| **Palette tĩnh** | `secondary-900`, `secondary-800`, `secondary-700` | ❌ **Không thay đổi** khi chuyển light/dark |
| **Semantic surface** | `surface-base`, `surface-raised`, `surface-overlay`, `surface-border` | ✅ **Tự thích nghi** theo class `dark` trên `<html>` |
| **Semantic text** | `text-primary`, `text-secondary`, `text-muted` | ✅ **Tự thích nghi** |
| **`text-text-inverse`** | | ⚠️ **Cẩn thận** — flip ngược hoàn toàn (trắng → đen và ngược lại) |

### Quy tắc

> **LUÔN dùng semantic tokens cho background và text của layout/component chính.**  
> **KHÔNG dùng palette tĩnh (`secondary-*`, `slate-*`, ...) cho nền và chữ ở layout shell.**

1. **Background của layout shell** (Sidebar, Header, Card, Modal...):  
   → Dùng `bg-surface-base`, `bg-surface-raised`, `bg-surface-overlay`  
   → ❌ Không dùng `bg-secondary-900` hay màu cứng khác

2. **Border của layout shell**:  
   → Dùng `border-surface-border`  
   → ❌ Không dùng `border-secondary-800`

3. **Text trong layout shell**:  
   → Dùng `text-text-primary`, `text-text-secondary`, `text-text-muted`  
   → ❌ Không dùng `text-text-inverse` cho text thông thường trên nền surface

4. **`text-text-inverse` chỉ dùng khi**:  
   → Text đặt trên nền **màu accent cố định** (ví dụ: button `bg-primary-500`, badge, tag)  
   → Không dùng trên nền `surface-*` vì sẽ bị đọc sai khi đổi theme

5. **Hover states**:  
   → Dùng `hover:bg-surface-overlay` thay vì `hover:bg-secondary-800`

6. **Skeleton / loading placeholder**:  
   → Dùng `bg-surface-overlay animate-pulse` thay vì `bg-secondary-700`

### Ví dụ đúng

```tsx
// ✅ Sidebar — thích nghi light/dark
<aside className="bg-surface-base border-r border-surface-border">
  <Link className="text-text-secondary hover:text-text-primary hover:bg-surface-overlay">
    {label}
  </Link>
</aside>

// ✅ Button accent — text-inverse đúng chỗ
<button className="bg-primary-500 text-text-inverse">
  Lưu
</button>
```

```tsx
// ❌ SAI — dùng palette tĩnh cho layout shell
<aside className="bg-secondary-900 border-r border-secondary-800">
  <Link className="text-text-inverse hover:bg-secondary-800">
    {label}
  </Link>
</aside>
```

> **⚠️ Lưu ý:**  
> Bảng màu cụ thể (giá trị hex của `--color-primary-*`, `--color-surface-*`, v.v.) có thể thay đổi  
> theo thiết kế. Quy tắc trên chỉ áp dụng cho **cách chọn loại token**, không phụ thuộc vào giá trị màu cụ thể.

---

## Common UI Components — Quy tắc sử dụng

### 1. Stats Grid (`StatsGrid`)
Component `src/components/ui/StatsGrid.tsx` được thiết kế để chuẩn hóa các chỉ số KPI hiển thị ở đầu mỗi trang quản lý (Members, Trainers, Staff, Plans, v.v.).
*   **Quy tắc:**
    *   **Không** tự viết layout thẻ HTML/CSS hoặc hardcode các block thống kê trên trang mới.
    *   **Phải** sử dụng component `<StatsGrid />` truyền kèm prop `isLoading` và mảng `items`.
    *   Component hỗ trợ layout tự động thích ứng từ 3, 4, 5 đến 6 cột. Nếu muốn tuỳ biến số cột trên mobile/desktop, truyền thêm prop `className` ghi đè (ví dụ: `className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4"`).

### 2. Add Button (`AddButton`)
Component `src/components/ui/AddButton.tsx` được thiết kế làm nút CTA chính (Primary Action) để tạo mới, thêm hoặc ghi nhận dữ liệu trên trang.
*   **Quy tắc:**
    *   **Không** hardcode các nút bấm với màu sắc gradient, icon `Plus` và micro-interaction riêng lẻ ở mỗi trang.
    *   **Phải** sử dụng component `<AddButton label="..." onClick={...} />` để giữ giao diện đồng nhất (obsidian-themed gradient, hover states, shadow, active:scale-95, và border-t accent).

### 3. Page Header (`PageHeader`)
Component `src/components/ui/PageHeader.tsx` được sử dụng làm tiêu đề chuẩn cho mọi trang.
*   **Quy tắc:**
    *   **Không** tự viết thẻ `h1` và `p` cho phần tiêu đề trang.
    *   **Phải** sử dụng `<PageHeader title="..." subtitle="..." />` để đảm bảo padding, margin, font chữ, và styling text thống nhất.

### 4. Modal (`Modal`, `ModalFooter`)
`src/components/ui/Modal.tsx` — lớp phủ + khung + header (tiêu đề, nút đóng). Body và form do trang tự viết.

```tsx
if (!open) return null;
return (
  <Modal onClose={onClose} title={tx('modal.createTitle')} size="lg" scrollable>
    <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 flex flex-col gap-5">
      {/* fields */}
      <ModalFooter onCancel={onClose} cancelLabel={tCommon('actions.cancel')}
        submitLabel={tx('modal.submit')} loading={isLoading} sticky />
    </form>
  </Modal>
);
```

*   `size`: `sm` (xác nhận), `md` (form ngắn, mặc định), `lg` (form dài). Không thêm độ rộng khác.
*   `scrollable`: form dài — panel giới hạn 90vh, form con phải có `overflow-y-auto flex-1`; dùng kèm `ModalFooter sticky`.
*   `ModalFooter` không có `onSubmit` → nút xác nhận là `type="submit"` của form bao ngoài. Có `onSubmit` → gọi hàm (modal không có form). `variant="danger"` cho hành động xóa/hủy.
*   **Không** tự viết `fixed inset-0 ...` hay cặp nút Hủy/Lưu.

### 5. Form field (`FormField`, `Input`, `Select`, `Textarea`, `inputClass`)
`src/components/ui/FormField.tsx` — label + dấu `*` + thông báo lỗi; class ô nhập dùng chung.

```tsx
<FormField label={tx('modal.name')} required error={errors.name}>
  <Input value={form.name} onChange={...} invalid={!!errors.name} />
</FormField>
```

*   Ô nhập native (`<input>`, `<select>`) dùng `className={inputClass(!!errors.x)}`; textarea thêm `resize-none` (hoặc dùng `<Textarea>`).
*   **Không** tự định nghĩa chuỗi class ô nhập riêng ở từng trang.
*   Không viết `*` vào text label trong file dịch — dùng prop `required`.

### 6. Button & Spinner
*   `Button` (`src/components/ui/Button.tsx`): `variant` = `primary` | `secondary` | `danger`, `loading` hiện spinner và disable nút. Mặc định `type="button"`.
*   `Spinner`: icon `Loader2` xoay, dùng trong nút/khu vực nhỏ. Loading cả trang vẫn dùng `LoadingSpinner`.
*   **Không** chép SVG spinner inline.

### 7. Alert
`src/components/ui/Alert.tsx` — banner lỗi đỏ: `<Alert onDismiss={clearError}>{error}</Alert>`, hoặc `action={<button>Thử lại</button>}`.

### 8. Badge & màu trạng thái (`Badge`, `src/lib/statusTones.ts`)
```tsx
<Badge tone={BOOKING_STATUS_TONE[booking.status]} dot>{label}</Badge>
```
*   `tone`: `success` | `warning` | `danger` | `primary` | `info` | `violet` | `neutral`. `dot` thêm chấm màu phía trước.
*   Màu của từng trạng thái (booking, hội viên, lớp, thiết bị, role) **chỉ** được định nghĩa trong `lib/statusTones.ts` — dùng chung cho cả trang quản trị và portal. Không tạo map `STATUS_STYLES` riêng trong trang.
*   Phần tử cần là `<button>` mà vẫn trông như badge: dùng `badgeClass(tone)`.

### 9. StatusSelect
`src/components/ui/StatusSelect.tsx` — badge bấm vào mở menu đổi trạng thái (sửa nhanh trong bảng):
`<StatusSelect value={item.status} tone={EQUIPMENT_STATUS_TONE[item.status]} options={[{ value, label }]} onChange={...} disabled={isActing} />`

### 10. SegmentedControl
`src/components/ui/SegmentedControl.tsx` — nhóm nút chọn một (bộ lọc, tab):
```tsx
<SegmentedControl<MemberStatus | 'all'> value={filterStatus} onChange={setFilterStatus} options={[
  { value: 'all', label: tCommon('filters.all') },
  { value: 'active', label: tCommon('status.active') },
]} />
```
*   `size="md"` cho tab, `accent="violet"` cho bộ lọc phụ, `highlight` trên option để đánh dấu (vd. hôm nay).
*   Truyền generic khi `options` có cả `'all'` để không phải `as any`.

### 11. EmptyState & Skeleton
*   `<EmptyState icon={<Users size={40} />} title={...} description={...} />` — `icon` có thể là emoji string. Trong bảng: `<tr><td colSpan={n}><EmptyState ... /></td></tr>`.
*   `Skeleton` (khối đơn, kích thước qua `className`), `SkeletonList count={n} className="grid ..." itemClassName="h-28 rounded-xl"`, `TableSkeleton rows={5} cols={6}` trong `<tbody>`.
*   Skeleton có hình dạng riêng (thẻ nhân viên, thẻ gói tập...) vẫn viết tại trang, nhưng dùng `bg-surface-overlay animate-pulse`.

### 12. ConfirmDialog
`<ConfirmDialog title message confirmLabel cancelLabel onConfirm onClose loading />` — xác nhận hành động xóa/không thể hoàn tác (mặc định `variant="danger"`). Render có điều kiện.

### Xử lý lỗi API (`src/lib/errors.ts`)
*   Trong component: `catch (e) { toast.error(getApiMessage(e) || tx('toast.error')); }` — không dùng `catch (e: any)` hay `e?.response?.data?.message`.
*   Trong store: `extractErrorMessage(error)` (các `*Helpers.ts` re-export từ `lib/errors.ts`, không định nghĩa lại).

---

## Checklist khi thêm domain mới

- [ ] Tạo `src/types/[entity].types.ts` (API types + Frontend model)
- [ ] Tạo `src/lib/[entity]Service.ts` (CRUD functions)
- [ ] Tạo `src/lib/[entity]Helpers.ts` (transform + error message)
- [ ] Tạo `src/stores/[entity]Store.ts` (Zustand store)
- [ ] Tạo `src/app/(protected)/[entity]/page.tsx`
- [ ] Thêm route prefix vào `protectedPrefixes` trong `middleware.ts` *(nếu chưa dùng whitelist approach)*
- [ ] Thêm nav item vào `Sidebar.tsx` với icon từ **lucide-react**

---

## Icons — lucide-react

Dự án sử dụng **[lucide-react](https://lucide.dev/)** làm thư viện icon duy nhất.  
**Không dùng inline SVG** cho icon — thay vào đó luôn import từ `lucide-react`.

### Cài đặt

```bash
npm install lucide-react
```

### Cách dùng cơ bản

```tsx
import { User, Settings, ChevronDown } from 'lucide-react';

// Size dùng prop `size` (number, pixel) — không dùng className w-x h-x
<User size={20} />
<Settings size={16} className="text-text-muted" />

// Kết hợp với className để đổi màu / animation
<ChevronDown
  size={16}
  className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
/>
```

### Quy tắc sử dụng

| Vị trí | Size | Ghi chú |
|---|---|---|
| Sidebar nav icon | `size={18}` | Cân đối với text-sm |
| Button icon (inline) | `size={16}` | Đặt cùng hàng với text |
| Header icon | `size={20}` | Brand logo, theme toggle |
| Modal / card icon lớn | `size={24}` | Decorative icon |
| Badge / mini icon | `size={14}` | Trong tag, badge nhỏ |

> **Không** hardcode `className="w-5 h-5"` để set size — dùng prop `size` thay vì vậy.  
> `className` chỉ dùng cho màu sắc (`text-*`) và animation (`transition-*`, `rotate-*`).

### Map icon cho từng domain trong Sidebar

```tsx
import {
    LayoutDashboard,  // Dashboard
    Users,            // Hội viên (members)
    CalendarDays,     // Lịch đặt PT (classes/bookings)
    ClipboardList,    // Gói tập (plans)
    Briefcase,        // Nhân viên (staff)
    UserCheck,        // Huấn luyện viên (trainers)
    Wrench,           // Thiết bị (equipment)
    Dumbbell,         // Brand logo GymMS
} from 'lucide-react';
```

### Thêm nav item mới

Khi thêm domain mới vào `Sidebar.tsx`, chỉ cần thêm 1 dòng vào `NAV_ITEMS`:

```tsx
// src/components/layout/Sidebar.tsx
import { Package } from 'lucide-react'; // chọn icon phù hợp từ lucide.dev

const NAV_ITEMS = [
    // ... các item hiện có
    { label: 'Tên module', href: '/route', Icon: Package },
] as const;
```

### Tìm icon phù hợp

Tra cứu tại **https://lucide.dev/icons/** — tìm kiếm theo keyword tiếng Anh.  
Một số icon thường dùng trong gym management:

| Mục đích | Icon name |
|---|---|
| User / member | `User`, `Users`, `UserCheck`, `UserPlus` |
| Calendar / booking | `Calendar`, `CalendarDays`, `CalendarCheck` |
| Document / plan | `ClipboardList`, `FileText`, `ScrollText` |
| Money / payment | `CreditCard`, `Wallet`, `Banknote` |
| Settings | `Settings`, `SlidersHorizontal`, `Wrench` |
| Status / check | `CheckCircle`, `XCircle`, `AlertCircle`, `Clock` |
| Navigation | `ChevronLeft`, `ChevronDown`, `ArrowLeft` |
| Actions | `Plus`, `Pencil`, `Trash2`, `LogOut`, `Search` |
| Theme | `Sun`, `Moon` |
| Gym-specific | `Dumbbell`, `Activity`, `Zap` |

---

## Những điểm cần cải thiện cho dự án sau

| Vấn đề | Giải pháp đề xuất |
|---|---|
| Token storage trùng lặp (cookie + zustand localStorage) | Chỉ lưu token vào cookie; persist chỉ user profile vào localStorage |
| `window.location.href` trong Axios interceptor | Dùng event emitter / pub-sub để decouple redirect logic |
| `protectedPrefixes` phải update thủ công | Đảo logic: whitelist `publicRoutes`, còn lại mặc định protected |
| Stats re-fetch sau mỗi mutation | Chỉ fetch stats khi cần (lazy), hoặc dùng optimistic update |
| Không có loading skeleton | Thêm Suspense boundary + skeleton components |
| Không có error boundary | Thêm React Error Boundary để catch runtime errors |
| `any` type ở nhiều chỗ (user data, API response) | Tạo generic `ApiResponse<T>` type, type rõ mọi chỗ |
| Dùng palette tĩnh (`secondary-*`) cho layout shell | Dùng semantic tokens (`surface-*`, `text-text-*`) — xem mục "Theming & Màu sắc" |
| Next.js 16 báo `middleware.ts` đã deprecated | Đổi tên sang `proxy.ts` theo convention mới của Next.js 16 |

---

## Internationalization (i18n) — Hệ thống đa ngôn ngữ

> Mục này mô tả toàn bộ thiết kế, cấu trúc file, và quy tắc bắt buộc cho hệ thống i18n của dự án.  
> **Đọc kỹ trước khi thêm trang mới hoặc sửa text UI.**

---

### Tổng quan kiến trúc

Dự án dùng hệ thống i18n tự xây (không dùng `next-intl` hay `react-i18next`) vì tính đơn giản và kiểm soát tốt hơn. Gồm 3 tầng:

```
src/messages/             ← Dữ liệu dịch (JSON per locale per namespace)
src/i18n/index.ts         ← Engine tra cứu (dot-notation, sync cache)
src/components/providers/
  └── LanguageProvider.tsx ← Global context + pre-register tất cả namespaces
src/hooks/
  └── usePageTitle.ts      ← Hook set document.title động theo locale
```

---

### Cấu trúc file dịch

```
src/messages/
├── vi/                    ← Tiếng Việt (default locale)
│   ├── common.json        ← Strings dùng chung (nút, trạng thái, phân trang)
│   ├── layout.json        ← Nav sidebar + header labels
│   ├── dashboard.json
│   ├── members.json
│   ├── checkins.json
│   ├── bookings.json
│   ├── plans.json
│   ├── trainers.json
│   ├── staff.json
│   ├── equipment.json
│   ├── group-classes.json
│   ├── gym-info.json
│   └── portal.json        ← Trang portal hội viên
└── en/                    ← Tiếng Anh (cùng cấu trúc key với vi/)
    ├── common.json
    └── ...
```

**Quy tắc file dịch:**
- Mỗi trang protected có **1 namespace riêng** tương ứng với tên route.
- Hai file `vi/` và `en/` **phải có key giống nhau 100%** — không thêm/bỏ key ở một phía.
- Khi thêm key mới vào `vi/`, phải thêm vào `en/` ngay lập tức (và ngược lại).

---

### Engine dịch (`src/i18n/index.ts`)

#### Cách hoạt động

1. **Sync cache**: Tất cả file JSON được pre-import vào `LanguageProvider.tsx` và đăng ký vào `syncMessages` cache qua `registerMessages()`.  
   → Đảm bảo render đầu tiên không bị flash/missing text.

2. **Dot-notation lookup**: Key dùng dấu chấm để traverse object lồng nhau.

```typescript
// Ví dụ key lookup
t('staff')('modal.createTitle')
// Tìm trong: syncMessages['vi']['staff']['modal']['createTitle']
// Trả về: "Thêm nhân viên mới"
```

3. **Fallback**: Nếu key không tìm thấy → trả về key string gốc (không crash). Nếu có tham số `fallback` thứ 2 → dùng fallback đó.

```typescript
createTranslator(locale, namespace)(key, fallback?)
// Nếu key không có trong messages → trả về fallback (nếu có) hoặc key
```

---

### LanguageProvider

```typescript
// src/components/providers/LanguageProvider.tsx

// 1. Pre-import tất cả JSON
import viCommon from '@/src/messages/vi/common.json';
import enCommon from '@/src/messages/en/common.json';
// ... tất cả namespaces

// 2. Đăng ký vào sync cache
registerMessages('vi', 'common',   viCommon);
registerMessages('en', 'common',   enCommon);
// ...

// 3. Context value
interface LanguageContextValue {
  lang: 'vi' | 'en';          // Locale hiện tại
  setLang: (l: Locale) => void; // Đổi locale (lưu localStorage + cập nhật <html lang>)
  t: (namespace: string) => (key: string, fallback?: string) => string;
}
```

**Lưu ý quan trọng:** Mỗi khi thêm namespace mới (tức thêm file JSON mới), **bắt buộc phải**:
1. Import cả `vi/` và `en/` vào `LanguageProvider.tsx`
2. Gọi `registerMessages()` cho cả hai locale

---

### Cách dùng trong component

#### Pattern chuẩn

```typescript
'use client';

import { useLanguage } from '@/src/components/providers/LanguageProvider';
import { usePageTitle } from '@/src/hooks/usePageTitle';

export default function SomePage() {
  const { t, lang } = useLanguage();

  // Tạo scoped translator cho namespace của trang
  const ts = t('staff');          // Namespace chính của trang
  const tCommon = t('common');    // Namespace chung

  // Set tab title động
  usePageTitle('staff');          // Tìm key 'title' trong namespace 'staff'

  return (
    <div>
      <h1>{ts('title')}</h1>                        {/* staff.title */}
      <p>{ts('subtitle')}</p>                       {/* staff.subtitle */}
      <button>{tCommon('actions.cancel')}</button>  {/* common.actions.cancel */}

      {/* Interpolation thủ công — không có template engine */}
      <span>{ts('filters.count').replace('{{count}}', String(total))}</span>

      {/* Format ngày theo locale */}
      <span>{new Date(date).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US')}</span>
    </div>
  );
}
```

#### Pattern trong sub-components (modal, card, v.v.)

```typescript
// Sub-component trong cùng file page.tsx
function StaffCard({ member }: { member: StaffMember }) {
  const { t, lang } = useLanguage();
  const ts = t('staff');  // Cùng namespace với page

  return (
    <div>
      <span>{ts('card.active')}</span>
      <span>{new Date(member.createdAt).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US')}</span>
    </div>
  );
}
```

> **Lưu ý:** Sub-components có thể gọi `useLanguage()` trực tiếp — không cần truyền translator qua props.

---

### Namespace `common` — Tái sử dụng

File `common.json` chứa strings **xuất hiện ở nhiều trang**. Luôn kiểm tra ở đây trước khi tạo key mới:

```json
// vi/common.json — cấu trúc
{
  "actions": {
    "save": "Lưu", "cancel": "Hủy", "delete": "Xóa",
    "edit": "Chỉnh sửa", "add": "Thêm", "search": "Tìm kiếm",
    "filter": "Lọc", "refresh": "Làm mới", "close": "Đóng",
    "confirm": "Xác nhận", "back": "Quay lại", "loading": "Đang tải..."
  },
  "status": {
    "active": "Hoạt động", "inactive": "Ngừng hoạt động",
    "suspended": "Tạm dừng", "expired": "Hết hạn",
    "pending": "Chờ xác nhận", "confirmed": "Đã xác nhận",
    "completed": "Hoàn thành", "cancelled": "Đã hủy"
  },
  "pagination": { "page": "Trang", "of": "/", "previous": "← Trước", "next": "Sau →" },
  "empty": { "noData": "Không có dữ liệu", "noResults": "Không tìm thấy kết quả" },
  "error": { "generic": "Có lỗi xảy ra", "loadFailed": "Không thể tải dữ liệu" },
  "language": { "label": "Ngôn ngữ", "vi": "Tiếng Việt", "en": "English" },
  "filters": { "all": "Tất cả" }
}
```

---

### `usePageTitle` hook

```typescript
// src/hooks/usePageTitle.ts
usePageTitle(namespace: string, titleKey = 'title')
// → document.title = `${t(namespace)(titleKey)} | GymMS`
```

**Quy tắc:**
- Gọi ở đầu **mọi page component** trong `(protected)/` và `(portal)/`.
- Trang portal dùng chung namespace `portal`, truyền key tiêu đề riêng: `usePageTitle('portal', 'bookings.title')`.
- Mỗi namespace JSON **phải có key `"title"`** ở root level.
- Hook tự re-run mỗi render → title tự động cập nhật khi đổi ngôn ngữ.

```typescript
// Ví dụ trong group-classes/page.tsx
usePageTitle('group-classes');
// vi: "Lớp học nhóm | GymMS"
// en: "Group Classes | GymMS"
```

---

### Cấu trúc JSON chuẩn cho namespace trang

Mỗi namespace page JSON nên có các section sau (theo thứ tự):

```json
{
  "title": "...",          // Bắt buộc — dùng cho usePageTitle + PageHeader
  "subtitle": "...",       // Bắt buộc — dùng cho PageHeader subtitle
  "addButton": "...",      // Label nút thêm mới (AddButton)

  "stats": {               // Labels cho StatsGrid
    "total": "...",
    "active": "...",
    "...": "..."
  },

  "table": {               // Headers cột bảng (nếu dùng table layout)
    "name": "...",
    "status": "...",
    "actions": "..."
  },

  "filters": {             // Placeholder search + count label
    "searchPlaceholder": "...",
    "count": "{{count}} items"   // Dùng .replace('{{count}}', ...) trong code
  },

  "empty": {               // State rỗng
    "title": "...",
    "description": "..."
  },

  "modal": {               // Tất cả text trong modal create/edit
    "createTitle": "...",
    "editTitle": "...",
    "fieldName": "...",
    "...": "..."
  },

  "validation": {          // Thông báo validate form
    "fieldRequired": "..."
  },

  "toast": {               // Thông báo sau action
    "addSuccess": "...",
    "editSuccess": "...",
    "deleteSuccess": "...",
    "error": "..."
  }
}
```

---

### Interpolation — Chuỗi có biến

Hệ thống i18n **không có template engine** (không dùng `{count}` tự động). Dùng `.replace()` thủ công:

```typescript
// Trong JSON
"filters": { "count": "{{count}} nhân viên" }

// Trong component
ts('filters.count').replace('{{count}}', String(filtered.length))
// → "42 nhân viên"
```

Quy ước placeholder: `{{variableName}}` (double curly braces).

---

### Danh sách namespace đã đăng ký

| Namespace | File JSON | Route |
|---|---|---|
| `common` | `common.json` | Dùng chung mọi nơi |
| `layout` | `layout.json` | Sidebar nav + Header |
| `dashboard` | `dashboard.json` | `/dashboard` |
| `members` | `members.json` | `/members` |
| `checkins` | `checkins.json` | `/checkins` |
| `bookings` | `bookings.json` | `/bookings` |
| `plans` | `plans.json` | `/plans` |
| `trainers` | `trainers.json` | `/trainers` |
| `staff` | `staff.json` | `/staff` |
| `equipment` | `equipment.json` | `/equipment` |
| `group-classes` | `group-classes.json` | `/group-classes` |
| `gym-info` | `gym-info.json` | `/gym-info` |
| `portal` | `portal.json` | `/portal/*` |

---

### Checklist khi thêm trang mới (có i18n)

- [ ] Tạo `src/messages/vi/[namespace].json` với đầy đủ keys theo cấu trúc chuẩn
- [ ] Tạo `src/messages/en/[namespace].json` với **cùng key structure**
- [ ] Import cả hai vào `LanguageProvider.tsx`:
  ```typescript
  import viXxx from '@/src/messages/vi/xxx.json';
  import enXxx from '@/src/messages/en/xxx.json';
  registerMessages('vi', 'xxx', viXxx);
  registerMessages('en', 'xxx', enXxx);
  ```
- [ ] Trong `page.tsx`:
  - Import `useLanguage` và `usePageTitle`
  - Khai báo `const tx = t('namespace');` và `const tCommon = t('common');`
  - Gọi `usePageTitle('namespace')` ở đầu component
  - Replace tất cả hardcoded strings bằng `tx('key')` hoặc `tCommon('key')`
- [ ] Kiểm tra: đổi ngôn ngữ qua Header → tất cả text cập nhật ngay, kể cả tab title

---

### Những lỗi hay gặp và cách tránh

| Lỗi | Nguyên nhân | Cách tránh |
|---|---|---|
| Text không đổi khi chuyển ngôn ngữ | Quên thêm namespace vào `LanguageProvider.tsx` | Luôn làm đủ 3 bước: tạo JSON → import → registerMessages |
| `ts('key')` trả về `'key'` (không dịch được) | Key không tồn tại hoặc typo | Kiểm tra kỹ path dot-notation, console.warn sẽ báo |
| TypeScript lỗi `Argument of type '{}' is not assignable` | Truyền object vào `fallback` parameter (chỉ nhận `string`) | Dùng `.replace()` thủ công, fallback phải là string |
| `document.title` không cập nhật | Quên gọi `usePageTitle()` | Thêm vào mọi page component |
| `toLocaleDateString` không đổi theo locale | Hardcode `'vi-VN'` thay vì dynamic | Dùng `lang === 'vi' ? 'vi-VN' : 'en-US'` |
| Sub-component không nhận `lang` | Không gọi `useLanguage()` trong sub-component | Gọi `const { t, lang } = useLanguage()` trong mọi component cần dịch |
| **Page bị refresh/fetch dữ liệu liên tục (infinite loop)** | Translator (`td`, `ts`...) bị đưa vào deps của `useCallback`/`useEffect` | **Không** đưa translator vào deps — xem mục dưới |

---

### ⚠️ Pitfall: Translator trong `useCallback` / `useEffect` deps gây infinite loop

Đây là bug **tinh vi nhất** khi dùng hệ thống i18n này, đã xảy ra thực tế ở `dashboard/page.tsx`.

#### Giải thích cơ chế vòng lặp

```typescript
// ❌ CODE GÂY VÒNG LẶP VÔ HẠN
const { t } = useLanguage();
const td = t('dashboard');         // (1) td = function mới mỗi khi t thay đổi

const load = useCallback(async () => {
  setIsLoading(true);              // (4) → re-render → quay lại (1)
  const data = await fetchData();
  setSnapshot(data);
}, [td]);                          // (2) td mới → load mới

useEffect(() => {
  load();                          // (3) load mới → gọi API lại
}, [load]);
```

**Luồng lặp:**
1. Component render → `td` = function mới (dù lang không đổi)
2. `td` mới → `useCallback` tạo `load` mới
3. `load` mới → `useEffect` trigger → gọi `load()`
4. `setIsLoading(true)` → re-render → quay lại bước 1

#### Fix đúng

```typescript
// ✅ ĐÚNG — không đưa translator vào deps fetch
const load = useCallback(async () => {
  setIsLoading(true);
  try {
    const data = await fetchData();
    setSnapshot(data);
  } catch (err: any) {
    // Dùng fallback string thay vì td() trong catch của load
    setError(err?.response?.data?.message || 'Không thể tải dữ liệu');
  } finally {
    setIsLoading(false);
  }
// eslint-disable-next-line react-hooks/exhaustive-deps
}, []); // ← deps rỗng hoặc chỉ có store actions (stable)

useEffect(() => { load(); }, [load]);
```

> **Lý do `td` không cần trong deps:**  
> `td = t('dashboard')` là hàm **derived** từ `t` đã được `useMemo` trong `LanguageProvider`.  
> Giá trị string mà `td('key')` trả về không thay đổi trừ khi user đổi ngôn ngữ.  
> Việc fetch lại data khi đổi ngôn ngữ là **không cần thiết** — data không phụ thuộc vào locale.

#### Quy tắc bắt buộc

> **KHÔNG BAO GIỜ** đưa translator functions (`td`, `ts`, `tc`, `tm`, `tCommon`...) vào dependency array của `useCallback` hoặc `useEffect` có side effect (fetch, mutation).

```typescript
// ❌ SAI — gây infinite loop
const handleSave = useCallback(async () => { ... toast.success(ts('toast.success')); }, [ts]);
const load       = useCallback(async () => { ... setError(td('loadError')); },          [td]);

// ✅ ĐÚNG — translator không cần trong deps
const handleSave = useCallback(async () => { ... toast.success(ts('toast.success')); }, [store.save]);
const load       = useCallback(async () => { ... setError('Lỗi tải dữ liệu'); },       []);
//                                                         ^^ fallback hardcode hoặc bỏ qua
```

#### Với `usePageTitle` — phải có dependency array

```typescript
// ❌ SAI — chạy sau MỌI render (bao gồm mọi state change)
useEffect(() => { document.title = `${title} | GymMS`; });

// ✅ ĐÚNG — chỉ chạy khi lang hoặc namespace thay đổi
useEffect(() => { document.title = `${title} | GymMS`; }, [t, namespace, titleKey]);
```

---


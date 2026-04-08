// ─── Enums / Union Types ──────────────────────────────────────────────────────
export type RoleName = 'admin' | 'user' | 'manager' | 'member' | 'trainer';

// ─── Frontend Model (sau khi transform) ───────────────────────────────────────
export interface StaffMember {
  id: string;           // Đã transform từ _id
  name: string;
  email: string;
  role: {
    id: string;
    name: RoleName;
    permissions: Array<{ resource: string; action: string; description: string }>;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Computed fields
  roleLabel: string;    // VD: "Quản lý", "Huấn luyện viên"
  initials: string;     // VD: "NA" từ "Nguyen Van A"
}

// ─── API Raw Response (User model từ MongoDB) ─────────────────────────────────
export interface StaffApiData {
  _id: string;
  id: string;           // Virtual từ mongoose toJSON
  name: string;
  email: string;
  role: {
    _id: string;
    name: RoleName;
    permissions: Array<{ resource: string; action: string; description: string }>;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── API Response Wrappers ────────────────────────────────────────────────────
export interface StaffListApiResponse {
  success: boolean;
  count: number;
  total: number;
  currentPage: number;
  totalPages: number;
  data: StaffApiData[];
}

export interface StaffApiResponse {
  success: boolean;
  data: StaffApiData;
}

// ─── Request Payloads ─────────────────────────────────────────────────────────
export interface CreateStaffPayload {
  name: string;
  email: string;
  password: string;
  roleName: RoleName;
}

export interface UpdateStaffPayload {
  name?: string;
  email?: string;
}

export interface AssignRolePayload {
  roleName: RoleName;
}

// ─── Query Params ─────────────────────────────────────────────────────────────
export interface StaffQueryParams {
  page?: number;
  limit?: number;
  role?: RoleName;
  isActive?: boolean;
}

// ─── Pagination Info ─────────────────────────────────────────────────────────
export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  total: number;
  count: number;
}

// ─── Zustand Store State ──────────────────────────────────────────────────────
export interface StaffState {
  staff: StaffMember[];
  pagination: PaginationInfo | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchStaff: (params?: StaffQueryParams) => Promise<void>;
  createStaff: (payload: CreateStaffPayload) => Promise<StaffMember>;
  updateStaff: (id: string, payload: UpdateStaffPayload) => Promise<StaffMember>;
  assignRole: (id: string, payload: AssignRolePayload) => Promise<StaffMember>;
  deactivateStaff: (id: string) => Promise<void>;
  activateStaff: (id: string) => Promise<void>;
  clearError: () => void;
}

// ─── Enums / Union Types ──────────────────────────────────────────────────────
export type PlanType = 'basic' | 'premium' | 'vip';

// ─── Frontend Model (sau khi transform) ───────────────────────────────────────
export interface SubscriptionPlan {
  id: string;           // Đã transform từ _id
  name: string;
  type: PlanType;
  durationDays: number;
  price: number;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Computed fields (tính sẵn trong transform)
  durationLabel: string;  // VD: "3 tháng", "1 năm", "30 ngày"
  priceLabel: string;     // VD: "1.500.000 ₫"
  typeLabel: string;      // VD: "Cơ bản", "Premium", "VIP"
}

// ─── API Raw Response (từ MongoDB) ────────────────────────────────────────────
export interface SubscriptionPlanApiData {
  _id: string;
  id: string;           // Virtual từ mongoose toJSON
  name: string;
  type: PlanType;
  durationDays: number;
  price: number;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── API Response Wrappers ────────────────────────────────────────────────────
export interface PlanListApiResponse {
  success: boolean;
  count: number;
  data: SubscriptionPlanApiData[];
}

export interface PlanApiResponse {
  success: boolean;
  data: SubscriptionPlanApiData;
}

// ─── Request Payloads ─────────────────────────────────────────────────────────
export interface CreatePlanPayload {
  name: string;
  type: PlanType;
  durationDays: number;
  price: number;
  description?: string;
}

export type UpdatePlanPayload = Partial<CreatePlanPayload>;

// ─── Query Params ─────────────────────────────────────────────────────────────
export interface PlanQueryParams {
  type?: PlanType;
  all?: boolean; // true → bao gồm cả inactive (admin only)
}

// ─── Zustand Store State ──────────────────────────────────────────────────────
export interface PlanState {
  plans: SubscriptionPlan[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchPlans: (params?: PlanQueryParams) => Promise<void>;
  createPlan: (payload: CreatePlanPayload) => Promise<SubscriptionPlan>;
  updatePlan: (id: string, payload: UpdatePlanPayload) => Promise<SubscriptionPlan>;
  togglePlan: (id: string) => Promise<void>;
  clearError: () => void;
}

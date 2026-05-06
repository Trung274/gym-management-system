// ─── Enums ────────────────────────────────────────────────────────────────────
export type EquipmentStatus = 'operational' | 'maintenance' | 'out_of_order';
export type EquipmentCategory = 'cardio' | 'strength' | 'flexibility' | 'free_weights' | 'other';

// ─── Frontend Model ───────────────────────────────────────────────────────────
export interface Equipment {
  id: string;
  name: string;
  category: EquipmentCategory;
  brand?: string;
  model?: string;
  serialNumber?: string;
  quantity: number;
  location?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  supplier?: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  notes?: string;
  status: EquipmentStatus;
  createdAt: string;
  updatedAt: string;
  // Computed
  statusLabel: string;
  categoryLabel: string;
  purchaseDateLabel: string;
  lastMaintenanceDateLabel: string;
  nextMaintenanceDateLabel: string;
  purchasePriceLabel: string;
  isMaintenanceDue: boolean;       // nextMaintenanceDate < 7 ngày nữa
}

// ─── API Raw Response ─────────────────────────────────────────────────────────
export interface EquipmentApiData {
  _id: string;
  id?: string;
  name: string;
  category: EquipmentCategory;
  brand?: string;
  model?: string;
  serialNumber?: string;
  quantity: number;
  location?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  supplier?: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  notes?: string;
  status: EquipmentStatus;
  createdAt: string;
  updatedAt: string;
}

// ─── API Response Wrappers ────────────────────────────────────────────────────
export interface EquipmentListApiResponse {
  success: boolean;
  count: number;
  data: EquipmentApiData[];
}

export interface EquipmentApiResponse {
  success: boolean;
  data: EquipmentApiData;
}

// ─── Request Payloads ─────────────────────────────────────────────────────────
export interface CreateEquipmentPayload {
  name: string;
  category: EquipmentCategory;
  brand?: string;
  model?: string;
  serialNumber?: string;
  quantity?: number;
  location?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  supplier?: string;
  nextMaintenanceDate?: string;
  notes?: string;
}

export interface UpdateEquipmentPayload {
  name?: string;
  category?: EquipmentCategory;
  brand?: string;
  model?: string;
  serialNumber?: string;
  quantity?: number;
  location?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  supplier?: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  notes?: string;
}

export interface ChangeEquipmentStatusPayload {
  status: EquipmentStatus;
}

// ─── Query Params ─────────────────────────────────────────────────────────────
export interface EquipmentQueryParams {
  category?: EquipmentCategory;
  status?: EquipmentStatus;
}

// ─── Store State ──────────────────────────────────────────────────────────────
export interface EquipmentState {
  equipment: Equipment[];
  isLoading: boolean;
  error: string | null;

  fetchEquipment: (params?: EquipmentQueryParams) => Promise<void>;
  createEquipment: (payload: CreateEquipmentPayload) => Promise<Equipment>;
  updateEquipment: (id: string, payload: UpdateEquipmentPayload) => Promise<Equipment>;
  changeStatus: (id: string, payload: ChangeEquipmentStatusPayload) => Promise<void>;
  deleteEquipment: (id: string) => Promise<void>;
  clearError: () => void;
}

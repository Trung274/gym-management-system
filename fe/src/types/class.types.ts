// ─── Enums ────────────────────────────────────────────────────────────────────
export type ClassStatus   = 'active' | 'cancelled' | 'completed';
export type ClassCategory = 'yoga' | 'zumba' | 'cycling' | 'hiit' | 'pilates' | 'boxing' | 'other';

// ─── Schedule item ────────────────────────────────────────────────────────────
export interface ScheduleItem {
  dayOfWeek: number;   // 0 = Chủ nhật … 6 = Thứ bảy
  startTime: string;   // "HH:MM"
  endTime:   string;   // "HH:MM"
}

// ─── Populated trainer (nested) ───────────────────────────────────────────────
export interface ClassTrainerPopulated {
  _id:  string;
  user: { name: string; email: string } | null;
  specializations: string[];
  experienceYears: number;
  status: string;
}

// ─── Frontend Model ───────────────────────────────────────────────────────────
export interface GymClass {
  id:          string;
  name:        string;
  category:    ClassCategory;
  description?: string;
  trainer?:    ClassTrainerPopulated | null;
  location?:   string;
  capacity?:   number;
  schedule:    ScheduleItem[];
  startDate?:  string;
  endDate?:    string;
  status:      ClassStatus;
  notes?:      string;
  createdAt:   string;
  updatedAt:   string;
  // Computed
  statusLabel:   string;
  categoryLabel: string;
  trainerName:   string;
  scheduleLabel: string;   // "T2, T4, T6 · 06:30 – 07:30"
  startDateLabel: string;
  endDateLabel:   string;
}

// ─── API Raw Response ─────────────────────────────────────────────────────────
export interface ClassApiData {
  _id:         string;
  id?:         string;
  name:        string;
  category:    ClassCategory;
  description?: string;
  trainer?:    ClassTrainerPopulated | null;
  location?:   string;
  capacity?:   number;
  schedule:    ScheduleItem[];
  startDate?:  string;
  endDate?:    string;
  status:      ClassStatus;
  notes?:      string;
  createdAt:   string;
  updatedAt:   string;
}

// ─── API Response Wrappers ────────────────────────────────────────────────────
export interface ClassListApiResponse {
  success: boolean;
  count:   number;
  data:    ClassApiData[];
}

export interface ClassApiResponse {
  success: boolean;
  data:    ClassApiData;
}

// ─── Request Payloads ─────────────────────────────────────────────────────────
export interface CreateClassPayload {
  name:        string;
  category:    ClassCategory;
  description?: string;
  trainer?:    string;   // Trainer ObjectId
  location?:   string;
  capacity?:   number;
  schedule:    ScheduleItem[];
  startDate?:  string;
  endDate?:    string;
  notes?:      string;
}

export interface UpdateClassPayload {
  name?:        string;
  category?:    ClassCategory;
  description?: string;
  trainer?:     string;
  location?:    string;
  capacity?:    number;
  schedule?:    ScheduleItem[];
  startDate?:   string;
  endDate?:     string;
  notes?:       string;
}

export interface ChangeClassStatusPayload {
  status: ClassStatus;
}

// ─── Query Params ─────────────────────────────────────────────────────────────
export interface ClassQueryParams {
  category?:  ClassCategory;
  trainerId?: string;
  dayOfWeek?: number;
  all?:       boolean;  // true → trả về cả cancelled/completed (cần login)
}

// ─── Store State ──────────────────────────────────────────────────────────────
export interface ClassState {
  classes:   GymClass[];
  isLoading: boolean;
  error:     string | null;

  fetchClasses:   (params?: ClassQueryParams) => Promise<void>;
  createClass:    (payload: CreateClassPayload) => Promise<GymClass>;
  updateClass:    (id: string, payload: UpdateClassPayload) => Promise<GymClass>;
  changeStatus:   (id: string, payload: ChangeClassStatusPayload) => Promise<void>;
  clearError:     () => void;
}

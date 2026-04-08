// ─── Enums / Union Types ──────────────────────────────────────────────────────
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

// ─── Nested populated types (từ backend populate) ────────────────────────────
export interface BookingMemberPopulated {
  _id: string;
  user: { name: string; email: string };
  status: string;
}

export interface BookingTrainerPopulated {
  _id: string;
  user: { name: string; email: string };
  specializations: string[];
}

// ─── Frontend Model (sau khi transform) ───────────────────────────────────────
export interface Booking {
  id: string;
  memberId: string;
  memberName: string;
  memberEmail: string;
  trainerId: string;
  trainerName: string;
  trainerEmail: string;
  sessionDate: string;       // ISO date string
  startTime: string;         // HH:MM
  endTime: string;           // HH:MM
  status: BookingStatus;
  notes?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
  // Computed fields
  statusLabel: string;       // VD: "Chờ xác nhận", "Đã xác nhận"
  sessionDateLabel: string;  // VD: "08/04/2026"
  timeRangeLabel: string;    // VD: "09:00 – 10:00"
}

// ─── API Raw Response ────────────────────────────────────────────────────────
export interface BookingApiData {
  _id: string;
  id: string;
  member: BookingMemberPopulated | null;
  trainer: BookingTrainerPopulated | null;
  sessionDate: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  notes?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── API Response Wrappers ────────────────────────────────────────────────────
export interface BookingListApiResponse {
  success: boolean;
  count: number;
  data: BookingApiData[];
}

export interface BookingApiResponse {
  success: boolean;
  data: BookingApiData;
}

// ─── Request Payloads ─────────────────────────────────────────────────────────
export interface CreateBookingPayload {
  trainerId: string;
  sessionDate: string;     // YYYY-MM-DD
  startTime: string;       // HH:MM
  endTime: string;         // HH:MM
  notes?: string;
}

export interface CancelBookingPayload {
  cancellationReason?: string;
}

// ─── Query Params ─────────────────────────────────────────────────────────────
export interface BookingQueryParams {
  status?: BookingStatus;
  trainerId?: string;
  date?: string;           // YYYY-MM-DD
}

// ─── Zustand Store State ──────────────────────────────────────────────────────
export interface BookingState {
  bookings: Booking[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchBookings: (params?: BookingQueryParams) => Promise<void>;
  createBooking: (payload: CreateBookingPayload) => Promise<Booking>;
  confirmBooking: (id: string) => Promise<void>;
  cancelBooking: (id: string, payload?: CancelBookingPayload) => Promise<void>;
  completeBooking: (id: string) => Promise<void>;
  clearError: () => void;
}

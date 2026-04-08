import apiClient from './axios';
import { transformBooking } from './bookingHelpers';
import type {
  Booking,
  BookingListApiResponse,
  BookingApiResponse,
  CreateBookingPayload,
  CancelBookingPayload,
  BookingQueryParams,
} from '@/src/types/booking.types';

const BASE = '/bookings';

/**
 * GET /api/v1/bookings
 * Requires: bookings:list (Admin, Manager)
 * Filters: ?status=, ?trainerId=, ?date=YYYY-MM-DD
 */
export const getBookings = async (params?: BookingQueryParams): Promise<Booking[]> => {
  const response = await apiClient.get<BookingListApiResponse>(BASE, { params });
  return response.data.data.map(transformBooking);
};

/**
 * GET /api/v1/bookings/my
 * Requires: đã đăng nhập + có member profile
 */
export const getMyBookings = async (): Promise<Booking[]> => {
  const response = await apiClient.get<BookingListApiResponse>(`${BASE}/my`);
  return response.data.data.map(transformBooking);
};

/**
 * GET /api/v1/bookings/:id
 * Requires: bookings:read
 */
export const getBookingById = async (id: string): Promise<Booking> => {
  const response = await apiClient.get<BookingApiResponse>(`${BASE}/${id}`);
  return transformBooking(response.data.data);
};

/**
 * POST /api/v1/bookings
 * Requires: bookings:create
 */
export const createBooking = async (payload: CreateBookingPayload): Promise<Booking> => {
  const response = await apiClient.post<BookingApiResponse>(BASE, payload);
  return transformBooking(response.data.data);
};

/**
 * PATCH /api/v1/bookings/:id/confirm
 * Requires: bookings:manage — pending → confirmed
 */
export const confirmBooking = async (id: string): Promise<Booking> => {
  const response = await apiClient.patch<BookingApiResponse>(`${BASE}/${id}/confirm`);
  return transformBooking(response.data.data);
};

/**
 * PATCH /api/v1/bookings/:id/cancel
 * Admin/Manager: bất kỳ trạng thái nào (trừ completed/cancelled)
 * Member: chỉ pending của chính mình
 */
export const cancelBooking = async (id: string, payload?: CancelBookingPayload): Promise<Booking> => {
  const response = await apiClient.patch<BookingApiResponse>(`${BASE}/${id}/cancel`, payload ?? {});
  return transformBooking(response.data.data);
};

/**
 * PATCH /api/v1/bookings/:id/complete
 * Requires: bookings:manage — confirmed → completed
 */
export const completeBooking = async (id: string): Promise<Booking> => {
  const response = await apiClient.patch<BookingApiResponse>(`${BASE}/${id}/complete`);
  return transformBooking(response.data.data);
};

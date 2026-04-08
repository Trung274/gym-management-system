import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { extractErrorMessage } from '@/src/lib/bookingHelpers';
import * as bookingService from '@/src/lib/bookingService';
import type {
  BookingState,
  Booking,
  CreateBookingPayload,
  CancelBookingPayload,
  BookingQueryParams,
} from '@/src/types/booking.types';

export const useBookingStore = create<BookingState>()(
  devtools(
    (set, get) => ({
      bookings: [],
      isLoading: false,
      error: null,

      fetchBookings: async (params?: BookingQueryParams) => {
        set({ isLoading: true, error: null });
        try {
          const bookings = await bookingService.getBookings(params);
          set({ bookings, isLoading: false });
        } catch (error) {
          set({ error: extractErrorMessage(error), isLoading: false });
          throw error;
        }
      },

      createBooking: async (payload: CreateBookingPayload): Promise<Booking> => {
        set({ isLoading: true, error: null });
        try {
          const newBooking = await bookingService.createBooking(payload);
          set((state) => ({ bookings: [newBooking, ...state.bookings], isLoading: false }));
          return newBooking;
        } catch (error) {
          set({ error: extractErrorMessage(error), isLoading: false });
          throw error;
        }
      },

      confirmBooking: async (id: string) => {
        set({ error: null });
        try {
          const updated = await bookingService.confirmBooking(id);
          set((state) => ({
            bookings: state.bookings.map((b) => (b.id === id ? updated : b)),
          }));
        } catch (error) {
          set({ error: extractErrorMessage(error) });
          throw error;
        }
      },

      cancelBooking: async (id: string, payload?: CancelBookingPayload) => {
        set({ error: null });
        try {
          const updated = await bookingService.cancelBooking(id, payload);
          set((state) => ({
            bookings: state.bookings.map((b) => (b.id === id ? updated : b)),
          }));
        } catch (error) {
          set({ error: extractErrorMessage(error) });
          throw error;
        }
      },

      completeBooking: async (id: string) => {
        set({ error: null });
        try {
          const updated = await bookingService.completeBooking(id);
          set((state) => ({
            bookings: state.bookings.map((b) => (b.id === id ? updated : b)),
          }));
        } catch (error) {
          set({ error: extractErrorMessage(error) });
          throw error;
        }
      },

      clearError: () => set({ error: null }),
    }),
    { name: 'booking-store' }
  )
);

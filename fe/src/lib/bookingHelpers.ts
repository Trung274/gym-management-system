import type { BookingApiData, Booking } from '@/src/types/booking.types';

// ─── Transform API data → Frontend model ─────────────────────────────────────
export const transformBooking = (api: BookingApiData): Booking => ({
  id: api._id,
  memberId: api.member?._id ?? '',
  memberName: api.member?.user?.name ?? '—',
  memberEmail: api.member?.user?.email ?? '',
  trainerId: api.trainer?._id ?? '',
  trainerName: api.trainer?.user?.name ?? '—',
  trainerEmail: api.trainer?.user?.email ?? '',
  sessionDate: api.sessionDate,
  startTime: api.startTime,
  endTime: api.endTime,
  status: api.status,
  notes: api.notes,
  cancellationReason: api.cancellationReason,
  createdAt: api.createdAt,
  updatedAt: api.updatedAt,
  // Computed
  timeRangeLabel: `${api.startTime} – ${api.endTime}`,
});

export { extractErrorMessage } from './errors';

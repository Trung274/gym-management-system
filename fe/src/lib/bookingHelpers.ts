import type { BookingApiData, Booking, BookingStatus } from '@/src/types/booking.types';

// ─── Status labels ─────────────────────────────────────────────────────────────
const STATUS_LABELS: Record<BookingStatus, string> = {
  pending:   'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  completed: 'Hoàn thành',
  cancelled: 'Đã huỷ',
};

// ─── Date formatter (vi-VN) ─────────────────────────────────────────────────────
export const formatSessionDate = (dateStr: string): string =>
  new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

// ─── Transform API data → Frontend model ─────────────────────────────────────
export const transformBooking = (api: BookingApiData): Booking => ({
  id: api._id,
  memberId: api.member?._id ?? '',
  memberName: api.member?.user?.name ?? 'Không rõ',
  memberEmail: api.member?.user?.email ?? '',
  trainerId: api.trainer?._id ?? '',
  trainerName: api.trainer?.user?.name ?? 'Không rõ',
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
  statusLabel: STATUS_LABELS[api.status] ?? api.status,
  sessionDateLabel: formatSessionDate(api.sessionDate),
  timeRangeLabel: `${api.startTime} – ${api.endTime}`,
});

// ─── Error message extractor ──────────────────────────────────────────────────
export const extractErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object') {
    const e = error as any;
    return (
      e?.response?.data?.message ||
      e?.response?.data?.error ||
      e?.message ||
      'Đã xảy ra lỗi không xác định'
    );
  }
  return 'Đã xảy ra lỗi không xác định';
};

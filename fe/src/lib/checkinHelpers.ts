import type { CheckinLogApiData, CheckinLog } from '@/src/types/checkin.types';

// ─── Date formatters ──────────────────────────────────────────────────────────
export const formatCheckinDatetime = (iso: string): string =>
  new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });

export const formatCheckinDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });

export const formatCheckinTime = (iso: string): string =>
  new Date(iso).toLocaleTimeString('vi-VN', {
    hour: '2-digit', minute: '2-digit', hour12: false,
  });

// ─── Peak hour label ──────────────────────────────────────────────────────────
export const peakHourLabel = (hour: number | null): string => {
  if (hour === null) return '—';
  const h = hour.toString().padStart(2, '0');
  return `${h}:00 – ${h}:59`;
};

// ─── Transform ────────────────────────────────────────────────────────────────
export const transformCheckin = (api: CheckinLogApiData): CheckinLog => ({
  id:          api._id,
  member:      api.member ?? null,
  checkinAt:   api.checkinAt,
  note:        api.note,
  recordedBy:  api.recordedBy ?? null,
  // Computed
  checkinAtLabel:  formatCheckinDatetime(api.checkinAt),
  checkinDateOnly: formatCheckinDate(api.checkinAt),
  checkinTimeOnly: formatCheckinTime(api.checkinAt),
  memberName:      api.member?.fullName ?? '—',
  recordedByName:  api.recordedBy?.name ?? '—',
});

// ─── Error helper ─────────────────────────────────────────────────────────────
export const extractErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object') {
    const e = error as any;
    return e?.response?.data?.message || e?.response?.data?.error || e?.message || 'Đã xảy ra lỗi không xác định';
  }
  return 'Đã xảy ra lỗi không xác định';
};

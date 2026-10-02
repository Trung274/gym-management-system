import type { CheckinLogApiData, CheckinLog } from '@/src/types/checkin.types';

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
  memberName:      api.member?.fullName ?? '—',
  recordedByName:  api.recordedBy?.name ?? '—',
});

export { extractErrorMessage } from './errors';

import type { ClassApiData, GymClass, ClassStatus, ClassCategory, ScheduleItem } from '@/src/types/class.types';

// ─── Labels ───────────────────────────────────────────────────────────────────
const STATUS_LABELS: Record<ClassStatus, string> = {
  active:    'Đang hoạt động',
  cancelled: 'Đã hủy',
  completed: 'Đã kết thúc',
};

const CATEGORY_LABELS: Record<ClassCategory, string> = {
  yoga:     'Yoga',
  zumba:    'Zumba',
  cycling:  'Cycling',
  hiit:     'HIIT',
  pilates:  'Pilates',
  boxing:   'Boxing',
  other:    'Khác',
};

const DAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

// ─── Schedule label ───────────────────────────────────────────────────────────
// "T2, T4, T6 · 06:30 – 07:30" (dùng slot đầu tiên làm đại diện giờ)
export const buildScheduleLabel = (schedule: ScheduleItem[]): string => {
  if (!schedule?.length) return '—';
  const days = schedule
    .map((s) => DAY_LABELS[s.dayOfWeek])
    .join(', ');
  const { startTime, endTime } = schedule[0];
  return `${days} · ${startTime} – ${endTime}`;
};

// ─── Date formatter ───────────────────────────────────────────────────────────
export const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
};

// ─── Transform ────────────────────────────────────────────────────────────────
export const transformClass = (api: ClassApiData): GymClass => ({
  id:          api._id,
  name:        api.name,
  category:    api.category,
  description: api.description,
  trainer:     api.trainer ?? null,
  location:    api.location,
  capacity:    api.capacity,
  schedule:    api.schedule ?? [],
  startDate:   api.startDate,
  endDate:     api.endDate,
  status:      api.status,
  notes:       api.notes,
  createdAt:   api.createdAt,
  updatedAt:   api.updatedAt,
  // Computed
  statusLabel:   STATUS_LABELS[api.status] ?? api.status,
  categoryLabel: CATEGORY_LABELS[api.category] ?? api.category,
  trainerName:   api.trainer?.user?.name ?? '— Chưa có HLV —',
  scheduleLabel: buildScheduleLabel(api.schedule ?? []),
  startDateLabel: formatDate(api.startDate),
  endDateLabel:   formatDate(api.endDate),
});

// ─── Error helper ─────────────────────────────────────────────────────────────
export const extractErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object') {
    const e = error as any;
    return e?.response?.data?.message || e?.response?.data?.error || e?.message || 'Đã xảy ra lỗi không xác định';
  }
  return 'Đã xảy ra lỗi không xác định';
};

// ─── Day label exports (for UI) ───────────────────────────────────────────────
export { DAY_LABELS, STATUS_LABELS, CATEGORY_LABELS };

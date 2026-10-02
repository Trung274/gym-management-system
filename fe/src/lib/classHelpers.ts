import type { ClassApiData, GymClass } from '@/src/types/class.types';

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
  trainerName:   api.trainer?.user?.name ?? '—',
});

export { extractErrorMessage } from './errors';

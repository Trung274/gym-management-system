import type { TrainerApiData, Trainer } from '@/src/types/trainer.types';
import { getInitials } from './format';

export const transformTrainer = (api: TrainerApiData): Trainer => ({
  id: api._id,
  userId: api.user?._id ?? '',
  name: api.user?.name ?? '—',
  loginEmail: api.user?.email ?? '',
  userIsActive: api.user?.isActive ?? false,
  phone: api.phone,
  trainerEmail: api.email,
  idCard: api.idCard,
  address: api.address,
  dateOfBirth: api.dateOfBirth,
  gender: api.gender,
  specializations: api.specializations ?? [],
  experienceYears: api.experienceYears ?? 0,
  bio: api.bio,
  certifications: api.certifications ?? [],
  status: api.status,
  hireDate: api.hireDate,
  createdAt: api.createdAt,
  updatedAt: api.updatedAt,
  // Computed
  initials: getInitials(api.user?.name ?? 'T'),
});

export { extractErrorMessage } from './errors';

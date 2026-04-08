import type { TrainerApiData, Trainer, TrainerStatus } from '@/src/types/trainer.types';
import type { Gender } from '@/src/types/member.types';

const STATUS_LABELS: Record<TrainerStatus, string> = {
  active:   'Đang làm việc',
  inactive: 'Nghỉ việc',
};

const GENDER_LABELS: Record<Gender, string> = {
  male: 'Nam', female: 'Nữ', other: 'Khác',
};

export const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

export const transformTrainer = (api: TrainerApiData): Trainer => ({
  id: api._id,
  userId: api.user?._id ?? '',
  name: api.user?.name ?? 'Không rõ',
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
  statusLabel: STATUS_LABELS[api.status] ?? api.status,
  genderLabel: api.gender ? (GENDER_LABELS[api.gender] ?? api.gender) : '—',
  experienceLabel: api.experienceYears ? `${api.experienceYears} năm` : 'Chưa có',
  specializationsLabel: api.specializations?.length ? api.specializations.join(', ') : 'Chưa cập nhật',
  initials: getInitials(api.user?.name ?? 'T'),
  hireDateLabel: formatDate(api.hireDate),
});

export const extractErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object') {
    const e = error as any;
    return e?.response?.data?.message || e?.response?.data?.error || e?.message || 'Đã xảy ra lỗi không xác định';
  }
  return 'Đã xảy ra lỗi không xác định';
};

import type { Gender } from './member.types';

// ─── Enums ────────────────────────────────────────────────────────────────────
export type TrainerStatus = 'active' | 'inactive';

// ─── Nested populated types ───────────────────────────────────────────────────
export interface TrainerUserPopulated {
  _id: string;
  name: string;
  email: string;
  isActive: boolean;
}

// ─── Frontend Model (sau khi transform) ───────────────────────────────────────
export interface Trainer {
  id: string;             // Trainer document _id
  userId: string;
  name: string;           // từ user.name
  loginEmail: string;     // từ user.email (login)
  userIsActive: boolean;
  // Trainer profile fields
  phone?: string;
  trainerEmail?: string;  // personal contact email
  idCard?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: Gender;
  specializations: string[];
  experienceYears: number;
  bio?: string;
  certifications: string[];
  status: TrainerStatus;
  hireDate: string;
  createdAt: string;
  updatedAt: string;
  // Computed fields
  statusLabel: string;
  genderLabel: string;
  experienceLabel: string;   // VD: "5 năm kinh nghiệm"
  specializationsLabel: string; // VD: "Yoga, Strength"
  initials: string;
  hireDateLabel: string;
}

// ─── API Raw Response (Trainer model với populate user) ───────────────────────
export interface TrainerApiData {
  _id: string;
  id?: string;
  user: TrainerUserPopulated;
  phone?: string;
  email?: string;
  idCard?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: Gender;
  specializations: string[];
  experienceYears: number;
  bio?: string;
  certifications: string[];
  status: TrainerStatus;
  hireDate: string;
  createdAt: string;
  updatedAt: string;
}

// ─── API Response Wrappers ────────────────────────────────────────────────────
export interface TrainerListApiResponse {
  success: boolean;
  count: number;
  data: TrainerApiData[];
}

export interface TrainerApiResponse {
  success: boolean;
  data: TrainerApiData;
}

// ─── Request Payloads ─────────────────────────────────────────────────────────
export interface CreateTrainerPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
  trainerEmail?: string;
  idCard?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: Gender;
  specializations?: string[];
  experienceYears?: number;
  bio?: string;
  certifications?: string[];
  hireDate?: string;
}

export interface UpdateTrainerPayload {
  phone?: string;
  email?: string;
  idCard?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: Gender;
  specializations?: string[];
  experienceYears?: number;
  bio?: string;
  certifications?: string[];
}

export interface ChangeTrainerStatusPayload {
  status: TrainerStatus;
}

// ─── Query Params ─────────────────────────────────────────────────────────────
export interface TrainerQueryParams {
  specialization?: string;
  status?: TrainerStatus | 'all';
}

// ─── Store State ──────────────────────────────────────────────────────────────
export interface TrainerState {
  trainers: Trainer[];
  isLoading: boolean;
  error: string | null;

  fetchTrainers: (params?: TrainerQueryParams) => Promise<void>;
  createTrainer: (payload: CreateTrainerPayload) => Promise<Trainer>;
  updateTrainer: (id: string, payload: UpdateTrainerPayload) => Promise<Trainer>;
  changeStatus: (id: string, payload: ChangeTrainerStatusPayload) => Promise<void>;
  clearError: () => void;
}

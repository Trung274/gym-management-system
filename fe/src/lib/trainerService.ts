import apiClient from './axios';
import { transformTrainer } from './trainerHelpers';
import type {
  Trainer, TrainerListApiResponse, TrainerApiResponse,
  CreateTrainerPayload, UpdateTrainerPayload, ChangeTrainerStatusPayload, TrainerQueryParams,
} from '@/src/types/trainer.types';

const BASE = '/trainers';

/** GET /api/v1/trainers — Public. Chỉ trả về active. ?specialization= để lọc */
export const getTrainers = async (params?: TrainerQueryParams): Promise<Trainer[]> => {
  const response = await apiClient.get<TrainerListApiResponse>(BASE, { params });
  return response.data.data.map(transformTrainer);
};

/** GET /api/v1/trainers/:id — Public */
export const getTrainerById = async (id: string): Promise<Trainer> => {
  const response = await apiClient.get<TrainerApiResponse>(`${BASE}/${id}`);
  return transformTrainer(response.data.data);
};

/** POST /api/v1/trainers — Requires trainers:create (tạo User + Trainer) */
export const createTrainer = async (payload: CreateTrainerPayload): Promise<Trainer> => {
  const response = await apiClient.post<TrainerApiResponse>(BASE, payload);
  return transformTrainer(response.data.data);
};

/** PUT /api/v1/trainers/:id — Requires trainers:update */
export const updateTrainer = async (id: string, payload: UpdateTrainerPayload): Promise<Trainer> => {
  const response = await apiClient.put<TrainerApiResponse>(`${BASE}/${id}`, payload);
  return transformTrainer(response.data.data);
};

/** PATCH /api/v1/trainers/:id/status — Requires trainers:status (active ↔ inactive) */
export const changeTrainerStatus = async (id: string, payload: ChangeTrainerStatusPayload): Promise<Trainer> => {
  const response = await apiClient.patch<TrainerApiResponse>(`${BASE}/${id}/status`, payload);
  return transformTrainer(response.data.data);
};

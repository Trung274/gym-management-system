import type { EquipmentApiData, Equipment } from '@/src/types/equipment.types';

/** True nếu nextMaintenanceDate tồn tại và còn ≤ 7 ngày */
const isMaintenanceDue = (nextMaintenanceDate?: string): boolean => {
  if (!nextMaintenanceDate) return false;
  const days = Math.ceil((new Date(nextMaintenanceDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return days <= 7;
};

export const transformEquipment = (api: EquipmentApiData): Equipment => ({
  id: api._id,
  name: api.name,
  category: api.category,
  brand: api.brand,
  model: api.model,
  serialNumber: api.serialNumber,
  quantity: api.quantity ?? 1,
  location: api.location,
  purchaseDate: api.purchaseDate,
  purchasePrice: api.purchasePrice,
  supplier: api.supplier,
  lastMaintenanceDate: api.lastMaintenanceDate,
  nextMaintenanceDate: api.nextMaintenanceDate,
  notes: api.notes,
  status: api.status,
  createdAt: api.createdAt,
  updatedAt: api.updatedAt,
  // Computed
  isMaintenanceDue: isMaintenanceDue(api.nextMaintenanceDate),
});

export { extractErrorMessage } from './errors';

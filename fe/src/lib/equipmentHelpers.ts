import type { EquipmentApiData, Equipment, EquipmentStatus, EquipmentCategory } from '@/src/types/equipment.types';

const STATUS_LABELS: Record<EquipmentStatus, string> = {
  operational: 'Hoạt động tốt',
  maintenance: 'Đang bảo trì',
  out_of_order: 'Hỏng / Ngừng dùng',
};

const CATEGORY_LABELS: Record<EquipmentCategory, string> = {
  cardio:       'Cardio',
  strength:     'Sức mạnh',
  flexibility:  'Linh hoạt',
  free_weights: 'Tạ tự do',
  other:        'Khác',
};

export const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
};

export const formatCurrency = (value?: number): string => {
  if (value === undefined || value === null) return '—';
  return value.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
};

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
  statusLabel: STATUS_LABELS[api.status] ?? api.status,
  categoryLabel: CATEGORY_LABELS[api.category] ?? api.category,
  purchaseDateLabel: formatDate(api.purchaseDate),
  lastMaintenanceDateLabel: formatDate(api.lastMaintenanceDate),
  nextMaintenanceDateLabel: formatDate(api.nextMaintenanceDate),
  purchasePriceLabel: formatCurrency(api.purchasePrice),
  isMaintenanceDue: isMaintenanceDue(api.nextMaintenanceDate),
});

export const extractErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object') {
    const e = error as any;
    return e?.response?.data?.message || e?.response?.data?.error || e?.message || 'Đã xảy ra lỗi không xác định';
  }
  return 'Đã xảy ra lỗi không xác định';
};

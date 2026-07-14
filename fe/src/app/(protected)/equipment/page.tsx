'use client';

import { useEffect, useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { useEquipmentStore } from '@/src/stores/equipmentStore';
import { toast } from '@/src/utils/toast';
import StatsGrid from '@/src/components/ui/StatsGrid';
import AddButton from '@/src/components/ui/AddButton';
import PageHeader from '@/src/components/ui/PageHeader';
import type {
  Equipment, EquipmentStatus, EquipmentCategory,
  CreateEquipmentPayload, UpdateEquipmentPayload,
} from '@/src/types/equipment.types';
import { useLanguage } from '@/src/components/providers/LanguageProvider';
import { usePageTitle } from '@/src/hooks/usePageTitle';

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<EquipmentStatus, string> = {
  operational: 'bg-success-500/15 text-success-500',
  maintenance: 'bg-warning-500/15 text-warning-500',
  out_of_order: 'bg-danger-500/15 text-danger-500',
};

const STATUS_OPTIONS: { value: EquipmentStatus; label: string }[] = [
  { value: 'operational', label: 'Hoạt động tốt' },
  { value: 'maintenance', label: 'Đang bảo trì' },
  { value: 'out_of_order', label: 'Hỏng / Ngừng dùng' },
];

const CATEGORY_OPTIONS: { value: EquipmentCategory; label: string; icon: string }[] = [
  { value: 'cardio',       label: 'Cardio',      icon: '🏃' },
  { value: 'strength',     label: 'Sức mạnh',    icon: '💪' },
  { value: 'flexibility',  label: 'Linh hoạt',   icon: '🧘' },
  { value: 'free_weights', label: 'Tạ tự do',    icon: '🏋️' },
  { value: 'other',        label: 'Khác',         icon: '⚙️' },
];

const CATEGORY_ICON: Record<EquipmentCategory, string> = {
  cardio: '🏃', strength: '💪', flexibility: '🧘', free_weights: '🏋️', other: '⚙️',
};

const CATEGORY_IMAGE: Record<EquipmentCategory, string> = {
  cardio: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=150&auto=format&fit=crop&q=60',
  strength: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=150&auto=format&fit=crop&q=60',
  flexibility: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=150&auto=format&fit=crop&q=60',
  free_weights: 'https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?w=150&auto=format&fit=crop&q=60',
  other: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=150&auto=format&fit=crop&q=60',
};

const EMPTY_CREATE: CreateEquipmentPayload = {
  name: '', category: 'cardio',
  brand: '', model: '', serialNumber: '',
  quantity: 1, location: '',
  purchaseDate: '', purchasePrice: undefined,
  supplier: '', nextMaintenanceDate: '', notes: '',
};

// ─── Status Change Dropdown ───────────────────────────────────────────────────
function StatusBadge({ equipment, onChange, disabled }: {
  equipment: Equipment;
  onChange: (s: EquipmentStatus) => void;
  disabled: boolean;
}) {
  const { t } = useLanguage();
  const te = t('equipment');
  const [open, setOpen] = useState(false);

  const statusOptions = [
    { value: 'operational' as EquipmentStatus, label: te('status.operational') },
    { value: 'maintenance' as EquipmentStatus, label: te('status.maintenance') },
    { value: 'out_of_order' as EquipmentStatus, label: te('status.out_of_order') },
  ];

  return (
    <div className="relative">
      <button onClick={() => !disabled && setOpen(o => !o)} disabled={disabled}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all ${STATUS_STYLES[equipment.status]} ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}`}>
        {te(`status.${equipment.status}`)}
        {!disabled && <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z" clipRule="evenodd" /></svg>}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-20 bg-surface-base border border-surface-border rounded-xl shadow-xl py-1 w-44">
            {statusOptions.map((s) => (
              <button key={s.value} onClick={() => { onChange(s.value); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-xs font-semibold hover:bg-surface-raised transition-all cursor-pointer ${equipment.status === s.value ? 'text-primary-500' : 'text-text-secondary'}`}>
                {s.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Confirm Delete Dialog ────────────────────────────────────────────────────
function DeleteDialog({ open, equipment, onClose, onConfirm, isLoading }: {
  open: boolean; equipment: Equipment | null; onClose: () => void;
  onConfirm: () => void; isLoading: boolean;
}) {
  const { t } = useLanguage();
  const te = t('equipment');
  const tCommon = t('common');

  if (!open || !equipment) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-surface-base rounded-2xl shadow-2xl border border-surface-border p-6 flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-danger-500/10 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-danger-500"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary">{te('deleteModal.title')}</h3>
            <p className="text-xs text-text-muted mt-0.5">{te('deleteModal.subtitle')}</p>
          </div>
        </div>
        <p className="text-sm text-text-secondary">{te('deleteModal.confirm').replace('{{name}}', equipment.name)}</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-text-secondary border border-surface-border hover:bg-surface-overlay transition-all cursor-pointer">{tCommon('actions.cancel')}</button>
          <button onClick={onConfirm} disabled={isLoading}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-danger-500 hover:bg-danger-600 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2">
            {isLoading && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
            {tCommon('actions.delete')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Create / Edit Modal ──────────────────────────────────────────────────────
function EquipmentModal({ open, editing, onClose, onSave, isLoading }: {
  open: boolean; editing: Equipment | null; onClose: () => void;
  onSave: (payload: CreateEquipmentPayload | UpdateEquipmentPayload, id?: string) => Promise<void>;
  isLoading: boolean;
}) {
  const { t } = useLanguage();
  const te = t('equipment');
  const tCommon = t('common');

  const [form, setForm] = useState<any>(EMPTY_CREATE);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      if (editing) {
        setForm({
          name: editing.name, category: editing.category,
          brand: editing.brand ?? '', model: editing.model ?? '',
          serialNumber: editing.serialNumber ?? '',
          quantity: editing.quantity,
          location: editing.location ?? '',
          purchaseDate: editing.purchaseDate ? editing.purchaseDate.substring(0, 10) : '',
          purchasePrice: editing.purchasePrice ?? '',
          supplier: editing.supplier ?? '',
          nextMaintenanceDate: editing.nextMaintenanceDate ? editing.nextMaintenanceDate.substring(0, 10) : '',
          notes: editing.notes ?? '',
        });
      } else {
        setForm({ ...EMPTY_CREATE });
      }
      setErrors({});
    }
  }, [open, editing]);

  const setF = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name?.trim()) e.name = te('validation.nameRequired');
    if (!form.category) e.category = te('validation.categoryRequired');
    if (form.quantity && Number(form.quantity) < 1) e.quantity = te('validation.quantityMin');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const payload: any = {
      name: form.name.trim(),
      category: form.category,
      brand: form.brand || undefined,
      model: form.model || undefined,
      serialNumber: form.serialNumber || undefined,
      quantity: Number(form.quantity) || 1,
      location: form.location || undefined,
      purchaseDate: form.purchaseDate || undefined,
      purchasePrice: form.purchasePrice !== '' ? Number(form.purchasePrice) : undefined,
      supplier: form.supplier || undefined,
      nextMaintenanceDate: form.nextMaintenanceDate || undefined,
      notes: form.notes || undefined,
    };
    await onSave(payload, editing?.id);
  };

  if (!open) return null;

  const inputCls = (field: string) =>
    `w-full px-3 py-2 rounded-xl border text-sm text-text-primary bg-surface-raised placeholder-text-muted outline-none transition-all
    ${errors[field] ? 'border-danger-500 focus:ring-2 focus:ring-danger-500/30' : 'border-surface-border focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-surface-base rounded-2xl shadow-2xl border border-surface-border overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border shrink-0">
          <h2 className="text-base font-bold text-text-primary">
            {editing ? te('modal.editTitle') : te('modal.createTitle')}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-overlay transition-all cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 flex flex-col gap-5">
          {/* Thông tin cơ bản */}
          <div>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">{te('modal.basicInfo')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-text-secondary">{te('modal.name')} <span className="text-danger-500">*</span></label>
                <input type="text" value={form.name} onChange={(e) => setF('name', e.target.value)} placeholder="VD: Máy chạy bộ NordicTrack" className={inputCls('name')} />
                {errors.name && <p className="text-xs text-danger-500">{errors.name}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary">{te('modal.category')} <span className="text-danger-500">*</span></label>
                <select value={form.category} onChange={(e) => setF('category', e.target.value)} className={inputCls('category')}>
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>{c.icon} {te(`categories.${c.value}`)}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary">{te('modal.quantity')}</label>
                <input type="number" min="1" value={form.quantity} onChange={(e) => setF('quantity', e.target.value)} className={inputCls('quantity')} />
                {errors.quantity && <p className="text-xs text-danger-500">{errors.quantity}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary">{te('modal.brand')}</label>
                <input type="text" value={form.brand} onChange={(e) => setF('brand', e.target.value)} placeholder="NordicTrack, Life Fitness..." className={inputCls('brand')} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary">{te('modal.model')}</label>
                <input type="text" value={form.model} onChange={(e) => setF('model', e.target.value)} placeholder="Commercial 1750" className={inputCls('model')} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary">{te('modal.serialNumber')}</label>
                <input type="text" value={form.serialNumber} onChange={(e) => setF('serialNumber', e.target.value)} placeholder="SN-12345678" className={inputCls('serialNumber')} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary">{te('modal.location')}</label>
                <input type="text" value={form.location} onChange={(e) => setF('location', e.target.value)} placeholder="Zone Cardio, Tầng 1..." className={inputCls('location')} />
              </div>
            </div>
          </div>

          {/* Mua sắm & bảo trì */}
          <div>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">{te('modal.maintenanceInfo')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary">{te('modal.purchaseDate')}</label>
                <input type="date" value={form.purchaseDate} onChange={(e) => setF('purchaseDate', e.target.value)} className={inputCls('purchaseDate')} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary">{te('modal.purchasePrice')}</label>
                <input type="number" min="0" value={form.purchasePrice} onChange={(e) => setF('purchasePrice', e.target.value)} placeholder="50000000" className={inputCls('purchasePrice')} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary">{te('modal.supplier')}</label>
                <input type="text" value={form.supplier} onChange={(e) => setF('supplier', e.target.value)} placeholder="Công ty ABC" className={inputCls('supplier')} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary">{te('modal.nextMaintenanceDate')}</label>
                <input type="date" value={form.nextMaintenanceDate} onChange={(e) => setF('nextMaintenanceDate', e.target.value)} className={inputCls('nextMaintenanceDate')} />
              </div>
            </div>
          </div>

          {/* Ghi chú */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary">{te('modal.notes')}</label>
            <textarea rows={2} value={form.notes} onChange={(e) => setF('notes', e.target.value)} placeholder={te('modal.notesPlaceholder')} className={`${inputCls('notes')} resize-none`} />
          </div>

          <div className="flex gap-3 pt-2 sticky bottom-0 bg-surface-base border-t border-surface-border -mx-6 px-6 py-4 -mb-6">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-text-secondary border border-surface-border hover:bg-surface-overlay transition-all cursor-pointer">{tCommon('actions.cancel')}</button>
            <button type="submit" disabled={isLoading}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-primary-500 hover:bg-primary-600 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2">
              {isLoading && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
              {editing ? te('modal.submitEdit') : te('modal.submitCreate')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Equipment Table Row ──────────────────────────────────────────────────────
function EquipmentRow({ item, onEdit, onDelete, onStatusChange, actingId }: {
  item: Equipment;
  onEdit: (e: Equipment) => void;
  onDelete: (e: Equipment) => void;
  onStatusChange: (id: string, s: EquipmentStatus) => void;
  actingId: string | null;
}) {
  const { t } = useLanguage();
  const te = t('equipment');
  const tCommon = t('common');

  const isActing = actingId === item.id;

  const statusStyles: Record<EquipmentStatus, string> = {
    operational: 'border-primary-500/20 hover:border-primary-500/40',
    maintenance: 'border-warning-500/20 hover:border-warning-500/40',
    out_of_order: 'border-danger-500/20 hover:border-danger-500/40',
  };

  return (
    <div className={`grid grid-cols-12 items-center px-6 py-4 bg-surface-overlay rounded-xl hover:bg-surface-raised transition-all group border-l-4 ${statusStyles[item.status]}`}>
      <div className="col-span-6 md:col-span-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-surface-border flex items-center justify-center text-xl shrink-0">
          {CATEGORY_ICON[item.category]}
        </div>
        <div className="min-w-0">
          <p className="font-headline font-bold text-text-primary group-hover:text-primary-500 transition-colors truncate text-sm sm:text-base">{item.name}</p>
          <p className="text-xs text-text-muted font-mono mt-0.5 truncate">ID: {item.serialNumber || 'KPC-EQ-' + item.id.substring(item.id.length - 4).toUpperCase()}</p>
        </div>
      </div>
      <div className="hidden md:block col-span-3 text-sm font-medium text-text-secondary">
        <p className="text-text-primary">{item.location || 'Cardio Zone / Floor 1'}</p>
        <p className="text-xs text-text-muted mt-0.5">{item.brand || 'GymMS Brand'} {item.model || ''}</p>
      </div>
      <div className="hidden md:block col-span-2 text-sm text-text-secondary">
        <p className="text-xs text-text-muted">{te('table.nextMaintenanceLabel')}</p>
        <p className={`text-xs mt-0.5 font-semibold ${item.isMaintenanceDue ? 'text-warning-500' : 'text-text-secondary'}`}>
          {item.nextMaintenanceDateLabel}
        </p>
      </div>
      <div className="col-span-3 md:col-span-2 text-right md:text-left flex items-center justify-end md:justify-start">
        <StatusBadge equipment={item} onChange={(s) => onStatusChange(item.id, s)} disabled={isActing} />
      </div>
      <div className="col-span-3 md:col-span-1 text-right flex justify-end gap-1">
        {isActing ? (
          <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
        ) : (
          <>
            <button onClick={() => onEdit(item)} title={tCommon('actions.edit')}
              className="p-1.5 rounded-lg text-text-muted hover:text-primary-500 hover:bg-primary-500/10 transition-all cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" /></svg>
            </button>
            <button onClick={() => onDelete(item)} title={tCommon('actions.delete')}
              className="p-1.5 rounded-lg text-text-muted hover:text-danger-500 hover:bg-danger-500/10 transition-all cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function EquipmentPage() {
  const { t } = useLanguage();
  const te = t('equipment');
  const tCommon = t('common');
  usePageTitle('equipment');

  const { equipment, isLoading, error, fetchEquipment, createEquipment, updateEquipment, changeStatus, deleteEquipment, clearError } = useEquipmentStore();

  const [filterCategory, setFilterCategory] = useState<EquipmentCategory | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<EquipmentStatus | 'all'>('all');
  const [searchQ, setSearchQ] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Equipment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Equipment | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { fetchEquipment().catch(() => {}); }, [fetchEquipment]);
  useEffect(() => () => clearError(), [clearError]);

  // Local filter
  const filtered = equipment.filter((e) => {
    const catOk = filterCategory === 'all' || e.category === filterCategory;
    const statusOk = filterStatus === 'all' || e.status === filterStatus;
    const searchOk = !searchQ ||
      e.name.toLowerCase().includes(searchQ.toLowerCase()) ||
      (e.brand ?? '').toLowerCase().includes(searchQ.toLowerCase()) ||
      (e.location ?? '').toLowerCase().includes(searchQ.toLowerCase());
    return catOk && statusOk && searchOk;
  });

  // Stats
  const stats = {
    total: equipment.length,
    operational: equipment.filter((e) => e.status === 'operational').length,
    maintenance: equipment.filter((e) => e.status === 'maintenance').length,
    outOfOrder: equipment.filter((e) => e.status === 'out_of_order').length,
    maintenanceDue: equipment.filter((e) => e.isMaintenanceDue).length,
  };

  const handleSave = useCallback(async (payload: CreateEquipmentPayload | UpdateEquipmentPayload, id?: string) => {
    setSaving(true);
    try {
      if (id) {
        await updateEquipment(id, payload as UpdateEquipmentPayload);
        toast.success(te('toast.editSuccess'));
      } else {
        await createEquipment(payload as CreateEquipmentPayload);
        toast.success(te('toast.addSuccess'));
      }
      setModalOpen(false);
      setEditingItem(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || te('toast.error'));
    } finally { setSaving(false); }
  }, [createEquipment, updateEquipment, te]);

  const handleStatusChange = useCallback(async (id: string, status: EquipmentStatus) => {
    setActingId(id);
    try {
      await changeStatus(id, { status });
      toast.success(status === 'maintenance' ? te('toast.statusMaintenanceSuccess') : te('toast.statusSuccess'));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || te('toast.statusError'));
    } finally { setActingId(null); }
  }, [changeStatus, te]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteEquipment(deleteTarget.id);
      toast.success(te('toast.deleteSuccess').replace('{{name}}', deleteTarget.name));
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || te('toast.deleteError'));
    } finally { setDeleting(false); }
  }, [deleteEquipment, deleteTarget, te]);

  const openEdit = useCallback((e: Equipment) => { setEditingItem(e); setModalOpen(true); }, []);
  const openCreate = useCallback(() => { setEditingItem(null); setModalOpen(true); }, []);

  return (
    <>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <PageHeader
            title={te('title')}
            subtitle={te('subtitle')}
          />
          <div className="flex gap-4 w-full md:w-auto">
            <button onClick={() => {
              window.print();
            }} className="flex-1 md:flex-none px-6 py-3 bg-surface-overlay border border-surface-border text-text-primary font-headline font-bold uppercase tracking-widest rounded-xl hover:bg-surface-raised transition-all active:scale-95 text-xs">
              {te('reportButton')}
            </button>
            <AddButton onClick={openCreate} label={te('addEquipment')} />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-danger-500/10 border border-danger-500/20 text-danger-500 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
            <span className="flex-1">{error}</span>
            <button onClick={clearError} className="hover:opacity-70 cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
            </button>
          </div>
        )}

        {/* Stats KPIs */}
        <StatsGrid
          isLoading={isLoading}
          items={[
            { label: te('stats.total'), value: stats.total, color: 'primary' },
            { label: te('stats.operational'), value: stats.operational, color: 'success' },
            { label: te('stats.maintenance'), value: stats.maintenance, color: 'warning' },
            { label: te('stats.outOfOrder'), value: stats.outOfOrder, color: 'danger' },
          ]}
        />

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
            <input type="text" value={searchQ} onChange={(e) => setSearchQ(e.target.value)} placeholder={te('searchPlaceholder')}
              className="pl-9 pr-4 py-2 rounded-xl border border-surface-border bg-surface-overlay text-sm text-text-primary placeholder-text-muted outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all w-48"
            />
          </div>
          {/* Category filter */}
          <div className="flex gap-1 p-1 bg-surface-overlay rounded-xl border border-surface-border">
            <button onClick={() => setFilterCategory('all')} className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${filterCategory === 'all' ? 'bg-primary-500 text-white shadow' : 'text-text-secondary hover:bg-surface-raised'}`}>{tCommon('filters.all')}</button>
            {CATEGORY_OPTIONS.map((c) => (
              <button key={c.value} onClick={() => setFilterCategory(c.value)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${filterCategory === c.value ? 'bg-primary-500 text-white shadow' : 'text-text-secondary hover:bg-surface-raised'}`}>
                {c.icon} {te(`categories.${c.value}`)}
              </button>
            ))}
          </div>
          {/* Status filter */}
          <div className="flex gap-1 p-1 bg-surface-overlay rounded-xl border border-surface-border">
            {([
              { v: 'all', l: te('filters.allStatus') },
              { v: 'operational', l: te('status.operational') },
              { v: 'maintenance', l: te('status.maintenance') },
              { v: 'out_of_order', l: te('status.out_of_order') }
            ]).map((f) => (
              <button key={f.v} onClick={() => setFilterStatus(f.v as any)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${filterStatus === f.v ? 'bg-primary-500 text-white shadow' : 'text-text-secondary hover:bg-surface-raised'}`}>{f.l}</button>
            ))}
          </div>
          <span className="ml-auto text-xs text-text-muted">{filtered.length} {te('count')}</span>
        </div>

        {/* Equipment Stack View */}
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-12 px-6 py-3 bg-surface-overlay rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted border border-surface-border/50">
            <div className="col-span-6 md:col-span-4">{te('table.details')}</div>
            <div className="hidden md:block col-span-3">{te('table.location')}</div>
            <div className="hidden md:block col-span-2">{te('table.nextMaintenance')}</div>
            <div className="col-span-3 md:col-span-2 text-right md:text-left">{te('table.status')}</div>
            <div className="col-span-3 md:col-span-1 text-right">{te('table.actions')}</div>
          </div>
          
          {isLoading && equipment.length === 0 ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="grid grid-cols-12 items-center px-6 py-4 bg-surface-overlay rounded-xl border-l-4 border-surface-border/50 animate-pulse">
                <div className="col-span-6 md:col-span-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-surface-border shrink-0" />
                  <div className="flex flex-col gap-2 w-32">
                    <div className="h-4 bg-surface-border rounded w-full" />
                    <div className="h-3 bg-surface-border rounded w-3/4" />
                  </div>
                </div>
                <div className="hidden md:block col-span-3">
                  <div className="h-4 bg-surface-border rounded w-1/2" />
                </div>
                <div className="hidden md:block col-span-2">
                  <div className="h-4 bg-surface-border rounded w-2/3" />
                </div>
                <div className="col-span-3 md:col-span-2">
                  <div className="h-6 bg-surface-border rounded-full w-20" />
                </div>
                <div className="col-span-3 md:col-span-1" />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="px-6 py-16 text-center bg-surface-overlay rounded-xl border border-surface-border/50">
              <p className="text-4xl mb-3">🏋️</p>
              <p className="text-sm font-semibold text-text-primary">{te('empty.title')}</p>
              <p className="text-xs text-text-muted mt-1">{te('empty.description')}</p>
            </div>
          ) : (
            filtered.map((item) => (
              <EquipmentRow key={item.id} item={item}
                onEdit={openEdit} onDelete={setDeleteTarget}
                onStatusChange={handleStatusChange} actingId={actingId}
              />
            ))
          )}
        </div>
      </div>

      <EquipmentModal open={modalOpen} editing={editingItem} onClose={() => { setModalOpen(false); setEditingItem(null); }} onSave={handleSave} isLoading={saving} />
      <DeleteDialog open={!!deleteTarget} equipment={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} isLoading={deleting} />
    </>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import { Loader2, Pencil, Search, Trash2 } from 'lucide-react';
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
import Alert from '@/src/components/ui/Alert';
import { getApiMessage } from '@/src/lib/errors';
import Modal, { ModalFooter } from '@/src/components/ui/Modal';
import FormField, { inputClass } from '@/src/components/ui/FormField';
import StatusSelect from '@/src/components/ui/StatusSelect';
import ConfirmDialog from '@/src/components/ui/ConfirmDialog';
import { EQUIPMENT_STATUS_TONE } from '@/src/lib/statusTones';
import EmptyState from '@/src/components/ui/EmptyState';

// ─── Constants ────────────────────────────────────────────────────────────────
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
  const options = (Object.keys(EQUIPMENT_STATUS_TONE) as EquipmentStatus[]).map((s) => ({ value: s, label: te(`status.${s}`) }));

  return (
    <StatusSelect value={equipment.status} tone={EQUIPMENT_STATUS_TONE[equipment.status]}
      options={options} onChange={onChange} disabled={disabled} />
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

  const inputCls = (field: string) => inputClass(!!errors[field]);

  return (
    <Modal onClose={onClose} title={editing ? te('modal.editTitle') : te('modal.createTitle')} size="lg" scrollable>
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
            <FormField label={te('modal.category')} required>
              <select value={form.category} onChange={(e) => setF('category', e.target.value)} className={inputCls('category')}>
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>{c.icon} {te(`categories.${c.value}`)}</option>
                ))}
              </select>
            </FormField>
            <FormField label={te('modal.quantity')} error={errors.quantity}>
              <input type="number" min="1" value={form.quantity} onChange={(e) => setF('quantity', e.target.value)} className={inputCls('quantity')} />
            </FormField>
            <FormField label={te('modal.brand')}>
              <input type="text" value={form.brand} onChange={(e) => setF('brand', e.target.value)} placeholder="NordicTrack, Life Fitness..." className={inputCls('brand')} />
            </FormField>
            <FormField label={te('modal.model')}>
              <input type="text" value={form.model} onChange={(e) => setF('model', e.target.value)} placeholder="Commercial 1750" className={inputCls('model')} />
            </FormField>
            <FormField label={te('modal.serialNumber')}>
              <input type="text" value={form.serialNumber} onChange={(e) => setF('serialNumber', e.target.value)} placeholder="SN-12345678" className={inputCls('serialNumber')} />
            </FormField>
            <FormField label={te('modal.location')}>
              <input type="text" value={form.location} onChange={(e) => setF('location', e.target.value)} placeholder="Zone Cardio, Tầng 1..." className={inputCls('location')} />
            </FormField>
          </div>
        </div>

        {/* Mua sắm & bảo trì */}
        <div>
          <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">{te('modal.maintenanceInfo')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label={te('modal.purchaseDate')}>
              <input type="date" value={form.purchaseDate} onChange={(e) => setF('purchaseDate', e.target.value)} className={inputCls('purchaseDate')} />
            </FormField>
            <FormField label={te('modal.purchasePrice')}>
              <input type="number" min="0" value={form.purchasePrice} onChange={(e) => setF('purchasePrice', e.target.value)} placeholder="50000000" className={inputCls('purchasePrice')} />
            </FormField>
            <FormField label={te('modal.supplier')}>
              <input type="text" value={form.supplier} onChange={(e) => setF('supplier', e.target.value)} placeholder="Công ty ABC" className={inputCls('supplier')} />
            </FormField>
            <FormField label={te('modal.nextMaintenanceDate')}>
              <input type="date" value={form.nextMaintenanceDate} onChange={(e) => setF('nextMaintenanceDate', e.target.value)} className={inputCls('nextMaintenanceDate')} />
            </FormField>
          </div>
        </div>

        {/* Ghi chú */}
        <FormField label={te('modal.notes')}>
          <textarea rows={2} value={form.notes} onChange={(e) => setF('notes', e.target.value)} placeholder={te('modal.notesPlaceholder')} className={`${inputCls('notes')} resize-none`} />
        </FormField>

        <ModalFooter onCancel={onClose} cancelLabel={tCommon('actions.cancel')} submitLabel={editing ? te('modal.submitEdit') : te('modal.submitCreate')} loading={isLoading} sticky />
      </form>
    </Modal>
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
              <Pencil size={16} />
            </button>
            <button onClick={() => onDelete(item)} title={tCommon('actions.delete')}
              className="p-1.5 rounded-lg text-text-muted hover:text-danger-500 hover:bg-danger-500/10 transition-all cursor-pointer">
              <Trash2 size={16} />
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
    } catch (err) {
      toast.error(getApiMessage(err) || te('toast.error'));
    } finally { setSaving(false); }
  }, [createEquipment, updateEquipment, te]);

  const handleStatusChange = useCallback(async (id: string, status: EquipmentStatus) => {
    setActingId(id);
    try {
      await changeStatus(id, { status });
      toast.success(status === 'maintenance' ? te('toast.statusMaintenanceSuccess') : te('toast.statusSuccess'));
    } catch (err) {
      toast.error(getApiMessage(err) || te('toast.statusError'));
    } finally { setActingId(null); }
  }, [changeStatus, te]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteEquipment(deleteTarget.id);
      toast.success(te('toast.deleteSuccess').replace('{{name}}', deleteTarget.name));
      setDeleteTarget(null);
    } catch (err) {
      toast.error(getApiMessage(err) || te('toast.deleteError'));
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
        {error && <Alert onDismiss={clearError}>{error}</Alert>}

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
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
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
            <EmptyState icon="🏋️" title={te('empty.title')} description={te('empty.description')}
              className="bg-surface-overlay rounded-xl border border-surface-border/50" />
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
      {deleteTarget && (
        <ConfirmDialog
          title={te('deleteModal.title')}
          message={<>
            <p>{te('deleteModal.confirm').replace('{{name}}', deleteTarget.name)}</p>
            <p className="text-xs text-text-muted mt-1">{te('deleteModal.subtitle')}</p>
          </>}
          confirmLabel={tCommon('actions.delete')}
          cancelLabel={tCommon('actions.cancel')}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useStaffStore } from '@/src/stores/staffStore';
import { toast } from '@/src/utils/toast';
import StatsGrid from '@/src/components/ui/StatsGrid';
import AddButton from '@/src/components/ui/AddButton';
import PageHeader from '@/src/components/ui/PageHeader';
import type {
  StaffMember,
  RoleName,
  CreateStaffPayload,
  UpdateStaffPayload,
} from '@/src/types/staff.types';
import { ROLES } from '@/src/lib/roles';
import { useLanguage } from '@/src/components/providers/LanguageProvider';
import { usePageTitle } from '@/src/hooks/usePageTitle';
import Modal, { ModalFooter } from '@/src/components/ui/Modal';
import FormField, { Input } from '@/src/components/ui/FormField';
import Spinner from '@/src/components/ui/Spinner';
import { Eye, EyeOff, Check, Ban, CheckCircle, Pencil, Search, Tag } from 'lucide-react';
import Alert from '@/src/components/ui/Alert';
import { getApiMessage } from '@/src/lib/errors';
import Badge from '@/src/components/ui/Badge';
import { ROLE_TONE } from '@/src/lib/statusTones';
import SegmentedControl from '@/src/components/ui/SegmentedControl';

// ─── Constants ────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  'from-primary-400 to-primary-600',
  'from-violet-400 to-violet-600',
  'from-sky-400 to-sky-600',
  'from-emerald-400 to-emerald-600',
  'from-rose-400 to-rose-600',
];

const getAvatarColor = (id: string) =>
  AVATAR_COLORS[id.charCodeAt(id.length - 1) % AVATAR_COLORS.length];

const EMPTY_CREATE_FORM = { name: '', email: '', password: '', roleName: ROLES.STAFF as RoleName };

const EMPTY_EDIT_FORM = { name: '', email: '' };

// ─── Staff Card ───────────────────────────────────────────────────────────────
function StaffCard({
  member,
  onEdit,
  onToggle,
  onAssignRole,
  actingId,
}: {
  member: StaffMember;
  onEdit: (m: StaffMember) => void;
  onToggle: (m: StaffMember) => void;
  onAssignRole: (m: StaffMember) => void;
  actingId: string | null;
}) {
  const isActing = actingId === member.id;
  const { t, lang } = useLanguage();
  const ts = t('staff');

  return (
    <div className={`
      bg-surface-base border border-surface-border rounded-2xl p-5
      flex flex-col gap-4 transition-all duration-200 hover:shadow-md
      ${!member.isActive ? 'opacity-60' : ''}
    `}>
      {/* Header: avatar + name + status */}
      <div className="flex items-start gap-3">
        <div className={`
          w-11 h-11 rounded-xl bg-gradient-to-br ${getAvatarColor(member.id)}
          flex items-center justify-center text-white font-bold text-sm shrink-0
        `}>
          {member.initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-text-primary text-sm truncate">{member.name}</p>
          <p className="text-xs text-text-muted truncate">{member.email}</p>
        </div>
        <Badge tone={member.isActive ? 'success' : 'neutral'}>
          {member.isActive ? ts('card.active') : ts('card.inactive')}
        </Badge>
      </div>

      {/* Role badge */}
      <div className="flex items-center gap-2">
        <Badge tone={ROLE_TONE[member.role.name] ?? 'neutral'}>
          {ts(`roles.${member.role.name}`, member.roleLabel)}
        </Badge>
        <span className="text-xs text-text-muted ml-auto">
          {new Date(member.createdAt).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US')}
        </span>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-surface-border">
        <button
          onClick={() => onEdit(member)}
          className="flex flex-col items-center gap-1 py-2 rounded-xl text-xs font-medium
            text-text-secondary hover:text-text-primary hover:bg-surface-overlay
            transition-all cursor-pointer"
        >
          <Pencil size={16} />
          {ts('card.edit')}
        </button>

        <button
          onClick={() => onAssignRole(member)}
          className="flex flex-col items-center gap-1 py-2 rounded-xl text-xs font-medium
            text-text-secondary hover:text-primary-500 hover:bg-primary-500/10
            transition-all cursor-pointer"
        >
          <Tag size={16} />
          {ts('card.assignRole')}
        </button>

        <button
          onClick={() => onToggle(member)}
          disabled={isActing}
          className={`flex flex-col items-center gap-1 py-2 rounded-xl text-xs font-medium
            transition-all cursor-pointer disabled:opacity-50
            ${member.isActive
              ? 'text-danger-500 hover:bg-danger-500/10'
              : 'text-success-500 hover:bg-success-500/10'
            }`}
        >
          {isActing ? (
            <Spinner />
          ) : (
            (member.isActive ? <Ban size={16} /> : <CheckCircle size={16} />)
          )}
          {member.isActive ? ts('card.deactivate') : ts('card.activate')}
        </button>
      </div>
    </div>
  );
}

// ─── Create Staff Modal ───────────────────────────────────────────────────────
function CreateStaffModal({
  open,
  onClose,
  onSave,
  isLoading,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (payload: CreateStaffPayload) => Promise<void>;
  isLoading: boolean;
}) {
  const [form, setForm] = useState(EMPTY_CREATE_FORM);
  const [showPwd, setShowPwd] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { t } = useLanguage();
  const ts = t('staff');

  const STAFF_ROLES_LIST = [
    { value: ROLES.ADMIN as RoleName,   label: ts('stats.admin') },
    { value: ROLES.MANAGER as RoleName, label: ts('stats.manager') },
    { value: ROLES.TRAINER as RoleName, label: ts('stats.trainer') },
    { value: ROLES.STAFF as RoleName,   label: ts('stats.staff') },
  ];

  useEffect(() => {
    if (open) { setForm(EMPTY_CREATE_FORM); setErrors({}); }
  }, [open]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = ts('validation.nameRequired');
    if (!form.email.trim()) e.email = ts('validation.emailRequired');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = ts('validation.emailInvalid');
    if (!form.password) e.password = ts('validation.passwordRequired');
    else if (form.password.length < 6) e.password = ts('validation.passwordMin');
    if (!form.roleName) e.roleName = ts('validation.roleRequired');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSave({ name: form.name.trim(), email: form.email.trim(), password: form.password, roleName: form.roleName });
  };

  if (!open) return null;

  return (
    <Modal onClose={onClose} title={ts('modal.createTitle')}>
      <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
        <FormField label={ts('modal.name')} required error={errors.name}>
          <Input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Nguyễn Văn A" invalid={!!errors.name} />
        </FormField>

        <FormField label={ts('modal.email')} required error={errors.email}>
          <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="staff@gym.com" invalid={!!errors.email} />
        </FormField>

        <FormField label={ts('modal.password')} required error={errors.password}>
          <div className="relative">
            <Input type={showPwd ? 'text' : 'password'} value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder={ts('modal.passwordHint')} invalid={!!errors.password} className="pr-10" />
            <button type="button" onClick={() => setShowPwd((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors cursor-pointer">
              {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </FormField>

        <FormField label={ts('modal.role')} required>
          <div className="grid grid-cols-2 gap-2">
            {STAFF_ROLES_LIST.map((r) => (
              <button key={r.value} type="button" onClick={() => setForm((f) => ({ ...f, roleName: r.value }))}
                className={`py-2.5 rounded-xl text-sm font-semibold border transition-all cursor-pointer
                  ${form.roleName === r.value
                    ? 'border-primary-500 bg-primary-500/10 text-primary-500'
                    : 'border-surface-border bg-surface-raised text-text-secondary hover:border-primary-500/50'}`}>
                {r.label}
              </button>
            ))}
          </div>
        </FormField>

        <ModalFooter onCancel={onClose} cancelLabel={ts('modal.cancel')} submitLabel={ts('modal.add')} loading={isLoading} />
      </form>
    </Modal>
  );
}

// ─── Edit Staff Modal ─────────────────────────────────────────────────────────
function EditStaffModal({
  open,
  member,
  onClose,
  onSave,
  isLoading,
}: {
  open: boolean;
  member: StaffMember | null;
  onClose: () => void;
  onSave: (id: string, payload: UpdateStaffPayload) => Promise<void>;
  isLoading: boolean;
}) {
  const [form, setForm] = useState(EMPTY_EDIT_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { t } = useLanguage();
  const ts = t('staff');

  useEffect(() => {
    if (member) { setForm({ name: member.name, email: member.email }); setErrors({}); }
  }, [member]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = ts('validation.nameRequired');
    if (!form.email.trim()) e.email = ts('validation.emailRequired');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = ts('validation.emailInvalid');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !member) return;
    await onSave(member.id, { name: form.name.trim(), email: form.email.trim() });
  };

  if (!open || !member) return null;

  return (
    <Modal onClose={onClose} title={ts('modal.editTitle')}>
      <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
        <FormField label={ts('modal.name')} required error={errors.name}>
          <Input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} invalid={!!errors.name} />
        </FormField>
        <FormField label={ts('modal.email')} required error={errors.email}>
          <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} invalid={!!errors.email} />
        </FormField>
        <ModalFooter onCancel={onClose} cancelLabel={ts('modal.cancel')} submitLabel={ts('modal.save')} loading={isLoading} />
      </form>
    </Modal>
  );
}

// ─── Assign Role Modal ────────────────────────────────────────────────────────
function AssignRoleModal({
  open,
  member,
  onClose,
  onSave,
  isLoading,
}: {
  open: boolean;
  member: StaffMember | null;
  onClose: () => void;
  onSave: (id: string, roleName: RoleName) => Promise<void>;
  isLoading: boolean;
}) {
  const [selectedRole, setSelectedRole] = useState<RoleName>(ROLES.USER);
  const { t } = useLanguage();
  const ts = t('staff');

  const STAFF_ROLES_LIST = [
    { value: ROLES.ADMIN as RoleName,   label: ts('stats.admin') },
    { value: ROLES.MANAGER as RoleName, label: ts('stats.manager') },
    { value: ROLES.TRAINER as RoleName, label: ts('stats.trainer') },
    { value: ROLES.STAFF as RoleName,   label: ts('stats.staff') },
  ];

  useEffect(() => {
    if (member) setSelectedRole(member.role.name);
  }, [member]);

  if (!open || !member) return null;

  return (
    <Modal onClose={onClose} title={ts('modal.assignTitle')} size="sm">
      <div className="p-6 flex flex-col gap-4">
        <p className="text-sm text-text-secondary">{ts('modal.assignDesc')}<span className="font-semibold text-text-primary">{member.name}</span></p>
        <div className="flex flex-col gap-2">
          {STAFF_ROLES_LIST.map((r) => (
            <button key={r.value} type="button" onClick={() => setSelectedRole(r.value)}
              className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-semibold transition-all cursor-pointer
                ${selectedRole === r.value
                  ? 'border-primary-500 bg-primary-500/10 text-primary-500'
                  : 'border-surface-border text-text-secondary hover:border-primary-500/50 hover:bg-surface-overlay'}`}>
              {r.label}
              {selectedRole === r.value && <Check size={16} strokeWidth={2.5} />}
            </button>
          ))}
        </div>
        <ModalFooter onCancel={onClose} cancelLabel={ts('modal.cancel')} submitLabel={ts('modal.confirm')}
          loading={isLoading} onSubmit={() => onSave(member.id, selectedRole)} />
      </div>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function StaffPage() {
  const { staff, pagination, isLoading, error, fetchStaff, createStaff, updateStaff, assignRole, deactivateStaff, activateStaff, clearError } = useStaffStore();
  const { t } = useLanguage();
  const ts = t('staff');
  const tCommon = t('common');
  usePageTitle('staff');

  const [filterRole, setFilterRole] = useState<RoleName | 'all'>('all');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [editMember, setEditMember] = useState<StaffMember | null>(null);
  const [assignMember, setAssignMember] = useState<StaffMember | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchStaff({}).catch(() => {}); }, [fetchStaff]);
  useEffect(() => () => clearError(), [clearError]);

  const filtered = staff.filter((m) => {
    const roleOk = filterRole === 'all' || m.role.name === filterRole;
    const statusOk = filterActive === 'all' || (filterActive === 'active' ? m.isActive : !m.isActive);
    const searchOk = !searchQuery || m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.email.toLowerCase().includes(searchQuery.toLowerCase());
    return roleOk && statusOk && searchOk;
  });

  const stats = {
    total:   staff.length,
    active:  staff.filter((s) => s.isActive).length,
    admin:   staff.filter((s) => s.role.name === ROLES.ADMIN).length,
    manager: staff.filter((s) => s.role.name === ROLES.MANAGER).length,
    trainer: staff.filter((s) => s.role.name === ROLES.TRAINER).length,
    staff:   staff.filter((s) => s.role.name === ROLES.STAFF).length,
  };


  const handleCreate = useCallback(async (payload: CreateStaffPayload) => {
    setSaving(true);
    try {
      await createStaff(payload);
      toast.success(ts('toast.addSuccess'));
      setCreateOpen(false);
    } catch { toast.error(ts('toast.error')); }
    finally { setSaving(false); }
  }, [createStaff, ts]);

  const handleEdit = useCallback(async (id: string, payload: UpdateStaffPayload) => {
    setSaving(true);
    try {
      await updateStaff(id, payload);
      toast.success(ts('toast.editSuccess'));
      setEditMember(null);
    } catch { toast.error(ts('toast.error')); }
    finally { setSaving(false); }
  }, [updateStaff, ts]);

  const handleAssignRole = useCallback(async (id: string, roleName: RoleName) => {
    setSaving(true);
    try {
      await assignRole(id, { roleName });
      toast.success(ts('toast.assignSuccess'));
      setAssignMember(null);
    } catch { toast.error(ts('toast.assignError')); }
    finally { setSaving(false); }
  }, [assignRole, ts]);

  const handleToggle = useCallback(async (member: StaffMember) => {
    setActingId(member.id);
    try {
      if (member.isActive) {
        await deactivateStaff(member.id);
        toast.success(ts('toast.deactivateSuccess'));
      } else {
        await activateStaff(member.id);
        toast.success(ts('toast.activateSuccess'));
      }
    } catch (err) {
      toast.error(getApiMessage(err) || ts('toast.error'));
    } finally { setActingId(null); }
  }, [deactivateStaff, activateStaff, ts]);

  return (
    <>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto">
        {/* Page header */}
        <div className="flex items-center justify-between gap-4">
          <PageHeader
            title={ts('title')}
            subtitle={ts('subtitle')}
          />
          <AddButton onClick={() => setCreateOpen(true)} label={ts('addStaff')} />
        </div>

        {/* Error banner */}
        {error && <Alert onDismiss={clearError}>{error}</Alert>}

        {/* Stats */}
        <StatsGrid
          isLoading={isLoading}
          items={[
            { label: ts('stats.total'), value: stats.total, color: 'primary' },
            { label: ts('stats.active'), value: stats.active, color: 'success' },
            { label: ts('stats.admin'), value: stats.admin, color: 'danger' },
            { label: ts('stats.manager'), value: stats.manager, color: 'primary' },
            { label: ts('stats.staff'), value: stats.staff, color: 'secondary' },
            { label: ts('stats.trainer'), value: stats.trainer, color: 'warning' },
          ]}
        />

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={ts('filters.searchPlaceholder')}
              className="pl-9 pr-4 py-2 rounded-xl border border-surface-border bg-surface-raised text-sm text-text-primary placeholder-text-muted outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all w-52"
            />
          </div>

          {/* Role filter */}
          <SegmentedControl<RoleName | 'all'> value={filterRole} onChange={setFilterRole} options={[
            { value: 'all',         label: tCommon('filters.all') },
            { value: ROLES.ADMIN,   label: ts('roles.admin') },
            { value: ROLES.MANAGER, label: ts('roles.manager') },
            { value: ROLES.STAFF,   label: ts('roles.staff') },
            { value: ROLES.TRAINER, label: ts('stats.hlv') },
          ]} />

          {/* Status filter */}
          <SegmentedControl<'all' | 'active' | 'inactive'> value={filterActive} onChange={setFilterActive} options={[
            { value: 'all',      label: tCommon('filters.all') },
            { value: 'active',   label: ts('card.active') },
            { value: 'inactive', label: ts('card.inactive') },
          ]} />

          <span className="ml-auto text-xs text-text-muted">
            {ts('filters.count', '{{count}} nhân viên').replace('{{count}}', filtered.length.toString())}
          </span>
        </div>

        {/* Skeleton loading */}
        {isLoading && staff.length === 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-surface-base border border-surface-border rounded-2xl p-5 flex flex-col gap-4 animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-surface-overlay shrink-0" />
                  <div className="flex-1 flex flex-col gap-2"><div className="h-4 w-3/4 bg-surface-overlay rounded" /><div className="h-3 w-full bg-surface-overlay rounded" /></div>
                </div>
                <div className="h-6 w-24 bg-surface-overlay rounded-full" />
                <div className="h-10 w-full bg-surface-overlay rounded-xl" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <span className="text-5xl">🧑‍💼</span>
            <div>
              <p className="text-base font-semibold text-text-primary">{ts('empty.title')}</p>
              <p className="text-sm text-text-muted mt-1">
                {searchQuery || filterRole !== 'all' || filterActive !== 'all' ? ts('empty.noResults') : ts('empty.description')}
              </p>
            </div>
          </div>
        )}

        {/* Staff grid */}
        {!isLoading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((member) => (
              <StaffCard key={member.id} member={member}
                onEdit={setEditMember}
                onToggle={handleToggle}
                onAssignRole={setAssignMember}
                actingId={actingId}
              />
            ))}
          </div>
        )}

        {/* Pagination info */}
        {pagination && pagination.totalPages > 1 && (
          <p className="text-center text-xs text-text-muted">
            {ts('pagination')
              .replace('{{current}}', pagination.currentPage.toString())
              .replace('{{total}}', pagination.totalPages.toString())
              .replace('{{count}}', pagination.total.toString())}
          </p>
        )}
      </div>

      <CreateStaffModal open={createOpen} onClose={() => setCreateOpen(false)} onSave={handleCreate} isLoading={saving} />
      <EditStaffModal open={!!editMember} member={editMember} onClose={() => setEditMember(null)} onSave={handleEdit} isLoading={saving} />
      <AssignRoleModal open={!!assignMember} member={assignMember} onClose={() => setAssignMember(null)} onSave={handleAssignRole} isLoading={saving} />
    </>
  );
}

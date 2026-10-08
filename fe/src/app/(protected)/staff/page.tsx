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
import { ROLES, canManageRole } from '@/src/lib/roles';
import { useLanguage } from '@/src/components/providers/LanguageProvider';
import { usePageTitle } from '@/src/hooks/usePageTitle';
import Modal, { ModalFooter } from '@/src/components/ui/Modal';
import FormField, { Input } from '@/src/components/ui/FormField';
import Spinner from '@/src/components/ui/Spinner';
import { Eye, EyeOff, Check, Ban, BriefcaseBusiness, CheckCircle, Lock, Pencil, Search, Tag } from 'lucide-react';
import Alert from '@/src/components/ui/Alert';
import { getApiMessage } from '@/src/lib/errors';
import Badge from '@/src/components/ui/Badge';
import { ROLE_TONE } from '@/src/lib/statusTones';
import SegmentedControl from '@/src/components/ui/SegmentedControl';
import { useFormat } from '@/src/hooks/useFormat';
import { useAuth } from '@/src/hooks/useAuth';
import Pagination from '@/src/components/ui/Pagination';
import EmptyState from '@/src/components/ui/EmptyState';
import { TableSkeleton } from '@/src/components/ui/Skeleton';

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

// Staff lists are small: load them all once, then filter / paginate in the browser so the stats stay exact
const STAFF_FETCH_LIMIT = 500;
const PAGE_SIZE = 10;

const STAFF_ROLES: RoleName[] = [ROLES.ADMIN, ROLES.MANAGER, ROLES.TRAINER, ROLES.STAFF];

/** Roles the current user may assign — non-admins can't grant admin / manager (the API enforces it too) */
function useAssignableRoles() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const ts = t('staff');
  return STAFF_ROLES
    .filter((role) => canManageRole(user?.role?.name, role))
    .map((role) => ({ value: role, label: ts(`stats.${role}`) }));
}

// ─── Staff Row ────────────────────────────────────────────────────────────────
function StaffRow({
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
  const { t } = useLanguage();
  const ts = t('staff');
  const fmt = useFormat();
  const { user } = useAuth();
  // Only admins may touch admin / manager accounts; nobody changes their own role or status here
  const canManage = canManageRole(user?.role?.name, member.role.name);
  const isSelf = member.id === user?._id;

  return (
    <tr className={`border-b border-surface-border hover:bg-surface-raised transition-colors ${member.isActive ? '' : 'opacity-60'}`}>
      {/* Staff */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${getAvatarColor(member.id)} flex items-center justify-center text-white font-bold text-xs shrink-0`}>
            {member.initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text-primary truncate flex items-center gap-2">
              {member.name}
              {isSelf && <Badge tone="primary">{ts('you')}</Badge>}
            </p>
            <p className="text-xs text-text-muted truncate">{member.email}</p>
          </div>
        </div>
      </td>
      {/* Role */}
      <td className="px-4 py-3">
        <Badge tone={ROLE_TONE[member.role.name] ?? 'neutral'}>{ts(`roles.${member.role.name}`, member.role.name)}</Badge>
      </td>
      {/* Status */}
      <td className="px-4 py-3">
        <Badge tone={member.isActive ? 'success' : 'neutral'} dot>
          {member.isActive ? ts('card.active') : ts('card.inactive')}
        </Badge>
      </td>
      {/* Created */}
      <td className="px-4 py-3 text-xs text-text-muted whitespace-nowrap">{fmt.date(member.createdAt)}</td>
      {/* Actions */}
      <td className="px-4 py-3">
        {!canManage ? (
          <span title={ts('card.adminOnly')} className="inline-flex p-1.5 text-text-muted">
            <Lock size={16} />
          </span>
        ) : isActing ? (
          <Spinner className="text-primary-500" />
        ) : (
          <div className="flex items-center gap-1">
            <button onClick={() => onEdit(member)} title={ts('card.edit')}
              className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-overlay transition-all cursor-pointer">
              <Pencil size={16} />
            </button>
            {!isSelf && (
              <>
                <button onClick={() => onAssignRole(member)} title={ts('card.assignRole')}
                  className="p-1.5 rounded-lg text-primary-500 hover:bg-primary-500/10 transition-all cursor-pointer">
                  <Tag size={16} />
                </button>
                <button onClick={() => onToggle(member)} title={member.isActive ? ts('card.deactivate') : ts('card.activate')}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${member.isActive ? 'text-danger-500 hover:bg-danger-500/10' : 'text-success-500 hover:bg-success-500/10'}`}>
                  {member.isActive ? <Ban size={16} /> : <CheckCircle size={16} />}
                </button>
              </>
            )}
          </div>
        )}
      </td>
    </tr>
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

  const STAFF_ROLES_LIST = useAssignableRoles();

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
            placeholder={ts('modal.namePlaceholder')} invalid={!!errors.name} />
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

  const STAFF_ROLES_LIST = useAssignableRoles();

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
  const { staff, isLoading, error, fetchStaff, createStaff, updateStaff, assignRole, deactivateStaff, activateStaff, clearError } = useStaffStore();
  const { t } = useLanguage();
  const ts = t('staff');
  const tCommon = t('common');
  usePageTitle('staff');

  const [filterRole, setFilterRole] = useState<RoleName | 'all'>('all');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  // Any filter change goes back to the first page
  const onFilter = <T,>(setter: (value: T) => void) => (value: T) => { setter(value); setPage(1); };

  const [createOpen, setCreateOpen] = useState(false);
  const [editMember, setEditMember] = useState<StaffMember | null>(null);
  const [assignMember, setAssignMember] = useState<StaffMember | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchStaff({ limit: STAFF_FETCH_LIMIT }).catch(() => {}); }, [fetchStaff]);
  useEffect(() => () => clearError(), [clearError]);

  const filtered = staff.filter((m) => {
    const roleOk = filterRole === 'all' || m.role.name === filterRole;
    const statusOk = filterActive === 'all' || (filterActive === 'active' ? m.isActive : !m.isActive);
    const searchOk = !searchQuery || m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.email.toLowerCase().includes(searchQuery.toLowerCase());
    return roleOk && statusOk && searchOk;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

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
            <input type="text" value={searchQuery} onChange={(e) => onFilter(setSearchQuery)(e.target.value)}
              placeholder={ts('filters.searchPlaceholder')}
              className="pl-9 pr-4 py-2 rounded-xl border border-surface-border bg-surface-raised text-sm text-text-primary placeholder-text-muted outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all w-52"
            />
          </div>

          {/* Role filter */}
          <SegmentedControl<RoleName | 'all'> value={filterRole} onChange={onFilter(setFilterRole)} options={[
            { value: 'all',         label: tCommon('filters.all') },
            { value: ROLES.ADMIN,   label: ts('roles.admin') },
            { value: ROLES.MANAGER, label: ts('roles.manager') },
            { value: ROLES.STAFF,   label: ts('roles.staff') },
            { value: ROLES.TRAINER, label: ts('stats.hlv') },
          ]} />

          {/* Status filter */}
          <SegmentedControl<'all' | 'active' | 'inactive'> value={filterActive} onChange={onFilter(setFilterActive)} options={[
            { value: 'all',      label: tCommon('filters.all') },
            { value: 'active',   label: ts('card.active') },
            { value: 'inactive', label: ts('card.inactive') },
          ]} />

          <span className="ml-auto text-xs text-text-muted">
            {ts('filters.count').replace('{{count}}', filtered.length.toString())}
          </span>
        </div>

        {/* Table */}
        <div className="bg-surface-base border border-surface-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-border bg-surface-raised">
                  {[ts('table.staff'), ts('table.role'), ts('table.status'), ts('table.createdAt'), ts('table.actions')].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading && staff.length === 0
                  ? <TableSkeleton rows={6} cols={5} />
                  : filtered.length === 0
                  ? (
                    <tr><td colSpan={5}>
                      <EmptyState icon={<BriefcaseBusiness size={40} />} title={ts('empty.title')}
                        description={searchQuery || filterRole !== 'all' || filterActive !== 'all' ? ts('empty.noResults') : ts('empty.description')} />
                    </td></tr>
                  )
                  : pageItems.map((member) => (
                    <StaffRow key={member.id} member={member}
                      onEdit={setEditMember}
                      onToggle={handleToggle}
                      onAssignRole={setAssignMember}
                      actingId={actingId}
                    />
                  ))}
              </tbody>
            </table>
          </div>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage}
            summary={ts('filters.count').replace('{{count}}', filtered.length.toString())} />
        </div>
      </div>

      <CreateStaffModal open={createOpen} onClose={() => setCreateOpen(false)} onSave={handleCreate} isLoading={saving} />
      <EditStaffModal open={!!editMember} member={editMember} onClose={() => setEditMember(null)} onSave={handleEdit} isLoading={saving} />
      <AssignRoleModal open={!!assignMember} member={assignMember} onClose={() => setAssignMember(null)} onSave={handleAssignRole} isLoading={saving} />
    </>
  );
}

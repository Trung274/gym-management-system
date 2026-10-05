'use client';

import { useEffect, useState } from 'react';
import { Search, UserCog, KeyRound, Ban, CheckCircle, Check } from 'lucide-react';
import { useUserStore } from '@/src/stores/userStore';
import { useAuth } from '@/src/hooks/useAuth';
import { useLanguage } from '@/src/components/providers/LanguageProvider';
import { usePageTitle } from '@/src/hooks/usePageTitle';
import { useFormat } from '@/src/hooks/useFormat';
import { toast } from '@/src/utils/toast';
import { getApiMessage } from '@/src/lib/errors';
import { ROLE_ORDER, ACCOUNT_ROLES, PROFILE_ROLES, type RoleName } from '@/src/lib/roles';
import { ROLE_TONE } from '@/src/lib/statusTones';
import type { UserAccount, UserQueryParams } from '@/src/types/user.types';
import PageHeader from '@/src/components/ui/PageHeader';
import Alert from '@/src/components/ui/Alert';
import Badge from '@/src/components/ui/Badge';
import SegmentedControl from '@/src/components/ui/SegmentedControl';
import Modal, { ModalFooter } from '@/src/components/ui/Modal';
import FormField, { Input, Select, inputClass } from '@/src/components/ui/FormField';
import ConfirmDialog from '@/src/components/ui/ConfirmDialog';
import EmptyState from '@/src/components/ui/EmptyState';
import Spinner from '@/src/components/ui/Spinner';
import Pagination from '@/src/components/ui/Pagination';
import { TableSkeleton } from '@/src/components/ui/Skeleton';

type StatusFilter = 'all' | 'active' | 'inactive';

const PAGE_SIZE = 10;

// ─── User Row ─────────────────────────────────────────────────────────────────
function UserRow({ account, isSelf, isActing, onChangeRole, onResetPassword, onToggleStatus }: {
  account: UserAccount;
  isSelf: boolean;
  isActing: boolean;
  onChangeRole: (a: UserAccount) => void;
  onResetPassword: (a: UserAccount) => void;
  onToggleStatus: (a: UserAccount) => void;
}) {
  const { t } = useLanguage();
  const tu = t('users');
  const tCommon = t('common');
  const fmt = useFormat();
  // Member / trainer accounts are tied to a profile — their role is changed from those pages
  const hasProfile = PROFILE_ROLES.includes(account.role.name);

  return (
    <tr className={`border-b border-surface-border hover:bg-surface-raised transition-colors ${account.isActive ? '' : 'opacity-60'}`}>
      {/* Account */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-500/15 text-primary-500 flex items-center justify-center text-xs font-bold shrink-0">
            {account.initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text-primary truncate flex items-center gap-2">
              {account.name}
              {isSelf && <Badge tone="primary">{tu('you')}</Badge>}
            </p>
            <p className="text-xs text-text-muted truncate">{account.email}</p>
          </div>
        </div>
      </td>
      {/* Role */}
      <td className="px-4 py-3">
        <span title={hasProfile ? tu('profileManaged') : undefined}>
          <Badge tone={ROLE_TONE[account.role.name] ?? 'neutral'}>{tCommon(`roles.${account.role.name}`, account.role.name)}</Badge>
        </span>
      </td>
      {/* Status */}
      <td className="px-4 py-3">
        <Badge tone={account.isActive ? 'success' : 'neutral'} dot>
          {account.isActive ? tu('status.active') : tu('status.inactive')}
        </Badge>
      </td>
      {/* Created */}
      <td className="px-4 py-3 text-xs text-text-muted whitespace-nowrap">{fmt.date(account.createdAt)}</td>
      {/* Actions — nothing on your own account */}
      <td className="px-4 py-3">
        {!isSelf && (
          <div className="flex items-center gap-1">
            {isActing ? (
              <Spinner className="text-primary-500" />
            ) : (
              <>
                {!hasProfile && (
                  <button onClick={() => onChangeRole(account)} title={tu('actions.changeRole')}
                    className="p-1.5 rounded-lg text-primary-500 hover:bg-primary-500/10 transition-all cursor-pointer">
                    <UserCog size={16} />
                  </button>
                )}
                <button onClick={() => onResetPassword(account)} title={tu('actions.resetPassword')}
                  className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-overlay transition-all cursor-pointer">
                  <KeyRound size={16} />
                </button>
                <button onClick={() => onToggleStatus(account)} title={account.isActive ? tu('actions.deactivate') : tu('actions.activate')}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${account.isActive ? 'text-danger-500 hover:bg-danger-500/10' : 'text-success-500 hover:bg-success-500/10'}`}>
                  {account.isActive ? <Ban size={16} /> : <CheckCircle size={16} />}
                </button>
              </>
            )}
          </div>
        )}
      </td>
    </tr>
  );
}

// ─── Change Role Modal ────────────────────────────────────────────────────────
function ChangeRoleModal({ account, onClose, onSave, isLoading }: {
  account: UserAccount;
  onClose: () => void;
  onSave: (roleName: RoleName) => void;
  isLoading: boolean;
}) {
  const { t } = useLanguage();
  const tu = t('users');
  const tCommon = t('common');
  const [selected, setSelected] = useState<RoleName>(account.role.name);

  return (
    <Modal onClose={onClose} title={tu('roleModal.title')} size="sm">
      <div className="p-6 flex flex-col gap-4">
        <p className="text-sm text-text-secondary">
          {tu('roleModal.description')} <span className="font-semibold text-text-primary">{account.name}</span>
        </p>
        <div className="flex flex-col gap-2">
          {ACCOUNT_ROLES.map((role) => (
            <button key={role} type="button" onClick={() => setSelected(role)}
              className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-semibold transition-all cursor-pointer
                ${selected === role
                  ? 'border-primary-500 bg-primary-500/10 text-primary-500'
                  : 'border-surface-border text-text-secondary hover:border-primary-500/50 hover:bg-surface-overlay'}`}>
              {tCommon(`roles.${role}`)}
              {selected === role && <Check size={16} strokeWidth={2.5} />}
            </button>
          ))}
        </div>
        <ModalFooter onCancel={onClose} cancelLabel={tCommon('actions.cancel')} submitLabel={tu('roleModal.submit')}
          loading={isLoading} disabled={selected === account.role.name} onSubmit={() => onSave(selected)} />
      </div>
    </Modal>
  );
}

// ─── Reset Password Modal ─────────────────────────────────────────────────────
function ResetPasswordModal({ account, onClose, onSave, isLoading }: {
  account: UserAccount;
  onClose: () => void;
  onSave: (password: string) => void;
  isLoading: boolean;
}) {
  const { t } = useLanguage();
  const tu = t('users');
  const tCommon = t('common');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (password.length < 6) next.password = tu('validation.passwordMin');
    else if (password !== confirm) next.confirm = tu('validation.passwordMismatch');
    setErrors(next);
    if (Object.keys(next).length === 0) onSave(password);
  };

  return (
    <Modal onClose={onClose} title={tu('passwordModal.title')}>
      <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
        <div className="p-3 rounded-xl bg-surface-raised border border-surface-border text-sm">
          <p className="text-xs text-text-muted">{tu('passwordModal.account')}</p>
          <p className="font-semibold text-text-primary">{account.name}</p>
          <p className="text-xs text-text-muted">{account.email}</p>
        </div>
        <FormField label={tu('passwordModal.newPassword')} required error={errors.password}>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password"
            placeholder={tu('passwordModal.placeholder')} invalid={!!errors.password} />
        </FormField>
        <FormField label={tu('passwordModal.confirmPassword')} required error={errors.confirm}>
          <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password"
            invalid={!!errors.confirm} />
        </FormField>
        <Alert tone="info">{tu('passwordModal.hint')}</Alert>
        <ModalFooter onCancel={onClose} cancelLabel={tCommon('actions.cancel')} submitLabel={tu('passwordModal.submit')} loading={isLoading} />
      </form>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function UsersPage() {
  const { t } = useLanguage();
  const tu = t('users');
  const tCommon = t('common');
  usePageTitle('users');

  const { user: currentUser } = useAuth();
  const { users, pagination, isLoading, error, fetchUsers, setStatus, changeRole, resetPassword, clearError } = useUserStore();

  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<RoleName | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('all');
  const [roleTarget, setRoleTarget] = useState<UserAccount | null>(null);
  const [passwordTarget, setPasswordTarget] = useState<UserAccount | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<UserAccount | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Send cleared filters as undefined so nothing stale is carried over
  const buildParams = (page: number): UserQueryParams => ({
    page,
    limit: PAGE_SIZE,
    search: search.trim() || undefined,
    role: filterRole !== 'all' ? filterRole : undefined,
    isActive: filterStatus === 'all' ? undefined : filterStatus === 'active',
  });

  // Fetch on filter change (debounce search)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers(buildParams(1)).catch(() => {});
    }, search ? 350 : 0);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filterRole, filterStatus]);

  useEffect(() => () => clearError(), [clearError]);

  const handlePageChange = (page: number) => {
    fetchUsers(buildParams(page)).catch(() => {});
  };

  const updateStatus = async (account: UserAccount, isActive: boolean) => {
    setActingId(account.id);
    try {
      await setStatus(account.id, isActive);
      toast.success(isActive ? tu('toast.activateSuccess') : tu('toast.deactivateSuccess'));
      setDeactivateTarget(null);
    } catch (err) {
      toast.error(getApiMessage(err) || tu('toast.error'));
    } finally { setActingId(null); }
  };

  const handleToggleStatus = (account: UserAccount) => {
    // Deactivating signs the user out everywhere — confirm first; reactivating is harmless
    if (account.isActive) setDeactivateTarget(account);
    else updateStatus(account, true);
  };

  const handleChangeRole = async (roleName: RoleName) => {
    if (!roleTarget) return;
    setSaving(true);
    try {
      await changeRole(roleTarget.id, roleName);
      toast.success(tu('toast.roleSuccess'));
      setRoleTarget(null);
    } catch (err) {
      toast.error(getApiMessage(err) || tu('toast.error'));
    } finally { setSaving(false); }
  };

  const handleResetPassword = async (password: string) => {
    if (!passwordTarget) return;
    setSaving(true);
    try {
      await resetPassword(passwordTarget.id, password);
      toast.success(tu('toast.passwordSuccess'));
      setPasswordTarget(null);
    } catch (err) {
      toast.error(getApiMessage(err) || tu('toast.error'));
    } finally { setSaving(false); }
  };

  return (
    <>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto">
        <PageHeader title={tu('title')} subtitle={tu('subtitle')} />

        {error && <Alert onDismiss={clearError}>{error}</Alert>}

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-56">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder={tu('filters.searchPlaceholder')} className={`${inputClass()} pl-9`} />
          </div>
          <div className="w-44">
            <Select value={filterRole} onChange={(e) => setFilterRole(e.target.value as RoleName | 'all')}>
              <option value="all">{tu('filters.allRoles')}</option>
              {ROLE_ORDER.map((role) => <option key={role} value={role}>{tCommon(`roles.${role}`)}</option>)}
            </Select>
          </div>
          <SegmentedControl<StatusFilter> value={filterStatus} onChange={setFilterStatus} options={[
            { value: 'all',      label: tu('filters.allStatus') },
            { value: 'active',   label: tu('filters.active') },
            { value: 'inactive', label: tu('filters.inactive') },
          ]} />
          <span className="ml-auto text-xs text-text-muted">
            {tu('filters.count').replace('{{count}}', String(pagination?.total ?? 0))}
          </span>
        </div>

        {/* Table */}
        <div className="bg-surface-base border border-surface-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-border bg-surface-raised">
                  {[tu('table.user'), tu('table.role'), tu('table.status'), tu('table.createdAt'), tu('table.actions')].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading && users.length === 0
                  ? <TableSkeleton rows={5} cols={5} />
                  : users.length === 0
                  ? <tr><td colSpan={5}><EmptyState icon={<UserCog size={40} />} title={tu('empty.title')} description={tu('empty.description')} /></td></tr>
                  : users.map((account) => (
                    <UserRow key={account.id} account={account}
                      isSelf={account.id === currentUser?._id}
                      isActing={actingId === account.id}
                      onChangeRole={setRoleTarget}
                      onResetPassword={setPasswordTarget}
                      onToggleStatus={handleToggleStatus} />
                  ))}
              </tbody>
            </table>
          </div>
          {pagination && (
            <Pagination currentPage={pagination.currentPage} totalPages={pagination.totalPages}
              summary={tu('filters.count').replace('{{count}}', String(pagination.total))} onPageChange={handlePageChange} />
          )}
        </div>
      </div>

      {roleTarget && (
        <ChangeRoleModal account={roleTarget} onClose={() => setRoleTarget(null)} onSave={handleChangeRole} isLoading={saving} />
      )}
      {passwordTarget && (
        <ResetPasswordModal account={passwordTarget} onClose={() => setPasswordTarget(null)} onSave={handleResetPassword} isLoading={saving} />
      )}
      {deactivateTarget && (
        <ConfirmDialog
          title={tu('deactivateDialog.title')}
          message={<>
            <p>{tu('deactivateDialog.message').replace('{{name}}', deactivateTarget.name)}</p>
            <p className="text-xs text-text-muted mt-1">{tu('deactivateDialog.note')}</p>
          </>}
          confirmLabel={tu('deactivateDialog.confirm')}
          cancelLabel={tCommon('actions.cancel')}
          onConfirm={() => updateStatus(deactivateTarget, false)}
          onClose={() => setDeactivateTarget(null)}
          loading={actingId === deactivateTarget.id}
        />
      )}
    </>
  );
}

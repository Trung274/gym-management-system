'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useRoleStore } from '@/src/stores/roleStore';
import { useLanguage } from '@/src/components/providers/LanguageProvider';
import { usePageTitle } from '@/src/hooks/usePageTitle';
import { toast } from '@/src/utils/toast';
import { getApiMessage } from '@/src/lib/errors';
import { ROLES, ROLE_ORDER } from '@/src/lib/roles';
import { ROLE_TONE } from '@/src/lib/statusTones';
import type { PermissionItem, RoleWithPermissions } from '@/src/types/role.types';
import PageHeader from '@/src/components/ui/PageHeader';
import Alert from '@/src/components/ui/Alert';
import Badge from '@/src/components/ui/Badge';
import Button from '@/src/components/ui/Button';
import EmptyState from '@/src/components/ui/EmptyState';
import { TableSkeleton } from '@/src/components/ui/Skeleton';

// ─── Constants ────────────────────────────────────────────────────────────────
// Not shown in the matrix: users / roles / permissions are admin-only by design (the API checks the
// admin role), and profile:* is not enforced anywhere. Saving keeps a role's hidden permissions as they are.
const HIDDEN_RESOURCES = ['users', 'roles', 'permissions', 'profile'];

const RESOURCE_ORDER = ['dashboard', 'members', 'checkins', 'bookings', 'classes', 'trainers', 'plans', 'equipment', 'staff', 'gym'];
const ACTION_ORDER = ['view', 'list', 'read', 'create', 'update', 'status', 'checkin', 'record', 'manage', 'toggle', 'deactivate', 'delete'];

/** Position in a preferred order; unknown keys go last */
const rank = (order: readonly string[], key: string) => {
  const i = order.indexOf(key);
  return i === -1 ? order.length : i;
};

const sameSet = (a: Set<string>, b: Set<string>) => a.size === b.size && [...a].every((id) => b.has(id));

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PermissionsPage() {
  const { t } = useLanguage();
  const tp = t('permissions');
  const tCommon = t('common');
  usePageTitle('permissions');

  const { roles, permissions, isLoading, error, fetchAll, saveRolePermissions, clearError } = useRoleStore();
  // Unsaved edits only: roleId → full set of visible permission ids
  const [edits, setEdits] = useState<Record<string, Set<string>>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchAll().catch(() => {}); }, [fetchAll]);
  useEffect(() => () => clearError(), [clearError]);

  const visibleIds = useMemo(
    () => new Set(permissions.filter((p) => !HIDDEN_RESOURCES.includes(p.resource)).map((p) => p.id)),
    [permissions]
  );

  // Rows grouped by module, in a stable reading order
  const groups = useMemo(() => {
    const byResource = new Map<string, PermissionItem[]>();
    for (const p of permissions) {
      if (HIDDEN_RESOURCES.includes(p.resource)) continue;
      byResource.set(p.resource, [...(byResource.get(p.resource) ?? []), p]);
    }
    return [...byResource.entries()]
      .sort(([a], [b]) => rank(RESOURCE_ORDER, a) - rank(RESOURCE_ORDER, b) || a.localeCompare(b))
      .map(([resource, items]) => ({
        resource,
        items: items.sort((a, b) => rank(ACTION_ORDER, a.action) - rank(ACTION_ORDER, b.action) || a.action.localeCompare(b.action)),
      }));
  }, [permissions]);

  const orderedRoles = useMemo(
    () => [...roles].sort((a, b) => rank(ROLE_ORDER, a.name) - rank(ROLE_ORDER, b.name)),
    [roles]
  );

  const savedSet = (role: RoleWithPermissions) => new Set(role.permissionIds.filter((id) => visibleIds.has(id)));
  const currentSet = (role: RoleWithPermissions) => edits[role.id] ?? savedSet(role);
  const changedRoles = orderedRoles.filter((role) => edits[role.id] && !sameSet(edits[role.id], savedSet(role)));

  const toggle = (role: RoleWithPermissions, permissionId: string) => {
    setEdits((prev) => {
      const next = new Set(prev[role.id] ?? savedSet(role));
      if (next.has(permissionId)) next.delete(permissionId);
      else next.add(permissionId);
      return { ...prev, [role.id]: next };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    const results = await Promise.allSettled(changedRoles.map(async (role) => {
      // Keep the permissions this page doesn't show
      const hidden = role.permissionIds.filter((id) => !visibleIds.has(id));
      await saveRolePermissions(role.id, [...hidden, ...edits[role.id]]);
      return role.id;
    }));
    const savedIds = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    setEdits((prev) => Object.fromEntries(Object.entries(prev).filter(([roleId]) => !savedIds.includes(roleId))));

    const failure = results.find((r): r is PromiseRejectedResult => r.status === 'rejected');
    if (failure) toast.error(getApiMessage(failure.reason) || tp('toast.saveError'));
    else toast.success(tp('toast.saveSuccess'));
    setSaving(false);
  };

  const columnCount = orderedRoles.length + 1;

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <PageHeader title={tp('title')} subtitle={tp('subtitle')} />

      {error && <Alert onDismiss={clearError}>{error}</Alert>}
      <Alert tone="info">{tp('note')}</Alert>

      <div className="bg-surface-base border border-surface-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-border bg-surface-raised">
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider whitespace-nowrap min-w-[220px]">
                  {tp('table.permission')}
                </th>
                {orderedRoles.map((role) => (
                  <th key={role.id} className="px-3 py-3 text-center align-top">
                    <div className="flex flex-col items-center gap-1">
                      <Badge tone={ROLE_TONE[role.name] ?? 'neutral'}>{tCommon(`roles.${role.name}`, role.name)}</Badge>
                      {role.name === ROLES.ADMIN && (
                        <span className="text-[11px] font-medium text-text-muted whitespace-nowrap">{tp('table.fullAccess')}</span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && roles.length === 0 ? (
                <TableSkeleton rows={8} cols={6} />
              ) : groups.length === 0 ? (
                <tr><td colSpan={columnCount}><EmptyState icon={<ShieldCheck size={40} />} title={tp('empty')} /></td></tr>
              ) : (
                groups.map((group) => (
                  <Fragment key={group.resource}>
                    <tr className="border-b border-surface-border bg-surface-raised/60">
                      <td colSpan={columnCount} className="px-4 py-2 text-xs font-bold text-text-primary uppercase tracking-wider">
                        {tp(`resources.${group.resource}`, group.resource)}
                      </td>
                    </tr>
                    {group.items.map((perm) => (
                      <tr key={perm.id} className="border-b border-surface-border last:border-0 hover:bg-surface-raised transition-colors">
                        <td className="px-4 py-2.5">
                          <p className="text-sm text-text-primary">{tp(`actions.${perm.action}`, perm.action)}</p>
                          <p className="text-[11px] text-text-muted font-mono">{perm.resource}:{perm.action}</p>
                        </td>
                        {orderedRoles.map((role) => {
                          // Admin bypasses every permission check — shown as granted, not editable
                          const isAdminColumn = role.name === ROLES.ADMIN;
                          const checked = isAdminColumn || currentSet(role).has(perm.id);
                          const changed = !isAdminColumn && checked !== savedSet(role).has(perm.id);
                          return (
                            <td key={role.id} className={`px-3 py-2.5 text-center transition-colors ${changed ? 'bg-warning-500/10' : ''}`}>
                              <input
                                type="checkbox"
                                checked={checked}
                                disabled={isAdminColumn || saving}
                                onChange={() => toggle(role, perm.id)}
                                aria-label={`${tCommon(`roles.${role.name}`, role.name)} — ${perm.resource}:${perm.action}`}
                                className="w-4 h-4 accent-primary-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-text-muted">{tp('adminNote')}</p>

      {/* Save bar — only while there are unsaved changes */}
      {changedRoles.length > 0 && (
        <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-2xl border border-surface-border bg-surface-base shadow-lg">
          <p className="text-sm font-medium text-text-primary">
            {tp('unsaved').replace('{{count}}', String(changedRoles.length))}
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setEdits({})} disabled={saving}>{tp('discard')}</Button>
            <Button onClick={handleSave} loading={saving}>{tp('save')}</Button>
          </div>
        </div>
      )}
    </div>
  );
}

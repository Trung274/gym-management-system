import { useAuth } from '@/src/hooks/useAuth';
import { hasPermission, hasAnyPermission, hasRole, hasAnyRole } from '@/src/lib/auth';
import { ReactNode } from 'react';

interface ProtectedComponentProps {
  children: ReactNode;
  fallback?: ReactNode;
  // Permission-based protection
  requiredPermission?: { resource: string; action: string };
  requiredAnyPermissions?: Array<{ resource: string; action: string }>;
  // Role-based protection
  requiredRole?: string;
  requiredAnyRoles?: string[];
}

/**
 * Component wrapper để hiển thị nội dung dựa trên permissions/roles
 * 
 * Usage:
 * <ProtectedComponent requiredPermission={{ resource: 'users', action: 'delete' }}>
 *   <DeleteButton />
 * </ProtectedComponent>
 */
export default function ProtectedComponent({
  children,
  fallback = null,
  requiredPermission,
  requiredAnyPermissions,
  requiredRole,
  requiredAnyRoles,
}: ProtectedComponentProps) {
  const { user } = useAuth();

  // Check permission-based access
  if (requiredPermission) {
    const hasAccess = hasPermission(
      user,
      requiredPermission.resource,
      requiredPermission.action
    );
    if (!hasAccess) return <>{fallback}</>;
  }

  if (requiredAnyPermissions) {
    const hasAccess = hasAnyPermission(user, requiredAnyPermissions);
    if (!hasAccess) return <>{fallback}</>;
  }

  // Check role-based access
  if (requiredRole) {
    const hasAccess = hasRole(user, requiredRole);
    if (!hasAccess) return <>{fallback}</>;
  }

  if (requiredAnyRoles) {
    const hasAccess = hasAnyRole(user, requiredAnyRoles);
    if (!hasAccess) return <>{fallback}</>;
  }

  return <>{children}</>;
}
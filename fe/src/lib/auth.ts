import { User } from '@/src/types/auth.types';

/**
 * Check if user has a specific permission
 */
export const hasPermission = (
  user: User | null,
  resource: string,
  action: string
): boolean => {
  if (!user || !user.role) return false;

  // Admin always has all permissions
  if (user.role.name === 'admin') return true;

  // Check if permission exists
  return user.role.permissions.some(
    (perm) => perm.resource === resource && perm.action === action
  );
};

/**
 * Check if user has any of the specified permissions
 */
export const hasAnyPermission = (
  user: User | null,
  permissions: Array<{ resource: string; action: string }>
): boolean => {
  if (!user || !user.role) return false;

  // Admin always has all permissions
  if (user.role.name === 'admin') return true;

  // Check if any permission exists
  return permissions.some((perm) =>
    user.role.permissions.some(
      (userPerm) =>
        userPerm.resource === perm.resource && userPerm.action === perm.action
    )
  );
};

/**
 * Check if user has all of the specified permissions
 */
export const hasAllPermissions = (
  user: User | null,
  permissions: Array<{ resource: string; action: string }>
): boolean => {
  if (!user || !user.role) return false;

  // Admin always has all permissions
  if (user.role.name === 'admin') return true;

  // Check if all permissions exist
  return permissions.every((perm) =>
    user.role.permissions.some(
      (userPerm) =>
        userPerm.resource === perm.resource && userPerm.action === perm.action
    )
  );
};

/**
 * Check if user has a specific role
 */
export const hasRole = (user: User | null, roleName: string): boolean => {
  if (!user || !user.role) return false;
  return user.role.name === roleName;
};

/**
 * Check if user has any of the specified roles
 */
export const hasAnyRole = (user: User | null, roleNames: string[]): boolean => {
  if (!user || !user.role) return false;
  return roleNames.includes(user.role.name);
};

/**
 * Get all permissions grouped by resource
 */
export const getGroupedPermissions = (user: User | null) => {
  if (!user || !user.role) return {};

  const grouped: Record<string, Array<{ action: string; description: string }>> = {};

  user.role.permissions.forEach((perm) => {
    if (!grouped[perm.resource]) {
      grouped[perm.resource] = [];
    }
    grouped[perm.resource].push({
      action: perm.action,
      description: perm.description,
    });
  });

  return grouped;
};

/**
 * Format date from ISO string
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Format datetime from ISO string
 */
export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Get initials from name
 */
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Get role badge color
 */
export const getRoleBadgeColor = (roleName: string) => {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    admin: {
      bg: 'bg-red-500/20',
      text: 'text-red-400',
      border: 'border-red-500/30',
    },
    user: {
      bg: 'bg-blue-500/20',
      text: 'text-blue-400',
      border: 'border-blue-500/30',
    },
    editor: {
      bg: 'bg-purple-500/20',
      text: 'text-purple-400',
      border: 'border-purple-500/30',
    },
  };

  return colors[roleName.toLowerCase()] || colors.user;
};
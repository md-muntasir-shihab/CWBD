import { useCallback } from 'react';
import { useAuth } from './useAuth';

/**
 * Module-level access control hook.
 * Checks user.permissionsV2 (merged team role + platform permissions) to determine
 * whether the current user can perform a given action on a given module.
 *
 * Superadmin always has access to everything.
 */
export function useModuleAccess() {
  const { user } = useAuth();

  const hasAccess = useCallback(
    (module: string, action: string = 'view'): boolean => {
      if (!user) return false;
      if (user.role === 'superadmin') return true;
      return !!user.permissionsV2?.[module]?.[action];
    },
    [user],
  );

  const hasAnyAccess = useCallback(
    (module: string): boolean => {
      if (!user) return false;
      if (user.role === 'superadmin') return true;
      const modPerms = user.permissionsV2?.[module];
      if (!modPerms) return false;
      return Object.values(modPerms).some(Boolean);
    },
    [user],
  );

  return { hasAccess, hasAnyAccess, user };
}

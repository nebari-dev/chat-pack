/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|-----------------------------------------------------------------------------*/
import {
  createContext, useContext
} from 'react';


/**
 * The permissions context.
 *
 * This context holds the set of permissions granted to the current user.
 */
export
const PermissionsContext = createContext<Set<string> | undefined>(undefined);


/**
 * A hook which returns the user's permissions.
 *
 * @returns The set of permissions granted to the current user.
 */
export
function usePermissions(): Set<string> {
  const permissions = useContext(PermissionsContext);
  if (permissions === undefined) {
    throw new Error('`usePermissions` must be called within a `PermissionsContext`');
  }
  return permissions;
}


/**
 * A hook which checks whether the user has a specific permission.
 *
 * @param permission - The permission to check.
 *
 * @returns `true` if the user has the permission, `false` otherwise.
 */
export
function useHasPermission(permission: string): boolean {
  const permissions = usePermissions();
  return permissions.has(permission);
}


/**
 * A hook which checks whether the user has all of the specified permissions.
 *
 * @param permissions - The permissions to check.
 *
 * @returns `true` if the user has all of the permissions, `false` otherwise.
 */
export
function useHasPermissions(permissions: readonly string[]): boolean {
  const perms = usePermissions();
  return permissions.every(p => perms.has(p));
}

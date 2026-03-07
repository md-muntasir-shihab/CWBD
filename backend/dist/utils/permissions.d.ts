import { IUserPermissions, UserRole } from '../models/User';
import { type PermissionAction, type PermissionModule } from '../security/permissionsMatrix';
export declare const ROLE_PERMISSION_PRESETS: Record<UserRole, IUserPermissions>;
export declare function resolvePermissions(role: UserRole, requested?: Partial<IUserPermissions>): IUserPermissions;
export declare function hasPermission(permissions: Partial<IUserPermissions> | undefined, key: keyof IUserPermissions): boolean;
export declare function resolvePermissionsV2(role: UserRole): Partial<Record<PermissionModule, Partial<Record<PermissionAction, boolean>>>>;
//# sourceMappingURL=permissions.d.ts.map
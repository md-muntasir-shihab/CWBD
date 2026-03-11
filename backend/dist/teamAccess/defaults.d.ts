export declare const TEAM_ACTIONS: readonly ["view", "create", "edit", "delete", "archive", "publish", "approve", "reject", "verify", "export", "import", "manage_settings", "manage_permissions", "manage_security", "manage_finance", "manage_users", "bulk_actions"];
export declare const TEAM_MODULES: readonly ["dashboard", "home_control", "universities", "news", "exams", "question_bank", "students", "student_groups", "subscriptions", "payments", "resources", "support", "notifications", "finance", "help_center", "security_center", "system_logs", "site_settings", "team_access_control"];
export type TeamModule = (typeof TEAM_MODULES)[number];
export type TeamAction = (typeof TEAM_ACTIONS)[number];
export type ModulePermissions = Record<string, Record<string, boolean>>;
export declare const DEFAULT_TEAM_ROLES: ({
    name: string;
    slug: string;
    description: string;
    isSystemRole: boolean;
    isActive: boolean;
    basePlatformRole: "superadmin";
    modulePermissions: ModulePermissions;
} | {
    name: string;
    slug: string;
    description: string;
    isSystemRole: boolean;
    isActive: boolean;
    basePlatformRole: "admin";
    modulePermissions: ModulePermissions;
} | {
    name: string;
    slug: string;
    description: string;
    isSystemRole: boolean;
    isActive: boolean;
    basePlatformRole: "moderator";
    modulePermissions: ModulePermissions;
} | {
    name: string;
    slug: string;
    description: string;
    isSystemRole: boolean;
    isActive: boolean;
    basePlatformRole: "editor";
    modulePermissions: ModulePermissions;
} | {
    name: string;
    slug: string;
    description: string;
    isSystemRole: boolean;
    isActive: boolean;
    basePlatformRole: "finance_agent";
    modulePermissions: ModulePermissions;
} | {
    name: string;
    slug: string;
    description: string;
    isSystemRole: boolean;
    isActive: boolean;
    basePlatformRole: "support_agent";
    modulePermissions: ModulePermissions;
} | {
    name: string;
    slug: string;
    description: string;
    isSystemRole: boolean;
    isActive: boolean;
    basePlatformRole: "viewer";
    modulePermissions: ModulePermissions;
})[];
//# sourceMappingURL=defaults.d.ts.map
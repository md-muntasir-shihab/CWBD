import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import AdminShell from './AdminShell';

export type AdminAllowedRole = 'superadmin' | 'admin' | 'moderator' | 'editor';

const DEFAULT_ALLOWED_ROLES: AdminAllowedRole[] = ['superadmin', 'admin', 'moderator', 'editor'];

type AdminGuardShellProps = {
    title: string;
    description?: string;
    children: ReactNode;
    allowedRoles?: AdminAllowedRole[];
};

export default function AdminGuardShell({
    title,
    description,
    children,
    allowedRoles = DEFAULT_ALLOWED_ROLES,
}: AdminGuardShellProps) {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return <div className="section-container py-16 text-sm text-text-muted dark:text-dark-text/70">Checking admin access...</div>;
    }

    if (!user) {
        return <Navigate to="/__cw_admin__/login" replace />;
    }

    if (!allowedRoles.includes(user.role as AdminAllowedRole)) {
        return <Navigate to="/__cw_admin__/access-denied" replace />;
    }

    return (
        <AdminShell title={title} description={description}>
            {children}
        </AdminShell>
    );
}

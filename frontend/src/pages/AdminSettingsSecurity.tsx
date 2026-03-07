import SecuritySettingsPanel from '../components/admin/SecuritySettingsPanel';
import AdminGuardShell from '../components/admin/AdminGuardShell';

export default function AdminSettingsSecurityPage() {
    return (
        <AdminGuardShell
            title="Security Center"
            description="Manage session, token, and authentication security settings."
            allowedRoles={['superadmin', 'admin']}
        >
            <SecuritySettingsPanel />
        </AdminGuardShell>
    );
}


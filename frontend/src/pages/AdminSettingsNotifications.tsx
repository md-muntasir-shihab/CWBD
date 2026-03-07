import AdminGuardShell from '../components/admin/AdminGuardShell';
import NotificationAutomationPanel from '../components/admin/NotificationAutomationPanel';

export default function AdminSettingsNotificationsPage() {
    return (
        <AdminGuardShell
            title="Notification Settings"
            description="Configure automation triggers and template text for student notifications."
        >
            <NotificationAutomationPanel />
        </AdminGuardShell>
    );
}

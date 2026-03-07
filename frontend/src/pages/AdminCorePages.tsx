import { useNavigate } from 'react-router-dom';
import AdminGuardShell from '../components/admin/AdminGuardShell';
import DashboardHome from '../components/admin/DashboardHome';
import UniversitiesPanel from '../components/admin/UniversitiesPanel';
import NewsPanel from '../components/admin/NewsPanel';
import QuestionBankPanel from '../components/admin/QuestionBankPanel';
import StudentManagementPanel from '../components/admin/StudentManagementPanel';
import FinancePanel from '../components/admin/FinancePanel';
import ResourcesPanel from '../components/admin/ResourcesPanel';
import SupportTicketsPanel from '../components/admin/SupportTicketsPanel';
import { routeFromDashboardActionTab } from '../routes/adminPaths';
import LegacyAdminDashboard from './AdminDashboard';
import StudentsListPage from './admin/students/StudentsListPage';
import StudentDetailPage from './admin/students/StudentDetailPage';
import StudentGroupsPageV2 from './admin/students/StudentGroupsPage';
import NotificationCenterPage from './admin/notifications/NotificationCenterPage';
import StudentSettingsPage from './admin/students/StudentSettingsPage';

export function AdminDashboardPage() {
    const navigate = useNavigate();

    return (
        <AdminGuardShell
            title="Dashboard"
            description="Live snapshot of core admin modules with direct navigation shortcuts."
        >
            <DashboardHome
                universities={[]}
                exams={[]}
                users={[]}
                onTabChange={(tab) => navigate(routeFromDashboardActionTab(tab))}
            />
        </AdminGuardShell>
    );
}

export function AdminUniversitiesPage() {
    return (
        <AdminGuardShell title="Universities" description="Manage university records, mapping, and category assignments.">
            <UniversitiesPanel />
        </AdminGuardShell>
    );
}

export function AdminNewsPage() {
    return (
        <AdminGuardShell title="News" description="Create, review, and publish campus news content.">
            <NewsPanel />
        </AdminGuardShell>
    );
}

export function AdminExamsPage() {
    return <LegacyAdminDashboard forcedTab="exams" />;
}

export function AdminQuestionBankPage() {
    return (
        <AdminGuardShell title="Question Bank" description="Manage questions, bilingual content, and import tools.">
            <QuestionBankPanel />
        </AdminGuardShell>
    );
}

export function AdminStudentsPage() {
    return (
        <AdminGuardShell title="Students" description="Manage students, imports, and profile state in one place.">
            <StudentManagementPanel initialTab="students" />
        </AdminGuardShell>
    );
}

export function AdminStudentGroupsPage() {
    return (
        <AdminGuardShell title="Student Groups" description="Create, edit, and assign student groups.">
            <StudentManagementPanel initialTab="groups" />
        </AdminGuardShell>
    );
}

export function AdminPaymentsPage() {
    return (
        <AdminGuardShell title="Payments" description="Review manual payments, approve transactions, and export logs.">
            <FinancePanel />
        </AdminGuardShell>
    );
}

export function AdminResourcesPage() {
    return (
        <AdminGuardShell title="Resources" description="Manage downloadable resources and visibility controls.">
            <ResourcesPanel />
        </AdminGuardShell>
    );
}

export function AdminSupportCenterPage() {
    return (
        <AdminGuardShell title="Support Center" description="Handle student tickets, replies, and resolution workflow.">
            <SupportTicketsPanel />
        </AdminGuardShell>
    );
}

// ─── New Student Management System (v2) ───────────────────────────────────

export function AdminStudentsMgmtPage() {
    return <StudentsListPage />;
}

export function AdminStudentDetailPage() {
    return <StudentDetailPage />;
}

export function AdminStudentGroupsV2Page() {
    return <StudentGroupsPageV2 />;
}

export function AdminNotificationCenterPage() {
    return <NotificationCenterPage />;
}

export function AdminStudentSettingsPage() {
    return <StudentSettingsPage />;
}

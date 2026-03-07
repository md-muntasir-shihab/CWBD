import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './hooks/useTheme';
import { AuthProvider } from './hooks/useAuth';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomeModern';
import UniversitiesPage from './pages/Universities';
import UniversityDetailsPage from './pages/UniversityDetails';
import NewsPage from './pages/News';
import SingleNewsPage from './pages/SingleNews';
import { ExamsListPage } from './pages/exams/ExamsListPage';
import { ExamRunnerPage } from './pages/exams/ExamRunnerPage';
import { ExamResultPage } from './pages/exams/ExamResultPage';
import { ExamSolutionsPage } from './pages/exams/ExamSolutionsPage';
import ResourcesPage from './pages/Resources';
import ContactPage from './pages/Contact';
import SubscriptionPlansPage from './pages/SubscriptionPlans';
import SubscriptionPlanDetailPage from './pages/SubscriptionPlanDetail';
import LoginPage from './pages/Login';
import AdminSecretLoginPage from './pages/AdminSecretLogin';
import OtpVerificationPage from './pages/OtpVerification';
import AboutPage from './pages/About';
import TermsPage from './pages/Terms';
import PrivacyPage from './pages/Privacy';
import ProfilePage from './pages/Profile';
import CertificateVerifyPage from './pages/CertificateVerify';
import AdminAccessDeniedPage from './pages/AdminAccessDenied';
import AdminSubscriptionPlansPage from './pages/AdminSubscriptionPlans';
import AdminHomeSettingsPage from './pages/AdminHomeSettings';
import AdminUniversitySettingsPage from './pages/AdminUniversitySettings';
import AdminSettingsCenterPage from './pages/AdminSettingsCenter';
import AdminSettingsReportsPage from './pages/AdminSettingsReports';
import AdminSettingsBannersPage from './pages/AdminSettingsBanners';
import AdminSettingsSecurityPage from './pages/AdminSettingsSecurity';
import AdminSettingsLogsPage from './pages/AdminSettingsLogs';
import AdminSettingsSitePage from './pages/AdminSettingsSite';
import AdminSettingsProfilePage from './pages/AdminSettingsProfile';
import AdminSettingsNotificationsPage from './pages/AdminSettingsNotifications';
import AdminSettingsAnalyticsPage from './pages/AdminSettingsAnalytics';
import AdminSettingsNewsPage from './pages/AdminSettingsNews';
import AdminReportsPage from './pages/AdminReports';
import AdminNewsConsole from './pages/admin-news/AdminNewsConsole';
import {
    AdminDashboardPage,
    AdminUniversitiesPage,
    AdminExamsPage,
    AdminQuestionBankPage,
    AdminStudentsPage,
    AdminStudentGroupsPage,
    AdminPaymentsPage,
    AdminResourcesPage,
    AdminSupportCenterPage,
} from './pages/AdminCorePages';
import NotFoundPage from './pages/NotFound';
import ForceLogoutModal from './components/auth/ForceLogoutModal';
import ChairmanLoginPage from './pages/chairman/ChairmanLogin';
import ChairmanDashboardPage from './pages/chairman/ChairmanDashboard';
import {
    ADMIN_ACCESS_DENIED,
    ADMIN_DASHBOARD,
    ADMIN_LOGIN,
    CHAIRMAN_DASHBOARD,
    CHAIRMAN_LOGIN,
    STUDENT_LOGIN,
    adminUi,
    legacyAdminToSecret,
} from './lib/appRoutes';
import { ADMIN_PATHS, LEGACY_ADMIN_PATH_REDIRECTS } from './routes/adminPaths';

// Student Portal Moduels
import StudentLayout from './pages/student/StudentLayout';
import StudentRegister from './pages/student/StudentRegister';
import StudentForgotPassword from './pages/student/StudentForgotPassword';
import StudentResetPassword from './pages/student/StudentResetPassword';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentProfile from './pages/student/StudentProfile';
import StudentApplications from './pages/student/StudentApplications';
import StudentExamsHub from './pages/student/StudentExamsHub';
import StudentExamDetail from './pages/student/StudentExamDetail';
import StudentResults from './pages/student/StudentResults';
import StudentResultDetail from './pages/student/StudentResultDetail';
import StudentPayments from './pages/student/StudentPayments';
import StudentNotifications from './pages/student/StudentNotifications';
import StudentResources from './pages/student/StudentResources';
import StudentSupport from './pages/student/StudentSupport';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: { staleTime: 60_000, retry: 1, refetchOnWindowFocus: false },
    },
});

/** App shells that should NOT render the public navbar/footer */
const FULL_SCREEN_PREFIXES = ['/exam/take/', '/campusway-secure-admin', '/admin-dashboard', '/admin', '/__cw_admin__', '/chairman', '/login', '/otp-verify'];
const STUDENT_APP_PREFIXES = ['/student/', '/dashboard', '/profile', '/results', '/payments', '/notifications', '/support'];
const STUDENT_STANDALONE_ROUTES = new Set<string>([]);

import { useEffect } from 'react';
import { useWebsiteSettings } from './hooks/useWebsiteSettings';
import useHomeLiveUpdates from './hooks/useHomeLiveUpdates';

function resolveRouteTitle(pathname: string, siteName: string, defaultTitle: string): string | null {
    const withSite = (label: string) => `${label} | ${siteName}`;

    if (pathname === '/') return defaultTitle;
    if (pathname === '/universities') return withSite('Universities');
    if (pathname === '/services') return withSite('Subscription Plans');
    if (pathname === '/news') return withSite('News');
    if (pathname === '/exam-portal' || pathname === '/exams/landing' || pathname === '/exams') return withSite('Exams');
    if (pathname === '/resources') return withSite('Resources');
    if (pathname === '/contact') return withSite('Contact');
    if (pathname === '/pricing') return withSite('Subscription Plans');
    if (pathname === '/subscription-plans') return withSite('Subscription Plans');
    if (pathname === '/subscription') return withSite('Subscription Plans');
    if (pathname === '/subscriptions') return withSite('Subscription Plans');
    if (pathname === STUDENT_LOGIN) return withSite('Student Login');
    if (pathname === CHAIRMAN_LOGIN) return withSite('Chairman Login');
    if (pathname === ADMIN_LOGIN) return withSite('Admin Login');
    if (pathname.startsWith('/__cw_admin__/settings')) return withSite('Admin Settings');
    if (pathname === ADMIN_DASHBOARD) return withSite('Admin Dashboard');
    if (pathname === '/__cw_admin__/universities') return withSite('Admin Universities');
    if (pathname === '/__cw_admin__/students') return withSite('Admin Students');
    if (pathname === '/__cw_admin__/student-groups') return withSite('Admin Student Groups');
    if (pathname === '/__cw_admin__/payments') return withSite('Admin Payments');
    if (pathname === '/__cw_admin__/exams') return withSite('Admin Exams');
    if (pathname === '/__cw_admin__/resources') return withSite('Admin Resources');
    if (pathname.startsWith('/__cw_admin__/subscription-plans')) return withSite('Admin Subscription Plans');
    if (pathname === '/__cw_admin__/support-center') return withSite('Admin Support Center');
    if (pathname === '/__cw_admin__/reports') return withSite('Admin Reports');
    if (pathname === '/__cw_admin__/question-bank') return withSite('Admin Question Bank');
    if (pathname === '/__cw_admin__/settings/home-control') return withSite('Admin Home Control');
    if (pathname === '/__cw_admin__/settings/university-settings') return withSite('Admin University Settings');
    if (pathname === '/__cw_admin__/settings/banner-manager') return withSite('Admin Banner Manager');
    if (pathname === '/__cw_admin__/settings/security-center') return withSite('Admin Security Center');
    if (pathname === '/__cw_admin__/settings/system-logs') return withSite('Admin System Logs');
    if (pathname === '/__cw_admin__/settings/admin-profile') return withSite('Admin Profile');
    if (pathname === ADMIN_ACCESS_DENIED) return withSite('Admin Access Denied');
    if (pathname.startsWith('/__cw_admin__/news')) return withSite('Admin News');
    if (pathname.startsWith('/campusway-secure-admin')) return withSite('Admin Dashboard');
    if (pathname === CHAIRMAN_DASHBOARD) return withSite('Chairman Dashboard');
    if (pathname.startsWith('/dashboard')) return withSite('Student Dashboard');

    // Page-level title handlers manage these dynamic pages.
    if (pathname.startsWith('/news/')) return null;
    if (pathname.startsWith('/services/')) return null;
    if (pathname.startsWith('/university/')) return null;
    if (pathname.startsWith('/universities/')) return null;

    if (/^\/exam\/[^/]+$/.test(pathname) || pathname.startsWith('/exam/take/')) return withSite('Exam');
    if (/^\/exam\/[^/]+\/result$/.test(pathname) || pathname.startsWith('/exam/result/')) return withSite('Exam Result');
    if (/^\/exam\/[^/]+\/solutions$/.test(pathname)) return withSite('Exam Solutions');

    return defaultTitle;
}

function AppLayout({ children }: { children: React.ReactNode }) {
    const location = useLocation();
    const path = location.pathname;
    const isStudentAppRoute =
        STUDENT_STANDALONE_ROUTES.has(path) ||
        STUDENT_APP_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
    const isFullScreen = FULL_SCREEN_PREFIXES.some((prefix) => path.startsWith(prefix));
    const { data: settings } = useWebsiteSettings();
    useHomeLiveUpdates();

    // Dynamically update title + favicon from route + admin settings.
    useEffect(() => {
        const siteName = String(settings?.websiteName || 'CampusWay').trim() || 'CampusWay';
        const defaultTitle = String(settings?.metaTitle || `${siteName} - Admission Gateway`).trim() || `${siteName} - Admission Gateway`;
        const routeTitle = resolveRouteTitle(path, siteName, defaultTitle);
        if (routeTitle) {
            document.title = routeTitle;
        }

        const favicon = String(settings?.favicon || '/favicon.ico').trim() || '/favicon.ico';
        let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
        if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
        }
        link.href = favicon;
    }, [path, settings]);

    if (isFullScreen) return <><ForceLogoutModal />{children}</>;
    
    return (
        <div className="min-h-screen flex flex-col bg-transparent transition-colors duration-300">
            <Navbar />
            <main className="flex-1">{children}</main>
            {!isStudentAppRoute && <Footer />}
            <ForceLogoutModal />
        </div>
    );
}

function LegacyExamTakeRedirect() {
    const { examId } = useParams<{ examId: string }>();
    const location = useLocation();
    if (!examId) return <Navigate to="/exams" replace />;
    return <Navigate to={`/exam/${examId}${location.search}`} replace />;
}

function LegacyExamResultRedirect() {
    const { examId } = useParams<{ examId: string }>();
    const location = useLocation();
    if (!examId) return <Navigate to="/exams" replace />;
    return <Navigate to={`/exam/${examId}/result${location.search}`} replace />;
}

function LegacyStudentResultRedirect() {
    const { examId } = useParams<{ examId: string }>();
    if (!examId) return <Navigate to="/results" replace />;
    return <Navigate to={`/results/${examId}`} replace />;
}

function LegacyAdminRedirect() {
    const location = useLocation();
    const target = legacyAdminToSecret(location.pathname, location.search, location.hash);
    return <Navigate to={target} replace />;
}

export default function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider>
                <AuthProvider>
                    <BrowserRouter>
                        <AppLayout>
                            <Routes>
                                <Route path="/" element={<HomePage />} />
                                <Route path="/universities" element={<UniversitiesPage />} />
                                <Route path="/university/:slug" element={<UniversityDetailsPage />} />
                                <Route path="/universities/:slug" element={<UniversityDetailsPage />} />
                                <Route path="/services" element={<Navigate to="/subscription-plans" replace />} />
                                <Route path="/services/:slug" element={<Navigate to="/subscription-plans" replace />} />
                                <Route path="/news" element={<NewsPage />} />
                                <Route path="/news/:slug" element={<SingleNewsPage />} />
                                <Route path="/exam-portal" element={<Navigate to="/exams" replace />} />
                                <Route path="/exams/landing" element={<Navigate to="/exams" replace />} />
                                <Route path="/exams" element={<ExamsListPage />} />
                                <Route path="/exam/:examId" element={<ExamRunnerPage />} />
                                <Route path="/exam/:examId/result" element={<ExamResultPage />} />
                                <Route path="/exam/:examId/solutions" element={<ExamSolutionsPage />} />
                                <Route path="/exam/take/:examId" element={<LegacyExamTakeRedirect />} />
                                <Route path="/exam/result/:examId" element={<LegacyExamResultRedirect />} />
                                <Route path="/certificate/verify/:certificateId" element={<CertificateVerifyPage />} />
                                <Route path="/resources" element={<ResourcesPage />} />
                                <Route path="/contact" element={<ContactPage />} />
                                <Route path="/pricing" element={<Navigate to="/subscription-plans" replace />} />
                                <Route path="/subscription-plans" element={<SubscriptionPlansPage />} />
                                <Route path="/subscription-plans/:planId" element={<SubscriptionPlanDetailPage />} />
                                <Route path="/subscription" element={<Navigate to="/subscription-plans" replace />} />
                                <Route path="/subscriptions" element={<Navigate to="/subscription-plans" replace />} />
                                <Route path={STUDENT_LOGIN} element={<LoginPage />} />
                                <Route path={CHAIRMAN_LOGIN} element={<ChairmanLoginPage />} />
                                <Route path={CHAIRMAN_DASHBOARD} element={<ChairmanDashboardPage />} />
                                <Route path="/otp-verify" element={<OtpVerificationPage />} />
                                <Route path="/profile-center" element={<ProfilePage />} />
                                <Route path="/about" element={<AboutPage />} />
                                <Route path="/terms" element={<TermsPage />} />
                                <Route path="/privacy" element={<PrivacyPage />} />
                                <Route path="/campusway-secure-admin" element={<Navigate to={ADMIN_DASHBOARD} replace />} />
                                <Route path="/admin-dashboard" element={<Navigate to={ADMIN_DASHBOARD} replace />} />

                                <Route path={ADMIN_LOGIN} element={<AdminSecretLoginPage />} />
                                <Route path={ADMIN_ACCESS_DENIED} element={<AdminAccessDeniedPage />} />
                                <Route path={ADMIN_DASHBOARD} element={<AdminDashboardPage />} />
                                <Route path={ADMIN_PATHS.universities} element={<AdminUniversitiesPage />} />
                                <Route path={adminUi('universities/new')} element={<AdminUniversitiesPage />} />
                                <Route path={adminUi('universities/import')} element={<AdminUniversitiesPage />} />
                                <Route path={adminUi('universities/export')} element={<AdminUniversitiesPage />} />
                                <Route path={adminUi('universities/:id/edit')} element={<AdminUniversitiesPage />} />
                                <Route path={ADMIN_PATHS.news} element={<Navigate to={adminUi('news/dashboard')} replace />} />
                                <Route path={adminUi('news/*')} element={<AdminNewsConsole />} />
                                <Route path={ADMIN_PATHS.exams} element={<AdminExamsPage />} />
                                <Route path={ADMIN_PATHS.questionBank} element={<AdminQuestionBankPage />} />
                                <Route path={ADMIN_PATHS.students} element={<AdminStudentsPage />} />
                                <Route path={ADMIN_PATHS.studentGroups} element={<AdminStudentGroupsPage />} />
                                <Route path={adminUi('subscription-plans')} element={<AdminSubscriptionPlansPage />} />
                                <Route path={adminUi('subscription-plans/new')} element={<AdminSubscriptionPlansPage />} />
                                <Route path={adminUi('subscription-plans/:id/edit')} element={<AdminSubscriptionPlansPage />} />
                                <Route path={ADMIN_PATHS.resources} element={<AdminResourcesPage />} />
                                <Route path={ADMIN_PATHS.supportCenter} element={<AdminSupportCenterPage />} />
                                <Route path={ADMIN_PATHS.payments} element={<AdminPaymentsPage />} />
                                <Route path={adminUi('reports')} element={<AdminReportsPage />} />
                                <Route path={adminUi('settings')} element={<AdminSettingsCenterPage />} />
                                <Route path={adminUi('settings/home-control')} element={<AdminHomeSettingsPage />} />
                                <Route path={adminUi('settings/university-settings')} element={<AdminUniversitySettingsPage />} />
                                <Route path={adminUi('settings/site-settings')} element={<AdminSettingsSitePage />} />
                                <Route path={adminUi('settings/banner-manager')} element={<AdminSettingsBannersPage />} />
                                <Route path={adminUi('settings/security-center')} element={<AdminSettingsSecurityPage />} />
                                <Route path={adminUi('settings/system-logs')} element={<AdminSettingsLogsPage />} />
                                <Route path={adminUi('settings/reports')} element={<AdminSettingsReportsPage />} />
                                <Route path={adminUi('settings/notifications')} element={<AdminSettingsNotificationsPage />} />
                                <Route path={adminUi('settings/analytics')} element={<AdminSettingsAnalyticsPage />} />
                                <Route path={adminUi('settings/news-settings')} element={<AdminSettingsNewsPage />} />
                                <Route path={adminUi('settings/admin-profile')} element={<AdminSettingsProfilePage />} />
                                <Route path={adminUi('settings/home')} element={<Navigate to={adminUi('settings/home-control')} replace />} />
                                <Route path={adminUi('settings/site')} element={<Navigate to={adminUi('settings/site-settings')} replace />} />
                                <Route path={adminUi('settings/banners')} element={<Navigate to={adminUi('settings/banner-manager')} replace />} />
                                <Route path={adminUi('settings/security')} element={<Navigate to={adminUi('settings/security-center')} replace />} />
                                <Route path={adminUi('settings/logs')} element={<Navigate to={adminUi('settings/system-logs')} replace />} />
                                <Route path={adminUi('settings/profile')} element={<Navigate to={adminUi('settings/admin-profile')} replace />} />
                                {Object.entries(LEGACY_ADMIN_PATH_REDIRECTS).map(([legacyPath, targetPath]) => (
                                    <Route key={legacyPath} path={legacyPath} element={<Navigate to={targetPath} replace />} />
                                ))}
                                <Route path="/__cw_admin__" element={<Navigate to={ADMIN_DASHBOARD} replace />} />

                                <Route path="/admin/login" element={<Navigate to={ADMIN_LOGIN} replace />} />
                                <Route path="/admin/*" element={<LegacyAdminRedirect />} />

                                {/* Student Portal Routes */}
                                <Route path="/student/login" element={<Navigate to={STUDENT_LOGIN} replace />} />
                                <Route path="/student-login" element={<Navigate to={STUDENT_LOGIN} replace />} />
                                <Route path="/student/register" element={<StudentRegister />} />
                                <Route path="/student/forgot-password" element={<StudentForgotPassword />} />
                                <Route path="/student/reset-password" element={<StudentResetPassword />} />
                                <Route path="/student" element={<Navigate to="/dashboard" replace />} />
                                <Route path="/student/exams" element={<Navigate to="/exams" replace />} />
                                <Route path="/student/results" element={<Navigate to="/results" replace />} />
                                <Route path="/student/results/:examId" element={<LegacyStudentResultRedirect />} />
                                <Route path="/student/payments" element={<Navigate to="/payments" replace />} />
                                <Route path="/student/notifications" element={<Navigate to="/notifications" replace />} />
                                <Route path="/student/support" element={<Navigate to="/support" replace />} />
                                <Route element={<StudentLayout />}>
                                    <Route path="/dashboard" element={<StudentDashboard />} />
                                    <Route path="/profile" element={<StudentProfile />} />
                                    <Route path="/student/exams-hub" element={<StudentExamsHub />} />
                                    <Route path="/exams/:examId" element={<StudentExamDetail />} />
                                    <Route path="/results" element={<StudentResults />} />
                                    <Route path="/results/:examId" element={<StudentResultDetail />} />
                                    <Route path="/payments" element={<StudentPayments />} />
                                    <Route path="/notifications" element={<StudentNotifications />} />
                                    <Route path="/student/resources" element={<StudentResources />} />
                                    <Route path="/support" element={<StudentSupport />} />
                                    <Route path="/student/dashboard" element={<StudentDashboard />} />
                                    <Route path="/student/profile" element={<StudentProfile />} />
                                    <Route path="/student/applications" element={<StudentApplications />} />
                                </Route>

                                <Route path="*" element={<NotFoundPage />} />
                            </Routes>
                        </AppLayout>
                    </BrowserRouter>
                </AuthProvider>
            </ThemeProvider>
        </QueryClientProvider>
    );
}

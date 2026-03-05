import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './hooks/useTheme';
import { AuthProvider } from './hooks/useAuth';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import HomePage from './pages/Home';
import UniversityDetailsPage from './pages/UniversityDetails';
import ServicesPage from './pages/Services';
import NewsPage from './pages/News';
import SingleNewsPage from './pages/SingleNews';
import ExamsPage from './pages/Exams';
import ExamLandingPage from './pages/ExamLanding';
import ExamTakingPage from './pages/ExamTaking';
import ExamResultPage from './pages/ExamResult';
import ResourcesPage from './pages/Resources';
import ContactPage from './pages/Contact';
import PricingPage from './pages/Pricing';
import LoginPage from './pages/Login';
import OtpVerificationPage from './pages/OtpVerification';
import AboutPage from './pages/About';
import TermsPage from './pages/Terms';
import PrivacyPage from './pages/Privacy';
import ProfilePage from './pages/Profile';
import CertificateVerifyPage from './pages/CertificateVerify';
import AdminDashboard from './pages/AdminDashboard';
import AdminNewsLogin from './pages/admin-news/AdminNewsLogin';
import AdminNewsConsole from './pages/admin-news/AdminNewsConsole';
import ServiceDetail from './pages/ServiceDetail';
import NotFoundPage from './pages/NotFound';
import ForceLogoutModal from './components/auth/ForceLogoutModal';

// Student Portal Moduels
import StudentLayout from './pages/student/StudentLayout';
import StudentLogin from './pages/student/StudentLogin';
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

/** Pages that should NOT have Navbar/Footer */
const FULL_SCREEN_ROUTES = [
    '/exam/take/',
    '/campusway-secure-admin',
    '/admin-dashboard',
    '/admin',
    '/student',
    '/student-login',
    '/otp-verify',
    '/dashboard',
    '/profile',
    '/exams',
    '/results',
    '/payments',
    '/notifications',
    '/support',
];

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useWebsiteSettings } from './hooks/useWebsiteSettings';

function AppLayout({ children }: { children: React.ReactNode }) {
    const location = useLocation();
    const path = location.pathname;
    const isFullScreen = FULL_SCREEN_ROUTES.some(r => path.startsWith(r));
    const { data: settings } = useWebsiteSettings();

    // Dynamically update Title and Favicon
    useEffect(() => {
        if (settings) {
            document.title = settings.metaTitle || settings.websiteName || 'CampusWay';
            let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
            if (!link) {
                link = document.createElement('link');
                link.rel = 'icon';
                document.head.appendChild(link);
            }
            link.href = settings.favicon || '/favicon.ico';
        }
    }, [settings]);

    if (isFullScreen) return <><ForceLogoutModal />{children}</>;
    return (
        <div className="min-h-screen flex flex-col bg-transparent transition-colors duration-300">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
            <ForceLogoutModal />
        </div>
    );
}

function LegacyExamRedirect() {
    const { examId } = useParams<{ examId: string }>();
    if (!examId) return <Navigate to="/exam-portal" replace />;
    return <Navigate to={`/exam/take/${examId}`} replace />;
}

function LegacyStudentResultRedirect() {
    const { examId } = useParams<{ examId: string }>();
    if (!examId) return <Navigate to="/results" replace />;
    return <Navigate to={`/results/${examId}`} replace />;
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
                                <Route path="/university/:slug" element={<UniversityDetailsPage />} />
                                <Route path="/services" element={<ServicesPage />} />
                                <Route path="/services/:slug" element={<ServiceDetail />} />
                                <Route path="/news" element={<NewsPage />} />
                                <Route path="/news/:slug" element={<SingleNewsPage />} />
                                <Route path="/exam-portal" element={<ExamsPage />} />
                                <Route path="/exams/landing" element={<ExamLandingPage />} />
                                <Route path="/exam/:examId" element={<LegacyExamRedirect />} />
                                <Route path="/exam/take/:examId" element={<ExamTakingPage />} />
                                <Route path="/exam/result/:examId" element={<ExamResultPage />} />
                                <Route path="/certificate/verify/:certificateId" element={<CertificateVerifyPage />} />
                                <Route path="/resources" element={<ResourcesPage />} />
                                <Route path="/contact" element={<ContactPage />} />
                                <Route path="/pricing" element={<PricingPage />} />
                                <Route path="/login" element={<LoginPage />} />
                                <Route path="/otp-verify" element={<OtpVerificationPage />} />
                                <Route path="/profile-center" element={<ProfilePage />} />
                                <Route path="/about" element={<AboutPage />} />
                                <Route path="/terms" element={<TermsPage />} />
                                <Route path="/privacy" element={<PrivacyPage />} />
                                <Route path="/campusway-secure-admin" element={<AdminDashboard />} />
                                <Route path="/admin-dashboard" element={<Navigate to="/campusway-secure-admin" replace />} />
                                <Route path="/admin/dashboard" element={<Navigate to="/campusway-secure-admin" replace />} />
                                <Route path="/admin/exams" element={<Navigate to="/campusway-secure-admin?tab=exams" replace />} />
                                <Route path="/admin/students" element={<Navigate to="/campusway-secure-admin?tab=student-management" replace />} />
                                <Route path="/admin/payments" element={<Navigate to="/campusway-secure-admin?tab=finance" replace />} />
                                <Route path="/admin/settings" element={<Navigate to="/campusway-secure-admin?tab=settings" replace />} />
                                <Route path="/admin/security" element={<Navigate to="/campusway-secure-admin?tab=security" replace />} />
                                <Route path="/admin/audit" element={<Navigate to="/campusway-secure-admin?tab=logs" replace />} />
                                <Route path="/admin" element={<Navigate to="/admin/news" replace />} />
                                <Route path="/admin/login" element={<AdminNewsLogin />} />
                                <Route path="/admin/news/*" element={<AdminNewsConsole />} />

                                {/* Student Portal Routes */}
                                <Route path="/student/login" element={<StudentLogin />} />
                                <Route path="/student-login" element={<StudentLogin />} />
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
                                    <Route path="/exams" element={<StudentExamsHub />} />
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

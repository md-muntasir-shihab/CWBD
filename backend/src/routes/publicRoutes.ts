import { Router } from 'express';
import {
    login,
    getMe,
    changePassword,
    register,
    refresh,
    logout,
    verifyEmail,
    forgotPassword,
    resetPassword,
    verify2fa,
    resendOtp,
    checkSession,
    sessionStream,
    getOauthProviders,
    startOauth,
    oauthCallback,
} from '../controllers/authController';
import { getUniversities, getUniversityBySlug, getUniversityCategories } from '../controllers/universityController';
import { getFeaturedUniversityClusters, getPublicUniversityClusterMembers } from '../controllers/universityClusterController';
import { getPublicResources, incrementResourceView, incrementResourceDownload } from '../controllers/resourceController';
import { getActiveBanners } from '../controllers/bannerController';
import { getHomeConfig } from '../controllers/homeConfigController';
import { getPublicServiceConfig, getSiteSettings } from '../controllers/cmsController';
import { getPublicAlerts, getActiveStudentAlerts, ackStudentAlert } from '../controllers/homeAlertController';
import {
    getAggregatedHomeData,
    getHomeStream,
    getSettings,
    getStats
} from '../controllers/homeSystemController';
import {
    getExamLanding,
    getStudentExams,
    getStudentExamById,
    getStudentExamDetails,
    startExam,
    autosaveExam,
    submitExam,
    getExamResult,
    getExamAttemptState,
    saveExamAttemptAnswer,
    submitExamAttempt,
    logExamAttemptEvent,
    getStudentExamQuestions,
    streamExamAttempt,
    getExamCertificate,
    verifyExamCertificate,
} from '../controllers/examController';
import { getQbankPicker, incrementQbankUsage } from '../controllers/questionBankController';
import { authenticate } from '../middlewares/auth';
import { enforceRegistrationPolicy } from '../middlewares/securityGuards';
import { examStartRateLimiter, examSubmitRateLimiter, loginRateLimiter, uploadRateLimiter } from '../middlewares/securityRateLimit';
import { getProfile, getProfileDashboard, updateProfile } from '../controllers/profileController';
import { getServices, getServiceDetails } from '../controllers/serviceController';
import { getCategories as getServiceCategories } from '../controllers/serviceCategoryController';
import { studentCreateSupportTicket, studentGetNotices, studentGetSupportTickets } from '../controllers/adminSupportController';
import { getPublicSubscriptionPlans } from '../controllers/adminUserController';
import { updateStudentProfile } from '../controllers/studentController';
import {
    getPublicNewsV2List,
    getPublicNewsV2BySlug,
    getPublicNewsV2Appearance,
    getPublicNewsV2Widgets,
    trackPublicNewsV2Share,
} from '../controllers/newsV2Controller';
import { getPublicSecurityConfigController } from '../controllers/securityCenterController';
import {
    getStudentMe,
    getStudentMeExamById,
    getStudentMeExams,
    getStudentMeNotifications,
    getStudentMePayments,
    getStudentMeResources,
    getStudentMeResultByExam,
    getStudentMeResults,
    markStudentNotificationsRead,
} from '../controllers/studentHubController';

const router = Router();

/* ── Auth ── */
router.post('/auth/register', loginRateLimiter, enforceRegistrationPolicy, register);
router.post('/auth/login', loginRateLimiter, login);
router.post('/auth/refresh', refresh);
router.post('/auth/logout', authenticate, logout);
router.get('/auth/verify', verifyEmail);
router.post('/auth/forgot-password', forgotPassword);
router.post('/auth/reset-password', resetPassword);
router.get('/auth/me', authenticate, getMe);
router.post('/auth/change-password', authenticate, changePassword);
router.post('/auth/verify-2fa', verify2fa);
router.post('/auth/resend-otp', resendOtp);
router.get('/auth/session-check', authenticate, checkSession);
router.get('/auth/session-stream', authenticate, sessionStream);
router.get('/auth/oauth/providers', getOauthProviders);
router.get('/auth/oauth/:provider/start', startOauth);
router.get('/auth/oauth/:provider/callback', oauthCallback);

/* ── Public — Universities ── */
router.get('/universities', getUniversities);
router.get('/universities/categories', getUniversityCategories);
router.get('/home/clusters/featured', getFeaturedUniversityClusters);
router.get('/home/clusters/:slug/members', getPublicUniversityClusterMembers);

/* ── Public — Banners & Config ── */
router.get('/banners', getActiveBanners);
router.get('/banners/active', getActiveBanners);
router.get('/home-config', getHomeConfig);
/* ── Public — Resources ── */
router.get('/resources', getPublicResources);
router.post('/resources/:id/view', incrementResourceView);
router.post('/resources/:id/download', incrementResourceDownload);
router.get('/universities/:slug', getUniversityBySlug);

/* ── Public — Settings ── */
router.get('/settings/site', getSiteSettings);
router.get('/security/public-config', getPublicSecurityConfigController);
router.get('/subscription-plans/public', getPublicSubscriptionPlans);

/* ── Public — Dynamic Home System ── */
router.get('/home', getAggregatedHomeData);
router.get('/home/stream', getHomeStream);
router.get('/home/alerts', getPublicAlerts);
router.get('/settings', getSettings);
router.get('/stats', getStats);

/* ── Public — News ── */
import {
    getPublicNews,
    getPublicFeaturedNews,
    getPublicNewsBySlug,
    getPublicNewsCategories,
    getTrendingNews
} from '../controllers/cmsController';

router.get('/news', getPublicNews);
router.get('/news/featured', getPublicFeaturedNews);
router.get('/news/trending', getTrendingNews);
router.get('/news/categories', getPublicNewsCategories);
router.get('/news/:slug', getPublicNewsBySlug);
router.get('/news-v2/list', getPublicNewsV2List);
router.get('/news-v2/config/appearance', getPublicNewsV2Appearance);
router.get('/news-v2/widgets', getPublicNewsV2Widgets);
router.get('/news-v2/:slug', getPublicNewsV2BySlug);
router.post('/news-v2/share/track', trackPublicNewsV2Share);

/* ── Public — Services ── */
router.get('/services', getServices);
router.get('/services-config', getPublicServiceConfig);
router.get('/service-categories', getServiceCategories);
router.get('/services/:id', getServiceDetails);

/* ── Public — Contact Submit ── */
import ContactMessage from '../models/ContactMessage';
router.post('/contact', async (req, res) => {
    try {
        const msg = await ContactMessage.create(req.body);
        res.status(201).json({ message: 'Message sent successfully', id: msg._id });
    } catch { res.status(500).json({ message: 'Server error' }); }
});

/* ── Protected — Student Exam Portal ── */
import { uploadMedia, uploadMiddleware } from '../controllers/mediaController';

router.get('/exams', authenticate, getStudentExams);
router.get('/exams/landing', authenticate, getExamLanding);
router.get('/exams/:id', authenticate, getStudentExamById);
router.get('/exams/:id/details', authenticate, getStudentExamDetails);
router.post('/exams/:id/start', authenticate, examStartRateLimiter, startExam);
router.put('/exams/:id/autosave', authenticate, autosaveExam);
router.post('/exams/:id/submit', authenticate, examSubmitRateLimiter, submitExam);
router.get('/exams/:id/result', authenticate, getExamResult);
router.get('/exams/:examId/questions', authenticate, getStudentExamQuestions);
router.get('/exams/:examId/attempt/:attemptId', authenticate, getExamAttemptState);
router.get('/exams/:examId/attempt/:attemptId/stream', authenticate, streamExamAttempt);
router.post('/exams/:examId/attempt/:attemptId/answer', authenticate, saveExamAttemptAnswer);
router.post('/exams/:examId/attempt/:attemptId/event', authenticate, logExamAttemptEvent);
router.post('/exams/:examId/attempt/:attemptId/submit', authenticate, examSubmitRateLimiter, submitExamAttempt);
router.get('/exams/:id/certificate', authenticate, getExamCertificate);
router.get('/certificates/:certificateId/verify', verifyExamCertificate);
router.post('/exams/upload-written-answer', authenticate, uploadRateLimiter, uploadMiddleware.single('file'), uploadMedia);
router.get('/alerts/active', authenticate, getActiveStudentAlerts);
router.post('/alerts/:alertId/ack', authenticate, ackStudentAlert);
router.get('/qbank/picker', authenticate, getQbankPicker);
router.post('/qbank/usage/increment', authenticate, incrementQbankUsage);
router.get('/student/notices', authenticate, studentGetNotices);
router.post('/student/support-tickets', authenticate, studentCreateSupportTicket);
router.get('/student/support-tickets', authenticate, studentGetSupportTickets);
router.get('/users/me', authenticate, getStudentMe);
router.put('/users/me', authenticate, updateStudentProfile);
router.get('/students/me/exams', authenticate, getStudentMeExams);
router.get('/students/me/exams/:examId', authenticate, getStudentMeExamById);
router.get('/students/me/results', authenticate, getStudentMeResults);
router.get('/students/me/results/:examId', authenticate, getStudentMeResultByExam);
router.get('/students/me/payments', authenticate, getStudentMePayments);
router.get('/students/me/notifications', authenticate, getStudentMeNotifications);
router.post('/students/me/notifications/mark-read', authenticate, markStudentNotificationsRead);
router.get('/students/me/resources', authenticate, getStudentMeResources);

/* ── Protected — Password Change ── */
router.post('/auth/change-password', authenticate, changePassword);

/* ── Protected — Student Profile & Dashboard ── */
router.get('/profile/me', authenticate, getProfile);
router.get('/profile/dashboard', authenticate, getProfileDashboard);
router.put('/profile/update', authenticate, updateProfile);

export default router;

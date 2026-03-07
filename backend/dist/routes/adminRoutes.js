"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const auth_1 = require("../middlewares/auth");
const securityGuards_1 = require("../middlewares/securityGuards");
const securityRateLimit_1 = require("../middlewares/securityRateLimit");
const twoPersonApproval_1 = require("../middlewares/twoPersonApproval");
const adminExamController_1 = require("../controllers/adminExamController");
const universityController_1 = require("../controllers/universityController");
const universityClusterController_1 = require("../controllers/universityClusterController");
const universityImportController_1 = require("../controllers/universityImportController");
const universityCategoryController_1 = require("../controllers/universityCategoryController");
const bannerController_1 = require("../controllers/bannerController");
const homeConfigController_1 = require("../controllers/homeConfigController");
const homeAlertController_1 = require("../controllers/homeAlertController");
const homeSystemController_1 = require("../controllers/homeSystemController");
const homeSettingsAdminController_1 = require("../controllers/homeSettingsAdminController");
const adminSummaryController_1 = require("../controllers/adminSummaryController");
const mediaController_1 = require("../controllers/mediaController");
const cmsController_1 = require("../controllers/cmsController");
const newsV2Controller_1 = require("../controllers/newsV2Controller");
const serviceController_1 = require("../controllers/serviceController");
const serviceCategoryController_1 = require("../controllers/serviceCategoryController");
const questionBankController_1 = require("../controllers/questionBankController");
const adminDashboardController_1 = require("../controllers/adminDashboardController");
const authController_1 = require("../controllers/authController");
const securityCenterController_1 = require("../controllers/securityCenterController");
const actionApprovalController_1 = require("../controllers/actionApprovalController");
const runtimeSettingsController_1 = require("../controllers/runtimeSettingsController");
const universitySettingsController_1 = require("../controllers/universitySettingsController");
const notificationAutomationController_1 = require("../controllers/notificationAutomationController");
const analyticsController_1 = require("../controllers/analyticsController");
const adminReportsController_1 = require("../controllers/adminReportsController");
const adminFinanceController_1 = require("../controllers/adminFinanceController");
const adminSupportController_1 = require("../controllers/adminSupportController");
const backupController_1 = require("../controllers/backupController");
const adminUserController_1 = require("../controllers/adminUserController");
const subscriptionController_1 = require("../controllers/subscriptionController");
const socialLinksController_1 = require("../controllers/socialLinksController");
const adminJobsController_1 = require("../controllers/adminJobsController");
const studentImportController_1 = require("../controllers/studentImportController");
const permissionsMatrix_1 = require("../security/permissionsMatrix");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const canEditExams = (0, auth_1.authorizePermission)('canEditExams');
const canManageStudents = (0, auth_1.authorizePermission)('canManageStudents');
const canViewReports = (0, auth_1.authorizePermission)('canViewReports');
const canDeleteData = (0, auth_1.authorizePermission)('canDeleteData');
const canManageFinance = (0, auth_1.authorizePermission)('canManageFinance');
const canManagePlans = (0, auth_1.authorizePermission)('canManagePlans');
const canManageTickets = (0, auth_1.authorizePermission)('canManageTickets');
const canManageBackups = (0, auth_1.authorizePermission)('canManageBackups');
function inferModuleFromPath(pathname) {
    const clean = String(pathname || '').trim().toLowerCase();
    if (!clean || clean === '/health' || clean.startsWith('/openapi'))
        return null;
    if (clean.startsWith('/settings/site') || clean === '/settings' || clean.startsWith('/social-links'))
        return 'site_settings';
    if (clean.startsWith('/settings/home') || clean.startsWith('/home-settings') || clean.startsWith('/home'))
        return 'home_control';
    if (clean.startsWith('/banners'))
        return 'banner_manager';
    if (clean.startsWith('/universities') || clean.startsWith('/university-categories') || clean.startsWith('/university-clusters'))
        return 'universities';
    if (clean.startsWith('/news') || clean.startsWith('/news-v2') || clean.startsWith('/legacy-news') || clean.startsWith('/rss-sources') || clean.startsWith('/news-category'))
        return 'news';
    if (clean.startsWith('/exams') || clean.startsWith('/live'))
        return 'exams';
    if (clean.startsWith('/question-bank'))
        return 'question_bank';
    if (clean.startsWith('/students') || clean.startsWith('/student-groups') || clean.startsWith('/users'))
        return 'students_groups';
    if (clean.startsWith('/subscription-plans') || clean.startsWith('/subscriptions'))
        return 'subscription_plans';
    if (clean.startsWith('/payments') || clean.startsWith('/finance') || clean.startsWith('/dues') || clean.startsWith('/staff-payouts'))
        return 'payments';
    if (clean.startsWith('/resources'))
        return 'resources';
    if (clean.startsWith('/support-tickets') || clean.startsWith('/notices') || clean.startsWith('/contact-messages'))
        return 'support_center';
    if (clean.startsWith('/reports'))
        return 'reports_analytics';
    if (clean.startsWith('/security') || clean.startsWith('/security-settings') || clean.startsWith('/audit-logs') || clean.startsWith('/backups') || clean.startsWith('/jobs') || clean.startsWith('/approvals'))
        return 'security_logs';
    return null;
}
function inferActionFromRequest(method, pathname) {
    const cleanPath = String(pathname || '').toLowerCase();
    const upperMethod = String(method || '').toUpperCase();
    if (cleanPath.includes('bulk'))
        return 'bulk';
    if (cleanPath.includes('/export'))
        return 'export';
    if (cleanPath.includes('publish'))
        return 'publish';
    if (cleanPath.includes('approve') || cleanPath.includes('reject'))
        return 'approve';
    if (upperMethod === 'GET' || upperMethod === 'HEAD' || upperMethod === 'OPTIONS')
        return 'view';
    if (upperMethod === 'POST')
        return 'create';
    if (upperMethod === 'DELETE')
        return 'delete';
    return 'edit';
}
const enforceModulePermissions = (req, res, next) => {
    const moduleName = inferModuleFromPath(req.path);
    if (!moduleName) {
        next();
        return;
    }
    const action = inferActionFromRequest(req.method, req.path);
    return (0, auth_1.requirePermission)(moduleName, action)(req, res, next);
};
const requireTwoPersonForStudentBulkDelete = (req, res, next) => {
    const action = String(req.body?.action || '').trim().toLowerCase();
    if (action !== 'delete') {
        next();
        return;
    }
    return (0, twoPersonApproval_1.requireTwoPersonApproval)('students.bulk_delete', 'students_groups', 'bulk')(req, res, next);
};
const requireTwoPersonForPaymentRefund = (req, res, next) => {
    const status = String(req.body?.status || '').trim().toLowerCase();
    if (status !== 'refunded') {
        next();
        return;
    }
    return (0, twoPersonApproval_1.requireTwoPersonApproval)('payments.mark_refunded', 'payments', 'approve')(req, res, next);
};
const requireTwoPersonForUniversitiesBulkDelete = (req, res, next) => ((0, twoPersonApproval_1.requireTwoPersonApproval)('universities.bulk_delete', 'universities', 'bulk')(req, res, next));
const requireTwoPersonForExamResultPublish = (req, res, next) => ((0, twoPersonApproval_1.requireTwoPersonApproval)('exams.publish_result', 'exams', 'publish')(req, res, next));
const requireTwoPersonForBreakingNewsPublish = (req, res, next) => ((0, twoPersonApproval_1.requireTwoPersonApproval)('news.publish_breaking', 'news', 'publish')(req, res, next));
const requireTwoPersonForNewsDelete = (req, res, next) => ((0, twoPersonApproval_1.requireTwoPersonApproval)('news.bulk_delete', 'news', 'bulk')(req, res, next));
/* All admin routes require auth + appropriate roles */
router.use(auth_1.authenticate);
router.use(securityGuards_1.enforceAdminPanelPolicy);
router.use(securityGuards_1.enforceAdminReadOnlyMode);
router.use(enforceModulePermissions);
router.get('/permissions/matrix', (0, auth_1.authorize)('superadmin', 'admin'), (req, res) => {
    const includeMarkdown = String(req.query.format || '').trim().toLowerCase() === 'markdown';
    const responseBody = {
        modules: Object.keys(permissionsMatrix_1.ROLE_PERMISSION_MATRIX.superadmin),
        actions: Object.keys(permissionsMatrix_1.ROLE_PERMISSION_MATRIX.superadmin.site_settings),
        roles: permissionsMatrix_1.ROLE_PERMISSION_MATRIX,
    };
    if (includeMarkdown) {
        responseBody.markdown = (0, permissionsMatrix_1.permissionMatrixToMarkdown)();
    }
    res.json(responseBody);
});
router.get('/approvals/pending', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'support_agent'), actionApprovalController_1.adminGetPendingApprovals);
router.post('/approvals/:id/approve', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'support_agent'), actionApprovalController_1.adminApprovePendingAction);
router.post('/approvals/:id/reject', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'support_agent'), actionApprovalController_1.adminRejectPendingAction);
router.get('/jobs/runs', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor', 'support_agent', 'finance_agent'), adminJobsController_1.adminGetJobRuns);
router.get('/jobs/health', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor', 'support_agent', 'finance_agent'), adminJobsController_1.adminGetJobHealth);
/* ── Health ── */
router.get('/health', (_req, res) => {
    res.json({ status: 'OK', message: 'Admin API is running', timestamp: new Date().toISOString() });
});
router.get('/dashboard/summary', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), adminSummaryController_1.adminGetDashboardSummary);
router.get('/openapi/exam-console.json', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), (_req, res) => {
    const candidatePaths = [
        path_1.default.resolve(process.cwd(), '../docs/openapi/exam-console.json'),
        path_1.default.resolve(process.cwd(), 'docs/openapi/exam-console.json'),
    ];
    const filePath = candidatePaths.find((candidate) => fs_1.default.existsSync(candidate));
    if (!filePath) {
        res.status(404).json({ message: 'OpenAPI artifact not found.' });
        return;
    }
    res.sendFile(filePath);
});
router.get('/openapi/question-bank.json', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), (_req, res) => {
    const candidatePaths = [
        path_1.default.resolve(process.cwd(), '../docs/openapi/question-bank.json'),
        path_1.default.resolve(process.cwd(), 'docs/openapi/question-bank.json'),
    ];
    const filePath = candidatePaths.find((candidate) => fs_1.default.existsSync(candidate));
    if (!filePath) {
        res.status(404).json({ message: 'OpenAPI artifact not found.' });
        return;
    }
    res.sendFile(filePath);
});
router.get('/openapi/news-system-v2.json', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), (_req, res) => {
    const candidatePaths = [
        path_1.default.resolve(process.cwd(), '../docs/openapi/news-system-v2.json'),
        path_1.default.resolve(process.cwd(), 'docs/openapi/news-system-v2.json'),
    ];
    const filePath = candidatePaths.find((candidate) => fs_1.default.existsSync(candidate));
    if (!filePath) {
        res.status(404).json({ message: 'OpenAPI artifact not found.' });
        return;
    }
    res.sendFile(filePath);
});
/* ─────────────────────────────────────────────────────────────
   ROLE-BASED MIDDLEWARE
   superadmin → full access
   admin → nearly full access
   moderator → content management
   editor → content editing
   viewer → read-only
───────────────────────────────────────────────────────────── */
/* ── Site Settings ── */
router.get('/settings', (0, auth_1.authorize)('superadmin', 'admin'), cmsController_1.getSiteSettings);
router.put('/settings', (0, auth_1.authorize)('superadmin', 'admin'), cmsController_1.updateSiteSettings);
router.get('/settings/site', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), homeSystemController_1.getSettings);
router.put('/settings/site', (0, auth_1.authorize)('superadmin', 'admin'), mediaController_1.uploadMiddleware.fields([{ name: 'logo', maxCount: 1 }, { name: 'favicon', maxCount: 1 }]), homeSystemController_1.updateSettings);
router.get('/settings/home', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), homeSettingsAdminController_1.adminGetHomeSettings);
router.put('/settings/home', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), homeSettingsAdminController_1.adminUpdateHomeSettings);
router.get('/social-links', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), socialLinksController_1.adminGetSocialLinks);
router.post('/social-links', (0, auth_1.authorize)('superadmin', 'admin'), socialLinksController_1.adminCreateSocialLink);
router.put('/social-links/:id', (0, auth_1.authorize)('superadmin', 'admin'), socialLinksController_1.adminUpdateSocialLink);
router.delete('/social-links/:id', (0, auth_1.authorize)('superadmin', 'admin'), socialLinksController_1.adminDeleteSocialLink);
router.get('/settings/runtime', (0, auth_1.authorize)('superadmin', 'admin'), runtimeSettingsController_1.getRuntimeSettings);
router.put('/settings/runtime', (0, auth_1.authorize)('superadmin', 'admin'), runtimeSettingsController_1.updateRuntimeSettingsController);
router.get('/settings/notifications', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), notificationAutomationController_1.adminGetNotificationAutomationSettings);
router.put('/settings/notifications', (0, auth_1.authorize)('superadmin', 'admin'), notificationAutomationController_1.adminUpdateNotificationAutomationSettings);
router.get('/settings/analytics', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), analyticsController_1.adminGetAnalyticsSettings);
router.put('/settings/analytics', (0, auth_1.authorize)('superadmin', 'admin'), analyticsController_1.adminUpdateAnalyticsSettings);
router.get('/settings/university', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), universitySettingsController_1.getUniversitySettings);
router.put('/settings/university', (0, auth_1.authorize)('superadmin', 'admin'), universitySettingsController_1.updateUniversitySettings);
/* ── Security ── */
router.get('/security/settings', (0, auth_1.authorize)('superadmin', 'admin'), authController_1.getSecuritySettings);
router.put('/security/settings', (0, auth_1.authorize)('superadmin', 'admin'), authController_1.updateSecuritySettings);
router.get('/security-settings', (0, auth_1.authorize)('superadmin', 'admin'), securityCenterController_1.getAdminSecuritySettings);
router.put('/security-settings', (0, auth_1.authorize)('superadmin', 'admin'), securityCenterController_1.updateAdminSecuritySettings);
router.post('/security-settings/reset-defaults', (0, auth_1.authorize)('superadmin', 'admin'), securityCenterController_1.resetAdminSecuritySettings);
router.post('/security-settings/force-logout-all', (0, auth_1.authorize)('superadmin', 'admin'), securityCenterController_1.forceLogoutAllUsers);
router.post('/security-settings/admin-panel-lock', (0, auth_1.authorize)('superadmin', 'admin'), securityCenterController_1.lockAdminPanel);
router.get('/security/sessions', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), canManageStudents, authController_1.getActiveSessions);
router.post('/security/force-logout', (0, auth_1.authorize)('superadmin', 'admin'), canManageStudents, authController_1.forceLogoutUser);
router.get('/security/2fa/users', (0, auth_1.authorize)('superadmin', 'admin'), canManageStudents, authController_1.getTwoFactorUsers);
router.patch('/security/2fa/users/:id', (0, auth_1.authorize)('superadmin', 'admin'), canManageStudents, authController_1.updateTwoFactorUser);
router.post('/security/2fa/users/:id/reset', (0, auth_1.authorize)('superadmin', 'admin'), canManageStudents, authController_1.resetTwoFactorUser);
router.get('/security/2fa/failures', (0, auth_1.authorize)('superadmin', 'admin'), canManageStudents, authController_1.getTwoFactorFailures);
/* ── Reports & Analytics ── */
router.get('/reports/summary', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), canViewReports, adminReportsController_1.adminGetReportsSummary);
router.get('/reports/export', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), canViewReports, adminReportsController_1.adminExportReportsSummary);
router.get('/reports/analytics', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), canViewReports, analyticsController_1.adminGetAnalyticsOverview);
router.get('/reports/events/export', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), canViewReports, analyticsController_1.adminExportEventLogs);
router.get('/reports/exams/:examId/insights', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), canViewReports, adminReportsController_1.adminGetExamInsights);
router.get('/reports/exams/:examId/insights/export', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), canViewReports, adminReportsController_1.adminExportExamInsights);
/* ── Exams ── */
router.get('/exams', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), adminExamController_1.adminGetExams);
router.get('/exams/daily-report', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), canViewReports, adminExamController_1.adminDailyReport);
router.get('/exams/live-sessions', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), canViewReports, adminExamController_1.adminGetLiveExamSessions);
router.get('/live/attempts', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), canViewReports, adminExamController_1.adminGetLiveExamSessions);
router.get('/live/stream', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), canViewReports, adminExamController_1.adminLiveStream);
router.post('/live/attempts/:attemptId/action', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), canEditExams, adminExamController_1.adminLiveAttemptAction);
router.get('/exams/:id', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), adminExamController_1.adminGetExamById);
router.post('/exams', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), canEditExams, adminExamController_1.adminCreateExam);
router.post('/exams/sign-banner-upload', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), canEditExams, adminExamController_1.adminSignExamBannerUpload);
router.post('/exams/:id/clone', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), canEditExams, adminExamController_1.adminCloneExam);
router.post('/exams/:id/share-link/regenerate', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), canEditExams, adminExamController_1.adminRegenerateExamShareLink);
router.put('/exams/:id', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), canEditExams, adminExamController_1.adminUpdateExam);
router.delete('/exams/:id', (0, auth_1.authorize)('superadmin', 'admin'), canDeleteData, adminExamController_1.adminDeleteExam);
router.patch('/exams/:id/publish', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), canEditExams, adminExamController_1.adminPublishExam);
router.patch('/exams/:id/publish-result', (0, auth_1.authorize)('superadmin', 'admin'), canEditExams, requireTwoPersonForExamResultPublish, adminExamController_1.adminPublishResult);
router.patch('/exams/:examId/force-submit/:studentId', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), canEditExams, adminExamController_1.adminForceSubmit);
router.patch('/exams/evaluate/:resultId', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), canEditExams, adminExamController_1.adminEvaluateResult);
router.get('/exams/:examId/analytics', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), canViewReports, adminExamController_1.adminGetExamAnalytics);
router.get('/exams/:examId/export', (0, auth_1.authorize)('superadmin', 'admin'), canViewReports, adminExamController_1.adminExportExamResults);
router.get('/exams/:id/results/import-template', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), canViewReports, adminExamController_1.adminDownloadExamResultsImportTemplate);
router.post('/exams/:id/results/import', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), canEditExams, upload.single('file'), adminExamController_1.adminImportExamResults);
router.get('/exams/:id/reports/export', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), canViewReports, adminExamController_1.adminExportExamReport);
router.get('/exams/:id/events/export', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), canViewReports, adminExamController_1.adminExportExamEvents);
router.post('/exams/:id/preview/start', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), canEditExams, adminExamController_1.adminStartExamPreview);
router.patch('/exams/:examId/reset-attempt/:userId', (0, auth_1.authorize)('superadmin', 'admin'), canEditExams, adminExamController_1.adminResetExamAttempt);
/* ── Questions (per-exam) ── */
router.get('/exams/:examId/questions', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), adminExamController_1.adminGetQuestions);
router.post('/exams/:examId/questions', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), canEditExams, adminExamController_1.adminCreateQuestion);
router.put('/exams/:examId/questions/reorder', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), canEditExams, adminExamController_1.adminReorderQuestions);
router.put('/exams/:examId/questions/:questionId', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), canEditExams, adminExamController_1.adminUpdateQuestion);
router.delete('/exams/:examId/questions/:questionId', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), canEditExams, adminExamController_1.adminDeleteQuestion);
router.post('/exams/:examId/questions/import-excel', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), canEditExams, adminExamController_1.adminImportQuestionsFromExcel);
/* ── Global Question Bank ── */
router.get('/question-bank', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), questionBankController_1.getQuestions);
router.get('/question-bank/:id', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), questionBankController_1.getQuestionById);
router.post('/question-bank', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), canEditExams, questionBankController_1.createQuestion);
router.put('/question-bank/:id', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), canEditExams, questionBankController_1.updateQuestion);
router.delete('/question-bank/:id', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), canDeleteData, questionBankController_1.deleteQuestion);
router.post('/question-bank/:id/approve', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), canEditExams, questionBankController_1.approveQuestion);
router.post('/question-bank/:id/lock', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), canEditExams, questionBankController_1.lockQuestion);
router.post('/question-bank/:id/revert/:revisionNo', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), canEditExams, questionBankController_1.revertQuestionRevision);
router.post('/question-bank/search/similar', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), questionBankController_1.searchSimilarQuestions);
router.post('/question-bank/bulk-import', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), canEditExams, upload.single('file'), questionBankController_1.bulkImportQuestions);
router.get('/question-bank/import/:jobId', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), questionBankController_1.getQuestionImportJob);
router.post('/question-bank/export', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), questionBankController_1.exportQuestions);
router.post('/question-bank/media/sign-upload', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), canEditExams, questionBankController_1.signQuestionMediaUpload);
router.post('/question-bank/media', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), canEditExams, questionBankController_1.createQuestionMedia);
// Consolidated under /question-bank
/* ── Universities (Full CRUD) ── */
router.get('/universities', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), universityController_1.adminGetAllUniversities);
router.get('/universities/categories', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), universityController_1.adminGetUniversityCategories);
router.get('/university-categories', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), universityCategoryController_1.adminGetUniversityCategoryMaster);
router.post('/university-categories', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), universityCategoryController_1.adminCreateUniversityCategory);
router.put('/university-categories/:id', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), universityCategoryController_1.adminUpdateUniversityCategory);
router.patch('/university-categories/:id/toggle', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), universityCategoryController_1.adminToggleUniversityCategory);
router.delete('/university-categories/:id', (0, auth_1.authorize)('superadmin', 'admin'), universityCategoryController_1.adminDeleteUniversityCategory);
router.get('/universities/export', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), universityController_1.adminExportUniversities);
router.get('/universities/template.xlsx', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), universityImportController_1.adminDownloadUniversityImportTemplate);
router.put('/universities/reorder-featured', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), universityController_1.adminReorderFeaturedUniversities);
router.post('/universities/bulk-delete', (0, auth_1.authorize)('superadmin', 'admin'), requireTwoPersonForUniversitiesBulkDelete, universityController_1.adminBulkDeleteUniversities);
router.patch('/universities/bulk-update', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), universityController_1.adminBulkUpdateUniversities);
router.get('/universities/import/template', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), universityImportController_1.adminDownloadUniversityImportTemplate);
router.post('/universities/import', (0, auth_1.authorize)('superadmin', 'admin'), upload.single('file'), universityImportController_1.adminInitUniversityImport);
router.post('/universities/import/init', (0, auth_1.authorize)('superadmin', 'admin'), upload.single('file'), universityImportController_1.adminInitUniversityImport);
router.post('/universities/import/:jobId/validate', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), universityImportController_1.adminValidateUniversityImport);
router.post('/universities/import/:jobId/commit', (0, auth_1.authorize)('superadmin', 'admin'), universityImportController_1.adminCommitUniversityImport);
router.get('/universities/import/:jobId/errors.csv', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), universityImportController_1.adminDownloadUniversityImportErrors);
router.get('/universities/import/:jobId', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), universityImportController_1.adminGetUniversityImportJob);
router.get('/universities/:id', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), universityController_1.adminGetUniversityById);
router.post('/universities', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), universityController_1.adminCreateUniversity);
router.put('/universities/:id', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), universityController_1.adminUpdateUniversity);
router.delete('/universities/:id', (0, auth_1.authorize)('superadmin', 'admin'), canDeleteData, universityController_1.adminDeleteUniversity);
router.patch('/universities/:id/toggle-status', (0, auth_1.authorize)('superadmin', 'admin'), universityController_1.adminToggleUniversityStatus);
router.post('/universities/import-excel', (0, auth_1.authorize)('superadmin', 'admin'), upload.single('file'), adminExamController_1.adminBulkImportUniversities);
/* â”€â”€ University Clusters â”€â”€ */
router.get('/university-clusters', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), universityClusterController_1.adminGetUniversityClusters);
router.post('/university-clusters', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), universityClusterController_1.adminCreateUniversityCluster);
router.get('/university-clusters/:id', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), universityClusterController_1.adminGetUniversityClusterById);
router.put('/university-clusters/:id', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), universityClusterController_1.adminUpdateUniversityCluster);
router.post('/university-clusters/:id/members/resolve', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), universityClusterController_1.adminResolveUniversityClusterMembers);
router.patch('/university-clusters/:id/sync-dates', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), universityClusterController_1.adminSyncUniversityClusterDates);
router.delete('/university-clusters/:id', (0, auth_1.authorize)('superadmin', 'admin'), universityClusterController_1.adminDeleteUniversityCluster);
/* ── Legacy News CRUD ── */
router.get('/legacy-news', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), cmsController_1.adminGetNews);
router.post('/legacy-news', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), cmsController_1.adminCreateNews);
router.put('/legacy-news/:id', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), cmsController_1.adminUpdateNews);
router.delete('/legacy-news/:id', (0, auth_1.authorize)('superadmin', 'admin'), canDeleteData, requireTwoPersonForNewsDelete, cmsController_1.adminDeleteNews);
router.patch('/legacy-news/:id/toggle-publish', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), cmsController_1.adminToggleNewsPublish);
/* ── News Hub (spec aliases) ── */
router.get('/news/dashboard', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), newsV2Controller_1.adminNewsV2Dashboard);
router.get('/news/articles', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), newsV2Controller_1.adminNewsV2GetItems);
router.get('/news', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), newsV2Controller_1.adminNewsV2GetItems);
router.post('/news', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), newsV2Controller_1.adminNewsV2CreateItem);
router.put('/news/:id', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), newsV2Controller_1.adminNewsV2UpdateItem);
router.delete('/news/:id', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), canDeleteData, requireTwoPersonForNewsDelete, newsV2Controller_1.adminNewsV2DeleteItem);
router.post('/news/:id/ai-check', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), newsV2Controller_1.adminNewsV2AiCheckItem);
router.post('/news/:id/approve', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), newsV2Controller_1.adminNewsV2Approve);
router.post('/news/:id/approve-publish', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), newsV2Controller_1.adminNewsV2ApprovePublish);
router.post('/news/:id/reject', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), newsV2Controller_1.adminNewsV2Reject);
router.post('/news/:id/schedule', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), newsV2Controller_1.adminNewsV2Schedule);
router.post('/news/:id/publish-now', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), newsV2Controller_1.adminNewsV2PublishNow);
router.post('/news/:id/move-to-draft', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), newsV2Controller_1.adminNewsV2MoveToDraft);
router.post('/news/:id/publish-anyway', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), newsV2Controller_1.adminNewsV2PublishAnyway);
router.post('/news/:id/merge', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), newsV2Controller_1.adminNewsV2MergeDuplicate);
router.post('/news/:id/submit-review', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), newsV2Controller_1.adminNewsV2SubmitReview);
router.post('/news/media/upload', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), mediaController_1.uploadMiddleware.single('file'), newsV2Controller_1.adminNewsV2UploadMedia);
router.get('/news/export', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), newsV2Controller_1.adminNewsV2ExportNews);
router.get('/news/rss-sources/export', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), newsV2Controller_1.adminNewsV2ExportSources);
router.get('/news/sources', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), newsV2Controller_1.adminNewsV2GetSources);
router.post('/news/sources', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), newsV2Controller_1.adminNewsV2CreateSource);
router.put('/news/sources/:id', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), newsV2Controller_1.adminNewsV2UpdateSource);
router.delete('/news/sources/:id', (0, auth_1.authorize)('superadmin', 'admin'), newsV2Controller_1.adminNewsV2DeleteSource);
router.post('/news/sources/:id/test', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), newsV2Controller_1.adminNewsV2TestSource);
router.post('/news/fetch-now', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), newsV2Controller_1.adminNewsV2FetchNow);
router.get('/news/:id', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), newsV2Controller_1.adminNewsV2GetItemById);
router.get('/news-settings', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), newsV2Controller_1.adminNewsV2GetAllSettings);
router.put('/news-settings', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), newsV2Controller_1.adminNewsV2UpdateAllSettings);
router.patch('/news-settings', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), newsV2Controller_1.adminNewsV2UpdateAllSettings);
router.get('/rss-sources', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), newsV2Controller_1.adminNewsV2GetSources);
router.post('/rss-sources', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), newsV2Controller_1.adminNewsV2CreateSource);
router.put('/rss-sources/:id', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), newsV2Controller_1.adminNewsV2UpdateSource);
router.delete('/rss-sources/:id', (0, auth_1.authorize)('superadmin', 'admin'), newsV2Controller_1.adminNewsV2DeleteSource);
router.post('/rss-sources/:id/test', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), newsV2Controller_1.adminNewsV2TestSource);
router.post('/rss/fetch-now', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), newsV2Controller_1.adminNewsV2FetchNow);
router.post('/media/upload', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), mediaController_1.uploadMiddleware.single('file'), newsV2Controller_1.adminNewsV2UploadMedia);
/* ── News Categories ── */
router.get('/news-category', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), cmsController_1.adminGetNewsCategories);
router.post('/news-category', (0, auth_1.authorize)('superadmin', 'admin'), cmsController_1.adminCreateNewsCategory);
router.put('/news-category/:id', (0, auth_1.authorize)('superadmin', 'admin'), cmsController_1.adminUpdateNewsCategory);
router.delete('/news-category/:id', (0, auth_1.authorize)('superadmin', 'admin'), cmsController_1.adminDeleteNewsCategory);
router.patch('/news-category/:id/toggle', (0, auth_1.authorize)('superadmin', 'admin'), cmsController_1.adminToggleNewsCategory);
/* ── News V2 ── */
router.get('/news-v2/dashboard', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), newsV2Controller_1.adminNewsV2Dashboard);
router.post('/news-v2/fetch-now', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), newsV2Controller_1.adminNewsV2FetchNow);
router.get('/news-v2/items', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), newsV2Controller_1.adminNewsV2GetItems);
router.post('/news-v2/items', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), newsV2Controller_1.adminNewsV2CreateItem);
router.post('/news-v2/items/bulk-approve', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), newsV2Controller_1.adminNewsV2BulkApprove);
router.post('/news-v2/items/bulk-reject', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), newsV2Controller_1.adminNewsV2BulkReject);
router.get('/news-v2/items/:id', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), newsV2Controller_1.adminNewsV2GetItemById);
router.put('/news-v2/items/:id', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), newsV2Controller_1.adminNewsV2UpdateItem);
router.delete('/news-v2/items/:id', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), canDeleteData, requireTwoPersonForNewsDelete, newsV2Controller_1.adminNewsV2DeleteItem);
router.post('/news-v2/items/:id/ai-check', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), newsV2Controller_1.adminNewsV2AiCheckItem);
router.post('/news-v2/items/:id/submit-review', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), newsV2Controller_1.adminNewsV2SubmitReview);
router.post('/news-v2/items/:id/approve', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), newsV2Controller_1.adminNewsV2Approve);
router.post('/news-v2/items/:id/approve-publish', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), newsV2Controller_1.adminNewsV2ApprovePublish);
router.post('/news-v2/items/:id/reject', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), newsV2Controller_1.adminNewsV2Reject);
router.post('/news-v2/items/:id/publish-now', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), newsV2Controller_1.adminNewsV2PublishNow);
router.post('/news-v2/items/:id/schedule', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), newsV2Controller_1.adminNewsV2Schedule);
router.post('/news-v2/items/:id/move-to-draft', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), newsV2Controller_1.adminNewsV2MoveToDraft);
router.post('/news-v2/items/:id/publish-anyway', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), newsV2Controller_1.adminNewsV2PublishAnyway);
router.post('/news-v2/items/:id/merge', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), newsV2Controller_1.adminNewsV2MergeDuplicate);
router.get('/news-v2/sources', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), newsV2Controller_1.adminNewsV2GetSources);
router.post('/news-v2/sources', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), newsV2Controller_1.adminNewsV2CreateSource);
router.put('/news-v2/sources/:id', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), newsV2Controller_1.adminNewsV2UpdateSource);
router.delete('/news-v2/sources/:id', (0, auth_1.authorize)('superadmin', 'admin'), newsV2Controller_1.adminNewsV2DeleteSource);
router.post('/news-v2/sources/:id/test', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), newsV2Controller_1.adminNewsV2TestSource);
router.post('/news-v2/sources/reorder', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), newsV2Controller_1.adminNewsV2ReorderSources);
router.get('/news-v2/settings/appearance', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), newsV2Controller_1.adminNewsV2GetAppearanceSettings);
router.put('/news-v2/settings/appearance', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), newsV2Controller_1.adminNewsV2UpdateAppearanceSettings);
router.get('/news-v2/settings/ai', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), newsV2Controller_1.adminNewsV2GetAiSettings);
router.put('/news-v2/settings/ai', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), newsV2Controller_1.adminNewsV2UpdateAiSettings);
router.get('/news-v2/settings/share', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), newsV2Controller_1.adminNewsV2GetShareSettings);
router.put('/news-v2/settings/share', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), newsV2Controller_1.adminNewsV2UpdateShareSettings);
router.get('/news-v2/media', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), newsV2Controller_1.adminNewsV2GetMedia);
router.post('/news-v2/media/upload', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), mediaController_1.uploadMiddleware.single('file'), newsV2Controller_1.adminNewsV2UploadMedia);
router.post('/news-v2/media/from-url', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), newsV2Controller_1.adminNewsV2MediaFromUrl);
router.delete('/news-v2/media/:id', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), newsV2Controller_1.adminNewsV2DeleteMedia);
router.get('/news-v2/exports/news', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), newsV2Controller_1.adminNewsV2ExportNews);
router.get('/news-v2/exports/sources', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), newsV2Controller_1.adminNewsV2ExportSources);
router.get('/news-v2/exports/logs', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), newsV2Controller_1.adminNewsV2ExportLogs);
router.get('/news-v2/audit-logs', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), newsV2Controller_1.adminNewsV2GetAuditLogs);
/* ── Service Categories ── */
router.get('/service-categories', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), serviceCategoryController_1.adminGetCategories);
router.post('/service-categories', (0, auth_1.authorize)('superadmin', 'admin'), serviceCategoryController_1.adminCreateCategory);
router.put('/service-categories/:id', (0, auth_1.authorize)('superadmin', 'admin'), serviceCategoryController_1.adminUpdateCategory);
router.delete('/service-categories/:id', (0, auth_1.authorize)('superadmin', 'admin'), serviceCategoryController_1.adminDeleteCategory);
/* ── Services CRUD ── */
router.get('/services', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), serviceController_1.adminGetServices);
router.post('/services', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), serviceController_1.adminCreateService);
router.put('/services/:id', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), serviceController_1.adminUpdateService);
router.delete('/services/:id', (0, auth_1.authorize)('superadmin', 'admin'), canDeleteData, serviceController_1.adminDeleteService);
router.post('/services/reorder', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), serviceController_1.adminReorderServices);
router.patch('/services/:id/toggle-status', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), serviceController_1.adminToggleServiceStatus);
router.patch('/services/:id/toggle-featured', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), serviceController_1.adminToggleServiceFeatured);
/* ── Resources CRUD ── */
router.get('/resources', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), cmsController_1.adminGetResources);
router.post('/resources', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), cmsController_1.adminCreateResource);
router.put('/resources/:id', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), cmsController_1.adminUpdateResource);
router.delete('/resources/:id', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), canDeleteData, cmsController_1.adminDeleteResource);
/* ── Contact Messages ── */
router.get('/contact-messages', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), cmsController_1.adminGetContactMessages);
router.delete('/contact-messages/:id', (0, auth_1.authorize)('superadmin', 'admin'), canDeleteData, cmsController_1.adminDeleteContactMessage);
/* ── Banners & Config ── */
router.get('/banners', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), bannerController_1.adminGetBanners);
router.get('/banners/active', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), bannerController_1.adminGetBanners);
router.post('/banners/sign-upload', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), bannerController_1.adminSignBannerUpload);
router.post('/banners', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), bannerController_1.adminCreateBanner);
router.put('/banners/:id', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), bannerController_1.adminUpdateBanner);
router.delete('/banners/:id', (0, auth_1.authorize)('superadmin', 'admin'), canDeleteData, bannerController_1.adminDeleteBanner);
router.put('/banners/:id/publish', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), bannerController_1.adminPublishBanner);
/* ── Home Alerts (Live Ticker) ── */
router.get('/home-alerts', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), homeAlertController_1.adminGetAlerts);
router.post('/home-alerts', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), homeAlertController_1.adminCreateAlert);
router.put('/home-alerts/:id', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), homeAlertController_1.adminUpdateAlert);
router.delete('/home-alerts/:id', (0, auth_1.authorize)('superadmin', 'admin'), canDeleteData, homeAlertController_1.adminDeleteAlert);
router.patch('/home-alerts/:id/toggle', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), homeAlertController_1.adminToggleAlert);
router.put('/home-alerts/:id/publish', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), homeAlertController_1.adminPublishAlert);
// Consolidated under /home-alerts
// Deprecated aliases kept temporarily for legacy callers.
router.get('/alerts', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), homeAlertController_1.adminGetAlerts);
router.post('/alerts', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), homeAlertController_1.adminCreateAlert);
router.put('/alerts/:id', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), homeAlertController_1.adminUpdateAlert);
router.delete('/alerts/:id', (0, auth_1.authorize)('superadmin', 'admin'), canDeleteData, homeAlertController_1.adminDeleteAlert);
router.patch('/alerts/:id/toggle', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), homeAlertController_1.adminToggleAlert);
router.put('/alerts/:id/publish', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), homeAlertController_1.adminPublishAlert);
router.get('/home-config', (0, auth_1.authorize)('superadmin', 'admin', 'editor'), homeConfigController_1.getHomeConfig);
router.put('/home-config', (0, auth_1.authorize)('superadmin', 'admin', 'editor'), homeConfigController_1.updateHomeConfig);
/* ── Dynamic Home System ── */
router.get('/home-settings', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), homeSettingsAdminController_1.adminGetHomeSettings);
router.put('/home-settings', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), homeSettingsAdminController_1.adminUpdateHomeSettings);
router.get('/home-settings/defaults', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), homeSettingsAdminController_1.adminGetHomeSettingsDefaults);
router.post('/home-settings/reset-section', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), homeSettingsAdminController_1.adminResetHomeSettingsSection);
router.put('/home/settings', (0, auth_1.authorize)('superadmin', 'admin'), mediaController_1.uploadMiddleware.fields([{ name: 'logo', maxCount: 1 }, { name: 'favicon', maxCount: 1 }]), homeSystemController_1.updateSettings);
router.put('/home', (0, auth_1.authorize)('superadmin', 'admin'), homeSystemController_1.updateHome);
router.put('/home/hero', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), mediaController_1.uploadMiddleware.single('file'), homeSystemController_1.updateHero);
router.put('/home/banner', (0, auth_1.authorize)('superadmin', 'admin'), mediaController_1.uploadMiddleware.single('image'), homeSystemController_1.updatePromotionalBanner);
router.put('/home/announcement', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), homeSystemController_1.updateAnnouncement);
router.put('/home/stats', (0, auth_1.authorize)('superadmin', 'admin'), homeSystemController_1.updateStats);
/* ── Media ── */
router.post('/upload', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), mediaController_1.uploadMiddleware.single('file'), mediaController_1.uploadMedia);
/* ── Student & User Management ── */
router.get('/users/admin/profile', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), adminUserController_1.adminGetAdminProfile);
router.put('/users/admin/profile', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), adminUserController_1.adminUpdateAdminProfile);
router.get('/users', (0, auth_1.authorize)('superadmin'), adminUserController_1.adminGetUsers);
router.get('/users/activity', (0, auth_1.authorize)('superadmin', 'admin'), adminUserController_1.adminGetUserActivity);
router.get('/users/stream', (0, auth_1.authorize)('superadmin', 'admin'), adminUserController_1.adminUserStream);
router.get('/users/:id', (0, auth_1.authorize)('superadmin', 'admin'), adminUserController_1.adminGetUserById);
router.post('/users', (0, auth_1.authorize)('superadmin'), adminUserController_1.adminCreateUser);
router.put('/users/:id', (0, auth_1.authorize)('superadmin'), adminUserController_1.adminUpdateUser);
router.put('/users/:id/role', (0, auth_1.authorize)('superadmin'), adminUserController_1.adminUpdateUserRole);
router.patch('/users/:id/toggle-status', (0, auth_1.authorize)('superadmin', 'admin'), adminUserController_1.adminToggleUserStatus);
router.delete('/users/:id', (0, auth_1.authorize)('superadmin'), adminUserController_1.adminDeleteUser);
router.patch('/users/:id/set-status', (0, auth_1.authorize)('superadmin'), adminUserController_1.adminSetUserStatus);
router.patch('/users/:id/permissions', (0, auth_1.authorize)('superadmin'), adminUserController_1.adminSetUserPermissions);
router.post('/users/bulk-action', (0, auth_1.authorize)('superadmin'), adminUserController_1.adminBulkUserAction);
router.get('/audit-logs', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), (req, res) => {
    const scope = String(req.query.scope || '').trim().toLowerCase();
    const moduleScope = String(req.query.module || '').trim().toLowerCase();
    if (scope === 'news' || moduleScope === 'news') {
        void (0, newsV2Controller_1.adminNewsV2GetAuditLogs)(req, res);
        return;
    }
    const role = String(req?.user?.role || '').toLowerCase();
    if (role !== 'superadmin') {
        (0, auth_1.forbidden)(res, { message: 'Only super admin can access system audit logs.' });
        return;
    }
    void (0, adminUserController_1.adminGetAuditLogs)(req, res);
});
/* ── Extended Student Management ── */
router.get('/students', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), canManageStudents, adminUserController_1.adminGetStudents);
router.post('/students', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), canManageStudents, adminUserController_1.adminCreateStudent);
router.put('/students/:id', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), canManageStudents, adminUserController_1.adminUpdateStudent);
router.post('/students/bulk-action', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), canManageStudents, requireTwoPersonForStudentBulkDelete, adminUserController_1.adminBulkStudentAction);
router.post('/students/bulk-import', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), canManageStudents, upload.single('file'), adminUserController_1.adminBulkImportStudents);
router.put('/students/:id/subscription', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), canManageStudents, securityRateLimit_1.subscriptionActionRateLimiter, subscriptionController_1.adminLegacyAssignStudentSubscription);
/* ── Extracted Admin Features ── */
router.post('/users/:id/reset-password', (0, auth_1.authorize)('superadmin', 'admin'), adminUserController_1.adminResetUserPassword);
router.post('/students/:id/reset-password', (0, auth_1.authorize)('superadmin', 'admin'), canManageStudents, adminUserController_1.adminResetUserPassword);
router.post('/students/:id/password/reveal', (0, auth_1.authorize)('superadmin', 'admin'), canManageStudents, adminUserController_1.adminRevealStudentPassword);
router.get('/students/profile-requests', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), canManageStudents, adminUserController_1.adminGetProfileUpdateRequests);
router.post('/students/profile-requests/:id/approve', (0, auth_1.authorize)('superadmin', 'admin'), canManageStudents, adminUserController_1.adminApproveProfileUpdateRequest);
router.post('/students/profile-requests/:id/reject', (0, auth_1.authorize)('superadmin', 'admin'), canManageStudents, adminUserController_1.adminRejectProfileUpdateRequest);
/* ── Student Import/Export ── */
router.get('/students/import/template', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), studentImportController_1.adminDownloadStudentTemplate);
router.post('/students/import/init', (0, auth_1.authorize)('superadmin', 'admin'), upload.single('file'), studentImportController_1.adminInitStudentImport);
router.get('/students/import/:id', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), studentImportController_1.adminGetStudentImportJob);
router.post('/students/import/:id/validate', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), studentImportController_1.adminValidateStudentImport);
router.post('/students/import/:id/commit', (0, auth_1.authorize)('superadmin', 'admin'), studentImportController_1.adminCommitStudentImport);
router.get('/user-stream', (0, auth_1.authorize)('superadmin', 'admin'), adminUserController_1.adminUserStream);
router.get('/student-groups', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), adminUserController_1.adminGetStudentGroups);
router.get('/student-groups/export', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), canViewReports, adminUserController_1.adminExportStudentGroups);
router.post('/student-groups/import', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), canManageStudents, upload.single('file'), adminUserController_1.adminImportStudentGroups);
router.post('/student-groups', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), adminUserController_1.adminCreateStudentGroup);
router.put('/student-groups/:id', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), adminUserController_1.adminUpdateStudentGroup);
router.delete('/student-groups/:id', (0, auth_1.authorize)('superadmin', 'admin'), adminUserController_1.adminDeleteStudentGroup);
/* ── Subscription Plans ── */
router.get('/subscription-plans', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), subscriptionController_1.adminGetSubscriptionPlans);
router.get('/subscription-plans/:id', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), subscriptionController_1.adminGetSubscriptionPlanById);
router.post('/subscription-plans', (0, auth_1.authorize)('superadmin', 'admin'), canManagePlans, subscriptionController_1.adminCreateSubscriptionPlan);
router.put('/subscription-plans/reorder', (0, auth_1.authorize)('superadmin', 'admin'), canManagePlans, subscriptionController_1.adminReorderSubscriptionPlans);
router.put('/subscription-plans/:id', (0, auth_1.authorize)('superadmin', 'admin'), canManagePlans, subscriptionController_1.adminUpdateSubscriptionPlan);
router.delete('/subscription-plans/:id', (0, auth_1.authorize)('superadmin', 'admin'), canManagePlans, subscriptionController_1.adminDeleteSubscriptionPlan);
router.put('/subscription-plans/:id/toggle', (0, auth_1.authorize)('superadmin', 'admin'), canManagePlans, subscriptionController_1.adminToggleSubscriptionPlan);
router.patch('/subscription-plans/:id/toggle', (0, auth_1.authorize)('superadmin', 'admin'), canManagePlans, subscriptionController_1.adminToggleSubscriptionPlan);
router.get('/subscription-plans/export', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), canManagePlans, subscriptionController_1.adminExportSubscriptionPlans);
router.post('/subscriptions/assign', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), canManagePlans, securityRateLimit_1.subscriptionActionRateLimiter, subscriptionController_1.adminAssignSubscription);
router.post('/subscriptions/suspend', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), canManagePlans, securityRateLimit_1.subscriptionActionRateLimiter, subscriptionController_1.adminSuspendSubscription);
router.get('/subscriptions/export', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), canManagePlans, subscriptionController_1.adminExportSubscriptions);
/* ── Student LTV ── */
router.get('/students/:id/ltv', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), canManageFinance, adminFinanceController_1.adminGetStudentLtv);
/* ── Manual Payments ── */
router.get('/payments', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), canManageFinance, adminFinanceController_1.adminGetPayments);
router.get('/payments/export', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), canManageFinance, adminFinanceController_1.adminExportPayments);
router.post('/payments', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), canManageFinance, adminFinanceController_1.adminCreatePayment);
router.put('/payments/:id', (0, auth_1.authorize)('superadmin', 'admin'), canManageFinance, requireTwoPersonForPaymentRefund, adminFinanceController_1.adminUpdatePayment);
router.get('/students/:id/payments', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), canManageFinance, adminFinanceController_1.adminGetStudentPayments);
/* ── Expenses ── */
router.get('/finance/payments/:id/history', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), canManageFinance, adminFinanceController_1.adminGetPayments); // Placeholder
router.post('/finance/payments/:id/approve', (0, auth_1.authorize)('superadmin', 'admin'), canManageFinance, adminFinanceController_1.adminApprovePayment);
router.get('/expenses', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), canManageFinance, adminFinanceController_1.adminGetExpenses);
router.post('/expenses', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), canManageFinance, adminFinanceController_1.adminCreateExpense);
router.put('/expenses/:id', (0, auth_1.authorize)('superadmin', 'admin'), canManageFinance, adminFinanceController_1.adminUpdateExpense);
/* ── Staff Payouts ── */
router.get('/staff-payouts', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), canManageFinance, adminFinanceController_1.adminGetStaffPayouts);
router.post('/staff-payouts', (0, auth_1.authorize)('superadmin', 'admin'), canManageFinance, adminFinanceController_1.adminCreateStaffPayout);
/* ── Finance Analytics ── */
router.get('/finance/summary', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), canManageFinance, adminFinanceController_1.adminGetFinanceSummary);
router.get('/finance/revenue-series', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), canManageFinance, adminFinanceController_1.adminGetFinanceRevenueSeries);
router.get('/finance/student-growth', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), canManageFinance, adminFinanceController_1.adminGetFinanceStudentGrowth);
router.get('/finance/plan-distribution', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), canManageFinance, adminFinanceController_1.adminGetFinancePlanDistribution);
router.get('/finance/expense-breakdown', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), canManageFinance, adminFinanceController_1.adminGetFinanceExpenseBreakdown);
router.get('/finance/cashflow', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), canManageFinance, adminFinanceController_1.adminGetFinanceCashflow);
router.get('/finance/test-board', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), canManageFinance, adminFinanceController_1.adminGetFinanceTestBoard);
router.get('/finance/stream', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), canManageFinance, adminFinanceController_1.adminFinanceStream);
/* ── Dues & Reminders ── */
router.get('/dues', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), canManageFinance, adminFinanceController_1.adminGetDues);
router.patch('/dues/:studentId', (0, auth_1.authorize)('superadmin', 'admin'), canManageFinance, adminFinanceController_1.adminUpdateDue);
router.post('/dues/:studentId/remind', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), canManageFinance, adminFinanceController_1.adminSendDueReminder);
router.post('/reminders/dispatch', (0, auth_1.authorize)('superadmin', 'admin'), canManageFinance, adminFinanceController_1.adminDispatchReminders);
/* ── Notices ── */
router.get('/notices', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), canManageTickets, adminSupportController_1.adminGetNotices);
router.post('/notices', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), canManageTickets, adminSupportController_1.adminCreateNotice);
router.patch('/notices/:id/toggle', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), canManageTickets, adminSupportController_1.adminToggleNotice);
/* ── Support Tickets ── */
router.get('/support-tickets', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), canManageTickets, adminSupportController_1.adminGetSupportTickets);
router.patch('/support-tickets/:id/status', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), canManageTickets, adminSupportController_1.adminUpdateSupportTicketStatus);
router.post('/support-tickets/:id/reply', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), canManageTickets, adminSupportController_1.adminReplySupportTicket);
/* ── Backups ── */
router.post('/backups/run', (0, auth_1.authorize)('superadmin', 'admin'), canManageBackups, backupController_1.adminRunBackup);
router.get('/backups', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), canManageBackups, backupController_1.adminListBackups);
router.post('/backups/:id/restore', (0, auth_1.authorize)('superadmin', 'admin'), canManageBackups, backupController_1.adminRestoreBackup);
router.get('/backups/:id/download', (0, auth_1.authorize)('superadmin', 'admin'), canManageBackups, backupController_1.adminDownloadBackup);
/* ── Badges ── */
router.get('/badges', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), adminDashboardController_1.adminGetBadges);
router.post('/badges', (0, auth_1.authorize)('superadmin', 'admin'), adminDashboardController_1.adminCreateBadge);
router.put('/badges/:id', (0, auth_1.authorize)('superadmin', 'admin'), adminDashboardController_1.adminUpdateBadge);
router.delete('/badges/:id', (0, auth_1.authorize)('superadmin', 'admin'), adminDashboardController_1.adminDeleteBadge);
router.post('/students/:studentId/badges/:badgeId', (0, auth_1.authorize)('superadmin', 'admin'), adminDashboardController_1.adminAssignBadge);
router.delete('/students/:studentId/badges/:badgeId', (0, auth_1.authorize)('superadmin', 'admin'), adminDashboardController_1.adminRevokeBadge);
/* ── Student Dashboard Configurations ── */
router.get('/dashboard-config', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), adminDashboardController_1.adminGetStudentDashboardConfig);
router.put('/dashboard-config', (0, auth_1.authorize)('superadmin', 'admin'), adminDashboardController_1.adminUpdateStudentDashboardConfig);
// Consolidated under /dashboard-config
/* ── Notifications ── */
router.get('/notifications', (0, auth_1.authorize)('superadmin', 'admin', 'moderator', 'editor'), adminDashboardController_1.adminGetNotifications);
router.post('/notifications', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), adminDashboardController_1.adminCreateNotification);
router.put('/notifications/:id', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), adminDashboardController_1.adminUpdateNotification);
router.patch('/notifications/:id/toggle', (0, auth_1.authorize)('superadmin', 'admin', 'moderator'), adminDashboardController_1.adminToggleNotification);
router.delete('/notifications/:id', (0, auth_1.authorize)('superadmin', 'admin'), adminDashboardController_1.adminDeleteNotification);
/* ── Parent / Guardian Link ── */
router.post('/students/:studentId/otp', (0, auth_1.authorize)('superadmin', 'admin'), adminDashboardController_1.adminIssueGuardianOtp);
router.post('/students/:studentId/confirm-otp', (0, auth_1.authorize)('superadmin', 'admin'), adminDashboardController_1.adminConfirmGuardianOtp);
/* ── Admin Dashboard Overrides ── */
router.post('/auth/mfa/confirm', (0, auth_1.authorize)('superadmin', 'admin'), adminExamController_1.adminMfaConfirm);
/* ── Exports ── */
router.get('/export-news', (0, auth_1.authorize)('superadmin', 'admin'), cmsController_1.adminExportNews);
router.get('/export-subscription-plans', (0, auth_1.authorize)('superadmin', 'admin'), subscriptionController_1.adminExportSubscriptionPlans);
router.get('/export-subscription-plans/legacy', (0, auth_1.authorize)('superadmin', 'admin'), cmsController_1.adminExportSubscriptionPlans);
router.get('/export-universities', (0, auth_1.authorize)('superadmin', 'admin'), cmsController_1.adminExportUniversities);
router.get('/export-students', (0, auth_1.authorize)('superadmin', 'admin'), adminUserController_1.adminExportStudents);
exports.default = router;
//# sourceMappingURL=adminRoutes.js.map
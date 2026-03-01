import { Router, Request, Response } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { authenticate, authorize, authorizePermission } from '../middlewares/auth';
import {
    adminGetExams,
    adminGetExamById,
    adminCreateExam,
    adminUpdateExam,
    adminDeleteExam,
    adminPublishExam,
    adminForceSubmit,
    adminPublishResult,
    adminGetQuestions,
    adminCreateQuestion,
    adminUpdateQuestion,
    adminDeleteQuestion,
    adminReorderQuestions,
    adminImportQuestionsFromExcel,
    adminGetExamAnalytics,
    adminExportExamResults,
    adminEvaluateResult,
    adminDailyReport,
    adminUpdateUserSubscription,
    adminResetExamAttempt,
    adminGetStudentReport,
    adminBulkImportUniversities,
    adminMfaConfirm,
    adminGetLiveExamSessions,
    adminLiveStream,
    adminLiveAttemptAction,
    adminExportExamEvents,
    adminStartExamPreview,
    adminCloneExam,
    adminRegenerateExamShareLink,
    adminSignExamBannerUpload,
} from '../controllers/adminExamController';
import {
    adminGetAllUniversities,
    adminGetUniversityCategories,
    adminExportUniversities,
    adminGetUniversityById,
    adminCreateUniversity,
    adminUpdateUniversity,
    adminDeleteUniversity,
    adminToggleUniversityStatus,
    adminReorderFeaturedUniversities,
    adminBulkDeleteUniversities,
    adminBulkUpdateUniversities,
} from '../controllers/universityController';
import {
    adminCreateUniversityCluster,
    adminDeleteUniversityCluster,
    adminGetUniversityClusterById,
    adminGetUniversityClusters,
    adminResolveUniversityClusterMembers,
    adminSyncUniversityClusterDates,
    adminUpdateUniversityCluster,
} from '../controllers/universityClusterController';
import {
    adminCommitUniversityImport,
    adminDownloadUniversityImportTemplate,
    adminDownloadUniversityImportErrors,
    adminGetUniversityImportJob,
    adminInitUniversityImport,
    adminValidateUniversityImport,
} from '../controllers/universityImportController';
import {
    adminCreateUniversityCategory,
    adminDeleteUniversityCategory,
    adminGetUniversityCategoryMaster,
    adminToggleUniversityCategory,
    adminUpdateUniversityCategory,
} from '../controllers/universityCategoryController';
import {
    adminGetBanners,
    adminCreateBanner,
    adminUpdateBanner,
    adminDeleteBanner,
    adminPublishBanner,
    adminSignBannerUpload,
} from '../controllers/bannerController';
import { getHomeConfig, updateHomeConfig } from '../controllers/homeConfigController';
import {
    adminGetAlerts,
    adminCreateAlert,
    adminUpdateAlert,
    adminDeleteAlert,
    adminToggleAlert,
    adminPublishAlert,
} from '../controllers/homeAlertController';
import {
    updateSettings,
    updateHome,
    updateHero,
    updatePromotionalBanner,
    updateAnnouncement,
    updateStats
} from '../controllers/homeSystemController';
import { uploadMedia, uploadMiddleware } from '../controllers/mediaController';
import {
    adminGetNews, adminCreateNews, adminUpdateNews, adminDeleteNews, adminToggleNewsPublish,
    adminGetResources, adminCreateResource, adminUpdateResource, adminDeleteResource,
    adminGetContactMessages, adminDeleteContactMessage,
    getSiteSettings, updateSiteSettings,
    adminExportNews, adminExportServices, adminExportUniversities as adminExportUniversitiesLegacy,
    adminGetNewsCategories, adminCreateNewsCategory, adminUpdateNewsCategory,
    adminDeleteNewsCategory, adminToggleNewsCategory,
} from '../controllers/cmsController';
import {
    adminGetServices, adminCreateService, adminUpdateService, adminDeleteService,
    adminReorderServices, adminToggleServiceStatus, adminToggleServiceFeatured
} from '../controllers/serviceController';
import {
    adminGetCategories, adminCreateCategory, adminUpdateCategory, adminDeleteCategory
} from '../controllers/serviceCategoryController';
import {
    createQuestion,
    getQuestions,
    getQuestionById,
    updateQuestion,
    deleteQuestion,
    bulkImportQuestions,
    getQuestionImportJob,
    approveQuestion,
    lockQuestion,
    searchSimilarQuestions,
    exportQuestions,
    revertQuestionRevision,
    signQuestionMediaUpload,
    createQuestionMedia,
} from '../controllers/questionBankController';
import {
    adminAssignBadge,
    adminConfirmGuardianOtp,
    adminCreateBadge,
    adminCreateNotification,
    adminDeleteBadge,
    adminDeleteNotification,
    adminExportStudentExamHistory,
    adminGetBadges,
    adminGetNotifications,
    adminGetStudentDashboardConfig,
    adminIssueGuardianOtp,
    adminRevokeBadge,
    adminToggleNotification,
    adminUpdateBadge,
    adminUpdateNotification,
    adminUpdateStudentDashboardConfig,
} from '../controllers/adminDashboardController';
import {
    getActiveSessions,
    forceLogoutUser,
    getSecuritySettings,
    updateSecuritySettings,
    getTwoFactorUsers,
    updateTwoFactorUser,
    resetTwoFactorUser,
    getTwoFactorFailures,
} from '../controllers/authController';
import {
    getRuntimeSettings,
    updateRuntimeSettingsController,
} from '../controllers/runtimeSettingsController';
import {
    adminCreateExpense,
    adminCreatePayment,
    adminCreateStaffPayout,
    adminDispatchReminders,
    adminFinanceStream,
    adminGetDues,
    adminGetExpenses,
    adminGetFinanceCashflow,
    adminGetFinanceExpenseBreakdown,
    adminGetFinanceRevenueSeries,
    adminGetFinanceSummary,
    adminGetFinanceTestBoard,
    adminGetPayments,
    adminGetStaffPayouts,
    adminGetStudentLtv,
    adminGetStudentPayments,
    adminSendDueReminder,
    adminUpdateDue,
    adminUpdateExpense,
    adminUpdatePayment,
} from '../controllers/adminFinanceController';
import {
    adminCreateNotice,
    adminGetNotices,
    adminGetSupportTickets,
    adminReplySupportTicket,
    adminToggleNotice,
    adminUpdateSupportTicketStatus,
} from '../controllers/adminSupportController';
import {
    adminDownloadBackup,
    adminListBackups,
    adminRestoreBackup,
    adminRunBackup,
} from '../controllers/backupController';
import {
    adminGetUsers, adminGetUserById, adminCreateUser, adminUpdateUser,
    adminUpdateUserRole, adminToggleUserStatus, adminGetAuditLogs as adminGetSystemAuditLogs, adminBulkImportStudents,
    adminGetStudentProfile, adminUpdateStudentProfile,
    adminResetUserPassword, adminExportStudents,
    adminDeleteUser, adminSetUserStatus, adminSetUserPermissions,
    adminBulkUserAction, adminGetUserActivity, adminGetAdminProfile, adminUpdateAdminProfile,
    adminUserStream,
    adminGetStudents, adminCreateStudent, adminUpdateStudent,
    adminRevealUserPassword,
    adminUpdateStudentSubscription, adminUpdateStudentGroups, adminGetStudentExams,
    adminGetStudentGroups, adminCreateStudentGroup, adminUpdateStudentGroup, adminDeleteStudentGroup,
    adminGetSubscriptionPlans, adminCreateSubscriptionPlan, adminUpdateSubscriptionPlan, adminToggleSubscriptionPlan,
    adminGetProfileUpdateRequests, adminApproveProfileUpdateRequest, adminRejectProfileUpdateRequest,
} from '../controllers/adminUserController';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const canEditExams = authorizePermission('canEditExams');
const canManageStudents = authorizePermission('canManageStudents');
const canViewReports = authorizePermission('canViewReports');
const canDeleteData = authorizePermission('canDeleteData');
const canManageFinance = authorizePermission('canManageFinance');
const canManagePlans = authorizePermission('canManagePlans');
const canManageTickets = authorizePermission('canManageTickets');
const canManageBackups = authorizePermission('canManageBackups');

/* All admin routes require auth + appropriate roles */
router.use(authenticate);

/* ── Health ── */
router.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'OK', message: 'Admin API is running', timestamp: new Date().toISOString() });
});
router.get('/openapi/exam-console.json', authorize('superadmin', 'admin', 'moderator', 'editor'), (_req: Request, res: Response) => {
    const candidatePaths = [
        path.resolve(process.cwd(), '../docs/openapi/exam-console.json'),
        path.resolve(process.cwd(), 'docs/openapi/exam-console.json'),
    ];
    const filePath = candidatePaths.find((candidate) => fs.existsSync(candidate));
    if (!filePath) {
        res.status(404).json({ message: 'OpenAPI artifact not found.' });
        return;
    }
    res.sendFile(filePath);
});
router.get('/openapi/question-bank.json', authorize('superadmin', 'admin', 'moderator', 'editor'), (_req: Request, res: Response) => {
    const candidatePaths = [
        path.resolve(process.cwd(), '../docs/openapi/question-bank.json'),
        path.resolve(process.cwd(), 'docs/openapi/question-bank.json'),
    ];
    const filePath = candidatePaths.find((candidate) => fs.existsSync(candidate));
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
router.get('/settings', authorize('superadmin', 'admin'), getSiteSettings);
router.put('/settings', authorize('superadmin', 'admin'), updateSiteSettings);
router.get('/settings/runtime', authorize('superadmin', 'admin'), getRuntimeSettings);
router.put('/settings/runtime', authorize('superadmin', 'admin'), updateRuntimeSettingsController);

/* ── Security ── */
router.get('/security/settings', authorize('superadmin', 'admin'), getSecuritySettings);
router.put('/security/settings', authorize('superadmin', 'admin'), updateSecuritySettings);
router.get('/security/sessions', authorize('superadmin', 'admin', 'moderator'), canManageStudents, getActiveSessions);
router.post('/security/force-logout', authorize('superadmin', 'admin'), canManageStudents, forceLogoutUser);
router.get('/security/2fa/users', authorize('superadmin', 'admin'), canManageStudents, getTwoFactorUsers);
router.patch('/security/2fa/users/:id', authorize('superadmin', 'admin'), canManageStudents, updateTwoFactorUser);
router.post('/security/2fa/users/:id/reset', authorize('superadmin', 'admin'), canManageStudents, resetTwoFactorUser);
router.get('/security/2fa/failures', authorize('superadmin', 'admin'), canManageStudents, getTwoFactorFailures);

/* ── Exams ── */
router.get('/exams', authorize('superadmin', 'admin', 'moderator', 'editor'), adminGetExams);
router.get('/exams/daily-report', authorize('superadmin', 'admin', 'moderator'), canViewReports, adminDailyReport);
router.get('/exams/live-sessions', authorize('superadmin', 'admin', 'moderator'), canViewReports, adminGetLiveExamSessions);
router.get('/live/attempts', authorize('superadmin', 'admin', 'moderator'), canViewReports, adminGetLiveExamSessions);
router.get('/live/stream', authorize('superadmin', 'admin', 'moderator'), canViewReports, adminLiveStream);
router.post('/live/attempts/:attemptId/action', authorize('superadmin', 'admin', 'moderator'), canEditExams, adminLiveAttemptAction);
router.get('/exams/:id', authorize('superadmin', 'admin', 'moderator', 'editor'), adminGetExamById);
router.post('/exams', authorize('superadmin', 'admin', 'moderator'), canEditExams, adminCreateExam);
router.post('/exams/sign-banner-upload', authorize('superadmin', 'admin', 'moderator'), canEditExams, adminSignExamBannerUpload);
router.post('/exams/:id/clone', authorize('superadmin', 'admin', 'moderator'), canEditExams, adminCloneExam);
router.post('/exams/:id/share-link/regenerate', authorize('superadmin', 'admin', 'moderator'), canEditExams, adminRegenerateExamShareLink);
router.put('/exams/:id', authorize('superadmin', 'admin', 'moderator'), canEditExams, adminUpdateExam);
router.delete('/exams/:id', authorize('superadmin', 'admin'), canDeleteData, adminDeleteExam);
router.patch('/exams/:id/publish', authorize('superadmin', 'admin', 'moderator'), canEditExams, adminPublishExam);
router.patch('/exams/:id/publish-result', authorize('superadmin', 'admin'), canEditExams, adminPublishResult);
router.patch('/exams/:examId/force-submit/:studentId', authorize('superadmin', 'admin', 'moderator'), canEditExams, adminForceSubmit);
router.patch('/exams/evaluate/:resultId', authorize('superadmin', 'admin', 'moderator', 'editor'), canEditExams, adminEvaluateResult);
router.get('/exams/:examId/analytics', authorize('superadmin', 'admin', 'moderator'), canViewReports, adminGetExamAnalytics);
router.get('/exams/:examId/export', authorize('superadmin', 'admin'), canViewReports, adminExportExamResults);
router.get('/exams/:id/events/export', authorize('superadmin', 'admin', 'moderator'), canViewReports, adminExportExamEvents);
router.post('/exams/:id/preview/start', authorize('superadmin', 'admin', 'moderator'), canEditExams, adminStartExamPreview);
router.patch('/exams/:examId/reset-attempt/:userId', authorize('superadmin', 'admin'), canEditExams, adminResetExamAttempt);

/* ── Questions (per-exam) ── */
router.get('/exams/:examId/questions', authorize('superadmin', 'admin', 'moderator', 'editor'), adminGetQuestions);
router.post('/exams/:examId/questions', authorize('superadmin', 'admin', 'moderator', 'editor'), canEditExams, adminCreateQuestion);
router.put('/exams/:examId/questions/reorder', authorize('superadmin', 'admin', 'moderator'), canEditExams, adminReorderQuestions);
router.put('/exams/:examId/questions/:questionId', authorize('superadmin', 'admin', 'moderator', 'editor'), canEditExams, adminUpdateQuestion);
router.delete('/exams/:examId/questions/:questionId', authorize('superadmin', 'admin', 'moderator'), canEditExams, adminDeleteQuestion);
router.post('/exams/:examId/questions/import-excel', authorize('superadmin', 'admin', 'moderator'), canEditExams, adminImportQuestionsFromExcel);

/* ── Global Question Bank ── */
router.get('/question-bank', authorize('superadmin', 'admin', 'moderator', 'editor'), getQuestions);
router.get('/question-bank/:id', authorize('superadmin', 'admin', 'moderator', 'editor'), getQuestionById);
router.post('/question-bank', authorize('superadmin', 'admin', 'moderator', 'editor'), canEditExams, createQuestion);
router.put('/question-bank/:id', authorize('superadmin', 'admin', 'moderator', 'editor'), canEditExams, updateQuestion);
router.delete('/question-bank/:id', authorize('superadmin', 'admin', 'moderator'), canDeleteData, deleteQuestion);
router.post('/question-bank/:id/approve', authorize('superadmin', 'admin', 'moderator'), canEditExams, approveQuestion);
router.post('/question-bank/:id/lock', authorize('superadmin', 'admin', 'moderator'), canEditExams, lockQuestion);
router.post('/question-bank/:id/revert/:revisionNo', authorize('superadmin', 'admin', 'moderator', 'editor'), canEditExams, revertQuestionRevision);
router.post('/question-bank/search/similar', authorize('superadmin', 'admin', 'moderator', 'editor'), searchSimilarQuestions);
router.post('/question-bank/bulk-import', authorize('superadmin', 'admin', 'moderator'), canEditExams, upload.single('file'), bulkImportQuestions);
router.get('/question-bank/import/:jobId', authorize('superadmin', 'admin', 'moderator', 'editor'), getQuestionImportJob);
router.post('/question-bank/export', authorize('superadmin', 'admin', 'moderator', 'editor'), exportQuestions);
router.post('/question-bank/media/sign-upload', authorize('superadmin', 'admin', 'moderator', 'editor'), canEditExams, signQuestionMediaUpload);
router.post('/question-bank/media', authorize('superadmin', 'admin', 'moderator', 'editor'), canEditExams, createQuestionMedia);
router.get('/qbank', authorize('superadmin', 'admin', 'moderator', 'editor'), getQuestions);
router.get('/qbank/:id', authorize('superadmin', 'admin', 'moderator', 'editor'), getQuestionById);
router.post('/qbank', authorize('superadmin', 'admin', 'moderator', 'editor'), canEditExams, createQuestion);
router.put('/qbank/:id', authorize('superadmin', 'admin', 'moderator', 'editor'), canEditExams, updateQuestion);
router.delete('/qbank/:id', authorize('superadmin', 'admin', 'moderator'), canDeleteData, deleteQuestion);
router.post('/qbank/:id/approve', authorize('superadmin', 'admin', 'moderator'), canEditExams, approveQuestion);
router.post('/qbank/:id/lock', authorize('superadmin', 'admin', 'moderator'), canEditExams, lockQuestion);
router.post('/qbank/:id/revert/:revisionNo', authorize('superadmin', 'admin', 'moderator', 'editor'), canEditExams, revertQuestionRevision);
router.post('/qbank/search/similar', authorize('superadmin', 'admin', 'moderator', 'editor'), searchSimilarQuestions);
router.post('/qbank/bulk-import', authorize('superadmin', 'admin', 'moderator'), canEditExams, upload.single('file'), bulkImportQuestions);
router.get('/qbank/import/:jobId', authorize('superadmin', 'admin', 'moderator', 'editor'), getQuestionImportJob);
router.post('/qbank/export', authorize('superadmin', 'admin', 'moderator', 'editor'), exportQuestions);
router.post('/qbank/media/sign-upload', authorize('superadmin', 'admin', 'moderator', 'editor'), canEditExams, signQuestionMediaUpload);
router.post('/qbank/media', authorize('superadmin', 'admin', 'moderator', 'editor'), canEditExams, createQuestionMedia);

/* ── Universities (Full CRUD) ── */
router.get('/universities', authorize('superadmin', 'admin', 'moderator', 'editor'), adminGetAllUniversities);
router.get('/universities/categories', authorize('superadmin', 'admin', 'moderator', 'editor'), adminGetUniversityCategories);
router.get('/university-categories', authorize('superadmin', 'admin', 'moderator', 'editor'), adminGetUniversityCategoryMaster);
router.post('/university-categories', authorize('superadmin', 'admin', 'moderator'), adminCreateUniversityCategory);
router.put('/university-categories/:id', authorize('superadmin', 'admin', 'moderator'), adminUpdateUniversityCategory);
router.patch('/university-categories/:id/toggle', authorize('superadmin', 'admin', 'moderator'), adminToggleUniversityCategory);
router.delete('/university-categories/:id', authorize('superadmin', 'admin'), adminDeleteUniversityCategory);
router.get('/universities/export', authorize('superadmin', 'admin', 'moderator', 'editor'), adminExportUniversities);
router.put('/universities/reorder-featured', authorize('superadmin', 'admin', 'moderator'), adminReorderFeaturedUniversities);
router.post('/universities/bulk-delete', authorize('superadmin', 'admin'), adminBulkDeleteUniversities);
router.patch('/universities/bulk-update', authorize('superadmin', 'admin', 'moderator'), adminBulkUpdateUniversities);
router.get('/universities/import/template', authorize('superadmin', 'admin', 'moderator', 'editor'), adminDownloadUniversityImportTemplate);
router.post('/universities/import/init', authorize('superadmin', 'admin'), upload.single('file'), adminInitUniversityImport);
router.post('/universities/import/:jobId/validate', authorize('superadmin', 'admin', 'moderator'), adminValidateUniversityImport);
router.post('/universities/import/:jobId/commit', authorize('superadmin', 'admin'), adminCommitUniversityImport);
router.get('/universities/import/:jobId/errors.csv', authorize('superadmin', 'admin', 'moderator'), adminDownloadUniversityImportErrors);
router.get('/universities/import/:jobId', authorize('superadmin', 'admin', 'moderator', 'editor'), adminGetUniversityImportJob);
router.get('/universities/:id', authorize('superadmin', 'admin', 'moderator', 'editor'), adminGetUniversityById);
router.post('/universities', authorize('superadmin', 'admin', 'moderator'), adminCreateUniversity);
router.put('/universities/:id', authorize('superadmin', 'admin', 'moderator'), adminUpdateUniversity);
router.delete('/universities/:id', authorize('superadmin', 'admin'), canDeleteData, adminDeleteUniversity);
router.patch('/universities/:id/toggle-status', authorize('superadmin', 'admin'), adminToggleUniversityStatus);
router.post('/universities/import-excel', authorize('superadmin', 'admin'), upload.single('file'), adminBulkImportUniversities);

/* â”€â”€ University Clusters â”€â”€ */
router.get('/university-clusters', authorize('superadmin', 'admin', 'moderator', 'editor'), adminGetUniversityClusters);
router.post('/university-clusters', authorize('superadmin', 'admin', 'moderator'), adminCreateUniversityCluster);
router.get('/university-clusters/:id', authorize('superadmin', 'admin', 'moderator', 'editor'), adminGetUniversityClusterById);
router.put('/university-clusters/:id', authorize('superadmin', 'admin', 'moderator'), adminUpdateUniversityCluster);
router.post('/university-clusters/:id/members/resolve', authorize('superadmin', 'admin', 'moderator'), adminResolveUniversityClusterMembers);
router.patch('/university-clusters/:id/sync-dates', authorize('superadmin', 'admin', 'moderator'), adminSyncUniversityClusterDates);
router.delete('/university-clusters/:id', authorize('superadmin', 'admin'), adminDeleteUniversityCluster);

/* ── News CRUD ── */
router.get('/news', authorize('superadmin', 'admin', 'moderator', 'editor'), adminGetNews);
router.post('/news', authorize('superadmin', 'admin', 'moderator', 'editor'), adminCreateNews);
router.put('/news/:id', authorize('superadmin', 'admin', 'moderator', 'editor'), adminUpdateNews);
router.delete('/news/:id', authorize('superadmin', 'admin'), canDeleteData, adminDeleteNews);
router.patch('/news/:id/toggle-publish', authorize('superadmin', 'admin', 'moderator', 'editor'), adminToggleNewsPublish);

/* ── News Categories ── */
router.get('/news-category', authorize('superadmin', 'admin', 'moderator', 'editor'), adminGetNewsCategories);
router.post('/news-category', authorize('superadmin', 'admin'), adminCreateNewsCategory);
router.put('/news-category/:id', authorize('superadmin', 'admin'), adminUpdateNewsCategory);
router.delete('/news-category/:id', authorize('superadmin', 'admin'), adminDeleteNewsCategory);
router.patch('/news-category/:id/toggle', authorize('superadmin', 'admin'), adminToggleNewsCategory);

/* ── Service Categories ── */
router.get('/service-categories', authorize('superadmin', 'admin', 'moderator', 'editor'), adminGetCategories);
router.post('/service-categories', authorize('superadmin', 'admin'), adminCreateCategory);
router.put('/service-categories/:id', authorize('superadmin', 'admin'), adminUpdateCategory);
router.delete('/service-categories/:id', authorize('superadmin', 'admin'), adminDeleteCategory);

/* ── Services CRUD ── */
router.get('/services', authorize('superadmin', 'admin', 'moderator', 'editor'), adminGetServices);
router.post('/services', authorize('superadmin', 'admin', 'moderator'), adminCreateService);
router.put('/services/:id', authorize('superadmin', 'admin', 'moderator'), adminUpdateService);
router.delete('/services/:id', authorize('superadmin', 'admin'), canDeleteData, adminDeleteService);
router.post('/services/reorder', authorize('superadmin', 'admin', 'moderator'), adminReorderServices);
router.patch('/services/:id/toggle-status', authorize('superadmin', 'admin', 'moderator'), adminToggleServiceStatus);
router.patch('/services/:id/toggle-featured', authorize('superadmin', 'admin', 'moderator'), adminToggleServiceFeatured);

/* ── Resources CRUD ── */
router.get('/resources', authorize('superadmin', 'admin', 'moderator', 'editor'), adminGetResources);
router.post('/resources', authorize('superadmin', 'admin', 'moderator', 'editor'), adminCreateResource);
router.put('/resources/:id', authorize('superadmin', 'admin', 'moderator', 'editor'), adminUpdateResource);
router.delete('/resources/:id', authorize('superadmin', 'admin', 'moderator'), canDeleteData, adminDeleteResource);

/* ── Contact Messages ── */
router.get('/contact-messages', authorize('superadmin', 'admin', 'moderator'), adminGetContactMessages);
router.delete('/contact-messages/:id', authorize('superadmin', 'admin'), canDeleteData, adminDeleteContactMessage);

/* ── Banners & Config ── */
router.get('/banners', authorize('superadmin', 'admin', 'moderator', 'editor'), adminGetBanners);
router.get('/banners/active', authorize('superadmin', 'admin', 'moderator', 'editor'), adminGetBanners);
router.post('/banners/sign-upload', authorize('superadmin', 'admin', 'moderator'), adminSignBannerUpload);
router.post('/banners', authorize('superadmin', 'admin', 'moderator'), adminCreateBanner);
router.put('/banners/:id', authorize('superadmin', 'admin', 'moderator'), adminUpdateBanner);
router.delete('/banners/:id', authorize('superadmin', 'admin'), canDeleteData, adminDeleteBanner);
router.put('/banners/:id/publish', authorize('superadmin', 'admin', 'moderator'), adminPublishBanner);

/* ── Home Alerts (Live Ticker) ── */
router.get('/home-alerts', authorize('superadmin', 'admin', 'moderator', 'editor'), adminGetAlerts);
router.post('/home-alerts', authorize('superadmin', 'admin', 'moderator'), adminCreateAlert);
router.put('/home-alerts/:id', authorize('superadmin', 'admin', 'moderator'), adminUpdateAlert);
router.delete('/home-alerts/:id', authorize('superadmin', 'admin'), canDeleteData, adminDeleteAlert);
router.patch('/home-alerts/:id/toggle', authorize('superadmin', 'admin', 'moderator'), adminToggleAlert);
router.put('/home-alerts/:id/publish', authorize('superadmin', 'admin', 'moderator'), adminPublishAlert);
router.get('/alerts', authorize('superadmin', 'admin', 'moderator', 'editor'), adminGetAlerts);
router.post('/alerts', authorize('superadmin', 'admin', 'moderator'), adminCreateAlert);
router.put('/alerts/:id', authorize('superadmin', 'admin', 'moderator'), adminUpdateAlert);
router.put('/alerts/:id/publish', authorize('superadmin', 'admin', 'moderator'), adminPublishAlert);
router.delete('/alerts/:id', authorize('superadmin', 'admin'), canDeleteData, adminDeleteAlert);
router.patch('/alerts/:id/toggle', authorize('superadmin', 'admin', 'moderator'), adminToggleAlert);

router.get('/home-config', authorize('superadmin', 'admin', 'editor'), getHomeConfig);
router.put('/home-config', authorize('superadmin', 'admin', 'editor'), updateHomeConfig);

/* ── Dynamic Home System ── */
router.put('/home/settings', authorize('superadmin', 'admin'), uploadMiddleware.fields([{ name: 'logo', maxCount: 1 }, { name: 'favicon', maxCount: 1 }]), updateSettings);
router.put('/home', authorize('superadmin', 'admin'), updateHome);
router.put('/home/hero', authorize('superadmin', 'admin', 'moderator', 'editor'), uploadMiddleware.single('file'), updateHero);
router.put('/home/banner', authorize('superadmin', 'admin'), uploadMiddleware.single('image'), updatePromotionalBanner);
router.put('/home/announcement', authorize('superadmin', 'admin', 'moderator'), updateAnnouncement);
router.put('/home/stats', authorize('superadmin', 'admin'), updateStats);

/* ── Media ── */
router.post('/upload', authorize('superadmin', 'admin', 'moderator', 'editor'), uploadMiddleware.single('file'), uploadMedia);

/* ── Student & User Management ── */
router.get('/users/admin/profile', authorize('superadmin', 'admin', 'moderator', 'editor'), adminGetAdminProfile);
router.put('/users/admin/profile', authorize('superadmin', 'admin', 'moderator', 'editor'), adminUpdateAdminProfile);

router.get('/users', authorize('superadmin'), adminGetUsers);
router.get('/users/activity', authorize('superadmin', 'admin'), adminGetUserActivity);
router.get('/users/stream', authorize('superadmin', 'admin'), adminUserStream);
router.get('/users/:id', authorize('superadmin', 'admin'), adminGetUserById);
router.post('/users', authorize('superadmin'), adminCreateUser);
router.put('/users/:id', authorize('superadmin'), adminUpdateUser);
router.put('/users/:id/role', authorize('superadmin'), adminUpdateUserRole);
router.patch('/users/:id/toggle-status', authorize('superadmin', 'admin'), adminToggleUserStatus);
router.delete('/users/:id', authorize('superadmin'), adminDeleteUser);
router.patch('/users/:id/set-status', authorize('superadmin'), adminSetUserStatus);
router.patch('/users/:id/permissions', authorize('superadmin'), adminSetUserPermissions);
router.post('/users/bulk-action', authorize('superadmin'), adminBulkUserAction);
router.get('/audit-logs', authorize('superadmin'), adminGetSystemAuditLogs);

/* ── Extended Student Management ── */
router.get('/students', authorize('superadmin', 'admin', 'moderator'), canManageStudents, adminGetStudents);
router.post('/students', authorize('superadmin', 'admin', 'moderator'), canManageStudents, adminCreateStudent);
router.put('/students/:id', authorize('superadmin', 'admin', 'moderator'), canManageStudents, adminUpdateStudent);
router.post('/students/bulk-import', authorize('superadmin', 'admin', 'moderator'), canManageStudents, uploadMiddleware.single('file'), adminBulkImportStudents);
router.get('/students/export', authorize('superadmin', 'admin'), canViewReports, adminExportStudents);
router.get('/students/:id/profile', authorize('superadmin', 'admin', 'moderator'), canManageStudents, adminGetStudentProfile);
router.put('/students/:id/profile', authorize('superadmin', 'admin'), canManageStudents, adminUpdateStudentProfile);
router.get('/students/:id/exams', authorize('superadmin', 'admin', 'moderator'), canViewReports, adminGetStudentExams);
router.get('/students/:id/report', authorize('superadmin', 'admin', 'moderator'), canViewReports, adminGetStudentReport);
router.get('/students/:id/export-history', authorize('superadmin', 'admin'), canViewReports, adminExportStudentExamHistory);
router.put('/students/:id/subscription', authorize('superadmin', 'admin'), canManageStudents, adminUpdateStudentSubscription);
router.patch('/students/:id/subscription', authorize('superadmin', 'admin'), canManageStudents, adminUpdateUserSubscription);
router.put('/students/:id/groups', authorize('superadmin', 'admin', 'moderator'), canManageStudents, adminUpdateStudentGroups);

/* ── Extracted Admin Features ── */
router.post('/users/:id/reset-password', authorize('superadmin', 'admin'), adminResetUserPassword);
router.post('/students/:id/reset-password', authorize('superadmin', 'admin'), canManageStudents, adminResetUserPassword);
router.post('/students/:id/password/reveal', authorize('superadmin'), authorizePermission('canRevealPasswords'), adminRevealUserPassword);
router.get('/students/profile-requests', authorize('superadmin', 'admin', 'moderator'), canManageStudents, adminGetProfileUpdateRequests);
router.post('/students/profile-requests/:id/approve', authorize('superadmin', 'admin'), canManageStudents, adminApproveProfileUpdateRequest);
router.post('/students/profile-requests/:id/reject', authorize('superadmin', 'admin'), canManageStudents, adminRejectProfileUpdateRequest);
router.get('/user-stream', authorize('superadmin', 'admin'), adminUserStream);

/* ── Exam Groups ── */
router.get('/student-groups', authorize('superadmin', 'admin', 'moderator'), adminGetStudentGroups);
router.post('/student-groups', authorize('superadmin', 'admin', 'moderator'), adminCreateStudentGroup);
router.put('/student-groups/:id', authorize('superadmin', 'admin', 'moderator'), adminUpdateStudentGroup);
router.delete('/student-groups/:id', authorize('superadmin', 'admin'), adminDeleteStudentGroup);

/* ── Subscription Plans ── */
router.get('/subscription-plans', authorize('superadmin', 'admin', 'moderator', 'editor'), adminGetSubscriptionPlans);
router.post('/subscription-plans', authorize('superadmin', 'admin'), canManagePlans, adminCreateSubscriptionPlan);
router.put('/subscription-plans/:id', authorize('superadmin', 'admin'), canManagePlans, adminUpdateSubscriptionPlan);
router.patch('/subscription-plans/:id/toggle', authorize('superadmin', 'admin'), canManagePlans, adminToggleSubscriptionPlan);

/* ── Student LTV ── */
router.get('/students/:id/ltv', authorize('superadmin', 'admin', 'moderator'), canManageFinance, adminGetStudentLtv);

/* ── Manual Payments ── */
router.get('/payments', authorize('superadmin', 'admin', 'moderator'), canManageFinance, adminGetPayments);
router.post('/payments', authorize('superadmin', 'admin', 'moderator'), canManageFinance, adminCreatePayment);
router.put('/payments/:id', authorize('superadmin', 'admin'), canManageFinance, adminUpdatePayment);
router.get('/students/:id/payments', authorize('superadmin', 'admin', 'moderator'), canManageFinance, adminGetStudentPayments);

/* ── Expenses ── */
router.get('/expenses', authorize('superadmin', 'admin', 'moderator'), canManageFinance, adminGetExpenses);
router.post('/expenses', authorize('superadmin', 'admin', 'moderator'), canManageFinance, adminCreateExpense);
router.put('/expenses/:id', authorize('superadmin', 'admin'), canManageFinance, adminUpdateExpense);

/* ── Staff Payouts ── */
router.get('/staff-payouts', authorize('superadmin', 'admin', 'moderator'), canManageFinance, adminGetStaffPayouts);
router.post('/staff-payouts', authorize('superadmin', 'admin'), canManageFinance, adminCreateStaffPayout);

/* ── Finance Analytics ── */
router.get('/finance/summary', authorize('superadmin', 'admin', 'moderator'), canManageFinance, adminGetFinanceSummary);
router.get('/finance/revenue-series', authorize('superadmin', 'admin', 'moderator'), canManageFinance, adminGetFinanceRevenueSeries);
router.get('/finance/expense-breakdown', authorize('superadmin', 'admin', 'moderator'), canManageFinance, adminGetFinanceExpenseBreakdown);
router.get('/finance/cashflow', authorize('superadmin', 'admin', 'moderator'), canManageFinance, adminGetFinanceCashflow);
router.get('/finance/test-board', authorize('superadmin', 'admin', 'moderator'), canManageFinance, adminGetFinanceTestBoard);
router.get('/finance/stream', authorize('superadmin', 'admin', 'moderator'), canManageFinance, adminFinanceStream);

/* ── Dues & Reminders ── */
router.get('/dues', authorize('superadmin', 'admin', 'moderator'), canManageFinance, adminGetDues);
router.patch('/dues/:studentId', authorize('superadmin', 'admin'), canManageFinance, adminUpdateDue);
router.post('/dues/:studentId/remind', authorize('superadmin', 'admin', 'moderator'), canManageFinance, adminSendDueReminder);
router.post('/reminders/dispatch', authorize('superadmin', 'admin'), canManageFinance, adminDispatchReminders);

/* ── Notices ── */
router.get('/notices', authorize('superadmin', 'admin', 'moderator', 'editor'), canManageTickets, adminGetNotices);
router.post('/notices', authorize('superadmin', 'admin', 'moderator'), canManageTickets, adminCreateNotice);
router.patch('/notices/:id/toggle', authorize('superadmin', 'admin', 'moderator'), canManageTickets, adminToggleNotice);

/* ── Support Tickets ── */
router.get('/support-tickets', authorize('superadmin', 'admin', 'moderator'), canManageTickets, adminGetSupportTickets);
router.patch('/support-tickets/:id/status', authorize('superadmin', 'admin', 'moderator'), canManageTickets, adminUpdateSupportTicketStatus);
router.post('/support-tickets/:id/reply', authorize('superadmin', 'admin', 'moderator'), canManageTickets, adminReplySupportTicket);

/* ── Backups ── */
router.post('/backups/run', authorize('superadmin', 'admin'), canManageBackups, adminRunBackup);
router.get('/backups', authorize('superadmin', 'admin', 'moderator'), canManageBackups, adminListBackups);
router.post('/backups/:id/restore', authorize('superadmin'), canManageBackups, adminRestoreBackup);
router.get('/backups/:id/download', authorize('superadmin', 'admin'), canManageBackups, adminDownloadBackup);
/* ── Badges ── */
router.get('/badges', authorize('superadmin', 'admin', 'moderator', 'editor'), adminGetBadges);
router.post('/badges', authorize('superadmin', 'admin'), adminCreateBadge);
router.put('/badges/:id', authorize('superadmin', 'admin'), adminUpdateBadge);
router.delete('/badges/:id', authorize('superadmin', 'admin'), adminDeleteBadge);
router.post('/students/:studentId/badges/:badgeId', authorize('superadmin', 'admin'), adminAssignBadge);
router.delete('/students/:studentId/badges/:badgeId', authorize('superadmin', 'admin'), adminRevokeBadge);

/* ── Student Dashboard Configurations ── */
router.get('/dashboard-config', authorize('superadmin', 'admin', 'moderator', 'editor'), adminGetStudentDashboardConfig);
router.put('/dashboard-config', authorize('superadmin', 'admin'), adminUpdateStudentDashboardConfig);

/* ── Notifications ── */
router.get('/notifications', authorize('superadmin', 'admin', 'moderator', 'editor'), adminGetNotifications);
router.post('/notifications', authorize('superadmin', 'admin', 'moderator'), adminCreateNotification);
router.put('/notifications/:id', authorize('superadmin', 'admin', 'moderator'), adminUpdateNotification);
router.patch('/notifications/:id/toggle', authorize('superadmin', 'admin', 'moderator'), adminToggleNotification);
router.delete('/notifications/:id', authorize('superadmin', 'admin'), adminDeleteNotification);

/* ── Parent / Guardian Link ── */
router.post('/students/:studentId/otp', authorize('superadmin', 'admin'), adminIssueGuardianOtp);
router.post('/students/:studentId/confirm-otp', authorize('superadmin', 'admin'), adminConfirmGuardianOtp);

/* ── Admin Dashboard Overrides ── */
router.post('/auth/mfa/confirm', authorize('superadmin', 'admin'), adminMfaConfirm);

/* ── Exports ── */
router.get('/export-news', authorize('superadmin', 'admin'), adminExportNews);
router.get('/export-services', authorize('superadmin', 'admin'), adminExportServices);
router.get('/export-universities', authorize('superadmin', 'admin'), adminExportUniversitiesLegacy);

export default router;



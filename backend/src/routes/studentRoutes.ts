import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import {
    getStudentProfile,
    updateStudentProfile,
    uploadStudentDocument,
    getStudentApplications,
    createStudentApplication
} from '../controllers/studentController';
import {
    getStudentDashboardAggregateHandler,
    getStudentDashboardProfile,
    getStudentExamHistory,
    getStudentFeaturedUniversities,
    getStudentNotificationFeed,
    getStudentUpcomingExams,
    getStudentDashboardStream,
} from '../controllers/studentDashboardController';
import { studentCreateSupportTicket, studentGetNotices, studentGetSupportTickets } from '../controllers/adminSupportController';
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

// Apply auth middleware to all student routes
router.use(authenticate);

import { uploadMiddleware } from '../controllers/mediaController';

// Profile Routes
router.get('/profile', getStudentProfile);
router.put('/profile', updateStudentProfile);
router.post('/profile/documents', uploadMiddleware.single('file'), uploadStudentDocument);
router.get('/dashboard', getStudentDashboardAggregateHandler);
router.get('/upcoming-exams', getStudentUpcomingExams);
router.get('/featured-universities', getStudentFeaturedUniversities);
router.get('/notifications', getStudentNotificationFeed);
router.get('/exam-history', getStudentExamHistory);
router.get('/dashboard-profile', getStudentDashboardProfile);
router.get('/dashboard/stream', getStudentDashboardStream);
router.get('/notices', studentGetNotices);
router.post('/support-tickets', studentCreateSupportTicket);
router.get('/support-tickets', studentGetSupportTickets);
router.get('/me', getStudentMe);
router.get('/me/exams', getStudentMeExams);
router.get('/me/exams/:examId', getStudentMeExamById);
router.get('/me/results', getStudentMeResults);
router.get('/me/results/:examId', getStudentMeResultByExam);
router.get('/me/payments', getStudentMePayments);
router.get('/me/notifications', getStudentMeNotifications);
router.post('/me/notifications/mark-read', markStudentNotificationsRead);
router.get('/me/resources', getStudentMeResources);
router.get('/payments', getStudentMePayments);
router.get('/notifications/feed', getStudentMeNotifications);
router.post('/notifications/mark-read', markStudentNotificationsRead);
router.get('/resources', getStudentMeResources);

// Application Routes
router.get('/applications', getStudentApplications);
router.post('/applications', createStudentApplication);

export default router;

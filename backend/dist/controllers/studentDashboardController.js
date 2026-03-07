"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStudentDashboardAggregateHandler = getStudentDashboardAggregateHandler;
exports.getStudentUpcomingExams = getStudentUpcomingExams;
exports.getStudentFeaturedUniversities = getStudentFeaturedUniversities;
exports.getStudentNotificationFeed = getStudentNotificationFeed;
exports.getStudentDashboardProfile = getStudentDashboardProfile;
exports.getStudentExamHistory = getStudentExamHistory;
exports.getStudentLiveAlertsHandler = getStudentLiveAlertsHandler;
exports.getStudentDashboardStream = getStudentDashboardStream;
const studentDashboardService_1 = require("../services/studentDashboardService");
const studentDashboardStream_1 = require("../realtime/studentDashboardStream");
function ensureStudent(req, res) {
    if (!req.user) {
        res.status(401).json({ message: 'Not authenticated' });
        return null;
    }
    if (req.user.role !== 'student') {
        res.status(403).json({ message: 'Student access only' });
        return null;
    }
    return req.user._id;
}
async function getStudentDashboardAggregateHandler(req, res) {
    try {
        const studentId = ensureStudent(req, res);
        if (!studentId)
            return;
        const payload = await (0, studentDashboardService_1.getStudentDashboardAggregate)(studentId);
        res.json(payload);
    }
    catch (err) {
        console.error('getStudentDashboardAggregateHandler error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}
async function getStudentUpcomingExams(req, res) {
    try {
        const studentId = ensureStudent(req, res);
        if (!studentId)
            return;
        const items = await (0, studentDashboardService_1.getUpcomingExamCards)(studentId);
        res.json({ items, lastUpdatedAt: new Date().toISOString() });
    }
    catch (err) {
        console.error('getStudentUpcomingExams error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}
async function getStudentFeaturedUniversities(req, res) {
    try {
        const studentId = ensureStudent(req, res);
        if (!studentId)
            return;
        const data = await (0, studentDashboardService_1.getFeaturedUniversities)();
        res.json(data);
    }
    catch (err) {
        console.error('getStudentFeaturedUniversities error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}
async function getStudentNotificationFeed(req, res) {
    try {
        const studentId = ensureStudent(req, res);
        if (!studentId)
            return;
        const data = await (0, studentDashboardService_1.getStudentNotifications)(studentId);
        res.json(data);
    }
    catch (err) {
        console.error('getStudentNotificationFeed error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}
async function getStudentDashboardProfile(req, res) {
    try {
        const studentId = ensureStudent(req, res);
        if (!studentId)
            return;
        const data = await (0, studentDashboardService_1.getStudentDashboardHeader)(studentId);
        res.json(data);
    }
    catch (err) {
        console.error('getStudentDashboardProfile error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}
async function getStudentExamHistory(req, res) {
    try {
        const studentId = ensureStudent(req, res);
        if (!studentId)
            return;
        const data = await (0, studentDashboardService_1.getExamHistoryAndProgress)(studentId);
        res.json(data);
    }
    catch (err) {
        console.error('getStudentExamHistory error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}
async function getStudentLiveAlertsHandler(req, res) {
    try {
        const studentId = ensureStudent(req, res);
        if (!studentId)
            return;
        const data = await (0, studentDashboardService_1.getStudentLiveAlerts)(studentId);
        res.json(data);
    }
    catch (err) {
        console.error('getStudentLiveAlertsHandler error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}
function getStudentDashboardStream(req, res) {
    const studentId = ensureStudent(req, res);
    if (!studentId)
        return;
    (0, studentDashboardStream_1.addStudentDashboardStreamClient)(res);
}
//# sourceMappingURL=studentDashboardController.js.map
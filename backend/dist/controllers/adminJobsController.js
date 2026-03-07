"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminGetJobRuns = adminGetJobRuns;
exports.adminGetJobHealth = adminGetJobHealth;
const jobRunLogService_1 = require("../services/jobRunLogService");
async function adminGetJobRuns(req, res) {
    try {
        const limit = Math.max(1, Math.min(500, Number(req.query.limit || 100)));
        const items = await (0, jobRunLogService_1.getRecentJobRuns)(limit);
        res.json({ items, total: items.length });
    }
    catch (error) {
        console.error('adminGetJobRuns error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}
async function adminGetJobHealth(req, res) {
    try {
        const hours = Math.max(1, Math.min(168, Number(req.query.hours || 24)));
        const health = await (0, jobRunLogService_1.getJobHealthWindow)(hours);
        res.json(health);
    }
    catch (error) {
        console.error('adminGetJobHealth error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}
//# sourceMappingURL=adminJobsController.js.map
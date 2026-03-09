"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startFinanceRecurringCronJobs = startFinanceRecurringCronJobs;
const node_cron_1 = __importDefault(require("node-cron"));
const financeCenterService_1 = require("../services/financeCenterService");
const User_1 = __importDefault(require("../models/User"));
let cachedSystemAdminId = null;
async function resolveSystemAdminId() {
    if (cachedSystemAdminId)
        return cachedSystemAdminId;
    const admin = await User_1.default.findOne({ role: { $in: ['superadmin', 'admin'] } }).select('_id').lean();
    cachedSystemAdminId = admin?._id ? String(admin._id) : 'system';
    return cachedSystemAdminId;
}
function startFinanceRecurringCronJobs() {
    // Run every hour at minute 15 — process any recurring rules that are due
    node_cron_1.default.schedule('15 * * * *', async () => {
        try {
            const settings = await (0, financeCenterService_1.getOrCreateFinanceSettings)();
            if (!settings.enableRecurringEngine)
                return;
            const adminId = await resolveSystemAdminId();
            const processed = await (0, financeCenterService_1.processDueRecurringRules)();
            if (processed > 0) {
                console.log(`[finance-cron] Processed ${processed} recurring rules`);
                await (0, financeCenterService_1.logFinanceAudit)({
                    actorId: adminId,
                    action: 'finance.recurring.cron-run',
                    targetType: 'FinanceRecurringRule',
                    details: { processed },
                    ip: '127.0.0.1',
                });
            }
        }
        catch (err) {
            console.error('[finance-cron] recurring rules error:', err);
        }
    });
    console.log('[finance-cron] Recurring engine cron registered');
}
//# sourceMappingURL=financeRecurringJobs.js.map
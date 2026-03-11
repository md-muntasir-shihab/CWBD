"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDefaultChartOfAccounts = seedDefaultChartOfAccounts;
const ChartOfAccounts_1 = __importDefault(require("../models/ChartOfAccounts"));
/**
 * Default Chart-of-Account entries seeded on startup.
 * Each has `isSystem: true` so admins cannot delete them.
 * The seed is idempotent — existing codes are skipped.
 */
const DEFAULT_COA_ENTRIES = [
    // Income accounts
    { code: 'REV_SUBSCRIPTION', name: 'Subscription Revenue', type: 'income', description: 'Student subscription plan payments' },
    { code: 'REV_EXAM', name: 'Exam Fee Revenue', type: 'income', description: 'Paid exam registration fees' },
    { code: 'REV_SERVICE', name: 'Service Revenue', type: 'income', description: 'Other paid services and features' },
    { code: 'REV_OTHER', name: 'Other Income', type: 'income', description: 'Miscellaneous income' },
    // Expense accounts
    { code: 'EXP_HOSTING', name: 'Hosting & Infrastructure', type: 'expense', description: 'Servers, cloud services, domain, CDN' },
    { code: 'EXP_PAYROLL', name: 'Payroll & Staff', type: 'expense', description: 'Salaries, freelance, and contractor payments' },
    { code: 'EXP_SMS', name: 'SMS Costs', type: 'expense', description: 'SMS gateway and notification costs' },
    { code: 'EXP_EMAIL', name: 'Email Costs', type: 'expense', description: 'Email service and transactional email costs' },
    { code: 'EXP_MARKETING', name: 'Marketing & Ads', type: 'expense', description: 'Advertising, promotions, and marketing campaigns' },
    { code: 'EXP_TOOLS', name: 'Tools & Software', type: 'expense', description: 'SaaS tools, licenses, and third-party services' },
    { code: 'EXP_MISC', name: 'Miscellaneous Expenses', type: 'expense', description: 'Other operational expenses' },
];
async function seedDefaultChartOfAccounts() {
    const existingCodes = new Set((await ChartOfAccounts_1.default.find({}, { code: 1 }).lean()).map(a => a.code));
    const toInsert = DEFAULT_COA_ENTRIES
        .filter(entry => !existingCodes.has(entry.code))
        .map(entry => ({ ...entry, isActive: true, isSystem: true }));
    if (toInsert.length === 0)
        return;
    await ChartOfAccounts_1.default.insertMany(toInsert);
    console.log(`[FinanceSeed] Seeded ${toInsert.length} default Chart-of-Account entries.`);
}
//# sourceMappingURL=financeSeedService.js.map
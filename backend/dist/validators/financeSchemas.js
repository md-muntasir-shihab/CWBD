"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.importCommitSchema = exports.processRefundSchema = exports.createRefundSchema = exports.updateSettingsSchema = exports.createVendorSchema = exports.createAccountSchema = exports.updateRecurringRuleSchema = exports.createRecurringRuleSchema = exports.updateBudgetSchema = exports.createBudgetSchema = exports.markInvoicePaidSchema = exports.updateInvoiceSchema = exports.createInvoiceSchema = exports.bulkIdsSchema = exports.updateTransactionSchema = exports.createTransactionSchema = void 0;
const zod_1 = require("zod");
// ── Shared primitives ───────────────────────────────────
const objectId = zod_1.z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid ObjectId').optional();
const direction = zod_1.z.enum(['income', 'expense']);
const status = zod_1.z.enum(['pending', 'approved', 'paid', 'cancelled', 'refunded']);
const method = zod_1.z.enum(['cash', 'bkash', 'nagad', 'bank', 'card', 'manual', 'gateway', 'upay', 'rocket']);
const sourceType = zod_1.z.enum([
    'subscription_payment', 'exam_payment', 'service_sale', 'manual_income',
    'expense', 'refund', 'sms_cost', 'email_cost', 'hosting_cost', 'staff_payout', 'other',
]);
const safeStr = zod_1.z.string().trim().max(1000);
const tags = zod_1.z.array(zod_1.z.string().trim().max(100)).max(20).optional();
// ── Transactions ────────────────────────────────────────
exports.createTransactionSchema = zod_1.z.object({
    direction,
    amount: zod_1.z.number().positive(),
    currency: zod_1.z.string().max(10).default('BDT'),
    dateUTC: zod_1.z.string().datetime().optional(),
    accountCode: safeStr.min(1),
    categoryLabel: safeStr.min(1),
    description: safeStr.optional(),
    status: status.optional(),
    method: method.optional(),
    sourceType: sourceType.optional(),
    sourceId: zod_1.z.string().max(200).optional(),
    studentId: objectId,
    planId: objectId,
    examId: objectId,
    serviceId: objectId,
    tags,
    costCenterId: safeStr.optional(),
    vendorId: objectId,
});
exports.updateTransactionSchema = zod_1.z.object({
    direction: direction.optional(),
    amount: zod_1.z.number().positive().optional(),
    currency: zod_1.z.string().max(10).optional(),
    dateUTC: zod_1.z.string().datetime().optional(),
    accountCode: safeStr.optional(),
    categoryLabel: safeStr.optional(),
    description: safeStr.optional(),
    status: status.optional(),
    method: method.optional(),
    tags,
    costCenterId: safeStr.optional(),
    vendorId: objectId,
}).refine((d) => Object.keys(d).length > 0, { message: 'At least one field required' });
exports.bulkIdsSchema = zod_1.z.object({
    ids: zod_1.z.array(zod_1.z.string().regex(/^[a-fA-F0-9]{24}$/)).min(1).max(500),
});
// ── Invoices ────────────────────────────────────────────
exports.createInvoiceSchema = zod_1.z.object({
    studentId: objectId,
    purpose: zod_1.z.enum(['subscription', 'exam', 'service', 'custom']),
    planId: objectId,
    examId: objectId,
    serviceId: objectId,
    amountBDT: zod_1.z.number().positive(),
    dueDateUTC: zod_1.z.string().datetime().optional(),
    notes: safeStr.optional(),
});
exports.updateInvoiceSchema = zod_1.z.object({
    amountBDT: zod_1.z.number().positive().optional(),
    paidAmountBDT: zod_1.z.number().min(0).optional(),
    status: zod_1.z.enum(['unpaid', 'partial', 'paid', 'cancelled', 'overdue']).optional(),
    dueDateUTC: zod_1.z.string().datetime().optional(),
    notes: safeStr.optional(),
}).refine((d) => Object.keys(d).length > 0, { message: 'At least one field required' });
exports.markInvoicePaidSchema = zod_1.z.object({
    paidAmount: zod_1.z.number().positive().optional(),
});
// ── Budgets ─────────────────────────────────────────────
exports.createBudgetSchema = zod_1.z.object({
    month: zod_1.z.string().regex(/^\d{4}-\d{2}$/, 'Format: YYYY-MM'),
    accountCode: safeStr.min(1),
    categoryLabel: safeStr.min(1),
    amountLimit: zod_1.z.number().positive(),
    alertThresholdPercent: zod_1.z.number().min(1).max(100).default(80),
    direction,
    costCenterId: safeStr.optional(),
    notes: safeStr.optional(),
});
exports.updateBudgetSchema = zod_1.z.object({
    accountCode: safeStr.optional(),
    categoryLabel: safeStr.optional(),
    amountLimit: zod_1.z.number().positive().optional(),
    alertThresholdPercent: zod_1.z.number().min(1).max(100).optional(),
    direction: direction.optional(),
    costCenterId: safeStr.optional(),
    notes: safeStr.optional(),
}).refine((d) => Object.keys(d).length > 0, { message: 'At least one field required' });
// ── Recurring Rules ─────────────────────────────────────
exports.createRecurringRuleSchema = zod_1.z.object({
    name: safeStr.min(1),
    direction,
    amount: zod_1.z.number().positive(),
    currency: zod_1.z.string().max(10).default('BDT'),
    accountCode: safeStr.min(1),
    categoryLabel: safeStr.min(1),
    description: safeStr.optional(),
    method: method.optional(),
    tags,
    costCenterId: safeStr.optional(),
    vendorId: objectId,
    frequency: zod_1.z.enum(['monthly', 'weekly', 'yearly', 'custom']),
    dayOfMonth: zod_1.z.number().int().min(1).max(31).optional(),
    intervalDays: zod_1.z.number().int().min(1).max(365).optional(),
    nextRunAtUTC: zod_1.z.string().datetime().optional(),
    endAtUTC: zod_1.z.string().datetime().optional(),
    isActive: zod_1.z.boolean().default(true),
});
exports.updateRecurringRuleSchema = zod_1.z.object({
    name: safeStr.optional(),
    direction: direction.optional(),
    amount: zod_1.z.number().positive().optional(),
    accountCode: safeStr.optional(),
    categoryLabel: safeStr.optional(),
    description: safeStr.optional(),
    method: method.optional(),
    tags,
    costCenterId: safeStr.optional(),
    vendorId: objectId,
    frequency: zod_1.z.enum(['monthly', 'weekly', 'yearly', 'custom']).optional(),
    dayOfMonth: zod_1.z.number().int().min(1).max(31).optional(),
    intervalDays: zod_1.z.number().int().min(1).max(365).optional(),
    nextRunAtUTC: zod_1.z.string().datetime().optional(),
    endAtUTC: zod_1.z.string().datetime().optional(),
    isActive: zod_1.z.boolean().optional(),
}).refine((d) => Object.keys(d).length > 0, { message: 'At least one field required' });
// ── Chart of Accounts ───────────────────────────────────
exports.createAccountSchema = zod_1.z.object({
    code: zod_1.z.string().trim().min(1).max(50).transform((s) => s.toUpperCase()),
    name: safeStr.min(1),
    type: zod_1.z.enum(['income', 'expense', 'asset', 'liability']),
    parentCode: zod_1.z.string().max(50).optional(),
    description: safeStr.optional(),
});
// ── Vendors ─────────────────────────────────────────────
exports.createVendorSchema = zod_1.z.object({
    name: safeStr.min(1),
    contact: safeStr.optional(),
    email: zod_1.z.string().email().optional().or(zod_1.z.literal('')),
    phone: safeStr.optional(),
    address: safeStr.optional(),
    category: safeStr.optional(),
    notes: safeStr.optional(),
});
// ── Settings ────────────────────────────────────────────
exports.updateSettingsSchema = zod_1.z.object({
    defaultCurrency: zod_1.z.string().max(10).optional(),
    requireApprovalForExpense: zod_1.z.boolean().optional(),
    requireApprovalForIncome: zod_1.z.boolean().optional(),
    enableBudgets: zod_1.z.boolean().optional(),
    enableRecurringEngine: zod_1.z.boolean().optional(),
    receiptRequiredAboveAmount: zod_1.z.number().min(0).optional(),
    exportFooterNote: zod_1.z.string().max(2000).optional(),
    smsCostPerMessageBDT: zod_1.z.number().min(0).optional(),
    emailCostPerMessageBDT: zod_1.z.number().min(0).optional(),
    costCenters: zod_1.z.array(zod_1.z.string().trim().max(100)).max(50).optional(),
});
// ── Refunds ─────────────────────────────────────────────
exports.createRefundSchema = zod_1.z.object({
    originalPaymentId: objectId,
    financeTxnId: objectId,
    studentId: objectId,
    amountBDT: zod_1.z.number().positive(),
    reason: safeStr.min(1),
});
exports.processRefundSchema = zod_1.z.object({
    action: zod_1.z.enum(['approve', 'reject']),
    rejectionNote: safeStr.optional(),
});
// ── Import ──────────────────────────────────────────────
exports.importCommitSchema = zod_1.z.object({
    rows: zod_1.z.array(zod_1.z.object({
        direction: direction.optional(),
        amount: zod_1.z.number().positive(),
        accountCode: safeStr.min(1),
        categoryLabel: safeStr.min(1),
        description: safeStr.optional(),
        method: method.optional(),
        dateUTC: zod_1.z.string().optional(),
        tags: zod_1.z.array(zod_1.z.string()).optional(),
    })).min(1).max(5000),
});
//# sourceMappingURL=financeSchemas.js.map
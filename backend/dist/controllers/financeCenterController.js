"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fcGetDashboard = fcGetDashboard;
exports.fcGetTransactions = fcGetTransactions;
exports.fcGetTransaction = fcGetTransaction;
exports.fcCreateTransaction = fcCreateTransaction;
exports.fcUpdateTransaction = fcUpdateTransaction;
exports.fcDeleteTransaction = fcDeleteTransaction;
exports.fcRestoreTransaction = fcRestoreTransaction;
exports.fcBulkApproveTransactions = fcBulkApproveTransactions;
exports.fcBulkMarkPaid = fcBulkMarkPaid;
exports.fcGetInvoices = fcGetInvoices;
exports.fcCreateInvoice = fcCreateInvoice;
exports.fcUpdateInvoice = fcUpdateInvoice;
exports.fcMarkInvoicePaid = fcMarkInvoicePaid;
exports.fcGetBudgets = fcGetBudgets;
exports.fcCreateBudget = fcCreateBudget;
exports.fcUpdateBudget = fcUpdateBudget;
exports.fcDeleteBudget = fcDeleteBudget;
exports.fcGetRecurringRules = fcGetRecurringRules;
exports.fcCreateRecurringRule = fcCreateRecurringRule;
exports.fcUpdateRecurringRule = fcUpdateRecurringRule;
exports.fcDeleteRecurringRule = fcDeleteRecurringRule;
exports.fcRunRecurringRuleNow = fcRunRecurringRuleNow;
exports.fcGetChartOfAccounts = fcGetChartOfAccounts;
exports.fcCreateAccount = fcCreateAccount;
exports.fcGetVendors = fcGetVendors;
exports.fcCreateVendor = fcCreateVendor;
exports.fcGetSettings = fcGetSettings;
exports.fcUpdateSettings = fcUpdateSettings;
exports.fcGetAuditLogs = fcGetAuditLogs;
exports.fcGetAuditLogDetail = fcGetAuditLogDetail;
exports.fcExportTransactions = fcExportTransactions;
exports.fcImportPreview = fcImportPreview;
exports.fcImportCommit = fcImportCommit;
exports.fcDownloadTemplate = fcDownloadTemplate;
exports.fcGetRefunds = fcGetRefunds;
exports.fcCreateRefund = fcCreateRefund;
exports.fcApproveRefund = fcApproveRefund;
exports.fcGeneratePLReport = fcGeneratePLReport;
const mongoose_1 = __importDefault(require("mongoose"));
const exceljs_1 = __importDefault(require("exceljs"));
const FinanceTransaction_1 = __importDefault(require("../models/FinanceTransaction"));
const FinanceInvoice_1 = __importDefault(require("../models/FinanceInvoice"));
const FinanceBudget_1 = __importDefault(require("../models/FinanceBudget"));
const FinanceRecurringRule_1 = __importDefault(require("../models/FinanceRecurringRule"));
const FinanceVendor_1 = __importDefault(require("../models/FinanceVendor"));
const ChartOfAccounts_1 = __importDefault(require("../models/ChartOfAccounts"));
const FinanceRefund_1 = __importDefault(require("../models/FinanceRefund"));
const AuditLog_1 = __importDefault(require("../models/AuditLog"));
const requestMeta_1 = require("../utils/requestMeta");
const financeCenterService_1 = require("../services/financeCenterService");
// ── Helpers ─────────────────────────────────────────────
function oid(val) {
    const s = String(val || '').trim();
    return s && mongoose_1.default.Types.ObjectId.isValid(s) ? new mongoose_1.default.Types.ObjectId(s) : null;
}
function num(v, fallback = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
}
function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
}
function paginate(query) {
    const page = Math.max(1, Math.floor(num(query.page, 1)));
    const limit = clamp(Math.floor(num(query.limit, 20)), 1, 200);
    return { page, limit, skip: (page - 1) * limit };
}
function dateRange(query) {
    const matcher = {};
    if (query.dateFrom) {
        const d = new Date(String(query.dateFrom));
        if (!isNaN(d.getTime()))
            matcher.$gte = d;
    }
    if (query.dateTo) {
        const d = new Date(String(query.dateTo));
        if (!isNaN(d.getTime()))
            matcher.$lte = d;
    }
    return Object.keys(matcher).length > 0 ? matcher : null;
}
function sanitize(s) {
    return String(s || '').trim().slice(0, 1000);
}
// ══════════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════════
async function fcGetDashboard(req, res) {
    try {
        const month = String(req.query.month || '').trim() || undefined;
        const data = await (0, financeCenterService_1.getFinanceSummary)(month);
        res.json({ ok: true, data });
    }
    catch (err) {
        console.error('fcGetDashboard error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}
// ══════════════════════════════════════════════════════════
// TRANSACTIONS (THE MAIN LEDGER)
// ══════════════════════════════════════════════════════════
async function fcGetTransactions(req, res) {
    try {
        const q = req.query;
        const { page, limit, skip } = paginate(q);
        const showDeleted = String(q.showDeleted || '').toLowerCase() === 'true';
        const filter = { isDeleted: showDeleted };
        if (q.direction === 'income' || q.direction === 'expense')
            filter.direction = q.direction;
        if (q.status)
            filter.status = q.status;
        if (q.method)
            filter.method = q.method;
        if (q.accountCode)
            filter.accountCode = String(q.accountCode).toUpperCase();
        if (q.sourceType)
            filter.sourceType = q.sourceType;
        if (q.costCenterId)
            filter.costCenterId = q.costCenterId;
        if (q.tag)
            filter.tags = q.tag;
        const dr = dateRange(q);
        if (dr)
            filter.dateUTC = dr;
        const search = sanitize(q.q ?? q.search);
        if (search) {
            filter.$or = [
                { txnCode: { $regex: search, $options: 'i' } },
                { categoryLabel: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { note: { $regex: search, $options: 'i' } },
            ];
        }
        const [items, total] = await Promise.all([
            FinanceTransaction_1.default.find(filter)
                .sort({ dateUTC: -1, createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('studentId', 'full_name username email')
                .populate('vendorId', 'name')
                .lean(),
            FinanceTransaction_1.default.countDocuments(filter),
        ]);
        res.json({ ok: true, items, total, page, limit, totalPages: Math.ceil(total / limit) });
    }
    catch (err) {
        console.error('fcGetTransactions error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}
async function fcGetTransaction(req, res) {
    try {
        const id = oid(req.params.id);
        if (!id) {
            res.status(400).json({ message: 'Invalid ID' });
            return;
        }
        const txn = await FinanceTransaction_1.default.findOne({ _id: id, isDeleted: false })
            .populate('studentId', 'full_name username email')
            .populate('vendorId', 'name')
            .populate('createdByAdminId', 'full_name username')
            .populate('approvedByAdminId', 'full_name username')
            .lean();
        if (!txn) {
            res.status(404).json({ message: 'Not found' });
            return;
        }
        res.json({ ok: true, data: txn });
    }
    catch (err) {
        console.error('fcGetTransaction error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}
async function fcCreateTransaction(req, res) {
    try {
        const b = req.body;
        const adminId = String(req.user?._id || '');
        if (!adminId) {
            res.status(401).json({ message: 'Auth required' });
            return;
        }
        const direction = b.direction === 'expense' ? 'expense' : 'income';
        const amount = num(b.amount);
        if (amount <= 0) {
            res.status(400).json({ message: 'Amount must be positive' });
            return;
        }
        if (!b.accountCode || !b.categoryLabel) {
            res.status(400).json({ message: 'accountCode and categoryLabel are required' });
            return;
        }
        const settings = await (0, financeCenterService_1.getOrCreateFinanceSettings)();
        let status = b.status || 'paid';
        if (direction === 'expense' && settings.requireApprovalForExpense) {
            status = 'pending';
        }
        if (direction === 'income' && settings.requireApprovalForIncome) {
            status = 'pending';
        }
        const txnCode = await (0, financeCenterService_1.nextTxnCode)();
        const txn = await FinanceTransaction_1.default.create({
            txnCode,
            direction,
            amount,
            currency: sanitize(b.currency) || 'BDT',
            dateUTC: b.dateUTC ? new Date(b.dateUTC) : new Date(),
            accountCode: String(b.accountCode).toUpperCase().trim(),
            categoryLabel: sanitize(b.categoryLabel),
            description: sanitize(b.description),
            status,
            method: b.method || 'manual',
            tags: Array.isArray(b.tags) ? b.tags.map(sanitize).filter(Boolean) : [],
            costCenterId: sanitize(b.costCenterId),
            vendorId: oid(b.vendorId),
            sourceType: b.sourceType || (direction === 'income' ? 'manual_income' : 'expense'),
            sourceId: sanitize(b.sourceId),
            studentId: oid(b.studentId),
            planId: oid(b.planId),
            examId: oid(b.examId),
            serviceId: oid(b.serviceId),
            txnRefId: sanitize(b.txnRefId),
            invoiceNo: sanitize(b.invoiceNo),
            note: sanitize(b.note),
            createdByAdminId: new mongoose_1.default.Types.ObjectId(adminId),
            paidAtUTC: status === 'paid' ? new Date() : null,
        });
        await (0, financeCenterService_1.logFinanceAudit)({
            actorId: adminId,
            action: 'finance.transaction.create',
            targetType: 'FinanceTransaction',
            targetId: String(txn._id),
            details: { txnCode, direction, amount },
            ip: (0, requestMeta_1.getClientIp)(req),
        });
        res.status(201).json({ ok: true, data: txn });
    }
    catch (err) {
        console.error('fcCreateTransaction error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}
async function fcUpdateTransaction(req, res) {
    try {
        const id = oid(req.params.id);
        if (!id) {
            res.status(400).json({ message: 'Invalid ID' });
            return;
        }
        const txn = await FinanceTransaction_1.default.findOne({ _id: id, isDeleted: false });
        if (!txn) {
            res.status(404).json({ message: 'Not found' });
            return;
        }
        const b = req.body;
        const adminId = String(req.user?._id || '');
        const prev = txn.toObject();
        if (b.amount !== undefined)
            txn.amount = num(b.amount);
        if (b.dateUTC)
            txn.dateUTC = new Date(b.dateUTC);
        if (b.accountCode)
            txn.accountCode = String(b.accountCode).toUpperCase().trim();
        if (b.categoryLabel)
            txn.categoryLabel = sanitize(b.categoryLabel);
        if (b.description !== undefined)
            txn.description = sanitize(b.description);
        if (b.status)
            txn.status = b.status;
        if (b.method)
            txn.method = b.method;
        if (b.note !== undefined)
            txn.note = sanitize(b.note);
        if (b.tags)
            txn.tags = Array.isArray(b.tags) ? b.tags.map(sanitize).filter(Boolean) : txn.tags;
        if (b.costCenterId !== undefined)
            txn.costCenterId = sanitize(b.costCenterId);
        if (b.vendorId !== undefined)
            txn.vendorId = oid(b.vendorId) ?? undefined;
        if (b.status === 'approved' && prev.status !== 'approved') {
            txn.approvedByAdminId = new mongoose_1.default.Types.ObjectId(adminId);
            txn.approvedAtUTC = new Date();
        }
        if (b.status === 'paid' && prev.status !== 'paid') {
            txn.paidAtUTC = new Date();
        }
        await txn.save();
        await (0, financeCenterService_1.logFinanceAudit)({
            actorId: adminId,
            action: 'finance.transaction.update',
            targetType: 'FinanceTransaction',
            targetId: String(txn._id),
            details: { changed: Object.keys(b) },
            ip: (0, requestMeta_1.getClientIp)(req),
            beforeSnapshot: prev,
            afterSnapshot: txn.toObject(),
        });
        res.json({ ok: true, data: txn });
    }
    catch (err) {
        console.error('fcUpdateTransaction error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}
async function fcDeleteTransaction(req, res) {
    try {
        const id = oid(req.params.id);
        if (!id) {
            res.status(400).json({ message: 'Invalid ID' });
            return;
        }
        const adminId = String(req.user?._id || '');
        const txn = await FinanceTransaction_1.default.findOne({ _id: id, isDeleted: false });
        if (!txn) {
            res.status(404).json({ message: 'Not found' });
            return;
        }
        txn.isDeleted = true;
        txn.deletedAt = new Date();
        txn.deletedByAdminId = new mongoose_1.default.Types.ObjectId(adminId);
        await txn.save();
        await (0, financeCenterService_1.logFinanceAudit)({
            actorId: adminId,
            action: 'finance.transaction.delete',
            targetType: 'FinanceTransaction',
            targetId: String(txn._id),
            ip: (0, requestMeta_1.getClientIp)(req),
        });
        res.json({ ok: true, message: 'Deleted' });
    }
    catch (err) {
        console.error('fcDeleteTransaction error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}
// ── Restore (Undelete) ──────────────────────────────────
async function fcRestoreTransaction(req, res) {
    try {
        const id = oid(req.params.id);
        if (!id) {
            res.status(400).json({ message: 'Invalid ID' });
            return;
        }
        const adminId = String(req.user?._id || '');
        const txn = await FinanceTransaction_1.default.findOne({ _id: id, isDeleted: true });
        if (!txn) {
            res.status(404).json({ message: 'Deleted transaction not found' });
            return;
        }
        txn.isDeleted = false;
        txn.deletedAt = undefined;
        txn.deletedByAdminId = undefined;
        await txn.save();
        await (0, financeCenterService_1.logFinanceAudit)({
            actorId: adminId,
            action: 'finance.transaction.restore',
            targetType: 'FinanceTransaction',
            targetId: String(txn._id),
            ip: (0, requestMeta_1.getClientIp)(req),
        });
        res.json({ ok: true, data: txn });
    }
    catch (err) {
        console.error('fcRestoreTransaction error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}
async function fcBulkApproveTransactions(req, res) {
    try {
        const ids = (req.body.ids || []).map(oid).filter(Boolean);
        if (ids.length === 0) {
            res.status(400).json({ message: 'No IDs provided' });
            return;
        }
        const adminId = String(req.user?._id || '');
        await FinanceTransaction_1.default.updateMany({ _id: { $in: ids }, isDeleted: false, status: 'pending' }, {
            $set: {
                status: 'approved',
                approvedByAdminId: new mongoose_1.default.Types.ObjectId(adminId),
                approvedAtUTC: new Date(),
            },
        });
        await (0, financeCenterService_1.logFinanceAudit)({
            actorId: adminId,
            action: 'finance.transaction.bulk-approve',
            targetType: 'FinanceTransaction',
            details: { count: ids.length },
            ip: (0, requestMeta_1.getClientIp)(req),
        });
        res.json({ ok: true, message: `Approved ${ids.length} transactions` });
    }
    catch (err) {
        console.error('fcBulkApproveTransactions error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}
async function fcBulkMarkPaid(req, res) {
    try {
        const ids = (req.body.ids || []).map(oid).filter(Boolean);
        if (ids.length === 0) {
            res.status(400).json({ message: 'No IDs provided' });
            return;
        }
        const adminId = String(req.user?._id || '');
        await FinanceTransaction_1.default.updateMany({ _id: { $in: ids }, isDeleted: false, status: { $in: ['pending', 'approved'] } }, { $set: { status: 'paid', paidAtUTC: new Date() } });
        await (0, financeCenterService_1.logFinanceAudit)({
            actorId: adminId,
            action: 'finance.transaction.bulk-mark-paid',
            targetType: 'FinanceTransaction',
            details: { count: ids.length },
            ip: (0, requestMeta_1.getClientIp)(req),
        });
        res.json({ ok: true, message: `Marked ${ids.length} transactions as paid` });
    }
    catch (err) {
        console.error('fcBulkMarkPaid error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}
// ══════════════════════════════════════════════════════════
// INVOICES
// ══════════════════════════════════════════════════════════
async function fcGetInvoices(req, res) {
    try {
        const q = req.query;
        const { page, limit, skip } = paginate(q);
        const filter = { isDeleted: false };
        if (q.status)
            filter.status = q.status;
        if (q.purpose)
            filter.purpose = q.purpose;
        if (q.studentId)
            filter.studentId = oid(q.studentId);
        const dr = dateRange(q);
        if (dr)
            filter.issuedAtUTC = dr;
        const [items, total] = await Promise.all([
            FinanceInvoice_1.default.find(filter)
                .sort({ issuedAtUTC: -1 })
                .skip(skip)
                .limit(limit)
                .populate('studentId', 'full_name username email')
                .populate('planId', 'name code priceBDT')
                .populate('examId', 'title')
                .lean(),
            FinanceInvoice_1.default.countDocuments(filter),
        ]);
        res.json({ ok: true, items, total, page, limit, totalPages: Math.ceil(total / limit) });
    }
    catch (err) {
        console.error('fcGetInvoices error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}
async function fcCreateInvoice(req, res) {
    try {
        const b = req.body;
        const adminId = String(req.user?._id || '');
        const amount = num(b.amountBDT);
        if (amount <= 0) {
            res.status(400).json({ message: 'Amount required' });
            return;
        }
        const invoiceNo = await (0, financeCenterService_1.nextInvoiceNo)();
        const inv = await FinanceInvoice_1.default.create({
            invoiceNo,
            studentId: oid(b.studentId),
            purpose: b.purpose || 'custom',
            planId: oid(b.planId),
            examId: oid(b.examId),
            serviceId: oid(b.serviceId),
            amountBDT: amount,
            paidAmountBDT: 0,
            status: 'unpaid',
            dueDateUTC: b.dueDateUTC ? new Date(b.dueDateUTC) : null,
            issuedAtUTC: new Date(),
            notes: sanitize(b.notes),
            createdByAdminId: new mongoose_1.default.Types.ObjectId(adminId),
        });
        await (0, financeCenterService_1.logFinanceAudit)({
            actorId: adminId,
            action: 'finance.invoice.create',
            targetType: 'FinanceInvoice',
            targetId: String(inv._id),
            details: { invoiceNo, amount },
            ip: (0, requestMeta_1.getClientIp)(req),
        });
        res.status(201).json({ ok: true, data: inv });
    }
    catch (err) {
        console.error('fcCreateInvoice error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}
async function fcUpdateInvoice(req, res) {
    try {
        const id = oid(req.params.id);
        if (!id) {
            res.status(400).json({ message: 'Invalid ID' });
            return;
        }
        const inv = await FinanceInvoice_1.default.findOne({ _id: id, isDeleted: false });
        if (!inv) {
            res.status(404).json({ message: 'Not found' });
            return;
        }
        const b = req.body;
        if (b.amountBDT !== undefined)
            inv.amountBDT = num(b.amountBDT);
        if (b.status)
            inv.status = b.status;
        if (b.dueDateUTC !== undefined)
            inv.dueDateUTC = b.dueDateUTC ? new Date(b.dueDateUTC) : undefined;
        if (b.notes !== undefined)
            inv.notes = sanitize(b.notes);
        if (b.purpose)
            inv.purpose = b.purpose;
        await inv.save();
        await (0, financeCenterService_1.logFinanceAudit)({
            actorId: String(req.user?._id),
            action: 'finance.invoice.update',
            targetType: 'FinanceInvoice',
            targetId: String(inv._id),
            ip: (0, requestMeta_1.getClientIp)(req),
        });
        res.json({ ok: true, data: inv });
    }
    catch (err) {
        console.error('fcUpdateInvoice error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}
async function fcMarkInvoicePaid(req, res) {
    try {
        const id = oid(req.params.id);
        if (!id) {
            res.status(400).json({ message: 'Invalid ID' });
            return;
        }
        const inv = await FinanceInvoice_1.default.findOne({ _id: id, isDeleted: false });
        if (!inv) {
            res.status(404).json({ message: 'Not found' });
            return;
        }
        const adminId = String(req.user?._id || '');
        inv.paidAmountBDT = inv.amountBDT;
        inv.status = 'paid';
        inv.paidAtUTC = new Date();
        await inv.save();
        // Auto-create income transaction if one doesn't exist for this invoice
        const existingTxn = await FinanceTransaction_1.default.findOne({
            invoiceNo: inv.invoiceNo,
            direction: 'income',
            isDeleted: false,
        }).lean();
        if (!existingTxn) {
            const accountMap = {
                subscription: 'REV_SUBSCRIPTION',
                exam: 'REV_EXAM',
                service: 'REV_SERVICE',
                custom: 'REV_OTHER',
            };
            const txnCode = await (0, financeCenterService_1.nextTxnCode)();
            const txn = await FinanceTransaction_1.default.create({
                txnCode,
                direction: 'income',
                amount: inv.amountBDT,
                currency: 'BDT',
                dateUTC: new Date(),
                accountCode: accountMap[inv.purpose] || 'REV_OTHER',
                categoryLabel: inv.purpose === 'subscription' ? 'Subscription' : inv.purpose === 'exam' ? 'Exam Fee' : inv.purpose === 'service' ? 'Service' : 'Other',
                description: `Invoice ${inv.invoiceNo} payment`,
                status: 'paid',
                method: 'manual',
                sourceType: inv.purpose === 'subscription' ? 'subscription_payment' : inv.purpose === 'exam' ? 'exam_payment' : 'manual_income',
                sourceId: String(inv._id),
                studentId: inv.studentId,
                planId: inv.planId,
                examId: inv.examId,
                serviceId: inv.serviceId,
                invoiceNo: inv.invoiceNo,
                paidAtUTC: new Date(),
                createdByAdminId: new mongoose_1.default.Types.ObjectId(adminId),
            });
            inv.linkedTxnIds.push(txn._id);
            await inv.save();
        }
        await (0, financeCenterService_1.logFinanceAudit)({
            actorId: adminId,
            action: 'finance.invoice.mark-paid',
            targetType: 'FinanceInvoice',
            targetId: String(inv._id),
            ip: (0, requestMeta_1.getClientIp)(req),
        });
        res.json({ ok: true, data: inv });
    }
    catch (err) {
        console.error('fcMarkInvoicePaid error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}
// ══════════════════════════════════════════════════════════
// BUDGETS
// ══════════════════════════════════════════════════════════
async function fcGetBudgets(req, res) {
    try {
        const month = String(req.query.month || '').trim();
        const filter = {};
        if (month)
            filter.month = month;
        const budgets = await FinanceBudget_1.default.find(filter).sort({ month: -1, accountCode: 1 }).lean();
        // Compute actualSpent for each budget
        const items = await Promise.all(budgets.map(async (b) => {
            const [yr, mn] = (b.month || '').split('-').map(Number);
            if (!yr || !mn)
                return { ...b, actualSpent: 0 };
            const start = new Date(Date.UTC(yr, mn - 1, 1));
            const end = new Date(Date.UTC(yr, mn, 0, 23, 59, 59, 999));
            const agg = await FinanceTransaction_1.default.aggregate([
                {
                    $match: {
                        dateUTC: { $gte: start, $lte: end },
                        isDeleted: false,
                        direction: b.direction,
                        accountCode: b.accountCode,
                        status: { $in: ['paid', 'approved'] },
                    },
                },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ]);
            return { ...b, actualSpent: agg[0]?.total || 0 };
        }));
        res.json({ ok: true, items });
    }
    catch (err) {
        console.error('fcGetBudgets error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}
async function fcCreateBudget(req, res) {
    try {
        const b = req.body;
        const adminId = String(req.user?._id || '');
        if (!b.month || !b.accountCode || !b.categoryLabel) {
            res.status(400).json({ message: 'month, accountCode, categoryLabel required' });
            return;
        }
        const budget = await FinanceBudget_1.default.create({
            month: sanitize(b.month),
            accountCode: String(b.accountCode).toUpperCase().trim(),
            categoryLabel: sanitize(b.categoryLabel),
            amountLimit: num(b.amountLimit),
            alertThresholdPercent: num(b.alertThresholdPercent, 80),
            direction: b.direction === 'income' ? 'income' : 'expense',
            costCenterId: sanitize(b.costCenterId),
            notes: sanitize(b.notes),
            createdByAdminId: new mongoose_1.default.Types.ObjectId(adminId),
        });
        res.status(201).json({ ok: true, data: budget });
    }
    catch (err) {
        if (err.code === 11000) {
            res.status(409).json({ message: 'Budget for this month+account already exists' });
            return;
        }
        console.error('fcCreateBudget error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}
async function fcUpdateBudget(req, res) {
    try {
        const id = oid(req.params.id);
        if (!id) {
            res.status(400).json({ message: 'Invalid ID' });
            return;
        }
        const b = req.body;
        const budget = await FinanceBudget_1.default.findById(id);
        if (!budget) {
            res.status(404).json({ message: 'Not found' });
            return;
        }
        if (b.amountLimit !== undefined)
            budget.amountLimit = num(b.amountLimit);
        if (b.alertThresholdPercent !== undefined)
            budget.alertThresholdPercent = num(b.alertThresholdPercent, 80);
        if (b.notes !== undefined)
            budget.notes = sanitize(b.notes);
        if (b.categoryLabel)
            budget.categoryLabel = sanitize(b.categoryLabel);
        await budget.save();
        res.json({ ok: true, data: budget });
    }
    catch (err) {
        console.error('fcUpdateBudget error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}
async function fcDeleteBudget(req, res) {
    try {
        const id = oid(req.params.id);
        if (!id) {
            res.status(400).json({ message: 'Invalid ID' });
            return;
        }
        await FinanceBudget_1.default.findByIdAndDelete(id);
        res.json({ ok: true, message: 'Deleted' });
    }
    catch (err) {
        console.error('fcDeleteBudget error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}
// ══════════════════════════════════════════════════════════
// RECURRING RULES
// ══════════════════════════════════════════════════════════
async function fcGetRecurringRules(req, res) {
    try {
        const items = await FinanceRecurringRule_1.default.find({})
            .sort({ isActive: -1, nextRunAtUTC: 1 })
            .populate('vendorId', 'name')
            .lean();
        res.json({ ok: true, items });
    }
    catch (err) {
        console.error('fcGetRecurringRules error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}
async function fcCreateRecurringRule(req, res) {
    try {
        const b = req.body;
        const adminId = String(req.user?._id || '');
        if (!b.name || !b.accountCode || !b.categoryLabel) {
            res.status(400).json({ message: 'name, accountCode, categoryLabel required' });
            return;
        }
        const rule = await FinanceRecurringRule_1.default.create({
            name: sanitize(b.name),
            direction: b.direction === 'income' ? 'income' : 'expense',
            amount: num(b.amount),
            currency: sanitize(b.currency) || 'BDT',
            accountCode: String(b.accountCode).toUpperCase().trim(),
            categoryLabel: sanitize(b.categoryLabel),
            description: sanitize(b.description),
            method: sanitize(b.method) || 'manual',
            tags: Array.isArray(b.tags) ? b.tags.map(sanitize).filter(Boolean) : [],
            costCenterId: sanitize(b.costCenterId),
            vendorId: oid(b.vendorId),
            frequency: b.frequency || 'monthly',
            dayOfMonth: b.dayOfMonth ? num(b.dayOfMonth) : null,
            intervalDays: b.intervalDays ? num(b.intervalDays) : null,
            nextRunAtUTC: b.nextRunAtUTC ? new Date(b.nextRunAtUTC) : new Date(),
            endAtUTC: b.endAtUTC ? new Date(b.endAtUTC) : null,
            isActive: b.isActive !== false,
            createdByAdminId: new mongoose_1.default.Types.ObjectId(adminId),
        });
        res.status(201).json({ ok: true, data: rule });
    }
    catch (err) {
        console.error('fcCreateRecurringRule error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}
async function fcUpdateRecurringRule(req, res) {
    try {
        const id = oid(req.params.id);
        if (!id) {
            res.status(400).json({ message: 'Invalid ID' });
            return;
        }
        const rule = await FinanceRecurringRule_1.default.findById(id);
        if (!rule) {
            res.status(404).json({ message: 'Not found' });
            return;
        }
        const b = req.body;
        if (b.name)
            rule.name = sanitize(b.name);
        if (b.amount !== undefined)
            rule.amount = num(b.amount);
        if (b.accountCode)
            rule.accountCode = String(b.accountCode).toUpperCase().trim();
        if (b.categoryLabel)
            rule.categoryLabel = sanitize(b.categoryLabel);
        if (b.description !== undefined)
            rule.description = sanitize(b.description);
        if (b.method)
            rule.method = sanitize(b.method);
        if (b.frequency)
            rule.frequency = b.frequency;
        if (b.dayOfMonth !== undefined)
            rule.dayOfMonth = b.dayOfMonth ? num(b.dayOfMonth) : undefined;
        if (b.intervalDays !== undefined)
            rule.intervalDays = b.intervalDays ? num(b.intervalDays) : undefined;
        if (b.nextRunAtUTC)
            rule.nextRunAtUTC = new Date(b.nextRunAtUTC);
        if (b.endAtUTC !== undefined)
            rule.endAtUTC = b.endAtUTC ? new Date(b.endAtUTC) : undefined;
        if (b.isActive !== undefined)
            rule.isActive = Boolean(b.isActive);
        if (b.tags)
            rule.tags = Array.isArray(b.tags) ? b.tags.map(sanitize).filter(Boolean) : rule.tags;
        if (b.costCenterId !== undefined)
            rule.costCenterId = sanitize(b.costCenterId);
        if (b.vendorId !== undefined)
            rule.vendorId = oid(b.vendorId) ?? undefined;
        await rule.save();
        res.json({ ok: true, data: rule });
    }
    catch (err) {
        console.error('fcUpdateRecurringRule error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}
async function fcDeleteRecurringRule(req, res) {
    try {
        const id = oid(req.params.id);
        if (!id) {
            res.status(400).json({ message: 'Invalid ID' });
            return;
        }
        await FinanceRecurringRule_1.default.findByIdAndDelete(id);
        res.json({ ok: true, message: 'Deleted' });
    }
    catch (err) {
        console.error('fcDeleteRecurringRule error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}
async function fcRunRecurringRuleNow(req, res) {
    try {
        const id = oid(req.params.id);
        if (!id) {
            res.status(400).json({ message: 'Invalid ID' });
            return;
        }
        const adminId = String(req.user?._id || '');
        const txn = await (0, financeCenterService_1.executeRecurringRule)(String(id), adminId);
        res.json({ ok: true, data: txn });
    }
    catch (err) {
        console.error('fcRunRecurringRuleNow error:', err);
        res.status(400).json({ message: err.message || 'Failed' });
    }
}
// ══════════════════════════════════════════════════════════
// CHART OF ACCOUNTS
// ══════════════════════════════════════════════════════════
async function fcGetChartOfAccounts(_req, res) {
    try {
        const items = await ChartOfAccounts_1.default.find({}).sort({ type: 1, code: 1 }).lean();
        res.json({ ok: true, items });
    }
    catch (err) {
        console.error('fcGetChartOfAccounts error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}
async function fcCreateAccount(req, res) {
    try {
        const b = req.body;
        if (!b.code || !b.name || !b.type) {
            res.status(400).json({ message: 'code, name, type required' });
            return;
        }
        const acct = await ChartOfAccounts_1.default.create({
            code: String(b.code).toUpperCase().trim(),
            name: sanitize(b.name),
            type: b.type,
            parentCode: sanitize(b.parentCode),
            description: sanitize(b.description),
            isActive: b.isActive !== false,
            isSystem: false,
        });
        res.status(201).json({ ok: true, data: acct });
    }
    catch (err) {
        if (err.code === 11000) {
            res.status(409).json({ message: 'Account code already exists' });
            return;
        }
        console.error('fcCreateAccount error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}
// ══════════════════════════════════════════════════════════
// VENDORS
// ══════════════════════════════════════════════════════════
async function fcGetVendors(_req, res) {
    try {
        const items = await FinanceVendor_1.default.find({}).sort({ name: 1 }).lean();
        res.json({ ok: true, items });
    }
    catch (err) {
        console.error('fcGetVendors error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}
async function fcCreateVendor(req, res) {
    try {
        const b = req.body;
        if (!b.name) {
            res.status(400).json({ message: 'name required' });
            return;
        }
        const vendor = await FinanceVendor_1.default.create({
            name: sanitize(b.name),
            contact: sanitize(b.contact),
            email: sanitize(b.email),
            phone: sanitize(b.phone),
            address: sanitize(b.address),
            category: sanitize(b.category) || 'general',
            notes: sanitize(b.notes),
            isActive: b.isActive !== false,
            createdByAdminId: new mongoose_1.default.Types.ObjectId(String(req.user?._id)),
        });
        res.status(201).json({ ok: true, data: vendor });
    }
    catch (err) {
        console.error('fcCreateVendor error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}
// ══════════════════════════════════════════════════════════
// SETTINGS
// ══════════════════════════════════════════════════════════
async function fcGetSettings(_req, res) {
    try {
        const settings = await (0, financeCenterService_1.getOrCreateFinanceSettings)();
        res.json({ ok: true, data: settings });
    }
    catch (err) {
        console.error('fcGetSettings error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}
async function fcUpdateSettings(req, res) {
    try {
        const b = req.body;
        const adminId = String(req.user?._id || '');
        const settings = await (0, financeCenterService_1.getOrCreateFinanceSettings)();
        if (b.defaultCurrency !== undefined)
            settings.defaultCurrency = sanitize(b.defaultCurrency) || 'BDT';
        if (b.requireApprovalForExpense !== undefined)
            settings.requireApprovalForExpense = Boolean(b.requireApprovalForExpense);
        if (b.requireApprovalForIncome !== undefined)
            settings.requireApprovalForIncome = Boolean(b.requireApprovalForIncome);
        if (b.enableBudgets !== undefined)
            settings.enableBudgets = Boolean(b.enableBudgets);
        if (b.enableRecurringEngine !== undefined)
            settings.enableRecurringEngine = Boolean(b.enableRecurringEngine);
        if (b.receiptRequiredAboveAmount !== undefined)
            settings.receiptRequiredAboveAmount = num(b.receiptRequiredAboveAmount, 500);
        if (b.exportFooterNote !== undefined)
            settings.exportFooterNote = sanitize(b.exportFooterNote);
        if (b.smsCostPerMessageBDT !== undefined)
            settings.smsCostPerMessageBDT = num(b.smsCostPerMessageBDT, 0.35);
        if (b.emailCostPerMessageBDT !== undefined)
            settings.emailCostPerMessageBDT = num(b.emailCostPerMessageBDT, 0.05);
        if (Array.isArray(b.costCenters))
            settings.costCenters = b.costCenters.map(sanitize).filter(Boolean);
        settings.lastEditedByAdminId = new mongoose_1.default.Types.ObjectId(adminId);
        await settings.save();
        await (0, financeCenterService_1.logFinanceAudit)({
            actorId: adminId,
            action: 'finance.settings.update',
            targetType: 'FinanceSettings',
            details: { changed: Object.keys(b) },
            ip: (0, requestMeta_1.getClientIp)(req),
        });
        res.json({ ok: true, data: settings });
    }
    catch (err) {
        console.error('fcUpdateSettings error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}
// ══════════════════════════════════════════════════════════
// AUDIT LOGS
// ══════════════════════════════════════════════════════════
async function fcGetAuditLogs(req, res) {
    try {
        const q = req.query;
        const { page, limit, skip } = paginate(q);
        const filter = {};
        if (q.action)
            filter.action = { $regex: String(q.action), $options: 'i' };
        if (!q.action)
            filter.action = { $regex: '^finance\\.', $options: 'i' };
        const [items, total] = await Promise.all([
            AuditLog_1.default.find(filter)
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(limit)
                .populate('actor_id', 'full_name username')
                .lean(),
            AuditLog_1.default.countDocuments(filter),
        ]);
        res.json({ ok: true, items, total, page, limit });
    }
    catch (err) {
        console.error('fcGetAuditLogs error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}
async function fcGetAuditLogDetail(req, res) {
    try {
        const id = oid(req.params.id);
        if (!id) {
            res.status(400).json({ message: 'Invalid ID' });
            return;
        }
        const log = await AuditLog_1.default.findById(id)
            .populate('actor_id', 'full_name username')
            .lean();
        if (!log) {
            res.status(404).json({ message: 'Not found' });
            return;
        }
        res.json({ ok: true, data: log });
    }
    catch (err) {
        console.error('fcGetAuditLogDetail error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}
// ══════════════════════════════════════════════════════════
// EXPORT
// ══════════════════════════════════════════════════════════
async function fcExportTransactions(req, res) {
    try {
        const q = req.query;
        const format = String(q.type || q.format || 'xlsx').toLowerCase();
        const filter = { isDeleted: false };
        if (q.direction === 'income' || q.direction === 'expense')
            filter.direction = q.direction;
        if (q.status)
            filter.status = q.status;
        const dr = dateRange(q);
        if (dr)
            filter.dateUTC = dr;
        const txns = await FinanceTransaction_1.default.find(filter)
            .sort({ dateUTC: -1 })
            .populate('studentId', 'full_name email')
            .populate('vendorId', 'name')
            .lean();
        if (format === 'csv') {
            const lines = [
                'TxnCode,Direction,Amount,Currency,Date,AccountCode,Category,Description,Status,Method,Student,Vendor',
            ];
            for (const t of txns) {
                const student = t.studentId?.full_name || '';
                const vendor = t.vendorId?.name || '';
                lines.push([
                    t.txnCode, t.direction, t.amount, t.currency,
                    t.dateUTC.toISOString().split('T')[0],
                    t.accountCode, `"${t.categoryLabel}"`, `"${t.description}"`,
                    t.status, t.method, `"${student}"`, `"${vendor}"`,
                ].join(','));
            }
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=finance-transactions.csv');
            res.send(lines.join('\n'));
            return;
        }
        // Default: XLSX
        const wb = new exceljs_1.default.Workbook();
        const ws = wb.addWorksheet('Transactions');
        ws.columns = [
            { header: 'Txn Code', key: 'txnCode', width: 18 },
            { header: 'Direction', key: 'direction', width: 10 },
            { header: 'Amount', key: 'amount', width: 12 },
            { header: 'Currency', key: 'currency', width: 8 },
            { header: 'Date', key: 'date', width: 14 },
            { header: 'Account', key: 'accountCode', width: 20 },
            { header: 'Category', key: 'categoryLabel', width: 20 },
            { header: 'Description', key: 'description', width: 30 },
            { header: 'Status', key: 'status', width: 12 },
            { header: 'Method', key: 'method', width: 10 },
            { header: 'Student', key: 'student', width: 20 },
            { header: 'Vendor', key: 'vendor', width: 20 },
        ];
        for (const t of txns) {
            ws.addRow({
                txnCode: t.txnCode,
                direction: t.direction,
                amount: t.amount,
                currency: t.currency,
                date: t.dateUTC.toISOString().split('T')[0],
                accountCode: t.accountCode,
                categoryLabel: t.categoryLabel,
                description: t.description,
                status: t.status,
                method: t.method,
                student: t.studentId?.full_name || '',
                vendor: t.vendorId?.name || '',
            });
        }
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=finance-transactions.xlsx');
        await wb.xlsx.write(res);
        res.end();
    }
    catch (err) {
        console.error('fcExportTransactions error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}
async function fcImportPreview(req, res) {
    try {
        if (!req.file) {
            res.status(400).json({ message: 'File required' });
            return;
        }
        const wb = new exceljs_1.default.Workbook();
        await wb.xlsx.load(req.file.buffer);
        const ws = wb.worksheets[0];
        if (!ws) {
            res.status(400).json({ message: 'No worksheet found' });
            return;
        }
        const headers = [];
        ws.getRow(1).eachCell((cell) => { headers.push(String(cell.value || '').trim()); });
        const rows = [];
        ws.eachRow((row, idx) => {
            if (idx === 1)
                return;
            const obj = {};
            row.eachCell((cell, colNumber) => {
                obj[headers[colNumber - 1] || `col${colNumber}`] = String(cell.value || '');
            });
            rows.push(obj);
        });
        res.json({ ok: true, headers, rows: rows.slice(0, 200), totalRows: rows.length });
    }
    catch (err) {
        console.error('fcImportPreview error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}
async function fcImportCommit(req, res) {
    try {
        const { rows, mapping } = req.body;
        if (!Array.isArray(rows) || !mapping) {
            res.status(400).json({ message: 'rows and mapping required' });
            return;
        }
        const adminId = String(req.user?._id || '');
        let created = 0;
        let errors = 0;
        for (const row of rows) {
            try {
                const txnCode = await (0, financeCenterService_1.nextTxnCode)();
                await FinanceTransaction_1.default.create({
                    txnCode,
                    direction: String(row[mapping.direction] || 'income').toLowerCase() === 'expense' ? 'expense' : 'income',
                    amount: num(row[mapping.amount]),
                    currency: String(row[mapping.currency] || 'BDT'),
                    dateUTC: row[mapping.date] ? new Date(row[mapping.date]) : new Date(),
                    accountCode: String(row[mapping.accountCode] || 'REV_OTHER').toUpperCase(),
                    categoryLabel: String(row[mapping.categoryLabel] || 'Imported'),
                    description: String(row[mapping.description] || ''),
                    status: 'paid',
                    method: String(row[mapping.method] || 'manual'),
                    sourceType: 'manual_income',
                    createdByAdminId: new mongoose_1.default.Types.ObjectId(adminId),
                    paidAtUTC: new Date(),
                });
                created++;
            }
            catch {
                errors++;
            }
        }
        await (0, financeCenterService_1.logFinanceAudit)({
            actorId: adminId,
            action: 'finance.import.commit',
            targetType: 'FinanceTransaction',
            details: { created, errors, totalRows: rows.length },
            ip: (0, requestMeta_1.getClientIp)(req),
        });
        res.json({ ok: true, created, errors });
    }
    catch (err) {
        console.error('fcImportCommit error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}
async function fcDownloadTemplate(_req, res) {
    try {
        const wb = new exceljs_1.default.Workbook();
        const ws = wb.addWorksheet('Finance Import');
        ws.columns = [
            { header: 'Direction', key: 'direction', width: 12 },
            { header: 'Amount', key: 'amount', width: 12 },
            { header: 'Currency', key: 'currency', width: 8 },
            { header: 'Date (YYYY-MM-DD)', key: 'date', width: 16 },
            { header: 'Account Code', key: 'accountCode', width: 18 },
            { header: 'Category', key: 'categoryLabel', width: 20 },
            { header: 'Description', key: 'description', width: 30 },
            { header: 'Method', key: 'method', width: 12 },
        ];
        ws.addRow({ direction: 'income', amount: 1000, currency: 'BDT', date: '2026-03-01', accountCode: 'REV_SUBSCRIPTION', categoryLabel: 'Subscription', description: 'Example', method: 'bkash' });
        ws.addRow({ direction: 'expense', amount: 500, currency: 'BDT', date: '2026-03-01', accountCode: 'EXP_HOSTING', categoryLabel: 'Hosting', description: 'VPS Monthly', method: 'bank' });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=finance-import-template.xlsx');
        await wb.xlsx.write(res);
        res.end();
    }
    catch (err) {
        console.error('fcDownloadTemplate error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}
/* ═══════════════════════════════════════════════════════════
   REFUNDS
   ═══════════════════════════════════════════════════════════ */
async function fcGetRefunds(req, res) {
    try {
        const { page, limit, skip } = paginate(req.query);
        const filter = { isDeleted: false };
        if (req.query.status)
            filter.status = req.query.status;
        if (req.query.studentId)
            filter.studentId = oid(req.query.studentId);
        const [items, total] = await Promise.all([
            FinanceRefund_1.default.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            FinanceRefund_1.default.countDocuments(filter),
        ]);
        res.json({ ok: true, items, total, page, limit, totalPages: Math.ceil(total / limit) });
    }
    catch (err) {
        console.error('fcGetRefunds error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}
async function fcCreateRefund(req, res) {
    try {
        if (!req.user?._id) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const { originalPaymentId, financeTxnId, studentId, amountBDT, reason } = req.body;
        if (!amountBDT || amountBDT <= 0) {
            res.status(400).json({ message: 'amountBDT is required and must be positive' });
            return;
        }
        if (!reason?.trim()) {
            res.status(400).json({ message: 'reason is required' });
            return;
        }
        const refundCode = await (0, financeCenterService_1.nextRefundCode)();
        const refund = await FinanceRefund_1.default.create({
            refundCode,
            originalPaymentId: oid(originalPaymentId) || undefined,
            financeTxnId: oid(financeTxnId) || undefined,
            studentId: oid(studentId) || undefined,
            amountBDT: num(amountBDT),
            reason: String(reason).trim(),
            createdByAdminId: new mongoose_1.default.Types.ObjectId(String(req.user._id)),
        });
        await (0, financeCenterService_1.logFinanceAudit)({
            actorId: String(req.user._id),
            action: 'refund_created',
            targetType: 'FinanceRefund',
            targetId: String(refund._id),
            details: { refundCode, amountBDT },
            ip: (0, requestMeta_1.getClientIp)(req),
        });
        res.status(201).json({ data: refund });
    }
    catch (err) {
        console.error('fcCreateRefund error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}
async function fcApproveRefund(req, res) {
    try {
        if (!req.user?._id) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const refund = await FinanceRefund_1.default.findById(req.params.id);
        if (!refund || refund.isDeleted) {
            res.status(404).json({ message: 'Refund not found' });
            return;
        }
        if (refund.status !== 'requested') {
            res.status(400).json({ message: `Cannot approve a refund with status "${refund.status}"` });
            return;
        }
        const action = req.body.action; // 'approve' | 'reject'
        if (action === 'reject') {
            refund.status = 'rejected';
            refund.rejectionNote = String(req.body.rejectionNote || '').trim();
        }
        else {
            refund.status = 'approved';
            // Create a corresponding expense transaction for the refund
            const txnCode = await (0, financeCenterService_1.nextTxnCode)();
            await FinanceTransaction_1.default.create({
                txnCode,
                direction: 'expense',
                amount: refund.amountBDT,
                currency: 'BDT',
                dateUTC: new Date(),
                accountCode: 'EXP_MISC',
                categoryLabel: 'Refund',
                description: `Refund ${refund.refundCode}: ${refund.reason}`,
                status: 'paid',
                method: 'manual',
                sourceType: 'refund',
                sourceId: String(refund._id),
                studentId: refund.studentId,
                createdByAdminId: new mongoose_1.default.Types.ObjectId(String(req.user._id)),
                paidAtUTC: new Date(),
            });
            // If original txn exists, mark it refunded
            if (refund.financeTxnId) {
                await FinanceTransaction_1.default.findByIdAndUpdate(refund.financeTxnId, { status: 'refunded' });
            }
        }
        refund.processedByAdminId = new mongoose_1.default.Types.ObjectId(String(req.user._id));
        refund.processedAtUTC = new Date();
        await refund.save();
        await (0, financeCenterService_1.logFinanceAudit)({
            actorId: String(req.user._id),
            action: action === 'reject' ? 'refund_rejected' : 'refund_approved',
            targetType: 'FinanceRefund',
            targetId: String(refund._id),
            details: { refundCode: refund.refundCode, action },
            ip: (0, requestMeta_1.getClientIp)(req),
        });
        res.json({ data: refund });
    }
    catch (err) {
        console.error('fcApproveRefund error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}
/* ═══════════════════════════════════════════════════════════
   P&L PDF REPORT
   ═══════════════════════════════════════════════════════════ */
async function fcGeneratePLReport(req, res) {
    try {
        const month = req.query.month || undefined;
        const pdfBuffer = await (0, financeCenterService_1.generatePLReportPDF)(month || '');
        const filename = `PL-Report-${month || 'current'}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        res.send(pdfBuffer);
    }
    catch (err) {
        console.error('fcGeneratePLReport error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}
//# sourceMappingURL=financeCenterController.js.map
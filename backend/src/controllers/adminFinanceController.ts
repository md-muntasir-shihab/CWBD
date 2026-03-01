
import { Response } from 'express';
import mongoose from 'mongoose';
import AuditLog from '../models/AuditLog';
import ExpenseEntry from '../models/ExpenseEntry';
import ManualPayment from '../models/ManualPayment';
import StaffPayout from '../models/StaffPayout';
import StudentDueLedger from '../models/StudentDueLedger';
import StudentProfile from '../models/StudentProfile';
import User from '../models/User';
import { AuthRequest } from '../middlewares/auth';
import { addFinanceStreamClient, broadcastFinanceEvent } from '../realtime/financeStream';
import { getRuntimeSettingsSnapshot } from '../services/runtimeSettingsService';
import { getClientIp } from '../utils/requestMeta';

type DateRange = { from?: Date; to?: Date };

function parseDate(value: unknown): Date | null {
    if (!value) return null;
    const date = new Date(String(value));
    return Number.isFinite(date.getTime()) ? date : null;
}

function parseDateRange(query: Record<string, unknown>): DateRange {
    const from = parseDate(query.from);
    const to = parseDate(query.to);
    return {
        ...(from ? { from } : {}),
        ...(to ? { to } : {}),
    };
}

function buildDateMatch(field: string, range: DateRange): Record<string, unknown> {
    const matcher: Record<string, unknown> = {};
    if (range.from) matcher.$gte = range.from;
    if (range.to) matcher.$lte = range.to;
    return Object.keys(matcher).length > 0 ? { [field]: matcher } : {};
}

function asObjectId(value: unknown): mongoose.Types.ObjectId | null {
    const raw = String(value || '').trim();
    if (!raw || !mongoose.Types.ObjectId.isValid(raw)) return null;
    return new mongoose.Types.ObjectId(raw);
}

function numeric(input: unknown, fallback = 0): number {
    const parsed = Number(input);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function parsePage(query: Record<string, unknown>): { page: number; limit: number; skip: number } {
    const page = Math.max(1, Math.floor(numeric(query.page, 1)));
    const limit = Math.max(1, Math.min(200, Math.floor(numeric(query.limit, 20))));
    const skip = (page - 1) * limit;
    return { page, limit, skip };
}

function periodKey(date: Date, bucket: 'day' | 'month'): string {
    const year = date.getUTCFullYear();
    const month = `${date.getUTCMonth() + 1}`.padStart(2, '0');
    if (bucket === 'month') return `${year}-${month}`;
    const day = `${date.getUTCDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
}

async function createAudit(req: AuthRequest, action: string, details?: Record<string, unknown>): Promise<void> {
    if (!req.user || !mongoose.Types.ObjectId.isValid(req.user._id)) return;
    await AuditLog.create({
        actor_id: new mongoose.Types.ObjectId(req.user._id),
        actor_role: req.user.role,
        action,
        target_type: 'finance',
        ip_address: getClientIp(req),
        details: details || {},
    });
}

async function readSummary(range: DateRange): Promise<{
    income: number;
    expense: number;
    payouts: number;
    net: number;
}> {
    const [incomeRow, expenseRow, payoutRow] = await Promise.all([
        ManualPayment.aggregate([
            { $match: buildDateMatch('date', range) },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        ExpenseEntry.aggregate([
            { $match: buildDateMatch('date', range) },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        StaffPayout.aggregate([
            { $match: buildDateMatch('paidAt', range) },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
    ]);

    const income = numeric(incomeRow[0]?.total, 0);
    const expense = numeric(expenseRow[0]?.total, 0);
    const payouts = numeric(payoutRow[0]?.total, 0);
    const net = income - expense - payouts;
    return { income, expense, payouts, net };
}

async function broadcastSummary(range: DateRange): Promise<void> {
    const summary = await readSummary(range);
    broadcastFinanceEvent('finance-updated', summary as unknown as Record<string, unknown>);
}

export async function adminFinanceStream(_req: AuthRequest, res: Response): Promise<void> {
    addFinanceStreamClient(res);
}

export async function adminGetPayments(req: AuthRequest, res: Response): Promise<void> {
    try {
        const query = req.query as Record<string, unknown>;
        const { page, limit, skip } = parsePage(query);
        const range = parseDateRange(query);
        const dateMatch = buildDateMatch('date', range);

        const filter: Record<string, unknown> = { ...dateMatch };
        const studentId = asObjectId(query.studentId);
        if (studentId) filter.studentId = studentId;

        const method = String(query.method || '').trim();
        if (method) filter.method = method;

        const entryType = String(query.entryType || '').trim();
        if (entryType) filter.entryType = entryType;

        const [items, total] = await Promise.all([
            ManualPayment.find(filter)
                .populate('studentId', 'username email full_name')
                .populate('subscriptionPlanId', 'name code')
                .populate('recordedBy', 'username full_name role')
                .sort({ date: -1, createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            ManualPayment.countDocuments(filter),
        ]);

        res.json({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
    } catch (error) {
        console.error('adminGetPayments error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function adminCreatePayment(req: AuthRequest, res: Response): Promise<void> {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }

        const body = req.body as Record<string, unknown>;
        const studentId = asObjectId(body.studentId);
        if (!studentId) {
            res.status(400).json({ message: 'Valid studentId is required' });
            return;
        }

        const student = await User.findById(studentId).select('role');
        if (!student || student.role !== 'student') {
            res.status(404).json({ message: 'Student not found' });
            return;
        }

        const recordedBy = asObjectId(req.user._id);
        if (!recordedBy) {
            res.status(400).json({ message: 'Invalid actor id' });
            return;
        }

        const amount = numeric(body.amount, -1);
        if (amount < 0) {
            res.status(400).json({ message: 'Amount must be non-negative' });
            return;
        }

        const date = parseDate(body.date) || new Date();
        const methodRaw = String(body.method || 'manual').trim();
        const allowedMethods = ['bkash', 'cash', 'manual', 'bank'];
        const method = allowedMethods.includes(methodRaw) ? methodRaw : 'manual';

        const entryTypeRaw = String(body.entryType || 'subscription').trim();
        const allowedEntryTypes = ['subscription', 'due_settlement', 'other_income'];
        const entryType = allowedEntryTypes.includes(entryTypeRaw) ? entryTypeRaw : 'subscription';

        const subscriptionPlanId = asObjectId(body.subscriptionPlanId);

        const created = await ManualPayment.create({
            studentId,
            ...(subscriptionPlanId ? { subscriptionPlanId } : {}),
            amount,
            method,
            date,
            entryType,
            reference: String(body.reference || '').trim(),
            notes: String(body.notes || '').trim(),
            recordedBy,
        });

        await createAudit(req, 'manual_payment_created', {
            paymentId: String(created._id),
            studentId: String(studentId),
            amount,
            method,
            entryType,
        });

        broadcastFinanceEvent('payment-recorded', {
            paymentId: String(created._id),
            studentId: String(studentId),
            amount,
        });
        await broadcastSummary({});

        res.status(201).json({ item: created, message: 'Payment recorded successfully' });
    } catch (error) {
        console.error('adminCreatePayment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function adminUpdatePayment(req: AuthRequest, res: Response): Promise<void> {
    try {
        const body = req.body as Record<string, unknown>;
        const update: Record<string, unknown> = {};

        if (body.amount !== undefined) {
            const amount = numeric(body.amount, -1);
            if (amount < 0) {
                res.status(400).json({ message: 'Amount must be non-negative' });
                return;
            }
            update.amount = amount;
        }

        if (body.date !== undefined) {
            const date = parseDate(body.date);
            if (!date) {
                res.status(400).json({ message: 'Invalid date' });
                return;
            }
            update.date = date;
        }

        if (body.method !== undefined) {
            const methodRaw = String(body.method || '').trim();
            const allowedMethods = ['bkash', 'cash', 'manual', 'bank'];
            if (!allowedMethods.includes(methodRaw)) {
                res.status(400).json({ message: 'Invalid payment method' });
                return;
            }
            update.method = methodRaw;
        }

        if (body.entryType !== undefined) {
            const entryTypeRaw = String(body.entryType || '').trim();
            const allowedEntryTypes = ['subscription', 'due_settlement', 'other_income'];
            if (!allowedEntryTypes.includes(entryTypeRaw)) {
                res.status(400).json({ message: 'Invalid entry type' });
                return;
            }
            update.entryType = entryTypeRaw;
        }

        if (body.subscriptionPlanId !== undefined) {
            const planId = asObjectId(body.subscriptionPlanId);
            update.subscriptionPlanId = planId;
        }

        if (body.reference !== undefined) update.reference = String(body.reference || '').trim();
        if (body.notes !== undefined) update.notes = String(body.notes || '').trim();

        const item = await ManualPayment.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
        if (!item) {
            res.status(404).json({ message: 'Payment entry not found' });
            return;
        }

        await createAudit(req, 'manual_payment_updated', {
            paymentId: String(item._id),
            updatedFields: Object.keys(update),
        });

        broadcastFinanceEvent('payment-recorded', {
            paymentId: String(item._id),
            updated: true,
        });
        await broadcastSummary({});

        res.json({ item, message: 'Payment updated successfully' });
    } catch (error) {
        console.error('adminUpdatePayment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function adminGetStudentPayments(req: AuthRequest, res: Response): Promise<void> {
    try {
        const studentId = asObjectId(req.params.id);
        if (!studentId) {
            res.status(400).json({ message: 'Invalid student id' });
            return;
        }

        const items = await ManualPayment.find({ studentId })
            .populate('subscriptionPlanId', 'name code')
            .populate('recordedBy', 'username full_name role')
            .sort({ date: -1, createdAt: -1 })
            .lean();

        const totalPaid = items.reduce((sum, item) => sum + numeric((item as { amount?: number }).amount, 0), 0);

        res.json({ items, totalPaid });
    } catch (error) {
        console.error('adminGetStudentPayments error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}
export async function adminGetExpenses(req: AuthRequest, res: Response): Promise<void> {
    try {
        const query = req.query as Record<string, unknown>;
        const { page, limit, skip } = parsePage(query);
        const range = parseDateRange(query);
        const dateMatch = buildDateMatch('date', range);

        const filter: Record<string, unknown> = { ...dateMatch };
        const category = String(query.category || '').trim();
        if (category) filter.category = category;

        const [items, total] = await Promise.all([
            ExpenseEntry.find(filter)
                .populate('recordedBy', 'username full_name role')
                .populate('linkedStaffId', 'username full_name role')
                .sort({ date: -1, createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            ExpenseEntry.countDocuments(filter),
        ]);

        res.json({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
    } catch (error) {
        console.error('adminGetExpenses error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function adminCreateExpense(req: AuthRequest, res: Response): Promise<void> {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }

        const body = req.body as Record<string, unknown>;
        const amount = numeric(body.amount, -1);
        if (amount < 0) {
            res.status(400).json({ message: 'Amount must be non-negative' });
            return;
        }

        const allowedCategories = ['server', 'marketing', 'staff_salary', 'moderator_salary', 'tools', 'misc'];
        const categoryRaw = String(body.category || 'misc').trim();
        const category = allowedCategories.includes(categoryRaw) ? categoryRaw : 'misc';

        const recordedBy = asObjectId(req.user._id);
        if (!recordedBy) {
            res.status(400).json({ message: 'Invalid actor id' });
            return;
        }

        const linkedStaffId = asObjectId(body.linkedStaffId);

        const item = await ExpenseEntry.create({
            category,
            amount,
            date: parseDate(body.date) || new Date(),
            vendor: String(body.vendor || '').trim(),
            notes: String(body.notes || '').trim(),
            ...(linkedStaffId ? { linkedStaffId } : {}),
            recordedBy,
        });

        await createAudit(req, 'expense_created', {
            expenseId: String(item._id),
            category,
            amount,
        });

        broadcastFinanceEvent('expense-recorded', {
            expenseId: String(item._id),
            category,
            amount,
        });
        await broadcastSummary({});

        res.status(201).json({ item, message: 'Expense recorded successfully' });
    } catch (error) {
        console.error('adminCreateExpense error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function adminUpdateExpense(req: AuthRequest, res: Response): Promise<void> {
    try {
        const body = req.body as Record<string, unknown>;
        const update: Record<string, unknown> = {};

        if (body.amount !== undefined) {
            const amount = numeric(body.amount, -1);
            if (amount < 0) {
                res.status(400).json({ message: 'Amount must be non-negative' });
                return;
            }
            update.amount = amount;
        }

        if (body.date !== undefined) {
            const date = parseDate(body.date);
            if (!date) {
                res.status(400).json({ message: 'Invalid date' });
                return;
            }
            update.date = date;
        }

        if (body.category !== undefined) {
            const category = String(body.category || '').trim();
            const allowed = ['server', 'marketing', 'staff_salary', 'moderator_salary', 'tools', 'misc'];
            if (!allowed.includes(category)) {
                res.status(400).json({ message: 'Invalid category' });
                return;
            }
            update.category = category;
        }

        if (body.vendor !== undefined) update.vendor = String(body.vendor || '').trim();
        if (body.notes !== undefined) update.notes = String(body.notes || '').trim();
        if (body.linkedStaffId !== undefined) update.linkedStaffId = asObjectId(body.linkedStaffId);

        const item = await ExpenseEntry.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
        if (!item) {
            res.status(404).json({ message: 'Expense entry not found' });
            return;
        }

        await createAudit(req, 'expense_updated', {
            expenseId: String(item._id),
            updatedFields: Object.keys(update),
        });

        broadcastFinanceEvent('expense-recorded', {
            expenseId: String(item._id),
            updated: true,
        });
        await broadcastSummary({});

        res.json({ item, message: 'Expense updated successfully' });
    } catch (error) {
        console.error('adminUpdateExpense error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function adminGetStaffPayouts(req: AuthRequest, res: Response): Promise<void> {
    try {
        const query = req.query as Record<string, unknown>;
        const { page, limit, skip } = parsePage(query);
        const range = parseDateRange(query);
        const paidAtMatch = buildDateMatch('paidAt', range);

        const filter: Record<string, unknown> = { ...paidAtMatch };
        const role = String(query.role || '').trim();
        if (role) filter.role = role;

        const [items, total] = await Promise.all([
            StaffPayout.find(filter)
                .populate('userId', 'username full_name role')
                .populate('recordedBy', 'username full_name role')
                .sort({ paidAt: -1, createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            StaffPayout.countDocuments(filter),
        ]);

        res.json({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
    } catch (error) {
        console.error('adminGetStaffPayouts error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function adminCreateStaffPayout(req: AuthRequest, res: Response): Promise<void> {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }

        const body = req.body as Record<string, unknown>;
        const userId = asObjectId(body.userId);
        if (!userId) {
            res.status(400).json({ message: 'Valid userId is required' });
            return;
        }

        const targetUser = await User.findById(userId).select('role');
        if (!targetUser || targetUser.role === 'student') {
            res.status(404).json({ message: 'Staff user not found' });
            return;
        }

        const amount = numeric(body.amount, -1);
        if (amount < 0) {
            res.status(400).json({ message: 'Amount must be non-negative' });
            return;
        }

        const periodMonth = String(body.periodMonth || '').trim();
        if (!/^\d{4}\-(0[1-9]|1[0-2])$/.test(periodMonth)) {
            res.status(400).json({ message: 'periodMonth must use YYYY-MM format' });
            return;
        }

        const recordedBy = asObjectId(req.user._id);
        if (!recordedBy) {
            res.status(400).json({ message: 'Invalid actor id' });
            return;
        }

        const methodRaw = String(body.method || 'manual').trim();
        const methods = ['bkash', 'cash', 'manual', 'bank'];
        const method = methods.includes(methodRaw) ? methodRaw : 'manual';

        const item = await StaffPayout.create({
            userId,
            role: String(body.role || targetUser.role || 'moderator').trim(),
            amount,
            periodMonth,
            paidAt: parseDate(body.paidAt) || new Date(),
            method,
            notes: String(body.notes || '').trim(),
            recordedBy,
        });

        await createAudit(req, 'staff_payout_created', {
            payoutId: String(item._id),
            userId: String(userId),
            amount,
            periodMonth,
        });

        broadcastFinanceEvent('payout-recorded', {
            payoutId: String(item._id),
            userId: String(userId),
            amount,
        });
        await broadcastSummary({});

        res.status(201).json({ item, message: 'Staff payout recorded successfully' });
    } catch (error) {
        console.error('adminCreateStaffPayout error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function adminGetFinanceSummary(req: AuthRequest, res: Response): Promise<void> {
    try {
        const range = parseDateRange(req.query as Record<string, unknown>);
        const summary = await readSummary(range);
        res.json({
            totalIncome: summary.income,
            totalExpenses: summary.expense + summary.payouts,
            directExpenses: summary.expense,
            salaryPayouts: summary.payouts,
            netProfit: summary.net,
            window: {
                from: range.from || null,
                to: range.to || null,
            },
        });
    } catch (error) {
        console.error('adminGetFinanceSummary error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function adminGetFinanceRevenueSeries(req: AuthRequest, res: Response): Promise<void> {
    try {
        const query = req.query as Record<string, unknown>;
        const range = parseDateRange(query);
        const bucket = String(query.bucket || 'month').trim() === 'day' ? 'day' : 'month';

        const rows = await ManualPayment.find(buildDateMatch('date', range)).select('amount date').lean();
        const grouped = new Map<string, number>();

        for (const row of rows) {
            const date = new Date(String((row as { date?: Date }).date || new Date()));
            const key = periodKey(date, bucket);
            grouped.set(key, numeric(grouped.get(key), 0) + numeric((row as { amount?: number }).amount, 0));
        }

        const series = Array.from(grouped.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([period, amount]) => ({ period, amount }));

        res.json({ bucket, series });
    } catch (error) {
        console.error('adminGetFinanceRevenueSeries error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function adminGetFinanceExpenseBreakdown(req: AuthRequest, res: Response): Promise<void> {
    try {
        const range = parseDateRange(req.query as Record<string, unknown>);

        const [expenseRows, payoutRows] = await Promise.all([
            ExpenseEntry.aggregate([
                { $match: buildDateMatch('date', range) },
                { $group: { _id: '$category', total: { $sum: '$amount' } } },
            ]),
            StaffPayout.aggregate([
                { $match: buildDateMatch('paidAt', range) },
                {
                    $group: {
                        _id: {
                            $cond: [
                                { $regexMatch: { input: '$role', regex: /moderator/i } },
                                'moderator_salary',
                                'staff_salary',
                            ],
                        },
                        total: { $sum: '$amount' },
                    },
                },
            ]),
        ]);

        const map = new Map<string, number>();
        for (const row of expenseRows) {
            map.set(String(row._id || 'misc'), numeric(row.total, 0));
        }
        for (const row of payoutRows) {
            const key = String(row._id || 'staff_salary');
            map.set(key, numeric(map.get(key), 0) + numeric(row.total, 0));
        }

        const items = Array.from(map.entries())
            .map(([category, amount]) => ({ category, amount }))
            .sort((a, b) => b.amount - a.amount);

        res.json({ items });
    } catch (error) {
        console.error('adminGetFinanceExpenseBreakdown error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}
export async function adminGetFinanceCashflow(req: AuthRequest, res: Response): Promise<void> {
    try {
        const query = req.query as Record<string, unknown>;
        const range = parseDateRange(query);
        const bucket: 'day' | 'month' = String(query.bucket || 'month').trim() === 'day' ? 'day' : 'month';

        const [payments, expenses, payouts] = await Promise.all([
            ManualPayment.find(buildDateMatch('date', range)).select('amount date').lean(),
            ExpenseEntry.find(buildDateMatch('date', range)).select('amount date').lean(),
            StaffPayout.find(buildDateMatch('paidAt', range)).select('amount paidAt').lean(),
        ]);

        const timeline = new Map<string, { income: number; expense: number }>();

        const applyIncome = (date: Date, amount: number) => {
            const key = periodKey(date, bucket);
            const current = timeline.get(key) || { income: 0, expense: 0 };
            current.income += amount;
            timeline.set(key, current);
        };

        const applyExpense = (date: Date, amount: number) => {
            const key = periodKey(date, bucket);
            const current = timeline.get(key) || { income: 0, expense: 0 };
            current.expense += amount;
            timeline.set(key, current);
        };

        for (const row of payments) {
            applyIncome(new Date(String((row as { date?: Date }).date || new Date())), numeric((row as { amount?: number }).amount, 0));
        }
        for (const row of expenses) {
            applyExpense(new Date(String((row as { date?: Date }).date || new Date())), numeric((row as { amount?: number }).amount, 0));
        }
        for (const row of payouts) {
            applyExpense(new Date(String((row as { paidAt?: Date }).paidAt || new Date())), numeric((row as { amount?: number }).amount, 0));
        }

        const items = Array.from(timeline.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([period, value]) => ({
                period,
                income: value.income,
                expense: value.expense,
                net: value.income - value.expense,
            }));

        res.json({ bucket, items });
    } catch (error) {
        console.error('adminGetFinanceCashflow error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function adminGetFinanceTestBoard(req: AuthRequest, res: Response): Promise<void> {
    try {
        const range = parseDateRange(req.query as Record<string, unknown>);
        const summary = await readSummary(range);
        const [dueRow, operationalRow, subscriptionBreakdown] = await Promise.all([
            StudentDueLedger.aggregate([{ $group: { _id: null, totalDue: { $sum: '$netDue' } } }]),
            ExpenseEntry.aggregate([
                { $match: { category: { $in: ['server', 'tools', 'marketing', 'misc'] } } },
                { $group: { _id: null, totalOperational: { $sum: '$amount' } } },
            ]),
            ManualPayment.aggregate([
                { $match: { entryType: 'subscription' } },
                {
                    $lookup: {
                        from: 'subscription_plans',
                        localField: 'subscriptionPlanId',
                        foreignField: '_id',
                        as: 'plan',
                    },
                },
                { $unwind: { path: '$plan', preserveNullAndEmptyArrays: true } },
                {
                    $group: {
                        _id: { $ifNull: ['$plan.code', 'unassigned'] },
                        total: { $sum: '$amount' },
                    },
                },
                { $sort: { total: -1 } },
            ]),
        ]);

        res.json({
            liveIncome: summary.income,
            liveExpense: summary.expense + summary.payouts,
            netPosition: summary.net,
            totalLiabilities: numeric(dueRow[0]?.totalDue, 0),
            totalOperationalCost: numeric(operationalRow[0]?.totalOperational, 0),
            subscriptionRevenueTracking: subscriptionBreakdown.map((item) => ({
                planCode: String(item._id || 'unassigned'),
                amount: numeric(item.total, 0),
            })),
            asOf: new Date().toISOString(),
        });
    } catch (error) {
        console.error('adminGetFinanceTestBoard error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function adminGetDues(req: AuthRequest, res: Response): Promise<void> {
    try {
        const query = req.query as Record<string, unknown>;
        const { page, limit, skip } = parsePage(query);

        const dueStatus = String(query.status || '').trim();
        const filter: Record<string, unknown> = {};
        if (dueStatus === 'due') filter.netDue = { $gt: 0 };
        if (dueStatus === 'cleared') filter.netDue = { $lte: 0 };

        const [items, total] = await Promise.all([
            StudentDueLedger.find(filter)
                .populate('studentId', 'username email full_name')
                .populate('updatedBy', 'username full_name role')
                .sort({ netDue: -1, updatedAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            StudentDueLedger.countDocuments(filter),
        ]);

        res.json({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
    } catch (error) {
        console.error('adminGetDues error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function adminUpdateDue(req: AuthRequest, res: Response): Promise<void> {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }

        const studentId = asObjectId(req.params.studentId);
        if (!studentId) {
            res.status(400).json({ message: 'Invalid student id' });
            return;
        }

        const body = req.body as Record<string, unknown>;
        const computedDue = numeric(body.computedDue, 0);
        const manualAdjustment = numeric(body.manualAdjustment, 0);
        const waiverAmount = numeric(body.waiverAmount, 0);
        const netDue = computedDue + manualAdjustment - waiverAmount;

        const updatedBy = asObjectId(req.user._id);
        if (!updatedBy) {
            res.status(400).json({ message: 'Invalid actor id' });
            return;
        }

        const item = await StudentDueLedger.findOneAndUpdate(
            { studentId },
            {
                $set: {
                    computedDue,
                    manualAdjustment,
                    waiverAmount,
                    netDue,
                    note: String(body.note || '').trim(),
                    lastComputedAt: new Date(),
                    updatedBy,
                },
            },
            { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
        );

        await createAudit(req, 'student_due_updated', {
            studentId: String(studentId),
            computedDue,
            manualAdjustment,
            waiverAmount,
            netDue,
        });

        broadcastFinanceEvent('due-updated', {
            studentId: String(studentId),
            netDue,
        });

        res.json({ item, message: 'Due ledger updated' });
    } catch (error) {
        console.error('adminUpdateDue error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function adminSendDueReminder(req: AuthRequest, res: Response): Promise<void> {
    try {
        const studentId = asObjectId(req.params.studentId);
        if (!studentId) {
            res.status(400).json({ message: 'Invalid student id' });
            return;
        }

        const ledger = await StudentDueLedger.findOne({ studentId }).lean();
        if (!ledger) {
            res.status(404).json({ message: 'Due ledger not found for this student' });
            return;
        }

        const [student, runtime] = await Promise.all([
            User.findById(studentId).select('username email full_name role').lean(),
            getRuntimeSettingsSnapshot(true),
        ]);

        if (!student || student.role !== 'student') {
            res.status(404).json({ message: 'Student not found' });
            return;
        }

        await createAudit(req, 'due_reminder_sent', {
            studentId: String(studentId),
            netDue: ledger.netDue,
            channels: {
                email: runtime.featureFlags.emailReminderEnabled,
                sms: runtime.featureFlags.smsReminderEnabled,
                inApp: true,
            },
        });

        res.json({
            message: 'Due reminder logged successfully',
            student: {
                _id: student._id,
                username: student.username,
                email: student.email,
                fullName: student.full_name || student.username,
            },
            channels: {
                email: runtime.featureFlags.emailReminderEnabled,
                sms: runtime.featureFlags.smsReminderEnabled,
                inApp: true,
            },
            netDue: ledger.netDue,
        });
    } catch (error) {
        console.error('adminSendDueReminder error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function adminDispatchReminders(req: AuthRequest, res: Response): Promise<void> {
    try {
        const runtime = await getRuntimeSettingsSnapshot(true);
        const now = new Date();
        const dayMs = 24 * 60 * 60 * 1000;
        const days7 = new Date(now.getTime() + 7 * dayMs);
        const days3 = new Date(now.getTime() + 3 * dayMs);

        const expiringUsers = await User.find({
            role: 'student',
            'subscription.expiryDate': { $gte: now, $lte: days7 },
        }).select('_id username email full_name subscription.expiryDate').lean();

        const highPriorityExpiring = expiringUsers.filter((user) => {
            const expiry = parseDate((user as { subscription?: { expiryDate?: Date } }).subscription?.expiryDate);
            return Boolean(expiry && expiry.getTime() <= days3.getTime());
        });

        const dueUsers = await StudentDueLedger.find({ netDue: { $gt: 0 } })
            .select('studentId netDue')
            .sort({ netDue: -1 })
            .lean();

        await createAudit(req, 'reminders_dispatched', {
            expiryReminderCount: expiringUsers.length,
            expiryHighPriorityCount: highPriorityExpiring.length,
            dueReminderCount: dueUsers.length,
            channels: {
                email: runtime.featureFlags.emailReminderEnabled,
                sms: runtime.featureFlags.smsReminderEnabled,
                inApp: true,
            },
        });

        res.json({
            message: 'Reminder dispatch completed',
            summary: {
                expiryReminderCount: expiringUsers.length,
                expiryHighPriorityCount: highPriorityExpiring.length,
                dueReminderCount: dueUsers.length,
                channels: {
                    email: runtime.featureFlags.emailReminderEnabled,
                    sms: runtime.featureFlags.smsReminderEnabled,
                    inApp: true,
                },
            },
        });
    } catch (error) {
        console.error('adminDispatchReminders error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function adminGetStudentLtv(req: AuthRequest, res: Response): Promise<void> {
    try {
        const studentId = asObjectId(req.params.id);
        if (!studentId) {
            res.status(400).json({ message: 'Invalid student id' });
            return;
        }

        const [student, payments, profile] = await Promise.all([
            User.findById(studentId).select('username email full_name role createdAt').lean(),
            ManualPayment.find({ studentId }).select('amount date entryType').sort({ date: 1 }).lean(),
            StudentProfile.findOne({ user_id: studentId }).select('admittedAt').lean(),
        ]);

        if (!student || student.role !== 'student') {
            res.status(404).json({ message: 'Student not found' });
            return;
        }

        const lifetimeIncome = payments.reduce((sum, item) => sum + numeric((item as { amount?: number }).amount, 0), 0);
        const firstPaymentDate = payments.length ? (payments[0] as { date?: Date }).date || null : null;
        const lastPaymentDate = payments.length ? (payments[payments.length - 1] as { date?: Date }).date || null : null;

        res.json({
            student: {
                _id: student._id,
                username: student.username,
                email: student.email,
                fullName: student.full_name || student.username,
                joinedAt: profile?.admittedAt || student.createdAt,
            },
            ltv: {
                lifetimeIncome,
                totalTransactions: payments.length,
                firstPaymentDate,
                lastPaymentDate,
                avgTransactionValue: payments.length > 0 ? Number((lifetimeIncome / payments.length).toFixed(2)) : 0,
            },
        });
    } catch (error) {
        console.error('adminGetStudentLtv error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

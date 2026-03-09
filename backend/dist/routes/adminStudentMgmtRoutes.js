"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const auth_1 = require("../middlewares/auth");
const User_1 = __importDefault(require("../models/User"));
const StudentProfile_1 = __importDefault(require("../models/StudentProfile"));
const UserSubscription_1 = __importDefault(require("../models/UserSubscription"));
const SubscriptionPlan_1 = __importDefault(require("../models/SubscriptionPlan"));
const StudentGroup_1 = __importDefault(require("../models/StudentGroup"));
const GroupMembership_1 = __importDefault(require("../models/GroupMembership"));
const StudentContactTimeline_1 = __importDefault(require("../models/StudentContactTimeline"));
const NotificationProvider_1 = __importDefault(require("../models/NotificationProvider"));
const NotificationTemplate_1 = __importDefault(require("../models/NotificationTemplate"));
const NotificationJob_1 = __importDefault(require("../models/NotificationJob"));
const NotificationDeliveryLog_1 = __importDefault(require("../models/NotificationDeliveryLog"));
const StudentSettings_1 = require("../models/StudentSettings");
const cryptoService_1 = require("../services/cryptoService");
const notificationProviderService_1 = require("../services/notificationProviderService");
const studentImportExportService_1 = require("../services/studentImportExportService");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
// All routes require admin auth
const adminAuth = [auth_1.authenticate, (0, auth_1.requireRole)('superadmin', 'admin', 'moderator')];
// ============================================================================
// STUDENTS V2
// ============================================================================
router.get('/students-v2', ...adminAuth, async (req, res) => {
    try {
        const { q, status, group, page = '1', limit = '20', profileScoreMin, subscriptionStatus, expiringDays, } = req.query;
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
        const skip = (pageNum - 1) * limitNum;
        const userQuery = { role: 'student' };
        if (status)
            userQuery['status'] = status;
        if (q) {
            const re = new RegExp(String(q), 'i');
            userQuery['$or'] = [{ full_name: re }, { email: re }, { username: re }, { phone_number: re }];
        }
        if (group && mongoose_1.default.Types.ObjectId.isValid(group)) {
            const groupId = new mongoose_1.default.Types.ObjectId(group);
            const memberships = await GroupMembership_1.default.find({ groupId }).select('studentId').lean();
            const memberIds = memberships.map((m) => m.studentId);
            userQuery['_id'] = { $in: memberIds };
        }
        if (subscriptionStatus || expiringDays) {
            const subQuery = {};
            if (subscriptionStatus)
                subQuery['status'] = subscriptionStatus;
            if (expiringDays) {
                const days = parseInt(expiringDays, 10);
                if (!isNaN(days)) {
                    const cutoff = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
                    subQuery['expiresAtUTC'] = { $lte: cutoff };
                    subQuery['status'] = 'active';
                }
            }
            const subs = await UserSubscription_1.default.find(subQuery).select('userId').lean();
            const subUserIds = subs.map((s) => s.userId);
            const existingId = userQuery['_id'];
            userQuery['_id'] = existingId
                ? { $in: existingId.$in.filter((id) => subUserIds.some((sid) => String(sid) === String(id))) }
                : { $in: subUserIds };
        }
        const [users, total] = await Promise.all([
            User_1.default.find(userQuery)
                .select('-password -twoFactorSecret')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            User_1.default.countDocuments(userQuery),
        ]);
        const userIds = users.map((u) => u._id);
        const [profiles, subscriptions] = await Promise.all([
            StudentProfile_1.default.find({ user_id: { $in: userIds } }).lean(),
            UserSubscription_1.default.find({ userId: { $in: userIds }, status: 'active' })
                .populate('planId', 'name code')
                .lean(),
        ]);
        const profileMap = new Map(profiles.map((p) => [String(p.user_id), p]));
        const subMap = new Map(subscriptions.map((s) => [String(s.userId), s]));
        const filterScore = profileScoreMin ? parseInt(profileScoreMin, 10) : undefined;
        const data = users
            .map((u) => ({
            ...u,
            profile: profileMap.get(String(u._id)) ?? null,
            subscription: subMap.get(String(u._id)) ?? null,
        }))
            .filter((row) => {
            if (filterScore === undefined)
                return true;
            const score = row.profile?.['profile_completion_percentage'] ?? 0;
            return score >= filterScore;
        });
        res.json({ data, total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) });
    }
    catch (err) {
        res.status(500).json({ message: 'Failed to fetch students', error: String(err) });
    }
});
router.get('/students-v2/template.xlsx', ...adminAuth, async (_req, res) => {
    try {
        const buffer = await (0, studentImportExportService_1.generateTemplateXlsx)();
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="students_import_template.xlsx"');
        res.send(buffer);
    }
    catch (err) {
        res.status(500).json({ message: String(err) });
    }
});
router.get('/students-v2/export', ...adminAuth, async (req, res) => {
    try {
        const format = String(req.query['format'] ?? 'xlsx');
        const filters = {};
        if (req.query['status'])
            filters['status'] = req.query['status'];
        if (req.query['q'])
            filters['q'] = req.query['q'];
        const buffer = await (0, studentImportExportService_1.exportStudents)(filters, format === 'csv' ? 'csv' : 'xlsx');
        if (format === 'csv') {
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="students_export.csv"');
        }
        else {
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename="students_export.xlsx"');
        }
        res.send(buffer);
    }
    catch (err) {
        res.status(500).json({ message: String(err) });
    }
});
router.post('/students-v2/import/preview', ...adminAuth, upload.single('file'), async (req, res) => {
    try {
        if (!req.file)
            return res.status(400).json({ message: 'file is required' });
        const { rows, columns } = await (0, studentImportExportService_1.parseFileBuffer)(req.file.buffer, req.file.mimetype);
        const preview = await (0, studentImportExportService_1.generatePreview)(rows, columns);
        res.json({ ...preview, allRows: rows });
    }
    catch (err) {
        res.status(500).json({ message: String(err) });
    }
});
router.post('/students-v2/import/commit', ...adminAuth, async (req, res) => {
    try {
        const { mode, dedupeField, mapping, rows } = req.body;
        if (!mode || !dedupeField || !mapping || !Array.isArray(rows)) {
            return res.status(400).json({ message: 'mode, dedupeField, mapping, rows required' });
        }
        const adminId = String(req['user'] && req['user']['_id'] || '');
        const result = await (0, studentImportExportService_1.commitImport)({ mode, dedupeField, mapping, rows }, adminId);
        res.json(result);
    }
    catch (err) {
        res.status(500).json({ message: String(err) });
    }
});
router.post('/students-v2/bulk-delete', ...adminAuth, async (req, res) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'ids array required' });
        }
        const validIds = ids.filter((id) => mongoose_1.default.Types.ObjectId.isValid(id));
        await Promise.all([
            User_1.default.deleteMany({ _id: { $in: validIds } }),
            StudentProfile_1.default.deleteMany({ user_id: { $in: validIds } }),
        ]);
        res.json({ message: `Deleted ${validIds.length} students`, deleted: validIds.length });
    }
    catch (err) {
        res.status(500).json({ message: String(err) });
    }
});
router.post('/students-v2/bulk-update', ...adminAuth, async (req, res) => {
    try {
        const { ids, update } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'ids array required' });
        }
        const validIds = ids.filter((id) => mongoose_1.default.Types.ObjectId.isValid(id));
        const allowedUserFields = {};
        if (update['status'] && ['active', 'suspended', 'blocked', 'pending'].includes(String(update['status']))) {
            allowedUserFields['status'] = update['status'];
        }
        if (Object.keys(allowedUserFields).length > 0) {
            await User_1.default.updateMany({ _id: { $in: validIds } }, { $set: allowedUserFields });
        }
        res.json({ message: `Updated ${validIds.length} students`, updated: validIds.length });
    }
    catch (err) {
        res.status(500).json({ message: String(err) });
    }
});
router.get('/students-v2/:id', ...adminAuth, async (req, res) => {
    try {
        const user = await User_1.default.findById(req.params.id).select('-password -twoFactorSecret').lean();
        if (!user)
            return res.status(404).json({ message: 'Student not found' });
        const [profile, subscription, subscriptionHistory] = await Promise.all([
            StudentProfile_1.default.findOne({ user_id: user._id }).lean(),
            UserSubscription_1.default.findOne({ userId: user._id, status: 'active' })
                .populate('planId', 'name code durationDays')
                .lean(),
            UserSubscription_1.default.find({ userId: user._id })
                .populate('planId', 'name code')
                .sort({ createdAt: -1 })
                .limit(10)
                .lean(),
        ]);
        res.json({ ...user, profile, subscription, subscriptionHistory });
    }
    catch (err) {
        res.status(500).json({ message: String(err) });
    }
});
router.put('/students-v2/:id', ...adminAuth, async (req, res) => {
    try {
        const { full_name, email, phone_number, status, ...profileFields } = req.body;
        const userUpdate = {};
        if (full_name)
            userUpdate['full_name'] = full_name;
        if (email)
            userUpdate['email'] = email;
        if (phone_number)
            userUpdate['phone_number'] = phone_number;
        if (status && ['active', 'suspended', 'blocked', 'pending'].includes(status)) {
            userUpdate['status'] = status;
        }
        const user = await User_1.default.findByIdAndUpdate(req.params.id, { $set: userUpdate }, { new: true })
            .select('-password -twoFactorSecret').lean();
        if (!user)
            return res.status(404).json({ message: 'Student not found' });
        const profileUpdate = {};
        const profileKeys = [
            'guardian_phone', 'department', 'ssc_batch', 'hsc_batch', 'college_name',
            'college_address', 'present_address', 'district', 'gender', 'dob',
            'guardian_name', 'roll_number', 'registration_id',
        ];
        for (const key of profileKeys) {
            if (profileFields[key] !== undefined)
                profileUpdate[key] = profileFields[key];
        }
        if (full_name)
            profileUpdate['full_name'] = full_name;
        if (phone_number)
            profileUpdate['phone_number'] = phone_number;
        const profile = await StudentProfile_1.default.findOneAndUpdate({ user_id: req.params.id }, { $set: profileUpdate }, { upsert: true, new: true }).lean();
        res.json({ ...user, profile });
    }
    catch (err) {
        res.status(500).json({ message: String(err) });
    }
});
router.post('/students-v2/:id/suspend', ...adminAuth, async (req, res) => {
    try {
        const user = await User_1.default.findByIdAndUpdate(req.params.id, { $set: { status: 'suspended' } }, { new: true }).select('-password').lean();
        if (!user)
            return res.status(404).json({ message: 'Student not found' });
        res.json({ message: 'Student suspended', user });
    }
    catch (err) {
        res.status(500).json({ message: String(err) });
    }
});
router.post('/students-v2/:id/activate', ...adminAuth, async (req, res) => {
    try {
        const user = await User_1.default.findByIdAndUpdate(req.params.id, { $set: { status: 'active' } }, { new: true }).select('-password').lean();
        if (!user)
            return res.status(404).json({ message: 'Student not found' });
        res.json({ message: 'Student activated', user });
    }
    catch (err) {
        res.status(500).json({ message: String(err) });
    }
});
router.post('/students-v2/:id/reset-password', ...adminAuth, async (req, res) => {
    try {
        const { newPassword } = req.body;
        if (!newPassword || String(newPassword).length < 6) {
            return res.status(400).json({ message: 'newPassword must be at least 6 characters' });
        }
        const hashed = await bcryptjs_1.default.hash(String(newPassword), 12);
        const user = await User_1.default.findByIdAndUpdate(req.params.id, { $set: { password: hashed, mustChangePassword: true, passwordResetRequired: true } }, { new: true }).select('-password').lean();
        if (!user)
            return res.status(404).json({ message: 'Student not found' });
        res.json({ message: 'Password reset successfully' });
    }
    catch (err) {
        res.status(500).json({ message: String(err) });
    }
});
// ============================================================================
// STUDENT GROUPS
// ============================================================================
router.get('/student-groups', ...adminAuth, async (req, res) => {
    try {
        const { q, isActive, page = '1', limit = '50' } = req.query;
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
        const query = {};
        if (isActive !== undefined)
            query['isActive'] = isActive === 'true';
        if (q)
            query['name'] = new RegExp(String(q), 'i');
        const [groups, total] = await Promise.all([
            StudentGroup_1.default.find(query).sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum).lean(),
            StudentGroup_1.default.countDocuments(query),
        ]);
        res.json({ data: groups, total, page: pageNum, limit: limitNum });
    }
    catch (err) {
        res.status(500).json({ message: String(err) });
    }
});
router.post('/student-groups', ...adminAuth, async (req, res) => {
    try {
        const { name, description, batchTag, type, rules, isActive } = req.body;
        if (!name)
            return res.status(400).json({ message: 'name is required' });
        const slug = String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') + '-' + Date.now();
        const adminUser = req['user'];
        const group = await StudentGroup_1.default.create({
            name, slug, description, batchTag,
            type: type || 'manual',
            rules: rules || {},
            isActive: isActive !== false,
            createdByAdminId: adminUser?.['_id'],
        });
        res.status(201).json(group);
    }
    catch (err) {
        res.status(500).json({ message: String(err) });
    }
});
router.get('/student-groups/:id', ...adminAuth, async (req, res) => {
    try {
        const group = await StudentGroup_1.default.findById(req.params.id).lean();
        if (!group)
            return res.status(404).json({ message: 'Group not found' });
        const count = await GroupMembership_1.default.countDocuments({ groupId: group._id });
        res.json({ ...group, memberCount: count });
    }
    catch (err) {
        res.status(500).json({ message: String(err) });
    }
});
router.put('/student-groups/:id', ...adminAuth, async (req, res) => {
    try {
        const { name, description, batchTag, type, rules, isActive } = req.body;
        const update = {};
        if (name !== undefined)
            update['name'] = name;
        if (description !== undefined)
            update['description'] = description;
        if (batchTag !== undefined)
            update['batchTag'] = batchTag;
        if (type !== undefined)
            update['type'] = type;
        if (rules !== undefined)
            update['rules'] = rules;
        if (isActive !== undefined)
            update['isActive'] = isActive;
        const group = await StudentGroup_1.default.findByIdAndUpdate(req.params.id, { $set: update }, { new: true }).lean();
        if (!group)
            return res.status(404).json({ message: 'Group not found' });
        res.json(group);
    }
    catch (err) {
        res.status(500).json({ message: String(err) });
    }
});
router.delete('/student-groups/:id', ...adminAuth, async (req, res) => {
    try {
        const group = await StudentGroup_1.default.findByIdAndDelete(req.params.id).lean();
        if (!group)
            return res.status(404).json({ message: 'Group not found' });
        await GroupMembership_1.default.deleteMany({ groupId: req.params.id });
        res.json({ message: 'Group deleted' });
    }
    catch (err) {
        res.status(500).json({ message: String(err) });
    }
});
router.post('/student-groups/:id/members/add', ...adminAuth, async (req, res) => {
    try {
        const { studentIds } = req.body;
        if (!Array.isArray(studentIds) || studentIds.length === 0) {
            return res.status(400).json({ message: 'studentIds array required' });
        }
        const groupId = new mongoose_1.default.Types.ObjectId(req.params.id);
        const adminUser = req['user'];
        const adminId = adminUser?.['_id'];
        let added = 0;
        for (const sid of studentIds) {
            if (!mongoose_1.default.Types.ObjectId.isValid(sid))
                continue;
            try {
                await GroupMembership_1.default.create({
                    groupId,
                    studentId: new mongoose_1.default.Types.ObjectId(sid),
                    addedByAdminId: adminId,
                });
                added++;
            }
            catch { /* Duplicate - skip */ }
        }
        await StudentGroup_1.default.findByIdAndUpdate(groupId, {
            $set: { memberCountCached: await GroupMembership_1.default.countDocuments({ groupId }) },
        });
        res.json({ message: `Added ${added} members`, added });
    }
    catch (err) {
        res.status(500).json({ message: String(err) });
    }
});
router.post('/student-groups/:id/members/remove', ...adminAuth, async (req, res) => {
    try {
        const { studentIds } = req.body;
        if (!Array.isArray(studentIds) || studentIds.length === 0) {
            return res.status(400).json({ message: 'studentIds array required' });
        }
        const groupId = new mongoose_1.default.Types.ObjectId(req.params.id);
        const oids = studentIds
            .filter((id) => mongoose_1.default.Types.ObjectId.isValid(id))
            .map((id) => new mongoose_1.default.Types.ObjectId(id));
        const result = await GroupMembership_1.default.deleteMany({ groupId, studentId: { $in: oids } });
        await StudentGroup_1.default.findByIdAndUpdate(groupId, {
            $set: { memberCountCached: await GroupMembership_1.default.countDocuments({ groupId }) },
        });
        res.json({ message: `Removed ${result.deletedCount} members`, removed: result.deletedCount });
    }
    catch (err) {
        res.status(500).json({ message: String(err) });
    }
});
router.get('/student-groups/:id/members/export', ...adminAuth, async (req, res) => {
    try {
        const groupId = new mongoose_1.default.Types.ObjectId(req.params.id);
        const memberships = await GroupMembership_1.default.find({ groupId }).select('studentId').lean();
        const memberIds = memberships.map((m) => m.studentId);
        const users = await User_1.default.find({ _id: { $in: memberIds } })
            .select('full_name email phone_number status createdAt')
            .lean();
        const headers = 'Full Name,Email,Phone,Status,Created At';
        const lines = users.map((u) => `"${u.full_name}","${u.email}","${u.phone_number ?? ''}","${u.status}","${u.createdAt?.toISOString() ?? ''}"`);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="group_${req.params.id}_members.csv"`);
        res.send([headers, ...lines].join('\n'));
    }
    catch (err) {
        res.status(500).json({ message: String(err) });
    }
});
// ============================================================================
// STUDENT CONTACT TIMELINE (CRM)
// ============================================================================
router.get('/student-contact-timeline/:studentId', ...adminAuth, async (req, res) => {
    try {
        const entries = await StudentContactTimeline_1.default.find({ studentId: req.params.studentId })
            .sort({ createdAt: -1 })
            .populate('createdByAdminId', 'full_name username')
            .lean();
        res.json({ data: entries });
    }
    catch (err) {
        res.status(500).json({ message: String(err) });
    }
});
router.post('/student-contact-timeline/:studentId', ...adminAuth, async (req, res) => {
    try {
        const { type, content, linkedId } = req.body;
        if (!type || !content)
            return res.status(400).json({ message: 'type and content required' });
        const adminUser = req['user'];
        const entry = await StudentContactTimeline_1.default.create({
            studentId: new mongoose_1.default.Types.ObjectId(req.params.studentId),
            type,
            content: String(content).slice(0, 2000),
            linkedId: linkedId ? new mongoose_1.default.Types.ObjectId(linkedId) : undefined,
            createdByAdminId: adminUser?.['_id'],
        });
        res.status(201).json(entry);
    }
    catch (err) {
        res.status(500).json({ message: String(err) });
    }
});
router.delete('/student-contact-timeline/:studentId/:entryId', ...adminAuth, async (req, res) => {
    try {
        const entry = await StudentContactTimeline_1.default.findOneAndDelete({
            _id: req.params.entryId,
            studentId: req.params.studentId,
        }).lean();
        if (!entry)
            return res.status(404).json({ message: 'Entry not found' });
        res.json({ message: 'Entry deleted' });
    }
    catch (err) {
        res.status(500).json({ message: String(err) });
    }
});
// ============================================================================
// SUBSCRIPTIONS V2
// ============================================================================
router.get('/subscriptions-v2', ...adminAuth, async (req, res) => {
    try {
        const { status, page = '1', limit = '20', q } = req.query;
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
        const query = {};
        if (status)
            query['status'] = status;
        if (q) {
            const users = await User_1.default.find({
                $or: [
                    { full_name: new RegExp(q, 'i') },
                    { email: new RegExp(q, 'i') },
                    { phone_number: new RegExp(q, 'i') },
                ],
            }).select('_id').lean();
            query['userId'] = { $in: users.map((u) => u._id) };
        }
        const [subs, total] = await Promise.all([
            UserSubscription_1.default.find(query)
                .populate('userId', 'full_name email phone_number status')
                .populate('planId', 'name code priceBDT')
                .sort({ createdAt: -1 })
                .skip((pageNum - 1) * limitNum)
                .limit(limitNum)
                .lean(),
            UserSubscription_1.default.countDocuments(query),
        ]);
        res.json({ data: subs, total, page: pageNum, limit: limitNum });
    }
    catch (err) {
        res.status(500).json({ message: String(err) });
    }
});
router.post('/subscriptions-v2/users/:studentId/assign', ...adminAuth, async (req, res) => {
    try {
        const { planId, startDate, notes } = req.body;
        if (!planId)
            return res.status(400).json({ message: 'planId required' });
        const plan = await SubscriptionPlan_1.default.findById(planId).lean();
        if (!plan)
            return res.status(404).json({ message: 'Plan not found' });
        const adminUser = req['user'];
        const start = startDate ? new Date(startDate) : new Date();
        const expires = new Date(start.getTime() + plan['durationDays'] * 24 * 60 * 60 * 1000);
        await UserSubscription_1.default.updateMany({ userId: req.params.studentId, status: 'active' }, { $set: { status: 'expired' } });
        const sub = await UserSubscription_1.default.create({
            userId: new mongoose_1.default.Types.ObjectId(req.params.studentId),
            planId: plan._id,
            status: 'active',
            startAtUTC: start,
            expiresAtUTC: expires,
            activatedByAdminId: adminUser?.['_id'],
            notes: notes ?? '',
        });
        await User_1.default.findByIdAndUpdate(req.params.studentId, {
            $set: {
                'subscription.plan': String(plan._id),
                'subscription.planCode': plan['code'],
                'subscription.planName': plan['name'],
                'subscription.isActive': true,
                'subscription.startDate': start,
                'subscription.expiryDate': expires,
                'subscription.assignedBy': adminUser?.['_id'],
                'subscription.assignedAt': new Date(),
            },
        });
        res.status(201).json(sub);
    }
    catch (err) {
        res.status(500).json({ message: String(err) });
    }
});
router.post('/subscriptions-v2/users/:studentId/extend', ...adminAuth, async (req, res) => {
    try {
        const { days, notes } = req.body;
        if (!days || isNaN(Number(days)))
            return res.status(400).json({ message: 'days (number) required' });
        const sub = await UserSubscription_1.default.findOne({ userId: req.params.studentId, status: 'active' });
        if (!sub)
            return res.status(404).json({ message: 'No active subscription found' });
        const newExpiry = new Date(sub.expiresAtUTC.getTime() + Number(days) * 24 * 60 * 60 * 1000);
        sub.expiresAtUTC = newExpiry;
        if (notes)
            sub.notes = (sub.notes ? sub.notes + ' | ' : '') + notes;
        await sub.save();
        await User_1.default.findByIdAndUpdate(req.params.studentId, {
            $set: { 'subscription.expiryDate': newExpiry },
        });
        res.json({ message: `Extended by ${days} days`, newExpiry, sub });
    }
    catch (err) {
        res.status(500).json({ message: String(err) });
    }
});
router.post('/subscriptions-v2/users/:studentId/expire-now', ...adminAuth, async (req, res) => {
    try {
        await UserSubscription_1.default.updateMany({ userId: req.params.studentId, status: 'active' }, { $set: { status: 'expired', expiresAtUTC: new Date() } });
        await User_1.default.findByIdAndUpdate(req.params.studentId, {
            $set: { 'subscription.isActive': false },
        });
        res.json({ message: 'Subscription expired immediately' });
    }
    catch (err) {
        res.status(500).json({ message: String(err) });
    }
});
router.post('/subscriptions-v2/users/:studentId/toggle-auto-renew', ...adminAuth, async (req, res) => {
    try {
        const sub = await UserSubscription_1.default.findOne({ userId: req.params.studentId, status: 'active' });
        if (!sub)
            return res.status(404).json({ message: 'No active subscription found' });
        sub.autoRenewEnabled = !sub.autoRenewEnabled;
        await sub.save();
        res.json({ message: `Auto-renew ${sub.autoRenewEnabled ? 'enabled' : 'disabled'}`, autoRenewEnabled: sub.autoRenewEnabled });
    }
    catch (err) {
        res.status(500).json({ message: String(err) });
    }
});
// ============================================================================
// NOTIFICATION PROVIDERS
// ============================================================================
router.get('/notification-providers', ...adminAuth, async (_req, res) => {
    try {
        const providers = await NotificationProvider_1.default.find().select('-credentialsEncrypted').lean();
        res.json({ data: providers });
    }
    catch (err) {
        res.status(500).json({ message: String(err) });
    }
});
router.post('/notification-providers', ...adminAuth, async (req, res) => {
    try {
        const { type, provider, displayName, credentials, senderConfig, rateLimit, isEnabled } = req.body;
        if (!type || !provider || !displayName || !credentials) {
            return res.status(400).json({ message: 'type, provider, displayName, credentials required' });
        }
        const credentialsEncrypted = (0, cryptoService_1.encrypt)(JSON.stringify(credentials));
        const doc = await NotificationProvider_1.default.create({
            type, provider, displayName,
            credentialsEncrypted,
            senderConfig: senderConfig ?? {},
            rateLimit: rateLimit ?? { perMinute: 30, perDay: 1000 },
            isEnabled: isEnabled !== false,
        });
        const safe = doc.toObject();
        delete safe['credentialsEncrypted'];
        res.status(201).json(safe);
    }
    catch (err) {
        res.status(500).json({ message: String(err) });
    }
});
router.get('/notification-providers/:id', ...adminAuth, async (req, res) => {
    try {
        const doc = await NotificationProvider_1.default.findById(req.params.id).select('-credentialsEncrypted').lean();
        if (!doc)
            return res.status(404).json({ message: 'Provider not found' });
        res.json(doc);
    }
    catch (err) {
        res.status(500).json({ message: String(err) });
    }
});
router.put('/notification-providers/:id', ...adminAuth, async (req, res) => {
    try {
        const { displayName, credentials, senderConfig, rateLimit, isEnabled } = req.body;
        const update = {};
        if (displayName !== undefined)
            update['displayName'] = displayName;
        if (senderConfig !== undefined)
            update['senderConfig'] = senderConfig;
        if (rateLimit !== undefined)
            update['rateLimit'] = rateLimit;
        if (isEnabled !== undefined)
            update['isEnabled'] = isEnabled;
        if (credentials !== undefined)
            update['credentialsEncrypted'] = (0, cryptoService_1.encrypt)(JSON.stringify(credentials));
        const doc = await NotificationProvider_1.default.findByIdAndUpdate(req.params.id, { $set: update }, { new: true }).select('-credentialsEncrypted').lean();
        if (!doc)
            return res.status(404).json({ message: 'Provider not found' });
        res.json(doc);
    }
    catch (err) {
        res.status(500).json({ message: String(err) });
    }
});
router.delete('/notification-providers/:id', ...adminAuth, async (req, res) => {
    try {
        const doc = await NotificationProvider_1.default.findByIdAndDelete(req.params.id).lean();
        if (!doc)
            return res.status(404).json({ message: 'Provider not found' });
        res.json({ message: 'Provider deleted' });
    }
    catch (err) {
        res.status(500).json({ message: String(err) });
    }
});
router.post('/notification-providers/:id/test-send', ...adminAuth, async (req, res) => {
    try {
        const { studentId } = req.body;
        if (!studentId)
            return res.status(400).json({ message: 'studentId required' });
        const provider = await NotificationProvider_1.default.findById(req.params.id).select('+credentialsEncrypted').lean();
        if (!provider)
            return res.status(404).json({ message: 'Provider not found' });
        const result = await (0, notificationProviderService_1.sendNotificationToStudent)(studentId, 'SUB_EXPIRY_7D', provider['type'], { expiry_date: new Date().toISOString().split('T')[0], plan_name: 'Test' });
        res.json({ result });
    }
    catch (err) {
        res.status(500).json({ message: String(err) });
    }
});
// ============================================================================
// NOTIFICATION TEMPLATES
// ============================================================================
router.get('/notification-templates', ...adminAuth, async (_req, res) => {
    try {
        const templates = await NotificationTemplate_1.default.find().sort({ key: 1 }).lean();
        res.json({ data: templates });
    }
    catch (err) {
        res.status(500).json({ message: String(err) });
    }
});
router.post('/notification-templates', ...adminAuth, async (req, res) => {
    try {
        const { key, channel, subject, body, placeholdersAllowed, isEnabled } = req.body;
        if (!key || !channel || !body) {
            return res.status(400).json({ message: 'key, channel, body required' });
        }
        const template = await NotificationTemplate_1.default.create({
            key: String(key).toUpperCase(),
            channel, subject: subject ?? '', body,
            placeholdersAllowed: placeholdersAllowed ?? [],
            isEnabled: isEnabled !== false,
        });
        res.status(201).json(template);
    }
    catch (err) {
        res.status(500).json({ message: String(err) });
    }
});
router.get('/notification-templates/:id', ...adminAuth, async (req, res) => {
    try {
        const template = await NotificationTemplate_1.default.findById(req.params.id).lean();
        if (!template)
            return res.status(404).json({ message: 'Template not found' });
        res.json(template);
    }
    catch (err) {
        res.status(500).json({ message: String(err) });
    }
});
router.put('/notification-templates/:id', ...adminAuth, async (req, res) => {
    try {
        const { subject, body, placeholdersAllowed, isEnabled } = req.body;
        const update = {};
        if (subject !== undefined)
            update['subject'] = subject;
        if (body !== undefined)
            update['body'] = body;
        if (placeholdersAllowed !== undefined)
            update['placeholdersAllowed'] = placeholdersAllowed;
        if (isEnabled !== undefined)
            update['isEnabled'] = isEnabled;
        const template = await NotificationTemplate_1.default.findByIdAndUpdate(req.params.id, { $set: update }, { new: true }).lean();
        if (!template)
            return res.status(404).json({ message: 'Template not found' });
        res.json(template);
    }
    catch (err) {
        res.status(500).json({ message: String(err) });
    }
});
router.delete('/notification-templates/:id', ...adminAuth, async (req, res) => {
    try {
        const template = await NotificationTemplate_1.default.findByIdAndDelete(req.params.id).lean();
        if (!template)
            return res.status(404).json({ message: 'Template not found' });
        res.json({ message: 'Template deleted' });
    }
    catch (err) {
        res.status(500).json({ message: String(err) });
    }
});
// ============================================================================
// NOTIFICATIONS V2 - SEND / JOBS / LOGS
// ============================================================================
router.post('/notifications-v2/send', ...adminAuth, async (req, res) => {
    try {
        const { channel, target, templateKey, payloadOverrides, targetStudentId, targetGroupId, targetStudentIds, targetFilterJson, scheduledAtUTC, } = req.body;
        if (!channel || !target || !templateKey) {
            return res.status(400).json({ message: 'channel, target, templateKey required' });
        }
        const adminUser = req['user'];
        const adminId = adminUser?.['_id'];
        let recipientIds = [];
        if (target === 'single' && targetStudentId) {
            recipientIds = [new mongoose_1.default.Types.ObjectId(targetStudentId)];
        }
        else if (target === 'group' && targetGroupId) {
            const members = await GroupMembership_1.default.find({
                groupId: new mongoose_1.default.Types.ObjectId(targetGroupId),
            }).select('studentId').lean();
            recipientIds = members.map((m) => new mongoose_1.default.Types.ObjectId(String(m.studentId)));
        }
        else if (target === 'selected' && Array.isArray(targetStudentIds)) {
            recipientIds = targetStudentIds
                .filter((id) => mongoose_1.default.Types.ObjectId.isValid(id))
                .map((id) => new mongoose_1.default.Types.ObjectId(id));
        }
        else if (target === 'filter' && targetFilterJson) {
            try {
                const filterQuery = JSON.parse(targetFilterJson);
                const users = await User_1.default.find({ ...filterQuery, role: 'student' }).select('_id').lean();
                recipientIds = users.map((u) => new mongoose_1.default.Types.ObjectId(String(u._id)));
            }
            catch { /* invalid filter */ }
        }
        const job = await NotificationJob_1.default.create({
            type: scheduledAtUTC ? 'scheduled' : 'bulk',
            channel, target,
            targetStudentId: targetStudentId ? new mongoose_1.default.Types.ObjectId(targetStudentId) : undefined,
            targetGroupId: targetGroupId ? new mongoose_1.default.Types.ObjectId(targetGroupId) : undefined,
            targetStudentIds: target === 'selected' ? recipientIds : undefined,
            targetFilterJson: targetFilterJson ?? undefined,
            templateKey: String(templateKey).toUpperCase(),
            payloadOverrides: payloadOverrides ?? {},
            status: scheduledAtUTC ? 'queued' : 'processing',
            scheduledAtUTC: scheduledAtUTC ? new Date(scheduledAtUTC) : undefined,
            totalTargets: recipientIds.length,
            sentCount: 0,
            failedCount: 0,
            createdByAdminId: adminId,
        });
        if (!scheduledAtUTC && recipientIds.length <= 50) {
            let sent = 0;
            let failed = 0;
            const vars = (payloadOverrides ?? {});
            const channels = channel === 'both' ? ['sms', 'email'] : [channel];
            for (const recipId of recipientIds) {
                for (const ch of channels) {
                    try {
                        const result = await (0, notificationProviderService_1.sendNotificationToStudent)(recipId, templateKey, ch, vars, job._id);
                        if (result.success)
                            sent++;
                        else
                            failed++;
                    }
                    catch {
                        failed++;
                    }
                }
            }
            await NotificationJob_1.default.findByIdAndUpdate(job._id, {
                $set: {
                    status: failed === 0 ? 'done' : sent > 0 ? 'partial' : 'failed',
                    sentCount: sent,
                    failedCount: failed,
                    processedAtUTC: new Date(),
                },
            });
            return res.status(201).json({ message: 'Notification job completed', jobId: String(job._id), sent, failed });
        }
        res.status(201).json({
            message: scheduledAtUTC ? 'Notification job scheduled' : 'Notification job queued (large batch)',
            jobId: String(job._id),
            totalTargets: recipientIds.length,
        });
    }
    catch (err) {
        res.status(500).json({ message: String(err) });
    }
});
router.get('/notifications-v2/jobs', ...adminAuth, async (req, res) => {
    try {
        const { status, page = '1', limit = '20' } = req.query;
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
        const query = {};
        if (status)
            query['status'] = status;
        const [jobs, total] = await Promise.all([
            NotificationJob_1.default.find(query).sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum).lean(),
            NotificationJob_1.default.countDocuments(query),
        ]);
        res.json({ data: jobs, total, page: pageNum, limit: limitNum });
    }
    catch (err) {
        res.status(500).json({ message: String(err) });
    }
});
router.get('/notifications-v2/jobs/:id', ...adminAuth, async (req, res) => {
    try {
        const job = await NotificationJob_1.default.findById(req.params.id).lean();
        if (!job)
            return res.status(404).json({ message: 'Job not found' });
        res.json(job);
    }
    catch (err) {
        res.status(500).json({ message: String(err) });
    }
});
router.post('/notifications-v2/jobs/:id/retry-failed', ...adminAuth, async (req, res) => {
    try {
        const job = await NotificationJob_1.default.findById(req.params.id);
        if (!job)
            return res.status(404).json({ message: 'Job not found' });
        if (!['failed', 'partial'].includes(job.status)) {
            return res.status(400).json({ message: 'Only failed or partial jobs can be retried' });
        }
        const failedLogs = await NotificationDeliveryLog_1.default.find({ jobId: job._id, status: 'failed' }).lean();
        let sent = 0;
        let failed = 0;
        const vars = (job.payloadOverrides ?? {});
        for (const log of failedLogs) {
            try {
                const logData = log;
                const result = await (0, notificationProviderService_1.sendNotificationToStudent)(logData['studentId'], job.templateKey, logData['channel'], vars, job._id);
                if (result.success) {
                    sent++;
                    await NotificationDeliveryLog_1.default.findByIdAndUpdate(log._id, {
                        $set: { status: 'sent', sentAtUTC: new Date() },
                    });
                }
                else {
                    failed++;
                }
            }
            catch {
                failed++;
            }
        }
        await NotificationJob_1.default.findByIdAndUpdate(job._id, {
            $set: {
                status: failed === 0 ? 'done' : sent > 0 ? 'partial' : 'failed',
                sentCount: job.sentCount + sent,
                failedCount: failed,
            },
        });
        res.json({ message: 'Retry complete', sent, failed });
    }
    catch (err) {
        res.status(500).json({ message: String(err) });
    }
});
router.get('/notifications-v2/logs', ...adminAuth, async (req, res) => {
    try {
        const { jobId, studentId, status, page = '1', limit = '50' } = req.query;
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
        const query = {};
        if (jobId && mongoose_1.default.Types.ObjectId.isValid(jobId))
            query['jobId'] = new mongoose_1.default.Types.ObjectId(jobId);
        if (studentId && mongoose_1.default.Types.ObjectId.isValid(studentId))
            query['studentId'] = new mongoose_1.default.Types.ObjectId(studentId);
        if (status)
            query['status'] = status;
        const [logs, total] = await Promise.all([
            NotificationDeliveryLog_1.default.find(query).sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum).lean(),
            NotificationDeliveryLog_1.default.countDocuments(query),
        ]);
        res.json({ data: logs, total, page: pageNum, limit: limitNum });
    }
    catch (err) {
        res.status(500).json({ message: String(err) });
    }
});
// ============================================================================
// STUDENT SETTINGS
// ============================================================================
router.get('/student-settings', ...adminAuth, async (_req, res) => {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const settings = await StudentSettings_1.StudentSettingsModel.getDefault();
        res.json(settings);
    }
    catch (err) {
        res.status(500).json({ message: String(err) });
    }
});
router.put('/student-settings', ...adminAuth, async (req, res) => {
    try {
        const allowedFields = [
            'expiryReminderDays', 'autoExpireEnabled', 'passwordResetOnExpiry',
            'autoAlertTriggers', 'smsEnabled', 'emailEnabled',
            'quietHoursStart', 'quietHoursEnd', 'defaultSmsFromName', 'defaultEmailFromName',
        ];
        const update = {};
        for (const field of allowedFields) {
            if (req.body[field] !== undefined)
                update[field] = req.body[field];
        }
        const settings = await StudentSettings_1.StudentSettingsModel.findOneAndUpdate({ key: 'default' }, { $set: update }, { upsert: true, new: true }).lean();
        res.json(settings);
    }
    catch (err) {
        res.status(500).json({ message: String(err) });
    }
});
exports.default = router;
//# sourceMappingURL=adminStudentMgmtRoutes.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.expireStaleApprovals = expireStaleApprovals;
exports.requestApproval = requestApproval;
exports.approveApproval = approveApproval;
exports.rejectApproval = rejectApproval;
exports.getPendingApprovals = getPendingApprovals;
exports.shouldRequireTwoPersonApproval = shouldRequireTwoPersonApproval;
const mongoose_1 = __importDefault(require("mongoose"));
const ActionApproval_1 = __importDefault(require("../models/ActionApproval"));
const AuditLog_1 = __importDefault(require("../models/AuditLog"));
const User_1 = __importDefault(require("../models/User"));
const StudentProfile_1 = __importDefault(require("../models/StudentProfile"));
const AdminProfile_1 = __importDefault(require("../models/AdminProfile"));
const LoginActivity_1 = __importDefault(require("../models/LoginActivity"));
const StudentGroup_1 = __importDefault(require("../models/StudentGroup"));
const University_1 = __importDefault(require("../models/University"));
const News_1 = __importDefault(require("../models/News"));
const Exam_1 = __importDefault(require("../models/Exam"));
const ManualPayment_1 = __importDefault(require("../models/ManualPayment"));
const securityCenterService_1 = require("./securityCenterService");
async function writeApprovalAudit(actor, action, approval, details = {}) {
    if (!mongoose_1.default.Types.ObjectId.isValid(actor.userId))
        return;
    await AuditLog_1.default.create({
        actor_id: new mongoose_1.default.Types.ObjectId(actor.userId),
        actor_role: actor.role,
        action,
        target_id: approval._id,
        target_type: 'action_approval',
        ip_address: '127.0.0.1',
        details: {
            actionKey: approval.actionKey,
            status: approval.status,
            ...details,
        },
    });
}
async function expireStaleApprovals(now = new Date()) {
    const result = await ActionApproval_1.default.updateMany({
        status: 'pending_second_approval',
        expiresAt: { $lt: now },
    }, { $set: { status: 'expired', decidedAt: now } });
    return Number(result.modifiedCount || 0);
}
async function requestApproval(input) {
    await expireStaleApprovals();
    const security = await (0, securityCenterService_1.getSecuritySettingsSnapshot)(false);
    const expiryMinutes = Math.max(5, Number(security.twoPersonApproval.approvalExpiryMinutes || 120));
    const approval = await ActionApproval_1.default.create({
        actionKey: input.actionKey,
        module: input.module,
        action: input.action,
        routePath: input.routePath,
        method: input.method.toUpperCase(),
        paramsSnapshot: input.paramsSnapshot,
        querySnapshot: input.querySnapshot,
        payloadSnapshot: input.payloadSnapshot,
        initiatedBy: new mongoose_1.default.Types.ObjectId(input.actor.userId),
        initiatedByRole: input.actor.role,
        initiatedAt: new Date(),
        expiresAt: new Date(Date.now() + expiryMinutes * 60 * 1000),
        status: 'pending_second_approval',
    });
    await writeApprovalAudit(input.actor, 'approval.requested', approval, {
        module: input.module,
        action: input.action,
    });
    return approval;
}
async function executeStudentsBulkDelete(approval) {
    const studentIdsRaw = Array.isArray(approval.payloadSnapshot.studentIds)
        ? approval.payloadSnapshot.studentIds
        : [];
    const studentIds = studentIdsRaw
        .map((id) => String(id || '').trim())
        .filter((id) => mongoose_1.default.Types.ObjectId.isValid(id));
    if (studentIds.length === 0) {
        return { ok: false, message: 'No valid studentIds provided for execution.' };
    }
    await Promise.all([
        User_1.default.deleteMany({ _id: { $in: studentIds }, role: 'student' }),
        StudentProfile_1.default.deleteMany({ user_id: { $in: studentIds } }),
        AdminProfile_1.default.deleteMany({ user_id: { $in: studentIds } }),
        LoginActivity_1.default.deleteMany({ user_id: { $in: studentIds } }),
        StudentGroup_1.default.updateMany({}, { $pull: { manualStudents: { $in: studentIds } } }),
    ]);
    return {
        ok: true,
        message: 'Bulk delete students executed',
        affectedCount: studentIds.length,
    };
}
async function executeUniversitiesBulkDelete(approval) {
    const idsRaw = Array.isArray(approval.payloadSnapshot.ids) ? approval.payloadSnapshot.ids : [];
    const ids = idsRaw
        .map((id) => String(id || '').trim())
        .filter((id) => mongoose_1.default.Types.ObjectId.isValid(id));
    if (ids.length === 0) {
        return { ok: false, message: 'No valid university IDs provided for execution.' };
    }
    const mode = String(approval.payloadSnapshot.mode || 'soft').toLowerCase() === 'hard' ? 'hard' : 'soft';
    let affected = 0;
    if (mode === 'hard') {
        const result = await University_1.default.deleteMany({ _id: { $in: ids } });
        affected = Number(result.deletedCount || 0);
    }
    else {
        const result = await University_1.default.updateMany({ _id: { $in: ids } }, {
            $set: {
                isArchived: true,
                isActive: false,
                archivedAt: new Date(),
            },
        });
        affected = Number(result.modifiedCount || 0);
    }
    return {
        ok: true,
        message: 'Bulk delete universities executed',
        affectedCount: affected,
        details: { mode },
    };
}
async function executeNewsBulkDelete(approval) {
    const idsRaw = Array.isArray(approval.payloadSnapshot.ids) ? approval.payloadSnapshot.ids : [];
    const fromPayload = idsRaw
        .map((id) => String(id || '').trim())
        .filter((id) => mongoose_1.default.Types.ObjectId.isValid(id));
    const fromParams = String(approval.paramsSnapshot.id || '').trim();
    const ids = fromPayload.length > 0
        ? fromPayload
        : (mongoose_1.default.Types.ObjectId.isValid(fromParams) ? [fromParams] : []);
    if (ids.length === 0) {
        return { ok: false, message: 'No valid news IDs provided for execution.' };
    }
    const result = await News_1.default.deleteMany({ _id: { $in: ids } });
    return {
        ok: true,
        message: 'Bulk delete news executed',
        affectedCount: Number(result.deletedCount || 0),
    };
}
async function executePublishExamResult(approval) {
    const examId = String(approval.paramsSnapshot.id || '').trim();
    if (!mongoose_1.default.Types.ObjectId.isValid(examId)) {
        return { ok: false, message: 'Invalid exam id for publish result.' };
    }
    const updated = await Exam_1.default.findByIdAndUpdate(examId, {
        $set: {
            resultPublishMode: 'immediate',
            resultPublishDate: new Date(),
        },
    }, { new: true });
    if (!updated) {
        return { ok: false, message: 'Exam not found.' };
    }
    return {
        ok: true,
        message: 'Exam result published',
        affectedCount: 1,
    };
}
async function executePublishBreakingNews(approval) {
    const newsId = String(approval.paramsSnapshot.id || '').trim();
    if (!mongoose_1.default.Types.ObjectId.isValid(newsId)) {
        return { ok: false, message: 'Invalid news id for publish now.' };
    }
    const now = new Date();
    const updated = await News_1.default.findByIdAndUpdate(newsId, {
        $set: {
            status: 'published',
            isPublished: true,
            publishDate: now,
            publishedAt: now,
            scheduleAt: null,
            scheduledAt: null,
        },
    }, { new: true });
    if (!updated) {
        return { ok: false, message: 'News item not found.' };
    }
    return {
        ok: true,
        message: 'Breaking news published',
        affectedCount: 1,
    };
}
async function executeMarkPaymentRefunded(approval) {
    const paymentId = String(approval.paramsSnapshot.id || '').trim();
    if (!mongoose_1.default.Types.ObjectId.isValid(paymentId)) {
        return { ok: false, message: 'Invalid payment id for refund.' };
    }
    const updated = await ManualPayment_1.default.findByIdAndUpdate(paymentId, {
        $set: {
            status: 'refunded',
            paidAt: null,
        },
    }, { new: true });
    if (!updated) {
        return { ok: false, message: 'Payment entry not found.' };
    }
    return {
        ok: true,
        message: 'Payment marked as refunded',
        affectedCount: 1,
    };
}
async function executeApprovalAction(approval) {
    switch (approval.actionKey) {
        case 'students.bulk_delete':
            return executeStudentsBulkDelete(approval);
        case 'universities.bulk_delete':
            return executeUniversitiesBulkDelete(approval);
        case 'news.bulk_delete':
            return executeNewsBulkDelete(approval);
        case 'exams.publish_result':
            return executePublishExamResult(approval);
        case 'news.publish_breaking':
            return executePublishBreakingNews(approval);
        case 'payments.mark_refunded':
            return executeMarkPaymentRefunded(approval);
        default:
            return { ok: false, message: `No executor registered for ${approval.actionKey}` };
    }
}
async function approveApproval(id, actor) {
    await expireStaleApprovals();
    const approval = await ActionApproval_1.default.findById(id);
    if (!approval) {
        throw new Error('APPROVAL_NOT_FOUND');
    }
    if (approval.status !== 'pending_second_approval') {
        throw new Error('APPROVAL_NOT_PENDING');
    }
    if (approval.expiresAt.getTime() <= Date.now()) {
        approval.status = 'expired';
        approval.decidedAt = new Date();
        await approval.save();
        throw new Error('APPROVAL_EXPIRED');
    }
    if (String(approval.initiatedBy) === actor.userId) {
        throw new Error('SELF_APPROVAL_FORBIDDEN');
    }
    approval.status = 'approved';
    approval.secondApprover = new mongoose_1.default.Types.ObjectId(actor.userId);
    approval.secondApproverRole = actor.role;
    approval.decidedAt = new Date();
    await approval.save();
    await writeApprovalAudit(actor, 'approval.approved', approval);
    const execution = await executeApprovalAction(approval);
    if (execution.ok) {
        approval.status = 'executed';
        approval.executedAt = new Date();
    }
    else {
        approval.status = 'rejected';
        approval.decisionReason = execution.message;
    }
    approval.executionMeta = {
        ...(approval.executionMeta || {}),
        execution,
    };
    await approval.save();
    await writeApprovalAudit(actor, 'approval.executed', approval, execution.details || {});
    return approval;
}
async function rejectApproval(id, actor, reason) {
    await expireStaleApprovals();
    const approval = await ActionApproval_1.default.findById(id);
    if (!approval)
        throw new Error('APPROVAL_NOT_FOUND');
    if (approval.status !== 'pending_second_approval')
        throw new Error('APPROVAL_NOT_PENDING');
    if (String(approval.initiatedBy) === actor.userId)
        throw new Error('SELF_APPROVAL_FORBIDDEN');
    approval.status = 'rejected';
    approval.secondApprover = new mongoose_1.default.Types.ObjectId(actor.userId);
    approval.secondApproverRole = actor.role;
    approval.decisionReason = String(reason || '').trim();
    approval.decidedAt = new Date();
    await approval.save();
    await writeApprovalAudit(actor, 'approval.rejected', approval, { reason: approval.decisionReason || '' });
    return approval;
}
async function getPendingApprovals(limit = 100) {
    await expireStaleApprovals();
    return ActionApproval_1.default.find({ status: 'pending_second_approval' })
        .sort({ createdAt: -1 })
        .limit(Math.max(1, Math.min(limit, 500)))
        .populate('initiatedBy', 'username email full_name role')
        .populate('secondApprover', 'username email full_name role');
}
async function shouldRequireTwoPersonApproval(actionKey) {
    const security = await (0, securityCenterService_1.getSecuritySettingsSnapshot)(false);
    return (Boolean(security.twoPersonApproval.enabled) &&
        security.twoPersonApproval.riskyActions.includes(actionKey));
}
//# sourceMappingURL=actionApprovalService.js.map
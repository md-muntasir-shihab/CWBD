"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminGetPendingApprovals = adminGetPendingApprovals;
exports.adminApprovePendingAction = adminApprovePendingAction;
exports.adminRejectPendingAction = adminRejectPendingAction;
const actionApprovalService_1 = require("../services/actionApprovalService");
function mapServiceErrorToHttp(error) {
    const raw = (error instanceof Error ? error.message : String(error || '')).trim();
    switch (raw) {
        case 'APPROVAL_NOT_FOUND':
            return { status: 404, message: 'Approval request not found.', code: 'APPROVAL_NOT_FOUND' };
        case 'APPROVAL_NOT_PENDING':
            return { status: 409, message: 'Approval request is not pending.', code: 'APPROVAL_NOT_PENDING' };
        case 'APPROVAL_EXPIRED':
            return { status: 409, message: 'Approval request has expired.', code: 'APPROVAL_EXPIRED' };
        case 'SELF_APPROVAL_FORBIDDEN':
            return { status: 403, message: 'Initiator cannot approve their own request.', code: 'SELF_APPROVAL_FORBIDDEN' };
        default:
            return { status: 500, message: 'Server error', code: 'APPROVAL_ERROR' };
    }
}
async function adminGetPendingApprovals(req, res) {
    try {
        const limit = Math.max(1, Math.min(500, Number(req.query.limit || 100)));
        const items = await (0, actionApprovalService_1.getPendingApprovals)(limit);
        res.json({ items, total: items.length });
    }
    catch (error) {
        console.error('adminGetPendingApprovals error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}
async function adminApprovePendingAction(req, res) {
    try {
        if (!req.user?._id) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        const approvalId = String(req.params?.id || '').trim();
        const item = await (0, actionApprovalService_1.approveApproval)(approvalId, {
            userId: req.user._id,
            role: req.user.role,
        });
        res.json({
            message: item.status === 'executed'
                ? 'Second approval successful and action executed.'
                : 'Second approval recorded.',
            item,
        });
    }
    catch (error) {
        const mapped = mapServiceErrorToHttp(error);
        res.status(mapped.status).json({ message: mapped.message, code: mapped.code });
    }
}
async function adminRejectPendingAction(req, res) {
    try {
        if (!req.user?._id) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        const reason = String(req.body?.reason || '').trim();
        const approvalId = String(req.params?.id || '').trim();
        const item = await (0, actionApprovalService_1.rejectApproval)(approvalId, {
            userId: req.user._id,
            role: req.user.role,
        }, reason);
        res.json({ message: 'Approval request rejected.', item });
    }
    catch (error) {
        const mapped = mapServiceErrorToHttp(error);
        res.status(mapped.status).json({ message: mapped.message, code: mapped.code });
    }
}
//# sourceMappingURL=actionApprovalController.js.map
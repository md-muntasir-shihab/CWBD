"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireTwoPersonApproval = requireTwoPersonApproval;
const actionApprovalService_1 = require("../services/actionApprovalService");
function requireTwoPersonApproval(actionKey, moduleName, actionName) {
    return async (req, res, next) => {
        try {
            if (!req.user?._id) {
                res.status(401).json({ message: 'Authentication required' });
                return;
            }
            if (req.user.role === 'superadmin') {
                next();
                return;
            }
            const enabled = await (0, actionApprovalService_1.shouldRequireTwoPersonApproval)(actionKey);
            if (!enabled) {
                next();
                return;
            }
            const approval = await (0, actionApprovalService_1.requestApproval)({
                actionKey,
                module: moduleName,
                action: actionName,
                routePath: req.originalUrl,
                method: req.method,
                paramsSnapshot: { ...(req.params || {}) },
                querySnapshot: { ...(req.query || {}) },
                payloadSnapshot: (req.body && typeof req.body === 'object' ? req.body : {}),
                actor: {
                    userId: req.user._id,
                    role: req.user.role,
                },
            });
            res.status(202).json({
                message: 'Action requires second approval and is now queued.',
                code: 'PENDING_SECOND_APPROVAL',
                approvalId: approval._id,
                expiresAt: approval.expiresAt,
            });
        }
        catch (error) {
            console.error('requireTwoPersonApproval error:', error);
            res.status(500).json({ message: 'Failed to queue approval request.' });
        }
    };
}
//# sourceMappingURL=twoPersonApproval.js.map
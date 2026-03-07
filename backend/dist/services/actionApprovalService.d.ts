import { IActionApproval } from '../models/ActionApproval';
import { RiskyActionKey } from '../models/SecuritySettings';
type ApprovalActor = {
    userId: string;
    role: string;
};
type RequestApprovalInput = {
    actionKey: RiskyActionKey;
    module: string;
    action: string;
    routePath: string;
    method: string;
    paramsSnapshot: Record<string, unknown>;
    querySnapshot: Record<string, unknown>;
    payloadSnapshot: Record<string, unknown>;
    actor: ApprovalActor;
};
export declare function expireStaleApprovals(now?: Date): Promise<number>;
export declare function requestApproval(input: RequestApprovalInput): Promise<IActionApproval>;
export declare function approveApproval(id: string, actor: ApprovalActor): Promise<IActionApproval>;
export declare function rejectApproval(id: string, actor: ApprovalActor, reason?: string): Promise<IActionApproval>;
export declare function getPendingApprovals(limit?: number): Promise<IActionApproval[]>;
export declare function shouldRequireTwoPersonApproval(actionKey: RiskyActionKey): Promise<boolean>;
export {};
//# sourceMappingURL=actionApprovalService.d.ts.map
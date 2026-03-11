/**
 * Centralized Group Membership Service
 *
 * Single source of truth for all group lifecycle and membership mutations.
 * Every controller/route that modifies group membership MUST go through
 * this service to maintain consistency between:
 *   - StudentProfile.groupIds  (operational read model)
 *   - GroupMembership          (audited write layer)
 *   - StudentGroup.memberCountCached (denormalised counter)
 */
import mongoose from 'mongoose';
import { IStudentGroup } from '../models/StudentGroup';
import { MembershipStatus } from '../models/GroupMembership';
export interface AddMembershipInput {
    groupId: string | mongoose.Types.ObjectId;
    studentId: string | mongoose.Types.ObjectId;
    adminId?: string | mongoose.Types.ObjectId;
    note?: string;
}
export interface RemoveMembershipInput {
    groupId: string | mongoose.Types.ObjectId;
    studentId: string | mongoose.Types.ObjectId;
    adminId?: string | mongoose.Types.ObjectId;
    note?: string;
}
export interface BulkMembershipResult {
    added: number;
    removed: number;
    skipped: number;
    errors: string[];
}
export interface GroupValidationResult {
    valid: boolean;
    group?: IStudentGroup;
    reason?: string;
}
export declare function validateGroup(groupId: string | mongoose.Types.ObjectId): Promise<GroupValidationResult>;
export declare function validateGroups(groupIds: (string | mongoose.Types.ObjectId)[]): Promise<{
    validIds: mongoose.Types.ObjectId[];
    invalidIds: string[];
}>;
export declare function addMembership(input: AddMembershipInput): Promise<boolean>;
export declare function removeMembership(input: RemoveMembershipInput): Promise<boolean>;
export declare function bulkAddMembers(groupId: string | mongoose.Types.ObjectId, studentIds: (string | mongoose.Types.ObjectId)[], adminId?: string | mongoose.Types.ObjectId, note?: string): Promise<BulkMembershipResult>;
export declare function bulkRemoveMembers(groupId: string | mongoose.Types.ObjectId, studentIds: (string | mongoose.Types.ObjectId)[], adminId?: string | mongoose.Types.ObjectId, note?: string): Promise<BulkMembershipResult>;
/**
 * Set a student's groups to exactly the provided list.
 * Computes diff from current memberships and applies add/remove.
 */
export declare function setStudentGroups(studentId: string | mongoose.Types.ObjectId, desiredGroupIds: (string | mongoose.Types.ObjectId)[], adminId?: string | mongoose.Types.ObjectId, note?: string): Promise<{
    added: string[];
    removed: string[];
}>;
/**
 * Move students from one group to another.
 */
export declare function moveMembers(fromGroupId: string | mongoose.Types.ObjectId, toGroupId: string | mongoose.Types.ObjectId, studentIds: (string | mongoose.Types.ObjectId)[], adminId?: string | mongoose.Types.ObjectId, note?: string): Promise<BulkMembershipResult>;
export declare function syncGroupCount(groupId: mongoose.Types.ObjectId): Promise<number>;
export declare function syncAllGroupCounts(): Promise<number>;
export declare function getStudentGroupIds(studentId: string | mongoose.Types.ObjectId): Promise<mongoose.Types.ObjectId[]>;
export declare function getGroupMembers(groupId: string | mongoose.Types.ObjectId, options?: {
    status?: MembershipStatus;
    skip?: number;
    limit?: number;
}): Promise<(mongoose.FlattenMaps<import("../models/GroupMembership").IGroupMembership> & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
})[]>;
export declare function getGroupMemberCount(groupId: string | mongoose.Types.ObjectId, status?: MembershipStatus): Promise<number>;
/**
 * Check if deleting a group is safe (not linked to exams, campaigns, etc.)
 */
export declare function canDeleteGroup(groupId: string | mongoose.Types.ObjectId): Promise<{
    safe: boolean;
    blockers: string[];
}>;
//# sourceMappingURL=groupMembershipService.d.ts.map
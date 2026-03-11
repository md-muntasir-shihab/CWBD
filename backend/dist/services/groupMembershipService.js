"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateGroup = validateGroup;
exports.validateGroups = validateGroups;
exports.addMembership = addMembership;
exports.removeMembership = removeMembership;
exports.bulkAddMembers = bulkAddMembers;
exports.bulkRemoveMembers = bulkRemoveMembers;
exports.setStudentGroups = setStudentGroups;
exports.moveMembers = moveMembers;
exports.syncGroupCount = syncGroupCount;
exports.syncAllGroupCounts = syncAllGroupCounts;
exports.getStudentGroupIds = getStudentGroupIds;
exports.getGroupMembers = getGroupMembers;
exports.getGroupMemberCount = getGroupMemberCount;
exports.canDeleteGroup = canDeleteGroup;
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
const mongoose_1 = __importDefault(require("mongoose"));
const StudentGroup_1 = __importDefault(require("../models/StudentGroup"));
const GroupMembership_1 = __importDefault(require("../models/GroupMembership"));
const StudentProfile_1 = __importDefault(require("../models/StudentProfile"));
// ─── Validation ─────────────────────────────────────────────
async function validateGroup(groupId) {
    const group = await StudentGroup_1.default.findById(groupId);
    if (!group)
        return { valid: false, reason: 'Group not found' };
    if (!group.isActive)
        return { valid: false, reason: 'Group is inactive' };
    return { valid: true, group: group };
}
async function validateGroups(groupIds) {
    const activeGroups = await StudentGroup_1.default.find({
        _id: { $in: groupIds },
        isActive: true,
    }).select('_id').lean();
    const activeSet = new Set(activeGroups.map(g => g._id.toString()));
    const validIds = [];
    const invalidIds = [];
    for (const id of groupIds) {
        const str = id.toString();
        if (activeSet.has(str)) {
            validIds.push(new mongoose_1.default.Types.ObjectId(str));
        }
        else {
            invalidIds.push(str);
        }
    }
    return { validIds, invalidIds };
}
// ─── Single membership mutations ────────────────────────────
async function addMembership(input) {
    const gid = new mongoose_1.default.Types.ObjectId(input.groupId.toString());
    const sid = new mongoose_1.default.Types.ObjectId(input.studentId.toString());
    // Check if already active
    const existing = await GroupMembership_1.default.findOne({
        groupId: gid,
        studentId: sid,
        membershipStatus: 'active',
    });
    if (existing)
        return false; // already a member
    // Reactivate archived row or create new
    const archived = await GroupMembership_1.default.findOneAndUpdate({ groupId: gid, studentId: sid, membershipStatus: { $in: ['removed', 'archived'] } }, {
        $set: {
            membershipStatus: 'active',
            joinedAtUTC: new Date(),
            removedAtUTC: undefined,
            addedByAdminId: input.adminId ? new mongoose_1.default.Types.ObjectId(input.adminId.toString()) : undefined,
            note: input.note || '',
        },
    }, { new: true });
    if (!archived) {
        await GroupMembership_1.default.create({
            groupId: gid,
            studentId: sid,
            membershipStatus: 'active',
            joinedAtUTC: new Date(),
            addedByAdminId: input.adminId ? new mongoose_1.default.Types.ObjectId(input.adminId.toString()) : undefined,
            note: input.note || '',
        });
    }
    // Sync profile
    await StudentProfile_1.default.updateOne({ user_id: sid }, { $addToSet: { groupIds: gid } });
    // Update cached count
    await syncGroupCount(gid);
    return true;
}
async function removeMembership(input) {
    const gid = new mongoose_1.default.Types.ObjectId(input.groupId.toString());
    const sid = new mongoose_1.default.Types.ObjectId(input.studentId.toString());
    const result = await GroupMembership_1.default.updateOne({ groupId: gid, studentId: sid, membershipStatus: 'active' }, {
        $set: {
            membershipStatus: 'removed',
            removedAtUTC: new Date(),
            note: input.note || '',
        },
    });
    if (result.modifiedCount === 0)
        return false;
    // Sync profile
    await StudentProfile_1.default.updateOne({ user_id: sid }, { $pull: { groupIds: gid } });
    // Update cached count
    await syncGroupCount(gid);
    return true;
}
// ─── Bulk operations ────────────────────────────────────────
async function bulkAddMembers(groupId, studentIds, adminId, note) {
    const result = { added: 0, removed: 0, skipped: 0, errors: [] };
    for (const sid of studentIds) {
        try {
            const added = await addMembership({ groupId, studentId: sid, adminId, note });
            if (added)
                result.added++;
            else
                result.skipped++;
        }
        catch (err) {
            result.errors.push(`Failed to add ${sid}: ${err instanceof Error ? err.message : String(err)}`);
        }
    }
    return result;
}
async function bulkRemoveMembers(groupId, studentIds, adminId, note) {
    const result = { added: 0, removed: 0, skipped: 0, errors: [] };
    for (const sid of studentIds) {
        try {
            const removed = await removeMembership({ groupId, studentId: sid, adminId, note });
            if (removed)
                result.removed++;
            else
                result.skipped++;
        }
        catch (err) {
            result.errors.push(`Failed to remove ${sid}: ${err instanceof Error ? err.message : String(err)}`);
        }
    }
    return result;
}
/**
 * Set a student's groups to exactly the provided list.
 * Computes diff from current memberships and applies add/remove.
 */
async function setStudentGroups(studentId, desiredGroupIds, adminId, note) {
    const sid = new mongoose_1.default.Types.ObjectId(studentId.toString());
    const desiredSet = new Set(desiredGroupIds.map(id => id.toString()));
    // Current active memberships
    const currentMemberships = await GroupMembership_1.default.find({
        studentId: sid,
        membershipStatus: 'active',
    }).select('groupId').lean();
    const currentSet = new Set(currentMemberships.map(m => m.groupId.toString()));
    const toAdd = [...desiredSet].filter(id => !currentSet.has(id));
    const toRemove = [...currentSet].filter(id => !desiredSet.has(id));
    for (const gid of toAdd) {
        await addMembership({ groupId: gid, studentId: sid, adminId, note });
    }
    for (const gid of toRemove) {
        await removeMembership({ groupId: gid, studentId: sid, adminId, note });
    }
    return { added: toAdd, removed: toRemove };
}
/**
 * Move students from one group to another.
 */
async function moveMembers(fromGroupId, toGroupId, studentIds, adminId, note) {
    const result = { added: 0, removed: 0, skipped: 0, errors: [] };
    for (const sid of studentIds) {
        try {
            const removed = await removeMembership({ groupId: fromGroupId, studentId: sid, adminId, note: note || 'Moved to another group' });
            if (removed)
                result.removed++;
            const added = await addMembership({ groupId: toGroupId, studentId: sid, adminId, note: note || 'Moved from another group' });
            if (added)
                result.added++;
        }
        catch (err) {
            result.errors.push(`Failed to move ${sid}: ${err instanceof Error ? err.message : String(err)}`);
        }
    }
    return result;
}
// ─── Count sync ─────────────────────────────────────────────
async function syncGroupCount(groupId) {
    const count = await GroupMembership_1.default.countDocuments({ groupId, membershipStatus: 'active' });
    await StudentGroup_1.default.updateOne({ _id: groupId }, { $set: { memberCountCached: count, studentCount: count } });
    return count;
}
async function syncAllGroupCounts() {
    const groups = await StudentGroup_1.default.find({ isActive: true }).select('_id').lean();
    let fixed = 0;
    for (const g of groups) {
        const count = await GroupMembership_1.default.countDocuments({ groupId: g._id, membershipStatus: 'active' });
        const result = await StudentGroup_1.default.updateOne({ _id: g._id, memberCountCached: { $ne: count } }, { $set: { memberCountCached: count, studentCount: count } });
        if (result.modifiedCount > 0)
            fixed++;
    }
    return fixed;
}
// ─── Query helpers ──────────────────────────────────────────
async function getStudentGroupIds(studentId) {
    const profile = await StudentProfile_1.default.findOne({ user_id: studentId }).select('groupIds').lean();
    return profile?.groupIds ?? [];
}
async function getGroupMembers(groupId, options = {}) {
    const { status = 'active', skip = 0, limit = 50 } = options;
    return GroupMembership_1.default.find({ groupId, membershipStatus: status })
        .sort({ joinedAtUTC: -1 })
        .skip(skip)
        .limit(limit)
        .populate('studentId', 'full_name email phone')
        .lean();
}
async function getGroupMemberCount(groupId, status = 'active') {
    return GroupMembership_1.default.countDocuments({ groupId, membershipStatus: status });
}
/**
 * Check if deleting a group is safe (not linked to exams, campaigns, etc.)
 */
async function canDeleteGroup(groupId) {
    const blockers = [];
    // Check active members
    const memberCount = await GroupMembership_1.default.countDocuments({ groupId, membershipStatus: 'active' });
    if (memberCount > 0) {
        blockers.push(`${memberCount} active member(s)`);
    }
    // Check exam references — import lazily to avoid circular deps
    try {
        const Exam = (await Promise.resolve().then(() => __importStar(require('../models/Exam')))).default;
        const examCount = await Exam.countDocuments({
            $or: [
                { 'accessControl.allowedGroupIds': groupId },
                { targetGroupIds: groupId },
            ],
        });
        if (examCount > 0)
            blockers.push(`${examCount} exam(s) targeting this group`);
    }
    catch { /* Exam model may not exist yet */ }
    return { safe: blockers.length === 0, blockers };
}
//# sourceMappingURL=groupMembershipService.js.map
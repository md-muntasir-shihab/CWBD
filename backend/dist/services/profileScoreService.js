"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recomputeAndSaveProfileScore = exports.computeProfileScore = void 0;
const user_model_1 = require("../models/user.model");
const computeProfileScore = (u) => {
    let score = 0;
    if (u.avatarUrl)
        score += 10;
    if (u.userId)
        score += 10;
    if (u.fullName)
        score += 10;
    if (u.phoneVerified)
        score += 10;
    if (u.emailVerified)
        score += 10;
    if (u.guardianPhone)
        score += 10;
    if (u.address)
        score += 10;
    if (u.sscBatch)
        score += 5;
    if (u.hscBatch)
        score += 5;
    if (u.department)
        score += 5;
    if (u.collegeName)
        score += 5;
    if (u.dateOfBirth)
        score += 10;
    return score;
};
exports.computeProfileScore = computeProfileScore;
const recomputeAndSaveProfileScore = async (userId) => {
    const user = await user_model_1.UserModel.findOne({ userId });
    if (!user)
        return null;
    user.profileScore = (0, exports.computeProfileScore)(user);
    await user.save();
    return user.profileScore;
};
exports.recomputeAndSaveProfileScore = recomputeAndSaveProfileScore;
//# sourceMappingURL=profileScoreService.js.map
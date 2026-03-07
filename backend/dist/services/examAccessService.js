"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAccessPayload = void 0;
const examSession_model_1 = require("../models/examSession.model");
const payment_model_1 = require("../models/payment.model");
const subscription_model_1 = require("../models/subscription.model");
const user_model_1 = require("../models/user.model");
const buildAccessPayload = async (exam, userId) => {
    const blockReasons = [];
    if (!userId)
        blockReasons.push("LOGIN_REQUIRED");
    const now = new Date();
    if (now < new Date(exam.examWindowStartUTC) || now > new Date(exam.examWindowEndUTC))
        blockReasons.push("EXAM_NOT_IN_WINDOW");
    let user = null;
    if (userId) {
        user = await user_model_1.UserModel.findOne({ userId });
        if (!user || (user.profileScore ?? 0) < 70)
            blockReasons.push("PROFILE_BELOW_70");
    }
    if (userId && exam.subscriptionRequired) {
        const active = await subscription_model_1.SubscriptionModel.findOne({ userId, status: "active", expiresAtUTC: { $gt: now } });
        if (!active)
            blockReasons.push("SUBSCRIPTION_REQUIRED");
    }
    if (userId && exam.paymentRequired) {
        const paid = await payment_model_1.PaymentModel.findOne({ userId, examId: String(exam._id), status: "paid" });
        if (!paid)
            blockReasons.push("PAYMENT_PENDING");
    }
    if (userId) {
        const attempts = await examSession_model_1.ExamSessionModel.countDocuments({ examId: String(exam._id), userId, status: { $in: ["submitted", "evaluated", "expired"] } });
        if (attempts >= exam.attemptLimit && !exam.allowReAttempt)
            blockReasons.push("ATTEMPT_LIMIT_REACHED");
    }
    return {
        loginRequired: true,
        profileScoreMin: 70,
        subscriptionRequired: exam.subscriptionRequired,
        paymentRequired: exam.paymentRequired,
        priceBDT: exam.priceBDT ?? undefined,
        accessStatus: blockReasons.length ? "blocked" : "allowed",
        blockReasons
    };
};
exports.buildAccessPayload = buildAccessPayload;
//# sourceMappingURL=examAccessService.js.map
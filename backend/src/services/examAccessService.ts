import { ExamSessionModel } from "../models/examSession.model";
import { PaymentModel } from "../models/payment.model";
import { SubscriptionModel } from "../models/subscription.model";
import { UserModel } from "../models/user.model";

export const buildAccessPayload = async (exam: any, userId?: string) => {
  const blockReasons: string[] = [];
  if (!userId) blockReasons.push("LOGIN_REQUIRED");

  const now = new Date();
  if (now < new Date(exam.examWindowStartUTC) || now > new Date(exam.examWindowEndUTC)) blockReasons.push("EXAM_NOT_IN_WINDOW");

  let user: any = null;
  if (userId) {
    user = await UserModel.findOne({ userId });
    if (!user || (user.profileScore ?? 0) < 70) blockReasons.push("PROFILE_BELOW_70");
  }

  if (userId && exam.subscriptionRequired) {
    const active = await SubscriptionModel.findOne({ userId, status: "active", expiresAtUTC: { $gt: now } });
    if (!active) blockReasons.push("SUBSCRIPTION_REQUIRED");
  }

  if (userId && exam.paymentRequired) {
    const paid = await PaymentModel.findOne({ userId, examId: String(exam._id), status: "paid" });
    if (!paid) blockReasons.push("PAYMENT_PENDING");
  }

  if (userId) {
    const attempts = await ExamSessionModel.countDocuments({ examId: String(exam._id), userId, status: { $in: ["submitted", "evaluated", "expired"] } });
    if (attempts >= exam.attemptLimit && !exam.allowReAttempt) blockReasons.push("ATTEMPT_LIMIT_REACHED");
  }

  return {
    loginRequired: true as const,
    profileScoreMin: 70,
    subscriptionRequired: exam.subscriptionRequired,
    paymentRequired: exam.paymentRequired,
    priceBDT: exam.priceBDT ?? undefined,
    accessStatus: blockReasons.length ? "blocked" : "allowed",
    blockReasons
  };
};

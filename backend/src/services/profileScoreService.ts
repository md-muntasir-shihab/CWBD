import { UserModel } from "../models/user.model";

export const computeProfileScore = (u: any) => {
  let score = 0;
  if (u.avatarUrl) score += 10;
  if (u.userId) score += 10;
  if (u.fullName) score += 10;
  if (u.phoneVerified) score += 10;
  if (u.emailVerified) score += 10;
  if (u.guardianPhone) score += 10;
  if (u.address) score += 10;
  if (u.sscBatch) score += 5;
  if (u.hscBatch) score += 5;
  if (u.department) score += 5;
  if (u.collegeName) score += 5;
  if (u.dateOfBirth) score += 10;
  return score;
};

export const recomputeAndSaveProfileScore = async (userId: string) => {
  const user = await UserModel.findOne({ userId });
  if (!user) return null;
  user.profileScore = computeProfileScore(user);
  await user.save();
  return user.profileScore;
};

import { Schema, model } from "mongoose";

const userSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["student", "admin", "moderator", "editor", "chairman"], default: "student" },
    fullName: String,
    avatarUrl: String,
    phone: String,
    email: String,
    phoneVerified: { type: Boolean, default: false },
    emailVerified: { type: Boolean, default: false },
    guardianPhone: String,
    address: String,
    sscBatch: String,
    hscBatch: String,
    department: String,
    collegeName: String,
    collegeAddress: String,
    dateOfBirth: Date,
    profileScore: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export const UserModel = model("users", userSchema);

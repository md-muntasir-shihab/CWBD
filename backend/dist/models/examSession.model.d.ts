import { Schema } from "mongoose";
export declare const ExamSessionModel: import("mongoose").Model<{
    status: "in_progress" | "submitted" | "expired" | "evaluated";
    examId: string;
    userId: string;
    attemptNo: number;
    tabSwitchCount: number;
    fullscreenExitCount: number;
    suspiciousFlags: string[];
    questionOrder: string[];
    optionOrderMap: any;
    ip?: string | null | undefined;
    startedAtUTC?: NativeDate | null | undefined;
    expiresAtUTC?: NativeDate | null | undefined;
    submittedAtUTC?: NativeDate | null | undefined;
    timeTakenSeconds?: number | null | undefined;
    lastSavedAtUTC?: NativeDate | null | undefined;
    deviceInfo?: string | null | undefined;
    browserInfo?: string | null | undefined;
} & import("mongoose").DefaultTimestampProps, {}, {}, {}, import("mongoose").Document<unknown, {}, {
    status: "in_progress" | "submitted" | "expired" | "evaluated";
    examId: string;
    userId: string;
    attemptNo: number;
    tabSwitchCount: number;
    fullscreenExitCount: number;
    suspiciousFlags: string[];
    questionOrder: string[];
    optionOrderMap: any;
    ip?: string | null | undefined;
    startedAtUTC?: NativeDate | null | undefined;
    expiresAtUTC?: NativeDate | null | undefined;
    submittedAtUTC?: NativeDate | null | undefined;
    timeTakenSeconds?: number | null | undefined;
    lastSavedAtUTC?: NativeDate | null | undefined;
    deviceInfo?: string | null | undefined;
    browserInfo?: string | null | undefined;
} & import("mongoose").DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    status: "in_progress" | "submitted" | "expired" | "evaluated";
    examId: string;
    userId: string;
    attemptNo: number;
    tabSwitchCount: number;
    fullscreenExitCount: number;
    suspiciousFlags: string[];
    questionOrder: string[];
    optionOrderMap: any;
    ip?: string | null | undefined;
    startedAtUTC?: NativeDate | null | undefined;
    expiresAtUTC?: NativeDate | null | undefined;
    submittedAtUTC?: NativeDate | null | undefined;
    timeTakenSeconds?: number | null | undefined;
    lastSavedAtUTC?: NativeDate | null | undefined;
    deviceInfo?: string | null | undefined;
    browserInfo?: string | null | undefined;
} & import("mongoose").DefaultTimestampProps & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, Schema<any, import("mongoose").Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    status: "in_progress" | "submitted" | "expired" | "evaluated";
    examId: string;
    userId: string;
    attemptNo: number;
    tabSwitchCount: number;
    fullscreenExitCount: number;
    suspiciousFlags: string[];
    questionOrder: string[];
    optionOrderMap: any;
    ip?: string | null | undefined;
    startedAtUTC?: NativeDate | null | undefined;
    expiresAtUTC?: NativeDate | null | undefined;
    submittedAtUTC?: NativeDate | null | undefined;
    timeTakenSeconds?: number | null | undefined;
    lastSavedAtUTC?: NativeDate | null | undefined;
    deviceInfo?: string | null | undefined;
    browserInfo?: string | null | undefined;
} & import("mongoose").DefaultTimestampProps, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<{
    status: "in_progress" | "submitted" | "expired" | "evaluated";
    examId: string;
    userId: string;
    attemptNo: number;
    tabSwitchCount: number;
    fullscreenExitCount: number;
    suspiciousFlags: string[];
    questionOrder: string[];
    optionOrderMap: any;
    ip?: string | null | undefined;
    startedAtUTC?: NativeDate | null | undefined;
    expiresAtUTC?: NativeDate | null | undefined;
    submittedAtUTC?: NativeDate | null | undefined;
    timeTakenSeconds?: number | null | undefined;
    lastSavedAtUTC?: NativeDate | null | undefined;
    deviceInfo?: string | null | undefined;
    browserInfo?: string | null | undefined;
} & import("mongoose").DefaultTimestampProps>, {}, import("mongoose").MergeType<import("mongoose").DefaultSchemaOptions, {
    timestamps: true;
}>> & import("mongoose").FlatRecord<{
    status: "in_progress" | "submitted" | "expired" | "evaluated";
    examId: string;
    userId: string;
    attemptNo: number;
    tabSwitchCount: number;
    fullscreenExitCount: number;
    suspiciousFlags: string[];
    questionOrder: string[];
    optionOrderMap: any;
    ip?: string | null | undefined;
    startedAtUTC?: NativeDate | null | undefined;
    expiresAtUTC?: NativeDate | null | undefined;
    submittedAtUTC?: NativeDate | null | undefined;
    timeTakenSeconds?: number | null | undefined;
    lastSavedAtUTC?: NativeDate | null | undefined;
    deviceInfo?: string | null | undefined;
    browserInfo?: string | null | undefined;
} & import("mongoose").DefaultTimestampProps> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>>;
//# sourceMappingURL=examSession.model.d.ts.map
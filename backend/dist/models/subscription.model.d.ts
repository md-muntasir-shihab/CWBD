import { Schema } from "mongoose";
export declare const SubscriptionModel: import("mongoose").Model<{
    status: "expired" | "pending" | "active" | "suspended";
    userId: string;
    planId: string;
    expiresAtUTC?: NativeDate | null | undefined;
    notes?: string | null | undefined;
    startAtUTC?: NativeDate | null | undefined;
    paymentId?: string | null | undefined;
} & import("mongoose").DefaultTimestampProps, {}, {}, {}, import("mongoose").Document<unknown, {}, {
    status: "expired" | "pending" | "active" | "suspended";
    userId: string;
    planId: string;
    expiresAtUTC?: NativeDate | null | undefined;
    notes?: string | null | undefined;
    startAtUTC?: NativeDate | null | undefined;
    paymentId?: string | null | undefined;
} & import("mongoose").DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    status: "expired" | "pending" | "active" | "suspended";
    userId: string;
    planId: string;
    expiresAtUTC?: NativeDate | null | undefined;
    notes?: string | null | undefined;
    startAtUTC?: NativeDate | null | undefined;
    paymentId?: string | null | undefined;
} & import("mongoose").DefaultTimestampProps & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, Schema<any, import("mongoose").Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    status: "expired" | "pending" | "active" | "suspended";
    userId: string;
    planId: string;
    expiresAtUTC?: NativeDate | null | undefined;
    notes?: string | null | undefined;
    startAtUTC?: NativeDate | null | undefined;
    paymentId?: string | null | undefined;
} & import("mongoose").DefaultTimestampProps, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<{
    status: "expired" | "pending" | "active" | "suspended";
    userId: string;
    planId: string;
    expiresAtUTC?: NativeDate | null | undefined;
    notes?: string | null | undefined;
    startAtUTC?: NativeDate | null | undefined;
    paymentId?: string | null | undefined;
} & import("mongoose").DefaultTimestampProps>, {}, import("mongoose").MergeType<import("mongoose").DefaultSchemaOptions, {
    timestamps: true;
}>> & import("mongoose").FlatRecord<{
    status: "expired" | "pending" | "active" | "suspended";
    userId: string;
    planId: string;
    expiresAtUTC?: NativeDate | null | undefined;
    notes?: string | null | undefined;
    startAtUTC?: NativeDate | null | undefined;
    paymentId?: string | null | undefined;
} & import("mongoose").DefaultTimestampProps> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>>;
//# sourceMappingURL=subscription.model.d.ts.map
import { Schema } from "mongoose";
export declare const PaymentModel: import("mongoose").Model<{
    status: "pending" | "paid" | "failed" | "refunded";
    userId: string;
    method: "manual" | "bkash" | "nagad" | "card" | "bank";
    examId?: string | null | undefined;
    amountBDT?: number | null | undefined;
    transactionId?: string | null | undefined;
    reference?: string | null | undefined;
    proofFileUrl?: string | null | undefined;
    verifiedByAdminId?: string | null | undefined;
    notes?: string | null | undefined;
    paidAt?: NativeDate | null | undefined;
    planId?: string | null | undefined;
    createdAt: NativeDate;
}, {}, {}, {}, import("mongoose").Document<unknown, {}, {
    status: "pending" | "paid" | "failed" | "refunded";
    userId: string;
    method: "manual" | "bkash" | "nagad" | "card" | "bank";
    examId?: string | null | undefined;
    amountBDT?: number | null | undefined;
    transactionId?: string | null | undefined;
    reference?: string | null | undefined;
    proofFileUrl?: string | null | undefined;
    verifiedByAdminId?: string | null | undefined;
    notes?: string | null | undefined;
    paidAt?: NativeDate | null | undefined;
    planId?: string | null | undefined;
    createdAt: NativeDate;
}, {}, {
    timestamps: {
        createdAt: true;
        updatedAt: false;
    };
}> & {
    status: "pending" | "paid" | "failed" | "refunded";
    userId: string;
    method: "manual" | "bkash" | "nagad" | "card" | "bank";
    examId?: string | null | undefined;
    amountBDT?: number | null | undefined;
    transactionId?: string | null | undefined;
    reference?: string | null | undefined;
    proofFileUrl?: string | null | undefined;
    verifiedByAdminId?: string | null | undefined;
    notes?: string | null | undefined;
    paidAt?: NativeDate | null | undefined;
    planId?: string | null | undefined;
    createdAt: NativeDate;
} & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, Schema<any, import("mongoose").Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: {
        createdAt: true;
        updatedAt: false;
    };
}, {
    status: "pending" | "paid" | "failed" | "refunded";
    userId: string;
    method: "manual" | "bkash" | "nagad" | "card" | "bank";
    examId?: string | null | undefined;
    amountBDT?: number | null | undefined;
    transactionId?: string | null | undefined;
    reference?: string | null | undefined;
    proofFileUrl?: string | null | undefined;
    verifiedByAdminId?: string | null | undefined;
    notes?: string | null | undefined;
    paidAt?: NativeDate | null | undefined;
    planId?: string | null | undefined;
    createdAt: NativeDate;
}, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<{
    status: "pending" | "paid" | "failed" | "refunded";
    userId: string;
    method: "manual" | "bkash" | "nagad" | "card" | "bank";
    examId?: string | null | undefined;
    amountBDT?: number | null | undefined;
    transactionId?: string | null | undefined;
    reference?: string | null | undefined;
    proofFileUrl?: string | null | undefined;
    verifiedByAdminId?: string | null | undefined;
    notes?: string | null | undefined;
    paidAt?: NativeDate | null | undefined;
    planId?: string | null | undefined;
    createdAt: NativeDate;
}>, {}, import("mongoose").MergeType<import("mongoose").DefaultSchemaOptions, {
    timestamps: {
        createdAt: true;
        updatedAt: false;
    };
}>> & import("mongoose").FlatRecord<{
    status: "pending" | "paid" | "failed" | "refunded";
    userId: string;
    method: "manual" | "bkash" | "nagad" | "card" | "bank";
    examId?: string | null | undefined;
    amountBDT?: number | null | undefined;
    transactionId?: string | null | undefined;
    reference?: string | null | undefined;
    proofFileUrl?: string | null | undefined;
    verifiedByAdminId?: string | null | undefined;
    notes?: string | null | undefined;
    paidAt?: NativeDate | null | undefined;
    planId?: string | null | undefined;
    createdAt: NativeDate;
}> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>>;
//# sourceMappingURL=payment.model.d.ts.map
import { Schema } from "mongoose";
export declare const AnswerModel: import("mongoose").Model<{
    sessionId: string;
    examId: string;
    userId: string;
    questionId: string;
    changeCount: number;
    updatedAtUTC: NativeDate;
    selectedKey?: "A" | "B" | "C" | "D" | null | undefined;
}, {}, {}, {}, import("mongoose").Document<unknown, {}, {
    sessionId: string;
    examId: string;
    userId: string;
    questionId: string;
    changeCount: number;
    updatedAtUTC: NativeDate;
    selectedKey?: "A" | "B" | "C" | "D" | null | undefined;
}, {}, {
    timestamps: false;
}> & {
    sessionId: string;
    examId: string;
    userId: string;
    questionId: string;
    changeCount: number;
    updatedAtUTC: NativeDate;
    selectedKey?: "A" | "B" | "C" | "D" | null | undefined;
} & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, Schema<any, import("mongoose").Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: false;
}, {
    sessionId: string;
    examId: string;
    userId: string;
    questionId: string;
    changeCount: number;
    updatedAtUTC: NativeDate;
    selectedKey?: "A" | "B" | "C" | "D" | null | undefined;
}, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<{
    sessionId: string;
    examId: string;
    userId: string;
    questionId: string;
    changeCount: number;
    updatedAtUTC: NativeDate;
    selectedKey?: "A" | "B" | "C" | "D" | null | undefined;
}>, {}, import("mongoose").MergeType<import("mongoose").DefaultSchemaOptions, {
    timestamps: false;
}>> & import("mongoose").FlatRecord<{
    sessionId: string;
    examId: string;
    userId: string;
    questionId: string;
    changeCount: number;
    updatedAtUTC: NativeDate;
    selectedKey?: "A" | "B" | "C" | "D" | null | undefined;
}> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>>;
//# sourceMappingURL=answer.model.d.ts.map
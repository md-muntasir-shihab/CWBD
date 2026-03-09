import mongoose, { Document } from 'mongoose';
export interface IQuestionMedia extends Document {
    sourceType: 'upload' | 'external_link';
    url: string;
    mimeType?: string;
    sizeBytes?: number;
    status: 'pending' | 'approved' | 'rejected';
    approvalNote?: string;
    alt_text_bn?: string;
    createdBy?: mongoose.Types.ObjectId | null;
    approvedBy?: mongoose.Types.ObjectId | null;
    approvedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IQuestionMedia, {}, {}, {}, mongoose.Document<unknown, {}, IQuestionMedia, {}, {}> & IQuestionMedia & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=QuestionMedia.d.ts.map
import mongoose, { Document, Schema } from 'mongoose';

export type AnnouncementTarget = 'all' | 'groups' | 'students';

export interface IAnnouncementNotice extends Document {
    title: string;
    message: string;
    target: AnnouncementTarget;
    targetIds: string[];
    startAt: Date;
    endAt?: Date | null;
    isActive: boolean;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const AnnouncementNoticeSchema = new Schema<IAnnouncementNotice>(
    {
        title: { type: String, required: true, trim: true },
        message: { type: String, required: true, trim: true },
        target: { type: String, enum: ['all', 'groups', 'students'], default: 'all', index: true },
        targetIds: { type: [String], default: [] },
        startAt: { type: Date, default: Date.now, index: true },
        endAt: { type: Date, default: null, index: true },
        isActive: { type: Boolean, default: true, index: true },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true, collection: 'announcement_notices' }
);

AnnouncementNoticeSchema.index({ isActive: 1, startAt: -1, endAt: 1 });

export default mongoose.model<IAnnouncementNotice>('AnnouncementNotice', AnnouncementNoticeSchema);

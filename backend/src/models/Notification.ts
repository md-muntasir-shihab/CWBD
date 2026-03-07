import mongoose, { Document, Schema } from 'mongoose';

export type NotificationCategory = 'general' | 'exam' | 'update';
export type NotificationTargetRole = 'student' | 'admin' | 'moderator' | 'all';

export interface INotification extends Document {
    title: string;
    message: string;
    category: NotificationCategory;
    publishAt?: Date;
    expireAt?: Date;
    isActive: boolean;
    linkUrl?: string;
    attachmentUrl?: string;
    targetRole: NotificationTargetRole;
    reminderKey?: string;
    targetUserIds?: mongoose.Types.ObjectId[];
    createdBy?: mongoose.Types.ObjectId;
    updatedBy?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>({
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    category: { type: String, enum: ['general', 'exam', 'update'], default: 'general' },
    publishAt: { type: Date, default: null },
    expireAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
    linkUrl: { type: String, default: '' },
    attachmentUrl: { type: String, default: '' },
    targetRole: { type: String, enum: ['student', 'admin', 'moderator', 'all'], default: 'student' },
    reminderKey: { type: String, default: undefined },
    targetUserIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

NotificationSchema.index({ isActive: 1, publishAt: -1, createdAt: -1 });
NotificationSchema.index({ category: 1, isActive: 1 });
NotificationSchema.index({ reminderKey: 1 }, { unique: true, sparse: true });

export default mongoose.model<INotification>('Notification', NotificationSchema);

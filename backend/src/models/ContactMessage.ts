import mongoose, { Schema, Document } from 'mongoose';

export interface IContactMessage extends Document {
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
    isRead: boolean;
    isReplied: boolean;
    ip?: string;
    userAgent?: string;
    createdAt: Date;
}

const ContactMessageSchema = new Schema<IContactMessage>({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true },
    phone: String,
    subject: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    isReplied: { type: Boolean, default: false },
    ip: { type: String, trim: true },
    userAgent: { type: String, trim: true },
}, { timestamps: true });

ContactMessageSchema.index({ createdAt: -1 });

export default mongoose.model<IContactMessage>('ContactMessage', ContactMessageSchema);

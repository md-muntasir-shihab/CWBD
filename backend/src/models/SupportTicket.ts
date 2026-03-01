import mongoose, { Document, Schema } from 'mongoose';

export type SupportTicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type SupportTicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface ISupportTicketTimelineItem {
    actorId: mongoose.Types.ObjectId;
    actorRole: string;
    message: string;
    createdAt: Date;
}

export interface ISupportTicket extends Document {
    ticketNo: string;
    studentId: mongoose.Types.ObjectId;
    subject: string;
    message: string;
    status: SupportTicketStatus;
    priority: SupportTicketPriority;
    assignedTo?: mongoose.Types.ObjectId | null;
    timeline: ISupportTicketTimelineItem[];
    createdAt: Date;
    updatedAt: Date;
}

const SupportTicketTimelineSchema = new Schema<ISupportTicketTimelineItem>(
    {
        actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        actorRole: { type: String, trim: true, required: true },
        message: { type: String, trim: true, required: true },
        createdAt: { type: Date, default: Date.now },
    },
    { _id: false }
);

const SupportTicketSchema = new Schema<ISupportTicket>(
    {
        ticketNo: { type: String, required: true, unique: true, index: true },
        studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        subject: { type: String, required: true, trim: true },
        message: { type: String, required: true, trim: true },
        status: { type: String, enum: ['open', 'in_progress', 'resolved', 'closed'], default: 'open', index: true },
        priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
        assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
        timeline: { type: [SupportTicketTimelineSchema], default: [] },
    },
    { timestamps: true, collection: 'support_tickets' }
);

SupportTicketSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model<ISupportTicket>('SupportTicket', SupportTicketSchema);

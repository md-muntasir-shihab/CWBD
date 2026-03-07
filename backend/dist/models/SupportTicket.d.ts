import mongoose, { Document } from 'mongoose';
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
declare const _default: any;
export default _default;
//# sourceMappingURL=SupportTicket.d.ts.map
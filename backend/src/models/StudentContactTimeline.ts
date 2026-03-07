import mongoose, { Document, Schema } from 'mongoose';

export type StudentContactTimelineType =
    | 'note'
    | 'call'
    | 'message'
    | 'support_ticket_link'
    | 'payment_note';

export interface IStudentContactTimeline extends Document {
    studentId: mongoose.Types.ObjectId;
    type: StudentContactTimelineType;
    content: string;
    linkedId?: mongoose.Types.ObjectId;
    createdByAdminId: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const StudentContactTimelineSchema = new Schema<IStudentContactTimeline>(
    {
        studentId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        type: {
            type: String,
            enum: ['note', 'call', 'message', 'support_ticket_link', 'payment_note'],
            required: true,
        },
        content: {
            type: String,
            required: true,
            trim: true,
            maxlength: 2000,
        },
        linkedId: { type: Schema.Types.ObjectId },
        createdByAdminId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    { timestamps: true, collection: 'student_contact_timeline' }
);

StudentContactTimelineSchema.index({ studentId: 1, createdAt: -1 });

export default mongoose.model<IStudentContactTimeline>('StudentContactTimeline', StudentContactTimelineSchema);

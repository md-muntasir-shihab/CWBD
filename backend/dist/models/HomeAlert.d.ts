import mongoose, { Document } from 'mongoose';
export interface IHomeAlert extends Document {
    title?: string;
    message: string;
    link?: string;
    priority: number;
    isActive: boolean;
    status: 'draft' | 'published';
    requireAck: boolean;
    target: {
        type: 'all' | 'groups' | 'users';
        groupIds: string[];
        userIds: string[];
    };
    metrics: {
        impressions: number;
        acknowledgements: number;
    };
    startAt?: Date;
    endAt?: Date;
    createdBy?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: any;
export default _default;
//# sourceMappingURL=HomeAlert.d.ts.map
import mongoose, { Document } from 'mongoose';
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
declare const _default: mongoose.Model<IAnnouncementNotice, {}, {}, {}, mongoose.Document<unknown, {}, IAnnouncementNotice, {}, {}> & IAnnouncementNotice & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=AnnouncementNotice.d.ts.map
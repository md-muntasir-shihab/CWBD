import mongoose, { Document } from 'mongoose';
export interface IStudentWatchlist extends Document {
    studentId: mongoose.Types.ObjectId;
    itemType: 'university' | 'resource' | 'exam' | 'news';
    itemId: mongoose.Types.ObjectId;
    createdAt: Date;
}
declare const _default: mongoose.Model<IStudentWatchlist, {}, {}, {}, mongoose.Document<unknown, {}, IStudentWatchlist, {}, {}> & IStudentWatchlist & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=StudentWatchlist.d.ts.map
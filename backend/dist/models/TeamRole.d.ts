import mongoose, { Document } from 'mongoose';
export interface ITeamRole extends Document {
    name: string;
    slug: string;
    description: string;
    isSystemRole: boolean;
    isActive: boolean;
    basePlatformRole: 'superadmin' | 'admin' | 'moderator' | 'editor' | 'viewer' | 'support_agent' | 'finance_agent';
}
declare const _default: mongoose.Model<ITeamRole, {}, {}, {}, mongoose.Document<unknown, {}, ITeamRole, {}, {}> & ITeamRole & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=TeamRole.d.ts.map
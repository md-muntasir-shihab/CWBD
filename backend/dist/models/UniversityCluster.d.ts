import mongoose, { Document } from 'mongoose';
export interface IUniversityClusterDateConfig {
    applicationStartDate?: Date | null;
    applicationEndDate?: Date | null;
    scienceExamDate?: string;
    commerceExamDate?: string;
    artsExamDate?: string;
}
export interface IUniversityCluster extends Document {
    name: string;
    slug: string;
    description?: string;
    isActive: boolean;
    memberUniversityIds: mongoose.Types.ObjectId[];
    categoryRules: string[];
    categoryRuleIds: mongoose.Types.ObjectId[];
    dates: IUniversityClusterDateConfig;
    syncPolicy: 'inherit_with_override';
    homeVisible: boolean;
    homeOrder: number;
    createdBy?: mongoose.Types.ObjectId | null;
    updatedBy?: mongoose.Types.ObjectId | null;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: any;
export default _default;
//# sourceMappingURL=UniversityCluster.d.ts.map
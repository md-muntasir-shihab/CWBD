import mongoose, { Document } from 'mongoose';
export type ContentBlockType = 'cta_strip' | 'info_banner' | 'campaign_card' | 'notice_ribbon' | 'hero_card';
export type ContentBlockPlacement = 'HOME_TOP' | 'HOME_MID' | 'HOME_BOTTOM' | 'EXAM_LIST' | 'STUDENT_DASHBOARD' | 'NEWS_PAGE' | 'UNIVERSITY_LIST' | 'PRICING_PAGE';
export interface IAudienceRules {
    roles?: string[];
    hasActiveSubscription?: boolean;
    groups?: string[];
}
export interface IContentBlock extends Document {
    title: string;
    subtitle?: string;
    body?: string;
    imageUrl?: string;
    ctaText?: string;
    ctaUrl?: string;
    type: ContentBlockType;
    placements: ContentBlockPlacement[];
    styleVariant?: string;
    isEnabled: boolean;
    startAtUTC?: Date;
    endAtUTC?: Date;
    priority: number;
    dismissible: boolean;
    audienceRules?: IAudienceRules;
    impressionCount: number;
    clickCount: number;
    createdByAdminId: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IContentBlock, {}, {}, {}, mongoose.Document<unknown, {}, IContentBlock, {}, {}> & IContentBlock & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=ContentBlock.d.ts.map
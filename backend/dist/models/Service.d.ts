import mongoose, { Document } from 'mongoose';
export interface IService extends Document {
    title_bn: string;
    title_en: string;
    description_bn?: string;
    description_en?: string;
    icon_url?: string;
    banner_image?: string;
    category?: mongoose.Types.ObjectId;
    is_active: boolean;
    is_featured: boolean;
    display_order: number;
    button_text?: string;
    button_link?: string;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: any;
export default _default;
//# sourceMappingURL=Service.d.ts.map
import mongoose, { Document } from 'mongoose';
export interface IServicePricingPlan extends Document {
    service_id: mongoose.Types.ObjectId;
    name: string;
    price: number;
    billing_cycle: 'monthly' | 'yearly' | 'one_time';
    features_included: string[];
    is_trial: boolean;
    order_index: number;
    status: 'active' | 'inactive';
}
declare const _default: mongoose.Model<IServicePricingPlan, {}, {}, {}, mongoose.Document<unknown, {}, IServicePricingPlan, {}, {}> & IServicePricingPlan & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=ServicePricingPlan.d.ts.map
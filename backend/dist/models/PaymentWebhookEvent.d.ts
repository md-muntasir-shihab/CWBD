import mongoose, { Document } from 'mongoose';
export interface IPaymentWebhookEvent extends Document {
    provider: string;
    eventType: string;
    providerEventId: string;
    signatureValid: boolean;
    requestHash: string;
    status: 'received' | 'processed' | 'ignored' | 'failed';
    paymentId?: mongoose.Types.ObjectId | null;
    reference?: string;
    payload: Record<string, unknown>;
    errorMessage?: string;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IPaymentWebhookEvent, {}, {}, {}, mongoose.Document<unknown, {}, IPaymentWebhookEvent, {}, {}> & IPaymentWebhookEvent & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=PaymentWebhookEvent.d.ts.map
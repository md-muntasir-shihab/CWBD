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
declare const _default: any;
export default _default;
//# sourceMappingURL=PaymentWebhookEvent.d.ts.map
import { Document } from 'mongoose';
export interface IContactMessage extends Document {
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
    isRead: boolean;
    isReplied: boolean;
    ip?: string;
    userAgent?: string;
    createdAt: Date;
}
declare const _default: any;
export default _default;
//# sourceMappingURL=ContactMessage.d.ts.map
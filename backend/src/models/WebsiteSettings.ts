import mongoose, { Schema, Document } from 'mongoose';

export interface IWebsiteSettings extends Document {
    websiteName: string;
    logo: string;
    favicon: string;
    motto: string;
    metaTitle: string;
    metaDescription: string;
    contactEmail: string;
    contactPhone: string;
    socialLinks: {
        facebook: string;
        youtube: string;
        whatsapp: string;
    };
}

const WebsiteSettingsSchema = new Schema<IWebsiteSettings>({
    websiteName: { type: String, default: 'CampusWay' },
    logo: { type: String, default: '/logo.png' },
    favicon: { type: String, default: '/favicon.ico' },
    motto: { type: String, default: 'Your Admission Gateway' },
    metaTitle: { type: String, default: 'CampusWay - Admission Gateway' },
    metaDescription: { type: String, default: 'Prepare for university admissions with CampusWay.' },
    contactEmail: { type: String, default: 'support@campusway.com' },
    contactPhone: { type: String, default: '+8801234567890' },
    socialLinks: {
        facebook: { type: String, default: '' },
        youtube: { type: String, default: '' },
        whatsapp: { type: String, default: '' }
    }
}, { timestamps: true });

export default mongoose.model<IWebsiteSettings>('WebsiteSettings', WebsiteSettingsSchema);

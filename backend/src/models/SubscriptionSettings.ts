import mongoose, { Document, Schema } from 'mongoose';

export interface ISubscriptionSettings extends Document {
  pageTitle: string;
  pageSubtitle: string;
  headerBannerUrl: string | null;
  defaultPlanBannerUrl: string | null;
  currencyLabel: string;
  showFeaturedFirst: boolean;
  allowFreePlans: boolean;
  lastEditedByAdminId: mongoose.Types.ObjectId | null;
  updatedAt: Date;
  createdAt: Date;
}

const SubscriptionSettingsSchema = new Schema<ISubscriptionSettings>(
  {
    pageTitle: { type: String, default: 'Subscription Plans' },
    pageSubtitle: { type: String, default: 'Choose free or paid plans to unlock premium exam access.' },
    headerBannerUrl: { type: String, default: null },
    defaultPlanBannerUrl: { type: String, default: null },
    currencyLabel: { type: String, default: 'BDT' },
    showFeaturedFirst: { type: Boolean, default: true },
    allowFreePlans: { type: Boolean, default: true },
    lastEditedByAdminId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

SubscriptionSettingsSchema.index({ updatedAt: -1 });

export default mongoose.model<ISubscriptionSettings>('SubscriptionSettings', SubscriptionSettingsSchema);

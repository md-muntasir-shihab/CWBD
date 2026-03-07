import { Document } from 'mongoose';
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
        whatsapp: string;
        messenger: string;
        telegram: string;
        twitter: string;
        youtube: string;
        instagram: string;
    };
    theme: {
        modeDefault: 'light' | 'dark' | 'system';
        allowSystemMode: boolean;
        switchVariant: 'default' | 'pro';
        animationLevel: 'none' | 'subtle' | 'rich';
        brandGradients: string[];
    };
    socialUi: {
        clusterEnabled: boolean;
        buttonVariant: 'default' | 'squircle';
        showLabels: boolean;
        platformOrder: Array<'facebook' | 'whatsapp' | 'messenger' | 'telegram' | 'twitter' | 'youtube' | 'instagram'>;
    };
    pricingUi: {
        currencyCode: string;
        currencySymbol: string;
        currencyLocale: string;
        displayMode: 'symbol' | 'code';
        thousandSeparator: boolean;
    };
    subscriptionPageTitle: string;
    subscriptionPageSubtitle: string;
    subscriptionDefaultBannerUrl: string;
    subscriptionLoggedOutCtaMode: 'login' | 'contact';
}
declare const _default: any;
export default _default;
//# sourceMappingURL=WebsiteSettings.d.ts.map
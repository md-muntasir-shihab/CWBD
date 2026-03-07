import { Document } from 'mongoose';
export interface IHomePage extends Document {
    heroSection: {
        title: string;
        subtitle: string;
        buttonText: string;
        buttonLink: string;
        backgroundImage: string;
        overlay: boolean;
    };
    announcementBar: {
        enabled: boolean;
        text: string;
        backgroundColor: string;
    };
    promotionalBanner: {
        enabled: boolean;
        image: string;
        link: string;
    };
    statistics: {
        totalStudents: number;
        totalExams: number;
        totalUniversities: number;
        totalResults: number;
    };
    featuredSectionSettings: {
        showNews: boolean;
        showServices: boolean;
        showExams: boolean;
    };
}
declare const _default: any;
export default _default;
//# sourceMappingURL=HomePage.d.ts.map
import express, { Response } from 'express';
import request from 'supertest';
import { getAggregatedHomeData } from '../../src/controllers/homeAggregateController';
import HomeSettings, { createHomeSettingsDefaults, type HomeSettingsShape } from '../../src/models/HomeSettings';
import University from '../../src/models/University';
import UniversitySettingsModel from '../../src/models/UniversitySettings';

function addDays(days: number): Date {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + days);
    return date;
}

async function seedHomeSettings(
    previewOverrides: Partial<HomeSettingsShape['universityPreview']> = {},
): Promise<void> {
    const defaults = createHomeSettingsDefaults();
    defaults.universityPreview = {
        ...defaults.universityPreview,
        ...previewOverrides,
    };
    await HomeSettings.create(defaults);
}

async function seedUniversity(params: {
    name: string;
    shortForm: string;
    slug: string;
    category: string;
    deadlineInDays: number;
    examInDays?: number;
}): Promise<void> {
    await University.create({
        name: params.name,
        shortForm: params.shortForm,
        slug: params.slug,
        category: params.category,
        clusterGroup: '',
        website: 'https://example.edu',
        admissionWebsite: 'https://admission.example.edu',
        address: 'Dhaka, Bangladesh',
        contactNumber: '01700000000',
        email: 'admission@example.edu',
        totalSeats: '1200',
        scienceSeats: '500',
        artsSeats: '300',
        businessSeats: '400',
        applicationStartDate: addDays(-5),
        applicationEndDate: addDays(params.deadlineInDays),
        scienceExamDate: addDays(params.examInDays ?? params.deadlineInDays + 1).toISOString(),
        artsExamDate: '',
        businessExamDate: '',
        isActive: true,
        isArchived: false,
    });
}

function buildTestApp() {
    const app = express();
    app.get('/api/home', (req, res: Response) => {
        void getAggregatedHomeData(req as any, res as any);
    });
    return app;
}

describe('/api/home (Home Step1)', () => {
    test('returns required top-level keys', async () => {
        await seedHomeSettings();
        await seedUniversity({
            name: 'Test University',
            shortForm: 'TU',
            slug: 'test-university',
            category: 'Individual Admission',
            deadlineInDays: 3,
        });

        const app = buildTestApp();
        const response = await request(app).get('/api/home').expect(200);
        const body = response.body as Record<string, unknown>;

        const requiredKeys = [
            'siteSettings',
            'homeSettings',
            'campaignBannersActive',
            'featuredUniversities',
            'universityCategories',
            'deadlineUniversities',
            'upcomingExamUniversities',
            'onlineExamsPreview',
            'newsPreviewItems',
            'resourcePreviewItems',
        ];

        for (const key of requiredKeys) {
            expect(body).toHaveProperty(key);
        }
    });

    test('preserves featured ordering from admin featuredUniversitySlugs', async () => {
        await seedHomeSettings({ featuredMode: 'manual', maxFeaturedItems: 5 });
        await seedUniversity({
            name: 'Alpha University',
            shortForm: 'AU',
            slug: 'alpha-university',
            category: 'Individual Admission',
            deadlineInDays: 3,
        });
        await seedUniversity({
            name: 'Beta University',
            shortForm: 'BU',
            slug: 'beta-university',
            category: 'Individual Admission',
            deadlineInDays: 4,
        });

        await UniversitySettingsModel.create({
            featuredUniversitySlugs: ['beta-university', 'alpha-university'],
            maxFeaturedItems: 5,
        });

        const app = buildTestApp();
        const response = await request(app).get('/api/home').expect(200);
        const featured = Array.isArray(response.body.featuredUniversities)
            ? response.body.featuredUniversities
            : [];

        const slugs = featured.map((item: { slug?: string }) => String(item.slug || ''));
        expect(slugs.slice(0, 2)).toEqual(['beta-university', 'alpha-university']);
    });

    test('applies deadlineWithinDays threshold for deadlineUniversities', async () => {
        await seedHomeSettings({ deadlineWithinDays: 5, maxDeadlineItems: 10 });

        await seedUniversity({
            name: 'Near Deadline University',
            shortForm: 'NDU',
            slug: 'near-deadline-university',
            category: 'Individual Admission',
            deadlineInDays: 2,
        });
        await seedUniversity({
            name: 'Far Deadline University',
            shortForm: 'FDU',
            slug: 'far-deadline-university',
            category: 'Individual Admission',
            deadlineInDays: 9,
        });
        await seedUniversity({
            name: 'Past Deadline University',
            shortForm: 'PDU',
            slug: 'past-deadline-university',
            category: 'Individual Admission',
            deadlineInDays: -1,
        });

        const app = buildTestApp();
        const response = await request(app).get('/api/home').expect(200);
        const deadlineItems = Array.isArray(response.body.deadlineUniversities)
            ? response.body.deadlineUniversities
            : [];
        const slugs = deadlineItems.map((item: { slug?: string }) => String(item.slug || ''));

        expect(slugs).toContain('near-deadline-university');
        expect(slugs).not.toContain('far-deadline-university');
        expect(slugs).not.toContain('past-deadline-university');
    });

    test('includes universities whose deadline is today', async () => {
        await seedHomeSettings({ deadlineWithinDays: 5, maxDeadlineItems: 10 });

        await seedUniversity({
            name: 'Today Deadline University',
            shortForm: 'TDU',
            slug: 'today-deadline-university',
            category: 'Individual Admission',
            deadlineInDays: 0,
        });

        const app = buildTestApp();
        const response = await request(app).get('/api/home').expect(200);
        const deadlineItems = Array.isArray(response.body.deadlineUniversities)
            ? response.body.deadlineUniversities
            : [];
        const slugs = deadlineItems.map((item: { slug?: string }) => String(item.slug || ''));

        expect(slugs).toContain('today-deadline-university');
    });
});

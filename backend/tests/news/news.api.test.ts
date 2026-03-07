import express, { type Request, type Response } from 'express';
import request from 'supertest';
import News from '../../src/models/News';
import NewsSystemSettings from '../../src/models/NewsSystemSettings';
import {
    getPublicNewsV2List,
    getPublicNewsV2BySlug,
    getPublicNewsV2Settings,
    getPublicNewsV2Sources,
} from '../../src/controllers/newsV2Controller';

// Shared setup/teardown lives in tests/setup.ts (beforeAll/afterEach/afterAll)

async function seedNews(overrides: Record<string, unknown> = {}) {
    return News.create({
        title: overrides.title ?? 'Test News Article',
        slug: overrides.slug ?? `test-news-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        shortSummary: overrides.shortSummary ?? 'A short summary of the news article.',
        shortDescription: overrides.shortDescription ?? 'A short description.',
        content: overrides.content ?? '<p>Full news content here.</p>',
        fullContent: overrides.fullContent ?? '<p>Full news content here.</p>',
        category: overrides.category ?? 'general',
        tags: overrides.tags ?? ['test'],
        sourceName: overrides.sourceName ?? 'Test Source',
        sourceUrl: overrides.sourceUrl ?? 'https://test.com',
        originalArticleUrl: overrides.originalArticleUrl ?? `https://test.com/article-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        status: overrides.status ?? 'published',
        isPublished: overrides.isPublished !== undefined ? overrides.isPublished : true,
        publishDate: overrides.publishDate ?? new Date(),
        publishedAt: overrides.publishedAt ?? new Date(),
        coverImageUrl: overrides.coverImageUrl ?? null,
        coverImageSource: overrides.coverImageSource ?? 'default',
        ...overrides,
    });
}

function buildApp() {
    const app = express();
    app.use(express.json());
    app.get('/api/news', (req: Request, res: Response) => getPublicNewsV2List(req, res));
    app.get('/api/news/settings', (req: Request, res: Response) => getPublicNewsV2Settings(req, res));
    app.get('/api/news/sources', (req: Request, res: Response) => getPublicNewsV2Sources(req, res));
    app.get('/api/news/:slug', (req: Request, res: Response) => getPublicNewsV2BySlug(req, res));
    return app;
}

describe('/api/news', () => {
    it('returns published news items in list', async () => {
        await seedNews({ title: 'Published News', slug: 'published-news-1', status: 'published', isPublished: true });
        await seedNews({ title: 'Draft News', slug: 'draft-news-1', status: 'draft', isPublished: false });

        const app = buildApp();
        const res = await request(app).get('/api/news');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.items)).toBe(true);
        expect(res.body.items.some((i: { title: string }) => i.title === 'Published News')).toBe(true);
        expect(res.body.items.every((i: { title: string }) => i.title !== 'Draft News')).toBe(true);
    });

    it('pending_review items are not returned in public list', async () => {
        await seedNews({ title: 'Pending Article', slug: 'pending-article', status: 'pending_review', isPublished: false });

        const app = buildApp();
        const res = await request(app).get('/api/news');
        expect(res.status).toBe(200);
        expect(res.body.items.every((i: { title: string }) => i.title !== 'Pending Article')).toBe(true);
    });

    it('duplicate_review items go to duplicates queue not public list', async () => {
        await seedNews({ title: 'Duplicate Article', slug: 'duplicate-article', status: 'duplicate_review', isPublished: false });

        const app = buildApp();
        const res = await request(app).get('/api/news');
        expect(res.status).toBe(200);
        expect(res.body.items.every((i: { title: string }) => i.title !== 'Duplicate Article')).toBe(true);
    });

    it('GET /api/news/:slug returns correct article', async () => {
        await seedNews({ title: 'Slug Test Article', slug: 'slug-test-article' });

        const app = buildApp();
        const res = await request(app).get('/api/news/slug-test-article');
        expect(res.status).toBe(200);
        expect(res.body.item).toBeDefined();
        expect(res.body.item.slug).toBe('slug-test-article');
        expect(res.body.item.title).toBe('Slug Test Article');
    });

    it('GET /api/news/nonexistent returns 404', async () => {
        const app = buildApp();
        const res = await request(app).get('/api/news/this-article-does-not-exist-404');
        expect(res.status).toBe(404);
    });

    it('settings endpoint returns public settings with required fields', async () => {
        const app = buildApp();
        const res = await request(app).get('/api/news/settings');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('pageTitle');
        expect(res.body).toHaveProperty('defaultBannerUrl');
        expect(res.body).toHaveProperty('defaultSourceIconUrl');
        expect(res.body).toHaveProperty('appearance');
        expect(res.body).toHaveProperty('shareButtons');
        expect(res.body).toHaveProperty('shareTemplates');
        expect(res.body).toHaveProperty('workflow');
    });

    it('settings changes affect public settings response', async () => {
        await NewsSystemSettings.updateOne(
            { key: 'default' },
            { $set: { 'config.pageTitle': 'Custom Page Title', 'config.defaultBannerUrl': 'https://banner.example.com/img.jpg' } },
            { upsert: true }
        );

        const app = buildApp();
        const res = await request(app).get('/api/news/settings');
        expect(res.status).toBe(200);
        expect(res.body.pageTitle).toBe('Custom Page Title');
        expect(res.body.defaultBannerUrl).toBe('https://banner.example.com/img.jpg');
    });

    it('sources endpoint returns array', async () => {
        const app = buildApp();
        const res = await request(app).get('/api/news/sources');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('items');
        expect(Array.isArray(res.body.items)).toBe(true);
    });

    it('search by title filters results', async () => {
        await seedNews({ title: 'Unique Searchable', slug: 'unique-searchable' });
        await seedNews({ title: 'Other Article', slug: 'other-article' });

        const app = buildApp();
        const res = await request(app).get('/api/news?q=Unique%20Searchable');
        expect(res.status).toBe(200);
        expect(res.body.items.some((i: { title: string }) => i.title === 'Unique Searchable')).toBe(true);
    });
});

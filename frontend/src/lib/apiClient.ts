/**
 * Canonical API client for the Universities module.
 *
 * - Axios wrapper with auth token + fingerprint injection (delegates to main api instance)
 * - Mock interceptor registry for `VITE_USE_MOCK_API=true`
 * - Typed request/response helpers + response normalisation for both legacy and new backend shapes
 */

import api from '../services/api';
import type {
    ApiUniversity,
    ApiUniversityCardPreview,
    UniversityCategorySummary,
} from '../services/api';
import type { AxiosResponse } from 'axios';

/* ── Public types re-exported for convenience ── */

export type { ApiUniversity, ApiUniversityCardPreview, UniversityCategorySummary };

export interface UniversityCard {
    id: string;
    name: string;
    shortForm: string;
    slug: string;
    category: string;
    clusterGroup: string;
    contactNumber: string;
    established: number | null;
    address: string;
    email: string;
    website: string;
    admissionWebsite: string;
    totalSeats: string;
    scienceSeats: string;
    artsSeats: string;
    businessSeats: string;
    applicationStartDate: string;
    applicationEndDate: string;
    scienceExamDate: string;
    artsExamDate: string;
    businessExamDate: string;
    examCentersPreview: string[];
    shortDescription: string;
    logoUrl: string;
}

export interface UniversityDetail extends UniversityCard {
    description: string;
    heroImageUrl: string;
    examCenters: { city: string; address: string }[];
    units: {
        name: string;
        seats: number;
        examDates: string[];
        applicationStart: string;
        applicationEnd: string;
        examCenters: { city: string; address: string }[];
    }[];
    socialLinks: { platform: string; url: string }[];
    isActive: boolean;
}

export interface UniversityListResponse {
    universities: UniversityCard[];
    pagination: { total: number; page: number; limit: number; pages: number };
}

/* ── Mock interceptor registry ── */

export const IS_MOCK_MODE = import.meta.env.VITE_USE_MOCK_API === 'true';

type MockHandler = (url: string, config?: unknown) => AxiosResponse | Promise<AxiosResponse>;

const _mockRegistry = new Map<RegExp, MockHandler>();

/**
 * Register a mock handler for URLs matching a regex pattern.
 * No-op when mock mode is off.
 */
export function registerMock(pattern: RegExp, handler: MockHandler): void {
    if (!IS_MOCK_MODE) return;
    _mockRegistry.set(pattern, handler);
}

// Install a request interceptor that short-circuits matching URLs in mock mode
if (IS_MOCK_MODE) {
    api.interceptors.request.use((config) => {
        const url = config.url || '';
        for (const [pattern, handler] of _mockRegistry) {
            if (pattern.test(url)) {
                // Return a resolved adapter response to skip the real request
                const result = handler(url, config);
                return Promise.reject({
                    __isMock: true,
                    response: result instanceof Promise ? undefined : result,
                    responsePromise: result instanceof Promise ? result : undefined,
                    config,
                });
            }
        }
        return config;
    });

    api.interceptors.response.use(
        (response) => response,
        (error) => {
            if (error?.__isMock) {
                if (error.response) return Promise.resolve(error.response);
                if (error.responsePromise) return error.responsePromise;
            }
            return Promise.reject(error);
        },
    );
}

/* ── Response normalisation helpers ── */

function normalizeUniversityCard(raw: ApiUniversity | ApiUniversityCardPreview): UniversityCard {
    const r = raw as unknown as Record<string, unknown>;
    return {
        id: String(r._id || r.id || ''),
        name: String(r.name || ''),
        shortForm: String(r.shortForm || 'N/A'),
        slug: String(r.slug || ''),
        category: String(r.category || ''),
        clusterGroup: String(r.clusterGroup || ''),
        contactNumber: String(r.contactNumber || ''),
        established: typeof r.established === 'number' ? r.established
            : typeof r.establishedYear === 'number' ? r.establishedYear
            : null,
        address: String(r.address || ''),
        email: String(r.email || ''),
        website: String(r.website || r.websiteUrl || ''),
        admissionWebsite: String(r.admissionWebsite || r.admissionUrl || ''),
        totalSeats: String(r.totalSeats ?? 'N/A'),
        scienceSeats: String(r.scienceSeats ?? r.seatsScienceEng ?? 'N/A'),
        artsSeats: String(r.artsSeats ?? r.seatsArtsHum ?? 'N/A'),
        businessSeats: String(r.businessSeats ?? r.seatsBusiness ?? 'N/A'),
        applicationStartDate: String(r.applicationStartDate || r.applicationStart || ''),
        applicationEndDate: String(r.applicationEndDate || r.applicationEnd || ''),
        scienceExamDate: String(r.scienceExamDate || r.examDateScience || ''),
        artsExamDate: String(r.artsExamDate || r.examDateArts || ''),
        businessExamDate: String(r.businessExamDate || r.examDateBusiness || ''),
        examCentersPreview: Array.isArray(r.examCentersPreview) ? r.examCentersPreview as string[]
            : Array.isArray(r.examCenters) ? (r.examCenters as { city: string }[]).map(c => c.city).slice(0, 6)
            : [],
        shortDescription: String(r.shortDescription || r.description || ''),
        logoUrl: String(r.logoUrl || ''),
    };
}

/* ── Public API functions ── */

export async function fetchUniversityCategories(): Promise<UniversityCategorySummary[]> {
    const { data } = await api.get<{ categories: UniversityCategorySummary[] }>('/university-categories');
    return Array.isArray(data.categories) ? data.categories : [];
}

export async function fetchUniversities(
    params: Record<string, string | number> = {},
): Promise<UniversityListResponse> {
    const { data } = await api.get<{
        universities: ApiUniversity[];
        pagination: { total: number; page: number; limit: number; pages: number };
    }>('/universities', { params });

    return {
        universities: Array.isArray(data.universities)
            ? data.universities.map(normalizeUniversityCard)
            : [],
        pagination: data.pagination || { total: 0, page: 1, limit: 20, pages: 0 },
    };
}

export async function fetchUniversityBySlug(slug: string): Promise<UniversityDetail | null> {
    const { data } = await api.get<{ university: ApiUniversity }>(`/universities/${encodeURIComponent(slug)}`);
    if (!data.university) return null;

    const raw = data.university as unknown as Record<string, unknown>;
    const card = normalizeUniversityCard(data.university);

    return {
        ...card,
        description: String(raw.description || raw.shortDescription || ''),
        heroImageUrl: String(raw.heroImageUrl || ''),
        examCenters: Array.isArray(raw.examCenters) ? raw.examCenters as { city: string; address: string }[] : [],
        units: Array.isArray(raw.units) ? raw.units as UniversityDetail['units'] : [],
        socialLinks: Array.isArray(raw.socialLinks) ? raw.socialLinks as { platform: string; url: string }[] : [],
        isActive: Boolean(raw.isActive ?? true),
    };
}

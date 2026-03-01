/* ── Canonical University data model ── */

export interface UniversitySeats {
    science?: number | null;
    arts?: number | null;
    commerce?: number | null;
}

export interface UniversitySeatsNA {
    science?: boolean;
    arts?: boolean;
    commerce?: boolean;
}

export interface ExamCenter {
    city: string;
    address?: string;
    mapUrl?: string;
}

export interface NextExam {
    department: string;
    date: string; // ISO 8601
}

export interface UniversityContact {
    phone?: string;
    email?: string;
}

export interface UniversityLogo {
    url?: string;
    alt?: string;
}

export interface DefaultLogo {
    initials: string;
    color: string;
}

export interface SocialLink {
    platform: string;
    url: string;
    icon?: string;
}

export interface University {
    _id: string;
    name: string;
    shortForm: string;
    slug: string;
    category: string;
    description?: string;
    shortDescription?: string;
    established?: number;
    totalSeats?: string;
    scienceSeats?: string;
    artsSeats?: string;
    businessSeats?: string;
    applicationStart?: string;
    applicationEnd?: string;
    scienceExamDate?: string;
    artsExamDate?: string;
    businessExamDate?: string;
    examCenters?: ExamCenter[];
    contact?: UniversityContact;
    website?: string;
    admissionWebsite?: string;
    logo?: UniversityLogo;
    defaultLogo?: DefaultLogo;
    featured?: boolean;
    featuredOrder?: number;
    isActive?: boolean;
    verificationStatus?: string;
    remarks?: string;
    address?: string;
    logoUrl?: string;
    socialLinks?: SocialLink[];
    units?: Array<{
        name: string;
        seats?: number;
        examDates?: string[];
        applicationStart?: string;
        applicationEnd?: string;
    }>;
    createdAt?: string;
    updatedAt: string;
}

/* ── Paginated response ── */
export interface UniversityPaginatedResponse {
    universities: University[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    };
}

/* ── Filter params ── */
export interface UniversityFilterParams {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    sort?: string;
    minSeats?: number;
    maxSeats?: number;
    featured?: boolean;
}

# UNIVERSITIES API CONTRACT

**Version:** 1.0
**Base URL:** `/api`

---

## Public Endpoints

### 1. GET /api/university-categories

Returns the list of university categories with counts and cluster groups.

**Auth:** None

**Response 200:**
```json
{
  "categories": [
    {
      "categoryName": "Individual Admission",
      "order": 1,
      "count": 42,
      "clusterGroups": ["Group A", "Group B"]
    },
    {
      "categoryName": "Science & Technology",
      "order": 2,
      "count": 15,
      "clusterGroups": []
    }
  ],
  "items": [/* same as categories */]
}
```

**Category Order (canonical):**
1. Individual Admission
2. Science & Technology
3. GST (General/Public)
4. GST (Science & Technology)
5. Medical College
6. AGRI Cluster
7. Under Army
8. DCU
9. Specialized University
10. Affiliate College
11. Dental College
12. Nursing Colleges

---

### 2. GET /api/universities

Returns a paginated list of universities filtered by category.

**Auth:** None

**Query Parameters:**
| Param | Type | Required | Default | Description |
|---|---|---|---|---|
| category | string | **YES** | — | Category name (400 if missing) |
| clusterGroup | string | No | — | Filter by cluster group |
| q | string | No | — | Search by name, shortForm, address |
| sort | string | No | `alphabetical` | `closing_soon`, `exam_soon`, `name_asc`, `name_desc` |
| page | number | No | 1 | Page number |
| limit | number | No | 24 | Items per page (max 500) |
| featured | boolean | No | false | If true, returns only featured universities |

**Response 200:**
```json
{
  "universities": [
    {
      "_id": "64a1b2c3d4e5f6a7b8c9d0e1",
      "name": "Dhaka University",
      "shortForm": "DU",
      "slug": "dhaka-university",
      "category": "Individual Admission",
      "clusterGroup": "",
      "established": 1921,
      "establishedYear": 1921,
      "address": "Shahbagh, Dhaka-1000",
      "contactNumber": "+880-2-9661900",
      "email": "registrar@du.ac.bd",
      "website": "https://www.du.ac.bd",
      "websiteUrl": "https://www.du.ac.bd",
      "admissionWebsite": "https://admission.du.ac.bd",
      "admissionUrl": "https://admission.du.ac.bd",
      "totalSeats": "7200",
      "scienceSeats": "3500",
      "seatsScienceEng": "3500",
      "artsSeats": "2500",
      "seatsArtsHum": "2500",
      "businessSeats": "1200",
      "seatsBusiness": "1200",
      "applicationStartDate": "2025-09-01T00:00:00.000Z",
      "applicationEndDate": "2025-09-30T00:00:00.000Z",
      "applicationStart": "2025-09-01T00:00:00.000Z",
      "applicationEnd": "2025-09-30T00:00:00.000Z",
      "scienceExamDate": "2025-10-15",
      "examDateScience": "2025-10-15",
      "artsExamDate": "2025-10-22",
      "examDateArts": "2025-10-22",
      "businessExamDate": "2025-10-29",
      "examDateBusiness": "2025-10-29",
      "logoUrl": "https://...",
      "isActive": true,
      "featured": false,
      "examCenters": [
        { "city": "Dhaka", "address": "Main Campus" }
      ]
    }
  ],
  "pagination": {
    "total": 42,
    "page": 1,
    "limit": 24,
    "pages": 2
  }
}
```

**Response 400 (category missing):**
```json
{
  "message": "Category is required for this endpoint.",
  "code": "CATEGORY_REQUIRED",
  "defaultCategory": "Individual Admission"
}
```

---

### 3. GET /api/universities/:slug

Returns a single university detail by slug.

**Auth:** None

**Response 200:**
```json
{
  "university": {
    "_id": "64a1b2c3d4e5f6a7b8c9d0e1",
    "name": "Dhaka University",
    "shortForm": "DU",
    "slug": "dhaka-university",
    "category": "Individual Admission",
    "description": "The University of Dhaka...",
    "shortDescription": "Premier public university...",
    "units": [
      {
        "_id": "...",
        "name": "Science",
        "seats": 3500,
        "examDates": ["2025-10-15T00:00:00.000Z"],
        "applicationStart": "2025-09-01T00:00:00.000Z",
        "applicationEnd": "2025-09-30T00:00:00.000Z",
        "examCenters": [{ "city": "Dhaka", "address": "TSC" }],
        "notes": "Bring admit card"
      }
    ],
    "examCenters": [
      { "city": "Dhaka", "address": "Main Campus" },
      { "city": "Rajshahi", "address": "RU Campus" }
    ],
    "socialLinks": [
      { "platform": "facebook", "url": "https://fb.com/du", "icon": "" }
    ],
    "/* ... all university fields ... */": ""
  }
}
```

**Response 404:**
```json
{
  "message": "University not found"
}
```

---

## Admin Endpoints

All admin endpoints require authentication with JWT and role-based access.

**Base path:** `/api/__cw_admin__/` (or configured ADMIN_PATH)

### Universities CRUD

| Method | Path | Auth Roles | Description |
|---|---|---|---|
| GET | /universities | superadmin, admin, moderator, editor | List all universities (admin view, includes inactive) |
| GET | /universities/:id | superadmin, admin, moderator, editor | Get single university by ID |
| POST | /universities | superadmin, admin, moderator | Create university |
| PUT | /universities/:id | superadmin, admin, moderator | Update university |
| DELETE | /universities/:id | superadmin, admin | Delete university (soft/hard via ?mode=soft) |
| PATCH | /universities/:id/toggle-status | superadmin, admin | Toggle isActive |

### Bulk Operations

| Method | Path | Auth Roles | Description |
|---|---|---|---|
| POST | /universities/bulk-delete | superadmin, admin | Bulk delete/archive |
| PATCH | /universities/bulk-update | superadmin, admin, moderator | Bulk update category/cluster/active |
| PUT | /universities/reorder-featured | superadmin, admin, moderator | Reorder featured universities |

**Bulk Delete Request:**
```json
{
  "ids": ["id1", "id2"],
  "mode": "soft"  // or "hard"
}
```

**Bulk Update Request:**
```json
{
  "ids": ["id1", "id2"],
  "updates": {
    "category": "Medical College",
    "isActive": true
  }
}
```

### Import Pipeline

| Method | Path | Auth Roles | Description |
|---|---|---|---|
| GET | /universities/import/template | superadmin, admin, moderator, editor | Download import template (CSV/XLSX) |
| POST | /universities/import/init | superadmin, admin | Upload file, create import job |
| POST | /universities/import/:jobId/validate | superadmin, admin, moderator | Validate & map columns |
| POST | /universities/import/:jobId/commit | superadmin, admin | Commit import (create-only or update-existing) |
| GET | /universities/import/:jobId | superadmin, admin, moderator, editor | Get import job status |
| GET | /universities/import/:jobId/errors.csv | superadmin, admin, moderator | Download error rows |

**Init Request:** `multipart/form-data` with `file` field (CSV/XLSX)

**Init Response:**
```json
{
  "jobId": "abc123",
  "headers": ["name", "shortForm", "category"],
  "sampleRows": [["Dhaka University", "DU", "Individual Admission"]],
  "targetFields": ["category", "name", "shortForm", "..."]
}
```

**Validate Request:**
```json
{
  "mapping": {
    "name": "University Name",
    "category": "Category"
  },
  "defaults": {
    "category": "Individual Admission"
  }
}
```

**Validate Response:**
```json
{
  "validationSummary": {
    "totalRows": 50,
    "validRows": 48,
    "invalidRows": 2
  }
}
```

**Commit Response:**
```json
{
  "commitSummary": {
    "inserted": 45,
    "updated": 3,
    "failed": 2
  }
}
```

### Export

| Method | Path | Auth Roles | Description |
|---|---|---|---|
| GET | /universities/export?type=csv&category=... | superadmin, admin, moderator, editor | Export universities |

**Query Parameters:**
- `type`: `csv` or `xlsx`
- `category`, `status`, `clusterGroup`, `q`: filter params
- `selectedIds`: comma-separated IDs for selective export
- `sortBy`, `sortOrder`: sorting

### Categories (Admin Master)

| Method | Path | Auth Roles | Description |
|---|---|---|---|
| GET | /university-categories | superadmin, admin, moderator, editor | List category masters |
| POST | /university-categories | superadmin, admin, moderator | Create category |
| PUT | /university-categories/:id | superadmin, admin, moderator | Update category |
| DELETE | /university-categories/:id | superadmin, admin | Delete category |
| PATCH | /university-categories/:id/toggle | superadmin, admin | Toggle active |

### Settings

| Method | Path | Auth Roles | Description |
|---|---|---|---|
| GET | /settings/university | superadmin, admin, moderator, editor | Get university settings |
| PUT | /settings/university | superadmin, admin | Update university settings |

**Settings Object:**
```json
{
  "categoryOrder": ["Individual Admission", "Science & Technology", "..."],
  "highlightedCategories": ["Individual Admission"],
  "defaultCategory": "Individual Admission",
  "featuredUniversitySlugs": ["dhaka-university", "buet"],
  "maxFeaturedItems": 12,
  "enableClusterFilterOnHome": true,
  "enableClusterFilterOnUniversities": true,
  "defaultUniversityLogoUrl": "https://...",
  "allowCustomCategories": false
}
```

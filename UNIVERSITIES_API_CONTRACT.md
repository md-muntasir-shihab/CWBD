# UNIVERSITIES — API CONTRACT

**Version:** 1.0  
**Base URL:** `/api`  
**Auth:** Public endpoints require no auth. Admin endpoints require `Authorization: Bearer <token>`.

---

## Public Endpoints

### 1. `GET /api/university-categories`

Returns all active university categories with counts and cluster groups.

**Request**  
No parameters required.

**Response `200 OK`**
```json
{
  "categories": [
    {
      "categoryName": "Individual Admission",
      "order": 1,
      "count": 42,
      "clusterGroups": []
    },
    {
      "categoryName": "AGRI Cluster",
      "order": 6,
      "count": 15,
      "clusterGroups": ["Cluster A", "Cluster B", "Cluster C"]
    }
  ],
  "items": "<same as categories>"
}
```

**Category Order (canonical)**
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

**Notes**
- Only universities with `isActive: true` and `isArchived: false` are counted.
- `clusterGroups` is an empty array if the category has no cluster groups.
- Extra categories beyond the canonical list are appended sorted alphabetically.

---

### 2. `GET /api/universities`

Returns a paginated list of universities for a specific category.

**Query Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `category` | string | ✅ YES | Category name (e.g., `Individual Admission`) |
| `clusterGroup` | string | No | Filter by cluster group name |
| `q` | string | No | Search by name, shortForm, address, description |
| `sort` | string | No | `name_asc`, `name_desc`, `closing_soon`, `exam_soon`, `alphabetical`, `deadline` |
| `page` | number | No | Page number (default: 1) |
| `limit` | number | No | Items per page (default: 24, max: 500) |
| `featured` | boolean | No | Return only featured universities |

**Response `200 OK`**
```json
{
  "universities": [...],
  "items": [...],
  "pagination": {
    "total": 42,
    "page": 1,
    "limit": 24,
    "pages": 2
  }
}
```

**University Card Shape**
```json
{
  "_id": "64abc123...",
  "name": "Dhaka University",
  "shortForm": "DU",
  "slug": "dhaka-university",
  "category": "Individual Admission",
  "clusterGroup": "",
  "address": "Dhaka, Bangladesh",
  "contactNumber": "01700000000",
  "email": "info@du.ac.bd",
  "website": "https://du.ac.bd",
  "websiteUrl": "https://du.ac.bd",
  "admissionWebsite": "https://admission.du.ac.bd",
  "admissionUrl": "https://admission.du.ac.bd",
  "logoUrl": "https://cdn.example.com/du-logo.png",
  "totalSeats": "7000",
  "scienceSeats": "3000",
  "seatsScienceEng": "3000",
  "artsSeats": "2500",
  "seatsArtsHum": "2500",
  "businessSeats": "1500",
  "seatsBusiness": "1500",
  "applicationStartDate": "2024-01-01T00:00:00.000Z",
  "applicationStart": "2024-01-01T00:00:00.000Z",
  "applicationEndDate": "2024-02-28T00:00:00.000Z",
  "applicationEnd": "2024-02-28T00:00:00.000Z",
  "scienceExamDate": "2024-03-15T00:00:00.000Z",
  "examDateScience": "2024-03-15T00:00:00.000Z",
  "artsExamDate": "2024-03-22T00:00:00.000Z",
  "examDateArts": "2024-03-22T00:00:00.000Z",
  "businessExamDate": "2024-03-29T00:00:00.000Z",
  "examDateBusiness": "2024-03-29T00:00:00.000Z",
  "established": 1921,
  "establishedYear": 1921,
  "isActive": true
}
```

**Error `400 CATEGORY_REQUIRED`**
```json
{
  "message": "Category is required for this endpoint.",
  "code": "CATEGORY_REQUIRED",
  "defaultCategory": "Individual Admission"
}
```

**Notes**
- `category` parameter is **mandatory**. Omitting it returns `400`.
- Only `isActive: true` and `isArchived: false` records are returned.
- Date fields have both canonical (e.g. `applicationStartDate`) and legacy (e.g. `applicationStart`) aliases for compatibility.

---

### 3. `GET /api/universities/:slug`

Returns a single university by its URL slug.

**Path Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `slug` | string | ✅ YES | URL slug of the university |

**Response `200 OK`**
```json
{
  "university": {
    "_id": "64abc123...",
    "name": "Dhaka University",
    "slug": "dhaka-university",
    "category": "Individual Admission",
    "shortForm": "DU",
    "address": "Dhaka, Bangladesh",
    "contactNumber": "01700000000",
    "email": "info@du.ac.bd",
    "website": "https://du.ac.bd",
    "admissionWebsite": "https://admission.du.ac.bd",
    "logoUrl": "https://cdn.example.com/du-logo.png",
    "description": "University of Dhaka is...",
    "shortDescription": "Premier university of Bangladesh.",
    "totalSeats": "7000",
    "scienceSeats": "3000",
    "artsSeats": "2500",
    "businessSeats": "1500",
    "applicationStartDate": "2024-01-01T00:00:00.000Z",
    "applicationEndDate": "2024-02-28T00:00:00.000Z",
    "scienceExamDate": "2024-03-15T00:00:00.000Z",
    "artsExamDate": "2024-03-22T00:00:00.000Z",
    "businessExamDate": "2024-03-29T00:00:00.000Z",
    "examCenters": ["Dhaka", "Chittagong", "Sylhet"],
    "examCenterNotes": "Bring admission card and photo ID.",
    "socialLinks": {
      "facebook": "https://facebook.com/unipage",
      "youtube": "",
      "telegram": ""
    },
    "established": 1921,
    "isActive": true
  }
}
```

**Response `404 Not Found`**
```json
{
  "message": "University not found"
}
```

---

## Admin Endpoints

All admin endpoints require `Authorization: Bearer <admin-token>` header.

### 4. `GET /api/${adminPath}/universities`

List universities for admin (all statuses).

**Query Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `category` | string | Filter by category |
| `status` | string | `active`, `inactive`, `archived`, `all` |
| `q` | string | Search |
| `sort` | string | Sort key |
| `page` | number | Page (default: 1) |
| `limit` | number | Items per page (default: 25) |
| `selectedIds` | string | Comma-separated IDs for export |

**Response `200 OK`**
```json
{
  "universities": [...],
  "pagination": { "total": 100, "page": 1, "limit": 25, "pages": 4 }
}
```

---

### 5. `POST /api/${adminPath}/universities`

Create a new university.

**Body:** University object (partial). `name` is required.

**Response `201 Created`**
```json
{
  "university": { ... },
  "message": "University created successfully"
}
```

---

### 6. `PUT /api/${adminPath}/universities/:id`

Update an existing university.

**Response `200 OK`**
```json
{
  "university": { ... },
  "message": "University updated successfully"
}
```

---

### 7. `DELETE /api/${adminPath}/universities/:id`

Delete a university (soft delete / archive).

**Response `200 OK`**
```json
{ "message": "University deleted successfully" }
```

---

### 8. `PATCH /api/${adminPath}/universities/:id/toggle`

Toggle `isActive` status.

**Response `200 OK`**
```json
{ "university": { ... }, "message": "Status updated" }
```

---

### 9. `POST /api/${adminPath}/universities/bulk-delete`

Delete multiple universities.

**Body**
```json
{ "ids": ["64abc...", "64def..."] }
```

---

### 10. `PUT /api/${adminPath}/universities/bulk-update`

Update fields on multiple universities at once.

**Body**
```json
{
  "ids": ["64abc..."],
  "data": { "category": "Medical College", "isActive": true }
}
```

---

### 11. Import Workflow

#### Step 1 — Initialize
`POST /api/${adminPath}/universities/import`  
Body: `multipart/form-data` with file (CSV or XLSX) + `mapping` JSON string.

**Response `200 OK`**
```json
{ "jobId": "job-abc123", "totalRows": 150, "status": "pending" }
```

#### Step 2 — Validate
`POST /api/${adminPath}/universities/import/:jobId/validate`

**Response `200 OK`**
```json
{
  "jobId": "job-abc123",
  "validRows": 148,
  "errorRows": 2,
  "preview": [...]
}
```

#### Step 3 — Commit
`POST /api/${adminPath}/universities/import/:jobId/commit`

**Response `200 OK`**
```json
{
  "inserted": 100,
  "updated": 48,
  "errors": 2,
  "jobId": "job-abc123"
}
```

#### Download Errors
`GET /api/${adminPath}/universities/import/:jobId/errors.csv`  
Returns CSV of rows with errors.

---

### 12. `GET /api/${adminPath}/universities/export`

Export universities as CSV or XLSX.

**Query Parameters**

| Parameter | Description |
|-----------|-------------|
| `format` | `csv` or `xlsx` (default: `xlsx`) |
| `category` | Filter by category |
| `selectedIds` | Comma-separated IDs |

**Response:** File download.

---

### 13. `GET /api/${adminPath}/universities/template.xlsx`

Download the import template with all required columns.

---

### 14. `GET /api/${adminPath}/settings/university`

Get university-related settings.

**Response `200 OK`**
```json
{
  "settings": {
    "defaultCategory": "Individual Admission",
    "categoryOrder": ["Individual Admission", "Science & Technology", "..."],
    "highlightedCategories": ["Medical College"],
    "showAllCategories": false,
    "featuredSlugs": ["dhaka-university", "buet"],
    "defaultLogoUrl": "https://cdn.example.com/default-logo.png"
  }
}
```

---

### 15. `PUT /api/${adminPath}/settings/university`

Update university settings.

**Body:** Partial `UniversitySettings` object.

---

## Field Aliases

The API uses both canonical field names and legacy aliases for compatibility:

| Canonical | Legacy Alias |
|-----------|-------------|
| `applicationStartDate` | `applicationStart` |
| `applicationEndDate` | `applicationEnd` |
| `scienceExamDate` | `examDateScience` |
| `artsExamDate` | `examDateArts` |
| `businessExamDate` | `examDateBusiness` |
| `website` | `websiteUrl` |
| `admissionWebsite` | `admissionUrl` |
| `established` | `establishedYear` |
| `scienceSeats` | `seatsScienceEng` |
| `artsSeats` | `seatsArtsHum` |
| `businessSeats` | `seatsBusiness` |

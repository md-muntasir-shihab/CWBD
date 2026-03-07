# NEWS API CONTRACT

**Version:** 1.0
**Base URL:** `/api`

---

## Public Endpoints

### 1. GET /api/news

Returns a paginated list of published news articles.

**Auth:** None

**Query Parameters:**
| Param | Type | Required | Default | Description |
|---|---|---|---|---|
| page | number | No | 1 | Page number |
| limit | number | No | 12 | Items per page (max 100) |
| source | string | No | — | Filter by sourceId or sourceName |
| category | string | No | — | Filter by category |
| tag | string | No | — | Filter by tag |
| q | string | No | — | Search title/summary |

**Response 200:**
```json
{
  "items": [
    {
      "_id": "64a1b2c3...",
      "title": "Dhaka University Admission 2025 Started",
      "slug": "dhaka-university-admission-2025-started-a1b2c3d4",
      "shortSummary": "DU admission circular published today.",
      "shortDescription": "DU admission circular published today.",
      "category": "admission",
      "tags": ["admission", "dhaka"],
      "publishDate": "2025-09-01T10:00:00.000Z",
      "publishedAt": "2025-09-01T10:00:00.000Z",
      "sourceName": "Daily Star",
      "sourceUrl": "https://dailystar.net",
      "sourceIconUrl": "https://dailystar.net/icon.png",
      "originalArticleUrl": "https://dailystar.net/article/123",
      "coverImageUrl": "https://images.example.com/du-admission.jpg",
      "coverImageSource": "rss",
      "coverSource": "rss",
      "fallbackBanner": "/default-news-banner.jpg",
      "aiUsed": false,
      "shareUrl": "https://campusway.com/news/dhaka-university-admission-2025-started-a1b2c3d4",
      "shareText": {
        "whatsapp": "Dhaka University Admission 2025 Started\nhttps://campusway.com/news/...",
        "facebook": "Dhaka University Admission 2025 Started | Daily Star\nhttps://...",
        "messenger": "Dhaka University Admission 2025 Started\nhttps://...",
        "telegram": "Dhaka University Admission 2025 Started\nhttps://..."
      },
      "shareLinks": {
        "whatsapp": "https://wa.me/?text=...",
        "facebook": "https://www.facebook.com/sharer/sharer.php?u=...",
        "messenger": "https://www.facebook.com/dialog/send?link=...",
        "telegram": "https://t.me/share/url?url=..."
      }
    }
  ],
  "total": 142,
  "page": 1,
  "pages": 12,
  "filters": {
    "source": "",
    "category": "",
    "tag": "",
    "q": ""
  }
}
```

---

### 2. GET /api/news/:slug

Returns a single news article by slug (or ObjectId).

**Auth:** None

**Response 200:**
```json
{
  "item": {
    "_id": "64a1b2c3...",
    "title": "Dhaka University Admission 2025 Started",
    "slug": "dhaka-university-admission-2025-started-a1b2c3d4",
    "shortSummary": "Summary text",
    "fullContent": "<p>Full sanitized HTML content...</p>",
    "content": "<p>Legacy content field</p>",
    "category": "admission",
    "tags": ["admission", "dhaka"],
    "sourceName": "Daily Star",
    "sourceUrl": "https://dailystar.net",
    "sourceIconUrl": "https://dailystar.net/icon.png",
    "originalArticleUrl": "https://dailystar.net/article/123",
    "coverImageUrl": "https://images.example.com/du-admission.jpg",
    "coverImageSource": "rss",
    "fetchedFullText": true,
    "aiUsed": false,
    "aiMeta": null,
    "publishDate": "2025-09-01T10:00:00.000Z",
    "publishedAt": "2025-09-01T10:00:00.000Z",
    "shareUrl": "https://campusway.com/news/...",
    "shareText": { /* per-platform share text */ },
    "shareLinks": { /* per-platform share URLs */ },
    "seoTitle": "Dhaka University Admission 2025",
    "seoDescription": "Summary text"
  },
  "related": [
    { "_id": "...", "title": "...", "slug": "...", "coverImageUrl": "...", "publishedAt": "..." }
  ]
}
```

**Response 404:**
```json
{
  "message": "News article not found"
}
```

---

### 3. GET /api/news/sources

Returns list of enabled RSS sources with article counts.

**Auth:** None

**Response 200:**
```json
{
  "items": [
    {
      "_id": "64a1b2c3...",
      "name": "Daily Star",
      "siteUrl": "https://dailystar.net",
      "iconUrl": "https://dailystar.net/icon.png",
      "count": 42
    }
  ]
}
```

---

### 4. GET /api/news/settings

Returns public subset of news settings (API keys stripped).

**Auth:** None

**Response 200:**
```json
{
  "pageTitle": "CampusWay News Hub",
  "pageSubtitle": "Live updates from verified RSS feeds.",
  "headerBannerUrl": "https://...",
  "defaultBannerUrl": "https://...",
  "defaultThumbUrl": "https://...",
  "defaultSourceIconUrl": "https://...",
  "appearance": {
    "layoutMode": "rss_reader",
    "density": "comfortable",
    "cardDensity": "comfortable",
    "paginationMode": "pages",
    "showWidgets": {
      "trending": true,
      "latest": true,
      "sourceSidebar": true,
      "tagChips": true,
      "previewPanel": true,
      "breakingTicker": false
    },
    "showSourceIcons": true,
    "showTrendingWidget": true,
    "showCategoryWidget": true,
    "showShareButtons": true,
    "animationLevel": "normal",
    "thumbnailFallbackUrl": ""
  },
  "shareTemplates": {
    "whatsapp": "{title}\n{summary}\n{public_url}",
    "facebook": "{title} | {source_name}\n{public_url}",
    "messenger": "{title}\n{summary}\n{public_url}",
    "telegram": "{title}\n{summary}\n{public_url}"
  },
  "shareButtons": {
    "whatsapp": true,
    "facebook": true,
    "messenger": true,
    "telegram": true,
    "copyLink": true,
    "copyText": true
  },
  "workflow": {
    "allowScheduling": true,
    "openOriginalWhenExtractionIncomplete": true
  }
}
```

---

## Admin Endpoints

All admin endpoints require JWT authentication and appropriate role.

**Base path:** `/api/__cw_admin__/`

### News CRUD

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | /news/dashboard | superadmin, admin, moderator, editor | Dashboard stats (counts by status) |
| GET | /news | superadmin, admin, moderator, editor | List items with status/source/ai/search filters |
| GET | /news/:id | superadmin, admin, moderator, editor | Get single item by ID |
| POST | /news | superadmin, admin, moderator, editor | Create new item manually |
| PUT | /news/:id | superadmin, admin, moderator, editor | Update item |
| DELETE | /news/:id | superadmin, admin, moderator | Delete item (2-person approval required) |

**List Query Parameters:**
| Param | Type | Description |
|---|---|---|
| status | string | Filter by status |
| q | string | Search title/summary |
| sourceId | string | Filter by source ID |
| aiOnly | boolean | Only AI-generated items |
| aiSelected | boolean | Only AI-selected items |
| duplicateFlagged | boolean | Only duplicates |
| limit | number | Items per page |
| page | number | Page number |

### Workflow Actions

| Method | Path | Roles | Description |
|---|---|---|---|
| POST | /news/:id/approve | superadmin, admin, moderator | Approve (set status to approved) |
| POST | /news/:id/approve-publish | superadmin, admin, moderator | Approve and immediately publish |
| POST | /news/:id/reject | superadmin, admin, moderator | Reject |
| POST | /news/:id/publish-now | superadmin, admin, moderator | Publish immediately |
| POST | /news/:id/schedule | superadmin, admin, moderator, editor | Schedule publish |
| POST | /news/:id/move-to-draft | superadmin, admin, moderator, editor | Move to draft |
| POST | /news/:id/publish-anyway | superadmin, admin, moderator | Publish despite duplicate flag |
| POST | /news/:id/merge | superadmin, admin, moderator, editor | Merge duplicate into target |
| POST | /news/:id/submit-review | superadmin, admin, moderator, editor | Submit draft for review |
| POST | /news/:id/ai-check | superadmin, admin, moderator, editor | Run AI check on item |

**Schedule Request:**
```json
{
  "scheduledAt": "2025-10-01T10:00:00.000Z"
}
```

**Merge Request:**
```json
{
  "targetId": "64a1b2c3..."
}
```

### Bulk Operations

| Method | Path | Roles | Description |
|---|---|---|---|
| POST | /news-v2/items/bulk-approve | superadmin, admin, moderator | Bulk approve items |
| POST | /news-v2/items/bulk-reject | superadmin, admin, moderator | Bulk reject items |

**Request:**
```json
{
  "ids": ["id1", "id2", "id3"]
}
```

### RSS Sources

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | /news/sources | superadmin, admin, moderator, editor | List all RSS sources |
| POST | /news/sources | superadmin, admin, moderator | Create source |
| PUT | /news/sources/:id | superadmin, admin, moderator | Update source |
| DELETE | /news/sources/:id | superadmin, admin | Delete source |
| POST | /news/sources/:id/test | superadmin, admin, moderator, editor | Test RSS feed URL |
| POST | /news/fetch-now | superadmin, admin, moderator, editor | Manual RSS fetch trigger |

**Create/Update Source Request:**
```json
{
  "name": "Daily Star Education",
  "rssUrl": "https://dailystar.net/education/rss.xml",
  "siteUrl": "https://dailystar.net",
  "iconUrl": "https://dailystar.net/icon.png",
  "enabled": true,
  "fetchIntervalMinutes": 30,
  "priority": 1,
  "categoryTags": ["education", "admission"]
}
```

### Settings

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | /news-settings | superadmin, admin, moderator, editor | Get all news settings |
| PUT | /news-settings | superadmin, admin, moderator | Update all news settings |
| GET | /news-v2/settings/appearance | superadmin, admin, moderator, editor | Get appearance settings |
| PUT | /news-v2/settings/appearance | superadmin, admin, moderator | Update appearance |
| GET | /news-v2/settings/ai | superadmin, admin, moderator, editor | Get AI settings |
| PUT | /news-v2/settings/ai | superadmin, admin, moderator | Update AI settings |
| GET | /news-v2/settings/share | superadmin, admin, moderator, editor | Get share settings |
| PUT | /news-v2/settings/share | superadmin, admin, moderator | Update share settings |

### Media

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | /news-v2/media | superadmin, admin, moderator, editor | List uploaded media |
| POST | /news/media/upload | superadmin, admin, moderator, editor | Upload media file |
| POST | /news-v2/media/from-url | superadmin, admin, moderator, editor | Create media from URL |
| DELETE | /news-v2/media/:id | superadmin, admin, moderator | Delete media |

### Export

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | /news/export | superadmin, admin, moderator, editor | Export news items (CSV/XLSX) |
| GET | /news-v2/exports/sources | superadmin, admin, moderator, editor | Export RSS sources |
| GET | /news-v2/exports/logs | superadmin, admin, moderator, editor | Export audit logs |

**Export Query Parameters:**
- `type`: `csv` or `xlsx`
- `status`, `category`, `sourceId`, `q`: filter params
- `selectedIds`: comma-separated for selective export

### Audit Logs

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | /news-v2/audit-logs | superadmin, admin, moderator, editor | List audit events |

**Query Parameters:**
- `page`, `limit`: pagination
- `action`: filter by action type
- `entityType`: news, source, settings, media, export, workflow

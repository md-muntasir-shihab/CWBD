# NEWS ADMIN GUIDE

## Overview

The News module provides a full RSS news aggregation and publishing system. Content is fetched from configured RSS sources, processed (with optional AI drafting), reviewed by admins, and published to the public news page. All settings — appearance, defaults, share templates, AI workflow — are configurable from the admin panel.

---

## 1. Access

Navigate to: `/__cw_admin__/news/dashboard`

**Required Roles:**
- **superadmin / admin:** Full access (CRUD, delete, publish, settings, sources)
- **moderator:** Create, edit, approve, reject, schedule, media upload
- **editor:** View, create drafts, edit, schedule, media upload

---

## 2. Dashboard

The dashboard at `/__cw_admin__/news/dashboard` shows:
- Article counts by status (pending, draft, published, scheduled, rejected, duplicate)
- Recent activity
- Quick action buttons

---

## 3. Article Management

### 3.1 Article Status Workflow

```
RSS Fetch → pending_review ──→ approved ──→ published
                   │                            ↑
                   ├──→ rejected                │
                   ├──→ duplicate_review         │
                   ├──→ draft ──→ submit_review ─┘
                   │
                   └──→ scheduled ──→ (auto-publish at scheduled time)
```

### 3.2 Viewing Articles by Status

Navigate via the sidebar menu:
- **Pending Review** (`/__cw_admin__/news/pending`) — Articles awaiting approval
- **Duplicate Queue** (`/__cw_admin__/news/duplicates`) — Flagged duplicates for review
- **Drafts** (`/__cw_admin__/news/drafts`) — Work-in-progress articles
- **Published** (`/__cw_admin__/news/published`) — Live articles
- **Scheduled** (`/__cw_admin__/news/scheduled`) — Articles scheduled for future publish
- **Rejected** (`/__cw_admin__/news/rejected`) — Rejected articles (can be re-approved)
- **AI Selected** (`/__cw_admin__/news/ai-selected`) — AI-flagged notable articles

### 3.3 Reviewing and Approving an Article

1. Go to Pending Review
2. Click an article to open the editor
3. Review title, summary, content, source
4. Actions available:
   - **Approve & Publish** — Immediately publishes the article
   - **Approve** — Marks as approved (can publish later)
   - **Reject** — Rejects with optional reason
   - **Move to Draft** — For further editing
   - **Schedule** — Set a future publish date
   - **AI Check** — Run AI quality check

### 3.4 Creating an Article Manually

1. Click "Create New" button
2. Fill in: Title, Summary, Content (rich text editor), Category, Tags
3. Set cover image (upload or URL)
4. Set source info (name, URL)
5. Choose: Save as Draft or Submit for Review

### 3.5 Handling Duplicates

When RSS fetches a duplicate article:
1. It appears in the **Duplicate Queue** (status `duplicate_review`)
2. Admin sees which article it duplicates and why (URL match, title similarity, GUID match)
3. Options:
   - **Publish Anyway** — If it's not actually a duplicate
   - **Merge** — Merge content into the existing article
   - **Reject** — Discard the duplicate
   - **Ignore** — Leave in queue for later

### 3.6 Bulk Operations

Select multiple articles using checkboxes:
- **Bulk Approve** — Approve all selected
- **Bulk Reject** — Reject all selected

---

## 4. RSS Sources

Navigate to: `/__cw_admin__/news/sources`

### 4.1 Adding an RSS Source

1. Click **"Add Source"**
2. Fill in:
   - **Name** — Display name (e.g., "Daily Star Education")
   - **RSS URL** — Full RSS/Atom feed URL
   - **Site URL** — Publication website URL
   - **Icon URL** — Source icon/logo URL
   - **Category Tags** — Default tags applied to fetched articles
   - **Fetch Interval** — Minutes between fetches (default: 30)
   - **Priority** — Lower number = fetched first
   - **Enabled** — Toggle on/off

3. Click **Test** to verify the feed URL works
4. Click **Save**

### 4.2 Manual Fetch

Click **"Fetch Now"** to trigger an immediate RSS ingestion across all enabled sources. Results:
- New articles created as `pending_review`
- Duplicates routed to `duplicate_review`
- Failed items logged

### 4.3 Per-Source Interval

Each source has its own `fetchIntervalMinutes`. The cron job (`runDueSourceIngestion`) checks which sources are due and only fetches those.

---

## 5. News Settings

Navigate to: `/__cw_admin__/settings/news-settings`

### 5.1 Branding & Defaults

| Setting | Description |
|---|---|
| **Page Title** | Main heading on public news page |
| **Page Subtitle** | Subtitle text below heading |
| **Header Banner URL** | Large banner at top of news page |
| **Default Banner URL** | Fallback image when article has no cover image |
| **Default Thumbnail URL** | Fallback thumbnail for card views |
| **Default Source Icon URL** | Fallback icon when source has no icon |

**Important:** When you change the Default Banner, ALL published articles that have `coverSource="default"` will automatically show the new banner. No per-article update needed.

### 5.2 Appearance Settings

| Setting | Options | Description |
|---|---|---|
| Layout Mode | `rss_reader`, `grid`, `list` | Public page layout |
| Density | `compact`, `comfortable` | Card spacing |
| Pagination | `pages`, `infinite` | Scroll behavior |
| Show Source Sidebar | on/off | Left sidebar on desktop |
| Show Tag Chips | on/off | Tag filter chips |
| Show Preview Panel | on/off | Right preview panel |
| Show Trending Widget | on/off | Trending section |
| Breaking Ticker | on/off | Breaking news ticker |
| Animation Level | `off`, `minimal`, `normal` | Page animations |

### 5.3 Share Templates

Configure the text template used for each share platform. Available variables:
- `{title}` — Article title
- `{summary}` — Short summary
- `{public_url}` — Full public URL
- `{source_name}` — Source name

**Example:**
```
WhatsApp: {title}\n{summary}\n{public_url}
Facebook: {title} | {source_name}\n{public_url}
```

Enable/disable individual share buttons:
- WhatsApp, Facebook, Messenger, Telegram, Copy Link, Copy Text

### 5.4 AI Draft Settings

| Setting | Description |
|---|---|
| **Enabled** | Toggle AI drafting on/off |
| **Language** | `en`, `bn`, `mixed` |
| **Style Preset** | `short`, `standard`, `detailed` |
| **Strict No-Hallucination** | Require source citations in AI output |
| **Duplicate Sensitivity** | `strict`, `medium`, `loose` |
| **Max Length** | Maximum AI output length |
| **Custom Prompt** | Override the default AI prompt |
| **API Provider URL** | AI API endpoint |
| **API Key** | API authentication key |

When AI is **enabled**:
- RSS items get AI-drafted title/summary/content server-side
- Admin reviews AI output before publishing
- AI metadata (`aiUsed`, `aiMeta`) stored per article

When AI is **disabled**:
- RSS items stored with raw content
- Admin can manually edit before publishing

### 5.5 Workflow Settings

| Setting | Default | Description |
|---|---|---|
| Default Incoming Status | `pending_review` | Status for new RSS items |
| Auto Draft from RSS | true | Auto-create drafts from RSS |
| Allow Scheduling | true | Enable schedule-publish feature |
| Open Original on Incomplete | true | Show link to original when full text extraction fails |
| Auto Expire Days | null | Auto-archive after N days (null = never) |

### 5.6 Full Article Fetch

| Setting | Options | Description |
|---|---|---|
| Enabled | on/off | Attempt to fetch full article content |
| Fetch Mode | `rss_content`, `readability_scrape`, `both` | How to get full text |

- **rss_content** — Use `content:encoded` from RSS
- **readability_scrape** — Fetch original URL and extract with Mozilla Readability
- **both** — Try RSS content first, fall back to scraping

---

## 6. Media Library

Navigate to: `/__cw_admin__/news/media`

- Upload images for article covers and banners
- Browse previously uploaded media
- Copy media URL for use in articles
- Delete unused media

---

## 7. Exports

Navigate to: `/__cw_admin__/news/exports`

Export formats: **CSV** or **XLSX**

Available exports:
- **News Articles** — All articles with optional status/source/search filters
- **RSS Sources** — All configured sources
- **Audit Logs** — Activity history

---

## 8. Audit Logs

Navigate to: `/__cw_admin__/news/audit-logs`

Every admin action is logged with:
- Who (admin user)
- What action (create, update, approve, reject, delete, settings change)
- Entity type (news, source, settings, media)
- Before/after state
- IP address and user agent
- Timestamp

Filter by action type, entity type, date range.

---

## 9. Troubleshooting

| Issue | Solution |
|---|---|
| RSS feed not fetching | Check source is enabled, RSS URL is valid. Use "Test" button. Check `lastError` on source. |
| Articles stuck in pending | Admin must approve. Check workflow settings for `defaultIncomingStatus`. |
| Duplicates appearing | Expected behavior — duplicates go to Duplicate Queue. Adjust `duplicateSensitivity` in AI settings. |
| AI drafts not generating | Check AI is enabled, API key is set, API provider URL is correct. |
| Images not showing | Verify `coverImageUrl` is a valid URL. Check `defaultBannerUrl` is set in settings. |
| Share text incorrect | Check share templates in settings. Variables: `{title}`, `{summary}`, `{public_url}`, `{source_name}`. |
| Public page layout wrong | Check appearance settings: `layoutMode`, widget toggles, pagination mode. |
| Old articles showing wrong banner | Check `coverSource` field. If it's `"default"`, it uses the current admin default banner. Update `defaultBannerUrl` in settings. |

# UNIVERSITIES — ADMIN GUIDE

**Platform:** CampusWay  
**Admin Panel Path:** `/__cw_admin__/universities`  
**Required Role:** Admin or Chairman

---

## 1. Accessing the Universities Admin Panel

Navigate to: `/__cw_admin__/universities`

The panel shows a searchable, filterable table of all universities (including inactive/archived ones). From here you can:

- Search universities by name, short form, category, or address
- Filter by category, status (Active / Inactive / Archived)
- Select one or more universities for bulk operations
- Sort by any column

---

## 2. Creating a University

### Via the Form

1. Go to `/__cw_admin__/universities` (or `/__cw_admin__/universities/new`)
2. Click **"+ New University"**
3. Fill in the required fields:

| Field | Required | Notes |
|-------|----------|-------|
| Name | ✅ | Full official name |
| Short Form | No | e.g. `DU`, `BUET` |
| Category | ✅ | Must be one of the 12 canonical categories |
| Cluster Group | No | Required for cluster-based categories (AGRI, etc.) |
| Address | No | Full address |
| Contact Number | No | Primary phone |
| Email | No | Official email |
| Website URL | No | Official website; must include `https://` |
| Admission URL | No | Admission portal URL |
| Logo | No | Upload image; appears in cards |
| Established Year | No | 4-digit year |
| Total Seats | No | Number string |
| Science Seats | No | Number string |
| Arts Seats | No | Number string |
| Business Seats | No | Number string |
| Application Start | No | ISO date/datetime |
| Application End | No | ISO date/datetime |
| Science Exam Date | No | ISO date/datetime |
| Arts Exam Date | No | ISO date/datetime |
| Business Exam Date | No | ISO date/datetime |
| Exam Centers | No | Comma-separated list |
| Short Description | No | 1–2 sentences for overview |
| Description | No | Full rich-text description |
| Is Active | — | Default: ON (shows on public site) |

4. Click **Save**

The slug is auto-generated from the university name. If a slug conflict occurs, a timestamp suffix is appended automatically.

### Via Bulk Import

See Section 5 (Import Wizard).

---

## 3. Editing a University

1. In the university list, click the **Edit** (pencil) icon on any row, or navigate to `/__cw_admin__/universities/:id/edit`
2. Modify the fields as needed
3. Click **Save**

After saving, the public `/universities` page updates immediately (React Query cache invalidation via SSE broadcast).

---

## 4. Deleting / Disabling a University

### Disable (Recommended)

Disabling hides a university from the public site without permanent deletion:

1. Click the **Toggle** button on the university row
2. Or click **Edit** → uncheck **Is Active** → **Save**

### Delete

1. Click the **Delete** (trash) icon on the university row
2. Confirm the deletion prompt

Deletion is a soft delete (sets `isArchived: true`). The record is hidden from all public endpoints but remains in the database for audit purposes.

### Bulk Disable / Delete

1. Select universities using the checkboxes on the left
2. Use the **Bulk Actions** dropdown:
   - **Activate Selected** — set `isActive: true`
   - **Deactivate Selected** — set `isActive: false`
   - **Delete Selected** — soft-delete all selected

---

## 5. Import Wizard

The import wizard lets you upload hundreds of universities at once from a spreadsheet.

### Prepare Your File

Download the template:  
`GET /api/${adminPath}/universities/template.xlsx`

Or navigate to `/__cw_admin__/universities/import` and click **Download Template**.

The template includes all supported columns. You may leave optional columns blank.

### Upload & Map Columns

1. Go to `/__cw_admin__/universities/import`
2. Click **Choose File** and select your `.xlsx` or `.csv` file
3. The wizard reads the first row as column headers
4. In the **Column Mapping** step, map each spreadsheet column to the CampusWay field:
   - Drag-and-drop or use the dropdowns
   - Required fields are highlighted in red if unmapped
5. Click **Validate**

### Validation Results

After validation you see:
- ✅ **Valid rows** — will be imported
- ❌ **Error rows** — display the specific error (missing name, invalid date, etc.)

You can:
- **Download errors** as a CSV to fix and re-import
- **Proceed** with only the valid rows

### Commit Import

Click **Commit Import** to save all valid rows to the database.  
The import performs an **upsert** based on university name:
- If a university with the same name already exists → it is **updated**
- If no match → a new record is **inserted**

After committing, the import job status is shown (`inserted`, `updated`, `errors`).

---

## 6. Export

### Export All (Filtered)

1. Apply any filters you want (category, status, search)
2. Click **Export** → choose **CSV** or **XLSX**
3. The file downloads with all currently visible results

### Export Selected

1. Select specific universities using checkboxes
2. Click **Export Selected** → choose format

### Via API

```
GET /api/${adminPath}/universities/export?format=xlsx&category=Medical+College
GET /api/${adminPath}/universities/export?format=csv&selectedIds=id1,id2,id3
```

---

## 7. Category Management

Categories control how universities are grouped on the public `/universities` page.

### View & Order Categories

Go to `/__cw_admin__/settings/university-settings` to manage:

- **Category Order** — drag and drop to reorder (affects the tab order on the public page)
- **Default Category** — which category is shown first when a user visits `/universities`
- **Highlighted Categories** — shown with a special badge on the public page

### Category Master

Categories are also managed under `/__cw_admin__/university-categories`:
- Create new categories (beyond the canonical 12)
- Rename existing categories
- Toggle category visibility

**Important:** The 12 canonical categories are hardcoded in priority order. Custom categories appear after them.

---

## 8. Cluster Group Management

Cluster groups are sub-groupings within a category (e.g., the AGRI Cluster has multiple sub-clusters).

Each university can have one `clusterGroup` value. The public page shows cluster filter chips automatically when a category has universities with different cluster groups.

To manage clusters:
1. Go to `/__cw_admin__/university-clusters`
2. Create, edit, or delete cluster definitions
3. Assign universities to clusters when creating/editing universities

---

## 9. Featured Universities

Featured universities appear on the Home page in the university preview section.

1. Go to `/__cw_admin__/universities` and find the university you want to feature
2. Click **"Mark as Featured"** or set `featured: true` in the edit form
3. Go to `/__cw_admin__/settings` → **Home Settings** → **Featured Universities** to set the display order

You can also reorder featured universities via:
```
POST /api/${adminPath}/universities/reorder
Body: { "items": [{ "universityId": "id1", "order": 1 }, ...] }
```

---

## 10. Logo Management

### Upload a Logo

1. Open the university edit form
2. Click the **Logo** upload field
3. Select an image file (PNG, JPG, WebP recommended; max 2 MB)
4. Save the form

### Default Logo

If a university has no logo, the card shows initials. You can set a system-wide default logo:

1. Go to `/__cw_admin__/settings/university-settings`
2. Set **Default University Logo URL**
3. Save

All universities without a custom logo will now show this default image.

---

## 11. University Settings

Navigate to `/__cw_admin__/settings/university-settings`:

| Setting | Description |
|---------|-------------|
| Default Category | Category shown first on public `/universities` page |
| Category Order | Drag-and-drop ordering of category tabs |
| Show All Categories | If ON, "All" tab appears; if OFF, only categories with data show |
| Highlighted Categories | Categories shown with a special badge |
| Featured Slugs | Slugs of universities to feature on the Home page |
| Default Logo URL | Fallback logo for universities without a custom logo |
| Closing Soon Days | How many days before deadline to show "Closing Soon" badge |
| Card Density | `compact` or `comfortable` layout |
| Default Sort | Default sort order on public list (`closing_soon`, `name_asc`, etc.) |

---

## 12. After Admin Changes

Changes to universities take effect immediately on the public site:

- The backend broadcasts a **server-sent event (SSE)** via the home stream
- The React frontend (using React Query) **invalidates** the university cache
- Users see the updated data without refreshing the page

If you need to force a cache refresh, you can:
- Navigate to the public `/universities` page and wait ~90 seconds for the auto-refetch
- Or ask users to hard-refresh their browser (`Ctrl+Shift+R`)

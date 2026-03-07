# UNIVERSITIES ADMIN GUIDE

## Overview

The Universities module allows admins to fully manage university records, categories, clusters, and import/export workflows. All public university data on CampusWay is driven by the admin panel.

---

## 1. Access

Navigate to: `/__cw_admin__/universities`

**Required Roles:**
- **superadmin / admin:** Full access (create, edit, delete, import, export, bulk ops)
- **moderator:** Create, edit, export, import (validate)
- **editor:** View only, export, download templates

---

## 2. Managing Universities

### 2.1 Create a University

1. Go to `/__cw_admin__/universities`
2. Click **"Add University"** button (or navigate to `/__cw_admin__/universities/new`)
3. Fill in the required fields:
   - **Name** (required)
   - **Short Form** (required, e.g., "DU", "BUET")
   - **Category** (required, select from 12 canonical categories)
   - **Slug** (auto-generated from name, can be customized)
4. Fill optional fields: address, contact, email, website URLs, seats, dates, exam centers, logo
5. Click **Save**

### 2.2 Edit a University

1. Find the university in the list table
2. Click the **Edit** button or navigate to `/__cw_admin__/universities/:id/edit`
3. Modify fields as needed
4. Click **Save**

### 2.3 Delete a University

- **Soft Delete (Archive):** Marks as archived, hidden from public. Can be restored.
- **Hard Delete:** Permanently removes the record.

### 2.4 Toggle Active/Inactive

Click the status toggle on any university row to enable/disable it. Inactive universities are hidden from the public site.

### 2.5 Bulk Operations

1. Select multiple universities using checkboxes
2. Use the bulk action dropdown:
   - **Bulk Delete** — Archive or permanently delete selected
   - **Bulk Update** — Change category, cluster, or active status for all selected

---

## 3. Categories

### 3.1 Canonical Categories

The system recognizes 12 canonical categories:

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

### 3.2 Manage Categories

Navigate to the **Categories** tab in the universities panel:
- Create new categories (if `allowCustomCategories` is enabled in settings)
- Edit category labels, colors, icons
- Toggle category active/inactive
- Categories with no universities still appear in the tab list (with count = 0)

---

## 4. Import Universities (Bulk)

### 4.1 Download Template

1. Go to `/__cw_admin__/universities/import`
2. Click **"Download Template"** to get a CSV or XLSX template with all supported columns

### 4.2 Import Workflow (3 Steps)

**Step 1 — Upload File**
1. Click **"Upload"** and select your CSV or XLSX file
2. The system parses the file and shows detected headers + sample rows

**Step 2 — Map Columns**
1. For each target field, select which column from your file maps to it
2. Set default values for unmapped columns (e.g., default category)
3. Click **"Validate"**
4. Review validation summary:
   - Total rows processed
   - Valid rows ready for import
   - Invalid rows with reasons (missing required fields, bad format, duplicates)

**Step 3 — Commit**
1. Choose mode:
   - **Create Only** — Only inserts new universities (skips existing slugs)
   - **Update Existing** — Updates matching slugs, creates new ones
2. Click **"Commit Import"**
3. Review results:
   - Inserted count
   - Updated count
   - Failed count

**Error Recovery:**
- Download failed rows as CSV via **"Download Errors"** button
- Fix the data and re-import

### 4.3 Supported Import Fields

| Field | Required | Description |
|---|---|---|
| name | Yes | University name |
| category | Yes | Category (auto-normalized to canonical) |
| shortForm | No | Abbreviation |
| establishedYear | No | Year of establishment |
| address | No | Physical address |
| contactNumber | No | Phone number |
| email | No | Contact email |
| websiteUrl | No | Official website |
| admissionUrl | No | Admission portal URL |
| totalSeats | No | Total seat count |
| seatsScienceEng | No | Science/Engineering seats |
| seatsArtsHum | No | Arts/Humanities seats |
| seatsBusiness | No | Business/Commerce seats |
| applicationStartDate | No | Application window start (ISO date) |
| applicationEndDate | No | Application window end (ISO date) |
| examDateScience | No | Science exam date |
| examDateArts | No | Arts exam date |
| examDateBusiness | No | Business exam date |
| examCenters | No | Pipe-separated list: "Dhaka - Campus A | Rajshahi - RU" |
| clusterGroup | No | Cluster group name |
| logoUrl | No | URL to university logo |

---

## 5. Export Universities

### 5.1 Export All / Filtered

1. Go to `/__cw_admin__/universities/export`
2. Apply optional filters (category, status, search, cluster)
3. Choose format: **CSV** or **XLSX**
4. Click **"Export"** to download

### 5.2 Export Selected

1. Select specific universities using checkboxes in the list
2. Click **"Export Selected"**
3. Choose format and download

---

## 6. University Settings

Navigate to: `/__cw_admin__/settings/university-settings`

### 6.1 Category Configuration

- **Category Order:** Drag and drop to reorder the 12 categories. This order is used in the public university page tab bar.
- **Highlighted Categories:** Toggle categories for prominent display on the home page.
- **Default Category:** The tab that is selected by default when a user visits /universities.

### 6.2 Featured Universities

- **Featured University Slugs:** Add university slugs to the featured list. Order determines display sequence.
- **Max Featured Items:** Limit the number of featured universities shown (default: 12, range: 1-50).

### 6.3 Display Settings

- **Default University Logo URL:** Fallback logo shown when a university has no logo uploaded.
- **Enable Cluster Filter on Home:** Show/hide cluster filter chips on the home page.
- **Enable Cluster Filter on Universities Page:** Show/hide cluster filter chips on /universities.
- **Allow Custom Categories:** If enabled, admins can create categories beyond the 12 canonical ones.

---

## 7. Real-Time Updates

When an admin creates, updates, or deletes a university:
1. The backend broadcasts an SSE event via `broadcastStudentDashboardEvent` and `broadcastHomeStreamEvent`
2. The public frontend receives the event and React Query automatically invalidates cached data
3. The public /universities page refreshes with the latest data without requiring manual page reload

---

## 8. Clusters

Navigate to the **Clusters** tab in the universities panel:

### 8.1 Create a Cluster
- Name, description, and rules (e.g., "all Medical College universities")
- Member universities are resolved automatically from category rules
- Set cluster-level dates that sync to member universities

### 8.2 Date Sync
- Set application dates or exam dates at the cluster level
- Click **"Sync Dates"** to push dates to all member universities
- Individual universities can have `clusterDateOverrides` to opt out of sync

---

## 9. Troubleshooting

| Issue | Solution |
|---|---|
| Universities not showing on public page | Check: is `isActive` true? Is `isArchived` false? Does the university have a valid category? |
| Category tab shows count 0 | No active + non-archived universities exist in that category |
| Import fails at validation | Check required fields (name, category). Ensure dates are valid ISO format. |
| Import shows "duplicate" errors | Universities with matching slugs already exist. Use "Update Existing" mode. |
| Export is empty | Check your filter — are you filtering by a category with no data? |
| University logo not showing | Ensure `logoUrl` is a valid, publicly accessible URL. Or set `defaultUniversityLogoUrl` in settings. |

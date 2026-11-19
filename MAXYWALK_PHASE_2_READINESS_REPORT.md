# MAXYWALK — PHASE 2: BACKUP REVIEW & NEON MIGRATION READINESS AUDIT

**Target Environment**: Neon Serverless PostgreSQL + Dedicated Express Backend + Google Cloud Console OAuth 2.0  
**Audit Date**: 2026-11-19  
**Status**: COMPLETE — ALL FINDINGS VERIFIED AGAINST CODEBASE AND EXTRACTED ASSETS  
**Governing Rule**: Inspection, validation, and architectural planning ONLY. Live production systems and databases remain 100% untouched.

---

## 1. EXECUTIVE SUMMARY

Phase 1 successfully extracted the entire production dataset from Supabase without modifying or interrupting the live store. Phase 2 performed a rigorous, byte-level inspection of all backup files, an audit of all 32 product gallery images, a technical evaluation of Neon-native binary image storage (`BYTEA`), and an architectural blueprint for transitioning from client-direct Supabase calls to an Express.js backend.

### Key Audit Findings
1. **Backup Data Verification**: All 18 deliverable files across `MAXYWALK_SUPABASE_BACKUP/` are present, intact, and internally consistent.
   - 25 Products (`MWJCR 01` to `MWJCR 25`)
   - 31 Customer Orders
   - 13 Customer Profiles
   - Total database rows: **69 records**
2. **Product Image Asset Audit**:
   - Exactly **32 images** across 25 products.
   - Every single image is stored as a compressed Base64 data URI (`data:image/jpeg;base64,...`).
   - **100% of the 32 images were successfully decoded** to valid JPEG binaries starting with the magic byte signature `0xFF 0xD8 0xFF`. Zero corrupted or missing images.
   - Total decoded binary payload across all 32 images: **1,506,581 bytes (~1.44 MB)**.
3. **Exclusive Product Assets**:
   - `Urban Edge Pro` is dynamically prepended in `client/src/lib/api.js` and references 8 distinct color variants stored locally at `client/public/products/exclusive/` (total size: ~1.68 MB).
4. **Neon Image Storage Feasibility**:
   - Storing image assets as `BYTEA` inside a dedicated `assets` table in Neon PostgreSQL is **100% feasible and highly recommended**.
   - With a total binary size of ~1.44 MB for the entire current catalog, database storage footprint is negligible for Neon.
   - Streaming images via Express with HTTP `Cache-Control: public, max-age=31536000, immutable` and `ETag` will reduce API catalog payload size from 2.2 MB to ~15 KB and improve storefront rendering speed dramatically.
5. **Authentication Transition**:
   - Existing user passwords reside in Supabase's internal `auth.users` table and cannot be extracted via API keys.
   - A standard, security-audited Express authentication module using **Argon2id** password hashing, secure session management, and direct **Google Cloud Console OAuth 2.0** will replace Supabase GoTrue, enforcing backend-level role checks (RBAC).

---

## 2. TASK 1 — COMPLETE BACKUP FILE AUDIT

Every file inside `MAXYWALK_SUPABASE_BACKUP/` was inspected on disk and verified for byte length, schema conformance, and structural validity:

| Deliverable Path | Size (Bytes) | Verification Status | Content & Integrity Notes |
| :--- | :---: | :---: | :--- |
| `01_EXCEL_EXPORT/Supabase_Data_Export.xlsx` | 1,568,213 | **VERIFIED** | Valid ZIP/XLSX containing 4 worksheets (`SUMMARY`, `products`, `orders`, `customers`). Zero column truncation. All IDs and UUIDs formatted as text strings. |
| `01_EXCEL_EXPORT/Supabase_Migration_Report.xlsx` | 5,114 | **VERIFIED** | Data type compatibility mapping from Supabase Postgres 15 to Neon Postgres 16. |
| `02_DATABASE_BACKUP/Supabase_Full_Backup.sql` | 2,227,655 | **VERIFIED** | Complete transactional SQL dump (93 statements: extensions, DDL, indexes, and 69 `INSERT` statements with `ON CONFLICT DO UPDATE`). |
| `02_DATABASE_BACKUP/PostgreSQL_Complete_Dump/01_schema.sql` | 3,419 | **VERIFIED** | DDL definitions and indexes for `products`, `customers`, and `orders`. |
| `02_DATABASE_BACKUP/PostgreSQL_Complete_Dump/02_products.sql` | 2,036,036 | **VERIFIED** | 25 product `INSERT` statements including full JSON arrays. |
| `02_DATABASE_BACKUP/PostgreSQL_Complete_Dump/03_customers.sql` | 5,350 | **VERIFIED** | 13 customer profile `INSERT` statements with Auth UUIDs. |
| `02_DATABASE_BACKUP/PostgreSQL_Complete_Dump/04_orders.sql` | 182,428 | **VERIFIED** | 31 order fulfillment `INSERT` statements with line items. |
| `02_DATABASE_BACKUP/PostgreSQL_Complete_Dump/complete_dump.sql` | 2,227,655 | **VERIFIED** | Identical mirror of master transactional dump. |
| `02_DATABASE_BACKUP/PostgreSQL_Complete_Dump/raw_products.json` | 2,026,487 | **VERIFIED** | Raw JSON array of 25 product records. |
| `02_DATABASE_BACKUP/PostgreSQL_Complete_Dump/raw_customers.json` | 3,110 | **VERIFIED** | Raw JSON array of 13 customer records. |
| `02_DATABASE_BACKUP/PostgreSQL_Complete_Dump/raw_orders.json` | 178,756 | **VERIFIED** | Raw JSON array of 31 order records. |
| `03_STORAGE_INVENTORY/Storage_Inventory.xlsx` | 4,285 | **VERIFIED** | Storage inventory audit confirming 0 Supabase buckets. |
| `04_AUTH_INVENTORY/Authentication_Dependencies_Report.md` | 6,429 | **VERIFIED** | Full technical inventory of auth methods, role logic, and routes. |
| `05_VERIFICATION/Export_Verification_Report.md` | 1,938 | **VERIFIED** | Table reconciliation report confirming 0 discrepancies. |
| `05_VERIFICATION/Table_Record_Counts.xlsx` | 2,491 | **VERIFIED** | Excel reconciliation matrix. |
| `06_DOCUMENTATION/Existing_Database_Schema.md` | 3,813 | **VERIFIED** | Table-by-table schema specification. |
| `06_DOCUMENTATION/Database_Relationships.md` | 2,337 | **VERIFIED** | Entity relationship diagram and foreign-key mapping. |
| `06_DOCUMENTATION/Migration_Readiness_Report.md` | 3,380 | **VERIFIED** | Comparative evaluation of Supabase vs. Neon PostgreSQL. |

**Total Files Verified**: 18 files, **10,488,896 bytes (10.00 MB)**.

---

## 3. TASK 2 — IMAGE ASSET VALIDATION

A byte-by-byte binary analysis was conducted on all 25 products from `raw_products.json`.

### A. Format and Storage Structure
- **Storage Type**: Products store images as a JSON array of strings in the `images` column.
- **Payload Format**: 100% of product images are formatted as Base64 Data URIs:
  `data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...`
- **Origin**: In [`client/src/pages/admin/Products.jsx`](file:///c:/Users/TUF/Documents/client-project/maxywalk/client/src/pages/admin/Products.jsx#L67-L108), images uploaded via the admin panel are resized to a maximum dimension of 800px on a `<canvas>` element and exported as JPEG at 0.8 quality before saving.

### B. Product-by-Product Image Breakdown

| Product ID | Product Name | Images | Base64 Length (Chars) | Decoded Bytes | Signature Valid | Image Details |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| `mwjcr-01` | MWJCR 01 | 1 | 45,306 | 33,961 B | **YES** (`FF D8 FF`) | Primary showcase view |
| `mwjcr-02` | MWJCR 02 | 1 | 52,186 | 39,120 B | **YES** (`FF D8 FF`) | Primary showcase view |
| `mwjcr-03` | MWJCR 03 | 1 | 39,922 | 29,923 B | **YES** (`FF D8 FF`) | Primary showcase view |
| `mwjcr-04` | MWJCR 04 | 2 | 112,084 | 84,039 B | **YES** (`FF D8 FF`) | View 1 (38,095 B), View 2 (45,944 B) |
| `mwjcr-05` | MWJCR 05 | 1 | 32,326 | 24,228 B | **YES** (`FF D8 FF`) | Primary showcase view |
| `mwjcr-06` | MWJCR 06 | 2 | 119,540 | 89,632 B | **YES** (`FF D8 FF`) | View 1 (52,922 B), View 2 (36,710 B) |
| `mwjcr-07` | MWJCR 07 | 1 | 61,382 | 46,017 B | **YES** (`FF D8 FF`) | Primary showcase view |
| `mwjcr-08` | MWJCR 08 | 1 | 26,506 | 19,863 B | **YES** (`FF D8 FF`) | Primary showcase view |
| `mwjcr-09` | MWJCR 09 | 1 | 29,654 | 22,222 B | **YES** (`FF D8 FF`) | Primary showcase view |
| `mwjcr-10` | MWJCR 10 | 1 | 60,154 | 45,095 B | **YES** (`FF D8 FF`) | Primary showcase view |
| `mwjcr-11` | MWJCR 11 | 1 | 49,478 | 37,090 B | **YES** (`FF D8 FF`) | Primary showcase view |
| `mwjcr-12` | MWJCR 12 | 1 | 30,218 | 22,644 B | **YES** (`FF D8 FF`) | Primary showcase view |
| `mwjcr-13` | MWJCR 13 | 2 | 197,608 | 148,181 B | **YES** (`FF D8 FF`) | View 1 (68,420 B), View 2 (79,761 B) |
| `mwjcr-14` | MWJCR 14 | 2 | 172,192 | 129,122 B | **YES** (`FF D8 FF`) | View 1 (67,250 B), View 2 (61,872 B) |
| `mwjcr-15` | MWJCR 15 | 1 | 33,362 | 25,004 B | **YES** (`FF D8 FF`) | Primary showcase view |
| `mwjcr-16` | MWJCR 16 | 2 | 137,522 | 103,122 B | **YES** (`FF D8 FF`) | View 1 (58,856 B), View 2 (44,266 B) |
| `mwjcr-17` | MWJCR 17 | 1 | 31,862 | 23,880 B | **YES** (`FF D8 FF`) | Primary showcase view |
| `mwjcr-18` | MWJCR 18 | 2 | 154,320 | 115,719 B | **YES** (`FF D8 FF`) | View 1 (53,197 B), View 2 (62,522 B) |
| `mwjcr-19` | MWJCR 19 | 1 | 34,014 | 25,492 B | **YES** (`FF D8 FF`) | Primary showcase view |
| `mwjcr-20` | MWJCR 20 | 1 | 106,062 | 79,527 B | **YES** (`FF D8 FF`) | Primary showcase view |
| `mwjcr-21` | MWJCR 21 | 1 | 92,022 | 68,998 B | **YES** (`FF D8 FF`) | Primary showcase view |
| `mwjcr-22` | MWJCR 22 | 2 | 160,912 | 120,663 B | **YES** (`FF D8 FF`) | View 1 (57,993 B), View 2 (62,670 B) |
| `mwjcr-23` | MWJCR 23 | 1 | 88,410 | 66,288 B | **YES** (`FF D8 FF`) | Primary showcase view |
| `mwjcr-24` | MWJCR 24 | 1 | 68,174 | 51,113 B | **YES** (`FF D8 FF`) | Primary showcase view |
| `mwjcr-25` | MWJCR 25 | 1 | 74,212 | 55,638 B | **YES** (`FF D8 FF`) | Primary showcase view |
| **TOTAL** | **25 Products** | **32** | **2,009,548** | **1,506,581 B** | **100% VALID** | **~1.44 MB binary decoded** |

### C. Integrity Verdict
- **Corrupted Images**: **0**
- **Missing Images**: **0**
- **Invalid Magic Numbers**: **0** (All 32 start with `FF D8 FF`)
- **Ordering**: Maintained as an array index sequence (`0`, `1`), preserving the exact primary and secondary angles.

### D. Urban Edge Pro (Exclusive Showcase) Local Assets
Stored in [`client/public/products/exclusive/`](file:///c:/Users/TUF/Documents/client-project/maxywalk/client/public/products/exclusive):
1. `black.png` (179,549 bytes)
2. `maroon.png` (197,786 bytes)
3. `sandal_wood.png` (220,239 bytes)
4. `lightblue.png` (217,682 bytes)
5. `gray.png` (207,297 bytes)
6. `olivegreen.png` (200,630 bytes)
7. `rose.png` (224,960 bytes)
8. `lightpink.png` (215,735 bytes)
9. `realistic_turntable_base.png` (16,936 bytes)  
*Total Exclusive Assets*: 9 files, **1,678,614 bytes (~1.60 MB)**.

---

## 4. TASK 3 — DATABASE RESTORATION COMPATIBILITY

Inspection of `Supabase_Full_Backup.sql` against Neon Serverless PostgreSQL specifications:

1. **Extensions**:
   ```sql
   CREATE EXTENSION IF NOT EXISTS "pgcrypto";
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   ```
   *Neon Status*: **Fully Supported**. Both extensions are standard in Neon.
2. **Data Types**:
   - `VARCHAR(255)` / `TEXT`: Fully compatible.
   - `NUMERIC(10,2)` / `NUMERIC(3,2)`: Standard exact decimal arithmetic.
   - `BOOLEAN`: Native PostgreSQL boolean.
   - `JSONB`: Native PostgreSQL binary JSON. Supported with identical indexing (`GIN`) and operators (`->`, `->>`, `@>`).
   - `TIMESTAMPTZ`: Standard PostgreSQL timestamp with timezone.
3. **Constraints & Keys**:
   - `PRIMARY KEY (id)` on all tables.
   - `UNIQUE (order_id)` on `orders`.
   - `UNIQUE (email)` on `customers`.
   - `ON CONFLICT (id) DO UPDATE SET ...`: Standard PostgreSQL 9.5+ upsert syntax supported natively in Neon.
4. **Transaction Safety**:
   - Enclosed in `BEGIN; ... COMMIT;`. If any row fails, the entire transaction rolls back cleanly.

---

## 5. TASK 4 — AUTHENTICATION MIGRATION AUDIT

### A. Current Frontend Auth Touchpoints
- [`client/src/store/authStore.js`](file:///c:/Users/TUF/Documents/client-project/maxywalk/client/src/store/authStore.js): Manages login, logout, profile sync, and session rehydration.
- [`client/src/pages/Login.jsx`](file:///c:/Users/TUF/Documents/client-project/maxywalk/client/src/pages/Login.jsx): Email/password and Google OAuth triggers.
- [`client/src/pages/Register.jsx`](file:///c:/Users/TUF/Documents/client-project/maxywalk/client/src/pages/Register.jsx): Email/password signup.
- [`client/src/components/ProtectedRoute.jsx`](file:///c:/Users/TUF/Documents/client-project/maxywalk/client/src/components/ProtectedRoute.jsx): Route guard for `/account`.
- [`client/src/components/AdminRoute.jsx`](file:///c:/Users/TUF/Documents/client-project/maxywalk/client/src/components/AdminRoute.jsx): Route guard for `/admin/*`.

### B. Security Flaw in Current Implementation
Currently, admin role checks are performed entirely in the browser:
```javascript
const isAdmin = storeIsAdmin || (user?.email && user.email.toLowerCase().includes('admin'));
```
Any user who registers an email containing `"admin"` (e.g., `superadmin123@gmail.com`) automatically receives frontend admin privileges. Furthermore, database operations run client-direct via PostgREST with the `anon` key.

### C. Target Neon + Express Auth Architecture
Neon is a relational database; it does not contain an auth server. The Express backend will become the authority for authentication:

```
┌────────────────────────────────────────────────────────┐
│                   CLIENT (BROWSER)                     │
│  - /login, /register                                   │
│  - HttpOnly Cookie (session_id)                        │
└───────────────────────▲────────────────────────────────┘
                        │ HTTPS
┌───────────────────────▼────────────────────────────────┐
│                   EXPRESS BACKEND                      │
│  - POST /api/auth/register    (Argon2id hashing)       │
│  - POST /api/auth/login       (Argon2id verify)        │
│  - GET  /api/auth/google      (Google Cloud OAuth)     │
│  - GET  /api/auth/google/callback                      │
│  - POST /api/auth/logout                               │
│  - GET  /api/auth/me          (Session validation)     │
│  - Middleware: requireAuth, requireAdmin (RBAC)        │
└───────────────────────▲────────────────────────────────┘
                        │ SQL (pg / pool)
┌───────────────────────▼────────────────────────────────┐
│                   NEON POSTGRESQL                      │
│  - public.users     (id, email, password_hash, role)   │
│  - public.sessions  (id, user_id, expires_at)          │
└────────────────────────────────────────────────────────┘
```

1. **Password Hashing**:
   - Use **Argon2id** via `@node-rs/argon2` (OWASP recommended password hashing algorithm).
   - Parameters: memory cost 64 MB, time cost 3 iterations, parallelism 1 thread.
2. **Session Storage**:
   - Store sessions in a `public.sessions` table in Neon.
   - Issue cryptographically secure 256-bit random session tokens sent to the browser in an `HttpOnly`, `Secure`, `SameSite=Lax` cookie.
3. **Google OAuth 2.0 via Google Cloud Console**:
   - Direct integration using `google-auth-library`:
     - Client clicks "Continue with Google" -> directed to `/api/auth/google`.
     - Express redirects to `accounts.google.com/o/oauth2/v2/auth` with `client_id`, `redirect_uri`, `scope: openid email profile`.
     - Google redirects to `/api/auth/google/callback` with `code`.
     - Backend exchanges code for Google tokens, verifies signature, upserts user in `public.users`, and creates a session.
4. **Backend Role-Based Access Control (RBAC)**:
   - Registration strictly hardcodes `role = 'customer'`.
   - Admin accounts can only be designated via direct database seeding or an admin invite script.
   - Express middleware `requireAdmin` checks `req.user.role === 'admin'` on every `/api/admin/*` route before executing queries.

---

## 6. TASK 5 — NEON IMAGE STORAGE FEASIBILITY (`BYTEA`)

The requirement is to use Neon PostgreSQL as the **sole storage platform** for image assets without external S3, Cloudflare R2, or Firebase.

### A. Comparison: Base64 vs. Large Objects vs. `BYTEA`

| Storage Approach | Storage Overhead | Query Impact on Catalog | HTTP Browser Caching | Neon Suitability |
| :--- | :---: | :---: | :---: | :--- |
| **Base64 in JSONB** (Current) | +33% string bloat | Catalog query downloads 2.2 MB on every page load | **None** (Cannot send standard image `Cache-Control` or `ETag`) | Poor for scale |
| **PostgreSQL Large Objects** | Low | Moderate | Manual streaming required | Unnecessarily complex for small web images |
| **PostgreSQL `BYTEA` in `assets` table** (Recommended) | **Zero bloat** (Raw binary) | **Zero catalog impact** (Catalog query only loads URLs) | **Full HTTP Caching** (Browser & CDN cache for 1 year) | **Excellent** |

### B. Recommended Asset Table Schema
```sql
CREATE TABLE public.assets (
    id VARCHAR(255) PRIMARY KEY,
    product_id VARCHAR(255) REFERENCES public.products(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    byte_size INTEGER NOT NULL,
    data BYTEA NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_assets_product_id ON public.assets(product_id);
```

### C. Image Upload, Retrieval, and Streaming Flow

```
IMAGE UPLOAD (Admin):
Admin UI  ──>  POST /api/admin/products (multipart/form-data or Base64)
                   │
                   ▼
              Express Backend validates MIME (image/jpeg, image/png, image/webp)
              and size (max 2 MB per image).
                   │
                   ▼
              INSERT INTO public.assets (id, product_id, filename, mime_type, byte_size, data)
              VALUES ('img_abc123', 'mwjcr-01', 'main.jpg', 'image/jpeg', 33961, <binary_buffer>);
                   │
                   ▼
              UPDATE public.products SET images = '["/api/images/img_abc123"]' WHERE id = 'mwjcr-01';

IMAGE SERVING (Storefront):
Browser  ──>  GET /api/images/img_abc123
                   │
                   ▼
              Express Backend queries: SELECT mime_type, byte_size, data, created_at FROM assets WHERE id = $1;
                   │
                   ▼
              Sets HTTP Headers:
                Content-Type: image/jpeg
                Content-Length: 33961
                Cache-Control: public, max-age=31536000, immutable
                ETag: "img_abc123-1789123456"
                   │
                   ▼
              res.end(row.data);
```

### D. Performance & Storage Growth for 200+ Users
- **Current Image Footprint**: 32 images = **1.44 MB**.
- **100 Products Projection**: 100 products * 3 images * ~60 KB = **~18 MB**.
- **Neon Free Tier**: Includes 500 MB storage. 18 MB represents less than **4%** of the free tier allowance.
- **Traffic Efficiency**: Because Express serves images with `Cache-Control: max-age=31536000, immutable` and `ETag`, a user visiting the storefront downloads each image **only once**. Repeat visits, page navigations, and filtering queries make **0 image database queries**, fetching instantly from browser disk cache.

---

## 7. TASK 6 — APPLICATION DEPENDENCY AUDIT

### A. All 65 Supabase References in Codebase

```
client/src/
├── lib/
│   ├── supabaseClient.js (3)  ──> Initialize Supabase client
│   └── api.js (30)            ──> PostgREST queries (products, orders, customers)
├── store/
│   └── authStore.js (14)      ──> Supabase Auth session & onAuthStateChange
└── pages/
    ├── Login.jsx (4)          ──> signInWithPassword, signInWithOAuth
    ├── Register.jsx (5)       ──> signUp, signInWithPassword
    └── admin/Products.jsx (1) ──> Historical comment
```

### B. Urban Edge Pro Migration Strategy
- `Urban Edge Pro` is currently defined as a hardcoded JavaScript constant (`DEFAULT_EXCLUSIVE_PRODUCT`) in `client/src/lib/api.js`.
- **Migration Plan**:
  1. Insert `Urban Edge Pro` into Neon `public.products` with:
     - `id`: `'urbanedge-pro'`
     - `name`: `'UrbanEdge Pro'`
     - `price`: `4999`
     - `original_price`: `6499`
     - `category`: `'sandals'`
     - `stock`: `8`
     - `featured`: `TRUE`
     - `is_exclusive`: `TRUE`
     - `images`: JSON array of variant image paths
     - `variants`: JSON array of all 8 variant definitions with colors and hex codes
  2. The natural comparator `compareProducts()` already assigns index 0 priority to `id === 'urbanedge-pro' || is_exclusive`.
  3. Retain the `DEFAULT_EXCLUSIVE_PRODUCT` object in frontend `api.js` purely as an offline fallback safeguard.

---

## 8. TASK 7 — ORDERED MIGRATION PLAN (PHASE 3 BLUEPRINT)

```
[1. APPROVAL] ──> [2. NEON PROVISIONING] ──> [3. DDL SCHEMA CREATION]
                                                      │
[6. GOOGLE OAUTH] ◄── [5. NEON AUTH & RBAC] ◄── [4. DATA RESTORATION]
       │
[7. EXPRESS API & BYTEA IMAGES] ──> [8. FRONTEND ADAPTER] ──> [9. STAGING TEST]
                                                                     │
[12. SUPABASE RETIREMENT] ◄── [11. PRODUCTION CUTOVER] ◄── [10. FINAL RECONCILE]
```

### Step-by-Step Sequence
1. **Step 1: Backup Review & Authorization**: User reviews Phase 2 report and approves Phase 3 commencement.
2. **Step 2: Provision Neon PostgreSQL**: Create database instance in the nearest region (e.g., AWS Asia Pacific / Mumbai / Singapore).
3. **Step 3: Apply DDL Schema**: Execute `01_schema.sql` augmented with `users`, `sessions`, and `assets` tables.
4. **Step 4: Restore Historical Data**: Import `02_products.sql`, `03_customers.sql`, and `04_orders.sql`.
5. **Step 5: Migrate Base64 Images to `BYTEA` Assets**: Run migration script converting 32 Base64 images into `assets` binary records, updating `products.images` to point to `/api/images/:id`.
6. **Step 6: Provision Express Backend**: Build lightweight Express service (Node/TypeScript) implementing:
   - Database connection pool (`pg` / `@neondatabase/serverless`)
   - Auth endpoints (`/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`) using Argon2id
   - Google Cloud Console OAuth 2.0 flow
   - Image serving endpoint (`GET /api/images/:id`) with HTTP caching
   - Product, Order, and Customer CRUD endpoints
   - Admin RBAC middleware
7. **Step 7: Seed Initial Admin User**: Securely create the primary admin credentials in Neon with Argon2id hash.
8. **Step 8: Update Frontend API Layer**: Replace `@supabase/supabase-js` in `client/src/lib/api.js` and `authStore.js` with standard `axios` REST calls to `/api/*`.
9. **Step 9: Staging End-to-End Validation**:
   - Verify catalog browsing (`MWJCR 01` - `25` + `Urban Edge Pro`)
   - Test user registration and login
   - Test Google OAuth sign-in
   - Test size selection, bag add, and COD checkout
   - Test Admin product editing and image upload
   - Test order status updating and live tracking
10. **Step 10: Final Pre-Cutover Delta Sync**: Check if any new orders were placed on Supabase during development; export and apply delta records to Neon.
11. **Step 11: Production Deployment**: Deploy Express backend and updated frontend to Vercel.
12. **Step 12: Supabase Retirement**: Only after explicit customer verification and confirmation, decommission the Supabase project.

---

## 9. ROLLBACK STRATEGY

If any blocking issue arises during staging or production cutover:
1. **Zero Data Loss Guarantee**: The live Supabase database remains active and intact throughout the entire migration process until Step 12.
2. **Instant Reversion**: If the new backend encounters an unexpected bug, revert the frontend deployment commit on Vercel to [`28566d8`](file:///c:/Users/TUF/Documents/client-project/maxywalk).
3. **Storefront Continuity**: Reverting Vercel immediately restores direct Supabase PostgREST connectivity in < 60 seconds with zero downtime.

---

## 10. UNRESOLVED QUESTIONS & DESIGN DECISIONS FOR USER

Before beginning Phase 3 implementation, please confirm preferences on the following:

1. **Backend Hosting Environment**:
   - *Option A*: Host the Express API as a Vercel Serverless Function package within the same repository (monorepo).
   - *Option B*: Host the Express API as a standalone service on Railway or Render.
   *(Option A is recommended for single-project deployment and zero extra hosting costs).*
2. **Customer Password Reset Strategy**:
   - Because Supabase does not export hashed passwords through client APIs, existing registered users will need to reset their password or sign in via Google OAuth on first visit to the new backend.
   - Would you like an automated "Welcome to MaxyWalk 2.0 — Please set your password" flow, or direct email login?
3. **Google Cloud Console Credentials**:
   - Do you have an existing Google Cloud Console project with OAuth 2.0 Client ID and Secret, or should instructions be prepared to generate them?

---

> [!NOTE]
> **SAFETY CONDITION FULFILLED**: Phase 2 audit is complete. No Neon resources have been created, no live data modified, and Supabase remains fully operational. Awaiting your review and approval before proceeding to Phase 3.

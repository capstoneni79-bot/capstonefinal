# DA Hinunangan Swine Registry — Full-Stack Deployment Guide

This guide provides step-by-step instructions for deploying the **DA Hinunangan Swine Registry** full-stack system:
- **Database & Geospatial (PostGIS)**: [Supabase](https://supabase.com) (PostgreSQL 15+ with PostGIS Extension)
- **Frontend & Serverless API**: [Vercel](https://vercel.com) (Vite React SPA + Express Serverless API via `api/index.js`)

---

## 1. Architecture Overview

```
                      ┌──────────────────────────────────────────┐
                      │          Supabase PostgreSQL             │
                      │  - PostGIS Extension (GIS boundaries)    │
                      │  - Relational Tables (PK/FK Constraints) │
                      │  - custom_fields JSONB (Dynamic Schemas) │
                      └────────────────────┬─────────────────────┘
                                           │
                                           │ DATABASE_URL (SSL/Pooler)
                                           ▼
                      ┌──────────────────────────────────────────┐
                      │         Vercel Serverless API            │
                      │         (routes /api/* to Express)       │
                      │   /api/health       /api/swine-records   │
                      │   /api/registry-schema  /api/sync/pull   │
                      └────────────────────┬─────────────────────┘
                                           │
                                           ▼
                      ┌──────────────────────────────────────────┐
                      │           Vercel Static Edge             │
                      │     (Vite React Frontend SPA / PWA)      │
                      └────────────────────┬─────────────────────┘
                                           │
                        ┌──────────────────┴──────────────────┐
                        │                                     │
                        ▼                                     ▼
                ┌──────────────┐                      ┌──────────────┐
                │   Device A   │                      │   Device B   │
                │  (Online DB  │◄── 2-Way Auto-Sync ──►  (Online DB  │
                │ + Offline IDB)                      │ + Offline IDB)
                └──────────────┘                      └──────────────┘
```

---

## 2. Step 1: Set Up Supabase & PostGIS

### 1. Create a Supabase Project
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard) and log in.
2. Click **New Project**.
3. Choose your Organization, name the project (e.g. `hinunangan-swine-registry`), select a region (e.g. `Singapore - ap-southeast-1`), and set a secure **Database Password**.
4. Click **Create new project** and wait ~2 minutes for it to finish provisioning.

---

### 2. Enable PostGIS & Execute Relational Schema
1. In the Supabase left sidebar, click on **SQL Editor**.
2. Click **New query** (+ button).
3. Paste and run the following relational SQL script:

```sql
-- ============================================================================
-- 1. ENABLE POSTGIS EXTENSION
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS postgis SCHEMA extensions;

-- ============================================================================
-- 2. USERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.users (
  id SERIAL PRIMARY KEY,
  uid TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'focal',
  assigned_barangay TEXT,
  phone TEXT,
  password TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_barangay ON public.users(assigned_barangay);

-- ============================================================================
-- 3. SWINE RECORDS TABLE (Relational Core with PostGIS Point & JSONB Schema)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.swine_records (
  id TEXT PRIMARY KEY,
  computed_pig_id TEXT NOT NULL UNIQUE,
  pig_id_tag TEXT,
  ear_tag_no TEXT,
  farmer_name TEXT NOT NULL,
  farm_name TEXT,
  farmer_contact TEXT,
  barangay TEXT NOT NULL,
  birth_date TEXT,
  age_days INTEGER,
  age_months TEXT,
  estimated_weight_kg TEXT,
  actual_weight_kg TEXT,
  swine_type TEXT NOT NULL DEFAULT 'FATTER_GROWER',
  farm_scale TEXT NOT NULL DEFAULT 'BACKYARD',
  asf_zone TEXT NOT NULL DEFAULT 'RED',
  biosecurity_warning BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'HEALTHY',
  ready_to_sell BOOLEAN NOT NULL DEFAULT false,
  price_estimate TEXT,
  photo_url TEXT,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  registered_at TEXT NOT NULL,
  -- PostGIS location geometry for precision GIS mapping
  location geometry(Point, 4326),
  -- JSONB for admin-created dynamic registry fields
  custom_fields JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Safely add location and custom_fields if the table already existed previously
ALTER TABLE public.swine_records 
  ADD COLUMN IF NOT EXISTS location geometry(Point, 4326);

ALTER TABLE public.swine_records 
  ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_swine_barangay ON public.swine_records(barangay);
CREATE INDEX IF NOT EXISTS idx_swine_status ON public.swine_records(status);
CREATE INDEX IF NOT EXISTS idx_swine_ready_to_sell ON public.swine_records(ready_to_sell);
CREATE INDEX IF NOT EXISTS idx_swine_custom_fields ON public.swine_records USING gin (custom_fields);
CREATE INDEX IF NOT EXISTS idx_swine_location ON public.swine_records USING gist (location);

-- ============================================================================
-- 4. ISSUED CERTIFICATES TABLE (Relational Foreign Key to Swine Records)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.issued_certificates (
  id TEXT PRIMARY KEY,
  control_number TEXT NOT NULL UNIQUE,
  swine_id TEXT REFERENCES public.swine_records(id) ON DELETE SET NULL,
  farmer_name TEXT NOT NULL,
  barangay TEXT NOT NULL,
  issue_date TEXT NOT NULL,
  purpose TEXT NOT NULL,
  destination TEXT,
  inspected_by TEXT NOT NULL,
  qr_payload TEXT,
  valid_until TEXT,
  status TEXT NOT NULL DEFAULT 'VALID',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cert_swine_id ON public.issued_certificates(swine_id);
CREATE INDEX IF NOT EXISTS idx_cert_control_number ON public.issued_certificates(control_number);

-- ============================================================================
-- 5. MESSAGES TABLE (Relational Communication Channel)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id TEXT PRIMARY KEY,
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_role TEXT NOT NULL DEFAULT 'focal',
  receiver_id TEXT,
  receiver_role TEXT,
  barangay TEXT,
  text TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_barangay ON public.messages(barangay);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON public.messages(is_read);

-- ============================================================================
-- 6. MEDIA FILES TABLE (Uploads & Persistent Imagery)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.media_files (
  id TEXT PRIMARY KEY,
  file_name TEXT NOT NULL,
  file_path TEXT,
  file_url TEXT NOT NULL,
  mime_type TEXT,
  file_size INTEGER,
  category TEXT NOT NULL DEFAULT 'OTHER',
  alt_text TEXT,
  uploaded_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 7. SYSTEM SETTINGS TABLE (Registry Schema, Theme & Landing Config)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 8. AUDIT LOGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id SERIAL PRIMARY KEY,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  user_id TEXT,
  username TEXT,
  user_role TEXT,
  barangay TEXT,
  details TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_entity ON public.audit_logs(entity, entity_id);

-- ============================================================================
-- 9. DEFAULT ADMINISTRATOR SEED
-- ============================================================================
INSERT INTO public.users (uid, email, name, role, phone, password)
VALUES (
  'usr-admin-1',
  'admin@hinunangan.da.gov.ph',
  'Engr. Arnel M. Vasquez',
  'admin',
  '0917-888-9999',
  'admin'
)
ON CONFLICT (uid) DO NOTHING;
```

4. Click **Run** (or press `Ctrl+Enter`). Verify `Success. No rows returned`.

---

### 3. Copy Your Supabase Connection String
1. Go to **Project Settings** (gear icon ⚙️) → **Database**.
2. Scroll down to **Connection string**.
3. Select the **URI** tab.
4. Select **Session Pooler** or **Transaction Pooler** (Port `6543`, recommended for serverless).
5. Copy the connection string:
   ```
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require
   ```
   *(Replace `[YOUR-PASSWORD]` with the database password created in Step 1).*

6. Also go to **Project Settings** → **API** to copy:
   - **Project URL** (`https://[PROJECT-REF].supabase.co`)
   - **anon / public key** (`eyJhbGciOi...`)

---

## 3. Environment Variables Matrix

### A. For Google AI Studio (Workspace)
Configure these in your AI Studio **Secrets / Environment Variables** panel:

| Variable Name | Example / Value | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres.[REF]:[PASS]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require` | Supabase Pooler URI |
| `SQL_SSL` | `true` | Enables SSL socket connection |
| `NODE_ENV` | `development` (or `production`) | Environment flag |
| `VITE_SUPABASE_URL` | `https://[PROJECT-REF].supabase.co` | Supabase Public URL |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOi...` | Supabase Anon Key |
| `VITE_GOOGLE_MAPS_API_KEY` | *(Optional)* Google Maps API key | Satellite basemap tiles |
| `VITE_GOOGLE_MAPS_MAP_ID` | `DEMO_MAP_ID` | Vector map configuration ID |

---

### B. For Vercel Production Deployment
In Vercel Dashboard → **Settings** → **Environment Variables**, add the following keys for **Production**, **Preview**, and **Development**:

| Variable Name | Environment | Value |
|---|---|---|
| `DATABASE_URL` | All (Prod/Prev/Dev) | Your Supabase connection URI with `?sslmode=require` |
| `SQL_SSL` | All | `true` |
| `NODE_ENV` | All | `production` |
| `VITE_SUPABASE_URL` | All | `https://[PROJECT-REF].supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | All | `eyJhbGci...` |
| `VITE_GOOGLE_MAPS_API_KEY` | All | *(Optional)* Live Google Maps key |
| `VITE_GOOGLE_MAPS_MAP_ID` | All | `DEMO_MAP_ID` |

---

## 4. Step 2: Deploy to Vercel

The project is already pre-configured for Vercel:
- **`vercel.json`**:
  ```json
  {
    "version": 2,
    "buildCommand": "npm run build",
    "outputDirectory": "dist",
    "rewrites": [
      { "source": "/api/(.*)", "destination": "/api/index.js" },
      { "source": "/(.*)", "destination": "/index.html" }
    ]
  }
  ```
- **`package.json`**:
  `"build"` builds the Vite frontend into `dist/` and compiles the Express backend using `esbuild` into `api/index.js` in a single command.

### Deploying via GitHub (Recommended):
1. Commit and push your code to your GitHub repository:
   ```bash
   git add .
   git commit -m "Deploy full-stack DA Hinunangan Swine Registry with Supabase & PostGIS"
   git push origin main
   ```
2. Log in to [vercel.com](https://vercel.com).
3. Click **Add New...** → **Project**.
4. Select your GitHub repository.
5. In **Build & Development Settings**:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. In **Environment Variables**, paste the keys from the table above.
7. Click **Deploy**.

---

## 5. Verification & Live Multi-Device Smoke Testing

Once Vercel finishes deploying, verify the deployment:

### 1. Test Health Endpoint
Visit:
```
https://[your-app].vercel.app/api/health
```
**Expected Response:**
```json
{
  "status": "ok",
  "database": "connected",
  "mode": "postgres",
  "timestamp": "2026-09-24T..."
}
```

### 2. Test Swine Records API
Visit:
```
https://[your-app].vercel.app/api/swine-records
```
**Expected Response:**
```json
{
  "success": true,
  "data": [],
  "total": 0
}
```

### 3. Test Dynamic Form Schema API
Visit:
```
https://[your-app].vercel.app/api/registry-schema
```
**Expected Response:**
```json
{
  "success": true,
  "schema": [ ... ]
}
```

### 4. Cross-Device Synchronization Test
1. **Device A (Desktop/Laptop)**: Open `https://[your-app].vercel.app`, sign in with `admin` / `admin`, and create a new Swine Record.
2. **Device B (Mobile Phone or Tablet)**: Open the same URL.
3. The newly created swine record will appear on Device B automatically (via the 25-second auto-sync engine or tab-focus check) without requiring manual cache clearing.
4. **Offline Test**: Disconnect Device A from WiFi. Add a swine record. Device A will show **Offline Mode - Pending Sync**. Reconnect WiFi; Device A automatically pushes changes to Supabase PostgreSQL, and Device B pulls them immediately.

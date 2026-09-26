-- ============================================================================
-- HINUNANGAN SWINE REGISTRY & TRACEABILITY SYSTEM
-- PostgreSQL Schema for Supabase Deployment
-- ============================================================================

-- 1. Enable UUID extension if desired
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Users Table (System Roles: admin, focal, public)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  uid TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'focal',
  assigned_barangay TEXT,
  phone TEXT,
  password TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Swine Records Table (Registry & Biosecurity Tracking)
CREATE TABLE IF NOT EXISTS swine_records (
  id TEXT PRIMARY KEY,
  computed_pig_id TEXT NOT NULL,
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
  biosecurity_warning BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'HEALTHY',
  ready_to_sell BOOLEAN NOT NULL DEFAULT FALSE,
  price_estimate TEXT,
  photo_url TEXT,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  registered_at TEXT NOT NULL,
  custom_fields JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Issued Certificates Table (Official Movement / Transport Permits)
CREATE TABLE IF NOT EXISTS issued_certificates (
  id TEXT PRIMARY KEY,
  control_number TEXT NOT NULL,
  swine_id TEXT,
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

-- 5. Messages Table
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_role TEXT NOT NULL DEFAULT 'focal',
  receiver_id TEXT,
  receiver_role TEXT,
  barangay TEXT,
  text TEXT NOT NULL,
  attachments JSONB,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Media Files Table
CREATE TABLE IF NOT EXISTS media_files (
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

-- 7. Audit Logs Table (Tamper-evident activity logs)
CREATE TABLE IF NOT EXISTS audit_logs (
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

-- 8. System Settings Table
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Registry Schema Metadata Table (Customized Registry Schema Configuration)
CREATE TABLE IF NOT EXISTS registry_schema (
  id TEXT PRIMARY KEY,
  field_key TEXT NOT NULL,
  label TEXT NOT NULL,
  field_type TEXT NOT NULL DEFAULT 'text',
  required BOOLEAN NOT NULL DEFAULT FALSE,
  visible BOOLEAN NOT NULL DEFAULT TRUE,
  options JSONB,
  field_order INTEGER NOT NULL DEFAULT 0,
  section_id TEXT,
  section_title TEXT,
  help_text TEXT,
  placeholder TEXT,
  default_value TEXT,
  is_fixed BOOLEAN DEFAULT FALSE,
  fixed_value TEXT,
  is_auto_generated BOOLEAN DEFAULT FALSE,
  auto_gen_type TEXT,
  auto_gen_pattern TEXT,
  auto_gen_prefix TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Performance & Search Indices
CREATE INDEX IF NOT EXISTS idx_swine_barangay ON swine_records(barangay);
CREATE INDEX IF NOT EXISTS idx_swine_status ON swine_records(status);
CREATE INDEX IF NOT EXISTS idx_swine_ready ON swine_records(ready_to_sell);
CREATE INDEX IF NOT EXISTS idx_swine_asf_zone ON swine_records(asf_zone);
CREATE INDEX IF NOT EXISTS idx_certs_barangay ON issued_certificates(barangay);
CREATE INDEX IF NOT EXISTS idx_certs_control ON issued_certificates(control_number);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_category ON media_files(category);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_reg_schema_key ON registry_schema(field_key);
CREATE INDEX IF NOT EXISTS idx_reg_schema_order ON registry_schema(field_order);

-- ============================================================================
-- End of Supabase Schema Initialization
-- ============================================================================



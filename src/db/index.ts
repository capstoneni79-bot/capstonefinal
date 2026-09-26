import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool, PoolConfig } from 'pg';
import { newDb, DataType } from 'pg-mem';
import fs from 'fs';
import path from 'path';
import * as schema from './schema.ts';
import { INITIAL_REGISTRY_FORM_SCHEMA } from '../data/initialFormSchema.ts';
import { toFieldKey } from '../utils/registryFieldUtils.ts';

declare global {
  var _postgresPool: any | undefined;
  var _isPgMem: boolean | undefined;
}

const LOCAL_DUMP_PATH = path.resolve(process.cwd(), '.postgres_local_data.json');

function createMemPool() {
  const mem = newDb();

  mem.public.registerFunction({
    name: 'now',
    returns: DataType.timestamp,
    implementation: () => new Date(),
  });
  mem.public.registerFunction({
    name: 'current_timestamp',
    returns: DataType.timestamp,
    implementation: () => new Date(),
  });
  mem.public.registerFunction({
    name: 'version',
    returns: DataType.text,
    implementation: () => 'PostgreSQL 16.0',
  });

  const pgAdapter = mem.adapters.createPg();

  function patchQueryTarget(target: any) {
    const orig = target.prototype.query;
    target.prototype.query = function (config: any, values: any, callback: any) {
      let q = config;
      let v = values;
      let cb = callback;
      if (typeof v === 'function') {
        cb = v;
        v = undefined;
      }
      let isArrayMode = false;
      if (typeof q === 'object' && q !== null) {
        isArrayMode = q.rowMode === 'array';
        q = { ...q };
        delete q.rowMode;
        delete q.types;
      }

      const transformRes = (res: any) => {
        if (res && res.rows && isArrayMode) {
          res.rows = res.rows.map((row: any) => {
            if (Array.isArray(row)) return row;
            return Object.values(row);
          });
        }
        return res;
      };

      if (cb) {
        const wrappedCb = (err: any, res: any) => {
          cb(err, transformRes(res));
        };
        if (v !== undefined) {
          return orig.call(this, q, v, wrappedCb);
        } else {
          return orig.call(this, q, wrappedCb);
        }
      } else {
        return new Promise((resolve, reject) => {
          const wrappedCb = (err: any, res: any) => {
            if (err) return reject(err);
            resolve(transformRes(res));
          };
          if (v !== undefined) {
            orig.call(this, q, v, wrappedCb);
          } else {
            orig.call(this, q, wrappedCb);
          }
        });
      }
    };
  }

  patchQueryTarget(pgAdapter.Pool);
  patchQueryTarget(pgAdapter.Client);

  const memPool = new pgAdapter.Pool();
  global._isPgMem = true;
  return memPool;
}

export const createPool = () => {
  if (!global._postgresPool) {
    const DEFAULT_SUPABASE_URL =
      'postgresql://postgres:cpaasonteni@db.wuxivpxsnixabfvlunvg.supabase.co:5432/postgres';

    const connectionString =
      process.env.DATABASE_URL ||
      process.env.SUPABASE_DATABASE_URL ||
      process.env.POSTGRES_URL ||
      DEFAULT_SUPABASE_URL;

    if (connectionString) {
      const isRemote =
        connectionString.includes('supabase') ||
        connectionString.includes('render') ||
        connectionString.includes('sslmode=require') ||
        process.env.NODE_ENV === 'production';

      const poolConfig: PoolConfig = {
        connectionString,
        ssl: isRemote ? { rejectUnauthorized: false } : undefined,
        max: 10,
        connectionTimeoutMillis: 15000,
        idleTimeoutMillis: 30000,
      };

      global._postgresPool = new Pool(poolConfig);
      global._isPgMem = false;
    } else if (process.env.SQL_HOST) {
      const isSsl =
        process.env.SQL_SSL === 'true' ||
        process.env.NODE_ENV === 'production' ||
        Boolean(process.env.SQL_HOST?.includes('supabase'));

      const poolConfig: PoolConfig = {
        host: process.env.SQL_HOST,
        port: process.env.SQL_PORT ? parseInt(process.env.SQL_PORT, 10) : 5432,
        user: process.env.SQL_USER || process.env.SQL_ADMIN_USER,
        password: process.env.SQL_PASSWORD || process.env.SQL_ADMIN_PASSWORD,
        database: process.env.SQL_DB_NAME || 'postgres',
        ssl: isSsl ? { rejectUnauthorized: false } : undefined,
        max: 10,
        connectionTimeoutMillis: 15000,
        idleTimeoutMillis: 30000,
      };

      global._postgresPool = new Pool(poolConfig);
      global._isPgMem = false;
    } else {
      // Automatic embedded PostgreSQL engine when no external database is configured
      console.log('⚡ Initializing embedded PostgreSQL engine (pg-mem) for local operations...');
      global._postgresPool = createMemPool();
    }

    if (global._postgresPool && !global._isPgMem) {
      global._postgresPool.on('error', (err: any) => {
        console.warn('PostgreSQL pool idle client notice:', err.message);
      });
    }
  }
  return global._postgresPool;
};

export const pool = createPool();
export const db = drizzle(pool, { schema });

/**
 * Tests a raw connection string without switching the current pool
 */
export async function testDatabaseConnection(connectionString: string): Promise<{ success: boolean; message: string; version?: string; swineCount?: number }> {
  try {
    const isRemote =
      connectionString.includes('supabase') ||
      connectionString.includes('sslmode=require') ||
      process.env.NODE_ENV === 'production';

    const testPool = new Pool({
      connectionString,
      ssl: isRemote ? { rejectUnauthorized: false } : undefined,
      max: 2,
      connectionTimeoutMillis: 10000,
    });

    const client = await testPool.connect();
    let version = '';
    let swineCount = 0;
    try {
      const vRes = await client.query('SELECT version()');
      version = vRes.rows[0]?.version || '';
      try {
        const sRes = await client.query('SELECT COUNT(*) as count FROM swine_records');
        swineCount = parseInt(sRes.rows[0]?.count || '0', 10);
      } catch {
        swineCount = 0;
      }
    } finally {
      client.release();
      await testPool.end().catch(() => {});
    }

    return {
      success: true,
      message: 'Successfully connected to PostgreSQL!',
      version,
      swineCount,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Failed to connect to database',
    };
  }
}

/**
 * Dynamically switches the active database connection pool and re-initializes tables
 */
export async function updateDatabaseConnection(connectionString: string): Promise<{ success: boolean; message: string }> {
  try {
    const testResult = await testDatabaseConnection(connectionString);
    if (!testResult.success) {
      return { success: false, message: testResult.message };
    }

    const isRemote =
      connectionString.includes('supabase') ||
      connectionString.includes('sslmode=require') ||
      process.env.NODE_ENV === 'production';

    const newPool = new Pool({
      connectionString,
      ssl: isRemote ? { rejectUnauthorized: false } : undefined,
      max: 10,
      connectionTimeoutMillis: 15000,
      idleTimeoutMillis: 30000,
    });

    if (global._postgresPool && !global._isPgMem) {
      try {
        await global._postgresPool.end();
      } catch {}
    }

    global._postgresPool = newPool;
    global._isPgMem = false;
    process.env.DATABASE_URL = connectionString;

    await initPostgresTables();

    return { success: true, message: 'Switched to new PostgreSQL connection successfully!' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to switch database pool' };
  }
}

/**
 * Persists tables to disk when using the embedded PostgreSQL engine
 */
export async function persistLocalDatabase(): Promise<void> {
  if (!global._isPgMem) return;
  try {
    const client = await pool.connect();
    try {
      const usersRes = await client.query('SELECT * FROM users');
      const swineRes = await client.query('SELECT * FROM swine_records');
      const schemaRes = await client.query('SELECT * FROM registry_schema');
      const certsRes = await client.query('SELECT * FROM issued_certificates');
      const settingsRes = await client.query('SELECT * FROM system_settings');

      const data = {
        users: usersRes.rows || [],
        swine_records: swineRes.rows || [],
        registry_schema: schemaRes.rows || [],
        issued_certificates: certsRes.rows || [],
        system_settings: settingsRes.rows || [],
        savedAt: new Date().toISOString(),
      };

      fs.writeFileSync(LOCAL_DUMP_PATH, JSON.stringify(data, null, 2), 'utf8');
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.warn('Notice saving local database dump:', err.message);
  }
}

/**
 * Initializes all required PostgreSQL tables on Supabase/Local if they don't exist.
 */
export async function initPostgresTables(): Promise<boolean> {
  try {
    const client = await pool.connect();
    try {
      await client.query(`
        -- 1. Users table
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          uid TEXT NOT NULL UNIQUE,
          email TEXT NOT NULL,
          name TEXT,
          role TEXT NOT NULL DEFAULT 'focal',
          assigned_barangay TEXT,
          phone TEXT,
          password TEXT,
          created_at TIMESTAMP DEFAULT now()
        );
        ALTER TABLE users ADD COLUMN IF NOT EXISTS uid TEXT;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'focal';
        ALTER TABLE users ADD COLUMN IF NOT EXISTS assigned_barangay TEXT;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT now();

        -- 2. Swine Records table
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
          created_at TIMESTAMP DEFAULT now()
        );
        ALTER TABLE swine_records ADD COLUMN IF NOT EXISTS computed_pig_id TEXT;
        ALTER TABLE swine_records ADD COLUMN IF NOT EXISTS pig_id_tag TEXT;
        ALTER TABLE swine_records ADD COLUMN IF NOT EXISTS ear_tag_no TEXT;
        ALTER TABLE swine_records ADD COLUMN IF NOT EXISTS farmer_name TEXT;
        ALTER TABLE swine_records ADD COLUMN IF NOT EXISTS farm_name TEXT;
        ALTER TABLE swine_records ADD COLUMN IF NOT EXISTS farmer_contact TEXT;
        ALTER TABLE swine_records ADD COLUMN IF NOT EXISTS barangay TEXT;
        ALTER TABLE swine_records ADD COLUMN IF NOT EXISTS birth_date TEXT;
        ALTER TABLE swine_records ADD COLUMN IF NOT EXISTS age_days INTEGER;
        ALTER TABLE swine_records ADD COLUMN IF NOT EXISTS age_months TEXT;
        ALTER TABLE swine_records ADD COLUMN IF NOT EXISTS estimated_weight_kg TEXT;
        ALTER TABLE swine_records ADD COLUMN IF NOT EXISTS actual_weight_kg TEXT;
        ALTER TABLE swine_records ADD COLUMN IF NOT EXISTS swine_type TEXT DEFAULT 'FATTER_GROWER';
        ALTER TABLE swine_records ADD COLUMN IF NOT EXISTS farm_scale TEXT DEFAULT 'BACKYARD';
        ALTER TABLE swine_records ADD COLUMN IF NOT EXISTS asf_zone TEXT DEFAULT 'RED';
        ALTER TABLE swine_records ADD COLUMN IF NOT EXISTS biosecurity_warning BOOLEAN DEFAULT FALSE;
        ALTER TABLE swine_records ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'HEALTHY';
        ALTER TABLE swine_records ADD COLUMN IF NOT EXISTS ready_to_sell BOOLEAN DEFAULT FALSE;
        ALTER TABLE swine_records ADD COLUMN IF NOT EXISTS price_estimate TEXT;
        ALTER TABLE swine_records ADD COLUMN IF NOT EXISTS photo_url TEXT;
        ALTER TABLE swine_records ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;
        ALTER TABLE swine_records ADD COLUMN IF NOT EXISTS registered_at TEXT;
        ALTER TABLE swine_records ADD COLUMN IF NOT EXISTS custom_fields JSONB;
        ALTER TABLE swine_records ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT now();

        -- 3. Issued Certificates table
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
          created_at TIMESTAMP DEFAULT now()
        );
        ALTER TABLE issued_certificates ADD COLUMN IF NOT EXISTS control_number TEXT;
        ALTER TABLE issued_certificates ADD COLUMN IF NOT EXISTS swine_id TEXT;
        ALTER TABLE issued_certificates ADD COLUMN IF NOT EXISTS farmer_name TEXT;
        ALTER TABLE issued_certificates ADD COLUMN IF NOT EXISTS barangay TEXT;
        ALTER TABLE issued_certificates ADD COLUMN IF NOT EXISTS issue_date TEXT;
        ALTER TABLE issued_certificates ADD COLUMN IF NOT EXISTS purpose TEXT;
        ALTER TABLE issued_certificates ADD COLUMN IF NOT EXISTS destination TEXT;
        ALTER TABLE issued_certificates ADD COLUMN IF NOT EXISTS inspected_by TEXT;
        ALTER TABLE issued_certificates ADD COLUMN IF NOT EXISTS qr_payload TEXT;
        ALTER TABLE issued_certificates ADD COLUMN IF NOT EXISTS valid_until TEXT;
        ALTER TABLE issued_certificates ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'VALID';
        ALTER TABLE issued_certificates ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT now();

        -- 4. Messages table
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
          created_at TIMESTAMP DEFAULT now()
        );

        -- 5. Media Files table
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
          created_at TIMESTAMP DEFAULT now()
        );

        -- 6. System Settings table
        CREATE TABLE IF NOT EXISTS system_settings (
          key TEXT PRIMARY KEY,
          value JSONB,
          updated_at TIMESTAMP DEFAULT now()
        );

        -- 7. Audit Logs table
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
          timestamp TIMESTAMP DEFAULT now()
        );

        -- 8. Registry Schema Metadata table
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
          created_at TIMESTAMP DEFAULT now(),
          updated_at TIMESTAMP DEFAULT now()
        );

        -- Performance indices
        CREATE INDEX IF NOT EXISTS idx_swine_barangay ON swine_records(barangay);
        CREATE INDEX IF NOT EXISTS idx_swine_status ON swine_records(status);
        CREATE INDEX IF NOT EXISTS idx_swine_ready ON swine_records(ready_to_sell);
        CREATE INDEX IF NOT EXISTS idx_certs_barangay ON issued_certificates(barangay);
        CREATE INDEX IF NOT EXISTS idx_certs_control ON issued_certificates(control_number);
        CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_media_category ON media_files(category);
        CREATE INDEX IF NOT EXISTS idx_reg_schema_key ON registry_schema(field_key);
        CREATE INDEX IF NOT EXISTS idx_reg_schema_order ON registry_schema(field_order);
      `);

      // Restore dumped data if using embedded engine and backup exists
      if (global._isPgMem && fs.existsSync(LOCAL_DUMP_PATH)) {
        try {
          const raw = fs.readFileSync(LOCAL_DUMP_PATH, 'utf8');
          const backup = JSON.parse(raw);

          if (Array.isArray(backup.system_settings)) {
            for (const s of backup.system_settings) {
              await client.query(
                `INSERT INTO system_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
                [s.key, typeof s.value === 'string' ? s.value : JSON.stringify(s.value)]
              );
            }
          }

          if (Array.isArray(backup.registry_schema)) {
            for (const r of backup.registry_schema) {
              await client.query(
                `INSERT INTO registry_schema (
                  id, field_key, label, field_type, required, visible, options, field_order, section_id, section_title, help_text, placeholder, default_value, is_fixed, fixed_value, is_auto_generated, auto_gen_type, auto_gen_pattern, auto_gen_prefix
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
                ON CONFLICT (id) DO NOTHING`,
                [
                  r.id, r.field_key || r.fieldKey, r.label, r.field_type || r.fieldType || 'text',
                  r.required ?? false, r.visible ?? true, r.options ? JSON.stringify(r.options) : null,
                  r.field_order ?? r.fieldOrder ?? 0, r.section_id || r.sectionId || 'sec_farm',
                  r.section_title || r.sectionTitle, r.help_text || r.helpText, r.placeholder,
                  r.default_value || r.defaultValue, r.is_fixed ?? r.isFixed ?? false,
                  r.fixed_value || r.fixedValue, r.is_auto_generated ?? r.isAutoGenerated ?? false,
                  r.auto_gen_type || r.autoGenType, r.auto_gen_pattern || r.autoGenPattern,
                  r.auto_gen_prefix || r.autoGenPrefix
                ]
              );
            }
          }

          if (Array.isArray(backup.swine_records)) {
            for (const sw of backup.swine_records) {
              await client.query(
                `INSERT INTO swine_records (
                  id, computed_pig_id, pig_id_tag, ear_tag_no, farmer_name, farm_name, farmer_contact, barangay, birth_date, age_days, age_months, estimated_weight_kg, actual_weight_kg, swine_type, farm_scale, asf_zone, biosecurity_warning, status, ready_to_sell, price_estimate, photo_url, is_archived, registered_at, custom_fields
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
                ON CONFLICT (id) DO NOTHING`,
                [
                  sw.id, sw.computed_pig_id || sw.computedPigId, sw.pig_id_tag || sw.pigIdTag,
                  sw.ear_tag_no || sw.earTagNo, sw.farmer_name || sw.farmerName,
                  sw.farm_name || sw.farmName, sw.farmer_contact || sw.farmerContact,
                  sw.barangay, sw.birth_date || sw.birthDate, sw.age_days ?? sw.ageDays,
                  sw.age_months || sw.ageMonths, sw.estimated_weight_kg || sw.estimatedWeightKg,
                  sw.actual_weight_kg || sw.actualWeightKg, sw.swine_type || sw.swineType,
                  sw.farm_scale || sw.farmScale, sw.asf_zone || sw.asfZone,
                  sw.biosecurity_warning ?? sw.biosecurityWarning ?? false,
                  sw.status, sw.ready_to_sell ?? sw.readyToSell ?? false,
                  sw.price_estimate || sw.priceEstimate, sw.photo_url || sw.photoUrl,
                  sw.is_archived ?? sw.isArchived ?? false, sw.registered_at || sw.registeredAt,
                  sw.custom_fields || sw.customFields ? JSON.stringify(sw.custom_fields || sw.customFields) : null
                ]
              );
            }
          }
        } catch (e: any) {
          console.warn('Notice restoring from local dump:', e.message);
        }
      }

      // Check if registry_schema has any records; if empty, initialize from INITIAL_REGISTRY_FORM_SCHEMA
      const schemaCountRes = await client.query('SELECT COUNT(*) as count FROM registry_schema');
      const count = parseInt(schemaCountRes.rows[0]?.count || '0', 10);
      if (count === 0) {
        let order = 0;
        for (const sec of INITIAL_REGISTRY_FORM_SCHEMA.sections) {
          for (const f of sec.fields) {
            order++;
            await client.query(
              `INSERT INTO registry_schema (
                id, field_key, label, field_type, required, visible, options, field_order,
                section_id, section_title, help_text, placeholder, default_value,
                is_fixed, fixed_value, is_auto_generated, auto_gen_type, auto_gen_pattern, auto_gen_prefix
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
              ON CONFLICT (id) DO NOTHING`,
              [
                f.id,
                f.fieldKey || toFieldKey(f.label, f.id),
                f.label,
                f.type,
                Boolean(f.required),
                f.visible !== false,
                f.options ? JSON.stringify(f.options) : null,
                order,
                sec.id,
                sec.title,
                f.helpText || null,
                f.placeholder || null,
                f.defaultValue ? String(f.defaultValue) : null,
                Boolean(f.isFixed),
                f.fixedValue || null,
                Boolean(f.isAutoGenerated),
                f.autoGenType || null,
                f.autoGenPattern || null,
                f.autoGenPrefix || null,
              ]
            );
          }
        }

        await client.query(
          `INSERT INTO system_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING`,
          ['registry_form_schema', JSON.stringify(INITIAL_REGISTRY_FORM_SCHEMA)]
        );
      }

      console.log('✅ PostgreSQL / Supabase tables verified.');
      return true;
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.warn('PostgreSQL connection notice:', err.message);
    return false;
  }
}

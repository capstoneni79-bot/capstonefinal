import express from 'express';
import { HINUNANGAN_BARANGAYS } from '../data/barangays.ts';
import { ALL_ASF_REGULATIONS } from '../data/asfRegulationsData.ts';
import {
  getAllSwineRecords,
  getSwineRecordById,
  upsertSwineRecord,
  batchUpsertSwineRecords,
  deleteSwineRecordById,
  deleteSwineRecordsByIds,
} from '../db/swine.ts';
import { getAllCertificates, upsertCertificate } from '../db/certificates.ts';
import { getAllUsers, getUserByUsernameOrEmail, upsertUser, deleteUserByUid } from '../db/users.ts';
import { getAllMessages, createMessage, markMessageRead, deleteMessageById } from '../db/messages.ts';
import { getAllMedia, insertMedia, deleteMediaById } from '../db/media.ts';
import { getSystemSetting, setSystemSetting } from '../db/settings.ts';
import { initPostgresTables, pool, testDatabaseConnection, updateDatabaseConnection } from '../db/index.ts';
import {
  getFullRegistrySchemaFromDb,
  syncFullRegistrySchemaToDb,
  upsertSchemaFieldInDb,
  deleteSchemaFieldFromDb,
  getSchemaFieldById,
} from '../db/registrySchema.ts';
import { DEFAULT_SIDEBAR_THEME, INITIAL_REGISTRY_FORM_SCHEMA } from '../data/initialFormSchema.ts';
import { INITIAL_LANDING_CONFIG } from '../data/initialData.ts';
import { DEFAULT_MASTER_CONFIG } from '../data/defaultMasterConfig.ts';
import { interpretSuperAdminConfigCommand } from '../utils/configCommandInterpreter.ts';
import { isValidPhilippinePhoneNumber, normalizePhilippinePhoneNumber } from '../utils/registryFieldUtils.ts';

export function createApp() {
  const app = express();

  const getDatabaseErrorCode = (error: any): string | undefined => {
    const code = error?.code || error?.cause?.code;
    return typeof code === 'string' && /^(?:[0-9A-Z]{5}|ECONNREFUSED|ETIMEDOUT|ENOTFOUND|EHOSTUNREACH|ECONNRESET)$/.test(code)
      ? code
      : undefined;
  };

  const sanitizeDatabaseDiagnostic = (value: unknown): string => String(value ?? '')
    .replace(/(postgres(?:ql)?:\/\/)[^\s/@]+@/gi, '$1[REDACTED]@')
    .replace(/\b(password|service[_ -]?key|api[_ -]?key|jwt|authorization|cookie)\s*[:=]\s*([^\s,;]+)/gi, '$1=[REDACTED]')
    .replace(/\bBearer\s+[^\s,;]+/gi, 'Bearer [REDACTED]');

  const getSwineDatabaseError = (error: any, operation: string) => {
    const causes: any[] = [];
    let current = error;
    while (current && causes.length < 5) {
      causes.push(current);
      current = current.cause;
    }

    const rawCode = causes
      .map(cause => cause?.code)
      .find(code => typeof code === 'string' && code && code !== 'UNKNOWN');
    const code = sanitizeDatabaseDiagnostic(rawCode || 'UNKNOWN');
    const rawMessage = causes
      .map(cause => cause?.message)
      .find(message => typeof message === 'string' && message &&
        !/^Database .* failed \(/i.test(message) &&
        !/^Failed query:/i.test(message))
      || error?.message
      || 'Unknown database error';
    const detail = sanitizeDatabaseDiagnostic(causes.find(cause => cause?.detail)?.detail);
    const hint = sanitizeDatabaseDiagnostic(causes.find(cause => cause?.hint)?.hint);

    const safeMessage = sanitizeDatabaseDiagnostic(rawMessage)
      .replace(/^Database .*? failed \([^)]+\):\s*/i, '')
      .replace(/^Failed query:[\s\S]*/i, 'Unknown database error');

    return {
      success: false,
      error: `Database ${operation} failed (${code}): ${safeMessage || 'Unknown database error'}`,
      database_error_code: code,
      database_error_detail: detail || undefined,
      database_error_hint: hint || undefined,
    };
  };

  const getDatabaseErrorKind = (error: any): string => {
    const causes: any[] = [];
    let current = error;
    while (current && causes.length < 4) {
      causes.push(current);
      current = current.cause;
    }

    const codes = causes.map(cause => String(cause.code || '')).join(' ');
    const messages = causes.map(cause => String(cause.message || '')).join(' ').toLowerCase();
    if (/28P01|28000/.test(codes)) return 'authentication_failed';
    if (/ENOTFOUND|EAI_AGAIN/.test(codes)) return 'host_not_found';
    if (/ECONNREFUSED/.test(codes)) return 'connection_refused';
    if (/ETIMEDOUT|timeout|timed out/.test(`${codes} ${messages}`)) return 'connection_timeout';
    if (/ECONNRESET|EHOSTUNREACH/.test(codes)) return 'network_unreachable';
    if (/certificate|ssl|tls/.test(messages)) return 'tls_error';
    if (/3D000/.test(codes)) return 'database_not_found';
    if (/42501/.test(codes)) return 'permission_denied';
    return 'connection_failed';
  };

  const getConfiguredDatabaseHost = (): string => {
    if (process.env.SQL_HOST?.trim()) return process.env.SQL_HOST.trim();
    const connectionString =
      process.env.DATABASE_URL?.trim() ||
      process.env.SUPABASE_DATABASE_URL?.trim() ||
      process.env.POSTGRES_URL?.trim();
    if (!connectionString) return 'not_configured';
    try {
      return new URL(connectionString).hostname || 'invalid_database_url';
    } catch {
      return 'invalid_database_url';
    }
  };

  // Non-blocking background table verification
  initPostgresTables().catch(err => {
    console.warn('PostgreSQL table check notice:', err?.message || err);
  });

  app.use(express.json({ limit: '30mb' }));
  app.use(express.urlencoded({ extended: true, limit: '30mb' }));

  app.get(['/health', '/api/health'], async (_req, res) => {
    let dbStatus = 'disconnected';
    let recordsCount = 0;
    let databaseErrorCode: string | undefined;
    let databaseErrorKind: string | undefined;
    try {
      const client = await pool.connect();
      dbStatus = 'connected';
      try {
        const countRes = await client.query('SELECT count(*) FROM swine_records');
        recordsCount = parseInt(countRes.rows[0]?.count || '0', 10);
      } catch (err: any) {
        dbStatus = 'schema_error';
        databaseErrorCode = getDatabaseErrorCode(err);
        databaseErrorKind = getDatabaseErrorKind(err);
      } finally {
        client.release();
      }
    } catch (err: any) {
      dbStatus = 'error';
      databaseErrorCode = getDatabaseErrorCode(err);
      databaseErrorKind = getDatabaseErrorKind(err);
    }
    res.json({
      status: 'ok',
      service: 'hinunangan-swine-registry',
      database: dbStatus,
      database_engine: global._isPgMem ? 'memory' : 'postgres',
      database_host: getConfiguredDatabaseHost(),
      database_configured: Boolean(
        process.env.DATABASE_URL?.trim() ||
        process.env.SUPABASE_DATABASE_URL?.trim() ||
        process.env.POSTGRES_URL?.trim() ||
        process.env.SQL_HOST?.trim()
      ),
      ...(databaseErrorCode ? { database_error_code: databaseErrorCode } : {}),
      ...(databaseErrorKind ? { database_error_kind: databaseErrorKind } : {}),
      swine_records_count: recordsCount,
      timestamp: new Date().toISOString(),
    });
  });

  // Regex patterns
  const PIG_ID_TAG_REGEX = /^HIN-\d{4}-\d{4,}$/;

  // Helper to extract authenticated user security context
  function getUserSecurityContext(req: express.Request) {
    const rawRole = (req.headers['x-user-role'] as string) || (req.query.role as string) || '';
    const role = (rawRole === 'super_admin' || rawRole === 'admin' || rawRole === 'focal' || rawRole === 'agent')
      ? rawRole
      : 'guest';
    const barangayId = (req.headers['x-user-barangay-id'] as string) || (req.query.barangay_id as string) || '';
    const assignedBarangay = (req.headers['x-user-assigned-barangay'] as string) || (req.query.assigned_barangay as string) || '';
    const userId = (req.headers['x-user-id'] as string) || (req.query.user_id as string) || '';
    const username = (req.headers['x-user-name'] as string) || (req.query.user_name as string) || (role === 'guest' ? 'Visitor' : 'User');
    const isSuperAdmin = role === 'super_admin';
    const isAdmin = role === 'admin' || role === 'super_admin';
    const isAgent = role === 'agent';
    const isFocal = role === 'focal';
    const isAuthenticated = role !== 'guest';
    return { role, barangayId, assignedBarangay, userId, username, isSuperAdmin, isAdmin, isAgent, isFocal, isAuthenticated };
  }

  // =========================================================================
  // 1. AUTHENTICATION & USER ACCOUNTS (DATABASE-DRIVEN)
  // =========================================================================

  // Login endpoint
  app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password are required.' });
    }

    try {
      const user = await getUserByUsernameOrEmail(username.trim());
      if (!user) {
        return res.status(401).json({ success: false, error: 'Invalid username or password.' });
      }

      if (user.password && user.password !== password.trim()) {
        return res.status(401).json({ success: false, error: 'Invalid username or password.' });
      }

      const safeUser = { ...user };
      delete (safeUser as any).password;

      return res.json({
        success: true,
        user: safeUser,
        role: safeUser.role,
        assignedBarangay: safeUser.assignedBarangay,
      });
    } catch (err: any) {
      console.error('Error during login authentication:', err);
      return res.status(500).json({ success: false, error: 'Database authentication service unavailable.' });
    }
  });

  // Enforce role-based endpoint security for Super Admin resources
  app.all(['/admin/landing-page-cms', '/admin/sidebar-configuration', '/admin/user-accounts'], (req, res) => {
    const user = getUserSecurityContext(req);
    if (!user.isSuperAdmin) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to access this resource.',
      });
    }
    return res.json({ success: true, message: 'Authorized Super Admin resource.' });
  });

  app.all('/admin/registry-form-customization', (req, res) => {
    const user = getUserSecurityContext(req);
    if (!user.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to access this resource.',
      });
    }
    return res.json({ success: true, message: 'Authorized Form Customization resource.' });
  });

  // Get all user accounts (Super Admin only)
  app.get('/api/accounts', async (req, res) => {
    const user = getUserSecurityContext(req);
    if (!user.isSuperAdmin) {
      return res.status(403).json({ success: false, error: 'You do not have permission to access this resource.' });
    }

    try {
      const allUsers = await getAllUsers();
      const sanitized = allUsers.map(u => {
        const copy = { ...u };
        return copy;
      });
      return res.json({ success: true, count: sanitized.length, data: sanitized });
    } catch (err: any) {
      console.error('Error fetching accounts from database:', err);
      return res.status(500).json({ success: false, error: 'Unable to retrieve user accounts from database.' });
    }
  });

  app.get('/api/users', async (req, res) => {
    const user = getUserSecurityContext(req);
    if (!user.isSuperAdmin) {
      return res.status(403).json({ success: false, error: 'You do not have permission to access this resource.' });
    }
    try {
      const allUsers = await getAllUsers();
      return res.json({ success: true, count: allUsers.length, data: allUsers });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: 'Unable to retrieve user accounts from database.' });
    }
  });

  // Create or Update user account (Super Admin only)
  app.post('/api/accounts', async (req, res) => {
    const admin = getUserSecurityContext(req);
    if (!admin.isSuperAdmin) {
      return res.status(403).json({ success: false, error: 'You do not have permission to access this resource.' });
    }

    const payload = req.body;
    if (!payload || !payload.email) {
      return res.status(400).json({ success: false, error: 'User email is required.' });
    }

    try {
      const saved = await upsertUser(payload);
      return res.status(201).json({ success: true, data: saved });
    } catch (err: any) {
      console.error('Error creating user account:', err);
      return res.status(500).json({ success: false, error: 'Failed to save user account to database.' });
    }
  });

  app.put('/api/accounts/:id', async (req, res) => {
    const admin = getUserSecurityContext(req);
    if (!admin.isSuperAdmin) {
      return res.status(403).json({ success: false, error: 'You do not have permission to access this resource.' });
    }

    const { id } = req.params;
    const payload = { ...req.body, id };

    try {
      const saved = await upsertUser(payload);
      return res.json({ success: true, data: saved });
    } catch (err: any) {
      console.error('Error updating user account:', err);
      return res.status(500).json({ success: false, error: 'Failed to update user account in database.' });
    }
  });

  app.delete('/api/accounts/:id', async (req, res) => {
    const admin = getUserSecurityContext(req);
    if (!admin.isSuperAdmin) {
      return res.status(403).json({ success: false, error: 'You do not have permission to access this resource.' });
    }

    const { id } = req.params;
    try {
      await deleteUserByUid(id);
      return res.json({ success: true, message: 'User account removed from database.' });
    } catch (err: any) {
      console.error('Error deleting user account:', err);
      return res.status(500).json({ success: false, error: 'Failed to delete user account from database.' });
    }
  });

  // =========================================================================
  // 2. SWINE RECORDS - STRICT DATABASE SOURCE OF TRUTH
  // =========================================================================

  // Next authoritative Pig ID Generator
  app.get('/api/swine-records/next-id', async (_req, res) => {
    try {
      const currentYear = new Date().getFullYear();
      const { total } = await getAllSwineRecords();
      const nextSequence = String(total + 1).padStart(4, '0');
      const nextPigId = `HIN-${currentYear}-${nextSequence}`;
      return res.json({ success: true, nextPigId });
    } catch (err: any) {
      const fallbackSeq = String(Math.floor(1000 + Math.random() * 9000));
      return res.json({ success: true, nextPigId: `HIN-${new Date().getFullYear()}-${fallbackSeq}` });
    }
  });

  // Helper handler for GET /api/swine-records and /api/swine
  const handleGetSwineRecords = async (req: express.Request, res: express.Response) => {
    const user = getUserSecurityContext(req);
    const requestedBarangay =
      (req.query.filter_barangay as string) ||
      (req.query.barangay as string) ||
      (req.query.barangayId as string);
    const search = req.query.search as string;
    const status = req.query.status as string;
    const readyToSell = req.query.readyToSell !== undefined ? req.query.readyToSell === 'true' : (user.isAgent ? true : undefined);
    const isArchived = req.query.isArchived !== undefined ? req.query.isArchived === 'true' : false;
    const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
    const perPage = req.query.per_page || req.query.perPage ? parseInt((req.query.per_page || req.query.perPage) as string, 10) : undefined;

    // Security check: non-admins cannot query other barangays or 'all'
    if (!user.isAdmin && !user.isAgent) {
      if (
        requestedBarangay &&
        requestedBarangay !== 'all' &&
        requestedBarangay !== user.barangayId &&
        requestedBarangay.toLowerCase() !== user.assignedBarangay.toLowerCase()
      ) {
        return res.status(403).json({
          success: false,
          error: `Access Denied: You are not authorized to view swine records outside your assigned barangay (${user.assignedBarangay || user.barangayId}).`,
        });
      }

      if (requestedBarangay === 'all') {
        return res.status(403).json({
          success: false,
          error: 'Access Denied: Non-admin users cannot query swine records for all barangays.',
        });
      }
    }

    const effectiveBarangay = (user.isAdmin || user.isAgent)
      ? (requestedBarangay && requestedBarangay !== 'all' ? requestedBarangay : undefined)
      : (user.assignedBarangay || user.barangayId);

    try {
      const { records, total } = await getAllSwineRecords({
        barangay: effectiveBarangay,
        search,
        status,
        readyToSell,
        isArchived,
        page,
        perPage,
      });

      return res.json({
        success: true,
        count: records.length,
        total,
        data: records,
        scope: user.isAdmin ? (effectiveBarangay || 'all_permitted') : (user.assignedBarangay || user.barangayId),
      });
    } catch (err: any) {
      const databaseError = getSwineDatabaseError(err, 'query');
      console.error('[SWINE DATABASE ERROR]', databaseError);
      return res.status(500).json(databaseError);
    }
  };

  app.get('/api/swine-records', handleGetSwineRecords);
  app.get('/api/swine', handleGetSwineRecords);

  // Single Swine Record Access API
  const handleGetSingleSwine = async (req: express.Request, res: express.Response) => {
    const user = getUserSecurityContext(req);
    const { id } = req.params;

    try {
      const swine = await getSwineRecordById(id);
      if (!swine) {
        return res.status(404).json({ success: false, error: 'Swine record not found.' });
      }

      if (!user.isAdmin && !user.isAgent) {
        const matchId = Boolean(swine.barangay_id && user.barangayId && swine.barangay_id === user.barangayId);
        const matchName = Boolean(
          swine.barangay && user.assignedBarangay && swine.barangay.toLowerCase() === user.assignedBarangay.toLowerCase()
        );
        if (!matchId && !matchName) {
          return res.status(403).json({
            success: false,
            error: `Access Denied: You are not authorized to view this swine record from Barangay ${swine.barangay}. It is restricted to officers of that barangay.`,
          });
        }
      }

      return res.json({ success: true, data: swine, record: swine });
    } catch (err: any) {
      const databaseError = getSwineDatabaseError(err, 'lookup');
      console.error('[SWINE DATABASE ERROR]', databaseError);
      return res.status(500).json(databaseError);
    }
  };

  app.get('/api/swine-records/:id', handleGetSingleSwine);
  app.get('/api/swine/:id', handleGetSingleSwine);

  // Create Swine Record API
  const handleCreateSwine = async (req: express.Request, res: express.Response) => {
    const user = getUserSecurityContext(req);
    if (user.isAgent) {
      return res.status(403).json({ success: false, error: 'Access Denied: Agent accounts are view-only.' });
    }

    const record = req.body;
    if (!record || typeof record !== 'object') {
      return res.status(400).json({ success: false, error: 'Invalid record payload' });
    }

    const { farmerContact, pigIdTag, earTagNo, birthDate } = record;
    if (farmerContact && !isValidPhilippinePhoneNumber(farmerContact)) {
      return res.status(400).json({
        success: false,
        field: 'farmerContact',
        error: 'Contact number must contain exactly 10 digits after +63. Example: +63 912 591 8781.',
      });
    }
    if (farmerContact) record.farmerContact = normalizePhilippinePhoneNumber(farmerContact);

    let tag = (pigIdTag || earTagNo || '').trim();
    if (!tag) {
      // Auto-generate authoritative ID if not supplied
      const currentYear = new Date().getFullYear();
      const { total } = await getAllSwineRecords();
      tag = `HIN-${currentYear}-${String(total + 1).padStart(4, '0')}`;
    }

    if (tag && !PIG_ID_TAG_REGEX.test(tag)) {
      return res.status(400).json({
        success: false,
        field: 'pigIdTag',
        error: 'Invalid Pig ID Tag format. Expected format: HIN-YYYY-XXXX (e.g. HIN-2026-0001).',
      });
    }

    const effectiveBirthDate = birthDate || record.date_of_birth || record.dateOfBirth || record.dob;
    if (effectiveBirthDate) {
      const bDate = new Date(effectiveBirthDate);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (bDate.getTime() > today.getTime()) {
        return res.status(400).json({
          success: false,
          field: 'birthDate',
          error: 'Date of birth cannot be in the future.',
        });
      }
    }

    if (!user.isAdmin && user.assignedBarangay) {
      if (record.barangay && record.barangay.trim().toLowerCase() !== user.assignedBarangay.trim().toLowerCase()) {
        return res.status(403).json({
          success: false,
          error: `Forbidden: Focal persons can only register swine records for their assigned barangay (${user.assignedBarangay}).`
        });
      }
      record.barangay = user.assignedBarangay;
      if (user.barangayId) record.barangay_id = user.barangayId;
    }

    const newRec = {
      ...record,
      id: record.id || `swine-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      pigIdTag: tag,
      earTagNo: tag,
      registeredBy: user.username,
      registeredAt: record.registeredAt || new Date().toISOString(),
    };

    try {
      const saved = await upsertSwineRecord(newRec);
      return res.status(201).json({ success: true, data: saved, record: saved });
    } catch (err: any) {
      const databaseError = getSwineDatabaseError(err, 'save');
      console.error('[SWINE DATABASE ERROR]', databaseError);
      return res.status(500).json(databaseError);
    }
  };

  app.post('/api/swine-records', handleCreateSwine);
  app.post('/api/swine', handleCreateSwine);

  // Update Swine Record API
  const handleUpdateSwine = async (req: express.Request, res: express.Response) => {
    const user = getUserSecurityContext(req);
    if (user.isAgent) {
      return res.status(403).json({ success: false, error: 'Access Denied: Agent accounts are view-only.' });
    }

    const { id } = req.params;
    const record = req.body;

    const { farmerContact, birthDate } = record || {};
    if (farmerContact && !isValidPhilippinePhoneNumber(farmerContact)) {
      return res.status(400).json({
        success: false,
        field: 'farmerContact',
        error: 'Contact number must contain exactly 10 digits after +63 and start with 9 (e.g. +63 912 345 6789).',
      });
    }
    if (farmerContact) record.farmerContact = normalizePhilippinePhoneNumber(farmerContact);

    const effectiveBirthDate = birthDate || record.date_of_birth || record.dateOfBirth || record.dob;
    if (effectiveBirthDate) {
      const bDate = new Date(effectiveBirthDate);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (bDate.getTime() > today.getTime()) {
        return res.status(400).json({
          success: false,
          field: 'birthDate',
          error: 'Date of birth cannot be in the future.',
        });
      }
    }

    try {
      const existing = await getSwineRecordById(id);
      if (!existing) {
        return res.status(404).json({ success: false, error: 'Swine record not found.' });
      }

      if (!user.isAdmin && user.assignedBarangay) {
        if (existing.barangay && existing.barangay.trim().toLowerCase() !== user.assignedBarangay.trim().toLowerCase()) {
          return res.status(403).json({
            success: false,
            error: `Forbidden: Focal persons cannot modify records outside their assigned barangay (${user.assignedBarangay}).`
          });
        }
        if (record.barangay && record.barangay.trim().toLowerCase() !== user.assignedBarangay.trim().toLowerCase()) {
          return res.status(403).json({
            success: false,
            error: `Forbidden: Focal persons cannot reassign records to another barangay.`
          });
        }
      }

      // Preserve immutable Pig ID
      const preservedPigId = existing.pigIdTag || (existing as any).computedPigId || existing.earTagNo;
      const updated = {
        ...existing,
        ...record,
        id,
        pigIdTag: preservedPigId || record.pigIdTag,
        earTagNo: preservedPigId || record.earTagNo,
      };

      const saved = await upsertSwineRecord(updated);
      return res.json({ success: true, data: saved, record: saved });
    } catch (err: any) {
      const databaseError = getSwineDatabaseError(err, 'save');
      console.error('[SWINE DATABASE ERROR]', databaseError);
      return res.status(500).json(databaseError);
    }
  };

  app.put('/api/swine-records/:id', handleUpdateSwine);
  app.put('/api/swine/:id', handleUpdateSwine);

  // Toggle Sell Status API
  const handleToggleSell = async (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    const { readyToSell, priceEstimate } = req.body || {};

    try {
      const existing = await getSwineRecordById(id);
      if (!existing) {
        return res.status(404).json({ success: false, error: 'Swine record not found.' });
      }

      const updated = {
        ...existing,
        readyToSell: Boolean(readyToSell),
        status: readyToSell ? 'ready_to_sell' : (existing.status === 'ready_to_sell' ? 'healthy' : existing.status),
        priceEstimate: priceEstimate !== undefined ? String(priceEstimate) : existing.estimatedPricePhp,
      };

      const saved = await upsertSwineRecord(updated);
      return res.json({ success: true, data: saved, record: saved });
    } catch (err: any) {
      const databaseError = getSwineDatabaseError(err, 'save');
      console.error('[SWINE DATABASE ERROR]', databaseError);
      return res.status(500).json(databaseError);
    }
  };

  app.patch('/api/swine-records/:id/sell', handleToggleSell);
  app.patch('/api/swine/:id/sell', handleToggleSell);

  // Delete Swine Record API (Admin only)
  const handleDeleteSwine = async (req: express.Request, res: express.Response) => {
    const user = getUserSecurityContext(req);
    if (!user.isAdmin) {
      return res.status(403).json({ success: false, error: 'Access Denied: Only administrators can delete swine records.' });
    }
    const { id } = req.params;
    try {
      await deleteSwineRecordById(id);
      return res.json({ success: true, message: 'Swine record deleted successfully.' });
    } catch (err: any) {
      const databaseError = getSwineDatabaseError(err, 'delete');
      console.error('[SWINE DATABASE ERROR]', databaseError);
      return res.status(500).json(databaseError);
    }
  };

  app.delete('/api/swine-records/:id', handleDeleteSwine);
  app.delete('/api/swine/:id', handleDeleteSwine);

  // Bulk Delete Swine Records API (Admin only)
  const handleBulkDeleteSwine = async (req: express.Request, res: express.Response) => {
    const user = getUserSecurityContext(req);
    if (!user.isAdmin) {
      return res.status(403).json({ success: false, error: 'Access Denied: Only administrators can delete swine records.' });
    }
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: 'Invalid or empty IDs list.' });
    }
    try {
      const deletedCount = await deleteSwineRecordsByIds(ids);
      return res.json({ success: true, deletedCount });
    } catch (err: any) {
      const databaseError = getSwineDatabaseError(err, 'bulk delete');
      console.error('[SWINE DATABASE ERROR]', databaseError);
      return res.status(500).json(databaseError);
    }
  };

  app.post('/api/swine-records/bulk-delete', handleBulkDeleteSwine);
  app.post('/api/swine/bulk-delete', handleBulkDeleteSwine);

  // Batch Import Swine Records API
  const handleBatchImportSwine = async (req: express.Request, res: express.Response) => {
    const user = getUserSecurityContext(req);
    if (user.isAgent) {
      return res.status(403).json({ success: false, error: 'Access Denied: Agent accounts cannot import records.' });
    }

    const { records, fileName, duplicateHandling, newFieldsCreated } = req.body;
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ success: false, error: 'No swine records provided for import.' });
    }

    try {
      const savedRecords = await batchUpsertSwineRecords(records);

      // Record audit history if system settings table is available
      try {
        const histKey = 'swine_import_audit_history';
        const existingHist = (await getSystemSetting(histKey)) || [];
        const newHistEntry = {
          batchId: `BATCH-${Date.now()}`,
          fileName: fileName || 'Import.xlsx',
          importedBy: user.username || 'System Admin',
          importedAt: new Date().toISOString(),
          recordCount: savedRecords.length,
          newFields: newFieldsCreated || [],
          duplicatePolicy: duplicateHandling || 'update',
        };
        await setSystemSetting(histKey, [newHistEntry, ...(Array.isArray(existingHist) ? existingHist.slice(0, 30) : [])]);
      } catch (histErr) {
        console.warn('Import audit history recording notice:', histErr);
      }

      return res.status(200).json({
        success: true,
        count: savedRecords.length,
        data: savedRecords,
        message: `Successfully imported ${savedRecords.length} swine records.`,
      });
    } catch (err: any) {
      const databaseError = getSwineDatabaseError(err, 'batch save');
      console.error('[SWINE DATABASE ERROR]', databaseError);
      return res.status(500).json(databaseError);
    }
  };

  app.post('/api/swine-records/import', handleBatchImportSwine);
  app.post('/api/swine/import', handleBatchImportSwine);

  // =========================================================================
  // 3. FARMERS API (DATABASE-DERIVED)
  // =========================================================================
  app.get('/api/farmers', async (req, res) => {
    const user = getUserSecurityContext(req);
    const effectiveBarangay = user.isAdmin ? undefined : (user.assignedBarangay || user.barangayId);

    try {
      const { records } = await getAllSwineRecords({
        barangay: effectiveBarangay,
      });

      const farmerMap: Record<string, any> = {};

      records.forEach(r => {
        const key = `${(r.farmerName || '').trim().toLowerCase()}_${(r.barangay || '').trim().toLowerCase()}`;
        if (!farmerMap[key]) {
          farmerMap[key] = {
            id: `frm-${r.id}`,
            farmerName: r.farmerName,
            contactNumber: r.farmerContact || 'Not provided',
            address: r.farmerAddress || r.farmName || r.barangay,
            barangay: r.barangay,
            barangayId: r.barangay_id,
            farmScale: r.farmScale,
            farmType: r.farmType,
            swineCount: 0,
            readyToSellCount: 0,
            pigs: [],
            biosecurity: r.biosecurity,
            status: 'ACTIVE',
            registeredAt: r.registeredAt,
          };
        }
        farmerMap[key].swineCount += 1;
        if (r.readyToSell || r.status === 'ready_to_sell') {
          farmerMap[key].readyToSellCount += 1;
        }
        farmerMap[key].pigs.push({
          id: r.id,
          pigIdTag: r.pigIdTag,
          breed: r.breed,
          swineType: r.swineType,
          status: r.status,
          readyToSell: r.readyToSell,
        });
      });

      const farmerList = Object.values(farmerMap);
      return res.json({
        success: true,
        count: farmerList.length,
        data: farmerList,
      });
    } catch (err: any) {
      console.error('Error fetching farmers from database:', err);
      return res.status(500).json({
        success: false,
        error: 'Unable to retrieve farmers from database.',
      });
    }
  });

  // =========================================================================
  // 4. BARANGAYS API (DATABASE-ENRICHED REAL-TIME STATISTICS)
  // =========================================================================
  app.get('/api/barangays', async (_req, res) => {
    try {
      const { records } = await getAllSwineRecords();

      const countsByBarangay: Record<string, { totalSwine: number; readyToSell: number; farmers: Set<string> }> = {};

      records.forEach(r => {
        const bName = (r.barangay || '').trim().toLowerCase();
        if (!countsByBarangay[bName]) {
          countsByBarangay[bName] = { totalSwine: 0, readyToSell: 0, farmers: new Set() };
        }
        countsByBarangay[bName].totalSwine += 1;
        if (r.readyToSell || r.status === 'ready_to_sell') {
          countsByBarangay[bName].readyToSell += 1;
        }
        if (r.farmerName) {
          countsByBarangay[bName].farmers.add(r.farmerName.trim().toLowerCase());
        }
      });

      const enrichedBarangays = HINUNANGAN_BARANGAYS.map(b => {
        const stats = countsByBarangay[b.name.toLowerCase()] || { totalSwine: 0, readyToSell: 0, farmers: new Set() };
        return {
          ...b,
          registeredSwineCount: stats.totalSwine,
          registeredFarmerCount: stats.farmers.size,
          readyToSellCount: stats.readyToSell,
          asfZone: b.defaultRiskLevel.toUpperCase(),
        };
      });

      return res.json({
        success: true,
        count: enrichedBarangays.length,
        data: enrichedBarangays,
      });
    } catch (err: any) {
      console.error('Error computing barangay statistics:', err);
      return res.json({ success: true, count: HINUNANGAN_BARANGAYS.length, data: HINUNANGAN_BARANGAYS });
    }
  });

  // =========================================================================
  // 5. DASHBOARD & GIS STATISTICS API (DATABASE-DRIVEN)
  // =========================================================================
  app.get('/api/dashboard/stats', async (req, res) => {
    const user = getUserSecurityContext(req);
    const effectiveBarangay = user.isAdmin ? undefined : (user.assignedBarangay || user.barangayId);

    try {
      const { records, total } = await getAllSwineRecords({
        barangay: effectiveBarangay,
      });

      const farmersSet = new Set<string>();
      const barangaysWithPigs = new Set<string>();
      let healthyCount = 0;
      let quarantinedCount = 0;
      let sickCount = 0;
      let readyToSellCount = 0;
      let backyardCount = 0;
      let commercialCount = 0;

      const swineByType: Record<string, number> = {};
      const swineByBarangay: Record<string, number> = {};
      const asfDistribution: Record<string, number> = { GREEN: 0, YELLOW: 0, RED: 0, PINK: 0 };
      const monthlyRegistrations: Record<string, number> = {};

      records.forEach(r => {
        if (r.farmerName) farmersSet.add(`${r.farmerName.trim().toLowerCase()}_${r.barangay}`);
        if (r.barangay) {
          barangaysWithPigs.add(r.barangay);
          swineByBarangay[r.barangay] = (swineByBarangay[r.barangay] || 0) + 1;
        }

        const st = (r.status || 'healthy').toLowerCase();
        if (st === 'healthy') healthyCount++;
        else if (st === 'quarantined') quarantinedCount++;
        else if (st === 'sick') sickCount++;

        if (r.readyToSell || st === 'ready_to_sell') readyToSellCount++;

        if ((r.farmScale || '').toUpperCase() === 'BACKYARD') backyardCount++;
        else commercialCount++;

        const type = (r.swineType || 'grower').toLowerCase();
        swineByType[type] = (swineByType[type] || 0) + 1;

        const zone = (r.asfZone || 'RED').toUpperCase();
        asfDistribution[zone] = (asfDistribution[zone] || 0) + 1;

        if (r.registeredAt) {
          const monthKey = r.registeredAt.substring(0, 7); // YYYY-MM
          monthlyRegistrations[monthKey] = (monthlyRegistrations[monthKey] || 0) + 1;
        }
      });

      const stats = {
        totalSwine: total,
        totalFarmers: farmersSet.size,
        totalBarangays: user.isAdmin ? HINUNANGAN_BARANGAYS.length : 1,
        activeBarangaysWithSwine: barangaysWithPigs.size,
        healthySwine: healthyCount,
        quarantinedSwine: quarantinedCount,
        sickSwine: sickCount,
        readyToSell: readyToSellCount,
        backyardFarms: backyardCount,
        commercialFarms: commercialCount,
        swineByType,
        swineByBarangay,
        asfDistribution,
        monthlyRegistrations,
      };

      return res.json({ success: true, data: stats, scope: user.isAdmin ? 'all' : user.assignedBarangay });
    } catch (err: any) {
      console.error('Error computing dashboard statistics:', err);
      return res.status(500).json({ success: false, error: 'Unable to retrieve dashboard statistics from database.' });
    }
  });

  app.get('/api/swine-records/stats/summary', async (req, res) => {
    const user = getUserSecurityContext(req);
    const effectiveBarangay = user.isAdmin ? undefined : (user.assignedBarangay || user.barangayId);

    try {
      const { records } = await getAllSwineRecords({
        barangay: effectiveBarangay,
      });

      const summary = {
        totalHogs: records.length,
        healthyHogs: records.filter(s => (s.status || '').toLowerCase() === 'healthy').length,
        underMonitoring: records.filter(s => (s.status || '').toLowerCase() === 'quarantined' || (s.status || '').toLowerCase() === 'sick').length,
        suspectedASF: records.filter(s => (s.status || '').toLowerCase() === 'sick').length,
        readyToSell: records.filter(s => s.readyToSell || s.status === 'ready_to_sell').length,
        backyardFarms: records.filter(s => (s.farmScale || '').toUpperCase() === 'BACKYARD').length,
        commercialFarms: records.filter(s => (s.farmScale || '').toUpperCase() !== 'BACKYARD').length,
        byBarangay: {} as Record<string, number>,
      };

      records.forEach(s => {
        const b = s.barangay || 'Unknown';
        summary.byBarangay[b] = (summary.byBarangay[b] || 0) + 1;
      });

      return res.json({
        success: true,
        data: summary,
        scope: user.isAdmin ? 'all_permitted' : (user.assignedBarangay || user.barangayId),
      });
    } catch (err: any) {
      const databaseError = getSwineDatabaseError(err, 'query');
      console.error('[SWINE DATABASE ERROR]', databaseError);
      return res.status(500).json(databaseError);
    }
  });

  // Database configuration test & update endpoints
  app.post('/api/admin/database/test', async (req, res) => {
    const { connectionString } = req.body || {};
    if (!connectionString) {
      return res.status(400).json({ success: false, error: 'Connection string is required.' });
    }
    const result = await testDatabaseConnection(connectionString.trim());
    return res.json(result);
  });

  app.post('/api/admin/database/save', async (req, res) => {
    const { connectionString } = req.body || {};
    if (!connectionString) {
      return res.status(400).json({ success: false, error: 'Connection string is required.' });
    }
    const result = await updateDatabaseConnection(connectionString.trim());
    return res.json(result);
  });

  // =========================================================================
  // 6. CERTIFICATES & MOVEMENT PERMITS (DATABASE-DRIVEN)
  // =========================================================================
  app.get('/api/certificates', async (req, res) => {
    const user = getUserSecurityContext(req);
    const requestedBarangay = (req.query.filter_barangay as string) || (req.query.barangay as string);

    try {
      const dbCerts = await getAllCertificates();
      let list = dbCerts;

      if (!user.isAdmin) {
        list = list.filter((c: any) => {
          const matchId = Boolean(c.barangay_id && user.barangayId && c.barangay_id === user.barangayId);
          const matchName = Boolean(
            c.farmerBarangay && user.assignedBarangay && c.farmerBarangay.toLowerCase() === user.assignedBarangay.toLowerCase()
          );
          const matchIssuer = Boolean(
            c.issuingBarangay && user.assignedBarangay && c.issuingBarangay.toLowerCase() === user.assignedBarangay.toLowerCase()
          );
          return matchId || matchName || matchIssuer;
        });
      } else if (requestedBarangay && requestedBarangay !== 'all') {
        list = list.filter((c: any) => (c.barangay || '').toLowerCase() === requestedBarangay.toLowerCase());
      }

      return res.json({ success: true, count: list.length, data: list });
    } catch (err: any) {
      console.error('Error fetching certificates:', err);
      return res.status(500).json({ success: false, error: 'Unable to retrieve certificates from database.' });
    }
  });

  app.post('/api/certificates', async (req, res) => {
    const user = getUserSecurityContext(req);
    const cert = req.body;

    if (!cert || (!cert.controlNumber && !cert.certificateNo)) {
      return res.status(400).json({ success: false, error: 'Invalid certificate payload' });
    }

    if (!user.isAdmin && user.assignedBarangay) {
      cert.barangay = user.assignedBarangay;
      cert.farmerBarangay = user.assignedBarangay;
      cert.issuingBarangay = user.assignedBarangay;
    }

    try {
      const saved = await upsertCertificate({
        ...cert,
        id: cert.id || `cert-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      });
      return res.status(201).json({ success: true, data: saved });
    } catch (err: any) {
      console.error('Error issuing certificate:', err);
      return res.status(500).json({ success: false, error: 'Failed to issue certificate to database.' });
    }
  });

  // =========================================================================
  // 7. MESSAGES (DATABASE-DRIVEN)
  // =========================================================================
  app.get('/api/messages', async (req, res) => {
    const user = getUserSecurityContext(req);
    try {
      const list = await getAllMessages({
        role: user.role,
        barangay: user.assignedBarangay,
        userId: user.userId,
      });
      return res.json({ success: true, count: list.length, data: list });
    } catch (err: any) {
      console.warn('Error retrieving messages from database:', err?.message || err);
      return res.json({ success: true, count: 0, data: [] });
    }
  });

  app.post('/api/messages', async (req, res) => {
    const user = getUserSecurityContext(req);
    const payload = req.body;
    if (!payload || !payload.message) {
      return res.status(400).json({ success: false, error: 'Message content is required.' });
    }

    try {
      const newMsg = await createMessage({
        ...payload,
        senderId: user.userId,
        senderName: user.username,
        senderRole: user.role as any,
        barangay: user.assignedBarangay,
      });
      return res.status(201).json({ success: true, data: newMsg });
    } catch (err: any) {
      console.error('Error creating message:', err);
      return res.status(500).json({ success: false, error: 'Failed to send message.' });
    }
  });

  app.patch('/api/messages/:id/read', async (req, res) => {
    const { id } = req.params;
    try {
      await markMessageRead(id);
      return res.json({ success: true, message: 'Message marked as read.' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: 'Failed to update message.' });
    }
  });

  app.delete('/api/messages/:id', async (req, res) => {
    const { id } = req.params;
    try {
      await deleteMessageById(id);
      return res.json({ success: true, message: 'Message deleted.' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: 'Failed to delete message.' });
    }
  });

  // =========================================================================
  // 8. MEDIA FILES & UPLOAD (DATABASE-DRIVEN)
  // =========================================================================
  app.get('/api/media', async (req, res) => {
    const category = req.query.category as string;
    try {
      const items = await getAllMedia(category);
      return res.json({ success: true, count: items.length, data: items });
    } catch (err: any) {
      console.error('Error fetching media:', err);
      return res.status(500).json({ success: false, error: 'Unable to retrieve media from database.' });
    }
  });

  app.post('/api/media/upload', async (req, res) => {
    const user = getUserSecurityContext(req);
    const { fileName, fileUrl, base64, mimeType, fileSize, category, altText } = req.body || {};

    const resolvedUrl = fileUrl || base64;
    if (!resolvedUrl) {
      return res.status(400).json({ success: false, error: 'Image fileUrl or base64 payload is required.' });
    }

    try {
      const item = await insertMedia({
        fileName: fileName || `media-${Date.now()}`,
        fileUrl: resolvedUrl,
        mimeType: mimeType || 'image/jpeg',
        fileSize: fileSize || (typeof resolvedUrl === 'string' ? resolvedUrl.length : 0),
        category: category || 'OTHER',
        altText: altText || fileName || 'Uploaded media asset',
        uploadedBy: user.username,
      });

      return res.status(201).json({ success: true, data: item, fileUrl: item.fileUrl });
    } catch (err: any) {
      console.error('Error uploading media:', err);
      return res.status(500).json({ success: false, error: 'Failed to save media record to database.' });
    }
  });

  app.post('/api/media', async (req, res) => {
    const user = getUserSecurityContext(req);
    const { fileName, fileUrl, base64, category, altText } = req.body || {};
    const resolvedUrl = fileUrl || base64;
    if (!resolvedUrl) {
      return res.status(400).json({ success: false, error: 'fileUrl or base64 is required.' });
    }
    try {
      const item = await insertMedia({
        fileName: fileName || `media-${Date.now()}`,
        fileUrl: resolvedUrl,
        category: category || 'OTHER',
        altText: altText || fileName,
        uploadedBy: user.username,
      });
      return res.status(201).json({ success: true, data: item });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: 'Failed to save media.' });
    }
  });

  app.delete('/api/media/:id', async (req, res) => {
    const admin = getUserSecurityContext(req);
    if (!admin.isAdmin) {
      return res.status(403).json({ success: false, error: 'Access Denied: Only administrators can delete media.' });
    }
    const { id } = req.params;
    try {
      await deleteMediaById(id);
      return res.json({ success: true, message: 'Media removed from database.' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: 'Failed to delete media.' });
    }
  });

  // =========================================================================
  // 9. SYSTEM SETTINGS, CMS & CUSTOM FORMS (DATABASE-DRIVEN)
  // =========================================================================
  app.get('/api/settings', async (req, res) => {
    const key = (req.query.key as string) || 'system_branding';
    try {
      const value = await getSystemSetting(key);
      return res.json({ success: true, key, value });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: 'Unable to retrieve settings from database.' });
    }
  });

  app.put('/api/settings', async (req, res) => {
    const admin = getUserSecurityContext(req);
    if (!admin.isAdmin) {
      return res.status(403).json({ success: false, error: 'Access Denied: Only administrators can update system settings.' });
    }
    const { key, value } = req.body || {};
    if (!key) {
      return res.status(400).json({ success: false, error: 'Setting key is required.' });
    }
    try {
      const saved = await setSystemSetting(key, value);
      return res.json({ success: true, key, value: saved });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: 'Failed to update system settings.' });
    }
  });

  app.get('/api/landing-config', async (_req, res) => {
    try {
      const config = await getSystemSetting('landing_page_config', INITIAL_LANDING_CONFIG);
      return res.json({ success: true, config, data: config });
    } catch {
      return res.json({ success: true, config: INITIAL_LANDING_CONFIG, data: INITIAL_LANDING_CONFIG });
    }
  });

  app.put('/api/landing-config', async (req, res) => {
    const user = getUserSecurityContext(req);
    if (!user.isSuperAdmin) {
      return res.status(403).json({ success: false, error: 'You do not have permission to access this resource.' });
    }
    try {
      const config = await setSystemSetting('landing_page_config', req.body);
      return res.json({ success: true, config, data: config });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: 'Failed to update landing page config in database.' });
    }
  });

  // Alias for /api/landing/settings (GET, PUT, POST)
  app.get('/api/landing/settings', async (_req, res) => {
    try {
      const config = await getSystemSetting('landing_page_config', INITIAL_LANDING_CONFIG);
      return res.json({ success: true, config, data: config });
    } catch {
      return res.json({ success: true, config: INITIAL_LANDING_CONFIG, data: INITIAL_LANDING_CONFIG });
    }
  });

  app.put('/api/landing/settings', async (req, res) => {
    const user = getUserSecurityContext(req);
    if (!user.isSuperAdmin) {
      return res.status(403).json({ success: false, error: 'You do not have permission to access this resource.' });
    }
    try {
      const config = await setSystemSetting('landing_page_config', req.body);
      return res.json({ success: true, config, data: config });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: 'Failed to update landing page config in database.' });
    }
  });

  app.post('/api/landing/settings', async (req, res) => {
    const user = getUserSecurityContext(req);
    if (!user.isSuperAdmin) {
      return res.status(403).json({ success: false, error: 'You do not have permission to access this resource.' });
    }
    try {
      const config = await setSystemSetting('landing_page_config', req.body);
      return res.json({ success: true, config, data: config });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: 'Failed to update landing page config in database.' });
    }
  });

  app.get('/api/admin/sidebar-theme', async (_req, res) => {
    try {
      const theme = await getSystemSetting('sidebar_theme', DEFAULT_SIDEBAR_THEME);
      return res.json({ success: true, theme });
    } catch {
      return res.json({ success: true, theme: DEFAULT_SIDEBAR_THEME });
    }
  });

  app.put('/api/admin/sidebar-theme', async (req, res) => {
    const admin = getUserSecurityContext(req);
    if (!admin.isSuperAdmin) {
      return res.status(403).json({ success: false, error: 'You do not have permission to access this resource.' });
    }
    try {
      const theme = await setSystemSetting('sidebar_theme', req.body);
      return res.json({ success: true, theme });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: 'Failed to update sidebar theme in database.' });
    }
  });

  // =========================================================================
  // 10. SUPER ADMIN MASTER CONFIGURATION & SYSTEM APPEARANCE
  // =========================================================================
  app.get('/api/config/master', async (_req, res) => {
    try {
      const config = (await getSystemSetting('master_system_config', DEFAULT_MASTER_CONFIG)) || DEFAULT_MASTER_CONFIG;
      const versions = (await getSystemSetting('master_config_versions', [])) || [];
      const auditLogs = (await getSystemSetting('master_config_audit_logs', [])) || [];
      return res.json({ success: true, config, versions, auditLogs });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: 'Failed to retrieve master configuration.' });
    }
  });

  app.post('/api/config/master/draft', async (req, res) => {
    try {
      const { draft } = req.body || {};
      if (draft) {
        await setSystemSetting('master_system_config_draft', draft);
      }
      return res.json({ success: true, message: 'Draft configuration saved.' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: 'Failed to persist draft configuration.' });
    }
  });

  app.post('/api/config/master/publish', async (req, res) => {
    const user = getUserSecurityContext(req);
    if (!user.isSuperAdmin) {
      return res.status(403).json({ success: false, error: 'You do not have permission to access this resource.' });
    }

    try {
      const { config, summary, updatedBy } = req.body || {};
      if (!config) {
        return res.status(400).json({ success: false, error: 'Configuration data is required.' });
      }

      const currentConfig = (await getSystemSetting('master_system_config', DEFAULT_MASTER_CONFIG)) || DEFAULT_MASTER_CONFIG;
      const currentVersions = (await getSystemSetting('master_config_versions', [])) || [];
      const currentLogs = (await getSystemSetting('master_config_audit_logs', [])) || [];

      const nextVersion = (currentConfig.version || 1) + 1;
      const now = new Date().toISOString();
      const author = updatedBy || user.username || 'Super Admin';

      const published = {
        ...config,
        version: nextVersion,
        updatedAt: now,
        updatedBy: author,
      };

      await setSystemSetting('master_system_config', published);
      await setSystemSetting('master_system_config_draft', published);

      // Version snapshot
      const versionEntry = {
        version: nextVersion,
        publishedAt: now,
        publishedBy: author,
        summary: summary || 'Published master appearance & role configurations',
        snapshot: published,
      };
      currentVersions.unshift(versionEntry);
      await setSystemSetting('master_config_versions', currentVersions);

      // Audit log
      const auditEntry = {
        id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        who: author,
        what: summary || `Published configuration version v${nextVersion}`,
        oldValue: `v${currentConfig.version || 1}`,
        newValue: `v${nextVersion}`,
        targetRole: 'Master Configuration',
        targetComponent: 'Full Theme Canvas',
        timestamp: now,
      };
      currentLogs.unshift(auditEntry);
      await setSystemSetting('master_config_audit_logs', currentLogs);

      return res.json({ success: true, config: published, version: nextVersion });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: 'Failed to publish master configuration.' });
    }
  });

  app.get('/api/config/master/versions', async (_req, res) => {
    try {
      const versions = (await getSystemSetting('master_config_versions', [])) || [];
      return res.json({ success: true, versions });
    } catch {
      return res.json({ success: true, versions: [] });
    }
  });

  app.post('/api/config/master/restore/:version', async (req, res) => {
    const user = getUserSecurityContext(req);
    if (!user.isSuperAdmin) {
      return res.status(403).json({ success: false, error: 'You do not have permission to access this resource.' });
    }

    try {
      const targetVer = parseInt(req.params.version, 10);
      const versions = (await getSystemSetting('master_config_versions', [])) || [];
      const match = versions.find((v: any) => v.version === targetVer);
      if (!match || !match.snapshot) {
        return res.status(404).json({ success: false, error: `Version v${targetVer} not found in rollback history.` });
      }

      const currentConfig = (await getSystemSetting('master_system_config', DEFAULT_MASTER_CONFIG)) || DEFAULT_MASTER_CONFIG;
      const currentLogs = (await getSystemSetting('master_config_audit_logs', [])) || [];
      const nextVersion = (currentConfig.version || 1) + 1;
      const now = new Date().toISOString();
      const author = user.username || 'Super Admin';

      const restored = {
        ...match.snapshot,
        version: nextVersion,
        updatedAt: now,
        updatedBy: `${author} (Restored from v${targetVer})`,
      };

      await setSystemSetting('master_system_config', restored);
      await setSystemSetting('master_system_config_draft', restored);

      // Add version entry
      versions.unshift({
        version: nextVersion,
        publishedAt: now,
        publishedBy: author,
        summary: `Restored baseline from v${targetVer}`,
        snapshot: restored,
      });
      await setSystemSetting('master_config_versions', versions);

      // Audit log
      currentLogs.unshift({
        id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        who: author,
        what: `Restored Configuration from Version v${targetVer}`,
        oldValue: `v${currentConfig.version || 1}`,
        newValue: `v${nextVersion}`,
        targetRole: 'Master Configuration',
        targetComponent: 'Full Rollback',
        timestamp: now,
      });
      await setSystemSetting('master_config_audit_logs', currentLogs);

      return res.json({ success: true, config: restored, version: nextVersion });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: 'Failed to restore configuration version.' });
    }
  });

  app.get('/api/config/master/audit-logs', async (_req, res) => {
    try {
      const auditLogs = (await getSystemSetting('master_config_audit_logs', [])) || [];
      return res.json({ success: true, auditLogs });
    } catch {
      return res.json({ success: true, auditLogs: [] });
    }
  });

  app.post('/api/config/master/audit-log', async (req, res) => {
    try {
      const entry = req.body;
      if (entry && entry.what) {
        const currentLogs = (await getSystemSetting('master_config_audit_logs', [])) || [];
        currentLogs.unshift({
          ...entry,
          id: entry.id || `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          timestamp: entry.timestamp || new Date().toISOString(),
        });
        await setSystemSetting('master_config_audit_logs', currentLogs);
      }
      return res.json({ success: true });
    } catch {
      return res.json({ success: false });
    }
  });

  // Registry Schema Endpoints (GET, POST, PUT, DELETE)
  app.get(['/api/admin/registry-form-schema', '/api/registry-schema'], async (_req, res) => {
    try {
      const schema = await getFullRegistrySchemaFromDb();
      return res.json({ success: true, schema, data: schema });
    } catch {
      return res.json({ success: true, schema: INITIAL_REGISTRY_FORM_SCHEMA, data: INITIAL_REGISTRY_FORM_SCHEMA });
    }
  });

  app.post(['/api/admin/registry-form-schema', '/api/registry-schema'], async (req, res) => {
    try {
      if (req.body && Array.isArray(req.body.sections)) {
        const schema = await syncFullRegistrySchemaToDb(req.body);
        return res.json({ success: true, schema, data: schema });
      } else if (req.body && (req.body.label || req.body.fieldKey)) {
        const id = req.body.id || 'fld_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
        const field = await upsertSchemaFieldInDb({ ...req.body, id });
        const schema = await getFullRegistrySchemaFromDb();
        return res.json({ success: true, field, schema, data: schema });
      } else {
        const schema = await syncFullRegistrySchemaToDb(req.body);
        return res.json({ success: true, schema, data: schema });
      }
    } catch (err: any) {
      return res.status(500).json({ success: false, error: 'Failed to update registry schema in database: ' + err.message });
    }
  });

  app.put(['/api/admin/registry-form-schema', '/api/registry-schema'], async (req, res) => {
    try {
      const schema = await syncFullRegistrySchemaToDb(req.body);
      return res.json({ success: true, schema, data: schema });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: 'Failed to update registry schema in database.' });
    }
  });

  app.put('/api/registry-schema/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const field = await upsertSchemaFieldInDb({ ...req.body, id });
      const schema = await getFullRegistrySchemaFromDb();
      return res.json({ success: true, field, schema, data: schema });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: 'Failed to update registry schema field: ' + err.message });
    }
  });

  app.delete('/api/registry-schema/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await deleteSchemaFieldFromDb(id);
      const schema = await getFullRegistrySchemaFromDb();
      return res.json({ success: true, message: `Field ${id} deleted successfully.`, schema, data: schema });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: 'Failed to delete registry schema field: ' + err.message });
    }
  });

  // =========================================================================
  // 10. LEGAL DOCUMENTS & ASF REGULATIONS API
  // =========================================================================
  app.get('/api/legal-documents', (_req, res) => {
    res.json({ success: true, count: ALL_ASF_REGULATIONS.length, data: ALL_ASF_REGULATIONS });
  });

  // =========================================================================
  // 11. ENTERPRISE OFFLINE SYNCHRONIZATION API (IDEMPOTENT BATCH SYNC)
  // =========================================================================

  // GET /api/sync/status
  app.get('/api/sync/status', async (req, res) => {
    const user = getUserSecurityContext(req);
    try {
      const { total } = await getAllSwineRecords();
      return res.json({
        success: true,
        status: 'ONLINE',
        serverTime: new Date().toISOString(),
        role: user.role,
        scope: user.isAdmin ? 'ALL' : (user.assignedBarangay || user.barangayId),
        totalSwineInDb: total,
      });
    } catch {
      return res.json({
        success: true,
        status: 'ONLINE',
        serverTime: new Date().toISOString(),
      });
    }
  });

  // PULL: Download latest server data respecting role-based authorization
  const handleSyncPull = async (req: express.Request, res: express.Response) => {
    const user = getUserSecurityContext(req);
    const since = (req.query.since as string) || (req.body && req.body.since) || undefined;
    const effectiveBarangay = user.isAdmin ? undefined : (user.assignedBarangay || user.barangayId);

    try {
      const { records: swineList } = await getAllSwineRecords({
        barangay: effectiveBarangay,
        readyToSell: user.isAgent ? true : undefined,
      });

      const certs = await getAllCertificates();
      const filteredCerts = user.isAdmin
        ? certs
        : certs.filter((c: any) => {
            const matchId = Boolean(c.barangay_id && user.barangayId && c.barangay_id === user.barangayId);
            const matchName = Boolean(
              c.farmerBarangay && user.assignedBarangay && c.farmerBarangay.toLowerCase() === user.assignedBarangay.toLowerCase()
            );
            return matchId || matchName;
          });

      const messages = await getAllMessages({
        role: user.role,
        barangay: user.assignedBarangay,
        userId: user.userId,
      });

      return res.json({
        success: true,
        serverTimestamp: new Date().toISOString(),
        data: {
          swineRecords: swineList,
          certificates: filteredCerts,
          messages,
          barangays: HINUNANGAN_BARANGAYS,
        },
      });
    } catch (err: any) {
      console.error('Error during sync pull:', err);
      return res.status(500).json({
        success: false,
        error: 'Database sync pull failed. Backend server unavailable.',
      });
    }
  };

  app.get('/api/sync/pull', handleSyncPull);
  app.post('/api/sync/pull', handleSyncPull);

  // PUSH: Process pending offline operations queue idempotently
  app.post('/api/sync/push', async (req, res) => {
    const user = getUserSecurityContext(req);
    const { operations } = req.body || {};

    if (!Array.isArray(operations) || operations.length === 0) {
      return res.json({ success: true, processedCount: 0, results: [] });
    }

    const results: Array<{
      clientOperationId: string;
      entityId: string;
      serverEntityId?: string;
      serverPigId?: string;
      success: boolean;
      error?: string;
    }> = [];

    for (const op of operations) {
      const { clientOperationId, operation, entity, entityId, payload } = op;

      try {
        if (entity === 'swine') {
          if (user.isAgent) {
            results.push({
              clientOperationId,
              entityId,
              success: false,
              error: 'Agent accounts are restricted to view-only access.',
            });
            continue;
          }

          if (operation === 'create') {
            let tag = (payload.pigIdTag || payload.earTagNo || '').trim();
            // If temporary local tag, generate authoritative backend Pig ID
            if (!tag || tag.startsWith('LOCAL-') || !PIG_ID_TAG_REGEX.test(tag)) {
              const currentYear = new Date().getFullYear();
              const { total } = await getAllSwineRecords();
              tag = `HIN-${currentYear}-${String(total + 1).padStart(4, '0')}`;
            }

            if (!user.isAdmin && user.assignedBarangay) {
              payload.barangay = user.assignedBarangay;
              if (user.barangayId) payload.barangay_id = user.barangayId;
            }

            const cleanRecord = {
              ...payload,
              id: entityId.startsWith('local-') || entityId.startsWith('swine-local-')
                ? `swine-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
                : entityId,
              pigIdTag: tag,
              earTagNo: tag,
              registeredBy: payload.registeredBy || user.username,
            };

            const saved = await upsertSwineRecord(cleanRecord);
            results.push({
              clientOperationId,
              entityId,
              serverEntityId: saved.id,
              serverPigId: saved.pigIdTag,
              success: true,
            });
          } else if (operation === 'update') {
            const updated = await upsertSwineRecord(payload);
            results.push({
              clientOperationId,
              entityId,
              serverEntityId: updated.id,
              success: true,
            });
          } else if (operation === 'delete') {
            if (user.isAdmin) {
              await deleteSwineRecordById(entityId);
              results.push({ clientOperationId, entityId, success: true });
            } else {
              results.push({
                clientOperationId,
                entityId,
                success: false,
                error: 'Only administrators can delete swine records.',
              });
            }
          } else if (operation === 'sell' || operation === 'archive') {
            const existing = await getSwineRecordById(entityId);
            if (existing) {
              const updated = {
                ...existing,
                ...payload,
              };
              await upsertSwineRecord(updated);
              results.push({ clientOperationId, entityId, success: true });
            } else {
              results.push({
                clientOperationId,
                entityId,
                success: true,
                error: 'Record already updated or removed.',
              });
            }
          }
        } else if (entity === 'media') {
          const resolvedUrl = payload.fileUrl || payload.base64 || payload.dataUrlOrBase64;
          if (resolvedUrl) {
            const savedMedia = await insertMedia({
              fileName: payload.fileName || `media-${Date.now()}`,
              fileUrl: resolvedUrl,
              mimeType: payload.mimeType || 'image/jpeg',
              fileSize: payload.fileSize || 0,
              category: payload.category || 'OTHER',
              altText: payload.altText || 'Media Asset',
              uploadedBy: user.username,
            });
            results.push({
              clientOperationId,
              entityId,
              serverEntityId: savedMedia.id,
              success: true,
            });
          } else {
            results.push({ clientOperationId, entityId, success: false, error: 'Empty media content' });
          }
        } else if (entity === 'certificate') {
          if (!user.isAdmin && user.assignedBarangay) {
            payload.barangay = user.assignedBarangay;
            payload.farmerBarangay = user.assignedBarangay;
          }
          const savedCert = await upsertCertificate({
            ...payload,
            id: payload.id || `cert-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          });
          results.push({ clientOperationId, entityId, serverEntityId: savedCert.id, success: true });
        } else if (entity === 'message') {
          const newMsg = await createMessage({
            ...payload,
            senderId: user.userId,
            senderName: user.username,
            senderRole: user.role as any,
            barangay: user.assignedBarangay,
          });
          results.push({ clientOperationId, entityId, serverEntityId: newMsg.id, success: true });
        } else {
          results.push({ clientOperationId, entityId, success: true });
        }
      } catch (err: any) {
        console.error(`Sync error on operation ${clientOperationId}:`, err);
        results.push({
          clientOperationId,
          entityId,
          success: false,
          error: err?.message || 'Database transaction error',
        });
      }
    }

    return res.json({
      success: true,
      processedCount: results.filter(r => r.success).length,
      failedCount: results.filter(r => !r.success).length,
      results,
    });
  });

  // =========================================================================
  // 12. DA HINUNANGAN PUBLIC ASSISTANT API (DEDICATED PUBLIC PORTAL ENDPOINT)
  // =========================================================================
  app.post('/api/public/assistant/chat', async (req, res) => {
    const { message = '' } = req.body || {};

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, error: 'A valid message string is required.' });
    }

    try {
      const lower = message.toLowerCase().trim();

      // 1. REFUSAL: Secrets / Passwords / API Keys / Database Credential requests
      if (
        lower.includes('password') ||
        lower.includes('api key') ||
        lower.includes('apikey') ||
        lower.includes('token') ||
        lower.includes('secret') ||
        lower.includes('database password') ||
        lower.includes('sql') ||
        lower.includes('credentials')
      ) {
        return res.json({
          success: true,
          reply: `🔒 **Security Notice**: System credentials, internal database settings, API keys, and administrative secrets are restricted and cannot be disclosed under any circumstances.`,
          suggestions: [
            'What is the Swine Registry?',
            'How do I register my swine?',
            'What are the official contact details?',
          ],
        });
      }

      // 2. REFUSAL: Personal records inquiry ("Show my records", "Show my swine records", etc.)
      if (
        lower.includes('my record') ||
        lower.includes('my swine') ||
        lower.includes('my pig') ||
        lower.includes('my farm') ||
        lower.includes('show my') ||
        lower.includes('view my') ||
        lower.includes('check my') ||
        lower.includes('my registration')
      ) {
        return res.json({
          success: true,
          reply: `Registry records are available through the authorized portal. Please sign in using your official account.`,
          action: {
            type: 'open_login',
            label: 'Official Login',
          },
          suggestions: [
            'What are the requirements?',
            'How do I register my swine?',
            'What are the official contact details?',
          ],
        });
      }

      // 3. REFUSAL: "Where" queries regarding individual swine, farmers, internal GIS locations, pins, coordinates
      const isWhereLocationOfFarmerOrSwine =
        (lower.includes('where is') || lower.includes('where are') || lower.includes('where can i find') || lower.includes('coordinates') || lower.includes('location of') || lower.includes('pin') || lower.includes('gps')) &&
        (lower.includes('farmer') || lower.includes('pig') || lower.includes('swine') || lower.includes('pen') || lower.includes('juan') || lower.includes('infected') || lower.includes('raiser') || lower.includes('map coordinates') || lower.includes('gis coordinates'));

      if (isWhereLocationOfFarmerOrSwine) {
        return res.json({
          success: true,
          reply: `I can provide publicly available information about the Hinunangan Swine Registry, but individual swine, farmer, surveillance, and internal GIS locations are restricted to authorized system users.`,
          suggestions: [
            'Where is Hinunangan?',
            'What barangays are covered?',
            'What are the official contact details?',
            'What is the Swine Registry?',
          ],
        });
      }

      // 4. REFUSAL: "Who" queries regarding ownership of specific swine or raiser identities
      const isWhoQuery =
        (lower.includes('who owns') || lower.includes('who is the owner') || lower.includes('who registered') || lower.includes('owner of') || (lower.startsWith('who') && (lower.includes('swine') || lower.includes('pig') || lower.includes('hin-') || lower.includes('ear tag'))));

      if (isWhoQuery) {
        return res.json({
          success: true,
          reply: `I can't provide private farmer, raiser, or registry information. That information is available only to authorized personnel.`,
          suggestions: [
            'What is the Swine Registry?',
            'What are the requirements?',
            'What are the official contact details?',
          ],
        });
      }

      // 5. General "Where is Hinunangan?"
      if (
        lower.includes('where is hinunangan') ||
        lower.includes('location of hinunangan') ||
        (lower.includes('where') && lower.includes('hinunangan') && !lower.includes('pig') && !lower.includes('farmer'))
      ) {
        return res.json({
          success: true,
          reply: `📍 **Municipality of Hinunangan, Southern Leyte**:
Hinunangan is a coastal municipality in the eastern part of Southern Leyte, Eastern Visayas (Region VIII), Philippines. It spans 40 official barangays, bordered by Silago to the north, Hinundayan and Anahawan to the south, and Leyte Gulf to the east.

The Municipal Agriculture Office (MAO) is located at the **Town Hall Compound, Poblacion, Hinunangan, Southern Leyte 6601**.`,
          suggestions: [
            'What barangays are covered?',
            'What are the official contact details?',
            'What is the Swine Registry?',
          ],
        });
      }

      // 6. "What is the Swine Registry?" / Purpose of the system
      if (
        lower.includes('what is the swine registry') ||
        lower.includes('what is this system') ||
        lower.includes('purpose') ||
        lower.includes('about the registry') ||
        lower.includes('about the system')
      ) {
        return res.json({
          success: true,
          reply: `📋 **DA Hinunangan Swine Registry & Biosurveillance System**:
The system is an official municipal platform managed by the **Department of Agriculture** and the **Municipal Agriculture Office (MAO) of Hinunangan**, in collaboration with the **Southern Leyte State University (SLSU) Extension Center**.

**Key Purposes**:
1. **Livestock Traceability**: Digitize pig populations, unique ear-tag identifiers, and health histories across all 40 barangays.
2. **ASF Defense**: Safeguard the municipality's African Swine Fever **Green Zone (Free)** status through strict biosecurity standards.
3. **Farmer Support**: Assist RSBSA-registered raisers with veterinary outreach, vaccination, and official transport clearances.
4. **Market Transparency**: Connect accredited local hog raisers with meat buyers through certified Ready-to-Sell listings.`,
          suggestions: [
            'How do I register my swine?',
            'What are the requirements?',
            'What barangays are covered?',
          ],
        });
      }

      // 7. "How do I register my swine?" / "How can I register a swine?"
      if (
        lower.includes('how can i register') ||
        lower.includes('how do i register') ||
        lower.includes('how to register') ||
        lower.includes('register my swine') ||
        lower.includes('register a swine') ||
        lower.includes('registration process')
      ) {
        return res.json({
          success: true,
          reply: `📝 **How to Register Your Swine in Hinunangan**:

1. **Check Eligibility**: Ensure you are an RSBSA-registered hog raiser or resident of any of the 40 barangays in Hinunangan.
2. **Prepare Swine Details**: Have your swine ready for physical tagging (breed, approximate age/DOB, and current liveweight).
3. **Comply with Basic Biosecurity**: Ensure your pen has perimeter barrier fencing, an active disinfectant footbath, potable water, and **zero swill feeding (kanin-baboy)**.
4. **Contact Your Focal Person**: Notify your **Barangay Agricultural Focal Person** during designated inspection schedules at your Barangay Hall, or visit the **Municipal Agriculture Office (MAO)** at the Town Hall Compound.
5. **Issuance**: Once verified and tagged, your swine will be entered into the official registry and issued a tracking clearance.`,
          suggestions: [
            'What are the requirements?',
            'What are the official contact details?',
            'What should I do if my pigs are sick?',
          ],
        });
      }

      // 8. "What are the requirements?"
      if (
        lower.includes('requirement') ||
        lower.includes('qualifications') ||
        lower.includes('what do i need') ||
        lower.includes('needed to register')
      ) {
        return res.json({
          success: true,
          reply: `📑 **Official Requirements for Swine Registration**:

• **Raiser Credentials**: Valid Government ID and Proof of Residency in Hinunangan (or RSBSA Farmer Reference Number).
• **Facility Standards**: Basic pen biosecurity compliance:
  - Secure pen enclosure/fence.
  - Footbath installed at pen entrance.
  - Deepwell or potable drinking water source.
  - Strictly **NO swill feeding** (food scraps/bahog).
• **Swine Information**: Breed classification (Landrace, Large White, Duroc, Native, or crossbreed), birth date/age, and current weight estimate.
• **Inspection & Ear Tagging**: Permitting the authorized Barangay Focal Person or MAO technician to attach the official ear tag and record pen georeference.`,
          suggestions: [
            'How do I register my swine?',
            'What are the official contact details?',
            'What is ASF?',
          ],
        });
      }

      // 9. "What is ASF?" / African Swine Fever info
      if (
        lower.includes('what is asf') ||
        lower.includes('african swine fever') ||
        lower.includes('asf virus') ||
        lower.includes('asf disease')
      ) {
        return res.json({
          success: true,
          reply: `🛡️ **About African Swine Fever (ASF)**:
African Swine Fever is a severe, highly contagious viral disease affecting domestic and wild pigs. It causes high fever, respiratory distress, internal bleeding, and near 100% mortality in infected swine.

• **Human Health**: ASF is **NOT** a public health threat and **cannot infect humans**. However, humans and vehicles can easily spread the virus on shoes, tires, clothes, and uncooked pork products.
• **Hinunangan Status**: Hinunangan strictly maintains **Green Zone (Free)** status through checkpoint vehicle disinfection and municipal monitoring.
• **Golden Rule**: **Never feed swill (kanin-baboy/food scraps)** to pigs, as swill is the #1 vector of ASF transmission.`,
          suggestions: [
            'What should I do if my pigs are sick?',
            'What are the requirements?',
            'What are the official contact details?',
          ],
        });
      }

      // 10. "What should I do if my pigs are sick?"
      if (
        lower.includes('sick') ||
        lower.includes('fever') ||
        lower.includes('dying') ||
        lower.includes('symptoms') ||
        lower.includes('emergency') ||
        lower.includes('report sick')
      ) {
        return res.json({
          success: true,
          reply: `🚨 **Emergency Protocol for Sick Swine**:

1. **Immediately Isolate**: Move the sick pig to a separate isolation pen away from other animals.
2. **DO NOT Sell or Transport**: Moving or selling sick pigs is strictly illegal under Municipal Ordinance and spreads disease.
3. **DO NOT Slaughter or Consume**: Do not butcher sick pigs for human or pet consumption.
4. **Disinfect**: Disinfect boots, pens, and equipment with bleach or veterinary disinfectant.
5. **Report Immediately**: Contact your **Barangay Agricultural Focal Person** or call the **Municipal Agriculture Emergency Hotline at (053) 578-2011 / 0917-888-9999** for free veterinary assessment.`,
          suggestions: [
            'What are the official contact details?',
            'What is ASF?',
            'What are the requirements?',
          ],
        });
      }

      // 11. "What programs and services are available?"
      if (
        lower.includes('programs') ||
        lower.includes('services') ||
        lower.includes('assistance') ||
        lower.includes('benefits') ||
        lower.includes('support')
      ) {
        return res.json({
          success: true,
          reply: `🌾 **DA Hinunangan Municipal Agricultural Programs & Services**:

• **Free Swine Ear Tagging & Micro-Profiling**: Official registry identification for livestock security.
• **Biosecurity Assistance & Farm Audits**: Assessment of pen biosecurity to protect against disease incursions.
• **Veterinary Technical Support**: Provided in partnership with Southern Leyte State University (SLSU) Extension Center.
• **Livestock Health Clearances & Transport Certificates**: Veterinary clearances for municipal and provincial livestock movement.
• **Ready-to-Sell Market Catalog**: Assisting verified local raisers in connecting with legitimate buyers.
• **Vaccination & Deworming Campaigns**: Periodic free municipal livestock deworming and immunization drives.`,
          suggestions: [
            'How do I register my swine?',
            'What are the requirements?',
            'What are the official contact details?',
          ],
        });
      }

      // 12. "What barangays are in Hinunangan? / What barangays are covered?"
      if (
        lower.includes('barangay') ||
        lower.includes('covered') ||
        lower.includes('coverage') ||
        lower.includes('list of barangay')
      ) {
        const bgNames = HINUNANGAN_BARANGAYS.map(b => b.name).join(', ');
        return res.json({
          success: true,
          reply: `🗺️ **Municipal Coverage (40 Barangays)**:
The DA Hinunangan Swine Registry covers all **40 official barangays** of Hinunangan, Southern Leyte:

${bgNames}

Every barangay has an assigned **Barangay Agricultural Focal Person** working alongside the Punong Barangay and Municipal Agriculture Office.`,
          suggestions: [
            'What are the official contact details?',
            'How do I register my swine?',
            'What is the Swine Registry?',
          ],
        });
      }

      // 13. "How can I contact the office? / What are the official contact details?"
      if (
        lower.includes('contact') ||
        lower.includes('phone') ||
        lower.includes('email') ||
        lower.includes('hotline') ||
        lower.includes('address') ||
        lower.includes('office') ||
        lower.includes('hours')
      ) {
        return res.json({
          success: true,
          reply: `📞 **Official Contact Information**:

• **Office**: Municipal Agriculture Office (MAO)
• **Location**: Hinunangan Town Hall Compound, Poblacion, Hinunangan, Southern Leyte 6601
• **Telephone**: (053) 578-2011
• **Emergency Hotline**: 0917-888-9999
• **Email**: agri.hinunangan@gmail.com
• **Official Facebook**: [facebook.com/LGUHinunanganOfficial](https://facebook.com/LGUHinunanganOfficial)
• **Office Hours**: Monday to Friday, 8:00 AM – 5:00 PM`,
          suggestions: [
            'What is the Swine Registry?',
            'How do I register my swine?',
            'What are the requirements?',
          ],
        });
      }

      // 14. Public Legal Decrees & Ordinances
      if (
        lower.includes('ordinance') ||
        lower.includes('decree') ||
        lower.includes('law') ||
        lower.includes('legal') ||
        lower.includes('resolution')
      ) {
        return res.json({
          success: true,
          reply: `⚖️ **Public Ordinances & Biosecurity Decrees**:

• **Hinunangan Municipal Ordinance No. 2025-59**: Mandates swine profiling, movement clearances, and the Babay ASF Biosecurity framework throughout Hinunangan.
• **Southern Leyte Provincial Ordinance 2021-018**: Enforces strict border quarantine inspection, mandatory vehicle disinfection at municipal checkpoints, and absolute prohibition of swill feeding.
• **Municipal Executive Order No. 12-2023**: Designates Barangay Agricultural Focal Persons to supervise local biosecurity compliance.`,
          suggestions: [
            'What is ASF?',
            'What are the requirements?',
            'What are the official contact details?',
          ],
        });
      }

      // 15. Gemini AI Engine (Strictly Grounded in Public System Portal Knowledge)
      if (process.env.GEMINI_API_KEY) {
        try {
          const { GoogleGenAI } = await import('@google/genai');
          const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

          const publicSystemPrompt = `You are the official "DA Hinunangan Public Information Assistant" for the Municipal Agriculture Office of Hinunangan, Southern Leyte.

STRICT OPERATIONAL RULES:
1. ONLY INTERNAL SYSTEM TOPICS: You must strictly ONLY answer questions about the Municipality of Hinunangan, DA Hinunangan agricultural programs, public swine registry guidelines, ASF prevention, and office contact information. NEVER search for external random topics or generic internet info (Dili mogawas sa sistema).
2. DO NOT expose confidential internal data (individual farmer names, exact coordinates, or internal credentials).
3. If asked where to register, explain that swine raisers can register by visiting the Municipal Agriculture Office at Poblacion, Hinunangan or coordinating with their Barangay Biosecurity Focal Person.
4. MULTILINGUAL SUPPORT: Answer fluently in English, Tagalog, or Cebuano / Bisaya depending on what the user asks.
5. Keep answers concise, polite, and helpful.`;

          const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: message,
            config: {
              systemInstruction: publicSystemPrompt,
              temperature: 0.2,
            },
          });

          if (response.text) {
            return res.json({
              success: true,
              reply: response.text.trim(),
              action: {
                type: 'open_login',
                label: 'Official Login',
              },
              suggestions: [
                'What is the Swine Registry?',
                'How do I register my swine?',
                'What are the official contact details?',
                'What barangays are covered?',
              ],
            });
          }
        } catch (aiErr) {
          console.warn('Public Gemini API call fallback:', aiErr);
        }
      }

      // 16. Default Public Greeting & Directory
      return res.json({
        success: true,
        reply: `👋 Hello! I am the **DA Hinunangan Public Information Assistant**.

I can answer publicly available questions regarding:
• **Swine Registry & Guidelines**: How to register your swine and RSBSA requirements.
• **Programs & Services**: Municipal agricultural assistance, veterinary visits, and clearances.
• **African Swine Fever (ASF)**: Prevention measures, swill feeding prohibition, and zoning.
• **Barangays & Office Contacts**: Official phone numbers, office location, and focal person coordination.

*Note: Individual swine records, raiser personal data, and internal GIS coordinates are restricted to authorized personnel. Authorized users may sign in via the portal.*`,
        action: {
          type: 'open_login',
          label: 'Official Login',
        },
        suggestions: [
          'What is the Swine Registry?',
          'How do I register my swine?',
          'What are the requirements?',
          'What are the official contact details?',
          'What barangays are covered?',
          'What should I do if my pigs are sick?',
        ],
      });
    } catch (err: any) {
      console.error('Public Assistant endpoint error:', err);
      return res.status(500).json({
        success: false,
        error: 'Public assistant service temporarily unavailable.',
      });
    }
  });

  // =========================================================================
  // 13. DA HINUNANGAN BIOSECURITY ASSISTANT API (ROLE-BASED & REAL-TIME)
  // =========================================================================
  app.post('/api/assistant/chat', async (req, res) => {
    const user = getUserSecurityContext(req);
    const { message = '' } = req.body || {};

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, error: 'A valid message string is required.' });
    }

    // Role-based authentication check
    if (!user.isAuthenticated) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Unauthenticated visitors must use the Public Information Assistant at /api/public/assistant/chat.',
      });
    }

    try {
      const lower = message.toLowerCase().trim();

      // Security Check: Refuse requests asking for database passwords, API keys, tokens, internal SQL, or server secrets
      if (
        lower.includes('password') ||
        lower.includes('api key') ||
        lower.includes('apikey') ||
        lower.includes('token') ||
        lower.includes('secret') ||
        lower.includes('database password') ||
        lower.includes('sql') ||
        lower.includes('credentials')
      ) {
        return res.json({
          success: true,
          reply: `🔒 **Security Notice**: System credentials, internal database settings, API keys, and administrative secrets are restricted and cannot be disclosed under any circumstances.`,
          suggestions: [
            'Show today\'s registry status',
            'How many swine are registered?',
            'Open GIS Swine Map',
          ],
        });
      }

      // Super Admin Natural Language Configuration Commands
      if (user.isSuperAdmin) {
        const currentConfig = (await getSystemSetting('master_system_config', DEFAULT_MASTER_CONFIG)) || DEFAULT_MASTER_CONFIG;
        const configResult = interpretSuperAdminConfigCommand(message, currentConfig);
        if (configResult.isConfigCommand) {
          if (configResult.isSecurityViolation) {
            return res.json({
              success: true,
              reply: configResult.securityMessage || 'Security modification restricted.',
              suggestions: [
                'Change Admin sidebar to blue',
                'Set Focal Person font to Poppins',
                'Show today\'s registry status',
              ],
            });
          }

          if (configResult.proposedChange) {
            return res.json({
              success: true,
              reply: configResult.previewMessage || 'Proposed configuration change ready for review.',
              action: {
                type: 'confirm_config_change',
                actionId: 'apply_proposed_config',
                label: 'Apply Configuration Change',
                payload: configResult.proposedChange,
              },
              suggestions: [
                'Cancel',
                'Reset Admin appearance',
                'Show today\'s registry status',
              ],
            });
          }
        }
      }

      // Check cross-barangay queries for Focal Persons
      if (user.role === 'focal' && user.assignedBarangay) {
        const assignedLower = user.assignedBarangay.toLowerCase();
        const matchedBg = HINUNANGAN_BARANGAYS.find(
          b => lower.includes(b.name.toLowerCase()) && b.name.toLowerCase() !== assignedLower
        );
        if (matchedBg) {
          return res.json({
            success: true,
            reply: `I can only provide registry and GIS information for your assigned barangay/areas.`,
            suggestions: [
              `Show records for ${user.assignedBarangay}`,
              `How many ready to sell in ${user.assignedBarangay}?`,
              'Register a new swine',
            ],
          });
        }
      }

      // Agent / Buyer restrictions: Restricted to market-ready hogs, takeoff catalog, public ordinances, and contact info.
      // No access to confidential farmer/swine details outside takeoff.
      if (user.isAgent) {
        const isConfidentialQuery =
          lower.includes('farmer list') ||
          lower.includes('all farmers') ||
          lower.includes('audit') ||
          lower.includes('inspection record') ||
          lower.includes('sick pig') ||
          lower.includes('quarantined');

        if (isConfidentialQuery) {
          return res.json({
            success: true,
            reply: `As an accredited Agent / Buyer, your access is focused on the Ready for Take-Off market catalog, verified commercial hog availability, and transport clearance requirements.`,
            action: {
              type: 'navigate',
              tab: 'takeoff',
              label: 'View Ready for Take-Off Catalog',
            },
            suggestions: [
              'How many swine are ready to sell?',
              'What are the transport requirements?',
              'Show takeoff catalog',
            ],
          });
        }
      }

      const { records: allRecords } = await getAllSwineRecords();

      // Role-based record filtration
      let authorizedRecords = allRecords;
      if (user.role === 'focal') {
        const assigned = (user.assignedBarangay || '').toLowerCase().trim();
        if (assigned) {
          authorizedRecords = allRecords.filter(r =>
            (r.barangay || '').toLowerCase().trim() === assigned ||
            (r.barangay_id && r.barangay_id.toLowerCase().includes(assigned))
          );
        } else {
          authorizedRecords = [];
        }
      } else if (user.isAgent) {
        authorizedRecords = allRecords.filter(r =>
          !r.isArchived && (r.readyToSell || (r.weightKg && r.weightKg >= 75)) &&
          r.status !== 'sold' && r.status !== 'deceased'
        );
      }

      // 1. Swine Registration queries
      if (
        lower.includes('register') ||
        lower.includes('registration') ||
        lower.includes('add swine') ||
        lower.includes('new pig') ||
        lower.includes('how to register')
      ) {
        return res.json({
          success: true,
          reply: `📋 **DA Hinunangan Official Swine Registration Workflow**:

1. **Owner / Raiser Identification**: Collect the raiser's full legal name, contact number, and exact Barangay / Purok address.
2. **Swine Biometric Details**: Record the official Ear Tag / Pig ID, breed (Landrace, Large White, Duroc, Native, etc.), age in months, and current estimated weight (kg).
3. **Health & Biosecurity Verification**: Confirm vaccination status (Hog Cholera, Deworming), current health status (Healthy / Under Observation / Sick), and pen biosecurity standard.
4. **GIS GPS Pinning**: Capture the exact geocoordinates (latitude & longitude) of the farm or backyard pen to pin the swine on the Municipal Biosurveillance Map.

*Field Note: You can register swine even without internet access! The offline queue will synchronize your records automatically once connected.*`,
          action: {
            type: 'navigate',
            tab: 'records',
            label: 'Go to Swine Records to Register',
          },
          suggestions: [
            'How many swine are registered?',
            'How does offline mode work?',
            'Open GIS Swine Map',
          ],
        });
      }

      // 2. Ready for Take-Off / Market Inquiries
      if (
        lower.includes('ready to sell') ||
        lower.includes('take off') ||
        lower.includes('take-off') ||
        lower.includes('market') ||
        lower.includes('commercial') ||
        lower.includes('buyer')
      ) {
        const readyHogs = authorizedRecords.filter(
          r => !r.isArchived && (r.readyToSell || (r.weightKg && r.weightKg >= 75)) && r.status !== 'sold' && r.status !== 'deceased'
        );
        const avgWeight = readyHogs.length > 0
          ? Math.round(readyHogs.reduce((acc, h) => acc + (h.weightKg || 0), 0) / readyHogs.length)
          : 0;

        const scopeLabel = user.role === 'focal' && user.assignedBarangay
          ? `in Barangay ${user.assignedBarangay}`
          : 'municipal-wide across Hinunangan';

        return res.json({
          success: true,
          reply: `🚀 **Ready for Take-Off Status (${scopeLabel})**:

• **Eligible Market Hogs**: **${readyHogs.length} head** currently qualified for commercial sale.
• **Average Market Weight**: **${avgWeight} kg**
• **Criteria**: Swine tagged as ready-to-sell or weighing 75kg and above with valid health status.
• **Clearance Requirement**: Must possess a valid DA Veterinary Health Certificate and Barangay Transport Clearance before dispatch.`,
          action: {
            type: 'navigate',
            tab: 'takeoff',
            label: 'View Ready for Take-Off Catalog',
          },
          suggestions: [
            'How many swine are registered in total?',
            'How do I print a transport clearance?',
            'Show biosecurity status',
          ],
        });
      }

      // 3. Live Database Status & Count Inquiries
      if (
        lower.includes('how many') ||
        lower.includes('count') ||
        lower.includes('total') ||
        lower.includes('status') ||
        lower.includes('summary') ||
        lower.includes('dashboard')
      ) {
        const total = authorizedRecords.length;
        const activeRaisers = new Set(authorizedRecords.map(r => (r.ownerName || '').trim().toLowerCase()).filter(Boolean)).size;
        const readyHogs = authorizedRecords.filter(
          r => !r.isArchived && (r.readyToSell || (r.weightKg && r.weightKg >= 75)) && r.status !== 'sold' && r.status !== 'deceased'
        );
        const healthyCount = authorizedRecords.filter(r => (r.healthStatus || 'healthy').toLowerCase() === 'healthy').length;
        const underObservationCount = authorizedRecords.filter(r => (r.healthStatus || '').toLowerCase() === 'under observation').length;
        const avgWeight = total > 0
          ? Math.round(authorizedRecords.reduce((acc, r) => acc + (r.weightKg || 0), 0) / total)
          : 0;

        const scopeLabel = user.role === 'focal' && user.assignedBarangay
          ? `Barangay ${user.assignedBarangay}`
          : 'Municipality of Hinunangan';

        return res.json({
          success: true,
          reply: `📊 **Live Registry & Biosurveillance Summary (${scopeLabel})**:

• **Total Swine Registered**: **${total.toLocaleString()} head**
• **Registered Raisers**: **${activeRaisers.toLocaleString()} farmers**
• **Ready for Take-Off**: **${readyHogs.length} head**
• **Biosecurity Health**: **${healthyCount} healthy**, **${underObservationCount} under observation**
• **Average Weight**: **${avgWeight} kg**

All metrics reflect live, real-time records from the database.`,
          action: {
            type: 'navigate',
            tab: 'dashboard',
            label: 'View Full Dashboard Metrics',
          },
          suggestions: [
            'How many are ready to sell?',
            'Open GIS Swine Map',
            'How do I register a swine?',
          ],
        });
      }

      // 4. GIS & Spatial Mapping queries
      if (
        lower.includes('gis') ||
        lower.includes('map') ||
        lower.includes('gps') ||
        lower.includes('coordinates') ||
        lower.includes('location') ||
        lower.includes('pin')
      ) {
        return res.json({
          success: true,
          reply: `🗺️ **GIS Swine Biosurveillance Map**:

The interactive GIS mapping module provides spatial visualization for all registered pens and swine populations in Hinunangan:
• **Barangay Boundaries**: GeoJSON polygons outline each barangay's biosecurity zones.
• **Spatial Pins**: Color-coded pins indicate farm locations, health statuses (Green = Healthy, Yellow = Observation, Red = Quarantine/Infected).
• **Clustering & Heatmap**: High-density swine zones are automatically clustered for outbreak risk assessment.
• **GPS Pinning**: Field focal persons can click or tap anywhere on the map to automatically pin coordinates during registration.`,
          action: {
            type: 'navigate',
            tab: 'gis',
            label: 'Open GIS Swine Map',
          },
          suggestions: [
            'How does ASF biosecurity work?',
            'Show total swine records',
            'How to print reports?',
          ],
        });
      }

      // 5. ASF & Biosecurity Regulations queries
      if (
        lower.includes('asf') ||
        lower.includes('african swine fever') ||
        lower.includes('biosecurity') ||
        lower.includes('quarantine') ||
        lower.includes('zone') ||
        lower.includes('ordinance') ||
        lower.includes('decree')
      ) {
        return res.json({
          success: true,
          reply: `🛡️ **African Swine Fever (ASF) Biosecurity Protocol**:

Under Municipal Ordinance and National DA Administrative Orders (Babay ASF Program):
1. **Zoning Classification**:
   • **Red Zone (Infected)**: Confirmed outbreak within 1km radius. Strict lockdown on swine and pork movement.
   • **Pink Zone (Buffer)**: 7km containment perimeter with mandatory biosecurity checkpoints.
   • **Yellow Zone (Surveillance)**: Intensive random blood sampling and active surveillance.
   • **Green Zone (Free)**: Disease-free zone with standard biosecurity clearances.
2. **Preventive Farm Measures**:
   • Mandatory footbaths and disinfectant sprays at pen entrances.
   • Strict ban on swill feeding (bahog / kaning-baboy).
   • Restrict farm visitors and animal dealers without DA permits.`,
          action: {
            type: 'navigate',
            tab: 'biosecurity',
            label: 'Go to Barangay Biosecurity Module',
          },
          suggestions: [
            'View ASF Legal Decrees',
            'How to register a swine?',
            'Show today\'s registry status',
          ],
        });
      }

      // 6. Reports & Certificates queries
      if (
        lower.includes('report') ||
        lower.includes('print') ||
        lower.includes('certificate') ||
        lower.includes('export') ||
        lower.includes('pdf')
      ) {
        return res.json({
          success: true,
          reply: `📑 **Official DA Hinunangan Reports & Documentation**:

You can generate and print official livestock documentation directly:
• **Municipal Swine Inventory Summary**: Complete head count by barangay and breed.
• **Barangay Biosecurity Assessment Report**: Zone-level audit with risk indices.
• **Veterinary Health Clearance / Certificate**: Required document for hog transport and market take-off.
• **Export to Excel / PDF**: Instant downloadable tabular spreadsheets and printable letterhead reports.`,
          action: {
            type: 'navigate',
            tab: 'reports',
            label: 'Go to Print Official Reports',
          },
          suggestions: [
            'How many swine ready to sell?',
            'Show registry summary',
            'Open GIS Swine Map',
          ],
        });
      }

      // 7. Offline & PWA queries
      if (
        lower.includes('offline') ||
        lower.includes('pwa') ||
        lower.includes('no internet') ||
        lower.includes('sync') ||
        lower.includes('connection')
      ) {
        return res.json({
          success: true,
          reply: `📱 **Field Offline Mode & Automatic Synchronization**:

The DA Hinunangan Swine Registry is engineered as a Progressive Web App (PWA):
• **Field Operation**: You can register swine, pin GPS coordinates, and inspect farms even in remote puroks without mobile signal.
• **Offline Storage**: Records and photos are saved securely on your device via IndexedDB.
• **Automatic Sync**: When your device reconnects to Wi-Fi or cellular data, all pending records sync seamlessly with the central municipal database.`,
          suggestions: [
            'How to register a swine?',
            'Open GIS Swine Map',
            'Show today\'s registry status',
          ],
        });
      }

      // 8. Gemini AI Engine for Real-Time Contextual Explanation and Q&A (Strictly Grounded in System Data)
      if (process.env.GEMINI_API_KEY) {
        try {
          const { GoogleGenAI } = await import('@google/genai');
          const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

          const totalSwine = authorizedRecords.length;
          const readyCount = authorizedRecords.filter(
            r => !r.isArchived && (r.readyToSell || (r.weightKg && r.weightKg >= 75)) && r.status !== 'sold' && r.status !== 'deceased'
          ).length;
          const healthyCount = authorizedRecords.filter(r => (r.healthStatus || 'healthy').toLowerCase() === 'healthy').length;
          const underObsCount = authorizedRecords.filter(r => (r.healthStatus || '').toLowerCase() === 'under observation').length;
          const sickCount = authorizedRecords.filter(r => (r.healthStatus || '').toLowerCase() === 'sick').length;
          const raisersCount = new Set(authorizedRecords.map(r => (r.farmerName || r.ownerName || '').trim().toLowerCase()).filter(Boolean)).size;

          const scopeText = user.role === 'focal' && user.assignedBarangay
            ? `Assigned Barangay: ${user.assignedBarangay}`
            : 'Municipality of Hinunangan (All 40 Barangays)';

          const systemPrompt = `You are the official "DA Hinunangan Biosecurity Assistant" for the Municipal Agriculture Office of Hinunangan, Southern Leyte. User role: ${user.role} (${user.username}). Scope: ${scopeText}.

CRITICAL OPERATIONAL RULES:
1. ONLY INTERNAL SYSTEM TOPICS: You must strictly ONLY answer about the DA Hinunangan Swine Registry & Biosurveillance system, its data, swine records, barangays, and biosecurity rules. NEVER search for external random topics or discuss unrelated general internet information (Dili mogawas sa sistema).
2. DIRECT DATA & WHERE TO INPUT:
   - Where to input data ("asa mo input", "how to input", "register swine", "add record"): Direct the user to the "Swine Records" tab -> click the green "[+ Register Swine]" button (or "Swine Farm Registration" on the Dashboard). Explain the required fields: Raiser Details (Name, Contact, Address/Barangay, RSBSA ID), Swine Details (Ear Tag, Pig ID HIN-YYYY-XXXX, DOB/Age auto-calculation, Breed, Weight, Farm Scale, Health Status), Biosecurity Checklist, and GIS GPS Coordinates ("Pin GPS on Map").
   - Live system figures: Total Swine: ${totalSwine} head, Registered Raisers: ${raisersCount} farmers, Ready for Take-Off: ${readyCount} head, Healthy: ${healthyCount}, Under Observation: ${underObsCount}, Sick: ${sickCount}.
   - Ready-to-sell: Direct them to the "Ready for Take-Off" tab (eligible hogs with verified health).
   - Biosecurity / ASF: Direct them to "Barangay Biosecurity" and "ASF Legal Decrees". Hinunangan has 40 barangays categorized into ASF zones (Red = 1km infected lockdown, Pink = 7km buffer, Yellow = surveillance, Green = disease-free).
   - GIS Map: Direct them to the "GIS Swine Map" tab.
   - Reports: Direct them to "Print Official Reports" tab (export to PDF/Excel, printable certificates).
   - User Accounts: Direct them to "User Accounts" tab (accessible to both Super Admin and Admin to manage Focal Persons, Agents, and Admins).
3. MULTILINGUAL SUPPORT: Answer fluently in English, Tagalog, or Cebuano / Bisaya depending on what the user asks.
4. Keep answers concise, direct, helpful, and polite.`;

          const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: message,
            config: {
              systemInstruction: systemPrompt,
              temperature: 0.2,
            },
          });

          if (response.text) {
            let action: any = undefined;
            if (lower.includes('input') || lower.includes('register') || lower.includes('add swine')) {
              action = { type: 'navigate', tab: 'records', label: 'Go to Swine Records to Input' };
            } else if (lower.includes('gis') || lower.includes('map')) {
              action = { type: 'navigate', tab: 'gis', label: 'Open GIS Swine Map' };
            } else if (lower.includes('take off') || lower.includes('takeoff') || lower.includes('ready to sell')) {
              action = { type: 'navigate', tab: 'takeoff', label: 'View Ready for Take-Off Catalog' };
            } else if (lower.includes('biosecurity') || lower.includes('asf')) {
              action = { type: 'navigate', tab: 'biosecurity', label: 'View Barangay Biosecurity' };
            } else if (lower.includes('report') || lower.includes('print')) {
              action = { type: 'navigate', tab: 'reports', label: 'Print Official Reports' };
            } else if (lower.includes('account') || lower.includes('user')) {
              action = { type: 'navigate', tab: 'accounts', label: 'Manage User Accounts' };
            }

            return res.json({
              success: true,
              reply: response.text.trim(),
              action,
              suggestions: [
                'Show today\'s registry status',
                'How many swine are ready to sell?',
                'How to register a swine?',
                'Open GIS Swine Map',
              ],
            });
          }
        } catch (aiErr) {
          console.warn('Authenticated Gemini API call fallback:', aiErr);
        }
      }

      // Default contextual response
      return res.json({
        success: true,
        reply: `👋 Hello **${user.username}**! I am the **DA Hinunangan Biosecurity & Registry Assistant**.

I can assist you with:
• **Live Database Metrics**: Check current swine population, ready-to-sell hogs, and raiser statistics.
• **Registration Assistance**: Step-by-step guidance on registering farmers and swine with GPS coordinates.
• **GIS Mapping**: Biosurveillance navigation, coordinate pinning, and barangay zone layers.
• **ASF Biosecurity Protocols**: Movement restrictions, zoning regulations, and quarantine standards.
• **Official Reports**: Generating inventory summaries and transport clearances.

How may I assist your agricultural operations today?`,
        suggestions: user.role === 'focal' && user.assignedBarangay
          ? [
              `Show records for ${user.assignedBarangay}`,
              `How many ready to sell in ${user.assignedBarangay}?`,
              'Register a new swine',
              'Open GIS Swine Map',
            ]
          : user.isAgent
          ? [
              'How many swine are ready to sell?',
              'View Ready for Take-Off catalog',
              'What are the transport requirements?',
            ]
          : [
              'Show today\'s registry status',
              'How many swine are ready to sell?',
              'How do I register a swine?',
              'Open GIS Swine Map',
            ],
      });
    } catch (err: any) {
      console.error('Biosecurity Assistant endpoint error:', err);
      return res.status(500).json({
        success: false,
        error: 'Assistant service temporarily unavailable.',
      });
    }
  });

  return app;
}

export const app = createApp();

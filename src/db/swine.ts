import { randomUUID } from 'node:crypto';
import { db, persistLocalDatabase } from './index.ts';
import { swineRecords } from './schema.ts';
import { eq, inArray, and, ilike, or, desc, sql } from 'drizzle-orm';
import { SwineRecord } from '../types.ts';
import {
  calculateSwineAge,
  getEstimatedWeightRange,
  getBarangayASFZone,
  classifyFarmScale,
} from '../utils/swineRegistryLogic.ts';

/**
 * Safely convert a database boolean value.
 * Prevents Boolean("false") from becoming true.
 */
function toSafeBoolean(value: any, defaultValue = false): boolean {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();

    if (
      normalized === 'false' ||
      normalized === '0' ||
      normalized === 'no' ||
      normalized === 'off'
    ) {
      return false;
    }

    if (
      normalized === 'true' ||
      normalized === '1' ||
      normalized === 'yes' ||
      normalized === 'on'
    ) {
      return true;
    }
  }

  return Boolean(value);
}

/**
 * Safely convert a value to a finite number.
 */
function toSafeNumber(
  value: any,
  fallback: number | null = null
): number | null {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function sanitizeDatabaseDiagnostic(value: unknown): string {
  return String(value ?? '')
    .replace(/(postgres(?:ql)?:\/\/)[^\s/@]+@/gi, '$1[REDACTED]@')
    .replace(/\b(password|service[_ -]?key|api[_ -]?key|jwt|authorization|cookie)\s*[:=]\s*([^\s,;]+)/gi, '$1=[REDACTED]')
    .replace(/\bBearer\s+[^\s,;]+/gi, 'Bearer [REDACTED]');
}

function toJsonSafeValue(value: any, seen = new WeakSet<object>()): any {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }

  if (Array.isArray(value)) {
    if (seen.has(value)) return null;
    seen.add(value);
    return value.map(item => toJsonSafeValue(item, seen) ?? null);
  }

  if (typeof value === 'object') {
    if (seen.has(value)) return undefined;
    seen.add(value);
    const result: Record<string, unknown> = {};
    Object.entries(value).forEach(([key, item]) => {
      const safeValue = toJsonSafeValue(item, seen);
      if (safeValue !== undefined) result[key] = safeValue;
    });
    return result;
  }

  return undefined;
}

/**
 * Extract useful PostgreSQL information without exposing credentials.
 */
function getDatabaseErrorInfo(error: any) {
  const causes: any[] = [];
  const pending = [error];
  while (pending.length > 0 && causes.length < 8) {
    const current = pending.shift();
    if (!current || causes.includes(current)) continue;
    causes.push(current);
    if (current.cause) pending.push(current.cause);
    if (current.originalError) pending.push(current.originalError);
  }

  const firstDefined = (key: string) => causes
    .map(cause => cause?.[key])
    .find(value => value !== undefined && value !== null && value !== '');
  const rawCode = firstDefined('code') || 'UNKNOWN';
  const rawMessage = causes
    .map(cause => cause?.message)
    .find(message => typeof message === 'string' && message &&
      !/^Database .* failed \(/i.test(message) &&
      !/^Failed query:/i.test(message)) || 'Unknown database error';
  const rawDetail = firstDefined('detail') || '';
  const rawHint = firstDefined('hint') || '';
  const rawTable = firstDefined('table') || '';
  const rawColumn = firstDefined('column') || '';

  return {
    code: sanitizeDatabaseDiagnostic(rawCode) || 'UNKNOWN',
    message: sanitizeDatabaseDiagnostic(rawMessage) || 'Unknown database error',
    detail: sanitizeDatabaseDiagnostic(rawDetail),
    hint: sanitizeDatabaseDiagnostic(rawHint),
    table: sanitizeDatabaseDiagnostic(rawTable),
    column: sanitizeDatabaseDiagnostic(rawColumn),
  };
}

/**
 * Convert a database error into an Error that still contains
 * the original PostgreSQL code/details.
 *
 * IMPORTANT:
 * Do not replace database errors with generic
 * "Unable to connect" messages here.
 */
function createDatabaseError(
  operation: string,
  error: any
): Error {
  const info = getDatabaseErrorInfo(error);

  console.error('=================================================');
  console.error(`[DATABASE ERROR] ${operation}`);
  console.error('PostgreSQL code:', info.code);
  console.error('Message:', info.message);

  if (info.detail) {
    console.error('Detail:', info.detail);
  }

  if (info.hint) {
    console.error('Hint:', info.hint);
  }

  if (info.table) {
    console.error('Table:', info.table);
  }

  if (info.column) {
    console.error('Column:', info.column);
  }

  console.error('=================================================');

  const databaseError = new Error(
    `Database ${operation} failed (${info.code}): ${info.message}`,
    {
      cause: error,
    }
  );

  const dbError = databaseError as any;

  dbError.code = info.code;
  dbError.detail = info.detail;
  dbError.hint = info.hint;
  dbError.table = info.table;
  dbError.column = info.column;

  return databaseError;
}

/**
 * Convert a PostgreSQL/Drizzle row into the application's SwineRecord format.
 */
export function mapDbToSwine(row: any): SwineRecord {
  const birthDate =
    row.birthDate ??
    row.birth_date ??
    row.dateOfBirth ??
    row.date_of_birth ??
    row.dob ??
    '';

  const age = calculateSwineAge(birthDate);

  const safeDays = age.isValid
    ? age.totalDays
    : (
        row.ageDays ??
        row.age_days ??
        0
      );

  const safeMonths = age.isValid
    ? age.totalMonths
    : (
        row.ageMonths ??
        row.age_months ??
        0
      );

  const estimatedWeightRange = getEstimatedWeightRange(
    Number(safeDays) || 0
  );

  const rawCustom =
    row.customFields ??
    row.custom_fields ??
    {};

  const custom =
    rawCustom &&
    typeof rawCustom === 'object' &&
    !Array.isArray(rawCustom)
      ? rawCustom
      : {};

  const actualWeightRaw =
    row.actualWeightKg ??
    row.actual_weight_kg ??
    custom.weightKg ??
    null;

  const actualWeightNum = toSafeNumber(
    actualWeightRaw,
    null
  );

  const weightNum =
    actualWeightNum !== null
      ? actualWeightNum
      : 60;

  const barangayName =
    row.barangay ||
    'Ambacon';

  const farmScale =
    row.farmScale ||
    row.farm_scale ||
    classifyFarmScale(
      Number(custom.penCapacity) || 5
    );

  const asfZone =
    row.asfZone ||
    row.asf_zone ||
    getBarangayASFZone(
      barangayName
    );

  const pigIdTag =
    row.pigIdTag ||
    row.pig_id_tag ||
    row.computedPigId ||
    row.computed_pig_id ||
    row.id;

  const farmerAddress =
    custom.farmerAddress ||
    row.farmName ||
    row.farm_name ||
    '';

  const barangayId =
    custom.barangayId ||
    `brgy-${String(barangayName)
      .toLowerCase()
      .replace(/\s+/g, '-')}`;

  const latitude =
    custom.latitude !== undefined &&
    custom.latitude !== null
      ? (
          toSafeNumber(
            custom.latitude,
            10.3969
          ) ?? 10.3969
        )
      : 10.3969;

  const longitude =
    custom.longitude !== undefined &&
    custom.longitude !== null
      ? (
          toSafeNumber(
            custom.longitude,
            125.1999
          ) ?? 125.1999
        )
      : 125.1999;

  const registeredBy =
    custom.registeredBy ||
    'Municipal Agriculture Officer';

  const priceValue =
    row.priceEstimate ??
    row.price_estimate ??
    null;

  const estimatedPricePhp =
    toSafeNumber(priceValue, null);

  return {
    id: String(row.id),

    pigIdTag,

    earTagNo:
      row.earTagNo ||
      row.ear_tag_no ||
      pigIdTag,

    registry_id: pigIdTag,

    farmerName:
      row.farmerName ||
      row.farmer_name ||
      'No farmer assigned',

    farmerContact:
      row.farmerContact ||
      row.farmer_contact ||
      '',

    farmerAddress,

    farmName:
      row.farmName ||
      row.farm_name ||
      '',

    barangay: barangayName,

    barangay_id: barangayId,

    farmType:
      farmScale === 'BACKYARD'
        ? 'backyard'
        : 'commercial',

    farmScale,

    asfZone,

    swineType:
      (
        row.swineType ||
        row.swine_type ||
        'grower'
      ).toLowerCase() as any,

    breed:
      row.breed ||
      custom.breed ||
      'Large White Cross',

    ageWeeks:
      Math.round(
        Number(safeDays) / 7
      ),

    ageDays:
      Number(safeDays) || 0,

    ageMonths:
      Number(safeMonths) || 0,

    birthDate,

    dateOfBirth: birthDate,

    date_of_birth: birthDate,

    dob: birthDate,

    age: {
      years: age.years,
      months: age.months,
      days: age.days,
      totalDays: age.totalDays,
      totalMonths: age.totalMonths,
      display: age.display,
      isValid: age.isValid,
    },

    weightKg: weightNum,

    actualWeightKg: actualWeightNum,

    estimatedWeightKg:
      estimatedWeightRange,

    gender:
      (
        row.gender ||
        custom.gender ||
        'castrated'
      ) as any,

    photoUrl:
      row.photoUrl ||
      row.photo_url ||
      '',

    latitude,

    longitude,

    status:
      (
        row.status ||
        'healthy'
      ).toLowerCase() as any,

    readyToSell:
      toSafeBoolean(
        row.readyToSell ??
        row.ready_to_sell
      ),

    estimatedPricePhp:
      estimatedPricePhp !== null
        ? estimatedPricePhp
        : undefined,

    isArchived:
      toSafeBoolean(
        row.isArchived ??
        row.is_archived
      ),

    biosecurity:
      custom.biosecurity ||
      {
        perimeterFence: true,
        footbathInstalled: true,
        disinfectionRoutine: true,
        quarantinePenAvailable: false,
        potableWaterSource: true,
        standardFeedStorage: true,
        asfVaccinationOrTesting: true,
        noSwillFeeding: true,
        visitorLogbook: false,
        wasteLagoonOrCompost: true,
      },

    notes:
      custom.notes || '',

    registeredBy,

    registeredAt:
      row.registeredAt ||
      row.registered_at ||
      new Date().toISOString(),

    updatedAt:
      row.updatedAt ||
      row.updated_at ||
      row.createdAt ||
      row.created_at ||
      new Date().toISOString(),

    customFields: custom,

    isSynced: true,
  };
}

/**
 * Convert application's SwineRecord into the PostgreSQL schema format.
 */
export function mapSwineToDb(s: any) {
  const record = s && typeof s === 'object' ? s : {};
  const birthDate =
    record.birthDate ||
    record.dateOfBirth ||
    record.date_of_birth ||
    record.dob ||
    '';

  const age =
    calculateSwineAge(birthDate);

  const safeDays =
    age.isValid
      ? age.totalDays
      : (
          typeof record.ageDays === 'number' && Number.isFinite(record.ageDays)
            ? Math.trunc(record.ageDays)
            : null
        );

  const safeMonths =
    age.isValid
      ? String(age.totalMonths)
      : String(
          record.ageMonths ?? ''
        );

  const estimatedWeightRange =
    getEstimatedWeightRange(
      safeDays || 0
    );

  const weightValue =
    toSafeNumber(
      record.actualWeightKg ??
      record.weightKg,
      null
    );

  const candidateId = String(record.id || '');
  const id = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(candidateId)
    ? candidateId
    : randomUUID();
  const computedPigId = String(
    record.pigIdTag || record.earTagNo || record.computedPigId || id
  );

  /**
   * Keep extra application fields inside JSONB.
   */
  const rawCustomPayload = {
    ...(record.customFields &&
    typeof record.customFields === 'object' &&
    !Array.isArray(record.customFields)
      ? record.customFields
      : {}),

    farmerAddress:
      record.farmerAddress || '',

    barangayId:
      record.barangay_id ||
      record.barangayId ||
      '',

    registeredBy:
      record.registeredBy ||
      'Municipal Agriculture Officer',

    latitude:
      toSafeNumber(
        record.latitude,
        10.3969
      ),

    longitude:
      toSafeNumber(
        record.longitude,
        125.1999
      ),

    weightKg:
      weightValue !== null
        ? weightValue
        : 60,

    biosecurity:
      record.biosecurity,

    breed:
      record.breed,

    gender:
      record.gender,

    notes:
      record.notes,

    penCapacity:
      record.penCapacity,

    rsbsaId:
      record.rsbsaId,

    distanceToWaterSourceMeters:
      record.distanceToWaterSourceMeters,

    distanceToTourismSchoolMeters:
      record.distanceToTourismSchoolMeters,

    distanceToBuiltUpMeters:
      record.distanceToBuiltUpMeters,

    setbackCompliant:
      record.setbackCompliant,
  };
  const customPayload = toJsonSafeValue(rawCustomPayload);

  return {
    id,

    computedPigId,

    pigIdTag:
      String(record.pigIdTag || record.earTagNo || id),

    earTagNo:
      String(record.earTagNo || record.pigIdTag || id),

    farmerName:
      String(record.farmerName ||
      'No farmer assigned',
      ),

    farmName:
      record.farmName ||
      record.farmerAddress ||
      '',

    farmerContact:
      record.farmerContact ||
      '',

    barangay:
      String(record.barangay ||
      'Ambacon',
      ),

    birthDate,

    ageDays:
      safeDays,

    ageMonths:
      safeMonths,

    estimatedWeightKg:
      estimatedWeightRange,

    actualWeightKg:
      weightValue !== null
        ? String(weightValue)
        : null,

    swineType:
      (
        record.swineType ||
        'grower'
      ).toUpperCase(),

    farmScale:
      (
        record.farmScale ||
        'BACKYARD'
      ).toUpperCase(),

    asfZone:
      (
        record.asfZone ||
        'RED'
      ).toUpperCase(),

    biosecurityWarning:
      toSafeBoolean(
        record.biosecurityWarning ||
        record.hasWarning
      ),

    status:
      (
        record.status ||
        'HEALTHY'
      ).toUpperCase(),

    readyToSell:
      toSafeBoolean(
        record.readyToSell
      ),

    priceEstimate:
      toSafeNumber(
        record.estimatedPricePhp ??
        record.priceEstimate,
        null
      ) !== null
        ? String(
            toSafeNumber(
              record.estimatedPricePhp ??
              record.priceEstimate,
              null
            )
          )
        : null,

    photoUrl:
      record.photoUrl ||
      '',

    isArchived:
      toSafeBoolean(
        record.isArchived
      ),

    registeredAt:
      String(record.registeredAt ||
      new Date().toISOString(),
      ),

    customFields:
      customPayload,
  };
}

/**
 * Get all swine records.
 */
export async function getAllSwineRecords(
  filters?: {
    barangay?: string;
    search?: string;
    status?: string;
    readyToSell?: boolean;
    isArchived?: boolean;
    page?: number;
    perPage?: number;
  }
): Promise<{
  records: SwineRecord[];
  total: number;
}> {
  try {
    const conditions: any[] = [];

    if (
      filters?.barangay &&
      filters.barangay !== 'all'
    ) {
      conditions.push(
        ilike(
          swineRecords.barangay,
          filters.barangay
        )
      );
    }

    if (
      filters?.status &&
      filters.status !== 'all'
    ) {
      conditions.push(
        ilike(
          swineRecords.status,
          filters.status
        )
      );
    }

    if (
      filters?.readyToSell !== undefined
    ) {
      conditions.push(
        eq(
          swineRecords.readyToSell,
          filters.readyToSell
        )
      );
    }

    if (
      filters?.isArchived !== undefined
    ) {
      conditions.push(
        eq(
          swineRecords.isArchived,
          filters.isArchived
        )
      );
    }

    if (
      filters?.search &&
      filters.search.trim()
    ) {
      const q =
        `%${filters.search.trim()}%`;

      conditions.push(
        or(
          ilike(
            swineRecords.pigIdTag,
            q
          ),
          ilike(
            swineRecords.earTagNo,
            q
          ),
          ilike(
            swineRecords.farmerName,
            q
          ),
          ilike(
            swineRecords.farmName,
            q
          ),
          ilike(
            swineRecords.barangay,
            q
          )
        )
      );
    }

    const whereClause =
      conditions.length > 0
        ? and(...conditions)
        : undefined;

    let query =
      db
        .select()
        .from(swineRecords);

    if (whereClause) {
      query =
        query.where(
          whereClause
        ) as any;
    }

    query =
      query.orderBy(
        desc(
          swineRecords.createdAt
        )
      ) as any;

    if (
      filters?.page &&
      filters?.perPage
    ) {
      const offset =
        (
          filters.page - 1
        ) *
        filters.perPage;

      query =
        query
          .limit(filters.perPage)
          .offset(offset) as any;
    }

    const rawRows =
      await query;

    const records =
      rawRows.map(
        mapDbToSwine
      );

    let countQuery =
      db
        .select({
          count:
            sql<number>`count(*)`,
        })
        .from(swineRecords);

    if (whereClause) {
      countQuery =
        countQuery.where(
          whereClause
        ) as any;
    }

    const countResult =
      await countQuery;

    const total =
      Number(
        countResult[0]?.count ??
        records.length
      );

    return {
      records,
      total,
    };
  } catch (error: any) {
    throw createDatabaseError(
      'query',
      error
    );
  }
}

/**
 * Get one swine record by ID, Pig ID, or computed Pig ID.
 */
export async function getSwineRecordById(
  id: string
): Promise<SwineRecord | null> {
  try {
    const rows =
      await db
        .select()
        .from(swineRecords)
        .where(
          or(
            eq(
              swineRecords.id,
              id
            ),
            eq(
              swineRecords.pigIdTag,
              id
            ),
            eq(
              swineRecords.computedPigId,
              id
            )
          )
        )
        .limit(1);

    if (
      rows.length === 0
    ) {
      return null;
    }

    return mapDbToSwine(
      rows[0]
    );
  } catch (error: any) {
    throw createDatabaseError(
      'lookup',
      error
    );
  }
}

/**
 * Insert or update one swine record.
 *
 * IMPORTANT:
 * The update set intentionally excludes the primary key "id".
 */
export async function upsertSwineRecord(
  record: any
): Promise<SwineRecord> {
  try {
    const dbRecord =
      mapSwineToDb(record);

    console.log(
      '[SWINE SAVE] Attempting database save:',
      JSON.stringify({
        id:
          dbRecord.id,

        computedPigId:
          dbRecord.computedPigId,

        pigIdTag:
          dbRecord.pigIdTag,

        earTagNo:
          dbRecord.earTagNo,

        farmerName:
          dbRecord.farmerName,

        farmerContact:
          dbRecord.farmerContact,

        barangay:
          dbRecord.barangay,
      })
    );

    const result =
      await db
        .insert(swineRecords)
        .values(dbRecord)
        .onConflictDoUpdate({
          target:
            swineRecords.id,

          set: {
            computedPigId:
              dbRecord.computedPigId,

            pigIdTag:
              dbRecord.pigIdTag,

            earTagNo:
              dbRecord.earTagNo,

            farmerName:
              dbRecord.farmerName,

            farmName:
              dbRecord.farmName,

            farmerContact:
              dbRecord.farmerContact,

            barangay:
              dbRecord.barangay,

            birthDate:
              dbRecord.birthDate,

            ageDays:
              dbRecord.ageDays,

            ageMonths:
              dbRecord.ageMonths,

            estimatedWeightKg:
              dbRecord.estimatedWeightKg,

            actualWeightKg:
              dbRecord.actualWeightKg,

            swineType:
              dbRecord.swineType,

            farmScale:
              dbRecord.farmScale,

            asfZone:
              dbRecord.asfZone,

            biosecurityWarning:
              dbRecord.biosecurityWarning,

            status:
              dbRecord.status,

            readyToSell:
              dbRecord.readyToSell,

            priceEstimate:
              dbRecord.priceEstimate,

            photoUrl:
              dbRecord.photoUrl,

            isArchived:
              dbRecord.isArchived,

            registeredAt:
              dbRecord.registeredAt,

            customFields:
              dbRecord.customFields,
          },
        })
        .returning();

    if (
      !result ||
      result.length === 0
    ) {
      throw new Error(
        'PostgreSQL did not return the saved swine record.'
      );
    }

    const saved =
      mapDbToSwine(
        result[0]
      );

    persistLocalDatabase()
      .catch(() => {});

    console.log(
      '[SWINE SAVE] Database save successful:',
      saved.id
    );

    return saved;
  } catch (error: any) {
    throw createDatabaseError(
      'save',
      error
    );
  }
}

/**
 * Insert/update multiple swine records.
 *
 * Uses the same safe explicit update list as the single-record operation.
 */
export async function batchUpsertSwineRecords(
  records: any[]
): Promise<SwineRecord[]> {
  if (
    !records ||
    records.length === 0
  ) {
    return [];
  }

  try {
    const dbRecords =
      records.map(
        mapSwineToDb
      );

    const results:
      SwineRecord[] = [];

    const batchSize = 50;

    for (
      let i = 0;
      i < dbRecords.length;
      i += batchSize
    ) {
      const batch =
        dbRecords.slice(
          i,
          i + batchSize
        );

      for (
        const item of batch
      ) {
        const result =
          await db
            .insert(swineRecords)
            .values(item)
            .onConflictDoUpdate({
              target:
                swineRecords.id,

              set: {
                computedPigId:
                  item.computedPigId,

                pigIdTag:
                  item.pigIdTag,

                earTagNo:
                  item.earTagNo,

                farmerName:
                  item.farmerName,

                farmName:
                  item.farmName,

                farmerContact:
                  item.farmerContact,

                barangay:
                  item.barangay,

                birthDate:
                  item.birthDate,

                ageDays:
                  item.ageDays,

                ageMonths:
                  item.ageMonths,

                estimatedWeightKg:
                  item.estimatedWeightKg,

                actualWeightKg:
                  item.actualWeightKg,

                swineType:
                  item.swineType,

                farmScale:
                  item.farmScale,

                asfZone:
                  item.asfZone,

                biosecurityWarning:
                  item.biosecurityWarning,

                status:
                  item.status,

                readyToSell:
                  item.readyToSell,

                priceEstimate:
                  item.priceEstimate,

                photoUrl:
                  item.photoUrl,

                isArchived:
                  item.isArchived,

                registeredAt:
                  item.registeredAt,

                customFields:
                  item.customFields,
              },
            })
            .returning();

        if (
          result &&
          result[0]
        ) {
          results.push(
            mapDbToSwine(
              result[0]
            )
          );
        }
      }
    }

    persistLocalDatabase()
      .catch(() => {});

    return results;
  } catch (error: any) {
    throw createDatabaseError(
      'batch save',
      error
    );
  }
}

/**
 * Delete one swine record.
 */
export async function deleteSwineRecordById(
  id: string
): Promise<boolean> {
  try {
    await db
      .delete(swineRecords)
      .where(
        eq(
          swineRecords.id,
          id
        )
      );

    persistLocalDatabase()
      .catch(() => {});

    return true;
  } catch (error: any) {
    throw createDatabaseError(
      'delete',
      error
    );
  }
}

/**
 * Delete multiple swine records.
 */
export async function deleteSwineRecordsByIds(
  ids: string[]
): Promise<number> {
  try {
    if (
      !ids ||
      ids.length === 0
    ) {
      return 0;
    }

    const result =
      await db
        .delete(swineRecords)
        .where(
          inArray(
            swineRecords.id,
            ids
          )
        )
        .returning({
          id:
            swineRecords.id,
        });

    persistLocalDatabase()
      .catch(() => {});

    return result.length;
  } catch (error: any) {
    throw createDatabaseError(
      'bulk delete',
      error
    );
  }
}
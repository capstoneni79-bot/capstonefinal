import { db, persistLocalDatabase } from './index.ts';
import { swineRecords } from './schema.ts';
import { eq, inArray, and, ilike, or, desc, sql } from 'drizzle-orm';
import { SwineRecord } from '../types.ts';
import { calculateSwineAge, getEstimatedWeightRange, getBarangayASFZone, classifyFarmScale } from '../utils/swineRegistryLogic.ts';

export function mapDbToSwine(row: any): SwineRecord {
  const birthDate = row.birthDate || row.birth_date || row.dateOfBirth || row.date_of_birth || row.dob || '';
  const age = calculateSwineAge(birthDate);
  const safeDays = age.isValid ? age.totalDays : (row.ageDays ?? row.age_days ?? 0);
  const safeMonths = age.isValid ? age.totalMonths : (row.ageMonths ?? row.age_months ?? 0);
  const estimatedWeightRange = getEstimatedWeightRange(safeDays);

  const custom = (row.customFields || row.custom_fields) && typeof (row.customFields || row.custom_fields) === 'object'
    ? (row.customFields || row.custom_fields)
    : {};

  const actualWeightNum = row.actualWeightKg !== undefined && row.actualWeightKg !== null && row.actualWeightKg !== ''
    ? Number(row.actualWeightKg)
    : (row.actual_weight_kg !== undefined && row.actual_weight_kg !== null && row.actual_weight_kg !== ''
      ? Number(row.actual_weight_kg)
      : (custom.weightKg !== undefined && custom.weightKg !== null ? Number(custom.weightKg) : null));

  const weightNum = actualWeightNum !== null ? actualWeightNum : 60;

  const barangayName = row.barangay || 'Ambacon';
  const farmScale = row.farmScale || row.farm_scale || classifyFarmScale(custom.penCapacity || 5);
  const asfZone = row.asfZone || row.asf_zone || getBarangayASFZone(barangayName);
  const pigIdTag = row.pigIdTag || row.pig_id_tag || row.computedPigId || row.computed_pig_id || row.id;

  const farmerAddress = custom.farmerAddress || row.farmName || row.farm_name || '';
  const barangayId = custom.barangayId || `brgy-${barangayName.toLowerCase().replace(/\s+/g, '-')}`;
  const latitude = custom.latitude !== undefined && custom.latitude !== null
    ? Number(custom.latitude)
    : 10.3969;
  const longitude = custom.longitude !== undefined && custom.longitude !== null
    ? Number(custom.longitude)
    : 125.1999;
  const registeredBy = custom.registeredBy || 'Municipal Agriculture Officer';

  return {
    id: String(row.id),
    pigIdTag,
    earTagNo: row.earTagNo || row.ear_tag_no || pigIdTag,
    registry_id: pigIdTag,
    farmerName: row.farmerName || row.farmer_name || 'No farmer assigned',
    farmerContact: row.farmerContact || row.farmer_contact || '',
    farmerAddress,
    farmName: row.farmName || row.farm_name || '',
    barangay: barangayName,
    barangay_id: barangayId,
    farmType: farmScale === 'BACKYARD' ? 'backyard' : 'commercial',
    farmScale,
    asfZone,
    swineType: (row.swineType || row.swine_type || 'grower').toLowerCase() as any,
    breed: row.breed || custom.breed || 'Large White Cross',
    ageWeeks: Math.round(safeDays / 7),
    ageDays: safeDays,
    ageMonths: safeMonths,
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
    estimatedWeightKg: estimatedWeightRange,
    gender: (row.gender || custom.gender || 'castrated') as any,
    photoUrl: row.photoUrl || row.photo_url || '',
    latitude,
    longitude,
    status: (row.status || 'healthy').toLowerCase() as any,
    readyToSell: Boolean(row.readyToSell ?? row.ready_to_sell),
    estimatedPricePhp: row.priceEstimate || row.price_estimate ? Number(row.priceEstimate || row.price_estimate) : undefined,
    isArchived: Boolean(row.isArchived ?? row.is_archived),
    biosecurity: custom.biosecurity || {
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
    notes: custom.notes || '',
    registeredBy,
    registeredAt: row.registeredAt || row.registered_at || new Date().toISOString(),
    updatedAt: row.createdAt || row.created_at || new Date().toISOString(),
    customFields: custom,
    isSynced: true,
  };
}

export function mapSwineToDb(s: any) {
  const birthDate = s.birthDate || s.dateOfBirth || s.date_of_birth || s.dob || '';
  const age = calculateSwineAge(birthDate);
  const safeDays = age.isValid ? age.totalDays : (typeof s.ageDays === 'number' ? s.ageDays : null);
  const safeMonths = age.isValid ? String(age.totalMonths) : String(s.ageMonths || '');
  const estimatedWeightRange = getEstimatedWeightRange(safeDays || 0);

  const customPayload = {
    ...(s.customFields && typeof s.customFields === 'object' ? s.customFields : {}),
    farmerAddress: s.farmerAddress || '',
    barangayId: s.barangay_id || s.barangayId || '',
    registeredBy: s.registeredBy || 'Municipal Agriculture Officer',
    latitude: s.latitude !== undefined && s.latitude !== null ? Number(s.latitude) : 10.3969,
    longitude: s.longitude !== undefined && s.longitude !== null ? Number(s.longitude) : 125.1999,
    weightKg: s.weightKg !== undefined && s.weightKg !== null ? Number(s.weightKg) : (s.actualWeightKg ? Number(s.actualWeightKg) : 60),
    biosecurity: s.biosecurity,
    breed: s.breed,
    gender: s.gender,
    notes: s.notes,
    penCapacity: s.penCapacity,
    rsbsaId: s.rsbsaId,
    distanceToWaterSourceMeters: s.distanceToWaterSourceMeters,
    distanceToTourismSchoolMeters: s.distanceToTourismSchoolMeters,
    distanceToBuiltUpMeters: s.distanceToBuiltUpMeters,
    setbackCompliant: s.setbackCompliant,
  };

  return {
    id: String(s.id),
    computedPigId: s.pigIdTag || s.earTagNo || s.computedPigId || s.id,
    pigIdTag: s.pigIdTag || s.earTagNo || s.id,
    earTagNo: s.earTagNo || s.pigIdTag || s.id,
    farmerName: s.farmerName || 'No farmer assigned',
    farmName: s.farmName || s.farmerAddress || '',
    farmerContact: s.farmerContact || '',
    barangay: s.barangay || 'Ambacon',
    birthDate,
    ageDays: safeDays,
    ageMonths: safeMonths,
    estimatedWeightKg: estimatedWeightRange,
    actualWeightKg: s.actualWeightKg !== undefined && s.actualWeightKg !== null ? String(s.actualWeightKg) : (s.weightKg ? String(s.weightKg) : null),
    swineType: (s.swineType || 'grower').toUpperCase(),
    farmScale: (s.farmScale || 'BACKYARD').toUpperCase(),
    asfZone: (s.asfZone || 'RED').toUpperCase(),
    biosecurityWarning: Boolean(s.biosecurityWarning || s.hasWarning),
    status: (s.status || 'HEALTHY').toUpperCase(),
    readyToSell: Boolean(s.readyToSell),
    priceEstimate: s.estimatedPricePhp ? String(s.estimatedPricePhp) : (s.priceEstimate ? String(s.priceEstimate) : null),
    photoUrl: s.photoUrl || '',
    isArchived: Boolean(s.isArchived),
    registeredAt: s.registeredAt || new Date().toISOString(),
    customFields: customPayload,
  };
}

export async function getAllSwineRecords(filters?: {
  barangay?: string;
  search?: string;
  status?: string;
  readyToSell?: boolean;
  isArchived?: boolean;
  page?: number;
  perPage?: number;
}): Promise<{ records: SwineRecord[]; total: number }> {
  try {
    const conditions: any[] = [];

    if (filters?.barangay && filters.barangay !== 'all') {
      conditions.push(ilike(swineRecords.barangay, filters.barangay));
    }

    if (filters?.status && filters.status !== 'all') {
      conditions.push(ilike(swineRecords.status, filters.status));
    }

    if (filters?.readyToSell !== undefined) {
      conditions.push(eq(swineRecords.readyToSell, filters.readyToSell));
    }

    if (filters?.isArchived !== undefined) {
      conditions.push(eq(swineRecords.isArchived, filters.isArchived));
    }

    if (filters?.search && filters.search.trim()) {
      const q = `%${filters.search.trim()}%`;
      conditions.push(
        or(
          ilike(swineRecords.pigIdTag, q),
          ilike(swineRecords.earTagNo, q),
          ilike(swineRecords.farmerName, q),
          ilike(swineRecords.farmName, q),
          ilike(swineRecords.barangay, q)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    let query = db.select().from(swineRecords);
    if (whereClause) {
      query = query.where(whereClause) as any;
    }

    query = query.orderBy(desc(swineRecords.createdAt)) as any;

    if (filters?.page && filters?.perPage) {
      const offset = (filters.page - 1) * filters.perPage;
      query = query.limit(filters.perPage).offset(offset) as any;
    }

    const rawRows = await query;
    const records = rawRows.map(mapDbToSwine);

    // Total count calculation
    let countQuery = db.select({ count: sql<number>`count(*)` }).from(swineRecords);
    if (whereClause) {
      countQuery = countQuery.where(whereClause) as any;
    }
    const countResult = await countQuery;
    const total = Number(countResult[0]?.count || records.length);

    return { records, total };
  } catch (error) {
    console.error('Database query failed for getAllSwineRecords:', error);
    throw new Error('Unable to connect to the Swine Registry database. Please check the backend connection.', { cause: error });
  }
}

export async function getSwineRecordById(id: string): Promise<SwineRecord | null> {
  try {
    const rows = await db
      .select()
      .from(swineRecords)
      .where(or(eq(swineRecords.id, id), eq(swineRecords.pigIdTag, id), eq(swineRecords.computedPigId, id)))
      .limit(1);

    if (rows.length === 0) return null;
    return mapDbToSwine(rows[0]);
  } catch (error) {
    console.error('Database query failed for getSwineRecordById:', error);
    throw new Error('Unable to connect to the Swine Registry database.', { cause: error });
  }
}

export async function upsertSwineRecord(record: any): Promise<SwineRecord> {
  try {
    const dbRecord = mapSwineToDb(record);
    const result = await db
      .insert(swineRecords)
      .values(dbRecord)
      .onConflictDoUpdate({
        target: swineRecords.id,
        set: dbRecord,
      })
      .returning();

    const saved = mapDbToSwine(result[0]);
    persistLocalDatabase().catch(() => {});
    return saved;
  } catch (error) {
    console.error('Database query failed for upsertSwineRecord:', error);
    throw new Error('Database save failed. Please check the backend connection.', { cause: error });
  }
}

export async function batchUpsertSwineRecords(records: any[]): Promise<SwineRecord[]> {
  if (!records || records.length === 0) return [];
  try {
    const dbRecords = records.map(mapSwineToDb);
    const results: SwineRecord[] = [];
    
    // Process in batches of 50 to avoid parameter limit in postgres
    const batchSize = 50;
    for (let i = 0; i < dbRecords.length; i += batchSize) {
      const batch = dbRecords.slice(i, i + batchSize);
      for (const item of batch) {
        const res = await db
          .insert(swineRecords)
          .values(item)
          .onConflictDoUpdate({
            target: swineRecords.id,
            set: item,
          })
          .returning();
        if (res && res[0]) {
          results.push(mapDbToSwine(res[0]));
        }
      }
    }
    persistLocalDatabase().catch(() => {});
    return results;
  } catch (error) {
    console.error('Database query failed for batchUpsertSwineRecords:', error);
    throw new Error('Database batch upsert failed. Please check the backend connection.', { cause: error });
  }
}

export async function deleteSwineRecordById(id: string): Promise<boolean> {
  try {
    await db.delete(swineRecords).where(eq(swineRecords.id, id));
    persistLocalDatabase().catch(() => {});
    return true;
  } catch (error) {
    console.error('Database query failed for deleteSwineRecordById:', error);
    throw new Error('Database deletion failed.', { cause: error });
  }
}

export async function deleteSwineRecordsByIds(ids: string[]): Promise<number> {
  try {
    if (ids.length === 0) return 0;
    const result = await db
      .delete(swineRecords)
      .where(inArray(swineRecords.id, ids))
      .returning({ id: swineRecords.id });
    persistLocalDatabase().catch(() => {});
    return result.length;
  } catch (error) {
    console.error('Database query failed for deleteSwineRecordsByIds:', error);
    throw new Error('Database bulk delete failed.', { cause: error });
  }
}

import { Barangay, FarmScale, ASFZone, SwineRecord, SwineType } from '../types';
import { HINUNANGAN_BARANGAYS } from '../data/barangays';

/**
 * FARM SCALE CLASSIFICATION RULES
 * Standardized for Municipality of Hinunangan
 * - Backyard Farm: 1 to 20 heads (Under Municipal Ordinance No. 2025-59)
 * - Commercial Medium: 21 to 100 heads
 * - Commercial Large: 101+ heads
 */
export const FARM_SCALE_RULES = {
  BACKYARD_MAX_HEADS: 20,
  COMMERCIAL_MEDIUM_MAX_HEADS: 100,
} as const;

/**
 * Validates Pig ID Tag format: HIN-YYYY-XXXX (e.g. HIN-2026-0001)
 */
export function isValidPigIdTag(tag: string | undefined | null): boolean {
  if (!tag || typeof tag !== 'string') return false;
  return /^HIN-\d{4}-\d{4,}$/.test(tag.trim());
}

/**
 * Generates the next sequential unique Pig ID Tag: HIN-YYYY-XXXX
 * Dynamic year (e.g. 2026), zero-padded 4-digit sequence (e.g. 0001, 0002).
 * Strictly immutable once assigned.
 */
export function generateNextPigIdTag(
  existingRecords: SwineRecord[] = [],
  year: number = new Date().getFullYear()
): string {
  const currentYear = year || new Date().getFullYear();
  const prefix = `HIN-${currentYear}-`;

  // Extract all existing sequence numbers for this year
  const existingNumbers: number[] = [];
  const existingTags = new Set<string>();

  existingRecords.forEach(record => {
    const tagsToCheck = [record.pigIdTag, record.earTagNo].filter(Boolean) as string[];
    tagsToCheck.forEach(tag => {
      const trimmed = tag.trim().toUpperCase();
      existingTags.add(trimmed);
      if (trimmed.startsWith(prefix)) {
        const seqPart = trimmed.substring(prefix.length);
        const parsed = parseInt(seqPart, 10);
        if (!isNaN(parsed) && parsed > 0) {
          existingNumbers.push(parsed);
        }
      }
    });
  });

  let nextSeq = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
  let candidateTag = `${prefix}${String(nextSeq).padStart(4, '0')}`;

  // Ensure collision-free uniqueness
  while (existingTags.has(candidateTag.toUpperCase())) {
    nextSeq++;
    candidateTag = `${prefix}${String(nextSeq).padStart(4, '0')}`;
  }

  return candidateTag;
}

export interface SwineAgeCalculationResult {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  totalMonths: number;
  displayText: string;
  display: string;
  isValid: boolean;
  hasDob: boolean;
  errorMessage?: string;
}

/**
 * Proper calendar-based date difference calculation for swine age.
 * - Under 1 month: "16 days" (or "0 days", "1 day")
 * - 1 month or older: "8 months, 16 days" (or "1 month", "2 months")
 * - 1 year or older: "1 year, 2 months, 5 days"
 *
 * If no DOB is recorded:
 * "Age unavailable — DOB not recorded"
 *
 * Future birth dates are strictly rejected:
 * "Date of birth cannot be in the future."
 */
export function calculateSwineAge(
  birthDateStr: string | undefined | null,
  referenceDateInput: Date | string = new Date()
): SwineAgeCalculationResult {
  const referenceDate =
    typeof referenceDateInput === 'string'
      ? referenceDateInput.trim()
        ? new Date(referenceDateInput)
        : new Date()
      : referenceDateInput || new Date();
  if (!birthDateStr || typeof birthDateStr !== 'string' || !birthDateStr.trim()) {
    return {
      years: 0,
      months: 0,
      days: 0,
      totalDays: 0,
      totalMonths: 0,
      displayText: 'Age unavailable — DOB not recorded',
      display: 'Age unavailable — DOB not recorded',
      isValid: false,
      hasDob: false,
      errorMessage: 'Age unavailable — DOB not recorded',
    };
  }

  // Parse YYYY-MM-DD components to prevent timezone offset shifts
  const cleanDateStr = birthDateStr.trim().split('T')[0];
  const parts = cleanDateStr.split(/[-/]/);
  if (parts.length !== 3) {
    return {
      years: 0,
      months: 0,
      days: 0,
      totalDays: 0,
      totalMonths: 0,
      displayText: 'Age unavailable — DOB not recorded',
      display: 'Age unavailable — DOB not recorded',
      isValid: false,
      hasDob: false,
      errorMessage: 'Invalid birth date format. Please use YYYY-MM-DD.',
    };
  }

  const birthYear = parseInt(parts[0], 10);
  const birthMonth = parseInt(parts[1], 10) - 1; // 0-indexed (0 to 11)
  const birthDay = parseInt(parts[2], 10);

  const birthDate = new Date(birthYear, birthMonth, birthDay, 0, 0, 0, 0);
  const refYear = referenceDate.getFullYear();
  const refMonth = referenceDate.getMonth();
  const refDay = referenceDate.getDate();
  const refMidnight = new Date(refYear, refMonth, refDay, 0, 0, 0, 0);

  if (isNaN(birthDate.getTime()) || isNaN(birthYear) || isNaN(birthMonth) || isNaN(birthDay)) {
    return {
      years: 0,
      months: 0,
      days: 0,
      totalDays: 0,
      totalMonths: 0,
      displayText: 'Age unavailable — DOB not recorded',
      display: 'Age unavailable — DOB not recorded',
      isValid: false,
      hasDob: false,
      errorMessage: 'Invalid birth date.',
    };
  }

  // Future date check
  if (birthDate.getTime() > refMidnight.getTime()) {
    return {
      years: 0,
      months: 0,
      days: 0,
      totalDays: 0,
      totalMonths: 0,
      displayText: 'Date of birth cannot be in the future.',
      display: 'Date of birth cannot be in the future.',
      isValid: false,
      hasDob: true,
      errorMessage: 'Date of birth cannot be in the future.',
    };
  }

  const diffTimeMs = refMidnight.getTime() - birthDate.getTime();
  const totalDays = Math.round(diffTimeMs / (1000 * 60 * 60 * 24));

  // Calendar-based date difference
  let years = refYear - birthYear;
  let months = refMonth - birthMonth;
  let days = refDay - birthDay;

  if (days < 0) {
    // Borrow days from the previous month of reference date
    const prevMonthDays = new Date(refYear, refMonth, 0).getDate();
    days += prevMonthDays;
    months -= 1;
  }

  if (months < 0) {
    months += 12;
    years -= 1;
  }

  const totalMonths = years * 12 + months;

  // Format display string according to preferred format:
  // Under 1 month: "16 days" (or "0 days", "1 day")
  // 1 month or older: "8 months, 16 days" (or "1 month", "2 months")
  // 1 year or older: "1 year, 2 months, 5 days"
  const yearText = `${years} ${years === 1 ? 'year' : 'years'}`;
  const monthText = months > 0 ? `${months} ${months === 1 ? 'month' : 'months'}` : '';
  const dayText = days > 0 ? `${days} ${days === 1 ? 'day' : 'days'}` : '';

  let display = '';
  if (years > 0) {
    const segments: string[] = [yearText];
    if (monthText) segments.push(monthText);
    if (dayText) segments.push(dayText);
    display = segments.join(', ');
  } else if (months > 0) {
    const segments: string[] = [monthText];
    if (dayText) segments.push(dayText);
    display = segments.join(', ');
  } else {
    display = dayText || '0 days';
  }

  return {
    years,
    months,
    days,
    totalDays,
    totalMonths,
    displayText: display,
    display,
    isValid: true,
    hasDob: true,
  };
}

/**
 * Format Date of Birth for human-readable display (e.g. "January 10, 2026")
 */
export function formatDobDisplay(birthDateStr: string | undefined | null): string {
  if (!birthDateStr || !birthDateStr.trim()) return 'Age unavailable — DOB not recorded';
  const clean = birthDateStr.trim().split('T')[0];
  const parts = clean.split(/[-/]/);
  if (parts.length !== 3) return 'Age unavailable — DOB not recorded';
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  const dateObj = new Date(y, m, d);
  if (isNaN(dateObj.getTime())) return 'Age unavailable — DOB not recorded';
  return dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

/**
 * Automatic Estimated Weight Range based on Age in Days:
 * - 0–30 DAYS: 2–8 kg
 * - 31–60 DAYS: 8–20 kg
 * - 61–120 DAYS: 20–60 kg
 * - 121–180+ DAYS (>= 121 days): 60–100+ kg
 */
export function getEstimatedWeightRange(ageDays: number): string {
  const safeDays = Math.max(0, Number(ageDays) || 0);
  if (safeDays <= 30) {
    return '2–8 kg';
  }
  if (safeDays <= 60) {
    return '8–20 kg';
  }
  if (safeDays <= 120) {
    return '20–60 kg';
  }
  return '60–100+ kg';
}

/**
 * Classifies Farm Scale based on total heads count / pen capacity
 * - BACKYARD: 1 to 20 heads
 * - COMMERCIAL_MEDIUM: 21 to 100 heads
 * - COMMERCIAL_LARGE: 101+ heads
 */
export function classifyFarmScale(headsCountOrCapacity: number | string | undefined | null): FarmScale {
  const count = Math.max(1, Number(headsCountOrCapacity) || 1);
  if (count <= FARM_SCALE_RULES.BACKYARD_MAX_HEADS) {
    return 'BACKYARD';
  }
  if (count <= FARM_SCALE_RULES.COMMERCIAL_MEDIUM_MAX_HEADS) {
    return 'COMMERCIAL_MEDIUM';
  }
  return 'COMMERCIAL_LARGE';
}

/**
 * Returns human-readable label for Farm Scale
 */
export function getFarmScaleLabel(scale: FarmScale): string {
  switch (scale) {
    case 'BACKYARD':
      return 'Backyard (1–20 heads)';
    case 'COMMERCIAL_MEDIUM':
      return 'Commercial Medium (21–100 heads)';
    case 'COMMERCIAL_LARGE':
      return 'Commercial Large (101+ heads)';
    default:
      return 'Backyard (1–20 heads)';
  }
}

/**
 * Determines the ASF Zone for a Barangay (RED, PINK, YELLOW, GREEN)
 */
export function getBarangayASFZone(
  barangayName: string,
  barangaysList?: Barangay[]
): ASFZone {
  const normalizedName = (barangayName || '').trim().toLowerCase();

  // Search in dynamic barangay list first
  if (barangaysList && barangaysList.length > 0) {
    const found = barangaysList.find(b => b.name.toLowerCase() === normalizedName);
    if (found) {
      if ((found as any).asfZone) {
        return (found as any).asfZone.toUpperCase() as ASFZone;
      }
      if (found.riskLevel) {
        const r = found.riskLevel.toUpperCase();
        if (r === 'RED') return 'RED';
        if (r === 'YELLOW') return 'YELLOW';
        if (r === 'PINK') return 'PINK';
        return 'GREEN';
      }
    }
  }

  // Search in standard 40 Hinunangan Barangays
  const official = HINUNANGAN_BARANGAYS.find(b => b.name.toLowerCase() === normalizedName);
  if (official) {
    const r = official.defaultRiskLevel.toUpperCase();
    if (r === 'RED') return 'RED';
    if (r === 'YELLOW') return 'YELLOW';
    return 'GREEN';
  }

  return 'GREEN';
}

/**
 * Immediate Breeding Boar Warning Logic:
 * Shows a high-visibility warning banner if a Breeding Boar is selected in a RED or PINK ASF zone.
 */
export function shouldShowASFWarning(
  swineType: string | undefined | null,
  asfZone: string | undefined | null
): boolean {
  if (!swineType || !asfZone) return false;
  const normalizedType = swineType.toUpperCase().replace(/[\s-]/g, '_');
  const isBoar =
    normalizedType === 'BOAR' ||
    normalizedType === 'BREEDING_BOAR' ||
    normalizedType.includes('BOAR') ||
    normalizedType.includes('BARAKO');

  const normalizedZone = asfZone.toUpperCase();
  const isHighRiskZone = normalizedZone === 'RED' || normalizedZone === 'PINK';

  return isBoar && isHighRiskZone;
}

export interface SwineValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  errorMessage?: string;
}

/**
 * Comprehensive Validation before saving Swine record to registry
 */
export function validateSwineRecordForSave(
  data: {
    pigIdTag?: string;
    earTagNo?: string;
    farmerName?: string;
    birthDate?: string;
    swineType?: SwineType | string;
    barangay?: string;
    farmScale?: FarmScale;
    asfZone?: ASFZone;
    biosecurityWarningAcknowledged?: boolean;
  },
  existingRecords: SwineRecord[] = [],
  currentRecordId?: string
): SwineValidationResult {
  const errors: Record<string, string> = {};

  // 1. Pig ID Tag Validation
  const idTag = (data.pigIdTag || data.earTagNo || '').trim();
  if (!idTag) {
    errors.pigIdTag = 'Pig ID Tag is required.';
  } else if (!isValidPigIdTag(idTag) && !/^HNG-[A-Z0-9]+-\d{4}-\d+$/i.test(idTag)) {
    errors.pigIdTag = `Invalid Pig ID format: "${idTag}". Must follow HIN-YYYY-XXXX (e.g. HIN-2026-0001).`;
  } else {
    // Check uniqueness across records
    const isDuplicate = existingRecords.some(r => {
      if (currentRecordId && r.id === currentRecordId) return false;
      return (
        (r.pigIdTag && r.pigIdTag.toUpperCase() === idTag.toUpperCase()) ||
        (r.earTagNo && r.earTagNo.toUpperCase() === idTag.toUpperCase())
      );
    });
    if (isDuplicate) {
      errors.pigIdTag = `Pig ID Tag "${idTag}" is already assigned to another swine record. Must be unique.`;
    }
  }

  // 2. Farmer Name
  if (!data.farmerName || !data.farmerName.trim()) {
    errors.farmerName = 'Farmer / Raiser Name is required.';
  }

  // 3. Birth Date Validation
  if (!data.birthDate) {
    errors.birthDate = 'Birth Date is required.';
  } else {
    const ageResult = calculateSwineAge(data.birthDate);
    if (!ageResult.isValid) {
      errors.birthDate = ageResult.errorMessage || 'Invalid birth date.';
    }
  }

  // 4. Biosecurity Warning Acknowledgment (Breeding Boar in RED/PINK Zone)
  const zone = data.asfZone || getBarangayASFZone(data.barangay || '');
  if (shouldShowASFWarning(data.swineType, zone)) {
    if (!data.biosecurityWarningAcknowledged) {
      errors.biosecurityWarning =
        'Biosecurity warning must be acknowledged for breeding boars in high-risk ASF zones.';
    }
  }

  const isValid = Object.keys(errors).length === 0;
  return {
    isValid,
    errors,
    errorMessage: isValid ? undefined : Object.values(errors)[0],
  };
}

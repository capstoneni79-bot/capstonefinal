import {
  generateNextPigIdTag,
  isValidPigIdTag,
  calculateSwineAge,
  getEstimatedWeightRange,
  classifyFarmScale,
  getFarmScaleLabel,
  getBarangayASFZone,
  shouldShowASFWarning,
  validateSwineRecordForSave,
  FARM_SCALE_RULES,
} from './swineRegistryLogic';
import { SwineRecord } from '../types';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    throw new Error(`Test assertion failed: ${testName}`);
  }
}

console.log('--- RUNNING SWINE REGISTRY LOGIC UNIT TESTS ---');

// 1. Pig ID Tag Format & Generator Tests
console.log('\n[1] Pig ID Tag Generator (HIN-YYYY-XXXX)');
const currentYear = new Date().getFullYear();
const tag1 = generateNextPigIdTag([]);
assert(isValidPigIdTag(tag1), `Generated tag "${tag1}" matches format HIN-YYYY-XXXX`);
assert(tag1 === `HIN-${currentYear}-0001`, `First tag is HIN-${currentYear}-0001`);

const mockRecords: Partial<SwineRecord>[] = [
  { id: '1', pigIdTag: `HIN-${currentYear}-0001` } as SwineRecord,
  { id: '2', pigIdTag: `HIN-${currentYear}-0002` } as SwineRecord,
];
const tag3 = generateNextPigIdTag(mockRecords as SwineRecord[]);
assert(tag3 === `HIN-${currentYear}-0003`, `Next sequential tag is HIN-${currentYear}-0003`);

// Test uniqueness when numbers have gaps
const mockRecordsWithGap: Partial<SwineRecord>[] = [
  { id: '1', pigIdTag: `HIN-${currentYear}-0005` } as SwineRecord,
];
const tag6 = generateNextPigIdTag(mockRecordsWithGap as SwineRecord[]);
assert(tag6 === `HIN-${currentYear}-0006`, `Next tag after 0005 is HIN-${currentYear}-0006`);

// Test invalid tag patterns
assert(!isValidPigIdTag(''), 'Empty string is not a valid Pig ID');
assert(!isValidPigIdTag('HIN-2026'), 'Incomplete tag is invalid');
assert(!isValidPigIdTag('HIN-26-0001'), '2-digit year is invalid');
assert(!isValidPigIdTag('TAG-2026-0001'), 'Wrong prefix is invalid');

// 2. Swine Age Calculation & Validation Tests (Calendar Math & Auto-Aging)
console.log('\n[2] Swine Age Calculation & Validation');
const refDate = new Date(2026, 8, 26); // Sept 26, 2026

// Future date rejection
const futureResult = calculateSwineAge('2026-09-30', refDate);
assert(!futureResult.isValid, 'Future birth date is marked invalid');
assert(futureResult.errorMessage === 'Date of birth cannot be in the future.', 'Correct future date error message: "Date of birth cannot be in the future."');
assert(futureResult.display === 'Date of birth cannot be in the future.', 'Future date display text is error message');

// Missing / empty DOB
const missingDobResult = calculateSwineAge('', refDate);
assert(!missingDobResult.hasDob, 'Empty DOB returns hasDob=false');
assert(missingDobResult.display === 'Age unavailable — DOB not recorded', 'Missing DOB displays "Age unavailable — DOB not recorded"');

// Born today (2026-09-26)
const todayResult = calculateSwineAge('2026-09-26', refDate);
assert(todayResult.isValid, 'Born today is valid');
assert(todayResult.display === '0 days', `Born today displays "0 days" (got "${todayResult.display}")`);

// DOB: 2026-09-20, Ref: 2026-09-26 -> 6 days
const res6d = calculateSwineAge('2026-09-20', refDate);
assert(res6d.display === '6 days', `DOB 2026-09-20 on 2026-09-26 displays "6 days" (got "${res6d.display}")`);

// 7 days ago (2026-09-19) -> 7 days
const res7d = calculateSwineAge('2026-09-19', refDate);
assert(res7d.display === '7 days', `DOB 2026-09-19 on 2026-09-26 displays "7 days" (got "${res7d.display}")`);

// 16 days ago (2026-09-10) -> 16 days
const res16d = calculateSwineAge('2026-09-10', refDate);
assert(res16d.display === '16 days', `DOB 2026-09-10 on 2026-09-26 displays "16 days" (got "${res16d.display}")`);

// DOB: 2026-08-26, Ref: 2026-09-26 -> 1 month
const res1m = calculateSwineAge('2026-08-26', refDate);
assert(res1m.display === '1 month', `DOB 2026-08-26 on 2026-09-26 displays "1 month" (got "${res1m.display}")`);

// 2 months ago (2026-07-26) -> 2 months
const res2m = calculateSwineAge('2026-07-26', refDate);
assert(res2m.display === '2 months', `DOB 2026-07-26 on 2026-09-26 displays "2 months" (got "${res2m.display}")`);

// DOB: 2026-01-10, Ref: 2026-09-26 -> 8 months, 16 days
const res8m16d = calculateSwineAge('2026-01-10', refDate);
assert(res8m16d.display === '8 months, 16 days', `DOB 2026-01-10 on 2026-09-26 displays "8 months, 16 days" (got "${res8m16d.display}")`);

// DOB: 2025-09-26, Ref: 2026-09-26 -> 1 year
const res1y = calculateSwineAge('2025-09-26', refDate);
assert(res1y.display === '1 year', `DOB 2025-09-26 on 2026-09-26 displays "1 year" (got "${res1y.display}")`);

// 1 year, 2 months, 5 days (DOB: 2025-07-21, Ref: 2026-09-26)
const res1y2m5d = calculateSwineAge('2025-07-21', refDate);
assert(res1y2m5d.display === '1 year, 2 months, 5 days', `DOB 2025-07-21 on 2026-09-26 displays "1 year, 2 months, 5 days" (got "${res1y2m5d.display}")`);

// 3. Automatic Estimated Weight Range Tests
console.log('\n[3] Estimated Weight Range based on Age in Days');
assert(getEstimatedWeightRange(0) === '2–8 kg', '0 days -> 2–8 kg');
assert(getEstimatedWeightRange(15) === '2–8 kg', '15 days -> 2–8 kg');
assert(getEstimatedWeightRange(30) === '2–8 kg', '30 days -> 2–8 kg');
assert(getEstimatedWeightRange(31) === '8–20 kg', '31 days -> 8–20 kg');
assert(getEstimatedWeightRange(60) === '8–20 kg', '60 days -> 8–20 kg');
assert(getEstimatedWeightRange(61) === '20–60 kg', '61 days -> 20–60 kg');
assert(getEstimatedWeightRange(120) === '20–60 kg', '120 days -> 20–60 kg');
assert(getEstimatedWeightRange(121) === '60–100+ kg', '121 days -> 60–100+ kg');
assert(getEstimatedWeightRange(180) === '60–100+ kg', '180 days -> 60–100+ kg');

// 4. Farm Scale Auto-Classification Tests
console.log('\n[4] Farm Scale Auto-Classification');
assert(FARM_SCALE_RULES.BACKYARD_MAX_HEADS === 20, 'Backyard max heads is 20');
assert(FARM_SCALE_RULES.COMMERCIAL_MEDIUM_MAX_HEADS === 100, 'Commercial medium max heads is 100');

assert(classifyFarmScale(1) === 'BACKYARD', '1 head -> BACKYARD');
assert(classifyFarmScale(10) === 'BACKYARD', '10 heads -> BACKYARD');
assert(classifyFarmScale(20) === 'BACKYARD', '20 heads -> BACKYARD');
assert(classifyFarmScale(21) === 'COMMERCIAL_MEDIUM', '21 heads -> COMMERCIAL_MEDIUM');
assert(classifyFarmScale(50) === 'COMMERCIAL_MEDIUM', '50 heads -> COMMERCIAL_MEDIUM');
assert(classifyFarmScale(100) === 'COMMERCIAL_MEDIUM', '100 heads -> COMMERCIAL_MEDIUM');
assert(classifyFarmScale(101) === 'COMMERCIAL_LARGE', '101 heads -> COMMERCIAL_LARGE');
assert(classifyFarmScale(500) === 'COMMERCIAL_LARGE', '500 heads -> COMMERCIAL_LARGE');

assert(getFarmScaleLabel('BACKYARD').includes('Backyard'), 'Correct label for BACKYARD');
assert(getFarmScaleLabel('COMMERCIAL_MEDIUM').includes('Commercial Medium'), 'Correct label for COMMERCIAL_MEDIUM');
assert(getFarmScaleLabel('COMMERCIAL_LARGE').includes('Commercial Large'), 'Correct label for COMMERCIAL_LARGE');

// 5. ASF Zone & Immediate Breeding Boar Warning Tests
console.log('\n[5] ASF Zone & Immediate Breeding Boar Warning');
assert(shouldShowASFWarning('boar', 'RED'), 'Boar in RED zone triggers warning');
assert(shouldShowASFWarning('boar', 'PINK'), 'Boar in PINK zone triggers warning');
assert(!shouldShowASFWarning('boar', 'YELLOW'), 'Boar in YELLOW zone does not trigger warning');
assert(!shouldShowASFWarning('boar', 'GREEN'), 'Boar in GREEN zone does not trigger warning');
assert(!shouldShowASFWarning('finisher', 'RED'), 'Finisher in RED zone does not trigger boar warning');
assert(!shouldShowASFWarning('sow', 'RED'), 'Sow in RED zone does not trigger boar warning');
assert(!shouldShowASFWarning('piglet', 'PINK'), 'Piglet in PINK zone does not trigger boar warning');

// 6. Swine Save Validation Tests
console.log('\n[6] Swine Save Validation');
const validSwine = {
  pigIdTag: `HIN-${currentYear}-0001`,
  farmerName: 'Juan Dela Cruz',
  birthDate: '2026-06-01',
  swineType: 'finisher',
  barangay: 'Poblacion',
  farmScale: 'BACKYARD' as const,
  asfZone: 'GREEN' as const,
};
const valResult1 = validateSwineRecordForSave(validSwine, []);
assert(valResult1.isValid, 'Valid swine record passes validation');

// Duplicate Pig ID Tag validation
const duplicateTagResult = validateSwineRecordForSave(
  validSwine,
  [{ id: 'rec-1', pigIdTag: `HIN-${currentYear}-0001` } as SwineRecord]
);
assert(!duplicateTagResult.isValid, 'Duplicate Pig ID Tag is rejected');
assert(!!duplicateTagResult.errors.pigIdTag, 'pigIdTag error field is set');

// Future birth date validation
const futureDateResult = validateSwineRecordForSave(
  { ...validSwine, birthDate: '2099-01-01' },
  []
);
assert(!futureDateResult.isValid, 'Future birth date in save validation is rejected');
assert(!!futureDateResult.errors.birthDate, 'birthDate error field is set');

// Breeding boar in RED zone without acknowledgment
const unackBoarResult = validateSwineRecordForSave(
  {
    ...validSwine,
    swineType: 'boar',
    asfZone: 'RED',
    biosecurityWarningAcknowledged: false,
  },
  []
);
assert(!unackBoarResult.isValid, 'Unacknowledged boar in RED zone is rejected');
assert(!!unackBoarResult.errors.biosecurityWarning, 'biosecurityWarning error field is set');

// Breeding boar in RED zone with acknowledgment
const ackBoarResult = validateSwineRecordForSave(
  {
    ...validSwine,
    swineType: 'boar',
    asfZone: 'RED',
    biosecurityWarningAcknowledged: true,
  },
  []
);
assert(ackBoarResult.isValid, 'Acknowledged boar in RED zone passes validation');

console.log(`\n🎉 ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);

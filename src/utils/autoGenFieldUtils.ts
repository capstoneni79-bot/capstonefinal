import { AutoGenType, RegistryFormField } from '../types';

export interface AutoGenContext {
  barangay?: string;
  prefix?: string;
}

export interface AutoGenPreset {
  type: AutoGenType;
  label: string;
  description: string;
  defaultPattern: string;
  example: string;
}

export const AUTOGEN_PRESETS: AutoGenPreset[] = [
  {
    type: 'ear_tag',
    label: 'Municipal Ear Tag Barcode',
    description: 'Hinunangan municipal standard format [HNG]-[BRGY]-[YEAR]-[RAND4]',
    defaultPattern: 'HNG-[BRGY]-[YEAR]-[RAND4]',
    example: 'HNG-LAB-2026-4921',
  },
  {
    type: 'tracking_code',
    label: 'Registration Tracking Number',
    description: 'Traceability tracking reference code TRK-[YEAR]-[RAND6]',
    defaultPattern: 'TRK-[YEAR]-[RAND6]',
    example: 'TRK-2026-839201',
  },
  {
    type: 'uuid',
    label: 'Alphanumeric Hash / Token',
    description: 'Unique short alphanumeric code SWN-[HEX4]-[HEX4]',
    defaultPattern: 'SWN-[HEX4]-[HEX4]',
    example: 'SWN-7F2A-98C1',
  },
  {
    type: 'timestamp',
    label: 'Current Date-Time Stamp',
    description: 'Philippine Standard Time stamp YYYY-MM-DD HH:mm',
    defaultPattern: '[YYYY]-[MM]-[DD] [HH]:[mm]',
    example: '2026-09-22 17:30',
  },
  {
    type: 'custom_pattern',
    label: 'Custom Template Pattern',
    description: 'Custom pattern supporting variables like [YEAR], [BRGY], [RAND4], [RAND6]',
    defaultPattern: 'HNG-REG-[YEAR]-[RAND4]',
    example: 'HNG-REG-2026-3819',
  },
];

// Helper to get 3-letter barangay code
export function getBarangayCode(barangayName?: string): string {
  if (!barangayName || barangayName.trim() === '') return 'HNG';
  const clean = barangayName.replace(/[^a-zA-Z]/g, '').toUpperCase();
  if (clean.length <= 3) return clean.padEnd(3, 'X');
  // First 3 consonants or letters
  return clean.substring(0, 3);
}

// Generate random digits of specific length
function randomDigits(len: number): string {
  let str = '';
  for (let i = 0; i < len; i++) {
    str += Math.floor(Math.random() * 10).toString();
  }
  return str;
}

// Generate random hex of specific length
function randomHex(len: number): string {
  const chars = '0123456789ABCDEF';
  let str = '';
  for (let i = 0; i < len; i++) {
    str += chars[Math.floor(Math.random() * chars.length)];
  }
  return str;
}

/**
 * Generate an auto-generated field value based on field configuration and optional context
 */
export function generateFieldValue(
  field: Pick<RegistryFormField, 'autoGenType' | 'autoGenPattern' | 'autoGenPrefix'>,
  context?: AutoGenContext
): string {
  const now = new Date();
  const year = now.getFullYear().toString();
  const yy = year.substring(2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  const brgyCode = getBarangayCode(context?.barangay);

  const autoType = field.autoGenType || 'tracking_code';

  if (autoType === 'timestamp') {
    return `${year}-${mm}-${dd} ${hh}:${min}`;
  }

  if (autoType === 'uuid') {
    return `SWN-${randomHex(4)}-${randomHex(4)}`;
  }

  if (autoType === 'ear_tag') {
    return `HNG-${brgyCode}-${year}-${randomDigits(4)}`;
  }

  if (autoType === 'tracking_code') {
    return `TRK-${year}-${randomDigits(6)}`;
  }

  // Custom pattern interpolation
  let pattern = field.autoGenPattern || 'HNG-REG-[YEAR]-[RAND4]';

  pattern = pattern
    .replace(/\[YEAR\]/g, year)
    .replace(/\[YYYY\]/g, year)
    .replace(/\[YY\]/g, yy)
    .replace(/\[MM\]/g, mm)
    .replace(/\[DD\]/g, dd)
    .replace(/\[HH\]/g, hh)
    .replace(/\[mm\]/g, min)
    .replace(/\[ss\]/g, ss)
    .replace(/\[BRGY\]/g, brgyCode)
    .replace(/\[RAND4\]/g, randomDigits(4))
    .replace(/\[RAND6\]/g, randomDigits(6))
    .replace(/\[RAND8\]/g, randomDigits(8))
    .replace(/\[HEX4\]/g, randomHex(4))
    .replace(/\[HEX\]/g, randomHex(6))
    .replace(/\[TIME\]/g, Date.now().toString().slice(-6));

  // Replace hash masks like ####
  pattern = pattern.replace(/####/g, () => randomDigits(4));
  pattern = pattern.replace(/###/g, () => randomDigits(3));

  if (field.autoGenPrefix && !pattern.startsWith(field.autoGenPrefix)) {
    pattern = `${field.autoGenPrefix}${pattern}`;
  }

  return pattern;
}

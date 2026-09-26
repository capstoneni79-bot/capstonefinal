import { RegistryFormField, RegistryFormSchema, RegistryFormSection, SwineRecord } from '../types';

/**
 * Converts a label or id into a clean, normalized fieldKey (e.g. 'Vaccination Status' -> 'vaccination_status')
 */
export function toFieldKey(label: string, fallbackId?: string): string {
  if (!label && fallbackId) {
    return fallbackId.replace(/^fld_/, '').toLowerCase();
  }
  const clean = (label || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .trim()
    .replace(/\s+/g, '_');
  return clean || (fallbackId ? fallbackId.replace(/^fld_/, '') : 'custom_field');
}

/**
 * Returns the effective unique key for a field
 */
export function getFieldKey(field: RegistryFormField): string {
  if (field.fieldKey && field.fieldKey.trim()) {
    return field.fieldKey.trim();
  }
  return toFieldKey(field.label, field.id);
}

export interface ActiveFieldItem {
  field: RegistryFormField;
  section: RegistryFormSection;
  fieldKey: string;
}

/**
 * Extracts all active (visible) fields across all visible sections in the schema
 */
export function getAllActiveFields(schema: RegistryFormSchema): ActiveFieldItem[] {
  if (!schema || !schema.sections) return [];
  const activeFields: ActiveFieldItem[] = [];

  for (const section of schema.sections) {
    if (section.visible === false) continue;
    for (const field of section.fields || []) {
      if (field.visible === false) continue;
      activeFields.push({
        field,
        section,
        fieldKey: getFieldKey(field),
      });
    }
  }

  return activeFields;
}

/**
 * Maps standard field IDs and keys to SwineRecord core properties
 */
export function getFieldValue(record: SwineRecord, field: RegistryFormField): any {
  if (!record) return undefined;
  const fId = field.id;
  const key = getFieldKey(field);

  // 1. Farm Info Fields
  if (fId === 'fld_farm_name' || key === 'farm_name' || key === 'farm_piggery_business_name') {
    return record.farmName || record.customFields?.['fld_farm_name'] || record.customFields?.['farm_name'];
  }
  if (fId === 'fld_farm_classification' || key === 'farm_classification') {
    return (
      record.customFields?.['farmClassification'] ||
      record.customFields?.['fld_farm_classification'] ||
      record.customFields?.['farm_classification'] ||
      (record.farmType === 'commercial' ? 'Commercial Breeder (50+ heads)' : 'Backyard (1-10 heads)')
    );
  }
  if (fId === 'fld_barangay' || key === 'barangay' || key === 'barangay_location') {
    return record.barangay;
  }
  if (fId === 'fld_sitio' || key === 'sitio' || key === 'sitio_purok_zone' || key === 'purok') {
    return record.customFields?.['fld_sitio'] || record.customFields?.['sitio'] || record.customFields?.['purok'];
  }
  if (fId === 'fld_capacity' || key === 'capacity' || key === 'total_pen_capacity_heads' || key === 'pen_capacity') {
    return record.penCapacity || record.customFields?.['fld_capacity'] || record.customFields?.['penCapacity'];
  }

  // 2. Farmer Info Fields
  if (fId === 'fld_farmer_name' || key === 'farmer_name' || key === 'farmer_full_name' || key === 'farmer') {
    return record.farmerName;
  }
  if (fId === 'fld_contact_phone' || key === 'contact_number' || key === 'contact' || key === 'farmer_contact' || key === 'phone') {
    return record.farmerContact;
  }
  if (fId === 'fld_rsbsa_id' || key === 'rsbsa_id' || key === 'rsbsa_reference_number' || key === 'rsbsa') {
    return record.rsbsaId;
  }
  if (fId === 'fld_email' || key === 'email' || key === 'email_address' || key === 'farmer_email') {
    return record.email || record.customFields?.['fld_email'] || record.customFields?.['email'];
  }
  if (fId === 'fld_residential_address' || key === 'residential_address' || key === 'farmer_residential_address') {
    return record.residentialAddress || record.farmerAddress;
  }

  // 3. Swine Info Fields
  if (fId === 'fld_ear_tag' || key === 'ear_tag' || key === 'ear_tag_microchip_id' || key === 'ear_tag_no' || key === 'eartagno') {
    return record.earTagNo;
  }
  if (fId === 'fld_breed' || key === 'breed' || key === 'swine_breed') {
    return record.breed;
  }
  if (fId === 'fld_swine_category' || key === 'swine_category' || key === 'swine_classification_stage' || key === 'category' || key === 'swine_type') {
    return record.swineType;
  }
  if (fId === 'fld_weight_kg' || key === 'weight_kg' || key === 'live_weight_kg' || key === 'weight') {
    return record.weightKg;
  }
  if (fId === 'fld_gender' || key === 'gender' || key === 'gender_castration_status' || key === 'sex') {
    return record.gender;
  }
  if (fId === 'fld_birth_date' || key === 'birth_date' || key === 'estimated_farrowing_birth_date') {
    return record.birthDate;
  }
  if (fId === 'fld_swine_photo' || key === 'swine_photo' || key === 'swine_live_photo' || key === 'photo') {
    return record.photoUrl;
  }

  // 4. Biosecurity Checklists
  if (fId === 'fld_fence_installed' || key === 'perimeter_barrier_pen_enclosure_installed' || key === 'perimeter_fence') {
    const val = record.biosecurity?.perimeterFence ?? record.customFields?.['fld_fence_installed'];
    return val !== undefined ? val : true;
  }
  if (fId === 'fld_footbath_active' || key === 'disinfectant_footbath_operational' || key === 'footbath_installed') {
    const val = record.biosecurity?.footbathInstalled ?? record.customFields?.['fld_footbath_active'];
    return val !== undefined ? val : true;
  }
  if (fId === 'fld_no_swill_ban' || key === 'strict_noswill_kaninbaboy_compliance' || key === 'no_swill_feeding') {
    const val = record.biosecurity?.noSwillFeeding ?? record.customFields?.['fld_no_swill_ban'];
    return val !== undefined ? val : true;
  }
  if (fId === 'fld_asf_clearance_status' || key === 'asf_biosurveillance_status' || key === 'asf_clearance_status') {
    return (
      record.customFields?.['asfClearanceStatus'] ||
      record.customFields?.['fld_asf_clearance_status'] ||
      'Cleared (Green Zone Active)'
    );
  }
  if (fId === 'fld_health_notes' || key === 'veterinary_observations_medication_record' || key === 'health_notes' || key === 'notes') {
    return record.notes || record.customFields?.['fld_health_notes'] || record.customFields?.['health_notes'];
  }

  // 5. Documents
  if (fId === 'fld_brgy_clearance_file' || key === 'barangay_certification_of_raiser') {
    return record.customFields?.['fld_brgy_clearance_file'] || record.customFields?.[key];
  }
  if (fId === 'fld_vet_cert_file' || key === 'veterinary_health_inspection_sheet') {
    return record.customFields?.['fld_vet_cert_file'] || record.customFields?.[key];
  }

  // 6. Additional Info
  if (fId === 'fld_gps_coordinates' || key === 'gps_coordinates_pen_location' || key === 'gps') {
    if (record.latitude && record.longitude) {
      return `${record.latitude.toFixed(4)}, ${record.longitude.toFixed(4)}`;
    }
    return record.customFields?.['fld_gps_coordinates'] || record.customFields?.[key];
  }
  if (fId === 'fld_ready_to_sell' || key === 'ready_for_takeoff_commercial_sale' || key === 'ready_to_sell') {
    return record.readyToSell;
  }
  if (fId === 'fld_estimated_price' || key === 'estimated_market_price_php' || key === 'estimated_price') {
    return record.estimatedPricePhp;
  }
  if (fId === 'fld_target_sell_date' || key === 'target_slaughter_pickup_date' || key === 'target_sell_date') {
    return record.targetSellDate;
  }

  // 7. General Custom Fields (check ID, fieldKey, normalized variants)
  if (record.customFields) {
    if (record.customFields[fId] !== undefined) return record.customFields[fId];
    if (record.customFields[key] !== undefined) return record.customFields[key];
    const camel = key.replace(/_([a-z])/g, (_, g) => g.toUpperCase());
    if (record.customFields[camel] !== undefined) return record.customFields[camel];
  }

  // 8. Direct property match on record object
  const anyRec = record as any;
  if (anyRec[fId] !== undefined) return anyRec[fId];
  if (anyRec[key] !== undefined) return anyRec[key];

  return undefined;
}

/**
 * Normalizes any Philippine phone number representation to canonical '+63 9XX XXX XXXX'
 * Handles:
 * - '9171234567' -> '+63 917 123 4567'
 * - '09171234567' -> '+63 917 123 4567'
 * - '+639171234567' or '+63 917 123 4567' -> '+63 917 123 4567'
 * - '639171234567' -> '+63 917 123 4567'
 * Avoids any duplicate prefix like '+63+63...'
 */
export function normalizePhilippinePhoneNumber(val: string | null | undefined): string {
  if (!val) return '';
  const str = String(val).trim();
  // Strip duplicate +63 occurrences or non-digit chars
  let cleaned = str.replace(/[^\d+]/g, '');
  while (cleaned.startsWith('+63+63') || cleaned.startsWith('+6363')) {
    cleaned = cleaned.replace(/^\+63(\+?63)/, '+63');
  }

  // Extract pure digits
  let digits = cleaned.replace(/\D/g, '');

  // If starts with 63 and length >= 12
  if (digits.startsWith('63') && digits.length >= 12) {
    digits = digits.slice(2);
  } else if (digits.startsWith('0') && digits.length === 11) {
    digits = digits.slice(1);
  }

  // If standard 10 digits
  if (digits.length === 10) {
    return `+63 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }

  if (digits.length > 0) {
    return `+63 ${digits}`;
  }

  return '';
}

/**
 * Validates if the phone number is a valid 10-digit Philippine mobile number
 */
export function isValidPhilippinePhoneNumber(val: string | null | undefined): boolean {
  if (!val) return false;
  const digits = String(val).replace(/\D/g, '');
  if (digits.length === 10 && digits.startsWith('9')) return true;
  if (digits.length === 11 && digits.startsWith('09')) return true;
  if (digits.length === 12 && digits.startsWith('639')) return true;
  return false;
}

/**
 * Formats a field's value for display in table cells, exports, and print summaries
 */
export function formatFieldValue(value: any, field: RegistryFormField): string {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  if (field.type === 'phone' || field.id === 'fld_contact_phone' || getFieldKey(field) === 'contact_number' || getFieldKey(field) === 'contact') {
    return normalizePhilippinePhoneNumber(value) || String(value);
  }

  if (field.type === 'yes_no' || typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (Array.isArray(value)) {
    return value.join(', ');
  }

  if (field.id === 'fld_estimated_price' || field.type === 'number' && field.label.toLowerCase().includes('price')) {
    const num = Number(value);
    if (!isNaN(num)) return `₱${num.toLocaleString()}`;
  }

  if (field.id === 'fld_weight_kg') {
    return `${value} kg`;
  }

  if (field.type === 'image') {
    return typeof value === 'string' && value.startsWith('data:') ? '[Photo Attached]' : value ? '[Photo Attached]' : '—';
  }

  if (field.type === 'file') {
    return typeof value === 'string' ? value : '[Document Attached]';
  }

  return String(value);
}

/**
 * Searches across all dynamic fields for a query
 */
export function matchRecordSearch(
  record: SwineRecord,
  query: string,
  activeFields: ActiveFieldItem[]
): boolean {
  if (!query || !query.trim()) return true;
  const q = query.toLowerCase().trim();

  // Check core top-level fields
  if (
    (record.earTagNo || '').toLowerCase().includes(q) ||
    (record.farmerName || '').toLowerCase().includes(q) ||
    (record.farmerContact || '').toLowerCase().includes(q) ||
    (record.barangay || '').toLowerCase().includes(q) ||
    (record.breed || '').toLowerCase().includes(q) ||
    (record.swineType || '').toLowerCase().includes(q) ||
    (record.rsbsaId || '').toLowerCase().includes(q) ||
    (record.farmName || '').toLowerCase().includes(q) ||
    (record.notes || '').toLowerCase().includes(q)
  ) {
    return true;
  }

  // Check every active dynamic field value
  for (const item of activeFields) {
    const val = getFieldValue(record, item.field);
    if (val !== undefined && val !== null) {
      const strVal = String(val).toLowerCase();
      if (strVal.includes(q)) return true;
    }
  }

  return false;
}

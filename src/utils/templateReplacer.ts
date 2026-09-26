export interface TemplateDataContext {
  resident_name?: string;
  farmer_name?: string;
  barangay?: string;
  municipality?: string;
  province?: string;
  number_of_pigs?: string | number;
  heads?: string | number;
  buyer_name?: string;
  buyer_address?: string;
  destination?: string;
  purpose?: string;
  date_issued?: string;
  issue_date?: string;
  or_number?: string;
  price_per_kilo?: string | number;
  amount_paid?: string | number;
  animal_type?: string;
  farmer_age_civil_status?: string;
  association_name?: string;
  swine_age?: string;
  female_count?: string | number;
  male_count?: string | number;
  color_description?: string;
  issued_at?: string;
  [key: string]: any;
}

export const AVAILABLE_PLACEHOLDERS = [
  { key: '{{resident_name}}', label: 'Resident / Farmer Name', sample: 'JUAN DELA CRUZ' },
  { key: '{{barangay}}', label: 'Barangay Name', sample: 'Nava' },
  { key: '{{municipality}}', label: 'Municipality', sample: 'Hinunangan' },
  { key: '{{province}}', label: 'Province', sample: 'Southern Leyte' },
  { key: '{{number_of_pigs}}', label: 'Number of Heads / Pigs', sample: '5' },
  { key: '{{buyer_name}}', label: 'Buyer Name', sample: 'JOVELYN PADOLLO' },
  { key: '{{destination}}', label: 'Destination / Buyer Address', sample: 'Pastrana, Leyte' },
  { key: '{{purpose}}', label: 'Purpose', sample: 'whatever legal purpose it may serve best' },
  { key: '{{date_issued}}', label: 'Date of Issuance', sample: 'September 22, 2026' },
  { key: '{{or_number}}', label: 'Official Receipt (O.R.) Number', sample: 'OR-1675127' },
  { key: '{{price_per_kilo}}', label: 'Price per Kilo / Amount', sample: '₱170.00 / kilo' },
  { key: '{{amount_paid}}', label: 'Amount Paid (PHP)', sample: '100.00' },
  { key: '{{animal_type}}', label: 'Animal Description', sample: 'market hogs' },
  { key: '{{association_name}}', label: 'Association / Cooperative', sample: 'NUEVA ESPERANZA SLP ASS.' },
  { key: '{{farmer_age_civil_status}}', label: 'Age / Civil Status (Bisaya)', sample: 'hingkod ang panu-igon' },
  { key: '{{swine_age}}', label: 'Swine Age (e.g. 3 ka Buwan)', sample: 'TULO ( 3 ) ka Buwan' },
  { key: '{{female_count}}', label: 'Female Head Count', sample: '3' },
  { key: '{{male_count}}', label: 'Male Head Count', sample: '2' },
  { key: '{{color_description}}', label: 'Color / Breed Description', sample: 'Assorted (White / Cross)' },
  { key: '{{issued_at}}', label: 'Place of Issuance', sample: 'Barangay Nava, Hinunangan, Southern Leyte' },
];

/**
 * Replaces all {{placeholder}} variables with actual values from data context.
 */
export function replaceTemplatePlaceholders(
  templateText: string | undefined | null,
  data?: TemplateDataContext | null
): string {
  if (typeof templateText !== 'string' || !templateText) return '';
  const safeData = data || {};

  let result = templateText;

  // Normalized map
  const normalized: Record<string, string> = {
    resident_name: safeData.resident_name || safeData.farmer_name || 'JUAN DELA CRUZ',
    farmer_name: safeData.farmer_name || safeData.resident_name || 'JUAN DELA CRUZ',
    barangay: safeData.barangay || 'Nava',
    municipality: safeData.municipality || 'Hinunangan',
    province: safeData.province || 'Southern Leyte',
    number_of_pigs: String(safeData.number_of_pigs ?? safeData.heads ?? '1'),
    heads: String(safeData.heads ?? safeData.number_of_pigs ?? '1'),
    buyer_name: safeData.buyer_name || 'LOCAL TRADER',
    buyer_address: safeData.buyer_address || safeData.destination || 'Hinunangan',
    destination: safeData.destination || safeData.buyer_address || 'Hinunangan, Southern Leyte',
    purpose: safeData.purpose || 'whatever legal purpose it may serve best',
    date_issued: safeData.date_issued || safeData.issue_date || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    issue_date: safeData.issue_date || safeData.date_issued || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    or_number: safeData.or_number || 'OR-1675127',
    price_per_kilo: String(safeData.price_per_kilo || '₱170.00 / kilo'),
    amount_paid: String(safeData.amount_paid || '100.00'),
    animal_type: safeData.animal_type || 'pigs / swine',
    farmer_age_civil_status: safeData.farmer_age_civil_status || 'hingkod ang panu-igon',
    association_name: safeData.association_name || safeData.resident_name || safeData.farmer_name || '',
    swine_age: safeData.swine_age || 'TULO ( 3 ) ka Buwan',
    female_count: String(safeData.female_count ?? '0'),
    male_count: String(safeData.male_count ?? '0'),
    color_description: safeData.color_description || 'Assorted (White / Landrace Cross)',
    issued_at: safeData.issued_at || `Barangay ${safeData.barangay || 'Nava'}, Hinunangan, Southern Leyte`,
  };

  // Replace case-insensitively with regex
  Object.keys(normalized).forEach(key => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
    result = result.replace(regex, normalized[key]);
  });

  // Handle any custom variables in data
  Object.keys(safeData).forEach(key => {
    if (!normalized[key] && safeData[key] !== undefined && safeData[key] !== null) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
      result = result.replace(regex, String(safeData[key]));
    }
  });

  return result;
}

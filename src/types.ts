export type UserRole = 'super_admin' | 'admin' | 'focal' | 'agent';

export interface UserAccount {
  id: string;
  username: string;
  name: string;
  fullName?: string;
  email: string;
  password?: string;
  role: UserRole;
  phone?: string;
  contactNo?: string;
  active?: boolean;
  assignedBarangay?: string; // required for focal person
  barangay_id?: string; // canonical reference id e.g. "brgy-bugho"
  avatarUrl?: string;
  createdAt: string;
}

export type RiskLevel = 'green' | 'yellow' | 'red'; // ASF zoning: Green (Free), Yellow (Buffer), Red (Infected/Quarantine)
export type ASFZone = 'RED' | 'PINK' | 'YELLOW' | 'GREEN';
export type FarmScale = 'BACKYARD' | 'COMMERCIAL_MEDIUM' | 'COMMERCIAL_LARGE';

export interface Barangay {
  id: string;
  name: string;
  code: string;
  focalPersonId?: string;
  focalPersonName?: string;
  focalPerson?: string;
  contactNo?: string;
  contactNumber?: string;
  swineCount?: number;
  totalSwineCount?: number;
  latitude: number;
  longitude: number;
  riskLevel: RiskLevel;
  boundaryPolygon?: [number, number][]; // [latitude, longitude][] polygon coordinates
  boundaryPerimeterKm?: number; // Measured boundary perimeter in kilometers
  boundaryAreaHectares?: number; // Measured enclosed area in hectares
  surveillanceRadiusMeters?: number; // Biosecurity buffer / surveillance radius in meters
}

export type SwineStatus =
  | 'healthy'
  | 'under_observation'
  | 'suspected_asf'
  | 'asf_positive'
  | 'recovered_cleared'
  | 'sick'
  | 'quarantined'
  | 'ready_to_sell'
  | 'sold'
  | 'deceased'
  | 'archived';
export type SwineType = 'grower' | 'finisher' | 'sow' | 'boar' | 'piglet';

export interface BiosecurityChecklist {
  perimeterFence: boolean;
  footbathInstalled: boolean;
  disinfectionRoutine: boolean;
  quarantinePenAvailable: boolean;
  potableWaterSource: boolean;
  standardFeedStorage: boolean;
  asfVaccinationOrTesting: boolean;
  noSwillFeeding: boolean;
  visitorLogbook: boolean;
  wasteLagoonOrCompost: boolean;
  [key: string]: boolean; // dynamic custom checkboxes
}

export interface SwineRecord {
  id: string;
  pigIdTag?: string; // Immutable Tag ID format: HIN-YYYY-XXXX
  earTagNo: string;
  farmerName: string;
  ownerName?: string; // Raiser/Farmer name alias
  farmerContact: string;
  farmerAddress: string;
  barangay: string;
  barangay_id?: string;
  rsbsaId?: string; // Registry System for Basic Sectors in Agriculture
  farmType: 'backyard' | 'commercial';
  farmScale?: FarmScale;
  asfZone?: ASFZone;
  swineType: SwineType;
  breed: string;
  ageWeeks: number;
  weightKg: number;
  actualWeightKg?: number | null;
  estimatedWeightKg?: string;
  gender: 'male' | 'female' | 'castrated';
  sex?: 'male' | 'female' | 'castrated'; // Gender alias
  photoUrl?: string;
  latitude: number;
  longitude: number;
  
  // 2. GIS Pen Coordinates & Setback Buffers (Municipal EO & Provincial Ordinance)
  distanceToWaterSourceMeters?: number; // Min required: >25m
  distanceToTourismSchoolMeters?: number; // Min required: >200m
  distanceToBuiltUpMeters?: number; // Min required: >50m
  setbackCompliant?: boolean;

  // Automated Swine Age & Weight calculation
  birthDate?: string;
  dateOfBirth?: string;
  date_of_birth?: string;
  dob?: string;
  registry_id?: string;
  age?: {
    years: number;
    months: number;
    days: number;
    totalDays: number;
    totalMonths: number;
    display: string;
    isValid: boolean;
  };
  ageDays?: number;
  ageMonths?: number;
  heartGirthCm?: number;
  bodyLengthCm?: number;
  calculationMethod?: 'auto_matrix' | 'tape_formula' | 'manual';
  biosecurityWarningAcknowledged?: boolean;

  status: SwineStatus;
  asfStatus?: 'normal' | 'suspected_asf' | 'asf_positive' | 'recovered_cleared';
  biosecurityScore?: number; // 0 - 100 percentage
  biosecurityStatus?: 'COMPLIANT' | 'NEEDS_UPGRADE' | 'NEEDS UPGRADE';
  asfDetectionDate?: string;
  readyToSell: boolean;
  targetSellDate?: string;
  estimatedPricePhp?: number;
  isArchived: boolean;
  biosecurity: BiosecurityChecklist;
  notes?: string;
  applicableOrdinanceNumber?: string;
  farmName?: string;
  penCapacity?: number;
  email?: string;
  residentialAddress?: string;
  sitio?: string;
  createdAt?: string;
  computedPigId?: string;
  healthStatus?: string;
  customFields?: Record<string, any>;
  registeredBy: string;
  registeredAt: string;
  updatedAt: string;
  isSynced?: boolean;
}

export type LegalDocumentType =
  | 'municipal_ordinance'
  | 'provincial_ordinance'
  | 'resolution'
  | 'administrative_order'
  | 'memorandum'
  | 'legal_reference'
  | 'municipal_eo'
  | 'proclamation'
  | 'republic_act'
  | 'department_order'
  | 'other';

export type LegalDocumentCategory = 'ordinance' | 'resolution' | 'national_reference' | 'executive_order' | 'memorandum' | 'administrative_order' | 'other';
export type LegalDocumentStatus = 'draft' | 'active' | 'superseded' | 'amended' | 'archived' | 'repealed';

export interface LegalSubsection {
  id: string;
  identifier: string; // e.g. "a.", "b.", "1.", "2.", "i.", "ii."
  title?: string;
  content: string;
  subsections?: LegalSubsection[];
}

export interface LegalArticleSection {
  id: string;
  sectionNumber: string;
  sectionTitle: string;
  content: string;
  subsections?: LegalSubsection[];
  mandateCategory?: 'mandatory' | 'prohibitive' | 'advisory' | 'penal';
  scannedPageRef?: number | string;
}

export interface LegalArticle {
  id: string;
  articleNumber: string;
  articleTitle: string;
  sections: LegalArticleSection[];
}

export interface LocationalDesignStandardItem {
  id: string;
  category: 'poultry' | 'piggery';
  classification: string;
  headsRange: string;
  eccRequired: boolean | string;
  zone: string;
  distanceGroundwater: number;
  distanceBuiltUp: number | string;
  distanceMajorRoads: number | string;
  distanceBetweenFarms: number | string;
  notes?: string;
}

export interface LegalProximityRegulation {
  touristDestinationMinDistance: number; // 100m
  touristDestinationTypes: string[];
  environmentalMeasures: string[];
  inspectionOffices: string[];
  exemptionAuthority: string;
}

export interface LegalTaskForceMember {
  role: string;
  title: string;
  office: string;
}

export interface LegalSourceAttachment {
  id: string;
  name: string;
  originalFileName?: string;
  pageNumber?: number;
  url: string;
  uploadedAt: string;
  fileSize?: string | number;
  fileType?: string;
  uploadedBy?: string;
  storagePath?: string;
  documentId?: string;
  version?: number;
  checksum?: string;
  extractedText?: string;
}

export interface LegalVersionHistory {
  version: number;
  versionLabel?: string; // e.g. "Version 1 Original", "Version 2 Amended", "Version 3 Current"
  updatedAt: string;
  updatedBy: string;
  changeSummary: string;
  documentSnapshot?: any;
}

export interface LegalAuditLog {
  id: string;
  action:
    | 'created'
    | 'viewed'
    | 'edited'
    | 'archived'
    | 'restored'
    | 'deleted'
    | 'printed'
    | 'attachment_uploaded'
    | 'imported'
    | 'classification_changed'
    | 'section_added'
    | 'landing_visibility_changed'
    | 'report_generated'
    | 'certificate_printed'
    | 'certificate_downloaded'
    | 'barangay_assignment_changed';
  timestamp: string;
  performedBy: string;
  details: string;
  documentId?: string;
  previousValue?: string;
  newValue?: string;
}

export interface LegalDocumentRelationship {
  id: string;
  targetDocNumber: string;
  targetDocTitle: string;
  relationshipType: 'revises' | 'implements' | 'related' | 'authorizes' | 'mandates';
}

export interface ASFRegulatoryDocument {
  id: string;
  type: LegalDocumentType | string;
  category?: LegalDocumentCategory;
  title: string;
  officialNumber: string;
  seriesYear: string;
  jurisdiction?: string;
  issuingAuthority: string;
  author?: string;
  signatory: string;
  signatoryTitle: string;
  sessionInfo?: string;
  dateEnacted?: string;
  effectiveDate: string;
  status?: LegalDocumentStatus;
  knownAs?: string;
  shortSummary: string;
  description?: string;
  fullText?: string;
  legalBasis: string[];
  tags?: string[];
  relatedDocumentIds?: string[];
  relatedDocuments?: LegalDocumentRelationship[];
  locationalStandards?: LocationalDesignStandardItem[];
  proximityRegulations?: LegalProximityRegulation;
  mltfMembers?: LegalTaskForceMember[];
  articles?: LegalArticle[];
  keyArticles: {
    number: string;
    heading: string;
    text: string;
    mandateCategory: 'mandatory' | 'prohibitive' | 'advisory';
  }[];
  setbackRules: {
    target: string;
    minimumDistance: number;
    statutoryBasis: string;
    rationale: string;
  }[];
  penalties: {
    offenseTier: string;
    finePhp: number;
    punitiveActions: string;
    imprisonment?: string;
  }[];
  sourceDocuments?: LegalSourceAttachment[];
  versionHistory?: LegalVersionHistory[];
  auditLogs?: LegalAuditLog[];
  isArchived?: boolean;
  mandatorySetbacks?: any;
  statutoryPenalties?: any;
}

export interface CertificateSignatory {
  id: string;
  name: string;
  title: string;
  office: string;
  order: number;
}

export type CertificateLogoPosition = 'left' | 'center' | 'right';
export type CertificateLogoType = 'barangay' | 'municipality' | 'province' | 'da' | 'bagong_pilipinas' | 'custom';

export interface CertificateLogoItem {
  id: string;
  type: CertificateLogoType;
  position: CertificateLogoPosition;
  customUrl?: string;
  barangayName?: string;
  widthPx: number;
  heightPx: number;
  alignment?: 'left' | 'center' | 'right';
  order: number;
  visible: boolean;
}

export interface CertificateWatermarkConfig {
  enabled: boolean;
  type: 'municipality' | 'barangay' | 'da' | 'province' | 'custom';
  customUrl?: string;
  barangayName?: string;
  opacity: number; // e.g. 0.15
  position: 'center';
  size: 'small' | 'medium' | 'large';
  grayscale?: boolean;
}

export interface CertificateDynamicSignatory {
  id: string;
  name: string;
  position: string;
  prefix?: string;
  signatureImageUrl?: string;
  showSignatureImage?: boolean;
  showSignatureLine?: boolean;
  lineWidth?: string;
  lineAlignment?: 'left' | 'center' | 'right';
  signatureWidth?: string;
  signaturePosition?: 'above_line' | 'overlap_line';
  order: number;
  alignment?: 'left' | 'center' | 'right';
  section?: 'left' | 'middle' | 'right' | 'noted_by' | 'certified_by' | 'main';
  details?: string;
}

export interface CertificateHeaderConfig {
  countryText: string;
  provinceText: string;
  municipalityText: string;
  barangayText: string;
  officeTitle?: string;
  contactEmail?: string;
  contactPhone?: string;
  mottoOrSubtitle?: string;
  borderStyle?: 'none' | 'single' | 'double' | 'green_line';
}

export interface CertificateReceiptConfig {
  showReceiptBox: boolean;
  orNumber?: string;
  amountPaid?: string | number;
  datePaid?: string;
  issuedAt?: string;
  formatStyle?: 'nava' | 'standard' | 'simple';
}

export interface CertificateTemplate {
  id: string;
  name: string;
  barangay: string;
  documentType: string;
  documentTitle: string;
  titleFont: 'gothic' | 'serif_underline' | 'serif_bold' | 'sans_bold';
  language: 'english' | 'bisaya' | 'filipino' | 'custom';
  pageSize: 'A4' | 'Letter' | 'Folio';
  orientation: 'portrait' | 'landscape';
  header: CertificateHeaderConfig;
  logos: CertificateLogoItem[];
  watermark: CertificateWatermarkConfig;
  bodyTemplate: string;
  noteText?: string;
  signatories: CertificateDynamicSignatory[];
  receipt: CertificateReceiptConfig;
  isActive: boolean;
  isDefaultPreset?: boolean;
  layoutStyle?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CertificateTypeDefinition {
  id: string;
  name: string;
  title: string;
  formatType: 'barangay_cert' | 'biosecurity' | 'health' | 'origin' | 'slaughter' | 'registration' | 'custom';
  letterBody: string;
  termsAndConditions?: string[];
  signatories?: CertificateSignatory[];
  leftLogoUrl?: string;
  centerLogoUrl?: string;
  rightLogoUrl?: string;
}

export interface CertificateConfig {
  centerLogoUrl: string;
  lguLogoUrl: string;
  daLogoUrl: string;
  watermarkLogoUrl?: string;
  municipalityName: string;
  provinceName: string;
  officeName: string;
  certificateTitle: string;
  authorizedPerson: string;
  authorizedPersonTitle: string;
  letterBodyTemplate: string;
  termsAndConditions: string[];
  signatories: CertificateSignatory[];
  customCertificateTypes?: CertificateTypeDefinition[];
}

export interface IssuedCertificate {
  id?: string;
  certificateNo: string;
  certificateType?: string;
  formatType?: 'barangay_cert' | 'biosecurity' | 'health' | 'origin' | 'slaughter' | 'registration' | 'custom';
  barangay?: string;
  swineId: string;
  earTagNo: string;
  farmerName: string;
  farmerBarangay?: string;
  barangay_id?: string; // canonical barangay foreign key e.g. "brgy-bugho"
  buyerName?: string;
  destinationBarangay?: string;
  destinationMunicipality?: string;
  numberOfHeads?: number;
  swineDescription?: string;
  orNumber?: string;
  amountPaid?: number;
  datePaid?: string;
  issueDate: string;
  validUntil: string;
  issuingBarangay?: string;
  punongBarangay?: string;
  bboName?: string;
  authorizedBy: string;
  status: 'active' | 'expired' | 'revoked' | 'completed';
  qrVerificationCode: string;
  templateId?: string;
  templateSnapshot?: CertificateTemplate;
  renderedBody?: string;
}

export interface TransmittalLetter {
  id: string;
  refNo: string;
  date: string;
  from: string;
  fromTitle: string;
  to: string;
  toTitle?: string;
  subject: string;
  barangay?: string;
  municipality?: string;
  province?: string;
  documentCount?: number;
  documentList?: string[];
  preparedBy: string;
  preparedByTitle: string;
  verifiedBy?: string;
  verifiedByTitle?: string;
  approvedBy: string;
  approvedByTitle: string;
  contentTemplate?: string;
  renderedContent?: string;
  status: 'draft' | 'submitted' | 'approved' | 'transmitted';
  createdAt: string;
  updatedAt: string;
}

export interface MessageItem {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  targetBarangay: string; // 'all' or specific barangay name
  recipientBarangay?: string; // alias for targetBarangay
  recipientId?: string; // optional single focal person id
  recipientName?: string;
  title?: string;
  subject?: string;
  content?: string;
  body?: string;
  priority: 'normal' | 'advisory' | 'urgent';
  createdAt?: string;
  timestamp?: string;
  readBy?: string[]; // user ids that read this message
  isRead?: boolean;
}

export interface SocialMediaPost {
  id: string;
  title: string;
  content: string;
  date: string;
  imageUrl?: string;
  link?: string;
  author: string;
}

export interface LandingPageConfig {
  logoUrl: string;
  headerTitle: string;
  headerSubtitle: string;
  heroTitle?: string;
  heroSubtitle?: string;
  bannerNotice?: string;
  announcementText?: string;
  contactPhone?: string;
  contactEmail?: string;
  welcomeMessage: string;
  heroBannerUrl: string;
  themeColor: string; // hex
  fontFamily: string;
  fontSize: 'small' | 'medium' | 'large';
  lguFacebookUrl: string;
  daContactEmail: string;
  emergencyHotline: string;
  announcementAlert: string;
  socialPosts: SocialMediaPost[];
  footerLogos?: any[];
  officialLogos?: any[];
  mediaItems?: any[];
}

export interface DynamicFormField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'checkbox';
  section: 'farmer' | 'swine' | 'biosecurity';
  required: boolean;
  options?: string[]; // for select
  defaultValue?: string | boolean;
  placeholder?: string;
  enabled?: boolean;
  isAutoGenerated?: boolean;
  isFixed?: boolean;
}

// Sidebar Appearance Customization
export interface SidebarTheme {
  id: string;
  name: string;
  backgroundColor: string;
  activeMenuColor: string;
  hoverColor: string;
  menuTextColor: string;
  activeTextColor: string;
  iconColor: string;
  sectionDividerColor: string;
  badgeColor: string;
  logoUrl?: string;
  logoShape?: 'circle' | 'rounded' | 'square';
  logoSize?: 'sm' | 'md' | 'lg';
}

// Registry Form Customization (Form Builder)
export type RegistryFieldType =
  | 'text'
  | 'number'
  | 'email'
  | 'phone'
  | 'date'
  | 'time'
  | 'dropdown'
  | 'radio'
  | 'checkbox'
  | 'multiselect'
  | 'textarea'
  | 'file'
  | 'image'
  | 'location'
  | 'gps'
  | 'barangay_select'
  | 'breed_select'
  | 'yes_no';

export type AutoGenType =
  | 'ear_tag' // HNG-[BRGY]-[YEAR]-[RAND4]
  | 'tracking_code' // TRK-[YEAR]-[RAND6]
  | 'timestamp' // YYYY-MM-DD HH:mm:ss
  | 'uuid' // SWN-XXXX-XXXX
  | 'custom_pattern'; // Custom pattern with [YEAR], [BRGY], [RAND4], etc.

export interface RegistryFormField {
  id: string;
  fieldKey?: string;
  label: string;
  labelEn?: string;
  labelCeb?: string;
  labelFil?: string;
  type: RegistryFieldType;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  visible: boolean;
  isCustom?: boolean;
  options?: string[]; // for dropdown, radio, checkbox, multiselect
  defaultValue?: string | number | boolean | string[];
  isFixed?: boolean; // Whether the input text is fixed (read-only/locked) or user-editable
  fixedValue?: string; // Constant text value when isFixed is true
  isAutoGenerated?: boolean; // Whether the field value is autogenerated by the system
  autoGenType?: AutoGenType; // Format/pattern type for autogeneration
  autoGenPattern?: string; // Custom template pattern (e.g. "HNG-[BRGY]-[YEAR]-[RAND4]" or "VET-[RAND6]")
  autoGenPrefix?: string; // Custom prefix e.g. "HNG-"
  sortable?: boolean;
  searchable?: boolean;
  filterable?: boolean;
  importable?: boolean;
  exportable?: boolean;
  printable?: boolean;
  isArchived?: boolean;
}

export interface RegistryFormSection {
  id: string;
  title: string;
  description?: string;
  isCustom?: boolean;
  visible?: boolean;
  isActive?: boolean;
  fields: RegistryFormField[];
}

export interface RegistryFormSchema {
  version: number;
  lastUpdated: string;
  updatedAt?: string;
  updatedBy: string;
  sections: RegistryFormSection[];
  isPublished: boolean;
}

// Barangay Biosecurity Audit & Compliance
export interface BarangayBiosecurityAudit {
  id: string;
  barangay: string;
  auditDate: string;
  auditorName: string;
  biosecurityLevel: 1 | 2 | 3; // Level 1 (Basic), Level 2 (Standard Bio-risk Mitigation), Level 3 (Full Commercial Isolation)
  complianceScore: number; // 0 - 100%
  footbathsOperational: boolean;
  vehicleDisinfectionStation: boolean;
  quarantineCheckpointActive: boolean;
  deadSwineDisposalFacility: boolean;
  swillFeedingBanEnforced: boolean;
  visitorLogCompliance: boolean;
  waterChlorination: boolean;
  perimeterFencingAudit: boolean;
  asfZone: RiskLevel;
  status: 'compliant' | 'warning' | 'critical';
  notes: string;
  updatedAt: string;
}

export interface BiosecurityIncident {
  id: string;
  barangay: string;
  reportDate: string;
  type: 'suspected_symptoms' | 'illegal_entry' | 'swill_violation' | 'disinfection_failure' | 'mortality';
  severity: 'low' | 'medium' | 'high';
  description: string;
  reportedBy: string;
  actionTaken: string;
  resolved: boolean;
  updatedAt: string;
}

// Swine Marketing Alert System
export type MarketingAlertType = 'price_update' | 'buyer_demand' | 'slaughterhouse_quota' | 'market_day' | 'dispatch_call';

export interface MarketingAlert {
  id: string;
  title: string;
  type: MarketingAlertType;
  targetAudience: 'all' | 'farmers' | 'agents' | 'focal';
  targetBarangay: string; // 'all' or specific barangay name
  pricePerKg?: number;
  headsNeeded?: number;
  preferredWeightMin?: number;
  preferredWeightMax?: number;
  buyerName?: string;
  buyerContact?: string;
  urgency: 'normal' | 'high' | 'critical';
  validUntil: string;
  description: string;
  postedBy: string;
  createdAt: string;
  isActive: boolean;
}

// Swine Ready to Take-Off (Dispatch / Market Logistics)
export type TakeoffStatus = 'scheduled' | 'inspected' | 'cleared' | 'in_transit' | 'completed' | 'cancelled';

export interface SwineTakeoffRecord {
  id: string;
  swineId: string;
  earTagNo: string;
  farmerName: string;
  farmerAddress: string;
  barangay: string;
  swineType: SwineType;
  weightKg: number;
  estimatedPricePhp?: number;
  buyerName: string;
  buyerContact?: string;
  vehiclePlateNo: string;
  driverName?: string;
  destination: string; // e.g. "Hinunangan Public Abattoir", "Maasin City Livestock Market"
  scheduledDate: string;
  scheduledTime: string;
  status: TakeoffStatus;
  vhcNumber?: string; // Veterinary Health Certificate Number
  shippingPermitNo?: string;
  vehicleDisinfected: boolean;
  asfZoneCleared: boolean;
  earTagVerified: boolean;
  gatePassNo: string;
  inspectedBy: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OfflineQueueItem {
  id: string;
  action: 'create' | 'update' | 'delete';
  entity: 'swine' | 'message' | 'certificate' | 'barangay' | 'biosecurity' | 'marketing_alert' | 'takeoff';
  data: unknown;
  timestamp: string;
}

// Smart Swine Registry Import & Column Mapping Types
export type ImportMatchStatus = 'matched_core' | 'matched_custom' | 'new_field' | 'ignored' | 'manual_mapped';

export interface ImportColumnMapping {
  fileHeader: string;
  normalizedHeader: string;
  targetFieldKey: string;
  targetFieldLabel: string;
  matchStatus: ImportMatchStatus;
  isNewField: boolean;
  detectedDataType: RegistryFieldType;
  detectedOptions?: string[];
  sampleValues: string[];
  labelEn: string;
  labelCeb: string;
  labelFil: string;
  isRequired: boolean;
  createField: boolean;
  searchable?: boolean;
  filterable?: boolean;
  sortable?: boolean;
  exportable?: boolean;
  printable?: boolean;
}

export interface ImportRowValidationError {
  row: number;
  pigId?: string;
  farmerName?: string;
  barangay?: string;
  field?: string;
  value?: any;
  message: string;
  severity: 'error' | 'warning';
}

export interface ImportRowValidationResult {
  rowNumber: number;
  rawData: Record<string, any>;
  mappedRecord: Partial<SwineRecord>;
  errors: ImportRowValidationError[];
  warnings: ImportRowValidationError[];
  isValid: boolean;
  isDuplicate: boolean;
  existingRecordId?: string;
}

export interface SwineImportHistoryRecord {
  id: string;
  batchId: string;
  fileName: string;
  fileType: 'csv' | 'xlsx' | 'xls' | 'tsv' | 'api' | 'manual';
  fileSize: number;
  importedBy: string;
  importedByRole?: string;
  importedAt: string;
  totalRows: number;
  successfulCount: number;
  failedCount: number;
  updatedCount: number;
  createdCount: number;
  skippedCount: number;
  newFieldsCreated: string[];
  status: 'completed' | 'partial' | 'failed' | 'rolled_back' | 'pending_sync';
  duplicateHandling: 'update' | 'skip' | 'rename';
  errorSummary?: { row: number; pigId?: string; error: string; field?: string }[];
  recordIds: string[];
  createdFieldKeys?: string[];
}

export interface SidebarConfigItem {
  id: string;
  label: string;
  visible: boolean;
  order: number;
  rolesAllowed?: UserRole[];
}

export interface AuditLogRecord {
  id: string;
  action: string;
  entity: string;
  entityId?: string;
  userId?: string;
  username?: string;
  userRole?: string;
  details?: string;
  ipAddress?: string;
  createdAt: string;
}


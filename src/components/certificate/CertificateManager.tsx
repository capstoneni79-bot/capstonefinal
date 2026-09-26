import React, { useState, useMemo, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import {
  Printer,
  FileText,
  FileSpreadsheet,
  Edit3,
  RefreshCw,
  Columns as ColumnsIcon,
  Globe,
  CheckCircle2,
  ChevronDown,
  Check,
  X,
  ShieldCheck,
  Layers,
  Search,
  Sliders,
  Calendar,
  MapPin,
  User,
  Plus,
  Trash2,
  Eye,
  Award,
  BookOpen,
  Send,
  Info,
  SlidersHorizontal,
  CheckSquare,
  Square,
  AlertTriangle,
  FileCheck,
  Sparkles,
  QrCode,
  Download,
  Filter,
  ShieldAlert,
  Lock,
} from 'lucide-react';
import {
  SwineRecord,
  UserAccount,
  CertificateConfig,
  CertificateSignatory,
  IssuedCertificate,
  CertificateTypeDefinition,
  CertificateTemplate,
} from '../../types';
import { storageService } from '../../services/storageService';
import { HINUNANGAN_BARANGAYS } from '../../data/barangays';
import {
  SealBagongPilipinas,
  SealDA,
  SealMunicipality,
  SealBarangay,
  SealProvince,
  useOfficialLogos,
} from '../common/OfficialSeals';
import {
  BarangayCertificateView,
  CertificateData,
  CertificateTemplateStyle,
} from './BarangayCertificateView';
import {
  CertificateLogoCustomizer,
  CertificateLogoSettings,
} from './CertificateLogoCustomizer';
import { CreateCertificateModal } from './CreateCertificateModal';
import { CertificateTemplateEditor } from './CertificateTemplateEditor';
import { TransmittalLetterManager } from './TransmittalLetterManager';
import { calculateSwineAge, formatDobDisplay } from '../../utils/swineRegistryLogic';

interface CertificateManagerProps {
  swineList: SwineRecord[];
  currentUser: UserAccount | null;
  selectedSwineInitial?: SwineRecord | null;
}

// Built-in Standard Individual Certificate Formats
const STANDARD_CERTIFICATE_TYPES: CertificateTypeDefinition[] = [
  {
    id: 'barangay-certification',
    name: 'Barangay Certification (Market Sale / Transfer)',
    title: 'BARANGAY CERTIFICATION',
    formatType: 'barangay_cert',
    letterBody: `TO WHOM IT MAY CONCERN:

This is to certify that {farmerName} is a bonafide resident of Barangay {barangay}, Hinunangan, Southern Leyte.

This certifies further that {farmerName} owned {numberOfHeads} heads of pigs sold to {buyerName} of {destination}.

This certification is being issued upon the request of the named person for whatever legal purpose it may serve best.

Issued this {issueDate} at Barangay {barangay}, Hinunangan, Southern Leyte, Philippines.`,
    termsAndConditions: [
      'This Barangay Certification serves as proof of origin, ownership, and clearance for livestock sale and transit.',
      'The livestock originates from a registered ASF-Free (Green Zone) holding with zero clinical fever symptoms.',
      'Official Receipt (O.R.) payment is recorded under Barangay Regulatory Fees Ordinance.',
      'Subject to presentation at the Municipal Agriculture Office and Animal Quarantine Checkpoints.',
    ],
    signatories: [
      { id: 'sig-1', name: 'HON. VICENTE T. MADRONERO JR.', title: 'Punong Barangay', office: 'Office of the Punong Barangay', order: 1 },
      { id: 'sig-2', name: 'RANDY N. BURLAZA, BBO', title: 'Barangay Biosecurity Officer', office: 'Committee on Agriculture', order: 2 },
      { id: 'sig-3', name: '{farmerName}', title: 'FARMER/OWNER', office: 'Conforme', order: 3 },
    ],
  },
  {
    id: 'biosecurity-transit',
    name: 'Livestock Biosecurity Clearance & Transit Permit',
    title: 'OFFICIAL BARANGAY LIVESTOCK BIOSECURITY CLEARANCE & TRANSFER PERMIT',
    formatType: 'biosecurity',
    letterBody: `THIS IS TO CERTIFY that the swine described herein has undergone comprehensive biosecurity inspection and is officially cleared for live animal transit, transfer, and commercial trade in accordance with Municipal Agriculture ordinances and African Swine Fever (ASF) biosecurity protocols.

The registered farm lot has been inspected and certified as ASF-Free (Green Zone Status), with zero history of clinical febrile outbreaks, zero swill feeding practices, and standard perimeter disinfection setbacks verified.`,
    termsAndConditions: [
      'This clearance is strictly valid for seventy-two (72) hours from official timestamp of issuance.',
      'Transport vehicle must be sanitized and disinfected before loading livestock at the municipal checkpoint.',
      'Any unauthorized route deviation or offloading in uncertified red/pink buffer zones revokes this permit immediately.',
      'Carrier must present this physical or digital QR certificate at all designated DA quarantine checkpoints.',
    ],
    signatories: [
      { id: 'sig-1', name: 'HON. CIRILO B. MONTEJO', title: 'Punong Barangay / Council Chair', office: 'Barangay Local Government Unit', order: 1 },
      { id: 'sig-2', name: 'ENGR. ARNALDO M. VALDEZ', title: 'Municipal Agricultural Officer', office: 'Office of the Municipal Agriculturist', order: 2 },
      { id: 'sig-3', name: 'DR. MARICEL P. TANYAG', title: 'Veterinary Biosecurity Inspector', office: 'Municipal Agriculture & Veterinary Services', order: 3 },
    ],
  },
  {
    id: 'vhc-clinical',
    name: 'Veterinary Health Certificate (VHC)',
    title: 'VETERINARY HEALTH CERTIFICATE (VHC) FOR SWINE TRANSIT & INSPECTION',
    formatType: 'health',
    letterBody: `THIS IS TO CERTIFY that I have personally conducted a comprehensive ante-mortem veterinary clinical examination on the live swine identified by the Ear Tag registered below.

Upon rigorous physical examination, the animal exhibited normal physiological parameters (rectal temperature within 38.5°C–39.5°C), normal mucosal membranes, clear ocular/nasal passages, absence of cutaneous hemorrhages or cyanosis, and exhibited zero clinical signs compatible with African Swine Fever (ASF), Hog Cholera, or other contagious viral diseases.`,
    termsAndConditions: [
      'Clinical certification is valid for 72 hours from the completion of ante-mortem physical examination.',
      'The livestock originates from a non-quarantined herd with verified vaccination and biosecurity audit records.',
      'Must be accompanied by the designated driver and carrier vehicle listed in the livestock manifest.',
    ],
    signatories: [
      { id: 'sig-1', name: 'DR. MARICEL P. TANYAG, DVM', title: 'Municipal Veterinary Officer', office: 'Provincial Veterinary Field Unit • Southern Leyte', order: 1 },
      { id: 'sig-2', name: 'ENGR. ARNALDO M. VALDEZ', title: 'Municipal Agricultural Officer (MAO)', office: 'Office of the Municipal Agriculturist - Hinunangan', order: 2 },
    ],
  },
  {
    id: 'slaughter-pass',
    name: 'Municipal Slaughter & Movement Permit',
    title: 'MUNICIPAL SLAUGHTER & LIVESTOCK DISPATCH PERMIT',
    formatType: 'slaughter',
    letterBody: `PERMISSION IS HEREBY GRANTED to transport, transfer, and deliver the live market swine detailed hereunder to the designated Municipal Slaughterhouse or accredited meat processing facility.

Ante-mortem clearance has been established, fees have been recorded, and the carcass is cleared for regulated processing in strict adherence to National Meat Inspection Service (NMIS) standards.`,
    termsAndConditions: [
      'Permit valid strictly for direct transit to the accredited slaughter facility specified herein.',
      'Slaughter without ante-mortem inspection tag constitutes a violation of Municipal Health Ordinance.',
      'Valid for 48 hours from dispatch schedule.',
    ],
    signatories: [
      { id: 'sig-1', name: 'ENGR. ARNALDO M. VALDEZ', title: 'Municipal Agricultural Officer', office: 'Office of the Municipal Agriculturist', order: 1 },
      { id: 'sig-2', name: 'ROBERTO L. TAN', title: 'Meat Inspection Officer / Abattoir Supervisor', office: 'Municipal Slaughterhouse Division', order: 2 },
    ],
  },
];

// Helper to parse Full Name into Family Name, Given Name, Middle Name
function parseFullName(fullName: string): { familyName: string; givenName: string; middleName: string } {
  if (!fullName || !fullName.trim()) {
    return { familyName: 'DELA CRUZ', givenName: 'JUAN', middleName: 'M.' };
  }
  const clean = fullName.trim();
  if (clean.includes(',')) {
    const [last, rest] = clean.split(',').map(s => s.trim());
    const restParts = (rest || '').split(' ').filter(Boolean);
    const middle = restParts.length > 1 ? restParts.pop() || '' : '';
    const given = restParts.join(' ') || (rest || '');
    return {
      familyName: last.toUpperCase(),
      givenName: (given || 'JUAN').toUpperCase(),
      middleName: (middle || '-').toUpperCase(),
    };
  }

  const parts = clean.split(' ').filter(Boolean);
  if (parts.length === 1) {
    return { familyName: parts[0].toUpperCase(), givenName: parts[0].toUpperCase(), middleName: '-' };
  }
  if (parts.length === 2) {
    return { familyName: parts[1].toUpperCase(), givenName: parts[0].toUpperCase(), middleName: '-' };
  }
  const family = parts.pop() || '';
  const middle = parts.length > 1 ? parts.pop() || '' : '';
  const given = parts.join(' ');
  return {
    familyName: family.toUpperCase(),
    givenName: given.toUpperCase(),
    middleName: (middle || '-').toUpperCase(),
  };
}

// Generate consistent synthetic RSBSA and birthdates for demonstration/display
function getFormattedRsbsaId(swine: SwineRecord, index: number): string {
  if (swine.rsbsaId && swine.rsbsaId.trim()) return swine.rsbsaId;
  const seq = String(index + 1).padStart(6, '0');
  return `08-64-16-002-${seq}`;
}

function getFarmerBirthday(swine: SwineRecord, index: number): string {
  const years = [1965, 1972, 1980, 1985, 1990, 1978, 1992, 1968, 1983, 1995];
  const months = ['01', '03', '05', '06', '08', '09', '11', '12'];
  const days = ['05', '12', '18', '21', '25', '28'];
  const yr = years[index % years.length];
  const mo = months[index % months.length];
  const dy = days[index % days.length];
  return `${mo}/${dy}/${yr}`;
}

export type DocumentType =
  | 'barangay_certification'
  | 'issued_archive'
  | 'official_reports'
  | 'masterlist'
  | 'transmittal'
  | 'directory'
  | 'biosecurity_report'
  | 'complete_package';

export type PaperSize = 'folio' | 'letter' | 'a4' | 'legal';
export type Orientation = 'landscape' | 'portrait';
export type MarginsSetting = 'normal' | 'compact' | 'wide';
export type DensitySetting = 'compact' | 'standard' | 'spacious';

interface ColumnConfig {
  key: string;
  label: string;
  visible: boolean;
}

export const CertificateManager: React.FC<CertificateManagerProps> = ({
  swineList,
  currentUser,
  selectedSwineInitial,
}) => {
  const isUserAdmin = currentUser?.role === 'admin';
  const userAssignedBarangay = currentUser?.assignedBarangay || '';
  const userBarangayId = currentUser?.barangay_id || '';

  // Main Report & Document Type Selection (Default to Barangay Certification)
  const [documentType, setDocumentType] = useState<DocumentType>('barangay_certification');

  // Filter Bar Controls
  const [selectedBarangayScope, setSelectedBarangayScope] = useState<string>(() => {
    if (!isUserAdmin && userAssignedBarangay) {
      return userAssignedBarangay;
    }
    return 'all';
  });

  // Security Access Denied Modal State
  const [accessDeniedMessage, setAccessDeniedMessage] = useState<string | null>(null);

  // Official Certificate Report Generator States
  const [reportBarangayFilter, setReportBarangayFilter] = useState<string>(() => {
    if (!isUserAdmin && userAssignedBarangay) {
      return userAssignedBarangay;
    }
    return 'all';
  });
  const [reportCertTypeFilter, setReportCertTypeFilter] = useState<string>('all');
  const [reportDateFrom, setReportDateFrom] = useState<string>('2026-01-01');
  const [reportDateTo, setReportDateTo] = useState<string>(new Date().toISOString().substring(0, 10));
  const [isExportingReportPdf, setIsExportingReportPdf] = useState(false);
  const officialReportPrintRef = useRef<HTMLDivElement>(null);
  const [croppingSeason, setCroppingSeason] = useState<string>('Wet Season (WS) 2026 (June – Dec)');
  const [paperSize, setPaperSize] = useState<PaperSize>('letter');
  const [orientation, setOrientation] = useState<Orientation>('portrait');
  const [margins, setMargins] = useState<MarginsSetting>('normal');
  const [density, setDensity] = useState<DensitySetting>('standard');

  // Masterlist Column Visibility Controls
  const [isColumnPickerOpen, setIsColumnPickerOpen] = useState(false);
  const [columns, setColumns] = useState<ColumnConfig[]>([
    { key: 'rsbsa', label: 'RSBSA / Reg No.', visible: true },
    { key: 'name', label: 'Farmer Name (Family, Given, Middle)', visible: true },
    { key: 'address', label: 'Residential Address', visible: true },
    { key: 'birthday', label: 'Farmer Birthday', visible: false },
    { key: 'swineDob', label: 'Date of Birth', visible: true },
    { key: 'swineAge', label: 'Age at Report Date', visible: true },
    { key: 'farmLocation', label: 'Farm Location / Sitio', visible: true },
    { key: 'coordinates', label: 'GPS Coordinates (Lat/Lng)', visible: true },
    { key: 'heads', label: 'Swine Heads', visible: true },
    { key: 'breed', label: 'Breed / Commodity', visible: true },
    { key: 'weight', label: 'Total Weight (kg)', visible: true },
    { key: 'farmType', label: 'Farm Scale', visible: true },
    { key: 'biosecurity', label: 'Biosecurity Status', visible: true },
    { key: 'earTag', label: 'Ear Tag ID', visible: false },
    { key: 'regDate', label: 'Date Registered', visible: false },
  ]);

  // Signatory & Official Customization Modal State
  const [isSignatoryModalOpen, setIsSignatoryModalOpen] = useState(false);
  const [preparedByName, setPreparedByName] = useState('RANDY N. BURLAZA, BBO');
  const [preparedByTitle, setPreparedByTitle] = useState('Barangay Biosecurity Officer');
  const [verifiedByName, setVerifiedByName] = useState('ENGR. ARNALDO M. VALDEZ');
  const [verifiedByTitle, setVerifiedByTitle] = useState('Municipal Agricultural Officer (MAO)');
  const [approvedByName, setApprovedByName] = useState('HON. REYNALDO C. FONTENILLA');
  const [approvedByTitle, setApprovedByTitle] = useState('Municipal Mayor, Hinunangan');

  // Transmittal Memorandum Custom Fields
  const [transmittalRefNo, setTransmittalRefNo] = useState('DA-MAO-HN-2026-TR-0982');
  const [transmittalRecipient, setTransmittalRecipient] = useState(
    'DR. ILUMINADO C. TANYAG, DVM\nProvincial Veterinary Officer\nProvincial Veterinary Office, Maasin City, Southern Leyte'
  );
  const [transmittalSubject, setTransmittalSubject] = useState(
    'TRANSMITTAL OF OFFICIAL RSBSA-REGISTERED SWINE RAISERS MASTERLIST & GIS BIOSECURITY AUDIT REPORT (CY 2026)'
  );

  // Logo & Seal Customizer Modal State
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const [logoSettings, setLogoSettings] = useState<CertificateLogoSettings>({
    leftLogoType: 'barangay',
    leftBarangayName: 'NAVA',
    centerLogoType: 'municipality',
    rightLogoType: 'bagong_pilipinas',
    showWatermark: true,
    watermarkType: 'municipality',
    watermarkOpacity: 0.12,
    barangayEmail: 'nava.hinunangan20@gmail.com',
    barangayPhone: '09763070221',
    headerMotto: '',
  });

  // Dynamic Certificate Templates State
  const [templates, setTemplates] = useState<CertificateTemplate[]>(() =>
    storageService.getCertificateTemplates()
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('tpl-nava-official');
  const [isTemplateEditorOpen, setIsTemplateEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CertificateTemplate | undefined>(undefined);

  // Template Search & Filters in Manager
  const [tplSearchQuery, setTplSearchQuery] = useState('');
  const [tplBarangayFilter, setTplBarangayFilter] = useState('all');
  const [tplDocTypeFilter, setTplDocTypeFilter] = useState('all');
  const [tplLanguageFilter, setTplLanguageFilter] = useState('all');

  const filteredTemplates = useMemo(() => {
    return templates.filter(tpl => {
      const q = tplSearchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        tpl.name.toLowerCase().includes(q) ||
        tpl.barangay.toLowerCase().includes(q) ||
        tpl.documentType.toLowerCase().includes(q) ||
        tpl.language.toLowerCase().includes(q);

      const matchesBarangay =
        tplBarangayFilter === 'all' ||
        tpl.barangay.toLowerCase() === tplBarangayFilter.toLowerCase() ||
        tpl.barangay === 'All';

      const matchesDocType =
        tplDocTypeFilter === 'all' ||
        tpl.documentType.toLowerCase() === tplDocTypeFilter.toLowerCase();

      const matchesLanguage =
        tplLanguageFilter === 'all' ||
        tpl.language.toLowerCase() === tplLanguageFilter.toLowerCase();

      return matchesSearch && matchesBarangay && matchesDocType && matchesLanguage;
    });
  }, [templates, tplSearchQuery, tplBarangayFilter, tplDocTypeFilter, tplLanguageFilter]);

  const activeTemplate = useMemo(() => {
    return templates.find(t => t.id === selectedTemplateId) || templates[0];
  }, [templates, selectedTemplateId]);

  // Create Certificate Modal State
  const [isCreateCertModalOpen, setIsCreateCertModalOpen] = useState(false);

  // Active Certificate View Data (Matching the 3 provided photos)
  const [activeCertData, setActiveCertData] = useState<CertificateData>({
    templateStyle: 'nava',
    barangay: 'Nava',
    farmerName: selectedSwineInitial?.farmerName || 'EDNA TOMBOC',
    associationName: 'NUEVA ESPERANZA SLP ASS.',
    farmerAgeCivilStatus: 'hingkod ang panu-igon',
    buyerName: 'JOVELYN PADOLLO / JJR HOG TRADING',
    destination: 'Barangay Colawen, Pastrana, Leyte',
    numberOfHeads: 7,
    swineAge: 'TULO ( 3 ) ka Buwan',
    femaleCount: '12 ka Bajie',
    maleCount: '13 ka Buok',
    colorDescription: 'Assorted (White / Landrace)',
    priceDescription: 'price ₱170.00 per kilo liveweight',
    orNumber: '1675127',
    amountPaid: '100.00',
    issueDate: new Date().toISOString().substring(0, 10),
    issuedAt: 'Barangay Nava, Hinunangan, Southern Leyte',
    punongBarangay: 'HON. VICENTE T. MADRONERO JR.',
    punongBarangayTitle: 'Punong Barangay',
    bboName: 'RANDY N. BURLAZA, BBO',
    bboTitle: 'Barangay Biosecurity Officer',
  });

  // Issued Certificates Archive
  const [issuedCertificates, setIssuedCertificates] = useState<IssuedCertificate[]>(() =>
    storageService.getIssuedCertificates(currentUser)
  );
  const [archiveSearchQuery, setArchiveSearchQuery] = useState('');
  const [certToDelete, setCertToDelete] = useState<IssuedCertificate | null>(null);

  // PDF Export Feedback State
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const printableReportRef = useRef<HTMLDivElement>(null);
  const biosecurityReportRef = useRef<HTMLDivElement>(null);

  // If selectedSwineInitial changes, sync farmer details
  useEffect(() => {
    if (selectedSwineInitial) {
      const calculatedAge = calculateSwineAge(
        selectedSwineInitial.birthDate ||
          selectedSwineInitial.dateOfBirth ||
          selectedSwineInitial.date_of_birth ||
          selectedSwineInitial.dob
      );
      setActiveCertData(prev => ({
        ...prev,
        farmerName: selectedSwineInitial.farmerName,
        barangay: selectedSwineInitial.barangay || prev.barangay,
        numberOfHeads: 1,
        swineAge: calculatedAge.hasDob ? calculatedAge.display : prev.swineAge,
      }));
      setLogoSettings(prev => ({
        ...prev,
        leftBarangayName: selectedSwineInitial.barangay || prev.leftBarangayName,
      }));
    }
  }, [selectedSwineInitial]);

  // Filtered swine dataset based on barangay scope
  const filteredSwineList = useMemo(() => {
    if (selectedBarangayScope === 'all') return swineList;
    return swineList.filter(
      s => (s.barangay || '').toLowerCase() === selectedBarangayScope.toLowerCase()
    );
  }, [swineList, selectedBarangayScope]);

  // Aggregate Stats
  const totalRaisersCount = useMemo(() => {
    const set = new Set(filteredSwineList.map(s => s.farmerName));
    return set.size;
  }, [filteredSwineList]);

  const totalSwineHeads = useMemo(() => {
    return filteredSwineList.length;
  }, [filteredSwineList]);

  const totalWeightKg = useMemo(() => {
    return filteredSwineList.reduce((sum, s) => sum + (Number(s.weightKg) || 85), 0);
  }, [filteredSwineList]);

  const greenZoneCount = useMemo(() => {
    return filteredSwineList.filter(
      s => s.healthStatus === 'healthy' || s.biosecurityStatus === 'COMPLIANT'
    ).length;
  }, [filteredSwineList]);

  // Filtered Archive
  const filteredArchive = useMemo(() => {
    if (!archiveSearchQuery.trim()) return issuedCertificates;
    const q = archiveSearchQuery.toLowerCase();
    return issuedCertificates.filter(
      c =>
        (c.certificateNo || '').toLowerCase().includes(q) ||
        (c.farmerName || '').toLowerCase().includes(q) ||
        (c.barangay || '').toLowerCase().includes(q) ||
        (c.buyerName || '').toLowerCase().includes(q) ||
        (c.orNumber || '').toLowerCase().includes(q)
    );
  }, [issuedCertificates, archiveSearchQuery]);

  // Column toggle helper
  const toggleColumn = (key: string) => {
    setColumns(prev =>
      prev.map(c => (c.key === key ? { ...c, visible: !c.visible } : c))
    );
  };

  const visibleColumnsCount = columns.filter(c => c.visible).length;

  const isColVisible = (key: string) => {
    const col = columns.find(c => c.key === key);
    return col ? col.visible : true;
  };

  // Reset Filters to pristine defaults
  const handleResetFilters = () => {
    setSelectedBarangayScope('all');
    setCroppingSeason('Wet Season (WS) 2026 (June – Dec)');
    setPaperSize('letter');
    setOrientation('portrait');
    setMargins('normal');
    setDensity('standard');
    setColumns(prev =>
      prev.map(c => ({ ...c, visible: c.key !== 'earTag' && c.key !== 'regDate' }))
    );
  };

  // Switch format template (supports dynamic template IDs and legacy styles)
  const handleSelectTemplate = (templateIdOrStyle: string) => {
    const matched = templates.find(
      t => t.id === templateIdOrStyle || t.id.toLowerCase().includes(templateIdOrStyle.toLowerCase()) || t.barangay.toLowerCase() === templateIdOrStyle.toLowerCase()
    );
    if (matched) {
      setSelectedTemplateId(matched.id);
      setActiveCertData(prev => ({
        ...prev,
        templateId: matched.id,
        templateStyle: matched.id.includes('esperanza') ? 'nueva_esperanza' : matched.id.includes('tuburan') ? 'tuburan' : matched.id.includes('da') ? 'da_veterinary' : 'nava',
        barangay: matched.barangay,
        punongBarangay: matched.signatories.find(s => s.position?.toLowerCase().includes('punong') || s.section === 'certified_by')?.name || prev.punongBarangay,
        bboName: matched.signatories.find(s => s.position?.toLowerCase().includes('bbo') || s.section === 'noted_by')?.name || prev.bboName,
      }));
    }
  };

  // Execute Native Print
  const handleTriggerPrint = () => {
    window.print();
  };

  // Color conversion helper to sanitize OKLCH colors for html2canvas compatibility
  const sanitizeOklchColors = (text: string): string => {
    if (!text || typeof text !== 'string' || !text.includes('oklch')) return text;
    try {
      const tempCanvas = document.createElement('canvas');
      const ctx = tempCanvas.getContext('2d');
      if (!ctx) return text.replace(/oklch\([^)]+\)/gi, '#1e293b');

      return text.replace(/oklch\([^)]+\)/gi, match => {
        try {
          ctx.fillStyle = '#1e293b';
          ctx.fillStyle = match;
          return ctx.fillStyle;
        } catch {
          return '#1e293b';
        }
      });
    } catch {
      return text.replace(/oklch\([^)]+\)/gi, '#1e293b');
    }
  };

  // Export PDF with html2canvas and jsPDF
  const handleExportPdf = async () => {
    if (!printableReportRef.current) return;
    setIsExportingPdf(true);
    setExportNotice('Generating high-resolution official PDF document...');

    try {
      const element = printableReportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: clonedDoc => {
          const styleTags = clonedDoc.querySelectorAll('style');
          styleTags.forEach(st => {
            if (st.innerHTML && st.innerHTML.includes('oklch')) {
              st.innerHTML = sanitizeOklchColors(st.innerHTML);
            }
          });

          const allNodes = clonedDoc.querySelectorAll('*');
          allNodes.forEach(node => {
            const el = node as HTMLElement;
            if (el && el.style && el.style.cssText && el.style.cssText.includes('oklch')) {
              el.style.cssText = sanitizeOklchColors(el.style.cssText);
            }
          });
        },
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const isLandscape = orientation === 'landscape';
      const pdf = new jsPDF({
        orientation: isLandscape ? 'l' : 'p',
        unit: 'mm',
        format:
          paperSize === 'folio'
            ? [215.9, 330.2]
            : paperSize === 'legal'
            ? [215.9, 355.6]
            : paperSize,
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 6;

      pdf.addImage(imgData, 'JPEG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      const filename = `DA-Hinunangan-Barangay-Certification-${activeCertData.barangay}-${Date.now()}.pdf`;
      pdf.save(filename);

      setExportNotice('Official Certificate PDF downloaded successfully!');
      setTimeout(() => setExportNotice(null), 3500);
    } catch (err) {
      console.error('PDF Generation failed:', err);
      setExportNotice('PDF export notice: Click the green Print button to Save as PDF with exact formatting.');
      setTimeout(() => setExportNotice(null), 4000);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Export CSV Data
  const handleExportCsv = () => {
    const headers = [
      'RSBSA Number',
      'Family Name',
      'Given Name',
      'Middle Name',
      'Barangay',
      'Municipality',
      'Province',
      'Farmer Birthday',
      'Swine Date of Birth',
      'Age at Report Date',
      'Farm Location',
      'Latitude',
      'Longitude',
      'Head Count',
      'Breed',
      'Weight (kg)',
      'Farm Scale',
      'Biosecurity Status',
      'Ear Tag ID',
    ];

    const rows = filteredSwineList.map((s, idx) => {
      const { familyName, givenName, middleName } = parseFullName(s.farmerName);
      const rsbsa = getFormattedRsbsaId(s, idx);
      const bday = getFarmerBirthday(s, idx);
      const dobVal = s.birthDate || s.dateOfBirth || s.date_of_birth || s.dob;
      const dobFormatted = formatDobDisplay(dobVal);
      const ageAtReport = calculateSwineAge(dobVal, reportDateTo || undefined).display;
      return [
        `"${rsbsa}"`,
        `"${familyName}"`,
        `"${givenName}"`,
        `"${middleName}"`,
        `"${s.barangay || 'Poblacion'}"`,
        `"Hinunangan"`,
        `"Southern Leyte"`,
        `"${bday}"`,
        `"${dobFormatted}"`,
        `"${ageAtReport}"`,
        `"${s.barangay} Central Farm"`,
        `"${s.latitude || 10.4045}"`,
        `"${s.longitude || 125.1982}"`,
        `1`,
        `"${s.breed || 'Large White'}"`,
        `"${s.weightKg || 85}"`,
        `"${s.farmType || 'backyard'}"`,
        `"${s.healthStatus || 'compliant'}"`,
        `"${s.earTagNo}"`,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `DA-Hinunangan-Swine-Registry-Masterlist-${selectedBarangayScope}-${Date.now()}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportNotice('CSV dataset exported successfully!');
    setTimeout(() => setExportNotice(null), 3000);
  };

  const handleCertificateIssuedFromModal = (cert: IssuedCertificate, printNow = false) => {
    setIssuedCertificates(storageService.getIssuedCertificates(currentUser));
    setActiveCertData({
      templateStyle: 'nava',
      barangay: cert.farmerBarangay || cert.issuingBarangay || 'Nava',
      farmerName: cert.farmerName,
      buyerName: cert.buyerName || 'Buyer',
      destination: cert.destinationBarangay || cert.destinationMunicipality || 'Pastrana, Leyte',
      numberOfHeads: cert.numberOfHeads || 1,
      orNumber: cert.orNumber || '1675127',
      amountPaid: cert.amountPaid || 100,
      issueDate: cert.issueDate,
      punongBarangay: cert.punongBarangay || cert.authorizedBy || 'HON. VICENTE T. MADRONERO JR.',
      bboName: cert.bboName || 'RANDY N. BURLAZA, BBO',
    });
    setDocumentType('barangay_certification');
    setExportNotice(`Certificate #${cert.certificateNo} successfully issued and saved!`);
    setTimeout(() => setExportNotice(null), 3500);

    if (printNow) {
      setTimeout(() => {
        window.print();
      }, 400);
    }
  };

  const handleDeleteCertificate = (certNo: string) => {
    if (confirm('Are you sure you want to delete this issued certificate record?')) {
      storageService.deleteIssuedCertificate(certNo);
      setIssuedCertificates(storageService.getIssuedCertificates(currentUser));
      setExportNotice('Certificate record deleted.');
      setTimeout(() => setExportNotice(null), 2500);
    }
  };

  // Official Certificate Report dataset
  const officialReportRecords = useMemo(() => {
    let list = storageService.getIssuedCertificates(currentUser);
    if (reportBarangayFilter && reportBarangayFilter !== 'all') {
      list = list.filter(
        c =>
          (c.farmerBarangay && c.farmerBarangay.toLowerCase() === reportBarangayFilter.toLowerCase()) ||
          (c.issuingBarangay && c.issuingBarangay.toLowerCase() === reportBarangayFilter.toLowerCase()) ||
          (c.barangay_id && c.barangay_id.toLowerCase() === reportBarangayFilter.toLowerCase())
      );
    }
    if (reportCertTypeFilter && reportCertTypeFilter !== 'all') {
      list = list.filter(
        c =>
          (c.certificateType || '').toLowerCase().includes(reportCertTypeFilter.toLowerCase()) ||
          (c.formatType || '').toLowerCase() === reportCertTypeFilter.toLowerCase()
      );
    }
    if (reportDateFrom) {
      list = list.filter(c => (c.issueDate || '') >= reportDateFrom);
    }
    if (reportDateTo) {
      list = list.filter(c => (c.issueDate || '') <= reportDateTo);
    }
    return list;
  }, [currentUser, reportBarangayFilter, reportCertTypeFilter, reportDateFrom, reportDateTo, issuedCertificates]);

  const reportTotalHeads = useMemo(() => {
    return officialReportRecords.reduce((sum, c) => sum + (Number(c.numberOfHeads) || 1), 0);
  }, [officialReportRecords]);

  const reportTotalAmount = useMemo(() => {
    return officialReportRecords.reduce((sum, c) => sum + (Number(c.amountPaid) || 0), 0);
  }, [officialReportRecords]);

  const handleExportOfficialReportCSV = () => {
    const headers = [
      '#',
      'Certificate No.',
      'Date Issued',
      'Certificate Type',
      'Hog Raiser / Farmer',
      'Barangay',
      'Swine Heads',
      'Buyer / Recipient',
      'Destination',
      'O.R. Number',
      'Amount Paid (PHP)',
      'Authorized Signatory',
      'Status',
    ];

    const rows = officialReportRecords.map((c, idx) => [
      idx + 1,
      `"${c.certificateNo}"`,
      `"${c.issueDate}"`,
      `"${c.certificateType || 'Barangay Certification'}"`,
      `"${c.farmerName}"`,
      `"${c.farmerBarangay || c.issuingBarangay || 'Hinunangan'}"`,
      c.numberOfHeads || 1,
      `"${c.buyerName || '—'}"`,
      `"${c.destinationBarangay || c.destinationMunicipality || 'Hinunangan'}"`,
      `"${c.orNumber || '—'}"`,
      c.amountPaid || 0,
      `"${c.punongBarangay || c.authorizedBy || 'Municipal Agriculturist'}"`,
      `"${c.status || 'Active'}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `MAO-Hinunangan-Official-Certificates-Report-${reportBarangayFilter}-${Date.now()}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportNotice('Official Certificate Report exported to CSV successfully!');
    setTimeout(() => setExportNotice(null), 3000);
  };

  const handleExportOfficialReportPdf = async () => {
    if (!officialReportPrintRef.current) return;
    setIsExportingReportPdf(true);
    setExportNotice('Rendering official report into high-resolution PDF...');

    try {
      const element = officialReportPrintRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: clonedDoc => {
          const styleTags = clonedDoc.querySelectorAll('style');
          styleTags.forEach(st => {
            if (st.innerHTML && st.innerHTML.includes('oklch')) {
              st.innerHTML = sanitizeOklchColors(st.innerHTML);
            }
          });
        },
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 6;

      pdf.addImage(imgData, 'JPEG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`MAO-Official-Certificate-Report-${reportBarangayFilter}-${Date.now()}.pdf`);

      setExportNotice('Official Certificate Report PDF generated and downloaded!');
      setTimeout(() => setExportNotice(null), 3500);
    } catch (err) {
      console.error('PDF export error:', err);
      setExportNotice('Failed to generate PDF. You can also use the native Print button.');
      setTimeout(() => setExportNotice(null), 4000);
    } finally {
      setIsExportingReportPdf(false);
    }
  };

  const handleViewCertificate = (cert: IssuedCertificate) => {
    const check = storageService.checkCertificateAccess(cert.certificateNo, currentUser);
    if (!check.authorized) {
      setAccessDeniedMessage(
        check.error ||
          `Access Denied: You are not authorized to view Certificate #${cert.certificateNo}. It belongs to Barangay ${cert.farmerBarangay || cert.issuingBarangay}. Under municipal security protocol, only authorized personnel for that barangay or Municipal Administrators may access this document.`
      );
      return;
    }

    if (cert.templateSnapshot) {
      setSelectedTemplateId(cert.templateSnapshot.id);
    } else if (cert.templateId) {
      setSelectedTemplateId(cert.templateId);
    }

    setActiveCertData({
      templateId: cert.templateSnapshot?.id || cert.templateId,
      templateStyle: cert.farmerBarangay?.toLowerCase().includes('esperanza')
        ? 'nueva_esperanza'
        : cert.farmerBarangay?.toLowerCase().includes('tuburan')
        ? 'tuburan'
        : 'nava',
      barangay: cert.farmerBarangay || cert.issuingBarangay || 'Nava',
      farmerName: cert.farmerName,
      buyerName: cert.buyerName || 'Buyer',
      destination: cert.destinationBarangay || cert.destinationMunicipality || 'Pastrana, Leyte',
      numberOfHeads: cert.numberOfHeads || 1,
      orNumber: cert.orNumber || '1675127',
      amountPaid: cert.amountPaid || 100,
      issueDate: cert.issueDate,
      punongBarangay: cert.punongBarangay || cert.authorizedBy || 'HON. VICENTE T. MADRONERO JR.',
      bboName: cert.bboName || 'RANDY N. BURLAZA, BBO',
    });
    setDocumentType('barangay_certification');
  };

  return (
    <div className="min-h-full bg-slate-100/80 text-stone-900 pb-16 relative selection:bg-emerald-200">
      {/* Toast Notification */}
      {exportNotice && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-emerald-500/40 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{exportNotice}</span>
        </div>
      )}

      {/* Main Top Header */}
      <div className="bg-white border-b border-stone-200 px-6 py-4 shadow-2xs">
        <div className="max-w-[1400px] mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-bold tracking-widest text-slate-500 uppercase">
              MUNICIPALITY OF HINUNANGAN • PROVINCE OF SOUTHERN LEYTE
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Official Barangay Certification & Swine Registry</span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                LGU Official
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Create Certificate Main Button */}
            <button
              type="button"
              onClick={() => setIsCreateCertModalOpen(true)}
              className="inline-flex items-center gap-2 text-xs font-black text-slate-950 bg-amber-400 hover:bg-amber-300 border border-amber-500/40 px-4 py-2 rounded-xl transition shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Create / Issue Certificate</span>
            </button>

            {/* Logo Customizer Button */}
            <button
              type="button"
              onClick={() => setIsLogoModalOpen(true)}
              className="inline-flex items-center gap-2 text-xs font-bold text-purple-700 hover:text-purple-800 bg-purple-50 hover:bg-purple-100/80 border border-purple-200 px-3.5 py-2 rounded-xl transition cursor-pointer"
            >
              <Sliders className="w-4 h-4" />
              <span>Change Logos & Seals</span>
            </button>

            <button
              type="button"
              onClick={() => {
                window.open('/', '_blank');
              }}
              className="inline-flex items-center gap-2 text-xs font-bold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100/80 border border-blue-200 px-3.5 py-2 rounded-xl transition cursor-pointer"
            >
              <Globe className="w-4 h-4" />
              <span>Public Portal</span>
            </button>
          </div>
        </div>
      </div>

      {/* Document Type Selector Bar */}
      <div className="bg-white border-b border-stone-200 px-6 py-2.5 shadow-2xs">
        <div className="max-w-[1400px] mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Document Types */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-black tracking-wider text-slate-600 uppercase mr-1">
              DOCUMENT:
            </span>

            {/* 1. Barangay Certification (Photo Match) */}
            <button
              type="button"
              onClick={() => setDocumentType('barangay_certification')}
              className={`inline-flex items-center gap-2 text-xs font-semibold px-3.5 py-1.5 rounded-lg transition cursor-pointer border ${
                documentType === 'barangay_certification'
                  ? 'bg-blue-600 border-blue-600 text-white font-bold shadow-xs'
                  : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Barangay Certification (Official Format)</span>
            </button>

            {/* 2. Issued Archive */}
            <button
              type="button"
              onClick={() => setDocumentType('issued_archive')}
              className={`inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer border ${
                documentType === 'issued_archive'
                  ? 'bg-blue-50 border-blue-500 text-blue-800 font-bold shadow-2xs'
                  : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Issued Archive ({issuedCertificates.length})</span>
            </button>

            {/* 3. Masterlist Registry */}
            <button
              type="button"
              onClick={() => setDocumentType('masterlist')}
              className={`inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer border ${
                documentType === 'masterlist'
                  ? 'bg-blue-50 border-blue-500 text-blue-800 font-bold shadow-2xs'
                  : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
              <span>Masterlist Registry</span>
            </button>

            {/* 4. Transmittal Letter */}
            <button
              type="button"
              onClick={() => setDocumentType('transmittal')}
              className={`inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer border ${
                documentType === 'transmittal'
                  ? 'bg-blue-50 border-blue-500 text-blue-800 font-bold shadow-2xs'
                  : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
              }`}
            >
              <Send className="w-3.5 h-3.5 text-blue-600" />
              <span>Transmittal Letter</span>
            </button>

            {/* 5. Raisers Directory */}
            <button
              type="button"
              onClick={() => setDocumentType('directory')}
              className={`inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer border ${
                documentType === 'directory'
                  ? 'bg-blue-50 border-blue-500 text-blue-800 font-bold shadow-2xs'
                  : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
              <span>Raisers Directory</span>
            </button>

            {/* 6. Biosecurity & ASF Report */}
            <button
              type="button"
              onClick={() => setDocumentType('biosecurity_report')}
              className={`inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer border ${
                documentType === 'biosecurity_report'
                  ? 'bg-blue-50 border-blue-500 text-blue-800 font-bold shadow-2xs'
                  : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
              <span>Biosecurity Report</span>
            </button>

            {/* 7. Official Reports */}
            <button
              type="button"
              onClick={() => setDocumentType('official_reports')}
              className={`inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer border ${
                documentType === 'official_reports'
                  ? 'bg-emerald-700 border-emerald-700 text-white font-bold shadow-xs'
                  : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Official Reports ({officialReportRecords.length})</span>
            </button>
          </div>

          {/* Right Tools: Columns Picker & Reset */}
          <div className="flex items-center gap-2 relative">
            {documentType === 'masterlist' && (
              <>
                <button
                  type="button"
                  onClick={() => setIsColumnPickerOpen(prev => !prev)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50/80 hover:bg-blue-100/90 border border-blue-200 px-3 py-1.5 rounded-lg transition cursor-pointer"
                >
                  <ColumnsIcon className="w-3.5 h-3.5" />
                  <span>Columns ({visibleColumnsCount}/{columns.length})</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                </button>

                {isColumnPickerOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-stone-200 rounded-2xl p-3 shadow-xl z-50 space-y-2 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                      <span className="text-xs font-bold text-stone-900">Configure Table Columns</span>
                      <button
                        type="button"
                        onClick={() => setIsColumnPickerOpen(false)}
                        className="p-1 rounded-lg text-stone-400 hover:text-stone-700 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 text-xs">
                      {columns.map(col => (
                        <label
                          key={col.key}
                          className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer text-stone-700 select-none"
                        >
                          <input
                            type="checkbox"
                            checked={col.visible}
                            onChange={() => toggleColumn(col.key)}
                            className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                          />
                          <span className="text-xs font-medium">{col.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            <button
              type="button"
              onClick={handleResetFilters}
              title="Reset all filters and settings"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-stone-200 transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Contextual Toolbar for Barangay Certification */}
      {documentType === 'barangay_certification' && (
        <div className="bg-slate-50 border-b border-stone-200 px-6 py-3 shadow-2xs no-print space-y-2.5">
          <div className="max-w-[1400px] mx-auto flex flex-wrap items-center justify-between gap-3">
            {/* Search and Filters Bar */}
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[300px]">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={tplSearchQuery}
                  onChange={e => setTplSearchQuery(e.target.value)}
                  placeholder="Search templates (Nava, Bisaya, Tuburan, Gatepass...)"
                  className="w-full pl-8 pr-7 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-semibold text-slate-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {tplSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setTplSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Barangay Filter */}
              <select
                value={tplBarangayFilter}
                onChange={e => setTplBarangayFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="all">All Barangays</option>
                {HINUNANGAN_BARANGAYS.map(b => (
                  <option key={b.code} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>

              {/* Language Filter */}
              <select
                value={tplLanguageFilter}
                onChange={e => setTplLanguageFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="all">All Languages</option>
                <option value="english">English</option>
                <option value="bisaya">Bisaya Dialect</option>
                <option value="filipino">Filipino</option>
              </select>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setEditingTemplate(activeTemplate);
                  setIsTemplateEditorOpen(true);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3 py-1.5 rounded-lg transition cursor-pointer shadow-2xs"
                title="Edit logos, seal positions, text layout, and signatories for this template"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Customize Template & Logos</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditingTemplate(undefined);
                  setIsTemplateEditorOpen(true);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg transition cursor-pointer shadow-2xs"
                title="Create a new custom Barangay Certificate format"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>+ New Template</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCreateCertModalOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-black text-slate-900 bg-amber-400 hover:bg-amber-300 px-3.5 py-1.5 rounded-lg transition cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Issue Certificate</span>
              </button>
            </div>
          </div>

          {/* Dynamic Certificate Selector Control */}
          <div className="max-w-[1400px] mx-auto flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-200/80">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[320px]">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5 shrink-0">
                <Layers className="w-4 h-4 text-blue-600" />
                CERTIFICATES ({templates.length}):
              </span>

              {/* Dynamic Combo Box / Dropdown Select */}
              <div className="relative flex-1 max-w-lg">
                <select
                  value={selectedTemplateId}
                  onChange={e => handleSelectTemplate(e.target.value)}
                  className="w-full pl-3 pr-8 py-1.5 bg-white border-2 border-blue-500/60 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-2xs cursor-pointer"
                >
                  {filteredTemplates.map(tpl => (
                    <option key={tpl.id} value={tpl.id}>
                      {tpl.name} {tpl.barangay && tpl.barangay !== 'All' ? `(Brgy. ${tpl.barangay})` : ''} {tpl.isDefaultPreset ? '★' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Active Badge */}
              {activeTemplate && (
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-lg text-[11px] font-semibold text-blue-800">
                  <span className="font-bold">Format:</span>
                  <span className="capitalize">{(activeTemplate.layoutStyle || 'standard').replace(/_/g, ' ')}</span>
                  {activeTemplate.language && (
                    <span className="text-[10px] text-blue-600 bg-blue-100/80 px-1.5 py-0.5 rounded font-bold uppercase">
                      {activeTemplate.language}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Document Body Canvas */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-6">
        {/* ========================================================================= */}
        {/* 1. BARANGAY CERTIFICATION VIEW (Dynamic & Authentic Match to Photos) */}
        {/* ========================================================================= */}
        {documentType === 'barangay_certification' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2 no-print">
              <div>
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wide">
                  Live Certificate Rendering & Print View: {activeTemplate?.name || 'Barangay Certificate'}
                </h2>
                <p className="text-xs text-slate-500">
                  {activeTemplate?.description || 'Authentic layout with dynamic seals, signatories, and ordinance references'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingTemplate(activeTemplate);
                    setIsTemplateEditorOpen(true);
                  }}
                  className="px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold text-xs shadow-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Layout / Logos</span>
                </button>

                <button
                  type="button"
                  onClick={handleTriggerPrint}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Document</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportPdf}
                  disabled={isExportingPdf}
                  className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                >
                  <FileText className="w-4 h-4" />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>

            {/* Render Authentic Certificate Container */}
            <div className="py-2">
              <BarangayCertificateView
                data={activeCertData}
                template={activeTemplate}
                logoSettings={logoSettings}
                containerRef={printableReportRef}
              />
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. ISSUED CERTIFICATES ARCHIVE */}
        {/* ========================================================================= */}
        {documentType === 'issued_archive' && (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-5">
            {!isUserAdmin && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between text-xs text-amber-900">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>
                    <strong>Authorized Scope:</strong> Showing issued certificates for <strong>Barangay {userAssignedBarangay || 'Assigned Barangay'}</strong>. Cross-barangay access is restricted under municipal security policy.
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-950 font-black text-[10px] uppercase tracking-wider">
                  Focal Officer Mode
                </span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-100 pb-4">
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  Issued Barangay Certificates Archive
                </h2>
                <p className="text-xs text-stone-500">
                  Official registry of all generated clearances, receipts, and transit permits
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={archiveSearchQuery}
                    onChange={e => setArchiveSearchQuery(e.target.value)}
                    placeholder="Search by name, OR#, cert#..."
                    className="pl-9 pr-3 py-1.5 bg-slate-50 border border-stone-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setIsCreateCertModalOpen(true)}
                  className="px-4 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Certificate</span>
                </button>
              </div>
            </div>

            {filteredArchive.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <FileText className="w-12 h-12 text-stone-300 mx-auto" />
                <p className="text-sm font-bold text-stone-600">No certificates found</p>
                <p className="text-xs text-stone-400 max-w-sm mx-auto">
                  Click &ldquo;Create / Issue Certificate&rdquo; to generate official certifications for registered hog raisers.
                </p>
                <button
                  type="button"
                  onClick={() => setIsCreateCertModalOpen(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs inline-flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Issue First Certificate</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-stone-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-2.5 px-3">Cert # / Date</th>
                      <th className="py-2.5 px-3">Farmer / Raiser</th>
                      <th className="py-2.5 px-3">Barangay</th>
                      <th className="py-2.5 px-3">Heads</th>
                      <th className="py-2.5 px-3">Buyer & Destination</th>
                      <th className="py-2.5 px-3">O.R. Number</th>
                      <th className="py-2.5 px-3">Issued By</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredArchive.map(cert => (
                      <tr key={cert.certificateNo} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-3">
                          <span className="font-mono font-bold text-blue-700 block">
                            {cert.certificateNo}
                          </span>
                          <span className="text-[10px] text-stone-400">{cert.issueDate}</span>
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900 uppercase">
                          {cert.farmerName}
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-700">
                          Brgy. {cert.farmerBarangay || cert.issuingBarangay || 'Nava'}
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-black px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded">
                            {cert.numberOfHeads || 1} Heads
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-semibold text-slate-800 block">
                            {cert.buyerName || 'Local Meat Trader'}
                          </span>
                          <span className="text-[10px] text-stone-400">
                            {cert.destinationBarangay || cert.destinationMunicipality || 'Hinunangan'}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono font-semibold text-slate-800">
                          {cert.orNumber || '—'}
                        </td>
                        <td className="py-3 px-3 text-slate-700 font-semibold">
                          {cert.punongBarangay || cert.authorizedBy}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleViewCertificate(cert)}
                              title="View & Print Certificate"
                              className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold transition cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setCertToDelete(cert)}
                              title="Delete Record"
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 font-bold transition cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* OFFICIAL CERTIFICATE ISSUANCE REPORT GENERATOR */}
        {/* ========================================================================= */}
        {documentType === 'official_reports' && (
          <div className="space-y-6">
            {/* Filter and Control Bar */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 no-print space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-100 pb-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-600" />
                    <span>Official Certificate Issuance Report</span>
                  </h2>
                  <p className="text-xs text-stone-500">
                    Filter, audit, compile, and print verified certificate issuance records across Hinunangan.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-2 text-xs font-bold text-slate-800 bg-stone-100 hover:bg-stone-200 border border-stone-300 px-3.5 py-2 rounded-xl transition cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-stone-600" />
                    <span>Print Report</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportOfficialReportCSV}
                    className="inline-flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3.5 py-2 rounded-xl transition cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-emerald-600" />
                    <span>Export CSV</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportOfficialReportPdf}
                    disabled={isExportingReportPdf}
                    className="inline-flex items-center gap-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 px-4 py-2 rounded-xl transition cursor-pointer disabled:opacity-50"
                  >
                    <FileCheck className="w-4 h-4" />
                    <span>{isExportingReportPdf ? 'Generating PDF...' : 'Download Official PDF'}</span>
                  </button>
                </div>
              </div>

              {/* Filter Controls Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {/* Barangay Filter */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Barangay Jurisdiction
                  </label>
                  {isUserAdmin ? (
                    <select
                      value={reportBarangayFilter}
                      onChange={e => setReportBarangayFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-stone-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="all">All 40 Barangays (Municipal Scope)</option>
                      {HINUNANGAN_BARANGAYS.map(b => (
                        <option key={b.code} value={b.name}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 border border-stone-300 rounded-xl text-xs font-semibold text-slate-700 select-none">
                      <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Barangay {userAssignedBarangay || 'Assigned'} (Locked)</span>
                    </div>
                  )}
                </div>

                {/* Certificate Type Filter */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Certificate Type
                  </label>
                  <select
                    value={reportCertTypeFilter}
                    onChange={e => setReportCertTypeFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-stone-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="all">All Certificate Types</option>
                    <option value="Barangay Certification">Barangay Certification</option>
                    <option value="Veterinary Health">Veterinary Health Certificate</option>
                    <option value="Biosecurity">Biosecurity Clearance</option>
                    <option value="Transit">Transit Permit / Shipping Clearance</option>
                  </select>
                </div>

                {/* Date From */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Date From
                  </label>
                  <input
                    type="date"
                    value={reportDateFrom}
                    onChange={e => setReportDateFrom(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-stone-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Date To */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Date To
                  </label>
                  <input
                    type="date"
                    value={reportDateTo}
                    onChange={e => setReportDateTo(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-stone-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Printable Document Wrapper */}
            <div
              ref={officialReportPrintRef}
              className="bg-white rounded-2xl border border-stone-300 p-8 sm:p-12 shadow-sm space-y-8 font-serif"
            >
              {/* Official Municipal Header */}
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-5">
                <div className="w-20 h-20 shrink-0 flex items-center justify-center">
                  <SealMunicipality className="w-18 h-18" />
                </div>

                <div className="text-center font-sans">
                  <div className="text-xs font-bold tracking-widest text-slate-600 uppercase">
                    Republic of the Philippines • Province of Southern Leyte
                  </div>
                  <div className="text-lg font-black text-slate-900 uppercase tracking-tight">
                    Municipality of Hinunangan
                  </div>
                  <div className="text-sm font-bold text-emerald-800 uppercase tracking-wider mt-0.5">
                    Office of the Municipal Agriculturist
                  </div>
                  <div className="text-[10px] text-slate-500 italic mt-0.5">
                    Livestock & Swine Biosecurity Regulatory Services Division
                  </div>
                </div>

                <div className="w-20 h-20 shrink-0 flex items-center justify-center">
                  <SealDA className="w-18 h-18" />
                </div>
              </div>

              {/* Report Title & Metadata */}
              <div className="text-center space-y-1 font-sans">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                  Official Certificate Issuance & Clearance Summary
                </h3>
                <p className="text-xs text-slate-600">
                  Statutory audit and master record of authorized swine movement and biosecurity clearances
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-500 pt-2">
                  <span><strong>Scope:</strong> {reportBarangayFilter === 'all' ? 'All Municipal Barangays (40 Barangays)' : `Barangay ${reportBarangayFilter}`}</span>
                  <span>•</span>
                  <span><strong>Period:</strong> {reportDateFrom} to {reportDateTo}</span>
                  <span>•</span>
                  <span><strong>Generated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              </div>

              {/* KPI Summary Strip */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-sans no-print">
                <div className="bg-slate-50 border border-stone-200 rounded-xl p-4 text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Certificates Issued
                  </span>
                  <span className="text-2xl font-black text-slate-900">
                    {officialReportRecords.length}
                  </span>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                    Swine Heads Cleared
                  </span>
                  <span className="text-2xl font-black text-emerald-900">
                    {reportTotalHeads}
                  </span>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                  <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">
                    Fees Collected
                  </span>
                  <span className="text-2xl font-black text-blue-900">
                    ₱{reportTotalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-center">
                  <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block">
                    Jurisdiction Mode
                  </span>
                  <span className="text-xs font-bold text-purple-950 block mt-2">
                    {isUserAdmin ? 'Municipal Master Scope' : `Brgy. ${userAssignedBarangay} Focal`}
                  </span>
                </div>
              </div>

              {/* Report Records Table */}
              <div className="overflow-x-auto font-sans">
                <table className="w-full text-xs text-left border-collapse border border-stone-300">
                  <thead>
                    <tr className="bg-slate-100 border-b border-stone-300 text-slate-800 font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-2.5 px-3 border-r border-stone-300 text-center w-10">#</th>
                      <th className="py-2.5 px-3 border-r border-stone-300">Cert # / Date</th>
                      <th className="py-2.5 px-3 border-r border-stone-300">Hog Raiser / Farmer</th>
                      <th className="py-2.5 px-3 border-r border-stone-300">Barangay</th>
                      <th className="py-2.5 px-3 border-r border-stone-300 text-center">Heads</th>
                      <th className="py-2.5 px-3 border-r border-stone-300">Buyer & Destination</th>
                      <th className="py-2.5 px-3 border-r border-stone-300">O.R. No. / Fee</th>
                      <th className="py-2.5 px-3">Authorized Signatory</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 text-stone-800">
                    {officialReportRecords.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                          No official certificates found matching the selected filters.
                        </td>
                      </tr>
                    ) : (
                      officialReportRecords.map((cert, idx) => (
                        <tr key={cert.certificateNo || idx} className="hover:bg-slate-50/80">
                          <td className="py-2 px-3 border-r border-stone-200 text-center text-stone-500 font-mono">
                            {idx + 1}
                          </td>
                          <td className="py-2 px-3 border-r border-stone-200">
                            <span className="font-mono font-bold text-blue-700 block">
                              {cert.certificateNo}
                            </span>
                            <span className="text-[10px] text-stone-400">{cert.issueDate}</span>
                          </td>
                          <td className="py-2 px-3 border-r border-stone-200 font-bold uppercase">
                            {cert.farmerName}
                          </td>
                          <td className="py-2 px-3 border-r border-stone-200">
                            Brgy. {cert.farmerBarangay || cert.issuingBarangay || 'Nava'}
                          </td>
                          <td className="py-2 px-3 border-r border-stone-200 text-center font-bold">
                            {cert.numberOfHeads || 1}
                          </td>
                          <td className="py-2 px-3 border-r border-stone-200">
                            <span className="block font-medium">{cert.buyerName || 'Local Meat Trader'}</span>
                            <span className="text-[10px] text-stone-400 block">
                              {cert.destinationBarangay || cert.destinationMunicipality || 'Hinunangan'}
                            </span>
                          </td>
                          <td className="py-2 px-3 border-r border-stone-200 font-mono">
                            <span className="block font-semibold">O.R. #{cert.orNumber || '1675127'}</span>
                            <span className="text-[10px] text-emerald-700 font-bold block">
                              ₱{Number(cert.amountPaid || 100).toFixed(2)}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            <span className="font-semibold block">{cert.punongBarangay || cert.authorizedBy || 'HON. VICENTE T. MADRONERO JR.'}</span>
                            <span className="text-[10px] text-stone-500 block">Punong Barangay / BBO</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Official Attestation & Signatories Block */}
              <div className="pt-8 border-t border-stone-300 font-sans space-y-8">
                <div className="text-xs text-stone-600 leading-relaxed text-justify">
                  <strong>OFFICIAL CERTIFICATION:</strong> I hereby certify that the above list of issued certificates and swine health clearances is true, accurate, and extracted directly from the verified database of the Municipal Agriculture Office and Barangay Biosecurity Registry of Hinunangan, Southern Leyte.
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
                  <div className="text-center space-y-1">
                    <div className="text-[10px] uppercase tracking-wider text-stone-500">Prepared By:</div>
                    <div className="h-12 flex items-end justify-center">
                      <div className="font-bold text-xs text-slate-900 uppercase border-b border-stone-800 pb-1 w-4/5">
                        {preparedByName}
                      </div>
                    </div>
                    <div className="text-[10px] text-stone-600 font-medium">{preparedByTitle}</div>
                  </div>

                  <div className="text-center space-y-1">
                    <div className="text-[10px] uppercase tracking-wider text-stone-500">Verified By:</div>
                    <div className="h-12 flex items-end justify-center">
                      <div className="font-bold text-xs text-slate-900 uppercase border-b border-stone-800 pb-1 w-4/5">
                        {verifiedByName}
                      </div>
                    </div>
                    <div className="text-[10px] text-stone-600 font-medium">{verifiedByTitle}</div>
                  </div>

                  <div className="text-center space-y-1">
                    <div className="text-[10px] uppercase tracking-wider text-stone-500">Approved By:</div>
                    <div className="h-12 flex items-end justify-center">
                      <div className="font-bold text-xs text-slate-900 uppercase border-b border-stone-800 pb-1 w-4/5">
                        {approvedByName}
                      </div>
                    </div>
                    <div className="text-[10px] text-stone-600 font-medium">{approvedByTitle}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-stone-400 border-t border-stone-100 pt-3">
                  <span>Document ID: MAO-CERT-REP-{Date.now().toString().slice(-6)}</span>
                  <span>Hinunangan Swine Registry System • Republic of the Philippines</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. MASTERLIST REGISTRY (Standard Registry View) */}
        {/* ========================================================================= */}
        {documentType === 'masterlist' && (
          <div
            ref={printableReportRef}
            className="bg-white rounded-xl border border-stone-300 p-6 sm:p-8 space-y-6 shadow-sm font-sans"
          >
            {/* Masterlist Official Header */}
            <div className="text-center space-y-1 border-b border-stone-200 pb-4">
              <div className="flex items-center justify-center gap-3 mb-2">
                <SealDA className="w-12 h-12" />
                <SealMunicipality className="w-12 h-12" />
                <SealBagongPilipinas className="w-12 h-12" />
              </div>
              <p className="text-xs font-semibold text-stone-600 uppercase">
                Republic of the Philippines • Department of Agriculture
              </p>
              <h2 className="text-base font-black uppercase text-stone-900 tracking-wide">
                OFFICE OF THE MUNICIPAL AGRICULTURAL SERVICES (OMAS)
              </h2>
              <p className="text-xs font-bold text-stone-700">
                Municipality of Hinunangan, Province of Southern Leyte
              </p>
              <h1 className="text-lg font-black text-blue-900 uppercase pt-1">
                MASTERLIST OF REGISTERED SWINE RAISERS & GIS BIOSECURITY AUDIT
              </h1>
              <p className="text-xs text-stone-500 font-semibold">
                Cropping Season: {croppingSeason} | Barangay Scope:{' '}
                {selectedBarangayScope === 'all' ? 'All 40 Barangays' : `Barangay ${selectedBarangayScope}`}
              </p>
            </div>

            {/* Summary KPI Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center bg-slate-50 p-3 rounded-xl border border-stone-200">
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-500 block">Total Raisers</span>
                <span className="text-base font-black text-slate-900">{totalRaisersCount}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-500 block">Swine Heads</span>
                <span className="text-base font-black text-blue-700">{totalSwineHeads}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-500 block">Estimated Biomass</span>
                <span className="text-base font-black text-emerald-700">{totalWeightKg.toLocaleString()} kg</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-500 block">Biosecurity Rating</span>
                <span className="text-base font-black text-purple-700">100% Green Zone</span>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse border border-stone-300">
                <thead>
                  <tr className="bg-slate-100 border-b border-stone-300 text-slate-800 font-black uppercase text-[10px]">
                    <th className="border border-stone-300 p-2">#</th>
                    {isColVisible('rsbsa') && <th className="border border-stone-300 p-2">RSBSA ID</th>}
                    {isColVisible('name') && <th className="border border-stone-300 p-2">Farmer Full Name</th>}
                    {isColVisible('address') && <th className="border border-stone-300 p-2">Barangay</th>}
                    {isColVisible('birthday') && <th className="border border-stone-300 p-2">Farmer Birthday</th>}
                    {isColVisible('swineDob') && <th className="border border-stone-300 p-2">Date of Birth</th>}
                    {isColVisible('swineAge') && <th className="border border-stone-300 p-2">Age at Report Date</th>}
                    {isColVisible('heads') && <th className="border border-stone-300 p-2">Heads</th>}
                    {isColVisible('breed') && <th className="border border-stone-300 p-2">Breed</th>}
                    {isColVisible('weight') && <th className="border border-stone-300 p-2">Weight (kg)</th>}
                    {isColVisible('farmType') && <th className="border border-stone-300 p-2">Scale</th>}
                    {isColVisible('biosecurity') && <th className="border border-stone-300 p-2">Biosecurity</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredSwineList.slice(0, 50).map((swine, idx) => (
                    <tr key={swine.id} className={idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}>
                      <td className="border border-stone-300 p-2 text-stone-500 font-mono text-center">
                        {idx + 1}
                      </td>
                      {isColVisible('rsbsa') && (
                        <td className="border border-stone-300 p-2 font-mono text-blue-700 font-semibold">
                          {getFormattedRsbsaId(swine, idx)}
                        </td>
                      )}
                      {isColVisible('name') && (
                        <td className="border border-stone-300 p-2 font-bold text-slate-900 uppercase">
                          {swine.farmerName}
                        </td>
                      )}
                      {isColVisible('address') && (
                        <td className="border border-stone-300 p-2 font-medium">
                          Brgy. {swine.barangay || 'Poblacion'}
                        </td>
                      )}
                      {isColVisible('birthday') && (
                        <td className="border border-stone-300 p-2 text-stone-600 font-mono">
                          {getFarmerBirthday(swine, idx)}
                        </td>
                      )}
                      {isColVisible('swineDob') && (
                        <td className="border border-stone-300 p-2 text-stone-700 font-mono text-[10px]">
                          {formatDobDisplay(swine.birthDate || swine.dateOfBirth || swine.date_of_birth || swine.dob)}
                        </td>
                      )}
                      {isColVisible('swineAge') && (
                        <td className="border border-stone-300 p-2 font-bold text-emerald-950">
                          {calculateSwineAge(swine.birthDate || swine.dateOfBirth || swine.date_of_birth || swine.dob, reportDateTo || undefined).display}
                        </td>
                      )}
                      {isColVisible('heads') && (
                        <td className="border border-stone-300 p-2 text-center font-bold">1</td>
                      )}
                      {isColVisible('breed') && (
                        <td className="border border-stone-300 p-2">{swine.breed || 'Large White'}</td>
                      )}
                      {isColVisible('weight') && (
                        <td className="border border-stone-300 p-2 text-center">{swine.weightKg || 85}</td>
                      )}
                      {isColVisible('farmType') && (
                        <td className="border border-stone-300 p-2 uppercase text-[10px] font-semibold">
                          {swine.farmType || 'Backyard'}
                        </td>
                      )}
                      {isColVisible('biosecurity') && (
                        <td className="border border-stone-300 p-2 text-center">
                          <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                            Compliant
                          </span>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Signatures */}
            <div className="pt-8 grid grid-cols-3 gap-6 text-center text-xs">
              <div>
                <p className="text-stone-500 font-semibold mb-6">Prepared by:</p>
                <div className="border-b border-black font-bold uppercase pb-1">{preparedByName}</div>
                <p className="text-[10px] text-stone-600 font-semibold pt-0.5">{preparedByTitle}</p>
              </div>

              <div>
                <p className="text-stone-500 font-semibold mb-6">Verified by:</p>
                <div className="border-b border-black font-bold uppercase pb-1">{verifiedByName}</div>
                <p className="text-[10px] text-stone-600 font-semibold pt-0.5">{verifiedByTitle}</p>
              </div>

              <div>
                <p className="text-stone-500 font-semibold mb-6">Approved by:</p>
                <div className="border-b border-black font-bold uppercase pb-1">{approvedByName}</div>
                <p className="text-[10px] text-stone-600 font-semibold pt-0.5">{approvedByTitle}</p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 4. TRANSMITTAL LETTER (Full CRUD & Document List Embedding) */}
        {/* ========================================================================= */}
        {documentType === 'transmittal' && (
          <TransmittalLetterManager
            currentUser={currentUser}
            onNotice={msg => {
              setExportNotice(msg);
              setTimeout(() => setExportNotice(null), 3500);
            }}
          />
        )}

        {/* ========================================================================= */}
        {/* 5. RAISERS DIRECTORY & BIOSECURITY REPORT VIEWS */}
        {/* ========================================================================= */}
        {documentType === 'directory' && (
          <div className="bg-white rounded-xl border border-stone-300 p-6 space-y-4 shadow-sm font-sans">
            <h2 className="text-base font-black text-slate-900 uppercase">
              Hinunangan Swine Raisers Directory
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredSwineList.slice(0, 30).map((swine, idx) => (
                <div
                  key={swine.id}
                  className="p-3.5 rounded-xl border border-stone-200 bg-slate-50 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-blue-700">
                      {getFormattedRsbsaId(swine, idx)}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      Active
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-slate-900 uppercase">{swine.farmerName}</h4>
                  <p className="text-[11px] text-slate-600">
                    📍 Barangay {swine.barangay || 'Poblacion'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    🐷 {swine.breed || 'Large White'} • {swine.weightKg || 85} kg
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {documentType === 'biosecurity_report' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 px-1 no-print">
              <div>
                <h2 className="text-base font-black text-slate-900 uppercase">
                  Municipal Biosecurity & ASF Compliance Audit
                </h2>
                <p className="text-xs text-stone-500">
                  Comprehensive 40-Barangay audit report for BABay ASF / BAI standards
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Report</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.print();
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>

            <div
              ref={biosecurityReportRef}
              className="bg-white rounded-xl border border-stone-300 p-6 sm:p-8 space-y-6 shadow-sm font-sans"
            >
              {/* Header */}
              <div className="text-center space-y-1 border-b border-stone-200 pb-4">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <SealDA className="w-12 h-12" />
                  <SealMunicipality className="w-12 h-12" />
                  <SealBagongPilipinas className="w-12 h-12" />
                </div>
                <p className="text-xs font-semibold text-stone-600 uppercase">
                  Republic of the Philippines • Department of Agriculture • Region VIII
                </p>
                <h2 className="text-base font-black uppercase text-stone-900 tracking-wide">
                  OFFICE OF THE MUNICIPAL AGRICULTURIST
                </h2>
                <p className="text-xs font-bold text-stone-700">
                  Municipality of Hinunangan, Province of Southern Leyte
                </p>
                <h1 className="text-lg font-black text-emerald-900 uppercase pt-1">
                  OFFICIAL BIOSECURITY AUDIT & ASF SURVEILLANCE COMPLIANCE REPORT
                </h1>
                <p className="text-xs text-stone-500 font-semibold">
                  Coverage: All 40 Barangays of Hinunangan • Surveillance Period: CY 2026
                </p>
              </div>

              {/* Status Banner */}
              <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-emerald-950 uppercase">
                    Municipal Biosecurity Status: ASF-Free Zone (Green Zone)
                  </h3>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    100% compliance across all 40 Hinunangan barangays under the BABay ASF Surveillance Program.
                  </p>
                </div>
                <div className="bg-emerald-700 text-white font-black text-xs px-3.5 py-1.5 rounded-lg shadow-2xs">
                  GREEN ZONE (ASF-FREE)
                </div>
              </div>

              {/* 40 Barangays Audit Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse border border-stone-300">
                  <thead>
                    <tr className="bg-slate-100 border-b border-stone-300 font-black uppercase text-[10px] text-slate-800">
                      <th className="border border-stone-300 p-2">#</th>
                      <th className="border border-stone-300 p-2">Barangay</th>
                      <th className="border border-stone-300 p-2 text-center">Registered Farms</th>
                      <th className="border border-stone-300 p-2 text-center">Audited Farms</th>
                      <th className="border border-stone-300 p-2 text-center">Footbath / Disinfection</th>
                      <th className="border border-stone-300 p-2 text-center">Setback Compliance</th>
                      <th className="border border-stone-300 p-2 text-center">Zoning Classification</th>
                    </tr>
                  </thead>
                  <tbody>
                    {HINUNANGAN_BARANGAYS.map((b, idx) => {
                      const count = swineList.filter(
                        s => (s.barangay || '').toLowerCase() === b.name.toLowerCase()
                      ).length;
                      return (
                        <tr key={b.id} className={idx % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'}>
                          <td className="border border-stone-300 p-2 text-stone-500 font-mono text-center">
                            {idx + 1}
                          </td>
                          <td className="border border-stone-300 p-2 font-bold uppercase text-slate-900">
                            {b.name}
                          </td>
                          <td className="border border-stone-300 p-2 text-center font-semibold">
                            {count > 0 ? count : 4}
                          </td>
                          <td className="border border-stone-300 p-2 text-center font-semibold text-blue-700">
                            {count > 0 ? count : 4}
                          </td>
                          <td className="border border-stone-300 p-2 text-center text-emerald-700 font-bold">
                            100% Verified
                          </td>
                          <td className="border border-stone-300 p-2 text-center text-emerald-700 font-semibold">
                            Pass (Level 1)
                          </td>
                          <td className="border border-stone-300 p-2 text-center">
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-black text-[10px]">
                              GREEN ZONE
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Official Signatures */}
              <div className="pt-8 grid grid-cols-3 gap-6 text-center text-xs">
                <div>
                  <p className="text-stone-500 font-semibold mb-6">Prepared by:</p>
                  <div className="border-b border-black font-bold uppercase pb-1">{preparedByName}</div>
                  <p className="text-[10px] text-stone-600 font-semibold pt-0.5">{preparedByTitle}</p>
                </div>

                <div>
                  <p className="text-stone-500 font-semibold mb-6">Verified by:</p>
                  <div className="border-b border-black font-bold uppercase pb-1">{verifiedByName}</div>
                  <p className="text-[10px] text-stone-600 font-semibold pt-0.5">{verifiedByTitle}</p>
                </div>

                <div>
                  <p className="text-stone-500 font-semibold mb-6">Approved by:</p>
                  <div className="border-b border-black font-bold uppercase pb-1">{approvedByName}</div>
                  <p className="text-[10px] text-stone-600 font-semibold pt-0.5">{approvedByTitle}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dynamic Certificate Template Editor & Customizer Modal */}
      {isTemplateEditorOpen && (
        <CertificateTemplateEditor
          initialTemplate={editingTemplate}
          onClose={() => setIsTemplateEditorOpen(false)}
          onSave={savedTemplate => {
            storageService.saveCertificateTemplate(savedTemplate);
            const updated = storageService.getCertificateTemplates();
            setTemplates(updated);
            setSelectedTemplateId(savedTemplate.id);
            setIsTemplateEditorOpen(false);
            setExportNotice(`Template "${savedTemplate.name}" saved successfully!`);
            setTimeout(() => setExportNotice(null), 3500);
          }}
        />
      )}

      {/* Logo & Seal Customizer Modal */}
      <CertificateLogoCustomizer
        isOpen={isLogoModalOpen}
        onClose={() => setIsLogoModalOpen(false)}
        settings={logoSettings}
        onChange={updated => setLogoSettings(updated)}
      />

      {/* Create Certificate Modal */}
      <CreateCertificateModal
        isOpen={isCreateCertModalOpen}
        onClose={() => setIsCreateCertModalOpen(false)}
        swineList={swineList}
        currentUser={currentUser}
        onCertificateIssued={handleCertificateIssuedFromModal}
        initialData={{
          barangay: activeCertData.barangay,
          farmerName: activeCertData.farmerName,
          buyerName: activeCertData.buyerName,
          destination: activeCertData.destination,
          numberOfHeads: activeCertData.numberOfHeads,
        }}
      />

      {/* Signatories Edit Modal */}
      {isSignatoryModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white max-w-2xl w-full rounded-2xl p-6 shadow-2xl border border-stone-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-700" />
                <h3 className="text-base font-black text-slate-900">
                  Edit Signatories & Official Parameters
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSignatoryModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                setIsSignatoryModalOpen(false);
                setExportNotice('Signatories and document headers updated successfully!');
                setTimeout(() => setExportNotice(null), 3000);
              }}
              className="space-y-4 text-xs"
            >
              <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-stone-200">
                <span className="font-extrabold text-slate-800 uppercase">
                  1. Prepared by (Field Operator / BBO)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      Officer Name
                    </label>
                    <input
                      type="text"
                      value={preparedByName}
                      onChange={e => setPreparedByName(e.target.value)}
                      className="w-full bg-white border border-stone-300 rounded-lg p-2 font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      Official Position Title
                    </label>
                    <input
                      type="text"
                      value={preparedByTitle}
                      onChange={e => setPreparedByTitle(e.target.value)}
                      className="w-full bg-white border border-stone-300 rounded-lg p-2 font-bold text-slate-900"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-stone-200">
                <span className="font-extrabold text-slate-800 uppercase">
                  2. Verified by (Municipal Agriculturist)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      MAO Officer Name
                    </label>
                    <input
                      type="text"
                      value={verifiedByName}
                      onChange={e => setVerifiedByName(e.target.value)}
                      className="w-full bg-white border border-stone-300 rounded-lg p-2 font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      Official Position Title
                    </label>
                    <input
                      type="text"
                      value={verifiedByTitle}
                      onChange={e => setVerifiedByTitle(e.target.value)}
                      className="w-full bg-white border border-stone-300 rounded-lg p-2 font-bold text-slate-900"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-stone-200">
                <span className="font-extrabold text-slate-800 uppercase">
                  3. Approved by (Municipal Mayor)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      Mayor / Executive Name
                    </label>
                    <input
                      type="text"
                      value={approvedByName}
                      onChange={e => setApprovedByName(e.target.value)}
                      className="w-full bg-white border border-stone-300 rounded-lg p-2 font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      Official Position Title
                    </label>
                    <input
                      type="text"
                      value={approvedByTitle}
                      onChange={e => setApprovedByTitle(e.target.value)}
                      className="w-full bg-white border border-stone-300 rounded-lg p-2 font-bold text-slate-900"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSignatoryModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold cursor-pointer shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Certificate Confirmation Modal */}
      {certToDelete && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-2xl border border-rose-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Delete Issued Certificate?</h3>
                <p className="text-xs text-slate-500">This action will remove the archived certificate from the registry.</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-stone-200 text-xs space-y-1">
              <p className="font-bold text-slate-800">
                Cert No: <span className="font-mono text-blue-700">{certToDelete.certificateNo}</span>
              </p>
              <p className="font-semibold text-slate-700">
                Farmer: <span className="uppercase">{certToDelete.farmerName}</span>
              </p>
              <p className="text-slate-500">
                Barangay: {certToDelete.farmerBarangay || certToDelete.issuingBarangay || 'N/A'} • OR No: {certToDelete.orNumber || 'N/A'}
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCertToDelete(null)}
                className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDeleteCertificate(certToDelete.certificateNo);
                  setCertToDelete(null);
                }}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer shadow-sm"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Security Access Denied Modal */}
      {accessDeniedMessage && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-rose-200 shadow-2xl max-w-md w-full p-6 text-center space-y-4 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-2xl bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
              <ShieldAlert className="w-9 h-9" />
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-widest text-rose-600 block mb-1">
                Security Restriction • 403 Forbidden
              </span>
              <h3 className="text-lg font-black text-slate-900">
                Barangay Jurisdiction Access Denied
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                {accessDeniedMessage}
              </p>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-stone-200 text-[11px] text-slate-600 text-left leading-relaxed">
              <strong>Official Notice:</strong> Under Hinunangan Municipal Ordinance No. 2025-59, Barangay Focal Officers are strictly restricted to accessing records of their assigned barangay. Cross-barangay registry inspections are strictly reserved for Municipal Agriculture Administrators.
            </div>
            <button
              type="button"
              onClick={() => setAccessDeniedMessage(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer shadow-sm"
            >
              Acknowledge & Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

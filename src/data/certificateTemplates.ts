import { CertificateTemplate } from '../types';

export const INITIAL_CERTIFICATE_TEMPLATES: CertificateTemplate[] = [
  {
    id: 'tpl-nava-official',
    name: 'Barangay Nava Official Format (English • 3 Logos)',
    barangay: 'Nava',
    documentType: 'Barangay Certification',
    documentTitle: 'Barangay Certification',
    titleFont: 'gothic',
    language: 'english',
    pageSize: 'Folio',
    orientation: 'portrait',
    header: {
      countryText: 'Republic of the Philippines',
      provinceText: 'PROVINCE OF SOUTHERN LEYTE',
      municipalityText: 'Municipality of Hinunangan',
      barangayText: 'BARANGAY NAVA',
      contactEmail: 'nava.hinunangan20@gmail.com',
      contactPhone: '09763070221',
      borderStyle: 'single',
    },
    logos: [
      {
        id: 'logo-nava-1',
        type: 'barangay',
        position: 'left',
        barangayName: 'NAVA',
        widthPx: 72,
        heightPx: 72,
        order: 1,
        visible: true,
      },
      {
        id: 'logo-nava-2',
        type: 'municipality',
        position: 'center',
        widthPx: 64,
        heightPx: 64,
        order: 2,
        visible: true,
      },
      {
        id: 'logo-nava-3',
        type: 'bagong_pilipinas',
        position: 'right',
        widthPx: 64,
        heightPx: 64,
        order: 3,
        visible: true,
      },
    ],
    watermark: {
      enabled: true,
      type: 'municipality',
      opacity: 0.12,
      position: 'center',
      size: 'large',
    },
    bodyTemplate: `TO WHOM IT MAY CONCERN:

This is to certify that {{resident_name}} is a bonifide resident of Barangay {{barangay}}, Hinunangan, Southern Leyte.

This certifies further that {{resident_name}} owned {{number_of_pigs}} heads pigs sold to {{buyer_name}} of {{destination}}. {{price_per_kilo}}

THIS CERTIFICATION is being issued upon the request of the below-named for whatever any legal purpose it may serve best.

Issued this {{date_issued}} at Barangay {{barangay}}, Hinunangan, Southern Leyte, Philippines.`,
    signatories: [
      {
        id: 'sig-nava-1',
        name: 'HON. VICENTE T. MADRONERO JR.',
        position: 'Punong Barangay',
        showSignatureImage: false,
        order: 1,
        alignment: 'center',
        section: 'left',
      },
      {
        id: 'sig-nava-2',
        name: 'RANDY N. BURLAZA, BBO',
        position: 'BBO',
        showSignatureImage: false,
        order: 2,
        alignment: 'center',
        section: 'middle',
      },
      {
        id: 'sig-nava-3',
        name: '{{resident_name}}',
        position: 'FARMER/OWNER',
        showSignatureImage: false,
        order: 3,
        alignment: 'center',
        section: 'right',
      },
    ],
    receipt: {
      showReceiptBox: true,
      formatStyle: 'nava',
      orNumber: '1675127',
      amountPaid: '100.00',
    },
    isActive: true,
    isDefaultPreset: true,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-22T00:00:00.000Z',
  },
  {
    id: 'tpl-nueva-esperanza-bisaya',
    name: 'Barangay Nueva Esperanza Format (Bisaya Dialect)',
    barangay: 'Nueva Esperanza',
    documentType: 'Barangay Certification',
    documentTitle: 'BARANGAY CERTIFICATION',
    titleFont: 'serif_underline',
    language: 'bisaya',
    pageSize: 'Folio',
    orientation: 'portrait',
    header: {
      countryText: 'Republic of the Philippines',
      provinceText: 'PROVINCE OF SOUTHERN LEYTE',
      municipalityText: 'Municipality of Hinunangan',
      barangayText: 'BARANGAY NUEVA ESPERANZA',
      officeTitle: 'OFFICE OF THE PUNONG BARANGAY',
      mottoOrSubtitle: 'o0o',
      borderStyle: 'single',
    },
    logos: [
      {
        id: 'logo-ne-1',
        type: 'barangay',
        position: 'left',
        barangayName: 'NUEVA ESPERANZA',
        widthPx: 75,
        heightPx: 75,
        order: 1,
        visible: true,
      },
    ],
    watermark: {
      enabled: true,
      type: 'municipality',
      opacity: 0.15,
      position: 'center',
      size: 'large',
    },
    bodyTemplate: `KINI NAGPAMATUOD NGA:

Ako si {{association_name}}, {{farmer_age_civil_status}} nagpuyo sa Bgy. {{barangay}}, Hinunangan, Southern Leyte, nag BALIGYA og ({{number_of_pigs}}) ka Baboy ngadto ni {{buyer_name}}, nga taga {{destination}}, sa kantidad nga ({{price_per_kilo}}).

Kini nga mga Baboy nag edad og {{swine_age}}, {{female_count}} ka Bajie og {{male_count}} ka Buok, og ang mga kulor niini, {{color_description}}, si {{association_name}}, ang legal nga tag-iya.

Gihimo ning {{date_issued}} dinhi sa Opisina sa Punong Barangay sa {{barangay}}, Hinunangan, So. Leyte.`,
    signatories: [
      {
        id: 'sig-ne-1',
        name: '{{buyer_name}}',
        position: 'Hing palit sa Baboy',
        showSignatureImage: false,
        order: 1,
        alignment: 'center',
        section: 'left',
      },
      {
        id: 'sig-ne-2',
        name: '{{association_name}}',
        position: 'Nagbaligya/Tag-iya sa Baboy',
        showSignatureImage: false,
        order: 2,
        alignment: 'center',
        section: 'right',
      },
      {
        id: 'sig-ne-3',
        name: 'HON. MARILYN C. CAGADO',
        position: 'Barangay Bio Officer',
        showSignatureImage: false,
        order: 3,
        alignment: 'center',
        section: 'noted_by',
        details: 'Noted by:',
      },
      {
        id: 'sig-ne-4',
        name: 'HON. ROMEO S. ROSELLO',
        position: 'Punong Barangay',
        showSignatureImage: false,
        order: 4,
        alignment: 'center',
        section: 'certified_by',
        details: 'Certified by:',
      },
    ],
    receipt: {
      showReceiptBox: true,
      formatStyle: 'standard',
      orNumber: '4278912',
      amountPaid: '50.00',
    },
    isActive: true,
    isDefaultPreset: true,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-22T00:00:00.000Z',
  },
  {
    id: 'tpl-tuburan-transport',
    name: 'Barangay Tuburan Transport Certification (English)',
    barangay: 'Tuburan',
    documentType: 'Swine Transport Certification',
    documentTitle: 'BARANGAY CERTIFICATION',
    titleFont: 'serif_bold',
    language: 'english',
    pageSize: 'Folio',
    orientation: 'portrait',
    header: {
      countryText: 'Republic of the Philippines',
      provinceText: 'PROVINCE OF SOUTHERN LEYTE',
      municipalityText: 'Municipality of Hinunangan',
      barangayText: 'BARANGAY TUBURAN',
      officeTitle: 'OFFICE OF THE PUNONG BARANGAY',
      borderStyle: 'green_line',
    },
    logos: [
      {
        id: 'logo-tub-1',
        type: 'barangay',
        position: 'left',
        barangayName: 'TUBURAN',
        widthPx: 75,
        heightPx: 75,
        order: 1,
        visible: true,
      },
      {
        id: 'logo-tub-2',
        type: 'municipality',
        position: 'right',
        widthPx: 75,
        heightPx: 75,
        order: 2,
        visible: true,
      },
    ],
    watermark: {
      enabled: false,
      type: 'municipality',
      opacity: 0.1,
      position: 'center',
      size: 'large',
    },
    bodyTemplate: `TO WHOM IT MAY CONCERN:

THIS IS TO CERTIFY that {{resident_name}} a bonafide resident of Barangay {{barangay}}, Hinunangan, Southern Leyte.

FURTHER CERTIFY that the above-named person Owned {{number_of_pigs}} Pigs and to be sold to {{buyer_name}}.

This certification is being issued to support for transporting this {{number_of_pigs}} pigs from Barangay {{barangay}}, Hinunangan Southern Leyte to {{destination}}.

Issued this {{date_issued}} .`,
    noteText: 'Note: This certification is not valid without official seal.',
    signatories: [
      {
        id: 'sig-tub-1',
        name: 'HON. EDGARDO L. BALEROS',
        position: 'Punong Brgy',
        showSignatureImage: false,
        order: 1,
        alignment: 'right',
        details: 'BY:',
      },
    ],
    receipt: {
      showReceiptBox: true,
      formatStyle: 'standard',
      orNumber: '8910245',
      amountPaid: '50.00',
    },
    isActive: true,
    isDefaultPreset: true,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-22T00:00:00.000Z',
  },
  {
    id: 'tpl-da-gatepass',
    name: 'DA / MAO Veterinary Gate Pass & Biosecurity Clearance',
    barangay: 'All',
    documentType: 'Swine Transport Certification',
    documentTitle: 'BARANGAY LIVESTOCK BIOSECURITY CLEARANCE',
    titleFont: 'serif_bold',
    language: 'english',
    pageSize: 'Folio',
    orientation: 'portrait',
    header: {
      countryText: 'Republic of the Philippines',
      provinceText: 'PROVINCE OF SOUTHERN LEYTE',
      municipalityText: 'Municipality of Hinunangan',
      barangayText: 'OFFICE OF THE MUNICIPAL AGRICULTURIST',
      officeTitle: 'LIVESTOCK INSPECTION & QUARANTINE DIVISION',
      contactEmail: 'agri.hinunangan@gmail.com',
      contactPhone: '(053) 578-2011',
      borderStyle: 'double',
    },
    logos: [
      {
        id: 'logo-da-1',
        type: 'da',
        position: 'left',
        widthPx: 72,
        heightPx: 72,
        order: 1,
        visible: true,
      },
      {
        id: 'logo-da-2',
        type: 'municipality',
        position: 'center',
        widthPx: 64,
        heightPx: 64,
        order: 2,
        visible: true,
      },
      {
        id: 'logo-da-3',
        type: 'bagong_pilipinas',
        position: 'right',
        widthPx: 64,
        heightPx: 64,
        order: 3,
        visible: true,
      },
    ],
    watermark: {
      enabled: true,
      type: 'da',
      opacity: 0.12,
      position: 'center',
      size: 'large',
    },
    bodyTemplate: `TO ALL CONCERNED QUARANTINE & CHECKPOINT OFFICERS:

THIS IS TO OFFICIALLY CERTIFY that the livestock holding belonging to {{resident_name}} of Barangay {{barangay}}, Hinunangan, Southern Leyte has been inspected by the Municipal Agriculture Office and verified to be compliant with national biosecurity standards, ASF-free zone clearances, and veterinary ante-mortem protocols.

Permission is hereby granted for the live dispatch and transport of {{number_of_pigs}} head(s) of swine to {{buyer_name}} destined for {{destination}}.

Issued this {{date_issued}} at Hinunangan, Southern Leyte, Philippines.`,
    signatories: [
      {
        id: 'sig-da-1',
        name: 'ENGR. ARNALDO M. VALDEZ',
        position: 'Municipal Agricultural Officer',
        showSignatureImage: false,
        order: 1,
        alignment: 'center',
        section: 'left',
      },
      {
        id: 'sig-da-2',
        name: 'HON. CIRILO B. MONTEJO',
        position: 'Municipal Mayor / Authorized Official',
        showSignatureImage: false,
        order: 2,
        alignment: 'center',
        section: 'right',
      },
    ],
    receipt: {
      showReceiptBox: true,
      formatStyle: 'standard',
      orNumber: '5561923',
      amountPaid: '150.00',
    },
    isActive: true,
    isDefaultPreset: true,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-22T00:00:00.000Z',
  },
  {
    id: 'tpl-ownership-certification',
    name: 'Swine Ownership & Raiser Certification',
    barangay: 'All',
    documentType: 'Ownership Certification',
    documentTitle: 'CERTIFICATE OF SWINE OWNERSHIP',
    titleFont: 'serif_bold',
    language: 'english',
    pageSize: 'Letter',
    orientation: 'portrait',
    header: {
      countryText: 'Republic of the Philippines',
      provinceText: 'PROVINCE OF SOUTHERN LEYTE',
      municipalityText: 'Municipality of Hinunangan',
      barangayText: 'BARANGAY {{barangay}}',
      officeTitle: 'OFFICE OF THE PUNONG BARANGAY',
      borderStyle: 'single',
    },
    logos: [
      {
        id: 'logo-own-1',
        type: 'barangay',
        position: 'left',
        widthPx: 70,
        heightPx: 70,
        order: 1,
        visible: true,
      },
      {
        id: 'logo-own-2',
        type: 'municipality',
        position: 'right',
        widthPx: 70,
        heightPx: 70,
        order: 2,
        visible: true,
      },
    ],
    watermark: {
      enabled: true,
      type: 'municipality',
      opacity: 0.1,
      position: 'center',
      size: 'medium',
    },
    bodyTemplate: `TO WHOM IT MAY CONCERN:

THIS IS TO CERTIFY that {{resident_name}}, of legal age, Filipino, is a bonafide resident of Barangay {{barangay}}, Hinunangan, Southern Leyte.

THIS CERTIFIES FURTHER that the subject individual is the registered and lawful owner of {{number_of_pigs}} head(s) of {{animal_type}}, reared under compliant biosecurity standards within our barangay jurisdiction.

THIS CERTIFICATION is issued upon request of the interested party for {{purpose}}.

Issued this {{date_issued}} at Barangay {{barangay}}, Hinunangan, Southern Leyte.`,
    signatories: [
      {
        id: 'sig-own-1',
        name: 'HON. CIRILO B. MONTEJO',
        position: 'Punong Barangay',
        showSignatureImage: false,
        order: 1,
        alignment: 'right',
      },
    ],
    receipt: {
      showReceiptBox: true,
      formatStyle: 'standard',
      orNumber: '7829104',
      amountPaid: '50.00',
    },
    isActive: true,
    isDefaultPreset: true,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-22T00:00:00.000Z',
  },
];

export const DOCUMENT_TYPE_OPTIONS = [
  'Barangay Certification',
  'Ownership Certification',
  'Swine Transport Certification',
  'Animal Sale Certification',
  'Residency Certification',
  'Certificate of Indigency',
  'Business Certification',
  'Custom Certificate',
  'Other official barangay documents',
];

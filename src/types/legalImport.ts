import { ASFRegulatoryDocument, LegalArticle, LegalArticleSection, LegalDocumentType, LegalDocumentCategory, LegalDocumentStatus } from '../types';

export interface LegalImportFileItem {
  id: string;
  name: string;
  size: number;
  sizeFormatted: string;
  type: string;
  extension: string;
  fileData?: string; // base64 or raw text
  pageCount?: number;
  status: 'pending' | 'processing' | 'ready' | 'needs_review' | 'duplicate' | 'error';
  errorMessage?: string;
  ocrApplied?: boolean;
  ocrConfidence?: number;
  rawText: string;
  pages?: { pageNumber: number; text: string; imageUrl?: string }[];
  detection?: LegalImportDetectionResult;
}

export interface LegalImportDetectionResult {
  docType: LegalDocumentType | string;
  docTypeName: string;
  officialNumber: string;
  seriesYear: string;
  jurisdiction: string;
  jurisdictionLevel: 'Municipal' | 'Provincial' | 'National' | 'Regional';
  issuingAuthority: string;
  author?: string;
  title: string;
  shortTitle?: string;
  category: LegalDocumentCategory | string;
  status: LegalDocumentStatus;
  dateEnacted?: string;
  effectiveDate?: string;
  signatory?: string;
  signatoryTitle?: string;
  tags: string[];
  legalBasis: string[];
  referencedLaws: {
    title: string;
    docNumber?: string;
    matchedDocId?: string;
    existsInSystem: boolean;
  }[];
  classificationPath: string[];
  articles: LegalArticle[];
  totalSectionsCount: number;
  penalties: {
    offenseTier: string;
    finePhp: number;
    punitiveActions: string;
    imprisonment?: string;
  }[];
  locationalRules?: {
    item: string;
    distanceMeters: number;
    description: string;
  }[];
  isDuplicate: boolean;
  duplicateDocId?: string;
  duplicateDocTitle?: string;
  duplicateAction: 'new_document' | 'new_version' | 'overwrite';
}

export interface LegalExcelColumnMapping {
  docTypeCol: string;
  docNumberCol: string;
  yearCol: string;
  titleCol: string;
  jurisdictionCol: string;
  categoryCol: string;
  dateCol: string;
  statusCol: string;
  articleCol: string;
  sectionCol: string;
  sectionTitleCol: string;
  contentCol: string;
}

export interface LegalExcelSheetInfo {
  sheetName: string;
  rowCount: number;
  columns: string[];
  mapping: Partial<LegalExcelColumnMapping>;
  selected: boolean;
  inferredType: 'ordinance' | 'resolution' | 'sections' | 'mixed' | 'unknown';
}

export interface LegalImportHistoryRecord {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: string;
  documentTitle: string;
  documentNumber: string;
  documentType: string;
  category: string;
  jurisdiction: string;
  importedAt: string;
  importedBy: string;
  status: 'Successful' | 'Needs Review' | 'Version Updated' | 'Failed';
  sectionsDetected: number;
  articlesDetected: number;
  documentId: string;
  notes?: string;
}

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Upload,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertTriangle,
  X,
  Download,
  RefreshCw,
  Search,
  Database,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  SlidersHorizontal,
  Languages,
  Check,
  HelpCircle,
  Eye,
  Columns,
  History,
  Info,
  ShieldCheck,
  Tag,
  MapPin,
  Calendar,
  Layers,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  Barangay,
  ImportColumnMapping,
  ImportMatchStatus,
  ImportRowValidationError,
  ImportRowValidationResult,
  RegistryFormField,
  RegistryFormSchema,
  RegistryFieldType,
  SwineImportHistoryRecord,
  SwineRecord,
  UserAccount,
} from '../../types';
import { storageService } from '../../services/storageService';
import { languageService } from '../../services/languageService';
import {
  analyzeImportColumns,
  CORE_SWINE_FIELDS,
  detectDataTypeFromValues,
  generateDynamicImportWorkbook,
  generateSafeFieldKey,
  generateTranslatedLabels,
  normalizeHeader,
  validateImportRow,
} from '../../utils/columnMatcher';
import { getFieldKey, toFieldKey } from '../../utils/registryFieldUtils';
import { isValidPigIdTag } from '../../utils/swineRegistryLogic';

interface ImportSwineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (count: number) => void;
  barangays: Barangay[];
  currentUser: UserAccount | null;
  existingRecords: SwineRecord[];
}

type ImportStep = 'upload' | 'mapping' | 'validation' | 'importing' | 'completed';

export const ImportSwineModal: React.FC<ImportSwineModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  barangays,
  currentUser,
  existingRecords,
}) => {
  const currentLang = languageService.getLanguage();
  const t = (key: any, fallbackOrParams?: any, fallback?: string) =>
    languageService.t(key, fallbackOrParams, fallback);

  // Active Wizard Step
  const [currentStep, setCurrentStep] = useState<ImportStep>('upload');

  // File & Raw Data State
  const [file, setFile] = useState<File | null>(null);
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, any>[]>([]);
  const [fileReadError, setFileReadError] = useState<string | null>(null);
  const [isReadingFile, setIsReadingFile] = useState<boolean>(false);

  // Active Form Schema (core + dynamic fields)
  const [formSchema, setFormSchema] = useState<RegistryFormSchema>(() => storageService.getRegistryFormSchema());

  // Column Mappings
  const [mappings, setMappings] = useState<ImportColumnMapping[]>([]);
  const [editingMappingIndex, setEditingMappingIndex] = useState<number | null>(null);

  // Validation States
  const [validationResults, setValidationResults] = useState<ImportRowValidationResult[]>([]);
  const [validationFilter, setValidationFilter] = useState<'all' | 'valid' | 'errors' | 'warnings'>('all');
  const [duplicateHandling, setDuplicateHandling] = useState<'update' | 'skip' | 'rename'>('update');
  const [searchFilter, setSearchFilter] = useState<string>('');

  // Execution & Progress State
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importProgress, setImportProgress] = useState<number>(0);
  const [importStatusMsg, setImportStatusMsg] = useState<string>('');
  const [importSummary, setImportSummary] = useState<{
    total: number;
    created: number;
    updated: number;
    skipped: number;
    newFieldsCount: number;
  }>({ total: 0, created: 0, updated: 0, skipped: 0, newFieldsCount: 0 });

  // Missing Fields State
  const [showMissingFieldsAlert, setShowMissingFieldsAlert] = useState<boolean>(true);

  // Custom Target Section for New Fields
  const [targetSectionId, setTargetSectionId] = useState<string>('sec_swine_info');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize with latest schema
  useEffect(() => {
    setFormSchema(storageService.getRegistryFormSchema());
  }, [isOpen]);

  // Reset modal state when closed
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep('upload');
      setFile(null);
      setRawHeaders([]);
      setRawRows([]);
      setMappings([]);
      setValidationResults([]);
      setFileReadError(null);
      setEditingMappingIndex(null);
      setImportProgress(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Existing ear tags set for fast lookup
  const existingEarTags = new Set<string>(
    existingRecords.map(r => (r.pigIdTag || r.earTagNo || '').trim().toUpperCase()).filter(Boolean)
  );

  // List of all existing system fields (Core + Custom Schema)
  const availableTargetFields = [
    { key: '__ignore__', label: '— Ignore Column (Do Not Import) —', group: 'Actions' },
    ...CORE_SWINE_FIELDS.map(cf => ({
      key: cf.key,
      label: `${cf.label} (${cf.required ? 'Required Core' : 'Core'})`,
      group: 'Core Swine Registry Fields',
      type: cf.type,
      required: cf.required,
    })),
    ...(formSchema.sections || []).flatMap(sec =>
      (sec.fields || [])
        .filter(f => !CORE_SWINE_FIELDS.some(c => c.key === getFieldKey(f)))
        .map(fld => ({
          key: getFieldKey(fld),
          label: `${fld.label} (${sec.title})`,
          group: `Custom: ${sec.title}`,
          type: fld.type,
          required: Boolean(fld.required),
        }))
    ),
  ];

  // Identify missing system fields
  const mappedTargetKeys = new Set(
    mappings.filter(m => m.matchStatus !== 'ignored' && m.matchStatus !== 'new_field').map(m => m.targetFieldKey)
  );

  const missingRequiredFields = CORE_SWINE_FIELDS.filter(
    cf => cf.required && !mappedTargetKeys.has(cf.key)
  );

  const missingOptionalFields = CORE_SWINE_FIELDS.filter(
    cf => !cf.required && !mappedTargetKeys.has(cf.key)
  );

  // Handle File Upload & Parsing (XLSX, XLS, CSV)
  const handleFileUpload = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsReadingFile(true);
    setFileReadError(null);

    try {
      const data = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array', cellDates: true, cellNF: false, cellText: false });

      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        throw new Error('Spreadsheet does not contain any readable sheets.');
      }

      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
        raw: false,
        defval: '',
        dateNF: 'yyyy-mm-dd',
      });

      if (!jsonData || jsonData.length === 0) {
        throw new Error('Spreadsheet appears to be empty or has no data rows below the header.');
      }

      // Extract headers from worksheet range or object keys
      const headers = Object.keys(jsonData[0]);
      if (headers.length === 0) {
        throw new Error('Could not identify a valid header row in the file.');
      }

      setRawHeaders(headers);
      setRawRows(jsonData);

      // Perform Intelligent Column Analysis
      const analyzedMappings = analyzeImportColumns(headers, jsonData, formSchema);
      setMappings(analyzedMappings);

      // Transition to mapping step
      setCurrentStep('mapping');
    } catch (err: any) {
      console.error('File reading failed:', err);
      setFileReadError(err.message || 'Failed to read file. Please ensure it is a valid .xlsx, .xls, or .csv spreadsheet.');
    } finally {
      setIsReadingFile(false);
    }
  };

  // Drag and drop handlers
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Update a single column mapping
  const handleUpdateMapping = (index: number, updates: Partial<ImportColumnMapping>) => {
    setMappings(prev => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  };

  // Re-map column to another field or ignore
  const handleTargetChange = (index: number, newTargetKey: string) => {
    if (newTargetKey === '__ignore__') {
      handleUpdateMapping(index, {
        matchStatus: 'ignored',
        createField: false,
      });
      return;
    }

    const matchedCore = CORE_SWINE_FIELDS.find(c => c.key === newTargetKey);
    if (matchedCore) {
      handleUpdateMapping(index, {
        targetFieldKey: matchedCore.key,
        targetFieldLabel: matchedCore.label,
        matchStatus: 'matched_core',
        isNewField: false,
        createField: false,
        isRequired: matchedCore.required,
        detectedDataType: matchedCore.type,
      });
      return;
    }

    let matchedCustom: RegistryFormField | undefined;
    (formSchema.sections || []).forEach(sec => {
      (sec.fields || []).forEach(fld => {
        if (getFieldKey(fld) === newTargetKey) {
          matchedCustom = fld;
        }
      });
    });

    if (matchedCustom) {
      handleUpdateMapping(index, {
        targetFieldKey: getFieldKey(matchedCustom),
        targetFieldLabel: (matchedCustom as RegistryFormField).label,
        matchStatus: 'matched_custom',
        isNewField: false,
        createField: false,
        isRequired: Boolean((matchedCustom as RegistryFormField).required),
        detectedDataType: (matchedCustom as RegistryFormField).type,
      });
      return;
    }

    // Custom new field target
    handleUpdateMapping(index, {
      targetFieldKey: newTargetKey,
      matchStatus: 'new_field',
      isNewField: true,
      createField: true,
    });
  };

  // Trigger Full Row Validation
  const handleProceedToValidation = () => {
    const seenBatchTags = new Set<string>();
    const results: ImportRowValidationResult[] = rawRows.map((row, idx) => {
      return validateImportRow(
        idx + 1,
        row,
        mappings,
        barangays,
        existingEarTags,
        seenBatchTags,
        duplicateHandling
      );
    });

    setValidationResults(results);
    setCurrentStep('validation');
  };

  // Re-run validation when duplicate handling strategy changes
  useEffect(() => {
    if (currentStep === 'validation' && rawRows.length > 0) {
      const seenBatchTags = new Set<string>();
      const results: ImportRowValidationResult[] = rawRows.map((row, idx) => {
        return validateImportRow(
          idx + 1,
          row,
          mappings,
          barangays,
          existingEarTags,
          seenBatchTags,
          duplicateHandling
        );
      });
      setValidationResults(results);
    }
  }, [duplicateHandling]);

  // Validation Summary Stats
  const validationStats = useMemo(() => {
    const total = validationResults.length;
    const valid = validationResults.filter(r => r.isValid && r.warnings.length === 0).length;
    const warnings = validationResults.filter(r => r.isValid && r.warnings.length > 0).length;
    const errors = validationResults.filter(r => !r.isValid).length;
    const duplicates = validationResults.filter(r => r.isDuplicate).length;
    const newFieldsCount = mappings.filter(m => m.isNewField && m.createField).length;

    return { total, valid, warnings, errors, duplicates, newFieldsCount };
  }, [validationResults, mappings]);

  // Filtered validation rows for review
  const filteredValidationResults = useMemo(() => {
    return validationResults.filter(res => {
      if (validationFilter === 'valid' && (!res.isValid || res.warnings.length > 0)) return false;
      if (validationFilter === 'warnings' && (res.warnings.length === 0 || !res.isValid)) return false;
      if (validationFilter === 'errors' && res.isValid) return false;

      if (searchFilter.trim()) {
        const q = searchFilter.toLowerCase().trim();
        const tag = (res.mappedRecord.pigIdTag || '').toLowerCase();
        const farmer = (res.mappedRecord.farmerName || '').toLowerCase();
        const brgy = (res.mappedRecord.barangay || '').toLowerCase();
        return tag.includes(q) || farmer.includes(q) || brgy.includes(q);
      }
      return true;
    });
  }, [validationResults, validationFilter, searchFilter]);

  // Download Dynamic Template
  const handleDownloadTemplate = (format: 'xlsx' | 'csv' = 'xlsx') => {
    const { blob, fileName } = generateDynamicImportWorkbook(formSchema, format);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Download Error & Warning Report
  const handleDownloadErrorReport = () => {
    const errorRows: Record<string, any>[] = [];
    validationResults.forEach(res => {
      if (!res.isValid || res.warnings.length > 0) {
        const issues = [...res.errors, ...res.warnings].map(i => `[${i.severity.toUpperCase()}] ${i.message}`).join(' | ');
        errorRows.push({
          'Row Number': res.rowNumber,
          'Pig ID Tag': res.mappedRecord.pigIdTag || 'N/A',
          'Farmer Name': res.mappedRecord.farmerName || 'N/A',
          'Barangay': res.mappedRecord.barangay || 'N/A',
          'Status': res.isValid ? 'Valid with Warnings' : 'Fatal Error (Skipped)',
          'Issues Detected': issues,
          ...res.rawData,
        });
      }
    });

    if (errorRows.length === 0) return;

    const worksheet = XLSX.utils.json_to_sheet(errorRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Validation Errors');
    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DA_Hinunangan_Import_Validation_Issues_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Execute Database Import & Schema Synchronization
  const handleExecuteImport = async () => {
    setIsImporting(true);
    setCurrentStep('importing');
    setImportProgress(10);
    setImportStatusMsg('Preparing dynamic field definitions...');

    try {
      // 1. Create New Dynamic Fields in Schema if requested
      const newFieldMappings = mappings.filter(m => m.isNewField && m.createField);
      let updatedSchema = { ...formSchema };

      if (newFieldMappings.length > 0) {
        setImportStatusMsg(`Registering ${newFieldMappings.length} new custom fields into schema...`);

        // Find or create target section
        let targetSec = updatedSchema.sections.find(s => s.id === targetSectionId);
        if (!targetSec) {
          targetSec = updatedSchema.sections[0] || {
            id: 'sec_custom_imported',
            title: 'Imported Attributes & Farm Records',
            fields: [],
            visible: true,
          };
          if (!updatedSchema.sections.some(s => s.id === targetSec?.id)) {
            updatedSchema.sections.push(targetSec);
          }
        }

        const addedFieldKeys: string[] = [];

        newFieldMappings.forEach(nfm => {
          const newField: RegistryFormField = {
            id: `fld_${nfm.targetFieldKey}`,
            fieldKey: nfm.targetFieldKey,
            label: nfm.labelEn || nfm.targetFieldLabel,
            labelEn: nfm.labelEn || nfm.targetFieldLabel,
            labelCeb: nfm.labelCeb,
            labelFil: nfm.labelFil,
            type: nfm.detectedDataType,
            required: nfm.isRequired,
            visible: true,
            isCustom: true,
            options: nfm.detectedOptions,
            helpText: `Custom field imported from ${file?.name || 'spreadsheet'}`,
            searchable: nfm.searchable !== false,
            filterable: nfm.filterable !== false,
            sortable: nfm.sortable !== false,
            exportable: nfm.exportable !== false,
            printable: nfm.printable !== false,
          };

          // Check if field already exists in section
          const existingIdx = targetSec!.fields.findIndex(
            f => getFieldKey(f) === nfm.targetFieldKey || f.id === newField.id
          );
          if (existingIdx >= 0) {
            targetSec!.fields[existingIdx] = { ...targetSec!.fields[existingIdx], ...newField };
          } else {
            targetSec!.fields.push(newField);
          }
          addedFieldKeys.push(nfm.targetFieldKey);
        });

        // Save schema to local storage & backend
        storageService.saveRegistryFormSchema(updatedSchema);
      }

      setImportProgress(35);
      setImportStatusMsg('Processing and validating swine records...');

      // 2. Filter Valid Records for Import
      const recordsToImport: SwineRecord[] = [];
      let updatedCount = 0;
      let createdCount = 0;
      let skippedCount = 0;

      const existingRecordsMap = new Map<string, SwineRecord>();
      existingRecords.forEach(r => {
        const tag = (r.pigIdTag || r.earTagNo || '').trim().toUpperCase();
        if (tag) existingRecordsMap.set(tag, r);
      });

      validationResults.forEach(res => {
        if (!res.isValid) {
          skippedCount++;
          return;
        }

        const tag = (res.mappedRecord.pigIdTag || '').trim().toUpperCase();
        const existing = existingRecordsMap.get(tag);

        if (existing) {
          if (duplicateHandling === 'skip') {
            skippedCount++;
            return;
          } else if (duplicateHandling === 'update') {
            // Merge custom fields & updated attributes
            const mergedRecord: SwineRecord = {
              ...existing,
              ...(res.mappedRecord as SwineRecord),
              id: existing.id,
              customFields: {
                ...(existing.customFields || {}),
                ...(res.mappedRecord.customFields || {}),
              },
              updatedAt: new Date().toISOString(),
            };
            recordsToImport.push(mergedRecord);
            updatedCount++;
          } else {
            // Renamed
            recordsToImport.push(res.mappedRecord as SwineRecord);
            createdCount++;
          }
        } else {
          recordsToImport.push(res.mappedRecord as SwineRecord);
          createdCount++;
        }
      });

      setImportProgress(65);
      setImportStatusMsg(`Persisting ${recordsToImport.length} records to database and local store...`);

      // 3. Batch Save Records via API / Local Store
      const currentAllSwine = storageService.getSwineRecords();
      const swineMap = new Map<string, SwineRecord>();
      currentAllSwine.forEach(s => swineMap.set(s.id, s));

      recordsToImport.forEach(rec => {
        swineMap.set(rec.id, rec);
      });

      const finalAllSwine = Array.from(swineMap.values());
      storageService.saveSwineRecords(finalAllSwine);

      // Attempt API Batch Sync to Cloud SQL PostgreSQL
      try {
        const res = await fetch('/api/swine-records/import', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-role': currentUser?.role || 'admin',
            'x-user-id': currentUser?.id || 'admin',
            'x-user-name': currentUser?.name || 'Administrator',
          },
          body: JSON.stringify({
            records: recordsToImport,
            fileName: file?.name || 'Import.xlsx',
            fileType: file?.name.endsWith('.csv') ? 'csv' : 'xlsx',
            fileSize: file?.size || 0,
            duplicateHandling,
            newFieldsCreated: newFieldMappings.map(m => m.targetFieldKey),
          }),
        });

        if (!res.ok) {
          console.warn('Backend batch import notice, records saved locally:', await res.text());
        }
      } catch (e) {
        console.warn('Backend API unreachable, records stored in offline IndexedDB engine:', e);
      }

      // 4. Create Swine Import History Record
      const batchId = `BATCH-HIN-${Date.now()}`;
      const historyRecord: SwineImportHistoryRecord = {
        id: `imp-hist-${Date.now()}`,
        batchId,
        fileName: file?.name || 'Swine_Import.xlsx',
        fileType: file?.name.endsWith('.csv') ? 'csv' : 'xlsx',
        fileSize: file?.size || 0,
        importedBy: currentUser?.name || 'System Administrator',
        importedByRole: currentUser?.role || 'admin',
        importedAt: new Date().toISOString(),
        totalRows: rawRows.length,
        successfulCount: recordsToImport.length,
        failedCount: skippedCount,
        updatedCount,
        createdCount,
        skippedCount,
        newFieldsCreated: newFieldMappings.map(m => m.targetFieldKey),
        status: skippedCount === 0 ? 'completed' : 'partial',
        duplicateHandling,
        recordIds: recordsToImport.map(r => r.id),
        createdFieldKeys: newFieldMappings.map(m => m.targetFieldKey),
      };

      try {
        const existingHist = storageService.getLegalImportHistory ? [] : [];
        // Save to audit / import history storage
        const histKey = 'da_hinunangan_swine_import_history_v1';
        const rawHist = localStorage.getItem(histKey);
        const parsedHist: SwineImportHistoryRecord[] = rawHist ? JSON.parse(rawHist) : [];
        parsedHist.unshift(historyRecord);
        localStorage.setItem(histKey, JSON.stringify(parsedHist.slice(0, 50)));
      } catch {
        // ignore
      }

      setImportProgress(100);
      setImportSummary({
        total: rawRows.length,
        created: createdCount,
        updated: updatedCount,
        skipped: skippedCount,
        newFieldsCount: newFieldMappings.length,
      });
      setImportStatusMsg('Import completed successfully!');
      setCurrentStep('completed');

      // Trigger Parent Success Callback
      onSuccess(recordsToImport.length);
    } catch (err: any) {
      console.error('Import execution failed:', err);
      setFileReadError(err.message || 'An unexpected error occurred during database import.');
      setCurrentStep('validation');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl border border-white/20 shadow-inner">
              <FileSpreadsheet className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight">
                  {t('import_title', 'Smart Swine Registry Importer')}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                  XLSX / XLS / CSV
                </span>
              </div>
              <p className="text-xs text-emerald-200/80">
                {t('import_subtitle', 'Intelligent column matching, auto-translation for Bisaya & Filipino, and custom schema expansion.')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Stepper Progress Bar */}
        <div className="bg-stone-50 border-b border-stone-200 px-6 py-3 flex items-center justify-between text-xs font-semibold shrink-0">
          <div className="flex items-center gap-6">
            <div
              className={`flex items-center gap-2 ${
                currentStep === 'upload' ? 'text-emerald-800 font-bold' : 'text-stone-400'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  currentStep === 'upload'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : file
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-stone-200 text-stone-600'
                }`}
              >
                1
              </span>
              <span>1. Upload File</span>
            </div>

            <ArrowRight className="w-3.5 h-3.5 text-stone-300" />

            <div
              className={`flex items-center gap-2 ${
                currentStep === 'mapping' ? 'text-emerald-800 font-bold' : 'text-stone-400'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  currentStep === 'mapping'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : currentStep === 'validation' || currentStep === 'completed'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-stone-200 text-stone-600'
                }`}
              >
                2
              </span>
              <span>2. Column Matching & New Fields</span>
            </div>

            <ArrowRight className="w-3.5 h-3.5 text-stone-300" />

            <div
              className={`flex items-center gap-2 ${
                currentStep === 'validation' ? 'text-emerald-800 font-bold' : 'text-stone-400'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  currentStep === 'validation'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : currentStep === 'completed'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-stone-200 text-stone-600'
                }`}
              >
                3
              </span>
              <span>3. Validate & Preview</span>
            </div>

            <ArrowRight className="w-3.5 h-3.5 text-stone-300" />

            <div
              className={`flex items-center gap-2 ${
                currentStep === 'completed' ? 'text-emerald-800 font-bold' : 'text-stone-400'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  currentStep === 'completed'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-stone-200 text-stone-600'
                }`}
              >
                4
              </span>
              <span>4. Database Commit</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleDownloadTemplate('xlsx')}
              className="px-2.5 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-300 flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
              title="Download official XLSX template with all core and custom columns"
            >
              <Download className="w-3 h-3 text-emerald-700" />
              <span>Download Excel Template</span>
            </button>
          </div>
        </div>

        {/* Modal Body Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {fileReadError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 text-xs flex items-start gap-3 animate-fadeIn">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">File Parsing Notice</p>
                <p className="text-rose-700 mt-0.5">{fileReadError}</p>
              </div>
              <button
                type="button"
                onClick={() => setFileReadError(null)}
                className="text-rose-500 hover:text-rose-800 text-xs font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* STEP 1: UPLOAD SPREADSHEET */}
          {currentStep === 'upload' && (
            <div className="space-y-6">
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50/70 p-10 rounded-3xl text-center cursor-pointer transition flex flex-col items-center justify-center gap-4 group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                />

                <div className="w-16 h-16 rounded-2xl bg-emerald-100 group-hover:bg-emerald-200 text-emerald-800 flex items-center justify-center shadow-inner transition">
                  <Upload className="w-8 h-8" />
                </div>

                <div>
                  <h3 className="text-base font-bold text-stone-900">
                    Drag and drop your spreadsheet here, or{' '}
                    <span className="text-emerald-700 underline underline-offset-2">Browse Files</span>
                  </h3>
                  <p className="text-xs text-stone-500 mt-1">
                    Supports Microsoft Excel (.xlsx, .xls) and Comma-Separated Values (.csv).
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <span className="px-3 py-1 rounded-full bg-white border border-stone-200 text-[11px] font-bold text-stone-600 shadow-2xs">
                    ✓ Automatic Header Inspection
                  </span>
                  <span className="px-3 py-1 rounded-full bg-white border border-stone-200 text-[11px] font-bold text-stone-600 shadow-2xs">
                    ✓ New Field Detection
                  </span>
                  <span className="px-3 py-1 rounded-full bg-white border border-stone-200 text-[11px] font-bold text-stone-600 shadow-2xs">
                    ✓ Multi-Language Bisaya & Tagalog
                  </span>
                </div>
              </div>

              {/* Template Recommendation Box */}
              <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Info className="w-5 h-5 text-emerald-700 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-stone-900">Need the official DA Hinunangan registry template?</h4>
                    <p className="text-[11px] text-stone-500">
                      Download a pre-formatted Excel or CSV template generated from your active registry schema, including all required indicators (*).
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleDownloadTemplate('xlsx')}
                    className="px-3 py-1.5 rounded-xl bg-white border border-stone-300 hover:bg-stone-100 text-stone-800 text-xs font-bold flex items-center gap-1.5 transition shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-700" />
                    <span>.XLSX Template</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadTemplate('csv')}
                    className="px-3 py-1.5 rounded-xl bg-white border border-stone-300 hover:bg-stone-100 text-stone-800 text-xs font-bold flex items-center gap-1.5 transition shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5 text-stone-600" />
                    <span>.CSV Template</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: COLUMN MATCHING & NEW FIELD DISCOVERY */}
          {currentStep === 'mapping' && (
            <div className="space-y-6">
              {/* Missing Fields Banner */}
              {showMissingFieldsAlert && (missingRequiredFields.length > 0 || missingOptionalFields.length > 0) && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-3 animate-fadeIn">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                      <AlertTriangle className="w-4 h-4 text-amber-700" />
                      <span>Registry Schema Column Comparison</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowMissingFieldsAlert(false)}
                      className="text-amber-700 hover:text-amber-900 text-xs cursor-pointer font-bold"
                    >
                      ✕
                    </button>
                  </div>

                  {missingRequiredFields.length > 0 && (
                    <div className="text-xs text-rose-900 bg-rose-100/60 p-3 rounded-xl border border-rose-200 space-y-1">
                      <p className="font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-700" />
                        Missing Required System Fields ({missingRequiredFields.length}):
                      </p>
                      <p className="text-[11px] text-rose-800">
                        {missingRequiredFields.map(f => f.label).join(', ')}. Please map a column to these fields or default values will be applied.
                      </p>
                    </div>
                  )}

                  {missingOptionalFields.length > 0 && (
                    <div className="text-xs text-stone-700">
                      <p className="font-semibold text-stone-800">
                        Optional unmapped fields ({missingOptionalFields.length}):
                      </p>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        {missingOptionalFields.map(f => f.label).join(', ')}. These can be left unmapped or populated later.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Column Mapping Table */}
              <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-2xs">
                <div className="p-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-stone-900 flex items-center gap-2">
                      <Columns className="w-4 h-4 text-emerald-700" />
                      Detected Columns in Spreadsheet ({mappings.length})
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      Review column matches, configure new custom fields, and customize translations for Bisaya & Filipino.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg font-bold text-[11px]">
                      {mappings.filter(m => m.matchStatus === 'matched_core').length} Core Matched
                    </span>
                    <span className="px-2.5 py-1 bg-purple-100 text-purple-800 rounded-lg font-bold text-[11px]">
                      {mappings.filter(m => m.isNewField).length} New Fields
                    </span>
                    <span className="px-2.5 py-1 bg-stone-100 text-stone-600 rounded-lg font-bold text-[11px]">
                      {mappings.filter(m => m.matchStatus === 'ignored').length} Ignored
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-stone-100">
                  {mappings.map((mapping, idx) => {
                    const isNew = mapping.isNewField;
                    const isCore = mapping.matchStatus === 'matched_core';
                    const isIgnored = mapping.matchStatus === 'ignored';

                    return (
                      <div
                        key={idx}
                        className={`p-4 transition ${
                          isNew
                            ? 'bg-purple-50/40 border-l-4 border-l-purple-500'
                            : isCore
                            ? 'bg-emerald-50/20 border-l-4 border-l-emerald-600'
                            : isIgnored
                            ? 'bg-stone-50/60 opacity-60 border-l-4 border-l-stone-300'
                            : 'bg-white border-l-4 border-l-blue-500'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          {/* File Column Header & Samples */}
                          <div className="min-w-[200px] flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-stone-900 bg-stone-100 px-2.5 py-1 rounded-lg border border-stone-200">
                                {mapping.fileHeader}
                              </span>

                              {isCore && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  ✓ Matched Core
                                </span>
                              )}

                              {mapping.matchStatus === 'matched_custom' && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-300">
                                  ✓ Matched Custom
                                </span>
                              )}

                              {isNew && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-300 animate-pulse">
                                  + New Field Detected
                                </span>
                              )}

                              {isIgnored && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-200 text-stone-600">
                                  ⊘ Ignored
                                </span>
                              )}
                            </div>

                            {/* Sample Values Preview */}
                            <p className="text-[11px] text-stone-500 mt-1 truncate max-w-md">
                              <span className="font-semibold text-stone-600">Samples: </span>
                              {mapping.sampleValues.filter(Boolean).slice(0, 3).join(', ') || '—'}
                            </p>
                          </div>

                          {/* Target Field Selector */}
                          <div className="min-w-[240px]">
                            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                              Map to Registry Field
                            </label>
                            <select
                              value={isIgnored ? '__ignore__' : mapping.targetFieldKey}
                              onChange={e => handleTargetChange(idx, e.target.value)}
                              className="w-full text-xs font-semibold bg-white border border-stone-300 rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden shadow-2xs"
                            >
                              {isNew && (
                                <option value={mapping.targetFieldKey}>
                                  + Create as New Field ({mapping.targetFieldKey})
                                </option>
                              )}
                              {availableTargetFields.map(opt => (
                                <option key={opt.key} value={opt.key}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Actions / Configure */}
                          <div className="flex items-center gap-2">
                            {isNew && (
                              <button
                                type="button"
                                onClick={() =>
                                  setEditingMappingIndex(editingMappingIndex === idx ? null : idx)
                                }
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                                  editingMappingIndex === idx
                                    ? 'bg-purple-700 text-white shadow-xs'
                                    : 'bg-purple-100 text-purple-900 hover:bg-purple-200'
                                }`}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                <span>{editingMappingIndex === idx ? 'Close Config' : 'Configure Field'}</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateMapping(idx, {
                                  matchStatus: isIgnored ? 'new_field' : 'ignored',
                                  createField: !isIgnored ? false : true,
                                })
                              }
                              className={`p-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                                isIgnored
                                  ? 'text-emerald-700 hover:bg-emerald-50'
                                  : 'text-stone-400 hover:text-stone-700 hover:bg-stone-100'
                              }`}
                              title={isIgnored ? 'Include Column' : 'Ignore Column'}
                            >
                              {isIgnored ? <Plus className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {/* Expandable New Field Configuration Panel */}
                        {isNew && editingMappingIndex === idx && (
                          <div className="mt-4 pt-4 border-t border-purple-200/60 bg-white p-4 rounded-2xl shadow-inner space-y-4 animate-fadeIn">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-purple-600" />
                                Configure New Custom Field: {mapping.fileHeader}
                              </h4>
                              <span className="text-[10px] text-purple-700 font-bold bg-purple-100 px-2 py-0.5 rounded-full">
                                Key: {mapping.targetFieldKey}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              {/* Field Key */}
                              <div>
                                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                                  Safe System Key (field_key)
                                </label>
                                <input
                                  type="text"
                                  value={mapping.targetFieldKey}
                                  onChange={e =>
                                    handleUpdateMapping(idx, {
                                      targetFieldKey: generateSafeFieldKey(e.target.value, new Set()),
                                    })
                                  }
                                  className="w-full text-xs font-mono bg-stone-50 border border-stone-300 rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                                />
                                <p className="text-[10px] text-stone-400 mt-0.5">Alphanumeric & underscores only.</p>
                              </div>

                              {/* Data Type */}
                              <div>
                                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                                  Data Type
                                </label>
                                <select
                                  value={mapping.detectedDataType}
                                  onChange={e =>
                                    handleUpdateMapping(idx, {
                                      detectedDataType: e.target.value as RegistryFieldType,
                                    })
                                  }
                                  className="w-full text-xs font-bold bg-white border border-stone-300 rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                                >
                                  <option value="text">Text (String)</option>
                                  <option value="number">Number (Integer/Decimal)</option>
                                  <option value="date">Date Picker (YYYY-MM-DD)</option>
                                  <option value="dropdown">Dropdown (Single Choice)</option>
                                  <option value="yes_no">Yes / No Toggle (Boolean)</option>
                                  <option value="textarea">Textarea (Long Paragraph)</option>
                                  <option value="phone">Phone Number (PH +63)</option>
                                </select>
                              </div>

                              {/* Target Section */}
                              <div>
                                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                                  Form Section Placement
                                </label>
                                <select
                                  value={targetSectionId}
                                  onChange={e => setTargetSectionId(e.target.value)}
                                  className="w-full text-xs font-semibold bg-white border border-stone-300 rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                                >
                                  {(formSchema.sections || []).map(s => (
                                    <option key={s.id} value={s.id}>
                                      {s.title}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {/* Multi-Language Labels (EN, CEB, FIL) */}
                            <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 space-y-2">
                              <p className="text-[11px] font-bold text-stone-800 flex items-center gap-1.5">
                                <Languages className="w-3.5 h-3.5 text-emerald-700" />
                                Multi-Language Field Display Labels
                              </p>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <div>
                                  <label className="block text-[10px] font-bold text-stone-500 uppercase">
                                    English (EN)
                                  </label>
                                  <input
                                    type="text"
                                    value={mapping.labelEn}
                                    onChange={e =>
                                      handleUpdateMapping(idx, { labelEn: e.target.value, targetFieldLabel: e.target.value })
                                    }
                                    className="w-full text-xs bg-white border border-stone-300 rounded-lg px-2.5 py-1 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[10px] font-bold text-stone-500 uppercase">
                                    Cebuano / Bisaya (CEB)
                                  </label>
                                  <input
                                    type="text"
                                    value={mapping.labelCeb}
                                    onChange={e =>
                                      handleUpdateMapping(idx, { labelCeb: e.target.value })
                                    }
                                    className="w-full text-xs bg-white border border-stone-300 rounded-lg px-2.5 py-1 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[10px] font-bold text-stone-500 uppercase">
                                    Filipino / Tagalog (FIL)
                                  </label>
                                  <input
                                    type="text"
                                    value={mapping.labelFil}
                                    onChange={e =>
                                      handleUpdateMapping(idx, { labelFil: e.target.value })
                                    }
                                    className="w-full text-xs bg-white border border-stone-300 rounded-lg px-2.5 py-1 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Dropdown Options (if applicable) */}
                            {mapping.detectedDataType === 'dropdown' && (
                              <div>
                                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                                  Dropdown Options (Comma separated)
                                </label>
                                <input
                                  type="text"
                                  value={(mapping.detectedOptions || []).join(', ')}
                                  onChange={e =>
                                    handleUpdateMapping(idx, {
                                      detectedOptions: e.target.value
                                        .split(',')
                                        .map(s => s.trim())
                                        .filter(Boolean),
                                    })
                                  }
                                  placeholder="e.g. Option 1, Option 2, Option 3"
                                  className="w-full text-xs bg-white border border-stone-300 rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                                />
                              </div>
                            )}

                            {/* Capability Toggles */}
                            <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] text-stone-700">
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={mapping.isRequired}
                                  onChange={e => handleUpdateMapping(idx, { isRequired: e.target.checked })}
                                  className="w-3.5 h-3.5 text-purple-600 rounded border-stone-300 focus:ring-purple-500"
                                />
                                <span>Required Field</span>
                              </label>

                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={mapping.searchable !== false}
                                  onChange={e => handleUpdateMapping(idx, { searchable: e.target.checked })}
                                  className="w-3.5 h-3.5 text-purple-600 rounded border-stone-300 focus:ring-purple-500"
                                />
                                <span>Searchable</span>
                              </label>

                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={mapping.filterable !== false}
                                  onChange={e => handleUpdateMapping(idx, { filterable: e.target.checked })}
                                  className="w-3.5 h-3.5 text-purple-600 rounded border-stone-300 focus:ring-purple-500"
                                />
                                <span>Filterable</span>
                              </label>

                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={mapping.sortable !== false}
                                  onChange={e => handleUpdateMapping(idx, { sortable: e.target.checked })}
                                  className="w-3.5 h-3.5 text-purple-600 rounded border-stone-300 focus:ring-purple-500"
                                />
                                <span>Sortable</span>
                              </label>

                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={mapping.exportable !== false}
                                  onChange={e => handleUpdateMapping(idx, { exportable: e.target.checked })}
                                  className="w-3.5 h-3.5 text-purple-600 rounded border-stone-300 focus:ring-purple-500"
                                />
                                <span>Exportable</span>
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: ROW VALIDATION & BATCH PREVIEW */}
          {currentStep === 'validation' && (
            <div className="space-y-6">
              {/* Validation Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-stone-50 border border-stone-200 p-3.5 rounded-2xl">
                  <p className="text-[10px] font-bold text-stone-500 uppercase">Total Rows</p>
                  <p className="text-xl font-black text-stone-900 mt-1">{validationStats.total}</p>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl">
                  <p className="text-[10px] font-bold text-emerald-700 uppercase">Valid Rows</p>
                  <p className="text-xl font-black text-emerald-900 mt-1">{validationStats.valid}</p>
                </div>

                <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl">
                  <p className="text-[10px] font-bold text-amber-700 uppercase">Warnings (Auto-fixed)</p>
                  <p className="text-xl font-black text-amber-900 mt-1">{validationStats.warnings}</p>
                </div>

                <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-2xl">
                  <p className="text-[10px] font-bold text-rose-700 uppercase">Fatal Errors</p>
                  <p className="text-xl font-black text-rose-900 mt-1">{validationStats.errors}</p>
                </div>

                <div className="bg-purple-50 border border-purple-200 p-3.5 rounded-2xl col-span-2 sm:col-span-1">
                  <p className="text-[10px] font-bold text-purple-700 uppercase">New Custom Fields</p>
                  <p className="text-xl font-black text-purple-900 mt-1">{validationStats.newFieldsCount}</p>
                </div>
              </div>

              {/* Duplicate Handling Policy Bar */}
              <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    Duplicate Pig ID Tag Resolution Policy ({validationStats.duplicates} detected)
                  </h4>
                  <p className="text-[11px] text-stone-500">
                    How should the system treat records whose Pig ID Tag already exists in the database?
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <label
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition ${
                      duplicateHandling === 'update'
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-400 ring-2 ring-emerald-300'
                        : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="dupPolicy"
                      value="update"
                      checked={duplicateHandling === 'update'}
                      onChange={() => setDuplicateHandling('update')}
                      className="hidden"
                    />
                    <span>Update / Overwrite Existing</span>
                  </label>

                  <label
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition ${
                      duplicateHandling === 'skip'
                        ? 'bg-amber-100 text-amber-900 border-amber-400 ring-2 ring-amber-300'
                        : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="dupPolicy"
                      value="skip"
                      checked={duplicateHandling === 'skip'}
                      onChange={() => setDuplicateHandling('skip')}
                      className="hidden"
                    />
                    <span>Skip Existing</span>
                  </label>

                  <label
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition ${
                      duplicateHandling === 'rename'
                        ? 'bg-blue-100 text-blue-900 border-blue-400 ring-2 ring-blue-300'
                        : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="dupPolicy"
                      value="rename"
                      checked={duplicateHandling === 'rename'}
                      onChange={() => setDuplicateHandling('rename')}
                      className="hidden"
                    />
                    <span>Auto-assign New Tag</span>
                  </label>
                </div>
              </div>

              {/* Data Preview Table with Filter Tabs */}
              <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-2xs">
                <div className="p-3 bg-stone-50 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setValidationFilter('all')}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                        validationFilter === 'all'
                          ? 'bg-stone-800 text-white shadow-xs'
                          : 'bg-white text-stone-600 hover:bg-stone-200 border border-stone-300'
                      }`}
                    >
                      All Rows ({validationResults.length})
                    </button>

                    <button
                      type="button"
                      onClick={() => setValidationFilter('valid')}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                        validationFilter === 'valid'
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300'
                      }`}
                    >
                      Valid ({validationStats.valid})
                    </button>

                    <button
                      type="button"
                      onClick={() => setValidationFilter('warnings')}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                        validationFilter === 'warnings'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-300'
                      }`}
                    >
                      Warnings ({validationStats.warnings})
                    </button>

                    <button
                      type="button"
                      onClick={() => setValidationFilter('errors')}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                        validationFilter === 'errors'
                          ? 'bg-rose-700 text-white shadow-xs'
                          : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-300'
                      }`}
                    >
                      Errors ({validationStats.errors})
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2" />
                      <input
                        type="text"
                        value={searchFilter}
                        onChange={e => setSearchFilter(e.target.value)}
                        placeholder="Search rows..."
                        className="text-xs pl-8 pr-3 py-1 bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden w-44"
                      />
                    </div>

                    {(validationStats.errors > 0 || validationStats.warnings > 0) && (
                      <button
                        type="button"
                        onClick={handleDownloadErrorReport}
                        className="px-2.5 py-1 text-[11px] font-bold text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-300 flex items-center gap-1 transition cursor-pointer"
                        title="Download spreadsheet report of all errors and warnings"
                      >
                        <Download className="w-3 h-3 text-rose-600" />
                        <span>Download Issues Log</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto max-h-80">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-stone-100 text-stone-700 font-bold border-b border-stone-200 sticky top-0 z-10">
                      <tr>
                        <th className="py-2.5 px-3">Row</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Pig ID Tag</th>
                        <th className="py-2.5 px-3">Farmer Name</th>
                        <th className="py-2.5 px-3">Barangay</th>
                        <th className="py-2.5 px-3">Birth Date / Age</th>
                        <th className="py-2.5 px-3">Weight (kg)</th>
                        <th className="py-2.5 px-3">Custom Fields</th>
                        <th className="py-2.5 px-3">Validation Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 font-medium text-stone-800">
                      {filteredValidationResults.slice(0, 100).map(res => {
                        const rec = res.mappedRecord;
                        const hasErrors = !res.isValid;
                        const hasWarnings = res.warnings.length > 0;

                        return (
                          <tr
                            key={res.rowNumber}
                            className={`hover:bg-stone-50 transition ${
                              hasErrors
                                ? 'bg-rose-50/50'
                                : hasWarnings
                                ? 'bg-amber-50/30'
                                : ''
                            }`}
                          >
                            <td className="py-2 px-3 font-mono text-[11px] text-stone-500">
                              #{res.rowNumber}
                            </td>

                            <td className="py-2 px-3">
                              {hasErrors ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-900 border border-rose-300 inline-flex items-center gap-1">
                                  <AlertTriangle className="w-2.5 h-2.5 text-rose-600" /> Error
                                </span>
                              ) : hasWarnings ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1">
                                  <AlertTriangle className="w-2.5 h-2.5 text-amber-600" /> Warning
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 inline-flex items-center gap-1">
                                  <Check className="w-2.5 h-2.5 text-emerald-700" /> Valid
                                </span>
                              )}
                            </td>

                            <td className="py-2 px-3 font-mono font-bold text-stone-900">
                              {rec.pigIdTag || '—'}
                            </td>

                            <td className="py-2 px-3 font-bold text-stone-900">
                              {rec.farmerName || <span className="text-rose-500 italic">Empty</span>}
                            </td>

                            <td className="py-2 px-3">{rec.barangay || '—'}</td>

                            <td className="py-2 px-3">
                              <span className="text-[11px]">{rec.birthDate || 'N/A'}</span>
                              {rec.ageMonths ? (
                                <span className="text-[10px] text-stone-500 ml-1.5 font-bold">
                                  ({rec.ageMonths} mo)
                                </span>
                              ) : null}
                            </td>

                            <td className="py-2 px-3 font-bold">{rec.actualWeightKg ?? rec.weightKg ?? '—'} kg</td>

                            <td className="py-2 px-3">
                              {rec.customFields && Object.keys(rec.customFields).length > 0 ? (
                                <span className="px-2 py-0.5 rounded-lg bg-purple-50 text-purple-800 border border-purple-200 text-[10px] font-bold">
                                  {Object.keys(rec.customFields).length} Custom Fields
                                </span>
                              ) : (
                                <span className="text-stone-400 italic text-[11px]">—</span>
                              )}
                            </td>

                            <td className="py-2 px-3 text-[11px] max-w-xs truncate">
                              {hasErrors ? (
                                <span className="text-rose-700 font-semibold">
                                  {res.errors.map(e => e.message).join(' ')}
                                </span>
                              ) : hasWarnings ? (
                                <span className="text-amber-700">
                                  {res.warnings.map(w => w.message).join(' ')}
                                </span>
                              ) : (
                                <span className="text-emerald-700">Ready for import</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {filteredValidationResults.length > 100 && (
                  <div className="p-2.5 bg-stone-50 text-center text-stone-500 text-[11px] border-t border-stone-200">
                    Showing first 100 rows of {filteredValidationResults.length} total rows.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: IMPORTING & PROGRESS */}
          {currentStep === 'importing' && (
            <div className="py-12 px-6 text-center space-y-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center animate-spin">
                <RefreshCw className="w-8 h-8 text-emerald-700" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-stone-900">Importing Swine Registry Data...</h3>
                <p className="text-xs text-stone-500 mt-1">{importStatusMsg}</p>
              </div>

              <div className="max-w-md mx-auto space-y-2">
                <div className="w-full bg-stone-200 rounded-full h-3 overflow-hidden shadow-inner">
                  <div
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${importProgress}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] font-bold text-stone-600">
                  <span>Progress</span>
                  <span>{importProgress}%</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: COMPLETED SUMMARY */}
          {currentStep === 'completed' && (
            <div className="py-8 px-6 text-center space-y-6 animate-fadeIn">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 shadow-lg">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-stone-900">Spreadsheet Successfully Imported!</h3>
                <p className="text-xs text-stone-500 mt-1">
                  Swine records and dynamic custom fields have been committed to the Hinunangan central database and local offline cache.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl">
                  <p className="text-[10px] font-bold text-emerald-800 uppercase">New Records Created</p>
                  <p className="text-2xl font-black text-emerald-950 mt-1">{importSummary.created}</p>
                </div>

                <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl">
                  <p className="text-[10px] font-bold text-blue-800 uppercase">Records Updated</p>
                  <p className="text-2xl font-black text-blue-950 mt-1">{importSummary.updated}</p>
                </div>

                <div className="bg-purple-50 border border-purple-200 p-4 rounded-2xl">
                  <p className="text-[10px] font-bold text-purple-800 uppercase">Custom Fields Created</p>
                  <p className="text-2xl font-black text-purple-950 mt-1">{importSummary.newFieldsCount}</p>
                </div>

                <div className="bg-stone-50 border border-stone-200 p-4 rounded-2xl">
                  <p className="text-[10px] font-bold text-stone-600 uppercase">Skipped / Failed</p>
                  <p className="text-2xl font-black text-stone-900 mt-1">{importSummary.skipped}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Navigation */}
        <div className="bg-stone-50 border-t border-stone-200 p-4 px-6 flex items-center justify-between shrink-0">
          <div>
            {currentStep !== 'upload' && currentStep !== 'completed' && currentStep !== 'importing' && (
              <button
                type="button"
                onClick={() => {
                  if (currentStep === 'mapping') setCurrentStep('upload');
                  if (currentStep === 'validation') setCurrentStep('mapping');
                }}
                className="px-4 py-2 rounded-xl bg-white border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {currentStep === 'upload' && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
            )}

            {currentStep === 'mapping' && (
              <button
                type="button"
                onClick={handleProceedToValidation}
                className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition cursor-pointer"
              >
                <span>Proceed to Data Validation</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {currentStep === 'validation' && (
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={validationStats.valid + validationStats.warnings === 0 || isImporting}
                className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-2 shadow-md transition cursor-pointer disabled:opacity-50"
              >
                <Database className="w-4 h-4" />
                <span>Commit {validationStats.valid + validationStats.warnings} Records to Database</span>
              </button>
            )}

            {currentStep === 'completed' && (
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md transition cursor-pointer"
              >
                Done & View Records
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

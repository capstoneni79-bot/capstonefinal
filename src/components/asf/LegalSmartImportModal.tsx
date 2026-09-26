import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  X,
  FileSpreadsheet,
  Image as ImageIcon,
  Layers,
  Sparkles,
  ArrowRight,
  Eye,
  RefreshCw,
  FolderTree,
  Scale,
  Shield,
  Trash2,
  Plus,
  Edit3,
  Copy,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  Clock,
  Split,
  Download,
} from 'lucide-react';
import {
  ASFRegulatoryDocument,
  LegalArticle,
  LegalArticleSection,
  LegalDocumentType,
  LegalDocumentCategory,
  LegalDocumentStatus,
  UserAccount,
} from '../../types';
import {
  LegalImportFileItem,
  LegalImportDetectionResult,
  LegalExcelSheetInfo,
} from '../../types/legalImport';
import { LegalDocumentParserService } from '../../services/legalDocumentParserService';
import { storageService } from '../../services/storageService';

interface LegalSmartImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
  onImportSuccess: (importedDocs: ASFRegulatoryDocument[]) => void;
}

export const LegalSmartImportModal: React.FC<LegalSmartImportModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onImportSuccess,
}) => {
  const [step, setStep] = useState<'upload' | 'processing' | 'review' | 'batch_summary'>('upload');
  const [files, setFiles] = useState<File[]>([]);
  const [isMultiPageScanMode, setIsMultiPageScanMode] = useState(false);
  const [processedItems, setProcessedItems] = useState<LegalImportFileItem[]>([]);
  const [activeItemIndex, setActiveItemIndex] = useState(0);

  // Processing progress state
  const [currentProgressText, setCurrentProgressText] = useState('Initializing parser...');
  const [currentProgressPercent, setCurrentProgressPercent] = useState(0);
  const [processingChecklist, setProcessingChecklist] = useState<{ label: string; done: boolean }[]>([
    { label: 'Reading file & payload...', done: false },
    { label: 'Extracting text content...', done: false },
    { label: 'Running OCR on scanned layers...', done: false },
    { label: 'Identifying document type & category...', done: false },
    { label: 'Detecting jurisdiction & series year...', done: false },
    { label: 'Detecting articles & hierarchical sections...', done: false },
    { label: 'Detecting subsections (a, b, i, ii)...', done: false },
    { label: 'Detecting penalties & setback rules...', done: false },
    { label: 'Linking statutory references (PD 856, etc.)...', done: false },
    { label: 'Checking duplicate records...', done: false },
    { label: 'Building normalized database structure...', done: false },
  ]);

  // Review & Correction state
  const [showOriginalComparison, setShowOriginalComparison] = useState(false);
  const [activeArticleTab, setActiveArticleTab] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return;
    const newFiles = Array.from(selectedFiles);
    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const startProcessing = async () => {
    if (files.length === 0) return;
    setStep('processing');
    setCurrentProgressPercent(10);
    setCurrentProgressText('Preparing documents for smart extraction...');

    const items: LegalImportFileItem[] = [];

    if (isMultiPageScanMode && files.length > 1) {
      // Treat multiple image files as ordered pages of a single document
      const fileItem = await LegalDocumentParserService.parseMultipleScanPages(
        files,
        (progressStep, pct) => {
          setCurrentProgressText(progressStep);
          setCurrentProgressPercent(pct);
          updateChecklist(pct);
        }
      );
      items.push(fileItem);
    } else {
      // Process files individually (batch support)
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setCurrentProgressText(`Processing file ${i + 1} of ${files.length}: ${file.name}`);
        const fileItem = await LegalDocumentParserService.parseFile(file, (progressStep, pct) => {
          const overallPct = Math.round(((i + pct / 100) / files.length) * 100);
          setCurrentProgressText(`[${i + 1}/${files.length}] ${progressStep}`);
          setCurrentProgressPercent(overallPct);
          updateChecklist(overallPct);
        });
        items.push(fileItem);
      }
    }

    // Mark all checklist items as done
    setProcessingChecklist(prev => prev.map(item => ({ ...item, done: true })));
    setCurrentProgressPercent(100);
    setCurrentProgressText('Smart extraction completed successfully!');

    setProcessedItems(items);
    setActiveItemIndex(0);

    setTimeout(() => {
      setStep('review');
    }, 600);
  };

  const updateChecklist = (pct: number) => {
    setProcessingChecklist(prev =>
      prev.map((item, idx) => {
        const threshold = (idx / prev.length) * 100;
        return {
          ...item,
          done: pct >= threshold,
        };
      })
    );
  };

  const activeItem = processedItems[activeItemIndex];
  const activeDetection = activeItem?.detection;

  // Handler for metadata edits in review step
  const updateActiveDetection = (updates: Partial<LegalImportDetectionResult>) => {
    if (!activeItem || !activeDetection) return;
    const updatedDetection: LegalImportDetectionResult = {
      ...activeDetection,
      ...updates,
    };
    
    // Update classification path dynamically
    updatedDetection.classificationPath = [
      'Legal Documents',
      updatedDetection.docTypeName + 's',
      updatedDetection.jurisdictionLevel,
      updatedDetection.jurisdictionLevel === 'Municipal' ? 'Hinunangan' : updatedDetection.jurisdictionLevel === 'Provincial' ? 'Southern Leyte' : 'National',
      updatedDetection.seriesYear,
      `${updatedDetection.docTypeName} No. ${updatedDetection.officialNumber}`,
    ];

    const updatedItems = [...processedItems];
    updatedItems[activeItemIndex] = {
      ...activeItem,
      detection: updatedDetection,
    };
    setProcessedItems(updatedItems);
  };

  // Section editing inside active item
  const updateSection = (articleIndex: number, sectionIndex: number, updates: Partial<LegalArticleSection>) => {
    if (!activeDetection) return;
    const newArticles = [...activeDetection.articles];
    const targetArticle = { ...newArticles[articleIndex] };
    const targetSection = { ...targetArticle.sections[sectionIndex], ...updates };
    targetArticle.sections[sectionIndex] = targetSection;
    newArticles[articleIndex] = targetArticle;

    updateActiveDetection({ articles: newArticles });
  };

  // Add new section to an article
  const addNewSection = (articleIndex: number) => {
    if (!activeDetection) return;
    const newArticles = [...activeDetection.articles];
    const targetArticle = { ...newArticles[articleIndex] };
    const nextSecNum = targetArticle.sections.length + 1;
    targetArticle.sections.push({
      id: `sec-${Date.now()}-${nextSecNum}`,
      sectionNumber: `Section ${nextSecNum}`,
      sectionTitle: 'New Section Title',
      content: 'Enter legal section body text...',
      scannedPageRef: 1,
    });
    newArticles[articleIndex] = targetArticle;
    updateActiveDetection({ articles: newArticles });
  };

  // Confirm and persist imported documents to database
  const handleConfirmAndSave = () => {
    const importedDocs: ASFRegulatoryDocument[] = [];
    const performerName = currentUser?.fullName || currentUser?.username || 'Admin';

    processedItems.forEach(item => {
      if (item.detection) {
        const doc = LegalDocumentParserService.convertDetectionToDocument(
          item.detection,
          item,
          performerName
        );

        if (item.detection.isDuplicate && item.detection.duplicateAction === 'overwrite') {
          storageService.updateAsfRegulation(doc, performerName, 'Overwritten via Smart Import');
        } else if (item.detection.isDuplicate && item.detection.duplicateAction === 'new_version') {
          storageService.updateAsfRegulation(doc, performerName, `Updated to Version ${(doc.versionHistory?.length || 1)} via Smart Import`);
        } else {
          storageService.addAsfRegulation(doc, performerName);
        }

        // Record in Import History log
        storageService.addLegalImportHistory({
          id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          fileName: item.name,
          fileType: item.extension.toUpperCase(),
          fileSize: item.sizeFormatted,
          documentTitle: doc.title,
          documentNumber: doc.officialNumber,
          documentType: item.detection.docTypeName,
          category: doc.category || 'ordinance',
          jurisdiction: doc.jurisdiction || 'Hinunangan',
          importedAt: new Date().toISOString(),
          importedBy: performerName,
          status: 'Successful',
          sectionsDetected: item.detection.totalSectionsCount,
          articlesDetected: item.detection.articles.length,
          documentId: doc.id,
          notes: `Smart Imported with ${item.detection.totalSectionsCount} sections and ${item.detection.referencedLaws.length} references.`,
        });

        importedDocs.push(doc);
      }
    });

    onImportSuccess(importedDocs);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/30">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Smart Legal Document Import System</h2>
              <p className="text-xs text-emerald-200/90">
                AI & OCR Powered Recognition, Automatic Hierarchy & Classification Engine
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* STEP 1: UPLOAD WIZARD */}
          {step === 'upload' && (
            <div className="space-y-6">
              <div
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  e.preventDefault();
                  handleFileSelect(e.dataTransfer.files);
                }}
                onClick={() => fileInputRef.current?.click()}
                className="group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/40 p-8 text-center transition-all hover:border-emerald-500 hover:bg-emerald-50/80"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={e => handleFileSelect(e.target.files)}
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.rtf,.odt,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.tiff,.webp"
                  className="hidden"
                />
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg group-hover:scale-105 transition-transform">
                  <Upload className="h-8 w-8" />
                </div>
                <h3 className="text-base font-bold text-slate-800">
                  Drop Legal Documents Here, or <span className="text-emerald-700 underline">Browse Files</span>
                </h3>
                <p className="mt-1 text-xs text-slate-500 max-w-lg">
                  Supported formats: PDF, Word (DOC/DOCX), Excel / Spreadsheet (XLS/XLSX/CSV), Text (TXT/RTF/ODT), and Scanned Images (JPG/PNG/TIFF/WEBP) with Automatic OCR.
                </p>

                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-200">
                    <FileText className="h-3.5 w-3.5" /> PDF & DOCX
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                    <FileSpreadsheet className="h-3.5 w-3.5" /> Multi-Sheet XLSX / CSV
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
                    <ImageIcon className="h-3.5 w-3.5" /> High-Res Scanned Images & OCR
                  </span>
                </div>
              </div>

              {/* Multi-page Scan Mode Toggle */}
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4 border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-100 text-teal-700">
                    <Layers className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-800">Multi-Page Scanned Document Mode</div>
                    <div className="text-xs text-slate-500">
                      Combine multiple image files as ordered pages of a single Ordinance/Resolution rather than separate files.
                    </div>
                  </div>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={isMultiPageScanMode}
                    onChange={e => setIsMultiPageScanMode(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="peer h-6 w-11 rounded-full bg-slate-300 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-emerald-600 peer-checked:after:translate-x-full"></div>
                </label>
              </div>

              {/* Selected Files List */}
              {files.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-800">
                      Selected Documents ({files.length})
                    </h4>
                    <button
                      onClick={() => setFiles([])}
                      className="text-xs font-medium text-red-600 hover:underline"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                    {files.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-xs"
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 font-bold text-xs uppercase">
                            {file.name.split('.').pop()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-medium text-slate-800">{file.name}</p>
                            <p className="text-[10px] text-slate-400">
                              {LegalDocumentParserService.formatFileSize(file.size)}
                              {isMultiPageScanMode ? ` • Page ${idx + 1}` : ''}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFile(idx)}
                          className="rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: PROCESSING & REAL-TIME CHECKLIST */}
          {step === 'processing' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-6">
              <div className="relative flex h-20 w-20 items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-emerald-200 animate-pulse"></div>
                <div className="absolute inset-0 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin"></div>
                <Sparkles className="h-8 w-8 text-emerald-700" />
              </div>

              <div className="text-center">
                <h3 className="text-lg font-bold text-slate-800">Smart Recognition In Progress</h3>
                <p className="text-xs text-slate-500 mt-1">{currentProgressText}</p>
                <div className="mt-3 h-2 w-64 rounded-full bg-slate-100 overflow-hidden mx-auto">
                  <div
                    className="h-full bg-emerald-600 transition-all duration-300"
                    style={{ width: `${currentProgressPercent}%` }}
                  ></div>
                </div>
              </div>

              <div className="w-full max-w-md rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Smart Import Pipeline
                </div>
                {processingChecklist.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1">
                    <span className={item.done ? 'text-slate-800 font-medium' : 'text-slate-400'}>
                      {item.label}
                    </span>
                    {item.done ? (
                      <span className="flex items-center gap-1 text-emerald-600 font-bold">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Done
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">pending</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: REVIEW & CORRECTION WIZARD */}
          {step === 'review' && activeItem && activeDetection && (
            <div className="space-y-6">
              {/* Top Document Selector if multiple files */}
              {processedItems.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-500 uppercase shrink-0">Documents:</span>
                  {processedItems.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveItemIndex(idx)}
                      className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                        activeItemIndex === idx
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <span>{item.detection?.officialNumber || item.name}</span>
                      {item.detection?.isDuplicate && (
                        <span className="rounded bg-amber-400 px-1 py-0.2 text-[9px] text-slate-900 font-bold">
                          Dup
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Duplicate Alert Banner */}
              {activeDetection.isDuplicate && (
                <div className="rounded-xl border border-amber-300 bg-amber-50/90 p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-amber-900">
                        Existing Document Detected in Registry
                      </h4>
                      <p className="text-xs text-amber-800 mt-0.5">
                        Document <strong>{activeDetection.docTypeName} No. {activeDetection.officialNumber}</strong> already exists: <em>"{activeDetection.duplicateDocTitle}"</em>.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <label className="flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-slate-800 border border-amber-200 cursor-pointer">
                          <input
                            type="radio"
                            name="duplicateAction"
                            checked={activeDetection.duplicateAction === 'new_version'}
                            onChange={() => updateActiveDetection({ duplicateAction: 'new_version' })}
                          />
                          <span>Save as New Version (Preserve History)</span>
                        </label>
                        <label className="flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-slate-800 border border-amber-200 cursor-pointer">
                          <input
                            type="radio"
                            name="duplicateAction"
                            checked={activeDetection.duplicateAction === 'overwrite'}
                            onChange={() => updateActiveDetection({ duplicateAction: 'overwrite' })}
                          />
                          <span>Update / Overwrite Existing Record</span>
                        </label>
                        <label className="flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-slate-800 border border-amber-200 cursor-pointer">
                          <input
                            type="radio"
                            name="duplicateAction"
                            checked={activeDetection.duplicateAction === 'new_document'}
                            onChange={() => updateActiveDetection({ duplicateAction: 'new_document' })}
                          />
                          <span>Save as Distinct New Record</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Classification Path ("Asa Nabelog" Hierarchy) */}
              <div className="rounded-xl bg-slate-900 text-white p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    <FolderTree className="h-4 w-4" />
                    "Asa Nabelog" / Automatic Legal Classification Path
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/30">
                    Smart Route Verified
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
                  {activeDetection.classificationPath.map((segment, sIdx) => (
                    <React.Fragment key={sIdx}>
                      <span className="rounded bg-slate-800 px-2 py-1 text-slate-200 border border-slate-700">
                        {segment}
                      </span>
                      {sIdx < activeDetection.classificationPath.length - 1 && (
                        <span className="text-emerald-400 font-bold">/</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-800">
                  Review & Edit Detected Legal Metadata
                </h3>
                <button
                  onClick={() => setShowOriginalComparison(prev => !prev)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold border transition-colors ${
                    showOriginalComparison
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Split className="h-4 w-4" />
                  {showOriginalComparison ? 'Hide Original Comparison' : 'Compare with Original Document'}
                </button>
              </div>

              {/* Grid with metadata and side-by-side view */}
              <div className={`grid gap-6 ${showOriginalComparison ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
                
                {/* Left / Main: Editable Metadata & Structure */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                    
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Document Type</label>
                      <select
                        value={activeDetection.docType}
                        onChange={e => {
                          const val = e.target.value as LegalDocumentType;
                          let name = 'Municipal Ordinance';
                          if (val === 'provincial_ordinance') name = 'Provincial Ordinance';
                          if (val === 'resolution') name = 'Resolution';
                          if (val === 'administrative_order') name = 'Administrative Order';
                          if (val === 'municipal_eo') name = 'Executive Order';
                          if (val === 'memorandum') name = 'Memorandum Circular';
                          if (val === 'republic_act') name = 'Republic Act';
                          if (val === 'proclamation') name = 'Proclamation';
                          if (val === 'department_order') name = 'Department Order';
                          if (val === 'other') name = 'Other Legal Document';
                          updateActiveDetection({ docType: val, docTypeName: name });
                        }}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 focus:border-emerald-500 focus:outline-none"
                      >
                        <option value="municipal_ordinance">Municipal Ordinance</option>
                        <option value="provincial_ordinance">Provincial Ordinance</option>
                        <option value="resolution">Resolution</option>
                        <option value="municipal_eo">Executive Order</option>
                        <option value="memorandum">Memorandum Circular</option>
                        <option value="administrative_order">Administrative Order</option>
                        <option value="proclamation">Proclamation</option>
                        <option value="republic_act">Republic Act</option>
                        <option value="department_order">Department Order</option>
                        <option value="other">Other Legal Document</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Official Number</label>
                      <input
                        type="text"
                        value={activeDetection.officialNumber}
                        onChange={e => updateActiveDetection({ officialNumber: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Series / Year</label>
                      <input
                        type="text"
                        value={activeDetection.seriesYear}
                        onChange={e => updateActiveDetection({ seriesYear: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Jurisdiction Level</label>
                      <select
                        value={activeDetection.jurisdictionLevel}
                        onChange={e => updateActiveDetection({ jurisdictionLevel: e.target.value as any })}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 focus:border-emerald-500 focus:outline-none"
                      >
                        <option value="Municipal">Municipal (Hinunangan)</option>
                        <option value="Provincial">Provincial (Southern Leyte)</option>
                        <option value="Regional">Regional (Region VIII)</option>
                        <option value="National">National (DA-BAI / Republic)</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2 md:col-span-4">
                      <label className="block text-xs font-bold text-slate-600 mb-1">Official Title</label>
                      <textarea
                        rows={2}
                        value={activeDetection.title}
                        onChange={e => updateActiveDetection({ title: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-600 mb-1">Author / Sponsor</label>
                      <input
                        type="text"
                        value={activeDetection.author || ''}
                        onChange={e => updateActiveDetection({ author: e.target.value })}
                        placeholder="e.g. Hon. Gezar S. Ngoho"
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Date Enacted</label>
                      <input
                        type="date"
                        value={activeDetection.dateEnacted || ''}
                        onChange={e => updateActiveDetection({ dateEnacted: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Legal Status</label>
                      <select
                        value={activeDetection.status}
                        onChange={e => updateActiveDetection({ status: e.target.value as LegalDocumentStatus })}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 focus:border-emerald-500 focus:outline-none"
                      >
                        <option value="active">Active & Enacted</option>
                        <option value="draft">Draft / Under Review</option>
                        <option value="repealed">Repealed</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>

                  </div>

                  {/* Detected Articles & Structured Sections */}
                  <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
                    <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                          Detected Articles ({activeDetection.articles.length}) & Sections ({activeDetection.totalSectionsCount})
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Each section is mapped into a separate queryable database record.
                        </p>
                      </div>
                    </div>

                    <div className="divide-y divide-slate-200 max-h-96 overflow-y-auto p-4 space-y-4">
                      {activeDetection.articles.map((art, aIdx) => (
                        <div key={art.id || aIdx} className="space-y-3">
                          <div className="flex items-center justify-between bg-emerald-50/80 px-3 py-2 rounded-lg border border-emerald-200/70">
                            <span className="text-xs font-bold text-emerald-900">
                              {art.articleNumber}: {art.articleTitle}
                            </span>
                            <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-semibold">
                              {art.sections.length} Section{art.sections.length > 1 ? 's' : ''}
                            </span>
                          </div>

                          <div className="space-y-2 pl-2">
                            {art.sections.map((sec, sIdx) => (
                              <div
                                key={sec.id || sIdx}
                                className="rounded-lg border border-slate-200 bg-white p-3 space-y-2 text-xs hover:border-slate-300"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <input
                                    type="text"
                                    value={sec.sectionNumber}
                                    onChange={e => updateSection(aIdx, sIdx, { sectionNumber: e.target.value })}
                                    className="w-28 font-bold text-slate-900 border-b border-dashed border-slate-300 focus:outline-none"
                                  />
                                  <input
                                    type="text"
                                    value={sec.sectionTitle}
                                    onChange={e => updateSection(aIdx, sIdx, { sectionTitle: e.target.value })}
                                    className="flex-1 font-semibold text-slate-700 border-b border-dashed border-slate-300 focus:outline-none"
                                    placeholder="Section Title"
                                  />
                                  <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                                    Page {sec.scannedPageRef || 1}
                                  </span>
                                </div>
                                <textarea
                                  rows={2}
                                  value={sec.content}
                                  onChange={e => updateSection(aIdx, sIdx, { content: e.target.value })}
                                  className="w-full rounded border border-slate-200 p-2 text-xs text-slate-600 focus:border-emerald-500 focus:outline-none"
                                />
                              </div>
                            ))}

                            <button
                              onClick={() => addNewSection(aIdx)}
                              className="flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900 px-2 py-1 rounded hover:bg-emerald-50 transition-colors"
                            >
                              <Plus className="h-3.5 w-3.5" /> Add Section to {art.articleNumber}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Detected Statutory References */}
                  {activeDetection.referencedLaws.length > 0 && (
                    <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4">
                      <div className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2">
                        Referenced Legal Decrees & Statutes ({activeDetection.referencedLaws.length})
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {activeDetection.referencedLaws.map((ref, rIdx) => (
                          <span
                            key={rIdx}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-blue-800 border border-blue-200 shadow-xs"
                          >
                            <Scale className="h-3.5 w-3.5 text-blue-600" />
                            {ref.title}
                            {ref.existsInSystem ? (
                              <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded font-bold">
                                Linked
                              </span>
                            ) : (
                              <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                                External
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                </div>

                {/* Right: Compare with Original Document / Raw OCR View */}
                {showOriginalComparison && (
                  <div className="flex flex-col rounded-xl border border-slate-300 bg-slate-900 text-slate-100 overflow-hidden">
                    <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-4 py-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                        <Eye className="h-4 w-4 text-emerald-400" />
                        Original Upload & OCR Source Stream
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {activeItem.pageCount || 1} Page(s) • {activeItem.sizeFormatted}
                      </span>
                    </div>

                    <div className="flex-1 p-4 overflow-y-auto max-h-[600px] space-y-4 font-mono text-xs">
                      {activeItem.fileData && activeItem.extension.match(/(jpg|jpeg|png|webp)/i) && (
                        <div className="rounded-lg border border-slate-700 overflow-hidden bg-slate-950 p-2">
                          <img
                            src={activeItem.fileData}
                            alt="Scanned original"
                            className="max-h-64 w-auto mx-auto object-contain rounded"
                          />
                        </div>
                      )}
                      
                      <div className="rounded-lg bg-slate-950 p-3 text-slate-300 whitespace-pre-wrap leading-relaxed border border-slate-800">
                        {activeItem.rawText || 'No raw text available.'}
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
          {step === 'upload' && (
            <>
              <button
                onClick={onClose}
                className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={startProcessing}
                disabled={files.length === 0}
                className="flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <span>Process & Recognize ({files.length})</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </>
          )}

          {step === 'review' && (
            <>
              <button
                onClick={() => setStep('upload')}
                className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Back to Upload
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAndSave}
                  className="flex items-center gap-2 rounded-xl bg-emerald-700 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-800 transition-all"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Confirm & Save to Legal Registry</span>
                </button>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
};

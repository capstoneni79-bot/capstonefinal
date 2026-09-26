import React, { useState, useRef, useMemo } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Image,
  Upload,
  Sparkles,
  Check,
  X,
  Sliders,
  Eye,
  SlidersHorizontal,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  Layers,
  Printer,
  Download,
  PenTool,
  Building2,
  FileCheck,
  Save,
  RotateCcw,
  Search,
  Filter,
} from 'lucide-react';
import {
  CertificateDynamicSignatory,
  CertificateLogoItem,
  CertificateLogoPosition,
  CertificateLogoType,
  CertificateTemplate,
  CertificateWatermarkConfig,
} from '../../types';
import { HINUNANGAN_BARANGAYS } from '../../data/barangays';
import { DOCUMENT_TYPE_OPTIONS, INITIAL_CERTIFICATE_TEMPLATES } from '../../data/certificateTemplates';
import { AVAILABLE_PLACEHOLDERS } from '../../utils/templateReplacer';
import { DynamicCertificateView } from './DynamicCertificateView';
import { storageService } from '../../services/storageService';

interface CertificateTemplateEditorProps {
  initialTemplate?: CertificateTemplate;
  onSave: (savedTemplate: CertificateTemplate) => void;
  onClose?: () => void;
  isModal?: boolean;
}

export const CertificateTemplateEditor: React.FC<CertificateTemplateEditorProps> = ({
  initialTemplate,
  onSave,
  onClose,
  isModal = false,
}) => {
  // Load templates from storage for search & selection
  const [availableTemplates, setAvailableTemplates] = useState<CertificateTemplate[]>(() => {
    return storageService.getCertificateTemplates();
  });

  // Selected template state
  const defaultTpl = initialTemplate || availableTemplates[0] || INITIAL_CERTIFICATE_TEMPLATES[0];
  const [template, setTemplate] = useState<CertificateTemplate>(() => JSON.parse(JSON.stringify(defaultTpl)));
  const [activeSection, setActiveSection] = useState<
    'info' | 'header_logos' | 'body' | 'signatories' | 'watermark' | 'receipt'
  >('header_logos');
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  // Search & Filters for Template Switcher
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBarangayFilter, setSelectedBarangayFilter] = useState('all');
  const [selectedDocTypeFilter, setSelectedDocTypeFilter] = useState('all');
  const [selectedLanguageFilter, setSelectedLanguageFilter] = useState('all');

  // Change Logo Modal / State
  const [changingLogoId, setChangingLogoId] = useState<string | null>(null);
  const [isAddLogoModalOpen, setIsAddLogoModalOpen] = useState(false);

  // New Logo Form State
  const [newLogoType, setNewLogoType] = useState<CertificateLogoType>('barangay');
  const [newLogoPosition, setNewLogoPosition] = useState<CertificateLogoPosition>('left');
  const [newLogoBarangay, setNewLogoBarangay] = useState<string>('Nava');
  const [newLogoSize, setNewLogoSize] = useState<number>(70);
  const [newLogoCustomUrl, setNewLogoCustomUrl] = useState<string>('');

  const printRef = useRef<HTMLDivElement>(null);

  // Sample data context for live preview rendering
  const sampleDataContext = {
    resident_name: 'HON. JUAN DELA CRUZ',
    farmer_name: 'HON. JUAN DELA CRUZ',
    barangay: template.barangay === 'All' ? 'Nava' : template.barangay,
    municipality: 'Hinunangan',
    province: 'Southern Leyte',
    number_of_pigs: '7',
    heads: '7',
    buyer_name: 'JOVELYN PADOLLO / JJR HOG TRADING',
    buyer_address: 'Barangay Colawen, Pastrana, Leyte',
    destination: 'Pastrana, Leyte',
    purpose: 'commercial livestock trade and legal transit clearance',
    date_issued: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    or_number: template.receipt?.orNumber || '1675127',
    price_per_kilo: '₱170.00 / kilo liveweight',
    amount_paid: template.receipt?.amountPaid || '100.00',
    animal_type: 'market hogs (Landrace/Large White Cross)',
    association_name: 'NUEVA ESPERANZA SLP ASS.',
    farmer_age_civil_status: 'hingkod ang panu-igon',
    swine_age: 'TULO ( 3 ) ka Buwan',
    female_count: '4',
    male_count: '3',
    color_description: 'Assorted (White / Landrace Cross)',
    issued_at: `Barangay ${template.barangay === 'All' ? 'Nava' : template.barangay}, Hinunangan, Southern Leyte`,
  };

  // Filtered list of templates
  const filteredTemplates = useMemo(() => {
    return availableTemplates.filter(tpl => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        tpl.name.toLowerCase().includes(q) ||
        tpl.barangay.toLowerCase().includes(q) ||
        tpl.documentType.toLowerCase().includes(q) ||
        tpl.language.toLowerCase().includes(q) ||
        tpl.documentTitle.toLowerCase().includes(q);

      const matchesBarangay =
        selectedBarangayFilter === 'all' ||
        tpl.barangay.toLowerCase() === selectedBarangayFilter.toLowerCase() ||
        tpl.barangay === 'All';

      const matchesDocType =
        selectedDocTypeFilter === 'all' ||
        tpl.documentType.toLowerCase() === selectedDocTypeFilter.toLowerCase();

      const matchesLanguage =
        selectedLanguageFilter === 'all' ||
        tpl.language.toLowerCase() === selectedLanguageFilter.toLowerCase();

      return matchesSearch && matchesBarangay && matchesDocType && matchesLanguage;
    });
  }, [availableTemplates, searchQuery, selectedBarangayFilter, selectedDocTypeFilter, selectedLanguageFilter]);

  // Load a preset or chosen template
  const handleSelectTemplate = (targetTemplate: CertificateTemplate) => {
    setTemplate(JSON.parse(JSON.stringify(targetTemplate)));
    setSaveNotice(`Switched to template: "${targetTemplate.name}"`);
    setTimeout(() => setSaveNotice(null), 2500);
  };

  // Create a brand new template
  const handleCreateNewTemplate = () => {
    const newTpl: CertificateTemplate = {
      id: `tpl-custom-${Date.now()}`,
      name: `Custom Certificate Format (${template.barangay || 'General'})`,
      barangay: template.barangay || 'All',
      documentType: 'Barangay Certification',
      documentTitle: 'BARANGAY CERTIFICATION',
      titleFont: 'serif_bold',
      language: 'english',
      pageSize: 'Folio',
      orientation: 'portrait',
      header: {
        countryText: 'Republic of the Philippines',
        provinceText: 'PROVINCE OF SOUTHERN LEYTE',
        municipalityText: 'Municipality of Hinunangan',
        barangayText: `BARANGAY ${(template.barangay === 'All' ? 'NAVA' : template.barangay).toUpperCase()}`,
        officeTitle: 'OFFICE OF THE PUNONG BARANGAY',
        contactEmail: 'agri.hinunangan@gmail.com',
        borderStyle: 'single',
      },
      logos: [
        {
          id: `logo-1-${Date.now()}`,
          type: 'barangay',
          position: 'left',
          barangayName: template.barangay === 'All' ? 'NAVA' : template.barangay,
          widthPx: 70,
          heightPx: 70,
          order: 1,
          visible: true,
        },
        {
          id: `logo-2-${Date.now()}`,
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
        opacity: 0.12,
        position: 'center',
        size: 'large',
      },
      bodyTemplate: `TO WHOM IT MAY CONCERN:

THIS IS TO CERTIFY that {{resident_name}} is a bonafide resident of Barangay {{barangay}}, Hinunangan, Southern Leyte.

THIS CERTIFIES FURTHER that {{resident_name}} is the legal owner of {{number_of_pigs}} head(s) of swine sold to {{buyer_name}} of {{destination}}.

THIS CERTIFICATION is being issued upon request of the above-named party for legal transit and official documentation.

Issued this {{date_issued}} at Barangay {{barangay}}, Hinunangan, Southern Leyte, Philippines.`,
      signatories: [
        {
          id: `sig-1-${Date.now()}`,
          name: 'HON. VICENTE T. MADRONERO JR.',
          position: 'PUNONG BARANGAY',
          prefix: '',
          showSignatureImage: false,
          showSignatureLine: true,
          lineWidth: '220px',
          lineAlignment: 'center',
          order: 1,
          alignment: 'center',
        },
        {
          id: `sig-2-${Date.now()}`,
          name: 'RANDY N. BURLAZA, BBO',
          position: 'BARANGAY BIOSECURITY OFFICER',
          prefix: '',
          showSignatureImage: false,
          showSignatureLine: true,
          lineWidth: '220px',
          lineAlignment: 'center',
          order: 2,
          alignment: 'center',
        },
      ],
      receipt: {
        showReceiptBox: true,
        formatStyle: 'nava',
        orNumber: '1675127',
        amountPaid: '100.00',
      },
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedList = [newTpl, ...availableTemplates];
    setAvailableTemplates(updatedList);
    setTemplate(newTpl);
    storageService.saveCertificateTemplate(newTpl);
    setSaveNotice('Created new template! Edit parameters below.');
    setTimeout(() => setSaveNotice(null), 3000);
  };

  // ==========================================
  // 1. LOGOS HANDLERS
  // ==========================================
  const handleOpenAddLogo = () => {
    setNewLogoType('barangay');
    setNewLogoPosition('left');
    setNewLogoBarangay(template.barangay === 'All' ? 'NAVA' : template.barangay);
    setNewLogoSize(70);
    setNewLogoCustomUrl('');
    setIsAddLogoModalOpen(true);
  };

  const handleSaveNewLogo = () => {
    const newLogo: CertificateLogoItem = {
      id: `logo-${Date.now()}`,
      type: newLogoType,
      position: newLogoPosition,
      barangayName: newLogoType === 'barangay' ? newLogoBarangay : undefined,
      customUrl: newLogoType === 'custom' ? newLogoCustomUrl : undefined,
      widthPx: newLogoSize,
      heightPx: newLogoSize,
      order: (template.logos?.length || 0) + 1,
      visible: true,
    };

    setTemplate(prev => ({
      ...prev,
      logos: [...(prev.logos || []), newLogo],
    }));
    setIsAddLogoModalOpen(false);
  };

  const handleUpdateLogo = (id: string, updates: Partial<CertificateLogoItem>) => {
    setTemplate(prev => ({
      ...prev,
      logos: (prev.logos || []).map(l => (l.id === id ? { ...l, ...updates } : l)),
    }));
  };

  const handleRemoveLogo = (id: string) => {
    setTemplate(prev => ({
      ...prev,
      logos: (prev.logos || []).filter(l => l.id !== id),
    }));
  };

  const handleMoveLogo = (index: number, direction: 'up' | 'down') => {
    const list = [...(template.logos || [])];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;
    list.forEach((item, idx) => {
      item.order = idx + 1;
    });
    setTemplate(prev => ({ ...prev, logos: list }));
  };

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>, logoId?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      if (logoId) {
        handleUpdateLogo(logoId, { type: 'custom', customUrl: url });
      } else {
        setNewLogoCustomUrl(url);
        setNewLogoType('custom');
      }
    };
    reader.readAsDataURL(file);
  };

  // ==========================================
  // 2. SIGNATORIES HANDLERS
  // ==========================================
  const handleAddSignatory = () => {
    const newCount = (template.signatories?.length || 0) + 1;
    const newSignatory: CertificateDynamicSignatory = {
      id: `sig-${Date.now()}`,
      name: 'HON. OFFICIAL NAME',
      position: 'OFFICIAL POSITION / DESIGNATION',
      prefix: '',
      showSignatureImage: false,
      showSignatureLine: true,
      lineWidth: '220px',
      lineAlignment: 'center',
      signatureWidth: '130px',
      signaturePosition: 'above_line',
      order: newCount,
      alignment: 'center',
    };
    setTemplate(prev => ({
      ...prev,
      signatories: [...(prev.signatories || []), newSignatory],
    }));
  };

  const handleUpdateSignatory = (id: string, updates: Partial<CertificateDynamicSignatory>) => {
    setTemplate(prev => ({
      ...prev,
      signatories: (prev.signatories || []).map(s => (s.id === id ? { ...s, ...updates } : s)),
    }));
  };

  const handleRemoveSignatory = (id: string) => {
    setTemplate(prev => ({
      ...prev,
      signatories: (prev.signatories || []).filter(s => s.id !== id),
    }));
  };

  const handleMoveSignatory = (index: number, direction: 'up' | 'down') => {
    const list = [...(template.signatories || [])];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;
    list.forEach((item, idx) => {
      item.order = idx + 1;
    });
    setTemplate(prev => ({ ...prev, signatories: list }));
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>, sigId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      handleUpdateSignatory(sigId, {
        signatureImageUrl: reader.result as string,
        showSignatureImage: true,
      });
    };
    reader.readAsDataURL(file);
  };

  // ==========================================
  // 3. WATERMARK HANDLER
  // ==========================================
  const handleWatermarkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setTemplate(prev => ({
        ...prev,
        watermark: {
          ...prev.watermark,
          type: 'custom',
          customUrl: reader.result as string,
          enabled: true,
        },
      }));
    };
    reader.readAsDataURL(file);
  };

  // Insert placeholder into body textarea
  const handleInsertPlaceholder = (placeholderKey: string) => {
    setTemplate(prev => ({
      ...prev,
      bodyTemplate: `${prev.bodyTemplate} ${placeholderKey}`,
    }));
  };

  // Save template
  const handleSave = () => {
    const updated = {
      ...template,
      updatedAt: new Date().toISOString(),
    };
    storageService.saveCertificateTemplate(updated);
    // Refresh available templates list
    setAvailableTemplates(storageService.getCertificateTemplates());
    onSave(updated);
    setSaveNotice('Template saved successfully!');
    setTimeout(() => setSaveNotice(null), 3000);
  };

  // Print document
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white text-slate-900 rounded-2xl shadow-xl border border-stone-200 overflow-hidden">
      {/* Toast Notification */}
      {saveNotice && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-emerald-500/50 animate-in fade-in slide-in-from-top-2 duration-200">
          <Check className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{saveNotice}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-white">Certificate Template & Layout Customizer</h2>
            <p className="text-xs text-slate-400">
              Configure dynamic seals, horizontal signature lines, body paragraphs, and watermark per Barangay
            </p>
          </div>
        </div>

        {/* Action buttons (Clean standard buttons) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Template</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Print Document</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
              title="Close Editor"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* FORMAT TEMPLATES SEARCH & FILTER BAR */}
      <div className="bg-slate-800 text-slate-200 px-6 py-3 border-b border-slate-700 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search templates by name, barangay, type, language..."
              className="w-full pl-9 pr-8 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-semibold text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Barangay Filter */}
            <select
              value={selectedBarangayFilter}
              onChange={e => setSelectedBarangayFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">All Barangays</option>
              {HINUNANGAN_BARANGAYS.map(b => (
                <option key={b.code} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>

            {/* Document Type Filter */}
            <select
              value={selectedDocTypeFilter}
              onChange={e => setSelectedDocTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">All Document Types</option>
              {DOCUMENT_TYPE_OPTIONS.map(opt => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>

            {/* Language Filter */}
            <select
              value={selectedLanguageFilter}
              onChange={e => setSelectedLanguageFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">All Languages</option>
              <option value="english">English</option>
              <option value="bisaya">Bisaya Dialect</option>
              <option value="filipino">Filipino</option>
            </select>

            {/* Create New Template Button */}
            <button
              type="button"
              onClick={handleCreateNewTemplate}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ New Template</span>
            </button>
          </div>
        </div>

        {/* Template Quick Selection Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 overflow-x-auto">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider shrink-0 mr-1">
            TEMPLATES ({filteredTemplates.length}):
          </span>
          {filteredTemplates.map(tpl => (
            <button
              key={tpl.id}
              type="button"
              onClick={() => handleSelectTemplate(tpl)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer border shrink-0 ${
                template.id === tpl.id
                  ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                  : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <span>{tpl.name}</span>
            </button>
          ))}
          {filteredTemplates.length === 0 && (
            <span className="text-xs text-slate-400 italic">No templates matching &ldquo;{searchQuery}&rdquo;</span>
          )}
        </div>
      </div>

      {/* Main 2-Column Workspace (Left: Sections, Right: Live Certificate Preview) */}
      <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-100/70">
        {/* ========================================================================= */}
        {/* LEFT COLUMN: CUSTOMIZE TEMPLATE SECTIONS */}
        {/* ========================================================================= */}
        <div className="lg:col-span-6 space-y-4">
          {/* Section Navigation Tabs */}
          <div className="bg-white p-1.5 rounded-xl border border-stone-200 shadow-2xs flex flex-wrap gap-1">
            {[
              { id: 'info', label: '1. Document Info', icon: FileText },
              { id: 'header_logos', label: '2. Header & Logos', icon: Image },
              { id: 'body', label: '3. Certificate Body', icon: PenTool },
              { id: 'signatories', label: '4. Official Signatories', icon: FileCheck },
              { id: 'watermark', label: '5. Watermark', icon: Layers },
              { id: 'receipt', label: '6. Receipt & Notes', icon: Sliders },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeSection === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveSection(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-stone-700 hover:bg-stone-100 hover:text-stone-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* CARD 1: DOCUMENT INFO */}
          {activeSection === 'info' && (
            <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-5 space-y-4 animate-in fade-in duration-150">
              <div className="border-b border-stone-100 pb-3">
                <h3 className="text-sm font-black text-slate-900">1. Document Information</h3>
                <p className="text-xs text-stone-500">Configure template identity, barangay scope, and typography</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Template Name</label>
                  <input
                    type="text"
                    value={template.name}
                    onChange={e => setTemplate({ ...template, name: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Barangay Scope</label>
                  <select
                    value={template.barangay}
                    onChange={e => setTemplate({ ...template, barangay: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="All">All Barangays (Universal)</option>
                    {HINUNANGAN_BARANGAYS.map(b => (
                      <option key={b.code} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Document Type</label>
                  <select
                    value={template.documentType}
                    onChange={e => setTemplate({ ...template, documentType: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {DOCUMENT_TYPE_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Language / Dialect</label>
                  <select
                    value={template.language}
                    onChange={e => setTemplate({ ...template, language: e.target.value as any })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="english">English</option>
                    <option value="bisaya">Cebuano / Bisaya Dialect</option>
                    <option value="filipino">Filipino (Tagalog)</option>
                    <option value="custom">Custom Dialect</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Document Heading Title</label>
                  <input
                    type="text"
                    value={template.documentTitle}
                    onChange={e => setTemplate({ ...template, documentTitle: e.target.value })}
                    placeholder="e.g. BARANGAY CERTIFICATION"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Title Font Style</label>
                  <select
                    value={template.titleFont}
                    onChange={e => setTemplate({ ...template, titleFont: e.target.value as any })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="gothic">Gothic / Blackletter Calligraphy (Nava Style)</option>
                    <option value="serif_underline">Serif Bold with Underline (Nueva Esperanza)</option>
                    <option value="serif_bold">Serif Bold with Border Box (Tuburan Style)</option>
                    <option value="sans_bold">Modern Sans-Serif Bold</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Page Paper Size</label>
                  <select
                    value={template.pageSize}
                    onChange={e => setTemplate({ ...template, pageSize: e.target.value as any })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Folio">Folio / Long Bond (8.5 x 13 in)</option>
                    <option value="A4">A4 (8.27 x 11.69 in)</option>
                    <option value="Letter">Letter / Short (8.5 x 11 in)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Header Divider Line</label>
                  <select
                    value={template.header.borderStyle || 'single'}
                    onChange={e =>
                      setTemplate({
                        ...template,
                        header: { ...template.header, borderStyle: e.target.value as any },
                      })
                    }
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="single">Standard Single Line</option>
                    <option value="double">Double Border Line</option>
                    <option value="green_line">Green Accent Line (Tuburan)</option>
                    <option value="none">No Line</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* CARD 2: HEADER & LOGOS */}
          {activeSection === 'header_logos' && (
            <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-5 space-y-5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div>
                  <h3 className="text-sm font-black text-slate-900">2. Header & Logos</h3>
                  <p className="text-xs text-stone-500">
                    Add, remove, change, and assign official logos to LEFT, CENTER, or RIGHT positions
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleOpenAddLogo}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Logo</span>
                </button>
              </div>

              {/* Header Text Settings */}
              <div className="bg-slate-50 p-4 rounded-xl border border-stone-200 space-y-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  OFFICIAL HEADER DETAILS:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-0.5">Barangay Name in Header</label>
                    <input
                      type="text"
                      value={template.header.barangayText}
                      onChange={e =>
                        setTemplate({
                          ...template,
                          header: { ...template.header, barangayText: e.target.value },
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-semibold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-0.5">Office Title / Subheading</label>
                    <input
                      type="text"
                      value={template.header.officeTitle || ''}
                      onChange={e =>
                        setTemplate({
                          ...template,
                          header: { ...template.header, officeTitle: e.target.value },
                        })
                      }
                      placeholder="e.g. OFFICE OF THE PUNONG BARANGAY"
                      className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-semibold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-0.5">Official Email</label>
                    <input
                      type="text"
                      value={template.header.contactEmail || ''}
                      onChange={e =>
                        setTemplate({
                          ...template,
                          header: { ...template.header, contactEmail: e.target.value },
                        })
                      }
                      placeholder="e.g. brgy.nava@hinunangan.gov.ph"
                      className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-semibold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-0.5">Official Contact / Hotline</label>
                    <input
                      type="text"
                      value={template.header.contactPhone || ''}
                      onChange={e =>
                        setTemplate({
                          ...template,
                          header: { ...template.header, contactPhone: e.target.value },
                        })
                      }
                      placeholder="e.g. 09763070221"
                      className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-semibold text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Logos Array */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    CONFIGURED LOGOS ({template.logos?.length || 0})
                  </span>
                  <span className="text-[11px] text-stone-500">Live preview updates immediately</span>
                </div>

                {(template.logos || []).length === 0 ? (
                  <div className="text-center py-6 border-2 border-dashed border-stone-200 rounded-xl bg-stone-50">
                    <Image className="w-8 h-8 text-stone-300 mx-auto mb-1" />
                    <p className="text-xs font-bold text-stone-600">No logos added</p>
                    <p className="text-[11px] text-stone-400">Click &ldquo;+ Add Logo&rdquo; above to attach official seals</p>
                  </div>
                ) : (
                  (template.logos || []).map((logo, index) => (
                    <div
                      key={logo.id}
                      className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-2xs space-y-3 relative"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-stone-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-md bg-slate-900 text-white font-black text-[11px] flex items-center justify-center">
                            #{index + 1}
                          </span>
                          <span className="text-xs font-black text-slate-800 uppercase">
                            {logo.type === 'barangay'
                              ? `Barangay Seal (${logo.barangayName || template.barangay})`
                              : logo.type === 'municipality'
                              ? 'Municipality of Hinunangan Seal'
                              : logo.type === 'da'
                              ? 'Department of Agriculture (DA) Seal'
                              : logo.type === 'bagong_pilipinas'
                              ? 'Bagong Pilipinas Official Logo'
                              : logo.type === 'province'
                              ? 'Province of Southern Leyte Seal'
                              : 'Custom Uploaded Logo'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMoveLogo(index, 'up')}
                            disabled={index === 0}
                            className="p-1 rounded text-stone-500 hover:bg-stone-100 disabled:opacity-30 cursor-pointer"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveLogo(index, 'down')}
                            disabled={index === (template.logos?.length || 0) - 1}
                            className="p-1 rounded text-stone-500 hover:bg-stone-100 disabled:opacity-30 cursor-pointer"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveLogo(logo.id)}
                            className="p-1 rounded text-rose-500 hover:bg-rose-50 cursor-pointer"
                            title="Remove Logo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Position Selector (LEFT, CENTER, RIGHT) */}
                        <div>
                          <label className="block text-[11px] font-bold text-stone-700 mb-1">
                            Position: <span className="text-blue-600 uppercase font-black">{logo.position}</span>
                          </label>
                          <select
                            value={logo.position}
                            onChange={e =>
                              handleUpdateLogo(logo.id, {
                                position: e.target.value as CertificateLogoPosition,
                              })
                            }
                            className="w-full px-2.5 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-xs font-bold text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                          >
                            <option value="left">LEFT</option>
                            <option value="center">CENTER</option>
                            <option value="right">RIGHT</option>
                          </select>
                        </div>

                        {/* Seal Type / Change Logo */}
                        <div>
                          <label className="block text-[11px] font-bold text-stone-700 mb-1">Seal Type</label>
                          <select
                            value={logo.type}
                            onChange={e =>
                              handleUpdateLogo(logo.id, {
                                type: e.target.value as CertificateLogoType,
                              })
                            }
                            className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-300 rounded-lg text-xs font-semibold text-slate-900"
                          >
                            <option value="barangay">Barangay Official Seal</option>
                            <option value="municipality">Municipality of Hinunangan</option>
                            <option value="province">Province of Southern Leyte</option>
                            <option value="da">Department of Agriculture (DA)</option>
                            <option value="bagong_pilipinas">Bagong Pilipinas</option>
                            <option value="custom">Custom Uploaded File</option>
                          </select>
                        </div>

                        {/* Dimensions */}
                        <div>
                          <label className="block text-[11px] font-bold text-stone-700 mb-1">
                            Size ({logo.widthPx}px)
                          </label>
                          <input
                            type="range"
                            min="45"
                            max="110"
                            value={logo.widthPx}
                            onChange={e =>
                              handleUpdateLogo(logo.id, {
                                widthPx: Number(e.target.value),
                                heightPx: Number(e.target.value),
                              })
                            }
                            className="w-full accent-blue-600 cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* If Barangay Seal, select which barangay */}
                      {logo.type === 'barangay' && (
                        <div>
                          <label className="block text-[11px] font-bold text-stone-700 mb-1">
                            Select Barangay (Hinunangan 1-40)
                          </label>
                          <select
                            value={logo.barangayName || template.barangay}
                            onChange={e => handleUpdateLogo(logo.id, { barangayName: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-300 rounded-lg text-xs font-semibold text-slate-900"
                          >
                            {HINUNANGAN_BARANGAYS.map(b => (
                              <option key={b.code} value={b.name}>
                                {b.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Change Logo Upload / Replace */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-stone-100">
                        <label className="px-3 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer border border-stone-300">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Change Logo (Upload Image)</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={e => handleLogoFileUpload(e, logo.id)}
                            className="hidden"
                          />
                        </label>
                        {logo.customUrl && (
                          <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Custom Image Attached
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* CARD 3: CERTIFICATE BODY */}
          {activeSection === 'body' && (
            <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-5 space-y-4 animate-in fade-in duration-150">
              <div className="border-b border-stone-100 pb-3">
                <h3 className="text-sm font-black text-slate-900">3. Certificate Body</h3>
                <p className="text-xs text-stone-500">
                  Write the official body text in English, Bisaya, or Filipino with dynamic placeholders
                </p>
              </div>

              {/* Placeholder helper chips */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-600">
                  CLICK TO INSERT PLACEHOLDER VARIABLES:
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-slate-50 border border-stone-200 rounded-xl">
                  {AVAILABLE_PLACEHOLDERS.map(ph => (
                    <button
                      key={ph.key}
                      type="button"
                      onClick={() => handleInsertPlaceholder(ph.key)}
                      className="px-2 py-1 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-[11px] font-mono font-bold transition cursor-pointer flex items-center gap-1"
                      title={`Sample: ${ph.sample}`}
                    >
                      <span>+ {ph.key}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Rich Body Textarea */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Body Template Content (Supports Double Line Breaks for Paragraphs)
                </label>
                <textarea
                  rows={10}
                  value={template.bodyTemplate}
                  onChange={e => setTemplate({ ...template, bodyTemplate: e.target.value })}
                  className="w-full p-3 bg-stone-50 border border-stone-300 rounded-xl text-xs font-serif leading-relaxed text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Optional Note Text */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Official Footer Note / Notice (Italicized)
                </label>
                <input
                  type="text"
                  value={template.noteText || ''}
                  onChange={e => setTemplate({ ...template, noteText: e.target.value })}
                  placeholder="e.g. Note: This certification is not valid without official seal."
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* CARD 4: OFFICIAL SIGNATORIES */}
          {activeSection === 'signatories' && (
            <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-5 space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div>
                  <h3 className="text-sm font-black text-slate-900">4. Official Signatories</h3>
                  <p className="text-xs text-stone-500">
                    Customize names, designations, clear horizontal signature lines, and digital signatures
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddSignatory}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ ADD SIGNATORY</span>
                </button>
              </div>

              <div className="space-y-4">
                {(template.signatories || []).map((sig, index) => (
                  <div
                    key={sig.id}
                    className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs space-y-3 relative"
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-stone-100 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-slate-900 text-white font-black text-[11px] flex items-center justify-center">
                          #{index + 1}
                        </span>
                        <span className="text-xs font-black text-slate-900 uppercase">
                          {sig.position || 'Signatory'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveSignatory(index, 'up')}
                          disabled={index === 0}
                          className="p-1 rounded text-stone-500 hover:bg-stone-100 disabled:opacity-30 cursor-pointer"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveSignatory(index, 'down')}
                          disabled={index === (template.signatories?.length || 0) - 1}
                          className="p-1 rounded text-stone-500 hover:bg-stone-100 disabled:opacity-30 cursor-pointer"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveSignatory(sig.id)}
                          className="p-1 rounded text-rose-500 hover:bg-rose-50 cursor-pointer"
                          title="Remove Signatory"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Full Name */}
                      <div>
                        <label className="block text-[11px] font-bold text-stone-700 mb-1">
                          FULL NAME / PLACEHOLDER
                        </label>
                        <input
                          type="text"
                          value={sig.name}
                          onChange={e => handleUpdateSignatory(sig.id, { name: e.target.value })}
                          placeholder="e.g. HON. VICENTE T. MADRONERO JR. or {{resident_name}}"
                          className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-300 rounded-lg text-xs font-semibold text-slate-900"
                        />
                      </div>

                      {/* Position */}
                      <div>
                        <label className="block text-[11px] font-bold text-stone-700 mb-1">
                          POSITION / DESIGNATION
                        </label>
                        <input
                          type="text"
                          value={sig.position}
                          onChange={e => handleUpdateSignatory(sig.id, { position: e.target.value })}
                          placeholder="e.g. PUNONG BARANGAY"
                          className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-300 rounded-lg text-xs font-semibold text-slate-900"
                        />
                      </div>

                      {/* Signatory Prefix */}
                      <div>
                        <label className="block text-[11px] font-bold text-stone-700 mb-1">
                          SIGNATORY PREFIX (OPTIONAL)
                        </label>
                        <input
                          type="text"
                          value={sig.prefix || sig.details || ''}
                          onChange={e =>
                            handleUpdateSignatory(sig.id, {
                              prefix: e.target.value,
                              details: e.target.value,
                            })
                          }
                          placeholder="e.g. Noted by: / Certified by: / CONFORME:"
                          className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-300 rounded-lg text-xs font-semibold text-slate-900"
                        />
                      </div>

                      {/* Digital Signature Upload */}
                      <div>
                        <label className="block text-[11px] font-bold text-stone-700 mb-1">
                          DIGITAL SIGNATURE
                        </label>
                        <div className="flex items-center gap-2">
                          <label className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-lg text-[11px] flex items-center gap-1 transition cursor-pointer border border-stone-300">
                            <Upload className="w-3.5 h-3.5" />
                            <span>Upload PNG</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={e => handleSignatureUpload(e, sig.id)}
                              className="hidden"
                            />
                          </label>
                          {sig.signatureImageUrl && (
                            <label className="flex items-center gap-1 text-[11px] font-bold text-slate-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={sig.showSignatureImage !== false}
                                onChange={e =>
                                  handleUpdateSignatory(sig.id, { showSignatureImage: e.target.checked })
                                }
                                className="rounded text-blue-600"
                              />
                              <span>Show Signature</span>
                            </label>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* SIGNATURE LINE CUSTOMIZATION CONTROLS */}
                    <div className="bg-slate-50 p-3 rounded-lg border border-stone-200 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 font-bold text-slate-900 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={sig.showSignatureLine !== false}
                            onChange={e =>
                              handleUpdateSignatory(sig.id, { showSignatureLine: e.target.checked })
                            }
                            className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                          />
                          <span>Show Horizontal Signature Line</span>
                        </label>
                        <span className="text-[10px] text-stone-500">Rendered directly above name</span>
                      </div>

                      {sig.showSignatureLine !== false && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                          {/* Line Width */}
                          <div>
                            <label className="block text-[10px] font-bold text-stone-600 mb-0.5">Line Width</label>
                            <select
                              value={sig.lineWidth || '220px'}
                              onChange={e => handleUpdateSignatory(sig.id, { lineWidth: e.target.value })}
                              className="w-full px-2 py-1 bg-white border border-stone-300 rounded text-xs font-semibold text-slate-900"
                            >
                              <option value="160px">Compact (160px)</option>
                              <option value="180px">Standard (180px)</option>
                              <option value="200px">Medium (200px)</option>
                              <option value="220px">Wide (220px)</option>
                              <option value="260px">Extra Wide (260px)</option>
                              <option value="100%">Full Width (100%)</option>
                            </select>
                          </div>

                          {/* Line Alignment */}
                          <div>
                            <label className="block text-[10px] font-bold text-stone-600 mb-0.5">
                              Line Alignment
                            </label>
                            <select
                              value={sig.lineAlignment || sig.alignment || 'center'}
                              onChange={e =>
                                handleUpdateSignatory(sig.id, {
                                  lineAlignment: e.target.value as any,
                                  alignment: e.target.value as any,
                                })
                              }
                              className="w-full px-2 py-1 bg-white border border-stone-300 rounded text-xs font-semibold text-slate-900"
                            >
                              <option value="left">Left</option>
                              <option value="center">Center</option>
                              <option value="right">Right</option>
                            </select>
                          </div>

                          {/* Signature Width */}
                          <div>
                            <label className="block text-[10px] font-bold text-stone-600 mb-0.5">
                              Signature Width
                            </label>
                            <select
                              value={sig.signatureWidth || '130px'}
                              onChange={e => handleUpdateSignatory(sig.id, { signatureWidth: e.target.value })}
                              className="w-full px-2 py-1 bg-white border border-stone-300 rounded text-xs font-semibold text-slate-900"
                            >
                              <option value="100px">Small (100px)</option>
                              <option value="130px">Medium (130px)</option>
                              <option value="160px">Large (160px)</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Big Add Signatory Button */}
                <button
                  type="button"
                  onClick={handleAddSignatory}
                  className="w-full py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border-2 border-dashed border-blue-300 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ ADD SIGNATORY</span>
                </button>
              </div>
            </div>
          )}

          {/* CARD 5: WATERMARK */}
          {activeSection === 'watermark' && (
            <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-5 space-y-4 animate-in fade-in duration-150">
              <div className="border-b border-stone-100 pb-3">
                <h3 className="text-sm font-black text-slate-900">5. Background Logo / Watermark</h3>
                <p className="text-xs text-stone-500">
                  Enable subtle background watermark visible behind certificate text
                </p>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 border border-stone-200 rounded-xl">
                <div>
                  <span className="text-xs font-black text-slate-900">Enable Background Watermark</span>
                  <p className="text-[11px] text-stone-500">Display seal in center behind document body</p>
                </div>
                <input
                  type="checkbox"
                  checked={template.watermark?.enabled || false}
                  onChange={e =>
                    setTemplate({
                      ...template,
                      watermark: { ...template.watermark, enabled: e.target.checked },
                    })
                  }
                  className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </div>

              {template.watermark?.enabled && (
                <div className="space-y-3 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">Watermark Seal Type</label>
                      <select
                        value={template.watermark.type}
                        onChange={e =>
                          setTemplate({
                            ...template,
                            watermark: { ...template.watermark, type: e.target.value as any },
                          })
                        }
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="municipality">Municipality of Hinunangan Seal</option>
                        <option value="barangay">Barangay Official Seal</option>
                        <option value="da">Department of Agriculture (DA) Seal</option>
                        <option value="province">Province of Southern Leyte Seal</option>
                        <option value="custom">Custom Uploaded Watermark</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">Watermark Size</label>
                      <select
                        value={template.watermark.size}
                        onChange={e =>
                          setTemplate({
                            ...template,
                            watermark: { ...template.watermark, size: e.target.value as any },
                          })
                        }
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="small">Small (280px)</option>
                        <option value="medium">Medium (380px)</option>
                        <option value="large">Large (480px)</option>
                      </select>
                    </div>
                  </div>

                  {/* Opacity Slider */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-stone-700">Watermark Opacity</label>
                      <span className="text-xs font-black text-blue-700 font-mono">
                        {Math.round((template.watermark.opacity || 0.12) * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.04"
                      max="0.35"
                      step="0.01"
                      value={template.watermark.opacity || 0.12}
                      onChange={e =>
                        setTemplate({
                          ...template,
                          watermark: {
                            ...template.watermark,
                            opacity: parseFloat(e.target.value),
                          },
                        })
                      }
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                  </div>

                  {template.watermark.type === 'custom' && (
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Upload Custom Watermark Image
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleWatermarkUpload}
                        className="text-xs"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* CARD 6: RECEIPT & FOOTER */}
          {activeSection === 'receipt' && (
            <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-5 space-y-4 animate-in fade-in duration-150">
              <div className="border-b border-stone-100 pb-3">
                <h3 className="text-sm font-black text-slate-900">6. Official Receipt & Notes</h3>
                <p className="text-xs text-stone-500">Configure bottom-left official receipt payment block</p>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 border border-stone-200 rounded-xl">
                <div>
                  <span className="text-xs font-black text-slate-900">Show Official Receipt (O.R.) Box</span>
                  <p className="text-[11px] text-stone-500">Renders official receipt number, amount paid, and timestamp</p>
                </div>
                <input
                  type="checkbox"
                  checked={template.receipt?.showReceiptBox || false}
                  onChange={e =>
                    setTemplate({
                      ...template,
                      receipt: { ...template.receipt, showReceiptBox: e.target.checked },
                    })
                  }
                  className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </div>

              {template.receipt?.showReceiptBox && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Receipt Format Style</label>
                    <select
                      value={template.receipt.formatStyle || 'nava'}
                      onChange={e =>
                        setTemplate({
                          ...template,
                          receipt: { ...template.receipt, formatStyle: e.target.value as any },
                        })
                      }
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-semibold text-slate-900"
                    >
                      <option value="nava">Nava Format (Official Receipt Paid: OR / ₱)</option>
                      <option value="standard">Standard Format (O.R. # : ...)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Default Fee (PHP)</label>
                    <input
                      type="text"
                      value={template.receipt.amountPaid || '100.00'}
                      onChange={e =>
                        setTemplate({
                          ...template,
                          receipt: { ...template.receipt, amountPaid: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-semibold text-slate-900"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: LIVE CERTIFICATE PREVIEW (EXACT OUTPUT WITH IMMEDIATE UPDATES) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-6 space-y-3">
          <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-black text-slate-900 uppercase tracking-wide">
                LIVE CERTIFICATE PREVIEW
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" />
                <span>Print Document</span>
              </button>
            </div>
          </div>

          {/* Scaled & Scrollable Document Canvas (No floating distracting buttons) */}
          <div className="bg-slate-200/90 p-4 sm:p-6 rounded-2xl border border-stone-300 shadow-inner overflow-x-auto">
            <DynamicCertificateView
              containerRef={printRef}
              template={template}
              data={sampleDataContext}
            />
          </div>
        </div>
      </div>

      {/* ADD LOGO MODAL */}
      {isAddLogoModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl border border-stone-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Image className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-black text-slate-900">Add Official Seal / Logo</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddLogoModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Position Selector */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">Position in Header</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['left', 'center', 'right'] as CertificateLogoPosition[]).map(pos => (
                    <button
                      key={pos}
                      type="button"
                      onClick={() => setNewLogoPosition(pos)}
                      className={`py-2 px-3 rounded-xl font-bold uppercase text-xs transition cursor-pointer border ${
                        newLogoPosition === pos
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              </div>

              {/* Logo Source Type */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Seal / Insignia Source</label>
                <select
                  value={newLogoType}
                  onChange={e => setNewLogoType(e.target.value as CertificateLogoType)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-semibold text-slate-900"
                >
                  <option value="barangay">Barangay Official Seal</option>
                  <option value="municipality">Municipality of Hinunangan Seal</option>
                  <option value="province">Province of Southern Leyte Seal</option>
                  <option value="da">Department of Agriculture (DA) Seal</option>
                  <option value="bagong_pilipinas">Bagong Pilipinas Official Logo</option>
                  <option value="custom">Custom Uploaded File</option>
                </select>
              </div>

              {/* If Barangay Seal, select which barangay */}
              {newLogoType === 'barangay' && (
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Select Barangay</label>
                  <select
                    value={newLogoBarangay}
                    onChange={e => setNewLogoBarangay(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-semibold text-slate-900"
                  >
                    {HINUNANGAN_BARANGAYS.map(b => (
                      <option key={b.code} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* If Custom, upload image */}
              {newLogoType === 'custom' && (
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Upload Seal Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => handleLogoFileUpload(e)}
                    className="w-full text-xs"
                  />
                </div>
              )}

              {/* Dimensions */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-stone-700">Logo Size</label>
                  <span className="font-mono font-bold text-blue-600">{newLogoSize}px</span>
                </div>
                <input
                  type="range"
                  min="45"
                  max="110"
                  value={newLogoSize}
                  onChange={e => setNewLogoSize(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setIsAddLogoModalOpen(false)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveNewLogo}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-xs"
              >
                Save Logo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

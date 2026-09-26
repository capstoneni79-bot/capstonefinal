import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Upload,
  Link as LinkIcon,
  Eye,
  EyeOff,
  RefreshCw,
  Trash2,
  Check,
  X,
  ShieldCheck,
  Layers,
  CheckCircle,
  AlertCircle,
  RotateCcw,
  Building,
  GraduationCap,
  Sliders,
  Plus,
  ArrowRight,
  ExternalLink,
  Smartphone,
  Monitor,
  Tablet,
  Image as ImageIcon,
} from 'lucide-react';
import { LandingCmsConfig, OfficialLogoItem, LogoPlacement } from '../../../types/landingCms';
import { landingCmsService } from '../../../services/landingCmsService';
import { compressImageFile } from '../../../utils/imageCompressor';
import {
  SealDA,
  SealMunicipality,
  SealTaskForce,
  SealSLSU,
  SealExtension,
} from '../../common/OfficialSeals';

interface LogoConfigurationProps {
  onSaved?: () => void;
  onNavigateTab?: (tab: string) => void;
}

interface LogoEntry {
  key: string;
  title: string;
  category: 'da' | 'municipal' | 'slsu' | 'extension' | 'system' | 'partner' | 'header' | 'login' | 'landing' | 'footer';
  description: string;
  defaultComponent?: 'SealDA' | 'SealMunicipality' | 'SealTaskForce' | 'SealSLSU' | 'SealExtension';
  currentUrl?: string;
  placement: LogoPlacement | string;
  defaultSizePx: number;
  sizePx: number;
  visible: boolean;
  mobileVisible: boolean;
  altText: string;
  caption?: string;
  isCustomImage?: boolean;
}

export const LogoConfiguration: React.FC<LogoConfigurationProps> = ({
  onSaved,
  onNavigateTab,
}) => {
  const [config, setConfig] = useState<LandingCmsConfig>(() => landingCmsService.getDraftConfig());
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'institutions' | 'system' | 'locations'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewBg, setPreviewBg] = useState<'light' | 'dark' | 'transparent'>('light');

  // Modal State for Editing Logo Image
  const [editingLogoKey, setEditingLogoKey] = useState<string | null>(null);
  const [activeSourceMode, setActiveSourceMode] = useState<'device' | 'url'>('device');
  const [candidateUrl, setCandidateUrl] = useState<string>('');
  const [urlInput, setUrlInput] = useState<string>('');
  const [candidateFileName, setCandidateFileName] = useState<string>('');
  const [candidateFileSize, setCandidateFileSize] = useState<string>('');
  const [urlError, setUrlError] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editAltText, setEditAltText] = useState('');
  const [editCaption, setEditCaption] = useState('');
  const [editSizePx, setEditSizePx] = useState(48);
  const [editPlacement, setEditPlacement] = useState<string>('header_left');
  const [editVisible, setEditVisible] = useState(true);
  const [editMobileVisible, setEditMobileVisible] = useState(true);

  // Add Partner Logo Modal
  const [isAddPartnerOpen, setIsAddPartnerOpen] = useState(false);
  const [newPartnerName, setNewPartnerName] = useState('');
  const [newPartnerInst, setNewPartnerInst] = useState('');
  const [newPartnerUrl, setNewPartnerUrl] = useState('');
  const [newPartnerPlacement, setNewPartnerPlacement] = useState<LogoPlacement>('partners');
  const [newPartnerSize, setNewPartnerSize] = useState(48);

  // Reset confirmation modal
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'warn' | 'info' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const partnerFileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (text: string, type: 'success' | 'warn' | 'info' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Sync state on external update
  useEffect(() => {
    const handleUpdate = () => {
      setConfig(landingCmsService.getDraftConfig());
    };
    window.addEventListener('da_landing_cms_updated', handleUpdate);
    window.addEventListener('da_landing_draft_updated', handleUpdate);
    return () => {
      window.removeEventListener('da_landing_cms_updated', handleUpdate);
      window.removeEventListener('da_landing_draft_updated', handleUpdate);
    };
  }, []);

  // Helper to render official vector seal
  const renderVectorSeal = (sealKey?: string, className: string = 'w-14 h-14') => {
    if (sealKey === 'SealDA') return <SealDA className={className} />;
    if (sealKey === 'SealMunicipality') return <SealMunicipality className={className} />;
    if (sealKey === 'SealTaskForce') return <SealTaskForce className={className} />;
    if (sealKey === 'SealSLSU') return <SealSLSU className={className} />;
    if (sealKey === 'SealExtension') return <SealExtension className={className} />;
    return <SealMunicipality className={className} />;
  };

  // Build complete list of all configurable logos
  const logoEntries: LogoEntry[] = [
    {
      key: 'logo-da',
      title: 'Department of Agriculture (DA) Republic Seal',
      category: 'da',
      description: 'Official Department of Agriculture National Seal displayed across official banners, letterheads, and certificates.',
      defaultComponent: 'SealDA',
      currentUrl: config.officialLogos?.find(l => l.id === 'logo-da' || l.category === 'da')?.url || '',
      placement: config.officialLogos?.find(l => l.id === 'logo-da')?.placement || 'header_left',
      defaultSizePx: 48,
      sizePx: config.officialLogos?.find(l => l.id === 'logo-da')?.sizePx || 48,
      visible: config.officialLogos?.find(l => l.id === 'logo-da')?.visible ?? true,
      mobileVisible: config.officialLogos?.find(l => l.id === 'logo-da')?.mobileVisible ?? true,
      altText: 'Department of Agriculture Philippines Republic Seal',
      caption: 'Official Seal of the Department of Agriculture',
      isCustomImage: Boolean(config.officialLogos?.find(l => l.id === 'logo-da')?.url && config.officialLogos.find(l => l.id === 'logo-da')?.url !== '/icon.svg'),
    },
    {
      key: 'logo-mun',
      title: 'Hinunangan Municipal Government Seal',
      category: 'municipal',
      description: 'Official Local Government Unit (LGU) Seal of Hinunangan, Southern Leyte with mountains, bay, and town banner.',
      defaultComponent: 'SealMunicipality',
      currentUrl: config.officialLogos?.find(l => l.id === 'logo-mun' || l.category === 'municipal')?.url || '',
      placement: config.officialLogos?.find(l => l.id === 'logo-mun')?.placement || 'header_left',
      defaultSizePx: 48,
      sizePx: config.officialLogos?.find(l => l.id === 'logo-mun')?.sizePx || 48,
      visible: config.officialLogos?.find(l => l.id === 'logo-mun')?.visible ?? true,
      mobileVisible: config.officialLogos?.find(l => l.id === 'logo-mun')?.mobileVisible ?? true,
      altText: 'Official Seal of the Municipality of Hinunangan',
      caption: 'Municipal Government of Hinunangan, Southern Leyte',
      isCustomImage: Boolean(config.officialLogos?.find(l => l.id === 'logo-mun')?.url && config.officialLogos.find(l => l.id === 'logo-mun')?.url !== '/icon.svg'),
    },
    {
      key: 'logo-slsu',
      title: 'Southern Leyte State University (SLSU) Logo',
      category: 'slsu',
      description: 'Institutional Academic Seal of SLSU partner university, research, and technical advisory body.',
      defaultComponent: 'SealSLSU',
      currentUrl: config.officialLogos?.find(l => l.id === 'logo-slsu' || l.category === 'slsu')?.url || '',
      placement: config.officialLogos?.find(l => l.id === 'logo-slsu')?.placement || 'header_left',
      defaultSizePx: 44,
      sizePx: config.officialLogos?.find(l => l.id === 'logo-slsu')?.sizePx || 44,
      visible: config.officialLogos?.find(l => l.id === 'logo-slsu')?.visible ?? true,
      mobileVisible: config.officialLogos?.find(l => l.id === 'logo-slsu')?.mobileVisible ?? false,
      altText: 'Southern Leyte State University Official Seal',
      caption: 'SLSU Academic and Research Partner',
      isCustomImage: Boolean(config.officialLogos?.find(l => l.id === 'logo-slsu')?.url && config.officialLogos.find(l => l.id === 'logo-slsu')?.url !== '/icon.svg'),
    },
    {
      key: 'logo-ext',
      title: 'SLSU Extension Center Emblem',
      category: 'extension',
      description: 'Outreach & Agricultural Training Center emblem for farmer workshops and technical extension.',
      defaultComponent: 'SealExtension',
      currentUrl: config.officialLogos?.find(l => l.id === 'logo-ext' || l.category === 'extension')?.url || '',
      placement: config.officialLogos?.find(l => l.id === 'logo-ext')?.placement || 'partners',
      defaultSizePx: 52,
      sizePx: config.officialLogos?.find(l => l.id === 'logo-ext')?.sizePx || 52,
      visible: config.officialLogos?.find(l => l.id === 'logo-ext')?.visible ?? true,
      mobileVisible: config.officialLogos?.find(l => l.id === 'logo-ext')?.mobileVisible ?? true,
      altText: 'SLSU Extension and Training Center Emblem',
      caption: 'SLSU Agricultural Extension and Field Training',
      isCustomImage: Boolean(config.officialLogos?.find(l => l.id === 'logo-ext')?.url && config.officialLogos.find(l => l.id === 'logo-ext')?.url !== '/icon.svg'),
    },
    {
      key: 'logo-system',
      title: 'System & Application Icon (Brand)',
      category: 'system',
      description: 'Primary application mark used on browser favicons, PWA install prompts, header navigation, and mobile badges.',
      currentUrl: config.systemLogoUrl || config.faviconUrl || '/icon.svg',
      placement: 'header_left',
      defaultSizePx: 44,
      sizePx: config.headerLogoWidth || 44,
      visible: true,
      mobileVisible: true,
      altText: 'DA Hinunangan Swine Registry System Icon',
      caption: 'Primary Application Brand Icon',
      isCustomImage: Boolean(config.systemLogoUrl && config.systemLogoUrl !== '/icon.svg'),
    },
    {
      key: 'logo-header',
      title: 'Header Navigation Logo',
      category: 'header',
      description: 'Logo displayed at the top left of the main application header for all authenticated users and visitors.',
      currentUrl: config.headerLogoUrl || config.systemLogoUrl || '/icon.svg',
      placement: 'header_left',
      defaultSizePx: 40,
      sizePx: config.headerLogoWidth || 40,
      visible: true,
      mobileVisible: true,
      altText: 'Header Navigation Logo',
      caption: 'Header Brand Icon',
      isCustomImage: Boolean(config.headerLogoUrl && config.headerLogoUrl !== '/icon.svg'),
    },
    {
      key: 'logo-login',
      title: 'Login Page & Auth Modal Logo',
      category: 'login',
      description: 'Prominent emblem displayed at the top of the Admin / Focal Person sign-in dialog and authentication gate.',
      defaultComponent: 'SealDA',
      currentUrl: config.systemLogoUrl || '',
      placement: 'hero',
      defaultSizePx: 64,
      sizePx: 64,
      visible: true,
      mobileVisible: true,
      altText: 'Authentication Portal Seal',
      caption: 'Login Portal Security Insignia',
      isCustomImage: Boolean(config.systemLogoUrl && config.systemLogoUrl !== '/icon.svg'),
    },
    {
      key: 'logo-landing',
      title: 'Landing Page Hero Badge & Insignia',
      category: 'landing',
      description: 'Institutional seals presented in the public landing page hero banner alongside green zone compliance indicators.',
      defaultComponent: 'SealMunicipality',
      currentUrl: config.officialLogos?.find(l => l.placement === 'hero')?.url || '',
      placement: 'hero',
      defaultSizePx: 50,
      sizePx: 50,
      visible: true,
      mobileVisible: true,
      altText: 'Landing Page Hero Insignia',
      caption: 'Public Landing Page Hero Insignia',
      isCustomImage: Boolean(config.officialLogos?.find(l => l.placement === 'hero')?.url),
    },
    {
      key: 'logo-footer',
      title: 'Footer Municipal Authority Emblem',
      category: 'footer',
      description: 'Official copyright and statutory jurisdiction seal displayed in the website footer across all pages.',
      defaultComponent: 'SealMunicipality',
      currentUrl: config.officialLogos?.find(l => l.placement === 'footer')?.url || '',
      placement: 'footer',
      defaultSizePx: 38,
      sizePx: 38,
      visible: true,
      mobileVisible: true,
      altText: 'Footer Jurisdiction Seal',
      caption: 'Municipality of Hinunangan Seal Footer',
      isCustomImage: Boolean(config.officialLogos?.find(l => l.placement === 'footer')?.url),
    },
    // Additional partner logos
    ...(config.officialLogos || [])
      .filter(l => !['logo-da', 'logo-mun', 'logo-slsu', 'logo-ext', 'logo-system', 'logo-header', 'logo-login', 'logo-landing', 'logo-footer'].includes(l.id))
      .map((l, idx) => ({
        key: `partner-${l.id || idx}`,
        title: l.name,
        category: 'partner' as const,
        description: `${l.institution || 'Partner Agency'} official seal and branding.`,
        defaultComponent: l.vectorComponent,
        currentUrl: l.url || '',
        placement: l.placement,
        defaultSizePx: l.sizePx || 48,
        sizePx: l.sizePx || 48,
        visible: l.visible,
        mobileVisible: l.mobileVisible ?? true,
        altText: l.name,
        caption: l.institution,
        isCustomImage: Boolean(l.url && l.url !== '/icon.svg'),
      })),
  ];

  // Open Edit Modal for a Logo
  const handleOpenEditModal = (entry: LogoEntry) => {
    setEditingLogoKey(entry.key);
    setCandidateUrl(entry.currentUrl || '');
    setUrlInput(entry.currentUrl || '');
    setCandidateFileName('');
    setCandidateFileSize('');
    setUrlError(null);
    setEditTitle(entry.title);
    setEditAltText(entry.altText || entry.title);
    setEditCaption(entry.caption || '');
    setEditSizePx(entry.sizePx || entry.defaultSizePx);
    setEditPlacement(entry.placement || 'header_left');
    setEditVisible(entry.visible);
    setEditMobileVisible(entry.mobileVisible);
    setActiveSourceMode('device');
  };

  const handleCloseEditModal = () => {
    setEditingLogoKey(null);
    setCandidateUrl('');
    setUrlInput('');
    setUrlError(null);
  };

  // Device file reading using smart downscale compression
  const handleFileSelect = async (file: File) => {
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      showToast('File is too large. Please select an image under 15MB.', 'warn');
      return;
    }

    try {
      const result = await compressImageFile(file, {
        maxWidth: 512,
        maxHeight: 512,
        quality: 0.88,
      });

      if (result && result.dataUrl) {
        setCandidateUrl(result.dataUrl);
        setUrlInput(result.dataUrl);
        setCandidateFileName(file.name);
        setCandidateFileSize(result.sizeStr);
        setUrlError(null);
        showToast(`Loaded & optimized ${file.name} (${result.sizeStr})`, 'info');
      }
    } catch (err) {
      console.error('Logo compression failed:', err);
      const reader = new FileReader();
      reader.onload = e => {
        const dataUrl = e.target?.result as string;
        if (dataUrl) {
          setCandidateUrl(dataUrl);
          setUrlInput(dataUrl);
          setCandidateFileName(file.name);
          const sizeKb = (file.size / 1024).toFixed(1);
          setCandidateFileSize(file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : `${sizeKb} KB`);
          setUrlError(null);
          showToast(`Loaded ${file.name} successfully`, 'info');
        }
      };
      reader.onerror = () => {
        showToast('Failed to read image from device.', 'warn');
      };
      reader.readAsDataURL(file);
    }
  };

  // URL apply
  const handleApplyUrl = () => {
    if (!urlInput.trim()) {
      setUrlError('Please enter a valid image URL');
      return;
    }
    setCandidateUrl(urlInput.trim());
    setCandidateFileName('External Image URL');
    setCandidateFileSize('Remote');
    setUrlError(null);
    showToast('Image URL applied to preview', 'info');
  };

  // Save changes for edited logo
  const handleSaveLogoChanges = () => {
    if (!editingLogoKey) return;

    const draft = landingCmsService.getDraftConfig();
    let updatedLogos = [...(draft.officialLogos || [])];

    // Check special system or header keys
    if (editingLogoKey === 'logo-system') {
      draft.systemLogoUrl = candidateUrl || '/icon.svg';
      draft.faviconUrl = candidateUrl || '/icon.svg';
      draft.headerLogoWidth = editSizePx;
    } else if (editingLogoKey === 'logo-header') {
      draft.headerLogoUrl = candidateUrl || '/icon.svg';
      draft.headerLogoWidth = editSizePx;
    } else if (editingLogoKey === 'logo-login') {
      draft.systemLogoUrl = candidateUrl || draft.systemLogoUrl || '/icon.svg';
    } else {
      // Find or create in officialLogos array
      const existingIdx = updatedLogos.findIndex(l => l.id === editingLogoKey);
      if (existingIdx >= 0) {
        updatedLogos[existingIdx] = {
          ...updatedLogos[existingIdx],
          name: editTitle,
          url: candidateUrl,
          sizePx: editSizePx,
          placement: editPlacement,
          visible: editVisible,
          mobileVisible: editMobileVisible,
        };
      } else {
        // Add new official logo entry
        updatedLogos.push({
          id: editingLogoKey,
          name: editTitle,
          institution: editCaption || editTitle,
          url: candidateUrl,
          placement: editPlacement,
          sizePx: editSizePx,
          visible: editVisible,
          mobileVisible: editMobileVisible,
          order: updatedLogos.length + 1,
        });
      }
      draft.officialLogos = updatedLogos;
    }

    // Save and publish to update the whole application immediately
    landingCmsService.saveDraft(draft);
    landingCmsService.publish(draft);
    setConfig(draft);

    handleCloseEditModal();
    showToast(`Logo "${editTitle}" updated successfully across the system!`, 'success');
    if (onSaved) onSaved();
  };

  // Reset a specific logo to its default vector seal
  const handleResetSingleLogo = (key: string) => {
    const draft = landingCmsService.getDraftConfig();
    if (key === 'logo-system' || key === 'logo-header') {
      draft.systemLogoUrl = '/icon.svg';
      draft.headerLogoUrl = '/icon.svg';
      draft.faviconUrl = '/icon.svg';
    } else {
      draft.officialLogos = (draft.officialLogos || []).map(l => {
        if (l.id === key) {
          return { ...l, url: '' };
        }
        return l;
      });
    }

    landingCmsService.saveDraft(draft);
    landingCmsService.publish(draft);
    setConfig(draft);
    showToast('Reset logo to official default vector emblem.', 'info');
    if (onSaved) onSaved();
  };

  // Add a new custom Partner Logo
  const handleCreatePartnerLogo = () => {
    if (!newPartnerName.trim()) {
      showToast('Please enter a partner agency name.', 'warn');
      return;
    }

    const draft = landingCmsService.getDraftConfig();
    const newId = 'logo-partner-' + Date.now();
    const newLogo: OfficialLogoItem = {
      id: newId,
      name: newPartnerName.trim(),
      institution: newPartnerInst.trim() || newPartnerName.trim(),
      url: newPartnerUrl.trim() || '/icon.svg',
      category: 'partner',
      placement: newPartnerPlacement,
      sizePx: newPartnerSize,
      visible: true,
      mobileVisible: true,
      order: (draft.officialLogos || []).length + 1,
    };

    const updatedLogos = [...(draft.officialLogos || []), newLogo];
    draft.officialLogos = updatedLogos;
    landingCmsService.saveDraft(draft);
    landingCmsService.publish(draft);
    setConfig(draft);

    setIsAddPartnerOpen(false);
    setNewPartnerName('');
    setNewPartnerInst('');
    setNewPartnerUrl('');
    showToast(`Partner agency "${newPartnerName}" added!`, 'success');
    if (onSaved) onSaved();
  };

  // Remove a partner logo
  const handleDeletePartnerLogo = (key: string) => {
    const draft = landingCmsService.getDraftConfig();
    draft.officialLogos = (draft.officialLogos || []).filter(l => l.id !== key);
    landingCmsService.saveDraft(draft);
    landingCmsService.publish(draft);
    setConfig(draft);
    showToast('Partner logo removed.', 'info');
    if (onSaved) onSaved();
  };

  // Reset ALL logos to default
  const handleResetAllToDefault = () => {
    const fresh = landingCmsService.restoreDefaults();
    setConfig(fresh);
    setIsResetConfirmOpen(false);
    showToast('All logos reset to original government defaults.', 'success');
    if (onSaved) onSaved();
  };

  // Filtered logo list
  const filteredLogos = logoEntries.filter(entry => {
    const matchesSearch =
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.category.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (selectedFilter === 'institutions') {
      return ['da', 'municipal', 'slsu', 'extension', 'partner'].includes(entry.category);
    }
    if (selectedFilter === 'system') {
      return ['system', 'header', 'login'].includes(entry.category);
    }
    if (selectedFilter === 'locations') {
      return ['landing', 'footer', 'header'].includes(entry.category);
    }
    return true;
  });

  const activeEditingEntry = logoEntries.find(e => e.key === editingLogoKey);

  return (
    <div className="py-6 px-4 max-w-7xl mx-auto space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl text-white font-bold text-xs animate-bounce ${
            toast.type === 'success'
              ? 'bg-emerald-700'
              : toast.type === 'warn'
              ? 'bg-amber-600'
              : 'bg-blue-700'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Top Banner & Action Header */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-blue-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
          <SealMunicipality className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-300 text-xs font-bold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              Administrative Seal & Logo Master Suite
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              🎨 Logo Configuration
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Manage, import from device, replace, preview, and configure every institutional emblem, municipal seal, and application logo across the DA Hinunangan Portal in real time.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsAddPartnerOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Partner Logo</span>
            </button>
            <button
              type="button"
              onClick={() => setIsResetConfirmOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-2 transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span>Reset to Defaults</span>
            </button>
          </div>
        </div>

        {/* Global Background Preview Controls */}
        <div className="mt-6 pt-4 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="font-semibold text-slate-400">Preview Canvas Contrast:</span>
            <div className="inline-flex rounded-lg bg-slate-800/80 p-1 border border-slate-700">
              <button
                type="button"
                onClick={() => setPreviewBg('light')}
                className={`px-2.5 py-1 rounded text-[11px] font-bold transition ${
                  previewBg === 'light' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Light
              </button>
              <button
                type="button"
                onClick={() => setPreviewBg('dark')}
                className={`px-2.5 py-1 rounded text-[11px] font-bold transition ${
                  previewBg === 'dark' ? 'bg-slate-950 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Dark
              </button>
              <button
                type="button"
                onClick={() => setPreviewBg('transparent')}
                className={`px-2.5 py-1 rounded text-[11px] font-bold transition ${
                  previewBg === 'transparent' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Checkerboard
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-300 font-medium">
            <span>✅ Supported formats: <strong className="text-white">PNG, JPG, WEBP, SVG</strong></span>
            <span>⚡ Instant Frontend Persistence</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
              selectedFilter === 'all'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            All Logos ({logoEntries.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('institutions')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
              selectedFilter === 'institutions'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            🏛 Official Insignias & Seals
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('system')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
              selectedFilter === 'system'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            ⚙️ App & Header Branding
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('locations')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
              selectedFilter === 'locations'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            📍 Portal Placement Views
          </button>
        </div>

        {/* Search */}
        <div className="w-full sm:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search logos..."
            className="w-full px-3.5 py-1.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
          />
        </div>
      </div>

      {/* Logo Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredLogos.map(logo => {
          return (
            <div
              key={logo.key}
              className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition group relative"
            >
              {/* Top Header info */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-800 border border-blue-200 mb-1">
                      {logo.category}
                    </span>
                    <h3 className="text-sm font-bold text-stone-900 leading-snug">{logo.title}</h3>
                  </div>
                  {/* Status Indicator */}
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      logo.visible ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-500'
                    }`}
                  >
                    {logo.visible ? <Eye className="w-3 h-3 text-emerald-600" /> : <EyeOff className="w-3 h-3" />}
                    {logo.visible ? 'Active' : 'Hidden'}
                  </span>
                </div>

                <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">{logo.description}</p>

                {/* Visual Preview Box */}
                <div
                  className={`w-full h-32 rounded-xl border flex items-center justify-center relative overflow-hidden transition ${
                    previewBg === 'light'
                      ? 'bg-slate-50 border-stone-200'
                      : previewBg === 'dark'
                      ? 'bg-slate-900 border-slate-800'
                      : 'bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:12px_12px] bg-slate-100 border-stone-200'
                  }`}
                >
                  {logo.currentUrl && logo.currentUrl.trim() !== '' ? (
                    <img
                      src={logo.currentUrl}
                      alt={logo.altText}
                      style={{ maxHeight: `${Math.min(logo.sizePx * 1.5, 96)}px` }}
                      className="max-w-[85%] object-contain drop-shadow-sm transition-transform group-hover:scale-105"
                      onError={e => {
                        // Fallback to vector if custom URL fails
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : logo.defaultComponent ? (
                    renderVectorSeal(logo.defaultComponent, 'w-20 h-20')
                  ) : (
                    <img src="/icon.svg" alt="System Logo" className="w-16 h-16 object-contain" />
                  )}

                  {/* Badge indicating source */}
                  <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md text-[9px] font-bold bg-white/90 shadow-2xs text-stone-600 border border-stone-200">
                    {logo.isCustomImage ? 'Custom Asset' : 'Vector Default'} • {logo.sizePx}px
                  </span>
                </div>

                {/* Placement Details */}
                <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1">
                  <span>Placement: <strong className="text-stone-700 capitalize">{logo.placement.replace('_', ' ')}</strong></span>
                  <span>Mobile: <strong className={logo.mobileVisible ? 'text-emerald-700' : 'text-stone-400'}>{logo.mobileVisible ? 'Shown' : 'Hidden'}</strong></span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenEditModal(logo)}
                  className="flex-1 py-2 px-3 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Change Image</span>
                </button>

                {logo.isCustomImage && (
                  <button
                    type="button"
                    onClick={() => handleResetSingleLogo(logo.key)}
                    title="Reset to default vector seal"
                    className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-stone-600" />
                  </button>
                )}

                {logo.key.startsWith('logo-partner-') && (
                  <button
                    type="button"
                    onClick={() => handleDeletePartnerLogo(logo.key)}
                    title="Delete partner logo"
                    className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ───────────────────── EDIT IMAGE MODAL ───────────────────── */}
      {editingLogoKey && activeEditingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-stone-200 space-y-6 my-8 animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-900 text-white flex items-center justify-center shadow-sm">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-stone-900">Edit Image & Logo Settings</h3>
                  <p className="text-xs text-stone-500 font-medium">
                    {activeEditingEntry.title}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseEditModal}
                className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current vs New Image Preview Comparison */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Current Image */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700">Current Image</label>
                <div className="h-32 rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center p-3 overflow-hidden">
                  {activeEditingEntry.currentUrl && activeEditingEntry.currentUrl.trim() !== '' ? (
                    <img
                      src={activeEditingEntry.currentUrl}
                      alt="Current"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : activeEditingEntry.defaultComponent ? (
                    renderVectorSeal(activeEditingEntry.defaultComponent, 'w-20 h-20')
                  ) : (
                    <img src="/icon.svg" alt="Default" className="w-16 h-16 object-contain" />
                  )}
                </div>
                <p className="text-[10px] text-stone-400 text-center">Active system logo</p>
              </div>

              {/* New Image Preview */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                  <span>New Image Preview</span>
                  {candidateUrl && <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">Staged</span>}
                </label>
                <div className="h-32 rounded-2xl bg-emerald-50/50 border-2 border-dashed border-emerald-300 flex items-center justify-center p-3 overflow-hidden relative">
                  {candidateUrl ? (
                    <img
                      src={candidateUrl}
                      alt="New Staged"
                      className="max-h-full max-w-full object-contain"
                      onError={() => setUrlError('Could not load image from this URL')}
                    />
                  ) : (
                    <div className="text-center text-stone-400 text-xs">
                      <ImageIcon className="w-8 h-8 mx-auto mb-1 text-stone-300" />
                      <span>Select or import new image below</span>
                    </div>
                  )}
                </div>
                {candidateFileName && (
                  <p className="text-[10px] text-emerald-700 text-center font-semibold truncate">
                    {candidateFileName} ({candidateFileSize})
                  </p>
                )}
              </div>
            </div>

            {/* Source Mode Tabs: Import from Device vs Use Image URL */}
            <div className="space-y-3">
              <div className="flex rounded-xl bg-stone-100 p-1 border border-stone-200">
                <button
                  type="button"
                  onClick={() => setActiveSourceMode('device')}
                  className={`flex-1 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                    activeSourceMode === 'device'
                      ? 'bg-white text-blue-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5 text-blue-700" />
                  <span>📁 Import Image from Device</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSourceMode('url')}
                  className={`flex-1 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                    activeSourceMode === 'url'
                      ? 'bg-white text-blue-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <LinkIcon className="w-3.5 h-3.5 text-blue-700" />
                  <span>🔗 Use Image URL</span>
                </button>
              </div>

              {/* Import from Device Body */}
              {activeSourceMode === 'device' ? (
                <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200 space-y-3 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="hidden"
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) handleFileSelect(f);
                    }}
                  />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-stone-800">Select an image file from your computer</p>
                    <p className="text-[11px] text-stone-500">Supports PNG, JPG, WEBP, or SVG (Max 10MB)</p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Browse Files on Device</span>
                    </button>
                    {candidateUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setCandidateUrl('');
                          setUrlInput('');
                          setCandidateFileName('');
                        }}
                        className="px-3 py-2.5 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold text-xs transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Clear Selection</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                /* Use Image URL Body */
                <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700">Image Web Address / URL</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        value={urlInput}
                        onChange={e => {
                          setUrlInput(e.target.value);
                          setUrlError(null);
                        }}
                        placeholder="https://example.gov.ph/images/official-seal.png"
                        className="flex-1 px-3.5 py-2 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleApplyUrl}
                        className="px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs transition cursor-pointer shrink-0"
                      >
                        Preview URL
                      </button>
                    </div>
                    {urlError && <p className="text-[11px] text-red-600 font-medium">{urlError}</p>}
                  </div>
                </div>
              )}
            </div>

            {/* Fine-Tuning Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-stone-50 p-4 rounded-2xl border border-stone-200">
              {/* Logo Title */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700">Image Name / Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              {/* Size Slider */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-stone-700">
                  <span>Display Size</span>
                  <span className="text-blue-900">{editSizePx} px</span>
                </div>
                <input
                  type="range"
                  min="24"
                  max="120"
                  step="2"
                  value={editSizePx}
                  onChange={e => setEditSizePx(Number(e.target.value))}
                  className="w-full accent-blue-900 cursor-pointer"
                />
              </div>

              {/* Alt Text */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700">Alt Text (Accessibility)</label>
                <input
                  type="text"
                  value={editAltText}
                  onChange={e => setEditAltText(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              {/* Placement */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700">Placement on Site</label>
                <select
                  value={editPlacement}
                  onChange={e => setEditPlacement(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                >
                  <option value="header_left">Header Left (Brand)</option>
                  <option value="header_right">Header Right (Partner)</option>
                  <option value="hero">Hero Section (Insignias)</option>
                  <option value="partners">Partners & Agencies</option>
                  <option value="footer">Footer Authority</option>
                </select>
              </div>

              {/* Visibility Switches */}
              <div className="flex items-center justify-between col-span-1 sm:col-span-2 pt-2 border-t border-stone-200">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-stone-700">
                  <input
                    type="checkbox"
                    checked={editVisible}
                    onChange={e => setEditVisible(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-900 accent-blue-900"
                  />
                  <span>Show on Desktop & Tablet</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-stone-700">
                  <input
                    type="checkbox"
                    checked={editMobileVisible}
                    onChange={e => setEditMobileVisible(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-900 accent-blue-900"
                  />
                  <span>Show on Mobile</span>
                </label>
              </div>
            </div>

            {/* Modal Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-stone-200">
              <button
                type="button"
                onClick={handleCloseEditModal}
                className="px-5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveLogoChanges}
                className="px-6 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-2 shadow-md transition cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────── ADD PARTNER LOGO MODAL ───────────────────── */}
      {isAddPartnerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-stone-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-lg font-black text-stone-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600" />
                Add Partner Agency Logo
              </h3>
              <button
                type="button"
                onClick={() => setIsAddPartnerOpen(false)}
                className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700">Agency Name</label>
                <input
                  type="text"
                  value={newPartnerName}
                  onChange={e => setNewPartnerName(e.target.value)}
                  placeholder="e.g. Bureau of Animal Industry (BAI)"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700">Institution / Department</label>
                <input
                  type="text"
                  value={newPartnerInst}
                  onChange={e => setNewPartnerInst(e.target.value)}
                  placeholder="e.g. Regional Field Office VIII"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700">Logo Image Source</label>
                <div className="flex gap-2">
                  <input
                    ref={partnerFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async e => {
                      const f = e.target.files?.[0];
                      if (f) {
                        try {
                          const res = await compressImageFile(f, {
                            maxWidth: 512,
                            maxHeight: 512,
                            quality: 0.88,
                          });
                          if (res?.dataUrl) {
                            setNewPartnerUrl(res.dataUrl);
                            showToast(`Optimized ${f.name} (${res.sizeStr})`, 'info');
                          }
                        } catch {
                          const reader = new FileReader();
                          reader.onload = ev => {
                            setNewPartnerUrl((ev.target?.result as string) || '');
                          };
                          reader.readAsDataURL(f);
                        }
                      }
                    }}
                  />
                  <input
                    type="text"
                    value={newPartnerUrl}
                    onChange={e => setNewPartnerUrl(e.target.value)}
                    placeholder="Image URL or Browse from device..."
                    className="flex-1 px-3.5 py-2 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => partnerFileInputRef.current?.click()}
                    className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs flex items-center gap-1 shrink-0 border border-stone-300"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Browse</span>
                  </button>
                </div>
              </div>

              {newPartnerUrl && (
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-center h-24">
                  <img src={newPartnerUrl} alt="Preview" className="max-h-full object-contain" />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setIsAddPartnerOpen(false)}
                className="px-4 py-2 rounded-xl bg-stone-100 text-stone-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreatePartnerLogo}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-xs"
              >
                <Check className="w-4 h-4" />
                <span>Add Partner Logo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────── RESET CONFIRM MODAL ───────────────────── */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-lg font-black text-stone-900">Reset All Logos to Defaults?</h3>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              This action will reset all custom uploaded logos, institutional insignias, and branding settings back to the default official Republic vector seals.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2 rounded-xl bg-stone-100 text-stone-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetAllToDefault}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Yes, Reset All</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useRef, useMemo } from 'react';
import {
  Image as ImageIcon,
  Upload,
  Link as LinkIcon,
  FolderOpen,
  Eye,
  EyeOff,
  Search,
  Filter,
  ArrowUpDown,
  LayoutGrid,
  List,
  Edit,
  Trash2,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Building,
  GraduationCap,
  Layers,
  Video,
  Share2,
  Sliders,
  CheckCircle,
  AlertTriangle,
  X,
  Plus,
  GripVertical,
  Check,
  Monitor,
  Tablet,
  Smartphone,
  Copy,
  ExternalLink,
  RotateCw,
  Sun,
  Contrast,
  ZoomIn,
  Move,
  Lock,
} from 'lucide-react';
import { LandingCmsConfig, MediaItem, OfficialLogoItem, MediaCategory, LogoPlacement } from '../../../types/landingCms';
import { landingCmsService } from '../../../services/landingCmsService';
import { compressImageFile } from '../../../utils/imageCompressor';
import { AccessDenied403 } from './AccessDenied403';
import { InsigniaCard } from './InsigniaCard';
import { SealDA, SealMunicipality, SealTaskForce, SealSLSU, SealExtension, OfficialSealBadge } from '../../common/OfficialSeals';
import { LiveLandingPreview } from '../landing/LiveLandingPreview';

interface PhotoMediaSettingsProps {
  currentUserRole?: string;
  onNavigateTab?: (tab: string) => void;
  onRefresh?: () => void;
  initialCategory?: MainCategoryTab;
}

type MainCategoryTab =
  | 'all'
  | 'hero'
  | 'background'
  | 'seals'
  | 'logos'
  | 'slsu'
  | 'extension'
  | 'gallery'
  | 'social'
  | 'videos'
  | 'other';

const CATEGORY_TABS: { id: MainCategoryTab; label: string; countKey?: string }[] = [
  { id: 'all', label: 'All Media' },
  { id: 'hero', label: 'Hero Images' },
  { id: 'background', label: 'Interface Background' },
  { id: 'seals', label: 'Municipal Seals' },
  { id: 'logos', label: 'Official Logos' },
  { id: 'slsu', label: 'SLSU' },
  { id: 'extension', label: 'Extension Center' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'social', label: 'Social Media' },
  { id: 'videos', label: 'Videos' },
  { id: 'other', label: 'Other' },
];

export const PhotoMediaSettings: React.FC<PhotoMediaSettingsProps> = ({
  currentUserRole = 'admin',
  onNavigateTab,
  onRefresh,
  initialCategory,
}) => {
  // STRICT ADMIN ACCESS CONTROL (Req #14 & #20)
  if (currentUserRole !== 'admin') {
    return <AccessDenied403 onBackToDashboard={() => onNavigateTab && onNavigateTab('dashboard')} />;
  }

  const [config, setConfig] = useState<LandingCmsConfig>(() => landingCmsService.getDraftConfig());
  const [publishedConfig, setPublishedConfig] = useState<LandingCmsConfig>(() =>
    landingCmsService.getPublishedConfig()
  );

  // Active Category Tab
  const [activeTab, setActiveTab] = useState<MainCategoryTab>(initialCategory || 'all');

  // View Mode & Filtering for Media Library
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'image' | 'video' | 'logo' | 'seal'>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'visible' | 'hidden'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name' | 'size'>('newest');

  // Modals & Drawers
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isPreviewWebsiteOpen, setIsPreviewWebsiteOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [selectedMediaForEdit, setSelectedMediaForEdit] = useState<MediaItem | null>(null);
  const [mediaToDelete, setMediaToDelete] = useState<{ item: MediaItem; usedIn: string[] } | null>(null);
  const [logoToDelete, setLogoToDelete] = useState<OfficialLogoItem | null>(null);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'warn' } | null>(
    null
  );

  const showToast = (text: string, type: 'success' | 'info' | 'warn' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const updateConfig = (updates: Partial<LandingCmsConfig>) => {
    setConfig(prev => {
      const next = { ...prev, ...updates };
      landingCmsService.saveDraft(next);
      return next;
    });
  };

  const handlePublishAll = () => {
    const pub = landingCmsService.publish(config);
    setPublishedConfig(pub);
    setConfig(pub);
    showToast('All photo & media settings published live to public website!', 'success');
    if (onRefresh) onRefresh();
  };

  // Upload Form State
  const [uploadFile, setUploadFile] = useState<{
    file: File | null;
    previewUrl: string;
    name: string;
    sizeStr: string;
    typeStr: string;
    dimensions: string;
  }>({
    file: null,
    previewUrl: '',
    name: '',
    sizeStr: '',
    typeStr: '',
    dimensions: '1920 × 1080',
  });

  const [uploadCategory, setUploadCategory] = useState<MediaCategory>('logos');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadAltText, setUploadAltText] = useState('');
  const [uploadPlacement, setUploadPlacement] = useState<string>('Hero');
  const [uploadVisible, setUploadVisible] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const bgFileInputRef = useRef<HTMLInputElement>(null);
  const [editImageSourceMode, setEditImageSourceMode] = useState<'device' | 'url'>('device');
  const [editCandidateUrl, setEditCandidateUrl] = useState<string>('');
  const [editUrlInput, setEditUrlInput] = useState<string>('');

  // Interface Background custom URL input state
  const [isBgUrlInputOpen, setIsBgUrlInputOpen] = useState(false);
  const [bgUrlDraft, setBgUrlDraft] = useState('');

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const f = files[0];
    
    // Choose appropriate compression profile based on target category
    const isLogoOrSeal = uploadCategory === 'logos' || uploadCategory === 'seals' || uploadPlacement === 'Partners' || uploadPlacement === 'Header';
    const isBackground = uploadCategory === 'backgrounds' || uploadPlacement === 'Background';

    const compressOpts = isLogoOrSeal
      ? { maxWidth: 512, maxHeight: 512, quality: 0.88 }
      : isBackground
      ? { maxWidth: 1920, maxHeight: 1080, quality: 0.82 }
      : { maxWidth: 1400, maxHeight: 1050, quality: 0.82 };

    try {
      const result = await compressImageFile(f, compressOpts);
      setUploadFile({
        file: f,
        previewUrl: result.dataUrl,
        name: f.name,
        sizeStr: result.sizeStr,
        typeStr: f.type || 'image/jpeg',
        dimensions: result.dimensions || (isLogoOrSeal ? '512 × 512 px' : '1600 × 1200 px'),
      });
      showToast(`Ready to upload: ${f.name} (${result.sizeStr})`, 'info');
    } catch {
      // Fallback if compression fails
      const objectUrl = URL.createObjectURL(f);
      const sizeInKb = Math.round(f.size / 1024);
      const sizeStr = sizeInKb > 1024 ? `${(sizeInKb / 1024).toFixed(1)} MB` : `${sizeInKb} KB`;

      setUploadFile({
        file: f,
        previewUrl: objectUrl,
        name: f.name,
        sizeStr,
        typeStr: f.type || 'image/jpeg',
        dimensions: '1600 × 1200 px',
      });
    }

    if (!uploadTitle) {
      setUploadTitle(f.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
    }
    if (!uploadAltText) {
      setUploadAltText(f.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
    }
  };

  const handleExecuteUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile.previewUrl && !uploadTitle) {
      showToast('Please select an image file or provide details.', 'warn');
      return;
    }

    const fallbackUrl =
      uploadFile.previewUrl ||
      'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=1200&q=80';

    const newItem: MediaItem = {
      id: 'med-' + Date.now(),
      name: uploadTitle || uploadFile.name || 'Uploaded Media',
      fileName: uploadFile.name || 'hinunangan-media-' + Date.now() + '.jpg',
      url: fallbackUrl,
      category: uploadCategory,
      fileSize: uploadFile.sizeStr || '350 KB',
      dimensions: uploadFile.dimensions || '1600 × 1200',
      uploadDate: new Date().toISOString().split('T')[0],
      altText: uploadAltText || uploadTitle || 'DA Hinunangan Media',
      caption: uploadDescription,
      placement: uploadPlacement,
      visible: uploadVisible,
      brightness: 100,
      contrast: 100,
      opacity: 100,
      rotation: 0,
      zoom: 100,
    };

    const updatedList = [newItem, ...(config.mediaItems || [])];
    const updates: Partial<LandingCmsConfig> = { mediaItems: updatedList };

    // Connect to Interface Background if category or placement matches
    if (uploadCategory === 'backgrounds' || uploadPlacement === 'Background' || uploadPlacement === 'Portal Background') {
      updates.interfaceBackground = {
        ...(config.interfaceBackground || ({} as any)),
        imageUrl: fallbackUrl,
        enabled: true,
      };
    }

    // Connect to Header Logo if placement is Header
    if (uploadPlacement === 'Header' || (uploadCategory === 'logos' && uploadPlacement === 'Header')) {
      updates.headerLogoUrl = fallbackUrl;
      updates.systemLogoUrl = fallbackUrl;
      updates.websiteLogoUrl = fallbackUrl;
    }

    // Connect to Footer Logo if placement is Footer
    if (uploadPlacement === 'Footer') {
      updates.footerLogoUrl = fallbackUrl;
    }

    // Connect to Hero Background if placement is Hero and it's a photo
    if (uploadPlacement === 'Hero' && uploadCategory !== 'logos' && uploadCategory !== 'seals') {
      updates.heroBackgroundUrl = fallbackUrl;
    }

    // Connect to About Image if placement is About or SLSU
    if (uploadPlacement === 'About' || uploadCategory === 'slsu' || uploadCategory === 'extension') {
      updates.aboutImageUrl = fallbackUrl;
    }

    // If placed in gallery, add to gallery
    if (uploadCategory === 'gallery' || uploadPlacement === 'Gallery') {
      updates.galleryPhotos = [
        ...(config.galleryPhotos || []),
        {
          id: 'gal-' + Date.now(),
          title: uploadTitle,
          caption: uploadDescription,
          imageUrl: fallbackUrl,
          category: 'Operations',
          showOnLanding: uploadVisible,
          order: (config.galleryPhotos || []).length + 1,
        },
      ];
    }

    // If category is seals or logos, also create official logo entry
    if (uploadCategory === 'logos' || uploadCategory === 'seals' || uploadCategory === 'Municipal Seals') {
      const newLogo: OfficialLogoItem = {
        id: 'logo-' + Date.now(),
        name: uploadTitle,
        institution: 'Municipality of Hinunangan',
        category: uploadCategory === 'seals' ? 'municipal' : 'da',
        url: fallbackUrl,
        placement: uploadPlacement.toLowerCase() === 'header' ? 'hero' : (uploadPlacement.toLowerCase() as any) || 'hero',
        sizePx: 48,
        spacingPx: 12,
        alignment: 'center',
        visible: uploadVisible,
        mobileVisible: true,
        variant: 'color',
        order: (config.officialLogos || []).length + 1,
      };
      updates.officialLogos = [...(config.officialLogos || []), newLogo];
    }

    updateConfig(updates);

    setIsUploadModalOpen(false);
    showToast(`Media "${newItem.name}" uploaded and placed successfully!`, 'success');

    // Reset upload state
    setUploadFile({
      file: null,
      previewUrl: '',
      name: '',
      sizeStr: '',
      typeStr: '',
      dimensions: '1920 × 1080',
    });
    setUploadTitle('');
    setUploadDescription('');
    setUploadAltText('');
  };

  // Helper to check where a media is used
  const checkMediaUsage = (item: MediaItem): string[] => {
    const usages: string[] = [];
    if (config.heroBackgroundUrl === item.url) usages.push('Hero Section Background');
    if (config.interfaceBackground?.imageUrl === item.url) usages.push('Interface Background Photo');
    if (config.aboutImageUrl === item.url) usages.push('About & Academic Section');
    if (config.systemLogoUrl === item.url) usages.push('System Logo / Favicon');
    if (config.headerLogoUrl === item.url) usages.push('Header Logo');
    if (config.footerLogoUrl === item.url) usages.push('Footer Logo');
    if (config.galleryPhotos?.some(g => g.imageUrl === item.url)) usages.push('Website Gallery');
    if (config.officialLogos?.some(l => l.url === item.url)) usages.push('Official Logos & Seals');
    if (config.videos?.some(v => v.thumbnailUrl === item.url)) usages.push('Video Thumbnail');
    return usages;
  };

  const handleRequestDeleteMedia = (item: MediaItem) => {
    const usedIn = checkMediaUsage(item);
    setMediaToDelete({ item, usedIn });
  };

  const handleConfirmDeleteMedia = () => {
    if (!mediaToDelete) return;
    const id = mediaToDelete.item.id;
    const url = mediaToDelete.item.url;

    // Remove from mediaItems
    const updatedMedia = (config.mediaItems || []).filter(m => m.id !== id);

    // Remove from gallery if matched
    const updatedGallery = (config.galleryPhotos || []).filter(g => g.imageUrl !== url);

    // Remove from logos if matched
    const updatedLogos = (config.officialLogos || []).filter(l => l.url !== url);

    updateConfig({
      mediaItems: updatedMedia,
      galleryPhotos: updatedGallery,
      officialLogos: updatedLogos,
    });

    showToast(`Media item deleted successfully.`, 'info');
    setMediaToDelete(null);
    if (selectedMediaForEdit?.id === id) setSelectedMediaForEdit(null);
  };

  // Reordering helpers
  const handleUpdateLogo = (logoId: string, updates: Partial<OfficialLogoItem>) => {
    const list = (config.officialLogos || []).map(l =>
      l.id === logoId ? { ...l, ...updates } : l
    );
    updateConfig({ officialLogos: list });
    landingCmsService.updateOfficialLogo(logoId, updates);
  };

  const handleMoveLogo = (index: number, direction: 'up' | 'down') => {
    const list = [...(config.officialLogos || [])];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;
    // update order indices
    const reordered = list.map((item, idx) => ({ ...item, order: idx + 1 }));
    updateConfig({ officialLogos: reordered });
    landingCmsService.reorderOfficialLogos(reordered);
    showToast('Insignias reordered successfully.', 'info');
  };

  const handleDeleteLogo = (logo: OfficialLogoItem) => {
    const updated = (config.officialLogos || []).filter(l => l.id !== logo.id);
    updateConfig({ officialLogos: updated });
    landingCmsService.reorderOfficialLogos(updated);
    showToast(`Deleted insignia ${logo.name}`, 'info');
  };

  const handleToggleLogoVisibility = (logoId: string) => {
    const list = (config.officialLogos || []).map(l =>
      l.id === logoId ? { ...l, visible: !l.visible } : l
    );
    updateConfig({ officialLogos: list });
    showToast('Logo visibility toggled.', 'info');
  };

  const handleToggleMediaVisibility = (mediaId: string) => {
    const list = (config.mediaItems || []).map(m =>
      m.id === mediaId ? { ...m, visible: m.visible === false ? true : false } : m
    );
    updateConfig({ mediaItems: list });
    showToast('Media visibility updated.', 'info');
  };

  // Filtered and Sorted Media Items
  const filteredMedia = useMemo(() => {
    let list = config.mediaItems || [];

    // Filter by Active Tab
    if (activeTab === 'hero') {
      list = list.filter(m => m.category === 'hero' || m.placement === 'Hero' || m.name?.toLowerCase().includes('hero'));
    } else if (activeTab === 'background') {
      list = list.filter(
        m => m.category === 'backgrounds' || m.category === 'Backgrounds' || m.placement === 'Background' || m.name?.toLowerCase().includes('background')
      );
    } else if (activeTab === 'seals') {
      list = list.filter(
        m => m.category === 'seals' || m.category === 'Municipal Seals' || m.name?.toLowerCase().includes('seal')
      );
    } else if (activeTab === 'logos') {
      list = list.filter(
        m => m.category === 'logos' || m.category === 'Logos' || m.name?.toLowerCase().includes('logo')
      );
    } else if (activeTab === 'slsu') {
      list = list.filter(
        m => m.category === 'slsu' || m.category === 'SLSU' || m.name?.toLowerCase().includes('slsu')
      );
    } else if (activeTab === 'extension') {
      list = list.filter(
        m =>
          m.category === 'extension' ||
          m.category === 'Extension Center' ||
          m.name?.toLowerCase().includes('extension')
      );
    } else if (activeTab === 'gallery') {
      list = list.filter(
        m => m.category === 'gallery' || m.category === 'Gallery' || m.placement === 'Gallery'
      );
    } else if (activeTab === 'social') {
      list = list.filter(
        m => m.category === 'social' || m.category === 'Social Media' || m.name?.toLowerCase().includes('facebook')
      );
    } else if (activeTab === 'videos') {
      list = list.filter(
        m => m.category === 'videos' || m.category === 'Videos' || m.url.includes('youtube') || m.fileType?.includes('video')
      );
    } else if (activeTab === 'other') {
      list = list.filter(m => m.category === 'other' || m.category === 'icons');
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        m =>
          m.name?.toLowerCase().includes(q) ||
          m.fileName?.toLowerCase().includes(q) ||
          m.altText?.toLowerCase().includes(q) ||
          m.caption?.toLowerCase().includes(q) ||
          m.category?.toLowerCase().includes(q)
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      if (typeFilter === 'logo') {
        list = list.filter(m => m.category === 'logos' || m.name?.toLowerCase().includes('logo'));
      } else if (typeFilter === 'seal') {
        list = list.filter(m => m.category === 'seals' || m.name?.toLowerCase().includes('seal'));
      } else if (typeFilter === 'video') {
        list = list.filter(m => m.category === 'videos' || m.fileType?.includes('video'));
      } else if (typeFilter === 'image') {
        list = list.filter(m => m.category !== 'videos');
      }
    }

    // Visibility filter
    if (visibilityFilter === 'visible') {
      list = list.filter(m => m.visible !== false);
    } else if (visibilityFilter === 'hidden') {
      list = list.filter(m => m.visible === false);
    }

    // Sort
    const sorted = [...list].sort((a, b) => {
      if (sortBy === 'newest') {
        return (b.uploadDate || '').localeCompare(a.uploadDate || '');
      }
      if (sortBy === 'oldest') {
        return (a.uploadDate || '').localeCompare(b.uploadDate || '');
      }
      if (sortBy === 'name') {
        return (a.name || '').localeCompare(b.name || '');
      }
      if (sortBy === 'size') {
        return parseInt(b.fileSize || '0') - parseInt(a.fileSize || '0');
      }
      return 0;
    });

    return sorted;
  }, [config.mediaItems, activeTab, searchQuery, typeFilter, visibilityFilter, sortBy]);

  // Counts for Category Badges
  const counts = useMemo(() => {
    const all = config.mediaItems || [];
    return {
      all: all.length,
      hero: all.filter(m => m.category === 'hero' || m.placement === 'Hero').length,
      background: all.filter(m => m.category === 'backgrounds' || m.category === 'Backgrounds' || m.placement === 'Background').length,
      seals: all.filter(m => m.category === 'seals' || m.category === 'Municipal Seals').length,
      logos: all.filter(m => m.category === 'logos' || m.category === 'Logos').length,
      slsu: all.filter(m => m.category === 'slsu' || m.category === 'SLSU').length,
      extension: all.filter(m => m.category === 'extension' || m.category === 'Extension Center').length,
      gallery: (config.galleryPhotos || []).length,
      social: (config.socialPosts || []).length,
      videos: (config.videos || []).length,
      other: all.filter(m => m.category === 'other' || m.category === 'icons').length,
    };
  }, [config]);

  // Render vector seal helper
  const renderVectorSeal = (sealKey?: string, className: string = 'w-12 h-12') => {
    if (sealKey === 'SealDA') return <SealDA className={className} />;
    if (sealKey === 'SealMunicipality') return <SealMunicipality className={className} />;
    if (sealKey === 'SealTaskForce') return <SealTaskForce className={className} />;
    if (sealKey === 'SealSLSU') return <SealSLSU className={className} />;
    if (sealKey === 'SealExtension') return <SealExtension className={className} />;
    return <SealMunicipality className={className} />;
  };

  return (
    <div className="py-6 px-4 sm:px-6 max-w-7xl mx-auto space-y-6 pb-24 font-sans text-stone-900">
      {/* Toast Banner */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 py-3 px-5 rounded-2xl shadow-xl flex items-center gap-3 text-white text-xs font-bold transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-700 shadow-emerald-900/30'
              : toastMessage.type === 'warn'
              ? 'bg-amber-600 shadow-amber-900/30'
              : 'bg-blue-700 shadow-blue-900/30'
          }`}
        >
          {toastMessage.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-200" />}
          {toastMessage.type === 'warn' && <AlertTriangle className="w-4 h-4 text-amber-200" />}
          {toastMessage.type === 'info' && <Sparkles className="w-4 h-4 text-blue-200" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* TOP HEADER (Req #2: Admin Photo & Media Page) */}
      <div className="bg-gradient-to-r from-[#064e3b] via-[#043629] to-[#022c22] rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-emerald-900/50 relative overflow-hidden">
        {/* Background decorative watermark */}
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-6">
          <ShieldCheck className="w-72 h-72 text-white" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
              <Lock className="w-3.5 h-3.5" />
              <span>ADMINISTRATOR ACCESS ONLY • DA HINUNANGAN MAO</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <ImageIcon className="w-8 h-8 text-emerald-400" />
              <span>Photo & Media Settings</span>
            </h1>
            <p className="text-emerald-100/80 text-xs sm:text-sm max-w-2xl font-normal leading-relaxed">
              Manage all images, logos, emblems, backgrounds, videos, and media displayed on the public website.
            </p>
          </div>

          {/* Top 3 Required Action Buttons (Req #2) */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer shadow-lg shadow-emerald-950/40"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              <span>+ Upload Media</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('all');
                showToast('Switched to Media Library view', 'info');
              }}
              className="py-2.5 px-4 rounded-xl bg-emerald-900/80 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm border border-emerald-700/60 flex items-center gap-2 transition cursor-pointer"
            >
              <FolderOpen className="w-4 h-4 text-emerald-300" />
              <span>Media Library</span>
            </button>

            <button
              type="button"
              onClick={() => setIsPreviewWebsiteOpen(true)}
              className="py-2.5 px-4 rounded-xl bg-white text-emerald-950 hover:bg-emerald-50 font-bold text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer shadow-md"
            >
              <Eye className="w-4 h-4 text-emerald-800" />
              <span>Preview Website</span>
            </button>

            <button
              type="button"
              onClick={handlePublishAll}
              className="py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-stone-950 font-black text-xs sm:text-sm flex items-center gap-1.5 transition cursor-pointer shadow-md"
            >
              <Check className="w-4 h-4 text-stone-950" />
              <span>Publish Live</span>
            </button>
          </div>
        </div>
      </div>

      {/* QUICK SUMMARY METRICS BAR (Req #16 data overview) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div
          onClick={() => setActiveTab('all')}
          className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs hover:border-emerald-500 transition cursor-pointer"
        >
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">Media Files</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl sm:text-2xl font-black text-stone-900">{counts.all}</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
              <FolderOpen className="w-4 h-4" />
            </span>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('logos')}
          className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs hover:border-emerald-500 transition cursor-pointer"
        >
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">Official Logos</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl sm:text-2xl font-black text-emerald-800">
              {(config.officialLogos || []).length}
            </span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-700">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('background')}
          className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs hover:border-emerald-500 transition cursor-pointer"
        >
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">Backgrounds</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl sm:text-2xl font-black text-purple-800">{counts.background || 5}</span>
            <span className="p-1.5 rounded-lg bg-purple-50 text-purple-700">
              <ImageIcon className="w-4 h-4" />
            </span>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('gallery')}
          className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs hover:border-emerald-500 transition cursor-pointer"
        >
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">Gallery Photos</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl sm:text-2xl font-black text-amber-800">{counts.gallery || 10}</span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
              <Layers className="w-4 h-4" />
            </span>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('videos')}
          className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs hover:border-emerald-500 transition cursor-pointer col-span-2 sm:col-span-1"
        >
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">Videos & Guides</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl sm:text-2xl font-black text-red-800">{counts.videos || 3}</span>
            <span className="p-1.5 rounded-lg bg-red-50 text-red-700">
              <Video className="w-4 h-4" />
            </span>
          </div>
        </div>
      </div>

      {/* MEDIA CATEGORY TABS (Req #3) */}
      <div className="bg-white p-2 rounded-2xl border border-stone-200 shadow-xs overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          {CATEGORY_TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? 'bg-emerald-800 text-white shadow-sm'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                    isActive ? 'bg-emerald-700 text-emerald-100' : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  {counts[tab.id as keyof typeof counts] ?? 0}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 4: CONFIGURED OFFICIAL INSIGNIAS & SEALS (Admin-Only Insignia Management) */}
      {(activeTab === 'logos' || activeTab === 'seals' || activeTab === 'slsu' || activeTab === 'extension' || activeTab === 'all') && (
        <div id="section-official-insignias" className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 border-stone-100">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Configured Official Insignias & Seals (Admin Only)</span>
              </div>
              <h2 className="text-xl font-bold text-stone-900 mt-1">
                Official Institutional Seals & Emblems
              </h2>
              <p className="text-xs text-stone-500">
                Change, replace, or customize each official insignia (DA, LGU Hinunangan, SLSU, Extension Center, and ASF Task Force) independently with direct device import or image links.
              </p>
            </div>
            <button
              type="button"
              id="btn-add-official-insignia"
              onClick={() => {
                setUploadCategory('seals');
                setUploadPlacement('Header');
                setIsUploadModalOpen(true);
              }}
              className="py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-xs self-start"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Official Insignia / Seal</span>
            </button>
          </div>

          {/* Insignias Cards Grid with Individual Change Image Modals */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {(config.officialLogos || []).map((logo, idx) => (
              <InsigniaCard
                key={logo.id}
                logo={logo}
                index={idx}
                totalLogos={(config.officialLogos || []).length}
                onUpdateLogo={handleUpdateLogo}
                onMoveLogo={handleMoveLogo}
                onDeleteLogo={handleDeleteLogo}
                onToast={showToast}
              />
            ))}
          </div>
        </div>
      )}

      {/* SECTION 5: INTERFACE BACKGROUND PHOTO (Dedicated Card View) */}
      {(activeTab === 'background' || activeTab === 'all') && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 border-stone-100">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[11px] font-bold">
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Section 5: Portal Aesthetic</span>
              </div>
              <h2 className="text-xl font-bold text-stone-900 mt-1">Interface Background Photo</h2>
              <p className="text-xs text-stone-500">
                Configure background photos, device targets, overlays, brightness, and real-time blur for the portal.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={bgFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async e => {
                  const f = e.target.files?.[0];
                  if (f) {
                    try {
                      const res = await compressImageFile(f, {
                        maxWidth: 1920,
                        maxHeight: 1080,
                        quality: 0.82,
                      });
                      if (res?.dataUrl) {
                        updateConfig({
                          interfaceBackground: {
                            ...(config.interfaceBackground || ({} as any)),
                            imageUrl: res.dataUrl,
                            enabled: true,
                          },
                        });
                        showToast(`Uploaded & applied ${f.name} (${res.sizeStr}) as Interface Background!`, 'success');
                      }
                    } catch {
                      showToast('Failed to upload background image from device.', 'warn');
                    }
                  }
                }}
              />
              <button
                type="button"
                onClick={() => bgFileInputRef.current?.click()}
                className="py-2 px-3.5 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Photo</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setBgUrlDraft(config.interfaceBackground?.imageUrl || '');
                  setIsBgUrlInputOpen(prev => !prev);
                }}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition ${
                  isBgUrlInputOpen
                    ? 'bg-purple-50 text-purple-800 border-purple-300'
                    : 'border-stone-300 hover:bg-stone-50 text-stone-700'
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>URL</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  updateConfig({
                    interfaceBackground: {
                      ...(config.interfaceBackground || ({} as any)),
                      imageUrl: '',
                      enabled: false,
                    },
                  });
                  setBgUrlDraft('');
                  setIsBgUrlInputOpen(false);
                  showToast('Interface background deleted and reset to clean neutral backdrop.', 'info');
                }}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition ${
                  config.interfaceBackground?.imageUrl
                    ? 'border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100'
                    : 'border-stone-200 text-stone-400 bg-stone-50'
                }`}
                title="Delete current interface background image"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>

          {/* Interactive URL Input Accordion Bar */}
          {isBgUrlInputOpen && (
            <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-2 animate-in fade-in duration-200">
              <label className="text-xs font-bold text-purple-950 block">
                Enter Direct Image URL for Interface Background:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={bgUrlDraft}
                  onChange={e => setBgUrlDraft(e.target.value)}
                  placeholder="https://images.unsplash.com/... or web image link"
                  className="flex-1 px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-purple-600 font-mono"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!bgUrlDraft.trim()) {
                      showToast('Please enter an image URL', 'warn');
                      return;
                    }
                    updateConfig({
                      interfaceBackground: {
                        ...(config.interfaceBackground || ({} as any)),
                        imageUrl: bgUrlDraft.trim(),
                        enabled: true,
                      },
                    });
                    setIsBgUrlInputOpen(false);
                    showToast('Interface background photo updated from URL!', 'success');
                  }}
                  className="py-2 px-4 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs cursor-pointer shadow-xs"
                >
                  Apply URL
                </button>
                <button
                  type="button"
                  onClick={() => setIsBgUrlInputOpen(false)}
                  className="py-2 px-3 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Controls & Live Preview Split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Controls */}
            <div className="lg:col-span-7 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-stone-700 block">Desktop Image URL</label>
                <input
                  type="text"
                  value={config.interfaceBackground?.imageUrl || ''}
                  onChange={e =>
                    updateConfig({
                      interfaceBackground: {
                        ...(config.interfaceBackground || ({} as any)),
                        imageUrl: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-stone-50/50 focus:bg-white focus:ring-2 focus:ring-purple-500 font-mono text-xs"
                  placeholder="https://..."
                />
              </div>

              {/* Position & Size */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-stone-700 block">Background Size</label>
                  <select
                    value={config.interfaceBackground?.fit || 'cover'}
                    onChange={e =>
                      updateConfig({
                        interfaceBackground: {
                          ...(config.interfaceBackground || ({} as any)),
                          fit: e.target.value as any,
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white"
                  >
                    <option value="cover">Cover (Full Screen Fill)</option>
                    <option value="contain">Contain (Fit in View)</option>
                    <option value="auto">Auto (Original Dimensions)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-stone-700 block">Background Position</label>
                  <select
                    value={config.interfaceBackground?.position || 'center'}
                    onChange={e =>
                      updateConfig({
                        interfaceBackground: {
                          ...(config.interfaceBackground || ({} as any)),
                          position: e.target.value as any,
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white"
                  >
                    <option value="center">Center</option>
                    <option value="top">Top</option>
                    <option value="bottom">Bottom</option>
                    <option value="left">Left</option>
                    <option value="right">Right</option>
                  </select>
                </div>
              </div>

              {/* Sliders: Opacity, Brightness, Blur */}
              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <div className="flex justify-between font-bold text-stone-700">
                    <span>Overlay Opacity</span>
                    <span className="text-purple-700">{config.interfaceBackground?.overlayOpacity ?? 35}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={config.interfaceBackground?.overlayOpacity ?? 35}
                    onChange={e =>
                      updateConfig({
                        interfaceBackground: {
                          ...(config.interfaceBackground || ({} as any)),
                          overlayOpacity: parseInt(e.target.value),
                        },
                      })
                    }
                    className="w-full accent-purple-600"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between font-bold text-stone-700">
                    <span>Brightness Level</span>
                    <span className="text-purple-700">{config.interfaceBackground?.brightness ?? 100}%</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="200"
                    value={config.interfaceBackground?.brightness ?? 100}
                    onChange={e =>
                      updateConfig({
                        interfaceBackground: {
                          ...(config.interfaceBackground || ({} as any)),
                          brightness: parseInt(e.target.value),
                        },
                      })
                    }
                    className="w-full accent-purple-600"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between font-bold text-stone-700">
                    <span>Blur Radius</span>
                    <span className="text-purple-700">{config.interfaceBackground?.blur ?? 0} px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={config.interfaceBackground?.blur ?? 0}
                    onChange={e =>
                      updateConfig({
                        interfaceBackground: {
                          ...(config.interfaceBackground || ({} as any)),
                          blur: parseInt(e.target.value),
                        },
                      })
                    }
                    className="w-full accent-purple-600"
                  />
                </div>
              </div>
            </div>

            {/* Right Live Interactive Preview Box (Req #5) */}
            <div className="lg:col-span-5 flex flex-col justify-between">
              <div className="space-y-1 mb-2">
                <div className="flex items-center justify-between text-xs font-bold text-stone-700">
                  <span>Immediate Live Render</span>
                  <span className="text-emerald-700 text-[10px]">Real-time preview</span>
                </div>
              </div>

              <div className="w-full h-64 sm:h-72 rounded-2xl border-2 border-stone-200 overflow-hidden relative shadow-inner flex items-center justify-center bg-stone-900">
                {/* Applied Background */}
                <div
                  className="absolute inset-0 transition-all duration-300"
                  style={{
                    backgroundImage: `url(${
                      config.interfaceBackground?.imageUrl ||
                      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80'
                    })`,
                    backgroundPosition: config.interfaceBackground?.position || 'center',
                    backgroundSize: config.interfaceBackground?.fit || 'cover',
                    filter: `brightness(${
                      (config.interfaceBackground?.brightness ?? 100) / 100
                    }) blur(${config.interfaceBackground?.blur ?? 0}px)`,
                  }}
                />
                {/* Overlay Tint */}
                <div
                  className="absolute inset-0 transition-all"
                  style={{
                    backgroundColor: config.interfaceBackground?.overlayColor || '#064e3b',
                    opacity: (config.interfaceBackground?.overlayOpacity ?? 35) / 100,
                  }}
                />

                {/* Simulated Content Box on Top */}
                <div className="relative z-10 text-center p-4 text-white max-w-xs space-y-2">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md mx-auto flex items-center justify-center border border-white/30">
                    <ShieldCheck className="w-5 h-5 text-emerald-300" />
                  </div>
                  <h4 className="font-black text-sm text-white drop-shadow-md">DA HINUNANGAN SWINE REGISTRY</h4>
                  <p className="text-[11px] text-white/80 leading-tight">
                    Livestock traceability & ASF protection in Southern Leyte.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 6: SLSU EXTENSION CENTER & EMBLEMS (Dedicated View) */}
      {(activeTab === 'slsu' || activeTab === 'extension') && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 border-stone-100">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[11px] font-bold">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Section 6: Academic & Research Partner</span>
              </div>
              <h2 className="text-xl font-bold text-stone-900 mt-1">SLSU Extension Center & Emblems</h2>
              <p className="text-xs text-stone-500">
                Southern Leyte State University (SLSU) Extension Center photos, research facility media, and academic seals.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setUploadCategory('SLSU');
                setUploadPlacement('About');
                setIsUploadModalOpen(true);
              }}
              className="py-2 px-4 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-xs self-start"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add SLSU Media / Facility Photo</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Dedicated SLSU Seal Card */}
            <div className="p-5 rounded-2xl bg-blue-50/50 border border-blue-200 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-full bg-blue-200 text-blue-900 font-bold text-[10px]">
                  Institutional Emblem
                </span>
                <span className="text-[10px] text-blue-700 font-semibold">Active Vector</span>
              </div>
              <div className="h-32 flex items-center justify-center">
                <SealSLSU className="w-24 h-24 drop-shadow-md" />
              </div>
              <div className="space-y-1 text-xs">
                <div className="font-bold text-stone-900">SLSU Official Seal</div>
                <p className="text-[11px] text-stone-500">
                  Southern Leyte State University Main & Hinunangan Extension
                </p>
              </div>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-blue-200/60">
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Visible
                </span>
                <button
                  onClick={() => showToast('SLSU vector emblem is locked to official standard.', 'info')}
                  className="text-blue-800 font-bold hover:underline"
                >
                  Standard Rules
                </button>
              </div>
            </div>

            {/* SLSU Extension Center Hinunangan Emblem */}
            <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 font-bold text-[10px]">
                  Extension Center Badge
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold">Official Partner</span>
              </div>
              <div className="h-32 flex items-center justify-center">
                <SealExtension className="w-24 h-24 drop-shadow-md" />
              </div>
              <div className="space-y-1 text-xs">
                <div className="font-bold text-stone-900">SLSU Extension Center Hinunangan</div>
                <p className="text-[11px] text-stone-500">
                  Agricultural biosafety technology, veterinary training, and research trials.
                </p>
              </div>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-emerald-200/60">
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Placed on Landing
                </span>
                <button
                  onClick={() => showToast('Extension Center badge active on about & header.', 'info')}
                  className="text-emerald-800 font-bold hover:underline"
                >
                  Active Placement
                </button>
              </div>
            </div>

            {/* Research & Facility Demonstration Photo */}
            <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 font-bold text-[10px]">
                  Facility Demonstration
                </span>
                <span className="text-[10px] text-stone-400">1200 × 800</span>
              </div>
              <div className="h-32 rounded-xl overflow-hidden bg-stone-100">
                <img
                  src="https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=600&q=80"
                  alt="SLSU Facility"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-1 text-xs">
                <div className="font-bold text-stone-900">Demonstration Swine Pen & Biosecurity Gate</div>
                <p className="text-[11px] text-stone-500">
                  SLSU Hinunangan field trial facility with footbath quarantine.
                </p>
              </div>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-stone-100">
                <span className="text-emerald-700 font-bold">About Section</span>
                <button
                  onClick={() => {
                    const url = prompt('Replace SLSU facility photo URL:');
                    if (url) {
                      updateConfig({ aboutImageUrl: url });
                      showToast('SLSU facility photo updated.', 'success');
                    }
                  }}
                  className="text-stone-700 font-bold hover:underline"
                >
                  Replace Photo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 8: MASTER MEDIA LIBRARY (Req #8: Search, Filter, Sort, Grid/List, Cards) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b pb-4 border-stone-100">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md bg-stone-100 text-stone-800 text-[11px] font-bold">
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Section 8: Professional Media Library</span>
            </div>
            <h2 className="text-xl font-bold text-stone-900 mt-1">All Uploaded Media Assets</h2>
            <p className="text-xs text-stone-500">
              Showing {filteredMedia.length} of {(config.mediaItems || []).length} media records.
            </p>
          </div>

          {/* Search & Layout Toggle */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search media..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-300 text-xs bg-stone-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as any)}
              className="px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white text-stone-700 font-semibold"
            >
              <option value="all">All Types</option>
              <option value="image">Images</option>
              <option value="logo">Logos</option>
              <option value="seal">Municipal Seals</option>
              <option value="video">Videos</option>
            </select>

            {/* Visibility Filter */}
            <select
              value={visibilityFilter}
              onChange={e => setVisibilityFilter(e.target.value as any)}
              className="px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white text-stone-700 font-semibold"
            >
              <option value="all">All Visibility</option>
              <option value="visible">Visible Only</option>
              <option value="hidden">Hidden Only</option>
            </select>

            {/* Sort Filter */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white text-stone-700 font-semibold"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Name (A-Z)</option>
              <option value="size">File Size</option>
            </select>

            {/* Grid / List Toggle */}
            <div className="flex items-center rounded-xl border border-stone-300 p-1 bg-stone-50">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'grid' ? 'bg-white text-emerald-800 shadow-xs' : 'text-stone-400 hover:text-stone-700'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'list' ? 'bg-white text-emerald-800 shadow-xs' : 'text-stone-400 hover:text-stone-700'
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Media Grid / List Content */}
        {filteredMedia.length === 0 ? (
          <div className="py-16 text-center space-y-3 bg-stone-50 rounded-2xl border-2 border-dashed border-stone-200">
            <FolderOpen className="w-12 h-12 text-stone-300 mx-auto" />
            <h3 className="font-bold text-stone-700 text-sm">No Media Files Found</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              No images match your active category or filter terms. Click "+ Upload Media" to add new photos.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setTypeFilter('all');
                setVisibilityFilter('all');
                setActiveTab('all');
              }}
              className="py-1.5 px-4 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-bold cursor-pointer"
            >
              Clear Filters
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View Cards (Req #8 & #10) */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredMedia.map(item => {
              const usedIn = checkMediaUsage(item);
              const isVisible = item.visible !== false;
              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden group ${
                    isVisible
                      ? 'bg-white border-stone-200 hover:border-emerald-500 hover:shadow-md'
                      : 'bg-stone-50 border-dashed border-stone-300 opacity-80'
                  }`}
                >
                  {/* Top Image Preview */}
                  <div
                    onClick={() => setSelectedMediaForEdit(item)}
                    className="w-full h-44 bg-stone-100 relative overflow-hidden flex items-center justify-center cursor-pointer"
                  >
                    <img
                      src={item.url}
                      alt={item.altText || item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />

                    {/* Category Badge overlay */}
                    <div className="absolute top-2.5 left-2.5 z-10 flex flex-wrap gap-1">
                      <span className="px-2 py-0.5 rounded-md bg-stone-900/80 backdrop-blur-xs text-white text-[10px] font-bold capitalize">
                        {item.category}
                      </span>
                      {usedIn.length > 0 && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-600/90 text-white text-[10px] font-bold">
                          In Use ({usedIn.length})
                        </span>
                      )}
                    </div>

                    {/* Visibility Pill */}
                    <div className="absolute top-2.5 right-2.5 z-10">
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          handleToggleMediaVisibility(item.id);
                        }}
                        className={`p-1.5 rounded-full backdrop-blur-xs shadow-xs transition ${
                          isVisible ? 'bg-emerald-600/90 text-white' : 'bg-stone-700/80 text-stone-300'
                        }`}
                        title={isVisible ? 'Visible on website' : 'Hidden'}
                      >
                        {isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  {/* Metadata Info (Req #8) */}
                  <div className="p-3.5 space-y-1.5 text-xs flex-1 flex flex-col justify-between">
                    <div>
                      <div className="font-bold text-stone-900 truncate" title={item.name}>
                        {item.name || item.fileName}
                      </div>
                      <div className="font-mono text-[11px] text-stone-400 truncate">
                        {item.fileName || 'hinunangan-media.jpg'}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-stone-500 pt-2 border-t border-stone-100">
                      <span>{item.dimensions || '1600 × 1200'}</span>
                      <span className="font-semibold text-stone-700">{item.fileSize || '245 KB'}</span>
                    </div>
                  </div>

                  {/* Actions Bar [Edit] [Replace] [Use] [Delete] (Req #8) */}
                  <div className="p-2.5 bg-stone-50/70 border-t border-stone-100 grid grid-cols-4 gap-1 text-[11px] font-bold text-stone-700">
                    <button
                      type="button"
                      onClick={() => setSelectedMediaForEdit(item)}
                      className="py-1.5 px-1 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 flex items-center justify-center gap-1 cursor-pointer"
                      title="Edit Details & Adjustments"
                    >
                      <Edit className="w-3 h-3" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const newUrl = prompt('Enter new URL to replace this image:', item.url);
                        if (newUrl) {
                          const updated = (config.mediaItems || []).map(m =>
                            m.id === item.id ? { ...m, url: newUrl } : m
                          );
                          updateConfig({ mediaItems: updated });
                          showToast('Media replaced successfully.', 'success');
                        }
                      }}
                      className="py-1.5 px-1 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 flex items-center justify-center gap-1 cursor-pointer"
                      title="Replace File"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Swap</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(item.url);
                        showToast('Image URL copied to clipboard!', 'info');
                      }}
                      className="py-1.5 px-1 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 flex items-center justify-center gap-1 cursor-pointer"
                      title="Copy URL"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Use</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRequestDeleteMedia(item)}
                      className="py-1.5 px-1 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-red-600 flex items-center justify-center gap-1 cursor-pointer"
                      title="Delete Media"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Del</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View Table */
          <div className="overflow-x-auto border border-stone-200 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3">Preview</th>
                  <th className="p-3">Filename / Title</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Dimensions</th>
                  <th className="p-3">Size</th>
                  <th className="p-3">Placement</th>
                  <th className="p-3">Visibility</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredMedia.map(item => {
                  const isVisible = item.visible !== false;
                  return (
                    <tr key={item.id} className="hover:bg-stone-50/80 transition">
                      <td className="p-3">
                        <img
                          src={item.url}
                          alt={item.name}
                          className="w-12 h-10 object-cover rounded-lg border border-stone-200"
                          referrerPolicy="no-referrer"
                        />
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-stone-900">{item.name}</div>
                        <div className="font-mono text-[10px] text-stone-400">{item.fileName}</div>
                      </td>
                      <td className="p-3 capitalize font-semibold text-stone-700">{item.category}</td>
                      <td className="p-3 text-stone-500 font-mono text-[11px]">{item.dimensions || '1600 × 1200'}</td>
                      <td className="p-3 text-stone-700 font-semibold">{item.fileSize || '245 KB'}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-[10px] font-bold">
                          {item.placement || 'General'}
                        </span>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => handleToggleMediaVisibility(item.id)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 cursor-pointer ${
                            isVisible ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'
                          }`}
                        >
                          {isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          <span>{isVisible ? 'Visible' : 'Hidden'}</span>
                        </button>
                      </td>
                      <td className="p-3 text-right space-x-1">
                        <button
                          onClick={() => setSelectedMediaForEdit(item)}
                          className="p-1.5 rounded-lg hover:bg-stone-200 text-stone-700 cursor-pointer"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRequestDeleteMedia(item)}
                          className="p-1.5 rounded-lg hover:bg-red-100 text-red-600 cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 17: SOCIAL MEDIA IMAGES (Req #17) */}
      {(activeTab === 'social' || activeTab === 'all') && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 border-stone-100">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md bg-pink-100 text-pink-800 text-[11px] font-bold">
                <Share2 className="w-3.5 h-3.5" />
                <span>Section 17: Social Platforms & Advisories</span>
              </div>
              <h2 className="text-xl font-bold text-stone-900 mt-1">Social Media Images & Advisories</h2>
              <p className="text-xs text-stone-500">
                Manage branding assets for Facebook, Instagram, YouTube, TikTok, and X (Twitter).
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setUploadCategory('Social Media');
                setUploadPlacement('Contact');
                setIsUploadModalOpen(true);
              }}
              className="py-2 px-4 rounded-xl bg-pink-700 hover:bg-pink-600 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-xs self-start"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Social Image / Card</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Facebook Card */}
            <div className="p-5 rounded-2xl bg-blue-50/50 border border-blue-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-900 flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-blue-600" />
                  <span>DA Hinunangan Facebook Page</span>
                </span>
                <span className="px-2 py-0.5 rounded-md bg-blue-200 text-blue-800 font-bold text-[10px]">Active</span>
              </div>
              <p className="text-stone-600 text-[11px]">
                Official page: facebook.com/DA.Hinunangan.MAO (Livestock advisory broadcast)
              </p>
              <div className="p-3 bg-white rounded-xl border border-blue-100 space-y-2">
                <span className="text-[10px] font-bold text-stone-400 uppercase">Featured Post Banner</span>
                <img
                  src="https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=600&q=80"
                  alt="Facebook Post"
                  className="w-full h-28 object-cover rounded-lg"
                />
              </div>
            </div>

            {/* Social Share (OpenGraph) Preview Card */}
            <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Social Share Preview Card (OpenGraph)</span>
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                  1200 × 630 px
                </span>
              </div>
              <p className="text-stone-600 text-[11px]">
                Thumbnail displayed when the portal link is shared on Messenger, Viber, WhatsApp, or Facebook.
              </p>
              <div className="p-3 bg-white rounded-xl border border-stone-200 space-y-2">
                <div className="flex items-center gap-3">
                  <SealDA className="w-8 h-8" />
                  <SealMunicipality className="w-8 h-8" />
                  <div className="text-[11px] font-bold text-stone-800">DA HINUNANGAN SWINE REGISTRY</div>
                </div>
                <div className="text-[10px] text-stone-500">
                  Municipal Livestock Traceability & ASF Green Zone Portal
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: UPLOAD MEDIA MODAL (Req #9: Drag & Drop, Preview, Metadata Form) */}
      {/* ========================================================================= */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-stone-200 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-4 border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-stone-900">Upload Media File</h3>
                  <p className="text-xs text-stone-500">Add logos, municipal seals, backgrounds, and gallery photos.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteUpload} className="space-y-4 text-xs">
              {/* Drag and Drop Zone (Req #9) */}
              <div
                onDragOver={e => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={e => {
                  e.preventDefault();
                  setIsDragging(false);
                  handleFileSelect(e.dataTransfer.files);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 rounded-2xl border-2 border-dashed text-center transition cursor-pointer flex flex-col items-center justify-center gap-2 ${
                  isDragging
                    ? 'border-emerald-500 bg-emerald-50/70'
                    : uploadFile.previewUrl
                    ? 'border-emerald-300 bg-emerald-50/30'
                    : 'border-stone-300 hover:border-emerald-500 bg-stone-50/50'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={e => handleFileSelect(e.target.files)}
                  className="hidden"
                  accept="image/jpeg,image/png,image/webp,image/svg+xml,video/mp4,video/webm"
                />

                {uploadFile.previewUrl ? (
                  <div className="space-y-2">
                    <img
                      src={uploadFile.previewUrl}
                      alt="Upload Preview"
                      className="h-28 max-w-full object-contain mx-auto rounded-lg shadow-sm border border-stone-200"
                    />
                    <div className="font-bold text-stone-800 text-xs">{uploadFile.name}</div>
                    <div className="text-[10px] text-stone-500">
                      {uploadFile.sizeStr} • {uploadFile.typeStr}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div className="font-bold text-stone-800 text-sm">Drag and drop your files here</div>
                    <p className="text-stone-500 text-xs">or</p>
                    <button
                      type="button"
                      className="py-1.5 px-4 rounded-xl bg-stone-900 text-white font-bold text-xs hover:bg-stone-800"
                    >
                      Browse Files
                    </button>
                    <p className="text-[10px] text-stone-400 mt-1">Supported: JPG, JPEG, PNG, WEBP, SVG, MP4, WebM</p>
                  </>
                )}
              </div>

              {/* Assignment Form (Req #9 & #10) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-stone-700 block">Category</label>
                  <select
                    value={uploadCategory}
                    onChange={e => setUploadCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white font-semibold"
                  >
                    <option value="logos">Official Logos</option>
                    <option value="seals">Municipal Seals</option>
                    <option value="hero">Hero Images</option>
                    <option value="backgrounds">Interface Background</option>
                    <option value="slsu">SLSU</option>
                    <option value="extension">Extension Center</option>
                    <option value="gallery">Gallery</option>
                    <option value="social">Social Media</option>
                    <option value="videos">Videos</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-stone-700 block">Landing Page Placement (Req #10)</label>
                  <select
                    value={uploadPlacement}
                    onChange={e => setUploadPlacement(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white font-semibold"
                  >
                    <option value="Header">Header</option>
                    <option value="Hero">Hero Section</option>
                    <option value="About">About / Academic</option>
                    <option value="Features">Features Section</option>
                    <option value="Gallery">Gallery Section</option>
                    <option value="Partners">Partners & Seals</option>
                    <option value="Contact">Contact Section</option>
                    <option value="Footer">Footer</option>
                    <option value="Background">Interface Background</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700 block">Title / Name</label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={e => setUploadTitle(e.target.value)}
                  placeholder="e.g. Hinunangan Municipal Official Seal"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-stone-700 block">Alt Text (Accessibility & SEO)</label>
                  <input
                    type="text"
                    value={uploadAltText}
                    onChange={e => setUploadAltText(e.target.value)}
                    placeholder="e.g. Official Seal of Hinunangan, Southern Leyte"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-stone-700 block">Visibility on Website</label>
                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setUploadVisible(prev => !prev)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                        uploadVisible ? 'bg-emerald-600' : 'bg-stone-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          uploadVisible ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className="font-bold text-stone-700">{uploadVisible ? 'Visible (ON)' : 'Hidden (OFF)'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700 block">Description / Caption</label>
                <textarea
                  rows={2}
                  value={uploadDescription}
                  onChange={e => setUploadDescription(e.target.value)}
                  placeholder="Brief description or photo documentation details..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-300"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl border border-stone-300 text-stone-700 font-bold hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-6 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold cursor-pointer shadow-md"
                >
                  Upload Media
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: MEDIA DETAILS & IMAGE ADJUSTMENTS (Req #12)                      */}
      {/* ========================================================================= */}
      {selectedMediaForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-stone-200 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-4 border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-100 text-purple-800">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-stone-900">Media Details & Adjustments</h3>
                  <p className="text-xs text-stone-500">Fine-tune image brightness, contrast, scale, and placement.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMediaForEdit(null)}
                className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Image Replacement Section (Import from Device & Use Image URL) */}
            <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-emerald-700" />
                  <span>Change / Replace Image Source</span>
                </span>
                <span className="text-[10px] text-stone-500 font-medium">
                  Select a new file or provide a web URL
                </span>
              </div>

              {/* Source Mode Selector */}
              <div className="flex rounded-xl bg-white p-1 border border-stone-200">
                <button
                  type="button"
                  onClick={() => setEditImageSourceMode('device')}
                  className={`flex-1 py-1.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    editImageSourceMode === 'device'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>📁 Import Image from Device</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditImageSourceMode('url')}
                  className={`flex-1 py-1.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    editImageSourceMode === 'url'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>🔗 Use Image URL</span>
                </button>
              </div>

              {/* Device File Input */}
              {editImageSourceMode === 'device' ? (
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <input
                    ref={editFileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) {
                        const reader = new FileReader();
                        reader.onload = ev => {
                          const dataUrl = (ev.target?.result as string) || '';
                          setSelectedMediaForEdit(prev => prev ? { ...prev, url: dataUrl, fileName: f.name } : null);
                          showToast(`Loaded ${f.name} from device`, 'info');
                        };
                        reader.readAsDataURL(f);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => editFileInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Choose File from Device...</span>
                  </button>
                  <span className="text-[11px] text-stone-500 font-medium">PNG, JPG, WEBP, SVG, MP4</span>
                </div>
              ) : (
                /* URL Input */
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="url"
                    value={editUrlInput}
                    onChange={e => setEditUrlInput(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="flex-1 px-3.5 py-1.5 rounded-xl border border-stone-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (editUrlInput.trim()) {
                        setSelectedMediaForEdit(prev => prev ? { ...prev, url: editUrlInput.trim() } : null);
                        showToast('Applied new image URL to media preview', 'info');
                        setEditUrlInput('');
                      }
                    }}
                    className="px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs transition cursor-pointer shrink-0"
                  >
                    Apply URL
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-xs">
              {/* Left Preview with Live CSS Filters */}
              <div className="md:col-span-6 space-y-3">
                <div className="w-full h-56 bg-stone-900 rounded-2xl overflow-hidden flex items-center justify-center p-3 relative shadow-inner">
                  <img
                    src={selectedMediaForEdit.url}
                    alt={selectedMediaForEdit.name}
                    className="max-h-full max-w-full object-contain transition-all duration-200"
                    style={{
                      filter: `brightness(${(selectedMediaForEdit.brightness ?? 100) / 100}) contrast(${
                        (selectedMediaForEdit.contrast ?? 100) / 100
                      }) opacity(${(selectedMediaForEdit.opacity ?? 100) / 100})`,
                      transform: `rotate(${selectedMediaForEdit.rotation ?? 0}deg) scale(${
                        (selectedMediaForEdit.zoom ?? 100) / 100
                      })`,
                    }}
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Sliders */}
                <div className="space-y-2 p-3 bg-stone-50 rounded-2xl border border-stone-200">
                  <div className="flex justify-between font-bold text-stone-700">
                    <span className="flex items-center gap-1">
                      <Sun className="w-3.5 h-3.5 text-amber-500" /> Brightness
                    </span>
                    <span>{selectedMediaForEdit.brightness ?? 100}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    value={selectedMediaForEdit.brightness ?? 100}
                    onChange={e =>
                      setSelectedMediaForEdit({
                        ...selectedMediaForEdit,
                        brightness: parseInt(e.target.value),
                      })
                    }
                    className="w-full accent-amber-600"
                  />

                  <div className="flex justify-between font-bold text-stone-700 pt-1">
                    <span className="flex items-center gap-1">
                      <Contrast className="w-3.5 h-3.5 text-blue-500" /> Contrast
                    </span>
                    <span>{selectedMediaForEdit.contrast ?? 100}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    value={selectedMediaForEdit.contrast ?? 100}
                    onChange={e =>
                      setSelectedMediaForEdit({
                        ...selectedMediaForEdit,
                        contrast: parseInt(e.target.value),
                      })
                    }
                    className="w-full accent-blue-600"
                  />

                  <div className="flex justify-between font-bold text-stone-700 pt-1">
                    <span className="flex items-center gap-1">
                      <RotateCw className="w-3.5 h-3.5 text-purple-500" /> Rotation
                    </span>
                    <span>{selectedMediaForEdit.rotation ?? 0}°</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {[0, 90, 180, 270].map(deg => (
                      <button
                        key={deg}
                        type="button"
                        onClick={() => setSelectedMediaForEdit({ ...selectedMediaForEdit, rotation: deg })}
                        className={`flex-1 py-1 rounded-lg text-[10px] font-bold border transition ${
                          (selectedMediaForEdit.rotation ?? 0) === deg
                            ? 'bg-purple-700 text-white border-purple-800'
                            : 'bg-white text-stone-700 border-stone-300'
                        }`}
                      >
                        {deg}°
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Metadata Fields */}
              <div className="md:col-span-6 space-y-3">
                <div className="space-y-1">
                  <label className="font-bold text-stone-700 block">Title / Name</label>
                  <input
                    type="text"
                    value={selectedMediaForEdit.name || ''}
                    onChange={e => setSelectedMediaForEdit({ ...selectedMediaForEdit, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-stone-700 block">Filename / Source</label>
                  <input
                    type="text"
                    value={selectedMediaForEdit.fileName || selectedMediaForEdit.url || ''}
                    disabled
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-100 font-mono text-[11px] text-stone-500 truncate"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-stone-700 block">Category</label>
                    <select
                      value={selectedMediaForEdit.category}
                      onChange={e =>
                        setSelectedMediaForEdit({ ...selectedMediaForEdit, category: e.target.value as any })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white"
                    >
                      <option value="logos">Official Logos</option>
                      <option value="seals">Municipal Seals</option>
                      <option value="hero">Hero Images</option>
                      <option value="backgrounds">Backgrounds</option>
                      <option value="slsu">SLSU</option>
                      <option value="extension">Extension Center</option>
                      <option value="gallery">Gallery</option>
                      <option value="social">Social Media</option>
                      <option value="videos">Videos</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-stone-700 block">Placement</label>
                    <select
                      value={selectedMediaForEdit.placement || 'Hero'}
                      onChange={e =>
                        setSelectedMediaForEdit({ ...selectedMediaForEdit, placement: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white"
                    >
                      <option value="Header">Header</option>
                      <option value="Hero">Hero Section</option>
                      <option value="About">About Section</option>
                      <option value="Features">Features Section</option>
                      <option value="Gallery">Gallery Section</option>
                      <option value="Partners">Partners & Seals</option>
                      <option value="Contact">Contact</option>
                      <option value="Footer">Footer</option>
                      <option value="Background">Background</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-stone-700 block">Alt Text</label>
                  <input
                    type="text"
                    value={selectedMediaForEdit.altText || ''}
                    onChange={e => setSelectedMediaForEdit({ ...selectedMediaForEdit, altText: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-stone-700 block">Caption</label>
                  <textarea
                    rows={2}
                    value={selectedMediaForEdit.caption || ''}
                    onChange={e => setSelectedMediaForEdit({ ...selectedMediaForEdit, caption: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300"
                  />
                </div>

                {/* Visibility Controls */}
                <div className="flex items-center justify-between p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-stone-700">
                    <input
                      type="checkbox"
                      checked={selectedMediaForEdit.visible !== false}
                      onChange={e =>
                        setSelectedMediaForEdit({ ...selectedMediaForEdit, visible: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-emerald-700 accent-emerald-700"
                    />
                    <span>Visible on Website</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-stone-100">
              <button
                type="button"
                onClick={() => {
                  handleRequestDeleteMedia(selectedMediaForEdit);
                }}
                className="py-2.5 px-4 rounded-xl border border-red-200 bg-red-50 text-red-700 font-bold hover:bg-red-100 flex items-center gap-1.5 cursor-pointer text-xs"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Media</span>
              </button>

              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedMediaForEdit(null)}
                  className="py-2.5 px-4 rounded-xl border border-stone-300 text-stone-700 font-bold hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const updated = (config.mediaItems || []).map(m =>
                      m.id === selectedMediaForEdit.id ? selectedMediaForEdit : m
                    );
                    updateConfig({ mediaItems: updated });
                    showToast('Media details saved!', 'success');
                    setSelectedMediaForEdit(null);
                  }}
                  className="py-2.5 px-6 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold cursor-pointer shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: DELETE CONFIRMATION & USAGE WARNING (Req #18)                    */}
      {/* ========================================================================= */}
      {mediaToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-stone-200 space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-stone-900">Delete this image?</h3>
              <p className="text-xs text-stone-500">
                This image may currently be used on the public landing page.
              </p>
            </div>

            {mediaToDelete.usedIn.length > 0 && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-left space-y-1.5 text-xs">
                <div className="font-bold text-amber-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-700" />
                  <span>Currently used in:</span>
                </div>
                <ul className="list-disc list-inside text-amber-800 space-y-0.5">
                  {mediaToDelete.usedIn.map((sec, i) => (
                    <li key={i} className="font-semibold">
                      {sec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs font-bold pt-2">
              <button
                type="button"
                onClick={() => setMediaToDelete(null)}
                className="py-2.5 px-4 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteMedia}
                className="py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white cursor-pointer shadow-md"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: DELETE WARNING FOR OFFICIAL LOGO (Req #7) */}
      {logoToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-stone-200 space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-7 h-7" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-stone-900">Remove Official Logo?</h3>
              <p className="text-xs text-stone-500">
                Are you sure you want to remove this official logo?
              </p>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-center text-xs font-bold text-stone-800">
              {logoToDelete.name} ({logoToDelete.institution})
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-bold pt-2">
              <button
                type="button"
                onClick={() => setLogoToDelete(null)}
                className="py-2.5 px-4 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const updated = (config.officialLogos || []).filter(l => l.id !== logoToDelete.id);
                  updateConfig({ officialLogos: updated });
                  showToast('Official logo removed.', 'info');
                  setLogoToDelete(null);
                }}
                className="py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white cursor-pointer shadow-md"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: LANDING PAGE PREVIEW MODAL (Req #13)                             */}
      {/* ========================================================================= */}
      {isPreviewWebsiteOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-stone-950 text-white animate-in fade-in">
          {/* Top Bar with Device Selector */}
          <div className="p-4 bg-stone-900 border-b border-stone-800 flex items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="font-bold text-sm text-emerald-400">Live Website Preview</div>
              <span className="text-xs text-stone-400 hidden sm:inline">
                Viewing current draft media & logo configurations
              </span>
            </div>

            {/* Device Switcher (Desktop, Tablet, Mobile) (Req #13) */}
            <div className="flex items-center rounded-xl bg-stone-800 p-1 border border-stone-700 text-xs">
              <button
                type="button"
                onClick={() => setPreviewDevice('desktop')}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  previewDevice === 'desktop' ? 'bg-emerald-700 text-white' : 'text-stone-400 hover:text-white'
                }`}
              >
                <Monitor className="w-4 h-4" />
                <span className="hidden sm:inline">Desktop</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice('tablet')}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  previewDevice === 'tablet' ? 'bg-emerald-700 text-white' : 'text-stone-400 hover:text-white'
                }`}
              >
                <Tablet className="w-4 h-4" />
                <span className="hidden sm:inline">Tablet</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice('mobile')}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  previewDevice === 'mobile' ? 'bg-emerald-700 text-white' : 'text-stone-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span className="hidden sm:inline">Mobile</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsPreviewWebsiteOpen(false)}
              className="py-1.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Close Preview</span>
            </button>
          </div>

          {/* Iframe / Live Preview Container */}
          <div className="flex-1 bg-stone-900/50 p-4 flex items-center justify-center overflow-auto">
            <div
              className={`h-full bg-white text-stone-900 rounded-2xl overflow-y-auto shadow-2xl transition-all duration-300 border border-stone-700 ${
                previewDevice === 'desktop'
                  ? 'w-full max-w-7xl'
                  : previewDevice === 'tablet'
                  ? 'w-[768px] max-w-full'
                  : 'w-[390px] max-w-full'
              }`}
            >
              <LiveLandingPreview config={config} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Globe,
  Layout,
  Megaphone,
  Image as ImageIcon,
  GraduationCap,
  Layers,
  BarChart3,
  FolderOpen,
  ShieldCheck,
  Share2,
  Video,
  Phone,
  Palette,
  Columns,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Check,
  Save,
  Send,
  ChevronLeft,
  ChevronRight,
  Monitor,
  Tablet,
  Smartphone,
  Eye,
  FileEdit,
  Scale,
} from 'lucide-react';
import { LandingCmsConfig } from '../../types/landingCms';
import { landingCmsService } from '../../services/landingCmsService';
import { LandingCmsHeader, ViewMode, DeviceMode } from './landing/LandingCmsHeader';
import { LiveLandingPreview } from './landing/LiveLandingPreview';
import { GeneralTab } from './landing/tabs/GeneralTab';
import { HeaderNavTab } from './landing/tabs/HeaderNavTab';
import { HeroTab } from './landing/tabs/HeroTab';
import { BackgroundPhotoTab } from './landing/tabs/BackgroundPhotoTab';
import { AboutTab } from './landing/tabs/AboutTab';
import { FeaturesTab } from './landing/tabs/FeaturesTab';
import { StatisticsTab } from './landing/tabs/StatisticsTab';
import { MediaLibraryTab } from './landing/tabs/MediaLibraryTab';
import { LogosBrandingTab } from './landing/tabs/LogosBrandingTab';
import { GalleryTab } from './landing/tabs/GalleryTab';
import { SocialMediaTab } from './landing/tabs/SocialMediaTab';
import { VideoMediaTab } from './landing/tabs/VideoMediaTab';
import { AnnouncementTab } from './landing/tabs/AnnouncementTab';
import { ContactTab } from './landing/tabs/ContactTab';
import { FooterTab } from './landing/tabs/FooterTab';
import { ThemeAppearanceTab } from './landing/tabs/ThemeAppearanceTab';
import { PageBuilderTab } from './landing/tabs/PageBuilderTab';
import { LegalDocumentsTab } from './landing/tabs/LegalDocumentsTab';

export type CmsTabId =
  | 'general'
  | 'header_nav'
  | 'hero'
  | 'background'
  | 'about'
  | 'features'
  | 'statistics'
  | 'media_library'
  | 'logos_branding'
  | 'gallery'
  | 'social_media'
  | 'videos'
  | 'announcement'
  | 'contact'
  | 'footer'
  | 'theme'
  | 'page_builder'
  | 'legal_documents';

interface NavTabItem {
  id: CmsTabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const CMS_NAV_TABS: NavTabItem[] = [
  { id: 'general', label: '1. General & SEO', icon: Globe },
  { id: 'header_nav', label: '2. Header & Navigation', icon: Layout },
  { id: 'hero', label: '3. Hero Section', icon: Megaphone },
  { id: 'background', label: '4. Interface Background', icon: ImageIcon },
  { id: 'about', label: '5. About & Academic Synergy', icon: GraduationCap },
  { id: 'features', label: '6. Features & Modules', icon: Layers },
  { id: 'statistics', label: '7. Statistics Section', icon: BarChart3 },
  { id: 'media_library', label: '8. Photos & Media Library', icon: FolderOpen, badge: 'Manager' },
  { id: 'logos_branding', label: '9. Logos & Official Seals', icon: ShieldCheck, badge: 'SLSU & DA' },
  { id: 'gallery', label: '10. Website Gallery', icon: ImageIcon },
  { id: 'social_media', label: '11. Social Media & Posts', icon: Share2 },
  { id: 'videos', label: '12. Video & Media Guides', icon: Video },
  { id: 'announcement', label: '13. Announcement Bar', icon: Megaphone },
  { id: 'contact', label: '14. Contact & Hotlines', icon: Phone },
  { id: 'footer', label: '15. Footer Management', icon: Columns },
  { id: 'theme', label: '16. Theme & Appearance', icon: Palette },
  { id: 'page_builder', label: '17. Page Builder & Sections', icon: Sparkles },
  { id: 'legal_documents', label: '18. Legal Decrees & Ordinances Settings', icon: Scale, badge: 'Database' },
];

interface ManageLandingPageProps {
  initialTab?: CmsTabId;
  onRefresh?: () => void;
}

export const ManageLandingPage: React.FC<ManageLandingPageProps> = ({
  initialTab,
  onRefresh,
}) => {
  const [publishedConfig, setPublishedConfig] = useState<LandingCmsConfig>(() =>
    landingCmsService.getPublishedConfig()
  );
  const [config, setConfig] = useState<LandingCmsConfig>(() => landingCmsService.getDraftConfig());

  const [activeTab, setActiveTab] = useState<CmsTabId>(() => initialTab || 'general');
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Media Picker state bridge
  const [mediaPickerTarget, setMediaPickerTarget] = useState<string | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(
    null
  );

  // Modal for reset confirmation
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Check if draft has unsaved differences compared to published
  const hasUnsavedChanges = JSON.stringify(config) !== JSON.stringify(publishedConfig);

  // Auto-save draft on changes
  const updateConfig = (updates: Partial<LandingCmsConfig>) => {
    setConfig(prev => {
      const next = { ...prev, ...updates };
      landingCmsService.saveDraft(next);
      return next;
    });
  };

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSaveDraft = () => {
    landingCmsService.saveDraft(config);
    showToast('Draft changes saved locally!', 'info');
  };

  const handlePublish = () => {
    const published = landingCmsService.publish(config);
    setPublishedConfig(published);
    setConfig(published);
    showToast('Website published live successfully! Changes are now public.', 'success');
    if (onRefresh) onRefresh();
  };

  const handleResetDraft = () => {
    const pub = landingCmsService.resetDraft();
    setConfig(pub);
    showToast('Draft changes discarded. Reverted to published state.', 'info');
    setIsResetConfirmOpen(false);
  };

  const handleRestoreDefaults = () => {
    if (window.confirm('Restore all landing page settings to factory defaults? This will reset all photos and custom text.')) {
      const defaults = landingCmsService.restoreDefaults();
      setPublishedConfig(defaults);
      setConfig(defaults);
      showToast('Restored all landing page settings to system defaults.', 'info');
      if (onRefresh) onRefresh();
    }
  };

  // Open media library to pick an image for a specific field
  const handleOpenMediaPicker = (targetField: string) => {
    setMediaPickerTarget(targetField);
    setActiveTab('media_library');
  };

  const handleSelectMediaForTarget = (url: string) => {
    if (!mediaPickerTarget) return;

    if (mediaPickerTarget === 'heroBackgroundUrl') {
      updateConfig({ heroBackgroundUrl: url });
      setActiveTab('hero');
    } else if (mediaPickerTarget === 'interfaceBackground.imageUrl') {
      updateConfig({
        interfaceBackground: {
          ...(config.interfaceBackground || {} as any),
          imageUrl: url,
        },
      });
      setActiveTab('background');
    } else if (mediaPickerTarget === 'aboutImageUrl') {
      updateConfig({ aboutImageUrl: url });
      setActiveTab('about');
    } else if (mediaPickerTarget === 'footerLogoUrl') {
      updateConfig({ footerLogoUrl: url });
      setActiveTab('footer');
    } else if (mediaPickerTarget === 'newGalleryPhoto') {
      updateConfig({
        galleryPhotos: [
          ...(config.galleryPhotos || []),
          {
            id: 'gal-' + Date.now(),
            title: 'Hinunangan Livestock Extension',
            caption: 'Field photo documentation.',
            category: 'Field Operations',
            imageUrl: url,
            showOnLanding: true,
            order: (config.galleryPhotos || []).length + 1,
          },
        ],
      });
      setActiveTab('gallery');
    } else if (mediaPickerTarget.startsWith('logo_')) {
      const logoId = mediaPickerTarget.replace('logo_', '');
      const updatedLogos = (config.officialLogos || []).map(l =>
        l.id === logoId ? { ...l, url, vectorComponent: undefined } : l
      );
      updateConfig({ officialLogos: updatedLogos });
      setActiveTab('logos_branding');
    }

    setMediaPickerTarget(null);
    showToast('Photo selected and applied successfully!');
  };

  return (
    <div className="w-full py-6 px-3 sm:px-6 space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs font-bold transition-all duration-300 animate-fadeIn ${
            toastMessage.type === 'success'
              ? 'bg-emerald-900 text-white border-emerald-700'
              : 'bg-stone-900 text-white border-stone-700'
          }`}
        >
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Main Top Header Controls */}
      <LandingCmsHeader
        config={config}
        hasUnsavedChanges={hasUnsavedChanges}
        viewMode={viewMode}
        deviceMode={deviceMode}
        onChangeViewMode={setViewMode}
        onChangeDeviceMode={setDeviceMode}
        onSaveDraft={handleSaveDraft}
        onPublish={handlePublish}
        onResetDraft={() => setIsResetConfirmOpen(true)}
        onRestoreDefaults={handleRestoreDefaults}
        onOpenMediaLibrary={() => setActiveTab('media_library')}
        onOpenLogosTab={() => setActiveTab('logos_branding')}
        onOpenSocialTab={() => setActiveTab('social_media')}
      />

      {/* Main Content Area: Split View, Full Editor, or Full Live Preview */}
      <div className="grid grid-cols-1 gap-6">
        {viewMode === 'preview' ? (
          /* Fullscreen Preview */
          <div className="w-full">
            <div className="flex items-center justify-between mb-3 px-2">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                Full Live Website Preview ({deviceMode})
              </span>
              <button
                onClick={() => setViewMode('split')}
                className="text-xs font-bold text-emerald-800 hover:underline cursor-pointer"
              >
                Return to Split View
              </button>
            </div>
            <LiveLandingPreview config={config} deviceMode={deviceMode} />
          </div>
        ) : (
          <div
            className={`grid gap-6 items-start ${
              viewMode === 'split' ? 'grid-cols-1 xl:grid-cols-12' : 'grid-cols-1'
            }`}
          >
            {/* Left CMS Configuration Controls: 17 Tabs */}
            <div
              className={`space-y-4 ${
                viewMode === 'split' ? 'xl:col-span-6 2xl:col-span-6 min-w-0' : 'w-full'
              }`}
            >
              {/* Tab Navigation Menu (Single row scrollable with quick arrows) */}
              <div className="bg-white p-2 rounded-2xl border border-slate-200/90 shadow-2xs">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin scroll-smooth">
                  {CMS_NAV_TABS.map((tab, idx) => {
                    const IconComponent = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => {
                          setActiveTab(tab.id);
                          setMediaPickerTarget(null);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0 active:scale-[0.98] ${
                          isActive
                            ? 'bg-emerald-800 text-white shadow-2xs font-black'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        <IconComponent className="w-3.5 h-3.5 shrink-0" />
                        <span>{tab.label}</span>
                        {tab.badge && (
                          <span
                            className={`px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                              isActive ? 'bg-emerald-950 text-emerald-300' : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {tab.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Split View Quick Action Bar (Always visible on top of active form) */}
              {viewMode === 'split' && (
                <div className="sticky top-2 z-20 bg-white/95 backdrop-blur-md p-3 px-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-200/60">
                      {React.createElement(CMS_NAV_TABS.find(t => t.id === activeTab)?.icon || Layers, {
                        className: 'w-4 h-4 text-emerald-700',
                      })}
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-900 block truncate">
                        {CMS_NAV_TABS.find(t => t.id === activeTab)?.label}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        Section {CMS_NAV_TABS.findIndex(t => t.id === activeTab) + 1} of {CMS_NAV_TABS.length}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                    {/* Previous / Next tab buttons */}
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                      <button
                        type="button"
                        disabled={CMS_NAV_TABS.findIndex(t => t.id === activeTab) === 0}
                        onClick={() => {
                          const currIdx = CMS_NAV_TABS.findIndex(t => t.id === activeTab);
                          if (currIdx > 0) setActiveTab(CMS_NAV_TABS[currIdx - 1].id);
                        }}
                        title="Previous Section"
                        className="p-1 rounded-lg hover:bg-white text-slate-700 disabled:opacity-30 cursor-pointer transition shadow-2xs"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={CMS_NAV_TABS.findIndex(t => t.id === activeTab) === CMS_NAV_TABS.length - 1}
                        onClick={() => {
                          const currIdx = CMS_NAV_TABS.findIndex(t => t.id === activeTab);
                          if (currIdx < CMS_NAV_TABS.length - 1) setActiveTab(CMS_NAV_TABS[currIdx + 1].id);
                        }}
                        title="Next Section"
                        className="p-1 rounded-lg hover:bg-white text-slate-700 disabled:opacity-30 cursor-pointer transition shadow-2xs"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveDraft}
                      title="Save edits to draft"
                      className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs active:scale-[0.98]"
                    >
                      <Save className="w-3.5 h-3.5 text-slate-600" />
                      <span>Save</span>
                    </button>

                    <button
                      type="button"
                      onClick={handlePublish}
                      title="Publish immediately to public landing page"
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-black flex items-center gap-1.5 transition cursor-pointer shadow-2xs active:scale-[0.98]"
                    >
                      <Send className="w-3.5 h-3.5 text-emerald-200" />
                      <span>Publish</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Active Tab Panel */}
              <div className="transition-all duration-200">
                {activeTab === 'general' && (
                  <GeneralTab
                    config={config}
                    onChange={updateConfig}
                    onOpenMediaPicker={handleOpenMediaPicker}
                  />
                )}
                {activeTab === 'header_nav' && (
                  <HeaderNavTab config={config} onChange={updateConfig} />
                )}
                {activeTab === 'hero' && (
                  <HeroTab
                    config={config}
                    onChange={updateConfig}
                    onOpenMediaPicker={handleOpenMediaPicker}
                  />
                )}
                {activeTab === 'background' && (
                  <BackgroundPhotoTab
                    config={config}
                    onChange={updateConfig}
                    onOpenMediaPicker={handleOpenMediaPicker}
                  />
                )}
                {activeTab === 'about' && (
                  <AboutTab
                    config={config}
                    onChange={updateConfig}
                    onOpenMediaPicker={handleOpenMediaPicker}
                  />
                )}
                {activeTab === 'features' && (
                  <FeaturesTab config={config} onChange={updateConfig} />
                )}
                {activeTab === 'statistics' && (
                  <StatisticsTab config={config} onChange={updateConfig} />
                )}
                {activeTab === 'media_library' && (
                  <MediaLibraryTab
                    config={config}
                    onChange={updateConfig}
                    onSelectForField={mediaPickerTarget ? handleSelectMediaForTarget : undefined}
                    targetFieldPrompt={mediaPickerTarget || undefined}
                  />
                )}
                {activeTab === 'logos_branding' && (
                  <LogosBrandingTab
                    config={config}
                    onChange={updateConfig}
                    onOpenMediaPicker={handleOpenMediaPicker}
                  />
                )}
                {activeTab === 'gallery' && (
                  <GalleryTab
                    config={config}
                    onChange={updateConfig}
                    onOpenMediaPicker={handleOpenMediaPicker}
                  />
                )}
                {activeTab === 'social_media' && (
                  <SocialMediaTab
                    config={config}
                    onChange={updateConfig}
                    onOpenMediaPicker={handleOpenMediaPicker}
                  />
                )}
                {activeTab === 'videos' && (
                  <VideoMediaTab
                    config={config}
                    onChange={updateConfig}
                    onOpenMediaPicker={handleOpenMediaPicker}
                  />
                )}
                {activeTab === 'announcement' && (
                  <AnnouncementTab config={config} onChange={updateConfig} />
                )}
                {activeTab === 'contact' && (
                  <ContactTab
                    config={config}
                    onChange={updateConfig}
                    onOpenMediaPicker={handleOpenMediaPicker}
                  />
                )}
                {activeTab === 'footer' && (
                  <FooterTab
                    config={config}
                    onChange={updateConfig}
                    onOpenMediaPicker={handleOpenMediaPicker}
                  />
                )}
                {activeTab === 'theme' && (
                  <ThemeAppearanceTab config={config} onChange={updateConfig} />
                )}
                {activeTab === 'page_builder' && (
                  <PageBuilderTab config={config} onChange={updateConfig} />
                )}
                {activeTab === 'legal_documents' && (
                  <LegalDocumentsTab config={config} onChange={updateConfig} />
                )}
              </div>
            </div>

            {/* Right Live Preview (Split View) */}
            {viewMode === 'split' && (
              <div className="xl:col-span-6 2xl:col-span-6 min-w-0 sticky top-2 z-10 space-y-2">
                <div className="bg-white p-3 px-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Simulated Browser Traffic Light Controls */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-400/80 inline-block" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80 inline-block" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80 inline-block" />
                    </div>

                    {/* Simulated URL bar */}
                    <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 border border-slate-200 text-[11px] text-slate-600 font-mono">
                      <span className="text-emerald-700 font-bold">🔒</span>
                      <span className="truncate">hinunangan-swine-registry.gov.ph</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse shrink-0" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Live Preview</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Device Selector */}
                    <div className="bg-slate-100/90 p-1 rounded-xl flex items-center border border-slate-200 shadow-inner">
                      <button
                        type="button"
                        onClick={() => setDeviceMode('desktop')}
                        title="Desktop View (100%)"
                        className={`p-1.5 rounded-lg text-xs cursor-pointer transition ${
                          deviceMode === 'desktop' ? 'bg-white text-emerald-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        <Monitor className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeviceMode('tablet')}
                        title="Tablet View (768px)"
                        className={`p-1.5 rounded-lg text-xs cursor-pointer transition ${
                          deviceMode === 'tablet' ? 'bg-white text-emerald-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        <Tablet className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeviceMode('mobile')}
                        title="Mobile View (375px)"
                        className={`p-1.5 rounded-lg text-xs cursor-pointer transition ${
                          deviceMode === 'mobile' ? 'bg-white text-emerald-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Expand preview button */}
                    <button
                      type="button"
                      onClick={() => setViewMode('preview')}
                      title="Fullscreen Preview"
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition border border-slate-200 shadow-2xs active:scale-[0.98]"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-600" />
                      <span className="text-[11px] hidden sm:inline">Fullscreen</span>
                    </button>
                  </div>
                </div>

                <div className="max-h-[calc(100vh-140px)] overflow-y-auto pr-1 pb-10 rounded-2xl border border-slate-200/90 bg-slate-100/60 shadow-inner">
                  <LiveLandingPreview config={config} deviceMode={deviceMode} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Discard / Reset Confirmation Modal */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-stone-900 text-sm">Discard Unpublished Changes?</h3>
                <p className="text-stone-500 text-xs mt-0.5">
                  Your local draft will be reverted to match the currently published website version.
                </p>
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900">
              Any unsaved changes made in this session will be permanently discarded.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-bold text-xs cursor-pointer"
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={handleResetDraft}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs cursor-pointer shadow-sm"
              >
                Discard & Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

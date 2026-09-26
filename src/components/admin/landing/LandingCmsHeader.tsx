import React from 'react';
import {
  Globe,
  Save,
  Send,
  RotateCcw,
  Eye,
  Smartphone,
  Tablet,
  Monitor,
  Columns2,
  FileEdit,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  FolderOpen,
  Layers,
  Share2,
  Image as ImageIcon,
  Clock,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { LandingCmsConfig } from '../../../types/landingCms';

export type ViewMode = 'split' | 'editor' | 'preview';
export type DeviceMode = 'desktop' | 'tablet' | 'mobile';

interface LandingCmsHeaderProps {
  config: LandingCmsConfig;
  hasUnsavedChanges: boolean;
  viewMode: ViewMode;
  deviceMode: DeviceMode;
  onChangeViewMode: (mode: ViewMode) => void;
  onChangeDeviceMode: (mode: DeviceMode) => void;
  onSaveDraft: () => void;
  onPublish: () => void;
  onResetDraft: () => void;
  onRestoreDefaults: () => void;
  onOpenMediaLibrary: () => void;
  onOpenLogosTab: () => void;
  onOpenSocialTab: () => void;
}

export const LandingCmsHeader: React.FC<LandingCmsHeaderProps> = ({
  config,
  hasUnsavedChanges,
  viewMode,
  deviceMode,
  onChangeViewMode,
  onChangeDeviceMode,
  onSaveDraft,
  onPublish,
  onResetDraft,
  onRestoreDefaults,
  onOpenMediaLibrary,
  onOpenLogosTab,
  onOpenSocialTab,
}) => {
  const mediaCount = config.mediaItems?.length || 0;
  const activeSectionsCount = config.sections?.filter(s => s.enabled).length || 0;
  const connectedSocialsCount = config.socialAccounts?.filter(s => s.enabled).length || 0;

  return (
    <div className="space-y-4">
      {/* Top Main Command Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200/70 text-emerald-800 flex items-center justify-center shadow-2xs shrink-0">
              <Globe className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  Landing Page Management
                </h1>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide transition ${
                    hasUnsavedChanges
                      ? 'bg-amber-50 text-amber-900 border border-amber-300'
                      : 'bg-emerald-50 text-emerald-900 border border-emerald-300/80'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      hasUnsavedChanges ? 'bg-amber-500 animate-pulse' : 'bg-emerald-600'
                    }`}
                  />
                  {hasUnsavedChanges ? 'Draft (Unsaved Changes)' : 'Published Live'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure the municipal public landing website, official institutional insignias, hero banner, and citizen services.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Switcher */}
          <div className="bg-slate-100/90 p-1 rounded-xl flex items-center border border-slate-200 shadow-inner">
            <button
              onClick={() => onChangeViewMode('split')}
              title="Split View (Form Editor + Live Interactive Preview)"
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition ${
                viewMode === 'split'
                  ? 'bg-white text-emerald-900 shadow-2xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Columns2 className="w-3.5 h-3.5 text-emerald-700" />
              <span className="hidden sm:inline">Split</span>
            </button>
            <button
              onClick={() => onChangeViewMode('editor')}
              title="Editor Fullscreen"
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition ${
                viewMode === 'editor'
                  ? 'bg-white text-emerald-900 shadow-2xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileEdit className="w-3.5 h-3.5 text-emerald-700" />
              <span className="hidden sm:inline">Editor</span>
            </button>
            <button
              onClick={() => onChangeViewMode('preview')}
              title="Live Preview Fullscreen"
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition ${
                viewMode === 'preview'
                  ? 'bg-white text-emerald-900 shadow-2xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-emerald-700" />
              <span className="hidden sm:inline">Live Preview</span>
            </button>
          </div>

          {/* Responsive Preview Device Toggles (When in split or preview mode) */}
          {(viewMode === 'split' || viewMode === 'preview') && (
            <div className="bg-slate-100/90 p-1 rounded-xl flex items-center border border-slate-200 shadow-inner">
              <button
                onClick={() => onChangeDeviceMode('desktop')}
                title="Desktop View (100%)"
                className={`p-1.5 rounded-lg text-xs cursor-pointer transition ${
                  deviceMode === 'desktop' ? 'bg-white text-emerald-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onChangeDeviceMode('tablet')}
                title="Tablet View (768px)"
                className={`p-1.5 rounded-lg text-xs cursor-pointer transition ${
                  deviceMode === 'tablet' ? 'bg-white text-emerald-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Tablet className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onChangeDeviceMode('mobile')}
                title="Mobile View (375px)"
                className={`p-1.5 rounded-lg text-xs cursor-pointer transition ${
                  deviceMode === 'mobile' ? 'bg-white text-emerald-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Save Draft Button */}
          <button
            onClick={onSaveDraft}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-slate-300 shadow-2xs active:scale-[0.98]"
          >
            <Save className="w-3.5 h-3.5 text-slate-600" />
            <span>Save Draft</span>
          </button>

          {/* Publish Changes Button */}
          <button
            onClick={onPublish}
            className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-black shadow-sm hover:shadow-md flex items-center gap-1.5 transition cursor-pointer active:scale-[0.98]"
          >
            <Send className="w-3.5 h-3.5 text-emerald-200" />
            <span>Publish Changes</span>
          </button>
        </div>
      </div>

      {/* Unsaved Changes Banner */}
      {hasUnsavedChanges && (
        <div className="bg-amber-50 border border-amber-300/80 p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs text-amber-950 shadow-2xs animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              <strong>You have unpublished changes.</strong> These changes are saved in your local draft and live in the preview pane, but will not be visible to citizens until published.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onResetDraft}
              className="px-3 py-1.5 rounded-xl bg-white border border-amber-300 hover:bg-amber-100 font-bold text-amber-900 transition flex items-center gap-1 cursor-pointer shadow-2xs"
            >
              <RotateCcw className="w-3 h-3" /> Discard Draft
            </button>
            <button
              onClick={onPublish}
              className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 font-bold text-white shadow-xs transition flex items-center gap-1 cursor-pointer"
            >
              <CheckCircle className="w-3 h-3" /> Publish Now
            </button>
          </div>
        </div>
      )}

      {/* Quick Status KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
        {/* Metric 1: Website Status */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Website Status</span>
            <span className={`w-2 h-2 rounded-full ${config.status === 'published' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          </div>
          <div className="font-black text-slate-900 text-sm">
            {config.status === 'published' ? 'Published' : 'Draft Mode'}
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Live in production</span>
        </div>

        {/* Metric 2: Last Updated */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Last Updated</span>
            <Clock className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="font-black text-slate-900 text-sm truncate" title={config.lastUpdated}>
            {config.lastUpdated}
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">By Municipal Admin</span>
        </div>

        {/* Metric 3: Media Assets */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Media Assets</span>
            <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="font-black text-emerald-800 text-sm">
            {mediaCount} Files
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Logos, photos & seals</span>
        </div>

        {/* Metric 4: Active Sections */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Sections</span>
            <Layers className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="font-black text-slate-900 text-sm">
            {activeSectionsCount} Active
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Custom page layout</span>
        </div>

        {/* Metric 5: Social Accounts */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Social Feeds</span>
            <Share2 className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div className="font-black text-slate-900 text-sm">
            {connectedSocialsCount} Connected
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Official feeds linked</span>
        </div>
      </div>

      {/* 2 Harmonious Administrative Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Official Branding & Insignias */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-emerald-300 transition flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-black uppercase tracking-wider border border-emerald-200/60">
                <ShieldCheck className="w-3 h-3 text-emerald-700" /> Institutional Identity
              </span>
              <span className="text-xs text-slate-400 font-medium">Header · Hero · Certificates</span>
            </div>
            <h3 className="text-base font-black text-slate-900">Official Branding & Insignias</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Control the official Hinunangan Municipal Seal, DA RFO VIII Emblem, and SLSU University Seal displayed across the citizen portal and official certificates.
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-3.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" /> Hinunangan Seal
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" /> DA RFO VIII Logo
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" /> SLSU Seal
              </span>
            </div>
          </div>

          <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Synchronized across system</span>
            <button
              type="button"
              onClick={onOpenLogosTab}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs transition cursor-pointer shadow-2xs flex items-center gap-1.5 active:scale-[0.98]"
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Manage Official Branding
            </button>
          </div>
        </div>

        {/* Card 2: Photo & Media Library Settings */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[10px] font-black uppercase tracking-wider border border-slate-200">
                <FolderOpen className="w-3 h-3 text-slate-600" /> Digital Asset Manager
              </span>
              <span className="text-xs text-slate-400 font-medium">{mediaCount} Total Assets</span>
            </div>
            <h3 className="text-base font-black text-slate-900">Photo & Media Library Settings</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Upload, preview, and organize high-resolution photography for farm cluster inspection showcases, hero backdrops, veterinary clinics, and extension galleries.
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-3.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600" /> Hero & Backgrounds
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600" /> Field Inspections
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600" /> Gallery Items
              </span>
            </div>
          </div>

          <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onRestoreDefaults}
              title="Reset all settings to initial defaults"
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer border border-slate-200 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3 text-slate-500" /> Restore Default
            </button>
            <button
              type="button"
              onClick={onOpenMediaLibrary}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer shadow-2xs flex items-center gap-1.5 active:scale-[0.98]"
            >
              <FolderOpen className="w-3.5 h-3.5" /> Open Media Library
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


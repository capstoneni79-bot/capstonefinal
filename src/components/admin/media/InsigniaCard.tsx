import React, { useState, useRef } from 'react';
import {
  FolderOpen,
  Link as LinkIcon,
  Eye,
  EyeOff,
  RefreshCw,
  Trash2,
  Check,
  X,
  ShieldCheck,
  Smartphone,
  GripVertical,
  Sliders,
  CheckCircle,
  AlertCircle,
  Upload,
  ArrowUp,
  ArrowDown,
  Layers,
} from 'lucide-react';
import { OfficialLogoItem } from '../../../types/landingCms';
import { compressImageFile } from '../../../utils/imageCompressor';
import {
  SealDA,
  SealMunicipality,
  SealTaskForce,
  SealSLSU,
  SealExtension,
} from '../../common/OfficialSeals';

interface InsigniaCardProps {
  logo: OfficialLogoItem;
  index: number;
  totalLogos: number;
  onUpdateLogo: (logoId: string, updates: Partial<OfficialLogoItem>) => void;
  onMoveLogo: (index: number, direction: 'up' | 'down') => void;
  onDeleteLogo?: (logo: OfficialLogoItem) => void;
  onToast: (text: string, type: 'success' | 'warn' | 'info') => void;
}

export const InsigniaCard: React.FC<InsigniaCardProps> = ({
  logo,
  index,
  totalLogos,
  onUpdateLogo,
  onMoveLogo,
  onDeleteLogo,
  onToast,
}) => {
  // Modal / Editor State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [activeSourceMode, setActiveSourceMode] = useState<'device' | 'url'>('device');
  
  // Staged draft state inside the editor
  const [candidateUrl, setCandidateUrl] = useState<string>(logo.url || '');
  const [urlInput, setUrlInput] = useState<string>(logo.url || '');
  const [candidateFileName, setCandidateFileName] = useState<string>('');
  const [candidateFileSize, setCandidateFileSize] = useState<string>('');
  const [previewBg, setPreviewBg] = useState<'light' | 'dark' | 'transparent'>('light');
  const [isDragging, setIsDragging] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to render current vector seal
  const renderVectorSeal = (sealKey?: string, className: string = 'w-16 h-16') => {
    if (sealKey === 'SealDA') return <SealDA className={className} />;
    if (sealKey === 'SealMunicipality') return <SealMunicipality className={className} />;
    if (sealKey === 'SealTaskForce') return <SealTaskForce className={className} />;
    if (sealKey === 'SealSLSU') return <SealSLSU className={className} />;
    if (sealKey === 'SealExtension') return <SealExtension className={className} />;
    return <SealMunicipality className={className} />;
  };

  // Check if logo is using a custom image URL or the default vector seal
  const isCustomImage = Boolean(logo.url && logo.url.trim() !== '' && logo.url !== '/icon.svg');

  // Open editor and seed with current logo state
  const handleOpenEditor = () => {
    setCandidateUrl(logo.url || '');
    setUrlInput(logo.url || '');
    setCandidateFileName('');
    setCandidateFileSize('');
    setUrlError(null);
    setActiveSourceMode('device');
    setIsEditorOpen(true);
  };

  // Close editor and discard changes
  const handleCancelEditor = () => {
    setIsEditorOpen(false);
    setCandidateUrl(logo.url || '');
    setUrlInput(logo.url || '');
    setUrlError(null);
  };

  // Handle local device file reading with smart downscale compression
  const processUploadedFile = async (file: File) => {
    if (!file) return;

    // Check size limit (max 15MB)
    if (file.size > 15 * 1024 * 1024) {
      onToast('File is too large. Please select an image under 15MB.', 'warn');
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
        onToast(`Optimized & loaded ${file.name} (${result.sizeStr})`, 'info');
      }
    } catch (err) {
      console.error('Image compression failed:', err);
      // Fallback to FileReader if compression fails
      const reader = new FileReader();
      reader.onload = e => {
        const fallbackUrl = e.target?.result as string;
        if (fallbackUrl) {
          setCandidateUrl(fallbackUrl);
          setUrlInput(fallbackUrl);
          setCandidateFileName(file.name);
          setCandidateFileSize(`${Math.round(file.size / 1024)} KB`);
          setUrlError(null);
          onToast(`Loaded ${file.name} for ${logo.name}`, 'info');
        }
      };
      reader.onerror = () => {
        onToast('Failed to read file from device.', 'warn');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
  };

  // Handle drag and drop onto editor
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
  };

  // Handle URL Apply
  const handleApplyUrl = () => {
    if (!urlInput.trim()) {
      setUrlError('Please enter a valid image link.');
      return;
    }
    setCandidateUrl(urlInput.trim());
    setCandidateFileName('External Image URL');
    setCandidateFileSize('Web Asset');
    setUrlError(null);
    onToast('Image URL preview updated', 'info');
  };

  // Handle Replace (Reset candidate so user can upload/type a fresh source)
  const handleReplaceCandidate = () => {
    setCandidateUrl('');
    setUrlInput('');
    setCandidateFileName('');
    setCandidateFileSize('');
    setUrlError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  // Handle Remove (Restore back to official vector SVG seal)
  const handleRemoveImage = () => {
    // Revert logo back to default vector seal by clearing custom URL
    onUpdateLogo(logo.id, {
      url: '',
    });
    setCandidateUrl('');
    setUrlInput('');
    setCandidateFileName('');
    setCandidateFileSize('');
    setIsEditorOpen(false);
    onToast(`Removed custom graphic. Restored official default seal for ${logo.name}.`, 'info');
  };

  // Handle Save Changes
  const handleSaveChanges = () => {
    if (!candidateUrl && !logo.vectorComponent) {
      onToast('Please import an image or provide a valid URL.', 'warn');
      return;
    }

    onUpdateLogo(logo.id, {
      url: candidateUrl,
    });

    setIsEditorOpen(false);
    onToast(`Saved image changes for ${logo.name}! Landing page updated.`, 'success');
  };

  return (
    <div
      id={`insignia-card-${logo.id}`}
      className={`rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-xs ${
        logo.visible
          ? 'bg-white border-stone-200 hover:border-emerald-600 hover:shadow-md'
          : 'bg-stone-50 border-dashed border-stone-300 opacity-80'
      }`}
    >
      {/* Top Card Bar */}
      <div className="p-3.5 pb-2 flex items-center justify-between gap-2 border-b border-stone-100 bg-stone-50/50">
        <div className="flex items-center gap-1.5 text-stone-500">
          <GripVertical className="w-4 h-4 text-stone-400 cursor-grab" title="Insignia Order" />
          <span className="font-mono text-[10px] font-bold text-stone-600">#{index + 1}</span>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide bg-stone-200/80 text-stone-700">
            {logo.category || 'Institutional'}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Mobile Visibility indicator */}
          <button
            type="button"
            onClick={() => onUpdateLogo(logo.id, { mobileVisible: !logo.mobileVisible })}
            title={logo.mobileVisible ? 'Visible on Mobile devices' : 'Hidden on Mobile screens'}
            className={`p-1 rounded-md border text-[10px] font-semibold flex items-center gap-0.5 transition cursor-pointer ${
              logo.mobileVisible
                ? 'border-blue-200 bg-blue-50 text-blue-700'
                : 'border-stone-200 bg-stone-100 text-stone-400'
            }`}
          >
            <Smartphone className="w-3 h-3" />
            <span className="text-[9px] font-mono">{logo.mobileVisible ? 'ON' : 'OFF'}</span>
          </button>

          {/* Visibility badge */}
          <button
            type="button"
            onClick={() => onUpdateLogo(logo.id, { visible: !logo.visible })}
            title={logo.visible ? 'Visible on public portal' : 'Hidden from public portal'}
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 transition cursor-pointer ${
              logo.visible
                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
            }`}
          >
            {logo.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            <span>{logo.visible ? 'Visible' : 'Hidden'}</span>
          </button>
        </div>
      </div>

      {/* Main Insignia Preview Frame */}
      <div className="p-4 flex flex-col items-center justify-center space-y-3">
        <div
          className={`w-full h-32 rounded-xl flex items-center justify-center p-3 relative overflow-hidden transition-all ${
            previewBg === 'dark'
              ? 'bg-[#064e3b] text-white border border-emerald-950'
              : 'bg-radial from-stone-100 via-stone-50 to-stone-200 border border-stone-200/80 shadow-inner'
          }`}
        >
          {/* Watermark grid effect */}
          <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:8px_8px] pointer-events-none" />

          {/* Render Vector vs Custom Image */}
          {isCustomImage ? (
            <img
              src={logo.url}
              alt={logo.name}
              className="max-h-24 max-w-full object-contain drop-shadow-md transition duration-200"
              referrerPolicy="no-referrer"
            />
          ) : logo.vectorComponent ? (
            <div className="drop-shadow-md transition duration-200">
              {renderVectorSeal(logo.vectorComponent, 'w-20 h-20')}
            </div>
          ) : (
            <ShieldCheck className="w-16 h-16 text-emerald-600" />
          )}

          {/* Source Tag in bottom left of preview */}
          <span className="absolute bottom-1.5 left-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-black/60 text-white backdrop-blur-xs">
            {isCustomImage ? '📁 Custom Graphic' : '🛡️ Official Vector Seal'}
          </span>
        </div>

        {/* Insignia Titles & Meta */}
        <div className="w-full text-left space-y-1">
          <h4 className="font-black text-stone-900 text-xs sm:text-sm leading-snug line-clamp-2" title={logo.name}>
            {logo.name}
          </h4>
          <p className="text-[11px] text-stone-500 font-medium truncate" title={logo.institution}>
            {logo.institution}
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px] text-stone-400 font-medium">
            <span className="px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 border border-stone-200">
              Placement: <strong className="text-stone-800 capitalize">{logo.placement || 'Header'}</strong>
            </span>
            <span className="px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 border border-stone-200">
              Size: <strong className="text-stone-800">{logo.sizePx || 44}px</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons Section */}
      <div className="p-3 bg-stone-50/70 border-t border-stone-100 space-y-2">
        {/* Primary "Change Image" Action Button */}
        <button
          type="button"
          id={`btn-change-image-${logo.id}`}
          onClick={handleOpenEditor}
          className="w-full py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
        >
          <FolderOpen className="w-3.5 h-3.5 text-emerald-200" />
          <span>Change Image</span>
        </button>

        {/* Secondary Tool Row */}
        <div className="flex items-center justify-between gap-1 pt-1">
          {/* Reorder Up/Down */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onMoveLogo(index, 'up')}
              disabled={index === 0}
              className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 text-stone-600 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition text-xs"
              title="Move Up"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onMoveLogo(index, 'down')}
              disabled={index === totalLogos - 1}
              className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 text-stone-600 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition text-xs"
              title="Move Down"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-1">
            {/* Quick Remove Image button (if custom image exists) */}
            {isCustomImage && (
              <button
                type="button"
                onClick={handleRemoveImage}
                className="py-1 px-2 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-900 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition"
                title="Reset to official vector seal"
              >
                <RefreshCw className="w-3 h-3 text-amber-700" />
                <span>Reset Vector</span>
              </button>
            )}

            {/* Delete Insignia entirely if optional custom logo */}
            {onDeleteLogo && (
              <button
                type="button"
                onClick={() => onDeleteLogo(logo)}
                className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 cursor-pointer transition"
                title="Delete this Insignia"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DEDICATED "CHANGE IMAGE" MODAL / EDITOR FOR THIS INDEPENDENT INSIGNIA     */}
      {/* ========================================================================= */}
      {isEditorOpen && (
        <div
          id={`modal-change-image-${logo.id}`}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div
            className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh] text-stone-900"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-[#064e3b] via-[#043629] to-[#022c22] text-white flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Configured Official Insignia Editor</span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                  Change Image: {logo.name}
                </h3>
                <p className="text-emerald-100/70 text-xs">
                  {logo.institution} • Changes apply immediately to public portal.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCancelEditor}
                className="p-1.5 rounded-xl bg-emerald-900/60 hover:bg-emerald-800 text-white/80 hover:text-white transition cursor-pointer"
                title="Cancel and close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-5 overflow-y-auto space-y-5 text-xs">
              {/* Option Selector Tabs: Device Import vs Image URL */}
              <div className="flex rounded-xl bg-stone-100 p-1 border border-stone-200 gap-1">
                <button
                  type="button"
                  id="tab-import-device"
                  onClick={() => setActiveSourceMode('device')}
                  className={`flex-1 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                    activeSourceMode === 'device'
                      ? 'bg-white text-emerald-900 shadow-xs border border-stone-200/80'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <FolderOpen className="w-4 h-4 text-emerald-700" />
                  <span>📁 Import from Device</span>
                </button>

                <button
                  type="button"
                  id="tab-image-url"
                  onClick={() => setActiveSourceMode('url')}
                  className={`flex-1 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                    activeSourceMode === 'url'
                      ? 'bg-white text-emerald-900 shadow-xs border border-stone-200/80'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <LinkIcon className="w-4 h-4 text-blue-700" />
                  <span>🔗 Use Image URL</span>
                </button>
              </div>

              {/* MODE 1: IMPORT FROM DEVICE */}
              {activeSourceMode === 'device' && (
                <div className="space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif"
                    className="hidden"
                    onChange={handleFileInputChange}
                  />

                  <div
                    onDragOver={e => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${
                      isDragging
                        ? 'border-emerald-500 bg-emerald-50 scale-[1.01]'
                        : 'border-stone-300 hover:border-emerald-600 bg-stone-50/70 hover:bg-stone-50'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-xs">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="font-bold text-stone-900 text-sm">
                        Click to browse or drag & drop emblem file
                      </div>
                      <p className="text-[11px] text-stone-500">
                        Supports SVG, High-Res PNG, JPG, or WebP (Max 8MB)
                      </p>
                    </div>
                    <span className="mt-1 px-3 py-1 rounded-full bg-white border border-stone-200 text-stone-700 font-bold text-[11px] shadow-2xs">
                      📁 Select Image from Device
                    </span>
                  </div>

                  {candidateFileName && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 truncate">
                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-bold text-emerald-950 truncate">{candidateFileName}</span>
                        {candidateFileSize && (
                          <span className="text-[10px] text-emerald-700 bg-emerald-200/60 px-1.5 py-0.2 rounded font-mono">
                            {candidateFileSize}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={handleReplaceCandidate}
                        className="text-xs font-bold text-emerald-800 hover:underline shrink-0"
                      >
                        Change File
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* MODE 2: USE IMAGE URL */}
              {activeSourceMode === 'url' && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="font-bold text-stone-700 block">Image URL / Asset Link</label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="url"
                          placeholder="https://domain.gov.ph/seals/da-hinunangan.png or /icon.svg"
                          value={urlInput}
                          onChange={e => {
                            setUrlInput(e.target.value);
                            setUrlError(null);
                          }}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleApplyUrl();
                            }
                          }}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-xs bg-white"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleApplyUrl}
                        className="py-2.5 px-4 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-bold text-xs cursor-pointer shadow-xs shrink-0"
                      >
                        Apply Link
                      </button>
                    </div>
                    {urlError && (
                      <p className="text-[11px] text-red-600 flex items-center gap-1 font-semibold">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>{urlError}</span>
                      </p>
                    )}
                  </div>

                  {/* Preset quick links for standard Philippine government insignias */}
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                      Quick Preset Asset Links:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setUrlInput('/icon.svg');
                          setCandidateUrl('/icon.svg');
                          setUrlError(null);
                        }}
                        className="px-2 py-1 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 text-[10px] font-mono border border-stone-200"
                      >
                        /icon.svg (App Crest)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setUrlInput('https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=500&q=80');
                          setCandidateUrl('https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=500&q=80');
                          setUrlError(null);
                        }}
                        className="px-2 py-1 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 text-[10px] font-mono border border-stone-200"
                      >
                        SLSU Campus Badge
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 👁 PREVIEW SECTION (Interactive Light & Dark Backdrop Preview) */}
              <div className="space-y-2 pt-2 border-t border-stone-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-stone-800 text-xs">
                    <Eye className="w-4 h-4 text-emerald-700" />
                    <span>👁 Live Emblem Preview</span>
                  </div>

                  {/* Preview Backdrop Switcher */}
                  <div className="flex items-center gap-1 text-[10px]">
                    <span className="text-stone-400">Backdrop:</span>
                    <button
                      type="button"
                      onClick={() => setPreviewBg('light')}
                      className={`px-2 py-0.5 rounded font-bold border transition ${
                        previewBg === 'light'
                          ? 'bg-white text-stone-900 border-stone-400 shadow-2xs'
                          : 'bg-stone-100 text-stone-500 border-stone-200'
                      }`}
                    >
                      Light
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewBg('dark')}
                      className={`px-2 py-0.5 rounded font-bold border transition ${
                        previewBg === 'dark'
                          ? 'bg-emerald-950 text-white border-emerald-800 shadow-2xs'
                          : 'bg-stone-100 text-stone-500 border-stone-200'
                      }`}
                    >
                      Dark Green
                    </button>
                  </div>
                </div>

                <div
                  className={`w-full h-44 rounded-2xl flex items-center justify-center p-4 relative border transition-all ${
                    previewBg === 'dark'
                      ? 'bg-[#064e3b] text-white border-emerald-900'
                      : 'bg-radial from-white via-stone-50 to-stone-100 text-stone-900 border-stone-200'
                  }`}
                >
                  {candidateUrl ? (
                    <img
                      src={candidateUrl}
                      alt="Preview candidate"
                      className="max-h-32 max-w-full object-contain drop-shadow-lg"
                      onError={() => {
                        setUrlError('Unable to load image from specified link.');
                      }}
                      referrerPolicy="no-referrer"
                    />
                  ) : logo.vectorComponent ? (
                    <div className="drop-shadow-lg">
                      {renderVectorSeal(logo.vectorComponent, 'w-28 h-28')}
                    </div>
                  ) : (
                    <ShieldCheck className="w-20 h-20 text-emerald-600" />
                  )}
                </div>
              </div>

              {/* Insignia Placement & Scaling Properties */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-stone-100">
                <div className="space-y-1">
                  <label className="font-bold text-stone-700 block">Placement on Website</label>
                  <select
                    value={logo.placement}
                    onChange={e => onUpdateLogo(logo.id, { placement: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-stone-300 font-semibold bg-white"
                  >
                    <option value="header_left">Header Bar (Official Seals)</option>
                    <option value="hero">Hero Banner (Top Row)</option>
                    <option value="partners">Academic & Extension Partners</option>
                    <option value="footer">Footer Seals Row</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-stone-700 block">Render Size: {logo.sizePx || 44}px</label>
                  <input
                    type="range"
                    min={24}
                    max={120}
                    value={logo.sizePx || 44}
                    onChange={e => onUpdateLogo(logo.id, { sizePx: Number(e.target.value) })}
                    className="w-full accent-emerald-600 cursor-pointer mt-2"
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions Footer: Replace, Remove, Save, Cancel */}
            <div className="p-4 bg-stone-50 border-t border-stone-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {/* 🔄 Replace Button */}
                <button
                  type="button"
                  id="btn-replace-image"
                  onClick={handleReplaceCandidate}
                  className="py-2 px-3.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-stone-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Pick a new image file or URL"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-stone-500" />
                  <span>🔄 Replace</span>
                </button>

                {/* 🗑 Remove Button */}
                <button
                  type="button"
                  id="btn-remove-image"
                  onClick={handleRemoveImage}
                  className="py-2 px-3.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  title="Remove custom graphic and restore vector seal"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-600" />
                  <span>🗑 Remove</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {/* Cancel Button */}
                <button
                  type="button"
                  id="btn-cancel-image-changes"
                  onClick={handleCancelEditor}
                  className="py-2 px-4 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-stone-700 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>

                {/* Save Changes Button */}
                <button
                  type="button"
                  id="btn-save-image-changes"
                  onClick={handleSaveChanges}
                  className="py-2 px-5 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-900/20"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

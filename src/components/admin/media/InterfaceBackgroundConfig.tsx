import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Upload,
  Link as LinkIcon,
  Eye,
  Trash2,
  Check,
  RotateCcw,
  Sliders,
  Monitor,
  Tablet,
  Smartphone,
  CheckCircle,
  AlertCircle,
  ImageIcon,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { LandingCmsConfig } from '../../../types/landingCms';
import { landingCmsService } from '../../../services/landingCmsService';
import { compressImageFile } from '../../../utils/imageCompressor';

interface InterfaceBackgroundConfigProps {
  onSaved?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const InterfaceBackgroundConfig: React.FC<InterfaceBackgroundConfigProps> = ({
  onSaved,
  onNavigateTab,
}) => {
  const [config, setConfig] = useState<LandingCmsConfig>(() => landingCmsService.getDraftConfig());

  // Background Settings State
  const initialBg = config.interfaceBackground || {
    imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1920&q=80',
    brightness: 100,
    overlayOpacity: 35,
    overlayColor: '#064e3b',
    blur: 0,
    position: 'center',
    fit: 'cover',
    scale: 100,
    useSameForAllDevices: true,
  };

  const [imageUrl, setImageUrl] = useState<string>(initialBg.imageUrl || '');
  const [position, setPosition] = useState<'center' | 'top' | 'bottom' | 'left' | 'right'>(
    (initialBg.position as any) || 'center'
  );
  const [fit, setFit] = useState<'cover' | 'contain' | 'auto'>((initialBg.fit as any) || 'cover');
  const [overlayOpacity, setOverlayOpacity] = useState<number>(initialBg.overlayOpacity ?? 35);
  const [overlayColor, setOverlayColor] = useState<string>(initialBg.overlayColor || '#064e3b');
  const [brightness, setBrightness] = useState<number>(initialBg.brightness ?? 100);
  const [blur, setBlur] = useState<number>(initialBg.blur ?? 0);
  const [repeat, setRepeat] = useState<'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y'>('no-repeat');
  const [fixedAttachment, setFixedAttachment] = useState<boolean>(true);

  // URL Modal / Input
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);

  // Live Interactive Preview State
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isFullPreviewOpen, setIsFullPreviewOpen] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'warn' | 'info' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (text: string, type: 'success' | 'warn' | 'info' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Sync state on external update
  useEffect(() => {
    const handleUpdate = () => {
      const latest = landingCmsService.getDraftConfig();
      setConfig(latest);
      if (latest.interfaceBackground) {
        setImageUrl(latest.interfaceBackground.imageUrl || '');
        setPosition((latest.interfaceBackground.position as any) || 'center');
        setFit((latest.interfaceBackground.fit as any) || 'cover');
        setOverlayOpacity(latest.interfaceBackground.overlayOpacity ?? 35);
        setOverlayColor(latest.interfaceBackground.overlayColor || '#064e3b');
        setBrightness(latest.interfaceBackground.brightness ?? 100);
        setBlur(latest.interfaceBackground.blur ?? 0);
      }
    };
    window.addEventListener('da_landing_cms_updated', handleUpdate);
    window.addEventListener('da_landing_draft_updated', handleUpdate);
    return () => {
      window.removeEventListener('da_landing_cms_updated', handleUpdate);
      window.removeEventListener('da_landing_draft_updated', handleUpdate);
    };
  }, []);

  // Handle local device file reading with high-res web compression
  const handleDeviceFileSelect = async (file: File) => {
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      showToast('File is too large. Please select an image under 20MB.', 'warn');
      return;
    }

    try {
      const result = await compressImageFile(file, {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.82,
      });

      if (result && result.dataUrl) {
        setImageUrl(result.dataUrl);
        showToast(`Loaded & optimized ${file.name} (${result.sizeStr})`, 'info');
      }
    } catch (err) {
      console.error('Background compression error:', err);
      const reader = new FileReader();
      reader.onload = e => {
        const dataUrl = e.target?.result as string;
        if (dataUrl) {
          setImageUrl(dataUrl);
          showToast(`Loaded ${file.name} from device`, 'info');
        }
      };
      reader.onerror = () => {
        showToast('Failed to read background image from device.', 'warn');
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle URL Add
  const handleApplyUrl = () => {
    if (!urlInput.trim()) {
      setUrlError('Please enter a valid image web URL.');
      return;
    }
    setImageUrl(urlInput.trim());
    setIsUrlModalOpen(false);
    setUrlInput('');
    setUrlError(null);
    showToast('Background URL applied to preview', 'info');
  };

  // Remove background
  const handleRemoveBackground = () => {
    setImageUrl('');
    showToast('Background image removed.', 'info');
  };

  // Save Background to CMS and storage
  const handleSaveBackground = () => {
    const draft = landingCmsService.getDraftConfig();
    const updatedBg = {
      imageUrl,
      brightness,
      overlayOpacity,
      overlayColor,
      blur,
      position,
      fit,
      scale: 100,
      useSameForAllDevices: true,
      enabled: Boolean(imageUrl && imageUrl.trim() !== ''),
    };

    draft.interfaceBackground = updatedBg;
    landingCmsService.saveDraft(draft);
    landingCmsService.publish(draft);
    setConfig(draft);

    showToast('Interface background saved and applied across the public portal!', 'success');
    if (onSaved) onSaved();
  };

  // Reset to default
  const handleResetToDefault = () => {
    const defaultUrl = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1920&q=80';
    setImageUrl(defaultUrl);
    setPosition('center');
    setFit('cover');
    setOverlayOpacity(35);
    setOverlayColor('#064e3b');
    setBrightness(100);
    setBlur(0);
    setRepeat('no-repeat');
    showToast('Reset background settings to default.', 'info');
  };

  return (
    <div className="py-6 px-4 max-w-7xl mx-auto space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl text-white font-bold text-xs animate-bounce ${
            toast.type === 'success' ? 'bg-emerald-700' : toast.type === 'warn' ? 'bg-amber-600' : 'bg-blue-700'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Hidden File Input for Device Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => {
          const f = e.target.files?.[0];
          if (f) handleDeviceFileSelect(f);
        }}
      />

      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-emerald-800/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Interface & Portal Canvas Master
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              🖼 Interface Background
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Import a high-resolution background image directly from your device or specify a web image URL to customize the landing page backdrop, visual atmosphere, and overlay contrast.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsFullPreviewOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-2 border border-slate-700 shadow-md transition cursor-pointer"
            >
              <Eye className="w-4 h-4 text-emerald-400" />
              <span>Full Screen Preview</span>
            </button>
            <button
              type="button"
              onClick={handleSaveBackground}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Save Background</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Background Canvas Preview & Direct Import Controls */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-stone-900">Current Background</h3>
                <p className="text-xs text-stone-500">Live backdrop visual preview with active overlays</p>
              </div>

              {/* Viewport switcher */}
              <div className="flex items-center rounded-xl bg-stone-100 p-1 border border-stone-200">
                <button
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  className={`p-1.5 rounded-lg transition ${
                    previewDevice === 'desktop' ? 'bg-white text-emerald-800 shadow-xs' : 'text-stone-500'
                  }`}
                  title="Desktop Preview"
                >
                  <Monitor className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('tablet')}
                  className={`p-1.5 rounded-lg transition ${
                    previewDevice === 'tablet' ? 'bg-white text-emerald-800 shadow-xs' : 'text-stone-500'
                  }`}
                  title="Tablet Preview"
                >
                  <Tablet className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  className={`p-1.5 rounded-lg transition ${
                    previewDevice === 'mobile' ? 'bg-white text-emerald-800 shadow-xs' : 'text-stone-500'
                  }`}
                  title="Mobile Preview"
                >
                  <Smartphone className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* PREVIEW FRAME */}
            <div
              className={`mx-auto rounded-2xl overflow-hidden border-2 border-stone-300 relative shadow-inner transition-all duration-300 ${
                previewDevice === 'desktop'
                  ? 'w-full h-80'
                  : previewDevice === 'tablet'
                  ? 'w-4/5 h-80'
                  : 'w-3/5 h-80'
              }`}
              style={{
                backgroundColor: overlayColor,
              }}
            >
              {imageUrl ? (
                <>
                  <div
                    className="absolute inset-0 transition-all duration-200"
                    style={{
                      backgroundImage: `url(${imageUrl})`,
                      backgroundPosition: position,
                      backgroundSize: fit,
                      backgroundRepeat: repeat,
                      filter: `brightness(${brightness}%) blur(${blur}px)`,
                    }}
                  />
                  <div
                    className="absolute inset-0 transition-opacity duration-200"
                    style={{
                      backgroundColor: overlayColor,
                      opacity: overlayOpacity / 100,
                    }}
                  />
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-400 bg-stone-100">
                  <ImageIcon className="w-12 h-12 mb-2 text-stone-300" />
                  <span className="text-xs font-semibold">No background image set (solid backdrop)</span>
                </div>
              )}

              {/* Sample Content Floating over background */}
              <div className="relative z-10 p-6 text-white space-y-2 pointer-events-none drop-shadow-md">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide uppercase bg-emerald-800/80 border border-emerald-400/40">
                  Live Atmosphere Preview
                </span>
                <h4 className="text-xl font-black">DA HINUNANGAN SWINE REGISTRY</h4>
                <p className="text-xs text-white/90 max-w-sm">
                  Municipal Biosecurity Surveillance & Swine Traceability Portal
                </p>
              </div>
            </div>

            {/* Import / URL / Remove Button Row */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>📁 Import from Device</span>
              </button>

              <button
                type="button"
                onClick={() => setIsUrlModalOpen(true)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
              >
                <LinkIcon className="w-4 h-4 text-emerald-400" />
                <span>🔗 Use Image URL</span>
              </button>

              {imageUrl && (
                <button
                  type="button"
                  onClick={handleRemoveBackground}
                  className="py-2.5 px-4 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer border border-red-200"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Remove Background</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right: Fine-Tuning Background Controls */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-5">
            <div className="border-b border-stone-200 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-emerald-700" />
                <h3 className="text-base font-black text-stone-900">Background Controls</h3>
              </div>
              <button
                type="button"
                onClick={handleResetToDefault}
                className="text-xs font-bold text-stone-500 hover:text-stone-800 flex items-center gap-1 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>

            <div className="space-y-4 text-xs font-bold text-stone-700">
              {/* Position */}
              <div className="space-y-1.5">
                <label className="flex items-center justify-between">
                  <span>Image Position</span>
                  <span className="text-emerald-700 capitalize">{position}</span>
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {(['center', 'top', 'bottom', 'left', 'right'] as const).map(pos => (
                    <button
                      key={pos}
                      type="button"
                      onClick={() => setPosition(pos)}
                      className={`py-1.5 rounded-lg capitalize text-xs transition cursor-pointer ${
                        position === pos
                          ? 'bg-emerald-800 text-white font-black shadow-2xs'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              </div>

              {/* Size / Fit */}
              <div className="space-y-1.5">
                <label className="flex items-center justify-between">
                  <span>Scaling & Fit</span>
                  <span className="text-emerald-700 capitalize">{fit}</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['cover', 'contain', 'auto'] as const).map(f => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFit(f)}
                      className={`py-1.5 rounded-lg capitalize text-xs transition cursor-pointer ${
                        fit === f
                          ? 'bg-emerald-800 text-white font-black shadow-2xs'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Overlay Opacity */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span>Overlay Darkness / Opacity</span>
                  <span className="text-emerald-700">{overlayOpacity}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={overlayOpacity}
                  onChange={e => setOverlayOpacity(Number(e.target.value))}
                  className="w-full accent-emerald-700 cursor-pointer"
                />
              </div>

              {/* Overlay Color Picker */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span>Overlay Tone Color</span>
                  <span className="text-stone-500 font-mono text-[11px]">{overlayColor}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={overlayColor}
                    onChange={e => setOverlayColor(e.target.value)}
                    className="w-10 h-9 rounded-lg border border-stone-300 cursor-pointer p-0.5"
                  />
                  <div className="flex-1 flex gap-1.5">
                    {['#064e3b', '#022c22', '#0f172a', '#1e1b4b', '#000000'].map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setOverlayColor(c)}
                        style={{ backgroundColor: c }}
                        className="w-6 h-6 rounded-md border border-stone-300 cursor-pointer hover:scale-110 transition"
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Brightness */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span>Brightness Level</span>
                  <span className="text-emerald-700">{brightness}%</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="160"
                  step="5"
                  value={brightness}
                  onChange={e => setBrightness(Number(e.target.value))}
                  className="w-full accent-emerald-700 cursor-pointer"
                />
              </div>

              {/* Blur */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span>Atmospheric Blur Effect</span>
                  <span className="text-emerald-700">{blur} px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="1"
                  value={blur}
                  onChange={e => setBlur(Number(e.target.value))}
                  className="w-full accent-emerald-700 cursor-pointer"
                />
              </div>

              {/* Repeat Mode */}
              <div className="space-y-1.5">
                <label className="flex items-center justify-between">
                  <span>Pattern Repeat</span>
                  <span className="text-emerald-700">{repeat}</span>
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['no-repeat', 'repeat', 'repeat-x', 'repeat-y'] as const).map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRepeat(r)}
                      className={`py-1 rounded-md text-[11px] transition cursor-pointer ${
                        repeat === r
                          ? 'bg-emerald-800 text-white font-bold'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleResetToDefault}
                className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs transition cursor-pointer"
              >
                Reset Defaults
              </button>
              <button
                type="button"
                onClick={handleSaveBackground}
                className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-2 shadow-md transition cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Save & Publish Background</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ───────────────────── URL INPUT MODAL ───────────────────── */}
      {isUrlModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-emerald-700" />
              Use Image Web URL
            </h3>
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-700">Image URL / Link</label>
              <input
                type="url"
                value={urlInput}
                onChange={e => {
                  setUrlInput(e.target.value);
                  setUrlError(null);
                }}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
              {urlError && <p className="text-[11px] text-red-600 font-medium">{urlError}</p>}
            </div>

            {urlInput.trim() && (
              <div className="h-28 rounded-xl border border-stone-200 bg-stone-50 overflow-hidden flex items-center justify-center">
                <img
                  src={urlInput}
                  alt="Preview"
                  className="max-h-full max-w-full object-contain"
                  onError={() => setUrlError('Unable to load image from this URL')}
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsUrlModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-stone-100 text-stone-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyUrl}
                className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
              >
                <Check className="w-4 h-4" />
                <span>Apply URL</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────── FULL SCREEN PREVIEW MODAL ───────────────────── */}
      {isFullPreviewOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white animate-in fade-in">
          <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-bold text-sm">Full Canvas Atmosphere Preview</span>
              <span className="text-xs text-slate-400">Position: {position} • Fit: {fit} • Opacity: {overlayOpacity}%</span>
            </div>
            <button
              type="button"
              onClick={() => setIsFullPreviewOpen(false)}
              className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
            >
              Close Preview
            </button>
          </div>

          <div
            className="flex-1 relative overflow-hidden"
            style={{
              backgroundColor: overlayColor,
            }}
          >
            {imageUrl && (
              <>
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `url(${imageUrl})`,
                    backgroundPosition: position,
                    backgroundSize: fit,
                    backgroundRepeat: repeat,
                    filter: `brightness(${brightness}%) blur(${blur}px)`,
                  }}
                />
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundColor: overlayColor,
                    opacity: overlayOpacity / 100,
                  }}
                />
              </>
            )}

            <div className="relative z-10 max-w-4xl mx-auto p-12 space-y-6 text-white drop-shadow-lg">
              <h2 className="text-4xl font-black">DA HINUNANGAN SWINE REGISTRY</h2>
              <p className="text-lg text-slate-200">
                Empowering Hinunangan Hog Raisers with Real-time Traceability, Offline Accessibility, and Resilient African Swine Fever (ASF) Biosecurity Monitoring.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

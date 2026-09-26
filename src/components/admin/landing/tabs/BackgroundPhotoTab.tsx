import React, { useRef, useState } from 'react';
import {
  Image as ImageIcon,
  Upload,
  FolderOpen,
  Trash2,
  RotateCcw,
  Monitor,
  Tablet,
  Smartphone,
  Sliders,
  Link as LinkIcon,
} from 'lucide-react';
import { LandingCmsConfig } from '../../../../types/landingCms';

interface BackgroundPhotoTabProps {
  config: LandingCmsConfig;
  onChange: (updates: Partial<LandingCmsConfig>) => void;
  onOpenMediaPicker?: (targetField: string) => void;
}

export const BackgroundPhotoTab: React.FC<BackgroundPhotoTabProps> = ({
  config,
  onChange,
  onOpenMediaPicker,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUrlInputOpen, setIsUrlInputOpen] = useState(false);
  const [urlDraft, setUrlDraft] = useState('');

  const bg = config.interfaceBackground || {
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

  const updateBg = (fields: Partial<typeof bg>) => {
    onChange({ interfaceBackground: { ...bg, ...fields } });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        updateBg({ imageUrl: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6 text-xs text-stone-800">
      {/* Background Image Upload & Preview */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b pb-3 border-stone-100">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-emerald-700" />
            <h3 className="font-bold text-stone-900 text-sm">Interface Background Photo</h3>
          </div>
          <span className="text-[11px] text-stone-400">Controls overall website backdrop</span>
        </div>

        {/* Live Visual Canvas Preview */}
        <div className="relative rounded-2xl overflow-hidden h-52 bg-stone-950 border border-stone-300 flex items-center justify-center">
          <div
            className="absolute inset-0 transition-all duration-200"
            style={{
              backgroundImage: `url(${bg.imageUrl})`,
              backgroundPosition: bg.position || 'center',
              backgroundSize: bg.fit || 'cover',
              filter: `brightness(${bg.brightness ?? 100}%) blur(${bg.blur ?? 0}px)`,
              transform: `scale(${(bg.scale ?? 100) / 100})`,
            }}
          />
          <div
            className="absolute inset-0 transition-opacity"
            style={{
              backgroundColor: bg.overlayColor || '#064e3b',
              opacity: (bg.overlayOpacity ?? 35) / 100,
            }}
          />
          <div className="relative z-10 bg-black/60 backdrop-blur-sm p-4 rounded-xl text-white text-center border border-white/20 max-w-sm">
            <p className="font-black text-sm">Backdrop Visual Filter Preview</p>
            <p className="text-[11px] text-stone-300 mt-1">
              Brightness: {bg.brightness}% • Blur: {bg.blur}px • Opacity: {bg.overlayOpacity}%
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer border border-stone-300"
          >
            <Upload className="w-3.5 h-3.5 text-stone-600" /> Upload Image
          </button>

          <button
            type="button"
            onClick={() => {
              setUrlDraft(bg.imageUrl || '');
              setIsUrlInputOpen(prev => !prev);
            }}
            className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              isUrlInputOpen
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-800 border-stone-300'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5 text-stone-600" /> URL
          </button>

          {onOpenMediaPicker && (
            <button
              type="button"
              onClick={() => onOpenMediaPicker('interfaceBackground.imageUrl')}
              className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer border border-emerald-300"
            >
              <FolderOpen className="w-3.5 h-3.5 text-emerald-700" /> Media Library
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              updateBg({ imageUrl: '' });
              setUrlDraft('');
              setIsUrlInputOpen(false);
            }}
            className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              bg.imageUrl
                ? 'border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100'
                : 'border-stone-200 text-stone-400 bg-stone-50'
            }`}
            title="Delete current background image"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>

          <button
            type="button"
            onClick={() =>
              updateBg({
                imageUrl:
                  'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1920&q=80',
                brightness: 100,
                blur: 0,
                overlayOpacity: 35,
              })
            }
            className="px-3 py-2 rounded-xl text-stone-500 hover:text-stone-800 text-xs transition cursor-pointer flex items-center gap-1 ml-auto"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </div>

        {/* Interactive URL Input Accordion Bar */}
        {isUrlInputOpen && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2 animate-in fade-in duration-150">
            <label className="text-xs font-bold text-emerald-950 block">
              Enter Direct Image URL:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={urlDraft}
                onChange={e => setUrlDraft(e.target.value)}
                placeholder="https://example.com/photo.jpg"
                className="flex-1 px-3 py-1.5 rounded-lg border border-stone-300 bg-white text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
              <button
                type="button"
                onClick={() => {
                  if (urlDraft.trim()) {
                    updateBg({ imageUrl: urlDraft.trim() });
                    setIsUrlInputOpen(false);
                  }
                }}
                className="py-1.5 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs cursor-pointer"
              >
                Apply
              </button>
              <button
                type="button"
                onClick={() => setIsUrlInputOpen(false)}
                className="py-1.5 px-2.5 rounded-lg border border-stone-300 bg-white text-stone-700 text-xs cursor-pointer hover:bg-stone-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Adjustments: Brightness, Opacity, Blur, Scale */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 border-b pb-3 border-stone-100">
          <Sliders className="w-4 h-4 text-emerald-700" />
          <h3 className="font-bold text-stone-900 text-sm">Color & Filter Adjustments</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              Brightness: {bg.brightness ?? 100}%
            </label>
            <input
              type="range"
              min={20}
              max={150}
              value={bg.brightness ?? 100}
              onChange={e => updateBg({ brightness: Number(e.target.value) })}
              className="w-full cursor-pointer accent-emerald-700"
            />
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              Overlay Opacity: {bg.overlayOpacity ?? 35}%
            </label>
            <input
              type="range"
              min={0}
              max={95}
              value={bg.overlayOpacity ?? 35}
              onChange={e => updateBg({ overlayOpacity: Number(e.target.value) })}
              className="w-full cursor-pointer accent-emerald-700"
            />
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              Blur Effect: {bg.blur ?? 0}px
            </label>
            <input
              type="range"
              min={0}
              max={16}
              value={bg.blur ?? 0}
              onChange={e => updateBg({ blur: Number(e.target.value) })}
              className="w-full cursor-pointer accent-emerald-700"
            />
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              Zoom Scale: {bg.scale ?? 100}%
            </label>
            <input
              type="range"
              min={90}
              max={140}
              value={bg.scale ?? 100}
              onChange={e => updateBg({ scale: Number(e.target.value) })}
              className="w-full cursor-pointer accent-emerald-700"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-stone-100">
          <div>
            <label className="block font-semibold text-stone-700 mb-1">Background Position</label>
            <select
              value={bg.position || 'center'}
              onChange={e => updateBg({ position: e.target.value as any })}
              className="w-full px-3 py-1.5 rounded-lg border border-stone-300 bg-white"
            >
              <option value="center">Center</option>
              <option value="top">Top</option>
              <option value="bottom">Bottom</option>
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Background Fit</label>
            <select
              value={bg.fit || 'cover'}
              onChange={e => updateBg({ fit: e.target.value as any })}
              className="w-full px-3 py-1.5 rounded-lg border border-stone-300 bg-white"
            >
              <option value="cover">Cover (Fill entire screen)</option>
              <option value="contain">Contain (Keep full aspect ratio)</option>
              <option value="auto">Auto Native Size</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Overlay Color Tint</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={bg.overlayColor || '#064e3b'}
                onChange={e => updateBg({ overlayColor: e.target.value })}
                className="w-8 h-8 rounded-lg border border-stone-300 cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={bg.overlayColor || '#064e3b'}
                onChange={e => updateBg({ overlayColor: e.target.value })}
                className="w-full px-2 py-1 rounded-lg border border-stone-300 font-mono text-[11px]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Device Overrides & Toggle */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b pb-3 border-stone-100">
          <div>
            <h3 className="font-bold text-stone-900 text-sm">Responsive Device Backgrounds</h3>
            <p className="text-[11px] text-stone-400">Optionally provide custom cropped photos for tablet and mobile</p>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={bg.useSameForAllDevices ?? true}
              onChange={e => updateBg({ useSameForAllDevices: e.target.checked })}
              className="w-4 h-4 rounded-sm text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
            />
            <span className="font-bold text-xs text-stone-800">Use same image on all devices</span>
          </label>
        </div>

        {!bg.useSameForAllDevices && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-3 rounded-xl border border-stone-200 bg-stone-50 space-y-2">
              <span className="font-bold text-stone-900 flex items-center gap-1.5">
                <Tablet className="w-4 h-4 text-emerald-700" /> Tablet Background Image
              </span>
              <input
                type="text"
                value={bg.tabletImageUrl || ''}
                onChange={e => updateBg({ tabletImageUrl: e.target.value })}
                placeholder="https://example.com/tablet-bg.jpg"
                className="w-full px-3 py-1.5 rounded-lg border border-stone-300 bg-white"
              />
            </div>

            <div className="p-3 rounded-xl border border-stone-200 bg-stone-50 space-y-2">
              <span className="font-bold text-stone-900 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-emerald-700" /> Mobile Background Image
              </span>
              <input
                type="text"
                value={bg.mobileImageUrl || ''}
                onChange={e => updateBg({ mobileImageUrl: e.target.value })}
                placeholder="https://example.com/mobile-bg.jpg"
                className="w-full px-3 py-1.5 rounded-lg border border-stone-300 bg-white"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

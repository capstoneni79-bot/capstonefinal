import React, { useRef, useState } from 'react';
import {
  Megaphone,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Upload,
  FolderOpen,
  RotateCcw,
  Sparkles,
  Edit2,
  Trash2,
  Plus,
  Check,
  X,
} from 'lucide-react';
import { LandingCmsConfig } from '../../../../types/landingCms';

interface HeroTabProps {
  config: LandingCmsConfig;
  onChange: (updates: Partial<LandingCmsConfig>) => void;
  onOpenMediaPicker?: (targetField: string) => void;
}

const DEFAULT_HERO_PRESETS = [
  {
    name: 'Sanitary Swine Barn (Hinunangan Standard)',
    url: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=1600&q=80',
  },
  {
    name: 'Hinunangan Rural Farm & Coconut Valley',
    url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1920&q=80',
  },
  {
    name: 'Agricultural Extension & Animal Research Pen',
    url: 'https://images.unsplash.com/photo-1595152772835-219674b2a8a6?auto=format&fit=crop&w=1600&q=80',
  },
  {
    name: 'High-Health Breeding Finisher Facility',
    url: 'https://images.unsplash.com/photo-1594737625785-a6cbdabd333c?auto=format&fit=crop&w=1600&q=80',
  },
];

export const HeroTab: React.FC<HeroTabProps> = ({ config, onChange, onOpenMediaPicker }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingPresetIdx, setEditingPresetIdx] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editUrl, setEditUrl] = useState('');

  const presets = config.heroImagePresets && config.heroImagePresets.length > 0
    ? config.heroImagePresets
    : DEFAULT_HERO_PRESETS;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onChange({ heroBackgroundUrl: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePresetPhotoUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const updated = [...presets];
        updated[index] = { ...updated[index], url: reader.result };
        onChange({ heroImagePresets: updated, heroBackgroundUrl: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSavePresetEdit = (index: number) => {
    const updated = [...presets];
    updated[index] = {
      ...updated[index],
      name: editName.trim() || updated[index].name,
      url: editUrl.trim() || updated[index].url,
    };
    onChange({ heroImagePresets: updated });
    setEditingPresetIdx(null);
  };

  const handleAddNewPreset = () => {
    const newPreset = {
      name: `Custom Preset ${presets.length + 1}`,
      url: config.heroBackgroundUrl || DEFAULT_HERO_PRESETS[0].url,
    };
    const updated = [...presets, newPreset];
    onChange({ heroImagePresets: updated });
    setEditingPresetIdx(updated.length - 1);
    setEditName(newPreset.name);
    setEditUrl(newPreset.url);
  };

  const handleDeletePreset = (index: number) => {
    const updated = presets.filter((_, i) => i !== index);
    onChange({ heroImagePresets: updated.length > 0 ? updated : DEFAULT_HERO_PRESETS });
    if (editingPresetIdx === index) setEditingPresetIdx(null);
  };

  return (
    <div className="space-y-6 text-xs text-stone-800">
      {/* Headlines & Copywriting with Font Color Customization */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 border-b pb-3 border-stone-100">
          <Megaphone className="w-4 h-4 text-emerald-700" />
          <h3 className="font-bold text-stone-900 text-sm">Hero Copy & Typography Colors</h3>
        </div>

        <div className="space-y-4">
          {/* Top Badge Notice */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block font-semibold text-stone-700">Top Badge Pill Notice</label>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-stone-500">Font Color:</span>
                <input
                  type="color"
                  value={config.heroBadgeColor || '#a7f3d0'}
                  onChange={e => onChange({ heroBadgeColor: e.target.value })}
                  className="w-6 h-6 rounded-md border border-stone-300 cursor-pointer p-0.5"
                  title="Badge Font Color"
                />
              </div>
            </div>
            <input
              type="text"
              value={config.heroBadgeText}
              onChange={e => onChange({ heroBadgeText: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 font-medium"
              placeholder="e.g. Official Government Platform • Republic of the Philippines"
            />
          </div>

          {/* Main Hero Headline (H1) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block font-semibold text-stone-700">Main Hero Headline (H1)</label>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-stone-500">Font Color:</span>
                <input
                  type="color"
                  value={config.heroTitleColor || '#ffffff'}
                  onChange={e => onChange({ heroTitleColor: e.target.value })}
                  className="w-6 h-6 rounded-md border border-stone-300 cursor-pointer p-0.5"
                  title="Headline Font Color"
                />
              </div>
            </div>
            <input
              type="text"
              value={config.heroTitle}
              onChange={e => onChange({ heroTitle: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold text-stone-900 text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              placeholder="e.g. DA HINUNANGAN SWINE REGISTRY"
            />
          </div>

          {/* Hero Subtitle */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block font-semibold text-stone-700">Hero Subtitle</label>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-stone-500">Font Color:</span>
                <input
                  type="color"
                  value={config.heroSubtitleColor || '#ecfdf5'}
                  onChange={e => onChange({ heroSubtitleColor: e.target.value })}
                  className="w-6 h-6 rounded-md border border-stone-300 cursor-pointer p-0.5"
                  title="Subtitle Font Color"
                />
              </div>
            </div>
            <textarea
              rows={2}
              value={config.heroSubtitle}
              onChange={e => onChange({ heroSubtitle: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden leading-relaxed"
              placeholder="Empowering Hinunangan Hog Raisers with Real-time Traceability..."
            />
          </div>

          {/* Hero Extended Description */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block font-semibold text-stone-700">Hero Extended Description</label>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-stone-500">Font Color:</span>
                <input
                  type="color"
                  value={config.heroDescriptionColor || '#d1fae5'}
                  onChange={e => onChange({ heroDescriptionColor: e.target.value })}
                  className="w-6 h-6 rounded-md border border-stone-300 cursor-pointer p-0.5"
                  title="Description Font Color"
                />
              </div>
            </div>
            <textarea
              rows={3}
              value={config.heroDescription}
              onChange={e => onChange({ heroDescription: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden leading-relaxed text-[11px]"
              placeholder="Detailed introduction of municipal mandate, agriculture services, and focal person responsibilities."
            />
          </div>
        </div>
      </div>

      {/* Buttons & Links */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 border-b pb-3 border-stone-100">
          <Sparkles className="w-4 h-4 text-emerald-700" />
          <h3 className="font-bold text-stone-900 text-sm">Call to Action (CTA) Buttons</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/60 space-y-2">
            <span className="font-bold text-stone-900 block text-xs">Primary CTA Button</span>
            <div>
              <label className="block text-[11px] text-stone-600 mb-1">Button Text</label>
              <input
                type="text"
                value={config.primaryButtonText}
                onChange={e => onChange({ primaryButtonText: e.target.value })}
                className="w-full px-3 py-1.5 rounded-lg border border-stone-300 bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] text-stone-600 mb-1">Target Link / Action</label>
              <input
                type="text"
                value={config.primaryButtonLink}
                onChange={e => onChange({ primaryButtonLink: e.target.value })}
                className="w-full px-3 py-1.5 rounded-lg border border-stone-300 bg-white font-mono text-[11px]"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/60 space-y-2">
            <span className="font-bold text-stone-900 block text-xs">Secondary CTA Button</span>
            <div>
              <label className="block text-[11px] text-stone-600 mb-1">Button Text</label>
              <input
                type="text"
                value={config.secondaryButtonText}
                onChange={e => onChange({ secondaryButtonText: e.target.value })}
                className="w-full px-3 py-1.5 rounded-lg border border-stone-300 bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] text-stone-600 mb-1">Target Link / Action</label>
              <input
                type="text"
                value={config.secondaryButtonLink}
                onChange={e => onChange({ secondaryButtonLink: e.target.value })}
                className="w-full px-3 py-1.5 rounded-lg border border-stone-300 bg-white font-mono text-[11px]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Hero Background Photo & Editable Presets */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b pb-3 border-stone-100">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-emerald-700" />
            <h3 className="font-bold text-stone-900 text-sm">Hero Background Photo & Overlay</h3>
          </div>
          <span className="text-[11px] text-stone-400">High-res responsive image</span>
        </div>

        {/* Current Image Preview */}
        <div className="relative rounded-xl overflow-hidden border border-stone-200 h-44 bg-stone-900 flex items-center justify-center">
          <img
            src={config.heroBackgroundUrl}
            alt="Hero Background Preview"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div
            className="absolute inset-0 transition-opacity"
            style={{
              backgroundColor: config.heroOverlayColor || '#022c22',
              opacity: (config.heroOverlayOpacity ?? 75) / 100,
            }}
          />
          <div className="relative z-10 text-white text-center p-4">
            <p className="font-bold text-sm">Live Overlay Simulation</p>
            <p className="text-[11px] text-stone-300">
              Opacity: {config.heroOverlayOpacity}% • Tint: {config.heroOverlayColor}
            </p>
          </div>
        </div>

        {/* Image Controls */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
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
            className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer border border-stone-300"
          >
            <Upload className="w-3.5 h-3.5 text-stone-600" /> Upload New Photo
          </button>

          {onOpenMediaPicker && (
            <button
              type="button"
              onClick={() => onOpenMediaPicker('heroBackgroundUrl')}
              className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer border border-emerald-300"
            >
              <FolderOpen className="w-3.5 h-3.5 text-emerald-700" /> Choose From Media Library
            </button>
          )}

          <button
            type="button"
            onClick={() =>
              onChange({
                heroBackgroundUrl: DEFAULT_HERO_PRESETS[0].url,
                heroImagePresets: DEFAULT_HERO_PRESETS,
              })
            }
            className="px-3 py-1.5 rounded-xl text-stone-500 hover:text-stone-800 text-xs transition cursor-pointer flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" /> Reset Default Presets
          </button>
        </div>

        {/* Editable Presets List */}
        <div className="space-y-2 pt-2 border-t border-stone-100">
          <div className="flex items-center justify-between">
            <span className="font-bold text-stone-800 text-xs">
              Quick Presets (Hinunangan Farm Environments):
            </span>
            <button
              type="button"
              onClick={handleAddNewPreset}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg cursor-pointer transition"
            >
              <Plus className="w-3 h-3" /> Add Preset
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {presets.map((preset, idx) => {
              const isSelected = config.heroBackgroundUrl === preset.url;
              const isEditing = editingPresetIdx === idx;

              return (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl border text-left transition relative group ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20 shadow-xs'
                      : 'border-stone-200 bg-white hover:border-stone-300'
                  }`}
                >
                  <div
                    onClick={() => onChange({ heroBackgroundUrl: preset.url })}
                    className="h-16 rounded-lg bg-stone-200 overflow-hidden mb-2 cursor-pointer relative"
                  >
                    <img
                      src={preset.url}
                      alt={preset.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      referrerPolicy="no-referrer"
                    />
                    {isSelected && (
                      <span className="absolute top-1 right-1 bg-emerald-700 text-white p-0.5 rounded-full shadow-xs">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-1.5">
                      <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        placeholder="Preset Name"
                        className="w-full px-2 py-1 rounded-md border border-stone-300 text-[11px] font-semibold"
                      />
                      <input
                        type="text"
                        value={editUrl}
                        onChange={e => setEditUrl(e.target.value)}
                        placeholder="Image URL"
                        className="w-full px-2 py-1 rounded-md border border-stone-300 text-[10px] font-mono"
                      />
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          type="button"
                          onClick={() => handleSavePresetEdit(idx)}
                          className="p-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded cursor-pointer"
                          title="Save"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingPresetIdx(null)}
                          className="p-1 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded cursor-pointer"
                          title="Cancel"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p
                        onClick={() => onChange({ heroBackgroundUrl: preset.url })}
                        className="text-[11px] font-semibold text-stone-800 leading-tight line-clamp-2 cursor-pointer hover:text-emerald-800 mb-2"
                      >
                        {preset.name}
                      </p>

                      <div className="flex items-center justify-between border-t pt-1.5 border-stone-100">
                        {/* Change Image Button */}
                        <label className="text-[10px] text-emerald-800 hover:text-emerald-950 font-bold cursor-pointer inline-flex items-center gap-0.5">
                          <Upload className="w-2.5 h-2.5" /> Change Image
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={e => handlePresetPhotoUpload(idx, e)}
                          />
                        </label>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPresetIdx(idx);
                              setEditName(preset.name);
                              setEditUrl(preset.url);
                            }}
                            className="p-1 text-stone-400 hover:text-stone-700 rounded cursor-pointer"
                            title="Edit preset name & URL"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          {presets.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeletePreset(idx)}
                              className="p-1 text-stone-400 hover:text-red-600 rounded cursor-pointer"
                              title="Delete preset"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Position, Opacity & Alignment controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-stone-100">
          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              Overlay Opacity: {config.heroOverlayOpacity}%
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={config.heroOverlayOpacity}
              onChange={e => onChange({ heroOverlayOpacity: Number(e.target.value) })}
              className="w-full cursor-pointer accent-emerald-700"
            />
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Overlay Tint Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={config.heroOverlayColor || '#022c22'}
                onChange={e => onChange({ heroOverlayColor: e.target.value })}
                className="w-8 h-8 rounded-lg border border-stone-300 cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={config.heroOverlayColor || '#022c22'}
                onChange={e => onChange({ heroOverlayColor: e.target.value })}
                className="w-full px-2.5 py-1 rounded-lg border border-stone-300 font-mono text-[11px]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Text Alignment</label>
            <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200">
              <button
                type="button"
                onClick={() => onChange({ heroTextAlign: 'left' })}
                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1 transition ${
                  config.heroTextAlign === 'left' ? 'bg-white font-bold text-emerald-800 shadow-2xs' : 'text-stone-600'
                }`}
              >
                <AlignLeft className="w-3.5 h-3.5" /> Left
              </button>
              <button
                type="button"
                onClick={() => onChange({ heroTextAlign: 'center' })}
                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1 transition ${
                  config.heroTextAlign === 'center' ? 'bg-white font-bold text-emerald-800 shadow-2xs' : 'text-stone-600'
                }`}
              >
                <AlignCenter className="w-3.5 h-3.5" /> Center
              </button>
              <button
                type="button"
                onClick={() => onChange({ heroTextAlign: 'right' })}
                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1 transition ${
                  config.heroTextAlign === 'right' ? 'bg-white font-bold text-emerald-800 shadow-2xs' : 'text-stone-600'
                }`}
              >
                <AlignRight className="w-3.5 h-3.5" /> Right
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

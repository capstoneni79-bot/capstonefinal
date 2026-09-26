import React, { useState, useEffect, useRef } from 'react';
import {
  Palette,
  Check,
  RotateCcw,
  Save,
  X,
  Sparkles,
  LayoutGrid,
  Truck,
  MessageSquare,
  Shield,
  FileText,
  Sliders,
  Eye,
  CheckCircle2,
  Upload,
  Link as LinkIcon,
  Trash2,
  Image as ImageIcon,
  Camera,
  Edit2,
  Plus,
} from 'lucide-react';
import { SidebarTheme } from '../../types';
import { storageService } from '../../services/storageService';
import { DEFAULT_SIDEBAR_THEME, SIDEBAR_THEME_PRESETS } from '../../data/initialFormSchema';
import { SealDA, SealMunicipality, SealTaskForce, SealSLSU } from '../common/OfficialSeals';
import { compressImageFile } from '../../utils/imageCompressor';

export interface EmblemPresetItem {
  id: string;
  name: string;
  subtitle: string;
  logoUrl?: string;
  vectorKey?: 'SealMunicipality' | 'SealDA' | 'SealTaskForce' | 'SealSLSU';
}

const DEFAULT_EMBLEM_PRESETS: EmblemPresetItem[] = [
  {
    id: 'emblem-lgu',
    name: 'Hinunangan LGU',
    subtitle: 'Municipal Seal',
    vectorKey: 'SealMunicipality',
  },
  {
    id: 'emblem-da',
    name: 'DA Department',
    subtitle: 'Agriculture Seal',
    vectorKey: 'SealDA',
  },
  {
    id: 'emblem-taskforce',
    name: 'ASF Task Force',
    subtitle: 'Protection Seal',
    vectorKey: 'SealTaskForce',
  },
  {
    id: 'emblem-institution',
    name: 'Agri Research Pen',
    subtitle: 'Extension Seal',
    vectorKey: 'SealSLSU',
  },
];

interface SidebarColorConfigProps {
  onSaved?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const SidebarColorConfig: React.FC<SidebarColorConfigProps> = ({
  onSaved,
  onNavigateTab,
}) => {
  // Current saved theme from storage
  const [initialTheme, setInitialTheme] = useState<SidebarTheme>(() => storageService.getSidebarTheme());
  
  // Working local state for live customization
  const [theme, setTheme] = useState<SidebarTheme>(initialTheme);
  const [activePresetId, setActivePresetId] = useState<string>(() => {
    const matched = SIDEBAR_THEME_PRESETS.find(p => p.backgroundColor === initialTheme.backgroundColor && p.activeMenuColor === initialTheme.activeMenuColor);
    return matched ? matched.id : 'custom';
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activePreviewTab, setActivePreviewTab] = useState<'dashboard' | 'ready_to_sell' | 'messages'>('dashboard');

  // Emblem Presets state
  const [emblems, setEmblems] = useState<EmblemPresetItem[]>(() => {
    try {
      const saved = localStorage.getItem('sidebar_custom_emblems');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_EMBLEM_PRESETS;
  });

  const [editingEmblemId, setEditingEmblemId] = useState<string | null>(null);
  const [editEmblemName, setEditEmblemName] = useState('');
  const [editEmblemSubtitle, setEditEmblemSubtitle] = useState('');
  const [editEmblemUrl, setEditEmblemUrl] = useState('');

  // Logo configuration state
  const [urlInput, setUrlInput] = useState<string>('');
  const [isUrlInputOpen, setIsUrlInputOpen] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const saveEmblemsToStorage = (items: EmblemPresetItem[]) => {
    setEmblems(items);
    try {
      localStorage.setItem('sidebar_custom_emblems', JSON.stringify(items));
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const current = storageService.getSidebarTheme();
    setInitialTheme(current);
    setTheme(current);
  }, []);

  const handleColorChange = (key: keyof SidebarTheme, value: string) => {
    setTheme(prev => ({
      ...prev,
      [key]: value,
      name: 'Custom',
    }));
    setActivePresetId('custom');
  };

  const handleApplyPreset = (preset: SidebarTheme) => {
    setTheme(prev => ({
      ...preset,
      logoUrl: prev.logoUrl,
      logoShape: prev.logoShape,
      logoSize: prev.logoSize,
    }));
    setActivePresetId(preset.id);
  };

  const handleResetDefault = () => {
    setTheme({ ...DEFAULT_SIDEBAR_THEME });
    setActivePresetId(DEFAULT_SIDEBAR_THEME.id);
    showToast('Reset to default Government Navy theme colors');
  };

  const handleSave = () => {
    storageService.saveSidebarTheme(theme);
    setInitialTheme(theme);
    showToast('✓ Sidebar configuration (colors & logo) saved and applied successfully');
    if (onSaved) onSaved();
  };

  const handleCancel = () => {
    setTheme(initialTheme);
    const matched = SIDEBAR_THEME_PRESETS.find(p => p.backgroundColor === initialTheme.backgroundColor && p.activeMenuColor === initialTheme.activeMenuColor);
    setActivePresetId(matched ? matched.id : 'custom');
    showToast('Reverted unsaved theme changes');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Logo Handlers
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const res = await compressImageFile(file, {
        maxWidth: 512,
        maxHeight: 512,
        quality: 0.9,
      });

      if (res?.dataUrl) {
        setTheme(prev => ({
          ...prev,
          logoUrl: res.dataUrl,
        }));
        showToast(`Uploaded new sidebar logo (${res.sizeStr})`);
      }
    } catch {
      showToast('Could not process image. Please try another file.');
    }
  };

  const handleApplyLogoUrl = () => {
    if (!urlInput.trim()) {
      showToast('Please enter an image URL');
      return;
    }
    setTheme(prev => ({
      ...prev,
      logoUrl: urlInput.trim(),
    }));
    setIsUrlInputOpen(false);
    setUrlInput('');
    showToast('Custom logo URL applied to sidebar');
  };

  const handleRemoveLogo = () => {
    setTheme(prev => ({
      ...prev,
      logoUrl: undefined,
    }));
    showToast('Reverted to default Hinunangan Municipal Seal');
  };

  const colorFields: { key: keyof SidebarTheme; label: string; description: string }[] = [
    { key: 'backgroundColor', label: 'Sidebar Background Color', description: 'Overall backdrop of the navigation rail' },
    { key: 'activeMenuColor', label: 'Active Menu Color', description: 'Background pill of the currently active navigation tab' },
    { key: 'hoverColor', label: 'Hover Color', description: 'Subtle hover background when hovering over items' },
    { key: 'menuTextColor', label: 'Menu Text Color', description: 'Default navigation typography color' },
    { key: 'activeTextColor', label: 'Selected / Active Text Color', description: 'Typography color for the selected active item' },
    { key: 'iconColor', label: 'Icon Color', description: 'Tint color for default sidebar icons' },
    { key: 'sectionDividerColor', label: 'Section Divider Color', description: 'Horizontal borders and category separator lines' },
    { key: 'badgeColor', label: 'Badge & Indicator Color', description: 'Counter badges, unread pills, and active status dots' },
  ];

  return (
    <div className="py-6 px-4 sm:px-6 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-900 text-emerald-50 border border-emerald-500/50 shadow-2xl px-5 py-3 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
          <span className="text-sm font-semibold">{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-2 text-emerald-300 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 text-indigo-700 flex items-center justify-center shrink-0">
            <Palette className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-stone-900">Sidebar Color Configuration</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                Admin Customization
              </span>
            </div>
            <p className="text-sm text-stone-500 mt-1">
              Customize the portal sidebar appearance, active accents, typography, and divider colors with instant live preview.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleResetDefault}
            className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 font-semibold text-xs flex items-center gap-2 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Default</span>
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-600 hover:bg-stone-50 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Cancel</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-2 transition shadow-sm cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Customizer on Left, Live Sidebar Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Preset Themes & Color Selectors (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* ───────────────────── SIDEBAR LOGO CONFIGURATION ───────────────────── */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-emerald-600" />
                  <span>Sidebar Logo Configuration</span>
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Change the single emblem displayed at the top of the sidebar rail across the portal.
                </p>
              </div>

              {theme.logoUrl && (
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Reset to Default Seal</span>
                </button>
              )}
            </div>

            {/* Current Logo & Quick Controls */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div
                  className={`p-1.5 rounded-2xl border flex items-center justify-center shrink-0 shadow-sm transition ${
                    theme.logoShape === 'square'
                      ? 'rounded-lg'
                      : theme.logoShape === 'rounded'
                      ? 'rounded-2xl'
                      : 'rounded-full'
                  }`}
                  style={{
                    backgroundColor: theme.backgroundColor || '#070e20',
                    borderColor: theme.sectionDividerColor || '#1e3a8a',
                  }}
                >
                  {theme.logoUrl ? (
                    <img
                      src={theme.logoUrl}
                      alt="Sidebar Logo"
                      className={`object-contain ${
                        theme.logoSize === 'lg'
                          ? 'w-12 h-12'
                          : theme.logoSize === 'sm'
                          ? 'w-9 h-9'
                          : 'w-10 h-10'
                      } ${
                        theme.logoShape === 'square'
                          ? 'rounded-md'
                          : theme.logoShape === 'rounded'
                          ? 'rounded-xl'
                          : 'rounded-full'
                      }`}
                    />
                  ) : (
                    <div className={theme.logoSize === 'lg' ? 'w-12 h-12' : theme.logoSize === 'sm' ? 'w-9 h-9' : 'w-10 h-10'}>
                      <SealMunicipality className="w-full h-full" />
                    </div>
                  )}
                </div>

                <div>
                  <div className="font-bold text-stone-900 text-sm flex items-center gap-2">
                    <span>Active Single Logo</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {theme.logoUrl ? 'Custom Image' : 'Official Municipal Seal'}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Rendered in sidebar header next to "Hinunangan Swine Farm Registry"
                  </p>
                </div>
              </div>

              {/* Upload & URL Buttons */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Logo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsUrlInputOpen(prev => !prev)}
                  className="flex-1 sm:flex-initial px-3 py-2 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-700 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>Web URL</span>
                </button>
              </div>
            </div>

            {/* URL Input Accordion */}
            {isUrlInputOpen && (
              <div className="p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/40 space-y-2.5 animate-in fade-in duration-200">
                <label className="text-xs font-bold text-stone-700 block">
                  Paste Direct Web Image URL:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                    placeholder="https://example.com/official-seal.png"
                    className="flex-1 px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleApplyLogoUrl}
                    className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold cursor-pointer"
                  >
                    Apply
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsUrlInputOpen(false);
                      setUrlInput('');
                    }}
                    className="px-3 py-2 rounded-xl border border-stone-300 text-stone-600 text-xs font-semibold hover:bg-white cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Official Preset Emblems (Editable & Uploadable) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-800 block">
                  Official Emblems (1-Click Selection & Customization):
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const newId = 'emblem-' + Date.now();
                      const updated = [
                        ...emblems,
                        {
                          id: newId,
                          name: `Official Seal ${emblems.length + 1}`,
                          subtitle: 'Agency Emblem',
                          logoUrl: theme.logoUrl || '/icon.svg',
                        },
                      ];
                      saveEmblemsToStorage(updated);
                      setEditingEmblemId(newId);
                      setEditEmblemName(`Official Seal ${emblems.length + 1}`);
                      setEditEmblemSubtitle('Agency Emblem');
                      setEditEmblemUrl(theme.logoUrl || '/icon.svg');
                      showToast('Added new customizable emblem slot');
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg cursor-pointer transition"
                  >
                    <Plus className="w-3 h-3" /> Add Emblem
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      saveEmblemsToStorage(DEFAULT_EMBLEM_PRESETS);
                      setEditingEmblemId(null);
                      showToast('Reset emblems to default official seals');
                    }}
                    className="text-[10px] text-stone-400 hover:text-stone-700 font-semibold cursor-pointer"
                  >
                    Reset Defaults
                  </button>
                </div>
              </div>

              {/* Edit Emblem Modal / Form */}
              {editingEmblemId && (
                <div className="p-3.5 rounded-2xl border border-emerald-300 bg-emerald-50/60 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                      <Edit2 className="w-3.5 h-3.5 text-emerald-700" />
                      Edit Emblem Name & Photo
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingEmblemId(null)}
                      className="p-1 text-stone-400 hover:text-stone-700 rounded cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-stone-700 mb-1">Emblem Name</label>
                      <input
                        type="text"
                        value={editEmblemName}
                        onChange={e => setEditEmblemName(e.target.value)}
                        placeholder="e.g. Hinunangan LGU"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 bg-white text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-stone-700 mb-1">Subtitle / Category</label>
                      <input
                        type="text"
                        value={editEmblemSubtitle}
                        onChange={e => setEditEmblemSubtitle(e.target.value)}
                        placeholder="e.g. Municipal Seal"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 bg-white text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-stone-700 mb-1">Photo / Seal Image URL</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editEmblemUrl}
                        onChange={e => setEditEmblemUrl(e.target.value)}
                        placeholder="https://... or upload below"
                        className="flex-1 px-2.5 py-1.5 rounded-lg border border-stone-300 bg-white text-[11px] font-mono"
                      />
                      <label className="px-3 py-1.5 bg-white border border-stone-300 hover:bg-stone-50 rounded-lg text-[11px] font-bold text-stone-700 flex items-center gap-1 cursor-pointer">
                        <Upload className="w-3 h-3 text-stone-500" /> Upload File
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async e => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              const res = await compressImageFile(file, { maxWidth: 256, maxHeight: 256, quality: 0.9 });
                              if (res?.dataUrl) {
                                setEditEmblemUrl(res.dataUrl);
                              }
                            } catch {
                              const reader = new FileReader();
                              reader.onload = () => {
                                if (typeof reader.result === 'string') setEditEmblemUrl(reader.result);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setEditingEmblemId(null)}
                      className="px-3 py-1 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-700 text-xs font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = emblems.map(em =>
                          em.id === editingEmblemId
                            ? {
                                ...em,
                                name: editEmblemName.trim() || em.name,
                                subtitle: editEmblemSubtitle.trim() || em.subtitle,
                                logoUrl: editEmblemUrl.trim() || em.logoUrl,
                                vectorKey: undefined,
                              }
                            : em
                        );
                        saveEmblemsToStorage(updated);
                        const current = updated.find(e => e.id === editingEmblemId);
                        if (current?.logoUrl) {
                          setTheme(prev => ({ ...prev, logoUrl: current.logoUrl }));
                        }
                        setEditingEmblemId(null);
                        showToast('Emblem updated successfully');
                      }}
                      className="px-4 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3 h-3" /> Save Changes
                    </button>
                  </div>
                </div>
              )}

              {/* Emblems Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {emblems.map(emblem => {
                  const isSelected =
                    (!emblem.logoUrl && !theme.logoUrl && emblem.vectorKey === 'SealMunicipality') ||
                    (emblem.logoUrl && theme.logoUrl === emblem.logoUrl);

                  return (
                    <div
                      key={emblem.id}
                      className={`p-2.5 rounded-xl border flex flex-col justify-between text-center transition group relative ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                          : 'border-stone-200 bg-white hover:bg-stone-50 hover:border-stone-300'
                      }`}
                    >
                      {/* Top Action Bar */}
                      <div className="flex items-center justify-end gap-1 mb-1">
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            setEditingEmblemId(emblem.id);
                            setEditEmblemName(emblem.name);
                            setEditEmblemSubtitle(emblem.subtitle);
                            setEditEmblemUrl(emblem.logoUrl || '');
                          }}
                          className="p-1 rounded text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
                          title="Edit Name & Photo"
                        >
                          <Edit2 className="w-2.5 h-2.5" />
                        </button>
                        {emblems.length > 1 && (
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              const updated = emblems.filter(e => e.id !== emblem.id);
                              saveEmblemsToStorage(updated);
                              if (editingEmblemId === emblem.id) setEditingEmblemId(null);
                            }}
                            className="p-1 rounded text-stone-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                            title="Delete Emblem"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>

                      {/* Clickable Card Body to Select Emblem */}
                      <div
                        onClick={() => {
                          if (emblem.logoUrl) {
                            setTheme(prev => ({ ...prev, logoUrl: emblem.logoUrl }));
                            showToast(`Selected ${emblem.name}`);
                          } else if (emblem.vectorKey === 'SealMunicipality') {
                            handleRemoveLogo();
                            showToast(`Selected ${emblem.name}`);
                          } else if (emblem.vectorKey === 'SealDA') {
                            setTheme(prev => ({
                              ...prev,
                              logoUrl: 'https://images.unsplash.com/photo-1595152772835-219674b2a8a6?auto=format&fit=crop&w=200&q=80',
                            }));
                            showToast(`Selected ${emblem.name}`);
                          } else if (emblem.vectorKey === 'SealTaskForce') {
                            setTheme(prev => ({
                              ...prev,
                              logoUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=200&q=80',
                            }));
                            showToast(`Selected ${emblem.name}`);
                          } else {
                            setTheme(prev => ({
                              ...prev,
                              logoUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=200&q=80',
                            }));
                            showToast(`Selected ${emblem.name}`);
                          }
                        }}
                        className="cursor-pointer space-y-1.5 flex flex-col items-center"
                      >
                        <div className="w-9 h-9 flex items-center justify-center rounded-lg overflow-hidden bg-stone-50 border border-stone-200 p-0.5">
                          {emblem.logoUrl ? (
                            <img
                              src={emblem.logoUrl}
                              alt={emblem.name}
                              className="w-full h-full object-contain"
                              referrerPolicy="no-referrer"
                            />
                          ) : emblem.vectorKey === 'SealDA' ? (
                            <SealDA className="w-full h-full" />
                          ) : emblem.vectorKey === 'SealTaskForce' ? (
                            <SealTaskForce className="w-full h-full" />
                          ) : emblem.vectorKey === 'SealSLSU' ? (
                            <SealSLSU className="w-full h-full" />
                          ) : (
                            <SealMunicipality className="w-full h-full" />
                          )}
                        </div>

                        <div>
                          <div className="text-[11px] font-bold text-stone-900 leading-tight line-clamp-1">{emblem.name}</div>
                          <div className="text-[9px] text-stone-500 line-clamp-1">{emblem.subtitle}</div>
                        </div>

                        {isSelected && (
                          <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded-full">
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Shape & Size Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Shape */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 block">Logo Display Shape:</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['circle', 'rounded', 'square'] as const).map(shape => {
                    const isShape = (theme.logoShape || 'circle') === shape;
                    return (
                      <button
                        key={shape}
                        type="button"
                        onClick={() => setTheme(prev => ({ ...prev, logoShape: shape }))}
                        className={`py-1.5 px-2 rounded-xl border text-xs font-bold capitalize transition cursor-pointer ${
                          isShape
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                            : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                        }`}
                      >
                        {shape}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Size */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 block">Logo Display Size:</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['sm', 'md', 'lg'] as const).map(sz => {
                    const isSize = (theme.logoSize || 'md') === sz;
                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setTheme(prev => ({ ...prev, logoSize: sz }))}
                        className={`py-1.5 px-2 rounded-xl border text-xs font-bold uppercase transition cursor-pointer ${
                          isSize
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                            : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                        }`}
                      >
                        {sz === 'sm' ? 'Compact' : sz === 'md' ? 'Normal' : 'Large'}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Preset Themes Section */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Preset Themes</span>
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Select a pre-calibrated color palette or fine-tune individual values.
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-stone-100 text-stone-600">
                Active: <strong className="text-stone-900">{theme.name || 'Custom'}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {SIDEBAR_THEME_PRESETS.map((preset) => {
                const isSelected = activePresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className={`p-3.5 rounded-2xl border text-left transition relative cursor-pointer group ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20 shadow-xs'
                        : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <div
                        className="w-5 h-5 rounded-full border border-black/10 shadow-xs shrink-0"
                        style={{ backgroundColor: preset.backgroundColor }}
                      />
                      <div
                        className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0 -ml-1"
                        style={{ backgroundColor: preset.activeMenuColor }}
                      />
                      <div
                        className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0 -ml-1"
                        style={{ backgroundColor: preset.badgeColor }}
                      />
                    </div>
                    <div className="font-bold text-xs text-stone-900 truncate">
                      {preset.name}
                    </div>
                    <div className="text-[10px] text-stone-500 font-mono mt-0.5 truncate">
                      {preset.backgroundColor}
                    </div>
                    {isSelected && (
                      <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detailed Color Pickers */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
            <div className="border-b border-stone-100 pb-3">
              <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600" />
                <span>Fine-Tuned Color Controls</span>
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Adjust each color token using the interactive color wheel or type a hexadecimal color code.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {colorFields.map(({ key, label, description }) => {
                const currentColor = (theme[key] as string) || '#000000';
                return (
                  <div
                    key={key}
                    className="p-3.5 rounded-2xl border border-stone-200 bg-stone-50/50 hover:bg-stone-50 transition space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <label className="text-xs font-bold text-stone-800 block leading-tight">
                          {label}
                        </label>
                        <p className="text-[11px] text-stone-500 leading-tight mt-0.5">
                          {description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                      {/* Interactive Color Swatch */}
                      <label className="relative cursor-pointer shrink-0">
                        <input
                          type="color"
                          value={currentColor.startsWith('#') && currentColor.length === 7 ? currentColor : '#2563eb'}
                          onChange={(e) => handleColorChange(key, e.target.value)}
                          className="opacity-0 w-9 h-9 absolute inset-0 cursor-pointer"
                        />
                        <div
                          className="w-9 h-9 rounded-xl border border-stone-300 shadow-inner flex items-center justify-center transition hover:scale-105"
                          style={{ backgroundColor: currentColor }}
                        >
                          <Palette className="w-3.5 h-3.5 text-white drop-shadow" />
                        </div>
                      </label>

                      {/* HEX Input */}
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={currentColor}
                          onChange={(e) => handleColorChange(key, e.target.value)}
                          placeholder="#000000"
                          className="w-full pl-3 pr-3 py-1.5 text-xs font-mono font-bold text-stone-800 bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Live Sidebar Preview (5 Cols) */}
        <div className="lg:col-span-5 sticky top-4 space-y-3">
          <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-stone-900">Sidebar Live Preview</h3>
              </div>
              <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                Real-time Rendering
              </span>
            </div>

            {/* Sidebar Mockup Container */}
            <div
              className="w-full rounded-2xl p-4 shadow-xl border overflow-hidden transition-colors duration-200 space-y-4 select-none"
              style={{
                backgroundColor: theme.backgroundColor,
                borderColor: theme.sectionDividerColor,
              }}
            >
              {/* Header inside Mockup (Single Configured Logo) */}
              <div className="flex items-center gap-2.5 pb-3 border-b" style={{ borderColor: theme.sectionDividerColor }}>
                <div className="shrink-0 flex items-center justify-center">
                  {theme.logoUrl ? (
                    <img
                      src={theme.logoUrl}
                      alt="Sidebar Logo"
                      className={`object-contain border shadow-xs ${
                        theme.logoSize === 'lg'
                          ? 'w-10 h-10'
                          : theme.logoSize === 'sm'
                          ? 'w-7 h-7'
                          : 'w-8 h-8'
                      } ${
                        theme.logoShape === 'square'
                          ? 'rounded-md'
                          : theme.logoShape === 'rounded'
                          ? 'rounded-xl'
                          : 'rounded-full'
                      }`}
                      style={{
                        borderColor: theme.sectionDividerColor,
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      }}
                    />
                  ) : (
                    <div className={theme.logoSize === 'lg' ? 'w-10 h-10' : theme.logoSize === 'sm' ? 'w-7 h-7' : 'w-8 h-8'}>
                      <SealMunicipality className="w-full h-full" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs leading-tight truncate" style={{ color: theme.activeTextColor }}>
                    DA Hinunangan Registry
                  </div>
                  <div className="text-[10px] opacity-75 truncate" style={{ color: theme.menuTextColor }}>
                    Municipal Agriculture Office
                  </div>
                </div>
              </div>

              {/* Profile Bar Mockup */}
              <div
                className="p-2.5 rounded-xl flex items-center gap-2.5 border"
                style={{
                  backgroundColor: theme.hoverColor || 'rgba(255,255,255,0.05)',
                  borderColor: theme.sectionDividerColor,
                }}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
                  style={{ backgroundColor: theme.activeMenuColor, color: theme.activeTextColor }}
                >
                  A
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold truncate" style={{ color: theme.activeTextColor }}>
                    Admin Valdez
                  </div>
                  <div className="text-[9px] opacity-70 truncate" style={{ color: theme.menuTextColor }}>
                    MAO Head / Executive
                  </div>
                </div>
              </div>

              {/* Navigation Items in Mockup */}
              <div className="space-y-1 text-xs">
                {/* 1. Dashboard (Active) */}
                <button
                  type="button"
                  onClick={() => setActivePreviewTab('dashboard')}
                  className="w-full text-left px-3 py-2 rounded-xl font-bold flex items-center justify-between transition cursor-pointer"
                  style={{
                    backgroundColor: activePreviewTab === 'dashboard' ? theme.activeMenuColor : 'transparent',
                    color: activePreviewTab === 'dashboard' ? theme.activeTextColor : theme.menuTextColor,
                  }}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <LayoutGrid className="w-4 h-4 shrink-0" style={{ color: activePreviewTab === 'dashboard' ? theme.activeTextColor : theme.iconColor }} />
                    <span>Dashboard</span>
                  </div>
                  {activePreviewTab === 'dashboard' && (
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.activeTextColor }} />
                  )}
                </button>

                {/* 2. Ready-to-Sell Swine */}
                <button
                  type="button"
                  onClick={() => setActivePreviewTab('ready_to_sell')}
                  className="w-full text-left px-3 py-2 rounded-xl font-bold flex items-center justify-between transition cursor-pointer"
                  style={{
                    backgroundColor: activePreviewTab === 'ready_to_sell' ? theme.activeMenuColor : 'transparent',
                    color: activePreviewTab === 'ready_to_sell' ? theme.activeTextColor : theme.menuTextColor,
                  }}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Truck className="w-4 h-4 shrink-0" style={{ color: activePreviewTab === 'ready_to_sell' ? theme.activeTextColor : theme.iconColor }} />
                    <span>Ready for Take-Off</span>
                  </div>
                  <span
                    className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                    style={{ backgroundColor: theme.badgeColor, color: theme.activeTextColor }}
                  >
                    14
                  </span>
                </button>

                {/* 3. Messages */}
                <button
                  type="button"
                  onClick={() => setActivePreviewTab('messages')}
                  className="w-full text-left px-3 py-2 rounded-xl font-bold flex items-center justify-between transition cursor-pointer"
                  style={{
                    backgroundColor: activePreviewTab === 'messages' ? theme.activeMenuColor : 'transparent',
                    color: activePreviewTab === 'messages' ? theme.activeTextColor : theme.menuTextColor,
                  }}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <MessageSquare className="w-4 h-4 shrink-0" style={{ color: activePreviewTab === 'messages' ? theme.activeTextColor : theme.iconColor }} />
                    <span>Messages</span>
                  </div>
                  <span
                    className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-600 text-white"
                  >
                    3
                  </span>
                </button>

                {/* Divider */}
                <div
                  className="my-2 border-t pt-2"
                  style={{ borderColor: theme.sectionDividerColor }}
                >
                  <div className="text-[10px] font-bold uppercase tracking-wider mb-1 px-1 opacity-70" style={{ color: theme.menuTextColor }}>
                    Settings & Appearance
                  </div>

                  <div
                    className="w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 opacity-80"
                    style={{ color: theme.menuTextColor }}
                  >
                    <Palette className="w-3.5 h-3.5" style={{ color: theme.iconColor }} />
                    <span>Sidebar Color Configuration</span>
                  </div>
                </div>
              </div>

              {/* Footer inside mockup */}
              <div
                className="pt-2 border-t flex items-center justify-between text-[10px] opacity-75"
                style={{ borderColor: theme.sectionDividerColor, color: theme.menuTextColor }}
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.badgeColor }} />
                  <span>Online Synced</span>
                </div>
                <span>v1.0-MAO</span>
              </div>
            </div>

            {/* Quick Actions Note */}
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 text-xs text-stone-600 leading-relaxed">
              💡 <strong>Instant Application</strong>: When you click <em>Save Changes</em>, this color scheme will immediately apply to the navigation rail throughout the entire application.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

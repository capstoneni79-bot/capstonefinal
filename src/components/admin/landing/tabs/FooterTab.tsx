import React, { useState, useRef } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  Image as ImageIcon,
  RefreshCw,
  Eye,
  EyeOff,
  UploadCloud,
  Check,
  X,
  Star,
  Sparkles,
  Edit2,
  Save,
} from 'lucide-react';
import { FooterColumnItem, FooterLogoItem, LandingCmsConfig } from '../../../../types/landingCms';

interface FooterTabProps {
  config: LandingCmsConfig;
  onChange: (updates: Partial<LandingCmsConfig>) => void;
  onOpenMediaPicker?: (targetField: string) => void;
}

const PRESET_FOOTER_LOGOS: Array<{ name: string; url: string; altText: string }> = [
  {
    name: 'Municipality of Hinunangan Seal',
    url: '/icon.svg',
    altText: 'Official Hinunangan Municipal Seal',
  },
  {
    name: 'Department of Agriculture (DA)',
    url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=200&q=80',
    altText: 'Department of Agriculture Seal',
  },
  {
    name: 'Bureau of Animal Industry (BAI)',
    url: 'https://images.unsplash.com/photo-1594737625785-a6cbdabd333c?auto=format&fit=crop&w=200&q=80',
    altText: 'BAI Livestock Insignia',
  },
];

export const FooterTab: React.FC<FooterTabProps> = ({ config, onChange, onOpenMediaPicker }) => {
  const [showAddLogoForm, setShowAddLogoForm] = useState(false);
  const [newLogoName, setNewLogoName] = useState('');
  const [newLogoUrl, setNewLogoUrl] = useState('');
  const [newLogoAlt, setNewLogoAlt] = useState('');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState('');

  // Edit Logo Name state
  const [editingLogoId, setEditingLogoId] = useState<string | null>(null);
  const [editingLogoName, setEditingLogoName] = useState<string>('');

  const [newColTitle, setNewColTitle] = useState('');
  const [activeColId, setActiveColId] = useState<string | null>(null);
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('#');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const columns = config.footerColumns || [];

  // Footer logos collection
  const footerLogos: FooterLogoItem[] = config.footerLogos || [];

  const currentPrimaryLogoUrl =
    config.footerLogoUrl || footerLogos[0]?.url || '';

  // Handle adding new logo
  const handleAddLogoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogoUrl.trim()) return;

    const newLogoItem: FooterLogoItem = {
      id: 'flogo-' + Date.now(),
      name: newLogoName.trim() || 'Footer Logo',
      url: newLogoUrl.trim(),
      altText: newLogoAlt.trim() || newLogoName.trim() || 'Footer Logo',
      visible: true,
      order: footerLogos.length + 1,
    };

    const updatedLogos = [...footerLogos, newLogoItem];
    onChange({
      footerLogos: updatedLogos,
      footerLogoUrl: newLogoUrl.trim(),
    });

    setNewLogoName('');
    setNewLogoUrl('');
    setNewLogoAlt('');
    setShowAddLogoForm(false);
  };

  // Handle local image file upload for logo
  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    const reader = new FileReader();

    reader.onload = () => {
      const dataUrl = reader.result as string;
      const newLogoItem: FooterLogoItem = {
        id: 'flogo-file-' + Date.now(),
        name: cleanName,
        url: dataUrl,
        altText: cleanName,
        visible: true,
        order: footerLogos.length + 1,
      };

      const updated = [...footerLogos, newLogoItem];
      onChange({
        footerLogos: updated,
        footerLogoUrl: dataUrl,
      });

      setIsUploadingLogo(false);
      setUploadSuccessMsg(`Added "${file.name}" to footer logos!`);
      setTimeout(() => {
        setUploadSuccessMsg('');
        setShowAddLogoForm(false);
      }, 1200);
    };

    reader.onerror = () => {
      setIsUploadingLogo(false);
      alert('Failed to read image file. Please try a different image format.');
    };

    reader.readAsDataURL(file);
  };

  const handleToggleLogoVisible = (id: string) => {
    const updated = footerLogos.map(l => (l.id === id ? { ...l, visible: !l.visible } : l));
    onChange({ footerLogos: updated });
  };

  const handleStartEditLogoName = (logo: FooterLogoItem) => {
    setEditingLogoId(logo.id);
    setEditingLogoName(logo.name);
  };

  const handleSaveLogoName = (id: string) => {
    if (!editingLogoName.trim()) {
      setEditingLogoId(null);
      return;
    }
    const updated = footerLogos.map(l =>
      l.id === id ? { ...l, name: editingLogoName.trim(), altText: editingLogoName.trim() } : l
    );
    onChange({ footerLogos: updated });
    setEditingLogoId(null);
    setEditingLogoName('');
  };

  const handleDeleteLogo = (id: string) => {
    const filtered = footerLogos.filter(l => l.id !== id);
    const nextPrimary = filtered[0]?.url || '/icon.svg';
    onChange({
      footerLogos: filtered,
      footerLogoUrl: nextPrimary,
    });
  };

  const handleSetPrimaryLogo = (logo: FooterLogoItem) => {
    onChange({
      footerLogoUrl: logo.url,
      footerLogos: footerLogos.map(l => (l.id === logo.id ? { ...l, visible: true } : l)),
    });
  };

  const handleAddColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColTitle.trim()) return;
    const newCol: FooterColumnItem = {
      id: 'fcol-' + Date.now(),
      title: newColTitle.trim(),
      links: [],
    };
    onChange({ footerColumns: [...columns, newCol] });
    setNewColTitle('');
  };

  const handleDeleteColumn = (id: string) => {
    onChange({ footerColumns: columns.filter(c => c.id !== id) });
  };

  const handleAddLinkToColumn = (columnId: string) => {
    if (!newLinkLabel.trim()) return;
    const updated = columns.map(c => {
      if (c.id === columnId) {
        return {
          ...c,
          links: [
            ...c.links,
            { id: 'link-' + Date.now(), label: newLinkLabel.trim(), url: newLinkUrl.trim() || '#' },
          ],
        };
      }
      return c;
    });
    onChange({ footerColumns: updated });
    setNewLinkLabel('');
    setNewLinkUrl('#');
    setActiveColId(null);
  };

  const handleDeleteLink = (columnId: string, linkId: string) => {
    const updated = columns.map(c => {
      if (c.id === columnId) {
        return { ...c, links: c.links.filter(l => l.id !== linkId) };
      }
      return c;
    });
    onChange({ footerColumns: updated });
  };

  return (
    <div className="space-y-6 text-xs text-stone-800">
      {/* Footer-Only Logo Management (Footer Only) */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b pb-3 border-stone-100 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <ImageIcon className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-sm">Footer Logo Management (Footer Only)</h3>
              <p className="text-[11px] text-stone-500">
                Manage and add official logos displayed exclusively at the bottom of the landing page.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
              Footer Only
            </span>
            {/* ADD LOGO BUTTON */}
            <button
              type="button"
              onClick={() => setShowAddLogoForm(!showAddLogoForm)}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showAddLogoForm ? 'Close Form' : 'Add Logo'}</span>
            </button>
          </div>
        </div>

        {/* Add Logo Form Panel */}
        {showAddLogoForm && (
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
              <span className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-emerald-700" />
                Add New Footer Logo
              </span>
              <button
                type="button"
                onClick={() => setShowAddLogoForm(false)}
                className="text-[11px] text-stone-500 hover:text-stone-800 font-semibold cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Upload from file button */}
            <div>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleLogoFileUpload}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-4 rounded-xl border-2 border-dashed border-emerald-300 bg-white hover:bg-emerald-50/50 flex items-center justify-between gap-3 cursor-pointer transition"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <UploadCloud className="w-4 h-4 text-emerald-700" />
                  </div>
                  <div>
                    <span className="font-bold text-emerald-950 text-xs block">
                      Upload Logo Image from Computer
                    </span>
                    <span className="text-[10px] text-stone-500">
                      Supports PNG, SVG, JPG, WebP transparent logos
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-xl bg-emerald-700 text-white font-bold text-xs cursor-pointer hover:bg-emerald-600 shrink-0"
                >
                  Browse File
                </button>
              </div>

              {isUploadingLogo && (
                <p className="text-[11px] text-amber-700 font-semibold mt-1 flex items-center gap-1">
                  <span className="w-2.5 h-2.5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                  Reading logo image file...
                </p>
              )}

              {uploadSuccessMsg && (
                <p className="text-[11px] text-emerald-800 font-bold mt-1 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> {uploadSuccessMsg}
                </p>
              )}
            </div>

            {/* Or add via URL Form */}
            <form onSubmit={handleAddLogoSubmit} className="space-y-3 pt-2 border-t border-emerald-200/60">
              <span className="font-semibold text-emerald-900 block text-xs">
                Or Enter Logo Details & URL
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1 text-[11px]">
                    Logo Name / Label <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newLogoName}
                    onChange={e => setNewLogoName(e.target.value)}
                    placeholder="e.g. Hinunangan Agricultural Seal"
                    className="w-full px-3 py-1.5 rounded-xl border border-stone-300 bg-white text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1 text-[11px]">
                    Logo Image URL / Path <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      required
                      value={newLogoUrl}
                      onChange={e => setNewLogoUrl(e.target.value)}
                      placeholder="/icon.svg or https://..."
                      className="w-full px-3 py-1.5 rounded-xl border border-stone-300 bg-white font-mono text-[11px] focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                    />
                    {onOpenMediaPicker && (
                      <button
                        type="button"
                        onClick={() => onOpenMediaPicker('footerLogoUrl')}
                        title="Pick from Media Library"
                        className="p-1.5 rounded-xl bg-white border border-stone-300 hover:bg-stone-100 text-stone-700 shrink-0 cursor-pointer"
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-emerald-700" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-stone-400 font-semibold">Quick Presets:</span>
                  {PRESET_FOOTER_LOGOS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setNewLogoName(p.name);
                        setNewLogoUrl(p.url);
                        setNewLogoAlt(p.altText);
                      }}
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-white border border-stone-200 hover:border-emerald-500 text-stone-700 cursor-pointer"
                    >
                      {p.name.split(' ')[0]}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddLogoForm(false)}
                    className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add to Footer Logos</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Configured Footer Logos Grid */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-stone-700 text-xs">
              Active Footer Logos ({footerLogos.filter(l => l.visible !== false).length} Active)
            </span>
            <span className="text-[10px] text-stone-400">
              Displayed exclusively in landing page footer
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {footerLogos.length === 0 ? (
              <div className="col-span-full p-6 text-center rounded-2xl border border-dashed border-stone-200 bg-stone-50 text-stone-400">
                <ImageIcon className="w-8 h-8 mx-auto mb-2 text-stone-300" />
                <p className="font-semibold text-xs text-stone-600">No footer logos configured</p>
                <p className="text-[11px] text-stone-400 mt-0.5">Click "Add Logo" or "Upload Image" above to add official seals to the footer.</p>
              </div>
            ) : (
              footerLogos.map(logo => {
              const isPrimary = logo.url === currentPrimaryLogoUrl;
              return (
                <div
                  key={logo.id}
                  className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                    logo.visible !== false
                      ? isPrimary
                        ? 'bg-emerald-50/50 border-emerald-300 shadow-2xs'
                        : 'bg-stone-50 border-stone-200'
                      : 'bg-stone-100 border-stone-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-white border border-stone-300 p-1.5 flex items-center justify-center shrink-0 shadow-2xs">
                      <img
                        src={logo.url}
                        alt={logo.name}
                        className="max-w-full max-h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      {editingLogoId === logo.id ? (
                        <div className="flex items-center gap-1.5 py-0.5">
                          <input
                            type="text"
                            value={editingLogoName}
                            onChange={e => setEditingLogoName(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveLogoName(logo.id);
                              } else if (e.key === 'Escape') {
                                setEditingLogoId(null);
                              }
                            }}
                            autoFocus
                            placeholder="Enter logo name..."
                            className="px-2 py-0.5 rounded border border-emerald-500 bg-white text-xs font-bold text-stone-900 focus:outline-hidden w-full"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveLogoName(logo.id)}
                            title="Save Name"
                            className="p-1 rounded bg-emerald-700 hover:bg-emerald-600 text-white cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingLogoId(null)}
                            title="Cancel"
                            className="p-1 rounded bg-stone-200 hover:bg-stone-300 text-stone-700 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-stone-900 text-xs truncate">
                              {logo.name}
                            </span>
                            {isPrimary && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 shrink-0">
                                Primary
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-stone-400 truncate block font-mono">
                            {logo.url}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {editingLogoId !== logo.id && (
                      <button
                        type="button"
                        onClick={() => handleStartEditLogoName(logo)}
                        title="Edit Name"
                        className="p-1.5 rounded-lg hover:bg-stone-200 text-stone-700 hover:text-emerald-700 cursor-pointer flex items-center gap-1"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-semibold hidden md:inline">Edit Name</span>
                      </button>
                    )}
                    {!isPrimary && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimaryLogo(logo)}
                        title="Set as Primary Footer Logo"
                        className="p-1.5 rounded-lg hover:bg-emerald-100 text-emerald-700 cursor-pointer"
                      >
                        <Star className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleToggleLogoVisible(logo.id)}
                      title={logo.visible !== false ? 'Hide from footer' : 'Show in footer'}
                      className="p-1.5 rounded-lg hover:bg-stone-200 text-stone-600 cursor-pointer"
                    >
                      {logo.visible !== false ? (
                        <Eye className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteLogo(logo.id)}
                      title="Remove from footer"
                      className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            }))}
          </div>
        </div>

        {/* Primary Footer Logo Quick Field */}
        <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
          <label className="block font-semibold text-stone-700 text-[11px]">
            Primary Footer Logo URL (Direct Override)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={config.footerLogoUrl || ''}
              onChange={e => onChange({ footerLogoUrl: e.target.value })}
              placeholder={config.systemLogoUrl || '/icon.svg'}
              className="flex-1 px-3 py-1.5 rounded-xl border border-stone-300 font-mono text-[11px] bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            />
            {onOpenMediaPicker && (
              <button
                type="button"
                onClick={() => onOpenMediaPicker('footerLogoUrl')}
                className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shrink-0 shadow-xs"
              >
                <ImageIcon className="w-3.5 h-3.5" /> Media Library
              </button>
            )}
            {config.footerLogoUrl && (
              <button
                type="button"
                onClick={() => onChange({ footerLogoUrl: '/icon.svg' })}
                title="Reset to default seal"
                className="p-1.5 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-700 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* General Footer Text */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 border-b pb-3 border-stone-100">
          <Layers className="w-4 h-4 text-emerald-700" />
          <h3 className="font-bold text-stone-900 text-sm">Footer Branding & Copyright</h3>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block font-semibold text-stone-700">Footer Narrative Summary</label>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-stone-500">Font Color:</span>
                <input
                  type="color"
                  value={config.footerTextColor || '#a8a29e'}
                  onChange={e => onChange({ footerTextColor: e.target.value })}
                  className="w-6 h-6 rounded-md border border-stone-300 cursor-pointer p-0.5"
                  title="Footer Text Color"
                />
              </div>
            </div>
            <textarea
              rows={3}
              value={config.footerDescription}
              onChange={e => onChange({ footerDescription: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 leading-relaxed focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block font-semibold text-stone-700">Copyright Line & Headings Color</label>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-stone-500">Heading Color:</span>
                <input
                  type="color"
                  value={config.footerHeadingColor || '#ffffff'}
                  onChange={e => onChange({ footerHeadingColor: e.target.value })}
                  className="w-6 h-6 rounded-md border border-stone-300 cursor-pointer p-0.5"
                  title="Footer Headings Color"
                />
              </div>
            </div>
            <input
              type="text"
              value={config.footerCopyright}
              onChange={e => onChange({ footerCopyright: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Footer Navigation Columns */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b pb-3 border-stone-100">
          <h3 className="font-bold text-stone-900 text-sm">Footer Link Columns</h3>
          <span className="text-[11px] text-stone-400">{columns.length} Columns</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {columns.map(col => (
            <div key={col.id} className="p-4 rounded-xl border border-stone-200 bg-stone-50 space-y-3">
              <div className="flex items-center justify-between">
                <input
                  type="text"
                  value={col.title}
                  onChange={e => {
                    const next = columns.map(c =>
                      c.id === col.id ? { ...c, title: e.target.value } : c
                    );
                    onChange({ footerColumns: next });
                  }}
                  className="font-bold text-stone-900 text-xs px-2 py-1 rounded-lg border border-stone-300 bg-white"
                />
                <button
                  type="button"
                  onClick={() => handleDeleteColumn(col.id)}
                  className="p-1 rounded-md hover:bg-red-50 text-red-600 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Links */}
              <div className="space-y-1.5">
                {col.links.map(link => (
                  <div
                    key={link.id}
                    className="p-1.5 rounded-lg bg-white border border-stone-200 flex items-center justify-between text-[11px]"
                  >
                    <span className="font-medium text-stone-700 truncate">{link.label}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteLink(col.id, link.id)}
                      className="text-stone-400 hover:text-red-600 p-0.5 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Link Form */}
              {activeColId === col.id ? (
                <div className="p-2 bg-white rounded-lg border border-emerald-300 space-y-1.5">
                  <input
                    type="text"
                    value={newLinkLabel}
                    onChange={e => setNewLinkLabel(e.target.value)}
                    placeholder="Link Label"
                    className="w-full px-2 py-1 rounded border border-stone-300 text-[11px]"
                  />
                  <input
                    type="text"
                    value={newLinkUrl}
                    onChange={e => setNewLinkUrl(e.target.value)}
                    placeholder="URL (e.g. #gis)"
                    className="w-full px-2 py-1 rounded border border-stone-300 font-mono text-[10px]"
                  />
                  <div className="flex justify-end gap-1 pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveColId(null)}
                      className="px-2 py-1 rounded text-stone-500 hover:bg-stone-100 text-[10px] cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddLinkToColumn(col.id)}
                      className="px-2.5 py-1 rounded bg-emerald-700 text-white font-bold text-[10px] cursor-pointer"
                    >
                      Save Link
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveColId(col.id)}
                  className="w-full py-1 rounded-lg border border-dashed border-stone-300 hover:border-emerald-600 text-stone-600 text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer bg-white"
                >
                  <Plus className="w-3 h-3" /> Add Link
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add Column */}
        <form onSubmit={handleAddColumn} className="pt-3 border-t border-stone-100 flex gap-2">
          <input
            type="text"
            value={newColTitle}
            onChange={e => setNewColTitle(e.target.value)}
            placeholder="New Column Title (e.g. Citizen Resources)"
            className="px-3 py-1.5 rounded-xl border border-stone-300 w-64"
          />
          <button
            type="submit"
            className="px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Column
          </button>
        </form>
      </div>
    </div>
  );
};

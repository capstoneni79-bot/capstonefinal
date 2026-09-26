import React, { useState, useRef } from 'react';
import {
  FolderOpen,
  Upload,
  Search,
  Filter,
  Image as ImageIcon,
  Copy,
  Trash2,
  Sliders,
  RotateCw,
  RotateCcw,
  Check,
  Eye,
  ZoomIn,
  ZoomOut,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { LandingCmsConfig, MediaCategory, MediaItem } from '../../../../types/landingCms';

interface MediaLibraryTabProps {
  config: LandingCmsConfig;
  onChange: (updates: Partial<LandingCmsConfig>) => void;
  onSelectForField?: (url: string) => void;
  targetFieldPrompt?: string;
}

const CATEGORIES: { label: string; value: MediaCategory | 'All' }[] = [
  { label: 'All Media', value: 'All' },
  { label: 'Logos', value: 'Logos' },
  { label: 'Municipal Seals', value: 'Municipal Seals' },
  { label: 'Hero Images', value: 'Hero Images' },
  { label: 'Backgrounds', value: 'Backgrounds' },
  { label: 'SLSU', value: 'SLSU' },
  { label: 'Agriculture', value: 'Agriculture' },
  { label: 'Facilities', value: 'Facilities' },
  { label: 'Gallery', value: 'Gallery' },
  { label: 'Icons', value: 'Icons' },
  { label: 'Other', value: 'Other' },
];

export const MediaLibraryTab: React.FC<MediaLibraryTabProps> = ({
  config,
  onChange,
  onSelectForField,
  targetFieldPrompt,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<MediaCategory | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null);
  const [previewingItem, setPreviewingItem] = useState<MediaItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Editor states
  const [editBrightness, setEditBrightness] = useState(100);
  const [editContrast, setEditContrast] = useState(100);
  const [editOpacity, setEditOpacity] = useState(100);
  const [editRotation, setEditRotation] = useState(0);
  const [editZoom, setEditZoom] = useState(100);
  const [editAltText, setEditAltText] = useState('');
  const [editCategory, setEditCategory] = useState<MediaCategory>('Other');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const mediaItems = config.mediaItems || [];

  const filteredItems = mediaItems.filter(item => {
    const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      item.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.altText?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const newItem: MediaItem = {
            id: 'med-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
            fileName: file.name,
            fileSize: `${(file.size / 1024).toFixed(1)} KB`,
            dimensions: '1920x1080',
            category: (selectedCategory === 'All' ? 'Agriculture' : selectedCategory) as MediaCategory,
            url: reader.result,
            uploadDate: new Date().toISOString().split('T')[0],
            altText: file.name.replace(/\.[^/.]+$/, ''),
          };
          onChange({ mediaItems: [newItem, ...(config.mediaItems || [])] });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleDelete = (id: string) => {
    onChange({ mediaItems: mediaItems.filter(m => m.id !== id) });
  };

  const handleCopyLink = (item: MediaItem) => {
    navigator.clipboard.writeText(item.url);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openEditor = (item: MediaItem) => {
    setEditingItem(item);
    setEditBrightness(item.brightness ?? 100);
    setEditContrast(item.contrast ?? 100);
    setEditOpacity(item.opacity ?? 100);
    setEditRotation(item.rotation ?? 0);
    setEditZoom(item.zoom ?? 100);
    setEditAltText(item.altText || '');
    setEditCategory(item.category);
  };

  const saveEditedItem = () => {
    if (!editingItem) return;
    const updated: MediaItem = {
      ...editingItem,
      brightness: editBrightness,
      contrast: editContrast,
      opacity: editOpacity,
      rotation: editRotation,
      zoom: editZoom,
      altText: editAltText,
      category: editCategory,
    };
    const nextList = mediaItems.map(m => (m.id === editingItem.id ? updated : m));
    onChange({ mediaItems: nextList });
    setEditingItem(null);
  };

  return (
    <div className="space-y-6 text-xs text-stone-800">
      {/* Target prompt notice if opened via a field */}
      {targetFieldPrompt && (
        <div className="bg-emerald-50 border border-emerald-300 p-3.5 rounded-2xl flex items-center justify-between text-xs text-emerald-950">
          <div>
            <strong>Selecting photo for:</strong> {targetFieldPrompt}
          </div>
          <span className="text-[11px] text-emerald-700 font-semibold">Click "Use on Website" on any photo below</span>
        </div>
      )}

      {/* Upload Dropzone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`bg-white p-6 rounded-2xl border-2 border-dashed transition text-center space-y-2 cursor-pointer ${
          dragActive
            ? 'border-emerald-600 bg-emerald-50/50 scale-[0.99]'
            : 'border-stone-300 hover:border-emerald-500'
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/png, image/jpeg, image/webp, image/svg+xml"
          onChange={e => handleFileUpload(e.target.files)}
          className="hidden"
        />
        <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
          <Upload className="w-6 h-6" />
        </div>
        <h4 className="font-black text-stone-900 text-sm">Upload New Photos & Official Media</h4>
        <p className="text-stone-500 text-xs max-w-md mx-auto">
          Drag & drop images here, or click to browse files from your computer.
        </p>
        <span className="text-[10px] text-stone-400 block font-semibold uppercase tracking-wider">
          Supports JPG, PNG, WEBP, SVG • High-Resolution Recommended
        </span>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search media by name or tag..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-stone-300 text-xs"
            />
          </div>

          <div className="flex items-center gap-2 text-[11px] text-stone-500 self-end sm:self-auto">
            <span>
              Showing <strong>{filteredItems.length}</strong> of {mediaItems.length} assets
            </span>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-3 py-1 rounded-full font-bold transition cursor-pointer whitespace-nowrap ${
                selectedCategory === cat.value
                  ? 'bg-emerald-800 text-white shadow-2xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Media Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredItems.map(item => (
          <div
            key={item.id}
            className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden flex flex-col justify-between hover:border-emerald-500 transition group"
          >
            {/* Image Preview Area */}
            <div className="relative aspect-4/3 bg-stone-100 overflow-hidden flex items-center justify-center">
              <img
                src={item.url}
                alt={item.altText || item.fileName}
                className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                style={{
                  filter: `brightness(${item.brightness ?? 100}%) contrast(${item.contrast ?? 100}%) opacity(${
                    (item.opacity ?? 100) / 100
                  })`,
                  transform: `rotate(${item.rotation ?? 0}deg) scale(${(item.zoom ?? 100) / 100})`,
                }}
                referrerPolicy="no-referrer"
              />
              <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-stone-900/80 text-white text-[10px] font-bold backdrop-blur-xs">
                {item.category}
              </span>
            </div>

            {/* Metadata */}
            <div className="p-3 space-y-1.5 flex-1">
              <div className="flex items-start justify-between gap-1">
                <p className="font-bold text-stone-900 text-xs truncate" title={item.fileName}>
                  {item.fileName}
                </p>
              </div>
              <div className="flex items-center justify-between text-[10px] text-stone-400">
                <span>{item.dimensions || '1920x1080'}</span>
                <span>{item.fileSize}</span>
                <span>{item.uploadDate}</span>
              </div>
              {item.altText && (
                <p className="text-[10px] text-stone-500 line-clamp-1 italic">
                  Alt: "{item.altText}"
                </p>
              )}
            </div>

            {/* Action Bar */}
            <div className="p-2.5 bg-stone-50 border-t border-stone-100 flex items-center justify-between gap-1">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPreviewingItem(item)}
                  title="Full Preview"
                  className="p-1.5 rounded-lg hover:bg-stone-200 text-stone-600 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => openEditor(item)}
                  title="Edit & Adjust Photo"
                  className="p-1.5 rounded-lg hover:bg-stone-200 text-stone-600 cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyLink(item)}
                  title="Copy URL"
                  className="p-1.5 rounded-lg hover:bg-stone-200 text-stone-600 cursor-pointer"
                >
                  {copiedId === item.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  title="Delete File"
                  className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {onSelectForField ? (
                <button
                  type="button"
                  onClick={() => onSelectForField(item.url)}
                  className="px-3 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-[11px] cursor-pointer flex items-center gap-1 shadow-2xs transition"
                >
                  <Check className="w-3.5 h-3.5" /> Use
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onChange({ heroBackgroundUrl: item.url })}
                  className="px-2 py-1 rounded-lg bg-white border border-stone-300 hover:bg-stone-100 text-stone-700 text-[10px] font-bold cursor-pointer"
                >
                  Set as Hero
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Photo Editor Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-5 py-3.5 border-b border-stone-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-700" />
                <h3 className="font-bold text-stone-900 text-sm">Photo Adjuster & Editor</h3>
              </div>
              <span className="text-[11px] text-stone-500">{editingItem.fileName}</span>
            </div>

            {/* Canvas Preview */}
            <div className="p-4 bg-stone-950 flex items-center justify-center overflow-hidden min-h-[260px]">
              <div className="relative max-h-64 max-w-full overflow-hidden rounded-lg">
                <img
                  src={editingItem.url}
                  alt={editingItem.fileName}
                  className="max-h-64 object-contain transition-all duration-150"
                  style={{
                    filter: `brightness(${editBrightness}%) contrast(${editContrast}%) opacity(${
                      editOpacity / 100
                    })`,
                    transform: `rotate(${editRotation}deg) scale(${editZoom / 100})`,
                  }}
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            {/* Controls */}
            <div className="p-5 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Brightness: {editBrightness}%
                  </label>
                  <input
                    type="range"
                    min={20}
                    max={200}
                    value={editBrightness}
                    onChange={e => setEditBrightness(Number(e.target.value))}
                    className="w-full accent-emerald-700"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Contrast: {editContrast}%
                  </label>
                  <input
                    type="range"
                    min={20}
                    max={200}
                    value={editContrast}
                    onChange={e => setEditContrast(Number(e.target.value))}
                    className="w-full accent-emerald-700"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Opacity: {editOpacity}%
                  </label>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    value={editOpacity}
                    onChange={e => setEditOpacity(Number(e.target.value))}
                    className="w-full accent-emerald-700"
                  />
                </div>
              </div>

              {/* Rotation & Zoom */}
              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-stone-100">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-stone-700 text-xs">Rotate:</span>
                  <button
                    type="button"
                    onClick={() => setEditRotation((prev) => (prev - 90 + 360) % 360)}
                    className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 flex items-center gap-1 text-xs font-bold"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> -90°
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditRotation((prev) => (prev + 90) % 360)}
                    className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 flex items-center gap-1 text-xs font-bold"
                  >
                    <RotateCw className="w-3.5 h-3.5" /> +90°
                  </button>
                </div>

                <div className="flex items-center gap-1.5 ml-auto">
                  <span className="font-semibold text-stone-700 text-xs">Zoom ({editZoom}%):</span>
                  <button
                    type="button"
                    onClick={() => setEditZoom((prev) => Math.max(50, prev - 10))}
                    className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditZoom((prev) => Math.min(200, prev + 10))}
                    className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Category & Alt text */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-stone-100">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Media Category</label>
                  <select
                    value={editCategory}
                    onChange={e => setEditCategory(e.target.value as MediaCategory)}
                    className="w-full px-3 py-1.5 rounded-lg border border-stone-300 bg-white"
                  >
                    {CATEGORIES.filter(c => c.value !== 'All').map(c => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Accessibility Alt Text</label>
                  <input
                    type="text"
                    value={editAltText}
                    onChange={e => setEditAltText(e.target.value)}
                    placeholder="Short description for screen readers"
                    className="w-full px-3 py-1.5 rounded-lg border border-stone-300 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-200 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveEditedItem}
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs cursor-pointer"
              >
                Save Photo Adjustments
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Preview Modal */}
      {previewingItem && (
        <div
          onClick={() => setPreviewingItem(null)}
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="max-w-3xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <img
              src={previewingItem.url}
              alt={previewingItem.fileName}
              className="w-full max-h-[75vh] object-contain bg-stone-900"
            />
            <div className="p-4 flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-stone-900">{previewingItem.fileName}</p>
                <p className="text-[11px] text-stone-400">
                  {previewingItem.dimensions} • {previewingItem.fileSize} • {previewingItem.category}
                </p>
              </div>
              <button
                onClick={() => setPreviewingItem(null)}
                className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

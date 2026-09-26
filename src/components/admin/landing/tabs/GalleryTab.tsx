import React, { useState } from 'react';
import { Image as ImageIcon, Plus, Trash2, Eye, EyeOff, LayoutGrid, Layers, Columns } from 'lucide-react';
import { GalleryPhotoItem, LandingCmsConfig } from '../../../../types/landingCms';

interface GalleryTabProps {
  config: LandingCmsConfig;
  onChange: (updates: Partial<LandingCmsConfig>) => void;
  onOpenMediaPicker?: (targetField: string) => void;
}

export const GalleryTab: React.FC<GalleryTabProps> = ({ config, onChange, onOpenMediaPicker }) => {
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newCat, setNewCat] = useState('Field Operations');
  const [newCaption, setNewCaption] = useState('');

  const photos = config.galleryPhotos || [];

  const handleToggleVisible = (id: string) => {
    const updated = photos.map(p => (p.id === id ? { ...p, showOnLanding: !p.showOnLanding } : p));
    onChange({ galleryPhotos: updated });
  };

  const handleDelete = (id: string) => {
    onChange({ galleryPhotos: photos.filter(p => p.id !== id) });
  };

  const handleUpdate = (id: string, updates: Partial<GalleryPhotoItem>) => {
    const updated = photos.map(p => (p.id === id ? { ...p, ...updates } : p));
    onChange({ galleryPhotos: updated });
  };

  const handleAddPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim()) return;
    const item: GalleryPhotoItem = {
      id: 'gal-' + Date.now(),
      title: newTitle.trim() || 'Hinunangan Livestock Program Photo',
      caption: newCaption.trim() || 'Agricultural extension and field operation documentation.',
      category: newCat.trim(),
      imageUrl: newUrl.trim(),
      showOnLanding: true,
      order: photos.length + 1,
    };
    onChange({ galleryPhotos: [...photos, item] });
    setNewTitle('');
    setNewUrl('');
    setNewCaption('');
  };

  return (
    <div className="space-y-6 text-xs text-stone-800">
      {/* Headlines & Layout Selection */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 border-b pb-3 border-stone-100">
          <ImageIcon className="w-4 h-4 text-emerald-700" />
          <h3 className="font-bold text-stone-900 text-sm">Gallery Section Headlines & Presentation</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-stone-700 mb-1">Gallery Title</label>
            <input
              type="text"
              value={config.galleryTitle}
              onChange={e => onChange({ galleryTitle: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold text-stone-900"
            />
          </div>
          <div>
            <label className="block font-semibold text-stone-700 mb-1">Gallery Subtitle</label>
            <input
              type="text"
              value={config.gallerySubtitle}
              onChange={e => onChange({ gallerySubtitle: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-stone-300"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-stone-700 mb-1">Gallery Layout Style</label>
          <div className="grid grid-cols-3 gap-2 max-w-md">
            {[
              { id: 'grid', label: 'Uniform Grid', icon: LayoutGrid },
              { id: 'masonry', label: 'Masonry Flow', icon: Columns },
              { id: 'carousel', label: 'Card Carousel', icon: Layers },
            ].map(layout => (
              <button
                key={layout.id}
                type="button"
                onClick={() => onChange({ galleryLayout: layout.id as any })}
                className={`p-2.5 rounded-xl border text-center font-bold flex flex-col items-center gap-1.5 cursor-pointer transition ${
                  (config.galleryLayout || 'grid') === layout.id
                    ? 'border-emerald-700 bg-emerald-50 text-emerald-950 shadow-2xs'
                    : 'border-stone-200 hover:bg-stone-50 text-stone-600'
                }`}
              >
                <layout.icon className="w-4 h-4 text-emerald-700" />
                <span className="text-[11px]">{layout.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Photos Grid */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b pb-3 border-stone-100">
          <h3 className="font-bold text-stone-900 text-sm">Gallery Image Showcase</h3>
          <span className="text-[11px] text-stone-400">{photos.length} Photos</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {photos.map(photo => (
            <div
              key={photo.id}
              className={`rounded-2xl border overflow-hidden flex flex-col justify-between transition ${
                photo.showOnLanding ? 'bg-stone-50 border-stone-200' : 'bg-stone-100/60 border-stone-200 opacity-60'
              }`}
            >
              <div className="relative aspect-4/3 bg-stone-900">
                <img
                  src={photo.imageUrl}
                  alt={photo.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-stone-900/80 text-white text-[10px] font-bold">
                  {photo.category}
                </span>
                <button
                  type="button"
                  onClick={() => handleToggleVisible(photo.id)}
                  title={photo.showOnLanding ? 'Visible on Landing' : 'Hidden'}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-black text-white cursor-pointer"
                >
                  {photo.showOnLanding ? <Eye className="w-3.5 h-3.5 text-emerald-400" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="p-3 space-y-2 flex-1">
                <input
                  type="text"
                  value={photo.title}
                  onChange={e => handleUpdate(photo.id, { title: e.target.value })}
                  className="w-full px-2 py-1 rounded-lg border border-stone-300 bg-white font-bold text-xs"
                />
                <textarea
                  rows={2}
                  value={photo.caption}
                  onChange={e => handleUpdate(photo.id, { caption: e.target.value })}
                  className="w-full px-2 py-1 rounded-lg border border-stone-300 bg-white text-[11px]"
                />
                <div className="flex items-center justify-between pt-1">
                  <select
                    value={photo.category}
                    onChange={e => handleUpdate(photo.id, { category: e.target.value })}
                    className="px-2 py-1 rounded-lg border border-stone-300 bg-white text-[11px]"
                  >
                    <option value="Field Operations">Field Operations</option>
                    <option value="Biosecurity">Biosecurity</option>
                    <option value="Training">Training</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Facilities">Facilities</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => handleDelete(photo.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Photo Form */}
        <form onSubmit={handleAddPhoto} className="pt-4 border-t border-stone-100 space-y-2">
          <span className="font-semibold text-stone-700 block text-xs">Add New Gallery Photo</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="Photo Title (e.g. Barangay Insuan Disinfection Station)"
              className="px-3 py-1.5 rounded-xl border border-stone-300"
            />
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newUrl}
                onChange={e => setNewUrl(e.target.value)}
                placeholder="Image URL (https://...)"
                className="flex-1 px-3 py-1.5 rounded-xl border border-stone-300 font-mono text-[11px]"
              />
              {onOpenMediaPicker && (
                <button
                  type="button"
                  onClick={() => onOpenMediaPicker('newGalleryPhoto')}
                  className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold border border-emerald-300 cursor-pointer"
                >
                  Media
                </button>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              value={newCaption}
              onChange={e => setNewCaption(e.target.value)}
              placeholder="Short description / caption..."
              className="flex-1 px-3 py-1.5 rounded-xl border border-stone-300"
            />
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add to Gallery
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  GraduationCap,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Check,
  FolderOpen,
  RefreshCw,
} from 'lucide-react';
import { AboutCardItem, LandingCmsConfig } from '../../../../types/landingCms';

interface AboutTabProps {
  config: LandingCmsConfig;
  onChange: (updates: Partial<LandingCmsConfig>) => void;
  onOpenMediaPicker?: (targetField: string) => void;
}

export const AboutTab: React.FC<AboutTabProps> = ({ config, onChange, onOpenMediaPicker }) => {
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [showQuickMedia, setShowQuickMedia] = useState(false);
  const [showAddPostInline, setShowAddPostInline] = useState(false);
  const [inlinePostTitle, setInlinePostTitle] = useState('');
  const [inlinePostDesc, setInlinePostDesc] = useState('');

  const aboutCards = config.aboutCards || [];
  const mediaItems = config.mediaItems || [];

  const handleToggleVisible = (id: string) => {
    const updated = aboutCards.map(c => (c.id === id ? { ...c, visible: !c.visible } : c));
    onChange({ aboutCards: updated });
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= aboutCards.length) return;
    const clone = [...aboutCards];
    const temp = clone[index];
    clone[index] = clone[newIdx];
    clone[newIdx] = temp;
    onChange({ aboutCards: clone.map((c, i) => ({ ...c, order: i + 1 })) });
  };

  const handleDelete = (id: string) => {
    onChange({ aboutCards: aboutCards.filter(c => c.id !== id) });
  };

  const handleUpdateCard = (id: string, updates: Partial<AboutCardItem>) => {
    onChange({
      aboutCards: aboutCards.map(c => (c.id === id ? { ...c, ...updates } : c)),
    });
  };

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const newCard: AboutCardItem = {
      id: 'about-' + Date.now(),
      title: newTitle.trim(),
      description: newDesc.trim(),
      icon: 'ShieldCheck',
      visible: true,
      order: aboutCards.length + 1,
    };
    onChange({ aboutCards: [...aboutCards, newCard] });
    setNewTitle('');
    setNewDesc('');
  };

  const handleAddInlinePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlinePostTitle.trim()) return;
    const newPost: AboutCardItem = {
      id: 'about-post-' + Date.now(),
      title: inlinePostTitle.trim(),
      description: inlinePostDesc.trim(),
      icon: 'ShieldCheck',
      visible: true,
      order: aboutCards.length + 1,
    };
    onChange({ aboutCards: [...aboutCards, newPost] });
    setInlinePostTitle('');
    setInlinePostDesc('');
    setShowAddPostInline(false);
  };

  return (
    <div className="space-y-6 text-xs text-stone-800">
      {/* Main Section Content */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b pb-3 border-stone-100 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-emerald-700" />
            <h3 className="font-bold text-stone-900 text-sm">About Section Main Copy & Image</h3>
          </div>
          <button
            type="button"
            onClick={() => setShowAddPostInline(!showAddPostInline)}
            className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Post</span>
          </button>
        </div>

        {/* Inline Add Post Form */}
        {showAddPostInline && (
          <form
            onSubmit={handleAddInlinePost}
            className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 space-y-3 animate-fadeIn"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-emerald-700" />
                Add New Post / Highlight to About Section
              </span>
              <button
                type="button"
                onClick={() => setShowAddPostInline(false)}
                className="text-[11px] text-stone-500 hover:text-stone-800 font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>
            <div>
              <label className="block font-semibold text-emerald-900 mb-1 text-[11px]">Post Title</label>
              <input
                type="text"
                value={inlinePostTitle}
                onChange={e => setInlinePostTitle(e.target.value)}
                placeholder="e.g. SLSU Veterinary Outreach & Field Clinics"
                required
                className="w-full px-3 py-1.5 rounded-xl border border-emerald-300 bg-white font-bold text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block font-semibold text-emerald-900 mb-1 text-[11px]">Post Content / Mandate Description</label>
              <textarea
                rows={2}
                value={inlinePostDesc}
                onChange={e => setInlinePostDesc(e.target.value)}
                placeholder="Summarize the core pillar, extension program, or mandate..."
                className="w-full px-3 py-1.5 rounded-xl border border-emerald-300 bg-white text-stone-800 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden leading-relaxed text-[11px]"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddPostInline(false)}
                className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Publish Post to About Section</span>
              </button>
            </div>
          </form>
        )}

        <div className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block font-semibold text-stone-700">Section Title</label>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-stone-500">Font Color:</span>
                <input
                  type="color"
                  value={config.aboutTitleColor || '#064e3b'}
                  onChange={e => onChange({ aboutTitleColor: e.target.value })}
                  className="w-6 h-6 rounded-md border border-stone-300 cursor-pointer p-0.5"
                  title="Title Font Color"
                />
              </div>
            </div>
            <input
              type="text"
              value={config.aboutTitle}
              onChange={e => onChange({ aboutTitle: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block font-semibold text-stone-700">Narrative Description</label>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-stone-500">Font Color:</span>
                <input
                  type="color"
                  value={config.aboutDescriptionColor || '#44403c'}
                  onChange={e => onChange({ aboutDescriptionColor: e.target.value })}
                  className="w-6 h-6 rounded-md border border-stone-300 cursor-pointer p-0.5"
                  title="Description Font Color"
                />
              </div>
            </div>
            <textarea
              rows={4}
              value={config.aboutDescription}
              onChange={e => onChange({ aboutDescription: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden leading-relaxed"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-semibold text-stone-700">Featured Photo (Agriculture / Farm)</label>
              <button
                type="button"
                onClick={() => setShowQuickMedia(!showQuickMedia)}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                {showQuickMedia ? 'Hide Media Picker' : 'Choose from Media & Use'}
              </button>
            </div>

            {/* Current Active Photo Preview */}
            {config.aboutImageUrl && (
              <div className="mb-3 p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-center gap-3">
                <div className="w-24 h-16 rounded-lg overflow-hidden bg-stone-200 border border-stone-300 shrink-0">
                  <img
                    src={config.aboutImageUrl}
                    alt="About Section"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <Check className="w-3 h-3" /> In Use on About Section
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-500 truncate font-mono">{config.aboutImageUrl}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onChange({ aboutImageUrl: '' })}
                  className="px-2 py-1 rounded-lg text-[10px] text-stone-500 hover:bg-stone-200 hover:text-red-600 font-bold"
                >
                  Clear
                </button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={config.aboutImageUrl}
                onChange={e => onChange({ aboutImageUrl: e.target.value })}
                placeholder="Paste image URL or click 'Media Library'..."
                className="flex-1 px-3 py-2 rounded-xl border border-stone-300 font-mono text-[11px]"
              />
              {onOpenMediaPicker && (
                <button
                  type="button"
                  onClick={() => onOpenMediaPicker('aboutImageUrl')}
                  className="px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
                >
                  <FolderOpen className="w-3.5 h-3.5" /> Media Library
                </button>
              )}
            </div>

            {/* Quick Media Selector with explicit "Use" button */}
            <div className="mt-3 p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-800 text-[11px] flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-emerald-700" />
                  Select Media Image to Use:
                </span>
                <span className="text-[10px] text-stone-400">Click &ldquo;Use&rdquo; to apply instantly</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                {mediaItems
                  .filter(m => m.url && !m.url.endsWith('.svg'))
                  .slice(0, 8)
                  .map(item => {
                    const isSelected = config.aboutImageUrl === item.url;
                    return (
                      <div
                        key={item.id}
                        className={`rounded-xl overflow-hidden border bg-white flex flex-col justify-between transition ${
                          isSelected ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs' : 'border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <div className="aspect-4/3 overflow-hidden bg-stone-100 relative">
                          <img
                            src={item.url}
                            alt={item.fileName || 'Media'}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-bold bg-black/70 text-white">
                            {item.category}
                          </span>
                        </div>
                        <div className="p-2 space-y-1.5">
                          <p className="text-[10px] font-semibold text-stone-800 truncate" title={item.fileName}>
                            {item.fileName}
                          </p>
                          {isSelected ? (
                            <div className="w-full py-1 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center justify-center gap-1">
                              <Check className="w-3 h-3" /> In Use
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onChange({ aboutImageUrl: item.url })}
                              className="w-full py-1 rounded-md bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center gap-1 shadow-2xs transition cursor-pointer"
                            >
                              <Check className="w-3 h-3" /> Use
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic About Pillars / Cards */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b pb-3 border-stone-100">
          <h3 className="font-bold text-stone-900 text-sm">About Highlight Cards & Key Mandates</h3>
          <span className="text-[11px] text-stone-400">{aboutCards.length} Cards</span>
        </div>

        <div className="space-y-3">
          {aboutCards.map((card, idx) => (
            <div
              key={card.id}
              className={`p-3.5 rounded-xl border space-y-2 transition ${
                card.visible ? 'bg-stone-50 border-stone-200' : 'bg-stone-100/60 border-stone-200 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-stone-400 text-[11px]">#{idx + 1}</span>
                <input
                  type="text"
                  value={card.title}
                  onChange={e => handleUpdateCard(card.id, { title: e.target.value })}
                  className="flex-1 px-2.5 py-1 rounded-lg border border-stone-300 bg-white font-bold text-stone-900 text-xs"
                />
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggleVisible(card.id)}
                    title={card.visible ? 'Hide from landing page' : 'Show on landing page'}
                    className={`p-1.5 rounded-lg border text-xs cursor-pointer transition ${
                      card.visible
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                        : 'bg-stone-200 border-stone-300 text-stone-500 hover:bg-stone-300'
                    }`}
                  >
                    {card.visible ? <Eye className="w-3.5 h-3.5 text-emerald-700" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMove(idx, 'up')}
                    title="Move Card Up"
                    className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 text-stone-600 disabled:opacity-30 cursor-pointer transition"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === aboutCards.length - 1}
                    onClick={() => handleMove(idx, 'down')}
                    title="Move Card Down"
                    className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 text-stone-600 disabled:opacity-30 cursor-pointer transition"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(card.id)}
                    title="Delete Card"
                    className="p-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 cursor-pointer transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <textarea
                rows={2}
                value={card.description}
                onChange={e => handleUpdateCard(card.id, { description: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 bg-white text-[11px] leading-relaxed"
                placeholder="Card description text"
              />
            </div>
          ))}
        </div>

        {/* Add Card Form */}
        <form onSubmit={handleAddCard} className="pt-3 border-t border-stone-100 space-y-2">
          <span className="font-semibold text-stone-700 block text-xs">Add New Highlight Card</span>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="Card Title (e.g. Free ASF Test Kits)"
              className="px-3 py-1.5 rounded-xl border border-stone-300 sm:w-64"
            />
            <input
              type="text"
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              placeholder="Card Description summary..."
              className="px-3 py-1.5 rounded-xl border border-stone-300 flex-1"
            />
            <button
              type="submit"
              className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Card
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

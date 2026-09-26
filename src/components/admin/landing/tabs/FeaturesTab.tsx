import React, { useState } from 'react';
import { Layers, Plus, Trash2, ArrowUp, ArrowDown, Eye, EyeOff, Edit2, Check, X, FolderPlus } from 'lucide-react';
import { FeatureCardItem, FeatureSectionItem, LandingCmsConfig } from '../../../../types/landingCms';

interface FeaturesTabProps {
  config: LandingCmsConfig;
  onChange: (updates: Partial<LandingCmsConfig>) => void;
}

export const FeaturesTab: React.FC<FeaturesTabProps> = ({ config, onChange }) => {
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newBtnText, setNewBtnText] = useState('');
  const [newBtnLink, setNewBtnLink] = useState('#');

  // New Section State
  const [showNewSectionModal, setShowNewSectionModal] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSectionSubtitle, setNewSectionSubtitle] = useState('');
  const [newSectionDesc, setNewSectionDesc] = useState('');
  const [newSectionInitialCardTitle, setNewSectionInitialCardTitle] = useState('');
  const [newSectionInitialCardDesc, setNewSectionInitialCardDesc] = useState('');

  // Edit Section State
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editSectionTitle, setEditSectionTitle] = useState('');
  const [editSectionSubtitle, setEditSectionSubtitle] = useState('');

  const featureCards = config.featureCards || [];
  const customSections = config.featuresSections || [];

  const handleToggleVisible = (id: string) => {
    onChange({
      featureCards: featureCards.map(f => (f.id === id ? { ...f, visible: !f.visible } : f)),
    });
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= featureCards.length) return;
    const clone = [...featureCards];
    const temp = clone[index];
    clone[index] = clone[newIdx];
    clone[newIdx] = temp;
    onChange({ featureCards: clone.map((f, i) => ({ ...f, order: i + 1 })) });
  };

  const handleDelete = (id: string) => {
    onChange({ featureCards: featureCards.filter(f => f.id !== id) });
  };

  const handleUpdateCard = (id: string, updates: Partial<FeatureCardItem>) => {
    onChange({
      featureCards: featureCards.map(f => (f.id === id ? { ...f, ...updates } : f)),
    });
  };

  const handleAddFeature = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const newFeat: FeatureCardItem = {
      id: 'feat-' + Date.now(),
      title: newTitle.trim(),
      description: newDesc.trim(),
      icon: 'Layers',
      buttonText: newBtnText.trim() || undefined,
      buttonLink: newBtnLink.trim() || undefined,
      visible: true,
      order: featureCards.length + 1,
    };
    onChange({ featureCards: [...featureCards, newFeat] });
    setNewTitle('');
    setNewDesc('');
    setNewBtnText('');
    setNewBtnLink('#');
  };

  // Section Management Handlers
  const handleCreateSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectionTitle.trim()) return;

    const newSection: FeatureSectionItem = {
      id: 'fsec-' + Date.now(),
      title: newSectionTitle.trim(),
      subtitle: newSectionSubtitle.trim() || undefined,
      description: newSectionDesc.trim() || undefined,
      visible: true,
      order: customSections.length + 1,
      cards: newSectionInitialCardTitle.trim()
        ? [
            {
              id: 'fsec-card-' + Date.now(),
              title: newSectionInitialCardTitle.trim(),
              description: newSectionInitialCardDesc.trim() || 'Key operational feature under this section.',
              icon: 'Layers',
              visible: true,
              order: 1,
            },
          ]
        : [],
    };

    onChange({ featuresSections: [...customSections, newSection] });
    setNewSectionTitle('');
    setNewSectionSubtitle('');
    setNewSectionDesc('');
    setNewSectionInitialCardTitle('');
    setNewSectionInitialCardDesc('');
    setShowNewSectionModal(false);
  };

  const handleToggleSectionVisible = (id: string) => {
    onChange({
      featuresSections: customSections.map(s => (s.id === id ? { ...s, visible: !s.visible } : s)),
    });
  };

  const handleDeleteSection = (id: string) => {
    onChange({
      featuresSections: customSections.filter(s => s.id !== id),
    });
  };

  const handleSaveEditSection = (id: string) => {
    onChange({
      featuresSections: customSections.map(s =>
        s.id === id
          ? {
              ...s,
              title: editSectionTitle.trim() || s.title,
              subtitle: editSectionSubtitle.trim() || s.subtitle,
            }
          : s
      ),
    });
    setEditingSectionId(null);
  };

  return (
    <div className="space-y-6 text-xs text-stone-800">
      {/* Section Headlines */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b pb-3 border-stone-100 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-700" />
            <h3 className="font-bold text-stone-900 text-sm">Features Section Headlines</h3>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* NEW SECTION BUTTON as requested */}
            <button
              type="button"
              onClick={() => setShowNewSectionModal(true)}
              className="px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs border bg-emerald-700 text-white border-emerald-800 hover:bg-emerald-600"
              title="Add New Features Section"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Section</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const current = config.showFeaturesSection ?? config.featuresVisible ?? true;
                onChange({ showFeaturesSection: !current, featuresVisible: !current });
              }}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs border ${
                (config.showFeaturesSection ?? config.featuresVisible ?? true)
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200'
                  : 'bg-stone-100 text-stone-600 border-stone-300 hover:bg-stone-200'
              }`}
            >
              {(config.showFeaturesSection ?? config.featuresVisible ?? true) ? (
                <>
                  <Eye className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Enabled</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-stone-500" />
                  <span>Hidden</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Visibility Toggle Row */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200">
          <div>
            <span className="font-bold text-stone-900 text-xs block">Show Features Section on Landing Page</span>
            <p className="text-[11px] text-stone-500">
              When turned on, the Features headlines and system capability cards will be displayed to the public.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
            <input
              type="checkbox"
              checked={config.showFeaturesSection ?? config.featuresVisible ?? true}
              onChange={e => onChange({ showFeaturesSection: e.target.checked, featuresVisible: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-stone-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block font-semibold text-stone-700">Main Section Title</label>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-stone-500">Font Color:</span>
                <input
                  type="color"
                  value={config.featuresTitleColor || '#064e3b'}
                  onChange={e => onChange({ featuresTitleColor: e.target.value })}
                  className="w-6 h-6 rounded-md border border-stone-300 cursor-pointer p-0.5"
                  title="Title Font Color"
                />
              </div>
            </div>
            <input
              type="text"
              value={config.featuresTitle}
              onChange={e => onChange({ featuresTitle: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block font-semibold text-stone-700">Main Section Subtitle</label>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-stone-500">Font Color:</span>
                <input
                  type="color"
                  value={config.featuresSubtitleColor || '#78716c'}
                  onChange={e => onChange({ featuresSubtitleColor: e.target.value })}
                  className="w-6 h-6 rounded-md border border-stone-300 cursor-pointer p-0.5"
                  title="Subtitle Font Color"
                />
              </div>
            </div>
            <input
              type="text"
              value={config.featuresSubtitle}
              onChange={e => onChange({ featuresSubtitle: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Custom Created Sections List */}
        {customSections.length > 0 && (
          <div className="space-y-2 pt-3 border-t border-stone-200">
            <div className="flex items-center justify-between">
              <span className="font-bold text-stone-800 text-xs">
                Additional Sections ({customSections.length})
              </span>
              <span className="text-[10px] text-stone-400">Sections added via "New Section"</span>
            </div>

            <div className="space-y-2">
              {customSections.map(sec => (
                <div
                  key={sec.id}
                  className={`p-3 rounded-xl border transition flex items-center justify-between gap-3 ${
                    sec.visible !== false
                      ? 'bg-stone-50 border-stone-200'
                      : 'bg-stone-100 border-stone-200 opacity-60'
                  }`}
                >
                  {editingSectionId === sec.id ? (
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={editSectionTitle}
                        onChange={e => setEditSectionTitle(e.target.value)}
                        placeholder="Section title"
                        className="px-2.5 py-1 rounded-lg border border-emerald-500 bg-white text-xs font-bold"
                      />
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={editSectionSubtitle}
                          onChange={e => setEditSectionSubtitle(e.target.value)}
                          placeholder="Section subtitle"
                          className="px-2.5 py-1 rounded-lg border border-stone-300 bg-white text-xs flex-1"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEditSection(sec.id)}
                          className="p-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white cursor-pointer"
                          title="Save changes"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingSectionId(null)}
                          className="p-1 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-700 cursor-pointer"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-900 text-xs truncate">{sec.title}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                            {sec.cards?.length || 0} cards
                          </span>
                        </div>
                        {sec.subtitle && (
                          <p className="text-[11px] text-stone-500 truncate mt-0.5">{sec.subtitle}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSectionId(sec.id);
                            setEditSectionTitle(sec.title);
                            setEditSectionSubtitle(sec.subtitle || '');
                          }}
                          className="p-1.5 rounded-lg hover:bg-stone-200 text-stone-600 cursor-pointer"
                          title="Edit section"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleSectionVisible(sec.id)}
                          className="p-1.5 rounded-lg hover:bg-stone-200 text-stone-600 cursor-pointer"
                          title={sec.visible !== false ? 'Hide section' : 'Show section'}
                        >
                          {sec.visible !== false ? (
                            <Eye className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <EyeOff className="w-3.5 h-3.5 text-stone-400" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSection(sec.id)}
                          className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-600 cursor-pointer"
                          title="Delete section"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* New Section Modal */}
      {showNewSectionModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-lg w-full p-5 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b pb-3 border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <FolderPlus className="w-4 h-4 text-emerald-700" />
                </div>
                <div>
                  <h4 className="font-bold text-stone-900 text-sm">Add New Section</h4>
                  <p className="text-[11px] text-stone-500">Create an additional features or services section</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNewSectionModal(false)}
                className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSection} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Section Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newSectionTitle}
                  onChange={e => setNewSectionTitle(e.target.value)}
                  placeholder="e.g. Biosecurity Services & Inspection"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Section Subtitle</label>
                <input
                  type="text"
                  value={newSectionSubtitle}
                  onChange={e => setNewSectionSubtitle(e.target.value)}
                  placeholder="e.g. Mandatory municipal safeguards for hog transport and market trade"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Section Description (Optional)</label>
                <textarea
                  rows={2}
                  value={newSectionDesc}
                  onChange={e => setNewSectionDesc(e.target.value)}
                  placeholder="Brief introductory summary of this section..."
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                <span className="font-bold text-stone-800 text-[11px] block">Initial Feature Card (Optional)</span>
                <div>
                  <input
                    type="text"
                    value={newSectionInitialCardTitle}
                    onChange={e => setNewSectionInitialCardTitle(e.target.value)}
                    placeholder="Card Title (e.g. Rapid Health Testing)"
                    className="w-full px-3 py-1.5 rounded-xl border border-stone-300 bg-white font-medium text-xs mb-1.5"
                  />
                  <input
                    type="text"
                    value={newSectionInitialCardDesc}
                    onChange={e => setNewSectionInitialCardDesc(e.target.value)}
                    placeholder="Card Description (e.g. On-site verification at barangay stations)"
                    className="w-full px-3 py-1.5 rounded-xl border border-stone-300 bg-white text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowNewSectionModal(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Section</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Feature Cards Manager */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b pb-3 border-stone-100">
          <h3 className="font-bold text-stone-900 text-sm">System Capabilities & Modules Cards</h3>
          <span className="text-[11px] text-stone-400">{featureCards.length} Cards</span>
        </div>

        <div className="space-y-3">
          {featureCards.map((card, idx) => (
            <div
              key={card.id}
              className={`p-4 rounded-xl border space-y-2.5 transition ${
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
                    disabled={idx === featureCards.length - 1}
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
                placeholder="Detailed feature description"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <input
                  type="text"
                  value={card.buttonText || ''}
                  onChange={e => handleUpdateCard(card.id, { buttonText: e.target.value })}
                  placeholder="Button label (e.g. View Map)"
                  className="px-2.5 py-1 rounded-lg border border-stone-300 bg-white text-[11px]"
                />
                <input
                  type="text"
                  value={card.buttonLink || ''}
                  onChange={e => handleUpdateCard(card.id, { buttonLink: e.target.value })}
                  placeholder="Target link (e.g. #gis)"
                  className="px-2.5 py-1 rounded-lg border border-stone-300 bg-white font-mono text-[11px]"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Add Feature Form */}
        <form onSubmit={handleAddFeature} className="pt-3 border-t border-stone-100 space-y-2">
          <span className="font-semibold text-stone-700 block text-xs">Add New Feature Card</span>
          <div className="space-y-2">
            <input
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="Feature Title (e.g. Solar Ear Tag Tracing)"
              className="w-full px-3 py-1.5 rounded-xl border border-stone-300"
            />
            <textarea
              rows={2}
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              placeholder="Brief description of feature..."
              className="w-full px-3 py-1.5 rounded-xl border border-stone-300"
            />
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                value={newBtnText}
                onChange={e => setNewBtnText(e.target.value)}
                placeholder="Button text (optional)"
                className="px-3 py-1.5 rounded-xl border border-stone-300 w-44"
              />
              <input
                type="text"
                value={newBtnLink}
                onChange={e => setNewBtnLink(e.target.value)}
                placeholder="Target URL / anchor"
                className="px-3 py-1.5 rounded-xl border border-stone-300 flex-1 font-mono text-[11px]"
              />
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Feature
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

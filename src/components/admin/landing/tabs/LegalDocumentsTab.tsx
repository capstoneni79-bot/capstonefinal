import React, { useState, useEffect } from 'react';
import {
  Scale,
  CheckSquare,
  Square,
  Search,
  Eye,
  Sparkles,
  FileText,
  Calendar,
  Layers,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { LandingCmsConfig, LegalDocumentsLandingConfig } from '../../../../types/landingCms';
import { storageService } from '../../../../services/storageService';
import { ASFRegulatoryDocument } from '../../../../types';
import { DEFAULT_LEGAL_DOCUMENTS_CONFIG } from '../../../../services/landingCmsService';

interface LegalDocumentsTabProps {
  config: LandingCmsConfig;
  onChange: (updates: Partial<LandingCmsConfig>) => void;
}

export const LegalDocumentsTab: React.FC<LegalDocumentsTabProps> = ({ config, onChange }) => {
  const [allDocs, setAllDocs] = useState<ASFRegulatoryDocument[]>([]);
  const [filterQuery, setFilterQuery] = useState('');

  useEffect(() => {
    const docs = storageService.getAsfRegulations();
    setAllDocs(docs);
  }, []);

  const currentLegalConfig: LegalDocumentsLandingConfig = {
    ...DEFAULT_LEGAL_DOCUMENTS_CONFIG,
    ...(config.legalDocumentsConfig || {}),
  };

  const updateLegalConfig = (partial: Partial<LegalDocumentsLandingConfig>) => {
    onChange({
      legalDocumentsConfig: {
        ...currentLegalConfig,
        ...partial,
      },
    });
  };

  const toggleFeaturedDoc = (docId: string) => {
    const current = currentLegalConfig.featuredDocumentIds || [];
    const updated = current.includes(docId)
      ? current.filter(id => id !== docId)
      : [...current, docId];
    updateLegalConfig({ featuredDocumentIds: updated });
  };

  const selectAllFeatured = () => {
    updateLegalConfig({
      featuredDocumentIds: allDocs.filter(d => !d.isArchived && d.status !== 'archived').map(d => d.id),
    });
  };

  const clearAllFeatured = () => {
    updateLegalConfig({ featuredDocumentIds: [] });
  };

  const filteredDocs = allDocs.filter(doc => {
    const q = filterQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (doc.officialNumber || '').toLowerCase().includes(q) ||
      (doc.title || '').toLowerCase().includes(q) ||
      (doc.knownAs || '').toLowerCase().includes(q) ||
      (doc.type || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 text-xs text-stone-800">
      {/* Overview & Master Switch */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3 border-stone-100">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-emerald-700" />
            <div>
              <h3 className="font-bold text-stone-900 text-sm">
                Landing Page Settings: Legal Decrees & Ordinances
              </h3>
              <p className="text-[11px] text-stone-500">
                Configure which municipal statutory ordinances and resolutions are published on the public landing page.
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={currentLegalConfig.showLegalDocuments}
              onChange={e => updateLegalConfig({ showLegalDocuments: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-stone-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            <span className="ml-2 font-bold text-stone-900 text-xs">
              {currentLegalConfig.showLegalDocuments ? 'Section Enabled' : 'Section Hidden'}
            </span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              Landing Section Title
            </label>
            <input
              type="text"
              value={currentLegalConfig.sectionTitle || ''}
              onChange={e => updateLegalConfig({ sectionTitle: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              placeholder="e.g. LEGAL DECREES & ORDINANCES"
            />
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              Maximum Featured Documents to Display
            </label>
            <input
              type="number"
              min={1}
              max={20}
              value={currentLegalConfig.maxFeaturedDocuments || 5}
              onChange={e => updateLegalConfig({ maxFeaturedDocuments: Math.max(1, parseInt(e.target.value) || 5) })}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block font-semibold text-stone-700 mb-1">
              Section Subtitle / Explanatory Text
            </label>
            <input
              type="text"
              value={currentLegalConfig.sectionSubtitle || ''}
              onChange={e => updateLegalConfig({ sectionSubtitle: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-700 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              placeholder="e.g. Official statutory framework, zoning ordinances, and regulatory resolutions enacted by the Sangguniang Bayan"
            />
          </div>
        </div>
      </div>

      {/* Display Options & Layout Configuration */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
        <h4 className="font-bold text-stone-900 text-xs uppercase tracking-wider text-emerald-800 border-b pb-2 border-stone-100 flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-emerald-600" />
          Landing Display & Feature Controls
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <label className="flex items-center gap-2.5 p-3 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 cursor-pointer transition">
            <input
              type="checkbox"
              checked={currentLegalConfig.showLatestDocuments}
              onChange={e => updateLegalConfig({ showLatestDocuments: e.target.checked })}
              className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
            />
            <div>
              <span className="font-bold text-stone-900 block text-xs">[✓] Latest Documents</span>
              <span className="text-[10px] text-stone-500">Show latest enacted legal statutes</span>
            </div>
          </label>

          <label className="flex items-center gap-2.5 p-3 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 cursor-pointer transition">
            <input
              type="checkbox"
              checked={currentLegalConfig.showFeaturedDocuments}
              onChange={e => updateLegalConfig({ showFeaturedDocuments: e.target.checked })}
              className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
            />
            <div>
              <span className="font-bold text-stone-900 block text-xs">[✓] Featured Documents</span>
              <span className="text-[10px] text-stone-500">Highlight selected priority ordinances</span>
            </div>
          </label>

          <label className="flex items-center gap-2.5 p-3 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 cursor-pointer transition">
            <input
              type="checkbox"
              checked={currentLegalConfig.showSearch}
              onChange={e => updateLegalConfig({ showSearch: e.target.checked })}
              className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
            />
            <div>
              <span className="font-bold text-stone-900 block text-xs">[✓] Search Legal Documents</span>
              <span className="text-[10px] text-stone-500">Public search bar for citizens</span>
            </div>
          </label>
        </div>

        {/* Visibility of individual metadata fields */}
        <div className="border-t border-stone-100 pt-3">
          <p className="font-bold text-stone-800 text-xs mb-2">Show in Document Cards:</p>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={currentLegalConfig.showDocumentNumber}
                onChange={e => updateLegalConfig({ showDocumentNumber: e.target.checked })}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="font-semibold text-stone-700">[✓] Document Number</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={currentLegalConfig.showTitle}
                onChange={e => updateLegalConfig({ showTitle: e.target.checked })}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="font-semibold text-stone-700">[✓] Title</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={currentLegalConfig.showDate}
                onChange={e => updateLegalConfig({ showDate: e.target.checked })}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="font-semibold text-stone-700">[✓] Date</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={currentLegalConfig.showCategory}
                onChange={e => updateLegalConfig({ showCategory: e.target.checked })}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="font-semibold text-stone-700">[✓] Category</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={currentLegalConfig.showViewButton}
                onChange={e => updateLegalConfig({ showViewButton: e.target.checked })}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="font-semibold text-stone-700">[✓] View Document Button</span>
            </label>
          </div>
        </div>
      </div>

      {/* Featured Documents Selection Matrix */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3 border-stone-100">
          <div>
            <h4 className="font-bold text-stone-900 text-xs uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Featured Legal Documents Selection
            </h4>
            <p className="text-[11px] text-stone-500">
              Any newly imported or enacted statutory document is automatically listed here. Check to publish on the landing page.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={selectAllFeatured}
              className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-50 rounded-lg border border-emerald-200 transition"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={clearAllFeatured}
              className="px-2.5 py-1 text-[11px] font-bold text-stone-600 hover:bg-stone-50 rounded-lg border border-stone-200 transition"
            >
              Deselect All
            </button>
          </div>
        </div>

        {/* Filter input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
          <input
            type="text"
            value={filterQuery}
            onChange={e => setFilterQuery(e.target.value)}
            placeholder="Search documents by number, title, or category..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-stone-200 text-xs text-stone-800 bg-stone-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Document list */}
        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {filteredDocs.length === 0 ? (
            <div className="text-center py-8 text-stone-400">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No legal documents found matching query.</p>
            </div>
          ) : (
            filteredDocs.map(doc => {
              const isSelected = (currentLegalConfig.featuredDocumentIds || []).includes(doc.id);
              return (
                <div
                  key={doc.id}
                  onClick={() => toggleFeaturedDoc(doc.id)}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border transition cursor-pointer ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/60 shadow-2xs'
                      : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50/70'
                  }`}
                >
                  <div className="mt-0.5 text-emerald-700">
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Square className="w-4 h-4 text-stone-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-bold text-stone-900 text-xs">
                        {doc.officialNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-700">
                        {doc.category || doc.type}
                      </span>
                      {doc.dateEnacted && (
                        <span className="text-[11px] text-stone-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-stone-400" />
                          {doc.dateEnacted}
                        </span>
                      )}
                      {isSelected && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white">
                          Featured on Landing
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-semibold text-stone-800 line-clamp-1">
                      {doc.title}
                    </p>
                    {doc.knownAs && (
                      <p className="text-[11px] text-stone-500 italic line-clamp-1">
                        Known as: &ldquo;{doc.knownAs}&rdquo;
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Helpful notice */}
        <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-[11px]">
          <HelpCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <p>
            <strong>Automatic Discovery:</strong> When you use <em>Import Legal Document</em> to upload and OCR an Ordinance, Resolution, or Executive Order, it is automatically processed, indexed, and made available in this list so you can choose whether to display it on the public landing page with a single click.
          </p>
        </div>
      </div>
    </div>
  );
};

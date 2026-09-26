import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, FileText, ScrollText, ShieldAlert, BookOpen, Archive } from 'lucide-react';
import { ASFRegulatoryDocument } from '../../types';

interface LegalDocumentComboBoxProps {
  documents: ASFRegulatoryDocument[];
  selectedId: string;
  onSelect: (id: string) => void;
  className?: string;
}

export const LegalDocumentComboBox: React.FC<LegalDocumentComboBoxProps> = ({
  documents,
  selectedId,
  onSelect,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedDoc = documents.find(d => d.id === selectedId) || documents[0];

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const uniqueDocuments = useMemo(() => {
    const seen = new Set<string>();
    return documents.filter(doc => {
      if (!doc || !doc.id || seen.has(doc.id)) return false;
      seen.add(doc.id);
      return true;
    });
  }, [documents]);

  const filteredDocs = uniqueDocuments.filter(doc => {
    const q = searchQuery.toLowerCase();
    return (
      doc.officialNumber.toLowerCase().includes(q) ||
      doc.title.toLowerCase().includes(q) ||
      (doc.knownAs && doc.knownAs.toLowerCase().includes(q)) ||
      (doc.author && doc.author.toLowerCase().includes(q)) ||
      doc.seriesYear.toLowerCase().includes(q) ||
      doc.type.toLowerCase().includes(q)
    );
  });

  const getDocIcon = (type: string) => {
    switch (type) {
      case 'municipal_ordinance':
      case 'provincial_ordinance':
        return <FileText className="w-4 h-4 text-emerald-600 shrink-0" />;
      case 'resolution':
        return <ScrollText className="w-4 h-4 text-blue-600 shrink-0" />;
      case 'administrative_order':
      case 'municipal_eo':
        return <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />;
      default:
        return <BookOpen className="w-4 h-4 text-stone-600 shrink-0" />;
    }
  };

  const getCategoryLabel = (type: string) => {
    switch (type) {
      case 'municipal_ordinance':
        return 'Municipal Ordinance';
      case 'provincial_ordinance':
        return 'Provincial Ordinance';
      case 'resolution':
        return 'Sangguniang Bayan Resolution';
      case 'administrative_order':
        return 'National DA Administrative Order';
      case 'municipal_eo':
        return 'Municipal Executive Order';
      default:
        return 'Legal Reference';
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Combobox Trigger Button */}
      <button
        type="button"
        id="legal-doc-combobox-trigger"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-white hover:bg-stone-50/80 border border-stone-300 rounded-xl shadow-xs transition focus:outline-hidden focus:ring-2 focus:ring-emerald-600 text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-100 shrink-0">
            {selectedDoc ? getDocIcon(selectedDoc.type) : <FileText className="w-4 h-4 text-emerald-600" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-stone-900 truncate">
                {selectedDoc?.officialNumber || 'Select Legal Decree / Ordinance'}
              </span>
              {selectedDoc?.status === 'archived' ? (
                <span className="text-[10px] bg-stone-200 text-stone-700 px-1.5 py-0.5 rounded-sm font-semibold">
                  Archived
                </span>
              ) : (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-sm font-semibold">
                  {selectedDoc?.seriesYear}
                </span>
              )}
            </div>
            <p className="text-[11px] text-stone-500 truncate max-w-md sm:max-w-xl">
              {selectedDoc?.knownAs || selectedDoc?.title}
            </p>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-stone-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-white border border-stone-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
          {/* Search Input */}
          <div className="p-2 border-b border-stone-100 bg-stone-50/70">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by number, title, author, year (e.g. 2025-59, 376, Ngoho)..."
                className="w-full pl-8.5 pr-3 py-1.5 text-xs bg-white border border-stone-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
                autoFocus
              />
            </div>
          </div>

          {/* List of Documents */}
          <div className="max-h-72 overflow-y-auto divide-y divide-stone-100 p-1">
            {filteredDocs.length === 0 ? (
              <div className="py-6 text-center text-xs text-stone-500">
                No legal document matching &quot;{searchQuery}&quot;
              </div>
            ) : (
              filteredDocs.map((doc, docIdx) => {
                const isSelected = doc.id === selectedId;
                return (
                  <button
                    key={`doc-combo-${doc.id || docIdx}-${docIdx}`}
                    type="button"
                    onClick={() => {
                      onSelect(doc.id);
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg flex items-start justify-between gap-2 transition ${
                      isSelected
                        ? 'bg-emerald-50 text-emerald-950 font-medium'
                        : 'hover:bg-stone-50 text-stone-800'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="mt-0.5">{getDocIcon(doc.type)}</div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-stone-900">{doc.officialNumber}</span>
                          <span className="text-[10px] text-stone-500 font-medium bg-stone-100 px-1.5 py-0.2 rounded-sm">
                            {getCategoryLabel(doc.type)}
                          </span>
                          {doc.status === 'archived' && (
                            <span className="text-[9px] bg-stone-200 text-stone-600 px-1.5 py-0.2 rounded-sm font-semibold flex items-center gap-0.5">
                              <Archive className="w-2.5 h-2.5" /> Archived
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-stone-600 line-clamp-1 mt-0.5 font-normal">
                          {doc.knownAs ? `"${doc.knownAs}" — ` : ''}
                          {doc.title}
                        </p>
                        {doc.author && (
                          <span className="text-[10px] text-stone-400">Author: {doc.author}</span>
                        )}
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

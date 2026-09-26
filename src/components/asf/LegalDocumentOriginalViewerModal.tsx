import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  X,
  Eye,
  Layers,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Sparkles,
} from 'lucide-react';
import { ASFRegulatoryDocument, LegalSourceAttachment } from '../../types';

interface LegalDocumentOriginalViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: ASFRegulatoryDocument | null;
  initialAttachment?: LegalSourceAttachment | null;
}

export const LegalDocumentOriginalViewerModal: React.FC<LegalDocumentOriginalViewerModalProps> = ({
  isOpen,
  onClose,
  document,
  initialAttachment,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [viewMode, setViewMode] = useState<'extracted' | 'source_preview' | 'side_by_side'>('side_by_side');

  if (!isOpen || !document) return null;

  const attachment = initialAttachment || document.sourceDocuments?.[0];
  const totalPages = document.articles?.reduce(
    (max, a) => Math.max(max, ...a.sections.map(s => Number(s.scannedPageRef) || 1)),
    1
  ) || 1;

  // Sections on the current page
  const pageSections = document.articles?.flatMap(art =>
    art.sections.filter(s => (Number(s.scannedPageRef) || 1) === currentPage).map(s => ({
      ...s,
      articleTitle: art.articleTitle,
      articleNumber: art.articleNumber,
    }))
  ) || [];

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (attachment?.url) {
      const a = window.document.createElement('a');
      a.href = attachment.url;
      a.download = attachment.name || `${document.officialNumber}_original.pdf`;
      a.click();
    } else {
      const blob = new Blob([document.fullText || document.title], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `${document.officialNumber}_text.txt`;
      a.click();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-md">
      <div className="flex h-[92vh] w-full max-w-6xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-6 py-3.5 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold flex items-center gap-2">
                <span>Original Document & Source Inspector</span>
                <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[11px] font-mono text-emerald-300">
                  {document.type} No. {document.officialNumber}
                </span>
              </h2>
              <p className="text-[11px] text-slate-400 truncate max-w-xl">
                {document.title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Switcher */}
            <div className="flex rounded-lg bg-slate-800 p-0.5 border border-slate-700">
              <button
                onClick={() => setViewMode('side_by_side')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  viewMode === 'side_by_side' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                Split View
              </button>
              <button
                onClick={() => setViewMode('extracted')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  viewMode === 'extracted' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                Structured Text
              </button>
              <button
                onClick={() => setViewMode('source_preview')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  viewMode === 'source_preview' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                Original Source
              </button>
            </div>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1 rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
              title="Download Original"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1 rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
              title="Print"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print</span>
            </button>

            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Sub-bar: Pagination & Zoom */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-2">
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="rounded p-1 text-slate-600 hover:bg-slate-200 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-semibold text-slate-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="rounded p-1 text-slate-600 hover:bg-slate-200 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>Attachment: {attachment?.name || 'Digital Source Record'}</span>
            <div className="flex items-center gap-1 border-l border-slate-300 pl-3">
              <button
                onClick={() => setZoomLevel(prev => Math.max(70, prev - 10))}
                className="rounded p-1 hover:bg-slate-200"
              >
                <ZoomOut className="h-3.5 w-3.5 text-slate-600" />
              </button>
              <span className="font-mono text-[11px] font-bold text-slate-700">{zoomLevel}%</span>
              <button
                onClick={() => setZoomLevel(prev => Math.min(150, prev + 10))}
                className="rounded p-1 hover:bg-slate-200"
              >
                <ZoomIn className="h-3.5 w-3.5 text-slate-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden p-6 bg-slate-100">
          <div
            className={`grid h-full gap-6 ${
              viewMode === 'side_by_side'
                ? 'grid-cols-1 lg:grid-cols-2'
                : 'grid-cols-1'
            }`}
          >
            {/* Left: Original Source File / Scanned Page */}
            {(viewMode === 'side_by_side' || viewMode === 'source_preview') && (
              <div className="flex flex-col rounded-xl border border-slate-300 bg-white shadow-sm overflow-hidden">
                <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Source Document / Scanned Page {currentPage}</span>
                  <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                    Official Primary Record
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto p-6 flex items-center justify-center bg-slate-900/5">
                  {attachment?.url && attachment.url.startsWith('data:image') ? (
                    <img
                      src={attachment.url}
                      alt="Scanned original page"
                      style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
                      className="max-h-[600px] w-auto shadow-md rounded border border-slate-300 transition-transform"
                    />
                  ) : (
                    <div
                      style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
                      className="w-full max-w-xl rounded-lg bg-white p-6 shadow-md border border-slate-200 font-serif text-xs leading-relaxed transition-transform"
                    >
                      <div className="text-center font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200 uppercase">
                        Republic of the Philippines<br />
                        Province of Southern Leyte<br />
                        {document.jurisdiction || 'Municipality of Hinunangan'}<br />
                        <span className="text-emerald-800 text-sm mt-1 block">
                          {document.type} No. {document.officialNumber}
                        </span>
                      </div>
                      <p className="font-bold text-slate-800 mb-3 text-center">{document.title}</p>
                      <div className="space-y-3 text-slate-700">
                        {pageSections.map((sec, idx) => (
                          <div key={idx} className="border-l-2 border-emerald-500 pl-3 py-1">
                            <span className="font-bold text-slate-900 block">
                              {sec.sectionNumber} - {sec.sectionTitle}
                            </span>
                            <p className="mt-1 text-slate-600 whitespace-pre-wrap">{sec.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Right: Extracted Structured Sections & Metadata */}
            {(viewMode === 'side_by_side' || viewMode === 'extracted') && (
              <div className="flex flex-col rounded-xl border border-slate-300 bg-white shadow-sm overflow-hidden">
                <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Structured Digital Extractions (Page {currentPage})</span>
                  <span className="text-[10px] text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded">
                    Queryable Database Records
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {pageSections.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs">
                      No specific sections mapped to Page {currentPage}. Showing all document sections below:
                      <div className="mt-4 space-y-3 text-left">
                        {document.articles?.map(art => (
                          <div key={art.id} className="rounded-lg border border-slate-200 p-3">
                            <div className="font-bold text-slate-800 text-xs mb-2">{art.articleNumber}: {art.articleTitle}</div>
                            <div className="space-y-2">
                              {art.sections.map(s => (
                                <div key={s.id} className="text-xs text-slate-600 bg-slate-50 p-2 rounded">
                                  <strong>{s.sectionNumber} ({s.sectionTitle}):</strong> {s.content}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    pageSections.map((sec, idx) => (
                      <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-900 bg-emerald-100 px-2.5 py-1 rounded-md">
                            {sec.sectionNumber}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-500">
                            {sec.articleNumber}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-800">{sec.sectionTitle}</h4>
                        <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap bg-white p-3 rounded-lg border border-slate-200">
                          {sec.content}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  FileText,
  CheckCircle2,
  AlertTriangle,
  X,
  Trash2,
  Calendar,
  User,
  ExternalLink,
  Filter,
  ShieldCheck,
  Activity,
  ArrowUpDown,
  FileEdit,
  Archive,
  RefreshCw,
} from 'lucide-react';
import { LegalImportHistoryRecord } from '../../types/legalImport';
import { storageService } from '../../services/storageService';

interface LegalAuditLog {
  id: string;
  action: 'create' | 'update' | 'archive' | 'restore' | 'delete' | 'import';
  documentId: string;
  documentTitle: string;
  user: string;
  role: string;
  timestamp: string;
  details: string;
}

interface LegalImportHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDocument?: (docId: string) => void;
}

export const LegalImportHistoryModal: React.FC<LegalImportHistoryModalProps> = ({
  isOpen,
  onClose,
  onSelectDocument,
}) => {
  const [activeTab, setActiveTab] = useState<'import_history' | 'audit_trail'>('import_history');
  const [history, setHistory] = useState<LegalImportHistoryRecord[]>(() =>
    storageService.getLegalImportHistory()
  );
  const [auditLogs, setAuditLogs] = useState<LegalAuditLog[]>([]);
  const [isLoadingAuditLogs, setIsLoadingAuditLogs] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');

  useEffect(() => {
    if (!isOpen) return;
    setHistory(storageService.getLegalImportHistory());

    setIsLoadingAuditLogs(true);
    fetch('/api/legal-documents/audit-logs')
      .then(res => res.json())
      .then(resData => {
        if (resData?.success && Array.isArray(resData.data)) {
          setAuditLogs(resData.data);
        }
      })
      .catch(err => {
        console.warn('Could not fetch audit logs:', err);
      })
      .finally(() => {
        setIsLoadingAuditLogs(false);
      });
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredHistory = history.filter(item => {
    const matchesSearch =
      item.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.documentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.documentTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.importedBy.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (filterType !== 'all' && item.fileType.toLowerCase() !== filterType.toLowerCase()) {
      return false;
    }
    return true;
  });

  const filteredAuditLogs = auditLogs.filter(log => {
    const matchesSearch =
      log.documentTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.documentId.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (actionFilter !== 'all' && log.action !== actionFilter) {
      return false;
    }
    return true;
  });

  const handleDelete = (id: string) => {
    storageService.deleteLegalImportHistory(id);
    setHistory(storageService.getLegalImportHistory());
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'create':
        return (
          <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3 h-3" /> Created
          </span>
        );
      case 'update':
        return (
          <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-black uppercase bg-blue-100 text-blue-800">
            <FileEdit className="w-3 h-3" /> Updated
          </span>
        );
      case 'archive':
        return (
          <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-black uppercase bg-amber-100 text-amber-900">
            <Archive className="w-3 h-3" /> Archived
          </span>
        );
      case 'restore':
        return (
          <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-black uppercase bg-purple-100 text-purple-900">
            <RefreshCw className="w-3 h-3" /> Restored
          </span>
        );
      case 'delete':
        return (
          <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-black uppercase bg-rose-100 text-rose-800">
            <Trash2 className="w-3 h-3" /> Deleted
          </span>
        );
      case 'import':
        return (
          <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-black uppercase bg-teal-100 text-teal-900">
            <ArrowUpDown className="w-3 h-3" /> Imported
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-black uppercase bg-slate-100 text-slate-800">
            {action}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm">
      <div className="flex max-h-[88vh] w-full max-w-5xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Legal Decrees &amp; Ordinances Audit Trail</h2>
              <p className="text-xs text-slate-400">
                Statutory audit log of municipal decrees, smart imports, OCR extractions, and revisions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-100 px-6 pt-3">
          <button
            type="button"
            onClick={() => setActiveTab('import_history')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-xl border-b-2 transition ${
              activeTab === 'import_history'
                ? 'bg-white border-emerald-600 text-slate-900 shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <History className="w-4 h-4 text-emerald-600" />
            <span>Document Import History ({filteredHistory.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audit_trail')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-xl border-b-2 transition ${
              activeTab === 'audit_trail'
                ? 'bg-white border-emerald-600 text-slate-900 shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Activity className="w-4 h-4 text-blue-600" />
            <span>System Audit Trail ({filteredAuditLogs.length})</span>
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-6 py-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={
                activeTab === 'import_history'
                  ? 'Search file name, ordinance number, title, or user...'
                  : 'Search document title, user, action details...'
              }
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-500" />
            {activeTab === 'import_history' ? (
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-emerald-500 focus:outline-none"
              >
                <option value="all">All File Types</option>
                <option value="pdf">PDF Documents</option>
                <option value="docx">Word DOCX</option>
                <option value="xlsx">Excel Spreadsheets</option>
                <option value="jpg">Scanned JPG/PNG</option>
              </select>
            ) : (
              <select
                value={actionFilter}
                onChange={e => setActionFilter(e.target.value)}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-emerald-500 focus:outline-none"
              >
                <option value="all">All Actions</option>
                <option value="create">Created</option>
                <option value="update">Updated</option>
                <option value="archive">Archived</option>
                <option value="restore">Restored</option>
                <option value="import">Imported</option>
                <option value="delete">Deleted</option>
              </select>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'import_history' ? (
            filteredHistory.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-600">No import history found</p>
                <p className="text-xs text-slate-400 mt-1">Imported documents will appear here with full logs.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                {filteredHistory.map(item => (
                  <div key={item.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs uppercase">
                          {item.fileType}
                        </div>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">
                              {item.documentType} No. {item.documentNumber}
                            </span>
                            <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                              {item.fileName} ({item.fileSize})
                            </span>
                            <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                              <CheckCircle2 className="h-3 w-3" /> {item.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 line-clamp-2">{item.documentTitle}</p>
                          
                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {new Date(item.importedAt).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="h-3.5 w-3.5" /> {item.importedBy}
                            </span>
                            <span className="font-semibold text-emerald-700">
                              {item.sectionsDetected} Sections Detected ({item.articlesDetected} Articles)
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                        {item.documentId && onSelectDocument && (
                          <button
                            onClick={() => {
                              onSelectDocument(item.documentId);
                              onClose();
                            }}
                            className="flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            <span>View Document</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                          title="Delete log"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            /* System Audit Trail View */
            isLoadingAuditLogs ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                <span>Loading legal audit trail records...</span>
              </div>
            ) : filteredAuditLogs.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-600">No audit trail records found</p>
                <p className="text-xs text-slate-400 mt-1">Actions performed on legal documents will appear here.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                {filteredAuditLogs.map(log => (
                  <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {getActionBadge(log.action)}
                          <span className="text-xs font-bold text-slate-900">
                            {log.documentTitle}
                          </span>
                          <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {log.documentId}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed">
                          {log.details}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1">
                          <span className="flex items-center gap-1 font-medium text-slate-600">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            {log.user} ({log.role})
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-slate-500">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {log.documentId && onSelectDocument && (
                        <div className="self-end md:self-center shrink-0">
                          <button
                            onClick={() => {
                              onSelectDocument(log.documentId);
                              onClose();
                            }}
                            className="flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition-colors"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            <span>View</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3 text-xs text-slate-500">
          <span>
            {activeTab === 'import_history'
              ? `Total Import Records: ${filteredHistory.length}`
              : `Total Audit Logs: ${filteredAuditLogs.length}`}
          </span>
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-300 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

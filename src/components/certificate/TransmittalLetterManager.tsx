import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Plus,
  Search,
  Printer,
  FileText,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Eye,
  FileSpreadsheet,
  ArrowLeft,
  Copy,
  Download,
} from 'lucide-react';
import { TransmittalLetter, UserAccount } from '../../types';
import { storageService } from '../../services/storageService';
import { SealBagongPilipinas, SealDA, SealMunicipality } from '../common/OfficialSeals';

interface TransmittalLetterManagerProps {
  currentUser?: UserAccount | null;
  onNotice?: (msg: string) => void;
}

export const TransmittalLetterManager: React.FC<TransmittalLetterManagerProps> = ({
  currentUser,
  onNotice,
}) => {
  const [letters, setLetters] = useState<TransmittalLetter[]>(() =>
    storageService.getTransmittalLetters()
  );
  const [selectedLetter, setSelectedLetter] = useState<TransmittalLetter | null>(() => {
    const list = storageService.getTransmittalLetters();
    return list[0] || null;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'preview' | 'list'>('preview');

  // Modal states
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingLetter, setEditingLetter] = useState<TransmittalLetter | null>(null);
  const [letterToDelete, setLetterToDelete] = useState<TransmittalLetter | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const printRef = useRef<HTMLDivElement>(null);

  const refreshList = () => {
    const list = storageService.getTransmittalLetters();
    setLetters(list);
    if (selectedLetter) {
      const updated = list.find(l => l.id === selectedLetter.id);
      setSelectedLetter(updated || list[0] || null);
    } else if (list.length > 0) {
      setSelectedLetter(list[0]);
    }
  };

  const filteredLetters = letters.filter(l => {
    const matchSearch =
      l.refNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.to.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.barangay || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'all' || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Placeholder replacer function
  const renderTransmittalBody = (letter?: TransmittalLetter | null): string => {
    if (!letter) return '';
    let body = letter.contentTemplate || (letter as any).body || '';
    const formattedDate = new Date(letter.date || Date.now()).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    const docListFormatted = (letter.documentList || [])
      .map((doc, idx) => `${idx + 1}. ${doc}`)
      .join('\n');

    body = (body || '')
      .replace(/\{\{transmittal_number\}\}/g, letter.refNo || 'TM-OMAS-2026-001')
      .replace(/\{\{ref_no\}\}/g, letter.refNo || 'TM-OMAS-2026-001')
      .replace(/\{\{date\}\}/g, formattedDate)
      .replace(/\{\{from\}\}/g, `${letter.from || 'Office of the Municipal Agriculturist'}${letter.fromTitle ? `, ${letter.fromTitle}` : ''}`)
      .replace(/\{\{to\}\}/g, letter.to || '')
      .replace(/\{\{subject\}\}/g, letter.subject || '')
      .replace(/\{\{barangay\}\}/g, letter.barangay || 'Hinunangan Barangays')
      .replace(/\{\{municipality\}\}/g, letter.municipality || 'Hinunangan')
      .replace(/\{\{province\}\}/g, letter.province || 'Southern Leyte')
      .replace(/\{\{document_count\}\}/g, String(letter.documentCount || letter.documentList?.length || 1))
      .replace(/\{\{document_list\}\}/g, docListFormatted)
      .replace(/\{\{prepared_by\}\}/g, letter.preparedBy || '');

    return body;
  };

  // Trigger Print
  const handlePrint = () => {
    window.print();
  };

  // Trigger PDF Export / Print
  const handleExportPdf = () => {
    setIsExportingPdf(true);
    try {
      window.print();
      onNotice?.(`Transmittal Letter ${selectedLetter?.refNo} ready for PDF export & printing!`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleOpenCreate = () => {
    const year = new Date().getFullYear();
    const rand = Math.floor(100 + Math.random() * 900);
    const newDoc: TransmittalLetter = {
      id: 'transmittal-' + Date.now(),
      refNo: `TM-OMAS-${year}-${rand}`,
      date: new Date().toISOString().split('T')[0],
      from: currentUser?.name || 'Engr. Arnel M. Vasquez',
      fromTitle: 'Municipal Agriculturist',
      to: 'Provincial Veterinary Office (PVO)\nProvince of Southern Leyte\nCapitol Site, Asuncion, Maasin City',
      toTitle: 'Provincial Veterinarian',
      subject: 'TRANSMITTAL OF BARANGAY SWINE REGISTRY & ASF CLEARANCE CERTIFICATES',
      barangay: 'All 40 Barangays of Hinunangan',
      municipality: 'Hinunangan',
      province: 'Southern Leyte',
      documentCount: 1,
      documentList: [
        'Masterlist of Registered Swine Raisers with GPS Map',
        'Official Barangay Biosecurity Inspection Clearance Certificates',
      ],
      preparedBy: currentUser?.name || 'HON. VICENTE T. MADRONERO JR.',
      preparedByTitle: 'LGU Swine Registry Coordinator',
      verifiedBy: 'RANDY N. BURLAZA',
      verifiedByTitle: 'Barangay Biosecurity Officer (BBO)',
      approvedBy: 'ENGR. ARNEL M. VASQUEZ',
      approvedByTitle: 'Municipal Agriculturist',
      contentTemplate: `Respectfully transmitting herewith the attached official document sets from the Department of Agriculture - Office of the Municipal Agriculturist (DA-OMAS), Municipality of Hinunangan, Southern Leyte:

{{document_list}}

These documents confirm compliance with municipal biosecurity protocols and active swine surveillance across {{barangay}}, Municipality of {{municipality}}, {{province}}.

For your information, verification, and official file.`,
      status: 'submitted',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setEditingLetter(newDoc);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (letter: TransmittalLetter) => {
    setEditingLetter({ ...letter });
    setIsEditorOpen(true);
  };

  const handleSaveLetter = (letterToSave: TransmittalLetter) => {
    storageService.saveTransmittalLetter(letterToSave);
    refreshList();
    setSelectedLetter(letterToSave);
    setIsEditorOpen(false);
    onNotice?.(`Transmittal Letter ${letterToSave.refNo} saved successfully!`);
  };

  const handleDeleteLetter = (letter: TransmittalLetter) => {
    storageService.deleteTransmittalLetter(letter.id);
    const updated = storageService.getTransmittalLetters();
    setLetters(updated);
    if (selectedLetter?.id === letter.id) {
      setSelectedLetter(updated[0] || null);
    }
    setLetterToDelete(null);
    onNotice?.(`Transmittal Letter ${letter.refNo} deleted from records.`);
  };

  return (
    <div className="space-y-6">
      {/* Top Toolbar */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900">
              Transmittal Letters Management
            </h2>
            <p className="text-xs text-stone-500">
              Official memoranda transmitting swine masterlists, clearances, and biosecurity audits
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setViewMode(prev => (prev === 'preview' ? 'list' : 'preview'))}
            className="px-3.5 py-2 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            {viewMode === 'preview' ? (
              <>
                <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                <span>View Letters Table</span>
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 text-emerald-600" />
                <span>View Live Letter Preview</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Transmittal Letter</span>
          </button>

          {selectedLetter && (
            <>
              <button
                type="button"
                onClick={() => handleOpenEdit(selectedLetter)}
                className="px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Letter</span>
              </button>

              <button
                type="button"
                onClick={handleExportPdf}
                disabled={isExportingPdf}
                className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              >
                <FileText className="w-4 h-4" />
                <span>Download PDF</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === 'list' ? (
        /* Transmittal Letters Table View */
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search ref no, subject, to..."
                  className="pl-9 pr-3 py-1.5 bg-slate-50 border border-stone-300 rounded-xl text-xs font-semibold text-slate-800 w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="py-1.5 px-3 bg-white border border-stone-300 rounded-xl text-xs font-bold text-stone-700"
              >
                <option value="all">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="approved">Approved</option>
                <option value="transmitted">Transmitted</option>
              </select>
            </div>

            <span className="text-xs font-bold text-stone-500">
              {filteredLetters.length} Transmittal Record(s)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-stone-200 text-slate-600 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Ref No / Date</th>
                  <th className="py-2.5 px-3">Subject</th>
                  <th className="py-2.5 px-3">To (Recipient)</th>
                  <th className="py-2.5 px-3">Barangay Scope</th>
                  <th className="py-2.5 px-3 text-center">Docs</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredLetters.map(letter => (
                  <tr key={letter.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3">
                      <span className="font-mono font-bold text-blue-700 block">{letter.refNo}</span>
                      <span className="text-[10px] text-stone-400">{letter.date}</span>
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900 max-w-xs truncate">
                      {letter.subject}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-700 max-w-[200px] truncate">
                      {letter.to.split('\n')[0]}
                    </td>
                    <td className="py-3 px-3 text-stone-600">{letter.barangay || 'Hinunangan'}</td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-bold px-2 py-0.5 bg-blue-50 text-blue-800 rounded">
                        {letter.documentCount || letter.documentList?.length || 1}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`font-black text-[10px] px-2 py-0.5 rounded uppercase ${
                          letter.status === 'approved' || letter.status === 'transmitted'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {letter.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLetter(letter);
                            setViewMode('preview');
                          }}
                          className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition cursor-pointer font-bold"
                          title="View & Print Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(letter)}
                          className="p-1.5 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 transition cursor-pointer font-bold"
                          title="Edit Letter"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setLetterToDelete(letter)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition cursor-pointer font-bold"
                          title="Delete Letter"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Single Letter Preview Layout */
        <div className="space-y-4">
          {/* Quick letter switch selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-print">
            <span className="text-[11px] font-black text-slate-500 uppercase shrink-0">
              SELECT TRANSMITTAL:
            </span>
            {letters.map(l => (
              <button
                key={l.id}
                type="button"
                onClick={() => setSelectedLetter(l)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border shrink-0 ${
                  selectedLetter?.id === l.id
                    ? 'bg-blue-700 text-white border-blue-700 shadow-xs'
                    : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                }`}
              >
                <span>{l.refNo}</span>
              </button>
            ))}
          </div>

          {selectedLetter ? (
            <div
              ref={printRef}
              className="bg-white rounded-xl border border-stone-300 p-8 sm:p-12 space-y-6 shadow-sm font-serif max-w-[820px] mx-auto text-stone-900 print:shadow-none print:border-none print:p-0 print:m-0"
            >
              {/* Header */}
              <div className="text-center space-y-1 border-b border-stone-300 pb-4 font-sans">
                <div className="flex items-center justify-center gap-4 mb-2">
                  <SealDA className="w-14 h-14" />
                  <SealMunicipality className="w-14 h-14" />
                  <SealBagongPilipinas className="w-14 h-14" />
                </div>
                <p className="text-xs font-semibold text-stone-600 uppercase">
                  Republic of the Philippines • Province of Southern Leyte
                </p>
                <h2 className="text-sm font-black uppercase text-stone-900">
                  OFFICE OF THE MUNICIPAL AGRICULTURIST
                </h2>
                <p className="text-xs font-bold text-stone-700">Municipality of Hinunangan</p>
                <div className="pt-2">
                  <span className="inline-block px-3 py-0.5 rounded bg-slate-100 text-slate-800 text-[11px] font-black tracking-widest uppercase border border-slate-300">
                    OFFICIAL TRANSMITTAL MEMORANDUM
                  </span>
                </div>
              </div>

              {/* Memorandum Metadata Block */}
              <div className="space-y-3 font-sans text-xs border-b border-stone-200 pb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-bold text-stone-500 block">MEMORANDUM REF NO:</span>
                    <span className="font-mono font-bold text-blue-900 text-sm">
                      {selectedLetter.refNo}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-stone-500 block">DATE:</span>
                    <span className="font-bold text-stone-900">
                      {new Date(selectedLetter.date || new Date()).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <span className="font-bold text-stone-500 block">FOR / TO:</span>
                  <p className="font-black text-stone-900 whitespace-pre-line text-sm">
                    {selectedLetter.to}
                  </p>
                </div>

                <div>
                  <span className="font-bold text-stone-500 block">FROM:</span>
                  <p className="font-bold text-stone-900">
                    {selectedLetter.from}
                    <span className="font-normal text-stone-600 block">
                      {selectedLetter.fromTitle}
                    </span>
                  </p>
                </div>

                <div>
                  <span className="font-bold text-stone-500 block">SUBJECT:</span>
                  <p className="font-black text-stone-900 uppercase tracking-wide">
                    {selectedLetter.subject}
                  </p>
                </div>
              </div>

              {/* Body Content */}
              <div className="space-y-4 text-xs leading-relaxed text-justify font-sans">
                <div className="whitespace-pre-line">
                  {renderTransmittalBody(selectedLetter)}
                </div>

                {/* Document list box */}
                {selectedLetter.documentList && selectedLetter.documentList.length > 0 && (
                  <div className="bg-slate-50 border border-stone-200 rounded-xl p-4 my-3 font-sans">
                    <span className="font-black text-stone-800 uppercase block text-[11px] mb-2">
                      LIST OF ATTACHED DOCUMENTS ({selectedLetter.documentList.length} ITEMS):
                    </span>
                    <ul className="list-decimal list-inside space-y-1 text-xs font-semibold text-slate-800">
                      {selectedLetter.documentList.map((doc, idx) => (
                        <li key={idx}>{doc}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Signatures */}
              <div className="pt-8 grid grid-cols-2 sm:grid-cols-3 gap-6 text-center font-sans text-xs">
                <div>
                  <p className="text-stone-500 font-semibold mb-6">Prepared by:</p>
                  <div className="border-b border-black font-bold uppercase pb-1 mx-2">
                    {selectedLetter.preparedBy}
                  </div>
                  <p className="text-[10px] text-stone-600 font-semibold pt-0.5">
                    {selectedLetter.preparedByTitle}
                  </p>
                </div>

                {selectedLetter.verifiedBy && (
                  <div>
                    <p className="text-stone-500 font-semibold mb-6">Verified by:</p>
                    <div className="border-b border-black font-bold uppercase pb-1 mx-2">
                      {selectedLetter.verifiedBy}
                    </div>
                    <p className="text-[10px] text-stone-600 font-semibold pt-0.5">
                      {selectedLetter.verifiedByTitle}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-stone-500 font-semibold mb-6">Approved & Transmitted by:</p>
                  <div className="border-b border-black font-bold uppercase pb-1 mx-2">
                    {selectedLetter.approvedBy}
                  </div>
                  <p className="text-[10px] text-stone-600 font-semibold pt-0.5">
                    {selectedLetter.approvedByTitle}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-stone-200 p-8 space-y-3">
              <Send className="w-10 h-10 text-stone-300 mx-auto" />
              <p className="text-sm font-bold text-stone-700">No transmittal letters available</p>
              <button
                type="button"
                onClick={handleOpenCreate}
                className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl text-xs inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Transmittal</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Transmittal Modal */}
      {isEditorOpen && editingLetter && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white max-w-3xl w-full rounded-2xl p-6 shadow-2xl border border-stone-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-blue-700" />
                <h3 className="text-base font-black text-slate-900">
                  {editingLetter.id.startsWith('transmittal-') && !letters.some(l => l.id === editingLetter.id)
                    ? 'Create Transmittal Letter'
                    : 'Edit Transmittal Letter'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-800 hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                handleSaveLetter(editingLetter);
              }}
              className="space-y-4 text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Memorandum Ref No <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingLetter.refNo}
                    onChange={e => setEditingLetter({ ...editingLetter, refNo: e.target.value })}
                    className="w-full bg-slate-50 border border-stone-300 rounded-xl p-2.5 font-mono font-bold text-blue-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={editingLetter.date}
                    onChange={e => setEditingLetter({ ...editingLetter, date: e.target.value })}
                    className="w-full bg-slate-50 border border-stone-300 rounded-xl p-2.5 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Recipient (TO / FOR) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={editingLetter.to}
                  onChange={e => setEditingLetter({ ...editingLetter, to: e.target.value })}
                  placeholder="e.g. Provincial Veterinary Office (PVO), Province of Southern Leyte"
                  className="w-full bg-slate-50 border border-stone-300 rounded-xl p-2.5 font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Subject <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editingLetter.subject}
                  onChange={e => setEditingLetter({ ...editingLetter, subject: e.target.value })}
                  className="w-full bg-slate-50 border border-stone-300 rounded-xl p-2.5 font-black uppercase text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Barangay Scope</label>
                  <input
                    type="text"
                    value={editingLetter.barangay || ''}
                    onChange={e =>
                      setEditingLetter({ ...editingLetter, barangay: e.target.value })
                    }
                    placeholder="e.g. All 40 Barangays of Hinunangan"
                    className="w-full bg-slate-50 border border-stone-300 rounded-xl p-2.5 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={editingLetter.status}
                    onChange={e =>
                      setEditingLetter({
                        ...editingLetter,
                        status: e.target.value as TransmittalLetter['status'],
                      })
                    }
                    className="w-full bg-slate-50 border border-stone-300 rounded-xl p-2.5 font-bold"
                  >
                    <option value="draft">Draft</option>
                    <option value="submitted">Submitted</option>
                    <option value="approved">Approved</option>
                    <option value="transmitted">Transmitted</option>
                  </select>
                </div>
              </div>

              {/* Attached documents list */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Attached Documents (One per line)
                </label>
                <textarea
                  rows={3}
                  value={(editingLetter.documentList || []).join('\n')}
                  onChange={e => {
                    const lines = e.target.value.split('\n').filter(Boolean);
                    setEditingLetter({
                      ...editingLetter,
                      documentList: lines,
                      documentCount: lines.length,
                    });
                  }}
                  placeholder="e.g. Masterlist Registry of Swine Raisers&#10;Biosecurity Compliance Audits"
                  className="w-full bg-slate-50 border border-stone-300 rounded-xl p-2.5 font-medium text-slate-800"
                />
              </div>

              {/* Template Body with Placeholders */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Content Template & Placeholders</label>
                  <span className="text-[10px] text-stone-500">Supports dynamic placeholders</span>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-2">
                  {[
                    '{{transmittal_number}}',
                    '{{date}}',
                    '{{from}}',
                    '{{to}}',
                    '{{subject}}',
                    '{{barangay}}',
                    '{{municipality}}',
                    '{{province}}',
                    '{{document_count}}',
                    '{{document_list}}',
                    '{{prepared_by}}',
                  ].map(ph => (
                    <button
                      key={ph}
                      type="button"
                      onClick={() => {
                        setEditingLetter({
                          ...editingLetter,
                          contentTemplate: (editingLetter.contentTemplate || '') + ' ' + ph,
                        });
                      }}
                      className="px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-mono text-[10px] transition cursor-pointer"
                    >
                      + {ph}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={5}
                  value={editingLetter.contentTemplate || ''}
                  onChange={e =>
                    setEditingLetter({ ...editingLetter, contentTemplate: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-stone-300 rounded-xl p-2.5 font-mono text-xs text-slate-900"
                />
              </div>

              {/* Signatories */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-stone-200 space-y-3">
                <span className="font-black text-slate-800 uppercase block text-[11px]">
                  Signatories & Officials
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      Prepared by
                    </label>
                    <input
                      type="text"
                      value={editingLetter.preparedBy}
                      onChange={e =>
                        setEditingLetter({ ...editingLetter, preparedBy: e.target.value })
                      }
                      className="w-full bg-white border border-stone-300 rounded-lg p-2 font-bold"
                    />
                    <input
                      type="text"
                      value={editingLetter.preparedByTitle}
                      onChange={e =>
                        setEditingLetter({ ...editingLetter, preparedByTitle: e.target.value })
                      }
                      placeholder="Title"
                      className="w-full bg-white border border-stone-300 rounded-lg p-1.5 text-[10px] mt-1"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      Verified by (Optional)
                    </label>
                    <input
                      type="text"
                      value={editingLetter.verifiedBy || ''}
                      onChange={e =>
                        setEditingLetter({ ...editingLetter, verifiedBy: e.target.value })
                      }
                      className="w-full bg-white border border-stone-300 rounded-lg p-2 font-bold"
                    />
                    <input
                      type="text"
                      value={editingLetter.verifiedByTitle || ''}
                      onChange={e =>
                        setEditingLetter({ ...editingLetter, verifiedByTitle: e.target.value })
                      }
                      placeholder="Title"
                      className="w-full bg-white border border-stone-300 rounded-lg p-1.5 text-[10px] mt-1"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      Approved by
                    </label>
                    <input
                      type="text"
                      value={editingLetter.approvedBy}
                      onChange={e =>
                        setEditingLetter({ ...editingLetter, approvedBy: e.target.value })
                      }
                      className="w-full bg-white border border-stone-300 rounded-lg p-2 font-bold"
                    />
                    <input
                      type="text"
                      value={editingLetter.approvedByTitle}
                      onChange={e =>
                        setEditingLetter({ ...editingLetter, approvedByTitle: e.target.value })
                      }
                      placeholder="Title"
                      className="w-full bg-white border border-stone-300 rounded-lg p-1.5 text-[10px] mt-1"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 hover:bg-stone-100 font-bold text-stone-700 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-black transition cursor-pointer shadow-sm"
                >
                  Save Transmittal Letter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {letterToDelete && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-base font-black text-slate-900">
                Delete Transmittal Letter?
              </h3>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Are you sure you want to delete transmittal letter{' '}
              <strong className="text-slate-900 font-mono">{letterToDelete.refNo}</strong> (
              {letterToDelete.subject})? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setLetterToDelete(null)}
                className="px-4 py-2 rounded-xl border border-stone-300 hover:bg-stone-100 font-bold text-stone-700 text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteLetter(letterToDelete)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs transition cursor-pointer shadow-sm"
              >
                Delete Transmittal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

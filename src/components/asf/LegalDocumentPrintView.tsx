import React from 'react';
import { ASFRegulatoryDocument } from '../../types';
import { Printer, ArrowLeft, Building, Scale, ShieldCheck } from 'lucide-react';

interface LegalDocumentPrintViewProps {
  document: ASFRegulatoryDocument;
  onClose: () => void;
}

export const LegalDocumentPrintView: React.FC<LegalDocumentPrintViewProps> = ({
  document: doc,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/80 backdrop-blur-xs flex flex-col items-center justify-start overflow-y-auto p-4 sm:p-8">
      {/* Action Header Bar (Hidden during actual print) */}
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg border border-stone-200 p-4 mb-4 flex items-center justify-between print:hidden">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-xl transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Document Viewer
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs text-stone-500 font-medium hidden sm:inline">
            Official PDF / Paper Format Ready
          </span>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-sm transition"
          >
            <Printer className="w-4 h-4" /> Print Document (Ctrl+P)
          </button>
        </div>
      </div>

      {/* Printable Sheet */}
      <div className="w-full max-w-4xl bg-white text-stone-900 p-8 sm:p-14 shadow-2xl rounded-2xl print:shadow-none print:p-0 print:m-0 print:max-w-none print:w-full font-serif leading-relaxed">
        {/* Official Letterhead Header */}
        <div className="text-center border-b-2 border-stone-800 pb-6 mb-8">
          <p className="text-xs tracking-widest uppercase text-stone-600 font-sans font-semibold">
            Republic of the Philippines
          </p>
          <p className="text-xs tracking-wider uppercase text-stone-700 font-sans font-semibold">
            Province of Southern Leyte
          </p>
          <h2 className="text-base sm:text-lg font-bold uppercase tracking-wider text-stone-900 font-sans mt-0.5">
            Municipality of Hinunangan
          </h2>
          <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-900 font-sans mt-1">
            {doc.issuingAuthority}
          </h3>

          <div className="mt-5 inline-block px-4 py-1.5 border border-stone-800 font-sans font-bold text-sm tracking-wide uppercase">
            {doc.officialNumber}
          </div>
          <p className="text-xs font-sans text-stone-500 mt-1">{doc.seriesYear}</p>
        </div>

        {/* Title */}
        <div className="text-center mb-8 px-4">
          <h1 className="text-sm sm:text-base font-bold uppercase tracking-wide leading-snug">
            {doc.title}
          </h1>
          {doc.author && (
            <p className="text-xs font-sans font-semibold text-stone-700 mt-2">
              Authored by: <span className="underline">{doc.author}</span>
            </p>
          )}
          {doc.sessionInfo && (
            <p className="text-xs font-sans text-stone-500 italic mt-0.5">
              Enacted during the {doc.sessionInfo}
            </p>
          )}
        </div>

        {/* Legal Preamble & Basis */}
        {doc.legalBasis && doc.legalBasis.length > 0 && (
          <div className="mb-8 font-sans text-xs bg-stone-50 p-4 rounded-lg border border-stone-200">
            <h4 className="font-bold text-stone-900 uppercase tracking-wider mb-2">
              Statutory Basis & Preamble:
            </h4>
            <ul className="list-disc list-inside space-y-1 text-stone-700 leading-relaxed">
              {doc.legalBasis.map((basis, idx) => (
                <li key={idx}>{basis}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Articles & Sections */}
        {doc.articles && doc.articles.length > 0 ? (
          <div className="space-y-6 mb-8 text-xs sm:text-sm">
            {doc.articles.map(article => (
              <div key={article.id} className="space-y-3">
                <div className="text-center my-4">
                  <h3 className="font-bold uppercase tracking-wider font-sans text-emerald-950">
                    {article.articleNumber}
                  </h3>
                  <h4 className="font-bold uppercase tracking-wider text-xs font-sans text-stone-700">
                    {article.articleTitle}
                  </h4>
                </div>

                <div className="space-y-4">
                  {article.sections.map(sec => (
                    <div key={sec.id} className="text-justify leading-relaxed">
                      <strong className="font-bold font-sans text-stone-900 mr-1.5">
                        {sec.sectionNumber}. {sec.sectionTitle} –
                      </strong>
                      <span className="text-stone-800">{sec.content}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Fallback to Key Articles if structured articles not loaded */
          <div className="space-y-4 mb-8 text-xs sm:text-sm">
            {doc.keyArticles.map((art, idx) => (
              <div key={idx} className="text-justify leading-relaxed">
                <strong className="font-bold font-sans text-stone-900 mr-1.5">
                  {art.number}. {art.heading} –
                </strong>
                <span className="text-stone-800">{art.text}</span>
              </div>
            ))}
          </div>
        )}

        {/* Locational Standards Summary Table */}
        {doc.locationalStandards && doc.locationalStandards.length > 0 && (
          <div className="my-8 font-sans">
            <h4 className="font-bold text-xs uppercase tracking-wider text-stone-900 mb-2 text-center">
              Schedule of Locational Design Standards & Distances
            </h4>
            <table className="w-full text-left text-[10px] border border-stone-300">
              <thead className="bg-stone-100 font-bold border-b border-stone-300">
                <tr>
                  <th className="p-2 border-r border-stone-300">Category</th>
                  <th className="p-2 border-r border-stone-300">Class</th>
                  <th className="p-2 border-r border-stone-300">Heads</th>
                  <th className="p-2 border-r border-stone-300">Groundwater</th>
                  <th className="p-2 border-r border-stone-300">Built-up</th>
                  <th className="p-2">Major Roads</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {doc.locationalStandards.map((item, idx) => (
                  <tr key={idx}>
                    <td className="p-2 border-r border-stone-200 capitalize font-medium">{item.category}</td>
                    <td className="p-2 border-r border-stone-200 font-bold">{item.classification}</td>
                    <td className="p-2 border-r border-stone-200">{item.headsRange}</td>
                    <td className="p-2 border-r border-stone-200">{item.distanceGroundwater}m</td>
                    <td className="p-2 border-r border-stone-200">{item.distanceBuiltUp}</td>
                    <td className="p-2">{item.distanceMajorRoads}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Penalties Summary */}
        {doc.penalties && doc.penalties.length > 0 && (
          <div className="my-6 font-sans text-xs bg-stone-50 p-4 rounded border border-stone-300">
            <h4 className="font-bold text-stone-900 uppercase tracking-wider mb-2">
              Penal Provisions & Sanctions:
            </h4>
            <div className="space-y-2">
              {doc.penalties.map((pen, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="font-bold text-stone-900 min-w-32">{pen.offenseTier}:</span>
                  <span className="text-stone-800">
                    {pen.finePhp > 0 ? `₱${pen.finePhp.toLocaleString()} fine. ` : ''}
                    {pen.punitiveActions}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Official Enactment & Signatories Block */}
        <div className="mt-12 pt-8 border-t border-stone-300 font-sans grid grid-cols-2 gap-8 text-xs">
          <div>
            <p className="text-stone-500 mb-8">Attested and Certified Correct:</p>
            <p className="font-bold text-stone-900 uppercase text-sm">{doc.signatory}</p>
            <p className="text-stone-600">{doc.signatoryTitle}</p>
            <p className="text-stone-400 text-[10px] mt-1">Date: {doc.dateEnacted || doc.effectiveDate}</p>
          </div>

          <div className="text-right">
            <p className="text-stone-500 mb-8">Official Record System:</p>
            <p className="font-bold text-emerald-900 uppercase text-sm">OMAS Hinunangan</p>
            <p className="text-stone-600">Swine & Livestock Registry System</p>
            <p className="text-stone-400 text-[10px] mt-1">Status: {doc.status?.toUpperCase() || 'ACTIVE'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import {
  SealBagongPilipinas,
  SealBarangay,
  SealDA,
  SealMunicipality,
  SealProvince,
} from '../common/OfficialSeals';
import {
  CertificateDynamicSignatory,
  CertificateLogoItem,
  CertificateTemplate,
} from '../../types';
import { replaceTemplatePlaceholders, TemplateDataContext } from '../../utils/templateReplacer';

interface DynamicCertificateViewProps {
  template: CertificateTemplate;
  data: TemplateDataContext;
  containerRef?: React.RefObject<HTMLDivElement>;
  isPrintMode?: boolean;
}

// Helper to render a specific logo item
const RenderLogoItem: React.FC<{ logo: CertificateLogoItem; defaultBarangay?: string }> = ({
  logo,
  defaultBarangay,
}) => {
  if (!logo.visible) return null;

  const width = logo.widthPx || 70;
  const height = logo.heightPx || 70;

  if (logo.type === 'barangay') {
    return (
      <div style={{ width: `${width}px`, height: `${height}px` }} className="flex items-center justify-center shrink-0">
        <SealBarangay
          barangayName={logo.barangayName || defaultBarangay || 'Nava'}
          className="w-full h-full object-contain"
          customUrl={logo.customUrl}
        />
      </div>
    );
  }
  if (logo.type === 'municipality') {
    return (
      <div style={{ width: `${width}px`, height: `${height}px` }} className="flex items-center justify-center shrink-0">
        <SealMunicipality
          className="w-full h-full object-contain"
          customUrl={logo.customUrl}
        />
      </div>
    );
  }
  if (logo.type === 'province') {
    return (
      <div style={{ width: `${width}px`, height: `${height}px` }} className="flex items-center justify-center shrink-0">
        <SealProvince
          className="w-full h-full object-contain"
          customUrl={logo.customUrl}
        />
      </div>
    );
  }
  if (logo.type === 'da') {
    return (
      <div style={{ width: `${width}px`, height: `${height}px` }} className="flex items-center justify-center shrink-0">
        <SealDA
          className="w-full h-full object-contain"
          customUrl={logo.customUrl}
        />
      </div>
    );
  }
  if (logo.type === 'bagong_pilipinas') {
    return (
      <div style={{ width: `${width}px`, height: `${height}px` }} className="flex items-center justify-center shrink-0">
        <SealBagongPilipinas
          className="w-full h-full object-contain"
          customUrl={logo.customUrl}
        />
      </div>
    );
  }
  if (logo.type === 'custom' && logo.customUrl) {
    return (
      <div style={{ width: `${width}px`, height: `${height}px` }} className="flex items-center justify-center shrink-0">
        <img
          src={logo.customUrl}
          alt="Official Seal"
          className="w-full h-full object-contain rounded-full shadow-2xs"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }
  return null;
};

// Component for rendering an individual signatory with a clear horizontal signature line
export const RenderSignatoryBlock: React.FC<{
  sig: CertificateDynamicSignatory;
  fullContext: TemplateDataContext;
}> = ({ sig, fullContext }) => {
  const showLine = sig.showSignatureLine !== false;
  const alignment = sig.lineAlignment || sig.alignment || 'center';
  const rawLineWidth = sig.lineWidth || '220px';
  const lineWidth = rawLineWidth.endsWith('%') || rawLineWidth.endsWith('px') ? rawLineWidth : `${rawLineWidth}px`;
  const signatureWidth = sig.signatureWidth || '130px';

  const alignClass =
    alignment === 'left'
      ? 'text-left items-start'
      : alignment === 'right'
      ? 'text-right items-end'
      : 'text-center items-center';

  const lineAlignClass =
    alignment === 'left'
      ? 'mr-auto'
      : alignment === 'right'
      ? 'ml-auto'
      : 'mx-auto';

  const prefixText = sig.prefix || (sig.section === 'noted_by' ? 'Noted by:' : sig.section === 'certified_by' ? 'Certified by:' : sig.details);

  return (
    <div className={`flex flex-col ${alignClass} font-sans min-w-[160px] select-text`}>
      {/* Optional Signatory Prefix (e.g. "Noted by:", "Certified by:", "Approved by:", "CONFORME:") */}
      {prefixText && (
        <p className="text-xs font-bold text-stone-700 mb-1 pb-1">
          {replaceTemplatePlaceholders(prefixText, fullContext)}
        </p>
      )}

      {/* Signature & Line Container */}
      <div className={`flex flex-col justify-end w-full relative ${alignClass}`} style={{ minHeight: '52px' }}>
        {/* Uploaded Digital Signature Image */}
        {sig.showSignatureImage && sig.signatureImageUrl ? (
          <div className={`flex items-center justify-center mb-[-14px] z-10 pointer-events-none ${lineAlignClass}`}>
            <img
              src={sig.signatureImageUrl}
              alt="Digital Signature"
              className="h-14 object-contain"
              style={{ maxWidth: signatureWidth }}
            />
          </div>
        ) : (
          <div className="h-6" />
        )}

        {/* Clear Horizontal Signature Line directly ABOVE printed name */}
        {showLine && (
          <div
            className={`border-b-2 border-stone-900 ${lineAlignClass} my-0.5`}
            style={{
              width: lineWidth,
              maxWidth: '100%',
            }}
          />
        )}
      </div>

      {/* Printed Full Name */}
      <p className="font-black text-xs sm:text-sm text-stone-950 uppercase tracking-wide pt-1 leading-tight">
        {replaceTemplatePlaceholders(sig.name, fullContext)}
      </p>

      {/* Position / Designation */}
      <p className="text-[11px] sm:text-xs font-semibold text-stone-700 uppercase leading-normal">
        {replaceTemplatePlaceholders(sig.position, fullContext)}
      </p>
    </div>
  );
};

export const DynamicCertificateView: React.FC<DynamicCertificateViewProps> = ({
  template,
  data,
  containerRef,
}) => {
  const rawBrgy = data.barangay || template.barangay || 'Nava';
  const brgyDisplay = rawBrgy.toUpperCase();

  // Separate and sort logos by position
  const visibleLogos = (template.logos || []).filter(l => l.visible);
  const leftLogos = visibleLogos.filter(l => l.position === 'left').sort((a, b) => a.order - b.order);
  const centerLogos = visibleLogos.filter(l => l.position === 'center').sort((a, b) => a.order - b.order);
  const rightLogos = visibleLogos.filter(l => l.position === 'right').sort((a, b) => a.order - b.order);

  // Parse rendered body text with replaced placeholders
  const fullContext: TemplateDataContext = {
    ...data,
    barangay: rawBrgy,
    municipality: data.municipality || 'Hinunangan',
    province: data.province || 'Southern Leyte',
  };
  const renderedBodyText = replaceTemplatePlaceholders(template.bodyTemplate || '', fullContext);

  // Split into paragraphs
  const bodyParagraphs = renderedBodyText
    .split('\n\n')
    .map(p => p.trim())
    .filter(Boolean);

  // Watermark sizing
  const watermarkSizeClass =
    template.watermark?.size === 'small'
      ? 'w-[280px] h-[280px]'
      : template.watermark?.size === 'large'
      ? 'w-[480px] h-[480px]'
      : 'w-[380px] h-[380px]';

  // Sort all signatories by order
  const signatories = (template.signatories || []).slice().sort((a, b) => a.order - b.order);

  // Header border styling
  const headerBorderClass =
    template.header.borderStyle === 'double'
      ? 'border-b-4 border-double border-stone-800'
      : template.header.borderStyle === 'green_line'
      ? 'border-b-2 border-emerald-700'
      : template.header.borderStyle === 'none'
      ? ''
      : 'border-b border-stone-300';

  // Dynamic grid setup for signatories based on count
  const renderSignatoriesGrid = () => {
    if (signatories.length === 0) return null;

    if (signatories.length === 1) {
      return (
        <div className="flex flex-wrap items-end justify-between gap-8 pt-8 font-sans">
          {/* Official Dry Seal placeholder on Left */}
          <div className="w-24 h-24 rounded-full border-2 border-dashed border-stone-300 flex items-center justify-center text-center p-2 text-[10px] text-stone-400 font-bold uppercase select-none">
            Official Dry Seal
          </div>
          <div className="ml-auto">
            <RenderSignatoryBlock sig={signatories[0]} fullContext={fullContext} />
          </div>
        </div>
      );
    }

    if (signatories.length === 2) {
      return (
        <div className="grid grid-cols-2 gap-8 sm:gap-12 pt-8 font-sans items-end">
          {signatories.map(sig => (
            <RenderSignatoryBlock key={sig.id} sig={sig} fullContext={fullContext} />
          ))}
        </div>
      );
    }

    if (signatories.length === 3) {
      return (
        <div className="grid grid-cols-3 gap-4 sm:gap-6 pt-8 font-sans items-end">
          {signatories.map(sig => (
            <RenderSignatoryBlock key={sig.id} sig={sig} fullContext={fullContext} />
          ))}
        </div>
      );
    }

    if (signatories.length === 4) {
      return (
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:gap-x-12 pt-6 font-sans items-end">
          {signatories.map(sig => (
            <RenderSignatoryBlock key={sig.id} sig={sig} fullContext={fullContext} />
          ))}
        </div>
      );
    }

    // 5+ signatories: Multi-row grid, auto-wrapping
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-10 pt-6 font-sans items-end">
        {signatories.map(sig => (
          <RenderSignatoryBlock key={sig.id} sig={sig} fullContext={fullContext} />
        ))}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      id="printable-certificate-root"
      className="printable-certificate-container bg-white text-stone-900 border border-stone-300 shadow-xl rounded-xl max-w-[820px] mx-auto p-8 sm:p-12 relative overflow-hidden font-serif select-text transition-all"
      style={{
        minHeight: '1050px',
        backgroundColor: '#ffffff',
        color: '#000000',
      }}
    >
      {/* Background Watermark */}
      {template.watermark && template.watermark.enabled && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0"
          style={{
            opacity: template.watermark.opacity || 0.12,
            filter: template.watermark.grayscale ? 'grayscale(100%)' : 'none',
          }}
        >
          {template.watermark.type === 'da' ? (
            <SealDA className={`${watermarkSizeClass} max-w-[80vw]`} customUrl={template.watermark.customUrl} />
          ) : template.watermark.type === 'barangay' ? (
            <SealBarangay
              barangayName={template.watermark.barangayName || rawBrgy}
              className={`${watermarkSizeClass} max-w-[80vw]`}
              customUrl={template.watermark.customUrl}
            />
          ) : template.watermark.type === 'province' ? (
            <SealProvince
              className={`${watermarkSizeClass} max-w-[80vw]`}
              customUrl={template.watermark.customUrl}
            />
          ) : template.watermark.type === 'custom' && template.watermark.customUrl ? (
            <img
              src={template.watermark.customUrl}
              alt="Watermark"
              className={`${watermarkSizeClass} object-contain rounded-full`}
              referrerPolicy="no-referrer"
            />
          ) : (
            <SealMunicipality
              className={`${watermarkSizeClass} max-w-[80vw]`}
              customUrl={template.watermark.customUrl}
            />
          )}
        </div>
      )}

      {/* Main Document Content Canvas */}
      <div className="relative z-10 space-y-6">
        {/* ========================================================================= */}
        {/* 1. HEADER SECTION (Dynamic Left, Center, Right Logos) */}
        {/* ========================================================================= */}
        <div className={`pb-4 ${headerBorderClass}`}>
          <div className="flex items-center justify-between gap-4">
            {/* Left Logos Column */}
            <div className="flex-1 flex items-center justify-start gap-2 min-w-[70px]">
              {leftLogos.map(logo => (
                <RenderLogoItem key={logo.id} logo={logo} defaultBarangay={rawBrgy} />
              ))}
            </div>

            {/* Center column: Header details & Center Logos */}
            <div className="flex-[3] text-center space-y-0.5">
              {centerLogos.length > 0 && (
                <div className="flex items-center justify-center gap-2 mb-2">
                  {centerLogos.map(logo => (
                    <RenderLogoItem key={logo.id} logo={logo} defaultBarangay={rawBrgy} />
                  ))}
                </div>
              )}
              <p className="text-[11px] font-semibold text-stone-700 tracking-wider">
                {template.header.countryText || 'Republic of the Philippines'}
              </p>
              <p className="text-xs font-bold text-stone-800">
                {template.header.provinceText || 'Province of Southern Leyte'}
              </p>
              <p className="text-xs font-black uppercase text-stone-900 tracking-wide">
                {template.header.municipalityText || 'MUNICIPALITY OF HINUNANGAN'}
              </p>
              <p className="text-sm font-black uppercase text-blue-900 tracking-wider">
                {template.header.barangayText || `BARANGAY ${brgyDisplay}`}
              </p>
              {template.header.officeTitle && (
                <p className="text-xs font-extrabold uppercase text-stone-800 pt-0.5">
                  {template.header.officeTitle}
                </p>
              )}
              {(template.header.contactEmail || template.header.contactPhone) && (
                <p className="text-[10px] text-stone-500 font-sans">
                  {[template.header.contactEmail, template.header.contactPhone].filter(Boolean).join(' • ')}
                </p>
              )}
              {template.header.mottoOrSubtitle && (
                <p className="text-[10px] italic text-stone-600 font-serif">
                  "{template.header.mottoOrSubtitle}"
                </p>
              )}
            </div>

            {/* Right Logos Column */}
            <div className="flex-1 flex items-center justify-end gap-2 min-w-[70px]">
              {rightLogos.map(logo => (
                <RenderLogoItem key={logo.id} logo={logo} defaultBarangay={rawBrgy} />
              ))}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. DOCUMENT TITLE (Gothic / Serif Underline / Serif Box / Sans) */}
        {/* ========================================================================= */}
        <div className="text-center pt-2 pb-1">
          {template.titleFont === 'gothic' ? (
            <h1
              className="text-2xl sm:text-3xl font-normal text-stone-900 tracking-wide"
              style={{ fontFamily: "'UnifrakturMaguntia', 'Cinzel', serif" }}
            >
              {template.documentTitle || 'Barangay Certification'}
            </h1>
          ) : template.titleFont === 'serif_underline' ? (
            <h1 className="text-xl sm:text-2xl font-black text-stone-900 uppercase tracking-wider underline decoration-2 underline-offset-4">
              {template.documentTitle || 'BARANGAY CERTIFICATION'}
            </h1>
          ) : template.titleFont === 'serif_bold' ? (
            <div className="inline-block border-2 border-stone-900 px-6 py-1.5 shadow-2xs">
              <h1 className="text-base sm:text-lg font-black text-stone-900 uppercase tracking-widest">
                {template.documentTitle || 'BARANGAY CERTIFICATION'}
              </h1>
            </div>
          ) : (
            <h1 className="text-xl sm:text-2xl font-black text-stone-900 font-sans uppercase tracking-wider">
              {template.documentTitle || 'BARANGAY CERTIFICATION'}
            </h1>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 3. CERTIFICATE BODY (Dynamic Placeholder Replacement) */}
        {/* ========================================================================= */}
        <div className="space-y-4 text-xs sm:text-sm leading-relaxed text-stone-900 font-serif text-justify pt-2 select-text">
          {bodyParagraphs.map((para, index) => {
            if (
              para.toUpperCase() === 'TO WHOM IT MAY CONCERN:' ||
              para.toUpperCase() === 'KINI NAGPAMATUOD NGA:' ||
              para.toUpperCase().startsWith('TO ALL CONCERNED')
            ) {
              return (
                <p key={index} className="font-bold tracking-wide text-xs sm:text-sm not-italic pt-1">
                  {para}
                </p>
              );
            }

            return (
              <p key={index} className="indent-8">
                {para}
              </p>
            );
          })}

          {template.noteText && (
            <p className="italic text-xs text-stone-600 font-sans pt-2">
              {template.noteText}
            </p>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 4. DYNAMIC SIGNATORIES SECTION (ALL SIGNATORIES RENDERED & VISIBLE) */}
        {/* ========================================================================= */}
        <div className="pt-8 px-2 sm:px-6">
          {renderSignatoriesGrid()}
        </div>

        {/* ========================================================================= */}
        {/* 5. OFFICIAL RECEIPT & FOOTER */}
        {/* ========================================================================= */}
        {template.receipt?.showReceiptBox && (
          <div className="pt-8 border-t border-stone-200 flex flex-wrap items-end justify-between gap-4 font-sans text-xs">
            <div className="space-y-1 text-stone-800">
              {template.receipt.formatStyle === 'nava' ? (
                <>
                  <p className="font-bold">
                    Official Receipt Paid:{' '}
                    <span className="font-mono">{data.or_number || template.receipt.orNumber || '1675127'}</span> / ₱
                    {data.amount_paid || template.receipt.amountPaid || '100.00'}
                  </p>
                  <p className="font-bold uppercase">
                    Issued on: {data.date_issued || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                  <p className="font-bold">
                    Issued at: {data.issued_at || `Barangay ${rawBrgy}, Hinunangan, Southern Leyte`}
                  </p>
                </>
              ) : (
                <>
                  <p className="font-bold">
                    O. R. # : <span className="font-mono">{data.or_number || template.receipt.orNumber || '4278912'}</span>
                  </p>
                  <p className="font-bold">
                    Issued On : {data.date_issued || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                  <p className="font-bold">
                    Issued At : {data.issued_at || `Bgy. ${rawBrgy}, Hinunangan, So. Leyte.`}
                  </p>
                </>
              )}
            </div>

            <div className="text-[10px] text-stone-400 font-mono text-right">
              <span>Doc Ref: {data.certificateNo || `HN-CERT-${Date.now().toString().slice(-6)}`}</span>
              <br />
              <span>LGU Hinunangan • DA Swine Registry System</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

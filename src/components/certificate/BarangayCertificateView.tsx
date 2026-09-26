import React from 'react';
import {
  DynamicSeal,
  SealBagongPilipinas,
  SealBarangay,
  SealDA,
  SealMunicipality,
  SealProvince,
} from '../common/OfficialSeals';
import { CertificateLogoSettings } from './CertificateLogoCustomizer';
import { CertificateTemplate, IssuedCertificate } from '../../types';
import { DynamicCertificateView } from './DynamicCertificateView';
import { storageService } from '../../services/storageService';

export type CertificateTemplateStyle =
  | 'nava'
  | 'nueva_esperanza'
  | 'tuburan'
  | 'da_veterinary';

export interface CertificateData {
  certificateNo?: string;
  templateId?: string;
  templateStyle: CertificateTemplateStyle;
  barangay: string;
  farmerName: string;
  associationName?: string;
  farmerAgeCivilStatus?: string;
  buyerName: string;
  buyerEntity?: string;
  destination: string;
  numberOfHeads: number;
  swineAge?: string;
  femaleCount?: number | string;
  maleCount?: number | string;
  colorDescription?: string;
  priceDescription?: string;
  orNumber: string;
  amountPaid: string | number;
  issueDate: string;
  issuedAt?: string;
  punongBarangay: string;
  punongBarangayTitle?: string;
  bboName: string;
  bboTitle?: string;
  attestedByName?: string;
  attestedByTitle?: string;
  customBody?: string;
}

export interface BarangayCertificateViewProps {
  data: CertificateData;
  logoSettings?: CertificateLogoSettings;
  template?: CertificateTemplate;
  containerRef?: React.RefObject<HTMLDivElement>;
  isPrintMode?: boolean;
}

// Helper to format day with ordinal suffix (e.g. 11th, 12th, 1st, 2nd, 3rd)
function getOrdinalSuffix(day: number): string {
  if (day > 3 && day < 21) return `${day}th`;
  switch (day % 10) {
    case 1:
      return `${day}st`;
    case 2:
      return `${day}nd`;
    case 3:
      return `${day}rd`;
    default:
      return `${day}th`;
  }
}

export const BarangayCertificateView: React.FC<BarangayCertificateViewProps> = ({
  data,
  logoSettings,
  template,
  containerRef,
  isPrintMode,
}) => {
  // If dynamic template is passed or fetched, render through the dynamic template renderer
  if (template) {
    const context = {
      certificateNo: data.certificateNo,
      resident_name: data.farmerName,
      farmer_name: data.farmerName,
      barangay: data.barangay,
      association_name: data.associationName,
      farmer_age_civil_status: data.farmerAgeCivilStatus,
      buyer_name: data.buyerName,
      destination: data.destination,
      number_of_pigs: data.numberOfHeads,
      heads: data.numberOfHeads,
      swine_age: data.swineAge,
      female_count: data.femaleCount,
      male_count: data.maleCount,
      color_description: data.colorDescription,
      price_per_kilo: data.priceDescription,
      or_number: data.orNumber,
      amount_paid: data.amountPaid,
      date_issued: data.issueDate,
      issued_at: data.issuedAt,
    };
    return (
      <DynamicCertificateView
        template={template}
        data={context}
        containerRef={containerRef}
        isPrintMode={isPrintMode}
      />
    );
  }

  const parseDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return { day: '11th', month: 'September', year: '2026', full: dateStr };
      const day = d.getDate();
      const month = d.toLocaleDateString('en-US', { month: 'long' });
      const year = d.getFullYear();
      return {
        day: getOrdinalSuffix(day),
        rawDay: day,
        month,
        year,
        full: `${month} ${day}, ${year}`,
      };
    } catch {
      return { day: '11th', month: 'September', year: '2026', full: dateStr };
    }
  };

  const dateObj = parseDate(data.issueDate);
  const brgyDisplay = (data.barangay || 'NAVA').toUpperCase();
  const rawBrgy = data.barangay || 'Nava';
  const effectiveLogoSettings = logoSettings || {
    leftLogoType: 'barangay',
    leftBarangayName: rawBrgy,
    centerLogoType: 'municipality',
    rightLogoType: 'bagong_pilipinas',
    showWatermark: true,
    watermarkType: 'municipality',
    watermarkOpacity: 0.12,
  };

  return (
    <div
      ref={containerRef}
      className="printable-certificate-container bg-white text-stone-900 border border-stone-300 shadow-xl rounded-xl max-w-[820px] mx-auto p-8 sm:p-12 relative overflow-hidden font-serif select-text"
      style={{
        minHeight: '1050px',
        backgroundColor: '#ffffff',
        color: '#000000',
      }}
    >
      {/* Background Watermark */}
      {effectiveLogoSettings.showWatermark && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0"
          style={{ opacity: effectiveLogoSettings.watermarkOpacity }}
        >
          {effectiveLogoSettings.watermarkType === 'da' ? (
            <SealDA className="w-[420px] h-[420px] max-w-[80vw]" customUrl={effectiveLogoSettings.watermarkUrl} />
          ) : effectiveLogoSettings.watermarkType === 'barangay' ? (
            <SealBarangay
              barangayName={effectiveLogoSettings.leftBarangayName || data.barangay}
              className="w-[420px] h-[420px] max-w-[80vw]"
              customUrl={effectiveLogoSettings.watermarkUrl}
            />
          ) : (
            <SealMunicipality
              className="w-[440px] h-[440px] max-w-[80vw]"
              customUrl={effectiveLogoSettings.watermarkUrl}
            />
          )}
        </div>
      )}

      {/* Content Canvas */}
      <div className="relative z-10 space-y-6">
        {/* ========================================================================= */}
        {/* HEADER SECTION (3 Styles: 3-Logos, 2-Logos, 1-Logo) */}
        {/* ========================================================================= */}
        <div className="border-b border-stone-200 pb-4">
          <div className="flex items-center justify-between gap-2">
            {/* Left Seal */}
            <div className="w-20 sm:w-24 shrink-0 flex items-center justify-center">
              {logoSettings.leftLogoType === 'barangay' && (
                <SealBarangay
                  barangayName={logoSettings.leftBarangayName || data.barangay}
                  className="w-16 h-16 sm:w-20 sm:h-20"
                  customUrl={logoSettings.leftLogoUrl}
                />
              )}
              {logoSettings.leftLogoType === 'da' && (
                <SealDA className="w-16 h-16 sm:w-20 sm:h-20" customUrl={logoSettings.leftLogoUrl} />
              )}
              {logoSettings.leftLogoType === 'municipality' && (
                <SealMunicipality
                  className="w-16 h-16 sm:w-20 sm:h-20"
                  customUrl={logoSettings.leftLogoUrl}
                />
              )}
              {logoSettings.leftLogoType === 'custom' && logoSettings.leftLogoUrl && (
                <img
                  src={logoSettings.leftLogoUrl}
                  alt="Left Logo"
                  className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-full"
                  referrerPolicy="no-referrer"
                />
              )}
            </div>

            {/* Center Official Text */}
            <div className="flex-1 text-center space-y-0.5">
              <p className="text-xs sm:text-[13px] tracking-wide text-stone-800 font-sans font-medium">
                Republic of the Philippines
              </p>
              <p className="text-xs sm:text-[13px] font-bold tracking-wide uppercase text-stone-900 font-sans">
                PROVINCE OF SOUTHERN LEYTE
              </p>
              <p className="text-xs sm:text-[13px] tracking-wide text-stone-800 font-sans font-medium">
                Municipality of Hinunangan
              </p>
              <h2 className="text-sm sm:text-base font-black tracking-wider uppercase text-stone-950 font-sans pt-0.5">
                BARANGAY {brgyDisplay}
              </h2>

              {/* Contact details or motto */}
              {(logoSettings.barangayEmail || logoSettings.barangayPhone) && (
                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-stone-700 font-sans pt-1">
                  {logoSettings.barangayEmail && (
                    <span className="flex items-center gap-1 font-semibold">
                      📧 {logoSettings.barangayEmail}
                    </span>
                  )}
                  {logoSettings.barangayPhone && (
                    <span className="flex items-center gap-1 font-semibold">
                      📞 {logoSettings.barangayPhone}
                    </span>
                  )}
                </div>
              )}

              {logoSettings.headerMotto && (
                <p className="text-[11px] italic font-semibold text-stone-700 whitespace-pre-line pt-0.5">
                  {logoSettings.headerMotto}
                </p>
              )}
            </div>

            {/* Right Seal & Center/BP Seal Cluster */}
            <div className="w-20 sm:w-24 shrink-0 flex items-center justify-end gap-1.5">
              {/* Optional Center Logo placed next to right logo if style is Nava 3-seal */}
              {logoSettings.centerLogoType === 'municipality' && (
                <SealMunicipality
                  className="w-14 h-14 sm:w-16 sm:h-16"
                  customUrl={logoSettings.centerLogoUrl}
                />
              )}
              {logoSettings.centerLogoType === 'da' && (
                <SealDA className="w-14 h-14 sm:w-16 sm:h-16" customUrl={logoSettings.centerLogoUrl} />
              )}
              {logoSettings.centerLogoType === 'bagong_pilipinas' && (
                <SealBagongPilipinas
                  className="w-14 h-14 sm:w-16 sm:h-16"
                  customUrl={logoSettings.centerLogoUrl}
                />
              )}

              {/* Right Logo */}
              {logoSettings.rightLogoType === 'bagong_pilipinas' && (
                <SealBagongPilipinas
                  className="w-14 h-14 sm:w-16 sm:h-16"
                  customUrl={logoSettings.rightLogoUrl}
                />
              )}
              {logoSettings.rightLogoType === 'municipality' && (
                <SealMunicipality
                  className="w-16 h-16 sm:w-20 sm:h-20"
                  customUrl={logoSettings.rightLogoUrl}
                />
              )}
              {logoSettings.rightLogoType === 'province' && (
                <SealProvince
                  className="w-16 h-16 sm:w-20 sm:h-20"
                  customUrl={logoSettings.rightLogoUrl}
                />
              )}
              {logoSettings.rightLogoType === 'da' && (
                <SealDA className="w-16 h-16 sm:w-20 sm:h-20" customUrl={logoSettings.rightLogoUrl} />
              )}
              {logoSettings.rightLogoType === 'custom' && logoSettings.rightLogoUrl && (
                <img
                  src={logoSettings.rightLogoUrl}
                  alt="Right Logo"
                  className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-full"
                  referrerPolicy="no-referrer"
                />
              )}
            </div>
          </div>

          {/* Thin Green or Dark Line if Tuburan Style */}
          {data.templateStyle === 'tuburan' && (
            <div className="mt-3 border-t-2 border-emerald-700 w-full" />
          )}
        </div>

        {/* ========================================================================= */}
        {/* DOCUMENT TITLE */}
        {/* ========================================================================= */}
        <div className="text-center py-2">
          {data.templateStyle === 'nava' ? (
            <h1 className="font-gothic-cert text-3xl sm:text-4xl text-stone-950 font-normal tracking-wide">
              Barangay Certification
            </h1>
          ) : data.templateStyle === 'tuburan' ? (
            <div className="space-y-1">
              <p className="text-xs font-sans uppercase tracking-widest text-stone-600 font-bold">
                OFFICE OF THE PUNONG BARANGAY
              </p>
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-stone-950 font-serif border-b-2 border-stone-800 inline-block px-4 pb-1">
                BARANGAY CERTIFICATION
              </h1>
            </div>
          ) : data.templateStyle === 'nueva_esperanza' ? (
            <div className="space-y-1">
              <p className="text-xs font-sans uppercase tracking-wider text-stone-700 font-bold">
                OFFICE OF THE PUNONG BARANGAY
              </p>
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-stone-950 font-serif underline underline-offset-4 decoration-2">
                BARANGAY CERTIFICATION
              </h1>
            </div>
          ) : (
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-stone-950 font-serif border-b border-stone-800 pb-1 inline-block">
              BARANGAY LIVESTOCK CERTIFICATION
            </h1>
          )}
        </div>

        {/* ========================================================================= */}
        {/* CERTIFICATE BODY ACCORDING TO AUTHENTIC TEMPLATES */}
        {/* ========================================================================= */}
        <div className="space-y-5 text-stone-950 text-[13.5px] sm:text-[15px] leading-relaxed text-justify px-2 sm:px-6">
          {/* 1. BARANGAY NAVA FORMAT (Photo 3) */}
          {data.templateStyle === 'nava' && (
            <div className="space-y-4">
              <p className="font-bold tracking-wide text-sm font-sans uppercase">
                TO WHOM IT MAY CONCERN:
              </p>
              <p className="indent-8">
                This is to certify that{' '}
                <strong className="uppercase underline decoration-1 underline-offset-2">
                  {data.farmerName}
                </strong>{' '}
                is a bonifide resident of Barangay {rawBrgy}, Hinunangan, Southern Leyte.
              </p>
              <p className="indent-8">
                This certifies further that{' '}
                <strong className="uppercase underline decoration-1 underline-offset-2">
                  {data.farmerName}
                </strong>{' '}
                owned{' '}
                <strong>
                  {data.numberOfHeads} heads pigs sold to {data.buyerName.toUpperCase()} of{' '}
                  {data.destination.toUpperCase()}
                </strong>{' '}
                .{' '}
                {data.priceDescription
                  ? data.priceDescription
                  : `price ₱${data.amountPaid || '170'} per kilo.`}
              </p>
              <p className="indent-8 uppercase">
                THIS CERTIFICATION is being issued upon the request of the below-named for whatever
                any legal purpose it may serve best.
              </p>
              <p className="indent-8">
                Issued this <strong>{dateObj.day}</strong> day of{' '}
                <strong>
                  {dateObj.month} , {dateObj.year}
                </strong>{' '}
                at Barangay {rawBrgy}, Hinunangan, Southern Leyte, Philippines.
              </p>
            </div>
          )}

          {/* 2. BARANGAY NUEVA ESPERANZA FORMAT - BISAYA / CEBUANO DIALECT (Photo 1) */}
          {data.templateStyle === 'nueva_esperanza' && (
            <div className="space-y-4">
              <p className="font-bold tracking-wide text-sm font-sans uppercase">
                KINI NAGPAMATUOD NGA:
              </p>
              <p className="indent-8">
                Ako si{' '}
                <strong className="uppercase underline decoration-1 underline-offset-2">
                  {data.associationName || data.farmerName}
                </strong>
                , {data.farmerAgeCivilStatus || 'hingkod ang panu-igon'} nagpuyo sa Bgy. {rawBrgy},
                Hinunangan, Southern Leyte, nag BALIGYA og (
                <strong>{data.numberOfHeads}</strong>) ka Baboy ngadto ni{' '}
                <strong className="uppercase">{data.buyerName}</strong>, nga taga{' '}
                <strong>{data.destination}</strong>, sa kantidad nga (
                <strong>{data.priceDescription || 'P 150.00 / kilo'}</strong>).
              </p>
              <p className="indent-8">
                Kini nga mga Baboy nag edad og{' '}
                <strong>{data.swineAge || 'TULO ( 3 ) ka Buwan'}</strong>,{' '}
                <strong>{data.femaleCount || '—'}</strong> ka Bajie og{' '}
                <strong>{data.maleCount || '—'}</strong> ka Buok, og ang mga kulor niini,{' '}
                <strong>{data.colorDescription || 'Assorted'}</strong>, si{' '}
                <strong className="uppercase">{data.associationName || data.farmerName}</strong>,
                ang legal nga tag-iya.
              </p>
              <p className="indent-8">
                Gihimo ning ika <strong>{dateObj.day}</strong> , nga petsa sa bulan sa{' '}
                <strong>
                  {dateObj.month} {dateObj.year}
                </strong>{' '}
                dinhi sa Opisina sa Punong Barangay sa {rawBrgy}, Hinunangan, So. Leyte.
              </p>
            </div>
          )}

          {/* 3. BARANGAY TUBURAN FORMAT (Photo 2) */}
          {data.templateStyle === 'tuburan' && (
            <div className="space-y-4">
              <p className="font-bold tracking-wide text-sm font-sans uppercase">
                TO WHOM IT MAY CONCERN:
              </p>
              <p className="indent-8">
                THIS IS TO CERTIFY that{' '}
                <strong className="uppercase underline decoration-1 underline-offset-2">
                  {data.farmerName}
                </strong>{' '}
                a bonafide resident of Barangay {rawBrgy}, Hinunangan, Southern Leyte.
              </p>
              <p className="indent-8">
                FURTHER CERTIFY that the above-named person Owned{' '}
                <strong>{data.numberOfHeads} Pigs</strong> and to be sold to{' '}
                <strong className="uppercase">{data.buyerName}</strong>.
              </p>
              <p className="indent-8">
                This certification is being issued to support for transporting this{' '}
                <strong>{data.numberOfHeads} pigs</strong> from Barangay {rawBrgy}, Hinunangan
                Southern Leyte to <strong>{data.destination}</strong>.
              </p>
              <p className="indent-8">
                Issued this <strong>{dateObj.day} Day</strong> of{' '}
                <strong>
                  {dateObj.month} {dateObj.year}
                </strong>{' '}
                .
              </p>
              <p className="italic text-xs text-stone-600 font-sans pt-2">
                Note: This certification is not valid without official seal.
              </p>
            </div>
          )}

          {/* 4. DA / MAO VETERINARY TAKE-OFF DISPATCH CLEARANCE */}
          {data.templateStyle === 'da_veterinary' && (
            <div className="space-y-4">
              <p className="font-bold tracking-wide text-sm font-sans uppercase">
                TO ALL CONCERNED QUARANTINE & CHECKPOINT OFFICERS:
              </p>
              <p className="indent-8">
                THIS IS TO OFFICIALLY CERTIFY that the livestock holding belonging to{' '}
                <strong className="uppercase underline decoration-1 underline-offset-2">
                  {data.farmerName}
                </strong>{' '}
                of Barangay {rawBrgy}, Hinunangan, Southern Leyte has been inspected by the
                Municipal Agriculture Office and verified to be compliant with national
                biosecurity standards, ASF-free zone clearances, and veterinary ante-mortem
                protocols.
              </p>
              <p className="indent-8">
                Permission is hereby granted for the live dispatch and transport of{' '}
                <strong>{data.numberOfHeads} head(s) of swine</strong> to{' '}
                <strong className="uppercase">{data.buyerName}</strong> destined for{' '}
                <strong>{data.destination}</strong>.
              </p>
              <p className="indent-8">
                Issued this <strong>{dateObj.day}</strong> day of{' '}
                <strong>
                  {dateObj.month} {dateObj.year}
                </strong>{' '}
                at Hinunangan, Southern Leyte, Philippines.
              </p>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* SIGNATORIES GRID ACCORDING TO AUTHENTIC FORMAT */}
        {/* ========================================================================= */}
        <div className="pt-8 px-2 sm:px-6">
          {/* Nava Style: 3 Signatories (PB on Left, BBO in Middle, Farmer on Right) */}
          {data.templateStyle === 'nava' && (
            <div className="grid grid-cols-3 gap-4 text-center font-sans">
              <div>
                <div className="pt-8 border-b-2 border-black w-full mx-auto font-black text-xs sm:text-sm uppercase">
                  {data.punongBarangay}
                </div>
                <p className="text-[11px] sm:text-xs font-bold text-stone-800 pt-1 uppercase">
                  Punong Barangay
                </p>
              </div>

              <div>
                <div className="pt-8 border-b-2 border-black w-full mx-auto font-black text-xs sm:text-sm uppercase">
                  {data.bboName}
                </div>
                <p className="text-[11px] sm:text-xs font-bold text-stone-800 pt-1 uppercase">
                  BBO
                </p>
              </div>

              <div>
                <div className="pt-8 border-b-2 border-black w-full mx-auto font-black text-xs sm:text-sm uppercase">
                  {data.farmerName}
                </div>
                <p className="text-[11px] sm:text-xs font-bold text-stone-800 pt-1 uppercase">
                  FARMER/OWNER
                </p>
              </div>
            </div>
          )}

          {/* Nueva Esperanza Style: 4 Signatories (Top row Buyer & Seller, Middle BBO, Bottom PB) */}
          {data.templateStyle === 'nueva_esperanza' && (
            <div className="space-y-6 font-sans">
              <div className="grid grid-cols-2 gap-8 text-center">
                <div>
                  <div className="pt-6 border-b-2 border-black w-4/5 mx-auto font-black text-xs sm:text-sm uppercase">
                    {data.buyerName}
                  </div>
                  <p className="text-[11px] sm:text-xs font-semibold text-stone-800 pt-1">
                    Hing palit sa Baboy
                  </p>
                </div>

                <div>
                  <div className="pt-6 border-b-2 border-black w-4/5 mx-auto font-black text-xs sm:text-sm uppercase">
                    {data.associationName || data.farmerName}
                  </div>
                  <p className="text-[11px] sm:text-xs font-semibold text-stone-800 pt-1">
                    Nagbaligya/Tag-iya sa Baboy
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 pt-2">
                <div></div>
                <div className="text-center">
                  <p className="text-xs text-stone-600 font-semibold text-left pl-8">Noted by:</p>
                  <div className="pt-4 border-b-2 border-black w-4/5 mx-auto font-black text-xs sm:text-sm uppercase">
                    {data.bboName}
                  </div>
                  <p className="text-[11px] sm:text-xs font-bold text-stone-800 pt-1">
                    Barangay Bio Officer
                  </p>
                </div>
              </div>

              <div className="pt-2 text-center">
                <p className="text-xs text-stone-600 font-semibold w-2/3 mx-auto text-left">
                  Certified by:
                </p>
                <div className="pt-4 border-b-2 border-black w-2/3 mx-auto font-black text-xs sm:text-sm uppercase">
                  {data.punongBarangay}
                </div>
                <p className="text-[11px] sm:text-xs font-bold text-stone-800 pt-1 uppercase">
                  Punong Barangay
                </p>
              </div>
            </div>
          )}

          {/* Tuburan Style: Simple Right-aligned Punong Barangay + Dry Seal Notice */}
          {data.templateStyle === 'tuburan' && (
            <div className="grid grid-cols-2 gap-8 pt-8 font-sans items-end">
              <div>
                <div className="w-24 h-24 rounded-full border-2 border-dashed border-stone-300 flex items-center justify-center text-center p-2 text-[10px] text-stone-400 font-bold uppercase select-none">
                  Official Dry Seal
                </div>
              </div>
              <div className="text-center space-y-1">
                <p className="text-xs font-bold text-stone-700 text-left pl-10">BY:</p>
                <div className="pt-8 border-b-2 border-black w-4/5 mx-auto font-black text-xs sm:text-sm uppercase">
                  {data.punongBarangay}
                </div>
                <p className="text-[11px] sm:text-xs font-bold text-stone-800 uppercase">
                  Punong Brgy
                </p>
              </div>
            </div>
          )}

          {/* DA / MAO Style */}
          {data.templateStyle === 'da_veterinary' && (
            <div className="grid grid-cols-2 gap-8 text-center font-sans pt-6">
              <div>
                <div className="pt-8 border-b-2 border-black w-4/5 mx-auto font-black text-xs sm:text-sm uppercase">
                  {data.bboName}
                </div>
                <p className="text-[11px] sm:text-xs font-bold text-stone-800 uppercase">
                  {data.bboTitle || 'Livestock Inspector / BBO'}
                </p>
              </div>

              <div>
                <div className="pt-8 border-b-2 border-black w-4/5 mx-auto font-black text-xs sm:text-sm uppercase">
                  {data.punongBarangay}
                </div>
                <p className="text-[11px] sm:text-xs font-bold text-stone-800 uppercase">
                  {data.punongBarangayTitle || 'Punong Barangay / Authorized Official'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* BOTTOM-LEFT OFFICIAL RECEIPT DETAILS (Exact match to Photos 1 & 3) */}
        {/* ========================================================================= */}
        <div className="pt-8 border-t border-stone-200 flex flex-wrap items-end justify-between gap-4 font-sans text-xs">
          <div className="space-y-1 text-stone-800">
            {data.templateStyle === 'nava' ? (
              <>
                <p className="font-bold">
                  Official Receipt Paid: <span className="font-mono">{data.orNumber}</span> / ₱
                  {data.amountPaid}
                </p>
                <p className="font-bold uppercase">Issued on: {dateObj.full}</p>
                <p className="font-bold">
                  Issued at: {data.issuedAt || `${rawBrgy}, Hinunangan, Southern Leyte`}
                </p>
              </>
            ) : (
              <>
                <p className="font-bold">
                  O. R. # : <span className="font-mono">{data.orNumber}</span>
                </p>
                <p className="font-bold">Issued On : {dateObj.full}</p>
                <p className="font-bold">
                  Issued At :{' '}
                  {data.issuedAt || `Bgy. ${rawBrgy}, Hinunangan, So. Leyte.`}
                </p>
              </>
            )}
          </div>

          <div className="text-[10px] text-stone-400 font-mono text-right">
            <span>Doc Ref: {data.certificateNo || `CERT-${Date.now().toString().slice(-6)}`}</span>
            <br />
            <span>LGU Hinunangan • DA Swine Registry System</span>
          </div>
        </div>
      </div>
    </div>
  );
};

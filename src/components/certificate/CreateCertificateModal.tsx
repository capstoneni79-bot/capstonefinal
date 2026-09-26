import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Plus,
  X,
  Check,
  Printer,
  Sparkles,
  User,
  MapPin,
  Calendar,
  DollarSign,
  Tag,
  ShieldCheck,
  FileCheck,
  ChevronRight,
  Eye,
  Building2,
  Sliders,
  Layers,
} from 'lucide-react';
import { SwineRecord, UserAccount, IssuedCertificate, CertificateTemplate } from '../../types';
import { HINUNANGAN_BARANGAYS } from '../../data/barangays';
import { DynamicCertificateView } from './DynamicCertificateView';
import { storageService } from '../../services/storageService';
import { replaceTemplatePlaceholders } from '../../utils/templateReplacer';
import { calculateSwineAge } from '../../utils/swineRegistryLogic';

interface CreateCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  swineList: SwineRecord[];
  currentUser: UserAccount | null;
  onCertificateIssued: (cert: IssuedCertificate, printNow?: boolean) => void;
  initialData?: any;
}

export const CreateCertificateModal: React.FC<CreateCertificateModalProps> = ({
  isOpen,
  onClose,
  swineList,
  currentUser,
  onCertificateIssued,
  initialData,
}) => {
  const allTemplates = useMemo(() => storageService.getCertificateTemplates(), [isOpen]);

  const [selectedBarangay, setSelectedBarangay] = useState<string>(
    initialData?.barangay || 'Nava'
  );

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(() => {
    if (initialData?.templateId) return initialData.templateId;
    const matched = storageService.getCertificateTemplateForBarangay(initialData?.barangay || 'Nava');
    return matched.id;
  });

  const activeTemplate = useMemo(() => {
    return (
      allTemplates.find(t => t.id === selectedTemplateId) ||
      storageService.getCertificateTemplateForBarangay(selectedBarangay) ||
      allTemplates[0]
    );
  }, [allTemplates, selectedTemplateId, selectedBarangay]);

  // Form Field States
  const [farmerName, setFarmerName] = useState<string>(
    initialData?.farmerName || (swineList[0]?.farmerName || '')
  );
  const [associationName, setAssociationName] = useState<string>(
    initialData?.associationName || (selectedBarangay.toLowerCase().includes('nueva') ? 'NUEVA ESPERANZA SLP ASS.' : '')
  );
  const [farmerAgeCivilStatus, setFarmerAgeCivilStatus] = useState<string>(
    initialData?.farmerAgeCivilStatus || 'hingkod ang panu-igon'
  );
  const [buyerName, setBuyerName] = useState<string>(
    initialData?.buyerName || ''
  );
  const [destination, setDestination] = useState<string>(
    initialData?.destination || ''
  );
  const [numberOfHeads, setNumberOfHeads] = useState<number>(
    initialData?.numberOfHeads || (initialData ? 1 : (swineList.length > 0 ? 1 : 0))
  );
  const [swineAge, setSwineAge] = useState<string>(() => {
    if (initialData?.swineAge) return initialData.swineAge;
    if (initialData?.computedAgeLabel) return initialData.computedAgeLabel;
    const dob = initialData?.birthDate || initialData?.dateOfBirth || initialData?.date_of_birth || initialData?.dob;
    if (dob) {
      const calc = calculateSwineAge(dob);
      if (calc.hasDob) return calc.display;
    }
    return '';
  });
  const [femaleCount, setFemaleCount] = useState<string | number>(
    initialData?.femaleCount ?? (initialData?.gender === 'female' ? 1 : 0)
  );
  const [maleCount, setMaleCount] = useState<string | number>(
    initialData?.maleCount ?? (initialData?.gender === 'male' || initialData?.gender === 'castrated' ? 1 : 0)
  );
  const [colorDescription, setColorDescription] = useState<string>(
    initialData?.colorDescription || (initialData?.breed || '')
  );
  const [priceDescription, setPriceDescription] = useState<string>(
    initialData?.priceDescription || (initialData?.estimatedPricePhp ? `₱${initialData.estimatedPricePhp.toLocaleString()}` : '')
  );
  const [orNumber, setOrNumber] = useState<string>(
    initialData?.orNumber || activeTemplate.receipt?.orNumber || `OR-${Math.floor(1000000 + Math.random() * 9000000)}`
  );
  const [amountPaid, setAmountPaid] = useState<string | number>(
    initialData?.amountPaid || activeTemplate.receipt?.amountPaid || '100.00'
  );
  const [issueDate, setIssueDate] = useState<string>(
    initialData?.issueDate || new Date().toISOString().substring(0, 10)
  );

  // Modal active tab: 'form' | 'preview'
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');

  // When barangay changes, auto-suggest template if user hasn't explicitly locked another
  useEffect(() => {
    const matched = storageService.getCertificateTemplateForBarangay(selectedBarangay);
    if (matched && matched.id !== selectedTemplateId) {
      setSelectedTemplateId(matched.id);
    }
  }, [selectedBarangay]);

  // When template changes, update receipt defaults
  useEffect(() => {
    if (activeTemplate.receipt?.amountPaid && !initialData?.amountPaid) {
      setAmountPaid(activeTemplate.receipt.amountPaid);
    }
    if (activeTemplate.receipt?.orNumber && !initialData?.orNumber) {
      setOrNumber(activeTemplate.receipt.orNumber);
    }
  }, [activeTemplate]);

  // When farmer is selected from swine list
  const handleFarmerSelect = (farmerNameSelected: string) => {
    setFarmerName(farmerNameSelected);
    const matched = swineList.filter(s => s.farmerName === farmerNameSelected);
    if (matched.length > 0) {
      setSelectedBarangay(matched[0].barangay || selectedBarangay);
      setNumberOfHeads(matched.length);
      const females = matched.filter(s => s.gender === 'female').length;
      const males = matched.filter(s => s.gender === 'male').length;
      setFemaleCount(females || Math.ceil(matched.length / 2));
      setMaleCount(males || Math.floor(matched.length / 2));
      const dob = matched[0].birthDate || matched[0].dateOfBirth || matched[0].date_of_birth || matched[0].dob;
      if (dob) {
        const calc = calculateSwineAge(dob);
        if (calc.hasDob) {
          setSwineAge(calc.display);
        }
      }
    }
  };

  if (!isOpen) return null;

  // Active compiled data context for preview and placeholder replacement
  const activeDataContext = {
    resident_name: farmerName,
    farmer_name: farmerName,
    barangay: selectedBarangay,
    municipality: 'Hinunangan',
    province: 'Southern Leyte',
    association_name: associationName.trim() ? associationName : farmerName,
    farmer_age_civil_status: farmerAgeCivilStatus,
    buyer_name: buyerName,
    buyer_address: destination,
    destination: destination,
    number_of_pigs: numberOfHeads,
    heads: numberOfHeads,
    swine_age: swineAge,
    female_count: femaleCount,
    male_count: maleCount,
    color_description: colorDescription,
    price_per_kilo: priceDescription,
    or_number: orNumber,
    amount_paid: amountPaid,
    date_issued: issueDate,
    issue_date: issueDate,
    issued_at: `Barangay ${selectedBarangay}, Hinunangan, Southern Leyte`,
  };

  const handleSaveAndIssue = (andPrint = false) => {
    const certNumber = `HN-BRGY-${selectedBarangay.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`;
    const renderedBody = replaceTemplatePlaceholders(activeTemplate.bodyTemplate || '', activeDataContext);

    const firstPB = activeTemplate.signatories.find(s => s.position?.toLowerCase().includes('punong') || s.section === 'certified_by')?.name || 'HON. PUNONG BARANGAY';
    const firstBBO = activeTemplate.signatories.find(s => s.position?.toLowerCase().includes('bbo') || s.section === 'noted_by')?.name || 'BBO / INSPECTOR';

    const newCert: IssuedCertificate = {
      certificateNo: certNumber,
      certificateType: activeTemplate.documentType,
      formatType: 'barangay_cert',
      templateId: activeTemplate.id,
      templateSnapshot: activeTemplate,
      renderedBody: renderedBody,
      swineId: 'swine-general',
      earTagNo: 'TAG-BULK',
      farmerName,
      farmerBarangay: selectedBarangay,
      issuingBarangay: selectedBarangay,
      buyerName,
      destinationBarangay: destination,
      destinationMunicipality: destination,
      numberOfHeads: numberOfHeads,
      swineDescription: `${numberOfHeads} heads of pigs (${colorDescription || 'Assorted'})`,
      orNumber,
      amountPaid: Number(amountPaid) || 100,
      issueDate,
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
      punongBarangay: firstPB,
      bboName: firstBBO,
      authorizedBy: firstPB,
      status: 'active',
      qrVerificationCode: `DA-HN-CERT|${certNumber}|${farmerName}|${selectedBarangay}|${numberOfHeads}HEADS|BUYER:${buyerName}|OR:${orNumber}|TPL:${activeTemplate.id}`,
    };

    // Store in storageService
    storageService.issueCertificate(newCert);
    onCertificateIssued(newCert, andPrint);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 z-50 animate-in fade-in duration-150">
      <div className="bg-white max-w-5xl w-full rounded-2xl shadow-2xl border border-stone-200 flex flex-col max-h-[95vh] overflow-hidden">
        {/* Header (Picture 6 styling) */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/40 text-blue-300 flex items-center justify-center font-black">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight">
                Create & Issue Official Barangay Certification
              </h2>
              <p className="text-xs text-slate-400">
                Dynamic multi-barangay templates • Picture 1, 2, 3 official format support
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Form vs Preview Toggle */}
            <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => setActiveTab('form')}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  activeTab === 'form'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                1. Details Form
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'preview'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>2. Live Document Preview</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100/70">
          {activeTab === 'form' ? (
            <div className="space-y-6 max-w-4xl mx-auto">
              {/* Dynamic Template Selector */}
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <label className="text-xs font-black uppercase tracking-wider text-slate-800">
                      Select Certificate Template Format
                    </label>
                  </div>
                  <span className="text-[11px] text-slate-500 font-semibold">
                    {allTemplates.length} templates available
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {allTemplates.map(tpl => {
                    const isSelected = activeTemplate.id === tpl.id;
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => setSelectedTemplateId(tpl.id)}
                        className={`p-3.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/90 ring-2 ring-blue-500/20 shadow-xs'
                            : 'border-stone-200 bg-white hover:bg-stone-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-slate-900 leading-snug">
                            {tpl.name}
                          </span>
                          {isSelected && (
                            <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] shrink-0 ml-1">
                              ✓
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 pt-1 font-medium">
                          <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700 font-bold uppercase">
                            {tpl.barangay}
                          </span>
                          <span>• {tpl.language}</span>
                          <span>• {tpl.signatories?.length || 1} signers</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Form Grid 1: Raiser & Barangay */}
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 border-b border-stone-100 pb-2 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" />
                  <span>1. Raiser / Seller & Barangay Origin</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Barangay of Origin
                    </label>
                    <select
                      value={selectedBarangay}
                      onChange={e => setSelectedBarangay(e.target.value)}
                      className="w-full bg-slate-50 border border-stone-300 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                    >
                      {HINUNANGAN_BARANGAYS.map(b => (
                        <option key={b.name} value={b.name}>
                          Barangay {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Quick Select Registered Raiser (Optional)
                    </label>
                    <select
                      value={farmerName}
                      onChange={e => handleFarmerSelect(e.target.value)}
                      className="w-full bg-slate-50 border border-stone-300 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="EDNA TOMBOC">EDNA TOMBOC (Sample Raiser - Nava)</option>
                      <option value="NUEVA ESPERANZA SLP ASS.">
                        NUEVA ESPERANZA SLP ASS. (Association - Nueva Esperanza)
                      </option>
                      <option value="MARIBEL S. MENDOZA">MARIBEL S. MENDOZA (Tuburan)</option>
                      {swineList.slice(0, 30).map(s => (
                        <option key={s.id} value={s.farmerName}>
                          {s.farmerName} — Brgy. {s.barangay} ({s.breed})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Farmer / Hog Owner Name
                    </label>
                    <input
                      type="text"
                      value={farmerName}
                      onChange={e => setFarmerName(e.target.value)}
                      placeholder="e.g. EDNA TOMBOC"
                      className="w-full bg-white border border-stone-300 rounded-xl p-2.5 text-xs font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Association / Organization Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={associationName}
                      onChange={e => setAssociationName(e.target.value)}
                      placeholder="e.g. NUEVA ESPERANZA SLP ASS."
                      className="w-full bg-white border border-stone-300 rounded-xl p-2.5 text-xs font-semibold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Civil Status / Legal Age Description (Bisaya / English)
                    </label>
                    <input
                      type="text"
                      value={farmerAgeCivilStatus}
                      onChange={e => setFarmerAgeCivilStatus(e.target.value)}
                      placeholder="e.g. hingkod ang panu-igon / of legal age"
                      className="w-full bg-white border border-stone-300 rounded-xl p-2.5 text-xs font-semibold text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Form Grid 2: Swine Specifications */}
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 border-b border-stone-100 pb-2 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-emerald-600" />
                  <span>2. Swine Heads & Livestock Description</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Total Heads of Swine
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={numberOfHeads}
                      onChange={e => setNumberOfHeads(parseInt(e.target.value) || 1)}
                      className="w-full bg-white border border-stone-300 rounded-xl p-2.5 text-xs font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Age of Swine
                    </label>
                    <input
                      type="text"
                      value={swineAge}
                      onChange={e => setSwineAge(e.target.value)}
                      placeholder="e.g. TULO ( 3 ) ka Buwan"
                      className="w-full bg-white border border-stone-300 rounded-xl p-2.5 text-xs font-semibold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Color / Breed Description
                    </label>
                    <input
                      type="text"
                      value={colorDescription}
                      onChange={e => setColorDescription(e.target.value)}
                      placeholder="e.g. Assorted (White / Landrace Cross)"
                      className="w-full bg-white border border-stone-300 rounded-xl p-2.5 text-xs font-semibold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Bajie (Female) Head Count
                    </label>
                    <input
                      type="text"
                      value={femaleCount}
                      onChange={e => setFemaleCount(e.target.value)}
                      placeholder="e.g. 4"
                      className="w-full bg-white border border-stone-300 rounded-xl p-2.5 text-xs font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Buok (Male) Head Count
                    </label>
                    <input
                      type="text"
                      value={maleCount}
                      onChange={e => setMaleCount(e.target.value)}
                      placeholder="e.g. 3"
                      className="w-full bg-white border border-stone-300 rounded-xl p-2.5 text-xs font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Price per Kilo / Rate
                    </label>
                    <input
                      type="text"
                      value={priceDescription}
                      onChange={e => setPriceDescription(e.target.value)}
                      placeholder="e.g. ₱170.00 / kilo liveweight"
                      className="w-full bg-white border border-stone-300 rounded-xl p-2.5 text-xs font-semibold text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Form Grid 3: Buyer & Destination */}
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 border-b border-stone-100 pb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-purple-600" />
                  <span>3. Buyer Name & Transit Destination</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Buyer Name / Trading Entity
                    </label>
                    <input
                      type="text"
                      value={buyerName}
                      onChange={e => setBuyerName(e.target.value)}
                      placeholder="e.g. JOVELYN PADOLLO / JJR HOG TRADING"
                      className="w-full bg-white border border-stone-300 rounded-xl p-2.5 text-xs font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Transit Destination Address
                    </label>
                    <input
                      type="text"
                      value={destination}
                      onChange={e => setDestination(e.target.value)}
                      placeholder="e.g. Barangay Colawen, Pastrana, Leyte"
                      className="w-full bg-white border border-stone-300 rounded-xl p-2.5 text-xs font-semibold text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Form Grid 4: Official Receipt & Date */}
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 border-b border-stone-100 pb-2 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-amber-600" />
                  <span>4. Official Receipt (O.R.) & Issuance Date</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Official Receipt (O.R.) Number
                    </label>
                    <input
                      type="text"
                      value={orNumber}
                      onChange={e => setOrNumber(e.target.value)}
                      placeholder="e.g. 1675127"
                      className="w-full bg-white border border-stone-300 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Amount Paid (₱)
                    </label>
                    <input
                      type="text"
                      value={amountPaid}
                      onChange={e => setAmountPaid(e.target.value)}
                      placeholder="e.g. 100.00"
                      className="w-full bg-white border border-stone-300 rounded-xl p-2.5 text-xs font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Date of Issuance
                    </label>
                    <input
                      type="date"
                      value={issueDate}
                      onChange={e => setIssueDate(e.target.value)}
                      className="w-full bg-white border border-stone-300 rounded-xl p-2.5 text-xs font-bold text-slate-900"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Live Dynamic Preview Canvas */
            <div className="py-4">
              <DynamicCertificateView
                template={activeTemplate}
                data={activeDataContext}
              />
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-stone-200 bg-white flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {activeTab === 'form' ? (
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>Preview Document</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActiveTab('form')}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <span>← Back to Form</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => handleSaveAndIssue(false)}
              className="px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-black shadow-sm flex items-center gap-2 transition cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Save & Issue Certificate</span>
            </button>

            <button
              type="button"
              onClick={() => handleSaveAndIssue(true)}
              className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black shadow-sm flex items-center gap-2 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Save & Print Immediately</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

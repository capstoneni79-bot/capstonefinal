import React, { useState } from 'react';
import {
  X,
  Building2,
  ShieldCheck,
  MapPin,
  CheckCircle2,
  Sparkles,
  User,
  Phone,
  Layers,
  FileCheck,
  AlertTriangle,
  Locate,
  Calendar,
} from 'lucide-react';
import { Barangay, SwineRecord, SwineType } from '../../types';
import { storageService } from '../../services/storageService';
import { useLanguage } from '../../context/LanguageContext';
import { validateHinunanganRegistration } from '../../utils/boundaryValidation';
import {
  ContactNumberInput,
  isValidContactNumber,
  CONTACT_NUMBER_ERROR_MESSAGE,
} from '../common/ContactNumberInput';

interface SwineFarmRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  barangays: Barangay[];
  onFarmRegistered?: (record: SwineRecord) => void;
}

export const SwineFarmRegistrationModal: React.FC<SwineFarmRegistrationModalProps> = ({
  isOpen,
  onClose,
  barangays,
  onFarmRegistered,
}) => {
  const { t } = useLanguage();
  const [farmerName, setFarmerName] = useState('');
  const [farmerContact, setFarmerContact] = useState('');
  const [selectedBarangay, setSelectedBarangay] = useState(barangays[0]?.name || 'Poblacion 01');
  const [purokAddress, setPurokAddress] = useState('');
  const [rsbsaId, setRsbsaId] = useState('');
  const [farmType, setFarmType] = useState<'backyard' | 'commercial'>('backyard');
  const [farmClassification, setFarmClassification] = useState<'backyard' | 'semi_commercial' | 'commercial' | 'breeder'>('backyard');
  
  // Swine inventory breakdown
  const [sowsCount, setSowsCount] = useState<number>(2);
  const [boarsCount, setBoarsCount] = useState<number>(1);
  const [growersCount, setGrowersCount] = useState<number>(5);
  const [pigletsCount, setPigletsCount] = useState<number>(6);
  const [primaryBreed, setPrimaryBreed] = useState('Landrace x Large White');
  const [applicableOrdinance, setApplicableOrdinance] = useState('Municipal Ordinance No. 2025-59 (Piggery & Poultry Regulation Ordinance - Baboyang Walang Amoy & Setbacks)');

  // Biosecurity
  const [footbath, setFootbath] = useState(true);
  const [perimeterFence, setPerimeterFence] = useState(true);
  const [noSwillFeeding, setNoSwillFeeding] = useState(true);
  const [wasteLagoon, setWasteLagoon] = useState(true);
  const [potableWater, setPotableWater] = useState(true);
  const [visitorLogbook, setVisitorLogbook] = useState(true);

  // Geo
  const [latitude, setLatitude] = useState<number>(10.4045);
  const [longitude, setLongitude] = useState<number>(125.2012);
  const [isLocating, setIsLocating] = useState(false);

  // Status
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [registeredBatchId, setRegisteredBatchId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const totalHeads = (sowsCount || 0) + (boarsCount || 0) + (growersCount || 0) + (pigletsCount || 0);

  const handleCaptureLocation = () => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setLatitude(parseFloat(pos.coords.latitude.toFixed(6)));
          setLongitude(parseFloat(pos.coords.longitude.toFixed(6)));
          setIsLocating(false);
        },
        () => {
          // Fallback to barangay coordinate
          const bg = barangays.find(b => b.name === selectedBarangay);
          if (bg) {
            setLatitude(parseFloat(bg.latitude.toFixed(6)));
            setLongitude(parseFloat(bg.longitude.toFixed(6)));
          }
          setIsLocating(false);
        }
      );
    } else {
      setIsLocating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!farmerName.trim()) {
      setErrorMessage('Please enter the Farmer / Raiser Full Name.');
      return;
    }

    if (farmerContact.trim() && !isValidContactNumber(farmerContact)) {
      setErrorMessage(CONTACT_NUMBER_ERROR_MESSAGE);
      return;
    }

    if (totalHeads <= 0) {
      setErrorMessage('Total swine heads must be at least 1 head.');
      return;
    }

    // Strict Geographic Exclusivity Check: Registration is exclusive strictly to Hinunangan
    const exclusivityCheck = validateHinunanganRegistration(latitude, longitude, selectedBarangay);
    if (!exclusivityCheck.isValidLocation) {
      setErrorMessage(
        exclusivityCheck.errorMessage ||
          'Registration Blocked: Pen GPS coordinates are outside Hinunangan municipal territory. Swine registration is strictly exclusive to Hinunangan, Southern Leyte per EO 12-2023.'
      );
      return;
    }

    // Determine primary swine type
    let primaryType: SwineType = 'grower';
    if (growersCount > 0) primaryType = 'grower';
    else if (sowsCount > 0) primaryType = 'sow';
    else if (pigletsCount > 0) primaryType = 'piglet';
    else if (boarsCount > 0) primaryType = 'boar';

    const cleanBarangay = selectedBarangay.replace(/\s+/g, '').substring(0, 3).toUpperCase();
    const cleanNum = Math.floor(1000 + Math.random() * 9000);
    const generatedEarTag = `HNG-${cleanBarangay}-${cleanNum}`;

    const newRecord: SwineRecord = {
      id: 'swine_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      earTagNo: generatedEarTag,
      farmerName: farmerName.trim(),
      farmerContact: farmerContact.trim() || '0917-000-0000',
      farmerAddress: purokAddress.trim() ? `${purokAddress.trim()}, Brgy. ${selectedBarangay}` : `Brgy. ${selectedBarangay}`,
      barangay: selectedBarangay,
      rsbsaId: rsbsaId.trim() || `RSBSA-08-64-09-${cleanNum}`,
      farmType: farmType,
      swineType: primaryType,
      breed: primaryBreed,
      ageWeeks: primaryType === 'sow' || primaryType === 'boar' ? 52 : primaryType === 'piglet' ? 4 : 18,
      weightKg: primaryType === 'sow' ? 140 : primaryType === 'boar' ? 180 : primaryType === 'piglet' ? 12 : 85,
      gender: primaryType === 'sow' ? 'female' : primaryType === 'boar' ? 'male' : 'castrated',
      latitude: latitude,
      longitude: longitude,
      status: 'healthy',
      readyToSell: false,
      isArchived: false,
      biosecurity: {
        perimeterFence: perimeterFence,
        footbathInstalled: footbath,
        disinfectionRoutine: true,
        quarantinePenAvailable: perimeterFence,
        potableWaterSource: potableWater,
        standardFeedStorage: true,
        asfVaccinationOrTesting: true,
        noSwillFeeding: noSwillFeeding,
        visitorLogbook: visitorLogbook,
        wasteLagoonOrCompost: wasteLagoon,
      },
      notes: `Official Farm Registration batch of ${totalHeads} heads (${sowsCount} sows, ${boarsCount} boars, ${growersCount} growers, ${pigletsCount} piglets). Classification: ${farmClassification.toUpperCase()}.`,
      registeredBy: 'MAO Hinunangan Registration Desk',
      applicableOrdinanceNumber: applicableOrdinance,
      registeredAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isSynced: true,
    };

    // Save to storage
    storageService.addSwineRecord(newRecord);
    setRegisteredBatchId(generatedEarTag);
    setIsSubmitted(true);

    if (onFarmRegistered) {
      onFarmRegistered(newRecord);
    }
  };

  const handleReset = () => {
    setFarmerName('');
    setFarmerContact('');
    setPurokAddress('');
    setRsbsaId('');
    setSowsCount(2);
    setBoarsCount(1);
    setGrowersCount(5);
    setPigletsCount(6);
    setIsSubmitted(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 max-w-2xl w-full overflow-hidden my-6">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-white">
                Swine Farm Registration
              </h2>
              <p className="text-xs text-emerald-200">
                DA Hinunangan Municipal Swine Registry & Biosecurity Form
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-emerald-200 hover:text-white transition cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {isSubmitted ? (
          <div className="p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-stone-900">
                Farm Successfully Registered!
              </h3>
              <p className="text-sm text-stone-600 max-w-md mx-auto">
                <strong>{farmerName}</strong> in <strong>Brgy. {selectedBarangay}</strong> has been officially logged in the Municipal Registry with <strong>{totalHeads} heads</strong>.
              </p>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 max-w-md mx-auto text-left space-y-1.5 text-xs text-emerald-900">
              <div className="flex justify-between">
                <span className="font-semibold text-emerald-700">Registration Tag:</span>
                <span className="font-mono font-bold">{registeredBatchId}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-emerald-700">Farm Type:</span>
                <span className="font-bold capitalize">{farmType} ({farmClassification.replace('_', ' ')})</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-emerald-700">Total Swine Heads:</span>
                <span className="font-bold">{totalHeads} Heads</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-emerald-700">Biosecurity Clearance:</span>
                <span className="font-bold text-emerald-700">Compliant (Free Zone)</span>
              </div>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition cursor-pointer shadow-md"
              >
                Done & Return to Dashboard
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Section 1: Farmer & Farm Identification */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800 border-b border-stone-200 pb-1.5">
                <User className="w-4 h-4 text-emerald-600" />
                <span>1. Farmer & Farm Location</span>
              </div>

              {/* Administrative Exclusivity Notice */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span className="text-emerald-900 font-semibold">
                    Province: <strong>Southern Leyte</strong> • Municipality: <strong>Hinunangan</strong> (Exclusive)
                  </span>
                </div>
                <span className="bg-emerald-200 text-emerald-900 text-[10px] font-black px-2 py-0.5 rounded-full shrink-0">
                  EO 12-2023 Exclusive
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Farmer / Hog Raiser Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Juan A. Dela Cruz"
                    value={farmerName}
                    onChange={e => setFarmerName(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <ContactNumberInput
                    id="modal-farmer-contact-input"
                    value={farmerContact}
                    onChange={setFarmerContact}
                    label="Contact Number"
                    placeholder="09123456789"
                    required={false}
                    helpText="Accepts exactly 11 digits only (0-9)."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Barangay *
                  </label>
                  <select
                    value={selectedBarangay}
                    onChange={e => setSelectedBarangay(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  >
                    {barangays.map(bg => (
                      <option key={bg.id} value={bg.name}>
                        {bg.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Purok / Sitio / Farm Address
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Purok 2, Riverside Road"
                    value={purokAddress}
                    onChange={e => setPurokAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    RSBSA Reference Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., RSBSA-08-64-09-0021"
                    value={rsbsaId}
                    onChange={e => setRsbsaId(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Farm Scale & Classification
                  </label>
                  <select
                    value={farmClassification}
                    onChange={e => {
                      const val = e.target.value as any;
                      setFarmClassification(val);
                      setFarmType(val === 'commercial' ? 'commercial' : 'backyard');
                    }}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  >
                    <option value="backyard">Backyard Raiser (1 - 10 heads)</option>
                    <option value="semi_commercial">Semi-Commercial (11 - 50 heads)</option>
                    <option value="commercial">Commercial Facility (51+ heads)</option>
                    <option value="breeder">Breeder & Nursery Farm</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Swine Population & Inventory */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-stone-200 pb-1.5">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  <span>2. Current Swine Inventory</span>
                </div>
                <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  Total: {totalHeads} Heads
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-stone-50 border border-stone-200 rounded-2xl text-center">
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">
                    Sows (Inahin)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={sowsCount}
                    onChange={e => setSowsCount(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full py-1.5 text-center font-black text-stone-800 bg-white border border-stone-300 rounded-lg text-base"
                  />
                </div>

                <div className="p-3 bg-stone-50 border border-stone-200 rounded-2xl text-center">
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">
                    Boars (Barako)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={boarsCount}
                    onChange={e => setBoarsCount(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full py-1.5 text-center font-black text-stone-800 bg-white border border-stone-300 rounded-lg text-base"
                  />
                </div>

                <div className="p-3 bg-stone-50 border border-stone-200 rounded-2xl text-center">
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">
                    Growers / Finishers
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={growersCount}
                    onChange={e => setGrowersCount(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full py-1.5 text-center font-black text-stone-800 bg-white border border-stone-300 rounded-lg text-base"
                  />
                </div>

                <div className="p-3 bg-stone-50 border border-stone-200 rounded-2xl text-center">
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">
                    Piglets (Baktin)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={pigletsCount}
                    onChange={e => setPigletsCount(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full py-1.5 text-center font-black text-stone-800 bg-white border border-stone-300 rounded-lg text-base"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Primary Breed / Genetic Line
                </label>
                <select
                  value={primaryBreed}
                  onChange={e => setPrimaryBreed(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                >
                  <option value="Landrace x Large White">Landrace x Large White (Commercial Hybrid)</option>
                  <option value="Duroc Jersey">Duroc Jersey (Terminal Boar Line)</option>
                  <option value="Pietrain Cross">Pietrain Cross (High Lean Yield)</option>
                  <option value="Native / Bisaya">Native / Bisaya (Local Foraging Swine)</option>
                  <option value="Hypor / DanBred">Hypor / DanBred (High Prolificacy)</option>
                </select>
              </div>
            </div>

            {/* Section 3: Biosecurity Compliance & Coordinates */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800 border-b border-stone-200 pb-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>3. Statutory Decree & Biosecurity Compliance</span>
              </div>

              {/* Governing Legal Ordinance Combo Box */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Applicable Statutory Ordinance / Legal Decree <span className="text-red-500">*</span>
                </label>
                <select
                  value={applicableOrdinance}
                  onChange={e => setApplicableOrdinance(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                >
                  <option value="Municipal Ordinance No. 2025-59 (Piggery & Poultry Regulation Ordinance - Baboyang Walang Amoy & Setbacks)">
                    Municipal Ordinance No. 2025-59 (Baboyang Walang Amoy, 25m/50m/100m Setbacks)
                  </option>
                  <option value="Resolution No. 376 Series of 2026 (Local Breeders & Backyard Raisers Registration with OMAS)">
                    Resolution No. 376 Series of 2026 (Local Breeders & Backyard Raisers Registration)
                  </option>
                  <option value="Provincial Ordinance No. 2023-144 (Southern Leyte Provincial Bantay ASF Ordinance)">
                    Provincial Ordinance No. 2023-144 (Provincial Bantay ASF Strict Quarantine)
                  </option>
                  <option value="Municipal Executive Order No. 12-2023 (Hinunangan ASF Border Disinfection & Biosecurity Protocols)">
                    Municipal Executive Order No. 12-2023 (Border Disinfection & Kanin-Baboy Ban)
                  </option>
                  <option value="Provincial Ordinance No. 2021-018 (Swine Biosecurity & Inter-Barangay Movement Permitting)">
                    Provincial Ordinance No. 2021-018 (Swine Biosecurity & Transport Permitting)
                  </option>
                </select>
                <p className="text-[10px] text-stone-500 mt-1">
                  Enforces Hinunangan environmental zoning buffers (50m backyard, 100m commercial, 25m water resources).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <label className="flex items-center gap-2.5 p-2.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-xs text-stone-800 cursor-pointer hover:bg-emerald-50">
                  <input
                    type="checkbox"
                    checked={footbath}
                    onChange={e => setFootbath(e.target.checked)}
                    className="w-4 h-4 rounded-md text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
                  />
                  <span>Disinfectant footbath at pen entrance</span>
                </label>

                <label className="flex items-center gap-2.5 p-2.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-xs text-stone-800 cursor-pointer hover:bg-emerald-50">
                  <input
                    type="checkbox"
                    checked={perimeterFence}
                    onChange={e => setPerimeterFence(e.target.checked)}
                    className="w-4 h-4 rounded-md text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
                  />
                  <span>Perimeter fence (prevent stray swine)</span>
                </label>

                <label className="flex items-center gap-2.5 p-2.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-xs text-stone-800 cursor-pointer hover:bg-emerald-50">
                  <input
                    type="checkbox"
                    checked={noSwillFeeding}
                    onChange={e => setNoSwillFeeding(e.target.checked)}
                    className="w-4 h-4 rounded-md text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
                  />
                  <span className="font-semibold text-emerald-950">Zero swill feeding (Strict ASF compliance)</span>
                </label>

                <label className="flex items-center gap-2.5 p-2.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-xs text-stone-800 cursor-pointer hover:bg-emerald-50">
                  <input
                    type="checkbox"
                    checked={wasteLagoon}
                    onChange={e => setWasteLagoon(e.target.checked)}
                    className="w-4 h-4 rounded-md text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
                  />
                  <span>Septic / Waste lagoon / Compost pit</span>
                </label>
              </div>

              {/* Coordinates */}
              <div className="flex flex-wrap items-center gap-3 bg-stone-50 border border-stone-200 p-3 rounded-2xl">
                <div className="flex-1 min-w-[140px]">
                  <span className="block text-[10px] text-stone-500 font-bold uppercase">Latitude</span>
                  <span className="font-mono text-xs font-bold text-stone-800">{latitude}</span>
                </div>
                <div className="flex-1 min-w-[140px]">
                  <span className="block text-[10px] text-stone-500 font-bold uppercase">Longitude</span>
                  <span className="font-mono text-xs font-bold text-stone-800">{longitude}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCaptureLocation}
                  disabled={isLocating}
                  className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                >
                  <Locate className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                  <span>{isLocating ? 'Locating...' : 'Capture GPS'}</span>
                </button>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-bold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition cursor-pointer shadow-md flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Submit & Register Farm</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

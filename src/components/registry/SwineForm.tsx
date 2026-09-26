import React, { useState, useEffect, useMemo } from 'react';
import {
  Upload,
  Camera,
  MapPin,
  ShieldCheck,
  Check,
  Sparkles,
  Layers,
  Save,
  AlertCircle,
  Calendar,
  DollarSign,
  Tag,
  User,
  Phone,
  FileSpreadsheet,
  RefreshCw,
  Scale,
  Droplets,
  School,
  Home,
  CheckCircle2,
  AlertTriangle,
  Info,
  ExternalLink,
  BookOpen,
  Lock,
  Building2,
  Crosshair,
} from 'lucide-react';
import {
  Barangay,
  BiosecurityChecklist,
  SwineRecord,
  SwineType,
  UserAccount,
  RegistryFormSchema,
  RegistryFormField,
  RegistryFormSection,
  FarmScale,
  ASFZone,
} from '../../types';
import { storageService } from '../../services/storageService';
import {
  ContactNumberInput,
  isValidContactNumber,
  CONTACT_NUMBER_ERROR_MESSAGE,
} from '../common/ContactNumberInput';
import { GisMap } from '../gis/GisMap';
import { getBarangayCoordinates } from '../../data/barangays';
import { SwineMatrixModal } from './SwineMatrixModal';
import {
  calculateAgeFromBirthDate,
  calculateBirthDateFromDays,
  calculateBirthDateFromWeeks,
  autoDetermineSwineCategory,
  estimateWeightFromAgeDays,
  calculateWeightFromTapeFormula,
  calculateEstimatedMarketPrice,
  evaluateSetbackBuffers,
} from '../../utils/swineMatrixCalculator';
import {
  validateHinunanganRegistration,
  isPointInsideHinunangan,
} from '../../utils/boundaryValidation';
import { getFieldKey, normalizePhilippinePhoneNumber } from '../../utils/registryFieldUtils';
import { generateFieldValue } from '../../utils/autoGenFieldUtils';
import {
  generateNextPigIdTag,
  calculateSwineAge,
  getEstimatedWeightRange,
  classifyFarmScale,
  getFarmScaleLabel,
  getBarangayASFZone,
  shouldShowASFWarning,
  validateSwineRecordForSave,
  isValidPigIdTag,
  FARM_SCALE_RULES,
} from '../../utils/swineRegistryLogic';

interface SwineFormProps {
  barangays: Barangay[];
  currentUser: UserAccount | null;
  initialData?: SwineRecord | null;
  initialCoordinates?: { latitude: number; longitude: number; barangay?: string } | null;
  onSuccess: (record: SwineRecord) => void;
  onCancel?: () => void;
  onOpenBatchModal: () => void;
  onViewOrdinance?: () => void;
}

const SAMPLE_SWINE_PHOTOS = [
  { label: 'Finisher 1', url: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=600&q=80' },
  { label: 'Finisher 2', url: 'https://images.unsplash.com/photo-1541689592655-f5f52825a3b8?auto=format&fit=crop&w=600&q=80' },
  { label: 'Breeder Sow', url: 'https://images.unsplash.com/photo-1545468800-856f6620f8b2?auto=format&fit=crop&w=600&q=80' },
  { label: 'Piglet', url: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=600&q=80' },
  { label: 'Lean Crossbreed', url: 'https://images.unsplash.com/photo-1563281577-a7be47e20db9?auto=format&fit=crop&w=600&q=80' },
];

export const SwineForm: React.FC<SwineFormProps> = ({
  barangays,
  currentUser,
  initialData,
  initialCoordinates,
  onSuccess,
  onCancel,
  onOpenBatchModal,
  onViewOrdinance,
}) => {
  // If user is focal person, restrict to their assigned barangay
  const defaultBarangay = initialCoordinates?.barangay || currentUser?.assignedBarangay || initialData?.barangay || barangays[0]?.name || 'Poblacion';

  // Dynamic Form Customization Schema loaded from shared storageService
  const [formSchema, setFormSchema] = useState<RegistryFormSchema>(() =>
    storageService.getRegistryFormSchema()
  );

  useEffect(() => {
    const handleSync = (e: any) => {
      const latest = e.detail || storageService.getRegistryFormSchema();
      setFormSchema(latest);
    };
    window.addEventListener('da_registry_schema_change', handleSync as EventListener);
    return () => {
      window.removeEventListener('da_registry_schema_change', handleSync as EventListener);
    };
  }, []);

  const getField = (fieldId: string): RegistryFormField | undefined => {
    for (const sec of formSchema.sections) {
      const f = sec.fields?.find(field => field.id === fieldId);
      if (f) return f;
    }
    return undefined;
  };

  const getSection = (secId: string): RegistryFormSection | undefined => {
    return formSchema.sections.find(s => s.id === secId);
  };

  // Immutable Pig ID Tag Generator: HIN-YYYY-XXXX
  // Retains existing ID tag on edit; generates sequential HIN-YYYY-XXXX for new record
  const [pigIdTag] = useState<string>(() => {
    if (initialData?.pigIdTag) return initialData.pigIdTag;
    if (initialData?.earTagNo && /^HIN-\d{4}-\d{4,}$/i.test(initialData.earTagNo)) {
      return initialData.earTagNo;
    }
    if (initialData?.earTagNo) {
      return initialData.earTagNo;
    }
    const existing = storageService.getSwineRecords();
    return generateNextPigIdTag(existing);
  });
  const [earTagNo] = useState<string>(pigIdTag);

  const [farmerName, setFarmerName] = useState(initialData?.farmerName || '');
  
  // Strict 11-digit Contact Number state
  const cleanInitialContact = (initialData?.farmerContact || '').replace(/\D/g, '').slice(0, 11);
  const [farmerContact, setFarmerContact] = useState<string>(cleanInitialContact);
  const [contactError, setContactError] = useState<string | null>(null);
  const [contactTouched, setContactTouched] = useState<boolean>(false);

  const [farmerAddress, setFarmerAddress] = useState(initialData?.farmerAddress || '');
  const [barangay, setBarangay] = useState(defaultBarangay);
  const [rsbsaId, setRsbsaId] = useState(initialData?.rsbsaId || '');
  const [farmType, setFarmType] = useState<'backyard' | 'commercial'>(initialData?.farmType || 'backyard');

  // Schema-driven farm and farmer state
  const [farmName, setFarmName] = useState<string>((initialData as any)?.farmName || '');
  const [farmClassification, setFarmClassification] = useState<string>(
    (initialData as any)?.farmClassification ||
      (initialData?.farmType === 'commercial' ? 'Commercial Breeder (50+ heads)' : 'Backyard (1-10 heads)')
  );
  const [penCapacity, setPenCapacity] = useState<string | number>((initialData as any)?.penCapacity || '');
  const [farmerEmail, setFarmerEmail] = useState<string>((initialData as any)?.email || (initialData as any)?.farmerEmail || '');
  const [farmerResidentialAddress, setFarmerResidentialAddress] = useState<string>((initialData as any)?.residentialAddress || '');
  const [asfClearanceStatus, setAsfClearanceStatus] = useState<string>((initialData as any)?.asfClearanceStatus || 'Cleared (Green Zone Active)');
  const [selectedOrdinanceCode, setSelectedOrdinanceCode] = useState<string>(() => {
    return (
      (initialData as any)?.customFields?.fld_governing_ordinance ||
      (initialData as any)?.customFields?.governingOrdinance ||
      (initialData as any)?.applicableOrdinanceNumber ||
      'Municipal Ordinance No. 2025-59 (Piggery & Poultry Regulation Ordinance - Baboyang Walang Amoy & Setbacks)'
    );
  });
  const [isOrdinanceExpanded, setIsOrdinanceExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Custom field values state for dynamic admin-created fields
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>(() => {
    const custom: Record<string, any> = { ...((initialData as any)?.customFields || {}) };
    
    // Always pre-fill schema defaults, fixed constant values, and autogenerated fields
    formSchema.sections.forEach(sec => {
      sec.fields.forEach(f => {
        if (f.isAutoGenerated) {
          if (!custom[f.id]) {
            custom[f.id] = generateFieldValue(f, { barangay: defaultBarangay });
          }
        } else if (f.isFixed && f.fixedValue !== undefined) {
          custom[f.id] = f.fixedValue;
        } else if (custom[f.id] === undefined && f.defaultValue !== undefined) {
          custom[f.id] = f.defaultValue;
        }
      });
    });

    if (initialData) {
      formSchema.sections.forEach(sec => {
        sec.fields.forEach(f => {
          const key = getFieldKey(f);
          if (custom[f.id] === undefined) {
            if (custom[key] !== undefined) {
              custom[f.id] = custom[key];
            } else if ((initialData as any)[key] !== undefined) {
              custom[f.id] = (initialData as any)[key];
            } else if ((initialData as any)[f.id] !== undefined) {
              custom[f.id] = (initialData as any)[f.id];
            }
          }
        });
      });
    }
    return custom;
  });

  const handleCustomFieldChange = (fieldId: string, val: any) => {
    setCustomFieldValues(prev => ({ ...prev, [fieldId]: val }));
  };

  // GIS Pen Coordinates & Setback Buffers
  const defaultBgObj = barangays.find(b => b.name === defaultBarangay) || barangays[0];
  const [latitude, setLatitude] = useState<number>(initialCoordinates?.latitude || initialData?.latitude || defaultBgObj?.latitude || 10.3969);
  const [longitude, setLongitude] = useState<number>(initialCoordinates?.longitude || initialData?.longitude || defaultBgObj?.longitude || 125.1999);
  const [showMapPicker, setShowMapPicker] = useState(true);
  const [allExistingSwine, setAllExistingSwine] = useState<SwineRecord[]>(() => storageService.getSwineRecords());

  // Setback Buffers
  const [distanceToWaterSource, setDistanceToWaterSource] = useState<number>(
    initialData?.distanceToWaterSourceMeters ?? 35
  );
  const [distanceToTourismSchool, setDistanceToTourismSchool] = useState<number>(
    initialData?.distanceToTourismSchoolMeters ?? 250
  );
  const [distanceToBuiltUp, setDistanceToBuiltUp] = useState<number>(
    initialData?.distanceToBuiltUpMeters ?? 60
  );

  // Automated swine Age (in Days), Automated Category & Weight
  const defaultBirthDate =
    initialData?.birthDate ||
    initialData?.dateOfBirth ||
    initialData?.date_of_birth ||
    initialData?.dob ||
    calculateBirthDateFromDays(initialData?.ageDays || 60);
  const [birthDate, setBirthDate] = useState<string>(defaultBirthDate);
  const [birthDateError, setBirthDateError] = useState<string | null>(null);

  // Dynamic age calculation from Birth Date against today (reactive)
  const ageCalculation = useMemo(() => {
    return calculateSwineAge(birthDate);
  }, [birthDate]);

  const ageDays = ageCalculation.isValid ? ageCalculation.days : (initialData?.ageDays || 0);
  const ageMonths = ageCalculation.isValid ? ageCalculation.months : (initialData?.ageMonths || 0);
  const ageWeeks = Math.round(ageDays / 7);

  // Automatic Estimated Weight Range based on Age in Days:
  // 0-30 days: 2–8 kg | 31-60 days: 8–20 kg | 61-120 days: 20–60 kg | 121+ days: 60–100+ kg
  const estimatedWeightRange = useMemo(() => {
    return getEstimatedWeightRange(ageDays);
  }, [ageDays]);

  // Actual Weight Kg (preserved separately from estimated weight range)
  const [actualWeightKg, setActualWeightKg] = useState<number | null>(
    initialData?.actualWeightKg !== undefined ? initialData.actualWeightKg : (initialData?.weightKg || null)
  );
  const [weightKg, setWeightKg] = useState<number>(
    initialData?.weightKg || (actualWeightKg ? Number(actualWeightKg) : 60)
  );

  const [swineType, setSwineType] = useState<SwineType>(initialData?.swineType || 'finisher');
  const [breed, setBreed] = useState(initialData?.breed || 'Landrace x Large White');
  const [gender, setGender] = useState<'male' | 'female' | 'castrated'>(initialData?.gender || 'castrated');
  const [status, setStatus] = useState<SwineRecord['status']>(initialData?.status || 'ready_to_sell');
  const [readyToSell, setReadyToSell] = useState<boolean>(initialData?.readyToSell ?? true);
  const [targetSellDate, setTargetSellDate] = useState(
    initialData?.targetSellDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );
  const [estimatedPricePhp, setEstimatedPricePhp] = useState<number>(
    initialData?.estimatedPricePhp || Math.round((initialData?.weightKg || 60) * 180)
  );
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [photoUrl, setPhotoUrl] = useState(initialData?.photoUrl || SAMPLE_SWINE_PHOTOS[0].url);

  // Matrix calculation states
  const [isMatrixModalOpen, setIsMatrixModalOpen] = useState(false);
  const [useTapeFormula, setUseTapeFormula] = useState(false);
  const [heartGirthCm, setHeartGirthCm] = useState<number>(initialData?.heartGirthCm || 105);
  const [bodyLengthCm, setBodyLengthCm] = useState<number>(initialData?.bodyLengthCm || 95);
  const [autoSyncMatrix, setAutoSyncMatrix] = useState(true);

  // Farm Scale Auto-Classification:
  // BACKYARD: 1-20 heads | COMMERCIAL_MEDIUM: 21-100 heads | COMMERCIAL_LARGE: 101+ heads
  const currentHeadCount = useMemo(() => {
    const parsed = Number(penCapacity);
    if (!isNaN(parsed) && parsed > 0) return parsed;
    return farmType === 'commercial' ? 50 : 5;
  }, [penCapacity, farmType]);

  const farmScale: FarmScale = useMemo(() => {
    return classifyFarmScale(currentHeadCount);
  }, [currentHeadCount]);

  // ASF Zone for selected Barangay: RED, PINK, YELLOW, GREEN
  const currentASFZone: ASFZone = useMemo(() => {
    return getBarangayASFZone(barangay, barangays);
  }, [barangay, barangays]);

  // Immediate Breeding Boar Warning logic in RED / PINK ASF Zone
  const showBoarASFWarning = useMemo(() => {
    return shouldShowASFWarning(swineType, currentASFZone);
  }, [swineType, currentASFZone]);

  const [biosecurityWarningAcknowledged, setBiosecurityWarningAcknowledged] = useState<boolean>(
    initialData?.biosecurityWarningAcknowledged ?? false
  );

  // Biosecurity Checklists
  const [biosecurity, setBiosecurity] = useState<BiosecurityChecklist>(
    initialData?.biosecurity || {
      perimeterFence: true,
      footbathInstalled: true,
      disinfectionRoutine: true,
      quarantinePenAvailable: true,
      potableWaterSource: true,
      standardFeedStorage: true,
      asfVaccinationOrTesting: true,
      noSwillFeeding: true,
      visitorLogbook: true,
      wasteLagoonOrCompost: false,
    }
  );

  // Dynamic form fields from admin configuration
  const dynamicFields = storageService.getDynamicFields();
  const biosecurityFields = dynamicFields.filter(f => f.section === 'biosecurity');

  // Automated ASF Biosecurity Standards & Compliance Percentage Calculation
  const standardBiosecurityKeys: (keyof BiosecurityChecklist)[] = [
    'perimeterFence',
    'footbathInstalled',
    'noSwillFeeding',
    'disinfectionRoutine',
    'potableWaterSource',
    'quarantinePenAvailable',
    'asfVaccinationOrTesting',
    'wasteLagoonOrCompost',
  ];
  const standardCheckedCount = standardBiosecurityKeys.filter(k => !!biosecurity[k]).length;
  const customCheckedCount = biosecurityFields.filter(f => !!biosecurity[f.id]).length;
  const totalBiosecurityChecked = standardCheckedCount + customCheckedCount;
  const totalBiosecurityStandards = standardBiosecurityKeys.length + biosecurityFields.length;
  const biosecurityPercentage = Math.round(
    (totalBiosecurityChecked / Math.max(1, totalBiosecurityStandards)) * 100
  );

  // Evaluate setbacks live
  const setbackAudit = evaluateSetbackBuffers(
    distanceToWaterSource,
    distanceToTourismSchool,
    distanceToBuiltUp
  );

  // Evaluate geographic exclusivity live
  const exclusivityAudit = validateHinunanganRegistration(
    Number(latitude),
    Number(longitude),
    barangay
  );

  // Immutable Tag: do not regenerate on barangay change!
  const handleBarangayChange = (newBg: string) => {
    setBarangay(newBg);
    const coords = getBarangayCoordinates(newBg);
    setLatitude(coords.latitude);
    setLongitude(coords.longitude);
  };

  // Re-center to Brgy GPS
  const handleRecenterToBrgyGps = () => {
    const coords = getBarangayCoordinates(barangay);
    setLatitude(coords.latitude);
    setLongitude(coords.longitude);
  };

  const handleGetLiveGps = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLatitude(Number(pos.coords.latitude.toFixed(6)));
        setLongitude(Number(pos.coords.longitude.toFixed(6)));
      },
      err => {
        alert('Could not acquire current GPS: ' + err.message);
      },
      { enableHighAccuracy: true }
    );
  };

  // Automated swine Age (in Days), Automated Category & Weight triggers
  const handleBirthDateChange = (newDate: string) => {
    setBirthDate(newDate);
    if (!newDate) {
      setBirthDateError(null);
      return;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(newDate);
    selected.setHours(0, 0, 0, 0);
    if (selected > today) {
      setBirthDateError('Date of birth cannot be in the future.');
      return;
    }
    const ageRes = calculateSwineAge(newDate);
    if (!ageRes.isValid) {
      setBirthDateError(ageRes.errorMessage || 'Date of birth cannot be in the future.');
    } else {
      setBirthDateError(null);
      if (autoSyncMatrix) {
        const benchmarkWeight = estimateWeightFromAgeDays(ageRes.totalDays || ageRes.days);
        setWeightKg(benchmarkWeight);
        setEstimatedPricePhp(calculateEstimatedMarketPrice(benchmarkWeight));
        const category = autoDetermineSwineCategory(ageRes.totalDays || ageRes.days, benchmarkWeight, gender);
        setSwineType(category);
      }
    }
  };

  const handleAgeDaysChange = (newDays: number) => {
    const validDays = Math.max(0, newDays);
    const calculatedBirth = calculateBirthDateFromDays(validDays);
    setBirthDate(calculatedBirth);
    setBirthDateError(null);

    if (autoSyncMatrix) {
      const benchmarkWeight = estimateWeightFromAgeDays(validDays);
      setWeightKg(benchmarkWeight);
      setEstimatedPricePhp(calculateEstimatedMarketPrice(benchmarkWeight));
      const category = autoDetermineSwineCategory(validDays, benchmarkWeight, gender);
      setSwineType(category);
    }
  };

  const handleApplyMatrixValues = (cat: SwineType, wt: number, daysOrWeeks: number) => {
    const days = daysOrWeeks > 50 ? daysOrWeeks : Math.round(daysOrWeeks * 7);
    setSwineType(cat);
    setWeightKg(wt);
    setBirthDate(calculateBirthDateFromDays(days));
    setBirthDateError(null);
    setEstimatedPricePhp(calculateEstimatedMarketPrice(wt));
  };

  const handleTapeCalculation = (girth: number, length: number) => {
    setHeartGirthCm(girth);
    setBodyLengthCm(length);
    if (girth > 0 && length > 0) {
      const calculatedWeight = calculateWeightFromTapeFormula(girth, length);
      setWeightKg(calculatedWeight);
      setEstimatedPricePhp(calculateEstimatedMarketPrice(calculatedWeight));
      const category = autoDetermineSwineCategory(Math.round(ageWeeks * 7), calculatedWeight, gender);
      setSwineType(category);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getSectionIcon = (secId: string, title: string) => {
    const t = (secId + ' ' + title).toLowerCase();
    if (t.includes('farm reg') || t.includes('piggery') || t.includes('facility') || secId === 'sec_farm') {
      return <Building2 className="w-5 h-5 text-emerald-700" />;
    }
    if (t.includes('farmer') || t.includes('raiser') || t.includes('owner') || secId === 'sec_farmer') {
      return <User className="w-5 h-5 text-emerald-700" />;
    }
    if (t.includes('swine') || t.includes('animal') || t.includes('livestock') || secId === 'sec_swine') {
      return <Tag className="w-5 h-5 text-emerald-700" />;
    }
    if (t.includes('bio') || t.includes('health') || t.includes('asf') || secId === 'sec_biosecurity') {
      return <ShieldCheck className="w-5 h-5 text-emerald-700" />;
    }
    if (t.includes('doc') || t.includes('cert') || secId === 'sec_documents') {
      return <BookOpen className="w-5 h-5 text-emerald-700" />;
    }
    if (t.includes('gps') || t.includes('loc') || t.includes('gis') || t.includes('additional') || secId === 'sec_additional') {
      return <MapPin className="w-5 h-5 text-emerald-700" />;
    }
    return <Layers className="w-5 h-5 text-emerald-700" />;
  };

  const renderFormField = (field: RegistryFormField, section: RegistryFormSection) => {
    if (field.visible === false) return null;

    // 1. Ear Tag / Pig ID Tag (Immutable format: HIN-YYYY-XXXX)
    if (field.id === 'fld_ear_tag') {
      return (
        <div key={field.id} className="sm:col-span-2">
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <label className="font-black text-emerald-950 text-xs">
                  {field.label} / Pig ID Tag
                </label>
                <span className="px-2 py-0.5 rounded-full bg-emerald-800 text-white font-black text-[10px] tracking-wide flex items-center gap-1 shadow-2xs">
                  <Lock className="w-2.5 h-2.5 text-emerald-300" /> Locked & Immutable
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-mono font-bold text-[10px] border border-emerald-200">
                  Format: HIN-YYYY-XXXX
                </span>
              </div>
              <p className="text-[11px] text-emerald-900 font-medium">
                Official Municipal Swine Registry ID Tag: <code>HIN-YYYY-XXXX</code> (e.g. <code>HIN-2026-0001</code>). Read-only and strictly immutable once assigned.
              </p>
            </div>
            <div className="relative">
              <input
                type="text"
                readOnly
                required={field.required}
                value={pigIdTag}
                className="px-3.5 py-2 pl-8 rounded-xl border border-emerald-300 font-mono font-black text-sm text-emerald-950 bg-emerald-100/70 cursor-not-allowed select-none shadow-inner"
                title="Pig ID Tag is immutable, read-only, and permanently assigned by the municipal registry"
              />
              <Lock className="w-3.5 h-3.5 text-emerald-700 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>
          {field.helpText && <p className="text-[10px] text-stone-500 mt-1">{field.helpText}</p>}
        </div>
      );
    }

    // 2. Primary Farmer Contact Phone
    if (field.id === 'fld_contact_phone') {
      return (
        <div key={field.id}>
          <ContactNumberInput
            id={`contact-input-${field.id}`}
            value={farmerContact}
            onChange={val => {
              setFarmerContact(val);
              if (contactTouched && !isValidContactNumber(val)) {
                setContactError(CONTACT_NUMBER_ERROR_MESSAGE);
              } else if (isValidContactNumber(val)) {
                setContactError(null);
              }
            }}
            label={field.label}
            required={field.required}
            placeholder={field.placeholder || '09123456789'}
            helpText={field.helpText || 'Contact number must contain exactly 11 digits.'}
            errorOverride={contactError}
          />
        </div>
      );
    }

    // 3. Barangay (barangay_select or fld_barangay)
    if (field.id === 'fld_barangay' || field.type === 'barangay_select') {
      return (
        <div key={field.id}>
          <div className="flex items-center justify-between mb-1">
            <label className="block font-bold text-stone-700">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <span
              className={`px-2 py-0.5 rounded-full font-black text-[10px] uppercase border ${
                currentASFZone === 'RED'
                  ? 'bg-red-100 text-red-800 border-red-300'
                  : currentASFZone === 'PINK'
                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                  : currentASFZone === 'YELLOW'
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-emerald-100 text-emerald-800 border-emerald-300'
              }`}
            >
              {currentASFZone} Zone {currentASFZone === 'RED' ? '(Infected)' : currentASFZone === 'PINK' ? '(Buffer)' : currentASFZone === 'YELLOW' ? '(Surveillance)' : '(Free)'}
            </span>
          </div>
          <select
            value={barangay}
            disabled={currentUser?.role === 'focal'}
            onChange={e => handleBarangayChange(e.target.value)}
            required={field.required}
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-hidden disabled:bg-stone-100 font-bold text-stone-800"
          >
            {barangays.map(b => {
              const bZone = getBarangayASFZone(b.name, barangays);
              return (
                <option key={b.id} value={b.name}>
                  Brgy. {b.name} ({bZone} Zone)
                </option>
              );
            })}
          </select>
          {currentUser?.role === 'focal' ? (
            <p className="text-[10px] text-blue-600 mt-1">Designated to your focal jurisdiction.</p>
          ) : field.helpText ? (
            <p className="text-[10px] text-stone-500 mt-1">{field.helpText}</p>
          ) : null}
        </div>
      );
    }

    // 4. Farmer Name
    if (field.id === 'fld_farmer_name') {
      return (
        <div key={field.id}>
          <label className="block font-bold text-stone-700 mb-1">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            required={field.required}
            value={farmerName}
            onChange={e => setFarmerName(e.target.value)}
            placeholder={field.placeholder || 'e.g. Juan D. Dela Cruz'}
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
          />
          {field.helpText && <p className="text-[10px] text-stone-500 mt-1">{field.helpText}</p>}
        </div>
      );
    }

    // 5. Farm Name
    if (field.id === 'fld_farm_name') {
      return (
        <div key={field.id}>
          <label className="block font-bold text-stone-700 mb-1">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            required={field.required}
            value={farmName}
            onChange={e => setFarmName(e.target.value)}
            placeholder={field.placeholder || 'e.g. San Isidro Heritage Swine Farm'}
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
          />
          {field.helpText && <p className="text-[10px] text-stone-500 mt-1">{field.helpText}</p>}
        </div>
      );
    }

    // 6. Farm Classification (with reactive Farm Scale Auto-Classification)
    if (field.id === 'fld_farm_classification') {
      const opts =
        field.options && field.options.length > 0
          ? field.options
          : ['Backyard (1-20 heads)', 'Commercial Medium (21-100 heads)', 'Commercial Large (101+ heads)'];
      return (
        <div key={field.id}>
          <div className="flex items-center justify-between mb-1">
            <label className="block font-bold text-stone-700">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <span
              className={`px-2 py-0.5 rounded-full font-black text-[10px] border ${
                farmScale === 'BACKYARD'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : farmScale === 'COMMERCIAL_MEDIUM'
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : 'bg-purple-50 text-purple-800 border-purple-300'
              }`}
            >
              {getFarmScaleLabel(farmScale)}
            </span>
          </div>
          <select
            value={farmClassification}
            onChange={e => {
              setFarmClassification(e.target.value);
              setFarmType(e.target.value.toLowerCase().includes('comm') ? 'commercial' : 'backyard');
              handleCustomFieldChange('fld_farm_classification', e.target.value);
            }}
            required={field.required}
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-hidden font-medium"
          >
            {opts.map((opt, i) => (
              <option key={i} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <p className="text-[10px] text-stone-500 mt-1">
            Scale: <strong>{getFarmScaleLabel(farmScale)}</strong> (Municipal Ordinance No. 2025-59)
          </p>
        </div>
      );
    }

    // 7. Sitio / Purok
    if (field.id === 'fld_sitio') {
      return (
        <div key={field.id} className="sm:col-span-2">
          <label className="block font-bold text-stone-700 mb-1">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            required={field.required}
            value={farmerAddress}
            onChange={e => setFarmerAddress(e.target.value)}
            placeholder={field.placeholder || 'e.g. Purok 3, Riverside'}
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
          />
          {field.helpText && <p className="text-[10px] text-stone-500 mt-1">{field.helpText}</p>}
        </div>
      );
    }

    // 8. Capacity / Head Count (updates Farm Scale reactively)
    if (field.id === 'fld_capacity') {
      return (
        <div key={field.id}>
          <div className="flex items-center justify-between mb-1">
            <label className="block font-bold text-stone-700">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <span
              className={`px-2 py-0.5 rounded-full font-black text-[10px] border ${
                farmScale === 'BACKYARD'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : farmScale === 'COMMERCIAL_MEDIUM'
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : 'bg-purple-50 text-purple-800 border-purple-300'
              }`}
            >
              {farmScale}
            </span>
          </div>
          <input
            type="number"
            min="1"
            max="5000"
            required={field.required}
            value={penCapacity}
            onChange={e => setPenCapacity(e.target.value)}
            placeholder={field.placeholder || 'e.g. 15'}
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 font-bold focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
          />
          <p className="text-[10px] text-stone-500 mt-1">
            Auto-Classified: <strong>{getFarmScaleLabel(farmScale)}</strong>
          </p>
        </div>
      );
    }

    // 9. RSBSA ID
    if (field.id === 'fld_rsbsa_id') {
      return (
        <div key={field.id}>
          <label className="block font-bold text-stone-700 mb-1">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            required={field.required}
            value={rsbsaId}
            onChange={e => setRsbsaId(e.target.value)}
            placeholder={field.placeholder || '08-64-07-001-XXXXXX'}
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 font-mono focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
          />
          {field.helpText && <p className="text-[10px] text-stone-500 mt-1">{field.helpText}</p>}
        </div>
      );
    }

    // 10. Email Address
    if (field.id === 'fld_email') {
      return (
        <div key={field.id}>
          <label className="block font-bold text-stone-700 mb-1">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <input
            type="email"
            required={field.required}
            value={farmerEmail}
            onChange={e => setFarmerEmail(e.target.value)}
            placeholder={field.placeholder || 'farmer@example.com'}
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
          />
          {field.helpText && <p className="text-[10px] text-stone-500 mt-1">{field.helpText}</p>}
        </div>
      );
    }

    // 11. Residential Address
    if (field.id === 'fld_residential_address') {
      return (
        <div key={field.id} className="sm:col-span-2">
          <label className="block font-bold text-stone-700 mb-1">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <textarea
            rows={2}
            required={field.required}
            value={farmerResidentialAddress}
            onChange={e => setFarmerResidentialAddress(e.target.value)}
            placeholder={field.placeholder || 'Purok, Barangay, Municipality'}
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
          />
          {field.helpText && <p className="text-[10px] text-stone-500 mt-1">{field.helpText}</p>}
        </div>
      );
    }

    // 12. Swine Breed (breed_select or fld_breed)
    if (field.id === 'fld_breed' || field.type === 'breed_select') {
      const breedOpts =
        field.options && field.options.length > 0
          ? field.options
          : [
              'Landrace x Large White',
              'Landrace',
              'Large White',
              'Duroc',
              'Pietrain',
              'Native / Black Pig',
              'Hybrid Cross / F1',
            ];
      return (
        <div key={field.id}>
          <label className="block font-bold text-stone-700 mb-1">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <input
            list={`breed-list-${field.id}`}
            required={field.required}
            value={breed}
            onChange={e => setBreed(e.target.value)}
            placeholder={field.placeholder || 'Select or type breed'}
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
          />
          <datalist id={`breed-list-${field.id}`}>
            {breedOpts.map((b, i) => (
              <option key={i} value={b} />
            ))}
          </datalist>
          {field.helpText && <p className="text-[10px] text-stone-500 mt-1">{field.helpText}</p>}
        </div>
      );
    }

    // 13. Swine Category
    if (field.id === 'fld_swine_category') {
      return (
        <div key={field.id}>
          <div className="flex items-center justify-between mb-1">
            <label className="font-bold text-stone-700">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            {showBoarASFWarning ? (
              <span className="text-[10px] text-red-700 bg-red-100 border border-red-300 px-2 py-0.5 rounded-full font-black flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-red-600" /> High Biosecurity Concern
              </span>
            ) : (
              <span className="text-[10px] text-emerald-700 font-black">Matrix Synced</span>
            )}
          </div>
          <select
            value={swineType}
            onChange={e => setSwineType(e.target.value as SwineType)}
            required={field.required}
            className={`w-full px-3.5 py-2.5 rounded-xl border bg-white focus:ring-2 font-bold text-stone-900 capitalize ${
              showBoarASFWarning ? 'border-red-400 focus:ring-red-500 bg-red-50/20' : 'border-stone-300 focus:ring-emerald-600'
            }`}
          >
            <option value="piglet">Piglet / Weanling (Biik)</option>
            <option value="grower">Grower (Lumalaki)</option>
            <option value="finisher">Finisher (Market Ready)</option>
            <option value="sow">Breeder Sow (Inahin)</option>
            <option value="boar">Breeder Boar (Barako - Barako Breeder)</option>
          </select>
          {showBoarASFWarning ? (
            <p className="text-[10px] text-red-600 font-bold mt-1">
              ⚠️ Strict movement prohibition & mandatory testing apply for boars in {currentASFZone} Zone.
            </p>
          ) : field.helpText ? (
            <p className="text-[10px] text-stone-500 mt-1">{field.helpText}</p>
          ) : null}
        </div>
      );
    }

    // 14. Weight (kg) with Automatic Estimated Weight Range & Preserved Actual Weight
    if (field.id === 'fld_weight_kg') {
      return (
        <div key={field.id}>
          <div className="flex items-center justify-between mb-1">
            <label className="font-bold text-stone-700">
              Live Weight (kg) {field.required && <span className="text-red-500">*</span>}
            </label>
            <span className="text-[10px] bg-emerald-50 text-emerald-800 font-black px-2 py-0.5 rounded-md border border-emerald-200">
              Estimated: {estimatedWeightRange}
            </span>
          </div>
          <input
            type="number"
            step="0.1"
            min="1"
            max="450"
            required={field.required}
            value={weightKg}
            onChange={e => {
              const wt = Number(e.target.value);
              setWeightKg(wt);
              setActualWeightKg(wt);
              setEstimatedPricePhp(calculateEstimatedMarketPrice(wt));
            }}
            placeholder={estimatedWeightRange}
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 font-mono font-black text-sm text-stone-900 focus:ring-2 focus:ring-emerald-600"
          />
          <div className="flex items-center justify-between text-[10px] text-stone-500 mt-1">
            <span>Age Benchmark: <strong className="text-emerald-800">{estimatedWeightRange}</strong> ({ageDays}d)</span>
            {actualWeightKg !== null ? (
              <span className="text-blue-700 font-bold">Actual Weight Recorded</span>
            ) : (
              <span className="text-stone-400">Derived from Matrix</span>
            )}
          </div>
        </div>
      );
    }

    // 15. Gender
    if (field.id === 'fld_gender') {
      return (
        <div key={field.id}>
          <label className="block font-bold text-stone-700 mb-1">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <select
            value={gender}
            onChange={e => {
              const g = e.target.value as 'male' | 'female' | 'castrated';
              setGender(g);
              if (autoSyncMatrix) {
                const cat = autoDetermineSwineCategory(ageDays, weightKg, g);
                setSwineType(cat);
              }
            }}
            required={field.required}
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white focus:ring-2 focus:ring-emerald-600 font-medium"
          >
            <option value="castrated">Castrated Male (Kapon)</option>
            <option value="female">Female</option>
            <option value="male">Intact Male (Barako)</option>
          </select>
          {field.helpText && <p className="text-[10px] text-stone-500 mt-1">{field.helpText}</p>}
        </div>
      );
    }

    // 16. Birth Date with Reactive Age Calculation and Validation
    if (field.id === 'fld_birth_date') {
      const todayStr = new Date().toISOString().split('T')[0];
      return (
        <div key={field.id} className="space-y-2">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-bold text-stone-700">
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </label>
              <span className="text-[10px] text-stone-500 font-semibold">
                Calendar-based DOB
              </span>
            </div>
            <input
              type="date"
              max={todayStr}
              required={field.required}
              value={birthDate}
              onChange={e => handleBirthDateChange(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl border bg-white focus:ring-2 font-semibold text-stone-900 ${
                birthDateError
                  ? 'border-red-500 focus:ring-red-500 bg-red-50/40 text-red-950'
                  : 'border-stone-300 focus:ring-emerald-600'
              }`}
            />
            {birthDateError && (
              <p className="text-[11px] font-bold text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                {birthDateError}
              </p>
            )}
          </div>

          {/* READ-ONLY Calculated Age Box */}
          <div className="bg-emerald-50/90 border border-emerald-300 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
            <div>
              <span className="text-[10px] font-black text-emerald-900 uppercase tracking-wider block">
                Calculated Age
              </span>
              <div className="text-sm sm:text-base font-black text-emerald-950 mt-0.5 flex items-center gap-2">
                <span>
                  {birthDateError
                    ? '—'
                    : ageCalculation.hasDob
                    ? ageCalculation.display
                    : 'Age unavailable — DOB not recorded'}
                </span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300 uppercase">
                  READ ONLY
                </span>
              </div>
            </div>
            <div className="text-[11px] text-emerald-800 font-medium">
              ● Continuously aging from DOB
            </div>
          </div>
        </div>
      );
    }

    // 17. Swine Photo
    if (field.id === 'fld_swine_photo') {
      return (
        <div key={field.id} className="sm:col-span-2 md:col-span-3">
          <label className="block font-bold text-stone-700 mb-2">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <label className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold px-4 py-2.5 rounded-xl border border-emerald-300 cursor-pointer flex items-center gap-2 transition">
                  <Upload className="w-4 h-4" />
                  <span>Upload / Snap Photo</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
              <div className="space-y-1">
                <span className="text-[11px] text-stone-500 font-medium">Quick sample catalog photo:</span>
                <div className="flex flex-wrap gap-1.5">
                  {SAMPLE_SWINE_PHOTOS.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPhotoUrl(item.url)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border cursor-pointer transition ${
                        photoUrl === item.url
                          ? 'bg-emerald-700 text-white border-emerald-700'
                          : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-300'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <div className="w-full h-36 rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 flex items-center justify-center overflow-hidden relative shadow-inner">
                {photoUrl ? (
                  <img src={photoUrl} alt="Swine Preview" className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  <span className="text-stone-400 font-medium">No photo selected</span>
                )}
                <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-xs text-white px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1.5">
                  <Tag className="w-3 h-3 text-emerald-400" />
                  <span>{earTagNo}</span>
                </div>
              </div>
            </div>
          </div>
          {field.helpText && <p className="text-[10px] text-stone-500 mt-1">{field.helpText}</p>}
        </div>
      );
    }

    // 18. Biosecurity Checklists
    if (field.id === 'fld_fence_installed') {
      return (
        <label
          key={field.id}
          className="flex items-start gap-2.5 p-3.5 rounded-2xl border border-stone-200 hover:bg-stone-50 cursor-pointer transition"
        >
          <input
            type="checkbox"
            checked={biosecurity.perimeterFence}
            onChange={e => setBiosecurity({ ...biosecurity, perimeterFence: e.target.checked })}
            className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-stone-300 focus:ring-emerald-500"
          />
          <div>
            <span className="font-bold text-stone-900">{field.label}</span>
            <p className="text-[11px] text-stone-500">{field.helpText || 'Enclosed pen barrier preventing stray animals.'}</p>
          </div>
        </label>
      );
    }

    if (field.id === 'fld_footbath_active') {
      return (
        <label
          key={field.id}
          className="flex items-start gap-2.5 p-3.5 rounded-2xl border border-stone-200 hover:bg-stone-50 cursor-pointer transition"
        >
          <input
            type="checkbox"
            checked={biosecurity.footbathInstalled}
            onChange={e => setBiosecurity({ ...biosecurity, footbathInstalled: e.target.checked })}
            className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-stone-300 focus:ring-emerald-500"
          />
          <div>
            <span className="font-bold text-stone-900">{field.label}</span>
            <p className="text-[11px] text-stone-500">{field.helpText || 'Active chemical or lime footbath at entrance.'}</p>
          </div>
        </label>
      );
    }

    if (field.id === 'fld_no_swill_ban') {
      return (
        <label
          key={field.id}
          className="flex items-start gap-2.5 p-3.5 rounded-2xl border border-emerald-300 bg-emerald-50/40 hover:bg-emerald-50 cursor-pointer transition"
        >
          <input
            type="checkbox"
            checked={biosecurity.noSwillFeeding}
            onChange={e => setBiosecurity({ ...biosecurity, noSwillFeeding: e.target.checked })}
            className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-stone-300 focus:ring-emerald-500"
          />
          <div>
            <span className="font-bold text-emerald-950">{field.label}</span>
            <p className="text-[11px] text-emerald-900">
              {field.helpText || 'Strictly prohibits feeding restaurant scraps/kanin-baboy under Section 3 of EO 12-2023.'}
            </p>
          </div>
        </label>
      );
    }

    if (field.id === 'fld_asf_clearance_status') {
      const asfOpts =
        field.options && field.options.length > 0
          ? field.options
          : ['Cleared (Green Zone Active)', 'Buffer Monitored (Yellow Zone)', 'Quarantined / Observation (Red Zone)'];
      return (
        <div key={field.id}>
          <label className="block font-bold text-stone-700 mb-1">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <select
            value={asfClearanceStatus}
            onChange={e => setAsfClearanceStatus(e.target.value)}
            required={field.required}
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
          >
            {asfOpts.map((opt, i) => (
              <option key={i} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          {field.helpText && <p className="text-[10px] text-stone-500 mt-1">{field.helpText}</p>}
        </div>
      );
    }

    if (field.id === 'fld_health_notes') {
      return (
        <div key={field.id} className="sm:col-span-2 md:col-span-3">
          <label className="block font-bold text-stone-700 mb-1">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder={field.placeholder || 'e.g. Swine is healthy and active. Inspected by Barangay Focal Person.'}
            required={field.required}
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
          />
          {field.helpText && <p className="text-[10px] text-stone-500 mt-1">{field.helpText}</p>}
        </div>
      );
    }

    // 18.5 Governing Legal Ordinance & Decrees Combo Box
    if (field.id === 'fld_governing_ordinance' || field.id === 'governingOrdinance') {
      const ordinanceList = [
        {
          id: 'mo-2025-59',
          title: 'Municipal Ordinance No. 2025-59',
          knownAs: 'Comprehensive Piggery and Poultry Regulation Ordinance of Hinunangan, Southern Leyte',
          fullText: 'Municipal Ordinance No. 2025-59 (Piggery & Poultry Regulation Ordinance - Baboyang Walang Amoy & Setbacks)',
          author: 'Hon. Gezar S. Ngoho (SB Hinunangan)',
          enacted: 'March 3, 2025',
          backyardSetback: '50 meters',
          commercialSetback: '100 meters',
          waterSetback: '25 meters',
          penalties: 'Up to ₱2,500.00 fine, pen closure & revocation of permit',
          description: 'Revises Municipal Ordinance No. 2000-02; mandates "Baboyang Walang Amoy" odorless pen systems, minimum 25m water buffer, and creates the Municipal Livestock Task Force (MLTF).',
        },
        {
          id: 'res-376-2026',
          title: 'Resolution No. 376 Series of 2026',
          knownAs: 'Resolution Requesting Local Breeders & Backyard Raisers to Register with OMAS',
          fullText: 'Resolution No. 376 Series of 2026 (Local Breeders & Backyard Raisers Registration with OMAS)',
          author: 'Sangguniang Bayan of Hinunangan',
          enacted: 'January 14, 2026',
          backyardSetback: 'RSBSA Standard',
          commercialSetback: 'RSBSA Standard',
          waterSetback: '25 meters',
          penalties: 'Ineligibility for municipal veterinary support, feed subsidies & indemnification',
          description: 'Encourages and facilitates mandatory registry of all backyard swine raisers, breeders, and smallholders within the 40 barangays of Hinunangan.',
        },
        {
          id: 'po-2023-144',
          title: 'Provincial Ordinance No. 2023-144',
          knownAs: 'Southern Leyte Provincial Bantay ASF Ordinance',
          fullText: 'Provincial Ordinance No. 2023-144 (Southern Leyte Provincial Bantay ASF Ordinance)',
          author: 'Sangguniang Panlalawigan of Southern Leyte',
          enacted: 'October 11, 2023',
          backyardSetback: '50 meters',
          commercialSetback: '100 meters',
          waterSetback: '25 meters',
          penalties: '₱5,000.00 fine, livestock confiscation & 6 months imprisonment',
          description: 'Establishes province-wide ASF bio-security perimeters, inter-municipal hog transit restrictions, and checkpoint quarantine inspections.',
        },
        {
          id: 'eo-12-2023',
          title: 'Municipal Executive Order No. 12-2023',
          knownAs: 'Hinunangan ASF Strict Border Disinfection & Biosecurity Protocols',
          fullText: 'Municipal Executive Order No. 12-2023 (Hinunangan ASF Border Disinfection & Biosecurity Protocols)',
          author: 'Office of the Municipal Mayor',
          enacted: 'June 5, 2023',
          backyardSetback: 'Perimeter Barrier',
          commercialSetback: 'Disinfection Gate',
          waterSetback: '25 meters',
          penalties: 'Summary quarantine impoundment at municipal entry borders',
          description: 'Mandates active disinfectant footbaths, vehicular wheel spraying at municipal borders, and strictly bans all restaurant swill feeding (kanin-baboy).',
        },
        {
          id: 'po-2021-018',
          title: 'Provincial Ordinance No. 2021-018',
          knownAs: 'Swine Biosecurity & Inter-Barangay Movement Permitting',
          fullText: 'Provincial Ordinance No. 2021-018 (Swine Biosecurity & Inter-Barangay Movement Permitting)',
          author: 'Sangguniang Panlalawigan of Southern Leyte',
          enacted: 'September 20, 2021',
          backyardSetback: '50 meters',
          commercialSetback: '100 meters',
          waterSetback: '25 meters',
          penalties: '₱3,000.00 administrative penalty & transport pass revocation',
          description: 'Regulates shipping permits, veterinary health certificates, and animal transport compliance across all southern Leyte municipalities.',
        },
      ];

      const currentDoc =
        ordinanceList.find(
          d =>
            d.fullText === selectedOrdinanceCode ||
            d.title === selectedOrdinanceCode ||
            d.id === selectedOrdinanceCode
        ) || ordinanceList[0];

      return (
        <div key={field.id} className="sm:col-span-2 md:col-span-3 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-stone-100 pb-2">
            <div>
              <label className="font-black text-stone-900 text-xs flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-emerald-700" />
                <span>{field.label}</span>
                {field.required && <span className="text-red-500">*</span>}
              </label>
              <p className="text-[11px] text-stone-500 mt-0.5">
                {field.helpText || 'Select statutory mandate and zoning setback standards enforced for this swine farm.'}
              </p>
            </div>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
              Statutory Basis for Inspection & Zoning
            </span>
          </div>

          {/* Ordinance Combo Box Selection */}
          <div className="relative">
            <select
              value={selectedOrdinanceCode}
              onChange={e => {
                const val = e.target.value;
                setSelectedOrdinanceCode(val);
                handleCustomFieldChange(field.id, val);
                handleCustomFieldChange('fld_governing_ordinance', val);
                handleCustomFieldChange('governingOrdinance', val);
              }}
              required={field.required}
              className="w-full px-4 py-3 rounded-2xl border-2 border-emerald-600/30 bg-white font-bold text-xs text-stone-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 focus:outline-hidden transition shadow-xs"
            >
              {ordinanceList.map(ord => (
                <option key={ord.id} value={ord.fullText}>
                  {ord.title} — {ord.knownAs}
                </option>
              ))}
            </select>
          </div>

          {/* Interactive Statutory Details Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/90 via-teal-50/50 to-stone-50 border border-emerald-200/90 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-200">
                    {currentDoc.title}
                  </span>
                  <span className="text-[10px] text-stone-500">
                    Enacted: <strong>{currentDoc.enacted}</strong>
                  </span>
                </div>
                <h4 className="font-black text-xs text-stone-900 mt-1">{currentDoc.knownAs}</h4>
                <p className="text-[11px] text-stone-600 mt-0.5 leading-relaxed">
                  Authority: <strong>{currentDoc.author}</strong> • {currentDoc.description}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                <button
                  type="button"
                  onClick={() => setIsOrdinanceExpanded(prev => !prev)}
                  className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 font-bold text-[11px] flex items-center gap-1 shadow-2xs transition cursor-pointer"
                >
                  <Info className="w-3.5 h-3.5 text-stone-500" />
                  <span>{isOrdinanceExpanded ? 'Hide Specs' : 'Setback Specs'}</span>
                </button>

                {onViewOrdinance && (
                  <button
                    type="button"
                    onClick={onViewOrdinance}
                    className="px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-emerald-200" />
                    <span>Inspect Full Law</span>
                  </button>
                )}
              </div>
            </div>

            {/* Setback and Penalty Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-emerald-200/60 text-center">
              <div className="p-2 rounded-xl bg-white/90 border border-emerald-100">
                <span className="text-[10px] text-stone-500 font-semibold block">Backyard Buffer</span>
                <span className="text-xs font-black text-emerald-950 block">{currentDoc.backyardSetback}</span>
              </div>
              <div className="p-2 rounded-xl bg-white/90 border border-emerald-100">
                <span className="text-[10px] text-stone-500 font-semibold block">Commercial Buffer</span>
                <span className="text-xs font-black text-emerald-950 block">{currentDoc.commercialSetback}</span>
              </div>
              <div className="p-2 rounded-xl bg-white/90 border border-emerald-100">
                <span className="text-[10px] text-stone-500 font-semibold block">Waterbody Buffer</span>
                <span className="text-xs font-black text-emerald-950 block">{currentDoc.waterSetback}</span>
              </div>
              <div className="p-2 rounded-xl bg-white/90 border border-emerald-100">
                <span className="text-[10px] text-red-700 font-semibold block">Statutory Penalty</span>
                <span className="text-[11px] font-black text-red-800 block truncate" title={currentDoc.penalties}>
                  {currentDoc.penalties.split(',')[0]}
                </span>
              </div>
            </div>

            {/* Expandable Key Provisions */}
            {isOrdinanceExpanded && (
              <div className="p-3 bg-white/95 rounded-xl border border-emerald-100 text-[11px] space-y-1 text-stone-700">
                <p className="font-bold text-emerald-950 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Hinunangan Municipal Enforcement Note:
                </p>
                <p className="text-stone-600">
                  Registration of this swine record binds the raiser to environmental inspection by the Municipal Livestock Task Force (MLTF), sanitary inspection by the Municipal Health Officer, and adherence to minimum buffer setbacks from public roads, tourist spots, and educational institutions.
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    // 19. GPS Coordinates
    if (field.id === 'fld_gps_coordinates' || field.type === 'gps') {
      return (
        <div key={field.id} className="sm:col-span-2 md:col-span-3 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
            <div>
              <label className="font-bold text-stone-900 text-sm block">
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </label>
              <span className="text-[11px] text-stone-500">
                {field.helpText || 'GPS pen coordinates under Hinunangan Municipal EO 12-2023'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRecenterToBrgyGps}
                className="bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                title="Reset coordinates to official Barangay centroid GPS"
              >
                <RefreshCw className="w-3.5 h-3.5 text-stone-600" />
                <span>Re-center to Brgy GPS</span>
              </button>
              <button
                type="button"
                onClick={handleGetLiveGps}
                className="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-300 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>Current GPS</span>
              </button>
            </div>
          </div>

          {/* Territory Verification Banner */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              exclusivityAudit.isValidLocation
                ? 'bg-emerald-50/60 border-emerald-300'
                : 'bg-red-50/90 border-red-300 ring-2 ring-red-400'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-start gap-2.5">
                {exclusivityAudit.isValidLocation ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-black uppercase tracking-wide ${
                        exclusivityAudit.isValidLocation ? 'text-emerald-950' : 'text-red-950'
                      }`}
                    >
                      {exclusivityAudit.isValidLocation
                        ? '✓ Geographic Exclusivity Verified: Inside Hinunangan Territory'
                        : '🚫 Out of Bounds: Outside Municipality of Hinunangan'}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        exclusivityAudit.isValidLocation
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-200 text-red-900 animate-pulse'
                      }`}
                    >
                      {exclusivityAudit.isValidLocation ? 'Exclusive to Hinunangan' : 'Registration Prohibited'}
                    </span>
                  </div>
                  <p
                    className={`text-[11px] mt-1 ${
                      exclusivityAudit.isValidLocation ? 'text-emerald-800' : 'text-red-800 font-medium'
                    }`}
                  >
                    {exclusivityAudit.isValidLocation
                      ? `Pen coordinates fall within official Hinunangan municipal territory. Nearest registered centroid: Brgy. ${exclusivityAudit.closestBarangay} (${exclusivityAudit.distanceToBarangayCenterKm} km away).`
                      : exclusivityAudit.errorMessage ||
                        'GPS location is outside Hinunangan. Cannot register animals from other municipalities or provinces.'}
                  </p>
                </div>
              </div>

              {!exclusivityAudit.isValidLocation && (
                <button
                  type="button"
                  onClick={handleRecenterToBrgyGps}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs shrink-0 flex items-center gap-1.5 transition cursor-pointer self-start sm:self-center"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Snap to Brgy. {barangay} GPS</span>
                </button>
              )}
            </div>
          </div>

          {/* Manual Pin & GPS Coordinate Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-emerald-50/70 border border-emerald-200/80 px-3.5 py-2.5 rounded-xl">
            <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-600" />
              Manual Pin & GPS Geolocation Setup
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowMapPicker(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg shadow-xs flex items-center gap-1 transition cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Click Map to Drop Pin</span>
              </button>
              <button
                type="button"
                onClick={handleGetLiveGps}
                className="bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 font-bold text-[11px] px-3 py-1.5 rounded-lg shadow-xs flex items-center gap-1 transition cursor-pointer"
              >
                <Crosshair className="w-3.5 h-3.5 text-emerald-600" />
                <span>My Current GPS</span>
              </button>
            </div>
          </div>

          {/* Latitude & Longitude Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-stone-700 mb-1">
                Latitude (GPS) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.000001"
                required
                value={latitude}
                onChange={e => setLatitude(Number(e.target.value))}
                placeholder="10.3969"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 font-mono font-bold text-stone-900 bg-stone-50/50 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">
                Longitude (GPS) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.000001"
                required
                value={longitude}
                onChange={e => setLongitude(Number(e.target.value))}
                placeholder="125.1999"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 font-mono font-bold text-stone-900 bg-stone-50/50 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Environmental & Zoning Setbacks */}
          <div className="pt-2 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-stone-800 text-xs uppercase tracking-wide">
                Mandatory Physical Setback Distances (Zoning & Clean Water Act)
              </span>
              <span className="text-[11px] text-stone-500">Must satisfy minimum legal clearances</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Water Source */}
              <div
                className={`p-4 rounded-2xl border transition-all ${
                  setbackAudit.waterCompliant
                    ? 'bg-emerald-50/40 border-emerald-300'
                    : 'bg-red-50/60 border-red-300 ring-1 ring-red-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Droplets className="w-4 h-4 text-blue-600" />
                    <label className="font-black text-stone-900">Distance to Water Source (m)</label>
                  </div>
                  {setbackAudit.waterCompliant ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                </div>
                <div className="text-[11px] font-bold text-stone-500 mb-2">
                  Min required: <strong className="text-stone-900">&gt;25m</strong>
                </div>
                <input
                  type="number"
                  min="1"
                  max="5000"
                  value={distanceToWaterSource}
                  onChange={e => setDistanceToWaterSource(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono font-bold bg-white text-stone-900 focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              {/* School / Tourism */}
              <div
                className={`p-4 rounded-2xl border transition-all ${
                  setbackAudit.tourismSchoolCompliant
                    ? 'bg-emerald-50/40 border-emerald-300'
                    : 'bg-red-50/60 border-red-300 ring-1 ring-red-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <School className="w-4 h-4 text-purple-600" />
                    <label className="font-black text-stone-900">Distance to School/Tourism (m)</label>
                  </div>
                  {setbackAudit.tourismSchoolCompliant ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                </div>
                <div className="text-[11px] font-bold text-stone-500 mb-2">
                  Min required: <strong className="text-stone-900">&gt;200m</strong>
                </div>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={distanceToTourismSchool}
                  onChange={e => setDistanceToTourismSchool(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono font-bold bg-white text-stone-900 focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              {/* Built-up */}
              <div
                className={`p-4 rounded-2xl border transition-all ${
                  setbackAudit.builtUpCompliant
                    ? 'bg-emerald-50/40 border-emerald-300'
                    : 'bg-red-50/60 border-red-300 ring-1 ring-red-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Home className="w-4 h-4 text-amber-600" />
                    <label className="font-black text-stone-900">Distance to Built-up (m)</label>
                  </div>
                  {setbackAudit.builtUpCompliant ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                </div>
                <div className="text-[11px] font-bold text-stone-500 mb-2">
                  Min required: <strong className="text-stone-900">&gt;50m</strong>
                </div>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={distanceToBuiltUp}
                  onChange={e => setDistanceToBuiltUp(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono font-bold bg-white text-stone-900 focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </div>
          </div>

          {/* Live GIS Map View & Farm Pin Locator */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  Live Map View & Pen Geolocation (Click map to position pen)
                </span>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Live GIS View
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowMapPicker(!showMapPicker)}
                className="text-xs text-stone-500 hover:text-stone-800 font-semibold cursor-pointer"
              >
                {showMapPicker ? 'Collapse Map' : 'Expand Map View'}
              </button>
            </div>

            {showMapPicker && (
              <div className="mt-1 rounded-2xl overflow-hidden border border-stone-300 shadow-sm relative">
                <GisMap
                  swineList={allExistingSwine}
                  barangays={barangays}
                  selectedBarangay={barangay}
                  currentUser={currentUser}
                  currentRole={currentUser?.role || 'admin'}
                  isLocationPicker={true}
                  initialCenter={[latitude, longitude]}
                  onPickLocation={(lat, lng, closestBg) => {
                    if (!isPointInsideHinunangan(lat, lng)) {
                      alert('Selected location is outside Hinunangan municipal territory.');
                      return;
                    }
                    setLatitude(Number(lat.toFixed(6)));
                    setLongitude(Number(lng.toFixed(6)));
                    if (closestBg && currentUser?.role !== 'focal') {
                      setBarangay(closestBg);
                    }
                  }}
                />
              </div>
            )}
          </div>
        </div>
      );
    }

    // 20. Ready to Sell
    if (field.id === 'fld_ready_to_sell') {
      return (
        <div
          key={field.id}
          className="sm:col-span-2 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-3"
        >
          <label className="flex items-center gap-2 cursor-pointer font-bold text-amber-900">
            <input
              type="checkbox"
              checked={readyToSell}
              onChange={e => {
                setReadyToSell(e.target.checked);
                if (e.target.checked) setStatus('ready_to_sell');
              }}
              className="w-4 h-4 text-amber-600 rounded border-amber-400 focus:ring-amber-500"
            />
            <span>{field.label}</span>
          </label>
          {field.helpText && <span className="text-[10px] text-amber-800">{field.helpText}</span>}
        </div>
      );
    }

    // 21. Estimated Price
    if (field.id === 'fld_estimated_price') {
      return (
        <div key={field.id}>
          <label className="block font-bold text-stone-700 mb-1">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <input
            type="number"
            step="50"
            required={field.required}
            value={estimatedPricePhp}
            onChange={e => setEstimatedPricePhp(Number(e.target.value))}
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 font-mono font-black text-sm text-emerald-900 bg-emerald-50/30 focus:ring-2 focus:ring-emerald-600"
          />
          <span className="text-[10px] text-emerald-700 font-medium mt-1 block">
            {field.helpText || '₱180/kg municipal farmgate'}
          </span>
        </div>
      );
    }

    // 22. Target Sell Date
    if (field.id === 'fld_target_sell_date') {
      return (
        <div key={field.id}>
          <label className="block font-bold text-stone-700 mb-1">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <input
            type="date"
            required={field.required}
            value={targetSellDate}
            onChange={e => setTargetSellDate(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white focus:ring-2 focus:ring-emerald-600 font-bold text-stone-800"
          />
          {field.helpText && <p className="text-[10px] text-stone-500 mt-1">{field.helpText}</p>}
        </div>
      );
    }

    // 23. Phone number dynamic custom fields
    if (field.type === 'phone' && field.id !== 'fld_contact_phone') {
      const rawVal = customFieldValues[field.id] || '';
      return (
        <div key={field.id}>
          <ContactNumberInput
            id={`phone-${field.id}`}
            value={rawVal}
            onChange={val => handleCustomFieldChange(field.id, val)}
            label={field.label}
            required={field.required}
            placeholder={field.placeholder || '917 123 4567'}
            helpText={field.helpText}
          />
        </div>
      );
    }

    // 24. File upload fields (e.g. fld_brgy_clearance_file, fld_vet_cert_file, or type === 'file')
    if (field.type === 'file') {
      const fileName = customFieldValues[field.id];
      return (
        <div key={field.id} className="sm:col-span-2">
          <label className="block font-bold text-stone-700 mb-1">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <div className="flex items-center gap-3">
            <label className="bg-stone-50 hover:bg-stone-100 text-stone-800 font-bold px-3.5 py-2 rounded-xl border border-stone-300 cursor-pointer flex items-center gap-2 transition text-xs">
              <Upload className="w-4 h-4 text-emerald-600" />
              <span>Upload Document</span>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.png"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleCustomFieldChange(field.id, file.name);
                  }
                }}
                className="hidden"
              />
            </label>
            {fileName ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                  📎 {fileName}
                </span>
                <button
                  type="button"
                  onClick={() => handleCustomFieldChange(field.id, '')}
                  className="text-red-500 text-[11px] hover:underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <span className="text-[11px] text-stone-400">No document attached</span>
            )}
          </div>
          {field.helpText && <p className="text-[10px] text-stone-500 mt-1">{field.helpText}</p>}
        </div>
      );
    }

    // 24. Image upload fields (not fld_swine_photo)
    if (field.type === 'image') {
      const imgData = customFieldValues[field.id];
      return (
        <div key={field.id} className="sm:col-span-2">
          <label className="block font-bold text-stone-700 mb-1">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <div className="flex items-center gap-3">
            <label className="bg-stone-50 hover:bg-stone-100 text-stone-800 font-bold px-3.5 py-2 rounded-xl border border-stone-300 cursor-pointer flex items-center gap-2 transition text-xs">
              <Camera className="w-4 h-4 text-emerald-600" />
              <span>Choose Photo</span>
              <input
                type="file"
                accept="image/*"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      handleCustomFieldChange(field.id, reader.result as string);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="hidden"
              />
            </label>
            {imgData ? (
              <div className="flex items-center gap-2">
                <img
                  src={imgData}
                  alt={field.label}
                  className="w-10 h-10 rounded-xl object-cover border border-emerald-500 shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => handleCustomFieldChange(field.id, '')}
                  className="text-red-500 text-[11px] hover:underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <span className="text-[11px] text-stone-400">No image attached</span>
            )}
          </div>
          {field.helpText && <p className="text-[10px] text-stone-500 mt-1">{field.helpText}</p>}
        </div>
      );
    }

    // 25. Textarea
    if (field.type === 'textarea') {
      const isFixed = !!field.isFixed;
      const textVal = isFixed
        ? (field.fixedValue ?? (typeof field.defaultValue === 'string' ? field.defaultValue : ''))
        : (customFieldValues[field.id] || '');
      return (
        <div key={field.id} className="sm:col-span-2">
          <div className="flex items-center justify-between mb-1">
            <label className="block font-bold text-stone-700">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            {isFixed && (
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
                <Lock className="w-2.5 h-2.5" /> Fixed Text
              </span>
            )}
          </div>
          <div className="relative">
            <textarea
              rows={3}
              readOnly={isFixed}
              value={textVal}
              onChange={e => !isFixed && handleCustomFieldChange(field.id, e.target.value)}
              placeholder={field.placeholder || ''}
              required={field.required}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-hidden transition ${
                isFixed
                  ? 'bg-stone-100/80 border-blue-200 text-stone-800 font-semibold cursor-not-allowed select-none shadow-inner'
                  : 'border-stone-300 focus:ring-2 focus:ring-emerald-600 bg-white'
              }`}
            />
          </div>
          {field.helpText && <p className="text-[10px] text-stone-500 mt-1">{field.helpText}</p>}
        </div>
      );
    }

    // 26. Dropdown
    if (field.type === 'dropdown') {
      const isFixed = !!field.isFixed;
      const selectVal = isFixed
        ? (field.fixedValue ?? field.defaultValue ?? '')
        : (customFieldValues[field.id] ?? field.defaultValue ?? '');
      return (
        <div key={field.id}>
          <div className="flex items-center justify-between mb-1">
            <label className="block font-bold text-stone-700">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            {isFixed && (
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
                <Lock className="w-2.5 h-2.5" /> Fixed Value
              </span>
            )}
          </div>
          <select
            value={selectVal}
            disabled={isFixed}
            onChange={e => !isFixed && handleCustomFieldChange(field.id, e.target.value)}
            required={field.required}
            className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-hidden transition font-medium ${
              isFixed
                ? 'bg-stone-100/80 border-blue-200 text-stone-800 cursor-not-allowed select-none'
                : 'border-stone-300 bg-white focus:ring-2 focus:ring-emerald-600'
            }`}
          >
            <option value="">Select option...</option>
            {field.options?.map((opt, idx) => (
              <option key={idx} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          {field.helpText && <p className="text-[10px] text-stone-500 mt-1">{field.helpText}</p>}
        </div>
      );
    }

    // 27. Radio buttons
    if (field.type === 'radio') {
      const isFixed = !!field.isFixed;
      return (
        <div key={field.id} className="sm:col-span-2">
          <div className="flex items-center justify-between mb-1">
            <label className="block font-bold text-stone-700">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            {isFixed && (
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
                <Lock className="w-2.5 h-2.5" /> Fixed
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-1">
            {field.options?.map((opt, idx) => (
              <label key={idx} className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-stone-800">
                <input
                  type="radio"
                  disabled={isFixed}
                  name={`radio-${field.id}`}
                  value={opt}
                  checked={
                    isFixed
                      ? opt === (field.fixedValue || field.defaultValue)
                      : (customFieldValues[field.id] === opt || (!customFieldValues[field.id] && field.defaultValue === opt))
                  }
                  onChange={() => !isFixed && handleCustomFieldChange(field.id, opt)}
                  className="w-3.5 h-3.5 text-emerald-600 focus:ring-emerald-500 disabled:opacity-50"
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
          {field.helpText && <p className="text-[10px] text-stone-500 mt-1">{field.helpText}</p>}
        </div>
      );
    }

    // 28. Yes/No buttons
    if (field.type === 'yes_no') {
      const isFixed = !!field.isFixed;
      const val = isFixed
        ? (field.fixedValue === 'true' || field.fixedValue === 'yes' || field.defaultValue === true)
        : customFieldValues[field.id];
      return (
        <div key={field.id}>
          <div className="flex items-center justify-between mb-1">
            <label className="block font-bold text-stone-700">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            {isFixed && (
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
                <Lock className="w-2.5 h-2.5" /> Fixed
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <button
              type="button"
              disabled={isFixed}
              onClick={() => !isFixed && handleCustomFieldChange(field.id, true)}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs border transition ${
                val === true
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                  : 'bg-stone-50 text-stone-700 border-stone-300 hover:bg-stone-100 disabled:opacity-40'
              }`}
            >
              Yes
            </button>
            <button
              type="button"
              disabled={isFixed}
              onClick={() => !isFixed && handleCustomFieldChange(field.id, false)}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs border transition ${
                val === false
                  ? 'bg-red-700 text-white border-red-700 shadow-2xs'
                  : 'bg-stone-50 text-stone-700 border-stone-300 hover:bg-stone-100 disabled:opacity-40'
              }`}
            >
              No
            </button>
          </div>
          {field.helpText && <p className="text-[10px] text-stone-500 mt-1">{field.helpText}</p>}
        </div>
      );
    }

    // 29. Checkbox
    if (field.type === 'checkbox') {
      const isFixed = !!field.isFixed;
      const checkedVal = isFixed
        ? (field.fixedValue === 'true' || field.defaultValue === true)
        : !!customFieldValues[field.id];
      return (
        <div key={field.id} className="sm:col-span-2">
          <label className="flex items-center gap-2 mt-2 cursor-pointer">
            <input
              type="checkbox"
              disabled={isFixed}
              checked={checkedVal}
              onChange={e => !isFixed && handleCustomFieldChange(field.id, e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded border-stone-300 focus:ring-emerald-500 disabled:opacity-50"
            />
            <span className="text-xs text-stone-800 font-bold">{field.label}</span>
            {field.required && <span className="text-red-500">*</span>}
            {isFixed && (
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded flex items-center gap-1 ml-1.5">
                <Lock className="w-2 h-2" /> Fixed
              </span>
            )}
          </label>
          {field.helpText && <p className="text-[10px] text-stone-500 mt-0.5 ml-6">{field.helpText}</p>}
        </div>
      );
    }

    // Default: text, number, date, time
    const isFieldAutoGenerated = !!field.isAutoGenerated;
    const isFieldFixed = !isFieldAutoGenerated && !!field.isFixed;
    const fixedVal = field.fixedValue || (typeof field.defaultValue === 'string' ? field.defaultValue : '');
    const autoGenVal = customFieldValues[field.id] !== undefined
      ? customFieldValues[field.id]
      : (isFieldAutoGenerated ? generateFieldValue(field, { barangay }) : '');
    const displayValue = isFieldAutoGenerated
      ? autoGenVal
      : isFieldFixed
      ? fixedVal
      : (customFieldValues[field.id] ?? field.defaultValue ?? '');

    return (
      <div key={field.id}>
        <div className="flex items-center justify-between mb-1">
          <label className="block font-bold text-stone-700">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          {isFieldAutoGenerated ? (
            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
              <Sparkles className="w-2.5 h-2.5 text-purple-600" /> Auto-Generated
            </span>
          ) : isFieldFixed ? (
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
              <Lock className="w-2.5 h-2.5" /> Fixed Text
            </span>
          ) : null}
        </div>
        <div className="relative">
          <input
            type={
              field.type === 'number'
                ? 'number'
                : field.type === 'date'
                ? 'date'
                : field.type === 'time'
                ? 'time'
                : 'text'
            }
            readOnly={isFieldFixed || isFieldAutoGenerated}
            value={displayValue}
            onChange={e => {
              if (isFieldFixed || isFieldAutoGenerated) return;
              handleCustomFieldChange(field.id, e.target.value);
            }}
            placeholder={field.placeholder || ''}
            required={field.required}
            className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-hidden transition ${
              isFieldAutoGenerated
                ? 'bg-purple-50/60 border-purple-300 text-purple-950 font-mono font-bold pl-8 pr-10 shadow-inner'
                : isFieldFixed
                ? 'bg-stone-100/80 border-blue-200 text-stone-800 font-semibold cursor-not-allowed select-none pl-8 shadow-inner'
                : 'border-stone-300 focus:ring-2 focus:ring-emerald-600 bg-white'
            }`}
            title={
              isFieldAutoGenerated
                ? `Auto-generated code: "${displayValue}"`
                : isFieldFixed
                ? `Fixed text: "${fixedVal}"`
                : undefined
            }
          />
          {isFieldAutoGenerated ? (
            <>
              <Sparkles className="w-3.5 h-3.5 text-purple-600 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <button
                type="button"
                onClick={() => {
                  const newVal = generateFieldValue(field, { barangay });
                  handleCustomFieldChange(field.id, newVal);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-purple-700 hover:text-purple-900 hover:bg-purple-100/80 transition cursor-pointer"
                title="Re-generate code"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </>
          ) : isFieldFixed ? (
            <Lock className="w-3.5 h-3.5 text-blue-600 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          ) : null}
        </div>
        {field.helpText && <p className="text-[10px] text-stone-500 mt-1">{field.helpText}</p>}
      </div>
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmerName.trim()) {
      alert('Please enter the Farmer / Owner Name');
      return;
    }

    // Strict Contact Number Validation: exactly 11 digits only
    const contactReq = getField('fld_contact_phone')?.required ?? true;
    if (contactReq || farmerContact.trim()) {
      if (!isValidContactNumber(farmerContact)) {
        setContactError(CONTACT_NUMBER_ERROR_MESSAGE);
        setContactTouched(true);
        alert(CONTACT_NUMBER_ERROR_MESSAGE);
        return;
      }
    }

    // Birth Date Validation: Cannot be in the future
    const ageResult = calculateSwineAge(birthDate);
    if (!ageResult.isValid) {
      setBirthDateError(ageResult.errorMessage || 'Date of birth cannot be in the future.');
      alert(ageResult.errorMessage || 'Date of birth cannot be in the future.');
      return;
    }

    // High Biosecurity Concern: Breeding Boars in RED or PINK zone require acknowledgment
    if (showBoarASFWarning && !biosecurityWarningAcknowledged) {
      alert(
        `⚠️ HIGH BIOSECURITY CONCERN:\n\n` +
          `This swine is classified as a Breeding Boar in a ${currentASFZone} ASF Zone (Brgy. ${barangay}).\n\n` +
          `Under Hinunangan Municipal Executive Order & African Swine Fever Prevention Protocols, breeding boars in RED or PINK zones are subject to strict quarantine, movement prohibition, and mandatory testing.\n\n` +
          `You must check the biosecurity acknowledgment box before this record can be saved.`
      );
      return;
    }

    // Strict Geographic Exclusivity Check: Registration is strictly exclusive to Municipality of Hinunangan
    const exclusivityCheck = validateHinunanganRegistration(
      Number(latitude),
      Number(longitude),
      barangay
    );
    if (!exclusivityCheck.isValidLocation) {
      alert(
        `🚫 REGISTRATION REJECTED: LOCATION OUTSIDE HINUNANGAN\n\n` +
          `The specified pen GPS coordinates (${Number(latitude).toFixed(5)}, ${Number(longitude).toFixed(5)}) are outside the territorial jurisdiction of the Municipality of Hinunangan, Southern Leyte.\n\n` +
          `Under Municipal Executive Order No. 12-2023, swine and farm registration is strictly EXCLUSIVE to the 40 official barangays of Hinunangan. Registrations originating from other municipalities or other provinces are not permitted.\n\n` +
          `Please adjust the coordinates or click "Re-center to Brgy GPS".`
      );
      return;
    }

    // Pre-save validation using centralized swineRegistryLogic
    const existingRecords = storageService.getSwineRecords();
    const validation = validateSwineRecordForSave(
      {
        pigIdTag,
        earTagNo: pigIdTag,
        farmerName,
        birthDate,
        swineType,
        barangay,
        farmScale,
        asfZone: currentASFZone,
        biosecurityWarningAcknowledged,
      },
      existingRecords,
      initialData?.id
    );

    if (!validation.isValid) {
      alert(validation.errorMessage || 'Validation error. Please verify the form inputs.');
      return;
    }

    const normalizedContact = normalizePhilippinePhoneNumber(farmerContact) || farmerContact.trim();

    const newRecord: SwineRecord = {
      id: initialData?.id || 'swine-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      pigIdTag,
      earTagNo: pigIdTag,
      registry_id: pigIdTag,
      farmerName,
      farmerContact: normalizedContact,
      farmerAddress: farmerAddress || `Brgy. ${barangay}, Hinunangan`,
      barangay,
      rsbsaId,
      farmType,
      farmScale,
      asfZone: currentASFZone,
      biosecurityWarningAcknowledged: showBoarASFWarning ? biosecurityWarningAcknowledged : undefined,
      swineType,
      breed,
      birthDate,
      dateOfBirth: birthDate,
      date_of_birth: birthDate,
      dob: birthDate,
      age: ageResult.hasDob
        ? {
            years: ageResult.years,
            months: ageResult.months,
            days: ageResult.days,
            totalDays: ageResult.totalDays,
            totalMonths: ageResult.totalMonths,
            display: ageResult.display,
            isValid: true,
          }
        : undefined,
      ageWeeks: Number(ageWeeks),
      ageDays: Number(ageDays),
      ageMonths: Number(ageMonths),
      estimatedWeightKg: estimatedWeightRange,
      actualWeightKg: actualWeightKg !== null ? Number(actualWeightKg) : undefined,
      weightKg: Number(weightKg || (actualWeightKg ? actualWeightKg : 60)),
      gender,
      photoUrl,
      latitude: Number(latitude),
      longitude: Number(longitude),
      distanceToWaterSourceMeters: Number(distanceToWaterSource),
      distanceToTourismSchoolMeters: Number(distanceToTourismSchool),
      distanceToBuiltUpMeters: Number(distanceToBuiltUp),
      setbackCompliant: setbackAudit.allCompliant,
      heartGirthCm: useTapeFormula ? Number(heartGirthCm) : undefined,
      bodyLengthCm: useTapeFormula ? Number(bodyLengthCm) : undefined,
      calculationMethod: useTapeFormula ? 'tape_formula' : 'auto_matrix',
      status: readyToSell ? 'ready_to_sell' : status,
      readyToSell,
      targetSellDate: readyToSell ? targetSellDate : undefined,
      estimatedPricePhp: Number(estimatedPricePhp),
      biosecurity,
      notes,
      applicableOrdinanceNumber: selectedOrdinanceCode,
      isArchived: initialData?.isArchived || false,
      registeredBy: currentUser?.name || 'Authorized DA Personnel',
      registeredAt: initialData?.registeredAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isSynced: false,
      farmName,
      penCapacity: penCapacity ? Number(penCapacity) : undefined,
      email: farmerEmail,
      residentialAddress: farmerResidentialAddress,
      customFields: (() => {
        const merged: Record<string, any> = {
          ...customFieldValues,
          farmClassification,
          farmScale,
          asfZone: currentASFZone,
          asfClearanceStatus,
          fld_governing_ordinance: selectedOrdinanceCode,
          governingOrdinance: selectedOrdinanceCode,
        };
        formSchema.sections.forEach(sec => {
          sec.fields.forEach(f => {
            let val = customFieldValues[f.id];
            if (f.isAutoGenerated) {
              val = val || generateFieldValue(f, { barangay });
            } else if (f.isFixed) {
              val = f.fixedValue ?? val ?? f.defaultValue;
            }
            if (val !== undefined) {
              const k = getFieldKey(f);
              merged[k] = val;
              merged[f.id] = val;
            }
          });
        });
        return merged;
      })(),
    };

    setIsSubmitting(true);
    try {
      const saved = await storageService.saveSwineRecordCloud(newRecord, Boolean(initialData));
      onSuccess(saved);
    } catch (err: any) {
      console.error('Error saving swine record to Supabase cloud:', err);
      const msg = err?.message || 'Failed to save swine record to Supabase cloud database. Please verify your connection and try again.';
      setSubmitError(msg);
      alert(`⚠️ Supabase Cloud Save Error:\n\n${msg}\n\nPlease check your internet connection and try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4">
      {/* Cloud Save Error Banner */}
      {submitError && (
        <div className="mb-6 bg-red-50 border-2 border-red-300 rounded-3xl p-5 text-red-900 flex items-start gap-3 shadow-md animate-fade-in">
          <AlertCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-sm text-red-900">Database Synchronization Error</h4>
            <p className="text-xs text-red-700 mt-1 leading-relaxed">{submitError}</p>
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSubmitError(null)}
                className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Dismiss Notice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white rounded-3xl p-6 sm:p-7 mb-6 shadow-md border border-emerald-700/50 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
            <Layers className="w-4 h-4" /> Official DA Registry Form & Biosecurity Protocol
          </span>
          <h2 className="text-xl sm:text-2xl font-black mt-1">
            {initialData ? `Edit Swine Record: ${pigIdTag}` : 'Register Farmer & Swine Data'}
          </h2>
          <p className="text-xs text-emerald-200/90 mt-1 max-w-2xl leading-relaxed">
            Standardized registration including <strong>GIS Pen Coordinates & Setback Buffers</strong>, <strong>Automated Age/Category Matrix</strong>, and adherence to <strong>Southern Leyte Provincial Ordinance 2021-018</strong> & <strong>Hinunangan Municipal EO No. 12-2023</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onViewOrdinance && currentUser?.role !== 'focal' && (
            <button
              type="button"
              onClick={onViewOrdinance}
              className="bg-emerald-950 hover:bg-emerald-900 text-emerald-200 border border-emerald-500/50 text-xs font-semibold px-3 py-2 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition"
            >
              <BookOpen className="w-4 h-4 text-emerald-300" />
              <span>View ASF Decrees</span>
            </button>
          )}

          {!initialData && (
            <button
              type="button"
              onClick={onOpenBatchModal}
              className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold px-3 py-2 rounded-xl border border-emerald-500/50 shadow-sm flex items-center gap-1.5 cursor-pointer transition"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
              <span>Batch CSV Import</span>
            </button>
          )}
        </div>
      </div>

      {/* Immediate Breeding Boar in High-Risk ASF Zone Warning Banner */}
      {showBoarASFWarning && (
        <div className="bg-red-50 border-2 border-red-500 rounded-3xl p-5 mb-6 shadow-md animate-fadeIn">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-red-600 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-2xs">
                  HIGH BIOSECURITY CONCERN
                </span>
                <span className="text-sm font-black text-red-950">
                  Breeding Boar in {currentASFZone} Zone (Brgy. {barangay})
                </span>
              </div>
              <p className="text-xs text-red-900 leading-relaxed font-medium">
                Under Hinunangan Municipal Executive Order & African Swine Fever (ASF) Prevention Protocols,
                <strong> Breeding Boars (Barako) located within RED or PINK ASF zones are subject to strict quarantine,
                immediate movement prohibition, and mandatory testing.</strong> Natural mating transit between farms is
                strictly prohibited to prevent viral contamination across barangay lines.
              </p>
              <label className="flex items-start gap-3 mt-3 pt-3 border-t border-red-200 cursor-pointer bg-white/70 p-3 rounded-xl border">
                <input
                  type="checkbox"
                  checked={biosecurityWarningAcknowledged}
                  onChange={e => setBiosecurityWarningAcknowledged(e.target.checked)}
                  className="w-4 h-4 text-red-600 rounded border-red-400 focus:ring-red-500 mt-0.5"
                />
                <span className="text-xs font-bold text-red-950">
                  I acknowledge the biosecurity risks, movement prohibitions, and mandatory testing protocols for this breeding boar in the {currentASFZone} zone.
                </span>
              </label>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Schema-Driven Dynamic Sections matching Admin Customizer */}
        {formSchema.sections
          .filter(sec => sec.visible !== false)
          .map((sec, secIndex) => {
            const visibleFields = (sec.fields || []).filter(f => f.visible !== false);
            if (visibleFields.length === 0) return null;

            return (
              <div
                key={sec.id}
                className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200 shadow-xs space-y-4"
              >
                {/* Section Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3">
                  <div className="flex items-center gap-2">
                    {getSectionIcon(sec.id, sec.title)}
                    <div>
                      <h3 className="font-black text-stone-900 text-base">
                        {sec.title}
                      </h3>
                      {sec.description && (
                        <p className="text-[11px] text-stone-500 mt-0.5">{sec.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {sec.isCustom && (
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                        Custom Section
                      </span>
                    )}
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      Section {secIndex + 1}
                    </span>
                  </div>
                </div>

                {/* Section Special Banners: Hinunangan Administrative Exclusivity */}
                {(sec.id === 'sec_farm' || sec.id === 'sec_farmer' || sec.fields.some(f => f.id === 'fld_barangay' && f.visible !== false)) && (
                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-emerald-950 text-xs uppercase tracking-wider">
                            Administrative Jurisdiction
                          </span>
                          <span className="bg-emerald-200/80 text-emerald-850 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-300">
                            <Lock className="w-2.5 h-2.5" /> Strictly Exclusive to Hinunangan
                          </span>
                        </div>
                        <p className="text-xs text-emerald-900 font-semibold mt-0.5">
                          Province of Southern Leyte • 40 Official Coastal & Highland Barangays
                        </p>
                      </div>
                    </div>
                    <div className="text-right self-end sm:self-center">
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-lg border border-emerald-200">
                        Municipal System Lock Active
                      </span>
                    </div>
                  </div>
                )}

                {/* Swine Growth Matrix Banner */}
                {(sec.id === 'sec_swine' || sec.fields.some(f => f.id === 'fld_weight_kg' || f.id === 'fld_swine_category')) && (
                  <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                        <Scale className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-stone-900 text-xs uppercase tracking-wider">
                            DA-BAI Standard Swine Growth & Weight Matrix
                          </span>
                          <span className="bg-emerald-100 text-emerald-850 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
                            <Sparkles className="w-2.5 h-2.5 text-emerald-600" /> Automated Benchmarking
                          </span>
                        </div>
                        <p className="text-xs text-stone-600 mt-0.5">
                          Calculated Stage: <strong className="text-emerald-800 uppercase font-black">{swineType}</strong> • Live Weight: <strong className="text-stone-900">{weightKg} kg</strong> • Estimated Market Value: <strong className="text-emerald-700">₱{estimatedPricePhp.toLocaleString()}</strong>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => setIsMatrixModalOpen(true)}
                        className="bg-white hover:bg-stone-100 text-emerald-800 border border-emerald-300 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Growth Matrix Guide</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Biosecurity Scorecard Banner */}
                {(sec.id === 'sec_biosecurity' || sec.fields.some(f => f.id === 'fld_fence_installed' || f.id === 'fld_footbath_active' || f.id === 'fld_no_swill_ban')) && (
                  <div className="bg-emerald-950 text-white rounded-2xl p-4 shadow-sm border border-emerald-800">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            Biosecurity Standards Compliance Scorecard
                          </span>
                          <span className="text-[10px] bg-emerald-800 text-emerald-200 font-bold px-2 py-0.5 rounded-full">
                            {totalBiosecurityChecked}/{totalBiosecurityStandards} Passed
                          </span>
                        </div>
                        <p className="text-xs text-emerald-200/90 mt-1">
                          Provincial Ordinance 2021-018 & Municipal EO 12-2023 minimum requirement: &gt;70% compliance.
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black text-emerald-300 font-mono">
                          {biosecurityPercentage}%
                        </div>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          biosecurityPercentage >= 70 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'
                        }`}>
                          {biosecurityPercentage >= 70 ? 'Compliant' : 'Needs Upgrade'}
                        </span>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-emerald-900 rounded-full h-2 mt-3 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          biosecurityPercentage >= 70 ? 'bg-emerald-400' : 'bg-amber-400'
                        }`}
                        style={{ width: `${biosecurityPercentage}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Section Fields Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  {visibleFields.map(fld => renderFormField(fld, sec))}
                </div>
              </div>
            );
          })}

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-700 font-bold text-xs transition cursor-pointer"
            >
              Cancel
            </button>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 disabled:opacity-60 text-white font-black text-xs shadow-md hover:shadow-lg flex items-center gap-2 transition cursor-pointer"
          >
            {isSubmitting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>
              {isSubmitting
                ? 'Saving to Supabase Cloud...'
                : initialData
                ? 'Update Swine Record'
                : 'Save Swine to Registry'}
            </span>
          </button>
        </div>
      </form>

      {/* Swine Growth & Weight Matrix Modal */}
      <SwineMatrixModal
        isOpen={isMatrixModalOpen}
        onClose={() => setIsMatrixModalOpen(false)}
        currentAgeWeeks={ageWeeks}
        currentWeightKg={weightKg}
        onApplyStage={handleApplyMatrixValues}
      />
    </div>
  );
};

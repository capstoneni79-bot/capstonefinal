import React, { useState } from 'react';
import {
  Image,
  Upload,
  Sparkles,
  Check,
  RefreshCw,
  X,
  Sliders,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import {
  DynamicSeal,
  SealBagongPilipinas,
  SealBarangay,
  SealDA,
  SealMunicipality,
  SealProvince,
} from '../common/OfficialSeals';
import { HINUNANGAN_BARANGAYS } from '../../data/barangays';

export interface CertificateLogoSettings {
  leftLogoType: string;
  leftLogoUrl?: string;
  leftBarangayName: string;
  centerLogoType: string;
  centerLogoUrl?: string;
  rightLogoType: string;
  rightLogoUrl?: string;
  showWatermark: boolean;
  watermarkType: string;
  watermarkUrl?: string;
  watermarkOpacity: number;
  barangayEmail?: string;
  barangayPhone?: string;
  headerMotto?: string;
}

interface CertificateLogoCustomizerProps {
  settings: CertificateLogoSettings;
  onChange: (updated: CertificateLogoSettings) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const CertificateLogoCustomizer: React.FC<CertificateLogoCustomizerProps> = ({
  settings,
  onChange,
  isOpen,
  onClose,
}) => {
  const [localSettings, setLocalSettings] = useState<CertificateLogoSettings>(settings);

  if (!isOpen) return null;

  // Preset Configurations matching the user's authentic photos
  const applyPreset = (presetName: 'nava' | 'nueva_esperanza' | 'tuburan' | 'da_mao') => {
    if (presetName === 'nava') {
      const updated: CertificateLogoSettings = {
        leftLogoType: 'barangay',
        leftBarangayName: 'NAVA',
        centerLogoType: 'municipality',
        rightLogoType: 'bagong_pilipinas',
        showWatermark: true,
        watermarkType: 'municipality',
        watermarkOpacity: 0.12,
        barangayEmail: 'nava.hinunangan20@gmail.com',
        barangayPhone: '09763070221',
        headerMotto: '',
      };
      setLocalSettings(updated);
      onChange(updated);
    } else if (presetName === 'nueva_esperanza') {
      const updated: CertificateLogoSettings = {
        leftLogoType: 'barangay',
        leftBarangayName: 'NUEVA ESPERANZA',
        centerLogoType: 'none',
        rightLogoType: 'none',
        showWatermark: true,
        watermarkType: 'municipality',
        watermarkOpacity: 0.15,
        barangayEmail: 'brgy.nuevaesperanza@hinunangan.gov.ph',
        barangayPhone: '(053) 578-2011',
        headerMotto: 'o0o\nOFFICE OF THE PUNONG BARANGAY',
      };
      setLocalSettings(updated);
      onChange(updated);
    } else if (presetName === 'tuburan') {
      const updated: CertificateLogoSettings = {
        leftLogoType: 'barangay',
        leftBarangayName: 'TUBURAN',
        centerLogoType: 'none',
        rightLogoType: 'municipality',
        showWatermark: false,
        watermarkType: 'municipality',
        watermarkOpacity: 0.10,
        barangayEmail: 'tuburan.hinunangan@gmail.com',
        barangayPhone: '0917-888-9999',
        headerMotto: 'OFFICE OF THE PUNONG BARANGAY',
      };
      setLocalSettings(updated);
      onChange(updated);
    } else if (presetName === 'da_mao') {
      const updated: CertificateLogoSettings = {
        leftLogoType: 'da',
        leftBarangayName: 'POBLACION',
        centerLogoType: 'municipality',
        rightLogoType: 'bagong_pilipinas',
        showWatermark: true,
        watermarkType: 'municipality',
        watermarkOpacity: 0.12,
        barangayEmail: 'agri.hinunangan@gmail.com',
        barangayPhone: '(053) 578-2011',
        headerMotto: 'OFFICE OF THE MUNICIPAL AGRICULTURAL SERVICES (OMAS)',
      };
      setLocalSettings(updated);
      onChange(updated);
    }
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'leftLogoUrl' | 'centerLogoUrl' | 'rightLogoUrl' | 'watermarkUrl'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const updated = { ...localSettings, [field]: result };
      setLocalSettings(updated);
      onChange(updated);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white max-w-2xl w-full rounded-2xl p-6 shadow-2xl border border-stone-200 space-y-5 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                Official Seals & Logo Customizer
              </h3>
              <p className="text-xs text-stone-500">
                Change header insignias, seals, background watermark & contact info
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Authentic Photo Presets */}
        <div className="space-y-2">
          <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600">
            QUICK AUTHENTIC TEMPLATE PRESETS (FROM PHOTO FORMATS)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => applyPreset('nava')}
              className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100 text-left transition cursor-pointer flex flex-col items-center text-center"
            >
              <div className="flex items-center gap-1 mb-1">
                <SealBarangay barangayName="NAVA" className="w-5 h-5" />
                <SealMunicipality className="w-5 h-5" />
                <SealBagongPilipinas className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-blue-900">Barangay Nava</span>
              <span className="text-[9px] text-blue-600">3 Seals (Nava + Mun + BP)</span>
            </button>

            <button
              type="button"
              onClick={() => applyPreset('nueva_esperanza')}
              className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/60 hover:bg-amber-100 text-left transition cursor-pointer flex flex-col items-center text-center"
            >
              <div className="flex items-center gap-1 mb-1">
                <SealBarangay barangayName="NUEVA ESPERANZA" className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold text-amber-900">Nueva Esperanza</span>
              <span className="text-[9px] text-amber-700">1 Seal + Watermark</span>
            </button>

            <button
              type="button"
              onClick={() => applyPreset('tuburan')}
              className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100 text-left transition cursor-pointer flex flex-col items-center text-center"
            >
              <div className="flex items-center gap-1 mb-1">
                <SealBarangay barangayName="TUBURAN" className="w-5 h-5" />
                <SealMunicipality className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-emerald-900">Barangay Tuburan</span>
              <span className="text-[9px] text-emerald-700">Tuburan + Mun Seals</span>
            </button>

            <button
              type="button"
              onClick={() => applyPreset('da_mao')}
              className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition cursor-pointer flex flex-col items-center text-center"
            >
              <div className="flex items-center gap-1 mb-1">
                <SealDA className="w-5 h-5" />
                <SealMunicipality className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-slate-900">MAO / DA Office</span>
              <span className="text-[9px] text-slate-600">DA + Mun + BP</span>
            </button>
          </div>
        </div>

        {/* 1. Left Logo Settings */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-stone-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-slate-800">
              1. Left Logo / Seal
            </span>
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white shadow-2xs border border-stone-200">
              {localSettings.leftLogoType === 'barangay' ? (
                <SealBarangay
                  barangayName={localSettings.leftBarangayName}
                  className="w-7 h-7"
                  customUrl={localSettings.leftLogoUrl}
                />
              ) : localSettings.leftLogoType === 'da' ? (
                <SealDA className="w-7 h-7" customUrl={localSettings.leftLogoUrl} />
              ) : localSettings.leftLogoType === 'municipality' ? (
                <SealMunicipality className="w-7 h-7" customUrl={localSettings.leftLogoUrl} />
              ) : localSettings.leftLogoUrl ? (
                <img
                  src={localSettings.leftLogoUrl}
                  alt="Left Seal"
                  className="w-7 h-7 object-contain rounded-full"
                />
              ) : (
                <span className="text-[10px] font-bold text-slate-400">None</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-1">Seal Type</label>
              <select
                value={localSettings.leftLogoType}
                onChange={e => {
                  const updated = { ...localSettings, leftLogoType: e.target.value };
                  setLocalSettings(updated);
                  onChange(updated);
                }}
                className="w-full bg-white border border-stone-300 rounded-lg p-2 font-semibold text-slate-800"
              >
                <option value="barangay">Barangay Official Seal (Customizable)</option>
                <option value="da">Department of Agriculture (DA)</option>
                <option value="municipality">Municipality of Hinunangan</option>
                <option value="custom">Custom Uploaded Image</option>
                <option value="none">None / Hidden</option>
              </select>
            </div>

            {localSettings.leftLogoType === 'barangay' && (
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">
                  Select Barangay
                </label>
                <select
                  value={localSettings.leftBarangayName}
                  onChange={e => {
                    const updated = { ...localSettings, leftBarangayName: e.target.value };
                    setLocalSettings(updated);
                    onChange(updated);
                  }}
                  className="w-full bg-white border border-stone-300 rounded-lg p-2 font-bold text-slate-800"
                >
                  {HINUNANGAN_BARANGAYS.map(b => (
                    <option key={b.name} value={b.name}>
                      Barangay {b.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-600 mb-1">
              Upload Custom Left Seal (Optional Replacement)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={e => handleFileUpload(e, 'leftLogoUrl')}
              className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            />
          </div>
        </div>

        {/* 2. Center Logo Settings */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-stone-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-slate-800">
              2. Center Logo / Seal
            </span>
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white shadow-2xs border border-stone-200">
              {localSettings.centerLogoType === 'municipality' ? (
                <SealMunicipality className="w-7 h-7" customUrl={localSettings.centerLogoUrl} />
              ) : localSettings.centerLogoType === 'da' ? (
                <SealDA className="w-7 h-7" customUrl={localSettings.centerLogoUrl} />
              ) : localSettings.centerLogoType === 'bagong_pilipinas' ? (
                <SealBagongPilipinas
                  className="w-7 h-7"
                  customUrl={localSettings.centerLogoUrl}
                />
              ) : localSettings.centerLogoUrl ? (
                <img
                  src={localSettings.centerLogoUrl}
                  alt="Center Seal"
                  className="w-7 h-7 object-contain rounded-full"
                />
              ) : (
                <span className="text-[10px] font-bold text-slate-400">None</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-1">Seal Type</label>
              <select
                value={localSettings.centerLogoType}
                onChange={e => {
                  const updated = { ...localSettings, centerLogoType: e.target.value };
                  setLocalSettings(updated);
                  onChange(updated);
                }}
                className="w-full bg-white border border-stone-300 rounded-lg p-2 font-semibold text-slate-800"
              >
                <option value="municipality">Municipality of Hinunangan</option>
                <option value="da">Department of Agriculture (DA)</option>
                <option value="bagong_pilipinas">Bagong Pilipinas</option>
                <option value="none">None / Hidden</option>
                <option value="custom">Custom Uploaded Image</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-1">
                Upload Custom Center Seal
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={e => handleFileUpload(e, 'centerLogoUrl')}
                className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* 3. Right Logo Settings */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-stone-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-slate-800">
              3. Right Logo / Seal
            </span>
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white shadow-2xs border border-stone-200">
              {localSettings.rightLogoType === 'bagong_pilipinas' ? (
                <SealBagongPilipinas
                  className="w-7 h-7"
                  customUrl={localSettings.rightLogoUrl}
                />
              ) : localSettings.rightLogoType === 'municipality' ? (
                <SealMunicipality className="w-7 h-7" customUrl={localSettings.rightLogoUrl} />
              ) : localSettings.rightLogoType === 'province' ? (
                <SealProvince className="w-7 h-7" customUrl={localSettings.rightLogoUrl} />
              ) : localSettings.rightLogoType === 'da' ? (
                <SealDA className="w-7 h-7" customUrl={localSettings.rightLogoUrl} />
              ) : localSettings.rightLogoUrl ? (
                <img
                  src={localSettings.rightLogoUrl}
                  alt="Right Seal"
                  className="w-7 h-7 object-contain rounded-full"
                />
              ) : (
                <span className="text-[10px] font-bold text-slate-400">None</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-1">Seal Type</label>
              <select
                value={localSettings.rightLogoType}
                onChange={e => {
                  const updated = { ...localSettings, rightLogoType: e.target.value };
                  setLocalSettings(updated);
                  onChange(updated);
                }}
                className="w-full bg-white border border-stone-300 rounded-lg p-2 font-semibold text-slate-800"
              >
                <option value="bagong_pilipinas">Bagong Pilipinas</option>
                <option value="municipality">Municipality of Hinunangan</option>
                <option value="province">Province of Southern Leyte</option>
                <option value="da">Department of Agriculture (DA)</option>
                <option value="none">None / Hidden</option>
                <option value="custom">Custom Uploaded Image</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-1">
                Upload Custom Right Seal
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={e => handleFileUpload(e, 'rightLogoUrl')}
                className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* 4. Background Watermark */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-stone-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-slate-800">
              4. Background Watermark Seal
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.showWatermark}
                onChange={e => {
                  const updated = { ...localSettings, showWatermark: e.target.checked };
                  setLocalSettings(updated);
                  onChange(updated);
                }}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {localSettings.showWatermark && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">
                  Watermark Opacity: {Math.round(localSettings.watermarkOpacity * 100)}%
                </label>
                <input
                  type="range"
                  min="0.05"
                  max="0.30"
                  step="0.01"
                  value={localSettings.watermarkOpacity}
                  onChange={e => {
                    const updated = {
                      ...localSettings,
                      watermarkOpacity: parseFloat(e.target.value),
                    };
                    setLocalSettings(updated);
                    onChange(updated);
                  }}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">
                  Watermark Insignia
                </label>
                <select
                  value={localSettings.watermarkType}
                  onChange={e => {
                    const updated = { ...localSettings, watermarkType: e.target.value };
                    setLocalSettings(updated);
                    onChange(updated);
                  }}
                  className="w-full bg-white border border-stone-300 rounded-lg p-2 font-semibold text-slate-800"
                >
                  <option value="municipality">Municipality of Hinunangan</option>
                  <option value="da">Department of Agriculture</option>
                  <option value="barangay">Barangay Seal</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* 5. Contact Info in Header */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-stone-200 space-y-3">
          <span className="text-xs font-black uppercase text-slate-800">
            5. Header Contact Details (e.g. Nava Style)
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-1">
                📧 Barangay Email
              </label>
              <input
                type="email"
                value={localSettings.barangayEmail || ''}
                onChange={e => {
                  const updated = { ...localSettings, barangayEmail: e.target.value };
                  setLocalSettings(updated);
                  onChange(updated);
                }}
                placeholder="e.g. nava.hinunangan20@gmail.com"
                className="w-full bg-white border border-stone-300 rounded-lg p-2 font-bold text-slate-800"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-1">
                📞 Barangay Phone / Mobile
              </label>
              <input
                type="text"
                value={localSettings.barangayPhone || ''}
                onChange={e => {
                  const updated = { ...localSettings, barangayPhone: e.target.value };
                  setLocalSettings(updated);
                  onChange(updated);
                }}
                placeholder="e.g. 09763070221"
                className="w-full bg-white border border-stone-300 rounded-lg p-2 font-bold text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold cursor-pointer text-xs shadow-sm"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  XCircle,
  HelpCircle,
  CheckCircle2,
  MapPin,
  Trees,
  Droplets,
  Building,
  Scale,
  Sparkles,
  Info,
} from 'lucide-react';
import { ASFRegulatoryDocument } from '../../types';

interface LegalComplianceCalculatorProps {
  document: ASFRegulatoryDocument;
}

export const LegalComplianceCalculator: React.FC<LegalComplianceCalculatorProps> = ({
  document: doc,
}) => {
  const [farmType, setFarmType] = useState<'backyard' | 'commercial_medium' | 'commercial_large'>('backyard');
  const [headCount, setHeadCount] = useState<number>(6);
  const [sowCount, setSowCount] = useState<number>(1);
  const [groundwaterDist, setGroundwaterDist] = useState<number>(30);
  const [builtUpDist, setBuiltUpDist] = useState<number>(35);
  const [touristDist, setTouristDist] = useState<number>(150);
  const [majorRoadDist, setMajorRoadDist] = useState<number>(300);
  const [hasSepticOrOdorless, setHasSepticOrOdorless] = useState<boolean>(true);
  const [hasBarangayReg, setHasBarangayReg] = useState<boolean>(true);
  const [hasFlyControl, setHasFlyControl] = useState<boolean>(true);
  const [isUrbanZone, setIsUrbanZone] = useState<boolean>(false);
  const [isSwillFree, setIsSwillFree] = useState<boolean>(true);

  // Compliance rules evaluation based on MO 2025-59 & Res 376
  const isUrbanViolation = isUrbanZone; // MO 2025-59 Section 13(a) ban in urban zones
  const isGroundwaterOk = groundwaterDist >= 25; // Section 9: 25m
  const isTouristOk = touristDist >= 100; // Section 10: 100m

  // Built up rule
  let requiredBuiltUp = 25;
  if (farmType === 'commercial_medium' || farmType === 'commercial_large') {
    requiredBuiltUp = 1000;
  }
  const isBuiltUpOk = builtUpDist >= requiredBuiltUp;

  // Major road rule
  let requiredMajorRoad = 0;
  if (farmType === 'commercial_medium' || farmType === 'commercial_large') {
    requiredMajorRoad = 500;
  }
  const isMajorRoadOk = majorRoadDist >= requiredMajorRoad;

  // Waste / Odorless standard
  const isWasteOk = hasSepticOrOdorless;

  // Overall compliance computation
  const checklist = [
    {
      title: 'Groundwater / Water Source Clearance (≥ 25m)',
      basis: 'Section 9, MO 2025-59',
      passed: isGroundwaterOk,
      value: `${groundwaterDist}m (req: ≥25m)`,
      critical: true,
    },
    {
      title: `Built-up / Community Buffer (≥ ${requiredBuiltUp}m)`,
      basis: 'Section 9, MO 2025-59',
      passed: isBuiltUpOk,
      value: `${builtUpDist}m (req: ≥${requiredBuiltUp}m for ${farmType.replace('_', ' ')})`,
      critical: true,
    },
    {
      title: 'Tourist Destination Setback (≥ 100m)',
      basis: 'Section 10, MO 2025-59',
      passed: isTouristOk,
      value: `${touristDist}m (req: ≥100m)`,
      critical: true,
    },
    {
      title: 'Non-Urban Agricultural Zoning',
      basis: 'Section 13(a), MO 2025-59',
      passed: !isUrbanViolation,
      value: isUrbanViolation ? 'Urban / Poblacion (Prohibited)' : 'Agricultural Zone (Allowed)',
      critical: true,
    },
    {
      title: '"Baboyang Walang Amoy" (Odorless Pen) / Standard Septic Tank',
      basis: 'Section 18, MO 2025-59',
      passed: isWasteOk,
      value: hasSepticOrOdorless ? 'Compliant Waste System' : 'No Certified Waste System',
      critical: true,
    },
    {
      title: 'Barangay & OMAS Swine Registration',
      basis: 'Section 12, MO 2025-59 & Res 376-2026',
      passed: hasBarangayReg,
      value: hasBarangayReg ? 'Registered' : 'Not Registered',
      critical: false,
    },
    {
      title: 'Absolute Prohibition of Swill Feeding ("Pasaw")',
      basis: 'BABay ASF & MO 2025-59',
      passed: isSwillFree,
      value: isSwillFree ? 'Zero Swill Feeding' : 'Uses Swill (Violation)',
      critical: true,
    },
    {
      title: 'Fly and Mosquito Vector Control',
      basis: 'Section 13(b), MO 2025-59',
      passed: hasFlyControl,
      value: hasFlyControl ? 'Active Bio-Control' : 'None',
      critical: false,
    },
  ];

  const passedCount = checklist.filter(c => c.passed).length;
  const criticalFails = checklist.filter(c => !c.passed && c.critical).length;
  const isOverallCompliant = criticalFails === 0 && passedCount >= 7;

  return (
    <div className="space-y-6">
      {/* Disclaimer Banner (MANDATORY EXACT REQUIREMENT) */}
      <div className="bg-amber-50 border border-amber-300 p-4 rounded-2xl flex items-start gap-3 shadow-xs">
        <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wide">
            Statutory Compliance Assessment Engine
          </h4>
          <p className="text-xs text-amber-800 mt-0.5 font-medium leading-relaxed">
            System-generated preliminary assessment — subject to official inspection/verification by the Municipal Livestock Task Force (MLTF), MENRO, and OMAS Hinunangan.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Controls Panel */}
        <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900 pb-2 border-b border-stone-200">
            1. Farm Holdings & Facility Parameters
          </h4>

          {/* Farm Classification */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              Farm Classification (Sec. 6, MO 2025-59)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFarmType('backyard')}
                className={`px-3 py-2 text-xs font-bold rounded-xl border transition ${
                  farmType === 'backyard'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                }`}
              >
                Backyard (≤10 heads)
              </button>
              <button
                type="button"
                onClick={() => setFarmType('commercial_medium')}
                className={`px-3 py-2 text-xs font-bold rounded-xl border transition ${
                  farmType === 'commercial_medium'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                }`}
              >
                Commercial (11-20)
              </button>
              <button
                type="button"
                onClick={() => setFarmType('commercial_large')}
                className={`px-3 py-2 text-xs font-bold rounded-xl border transition ${
                  farmType === 'commercial_large'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                }`}
              >
                Commercial (&gt;20)
              </button>
            </div>
          </div>

          {/* Distances Sliders */}
          <div className="space-y-3 pt-2">
            <div>
              <div className="flex justify-between text-xs font-semibold text-stone-800 mb-1">
                <span className="flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5 text-blue-600" /> Distance to Groundwater / River:
                </span>
                <span className="font-mono font-bold text-emerald-800">{groundwaterDist} meters</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={groundwaterDist}
                onChange={e => setGroundwaterDist(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <span className="text-[10px] text-stone-400">Statutory minimum: 25 meters</span>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-stone-800 mb-1">
                <span className="flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-stone-600" /> Distance to Built-Up Community:
                </span>
                <span className="font-mono font-bold text-emerald-800">{builtUpDist} meters</span>
              </div>
              <input
                type="range"
                min="0"
                max="1500"
                step="10"
                value={builtUpDist}
                onChange={e => setBuiltUpDist(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <span className="text-[10px] text-stone-400">
                Statutory minimum: {requiredBuiltUp} meters ({farmType === 'backyard' ? 'Backyard with septic' : 'Commercial'})
              </span>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-stone-800 mb-1">
                <span className="flex items-center gap-1">
                  <Trees className="w-3.5 h-3.5 text-amber-600" /> Distance to Tourist Destinations / Beaches:
                </span>
                <span className="font-mono font-bold text-emerald-800">{touristDist} meters</span>
              </div>
              <input
                type="range"
                min="0"
                max="500"
                step="5"
                value={touristDist}
                onChange={e => setTouristDist(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <span className="text-[10px] text-stone-400">Statutory minimum: 100 meters (Section 10)</span>
            </div>
          </div>

          {/* Operational Checkboxes */}
          <div className="space-y-2.5 pt-3 border-t border-stone-200">
            <label className="flex items-center gap-2.5 text-xs text-stone-700 cursor-pointer">
              <input
                type="checkbox"
                checked={hasSepticOrOdorless}
                onChange={e => setHasSepticOrOdorless(e.target.checked)}
                className="w-4 h-4 rounded-sm text-emerald-600 accent-emerald-600"
              />
              <span>&ldquo;Baboyang Walang Amoy&rdquo; (Odorless Pen) or Standard Multi-Chamber Septic Tank</span>
            </label>

            <label className="flex items-center gap-2.5 text-xs text-stone-700 cursor-pointer">
              <input
                type="checkbox"
                checked={hasBarangayReg}
                onChange={e => setHasBarangayReg(e.target.checked)}
                className="w-4 h-4 rounded-sm text-emerald-600 accent-emerald-600"
              />
              <span>Barangay Livestock Profile & OMAS Registration Completed</span>
            </label>

            <label className="flex items-center gap-2.5 text-xs text-stone-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isSwillFree}
                onChange={e => setIsSwillFree(e.target.checked)}
                className="w-4 h-4 rounded-sm text-emerald-600 accent-emerald-600"
              />
              <span>Strict Zero Swill Feeding (100% Commercial or Formulated Feeds)</span>
            </label>

            <label className="flex items-center gap-2.5 text-xs text-stone-700 cursor-pointer">
              <input
                type="checkbox"
                checked={hasFlyControl}
                onChange={e => setHasFlyControl(e.target.checked)}
                className="w-4 h-4 rounded-sm text-emerald-600 accent-emerald-600"
              />
              <span>Fly and Insect Control System Active</span>
            </label>

            <label className="flex items-center gap-2.5 text-xs text-red-700 cursor-pointer font-semibold">
              <input
                type="checkbox"
                checked={isUrbanZone}
                onChange={e => setIsUrbanZone(e.target.checked)}
                className="w-4 h-4 rounded-sm text-red-600 accent-red-600"
              />
              <span>Located within Urban / Poblacion Zone (Prohibited)</span>
            </label>
          </div>
        </div>

        {/* Assessment Evaluation Output */}
        <div className="lg:col-span-6 space-y-4">
          {/* Score Badge Box */}
          <div
            className={`p-5 rounded-2xl border shadow-xs transition ${
              isOverallCompliant
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : 'bg-red-50 border-red-300 text-red-950'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isOverallCompliant ? (
                  <CheckCircle2 className="w-7 h-7 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-7 h-7 text-red-600 shrink-0" />
                )}
                <div>
                  <h4 className="font-bold text-sm">
                    {isOverallCompliant
                      ? 'Preliminary Assessment: COMPLIANT'
                      : 'Preliminary Assessment: NON-COMPLIANT'}
                  </h4>
                  <p className="text-xs opacity-90 mt-0.5">
                    {passedCount} of {checklist.length} statutory benchmarks met
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-2xl font-black font-mono">
                  {Math.round((passedCount / checklist.length) * 100)}%
                </span>
                <p className="text-[10px] font-bold uppercase tracking-wider">Compliance Index</p>
              </div>
            </div>
          </div>

          {/* Checklist Items */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden divide-y divide-stone-100">
            {checklist.map((item, idx) => (
              <div key={idx} className="p-3.5 flex items-start justify-between gap-3 text-xs">
                <div className="flex items-start gap-2.5">
                  {item.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-bold text-stone-900 block">{item.title}</span>
                    <span className="text-[11px] text-stone-500 font-mono">{item.basis}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-sm text-[10px] font-bold ${
                      item.passed
                        ? 'bg-emerald-100 text-emerald-800'
                        : item.critical
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {item.passed ? 'PASSED' : item.critical ? 'VIOLATION' : 'ADVISORY'}
                  </span>
                  <p className="text-[10px] text-stone-400 mt-0.5">{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Statutory Penalty Advisory if Non-Compliant */}
          {!isOverallCompliant && (
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 text-xs text-stone-700">
              <h5 className="font-bold text-stone-900 flex items-center gap-1.5 mb-1">
                <Scale className="w-4 h-4 text-emerald-800" /> Applicable Penalties under Section 21:
              </h5>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                First Offense: ₱1,000.00 fine + 7 days notice. Second Offense: ₱1,500.00 fine + permit suspension. Third Offense: ₱2,500.00 fine or 1-6 months imprisonment + physical closure and dismantling of pen structures.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

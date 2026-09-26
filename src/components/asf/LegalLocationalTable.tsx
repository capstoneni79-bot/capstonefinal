import React from 'react';
import { LocationalDesignStandardItem, LegalProximityRegulation } from '../../types';
import { ShieldCheck, MapPin, Compass, AlertCircle, Sparkles, Building2, Trees } from 'lucide-react';

interface LegalLocationalTableProps {
  standards?: LocationalDesignStandardItem[];
  proximity?: LegalProximityRegulation;
  officialNumber?: string;
}

export const LegalLocationalTable: React.FC<LegalLocationalTableProps> = ({
  standards = [],
  proximity,
  officialNumber = 'Municipal Ordinance No. 2025-59',
}) => {
  const poultryStandards = standards.filter(s => s.category === 'poultry');
  const piggeryStandards = standards.filter(s => s.category === 'piggery');

  return (
    <div className="space-y-6">
      {/* Table Notice / Official Basis */}
      <div className="bg-emerald-900 text-white p-4.5 rounded-2xl shadow-sm border border-emerald-800 flex items-start gap-3.5">
        <div className="p-2 bg-emerald-800/80 rounded-xl shrink-0">
          <Compass className="w-5 h-5 text-emerald-200" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-bold tracking-tight">
              Official Locational Design Standards Schedule (Section 9)
            </h4>
            <span className="text-[10px] bg-emerald-700 text-emerald-100 font-mono px-2 py-0.5 rounded-full font-semibold">
              {officialNumber}
            </span>
          </div>
          <p className="text-xs text-emerald-100/90 mt-1 leading-relaxed">
            Statutory locational distances, buffer zones, Environmental Compliance Certificate (ECC) mandates, and land-use requirements. Heads include weanlings, growers, fatteners and boars.
          </p>
        </div>
      </div>

      {/* Piggery Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 bg-stone-50/90 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">🐖</span>
            <h5 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
              Piggery Locational & Buffer Standards
            </h5>
          </div>
          <span className="text-[11px] text-stone-500 font-medium">Heads = weanlings, growers, fatteners, boars</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-stone-100/80 text-[11px] font-bold text-stone-800 border-b border-stone-200">
              <tr>
                <th className="px-4 py-3">Classification</th>
                <th className="px-4 py-3">Number of Heads</th>
                <th className="px-4 py-3">ECC Requirement</th>
                <th className="px-4 py-3">Zone</th>
                <th className="px-4 py-3">Groundwater</th>
                <th className="px-4 py-3">Built-up Area</th>
                <th className="px-4 py-3">Major Roads</th>
                <th className="px-4 py-3">Between Farms</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {piggeryStandards.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-stone-500">
                    No piggery locational standards loaded.
                  </td>
                </tr>
              ) : (
                piggeryStandards.map((item, idx) => (
                  <tr
                    key={item.id || idx}
                    className={`hover:bg-emerald-50/30 transition ${
                      item.classification === 'Backyard' ? 'bg-emerald-50/15' : ''
                    }`}
                  >
                    <td className="px-4 py-3.5 font-bold text-stone-900 flex items-center gap-1.5">
                      {item.classification === 'Backyard' && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      )}
                      {item.classification}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-stone-800 font-mono text-[11px]">
                      {item.headsRange}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-sm text-[10px] font-semibold ${
                          typeof item.eccRequired === 'string' && item.eccRequired.includes('Required')
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        {item.eccRequired ? String(item.eccRequired) : 'Not Applicable'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-stone-700">{item.zone}</td>
                    <td className="px-4 py-3.5 font-bold text-emerald-700">
                      {item.distanceGroundwater} meters
                    </td>
                    <td className="px-4 py-3.5 font-bold text-blue-700">
                      {item.distanceBuiltUp}
                    </td>
                    <td className="px-4 py-3.5 text-stone-700">{item.distanceMajorRoads}</td>
                    <td className="px-4 py-3.5 text-stone-700">{item.distanceBetweenFarms}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Poultry Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 bg-stone-50/90 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">🐓</span>
            <h5 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
              Poultry Locational & Buffer Standards
            </h5>
          </div>
          <span className="text-[11px] text-stone-500 font-medium">Classified by total fowls count</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-stone-100/80 text-[11px] font-bold text-stone-800 border-b border-stone-200">
              <tr>
                <th className="px-4 py-3">Classification</th>
                <th className="px-4 py-3">Number of Heads</th>
                <th className="px-4 py-3">ECC Requirement</th>
                <th className="px-4 py-3">Zone</th>
                <th className="px-4 py-3">Groundwater</th>
                <th className="px-4 py-3">Built-up Area</th>
                <th className="px-4 py-3">Major Roads</th>
                <th className="px-4 py-3">Between Farms</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {poultryStandards.map((item, idx) => (
                <tr key={item.id || idx} className="hover:bg-emerald-50/30 transition">
                  <td className="px-4 py-3.5 font-bold text-stone-900">{item.classification}</td>
                  <td className="px-4 py-3.5 font-medium text-stone-800 font-mono text-[11px]">
                    {item.headsRange}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-sm text-[10px] font-semibold ${
                        typeof item.eccRequired === 'string' && item.eccRequired.includes('Required')
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {item.eccRequired ? String(item.eccRequired) : 'Not Applicable'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-medium text-stone-700">{item.zone}</td>
                  <td className="px-4 py-3.5 font-bold text-emerald-700">
                    {item.distanceGroundwater} meters
                  </td>
                  <td className="px-4 py-3.5 font-bold text-blue-700">{item.distanceBuiltUp}</td>
                  <td className="px-4 py-3.5 text-stone-700">{item.distanceMajorRoads}</td>
                  <td className="px-4 py-3.5 text-stone-700">{item.distanceBetweenFarms}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Proximity Regulations (100 meters from Tourist Destinations - Section 10) */}
      {proximity && (
        <div className="bg-gradient-to-br from-amber-50/90 to-emerald-50/80 rounded-2xl border border-amber-200/80 p-5 shadow-xs">
          <div className="flex items-start gap-3.5">
            <div className="p-2 bg-amber-500 text-white rounded-xl shadow-xs shrink-0">
              <Trees className="w-5 h-5" />
            </div>
            <div className="space-y-3 flex-1">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-stone-900">
                    Section 10: Proximity Regulations Near Tourist Destinations
                  </h4>
                  <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                    Minimum {proximity.touristDestinationMinDistance} Meters
                  </span>
                </div>
                <p className="text-xs text-stone-600 mt-1">
                  All commercial and backyard piggery, poultry, and livestock farms must be located at least{' '}
                  <strong className="text-amber-900 font-bold">{proximity.touristDestinationMinDistance} meters</strong>{' '}
                  away from officially designated tourist destinations in Hinunangan.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div className="bg-white/90 p-3 rounded-xl border border-amber-100 text-xs">
                  <h5 className="font-bold text-stone-800 mb-1.5 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-600" /> Designated Protected Areas:
                  </h5>
                  <ul className="space-y-1 text-stone-600 list-disc list-inside">
                    {proximity.touristDestinationTypes.map((type, i) => (
                      <li key={i}>{type}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white/90 p-3 rounded-xl border border-amber-100 text-xs">
                  <h5 className="font-bold text-stone-800 mb-1.5 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Environmental Mandates:
                  </h5>
                  <ul className="space-y-1 text-stone-600 list-disc list-inside">
                    {proximity.environmentalMeasures.map((measure, i) => (
                      <li key={i}>{measure}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1 border-t border-amber-200/60 flex-wrap gap-2">
                <span>
                  <strong>Inspection Authority:</strong> {proximity.inspectionOffices.join(', ')}
                </span>
                <span>
                  <strong>Exemptions:</strong> {proximity.exemptionAuthority}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

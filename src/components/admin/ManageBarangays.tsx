import React, { useState } from 'react';
import {
  MapPin,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  ShieldAlert,
  CheckCircle,
  Search,
  Sparkles,
  Layers,
  Ruler,
} from 'lucide-react';
import { Barangay } from '../../types';
import { storageService } from '../../services/storageService';
import { BarangayBoundaryMap } from '../gis/BarangayBoundaryMap';
import { HINUNANGAN_BARANGAY_BOUNDARIES } from '../../data/hinunanganBoundariesGeoJSON';
import {
  calculatePerimeterKm,
  calculatePolygonAreaHectares,
  generateDefaultBoundary,
} from '../../utils/gisMeasure';

interface ManageBarangaysProps {
  barangays: Barangay[];
  onRefresh: () => void;
}

export const ManageBarangays: React.FC<ManageBarangaysProps> = ({ barangays, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState<Barangay | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [latitude, setLatitude] = useState(10.4042);
  const [longitude, setLongitude] = useState(125.2017);
  const [focalPerson, setFocalPerson] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [riskLevel, setRiskLevel] = useState<'green' | 'yellow' | 'red'>('green');
  const [swineCount, setSwineCount] = useState(25);
  const [boundaryPolygon, setBoundaryPolygon] = useState<[number, number][]>([]);
  const [surveillanceRadiusMeters, setSurveillanceRadiusMeters] = useState(500);

  const startEdit = (b: Barangay) => {
    setIsEditing(b);
    setIsAddingNew(false);
    setName(b.name);
    setLatitude(b.latitude);
    setLongitude(b.longitude);
    setFocalPerson(b.focalPerson || b.focalPersonName || '');
    setContactNo(b.contactNo || b.contactNumber || '');
    setRiskLevel(b.riskLevel);
    setSwineCount(b.swineCount || 0);
    setSurveillanceRadiusMeters(b.surveillanceRadiusMeters || 500);

    // If existing polygon, use it; otherwise look up official boundary or generate
    if (b.boundaryPolygon && b.boundaryPolygon.length >= 3) {
      setBoundaryPolygon(b.boundaryPolygon);
    } else if (HINUNANGAN_BARANGAY_BOUNDARIES[b.name]) {
      setBoundaryPolygon(HINUNANGAN_BARANGAY_BOUNDARIES[b.name]);
    } else {
      setBoundaryPolygon(generateDefaultBoundary(b.latitude, b.longitude, 0.8, 6));
    }
  };

  const startAddNew = () => {
    setIsAddingNew(true);
    setIsEditing(null);
    setName('');
    const defaultLat = 10.4042;
    const defaultLng = 125.2017;
    setLatitude(defaultLat);
    setLongitude(defaultLng);
    setFocalPerson('');
    setContactNo('');
    setRiskLevel('green');
    setSwineCount(0);
    setSurveillanceRadiusMeters(500);
    // Generate sample 6-point perimeter around Hinunangan
    setBoundaryPolygon(generateDefaultBoundary(defaultLat, defaultLng, 0.75, 6));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please provide a Barangay Name');
      return;
    }

    const perimeterKm = calculatePerimeterKm(boundaryPolygon);
    const areaHectares = calculatePolygonAreaHectares(boundaryPolygon);

    if (isAddingNew) {
      const newBg: Barangay = {
        id: 'bg-' + name.toLowerCase().replace(/\s+/g, '-'),
        name: name.trim(),
        code: name.trim().toUpperCase().replace(/[^A-Z]/g, '').substring(0, 4) || 'HIN',
        latitude: Number(latitude),
        longitude: Number(longitude),
        focalPerson: focalPerson.trim() || 'Assigned Extension Worker',
        contactNo: contactNo.trim() || '0900-000-0000',
        riskLevel,
        swineCount: Number(swineCount),
        boundaryPolygon,
        boundaryPerimeterKm: perimeterKm,
        boundaryAreaHectares: areaHectares,
        surveillanceRadiusMeters,
      };
      storageService.saveBarangay(newBg);
    } else if (isEditing) {
      const updatedBg: Barangay = {
        ...isEditing,
        name: name.trim(),
        latitude: Number(latitude),
        longitude: Number(longitude),
        focalPerson: focalPerson.trim(),
        contactNo: contactNo.trim(),
        riskLevel,
        swineCount: Number(swineCount),
        boundaryPolygon,
        boundaryPerimeterKm: perimeterKm,
        boundaryAreaHectares: areaHectares,
        surveillanceRadiusMeters,
      };
      storageService.saveBarangay(updatedBg);
    }

    setIsEditing(null);
    setIsAddingNew(false);
    onRefresh();
  };

  const handleDelete = (id: string, bgName: string) => {
    if (window.confirm(`Are you sure you want to delete Barangay "${bgName}" from Hinunangan registry?`)) {
      storageService.deleteBarangay(id);
      onRefresh();
    }
  };

  const q = searchTerm.toLowerCase();
  const filtered = barangays.filter(b =>
    (b.name || '').toLowerCase().includes(q) ||
    (Boolean(b.focalPerson) && (b.focalPerson || '').toLowerCase().includes(q))
  );

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-700" />
            <h2 className="text-xl font-bold text-stone-900">Manage Hinunangan Barangays</h2>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Configure all 40 barangay jurisdictions, measure GIS boundaries & agricultural land area, and assign extension workers.
          </p>
        </div>

        <button
          onClick={startAddNew}
          className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Barangay with Live GIS Map
        </button>
      </div>

      {/* Editor / Create Form with Live GIS Boundary Measurement */}
      {(isAddingNew || isEditing) && (
        <form onSubmit={handleSave} className="bg-white p-6 rounded-3xl border-2 border-emerald-600 shadow-xl space-y-6 text-xs animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center justify-between border-b pb-3 border-stone-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded text-[11px] uppercase tracking-wide">
                  GIS Boundary Surveyor
                </span>
                <h3 className="font-black text-base text-stone-900">
                  {isAddingNew ? 'Add New Hinunangan Barangay' : `Edit Barangay: ${isEditing?.name}`}
                </h3>
              </div>
              <p className="text-[11px] text-stone-500 mt-0.5">
                Pinpoint the Barangay Hall and plot boundary perimeter coordinates to measure enclosed land area.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsAddingNew(false);
                setIsEditing(null);
              }}
              className="text-stone-400 hover:text-stone-700 p-1.5 rounded-lg hover:bg-stone-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Primary Metadata fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-stone-700 mb-1">Barangay Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Poblacion"
                className="w-full px-3 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Assigned Extension Focal Person</label>
              <input
                type="text"
                value={focalPerson}
                onChange={e => setFocalPerson(e.target.value)}
                placeholder="e.g. Maria Clara Santos"
                className="w-full px-3 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Official Contact Number</label>
              <input
                type="text"
                value={contactNo}
                onChange={e => setContactNo(e.target.value)}
                placeholder="0917-000-0000"
                className="w-full px-3 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">ASF Zone Classification</label>
              <select
                value={riskLevel}
                onChange={e => setRiskLevel(e.target.value as any)}
                className="w-full px-3 py-2.5 rounded-xl border border-stone-300 bg-white font-bold"
              >
                <option value="green">🟢 Green Zone (Free & Certified Safe)</option>
                <option value="yellow">🟡 Yellow Zone (Surveillance / Buffer Area)</option>
                <option value="red">🔴 Red Zone (Infected / Movement Restricted)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Center Latitude (°N)</label>
              <input
                type="number"
                step="0.000001"
                value={latitude}
                onChange={e => setLatitude(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl border border-stone-300 font-mono text-stone-900 font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Center Longitude (°E)</label>
              <input
                type="number"
                step="0.000001"
                value={longitude}
                onChange={e => setLongitude(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl border border-stone-300 font-mono text-stone-900 font-semibold"
              />
            </div>
          </div>

          {/* Dedicated Live GIS Map & Boundary Measurement Tool */}
          <div className="pt-2 border-t border-stone-100 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black text-stone-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-700" />
                  Live GIS Map: Measure Boundaries & Agricultural Area
                </h4>
                <p className="text-[11px] text-stone-500">
                  Click on the satellite or street map to plot vertices along the boundary perimeter. Drag vertices to calibrate.
                </p>
              </div>
            </div>

            <BarangayBoundaryMap
              centerLat={latitude}
              centerLng={longitude}
              onCenterChange={(lat, lng) => {
                setLatitude(lat);
                setLongitude(lng);
              }}
              boundaryPolygon={boundaryPolygon}
              onPolygonChange={setBoundaryPolygon}
              riskLevel={riskLevel}
              barangayName={name || 'Hinunangan'}
              surveillanceRadiusMeters={surveillanceRadiusMeters}
              onRadiusChange={setSurveillanceRadiusMeters}
            />
          </div>

          {/* Form Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-100">
            <div className="text-[11px] text-stone-500">
              Measured Area: <strong className="text-stone-800">{calculatePolygonAreaHectares(boundaryPolygon)} Hectares</strong> •
              Perimeter: <strong className="text-stone-800">{calculatePerimeterKm(boundaryPolygon)} km</strong>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsAddingNew(false);
                  setIsEditing(null);
                }}
                className="px-4 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-100 font-semibold text-stone-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold flex items-center gap-1.5 shadow-md hover:shadow-lg transition cursor-pointer"
              >
                <Save className="w-4 h-4" /> Save Barangay & Boundary
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Search & List */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-stone-100 flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search barangay or focal person..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            />
          </div>
          <span className="text-xs text-stone-500 font-medium">
            Total: <strong>{filtered.length}</strong> barangays
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-100/80 text-stone-700 font-semibold border-b border-stone-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Barangay Name</th>
                <th className="py-3 px-4">ASF Biosecurity Zone</th>
                <th className="py-3 px-4">Boundary & Measured Area</th>
                <th className="py-3 px-4">Center Coordinates</th>
                <th className="py-3 px-4">Extension Focal Person</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {filtered.map(b => {
                const area = b.boundaryAreaHectares || (b.boundaryPolygon ? calculatePolygonAreaHectares(b.boundaryPolygon) : null);
                const perim = b.boundaryPerimeterKm || (b.boundaryPolygon ? calculatePerimeterKm(b.boundaryPolygon) : null);

                return (
                  <tr key={b.id} className="hover:bg-stone-50 transition">
                    <td className="py-3 px-4 font-bold text-stone-900">
                      Brgy. {b.name}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          b.riskLevel === 'green'
                            ? 'bg-emerald-100 text-emerald-800'
                            : b.riskLevel === 'yellow'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {b.riskLevel.toUpperCase()} ZONE
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {area && area > 0 ? (
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md text-[11px]">
                            <Ruler className="w-3 h-3 text-emerald-600" />
                            {area} ha
                          </span>
                          {perim && (
                            <span className="text-[10px] text-stone-400 font-mono">
                              ({perim} km)
                            </span>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(b)}
                          className="text-[11px] text-emerald-700 hover:text-emerald-900 font-medium underline flex items-center gap-1 cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3" /> Plot boundary on GIS
                        </button>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-stone-600">
                      {b.latitude.toFixed(4)}°N, {b.longitude.toFixed(4)}°E
                    </td>
                    <td className="py-3 px-4 text-stone-800 font-medium">
                      {b.focalPerson || b.focalPersonName || 'Not assigned'}
                    </td>
                    <td className="py-3 px-4 text-stone-500">{b.contactNo || b.contactNumber || '—'}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => startEdit(b)}
                          className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 transition cursor-pointer flex items-center gap-1 text-[11px] font-semibold"
                          title="Edit & Measure Boundary Map"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Measure GIS</span>
                        </button>
                        <button
                          onClick={() => handleDelete(b.id, b.name)}
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-100 transition cursor-pointer"
                          title="Delete Barangay"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

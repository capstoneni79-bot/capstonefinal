import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  APIProvider,
  Map as GoogleMap,
  AdvancedMarker,
  InfoWindow,
  Polygon,
  Circle,
  useMap,
  useApiIsLoaded,
  useApiLoadingStatus,
  APILoadingStatus,
} from '@vis.gl/react-google-maps';
import {
  MapPin,
  Layers,
  Flame,
  Shield,
  Eye,
  EyeOff,
  Crosshair,
  Info,
  CheckCircle2,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Navigation,
  X,
  Search,
  Users,
  Building,
  Activity,
  Phone,
  Calendar,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { Barangay, SwineRecord, UserAccount, UserRole, ASFZone } from '../../types';
import { HINUNANGAN_BARANGAYS, findClosestBarangay } from '../../data/barangays';
import {
  HINUNANGAN_BARANGAY_BOUNDARIES,
  HINUNANGAN_MUNICIPAL_METADATA,
} from '../../data/hinunanganBoundariesGeoJSON';
import {
  initBoundaryStorage,
  getStoredMunicipalGooglePaths,
  getStoredBarangayBoundaries,
} from '../../services/boundaryStorageService';
import {
  HeatmapMode,
  computeBarangayGisMetrics,
  generateHeatmapPoints,
  getHeatmapColor,
  BarangayGisMetrics,
} from '../../utils/gisCalculations';

// Helper component to control map camera via useMap
function MapCameraController({
  targetCenter,
  targetZoom,
}: {
  targetCenter: { lat: number; lng: number } | null;
  targetZoom: number | null;
}) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    if (targetCenter) {
      map.panTo(targetCenter);
      if (targetZoom) {
        map.setZoom(targetZoom);
      }
    }
  }, [map, targetCenter, targetZoom]);
  return null;
}

// Guard component that safely renders map overlays ONLY after the Google Maps API and Map instance are fully initialized
function GoogleMapOverlays({ children }: { children: React.ReactNode }) {
  const isLoaded = useApiIsLoaded();
  const status = useApiLoadingStatus();
  const map = useMap();

  if (status === APILoadingStatus.FAILED || !isLoaded || !map) {
    return null;
  }

  return <>{children}</>;
}

export interface GoogleGisMapProps {
  swineList: SwineRecord[];
  barangays: Barangay[];
  selectedBarangay?: string;
  currentUser?: UserAccount | null;
  currentRole?: UserRole | 'landing';
  onSelectSwine?: (swine: SwineRecord) => void;
  onViewSwineRecord?: (swine: SwineRecord) => void;
  onPickLocation?: (lat: number, lng: number, closestBarangay?: string) => void;
  isLocationPicker?: boolean;
  initialCenter?: [number, number];
  targetSwineId?: string | null;
  onSwitchToLeaflet?: () => void;
}

export const GoogleGisMap: React.FC<GoogleGisMapProps> = ({
  swineList,
  barangays,
  selectedBarangay,
  currentUser,
  currentRole = currentUser?.role || 'admin',
  onSelectSwine,
  onViewSwineRecord,
  onPickLocation,
  isLocationPicker = false,
  initialCenter,
  targetSwineId,
  onSwitchToLeaflet,
}) => {
  // Determine if current user is strictly a Focal Person (Admin has FULL UNRESTRICTED ACCESS to all 40 barangays)
  const isFocal = (currentRole === 'focal' || currentUser?.role === 'focal') && currentUser?.role !== 'admin' && currentRole !== 'admin';
  const assignedBarangay = isFocal
    ? (currentUser?.assignedBarangay || currentUser?.barangay_id)
    : undefined;

  // Normalized assigned barangay name
  const authorizedBarangayName = useMemo(() => {
    if (!assignedBarangay) return undefined;
    const match = HINUNANGAN_BARANGAYS.find(
      b =>
        b.name.toLowerCase() === assignedBarangay.toLowerCase() ||
        b.id.toLowerCase() === assignedBarangay.toLowerCase()
    );
    return match ? match.name : assignedBarangay;
  }, [assignedBarangay]);

  // Center coordinate calculation
  const defaultCenter = useMemo(() => {
    if (initialCenter && initialCenter[0] && initialCenter[1]) {
      return { lat: initialCenter[0], lng: initialCenter[1] };
    }
    if (authorizedBarangayName) {
      const bg = HINUNANGAN_BARANGAYS.find(
        b => b.name.toLowerCase() === authorizedBarangayName.toLowerCase()
      );
      if (bg) return { lat: bg.latitude, lng: bg.longitude };
    }
    return { lat: 10.4015, lng: 125.195 };
  }, [initialCenter, authorizedBarangayName]);

  // Camera State
  const [targetCenter, setTargetCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [targetZoom, setTargetZoom] = useState<number | null>(null);

  // Map Mode: hybrid, roadmap, satellite, terrain
  const [mapType, setMapType] = useState<'hybrid' | 'roadmap' | 'satellite' | 'terrain'>('hybrid');

  // Layer Visibility Toggles
  const [showBoundaries, setShowBoundaries] = useState<boolean>(true);
  const [showSwinePins, setShowSwinePins] = useState<boolean>(true);
  const [showFarmerPins, setShowFarmerPins] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [showAsfZones, setShowAsfZones] = useState<boolean>(true);
  const [showHeatmap, setShowHeatmap] = useState<boolean>(false);
  const [heatmapMode, setHeatmapMode] = useState<HeatmapMode>('swine_density');
  const [heatmapOpacity, setHeatmapOpacity] = useState<number>(0.5);
  const [boundaryOpacity, setBoundaryOpacity] = useState<number>(0.18);

  // Filter States
  const [selectedBarangayFilter, setSelectedBarangayFilter] = useState<string>(
    authorizedBarangayName || selectedBarangay || 'all'
  );
  const [selectedSwineType, setSelectedSwineType] = useState<string>('all');
  const [selectedMarketStatus, setSelectedMarketStatus] = useState<string>('all');
  const [selectedAsfZone, setSelectedAsfZone] = useState<string>('all');

  // UI Panels
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState<boolean>(false);
  const [isLegendOpen, setIsLegendOpen] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [accessWarning, setAccessWarning] = useState<string | null>(null);

  // Selection States
  const [selectedSwineRecord, setSelectedSwineRecord] = useState<SwineRecord | null>(null);
  const [selectedFarmerData, setSelectedFarmerData] = useState<any | null>(null);
  const [selectedBarangayData, setSelectedBarangayData] = useState<BarangayGisMetrics | null>(null);
  const [hoveredBarangay, setHoveredBarangay] = useState<string | null>(null);
  const [pickedPoint, setPickedPoint] = useState<{ lat: number; lng: number } | null>(null);

  // Boundary Storage
  useEffect(() => {
    initBoundaryStorage();
  }, []);

  const storedBarangayBoundaries = useMemo<Record<string, [number, number][]>>(() => {
    return getStoredBarangayBoundaries();
  }, []);

  // Compute live metrics from the single source of truth: Swine Records
  const allBarangayMetrics = useMemo(() => {
    return computeBarangayGisMetrics(barangays, swineList, authorizedBarangayName);
  }, [barangays, swineList, authorizedBarangayName]);

  // Compute Heatmap Points
  const heatmapData = useMemo(() => {
    return generateHeatmapPoints(allBarangayMetrics, heatmapMode);
  }, [allBarangayMetrics, heatmapMode]);

  // Filtered Swine Records for Display
  const filteredSwineRecords = useMemo(() => {
    return swineList.filter(s => {
      if (s.isArchived) return false;

      // 1. Strict Focal Person Restriction
      if (authorizedBarangayName) {
        if ((s.barangay || '').trim().toLowerCase() !== authorizedBarangayName.toLowerCase()) {
          return false;
        }
      }

      // 2. Admin Barangay Filter
      if (
        !authorizedBarangayName &&
        selectedBarangayFilter !== 'all' &&
        (s.barangay || '').toLowerCase() !== selectedBarangayFilter.toLowerCase()
      ) {
        return false;
      }

      // 3. Swine Type Filter
      if (selectedSwineType !== 'all' && s.swineType !== selectedSwineType) {
        return false;
      }

      // 4. Market Status Filter
      if (selectedMarketStatus === 'ready_to_sell' && !s.readyToSell && s.status !== 'ready_to_sell') {
        return false;
      }
      if (selectedMarketStatus === 'active' && s.status !== 'healthy') {
        return false;
      }
      if (selectedMarketStatus === 'sold' && s.status !== 'sold') {
        return false;
      }

      // 5. ASF Zone Filter
      if (selectedAsfZone !== 'all') {
        const bgMetric = allBarangayMetrics.find(
          b => b.barangayName.toLowerCase() === (s.barangay || '').toLowerCase()
        );
        if (bgMetric && bgMetric.asfZone !== selectedAsfZone) {
          return false;
        }
      }

      return true;
    });
  }, [
    swineList,
    authorizedBarangayName,
    selectedBarangayFilter,
    selectedSwineType,
    selectedMarketStatus,
    selectedAsfZone,
    allBarangayMetrics,
  ]);

  // Swine with valid GPS coordinates
  const swineWithGps = useMemo(() => {
    return filteredSwineRecords.filter(
      s => typeof s.latitude === 'number' && typeof s.longitude === 'number' && s.latitude > 0 && s.longitude > 0
    );
  }, [filteredSwineRecords]);

  // Distinct Farmer Markers from swine pens
  const farmerMarkers = useMemo(() => {
    const map = new Map<string, { farmerName: string; contact: string; barangay: string; lat: number; lng: number; swineCount: number; farmType: string }>();
    swineWithGps.forEach(s => {
      const key = `${s.farmerName || 'Unknown'}-${s.barangay}`;
      if (!map.has(key)) {
        map.set(key, {
          farmerName: s.farmerName || 'Farmer',
          contact: s.farmerContact || 'N/A',
          barangay: s.barangay,
          lat: s.latitude,
          lng: s.longitude,
          swineCount: 1,
          farmType: s.farmType || 'backyard',
        });
      } else {
        const existing = map.get(key)!;
        existing.swineCount += 1;
      }
    });
    return Array.from(map.values());
  }, [swineWithGps]);

  // Target swine focus on load/update
  useEffect(() => {
    if (!targetSwineId) return;
    const target = swineList.find(s => s.id === targetSwineId || s.pigIdTag === targetSwineId);
    if (!target) return;

    if (authorizedBarangayName && (target.barangay || '').toLowerCase() !== authorizedBarangayName.toLowerCase()) {
      setAccessWarning(`Access restricted. Swine ${target.pigIdTag || target.id} belongs to Barangay ${target.barangay}. You are assigned to Barangay ${authorizedBarangayName}.`);
      return;
    }

    if (target.latitude && target.longitude && target.latitude > 0 && target.longitude > 0) {
      setTargetCenter({ lat: target.latitude, lng: target.longitude });
      setTargetZoom(16);
      setSelectedSwineRecord(target);
    } else {
      const bg = HINUNANGAN_BARANGAYS.find(b => b.name.toLowerCase() === (target.barangay || '').toLowerCase());
      if (bg) {
        setTargetCenter({ lat: bg.latitude, lng: bg.longitude });
        setTargetZoom(14);
      }
      setSelectedSwineRecord(target);
    }
  }, [targetSwineId, swineList, authorizedBarangayName]);

  // Reactive Synchronize and focus when selectedBarangay prop changes (e.g. Admin selects barangay in SwineForm)
  useEffect(() => {
    if (!selectedBarangay || selectedBarangay === 'all') return;
    setSelectedBarangayFilter(selectedBarangay);

    const metric = allBarangayMetrics.find(
      m => m.barangayName.toLowerCase() === selectedBarangay.toLowerCase()
    );
    if (metric) {
      setSelectedBarangayData(metric);
      setTargetCenter({ lat: metric.latitude, lng: metric.longitude });
      setTargetZoom(14);
    } else {
      const bg = HINUNANGAN_BARANGAYS.find(
        b => b.name.toLowerCase() === selectedBarangay.toLowerCase()
      );
      if (bg) {
        setTargetCenter({ lat: bg.latitude, lng: bg.longitude });
        setTargetZoom(14);
      }
    }
  }, [selectedBarangay, allBarangayMetrics]);

  // Reactive Synchronize map camera and pin when initialCenter coordinates change
  useEffect(() => {
    if (initialCenter && initialCenter[0] && initialCenter[1]) {
      setPickedPoint({ lat: initialCenter[0], lng: initialCenter[1] });
      setTargetCenter({ lat: initialCenter[0], lng: initialCenter[1] });
      setTargetZoom(15);
    }
  }, [initialCenter?.[0], initialCenter?.[1]]);

  // Search Results
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase();

    // If focal person, restrict search to assigned barangay
    if (authorizedBarangayName) {
      const pigs = filteredSwineRecords.filter(
        s =>
          (s.pigIdTag && s.pigIdTag.toLowerCase().includes(term)) ||
          (s.farmerName && s.farmerName.toLowerCase().includes(term))
      );
      return pigs.slice(0, 5).map(p => ({
        type: 'swine' as const,
        label: `${p.pigIdTag || p.earTagNo} - ${p.farmerName} (${p.barangay})`,
        data: p,
      }));
    }

    // Admin search: Barangays + Swine
    const matchedBg = HINUNANGAN_BARANGAYS.filter(b => b.name.toLowerCase().includes(term));
    const matchedSwine = swineList.filter(
      s =>
        (s.pigIdTag && s.pigIdTag.toLowerCase().includes(term)) ||
        (s.farmerName && s.farmerName.toLowerCase().includes(term))
    );

    const results: any[] = [];
    matchedBg.forEach(b => results.push({ type: 'barangay', label: `Brgy. ${b.name}`, data: b }));
    matchedSwine.slice(0, 5).forEach(s =>
      results.push({
        type: 'swine',
        label: `${s.pigIdTag || s.earTagNo} - ${s.farmerName} (${s.barangay})`,
        data: s,
      })
    );
    return results;
  }, [searchTerm, authorizedBarangayName, filteredSwineRecords, swineList]);

  // Handle clicking a barangay polygon
  const handleBarangayClick = (name: string) => {
    if (authorizedBarangayName && name.toLowerCase() !== authorizedBarangayName.toLowerCase()) {
      setAccessWarning(`Access restricted. You are assigned to: ${authorizedBarangayName}`);
      setTimeout(() => setAccessWarning(null), 4000);
      return;
    }

    const metric = allBarangayMetrics.find(m => m.barangayName.toLowerCase() === name.toLowerCase());
    if (metric) {
      setSelectedBarangayData(metric);
      setTargetCenter({ lat: metric.latitude, lng: metric.longitude });
      setTargetZoom(14);
    }
  };

  return (
    <div className="relative w-full h-[640px] md:h-[720px] rounded-2xl overflow-hidden shadow-xl border border-stone-200 bg-stone-900 select-none">
      {/* Top Warning Banner for Access Control */}
      {accessWarning && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-rose-600/95 text-white px-5 py-2.5 rounded-xl shadow-2xl flex items-center gap-3 backdrop-blur-md border border-rose-300 animate-bounce text-sm font-semibold">
          <AlertTriangle className="w-5 h-5 text-amber-200 flex-shrink-0" />
          <span>{accessWarning}</span>
          <button
            onClick={() => setAccessWarning(null)}
            className="ml-2 hover:opacity-80 p-0.5 rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Role / Assigned Barangay Indicator Badge */}
      <div className="absolute top-3 left-3 z-30 flex items-center gap-2">
        <div className="bg-stone-900/90 text-white px-3 py-1.5 rounded-xl border border-stone-700 shadow-md backdrop-blur-md flex items-center gap-2 text-xs">
          {isFocal ? (
            <>
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-stone-400">Focal Account:</span>
              <span className="font-bold text-emerald-400">Brgy. {authorizedBarangayName}</span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
                RESTRICTED ACCESS
              </span>
            </>
          ) : (
            <>
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-stone-400">Admin Mode:</span>
              <span className="font-bold text-white">Full Municipality Access (40 Barangays)</span>
            </>
          )}
        </div>
      </div>

      {/* Top Right Controls & Search */}
      <div className="absolute top-3 right-3 z-30 flex items-center gap-2">
        {/* Search Bar */}
        <div className="relative">
          <div className="flex items-center bg-stone-900/90 border border-stone-700 rounded-xl px-2.5 py-1.5 shadow-md backdrop-blur-md text-xs text-white">
            <Search className="w-3.5 h-3.5 text-stone-400 mr-1.5" />
            <input
              type="text"
              placeholder={isFocal ? `Search Brgy. ${authorizedBarangayName}...` : 'Search barangay or swine...'}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-transparent text-white placeholder-stone-400 outline-none w-36 md:w-56 text-xs"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="text-stone-400 hover:text-white">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Search Results Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute top-full mt-1 right-0 w-64 bg-stone-900/95 border border-stone-700 rounded-xl shadow-2xl p-1.5 z-40 backdrop-blur-md">
              {searchResults.map((res, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (res.type === 'barangay') {
                      handleBarangayClick(res.data.name);
                    } else {
                      setSelectedSwineRecord(res.data);
                      if (res.data.latitude && res.data.longitude) {
                        setTargetCenter({ lat: res.data.latitude, lng: res.data.longitude });
                        setTargetZoom(16);
                      }
                    }
                    setSearchTerm('');
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-stone-800 text-xs text-stone-200 flex items-center justify-between transition cursor-pointer"
                >
                  <span className="truncate">{res.label}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-stone-500" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Filters Toggle Button */}
        <button
          onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
          className={`px-3 py-1.5 rounded-xl border shadow-md backdrop-blur-md flex items-center gap-1.5 text-xs font-semibold transition cursor-pointer ${
            isFilterPanelOpen
              ? 'bg-emerald-600 text-white border-emerald-500'
              : 'bg-stone-900/90 text-stone-200 border-stone-700 hover:bg-stone-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Filters</span>
        </button>

        {/* Map Type Toggle */}
        <div className="hidden sm:flex bg-stone-900/90 border border-stone-700 rounded-xl p-0.5 shadow-md backdrop-blur-md text-xs">
          <button
            onClick={() => setMapType('hybrid')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
              mapType === 'hybrid' ? 'bg-emerald-600 text-white' : 'text-stone-300 hover:text-white'
            }`}
          >
            Satellite
          </button>
          <button
            onClick={() => setMapType('roadmap')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
              mapType === 'roadmap' ? 'bg-emerald-600 text-white' : 'text-stone-300 hover:text-white'
            }`}
          >
            Roads
          </button>
          <button
            onClick={() => setMapType('terrain')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
              mapType === 'terrain' ? 'bg-emerald-600 text-white' : 'text-stone-300 hover:text-white'
            }`}
          >
            Terrain
          </button>
        </div>

        {/* Fallback to Leaflet Button */}
        {onSwitchToLeaflet && (
          <button
            onClick={onSwitchToLeaflet}
            className="bg-stone-900/90 hover:bg-stone-800 text-stone-300 border border-stone-700 px-2.5 py-1.5 rounded-xl shadow-md backdrop-blur-md text-xs font-medium flex items-center gap-1 cursor-pointer transition"
            title="Switch to Offline-Ready Leaflet Map"
          >
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Leaflet</span>
          </button>
        )}
      </div>

      {/* Filter & Layer Drawer Panel */}
      {isFilterPanelOpen && (
        <div className="absolute top-14 right-3 z-40 w-80 bg-stone-900/95 border border-stone-700 rounded-2xl p-4 shadow-2xl backdrop-blur-md text-white text-xs space-y-3.5 max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between pb-2 border-b border-stone-800">
            <h3 className="font-bold text-sm text-emerald-400 flex items-center gap-1.5">
              <Layers className="w-4 h-4" /> GIS Layer & Record Filters
            </h3>
            <button onClick={() => setIsFilterPanelOpen(false)} className="text-stone-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Barangay Filter (Admin Only; Locked for Focal Person) */}
          <div>
            <label className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block mb-1">
              Barangay Scope
            </label>
            {isFocal ? (
              <div className="bg-stone-800/80 border border-amber-500/40 rounded-xl px-3 py-2 text-stone-300 flex items-center justify-between">
                <span>{authorizedBarangayName}</span>
                <span className="text-[10px] text-amber-400 font-semibold uppercase flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Locked to Assigned
                </span>
              </div>
            ) : (
              <select
                value={selectedBarangayFilter}
                onChange={e => setSelectedBarangayFilter(e.target.value)}
                className="w-full bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-white outline-none cursor-pointer"
              >
                <option value="all">All 40 Hinunangan Barangays</option>
                {HINUNANGAN_BARANGAYS.map(b => (
                  <option key={b.id} value={b.name}>
                    Brgy. {b.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Swine Type Filter */}
          <div>
            <label className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block mb-1">
              Swine Type
            </label>
            <select
              value={selectedSwineType}
              onChange={e => setSelectedSwineType(e.target.value)}
              className="w-full bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-white outline-none cursor-pointer"
            >
              <option value="all">All Swine Types (Boar, Sow, Piglet, etc.)</option>
              <option value="boar">Breeding Boars</option>
              <option value="sow">Breeding Sows</option>
              <option value="piglet">Piglets</option>
              <option value="grower">Growers</option>
              <option value="finisher">Fatteners / Finishers</option>
            </select>
          </div>

          {/* Market Status Filter */}
          <div>
            <label className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block mb-1">
              Market Status
            </label>
            <select
              value={selectedMarketStatus}
              onChange={e => setSelectedMarketStatus(e.target.value)}
              className="w-full bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-white outline-none cursor-pointer"
            >
              <option value="all">All Market Statuses</option>
              <option value="ready_to_sell">🌟 Ready for Market Sale Only</option>
              <option value="active">Active / Healthy</option>
              <option value="sold">Sold</option>
            </select>
          </div>

          {/* ASF Zone Filter */}
          <div>
            <label className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block mb-1">
              ASF Biosafety Zone
            </label>
            <select
              value={selectedAsfZone}
              onChange={e => setSelectedAsfZone(e.target.value)}
              className="w-full bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-white outline-none cursor-pointer"
            >
              <option value="all">All ASF Zones</option>
              <option value="RED">🔴 Red Zone (Infected / Quarantine)</option>
              <option value="PINK">🟣 Pink Zone (Buffer)</option>
              <option value="YELLOW">🟡 Yellow Zone (Surveillance)</option>
              <option value="GREEN">🟢 Green Zone (Protected / Free)</option>
            </select>
          </div>

          {/* Heatmap Controls */}
          <div className="pt-2 border-t border-stone-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-stone-300 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-400" /> Livestock Heatmap
              </span>
              <input
                type="checkbox"
                checked={showHeatmap}
                onChange={e => setShowHeatmap(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 cursor-pointer accent-emerald-500"
              />
            </div>

            {showHeatmap && (
              <div className="space-y-2 pl-2 border-l-2 border-orange-500/40 mt-1.5">
                <div>
                  <label className="text-[10px] text-stone-400 block mb-1">Heatmap Mode</label>
                  <select
                    value={heatmapMode}
                    onChange={e => setHeatmapMode(e.target.value as HeatmapMode)}
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg px-2 py-1 text-xs text-stone-200 outline-none"
                  >
                    <option value="swine_density">Total Swine Density</option>
                    <option value="farmer_density">Farmer Density</option>
                    <option value="ready_to_sell">Ready-to-Sell Swine</option>
                    <option value="breeding_boar">Breeding Boar Density</option>
                    <option value="registry_activity">Registry Activity Index</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-stone-400 mb-0.5">
                    <span>Heatmap Opacity</span>
                    <span>{Math.round(heatmapOpacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="0.9"
                    step="0.05"
                    value={heatmapOpacity}
                    onChange={e => setHeatmapOpacity(parseFloat(e.target.value))}
                    className="w-full accent-orange-500 cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Layer Visibility Toggles */}
          <div className="pt-2 border-t border-stone-800 space-y-1.5">
            <label className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block mb-1">
              Display Layers
            </label>
            <label className="flex items-center justify-between text-stone-300 hover:text-white cursor-pointer py-0.5">
              <span>Barangay Polygons</span>
              <input
                type="checkbox"
                checked={showBoundaries}
                onChange={e => setShowBoundaries(e.target.checked)}
                className="w-3.5 h-3.5 rounded accent-emerald-500 cursor-pointer"
              />
            </label>
            <label className="flex items-center justify-between text-stone-300 hover:text-white cursor-pointer py-0.5">
              <span>Swine Locations (🐖)</span>
              <input
                type="checkbox"
                checked={showSwinePins}
                onChange={e => setShowSwinePins(e.target.checked)}
                className="w-3.5 h-3.5 rounded accent-emerald-500 cursor-pointer"
              />
            </label>
            <label className="flex items-center justify-between text-stone-300 hover:text-white cursor-pointer py-0.5">
              <span>Farmer Locations (👤)</span>
              <input
                type="checkbox"
                checked={showFarmerPins}
                onChange={e => setShowFarmerPins(e.target.checked)}
                className="w-3.5 h-3.5 rounded accent-emerald-500 cursor-pointer"
              />
            </label>
            <label className="flex items-center justify-between text-stone-300 hover:text-white cursor-pointer py-0.5">
              <span>Barangay Labels</span>
              <input
                type="checkbox"
                checked={showLabels}
                onChange={e => setShowLabels(e.target.checked)}
                className="w-3.5 h-3.5 rounded accent-emerald-500 cursor-pointer"
              />
            </label>
          </div>
        </div>
      )}

      {/* Main Google Maps Viewport */}
      <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}>
        <GoogleMap
          mapId={import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID'}
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          defaultCenter={defaultCenter}
          defaultZoom={13}
          mapTypeId={mapType}
          disableDefaultUI={true}
          gestureHandling="greedy"
          className="w-full h-full"
          onClick={e => {
            if (e.detail.latLng) {
              const { lat, lng } = e.detail.latLng;
              setPickedPoint({ lat, lng });
              const closest = findClosestBarangay(lat, lng);
              if (onPickLocation) {
                onPickLocation(Number(lat.toFixed(6)), Number(lng.toFixed(6)), closest.name);
              }
            }
          }}
        >
          <MapCameraController targetCenter={targetCenter} targetZoom={targetZoom} />

          <GoogleMapOverlays>
            {/* 1. Barangay Cadastral Boundaries (Filtered by Authorization) */}
            {showBoundaries &&
              HINUNANGAN_BARANGAYS.map(b => {
                // Focal Person Restriction: Render ONLY their assigned barangay
                if (authorizedBarangayName && b.name.toLowerCase() !== authorizedBarangayName.toLowerCase()) {
                  return null;
                }

                const rawCoords =
                  storedBarangayBoundaries[b.name] || HINUNANGAN_BARANGAY_BOUNDARIES[b.name] || [];
                if (!rawCoords || rawCoords.length < 3) return null;

                const path = rawCoords.map(coord => ({ lat: coord[0], lng: coord[1] }));
                const metric = allBarangayMetrics.find(
                  m => m.barangayName.toLowerCase() === b.name.toLowerCase()
                );

                const riskLevel = metric?.riskLevel || b.defaultRiskLevel;
                const strokeColor =
                  riskLevel === 'red' ? '#dc2626' : riskLevel === 'yellow' ? '#d97706' : '#059669';
                const fillColor = strokeColor;
                const isHovered = hoveredBarangay === b.name;
                const isSelected = Boolean(
                  (selectedBarangay && b.name.toLowerCase() === selectedBarangay.toLowerCase()) ||
                  (selectedBarangayFilter !== 'all' && b.name.toLowerCase() === selectedBarangayFilter.toLowerCase())
                );

                return (
                  <Polygon
                    key={b.id}
                    paths={path}
                    strokeColor={isSelected ? '#10b981' : strokeColor}
                    strokeOpacity={isSelected ? 1 : 0.9}
                    strokeWeight={isSelected ? 4 : isHovered ? 3 : 1.5}
                    fillColor={isSelected ? '#10b981' : fillColor}
                    fillOpacity={isSelected ? 0.42 : isHovered ? 0.35 : boundaryOpacity}
                    clickable={true}
                    zIndex={isSelected ? 100 : 1}
                    onClick={() => handleBarangayClick(b.name)}
                    onMouseOver={() => setHoveredBarangay(b.name)}
                    onMouseOut={() => setHoveredBarangay(null)}
                  />
                );
              })}

            {/* 2. Heatmap Density Circles (Calculated from Real Swine Records) */}
            {showHeatmap &&
              heatmapData.points.map((pt, idx) => {
                const color = getHeatmapColor(pt.intensity, heatmapOpacity);
                const radius = Math.max(120, Math.min(650, pt.intensity * 600));

                return (
                  <Circle
                    key={`heat-${idx}`}
                    center={{ lat: pt.lat, lng: pt.lng }}
                    radius={radius}
                    fillColor={color}
                    fillOpacity={heatmapOpacity}
                    strokeColor="#ffffff"
                    strokeOpacity={0.3}
                    strokeWeight={0.75}
                    clickable={false}
                  />
                );
              })}

            {/* 3. Swine Markers with Pig Icon 🐖 */}
            {showSwinePins &&
              swineWithGps.map(swine => {
                const isReady = swine.readyToSell || swine.status === 'ready_to_sell';
                return (
                  <AdvancedMarker
                    key={swine.id}
                    position={{ lat: swine.latitude, lng: swine.longitude }}
                    onClick={() => {
                      setSelectedSwineRecord(swine);
                      setSelectedFarmerData(null);
                      if (onSelectSwine) onSelectSwine(swine);
                    }}
                  >
                    <div
                      style={{
                        transform: 'translate(-50%, -100%)',
                        cursor: 'pointer',
                        filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.4))',
                        transition: 'transform 0.15s ease-out',
                      }}
                      className="hover:scale-125 flex flex-col items-center"
                    >
                      <div
                        style={{
                          backgroundColor: isReady ? '#f59e0b' : '#dc2626',
                          color: '#ffffff',
                          borderRadius: '50%',
                          width: '28px',
                          height: '28px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '2px solid #ffffff',
                          fontSize: '14px',
                          boxShadow: isReady ? '0 0 10px rgba(245,158,11,0.8)' : 'none',
                        }}
                      >
                        🐖
                      </div>
                      <div className="bg-stone-900/90 text-white font-bold text-[9px] px-1 py-0.2 rounded mt-0.5 border border-stone-700 whitespace-nowrap">
                        {swine.pigIdTag || swine.earTagNo}
                      </div>
                    </div>
                  </AdvancedMarker>
                );
              })}

            {/* 4. Farmer Markers with Icon 👤 */}
            {showFarmerPins &&
              farmerMarkers.map((farmer, idx) => (
                <AdvancedMarker
                  key={`farmer-${idx}`}
                  position={{ lat: farmer.lat + 0.0003, lng: farmer.lng + 0.0003 }}
                  onClick={() => {
                    setSelectedFarmerData(farmer);
                    setSelectedSwineRecord(null);
                  }}
                >
                  <div
                    style={{
                      transform: 'translate(-50%, -100%)',
                      cursor: 'pointer',
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                    }}
                    className="hover:scale-115 flex items-center justify-center bg-blue-600 text-white w-6 h-6 rounded-full border border-white text-xs"
                    title={`Farmer: ${farmer.farmerName}`}
                  >
                    👤
                  </div>
                </AdvancedMarker>
              ))}

            {/* 5. Swine Marker Detail InfoWindow with "View Swine Record" button */}
            {selectedSwineRecord && selectedSwineRecord.latitude > 0 && selectedSwineRecord.longitude > 0 && (
              <InfoWindow
                position={{ lat: selectedSwineRecord.latitude, lng: selectedSwineRecord.longitude }}
                onCloseClick={() => setSelectedSwineRecord(null)}
              >
                <div className="p-2 max-w-xs text-stone-900">
                  <div className="flex items-center justify-between pb-1.5 border-b border-stone-200">
                    <span className="font-bold text-sm text-emerald-800 flex items-center gap-1">
                      🐖 {selectedSwineRecord.pigIdTag || selectedSwineRecord.earTagNo}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        selectedSwineRecord.readyToSell || selectedSwineRecord.status === 'ready_to_sell'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {selectedSwineRecord.readyToSell ? 'Ready for Sale' : selectedSwineRecord.status}
                    </span>
                  </div>

                  <div className="text-xs space-y-1 my-2">
                    <div>
                      <span className="text-stone-500">Farmer:</span>{' '}
                      <strong className="text-stone-900">{selectedSwineRecord.farmerName}</strong>
                    </div>
                    <div>
                      <span className="text-stone-500">Barangay:</span>{' '}
                      <strong>{selectedSwineRecord.barangay}</strong>
                    </div>
                    <div>
                      <span className="text-stone-500">Swine Type:</span>{' '}
                      <strong className="capitalize">{selectedSwineRecord.swineType}</strong>
                    </div>
                    <div>
                      <span className="text-stone-500">Age:</span>{' '}
                      <strong>{selectedSwineRecord.ageDays || 0} days</strong>
                    </div>
                    <div>
                      <span className="text-stone-500">Weight:</span>{' '}
                      <strong>
                        {selectedSwineRecord.actualWeightKg
                          ? `${selectedSwineRecord.actualWeightKg} kg (Actual)`
                          : selectedSwineRecord.estimatedWeightKg || 'N/A'}
                      </strong>
                    </div>
                  </div>

                  {onViewSwineRecord && (
                    <button
                      onClick={() => {
                        onViewSwineRecord(selectedSwineRecord);
                        setSelectedSwineRecord(null);
                      }}
                      className="w-full mt-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-1.5 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> View Swine Record
                    </button>
                  )}
                </div>
              </InfoWindow>
            )}

            {/* 6. Farmer Marker Detail InfoWindow */}
            {selectedFarmerData && (
              <InfoWindow
                position={{ lat: selectedFarmerData.lat, lng: selectedFarmerData.lng }}
                onCloseClick={() => setSelectedFarmerData(null)}
              >
                <div className="p-2 max-w-xs text-stone-900">
                  <div className="flex items-center gap-1.5 pb-1 border-b border-stone-200">
                    <span className="text-blue-600 font-bold text-sm">👤 Registered Swine Farmer</span>
                  </div>
                  <div className="text-xs space-y-1 my-2">
                    <div>
                      <span className="text-stone-500">Name:</span> <strong>{selectedFarmerData.farmerName}</strong>
                    </div>
                    <div>
                      <span className="text-stone-500">Contact:</span> <strong>{selectedFarmerData.contact}</strong>
                    </div>
                    <div>
                      <span className="text-stone-500">Barangay:</span> <strong>{selectedFarmerData.barangay}</strong>
                    </div>
                    <div>
                      <span className="text-stone-500">Total Registered Swine:</span>{' '}
                      <strong className="text-emerald-700 font-bold">{selectedFarmerData.swineCount} heads</strong>
                    </div>
                  </div>
                </div>
              </InfoWindow>
            )}
          </GoogleMapOverlays>
        </GoogleMap>
      </APIProvider>

      {/* Selected Barangay Live Livestock Stats Card (Admin & Focal Inspector) */}
      {selectedBarangayData && (
        <div className="absolute bottom-4 left-4 z-30 w-84 bg-stone-900/95 border border-stone-700 rounded-2xl p-4 shadow-2xl backdrop-blur-md text-white text-xs max-h-[85vh] overflow-y-auto">
          <div className="flex items-center justify-between pb-2 border-b border-stone-800">
            <div>
              <h4 className="font-bold text-sm text-emerald-400 flex items-center gap-1.5">
                <Building className="w-4 h-4" /> Brgy. {selectedBarangayData.barangayName}
              </h4>
              <span className="text-[10px] text-stone-400">
                Focal Officer: {selectedBarangayData.focalPersonName || 'Municipal Office'}
              </span>
            </div>
            <button onClick={() => setSelectedBarangayData(null)} className="text-stone-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 my-2.5">
            <div className="bg-stone-800/80 p-2 rounded-xl border border-stone-700/60">
              <span className="text-stone-400 text-[10px] block">Total Swine Heads</span>
              <strong className="text-lg text-emerald-400 font-black">{selectedBarangayData.totalSwine}</strong>
            </div>
            <div className="bg-stone-800/80 p-2 rounded-xl border border-stone-700/60">
              <span className="text-stone-400 text-[10px] block">Registered Farmers</span>
              <strong className="text-lg text-blue-400 font-black">{selectedBarangayData.registeredFarmers}</strong>
            </div>
          </div>

          <div className="space-y-1.5 bg-stone-800/40 p-2 rounded-xl border border-stone-800">
            <div className="flex justify-between">
              <span className="text-stone-400">Breeding Boars:</span>
              <strong className="text-amber-400">{selectedBarangayData.breedingBoars}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-400">Breeding Sows:</span>
              <strong className="text-purple-400">{selectedBarangayData.breedingSows}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-400">Piglets:</span>
              <strong>{selectedBarangayData.piglets}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-400">Growers:</span>
              <strong>{selectedBarangayData.growers}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-400">Fatteners / Finishers:</span>
              <strong>{selectedBarangayData.fatteners}</strong>
            </div>
            <div className="flex justify-between pt-1 border-t border-stone-700">
              <span className="text-stone-400">Ready for Market Sale:</span>
              <strong className="text-emerald-400">🌟 {selectedBarangayData.readyForSale}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-400">ASF Zone Status:</span>
              <span
                className={`font-bold text-[10px] px-1.5 py-0.5 rounded uppercase ${
                  selectedBarangayData.asfZone === 'RED'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : selectedBarangayData.asfZone === 'YELLOW'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}
              >
                {selectedBarangayData.asfZone} ZONE
              </span>
            </div>
          </div>

          {selectedBarangayData.swineWithoutGps > 0 && (
            <div className="mt-2 p-2 bg-stone-800/60 rounded-xl border border-stone-700 text-[10px] text-stone-300">
              <span className="text-amber-400 font-semibold block mb-0.5">ℹ Geographic Polygon Association:</span>
              {selectedBarangayData.swineWithoutGps} swine record(s) without pen GPS coordinates are associated with this barangay polygon without invented coordinates.
            </div>
          )}
        </div>
      )}

      {/* Map Legend (Permanent / Collapsible) */}
      <div className="absolute bottom-4 right-4 z-30">
        {isLegendOpen ? (
          <div className="bg-stone-900/95 border border-stone-700 rounded-2xl p-3 shadow-2xl backdrop-blur-md text-white text-xs w-64 space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-stone-800">
              <span className="font-bold text-[11px] text-stone-300 uppercase tracking-wider">GIS Map Legend</span>
              <button onClick={() => setIsLegendOpen(false)} className="text-stone-400 hover:text-white">
                <EyeOff className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="w-4 h-2.5 border border-emerald-500 bg-emerald-500/20 rounded-xs"></span>
                <span>Barangay Cadastral Boundary</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px]">
                  🐖
                </span>
                <span>Swine Location (Red: Active, Gold: Ready)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                  👤
                </span>
                <span>Registered Farmer Location</span>
              </div>
              <div className="pt-1 border-t border-stone-800">
                <span className="text-[10px] text-stone-400 block mb-1 font-semibold">ASF BIOSAFETY ZONES:</span>
                <div className="grid grid-cols-2 gap-1 text-[10px]">
                  <span className="flex items-center gap-1 text-red-400">🔴 Red (Infected)</span>
                  <span className="flex items-center gap-1 text-purple-400">🟣 Pink (Buffer)</span>
                  <span className="flex items-center gap-1 text-yellow-400">🟡 Yellow (Surv.)</span>
                  <span className="flex items-center gap-1 text-emerald-400">🟢 Green (Free)</span>
                </div>
              </div>

              {showHeatmap && (
                <div className="pt-1 border-t border-stone-800">
                  <span className="text-[10px] text-stone-400 block mb-1 font-semibold">
                    HEATMAP INTENSITY ({heatmapMode.replace('_', ' ').toUpperCase()}):
                  </span>
                  <div className="h-2 w-full rounded bg-gradient-to-r from-emerald-500 via-amber-400 to-red-600" />
                  <div className="flex justify-between text-[9px] text-stone-400 mt-0.5">
                    <span>Min: {heatmapData.minVal}</span>
                    <span>Max: {heatmapData.maxVal}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsLegendOpen(true)}
            className="bg-stone-900/90 hover:bg-stone-800 text-stone-300 border border-stone-700 px-3 py-1.5 rounded-xl shadow-md backdrop-blur-md text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition"
          >
            <Eye className="w-3.5 h-3.5" /> Show Legend
          </button>
        )}
      </div>
    </div>
  );
};

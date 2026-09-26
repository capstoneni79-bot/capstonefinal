import React, { Component, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  MapPin,
  Layers,
  Flame,
  Shield,
  Eye,
  EyeOff,
  Crosshair,
  Info,
  Maximize2,
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
import L from 'leaflet';
import { Barangay, SwineRecord, UserAccount, UserRole, ASFZone } from '../../types';
import { HINUNANGAN_BARANGAYS, HinunanganBarangayGeo, findClosestBarangay } from '../../data/barangays';
import {
  HINUNANGAN_BARANGAY_BOUNDARIES,
  HINUNANGAN_MUNICIPAL_METADATA,
} from '../../data/hinunanganBoundariesGeoJSON';
import {
  initBoundaryStorage,
  getStoredBarangayBoundaries,
} from '../../services/boundaryStorageService';
import {
  HeatmapMode,
  computeBarangayGisMetrics,
  generateHeatmapPoints,
  getHeatmapColor,
  BarangayGisMetrics,
} from '../../utils/gisCalculations';
import { calculateSwineAge, formatDobDisplay } from '../../utils/swineRegistryLogic';
import { GoogleGisMap } from './GoogleGisMap';

// Custom 3D Swine Marker Icon with 🐖
const createSwineMarkerIcon = (isReadyToSell: boolean, tagId: string = '') => {
  const bg = isReadyToSell ? '#f59e0b' : '#dc2626';
  const iconHtml = `
    <div style="position: relative; transform: translate(-50%, -100%); cursor: pointer; display: flex; flex-direction: column; align-items: center;" class="swine-map-marker">
      <div style="background-color: ${bg}; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 3px 6px rgba(0,0,0,0.4); font-size: 14px;">
        🐖
      </div>
      <div style="background: rgba(24, 24, 27, 0.9); color: white; font-weight: 700; font-size: 9px; padding: 1px 4px; border-radius: 4px; border: 1px solid #3f3f46; white-space: nowrap; margin-top: 2px;">
        ${tagId}
      </div>
    </div>
  `;
  return L.divIcon({
    className: 'custom-swine-marker-div',
    html: iconHtml,
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -40],
  });
};

// Custom Farmer Marker Icon with 👤
const createFarmerMarkerIcon = (farmerName: string) => {
  const iconHtml = `
    <div style="position: relative; transform: translate(-50%, -100%); cursor: pointer; display: flex; flex-direction: column; align-items: center;" class="farmer-map-marker">
      <div style="background-color: #2563eb; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 1.5px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.35); font-size: 11px;">
        👤
      </div>
      <div style="background: rgba(24, 24, 27, 0.9); color: white; font-weight: 700; font-size: 8px; padding: 1px 4px; border-radius: 4px; border: 1px solid #3f3f46; white-space: nowrap; margin-top: 2px;">
        ${farmerName}
      </div>
    </div>
  `;
  return L.divIcon({
    className: 'custom-farmer-marker-div',
    html: iconHtml,
    iconSize: [28, 38],
    iconAnchor: [14, 38],
    popupAnchor: [0, -36],
  });
};

// Clean Barangay Name Text Label on Map
const createBarangayTextLabel = (
  name: string,
  isUrban: boolean,
  riskLevel: 'green' | 'yellow' | 'red',
  isSelected: boolean
) => {
  const borderColor = isSelected
    ? '#dc2626'
    : riskLevel === 'red'
    ? '#ef4444'
    : riskLevel === 'yellow'
    ? '#d97706'
    : '#059669';

  const bgStyle = isSelected
    ? 'background: #dc2626; color: #ffffff; border: 1.5px solid #ffffff; font-weight: 800; box-shadow: 0 3px 8px rgba(220,38,38,0.5); transform: scale(1.1);'
    : 'background: rgba(255, 255, 255, 0.92); color: #1e293b; border: 1px solid rgba(203, 213, 225, 0.9); box-shadow: 0 1.5px 4px rgba(0,0,0,0.18);';

  const iconHtml = `
    <div style="pointer-events: auto; cursor: pointer; display: flex; align-items: center; justify-content: center; transform: translate(-50%, -50%);">
      <div style="${bgStyle} padding: 2px 7px; border-radius: 6px; font-size: 11px; font-weight: 700; white-space: nowrap; font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; gap: 4px; backdrop-blur: 4px; transition: all 0.2s ease;">
        <span style="width: 6px; height: 6px; border-radius: 50%; background: ${borderColor}; flex-shrink: 0;"></span>
        <span>${name}</span>
        ${isUrban ? '<span style="font-size: 8px; font-weight: 800; opacity: 0.75; text-transform: uppercase;">• Urban</span>' : ''}
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'custom-barangay-text-label',
    html: iconHtml,
    iconSize: [80, 20],
    iconAnchor: [40, 10],
  });
};

export interface GisMapProps {
  swineList: SwineRecord[];
  barangays: Barangay[];
  selectedBarangay?: string;
  currentUser?: UserAccount | null;
  currentRole?: UserRole | 'landing';
  onSelectSwine?: (swine: SwineRecord) => void;
  onViewSwineRecord?: (swine: SwineRecord) => void;
  onPickLocation?: (lat: number, lng: number, closestBarangay?: string) => void;
  isLocationPicker?: boolean;
  isManualPinMode?: boolean;
  initialCenter?: [number, number];
  targetSwineId?: string | null;
}

interface LeafletGisMapProps extends GisMapProps {
  onSwitchToGoogle?: () => void;
}

const LeafletGisMap: React.FC<LeafletGisMapProps> = ({
  swineList,
  barangays,
  selectedBarangay,
  currentUser,
  currentRole = currentUser?.role || 'admin',
  onSelectSwine,
  onViewSwineRecord,
  onPickLocation,
  isLocationPicker = false,
  isManualPinMode: initialManualPinMode = false,
  initialCenter,
  targetSwineId,
  onSwitchToGoogle,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Dedicated Layer Groups
  const boundariesLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const labelsLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const swinePinsLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const farmerPinsLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const heatmapLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const droppedPinLayerRef = useRef<L.LayerGroup | null>(null);

  // Manual Pin Mode state
  const [isManualPinMode, setIsManualPinMode] = useState<boolean>(initialManualPinMode || isLocationPicker);
  const [droppedPin, setDroppedPin] = useState<{ lat: number; lng: number; barangay: string } | null>(
    initialCenter ? { lat: initialCenter[0], lng: initialCenter[1], barangay: findClosestBarangay(initialCenter[0], initialCenter[1]).name } : null
  );

  // Refs for stable map click event handler
  const onPickLocationRef = useRef(onPickLocation);
  onPickLocationRef.current = onPickLocation;

  const isManualPinModeRef = useRef(isManualPinMode);
  isManualPinModeRef.current = isManualPinMode;

  const isLocationPickerRef = useRef(isLocationPicker);
  isLocationPickerRef.current = isLocationPicker;

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

  // Map Controls State
  const [mapMode, setMapMode] = useState<'street' | 'satellite' | 'terrain'>('street');
  const [currentZoom, setCurrentZoom] = useState<number>(13);

  // Layer Visibility
  const [showBoundaries, setShowBoundaries] = useState<boolean>(true);
  const [showSwinePins, setShowSwinePins] = useState<boolean>(true);
  const [showFarmerPins, setShowFarmerPins] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(true);
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

  // UI Panels & Feedback
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState<boolean>(false);
  const [isLegendOpen, setIsLegendOpen] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [accessWarning, setAccessWarning] = useState<string | null>(null);
  const [selectedBarangayData, setSelectedBarangayData] = useState<BarangayGisMetrics | null>(null);

  // Tile layer URL definitions
  const tileLayers = {
    street: {
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      options: {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, DA Hinunangan GIS',
      },
    },
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      options: {
        maxZoom: 19,
        attribution: 'Tiles &copy; Esri &mdash; Hinunangan Satellite Imagery',
      },
    },
    terrain: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      options: {
        maxZoom: 19,
        attribution: 'Tiles &copy; Esri Topo &mdash; Hinunangan Terrain Topography',
      },
    },
  };

  // Compute live metrics from single source of truth: Swine Records
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
    const map = new Map<string, { farmerName: string; contact: string; barangay: string; lat: number; lng: number; swineCount: number }>();
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
        });
      } else {
        const existing = map.get(key)!;
        existing.swineCount += 1;
      }
    });
    return Array.from(map.values());
  }, [swineWithGps]);

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    let centerLat = 10.4015;
    let centerLng = 125.195;
    let initialZoom = 13;

    if (initialCenter && initialCenter[0] && initialCenter[1]) {
      centerLat = initialCenter[0];
      centerLng = initialCenter[1];
      initialZoom = 15;
    } else if (authorizedBarangayName) {
      const bg = HINUNANGAN_BARANGAYS.find(b => b.name.toLowerCase() === authorizedBarangayName.toLowerCase());
      if (bg) {
        centerLat = bg.latitude;
        centerLng = bg.longitude;
        initialZoom = 14;
      }
    }

    const map = L.map(mapContainerRef.current, {
      center: [centerLat, centerLng],
      zoom: initialZoom,
      zoomControl: false,
    });

    const currentConfig = tileLayers.street;
    const tile = L.tileLayer(currentConfig.url, currentConfig.options).addTo(map);
    tileLayerRef.current = tile;

    // Create Layer Groups in visual stacking order
    heatmapLayerGroupRef.current = L.layerGroup().addTo(map);
    boundariesLayerGroupRef.current = L.layerGroup().addTo(map);
    labelsLayerGroupRef.current = L.layerGroup().addTo(map);
    swinePinsLayerGroupRef.current = L.layerGroup().addTo(map);
    farmerPinsLayerGroupRef.current = L.layerGroup().addTo(map);
    droppedPinLayerRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    map.on('zoomend', () => {
      setCurrentZoom(map.getZoom());
    });

    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      const closest = findClosestBarangay(lat, lng);
      const roundedLat = Number(lat.toFixed(6));
      const roundedLng = Number(lng.toFixed(6));

      if (isManualPinModeRef.current || isLocationPickerRef.current) {
        setDroppedPin({ lat: roundedLat, lng: roundedLng, barangay: closest.name });
      }

      if (onPickLocationRef.current) {
        onPickLocationRef.current(roundedLat, roundedLng, closest.name);
      }
    });

    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(timer);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Base Tile Layer when mode changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }
    const currentConfig = tileLayers[mapMode];
    tileLayerRef.current = L.tileLayer(currentConfig.url, currentConfig.options).addTo(mapInstanceRef.current);
  }, [mapMode]);

  // Handle clicking a barangay polygon
  const handleBarangayClick = useCallback((name: string) => {
    if (authorizedBarangayName && name.toLowerCase() !== authorizedBarangayName.toLowerCase()) {
      setAccessWarning(`Access restricted. You are assigned to: ${authorizedBarangayName}`);
      setTimeout(() => setAccessWarning(null), 4000);
      return;
    }

    const metric = allBarangayMetrics.find(m => m.barangayName.toLowerCase() === name.toLowerCase());
    if (metric) {
      setSelectedBarangayData(metric);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([metric.latitude, metric.longitude], 14, { duration: 1 });
      }
    }
  }, [authorizedBarangayName, allBarangayMetrics]);

  // 2. Render Barangay Cadastral Boundaries
  useEffect(() => {
    if (!boundariesLayerGroupRef.current || !labelsLayerGroupRef.current) return;
    boundariesLayerGroupRef.current.clearLayers();
    labelsLayerGroupRef.current.clearLayers();

    if (!showBoundaries) return;

    const storedBgys = getStoredBarangayBoundaries();

    HINUNANGAN_BARANGAYS.forEach(b => {
      // Focal Person: Render ONLY assigned barangay boundary
      if (authorizedBarangayName && b.name.toLowerCase() !== authorizedBarangayName.toLowerCase()) {
        return;
      }

      const polygonCoords = storedBgys[b.name] || HINUNANGAN_BARANGAY_BOUNDARIES[b.name];
      if (!polygonCoords || polygonCoords.length < 3) return;

      const metric = allBarangayMetrics.find(m => m.barangayName.toLowerCase() === b.name.toLowerCase());
      const riskLevel = metric?.riskLevel || b.defaultRiskLevel;
      const strokeColor = riskLevel === 'red' ? '#dc2626' : riskLevel === 'yellow' ? '#d97706' : '#059669';

      const isSelected = Boolean(
        (selectedBarangay && b.name.toLowerCase() === selectedBarangay.toLowerCase()) ||
        (selectedBarangayFilter !== 'all' && b.name.toLowerCase() === selectedBarangayFilter.toLowerCase())
      );

      const poly = L.polygon(polygonCoords, {
        color: isSelected ? '#10b981' : strokeColor,
        weight: isSelected ? 3.5 : 1.5,
        opacity: isSelected ? 1 : 0.9,
        fillColor: isSelected ? '#10b981' : strokeColor,
        fillOpacity: isSelected ? Math.max(boundaryOpacity + 0.25, 0.42) : boundaryOpacity,
      });

      poly.on('click', () => handleBarangayClick(b.name));
      poly.addTo(boundariesLayerGroupRef.current!);
      if (isSelected) {
        poly.bringToFront();
      }

      // Label
      if (showLabels) {
        const labelMarker = L.marker([b.latitude, b.longitude], {
          icon: createBarangayTextLabel(b.name, b.isUrban, riskLevel, isSelected),
          interactive: true,
          zIndexOffset: isSelected ? 1000 : 0,
        });
        labelMarker.on('click', () => handleBarangayClick(b.name));
        labelMarker.addTo(labelsLayerGroupRef.current!);
      }
    });
  }, [showBoundaries, showLabels, boundaryOpacity, authorizedBarangayName, allBarangayMetrics, handleBarangayClick, selectedBarangay, selectedBarangayFilter]);

  // 3. Render Heatmap Layer (Multi-layer soft radial gradient heatmap matching professional style)
  useEffect(() => {
    if (!heatmapLayerGroupRef.current) return;
    heatmapLayerGroupRef.current.clearLayers();

    if (!showHeatmap) return;

    heatmapData.points.forEach(pt => {
      const radius = Math.max(160, Math.min(750, pt.intensity * 700));
      const intensity = pt.intensity;

      // 1. Outer Halo (Teal/Green gradient layer)
      if (intensity >= 0.1) {
        L.circle([pt.lat, pt.lng], {
          radius: radius * 1.5,
          fillColor: '#10b981',
          fillOpacity: heatmapOpacity * 0.22,
          color: 'transparent',
          weight: 0,
        }).addTo(heatmapLayerGroupRef.current!);
      }

      // 2. Mid Transition (Yellow/Amber gradient layer)
      if (intensity >= 0.35) {
        L.circle([pt.lat, pt.lng], {
          radius: radius * 1.0,
          fillColor: '#eab308',
          fillOpacity: heatmapOpacity * 0.40,
          color: 'transparent',
          weight: 0,
        }).addTo(heatmapLayerGroupRef.current!);
      }

      // 3. Inner Hot Zone (Orange gradient layer)
      if (intensity >= 0.65) {
        L.circle([pt.lat, pt.lng], {
          radius: radius * 0.6,
          fillColor: '#f97316',
          fillOpacity: heatmapOpacity * 0.65,
          color: 'transparent',
          weight: 0,
        }).addTo(heatmapLayerGroupRef.current!);
      }

      // 4. Core Hotspot (Crimson Red gradient layer)
      if (intensity >= 0.85) {
        L.circle([pt.lat, pt.lng], {
          radius: radius * 0.3,
          fillColor: '#dc2626',
          fillOpacity: heatmapOpacity * 0.88,
          color: 'transparent',
          weight: 0,
        }).addTo(heatmapLayerGroupRef.current!);
      }
    });
  }, [showHeatmap, heatmapData, heatmapOpacity]);

  // Render Dropped Manual Pin Marker
  useEffect(() => {
    if (!droppedPinLayerRef.current) return;
    droppedPinLayerRef.current.clearLayers();

    if (!droppedPin) return;

    const pinIcon = L.divIcon({
      className: 'custom-manual-pin',
      html: `
        <div style="position: relative; transform: translate(-50%, -100%); display: flex; flex-direction: column; align-items: center; z-index: 1000;">
          <div style="background-color: #047857; color: white; width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 14px rgba(0,0,0,0.5); font-size: 18px;">
            📍
          </div>
          <div style="background: rgba(4, 120, 87, 0.95); color: white; font-weight: 700; font-size: 10px; padding: 2px 6px; border-radius: 6px; border: 1px solid white; white-space: nowrap; margin-top: 3px; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
            Dropped Pin (${droppedPin.lat.toFixed(4)}, ${droppedPin.lng.toFixed(4)})
          </div>
        </div>
      `,
      iconSize: [38, 52],
      iconAnchor: [19, 52],
    });

    const marker = L.marker([droppedPin.lat, droppedPin.lng], { icon: pinIcon });
    marker.bindPopup(`
      <div style="font-family: system-ui, sans-serif; min-width: 180px; color: #18181b;">
        <strong style="color: #047857; font-size: 13px;">📍 Manual GPS Pin Set</strong>
        <div style="font-size: 11px; margin-top: 4px;">
          <div>Barangay: <strong>${droppedPin.barangay}</strong></div>
          <div>Latitude: <strong>${droppedPin.lat}</strong></div>
          <div>Longitude: <strong>${droppedPin.lng}</strong></div>
        </div>
      </div>
    `);
    marker.addTo(droppedPinLayerRef.current);
  }, [droppedPin]);

  // 4. Render Swine Markers with "View Swine Record" Button
  useEffect(() => {
    if (!swinePinsLayerGroupRef.current) return;
    swinePinsLayerGroupRef.current.clearLayers();

    if (!showSwinePins) return;

    swineWithGps.forEach(swine => {
      const isReady = swine.readyToSell || swine.status === 'ready_to_sell';
      const marker = L.marker([swine.latitude, swine.longitude], {
        icon: createSwineMarkerIcon(isReady, swine.pigIdTag || swine.earTagNo || ''),
      });

      // Swine Info Popup
      const weightDisplay = swine.actualWeightKg
        ? `${swine.actualWeightKg} kg (Actual)`
        : swine.estimatedWeightKg || (swine.weightKg ? `${swine.weightKg} kg` : 'N/A');
      const statusBadge = isReady
        ? '<span style="background: #fef3c7; color: #92400e; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 10px;">READY FOR SALE</span>'
        : `<span style="background: #d1fae5; color: #065f46; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 10px; text-transform: uppercase;">${swine.status}</span>`;

      const dobVal = swine.birthDate || swine.dateOfBirth || swine.date_of_birth || swine.dob;
      const calculatedAge = calculateSwineAge(dobVal);
      const dobDisplay = formatDobDisplay(dobVal);
      const sexDisplay = swine.gender ? swine.gender.toUpperCase() : (swine.sex ? swine.sex.toUpperCase() : 'Not recorded');
      const breedDisplay = swine.breed || 'Standard Commercial';
      const swineIdDisplay = swine.registry_id || swine.pigIdTag || swine.earTagNo || 'N/A';

      const popupHtml = `
        <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 240px; color: #18181b;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e4e4e7; padding-bottom: 6px; margin-bottom: 8px;">
            <strong style="color: #065f46; font-size: 13px;">🐖 ${swineIdDisplay}</strong>
            ${statusBadge}
          </div>
          <div style="font-size: 11px; line-height: 1.6; margin-bottom: 10px;">
            <div><span style="color: #71717a;">Farmer:</span> <strong>${swine.farmerName}</strong></div>
            <div><span style="color: #71717a;">Barangay:</span> <strong>${swine.barangay}</strong></div>
            <div><span style="color: #71717a;">Breed:</span> <strong>${breedDisplay}</strong></div>
            <div><span style="color: #71717a;">Sex:</span> <strong>${sexDisplay}</strong></div>
            <div><span style="color: #71717a;">Date of Birth:</span> <strong>${dobDisplay}</strong></div>
            <div style="background: #ecfdf5; padding: 4px 6px; border-radius: 6px; margin: 4px 0; border: 1px solid #a7f3d0;">
              <span style="color: #065f46; font-weight: bold;">Age:</span>
              <strong style="color: #064e3b; margin-left: 4px;">${calculatedAge.display}</strong>
            </div>
            <div><span style="color: #71717a;">Weight:</span> <strong>${weightDisplay}</strong></div>
            <div><span style="color: #71717a;">Status:</span> <strong style="text-transform: uppercase;">${isReady ? 'Ready for Sale' : swine.status}</strong></div>
          </div>
          <button id="btn-view-swine-${swine.id}" style="width: 100%; background: #047857; color: white; border: none; border-radius: 8px; padding: 6px 10px; font-size: 11px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;">
            View Swine Record
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-view-swine-${swine.id}`);
        if (btn && onViewSwineRecord) {
          btn.onclick = () => {
            onViewSwineRecord(swine);
          };
        }
      });

      marker.on('click', () => {
        if (onSelectSwine) onSelectSwine(swine);
      });

      marker.addTo(swinePinsLayerGroupRef.current!);
    });
  }, [showSwinePins, swineWithGps, onViewSwineRecord, onSelectSwine]);

  // 5. Render Farmer Markers
  useEffect(() => {
    if (!farmerPinsLayerGroupRef.current) return;
    farmerPinsLayerGroupRef.current.clearLayers();

    if (!showFarmerPins) return;

    farmerMarkers.forEach(farmer => {
      const marker = L.marker([farmer.lat + 0.0002, farmer.lng + 0.0002], {
        icon: createFarmerMarkerIcon(farmer.farmerName),
      });

      const popupHtml = `
        <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 200px; color: #18181b;">
          <div style="border-bottom: 1px solid #e4e4e7; padding-bottom: 4px; margin-bottom: 6px;">
            <strong style="color: #2563eb; font-size: 13px;">👤 Registered Swine Farmer</strong>
          </div>
          <div style="font-size: 11px; line-height: 1.5;">
            <div><span style="color: #71717a;">Name:</span> <strong>${farmer.farmerName}</strong></div>
            <div><span style="color: #71717a;">Contact:</span> <strong>${farmer.contact}</strong></div>
            <div><span style="color: #71717a;">Barangay:</span> <strong>${farmer.barangay}</strong></div>
            <div><span style="color: #71717a;">Total Swine:</span> <strong style="color: #047857;">${farmer.swineCount} heads</strong></div>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.addTo(farmerPinsLayerGroupRef.current!);
    });
  }, [showFarmerPins, farmerMarkers]);

  // 6. Target Swine Focus when targetSwineId is passed
  useEffect(() => {
    if (!targetSwineId || !mapInstanceRef.current) return;
    const target = swineList.find(s => s.id === targetSwineId || s.pigIdTag === targetSwineId);
    if (!target) return;

    if (authorizedBarangayName && (target.barangay || '').toLowerCase() !== authorizedBarangayName.toLowerCase()) {
      setAccessWarning(`Access restricted. Swine ${target.pigIdTag || target.id} belongs to Barangay ${target.barangay}. You are assigned to Barangay ${authorizedBarangayName}.`);
      return;
    }

    if (target.latitude && target.longitude && target.latitude > 0 && target.longitude > 0) {
      mapInstanceRef.current.flyTo([target.latitude, target.longitude], 16, { duration: 1.2 });
    } else {
      const bg = HINUNANGAN_BARANGAYS.find(b => b.name.toLowerCase() === (target.barangay || '').toLowerCase());
      if (bg) {
        mapInstanceRef.current.flyTo([bg.latitude, bg.longitude], 14, { duration: 1 });
      }
    }
  }, [targetSwineId, swineList, authorizedBarangayName]);

  // 7. Reactive Synchronize and focus when selectedBarangay prop changes (e.g. Admin selects barangay in SwineForm)
  useEffect(() => {
    if (!selectedBarangay || selectedBarangay === 'all') return;
    setSelectedBarangayFilter(selectedBarangay);

    const metric = allBarangayMetrics.find(
      m => m.barangayName.toLowerCase() === selectedBarangay.toLowerCase()
    );
    if (metric) {
      setSelectedBarangayData(metric);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([metric.latitude, metric.longitude], 14, { duration: 1 });
      }
    } else {
      const bg = HINUNANGAN_BARANGAYS.find(
        b => b.name.toLowerCase() === selectedBarangay.toLowerCase()
      );
      if (bg && mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([bg.latitude, bg.longitude], 14, { duration: 1 });
      }
    }
  }, [selectedBarangay, allBarangayMetrics]);

  // 8. Reactive Synchronize map camera and pin when initialCenter coordinates change
  useEffect(() => {
    if (initialCenter && initialCenter[0] && initialCenter[1]) {
      const closest = findClosestBarangay(initialCenter[0], initialCenter[1]);
      setDroppedPin({
        lat: initialCenter[0],
        lng: initialCenter[1],
        barangay: closest.name,
      });
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([initialCenter[0], initialCenter[1]], 15, { duration: 0.8 });
      }
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

  return (
    <div className="relative w-full h-[640px] md:h-[720px] rounded-2xl overflow-hidden shadow-xl border border-stone-200 bg-stone-900 select-none">
      {/* Top Warning Banner for Access Control */}
      {accessWarning && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-rose-600/95 text-white px-5 py-2.5 rounded-xl shadow-2xl flex items-center gap-3 backdrop-blur-md border border-rose-300 animate-bounce text-sm font-semibold">
          <AlertTriangle className="w-5 h-5 text-amber-200 flex-shrink-0" />
          <span>{accessWarning}</span>
          <button onClick={() => setAccessWarning(null)} className="ml-2 hover:opacity-80 p-0.5 rounded cursor-pointer">
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
                      if (res.data.latitude && res.data.longitude && mapInstanceRef.current) {
                        mapInstanceRef.current.flyTo([res.data.latitude, res.data.longitude], 16);
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

        {/* Manual Pin Mode Toggle Button */}
        <button
          onClick={() => setIsManualPinMode(!isManualPinMode)}
          className={`px-3 py-1.5 rounded-xl border shadow-md backdrop-blur-md flex items-center gap-1.5 text-xs font-semibold transition cursor-pointer ${
            isManualPinMode
              ? 'bg-emerald-600 text-white border-emerald-500 ring-2 ring-emerald-400/30'
              : 'bg-stone-900/90 text-stone-200 border-stone-700 hover:bg-stone-800'
          }`}
          title="Enable Manual Pin Mode to click and drop custom GPS coordinates for swine registration"
        >
          <MapPin className={`w-3.5 h-3.5 ${isManualPinMode ? 'text-white' : 'text-emerald-400'}`} />
          <span>{isManualPinMode ? 'Pin Mode Active' : 'Manual Pin'}</span>
        </button>

        {/* Heatmap Checkbox & Toggle Button */}
        <label
          className={`px-2.5 py-1.5 rounded-xl border shadow-md backdrop-blur-md flex items-center gap-1.5 text-xs font-semibold transition cursor-pointer select-none ${
            showHeatmap
              ? 'bg-orange-600 text-white border-orange-500 ring-2 ring-orange-400/30'
              : 'bg-stone-900/90 text-stone-200 border-stone-700 hover:bg-stone-800'
          }`}
          title="Toggle Livestock Swine Density Heatmap Layer"
        >
          <input
            type="checkbox"
            checked={showHeatmap}
            onChange={e => setShowHeatmap(e.target.checked)}
            className="w-3.5 h-3.5 rounded accent-orange-500 cursor-pointer"
          />
          <Flame className={`w-3.5 h-3.5 ${showHeatmap ? 'text-white' : 'text-orange-400'}`} />
          <span className="hidden sm:inline">Heatmap</span>
        </label>

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
            onClick={() => setMapMode('street')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
              mapMode === 'street' ? 'bg-emerald-600 text-white' : 'text-stone-300 hover:text-white'
            }`}
          >
            Street
          </button>
          <button
            onClick={() => setMapMode('satellite')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
              mapMode === 'satellite' ? 'bg-emerald-600 text-white' : 'text-stone-300 hover:text-white'
            }`}
          >
            Satellite
          </button>
          <button
            onClick={() => setMapMode('terrain')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
              mapMode === 'terrain' ? 'bg-emerald-600 text-white' : 'text-stone-300 hover:text-white'
            }`}
          >
            Terrain
          </button>
        </div>

        {/* Switch to Google Map Button */}
        {onSwitchToGoogle && (
          <button
            onClick={onSwitchToGoogle}
            className="bg-stone-900/90 hover:bg-stone-800 text-stone-300 border border-stone-700 px-2.5 py-1.5 rounded-xl shadow-md backdrop-blur-md text-xs font-medium flex items-center gap-1 cursor-pointer transition"
            title="Switch to Google Maps Platform"
          >
            <MapPin className="w-3.5 h-3.5 text-red-400" />
            <span className="hidden md:inline">Google Maps</span>
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
              <option value="all">All Swine Types</option>
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

      {/* Manual Pin Mode Active Banner */}
      {isManualPinMode && (
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-30 bg-emerald-950/95 border border-emerald-500 text-white px-4 py-2 rounded-2xl shadow-2xl backdrop-blur-md text-xs flex items-center gap-2 animate-bounce">
          <MapPin className="w-4 h-4 text-emerald-300" />
          <span><strong>Manual Pin Mode Active:</strong> Click anywhere on the map to drop a custom GPS coordinate pin for swine registration.</span>
          <button onClick={() => setIsManualPinMode(false)} className="ml-2 text-emerald-300 hover:text-white font-bold cursor-pointer">×</button>
        </div>
      )}

      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-10" />

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
                <div className="pt-2 border-t border-stone-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider">
                      HEATMAP DENSITY RANGE ({heatmapMode.replace('_', ' ').toUpperCase()})
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-md bg-gradient-to-r from-[#10b981] via-[#facc15] via-[#fb923c] to-[#dc2626]" />
                  <div className="space-y-1 text-[10px] text-stone-300 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" /> Low Density
                      </span>
                      <strong className="text-emerald-400">
                        {heatmapData.minVal} – {Math.round(heatmapData.minVal + (heatmapData.maxVal - heatmapData.minVal) * 0.33)}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#facc15]" /> Medium Density
                      </span>
                      <strong className="text-yellow-400">
                        {Math.round(heatmapData.minVal + (heatmapData.maxVal - heatmapData.minVal) * 0.33) + 1} – {Math.round(heatmapData.minVal + (heatmapData.maxVal - heatmapData.minVal) * 0.66)}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#dc2626]" /> High Concentration
                      </span>
                      <strong className="text-red-400">
                        {Math.round(heatmapData.minVal + (heatmapData.maxVal - heatmapData.minVal) * 0.66) + 1} – {heatmapData.maxVal}
                      </strong>
                    </div>
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

// Error Boundary for Google Maps with seamless fallback to Leaflet Survey Map
interface GoogleMapErrorBoundaryProps {
  children: React.ReactNode;
  onFallback: () => void;
}

interface GoogleMapErrorBoundaryState {
  hasError: boolean;
}

class GoogleMapErrorBoundary extends React.Component<GoogleMapErrorBoundaryProps, GoogleMapErrorBoundaryState> {
  public override state: GoogleMapErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): GoogleMapErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: any) {
    console.warn('Google Maps error boundary caught error, switching to Leaflet:', error);
    this.props.onFallback();
  }

  override render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

export const GisMap: React.FC<GisMapProps> = props => {
  const [engine, setEngine] = useState<'google' | 'leaflet'>('google');

  if (engine === 'google') {
    return (
      <GoogleMapErrorBoundary onFallback={() => setEngine('leaflet')}>
        <GoogleGisMap {...props} onSwitchToLeaflet={() => setEngine('leaflet')} />
      </GoogleMapErrorBoundary>
    );
  }

  return <LeafletGisMap {...props} onSwitchToGoogle={() => setEngine('google')} />;
};

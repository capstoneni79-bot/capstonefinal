import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Layers,
  RotateCcw,
  Trash2,
  Sparkles,
  Navigation,
  CheckCircle,
  Ruler,
  Maximize2,
  Info,
  ShieldAlert,
} from 'lucide-react';
import {
  calculateDistanceMeters,
  calculatePerimeterKm,
  calculatePolygonAreaHectares,
  generateDefaultBoundary,
} from '../../utils/gisMeasure';
import { HINUNANGAN_BARANGAY_BOUNDARIES } from '../../data/hinunanganBoundariesGeoJSON';

interface BarangayBoundaryMapProps {
  centerLat: number;
  centerLng: number;
  onCenterChange: (lat: number, lng: number) => void;
  boundaryPolygon: [number, number][];
  onPolygonChange: (polygon: [number, number][]) => void;
  riskLevel: 'green' | 'yellow' | 'red';
  barangayName: string;
  surveillanceRadiusMeters?: number;
  onRadiusChange?: (meters: number) => void;
}

export const BarangayBoundaryMap: React.FC<BarangayBoundaryMapProps> = ({
  centerLat,
  centerLng,
  onCenterChange,
  boundaryPolygon,
  onPolygonChange,
  riskLevel,
  barangayName,
  surveillanceRadiusMeters = 500,
  onRadiusChange,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Layers and Markers Refs
  const centerMarkerRef = useRef<L.Marker | null>(null);
  const polygonLayerRef = useRef<L.Polygon | null>(null);
  const bufferCircleRef = useRef<L.Circle | null>(null);
  const vertexMarkersLayerRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Active Tool Mode
  const [toolMode, setToolMode] = useState<'boundary' | 'center' | 'ruler'>('boundary');
  const [basemap, setBasemap] = useState<'street' | 'satellite' | 'topo'>('street');
  const [showBuffer, setShowBuffer] = useState(true);
  const [rulerPoints, setRulerPoints] = useState<[number, number][]>([]);

  // Real-time measurements
  const perimeterKm = calculatePerimeterKm(boundaryPolygon);
  const areaHectares = calculatePolygonAreaHectares(boundaryPolygon);
  const areaSqKm = Number((areaHectares / 100).toFixed(3));

  // Risk Color Mapping
  const getRiskColor = () => {
    switch (riskLevel) {
      case 'red':
        return '#ef4444';
      case 'yellow':
        return '#f59e0b';
      case 'green':
      default:
        return '#10b981';
    }
  };

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const initialLat = centerLat || 10.4042;
    const initialLng = centerLng || 125.2017;

    const map = L.map(mapContainerRef.current, {
      center: L.latLng(initialLat, initialLng),
      zoom: 14,
      zoomControl: true,
    });

    // Default OSM tile
    const streetTile = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    tileLayerRef.current = streetTile;
    vertexMarkersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    // Invalidate size once rendered
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Switch Basemaps
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    mapInstanceRef.current.removeLayer(tileLayerRef.current);

    let url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    let attribution = '&copy; OpenStreetMap contributors';

    if (basemap === 'satellite') {
      url =
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      attribution = 'Tiles &copy; Esri &mdash; Satellite Imagery';
    } else if (basemap === 'topo') {
      url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}';
      attribution = 'Tiles &copy; Esri Topo &mdash; Topography';
    }

    const newLayer = L.tileLayer(url, { attribution, maxZoom: 19 }).addTo(mapInstanceRef.current);
    tileLayerRef.current = newLayer;
    mapInstanceRef.current.invalidateSize();
  }, [basemap]);

  // 3. Update Center Pin & Buffer
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const color = getRiskColor();

    // Center Marker
    if (!centerMarkerRef.current) {
      const centerPinIcon = L.divIcon({
        className: 'custom-barangay-center-icon',
        html: `
          <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 30px; height: 30px; background-color: ${color}; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2.5px solid white; box-shadow: 0 3px 6px rgba(0,0,0,0.4);"></div>
            <div style="position: relative; z-index: 2; font-size: 15px; margin-top: -4px;">🏛️</div>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 34],
      });

      centerMarkerRef.current = L.marker([centerLat, centerLng], {
        icon: centerPinIcon,
        draggable: true,
      }).addTo(map);

      centerMarkerRef.current.on('dragend', (e: any) => {
        const pos = e.target.getLatLng();
        onCenterChange(Number(pos.lat.toFixed(6)), Number(pos.lng.toFixed(6)));
      });
    } else {
      centerMarkerRef.current.setLatLng([centerLat, centerLng]);
    }

    // Buffer circle
    if (showBuffer && surveillanceRadiusMeters > 0) {
      if (!bufferCircleRef.current) {
        bufferCircleRef.current = L.circle([centerLat, centerLng], {
          radius: surveillanceRadiusMeters,
          color: color,
          fillColor: color,
          fillOpacity: 0.08,
          weight: 1.5,
          dashArray: '6, 6',
        }).addTo(map);
      } else {
        bufferCircleRef.current.setLatLng([centerLat, centerLng]);
        bufferCircleRef.current.setRadius(surveillanceRadiusMeters);
        bufferCircleRef.current.setStyle({ color: color, fillColor: color });
      }
    } else if (bufferCircleRef.current) {
      map.removeLayer(bufferCircleRef.current);
      bufferCircleRef.current = null;
    }
  }, [centerLat, centerLng, riskLevel, showBuffer, surveillanceRadiusMeters]);

  // 4. Update Boundary Polygon & Vertex Handles
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const color = getRiskColor();

    // Remove existing polygon
    if (polygonLayerRef.current) {
      map.removeLayer(polygonLayerRef.current);
      polygonLayerRef.current = null;
    }

    // Clear vertex markers
    if (vertexMarkersLayerRef.current) {
      vertexMarkersLayerRef.current.clearLayers();
    }

    if (boundaryPolygon && boundaryPolygon.length >= 2) {
      // Draw Polygon or Polyline
      const latLngs = boundaryPolygon.map(p => L.latLng(p[0], p[1]));

      polygonLayerRef.current = L.polygon(latLngs, {
        color: color,
        weight: 2.5,
        fillColor: color,
        fillOpacity: 0.18,
        dashArray: boundaryPolygon.length >= 3 ? undefined : '5, 5',
      }).addTo(map);

      // Add clickable / draggable vertex handles
      boundaryPolygon.forEach((point, idx) => {
        const vertexIcon = L.divIcon({
          className: 'boundary-vertex-icon',
          html: `
            <div style="background: white; border: 2px solid ${color}; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: bold; color: #1c1917; box-shadow: 0 1px 4px rgba(0,0,0,0.35);">
              ${idx + 1}
            </div>
          `,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        });

        const vMarker = L.marker([point[0], point[1]], {
          icon: vertexIcon,
          draggable: true,
        });

        // Dragging moves this specific vertex
        vMarker.on('dragend', (e: any) => {
          const newPos = e.target.getLatLng();
          const updated = [...boundaryPolygon];
          updated[idx] = [Number(newPos.lat.toFixed(6)), Number(newPos.lng.toFixed(6))];
          onPolygonChange(updated);
        });

        // Clicking vertex removes it
        vMarker.on('click', () => {
          if (boundaryPolygon.length > 3) {
            const updated = boundaryPolygon.filter((_, i) => i !== idx);
            onPolygonChange(updated);
          }
        });

        vMarker.bindTooltip(
          `Vertex #${idx + 1}<br/>Drag to move • Click to delete<br/><span class="text-[10px] font-mono">${point[0].toFixed(4)}, ${point[1].toFixed(4)}</span>`,
          { direction: 'top' }
        );

        vertexMarkersLayerRef.current?.addLayer(vMarker);
      });
    }
  }, [boundaryPolygon, riskLevel]);

  // 5. Handle Map Click Event depending on active tool mode
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    const onMapClick = (e: L.LeafletMouseEvent) => {
      const clickedLat = Number(e.latlng.lat.toFixed(6));
      const clickedLng = Number(e.latlng.lng.toFixed(6));

      if (toolMode === 'center') {
        onCenterChange(clickedLat, clickedLng);
      } else if (toolMode === 'boundary') {
        // Append point to boundary polygon
        const updated = [...boundaryPolygon, [clickedLat, clickedLng] as [number, number]];
        onPolygonChange(updated);
      } else if (toolMode === 'ruler') {
        if (rulerPoints.length === 0 || rulerPoints.length >= 2) {
          setRulerPoints([[clickedLat, clickedLng]]);
        } else {
          setRulerPoints([...rulerPoints, [clickedLat, clickedLng]]);
        }
      }
    };

    map.on('click', onMapClick);
    return () => {
      map.off('click', onMapClick);
    };
  }, [toolMode, boundaryPolygon, rulerPoints, onCenterChange, onPolygonChange]);

  // Action handlers
  const handleUndoPoint = () => {
    if (boundaryPolygon.length > 0) {
      onPolygonChange(boundaryPolygon.slice(0, -1));
    }
  };

  const handleClearBoundary = () => {
    if (window.confirm('Clear all plotted boundary points for this barangay?')) {
      onPolygonChange([]);
    }
  };

  const handleAutoGenerateBoundary = () => {
    const official = HINUNANGAN_BARANGAY_BOUNDARIES[barangayName];
    const generated =
      official && official.length >= 3
        ? official
        : generateDefaultBoundary(centerLat, centerLng, 0.85, 7);
    onPolygonChange(generated);

    // Zoom and pan to encompass the generated polygon
    if (mapInstanceRef.current && generated.length > 0) {
      const bounds = L.latLngBounds(generated.map(p => L.latLng(p[0], p[1])));
      mapInstanceRef.current.fitBounds(bounds, { padding: [30, 30] });
    }
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        onCenterChange(lat, lng);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lng], 15);
        }
      },
      err => {
        alert('Could not acquire device GPS: ' + err.message);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleFitBoundary = () => {
    if (!mapInstanceRef.current) return;
    if (boundaryPolygon && boundaryPolygon.length >= 2) {
      const bounds = L.latLngBounds(boundaryPolygon.map(p => L.latLng(p[0], p[1])));
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40] });
    } else {
      mapInstanceRef.current.setView([centerLat, centerLng], 14);
    }
  };

  return (
    <div className="space-y-3">
      {/* Top Map Toolbar & Basemap Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-stone-50 p-2.5 rounded-xl border border-stone-200">
        {/* Tool Mode Tabs */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-stone-200 shadow-2xs">
          <button
            type="button"
            onClick={() => setToolMode('boundary')}
            className={`px-3 py-1.5 rounded-md font-bold text-xs flex items-center gap-1.5 transition cursor-pointer ${
              toolMode === 'boundary'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            <span>Plot & Measure Boundary</span>
          </button>

          <button
            type="button"
            onClick={() => setToolMode('center')}
            className={`px-3 py-1.5 rounded-md font-bold text-xs flex items-center gap-1.5 transition cursor-pointer ${
              toolMode === 'center'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-amber-300" />
            <span>Pin Barangay Hall / Center</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setToolMode('ruler');
              setRulerPoints([]);
            }}
            className={`px-3 py-1.5 rounded-md font-bold text-xs flex items-center gap-1.5 transition cursor-pointer ${
              toolMode === 'ruler'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <Ruler className="w-3.5 h-3.5" />
            <span>Ruler Distance</span>
          </button>
        </div>

        {/* Basemap switcher & Utilities */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center bg-white rounded-lg border border-stone-200 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setBasemap('street')}
              className={`px-2 py-1 rounded text-[11px] font-semibold cursor-pointer ${
                basemap === 'street' ? 'bg-stone-800 text-white' : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              Street
            </button>
            <button
              type="button"
              onClick={() => setBasemap('satellite')}
              className={`px-2 py-1 rounded text-[11px] font-semibold cursor-pointer ${
                basemap === 'satellite' ? 'bg-stone-800 text-white' : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              Satellite
            </button>
            <button
              type="button"
              onClick={() => setBasemap('topo')}
              className={`px-2 py-1 rounded text-[11px] font-semibold cursor-pointer ${
                basemap === 'topo' ? 'bg-stone-800 text-white' : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              Topo
            </button>
          </div>

          <button
            type="button"
            onClick={handleLocateMe}
            className="p-1.5 bg-white hover:bg-stone-100 border border-stone-200 rounded-lg text-stone-700 cursor-pointer shadow-2xs"
            title="Locate via device GPS"
          >
            <Navigation className="w-3.5 h-3.5 text-blue-600" />
          </button>

          <button
            type="button"
            onClick={handleFitBoundary}
            className="p-1.5 bg-white hover:bg-stone-100 border border-stone-200 rounded-lg text-stone-700 cursor-pointer shadow-2xs"
            title="Fit boundary to viewport"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Live Measurement HUD Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-emerald-950 text-white p-2.5 rounded-xl border border-emerald-800/80 shadow-xs">
          <div className="text-[10px] text-emerald-300 uppercase tracking-wider font-bold">
            Enclosed Land Area
          </div>
          <div className="text-base font-black text-emerald-100">
            {areaHectares > 0 ? `${areaHectares} ha` : '0 ha'}
          </div>
          <div className="text-[10px] text-emerald-400/80 font-mono">
            {areaSqKm > 0 ? `(${areaSqKm} km²)` : 'Plot ≥3 points'}
          </div>
        </div>

        <div className="bg-white p-2.5 rounded-xl border border-stone-200 shadow-xs">
          <div className="text-[10px] text-stone-500 uppercase tracking-wider font-bold">
            Boundary Perimeter
          </div>
          <div className="text-base font-black text-stone-900">
            {perimeterKm > 0 ? `${perimeterKm} km` : '0.00 km'}
          </div>
          <div className="text-[10px] text-stone-500">
            {boundaryPolygon.length} vertex points
          </div>
        </div>

        <div className="bg-white p-2.5 rounded-xl border border-stone-200 shadow-xs">
          <div className="text-[10px] text-stone-500 uppercase tracking-wider font-bold">
            Barangay Center GPS
          </div>
          <div className="text-xs font-mono font-bold text-stone-900 truncate">
            {centerLat.toFixed(4)}°N, {centerLng.toFixed(4)}°E
          </div>
          <div className="text-[10px] text-stone-500 truncate">
            {barangayName || 'Hinunangan'}
          </div>
        </div>

        <div className="bg-white p-2.5 rounded-xl border border-stone-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-stone-500 uppercase tracking-wider font-bold">
              Surveillance Buffer
            </span>
            <input
              type="checkbox"
              checked={showBuffer}
              onChange={e => setShowBuffer(e.target.checked)}
              className="accent-emerald-700 cursor-pointer"
            />
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <select
              value={surveillanceRadiusMeters}
              onChange={e => onRadiusChange?.(Number(e.target.value))}
              className="w-full text-xs font-bold py-1 px-1.5 bg-stone-50 rounded border border-stone-200"
            >
              <option value={300}>300 m Radius</option>
              <option value={500}>500 m Radius</option>
              <option value={1000}>1.0 km Buffer</option>
              <option value={2000}>2.0 km Buffer</option>
            </select>
          </div>
        </div>
      </div>

      {/* Map Canvas */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-stone-300 shadow-inner">
        <div ref={mapContainerRef} className="h-[380px] w-full z-0" />

        {/* Live Instruction Banner Overlay */}
        <div className="absolute top-2 left-2 right-2 z-10 pointer-events-none">
          <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-stone-200 shadow-md text-xs text-stone-800 flex items-center justify-between pointer-events-auto">
            <div className="flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span>
                {toolMode === 'boundary'
                  ? 'Click anywhere on the map to add boundary points. Drag pins to adjust shape. Click a vertex to remove it.'
                  : toolMode === 'center'
                  ? 'Click on the map or drag the 🏛️ marker to pinpoint the Barangay Hall / Official Center.'
                  : 'Click two points on the map to measure linear distance.'}
              </span>
            </div>

            {boundaryPolygon.length >= 3 && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                <CheckCircle className="w-3 h-3 text-emerald-700" /> Polygon Closed
              </span>
            )}
          </div>
        </div>

        {/* Ruler Distance Display Overlay */}
        {toolMode === 'ruler' && rulerPoints.length === 2 && (
          <div className="absolute bottom-3 left-3 z-10 bg-stone-900/90 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2">
            <Ruler className="w-4 h-4 text-amber-400" />
            <span>
              Linear Distance:{' '}
              {(calculateDistanceMeters(
                rulerPoints[0][0],
                rulerPoints[0][1],
                rulerPoints[1][0],
                rulerPoints[1][1]
              ) / 1000).toFixed(2)}{' '}
              km
            </span>
          </div>
        )}
      </div>

      {/* Bottom Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAutoGenerateBoundary}
            className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
            title="Auto-generate a 7-point perimeter boundary around current center"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Auto-Generate Sample Boundary</span>
          </button>

          {boundaryPolygon.length > 0 && (
            <>
              <button
                type="button"
                onClick={handleUndoPoint}
                className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Undo Point</span>
              </button>

              <button
                type="button"
                onClick={handleClearBoundary}
                className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Points</span>
              </button>
            </>
          )}
        </div>

        <div className="text-[11px] text-stone-500 italic">
          * Boundary coordinates and measured area will be saved directly with this Barangay record.
        </div>
      </div>
    </div>
  );
};
